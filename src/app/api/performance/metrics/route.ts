/**
 * Performance Metrics API Endpoint
 * Prometheus-compatible metrics endpoint for monitoring
 */

import { NextRequest } from 'next/server';
import { createCachedResponse } from '@/lib/cache';
import { metrics, highPerformanceSystem } from '@/lib/performance';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    
    if (format === 'prometheus') {
      // Export metrics in Prometheus format
      const prometheusMetrics = metrics.exportPrometheusFormat();
      
      return new Response(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
          'Cache-Control': 'public, max-age=15, stale-while-revalidate=30'
        }
      });
    } else {
      // Export metrics in JSON format
      const performanceMetrics = await highPerformanceSystem.getPerformanceMetrics();
      
      return createCachedResponse(
        {
          timestamp: new Date().toISOString(),
          system: {
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid
          },
          performance: performanceMetrics,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        },
        15 // Cache for 15 seconds
      );
    }
  } catch (error) {
    return createCachedResponse(
      {
        error: 'Failed to fetch metrics',
        timestamp: new Date().toISOString()
      },
      5,
      { status: 500 }
    );
  }
}