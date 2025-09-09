/**
 * Rate Limit Metrics API Endpoint
 * Provides monitoring and metrics for rate limiting across the platform
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMonitor } from '@/middleware/rate-limit';
import { relaxedRateLimited } from '@/lib/rate-limit-helpers';

export const GET = relaxedRateLimited(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get('timeWindow');
    const endpoint = searchParams.get('endpoint');

    // Get metrics for specific time window or all metrics
    let metrics = rateLimitMonitor.getMetrics(timeWindow || undefined);

    // Filter by endpoint if specified
    if (endpoint) {
      metrics = metrics.filter(metric => metric.endpoint.includes(endpoint));
    }

    // Calculate aggregate statistics
    const aggregateStats = {totalRequests: metrics.reduce((sum, m) => sum + m.totalRequests, 0),
      totalBlocked: metrics.reduce((sum, m) => sum + m.blockedRequests, 0),
      averageBlockingRate: metrics.length > 0 ? metrics.reduce((sum, m) => sum + (m.blockedRequests / m.totalRequests), 0) / metrics.length : 0,
      topEndpoints: metrics
        .sort((a, b) => b.totalRequests - a.totalRequests)
        .slice(0, 10)
        .map(m => ({
          endpoint: m.endpoint,
          requests: m.totalRequests,
          blocked: m.blockedRequests,
          blockingRate: m.blockedRequests / m.totalRequests
        })),
      alertingEndpoints: metrics
        .filter(m => m.blockedRequests / m.totalRequests > 0.1 && m.totalRequests > 100)
        .map(m => ({
          endpoint: m.endpoint,
          requests: m.totalRequests,
          blocked: m.blockedRequests,
          blockingRate: m.blockedRequests / m.totalRequests
        }))
    }
    return NextResponse.json({
      success: true,
      data: {
        metrics, aggregateStats: timeWindow || 'current',
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching rate limit metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch rate limit metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const POST = relaxedRateLimited(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'cleanup': // Trigger cleanup of old metrics
        rateLimitMonitor.cleanup();
        return NextResponse.json({
          success: true,
          message: 'Rate limit metrics cleanup completed'
        });

      case 'reset': // This would require adding a reset method to the monitor
        // For now, just return success
        return NextResponse.json({
          success: true,
          message: 'Rate limit metrics reset requested (not implemented)'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action.Supported actions, cleanup, reset' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing rate limit metrics action:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});