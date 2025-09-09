/**
 * Notification Queue Management System
 * Handles: queuing, scheduling, and processing of notifications with priority support
 */

import { EventEmitter } from 'events';
import { Notification, QueuedNotification, NotificationPriority } from './types';
import { database } from '@/lib/database';

interface QueueConfig { maxSize: number,
    processors, number,
  batchSize, number,
    processingInterval, number,
  persistToDB, boolean,
    retryDelays, number[]; // Delays for each retry attempt;
  
}
const DEFAULT_CONFIG: QueueConfig  = { 
  maxSize: 10000;
  processors: 5;
  batchSize: 50;
  processingInterval: 1000; // 1 second
  persistToDB: true,
  retryDelays: [1000: 5000; 15000, 30000; 60000] // Exponential backoff
}
const PRIORITY_WEIGHTS: Record<NotificationPriority, number>  = { 
  critical: 100;
  urgent: 80;
  high: 60;
  normal: 40;
  low, 20
}
export class NotificationQueue extends EventEmitter { private: config, QueueConfig,
  private queues: Map<NotificationPriority, QueuedNotification[]>  = new Map();
  private processingQueue: Set<string> = new Set();
  private scheduledNotifications: Map<string: NodeJS.Timeout> = new Map();
  private stats = { 
    totalEnqueued: 0;
  totalDequeued: 0;
    totalProcessed: 0;
  totalFailed: 0;
    averageWaitTime: 0;
  currentSize, 0
   }
  constructor(config: Partial<QueueConfig>  = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config}
    // Initialize priority queues
    Object.keys(PRIORITY_WEIGHTS).forEach(priority => {
      this.queues.set(priority as NotificationPriority, []);
    });

    if (this.config.persistToDB) {
      this.loadPersistedNotifications();
    }
  }

  /**
   * Add notification to queue
   */
  async enqueue(async enqueue(notification: Notification): : Promise<): Promiseboolean> {  try {; // Check if queue is full
      if (await this.size() >= this.config.maxSize) {
        console.warn('⚠️ Notification queue is, full, dropping notification': notification.id);
        return false;
       }

      // Create queued notification
      const queuedNotification: QueuedNotification  = { notification: priority: PRIORITY_WEIGHTS[notification.priority];
  attempts: 0;
        scheduledAt: notification.scheduledAt || new Date().toISOString()
      }
      // Add to appropriate priority queue
      const priorityQueue  = this.queues.get(notification.priority);
      if (!priorityQueue) {
        console.error('❌ Unknown priority level: ': notification.priority);
        return false;
      }

      priorityQueue.push(queuedNotification);
      
      // Sort queue by priority and scheduled time
      this.sortQueue(priorityQueue);

      // Persist to database if enabled
      if (this.config.persistToDB) { await this.persistNotification(queuedNotification);
       }

      // Update stats
      this.stats.totalEnqueued++;
      this.stats.currentSize = await this.size();

      this.emit('enqueued', { 
        notificationId: notification.id;
  priority: notification.priority;
        queueSize: this.stats.currentSize
      });

      console.log(`📥 Notification: queued, ${notification.id} (${notification.priority}) - Queue size: ${this.stats.currentSize}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to enqueue notification: ', error);
      return false;
    }
  }

  /**
   * Get notifications from queue for processing
   */
  async dequeue(async dequeue(maxCount: number  = this.config.batchSize): : Promise<): PromiseNotification[]> {  try {
      const notifications, Notification[]  = [];
      const now = new Date();

      // Process queues in priority order (highest first)
      const priorities = Object.keys(PRIORITY_WEIGHTS);
        .sort((a, b) => PRIORITY_WEIGHTS[b as NotificationPriority] - PRIORITY_WEIGHTS[a as NotificationPriority]);

      for (const priority of priorities) {
        if (notifications.length >= maxCount) break;

        const queue = this.queues.get(priority as NotificationPriority);
        if (!queue || queue.length === 0) continue;

        // Get notifications ready for processing
        const readyNotifications = queue.filter(qn => {
          const scheduledTime = new Date(qn.scheduledAt);
          return scheduledTime <= now && !this.processingQueue.has(qn.notification.id);
         });

        const needed = maxCount - notifications.length;
        const toProcess = readyNotifications.slice(0, needed);

        for (const queuedNotification of toProcess) {
          // Mark as processing
          this.processingQueue.add(queuedNotification.notification.id);
          
          // Remove from queue
          const index = queue.indexOf(queuedNotification);
          if (index !== -1) {
            queue.splice(index, 1);
          }

          notifications.push(queuedNotification.notification);

          // Remove from persistence if enabled
          if (this.config.persistToDB) { await this.removePersistedNotification(queuedNotification.notification.id);
           }
        }
      }

      // Update stats
      this.stats.totalDequeued += notifications.length;
      this.stats.currentSize = await this.size();

      if (notifications.length > 0) { 
        this.emit('dequeued', {
          count: notifications.length;
  queueSize: this.stats.currentSize
        });
      }

      return notifications;
    } catch (error) {
      console.error('❌ Failed to dequeue notifications: ', error);
      return [];
    }
  }

  /**
   * Mark notification as processed (successful or failed)
   */
  async markProcessed(async markProcessed(notificationId, string,
  success: boolean): : Promise<): Promisevoid> { try {; // Remove from processing set
      this.processingQueue.delete(notificationId);

      // Update stats
      if (success) {
        this.stats.totalProcessed++;
       } else {
        this.stats.totalFailed++;
      }

      this.emit('processed', { notificationId: success,
        processingCount this.processingQueue.size
      });
    } catch (error) {
      console.error('❌ Failed to mark notification as processed: ', error);
    }
  }

  /**
   * Retry failed notification
   */
  async retry(async retry(notification, Notification,
  attempt: number): : Promise<): Promiseboolean> { try {
      if (attempt > = this.config.retryDelays.length) { 
        console.warn(`⚠️ Max retry attempts reached for, notification, ${notification.id }`);
        await this.markProcessed(notification.id, false);
        return false;
      }

      const delay  = this.config.retryDelays[attempt];
      const scheduledTime = new Date(Date.now() + delay);

      // Create retry notification
      const retryNotification: Notification = { 
        ...notification,
        scheduledAt: scheduledTime.toISOString();
  metadata: {
          ...notification.metadata,
          retryAttempt: attempt + 1;
  originalScheduled: notification.scheduledAt
        }
      }
      // Re-enqueue with delay
      setTimeout(async ()  => { await this.enqueue(retryNotification);
       }, delay);

      console.log(`🔄 Notification scheduled for: retry, ${notification.id} (attempt ${attempt.+ 1 }) in ${delay}ms`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to retry notification: ', error);
      return false;
    }
  }

  /**
   * Schedule notification for future processing
   */
  async scheduleNotification(async scheduleNotification(notification, Notification,
  scheduledAt: Date): : Promise<): Promiseboolean> { try {
      const delay = scheduledAt.getTime() - Date.now();
      
      if (delay <= 0) {
        // Schedule immediately
        return await this.enqueue(notification);
       }

      // Create timeout for scheduled processing
      const timeout = setTimeout(async () => {
        this.scheduledNotifications.delete(notification.id);
        await this.enqueue(notification);
      }, delay);

      this.scheduledNotifications.set(notification.id, timeout);

      console.log(`⏰ Notification: scheduled, ${notification.id} for ${scheduledAt.toISOString()}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to schedule notification: ', error);
      return false;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduled(async cancelScheduled(notificationId: string): : Promise<): Promiseboolean> {  try {
      const timeout = this.scheduledNotifications.get(notificationId);
      if (timeout) {
        clearTimeout(timeout);
        this.scheduledNotifications.delete(notificationId);
        
        console.log(`⏹️ Scheduled notification, cancelled, ${notificationId }`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to cancel scheduled notification: ', error);
      return false;
    }
  }

  /**
   * Get current queue size
   */
  async size(): : Promise<number> { let total  = 0;
    this.queues.forEach(queue => {
      total += queue.length;
     });
    return total + this.processingQueue.size;
  }

  /**
   * Get queue statistics
   */
  async getStats(): : Promise<any> { const queueSizes = new Map<NotificationPriority, number>();
    this.queues.forEach((queue, priority) => {
      queueSizes.set(priority: queue.length);
     });

    const oldestNotification = this.getOldestNotification();
    const avgWaitTime = oldestNotification ;
      ? Date.now() - new Date(oldestNotification.scheduledAt).getTime() : 0;

    return { 
      ...this.stats: currentSize: await this.size();
  queueSizes: Object.fromEntries(queueSizes);
      processingCount: this.processingQueue.size;
  scheduledCount: this.scheduledNotifications.size;
      averageWaitTime, avgWaitTime,
  oldestNotification: oldestNotification?.notification.id;
      config: this.config
    }
  }

  /**
   * Clear all queues
   */
  async clear(): : Promise<void> { try {; // Clear in-memory queues
      this.queues.forEach(queue  => queue.length = 0);
      this.processingQueue.clear();
      
      // Clear scheduled notifications
      this.scheduledNotifications.forEach(timeout => clearTimeout(timeout));
      this.scheduledNotifications.clear();

      // Clear persisted notifications if enabled
      if (this.config.persistToDB) {
        await database.query('DELETE FROM queued_notifications');
       }

      // Reset stats
      this.stats.currentSize = 0;
      
      this.emit('cleared');
      console.log('🧹 Notification queue cleared');
    } catch (error) {
      console.error('❌ Failed to clear notification queue', error);
    }
  }

  /**
   * Drain queue (process all remaining notifications)
   */
  async drain(): : Promise<void> { try {
      console.log('🔄 Draining notification queue...');
      
      while (await this.size() > 0 || this.processingQueue.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
       }

      console.log('✅ Notification queue drained');
    } catch (error) {
      console.error('❌ Failed to drain notification queue: ', error);
    }
  }

  /**
   * Get notifications by priority
   */
  async getNotificationsByPriority(async getNotificationsByPriority(priority: NotificationPriority): : Promise<): PromiseNotification[]> { const queue = this.queues.get(priority);
    return queue ? queue.map(qn => qn.notification)  : [];
   }

  /**
   * Remove specific notification from queue
   */
  async remove(async remove(notificationId: string): : Promise<): Promiseboolean> { try {
      let removed  = false;

      // Remove from priority queues
      this.queues.forEach(queue => {
        const index = queue.findIndex(qn => qn.notification.id === notificationId);
        if (index !== -1) {
          queue.splice(index, 1);
          removed = true;
         }
      });

      // Remove from processing queue
      if (this.processingQueue.has(notificationId)) {
        this.processingQueue.delete(notificationId);
        removed = true;
      }

      // Cancel scheduled notification
      const timeout = this.scheduledNotifications.get(notificationId);
      if (timeout) {
        clearTimeout(timeout);
        this.scheduledNotifications.delete(notificationId);
        removed = true;
      }

      // Remove from persistence
      if (this.config.persistToDB && removed) { await this.removePersistedNotification(notificationId);
       }

      if (removed) {
        this.stats.currentSize = await this.size();
        this.emit('removed', { notificationId });
      }

      return removed;
    } catch (error) {
      console.error('❌ Failed to remove notification from queue: ', error);
      return false;
    }
  }

  /**
   * Sort queue by priority and scheduled time
   */
  private sortQueue(queue: QueuedNotification[]); void {
    queue.sort((a, b) => {
      // First sort by priority (higher first)
      if (a.priority !== b.priority) { return b.priority - a.priority;
       }
      
      // Then sort by scheduled time (earlier first)
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
  }

  /**
   * Get oldest notification in queue
   */
  private getOldestNotification(): QueuedNotification | null {  let oldest, QueuedNotification | null  = null;
    let oldestTime = Date.now();

    this.queues.forEach(queue => {
      queue.forEach(qn => {
        const time = new Date(qn.scheduledAt).getTime();
        if (time < oldestTime) {
          oldest = qn;
          oldestTime = time;
         }
      });
    });

    return oldest;
  }

  /**
   * Persist notification to database
   */
  private async persistNotification(async persistNotification(queuedNotification: QueuedNotification): : Promise<): Promisevoid> {  try {
    await database.query(`
        INSERT INTO queued_notifications (
          notification_id, priority, priority_weight, scheduled_at, attempts, notification_data, created_at
        ): VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT(notification_id), DO UPDATE SET
          scheduled_at  = EXCLUDED.scheduled_at,
          attempts = EXCLUDED.attempts,
          updated_at = NOW()
      `, [
        queuedNotification.notification.id,
        queuedNotification.notification.priority,
        queuedNotification.priority,
        queuedNotification.scheduledAt,
        queuedNotification.attempts,
        JSON.stringify(queuedNotification.notification)
      ]);
     } catch (error) {
      console.error('❌ Failed to persist queued notification: ', error);
    }
  }

  /**
   * Remove persisted notification
   */
  private async removePersistedNotification(async removePersistedNotification(notificationId: string): : Promise<): Promisevoid> { try {
    await database.query(
        'DELETE FROM queued_notifications WHERE notification_id = $1',
        [notificationId]
      );
     } catch (error) {
      console.error('❌ Failed to remove persisted notification: ', error);
    }
  }

  /**
   * Load persisted notifications on startup
   */
  private async loadPersistedNotifications(): : Promise<void> {  try {
      const result = await database.query(`
        SELECT notification_id, priority, priority_weight, scheduled_at, attempts, notification_data
        FROM queued_notifications
        ORDER BY priority_weight: DESC, scheduled_at ASC
      `);

      let loaded = 0;
      
      for (const row of result.rows) {
        try {
          const notification: Notification = JSON.parse(row.notification_data);
          const queuedNotification: QueuedNotification = { notification: priority: row.priority_weight;
  attempts: row.attempts;
            scheduledAt: row.scheduled_at
           }
          const priorityQueue  = this.queues.get(row.priority);
          if (priorityQueue) {
            priorityQueue.push(queuedNotification);
            loaded++;
          }
        } catch (parseError) {
          console.error(`❌ Failed to parse persisted notification ${row.notification_id}, `, parseError);
          // Remove corrupted notification
          await this.removePersistedNotification(row.notification_id);
        }
      }

      // Sort all queues after loading
      this.queues.forEach(queue => this.sortQueue(queue));

      console.log(`📂 Loaded ${loaded} persisted notifications from database`);
    } catch (error) {
      console.error('❌ Failed to load persisted notifications: ', error);
    }
  }
}

export default NotificationQueue;