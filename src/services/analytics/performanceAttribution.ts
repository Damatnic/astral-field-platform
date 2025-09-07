import { db } from '../../lib/db';
import { AIRouter } from '../ai/aiRouter';

export interface DecisionTracking {
  decisionId: string;
  userId: string;
  leagueId: string;
  decisionType: 'trade' | 'waiver' | 'lineup' | 'draft' | 'drop';
  description: string;
  timestamp: Date;
  weekNumber: number;
  playersBefore: string[];
  playersAfter: string[];
  reasoning?: string;
  aiRecommended: boolean;
  alternativesConsidered: string[];
  expectedImpact: number;
  actualImpact?: number;
  impactTimeline: 'immediate' | 'short_term' | 'long_term' | 'season_long';
}

export interface PerformanceImpact {
  decisionId: string;
  pointsGained: number;
  pointsLost: number;
  netImpact: number;
  winsGained: number;
  winsLost: number;
  rankingChange: number;
  opportunityCost: number;
  impactConfidence: number;
  contributingFactors: string[];
}

export interface AttributionAnalysis {
  decisionType: string;
  totalDecisions: number;
  successfulDecisions: number;
  successRate: number;
  averageImpact: number;
  totalPointsImpact: number;
  bestDecision: {
    description: string;
    impact: number;
    reasoning: string;
  };
  worstDecision: {
    description: string;
    impact: number;
    reasoning: string;
  };
  trends: Array<{
    period: string;
    successRate: number;
    averageImpact: number;
  }>;
}

export interface DecisionPatterns {
  preferredStrategies: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timingPatterns: Record<string, number>;
  positionBiases: Record<string, number>;
  successFactors: string[];
  improvementAreas: string[];
  behavioralInsights: string[];
}

export interface SeasonPerformanceBreakdown {
  totalDecisions: number;
  overallSuccessRate: number;
  pointsFromDecisions: number;
  rankingImpact: number;
  keySuccesses: Array<{
    week: number;
    decision: string;
    impact: number;
    reasoning: string;
  }>;
  keyMisses: Array<{
    week: number;
    decision: string;
    impact: number;
    reasoning: string;
  }>;
  categoryBreakdown: Record<string, AttributionAnalysis>;
  monthlyTrends: Array<{
    month: string;
    successRate: number;
    averageImpact: number;
    decisionVolume: number;
  }>;
  comparedToLeague: {
    decisionFrequency: 'above_average' | 'average' | 'below_average';
    successRate: 'above_average' | 'average' | 'below_average';
    riskTaking: 'above_average' | 'average' | 'below_average';
  };
}

export class PerformanceAttributionService {
  private aiRouter: AIRouter;

  constructor() {
    this.aiRouter = new AIRouter();
  }

  async trackDecision(decision: Omit<DecisionTracking, 'decisionId' | 'timestamp'>): Promise<string> {
    try {
      const decisionId = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.query(`
        INSERT INTO decision_tracking (
          decision_id, user_id, league_id, decision_type, description, 
          week_number, players_before, players_after, reasoning, 
          ai_recommended, alternatives_considered, expected_impact, impact_timeline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        decisionId,
        decision.userId,
        decision.leagueId,
        decision.decisionType,
        decision.description,
        decision.weekNumber,
        JSON.stringify(decision.playersBefore),
        JSON.stringify(decision.playersAfter),
        decision.reasoning,
        decision.aiRecommended,
        JSON.stringify(decision.alternativesConsidered),
        decision.expectedImpact,
        decision.impactTimeline
      ]);

      // Schedule impact calculation
      this.scheduleImpactCalculation(decisionId, decision.impactTimeline);

      return decisionId;

    } catch (error) {
      console.error('Error tracking decision:', error);
      throw error;
    }
  }

  private async scheduleImpactCalculation(decisionId: string, timeline: string): Promise<void> {
    // In a production environment, this would use a job queue like Bull or Agenda
    // For now, we'll calculate impact after appropriate delays
    
    const delays = {
      immediate: 24 * 60 * 60 * 1000, // 1 day
      short_term: 7 * 24 * 60 * 60 * 1000, // 1 week
      long_term: 4 * 7 * 24 * 60 * 60 * 1000, // 4 weeks
      season_long: 17 * 7 * 24 * 60 * 60 * 1000 // 17 weeks
    };

    setTimeout(async () => {
      await this.calculateDecisionImpact(decisionId);
    }, delays[timeline as keyof typeof delays] || delays.short_term);
  }

  async calculateDecisionImpact(decisionId: string): Promise<PerformanceImpact> {
    try {
      const decisionData = await db.query(`
        SELECT * FROM decision_tracking WHERE decision_id = $1
      `, [decisionId]);

      if (decisionData.rows.length === 0) {
        throw new Error('Decision not found');
      }

      const decision = decisionData.rows[0];
      const playersBefore = JSON.parse(decision.players_before);
      const playersAfter = JSON.parse(decision.players_after);

      // Calculate actual performance impact
      const impact = await this.computePerformanceImpact(
        decision.user_id,
        decision.league_id,
        decision.week_number,
        playersBefore,
        playersAfter,
        decision.decision_type,
        decision.impact_timeline
      );

      // Store the calculated impact
      await db.query(`
        UPDATE decision_tracking 
        SET actual_impact = $1, impact_calculated_at = NOW()
        WHERE decision_id = $2
      `, [impact.netImpact, decisionId]);

      // Store detailed impact analysis
      await db.query(`
        INSERT INTO performance_impacts (
          decision_id, points_gained, points_lost, net_impact, wins_gained, 
          wins_lost, ranking_change, opportunity_cost, impact_confidence, 
          contributing_factors
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (decision_id) 
        DO UPDATE SET 
          points_gained = EXCLUDED.points_gained,
          points_lost = EXCLUDED.points_lost,
          net_impact = EXCLUDED.net_impact,
          wins_gained = EXCLUDED.wins_gained,
          wins_lost = EXCLUDED.wins_lost,
          ranking_change = EXCLUDED.ranking_change,
          opportunity_cost = EXCLUDED.opportunity_cost,
          impact_confidence = EXCLUDED.impact_confidence,
          contributing_factors = EXCLUDED.contributing_factors,
          updated_at = NOW()
      `, [
        decisionId,
        impact.pointsGained,
        impact.pointsLost,
        impact.netImpact,
        impact.winsGained,
        impact.winsLost,
        impact.rankingChange,
        impact.opportunityCost,
        impact.impactConfidence,
        JSON.stringify(impact.contributingFactors)
      ]);

      return impact;

    } catch (error) {
      console.error('Error calculating decision impact:', error);
      throw error;
    }
  }

  private async computePerformanceImpact(
    userId: string,
    leagueId: string,
    weekNumber: number,
    playersBefore: string[],
    playersAfter: string[],
    decisionType: string,
    timeline: string
  ): Promise<PerformanceImpact> {
    
    // Calculate weeks to analyze based on timeline
    const weeksToAnalyze = this.getAnalysisWeeks(timeline, weekNumber);
    
    // Get actual performance data for players involved
    const performanceData = await db.query(`
      WITH player_performance AS (
        SELECT 
          p.player_name,
          SUM(CASE WHEN w.week BETWEEN $3 AND $4 THEN COALESCE(p.fantasy_points, 0) ELSE 0 END) as total_points,
          COUNT(CASE WHEN w.week BETWEEN $3 AND $4 THEN 1 END) as games_played
        FROM players p
        CROSS JOIN generate_series($3, $4) w(week)
        WHERE p.player_name = ANY($5) OR p.player_name = ANY($6)
        GROUP BY p.player_name
      ),
      user_lineups AS (
        SELECT 
          lm.week,
          lm.user_score,
          CASE WHEN lm.user_score > lm.opponent_score THEN 1 ELSE 0 END as won
        FROM league_matchups lm
        WHERE lm.user_id = $1 AND lm.league_id = $2 
          AND lm.week BETWEEN $3 AND $4
      )
      SELECT 
        pp.*,
        COALESCE(AVG(ul.user_score), 0) as avg_user_score,
        COALESCE(SUM(ul.won), 0) as wins_in_period,
        COUNT(ul.week) as total_weeks
      FROM player_performance pp
      CROSS JOIN user_lineups ul
      GROUP BY pp.player_name, pp.total_points, pp.games_played
    `, [
      userId, 
      leagueId, 
      weekNumber, 
      weeksToAnalyze.endWeek,
      playersBefore,
      playersAfter
    ]);

    // Calculate points gained/lost from the decision
    const playersBeforePoints = performanceData.rows
      .filter((row: any) => playersBefore.includes(row.player_name))
      .reduce((sum: number, row: any) => sum + parseFloat(row.total_points || 0), 0);

    const playersAfterPoints = performanceData.rows
      .filter((row: any) => playersAfter.includes(row.player_name))
      .reduce((sum: number, row: any) => sum + parseFloat(row.total_points || 0), 0);

    const pointsGained = Math.max(0, playersAfterPoints - playersBeforePoints);
    const pointsLost = Math.max(0, playersBeforePoints - playersAfterPoints);
    const netImpact = playersAfterPoints - playersBeforePoints;

    // Estimate wins impact (rough calculation)
    const avgScoreDiff = 15; // Average margin of victory
    const winsGained = Math.max(0, Math.floor(pointsGained / avgScoreDiff));
    const winsLost = Math.max(0, Math.floor(pointsLost / avgScoreDiff));

    // Calculate opportunity cost by comparing to best available alternative
    const opportunityCost = await this.calculateOpportunityCost(
      userId, leagueId, weekNumber, decisionType, playersAfter
    );

    // Determine contributing factors
    const contributingFactors = await this.identifyContributingFactors(
      decisionType, playersBefore, playersAfter, netImpact
    );

    // Calculate confidence based on sample size and variance
    const impactConfidence = Math.min(0.95, 0.5 + (weeksToAnalyze.endWeek - weekNumber) * 0.1);

    return {
      decisionId: '',
      pointsGained,
      pointsLost,
      netImpact,
      winsGained,
      winsLost,
      rankingChange: 0, // Would need league standings calculation
      opportunityCost,
      impactConfidence,
      contributingFactors
    };
  }

  private getAnalysisWeeks(timeline: string, weekNumber: number): { endWeek: number } {
    const currentWeek = Math.min(17, weekNumber + 4); // Assume we're 4 weeks past the decision
    
    switch (timeline) {
      case 'immediate': return { endWeek: Math.min(17, weekNumber + 1) };
      case 'short_term': return { endWeek: Math.min(17, weekNumber + 3) };
      case 'long_term': return { endWeek: Math.min(17, weekNumber + 8) };
      case 'season_long': return { endWeek: 17 };
      default: return { endWeek: Math.min(17, weekNumber + 3) };
    }
  }

  private async calculateOpportunityCost(
    userId: string, 
    leagueId: string, 
    weekNumber: number, 
    decisionType: string,
    chosenPlayers: string[]
  ): Promise<number> {
    // This would calculate what the best alternative decision would have yielded
    // For now, return a placeholder
    return Math.random() * 20 - 10; // Random value between -10 and 10
  }

  private async identifyContributingFactors(
    decisionType: string, 
    playersBefore: string[], 
    playersAfter: string[],
    netImpact: number
  ): Promise<string[]> {
    const factors = [];
    
    if (netImpact > 0) {
      factors.push('Positive player performance');
      if (decisionType === 'waiver') factors.push('Good waiver wire timing');
      if (decisionType === 'trade') factors.push('Successful trade execution');
    } else {
      factors.push('Player underperformance');
      if (Math.abs(netImpact) > 20) factors.push('Major injury or benching');
    }

    return factors;
  }

  async generateAttributionAnalysis(
    userId: string, 
    leagueId: string, 
    decisionType?: string
  ): Promise<AttributionAnalysis[]> {
    try {
      const query = `
        SELECT 
          dt.decision_type,
          COUNT(*) as total_decisions,
          COUNT(CASE WHEN COALESCE(pi.net_impact, dt.expected_impact, 0) > 0 THEN 1 END) as successful_decisions,
          AVG(COALESCE(pi.net_impact, dt.expected_impact, 0)) as average_impact,
          SUM(COALESCE(pi.net_impact, dt.expected_impact, 0)) as total_points_impact,
          MAX(CASE WHEN COALESCE(pi.net_impact, dt.expected_impact, 0) > 0 
              THEN pi.net_impact ELSE NULL END) as best_impact,
          MAX(CASE WHEN COALESCE(pi.net_impact, dt.expected_impact, 0) > 0 
              THEN dt.description ELSE NULL END) as best_decision,
          MIN(CASE WHEN COALESCE(pi.net_impact, dt.expected_impact, 0) < 0 
              THEN pi.net_impact ELSE NULL END) as worst_impact,
          MIN(CASE WHEN COALESCE(pi.net_impact, dt.expected_impact, 0) < 0 
              THEN dt.description ELSE NULL END) as worst_decision
        FROM decision_tracking dt
        LEFT JOIN performance_impacts pi ON dt.decision_id = pi.decision_id
        WHERE dt.user_id = $1 AND dt.league_id = $2
        ${decisionType ? 'AND dt.decision_type = $3' : ''}
        GROUP BY dt.decision_type
        ORDER BY total_decisions DESC
      `;

      const params = [userId, leagueId];
      if (decisionType) params.push(decisionType);

      const result = await db.query(query, params);

      return result.rows.map((row: any) => ({
        decisionType: row.decision_type,
        totalDecisions: parseInt(row.total_decisions),
        successfulDecisions: parseInt(row.successful_decisions),
        successRate: parseFloat(row.successful_decisions) / parseFloat(row.total_decisions),
        averageImpact: parseFloat(row.average_impact) || 0,
        totalPointsImpact: parseFloat(row.total_points_impact) || 0,
        bestDecision: {
          description: row.best_decision || 'No positive decisions',
          impact: parseFloat(row.best_impact) || 0,
          reasoning: 'Generated positive fantasy points'
        },
        worstDecision: {
          description: row.worst_decision || 'No negative decisions',
          impact: parseFloat(row.worst_impact) || 0,
          reasoning: 'Resulted in point loss'
        },
        trends: [] // Would be populated with time-series analysis
      }));

    } catch (error) {
      console.error('Error generating attribution analysis:', error);
      throw error;
    }
  }

  async analyzeDecisionPatterns(userId: string, leagueId: string): Promise<DecisionPatterns> {
    try {
      const decisionData = await db.query(`
        SELECT 
          dt.*,
          pi.net_impact,
          EXTRACT(hour FROM dt.created_at) as decision_hour,
          EXTRACT(dow FROM dt.created_at) as decision_day
        FROM decision_tracking dt
        LEFT JOIN performance_impacts pi ON dt.decision_id = pi.decision_id
        WHERE dt.user_id = $1 AND dt.league_id = $2
        ORDER BY dt.created_at DESC
      `, [userId, leagueId]);

      if (decisionData.rows.length === 0) {
        return {
          preferredStrategies: [],
          riskTolerance: 'moderate',
          timingPatterns: {},
          positionBiases: {},
          successFactors: [],
          improvementAreas: [],
          behavioralInsights: []
        };
      }

      const decisions = decisionData.rows;

      // Analyze timing patterns
      const timingPatterns = decisions.reduce((acc: Record<string, number>, decision: any) => {
        const hour = parseInt(decision.decision_hour);
        const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        acc[timeSlot] = (acc[timeSlot] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate risk tolerance based on expected impact variance
      const expectedImpacts = decisions.map((d: any) => parseFloat(d.expected_impact) || 0);
      const avgRisk = expectedImpacts.reduce((sum: number, impact: number) => sum + Math.abs(impact), 0) / expectedImpacts.length;
      
      let riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
      if (avgRisk < 5) riskTolerance = 'conservative';
      else if (avgRisk > 15) riskTolerance = 'aggressive';

      // Analyze position biases (simplified)
      const positionBiases = decisions.reduce((acc: Record<string, number>, decision: any) => {
        const playersAfter = JSON.parse(decision.players_after || '[]');
        playersAfter.forEach((player: string) => {
          // This would need actual position data
          const position = 'RB'; // Placeholder
          acc[position] = (acc[position] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      // Identify success factors and improvement areas
      const successfulDecisions = decisions.filter((d: any) => (parseFloat(d.net_impact) || 0) > 0);
      const unsuccessfulDecisions = decisions.filter((d: any) => (parseFloat(d.net_impact) || 0) < 0);

      const successFactors = [];
      const improvementAreas = [];

      if (successfulDecisions.length > 0) {
        const aiRecommendedSuccess = successfulDecisions.filter((d: any) => d.ai_recommended).length / successfulDecisions.length;
        if (aiRecommendedSuccess > 0.6) {
          successFactors.push('Following AI recommendations');
        }
      }

      if (unsuccessfulDecisions.length > 0) {
        const hastyDecisions = unsuccessfulDecisions.filter((d: any) => !d.reasoning || d.reasoning.length < 50).length;
        if (hastyDecisions / unsuccessfulDecisions.length > 0.5) {
          improvementAreas.push('More thorough decision reasoning');
        }
      }

      const behavioralInsights = await this.generateBehavioralInsights(decisions);

      return {
        preferredStrategies: this.identifyPreferredStrategies(decisions),
        riskTolerance,
        timingPatterns,
        positionBiases,
        successFactors,
        improvementAreas,
        behavioralInsights
      };

    } catch (error) {
      console.error('Error analyzing decision patterns:', error);
      throw error;
    }
  }

  private identifyPreferredStrategies(decisions: any[]): string[] {
    const strategies = [];
    
    const tradeFrequency = decisions.filter(d => d.decision_type === 'trade').length / decisions.length;
    const waiverFrequency = decisions.filter(d => d.decision_type === 'waiver').length / decisions.length;
    
    if (tradeFrequency > 0.3) strategies.push('Active trading');
    if (waiverFrequency > 0.4) strategies.push('Waiver wire focus');
    
    const aiFollowRate = decisions.filter(d => d.ai_recommended).length / decisions.length;
    if (aiFollowRate > 0.6) strategies.push('AI-guided decisions');
    
    return strategies;
  }

  private async generateBehavioralInsights(decisions: any[]): Promise<string[]> {
    const insights = [];
    
    // Analyze decision frequency by week
    const weeklyDecisions = decisions.reduce((acc: Record<number, number>, decision: any) => {
      acc[decision.week_number] = (acc[decision.week_number] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const weeklyValues = Object.values(weeklyDecisions) as number[];
    const avgDecisionsPerWeek = (weeklyValues.reduce((a: number, b: number) => a + b, 0)) / Math.max(Object.keys(weeklyDecisions).length, 1);

    if (avgDecisionsPerWeek > 3) {
      insights.push('High decision frequency - consider being more selective');
    } else if (avgDecisionsPerWeek < 1) {
      insights.push('Conservative decision making - may be missing opportunities');
    }

    return insights;
  }

  async generateSeasonPerformanceBreakdown(
    userId: string, 
    leagueId: string
  ): Promise<SeasonPerformanceBreakdown> {
    try {
      const [attributionData, decisionData, leagueComparison] = await Promise.all([
        this.generateAttributionAnalysis(userId, leagueId),
        this.analyzeDecisionPatterns(userId, leagueId),
        this.getLeagueComparisonData(userId, leagueId)
      ]);

      const totalDecisions = attributionData.reduce((sum, attr) => sum + attr.totalDecisions, 0);
      const successfulDecisions = attributionData.reduce((sum, attr) => sum + attr.successfulDecisions, 0);
      const overallSuccessRate = totalDecisions > 0 ? successfulDecisions / totalDecisions : 0;
      const pointsFromDecisions = attributionData.reduce((sum, attr) => sum + attr.totalPointsImpact, 0);

      // Get key successes and misses
      const keyDecisions = await db.query(`
        SELECT 
          dt.week_number,
          dt.description,
          COALESCE(pi.net_impact, dt.expected_impact, 0) as impact,
          dt.reasoning
        FROM decision_tracking dt
        LEFT JOIN performance_impacts pi ON dt.decision_id = pi.decision_id
        WHERE dt.user_id = $1 AND dt.league_id = $2
        ORDER BY ABS(COALESCE(pi.net_impact, dt.expected_impact, 0)) DESC
        LIMIT 10
      `, [userId, leagueId]);

      const keySuccesses = keyDecisions.rows
        .filter((row: any) => parseFloat(row.impact) > 0)
        .slice(0, 3)
        .map((row: any) => ({
          week: row.week_number,
          decision: row.description,
          impact: parseFloat(row.impact),
          reasoning: row.reasoning || 'Good strategic decision'
        }));

      const keyMisses = keyDecisions.rows
        .filter((row: any) => parseFloat(row.impact) < 0)
        .slice(0, 3)
        .map((row: any) => ({
          week: row.week_number,
          decision: row.description,
          impact: parseFloat(row.impact),
          reasoning: row.reasoning || 'Decision did not work out as expected'
        }));

      const categoryBreakdown = attributionData.reduce((acc, attr) => {
        acc[attr.decisionType] = attr;
        return acc;
      }, {} as Record<string, AttributionAnalysis>);

      return {
        totalDecisions,
        overallSuccessRate,
        pointsFromDecisions,
        rankingImpact: 0, // Would need standings calculation
        keySuccesses,
        keyMisses,
        categoryBreakdown,
        monthlyTrends: [], // Would need time-series analysis
        comparedToLeague: leagueComparison
      };

    } catch (error) {
      console.error('Error generating season performance breakdown:', error);
      throw error;
    }
  }

  private async getLeagueComparisonData(userId: string, leagueId: string): Promise<{
    decisionFrequency: 'above_average' | 'average' | 'below_average';
    successRate: 'above_average' | 'average' | 'below_average';
    riskTaking: 'above_average' | 'average' | 'below_average';
  }> {
    // This would compare user's metrics to league averages
    // For now, return placeholder data
    return {
      decisionFrequency: 'average',
      successRate: 'above_average',
      riskTaking: 'moderate' as 'above_average'
    };
  }

  async getDecisionById(decisionId: string): Promise<DecisionTracking | null> {
    try {
      const result = await db.query(`
        SELECT 
          dt.*,
          pi.net_impact as actual_impact
        FROM decision_tracking dt
        LEFT JOIN performance_impacts pi ON dt.decision_id = pi.decision_id
        WHERE dt.decision_id = $1
      `, [decisionId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        decisionId: row.decision_id,
        userId: row.user_id,
        leagueId: row.league_id,
        decisionType: row.decision_type,
        description: row.description,
        timestamp: row.created_at,
        weekNumber: row.week_number,
        playersBefore: JSON.parse(row.players_before || '[]'),
        playersAfter: JSON.parse(row.players_after || '[]'),
        reasoning: row.reasoning,
        aiRecommended: row.ai_recommended,
        alternativesConsidered: JSON.parse(row.alternatives_considered || '[]'),
        expectedImpact: parseFloat(row.expected_impact) || 0,
        actualImpact: row.actual_impact ? parseFloat(row.actual_impact) : undefined,
        impactTimeline: row.impact_timeline
      };

    } catch (error) {
      console.error('Error getting decision by ID:', error);
      throw error;
    }
  }
}
