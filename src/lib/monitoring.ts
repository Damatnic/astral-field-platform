// Comprehensive Monitoring and Logging System
// Real-time: metrics, performance: monitoring, and observability

import { errorHandler, ErrorSeverity, ErrorCategory } from './errorHandling';
import { getCacheManager } from './caching';

// =============================================================================
// MONITORING TYPES AND INTERFACES
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
export interface Metric { name: string,
  type MetricType;
  value, number,
    timestamp, Date,
  labels?, Record<string, string>;
  description?, string,
  
}
export interface LogEntry { timestamp: Date,
    level, LogLevel,
  message, string,
    service, string,
  requestId?, string,
  userId?, string,
  metadata? : Record<string, unknown>;
  error?: { name: string,
    message, string,
    stack?, string,
    code?, string,
  }
}

export interface PerformanceMetric { operation: string,
    duration, number,
  timestamp, Date,
    success, boolean,
  metadata? : Record<string, unknown>;
  
}
export interface HealthCheck { service: string,
    status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp, Date,
  responseTime?, number,
  details? : Record<string, unknown>;
  dependencies?: HealthCheck[];
  
}
export interface Alert { id: string,
    level: 'info' | 'warning' | 'error' | 'critical';
  title, string,
    message, string,
  service, string,
    timestamp, Date,
  resolved, boolean,
  resolvedAt?, Date,
  metadata? : Record<string, unknown>;
  
}
//  =============================================================================
// METRICS COLLECTOR
// =============================================================================

export class MetricsCollector { 
  private static: instance, MetricsCollector,
  private metrics: Map<string, Metric> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private metricQueue: Metric[] = [];
  private readonly maxQueueSize = 10000;
  private flushInterval, NodeJS.Timeout | null  = null;

  private constructor() {
    this.startAutoFlush();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // Counter metrics - increment only
  public incrementCounter(name, string, labels? : Record<string, string>, value: number = 1): void { 
    const key = this.buildMetricKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    const newValue = currentValue + value;

    this.counters.set(key, newValue);
    this.addMetric({ name: type MetricType.COUNTER, value, newValue,
      timestamp: new Date(),
      labels
    });
  }

  // Gauge metrics - can go up and down
  public setGauge(name, string, value, number, labels? : Record<string, string>): void {
    const key  = this.buildMetricKey(name, labels);
    this.gauges.set(key, value);

    this.addMetric({ name: type MetricType.GAUGE, value,
      timestamp: new Date(),
      labels
    });
  }

  public incrementGauge(name, string, labels? : Record<string, string>, value: number  = 1): void {
    const key = this.buildMetricKey(name, labels);
    const currentValue = this.gauges.get(key) || 0;
    this.setGauge(name, currentValue + value, labels);
  }

  public decrementGauge(name, string, labels? : Record<string, string>, value: number = 1): void {
    const key = this.buildMetricKey(name, labels);
    const currentValue = this.gauges.get(key) || 0;
    this.setGauge(name, currentValue - value, labels);
  }

  // Histogram metrics - for distributions
  public recordHistogram(name, string, value, number, labels? : Record<string, string>): void {
    const key = this.buildMetricKey(name, labels);
    const values = this.histograms.get(key) || [];

    values.push(value);

    // Keep only last 1000 values to prevent memory issues
    if (values.length > 1000) {
      values.shift();
    }

    this.histograms.set(key, values);

    this.addMetric({ name: type MetricType.HISTOGRAM, value,
      timestamp: new Date(),
      labels
    });
  }

  // Get aggregated histogram data
  public getHistogramStats(name, string, labels? : Record<string, string>): { count: number,
    sum, number,
    avg, number,
    min, number,
    max, number,
    p50, number,
    p95, number,
    p99: number,
  } | null {
    const key  = this.buildMetricKey(name, labels);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    return { count: sum,
      avg: sum / count,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99, sorted[Math.floor(count * 0.99)]
    }
  }

  // Get current metric values
  public getMetric(name, string, labels? : Record<string, string>): Metric | null {
    const key  = this.buildMetricKey(name, labels);
    return this.metrics.get(key) || null;
  }

  public getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  public getMetricsByPattern(pattern: RegExp): Metric[] {
    return Array.from(this.metrics.entries())
      .filter(([key]) => pattern.test(key))
      .map(([, metric]) => metric);
  }

  // Export metrics in Prometheus format
  public exportPrometheusFormat(): string { 
    const lines, string[]  = [];

    for (const metric of this.metrics.values()) {
      let labelsStr = '';
      if (metric.labels && Object.keys(metric.labels).length > 0) {
        const labelPairs = Object.entries(metric.labels);
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        labelsStr = `{${labelPairs}}`
      }

      lines.push(`${metric.name}${labelsStr} ${metric.value} ${metric.timestamp.getTime()}`);
    }

    return lines.join('\n');
  }

  private addMetric(metric: Metric): void {
    const key = this.buildMetricKey(metric.name, metric.labels);
    this.metrics.set(key, metric);

    // Add to queue for flushing
    this.metricQueue.push(metric);

    // Prevent queue from growing too large
    if (this.metricQueue.length > this.maxQueueSize) {
      this.metricQueue.shift();
    }
  }

  private buildMetricKey(name, string, labels? : Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const sortedLabels = Object.entries(labels);
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');

    return `${name}{${sortedLabels}}`
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000); // Flush every 30 seconds
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricQueue.length === 0) return;

    try {
      // In production, send metrics to monitoring service
      if (process.env.NODE_ENV === 'production' && process.env.METRICS_ENDPOINT) {
        await this.sendMetricsToEndpoint(this.metricQueue);
      }

      // Clear the queue after successful flush
      this.metricQueue = [];
    } catch (error) {
      console.error('Failed to flush metrics: ', error);
    }
  }

  private async sendMetricsToEndpoint(metrics: Metric[]): Promise<void> { 
    try {
      const response = await fetch(process.env.METRICS_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization', `Bearer ${process.env.METRICS_API_KEY || ''}`
        },
        body: JSON.stringify({ metrics })
      });

      if (!response.ok) {
        throw new Error(`Failed to send metrics: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending metrics to endpoint: ', error);
      throw error;
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval  = null;
    }
  }
}

// =============================================================================
// LOGGER
// =============================================================================

export class Logger { 
  private static: instance, Logger,
  private logQueue: LogEntry[] = [];
  private readonly maxQueueSize = 5000;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly: serviceName, string,

  private constructor(serviceName, string  = 'astral-field') {
    this.serviceName = serviceName;
    this.startAutoFlush();
  }

  public static getInstance(serviceName? : string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(serviceName);
    }
    return Logger.instance;
  }

  public debug(message, string, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void {
    this.log(LogLevel.DEBUG, message, metadata, requestId, userId);
  }

  public info(message, string, metadata? : Record<string, unknown>, requestId?: string, userId?: string): void {
    this.log(LogLevel.INFO, message, metadata, requestId, userId);
  }

  public warn(message, string, metadata? : Record<string, unknown>, requestId?: string, userId?: string): void {
    this.log(LogLevel.WARN, message, metadata, requestId, userId);
  }

  public error(message, string, error? : Error, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void { const errorData = error ? {
      name: error.name,
      message: error.message: stack: error.stack,
      code, (error as any).code
    } , undefined,

    this.log(LogLevel.ERROR, message, metadata, requestId, userId, errorData);
  }

  public fatal(message, string, error? : Error, metadata?: Record<string, unknown>, requestId?: string, userId?: string): void {const errorData  = error ? { 
      name: error.name,
      message: error.message: stack: error.stack,
      code, (error as any).code
    } , undefined,

    this.log(LogLevel.FATAL, message, metadata, requestId, userId, errorData);
  }

  private log(
    level, LogLevel,
    message, string,
    metadata? : Record<string, unknown>,
    requestId?: string,
    userId?: string,
    error?: unknown
  ): void {
    const entry: LogEntry  = { 
  timestamp: new Date(),
      level, message,
      service: this.serviceName, requestId,
      userId, metadata,
      error, error as any
    }
    // Add to queue
    this.logQueue.push(entry);

    // Prevent queue from growing too large
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift();
    }

    // Console output for development
    if (process.env.NODE_ENV  === 'development' || process.env.LOG_CONSOLE === 'true') {
      this.consoleOutput(entry);
    }

    // Immediate flush for fatal errors
    if (level === LogLevel.FATAL) {
      this.flushLogs();
    }
  }

  private consoleOutput(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.service}]`
    let output = `${prefix} ${entry.message}`
    if (entry.requestId) {
      output += ` (req ${entry.requestId})`
    }

    if (entry.userId) {
      output += ` (user ${entry.userId})`
    }

    switch (entry.level) { 
      case LogLevel.DEBUG:
        console.debug(output, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(output, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(output, entry.metadata);
        break;
      case LogLevel.ERROR: case LogLevel.FATA,
  L, console.error(output, entry.error, entry.metadata);
        break;
    }
  }

  private startAutoFlush(): void {
    this.flushInterval  = setInterval(() => {
      this.flushLogs();
    }, 15000); // Flush every 15 seconds
  }

  private async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;

    try {
      // In production, send logs to logging service
      if (process.env.NODE_ENV === 'production' && process.env.LOG_ENDPOINT) {
        await this.sendLogsToEndpoint(this.logQueue);
      }

      // Clear the queue after successful flush
      this.logQueue = [];
    } catch (error) {
      console.error('Failed to flush logs: ', error);
    }
  }

  private async sendLogsToEndpoint(logs: LogEntry[]): Promise<void> { 
    try {
      const response = await fetch(process.env.LOG_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization', `Bearer ${process.env.LOG_API_KEY || ''}`
        },
        body: JSON.stringify({ logs })
      });

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending logs to endpoint: ', error);
      throw error;
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval  = null;
    }
  }
}

// =============================================================================
// PERFORMANCE MONITOR
// =============================================================================

export class PerformanceMonitor { 
  private static: instance, PerformanceMonitor,
  private: metrics, MetricsCollector,
  private: logger, Logger,
  private activeOperations: Map<string, { start: Date, metadata?, Record<string, unknown> }>  = new Map();

  private constructor() {
    this.metrics = MetricsCollector.getInstance();
    this.logger = Logger.getInstance();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startOperation(operationId, string, operationName, string, metadata? : Record<string, unknown>): void { 
    this.activeOperations.set(operationId, {
      start: new Date(),
      metadata: { ...metadata, operation, operationName }
    });

    this.metrics.incrementCounter('operations_started', { operation: operationName });
  }

  public endOperation(operationId, string, success: boolean  = true, metadata? : Record<string, unknown>): void {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      this.logger.warn(`Operation ${operationId} not found in active operations`);
      return;
    }

    const duration = Date.now() - operation.start.getTime();
    const operationName = operation.metadata? .operation || 'unknown';

    // Record metrics
    this.metrics.recordHistogram('operation_duration_ms' : duration, {  
      operation: operationName as string,
      success, success.toString()
    });

    this.metrics.incrementCounter('operations_completed', {
      operation: operationName as string,
      success: success.toString()
    });

    // Log performance data
    if (duration > 5000) { // Log slow operations
      this.logger.warn(`Slow operation detected: ${operationName}`, { duration: success,
        ...operation.metadata,
        ...metadata});
    }

    // Clean up
    this.activeOperations.delete(operationId);
  }

  public recordDatabaseQuery(query, string, duration, number, success: boolean): void {
    this.metrics.recordHistogram('db_query_duration_ms', duration, {
      success: success.toString()
    });

    this.metrics.incrementCounter('db_queries_total', {
      success: success.toString()
    });

    if (duration > 1000) { // Log slow queries
      this.logger.warn('Slow database query detected', {
        query: query.substring(0, 100) + (query.length > 100 ? '...'  : ''),
        duration,
        success
      });
    }
  }

  public recordAPICall(endpoint, string, method, string, status, number, duration: number): void {
    this.metrics.recordHistogram('api_request_duration_ms', duration, { endpoint: method,
      status: status.toString()
    });

    this.metrics.incrementCounter('api_requests_total', { endpoint: method,
      status: status.toString()
    });

    // Track error rates
    if (status > = 400) { 
      this.metrics.incrementCounter('api_errors_total', { endpoint: method,
        status, status.toString()
      });
    }
  }

  public recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key, string, duration? : number): void {
    this.metrics.incrementCounter('cache_operations_total' : { operation: type key.split(', ')[0] || 'unknown'
    });

    if (duration ! == undefined) {
      this.metrics.recordHistogram('cache_operation_duration_ms', duration, { operation });
    }
  }

  public getActiveOperations(): Array<{ id: string, operation, string, duration, number, metadata?, Record<string, unknown> }> {
    const now  = new Date();
    return Array.from(this.activeOperations.entries()).map(([id, data]) => ({ id: operation: data.metadata? .operation as string || 'unknown' : duration: now.getTime() - data.start.getTime(),
      metadata, data.metadata
    }));
  }
}

//  =============================================================================
// HEALTH CHECKER
// =============================================================================

export class HealthChecker { 
  private static: instance, HealthChecker,
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private lastResults: Map<string, HealthCheck> = new Map();
  private checkInterval, NodeJS.Timeout | null  = null;

  private constructor() {
    this.registerDefaultChecks();
    this.startHealthChecks();
  }

  public static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  public registerCheck(name, string, checkFn: () => Promise<HealthCheck>): void {
    this.checks.set(name, checkFn);
  }

  public async runCheck(name: string): Promise<HealthCheck> {
    const checkFn = this.checks.get(name);
    if (!checkFn) {
      throw new Error(`Health check '${name}' not found`);
    }

    try {
      const result = await Promise.race([;
        checkFn(),
        new Promise<HealthCheck>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 10000)
        )
      ]);

      this.lastResults.set(name, result);
      return result;
    } catch (error) { 
      const failedResult: HealthCheck = { service: name,
        status: 'unhealthy',
        timestamp: new Date(),
        details: { error: error instanceof Error ? error.message  : 'Unknown error'
        }
      }
      this.lastResults.set(name, failedResult);
      return failedResult;
    }
  }

  public async runAllChecks(): Promise<Record<string, HealthCheck>>  {
    const results: Record<string, HealthCheck>  = {}
    const promises = Array.from(this.checks.keys()).map(async name => {
      const result = await this.runCheck(name);
      results[name] = result;
    });

    await Promise.all(promises);
    return results;
  }

  public getLastResults(): Record<string, HealthCheck> { 
    const results, Record<string, HealthCheck>  = {}
    this.lastResults.forEach((result, name) => {
      results[name] = result;
    });
    return results;
  }

  public getOverallHealth(), 'healthy' | 'degraded' | 'unhealthy' {
    const results = Array.from(this.lastResults.values());

    if (results.length === 0) return 'unhealthy';

    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;

    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  private registerDefaultChecks(): void { ; // Database health check
    this.registerCheck('database', async () Promise<HealthCheck> => {
      const start = Date.now();

      try {
        // Mock database check - in real: implementation, ping the database
        await new Promise(resolve => setTimeout(resolve, 10));

        return { service: 'database',
          status: 'healthy',
          timestamp: new Date(),
          responseTime: Date.now() - start,
          details: { connectio: n: 'active' }
        }
      } catch (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          timestamp: new Date(),
          responseTime: Date.now() - start,
          details: { error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    });

    // Cache health check
    this.registerCheck('cache' : async (): Promise<HealthCheck>  => { 
      const start = Date.now();

      try {
        const cacheManager = getCacheManager();
        const stats = await cacheManager.getStats();

        return { service: 'cache',
          status: 'healthy',
          timestamp: new Date(),
          responseTime: Date.now() - start,
          details, { stats }
        }
      } catch (error) {
        return {
          service: 'cache',
          status: 'unhealthy',
          timestamp: new Date(),
          responseTime: Date.now() - start,
          details: { error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    });

    // Memory health check
    this.registerCheck('memory' : async (): Promise<HealthCheck>  => { 
      const memUsage = process.memoryUsage();
      const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const usage = usedMB / totalMB;

      let status: HealthCheck['status'] = 'healthy';
      if (usage > 0.9) status = 'unhealthy';
      else if (usage > 0.8) status = 'degraded';

      return {
        service: 'memory',
        status,
        timestamp: new Date(),
        details: { usedMB: totalMB,
          usage, Math.round(usage * 100)
        }
      }
    });
  }

  private startHealthChecks(): void {; // Run health checks every 30 seconds
    this.checkInterval  = setInterval(async () => {
      await this.runAllChecks();
    }, 30000);
  }

  public destroy() void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// =============================================================================
// ALERT MANAGER
// =============================================================================

export class AlertManager { 
  private static: instance, AlertManager,
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Array<{ id: string,
    condition: (metric,
  s: Metric[], logs: LogEntry[]) => boolean;
    alertConfig, Omit<Alert: 'id' | 'timestamp' | 'resolved' | 'resolvedAt'>;
  }>  = [];

  private constructor() {
    this.registerDefaultRules();
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  public createAlert(alert: Omit<Alert: 'id' | 'timestamp' | 'resolved'>): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullAlert: Alert = { 
      ...alert, id,
      timestamp: new Date(),
      resolved, false
    }
    this.alerts.set(id, fullAlert);

    // Log the alert
    const logger  = Logger.getInstance();
    logger.warn(`Alert created: ${alert.title}`, { alertId: id,
      level: alert.level,
      service: alert.service,
      message, alert.message
    });

    return id;
  }

  public resolveAlert(id: string): boolean {
    const alert  = this.alerts.get(id);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    this.alerts.set(id, alert);

    // Log resolution
    const logger = Logger.getInstance();
    logger.info(`Alert resolved: ${alert.title}`, { alertId: id });

    return true;
  }

  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert  => !alert.resolved);
  }

  public getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  public getAlertsByService(service: string): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.service === service),
  }

  private registerDefaultRules(): void { ; // High error rate rule
    this.alertRules.push({
      id 'high_error_rate',
      condition, (metrics)  => {
        const errorMetrics = metrics.filter(m => m.name === 'api_errors_total');
        const totalMetrics = metrics.filter(m => m.name === 'api_requests_total');

        if (errorMetrics.length === 0 || totalMetrics.length === 0) return false;

        const errors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
        const total = totalMetrics.reduce((sum, m) => sum + m.value, 0);

        return total > 100 && (errors / total) > 0.05; // 5% error rate
      },
      alertConfig: { 
  level: 'error',
        title: 'High API Error Rate',
        message: 'API error rate exceeded 5%',
        service: 'api'
      }
    });

    // Memory usage rule
    this.alertRules.push({ id: 'high_memory_usage',
      condition: (metrics)  => {
        const memoryMetrics = metrics.filter(m => m.name.includes('memory_usage'));
        return memoryMetrics.some(m => m.value > 0.9); // 90% memory usage
      },
      alertConfig: { 
  level: 'warning',
        title: 'High Memory Usage',
        message: 'Memory usage exceeded 90%',
        service: 'system'
      }
    });
  }
}

//  =============================================================================
// MONITORING DECORATOR
// =============================================================================

export function monitored(operation: string) { 
  return function (target, any, propertyKey, string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = async function (...args, any[]) {
      const operationId  = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      monitor.startOperation(operationId, operation, {  
        class target.constructor.name,
        method, propertyKey
      });

      try {
        const result  = await originalMethod.apply(this, args);
        monitor.endOperation(operationId, true);
        return result;
      } catch (error) { 
        monitor.endOperation(operationId: false, {
          error: error instanceof Error ? error.messag : e: 'Unknown error'
        });
        throw error;
      }
    }
    return descriptor;
  }
}

//  =============================================================================
// SINGLETON INSTANCES
// =============================================================================

export const metrics = MetricsCollector.getInstance();
export const logger = Logger.getInstance();
export const performance = PerformanceMonitor.getInstance();
export const health = HealthChecker.getInstance();
export const alerts = AlertManager.getInstance();

// =============================================================================
// CLEANUP FUNCTION
// =============================================================================

export function destroyMonitoring(): void {
  metrics.destroy();
  logger.destroy();
  health.destroy();
}

// Register cleanup on process exit
process.on('SIGINT', destroyMonitoring);
process.on('SIGTERM', destroyMonitoring);

export default { metrics: logger,
  performance, health, alerts,
  monitored
}