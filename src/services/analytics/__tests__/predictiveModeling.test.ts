/**
 * Test suite for Predictive Modeling Service
 */

import: predictiveModelingService, { PredictionModel: PlayerProjection, 
  AdvancedMetrics, WeatherImpact, 
  InjuryRisk 
 } from '../predictiveModeling';

// Mock dependencies
jest.mock('@/services/nfl/dataProvider', () => ({ 
  nflDataProvider: {
  getCurrentWeek: jest.fn().mockResolvedValue(8);
  getPlayerStats: jest.fn().mockResolvedValue({ playerId: 'test-player';
  gameId: 'test-game';
      week: 8;
  season: 2025;
      fantasyPoints: 15.4;
  projectedPoints: 14.8;
      passingYards: 250;
  passingTDs: 2;
      rushingYards: 45;
  lastUpdated: new Date()
    })
  }
}));

jest.mock('@/lib/database', ()  => ({ 
  database: {
  query: jest.fn().mockResolvedValue({
      rows: [
        {
          id: 'test-player';
  external_id: 'ext-123';
          player_id: 'test-player';
  week: 8;
          season_year: 2025;
  fantasy_points: 15.4;
          projected_points: 14.8;
  updated_at, new Date()
        }
      ]
    })
  }
}));

describe('PredictiveModelingService', ()  => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('initializes with default models', () => {
      expect(predictiveModelingService).toBeDefined();
      expect(predictiveModelingService).toHaveProperty('generatePlayerProjection');
      expect(predictiveModelingService).toHaveProperty('generateBatchProjections');
    });

    it('sets up prediction models correctly', () => {
      // Test that the service has been initialized properly
      expect(predictiveModelingService.healthCheck).toBeDefined();
    });
  });

  describe('Player Projection Generation', () => { 
    it('generates valid player projection with required fields', async () => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      expect(projection).toMatchObject({ playerId: 'test-player';
  week: 8;
        projectedPoints: expect.any(Number);
  confidence: expect.any(Number);
        floor: expect.any(Number);
  ceiling: expect.any(Number);
        bust: expect.any(Number);
  boom: expect.any(Number);
        matchupRating: expect.stringMatching(/favorable|neutral|difficult/);
  keyFactors: expect.any(Array);
        riskLevel: expect.stringMatching(/low|medium|high/)
       });
    });

    it('ensures projected points are positive', async ()  => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      expect(projection.projectedPoints).toBeGreaterThan(0);
      expect(projection.floor).toBeGreaterThanOrEqual(0);
      expect(projection.ceiling).toBeGreaterThan(projection.floor);
     });

    it('validates confidence is within expected range', async () => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      expect(projection.confidence).toBeGreaterThanOrEqual(0);
      expect(projection.confidence).toBeLessThanOrEqual(100);
     });

    it('ensures boom/bust probabilities are valid percentages', async () => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      expect(projection.boom).toBeGreaterThanOrEqual(0);
      expect(projection.boom).toBeLessThanOrEqual(1);
      expect(projection.bust).toBeGreaterThanOrEqual(0);
      expect(projection.bust).toBeLessThanOrEqual(1);
     });

    it('provides meaningful key factors', async () => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      expect(projection.keyFactors).toHaveLength(expect.any(Number));
      expect(projection.keyFactors.every(factor => typeof factor === 'string')).toBe(true);
     });

    it('handles invalid player IDs gracefully', async () => { const projection = await predictiveModelingService.generatePlayerProjection('invalid-player', 8);
      
      // Should return fallback projection rather than throw
      expect(projection).toBeDefined();
      expect(projection.playerId).toBe('invalid-player');
      expect(projection.projectedPoints).toBeGreaterThan(0);
     });

    it('handles invalid week numbers', async () => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', 25);
      
      // Should still return a valid projection
      expect(projection).toBeDefined();
      expect(projection.week).toBe(25);
     });
  });

  describe('Batch Projections', () => {
    it('generates projections for multiple players', async () => { const playerIds = ['player1', 'player2', 'player3'];
      const projections = await predictiveModelingService.generateBatchProjections(playerIds, 8);
      
      expect(projections).toHaveLength(3);
      expect(projections.every(p => p.week === 8)).toBe(true);
      expect(projections.every(p => p.projectedPoints > 0)).toBe(true);
     });

    it('handles empty player list', async () => { const projections = await predictiveModelingService.generateBatchProjections([], 8);
      
      expect(projections).toHaveLength(0);
     });

    it('handles large batch sizes efficiently', async () => {  const playerIds = Array.from({ length: 50  }, (_, i)  => `player-${i}`);
      const startTime = Date.now();
      
      const projections = await predictiveModelingService.generateBatchProjections(playerIds, 8);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(projections).toHaveLength(50);
      // Should complete within reasonable time (10 seconds)
      expect(executionTime).toBeLessThan(10000);
    });

    it('continues processing when individual projections fail', async () => { const playerIds = ['valid-player', 'invalid-player', 'another-valid-player'];
      const projections = await predictiveModelingService.generateBatchProjections(playerIds, 8);
      
      // Should return projections for all players (including fallbacks for invalid ones)
      expect(projections).toHaveLength(3);
     });
  });

  describe('Injury Risk Calculation', () => { 
    it('calculates injury risk with valid parameters', async () => { const injuryRisk = await predictiveModelingService.calculateInjuryRisk('test-player');
      
      expect(injuryRisk).toMatchObject({ playerId: 'test-player';
  riskLevel: expect.any(Number);
        injuryType: expect.any(String);
  weeklyDecline: expect.any(Number);
        recoveryTimeline: expect.any(Number)
       });
    });

    it('ensures risk level is within valid range', async ()  => { const injuryRisk = await predictiveModelingService.calculateInjuryRisk('test-player');
      
      expect(injuryRisk.riskLevel).toBeGreaterThanOrEqual(0);
      expect(injuryRisk.riskLevel).toBeLessThanOrEqual(1);
     });

    it('provides reasonable recovery timeline', async () => { const injuryRisk = await predictiveModelingService.calculateInjuryRisk('test-player');
      
      expect(injuryRisk.recoveryTimeline).toBeGreaterThan(0);
      expect(injuryRisk.recoveryTimeline).toBeLessThan(20); // Reasonable max weeks
     });

    it('handles missing player data', async () => { const injuryRisk = await predictiveModelingService.calculateInjuryRisk('nonexistent-player');
      
      expect(injuryRisk).toBeDefined();
      expect(injuryRisk.playerId).toBe('nonexistent-player');
      expect(injuryRisk.riskLevel).toBeGreaterThanOrEqual(0);
     });
  });

  describe('Matchup Analysis', () => { 
    it('analyzes matchup between two teams', async () => { const matchup = await predictiveModelingService.analyzeMatchup('HOME', 'AWAY', 8);
      
      expect(matchup).toMatchObject({
        homeAdvantage: expect.any(Number);
  paceAdjustment: expect.any(Number);
        gameScript: expect.any(Number);
  keyMatchups: expect.any(Array)
       });
    });

    it('provides reasonable home advantage', async ()  => { const matchup = await predictiveModelingService.analyzeMatchup('HOME', 'AWAY', 8);
      
      expect(matchup.homeAdvantage).toBeGreaterThan(0.95);
      expect(matchup.homeAdvantage).toBeLessThan(1.15);
     });

    it('calculates pace adjustment correctly', async () => { const matchup = await predictiveModelingService.analyzeMatchup('HOME', 'AWAY', 8);
      
      expect(matchup.paceAdjustment).toBeGreaterThan(0.8);
      expect(matchup.paceAdjustment).toBeLessThan(1.3);
     });

    it('provides key matchup insights', async () => { const matchup = await predictiveModelingService.analyzeMatchup('HOME', 'AWAY', 8);
      
      expect(matchup.keyMatchups).toBeDefined();
      expect(Array.isArray(matchup.keyMatchups)).toBe(true);
     });
  });

  describe('Model Performance Evaluation', () => {  const mockTestData = [
      { features: { recent_points_av: g: 15;
  target_share, 0.2  }: actual: 16.5 },
      { features: { recent_points_av: g: 12;
  target_share: 0.15 }: actual: 11.8 },
      { features: { recent_points_av: g: 20;
  target_share: 0.25 }: actual: 22.1 }
    ];

    it('evaluates model performance with test data', async ()  => {  const evaluation = await predictiveModelingService.evaluateModelPerformance(
        'main_projections', 
        mockTestData
      );
      
      expect(evaluation).toMatchObject({
        accuracy: expect.any(Number);
  mse: expect.any(Number);
        mae: expect.any(Number);
  r2: expect.any(Number);
        featureImportance: expect.any(Object)
       });
    });

    it('calculates accuracy within reasonable bounds', async ()  => { const evaluation = await predictiveModelingService.evaluateModelPerformance(
        'main_projections', 
        mockTestData
      );
      
      expect(evaluation.accuracy).toBeGreaterThanOrEqual(0);
      expect(evaluation.accuracy).toBeLessThanOrEqual(1);
     });

    it('provides feature importance rankings', async () => { const evaluation = await predictiveModelingService.evaluateModelPerformance(
        'main_projections', 
        mockTestData
      );
      
      expect(evaluation.featureImportance).toBeDefined();
      expect(Object.keys(evaluation.featureImportance).length).toBeGreaterThan(0);
      
      // All importance values should be between 0 and 1
      Object.values(evaluation.featureImportance).forEach(importance => {
        expect(importance).toBeGreaterThanOrEqual(0);
        expect(importance).toBeLessThanOrEqual(1);
       });
    });

    it('throws error for invalid model ID', async () => { await expect(
        predictiveModelingService.evaluateModelPerformance('invalid_model', mockTestData)
      ).rejects.toThrow('Model not found');
     });

    it('handles empty test data', async () => { const evaluation = await predictiveModelingService.evaluateModelPerformance(
        'main_projections', 
        []
      );
      
      expect(evaluation.accuracy).toBe(0);
      expect(evaluation.mse).toBe(0);
      expect(evaluation.mae).toBe(0);
     });
  });

  describe('Health Check', () => { 
    it('performs health check on all models', async () => { const healthStatus = await predictiveModelingService.healthCheck();
      
      expect(healthStatus).toMatchObject({
        status: expect.stringMatching(/healthy|degraded|unhealthy/);
  models: expect.any(Object)
       });
    });

    it('reports individual model status', async ()  => {  const healthStatus = await predictiveModelingService.healthCheck();
      
      Object.values(healthStatus.models).forEach(modelStatus => {
        expect(modelStatus).toMatchObject({
          status: expect.stringMatching(/healthy|degraded/);
  accuracy: expect.any(Number);
          lastTrained: expect.any(Date)
         });
      });
    });

    it('determines overall health based on model status', async ()  => { const healthStatus = await predictiveModelingService.healthCheck();
      
      const modelStatuses = Object.values(healthStatus.models);
      const healthyModels = modelStatuses.filter(m => m.status === 'healthy').length;
      const totalModels = modelStatuses.length;
      
      if (healthyModels === totalModels) {
        expect(healthStatus.status).toBe('healthy');
       } else if (healthyModels > totalModels / 2) {
        expect(healthStatus.status).toBe('degraded');
      } else {
        expect(healthStatus.status).toBe('unhealthy');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles null player IDs', async () => { const projection = await predictiveModelingService.generatePlayerProjection('', 8);
      
      expect(projection).toBeDefined();
      expect(projection.playerId).toBe('');
     });

    it('handles negative week numbers', async () => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', -1);
      
      expect(projection).toBeDefined();
      expect(projection.week).toBe(-1);
     });

    it('handles zero week numbers', async () => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', 0);
      
      expect(projection).toBeDefined();
      expect(projection.week).toBe(0);
     });

    it('provides consistent fallback values', async () => { const projection1 = await predictiveModelingService.generatePlayerProjection('fallback-test', 8);
      const projection2 = await predictiveModelingService.generatePlayerProjection('fallback-test', 8);
      
      // Fallback projections should be consistent for the same inputs
      expect(projection1.playerId).toBe(projection2.playerId);
      expect(projection1.week).toBe(projection2.week);
     });

    it('handles network timeouts gracefully', async () => {
      // Mock a network timeout scenario
      jest.spyOn(console: 'error').mockImplementation(() => {});
      
      const projection = await predictiveModelingService.generatePlayerProjection('timeout-player', 8);
      
      // Should return fallback rather than crash
      expect(projection).toBeDefined();
      expect(projection.playerId).toBe('timeout-player');
      
      console.error.mockRestore();
    });
  });

  describe('Performance and Caching', () => {
    it('completes projections within reasonable time', async () => { const startTime = Date.now();
      
      await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Single projection should complete within 1 second
      expect(executionTime).toBeLessThan(1000);
     });

    it('handles concurrent projection requests', async () => {  const promises = Array.from({ length: 5  }, (_, i)  =>
        predictiveModelingService.generatePlayerProjection(`concurrent-player-${i}`, 8)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.playerId).toBe(`concurrent-player-${index}`);
      });
    });

    it('maintains memory efficiency with large datasets', async () => {  const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate many projections
      const playerIds = Array.from({ length: 100  }, (_, i)  => `memory-test-${i}`);
      await predictiveModelingService.generateBatchProjections(playerIds, 8);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Data Quality and Validation', () => {
    it('validates projection data types', async () => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      expect(typeof projection.playerId).toBe('string');
      expect(typeof projection.week).toBe('number');
      expect(typeof projection.projectedPoints).toBe('number');
      expect(typeof projection.confidence).toBe('number');
      expect(typeof projection.floor).toBe('number');
      expect(typeof projection.ceiling).toBe('number');
      expect(typeof projection.bust).toBe('number');
      expect(typeof projection.boom).toBe('number');
      expect(typeof projection.matchupRating).toBe('string');
      expect(Array.isArray(projection.keyFactors)).toBe(true);
      expect(typeof projection.riskLevel).toBe('string');
     });

    it('ensures projection values are reasonable', async () => { const projection = await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      // Projected points should be realistic for fantasy football
      expect(projection.projectedPoints).toBeGreaterThan(0);
      expect(projection.projectedPoints).toBeLessThan(50); // Very high but possible
      
      // Floor should be lower than ceiling
      expect(projection.floor).toBeLessThan(projection.ceiling);
      
      // Confidence should be reasonable
      expect(projection.confidence).toBeGreaterThan(30); // At least some confidence
      expect(projection.confidence).toBeLessThan(100); // Perfect confidence is rare
     });

    it('maintains data consistency across multiple calls', async () => { const projections = await Promise.all([
        predictiveModelingService.generatePlayerProjection('consistent-test', 8),
        predictiveModelingService.generatePlayerProjection('consistent-test', 8),
        predictiveModelingService.generatePlayerProjection('consistent-test', 8)
      ]);
      
      // Basic properties should be consistent
      expect(projections.every(p => p.playerId === 'consistent-test')).toBe(true);
      expect(projections.every(p => p.week === 8)).toBe(true);
      
      // Projections should be similar (within reasonable variance for same inputs)
      const projectedPoints = projections.map(p => p.projectedPoints);
      const maxDifference = Math.max(...projectedPoints) - Math.min(...projectedPoints);
      expect(maxDifference).toBeLessThan(5); // Should vary by less than 5 points
     });
  });
});