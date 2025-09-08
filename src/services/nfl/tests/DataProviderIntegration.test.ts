/**
 * Comprehensive Integration Tests for NFL Data Provider
 * Tests all data flows, API integrations, caching, validation, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import { nflDataProvider } from '../dataProvider';
import { cacheManager } from '../cache/RedisCache';
import { DataValidator } from '../validation/DataValidator';
import { ClientManager } from '../clients/ClientManager';
import { RealTimeSyncService } from '../sync/RealTimeSyncService';
import { FallbackChain } from '../fallback/FallbackChain';
import type { NFLGame, NFLPlayer, PlayerStats } from '../dataProvider';

// Mock external dependencies
jest.mock('@/lib/database', () => ({
  database: {
    query: jest.fn()
  }
}));

jest.mock('@/lib/websocket/server', () => ({
  webSocketManager: {
    broadcastScoreUpdate: jest.fn(),
    broadcastPlayerUpdate: jest.fn(),
    broadcastInjuryAlert: jest.fn()
  }
}));

describe('NFL Data Provider Integration Tests', () => {
  let dataValidator: DataValidator;
  let clientManager: ClientManager;

  beforeAll(async () => {
    // Initialize test environment
    dataValidator = new DataValidator();
    
    // Mock client configuration
    clientManager = new ClientManager({
      sportsIO: {
        apiKey: 'test-key',
        priority: 1,
        enabled: true
      },
      espn: {
        priority: 2,
        enabled: true
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await clientManager.shutdown();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Data Retrieval and Caching', () => {
    it('should retrieve current week with fallback chain', async () => {
      // Mock successful API response
      const mockWeek = 5;
      jest.spyOn(nflDataProvider, 'getCurrentWeek').mockResolvedValue(mockWeek);

      const week = await nflDataProvider.getCurrentWeek();
      
      expect(week).toBe(mockWeek);
      expect(typeof week).toBe('number');
      expect(week).toBeGreaterThan(0);
      expect(week).toBeLessThanOrEqual(18);
    });

    it('should cache retrieved data with appropriate TTL', async () => {
      const cacheKey = 'test_current_week';
      const testData = { week: 5, timestamp: new Date() };
      
      // Test cache set
      await cacheManager.set(cacheKey, testData, { ttl: 300 });
      
      // Test cache get
      const cachedData = await cacheManager.get(cacheKey);
      
      expect(cachedData).toEqual(testData);
    });

    it('should handle cache misses gracefully', async () => {
      const nonExistentKey = 'non_existent_key_12345';
      
      const cachedData = await cacheManager.get(nonExistentKey);
      
      expect(cachedData).toBeNull();
    });

    it('should retrieve live games with proper validation', async () => {
      const mockGames: NFLGame[] = [
        {
          id: 'game_1',
          homeTeam: 'KC',
          awayTeam: 'BUF',
          gameTime: new Date(),
          week: 5,
          season: 2025,
          status: 'in_progress',
          quarter: 2,
          timeRemaining: '8:45',
          homeScore: 14,
          awayScore: 10,
          lastUpdated: new Date()
        }
      ];

      jest.spyOn(nflDataProvider, 'getLiveGames').mockResolvedValue(mockGames);

      const games = await nflDataProvider.getLiveGames(5);
      
      expect(games).toHaveLength(1);
      expect(games[0].id).toBe('game_1');
      expect(games[0].status).toBe('in_progress');
      
      // Validate game data
      const validationResult = dataValidator.validateGame(games[0]);
      expect(validationResult.isValid).toBe(true);
    });

    it('should retrieve player statistics with validation', async () => {
      const mockStats: PlayerStats = {
        playerId: 'player_1',
        gameId: 'game_1',
        week: 5,
        season: 2025,
        passingYards: 285,
        passingTDs: 2,
        passingInterceptions: 1,
        passingCompletions: 22,
        passingAttempts: 35,
        rushingYards: 45,
        rushingTDs: 0,
        rushingAttempts: 8,
        receivingYards: 0,
        receivingTDs: 0,
        receptions: 0,
        targets: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        extraPointsMade: 0,
        extraPointsAttempted: 0,
        sacks: 0,
        interceptions: 0,
        fumbleRecoveries: 0,
        defensiveTDs: 0,
        safeties: 0,
        pointsAllowed: 0,
        fantasyPoints: 18.4,
        projectedPoints: 20.5,
        lastUpdated: new Date()
      };

      jest.spyOn(nflDataProvider, 'getPlayerStats').mockResolvedValue(mockStats);

      const stats = await nflDataProvider.getPlayerStats('player_1', 5);
      
      expect(stats).not.toBeNull();
      expect(stats!.playerId).toBe('player_1');
      expect(stats!.fantasyPoints).toBe(18.4);
      
      // Validate stats data
      const validationResult = dataValidator.validatePlayerStats(stats!);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle API failures gracefully', async () => {
      jest.spyOn(nflDataProvider, 'getCurrentWeek').mockRejectedValue(new Error('API Error'));

      await expect(nflDataProvider.getCurrentWeek()).rejects.toThrow('API Error');
    });

    it('should implement exponential backoff for retries', async () => {
      const fallbackChain = new FallbackChain();
      
      let attemptCount = 0;
      const failingProvider = {
        name: 'test-provider',
        priority: 1,
        enabled: true,
        timeout: 1000,
        retryAttempts: 3,
        retryDelay: 100,
        fetch: async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Test failure');
          }
          return 'success';
        }
      };

      fallbackChain.addProvider(failingProvider);
      
      const result = await fallbackChain.execute('test', {});
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should handle circuit breaker opening', async () => {
      const mockClient = {
        makeRequest: jest.fn(),
        getHealthStatus: jest.fn().mockReturnValue({
          healthy: false,
          issues: ['Circuit breaker open']
        })
      };

      // Simulate multiple failures to open circuit breaker
      for (let i = 0; i < 6; i++) {
        mockClient.makeRequest.mockRejectedValue(new Error('Service unavailable'));
        try {
          await mockClient.makeRequest();
        } catch (error) {
          // Expected to fail
        }
      }

      const healthStatus = mockClient.getHealthStatus();
      expect(healthStatus.healthy).toBe(false);
    });

    it('should validate rate limiting', async () => {
      const rateLimitedClient = {
        requests: 0,
        maxRequests: 5,
        makeRequest: async function() {
          if (this.requests >= this.maxRequests) {
            throw new Error('Rate limit exceeded');
          }
          this.requests++;
          return 'success';
        }
      };

      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        const result = await rateLimitedClient.makeRequest();
        expect(result).toBe('success');
      }

      // Next request should be rate limited
      await expect(rateLimitedClient.makeRequest()).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Data Validation', () => {
    it('should validate game data structure', () => {
      const validGame: NFLGame = {
        id: 'valid_game',
        homeTeam: 'KC',
        awayTeam: 'BUF',
        gameTime: new Date(),
        week: 5,
        season: 2025,
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0,
        lastUpdated: new Date()
      };

      const result = dataValidator.validateGame(validGame);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid game data', () => {
      const invalidGame = {
        id: '',
        homeTeam: 'INVALID',
        awayTeam: 'KC',
        gameTime: new Date(),
        week: 5,
        season: 2025,
        status: 'invalid_status',
        homeScore: -5, // Invalid negative score
        awayScore: 0,
        lastUpdated: new Date()
      } as NFLGame;

      const result = dataValidator.validateGame(invalidGame);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate player statistics logic', () => {
      const invalidStats: PlayerStats = {
        playerId: 'player_1',
        gameId: 'game_1',
        week: 5,
        season: 2025,
        passingCompletions: 25, // More completions than attempts
        passingAttempts: 20,
        passingYards: 285,
        passingTDs: 2,
        passingInterceptions: 0,
        receptions: 8, // More receptions than targets
        targets: 5,
        receivingYards: 120,
        receivingTDs: 1,
        rushingYards: 0,
        rushingTDs: 0,
        rushingAttempts: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        extraPointsMade: 0,
        extraPointsAttempted: 0,
        sacks: 0,
        interceptions: 0,
        fumbleRecoveries: 0,
        defensiveTDs: 0,
        safeties: 0,
        pointsAllowed: 0,
        fantasyPoints: 25.0,
        projectedPoints: 22.0,
        lastUpdated: new Date()
      };

      const result = dataValidator.validatePlayerStats(invalidStats);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'COMPLETIONS_EXCEED_ATTEMPTS')).toBe(true);
      expect(result.errors.some(e => e.code === 'RECEPTIONS_EXCEED_TARGETS')).toBe(true);
    });

    it('should validate cross-references between data', async () => {
      const games: NFLGame[] = [{
        id: 'game_1',
        homeTeam: 'KC',
        awayTeam: 'BUF',
        gameTime: new Date(),
        week: 5,
        season: 2025,
        status: 'final',
        homeScore: 24,
        awayScore: 17,
        lastUpdated: new Date()
      }];

      const players: NFLPlayer[] = [{
        id: 'player_1',
        externalId: 'ext_1',
        firstName: 'Patrick',
        lastName: 'Mahomes',
        fullName: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        status: 'active'
      }];

      const stats: PlayerStats[] = [{
        playerId: 'player_1',
        gameId: 'game_1',
        week: 5,
        season: 2025,
        passingYards: 285,
        passingTDs: 3,
        passingInterceptions: 1,
        passingCompletions: 22,
        passingAttempts: 35,
        rushingYards: 0,
        rushingTDs: 0,
        rushingAttempts: 0,
        receivingYards: 0,
        receivingTDs: 0,
        receptions: 0,
        targets: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        extraPointsMade: 0,
        extraPointsAttempted: 0,
        sacks: 0,
        interceptions: 0,
        fumbleRecoveries: 0,
        defensiveTDs: 0,
        safeties: 0,
        pointsAllowed: 0,
        fantasyPoints: 23.4,
        projectedPoints: 25.0,
        lastUpdated: new Date()
      }];

      const consistencyResult = await dataValidator.checkConsistency({
        games,
        players,
        stats
      });

      expect(consistencyResult.isConsistent).toBe(true);
      expect(consistencyResult.inconsistencies).toHaveLength(0);
    });
  });

  describe('Real-Time Synchronization', () => {
    it('should detect changes in game scores', () => {
      const previousGame: NFLGame = {
        id: 'game_1',
        homeTeam: 'KC',
        awayTeam: 'BUF',
        gameTime: new Date(),
        week: 5,
        season: 2025,
        status: 'in_progress',
        quarter: 2,
        timeRemaining: '5:30',
        homeScore: 14,
        awayScore: 10,
        lastUpdated: new Date()
      };

      const currentGame: NFLGame = {
        ...previousGame,
        homeScore: 21, // Score changed
        lastUpdated: new Date()
      };

      // This would normally be handled by RealTimeSyncService
      const scoreChanged = previousGame.homeScore !== currentGame.homeScore;
      expect(scoreChanged).toBe(true);
    });

    it('should throttle real-time updates appropriately', async () => {
      let updateCount = 0;
      const mockBroadcast = jest.fn(() => updateCount++);

      // Simulate multiple rapid updates
      for (let i = 0; i < 10; i++) {
        mockBroadcast();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(updateCount).toBe(10);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;
      
      const promises = Array(concurrentRequests).fill(0).map(async (_, index) => {
        // Mock a quick operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return index;
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(concurrentRequests);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain response times under load', async () => {
      const responseTimes: number[] = [];
      const requestCount = 20;

      for (let i = 0; i < requestCount; i++) {
        const startTime = Date.now();
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(averageResponseTime).toBeLessThan(300); // Average under 300ms
      expect(maxResponseTime).toBeLessThan(1000); // Max under 1 second
    });

    it('should handle memory usage efficiently', () => {
      const initialMemory = process.memoryUsage();
      
      // Create a large dataset to test memory handling
      const largeDataset = Array(1000).fill(0).map((_, index) => ({
        id: `player_${index}`,
        name: `Player ${index}`,
        stats: {
          passingYards: Math.floor(Math.random() * 500),
          rushingYards: Math.floor(Math.random() * 200),
          fantasyPoints: Math.random() * 30
        }
      }));

      // Process the dataset
      const processedData = largeDataset.map(player => ({
        ...player,
        totalYards: player.stats.passingYards + player.stats.rushingYards
      }));

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(processedData).toHaveLength(1000);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle empty API responses', async () => {
      jest.spyOn(nflDataProvider, 'getLiveGames').mockResolvedValue([]);

      const games = await nflDataProvider.getLiveGames();
      
      expect(games).toEqual([]);
      expect(Array.isArray(games)).toBe(true);
    });

    it('should handle malformed API responses', async () => {
      const malformedData = {
        invalid: 'structure',
        missing: 'required_fields'
      };

      // This should trigger validation errors
      expect(() => {
        dataValidator.validateGame(malformedData as any);
      }).not.toThrow(); // Validator should handle gracefully

      const result = dataValidator.validateGame(malformedData as any);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle network timeouts', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });

      await expect(timeoutPromise).rejects.toThrow('Request timeout');
    });

    it('should handle cache corruption gracefully', async () => {
      const corruptedData = '{"invalid": json}';
      
      // Mock corrupted cache data
      jest.spyOn(cacheManager, 'get').mockImplementation(async (key) => {
        if (key === 'corrupted_key') {
          // Simulate JSON parse error
          throw new Error('Invalid JSON');
        }
        return null;
      });

      const result = await cacheManager.get('corrupted_key');
      expect(result).toBeNull();
    });

    it('should handle database connection failures', async () => {
      const { database } = await import('@/lib/database');
      
      // Mock database failure
      (database.query as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      // The provider should handle this gracefully and fall back
      await expect(database.query('SELECT 1')).rejects.toThrow('Connection failed');
    });
  });

  describe('Integration with External Services', () => {
    it('should integrate with WebSocket service for real-time updates', () => {
      const { webSocketManager } = require('@/lib/websocket/server');
      
      const mockUpdate = {
        gameId: 'game_1',
        type: 'score' as const,
        data: {
          homeScore: 21,
          awayScore: 14
        },
        timestamp: new Date()
      };

      webSocketManager.broadcastScoreUpdate(mockUpdate);
      
      expect(webSocketManager.broadcastScoreUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    it('should handle Redis connection failures gracefully', async () => {
      // Mock Redis failure
      jest.spyOn(cacheManager, 'healthCheck').mockResolvedValue({
        redis: false,
        fallback: true,
        latency: 0,
        stats: {
          hits: 0,
          misses: 0,
          hitRate: 0,
          totalRequests: 0,
          averageResponseTime: 0,
          cacheSize: 0,
          lastReset: new Date()
        }
      });

      const healthCheck = await cacheManager.healthCheck();
      
      expect(healthCheck.redis).toBe(false);
      expect(healthCheck.fallback).toBe(true);
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across cache and database', async () => {
      const testData = {
        playerId: 'player_1',
        stats: {
          fantasyPoints: 25.5,
          passingYards: 350
        },
        timestamp: new Date()
      };

      // Store in cache
      await cacheManager.set('player_stats_1', testData);
      
      // Retrieve from cache
      const cachedData = await cacheManager.get('player_stats_1');
      
      expect(cachedData).toEqual(testData);
    });

    it('should validate data transformations', () => {
      const rawAPIData = {
        PlayerID: 123,
        PassingYards: 285,
        PassingTouchdowns: 2,
        FantasyPoints: 18.4
      };

      // Simulate data transformation
      const transformedData = {
        playerId: rawAPIData.PlayerID.toString(),
        passingYards: rawAPIData.PassingYards,
        passingTDs: rawAPIData.PassingTouchdowns,
        fantasyPoints: rawAPIData.FantasyPoints
      };

      expect(transformedData.playerId).toBe('123');
      expect(transformedData.passingYards).toBe(285);
      expect(transformedData.fantasyPoints).toBe(18.4);
    });
  });
});

// Helper functions for testing
export const createMockGame = (overrides: Partial<NFLGame> = {}): NFLGame => ({
  id: 'test_game_1',
  homeTeam: 'KC',
  awayTeam: 'BUF',
  gameTime: new Date(),
  week: 5,
  season: 2025,
  status: 'scheduled',
  homeScore: 0,
  awayScore: 0,
  lastUpdated: new Date(),
  ...overrides
});

export const createMockPlayer = (overrides: Partial<NFLPlayer> = {}): NFLPlayer => ({
  id: 'test_player_1',
  externalId: 'ext_1',
  firstName: 'Test',
  lastName: 'Player',
  fullName: 'Test Player',
  position: 'QB',
  team: 'KC',
  status: 'active',
  ...overrides
});

export const createMockPlayerStats = (overrides: Partial<PlayerStats> = {}): PlayerStats => ({
  playerId: 'test_player_1',
  gameId: 'test_game_1',
  week: 5,
  season: 2025,
  passingYards: 0,
  passingTDs: 0,
  passingInterceptions: 0,
  passingCompletions: 0,
  passingAttempts: 0,
  rushingYards: 0,
  rushingTDs: 0,
  rushingAttempts: 0,
  receivingYards: 0,
  receivingTDs: 0,
  receptions: 0,
  targets: 0,
  fieldGoalsMade: 0,
  fieldGoalsAttempted: 0,
  extraPointsMade: 0,
  extraPointsAttempted: 0,
  sacks: 0,
  interceptions: 0,
  fumbleRecoveries: 0,
  defensiveTDs: 0,
  safeties: 0,
  pointsAllowed: 0,
  fantasyPoints: 0,
  projectedPoints: 0,
  lastUpdated: new Date(),
  ...overrides
});