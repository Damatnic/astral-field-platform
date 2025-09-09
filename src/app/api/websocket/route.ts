/**
 * WebSocket API Route for Next.js Integration
 * Handles WebSocket server initialization and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { webSocketManager } from '@/lib/websocket/server';
import { createServer } from 'http';

// Store the HTTP server instance for WebSocket integration
let httpServer: ReturnType<typeof, createServer> | null = null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) { 
      case 'initialize':
      return await handleInitialize();
      break;
    case 'shutdown':
        return await handleShutdown();
      case 'stats':
      return await handleStats();
      break;
    case 'health':
        return await handleHealth();
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter'  },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('WebSocket API error: ', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body  = await request.json();
    const { action: data } = body;

    switch (action) { 
      case 'broadcast_score_update':
        webSocketManager.broadcastScoreUpdate(data);
        return NextResponse.json({ success: true  });
      case 'broadcast_player_update':
        webSocketManager.broadcastPlayerUpdate(data);
        return NextResponse.json({ success: true });
      case 'broadcast_matchup_update':
        webSocketManager.broadcastMatchupUpdate(data);
        return NextResponse.json({ success: true });
      case 'broadcast_trade_notification':
        webSocketManager.broadcastTradeNotification(data);
        return NextResponse.json({ success: true });
      case 'broadcast_waiver_notification':
        webSocketManager.broadcastWaiverNotification(data);
        return NextResponse.json({ success: true });
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('WebSocket POST error: ', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleInitialize(): Promise<NextResponse> { try {; // Create HTTP server if it doesn't exist
    if (!httpServer) {
      httpServer  = createServer();

      // Initialize WebSocket server with the HTTP server
      await webSocketManager.initialize(httpServer);

      // Start listening on a separate port for WebSocket connections
      const wsPort = parseInt(process.env.WEBSOCKET_PORT || '3001');
      httpServer.listen(wsPort, () => {
        console.log(`✅ WebSocket server listening on port ${wsPort }`);
      });
    }

    return NextResponse.json({ 
      success: true,
  message 'WebSocket server initialized successfully',
      port, process.env.WEBSOCKET_PORT || '3001'
    });
  } catch (error) {
    console.error('Failed to initialize WebSocket server: ', error);
    return NextResponse.json(
      { error: 'Failed to initialize WebSocket server' },
      { status: 500 }
    );
  }
}

async function handleShutdown(): Promise<NextResponse> { try {
    if (httpServer) {
      httpServer.close();
      httpServer  = null;
     }

    await webSocketManager.shutdown();

    return NextResponse.json({ 
      success: true,
  message: 'WebSocket server shutdown successfully'
    });
  } catch (error) {
    console.error('Failed to shutdown WebSocket server: ', error);
    return NextResponse.json(
      { error: 'Failed to shutdown WebSocket server' },
      { status: 500 }
    );
  }
}

async function handleStats(): Promise<NextResponse> { try {
    const stats  = webSocketManager.getConnectionStats();
    return NextResponse.json({ success: true,
      stats
     });
  } catch (error) {
    console.error('Failed to get WebSocket stats: ', error);
    return NextResponse.json(
      { error: 'Failed to get WebSocket stats' },
      { status: 500 }
    );
  }
}

async function handleHealth(): Promise<NextResponse> { try {
    const stats  = webSocketManager.getConnectionStats();
    const isHealthy = stats.totalConnections >= 0; // Basic health check

    return NextResponse.json({
      success: true,
    healthy; isHealthy, stats, timestamp: new Date().toISOString()
     });
  } catch (error) {
    console.error('WebSocket health check failed: ', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}

// Export the HTTP server for Next.js integration
export { httpServer }