/**
 * Horizontal Scaling Architecture and Load Balancing System
 * Auto-scaling, load distribution, and high-availability infrastructure
 */

import { metrics, logger } from './monitoring';
import { cacheManager } from './redis-cache';
import { rateLimiter } from './rate-limiter';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'least_connections' | 'weighted_round_robin' | 'ip_hash' | 'geographic',
    healthCheck: {,
  enabled, boolean,
    interval, number,
    timeout, number,
    unhealthyThreshold, number,
    healthyThreshold: number,
  }
  sessionAffinity, boolean,
    stickySession: {,
  enabled, boolean,
    method: 'cookie' | 'ip' | 'header';
    duration: number,
  }
}

export interface ServerInstance {
  id, string,
    endpoint, string,
  region, string,
    status: 'healthy' | 'unhealthy' | 'starting' | 'stopping';
  connections, number,
    cpuUsage, number,
  memoryUsage, number,
    responseTime, number,
  weight, number,
    lastHealthCheck, Date,
  metadata: Record<string, any>;
  
}
export interface AutoScalingConfig {
  enabled, boolean,
    minInstances, number,
  maxInstances, number,
    targetCpuUtilization, number,
  targetMemoryUtilization, number,
    targetRequestRate, number,
  scaleUpThreshold, number,
    scaleDownThreshold, number,
  scaleUpCooldown, number,
    scaleDownCooldown, number,
  predictiveScaling: boolean,
  
}
export interface ScalingMetrics {
  currentInstances, number,
    desiredInstances, number,
  totalRequests, number,
    avgResponseTime, number,
  avgCpuUsage, number,
    avgMemoryUsage, number,
  requestsPerSecond, number,
    errorsPerSecond: number,
  
}
export interface GeographicRouting {
  enabled, boolean,
    regions: Map<string, ServerInstance[]>;
  fallbackRegion, string,
    latencyThreshold: number,
  
}
export interface CircuitBreakerConfig {
  enabled, boolean,
    failureThreshold, number,
  recoveryTimeout, number,
    monitoringPeriod, number,
  fallbackResponse?, any,
  
}
// =============================================================================
// LOAD BALANCER
// =============================================================================

export class LoadBalancer { private servers: Map<string, ServerInstance> = new Map();
  private config, LoadBalancerConfig,
  private currentIndex = 0;
  private connectionCounts = new Map<string, number>();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private circuitBreakers = new Map<string, {
    failures, number,
    lastFailure, Date,
    state: 'closed' | 'open' | 'half-open'  }>();

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    this.config = {
      algorithm: 'round_robin',
  healthCheck: {
        enabled: true, interval, 30000, timeout, 5000, unhealthyThreshold, 3,
        healthyThreshold: 2
      },
      sessionAffinity, false,
  stickySession: {
        enabled, false,
  method: 'cookie',
        duration: 3600
      },
      ...config}
    if (this.config.healthCheck.enabled) {
      this.startHealthChecks();
    }
  }

  addServer(server: ServerInstance); void {
    this.servers.set(server.id, server);
    this.connectionCounts.set(server.id, 0);
    this.circuitBreakers.set(server.id, {
      failures: 0;
  lastFailure: new Date(0),
      state: 'closed'
    });

    logger.info(`Server added to load balancer: ${server.id}`, {
      endpoint: server.endpoint,
  region: server.region,
      weight: server.weight
    });

    metrics.incrementCounter('load_balancer_servers_added', {
      server_id: server.id,
  region: server.region
    });
  }

  removeServer(serverId: string); boolean { const removed = this.servers.delete(serverId);
    if (removed) {
      this.connectionCounts.delete(serverId);
      this.circuitBreakers.delete(serverId);
      
      logger.info(`Server removed from load balancer: ${serverId }`);
      metrics.incrementCounter('load_balancer_servers_removed', { server_id: serverId });
    }
    return removed;
  }

  async selectServer(
    clientInfo: {
      ip?, string,
      sessionId?, string,
      userAgent?, string,
      region?, string,
      headers?: Record<string, string>;
    } = {}
  ): Promise<ServerInstance | null> { const healthyServers = this.getHealthyServers();
    
    if (healthyServers.length === 0) {
      logger.error('No healthy servers available');
      await metrics.incrementCounter('load_balancer_no_servers');
      return null;
     }

    let selectedServer: ServerInstance | null = null;

    try { switch (this.config.algorithm) {
      case 'round_robin':
      selectedServer = this.roundRobinSelection(healthyServers);
          break;
      break;
    case 'least_connections':
          selectedServer = this.leastConnectionsSelection(healthyServers);
          break;
        case 'weighted_round_robin':
      selectedServer = this.weightedRoundRobinSelection(healthyServers);
          break;
      break;
    case 'ip_hash':
          selectedServer = this.ipHashSelection(healthyServers, clientInfo.ip || '');
          break;
        case 'geographic':
          selectedServer = this.geographicSelection(healthyServers, clientInfo.region || '');
          break;
        default: selectedServer = this.roundRobinSelection(healthyServers),
       }

      if (selectedServer) {
        // Check circuit breaker
        const circuitBreaker = this.circuitBreakers.get(selectedServer.id);
        if (circuitBreaker?.state === 'open') {
          logger.warn(`Circuit breaker open for server ${selectedServer.id}, selecting alternative`);
          return this.selectAlternativeServer(healthyServers, selectedServer.id, clientInfo);
        }

        // Increment connection count
        const currentConnections = this.connectionCounts.get(selectedServer.id) || 0;
        this.connectionCounts.set(selectedServer.id, currentConnections + 1);

        await metrics.incrementCounter('load_balancer_requests_routed', {
          server_id: selectedServer.id,
  algorithm: this.config.algorithm,
          region: selectedServer.region
        });
      }

      return selectedServer;
    } catch (error) {
      logger.error('Server selection failed:', error as Error);
      await metrics.incrementCounter('load_balancer_selection_errors');
      return healthyServers[0] || null; // Fallback to first healthy server
    }
  }

  async releaseConnection(params): Promisevoid>  { const currentConnections = this.connectionCounts.get(serverId) || 0;
    this.connectionCounts.set(serverId, Math.max(0, currentConnections - 1));

    // Update circuit breaker state
    const circuitBreaker = this.circuitBreakers.get(serverId);
    if (circuitBreaker) {
      if (success) {
        // Reset failure count on success
        circuitBreaker.failures = 0;
        if (circuitBreaker.state === 'half-open') {
          circuitBreaker.state = 'closed';
          logger.info(`Circuit breaker closed for server ${serverId }`);
        }
      } else {
        // Increment failure count
        circuitBreaker.failures++;
        circuitBreaker.lastFailure = new Date();

        // Open circuit breaker if threshold exceeded
        if (circuitBreaker.failures >= 5 && circuitBreaker.state === 'closed') {
          circuitBreaker.state = 'open';
          logger.warn(`Circuit breaker opened for server ${serverId}`);
          
          // Schedule recovery attempt
          setTimeout(() => { if (circuitBreaker.state === 'open') {
              circuitBreaker.state = 'half-open';
              logger.info(`Circuit breaker half-open for server ${serverId }`);
            }
          }, 60000); // 1 minute recovery timeout
        }
      }
    }

    await metrics.incrementCounter('load_balancer_connections_released', {
      server_id, serverId,
  success: success.toString()
    });
  }

  private getHealthyServers(): ServerInstance[] { return Array.from(this.servers.values()).filter(server => 
      server.status === 'healthy'
    );
   }

  private roundRobinSelection(servers: ServerInstance[]); ServerInstance | null { if (servers.length === 0) return null;
    
    const server = servers[this.currentIndex % servers.length];
    this.currentIndex = (this.currentIndex + 1) % servers.length;
    return server;
   }

  private leastConnectionsSelection(servers: ServerInstance[]); ServerInstance | null { if (servers.length === 0) return null;

    return servers.reduce((least, current) => {
      const leastConnections = this.connectionCounts.get(least.id) || 0;
      const currentConnections = this.connectionCounts.get(current.id) || 0;
      return currentConnections < leastConnections ? current , least,
     });
  }

  private weightedRoundRobinSelection(servers: ServerInstance[]); ServerInstance | null { if (servers.length === 0) return null;

    const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
    if (totalWeight === 0) return this.roundRobinSelection(servers);

    const random = Math.random() * totalWeight;
    let currentWeight = 0;

    for (const server of servers) {
      currentWeight += server.weight;
      if (random <= currentWeight) {
        return server;
       }
    }

    return servers[0];
  }

  private ipHashSelection(servers: ServerInstance[],
  ip: string); ServerInstance | null { if (servers.length === 0) return null;
    if (!ip) return this.roundRobinSelection(servers);

    // Simple hash function for IP
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
      const char = ip.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
     }

    const index = Math.abs(hash) % servers.length;
    return servers[index];
  }

  private geographicSelection(servers: ServerInstance[],
  clientRegion: string); ServerInstance | null { if (servers.length === 0) return null;

    // Try to find server in same region
    const regionalServers = servers.filter(server => 
      server.region === clientRegion
    );

    if (regionalServers.length > 0) {
      return this.roundRobinSelection(regionalServers);
     }

    // Fallback to closest region or round robin
    return this.roundRobinSelection(servers);
  }

  private async selectAlternativeServer(params): PromiseServerInstance | null>  { const alternativeServers = servers.filter(s => s.id !== excludeId);
    return this.selectServer({ ...clientInfo, excludeServers: [excludeId]  });
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => { await this.performHealthChecks();
     }, this.config.healthCheck.interval);
  }

  private async performHealthChecks(): Promise<void> { const checkPromises = Array.from(this.servers.values()).map(async (server) => {
      try {
        const startTime = Date.now();
        
        // Perform health check (HEAD request to health endpoint)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.healthCheck.timeout);
        
        const response = await fetch(`${server.endpoint }/health`, {
          method: 'HEAD',
  signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        // Update server status
        if (response.ok) {
          server.status = 'healthy';
          server.responseTime = responseTime;
          server.lastHealthCheck = new Date();
          
          // Reset circuit breaker failures on successful health check
          const circuitBreaker = this.circuitBreakers.get(server.id);
          if (circuitBreaker && circuitBreaker.state !== 'closed') {
            circuitBreaker.failures = Math.max(0, circuitBreaker.failures - 1);
          }
        } else {
          server.status = 'unhealthy';
          logger.warn(`Health check failed for server ${server.id}`, {
            status: response.status,
            responseTime
          });
        }

        await metrics.recordHistogram('load_balancer_health_check_duration_ms', responseTime, {
          server_id: server.id,
  status: server.status
        });

      } catch (error) {
        server.status = 'unhealthy';
        logger.error(`Health check error for server ${server.id}:`, error as Error);
        
        await metrics.incrementCounter('load_balancer_health_check_errors', {
          server_id: server.id
        });
      }
    });

    await Promise.all(checkPromises);

    // Update metrics
    const healthyCount = Array.from(this.servers.values()).filter(s => s.status === 'healthy').length;
    const unhealthyCount = this.servers.size - healthyCount;

    await metrics.setGauge('load_balancer_healthy_servers', healthyCount);
    await metrics.setGauge('load_balancer_unhealthy_servers', unhealthyCount);
  }

  getStats(): {
    totalServers, number,
    healthyServers, number,
    unhealthyServers, number,
    totalConnections, number,
    serverStats: ServerInstance[],
  } { const servers = Array.from(this.servers.values());
    const healthyServers = servers.filter(s => s.status === 'healthy');
    const totalConnections = Array.from(this.connectionCounts.values());
      .reduce((sum, count) => sum + count, 0);

    return {
      totalServers: servers.length,
  healthyServers: healthyServers.length,
      unhealthyServers: servers.length - healthyServers.length, totalConnections,
      serverStats: servers
     }
  }

  destroy(): void { if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
     }
  }
}

// =============================================================================
// AUTO SCALER
// =============================================================================

export class AutoScaler { private config, AutoScalingConfig,
  private loadBalancer, LoadBalancer,
  private scalingHistory: Array<{ timestam,
  p, Date, action: 'scale_up' | 'scale_down'; instances, number }> = [];
  private lastScaleAction: Date = new Date(0);
  private metricsHistory: ScalingMetrics[] = [];
  private scalingInterval: NodeJS.Timeout | null = null;

  constructor(
    loadBalancer, LoadBalancer,
  config: Partial<AutoScalingConfig> = {}
  ) {
    this.loadBalancer = loadBalancer;
    this.config = {
      enabled: true, minInstances, 2, maxInstances, 20, targetCpuUtilization, 70, targetMemoryUtilization, 80, targetRequestRate, 1000, scaleUpThreshold, 80, scaleDownThreshold, 30, scaleUpCooldown, 300000,   // 5 minutes
      scaleDownCooldown: 600000; // 10 minutes
      predictiveScaling, false,
      ...config}
    if (this.config.enabled) {
      this.startScalingMonitor();
    }
  }

  private startScalingMonitor(): void {
    this.scalingInterval = setInterval(async () => { await this.evaluateScaling();
     }, 60000); // Check every minute
  }

  private async evaluateScaling(): Promise<void> { try {
      const currentMetrics = await this.collectMetrics();
      this.metricsHistory.push(currentMetrics);

      // Keep only last 60 minutes of metrics
      if (this.metricsHistory.length > 60) {
        this.metricsHistory.shift();
       }

      const scalingDecision = this.makeScalingDecision(currentMetrics);
      
      if (scalingDecision.shouldScale) { await this.executeScaling(scalingDecision.action, scalingDecision.targetInstances);
       }

    } catch (error) {
      logger.error('Auto scaling evaluation failed:', error as Error);
      await metrics.incrementCounter('auto_scaling_evaluation_errors');
    }
  }

  private async collectMetrics(): Promise<ScalingMetrics> { const lbStats = this.loadBalancer.getStats();
    
    // In production, these would come from real monitoring systems
    const currentMetrics: ScalingMetrics = {,
  currentInstances: lbStats.healthyServers,
  desiredInstances: lbStats.healthyServers,
      totalRequests: this.getTotalRequests(),
  avgResponseTime: this.getAverageResponseTime(lbStats.serverStats),
      avgCpuUsage: this.getAverageCpuUsage(lbStats.serverStats),
  avgMemoryUsage: this.getAverageMemoryUsage(lbStats.serverStats),
      requestsPerSecond: this.getRequestsPerSecond(),
  errorsPerSecond: this.getErrorsPerSecond()
     }
    // Update metrics
    await metrics.setGauge('auto_scaling_current_instances', currentMetrics.currentInstances);
    await metrics.setGauge('auto_scaling_avg_cpu_usage', currentMetrics.avgCpuUsage);
    await metrics.setGauge('auto_scaling_avg_memory_usage', currentMetrics.avgMemoryUsage);
    await metrics.setGauge('auto_scaling_requests_per_second', currentMetrics.requestsPerSecond);

    return currentMetrics;
  }

  private makeScalingDecision(currentMetrics: ScalingMetrics): {,
  shouldScale, boolean,
    action: 'scale_up' | 'scale_down',
    targetInstances, number,
    reason: string,
  } { const now = Date.now();
    
    // Check cooldown periods
    const timeSinceLastScale = now - this.lastScaleAction.getTime();
    
    // Scale up conditions
    if (
      currentMetrics.avgCpuUsage > this.config.scaleUpThreshold ||
      currentMetrics.avgMemoryUsage > this.config.scaleUpThreshold ||
      currentMetrics.requestsPerSecond > this.config.targetRequestRate
    ) {
      if (
        timeSinceLastScale > this.config.scaleUpCooldown &&
        currentMetrics.currentInstances < this.config.maxInstances
      ) {
        const targetInstances = Math.min(this.config.maxInstances,
          Math.ceil(currentMetrics.currentInstances * 1.5)
        );

        return {
          shouldScale, true,
  action: 'scale_up',
          targetInstances,
          reason: `High resource usage; CPU=${currentMetrics.avgCpuUsage }%, Memory=${currentMetrics.avgMemoryUsage}%, RPS=${currentMetrics.requestsPerSecond}`
        }
      }
    }

    // Scale down conditions
    if (
      currentMetrics.avgCpuUsage < this.config.scaleDownThreshold &&
      currentMetrics.avgMemoryUsage < this.config.scaleDownThreshold &&
      currentMetrics.requestsPerSecond < (this.config.targetRequestRate * 0.3)
    ) { if (
        timeSinceLastScale > this.config.scaleDownCooldown &&
        currentMetrics.currentInstances > this.config.minInstances
      ) {
        const targetInstances = Math.max(this.config.minInstances,
          Math.floor(currentMetrics.currentInstances * 0.7)
        );

        return {
          shouldScale, true,
  action: 'scale_down',
          targetInstances,
          reason: `Low resource usage; CPU=${currentMetrics.avgCpuUsage }%, Memory=${currentMetrics.avgMemoryUsage}%, RPS=${currentMetrics.requestsPerSecond}`
        }
      }
    }

    return {
      shouldScale, false,
  action: 'scale_up',
      targetInstances: currentMetrics.currentInstances,
  reason: 'No scaling required'
    }
  }

  private async executeScaling(params): Promisevoid>  { const currentInstances = this.loadBalancer.getStats().healthyServers;
    const instanceChange = targetInstances - currentInstances;

    logger.info(`Auto scaling triggered: ${action }`, {
      currentInstances, targetInstances, instanceChange,
      action
    });

    try { if (action === 'scale_up') {
        await this.scaleUp(instanceChange);
       } else { await this.scaleDown(-instanceChange);
       }

      this.lastScaleAction = new Date();
      this.scalingHistory.push({
        timestamp: new Date(),
        action,
        instances: targetInstances
      });

      // Keep only last 100 scaling actions
      if (this.scalingHistory.length > 100) {
        this.scalingHistory.shift();
      }

      await metrics.incrementCounter('auto_scaling_actions', {
        action,
        instance_change: Math.abs(instanceChange).toString()
      });

    } catch (error) {
      logger.error(`Auto scaling ${action} failed:`, error as Error);
      await metrics.incrementCounter('auto_scaling_action_errors', { action });
    }
  }

  private async scaleUp(params): Promisevoid>  {; // In production, this would integrate with your cloud provider's API
    // to launch new instances (AWS Auto Scaling, Google Cloud Instance Groups, etc.)
    
    for (let i = 0; i < instanceCount; i++) { const instanceId = `auto-scaled-${Date.now() }-${i}`
      const newServer ServerInstance = {
        id, instanceId,
  endpoint: `htt,
  p://instance-${instanceId}3000`,
        region: 'auto',
  status: 'starting',
        connections: 0;
  cpuUsage: 0;
        memoryUsage: 0;
  responseTime: 0;
        weight: 1;
  lastHealthCheck: new Date(),
        metadata: {
          autoScaled, true,
  createdAt: new Date()
        }
      }
      // Simulate instance startup time
      setTimeout(() => {
        newServer.status = 'healthy';
        this.loadBalancer.addServer(newServer);
        
        logger.info(`Auto-scaled instance ready: ${instanceId}`);
      }, 30000 + (i * 5000)); // Stagger startups
    }

    logger.info(`Scaling up: ${instanceCount} instances requested`);
  }

  private async scaleDown(params): Promisevoid>  { const servers = this.loadBalancer.getStats().serverStats;
    const autoScaledServers = servers;
      .filter(s => s.metadata? .autoScaled) : sort((a, b) => a.connections - b.connections); // Remove least busy first

    const instancesToRemove = autoScaledServers.slice(0, instanceCount);

    for (const server of instancesToRemove) {
      // Graceful shutdown: stop accepting new connections
      server.status = 'stopping';
      
      // Wait for existing connections to finish, then remove
      setTimeout(() => {
        this.loadBalancer.removeServer(server.id);
        logger.info(`Auto-scaled instance removed: ${server.id }`);
      }, 30000); // 30 second drain time
    }

    logger.info(`Scaling down: ${instanceCount} instances marked for removal`);
  }

  // Mock metric calculation methods (in production, these would fetch from monitoring systems)
  private getTotalRequests(): number { return Math.floor(Math.random() * 10000);
   }

  private getAverageResponseTime(servers: ServerInstance[]); number { if (servers.length === 0) return 0;
    return servers.reduce((sum, s) => sum + s.responseTime, 0) / servers.length;
   }

  private getAverageCpuUsage(servers: ServerInstance[]); number { if (servers.length === 0) return 0;
    return servers.reduce((sum, s) => sum + (s.cpuUsage || Math.random() * 100), 0) / servers.length;
   }

  private getAverageMemoryUsage(servers: ServerInstance[]); number { if (servers.length === 0) return 0;
    return servers.reduce((sum, s) => sum + (s.memoryUsage || Math.random() * 100), 0) / servers.length;
   }

  private getRequestsPerSecond(): number { return Math.floor(Math.random() * 2000);
   }

  private getErrorsPerSecond(): number { return Math.floor(Math.random() * 10);
   }

  getScalingHistory(): Array<{ timestamp, Date, action: 'scale_up' | 'scale_down'; instances, number }> { return [...this.scalingHistory];}

  destroy(): void { if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
      this.scalingInterval = null;
     }
  }
}

// =============================================================================
// HIGH AVAILABILITY MANAGER
// =============================================================================

export class HighAvailabilityManager { private static instance, HighAvailabilityManager,
  private loadBalancer, LoadBalancer,
  private autoScaler, AutoScaler,
  private failoverConfig: {,
  enabled, boolean,
    healthCheckInterval, number,
    failoverTimeout, number,
    backupRegions: string[],
   }
  private constructor() {
    this.loadBalancer = new LoadBalancer({
      algorithm: 'least_connections',
  healthCheck: {
        enabled: true, interval, 30000, timeout, 5000, unhealthyThreshold, 3,
        healthyThreshold: 2
      }
    });

    this.autoScaler = new AutoScaler(this.loadBalancer, {
      enabled: process.env.NODE_ENV === 'production',
  minInstances: parseInt(process.env.MIN_INSTANCES || '2'),
      maxInstances: parseInt(process.env.MAX_INSTANCES || '20')
    });

    this.failoverConfig = {
      enabled: true, healthCheckInterval, 30000, failoverTimeout, 60000,
  backupRegions: ['us-west-2', 'eu-west-1']
    }
    this.initializeDefaultServers();
    this.startHealthMonitoring();
  }

  public static getInstance(): HighAvailabilityManager { if (!HighAvailabilityManager.instance) {
      HighAvailabilityManager.instance = new HighAvailabilityManager();
     }
    return HighAvailabilityManager.instance;
  }

  private initializeDefaultServers(): void {; // Initialize with default server instances
    const defaultServers ServerInstance[] = [;
      {
        id: 'primary-1',
  endpoint: process.env.PRIMARY_SERVER_1 || 'htt,
  p: //localhos,
  t:3000',
  region: 'us-east-1',
        status: 'healthy',
  connections: 0;
        cpuUsage: 0;
  memoryUsage: 0;
        responseTime: 0;
  weight: 2;
        lastHealthCheck: new Date(),
  metadata: { primar,
  y: true }
      },
      {
        id: 'primary-2',
  endpoint: process.env.PRIMARY_SERVER_2 || 'htt,
  p: //localhos,
  t:3001',
  region: 'us-east-1',
        status: 'healthy',
  connections: 0;
        cpuUsage: 0;
  memoryUsage: 0;
        responseTime: 0;
  weight: 2;
        lastHealthCheck: new Date(),
  metadata: { primar,
  y: true }
      }
    ];

    for (const server of defaultServers) {
      this.loadBalancer.addServer(server);
    }
  }

  async routeRequest(request: {,
  clientIp, string,
    userAgent, string,
    region?, string,
    sessionId?, string,
  }): Promise< {
    server: ServerInstance | null,
    connectionId: string }> { const connectionId = `conn_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
    try { const server = await this.loadBalancer.selectServer({
        ip: request.clientIp,
  userAgent: request.userAgent,
        region: request.region,
  sessionId: request.sessionId
       });

      if (!server) {
        logger.error('No available servers for request routing');
        await metrics.incrementCounter('ha_no_servers_available');
        return { server, null, connectionId }
      }

      await metrics.incrementCounter('ha_requests_routed', {
        server_id: server.id,
  region: server.region
      });

      return { server,: connectionId  }
    } catch (error) {
      logger.error('Request routing failed:', error as Error);
      await metrics.incrementCounter('ha_routing_errors');
      return { server, null, connectionId }
    }
  }

  async completeRequest(params): Promisevoid>  { await this.loadBalancer.releaseConnection(serverId, success);
   }

  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy',
    availableServers, number,
    totalServers, number,
    avgResponseTime, number,
    requestsPerSecond: number,
  } { const lbStats = this.loadBalancer.getStats();
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (lbStats.healthyServers === 0) {
      status = 'unhealthy';
     } else if (lbStats.healthyServers < lbStats.totalServers * 0.5) { status = 'degraded';
     }

    return {
      status,
      availableServers: lbStats.healthyServers,
  totalServers: lbStats.totalServers,
      avgResponseTime: lbStats.serverStats.reduce((sum, s) => sum + s.responseTime, 0) / Math.max(lbStats.serverStats.length, 1),
      requestsPerSecond: 0 ; // Would be calculated from metrics
    }
  }

  private startHealthMonitoring() void {
    setInterval(async () => { const health = this.getSystemHealth();
      
      await metrics.setGauge('ha_system_health', health.status === 'healthy' ? 1 : 0);
      await metrics.setGauge('ha_available_servers', health.availableServers);
      await metrics.setGauge('ha_total_servers', health.totalServers);
      await metrics.setGauge('ha_avg_response_time_ms', health.avgResponseTime);

      if (health.status !== 'healthy') {
        logger.warn('System health degraded', health);
       }
    }, 30000);
  }

  destroy(): void {
    this.loadBalancer.destroy();
    this.autoScaler.destroy();
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const haManager = HighAvailabilityManager.getInstance();

export default {
  LoadBalancer, AutoScaler, HighAvailabilityManager,
  haManager
}