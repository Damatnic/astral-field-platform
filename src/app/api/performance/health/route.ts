/**
 * Performance Health Check API Endpoint
 * Comprehensive health monitoring and system status endpoint
 */

import { NextRequest } from 'next/server';
import { createCachedResponse } from '@/lib/cache';
import { highPerformanceSystem } from '@/lib/performance';

export async function GET(request: NextRequest) {
  try {
    const health = await highPerformanceSystem.getSystemHealth();
    
    const status = health.overall === 'healthy' ? 200 : 
                   health.overall === 'degraded' ? 200 : 503;

    return createCachedResponse(
      {
        status: health.overall,
        timestamp: new Date().toISOString(),
        uptime: health.details.uptime,
        version: process.env.npm_package_version || '1.0.0',
        components: {
          database: health.database,
          cache: health.cache,
          scaling: health.scaling,
          resources: health.resources
        },
        metrics: {
          memoryUsage: `${health.details.memoryUsage.toFixed(1)}%`,
          cpuUsage: `${health.details.cpuUsage.toFixed(1)}%`,
          activeConnections: health.details.activeConnections,
          cacheHitRate: `${(health.details.cacheHitRate * 100).toFixed(1)}%`,
          avgResponseTime: `${health.details.avgResponseTime.toFixed(1)}ms`
        }
      },
      30, // Cache for 30 seconds
      { status }
    );
  } catch (error) {
    return createCachedResponse(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      10, // Cache errors for only 10 seconds
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Enable emergency mode endpoint
    const { action } = await request.json();
    
    if (action === 'emergency') {
      await highPerformanceSystem.enableEmergencyMode();
      return createCachedResponse(
        { success: true, message: 'Emergency mode enabled' },
        5
      );
    }
    
    return createCachedResponse(
      { error: 'Invalid action' },
      60,
      { status: 400 }
    );
  } catch (error) {
    return createCachedResponse(
      { error: 'Failed to process request' },
      10,
      { status: 500 }
    );
  }
}