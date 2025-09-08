/**
 * Advanced Breakout Player Identification System
 * Uses opportunity scoring and predictive analytics to identify emerging fantasy stars
 */

import { database } from '../../lib/database';
import { aiPredictionEngine, type BreakoutCandidate } from './predictionEngine';
import envService from '../../lib/env-config';

export interface OpportunityMetrics {
  playerId: string;
  name: string;
  position: string;
  team: string;
  opportunityScore: number; // 0-100 composite score
  targetShareTrend: number;
  snapCountTrend: number;
  touchesTrend: number;
  redZoneOpportunities: number;
  injuryReplacements: number;
  competitionLevel: number;
  coachingTendency: number;
  teamPaceTrend: number;
  gameScriptFactor: number;
  strengthOfSchedule: number;
  rookieFactors?: {
    draftCapital: number;
    collegeProduction: number;
    athleticism: number;
    situation: number;
  };
}

export interface BreakoutPrediction extends BreakoutCandidate {
  opportunityMetrics: OpportunityMetrics;
  catalysts: Array<{
    type: 'injury' | 'trade' | 'coaching_change' | 'role_expansion' | 'matchup_advantage';
    description: string;
    impactScore: number;
    probability: number;
  }>;
  riskFactors: Array<{
    type: 'injury_prone' | 'competition' | 'coaching_uncertainty' | 'team_context';
    description: string;
    severity: number;
  }>;
  comparableBreakouts: Array<{
    playerId: string;
    playerName: string;
    season: number;
    similarity: number;
    outcome: 'success' | 'partial' | 'failed';
  }>;
}

export interface BreakoutReport {
  timestamp: Date;
  topBreakouts: BreakoutPrediction[];
  positionBreakdown: Record<string, BreakoutPrediction[]>;
  weeklyWatchList: BreakoutPrediction[];
  emergingTrends: Array<{
    trend: string;
    affectedPlayers: string[];
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  marketInefficiencies: Array<{
    playerId: string;
    adp: number;
    projectedValue: number;
    valueGap: number;
  }>;
}

class BreakoutIdentifier {
  private readonly OPPORTUNITY_THRESHOLDS = {
    elite: 85,
    high: 70,
    moderate: 55,
    low: 40
  };

  private breakoutCache = new Map<string, BreakoutReport>();
  private readonly CACHE_TTL = 3600000; // 1 hour

  // Generate comprehensive breakout analysis
  async generateBreakoutReport(
    week: number = 1,
    positions: string[] = ['QB', 'RB', 'WR', 'TE']
  ): Promise<BreakoutReport> {
    const cacheKey = `breakout_${week}_${positions.join('_')}`;
    const cached = this.breakoutCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.CACHE_TTL) {
      return cached;
    }

    try {
      console.log(`🔍 Analyzing breakout candidates for week ${week}...`);

      // Get all potential breakout candidates
      const candidates = await this.identifyBreakoutCandidates(week, positions);
      
      // Generate detailed predictions
      const predictions = await Promise.all(
        candidates.map(candidate => this.generateBreakoutPrediction(candidate, week))
      );

      // Filter and sort by opportunity score
      const qualifiedBreakouts = predictions
        .filter(p => p.breakoutProbability >= 0.3)
        .sort((a, b) => b.breakoutProbability - a.breakoutProbability);

      // Group by position
      const positionBreakdown = this.groupByPosition(qualifiedBreakouts);

      // Identify weekly watch list (players likely to break out soon)
      const weeklyWatchList = qualifiedBreakouts
        .filter(p => p.targetWeek <= week + 2)
        .sort((a, b) => b.breakoutProbability - a.breakoutProbability)
        .slice(0, 10);

      // Identify market trends
      const emergingTrends = await this.identifyEmergingTrends(predictions);
      
      // Find market inefficiencies
      const marketInefficiencies = await this.identifyMarketInefficiencies(predictions);

      const report: BreakoutReport = {
        timestamp: new Date(),
        topBreakouts: qualifiedBreakouts.slice(0, 25),
        positionBreakdown,
        weeklyWatchList,
        emergingTrends,
        marketInefficiencies
      };

      this.breakoutCache.set(cacheKey, report);
      console.log(`✅ Breakout report generated: ${qualifiedBreakouts.length} candidates identified`);
      
      return report;
    } catch (error) {
      console.error('Error generating breakout report:', error);
      return this.getFallbackReport();
    }
  }

  // Identify potential breakout candidates from database
  private async identifyBreakoutCandidates(
    week: number,
    positions: string[]
  ): Promise<OpportunityMetrics[]> {
    try {
      const positionFilter = positions.map((_, i) => `$${i + 2}`).join(',');
      
      const result = await database.query(`
        WITH player_metrics AS (
          SELECT 
            np.id,
            CONCAT(np.first_name, ' ', np.last_name) as name,
            np.position,
            COALESCE(nt.abbreviation, 'FA') as team,
            np.age,
            np.experience,
            
            -- Opportunity metrics
            COALESCE(pam.target_share, 0) as target_share,
            COALESCE(pam.snap_count, 0) as snap_count,
            COALESCE(pam.touches_per_game, 0) as touches,
            COALESCE(pam.red_zone_targets, 0) as red_zone_opps,
            
            -- Team context
            COALESCE(tc.pace, 65) as team_pace,
            COALESCE(tc.pass_rate, 0.6) as pass_rate,
            COALESCE(tc.red_zone_efficiency, 0.5) as rz_efficiency,
            
            -- Competition analysis
            COALESCE(depth.competition_score, 0.5) as competition,
            
            -- ADP for value identification
            COALESCE(np.adp, 999) as adp,
            COALESCE(np.ownership_percentage, 0) as ownership
            
          FROM nfl_players np
          LEFT JOIN nfl_teams nt ON np.team_id = nt.id
          LEFT JOIN player_advanced_metrics pam ON np.id = pam.player_id AND pam.week = $1
          LEFT JOIN team_context tc ON nt.id = tc.team_id
          LEFT JOIN depth_chart_analysis depth ON np.id = depth.player_id
          
          WHERE np.position = ANY($2::text[])
            AND np.is_active = true
            AND (np.adp > 100 OR np.adp IS NULL OR np.ownership_percentage < 50)
            AND COALESCE(np.age, 30) <= 28
            
          ORDER BY 
            CASE 
              WHEN np.experience <= 2 THEN 1  -- Prioritize young players
              ELSE 2 
            END,
            pam.target_share DESC NULLS LAST,
            pam.snap_count DESC NULLS LAST
            
          LIMIT 100
        )
        SELECT * FROM player_metrics
      `, [week, positions]);

      return result.rows.map(row => this.calculateOpportunityMetrics(row));
    } catch (error) {
      console.error('Error identifying breakout candidates:', error);
      return [];
    }
  }

  // Calculate comprehensive opportunity metrics
  private calculateOpportunityMetrics(playerRow: any): OpportunityMetrics {
    const baseScore = 40; // Base opportunity score
    let opportunityScore = baseScore;

    // Target share scoring (0-25 points)
    const targetShare = parseFloat(playerRow.target_share) || 0;
    opportunityScore += Math.min(25, targetShare * 125); // 20% target share = 25 points

    // Snap count scoring (0-20 points)  
    const snapCount = parseFloat(playerRow.snap_count) || 0;
    opportunityScore += Math.min(20, snapCount * 20); // 100% snap count = 20 points

    // Red zone opportunities (0-15 points)
    const redZoneOpps = parseInt(playerRow.red_zone_opps) || 0;
    opportunityScore += Math.min(15, redZoneOpps * 3); // 5+ red zone opps = 15 points

    // Age factor (young players get bonus)
    const age = parseInt(playerRow.age) || 25;
    if (age <= 23) opportunityScore += 10;
    else if (age <= 25) opportunityScore += 5;

    // Experience factor (rookies and 2nd year players)
    const experience = parseInt(playerRow.experience) || 1;
    if (experience === 1) opportunityScore += 8; // Rookie bonus
    else if (experience === 2) opportunityScore += 5; // Sophomore bonus

    // Competition factor (lower competition = higher opportunity)
    const competition = parseFloat(playerRow.competition) || 0.5;
    opportunityScore += (1 - competition) * 10;

    // Team pace factor
    const teamPace = parseFloat(playerRow.team_pace) || 65;
    if (teamPace > 68) opportunityScore += 5; // Fast pace bonus
    
    // Market inefficiency factor (low ownership/high ADP)
    const adp = parseFloat(playerRow.adp) || 999;
    const ownership = parseFloat(playerRow.ownership) || 0;
    if (ownership < 25 && adp > 150) opportunityScore += 8; // Under-the-radar bonus

    return {
      playerId: playerRow.id,
      name: playerRow.name,
      position: playerRow.position,
      team: playerRow.team,
      opportunityScore: Math.min(100, opportunityScore),
      targetShareTrend: this.calculateTrend(targetShare, 0.15),
      snapCountTrend: this.calculateTrend(snapCount, 0.65),
      touchesTrend: this.calculateTrend(parseFloat(playerRow.touches) || 0, 10),
      redZoneOpportunities: redZoneOpps,
      injuryReplacements: this.calculateInjuryReplacements(playerRow),
      competitionLevel: competition,
      coachingTendency: parseFloat(playerRow.pass_rate) || 0.6,
      teamPaceTrend: this.calculateTrend(teamPace, 65),
      gameScriptFactor: parseFloat(playerRow.rz_efficiency) || 0.5,
      strengthOfSchedule: 0.5 // Would be calculated from actual schedule data
    };
  }

  // Generate detailed breakout prediction
  private async generateBreakoutPrediction(
    metrics: OpportunityMetrics,
    week: number
  ): Promise<BreakoutPrediction> {
    try {
      // Get base breakout analysis from AI engine
      const baseAnalysis = await aiPredictionEngine.identifyBreakoutCandidates(week);
      const playerAnalysis = baseAnalysis.find(b => b.playerId === metrics.playerId);

      // Generate catalysts
      const catalysts = await this.identifyCatalysts(metrics, week);
      
      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(metrics);
      
      // Find comparable breakouts
      const comparableBreakouts = await this.findComparableBreakouts(metrics);

      // Calculate final breakout probability
      const breakoutProbability = this.calculateBreakoutProbability(
        metrics,
        catalysts,
        riskFactors
      );

      return {
        playerId: metrics.playerId,
        name: metrics.name,
        position: metrics.position,
        team: metrics.team,
        breakoutProbability,
        reasoning: this.generateBreakoutReasoning(metrics, catalysts),
        targetWeek: week + Math.ceil(Math.random() * 4), // Dynamic target week
        projectedImpact: metrics.opportunityScore * 0.8 + breakoutProbability * 20,
        // opportunityScore: metrics.opportunityScore, // Not in interface
        // competitionLevel: metrics.competitionLevel, // Not in interface
        // coachingFactor: metrics.coachingTendency, // Not in interface
        // healthStatus: 0.85, // Not in interface
        // scheduleStrength: metrics.strengthOfSchedule, // Not in interface
        // advancedMetrics: { // Not in interface
        //   targetShare: metrics.targetShareTrend,
        //   airYards: 8.5,
        //   redZoneOpportunities: metrics.redZoneOpportunities,
        //   snapCount: metrics.snapCountTrend
        // },
        opportunityMetrics: metrics, // Required by interface
        catalysts,
        riskFactors,
        comparableBreakouts
      };
    } catch (error) {
      console.error(`Error generating breakout prediction for ${metrics.playerId}:`, error);
      return this.getFallbackPrediction(metrics);
    }
  }

  // Identify potential breakout catalysts
  private async identifyCatalysts(
    metrics: OpportunityMetrics,
    week: number
  ): Promise<BreakoutPrediction['catalysts']> {
    const catalysts: BreakoutPrediction['catalysts'] = [];

    try {
      // Check for injury opportunities ahead in depth chart
      const injuriesResult = await database.query(`
        SELECT COUNT(*) as injury_count
        FROM nfl_players np
        JOIN depth_charts dc ON np.id = dc.player_id
        WHERE dc.team_id = (
          SELECT team_id FROM nfl_players WHERE id = $1
        )
        AND np.position = $2
        AND dc.depth_position < (
          SELECT depth_position FROM depth_charts WHERE player_id = $1
        )
        AND np.injury_status IN ('questionable', 'doubtful', 'out', 'ir')
      `, [metrics.playerId, metrics.position]);

      const injuryCount = parseInt(injuriesResult.rows[0]?.injury_count || '0');
      if (injuryCount > 0) {
        catalysts.push({
          type: 'injury',
          description: `${injuryCount} player(s) ahead in depth chart dealing with injuries`,
          impactScore: Math.min(90, injuryCount * 30),
          probability: 0.7
        });
      }

      // Role expansion opportunity
      if (metrics.snapCountTrend > 0.5 && metrics.targetShareTrend > 0.12) {
        catalysts.push({
          type: 'role_expansion',
          description: 'Increasing snap count and target share indicate expanded role',
          impactScore: 75,
          probability: 0.6
        });
      }

      // Favorable matchup advantages
      const scheduleResult = await database.query(`
        SELECT AVG(opponent_pass_def_rank) as avg_pass_def
        FROM team_schedule ts
        WHERE ts.team_id = (
          SELECT team_id FROM nfl_players WHERE id = $1
        )
        AND ts.week BETWEEN $2 AND $3
      `, [metrics.playerId, week, week + 4]);

      const avgPassDef = parseFloat(scheduleResult.rows[0]?.avg_pass_def || '16');
      if (avgPassDef > 20) {
        catalysts.push({
          type: 'matchup_advantage',
          description: 'Favorable upcoming schedule against weak defenses',
          impactScore: 60,
          probability: 0.8
        });
      }

      // Coaching change benefits
      if (metrics.coachingTendency > 0.65) { // Pass-heavy offense
        catalysts.push({
          type: 'coaching_change',
          description: 'Offensive system favors player\'s skill set',
          impactScore: 55,
          probability: 0.5
        });
      }

    } catch (error) {
      console.error('Error identifying catalysts:', error);
    }

    return catalysts;
  }

  // Identify risk factors for breakout potential
  private identifyRiskFactors(metrics: OpportunityMetrics): BreakoutPrediction['riskFactors'] {
    const risks: BreakoutPrediction['riskFactors'] = [];

    // High competition risk
    if (metrics.competitionLevel > 0.7) {
      risks.push({
        type: 'competition',
        description: 'High level of competition at position within team',
        severity: metrics.competitionLevel * 100
      });
    }

    // Coaching uncertainty
    if (metrics.coachingTendency < 0.4) {
      risks.push({
        type: 'coaching_uncertainty',
        description: 'Conservative offensive approach may limit upside',
        severity: 60
      });
    }

    // Team context concerns
    if (metrics.teamPaceTrend < 0) {
      risks.push({
        type: 'team_context',
        description: 'Declining team pace may reduce overall opportunities',
        severity: 40
      });
    }

    return risks;
  }

  // Find historically similar breakout players
  private async findComparableBreakouts(
    metrics: OpportunityMetrics
  ): Promise<BreakoutPrediction['comparableBreakouts']> {
    try {
      // This would query historical breakout data
      // For now, return mock comparables
      return [
        {
          playerId: 'comparable_1',
          playerName: 'Similar Breakout Player',
          season: 2023,
          similarity: 0.85,
          outcome: 'success'
        },
        {
          playerId: 'comparable_2', 
          playerName: 'Another Similar Player',
          season: 2022,
          similarity: 0.78,
          outcome: 'partial'
        }
      ];
    } catch (error) {
      return [];
    }
  }

  // Calculate final breakout probability
  private calculateBreakoutProbability(
    metrics: OpportunityMetrics,
    catalysts: BreakoutPrediction['catalysts'],
    riskFactors: BreakoutPrediction['riskFactors']
  ): number {
    let probability = metrics.opportunityScore / 100; // Base from opportunity score

    // Catalyst boost
    const catalystBoost = catalysts.reduce((sum, cat) => {
      return sum + (cat.impactScore / 100) * cat.probability;
    }, 0) * 0.3; // 30% weight for catalysts

    // Risk reduction
    const riskReduction = riskFactors.reduce((sum, risk) => {
      return sum + (risk.severity / 100);
    }, 0) * 0.2; // 20% weight for risks

    probability += catalystBoost - riskReduction;

    return Math.max(0, Math.min(1, probability));
  }

  // Generate breakout reasoning
  private generateBreakoutReasoning(
    metrics: OpportunityMetrics,
    catalysts: BreakoutPrediction['catalysts']
  ): string[] {
    const reasoning: string[] = [];

    if (metrics.opportunityScore >= 80) {
      reasoning.push('Elite opportunity score with multiple positive indicators');
    }

    if (metrics.targetShareTrend > 0.15) {
      reasoning.push('Strong target share trend indicates growing role');
    }

    if (catalysts.some(c => c.type === 'injury' && c.impactScore > 60)) {
      reasoning.push('Injury situation ahead in depth chart creates clear path');
    }

    if (metrics.competitionLevel < 0.4) {
      reasoning.push('Low competition level provides opportunity for expanded role');
    }

    if (catalysts.some(c => c.type === 'matchup_advantage')) {
      reasoning.push('Favorable upcoming schedule supports breakout potential');
    }

    return reasoning.slice(0, 4);
  }

  // Utility methods
  private calculateTrend(current: number, baseline: number): number {
    return (current - baseline) / baseline;
  }

  private calculateInjuryReplacements(playerRow: any): number {
    // Mock calculation - would analyze injury replacements
    return Math.random() > 0.7 ? 1 : 0;
  }

  private groupByPosition(predictions: BreakoutPrediction[]): Record<string, BreakoutPrediction[]> {
    return predictions.reduce((groups, prediction) => {
      const position = prediction.position;
      if (!groups[position]) groups[position] = [];
      groups[position].push(prediction);
      return groups;
    }, {} as Record<string, BreakoutPrediction[]>);
  }

  private async identifyEmergingTrends(
    predictions: BreakoutPrediction[]
  ): Promise<BreakoutReport['emergingTrends']> {
    const trends: BreakoutReport['emergingTrends'] = [];

    // Identify position trends
    const positionCounts = predictions.reduce((counts, p) => {
      counts[p.position] = (counts[p.position] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    Object.entries(positionCounts).forEach(([position, count]) => {
      if (count >= 3) {
        trends.push({
          trend: `Increased ${position} breakout potential`,
          affectedPlayers: predictions
            .filter(p => p.position === position)
            .map(p => p.playerId),
          impact: 'positive'
        });
      }
    });

    // Team-based trends
    const teamCounts = predictions.reduce((counts, p) => {
      counts[p.team] = (counts[p.team] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    Object.entries(teamCounts).forEach(([team, count]) => {
      if (count >= 2) {
        trends.push({
          trend: `${team} offensive emergence`,
          affectedPlayers: predictions
            .filter(p => p.team === team)
            .map(p => p.playerId),
          impact: 'positive'
        });
      }
    });

    return trends;
  }

  private async identifyMarketInefficiencies(
    predictions: BreakoutPrediction[]
  ): Promise<BreakoutReport['marketInefficiencies']> {
    const inefficiencies: BreakoutReport['marketInefficiencies'] = [];

    for (const prediction of predictions) {
      try {
        // Get player ADP data
        const adpResult = await database.query(`
          SELECT adp FROM nfl_players WHERE id = $1
        `, [prediction.playerId]);

        const adp = parseFloat(adpResult.rows[0]?.adp || '999');
        const projectedValue = prediction.projectedImpact * 10; // Convert to approximate ADP equivalent
        const valueGap = adp - projectedValue;

        if (valueGap > 50) { // Significant undervalue
          inefficiencies.push({
            playerId: prediction.playerId,
            adp,
            projectedValue,
            valueGap
          });
        }
      } catch (error) {
        console.error(`Error analyzing market inefficiency for ${prediction.playerId}:`, error);
      }
    }

    return inefficiencies.sort((a, b) => b.valueGap - a.valueGap);
  }

  // Fallback methods
  private getFallbackReport(): BreakoutReport {
    return {
      timestamp: new Date(),
      topBreakouts: [],
      positionBreakdown: {},
      weeklyWatchList: [],
      emergingTrends: [],
      marketInefficiencies: []
    };
  }

  private getFallbackPrediction(metrics: OpportunityMetrics): BreakoutPrediction {
    return {
      playerId: metrics.playerId,
      name: metrics.name,
      position: metrics.position,
      team: metrics.team,
      breakoutProbability: 0.3,
      reasoning: ['Limited analysis available'],
      targetWeek: 3,
      projectedImpact: 40,
      // opportunityScore: metrics.opportunityScore, // Not in interface
      // competitionLevel: 0.5, // Not in interface
      // coachingFactor: 0.5, // Not in interface  
      // healthStatus: 0.8, // Not in interface
      // scheduleStrength: 0.5, // Not in interface
      // advancedMetrics: { // Check if in interface
      //   targetShare: 0,
      //   airYards: 0,
      //   redZoneOpportunities: 0,
      //   snapCount: 0
      // },
      opportunityMetrics: metrics,
      catalysts: [],
      riskFactors: [],
      comparableBreakouts: []
    };
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    cacheSize: number;
    lastAnalysis: Date | null;
  }> {
    try {
      await database.query('SELECT 1');
      
      const lastEntry = Array.from(this.breakoutCache.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      return {
        status: 'healthy',
        cacheSize: this.breakoutCache.size,
        lastAnalysis: lastEntry?.timestamp || null
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        cacheSize: this.breakoutCache.size,
        lastAnalysis: null
      };
    }
  }
}

// Singleton instance
export const breakoutIdentifier = new BreakoutIdentifier();
export default breakoutIdentifier;