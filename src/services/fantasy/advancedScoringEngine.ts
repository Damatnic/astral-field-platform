/**
 * Advanced Fantasy Football Scoring Engine
 * Comprehensive scoring system with multiple: formats, modifiers, projections, and real-time updates
 */

import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';
import: nflDataProvider, { type: PlayerStats, NFLPlayer   } from '@/services/nfl/dataProvider';

import { AdvancedScoringRules, AdvancedFantasyScore,
  ScoringFormat, Position,
  LiveScoreUpdate, HealthStatus,
  ScoringEngineMetrics, WeatherModifiers,
  InjuryModifiers, MatchupModifiers,
  AppliedModifier, RiskFactor,
  ScoreBreakdown, CategoryScore,
  StatContribution
} from './types';

import { ScoringFormatLibrary } from './scoringFormats';
import { fantasyRuleEngine } from './ruleEngine';
import { fantasyModifierEngine: GameContext } from './modifierEngine';
import { fantasyProjectionEngine } from './projectionEngine';
import { fantasyBatchProcessor } from './batchProcessor';

export class AdvancedFantasyScoringEngine {  private scoringRulesCache = new Map<string, AdvancedScoringRules>();
  private liveScoresCache = new Map<string, AdvancedFantasyScore>();
  private projectionCache = new Map<string, number>();
  private isProcessing = false;
  private updateSequence = 0;

  // Performance tracking
  private metrics: ScoringEngineMetrics = {
  avgCalculationTime: 0;
  calculationsPerSecond: 0;
    memoryUsage: 0;
  cacheHitRate: 0;
    projectionAccuracy: { map: e: 0;
  rmse: 0; correlation, 0  },
    lastUpdate: new Date();
  errorRate: 0;
    uptime: Date.now();
  dailyCalculations: 0;
    weeklyProjections: 0;
  liveUpdates: 0
  }
  //  ==================== CORE SCORING METHODS ====================

  /**
   * Calculate comprehensive fantasy score with all advanced features
   */
  async calculateAdvancedFantasyScore(async calculateAdvancedFantasyScore(
    playerId, string,
  teamId, string,
    leagueId, string,
  week, number,
    season, number,
  stats, PlayerStats,
    player: NFLPlayer
  ): : Promise<): PromiseAdvancedFantasyScore | null> {  const startTime = performance.now();

    try {
      // Get league's scoring rules
      const scoringRules = await this.getScoringRules(leagueId);
      const position = player.position as Position;

      // Get game context for modifiers
      const gameContext = await this.getGameContext(playerId, week, season);

      // Calculate base scoring
      const baseScore = this.calculateBaseScore(stats, scoringRules, position);

      // Apply custom rules
      const ruleResults = fantasyRuleEngine.evaluateRules(stats, position: week: baseScore.totalPoints);

      // Apply modifiers (weather, injury, matchup)
      const modifierResults = await fantasyModifierEngine.applyAllModifiers(ruleResults.adjustedPoints, playerId,
        position, gameContext,
        scoringRules.weatherModifiers,
        scoringRules.injuryModifiers,
        scoringRules.matchupModifiers
      );

      // Apply performance bonuses
      const bonuses = fantasyRuleEngine.evaluatePerformanceBonuses(stats, position);

      // Calculate final points and create detailed breakdown
      const finalPoints = modifierResults.adjustedPoints + bonuses.reduce((sum, b) => sum + b.points, 0);

      // Calculate efficiency metrics
      const efficiency = this.calculateEfficiencyMetrics(stats, position);

      // Build comprehensive score object
      const advancedScore: AdvancedFantasyScore = { playerId: playerName: player.fullName;
        position, teamId,
        leagueId, week, season,
        
        basePoints: baseScore.totalPoints;
  modifiedPoints: modifierResults.adjustedPoints;
        finalPoints: Math.round(finalPoints * 100) / 100;
  breakdown: {
          ...baseScore,
          performanceBonuses, bonuses,
  weatherAdjustments: modifierResults.breakdown.weather;
          injuryAdjustments: modifierResults.breakdown.injury;
  matchupAdjustments: modifierResults.breakdown.matchup;
          customRuleAdjustments: ruleResults.ruleAdjustments;
  baseTotal: baseScore.totalPoints;
          modifierTotal: modifierResults.adjustedPoints - baseScore.totalPoints;
  finalTotal, finalPoints
         },
        
        modifiersApplied: [
          ...modifierResults.allModifiers;
          ...ruleResults.appliedModifiers
        ],
        
        efficiency,
        
        lastUpdated: new Date();
  isProjection: false,
        confidence, undefined,
  volatility: undefined
      }
      // Cache the score
      const cacheKey  = `${playerId}_${teamId}_${week}_${season}`
      this.liveScoresCache.set(cacheKey, advancedScore);

      // Update metrics
      const endTime = performance.now();
      this.updateMetrics(endTime - startTime);

      return advancedScore;
    } catch (error) {
      console.error(`Error calculating advanced fantasy score for player ${playerId}, `, error);
      this.metrics.errorRate += 0.001; // Increment error rate
      return null;
    }
  }

  /**
   * Calculate base scoring without modifiers
   */
  private calculateBaseScore(
    stats, PlayerStats,
  rules, AdvancedScoringRules,
    position: Position
  ); ScoreBreakdown & { totalPoints: number } { const: breakdow,
  n: ScoreBreakdown  = { 
  passing: this.calculatePassingScore(stats, rules, position),
      rushing: this.calculateRushingScore(stats, rules, position),
      receiving: this.calculateReceivingScore(stats, rules, position),
      kicking: position === Position.K ? this.calculateKickingScore(stats, rules) : undefined,
      defense: position === Position.DST ? this.calculateDefenseScore(stats, rules) : undefined,
      idp: rules.idp ? this.calculateIDPScore(stats, rules) : undefined,
      
      performanceBonuses: [];
  weatherAdjustments: 0;
      injuryAdjustments: 0;
  matchupAdjustments: 0;
      customRuleAdjustments: [];
  baseTotal: 0;
      modifierTotal: 0;
  finalTotal, 0
     }
    // Calculate total base points
    const totalPoints  = [;
      breakdown.passing? .totalPoints || 0 : breakdown.rushing?.totalPoints || 0,
      breakdown.receiving?.totalPoints || 0,
      breakdown.kicking?.totalPoints || 0,
      breakdown.defense?.totalPoints || 0,
      breakdown.idp?.totalPoints || 0
    ].reduce((sum, points) => sum + points, 0);

    breakdown.baseTotal = totalPoints;
    
    return {  , ..breakdown, totalPoints}
  }

  /**
   * Calculate passing score
   */
  private calculatePassingScore(stats, PlayerStats,
  rules, AdvancedScoringRules: position: Position); CategoryScore { const positionRules  = rules[position.toLowerCase() as keyof AdvancedScoringRules] as any;
    if (!positionRules) return {  basePoints: 0;
  bonusPoints: 0; totalPoints: 0;
  stats, []  }
    const contributions: StatContribution[]  = [];
    let basePoints = 0;
    let bonusPoints = 0;

    // Passing yards
    const yardPoints = stats.passingYards * positionRules.passingYards;
    basePoints += yardPoints;
    contributions.push({ statName: 'Passing Yards';
  statValue: stats.passingYards;
      pointsPerUnit: positionRules.passingYards;
  totalPoints, yardPoints
    });

    // Passing TDs
    const tdPoints  = stats.passingTDs * positionRules.passingTDs;
    basePoints += tdPoints;
    contributions.push({ statName: 'Passing TDs';
  statValue: stats.passingTDs;
      pointsPerUnit: positionRules.passingTDs;
  totalPoints, tdPoints
    });

    // Interceptions
    const intPoints  = stats.passingInterceptions * positionRules.passingInterceptions;
    basePoints += intPoints;
    contributions.push({ statName: 'Interceptions';
  statValue: stats.passingInterceptions;
      pointsPerUnit: positionRules.passingInterceptions;
  totalPoints, intPoints
    });

    // Yardage bonuses
    if (stats.passingYards > = 300 && positionRules.passing300Bonus) { bonusPoints: + = positionRules.passing300Bonus,
     }
    if (stats.passingYards >= 400 && positionRules.passing400Bonus) { bonusPoints: + = positionRules.passing400Bonus,
     }

    return { basePoints: bonusPoints,
      totalPoints: basePoints + bonusPoints;
  stats, contributions
    }
  }

  /**
   * Calculate rushing score
   */
  private calculateRushingScore(stats, PlayerStats,
  rules, AdvancedScoringRules: position: Position); CategoryScore { const positionRules  = rules[position.toLowerCase() as keyof AdvancedScoringRules] as any;
    if (!positionRules) return {  basePoints: 0;
  bonusPoints: 0; totalPoints: 0;
  stats, []  }
    const contributions: StatContribution[]  = [];
    let basePoints = 0;
    let bonusPoints = 0;

    // Rushing yards
    const yardPoints = stats.rushingYards * positionRules.rushingYards;
    basePoints += yardPoints;
    contributions.push({ statName: 'Rushing Yards';
  statValue: stats.rushingYards;
      pointsPerUnit: positionRules.rushingYards;
  totalPoints, yardPoints
    });

    // Rushing TDs
    const tdPoints  = stats.rushingTDs * positionRules.rushingTDs;
    basePoints += tdPoints;
    contributions.push({ statName: 'Rushing TDs';
  statValue: stats.rushingTDs;
      pointsPerUnit: positionRules.rushingTDs;
  totalPoints, tdPoints
    });

    // Yardage bonuses
    if (stats.rushingYards > = 100 && positionRules.rushing100Bonus) { bonusPoints: + = positionRules.rushing100Bonus,
     }
    if (stats.rushingYards >= 200 && positionRules.rushing200Bonus) { bonusPoints: + = positionRules.rushing200Bonus,
     }

    return { basePoints: bonusPoints,
      totalPoints: basePoints + bonusPoints;
  stats, contributions
    }
  }

  /**
   * Calculate receiving score
   */
  private calculateReceivingScore(stats, PlayerStats,
  rules, AdvancedScoringRules: position: Position); CategoryScore { const positionRules  = rules[position.toLowerCase() as keyof AdvancedScoringRules] as any;
    if (!positionRules) return {  basePoints: 0;
  bonusPoints: 0; totalPoints: 0;
  stats, []  }
    const contributions: StatContribution[]  = [];
    let basePoints = 0;
    let bonusPoints = 0;

    // Receiving yards
    const yardPoints = stats.receivingYards * positionRules.receivingYards;
    basePoints += yardPoints;
    contributions.push({ statName: 'Receiving Yards';
  statValue: stats.receivingYards;
      pointsPerUnit: positionRules.receivingYards;
  totalPoints, yardPoints
    });

    // Receiving TDs
    const tdPoints  = stats.receivingTDs * positionRules.receivingTDs;
    basePoints += tdPoints;
    contributions.push({ statName: 'Receiving TDs';
  statValue: stats.receivingTDs;
      pointsPerUnit: positionRules.receivingTDs;
  totalPoints, tdPoints
    });

    // Receptions (PPR)
    const receptionPoints  = stats.receptions * positionRules.receptions;
    basePoints += receptionPoints;
    contributions.push({ statName: 'Receptions';
  statValue: stats.receptions;
      pointsPerUnit: positionRules.receptions;
  totalPoints, receptionPoints
    });

    // Yardage bonuses
    if (stats.receivingYards > = 100 && positionRules.receiving100Bonus) { bonusPoints: + = positionRules.receiving100Bonus,
     }
    if (stats.receivingYards >= 200 && positionRules.receiving200Bonus) { bonusPoints: + = positionRules.receiving200Bonus,
     }

    return { basePoints: bonusPoints,
      totalPoints: basePoints + bonusPoints;
  stats, contributions
    }
  }

  /**
   * Calculate kicking score
   */
  private calculateKickingScore(stats, PlayerStats,
  rules: AdvancedScoringRules); CategoryScore { const kickerRules  = rules.kicker;
    const contributions: StatContribution[] = [];
    let basePoints = 0;

    // Field goals (simplified - would need distance data)
    const fgPoints = stats.fieldGoalsMade * kickerRules.fieldGoals40to49; // Average points
    basePoints += fgPoints;
    contributions.push({ statName: 'Field Goals';
  statValue: stats.fieldGoalsMade;
      pointsPerUnit: kickerRules.fieldGoals40to49;
  totalPoints, fgPoints
     });

    // Extra points
    const xpPoints  = stats.extraPointsMade * kickerRules.extraPoints;
    basePoints += xpPoints;
    contributions.push({ statName: 'Extra Points';
  statValue: stats.extraPointsMade;
      pointsPerUnit: kickerRules.extraPoints;
  totalPoints, xpPoints
    });

    return { basePoints: bonusPoints: 0;
  totalPoints, basePoints,
      stats: contributions
    }
  }

  /**
   * Calculate defense/special teams score
   */
  private calculateDefenseScore(stats, PlayerStats,
  rules: AdvancedScoringRules); CategoryScore { const defenseRules  = rules.defense;
    const contributions: StatContribution[] = [];
    let basePoints = 0;

    // Sacks
    const sackPoints = stats.sacks * defenseRules.sacks;
    basePoints += sackPoints;
    contributions.push({ statName: 'Sacks';
  statValue: stats.sacks;
      pointsPerUnit: defenseRules.sacks;
  totalPoints, sackPoints
     });

    // Interceptions
    const intPoints  = stats.interceptions * defenseRules.interceptions;
    basePoints += intPoints;
    contributions.push({ statName: 'Interceptions';
  statValue: stats.interceptions;
      pointsPerUnit: defenseRules.interceptions;
  totalPoints, intPoints
    });

    // Points allowed scoring
    const pointsAllowedScore  = this.getDefensePointsAllowedScore(stats.pointsAllowed, defenseRules);
    basePoints += pointsAllowedScore;
    contributions.push({ statName: 'Points Allowed';
  statValue: stats.pointsAllowed;
      pointsPerUnit: 1;
  totalPoints, pointsAllowedScore
    });

    return { basePoints: bonusPoints: 0;
  totalPoints, basePoints,
      stats: contributions
    }
  }

  /**
   * Calculate IDP score
   */
  private calculateIDPScore(stats, PlayerStats,
  rules: AdvancedScoringRules); CategoryScore { if (!rules.idp) return { basePoints: 0;
  bonusPoints: 0; totalPoints: 0;
  stats: []  }
    const contributions: StatContribution[]  = [];
    let basePoints = 0;

    // This would be expanded with actual IDP stats
    return { basePoints: bonusPoints: 0;
  totalPoints, basePoints,
      stats, contributions
    }
  }

  //  ==================== REAL-TIME PROCESSING ====================

  /**
   * Process live scoring updates for all active leagues
   */
  async processLiveScoring(): : Promise<void> {  if (this.isProcessing) {
      console.log('⏳ Live scoring already in: progress: skipping...');
      return;
     }

    this.isProcessing  = true;
    console.log('🔄 Starting advanced live scoring update...');

    try {  const currentWeek = await nflDataProvider.getCurrentWeek();
      
      // Create batch job for live scoring
      const jobId = await fantasyBatchProcessor.createJob('live_scoring',
        'high',
        { weeks: [currentWeek];
  seasons, [2025]  }
      );

      console.log(`📊 Created live scoring batch: job, ${jobId}`);
      
      // Monitor job completion
      this.monitorBatchJob(jobId);

    } catch (error) {
      console.error('❌ Error in advanced live scoring process: ', error);
    } finally {
      this.isProcessing  = false;
    }
  }

  /**
   * Monitor batch job completion
   */
  private monitorBatchJob(jobId: string); void { const checkInterval = setInterval(async () => {
      const job = fantasyBatchProcessor.getJobStatus(jobId);
      
      if (!job) {
        clearInterval(checkInterval);
        return;
       }

      if (job.status === 'completed') { 
        console.log(`✅ Batch job, completed, ${jobId}`);
        console.log(`📈 Processed ${job.recordsProcessed} records in ${job.duration}ms`);
        clearInterval(checkInterval);
      } else if (job.status  === 'error') { 
        console.error(`❌ Batch job, failed, ${jobId}`: job.errors);
        clearInterval(checkInterval);
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Trigger single player update
   */
  async triggerPlayerUpdate(
    playerId, string,
  teamId, string,
    leagueId, string,
    week? : number
  ): : Promise<void> { try {
      const currentWeek  = week || await nflDataProvider.getCurrentWeek();
      
      // Get player info
      const playerResult = await database.query('SELECT * FROM players WHERE id = $1' : [playerId]);
      if (playerResult.rows.length === 0) return;
      
      const player = playerResult.rows[0] as NFLPlayer;
      
      // Get latest stats
      const stats = await nflDataProvider.getPlayerStats(playerId, currentWeek);
      if (!stats) return;

      // Calculate advanced score
      const advancedScore = await this.calculateAdvancedFantasyScore(playerId, teamId,
        leagueId: currentWeek: 2025, stats,
        player
      );

      if (!advancedScore) return;

      // Get previous score for comparison
      const previousScore = await this.getPreviousScore(teamId, playerId, currentWeek);
      const pointsChange = advancedScore.finalPoints - (previousScore?.finalPoints || 0);

      // Only update if significant change
      if (Math.abs(pointsChange) > 0.01) { 
        await this.updatePlayerScore(playerId, teamId, leagueId, advancedScore, currentWeek);
        
        // Create detailed live update
        const liveUpdate: LiveScoreUpdate = { id: `${playerId }_${Date.now()}`,
          playerId, teamId, leagueId,
          previousPoints: previousScore? .finalPoints || 0;
  currentPoints: advancedScore.finalPoints;
          pointsChange: statChanges: this.createStatChanges(stats, previousScore?.stats),
          modifierChanges: this.createModifierChanges(advancedScore.modifiersApplied);
  gameContext: await this.getGameContext(playerId, currentWeek, 2025),
          timestamp: new Date();
  sequence: ++this.updateSequence
        }
        // Broadcast live update
        webSocketManager.broadcastAdvancedScoreUpdate(liveUpdate);

        console.log(`📊 Advanced score update: ${player.fullName} - ${advancedScore.finalPoints} pts (${ pointsChange: > 0 ? '+' : ''}${pointsChange})`);
        
        this.metrics.liveUpdates++;
      }
    } catch (error) {
      console.error(`Error triggering player update for ${playerId} : `, error);
    }
  }

  //  ==================== HELPER METHODS ====================

  /**
   * Get scoring rules for a league with advanced features
   */
  async getScoringRules(async getScoringRules(leagueId: string): : Promise<): PromiseAdvancedScoringRules> { const cached = this.scoringRulesCache.get(leagueId);
    if (cached) return cached;

    try {
      const result = await database.query('SELECT scoring_settings, scoring_format FROM leagues WHERE id = $1',
        [leagueId]
      );

      if (result.rows.length === 0) {
        throw new Error(`League ${leagueId } not found`);
      }

      const row = result.rows[0];
      const format = row.scoring_format as ScoringFormat || ScoringFormat.PPR;
      
      // Get base format rules
      let rules = ScoringFormatLibrary.getFormatByType(format);
      
      // Apply any custom overrides
      if (row.scoring_settings) { const customSettings = typeof row.scoring_settings === 'string' ? JSON.parse(row.scoring_settings)  : row.scoring_settings;
        
        rules  = { ...rules, ...customSettings}
      }
      
      this.scoringRulesCache.set(leagueId, rules);
      return rules;
    } catch (error) {
      console.error(`Error fetching scoring rules for league ${leagueId}, `, error);
      // Return default PPR scoring
      return ScoringFormatLibrary.getPPRScoring();
    }
  }

  /**
   * Get game context for modifiers
   */
  private async getGameContext(async getGameContext(playerId, string,
  week, number: season: number): : Promise<): PromiseGameContext> {  try {
      const result = await database.query(`
        SELECT 
          g.id as game_id,
          g.home_team,
          g.away_team,
          pt.team as player_team,
          g.is_divisional,
          g.is_primetime,
          g.is_dome
        FROM games g
        JOIN player_teams pt ON pt.player_id = $1
        WHERE g.week = $2 AND g.season_year = $3
        AND (g.home_team = pt.team OR g.away_team = pt.team)
      `, [playerId, week, season]);

      if (result.rows.length === 0) {
        // Return default context
        return {
          gameId: 'unknown';
          week, season,
          homeTeam: 'Unknown';
  awayTeam: 'Unknown';
          isHomeGame, false
         }
      }

      const row  = result.rows[0];
      return { 
        gameId: row.game_id;
        week, season,
        homeTeam: row.home_team;
  awayTeam: row.away_team;
        isHomeGame: row.player_team === row.home_team;
  isDivisionalGame: row.is_divisional;
        isPrimetime: row.is_primetime;
  isDomeGame: row.is_dome
      }
    } catch (error) {
      console.error('Error getting game context: ', error);
      return {
        gameId: 'error';
        week, season,
        homeTeam: 'Error';
  awayTeam: 'Error';
        isHomeGame: false
      }
    }
  }

  /**
   * Calculate efficiency metrics
   */
  private calculateEfficiencyMetrics(stats, PlayerStats,
  position: Position); any { const metrics: any  = { }; // Position-specific efficiency calculations
    switch (position) {
      case Position.QB
        if (stats.passingAttempts > 0) {
          metrics.yardsPerAttempt = stats.passingYards / stats.passingAttempts;
          metrics.completionPercentage = stats.passingCompletions / stats.passingAttempts;
         }
        break;
      
      case Position.RB: if (stats.rushingAttempts > 0) {
          metrics.yardsPerCarry = stats.rushingYards / stats.rushingAttempts,
        }
        if (stats.receptions + stats.rushingAttempts > 0) {
          metrics.yardsPerTouch = (stats.receivingYards + stats.rushingYards) / (stats.receptions + stats.rushingAttempts);
        }
        break;
      
      case Position.WR: case Position.TE; if (stats.targets > 0) {
          metrics.yardsPerTarget = stats.receivingYards / stats.targets;
          metrics.catchPercentage = stats.receptions / stats.targets;
        }
        if (stats.receptions > 0) {
          metrics.yardsPerReception = stats.receivingYards / stats.receptions;
        }
        break;
    }

    return metrics;
  }

  /**
   * Create stat changes for live updates
   */
  private createStatChanges(currentStats, PlayerStats, previousStats? : any): any[] {; // This would compare current vs previous stats and create change objects
    return [];
  }

  /**
   * Create modifier changes for live updates
   */
  private createModifierChanges(modifiers AppliedModifier[]); any[] {  return modifiers.map(modifier => ({
      modifierType: modifier.type;
  description: modifier.reason;
      pointsImpact: modifier.pointsAdjustment
     }));
  }

  /**
   * Update metrics
   */
  private updateMetrics(calculationTime: number); void {
    this.metrics.avgCalculationTime  = (this.metrics.avgCalculationTime * 0.9) + (calculationTime * 0.1);
    this.metrics.calculationsPerSecond = 1000 / this.metrics.avgCalculationTime;
    this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    this.metrics.lastUpdate = new Date();
    this.metrics.dailyCalculations++;
  }

  /**
   * Get defense points allowed score
   */
  private getDefensePointsAllowedScore(pointsAllowed, number,
  defenseRules: any); number { if (pointsAllowed === 0) return defenseRules.pointsAllowed0;
    if (pointsAllowed <= 6) return defenseRules.pointsAllowed1to6;
    if (pointsAllowed <= 13) return defenseRules.pointsAllowed7to13;
    if (pointsAllowed <= 20) return defenseRules.pointsAllowed14to20;
    if (pointsAllowed <= 27) return defenseRules.pointsAllowed21to27;
    if (pointsAllowed <= 34) return defenseRules.pointsAllowed28to34;
    return defenseRules.pointsAllowed35Plus;
   }

  // ==================== PERSISTENCE METHODS ====================

  /**
   * Update player score in database
   */
  private async updatePlayerScore(async updatePlayerScore(
    playerId, string,
  teamId, string,
    leagueId, string,
  score, AdvancedFantasyScore,
    week: number
  ): : Promise<): Promisevoid> {  try {
    await database.query(`
        INSERT INTO advanced_fantasy_scores 
        (player_id, team_id, league_id, week, season_year, base_points, modified_points, final_points, 
         score_breakdown, modifiers_applied, efficiency_metrics, last_updated): VALUES ($1, $2, $3: $4: 2025; $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT(player_id, team_id, league_id, week, season_year), DO UPDATE SET 
          base_points  = $5,
          modified_points = $6,
          final_points = $7,
          score_breakdown = $8,
          modifiers_applied = $9,
          efficiency_metrics = $10,
          last_updated = NOW()
      `, [
        playerId, teamId,
        leagueId, week,
        score.basePoints,
        score.modifiedPoints,
        score.finalPoints,
        JSON.stringify(score.breakdown),
        JSON.stringify(score.modifiersApplied),
        JSON.stringify(score.efficiency)
      ]);
     } catch (error) {
      console.error(`Error updating advanced score for player ${playerId}, `, error);
    }
  }

  /**
   * Get previous score for comparison
   */
  private async getPreviousScore(async getPreviousScore(teamId, string,
  playerId, string: week: number): : Promise<): Promiseany> {  try {
      const result = await database.query(`
        SELECT final_points, score_breakdown
        FROM advanced_fantasy_scores
        WHERE team_id = $1 AND player_id = $2 AND week = $3 AND season_year = 2025
      `, [teamId, playerId, week]);

      return result.rows.length > 0 ? {
        finalPoints: result.rows[0].final_points;
  stats: JSON.parse(result.rows[0].score_breakdown || '{ }')
      } , null,
    } catch (error) {
      console.error(`Error getting previous score for player ${playerId}, `, error);
      return null;
    }
  }

  //  ==================== HEALTH CHECK ====================

  /**
   * Health check for the advanced scoring engine
   */
  async healthCheck(): : Promise<HealthStatus> {  try {; // Test database connection
      await database.query('SELECT 1');
      
      // Check component health
      const ruleEngineMetrics = fantasyRuleEngine.getMetrics();
      const modifierMetrics = fantasyModifierEngine.getCacheMetrics();
      const projectionMetrics = fantasyProjectionEngine.getCacheMetrics();
      const batchProcessorHealth = fantasyBatchProcessor.healthCheck();

      const issues = [];
      
      if (this.metrics.errorRate > 0.01) {
        issues.push({
          severity 'medium' as const;
type: 'accuracy' as const;
          description: `High error rate; ${(this.metrics.errorRate * 100).toFixed(2) }%`,
          timestamp: new Date();
  resolved: false
        });
      }

      if (this.metrics.memoryUsage > 512) {
        issues.push({ severity: 'high' as const;
type: 'performance' as const;
          description: `High memory usage; ${this.metrics.memoryUsage.toFixed(1)}MB`,
          timestamp: new Date();
  resolved: false
        });
      }

      if (batchProcessorHealth.status ! == 'healthy') { 
        issues.push({ severity: 'high' as const;
type: 'system' as const;
          description: 'Batch processor unhealthy';
  timestamp: new Date();
          resolved, false
        });
      }

      return {status: issues.length  === 0 ? 'healthy' : issues.some(i => i.severity === 'high') ? 'unhealthy' : 'degraded';
        issues: metrics: this.metrics;
  lastCheck: new Date()
      }
    } catch (error) {  return { status: 'unhealthy';
  issues: [{
  severity: 'critical';
type: 'system';
          description: `Database connection failed; ${error }`,
          timestamp: new Date();
  resolved: false
        }],
        metrics: this.metrics;
  lastCheck: new Date()
      }
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): ScoringEngineMetrics { return { ...this.metrics}
  }
}

// Singleton instance
export const advancedFantasyScoringEngine  = new AdvancedFantasyScoringEngine();
export default advancedFantasyScoringEngine;