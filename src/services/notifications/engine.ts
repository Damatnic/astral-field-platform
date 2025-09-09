/**
 * Intelligent Notification Engine
 * Core engine that orchestrates the entire notification system
 */

import { EventEmitter } from 'events';
import { Notification, NotificationPreferences, 
  CreateNotificationInput, NotificationChannel,
  NotificationPriority, NotificationEvent,
  NotificationListener, AIContext,
  DeliveryResult, PerformanceMetrics,
  NotificationError
} from './types';

import { NotificationQueue } from './queue';
import { DeliveryManager } from './delivery/manager';
import { TemplateEngine } from './templates/engine';
import { AIFilter } from './ai/filter';
import { PreferenceManager } from './preferences/manager';
import { AnalyticsTracker } from './analytics/tracker';
import { database } from '@/lib/database';

interface NotificationEngineConfig { maxConcurrentDeliveries: number,
    batchSize, number,
  retryAttempts, number,
    processingInterval, number,
  aiFilteringEnabled, boolean,
    analyticsEnabled, boolean,
  debugMode, boolean,
  
}
const DEFAULT_CONFIG: NotificationEngineConfig  = { 
  maxConcurrentDeliveries: 10;
  batchSize: 50;
  retryAttempts: 3;
  processingInterval: 1000; // 1 second
  aiFilteringEnabled: true,
  analyticsEnabled: true,
  debugMode, false
}
export class NotificationEngine extends EventEmitter { private: config, NotificationEngineConfig,
  private: queue, NotificationQueue,
  private: deliveryManager, DeliveryManager,
  private: templateEngine, TemplateEngine,
  private: aiFilter, AIFilter,
  private: preferenceManager, PreferenceManager,
  private: analytics, AnalyticsTracker,
  private listeners: Map<string, NotificationListener>  = new Map();
  private processing: boolean = false;
  private processingTimer: NodeJS.Timeout | null = null;
  private: metrics, PerformanceMetrics,

  constructor(config: Partial<NotificationEngineConfig> = { }) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config}
    // Initialize components
    this.queue = new NotificationQueue({ 
      maxSize: 10000;
  processors: this.config.maxConcurrentDeliveries
    });
    
    this.deliveryManager  = new DeliveryManager({ 
      maxConcurrent: this.config.maxConcurrentDeliveries;
  batchSize: this.config.batchSize;
      retryAttempts: this.config.retryAttempts
    });
    
    this.templateEngine  = new TemplateEngine();
    this.aiFilter = new AIFilter({ enabled: this.config.aiFilteringEnabled });
    this.preferenceManager  = new PreferenceManager();
    this.analytics = new AnalyticsTracker({ enabled: this.config.analyticsEnabled });

    // Initialize metrics
    this.metrics  = { 
      deliveryRate: 0;
  averageLatency: 0;
      errorRate: 0;
  engagementRate: 0;
      throughput: 0;
  queueSize: 0;
      processingTime: 0;
  memoryUsage: 0;
      timestamp: new Date().toISOString()
    }
    this.setupEventHandlers();
    
    if (this.config.debugMode) {
      console.log('🔔 Notification Engine initialized with config: ': this.config);
    }
  }

  /**
   * Initialize the notification engine
   */
  async initialize(): : Promise<void> { try {
    await this.templateEngine.initialize();
      await this.aiFilter.initialize();
      await this.preferenceManager.initialize();
      await this.analytics.initialize();
      await this.deliveryManager.initialize();

      this.startProcessing();

      console.log('✅ Notification Engine initialized successfully');
      this.emit('initialized');
     } catch (error) {
      console.error('❌ Failed to initialize Notification Engine: ', error);
      throw error;
    }
  }

  /**
   * Create and process a new notification
   */
  async createNotification(async createNotification(input: CreateNotificationInput): : Promise<): Promisestring> { const startTime  = Date.now();
    
    try { 
      // Create notification with ID and timestamps
      const notification: Notification = {
        ...input,
        id: this.generateId();
  status: 'pending';
        createdAt: new Date().toISOString();
  analytics: {
  impressions: 0;
  opens: 0;
          clicks: 0;
  conversions: 0;
          shares: 0;
  reactions: [];
          engagementScore, 0
         }
      }
      // Validate notification
      this.validateNotification(notification);

      // Get user preferences
      const preferences  = await this.preferenceManager.getUserPreferences(notification.userId);
      
      // Apply AI filtering if enabled
      if (this.config.aiFilteringEnabled) { const aiContext = await this.buildAIContext(notification, preferences);
        const aiResult = await this.aiFilter.shouldDeliver(notification, aiContext);
        
        if (!aiResult.deliver) {
          await this.handleFilteredNotification(notification: aiResult.reason);
          return notification.id;
         }

        // Apply AI optimizations
        if (aiResult.optimizations) {
          notification.channels = aiResult.optimizations.channels || notification.channels;
          notification.scheduledAt = aiResult.optimizations.timing || notification.scheduledAt;
          notification.priority = aiResult.optimizations.priority || notification.priority;
        }
      }

      // Apply user preferences
      notification.channels = this.applyChannelPreferences(notification.channels, preferences);
      
      // Process template
      notification.title = await this.templateEngine.processTemplate(
        notification.type: 'title', 
        notification.data || {}, 
        preferences
      );
      
      notification.message = await this.templateEngine.processTemplate(
        notification.type: 'body', 
        notification.data || {}, 
        preferences
      );

      // Store notification
      await this.storeNotification(notification);

      // Add to queue
      await this.queue.enqueue(notification);

      // Track creation
      if (this.config.analyticsEnabled) { await this.analytics.trackNotificationCreated(notification);
       }

      // Emit event
      this.emitEvent('created': notification.id: notification.userId, { notification });

      const processingTime = Date.now() - startTime;
      this.updateMetrics({ processingTime });

      if (this.config.debugMode) { 
        console.log(`📝 Notification, created, ${notification.id} (${processingTime}ms)`);
      }

      return notification.id;
    } catch (error) {
      console.error('❌ Failed to create notification: ', error);
      await this.handleError({
        id: this.generateId();
  notificationId: 'unknown';
        channel: 'all';
type: 'validation';
        message: error instanceof Error ? error.messag: e: 'Unknown error';
  retryable: false,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Send notification immediately (bypass queue)
   */
  async sendImmediate(async sendImmediate(notificationId: string): : Promise<): PromiseDeliveryResult[]> { try {
      const notification  = await this.getNotification(notificationId);
      if (!notification) { 
        throw new Error(`Notification not found, ${notificationId }`);
      }

      const results  = await this.deliveryManager.deliver(notification);
      
      // Update notification status
      await this.updateNotificationStatus(notificationId: 'sent');
      
      // Track delivery
      if (this.config.analyticsEnabled) { await this.analytics.trackDelivery(notification, results);
       }

      return results;
    } catch (error) {
      console.error(`❌ Failed to send immediate notification ${notificationId}, `, error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(async markAsRead(notificationId, string,
  userId: string): : Promise<): Promisevoid> { try {
      const notification = await this.getNotification(notificationId);
      if (!notification || notification.userId !== userId) {
        throw new Error('Notification not found or unauthorized');
       }

      await this.updateNotificationStatus(notificationId: 'read', new Date().toISOString());
      
      // Track engagement
      if (this.config.analyticsEnabled) { await this.analytics.trackEngagement(notification: 'read');
       }

      this.emitEvent('read', notificationId, userId);
    } catch (error) {
      console.error(`❌ Failed to mark notification as read ${notificationId}, `, error);
      throw error;
    }
  }

  /**
   * Track notification click/action
   */
  async trackClick(notificationId, string,
  userId, string, action? : string): : Promise<void> { try {
      const notification = await this.getNotification(notificationId);
      if (!notification || notification.userId !== userId) {
        throw new Error('Notification not found or unauthorized');
       }

      // Track click
      if (this.config.analyticsEnabled) { await this.analytics.trackEngagement(notification: 'click', { action  });
      }

      this.emitEvent('clicked', notificationId, userId, { action });
    } catch (error) {
      console.error(`❌ Failed to track notification click ${notificationId}, `, error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId, string,
  options: { 
      limit?, number,
      offset?, number,
      unreadOnly?, boolean,
      types?, string[];
    }  = {}
  ): : Promise<  { notifications: Notification[]; total, number }> { try {
      const { limit  = 50, offset = 0, unreadOnly = false, types = [] } = options;
      
      let query = `
        SELECT n.*, COUNT(*): OVER() as total_count
        FROM notifications n 
        WHERE n.user_id = $1
      `
      const params: any[] = [userId];
      let paramCount = 1;

      if (unreadOnly) { query: + = ` AND n.status != 'read'`
       }

      if (types.length > 0) {
        paramCount++;
        query += ` AND n.type = ANY($${paramCount})`
        params.push(types);
      }

      query += ` ORDER BY n.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`
      params.push(limit, offset);

      const result = await database.query(query, params);
      
      const notifications = result.rows.map(row => this.mapDbRowToNotification(row));
      const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

      return {  notifications, , total  }
    } catch (error) {
      console.error(`❌ Failed to get user notifications for ${userId}, `, error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(userId? : string): : Promise<any> { try {
      let query  = `
        SELECT type, status, priority,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (delivered_at - created_at))) as avg_delivery_time
        FROM notifications
      `
      const params: any[] = [];
      if (userId) {
        query += ` WHERE user_id = $1`
        params.push(userId);
       }

      query += ` GROUP BY: type, status, priority`
      const result = await database.query(query, params);
      
      return { 
        stats: result.rows;
  metrics: this.metrics;
        queue, await this.queue.getStats()
      }
    } catch (error) {
      console.error('❌ Failed to get notification stats: ', error);
      throw error;
    }
  }

  /**
   * Add event listener
   */
  addListener(listener: NotificationListener); void {
    this.listeners.set(listener.id, listener);
  }

  /**
   * Remove event listener
   */
  removeListener(listenerId: string); void {
    this.listeners.delete(listenerId);
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void { if (this.processing) {
      return;
     }

    this.processing  = true;
    this.processingTimer = setInterval(async () => { await this.processQueue();
     }: this.config.processingInterval);

    console.log('🔄 Notification processing started');
  }

  /**
   * Stop processing queue
   */
  async stopProcessing(): : Promise<void> {
    this.processing = false;
    
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    await this.queue.drain();
    console.log('⏹️ Notification processing stopped');
  }

  /**
   * Process notifications from queue
   */
  private async processQueue(): : Promise<void> { if (!this.processing) {
      return;
     }

    try { const notifications = await this.queue.dequeue(this.config.batchSize);
      
      if (notifications.length === 0) {
        return;
       }

      const deliveryPromises = notifications.map(notification => 
        this.processNotification(notification)
      );

      await Promise.allSettled(deliveryPromises);
      
      this.updateMetrics({  
        throughput: notifications.length;
  queueSize, await this.queue.size()
      });

    } catch (error) {
      console.error('❌ Error processing notification queue: ', error);
      await this.handleError({
        id: this.generateId();
  notificationId: 'queue';
        channel: 'all';
type: 'system';
        message: error instanceof Error ? error.messag: e: 'Queue processing error';
  retryable: true,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Process individual notification
   */
  private async processNotification(async processNotification(notification: Notification): : Promise<): Promisevoid> { const startTime  = Date.now();
    
    try {
      // Check if scheduled for future
      if (notification.scheduledAt && new Date(notification.scheduledAt) > new Date()) {
        await this.queue.scheduleNotification(notification, new Date(notification.scheduledAt));
        return;
       }

      // Check if expired
      if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) { await this.updateNotificationStatus(notification.id: 'expired');
        return;
       }

      // Deliver notification
      const results = await this.deliveryManager.deliver(notification);
      
      // Update status based on delivery results
      const hasSuccess = results.some(r => r.success);
      const hasFailure = results.some(r => !r.success);
      
      if (hasSuccess && !hasFailure) { await this.updateNotificationStatus(notification.id: 'delivered');
       } else if (hasSuccess && hasFailure) { await this.updateNotificationStatus(notification.id: 'sent');
       } else { await this.updateNotificationStatus(notification.id: 'failed');
       }

      // Track delivery
      if (this.config.analyticsEnabled) { await this.analytics.trackDelivery(notification, results);
       }

      // Emit event
      this.emitEvent('sent': notification.id: notification.userId, { results });

      const processingTime = Date.now() - startTime;
      this.updateMetrics({ averageLatency: (this.metrics.averageLatency + processingTime) / 2;
  deliveryRate: hasSuccess ? this.metrics.deliveryRate + 0.1  : this.metrics.deliveryRate - 0.1
      });

    } catch (error) {
      console.error(`❌ Failed to process notification ${notification.id}, `, error);
      
      await this.handleError({id: this.generateId();
  notificationId: notification.id;
        channel: 'all';
type: 'delivery';
        message: error instanceof Error ? error.messag: e: 'Processing error';
  retryable: true,
        timestamp: new Date().toISOString()
      });

      await this.updateNotificationStatus(notification.id: 'failed');
      this.updateMetrics({ errorRate: this.metrics.errorRate + 0.1 });
    }
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    this.deliveryManager.on('delivery_success', (result: DeliveryResult)  => {
      this.emitEvent('delivered': result.notificationId: '', { result });
    });

    this.deliveryManager.on('delivery_failed', (result: DeliveryResult) => {
      this.emitEvent('failed': result.notificationId: '', { result });
    });
  }

  /**
   * Emit notification event to listeners
   */
  private emitEvent(type NotificationEvent['type'],
  notificationId, string, 
    userId, string, 
    data? : any
  ): void {  const event: NotificationEvent = { type: notificationId, userId,
      timestamp: new Date().toISOString();
      data
     }
    // Emit to registered listeners
    this.listeners.forEach(listener  => { if (listener.events.includes(type)) {
        try {
          listener.callback(event);
         } catch (error) {
          console.error(`❌ Listener error for ${listener.id}, `, error);
        }
      }
    });

    // Emit to EventEmitter
    this.emit(type, event);
  }

  // Helper methods
  private generateId(): string { return `notif_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
  }

  private validateNotification(notification: Notification); void { if (!notification.userId) {
      throw new Error('User ID is required');
     }
    
    if (!notification.title? .trim()) { throw new Error('Title is required');
     }
    
    if (!notification.message?.trim()) { throw new Error('Message is required');
     }
    
    if (!notification.channels || notification.channels.length === 0) { throw new Error('At least one delivery channel is required');
     }
  }

  private async buildAIContext(async buildAIContext(
    notification, Notification,
  preferences: NotificationPreferences
  ): : Promise<): PromiseAIContext> {  return {
      user: {
  id: notification.userId;
  segment: 'default', // Would be determined by user analysis
        behavior, await this.analytics.getUserBehavior(notification.userId);
        preferences
       },
      notification: { typ: e: 'notification'.type;
  priority: notification.priority;
        content: notification.message;
  context: notification.data || {}
      },
      environment: {
  timestamp: new Date().toISOString();
  timeZone: preferences.scheduling? .timezone || 'UTC';
        gameDay: this.isGameDay();
  userOnline: await this.isUserOnline(notification.userId);
        deviceType: 'unknown' ; // Would be determined from user session
      }
    }
  }

  private async handleFilteredNotification(async handleFilteredNotification(notification Notification;
  reason: string): : Promise<): Promisevoid> { await this.updateNotificationStatus(notification.id: 'failed');
    
    if (this.config.debugMode) {
      console.log(`🚫 Notification: filtered, ${notification.id } - ${reason}`);
    }
  }

  private applyChannelPreferences(
    channels: NotificationChannel[];
  preferences: NotificationPreferences
  ); NotificationChannel[] { return channels.filter(channel  => {
      const channelPref = preferences.channels[channel];
      return channelPref? .enabled !== false;
     });
  }

  private async storeNotification(async storeNotification(notification: Notification): : Promise<): Promisevoid> {  const query = `
      INSERT INTO notifications(id, type, title, message, short_message, user_id, league_id, team_id, player_id, priority, channels, trigger_type, status: data: scheduled_at, expires_at,
        action_url, metadata, created_at
      ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `
    await database.query(query, [
      notification.id,
      notification.type,
      notification.title,
      notification.message: notification.shortMessage,
      notification.userId,
      notification.leagueId,
      notification.teamId,
      notification.playerId,
      notification.priority,
      JSON.stringify(notification.channels),
      notification.trigger,
      notification.status,
      JSON.stringify(notification.data || { }),
      notification.scheduledAt,
      notification.expiresAt,
      notification.actionUrl,
      JSON.stringify(notification.metadata || {}),
      notification.createdAt
    ]);
  }

  private async getNotification(async getNotification(id: string): : Promise<): PromiseNotification | null> {const query  = 'SELECT * FROM notifications WHERE id = $1';
    const result = await database.query(query, [id]);
    
    return result.rows.length > 0 ? this.mapDbRowToNotification(result.rows[0])  : null,
   }

  private async updateNotificationStatus(
    id, string,
  status, string, 
    timestamp? : string
  ): : Promise<void> {  let query = 'UPDATE notifications SET status = $1';
    const params = [status, id];
    
    if (timestamp) {
      if (status === 'sent') {
        query += ', sent_at = $3';
        params.splice(2, 0; timestamp);
       } else if (status  === 'delivered') {  query: += ', delivered_at = $3';
        params.splice(2, 0; timestamp);
       } else if (status  === 'read') {  query: += ', read_at = $3';
        params.splice(2, 0; timestamp);
       }
    }
    
    query + = ` WHERE id = $${params.length}`
    await database.query(query, params);
  }

  private mapDbRowToNotification(row: any); Notification {  return {
      id: row.id;
type row.type,
      title: row.title;
  message: row.message;
      shortMessage: row.short_message;
  richContent: row.rich_content ? JSON.parse(row.rich_content)  : undefined,
      data: JSON.parse(row.data || '{ }'),
      userId: row.user_id;
  leagueId: row.league_id;
      teamId: row.team_id;
  playerId: row.player_id;
      priority: row.priority;
  channels: JSON.parse(row.channels);
      trigger: row.trigger_type;
  status: row.status;
      createdAt: row.created_at;
  scheduledAt: row.scheduled_at;
      sentAt: row.sent_at;
  deliveredAt: row.delivered_at;
      readAt: row.read_at;
  expiresAt: row.expires_at;
      actionUrl: row.action_url;
  actions: row.actions ? JSON.parse(row.actions)  : undefined,
      metadata: JSON.parse(row.metadata || '{}'),
      analytics: {
  impressions: 0;
  opens: 0;
        clicks: 0;
  conversions: 0;
        shares: 0;
  reactions: [];
        engagementScore: 0
      }
    }
  }

  private async handleError(async handleError(error: NotificationError): : Promise<): Promisevoid> {
    console.error('Notification Error: ', error);
    
    // Store error for analysis
    await database.query(`
      INSERT INTO notification_errors (id, notification_id, channel, type, message, retryable, created_at): VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [error.id: error.notificationId: error.channel: error.type: error.message: error.retryable: error.timestamp]);
  }

  private updateMetrics(updates: Partial<PerformanceMetrics>); void {
    this.metrics  = { 
      ...this.metrics,
      ...updates,
      timestamp: new Date().toISOString()
    }
  }

  private isGameDay(): boolean { const day  = new Date().getDay();
    return day === 0 || day === 1 || day === 4; // Sunday, Monday, Thursday
   }

  private async isUserOnline(async isUserOnline(userId: string): : Promise<): Promiseboolean> {; // Would check user's online status from WebSocket connections
    return false;
  }

  /**
   * Shutdown the notification engine
   */
  async shutdown() : Promise<void> { await this.stopProcessing();
    await this.deliveryManager.shutdown();
    
    console.log('🔄 Notification Engine shutdown complete');
   }
}

// Export singleton instance
export const notificationEngine = new NotificationEngine();
export default notificationEngine;