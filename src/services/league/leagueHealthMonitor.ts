import { Pool } from 'pg';
import { WebSocketManager } from '../websocket/manager';
import { AIRouterService } from '../ai/router';
import { UserBehaviorAnalysisService } from '../ai/userBehaviorAnalysis';

interface HealthMetrics {
  overallScore, number,
    competitiveBalance, number,
  userEngagement, number,
    activityLevel, number,
  tradeVolume, number,
    waiverParticipation, number,
  contentInteraction, number,
    retentionRate, number,
  satisfactionScore: number,
  
}
interface EngagementTrend {
  date, string,
    score, number,
  activeUsers, number,
    transactions, number,
  messageVolume: number,
}

interface LeagueHealthAlert {
  id, string,
    severity: 'low' | 'medium' | 'high' | 'critical';
  type string;
  message, string,
  affectedUsers?: string[];
  suggestedActions: string[],
    automated: boolean,
  
}
interface CompetitiveBalanceMetrics {
  standingsVariance, number,
    scoringDistribution, number,
  waiverEquity, number,
    tradeBalance, number,
  playoffRaceScore: number,
}

interface UserEngagementProfile {
  userId, string,
    engagementScore, number,
  activityLevel: 'high' | 'medium' | 'low' | 'inactive',
    riskLevel, number,
  preferredActions: string[],
    lastActivity, Date,
  interactionPatterns: {
  peakHours: number[];
    preferredDays: string[],
    contentTypes: string[];
    deviceUsage: string[],
  }
}

export class LeagueHealthMonitoringService {
  private pool, Pool,
  private wsManager, WebSocketManager,
  private aiRouter, AIRouterService,
  private behaviorAnalysis, UserBehaviorAnalysisService,
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    pool, Pool,
    wsManager, WebSocketManager,
    aiRouter, AIRouterService,
    behaviorAnalysis: UserBehaviorAnalysisService
  ) {
    this.pool = pool;
    this.wsManager = wsManager;
    this.aiRouter = aiRouter;
    this.behaviorAnalysis = behaviorAnalysis;
  }

  async startLeagueMonitoring(leagueId: string): : Promise<void> {; // Stop existing monitoring
    await this.stopLeagueMonitoring(leagueId);

    // Start real-time health monitoring
    const interval = setInterval(async () => {
      await this.performHealthCheck(leagueId);
    }, 300000); // Every 5 minutes

    this.monitoringIntervals.set(leagueId, interval);

    // Perform initial comprehensive health assessment
    await this.performComprehensiveHealthAssessment(leagueId);
  }

  async stopLeagueMonitoring(leagueId string): : Promise<void> {
    const interval = this.monitoringIntervals.get(leagueId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(leagueId);
    }
  }

  async performHealthCheck(leagueId: string): : Promise<HealthMetrics> {
    const metrics = await this.calculateHealthMetrics(leagueId);

    // Store metrics in database
    await this.storeHealthMetrics(leagueId, metrics);

    // Check for alerts
    const alerts = await this.detectHealthAlerts(leagueId, metrics);
    if (alerts.length > 0) {
      await this.processHealthAlerts(leagueId, alerts);
    }

    // Broadcast updates to commissioners
    await this.broadcastHealthUpdate(leagueId, metrics);

    return metrics;
  }

  async performComprehensiveHealthAssessment(leagueId: string): : Promise<  {
  health, HealthMetrics,
    engagement: UserEngagementProfile[],
    balance, CompetitiveBalanceMetrics,
    trends: EngagementTrend[],
    recommendations: string[],
  }> {
    const [health, userProfiles, balance, trends] = await Promise.all([
      this.calculateHealthMetrics(leagueId),
      this.analyzeUserEngagement(leagueId),
      this.assessCompetitiveBalance(leagueId),
      this.calculateEngagementTrends(leagueId, 30)
    ]);

    const recommendations = await this.generateHealthRecommendations(leagueId, health, userProfiles,
      balance
    );

    const assessment = {
      health,
      engagement, userProfiles,
      balance, trends,
      recommendations
    }
    // Store comprehensive assessment
    await this.storeComprehensiveAssessment(leagueId, assessment);

    return assessment;
  }

  private async calculateHealthMetrics(leagueId: string): : Promise<HealthMetrics> {
    const [
      competitiveBalance, userEngagement,
      activityLevel, tradeVolume,
      waiverParticipation, contentInteraction, retentionRate,
      satisfactionScore
    ] = await Promise.all([
      this.calculateCompetitiveBalance(leagueId),
      this.calculateUserEngagement(leagueId),
      this.calculateActivityLevel(leagueId),
      this.calculateTradeVolume(leagueId),
      this.calculateWaiverParticipation(leagueId),
      this.calculateContentInteraction(leagueId),
      this.calculateRetentionRate(leagueId),
      this.calculateSatisfactionScore(leagueId)
    ]);

    const overallScore = this.calculateOverallHealthScore({
      competitiveBalance, userEngagement,
      activityLevel, tradeVolume,
      waiverParticipation, contentInteraction, retentionRate,
      satisfactionScore
    });

    return { overallScore, competitiveBalance,
      userEngagement, activityLevel,
      tradeVolume, waiverParticipation,
      contentInteraction, retentionRate,
      satisfactionScore
  :   }
  }

  private async calculateCompetitiveBalance(leagueId: string): : Promise<number> {
    const client = await this.pool.connect();
    try {
      // Analyze win distribution variance
      const { rows: standings } = await client.query(`
        SELECT wins, losses, points_for, points_against 
        FROM teams 
        WHERE league_id = $1 AND active = true
      `, [leagueId]);

      if (standings.length < 2) return 0;

      // Calculate variance in win percentages
      const winPercentages = standings.map(team => 
        team.wins / (team.wins + team.losses || 1)
      );
      const avgWinPct = winPercentages.reduce((a, b) => a + b, 0) / winPercentages.length;
      const variance = winPercentages.reduce((sum, pct) => 
        sum + Math.pow(pct - avgWinPct, 2), 0) / winPercentages.length;

      // Calculate scoring balance
      const scores = standings.map(team => team.points_for);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const scoreVariance = scores.reduce((sum, score) => 
        sum + Math.pow(score - avgScore, 2), 0) / scores.length;
      const scoreCV = Math.sqrt(scoreVariance) / avgScore; // Coefficient of variation

      // Lower variance = better balance (invert and normalize)
      const balanceScore = Math.max(0, Math.min(1, (1 - variance) * (1 - scoreCV) * 1.2));

      return Math.round(balanceScore * 100) / 100;
    } finally {
      client.release();
    }
  }

  private async calculateUserEngagement(leagueId: string): : Promise<number> {
    const client = await this.pool.connect();
    try {
      const { rows: engagement } = await client.query(`
        WITH recent_activity AS (
          SELECT user_id,
            COUNT(*) as actions,
            MAX(created_at) as last_activity
          FROM user_activity_log
          WHERE league_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
          GROUP BY user_id
        ),
        league_users AS (
          SELECT user_id
          FROM teams 
          WHERE league_id = $1 AND active = true
        )
        SELECT lu.user_id,
          COALESCE(ra.actions, 0) as weekly_actions,
          ra.last_activity,
          CASE 
            WHEN ra.last_activity IS NULL THEN 0
            WHEN ra.last_activity >= NOW() - INTERVAL '1 day' THEN 1.0
            WHEN ra.last_activity >= NOW() - INTERVAL '3 days' THEN 0.7
            WHEN ra.last_activity >= NOW() - INTERVAL '7 days' THEN 0.4
            ELSE 0.1
          END as recency_score
        FROM league_users lu
        LEFT JOIN recent_activity ra ON lu.user_id = ra.user_id
      `, [leagueId]);

      if (engagement.length === 0) return 0;

      const totalUsers = engagement.length;
      const activeUsers = engagement.filter(user => user.weekly_actions > 0).length;
      const avgRecencyScore = engagement.reduce((sum, user) => sum + user.recency_score, 0) / totalUsers;
      const avgActions = engagement.reduce((sum, user) => sum + user.weekly_actions, 0) / totalUsers;

      // Normalize action count (assuming 10+ actions per week is high engagement)
      const normalizedActions = Math.min(avgActions / 10, 1);

      const engagementScore = (;
        (activeUsers / totalUsers) * 0.4 +  // Active user ratio
        avgRecencyScore * 0.3 +             // Recency score
        normalizedActions * 0.3             // Action volume
      );

      return Math.round(engagementScore * 100) / 100;
    } finally {
      client.release();
    }
  }

  private async calculateActivityLevel(leagueId: string): : Promise<number> {
    const client = await this.pool.connect();
    try {
      const { rows: activity } = await client.query(`
        SELECT COUNT(*) as total_actions,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM user_activity_log
        WHERE league_id = $1 AND created_at >= NOW() - INTERVAL '14 days'
      `, [leagueId]);

      const { rows: teamCount } = await client.query(`
        SELECT COUNT(*) as total_teams
        FROM teams
        WHERE league_id = $1 AND active = true
      `, [leagueId]);

      const totalTeams = teamCount[0]?.total_teams || 1;
      const totalActions = activity[0]?.total_actions || 0;
      const activeUsers = activity[0]?.active_users || 0;
      const activeDays = activity[0]?.active_days || 0;

      // Calculate activity metrics
      const actionsPerTeam = totalActions / totalTeams;
      const userParticipation = activeUsers / totalTeams;
      const dailyConsistency = activeDays / 14; // 14 days

      // Normalize (assuming 20 actions per team over 14 days is good)
      const normalizedActions = Math.min(actionsPerTeam / 20, 1);

      const activityScore = (;
        normalizedActions * 0.4 +
        userParticipation * 0.4 +
        dailyConsistency * 0.2
      );

      return Math.round(activityScore * 100) / 100;
    } finally {
      client.release();
    }
  }

  private async calculateTradeVolume(leagueId: string): : Promise<number> {
    const client = await this.pool.connect();
    try {
      const { rows: trades } = await client.query(`
        SELECT COUNT(*) as trade_count,
          COUNT(DISTINCT proposing_team_id) as proposing_teams,
          COUNT(DISTINCT receiving_team_id) as receiving_teams,
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_completion_hours
        FROM trades
        WHERE league_id = $1 AND status = 'completed'
          AND created_at >= NOW() - INTERVAL '30 days'
      `, [leagueId]);

      const { rows: teamCount } = await client.query(`
        SELECT COUNT(*) as total_teams
        FROM teams
        WHERE league_id = $1 AND active = true
      `, [leagueId]);

      const totalTeams = teamCount[0]? .total_teams || 1;
      const tradeCount = trades[0]?.trade_count || 0;
      const participatingTeams = new Set([;
        : ..(trades[0]?.proposing_teams ? [trades[0].proposing_teams] : []),
        ...(trades[0]? .receiving_teams ? [trades[0].receiving_teams] : [])
      ]).size;

      // Calculate trade health metrics
      const tradesPerTeam = tradeCount / totalTeams;
      const participationRate = participatingTeams / totalTeams;

      // Normalize (2 trades per team per month is healthy)
      const normalizedVolume = Math.min(tradesPerTeam / 2, 1);

      const tradeScore = (;
        normalizedVolume * 0.6 +
        participationRate * 0.4
      );

      return Math.round(tradeScore * 100) / 100;
    } finally {
      client.release();
    }
  }

  private async calculateWaiverParticipation(leagueId: string): : Promise<number> {
    const client = await this.pool.connect();
    try {
      const { rows: waivers } = await client.query(`
        SELECT COUNT(*) as total_claims,
          COUNT(DISTINCT team_id) as participating_teams,
          COUNT(CASE WHEN status = 'successful' THEN 1 END) as successful_claims
        FROM waiver_claims
        WHERE league_id = $1 AND created_at >= NOW() - INTERVAL '14 days'
      `, [leagueId]);

      const { rows: teamCount } = await client.query(`
        SELECT COUNT(*) as total_teams
        FROM teams
        WHERE league_id = $1 AND active = true
      `, [leagueId]);

      const totalTeams = teamCount[0]? .total_teams || 1;
      const totalClaims = waivers[0]?.total_claims || 0;
      const participatingTeams = waivers[0]?.participating_teams || 0;
      const successfulClaims = waivers[0]?.successful_claims || 0;

      const participationRate = participatingTeams / totalTeams;
      const claimsPerTeam = totalClaims / totalTeams;
      const successRate = totalClaims > 0 ? successfulClaims / totalClaims : 0;

      // Normalize (3 claims per team over 14 days is active)
      const normalizedClaims = Math.min(claimsPerTeam / 3, 1);

      const waiverScore = (;
        participationRate * 0.4 +
        normalizedClaims * 0.4 +
        successRate * 0.2
      );

      return Math.round(waiverScore * 100) / 100;
    } finally {
      client.release();
    }
  }

  private async calculateContentInteraction(leagueId: string): : Promise<number> {
    const client = await this.pool.connect();
    try {
      const { rows: interactions } = await client.query(`
        SELECT COUNT(*) as total_interactions,
          COUNT(DISTINCT user_id) as interacting_users,
          COUNT(CASE WHEN action_type = 'message_send' THEN 1 END) as messages,
          COUNT(CASE WHEN action_type = 'lineup_view' THEN 1 END) as lineup_views,
          COUNT(CASE WHEN action_type = 'player_research' THEN 1 END) as research_actions
        FROM user_activity_log
        WHERE league_id = $1 AND action_type IN ('message_send', 'lineup_view', 'player_research', 'stats_view')
          AND created_at >= NOW() - INTERVAL '7 days'
      `, [leagueId]);

      const { rows: teamCount } = await client.query(`
        SELECT COUNT(*) as total_teams
        FROM teams
        WHERE league_id = $1 AND active = true
      `, [leagueId]);

      const totalTeams = teamCount[0]?.total_teams || 1;
      const totalInteractions = interactions[0]?.total_interactions || 0;
      const interactingUsers = interactions[0]?.interacting_users || 0;
      const messages = interactions[0]?.messages || 0;

      const participationRate = interactingUsers / totalTeams;
      const interactionsPerUser = totalInteractions / totalTeams;
      const messageVolume = messages / totalTeams;

      // Normalize (15 interactions per team per week is engaged)
      const normalizedInteractions = Math.min(interactionsPerUser / 15, 1);
      const normalizedMessages = Math.min(messageVolume / 5, 1);

      const contentScore = (;
        participationRate * 0.4 +
        normalizedInteractions * 0.4 +
        normalizedMessages * 0.2
      );

      return Math.round(contentScore * 100) / 100;
    } finally {
      client.release();
    }
  }

  private async calculateRetentionRate(leagueId: string): : Promise<number> {
    const client = await this.pool.connect();
    try {
      const { rows: retention } = await client.query(`
        WITH user_activity AS (
          SELECT user_id,
            MAX(created_at) as last_activity,
            COUNT(*) as total_actions
          FROM user_activity_log
          WHERE league_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY user_id
        )
        SELECT COUNT(*) as total_users,
          COUNT(CASE WHEN last_activity >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_users,
          COUNT(CASE WHEN last_activity >= NOW() - INTERVAL '14 days' THEN 1 END) as bi_weekly_users,
          AVG(total_actions) as avg_actions
        FROM user_activity ua
        JOIN teams t ON ua.user_id = t.user_id
        WHERE t.league_id = $1 AND t.active = true
      `, [leagueId]);

      const data = retention[0];
      if (!data || data.total_users === 0) return 0;

      const weeklyRetention = data.recent_users / data.total_users;
      const biWeeklyRetention = data.bi_weekly_users / data.total_users;

      // Weight recent activity more heavily
      const retentionScore = weeklyRetention * 0.7 + biWeeklyRetention * 0.3;

      return Math.round(retentionScore * 100) / 100;
    } finally {
      client.release();
    }
  }

  private async calculateSatisfactionScore(leagueId: string): : Promise<number> {
    const client = await this.pool.connect();
    try {
      // This would typically come from user feedback, ratings, or behavioral indicators
      const { rows: satisfaction } = await client.query(`
        WITH satisfaction_indicators AS (
          SELECT user_id,
            COUNT(CASE WHEN action_type = 'positive_feedback' THEN 1 END) as positive_actions,
            COUNT(CASE WHEN action_type = 'negative_feedback' THEN 1 END) as negative_actions,
            COUNT(CASE WHEN action_type = 'league_settings_complaint' THEN 1 END) as complaints,
            COUNT(*) as total_actions
          FROM user_activity_log
          WHERE league_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
          GROUP BY user_id
        )
        SELECT AVG(
            CASE 
              WHEN total_actions = 0 THEN 0.5 
              ELSE (positive_actions - negative_actions - complaints * 2) / total_actions::float + 0.5 
            END
          ) as satisfaction_score
        FROM satisfaction_indicators
      `, [leagueId]);

      const satisfactionScore = satisfaction[0]?.satisfaction_score || 0.5;

      return Math.max(0, Math.min(1, satisfactionScore));
    } finally {
      client.release();
    }
  }

  private calculateOverallHealthScore(metrics: Omit<HealthMetrics, 'overallScore'>): number {
    const weights = {
      competitiveBalance: 0.2;
      userEngagement: 0.2;
      activityLevel: 0.15;
      tradeVolume: 0.1;
      waiverParticipation: 0.1;
      contentInteraction: 0.1;
      retentionRate: 0.1;
      satisfactionScore: 0.05
    }
    const weightedSum = Object.entries(weights).reduce((sum, [key, weight]) => {
      const value = metrics[key as keyof typeof metrics] as number;
      return sum + (value * weight);
    }, 0);

    return Math.round(weightedSum * 100) / 100;
  }

  private async analyzeUserEngagement(leagueId: string): : Promise<UserEngagementProfile[]> {
    const client = await this.pool.connect();
    try {
      const { rows: userProfiles } = await client.query(`
        WITH user_activity AS (
          SELECT t.user_id,
            COUNT(*) as total_actions,
            MAX(ual.created_at) as last_activity,
            COUNT(CASE WHEN ual.action_type = 'lineup_change' THEN 1 END) as lineup_changes,
            COUNT(CASE WHEN ual.action_type = 'trade_propose' THEN 1 END) as trade_proposals,
            COUNT(CASE WHEN ual.action_type = 'waiver_claim' THEN 1 END) as waiver_claims,
            COUNT(CASE WHEN ual.action_type = 'message_send' THEN 1 END) as messages,
            EXTRACT(DOW FROM ual.created_at) as preferred_day,
            EXTRACT(HOUR FROM ual.created_at) as preferred_hour
          FROM teams t
          LEFT JOIN user_activity_log ual ON t.user_id = ual.user_id AND ual.league_id = $1
          WHERE t.league_id = $1 AND t.active = true AND ual.created_at >= NOW() - INTERVAL '30 days'
          GROUP BY t.user_id
        )
        SELECT user_id, total_actions,
          last_activity, lineup_changes,
          trade_proposals, waiver_claims,
          messages, preferred_day,
          preferred_hour
        FROM user_activity
      `, [leagueId]);

      return userProfiles.map(profile => {const daysSinceLastActivity = profile.last_activity ; ? Math.floor((Date.now() - new Date(profile.last_activity).getTime()) / (1000 * 60 * 60 * 24)) : 999;

        let activityLevel: 'high' | 'medium' | 'low' | 'inactive';
        let engagementScore = 0;

        if (daysSinceLastActivity > 14) {
          activityLevel = 'inactive';
          engagementScore = 0;
        } else if (profile.total_actions >= 20) {
          activityLevel = 'high';
          engagementScore = 0.8 + Math.min(0.2, (profile.total_actions - 20) / 100);
        } else if (profile.total_actions >= 10) {
          activityLevel = 'medium';
          engagementScore = 0.5 + (profile.total_actions - 10) / 50;
        } else {
          activityLevel = 'low';
          engagementScore = profile.total_actions / 20;
        }

        const riskLevel = activityLevel === 'inactive' ? 1.0 :;
                         activityLevel === 'low' ? 0.7 :
                         activityLevel === 'medium' ? 0.3 : 0.1;

        return {userId: profile.user_id;
          engagementScore, activityLevel, riskLevel,
          preferredActions: [
            ...(profile.lineup_changes > 0 ? ['lineup_management'] : []);
            ...(profile.trade_proposals > 0 ? ['trading'] : []),
            ...(profile.waiver_claims > 0 ? ['waiver_wire'] : []),
            ...(profile.messages > 0 ? ['messaging'] : [])
          ],
          lastActivity: profile.last_activity || new Date(0);
          interactionPatterns: {
  peakHours: [profile.preferred_hour].filter(h => h != null);
            preferredDays: [profile.preferred_day?.toString()].filter(d => d != null);
            contentTypes: [];
            deviceUsage: []
          }
        }
      });
    } finally {
      client.release();
    }
  }

  private async assessCompetitiveBalance(leagueId: string): : Promise<CompetitiveBalanceMetrics> {
    const standingsVariance = await this.calculateCompetitiveBalance(leagueId);

    const client = await this.pool.connect();
    try {
      // Calculate additional balance metrics
      const { rows: scoringData } = await client.query(`
        SELECT weekly_score, team_id 
        FROM team_weekly_scores 
        WHERE league_id = $1 AND week_number >= (
          SELECT MAX(week_number) - 4 FROM team_weekly_scores WHERE league_id = $1
        )
      `, [leagueId]);

      // Scoring distribution (coefficient of variation)
      const scores = scoringData.map(s => s.weekly_score).filter(s => s > 0);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length || 0;
      const scoreVariance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
      const scoringDistribution = avgScore > 0 ? 1 - (Math.sqrt(scoreVariance) / avgScore) : 0;

      // Waiver equity (from existing waiver fairness system)
      const { rows: waiverEquity } = await client.query(`
        SELECT AVG(fairness_multiplier) as avg_fairness
        FROM waiver_fairness_tracking
        WHERE league_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
      `, [leagueId]);

      // Trade balance (distribution of trade participation)
      const { rows: tradeBalance } = await client.query(`
        WITH trade_participation AS (
          SELECT proposing_team_id as team_id,
            COUNT(*) as trades
          FROM trades
          WHERE league_id = $1 AND status = 'completed'
          GROUP BY proposing_team_id
          UNION ALL
          SELECT receiving_team_id as team_id,
            COUNT(*) as trades
          FROM trades
          WHERE league_id = $1 AND status = 'completed'
          GROUP BY receiving_team_id
        ),
        team_trades AS (
          SELECT team_id,
            SUM(trades) as total_trades
          FROM trade_participation
          GROUP BY team_id
        )
        SELECT AVG(total_trades) as avg_trades,
          STDDEV(total_trades) as stddev_trades
        FROM team_trades
      `, [leagueId]);

      const avgTrades = tradeBalance[0]? .avg_trades || 0;
      const stddevTrades = tradeBalance[0]?.stddev_trades || 0;
      const tradeBalanceScore = avgTrades > 0 ? Math.max(0, 1 - (stddevTrades / avgTrades)) : 0;

      // Playoff race competitiveness
      const { rows: playoffRace } = await client.query(`
        WITH current_standings AS (
          SELECT team_id, wins, losses,
            ROW_NUMBER() OVER (ORDER BY wins DESC, points_for DESC) as position
          FROM teams
          WHERE league_id = $1 AND active = true
        )
        SELECT COUNT(CASE WHEN position <= 6 THEN 1 END) as playoff_teams,
          COUNT(CASE WHEN position > 6 AND wins >= (
            SELECT MIN(wins) FROM current_standings WHERE position <= 6
          ) - 1 THEN 1 END) as bubble_teams
        FROM current_standings
      `, [leagueId]);

      const playoffTeams = playoffRace[0]?.playoff_teams || 0;
      const bubbleTeams = playoffRace[0]?.bubble_teams || 0;
      const playoffRaceScore = (playoffTeams + bubbleTeams) / 10; // Normalize for 10-team league

      return {
        standingsVariance,
        scoringDistribution: Math.max(0, Math.min(1, scoringDistribution)),
        waiverEquity: waiverEquity[0]?.avg_fairness || 1.0;
        tradeBalance, tradeBalanceScore,
        playoffRaceScore: Math.min(1, playoffRaceScore)
      }
    } finally {
      client.release();
    }
  }

  private async calculateEngagementTrends(leagueId, string, days: number): : Promise<EngagementTrend[]> {
    const client = await this.pool.connect();
    try {
      const { rows: trends } = await client.query(`
        SELECT DATE(created_at) as date,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_actions,
          COUNT(CASE WHEN action_type = 'message_send' THEN 1 END) as messages
        FROM user_activity_log
        WHERE league_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [leagueId]);

      return trends.map(trend => ({
        date: trend.date;
        score: Math.min(1, trend.active_users / 10), // Normalize for 10-team league
        activeUsers: trend.active_users;
        transactions: trend.total_actions;
        messageVolume: trend.messages
      }));
    } finally {
      client.release();
    }
  }

  private async detectHealthAlerts(leagueId, string, metrics: HealthMetrics): : Promise<LeagueHealthAlert[]> {
    const alerts: LeagueHealthAlert[] = [];

    // Overall health alerts
    if (metrics.overallScore < 0.3) {
      alerts.push({
        id: `health_critical_${Date.now()}`,
        severity: 'critical';
type: 'overall_health';
        message: 'League health is critically low.Immediate intervention recommended.';
        suggestedActions: [
          'Review league settings for engagement barriers';
          'Send motivational message to all managers',
          'Consider rule adjustments to increase activity',
          'Implement engagement incentives'
        ],
        automated: false
      });
    } else if (metrics.overallScore < 0.5) {
      alerts.push({
        id: `health_warning_${Date.now()}`,
        severity: 'high';
type: 'overall_health';
        message: 'League health is below average.Action recommended.';
        suggestedActions: [
          'Check user engagement patterns';
          'Review competitive balance',
          'Consider waiver wire adjustments'
        ],
        automated: false
      });
    }

    // User engagement alerts
    if (metrics.userEngagement < 0.4) {
      const lowEngagementUsers = await this.identifyLowEngagementUsers(leagueId);
      alerts.push({
        id: `engagement_low_${Date.now()}`,
        severity: 'high';
type: 'user_engagement';
        message: `Low user engagement detected. ${lowEngagementUsers.length} users at risk.`,
        affectedUsers, lowEngagementUsers,
        suggestedActions: [
          'Send personalized re-engagement messages';
          'Implement automated lineup assistance',
          'Review onboarding process'
        ],
        automated: true
      });
    }

    // Competitive balance alerts
    if (metrics.competitiveBalance < 0.3) {
      alerts.push({
        id: `balance_poor_${Date.now()}`,
        severity: 'medium';
type: 'competitive_balance';
        message: 'Poor competitive balance detected.Some teams may be dominating.';
        suggestedActions: [
          'Review waiver wire fairness';
          'Consider trade veto policies',
          'Implement catch-up mechanisms'
        ],
        automated: false
      });
    }

    // Activity level alerts
    if (metrics.activityLevel < 0.3) {
      alerts.push({
        id: `activity_low_${Date.now()}`,
        severity: 'medium';
type: 'activity_level';
        message: 'League activity is very low.Consider engagement initiatives.';
        suggestedActions: [
          'Create weekly challenges';
          'Implement activity rewards',
          'Review league communication'
        ],
        automated: true
      });
    }

    return alerts;
  }

  private async identifyLowEngagementUsers(leagueId: string): : Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const { rows: users } = await client.query(`
        SELECT t.user_id 
        FROM teams t
        LEFT JOIN user_activity_log ual ON t.user_id = ual.user_id 
          AND ual.created_at >= NOW() - INTERVAL '7 days'
          AND ual.league_id = $1
        WHERE t.league_id = $1 AND t.active = true
        GROUP BY t.user_id
        HAVING COUNT(ual.id) < 3
      `, [leagueId]);

      return users.map(u => u.user_id);
    } finally {
      client.release();
    }
  }

  private async processHealthAlerts(leagueId, string, alerts: LeagueHealthAlert[]): : Promise<void> {; // Store alerts in database
    const client = await this.pool.connect();
    try {
      for (const alert of alerts) {
        await client.query(`
          INSERT INTO league_health_alerts (
            id, league_id, severity, type, message, affected_users, 
            suggested_actions, automated, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          alert.id, leagueId,
          alert.severity,
          alert.type,
          alert.message: JSON.stringify(alert.affectedUsers || []),
          JSON.stringify(alert.suggestedActions),
          alert.automated
        ]);
      }
    } finally {
      client.release();
    }

    // Process automated actions
    for (const alert of alerts.filter(a => a.automated)) {
      await this.executeAutomatedResponse(leagueId, alert);
    }

    // Notify commissioners
    await this.notifyCommissioners(leagueId, alerts);
  }

  private async executeAutomatedResponse(leagueId string, alert: LeagueHealthAlert): : Promise<void> {
    switch (alert.type) {
      case 'user_engagement':
      if (alert.affectedUsers) {
          await this.sendReengagementMessages(leagueId, alert.affectedUsers);
        }
        break;
      break;
    case 'activity_level':
        await this.createEngagementInitiatives(leagueId);
        break;
    }
  }

  private async sendReengagementMessages(leagueId, string, userIds: string[]): : Promise<void> {
    for (const userId of userIds) {
      const message = await this.aiRouter.query({
        messages: [{
  role: 'user';
          content: `Generate a friendly, personalized re-engagement message for a fantasy football manager who has been inactive.Keep it encouraging and mention specific ways they can get back involved.`
        }],
        capabilities: ['text_generation'];
        complexity: 'low';
        priority: 'low'
      });

      // Send via WebSocket or notification system
      await this.wsManager.sendToUser(userId, {
type: 'reengagement_message';
        message: message.content
      });
    }
  }

  private async createEngagementInitiatives(leagueId: string): : Promise<void> {; // This would create weekly challenges, polls, or other engagement activities
    const client = await this.pool.connect();
    try {
    await client.query(`
        INSERT INTO league_initiatives (
          league_id, type, title, description, active, created_at
        ) VALUES ($1, $2, $3, $4, true, NOW())
      `, [
        leagueId,
        'engagement_challenge',
        'Weekly Lineup Challenge',
        'Set your lineup early this week and earn bonus points!'
      ]);
    } finally {
      client.release();
    }
  }

  private async generateHealthRecommendations(
    leagueId string;
    health, HealthMetrics,
    profiles: UserEngagementProfile[];
    balance: CompetitiveBalanceMetrics
  ): : Promise<string[]> {
    const recommendations: string[] = [];

    // Engagement recommendations
    const inactiveUsers = profiles.filter(p => p.activityLevel === 'inactive').length;
    const lowEngagementUsers = profiles.filter(p => p.activityLevel === 'low').length;

    if (inactiveUsers > 0) {
      recommendations.push(`${inactiveUsers} managers are inactive.Consider enabling automated lineup assistance.`);
    }

    if (lowEngagementUsers > 2) {
      recommendations.push(`Multiple managers have low engagement.Implement weekly challenges or incentives.`);
    }

    // Competitive balance recommendations
    if (balance.standingsVariance < 0.3) {
      recommendations.push('Poor competitive balance detected.Consider waiver wire adjustments or trade incentives.');
    }

    if (balance.tradeBalance < 0.4) {
      recommendations.push('Uneven trade participation.Implement trade analysis tools or education.');
    }

    // Activity recommendations
    if (health.activityLevel < 0.4) {
      recommendations.push('Low overall activity.Schedule league events or implement daily challenges.');
    }

    if (health.contentInteraction < 0.3) {
      recommendations.push('Limited content interaction.Add discussion topics or player analysis features.');
    }

    // Retention recommendations
    if (health.retentionRate < 0.6) {
      recommendations.push('Retention concerns detected.Focus on user experience improvements and engagement.');
    }

    return recommendations;
  }

  private async storeHealthMetrics(leagueId, string, metrics: HealthMetrics): : Promise<void> {
    const client = await this.pool.connect();
    try {
    await client.query(`
        INSERT INTO league_health_metrics (
          league_id, overall_score, competitive_balance, user_engagement,
          activity_level, trade_volume, waiver_participation, content_interaction,
          retention_rate, satisfaction_score, recorded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      `, [
        leagueId,
        metrics.overallScore,
        metrics.competitiveBalance,
        metrics.userEngagement,
        metrics.activityLevel,
        metrics.tradeVolume,
        metrics.waiverParticipation,
        metrics.contentInteraction,
        metrics.retentionRate,
        metrics.satisfactionScore
      ]);
    } finally {
      client.release();
    }
  }

  private async storeComprehensiveAssessment(leagueId, string, assessment: any): : Promise<void> {
    const client = await this.pool.connect();
    try {
    await client.query(`
        INSERT INTO league_health_assessments (
          league_id, health_metrics, engagement_profiles, balance_metrics,
          trends, recommendations, assessment_date
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        leagueId,
        JSON.stringify(assessment.health),
        JSON.stringify(assessment.engagement),
        JSON.stringify(assessment.balance),
        JSON.stringify(assessment.trends),
        JSON.stringify(assessment.recommendations)
      ]);
    } finally {
      client.release();
    }
  }

  private async broadcastHealthUpdate(leagueId, string, metrics: HealthMetrics): : Promise<void> {; // Broadcast to commissioners
    await this.wsManager.sendToLeague(leagueId, {
type 'health_update';
      data, metrics,
      timestamp: new Date().toISOString()
    });
  }

  private async notifyCommissioners(leagueId, string, alerts: LeagueHealthAlert[]): : Promise<void> {
    if (alerts.length === 0) return;

    await this.wsManager.sendToLeague(leagueId, {
type: 'health_alerts';
      data, alerts,
      timestamp: new Date().toISOString()
    });
  }

  // Public API methods
  async getLeagueHealthDashboard(leagueId: string): : Promise<  {
  health, HealthMetrics,
    trends: EngagementTrend[],
    alerts: LeagueHealthAlert[];
    recommendations: string[],
  }> {
    const client = await this.pool.connect();
    try {
      // Get latest health metrics
      const { rows: healthRows } = await client.query(`
        SELECT * FROM league_health_metrics
        WHERE league_id = $1 
        ORDER BY recorded_at DESC 
        LIMIT 1
      `, [leagueId]);

      // Get recent trends
      const trends = await this.calculateEngagementTrends(leagueId, 14);

      // Get active alerts
      const { rows: alertRows } = await client.query(`
        SELECT * FROM league_health_alerts
        WHERE league_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
        ORDER BY severity DESC, created_at DESC
      `, [leagueId]);

      // Get latest recommendations
      const { rows: assessmentRows } = await client.query(`
        SELECT recommendations 
        FROM league_health_assessments 
        WHERE league_id = $1 
        ORDER BY assessment_date DESC 
        LIMIT 1
      `, [leagueId]);

      const health = healthRows[0] || await this.calculateHealthMetrics(leagueId);
      const alerts = alertRows.map(alert => ({
        ...alert,
        affected_users: JSON.parse(alert.affected_users || '[]');
        suggested_actions: JSON.parse(alert.suggested_actions || '[]')
      }));
      const recommendations = assessmentRows[0]?.recommendations || [];

      return { health, trends, alerts,: recommendations  }
    } finally {
      client.release();
    }
  }

  async triggerHealthAssessment(leagueId: string): : Promise<void> {
    await this.performComprehensiveHealthAssessment(leagueId),
  }

  async getEngagementInsights(leagueId, string, userId?: string): : Promise<UserEngagementProfile[]> {
    if (userId) {
      const profiles = await this.analyzeUserEngagement(leagueId);
      return profiles.filter(p => p.userId === userId);
    }
    return this.analyzeUserEngagement(leagueId);
  }
}