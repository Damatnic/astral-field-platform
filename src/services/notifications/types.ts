/**
 * Comprehensive Notification System Types
 * Defines all interfaces and types for the intelligent notification system
 */

// Core notification types
export type NotificationType = 
  | 'trade_proposal'
  | 'trade_accepted' 
  | 'trade_rejected'
  | 'trade_vetoed'
  | 'trade_expired'
  | 'waiver_won'
  | 'waiver_lost'
  | 'waiver_outbid'
  | 'lineup_reminder'
  | 'lineup_deadline'
  | 'player_injury'
  | 'player_news'
  | 'player_promotion'
  | 'game_start'
  | 'score_update'
  | 'close_matchup'
  | 'matchup_won'
  | 'matchup_lost'
  | 'weekly_recap'
  | 'draft_reminder'
  | 'draft_pick'
  | 'breaking_news'
  | 'weather_alert'
  | 'league_message'
  | 'achievement_unlocked'
  | 'milestone_reached'
  | 'system_maintenance'
  | 'custom';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'websocket' | 'in_app' | 'all';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'expired';

export type NotificationTrigger = 
  | 'real_time' 
  | 'scheduled' 
  | 'threshold_based' 
  | 'user_action'
  | 'system_event'
  | 'ai_prediction';

// Core notification interface
export interface Notification { id: string,type: NotificationType,
    title, string,
  message, string,
  shortMessage?, string, // For SMS/condensed formats;
  richContent?, RichContent,
  data? : Record<string, any>;
  userId, string,
  leagueId?, string,
  teamId?, string,
  playerId?, string,
  priority, NotificationPriority,
    channels: NotificationChannel[];
  trigger, NotificationTrigger,
    status, NotificationStatus,
  createdAt, string,
  scheduledAt?, string,
  sentAt?, string,
  deliveredAt?, string,
  readAt?, string,
  expiresAt?, string,
  actionUrl?, string,
  actions?, NotificationAction[];
  metadata?, NotificationMetadata,
  personalization?, PersonalizationData,
  analytics?, NotificationAnalytics,
  
}
// Rich content for enhanced notifications
export interface RichContent {
  html?, string,
  imageUrl?, string,
  thumbnailUrl?, string,
  videoUrl?, string,
  attachments? : Attachment[];
  embeds?: Embed[];
  buttons?: ActionButton[];
  
}
export interface Attachment { id: string, type: 'image' | 'document' | 'video',
    url, string,
  filename, string,
    size, number,
  mimeType: string,
  
}
export interface Embed {
  type: 'player_card' | 'matchup_preview' | 'trade_summary' | 'chart',
    data: Record<string, any>;
  
}
export interface ActionButton { id: string,
    text, string,
  url?, string,
  action?, string,
  style: 'primary' | 'secondary' | 'danger' | 'success',
  
}
// Notification actions
export interface NotificationAction { id: string,
    label, string,
  action, string,
  url?, string,
  icon?, string,
  style: 'default' | 'primary' | 'danger' | 'success';
  requiresConfirmation?, boolean,
  
}
// Metadata for tracking and context
export interface NotificationMetadata { source: string,
    version, string,
  correlationId?, string,
  campaignId?, string,
  segmentId?, string,
  experimentId?, string,
  retryCount?, number,
  originalChannel?, NotificationChannel,
  fallbackChannels? : NotificationChannel[];
  deliveryAttempts?: DeliveryAttempt[];
  
}
export interface DeliveryAttempt { channel: NotificationChannel, timestamp, string,
  success, boolean,
  error?, string,
  latency?, number,
  
}
// Personalization data
export interface PersonalizationData { userSegment: string,
    preferredChannel, NotificationChannel,
  timezone, string,
    locale, string,
  engagement: { openRate: number,
    clickRate, number,
    responseRate: number,
  }
  context: {
  deviceType: 'mobile' | 'desktop' | 'tablet';
    location?, string,
    activeLeagues: string[],
    favoriteTeams: string[];
    playingToday, boolean,
    isOnline: boolean,
  }
}

// Analytics and tracking
export interface NotificationAnalytics { impressions: number,
    opens, number,
  clicks, number,
    conversions, number,
  shares, number,
    reactions: Reaction[];
  sentiment? : 'positive' | 'negative' | 'neutral';
  engagementScore, number,
  feedbackScore?, number,
  
}
export interface Reaction { type: 'string',
    userId, string,
  timestamp: string,
  
}
// User preferences
export interface NotificationPreferences { userId: string,
    enabled, boolean,
  channels: { push: ChannelPreference,
    email, ChannelPreference,
    sms, ChannelPreference,
    websocket, ChannelPreference,
    in_app: ChannelPreference,
  }
  types: Record<NotificationType, TypePreference>;
  scheduling, SchedulingPreference,
    frequency, FrequencyPreference,
  content, ContentPreference,
    privacy, PrivacyPreference,
  ai: AIPreference,
}

export interface ChannelPreference { enabled: boolean,
    priority, number, // 1-5, higher  = preferred;
  allowedPriorities: NotificationPriority[],
    quietHours, QuietHours,
  format: 'minimal' | 'standard' | 'rich',
    deliverySpeed: 'immediate' | 'batched' | 'scheduled',
  
}
export interface TypePreference { enabled: boolean,
    channels: NotificationChannel[];
  minPriority, NotificationPriority,
    frequency: 'always' | 'important_only' | 'digest' | 'never';
  customRules?, CustomRule[];
  
}
export interface SchedulingPreference { timezone: string,
    quietHours, QuietHours,
  gameDayMode, GameDayMode,
    workingHours, WorkingHours,
  weekendMode: 'same' | 'more_relaxed' | 'disabled',
  
}
export interface QuietHours { enabled: boolean,
    start, string, // "22: 00",
    end, string,   // "08: 00",
    allowUrgent, boolean,
  allowGameDay: boolean,
  
}
export interface GameDayMode { enabled: boolean,
    frequency: 'minimal' | 'normal' | 'frequent' | 'maximum';
  onlyMyPlayers, boolean,
    onlyCloseGames, boolean,
  scoreThreshold: number,
  
}
export interface WorkingHours { enabled: boolean,
    start, string,
  end, string,
    allowImportant, boolean,
  batchNonUrgent: boolean,
  
}
export interface FrequencyPreference { maxPerHour: number,
    maxPerDay, number,
  digestMode, boolean,
    digestFrequency: 'hourly' | 'daily' | 'weekly';
  intelligentBatching: boolean,
  
}
export interface ContentPreference { language: string,
    tone: 'professional' | 'casual' | 'enthusiastic' | 'minimal';
  includeEmojis, boolean,
    includeImages, boolean,
  includeStats, boolean,
    includeAnalysis, boolean,
  personalization: 'high' | 'medium' | 'low' | 'none',
  
}
export interface PrivacyPreference { allowAnalytics: boolean,
    allowPersonalization, boolean,
  allowSharing, boolean,
    dataRetention, number, // days;
  anonymizeData: boolean,
  
}
export interface AIPreference { enabled: boolean,
    smartFiltering, boolean,
  predictiveTiming, boolean,
    contentOptimization, boolean,
  channelOptimization, boolean,
    learningFromBehavior, boolean,
  privacyMode: 'full' | 'limited' | 'none',
  
}
export interface CustomRule { id: string,
    name, string,
  conditions: RuleCondition[],
    actions: RuleAction[];
  enabled: boolean,
  
}
export interface RuleCondition { field: string,
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value, any,
  logic? : 'and' | 'or';
  
}
export interface RuleAction {
  type: 'allow' | 'block' | 'delay' | 'redirect' | 'modify' : parameters: Record<string, any>;
  
}
// Template system
export interface NotificationTemplate { id: string,type: NotificationType,
    name, string,
  version, string,
    channels: Record<NotificationChannel, ChannelTemplate>;
  variables: TemplateVariable[];
  conditions? : TemplateCondition[];
  analytics: { usage: number, performance, number,
    feedback: number,
  }
  createdAt, string,
    updatedAt: string,
}

export interface ChannelTemplate {
  subject?, string, // For email/push;
  title, string,
    body, string,
  shortBody?, string, // For SMS;
  htmlBody?, string, // For email;
  actions? : TemplateAction[];
  styling? : TemplateStyle,
  
}
export interface TemplateVariable { name: string,type: 'string' | 'number' | 'date' | 'boolean' | 'object',
    required, boolean,
  defaultValue?, any,
  description: string,
  
}
export interface TemplateCondition { variable: string,
    operator, string,
  value, any,
    template: string,
  
}
export interface TemplateAction { id: string,
    text, string,
  url?, string,
  action?, string,
  style: string,
  
}
export interface TemplateStyle {
  primaryColor?, string,
  backgroundColor?, string,
  textColor?, string,
  fontSize?, string,
  fontFamily?, string,
  
}
// Delivery system
export interface DeliveryConfig { retryAttempts: number,
    retryDelay, number,
  timeoutMs, number,
    batchSize, number,
  rateLimit: { maxPerSecond: number,
    maxPerMinute, number,
    maxPerHour: number,
  }
  fallbackChannels: NotificationChannel[],
    priority: {
    [key in NotificationPriority]: { maxDelay: number,
    retryAttempts: number,
    }
  }
}

export interface DeliveryResult { notificationId: string,
    channel, NotificationChannel,
  success, boolean,
    timestamp, string,
  latency, number,
  error?, string,
  metadata? : Record<string, any>;
  
}
// AI and ML types
export interface AIContext {
  user: { id: string,
    segment, string,
    behavior, UserBehavior,
    preferences: NotificationPreferences,
  }
  notification: { typ: e: 'NotificationType';
    priority, NotificationPriority,
    content, string,
    context: Record<string, any>;
  }
  environment: { timestamp: string,
    timeZone, string,
    gameDay, boolean,
    userOnline, boolean,
    deviceType: string,
  }
}

export interface UserBehavior {
  engagementPatterns: EngagementPattern[],
    optimalTiming: TimeSlot[];
  preferredChannels: ChannelPreference[],
    responseHistory: ResponseHistory[];
  contentPreferences: ContentInsight[],
  
}
export interface EngagementPattern { timeOfDay: string,
    dayOfWeek, string,
  notificationType, NotificationType,
    engagementRate, number,
  averageResponseTime: number,
  
}
export interface TimeSlot { start: string,
    end, string,
  likelihood, number,
    channel: NotificationChannel,
  
}
export interface ResponseHistory { notificationId: string,
    responseTime, number,
  action, string,
    satisfaction: number,
  
}
export interface ContentInsight { keyword: string,
    sentiment, number,
  engagement, number,
    frequency: number,
  
}
// Event system
export interface NotificationEvent {
  type: 'created' | 'sent' | 'delivered' | 'read' | 'clicked' | 'failed',
    notificationId, string,
  userId, string,
    timestamp, string,
  data? : Record<string, any>;
  
}
export interface NotificationListener { id: string,
    events: NotificationEvent['type'][];
  callback: (event; NotificationEvent)  => void | Promise<void>;
  
}
// Queue system
export interface NotificationQueue { id: string,
    name, string,
  priority, number,
    notifications: QueuedNotification[];
  processing, boolean,
    paused, boolean,
  maxSize, number,
    processors, number,
  
}
export interface QueuedNotification { notification: Notification,
    priority, number,
  attempts, number,
    scheduledAt, string,
  processingStarted?, string,
  
}
// Error handling
export interface NotificationError { id: string,
    notificationId, string,
  channel, NotificationChannel,type: 'validation' | 'delivery' | 'timeout' | 'rate_limit' | 'system',
    message, string,
  stack?, string,
  retryable, boolean,
    timestamp: string,
  
}
// Performance metrics
export interface PerformanceMetrics { deliveryRate: number,
    averageLatency, number,
  errorRate, number,
    engagementRate, number,
  throughput, number,
    queueSize, number,
  processingTime, number,
    memoryUsage, number,
  timestamp: string,
  
}
// Export utility types
export type CreateNotificationInput  = Omit<Notification: 'id' | 'status' | 'createdAt' | 'analytics'>;
export type UpdateNotificationInput = Partial<Pick<Notification: 'status' | 'readAt' | 'deliveredAt'>>;
export type NotificationFilter = Partial<Pick<Notification: 'type' | 'priority' | 'status' | 'userId' | 'leagueId'>>;