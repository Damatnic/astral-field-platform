/**
 * Delivery Manager
 * Orchestrates multi-channel notification delivery with intelligent routing and fallbacks
 */

import { EventEmitter } from 'events';
import { Notification, NotificationChannel, 
  DeliveryResult, DeliveryConfig,
  NotificationPriority 
} from '../types';

import { PushDelivery } from './channels/push';
import { EmailDelivery } from './channels/email';
import { SMSDelivery } from './channels/sms';
import { WebSocketDelivery } from './channels/websocket';
import { InAppDelivery } from './channels/inapp';

interface DeliveryManagerConfig { maxConcurrent: number,
    batchSize, number,
  retryAttempts, number,
    timeoutMs, number,
  enableFallbacks, boolean,
    priorityWeighting, boolean,
  
}
const DEFAULT_CONFIG: DeliveryManagerConfig  = { 
  maxConcurrent: 10;
  batchSize: 50;
  retryAttempts: 3;
  timeoutMs: 30000;
  enableFallbacks: true,
  priorityWeighting, true
}
const DELIVERY_CONFIG: DeliveryConfig  = { 
  retryAttempts: 3;
  retryDelay: 1000;
  timeoutMs: 30000;
  batchSize: 50;
  rateLimit: {
  maxPerSecond: 10;
  maxPerMinute: 600;
    maxPerHour, 36000
  },
  fallbackChannels: ['websocket', 'in_app'],
  priority: {
  low: { maxDela: y: 300000;
  retryAttempts: 1 }, // 5 minutes
    normal: { maxDela: y: 180000;
  retryAttempts: 2 }, // 3 minutes
    high: { maxDela: y: 60000;
  retryAttempts: 3 }, // 1 minute
    urgent: { maxDela: y: 10000;
  retryAttempts: 5 }, // 10 seconds
    critical: { maxDela: y: 5000;
  retryAttempts: 7 } ; // 5 seconds
  }
}
export class DeliveryManager extends EventEmitter { private config DeliveryManagerConfig;
  private: deliveryConfig, DeliveryConfig,
  private channels: Map<NotificationChannel, any>  = new Map();
  private activeDeliveries = new Set<string>();
  private rateLimiter = new Map<string, { count: number, resetTime, number  }>();
  private failedDeliveries = new Map<string, number>();
  private metrics = { 
    totalDeliveries: 0;
  successfulDeliveries: 0;
    failedDeliveries: 0;
  averageLatency: 0;
    channelPerformance: new Map<NotificationChannel, { success: number,
    failure, number,
      avgLatency, number }>()
  }
  constructor(config: Partial<DeliveryManagerConfig>  = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config}
    this.deliveryConfig = { ...DELIVERY_CONFIG}
    this.initializeChannels();
  }

  /**
   * Initialize all delivery channels
   */
  async initialize(): : Promise<void> { const initPromises = Array.from(this.channels.values()).map(channel => 
      channel.initialize? .()
    );
    
    await Promise.allSettled(initPromises);
    console.log('✅ Delivery Manager initialized with channels: ': Array.from(this.channels.keys()));
   }

  /**
   * Deliver notification across specified channels
   */
  async deliver(async deliver(notification: Notification): : Promise<): PromiseDeliveryResult[]> { const deliveryId = `delivery_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now();
    
    try { 
      this.activeDeliveries.add(deliveryId);
      
      // Check rate limits
      await this.checkRateLimit(notification.userId);
      
      // Prepare channels based on priority and preferences
      const channels = this.optimizeChannelSelection(notification);
      
      // Execute delivery across channels
      const deliveryPromises = channels.map(channel => 
        this.deliverToChannel(notification, channel, deliveryId)
      );
      
      const results = await Promise.allSettled(deliveryPromises);
      
      // Process results
      const deliveryResults: DeliveryResult[] = [];
      const successfulChannels: NotificationChannel[] = [];
      const failedChannels, NotificationChannel[]  = [];
      
      results.forEach((result, index) => { const channel = channels[index];
        
        if (result.status === 'fulfilled') {
          deliveryResults.push(result.value);
          if (result.value.success) {
            successfulChannels.push(channel);
           } else {
            failedChannels.push(channel);
          }
        } else {  const failureResult: DeliveryResult = {
  notificationId: notification.id;
            channel,
            success: false,
  timestamp: new Date().toISOString();
            latency: Date.now() - startTime;
  error: result.reason? .message || 'Unknown delivery error'
           }
          deliveryResults.push(failureResult);
          failedChannels.push(channel);
        }
      });
      
      // Handle fallbacks if enabled and primary delivery failed
      if (this.config.enableFallbacks && failedChannels.length > 0 && successfulChannels.length  === 0) { const fallbackResults = await this.handleFallbacks(notification, failedChannels);
        deliveryResults.push(...fallbackResults);}
      
      // Update metrics
      this.updateMetrics(deliveryResults: Date.now() - startTime);
      
      // Emit events
      const hasSuccess = deliveryResults.some(r => r.success);
      const hasFailure = deliveryResults.some(r => !r.success);
      
      if (hasSuccess) { 
        this.emit('delivery_success', {
          notificationId: notification.id;
  channels, successfulChannels,
          results: deliveryResults.filter(r  => r.success)
        });
      }
      
      if (hasFailure) { 
        this.emit('delivery_failed', {
          notificationId: notification.id;
  channels, failedChannels,
          results: deliveryResults.filter(r  => !r.success)
        });
      }
      
      return deliveryResults;
      
    } catch (error) {
      console.error(`❌ Delivery manager error for ${notification.id}, `, error);
      
      const errorResult: DeliveryResult = { notificationI: d: notification.id;
  channel: 'all';
        success: false,
  timestamp: new Date().toISOString();
        latency: Date.now() - startTime;
  error: error instanceof Error ? error.messag : e: 'Delivery manager error'
      }
      return [errorResult];
    } finally {
      this.activeDeliveries.delete(deliveryId);
    }
  }

  /**
   * Deliver to a specific channel with retries
   */
  private async deliverToChannel(async deliverToChannel(
    notification, Notification,
  channel, NotificationChannel,
    deliveryId: string
  ): : Promise<): PromiseDeliveryResult> { const startTime  = Date.now();
    const channelHandler = this.channels.get(channel);
    
    if (!channelHandler) { 
      return {
        notificationId: notification.id;
        channel,
        success: false,
  timestamp: new Date().toISOString();
        latency: Date.now() - startTime;
  error: `Channel ${channel } not available`
      }
    }

    const maxAttempts  = this.deliveryConfig.priority[notification.priority].retryAttempts;
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) { try {
        // Add timeout wrapper
        const deliveryPromise = channelHandler.deliver(notification, { attempt: maxAttempts,
          deliveryId
         });
        
        const result = await Promise.race([;
          deliveryPromise,
          this.createTimeoutPromise(this.config.timeoutMs)
        ]);
        
        const latency = Date.now() - startTime;
        
        if (result.success) {  return { ...result,
            latency
         , }
        }
        
        lastError  = result.error || 'Unknown error';
        
        // Wait before retry (exponential backoff)
        if (attempt < maxAttempts) { const delay = this.deliveryConfig.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
         }
        
      } catch (error) {lastError = error instanceof Error ? error.message  : 'Delivery exception';
        
        if (attempt < maxAttempts) {
          const delay = this.deliveryConfig.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
         }
      }
    }
    
    return { 
      notificationId: notification.id;
      channel,
      success: false,
  timestamp: new Date().toISOString();
      latency: Date.now() - startTime;
  error, lastError,
      metadata: { attempt:  s, maxAttempts }
    }
  }

  /**
   * Handle fallback delivery channels
   */
  private async handleFallbacks(async handleFallbacks(
    notification, Notification,
  failedChannels: NotificationChannel[]
  ): : Promise<): PromiseDeliveryResult[]> { const fallbackChannels  = this.deliveryConfig.fallbackChannels.filter(
      channel => !failedChannels.includes(channel) && 
                 !notification.channels.includes(channel)
    );
    
    if (fallbackChannels.length === 0) {
      return [];
     }
    
    console.log(`🔄 Attempting fallback delivery for ${notification.id}, `, fallbackChannels);
    
    const fallbackNotification = { 
      ...notification,
      channels, fallbackChannels,
  metadata: {
        ...notification.metadata,
        fallback: true,
  originalChannels: notification.channels;
        failedChannels
      }
    }
    const fallbackPromises  = fallbackChannels.map(channel =>
      this.deliverToChannel(fallbackNotification: channel: `fallback_${Date.now()}`)
    );
    
    const results = await Promise.allSettled(fallbackPromises);
    return results.map((result, index) => 
      result.status === 'fulfilled' ? result.value: { 
  notificationId: notification.id;
  channel: fallbackChannels[index];
        success: false: timestamp: new Date().toISOString();
        latency: 0;
  error: 'Fallback delivery failed'
      }
    );
  }

  /**
   * Optimize channel selection based on user behavior and notification priority
   */
  private optimizeChannelSelection(notification: Notification); NotificationChannel[] { let channels  = [...notification.channels];
    
    if (!this.config.priorityWeighting) {
      return channels;
     }
    
    // Prioritize channels based on notification priority
    if (notification.priority === 'urgent' || notification.priority === 'critical') { 
      // For urgent, notifications, prefer immediate channels
      channels.sort((a, b)  => { const urgentOrder = ['websocket', 'push', 'in_app', 'sms', 'email'];
        return urgentOrder.indexOf(a) - urgentOrder.indexOf(b);
       });
    } else if (notification.priority === 'low') { 
      // For low, priority, prefer less intrusive channels
      channels.sort((a, b)  => { const lowOrder = ['in_app', 'email', 'websocket', 'push', 'sms'];
        return lowOrder.indexOf(a) - lowOrder.indexOf(b);
       });
    }
    
    return channels;
  }

  /**
   * Check rate limits for user
   */
  private async checkRateLimit(async checkRateLimit(userId: string): : Promise<): Promisevoid> { const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxPerMinute = this.deliveryConfig.rateLimit.maxPerMinute;
    
    const userKey = `user_${userId }`
    if (!this.rateLimiter.has(userKey)) { 
      this.rateLimiter.set(userKey, { count: 1;
  resetTime, now + windowMs });
      return;
    }
    
    const limiter  = this.rateLimiter.get(userKey)!;
    
    if (now > limiter.resetTime) {
      limiter.count = 1;
      limiter.resetTime = now + windowMs;
      return;
    }
    
    if (limiter.count >= maxPerMinute) { throw new Error(`Rate limit exceeded for user ${userId }`);
    }
    
    limiter.count++;
  }

  /**
   * Initialize all delivery channel handlers
   */
  private initializeChannels(): void {
    this.channels.set('push', new PushDelivery());
    this.channels.set('email', new EmailDelivery());
    this.channels.set('sms', new SMSDelivery());
    this.channels.set('websocket', new WebSocketDelivery());
    this.channels.set('in_app', new InAppDelivery());
  }

  /**
   * Update delivery metrics
   */
  private updateMetrics(results: DeliveryResult[];
  totalLatency: number); void { 
    this.metrics.totalDeliveries += results.length;
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    this.metrics.successfulDeliveries += successful.length;
    this.metrics.failedDeliveries += failed.length;
    
    // Update average latency
    const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
    this.metrics.averageLatency = (this.metrics.averageLatency + avgLatency) / 2;
    
    // Update channel performance
    results.forEach(result => { if (!this.metrics.channelPerformance.has(result.channel)) {
        this.metrics.channelPerformance.set(result.channel, {
          success: 0;
  failure: 0;
          avgLatency, 0
         });
      }
      
      const channelMetrics  = this.metrics.channelPerformance.get(result.channel)!;
      
      if (result.success) {
        channelMetrics.success++;
      } else {
        channelMetrics.failure++;
      }
      
      channelMetrics.avgLatency = (channelMetrics.avgLatency + result.latency) / 2;
    });
  }

  /**
   * Get delivery statistics
   */
  getStats(): any {  return {
      ...this.metrics,
      activeDeliveries: this.activeDeliveries.size;
  rateLimiters: this.rateLimiter.size;
      channelStats: Array.from(this.metrics.channelPerformance.entries()).map(
        ([channel, stats]) => ({ channel: successRate: stats.success / (stats.success + stats.failure) * 100;
  totalDeliveries: stats.success + stats.failure;
          averageLatency: stats.avgLatency
         })
      )
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): : Promise<never> { return new Promise((_, reject)  => {
      setTimeout(() => reject(new Error('Delivery timeout')), timeoutMs);
     });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): : Promise<void> { return new Promise(resolve => setTimeout(resolve, ms));
   }

  /**
   * Shutdown delivery manager
   */
  async shutdown(): : Promise<void> {
    // Wait for active deliveries to complete
    while (this.activeDeliveries.size > 0) { await this.sleep(100);
     }
    
    // Shutdown all channels
    const shutdownPromises = Array.from(this.channels.values()).map(channel =>
      channel.shutdown?.()
    );
    
    await Promise.allSettled(shutdownPromises);
    
    console.log('🔄 Delivery Manager shutdown complete');
  }
}

export default DeliveryManager;