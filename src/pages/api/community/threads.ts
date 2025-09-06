import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schemas
const createThreadSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isTradeDiscussion: z.boolean().optional(),
  isWaiverDiscussion: z.boolean().optional(),
  isPlayerDiscussion: z.boolean().optional(),
  relatedPlayerId: z.number().int().optional(),
  relatedTeamName: z.string().max(50).optional(),
  fantasyWeek: z.number().int().min(1).max(18).optional()
});

const updateThreadSchema = createThreadSchema.partial().omit(['categoryId']);

interface ExtendedNextApiRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

function hasPermission(userRole: string | undefined, requiredRole: string): boolean {
  const roleHierarchy = { admin: 3, premium: 2, member: 1 };
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 1;
  return userLevel >= requiredLevel;
}

export default async function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  const supabase = createClient();

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetThreads(req, res, supabase);
      case 'POST':
        return await handleCreateThread(req, res, supabase);
      case 'PUT':
        return await handleUpdateThread(req, res, supabase);
      case 'DELETE':
        return await handleDeleteThread(req, res, supabase);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Threads API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}

async function handleGetThreads(
  req: ExtendedNextApiRequest,
  res: NextApiResponse,
  supabase: any
) {
  const { 
    category, 
    recent = 'false', 
    pinned = 'false', 
    limit = '20', 
    offset = '0',
    search,
    tag,
    playerId,
    fantasyWeek,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  let query = supabase
    .from('forum_threads')
    .select(`
      id,
      title,
      slug,
      content,
      is_pinned,
      is_locked,
      is_announcement,
      view_count,
      reply_count,
      like_count,
      dislike_count,
      created_at,
      updated_at,
      last_post_at,
      is_trade_discussion,
      is_waiver_discussion,
      is_player_discussion,
      related_player_id,
      related_team_name,
      fantasy_week,
      author:users!forum_threads_author_id_fkey(
        id,
        email,
        full_name
      ),
      category:forum_categories!forum_threads_category_id_fkey(
        id,
        name,
        slug,
        color
      ),
      last_post_user:users!forum_threads_last_post_user_id_fkey(
        id,
        email,
        full_name
      )
    `);

  // Apply filters
  if (category) {
    if (typeof category === 'string') {
      // Check if it's a UUID or slug
      if (category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        query = query.eq('category_id', category);
      } else {
        // Join with categories to filter by slug
        const { data: categoryData } = await supabase
          .from('forum_categories')
          .select('id')
          .eq('slug', category)
          .single();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        } else {
          return res.status(404).json({ error: 'Category not found' });
        }
      }
    }
  }

  if (pinned === 'true') {
    query = query.eq('is_pinned', true);
  }

  if (playerId && typeof playerId === 'string') {
    query = query.eq('related_player_id', parseInt(playerId));
  }

  if (fantasyWeek && typeof fantasyWeek === 'string') {
    query = query.eq('fantasy_week', parseInt(fantasyWeek));
  }

  // Handle search
  if (search && typeof search === 'string') {
    // Use the search index for better performance
    const { data: searchResults } = await supabase
      .from('forum_search_index')
      .select('content_id')
      .eq('content_type', 'thread')
      .textSearch('search_vector', search.trim().replace(/\s+/g, ' & '))
      .limit(parseInt(limit as string));

    if (searchResults && searchResults.length > 0) {
      const threadIds = searchResults.map(r => r.content_id);
      query = query.in('id', threadIds);
    } else {
      // No search results, return empty
      return res.status(200).json({ threads: [], total: 0 });
    }
  }

  // Apply sorting
  const validSortFields = ['created_at', 'updated_at', 'last_post_at', 'view_count', 'reply_count', 'like_count'];
  const validSortOrder = ['asc', 'desc'];
  
  if (validSortFields.includes(sortBy as string) && validSortOrder.includes(sortOrder as string)) {
    if (pinned !== 'true') {
      // Always show pinned threads first (unless specifically filtering for pinned only)
      query = query.order('is_pinned', { ascending: false });
    }
    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });
  } else {
    query = query.order('is_pinned', { ascending: false });
    query = query.order('created_at', { ascending: false });
  }

  // Apply pagination
  const limitNum = Math.min(parseInt(limit as string), 100);
  const offsetNum = Math.max(parseInt(offset as string), 0);
  
  query = query.range(offsetNum, offsetNum + limitNum - 1);

  const { data: threads, error, count } = await query;

  if (error) {
    console.error('Failed to fetch threads:', error);
    return res.status(500).json({ error: 'Failed to fetch threads' });
  }

  // Get tags for threads
  if (threads && threads.length > 0) {
    const threadIds = threads.map(t => t.id);
    const { data: threadTags } = await supabase
      .from('forum_thread_tags')
      .select(`
        thread_id,
        tag:forum_tags!forum_thread_tags_tag_id_fkey(
          id,
          name,
          slug,
          color
        )
      `)
      .in('thread_id', threadIds);

    // Group tags by thread
    const tagsByThread = threadTags?.reduce((acc, tt) => {
      if (!acc[tt.thread_id]) acc[tt.thread_id] = [];
      acc[tt.thread_id].push(tt.tag);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Add tags to threads
    const threadsWithTags = threads.map(thread => ({
      ...thread,
      tags: tagsByThread[thread.id] || [],
      authorName: thread.author?.full_name || thread.author?.email || 'Unknown',
      categoryName: thread.category?.name,
      categorySlug: thread.category?.slug,
      categoryColor: thread.category?.color,
      lastPostAuthor: thread.last_post_user?.full_name || thread.last_post_user?.email
    }));

    return res.status(200).json({ 
      threads: threadsWithTags, 
      total: count,
      hasMore: count ? offsetNum + limitNum < count : false
    });
  }

  return res.status(200).json({ threads: [], total: 0, hasMore: false });
}

async function handleCreateThread(
  req: ExtendedNextApiRequest,
  res: NextApiResponse,
  supabase: any
) {
  // Check authentication
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Validate request body
  const validation = createThreadSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Invalid request data',
      details: validation.error.errors
    });
  }

  const { 
    categoryId, 
    title, 
    content, 
    tags = [],
    isTradeDiscussion,
    isWaiverDiscussion,
    isPlayerDiscussion,
    relatedPlayerId,
    relatedTeamName,
    fantasyWeek
  } = validation.data;

  // Verify category exists and user has permission
  const { data: category, error: categoryError } = await supabase
    .from('forum_categories')
    .select('id, is_private, required_role')
    .eq('id', categoryId)
    .single();

  if (categoryError || !category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  if (category.is_private && category.required_role && !hasPermission(req.user.role, category.required_role)) {
    return res.status(403).json({ error: 'Insufficient permissions for this category' });
  }

  // Generate unique slug
  let slug = generateSlug(title);
  let slugCounter = 1;
  
  while (true) {
    const { data: existingThread } = await supabase
      .from('forum_threads')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!existingThread) break;
    
    slug = `${generateSlug(title)}-${slugCounter}`;
    slugCounter++;
  }

  // Create thread
  const { data: newThread, error } = await supabase
    .from('forum_threads')
    .insert([{
      category_id: categoryId,
      title,
      slug,
      content,
      author_id: req.user.id,
      is_trade_discussion: isTradeDiscussion || false,
      is_waiver_discussion: isWaiverDiscussion || false,
      is_player_discussion: isPlayerDiscussion || false,
      related_player_id: relatedPlayerId,
      related_team_name: relatedTeamName,
      fantasy_week: fantasyWeek,
      last_post_at: new Date().toISOString(),
      last_post_user_id: req.user.id
    }])
    .select(`
      id,
      title,
      slug,
      content,
      created_at,
      author:users!forum_threads_author_id_fkey(
        id,
        email,
        full_name
      ),
      category:forum_categories!forum_threads_category_id_fkey(
        id,
        name,
        slug
      )
    `)
    .single();

  if (error) {
    console.error('Failed to create thread:', error);
    return res.status(500).json({ error: 'Failed to create thread' });
  }

  // Add tags if provided
  if (tags.length > 0) {
    // Get or create tags
    const tagPromises = tags.map(async (tagName) => {
      const tagSlug = generateSlug(tagName);
      
      // Try to get existing tag
      let { data: tag } = await supabase
        .from('forum_tags')
        .select('id')
        .eq('slug', tagSlug)
        .single();

      if (!tag) {
        // Create new tag
        const { data: newTag } = await supabase
          .from('forum_tags')
          .insert([{
            name: tagName,
            slug: tagSlug,
            usage_count: 1
          }])
          .select('id')
          .single();
        
        tag = newTag;
      } else {
        // Increment usage count
        await supabase
          .from('forum_tags')
          .update({ usage_count: supabase.raw('usage_count + 1') })
          .eq('id', tag.id);
      }

      return tag?.id;
    });

    const tagIds = (await Promise.all(tagPromises)).filter(Boolean);

    if (tagIds.length > 0) {
      await supabase
        .from('forum_thread_tags')
        .insert(tagIds.map(tagId => ({
          thread_id: newThread.id,
          tag_id: tagId
        })));
    }
  }

  // Update category thread count
  await supabase
    .from('forum_categories')
    .update({ 
      thread_count: supabase.raw('thread_count + 1'),
      last_activity_at: new Date().toISOString()
    })
    .eq('id', categoryId);

  // Update user stats
  await supabase
    .from('forum_user_stats')
    .insert([{
      user_id: req.user.id,
      thread_count: 1
    }])
    .on_conflict('user_id')
    .merge({
      thread_count: supabase.raw('thread_count + 1'),
      last_active_at: new Date().toISOString()
    });

  return res.status(201).json({ thread: newThread });
}

async function handleUpdateThread(
  req: ExtendedNextApiRequest,
  res: NextApiResponse,
  supabase: any
) {
  // Check authentication
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Thread ID is required' });
  }

  // Get existing thread
  const { data: existingThread, error: fetchError } = await supabase
    .from('forum_threads')
    .select('id, author_id, title, slug')
    .eq('id', id)
    .single();

  if (fetchError || !existingThread) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  // Check permissions (author or admin)
  if (existingThread.author_id !== req.user.id && !hasPermission(req.user.role, 'admin')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  // Validate request body
  const validation = updateThreadSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Invalid request data',
      details: validation.error.errors
    });
  }

  const updateData = validation.data;

  // Generate new slug if title is being updated
  if (updateData.title && updateData.title !== existingThread.title) {
    let slug = generateSlug(updateData.title);
    let slugCounter = 1;
    
    while (true) {
      const { data: existingSlugThread } = await supabase
        .from('forum_threads')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();

      if (!existingSlugThread) break;
      
      slug = `${generateSlug(updateData.title)}-${slugCounter}`;
      slugCounter++;
    }

    updateData.slug = slug;
  }

  // Update thread
  const { data: updatedThread, error } = await supabase
    .from('forum_threads')
    .update(updateData)
    .eq('id', id)
    .select(`
      id,
      title,
      slug,
      content,
      updated_at,
      author:users!forum_threads_author_id_fkey(
        id,
        email,
        full_name
      ),
      category:forum_categories!forum_threads_category_id_fkey(
        id,
        name,
        slug
      )
    `)
    .single();

  if (error) {
    console.error('Failed to update thread:', error);
    return res.status(500).json({ error: 'Failed to update thread' });
  }

  return res.status(200).json({ thread: updatedThread });
}

async function handleDeleteThread(
  req: ExtendedNextApiRequest,
  res: NextApiResponse,
  supabase: any
) {
  // Check authentication
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Thread ID is required' });
  }

  // Get existing thread
  const { data: existingThread, error: fetchError } = await supabase
    .from('forum_threads')
    .select('id, author_id, category_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingThread) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  // Check permissions (author or admin)
  if (existingThread.author_id !== req.user.id && !hasPermission(req.user.role, 'admin')) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  // Delete thread (cascade will handle posts, tags, etc.)
  const { error } = await supabase
    .from('forum_threads')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete thread:', error);
    return res.status(500).json({ error: 'Failed to delete thread' });
  }

  // Update category thread count
  await supabase
    .from('forum_categories')
    .update({ 
      thread_count: supabase.raw('GREATEST(thread_count - 1, 0)')
    })
    .eq('id', existingThread.category_id);

  // Update user stats
  await supabase
    .from('forum_user_stats')
    .update({
      thread_count: supabase.raw('GREATEST(thread_count - 1, 0)')
    })
    .eq('user_id', existingThread.author_id);

  return res.status(200).json({ message: 'Thread deleted successfully' });
}