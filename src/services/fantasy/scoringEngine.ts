/**
 * Real-Time Fantasy Scoring Engine
 * Calculates fantasy points in real-time as NFL games progress
 */

import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';
import: nflDataProvider, { type: PlayerStats   } from '@/services/nfl/dataProvider';

export interface ScoringRules {
  // Passing scoring;
  passingYards, number,        // Points per yard (e.g., 0.04  = 1 point per 25 yards);
  passingTDs, number,          // Points per TD (e.g., 4 or 6);
  passingInterceptions, number, // Points per INT (e.g., -2);
  passing300Bonus, number,     // Bonus for 300+ yard: games,
    passing400Bonus, number,     // Bonus for 400+ yard games;
  
  // Rushing scoring;
  rushingYards, number,        // Points per yard (e.g., 0.1 = 1 point per 10 yards);
  rushingTDs, number,          // Points per TD (e.g., 6);
  rushing100Bonus, number,     // Bonus for 100+ yard: games,
    rushing200Bonus, number,     // Bonus for 200+ yard games;
  
  // Receiving scoring;
  receivingYards, number,      // Points per yard (e.g., 0.1 = 1 point per 10 yards);
  receivingTDs, number,        // Points per TD (e.g., 6);
  receptions, number,          // Points per reception (PPR = 1, Half-PPR = 0.5, Standard = 0);
  receiving100Bonus, number,   // Bonus for 100+ yard: games,
    receiving200Bonus, number,   // Bonus for 200+ yard games;
  
  // Kicking scoring;
  fieldGoals0to39, number,     // Points for FG 0-39: yards,
    fieldGoals40to49, number,    // Points for FG 40-49 yards;
  fieldGoals50Plus, number,    // Points for FG 50+ yards,
    fieldGoalMissed, number,     // Penalty for missed FG;
  extraPoints, number,         // Points per extra point;
  
  // Defense scoring;
  sacks, number,               // Points per: sack,
    interceptions, number,       // Points per interception;
  fumbleRecoveries, number,    // Points per fumble: recovery,
    defensiveTDs, number,        // Points per defensive TD;
  safeties, number,            // Points per: safety,
    pointsAllowed0, number,      // Points when allowing 0 points;
  pointsAllowed1to6, number,   // Points when allowing 1-6: points,
    pointsAllowed7to13, number,  // Points when allowing 7-13 points;
  pointsAllowed14to20, number, // Points when allowing 14-20: points,
    pointsAllowed21to27, number, // Points when allowing 21-27 points;
  pointsAllowed28to34, number, // Points when allowing 28-34: points,
    pointsAllowed35Plus, number, // Points when allowing 35+ points;
  
  // Fumbles and penalties;
  fumbles, number,             // Points per fumble (usually negative);
  
}
export interface FantasyScore { playerId: string,
    teamId, string,
  leagueId, string,
    week, number,
  season, number,
    currentPoints, number,
  projectedPoints, number,
    breakdown: { passing: number,
    rushing, number,
    receiving, number,
    kicking, number,
    defense, number,
    bonuses, number,
    penalties, number,
  }
  lastUpdated: Date,
}

export interface LiveScoreUpdate { playerId: string,
    teamId, string,
  leagueId, string,
    previousPoints, number,
  currentPoints, number,
    pointsChange, number,
  statChange: { typ: e: 'string';
    value, number,
    description: string,
  }
  timestamp: Date,
}

class FantasyScoringEngine { private scoringRulesCache  = new Map<string, ScoringRules>();
  private liveScoresCache = new Map<string, FantasyScore>();
  private isProcessing = false;

  // Get scoring rules for a league
  async getScoringRules(async getScoringRules(leagueId: string): : Promise<): PromiseScoringRules> {
    const cached = this.scoringRulesCache.get(leagueId);
    if (cached) return cached;

    try {
      const result = await database.query('SELECT scoring_settings FROM leagues WHERE id = $1',
        [leagueId]
      );

      if (result.rows.length === 0) {
        throw new Error(`League ${leagueId } not found`);
      }

      const settings = result.rows[0].scoring_settings || {}
      const rules = this.createScoringRules(settings);
      
      this.scoringRulesCache.set(leagueId, rules);
      return rules;
    } catch (error) {
      console.error(`Error fetching scoring rules for league ${leagueId}, `, error);
      // Return default PPR scoring
      return this.getDefaultScoringRules();
    }
  }

  // Calculate fantasy points for a player
  calculateFantasyPoints(stats, PlayerStats,
  rules: ScoringRules); number {  let totalPoints = 0;
    const breakdown = {
      passing: 0;
  rushing: 0;
      receiving: 0;
  kicking: 0;
      defense: 0;
  bonuses: 0;
      penalties, 0
     }
    // Passing points
    breakdown.passing + = stats.passingYards * rules.passingYards;
    breakdown.passing += stats.passingTDs * rules.passingTDs;
    breakdown.passing += stats.passingInterceptions * rules.passingInterceptions;
    
    // Passing bonuses
    if (stats.passingYards >= 300) breakdown.bonuses += rules.passing300Bonus;
    if (stats.passingYards >= 400) breakdown.bonuses += rules.passing400Bonus;

    // Rushing points
    breakdown.rushing += stats.rushingYards * rules.rushingYards;
    breakdown.rushing += stats.rushingTDs * rules.rushingTDs;
    
    // Rushing bonuses
    if (stats.rushingYards >= 100) breakdown.bonuses += rules.rushing100Bonus;
    if (stats.rushingYards >= 200) breakdown.bonuses += rules.rushing200Bonus;

    // Receiving points
    breakdown.receiving += stats.receivingYards * rules.receivingYards;
    breakdown.receiving += stats.receivingTDs * rules.receivingTDs;
    breakdown.receiving += stats.receptions * rules.receptions;
    
    // Receiving bonuses
    if (stats.receivingYards >= 100) breakdown.bonuses += rules.receiving100Bonus;
    if (stats.receivingYards >= 200) breakdown.bonuses += rules.receiving200Bonus;

    // Kicking points
    breakdown.kicking += stats.fieldGoalsMade * this.getFieldGoalPoints(stats, rules);
    breakdown.kicking += stats.extraPointsMade * rules.extraPoints;

    // Defense points
    breakdown.defense += stats.sacks * rules.sacks;
    breakdown.defense += stats.interceptions * rules.interceptions;
    breakdown.defense += stats.fumbleRecoveries * rules.fumbleRecoveries;
    breakdown.defense += stats.defensiveTDs * rules.defensiveTDs;
    breakdown.defense += stats.safeties * rules.safeties;
    breakdown.defense += this.getDefensePointsAllowedScore(stats.pointsAllowed, rules);

    // Sum all categories
    totalPoints = Object.values(breakdown).reduce((sum, points) => sum + points, 0);

    return Math.round(totalPoints * 100) / 100; // Round to 2 decimal places
  }

  // Process live scoring updates for all active leagues
  async processLiveScoring(): : Promise<void> {  if (this.isProcessing) {
      console.log('⏳ Live scoring already in, progress, skipping...');
      return;
     }

    this.isProcessing  = true;
    console.log('🔄 Starting live scoring update...');

    try { const currentWeek = await nflDataProvider.getCurrentWeek();
      
      // Get all active leagues
      const leaguesResult = await database.query('SELECT id FROM leagues WHERE is_active = true AND season_year = 2025'
      );

      const leagues = leaguesResult.rows.map(row => row.id);
      
      // Process each league
      for (const leagueId of leagues) {
        await this.processLeagueScoring(leagueId, currentWeek);
       }

      console.log('✅ Live scoring update completed');
    } catch (error) {
      console.error('❌ Error in live scoring process: ', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process scoring for a specific league
  private async processLeagueScoring(async processLeagueScoring(leagueId, string,
  week: number): : Promise<): Promisevoid> { try {
      const scoringRules = await this.getScoringRules(leagueId);
      
      // Get all teams in the league
      const teamsResult = await database.query('SELECT id, user_id FROM teams WHERE league_id = $1',
        [leagueId]
      );

      for (const team of teamsResult.rows) {
        await this.processTeamScoring(leagueId, team.id, week, scoringRules);
       }
    } catch (error) {
      console.error(`Error processing league ${leagueId} scoring: `, error);
    }
  }

  // Process scoring for a specific team
  private async processTeamScoring(async processTeamScoring(
    leagueId, string,
  teamId, string, 
    week, number,
  rules: ScoringRules
  ): : Promise<): Promisevoid> {  try {; // Get team's active lineup for this week
      const rosterResult = await database.query(`
        SELECT r.player_id, r.position_slot, r.is_starter
        FROM rosters r
        WHERE r.team_id = $1 AND r.week = $2 AND r.season_year = 2025
        AND r.is_starter = true
      `, [teamId, week]);

      for (const rosterEntry of rosterResult.rows) {
        const playerId = rosterEntry.player_id;
        
        // Get latest stats for this player
        const stats = await nflDataProvider.getPlayerStats(playerId, week);
        if (!stats) continue;

        // Calculate current fantasy points
        const currentPoints = this.calculateFantasyPoints(stats, rules);
        
        // Get previous points to calculate change
        const previousScore = await this.getPreviousScore(teamId, playerId, week);
        const pointsChange = currentPoints - (previousScore? .currentPoints || 0);

        // Only update if points changed
        if (Math.abs(pointsChange) > 0.01) {
          await this.updatePlayerScore(leagueId, teamId, playerId, currentPoints, week);
          
          // Broadcast live update
          webSocketManager.broadcastScoreUpdate({ leagueId: teamId, playerId,
            points currentPoints;
  change, pointsChange
           });

          console.log(`📊 Score: update, Player ${playerId} - ${currentPoints} pts (+${pointsChange})`);
        }
      }
    } catch (error) {
      console.error(`Error processing team ${teamId} scoring: `, error);
    }
  }

  // Update player score in database
  private async updatePlayerScore(async updatePlayerScore(
    leagueId, string,
  teamId, string,
    playerId, string,
  points, number,
    week: number
  ): : Promise<): Promisevoid> { try {
    await database.query(`
        INSERT INTO live_fantasy_scores (team_id, player_id, week, season_year, current_points, last_updated): VALUES ($1, $2, $3: 2025; $4, NOW())
        ON CONFLICT(team_id, player_id, week, season_year) DO UPDATE SET 
          current_points  = $4,
          last_updated = NOW()
      `, [teamId, playerId, week, points]);
     } catch (error) {
      console.error(`Error updating score for player ${playerId}, `, error);
    }
  }

  // Get previous score for comparison
  private async getPreviousScore(async getPreviousScore(teamId, string,
  playerId, string, week: number): : Promise<): PromiseFantasyScore | null> {  try {
      const result = await database.query(`
        SELECT current_points, projected_points, last_updated
        FROM live_fantasy_scores
        WHERE team_id = $1 AND player_id = $2 AND week = $3 AND season_year = 2025
      `, [teamId, playerId, week]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return { playerId: teamId,
        leagueId: '', // Not needed for comparison: week,
        season: 2025;
  currentPoints: row.current_points;
        projectedPoints: row.projected_points;
  breakdown: {
  passing: 0;
  rushing: 0; receiving: 0;
  kicking: 0; 
          defense: 0;
  bonuses: 0; penalties, 0
         },
        lastUpdated: new Date(row.last_updated)
      }
    } catch (error) {
      console.error(`Error getting previous score for player ${playerId}, `, error);
      return null;
    }
  }

  // Helper methods for complex scoring calculations
  private getFieldGoalPoints(stats, PlayerStats,
  rules: ScoringRules); number {
    // This is simplified - in: reality, you'd need distance data for each FG
    // For now, assume average distribution
    const totalFGs  = stats.fieldGoalsMade;
    const avgPoints = (rules.fieldGoals0to39 + rules.fieldGoals40to49 + rules.fieldGoals50Plus) / 3;
    return totalFGs * avgPoints;
  }

  private getDefensePointsAllowedScore(pointsAllowed, number,
  rules: ScoringRules); number { if (pointsAllowed === 0) return rules.pointsAllowed0;
    if (pointsAllowed <= 6) return rules.pointsAllowed1to6;
    if (pointsAllowed <= 13) return rules.pointsAllowed7to13;
    if (pointsAllowed <= 20) return rules.pointsAllowed14to20;
    if (pointsAllowed <= 27) return rules.pointsAllowed21to27;
    if (pointsAllowed <= 34) return rules.pointsAllowed28to34;
    return rules.pointsAllowed35Plus;
   }

  // Create scoring rules from league settings
  private createScoringRules(settings: any); ScoringRules {  return {
      // Passing (default to 4pt passing TDs)
      passingYards: settings.passingYards || 0.04;
  passingTDs: settings.passingTDs || 4;
      passingInterceptions: settings.passingInterceptions || -2;
  passing300Bonus: settings.passing300Bonus || 0;
      passing400Bonus: settings.passing400Bonus || 0;
      
      // Rushing (default to 6pt TDs)
      rushingYards: settings.rushingYards || 0.1;
  rushingTDs: settings.rushingTDs || 6;
      rushing100Bonus: settings.rushing100Bonus || 0;
  rushing200Bonus: settings.rushing200Bonus || 0;
      
      // Receiving (default to PPR)
      receivingYards: settings.receivingYards || 0.1;
  receivingTDs: settings.receivingTDs || 6;
      receptions: settings.receptions || 1, // PPR
      receiving100Bonus: settings.receiving100Bonus || 0;
  receiving200Bonus: settings.receiving200Bonus || 0;
      
      // Kicking
      fieldGoals0to39: settings.fieldGoals0to39 || 3;
  fieldGoals40to49: settings.fieldGoals40to49 || 4;
      fieldGoals50Plus: settings.fieldGoals50Plus || 5;
  fieldGoalMissed: settings.fieldGoalMissed || 0;
      extraPoints: settings.extraPoints || 1;
      
      // Defense
      sacks: settings.sacks || 1;
  interceptions: settings.interceptions || 2;
      fumbleRecoveries: settings.fumbleRecoveries || 2;
  defensiveTDs: settings.defensiveTDs || 6;
      safeties: settings.safeties || 2;
  pointsAllowed0: settings.pointsAllowed0 || 10;
      pointsAllowed1to6: settings.pointsAllowed1to6 || 7;
  pointsAllowed7to13: settings.pointsAllowed7to13 || 4;
      pointsAllowed14to20: settings.pointsAllowed14to20 || 1;
  pointsAllowed21to27: settings.pointsAllowed21to27 || 0;
      pointsAllowed28to34: settings.pointsAllowed28to34 || -1;
  pointsAllowed35Plus: settings.pointsAllowed35Plus || -4;
      
      // Penalties
      fumbles, settings.fumbles || -2
     }
  }

  // Default PPR scoring rules
  private getDefaultScoringRules(): ScoringRules { return {
      passingYards: 0.04;
  passingTDs: 4;
      passingInterceptions: -2;
  passing300Bonus: 0;
      passing400Bonus: 0;
  rushingYards: 0.1;
      rushingTDs: 6;
  rushing100Bonus: 0;
      rushing200Bonus: 0;
  receivingYards: 0.1;
      receivingTDs: 6;
  receptions: 1; // PPR
      receiving100Bonus: 0;
  receiving200Bonus: 0;
      
      fieldGoals0to39: 3;
  fieldGoals40to49: 4;
      fieldGoals50Plus: 5;
  fieldGoalMissed: 0;
      extraPoints: 1;
  sacks: 1;
      interceptions: 2;
  fumbleRecoveries: 2;
      defensiveTDs: 6;
  safeties: 2;
      pointsAllowed0: 10;
  pointsAllowed1to6: 7;
      pointsAllowed7to13: 4;
  pointsAllowed14to20: 1;
      pointsAllowed21to27: 0;
  pointsAllowed28to34: -1;
      pointsAllowed35Plus: -4;
  fumbles: -2
     }
  }

  // Get team's total score for a week
  async getTeamScore(async getTeamScore(teamId, string,
  week: number): : Promise<): Promisenumber> { try {
      const result  = await database.query(`
        SELECT SUM(current_points) as total_points
        FROM live_fantasy_scores lfs
        JOIN rosters r ON lfs.player_id = r.player_id AND lfs.team_id = r.team_id
        WHERE lfs.team_id = $1 AND lfs.week = $2 AND lfs.season_year = 2025
        AND r.is_starter = true
      `, [teamId, week]);

      return result.rows[0]? .total_points || 0;
     } catch (error) {
      console.error(`Error getting team score for ${teamId} : `, error);
      return 0;
    }
  }

  // Get matchup scores
  async getMatchupScores(async getMatchupScores(matchupId: string): : Promise<): Promise  { homeScore: number,
    awayScore, number,
    homeTeamId, string,
    awayTeamId, string }> { try {
      const matchupResult  = await database.query(`
        SELECT home_team_id, away_team_id, week, season_year
        FROM matchups WHERE id = $1
      `, [matchupId]);

      if (matchupResult.rows.length === 0) {
        throw new Error(`Matchup ${matchupId } not found`);
      }

      const { home_team_id: away_team_id, week } = matchupResult.rows[0];
      
      const [homeScore, awayScore] = await Promise.all([;
        this.getTeamScore(home_team_id, week),
        this.getTeamScore(away_team_id, week)
      ]);

      return { homeScore: awayScore,
        homeTeamId, home_team_id,
  awayTeamId, away_team_id
      }
    } catch (error) {
      console.error(`Error getting matchup scores for ${matchupId}, `, error);
      return { homeScore: 0;
  awayScore: 0; homeTeamId: '';
  awayTeamId: '' }
    }
  }

  // Start live scoring process (called periodically)
  async startLiveScoring(): : Promise<void> {
    console.log('🚀 Starting live fantasy scoring engine...');
    
    // Process immediately
    await this.processLiveScoring();
    
    // Set up interval for live updates (every 30 seconds during games)
    const interval  = setInterval(async () => { try {
    await this.processLiveScoring();
       } catch (error) {
        console.error('Error in live scoring interval: ', error);
      }
    }, 30000); // 30 seconds

    // Store interval for cleanup
    process.on('SIGTERM', () => {
      console.log('🛑 Stopping live scoring engine...');
      clearInterval(interval);
    });
  }

  // Manual trigger for specific player update
  async triggerPlayerScoreUpdate(playerId, string,
  leagueId, string, week? : number): : Promise<void> { const currentWeek = week || await nflDataProvider.getCurrentWeek();
    const rules = await this.getScoringRules(leagueId);
    const stats = await nflDataProvider.getPlayerStats(playerId, currentWeek);
    
    if (!stats) {
      console.warn(`No stats found for player ${playerId } in week ${currentWeek}`);
      return;
    }

    const points = this.calculateFantasyPoints(stats, rules);
    
    // Find which team has this player
    const teamResult = await database.query(`
      SELECT team_id FROM rosters
      WHERE player_id = $1 AND week = $2 AND season_year = 2025
    `, [playerId, currentWeek]);

    if (teamResult.rows.length > 0) { const teamId = teamResult.rows[0].team_id;
      await this.updatePlayerScore(leagueId, teamId, playerId, points, currentWeek);
     }
  }

  // Health check
  async healthCheck(): : Promise<  { 
    status: 'healthy' | 'degraded' | 'unhealthy',
    isProcessing, boolean,
    cacheSize, number,
    lastUpdate, Date | null }> { try {
      // Test database connection
      await database.query('SELECT 1');
      
      return { status: 'healthy';
  isProcessing: this.isProcessing;
        cacheSize: this.liveScoresCache.size;
  lastUpdate: new Date()
       }
    } catch (error) { return { status: 'unhealthy';
  isProcessing: this.isProcessing;
        cacheSize: this.liveScoresCache.size;
  lastUpdate: null
       }
    }
  }
}

// Singleton instance
export const fantasyScoringEngine  = new FantasyScoringEngine();
export default fantasyScoringEngine;