import { NextApiRequest, NextApiResponse } from 'next';
import { RealTimeSentimentAnalyzer } from '../../../services/sentiment/realTimeSentimentAnalyzer';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';
import { db } from '../../../db/database';

const analyzer = new RealTimeSentimentAnalyzer();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rateLimitResult = await rateLimitMiddleware(req, res, {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `sentiment:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
  });

  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter
    });
  }

  try {
    const userId = await authenticateUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.method === 'POST') {
      const { action, player, timeframe, alertType, subscriptionData } = req.body;

      switch (action) {
        case 'start_monitoring':
          await analyzer.startRealTimeMonitoring();
          
          return res.status(200).json({
            success: true,
            message: 'Real-time sentiment monitoring started',
            type: 'monitoring_control'
          });

        case 'stop_monitoring':
          await analyzer.stopRealTimeMonitoring();
          
          return res.status(200).json({
            success: true,
            message: 'Real-time sentiment monitoring stopped',
            type: 'monitoring_control'
          });

        case 'subscribe_alerts':
          if (!subscriptionData) {
            return res.status(400).json({ error: 'Subscription data is required' });
          }

          await subscribeToAlerts(userId, subscriptionData);
          
          return res.status(200).json({
            success: true,
            message: 'Successfully subscribed to sentiment alerts',
            type: 'alert_subscription'
          });

        case 'unsubscribe_alerts':
          if (!subscriptionData?.subscriptionId) {
            return res.status(400).json({ error: 'Subscription ID is required' });
          }

          await unsubscribeFromAlerts(userId, subscriptionData.subscriptionId);
          
          return res.status(200).json({
            success: true,
            message: 'Successfully unsubscribed from alerts',
            type: 'alert_unsubscription'
          });

        case 'dismiss_alert':
          if (!req.body.alertId) {
            return res.status(400).json({ error: 'Alert ID is required' });
          }

          await dismissAlert(req.body.alertId, userId);
          
          return res.status(200).json({
            success: true,
            message: 'Alert dismissed',
            type: 'alert_management'
          });

        case 'analyze_custom_content':
          if (!req.body.content) {
            return res.status(400).json({ error: 'Content is required for analysis' });
          }

          const customAnalysis = await analyzeCustomContent(req.body.content, req.body.playerNames);
          
          return res.status(200).json({
            success: true,
            data: customAnalysis,
            type: 'custom_sentiment_analysis'
          });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (req.method === 'GET') {
      const { type, player, hours, limit } = req.query;

      switch (type) {
        case 'current_trends':
          const trends = await analyzer.getCurrentSentimentTrends();
          
          return res.status(200).json({
            success: true,
            data: trends,
            type: 'current_sentiment_trends'
          });

        case 'player_summary':
          if (!player) {
            return res.status(400).json({ error: 'Player name is required' });
          }

          const hoursBack = hours ? parseInt(hours as string) : 24;
          const playerSummary = await analyzer.getPlayerSentimentSummary(player as string, hoursBack);
          
          return res.status(200).json({
            success: true,
            data: playerSummary,
            type: 'player_sentiment_summary'
          });

        case 'trending_topics':
          const timeframe = (req.query.timeframe as string) || '4h';
          const trendingTopics = await getTrendingTopics(timeframe, limit ? parseInt(limit as string) : 20);
          
          return res.status(200).json({
            success: true,
            data: trendingTopics,
            type: 'trending_topics'
          });

        case 'active_alerts':
          const activeAlerts = await getActiveAlerts(userId, limit ? parseInt(limit as string) : 50);
          
          return res.status(200).json({
            success: true,
            data: activeAlerts,
            type: 'active_alerts'
          });

        case 'sentiment_history':
          if (!player) {
            return res.status(400).json({ error: 'Player name is required for sentiment history' });
          }

          const historyHours = hours ? parseInt(hours as string) : 168; // 7 days default
          const history = await getSentimentHistory(player as string, historyHours);
          
          return res.status(200).json({
            success: true,
            data: history,
            type: 'sentiment_history'
          });

        case 'top_influencers':
          const influencerHours = hours ? parseInt(hours as string) : 24;
          const topInfluencers = await getTopInfluencers(influencerHours, limit ? parseInt(limit as string) : 10);
          
          return res.status(200).json({
            success: true,
            data: topInfluencers,
            type: 'top_influencers'
          });

        case 'sentiment_anomalies':
          const anomalies = await getSentimentAnomalies();
          
          return res.status(200).json({
            success: true,
            data: anomalies,
            type: 'sentiment_anomalies'
          });

        case 'user_subscriptions':
          const subscriptions = await getUserSubscriptions(userId);
          
          return res.status(200).json({
            success: true,
            data: subscriptions,
            type: 'user_subscriptions'
          });

        case 'source_health':
          const sourceHealth = await getSourceHealth();
          
          return res.status(200).json({
            success: true,
            data: sourceHealth,
            type: 'source_health_status'
          });

        case 'sentiment_metrics':
          const daysBack = req.query.days ? parseInt(req.query.days as string) : 7;
          const metrics = await getSentimentMetrics(daysBack);
          
          return res.status(200).json({
            success: true,
            data: metrics,
            type: 'sentiment_analysis_metrics'
          });

        default:
          // Default to current trends
          const defaultTrends = await analyzer.getCurrentSentimentTrends();
          return res.status(200).json({
            success: true,
            data: defaultTrends,
            type: 'default_sentiment_data'
          });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Real-time sentiment API error:', error);

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (error.message?.includes('Rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (error.message?.includes('Player not found')) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (error.message?.includes('Invalid timeframe')) {
      return res.status(400).json({ error: 'Invalid timeframe specified' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Sentiment analysis failed'
    });
  }
}

// Helper functions

async function subscribeToAlerts(userId: string, subscriptionData: {
  subscriptionType: 'player' | 'team' | 'topic' | 'all';
  targetValue: string;
  alertTypes: string[];
  severityThreshold: string;
  notificationMethods: string[];
}) {
  await db.query(`
    INSERT INTO user_sentiment_subscriptions (
      user_id, subscription_type, target_value, alert_types,
      severity_threshold, notification_methods, is_active, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
  `, [
    userId,
    subscriptionData.subscriptionType,
    subscriptionData.targetValue,
    JSON.stringify(subscriptionData.alertTypes),
    subscriptionData.severityThreshold,
    JSON.stringify(subscriptionData.notificationMethods)
  ]);
}

async function unsubscribeFromAlerts(userId: string, subscriptionId: string) {
  await db.query(`
    UPDATE user_sentiment_subscriptions 
    SET is_active = false, updated_at = NOW()
    WHERE id = $1 AND user_id = $2
  `, [subscriptionId, userId]);
}

async function dismissAlert(alertId: string, userId: string) {
  await db.query(`
    UPDATE sentiment_alerts 
    SET alert_status = 'dismissed', 
        resolution_notes = 'Dismissed by user',
        updated_at = NOW()
    WHERE id = $1
  `, [alertId]);
}

async function analyzeCustomContent(content: string, playerNames?: string[]) {
  // This would use the sentiment analyzer to analyze custom content
  // For now, return a mock analysis
  return {
    content,
    sentiment: 'neutral',
    sentimentScore: 0.1,
    confidence: 0.8,
    fantasyRelevance: playerNames && playerNames.length > 0 ? 0.9 : 0.3,
    detectedPlayers: playerNames || [],
    topics: ['performance', 'analysis'],
    analysis: 'Custom content analysis completed'
  };
}

async function getTrendingTopics(timeframe: string, limit: number) {
  const query = `
    SELECT 
      topic,
      category,
      mention_count,
      avg_sentiment,
      avg_influence,
      sentiment_trend,
      related_players,
      related_teams,
      last_updated
    FROM trending_sentiment_topics
    WHERE timeframe = $1
    ORDER BY mention_count DESC, avg_influence DESC
    LIMIT $2
  `;

  const result = await db.query(query, [timeframe, limit]);
  
  return result.rows.map(row => ({
    topic: row.topic,
    category: row.category,
    mentionCount: row.mention_count,
    averageSentiment: parseFloat(row.avg_sentiment),
    averageInfluence: parseFloat(row.avg_influence),
    sentimentTrend: row.sentiment_trend,
    relatedPlayers: JSON.parse(row.related_players || '[]'),
    relatedTeams: JSON.parse(row.related_teams || '[]'),
    lastUpdated: row.last_updated
  }));
}

async function getActiveAlerts(userId: string, limit: number) {
  // Get user's subscriptions to filter relevant alerts
  const subscriptionsQuery = await db.query(`
    SELECT subscription_type, target_value, severity_threshold
    FROM user_sentiment_subscriptions
    WHERE user_id = $1 AND is_active = true
  `, [userId]);

  // Build filter conditions based on subscriptions
  let alertFilters = [];
  let queryParams = [limit];
  let paramIndex = 2;

  if (subscriptionsQuery.rows.length > 0) {
    const playerSubscriptions = subscriptionsQuery.rows
      .filter(s => s.subscription_type === 'player')
      .map(s => s.target_value);

    if (playerSubscriptions.length > 0) {
      alertFilters.push(`player_name = ANY($${paramIndex})`);
      queryParams.push(playerSubscriptions);
      paramIndex++;
    }
  }

  const whereClause = alertFilters.length > 0 
    ? `WHERE alert_status = 'active' AND expires_at > NOW() AND (${alertFilters.join(' OR ')})`
    : `WHERE alert_status = 'active' AND expires_at > NOW()`;

  const query = `
    SELECT 
      id, alert_type, severity, player_name, team_name, summary,
      confidence_score, time_window, action_recommendation,
      expires_at, created_at
    FROM sentiment_alerts
    ${whereClause}
    ORDER BY 
      CASE severity 
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      created_at DESC
    LIMIT $1
  `;

  const result = await db.query(query, queryParams);
  
  return result.rows.map(row => ({
    id: row.id,
    alertType: row.alert_type,
    severity: row.severity,
    player: row.player_name,
    team: row.team_name,
    summary: row.summary,
    confidenceScore: parseFloat(row.confidence_score),
    timeWindow: row.time_window,
    actionRecommendation: row.action_recommendation,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  }));
}

async function getSentimentHistory(playerName: string, hours: number) {
  const query = `
    SELECT 
      date_hour,
      mention_count,
      avg_sentiment,
      sentiment_volatility,
      avg_influence,
      total_engagement,
      alert_count
    FROM player_sentiment_history
    WHERE player_name = $1
      AND date_hour > NOW() - INTERVAL '${hours} hours'
    ORDER BY date_hour ASC
  `;

  const result = await db.query(query, [playerName]);
  
  return result.rows.map(row => ({
    timestamp: row.date_hour,
    mentionCount: row.mention_count,
    averageSentiment: parseFloat(row.avg_sentiment),
    volatility: parseFloat(row.sentiment_volatility || '0'),
    averageInfluence: parseFloat(row.avg_influence),
    totalEngagement: row.total_engagement,
    alertCount: row.alert_count
  }));
}

async function getTopInfluencers(hours: number, limit: number) {
  const query = `
    SELECT * FROM get_top_sentiment_influencers($1, $2)
  `;

  const result = await db.query(query, [hours, limit]);
  
  return result.rows.map(row => ({
    author: row.author,
    totalInfluence: parseFloat(row.total_influence),
    mentionCount: parseInt(row.mention_count),
    averageSentiment: parseFloat(row.avg_sentiment),
    verified: row.verified,
    followers: row.followers
  }));
}

async function getSentimentAnomalies() {
  const query = `
    SELECT * FROM detect_sentiment_anomalies(2.0)
    ORDER BY deviation DESC
    LIMIT 20
  `;

  const result = await db.query(query);
  
  return result.rows.map(row => ({
    player: row.player_name,
    currentSentiment: parseFloat(row.current_sentiment),
    expectedSentiment: parseFloat(row.expected_sentiment),
    deviation: parseFloat(row.deviation),
    significance: row.significance
  }));
}

async function getUserSubscriptions(userId: string) {
  const query = `
    SELECT 
      id, subscription_type, target_value, alert_types,
      severity_threshold, notification_methods, is_active,
      last_notification_sent, total_notifications_sent,
      created_at, updated_at
    FROM user_sentiment_subscriptions
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const result = await db.query(query, [userId]);
  
  return result.rows.map(row => ({
    id: row.id,
    subscriptionType: row.subscription_type,
    targetValue: row.target_value,
    alertTypes: JSON.parse(row.alert_types),
    severityThreshold: row.severity_threshold,
    notificationMethods: JSON.parse(row.notification_methods),
    isActive: row.is_active,
    lastNotificationSent: row.last_notification_sent,
    totalNotificationsSent: row.total_notifications_sent,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function getSourceHealth() {
  const query = `
    SELECT 
      source_id, source_name, source_type, is_active,
      update_frequency_minutes, rate_limit_remaining,
      last_successful_update, last_error, error_message,
      total_requests, successful_requests, failed_requests,
      avg_response_time_ms
    FROM sentiment_sources
    ORDER BY is_active DESC, last_successful_update DESC
  `;

  const result = await db.query(query);
  
  return result.rows.map(row => ({
    sourceId: row.source_id,
    sourceName: row.source_name,
    sourceType: row.source_type,
    isActive: row.is_active,
    updateFrequency: row.update_frequency_minutes,
    rateLimitRemaining: row.rate_limit_remaining,
    lastSuccessfulUpdate: row.last_successful_update,
    lastError: row.last_error,
    errorMessage: row.error_message,
    totalRequests: row.total_requests,
    successfulRequests: row.successful_requests,
    failedRequests: row.failed_requests,
    averageResponseTime: row.avg_response_time_ms,
    successRate: row.total_requests > 0 ? (row.successful_requests / row.total_requests) : 0
  }));
}

async function getSentimentMetrics(days: number) {
  const query = `
    SELECT 
      analysis_date,
      total_items_processed,
      successful_analyses,
      failed_analyses,
      avg_processing_time_ms,
      avg_confidence_score,
      alerts_generated,
      trending_topics_identified,
      unique_players_mentioned,
      source_breakdown,
      sentiment_distribution,
      topic_breakdown
    FROM sentiment_analysis_metrics
    WHERE analysis_date > CURRENT_DATE - INTERVAL '${days} days'
    ORDER BY analysis_date DESC
  `;

  const result = await db.query(query);
  
  return result.rows.map(row => ({
    date: row.analysis_date,
    totalItemsProcessed: row.total_items_processed,
    successfulAnalyses: row.successful_analyses,
    failedAnalyses: row.failed_analyses,
    averageProcessingTime: row.avg_processing_time_ms,
    averageConfidenceScore: parseFloat(row.avg_confidence_score),
    alertsGenerated: row.alerts_generated,
    trendingTopicsIdentified: row.trending_topics_identified,
    uniquePlayersMentioned: row.unique_players_mentioned,
    sourceBreakdown: JSON.parse(row.source_breakdown || '{}'),
    sentimentDistribution: JSON.parse(row.sentiment_distribution || '{}'),
    topicBreakdown: JSON.parse(row.topic_breakdown || '{}')
  }));
}