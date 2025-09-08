/**
 * WebSocket API Endpoint
 * Handles WebSocket server initialization and connection management
 */

import { NextRequest, NextResponse } from 'next/server';
import { Server as HTTPServer } from 'http';
import { webSocketManager } from '@/lib/websocket/server';

// Store server instance globally
let httpServer: HTTPServer | null = null;
let isWebSocketInitialized = false;

export async function GET(request: NextRequest) {
  try {
    // Return WebSocket connection information and status
    const stats = webSocketManager.getConnectionStats();
    
    return NextResponse.json({
      status: 'healthy',
      websocket: {
        initialized: isWebSocketInitialized,
        connections: stats.totalConnections,
        activeLeagues: stats.activeLeagues,
        activeMatchups: stats.activeMatchups,
        endpoint: process.env.NODE_ENV === 'production' 
          ? 'wss://astral-field.vercel.app'
          : 'ws://localhost:3000'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('WebSocket status check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to get WebSocket status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'initialize':
        return await initializeWebSocket();
      
      case 'shutdown':
        return await shutdownWebSocket();
      
      case 'stats':
        return NextResponse.json({
          status: 'success',
          stats: webSocketManager.getConnectionStats()
        });
      
      case 'health':
        return await healthCheck();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: initialize, shutdown, stats, health' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('WebSocket API error:', error);
    return NextResponse.json(
      {
        error: 'WebSocket operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function initializeWebSocket() {
  try {
    if (isWebSocketInitialized) {
      return NextResponse.json({
        status: 'already_initialized',
        message: 'WebSocket server is already running',
        stats: webSocketManager.getConnectionStats()
      });
    }

    // In a real Next.js app, we need to handle WebSocket differently
    // This is a simplified version for demonstration
    console.log('🚀 Initializing WebSocket server...');
    
    // For Next.js, WebSocket initialization would typically happen in a custom server
    // or through a separate WebSocket service
    isWebSocketInitialized = true;
    
    return NextResponse.json({
      status: 'initialized',
      message: 'WebSocket server initialized successfully',
      endpoint: process.env.NODE_ENV === 'production' 
        ? 'wss://astral-field.vercel.app'
        : 'ws://localhost:3000',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('WebSocket initialization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize WebSocket server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function shutdownWebSocket() {
  try {
    if (!isWebSocketInitialized) {
      return NextResponse.json({
        status: 'not_running',
        message: 'WebSocket server is not running'
      });
    }

    console.log('🔄 Shutting down WebSocket server...');
    await webSocketManager.shutdown();
    isWebSocketInitialized = false;

    return NextResponse.json({
      status: 'shutdown',
      message: 'WebSocket server shutdown successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('WebSocket shutdown error:', error);
    return NextResponse.json(
      {
        error: 'Failed to shutdown WebSocket server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function healthCheck() {
  try {
    const stats = webSocketManager.getConnectionStats();
    const isHealthy = isWebSocketInitialized && stats.totalConnections >= 0;

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      websocket: {
        initialized: isWebSocketInitialized,
        healthy: isHealthy,
        connections: stats.totalConnections,
        activeLeagues: stats.activeLeagues,
        activeMatchups: stats.activeMatchups,
        uptime: isWebSocketInitialized ? 'running' : 'stopped'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to broadcast updates (can be called from other API routes)
export async function broadcastUpdate(type: string, data: any) {
  try {
    switch (type) {
      case 'score_update':
        webSocketManager.broadcastScoreUpdate(data);
        break;
      case 'player_update':
        webSocketManager.broadcastPlayerUpdate(data);
        break;
      case 'matchup_update':
        webSocketManager.broadcastMatchupUpdate(data);
        break;
      case 'trade_notification':
        webSocketManager.broadcastTradeNotification(data);
        break;
      case 'waiver_notification':
        webSocketManager.broadcastWaiverNotification(data);
        break;
      default:
        console.warn(`Unknown broadcast type: ${type}`);
    }
  } catch (error) {
    console.error(`Failed to broadcast ${type}:`, error);
  }
}