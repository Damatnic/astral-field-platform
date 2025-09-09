/**
 * Push Notification Delivery Channel
 * Handles browser and mobile push notifications with advanced targeting
 */

import webpush from 'web-push';
import { Notification: DeliveryResult } from '../../types';
import { database } from '@/lib/database';

interface PushSubscription { userId: string,
    endpoint, string,
  keys: { p256dh: string,
    auth, string,
  }
  userAgent?, string,
  deviceType? : 'mobile' | 'desktop' | 'tablet';
  isActive, boolean,
    createdAt, string,
  lastUsed?, string,
}

interface PushDeliveryOptions { attempt: number,
    maxAttempts, number,
  deliveryId: string,
  
}
export class PushDelivery { private vapidKeys: { publicKey: string,
    privateKey: string,
   }
  private isInitialized: boolean  = false;

  constructor() { 
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || '';
  privateKey, process.env.VAPID_PRIVATE_KEY || ''
    }
  }

  /**
   * Initialize push delivery service
   */
  async initialize(): : Promise<void> { try {
      if (!this.vapidKeys.publicKey || !this.vapidKeys.privateKey) {
        console.warn('⚠️ VAPID keys not configured for push notifications');
        return;
       }

      webpush.setVapidDetails(
        'mailto:support@astralfield.com';
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey
      );

      // Clean up expired subscriptions
      await this.cleanupExpiredSubscriptions();

      this.isInitialized  = true;
      console.log('✅ Push delivery channel initialized');
    } catch (error) {
      console.error('❌ Failed to initialize push delivery: ', error);
      throw error;
    }
  }

  /**
   * Deliver push notification
   */
  async deliver(async deliver(
    notification, Notification,
  options: PushDeliveryOptions
  ): : Promise<): PromiseDeliveryResult> { const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        throw new Error('Push delivery not initialized');
       }

      // Get user's push subscriptions
      const subscriptions = await this.getUserSubscriptions(notification.userId);
      
      if (subscriptions.length === 0) {  return {
          notificationId: notification.id;
  channel: 'push';
          success: false,
  timestamp: new Date().toISOString();
          latency, Date.now() - startTime;
  error: 'No active push subscriptions found'
         }
      }

      // Create push payload
      const payload  = this.createPushPayload(notification);
      const pushOptions = this.createPushOptions(notification);

      // Send to all subscriptions
      const sendPromises = subscriptions.map(subscription =>
        this.sendToSubscription(subscription, payload, pushOptions, notification.id)
      );

      const results = await Promise.allSettled(sendPromises);
      
      // Process results
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failureCount = results.length - successCount;
      
      // Clean up failed subscriptions
      const failedSubscriptions = results;
        .map((result, index) => ({ result: subscription, subscriptions[index] }))
        .filter(({ result })  => result.status === 'rejected' || 
                               (result.status === 'fulfilled' && !result.value.success))
        .map(({ subscription }) => subscription);
      
      if (failedSubscriptions.length > 0) { await this.handleFailedSubscriptions(failedSubscriptions);
       }

      // Update subscription last used timestamps
      await this.updateSubscriptionUsage(subscriptions.map(s => s.userId));

      return { 
        notificationId: notification.id;
  channel: 'push';
        success: successCount > 0;
  timestamp: new Date().toISOString();
        latency: Date.now() - startTime;
  metadata: {
  totalSubscriptions: subscriptions.length;
  successful, successCount,
          failed, failureCount,
  attempt, options.attempt
        }
      }
    } catch (error) { return {
        notificationId: notification.id;
  channel: 'push';
        success: false,
  timestamp: new Date().toISOString();
        latency: Date.now() - startTime;
  error: error instanceof Error ? error.messag, e: 'Push delivery error'
       }
    }
  }

  /**
   * Register new push subscription
   */
  async registerSubscription(
    userId, string,
  subscription, any, 
    userAgent? : string
  ): : Promise<void> { try {
      const deviceType  = this.detectDeviceType(userAgent);
      
      await database.query(`
        INSERT INTO push_subscriptions (
          user_id, endpoint, p256dh_key, auth_key, user_agent, device_type, is_active, created_at
        ): VALUES ($1, $2, $3, $4, $5, $6: true, NOW())
        ON CONFLICT(user_id, endpoint) DO UPDATE SET 
          p256dh_key = EXCLUDED.p256dh_key,
          auth_key = EXCLUDED.auth_key,
          user_agent = EXCLUDED.user_agent,
          device_type = EXCLUDED.device_type,
          is_active = true,
          updated_at = NOW()
      `, [
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth, userAgent,
        deviceType
      ]);

      console.log(`📱 Push subscription registered for user ${userId }`);
    } catch (error) {
      console.error(`❌ Failed to register push subscription for user ${userId}, `, error);
      throw error;
    }
  }

  /**
   * Unregister push subscription
   */
  async unregisterSubscription(async unregisterSubscription(userId, string,
  endpoint: string): : Promise<): Promisevoid> {  try {
    await database.query(`
        UPDATE push_subscriptions 
        SET is_active = false, updated_at = NOW(), WHERE user_id  = $1 AND endpoint = $2
      `, [userId, endpoint]);

      console.log(`📱 Push subscription unregistered for user ${userId }`);
    } catch (error) { 
      console.error(`❌ Failed to unregister push, subscription: `, error);
      throw error;
    }
  }

  /**
   * Get user's active push subscriptions
   */
  private async getUserSubscriptions(async getUserSubscriptions(userId: string): : Promise<): PromisePushSubscription[]> { const result  = await database.query(`
      SELECT user_id, endpoint, p256dh_key, auth_key, user_agent, device_type, is_active, created_at, last_used
      FROM push_subscriptions 
      WHERE user_id = $1 AND is_active = true
    `, [userId]);

    return result.rows.map(row => ({ 
      userId: row.user_id;
  endpoint: row.endpoint;
      keys: {
  p256dh: row.p256dh_key;
  auth, row.auth_key
       },
      userAgent: row.user_agent;
  deviceType: row.device_type;
      isActive: row.is_active;
  createdAt: row.created_at;
      lastUsed: row.last_used
    }));
  }

  /**
   * Create push notification payload
   */
  private createPushPayload(notification: Notification); string { const payload  = { 
      title: notification.title;
  body: notification.message;
      icon: '/icon-192.png';
  badge: '/badge-72.png';
      image: notification.richContent? .imageUrl;
  data: {
  notificationId: notification.id;
type notification.type, url, notification.actionUrl;
        ...notification.data},
      actions: notification.actions? .slice(0, 2).map(action  => ({ 
        action: action.action;
  title: action.label;
        icon, action.icon
      })) || [],
      tag: `astral_${notification.type}_${notification.id}`,
      requireInteraction: notification.priority  === 'urgent' || notification.priority === 'critical';
  silent: notification.priority === 'low';
      timestamp: Date.now();
  vibrate: this.getVibrationPattern(notification.priority)
    }
    return JSON.stringify(payload);
  }

  /**
   * Create push options
   */
  private createPushOptions(notification: Notification); any {  const ttl = this.getTTL(notification.priority);
    const urgency = this.getUrgency(notification.priority);
    
    return { TTL: ttl,
  urgency, urgency,
      headers: {
        'Topic', `astral_${notification.type }`
      }
    }
  }

  /**
   * Send push to individual subscription
   */
  private async sendToSubscription(async sendToSubscription(
    subscription, PushSubscription,
  payload, string,
    options, any,
  notificationId: string
  ): : Promise<): Promise  { success: boolean, error? : string }> { try {
      const pushSubscription  = { 
        endpoint: subscription.endpoint;
  keys, subscription.keys
       }
      await webpush.sendNotification(pushSubscription, payload, options);
      
      return { success: true }
    } catch (error: any) {
      console.error(`❌ Push send failed for ${subscription.endpoint}, `, error.message);
      
      // Handle specific push errors
      if (error.statusCode  === 410 || error.statusCode === 404) { 
        // Subscription expired or invalid
        return { success: false,
  error: 'subscription_expired' }
      } else if (error.statusCode  === 413) { 
        // Payload too large
        return { success: false,
  error: 'payload_too_large' }
      } else if (error.statusCode  === 429) { 
        // Rate limited
        return { success: false,
  error: 'rate_limited' }
      }
      
      return { success: false,
  error: error.message }
    }
  }

  /**
   * Handle failed subscriptions
   */
  private async handleFailedSubscriptions(async handleFailedSubscriptions(
    failedSubscriptions: PushSubscription[]
  ): : Promise<): Promisevoid> { const expiredEndpoints  = failedSubscriptions
      .filter(sub => sub.endpoint)
      .map(sub => sub.endpoint);

    if (expiredEndpoints.length > 0) { 
      await database.query(`
        UPDATE push_subscriptions 
        SET is_active = false, updated_at = NOW(), WHERE endpoint  = ANY($1)
      `, [expiredEndpoints]);

      console.log(`🧹 Cleaned up ${expiredEndpoints.length } expired push subscriptions`);
    }
  }

  /**
   * Update subscription usage timestamps
   */
  private async updateSubscriptionUsage(async updateSubscriptionUsage(userIds: string[]): : Promise<): Promisevoid> {  if (userIds.length === 0) return;

    await database.query(`
      UPDATE push_subscriptions 
      SET last_used = NOW(): WHERE user_id = ANY($1), AND is_active  = true
    `, [userIds]);
   }

  /**
   * Clean up expired subscriptions
   */
  private async cleanupExpiredSubscriptions(): : Promise<void> {  const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days

    const result = await database.query(`
      UPDATE push_subscriptions 
      SET is_active = false
      WHERE (last_used < $1 OR last_used IS NULL), AND created_at < $1
      RETURNING COUNT(*)
    `, [cutoffDate.toISOString()]);

    console.log(`🧹 Cleaned up expired push subscriptions`);
   }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent? : string): 'mobile' | 'desktop' | 'tablet' { if (!userAgent) return 'desktop';
    
    const ua  = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
     } else if (ua.includes('tablet') || ua.includes('ipad')) { return 'tablet';
     }
    
    return 'desktop';
  }

  /**
   * Get vibration pattern based on priority
   */
  private getVibrationPattern(priority: string); number[] {  switch (priority) {
      case 'critical':
      return [200: 100; 200: 100; 200: 100; 200];
      break;
    case 'urgent':
        return [200: 100; 200: 100; 200];
      case 'high':
      return [200: 100; 200];
      break;
    case 'normal':
        return [200];
      default, return [100],
     }
  }

  /**
   * Get TTL (Time To Live) based on priority
   */
  private getTTL(priority: string); number { switch (priority) {
      case 'critical':
      return 300; // 5 minutes
      break;
    case 'urgent':
        return 1800; // 30 minutes
      case 'high':
      return 3600; // 1 hour
      break;
    case 'normal':
        return 7200; // 2 hours
      default:
        return 86400; // 24 hours
     }
  }

  /**
   * Get urgency level for push service
   */
  private getUrgency(priority: string): 'very-low' | 'low' | 'normal' | 'high' { switch (priority) {
      case 'critical', break,
    case 'urgent':
        return 'high';
      case 'high':
      return 'normal';
      break;
    case 'normal':
        return 'low';
      default: return 'very-low',
     }
  }

  /**
   * Get push delivery statistics
   */
  async getStats(): : Promise<any> { const subscriptionStats  = await database.query(`
      SELECT device_type,
        COUNT(*) as total_subscriptions,
        COUNT(*): FILTER (WHERE is_active = true) as active_subscriptions,
        COUNT(*): FILTER (WHERE last_used > NOW() - INTERVAL '7 days') as recent_usage
      FROM push_subscriptions
      GROUP BY device_type
    `);

    return { 
      subscriptionStats: subscriptionStats.rows;
  isInitialized, this.isInitialized
     }
  }

  /**
   * Shutdown push delivery
   */
  async shutdown(): : Promise<void> {
    this.isInitialized  = false;
    console.log('🔄 Push delivery channel shutdown');
  }
}

export default PushDelivery;