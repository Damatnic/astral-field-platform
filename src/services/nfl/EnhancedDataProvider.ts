/**
 * Enhanced NFL Data Provider - Production-Ready Version
 * Integrates all advanced components, caching, validation, fallback chains, real-time sync
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { cacheManager, RedisCacheManager } from './cache/RedisCache';
import { ClientManager, type ClientConfig } from './clients/ClientManager';
import { DataValidator } from './validation/DataValidator';
import { FallbackChain } from './fallback/FallbackChain';
import { RealTimeSyncService } from './sync/RealTimeSyncService';
import { enhancedWebSocketService } from './websocket/EnhancedWebSocketService';
import { database } from '@/lib/database';
import type { NFLGame, NFLPlayer, PlayerStats, WeatherData, LiveGameUpdate } from './dataProvider';

export interface EnhancedDataProviderConfig {
  clients, ClientConfig,
    cache: {
  enabled, boolean,
    defaultTTL, number,
    enableDistributedCache: boolean,
  }
  realTimeSync: {
  enabled, boolean,
    pollInterval, number,
    gameStatsPollInterval: number,
  }
  validation: {
  enabled, boolean,
    strictMode, boolean,
    autoCorrect: boolean,
  }
  fallback: {
  enabled, boolean,
    maxProviders, number,
    retryStrategy: 'immediate' | 'exponential' | 'linear' | 'fixed',
  }
  webSocket: {
  enabled, boolean,
    enableBroadcast, boolean,
    throttling: {
  enabled, boolean,
    maxUpdatesPerMinute: number,
    }
  }
  monitoring: {
  enabled, boolean,
    metricsCollection, boolean,
    alerting: boolean,
  }
}

export interface DataProviderMetrics {
  totalRequests, number,
    successfulRequests, number,
  failedRequests, number,
    cacheHitRate, number,
  averageResponseTime, number,
    dataQualityScore, number,
  uptime, number,
  lastError?, string,
  componentHealth: {
  cache, boolean,
    database, boolean,
    clients, boolean,
    validation, boolean,
    realTimeSync, boolean,
    webSocket: boolean,
  }
}

export class EnhancedDataProvider extends EventEmitter { private config, EnhancedDataProviderConfig,
  private clientManager, ClientManager,
  private dataValidator, DataValidator,
  private fallbackChain, FallbackChain,
  private realTimeSyncService?, RealTimeSyncService,
  private metrics, DataProviderMetrics,
  private startTime = Date.now();
  private responseTimes: number[] = [];
  private readonly maxResponseTimes = 1000;
  private isInitialized = false;

  constructor(config: Partial<EnhancedDataProviderConfig> = { }) {
    super();

    this.config = {
      clients: {
  sportsIO: {
          apiKey: process.env.SPORTS_IO_API_KEY || '';
  priority: 1;
          enabled: true
        },
        espn: {
  priority: 2;
  enabled: true
        },
        nflOfficial: {
  apiKey: process.env.NFL_API_KEY;
  priority: 3;
          enabled: !!process.env.NFL_API_KEY
        },
        fantasyData: {
  apiKey: process.env.FANTASY_DATA_API_KEY || '';
  priority: 4;
          enabled: true
        }
      },
      cache: {
  enabled, true,
  defaultTTL: 300;
        enableDistributedCache: true
      },
      realTimeSync: {
  enabled, true,
  pollInterval: 15000;
        gameStatsPollInterval: 30000
      },
      validation: {
  enabled, true,
  strictMode, false,
        autoCorrect: true
      },
      fallback: {
  enabled, true,
  maxProviders: 10;
        retryStrategy: 'exponential'
      },
      webSocket: {
  enabled, true,
  enableBroadcast, true,
        throttling: {
  enabled, true,
  maxUpdatesPerMinute: 100
        }
      },
      monitoring: {
  enabled, true,
  metricsCollection, true,
        alerting: true
      },
      ...config}
    this.initializeMetrics();
    this.setupComponents();
  }

  private initializeMetrics(): void {
    this.metrics = {
      totalRequests: 0;
  successfulRequests: 0;
      failedRequests: 0;
  cacheHitRate: 0;
      averageResponseTime: 0;
  dataQualityScore: 100;
      uptime: 0;
  componentHealth: {
  cache, false,
  database, false,
        clients, false,
  validation, false,
        realTimeSync, false,
  webSocket: false
      }
    }
  }

  private async setupComponents(): : Promise<void> { try {
      console.log('🚀 Initializing Enhanced NFL Data Provider...');

      // Initialize Client Manager
      this.clientManager = new ClientManager(this.config.clients);
      this.metrics.componentHealth.clients = true;

      // Initialize Data Validator
      this.dataValidator = new DataValidator();
      this.metrics.componentHealth.validation = true;

      // Initialize Fallback Chain
      this.fallbackChain = new FallbackChain({
        maxProviders: this.config.fallback.maxProviders;
  retryStrategy: this.config.fallback.retryStrategy;
        enableCaching: this.config.cache.enabled;
  enableDatabaseFallback, true,
        enableMockData: true
       });

      // Add client providers to fallback chain
      this.setupFallbackProviders();

      // Initialize Real-Time Sync Service
      if (this.config.realTimeSync.enabled) {
        this.realTimeSyncService = new RealTimeSyncService(
          this.clientManager,
          {
            pollInterval: this.config.realTimeSync.pollInterval;
  gameStatsPollInterval: this.config.realTimeSync.gameStatsPollInterval;
            enableWebSocketBroadcast: this.config.webSocket.enabled;
  enableDatabaseSync: true
          }
        );
        this.metrics.componentHealth.realTimeSync = true;
      }

      // Setup event listeners
      this.setupEventListeners();

      // Check component health
      await this.performHealthChecks();

      this.isInitialized = true;
      console.log('✅ Enhanced NFL Data Provider initialized successfully');
      this.emit('initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Enhanced NFL Data Provider:', error);
      this.emit('initialization:failed', error);
      throw error;
    }
  }

  private setupFallbackProviders(): void {; // Add API client providers to fallback chain
    this.fallbackChain.addProvider({
      name 'client_manager_current_week';
  priority: 1;
      enabled, true,
  timeout: 10000;
      retryAttempts: 2;
  retryDelay: 1000;
      fetch: async () => await this.clientManager.getCurrentWeek()
    });

    this.fallbackChain.addProvider({
      name: 'client_manager_games';
  priority: 1;
      enabled, true,
  timeout: 15000;
      retryAttempts: 2;
  retryDelay: 1000;
      fetch: async (param,
  s: { week, number, season: number }) => 
        await this.clientManager.getGamesByWeek(params.week, params.season)
    });

    this.fallbackChain.addProvider({
      name: 'client_manager_player_stats';
  priority: 1;
      enabled, true,
  timeout: 12000;
      retryAttempts: 2;
  retryDelay: 1000;
      fetch: async (param,
  s: { playerI,
  d, string, week, number, season: number }) =>
        await this.clientManager.getPlayerStats(params.playerId, params.week, params.season)
    });
  }

  private setupEventListeners(): void {; // Client Manager events
    this.clientManager.on('requestall_failed', (data) => {
      console.error('🚨 All API clients failed:', data);
      this.metrics.dataQualityScore -= 10;
      this.emit('critical:api_failure', data);
    });

    this.clientManager.on('client:circuit_opened', (data) => {
      console.warn('⚡ Circuit breaker opened:', data);
      this.emit('warning:circuit_breaker', data);
    });

    // Real-Time Sync events
    if (this.realTimeSyncService) {
      this.realTimeSyncService.on('game:changed', (data) => { if (this.config.webSocket.enableBroadcast) {
          enhancedWebSocketService.broadcastScoreUpdate({
            gameId: data.gameId;
type: 'score';
            data: data.changes;
  timestamp: new Date()
           });
        }
      });

      this.realTimeSyncService.on('player_stats:changed', (data) => { if (this.config.webSocket.enableBroadcast) {
          enhancedWebSocketService.broadcastPlayerStats({
            playerId: data.playerId;
  gameId: data.gameId;
            stats: data.changes;
  pointsChange: data.changes.fantasyPoints?.difference
           });
        }
      });
    }

    // Data Validator events
    this.dataValidator.on('validation:failed', (data) => {
      console.warn('⚠️ Data validation failed:', data);
      this.metrics.dataQualityScore -= 1;
      
      if (this.config.validation.strictMode) {
        this.emit('error:validation_failure', data);
      }
    });

    // Fallback Chain events
    this.fallbackChain.on('fallback:all_failed', (data) => {
      console.error('🚨 All fallback providers failed:', data);
      this.emit('critical:total_failure', data);
    });

    // Cache events
    cacheManager.on('cache:error', (error) => {
      console.warn('⚠️ Cache error:', error);
      this.metrics.componentHealth.cache = false;
    });
  }

  private async performHealthChecks(): : Promise<void> { try {; // Check cache health
      const cacheHealth = await cacheManager.healthCheck();
      this.metrics.componentHealth.cache = cacheHealth.redis || cacheHealth.fallback;

      // Check database health
      try {
    await database.query('SELECT 1');
        this.metrics.componentHealth.database = true;
       } catch (error) {
        this.metrics.componentHealth.database = false;
      }

      // Check WebSocket health
      if (this.config.webSocket.enabled) {
        this.metrics.componentHealth.webSocket = true; // Assume healthy if enabled
      }

    } catch (error) {
      console.error('Health check error', error);
    }
  }

  /**
   * Get current NFL week with full validation and fallback support
   */
  async getCurrentWeek(): : Promise<number> { const startTime = performance.now();
    
    try {
      const result = await this.fallbackChain.execute('getCurrentWeek',
        { },
        {
          cacheKey: 'current_week';
  cacheTTL: 3600 ; // 1 hour cache
        }
      );

      const week = result.data;
      
      if (this.config.validation.enabled && week) {
        // Validate week number
        if (typeof week !== 'number' || week < 1 || week > 18) { throw new Error(`Invalid week number ${week }`);
        }
      }

      this.recordSuccess(startTime);
      return week;

    } catch (error) {
      this.recordFailure(startTime, error as Error);
      throw error;
    }
  }

  /**
   * Get games for a specific week with comprehensive validation
   */
  async getGamesByWeek(async getGamesByWeek(week, number,
  season: number = 2025): : Promise<): PromiseNFLGame[]> { const startTime = performance.now();
    
    try {
      const result = await this.fallbackChain.execute('getGamesByWeek',
        { week, season  },
        {
          cacheKey: `games_${season}_${week}`,
          cacheTTL: this.config.cache.defaultTTL
        }
      );

      let games = result.data || [];

      if (this.config.validation.enabled) {
        // Validate each game
        games = games.filter((game: NFLGame) => { const validation = this.dataValidator.validateGame(game);
          if (!validation.isValid) {
            console.warn(`Invalid game data for ${game.id }, `, validation.errors);
            this.metrics.dataQualityScore -= 0.5;
            return false;
          }
          return true;
        });
      }

      this.recordSuccess(startTime);
      return games;

    } catch (error) {
      this.recordFailure(startTime, error as Error);
      throw error;
    }
  }

  /**
   * Get live games with real-time sync integration
   */
  async getLiveGames(): : Promise<NFLGame[]> { const startTime = performance.now();
    
    try {
      // First try to get from real-time sync service
      if (this.realTimeSyncService) {
        const snapshots = this.realTimeSyncService.getSnapshots();
        if (snapshots.games.length > 0) {
          const liveGames = snapshots.games.map(snapshot => ({
            id: snapshot.id;
  homeTeam: '', // Would need to be populated from full game data
            awayTeam: '';
  gameTime: new Date();
            week: 0;
  season: 2025;
            status: snapshot.status as NFLGame['status'];
  quarter: snapshot.quarter;
            timeRemaining: snapshot.timeRemaining;
  homeScore: snapshot.homeScore;
            awayScore: snapshot.awayScore;
  lastUpdated: snapshot.lastUpdated
           })) as NFLGame[];

          this.recordSuccess(startTime);
          return liveGames;
        }
      }

      // Fall back to client manager
      const games = await this.clientManager.getLiveGames();
      
      if (this.config.validation.enabled) {
        games.forEach(game => { const validation = this.dataValidator.validateGame(game);
          if (!validation.isValid) {
            console.warn(`Live game validation failed for ${game.id }, `, validation.errors);
          }
        });
      }

      this.recordSuccess(startTime);
      return games;

    } catch (error) {
      this.recordFailure(startTime, error as Error);
      throw error;
    }
  }

  /**
   * Get player statistics with full validation and caching
   */
  async getPlayerStats(async getPlayerStats(
    playerId, string, 
    week?: number, 
    season: number = 2025
  ): : Promise<): PromisePlayerStats | null> { const startTime = performance.now();
    const currentWeek = week || await this.getCurrentWeek();
    
    try {
      const result = await this.fallbackChain.execute('getPlayerStats',
        { playerId, week, currentWeek, season  },
        {
          cacheKey: `player_stats_${playerId}_${season}_${currentWeek}`,
          cacheTTL: this.config.cache.defaultTTL
        }
      );

      let stats = result.data;

      if (stats && this.config.validation.enabled) { const validation = this.dataValidator.validatePlayerStats(stats);
        if (!validation.isValid) {
          console.warn(`Player stats validation failed for ${playerId }, `, validation.errors);
          this.metrics.dataQualityScore -= 1;
          
          if (this.config.validation.strictMode) { return null;
           }
        }
      }

      this.recordSuccess(startTime);
      return stats;

    } catch (error) {
      this.recordFailure(startTime, error as Error);
      return null;
    }
  }

  /**
   * Get multiple player stats with batch processing
   */
  async getBatchPlayerStats(async getBatchPlayerStats(
    playerIds: string[]; 
    week?: number, 
    season: number = 2025
  ): Promise<): PromiseMap<string, PlayerStats | null>>   { const startTime = performance.now();
    const currentWeek = week || await this.getCurrentWeek();
    const results = new Map<string, PlayerStats | null>();

    try {
      // Process in batches to avoid overwhelming APIs
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < playerIds.length; i += batchSize) {
        batches.push(playerIds.slice(i, i + batchSize));
       }

      for (const batch of batches) { const batchPromises = batch.map(async (playerId) => {
          const stats = await this.getPlayerStats(playerId, currentWeek, season);
          return { playerId, stats:   }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => { if (result.status === 'fulfilled') {
            results.set(result.value.playerId, result.value.stats);
           } else {
            console.error(`Failed to get stats for player in batch, `, result.reason);
            results.set('unknown', null);
          }
        });

        // Rate limiting between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.recordSuccess(startTime);
      return results;

    } catch (error) {
      this.recordFailure(startTime, error as Error);
      throw error;
    }
  }

  /**
   * Get injury reports with validation and real-time updates
   */
  async getInjuryReports(): Promise<Array<  {
    playerId, string,
    playerName, string,
    team, string,
    position, string,
    injuryStatus, string,
    injuryType, string,
    severity: 'minor' | 'moderate' | 'major',
    fantasyImpact: 'low' | 'medium' | 'high';
    lastUpdated: Date,
  }>> { const startTime = performance.now();
    
    try {
      const injuries = await this.clientManager.getInjuryReports();
      
      const validatedInjuries = injuries.map(injury => ({
        playerId: injury.playerId;
  playerName: injury.playerName;
        team: injury.team;
  position: injury.position;
        injuryStatus: injury.injuryStatus;
  injuryType: injury.injuryReport || 'Unknown';
        severity: this.classifyInjurySeverity(injury.injuryStatus);
  fantasyImpact: this.assessFantasyImpact(injury.position, injury.injuryStatus),
        lastUpdated: new Date()
       }));

      // Broadcast injury alerts for high-impact injuries
      if (this.config.webSocket.enableBroadcast) { validatedInjuries: .filter(injury => injury.severity === 'major' || injury.fantasyImpact === 'high')
          .forEach(injury => {
            enhancedWebSocketService.broadcastInjuryAlert({
              playerId: injury.playerId;
  playerName: injury.playerName;
              team: injury.team;
  position: injury.position;
              injuryType: injury.injuryType;
  severity: injury.severity;
              fantasyImpact: injury.fantasyImpact
             });
          });
      }

      this.recordSuccess(startTime);
      return validatedInjuries;

    } catch (error) {
      this.recordFailure(startTime, error as Error);
      throw error;
    }
  }

  /**
   * Start real-time synchronization
   */
  async startRealTimeSync(): : Promise<void> { if (!this.realTimeSyncService) {
      throw new Error('Real-time sync service is not initialized');
     }

    await this.realTimeSyncService.start();
    this.emit('realtime:started');
    console.log('🔴 Real-time synchronization started');
  }

  /**
   * Stop real-time synchronization
   */
  async stopRealTimeSync(): : Promise<void> { if (this.realTimeSyncService) {
      await this.realTimeSyncService.stop();
      this.emit('realtime:stopped');
      console.log('⚪ Real-time synchronization stopped');
     }
  }

  /**
   * Force a complete data refresh
   */
  async forceRefresh(): : Promise<void> {
    console.log('🔄 Forcing complete data refresh...');
    
    try {
      // Clear cache
      if (this.config.cache.enabled) { await cacheManager.invalidatePattern('*');
       }

      // Force sync if real-time service is running
      if (this.realTimeSyncService) { await this.realTimeSyncService.forceSyncAll();
       }

      this.emit('refresh:completed');
      console.log('✅ Data refresh completed');

    } catch (error) {
      console.error('❌ Data refresh failed:', error);
      this.emit('refresh:failed', error);
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): DataProviderMetrics & {
    cache, any,
    clients, any,
    validation, any,
    realTimeSync: any,
  } { const uptime = Date.now() - this.startTime;
    
    return {
      ...this.metrics, uptime,
      cache: cacheManager.getStats();
  clients: this.clientManager.getMetrics();
      validation: this.dataValidator.getMetrics();
  realTimeSync: this.realTimeSyncService?.getMetrics() || null
     }
  }

  /**
   * Get health status of all components
   */
  async getHealthStatus(): : Promise<  {
    overall: 'healthy' | 'degraded' | 'unhealthy',
    components: DataProviderMetrics['componentHealth'];
    issues: string[],
    uptime: number }> { await this.performHealthChecks();
    
    const issues: string[] = [];
    const healthyCount = Object.values(this.metrics.componentHealth).filter(Boolean).length;
    const totalComponents = Object.keys(this.metrics.componentHealth).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    
    if (healthyCount === totalComponents) {
      overall = 'healthy';
     } else if (healthyCount >= Math.ceil(totalComponents * 0.7)) { overall = 'degraded';
      issues.push('Some components are unhealthy');
     } else { overall = 'unhealthy';
      issues.push('Multiple critical components are down');
     }

    if (this.metrics.dataQualityScore < 80) {
      issues.push('Low data quality score');
    }

    if (this.metrics.cacheHitRate < 50) {
      issues.push('Low cache hit rate');
    }

    return {
      overall,
      components: this.metrics.componentHealth;
      issues,
      uptime: Date.now() - this.startTime
    }
  }

  // Private helper methods
  private recordSuccess(startTime: number); void {
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.recordResponseTime(performance.now() - startTime);
  }

  private recordFailure(startTime, number,
  error: Error); void {
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.metrics.lastError = error.message;
    this.recordResponseTime(performance.now() - startTime);
    
    this.emit('request:failed', { error: error.message;
  timestamp: new Date() });
  }

  private recordResponseTime(time: number); void {
    this.responseTimes.push(time);
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }
    
    this.metrics.averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length : 0;
  }

  private classifyInjurySeverity(status: string): 'minor' | 'moderate' | 'major' { const statusLower = status.toLowerCase();
    
    if (statusLower.includes('out') || statusLower.includes('ir')) {
      return 'major';
     } else if (statusLower.includes('doubtful')) { return 'moderate';
     } else { return 'minor';
     }
  }

  private assessFantasyImpact(position, string,
  injuryStatus: string): 'low' | 'medium' | 'high' { const criticalPositions = ['QB', 'RB', 'WR', 'TE'];
    const severeStatuses = ['out', 'ir', 'doubtful'];
    
    if (criticalPositions.includes(position) && 
        severeStatuses.some(status => injuryStatus.toLowerCase().includes(status))) {
      return 'high';
     } else if (criticalPositions.includes(position)) { return 'medium';
     } else { return 'low';
     }
  }

  /**
   * Shutdown the enhanced data provider
   */
  async shutdown(): : Promise<void> {
    console.log('🔄 Shutting down Enhanced NFL Data Provider...');
    
    try {
      // Stop real-time sync
      if (this.realTimeSyncService) { await this.realTimeSyncService.stop();
       }

      // Shutdown client manager
      await this.clientManager.shutdown();

      // Shutdown fallback chain
      await this.fallbackChain.shutdown();

      // Shutdown cache manager
      await cacheManager.shutdown();

      // Remove all listeners
      this.removeAllListeners();

      console.log('✅ Enhanced NFL Data Provider shutdown complete');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

// Create and export singleton instance
const enhancedDataProvider = new EnhancedDataProvider();

export { enhancedDataProvider, EnhancedDataProvider }
export type { EnhancedDataProviderConfig, DataProviderMetrics }