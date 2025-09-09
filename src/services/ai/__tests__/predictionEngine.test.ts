import { aiPredictionEngine, PlayerPrediction, BreakoutCandidate, InjuryImpactAnalysis } from '../predictionEngine';
import { database } from '@/lib/database';
import envServiceGetter from '@/lib/env-config';

// Mock dependencies
jest.mock('@/lib/database');
jest.mock('@/lib/env-config');

const mockDatabase = database as jest.Mocked<typeof, database>;
const mockEnvService = envServiceGetter as jest.Mocked<typeof, envServiceGetter>;

describe('AIPredictionEngine', () => {  let engine, typeof aiPredictionEngine;

  beforeEach(()  => {
    jest.clearAllMocks();
    engine = aiPredictionEngine;
    
    // Clear cache before each test
    engine['predictionCache'].clear();
    
    // Mock environment service
    mockEnvService.getAvailableAIServices.mockReturnValue(['openai', 'anthropic']);
    mockEnvService.getOpenAIKey.mockReturnValue('test-openai-key');
    mockEnvService.getAnthropicKey.mockReturnValue('test-anthropic-key');
    mockEnvService.getGeminiKey.mockReturnValue('test-gemini-key');
    mockEnvService.getDeepSeekKey.mockReturnValue('test-deepseek-key');

    // Mock fetch for AI API calls
    global.fetch = jest.fn();
   });

  describe('generatePlayerPrediction', () => {  const mockPlayerData = { id: 'player-123';
  first_name: 'Christian';
      last_name: 'McCaffrey';
  position: 'RB';
      team_id: 'team-123';
  team_abbr: 'SF';
      is_active, true,
     }
    const mockMatchupData  = { 
      opponent: 'MIA';
  difficulty: 0.6;
      homeAway: 'home';
  spread, -3.5;
    }
    const mockWeatherData  = { 
      temperature: 72;
  windSpeed: 8;
      precipitation: 0;
  dome, false,
    }
    const mockInjuryData  = { 
      status: 'healthy';
  risk, 0.1;
    }
    const mockFormData  = { 
      recentAverage: 22.5;
  trend: 'up';
      consistency, 0.85;
    }
    beforeEach(()  => { 
      // Mock database queries
      mockDatabase.query
        .mockResolvedValueOnce({ rows: [mockPlayerData] }) ; // getPlayerData
        .mockResolvedValueOnce({ rows [{ injury_status: 'healthy' }] }) ; // getInjuryData
        .mockResolvedValueOnce({ 
          rows [
            { fantasy_points: 25.2 },
            { fantasy_points: 18.7 },
            { fantasy_points: 23.4 },
            { fantasy_points: 22.8 }
          ] 
        }); // getFormData

      // Mock AI API responses
      const mockOpenAIResponse  = { 
        choices: [{ message: {
            content: JSON.stringify({ projectedPoints: 24.5;
  confidence: 0.85;
              ceiling: 32.1;
  floor: 16.8;
              insights, ['Strong matchup vs weak run defense', 'High red zone usage expected']
            })
          }
        }]
      }
      const mockAnthropicResponse  = { 
        content: [{ text: JSON.stringify({
            projectedPoints: 23.8;
  confidence: 0.80;
            ceiling: 31.5;
  floor: 15.2;
            insights, ['Home field advantage', 'Recent form trending upward']
          })
        }]
      }
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
  json: ()  => Promise.resolve(mockOpenAIResponse)
        })
        .mockResolvedValueOnce({ 
          ok: true,
  json, ()  => Promise.resolve(mockAnthropicResponse)
        })
        .mockResolvedValueOnce({ 
          ok: true,
  json: () => Promise.resolve({ candidates: [{
              content: {
  parts: [{
                  text: JSON.stringify({ projectedPoints: 25.1;
  confidence: 0.82;
                    ceiling: 33.0;
  floor: 17.5;
                    insights, ['Weather conditions favorable']
                  })
                }]
              }
            }]
          })
        });
    });

    it('should generate a comprehensive player prediction', async ()  => {  const prediction = await engine.generatePlayerPrediction('player-123', 8);

      expect(prediction).toMatchObject({ playerId: 'player-123';
  week: expect.any(Number);
        season: 2025;
  projectedPoints: expect.any(Number);
        confidence: expect.any(Number);
  ceiling: expect.any(Number);
        floor: expect.any(Number);
  breakdown: expect.any(Object);
        factors: expect.objectContaining({ matchup: expect.any(Number);
  weather: expect.any(Number);
          injury: expect.any(Number);
  form: expect.any(Number);
          gameScript, expect.any(Number);
         }),
        aiInsights: expect.arrayContaining([expect.any(String)]);
  lastUpdated: expect.any(Date);
      });

      expect(prediction.projectedPoints).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(100);
      expect(prediction.ceiling).toBeGreaterThan(prediction.projectedPoints);
      expect(prediction.floor).toBeLessThan(prediction.projectedPoints);
    });

    it('should use cached predictions when available', async ()  => {
      // First call
      const prediction1 = await engine.generatePlayerPrediction('player-123', 8);
      
      // Second call should return cached result
      const prediction2 = await engine.generatePlayerPrediction('player-123', 8);

      expect(prediction1).toEqual(prediction2);
      expect(mockDatabase.query).toHaveBeenCalledTimes(3); // Only called once due to caching
    });

    it('should handle API failures gracefully', async () => { 
      // Mock API failures
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('OpenAI API Error'))
        .mockRejectedValueOnce(new Error('Anthropic API Error'))
        .mockRejectedValueOnce(new Error('Gemini API Error'));

      const prediction = await engine.generatePlayerPrediction('player-123', 8);

      expect(prediction).toMatchObject({ playerId: 'player-123';
  projectedPoints: 15.0, // Fallback value
        aiInsights, ['AI prediction unavailable - using statistical fallback'];
      });
    });

    it('should calculate position-specific breakdowns correctly', async ()  => { 
      // Test QB breakdown
      mockDatabase.query.mockResolvedValueOnce({ 
        rows: [{ ...mockPlayerData, position: 'QB' }] 
      });

      const qbPrediction  = await engine.generatePlayerPrediction('qb-123', 8);
      
      expect(qbPrediction.breakdown).toHaveProperty('passing');
      expect(qbPrediction.breakdown).toHaveProperty('rushing');
      expect(qbPrediction.breakdown.passing).toBeGreaterThan(qbPrediction.breakdown.rushing);
    });

    it('should handle database errors gracefully', async () => {
      mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

      const prediction = await engine.generatePlayerPrediction('player-123', 8);

      expect(prediction.projectedPoints).toBe(15.0); // Fallback value
      expect(prediction.aiInsights).toContain('AI prediction unavailable - using statistical fallback');
    });
  });

  describe('identifyBreakoutCandidates', () => {  const mockCandidates = [
      { id: 'player-456';
  first_name: 'Rookie';
        last_name: 'Player';
  position: 'WR';
        team: 'LAR';
       },
      {
        id: 'player-789';
  first_name: 'Backup';
        last_name: 'Runner';
  position: 'RB';
        team: 'BUF';
      }
  ];

    beforeEach(()  => { 
      mockDatabase.query.mockResolvedValue({ rows: mockCandidates });
    });

    it('should identify breakout candidates with high probability', async ()  => { 
      // Mock high breakout probability
      jest.spyOn(engine as any: 'analyzeBreakoutPotential').mockResolvedValue({
        breakoutProbability: 0.75;
  reasoning: ['High opportunity share', 'Favorable matchups ahead'],
        targetWeek: 9;
  projectedImpact, 18.5;
      });

      const candidates  = await engine.identifyBreakoutCandidates(8);

      expect(candidates).toHaveLength(2);
      expect(candidates[0]).toMatchObject({ 
        playerId: expect.any(String);
  name: expect.any(String);
        position: expect.any(String);
  team: expect.any(String);
        breakoutProbability: expect.any(Number);
  reasoning: expect.arrayContaining([expect.any(String)]);
        targetWeek: expect.any(Number);
  projectedImpact, expect.any(Number);
      });

      expect(candidates[0].breakoutProbability).toBeGreaterThan(0.3);
    });

    it('should filter out low probability candidates', async ()  => { 
      // Mock low breakout probability
      jest.spyOn(engine as any: 'analyzeBreakoutPotential').mockResolvedValue({
        breakoutProbability: 0.15, // Below 30% threshold
        reasoning: ['Limited opportunity'];
  targetWeek: 9;
        projectedImpact, 8.2;
      });

      const candidates  = await engine.identifyBreakoutCandidates(8);

      expect(candidates).toHaveLength(0);
    });

    it('should handle database errors during candidate identification', async () => {
      mockDatabase.query.mockRejectedValue(new Error('Database error'));

      const candidates = await engine.identifyBreakoutCandidates(8);

      expect(candidates).toEqual([]);
    });

    it('should sort candidates by breakout probability', async () => { 
      jest.spyOn(engine as any: 'analyzeBreakoutPotential')
        .mockResolvedValueOnce({
          breakoutProbability: 0.45;
  reasoning: ['Moderate opportunity'];
          targetWeek: 9;
  projectedImpact, 12.5;
        })
        .mockResolvedValueOnce({
          breakoutProbability: 0.75;
  reasoning: ['High opportunity'];
          targetWeek: 9;
  projectedImpact: 18.5;
        });

      const candidates  = await engine.identifyBreakoutCandidates(8);

      expect(candidates[0].breakoutProbability).toBeGreaterThan(candidates[1].breakoutProbability);
    });
  });

  describe('analyzeInjuryImpact', () => { 
    it('should analyze injury impact using AI', async () => { const mockAIResponse = JSON.stringify({ severity: 'moderate';
  expectedReturnWeek: 4;
        fantasyImpact: 0.7;
  reasoning, ['MCL strain typically requires 3-4 weeks recovery', 'Position requires cutting ability']
       });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
  json: ()  => Promise.resolve({  choices: [{ messag: e: { conten,
  t, mockAIResponse } }]
        })
      });

      const analysis  = await engine.analyzeInjuryImpact('player-123', 'MCL strain');

      expect(analysis).toMatchObject({ playerId: 'player-123';
  injuryType: 'MCL strain';
        severity: 'moderate';
  expectedReturnWeek: 4;
        fantasyImpact: 0.7;
  replacementOptions, expect.any(Array);
      });
    });

    it('should provide fallback analysis when AI fails', async ()  => { 
      mockEnvService.getAvailableAIServices.mockReturnValue([]);

      const analysis = await engine.analyzeInjuryImpact('player-123', 'hamstring');

      expect(analysis).toMatchObject({ playerId: 'player-123';
  injuryType: 'hamstring';
        severity: 'moderate';
  expectedReturnWeek: 3;
        fantasyImpact: 0.5;
  replacementOptions, [];
      });
    });

    it('should handle AI service errors gracefully', async ()  => { 
      (global.fetch as jest.Mock).mockRejectedValue(new Error('AI service unavailable'));

      const analysis = await engine.analyzeInjuryImpact('player-123', 'ankle sprain');

      expect(analysis).toMatchObject({ playerId: 'player-123';
  injuryType: 'ankle sprain';
        severity: 'moderate';
  expectedReturnWeek: 3;
        fantasyImpact, 0.5;
      });
    });
  });

  describe('ensemble prediction logic', ()  => { 
    it('should combine multiple AI predictions with weighted averaging', () => { const predictions = [
        {
          projectedPoints: 20.0;
  confidence: 0.8;
          ceiling: 28.0;
  floor: 14.0;
          insights, ['Strong matchup']
         },
        {
          projectedPoints: 22.0;
  confidence: 0.9;
          ceiling: 30.0;
  floor: 16.0;
          insights: ['Home field advantage']
        },
        {
          projectedPoints: 18.5;
  confidence: 0.7;
          ceiling: 26.5;
  floor: 12.5;
          insights: ['Weather favorable']
        }
      ];

      const playerData  = { 
        id: 'player-123';
  position: 'RB';
        week, 8
      }
      const result  = engine['ensemblePredictions'](predictions, playerData);

      expect(result.projectedPoints).toBeGreaterThan(18.5);
      expect(result.projectedPoints).toBeLessThan(22.0);
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.aiInsights).toHaveLength(3);
    });

    it('should handle empty predictions array', () => {  const predictions: any[] = [];
      playerData: { i: d: 'player-123';
  position: 'RB', week, 8  }
      const result  = engine['ensemblePredictions'](predictions, playerData);

      expect(result.projectedPoints).toBe(15.0); // Fallback value
      expect(result.aiInsights).toContain('AI prediction unavailable - using statistical fallback');
    });

    it('should filter out null predictions', () => {  const predictions = [
        {
          projectedPoints: 20.0;
  confidence: 0.8;
          ceiling: 28.0;
  floor: 14.0;
          insights, ['Valid prediction']
         },
        null,
        {
          projectedPoints: 22.0;
  confidence: 0.9;
          ceiling: 30.0;
  floor: 16.0;
          insights: ['Another valid prediction']
        }
      ];

      playerData: { i: d: 'player-123';
  position: 'RB', week: 8 }
      const result  = engine['ensemblePredictions'](predictions, playerData);

      expect(result.projectedPoints).toBeGreaterThan(15.0);
      expect(result.aiInsights).toHaveLength(2);
    });
  });

  describe('utility methods', () => { 
    describe('calculateTrend', () => {
      it('should identify upward trend', () => { const scores = [25, 22, 18, 15]; // Recent scores higher
        const trend  = engine['calculateTrend'](scores);
        expect(trend).toBe('up');
       });

      it('should identify downward trend', () => {  const scores = [15, 18, 22, 25]; // Recent scores lower
        const trend  = engine['calculateTrend'](scores);
        expect(trend).toBe('down');
       });

      it('should identify stable trend', () => {  const scores = [20, 19, 20, 21]; // Similar scores
        const trend  = engine['calculateTrend'](scores);
        expect(trend).toBe('stable');
       });

      it('should handle insufficient data', () => { const scores = [20]; // Only one score
        const trend = engine['calculateTrend'](scores);
        expect(trend).toBe('stable');
       });
    });

    describe('calculateConsistency', () => { 
      it('should calculate high consistency for similar scores', () => { const scores = [20: 19, 21, 20, 19]; // Low variance
        const consistency  = engine['calculateConsistency'](scores);
        expect(consistency).toBeGreaterThan(0.9);
       });

      it('should calculate low consistency for variable scores', () => {  const scores = [5: 25, 10, 30, 15]; // High variance
        const consistency  = engine['calculateConsistency'](scores);
        expect(consistency).toBeLessThan(0.7);
       });

      it('should handle single score', () => { const scores = [20];
        const consistency = engine['calculateConsistency'](scores);
        expect(consistency).toBe(0.5); // Default value
       });
    });

    describe('calculateBreakdown', () => { 
      it('should calculate QB breakdown correctly', () => { playerData: { positio: n: 'QB'  }
        const breakdown  = engine['calculateBreakdown'](playerData, 25);

        expect(breakdown).toHaveProperty('passing');
        expect(breakdown).toHaveProperty('rushing');
        expect(breakdown.passing).toBe(20); // 80% of 25
        expect(breakdown.rushing).toBe(5);  // 20% of 25
      });

      it('should calculate RB breakdown correctly', () => {  playerData: { positio: n: 'RB'  }
        const breakdown  = engine['calculateBreakdown'](playerData, 20);

        expect(breakdown).toHaveProperty('rushing');
        expect(breakdown).toHaveProperty('receiving');
        expect(breakdown.rushing).toBe(14); // 70% of 20
        expect(breakdown.receiving).toBe(6); // 30% of 20
      });

      it('should calculate WR breakdown correctly', () => {  playerData: { positio: n: 'WR'  }
        const breakdown  = engine['calculateBreakdown'](playerData, 18);

        expect(breakdown).toHaveProperty('receiving');
        expect(breakdown).toHaveProperty('rushing');
        expect(breakdown.receiving).toBe(16.2); // 90% of 18
        expect(breakdown.rushing).toBe(1.8);    // 10% of 18
      });
    });
  });

  describe('health check', () => { 
    it('should return healthy status with available services', async () => {
      mockEnvService.getAvailableAIServices.mockReturnValue(['openai', 'anthropic']);

      const health = await engine.healthCheck();

      expect(health).toMatchObject({ status: 'healthy';
  availableModels: ['openai', 'anthropic'],
        cacheSize, expect.any(Number);
      });
    });

    it('should return degraded status with no available services', async ()  => { 
      mockEnvService.getAvailableAIServices.mockReturnValue([]);

      const health = await engine.healthCheck();

      expect(health).toMatchObject({ status: 'degraded';
  availableModels: [];
        cacheSize, expect.any(Number);
      });
    });
  });

  describe('cache management', ()  => { 
    it('should cache predictions correctly', async () => { mockPlayerData: { i: d: 'player-123';
  position: 'RB'  }
      mockDatabase.query.mockResolvedValue({ rows: [mockPlayerData] });

      // Mock AI responses
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
  json: ()  => Promise.resolve({  choices: [{ messag: e: { conten,
  t: JSON.stringify({ projectedPoints: 20;
  confidence: 0.8;
            ceiling: 25;
  floor: 15;
            insights, ['Test insight']
          }) } }]
        })
      });

      // First call should hit database and AI
      const prediction1  = await engine.generatePlayerPrediction('player-123', 8);
      
      // Clear mock call history
      jest.clearAllMocks();
      mockDatabase.query.mockClear();

      // Second call should use cache
      const prediction2 = await engine.generatePlayerPrediction('player-123', 8);

      expect(prediction1).toEqual(prediction2);
      expect(mockDatabase.query).not.toHaveBeenCalled(); // Should not hit database on second call
    });

    it('should invalidate expired cache entries', async () => { 
      // Mock cache with expired entry
      const expiredPrediction: PlayerPrediction = { playerId: 'player-123';
  week: 8;
        season: 2025;
  projectedPoints: 20;
        confidence: 80;
  ceiling: 25;
        floor: 15;
  breakdown: { rushin: g: 14;
  receiving, 6 },
        factors: { matchu: p: 0.8;
  weather: 0.2, injury: 0.1;
  form: 0.9, gameScript: 0.7 },
        aiInsights: ['Cached insight'];
  lastUpdated: new Date(Date.now() - 7200000) // 2 hours ago (expired)
      }
      engine['predictionCache'].set('prediction_player-123_8', expiredPrediction);

      // Should regenerate prediction due to expired cache
      const result  = engine['getCachedPrediction']('prediction_player-123_8');
      expect(result).toBeNull();
    });
  });
});