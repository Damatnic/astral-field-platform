/**
 * Intelligent Waiver Wire System
 * AI-powered waiver wire analysis that surpasses Yahoo/ESPN capabilities
 */

import { database } from '../../lib/database';
import { webSocketManager } from '../../lib/websocket/server';
import { aiPredictionEngine } from '../ai/predictionEngine';
import { breakoutIdentifier, type BreakoutPrediction } from '../ai/breakoutIdentifier';

// Date extension for week calculation
declare global { interface Date {
  getWeek(), number,
  
}
}

Date.prototype.getWeek = function(): number { const onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((((this.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
 }
export interface WaiverPlayer {
  playerId, string,
    name, string,
  position, string,
    team, string,
  currentValue, number,
    projectedValue, number,
  injuryStatus, string,
    age, number,
  experience, number,
    waiverRank, number,
  dropOffRank, number,
    availability: 'available' | 'claimed' | 'dropped';
  lastUpdated: Date,
  
}
export interface WaiverAnalysis {
  playerId, string,
    teamId, string,
  impactScore, number, // 0-100, higher = better addition
  confidence, number,
    positionImpact: {
  starter, boolean,
    depth, number, // 1-5 scale
    replacementLevel: number,
  }
  rosterFit: {
  needLevel, number, // 0-10 scale
    upgradePotential, number, // percentage improvement,
    riskLevel: 'low' | 'medium' | 'high',
  }
  marketAnalysis: {
  scarcity, number,
    competition, number, // teams likely to claim,
    claimProbability: number,
  }
  aiInsights: string[],
    recommendations: {
  priority: 'high' | 'medium' | 'low',
    action: 'claim' | 'monitor' | 'ignore';
    reasoning, string,
    timeline: string,
  }
}

export interface WaiverWireReport {
  leagueId, string,
    teamId, string,
  timestamp, Date,
    topTargets: WaiverAnalysis[];
  positionBreakdown: Record<string, WaiverAnalysis[]>;
  budgetAnalysis: {
  remainingBudget, number,
    recommendedClaims, number,
    riskAssessment: string,
  }
  strategy: {
  approach, string,
    focusAreas: string[],
    avoidPositions: string[],
  }
  breakoutCandidates: Array<{
  playerId, string,
    breakoutScore, number,
    weeklyWatchList, boolean,
    catalysts: string[],
  }>;
  marketInefficiencies: Array<{
  playerId, string,
    valueGap, number,
    reasoning: string,
  }>;
  trendingUp: WaiverAnalysis[],
    mustAddThisWeek: WaiverAnalysis[],
}

export interface WaiverClaim {
  leagueId, string,
    teamId, string,
  playerId, string,
    priority, number, // 1-10, higher = more urgent;
  maxBid, number,
    reasoning, string,
  fallbackPlayers: string[]; // alternative players if claim fails,
    timestamp: Date,
  
}
class IntelligentWaiverSystem { private waiverCache = new Map<string, WaiverWireReport>();
  private readonly: CACHE_TTL = 1800000; // 30 minutes for waiver data

  // Generate comprehensive waiver wire analysis for a team
  async generateWaiverAnalysis(async generateWaiverAnalysis(
    leagueId, string,
  teamId, string,
    availablePlayers: WaiverPlayer[] = []
  ): : Promise<): PromiseWaiverWireReport> {
    try {
      const cacheKey = `waiver_${leagueId }_${teamId}`
      const cached = this.waiverCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp.getTime()) < this.CACHE_TTL) { return cached;
       }

      // Get available waiver players
      const waiverPlayers = availablePlayers.length > 0;
        ? availablePlayers : await this.getAvailableWaiverPlayers(leagueId);

      // Analyze team needs
      const teamNeeds = await this.analyzeTeamNeeds(leagueId, teamId);

      // Generate AI analysis for each player
      const playerAnalyses = await Promise.all(waiverPlayers.map(player => this.analyzeWaiverPlayer(player, teamNeeds, leagueId))
      );

      // Sort by impact score
      const topTargets = playerAnalyses;
        .sort((a, b) => b.impactScore - a.impactScore)
        .slice(0, 20);

      // Group by position
      const positionBreakdown = this.groupByPosition(topTargets);

      // Generate budget analysis
      const budgetAnalysis = await this.analyzeBudget(leagueId, teamId, topTargets);

      // Generate strategic recommendations
      const strategy = await this.generateStrategy(teamNeeds, positionBreakdown);

      // Get breakout candidates from the breakout identifier
      const breakoutReport = await breakoutIdentifier.generateBreakoutReport(1, ['QB', 'RB', 'WR', 'TE']);
      
      // Filter breakout candidates to only waiver wire eligible players
      const breakoutCandidates = await this.filterBreakoutCandidates(breakoutReport.topBreakouts, waiverPlayers);
      
      // Identify market inefficiencies specific to this team
      const marketInefficiencies = await this.identifyTeamSpecificInefficiencies(breakoutReport.marketInefficiencies,
        teamNeeds
      );
      
      // Find trending up players
      const trendingUp = topTargets.filter(analysis => 
        this.isTrendingUp(analysis) && analysis.impactScore > 60
      );
      
      // Identify must-add players for this week
      const mustAddThisWeek = topTargets.filter(analysis =>
        analysis.recommendations.priority === 'high' && 
        analysis.recommendations.action === 'claim'
      );

      const report: WaiverWireReport = {
        leagueId, teamId,
        timestamp: new Date();
        topTargets, positionBreakdown,
        budgetAnalysis, strategy,
        breakoutCandidates, marketInefficiencies, trendingUp,
        mustAddThisWeek
      }
      this.waiverCache.set(cacheKey, report);
      return report;
    } catch (error) {
      console.error('Error generating waiver analysis:', error);
      return this.getFallbackReport(leagueId, teamId);
    }
  }

  // Analyze individual waiver player
  private async analyzeWaiverPlayer(async analyzeWaiverPlayer(
    player, WaiverPlayer,
  teamNeeds, any,
    leagueId: string
  ): : Promise<): PromiseWaiverAnalysis> { try {; // Get AI prediction for the player
      const prediction = await aiPredictionEngine.generatePlayerPrediction(player.playerId, 1);

      // Calculate position impact
      const positionImpact = await this.calculatePositionImpact(player, teamNeeds);

      // Calculate roster fit
      const rosterFit = await this.calculateRosterFit(player, teamNeeds);

      // Analyze market competition
      const marketAnalysis = await this.analyzeMarketCompetition(player, leagueId);

      // Calculate overall impact score
      const impactScore = this.calculateImpactScore(positionImpact, rosterFit, marketAnalysis,
        prediction
      );

      // Generate AI insights
      const aiInsights = await this.generateAIInsights(player, positionImpact, rosterFit);

      // Generate recommendation
      const recommendations = this.generateRecommendation(impactScore, marketAnalysis,
        rosterFit
      );

      return {
        playerId player.playerId;
  teamId: teamNeeds.teamId;
        impactScore,
        confidence: prediction.confidence || 70;
        positionImpact, rosterFit,
        marketAnalysis, aiInsights,
        recommendations
       }
    } catch (error) {
      console.error(`Error analyzing waiver player ${player.playerId}, `, error);
      return this.getFallbackAnalysis(player, teamNeeds.teamId);
    }
  }

  // Calculate position impact analysis
  private async calculatePositionImpact(async calculatePositionImpact(
    player, WaiverPlayer,
  teamNeeds: any
  ): : Promise<): PromiseWaiverAnalysis['positionImpact']> { try {; // Get current roster for position
      const positionPlayers = await this.getPositionPlayers(teamNeeds.teamId, player.position);

      // Determine if player would be starter
      const isStarter = positionPlayers.length < 1 ||;
        positionPlayers.every(p => p.projected_value < player.projectedValue);

      // Calculate depth improvement
      const depthImprovement = this.calculateDepthImprovement(positionPlayers, player);

      // Get replacement level for position
      const replacementLevel = await this.getReplacementLevel(player.position);

      return {
        starter isStarter;
  depth: Math.min(5, Math.max(1, depthImprovement)),
        replacementLevel
       }
    } catch (error) { return {
        starter, false,
  depth: 1;
        replacementLevel: 50
       }
    }
  }

  // Calculate roster fit analysis
  private async calculateRosterFit(async calculateRosterFit(
    player, WaiverPlayer,
  teamNeeds: any
  ): : Promise<): PromiseWaiverAnalysis['rosterFit']> { try {; // Get position need level
      const needLevel = teamNeeds.positionNeeds[player.position] || 0;

      // Calculate upgrade potential
      const currentBest = await this.getCurrentBestAtPosition(teamNeeds.teamId, player.position);
      const upgradePotential = currentBest > 0;
        ? ((player.projectedValue - currentBest) / currentBest) * 100  50;

      // Assess risk level
      const riskLevel = this.assessRiskLevel(player, upgradePotential);

      return {
        needLevel,
        upgradePotential: Math.max(0, Math.min(100, upgradePotential)),
        riskLevel
       }
    } catch (error) { return {
        needLevel: 5;
  upgradePotential: 10;
        riskLevel: 'medium'
       }
    }
  }

  // Analyze market competition for waiver claims
  private async analyzeMarketCompetition(async analyzeMarketCompetition(
    player, WaiverPlayer,
  leagueId: string
  ): : Promise<): PromiseWaiverAnalysis['marketAnalysis']> { try {; // Calculate position scarcity
      const scarcity = await this.calculatePositionScarcity(player.position, leagueId);

      // Estimate number of teams likely to claim
      const competition = await this.estimateCompetition(player, leagueId);

      // Calculate claim probability
      const claimProbability = this.calculateClaimProbability(player, scarcity, competition);

      return { scarcity, competition,
        claimProbability
        }
    } catch (error) { return {
        scarcity: 0.5;
  competition: 5;
        claimProbability: 0.3
       }
    }
  }

  // Calculate overall impact score
  private calculateImpactScore(
    positionImpact: WaiverAnalysis['positionImpact'];
  rosterFit: WaiverAnalysis['rosterFit'];
    marketAnalysis: WaiverAnalysis['marketAnalysis'];
  prediction: any
  ); number { let score = 0;

    // Position impact (40% weight)
    if (positionImpact.starter) score += 30;
    score += (positionImpact.depth / 5) * 10;

    // Roster fit (35% weight)
    score += (rosterFit.needLevel / 10) * 20;
    score += Math.min(15, rosterFit.upgradePotential / 10);

    // Market opportunity (15% weight)
    score += (1 - marketAnalysis.claimProbability) * 15;

    // Prediction confidence (10% weight)
    score += (prediction.confidence || 70) / 10;

    return Math.max(0, Math.min(100, score));
   }

  // Generate AI insights for waiver player
  private async generateAIInsights(async generateAIInsights(
    player, WaiverPlayer,
  positionImpact: WaiverAnalysis['positionImpact'];
    rosterFit: WaiverAnalysis['rosterFit']
  ): : Promise<): Promisestring[]> { const insights: string[] = [];

    // Starter potential
    if (positionImpact.starter) {
      insights.push('Could start immediately at this position');
     } else if (positionImpact.depth >= 3) {
      insights.push('Strong depth addition with starting potential');
    }

    // Upgrade potential
    if (rosterFit.upgradePotential >= 20) {
      insights.push(`Significant upgrade potential: +${rosterFit.upgradePotential.toFixed(1)}%`);
    } else if (rosterFit.upgradePotential >= 10) {
      insights.push(`Moderate upgrade: +${rosterFit.upgradePotential.toFixed(1)}%`);
    }

    // Age consideration
    if (player.age <= 25) {
      insights.push('Young player with long-term potential');
    } else if (player.age >= 32) {
      insights.push('Experienced player - consider dynasty value');
    }

    // Injury status
    if (player.injuryStatus && player.injuryStatus !== 'healthy') {
      insights.push(`Injury concern: ${player.injuryStatus}`);
    }

    return insights.slice(0, 4);
  }

  // Generate recommendation for waiver claim
  private generateRecommendation(
    impactScore, number,
  marketAnalysis: WaiverAnalysis['marketAnalysis'];
    rosterFit: WaiverAnalysis['rosterFit']
  ); WaiverAnalysis['recommendations'] { let priority: 'high' | 'medium' | 'low';
    let action: 'claim' | 'monitor' | 'ignore';
    let timeline, string,

    if (impactScore >= 75 && marketAnalysis.claimProbability <= 0.3) {
      priority = 'high';
      action = 'claim';
      timeline = 'Claim immediately when available';
     } else if (impactScore >= 60 && marketAnalysis.claimProbability <= 0.5) { priority = 'medium';
      action = 'claim';
      timeline = 'Claim within first 24 hours';
     } else if (impactScore >= 40) { priority = 'low';
      action = 'monitor';
      timeline = 'Monitor for 48 hours, claim if still available';
     } else { priority = 'low';
      action = 'ignore';
      timeline = 'Not recommended for claim';
     }

    const reasoning = this.generateRecommendationReasoning(impactScore, marketAnalysis, rosterFit,
      action
    );

    return { priority, action, reasoning,
      timeline
  :   }
  }

  // Generate recommendation reasoning
  private generateRecommendationReasoning(
    impactScore, number,
  marketAnalysis: WaiverAnalysis['marketAnalysis'];
    rosterFit: WaiverAnalysis['rosterFit'];
  action: string
  ); string { const reasons: string[] = [];

    if (action === 'claim') {
      if (impactScore >= 75) {
        reasons.push('Exceptional value with high impact potential');
       } else {
        reasons.push('Solid addition that addresses team needs');
      }

      if (marketAnalysis.claimProbability <= 0.3) {
        reasons.push('Low competition increases claim success probability');
      }

      if (rosterFit.upgradePotential >= 15) {
        reasons.push('Significant upgrade over current roster');
      }
    } else if (action === 'monitor') {
      reasons.push('Potential value but requires monitoring due to competition');
      if (marketAnalysis.claimProbability > 0.5) {
        reasons.push('High competition may drive up claim costs');
      }
    } else {
      reasons.push('Limited impact or high competition makes claim unattractive');
    }

    return reasons.join('. ');
  }

  // Process waiver claim decision
  async processWaiverClaim(async processWaiverClaim(
    leagueId, string,
  teamId, string,
    playerId, string,
  priority, number,
    maxBid, number,
  reasoning: string
  ): : Promise<): Promisevoid> { try {; // Record waiver claim
      await database.query(`
        INSERT INTO waiver_claims (
          league_id, team_id, player_id, priority, max_bid, reasoning, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
      `, [leagueId, teamId, playerId, priority, maxBid, reasoning]);

      // Broadcast waiver claim notification
      webSocketManager.broadcastWaiverNotification({
        leagueId, teamId, playerId,type: 'claimed' as const ; // Changed from 'claim_submitted' to match allowed type
        // priority and maxBid don't exist in interface
       });

      console.log(`📋 Waiver claim processed ${playerId} by ${teamId} (Priority, ${priority})`);
    } catch (error) {
      console.error('Error processing waiver claim:', error);
    }
  }

  // Get available waiver players
  private async getAvailableWaiverPlayers(async getAvailableWaiverPlayers(leagueId: string): : Promise<): PromiseWaiverPlayer[]> { try {
      const result = await database.query(`
        SELECT
          np.id as player_id,
          CONCAT(np.first_name, ' ', np.last_name) as name,
          np.position,
          COALESCE(nt.abbreviation, 'FA') as team,
          COALESCE(np.fantasy_value, 0) as current_value,
          COALESCE(np.projected_points, 0) as projected_value,
          COALESCE(np.injury_status, 'healthy') as injury_status,
          COALESCE(np.age, 25) as age,
          COALESCE(np.experience, 1) as experience,
          COALESCE(np.waiver_rank, 999) as waiver_rank,
          COALESCE(np.dropoff_rank, 999) as dropoff_rank,
          'available' as availability,
          NOW() as last_updated
        FROM nfl_players np
        LEFT JOIN nfl_teams nt ON np.team_id = nt.id
        WHERE np.waiver_rank IS NOT NULL
          AND np.waiver_rank <= 200
        ORDER BY np.waiver_rank ASC
        LIMIT 100
      `);

      return result.rows.map(row => ({
        playerId: row.player_id;
  name: row.name;
        position: row.position;
  team: row.team;
        currentValue: parseFloat(row.current_value) || 0;
  projectedValue: parseFloat(row.projected_value) || 0;
        injuryStatus: row.injury_status;
  age: parseInt(row.age) || 25;
        experience: parseInt(row.experience) || 1;
  waiverRank: parseInt(row.waiver_rank) || 999;
        dropOffRank: parseInt(row.dropoff_rank) || 999;
  availability: row.availability as WaiverPlayer['availability'];
        lastUpdated: new Date(row.last_updated)
       }));
    } catch (error) {
      console.error('Error getting waiver players:', error);
      return [];
    }
  }

  // Analyze team needs for waiver purposes
  private async analyzeTeamNeeds(async analyzeTeamNeeds(leagueId, string,
  teamId: string): : Promise<): Promiseany> { try {; // Get current roster
      const roster = await this.getTeamRoster(teamId);

      // Get league settings
      const leagueSettings = await database.query('SELECT * FROM leagues WHERE id = $1',
        [leagueId]
      );

      // Calculate position needs
      const positionNeeds Record<string, number> = { }
      const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

      for (const position of positions) { const positionPlayers = roster.filter(p => p.position === position);
        const required = leagueSettings.rows[0]?.starting_positions?.[position] || 1;

        if (positionPlayers.length < required) {
          positionNeeds[position] = 10; // Critical need
         } else if (positionPlayers.length === required) {
          positionNeeds[position] = 7; // Moderate need
        } else {
          positionNeeds[position] = Math.max(0, 5 - (positionPlayers.length - required));
        }
      }

      return {
        teamId, positionNeeds,
        overallNeeds: Object.values(positionNeeds).reduce((sum, need) => sum + need, 0) / positions.length
      }
    } catch (error) {
      console.error('Error analyzing team needs:', error);
      return {
        teamId,
        positionNeeds: { Q,
  B: 5;
  RB: 5; WR: 5;
  TE: 5; K: 5;
  DST: 5 },
        overallNeeds: 5
      }
    }
  }

  // Get team roster
  private async getTeamRoster(async getTeamRoster(teamId: string): : Promise<): Promiseany[]> { const result = await database.query(`
      SELECT
        r.*,
        np.first_name,
        np.last_name,
        np.position,
        COALESCE(np.projected_points, 0) as projected_value
      FROM rosters r
      JOIN nfl_players np ON r.player_id = np.id
      WHERE r.team_id = $1 AND r.season_year = 2025
    `, [teamId]);

    return result.rows;
   }

  // Get position players for team
  private async getPositionPlayers(async getPositionPlayers(teamId, string,
  position: string): : Promise<): Promiseany[]> { const result = await database.query(`
      SELECT COALESCE(np.projected_points, 0) as projected_value
      FROM rosters r
      JOIN nfl_players np ON r.player_id = np.id
      WHERE r.team_id = $1 AND np.position = $2 AND r.season_year = 2025
      ORDER BY np.projected_points DESC
    `, [teamId, position]);

    return result.rows;
   }

  // Calculate depth improvement
  private calculateDepthImprovement(currentPlayers: any[];
  newPlayer: WaiverPlayer); number {const sortedValues = [...currentPlayers.map(p => p.projected_value), newPlayer.projectedValue].sort((a, b) => b - a);

    // Calculate how much the new player improves the depth
    const originalTop5 = currentPlayers.slice(0, 5).reduce((sum, p) => sum + p.projected_value, 0);
    const newTop5 = sortedValues.slice(0, 5).reduce((sum, v) => sum + v, 0);

    return newTop5 - originalTop5 > 0 ? Math.min(5, (newTop5 - originalTop5) / 50) : 1;
   }

  // Get replacement level for position
  private async getReplacementLevel(async getReplacementLevel(position: string): : Promise<): Promisenumber> { const baseline,
  s: Record<string, number> = {
      QB: 200;
  RB: 50; WR: 30;
  TE: 20; K: 100;
  DST: 80
     }
    return baselines[position] || 50;
  }

  // Get current best player at position
  private async getCurrentBestAtPosition(async getCurrentBestAtPosition(teamId, string,
  position: string): : Promise<): Promisenumber> {const players = await this.getPositionPlayers(teamId, position);
    return players.length > 0 ? Math.max(...players.map(p => p.projected_value)) : 0;
   }

  // Assess risk level
  private assessRiskLevel(player, WaiverPlayer,
  upgradePotential: number): 'low' | 'medium' | 'high' { let riskScore = 0;

    if (player.age < 23) riskScore += 2; // Young player risk
    if (player.age > 32) riskScore += 1; // Age risk
    if (player.injuryStatus !== 'healthy') riskScore += 3; // Injury risk
    if (player.experience < 2) riskScore += 1; // Inexperience risk
    if (upgradePotential < 5) riskScore += 1; // Low upside risk

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
   }

  // Calculate position scarcity
  private async calculatePositionScarcity(async calculatePositionScarcity(position, string,
  leagueId: string): : Promise<): Promisenumber> { try {; // Get league size
      const leagueSize = await database.query('SELECT COUNT(*) as team_count FROM league_teams WHERE league_id = $1',
        [leagueId]
      );

      const teamCount = parseInt(leagueSize.rows[0]?.team_count || '12');

      // Get available players at position
      const availableCount = await database.query('SELECT COUNT(*) as player_count FROM nfl_players WHERE position = $1 AND waiver_rank IS NOT NULL',
        [position]
      );

      const playerCount = parseInt(availableCount.rows[0]?.player_count || '50');

      // Calculate scarcity (higher = more scarce)
      return Math.min(1, playerCount / (teamCount * 2));
     } catch (error) { return 0.5;
     }
  }

  // Estimate competition for player
  private async estimateCompetition(async estimateCompetition(player WaiverPlayer;
  leagueId: string): : Promise<): Promisenumber> { try {; // Simple estimation based on player value and position
      let baseCompetition = 3;

      if (player.projectedValue > 150) baseCompetition += 3;
      else if (player.projectedValue > 100) baseCompetition += 2;
      else if (player.projectedValue > 50) baseCompetition += 1;

      // Position scarcity adjustment
      const scarcity = await this.calculatePositionScarcity(player.position, leagueId);
      if (scarcity < 0.3) baseCompetition += 2; // High scarcity = more competition

      return Math.min(12, baseCompetition);
     } catch (error) { return 5;
     }
  }

  // Calculate claim probability
  private calculateClaimProbability(
    player WaiverPlayer;
  scarcity, number,
    competition: number
  ); number {
    // Base probability
    let probability = 0.5;

    // Adjust for value
    if (player.projectedValue > 150) probability += 0.2;
    else if (player.projectedValue < 30) probability -= 0.2;

    // Adjust for scarcity
    probability += (1 - scarcity) * 0.2;

    // Adjust for competition
    probability += (competition / 12) * 0.3;

    return Math.max(0.1, Math.min(0.9, probability));
  }

  // Group analyses by position
  private groupByPosition(analyses: WaiverAnalysis[]): Record<string, WaiverAnalysis[]> { const grouped: Record<string, WaiverAnalysis[]> = { }
    for (const analysis of analyses) { const position = analysis.playerId; // This should be the position, but we need to get it from the player data
      if (!grouped[position]) {
        grouped[position] = [];
       }
      grouped[position].push(analysis);
    }

    return grouped;
  }

  // Analyze budget for waiver claims
  private async analyzeBudget(async analyzeBudget(
    leagueId, string,
  teamId, string,
    topTargets: WaiverAnalysis[]
  ): : Promise<): PromiseWaiverWireReport['budgetAnalysis']> { try {; // Get team budget info
      const budgetResult = await database.query('SELECT waiver_budget FROM teams WHERE id = $1',
        [teamId]
      );

      const remainingBudget = parseInt(budgetResult.rows[0]?.waiver_budget || '100');

      // Calculate recommended claims based on budget and targets
      const highPriorityTargets = topTargets.filter(t => t.recommendations.priority === 'high');
      const recommendedClaims = Math.min(highPriorityTargets.length, Math.floor(remainingBudget / 10));

      // Generate risk assessment
      let riskAssessment = 'Low risk - budget allows for strategic claims';
      if (remainingBudget < 50) {
        riskAssessment = 'Moderate risk - limited budget for claims';
       } else if (remainingBudget < 20) { riskAssessment = 'High risk - very limited budget remaining';
       }

      return { remainingBudget, recommendedClaims,
        riskAssessment
       }
    } catch (error) { return {
        remainingBudget: 100;
  recommendedClaims: 2;
        riskAssessment: 'Unable to analyze budget'
       }
    }
  }

  // Generate strategic recommendations
  private async generateStrategy(
    teamNeeds, any,
  positionBreakdown: Record<string, WaiverAnalysis[]>
  ): : Promise<WaiverWireReport['strategy']> { const focusAreas: string[] = [];
    const avoidPositions: string[] = [];

    // Identify focus areas
    Object.entries(teamNeeds.positionNeeds).forEach(([position, need]) => {
      const needValue = need as number; // Type assertion since need is unknown
      if (needValue >= 8) {
        focusAreas.push(position);
       }
    });

    // Identify positions to avoid
    Object.entries(positionBreakdown).forEach(([position, analyses]) => { if (analyses.length === 0 || analyses.every(a => a.impactScore < 30)) {
        avoidPositions.push(position);
       }
    });

    let approach = 'Balanced waiver strategy';
    if (focusAreas.length >= 2) { approach = 'Focus on critical position needs';
     } else if (teamNeeds.overallNeeds >= 7) { approach = 'Aggressive waiver approach to address needs';
     } else { approach = 'Conservative approach - monitor for value';
     }

    return { approach, focusAreas,
      avoidPositions
  :   }
  }

  // Fallback methods
  private getFallbackReport(leagueId, string,
  teamId: string); WaiverWireReport { return {
      leagueId, teamId,
      timestamp: new Date();
  topTargets: [];
      positionBreakdown: { },
      budgetAnalysis: {
  remainingBudget: 100;
  recommendedClaims: 2;
        riskAssessment: 'Analysis unavailable'
      },
      strategy: {
  approach: 'Conservative monitoring approach';
  focusAreas: ['QB', 'RB', 'WR'],
        avoidPositions: []
      },
      breakoutCandidates: [], // Missing property
      marketInefficiencies: [], // Missing property
      trendingUp: [], // Missing property
      mustAddThisWeek: [] ; // Missing property
    }
  }

  private getFallbackAnalysis(player WaiverPlayer;
  teamId: string); WaiverAnalysis { return {
      playerId: player.playerId;
      teamId,
      impactScore: 50;
  confidence: 50;
      positionImpact: {
  starter, false,
  depth: 2;
        replacementLevel: 50
       },
      rosterFit: {
  needLevel: 5;
  upgradePotential: 10;
        riskLevel: 'medium'
      },
      marketAnalysis: {
  scarcity: 0.5;
  competition: 5;
        claimProbability: 0.3
      },
      aiInsights: ['Analysis temporarily unavailable'];
  recommendations: {
  priority: 'medium';
  action: 'monitor';
        reasoning: 'Fallback recommendation due to analysis error';
  timeline: 'Monitor for 24 hours'
      }
    }
  }

  // Enhanced breakout candidate filtering and analysis
  private async filterBreakoutCandidates(async filterBreakoutCandidates(
    breakouts: BreakoutPrediction[];
  waiverPlayers: WaiverPlayer[]
  ): : Promise<): PromiseWaiverWireReport['breakoutCandidates']> { const candidates: WaiverWireReport['breakoutCandidates'] = [];
    const waiverPlayerIds = new Set(waiverPlayers.map(p => p.playerId));

    for (const breakout of breakouts) {
      // Only include players available on waivers
      if (waiverPlayerIds.has(breakout.playerId)) {
        candidates.push({
          playerId: breakout.playerId;
  breakoutScore: Math.round(breakout.breakoutProbability * 100);
          weeklyWatchList: breakout.targetWeek <= 3, // Next 3 weeks
          catalysts: breakout.catalysts.map(c => c.description)
         });
      }
    }

    return candidates.sort((a, b) => b.breakoutScore - a.breakoutScore);
  }

  private async identifyTeamSpecificInefficiencies(async identifyTeamSpecificInefficiencies(
    marketInefficiencies: any[];
  teamNeeds: any
  ): : Promise<): PromiseWaiverWireReport['marketInefficiencies']> { const teamSpecific: WaiverWireReport['marketInefficiencies'] = [];

    for (const inefficiency of marketInefficiencies) {
      try {
        // Get player position to check against team needs
        const playerResult = await database.query(`
          SELECT position FROM nfl_players WHERE id = $1
        `, [inefficiency.playerId]);

        if (playerResult.rows.length === 0) continue;

        const position = playerResult.rows[0].position;
        const needLevel = teamNeeds.positionNeeds[position] || 0;

        // Only include if team has at least moderate need
        if (needLevel >= 5) {
          let reasoning = `Undervalued ${position } with ${inefficiency.valueGap.toFixed(1)} point value gap`
          if (needLevel >= 8) { reasoning: += ' - addresses critical team need',
           } else if (needLevel >= 6) { reasoning: += ' - fills team need',
           }

          teamSpecific.push({
            playerId: inefficiency.playerId;
  valueGap: inefficiency.valueGap;
            reasoning
          });
        }
      } catch (error) {
        console.error(`Error processing inefficiency for ${inefficiency.playerId}, `, error);
      }
    }

    return teamSpecific.sort((a, b) => b.valueGap - a.valueGap);
  }

  private isTrendingUp(analysis: WaiverAnalysis); boolean {
    // Check if player shows positive trend indicators
    const hasPositiveCatalysts = analysis.aiInsights.some(insight =>
      insight.includes('increasing') ||
      insight.includes('growing') ||
      insight.includes('expansion') ||
      insight.includes('opportunity')
    );

    const hasUpgradePotential = analysis.rosterFit.upgradePotential > 15;
    const hasGoodMarketPosition = analysis.marketAnalysis.claimProbability < 0.5;

    return hasPositiveCatalysts && hasUpgradePotential && hasGoodMarketPosition;
  }

  // Enhanced opportunity scoring integration
  private async calculateEnhancedImpactScore(
    positionImpact: WaiverAnalysis['positionImpact'];
  rosterFit: WaiverAnalysis['rosterFit'];
    marketAnalysis: WaiverAnalysis['marketAnalysis'];
  prediction, any,
    breakoutData?: BreakoutPrediction
  ): : Promise<number> {; // Base calculation (same as before)
    let score = 0;

    // Position impact (30% weight - reduced from 40%)
    if (positionImpact.starter) score += 25;
    score += (positionImpact.depth / 5) * 5;

    // Roster fit (30% weight - reduced from 35%)
    score += (rosterFit.needLevel / 10) * 15;
    score += Math.min(15, rosterFit.upgradePotential / 10);

    // Market opportunity (15% weight)
    score += (1 - marketAnalysis.claimProbability) * 15;

    // Prediction confidence (10% weight)
    score += (prediction.confidence || 70) / 10;

    // NEW Breakout potential bonus (15% weight)
    if (breakoutData) { const breakoutBonus = breakoutData.breakoutProbability * 15;
      score += breakoutBonus;

      // Additional bonus for high-opportunity players
      // opportunityScore doesn't exist in BreakoutPrediction interface
      // if (breakoutData.opportunityScore > 0.7) {
      //   score += 5; // Opportunity bonus
      //  }

      // Catalyst bonus
      if (breakoutData.catalysts.length > 2) { score: += 3; // Multiple catalysts
       }
    }

    return Math.max(0, Math.min(100, score));
  }

  // Enhanced AI insights generation
  private async generateEnhancedAIInsights(
    player, WaiverPlayer,
  positionImpact: WaiverAnalysis['positionImpact'];
    rosterFit: WaiverAnalysis['rosterFit'];
    breakoutData?: BreakoutPrediction
  ): : Promise<string[]> { const insights: string[] = [];

    // Base insights (from original method)
    if (positionImpact.starter) {
      insights.push('Could start immediately at this position');
     } else if (positionImpact.depth >= 3) {
      insights.push('Strong depth addition with starting potential');
    }

    if (rosterFit.upgradePotential >= 20) {
      insights.push(`Significant upgrade potential: +${rosterFit.upgradePotential.toFixed(1)}%`);
    }

    // NEW: Breakout-specific insights
    if (breakoutData) { if (breakoutData.breakoutProbability > 0.7) {
        insights.push('High breakout probability based on opportunity metrics'),
       }

      // opportunityScore doesn't exist in BreakoutPrediction interface
      // if (breakoutData.opportunityScore > 0.8) {
      //   insights.push('Elite opportunity score indicates significant target share growth');
      // }

      // Add catalyst insights
      const highImpactCatalysts = breakoutData.catalysts.filter(c => c.impactScore > 70);
      if (highImpactCatalysts.length > 0) {
        insights.push(`Breakout catalyst: ${highImpactCatalysts[0].description}`);
      }

      // Add trend insight
      if (breakoutData.opportunityMetrics.targetShareTrend > 0.05) {
        insights.push('Positive target share trend supports upside case');
      }
    }

    // Age and experience factors
    if (player.age <= 25) {
      insights.push('Young player with long-term potential');
    }

    if (player.experience <= 2) {
      insights.push('Early career player with development upside');
    }

    return insights.slice(0, 5); // Top 5 insights
  }

  // Advanced waiver claim priority calculation
  async calculateAdvancedClaimPriority(async calculateAdvancedClaimPriority(
    analysis, WaiverAnalysis,
  teamBudget, number,
    currentWeek: number
  ): : Promise<): Promise  {
    priority, number, // 1-10 scale,
    recommendedBid, number,
    urgencyFactors: string[],
    competitionLevel: 'low' | 'medium' | 'high' | 'extreme' }> { let priority = 5; // Base priority
    const urgencyFactors: string[] = [];

    // Impact-based priority adjustment
    if (analysis.impactScore >= 80) {
      priority += 3;
      urgencyFactors.push('Exceptional impact potential');
     } else if (analysis.impactScore >= 65) { priority: += 2;
      urgencyFactors.push('High impact potential');
     } else if (analysis.impactScore >= 50) { priority: += 1,
     }

    // Market competition adjustment
    if (analysis.marketAnalysis.competition <= 3) { priority: += 1;
      urgencyFactors.push('Low competition expected');
     } else if (analysis.marketAnalysis.competition >= 7) { priority: += 2;
      urgencyFactors.push('High competition expected');
     }

    // Team need urgency
    if (analysis.rosterFit.needLevel >= 8) { priority: += 2;
      urgencyFactors.push('Addresses critical team need');
     }

    // Breakout potential urgency
    const breakoutCandidate = await this.getBreakoutDataForPlayer(analysis.playerId);
    if (breakoutCandidate && breakoutCandidate.breakoutProbability > 0.6) { priority: += 2;
      urgencyFactors.push('High breakout probability');
     }

    // Timeline urgency (if breakout expected soon)
    if (breakoutCandidate && breakoutCandidate.targetWeek <= currentWeek + 2) { priority: += 1;
      urgencyFactors.push('Breakout expected within 2 weeks');
     }

    // Calculate recommended bid
    const baseBid = Math.min(teamBudget * 0.15, 25); // 15% of budget or $25, whichever is lower
    const priorityMultiplier = priority / 5; // Convert to multiplier
    const recommendedBid = Math.floor(baseBid * priorityMultiplier);

    // Determine competition level
    let competitionLevel: 'low' | 'medium' | 'high' | 'extreme';
    if (analysis.marketAnalysis.competition <= 2) competitionLevel = 'low';
    else if (analysis.marketAnalysis.competition <= 4) competitionLevel = 'medium';
    else if (analysis.marketAnalysis.competition <= 7) competitionLevel = 'high';
    else competitionLevel = 'extreme';

    return {
      priority: Math.max(1, Math.min(10, priority)),
      recommendedBid: Math.min(recommendedBid, teamBudget),
      urgencyFactors,
      competitionLevel
    }
  }

  private async getBreakoutDataForPlayer(async getBreakoutDataForPlayer(playerId: string): : Promise<): PromiseBreakoutPrediction | null> { try {; // Get breakout report and find this player
      const breakoutReport = await breakoutIdentifier.generateBreakoutReport(1);
      return breakoutReport.topBreakouts.find(b => b.playerId === playerId) || null;
     } catch (error) {
      console.error('Error getting breakout data', error);
      return null;
    }
  }

  // Generate weekly waiver wire newsletter
  async generateWaiverWireNewsletter(async generateWaiverWireNewsletter(leagueId: string): Promise<): Promise  {
  title, string,
    sections: Array<{
  heading, string,
      content: string[],
    players: Array<{
  name, string,
    position, string,
        reasoning, string,
    urgency: 'immediate' | 'this_week' | 'monitor',
      }>;
    }>;
  }> { try {
      // Get league-wide waiver analysis
      const breakoutReport = await breakoutIdentifier.generateBreakoutReport(1);
      const topBreakouts = breakoutReport.weeklyWatchList.slice(0, 5);

      const newsletter = {
        title: `Week ${new Date().getWeek() } Waiver Wire Intelligence Report`,
        sections: [
          {
            heading: '🚀 Breakout Alert; Must-Add Players',
            content: [
              'Our AI has identified players with significant breakout potential for the coming weeks.';
              'These recommendations are based on opportunity metrics, usage trends, and team contexts.'
            ],
            players: topBreakouts.map(breakout => ({
  name: breakout.name;
  position: breakout.position;
              reasoning: breakout.reasoning.join(' | ');
  urgency: (breakout.targetWeek <= 2 ? 'immediate' : 'this_week') as 'immediate' | 'this_week' | 'monitor'
            }))
          },
          {
            heading: '📈 Market Inefficiencies';
  content: [
              'Players whose ADP/ownership doesn\'t reflect their projected value.';
              'Consider these as potential league-winning pickups with low competition.'
            ],
            players: breakoutReport.marketInefficiencies.slice(0, 3).map(inefficiency => ({
              name: 'Player Name', // Would need to look up name
              position: 'Position';
  reasoning: `${inefficiency.valueGap.toFixed(1)} point value gap vs.current market price`,
              urgency: 'monitor' as 'immediate' | 'this_week' | 'monitor'
            }))
          },
          {
            heading: '⚡ Trending Up';
  content: [
              'Players showing positive momentum in target share, snap counts, or team role.',
              'Get ahead of the curve before their ownership spikes.'
            ],
            players: breakoutReport.emergingTrends
              .filter(trend => trend.impact === 'positive')
              .slice(0, 3)
              .map(trend => ({
                name: trend.trend;
  position: 'Multiple';
                reasoning: `${trend.affectedPlayers.length} players benefiting from this trend`,
                urgency: 'this_week' as 'immediate' | 'this_week' | 'monitor'
              }))
          }
        ]
      }
      return newsletter;
    } catch (error) {
      console.error('Error generating newsletter:', error);
      return {
        title: 'Waiver Wire Report - Analysis Unavailable';
  sections: []
      }
    }
  }

  // Health check
  async healthCheck(): : Promise<  {
    status: 'healthy' | 'degraded' | 'unhealthy',
    cacheSize, number,
    activeAnalyses, number,
    breakoutIntegration: boolean }> { try {
    await database.query('SELECT 1');

      return {
        status: 'healthy';
  cacheSize: this.waiverCache.size;
        activeAnalyses: 0; // Would track actual active analyses
        breakoutIntegration: true
       }
    } catch (error) { return {
        status: 'unhealthy';
  cacheSize: this.waiverCache.size;
        activeAnalyses: 0;
  breakoutIntegration: false
       }
    }
  }
}

// Singleton instance
export const intelligentWaiverSystem = new IntelligentWaiverSystem();
export default intelligentWaiverSystem;