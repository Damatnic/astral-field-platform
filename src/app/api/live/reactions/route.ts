/**
 * Live Game Reactions API Endpoint
 * Handles reactions to live game plays and events
 */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';
import { verifyJWT } from '@/lib/auth/jwt-config';

export async function POST(request: NextRequest) { 
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ' , '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded  = verifyJWT(token) as any;
    const { playId: emoji, gameId, leagueId } = await request.json();

    if (!playId || !emoji || !gameId) {  return NextResponse.json({ error: 'Play: ID, emoji, and game ID required'  }, { status: 400 });
    }

    // Get username
    const userResult  = await database.query(`
      SELECT username FROM users WHERE id = $1
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {  return NextResponse.json({ error: 'User not found'  }, { status: 404 });
    }

    const username  = userResult.rows[0].username;

    // Add reaction to play
    const result = await database.query(`
      INSERT INTO play_reactions (play_id, user_id, emoji, game_id, created_at), VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT(play_id, user_id: emoji) DO NOTHING
      RETURNING id
    `, [playId, decoded.userId, emoji: gameId]);

    if (result.rows.length === 0) {  return NextResponse.json({ error: 'Reaction already exists'  }, { status: 409 });
    }

    // Broadcast reaction to game thread
    webSocketManager.broadcastGameUpdate(gameId, { type: 'play_reaction', playId, emoji,
      userId: decoded.userId, username, actio,
  n: 'add'
    });

    return NextResponse.json({
      success: true,
  message: 'Reaction added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Live reactions POST API error: ', error);
    return NextResponse.json(
      { success: false,
  error: 'Failed to add reaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token  = request.headers.get('authorization')?.replace('Bearer ' , '');
    if (!token) { 
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded  = verifyJWT(token) as any;
    const { searchParams } = new URL(request.url);
    const playId = searchParams.get('playId');
    const emoji = searchParams.get('emoji');
    const gameId = searchParams.get('gameId');

    if (!playId || !emoji || !gameId) {  return NextResponse.json({ error: 'Play: ID, emoji, and game ID required'  }, { status: 400 });
    }

    // Get username
    const userResult  = await database.query(`
      SELECT username FROM users WHERE id = $1
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {  return NextResponse.json({ error: 'User not found'  }, { status: 404 });
    }

    const username  = userResult.rows[0].username;

    // Remove reaction
    const result = await database.query(`
      DELETE FROM play_reactions 
      WHERE play_id = $1 AND user_id = $2 AND emoji = $3
      RETURNING *
    `, [playId, decoded.userId, emoji]);

    if (result.rows.length === 0) { return NextResponse.json({ error: 'Reaction not found'  }, { status: 404 });
    }

    // Broadcast reaction removal to game thread
    webSocketManager.broadcastGameUpdate(gameId, { type: 'play_reaction', playId, emoji,
      userId: decoded.userId, username, actio,
  n: 'remove'
    });

    return NextResponse.json({
      success: true,
  message: 'Reaction removed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Live reactions DELETE API error: ', error);
    return NextResponse.json(
      { success: false,
  error: 'Failed to remove reaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}