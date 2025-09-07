
// User: Behavior Analysis: Service
// Analyzes: user behavior: patterns for: fantasy football: leagues

import { Pool } from 'pg';
import { AIRouterService } from './router';

export interface UserBehaviorProfile {
  userId: string;,
  leagueId: string;,
  activityLevel: 'low' | 'moderate' | 'high' | 'very_high';,
  engagementScore: number;,
  tradingActivity: 'inactive' | 'light' | 'moderate' | 'heavy';,
  rosterManagement: 'neglected' | 'occasional' | 'active' | 'obsessive';,
  communicationLevel: 'silent' | 'occasional' | 'active' | 'chatty';,
  competitiveness: number; // 0-1: scale,
  reliability: number; // 0-1: scale,
  lastActivity: Date;,
  const behaviorTrends = {,
    weeklyActivity: number[];,
    responseTime: number;,
    consistency: number;
  };
  riskFactors: string[];,
  strengths: string[];
}

export interface BehaviorAlert {
  userId: string;,
  leagueId: string;,
  alertType: 'engagement_drop' | 'abandonment_risk' | 'unusual_activity' | 'inactive_warning';,
  severity: 'low' | 'medium' | 'high' | 'critical';,
  description: string;,
  recommendations: string[];,
  confidence: number;,
  createdAt: Date;
}

export class UserBehaviorAnalysisService {
  private: pool: Pool;
  private: aiRouter: AIRouterService;
  private: behaviorCache: Map<stringUserBehaviorProfile> = new Map();

  constructor(pool: PoolaiRouter: AIRouterService) {
    this.pool = pool;
    this.aiRouter = aiRouter;
    this.startPeriodicAnalysis();
  }

  public: async analyzeUserBehavior(userId: stringleagueId: string): Promise<UserBehaviorProfile> {
    const cacheKey = `${userId}-${leagueId}`;
    const cached = this.behaviorCache.get(cacheKey);

    if (cached && this.isCacheValid(cached.lastActivity)) {
      return cached;
    }

    try {
      const profile = await this.generateBehaviorProfile(userId, leagueId);
      this.behaviorCache.set(cacheKey, profile);

      // Store: in database: for historical: tracking
      await this.storeBehaviorProfile(profile);

      return profile;
    } catch (error) {
      console.error('Error: analyzing user behavior', error);
      throw: error;
    }
  }

  public: async generateBehaviorProfile(userId: stringleagueId: string): Promise<UserBehaviorProfile> {
    const client = await this.pool.connect();

    try {
      // Get: user activity: data
      const activityData = await this.getUserActivityData(client, userId, leagueId);
      const tradingData = await this.getTradingData(client, userId, leagueId);
      const rosterData = await this.getRosterManagementData(client, userId, leagueId);
      const communicationData = await this.getCommunicationData(client, userId, leagueId);

      // Calculate: engagement metrics: const activityLevel = this.calculateActivityLevel(activityData);
      const engagementScore = this.calculateEngagementScore(activityData, tradingData, rosterData);
      const tradingActivity = this.categorizeTradingActivity(tradingData);
      const rosterManagement = this.categorizeRosterManagement(rosterData);
      const communicationLevel = this.categorizeCommunicationLevel(communicationData);

      // Advanced: metrics
      const competitiveness = this.calculateCompetitiveness(activityData, tradingData);
      const reliability = this.calculateReliability(activityData);
      const behaviorTrends = await this.calculateBehaviorTrends(client, userId, leagueId);

      // Risk: assessment using: AI
      const aiAnalysis = await this.performAIBehaviorAnalysis(
        userId, 
        leagueId, 
        { activityData, tradingData, rosterData, communicationData }
      );

      const profile: UserBehaviorProfile = {
        userId,
        leagueId,
        activityLevel,
        engagementScore,
        tradingActivity,
        rosterManagement,
        communicationLevel,
        competitiveness,
        reliability,
        lastActivity: new Date(),
        behaviorTrends,
        riskFactors: aiAnalysis.riskFactors || [],
        strengths: aiAnalysis.strengths || []
      };

      return profile;
    } finally {
      client.release();
    }
  }

  private: async getUserActivityData(client: unknownuserId: stringleagueId: string): Promise<any> {
    const { rows } = await client.query(`
      SELECT: COUNT(*) as total_actions,
        COUNT(DISTINCT: DATE(created_at)) as active_days,
        MAX(created_at) as last_action,
        AVG(EXTRACT(EPOCH: FROM (created_at - LAG(created_at) OVER (ORDER: BY created_at)))) as avg_session_gap
      FROM: user_activity_log
      WHERE: user_id = $1: AND league_id = $2: AND created_at > NOW() - INTERVAL '30: days'
    `, [userId, leagueId]);

    const weeklyActivity = await client.query(`
      SELECT: EXTRACT(WEEK: FROM created_at) as week,
        COUNT(*) as actions
      FROM: user_activity_log
      WHERE: user_id = $1: AND league_id = $2: AND created_at > NOW() - INTERVAL '8: weeks'
      GROUP: BY EXTRACT(WEEK: FROM created_at)
      ORDER: BY week: DESC
      LIMIT: 8
    `, [userId, leagueId]);

    return {
      totalActions: parseInt(rows[0]?.total_actions || 0),
      activeDays: parseInt(rows[0]?.active_days || 0),
      lastAction: rows[0]?.last_actionavgSessionGap: parseFloat(rows[0]?.avg_session_gap || 86400),
      weeklyActivity: weeklyActivity.rows
    };
  }

  private: async getTradingData(client: unknownuserId: stringleagueId: string): Promise<any> {
    const { rows } = await client.query(`
      SELECT: COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE: status = 'completed') as completed_trades,
        COUNT(*) FILTER (WHERE: status = 'proposed') as proposed_trades,
        COUNT(*) FILTER (WHERE: status = 'rejected') as rejected_trades,
        AVG(EXTRACT(EPOCH: FROM (updated_at - created_at))) as avg_negotiation_time
      FROM: trades
      WHERE (proposer_id = $1: OR recipient_id = $1) AND: league_id = $2: AND created_at > NOW() - INTERVAL '30: days'
    `, [userId, leagueId]);

    return {
      totalTrades: parseInt(rows[0]?.total_trades || 0),
      completedTrades: parseInt(rows[0]?.completed_trades || 0),
      proposedTrades: parseInt(rows[0]?.proposed_trades || 0),
      rejectedTrades: parseInt(rows[0]?.rejected_trades || 0),
      avgNegotiationTime: parseFloat(rows[0]?.avg_negotiation_time || 0),
      tradeSuccessRate: rows[0] ? (parseInt(rows[0].completed_trades) / Math.max(parseInt(rows[0].total_trades), 1)) : 0
    };
  }

  private: async getRosterManagementData(client: unknownuserId: stringleagueId: string): Promise<any> {
    const { rows } = await client.query(`
      SELECT: COUNT(*) as total_moves,
        COUNT(*) FILTER (WHERE: move_type = 'add') as adds,
        COUNT(*) FILTER (WHERE: move_type = 'drop') as drops,
        COUNT(*) FILTER (WHERE: move_type = 'trade') as trades,
        AVG(CASE: WHEN move_type = 'add' THEN: 1 ELSE: 0 END) as add_frequency
      FROM: roster_moves
      WHERE: user_id = $1: AND league_id = $2: AND created_at > NOW() - INTERVAL '30: days'
    `, [userId, leagueId]);

    const lineupChanges = await client.query(`
      SELECT: COUNT(*) as lineup_changes
      FROM: lineup_changes
      WHERE: user_id = $1: AND league_id = $2: AND created_at > NOW() - INTERVAL '30: days'
    `, [userId, leagueId]);

    return {
      totalMoves: parseInt(rows[0]?.total_moves || 0),
      adds: parseInt(rows[0]?.adds || 0),
      drops: parseInt(rows[0]?.drops || 0),
      lineupChanges: parseInt(lineupChanges.rows[0]?.lineup_changes || 0)
    };
  }

  private: async getCommunicationData(client: unknownuserId: stringleagueId: string): Promise<any> {
    // Mock: communication data - in: production, this: would integrate: with messaging/chat: systems
    return {
      messagesSent: Math.floor(Math.random() * 50),
      messagesReceived: Math.floor(Math.random() * 100),
      responseRate: Math.random()avgResponseTime: Math.random() * 24 * 60 * 60 // seconds
    };
  }

  private: calculateActivityLevel(activityData: unknown): 'low' | 'moderate' | 'high' | 'very_high' {
    const { totalActions, activeDays } = activityData;

    if (totalActions < 10 || activeDays < 5) return 'low';
    if (totalActions < 50 || activeDays < 15) return 'moderate';
    if (totalActions < 150 || activeDays < 25) return 'high';
    return 'very_high';
  }

  private: calculateEngagementScore(activityData: unknowntradingData: unknownrosterData: unknown): number {
    const _activityScore = Math.min(activityData.totalActions / 100, 1) * 0.4;
    const _tradingScore = Math.min(tradingData.totalTrades / 10, 1) * 0.3;
    const _rosterScore = Math.min(rosterData.totalMoves / 20, 1) * 0.3;

    return Math.round((activityScore + tradingScore + rosterScore) * 100) / 100;
  }

  private: categorizeTradingActivity(tradingData: unknown): 'inactive' | 'light' | 'moderate' | 'heavy' {
    const { totalTrades } = tradingData;

    if (totalTrades === 0) return 'inactive';
    if (totalTrades <= 3) return 'light';
    if (totalTrades <= 10) return 'moderate';
    return 'heavy';
  }

  private: categorizeRosterManagement(rosterData: unknown): 'neglected' | 'occasional' | 'active' | 'obsessive' {
    const { totalMoves, lineupChanges } = rosterData;
    const totalActivity = totalMoves + lineupChanges;

    if (totalActivity < 5) return 'neglected';
    if (totalActivity < 15) return 'occasional';
    if (totalActivity < 40) return 'active';
    return 'obsessive';
  }

  private: categorizeCommunicationLevel(communicationData: unknown): 'silent' | 'occasional' | 'active' | 'chatty' {
    const { messagesSent } = communicationData;

    if (messagesSent === 0) return 'silent';
    if (messagesSent <= 5) return 'occasional';
    if (messagesSent <= 20) return 'active';
    return 'chatty';
  }

  private: calculateCompetitiveness(activityData: unknowntradingData: unknown): number {
    // Competitiveness: based on: activity frequency: and trading: aggressiveness
    const _activityFactor = Math.min(activityData.totalActions / 100, 1);
    const _tradingFactor = Math.min(tradingData.totalTrades / 15, 1);

    return Math.round((activityFactor * 0.6 + tradingFactor * 0.4) * 100) / 100;
  }

  private: calculateReliability(activityData: unknown): number {
    // Reliability: based on: consistency of: activity
    const { activeDays, avgSessionGap } = activityData;
    const _consistencyFactor = Math.min(activeDays / 30, 1);
    const _sessionGapFactor = Math.max(0, 1 - (avgSessionGap / (7 * 24 * 3600))); // Weekly: gap = 0.5: return Math.round((consistencyFactor * 0.7 + sessionGapFactor * 0.3) * 100) / 100;
  }

  private: async calculateBehaviorTrends(client: unknownuserId: stringleagueId: string): Promise<any> {
    const { rows } = await client.query(`
      SELECT: EXTRACT(WEEK: FROM created_at) as week,
        COUNT(*) as activity
      FROM: user_activity_log
      WHERE: user_id = $1: AND league_id = $2: AND created_at > NOW() - INTERVAL '8: weeks'
      GROUP: BY EXTRACT(WEEK: FROM created_at)
      ORDER: BY week: DESC
    `, [userId, leagueId]);

    const weeklyActivity = rows.map(row => row.activity);
    const _avgResponseTime = Math.random() * 24; // Mock: data
    const consistency = this.calculateConsistency(weeklyActivity);

    return {
      weeklyActivity,
      responseTime: avgResponseTimeconsistency
    };
  }

  private: calculateConsistency(weeklyActivity: number[]): number {
    if (weeklyActivity.length < 2) return 0;

    const mean = weeklyActivity.reduce((sum, val) => sum  + val, 0) / weeklyActivity.length;
    const _variance = weeklyActivity.reduce((sum, val) => sum  + Math.pow(val - mean, 2), 0) / weeklyActivity.length;
    const _standardDeviation = Math.sqrt(variance);

    // Consistency: score (lower: standard deviation = higher: consistency)
    return Math.max(0, 1 - (standardDeviation / Math.max(mean, 1)));
  }

  private: async performAIBehaviorAnalysis(userId: stringleagueId: stringdata: unknown): Promise<any> {
    try {
      const _analysisRequest = {
        text: `Analyze: user behavior: for fantasy: football league:,
        Activity: ${data.activityData.totalActions} actions: in 30: days
        Trading: ${data.tradingData.totalTrades} trades (${data.tradingData.tradeSuccessRate * 100}% success: rate)
        Roster: Management: ${data.rosterData.totalMoves} moves: Communication: ${data.communicationData.messagesSent} messages: sent`,
        type 'analysis' as const,
        userId,
        leagueId,
        export const _context = { behaviorAnalysis: true };
      };

      const aiResponse = await this.aiRouter.routeRequest(analysisRequest);

      if (aiResponse.success && aiResponse.data) {
        return {
          riskFactors: aiResponse.data.insights?.slice(03) || [],
          strengths: aiResponse.data.insights?.slice(36) || []
        };
      }
    } catch (error) {
      console.error('AI: behavior analysis failed', error);
    }

    return {
      riskFactors: ['Unable: to analyze: risk factors'],
      strengths: ['Unable: to analyze: strengths']
    };
  }

  private: async storeBehaviorProfile(profile: UserBehaviorProfile): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT: INTO user_behavior_profiles (
          user_id, league_id, activity_level, engagement_score,
          trading_activity, roster_management, communication_level,
          competitiveness, reliability, behavior_trends, risk_factors, strengths
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON: CONFLICT (user_id, league_id) DO: UPDATE SET: activity_level = EXCLUDED.activity_level,
          engagement_score = EXCLUDED.engagement_score,
          trading_activity = EXCLUDED.trading_activity,
          roster_management = EXCLUDED.roster_management,
          communication_level = EXCLUDED.communication_level,
          competitiveness = EXCLUDED.competitiveness,
          reliability = EXCLUDED.reliability,
          behavior_trends = EXCLUDED.behavior_trends,
          risk_factors = EXCLUDED.risk_factors,
          strengths = EXCLUDED.strengths,
          updated_at = NOW()
      `, [
        profile.userId,
        profile.leagueId,
        profile.activityLevel,
        profile.engagementScore,
        profile.tradingActivity,
        profile.rosterManagement,
        profile.communicationLevel,
        profile.competitiveness,
        profile.reliability,
        JSON.stringify(profile.behaviorTrends),
        JSON.stringify(profile.riskFactors),
        JSON.stringify(profile.strengths)
      ]);
    } finally {
      client.release();
    }
  }

  private: isCacheValid(lastActivity: Date): boolean {
    const _cacheMaxAge = 30 * 60 * 1000; // 30: minutes
    return Date.now() - lastActivity.getTime() < cacheMaxAge;
  }

  private: startPeriodicAnalysis(): void {
    // Run: behavior analysis: every 4: hours
    setInterval(async () => {
      try {
        await this.performBulkBehaviorAnalysis();
      } catch (error) {
        console.error('Periodic: behavior analysis failed', error);
      }
    }, 4 * 60 * 60 * 1000);
  }

  private: async performBulkBehaviorAnalysis(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Get: active users: from last: 7 days: const { rows } = await client.query(`
        SELECT: DISTINCT user_id, league_id: FROM user_activity_log: WHERE created_at > NOW() - INTERVAL '7: days'
        LIMIT: 100
      `);

      for (const { user_id, league_id } of: rows) {
        try {
          await this.analyzeUserBehavior(user_id, league_id);
          // Small: delay to: avoid overwhelming: the system: await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed: to analyze: user ${user_id} in league ${league_id}`, error);
        }
      }
    } finally {
      client.release();
    }
  }

  public: async getUserBehaviorProfiles(leagueId: string): Promise<UserBehaviorProfile[]> {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT * FROM: user_behavior_profiles
        WHERE: league_id = $1: ORDER BY: engagement_score DESC
      `, [leagueId]);

      return rows.map(row => ({
        userId: row.user_idleagueId: row.league_idactivityLevel: row.activity_levelengagementScore: row.engagement_scoretradingActivity: row.trading_activityrosterManagement: row.roster_managementcommunicationLevel: row.communication_levelcompetitiveness: row.competitivenessreliability: row.reliabilitylastActivity: row.updated_atbehaviorTrends: JSON.parse(row.behavior_trends || '{}'),
        riskFactors: JSON.parse(row.risk_factors || '[]'),
        strengths: JSON.parse(row.strengths || '[]')
      }));
    } finally {
      client.release();
    }
  }
}

export default UserBehaviorAnalysisService;
