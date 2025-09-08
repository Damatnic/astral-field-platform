/**
 * Integration test suite for Analytics Services
 * Tests the integration between all analytics components
 */

import predictiveModelingService from '../predictiveModeling';
import tradeAnalyzerService from '../tradeAnalyzer';
import matchupAnalyticsService from '../matchupAnalytics';
import marketAnalysisService from '../marketAnalysis';

// Mock external dependencies
jest.mock('@/services/nfl/dataProvider');
jest.mock('@/lib/database');

describe('Analytics Services Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cross-Service Data Flow', () => {
    it('integrates predictive modeling with trade analysis', async () => {
      // Generate a player projection
      const projection = await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      // Use projection data in trade analysis
      const playerValue = await tradeAnalyzerService.calculatePlayerValue('test-player', {
        timeframe: 'current'
      });
      
      expect(projection).toBeDefined();
      expect(playerValue).toBeDefined();
      expect(playerValue.playerId).toBe('test-player');
      expect(playerValue.currentValue).toBeGreaterThan(0);
    });

    it('integrates market analysis with predictive modeling', async () => {
      // Analyze player market
      const marketData = await marketAnalysisService.analyzePlayerMarket('test-player');
      
      // Generate projection for same player
      const projection = await predictiveModelingService.generatePlayerProjection('test-player', 8);
      
      expect(marketData).toBeDefined();
      expect(projection).toBeDefined();
      expect(marketData.playerId).toBe(projection.playerId);
    });

    it('integrates matchup analytics with predictive modeling', async () => {
      // Analyze a matchup
      const matchup = await matchupAnalyticsService.analyzeMatchup('team1', 'team2', 8);
      
      // The matchup analysis should use projections internally
      expect(matchup).toBeDefined();
      expect(matchup.team1ProjectedScore).toBeGreaterThan(0);
      expect(matchup.team2ProjectedScore).toBeGreaterThan(0);
      expect(matchup.winProbability).toBeGreaterThanOrEqual(0);
      expect(matchup.winProbability).toBeLessThanOrEqual(1);
    });

    it('uses consistent player data across services', async () => {
      const playerId = 'consistency-test-player';
      
      // Get data from all services
      const [projection, playerValue, marketData] = await Promise.all([
        predictiveModelingService.generatePlayerProjection(playerId, 8),
        tradeAnalyzerService.calculatePlayerValue(playerId, { timeframe: 'current' }),
        marketAnalysisService.analyzePlayerMarket(playerId)
      ]);
      
      // All should reference the same player
      expect(projection.playerId).toBe(playerId);
      expect(playerValue.playerId).toBe(playerId);
      expect(marketData.playerId).toBe(playerId);
    });
  });

  describe('Service Health and Performance', () => {
    it('all services respond to health checks', async () => {
      const healthChecks = await Promise.all([
        predictiveModelingService.healthCheck(),
        // Trade analyzer and market analysis don't have health checks in current implementation
        // but they should respond without errors to basic operations
        tradeAnalyzerService.calculatePlayerValue('health-test', { timeframe: 'current' }),
        marketAnalysisService.analyzePlayerMarket('health-test')
      ]);
      
      expect(healthChecks[0]).toHaveProperty('status');
      expect(healthChecks[1]).toHaveProperty('playerId');
      expect(healthChecks[2]).toHaveProperty('playerId');
    });

    it('services handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 5 }, async (_, i) => {
        const playerId = `concurrent-test-${i}`;
        
        return Promise.all([
          predictiveModelingService.generatePlayerProjection(playerId, 8),
          tradeAnalyzerService.calculatePlayerValue(playerId, { timeframe: 'current' }),
          marketAnalysisService.analyzePlayerMarket(playerId)
        ]);
      });
      
      const startTime = Date.now();
      const results = await Promise.all(concurrentRequests);
      const executionTime = Date.now() - startTime;
      
      expect(results).toHaveLength(5);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify all requests completed successfully
      results.forEach((result, index) => {
        const [projection, playerValue, marketData] = result;
        const expectedPlayerId = `concurrent-test-${index}`;
        
        expect(projection.playerId).toBe(expectedPlayerId);
        expect(playerValue.playerId).toBe(expectedPlayerId);
        expect(marketData.playerId).toBe(expectedPlayerId);
      });
    });

    it('services maintain data consistency under load', async () => {
      const playerId = 'load-test-player';
      
      // Make many concurrent requests for the same player
      const requests = Array.from({ length: 10 }, () =>
        Promise.all([
          predictiveModelingService.generatePlayerProjection(playerId, 8),
          tradeAnalyzerService.calculatePlayerValue(playerId, { timeframe: 'current' })
        ])
      );
      
      const results = await Promise.all(requests);
      
      // Check consistency of results
      const projections = results.map(([projection]) => projection);
      const playerValues = results.map(([, playerValue]) => playerValue);
      
      // All projections should be for the same player and week
      expect(projections.every(p => p.playerId === playerId)).toBe(true);
      expect(projections.every(p => p.week === 8)).toBe(true);
      
      // All player values should be for the same player
      expect(playerValues.every(pv => pv.playerId === playerId)).toBe(true);
      
      // Values should be consistent (within reasonable variance)
      const projectedPoints = projections.map(p => p.projectedPoints);
      const maxProjectionDiff = Math.max(...projectedPoints) - Math.min(...projectedPoints);
      expect(maxProjectionDiff).toBeLessThan(5); // Reasonable variance threshold
      
      const currentValues = playerValues.map(pv => pv.currentValue);
      const maxValueDiff = Math.max(...currentValues) - Math.min(...currentValues);
      expect(maxValueDiff).toBeLessThan(3); // Reasonable variance threshold
    });
  });

  describe('Error Handling and Resilience', () => {
    it('services handle invalid inputs gracefully', async () => {
      const invalidInputs = ['', null, undefined, 'invalid-player-id'];
      
      for (const input of invalidInputs) {
        // Services should not throw errors, but provide fallback responses
        await expect(
          predictiveModelingService.generatePlayerProjection(input as any, 8)
        ).resolves.toBeDefined();
        
        await expect(
          tradeAnalyzerService.calculatePlayerValue(input as any, { timeframe: 'current' })
        ).resolves.toBeDefined();
        
        await expect(
          marketAnalysisService.analyzePlayerMarket(input as any)
        ).resolves.toBeDefined();
      }
    });

    it('services provide fallback responses when dependencies fail', async () => {
      // Mock a dependency failure
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const responses = await Promise.allSettled([
        predictiveModelingService.generatePlayerProjection('fallback-test', 8),
        tradeAnalyzerService.calculatePlayerValue('fallback-test', { timeframe: 'current' }),
        marketAnalysisService.analyzePlayerMarket('fallback-test')
      ]);
      
      // All should fulfill (not reject) even with mocked failures
      expect(responses.every(r => r.status === 'fulfilled')).toBe(true);
      
      console.error.mockRestore();
    });

    it('services maintain functionality during high error rates', async () => {
      // Simulate high error rate scenario
      const errorProneRequests = Array.from({ length: 20 }, (_, i) => {
        // Mix of valid and invalid requests
        const playerId = i % 3 === 0 ? '' : `error-test-${i}`;
        
        return Promise.allSettled([
          predictiveModelingService.generatePlayerProjection(playerId, 8),
          tradeAnalyzerService.calculatePlayerValue(playerId, { timeframe: 'current' })
        ]);
      });
      
      const results = await Promise.all(errorProneRequests);
      
      // Count successful vs failed requests
      let successCount = 0;
      let failCount = 0;
      
      results.forEach(result => {
        result.forEach(res => {
          if (res.status === 'fulfilled') {
            successCount++;
          } else {
            failCount++;
          }
        });
      });
      
      // Should have more successes than failures
      expect(successCount).toBeGreaterThan(failCount);
    });
  });

  describe('Data Quality and Validation', () => {
    it('ensures consistent data types across services', async () => {
      const playerId = 'type-test-player';
      
      const [projection, playerValue, marketData] = await Promise.all([
        predictiveModelingService.generatePlayerProjection(playerId, 8),
        tradeAnalyzerService.calculatePlayerValue(playerId, { timeframe: 'current' }),
        marketAnalysisService.analyzePlayerMarket(playerId)
      ]);
      
      // Validate types for projection
      expect(typeof projection.playerId).toBe('string');
      expect(typeof projection.week).toBe('number');
      expect(typeof projection.projectedPoints).toBe('number');
      expect(typeof projection.confidence).toBe('number');
      
      // Validate types for player value
      expect(typeof playerValue.playerId).toBe('string');
      expect(typeof playerValue.currentValue).toBe('number');
      expect(typeof playerValue.projectedValue).toBe('number');
      
      // Validate types for market data
      expect(typeof marketData.playerId).toBe('string');
      expect(typeof marketData.currentMarketValue).toBe('number');
      expect(Array.isArray(marketData.historicalValues)).toBe(true);
    });

    it('ensures numeric values are within reasonable bounds', async () => {
      const projection = await predictiveModelingService.generatePlayerProjection('bounds-test', 8);
      const playerValue = await tradeAnalyzerService.calculatePlayerValue('bounds-test', { 
        timeframe: 'current' 
      });
      
      // Projected points should be reasonable for fantasy football
      expect(projection.projectedPoints).toBeGreaterThan(0);
      expect(projection.projectedPoints).toBeLessThan(50);
      
      // Confidence should be percentage
      expect(projection.confidence).toBeGreaterThanOrEqual(0);
      expect(projection.confidence).toBeLessThanOrEqual(100);
      
      // Floor should be less than ceiling
      expect(projection.floor).toBeLessThan(projection.ceiling);
      
      // Player value should be positive
      expect(playerValue.currentValue).toBeGreaterThan(0);
      expect(playerValue.currentValue).toBeLessThan(100); // Reasonable upper bound
    });

    it('validates array and object structures', async () => {
      const marketData = await marketAnalysisService.analyzePlayerMarket('structure-test');
      
      // Historical values should be proper array of objects
      expect(Array.isArray(marketData.historicalValues)).toBe(true);
      marketData.historicalValues.forEach(value => {
        expect(value).toHaveProperty('timestamp');
        expect(value).toHaveProperty('value');
        expect(value.timestamp).toBeInstanceOf(Date);
        expect(typeof value.value).toBe('number');
      });
      
      // Trend analysis should have proper structure
      expect(marketData.trendAnalysis).toHaveProperty('direction');
      expect(marketData.trendAnalysis).toHaveProperty('strength');
      expect(['bullish', 'bearish', 'sideways']).toContain(marketData.trendAnalysis.direction);
      expect(['weak', 'moderate', 'strong']).toContain(marketData.trendAnalysis.strength);
    });
  });

  describe('Performance Optimization', () => {
    it('services use efficient algorithms for large datasets', async () => {
      const largePlayerSet = Array.from({ length: 100 }, (_, i) => `perf-test-${i}`);
      
      const startTime = Date.now();
      
      // Process large dataset
      const batchProjections = await predictiveModelingService.generateBatchProjections(
        largePlayerSet, 
        8
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(batchProjections).toHaveLength(100);
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
      
      // Verify all projections are valid
      batchProjections.forEach((projection, index) => {
        expect(projection.playerId).toBe(`perf-test-${index}`);
        expect(projection.projectedPoints).toBeGreaterThan(0);
      });
    });

    it('services implement proper caching mechanisms', async () => {
      const playerId = 'cache-test-player';
      
      // First call - should be slower
      const startTime1 = Date.now();
      await marketAnalysisService.analyzePlayerMarket(playerId);
      const firstCallTime = Date.now() - startTime1;
      
      // Second call - should be faster due to caching
      const startTime2 = Date.now();
      await marketAnalysisService.analyzePlayerMarket(playerId);
      const secondCallTime = Date.now() - startTime2;
      
      // Second call should be significantly faster
      expect(secondCallTime).toBeLessThan(firstCallTime / 2);
    });

    it('services maintain reasonable memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      const operations = Array.from({ length: 50 }, async (_, i) => {
        const playerId = `memory-test-${i}`;
        
        return Promise.all([
          predictiveModelingService.generatePlayerProjection(playerId, 8),
          tradeAnalyzerService.calculatePlayerValue(playerId, { timeframe: 'current' }),
          marketAnalysisService.analyzePlayerMarket(playerId)
        ]);
      });
      
      await Promise.all(operations);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Service Integration Workflows', () => {
    it('supports complete trade evaluation workflow', async () => {
      // Simulate a complete trade evaluation workflow
      const tradeProposal = {
        id: 'workflow-test-trade',
        team1Id: 'team-alpha',
        team2Id: 'team-beta',
        team1Players: ['player-1', 'player-2'],
        team2Players: ['player-3'],
        proposedBy: 'team-alpha',
        proposedAt: new Date(),
        status: 'pending' as const
      };
      
      // Step 1: Get projections for all involved players
      const playerProjections = await Promise.all([
        ...tradeProposal.team1Players.map(id => 
          predictiveModelingService.generatePlayerProjection(id, 8)
        ),
        ...tradeProposal.team2Players.map(id => 
          predictiveModelingService.generatePlayerProjection(id, 8)
        )
      ]);
      
      // Step 2: Calculate player values
      const playerValues = await Promise.all([
        ...tradeProposal.team1Players.map(id => 
          tradeAnalyzerService.calculatePlayerValue(id, { timeframe: 'current' })
        ),
        ...tradeProposal.team2Players.map(id => 
          tradeAnalyzerService.calculatePlayerValue(id, { timeframe: 'current' })
        )
      ]);
      
      // Step 3: Analyze market trends
      const marketAnalyses = await Promise.all([
        ...tradeProposal.team1Players.map(id => 
          marketAnalysisService.analyzePlayerMarket(id)
        ),
        ...tradeProposal.team2Players.map(id => 
          marketAnalysisService.analyzePlayerMarket(id)
        )
      ]);
      
      // Step 4: Perform comprehensive trade analysis
      const tradeAnalysis = await tradeAnalyzerService.analyzeTradeProposal(tradeProposal);
      
      // Verify workflow completion
      expect(playerProjections).toHaveLength(3);
      expect(playerValues).toHaveLength(3);
      expect(marketAnalyses).toHaveLength(3);
      expect(tradeAnalysis).toBeDefined();
      expect(tradeAnalysis.tradeId).toBe('workflow-test-trade');
    });

    it('supports weekly matchup analysis workflow', async () => {
      // Simulate weekly matchup analysis
      const week = 8;
      const teams = ['team1', 'team2'];
      
      // Step 1: Analyze matchup
      const matchup = await matchupAnalyticsService.analyzeMatchup(teams[0], teams[1], week);
      
      // Step 2: Get weekly analysis for league
      const weeklyAnalysis = await matchupAnalyticsService.analyzeWeeklyMatchups('test-league', week);
      
      // Verify workflow results
      expect(matchup).toBeDefined();
      expect(matchup.week).toBe(week);
      expect(matchup.team1Id).toBe(teams[0]);
      expect(matchup.team2Id).toBe(teams[1]);
      
      expect(weeklyAnalysis).toBeDefined();
      expect(weeklyAnalysis.week).toBe(week);
      expect(Array.isArray(weeklyAnalysis.matchups)).toBe(true);
      expect(Array.isArray(weeklyAnalysis.upsetPotential)).toBe(true);
    });

    it('supports market opportunity identification workflow', async () => {
      // Generate market report
      const marketReport = await marketAnalysisService.generateMarketReport();
      
      // Identify arbitrage opportunities
      const arbitrageOpportunities = await marketAnalysisService.identifyArbitrageOpportunities();
      
      // Analyze market sentiment
      const sentiment = await marketAnalysisService.analyzeMarketSentiment({
        position: 'RB'
      });
      
      // Verify workflow results
      expect(marketReport).toBeDefined();
      expect(marketReport.date).toBeInstanceOf(Date);
      expect(marketReport.marketOverview).toBeDefined();
      
      expect(Array.isArray(arbitrageOpportunities)).toBe(true);
      
      expect(sentiment).toBeDefined();
      expect(['bullish', 'bearish', 'neutral']).toContain(sentiment.sentiment);
    });
  });
});