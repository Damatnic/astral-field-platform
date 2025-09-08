/**
 * Intelligent Notification System
 * AI-powered smart alerts, real-time notifications, and personalized insights
 */

import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';
import { predictiveAnalytics } from '@/services/analytics/predictiveAnalytics';

export type NotificationType = 
  | 'score_update' 
  | 'player_alert' 
  | 'injury_news' 
  | 'trade_opportunity' 
  | 'waiver_recommendation' 
  | 'lineup_reminder' 
  | 'matchup_insight' 
  | 'breaking_news' 
  | 'weather_alert' 
  | 'game_event'
  | 'social_update';

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app' | 'websocket';

export interface SmartNotification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any>;
  channels: NotificationChannel[];
  timing: {
    scheduledFor?: Date;
    expiresAt?: Date;
    timeZone: string;
    deliveryWindow?: {
      start: string; // HH:mm
      end: string;   // HH:mm
    };
  };
  personalization: {
    relevanceScore: number;
    userPreferences: string[];
    contextualFactors: string[];
  };
  delivery: {
    sent: boolean;
    sentAt?: Date;
    deliveredChannels: NotificationChannel[];
    failedChannels: NotificationChannel[];
    userInteraction?: 'opened' | 'dismissed' | 'acted_upon';
    interactionAt?: Date;
  };
  triggers: NotificationTrigger[];
  createdAt: Date;
}

export interface NotificationTrigger {
  type: 'threshold' | 'event' | 'time' | 'condition';
  condition: string;
  value?: any;
  operator?: '>' | '<' | '=' | '!=' | 'contains' | 'changed';
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  types: Record<NotificationType, {
    enabled: boolean;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    frequency: 'immediate' | 'batched' | 'daily_digest';
  }>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timeZone: string;
    emergency: boolean; // Allow critical notifications during quiet hours
  };
  filters: {
    minimumRelevanceScore: number;
    onlyOwnedPlayers: boolean;
    gameTimeOnly: boolean;
    excludeWeekends: boolean;
  };
  personalization: {
    favoriteTeams: string[];
    favoritePlayerIds: string[];
    leagueIds: string[];
    interests: string[];
  };
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  variables: string[];
  conditions: string[];
  priority: NotificationPriority;
  channels: NotificationChannel[];
  active: boolean;
}

export interface NotificationAnalytics {
  userId: string;
  period: { start: Date; end: Date };
  stats: {
    totalSent: number;
    byChannel: Record<NotificationChannel, number>;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
    openRate: number;
    actionRate: number;
    dismissalRate: number;
  };
  engagement: {
    bestPerformingTypes: NotificationType[];
    preferredChannels: NotificationChannel[];
    optimalSendTimes: string[];
    responsePatterns: Record<string, number>;
  };
  optimization: {
    recommendedFrequency: Record<NotificationType, string>;
    suggestedChannels: NotificationChannel[];
    relevanceThreshold: number;
  };
}

class IntelligentNotificationSystem {
  private notificationQueue: SmartNotification[] = [];
  private templates = new Map<string, NotificationTemplate>();
  private userPreferences = new Map<string, NotificationPreferences>();
  private analyticsCache = new Map<string, NotificationAnalytics>();
  private processingInterval?: NodeJS.Timeout;
  private realTimeListeners = new Set<string>();

  // External service integrations
  private pushService: PushNotificationService;
  private emailService: EmailNotificationService;
  private smsService: SMSNotificationService;

  constructor() {
    this.initializeServices();
    this.loadNotificationTemplates();
    this.startNotificationProcessor();
  }

  private async initializeServices(): Promise<void> {
    this.pushService = new PushNotificationService();
    this.emailService = new EmailNotificationService();
    this.smsService = new SMSNotificationService();

    await Promise.all([
      this.pushService.initialize(),
      this.emailService.initialize(),
      this.smsService.initialize()
    ]);

    console.log('✅ Intelligent Notifications: All services initialized');
  }

  private async loadNotificationTemplates(): Promise<void> {
    const templates: NotificationTemplate[] = [
      {
        id: 'score_update_critical',
        type: 'score_update',
        title: '🏈 {{playerName}} Touchdown!',
        message: '{{playerName}} just scored! Your team gained {{points}} points. Current total: {{teamScore}}',
        variables: ['playerName', 'points', 'teamScore'],
        conditions: ['points > 6', 'isOwnedPlayer = true'],
        priority: 'high',
        channels: ['push', 'in_app', 'websocket'],
        active: true
      },
      {
        id: 'injury_alert_major',
        type: 'injury_news',
        title: '🚨 {{playerName}} Injury Alert',
        message: '{{playerName}} ({{team}}) has suffered a {{injuryType}}. Severity: {{severity}}. Expected return: {{expectedReturn}}',
        variables: ['playerName', 'team', 'injuryType', 'severity', 'expectedReturn'],
        conditions: ['severity >= medium', 'isOwnedPlayer = true OR favoritePlayer = true'],
        priority: 'critical',
        channels: ['push', 'email', 'in_app', 'websocket'],
        active: true
      },
      {
        id: 'trade_opportunity_smart',
        type: 'trade_opportunity',
        title: '🤝 Smart Trade Opportunity',
        message: 'AI suggests trading {{yourPlayer}} for {{targetPlayer}}. Value improvement: +{{valueIncrease}}%. Win probability increase: +{{winProbIncrease}}%',
        variables: ['yourPlayer', 'targetPlayer', 'valueIncrease', 'winProbIncrease'],
        conditions: ['valueIncrease > 10', 'confidence > 75'],
        priority: 'medium',
        channels: ['push', 'in_app'],
        active: true
      },
      {
        id: 'waiver_urgent',
        type: 'waiver_recommendation',
        title: '🎯 Must-Pickup Player Available',
        message: '{{playerName}} is available on waivers! Projected to outscore your {{position}} by {{projectedGain}} points. Pickup priority: {{priority}}',
        variables: ['playerName', 'position', 'projectedGain', 'priority'],
        conditions: ['projectedGain > 5', 'priority = high'],
        priority: 'high',
        channels: ['push', 'in_app', 'websocket'],
        active: true
      },
      {
        id: 'lineup_reminder_smart',
        type: 'lineup_reminder',
        title: '⚡ Lineup Optimization Alert',
        message: 'Your lineup isn\'t optimized! Start {{suggestedStarts}} and bench {{suggestedBench}} for +{{projectedGain}} points',
        variables: ['suggestedStarts', 'suggestedBench', 'projectedGain'],
        conditions: ['projectedGain > 3', 'gameTime < 2 hours'],
        priority: 'high',
        channels: ['push', 'in_app'],
        active: true
      },
      {
        id: 'weather_impact',
        type: 'weather_alert',
        title: '🌩️ Weather Impact Alert',
        message: 'Severe weather expected for {{gameLocation}}. Your players affected: {{affectedPlayers}}. Consider alternatives.',
        variables: ['gameLocation', 'affectedPlayers', 'weatherCondition'],
        conditions: ['weatherSeverity = high', 'hasAffectedPlayers = true'],
        priority: 'medium',
        channels: ['push', 'in_app'],
        active: true
      },
      {
        id: 'breaking_news_impact',
        type: 'breaking_news',
        title: '📰 Fantasy Impact News',
        message: '{{headline}} - Fantasy Impact: {{impact}}. Affected players: {{players}}',
        variables: ['headline', 'impact', 'players'],
        conditions: ['fantasyRelevance = high', 'hasOwnedPlayers = true'],
        priority: 'high',
        channels: ['push', 'in_app', 'websocket'],
        active: true
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });

    console.log(`✅ Loaded ${templates.length} notification templates`);
  }

  private startNotificationProcessor(): void {
    this.processingInterval = setInterval(async () => {
      await this.processNotificationQueue();
    }, 5000); // Process every 5 seconds

    console.log('✅ Notification processor started');
  }

  // Core notification creation and processing
  async createNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, any>,
    templateId?: string
  ): Promise<SmartNotification | null> {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      
      // Check if user wants this type of notification
      if (!preferences.types[type]?.enabled) {
        return null;
      }

      // Calculate relevance score
      const relevanceScore = await this.calculateRelevanceScore(userId, type, data);
      
      // Check if relevance meets minimum threshold
      if (relevanceScore < preferences.filters.minimumRelevanceScore) {
        console.log(`Notification filtered out: relevance ${relevanceScore} below threshold ${preferences.filters.minimumRelevanceScore}`);
        return null;
      }

      // Get template or create custom notification
      const template = templateId ? this.templates.get(templateId) : this.findBestTemplate(type, data);
      
      if (!template) {
        console.error(`No template found for notification type: ${type}`);
        return null;
      }

      // Generate personalized content
      const { title, message } = await this.personalizeContent(template, data, userId);

      // Determine optimal channels
      const channels = this.selectOptimalChannels(userId, type, template.priority);

      // Create notification
      const notification: SmartNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        priority: template.priority,
        title,
        message,
        data,
        channels,
        timing: {
          timeZone: preferences.quietHours.timeZone,
          deliveryWindow: this.getOptimalDeliveryWindow(userId, type)
        },
        personalization: {
          relevanceScore,
          userPreferences: preferences.personalization.interests,
          contextualFactors: await this.getContextualFactors(userId, type, data)
        },
        delivery: {
          sent: false,
          deliveredChannels: [],
          failedChannels: []
        },
        triggers: this.createTriggers(template, data),
        createdAt: new Date()
      };

      // Add to queue for processing
      this.notificationQueue.push(notification);
      
      console.log(`📱 Notification created: ${type} for user ${userId} (relevance: ${relevanceScore})`);
      return notification;

    } catch (error) {
      console.error('Notification creation error:', error);
      return null;
    }
  }

  // Smart notification triggers for various events
  async onPlayerScoreUpdate(
    playerId: string, 
    points: number, 
    gameData: any
  ): Promise<void> {
    try {
      // Find all users who own this player
      const ownersResult = await database.query(`
        SELECT DISTINCT r.team_id, t.owner_id, u.id as user_id, u.username
        FROM rosters r
        JOIN teams t ON r.team_id = t.id
        JOIN users u ON t.owner_id = u.id
        WHERE r.player_id = $1 AND r.is_starter = true
      `, [playerId]);

      const owners = ownersResult.rows;

      // Get player details
      const playerResult = await database.query(`
        SELECT first_name, last_name, position, team 
        FROM nfl_players 
        WHERE id = $1
      `, [playerId]);

      if (playerResult.rows.length === 0) return;
      const player = playerResult.rows[0];
      const playerName = `${player.first_name} ${player.last_name}`;

      // Create notifications for each owner
      for (const owner of owners) {
        // Get current team score
        const teamScore = await this.getCurrentTeamScore(owner.team_id);
        
        await this.createNotification(
          owner.user_id,
          'score_update',
          {
            playerId,
            playerName,
            position: player.position,
            team: player.team,
            points,
            teamScore,
            gameData,
            isOwnedPlayer: true
          },
          points >= 6 ? 'score_update_critical' : undefined
        );
      }

      console.log(`📊 Score update notifications sent for ${playerName}: ${points} points`);

    } catch (error) {
      console.error('Player score update notification error:', error);
    }
  }

  async onInjuryReport(
    playerId: string,
    injuryData: {
      type: string;
      severity: 'minor' | 'moderate' | 'major' | 'season_ending';
      expectedReturn?: string;
      description: string;
    }
  ): Promise<void> {
    try {
      // Get player details
      const playerResult = await database.query(`
        SELECT first_name, last_name, position, team 
        FROM nfl_players 
        WHERE id = $1
      `, [playerId]);

      if (playerResult.rows.length === 0) return;
      const player = playerResult.rows[0];
      const playerName = `${player.first_name} ${player.last_name}`;

      // Find owners and users with this player in favorites
      const interestedUsersResult = await database.query(`
        SELECT DISTINCT u.id as user_id, u.username,
               CASE WHEN r.player_id IS NOT NULL THEN true ELSE false END as is_owned,
               CASE WHEN f.player_id IS NOT NULL THEN true ELSE false END as is_favorite
        FROM users u
        LEFT JOIN teams t ON u.id = t.owner_id
        LEFT JOIN rosters r ON t.id = r.team_id AND r.player_id = $1
        LEFT JOIN user_favorite_players f ON u.id = f.user_id AND f.player_id = $1
        WHERE r.player_id IS NOT NULL OR f.player_id IS NOT NULL
      `, [playerId]);

      const interestedUsers = interestedUsersResult.rows;

      // Create notifications
      for (const user of interestedUsers) {
        await this.createNotification(
          user.user_id,
          'injury_news',
          {
            playerId,
            playerName,
            team: player.team,
            position: player.position,
            injuryType: injuryData.type,
            severity: injuryData.severity,
            expectedReturn: injuryData.expectedReturn || 'Unknown',
            description: injuryData.description,
            isOwnedPlayer: user.is_owned,
            isFavoritePlayer: user.is_favorite
          },
          injuryData.severity === 'major' || injuryData.severity === 'season_ending' 
            ? 'injury_alert_major' 
            : undefined
        );
      }

      console.log(`🚨 Injury notifications sent for ${playerName}: ${injuryData.severity} ${injuryData.type}`);

    } catch (error) {
      console.error('Injury notification error:', error);
    }
  }

  async onTradeOpportunityDetected(
    userId: string,
    tradeData: {
      yourPlayer: string;
      targetPlayer: string;
      targetTeamId: string;
      valueImprovement: number;
      winProbabilityIncrease: number;
      confidence: number;
      reasoning: string;
    }
  ): Promise<void> {
    try {
      await this.createNotification(
        userId,
        'trade_opportunity',
        {
          ...tradeData,
          valueIncrease: Math.round(tradeData.valueImprovement),
          winProbIncrease: Math.round(tradeData.winProbabilityIncrease)
        },
        'trade_opportunity_smart'
      );

      console.log(`🤝 Trade opportunity notification sent to user ${userId}`);

    } catch (error) {
      console.error('Trade opportunity notification error:', error);
    }
  }

  async onWaiverRecommendation(
    userId: string,
    recommendationData: {
      playerId: string;
      playerName: string;
      position: string;
      projectedImprovement: number;
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
      dropCandidates: string[];
    }
  ): Promise<void> {
    try {
      await this.createNotification(
        userId,
        'waiver_recommendation',
        {
          ...recommendationData,
          projectedGain: Math.round(recommendationData.projectedImprovement)
        },
        recommendationData.priority === 'high' ? 'waiver_urgent' : undefined
      );

      console.log(`🎯 Waiver recommendation sent to user ${userId}: ${recommendationData.playerName}`);

    } catch (error) {
      console.error('Waiver recommendation notification error:', error);
    }
  }

  async onLineupOptimizationNeeded(
    userId: string,
    optimizationData: {
      teamId: string;
      suggestedChanges: Array<{
        action: 'start' | 'bench';
        playerId: string;
        playerName: string;
        currentPoints: number;
        projectedPoints: number;
      }>;
      totalImprovement: number;
      deadline: Date;
    }
  ): Promise<void> {
    try {
      const suggestedStarts = optimizationData.suggestedChanges
        .filter(c => c.action === 'start')
        .map(c => c.playerName)
        .join(', ');

      const suggestedBench = optimizationData.suggestedChanges
        .filter(c => c.action === 'bench')
        .map(c => c.playerName)
        .join(', ');

      await this.createNotification(
        userId,
        'lineup_reminder',
        {
          teamId: optimizationData.teamId,
          suggestedStarts,
          suggestedBench,
          projectedGain: Math.round(optimizationData.totalImprovement),
          deadline: optimizationData.deadline.toISOString(),
          changes: optimizationData.suggestedChanges
        },
        'lineup_reminder_smart'
      );

      console.log(`⚡ Lineup optimization notification sent to user ${userId}`);

    } catch (error) {
      console.error('Lineup optimization notification error:', error);
    }
  }

  async onWeatherAlert(
    gameId: string,
    weatherData: {
      location: string;
      conditions: string;
      severity: 'low' | 'medium' | 'high';
      windSpeed: number;
      precipitation: number;
      temperature: number;
    }
  ): Promise<void> {
    try {
      // Find players in this game
      const playersResult = await database.query(`
        SELECT DISTINCT p.id, p.first_name, p.last_name, p.position
        FROM nfl_players p
        JOIN nfl_games g ON (p.team = g.home_team OR p.team = g.away_team)
        WHERE g.id = $1
      `, [gameId]);

      const players = playersResult.rows;
      
      // Find users with players in this game
      const affectedUsersResult = await database.query(`
        SELECT DISTINCT u.id as user_id, u.username,
               array_agg(DISTINCT p.first_name || ' ' || p.last_name) as player_names
        FROM users u
        JOIN teams t ON u.id = t.owner_id
        JOIN rosters r ON t.id = r.team_id
        JOIN nfl_players p ON r.player_id = p.id
        JOIN nfl_games g ON (p.team = g.home_team OR p.team = g.away_team)
        WHERE g.id = $1 AND r.is_starter = true
        GROUP BY u.id, u.username
      `, [gameId]);

      const affectedUsers = affectedUsersResult.rows;

      // Send notifications
      for (const user of affectedUsers) {
        await this.createNotification(
          user.user_id,
          'weather_alert',
          {
            gameId,
            gameLocation: weatherData.location,
            weatherCondition: weatherData.conditions,
            weatherSeverity: weatherData.severity,
            windSpeed: weatherData.windSpeed,
            precipitation: weatherData.precipitation,
            temperature: weatherData.temperature,
            affectedPlayers: user.player_names.join(', '),
            hasAffectedPlayers: true
          },
          'weather_impact'
        );
      }

      console.log(`🌩️ Weather notifications sent for ${weatherData.location}`);

    } catch (error) {
      console.error('Weather alert notification error:', error);
    }
  }

  // Notification processing and delivery
  private async processNotificationQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) return;

    const now = new Date();
    const readyNotifications = this.notificationQueue.filter(notification => {
      // Check if notification is ready to send
      if (notification.timing.scheduledFor && notification.timing.scheduledFor > now) {
        return false;
      }

      // Check if notification has expired
      if (notification.timing.expiresAt && notification.timing.expiresAt < now) {
        return false;
      }

      // Check quiet hours
      if (!this.isWithinDeliveryWindow(notification)) {
        return false;
      }

      return !notification.delivery.sent;
    });

    // Process ready notifications
    for (const notification of readyNotifications) {
      await this.deliverNotification(notification);
    }

    // Remove processed and expired notifications
    this.notificationQueue = this.notificationQueue.filter(notification => 
      !notification.delivery.sent && 
      (!notification.timing.expiresAt || notification.timing.expiresAt > now)
    );
  }

  private async deliverNotification(notification: SmartNotification): Promise<void> {
    try {
      const deliveryResults: { channel: NotificationChannel; success: boolean }[] = [];

      // Send through each specified channel
      for (const channel of notification.channels) {
        try {
          let success = false;

          switch (channel) {
            case 'push':
              success = await this.pushService.send(notification);
              break;
            case 'email':
              success = await this.emailService.send(notification);
              break;
            case 'sms':
              success = await this.smsService.send(notification);
              break;
            case 'in_app':
              success = await this.sendInAppNotification(notification);
              break;
            case 'websocket':
              success = await this.sendWebSocketNotification(notification);
              break;
          }

          deliveryResults.push({ channel, success });

          if (success) {
            notification.delivery.deliveredChannels.push(channel);
          } else {
            notification.delivery.failedChannels.push(channel);
          }

        } catch (error) {
          console.error(`Notification delivery failed on ${channel}:`, error);
          notification.delivery.failedChannels.push(channel);
        }
      }

      // Update delivery status
      notification.delivery.sent = true;
      notification.delivery.sentAt = new Date();

      // Store in database
      await this.storeNotification(notification);

      // Log delivery
      console.log(`📱 Notification delivered: ${notification.id} (${notification.delivery.deliveredChannels.length}/${notification.channels.length} channels successful)`);

    } catch (error) {
      console.error('Notification delivery error:', error);
    }
  }

  private async sendInAppNotification(notification: SmartNotification): Promise<boolean> {
    try {
      // Store in database for in-app display
      await database.query(`
        INSERT INTO user_notifications (
          id, user_id, type, title, message, data, priority, 
          read, created_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW(), $8)
      `, [
        notification.id,
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data),
        notification.priority,
        notification.timing.expiresAt
      ]);

      return true;
    } catch (error) {
      console.error('In-app notification error:', error);
      return false;
    }
  }

  private async sendWebSocketNotification(notification: SmartNotification): Promise<boolean> {
    try {
      // Send real-time notification via WebSocket
      webSocketManager.broadcastPlayerUpdate({
        type: 'notification',
        userId: notification.userId,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          data: notification.data
        },
        timestamp: new Date()
      });

      return true;
    } catch (error) {
      console.error('WebSocket notification error:', error);
      return false;
    }
  }

  // Personalization and optimization methods
  private async calculateRelevanceScore(
    userId: string,
    type: NotificationType,
    data: Record<string, any>
  ): Promise<number> {
    let score = 50; // Base score

    try {
      const preferences = await this.getUserPreferences(userId);

      // Check if it's about owned players
      if (data.isOwnedPlayer) {
        score += 30;
      }

      // Check if it's about favorite players/teams
      if (data.isFavoritePlayer || preferences.personalization.favoriteTeams.includes(data.team)) {
        score += 20;
      }

      // Type-specific scoring
      switch (type) {
        case 'injury_news':
          if (data.severity === 'major' || data.severity === 'season_ending') {
            score += 25;
          }
          break;
        case 'score_update':
          if (data.points >= 6) { // Touchdown or more
            score += 20;
          }
          break;
        case 'trade_opportunity':
          if (data.confidence > 80) {
            score += 15;
          }
          break;
        case 'lineup_reminder':
          if (data.projectedGain > 5) {
            score += 20;
          }
          break;
      }

      // Recent interaction bonus
      const recentInteraction = await this.getRecentInteractionScore(userId, type);
      score += recentInteraction;

      return Math.min(100, Math.max(0, score));

    } catch (error) {
      console.error('Relevance score calculation error:', error);
      return 50; // Default score
    }
  }

  private async personalizeContent(
    template: NotificationTemplate,
    data: Record<string, any>,
    userId: string
  ): Promise<{ title: string; message: string }> {
    let title = template.title;
    let message = template.message;

    // Replace template variables
    for (const variable of template.variables) {
      const value = data[variable] || '';
      const placeholder = `{{${variable}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), value);
      message = message.replace(new RegExp(placeholder, 'g'), value);
    }

    // Add personalization based on user behavior
    const preferences = await this.getUserPreferences(userId);
    
    // Adjust tone based on user preferences
    if (preferences.personalization.interests.includes('detailed_analysis')) {
      // Add more technical details for analytical users
      if (data.confidence && data.projectedGain) {
        message += ` (Confidence: ${data.confidence}%)`;
      }
    }

    return { title, message };
  }

  private selectOptimalChannels(
    userId: string,
    type: NotificationType,
    priority: NotificationPriority
  ): NotificationChannel[] {
    // This would use ML to determine optimal channels based on user behavior
    // For now, using rule-based logic

    const baseChannels: NotificationChannel[] = ['in_app'];

    // Add push for high-priority notifications
    if (priority === 'high' || priority === 'critical') {
      baseChannels.push('push', 'websocket');
    }

    // Add email for critical notifications
    if (priority === 'critical') {
      baseChannels.push('email');
    }

    // Type-specific channel selection
    switch (type) {
      case 'score_update':
        baseChannels.push('websocket'); // Real-time updates
        break;
      case 'lineup_reminder':
        baseChannels.push('push'); // Time-sensitive
        break;
    }

    return [...new Set(baseChannels)]; // Remove duplicates
  }

  private getOptimalDeliveryWindow(userId: string, type: NotificationType): { start: string; end: string } | undefined {
    // This would use ML to determine when user is most likely to engage
    // For now, return general windows

    switch (type) {
      case 'lineup_reminder':
        return { start: '09:00', end: '11:00' }; // Morning reminder
      case 'score_update':
        return undefined; // Send immediately
      case 'trade_opportunity':
        return { start: '18:00', end: '22:00' }; // Evening when users are active
      default:
        return undefined;
    }
  }

  private isWithinDeliveryWindow(notification: SmartNotification): boolean {
    // Check quiet hours and delivery windows
    // Simplified implementation
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // Allow critical notifications to bypass quiet hours
    if (notification.priority === 'critical') {
      return true;
    }

    // Check delivery window if specified
    if (notification.timing.deliveryWindow) {
      const { start, end } = notification.timing.deliveryWindow;
      return timeString >= start && timeString <= end;
    }

    // Check if within reasonable hours (7 AM - 10 PM)
    return hour >= 7 && hour <= 22;
  }

  // User preference management
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    if (this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId)!;
    }

    try {
      const result = await database.query(`
        SELECT notification_preferences, timezone, favorite_teams, favorite_players
        FROM users
        WHERE id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return this.getDefaultPreferences(userId);
      }

      const user = result.rows[0];
      const preferences: NotificationPreferences = {
        userId,
        channels: {
          push: true,
          email: true,
          sms: false,
          inApp: true
        },
        types: this.getDefaultTypePreferences(),
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '07:00',
          timeZone: user.timezone || 'America/New_York',
          emergency: true
        },
        filters: {
          minimumRelevanceScore: 40,
          onlyOwnedPlayers: false,
          gameTimeOnly: false,
          excludeWeekends: false
        },
        personalization: {
          favoriteTeams: user.favorite_teams || [],
          favoritePlayerIds: user.favorite_players || [],
          leagueIds: [],
          interests: ['scores', 'injuries', 'trades']
        },
        ...user.notification_preferences
      };

      this.userPreferences.set(userId, preferences);
      return preferences;

    } catch (error) {
      console.error('Error loading user preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      channels: {
        push: true,
        email: false,
        sms: false,
        inApp: true
      },
      types: this.getDefaultTypePreferences(),
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00',
        timeZone: 'America/New_York',
        emergency: true
      },
      filters: {
        minimumRelevanceScore: 50,
        onlyOwnedPlayers: true,
        gameTimeOnly: false,
        excludeWeekends: false
      },
      personalization: {
        favoriteTeams: [],
        favoritePlayerIds: [],
        leagueIds: [],
        interests: []
      }
    };
  }

  private getDefaultTypePreferences(): NotificationPreferences['types'] {
    const types: NotificationType[] = [
      'score_update', 'player_alert', 'injury_news', 'trade_opportunity',
      'waiver_recommendation', 'lineup_reminder', 'matchup_insight',
      'breaking_news', 'weather_alert', 'game_event', 'social_update'
    ];

    const defaultTypes: NotificationPreferences['types'] = {} as any;

    types.forEach(type => {
      defaultTypes[type] = {
        enabled: true,
        priority: 'medium',
        channels: ['push', 'in_app'],
        frequency: 'immediate'
      };
    });

    return defaultTypes;
  }

  // Helper methods
  private async getCurrentTeamScore(teamId: string): Promise<number> {
    try {
      const result = await database.query(`
        SELECT COALESCE(SUM(ps.fantasy_points), 0) as total_score
        FROM rosters r
        JOIN player_stats ps ON r.player_id = ps.player_id
        WHERE r.team_id = $1 AND r.is_starter = true
        AND ps.week = (SELECT MAX(week) FROM player_stats WHERE season_year = 2025)
        AND ps.season_year = 2025
      `, [teamId]);

      return parseFloat(result.rows[0]?.total_score || '0');
    } catch (error) {
      console.error('Error getting team score:', error);
      return 0;
    }
  }

  private async getRecentInteractionScore(userId: string, type: NotificationType): Promise<number> {
    try {
      const result = await database.query(`
        SELECT AVG(
          CASE 
            WHEN interaction_type = 'acted_upon' THEN 10
            WHEN interaction_type = 'opened' THEN 5
            WHEN interaction_type = 'dismissed' THEN -2
            ELSE 0
          END
        ) as avg_score
        FROM user_notifications
        WHERE user_id = $1 AND type = $2 
        AND created_at > NOW() - INTERVAL '7 days'
      `, [userId, type]);

      return parseFloat(result.rows[0]?.avg_score || '0');
    } catch (error) {
      console.error('Error calculating interaction score:', error);
      return 0;
    }
  }

  private async getContextualFactors(
    userId: string,
    type: NotificationType,
    data: Record<string, any>
  ): Promise<string[]> {
    const factors: string[] = [];

    // Add contextual factors based on notification type and data
    if (data.isOwnedPlayer) factors.push('owned_player');
    if (data.isFavoritePlayer) factors.push('favorite_player');
    if (data.gameTimeClose) factors.push('game_time_approaching');
    if (data.highConfidence) factors.push('high_confidence');

    return factors;
  }

  private createTriggers(template: NotificationTemplate, data: Record<string, any>): NotificationTrigger[] {
    return template.conditions.map(condition => ({
      type: 'condition' as const,
      condition,
      value: true
    }));
  }

  private findBestTemplate(type: NotificationType, data: Record<string, any>): NotificationTemplate | undefined {
    const templates = Array.from(this.templates.values())
      .filter(template => template.type === type && template.active);

    // Return first matching template (could be enhanced with better matching logic)
    return templates[0];
  }

  private async storeNotification(notification: SmartNotification): Promise<void> {
    try {
      await database.query(`
        INSERT INTO notification_log (
          id, user_id, type, title, message, data, priority,
          channels, delivery_status, relevance_score, created_at, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        notification.id,
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        JSON.stringify(notification.data),
        notification.priority,
        JSON.stringify(notification.channels),
        JSON.stringify(notification.delivery),
        notification.personalization.relevanceScore,
        notification.createdAt,
        notification.delivery.sentAt
      ]);
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  // Public API methods
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const currentPrefs = await this.getUserPreferences(userId);
      const updatedPrefs = { ...currentPrefs, ...preferences };
      
      await database.query(`
        UPDATE users 
        SET notification_preferences = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(updatedPrefs), userId]);

      this.userPreferences.set(userId, updatedPrefs);
      
      console.log(`✅ Updated notification preferences for user: ${userId}`);
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<SmartNotification[]> {
    try {
      const result = await database.query(`
        SELECT * FROM user_notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        priority: row.priority,
        title: row.title,
        message: row.message,
        data: JSON.parse(row.data),
        channels: [],
        timing: { timeZone: 'UTC' },
        personalization: { relevanceScore: 0, userPreferences: [], contextualFactors: [] },
        delivery: { sent: true, sentAt: row.created_at, deliveredChannels: [], failedChannels: [] },
        triggers: [],
        createdAt: new Date(row.created_at)
      }));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    try {
      await database.query(`
        UPDATE user_notifications 
        SET read = true, read_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [notificationId, userId]);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async getNotificationAnalytics(userId: string, days: number = 30): Promise<NotificationAnalytics | null> {
    try {
      const cacheKey = `analytics_${userId}_${days}`;
      if (this.analyticsCache.has(cacheKey)) {
        return this.analyticsCache.get(cacheKey)!;
      }

      // Calculate analytics (implementation would be more comprehensive)
      const analytics: NotificationAnalytics = {
        userId,
        period: {
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          end: new Date()
        },
        stats: {
          totalSent: 0,
          byChannel: {} as any,
          byType: {} as any,
          byPriority: {} as any,
          openRate: 0,
          actionRate: 0,
          dismissalRate: 0
        },
        engagement: {
          bestPerformingTypes: [],
          preferredChannels: [],
          optimalSendTimes: [],
          responsePatterns: {}
        },
        optimization: {
          recommendedFrequency: {} as any,
          suggestedChannels: [],
          relevanceThreshold: 50
        }
      };

      this.analyticsCache.set(cacheKey, analytics);
      return analytics;

    } catch (error) {
      console.error('Error calculating notification analytics:', error);
      return null;
    }
  }

  // Cleanup method
  async shutdown(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    await Promise.all([
      this.pushService.shutdown(),
      this.emailService.shutdown(),
      this.smsService.shutdown()
    ]);

    console.log('🔄 Intelligent Notification System shutdown complete');
  }
}

// External service classes (simplified implementations)
class PushNotificationService {
  async initialize(): Promise<void> {
    console.log('✅ Push notification service initialized');
  }

  async send(notification: SmartNotification): Promise<boolean> {
    // Would integrate with Firebase, APNs, etc.
    console.log(`📱 Push notification sent: ${notification.title}`);
    return true;
  }

  async shutdown(): Promise<void> {
    console.log('Push notification service shutdown');
  }
}

class EmailNotificationService {
  async initialize(): Promise<void> {
    console.log('✅ Email notification service initialized');
  }

  async send(notification: SmartNotification): Promise<boolean> {
    // Would integrate with SendGrid, AWS SES, etc.
    console.log(`📧 Email notification sent: ${notification.title}`);
    return true;
  }

  async shutdown(): Promise<void> {
    console.log('Email notification service shutdown');
  }
}

class SMSNotificationService {
  async initialize(): Promise<void> {
    console.log('✅ SMS notification service initialized');
  }

  async send(notification: SmartNotification): Promise<boolean> {
    // Would integrate with Twilio, AWS SNS, etc.
    console.log(`📱 SMS notification sent: ${notification.title}`);
    return true;
  }

  async shutdown(): Promise<void> {
    console.log('SMS notification service shutdown');
  }
}

// Singleton instance
export const intelligentNotifications = new IntelligentNotificationSystem();
export default intelligentNotifications;