/**
 * WebSocket Notification Delivery Channel
 * Handles real-time delivery via WebSocket connections
 */

import { Notification, DeliveryResult } from '../../types';
import { webSocketManager } from '@/lib/websocket/server';

interface WebSocketDeliveryOptions {
  attempt: number;
  maxAttempts: number;
  deliveryId: string;
}

export class WebSocketDelivery {
  private isInitialized: boolean = false;

  /**
   * Initialize WebSocket delivery channel
   */
  async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      console.log('✅ WebSocket delivery channel initialized');
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket delivery:', error);
      throw error;
    }
  }

  /**
   * Deliver notification via WebSocket
   */
  async deliver(
    notification: Notification,
    options: WebSocketDeliveryOptions
  ): Promise<DeliveryResult> {
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        throw new Error('WebSocket delivery not initialized');
      }

      // Check if user is online
      const isUserOnline = await this.isUserOnline(notification.userId);
      
      if (!isUserOnline) {
        return {
          notificationId: notification.id,
          channel: 'websocket',
          success: false,
          timestamp: new Date().toISOString(),
          latency: Date.now() - startTime,
          error: 'User not online'
        };
      }

      // Create WebSocket payload
      const payload = this.createWebSocketPayload(notification);

      // Send via appropriate WebSocket event based on notification type
      const eventType = this.getEventType(notification.type);
      const success = await this.sendWebSocketMessage(
        notification.userId,
        eventType,
        payload
      );

      if (success) {
        // Also send to league room if applicable
        if (notification.leagueId) {
          await this.sendToLeagueRoom(notification.leagueId, eventType, payload);
        }

        return {
          notificationId: notification.id,
          channel: 'websocket',
          success: true,
          timestamp: new Date().toISOString(),
          latency: Date.now() - startTime,
          metadata: {
            eventType,
            attempt: options.attempt,
            sentToLeague: !!notification.leagueId
          }
        };
      } else {
        throw new Error('Failed to send WebSocket message');
      }

    } catch (error) {
      return {
        notificationId: notification.id,
        channel: 'websocket',
        success: false,
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'WebSocket delivery error'
      };
    }
  }

  /**
   * Create WebSocket payload from notification
   */
  private createWebSocketPayload(notification: Notification): any {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      data: notification.data || {},
      timestamp: new Date().toISOString(),
      actionUrl: notification.actionUrl,
      actions: notification.actions,
      expiresAt: notification.expiresAt,
      userId: notification.userId,
      leagueId: notification.leagueId,
      teamId: notification.teamId,
      playerId: notification.playerId
    };
  }

  /**
   * Get appropriate WebSocket event type for notification type
   */
  private getEventType(notificationType: string): string {
    const eventTypeMap: { [key: string]: string } = {
      'trade_proposal': 'trade_notification',
      'trade_accepted': 'trade_notification',
      'trade_rejected': 'trade_notification',
      'trade_vetoed': 'trade_notification',
      'trade_expired': 'trade_notification',
      'waiver_won': 'waiver_notification',
      'waiver_lost': 'waiver_notification',
      'waiver_outbid': 'waiver_notification',
      'lineup_reminder': 'lineup_reminder',
      'lineup_deadline': 'lineup_reminder',
      'player_injury': 'injury_alert',
      'player_news': 'breaking_news',
      'player_promotion': 'player_update',
      'game_start': 'game_event',
      'score_update': 'score_update',
      'close_matchup': 'matchup_update',
      'matchup_won': 'matchup_update',
      'matchup_lost': 'matchup_update',
      'weekly_recap': 'league_message',
      'draft_reminder': 'draft_update',
      'draft_pick': 'draft_update',
      'breaking_news': 'breaking_news',
      'weather_alert': 'breaking_news',
      'league_message': 'league_message',
      'achievement_unlocked': 'league_message',
      'milestone_reached': 'league_message',
      'system_maintenance': 'league_message'
    };

    return eventTypeMap[notificationType] || 'notification';
  }

  /**
   * Send message to specific user via WebSocket
   */
  private async sendWebSocketMessage(
    userId: string,
    eventType: string,
    payload: any
  ): Promise<boolean> {
    try {
      // Get user's socket connections
      const userSockets = await this.getUserSockets(userId);
      
      if (userSockets.length === 0) {
        return false;
      }

      // Send to all user's sockets
      let successCount = 0;
      for (const socketId of userSockets) {
        try {
          const success = await this.emitToSocket(socketId, eventType, payload);
          if (success) successCount++;
        } catch (error) {
          console.warn(`Failed to emit to socket ${socketId}:`, error);
        }
      }

      return successCount > 0;
    } catch (error) {
      console.error(`Failed to send WebSocket message to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send notification to league room
   */
  private async sendToLeagueRoom(
    leagueId: string,
    eventType: string,
    payload: any
  ): Promise<boolean> {
    try {
      // Broadcast to league room
      return await this.broadcastToRoom(`league:${leagueId}`, eventType, payload);
    } catch (error) {
      console.warn(`Failed to send to league room ${leagueId}:`, error);
      return false;
    }
  }

  /**
   * Get user's active socket connections
   */
  private async getUserSockets(userId: string): Promise<string[]> {
    try {
      // This would interact with the WebSocket manager to get active connections
      const connectedUsers = webSocketManager.getConnectionStats();
      
      // For now, return empty array as we need to implement the connection tracking
      // In a real implementation, this would query active connections for the user
      return [];
    } catch (error) {
      console.error(`Error getting user sockets for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Emit message to specific socket
   */
  private async emitToSocket(
    socketId: string,
    eventType: string,
    payload: any
  ): Promise<boolean> {
    try {
      // Use the WebSocket manager to emit to specific socket
      // This is a placeholder - would need actual socket.io integration
      console.log(`Emitting ${eventType} to socket ${socketId}:`, payload);
      return true;
    } catch (error) {
      console.error(`Failed to emit to socket ${socketId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to room
   */
  private async broadcastToRoom(
    roomId: string,
    eventType: string,
    payload: any
  ): Promise<boolean> {
    try {
      // Use the WebSocket manager to broadcast to room
      console.log(`Broadcasting ${eventType} to room ${roomId}:`, payload);
      
      // Map notification events to WebSocket manager methods
      switch (eventType) {
        case 'trade_notification':
          webSocketManager.broadcastTradeNotification(payload);
          break;
        case 'waiver_notification':
          webSocketManager.broadcastWaiverNotification(payload);
          break;
        case 'score_update':
          webSocketManager.broadcastScoreUpdate(payload);
          break;
        case 'matchup_update':
          webSocketManager.broadcastMatchupUpdate(payload);
          break;
        case 'player_update':
          webSocketManager.broadcastPlayerUpdate(payload);
          break;
        case 'injury_alert':
          webSocketManager.broadcastInjuryAlert(payload);
          break;
        case 'breaking_news':
          webSocketManager.broadcastBreakingNews(payload);
          break;
        case 'game_event':
          webSocketManager.broadcastGameEvent(payload);
          break;
        case 'real_time_stats':
          webSocketManager.broadcastRealTimeStats(payload);
          break;
        default:
          // Generic broadcast for other event types
          console.log(`Generic WebSocket broadcast: ${eventType}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to broadcast to room ${roomId}:`, error);
      return false;
    }
  }

  /**
   * Check if user is online
   */
  private async isUserOnline(userId: string): Promise<boolean> {
    try {
      // Check if user has active WebSocket connections
      const stats = webSocketManager.getConnectionStats();
      
      // This is a simplified check - in reality we'd need to track user connections
      return stats.totalConnections > 0;
    } catch (error) {
      console.error(`Error checking if user ${userId} is online:`, error);
      return false;
    }
  }

  /**
   * Send real-time score update
   */
  async sendScoreUpdate(data: any): Promise<boolean> {
    try {
      webSocketManager.broadcastScoreUpdate({
        leagueId: data.leagueId,
        teamId: data.teamId,
        playerId: data.playerId,
        points: data.points,
        change: data.change,
        projectedPoints: data.projectedPoints,
        gameStatus: data.gameStatus,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Failed to send score update via WebSocket:', error);
      return false;
    }
  }

  /**
   * Send injury alert
   */
  async sendInjuryAlert(data: any): Promise<boolean> {
    try {
      webSocketManager.broadcastInjuryAlert({
        playerId: data.playerId,
        playerName: data.playerName,
        team: data.team,
        position: data.position,
        injuryType: data.injuryType,
        severity: data.severity,
        fantasyImpact: data.fantasyImpact,
        affectedOwners: data.affectedOwners || [],
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Failed to send injury alert via WebSocket:', error);
      return false;
    }
  }

  /**
   * Send breaking news
   */
  async sendBreakingNews(data: any): Promise<boolean> {
    try {
      webSocketManager.broadcastBreakingNews({
        type: data.type,
        headline: data.headline,
        description: data.description,
        affectedPlayers: data.affectedPlayers || [],
        fantasyImpact: data.fantasyImpact,
        urgency: data.urgency,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Failed to send breaking news via WebSocket:', error);
      return false;
    }
  }

  /**
   * Get WebSocket delivery statistics
   */
  async getStats(): Promise<any> {
    try {
      const wsStats = webSocketManager.getConnectionStats();
      
      return {
        connectionStats: wsStats,
        isInitialized: this.isInitialized,
        supportedEvents: [
          'trade_notification',
          'waiver_notification', 
          'score_update',
          'matchup_update',
          'player_update',
          'injury_alert',
          'breaking_news',
          'game_event',
          'league_message',
          'draft_update',
          'lineup_reminder'
        ]
      };
    } catch (error) {
      console.error('Error getting WebSocket stats:', error);
      return { error: 'Failed to get stats' };
    }
  }

  /**
   * Shutdown WebSocket delivery
   */
  async shutdown(): Promise<void> {
    this.isInitialized = false;
    console.log('🔄 WebSocket delivery channel shutdown');
  }
}

export default WebSocketDelivery;