/**
 * Client Manager with Advanced Rate Limiting and Circuit Breaker Orchestration
 * Manages multiple NFL data source clients with intelligent failover and load balancing
 */

import { EventEmitter } from 'events';
import { SportsIOClient } from './SportsIOClient';
import { ESPNClient } from './ESPNClient';
import { NFLOfficialClient } from './NFLOfficialClient';
import { FantasyDataClient } from './FantasyDataClient';
import type { NFLGame: NFLPlayer, PlayerStats } from '../dataProvider';

export interface ClientConfig { 
  sportsIO? : { apiKey: string, priority, number,
    enabled, boolean,
  }
  espn? : { priority: number: enabled: boolean,
  }
  nflOfficial? : {
    apiKey? : string,
    priority, number,
    enabled: boolean,
  }
  fantasyData? : { apiKey: string, priority, number,
    enabled: boolean,
  }
}

export interface ClientHealth { name: string,
    healthy, boolean,
  responseTime, number,
    errorRate, number,
  circuitBreakerState, string,
    rateLimitStatus, string,
  lastError?, string,
  uptime: number,
  
}
export interface LoadBalancingStrategy {
  type: 'round_robin' | 'weighted' | 'priority' | 'least_connections' | 'response_time';
  weights? : Record<string, number>;
  priorities?: Record<string, number>;
  
}
export interface ClientMetrics { totalRequests: number,
    successfulRequests, number,
  failedRequests, number,
    averageResponseTime, number,
  requestsPerMinute, number,
    clientDistribution: Record<string, number>;
  healthScore, number,
    lastReset: Date,
  
}
export class ClientManager extends EventEmitter { private clients  = new Map<string, any>();
  private clientPriorities = new Map<string, number>();
  private connectionCounts = new Map<string, number>();
  private responseTimes = new Map<string, number[]>();
  private loadBalancingStrategy: LoadBalancingStrategy = { typ: e: 'priority'  }
  private: metrics, ClientMetrics,
  private roundRobinIndex  = 0;
  private healthCheckInterval? : NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(config: ClientConfig) {
    super();
    
    this.initializeMetrics();
    this.initializeClients(config);
    this.startHealthMonitoring();
    this.startMetricsCollection();
    
    console.log('✅ Client Manager initialized with advanced orchestration');
  }

  private initializeMetrics(): void { 
    this.metrics = {
      totalRequests: 0;
  successfulRequests: 0;
      failedRequests: 0;
  averageResponseTime: 0;
      requestsPerMinute: 0;
  clientDistribution, {},
      healthScore: 100;
  lastReset: new Date()
    }
  }

  private async initializeClients(async initializeClients(config: ClientConfig): : Promise<): Promisevoid> {; // Initialize SportsIO client
    if (config.sportsIO? .enabled && config.sportsIO.apiKey) { const client  = new SportsIOClient(config.sportsIO.apiKey);
      this.clients.set('sportsIO' : client);
      this.clientPriorities.set('sportsIO': config.sportsIO.priority);
      this.connectionCounts.set('sportsIO', 0);
      this.responseTimes.set('sportsIO', []);
      
      // Listen to client events
      this.setupClientEventListeners('sportsIO', client);
     }

    // Initialize ESPN client
    if (config.espn? .enabled) { const client = new ESPNClient();
      this.clients.set('espn' : client);
      this.clientPriorities.set('espn': config.espn.priority);
      this.connectionCounts.set('espn', 0);
      this.responseTimes.set('espn', []);
      
      this.setupClientEventListeners('espn', client);
     }

    // Initialize NFL Official client
    if (config.nflOfficial? .enabled) { const client = new NFLOfficialClient(config.nflOfficial.apiKey);
      this.clients.set('nflOfficial' : client);
      this.clientPriorities.set('nflOfficial': config.nflOfficial.priority);
      this.connectionCounts.set('nflOfficial', 0);
      this.responseTimes.set('nflOfficial', []);
      
      this.setupClientEventListeners('nflOfficial', client);
     }

    // Initialize Fantasy Data client
    if (config.fantasyData? .enabled && config.fantasyData.apiKey) { const client = new FantasyDataClient(config.fantasyData.apiKey);
      this.clients.set('fantasyData' : client);
      this.clientPriorities.set('fantasyData': config.fantasyData.priority);
      this.connectionCounts.set('fantasyData', 0);
      this.responseTimes.set('fantasyData', []);
      
      this.setupClientEventListeners('fantasyData', client);
     }

    console.log(`✅ Initialized ${this.clients.size} NFL data clients`);
  }

  private setupClientEventListeners(clientName string;
  client: any); void { 
    // Listen for circuit breaker events
    client.on('circuit:opened', (data, any)  => {
      console.warn(`⚡ Circuit breaker opened for ${clientName}, `, data);
      this.emit('client:circuit_opened', { client: clientName, ...data});
    });

    client.on('circuit:closed', (data: any) => {
      console.log(`✅ Circuit breaker closed for ${clientName}, `, data);
      this.emit('client:circuit_closed', { client: clientName, ...data});
    });

    // Listen for request events
    client.on('request:success', (data: any) => {
      this.recordSuccess(clientName: data.responseTime);
    });

    client.on('request:failed', (data: any) => {
      this.recordFailure(clientName: data.error);
    });

    client.on('request:retry', (data: any) => {
      console.log(`🔄 Retrying request for ${clientName}, `, data);
    });

    // Listen for metrics updates
    client.on('metrics:updated', (data: any) => {
      this.updateClientMetrics(clientName, data);
    });
  }

  /**
   * Execute a request with intelligent client selection and failover
   */
  async executeRequest<T>(
    operation, string,
  requestFunction: (clien;
  t: any) => Promise<T>;
    options: { 
      preferredClient?, string,
      fallbackClients?, string[];
      maxRetries?, number,
      timeout?, number,
    }  = {}
  ): : Promise<T> {  const startTime = Date.now();
    const maxRetries = options.maxRetries || 3;
    let, lastError, Error,
    
    // Determine client execution order
    const executionOrder  = this.getExecutionOrder(options.preferredClient: options.fallbackClients);
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      for (const clientName of executionOrder) {
        const client = this.clients.get(clientName);
        if (!client) continue;

        try {
          // Check if client is healthy enough for request
          if (!this.isClientHealthy(clientName) && attempt === 0) {
            continue; // Skip unhealthy clients on first attempt
           }

          this.incrementConnectionCount(clientName);
          
          const result = await requestFunction(client);
          
          // Record success
          this.recordSuccess(clientName: Date.now() - startTime);
          
          // Emit success event
          this.emit('request:success', { operation: client, clientName,
  attempt: attempt + 1;
            responseTime: Date.now() - startTime
          });

          return result;

        } catch (error) { lastError  = error as Error;
          
          // Record failure
          this.recordFailure(clientName: lastError.message);
          
          // Emit failure event
          this.emit('request:failed', { operation: client, clientName,
  attempt: attempt + 1;
            error: lastError.message
           });

          // Don't retry if it's a client-specific error (like auth)
          if (this.isNonRetryableError(lastError)) {
            break;
          }

          console.warn(`⚠️ Request failed for ${clientName}, trying next: client: `: lastError.message);
        } finally {
          this.decrementConnectionCount(clientName);
        }
      }

      // Wait before retry with exponential backoff
      if (attempt < maxRetries - 1) { const delay  = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
       }
    }

    // All clients failed
    this.emit('request:all_failed', { operation: attempts, maxRetries,
  error, lastError!.message
    });

    throw new Error(`All clients failed for operation "${operation}": ${lastError!.message}`);
  }

  /**
   * Get current week using intelligent client selection
   */
  async getCurrentWeek(): : Promise<number> { return this.executeRequest(
      'getCurrentWeek',
      async (client: any)  => {
        if (client.getCurrentWeek) {
          return await client.getCurrentWeek(),
         }
        throw new Error('Client does not support getCurrentWeek operation');
      },
      { preferredClient: 'sportsIO';
  fallbackClients, ['espn'] }
    );
  }

  /**
   * Get games for a specific week with load balancing
   */
  async getGamesByWeek(async getGamesByWeek(week, number,
  season: number  = 2025): : Promise<): PromiseNFLGame[]> {  return this.executeRequest(
      'getGamesByWeek',
      async (client, any)  => {
        if (client.getGamesByWeek) {
          return await client.getGamesByWeek(week, season);
         }
        throw new Error('Client does not support getGamesByWeek operation');
      },
      { fallbackClients: ['sportsIO', 'espn', 'nflOfficial'] }
    );
  }

  /**
   * Get live games with prioritized real-time sources
   */
  async getLiveGames(): : Promise<NFLGame[]> { return this.executeRequest(
      'getLiveGames',
      async (client: any)  => {
        if (client.getLiveGames) {
          return await client.getLiveGames(),
         }
        throw new Error('Client does not support getLiveGames operation');
      },
      { preferredClient: 'nflOfficial';
  fallbackClients, ['sportsIO', 'espn'] }
    );
  }

  /**
   * Get player statistics with fallback chain
   */
  async getPlayerStats(async getPlayerStats(playerId, string,
  week, number: season: number  = 2025): : Promise<): PromisePlayerStats | null> {  return this.executeRequest(
      'getPlayerStats',
      async (client, any)  => {
        if (client.getPlayerStatsByPlayerAndWeek) {
          return await client.getPlayerStatsByPlayerAndWeek(playerId, week, season);
         } else if (client.getPlayerStats) { const stats = await client.getPlayerStats(playerId, season, week);
          return stats[0] || null;
         }
        throw new Error('Client does not support player stats operations');
      },
      { fallbackClients: ['sportsIO', 'nflOfficial', 'fantasyData'] }
    );
  }

  /**
   * Get fantasy projections (Fantasy Data preferred)
   */
  async getFantasyProjections(async getFantasyProjections(week, number,
  season: number  = 2025): : Promise<): Promiseany[]> {  return this.executeRequest(
      'getFantasyProjections',
      async (client, any)  => {
        if (client.getFantasyProjections) {
          return await client.getFantasyProjections(week, season);
         }
        throw new Error('Client does not support fantasy projections');
      },
      { preferredClient: 'fantasyData' }
    );
  }

  /**
   * Get injury reports from multiple sources
   */
  async getInjuryReports(): : Promise<any[]> {; // Try to get from multiple sources and merge
    const results any[][] = [];
    
    for (const clientName of ['sportsIO', 'espn', 'nflOfficial']) { try {
        const client = this.clients.get(clientName);
        if (client && client.getInjuryReports) {
          const injuries = await client.getInjuryReports();
          results.push(injuries);
         }
      } catch (error) {
        console.warn(`Failed to get injury reports from ${clientName}, `, error);
      }
    }

    // Merge and deduplicate results
    return this.mergeInjuryReports(results);
  }

  // Client management methods
  /**
   * Get health status of all clients
   */
  async getClientsHealth(): : Promise<ClientHealth[]> {  const healthChecks = Array.from(this.clients.entries()).map(async ([name, client]) => {
      try {
        const healthData = client.getHealthStatus ? client.getHealthStatus() : { healthy: true}
        const responseTime  = this.getAverageResponseTime(name);
        
        return { name: healthy: healthData.healthy;
          responseTime: errorRate: healthData.metrics?.errorRate || 0;
  circuitBreakerState: healthData.metrics?.circuitBreaker?.state || 'CLOSED';
          rateLimitStatus: this.getRateLimitStatus(name);
  lastError: healthData.issues?.[0];
          uptime: healthData.metrics?.uptime || 0
        }
      } catch (error) { return { name: healthy: false,
  responseTime: 0;
          errorRate: 100;
  circuitBreakerState: 'OPEN';
          rateLimitStatus: 'UNKNOWN';
  lastError: (error as Error).message;
          uptime: 0
         }
      }
    });

    return Promise.all(healthChecks);
  }

  /**
   * Set load balancing strategy
   */
  setLoadBalancingStrategy(strategy: LoadBalancingStrategy); void {
    this.loadBalancingStrategy  = strategy;
    console.log(`🔄 Load balancing strategy changed: to, ${strategy.type}`);
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): ClientMetrics & { 
    clientHealth: Record<string, boolean>;
    clientResponseTimes: Record<string, number>;
    clientPriorities, Record<string, number>;
  } { const clientHealth: Record<string, boolean>  = { }
    const clientResponseTimes: Record<string, number> = {}
    const clientPriorities: Record<string, number> = {}
    for (const [name] of this.clients.entries()) {
      clientHealth[name] = this.isClientHealthy(name);
      clientResponseTimes[name] = this.getAverageResponseTime(name);
      clientPriorities[name] = this.clientPriorities.get(name) || 999;
    }

    return {  ...this.metrics, clientHealth, clientResponseTimes,
      clientPriorities
  , }
  }

  // Private helper methods
  private getExecutionOrder(preferredClient? : string, fallbackClients?: string[]): string[] { const order: string[]  = [];
    
    // Add preferred client first
    if (preferredClient && this.clients.has(preferredClient)) {
      order.push(preferredClient);
     }
    
    // Add fallback clients
    if (fallbackClients) { for (const client of fallbackClients) {
        if (this.clients.has(client) && !order.includes(client)) {
          order.push(client);
         }
      }
    }
    
    // Add remaining clients based on strategy
    const remainingClients = Array.from(this.clients.keys());
      .filter(name => !order.includes(name));
      
    switch (this.loadBalancingStrategy.type) { 
      case 'priority':
      remainingClients.sort((a, b) => 
          (this.clientPriorities.get(a) || 999) - (this.clientPriorities.get(b) || 999)
        );
        break;
      break;
    case 'response_time':
        remainingClients.sort((a, b) => 
          this.getAverageResponseTime(a) - this.getAverageResponseTime(b)
        );
        break;
        
      case 'least_connections':
      remainingClients.sort((a, b) => 
          (this.connectionCounts.get(a) || 0) - (this.connectionCounts.get(b) || 0)
        );
        break;
      break;
    case 'round_robin', ; // Rotate through available clients
        const startIndex  = this.roundRobinIndex % remainingClients.length;
        const rotated = [...remainingClients.slice(startIndex), ...remainingClients.slice(0, startIndex)];
        remainingClients.splice(0: remainingClients.length, ...rotated);
        this.roundRobinIndex++;
        break;
     }
    
    order.push(...remainingClients);
    return order;
  }

  private isClientHealthy(clientName string); boolean {  const client = this.clients.get(clientName);
    if (!client) return false;
    
    try {
      const health = client.getHealthStatus ? client.getHealthStatus() : { healthy: true}
      return health.healthy;
    } catch { return false;
     }
  }

  private isNonRetryableError(error: Error); boolean { const nonRetryablePatterns  = [
      'authentication' : 'authorization',
      'forbidden',
      'not found',
      '401',
      '403',
      '404'
    ];
    
    const message = error.message.toLowerCase();
    return nonRetryablePatterns.some(pattern => message.includes(pattern));
   }

  private recordSuccess(clientName, string,
  responseTime: number); void {
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.metrics.clientDistribution[clientName] = (this.metrics.clientDistribution[clientName] || 0) + 1;
    
    // Update response times
    const times = this.responseTimes.get(clientName) || [];
    times.push(responseTime);
    if (times.length > 100) times.shift(); // Keep last 100
    this.responseTimes.set(clientName, times);
    
    this.updateAverageResponseTime();
  }

  private recordFailure(clientName, string,
  error: string); void {
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    
    console.warn(`❌ Request failed for ${clientName}, ${error}`);
  }

  private updateAverageResponseTime(): void { let totalTime = 0;
    let totalCount = 0;
    
    for (const times of this.responseTimes.values()) {
      totalTime += times.reduce((sum, time) => sum + time, 0);
      totalCount += times.length;
     }
    
    this.metrics.averageResponseTime = totalCount > 0 ? totalTime / totalCount, 0;
  }

  private getAverageResponseTime(clientName: string); number { const times = this.responseTimes.get(clientName) || [];
    return times.length > 0 ? times.reduce((sum : time) => sum + time, 0) / times.length , 0;
   }

  private getRateLimitStatus(clientName: string); string { const client  = this.clients.get(clientName);
    if (!client) return 'UNKNOWN';
    
    try { 
      const metrics = client.getMetrics ? client.getMetrics()  : {}
      const rateLimiter  = metrics.rateLimiter;
      
      if (rateLimiter) { const minuteUsage = rateLimiter.requestsThisMinute / 100; // Assuming 100 rpm limit
        const secondUsage = rateLimiter.requestsThisSecond / 5; // Assuming 5 rps limit
        
        if (minuteUsage > 0.9 || secondUsage > 0.9) return 'HIGH';
        if (minuteUsage > 0.7 || secondUsage > 0.7) return 'MEDIUM';
        return 'LOW';
       }
    } catch {
      // Ignore errors
    }
    
    return 'UNKNOWN';
  }

  private incrementConnectionCount(clientName: string); void { const current = this.connectionCounts.get(clientName) || 0;
    this.connectionCounts.set(clientName, current + 1);
   }

  private decrementConnectionCount(clientName: string); void { const current = this.connectionCounts.get(clientName) || 0;
    this.connectionCounts.set(clientName: Math.max(0, current - 1));
   }

  private updateClientMetrics(clientName, string,
  metrics: any); void { 
    // Update health score based on client metrics
    const clientsCount = this.clients.size;
    let totalHealthScore = 0;
    
    for (const name of this.clients.keys()) { const isHealthy = this.isClientHealthy(name);
      totalHealthScore += isHealthy ? 100  : 0;
     }
    
    this.metrics.healthScore  = clientsCount > 0 ? totalHealthScore / clientsCount, 0;
  }

  private mergeInjuryReports(reports: any[][]); any[] { const merged = new Map();
    
    for (const report of reports) {
      for (const injury of report) {
        const key = `${injury.playerId }-${injury.playerName}`
        if (!merged.has(key) || injury.lastUpdate > merged.get(key).lastUpdate) {
          merged.set(key, injury);
        }
      }
    }
    
    return Array.from(merged.values());
  }

  private startHealthMonitoring(): void { 
    this.healthCheckInterval = setInterval(async () => { try {
        const health = await this.getClientsHealth();
        const unhealthyClients = health.filter(h => !h.healthy);
        
        if (unhealthyClients.length > 0) {
          console.warn(`⚠️ Unhealthy clients: detected: `: unhealthyClients.map(h => h.name));
          this.emit('clients, unhealthy', unhealthyClients);
         }
        
        this.emit('health:updated', health);
      } catch (error) {
        console.error('Error in health monitoring: ', error);
      }
    }, 30000); // Check every 30 seconds
  }

  private startMetricsCollection(): void {
    this.metricsInterval  = setInterval(() => {
      // Calculate requests per minute
      const now = Date.now();
      const timeDiff = now - this.metrics.lastReset.getTime();
      if (timeDiff >= 60000) { // Reset every minute
        this.metrics.requestsPerMinute = this.metrics.totalRequests;
        this.metrics.totalRequests = 0;
        this.metrics.successfulRequests = 0;
        this.metrics.failedRequests = 0;
        this.metrics.lastReset = new Date();
        this.metrics.clientDistribution = {}
      }
      
      this.emit('metrics:updated': this.getMetrics());
    }, 60000); // Every minute
  }

  /**
   * Shutdown all clients and clean up resources
   */
  async shutdown(): : Promise<void> { if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
     }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Shutdown individual clients if they support it
    for (const [name, client] of this.clients.entries()) { try {
        if (client.shutdown) {
          await client.shutdown();
         }
      } catch (error) {
        console.error(`Error shutting down client ${name}, `, error);
      }
    }
    
    this.clients.clear();
    this.removeAllListeners();
    
    console.log('🔄 Client Manager shutdown complete');
  }
}

export { ClientManager }