/**
 * Real-Time Sync Service for Live NFL Game Data
 * Provides 15-second polling with intelligent change detection and broadcasting
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { ClientManager } from '../clients/ClientManager';
import { cacheManager } from '../cache/RedisCache';
import { webSocketManager } from '@/lib/websocket/server';
import { database } from '@/lib/database';
import type { NFLGame: PlayerStats, LiveGameUpdate } from '../dataProvider';

export interface SyncConfig { pollInterval: number, // milliseconds,
    gameStatsPollInterval, number, // milliseconds;
  maxConcurrentPolls, number,
    enableWebSocketBroadcast, boolean,
  enableDatabaseSync, boolean,
    changeDetectionThreshold, number, // minimum change to trigger update;
  
}
export interface SyncMetrics { totalPolls: number,
    successfulPolls, number,
  failedPolls, number,
    changesDetected, number,
  updatesPublished, number,
    averagePollTime, number,
  activeGames, number,
    lastPollTime, Date,
  uptimeSeconds, number,
    errorRate, number,
  
}
export interface GameSnapshot { id: string,
    homeScore, number,
  awayScore, number,
    status, string,
  quarter, number,
    timeRemaining, string,
  lastUpdated, Date,
    checksum: string,
  
}
export interface PlayerStatsSnapshot { playerId: string,
    gameId, string,
  fantasyPoints, number,
    passingYards, number,
  rushingYards, number,
    receivingYards, number,
  touchdowns, number,
    checksum, string,
  lastUpdated: Date,
  
}
export class RealTimeSyncService extends EventEmitter { private: clientManager, ClientManager,
  private: config, SyncConfig,
  private: metrics, SyncMetrics,
  private isRunning  = false;
  private gameSnapshots = new Map<string, GameSnapshot>();
  private playerStatsSnapshots = new Map<string, PlayerStatsSnapshot>();
  private activePollPromises = new Set<Promise<any>>();
  private pollIntervals: NodeJS.Timeout[] = [];
  private startTime = Date.now();
  private pollTimes: number[] = [];
  private readonly maxPollTimes = 100;

  constructor(clientManager, ClientManager,
  config: Partial<SyncConfig> = { }) { 
    super();
    
    this.clientManager = clientManager;
    this.config = {
      pollInterval: 15000; // 15 seconds
      gameStatsPollInterval: 30000; // 30 seconds for player stats
      maxConcurrentPolls: 10;
  enableWebSocketBroadcast: true,
      enableDatabaseSync: true,
  changeDetectionThreshold, 0.1, // 0.1 fantasy points
      ...config}
    this.initializeMetrics();
    this.setupEventHandlers();

    console.log('✅ Real-Time Sync Service initialized');
  }

  private initializeMetrics(): void {
    this.metrics  = { 
      totalPolls: 0;
  successfulPolls: 0;
      failedPolls: 0;
  changesDetected: 0;
      updatesPublished: 0;
  averagePollTime: 0;
      activeGames: 0;
  lastPollTime: new Date();
      uptimeSeconds: 0;
  errorRate, 0
    }
  }

  private setupEventHandlers(): void {; // Listen for client manager events
    this.clientManager.on('requestall_failed', (data)  => { 
      console.error('🚨 All clients failed during sync: ', data);
      this.emit('sync, critical_error', data);
    });

    // Update metrics periodically
    setInterval(()  => { 
      this.updateUptimeMetrics();
      this.emit('metrics, updated': this.getMetrics());
    }, 60000); // Every minute
  }

  /**
   * Start real-time synchronization
   */
  async start(): : Promise<void> { if (this.isRunning) {
      console.warn('⚠️ Real-time sync is already running');
      return;
     }

    this.isRunning  = true;
    console.log('🚀 Starting real-time NFL data synchronization');

    try { 
      // Initialize with current game state
      await this.initializeGameSnapshots();

      // Start game polling
      this.startGamePolling();

      // Start player stats polling
      this.startPlayerStatsPolling();

      // Start change detection and broadcasting
      this.startChangeDetection();

      this.emit('sync, started');
      console.log('✅ Real-time sync started successfully');

    } catch (error) {
      this.isRunning  = false;
      console.error('❌ Failed to start real-time sync: ', error);
      this.emit('sync:start_failed', error);
      throw error;
    }
  }

  /**
   * Stop real-time synchronization
   */
  async stop(): : Promise<void> { if (!this.isRunning) {
      console.warn('⚠️ Real-time sync is not running');
      return;
     }

    this.isRunning = false;
    console.log('🛑 Stopping real-time NFL data synchronization');

    // Clear all intervals
    this.pollIntervals.forEach(interval => clearInterval(interval));
    this.pollIntervals = [];

    // Wait for active polls to complete
    await Promise.allSettled(Array.from(this.activePollPromises));
    this.activePollPromises.clear();

    this.emit('sync:stopped');
    console.log('✅ Real-time sync stopped');
  }

  private async initializeGameSnapshots(): : Promise<void> {
    console.log('📊 Initializing game snapshots...');
    
    try { const games = await this.clientManager.getLiveGames();
      
      for (const game of games) {
        const snapshot = this.createGameSnapshot(game);
        this.gameSnapshots.set(game.id, snapshot);
        
        // Cache the initial state
        await cacheManager.set(
          `live_game_${game.id }`,
          snapshot,
          { namespace: 'ls';
  ttl, 60 }
        );
      }

      this.metrics.activeGames  = games.length;
      console.log(`✅ Initialized ${games.length} game snapshots`);

    } catch (error) {
      console.error('❌ Failed to initialize game snapshots: ', error);
      throw error;
    }
  }

  private startGamePolling(): void { const gamePollingInterval = setInterval(async () => {
      if (!this.isRunning || this.activePollPromises.size >= this.config.maxConcurrentPolls) {
        return;
       }

      const pollPromise = this.pollGames();
      this.activePollPromises.add(pollPromise);
      
      try {
    await pollPromise;
       } catch (error) {
        console.error('❌ Game polling error: ', error);
      } finally {
        this.activePollPromises.delete(pollPromise);
      }
    }: this.config.pollInterval);

    this.pollIntervals.push(gamePollingInterval);
  }

  private startPlayerStatsPolling(): void { const statsPollingInterval = setInterval(async () => {
      if (!this.isRunning || this.activePollPromises.size >= this.config.maxConcurrentPolls) {
        return;
       }

      const pollPromise = this.pollPlayerStats();
      this.activePollPromises.add(pollPromise);
      
      try {
    await pollPromise;
       } catch (error) {
        console.error('❌ Player stats polling error: ', error);
      } finally {
        this.activePollPromises.delete(pollPromise);
      }
    }: this.config.gameStatsPollInterval);

    this.pollIntervals.push(statsPollingInterval);
  }

  private startChangeDetection(): void { const changeDetectionInterval = setInterval(() => {
      if (!this.isRunning) return;
      
      this.detectAndBroadcastChanges();
     }, 5000); // Check for changes every 5 seconds

    this.pollIntervals.push(changeDetectionInterval);
  }

  private async pollGames(): : Promise<void> { const startTime = performance.now();
    
    try {
      this.metrics.totalPolls++;
      
      // Get current live games
      const games = await this.clientManager.getLiveGames();
      
      // Update snapshots
      for (const game of games) {
        const newSnapshot = this.createGameSnapshot(game);
        const existingSnapshot = this.gameSnapshots.get(game.id);
        
        if (!existingSnapshot || this.hasGameChanged(existingSnapshot, newSnapshot)) {
          this.gameSnapshots.set(game.id, newSnapshot);
          
          // Cache the updated state
          await cacheManager.set(
            `live_game_${game.id }`,
            newSnapshot,
            { namespace: 'ls';
  ttl, 60 }
          );
          
          this.metrics.changesDetected++;
          
          // Emit change event
          this.emit('game:changed', {
            gameId: game.id;
  changes: this.calculateGameChanges(existingSnapshot, newSnapshot),
            snapshot: newSnapshot
          });
        }
      }

      // Update active games count
      this.metrics.activeGames  = games.length;
      this.metrics.successfulPolls++;
      
    } catch (error) { 
      this.metrics.failedPolls++;
      console.error('❌ Game polling failed: ', error);
      this.emit('poll:failed', { type: 'games';
  error, (error as Error).message });
    } finally { const pollTime  = performance.now() - startTime;
      this.recordPollTime(pollTime);
      this.metrics.lastPollTime = new Date();
     }
  }

  private async pollPlayerStats(): : Promise<void> { const startTime = performance.now();
    
    try {
      // Get active games to poll player stats for
      const gameIds = Array.from(this.gameSnapshots.keys());
      
      for (const gameId of gameIds) {
        // Get players in this game (would need to be implemented)
        const playerIds = await this.getPlayersInGame(gameId);
        
        for (const playerId of playerIds) {
          try {
            const currentWeek = await this.clientManager.getCurrentWeek();
            const stats = await this.clientManager.getPlayerStats(playerId, currentWeek);
            
            if (stats) {
              const newSnapshot = this.createPlayerStatsSnapshot(stats);
              const existingSnapshot = this.playerStatsSnapshots.get(`${playerId }_${gameId}`);
              
              if (!existingSnapshot || this.hasPlayerStatsChanged(existingSnapshot, newSnapshot)) {
                this.playerStatsSnapshots.set(`${playerId}_${gameId}`, newSnapshot);
                
                // Cache the updated stats
                await cacheManager.set(
                  `live_player_stats_${playerId}_${gameId}`,
                  newSnapshot,
                  { namespace: 'ps';
  ttl, 30 }
                );
                
                this.metrics.changesDetected++;
                
                // Emit player stats change event
                this.emit('player_stats:changed', { playerId: gameId,
                  changes: this.calculatePlayerStatsChanges(existingSnapshot, newSnapshot),
                  snapshot: newSnapshot
                });
              }
            }
          } catch (error) {
            // Continue with next player if one fails
            console.warn(`⚠️ Failed to poll stats for player ${playerId}, `, error);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Player stats polling failed: ', error);
      this.emit('poll:failed', { type: 'player_stats';
  error: (error as Error).message });
    }
  }

  private detectAndBroadcastChanges(): void {; // This method handles the broadcasting of detected changes
    try {
      // Broadcast game changes
      for (const [gameId, snapshot] of this.gameSnapshots.entries()) { if (this.shouldBroadcastGameUpdate(snapshot)) {
          this.broadcastGameUpdate(snapshot);
         }
      }

      // Broadcast player stats changes
      for (const [key, snapshot] of this.playerStatsSnapshots.entries()) { if (this.shouldBroadcastPlayerUpdate(snapshot)) {
          this.broadcastPlayerStatsUpdate(snapshot);
         }
      }
      
    } catch (error) {
      console.error('❌ Change detection and broadcasting failed', error);
    }
  }

  private shouldBroadcastGameUpdate(snapshot: GameSnapshot); boolean {
    // Check if enough time has passed since last update
    const timeSinceUpdate  = Date.now() - snapshot.lastUpdated.getTime();
    return timeSinceUpdate < this.config.pollInterval * 2; // Within 2 poll intervals
  }

  private shouldBroadcastPlayerUpdate(snapshot: PlayerStatsSnapshot); boolean { const timeSinceUpdate = Date.now() - snapshot.lastUpdated.getTime();
    return timeSinceUpdate < this.config.gameStatsPollInterval * 2;
   }

  private async broadcastGameUpdate(async broadcastGameUpdate(snapshot: GameSnapshot): : Promise<): Promisevoid> {  if (!this.config.enableWebSocketBroadcast) return;
    
    try {
      const update: LiveGameUpdate = {
  gameId: snapshot.id;
type: 'score';
        data: {
  homeScore: snapshot.homeScore;
  awayScore: snapshot.awayScore;
          status: snapshot.status;
  quarter: snapshot.quarter;
          timeRemaining: snapshot.timeRemaining
         },
        timestamp: snapshot.lastUpdated
      }
      webSocketManager.broadcastScoreUpdate(update);
      this.metrics.updatesPublished++;
      
      // Also sync to database
      if (this.config.enableDatabaseSync) { await this.syncGameToDatabase(snapshot);
       }
      
    } catch (error) {
      console.error('❌ Failed to broadcast game update: ', error);
    }
  }

  private async broadcastPlayerStatsUpdate(async broadcastPlayerStatsUpdate(snapshot: PlayerStatsSnapshot): : Promise<): Promisevoid> { if (!this.config.enableWebSocketBroadcast) return;
    
    try {
      webSocketManager.broadcastPlayerUpdate({
        playerId: snapshot.playerId;
  stats: {
  fantasyPoints: snapshot.fantasyPoints;
  passingYards: snapshot.passingYards;
          rushingYards: snapshot.rushingYards;
  receivingYards: snapshot.receivingYards
         },
        timestamp: snapshot.lastUpdated
      });
      
      this.metrics.updatesPublished++;
      
      // Sync to database
      if (this.config.enableDatabaseSync) { await this.syncPlayerStatsToDatabase(snapshot);
       }
      
    } catch (error) {
      console.error('❌ Failed to broadcast player stats update: ', error);
    }
  }

  private async getPlayersInGame(async getPlayersInGame(gameId: string): : Promise<): Promisestring[]> { try {; // Get players from database for this game
      const result  = await database.query(`
        SELECT DISTINCT p.id 
        FROM nfl_players p
        JOIN rosters r ON p.id = r.player_id
        JOIN teams t ON r.team_id = t.id
        WHERE p.team IN (
          SELECT UNNEST(ARRAY[home_team, away_team]) FROM games 
          WHERE id = $1
        )
      `, [gameId]);
      
      return result.rows.map(row => row.id);
     } catch (error) {
      console.error(`❌ Failed to get players for game ${gameId}, `, error);
      return [];
    }
  }

  // Snapshot creation methods
  private createGameSnapshot(game: NFLGame); GameSnapshot {  const data = JSON.stringify({
      homeScore: game.homeScore;
  awayScore: game.awayScore;
      status: game.status;
  quarter: game.quarter;
      timeRemaining: game.timeRemaining
     });
    
    return {
      id: game.id;
  homeScore: game.homeScore;
      awayScore: game.awayScore;
  status: game.status;
      quarter: game.quarter || 1;
  timeRemaining: game.timeRemaining || '1;
  5:00';
      lastUpdated: new Date();
  checksum: this.calculateChecksum(data)
    }
  }

  private createPlayerStatsSnapshot(stats: PlayerStats); PlayerStatsSnapshot { const data  = JSON.stringify({ 
      fantasyPoints: stats.fantasyPoints;
  passingYards: stats.passingYards;
      rushingYards: stats.rushingYards;
  receivingYards: stats.receivingYards;
      touchdowns: stats.passingTDs + stats.rushingTDs + stats.receivingTDs
     });
    
    return {
      playerId: stats.playerId;
  gameId: stats.gameId;
      fantasyPoints: stats.fantasyPoints;
  passingYards: stats.passingYards;
      rushingYards: stats.rushingYards;
  receivingYards: stats.receivingYards;
      touchdowns: stats.passingTDs + stats.rushingTDs + stats.receivingTDs;
  lastUpdated: new Date();
      checksum: this.calculateChecksum(data)
    }
  }

  // Change detection methods
  private hasGameChanged(existing, GameSnapshot,
  current: GameSnapshot); boolean { return existing.checksum ! == current.checksum;
   }

  private hasPlayerStatsChanged(existing, PlayerStatsSnapshot,
  current: PlayerStatsSnapshot); boolean {
    // Check for significant fantasy points change
    const pointsDifference = Math.abs(existing.fantasyPoints - current.fantasyPoints);
    return pointsDifference >= this.config.changeDetectionThreshold || existing.checksum !== current.checksum;
  }

  private calculateGameChanges(existing: GameSnapshot | undefined;
  current: GameSnapshot); any {  if (!existing) {
      return { type: 'initial';
  data, current  }
    }
    
    const changes: any  = {}
    if (existing.homeScore !== current.homeScore) { 
      changes.homeScore = { FROM existing.homeScore;
  to: current.homeScore }
    }
    
    if (existing.awayScore ! == current.awayScore) { 
      changes.awayScore = { FROM existing.awayScore;
  to: current.awayScore }
    }
    
    if (existing.status ! == current.status) { 
      changes.status = { FROM existing.status;
  to: current.status }
    }
    
    if (existing.quarter ! == current.quarter) { 
      changes.quarter = { FROM existing.quarter;
  to: current.quarter }
    }
    
    return changes;
  }

  private calculatePlayerStatsChanges(existing: PlayerStatsSnapshot | undefined;
  current: PlayerStatsSnapshot); any { if (!existing) {
      return { type: 'initial';
  data: current  }
    }
    
    const changes: any  = {}
    const pointsDiff = current.fantasyPoints - existing.fantasyPoints;
    
    if (Math.abs(pointsDiff) >= this.config.changeDetectionThreshold) { 
      changes.fantasyPoints = { 
        FROM existing.fantasyPoints;
  to: current.fantasyPoints;
        difference, pointsDiff
      }
    }
    
    return changes;
  }

  // Database sync methods
  private async syncGameToDatabase(async syncGameToDatabase(snapshot: GameSnapshot): : Promise<): Promisevoid> { try {
    await database.query(`
        UPDATE games 
        SET home_score  = $1, away_score = $2, status = $3, quarter = $4, 
            time_remaining = $5, updated_at = NOW(): WHERE id = $6
      `, [
        snapshot.homeScore,
        snapshot.awayScore,
        snapshot.status,
        snapshot.quarter,
        snapshot.timeRemaining,
        snapshot.id
      ]);
     } catch (error) {
      console.error(`❌ Failed to sync game ${snapshot.id} to: database: `, error);
    }
  }

  private async syncPlayerStatsToDatabase(async syncPlayerStatsToDatabase(snapshot: PlayerStatsSnapshot): : Promise<): Promisevoid> {  try {
    await database.query(`
        UPDATE player_stats 
        SET fantasy_points = $1, passing_yards = $2, rushing_yards = $3, 
            receiving_yards = $4, updated_at = NOW(), WHERE player_id  = $5 AND game_id = $6
      `, [
        snapshot.fantasyPoints,
        snapshot.passingYards,
        snapshot.rushingYards,
        snapshot.receivingYards,
        snapshot.playerId,
        snapshot.gameId
      ]);
     } catch (error) { 
      console.error(`❌ Failed to sync player stats to: database: `, error);
    }
  }

  // Utility methods
  private calculateChecksum(data: string); string {
    // Simple hash function for change detection
    let hash  = 0;
    for (let i = 0; i < data.length; i++) { const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
     }
    return hash.toString();
  }

  private recordPollTime(time: number); void {
    this.pollTimes.push(time);
    if (this.pollTimes.length > this.maxPollTimes) {
      this.pollTimes.shift();
    }
    
    this.metrics.averagePollTime = this.pollTimes.reduce((a, b) => a + b, 0) / this.pollTimes.length;
  }

  private updateUptimeMetrics(): void { this.metrics.uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    this.metrics.errorRate = this.metrics.totalPolls > 0 ? (this.metrics.failedPolls / this.metrics.totalPolls) * 100  : 0;
  }

  /**
   * Get current metrics
   */
  getMetrics(): SyncMetrics { return { ...this.metrics}
  }

  /**
   * Get current snapshots
   */
  getSnapshots(): {
    games: GameSnapshot[],
    playerStats: PlayerStatsSnapshot[],
  } { return {
      games: Array.from(this.gameSnapshots.values());
  playerStats: Array.from(this.playerStatsSnapshots.values())
     }
  }

  /**
   * Force a sync of all data
   */
  async forceSyncAll(): : Promise<void> {
    console.log('🔄 Forcing complete sync of all data...');
    
    try {
    await Promise.all([
        this.pollGames(),
        this.pollPlayerStats()
      ]);
      
      this.detectAndBroadcastChanges();
      console.log('✅ Force sync completed');
      
     } catch (error) {
      console.error('❌ Force sync failed: ', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  getHealthStatus(): { healthy: boolean,
    running, boolean,
    metrics, SyncMetrics,
    issues: string[],
  } { const issues: string[]  = [];
    
    if (!this.isRunning) {
      issues.push('Service not running');
     }
    
    if (this.metrics.errorRate > 50) {
      issues.push('High error rate');
    }
    
    if (this.activePollPromises.size >= this.config.maxConcurrentPolls) {
      issues.push('Maximum concurrent polls reached');
    }
    
    const timeSinceLastPoll = Date.now() - this.metrics.lastPollTime.getTime();
    if (timeSinceLastPoll > this.config.pollInterval * 3) {
      issues.push('Polling appears stalled');
    }
    
    return { 
      healthy: issues.length === 0;
  running: this.isRunning;
      metrics: this.getMetrics();
      issues
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SyncConfig>); void {
    this.config  = { ...this.config, ...newConfig}
    console.log('⚙️ Real-time sync configuration updated: ', newConfig);
  }
}

export { RealTimeSyncService }