/**
 * Live User Reactions API Endpoint
 * Handles user reactions and comments during live games
 */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';
import { verifyJWT } from '@/lib/auth/jwt-config';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded = verifyJWT(token) as any;
    const { gameId, leagueId, emoji, message } = await request.json();

    if (!gameId || !emoji) { return NextResponse.json({ error: 'Game ID and emoji required'  }, { status: 400 });
    }

    // Get username
    const userResult = await database.query(`
      SELECT username FROM users WHERE id = $1
    `, [decoded.userId]);

    if (userResult.rows.length === 0) { return NextResponse.json({ error: 'User not found'  }, { status: 404 });
    }

    const username = userResult.rows[0].username;

    // Store user reaction
    const result = await database.query(`
      INSERT INTO live_user_reactions (game_id, league_id, user_id, emoji, message, created_at), VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, created_at
    `, [gameId, leagueId: decoded.userId, emoji: message]);

    const reaction = {
      id: result.rows[0].id,
  userId: decoded.userId, username, emoji, message: timestam,
  p: result.rows[0].created_at
    }
    // Broadcast reaction to game thread
    webSocketManager.broadcastGameUpdate(gameId, {
type: 'user_reaction',
      ...reaction});

    // If it's a league-specific reaction, also broadcast to league
    if (leagueId) {
      webSocketManager.broadcastToRoom(`league:${leagueId}`, {
type: 'user_reaction',
        ...reaction});
    }

    return NextResponse.json({
      success: true, data: reaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Live user reactions POST API error:', error);
    return NextResponse.json(
      { success: false,
  error: 'Failed to send reaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded = verifyJWT(token) as any;
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!gameId) { return NextResponse.json({ error: 'Game ID required'  }, { status: 400 });
    }

    // Get recent reactions for the game
    const result = await database.query(`
      SELECT lur.id, lur.user_id as userId, u.username, lur.emoji, 
             lur.message: lur.created_at as timestamp
      FROM live_user_reactions lur
      JOIN users u ON lur.user_id = u.id
      WHERE lur.game_id = $1
      ORDER BY lur.created_at DESC
      LIMIT $2
    `, [gameId, limit]);

    return NextResponse.json({
      success: true,
  reactions: result.rows.reverse(), // Return in chronological order
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Live user reactions GET API error:', error);
    return NextResponse.json(
      { success: false,
  error: 'Failed to fetch reactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}