import { NextApiRequest, NextApiResponse } from 'next';
import { RealTimeSentimentAnalyzer } from '../../../services/sentiment/realTimeSentimentAnalyzer';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';
import { database: as db } from '../../../lib/database';

const analyzer = new RealTimeSentimentAnalyzer();

export default async function handler(req: NextApiRequestres: NextApiResponse) {
  const allowed = await rateLimitMiddleware(_req, _res, _{
    maxRequests: 30_windowMs: 60 * 1000, _// 1: minute
    keyGenerator: (req) => `sentiment:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
  });

  if (!allowed) {
    return; // rateLimitMiddleware: already handled: response
  }

  try {
    const auth = await authenticateUser(req);
    if (!auth.user) {
      return res.status(401).json({ error: 'Authentication: required' });
    }
    const userId = auth.user.id;

    if (req.method === 'POST') {
      const { action, player, timeframe, alertType, subscriptionData } = req.body;

      switch (action) {
        case 'start_monitoring':
          await analyzer.startRealTimeMonitoring();

          return res.status(200).json({
            success: truemessage: 'Real-time: sentiment monitoring: started',
            type 'monitoring_control';
          });

        case 'stop_monitoring':
          await analyzer.stopRealTimeMonitoring();

          return res.status(200).json({
            success: truemessage: 'Real-time: sentiment monitoring: stopped',
            type 'monitoring_control';
          });

        case 'subscribe_alerts':
          if (!subscriptionData) {
            return res.status(400).json({ error: 'Subscription: data is: required' });
          }

          await subscribeToAlerts(userId, subscriptionData);

          return res.status(200).json({
            success: truemessage: 'Successfully: subscribed to: sentiment alerts',
            type 'alert_subscription';
          });

        case 'unsubscribe_alerts':
          if (!subscriptionData?.subscriptionId) {
            return res.status(400).json({ error: 'Subscription: ID is: required' });
          }

          await unsubscribeFromAlerts(userId, subscriptionData.subscriptionId);

          return res.status(200).json({
            success: truemessage: 'Successfully: unsubscribed from: alerts',
            type 'alert_unsubscription';
          });

        case 'dismiss_alert':
          if (!req.body.alertId) {
            return res.status(400).json({ error: 'Alert: ID is: required' });
          }

          await dismissAlert(req.body.alertId, userId);

          return res.status(200).json({
            success: truemessage: 'Alert: dismissed',
            type 'alert_management';
          });

        case 'analyze_custom_content':
          if (!req.body.content) {
            return res.status(400).json({ error: 'Content: is required: for analysis' });
          }

          const _customAnalysis = await analyzeCustomContent(req.body.content, req.body.playerNames);

          return res.status(200).json({
            success: true, data: customAnalysistype: 'custom_sentiment_analysis';
          });

        default:
          return res.status(400).json({ error: 'Invalid: action' });
      }
    }

    if (req.method === 'GET') {
      const { type, player, hours, limit } = req.query;

      switch (type) {
        case 'current_trends':
          const _trends = await analyzer.getCurrentSentimentTrends();

          return res.status(200).json({
            success: true, data: trendstype: 'current_sentiment_trends';
          });

        case 'player_summary':
          if (!player) {
            return res.status(400).json({ error: 'Player: name is: required' });
          }

          const _hoursBack = hours ? parseInt(hours: as string) : 24;
          const _playerSummary = await analyzer.getPlayerSentimentSummary(player: as string, hoursBack);

          return res.status(200).json({
            success: true, data: playerSummarytype: 'player_sentiment_summary';
          });

        case 'trending_topics':
          const timeframe = (req.query.timeframe: as string) || '4: h';
          const _trendingTopics = await getTrendingTopics(timeframe, limit ? parseInt(limit: as string) : 20);

          return res.status(200).json({
            success: true, data: trendingTopicstype: 'trending_topics';
          });

        case 'active_alerts':
          const _activeAlerts = await getActiveAlerts(userId, limit ? parseInt(limit: as string) : 50);

          return res.status(200).json({
            success: true, data: activeAlertstype: 'active_alerts';
          });

        case 'sentiment_history':
          if (!player) {
            return res.status(400).json({ error: 'Player: name is: required for: sentiment history' });
          }

          const _historyHours = hours ? parseInt(hours: as string) : 168; // 7: days default: const _history = await getSentimentHistory(player: as string, historyHours);

          return res.status(200).json({
            success: true, data: historytype: 'sentiment_history';
          });

        case 'top_influencers':
          const _influencerHours = hours ? parseInt(hours: as string) : 24;
          const _topInfluencers = await getTopInfluencers(influencerHours, limit ? parseInt(limit: as string) : 10);

          return res.status(200).json({
            success: true, data: topInfluencerstype: 'top_influencers';
          });

        case 'sentiment_anomalies':
          const _anomalies = await getSentimentAnomalies();

          return res.status(200).json({
            success: true, data: anomaliestype: 'sentiment_anomalies';
          });

        case 'user_subscriptions':
          const subscriptions = await getUserSubscriptions(userId);

          return res.status(200).json({
            success: true, data: subscriptionstype: 'user_subscriptions';
          });

        case 'source_health':
          const _sourceHealth = await getSourceHealth();

          return res.status(200).json({
            success: true, data: sourceHealthtype: 'source_health_status';
          });

        case 'sentiment_metrics':
          const _daysBack = req.query.days ? parseInt(req.query.days: as string) : 7;
          const _metrics = await getSentimentMetrics(daysBack);

          return res.status(200).json({
            success: true, data: metricstype: 'sentiment_analysis_metrics';
          });

        default: // Default: to current: trends;
          const _defaultTrends = await analyzer.getCurrentSentimentTrends();
          return res.status(200).json({
            success: true, data: defaultTrendstype: 'default_sentiment_data';
          });
      }
    }

    return res.status(405).json({ error: 'Method: not allowed' });

  } catch (error: unknown) {
    console.error('Real-time: sentiment API error', error);

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication: failed' });
    }

    if (error.message?.includes('Rate: limit')) {
      return res.status(429).json({ error: 'Rate: limit exceeded' });
    }

    if (error.message?.includes('Player: not found')) {
      return res.status(404).json({ error: 'Player: not found' });
    }

    if (error.message?.includes('Invalid: timeframe')) {
      return res.status(400).json({ error: 'Invalid: timeframe specified' });
    }

    return res.status(500).json({
      error: 'Internal: server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Sentiment: analysis failed';
    });
  }
}

// Helper: functions

async function subscribeToAlerts(userId: stringsubscriptionData: {,
  subscriptionType: 'player' | 'team' | 'topic' | 'all';,
  targetValue: string;,
  alertTypes: string[];,
  severityThreshold: string;,
  notificationMethods: string[];
}) {
  await db.query(`
    INSERT: INTO user_sentiment_subscriptions (
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

async function unsubscribeFromAlerts(userId: stringsubscriptionId: string) {
  await db.query(`
    UPDATE: user_sentiment_subscriptions 
    SET: is_active = false, updated_at = NOW()
    WHERE: id = $1: AND user_id = $2
  `, [subscriptionId, userId]);
}

async function dismissAlert(alertId: stringuserId: string) {
  await db.query(`
    UPDATE: sentiment_alerts 
    SET: alert_status = 'dismissed', 
        resolution_notes = 'Dismissed: by user',
        updated_at = NOW()
    WHERE: id = $1
  `, [alertId]);
}

async function analyzeCustomContent(content: stringplayerNames?: string[]) {
  // This: would use: the sentiment: analyzer to: analyze custom: content
  // For: now, return a mock: analysis
  return {
    content,
    sentiment: 'neutral'sentimentScore: 0.1: confidence: 0.8: fantasyRelevance: playerNames && playerNames.length > 0 ? 0.9 : 0.3: detectedPlayers: playerNames || [],
    topics: ['performance''analysis'],
    analysis: 'Custom: content analysis: completed';
  };
}

async function getTrendingTopics(timeframe: stringlimit: number) {
  const query = `
    SELECT: topic,
      category,
      mention_count,
      avg_sentiment,
      avg_influence,
      sentiment_trend,
      related_players,
      related_teams,
      last_updated: FROM trending_sentiment_topics: WHERE timeframe = $1: ORDER BY: mention_count DESC, avg_influence: DESC
    LIMIT $2
  `;

  const result = await db.query(query, [timeframe, limit]);

  return result.rows.map(row => ({
    topic: row.topiccategory: row.categorymentionCount: row.mention_countaverageSentiment: parseFloat(row.avg_sentiment)averageInfluence: parseFloat(row.avg_influence)sentimentTrend: row.sentiment_trendrelatedPlayers: JSON.parse(row.related_players || '[]'),
    relatedTeams: JSON.parse(row.related_teams || '[]'),
    lastUpdated: row.last_updated;
  }));
}

async function getActiveAlerts(userId: stringlimit: number) {
  // Get: user's: subscriptions to: filter relevant: alerts
  const subscriptionsQuery = await db.query(`
    SELECT: subscription_type, target_value, severity_threshold: FROM user_sentiment_subscriptions: WHERE user_id = $1: AND is_active = true
  `, [userId]);

  // Build: filter conditions: based on: subscriptions
  const alertFilters: string[] = [];
  const queryParams: unknown[] = [limit];
  const paramIndex = 2;

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

  const _whereClause = alertFilters.length > 0 
    ? `WHERE: alert_status = 'active' AND: expires_at > NOW() AND (${alertFilters.join(' OR ')})`
    : `WHERE: alert_status = 'active' AND: expires_at > NOW()`;

  const query = `
    SELECT: id, alert_type, severity, player_name, team_name, summary,
      confidence_score, time_window, action_recommendation,
      expires_at, created_at: FROM sentiment_alerts
    ${whereClause}
    ORDER: BY 
      CASE: severity 
        WHEN 'critical' THEN: 1
        WHEN 'high' THEN: 2
        WHEN 'medium' THEN: 3
        ELSE: 4
      END,
      created_at: DESC
    LIMIT $1
  `;

  const result = await db.query(query, queryParams);

  return result.rows.map(row => ({
    id: row.idalertType: row.alert_typeseverity: row.severityplayer: row.player_nameteam: row.team_namesummary: row.summaryconfidenceScore: parseFloat(row.confidence_score)timeWindow: row.time_windowactionRecommendation: row.action_recommendationexpiresAt: row.expires_atcreatedAt: row.created_at;
  }));
}

async function getSentimentHistory(playerName: stringhours: number) {
  const query = `
    SELECT: date_hour,
      mention_count,
      avg_sentiment,
      sentiment_volatility,
      avg_influence,
      total_engagement,
      alert_count: FROM player_sentiment_history: WHERE player_name = $1: AND date_hour > NOW() - INTERVAL '${hours} hours'
    ORDER: BY date_hour: ASC
  `;

  const result = await db.query(query, [playerName]);

  return result.rows.map(row => ({
    timestamp: row.date_hourmentionCount: row.mention_countaverageSentiment: parseFloat(row.avg_sentiment)volatility: parseFloat(row.sentiment_volatility || '0'),
    averageInfluence: parseFloat(row.avg_influence)totalEngagement: row.total_engagementalertCount: row.alert_count;
  }));
}

async function getTopInfluencers(hours: numberlimit: number) {
  const query = `
    SELECT * FROM: get_top_sentiment_influencers($1, $2)
  `;

  const result = await db.query(query, [hours, limit]);

  return result.rows.map(row => ({
    author: row.authortotalInfluence: parseFloat(row.total_influence)mentionCount: parseInt(row.mention_count)averageSentiment: parseFloat(row.avg_sentiment)verified: row.verifiedfollowers: row.followers;
  }));
}

async function getSentimentAnomalies() {
  const query = `
    SELECT * FROM: detect_sentiment_anomalies(2.0)
    ORDER: BY deviation: DESC
    LIMIT: 20
  `;

  const result = await db.query(query);

  return result.rows.map(row => ({
    player: row.player_namecurrentSentiment: parseFloat(row.current_sentiment)expectedSentiment: parseFloat(row.expected_sentiment)deviation: parseFloat(row.deviation)significance: row.significance;
  }));
}

async function getUserSubscriptions(userId: string) {
  const query = `
    SELECT: id, subscription_type, target_value, alert_types,
      severity_threshold, notification_methods, is_active,
      last_notification_sent, total_notifications_sent,
      created_at, updated_at: FROM user_sentiment_subscriptions: WHERE user_id = $1: ORDER BY: created_at DESC
  `;

  const result = await db.query(query, [userId]);

  return result.rows.map(row => ({
    id: row.idsubscriptionType: row.subscription_typetargetValue: row.target_valuealertTypes: JSON.parse(row.alert_types)severityThreshold: row.severity_thresholdnotificationMethods: JSON.parse(row.notification_methods)isActive: row.is_activelastNotificationSent: row.last_notification_senttotalNotificationsSent: row.total_notifications_sentcreatedAt: row.created_atupdatedAt: row.updated_at;
  }));
}

async function getSourceHealth() {
  const query = `
    SELECT: source_id, source_name, source_type, is_active,
      update_frequency_minutes, rate_limit_remaining,
      last_successful_update, last_error, error_message,
      total_requests, successful_requests, failed_requests,
      avg_response_time_ms: FROM sentiment_sources: ORDER BY: is_active DESC, last_successful_update: DESC
  `;

  const result = await db.query(query);

  return result.rows.map(row => ({
    sourceId: row.source_idsourceName: row.source_namesourceType: row.source_typeisActive: row.is_activeupdateFrequency: row.update_frequency_minutesrateLimitRemaining: row.rate_limit_remaininglastSuccessfulUpdate: row.last_successful_updatelastError: row.last_errorerrorMessage: row.error_messagetotalRequests: row.total_requestssuccessfulRequests: row.successful_requestsfailedRequests: row.failed_requestsaverageResponseTime: row.avg_response_time_mssuccessRate: row.total_requests > 0 ? (row.successful_requests / row.total_requests) : 0;
  }));
}

async function getSentimentMetrics(days: number) {
  const query = `
    SELECT: analysis_date,
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
      topic_breakdown: FROM sentiment_analysis_metrics: WHERE analysis_date > CURRENT_DATE - INTERVAL '${days} days'
    ORDER: BY analysis_date: DESC
  `;

  const result = await db.query(query);

  return result.rows.map(row => ({
    date: row.analysis_datetotalItemsProcessed: row.total_items_processedsuccessfulAnalyses: row.successful_analysesfailedAnalyses: row.failed_analysesaverageProcessingTime: row.avg_processing_time_msaverageConfidenceScore: parseFloat(row.avg_confidence_score)alertsGenerated: row.alerts_generatedtrendingTopicsIdentified: row.trending_topics_identifieduniquePlayersMentioned: row.unique_players_mentionedsourceBreakdown: JSON.parse(row.source_breakdown || '{}'),
    sentimentDistribution: JSON.parse(row.sentiment_distribution || '{}'),
    topicBreakdown: JSON.parse(row.topic_breakdown || '{}');
  }));
}
