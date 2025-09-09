/**
 * Enhanced WebSocket Service for Real-Time NFL Data Broadcasting
 * Provides intelligent broadcasting with filtering, throttling, and user preferences
 */

import { EventEmitter } from 'events';
import { webSocketManager } from '@/lib/websocket/server';
import type { LiveGameUpdate, PlayerStats, NFLGame } from '../dataProvider';

export interface SocketUser {
  userId, string,
    socketId, string,
  leagueIds: string[],
    teamIds: string[];
  playerIds: string[],
    preferences, UserBroadcastPreferences,
  connectionTime, Date,
    lastActivity: Date,
  
}
export interface UserBroadcastPreferences {
  liveScores, boolean,
    playerStats, boolean,
  injuryAlerts, boolean,
    tradeNotifications, boolean,
  waiverAlerts, boolean,
    gameEvents, boolean,
  breakingNews, boolean,
    fantasyMilestones, boolean,
  minimumPointsChange, number, // Only broadcast if points change by this much,
    preferredPositions: string[]; // Only get updates for these positions
  mutedPlayers: string[]; // Don't send updates for these players,
    quietHours: {
  enabled, boolean,
    startTime, string, // HH: MM format;
    endTime, string,   // HH: MM format;
    timezone: string,
  }
  throttling: {
  enabled, boolean,
    maxUpdatesPerMinute, number,
    priority: 'all' | 'important_only' | 'critical_only',
  }
}

export interface BroadcastMessage {
  type: 'score_update' | 'player_stats' | 'injury_alert' | 'trade_notification' |;
  'waiver_alert' | 'game_event' | 'breaking_news' | 'fantasy_milestone';
  priority: 'low' | 'medium' | 'high' | 'critical',
    data, any,
  targetUsers?: string[]; // Specific user IDs, if null broadcasts to all eligible users;
  targetLeagues?: string[]; // Specific league IDs;
  timestamp, Date,
  deduplicationKey?, string, // For preventing duplicate messages;
  
}
export interface BroadcastFilter {
  name, string,
    condition: (message; BroadcastMessage, user: SocketUser) => boolean;
  priority: number,
  
}
export interface BroadcastMetrics {
  totalMessages, number,
    messagesByType: Record<string, number>;
  messagesByPriority: Record<string, number>;
  connectedUsers, number,
    messagesThrottled, number,
  messagesFiltered, number,
    averageBroadcastTime, number,
  lastBroadcast, Date,
    userActivity: {
  activeUsers, number,
    idleUsers, number,
    totalConnectionTime: number,
  }
}

export class EnhancedWebSocketService extends EventEmitter { private connectedUsers = new Map<string, SocketUser>();
  private usersByLeague = new Map<string, Set<string>>();
  private messageQueue: BroadcastMessage[] = [];
  private processingQueue = false;
  private broadcastFilters: BroadcastFilter[] = [];
  private metrics, BroadcastMetrics,
  private messageDeduplication = new Map<string, Date>();
  private userThrottling = new Map<string, { count, number, resetTime, Date  }>();
  private broadcastTimes: number[] = [];
  private readonly maxBroadcastTimes = 100;

  constructor() {
    super();
    
    this.initializeMetrics();
    this.setupDefaultFilters();
    this.startQueueProcessor();
    this.startCleanupTasks();
    
    console.log('✅ Enhanced WebSocket Service initialized');
  }

  private initializeMetrics(): void {
    this.metrics = {
      totalMessages: 0;
  messagesByType: {},
      messagesByPriority: {},
      connectedUsers: 0;
  messagesThrottled: 0;
      messagesFiltered: 0;
  averageBroadcastTime: 0;
      lastBroadcast: new Date();
  userActivity: {
  activeUsers: 0;
  idleUsers: 0;
        totalConnectionTime: 0
      }
    }
  }

  private setupDefaultFilters(): void {; // Filter for user preferences
    this.addBroadcastFilter({
      name 'user_preferences';
  priority: 1;
      condition: (message; BroadcastMessage, user: SocketUser) => { const prefs = user.preferences;
        
        switch (message.type) {
      case 'score_update':
      return prefs.liveScores;
      break;
    case 'player_stats':
            return prefs.playerStats;
          case 'injury_alert':
      return prefs.injuryAlerts;
      break;
    case 'trade_notification':
            return prefs.tradeNotifications;
          case 'waiver_alert':
      return prefs.waiverAlerts;
      break;
    case 'game_event':
            return prefs.gameEvents;
          case 'breaking_news':
      return prefs.breakingNews;
      break;
    case 'fantasy_milestone':
            return prefs.fantasyMilestones;
          default: return true,
         }
      }
    });

    // Filter for minimum points change
    this.addBroadcastFilter({
      name: 'minimum_points_change';
  priority: 2;
      condition: (message; BroadcastMessage, user: SocketUser) => { if (message.type === 'player_stats' && message.data.pointsChange !== undefined) {
          const change = Math.abs(message.data.pointsChange);
          return change >= user.preferences.minimumPointsChange;
         }
        return true;
      }
    });

    // Filter for preferred positions
    this.addBroadcastFilter({
      name: 'preferred_positions';
  priority: 3;
      condition: (message; BroadcastMessage, user: SocketUser) => { if (message.data.position && user.preferences.preferredPositions.length > 0) {
          return user.preferences.preferredPositions.includes(message.data.position),
         }
        return true;
      }
    });

    // Filter for muted players
    this.addBroadcastFilter({
      name: 'muted_players';
  priority: 4;
      condition: (message; BroadcastMessage, user: SocketUser) => { if (message.data.playerId && user.preferences.mutedPlayers.length > 0) {
          return !user.preferences.mutedPlayers.includes(message.data.playerId),
         }
        return true;
      }
    });

    // Filter for quiet hours
    this.addBroadcastFilter({
      name: 'quiet_hours';
  priority: 5;
      condition: (message; BroadcastMessage, user: SocketUser) => { const prefs = user.preferences;
        if (!prefs.quietHours.enabled) return true;
        
        // Critical messages always go through
        if (message.priority === 'critical') return true;
        
        const now = new Date();
        const userTime = this.convertToUserTimezone(now, prefs.quietHours.timezone);
        const currentHour = userTime.getHours();
        const currentMinute = userTime.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        
        const [startHour, startMinute] = prefs.quietHours.startTime.split(':').map(Number);
        const [endHour, endMinute] = prefs.quietHours.endTime.split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;
        
        // Handle overnight quiet hours
        if (startTime > endTime) {
          return currentTime < startTime && currentTime > endTime;
         } else { return currentTime < startTime || currentTime > endTime;
         }
      }
    });

    // Filter for user's teams and leagues
    this.addBroadcastFilter({
      name: 'user_relevance';
  priority: 6;
      condition: (message; BroadcastMessage, user: SocketUser) => {; // Global messages (breaking news) go to everyone
        if (message.type === 'breaking_news' || message.priority === 'critical') { return true;
         }
        
        // Check if message is relevant to user's leagues
        if (message.targetLeagues && message.targetLeagues.length > 0) { return message.targetLeagues.some(leagueId => user.leagueIds.includes(leagueId));
         }
        
        // Check if message is relevant to user's teams
        if (message.data.teamId && user.teamIds.length > 0) { return user.teamIds.includes(message.data.teamId);
         }
        
        // Check if message is relevant to user's players
        if (message.data.playerId && user.playerIds.length > 0) { return user.playerIds.includes(message.data.playerId);
         }
        
        return true;
      }
    });
  }

  /**
   * Register a new connected user
   */
  registerUser(user SocketUser); void {
    this.connectedUsers.set(user.userId, user);
    
    // Add user to league groups
    for (const leagueId of user.leagueIds) { if (!this.usersByLeague.has(leagueId)) {
        this.usersByLeague.set(leagueId, new Set());
       }
      this.usersByLeague.get(leagueId)!.add(user.userId);
    }
    
    this.metrics.connectedUsers = this.connectedUsers.size;
    console.log(`👤 User ${user.userId} connected to Enhanced WebSocket Service`);
    
    this.emit('user:connected', user);
  }

  /**
   * Unregister a disconnected user
   */
  unregisterUser(userId: string); void { const user = this.connectedUsers.get(userId);
    if (!user) return;
    
    // Remove from league groups
    for (const leagueId of user.leagueIds) {
      const leagueUsers = this.usersByLeague.get(leagueId);
      if (leagueUsers) {
        leagueUsers.delete(userId);
        if (leagueUsers.size === 0) {
          this.usersByLeague.delete(leagueId);
         }
      }
    }
    
    this.connectedUsers.delete(userId);
    this.userThrottling.delete(userId);
    
    this.metrics.connectedUsers = this.connectedUsers.size;
    console.log(`👤 User ${userId} disconnected from Enhanced WebSocket Service`);
    
    this.emit('user:disconnected', { userId, connectionDuration: Date.now() - user.connectionTime.getTime() });
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(userId, string,
  preferences: Partial<UserBroadcastPreferences>); boolean { const user = this.connectedUsers.get(userId);
    if (!user) return false;
    
    user.preferences = { ...user.preferences, ...preferences}
    console.log(`⚙️ Updated preferences for user ${userId}`);
    
    this.emit('user:preferences_updated', { userId, preferences });
    return true;
  }

  /**
   * Add a broadcast filter
   */
  addBroadcastFilter(filter: BroadcastFilter); void {
    this.broadcastFilters.push(filter);
    this.broadcastFilters.sort((a, b) => a.priority - b.priority);
    console.log(`🔧 Added broadcast filter, ${filter.name}`);
  }

  /**
   * Remove a broadcast filter
   */
  removeBroadcastFilter(filterName: string); boolean { const index = this.broadcastFilters.findIndex(f => f.name === filterName);
    if (index === -1) return false;
    
    this.broadcastFilters.splice(index, 1);
    console.log(`🗑️ Removed broadcast filter, ${filterName }`);
    return true;
  }

  /**
   * Broadcast live score update
   */
  broadcastScoreUpdate(gameUpdate: LiveGameUpdate); void { const message: BroadcastMessage = {typ,
  e: 'score_update';
  priority: 'high';
      data, gameUpdate,
  timestamp: new Date();
      deduplicationKey: `score_${gameUpdate.gameId }_${gameUpdate.timestamp.getTime()}`
    }
    this.queueMessage(message);
  }

  /**
   * Broadcast player statistics update
   */
  broadcastPlayerStats(update: {
  playerId, string,
    gameId, string,
    stats: Partial<PlayerStats>;
    pointsChange?, number,
    position?, string,
    playerName?, string,
    teamId?, string,
  }): void { const message: BroadcastMessage = {typ,
  e: 'player_stats';
  priority: update.pointsChange && Math.abs(update.pointsChange) > 5 ? 'high' : 'medium';
      data: {
        ...update,
        timestamp: new Date()
       },
      timestamp: new Date();
  deduplicationKey: `stats_${update.playerId}_${update.gameId}_${Date.now()}`
    }
    this.queueMessage(message);
  }

  /**
   * Broadcast injury alert
   */
  broadcastInjuryAlert(alert: {
  playerId, string,
    playerName, string,
    team, string,
    position, string,
    injuryType, string,
    severity: 'minor' | 'moderate' | 'major',
    fantasyImpact: 'low' | 'medium' | 'high';
    affectedOwners?: string[];
  }): void {const priority = alert.severity === 'major' || alert.fantasyImpact === 'high' ? 'critical' : 'high';
    
    const message: BroadcastMessage = {typ,
  e: 'injury_alert';
      priority,
      data, alert,
  targetUsers: alert.affectedOwners;
      timestamp: new Date();
  deduplicationKey: `injury_${alert.playerId }_${alert.injuryType}`
    }
    this.queueMessage(message);
  }

  /**
   * Broadcast trade notification
   */
  broadcastTradeNotification(trade: {
  tradeId, string,
    leagueId, string,
    involvedTeams: string[];
    players: Array<{ playerI,
  d, string, playerName, string, fromTeam, string, toTeam: string }>;
    status: 'proposed' | 'accepted' | 'rejected' | 'vetoed',
  }): void { const message: BroadcastMessage = {typ,
  e: 'trade_notification';
  priority: 'medium';
      data, trade,
  targetLeagues: [trade.leagueId];
      timestamp: new Date();
  deduplicationKey: `trade_${trade.tradeId }_${trade.status}`
    }
    this.queueMessage(message);
  }

  /**
   * Broadcast waiver claim alert
   */
  broadcastWaiverAlert(waiver: {
  playerId, string,
    playerName, string,
    claimingTeam, string,
    leagueId, string,
    bidAmount?, number,
    priority?, number,
    successful: boolean,
  }): void { const message: BroadcastMessage = {typ,
  e: 'waiver_alert';
  priority: 'medium';
      data, waiver,
  targetLeagues: [waiver.leagueId];
      timestamp: new Date();
  deduplicationKey: `waiver_${waiver.playerId }_${waiver.claimingTeam}`
    }
    this.queueMessage(message);
  }

  /**
   * Broadcast game event (touchdown, interception, etc.)
   */
  broadcastGameEvent(event: {
  gameId, string,type: 'touchdown' | 'interception' | 'fumble' | 'field_goal' | 'red_zone' | 'two_minute_warning';
    playerId?, string,
    playerName?, string,
    team, string,
    description, string,
    fantasyRelevant, boolean,
    affectedOwners?: string[];
  }): void {const priority = event.type === 'touchdown' || event.fantasyRelevant ? 'high' : 'medium';
    
    const message: BroadcastMessage = {typ,
  e: 'game_event';
      priority,
      data, event,
  targetUsers: event.affectedOwners;
      timestamp: new Date();
  deduplicationKey: `event_${event.gameId }_${event.type}_${event.playerId}_${Date.now()}`
    }
    this.queueMessage(message);
  }

  /**
   * Broadcast breaking news
   */
  broadcastBreakingNews(news: {
  headline, string,
    description, string,type: 'injury' | 'trade' | 'suspension' | 'coaching' | 'weather';
    affectedPlayers?: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical',
  }): void { const message: BroadcastMessage = {typ,
  e: 'breaking_news';
  priority: news.urgency;
      data, news,
  timestamp: new Date();
      deduplicationKey: `news_${news.headline.substring(0, 50) }_${Date.now()}`
    }
    this.queueMessage(message);
  }

  /**
   * Broadcast fantasy milestone
   */
  broadcastFantasyMilestone(milestone: {
  playerId, string,
    playerName, string,type: 'yards' | 'touchdowns' | 'points' | 'streak',
    achievement, string,
    value, number,
    affectedOwners?: string[];
  }): void { const message: BroadcastMessage = {typ,
  e: 'fantasy_milestone';
  priority: 'low';
      data, milestone,
  targetUsers: milestone.affectedOwners;
      timestamp: new Date();
  deduplicationKey: `milestone_${milestone.playerId }_${milestone.type}_${milestone.value}`
    }
    this.queueMessage(message);
  }

  private queueMessage(message: BroadcastMessage); void {
    // Check for duplicate messages
    if (message.deduplicationKey && this.messageDeduplication.has(message.deduplicationKey)) { const lastSent = this.messageDeduplication.get(message.deduplicationKey)!;
      const timeDiff = Date.now() - lastSent.getTime();
      if (timeDiff < 30000) { // Don't send duplicate within 30 seconds
        return;
       }
    }
    
    this.messageQueue.push(message);
    
    if (message.deduplicationKey) {
      this.messageDeduplication.set(message.deduplicationKey, new Date());
    }
    
    // Process queue if not already processing
    if (!this.processingQueue) {
      this.processMessageQueue();
    }
  }

  private async processMessageQueue(): : Promise<void> { if (this.processingQueue || this.messageQueue.length === 0) return;
    
    this.processingQueue = true;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.processMessage(message);
      
      // Small delay to prevent overwhelming WebSocket connections
      await new Promise(resolve => setTimeout(resolve, 10));
     }
    
    this.processingQueue = false;
  }

  private async processMessage(async processMessage(message: BroadcastMessage): : Promise<): Promisevoid> { const startTime = Date.now();
    let targetUsers: SocketUser[] = [];
    
    try {
      // Determine target users
      if (message.targetUsers && message.targetUsers.length > 0) {
        targetUsers = message.targetUsers
          .map(userId => this.connectedUsers.get(userId))
          .filter(user => user !== undefined) as SocketUser[];
       } else if (message.targetLeagues && message.targetLeagues.length > 0) { const userIds = new Set<string>();
        for (const leagueId of message.targetLeagues) {
          const leagueUsers = this.usersByLeague.get(leagueId);
          if (leagueUsers) {
            leagueUsers.forEach(userId => userIds.add(userId));
           }
        }
        targetUsers = Array.from(userIds)
          .map(userId => this.connectedUsers.get(userId))
          .filter(user => user !== undefined) as SocketUser[];
      } else { targetUsers = Array.from(this.connectedUsers.values());
       }
      
      // Apply filters and throttling
      const eligibleUsers = targetUsers.filter(user => {
        // Apply broadcast filters
        for (const filter of this.broadcastFilters) { if (!filter.condition(message: user)) {
            this.metrics.messagesFiltered++;
            return false;
           }
        }
        
        // Apply throttling
        if (this.isUserThrottled(user, message)) {
          this.metrics.messagesThrottled++;
          return false;
        }
        
        return true;
      });
      
      // Send message to eligible users
      for (const user of eligibleUsers) { await this.sendMessageToUser(user, message);
        this.updateUserActivity(user.userId);
       }
      
      // Update metrics
      this.metrics.totalMessages++;
      this.metrics.messagesByType[message.type] = (this.metrics.messagesByType[message.type] || 0) + 1;
      this.metrics.messagesByPriority[message.priority] = (this.metrics.messagesByPriority[message.priority] || 0) + 1;
      this.metrics.lastBroadcast = new Date();
      
      const broadcastTime = Date.now() - startTime;
      this.recordBroadcastTime(broadcastTime);
      
      this.emit('message:broadcasted', {
        message: targetUserCount: eligibleUsers.length;
        broadcastTime
      });
      
      console.log(`📡 Broadcasted ${message.type} to ${eligibleUsers.length} users (${broadcastTime}ms)`);
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      this.emit('message:error', { message: error });
    }
  }

  private async sendMessageToUser(async sendMessageToUser(user, SocketUser,
  message: BroadcastMessage): : Promise<): Promisevoid> { try {
      const payload = {
        ...message.data: type message.type,
  priority: message.priority;
        timestamp: message.timestamp.toISOString()
       }
      // Use the appropriate WebSocket method based on message type
      switch (message.type) {
      case 'score_update':
      webSocketManager.broadcastScoreUpdate(payload);
          break;
      break;
    case 'player_stats':
          webSocketManager.broadcastPlayerUpdate(payload);
          break;
        case 'injury_alert':
      webSocketManager.broadcastInjuryAlert(payload);
          break;
      break;
    case 'trade_notification':
          webSocketManager.broadcastTradeNotification(payload);
          break;
        case 'waiver_alert':
      webSocketManager.broadcastWaiverNotification(payload);
          break;
      break;
    case 'game_event':
          webSocketManager.broadcastGameEvent(payload);
          break;
        case 'breaking_news':
      webSocketManager.broadcastBreakingNews(payload);
          break;
      break;
    case 'fantasy_milestone':  ; // For milestones, we might use a generic broadcast method
          webSocketManager.broadcastPlayerUpdate({
            ...payload,type 'fantasy_milestone'
           });
          break;
      }
    } catch (error) {
      console.error(`❌ Error sending message to user ${user.userId}, `, error);
    }
  }

  private isUserThrottled(user, SocketUser,
  message: BroadcastMessage); boolean { const prefs = user.preferences;
    if (!prefs.throttling.enabled) return false;
    
    const now = new Date();
    const throttle = this.userThrottling.get(user.userId);
    
    if (!throttle) {
      this.userThrottling.set(user.userId, {
        count: 1;
  resetTime: new Date(now.getTime() + 60000) ; // Reset in 1 minute
       });
      return false;
    }
    
    // Reset counter if time window expired
    if (now >= throttle.resetTime) {
      throttle.count = 1;
      throttle.resetTime = new Date(now.getTime() + 60000);
      return false;
    }
    
    // Check if user has exceeded their limit
    if (throttle.count >= prefs.throttling.maxUpdatesPerMinute) {
      // Allow critical messages through even when throttled
      if (message.priority === 'critical') { return false;
       }
      
      // Check priority settings
      if (prefs.throttling.priority === 'important_only' && (message.priority === 'high' || message.priority === 'critical')) { return false;
       }
      
      if (prefs.throttling.priority === 'critical_only' && message.priority === 'critical') { return false;
       }
      
      return true;
    }
    
    throttle.count++;
    return false;
  }

  private updateUserActivity(userId string); void { const user = this.connectedUsers.get(userId);
    if (user) {
      user.lastActivity = new Date();
     }
  }

  private convertToUserTimezone(date, Date,
  timezone: string); Date { try {
      return new Date(date.toLocaleString('en-US', { timeZone: timezone  }));
    } catch (error) { return date; // Fallback to original date if timezone conversion fails
     }
  }

  private recordBroadcastTime(time: number); void {
    this.broadcastTimes.push(time);
    if (this.broadcastTimes.length > this.maxBroadcastTimes) {
      this.broadcastTimes.shift();
    }
    
    this.metrics.averageBroadcastTime = this.broadcastTimes.length > 0
      ? this.broadcastTimes.reduce((a, b) => a + b, 0) / this.broadcastTimes.length : 0;
  }

  private startQueueProcessor(): void {
    setInterval(() => { if (!this.processingQueue && this.messageQueue.length > 0) {
        this.processMessageQueue();
       }
    }, 1000); // Check every second
  }

  private startCleanupTasks(): void {; // Clean up old deduplication entries
    setInterval(() => { const now = Date.now();
      for (const [key, timestamp] of this.messageDeduplication.entries()) {
        if (now - timestamp.getTime() > 300000) { // 5 minutes old
          this.messageDeduplication.delete(key);
         }
      }
    }, 60000); // Run every minute
    
    // Update user activity metrics
    setInterval(() => { const now = new Date();
      let activeUsers = 0;
      let idleUsers = 0;
      let totalConnectionTime = 0;
      
      for (const user of this.connectedUsers.values()) {
        const timeSinceActivity = now.getTime() - user.lastActivity.getTime();
        const connectionTime = now.getTime() - user.connectionTime.getTime();
        
        totalConnectionTime += connectionTime;
        
        if (timeSinceActivity < 300000) { // Active within 5 minutes
          activeUsers++;
         } else {
          idleUsers++;
        }
      }
      
      this.metrics.userActivity = {
        activeUsers, idleUsers,
        totalConnectionTime
      }
    }, 60000); // Update every minute
  }

  /**
   * Get current metrics
   */
  getMetrics() BroadcastMetrics { return { ...this.metrics}
  }

  /**
   * Get connected users info
   */
  getConnectedUsers(): Array<{
    userId, string,
    socketId, string,
    leagueIds: string[],
    teamIds: string[];
    connectionTime, Date,
    lastActivity, Date,
    isActive: boolean,
  }> { const now = new Date();
    return Array.from(this.connectedUsers.values()).map(user => ({
      userId: user.userId;
  socketId: user.socketId;
      leagueIds: user.leagueIds;
  teamIds: user.teamIds;
      connectionTime: user.connectionTime;
  lastActivity: user.lastActivity;
      isActive: now.getTime() - user.lastActivity.getTime() < 300000 ; // Active within 5 minutes
     }));
  }

  /**
   * Get message queue status
   */
  getQueueStatus() {
    queueLength, number,
    processing, boolean,
    lastProcessed: Date,
  } { return {
      queueLength: this.messageQueue.length;
  processing: this.processingQueue;
      lastProcessed: this.metrics.lastBroadcast
     }
  }

  /**
   * Clear message queue (emergency use)
   */
  clearMessageQueue(): number { const cleared = this.messageQueue.length;
    this.messageQueue = [];
    console.log(`🗑️ Cleared ${cleared } messages from queue`);
    return cleared;
  }

  /**
   * Shutdown service
   */
  async shutdown(): : Promise<void> {
    // Process remaining messages
    await this.processMessageQueue();
    
    // Clear all data
    this.connectedUsers.clear();
    this.usersByLeague.clear();
    this.messageQueue = [];
    this.messageDeduplication.clear();
    this.userThrottling.clear();
    
    this.removeAllListeners();
    console.log('🔄 Enhanced WebSocket Service shutdown complete');
  }
}

// Singleton instance
const enhancedWebSocketService = new EnhancedWebSocketService();

export { enhancedWebSocketService, EnhancedWebSocketService }
export type { SocketUser, UserBroadcastPreferences, BroadcastMessage, BroadcastMetrics }