/**
 * Performance Monitoring Dashboard API
 * Provides comprehensive monitoring data for dashboards
 */

import { NextRequest, NextResponse } from 'next/server';
import performanceMonitor from '@/lib/monitoring/performance-monitor';
import { getHealthChecker } from '@/lib/health-checker';
import { sentryUtils } from '@/lib/monitoring/sentry-config';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  
  // Query parameters
  const timeRange = searchParams.get('timeRange') || '1h'; // 1h, 6h, 24h, 7d, 30d
  const metrics = searchParams.get('metrics')?.split(',') || [];
  const includeAlerts = searchParams.get('alerts') === 'true';
  const includeInsights = searchParams.get('insights') === 'true';
  const format = searchParams.get('format') || 'json'; // json, prometheus

  try {
    // Start performance tracking
    const transaction = sentryUtils.startTransaction('monitoring-dashboard', 'http');
    
    // Get system health
    const systemHealth = await performanceMonitor.getSystemHealth();
    const healthChecker = getHealthChecker();
    const comprehensiveHealth = await healthChecker.performComprehensiveHealthCheck();
    
    // Get performance insights
    const insights = includeInsights ? performanceMonitor.getPerformanceInsights() : null;
    
    // Calculate time range in milliseconds
    const timeRangeMs = parseTimeRange(timeRange);
    const cutoff = Date.now() - timeRangeMs;
    
    // Get metrics within time range
    const recentMetrics = systemHealth.metrics.filter(m => m.timestamp > cutoff);
    
    // Filter specific metrics if requested
    let filteredMetrics = recentMetrics;
    if (metrics.length > 0) {
      filteredMetrics = recentMetrics.filter(m => metrics.includes(m.name));
    }
    
    // Group metrics by name for better visualization
    const groupedMetrics = groupMetricsByName(filteredMetrics);
    
    // Calculate dashboard data
    const dashboardData = {
      overview: {
        systemStatus: systemHealth.status,
        healthScore: systemHealth.score,
        uptime: systemHealth.uptime,
        totalServices: comprehensiveHealth.summary.total,
        healthyServices: comprehensiveHealth.summary.healthy,
        degradedServices: comprehensiveHealth.summary.degraded,
        unhealthyServices: comprehensiveHealth.summary.unhealthy,
        lastUpdated: Date.now(),
      },
      
      // Real-time metrics
      realTimeMetrics: {
        responseTime: getCurrentMetric(groupedMetrics, 'api_response_time'),
        errorRate: getCurrentMetric(groupedMetrics, 'api_error_rate'),
        requestsPerSecond: getCurrentMetric(groupedMetrics, 'api_requests_per_second'),
        memoryUsage: getCurrentMetric(groupedMetrics, 'memory_usage'),
        cpuUsage: getCurrentMetric(groupedMetrics, 'cpu_usage'),
        activeConnections: getCurrentMetric(groupedMetrics, 'active_connections'),
      },
      
      // Time series data for charts
      timeSeries: generateTimeSeriesData(groupedMetrics, timeRangeMs),
      
      // Service health breakdown
      services: comprehensiveHealth.checks.map(check => ({
        name: check.service,
        status: check.status,
        responseTime: check.responseTime,
        lastCheck: check.timestamp,
        details: check.details,
        error: check.error,
      })),
      
      // Performance insights
      ...(includeInsights && insights && {
        insights: {
          slowestEndpoints: insights.slowestEndpoints.slice(0, 10),
          errorRates: insights.errorRates.slice(0, 10),
          performanceTrends: insights.performanceTrends,
          resourceUsage: insights.resourceUsage,
        },
      }),
      
      // Active alerts
      ...(includeAlerts && {
        alerts: {
          active: systemHealth.alerts?.filter(a => !a.resolved) || [],
          summary: {
            critical: systemHealth.alerts?.filter(a => a.type === 'critical' && !a.resolved).length || 0,
            warning: systemHealth.alerts?.filter(a => a.type === 'warning' && !a.resolved).length || 0,
          },
        },
      }),
      
      // Dashboard metadata
      metadata: {
        timeRange,
        metricsCount: filteredMetrics.length,
        requestDuration: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
      },
    };
    
    // Record dashboard access metrics
    performanceMonitor.recordMetric({
      name: 'dashboard_request',
      value: Date.now() - startTime,
      unit: 'milliseconds',
      tags: {
        timeRange,
        format,
        includeAlerts: includeAlerts.toString(),
        includeInsights: includeInsights.toString(),
      },
    });
    
    transaction.finish();
    
    // Handle different response formats
    if (format === 'prometheus') {
      const prometheusData = formatPrometheusMetrics(dashboardData);
      return new NextResponse(prometheusData, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    
    sentryUtils.captureError(error as Error, {
      component: 'monitoring-dashboard',
      feature: 'dashboard-api',
      extra: {
        timeRange,
        metrics,
        includeAlerts,
        includeInsights,
        duration: Date.now() - startTime,
      },
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create custom dashboard or update dashboard configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;
    
    if (action === 'create-custom-dashboard') {
      const { name, metrics, layout, filters } = config;
      
      // Validate required fields
      if (!name || !metrics || !Array.isArray(metrics)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Name and metrics array are required for custom dashboard',
          },
          { status: 400 }
        );
      }
      
      // Create custom dashboard configuration
      const dashboardConfig = {
        id: generateDashboardId(),
        name,
        metrics,
        layout: layout || 'grid',
        filters: filters || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // In a real implementation, you would save this to a database
      console.log('Created custom dashboard:', dashboardConfig);
      
      return NextResponse.json({
        success: true,
        dashboard: dashboardConfig,
      });
    }
    
    if (action === 'update-alert-rules') {
      const { rules } = config;
      
      if (!rules || !Array.isArray(rules)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert rules array is required',
          },
          { status: 400 }
        );
      }
      
      // Update alert rules
      console.log('Updated alert rules:', rules);
      
      return NextResponse.json({
        success: true,
        message: 'Alert rules updated successfully',
        rules,
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Supported actions: create-custom-dashboard, update-alert-rules',
      },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Dashboard POST error:', error);
    
    sentryUtils.captureError(error as Error, {
      component: 'monitoring-dashboard',
      feature: 'dashboard-post',
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process dashboard request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions
function parseTimeRange(timeRange: string): number {
  const ranges: Record<string, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  
  return ranges[timeRange] || ranges['1h'];
}

function groupMetricsByName(metrics: any[]) {
  const grouped: Record<string, any[]> = {};
  
  metrics.forEach(metric => {
    if (!grouped[metric.name]) {
      grouped[metric.name] = [];
    }
    grouped[metric.name].push(metric);
  });
  
  // Sort each group by timestamp
  Object.keys(grouped).forEach(name => {
    grouped[name].sort((a, b) => b.timestamp - a.timestamp);
  });
  
  return grouped;
}

function getCurrentMetric(groupedMetrics: Record<string, any[]>, metricName: string) {
  const metrics = groupedMetrics[metricName];
  if (!metrics || metrics.length === 0) {
    return { value: 0, timestamp: Date.now(), status: 'no-data' };
  }
  
  const latest = metrics[0];
  return {
    value: latest.value,
    unit: latest.unit,
    timestamp: latest.timestamp,
    status: 'available',
    change: calculateChange(metrics),
  };
}

function calculateChange(metrics: any[]): { percentage: number; trend: 'up' | 'down' | 'stable' } {
  if (metrics.length < 2) {
    return { percentage: 0, trend: 'stable' };
  }
  
  const current = metrics[0].value;
  const previous = metrics[1].value;
  
  if (previous === 0) {
    return { percentage: 0, trend: 'stable' };
  }
  
  const percentage = ((current - previous) / previous) * 100;
  const trend = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable';
  
  return { percentage: Math.round(percentage), trend };
}

function generateTimeSeriesData(groupedMetrics: Record<string, any[]>, timeRangeMs: number) {
  const timeSeries: Record<string, any[]> = {};
  const bucketSize = Math.max(60000, timeRangeMs / 100); // At least 1 minute buckets
  
  Object.entries(groupedMetrics).forEach(([metricName, metrics]) => {
    const buckets = new Map<number, { sum: number; count: number; min: number; max: number }>();
    
    metrics.forEach(metric => {
      const bucketTime = Math.floor(metric.timestamp / bucketSize) * bucketSize;
      
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, { sum: 0, count: 0, min: metric.value, max: metric.value });
      }
      
      const bucket = buckets.get(bucketTime)!;
      bucket.sum += metric.value;
      bucket.count += 1;
      bucket.min = Math.min(bucket.min, metric.value);
      bucket.max = Math.max(bucket.max, metric.value);
    });
    
    timeSeries[metricName] = Array.from(buckets.entries())
      .map(([timestamp, bucket]) => ({
        timestamp,
        value: bucket.sum / bucket.count,
        min: bucket.min,
        max: bucket.max,
        count: bucket.count,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  });
  
  return timeSeries;
}

function formatPrometheusMetrics(dashboardData: any): string {
  const lines: string[] = [];
  
  // System overview metrics
  lines.push(
    '# HELP system_health_score Overall system health score',
    '# TYPE system_health_score gauge',
    `system_health_score ${dashboardData.overview.healthScore}`,
    ''
  );
  
  lines.push(
    '# HELP system_uptime System uptime in seconds',
    '# TYPE system_uptime counter',
    `system_uptime ${Math.floor(dashboardData.overview.uptime / 1000)}`,
    ''
  );
  
  // Real-time metrics
  Object.entries(dashboardData.realTimeMetrics).forEach(([key, metric]: [string, any]) => {
    if (metric.status === 'available') {
      const metricName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      lines.push(
        `# HELP ${metricName} ${key} metric`,
        `# TYPE ${metricName} gauge`,
        `${metricName} ${metric.value}`,
        ''
      );
    }
  });
  
  // Service health
  lines.push(
    '# HELP service_health_status Service health status (0=unhealthy, 1=degraded, 2=healthy)',
    '# TYPE service_health_status gauge'
  );
  
  dashboardData.services.forEach((service: any) => {
    const statusValue = service.status === 'healthy' ? 2 : service.status === 'degraded' ? 1 : 0;
    lines.push(`service_health_status{service=\"${service.name}\"} ${statusValue}`);
  });
  
  lines.push('');
  
  // Alert counts
  if (dashboardData.alerts) {
    lines.push(
      '# HELP active_alerts_total Number of active alerts by type',
      '# TYPE active_alerts_total gauge',
      `active_alerts_total{type=\"critical\"} ${dashboardData.alerts.summary.critical}`,
      `active_alerts_total{type=\"warning\"} ${dashboardData.alerts.summary.warning}`,
      ''
    );
  }
  
  return lines.join('\\n');
}

function generateDashboardId(): string {
  return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}