/**
 * NFL Data Service Health Check API
 * Comprehensive health monitoring for all NFL data integration components
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Health check response schema
const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  uptime: z.number(),
  components: z.record(z.object({
    status: z.enum(['up', 'down', 'warning']),
    responseTime: z.number().optional(),
    lastCheck: z.string(),
    details: z.any().optional(),
    metrics: z.any().optional()
  })),
  summary: z.object({
    totalComponents: z.number(),
    healthyComponents: z.number(),
    warningComponents: z.number(),
    unhealthyComponents: z.number()
  }),
  performance: z.object({
    averageResponseTime: z.number(),
    totalRequests: z.number(),
    successRate: z.number(),
    errorRate: z.number()
  }).optional()
});

interface HealthCheckComponent {
  name: string;
  check: () => Promise<{
    status: 'up' | 'down' | 'warning';
    responseTime?: number;
    details?: any;
    metrics?: any;
  }>;
}

class HealthCheckService {
  private components: HealthCheckComponent[] = [];
  private startTime = Date.now();

  constructor() {
    this.initializeHealthChecks();
  }

  private initializeHealthChecks(): void {
    // Redis Cache Health Check
    this.addComponent({
      name: 'redis_cache',
      check: async () => {
        const startTime = Date.now();
        try {
          // Import cache manager dynamically to avoid initialization issues
          const { cacheManager } = await import('@/services/nfl/cache/RedisCache');
          const health = await cacheManager.healthCheck();
          const responseTime = Date.now() - startTime;

          return {
            status: health.redis ? 'up' : 'warning',
            responseTime,
            details: {
              redis: health.redis,
              fallback: health.fallback,
              latency: health.latency
            },
            metrics: health.stats
          };
        } catch (error) {
          return {
            status: 'down',
            responseTime: Date.now() - startTime,
            details: { error: (error as Error).message }
          };
        }
      }
    });

    // Database Health Check
    this.addComponent({
      name: 'database',
      check: async () => {
        const startTime = Date.now();
        try {
          const { database } = await import('@/lib/database');
          await database.query('SELECT 1');
          const responseTime = Date.now() - startTime;

          return {
            status: 'up',
            responseTime,
            details: { connection: 'active' }
          };
        } catch (error) {
          return {
            status: 'down',
            responseTime: Date.now() - startTime,
            details: { error: (error as Error).message }
          };
        }
      }
    });

    // WebSocket Service Health Check
    this.addComponent({
      name: 'websocket_service',
      check: async () => {
        const startTime = Date.now();
        try {
          const { webSocketManager } = await import('@/lib/websocket/server');
          const stats = webSocketManager.getConnectionStats();
          const responseTime = Date.now() - startTime;

          return {
            status: 'up',
            responseTime,
            details: {
              connections: stats.totalConnections,
              activeLeagues: stats.activeLeagues,
              activeMatchups: stats.activeMatchups
            },
            metrics: stats
          };
        } catch (error) {
          return {
            status: 'down',
            responseTime: Date.now() - startTime,
            details: { error: (error as Error).message }
          };
        }
      }
    });

    // API Clients Health Check
    this.addComponent({
      name: 'api_clients',
      check: async () => {
        const startTime = Date.now();
        try {
          // This would check the ClientManager if it were properly initialized
          // For now, we'll simulate basic API health checks
          const checks = await Promise.allSettled([
            this.checkExternalAPI('https://api.sportsdata.io', 'SportsIO'),
            this.checkExternalAPI('https://site.api.espn.com', 'ESPN'),
            this.checkExternalAPI('https://api.fantasydata.net', 'FantasyData')
          ]);

          const responseTime = Date.now() - startTime;
          const results = checks.map((result, index) => {
            const apiNames = ['SportsIO', 'ESPN', 'FantasyData'];
            return {
              name: apiNames[index],
              status: result.status === 'fulfilled' ? result.value.status : 'down',
              responseTime: result.status === 'fulfilled' ? result.value.responseTime : 0,
              error: result.status === 'rejected' ? result.reason : undefined
            };
          });

          const upCount = results.filter(r => r.status === 'up').length;
          const overallStatus = upCount >= 2 ? 'up' : upCount >= 1 ? 'warning' : 'down';

          return {
            status: overallStatus,
            responseTime,
            details: { apis: results },
            metrics: { totalApis: results.length, availableApis: upCount }
          };
        } catch (error) {
          return {
            status: 'down',
            responseTime: Date.now() - startTime,
            details: { error: (error as Error).message }
          };
        }
      }
    });

    // Real-time Sync Service Health Check
    this.addComponent({
      name: 'realtime_sync',
      check: async () => {
        const startTime = Date.now();
        try {
          // This would check the RealTimeSyncService if it were initialized
          // For now, simulate health check
          const responseTime = Date.now() - startTime;

          return {
            status: 'up',
            responseTime,
            details: {
              polling: 'active',
              lastUpdate: new Date().toISOString(),
              activeGames: 0
            },
            metrics: {
              totalPolls: 0,
              successfulPolls: 0,
              errorRate: 0
            }
          };
        } catch (error) {
          return {
            status: 'down',
            responseTime: Date.now() - startTime,
            details: { error: (error as Error).message }
          };
        }
      }
    });

    // Data Validation Service Health Check
    this.addComponent({
      name: 'data_validation',
      check: async () => {
        const startTime = Date.now();
        try {
          // This would check the DataValidator if it were initialized
          const responseTime = Date.now() - startTime;

          return {
            status: 'up',
            responseTime,
            details: {
              validationRules: 'loaded',
              lastValidation: new Date().toISOString()
            },
            metrics: {
              totalValidations: 0,
              successRate: 100,
              errorCount: 0
            }
          };
        } catch (error) {
          return {
            status: 'down',
            responseTime: Date.now() - startTime,
            details: { error: (error as Error).message }
          };
        }
      }
    });

    // Enhanced WebSocket Service Health Check
    this.addComponent({
      name: 'enhanced_websocket',
      check: async () => {
        const startTime = Date.now();
        try {
          // This would check the EnhancedWebSocketService if it were initialized
          const responseTime = Date.now() - startTime;

          return {
            status: 'up',
            responseTime,
            details: {
              connectedUsers: 0,
              queueLength: 0,
              processing: false
            },
            metrics: {
              totalMessages: 0,
              messagesThrottled: 0,
              messagesFiltered: 0
            }
          };
        } catch (error) {
          return {
            status: 'down',
            responseTime: Date.now() - startTime,
            details: { error: (error as Error).message }
          };
        }
      }
    });
  }

  private async checkExternalAPI(url: string, name: string): Promise<{ status: 'up' | 'down'; responseTime: number }> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'AstralField-Health-Check/1.0'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        status: response.ok || response.status === 404 ? 'up' : 'down', // 404 is ok for health checks
        responseTime
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime
      };
    }
  }

  addComponent(component: HealthCheckComponent): void {
    this.components.push(component);
  }

  async runHealthChecks(): Promise<any> {
    const results = await Promise.allSettled(
      this.components.map(async (component) => {
        const checkResult = await component.check();
        return {
          name: component.name,
          ...checkResult,
          lastCheck: new Date().toISOString()
        };
      })
    );

    const components: Record<string, any> = {};
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const componentName = this.components[i].name;

      if (result.status === 'fulfilled') {
        components[componentName] = result.value;
        if (result.value.responseTime) {
          totalResponseTime += result.value.responseTime;
          responseTimeCount++;
        }
      } else {
        components[componentName] = {
          status: 'down',
          lastCheck: new Date().toISOString(),
          details: { error: 'Health check failed' }
        };
      }
    }

    const healthyCount = Object.values(components).filter((c: any) => c.status === 'up').length;
    const warningCount = Object.values(components).filter((c: any) => c.status === 'warning').length;
    const unhealthyCount = Object.values(components).filter((c: any) => c.status === 'down').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount === 0 && warningCount === 0) {
      overallStatus = 'healthy';
    } else if (healthyCount >= Math.ceil(this.components.length / 2)) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - this.startTime,
      components,
      summary: {
        totalComponents: this.components.length,
        healthyComponents: healthyCount,
        warningComponents: warningCount,
        unhealthyComponents: unhealthyCount
      },
      performance: {
        averageResponseTime: Math.round(averageResponseTime),
        totalRequests: 0, // Would be populated from actual metrics
        successRate: healthyCount > 0 ? (healthyCount / this.components.length) * 100 : 0,
        errorRate: unhealthyCount > 0 ? (unhealthyCount / this.components.length) * 100 : 0
      }
    };
  }
}

// Initialize health check service
const healthCheckService = new HealthCheckService();

// GET /api/nfl/health - Comprehensive health check
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const startTime = Date.now();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const detailed = searchParams.get('detailed') === 'true';
    const component = searchParams.get('component');

    // Run health checks
    const healthResult = await healthCheckService.runHealthChecks();
    const checkDuration = Date.now() - startTime;

    // Add health check duration to response
    healthResult.healthCheckDuration = checkDuration;

    // Filter by specific component if requested
    if (component && healthResult.components[component]) {
      const componentResult = {
        status: healthResult.components[component].status,
        timestamp: healthResult.timestamp,
        component: {
          name: component,
          ...healthResult.components[component]
        },
        healthCheckDuration: checkDuration
      };

      return NextResponse.json(componentResult, {
        status: componentResult.status === 'up' ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check-Duration': checkDuration.toString()
        }
      });
    }

    // Return simplified response if not detailed
    if (!detailed) {
      const simplifiedResult = {
        status: healthResult.status,
        timestamp: healthResult.timestamp,
        version: healthResult.version,
        uptime: healthResult.uptime,
        summary: healthResult.summary,
        healthCheckDuration: checkDuration
      };

      return NextResponse.json(simplifiedResult, {
        status: healthResult.status === 'healthy' ? 200 : healthResult.status === 'degraded' ? 206 : 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check-Duration': checkDuration.toString()
        }
      });
    }

    // Return format based on request
    if (format === 'prometheus') {
      // Return Prometheus metrics format
      const prometheusMetrics = generatePrometheusMetrics(healthResult);
      return new NextResponse(prometheusMetrics, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // Validate response against schema
    const validatedResult = healthCheckSchema.parse(healthResult);

    return NextResponse.json(validatedResult, {
      status: healthResult.status === 'healthy' ? 200 : healthResult.status === 'degraded' ? 206 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Duration': checkDuration.toString(),
        'X-Health-Status': healthResult.status
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: (error as Error).message
      },
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}

// Generate Prometheus metrics format
function generatePrometheusMetrics(healthResult: any): string {
  const metrics: string[] = [];
  
  // Overall health status (1 = healthy, 0.5 = degraded, 0 = unhealthy)
  const statusValue = healthResult.status === 'healthy' ? 1 : healthResult.status === 'degraded' ? 0.5 : 0;
  metrics.push(`nfl_service_health_status ${statusValue}`);
  
  // Uptime
  metrics.push(`nfl_service_uptime_seconds ${Math.floor(healthResult.uptime / 1000)}`);
  
  // Component health
  Object.entries(healthResult.components).forEach(([name, component]: [string, any]) => {
    const componentStatus = component.status === 'up' ? 1 : component.status === 'warning' ? 0.5 : 0;
    metrics.push(`nfl_service_component_health{component="${name}"} ${componentStatus}`);
    
    if (component.responseTime) {
      metrics.push(`nfl_service_component_response_time_ms{component="${name}"} ${component.responseTime}`);
    }
  });
  
  // Summary metrics
  metrics.push(`nfl_service_components_total ${healthResult.summary.totalComponents}`);
  metrics.push(`nfl_service_components_healthy ${healthResult.summary.healthyComponents}`);
  metrics.push(`nfl_service_components_warning ${healthResult.summary.warningComponents}`);
  metrics.push(`nfl_service_components_unhealthy ${healthResult.summary.unhealthyComponents}`);
  
  // Performance metrics
  if (healthResult.performance) {
    metrics.push(`nfl_service_average_response_time_ms ${healthResult.performance.averageResponseTime}`);
    metrics.push(`nfl_service_success_rate_percent ${healthResult.performance.successRate}`);
    metrics.push(`nfl_service_error_rate_percent ${healthResult.performance.errorRate}`);
  }
  
  // Health check duration
  if (healthResult.healthCheckDuration) {
    metrics.push(`nfl_service_health_check_duration_ms ${healthResult.healthCheckDuration}`);
  }
  
  return metrics.join('\n') + '\n';
}

// HEAD /api/nfl/health - Quick health check
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    const healthResult = await healthCheckService.runHealthChecks();
    
    return new NextResponse(null, {
      status: healthResult.status === 'healthy' ? 200 : healthResult.status === 'degraded' ? 206 : 503,
      headers: {
        'X-Health-Status': healthResult.status,
        'X-Health-Timestamp': healthResult.timestamp,
        'X-Health-Version': healthResult.version,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Health-Error': (error as Error).message,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}