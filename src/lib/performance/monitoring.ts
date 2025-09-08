/**
 * High-Performance Monitoring System
 * Real-time metrics, performance monitoring, and observability for production scale
 */

import Redis from 'ioredis';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
  description?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  service: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime?: number;
  details?: Record<string, unknown>;
  dependencies?: HealthCheck[];
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  service: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// ADVANCED METRICS COLLECTOR
// =============================================================================

export class AdvancedMetricsCollector {
  private static instance: AdvancedMetricsCollector;
  private metrics: Map<string, Metric> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private metricQueue: Metric[] = [];
  private redis: Redis | null = null;
  private readonly maxQueueSize = 10000;
  private flushInterval: NodeJS.Timeout | null = null;
  private circuitBreaker = new Map<string, { failures: number; lastFailure: Date; open: boolean }>();

  private constructor() {
    this.initializeRedis();
    this.startAutoFlush();
    this.startCircuitBreakerCleanup();
  }

  public static getInstance(): AdvancedMetricsCollector {
    if (!AdvancedMetricsCollector.instance) {
      AdvancedMetricsCollector.instance = new AdvancedMetricsCollector();
    }
    return AdvancedMetricsCollector.instance;
  }

  private initializeRedis(): void {
    try {
      if (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL) {
        this.redis = new Redis(process.env.REDIS_URL || {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        });

        this.redis.on('error', (error) => {
          console.error('Redis connection error:', error);
          this.redis = null;
        });
      }
    } catch (error) {
      console.error('Failed to initialize Redis for metrics:', error);
      this.redis = null;
    }
  }

  // Circuit Breaker Pattern for resilient monitoring
  private isCircuitOpen(service: string): boolean {
    const circuit = this.circuitBreaker.get(service);
    if (!circuit) return false;
    
    // Reset circuit after 60 seconds
    if (circuit.open && Date.now() - circuit.lastFailure.getTime() > 60000) {
      circuit.open = false;
      circuit.failures = 0;
    }
    
    return circuit.open;
  }

  private recordFailure(service: string): void {
    const circuit = this.circuitBreaker.get(service) || { failures: 0, lastFailure: new Date(), open: false };
    circuit.failures++;
    circuit.lastFailure = new Date();
    
    if (circuit.failures >= 5) {
      circuit.open = true;
    }
    
    this.circuitBreaker.set(service, circuit);
  }

  private startCircuitBreakerCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [service, circuit] of this.circuitBreaker.entries()) {
        if (now - circuit.lastFailure.getTime() > 300000) { // 5 minutes
          this.circuitBreaker.delete(service);
        }
      }
    }, 60000); // Clean every minute
  }

  // Enhanced counter with Redis persistence
  public async incrementCounter(name: string, labels?: Record<string, string>, value: number = 1): Promise<void> {
    const key = this.buildMetricKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    const newValue = currentValue + value;

    this.counters.set(key, newValue);
    this.addMetric({
      name,
      type: MetricType.COUNTER,
      value: newValue,
      timestamp: new Date(),
      labels
    });

    // Persist to Redis if available
    if (this.redis && !this.isCircuitOpen('redis-metrics')) {
      try {
        await this.redis.zincrby('metrics:counters', value, key);
      } catch (error) {
        this.recordFailure('redis-metrics');
      }
    }
  }

  // Enhanced gauge with trend tracking
  public async setGauge(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    const key = this.buildMetricKey(name, labels);
    this.gauges.set(key, value);

    this.addMetric({
      name,
      type: MetricType.GAUGE,
      value,
      timestamp: new Date(),
      labels
    });

    // Store gauge history in Redis
    if (this.redis && !this.isCircuitOpen('redis-metrics')) {
      try {
        const timestamp = Date.now();
        await this.redis.zadd(`metrics:gauge:${key}`, timestamp, `${timestamp}:${value}`);
        // Keep only last 1000 entries
        await this.redis.zremrangebyrank(`metrics:gauge:${key}`, 0, -1001);
      } catch (error) {
        this.recordFailure('redis-metrics');
      }
    }
  }

  // Advanced histogram with percentile calculation
  public recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildMetricKey(name, labels);
    const values = this.histograms.get(key) || [];

    values.push(value);

    // Maintain sliding window of 10000 values
    if (values.length > 10000) {
      values.shift();
    }

    this.histograms.set(key, values);

    this.addMetric({
      name,
      type: MetricType.HISTOGRAM,
      value,
      timestamp: new Date(),
      labels
    });
  }

  // Get comprehensive histogram statistics
  public getHistogramStats(name: string, labels?: Record<string, string>): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    p99_9: number;
  } | null {
    const key = this.buildMetricKey(name, labels);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * count) - 1;
      return sorted[Math.max(0, index)];
    };

    return {
      count,
      sum,
      avg: sum / count,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: percentile(50),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99),
      p99_9: percentile(99.9)
    };
  }

  // Export metrics in Prometheus format
  public exportPrometheusFormat(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      const labelsStr = this.formatPrometheusLabels(metric.labels);
      const metricName = this.sanitizePrometheusName(metric.name);
      
      lines.push(`# TYPE ${metricName} ${metric.type}`);
      lines.push(`${metricName}${labelsStr} ${metric.value} ${metric.timestamp.getTime()}`);
    }

    return lines.join('\n');
  }

  private formatPrometheusLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');
    
    return `{${labelPairs}}`;
  }

  private sanitizePrometheusName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_:]/g, '_');
  }

  private addMetric(metric: Metric): void {
    const key = this.buildMetricKey(metric.name, metric.labels);
    this.metrics.set(key, metric);

    this.metricQueue.push(metric);

    if (this.metricQueue.length > this.maxQueueSize) {
      this.metricQueue.shift();
    }
  }

  private buildMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const sortedLabels = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');

    return `${name}{${sortedLabels}}`;
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000); // Flush every 30 seconds
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricQueue.length === 0) return;

    try {
      if (process.env.NODE_ENV === 'production' && process.env.METRICS_ENDPOINT) {
        await this.sendMetricsToEndpoint(this.metricQueue);
      }

      this.metricQueue = [];
    } catch (error) {
      console.error('Failed to flush metrics', error);
    }
  }

  private async sendMetricsToEndpoint(metrics: Metric[]): Promise<void> {
    try {
      const response = await fetch(process.env.METRICS_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.METRICS_API_KEY || ''}`
        },
        body: JSON.stringify({ metrics, timestamp: Date.now() })
      });

      if (!response.ok) {
        throw new Error(`Failed to send metrics: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending metrics to endpoint', error);
      throw error;
    }
  }

  public async getMetricsFromRedis(pattern: string): Promise<Metric[]> {
    if (!this.redis) return [];
    
    try {
      const keys = await this.redis.keys(`metrics:*${pattern}*`);
      const pipeline = this.redis.pipeline();
      
      for (const key of keys) {
        pipeline.get(key);
      }
      
      const results = await pipeline.exec();
      return results?.map(([err, value]) => {
        if (err || !value) return null;
        try {
          return JSON.parse(value as string) as Metric;
        } catch {
          return null;
        }
      }).filter(Boolean) as Metric[] || [];
    } catch (error) {
      this.recordFailure('redis-metrics');
      return [];
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }
  }
}

// =============================================================================
// ENHANCED LOGGER WITH STRUCTURED LOGGING
// =============================================================================

export class StructuredLogger {
  private static instance: StructuredLogger;
  private logQueue: LogEntry[] = [];
  private readonly maxQueueSize = 5000;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly serviceName: string;
  private redis: Redis | null = null;

  private constructor(serviceName: string = 'astral-field') {
    this.serviceName = serviceName;
    this.initializeRedis();
    this.startAutoFlush();
  }

  public static getInstance(serviceName?: string): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger(serviceName);
    }
    return StructuredLogger.instance;
  }

  private initializeRedis(): void {
    try {
      if (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL) {
        this.redis = new Redis(process.env.REDIS_URL || {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        });
      }
    } catch (error) {
      console.error('Failed to initialize Redis for logging:', error);
      this.redis = null;
    }
  }

  // Enhanced logging methods with context
  public debug(message: string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void {
    this.log(LogLevel.DEBUG, message, metadata, requestId, userId);
  }

  public info(message: string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void {
    this.log(LogLevel.INFO, message, metadata, requestId, userId);
  }

  public warn(message: string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void {
    this.log(LogLevel.WARN, message, metadata, requestId, userId);
  }

  public error(message: string, error?: Error, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    } : undefined;

    this.log(LogLevel.ERROR, message, metadata, requestId, userId, errorData);
  }

  public fatal(message: string, error?: Error, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    } : undefined;

    this.log(LogLevel.FATAL, message, metadata, requestId, userId, errorData);
  }

  // Log with correlation tracking
  public async logWithCorrelation(
    level: LogLevel,
    message: string,
    correlationId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const enhancedMetadata = {
      ...metadata,
      correlationId,
      traceId: correlationId.split('-')[0] // Extract trace ID
    };

    this.log(level, message, enhancedMetadata);

    // Store correlation in Redis for distributed tracing
    if (this.redis) {
      try {
        await this.redis.setex(
          `trace:${correlationId}`,
          3600, // 1 hour TTL
          JSON.stringify({ level, message, timestamp: new Date().toISOString(), metadata: enhancedMetadata })
        );
      } catch (error) {
        console.error('Failed to store correlation data', error);
      }
    }
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    requestId?: string,
    userId?: string,
    error?: unknown
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      service: this.serviceName,
      requestId,
      userId,
      metadata: {
        ...metadata,
        pid: process.pid,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      },
      error
    };

    this.logQueue.push(entry);

    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift();
    }

    if (process.env.NODE_ENV === 'development' || process.env.LOG_CONSOLE === 'true') {
      this.consoleOutput(entry);
    }

    if (level === LogLevel.FATAL) {
      this.flushLogs();
    }
  }

  private consoleOutput(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.service}]`;
    let output = `${prefix} ${entry.message}`;

    if (entry.requestId) {
      output += ` (req: ${entry.requestId})`;
    }

    if (entry.userId) {
      output += ` (user: ${entry.userId})`;
    }

    const logData = {
      ...entry.metadata,
      ...(entry.error && { error: entry.error })
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(output, logData);
        break;
      case LogLevel.INFO:
        console.info(output, logData);
        break;
      case LogLevel.WARN:
        console.warn(output, logData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output, logData);
        break;
    }
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 15000); // Flush every 15 seconds
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    try {
      if (process.env.NODE_ENV === 'production' && process.env.LOG_ENDPOINT) {
        await this.sendLogsToEndpoint(this.logQueue);
      }

      // Store in Redis for log aggregation
      if (this.redis && this.logQueue.length > 0) {
        const pipeline = this.redis.pipeline();
        
        for (const log of this.logQueue) {
          const key = `logs:${log.level}:${Date.now()}:${Math.random()}`;
          pipeline.setex(key, 86400, JSON.stringify(log)); // 24 hour TTL
        }
        
        await pipeline.exec();
      }

      this.logQueue = [];
    } catch (error) {
      console.error('Failed to flush logs', error);
    }
  }

  private async sendLogsToEndpoint(logs: LogEntry[]): Promise<void> {
    try {
      const response = await fetch(process.env.LOG_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOG_API_KEY || ''}`
        },
        body: JSON.stringify({ logs, timestamp: Date.now() })
      });

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending logs to endpoint', error);
      throw error;
    }
  }

  public async getRecentLogs(level?: LogLevel, limit: number = 100): Promise<LogEntry[]> {
    if (!this.redis) return [];

    try {
      const pattern = level ? `logs:${level}:*` : 'logs:*';
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) return [];
      
      // Sort keys by timestamp (newest first)
      const sortedKeys = keys.sort().reverse().slice(0, limit);
      const logs = await this.redis.mget(...sortedKeys);
      
      return logs
        .filter(Boolean)
        .map(log => {
          try {
            return JSON.parse(log!) as LogEntry;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as LogEntry[];
    } catch (error) {
      console.error('Failed to retrieve logs from Redis', error);
      return [];
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }
  }
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

export const metrics = AdvancedMetricsCollector.getInstance();
export const logger = StructuredLogger.getInstance();

// =============================================================================
// DECORATOR FOR METHOD MONITORING
// =============================================================================

export function monitorPerformance(operation: string, threshold?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();

      await metrics.incrementCounter('operations_started', { operation });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        await metrics.incrementCounter('operations_completed', { operation, success: 'true' });
        metrics.recordHistogram('operation_duration_ms', duration, { operation });

        if (threshold && duration > threshold) {
          logger.warn(`Slow operation detected: ${operation}`, {
            duration,
            threshold,
            operationId,
            class: target.constructor.name,
            method: propertyKey
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        await metrics.incrementCounter('operations_completed', { operation, success: 'false' });
        metrics.recordHistogram('operation_duration_ms', duration, { operation, success: 'false' });

        logger.error(`Operation failed: ${operation}`, error as Error, {
          duration,
          operationId,
          class: target.constructor.name,
          method: propertyKey
        });

        throw error;
      }
    };

    return descriptor;
  };
}

// =============================================================================
// CLEANUP FUNCTION
// =============================================================================

export function destroyMonitoring(): void {
  metrics.destroy();
  logger.destroy();
}

// Register cleanup on process exit
process.on('SIGINT', destroyMonitoring);
process.on('SIGTERM', destroyMonitoring);

export default {
  metrics,
  logger,
  monitorPerformance,
  destroyMonitoring
};