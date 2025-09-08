import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const authorId = searchParams.get('authorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sortBy = searchParams.get('sortBy') || 'created_at'; // created_at, like_count
    const sortOrder = searchParams.get('sortOrder') || 'ASC';
    const parentPostId = searchParams.get('parentPostId');
    const includeReplies = searchParams.get('includeReplies') === 'true';

    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (threadId) {
      whereConditions.push(`fp.thread_id = $${paramCounter}`);
      queryParams.push(threadId);
      paramCounter++;
    }

    if (authorId) {
      whereConditions.push(`fp.author_id = $${paramCounter}`);
      queryParams.push(authorId);
      paramCounter++;
    }

    if (parentPostId) {
      whereConditions.push(`fp.parent_post_id = $${paramCounter}`);
      queryParams.push(parentPostId);
      paramCounter++;
    } else if (!includeReplies) {
      whereConditions.push(`fp.parent_post_id IS NULL`);
    }

    const validSortColumns = ['created_at', 'like_count', 'updated_at'];
    const validSortOrder = ['ASC', 'DESC'];
    const actualSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const actualSortOrder = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    const postsQuery = `
      SELECT 
        fp.*,
        u.username as author_username,
        u.first_name as author_first_name,
        u.last_name as author_last_name,
        u.avatar_url as author_avatar_url,
        eu.username as edited_by_username,
        eu.first_name as edited_by_first_name,
        eu.last_name as edited_by_last_name,
        ft.title as thread_title,
        fc.name as category_name,
        (SELECT COUNT(*) FROM forum_posts replies WHERE replies.parent_post_id = fp.id) as reply_count,
        COALESCE(reactions.reaction_summary, '[]'::jsonb) as reactions
      FROM forum_posts fp
      JOIN users u ON fp.author_id = u.id
      JOIN forum_threads ft ON fp.thread_id = ft.id
      JOIN forum_categories fc ON ft.category_id = fc.id
      LEFT JOIN users eu ON fp.last_edited_by = eu.id
      LEFT JOIN (
        SELECT 
          post_id,
          jsonb_agg(jsonb_build_object('type', reaction_type, 'count', reaction_count)) as reaction_summary
        FROM (
          SELECT 
            post_id,
            reaction_type,
            COUNT(*) as reaction_count
          FROM forum_post_reactions
          GROUP BY post_id, reaction_type
        ) reaction_counts
        GROUP BY post_id
      ) reactions ON fp.id = reactions.post_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY fp.${actualSortBy} ${actualSortOrder}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM forum_posts fp
      WHERE ${whereConditions.join(' AND ')}
    `;

    const [postsResult, countResult] = await Promise.all([
      pool.query(postsQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // If including replies, fetch replies for each post
    let postsWithReplies = postsResult.rows;
    if (includeReplies && threadId) {
      const postIds = postsResult.rows.map(post => post.id);
      if (postIds.length > 0) {
        const repliesQuery = `
          SELECT 
            fp.*,
            u.username as author_username,
            u.first_name as author_first_name,
            u.last_name as author_last_name,
            u.avatar_url as author_avatar_url
          FROM forum_posts fp
          JOIN users u ON fp.author_id = u.id
          WHERE fp.parent_post_id = ANY($1)
          ORDER BY fp.created_at ASC
        `;

        const repliesResult = await pool.query(repliesQuery, [postIds]);
        const repliesByParent = repliesResult.rows.reduce((acc: any, reply) => {
          if (!acc[reply.parent_post_id]) {
            acc[reply.parent_post_id] = [];
          }
          acc[reply.parent_post_id].push(reply);
          return acc;
        }, {});

        postsWithReplies = postsResult.rows.map(post => ({
          ...post,
          replies: repliesByParent[post.id] || []
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        posts: postsWithReplies,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forum posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      threadId,
      parentPostId,
      content,
      authorId,
      isSolution = false
    } = body;

    // Validate required fields
    if (!threadId || !content || !authorId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID, content, and author ID are required' },
        { status: 400 }
      );
    }

    // Check if thread exists and is not locked
    const threadCheck = await pool.query(
      'SELECT is_locked FROM forum_threads WHERE id = $1',
      [threadId]
    );

    if (threadCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Thread not found' },
        { status: 404 }
      );
    }

    if (threadCheck.rows[0].is_locked) {
      return NextResponse.json(
        { success: false, error: 'Thread is locked' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert post
      const postQuery = `
        INSERT INTO forum_posts (thread_id, parent_post_id, content, author_id, is_solution)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const postResult = await client.query(postQuery, [
        threadId, parentPostId, content, authorId, isSolution
      ]);

      const post = postResult.rows[0];

      // If this is a solution, remove solution status from other posts in the thread
      if (isSolution) {
        await client.query(
          'UPDATE forum_posts SET is_solution = false WHERE thread_id = $1 AND id != $2',
          [threadId, post.id]
        );
      }

      await client.query('COMMIT');

      // Fetch complete post data
      const completePostQuery = `
        SELECT 
          fp.*,
          u.username as author_username,
          u.first_name as author_first_name,
          u.last_name as author_last_name,
          u.avatar_url as author_avatar_url
        FROM forum_posts fp
        JOIN users u ON fp.author_id = u.id
        WHERE fp.id = $1
      `;

      const completeResult = await client.query(completePostQuery, [post.id]);

      return NextResponse.json({
        success: true,
        data: completeResult.rows[0]
      }, { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating forum post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create forum post' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      content, 
      isSolution,
      editedBy
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if post exists
      const postCheck = await pool.query(
        'SELECT thread_id FROM forum_posts WHERE id = $1',
        [id]
      );

      if (postCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        );
      }

      const threadId = postCheck.rows[0].thread_id;

      // Update post
      const updateQuery = `
        UPDATE forum_posts 
        SET 
          content = COALESCE($2, content),
          is_solution = COALESCE($3, is_solution),
          edit_count = edit_count + 1,
          last_edited_at = CURRENT_TIMESTAMP,
          last_edited_by = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        id, content, isSolution, editedBy
      ]);

      // If this is marked as solution, remove solution status from other posts
      if (isSolution === true) {
        await client.query(
          'UPDATE forum_posts SET is_solution = false WHERE thread_id = $1 AND id != $2',
          [threadId, id]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating forum post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update forum post' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get post info before deletion
      const postResult = await client.query(
        'SELECT thread_id, author_id FROM forum_posts WHERE id = $1',
        [id]
      );

      if (postResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        );
      }

      const { thread_id, author_id } = postResult.rows[0];

      // Delete post (cascades to reactions and other related data)
      await client.query('DELETE FROM forum_posts WHERE id = $1', [id]);

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting forum post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete forum post' },
      { status: 500 }
    );
  }
}