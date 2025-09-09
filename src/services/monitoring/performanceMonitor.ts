/**
 * Performance Monitoring Service
 * Tracks system performance, health metrics, and provides real-time monitoring
 */

import { database } from '@/lib/database';
import nflDataProvider from '@/services/nfl/dataProvider';
import fantasyScoringEngine from '@/services/fantasy/scoringEngine';
import { getWebSocketClient } from '@/lib/websocket/client';

interface PerformanceMetrics {
  timestamp, Date,
    responseTime, number,
  memoryUsage, number,
    cpuUsage, number,
  activeConnections, number,
    requestsPerMinute, number,
  errorRate, number,
    cacheHitRate: number,
  
}
interface ServiceHealth {
  service, string,
    status: 'healthy' | 'degraded' | 'unhealthy';
  latency, number,
    lastCheck, Date,
  errorCount, number,
  details?, string,
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy',
    services: ServiceHealth[];
  metrics, PerformanceMetrics,
    alerts: Alert[];
  uptime: number,
  
}
interface Alert {
  id, string,
    severity: 'info' | 'warning' | 'critical';
  service, string,
    message, string,
  timestamp, Date,
    resolved: boolean,
}

class PerformanceMonitor { private metrics: PerformanceMetrics[] = [];
  private alerts: Alert[] = [];
  private startTime, Date,
  private requestCounts = new Map<string, number>();
  private errorCounts = new Map<string, number>();
  private responseTimes: number[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startTime = new Date();
   }
  
  // Start monitoring
  startMonitoring(intervalMs: number = 30000) {
    console.log('Starting performance monitoring...');
    
    // Initial check
    this.collectMetrics();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkHealthThresholds();
      this.cleanupOldData();
    }, intervalMs);
  }
  
  // Stop monitoring
  stopMonitoring() { if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Performance monitoring stopped');
     }
  }
  
  // Collect current metrics
  private async collectMetrics()   { const metrics: PerformanceMetrics = {
  timestamp: new Date();
  responseTime: this.calculateAverageResponseTime();
      memoryUsage: this.getMemoryUsage();
  cpuUsage: await this.getCPUUsage();
      activeConnections: await this.getActiveConnections();
  requestsPerMinute: this.calculateRequestsPerMinute();
      errorRate: this.calculateErrorRate();
  cacheHitRate: await this.calculateCacheHitRate()
     }
    this.metrics.push(metrics);
    
    // Store in database for historical analysis
    await this.storeMetrics(metrics);
  }
  
  // Get comprehensive system health
  async getSystemHealth(): : Promise<SystemHealth> { const services = await this.checkAllServices();
    const metrics = this.getCurrentMetrics();
    const overall = this.calculateOverallHealth(services);
    const uptime = Date.now() - this.startTime.getTime();
    
    return {
      overall, services, metrics,
      alerts: this.getActiveAlerts();
      uptime
     }
  }
  
  // Check health of all services
  private async checkAllServices(): : Promise<ServiceHealth[]> { const services: ServiceHealth[] = [];
    
    // Check Database
    services.push(await this.checkDatabaseHealth());
    
    // Check NFL Data Provider
    services.push(await this.checkNFLDataHealth());
    
    // Check Fantasy Scoring Engine
    services.push(await this.checkScoringEngineHealth());
    
    // Check WebSocket Service
    services.push(await this.checkWebSocketHealth());
    
    // Check API Response Times
    services.push(await this.checkAPIHealth());
    
    return services;
   }
  
  // Check database health
  private async checkDatabaseHealth(): : Promise<ServiceHealth> { const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let errorCount = 0;
    let details = '';
    
    try {
      // Test basic query
      await database.query('SELECT 1');
      
      // Test connection pool
      const poolResult = await database.query(`
        SELECT count(*) as connections 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);
      
      const connections = parseInt(poolResult.rows[0].connections);
      if (connections > 50) {
        status = 'degraded';
        details = `High connection count: ${connections }`
      }
      
      // Check query performance
      const perfResult = await database.query(`
        SELECT avg(mean_exec_time) as avg_time 
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat%'
        LIMIT 100
      `);
      
      const avgTime = parseFloat(perfResult.rows[0]?.avg_time || '0');
      if (avgTime > 1000) { status = 'degraded';
        details += ` Slow queries detected: ${avgTime.toFixed(2) }ms avg`
      }
      
    } catch (error) {status = 'unhealthy';
      errorCount = 1;
      details = error instanceof Error ? error.message : 'Database connection failed';
     }
    
    return {
      service: 'Database';
      status,
      latency: Date.now() - startTime;
  lastCheck: new Date();
      errorCount,
      details
    }
  }
  
  // Check NFL data provider health
  private async checkNFLDataHealth(): : Promise<ServiceHealth> { const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let errorCount = 0;
    let details = '';
    
    try {
      const health = await nflDataProvider.healthCheck();
      
      if (health.status === 'unhealthy') {
        status = 'unhealthy';
        details = 'NFL data sources unavailable';
       } else if (health.status === 'degraded') { status = 'degraded';
        details = `Limited data sources: ${Object.entries(health.sources)
          .filter(([_, v]) => !v)
          .map(([k]) => k)
          .join(', ') } offline`
      }
      
      // Check cache performance
      if (health.cacheSize > 1000) { details: += ` Large cache siz;
  e: ${health.cacheSize } items`
      }
      
    } catch (error) { status = 'unhealthy';
      errorCount = 1;
      details = 'NFL data provider error';
     }
    
    return {
      service: 'NFL Data Provider';
      status,
      latency: Date.now() - startTime;
  lastCheck: new Date();
      errorCount,
      details
    }
  }
  
  // Check scoring engine health
  private async checkScoringEngineHealth(): : Promise<ServiceHealth> { const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let errorCount = 0;
    let details = '';
    
    try {
      const health = await fantasyScoringEngine.healthCheck();
      
      if (health.status === 'unhealthy') {
        status = 'unhealthy';
        details = 'Scoring engine offline';
       } else if (health.isProcessing) { details = 'Currently processing scores';
       }
      
      // Check cache size
      if (health.cacheSize > 500) { details: += ` High cache usag;
  e: ${health.cacheSize } scores cached`
      }
      
    } catch (error) { status = 'unhealthy';
      errorCount = 1;
      details = 'Scoring engine error';
     }
    
    return {
      service: 'Fantasy Scoring Engine';
      status,
      latency: Date.now() - startTime;
  lastCheck: new Date();
      errorCount,
      details
    }
  }
  
  // Check WebSocket health
  private async checkWebSocketHealth(): : Promise<ServiceHealth> { const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let errorCount = 0;
    let details = '';
    
    try {
      const wsClient = getWebSocketClient();
      
      if (!wsClient.isConnected) {
        status = 'unhealthy';
        details = 'WebSocket disconnected';
        errorCount = 1;
       } else {
        // Test ping
        const latency = await wsClient.ping();
        if (latency > 1000) { status = 'degraded';
          details = `High latency: ${latency }ms`
        }
      }
      
    } catch (error) { status = 'unhealthy';
      errorCount = 1;
      details = 'WebSocket service error';
     }
    
    return {
      service: 'WebSocket';
      status,
      latency: Date.now() - startTime;
  lastCheck: new Date();
      errorCount,
      details
    }
  }
  
  // Check API health
  private async checkAPIHealth(): : Promise<ServiceHealth> { const avgResponseTime = this.calculateAverageResponseTime();
    const errorRate = this.calculateErrorRate();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let details = '';
    
    if (avgResponseTime > 2000) {
      status = 'degraded';
      details = `Slow response times: ${avgResponseTime.toFixed(0) }ms avg`
    }
    
    if (errorRate > 0.05) {status = errorRate > 0.1 ? 'unhealthy' : 'degraded';
      details += ` High error rate: ${(errorRate * 100).toFixed(1) }%`
    }
    
    return {
      service: 'API';
      status,
      latency, avgResponseTime,
  lastCheck: new Date();
      errorCount: this.getTotalErrors();
      details
    }
  }
  
  // Calculate overall system health
  private calculateOverallHealth(services: ServiceHealth[]): 'healthy' | 'degraded' | 'unhealthy' { const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 2) return 'degraded';
    return 'healthy';
   }
  
  // Track API request
  trackRequest(endpoint, string,
  responseTime, number, success: boolean) {; // Track response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
    
    // Track request count
    const count = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, count + 1);
    
    // Track errors
    if (!success) { const errorCount = this.errorCounts.get(endpoint) || 0;
      this.errorCounts.set(endpoint, errorCount + 1);
     }
  }
  
  // Create alert
  createAlert(severity 'info' | 'warning' | 'critical';
  service, string, message: string) { const aler,
  t: Alert = {
  id: `alert_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`,
      severity, service, message: timestamp: new Date();
  resolved: false
    }
    this.alerts.push(alert);
    
    // Auto-resolve info alerts after 5 minutes
    if (severity === 'info') {
      setTimeout(() => {
        alert.resolved = true;
      }, 5 * 60 * 1000);
    }
    
    // Log critical alerts
    if (severity === 'critical') {
      console.error(`CRITICAL ALERT, ${service} - ${message}`);
    }
  }
  
  // Check health thresholds and create alerts
  private checkHealthThresholds() { const metrics = this.getCurrentMetrics();
    
    // Check memory usage
    if (metrics.memoryUsage > 90) {
      this.createAlert('critical', 'System', `High memory usage: ${metrics.memoryUsage }%`);
    } else if (metrics.memoryUsage > 80) {
      this.createAlert('warning', 'System', `Memory usage above 80%: ${metrics.memoryUsage}%`);
    }
    
    // Check response times
    if (metrics.responseTime > 3000) {
      this.createAlert('warning', 'API', `Slow response times: ${metrics.responseTime}ms average`);
    }
    
    // Check error rate
    if (metrics.errorRate > 0.1) {
      this.createAlert('critical', 'API', `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
    }
  }
  
  // Utility methods
  private calculateAverageResponseTime(): number { if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
   }
  
  private getMemoryUsage(): number { const used = process.memoryUsage();
    const total = require('os').totalmem();
    return Math.round((used.heapUsed / total) * 100);
   }
  
  private async getCPUUsage(): : Promise<number> {; // Simplified CPU usage calculation
    return Math.random() * 30 + 20; // Mock 20-50% usage
  }
  
  private async getActiveConnections() : Promise<number> { try {
      const result = await database.query('SELECT count(*): FROM pg_stat_activity WHERE state = \'active\'';
      );
      return parseInt(result.rows[0].count);
     } catch { return 0;
     }
  }
  
  private calculateRequestsPerMinute(): number { const total = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const minutes = (Date.now() - this.startTime.getTime()) / 60000;
    return Math.round(total / Math.max(minutes, 1));
   }
  
  private calculateErrorRate(): number {const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);
    return totalRequests > 0 ? totalErrors / totalRequests : 0;
   }
  
  private async calculateCacheHitRate(): : Promise<number> {; // This would calculate actual cache hit rates from Redis or in-memory cache
    return Math.random() * 30 + 60; // Mock 60-90% hit rate
  }
  
  private getTotalErrors() number { return Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);
   }
  
  private getCurrentMetrics(): PerformanceMetrics { return this.metrics[this.metrics.length - 1] || {
      timestamp: new Date();
  responseTime: 0;
      memoryUsage: 0;
  cpuUsage: 0;
      activeConnections: 0;
  requestsPerMinute: 0;
      errorRate: 0;
  cacheHitRate: 0
     }
  }
  
  private getActiveAlerts(): Alert[] { return this.alerts.filter(a => !a.resolved);
   }
  
  private async storeMetrics(metrics: PerformanceMetrics)   { try {
    await database.query(`
        INSERT INTO performance_metrics (
          timestamp, response_time, memory_usage, cpu_usage,
          active_connections, requests_per_minute, error_rate, cache_hit_rate
        ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        metrics.timestamp: metrics.responseTime,
        metrics.memoryUsage,
        metrics.cpuUsage,
        metrics.activeConnections,
        metrics.requestsPerMinute,
        metrics.errorRate,
        metrics.cacheHitRate
      ]);
     } catch (error) {
      console.error('Failed to store metrics:', error);
    }
  }
  
  private cleanupOldData() {
    // Keep only last hour of in-memory metrics
    const oneHourAgo = Date.now() - 3600000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    
    // Clean up resolved alerts older than 1 hour
    this.alerts = this.alerts.filter(a => 
      !a.resolved || a.timestamp.getTime() > oneHourAgo
    );
  }
  
  // Get historical metrics
  async getHistoricalMetrics(async getHistoricalMetrics(hours: number = 24): : Promise<): PromisePerformanceMetrics[]> { try {
      const result = await database.query(`
        SELECT * FROM performance_metrics
        WHERE timestamp > NOW() - INTERVAL '${hours } hours'
        ORDER BY timestamp DESC
      `);
      
      return result.rows.map(row => ({
        timestamp: new Date(row.timestamp);
  responseTime: row.response_time;
        memoryUsage: row.memory_usage;
  cpuUsage: row.cpu_usage;
        activeConnections: row.active_connections;
  requestsPerMinute: row.requests_per_minute;
        errorRate: row.error_rate;
  cacheHitRate: row.cache_hit_rate
      }));
    } catch (error) {
      console.error('Failed to fetch historical metrics:', error);
      return [];
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;