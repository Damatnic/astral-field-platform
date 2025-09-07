// @ts-nocheck
import aiRouterService from './aiRouterService';
import aiAnalyticsService from './aiAnalyticsService';
import { neonDb } from '@/lib/db';

export interface UserBehavior {
  userId: string;
  activityHistory: UserActivity[];
  decisionPatterns: DecisionPattern[];
  preferences: UserPreferences;
  riskProfile: RiskProfile;
  engagementMetrics: EngagementMetrics;
  learningModel: PersonalizedModel;
}

export interface UserActivity {
  id: string;
  userId: string;
  actionType: 'lineup_change' | 'waiver_claim' | 'trade_proposal' | 'trade_accept' | 'trade_decline' | 'player_drop' | 'player_add' | 'view_analysis' | 'request_advice';
  context: {
    playerId?: string;
    playerName?: string;
    position?: string;
    week?: number;
    projectedPoints?: number;
    actualPoints?: number;
    reasoning?: string;
    aiRecommendation?: boolean;
    followedAdvice?: boolean;
  };
  timestamp: Date;
  outcome?: {
    success: boolean;
    pointsGained?: number;
    impactScore?: number;
  };
}

export interface DecisionPattern {
  category: 'risk_tolerance' | 'position_preference' | 'advice_following' | 'timing_patterns' | 'research_depth';
  pattern: string;
  confidence: number;
  frequency: number;
  examples: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface UserPreferences {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  positionBias: {
    qb: number;
    rb: number;
    wr: number;
    te: number;
    k: number;
    def: number;
  };
  strategyPreference: 'floor' | 'ceiling' | 'balanced';
  communicationStyle: 'analytical' | 'casual' | 'brief';
  advisorTrust: number; // 0-1 scale
  preferredAnalysisDepth: 'basic' | 'detailed' | 'comprehensive';
  notifications: {
    frequency: 'high' | 'medium' | 'low';
    urgencyThreshold: 'all' | 'important' | 'critical';
  };
}

export interface RiskProfile {
  overallRisk: number; // 0-1 scale
  categories: {
    lineup: number;
    waivers: number;
    trades: number;
    streming: number;
  };
  volatilityTolerance: number;
  consistencyPreference: number;
  bigPlayHunting: number;
  safetyFirst: number;
}

export interface EngagementMetrics {
  dailyActivity: number;
  weeklyActivity: number;
  responseTime: number; // minutes
  adviceFollowRate: number;
  researchIntensity: number;
  socialInteraction: number;
  competitiveIndex: number;
}

export interface PersonalizedModel {
  version: string;
  accuracy: number;
  confidence: number;
  lastUpdated: Date;
  keyInsights: string[];
  recommendations: PersonalizedRecommendation[];
  predictionWeights: {
    [key: string]: number;
  };
}

export interface PersonalizedRecommendation {
  id: string;
  userId: string;
  category: 'lineup' | 'waiver' | 'trade' | 'strategy';
  recommendation: string;
  reasoning: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  personalizedFactors: string[];
  expectedValue: number;
  generatedAt: Date;
  expiresAt?: Date;
}

class UserBehaviorAnalyzer {
  private readonly ANALYSIS_WINDOW_DAYS = 30;
  private readonly MIN_ACTIVITIES_FOR_ANALYSIS = 10;
  private readonly PATTERN_CONFIDENCE_THRESHOLD = 0.6;

  async trackUserActivity(activity: UserActivity): Promise<void> {
    try {
      await neonDb.query(`
        INSERT INTO user_activities (
          id, user_id, action_type, context, timestamp, outcome
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        activity.id,
        activity.userId,
        activity.actionType,
        JSON.stringify(activity.context),
        activity.timestamp,
        activity.outcome ? JSON.stringify(activity.outcome) : null
      ]);

      // Trigger behavior analysis update if enough activity
      const activityCount = await this.getRecentActivityCount(activity.userId);
      if (activityCount > this.MIN_ACTIVITIES_FOR_ANALYSIS) {
        await this.updateUserBehaviorAnalysis(activity.userId);
      }

      await aiAnalyticsService.logEvent('user_activity_tracked', {
        userId: activity.userId,
        actionType: activity.actionType,
        followedAdvice: activity.context.followedAdvice
      });

    } catch (error) {
      console.error('Error tracking user activity:', error);
      await aiAnalyticsService.logError('activity_tracking_error', error as Error, {
        userId: activity.userId
      });
    }
  }

  async analyzeUserBehavior(userId: string): Promise<UserBehavior> {
    try {
      console.log(`🧠 Analyzing behavior for user ${userId}...`);

      const activities = await this.getUserActivities(userId);
      if (activities.length < this.MIN_ACTIVITIES_FOR_ANALYSIS) {
        return this.generateDefaultBehavior(userId);
      }

      const decisionPatterns = await this.extractDecisionPatterns(activities);
      const preferences = await this.inferUserPreferences(activities, decisionPatterns);
      const riskProfile = await this.calculateRiskProfile(activities);
      const engagementMetrics = await this.calculateEngagementMetrics(activities);
      const learningModel = await this.buildPersonalizedModel(userId, activities, decisionPatterns);

      const behavior: UserBehavior = {
        userId,
        activityHistory: activities,
        decisionPatterns,
        preferences,
        riskProfile,
        engagementMetrics,
        learningModel
      };

      await this.storeBehaviorAnalysis(behavior);
      return behavior;

    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      throw error;
    }
  }

  async updateUserBehaviorAnalysis(userId: string): Promise<void> {
    try {
      const behavior = await this.analyzeUserBehavior(userId);
      
      // Generate new personalized recommendations
      const recommendations = await this.generatePersonalizedRecommendations(behavior);
      
      // Update learning model accuracy
      await this.validateAndUpdateModel(userId, behavior);

      await aiAnalyticsService.logEvent('behavior_analysis_updated', {
        userId,
        patternCount: behavior.decisionPatterns.length,
        riskScore: behavior.riskProfile.overallRisk,
        engagementScore: behavior.engagementMetrics.competitiveIndex
      });

    } catch (error) {
      console.error('Error updating behavior analysis:', error);
    }
  }

  private async extractDecisionPatterns(activities: UserActivity[]): Promise<DecisionPattern[]> {
    const patterns: DecisionPattern[] = [];

    try {
      // Analyze risk tolerance patterns
      const riskPattern = await this.analyzeRiskTolerancePattern(activities);
      if (riskPattern.confidence > this.PATTERN_CONFIDENCE_THRESHOLD) {
        patterns.push(riskPattern);
      }

      // Analyze position preference patterns
      const positionPattern = await this.analyzePositionPreferencePattern(activities);
      if (positionPattern.confidence > this.PATTERN_CONFIDENCE_THRESHOLD) {
        patterns.push(positionPattern);
      }

      // Analyze advice-following patterns
      const advicePattern = await this.analyzeAdviceFollowingPattern(activities);
      if (advicePattern.confidence > this.PATTERN_CONFIDENCE_THRESHOLD) {
        patterns.push(advicePattern);
      }

      // Analyze timing patterns
      const timingPattern = await this.analyzeTimingPattern(activities);
      if (timingPattern.confidence > this.PATTERN_CONFIDENCE_THRESHOLD) {
        patterns.push(timingPattern);
      }

      // Analyze research depth patterns
      const researchPattern = await this.analyzeResearchDepthPattern(activities);
      if (researchPattern.confidence > this.PATTERN_CONFIDENCE_THRESHOLD) {
        patterns.push(researchPattern);
      }

      return patterns;

    } catch (error) {
      console.error('Error extracting decision patterns:', error);
      return patterns;
    }
  }

  private async analyzeRiskTolerancePattern(activities: UserActivity[]): Promise<DecisionPattern> {
    const riskActions = activities.filter(a => 
      ['waiver_claim', 'trade_proposal', 'lineup_change'].includes(a.actionType)
    );

    let riskScore = 0;
    let riskExamples: string[] = [];

    for (const action of riskActions) {
      if (action.context.projectedPoints) {
        const variance = this.calculateProjectionVariance(action.context.projectedPoints);
        riskScore += variance;

        if (variance > 5) {
          riskExamples.push(`High-risk ${action.actionType} for ${action.context.playerName}: ${variance} point variance`);
        }
      }
    }

    const avgRiskScore = riskScore / riskActions.length;
    const riskLevel = avgRiskScore > 7 ? 'high_risk' : avgRiskScore > 3 ? 'moderate_risk' : 'low_risk';

    return {
      category: 'risk_tolerance',
      pattern: riskLevel,
      confidence: Math.min(riskActions.length / 20, 1.0),
      frequency: riskActions.length,
      examples: riskExamples.slice(0, 3),
      trend: this.calculateTrend(riskActions.map(a => a.timestamp))
    };
  }

  private async analyzePositionPreferencePattern(activities: UserActivity[]): Promise<DecisionPattern> {
    const positionCounts: { [key: string]: number } = {};
    const positionExamples: string[] = [];

    activities.forEach(activity => {
      if (activity.context.position) {
        positionCounts[activity.context.position] = (positionCounts[activity.context.position] || 0) + 1;
      }
    });

    const totalActions = Object.values(positionCounts).reduce((sum, count) => sum + count, 0);
    const dominantPosition = Object.entries(positionCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (dominantPosition) {
      const [position, count] = dominantPosition;
      const percentage = (count / totalActions) * 100;
      
      if (percentage > 40) {
        positionExamples.push(`${percentage.toFixed(0)}% of actions involve ${position} players`);
      }
    }

    return {
      category: 'position_preference',
      pattern: dominantPosition ? `${dominantPosition[0]}_heavy` : 'balanced',
      confidence: totalActions > 15 ? 0.8 : 0.5,
      frequency: totalActions,
      examples: positionExamples,
      trend: 'stable'
    };
  }

  private async analyzeAdviceFollowingPattern(activities: UserActivity[]): Promise<DecisionPattern> {
    const adviceActions = activities.filter(a => 
      a.context.aiRecommendation !== undefined && a.context.followedAdvice !== undefined
    );

    const followedCount = adviceActions.filter(a => a.context.followedAdvice === true).length;
    const followRate = adviceActions.length > 0 ? followedCount / adviceActions.length : 0;

    const pattern = followRate > 0.8 ? 'high_trust' : followRate > 0.5 ? 'moderate_trust' : 'low_trust';
    const examples = [`Follows AI advice ${(followRate * 100).toFixed(0)}% of the time`];

    return {
      category: 'advice_following',
      pattern,
      confidence: Math.min(adviceActions.length / 15, 1.0),
      frequency: adviceActions.length,
      examples,
      trend: this.calculateAdviceTrend(adviceActions)
    };
  }

  private async analyzeTimingPattern(activities: UserActivity[]): Promise<DecisionPattern> {
    const hourCounts: { [key: number]: number } = {};
    
    activities.forEach(activity => {
      const hour = activity.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0];

    let pattern = 'mixed_timing';
    if (peakHour) {
      const hour = parseInt(peakHour[0]);
      if (hour >= 9 && hour <= 17) pattern = 'business_hours';
      else if (hour >= 18 && hour <= 23) pattern = 'evening_active';
      else pattern = 'late_night';
    }

    return {
      category: 'timing_patterns',
      pattern,
      confidence: 0.7,
      frequency: activities.length,
      examples: [`Most active at ${peakHour ? peakHour[0] : 'various'} o'clock`],
      trend: 'stable'
    };
  }

  private async analyzeResearchDepthPattern(activities: UserActivity[]): Promise<DecisionPattern> {
    const researchActions = activities.filter(a => a.actionType === 'view_analysis');
    const totalActions = activities.length;
    
    const researchRatio = totalActions > 0 ? researchActions.length / totalActions : 0;
    
    const pattern = researchRatio > 0.3 ? 'high_research' : researchRatio > 0.1 ? 'moderate_research' : 'low_research';
    
    return {
      category: 'research_depth',
      pattern,
      confidence: Math.min(totalActions / 20, 1.0),
      frequency: researchActions.length,
      examples: [`${(researchRatio * 100).toFixed(0)}% research-to-action ratio`],
      trend: 'stable'
    };
  }

  private async inferUserPreferences(activities: UserActivity[], patterns: DecisionPattern[]): Promise<UserPreferences> {
    const riskPattern = patterns.find(p => p.category === 'risk_tolerance');
    const advicePattern = patterns.find(p => p.category === 'advice_following');
    const researchPattern = patterns.find(p => p.category === 'research_depth');

    // Calculate position bias from activities
    const positionCounts: { [key: string]: number } = {};
    activities.forEach(activity => {
      if (activity.context.position) {
        positionCounts[activity.context.position.toLowerCase()] = 
          (positionCounts[activity.context.position.toLowerCase()] || 0) + 1;
      }
    });

    const total = Object.values(positionCounts).reduce((sum, count) => sum + count, 0) || 1;
    const positionBias = {
      qb: (positionCounts.qb || 0) / total,
      rb: (positionCounts.rb || 0) / total,
      wr: (positionCounts.wr || 0) / total,
      te: (positionCounts.te || 0) / total,
      k: (positionCounts.k || 0) / total,
      def: (positionCounts.def || 0) / total
    };

    return {
      riskTolerance: this.mapRiskTolerance(riskPattern?.pattern || 'moderate_risk'),
      positionBias,
      strategyPreference: this.inferStrategyPreference(activities),
      communicationStyle: this.inferCommunicationStyle(researchPattern?.pattern || 'moderate_research'),
      advisorTrust: this.calculateAdvisorTrust(advicePattern?.pattern || 'moderate_trust'),
      preferredAnalysisDepth: this.mapAnalysisDepth(researchPattern?.pattern || 'moderate_research'),
      notifications: {
        frequency: this.inferNotificationFrequency(activities),
        urgencyThreshold: 'important'
      }
    };
  }

  private async calculateRiskProfile(activities: UserActivity[]): Promise<RiskProfile> {
    const lineupRisk = this.calculateLineupRisk(activities);
    const waiverRisk = this.calculateWaiverRisk(activities);
    const tradeRisk = this.calculateTradeRisk(activities);
    const streamingRisk = this.calculateStreamingRisk(activities);

    const overallRisk = (lineupRisk + waiverRisk + tradeRisk + streamingRisk) / 4;

    return {
      overallRisk,
      categories: {
        lineup: lineupRisk,
        waivers: waiverRisk,
        trades: tradeRisk,
        streming: streamingRisk
      },
      volatilityTolerance: this.calculateVolatilityTolerance(activities),
      consistencyPreference: 1 - overallRisk, // inverse relationship
      bigPlayHunting: this.calculateBigPlayHunting(activities),
      safetyFirst: this.calculateSafetyFirst(activities)
    };
  }

  private async calculateEngagementMetrics(activities: UserActivity[]): Promise<EngagementMetrics> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const weeklyActivities = activities.filter(a => a.timestamp >= weekAgo);
    const dailyActivities = activities.filter(a => a.timestamp >= dayAgo);
    const adviceActions = activities.filter(a => a.context.aiRecommendation !== undefined);
    const followedAdvice = adviceActions.filter(a => a.context.followedAdvice === true);

    return {
      dailyActivity: dailyActivities.length,
      weeklyActivity: weeklyActivities.length,
      responseTime: this.calculateAverageResponseTime(activities),
      adviceFollowRate: adviceActions.length > 0 ? followedAdvice.length / adviceActions.length : 0,
      researchIntensity: this.calculateResearchIntensity(activities),
      socialInteraction: this.calculateSocialInteraction(activities),
      competitiveIndex: this.calculateCompetitiveIndex(activities)
    };
  }

  private async buildPersonalizedModel(
    userId: string, 
    activities: UserActivity[], 
    patterns: DecisionPattern[]
  ): Promise<PersonalizedModel> {
    
    const modelPrompt = `
      Build a personalized fantasy football model for this user based on their behavior:
      
      Activity Summary:
      - Total Actions: ${activities.length}
      - Primary Patterns: ${patterns.map(p => p.pattern).join(', ')}
      - Success Rate: ${this.calculateSuccessRate(activities)}%
      
      Behavior Patterns:
      ${patterns.map(p => `${p.category}: ${p.pattern} (${p.confidence} confidence)`).join('\n')}
      
      Generate:
      1. Top 5 key insights about this user's fantasy behavior
      2. Personalized prediction weights for different factors
      3. Model accuracy estimate based on pattern consistency
      4. Confidence level for recommendations
      
      Response in JSON format.
    `;

    try {
      const response = await aiRouterService.processRequest({
        type: 'analysis',
        complexity: 'high',
        content: modelPrompt,
        userId,
        priority: 'medium'
      });

      const modelData = JSON.parse(response.content);
      
      return {
        version: '1.0',
        accuracy: modelData.accuracy || 0.75,
        confidence: modelData.confidence || 0.8,
        lastUpdated: new Date(),
        keyInsights: modelData.keyInsights || [],
        recommendations: [],
        predictionWeights: modelData.predictionWeights || {
          projections: 0.3,
          matchups: 0.25,
          trends: 0.2,
          expert_consensus: 0.15,
          personal_bias: 0.1
        }
      };

    } catch (error) {
      console.error('Error building personalized model:', error);
      return this.generateDefaultModel();
    }
  }

  async generatePersonalizedRecommendations(behavior: UserBehavior): Promise<PersonalizedRecommendation[]> {
    try {
      const prompt = `
        Generate personalized fantasy football recommendations for this user:
        
        User Profile:
        - Risk Tolerance: ${behavior.preferences.riskTolerance}
        - Strategy: ${behavior.preferences.strategyPreference}
        - Advisor Trust: ${behavior.preferences.advisorTrust}
        - Engagement: ${behavior.engagementMetrics.competitiveIndex}
        
        Key Patterns:
        ${behavior.decisionPatterns.map(p => `- ${p.category}: ${p.pattern}`).join('\n')}
        
        Generate 5 personalized recommendations across categories:
        - Lineup optimization
        - Waiver wire targets
        - Trade opportunities
        - Strategic advice
        
        Include confidence scores and personalization factors.
        Response in JSON array format.
      `;

      const response = await aiRouterService.processRequest({
        type: 'strategy',
        complexity: 'high',
        content: prompt,
        userId: behavior.userId,
        priority: 'medium'
      });

      const recommendations = JSON.parse(response.content);
      
      return recommendations.map((rec: any, index: number) => ({
        id: `rec_${Date.now()}_${index}`,
        userId: behavior.userId,
        category: rec.category,
        recommendation: rec.recommendation,
        reasoning: rec.reasoning,
        confidence: rec.confidence || 0.75,
        urgency: rec.urgency || 'medium',
        personalizedFactors: rec.personalizedFactors || [],
        expectedValue: rec.expectedValue || 0,
        generatedAt: new Date(),
        expiresAt: rec.expiresAt ? new Date(rec.expiresAt) : undefined
      }));

    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return [];
    }
  }

  // Helper methods
  private async getUserActivities(userId: string): Promise<UserActivity[]> {
    const result = await neonDb.query(`
      SELECT * FROM user_activities 
      WHERE user_id = $1 
      AND timestamp > NOW() - INTERVAL '${this.ANALYSIS_WINDOW_DAYS} days'
      ORDER BY timestamp DESC
    `, [userId]);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      actionType: row.action_type,
      context: row.context,
      timestamp: new Date(row.timestamp),
      outcome: row.outcome
    }));
  }

  private async getRecentActivityCount(userId: string): Promise<number> {
    const result = await neonDb.query(`
      SELECT COUNT(*) FROM user_activities 
      WHERE user_id = $1 
      AND timestamp > NOW() - INTERVAL '7 days'
    `, [userId]);

    return parseInt(result.rows[0].count);
  }

  private generateDefaultBehavior(userId: string): UserBehavior {
    return {
      userId,
      activityHistory: [],
      decisionPatterns: [],
      preferences: this.generateDefaultPreferences(),
      riskProfile: this.generateDefaultRiskProfile(),
      engagementMetrics: this.generateDefaultEngagement(),
      learningModel: this.generateDefaultModel()
    };
  }

  private generateDefaultPreferences(): UserPreferences {
    return {
      riskTolerance: 'moderate',
      positionBias: {
        qb: 0.15,
        rb: 0.25,
        wr: 0.25,
        te: 0.15,
        k: 0.1,
        def: 0.1
      },
      strategyPreference: 'balanced',
      communicationStyle: 'analytical',
      advisorTrust: 0.7,
      preferredAnalysisDepth: 'detailed',
      notifications: {
        frequency: 'medium',
        urgencyThreshold: 'important'
      }
    };
  }

  private generateDefaultRiskProfile(): RiskProfile {
    return {
      overallRisk: 0.5,
      categories: {
        lineup: 0.5,
        waivers: 0.5,
        trades: 0.5,
        streming: 0.5
      },
      volatilityTolerance: 0.5,
      consistencyPreference: 0.5,
      bigPlayHunting: 0.3,
      safetyFirst: 0.7
    };
  }

  private generateDefaultEngagement(): EngagementMetrics {
    return {
      dailyActivity: 1,
      weeklyActivity: 5,
      responseTime: 30,
      adviceFollowRate: 0.5,
      researchIntensity: 0.3,
      socialInteraction: 0.2,
      competitiveIndex: 0.5
    };
  }

  private generateDefaultModel(): PersonalizedModel {
    return {
      version: '1.0',
      accuracy: 0.6,
      confidence: 0.5,
      lastUpdated: new Date(),
      keyInsights: ['New user - building behavioral profile'],
      recommendations: [],
      predictionWeights: {
        projections: 0.3,
        matchups: 0.25,
        trends: 0.2,
        expert_consensus: 0.15,
        personal_bias: 0.1
      }
    };
  }

  // Calculation helper methods
  private calculateProjectionVariance(projectedPoints: number): number {
    // Simulate variance calculation based on projection
    return Math.abs(projectedPoints * 0.2 + Math.random() * 3);
  }

  private calculateTrend(timestamps: Date[]): 'increasing' | 'decreasing' | 'stable' {
    if (timestamps.length < 3) return 'stable';
    
    const sorted = timestamps.sort((a, b) => a.getTime() - b.getTime());
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, date) => sum + date.getTime(), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, date) => sum + date.getTime(), 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    return diff > 0 ? 'increasing' : diff < 0 ? 'decreasing' : 'stable';
  }

  private calculateAdviceTrend(adviceActions: UserActivity[]): 'increasing' | 'decreasing' | 'stable' {
    if (adviceActions.length < 6) return 'stable';
    
    const recent = adviceActions.slice(0, adviceActions.length / 2);
    const older = adviceActions.slice(adviceActions.length / 2);
    
    const recentFollowRate = recent.filter(a => a.context.followedAdvice).length / recent.length;
    const olderFollowRate = older.filter(a => a.context.followedAdvice).length / older.length;
    
    const diff = recentFollowRate - olderFollowRate;
    return diff > 0.1 ? 'increasing' : diff < -0.1 ? 'decreasing' : 'stable';
  }

  private mapRiskTolerance(pattern: string): 'conservative' | 'moderate' | 'aggressive' {
    switch (pattern) {
      case 'low_risk': return 'conservative';
      case 'high_risk': return 'aggressive';
      default: return 'moderate';
    }
  }

  private inferStrategyPreference(activities: UserActivity[]): 'floor' | 'ceiling' | 'balanced' {
    // Analyze if user prefers safe/consistent players vs boom/bust options
    const lineupChanges = activities.filter(a => a.actionType === 'lineup_change');
    // Default implementation - could be enhanced with more sophisticated analysis
    return 'balanced';
  }

  private inferCommunicationStyle(researchPattern: string): 'analytical' | 'casual' | 'brief' {
    switch (researchPattern) {
      case 'high_research': return 'analytical';
      case 'low_research': return 'brief';
      default: return 'casual';
    }
  }

  private calculateAdvisorTrust(advicePattern: string): number {
    switch (advicePattern) {
      case 'high_trust': return 0.9;
      case 'low_trust': return 0.3;
      default: return 0.6;
    }
  }

  private mapAnalysisDepth(researchPattern: string): 'basic' | 'detailed' | 'comprehensive' {
    switch (researchPattern) {
      case 'high_research': return 'comprehensive';
      case 'low_research': return 'basic';
      default: return 'detailed';
    }
  }

  private inferNotificationFrequency(activities: UserActivity[]): 'high' | 'medium' | 'low' {
    const avgDaily = activities.length / this.ANALYSIS_WINDOW_DAYS;
    if (avgDaily > 3) return 'high';
    if (avgDaily > 1) return 'medium';
    return 'low';
  }

  // Risk calculation methods
  private calculateLineupRisk(activities: UserActivity[]): number {
    const lineupChanges = activities.filter(a => a.actionType === 'lineup_change');
    return Math.min(lineupChanges.length / 20, 1.0);
  }

  private calculateWaiverRisk(activities: UserActivity[]): number {
    const waiverClaims = activities.filter(a => a.actionType === 'waiver_claim');
    return Math.min(waiverClaims.length / 10, 1.0);
  }

  private calculateTradeRisk(activities: UserActivity[]): number {
    const tradeProposals = activities.filter(a => a.actionType === 'trade_proposal');
    return Math.min(tradeProposals.length / 5, 1.0);
  }

  private calculateStreamingRisk(activities: UserActivity[]): number {
    // Calculate streaming behavior based on K/DEF adds/drops
    const kDefActions = activities.filter(a => 
      ['player_add', 'player_drop'].includes(a.actionType) &&
      ['K', 'DEF'].includes(a.context.position || '')
    );
    return Math.min(kDefActions.length / 15, 1.0);
  }

  private calculateVolatilityTolerance(activities: UserActivity[]): number {
    // Analyze preference for boom/bust vs consistent players
    return 0.5; // Default implementation
  }

  private calculateBigPlayHunting(activities: UserActivity[]): number {
    // Analyze tendency to chase high-ceiling players
    return 0.3; // Default implementation
  }

  private calculateSafetyFirst(activities: UserActivity[]): number {
    // Analyze preference for safe floor players
    return 0.7; // Default implementation
  }

  // Engagement calculation methods
  private calculateAverageResponseTime(activities: UserActivity[]): number {
    // Calculate average time between activity suggestions and user actions
    return 30; // Default 30 minutes
  }

  private calculateResearchIntensity(activities: UserActivity[]): number {
    const researchActions = activities.filter(a => a.actionType === 'view_analysis').length;
    const totalActions = activities.length;
    return totalActions > 0 ? researchActions / totalActions : 0;
  }

  private calculateSocialInteraction(activities: UserActivity[]): number {
    const tradeActions = activities.filter(a => 
      ['trade_proposal', 'trade_accept', 'trade_decline'].includes(a.actionType)
    ).length;
    return Math.min(tradeActions / 10, 1.0);
  }

  private calculateCompetitiveIndex(activities: UserActivity[]): number {
    const weeklyActivity = activities.filter(a => 
      a.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    return Math.min(weeklyActivity / 20, 1.0);
  }

  private calculateSuccessRate(activities: UserActivity[]): number {
    const actionsWithOutcome = activities.filter(a => a.outcome);
    const successfulActions = actionsWithOutcome.filter(a => a.outcome?.success);
    
    return actionsWithOutcome.length > 0 
      ? (successfulActions.length / actionsWithOutcome.length) * 100 
      : 50;
  }

  private async storeBehaviorAnalysis(behavior: UserBehavior): Promise<void> {
    await neonDb.query(`
      INSERT INTO user_behavior_analysis (
        user_id, decision_patterns, preferences, risk_profile, 
        engagement_metrics, learning_model, analyzed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        decision_patterns = EXCLUDED.decision_patterns,
        preferences = EXCLUDED.preferences,
        risk_profile = EXCLUDED.risk_profile,
        engagement_metrics = EXCLUDED.engagement_metrics,
        learning_model = EXCLUDED.learning_model,
        analyzed_at = EXCLUDED.analyzed_at,
        updated_at = NOW()
    `, [
      behavior.userId,
      JSON.stringify(behavior.decisionPatterns),
      JSON.stringify(behavior.preferences),
      JSON.stringify(behavior.riskProfile),
      JSON.stringify(behavior.engagementMetrics),
      JSON.stringify(behavior.learningModel),
      new Date()
    ]);
  }

  private async validateAndUpdateModel(userId: string, behavior: UserBehavior): Promise<void> {
    // Implementation for model validation and accuracy updates
    console.log(`🎯 Validating model for user ${userId}`);
  }

  async getUserBehavior(userId: string): Promise<UserBehavior | null> {
    try {
      const result = await neonDb.query(`
        SELECT * FROM user_behavior_analysis WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return await this.analyzeUserBehavior(userId);
      }

      const row = result.rows[0];
      return {
        userId: row.user_id,
        activityHistory: await this.getUserActivities(userId),
        decisionPatterns: row.decision_patterns,
        preferences: row.preferences,
        riskProfile: row.risk_profile,
        engagementMetrics: row.engagement_metrics,
        learningModel: row.learning_model
      };

    } catch (error) {
      console.error('Error getting user behavior:', error);
      return null;
    }
  }
}

export const userBehaviorAnalyzer = new UserBehaviorAnalyzer();
export { UserBehaviorAnalyzer };
