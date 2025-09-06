import { NextRequest, NextResponse } from 'next/server';
import { Server as HTTPServer } from 'http';
import { draftSocketManager } from '@/lib/socket-server';

export async function GET(request: NextRequest) {
  try {
    // This endpoint will be used to initialize the socket server
    // The actual WebSocket connection happens via the socket.io path
    
    return NextResponse.json({
      success: true,
      message: 'Draft WebSocket server is ready',
      endpoint: '/api/draft-socket',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Draft socket route error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to draft service' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, draftId, ...data } = body;

    switch (action) {
      case 'create-draft':
        const draftRoom = await draftSocketManager.createDraftRoom(data);
        return NextResponse.json({ success: true, draftRoom });

      case 'start-draft':
        if (!draftId) {
          return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
        }
        await draftSocketManager.startDraft(draftId);
        return NextResponse.json({ success: true, message: 'Draft started' });

      case 'get-draft':
        if (!draftId) {
          return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
        }
        const draft = draftSocketManager.getDraftRoom(draftId);
        if (!draft) {
          return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, draftRoom: draft });

      case 'delete-draft':
        if (!draftId) {
          return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
        }
        const deleted = draftSocketManager.deleteDraftRoom(draftId);
        return NextResponse.json({ success: true, deleted });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Draft action error:', error);
    return NextResponse.json(
      { error: 'Failed to process draft action' },
      { status: 500 }
    );
  }
}