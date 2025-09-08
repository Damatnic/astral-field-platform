/**
 * Comprehensive Performance Monitoring System
 */

import { sentryUtils } from './sentry-config';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
  context?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  metrics: PerformanceMetric[];
  alerts: Alert[];
  uptime: number;
  lastCheck: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  metric?: string;
  threshold?: number;
  value?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: Alert[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  
  // Performance thresholds
  private readonly thresholds = {
    // API Response times (ms)
    apiResponseTime: {
      warning: 1000,
      critical: 3000,
    },
    
    // Database query times (ms)
    dbQueryTime: {
      warning: 500,
      critical: 2000,
    },
    
    // Memory usage (MB)
    memoryUsage: {
      warning: 500,
      critical: 1000,
    },
    
    // CPU usage (%)
    cpuUsage: {
      warning: 70,
      critical: 90,
    },
    
    // Error rate (%)
    errorRate: {
      warning: 5,
      critical: 10,
    },
    
    // Page load time (ms)
    pageLoadTime: {
      warning: 2000,
      critical: 5000,
    },
  };
  
  constructor() {
    // Initialize Web Vitals monitoring if in browser
    if (typeof window !== 'undefined') {
      this.initWebVitalsMonitoring();
    }
  }
  
  // Start monitoring system
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Performance monitoring started');
    
    // Collect metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
    
    // Initial collection
    this.collectSystemMetrics();
  }
  
  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('⏹️ Performance monitoring stopped');
  }
  
  // Record a custom metric
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };
    
    // Store locally
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    const metricHistory = this.metrics.get(metric.name)!;
    metricHistory.push(fullMetric);
    
    // Keep only last 100 metrics per type
    if (metricHistory.length > 100) {
      metricHistory.shift();
    }
    
    // Check thresholds and create alerts
    this.checkThresholds(fullMetric);\n    \n    // Send to Sentry\n    sentryUtils.captureMetric(metric.name, metric.value, metric.unit);\n    \n    return fullMetric;\n  }\n  \n  // Time a function execution\n  timeFunction<T>(\n    name: string,\n    fn: () => T | Promise<T>,\n    tags?: Record<string, string>\n  ): Promise<T> {\n    return new Promise(async (resolve, reject) => {\n      const startTime = performance.now();\n      \n      try {\n        const result = await fn();\n        const duration = performance.now() - startTime;\n        \n        this.recordMetric({\n          name,\n          value: duration,\n          unit: 'milliseconds',\n          tags,\n        });\n        \n        resolve(result);\n      } catch (error) {\n        const duration = performance.now() - startTime;\n        \n        this.recordMetric({\n          name: `${name}_error`,\n          value: duration,\n          unit: 'milliseconds',\n          tags: { ...tags, status: 'error' },\n        });\n        \n        reject(error);\n      }\n    });\n  }\n  \n  // Monitor API endpoint performance\n  monitorAPICall(\n    endpoint: string,\n    method: string,\n    startTime: number,\n    status: number,\n    responseTime?: number\n  ) {\n    const duration = responseTime || (Date.now() - startTime);\n    \n    this.recordMetric({\n      name: 'api_response_time',\n      value: duration,\n      unit: 'milliseconds',\n      tags: {\n        endpoint: endpoint.replace(/\\/\\d+/g, '/:id'), // Normalize dynamic segments\n        method,\n        status: status.toString(),\n        status_class: this.getStatusClass(status),\n      },\n    });\n    \n    // Record error rate\n    this.recordMetric({\n      name: 'api_requests_total',\n      value: 1,\n      unit: 'count',\n      tags: {\n        endpoint: endpoint.replace(/\\/\\d+/g, '/:id'),\n        method,\n        status: status.toString(),\n      },\n    });\n  }\n  \n  // Monitor database query performance\n  monitorDatabaseQuery(\n    query: string,\n    duration: number,\n    success: boolean,\n    rowCount?: number\n  ) {\n    const queryType = this.extractQueryType(query);\n    \n    this.recordMetric({\n      name: 'db_query_time',\n      value: duration,\n      unit: 'milliseconds',\n      tags: {\n        query_type: queryType,\n        status: success ? 'success' : 'error',\n      },\n      context: {\n        query: query.substring(0, 100), // First 100 chars\n        rowCount,\n      },\n    });\n  }\n  \n  // Get system health status\n  async getSystemHealth(): Promise<SystemHealth> {\n    const currentTime = Date.now();\n    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes\n    \n    // Calculate health score based on recent metrics\n    let healthScore = 100;\n    let status: SystemHealth['status'] = 'healthy';\n    \n    // Check critical metrics\n    const criticalAlerts = this.alerts.filter(a => a.type === 'critical' && !a.resolved);\n    const warningAlerts = this.alerts.filter(a => a.type === 'warning' && !a.resolved);\n    \n    if (criticalAlerts.length > 0) {\n      status = 'unhealthy';\n      healthScore -= criticalAlerts.length * 30;\n    } else if (warningAlerts.length > 0) {\n      status = 'degraded';\n      healthScore -= warningAlerts.length * 15;\n    }\n    \n    // Factor in recent performance\n    const avgResponseTime = this.getAverageMetric(recentMetrics, 'api_response_time');\n    if (avgResponseTime > this.thresholds.apiResponseTime.critical) {\n      healthScore -= 25;\n      status = 'unhealthy';\n    } else if (avgResponseTime > this.thresholds.apiResponseTime.warning) {\n      healthScore -= 10;\n      if (status === 'healthy') status = 'degraded';\n    }\n    \n    return {\n      status,\n      score: Math.max(0, healthScore),\n      metrics: recentMetrics,\n      alerts: this.alerts.filter(a => !a.resolved).slice(-10), // Last 10 unresolved\n      uptime: currentTime - this.startTime,\n      lastCheck: currentTime,\n    };\n  }\n  \n  // Get performance insights\n  getPerformanceInsights() {\n    const insights = {\n      slowestEndpoints: this.getSlowestEndpoints(),\n      errorRates: this.getErrorRates(),\n      performanceTrends: this.getPerformanceTrends(),\n      resourceUsage: this.getResourceUsage(),\n    };\n    \n    return insights;\n  }\n  \n  // Private methods\n  private async collectSystemMetrics() {\n    try {\n      // Collect memory usage\n      if (typeof process !== 'undefined' && process.memoryUsage) {\n        const memory = process.memoryUsage();\n        this.recordMetric({\n          name: 'memory_usage',\n          value: Math.round(memory.heapUsed / 1024 / 1024),\n          unit: 'megabytes',\n        });\n        \n        this.recordMetric({\n          name: 'memory_heap_total',\n          value: Math.round(memory.heapTotal / 1024 / 1024),\n          unit: 'megabytes',\n        });\n      }\n      \n      // Collect uptime\n      if (typeof process !== 'undefined' && process.uptime) {\n        this.recordMetric({\n          name: 'process_uptime',\n          value: process.uptime(),\n          unit: 'seconds',\n        });\n      }\n      \n      // Browser-specific metrics\n      if (typeof window !== 'undefined') {\n        this.collectBrowserMetrics();\n      }\n      \n    } catch (error) {\n      console.error('Error collecting system metrics:', error);\n    }\n  }\n  \n  private collectBrowserMetrics() {\n    // Performance navigation timing\n    if (performance.navigation && performance.timing) {\n      const timing = performance.timing;\n      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;\n      \n      if (pageLoadTime > 0) {\n        this.recordMetric({\n          name: 'page_load_time',\n          value: pageLoadTime,\n          unit: 'milliseconds',\n        });\n      }\n    }\n    \n    // Connection information\n    if ('connection' in navigator) {\n      const conn = (navigator as any).connection;\n      if (conn) {\n        this.recordMetric({\n          name: 'network_downlink',\n          value: conn.downlink || 0,\n          unit: 'mbps',\n          tags: {\n            effective_type: conn.effectiveType || 'unknown',\n          },\n        });\n      }\n    }\n  }\n  \n  private initWebVitalsMonitoring() {\n    // Core Web Vitals monitoring\n    if ('PerformanceObserver' in window) {\n      // Largest Contentful Paint (LCP)\n      new PerformanceObserver((list) => {\n        const entries = list.getEntries();\n        const lastEntry = entries[entries.length - 1];\n        \n        this.recordMetric({\n          name: 'web_vital_lcp',\n          value: lastEntry.startTime,\n          unit: 'milliseconds',\n        });\n      }).observe({ type: 'largest-contentful-paint', buffered: true });\n      \n      // First Input Delay (FID)\n      new PerformanceObserver((list) => {\n        const entries = list.getEntries();\n        entries.forEach(entry => {\n          this.recordMetric({\n            name: 'web_vital_fid',\n            value: entry.processingStart - entry.startTime,\n            unit: 'milliseconds',\n          });\n        });\n      }).observe({ type: 'first-input', buffered: true });\n      \n      // Cumulative Layout Shift (CLS)\n      let clsValue = 0;\n      new PerformanceObserver((list) => {\n        const entries = list.getEntries();\n        entries.forEach(entry => {\n          if (!entry.hadRecentInput) {\n            clsValue += entry.value;\n          }\n        });\n        \n        this.recordMetric({\n          name: 'web_vital_cls',\n          value: clsValue,\n          unit: 'score',\n        });\n      }).observe({ type: 'layout-shift', buffered: true });\n    }\n  }\n  \n  private checkThresholds(metric: PerformanceMetric) {\n    const threshold = this.thresholds[metric.name as keyof typeof this.thresholds];\n    if (!threshold) return;\n    \n    const alertId = `${metric.name}_${Date.now()}`;\n    \n    if (metric.value >= threshold.critical) {\n      this.alerts.push({\n        id: alertId,\n        type: 'critical',\n        message: `${metric.name} exceeded critical threshold: ${metric.value}${metric.unit} >= ${threshold.critical}${metric.unit}`,\n        timestamp: metric.timestamp,\n        resolved: false,\n        metric: metric.name,\n        threshold: threshold.critical,\n        value: metric.value,\n      });\n    } else if (metric.value >= threshold.warning) {\n      this.alerts.push({\n        id: alertId,\n        type: 'warning',\n        message: `${metric.name} exceeded warning threshold: ${metric.value}${metric.unit} >= ${threshold.warning}${metric.unit}`,\n        timestamp: metric.timestamp,\n        resolved: false,\n        metric: metric.name,\n        threshold: threshold.warning,\n        value: metric.value,\n      });\n    }\n    \n    // Clean up old alerts (keep last 50)\n    if (this.alerts.length > 50) {\n      this.alerts = this.alerts.slice(-50);\n    }\n  }\n  \n  private getRecentMetrics(timeWindow: number): PerformanceMetric[] {\n    const cutoff = Date.now() - timeWindow;\n    const recentMetrics: PerformanceMetric[] = [];\n    \n    this.metrics.forEach(metricHistory => {\n      recentMetrics.push(\n        ...metricHistory.filter(m => m.timestamp > cutoff)\n      );\n    });\n    \n    return recentMetrics.sort((a, b) => b.timestamp - a.timestamp);\n  }\n  \n  private getAverageMetric(metrics: PerformanceMetric[], name: string): number {\n    const filteredMetrics = metrics.filter(m => m.name === name);\n    if (filteredMetrics.length === 0) return 0;\n    \n    const sum = filteredMetrics.reduce((acc, m) => acc + m.value, 0);\n    return sum / filteredMetrics.length;\n  }\n  \n  private getSlowestEndpoints() {\n    const apiMetrics = this.metrics.get('api_response_time') || [];\n    const endpointAvgs = new Map<string, { total: number; count: number }>();\n    \n    apiMetrics.forEach(metric => {\n      const endpoint = metric.tags?.endpoint || 'unknown';\n      const current = endpointAvgs.get(endpoint) || { total: 0, count: 0 };\n      \n      endpointAvgs.set(endpoint, {\n        total: current.total + metric.value,\n        count: current.count + 1,\n      });\n    });\n    \n    return Array.from(endpointAvgs.entries())\n      .map(([endpoint, stats]) => ({\n        endpoint,\n        averageTime: stats.total / stats.count,\n        requestCount: stats.count,\n      }))\n      .sort((a, b) => b.averageTime - a.averageTime)\n      .slice(0, 10);\n  }\n  \n  private getErrorRates() {\n    const apiMetrics = this.metrics.get('api_requests_total') || [];\n    const endpointStats = new Map<string, { total: number; errors: number }>();\n    \n    apiMetrics.forEach(metric => {\n      const endpoint = metric.tags?.endpoint || 'unknown';\n      const status = parseInt(metric.tags?.status || '200');\n      const current = endpointStats.get(endpoint) || { total: 0, errors: 0 };\n      \n      endpointStats.set(endpoint, {\n        total: current.total + 1,\n        errors: current.errors + (status >= 400 ? 1 : 0),\n      });\n    });\n    \n    return Array.from(endpointStats.entries())\n      .map(([endpoint, stats]) => ({\n        endpoint,\n        errorRate: (stats.errors / stats.total) * 100,\n        totalRequests: stats.total,\n        errorCount: stats.errors,\n      }))\n      .sort((a, b) => b.errorRate - a.errorRate);\n  }\n  \n  private getPerformanceTrends() {\n    // Calculate trends for key metrics over time\n    const trends = {};\n    \n    ['api_response_time', 'memory_usage', 'page_load_time'].forEach(metricName => {\n      const metrics = this.metrics.get(metricName) || [];\n      if (metrics.length < 2) return;\n      \n      const recent = metrics.slice(-10);\n      const older = metrics.slice(-20, -10);\n      \n      if (recent.length === 0 || older.length === 0) return;\n      \n      const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;\n      const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;\n      \n      const trendPercentage = ((recentAvg - olderAvg) / olderAvg) * 100;\n      \n      trends[metricName] = {\n        current: recentAvg,\n        previous: olderAvg,\n        trend: trendPercentage,\n        direction: trendPercentage > 0 ? 'increasing' : 'decreasing',\n      };\n    });\n    \n    return trends;\n  }\n  \n  private getResourceUsage() {\n    const memoryMetrics = this.metrics.get('memory_usage') || [];\n    const latestMemory = memoryMetrics[memoryMetrics.length - 1];\n    \n    return {\n      memory: {\n        current: latestMemory?.value || 0,\n        unit: 'megabytes',\n        percentage: latestMemory ? (latestMemory.value / 1000) * 100 : 0,\n      },\n      uptime: Date.now() - this.startTime,\n      lastUpdated: Date.now(),\n    };\n  }\n  \n  private getStatusClass(status: number): string {\n    if (status >= 200 && status < 300) return '2xx';\n    if (status >= 300 && status < 400) return '3xx';\n    if (status >= 400 && status < 500) return '4xx';\n    if (status >= 500) return '5xx';\n    return 'unknown';\n  }\n  \n  private extractQueryType(query: string): string {\n    const trimmed = query.trim().toLowerCase();\n    \n    if (trimmed.startsWith('select')) return 'select';\n    if (trimmed.startsWith('insert')) return 'insert';\n    if (trimmed.startsWith('update')) return 'update';\n    if (trimmed.startsWith('delete')) return 'delete';\n    if (trimmed.startsWith('create')) return 'create';\n    if (trimmed.startsWith('drop')) return 'drop';\n    if (trimmed.startsWith('alter')) return 'alter';\n    \n    return 'other';\n  }\n}\n\n// Export singleton instance\nconst performanceMonitor = new PerformanceMonitor();\n\n// Auto-start monitoring in production\nif (process.env.NODE_ENV === 'production') {\n  performanceMonitor.startMonitoring();\n}\n\nexport default performanceMonitor;"