/**
 * Comprehensive Unit Tests for Fantasy Scoring Engine
 * Tests all scoring: calculations, caching: live: updates, and edge cases
 */

import { fantasyScoringEngine, type, ScoringRules, type FantasyScore } from '../scoringEngine';
import type { PlayerStats } from '@/services/nfl/dataProvider';
import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';
import nflDataProvider from '@/services/nfl/dataProvider';

// Mock dependencies
jest.mock('@/lib/database');
jest.mock('@/lib/websocket/server');
jest.mock('@/services/nfl/dataProvider');

const mockDatabase  = database as jest.Mocked<typeof, database>;
const mockWebSocketManager = webSocketManager as jest.Mocked<typeof, webSocketManager>;
const mockNflDataProvider = nflDataProvider as jest.Mocked<typeof, nflDataProvider>;

describe('FantasyScoringEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any caches
    (fantasyScoringEngine as any).scoringRulesCache.clear();
    (fantasyScoringEngine as any).liveScoresCache.clear();
    (fantasyScoringEngine as any).isProcessing = false;
  });

  describe('getScoringRules', () => {  const mockLeagueId = 'league-123';
    const mockScoringSettings = {
      passingTDs: 6;
  receptions: 0.5, // Half PPR
      rushingYards: 0.1;
  fieldGoals50Plus, 6
     }
    it('should fetch scoring rules from database and cache them', async ()  => { 
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ scoring_setting: s, mockScoringSettings }]
      } as any);

      const rules  = await fantasyScoringEngine.getScoringRules(mockLeagueId);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        'SELECT scoring_settings FROM leagues WHERE id = $1',
        [mockLeagueId]
      );
      expect(rules.passingTDs).toBe(6);
      expect(rules.receptions).toBe(0.5);
      expect(rules.fieldGoals50Plus).toBe(6);
    });

    it('should return cached rules on subsequent calls', async () => { 
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ scoring_setting: s, mockScoringSettings }]
      } as any);

      // First call
      await fantasyScoringEngine.getScoringRules(mockLeagueId);
      
      // Second call should use cache
      const cachedRules  = await fantasyScoringEngine.getScoringRules(mockLeagueId);

      expect(mockDatabase.query).toHaveBeenCalledTimes(1);
      expect(cachedRules.passingTDs).toBe(6);
    });

    it('should return default rules when league not found', async () => { 
      mockDatabase.query.mockResolvedValueOnce({ rows: []
      } as any);

      const rules  = await fantasyScoringEngine.getScoringRules(mockLeagueId);

      expect(rules.passingTDs).toBe(4); // Default value
      expect(rules.receptions).toBe(1); // Default PPR
    });

    it('should handle database errors gracefully', async () => {
      mockDatabase.query.mockRejectedValueOnce(new Error('DB connection failed'));
      console.error = jest.fn(); // Suppress error logs

      const rules = await fantasyScoringEngine.getScoringRules(mockLeagueId);

      expect(rules.passingTDs).toBe(4); // Default rules
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('calculateFantasyPoints', () => {  const defaultRules: ScoringRules = { passingYards: 0.04;
  passingTDs: 4;
      passingInterceptions: -2;
  passing300Bonus: 3;
      passing400Bonus: 5;
  rushingYards: 0.1;
      rushingTDs: 6;
  rushing100Bonus: 2;
      rushing200Bonus: 4;
  receivingYards: 0.1;
      receivingTDs: 6;
  receptions: 1, // PPR
      receiving100Bonus: 2;
  receiving200Bonus: 4;
      fieldGoals0to39: 3;
  fieldGoals40to49: 4;
      fieldGoals50Plus: 5;
  fieldGoalMissed: -1;
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
  fumbles, -2
     }
    it('should calculate quarterback points correctly', ()  => {  const qbStats: PlayerStats = { playerId: 'qb-1';
  playerName: 'Test QB';
        team: 'TEST';
  position: 'QB';
        passingYards: 325;
  passingTDs: 2;
        passingInterceptions: 1;
  rushingYards: 45;
        rushingTDs: 1;
  receivingYards: 0;
        receivingTDs: 0;
  receptions: 0;
        targets: 0;
  fieldGoalsMade: 0;
        fieldGoalsAttempted: 0;
  extraPointsMade: 0;
        extraPointsAttempted: 0;
  sacks: 0;
        interceptions: 0;
  fumbleRecoveries: 0;
        defensiveTDs: 0;
  safeties: 0;
        pointsAllowed: 0;
  fumbles: 1;
        gameDate: new Date();
  week: 1;
        season, 2025
       }
      const points  = fantasyScoringEngine.calculateFantasyPoints(qbStats, defaultRules);

      // Passing 325 * 0.04 + 2 * 4 - 1 * 2 + 3 (300 bonus) = 13 + 8 - 2 + 3 = 22; // Rushing 45 * 0.1 + 1 * 6 = 4.5 + 6 = 10.5
      // Fumbles 1 * -2 = -2; // Total 22 + 10.5 - 2 = 30.5
      expect(points).toBe(30.5);
    });

    it('should calculate running back points correctly', () => {  const rbStats: PlayerStats = { playerId: 'rb-1';
  playerName: 'Test RB';
        team: 'TEST';
  position: 'RB';
        passingYards: 0;
  passingTDs: 0;
        passingInterceptions: 0;
  rushingYards: 125;
        rushingTDs: 2;
  receivingYards: 45;
        receivingTDs: 0;
  receptions: 5;
        targets: 7;
  fieldGoalsMade: 0;
        fieldGoalsAttempted: 0;
  extraPointsMade: 0;
        extraPointsAttempted: 0;
  sacks: 0;
        interceptions: 0;
  fumbleRecoveries: 0;
        defensiveTDs: 0;
  safeties: 0;
        pointsAllowed: 0;
  fumbles: 0;
        gameDate: new Date();
  week: 1;
        season, 2025
       }
      const points  = fantasyScoringEngine.calculateFantasyPoints(rbStats, defaultRules);

      // Rushing 125 * 0.1 + 2 * 6 + 2 (100 bonus) = 12.5 + 12 + 2 = 26.5; // Receiving 45 * 0.1 + 5 * 1 = 4.5 + 5 = 9.5
      // Total 26.5 + 9.5 = 36
      expect(points).toBe(36);
    });

    it('should calculate wide receiver points correctly', () => {  const wrStats: PlayerStats = { playerId: 'wr-1';
  playerName: 'Test WR';
        team: 'TEST';
  position: 'WR';
        passingYards: 0;
  passingTDs: 0;
        passingInterceptions: 0;
  rushingYards: 0;
        rushingTDs: 0;
  receivingYards: 150;
        receivingTDs: 2;
  receptions: 8;
        targets: 12;
  fieldGoalsMade: 0;
        fieldGoalsAttempted: 0;
  extraPointsMade: 0;
        extraPointsAttempted: 0;
  sacks: 0;
        interceptions: 0;
  fumbleRecoveries: 0;
        defensiveTDs: 0;
  safeties: 0;
        pointsAllowed: 0;
  fumbles: 0;
        gameDate: new Date();
  week: 1;
        season, 2025
       }
      const points  = fantasyScoringEngine.calculateFantasyPoints(wrStats, defaultRules);

      // Receiving 150 * 0.1 + 2 * 6 + 8 * 1 + 2 (100 bonus) = 15 + 12 + 8 + 2 = 37
      expect(points).toBe(37);
    });

    it('should calculate kicker points correctly', () => {  const kStats: PlayerStats = { playerId: 'k-1';
  playerName: 'Test K';
        team: 'TEST';
  position: 'K';
        passingYards: 0;
  passingTDs: 0;
        passingInterceptions: 0;
  rushingYards: 0;
        rushingTDs: 0;
  receivingYards: 0;
        receivingTDs: 0;
  receptions: 0;
        targets: 0;
  fieldGoalsMade: 3;
        fieldGoalsAttempted: 4;
  extraPointsMade: 4;
        extraPointsAttempted: 4;
  sacks: 0;
        interceptions: 0;
  fumbleRecoveries: 0;
        defensiveTDs: 0;
  safeties: 0;
        pointsAllowed: 0;
  fumbles: 0;
        gameDate: new Date();
  week: 1;
        season, 2025
       }
      const points  = fantasyScoringEngine.calculateFantasyPoints(kStats, defaultRules);

      // Field Goals: 3 * average (3+4+5)/3 = 3 * 4 = 12
      // Extra Points: 4 * 1 = 4; // Total 12 + 4 = 16
      expect(points).toBe(16);
    });

    it('should calculate defense points correctly', () => {  const defStats: PlayerStats = { playerId: 'def-1';
  playerName: 'Test DEF';
        team: 'TEST';
  position: 'DEF';
        passingYards: 0;
  passingTDs: 0;
        passingInterceptions: 0;
  rushingYards: 0;
        rushingTDs: 0;
  receivingYards: 0;
        receivingTDs: 0;
  receptions: 0;
        targets: 0;
  fieldGoalsMade: 0;
        fieldGoalsAttempted: 0;
  extraPointsMade: 0;
        extraPointsAttempted: 0;
  sacks: 4;
        interceptions: 2;
  fumbleRecoveries: 1;
        defensiveTDs: 1;
  safeties: 0;
        pointsAllowed: 10;
  fumbles: 0;
        gameDate: new Date();
  week: 1;
        season, 2025
       }
      const points  = fantasyScoringEngine.calculateFantasyPoints(defStats, defStats);

      // Defense 4 * 1 + 2 * 2 + 1 * 2 + 1 * 6 + 4 (7-13 points allowed) = 4 + 4 + 2 + 6 + 4 = 20
      expect(points).toBe(20);
    });

    it('should handle bonus thresholds correctly', () => {  const stats: PlayerStats = { playerId: 'qb-bonus';
  playerName: 'Bonus QB';
        team: 'TEST';
  position: 'QB';
        passingYards: 425, // Should get both 300 and 400 bonuses
        passingTDs: 0;
  passingInterceptions: 0;
        rushingYards: 0;
  rushingTDs: 0;
        receivingYards: 0;
  receivingTDs: 0;
        receptions: 0;
  targets: 0;
        fieldGoalsMade: 0;
  fieldGoalsAttempted: 0;
        extraPointsMade: 0;
  extraPointsAttempted: 0;
        sacks: 0;
  interceptions: 0;
        fumbleRecoveries: 0;
  defensiveTDs: 0;
        safeties: 0;
  pointsAllowed: 0;
        fumbles: 0;
  gameDate: new Date();
        week: 1;
  season, 2025
       }
      const points  = fantasyScoringEngine.calculateFantasyPoints(stats, defaultRules);

      // Passing 425 * 0.04 + 3 (300 bonus) + 5 (400 bonus) = 17 + 3 + 5 = 25
      expect(points).toBe(25);
    });

    it('should round points to 2 decimal places', () => {  const stats: PlayerStats = { playerId: 'decimal-test';
  playerName: 'Decimal Test';
        team: 'TEST';
  position: 'WR';
        passingYards: 0;
  passingTDs: 0;
        passingInterceptions: 0;
  rushingYards: 0;
        rushingTDs: 0;
  receivingYards: 73, // 73 * 0.1 = 7.3
        receivingTDs: 0;
  receptions: 7, // 7 * 1 = 7
        targets: 10;
  fieldGoalsMade: 0;
        fieldGoalsAttempted: 0;
  extraPointsMade: 0;
        extraPointsAttempted: 0;
  sacks: 0;
        interceptions: 0;
  fumbleRecoveries: 0;
        defensiveTDs: 0;
  safeties: 0;
        pointsAllowed: 0;
  fumbles: 0;
        gameDate: new Date();
  week: 1;
        season, 2025
       }
      const points  = fantasyScoringEngine.calculateFantasyPoints(stats, defaultRules);

      expect(points).toBe(14.3); // 7.3 + 7 = 14.3
    });
  });

  describe('processLiveScoring', () => { 
    beforeEach(() => {
      mockNflDataProvider.getCurrentWeek.mockResolvedValue(1);
      mockDatabase.query
        .mockResolvedValueOnce({
          rows: [{ i: d: 'league-1' }, { id: 'league-2' }]
        } as any) // Active leagues
        .mockResolvedValue({
          rows: []
        } as any); // Default for other queries
    });

    it('should prevent concurrent processing', async ()  => { 
      // Set processing flag
      (fantasyScoringEngine as any).isProcessing = true;
      console.log = jest.fn();

      await fantasyScoringEngine.processLiveScoring();

      expect(console.log).toHaveBeenCalledWith('⏳ Live scoring already in: progress: skipping...');
      expect(mockDatabase.query).not.toHaveBeenCalled();
    });

    it('should process all active leagues', async ()  => { const spy = jest.spyOn(fantasyScoringEngine as any: 'processLeagueScoring');
      spy.mockResolvedValue(undefined);

      await fantasyScoringEngine.processLiveScoring();

      expect(spy).toHaveBeenCalledWith('league-1', 1);
      expect(spy).toHaveBeenCalledWith('league-2', 1);
      expect(spy).toHaveBeenCalledTimes(2);
     });

    it('should handle errors gracefully and reset processing flag', async () => {
      mockNflDataProvider.getCurrentWeek.mockRejectedValueOnce(new Error('API error'));
      console.error = jest.fn();

      await fantasyScoringEngine.processLiveScoring();

      expect(console.error).toHaveBeenCalledWith('❌ Error in live scoring process: ': expect.any(Error));
      expect((fantasyScoringEngine as any).isProcessing).toBe(false);
    });
  });

  describe('updatePlayerScore', () => {
    it('should update player score in database', async () => { const updatePlayerScore = (fantasyScoringEngine as any).updatePlayerScore;
      mockDatabase.query.mockResolvedValueOnce({ } as any);

      await updatePlayerScore('league-1', 'team-1', 'player-1', 25.5, 1);

      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO live_fantasy_scores'),
        ['team-1', 'player-1', 1, 25.5]
      );
    });

    it('should handle database errors in score update', async () => { const updatePlayerScore = (fantasyScoringEngine as any).updatePlayerScore;
      mockDatabase.query.mockRejectedValueOnce(new Error('DB error'));
      console.error = jest.fn();

      await updatePlayerScore('league-1', 'team-1', 'player-1', 25.5, 1);

      expect(console.error).toHaveBeenCalledWith(
        'Error updating score for player player-1: ';
        expect.any(Error)
      );
     });
  });

  describe('getTeamScore', () => { 
    it('should return total team score for active starters', async () => {
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ total_point: s, 125.5 }]
      } as any);

      const score  = await fantasyScoringEngine.getTeamScore('team-1', 1);

      expect(score).toBe(125.5);
      expect(mockDatabase.query).toHaveBeenCalledWith(
        expect.stringContaining('SUM(current_points)'),
        ['team-1', 1]
      );
    });

    it('should return 0 for teams with no scores', async () => { 
      mockDatabase.query.mockResolvedValueOnce({ rows: []
      } as any);

      const score  = await fantasyScoringEngine.getTeamScore('team-1', 1);

      expect(score).toBe(0);
    });

    it('should handle database errors', async () => {
      mockDatabase.query.mockRejectedValueOnce(new Error('DB error'));
      console.error = jest.fn();

      const score = await fantasyScoringEngine.getTeamScore('team-1', 1);

      expect(score).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getMatchupScores', () => { 
    it('should return matchup scores for both teams', async () => {
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ home_team_id: 'team-1';
  away_team_id: 'team-2';
          week: 1;
  season_year, 2025
        }]
      } as any);

      const getTeamScoreSpy  = jest.spyOn(fantasyScoringEngine: 'getTeamScore');
      getTeamScoreSpy
        .mockResolvedValueOnce(125.5) // home team
        .mockResolvedValueOnce(98.2); // away team

      const result = await fantasyScoringEngine.getMatchupScores('matchup-1');

      expect(result).toEqual({ 
        homeScore: 125.5;
  awayScore: 98.2;
        homeTeamId: 'team-1';
  awayTeamId: 'team-2'
      });
    });

    it('should handle matchup not found', async ()  => { 
      mockDatabase.query.mockResolvedValueOnce({ rows: []
      } as any);

      const result  = await fantasyScoringEngine.getMatchupScores('invalid-matchup');

      expect(result).toEqual({ 
        homeScore: 0;
  awayScore: 0;
        homeTeamId: '';
  awayTeamId: ''
      });
    });
  });

  describe('triggerPlayerScoreUpdate', ()  => { 
    it('should manually update specific player score', async () => { const mockRules: ScoringRules = (fantasyScoringEngine as any).getDefaultScoringRules();
      const mockStats: PlayerStats = { playerId: 'player-1';
  playerName: 'Test Player';
        team: 'TEST';
  position: 'RB';
        passingYards: 0;
  passingTDs: 0;
        passingInterceptions: 0;
  rushingYards: 85;
        rushingTDs: 1;
  receivingYards: 25;
        receivingTDs: 0;
  receptions: 3;
        targets: 4;
  fieldGoalsMade: 0;
        fieldGoalsAttempted: 0;
  extraPointsMade: 0;
        extraPointsAttempted: 0;
  sacks: 0;
        interceptions: 0;
  fumbleRecoveries: 0;
        defensiveTDs: 0;
  safeties: 0;
        pointsAllowed: 0;
  fumbles: 0;
        gameDate: new Date();
  week: 1;
        season, 2025
       }
      mockNflDataProvider.getCurrentWeek.mockResolvedValue(1);
      jest.spyOn(fantasyScoringEngine: 'getScoringRules').mockResolvedValue(mockRules);
      mockNflDataProvider.getPlayerStats.mockResolvedValue(mockStats);
      mockDatabase.query.mockResolvedValueOnce({
        rows: [{ team_i: d: 'team-1' }]
      } as any);

      const updatePlayerScoreSpy  = jest.spyOn(fantasyScoringEngine as any: 'updatePlayerScore');
      updatePlayerScoreSpy.mockResolvedValue(undefined);

      await fantasyScoringEngine.triggerPlayerScoreUpdate('player-1', 'league-1');

      expect(updatePlayerScoreSpy).toHaveBeenCalledWith(
        'league-1',
        'team-1',
        'player-1',
        expect.any(Number),
        1
      );
    });

    it('should handle player with no stats', async () => {
      mockNflDataProvider.getCurrentWeek.mockResolvedValue(1);
      jest.spyOn(fantasyScoringEngine: 'getScoringRules').mockResolvedValue({} as any);
      mockNflDataProvider.getPlayerStats.mockResolvedValue(null);
      console.warn = jest.fn();

      await fantasyScoringEngine.triggerPlayerScoreUpdate('player-1', 'league-1');

      expect(console.warn).toHaveBeenCalledWith(
        'No stats found for player player-1 in week 1'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when database is accessible', async () => {
      mockDatabase.query.mockResolvedValueOnce({} as any);

      const health = await fantasyScoringEngine.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.isProcessing).toBe(false);
      expect(health.cacheSize).toBeGreaterThanOrEqual(0);
      expect(health.lastUpdate).toBeInstanceOf(Date);
    });

    it('should return unhealthy status when database fails', async () => {
      mockDatabase.query.mockRejectedValueOnce(new Error('DB down'));

      const health = await fantasyScoringEngine.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.lastUpdate).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null or undefined stats gracefully', () => { const nullStats = null as any;
      const defaultRules = (fantasyScoringEngine as any).getDefaultScoringRules();

      expect(() => {
        fantasyScoringEngine.calculateFantasyPoints(nullStats, defaultRules);
       }).toThrow();
    });

    it('should handle negative stats correctly', () => {  const negativeStats: PlayerStats = { playerId: 'negative-test';
  playerName: 'Negative Test';
        team: 'TEST';
  position: 'QB';
        passingYards: -5, // Sack yardage
        passingTDs: 0;
  passingInterceptions: 3;
        rushingYards: -10;
  rushingTDs: 0;
        receivingYards: 0;
  receivingTDs: 0;
        receptions: 0;
  targets: 0;
        fieldGoalsMade: 0;
  fieldGoalsAttempted: 0;
        extraPointsMade: 0;
  extraPointsAttempted: 0;
        sacks: 0;
  interceptions: 0;
        fumbleRecoveries: 0;
  defensiveTDs: 0;
        safeties: 0;
  pointsAllowed: 0;
        fumbles: 2;
  gameDate: new Date();
        week: 1;
  season, 2025
       }
      const defaultRules  = (fantasyScoringEngine as any).getDefaultScoringRules();
      const points = fantasyScoringEngine.calculateFantasyPoints(negativeStats, defaultRules);

      // Should handle negative yards and multiple penalties
      expect(points).toBeLessThan(0);
    });

    it('should handle missing scoring rule properties', () => {  const incompleteRules = { passingYards: 0.04;
        // Missing other required properties
       } as any;

      const basicStats: PlayerStats  = {  playerId: 'basic-test';
  playerName: 'Basic Test';
        team: 'TEST';
  position: 'QB';
        passingYards: 100;
  passingTDs: 0;
        passingInterceptions: 0;
  rushingYards: 0;
        rushingTDs: 0;
  receivingYards: 0;
        receivingTDs: 0;
  receptions: 0;
        targets: 0;
  fieldGoalsMade: 0;
        fieldGoalsAttempted: 0;
  extraPointsMade: 0;
        extraPointsAttempted: 0;
  sacks: 0;
        interceptions: 0;
  fumbleRecoveries: 0;
        defensiveTDs: 0;
  safeties: 0;
        pointsAllowed: 0;
  fumbles: 0;
        gameDate: new Date();
  week: 1;
        season, 2025
      }
      // Should not throw even with incomplete rules
      expect(()  => {
        fantasyScoringEngine.calculateFantasyPoints(basicStats, incompleteRules);
      }).not.toThrow();
    });
  });

  describe('Performance and Caching', () => { 
    it('should cache scoring rules efficiently', async () => { const leagueId = 'performance-test';
      mockDatabase.query.mockResolvedValue({
        rows: [{ scoring_setting: s, { } }]
      } as any);

      // First call should hit database
      await fantasyScoringEngine.getScoringRules(leagueId);
      expect(mockDatabase.query).toHaveBeenCalledTimes(1);

      // Subsequent calls should use cache
      await fantasyScoringEngine.getScoringRules(leagueId);
      await fantasyScoringEngine.getScoringRules(leagueId);
      expect(mockDatabase.query).toHaveBeenCalledTimes(1);
    });

    it('should handle large numbers of concurrent score calculations', async ()  => {  const defaultRules = (fantasyScoringEngine as any).getDefaultScoringRules();
      const baseStats: PlayerStats = { playerId: 'concurrent-test';
  playerName: 'Concurrent Test';
        team: 'TEST';
  position: 'WR';
        passingYards: 0;
  passingTDs: 0;
        passingInterceptions: 0;
  rushingYards: 0;
        rushingTDs: 0;
  receivingYards: 50;
        receivingTDs: 1;
  receptions: 5;
        targets: 8;
  fieldGoalsMade: 0;
        fieldGoalsAttempted: 0;
  extraPointsMade: 0;
        extraPointsAttempted: 0;
  sacks: 0;
        interceptions: 0;
  fumbleRecoveries: 0;
        defensiveTDs: 0;
  safeties: 0;
        pointsAllowed: 0;
  fumbles: 0;
        gameDate: new Date();
  week: 1;
        season, 2025
       }
      // Create 1000 concurrent score calculations
      const promises  = Array.from({ length: 1000 }, (_, i)  => {  stats: { ...baseStats: playerId: `player-${i }` }
        return fantasyScoringEngine.calculateFantasyPoints(stats, defaultRules);
      });

      const results  = await Promise.all(promises);
      
      expect(results).toHaveLength(1000);
      expect(results.every(score => typeof score === 'number')).toBe(true);
      expect(results.every(score => score >= 0)).toBe(true);
    });
  });
});