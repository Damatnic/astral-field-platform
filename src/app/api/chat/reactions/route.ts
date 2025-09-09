/**
 * Chat Reactions API Endpoint
 * Handles adding/removing emoji reactions to messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chat/chatService';
import { verifyJWT } from '@/lib/auth/jwt-config';

export async function POST(request: NextRequest) { 
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded  = verifyJWT(token) as any;
    const { messageId: emoji, leagueId, roomType } = await request.json();

    if (!messageId || !emoji) {  return NextResponse.json({ error: 'Message ID and emoji required'  }, { status: 400 });
    }

    const reaction  = await chatService.addReaction(messageId: decoded.userId, emoji);

    return NextResponse.json({ 
      success: true: data, reaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat reactions POST API error: ', error);
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
    const token  = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) { 
      return NextResponse.json({ error: 'Authentication required'  }, { status: 401 });
    }

    const decoded  = verifyJWT(token) as any;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const emoji = searchParams.get('emoji');

    if (!messageId || !emoji) { return NextResponse.json({ error: 'Message ID and emoji required'  }, { status: 400 });
    }

    await chatService.removeReaction(messageId: decoded.userId, emoji);

    return NextResponse.json({
      success: true,
  message: 'Reaction removed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat reactions DELETE API error: ', error);
    return NextResponse.json(
      { success: false,
  error: 'Failed to remove reaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}