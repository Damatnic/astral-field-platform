import { getCacheManager } from './cache-manager'

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  service: string
  endpoint?: string
  message: string
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
  }
  performance?: {
    duration: number
    memoryUsage?: NodeJS.MemoryUsage
  }
  request?: {
    method: string
    path: string
    userAgent?: string
    ip?: string
    params?: Record<string, any>
  }
}

export interface ApiMetrics {
  endpoint: string
  method: string
  statusCode: number
  duration: number
  timestamp: string
  error?: string
  cacheHit?: boolean
}

class ProductionMonitor {
  private cache = getCacheManager()
  private readonly LOG_RETENTION_HOURS = 24
  private readonly METRICS_RETENTION_HOURS = 168 // 1 week

  // Enhanced logging with structured format
  async log(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    }

    // Console output for development
    if (process.env.NODE_ENV !== 'production') {
      const color = this.getLogColor(entry.level)
      console.log(`${color}[${entry.level.toUpperCase()}] ${entry.service}${entry.endpoint ? `/${entry.endpoint}` : ''}: ${entry.message}`)
      if (entry.metadata) console.log('Metadata:', entry.metadata)
      if (entry.error) console.error('Error:', entry.error)
    }

    // Store in cache for production monitoring
    try {
      const key = `log:${entry.service}:${Date.now()}`
      await this.cache.set(key, logEntry, this.LOG_RETENTION_HOURS * 3600)
    } catch (error) {
      console.error('Failed to store log entry:', error)
    }
  }

  // Track API performance metrics
  async trackApiMetrics(metrics: ApiMetrics): Promise<void> {
    try {
      // Store individual metric
      const key = `metrics:${metrics.endpoint}:${Date.now()}`
      await this.cache.set(key, metrics, this.METRICS_RETENTION_HOURS * 3600)

      // Update endpoint statistics
      await this.updateEndpointStats(metrics)
    } catch (error) {
      console.error('Failed to track API metrics:', error)
    }
  }

  // Get performance statistics for an endpoint
  async getEndpointStats(endpoint: string): Promise<{
    totalRequests: number
    averageDuration: number
    errorRate: number
    lastHour: { requests: number; errors: number }
  } | null> {
    try {
      const key = `stats:${endpoint}`
      return await this.cache.get(key)
    } catch (error) {
      console.error('Failed to get endpoint stats:', error)
      return null
    }
  }

  // Update running statistics for an endpoint
  private async updateEndpointStats(metrics: ApiMetrics): Promise<void> {
    const key = `stats:${metrics.endpoint}`
    const existing = await this.cache.get(key) || {
      totalRequests: 0,
      totalDuration: 0,
      totalErrors: 0,
      lastHour: { requests: 0, errors: 0, timestamp: Date.now() }
    }

    // Update totals
    existing.totalRequests++
    existing.totalDuration += metrics.duration
    if (metrics.statusCode >= 400) {
      existing.totalErrors++
    }

    // Update hourly stats (reset if more than an hour old)
    const hourAgo = Date.now() - (60 * 60 * 1000)
    if (existing.lastHour.timestamp < hourAgo) {
      existing.lastHour = { requests: 1, errors: 0, timestamp: Date.now() }
    } else {
      existing.lastHour.requests++
    }

    if (metrics.statusCode >= 400) {
      existing.lastHour.errors++
    }

    // Calculate derived metrics
    const stats = {
      totalRequests: existing.totalRequests,
      averageDuration: existing.totalDuration / existing.totalRequests,
      errorRate: existing.totalErrors / existing.totalRequests,
      lastHour: existing.lastHour
    }

    await this.cache.set(key, { ...existing, ...stats }, this.METRICS_RETENTION_HOURS * 3600)
  }

  // Health check for monitoring system
  async health(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      const cacheHealth = await this.cache.health()
      
      // Test logging functionality
      await this.log({
        level: 'debug',
        service: 'monitoring',
        message: 'Health check test'
      })

      return {
        status: cacheHealth.status === 'healthy' ? 'healthy' : 'degraded',
        details: {
          cache: cacheHealth,
          logging: true,
          metrics: true
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message
        }
      }
    }
  }

  private getLogColor(level: string): string {
    const colors: Record<string, string> = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m'    // Gray
    }
    return colors[level] || '\x1b[0m' // Reset
  }
}

// Singleton instance
let monitorInstance: ProductionMonitor | null = null

export function getMonitor(): ProductionMonitor {
  if (!monitorInstance) {
    monitorInstance = new ProductionMonitor()
  }
  return monitorInstance
}

// Middleware wrapper for API routes
export function withMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  config: {
    service: string
    endpoint: string
    enableMetrics?: boolean
  }
) {
  return async function monitoredHandler(req: any, res: any): Promise<R> {
    const monitor = getMonitor()
    const startTime = Date.now()

    try {
      // Log request start
      await monitor.log({
        level: 'info',
        service: config.service,
        endpoint: config.endpoint,
        message: `Request started: ${req.method} ${config.endpoint}`,
        request: {
          method: req.method,
          path: config.endpoint,
          userAgent: req.headers?.['user-agent'],
          ip: req.ip || req.connection?.remoteAddress,
          params: req.method === 'GET' ? req.query : req.body
        }
      })

      // Execute handler
      const result = await handler(req, res)
      const duration = Date.now() - startTime

      // Log successful completion
      await monitor.log({
        level: 'info',
        service: config.service,
        endpoint: config.endpoint,
        message: `Request completed successfully`,
        performance: { duration }
      })

      // Track metrics if enabled
      if (config.enableMetrics !== false) {
        await monitor.trackApiMetrics({
          endpoint: config.endpoint,
          method: req.method,
          statusCode: res.statusCode || 200,
          duration,
          timestamp: new Date().toISOString()
        })
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      // Log error
      await monitor.log({
        level: 'error',
        service: config.service,
        endpoint: config.endpoint,
        message: `Request failed: ${(error as Error).message}`,
        error: {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        },
        performance: { duration }
      })

      // Track error metrics
      if (config.enableMetrics !== false) {
        await monitor.trackApiMetrics({
          endpoint: config.endpoint,
          method: req.method,
          statusCode: 500,
          duration,
          timestamp: new Date().toISOString(),
          error: (error as Error).message
        })
      }

      throw error
    }
  }
}

// Utility for manual error reporting
export async function reportError(error: Error, context: {
  service: string
  endpoint?: string
  metadata?: Record<string, any>
}): Promise<void> {
  const monitor = getMonitor()
  await monitor.log({
    level: 'error',
    service: context.service,
    endpoint: context.endpoint,
    message: error.message,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    metadata: context.metadata
  })
}

export default getMonitor