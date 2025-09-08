/**
 * Comprehensive Test Suite for Notification System
 * Tests all major components and workflows
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { NotificationEngine } from '../engine';
import { NotificationQueue } from '../queue';
import { DeliveryManager } from '../delivery/manager';
import { TemplateEngine } from '../templates/engine';
import { AIFilter } from '../ai/filter';
import { PreferenceManager } from '../preferences/manager';
import { AnalyticsTracker } from '../analytics/tracker';
import { 
  CreateNotificationInput, 
  NotificationPreferences, 
  NotificationChannel,
  NotificationPriority 
} from '../types';

// Mock dependencies
jest.mock('@/lib/database', () => ({
  database: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

jest.mock('@/lib/websocket/server', () => ({
  webSocketManager: {
    broadcastTradeNotification: jest.fn(),
    broadcastScoreUpdate: jest.fn(),
    getConnectionStats: jest.fn().mockReturnValue({ totalConnections: 0 })
  },
}));

describe('Notification System Integration Tests', () => {
  let notificationEngine: NotificationEngine;
  let mockDatabase: any;

  beforeAll(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    
    // Mock database
    mockDatabase = (await import('@/lib/database')).database;
    
    // Initialize notification engine
    notificationEngine = new NotificationEngine({
      maxConcurrentDeliveries: 2,
      batchSize: 10,
      retryAttempts: 1,
      processingInterval: 100,
      aiFilteringEnabled: false, // Disable AI for tests
      analyticsEnabled: false,   // Disable analytics for tests
      debugMode: true
    });

    await notificationEngine.initialize();
  });

  afterAll(async () => {
    await notificationEngine.shutdown();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Notification Creation and Processing', () => {
    test('should create and process a basic notification', async () => {
      // Mock database responses
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [] }) // notification preferences
        .mockResolvedValueOnce({ rows: [] }) // user data
        .mockResolvedValueOnce({ rows: [] }) // store notification
        .mockResolvedValueOnce({ rows: [] }); // track creation

      const notification: CreateNotificationInput = {
        type: 'trade_proposal',
        title: 'New Trade Proposal',
        message: 'You have received a trade proposal',
        userId: 'user123',
        leagueId: 'league456',
        priority: 'high',
        channels: ['in_app', 'push'],
        trigger: 'user_action',
        data: {
          tradeId: 'trade789',
          proposerTeam: 'Team A'
        },
        actionUrl: '/trades/trade789'
      };

      const notificationId = await notificationEngine.createNotification(notification);

      expect(notificationId).toBeTruthy();
      expect(typeof notificationId).toBe('string');
      expect(notificationId).toMatch(/^notif_\d+_[a-z0-9]+$/);
    });

    test('should handle notification creation errors gracefully', async () => {
      mockDatabase.query.mockRejectedValue(new Error('Database error'));

      const notification: CreateNotificationInput = {
        type: 'trade_proposal',
        title: 'New Trade Proposal',
        message: 'You have received a trade proposal',
        userId: 'user123',
        priority: 'high',
        channels: ['in_app'],
        trigger: 'user_action'
      };

      await expect(notificationEngine.createNotification(notification))
        .rejects.toThrow('Database error');
    });

    test('should validate required notification fields', async () => {
      const invalidNotification: any = {
        type: 'trade_proposal',
        // Missing required fields
        priority: 'high',
        channels: ['in_app'],
        trigger: 'user_action'
      };

      await expect(notificationEngine.createNotification(invalidNotification))
        .rejects.toThrow();
    });
  });

  describe('Multi-Channel Delivery', () => {
    test('should deliver notification to multiple channels', async () => {
      // Mock successful delivery responses
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const deliveryManager = new DeliveryManager({
        maxConcurrent: 2,
        batchSize: 10,
        retryAttempts: 1
      });

      await deliveryManager.initialize();

      const notification: any = {
        id: 'test123',
        type: 'trade_proposal',
        title: 'Test Notification',
        message: 'Test message',
        userId: 'user123',
        priority: 'high',
        channels: ['in_app', 'websocket']
      };

      const results = await deliveryManager.deliver(notification);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.notificationId === 'test123')).toBe(true);
    });

    test('should handle channel delivery failures with fallbacks', async () => {
      const deliveryManager = new DeliveryManager({
        maxConcurrent: 2,
        batchSize: 10,
        retryAttempts: 1,
        enableFallbacks: true
      });

      await deliveryManager.initialize();

      const notification: any = {
        id: 'test123',
        type: 'trade_proposal',
        title: 'Test Notification',
        message: 'Test message',
        userId: 'user123',
        priority: 'urgent',
        channels: ['sms'] // This should fail in test environment
      };

      const results = await deliveryManager.deliver(notification);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
    });
  });

  describe('Template Processing', () => {
    let templateEngine: TemplateEngine;

    beforeAll(async () => {
      templateEngine = new TemplateEngine();
      await templateEngine.initialize();
    });

    test('should process template with variables', async () => {
      const mockPreferences: NotificationPreferences = {
        userId: 'user123',
        enabled: true,
        channels: {} as any,
        types: {} as any,
        scheduling: {
          timezone: 'America/New_York',
          quietHours: {} as any,
          gameDayMode: {} as any,
          workingHours: {} as any,
          weekendMode: 'same'
        },
        frequency: {} as any,
        content: {
          language: 'en',
          tone: 'casual',
          includeEmojis: true,
          includeImages: true,
          includeStats: true,
          includeAnalysis: true,
          personalization: 'high'
        },
        privacy: {} as any,
        ai: {} as any
      };

      const data = {
        playerName: 'Tom Brady',
        teamName: 'Buccaneers'
      };

      const result = await templateEngine.processTemplate(
        'player_injury',
        'body',
        data,
        mockPreferences
      );

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    test('should handle template processing errors', async () => {
      const mockPreferences: NotificationPreferences = {
        userId: 'user123',
        enabled: true,
        channels: {} as any,
        types: {} as any,
        scheduling: {} as any,
        frequency: {} as any,
        content: {
          language: 'en',
          tone: 'casual',
          includeEmojis: true,
          includeImages: true,
          includeStats: true,
          includeAnalysis: true,
          personalization: 'high'
        },
        privacy: {} as any,
        ai: {} as any
      };

      const result = await templateEngine.processTemplate(
        'invalid_type' as any,
        'body',
        {},
        mockPreferences
      );

      expect(result).toBeTruthy(); // Should return fallback content
    });
  });

  describe('Queue Management', () => {
    let queue: NotificationQueue;

    beforeEach(async () => {
      queue = new NotificationQueue({
        maxSize: 100,
        processors: 2,
        batchSize: 5,
        persistToDB: false // Disable DB persistence for tests
      });
    });

    test('should enqueue and dequeue notifications', async () => {
      const notification: any = {
        id: 'test123',
        type: 'trade_proposal',
        title: 'Test',
        message: 'Test message',
        userId: 'user123',
        priority: 'normal',
        channels: ['in_app'],
        trigger: 'user_action',
        status: 'pending',
        createdAt: new Date().toISOString(),
        analytics: {
          impressions: 0,
          opens: 0,
          clicks: 0,
          conversions: 0,
          shares: 0,
          reactions: [],
          engagementScore: 0
        }
      };

      const enqueued = await queue.enqueue(notification);
      expect(enqueued).toBe(true);

      const size = await queue.size();
      expect(size).toBe(1);

      const dequeued = await queue.dequeue(1);
      expect(dequeued).toHaveLength(1);
      expect(dequeued[0].id).toBe('test123');
    });

    test('should respect queue priority ordering', async () => {
      const normalNotification: any = {
        id: 'normal123',
        priority: 'normal',
        type: 'score_update',
        title: 'Normal',
        message: 'Normal message',
        userId: 'user123',
        channels: ['in_app'],
        trigger: 'system_event',
        status: 'pending',
        createdAt: new Date().toISOString(),
        analytics: { impressions: 0, opens: 0, clicks: 0, conversions: 0, shares: 0, reactions: [], engagementScore: 0 }
      };

      const urgentNotification: any = {
        id: 'urgent123',
        priority: 'urgent',
        type: 'player_injury',
        title: 'Urgent',
        message: 'Urgent message',
        userId: 'user123',
        channels: ['in_app'],
        trigger: 'real_time',
        status: 'pending',
        createdAt: new Date().toISOString(),
        analytics: { impressions: 0, opens: 0, clicks: 0, conversions: 0, shares: 0, reactions: [], engagementScore: 0 }
      };

      await queue.enqueue(normalNotification);
      await queue.enqueue(urgentNotification);

      const dequeued = await queue.dequeue(2);
      expect(dequeued).toHaveLength(2);
      expect(dequeued[0].id).toBe('urgent123'); // Urgent should come first
      expect(dequeued[1].id).toBe('normal123');
    });

    test('should handle queue size limits', async () => {
      const smallQueue = new NotificationQueue({
        maxSize: 2,
        processors: 1,
        batchSize: 1,
        persistToDB: false
      });

      const notification1: any = {
        id: 'test1',
        priority: 'normal',
        type: 'score_update',
        title: 'Test 1',
        message: 'Test message 1',
        userId: 'user123',
        channels: ['in_app'],
        trigger: 'system_event',
        status: 'pending',
        createdAt: new Date().toISOString(),
        analytics: { impressions: 0, opens: 0, clicks: 0, conversions: 0, shares: 0, reactions: [], engagementScore: 0 }
      };

      const notification2: any = { ...notification1, id: 'test2', title: 'Test 2', message: 'Test message 2' };
      const notification3: any = { ...notification1, id: 'test3', title: 'Test 3', message: 'Test message 3' };

      const enqueued1 = await smallQueue.enqueue(notification1);
      const enqueued2 = await smallQueue.enqueue(notification2);
      const enqueued3 = await smallQueue.enqueue(notification3);

      expect(enqueued1).toBe(true);
      expect(enqueued2).toBe(true);
      expect(enqueued3).toBe(false); // Should fail due to size limit
    });
  });

  describe('Preference Management', () => {
    let preferenceManager: PreferenceManager;

    beforeAll(async () => {
      preferenceManager = new PreferenceManager({
        enableSmartDefaults: false,
        enableLearning: false,
        enableRuleEngine: false
      });

      await preferenceManager.initialize();
    });

    test('should create default preferences for new user', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const preferences = await preferenceManager.getUserPreferences('newuser123');

      expect(preferences).toBeTruthy();
      expect(preferences.userId).toBe('newuser123');
      expect(preferences.enabled).toBe(true);
      expect(preferences.channels).toBeTruthy();
      expect(preferences.channels.in_app.enabled).toBe(true);
    });

    test('should update user preferences', async () => {
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [] }) // Load existing preferences
        .mockResolvedValueOnce({ rows: [] }); // Save updated preferences

      const updates: Partial<NotificationPreferences> = {
        enabled: false,
        frequency: {
          maxPerHour: 5,
          maxPerDay: 20,
          digestMode: true,
          digestFrequency: 'daily',
          intelligentBatching: false
        }
      };

      const updatedPreferences = await preferenceManager.updatePreferences(
        'user123',
        updates
      );

      expect(updatedPreferences.enabled).toBe(false);
      expect(updatedPreferences.frequency?.maxPerHour).toBe(5);
      expect(updatedPreferences.frequency?.digestMode).toBe(true);
    });

    test('should validate preference updates', async () => {
      const invalidUpdates: any = {
        frequency: {
          maxPerHour: 150 // Invalid - too high
        }
      };

      await expect(
        preferenceManager.updatePreferences('user123', invalidUpdates)
      ).rejects.toThrow();
    });
  });

  describe('Analytics Tracking', () => {
    let analyticsTracker: AnalyticsTracker;

    beforeAll(async () => {
      analyticsTracker = new AnalyticsTracker({
        enabled: true,
        realTimeUpdates: false,
        aggregationInterval: 100
      });

      await analyticsTracker.initialize();
    });

    afterAll(async () => {
      await analyticsTracker.shutdown();
    });

    test('should track notification creation', async () => {
      const notification: any = {
        id: 'test123',
        type: 'trade_proposal',
        title: 'Test',
        message: 'Test message',
        userId: 'user123',
        priority: 'high',
        channels: ['in_app'],
        trigger: 'user_action'
      };

      await analyticsTracker.trackNotificationCreated(notification);

      // Verify analytics were initialized
      expect(notification.analytics).toBeTruthy();
      expect(notification.analytics.impressions).toBe(0);
      expect(notification.analytics.opens).toBe(0);
    });

    test('should track user engagement', async () => {
      const notification: any = {
        id: 'test123',
        userId: 'user123',
        analytics: {
          impressions: 1,
          opens: 0,
          clicks: 0,
          conversions: 0,
          shares: 0,
          reactions: [],
          engagementScore: 0
        }
      };

      await analyticsTracker.trackEngagement(notification, 'viewed');

      expect(notification.analytics.opens).toBe(1);
      expect(notification.analytics.engagementScore).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflows', () => {
    test('should process complete notification workflow', async () => {
      // Mock all database calls
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const notification: CreateNotificationInput = {
        type: 'trade_proposal',
        title: 'Complete Workflow Test',
        message: 'Testing complete notification workflow',
        userId: 'workflow_user',
        leagueId: 'test_league',
        priority: 'high',
        channels: ['in_app'],
        trigger: 'user_action',
        data: {
          tradeId: 'trade123',
          proposerTeam: 'Test Team'
        }
      };

      // Create notification
      const notificationId = await notificationEngine.createNotification(notification);
      expect(notificationId).toBeTruthy();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Mark as read
      await expect(
        notificationEngine.markAsRead(notificationId, 'workflow_user')
      ).resolves.not.toThrow();

      // Track click
      await expect(
        notificationEngine.trackClick(notificationId, 'workflow_user', 'view_trade')
      ).resolves.not.toThrow();
    });

    test('should handle system shutdown gracefully', async () => {
      const testEngine = new NotificationEngine({
        maxConcurrentDeliveries: 1,
        batchSize: 5,
        retryAttempts: 1,
        processingInterval: 100,
        debugMode: true
      });

      await testEngine.initialize();

      // Create a notification to ensure there's activity
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const notification: CreateNotificationInput = {
        type: 'system_maintenance',
        title: 'System Shutdown Test',
        message: 'Testing graceful shutdown',
        userId: 'shutdown_user',
        priority: 'normal',
        channels: ['in_app'],
        trigger: 'system_event'
      };

      await testEngine.createNotification(notification);

      // Shutdown should complete without errors
      await expect(testEngine.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle database connection failures', async () => {
      mockDatabase.query.mockRejectedValue(new Error('Connection failed'));

      const notification: CreateNotificationInput = {
        type: 'trade_proposal',
        title: 'Database Error Test',
        message: 'Testing database error handling',
        userId: 'error_user',
        priority: 'normal',
        channels: ['in_app'],
        trigger: 'user_action'
      };

      await expect(
        notificationEngine.createNotification(notification)
      ).rejects.toThrow('Connection failed');
    });

    test('should handle malformed notification data', async () => {
      const malformedNotification: any = {
        type: null,
        title: '',
        message: null,
        userId: '',
        priority: 'invalid_priority',
        channels: [],
        trigger: 'unknown_trigger'
      };

      await expect(
        notificationEngine.createNotification(malformedNotification)
      ).rejects.toThrow();
    });

    test('should handle service initialization failures', async () => {
      const badEngine = new NotificationEngine({
        maxConcurrentDeliveries: -1, // Invalid config
        debugMode: true
      });

      // Should handle invalid config gracefully
      await expect(badEngine.initialize()).resolves.not.toThrow();
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle high-volume notification creation', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const promises: Promise<string>[] = [];
      const notificationCount = 100;

      for (let i = 0; i < notificationCount; i++) {
        const notification: CreateNotificationInput = {
          type: 'score_update',
          title: `Load Test ${i}`,
          message: `Load testing notification ${i}`,
          userId: `load_user_${i}`,
          priority: 'low',
          channels: ['in_app'],
          trigger: 'system_event'
        };

        promises.push(notificationEngine.createNotification(notification));
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      expect(successful).toBeGreaterThan(notificationCount * 0.9); // At least 90% success
    });

    test('should maintain performance under concurrent access', async () => {
      mockDatabase.query.mockResolvedValue({ rows: [] });

      const startTime = Date.now();
      const concurrentUsers = 10;
      const notificationsPerUser = 5;

      const promises: Promise<string>[] = [];

      for (let user = 0; user < concurrentUsers; user++) {
        for (let notif = 0; notif < notificationsPerUser; notif++) {
          const notification: CreateNotificationInput = {
            type: 'league_message',
            title: `Concurrent Test ${user}-${notif}`,
            message: `Concurrent testing notification`,
            userId: `concurrent_user_${user}`,
            priority: 'normal',
            channels: ['in_app'],
            trigger: 'user_action'
          };

          promises.push(notificationEngine.createNotification(notification));
        }
      }

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const totalTime = endTime - startTime;
      const avgTimePerNotification = totalTime / successful;

      expect(successful).toBe(concurrentUsers * notificationsPerUser);
      expect(avgTimePerNotification).toBeLessThan(100); // Less than 100ms per notification
    });
  });
});

describe('Individual Component Tests', () => {
  describe('Delivery Channels', () => {
    test('InAppDelivery should process notifications correctly', async () => {
      const { InAppDelivery } = await import('../delivery/channels/inapp');
      
      const inAppDelivery = new InAppDelivery();
      await inAppDelivery.initialize();

      const notification: any = {
        id: 'inapp_test',
        type: 'trade_proposal',
        title: 'In-App Test',
        message: 'Testing in-app delivery',
        userId: 'inapp_user',
        priority: 'normal'
      };

      const result = await inAppDelivery.deliver(notification, {
        attempt: 1,
        maxAttempts: 1,
        deliveryId: 'test'
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('in_app');
      expect(result.notificationId).toBe('inapp_test');
    });

    test('WebSocketDelivery should handle user offline gracefully', async () => {
      const { WebSocketDelivery } = await import('../delivery/channels/websocket');
      
      const wsDelivery = new WebSocketDelivery();
      await wsDelivery.initialize();

      const notification: any = {
        id: 'ws_test',
        type: 'score_update',
        title: 'WebSocket Test',
        message: 'Testing WebSocket delivery',
        userId: 'offline_user',
        priority: 'normal'
      };

      const result = await wsDelivery.deliver(notification, {
        attempt: 1,
        maxAttempts: 1,
        deliveryId: 'test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not online');
    });
  });

  describe('AI Filter', () => {
    test('should make delivery decisions based on user behavior', async () => {
      const aiFilter = new AIFilter({
        enabled: true,
        learningEnabled: false
      });

      await aiFilter.initialize();

      const notification: any = {
        id: 'ai_test',
        type: 'score_update',
        message: 'Test message',
        userId: 'ai_user',
        priority: 'low'
      };

      const context: any = {
        user: {
          id: 'ai_user',
          segment: 'active',
          behavior: {
            engagementPatterns: [],
            optimalTiming: [],
            preferredChannels: [],
            responseHistory: [],
            contentPreferences: []
          },
          preferences: {
            ai: { enabled: true }
          }
        },
        notification: {
          type: 'score_update',
          priority: 'low',
          content: 'Test message',
          context: {}
        },
        environment: {
          timestamp: new Date().toISOString(),
          timeZone: 'UTC',
          gameDay: false,
          userOnline: true,
          deviceType: 'desktop'
        }
      };

      const decision = await aiFilter.shouldDeliver(notification, context);

      expect(decision).toHaveProperty('deliver');
      expect(decision).toHaveProperty('confidence');
      expect(decision).toHaveProperty('reason');
      expect(typeof decision.deliver).toBe('boolean');
      expect(typeof decision.confidence).toBe('number');
    });
  });
});

// Test utilities and helpers
export const createMockNotification = (overrides: any = {}): any => ({
  id: 'mock_notification',
  type: 'trade_proposal',
  title: 'Mock Notification',
  message: 'This is a mock notification for testing',
  userId: 'mock_user',
  priority: 'normal',
  channels: ['in_app'],
  trigger: 'user_action',
  status: 'pending',
  createdAt: new Date().toISOString(),
  analytics: {
    impressions: 0,
    opens: 0,
    clicks: 0,
    conversions: 0,
    shares: 0,
    reactions: [],
    engagementScore: 0
  },
  ...overrides
});

export const createMockPreferences = (overrides: any = {}): NotificationPreferences => ({
  userId: 'mock_user',
  enabled: true,
  channels: {
    push: {
      enabled: true,
      priority: 3,
      allowedPriorities: ['normal', 'high', 'urgent', 'critical'],
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        allowUrgent: true,
        allowGameDay: false
      },
      format: 'standard',
      deliverySpeed: 'immediate'
    },
    email: {
      enabled: true,
      priority: 2,
      allowedPriorities: ['high', 'urgent', 'critical'],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        allowUrgent: true,
        allowGameDay: true
      },
      format: 'rich',
      deliverySpeed: 'batched'
    },
    sms: {
      enabled: false,
      priority: 1,
      allowedPriorities: ['urgent', 'critical'],
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        allowUrgent: true,
        allowGameDay: false
      },
      format: 'minimal',
      deliverySpeed: 'immediate'
    },
    websocket: {
      enabled: true,
      priority: 4,
      allowedPriorities: ['low', 'normal', 'high', 'urgent', 'critical'],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        allowUrgent: true,
        allowGameDay: true
      },
      format: 'standard',
      deliverySpeed: 'immediate'
    },
    in_app: {
      enabled: true,
      priority: 5,
      allowedPriorities: ['low', 'normal', 'high', 'urgent', 'critical'],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        allowUrgent: true,
        allowGameDay: true
      },
      format: 'rich',
      deliverySpeed: 'immediate'
    }
  },
  types: {} as any,
  scheduling: {
    timezone: 'America/New_York',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
      allowUrgent: true,
      allowGameDay: false
    },
    gameDayMode: {
      enabled: true,
      frequency: 'normal',
      onlyMyPlayers: true,
      onlyCloseGames: false,
      scoreThreshold: 10
    },
    workingHours: {
      enabled: false,
      start: '09:00',
      end: '17:00',
      allowImportant: true,
      batchNonUrgent: true
    },
    weekendMode: 'more_relaxed'
  },
  frequency: {
    maxPerHour: 10,
    maxPerDay: 50,
    digestMode: false,
    digestFrequency: 'daily',
    intelligentBatching: true
  },
  content: {
    language: 'en',
    tone: 'casual',
    includeEmojis: true,
    includeImages: true,
    includeStats: true,
    includeAnalysis: true,
    personalization: 'high'
  },
  privacy: {
    allowAnalytics: true,
    allowPersonalization: true,
    allowSharing: false,
    dataRetention: 90,
    anonymizeData: false
  },
  ai: {
    enabled: true,
    smartFiltering: true,
    predictiveTiming: true,
    contentOptimization: true,
    channelOptimization: true,
    learningFromBehavior: true,
    privacyMode: 'limited'
  },
  ...overrides
});