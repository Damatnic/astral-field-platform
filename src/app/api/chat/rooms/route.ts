/**
 * Chat Rooms API Endpoint
 * Handles chat room management for fantasy leagues
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chat/chatService';
import { verifyJWT } from '@/lib/auth/jwt-config';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyJWT(token) as any;
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json({ error: 'League ID required' }, { status: 400 });
    }

    const chatRooms = await chatService.getChatRooms(leagueId);

    return NextResponse.json({
      success: true,
      data: chatRooms,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat rooms API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chat rooms',
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
    const { leagueId, name, type, description } = await request.json();

    if (!leagueId || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const chatRoom = await chatService.createChatRoom(leagueId, name, type, description, decoded.userId);

    return NextResponse.json({
      success: true,
      data: chatRoom,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create chat room API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create chat room',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}