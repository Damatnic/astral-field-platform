/**
 * NFL Data Service Metrics API
 * Detailed performance and operational metrics for monitoring and alerting
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Metrics response schema
const metricsSchema = z.object({
  timestamp: z.string(),
  interval: z.string(),
  service: z.object({
    name: z.string(),
    version: z.string(),
    uptime: z.number(),
    startTime: z.string()
  }),
  performance: z.object({
    requests: z.object({
      total: z.number(),
      successful: z.number(),
      failed: z.number(),
      rate: z.number(),
      averageResponseTime: z.number(),
      percentiles: z.object({
        p50: z.number(),
        p90: z.number(),
        p95: z.number(),
        p99: z.number()
      })
    }),
    cache: z.object({
      hits: z.number(),
      misses: z.number(),
      hitRate: z.number(),
      size: z.number(),
      evictions: z.number()
    }),
    database: z.object({
      connections: z.number(),
      activeQueries: z.number(),
      queryTime: z.number(),
      slowQueries: z.number()
    })
  }),
  data_sources: z.record(z.object({
    status: z.enum(['online', 'offline', 'degraded']),
    requests: z.number(),
    successes: z.number(),
    failures: z.number(),
    averageResponseTime: z.number(),
    lastError: z.string().optional(),
    circuitBreakerState: z.enum(['closed', 'open', 'half-open'])
  })),
  websocket: z.object({
    connections: z.number(),
    messagesSent: z.number(),
    messagesQueued: z.number(),
    bandwidth: z.number(),
    errors: z.number()
  }),
  validation: z.object({
    totalChecks: z.number(),
    passed: z.number(),
    failed: z.number(),
    warnings: z.number(),
    averageTime: z.number()
  }),
  system: z.object({
    memory: z.object({
      used: z.number(),
      free: z.number(),
      total: z.number(),
      usage: z.number()
    }),
    cpu: z.object({
      usage: z.number(),
      load: z.array(z.number())
    }),
    eventLoop: z.object({
      lag: z.number(),
      utilization: z.number()
    })
  }),
  alerts: z.array(z.object({
    level: z.enum(['info', 'warning', 'error', 'critical']),
    message: z.string(),
    timestamp: z.string(),
    component: z.string(),
    value: z.number().optional(),
    threshold: z.number().optional()
  }))
});

interface MetricPoint {
  timestamp: number;
  value: number;
}

class MetricsCollector {
  private startTime = Date.now();
  private requestMetrics: MetricPoint[] = [];
  private responseTimeMetrics: MetricPoint[] = [];
  private errorMetrics: MetricPoint[] = [];
  private cacheMetrics: MetricPoint[] = [];
  private alerts: any[] = [];
  private readonly maxDataPoints = 1000;

  constructor() {
    this.startSystemMonitoring();
  }

  private startSystemMonitoring(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);
  }

  private async collectMetrics(): Promise<void> {
    try {
      const now = Date.now();
      
      // Collect memory metrics
      const memoryUsage = process.memoryUsage();
      this.addMetric('memory_used', memoryUsage.heapUsed, now);
      this.addMetric('memory_total', memoryUsage.heapTotal, now);
      
      // Collect event loop lag
      const start = process.hrtime();
      setImmediate(() => {
        const lag = process.hrtime(start);
        const lagMs = lag[0] * 1000 + lag[1] * 1e-6;
        this.addMetric('event_loop_lag', lagMs, now);
      });

      // Check for alerts
      this.checkAlerts();
      
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  private addMetric(name: string, value: number, timestamp: number): void {
    const metric: MetricPoint = { timestamp, value };
    
    switch (name) {
      case 'request':
        this.requestMetrics.push(metric);
        if (this.requestMetrics.length > this.maxDataPoints) {
          this.requestMetrics.shift();
        }
        break;
      case 'response_time':
        this.responseTimeMetrics.push(metric);
        if (this.responseTimeMetrics.length > this.maxDataPoints) {
          this.responseTimeMetrics.shift();
        }
        break;
      case 'error':
        this.errorMetrics.push(metric);
        if (this.errorMetrics.length > this.maxDataPoints) {
          this.errorMetrics.shift();
        }
        break;
    }
  }

  private checkAlerts(): void {
    const now = new Date().toISOString();
    
    // Memory usage alert
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      this.addAlert('critical', 'High memory usage detected', 'system', memoryUsagePercent, 90, now);
    } else if (memoryUsagePercent > 80) {
      this.addAlert('warning', 'Elevated memory usage', 'system', memoryUsagePercent, 80, now);
    }
    
    // Error rate alert
    const recentErrors = this.errorMetrics.filter(m => Date.now() - m.timestamp < 300000); // Last 5 minutes
    const recentRequests = this.requestMetrics.filter(m => Date.now() - m.timestamp < 300000);
    const errorRate = recentRequests.length > 0 ? (recentErrors.length / recentRequests.length) * 100 : 0;
    
    if (errorRate > 10) {
      this.addAlert('error', 'High error rate detected', 'api', errorRate, 10, now);
    } else if (errorRate > 5) {
      this.addAlert('warning', 'Elevated error rate', 'api', errorRate, 5, now);
    }
  }

  private addAlert(level: string, message: string, component: string, value?: number, threshold?: number, timestamp?: string): void {
    const alert = {
      level,
      message,
      component,
      value,
      threshold,
      timestamp: timestamp || new Date().toISOString()
    };
    
    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
    
    console.log(`🚨 Alert [${level.toUpperCase()}] ${component}: ${message}`);
  }

  recordRequest(responseTime: number, success: boolean): void {
    const now = Date.now();
    this.addMetric('request', 1, now);
    this.addMetric('response_time', responseTime, now);
    
    if (!success) {
      this.addMetric('error', 1, now);
    }
  }

  async getMetrics(timeRange?: string): Promise<any> {
    const now = new Date();
    const uptime = Date.now() - this.startTime;
    
    // Calculate time range for metrics
    const rangeMs = this.parseTimeRange(timeRange || '1h');
    const cutoffTime = now.getTime() - rangeMs;
    
    // Filter metrics by time range
    const recentRequests = this.requestMetrics.filter(m => m.timestamp >= cutoffTime);
    const recentResponseTimes = this.responseTimeMetrics.filter(m => m.timestamp >= cutoffTime);
    const recentErrors = this.errorMetrics.filter(m => m.timestamp >= cutoffTime);
    
    // Calculate performance metrics
    const totalRequests = recentRequests.length;
    const successfulRequests = totalRequests - recentErrors.length;
    const failedRequests = recentErrors.length;
    const requestRate = totalRequests > 0 ? totalRequests / (rangeMs / 1000) : 0;
    
    const responseTimes = recentResponseTimes.map(m => m.value).sort((a, b) => a - b);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const percentiles = this.calculatePercentiles(responseTimes);
    
    // Get system metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Get data source metrics (mock data for now)
    const dataSources = await this.getDataSourceMetrics();
    
    // Get cache metrics
    const cacheMetrics = await this.getCacheMetrics();
    
    // Get WebSocket metrics
    const websocketMetrics = await this.getWebSocketMetrics();
    
    // Get validation metrics
    const validationMetrics = await this.getValidationMetrics();
    
    const metrics = {
      timestamp: now.toISOString(),
      interval: timeRange || '1h',
      service: {
        name: 'nfl-data-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime,
        startTime: new Date(this.startTime).toISOString()
      },
      performance: {
        requests: {
          total: totalRequests,
          successful: successfulRequests,
          failed: failedRequests,
          rate: Math.round(requestRate * 100) / 100,
          averageResponseTime: Math.round(avgResponseTime * 100) / 100,
          percentiles
        },
        cache: cacheMetrics,
        database: {
          connections: 1, // Mock data
          activeQueries: 0,
          queryTime: 50,
          slowQueries: 0
        }
      },
      data_sources: dataSources,
      websocket: websocketMetrics,
      validation: validationMetrics,
      system: {
        memory: {
          used: memoryUsage.heapUsed,
          free: memoryUsage.heapTotal - memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100 * 100) / 100
        },
        cpu: {
          usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000), // Convert to percentage approximation
          load: [0.5, 0.6, 0.4] // Mock load averages
        },
        eventLoop: {
          lag: 1.2, // Mock event loop lag
          utilization: 45 // Mock utilization percentage
        }
      },
      alerts: this.alerts.slice(-20) // Last 20 alerts
    };
    
    return metrics;
  }

  private parseTimeRange(range: string): number {
    const unit = range.slice(-1);
    const value = parseInt(range.slice(0, -1));
    
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000; // Default to 1 hour
    }
  }

  private calculatePercentiles(values: number[]): any {
    if (values.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }
    
    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * values.length) - 1;
      return values[Math.max(0, Math.min(index, values.length - 1))];
    };
    
    return {
      p50: Math.round(getPercentile(50) * 100) / 100,
      p90: Math.round(getPercentile(90) * 100) / 100,
      p95: Math.round(getPercentile(95) * 100) / 100,
      p99: Math.round(getPercentile(99) * 100) / 100
    };
  }

  private async getDataSourceMetrics(): Promise<Record<string, any>> {
    // In a real implementation, this would get metrics from ClientManager
    return {
      sportsio: {
        status: 'online',
        requests: 150,
        successes: 145,
        failures: 5,
        averageResponseTime: 320,
        circuitBreakerState: 'closed'
      },
      espn: {
        status: 'online',
        requests: 89,
        successes: 87,
        failures: 2,
        averageResponseTime: 180,
        circuitBreakerState: 'closed'
      },
      nfl_official: {
        status: 'degraded',
        requests: 67,
        successes: 60,
        failures: 7,
        averageResponseTime: 890,
        lastError: 'Timeout error',
        circuitBreakerState: 'half-open'
      },
      fantasy_data: {
        status: 'online',
        requests: 45,
        successes: 44,
        failures: 1,
        averageResponseTime: 250,
        circuitBreakerState: 'closed'
      }
    };
  }

  private async getCacheMetrics(): Promise<any> {
    try {
      // In a real implementation, this would get metrics from cacheManager
      return {
        hits: 1250,
        misses: 180,
        hitRate: 87.4,
        size: 15000,
        evictions: 45
      };
    } catch (error) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        evictions: 0
      };
    }
  }

  private async getWebSocketMetrics(): Promise<any> {
    try {
      // In a real implementation, this would get metrics from webSocketManager
      return {
        connections: 245,
        messagesSent: 5670,
        messagesQueued: 12,
        bandwidth: 125000, // bytes per second
        errors: 3
      };
    } catch (error) {
      return {
        connections: 0,
        messagesSent: 0,
        messagesQueued: 0,
        bandwidth: 0,
        errors: 0
      };
    }
  }

  private async getValidationMetrics(): Promise<any> {
    try {
      // In a real implementation, this would get metrics from DataValidator
      return {
        totalChecks: 2340,
        passed: 2298,
        failed: 15,
        warnings: 27,
        averageTime: 2.3
      };
    } catch (error) {
      return {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        averageTime: 0
      };
    }
  }

  clearAlerts(): number {
    const count = this.alerts.length;
    this.alerts = [];
    return count;
  }

  getRecentAlerts(count: number = 20): any[] {
    return this.alerts.slice(-count);
  }
}

// Initialize metrics collector
const metricsCollector = new MetricsCollector();

// GET /api/nfl/metrics - Get comprehensive metrics
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const startTime = Date.now();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const timeRange = searchParams.get('range') || '1h';
    const component = searchParams.get('component');
    
    // Collect metrics
    const metrics = await metricsCollector.getMetrics(timeRange);
    const collectionTime = Date.now() - startTime;
    
    // Record this request
    metricsCollector.recordRequest(collectionTime, true);
    
    // Filter by component if requested
    if (component) {
      const componentMetrics = {
        timestamp: metrics.timestamp,
        component,
        data: (metrics as any)[component] || null,
        collectionTime
      };
      
      if (!componentMetrics.data) {
        return NextResponse.json(
          { error: `Component '${component}' not found` },
          { status: 404 }
        );
      }
      
      return NextResponse.json(componentMetrics, {
        headers: {
          'X-Collection-Time': collectionTime.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // Return Prometheus format if requested
    if (format === 'prometheus') {
      const prometheusMetrics = generatePrometheusMetrics(metrics);
      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
    // Add collection time to response
    metrics.collectionTime = collectionTime;
    
    // Validate response
    const validatedMetrics = metricsSchema.parse(metrics);
    
    return NextResponse.json(validatedMetrics, {
      headers: {
        'X-Collection-Time': collectionTime.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Metrics collection error:', error);
    
    const collectionTime = Date.now();
    metricsCollector.recordRequest(collectionTime, false);
    
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        details: (error as Error).message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// DELETE /api/nfl/metrics/alerts - Clear alerts
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const clearedCount = metricsCollector.clearAlerts();
    
    return NextResponse.json({
      message: `Cleared ${clearedCount} alerts`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear alerts' },
      { status: 500 }
    );
  }
}

// Generate Prometheus metrics format
function generatePrometheusMetrics(metrics: any): string {
  const prometheusMetrics: string[] = [];
  
  // Service info
  prometheusMetrics.push(`# HELP nfl_service_uptime_seconds Service uptime in seconds`);
  prometheusMetrics.push(`# TYPE nfl_service_uptime_seconds counter`);
  prometheusMetrics.push(`nfl_service_uptime_seconds ${Math.floor(metrics.service.uptime / 1000)}`);
  
  // Request metrics
  prometheusMetrics.push(`# HELP nfl_requests_total Total number of requests`);
  prometheusMetrics.push(`# TYPE nfl_requests_total counter`);
  prometheusMetrics.push(`nfl_requests_total ${metrics.performance.requests.total}`);
  
  prometheusMetrics.push(`# HELP nfl_requests_successful_total Total number of successful requests`);
  prometheusMetrics.push(`# TYPE nfl_requests_successful_total counter`);
  prometheusMetrics.push(`nfl_requests_successful_total ${metrics.performance.requests.successful}`);
  
  prometheusMetrics.push(`# HELP nfl_requests_failed_total Total number of failed requests`);
  prometheusMetrics.push(`# TYPE nfl_requests_failed_total counter`);
  prometheusMetrics.push(`nfl_requests_failed_total ${metrics.performance.requests.failed}`);
  
  prometheusMetrics.push(`# HELP nfl_request_rate_per_second Current request rate per second`);
  prometheusMetrics.push(`# TYPE nfl_request_rate_per_second gauge`);
  prometheusMetrics.push(`nfl_request_rate_per_second ${metrics.performance.requests.rate}`);
  
  // Response time metrics
  prometheusMetrics.push(`# HELP nfl_response_time_ms Response time percentiles in milliseconds`);
  prometheusMetrics.push(`# TYPE nfl_response_time_ms summary`);
  prometheusMetrics.push(`nfl_response_time_ms{quantile="0.5"} ${metrics.performance.requests.percentiles.p50}`);
  prometheusMetrics.push(`nfl_response_time_ms{quantile="0.9"} ${metrics.performance.requests.percentiles.p90}`);
  prometheusMetrics.push(`nfl_response_time_ms{quantile="0.95"} ${metrics.performance.requests.percentiles.p95}`);
  prometheusMetrics.push(`nfl_response_time_ms{quantile="0.99"} ${metrics.performance.requests.percentiles.p99}`);
  
  // Cache metrics
  prometheusMetrics.push(`# HELP nfl_cache_hits_total Total cache hits`);
  prometheusMetrics.push(`# TYPE nfl_cache_hits_total counter`);
  prometheusMetrics.push(`nfl_cache_hits_total ${metrics.performance.cache.hits}`);
  
  prometheusMetrics.push(`# HELP nfl_cache_misses_total Total cache misses`);
  prometheusMetrics.push(`# TYPE nfl_cache_misses_total counter`);
  prometheusMetrics.push(`nfl_cache_misses_total ${metrics.performance.cache.misses}`);
  
  prometheusMetrics.push(`# HELP nfl_cache_hit_rate_percent Cache hit rate percentage`);
  prometheusMetrics.push(`# TYPE nfl_cache_hit_rate_percent gauge`);
  prometheusMetrics.push(`nfl_cache_hit_rate_percent ${metrics.performance.cache.hitRate}`);
  
  // Data source metrics
  Object.entries(metrics.data_sources).forEach(([source, sourceMetrics]: [string, any]) => {
    const statusValue = sourceMetrics.status === 'online' ? 1 : sourceMetrics.status === 'degraded' ? 0.5 : 0;
    
    prometheusMetrics.push(`nfl_data_source_status{source="${source}"} ${statusValue}`);
    prometheusMetrics.push(`nfl_data_source_requests_total{source="${source}"} ${sourceMetrics.requests}`);
    prometheusMetrics.push(`nfl_data_source_successes_total{source="${source}"} ${sourceMetrics.successes}`);
    prometheusMetrics.push(`nfl_data_source_failures_total{source="${source}"} ${sourceMetrics.failures}`);
    prometheusMetrics.push(`nfl_data_source_response_time_ms{source="${source}"} ${sourceMetrics.averageResponseTime}`);
  });
  
  // System metrics
  prometheusMetrics.push(`# HELP nfl_memory_usage_bytes Current memory usage in bytes`);
  prometheusMetrics.push(`# TYPE nfl_memory_usage_bytes gauge`);
  prometheusMetrics.push(`nfl_memory_usage_bytes ${metrics.system.memory.used}`);
  
  prometheusMetrics.push(`# HELP nfl_memory_usage_percent Current memory usage percentage`);
  prometheusMetrics.push(`# TYPE nfl_memory_usage_percent gauge`);
  prometheusMetrics.push(`nfl_memory_usage_percent ${metrics.system.memory.usage}`);
  
  // WebSocket metrics
  prometheusMetrics.push(`# HELP nfl_websocket_connections Current WebSocket connections`);
  prometheusMetrics.push(`# TYPE nfl_websocket_connections gauge`);
  prometheusMetrics.push(`nfl_websocket_connections ${metrics.websocket.connections}`);
  
  prometheusMetrics.push(`# HELP nfl_websocket_messages_sent_total Total WebSocket messages sent`);
  prometheusMetrics.push(`# TYPE nfl_websocket_messages_sent_total counter`);
  prometheusMetrics.push(`nfl_websocket_messages_sent_total ${metrics.websocket.messagesSent}`);
  
  return prometheusMetrics.join('\n') + '\n';
}

export { metricsCollector };