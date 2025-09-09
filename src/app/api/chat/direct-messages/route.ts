/**
 * Direct Messages API Endpoint
 * Handles private messaging between league members
 */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';
import { verifyJWT } from '@/lib/auth/jwt-config';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyJWT(token) as any;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (conversationId) {
      // Get messages for specific conversation
      const result = await database.query(`
        SELECT dm.id, dm.sender_id as senderId, u1.username as senderUsername,
               dm.recipient_id as recipientId, u2.username as recipientUsername,
               dm.content, dm.message_type as messageType, dm.gif_url as gifUrl,
               dm.file_url as fileUrl, dm.file_name as fileName, dm.is_read as isRead,
               dm.created_at as createdAt, dm.edited_at as editedAt
        FROM direct_messages dm
        JOIN users u1 ON dm.sender_id = u1.id
        JOIN users u2 ON dm.recipient_id = u2.id
        WHERE (dm.sender_id = $1 AND dm.recipient_id = $2) 
           OR (dm.sender_id = $2 AND dm.recipient_id = $1)
        ORDER BY dm.created_at DESC
        LIMIT $3
      `, [decoded.userId, conversationId, limit]);

      const messages = result.rows.reverse(); // Return in chronological order

      // Get reactions for each message
      for (const message of messages) {
        const reactionsResult = await database.query(`
          SELECT dmr.emoji, u.id as userId, u.username
          FROM dm_reactions dmr
          JOIN users u ON dmr.user_id = u.id
          WHERE dmr.message_id = $1
          ORDER BY dmr.created_at
        `, [message.id]);

        const reactions: any = {};
        reactionsResult.rows.forEach(reaction => {
          if (!reactions[reaction.emoji]) {
            reactions[reaction.emoji] = [];
          }
          reactions[reaction.emoji].push({
            userId: reaction.userId,
            username: reaction.username
          });
        });

        message.reactions = reactions;
      }

      return NextResponse.json({
        success: true,
        messages,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Direct messages GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch direct messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyJWT(token) as any;
    const { recipientId, content, messageType = 'text', gifUrl, fileUrl, fileName } = await request.json();

    if (!recipientId || (!content && !gifUrl && !fileUrl)) {
      return NextResponse.json({ error: 'Recipient ID and content required' }, { status: 400 });
    }

    // Verify both users are in the same league
    const leagueCheck = await database.query(`
      SELECT COUNT(*) as count FROM (
        SELECT DISTINCT t.league_id
        FROM teams t
        WHERE t.user_id = $1
        INTERSECT
        SELECT DISTINCT t.league_id
        FROM teams t
        WHERE t.user_id = $2
      ) leagues
    `, [decoded.userId, recipientId]);

    if (leagueCheck.rows[0].count === 0) {
      return NextResponse.json({ error: 'Users must be in the same league' }, { status: 403 });
    }

    // Get usernames
    const userResult = await database.query(`
      SELECT id, username FROM users WHERE id IN ($1, $2)
    `, [decoded.userId, recipientId]);

    const users = userResult.rows.reduce((acc: any, user: any) => {
      acc[user.id] = user.username;
      return acc;
    }, {});

    // Insert message
    const result = await database.query(`
      INSERT INTO direct_messages (sender_id, recipient_id, content, message_type, gif_url, file_url, file_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, sender_id as senderId, recipient_id as recipientId, content, 
                message_type as messageType, gif_url as gifUrl, file_url as fileUrl,
                file_name as fileName, is_read as isRead, created_at as createdAt
    `, [decoded.userId, recipientId, content, messageType, gifUrl, fileUrl, fileName]);

    const message = {
      ...result.rows[0],
      senderUsername: users[decoded.userId],
      recipientUsername: users[recipientId],
      reactions: {}
    };

    // Note: WebSocket broadcasts are handled by the WebSocket server when clients send messages
    // This API endpoint stores the message, while real-time delivery happens via WebSocket

    return NextResponse.json({
      success: true,
      data: message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Direct messages POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send direct message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}