/**
 * SMS Notification Delivery Channel
 * Handles SMS notifications via Twilio with smart content optimization
 */

import { Twilio } from 'twilio';
import { Notification, DeliveryResult } from '../../types';
import { database } from '@/lib/database';

interface SMSDeliveryOptions {
  attempt: number;
  maxAttempts: number;
  deliveryId: string;
}

interface SMSConfig {
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  maxLength: number;
  rateLimitPerMinute: number;
  costThreshold: number; // Max cost per user per day
}

interface SMSTemplate {
  content: string;
  maxLength: number;
}

export class SMSDelivery {
  private twilioClient: Twilio | null = null;
  private config: SMSConfig;
  private isInitialized: boolean = false;
  private deliveryStats = {
    sent: 0,
    failed: 0,
    delivered: 0,
    undelivered: 0,
    totalCost: 0
  };
  private rateLimiter = new Map<string, { count: number; resetTime: number; dailyCost: number }>();

  constructor() {
    this.config = {
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
      },
      maxLength: 160, // Standard SMS length
      rateLimitPerMinute: 5, // Conservative rate limiting
      costThreshold: 1.00 // $1 per user per day
    };
  }

  /**
   * Initialize SMS delivery service
   */
  async initialize(): Promise<void> {
    try {
      if (!this.config.twilio.accountSid || !this.config.twilio.authToken || !this.config.twilio.phoneNumber) {
        console.warn('⚠️ Twilio credentials not configured for SMS notifications');
        return;
      }

      // Initialize Twilio client
      this.twilioClient = new Twilio(
        this.config.twilio.accountSid,
        this.config.twilio.authToken
      );

      // Verify Twilio configuration
      await this.verifyTwilioConfig();

      // Clean up old rate limit data
      this.startRateLimitCleanup();

      this.isInitialized = true;
      console.log('✅ SMS delivery channel initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SMS delivery:', error);
      throw error;
    }
  }

  /**
   * Deliver SMS notification
   */
  async deliver(
    notification: Notification,
    options: SMSDeliveryOptions
  ): Promise<DeliveryResult> {
    const startTime = Date.now();

    try {
      if (!this.isInitialized || !this.twilioClient) {
        throw new Error('SMS delivery not initialized');
      }

      // Get user's phone number
      const phoneNumber = await this.getUserPhoneNumber(notification.userId);
      
      if (!phoneNumber) {
        return {
          notificationId: notification.id,
          channel: 'sms',
          success: false,
          timestamp: new Date().toISOString(),
          latency: Date.now() - startTime,
          error: 'No phone number found for user'
        };
      }

      // Check if SMS notifications are enabled for this user and type
      const smsEnabled = await this.isSMSEnabledForUser(
        notification.userId,
        notification.type
      );

      if (!smsEnabled) {
        return {
          notificationId: notification.id,
          channel: 'sms',
          success: false,
          timestamp: new Date().toISOString(),
          latency: Date.now() - startTime,
          error: 'SMS notifications disabled for user'
        };
      }

      // Check rate limits and cost thresholds
      const rateLimitCheck = await this.checkRateLimit(notification.userId);
      if (!rateLimitCheck.allowed) {
        return {
          notificationId: notification.id,
          channel: 'sms',
          success: false,
          timestamp: new Date().toISOString(),
          latency: Date.now() - startTime,
          error: rateLimitCheck.reason
        };
      }

      // Generate SMS content
      const smsContent = this.generateSMSContent(notification);
      
      // Send SMS
      const message = await this.twilioClient.messages.create({
        body: smsContent.content,
        from: this.config.twilio.phoneNumber,
        to: phoneNumber,
        statusCallback: `${process.env.BASE_URL}/api/notifications/sms/status`,
        provideFeedback: true
      });

      // Track delivery
      await this.trackSMSDelivery(
        notification.id,
        phoneNumber,
        message.sid,
        'sent',
        message.price
      );

      // Update rate limiter
      this.updateRateLimit(notification.userId, parseFloat(message.price || '0.01'));

      this.deliveryStats.sent++;
      this.deliveryStats.totalCost += parseFloat(message.price || '0.01');

      return {
        notificationId: notification.id,
        channel: 'sms',
        success: true,
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,
        metadata: {
          messageSid: message.sid,
          to: phoneNumber,
          attempt: options.attempt,
          price: message.price,
          segments: message.numSegments
        }
      };

    } catch (error: any) {
      this.deliveryStats.failed++;

      // Handle Twilio-specific errors
      let errorMessage = 'SMS delivery error';
      
      if (error.code === 21211) {
        errorMessage = 'Invalid phone number';
      } else if (error.code === 21408) {
        errorMessage = 'Phone number cannot receive SMS';
      } else if (error.code === 21614) {
        errorMessage = 'Phone number is not mobile';
      } else if (error.code === 21610) {
        errorMessage = 'Phone number is blacklisted';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        notificationId: notification.id,
        channel: 'sms',
        success: false,
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  /**
   * Generate SMS content from notification
   */
  private generateSMSContent(notification: Notification): SMSTemplate {
    // Use short message if available, otherwise truncate main message
    let content = notification.shortMessage || notification.message;
    
    // Add action URL if available and space permits
    if (notification.actionUrl && content.length < 100) {
      content += ` ${notification.actionUrl}`;
    }

    // Truncate if too long
    if (content.length > this.config.maxLength) {
      content = content.substring(0, this.config.maxLength - 3) + '...';
    }

    // Add emojis based on type for better engagement
    const emoji = this.getEmojiForType(notification.type);
    if (emoji && content.length < this.config.maxLength - 2) {
      content = `${emoji} ${content}`;
    }

    return {
      content,
      maxLength: this.config.maxLength
    };
  }

  /**
   * Get appropriate emoji for notification type
   */
  private getEmojiForType(type: string): string {
    const emojiMap: { [key: string]: string } = {
      'trade_proposal': '🤝',
      'trade_accepted': '✅',
      'trade_rejected': '❌',
      'waiver_won': '🎉',
      'waiver_lost': '😔',
      'player_injury': '🚨',
      'lineup_reminder': '⏰',
      'score_update': '🏈',
      'close_matchup': '🔥',
      'breaking_news': '📰',
      'achievement_unlocked': '🏆'
    };

    return emojiMap[type] || '📱';
  }

  /**
   * Get user's phone number
   */
  private async getUserPhoneNumber(userId: string): Promise<string | null> {
    try {
      const result = await database.query(
        'SELECT phone_number FROM users WHERE id = $1 AND phone_verified = true',
        [userId]
      );
      
      return result.rows.length > 0 ? result.rows[0].phone_number : null;
    } catch (error) {
      console.error(`Error getting user phone for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Check if SMS notifications are enabled for user and type
   */
  private async isSMSEnabledForUser(userId: string, type: string): Promise<boolean> {
    try {
      const result = await database.query(`
        SELECT sms_enabled, notification_types 
        FROM notification_preferences 
        WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return false; // SMS disabled by default due to cost
      }

      const prefs = result.rows[0];
      if (!prefs.sms_enabled) {
        return false;
      }

      const notificationTypes = prefs.notification_types || {};
      
      // Only allow high-priority types via SMS by default
      const highPriorityTypes = [
        'trade_proposal',
        'trade_accepted', 
        'waiver_won',
        'player_injury',
        'lineup_reminder'
      ];

      if (!highPriorityTypes.includes(type)) {
        return notificationTypes[type] === true;
      }

      return notificationTypes[type] !== false;
    } catch (error) {
      console.error(`Error checking SMS preferences for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check rate limits and cost thresholds
   */
  private async checkRateLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const dailyWindowMs = 86400000; // 24 hours

    if (!this.rateLimiter.has(userId)) {
      this.rateLimiter.set(userId, {
        count: 0,
        resetTime: now + windowMs,
        dailyCost: 0
      });
      return { allowed: true };
    }

    const limiter = this.rateLimiter.get(userId)!;

    // Reset if window expired
    if (now > limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = now + windowMs;
    }

    // Check rate limit
    if (limiter.count >= this.config.rateLimitPerMinute) {
      return { 
        allowed: false, 
        reason: `Rate limit exceeded: ${this.config.rateLimitPerMinute} SMS per minute` 
      };
    }

    // Check daily cost threshold
    if (limiter.dailyCost >= this.config.costThreshold) {
      return { 
        allowed: false, 
        reason: `Daily cost threshold exceeded: $${this.config.costThreshold}` 
      };
    }

    return { allowed: true };
  }

  /**
   * Update rate limiter after successful send
   */
  private updateRateLimit(userId: string, cost: number): void {
    const limiter = this.rateLimiter.get(userId);
    if (limiter) {
      limiter.count++;
      limiter.dailyCost += cost;
    }
  }

  /**
   * Track SMS delivery
   */
  private async trackSMSDelivery(
    notificationId: string,
    phoneNumber: string,
    messageSid: string,
    status: 'sent' | 'delivered' | 'failed' | 'undelivered',
    price?: string
  ): Promise<void> {
    try {
      await database.query(`
        INSERT INTO sms_delivery_tracking (
          notification_id, phone_number, message_sid, status, price, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (message_sid) 
        DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
      `, [notificationId, phoneNumber, messageSid, status, price]);
    } catch (error) {
      console.error('Error tracking SMS delivery:', error);
    }
  }

  /**
   * Handle SMS delivery status updates from Twilio webhook
   */
  async handleDeliveryStatusUpdate(
    messageSid: string,
    status: 'delivered' | 'failed' | 'undelivered',
    errorCode?: string
  ): Promise<void> {
    try {
      await database.query(`
        UPDATE sms_delivery_tracking 
        SET status = $1, error_code = $2, updated_at = NOW()
        WHERE message_sid = $3
      `, [status, errorCode, messageSid]);

      // Update stats
      if (status === 'delivered') {
        this.deliveryStats.delivered++;
      } else if (status === 'failed' || status === 'undelivered') {
        this.deliveryStats.undelivered++;
      }

      console.log(`📱 SMS status updated: ${messageSid} -> ${status}`);
    } catch (error) {
      console.error('Error handling SMS status update:', error);
    }
  }

  /**
   * Send verification SMS
   */
  async sendVerificationSMS(phoneNumber: string, code: string): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        throw new Error('SMS service not initialized');
      }

      const message = await this.twilioClient.messages.create({
        body: `🏈 Your Astral Field verification code: ${code}. Valid for 10 minutes.`,
        from: this.config.twilio.phoneNumber,
        to: phoneNumber
      });

      console.log(`📱 Verification SMS sent: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send verification SMS:', error);
      return false;
    }
  }

  /**
   * Verify Twilio configuration
   */
  private async verifyTwilioConfig(): Promise<void> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      // Validate phone number
      const phoneNumber = await this.twilioClient
        .lookups
        .v2
        .phoneNumbers(this.config.twilio.phoneNumber)
        .fetch();

      if (!phoneNumber.valid) {
        throw new Error('Twilio phone number is invalid');
      }

      console.log('✅ Twilio configuration verified');
    } catch (error) {
      console.error('Twilio configuration verification failed:', error);
      throw error;
    }
  }

  /**
   * Start rate limit cleanup job
   */
  private startRateLimitCleanup(): void {
    // Clean up rate limiter every hour
    setInterval(() => {
      const now = Date.now();
      const dailyWindowMs = 86400000; // 24 hours

      this.rateLimiter.forEach((limiter, userId) => {
        // Reset daily costs after 24 hours
        if (now - limiter.resetTime > dailyWindowMs) {
          limiter.dailyCost = 0;
        }
      });

      // Remove old entries
      const cutoff = now - dailyWindowMs;
      for (const [userId, limiter] of this.rateLimiter.entries()) {
        if (limiter.resetTime < cutoff) {
          this.rateLimiter.delete(userId);
        }
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Get SMS delivery statistics
   */
  async getStats(): Promise<any> {
    try {
      const deliveryStats = await database.query(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(CAST(price AS DECIMAL)) as total_cost,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_delivery_time
        FROM sms_delivery_tracking 
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY status
      `);

      const typeStats = await database.query(`
        SELECT 
          n.type,
          COUNT(s.*) as sms_sent,
          COUNT(s.*) FILTER (WHERE s.status = 'delivered') as delivered,
          COUNT(s.*) FILTER (WHERE s.status IN ('failed', 'undelivered')) as failed,
          SUM(CAST(s.price AS DECIMAL)) as total_cost
        FROM notifications n
        LEFT JOIN sms_delivery_tracking s ON n.id = s.notification_id
        WHERE n.channels @> '["sms"]'
        AND n.created_at > NOW() - INTERVAL '7 days'
        GROUP BY n.type
      `);

      return {
        deliveryStats: deliveryStats.rows,
        typeStats: typeStats.rows,
        summary: this.deliveryStats,
        rateLimitStats: {
          activeUsers: this.rateLimiter.size,
          totalDailyCost: Array.from(this.rateLimiter.values())
            .reduce((sum, limiter) => sum + limiter.dailyCost, 0)
        },
        isInitialized: this.isInitialized,
        config: {
          maxLength: this.config.maxLength,
          rateLimitPerMinute: this.config.rateLimitPerMinute,
          costThreshold: this.config.costThreshold,
          hasCredentials: !!(this.config.twilio.accountSid && this.config.twilio.authToken)
        }
      };
    } catch (error) {
      console.error('Error getting SMS stats:', error);
      return { error: 'Failed to get stats' };
    }
  }

  /**
   * Shutdown SMS delivery
   */
  async shutdown(): Promise<void> {
    this.rateLimiter.clear();
    this.twilioClient = null;
    this.isInitialized = false;
    console.log('🔄 SMS delivery channel shutdown');
  }
}

export default SMSDelivery;