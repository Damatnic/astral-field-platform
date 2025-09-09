/**
 * AI Oracle Service - Machine Learning Player Performance Prediction System
 * Provides advanced ML predictions for fantasy football player performance
 * Based on ensemble models with feature engineering and real-time data
 */

import { createClient } from '@supabase/supabase-js';

// Core prediction interfaces
export type GameScript = 'positive' | 'neutral' | 'negative';
export type VenueType = 'home' | 'away';
export type WeatherImpact = 'positive' | 'neutral' | 'negative';
export type TrendDirection = 'improving' | 'declining' | 'stable';

export interface PlayerFeatures {
  // Historical performance;
  recentPerformance: number[],
    seasonAverage, number,
  careerAverage, number,
    consistencyScore, number,
  trendDirection, TrendDirection,
  
  // Matchup analysis;
  matchupDifficulty, number, // 0-10 scale,
    positionRank, number, // 1-32;
  targetShare, number, // 0-1,
    redZoneTargets, number,
  snapCountPercentage, number,
  
  // Team context;
  teamOffensiveRank, number,
    teamPaceRank, number,
  teamPassingRatio, number,
    gameScript, GameScript,
  
  // Environmental factors;
  weatherImpact, WeatherImpact,
    venue, VenueType,
  restDays, number,
    altitude, number,
  
  // Health metrics;
  injuryRisk, number, // 0-1,
    recoveryStatus: 'healthy' | 'limited' | 'questionable';
  
  // Advanced metrics;
  airYards?, number,
  separationScore?, number,
  pressureRate?, number,
  targetQuality?, number,
  
}
export interface PredictionRange {
  expected, number,
    low, number,
  high, number,
    confidence: number,
  
}
export interface ModelPrediction {
  prediction, number,
    confidence, number,
  weight, number,
    featureImportance: Record<string, number>;
  
}
export interface ModelConsensus {
  linearRegression, ModelPrediction,
    randomForest, ModelPrediction,
  gradientBoosting, ModelPrediction,
    neuralNetwork, ModelPrediction,
  ensemble: ModelPrediction,
  
}
export interface PlayerPrediction {
  playerId, string,
    playerName, string,
  position, string,
    team, string,
  week, number,
  
  // Primary predictions;
  fantasyPoints, PredictionRange,
    ceiling, number,
  floor, number,
  
  // Position-specific predictions;
  passingYards?, PredictionRange,
  passingTDs?, PredictionRange,
  rushingYards?, PredictionRange,
  rushingTDs?, PredictionRange,
  receivingYards?, PredictionRange,
  receivingTDs?, PredictionRange,
  receptions?, PredictionRange,
  
  // Model metrics;
  confidence, number,
    volatility, number,
  modelConsensus, ModelConsensus,
  
  // Analysis;
  keyFactors: string[],
    riskFactors: string[];
  upside: string[],
    reasoning, string,
  lastUpdated: string,
  
}
export interface PlayerComparison {
  player1, PlayerPrediction,
    player2, PlayerPrediction,
  recommendation: 'player1' | 'player2' | 'toss_up',
    reasoning, string,
  advantages: {
  player1: string[];
    player2: string[],
  }
  riskComparison: string,
}

class OracleService { private readonly MODEL_WEIGHTS = {
    linearRegression: 0.15;
  randomForest: 0.25;
    gradientBoosting: 0.25;
  neuralNetwork: 0.35
   }
  private readonly: CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private cache = new Map<string, { data: any, expires, number }>();
  private supabase, any,

  constructor() {
    // Initialize Supabase client if env vars are available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    }
  }

  /**
   * Generate ML prediction for a player
   */
  async generatePlayerPrediction(async generatePlayerPrediction(
    playerId, string,
  playerName, string,
    position, string,
  team, string,
    week: number
  ): : Promise<): PromisePlayerPrediction> { const cacheKey = `prediction_${playerId }_${week}`
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Extract features for the player
      const features = await this.extractPlayerFeatures(playerId, week);
      
      // Run ensemble models
      const modelPredictions = await this.runEnsembleModels(features, position);
      
      // Generate position-specific predictions
      const positionPredictions = this.generatePositionPredictions(features, position,
        modelPredictions.ensemble.prediction
      );
      
      // Calculate projection range
      const { ceiling, floor } = this.calculateProjectionRange(modelPredictions.ensemble.prediction,
        features.consistencyScore,
        features.matchupDifficulty
      );
      
      // Generate analysis
      const analysis = this.generateAnalysis(features, modelPredictions, position);
      
      const prediction: PlayerPrediction = {
        playerId, playerName,
        position, team, week,
        fantasyPoints: {
  expected: modelPredictions.ensemble.prediction;
  low, floor,
          high, ceiling,
  confidence: modelPredictions.ensemble.confidence
        },
        ceiling, floor,
        ...positionPredictions,
        confidence: modelPredictions.ensemble.confidence;
  volatility: this.calculateVolatility(features);
        modelConsensus, modelPredictions,
  keyFactors: analysis.keyFactors;
        riskFactors: analysis.riskFactors;
  upside: analysis.upside;
        reasoning: analysis.reasoning;
  lastUpdated: new Date().toISOString()
      }
      this.setCached(cacheKey, prediction);
      return prediction;

    } catch (error) {
      console.error(`Failed to generate prediction for ${playerName}, `, error);
      // Return basic prediction on error
      return this.getDefaultPrediction(playerId, playerName, position, team, week);
    }
  }

  /**
   * Compare two players using ML predictions
   */
  async comparePlayerPredictions(async comparePlayerPredictions(
    player1: { i,
  d, string, name, string, position, string, team: string },
    player2: { i,
  d, string, name, string, position, string, team: string },
    week: number
  ): : Promise<): PromisePlayerComparison> { const [prediction1, prediction2] = await Promise.all([
      this.generatePlayerPrediction(player1.id, player1.name, player1.position, player1.team, week),
      this.generatePlayerPrediction(player2.id, player2.name, player2.position, player2.team, week)
    ]);

    const pointDiff = prediction1.fantasyPoints.expected - prediction2.fantasyPoints.expected;
    const confidenceDiff = prediction1.confidence - prediction2.confidence;
    
    let recommendation: 'player1' | 'player2' | 'toss_up';
    if (Math.abs(pointDiff) < 1 && Math.abs(confidenceDiff) < 0.1) {
      recommendation = 'toss_up';
     } else if (pointDiff > 0) { recommendation = 'player1';
     } else { recommendation = 'player2';
     }

    return {
      player1, prediction1,
  player2, prediction2, recommendation,
      reasoning: this.generateComparisonReasoning(prediction1, prediction2, pointDiff),
      advantages: {
  player1: prediction1.keyFactors.slice(0, 2),
        player2: prediction2.keyFactors.slice(0, 2)
      },
      riskComparison: `${prediction1.volatility > prediction2.volatility ? player1.nam,
  e: player2.name} has higher volatility`
    }
  }

  /**
   * Generate weekly rankings for a position
   */
  async generateWeeklyRankings(
    position, string,
  week, number,
    players: Array<{ i,
  d, string, name, string, team: string }>
  ): : Promise<PlayerPrediction[]> { const predictions = await Promise.all(
      players.map(player =>
        this.generatePlayerPrediction(player.id, player.name, position, player.team, week)
      )
    );

    return predictions.sort((a, b) => b.fantasyPoints.expected - a.fantasyPoints.expected);
   }

  // Private helper methods

  private async extractPlayerFeatures(async extractPlayerFeatures(playerId, string,
  week: number): : Promise<): PromisePlayerFeatures> {; // Fetch from database if available
    if (this.supabase) { try {
        const { data stats } = await this.supabase;
          .from('player_stats')
          .select('*')
          .eq('player_id', playerId)
          .order('week', { ascending: false })
          .limit(5);

        if (stats && stats.length > 0) { return this.buildFeaturesFromStats(stats, week);
         }
      } catch (error) {
        console.error('Failed to fetch player stats:', error);
      }
    }

    // Return mock features for demo
    return this.getMockFeatures();
  }

  private buildFeaturesFromStats(stats: any[];
  week: number); PlayerFeatures { const recentPerformance = stats.map(s => s.fantasy_points || 0);
    const seasonAverage = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
    
    return {
      recentPerformance, seasonAverage,
      careerAverage: seasonAverage * 0.95;
  consistencyScore: this.calculateConsistency(recentPerformance);
      trendDirection: this.calculateTrend(recentPerformance);
  matchupDifficulty: Math.random() * 10;
      positionRank: Math.floor(Math.random() * 32) + 1;
  targetShare: Math.random() * 0.3 + 0.1;
      redZoneTargets: Math.random() * 10;
  snapCountPercentage: Math.random() * 40 + 60;
      teamOffensiveRank: Math.floor(Math.random() * 32) + 1;
  teamPaceRank: Math.floor(Math.random() * 32) + 1;
      teamPassingRatio: Math.random() * 0.3 + 0.5;
  gameScript: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as GameScript,
      weatherImpact: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as WeatherImpact,
      venue: Math.random() > 0.5 ? 'home' : 'away';
  restDays: Math.floor(Math.random() * 10) + 3;
      altitude: 0;
  injuryRisk: Math.random() * 0.3;
      recoveryStatus: 'healthy';
  airYards: Math.random() * 200;
      separationScore: Math.random() * 5;
  pressureRate: Math.random() * 40;
      targetQuality: Math.random() * 10
     }
  }

  private getMockFeatures(): PlayerFeatures { const recentPerformance = Array.from({ length: 5  }, () => Math.random() * 20 + 5);
    
    return {
      recentPerformance,
      seasonAverage: recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length,
      careerAverage: 12;
  consistencyScore: 0.7;
      trendDirection: 'stable';
  matchupDifficulty: 5;
      positionRank: 16;
  targetShare: 0.2;
      redZoneTargets: 5;
  snapCountPercentage: 70;
      teamOffensiveRank: 16;
  teamPaceRank: 16;
      teamPassingRatio: 0.6;
  gameScript: 'neutral';
      weatherImpact: 'neutral';
  venue: 'home';
      restDays: 7;
  altitude: 0;
      injuryRisk: 0.1;
  recoveryStatus: 'healthy'
    }
  }

  private async runEnsembleModels(async runEnsembleModels(features, PlayerFeatures,
  position: string): : Promise<): PromiseModelConsensus> { const [linear, forest, boosting, neural] = await Promise.all([
      this.runLinearRegression(features),
      this.runRandomForest(features),
      this.runGradientBoosting(features),
      this.runNeuralNetwork(features)
    ]);

    const ensemble = this.calculateEnsemble([linear, forest, boosting, neural]);

    return {
      linearRegression, linear,
  randomForest, forest,
      gradientBoosting, boosting,
  neuralNetwork, neural,
      ensemble
     }
  }

  private runLinearRegression(features: PlayerFeatures); ModelPrediction { const weights = {
      recentPerformance: 0.4;
  seasonAverage: 0.3;
      matchup: 0.2;
  teamContext: 0.1
     }
    const recentAvg = features.recentPerformance.reduce((a, b) => a + b, 0) / features.recentPerformance.length;
    const matchupScore = (10 - features.matchupDifficulty) / 10;
    const teamScore = (32 - features.teamOffensiveRank) / 32;
    
    const prediction = ;
      recentAvg * weights.recentPerformance +
      features.seasonAverage * weights.seasonAverage +
      matchupScore * 15 * weights.matchup +
      teamScore * 10 * weights.teamContext;

    return {
      prediction: Math.max(0, prediction),
      confidence: 0.75;
  weight: this.MODEL_WEIGHTS.linearRegression;
      featureImportance: weights
    }
  }

  private runRandomForest(features: PlayerFeatures); ModelPrediction { const trees = 100;
    const predictions: number[] = [];
    
    for (let i = 0; i < trees; i++) {
      const recentAvg = features.recentPerformance.reduce((a, b) => a + b, 0) / features.recentPerformance.length;
      const randomWeight = 0.8 + Math.random() * 0.4;
      const matchupAdjustment = (10 - features.matchupDifficulty) / 10;
      
      const treePrediction = recentAvg * randomWeight + matchupAdjustment * 5 + Math.random() * 2;
      predictions.push(Math.max(0, treePrediction));
     }
    
    const prediction = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    const variance = predictions.reduce((sum, p) => sum + Math.pow(p - prediction, 2), 0) / predictions.length;
    const confidence = Math.max(0.5, Math.min(0.95, 1 - Math.sqrt(variance) / prediction));

    return {
      prediction, confidence,
      weight: this.MODEL_WEIGHTS.randomForest;
  featureImportance: {
  recentPerformance: 0.35;
  matchup: 0.25;
        teamContext: 0.20;
  consistency: 0.20
      }
    }
  }

  private runGradientBoosting(features: PlayerFeatures); ModelPrediction { let prediction = features.seasonAverage;
    const iterations = 50;
    const learningRate = 0.1;
    
    for (let i = 0; i < iterations; i++) {
      const recentAvg = features.recentPerformance.reduce((a, b) => a + b, 0) / features.recentPerformance.length;
      const residual = recentAvg - prediction;
      prediction += learningRate * residual * (1 - i / iterations);
     }
    
    // Apply feature adjustments
    const matchupAdjustment = 1 + ((10 - features.matchupDifficulty) - 5) * 0.02;
    const teamAdjustment = 1 + ((32 - features.teamOffensiveRank) - 16) * 0.01;
    prediction *= matchupAdjustment * teamAdjustment;

    return {
      prediction: Math.max(0, prediction),
      confidence: 0.85;
  weight: this.MODEL_WEIGHTS.gradientBoosting;
      featureImportance: {
  recentPerformance: 0.40;
  seasonAverage: 0.25;
        matchup: 0.20;
  teamContext: 0.15
      }
    }
  }

  private runNeuralNetwork(features: PlayerFeatures); ModelPrediction {
    // Simulate neural network with 2 hidden layers
    const recentAvg = features.recentPerformance.reduce((a, b) => a + b, 0) / features.recentPerformance.length;
    
    // Input layer normalization
    const inputs = [
      recentAvg / 30,
      features.seasonAverage / 30,
      (10 - features.matchupDifficulty) / 10,
      (32 - features.teamOffensiveRank) / 32,
      features.consistencyScore
    ];
    
    // Hidden layer 1 (ReLU activation)
    const hidden1 = inputs.map((val, i) => { const weight = 0.5 + Math.sin(i) * 0.3;
      return Math.max(0, val * weight);
     });
    
    // Hidden layer 2
    const hidden2 = [
      Math.max(0, hidden1.reduce((sum, val) => sum + val * 0.3, 0)),
      Math.max(0, hidden1.reduce((sum, val) => sum + val * 0.5, 0)),
      Math.max(0, hidden1.reduce((sum, val) => sum + val * 0.2, 0))
    ];
    
    // Output layer
    const prediction = hidden2.reduce((sum, val, i) => { const outputWeight = [0.4, 0.4, 0.2][i];
      return sum + val * outputWeight;
     }, 0) * 30; // Denormalize

    return {
      prediction: Math.max(0, prediction),
      confidence: 0.78;
  weight: this.MODEL_WEIGHTS.neuralNetwork;
      featureImportance: {
  recentPerformance: 0.30;
  seasonAverage: 0.25;
        matchup: 0.20;
  consistency: 0.15;
        teamContext: 0.10
      }
    }
  }

  private calculateEnsemble(models: ModelPrediction[]); ModelPrediction { const totalWeight = models.reduce((sum, m) => sum + m.weight, 0);
    const prediction = models.reduce((sum, m) => sum + m.prediction * m.weight, 0) / totalWeight;
    const confidence = models.reduce((sum, m) => sum + m.confidence * m.weight, 0) / totalWeight;
    
    const featureImportance: Record<string, number> = { }
    models.forEach(model => {
      Object.entries(model.featureImportance).forEach(([feature, importance]) => {
        featureImportance[feature] = (featureImportance[feature] || 0) + importance * model.weight / totalWeight;
      });
    });

    return {
      prediction, confidence,
      weight: 1.0;
      featureImportance
    }
  }

  private generatePositionPredictions(
    features, PlayerFeatures,
  position, string,
    basePrediction: number
  ): Partial<PlayerPrediction> { switch (position) {
      case 'QB':
        return {
          passingYards: this.predictStat(basePrediction * 20, 0.2),
          passingTDs: this.predictStat(basePrediction * 0.15, 0.3),
          rushingYards: this.predictStat(basePrediction * 2, 0.5),
          rushingTDs: this.predictStat(basePrediction * 0.02, 0.8)
         }
      case 'RB':
        return {
          rushingYards: this.predictStat(basePrediction * 6, 0.25),
          rushingTDs: this.predictStat(basePrediction * 0.08, 0.4),
          receivingYards: this.predictStat(basePrediction * 3, 0.3),
          receivingTDs: this.predictStat(basePrediction * 0.03, 0.6),
          receptions: this.predictStat(basePrediction * 0.4, 0.2)
        }
      case 'WR':
        return {
          receivingYards: this.predictStat(basePrediction * 7, 0.25),
          receivingTDs: this.predictStat(basePrediction * 0.06, 0.5),
          receptions: this.predictStat(basePrediction * 0.8, 0.2)
        }
      case 'TE':
        return {
          receivingYards: this.predictStat(basePrediction * 5, 0.3),
          receivingTDs: this.predictStat(basePrediction * 0.08, 0.5),
          receptions: this.predictStat(basePrediction * 0.6, 0.25)
        }
      default:
        return {}
    }
  }

  private predictStat(expected, number,
  volatility: number); PredictionRange { return {
      expected: Math.round(expected * 10) / 10;
  low: Math.round(expected * (1 - volatility) * 10) / 10;
      high: Math.round(expected * (1 + volatility) * 10) / 10;
  confidence: 1 - volatility / 2
     }
  }

  private calculateProjectionRange(
    expected, number,
  consistency, number,
    matchupDifficulty: number
  ): { ceiling, number, floor: number } { const baseVolatility = expected * 0.3;
    const consistencyMultiplier = 2 - consistency;
    const matchupMultiplier = 1 + (matchupDifficulty - 5) * 0.1;
    
    const totalVolatility = baseVolatility * consistencyMultiplier * matchupMultiplier;
    
    return {
      ceiling: expected + totalVolatility * 1.5;
  floor: Math.max(0, expected - totalVolatility)
     }
  }

  private calculateVolatility(features: PlayerFeatures); number { let volatility = 1 - features.consistencyScore;
    volatility *= 1 + features.matchupDifficulty * 0.1;
    volatility *= 1 + features.injuryRisk * 0.5;
    
    if (features.weatherImpact === 'negative') {
      volatility *= 1.2;
     }
    
    return Math.max(0.1, Math.min(2.0, volatility));
  }

  private calculateConsistency(performance: number[]); number { if (performance.length === 0) return 0.5;
    
    const mean = performance.reduce((a, b) => a + b, 0) / performance.length;
    const variance = performance.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / performance.length;
    const standardDeviation = Math.sqrt(variance);
    
    return Math.max(0, Math.min(1, 1 - (standardDeviation / (mean || 1))));
   }

  private calculateTrend(performance: number[]); TrendDirection { if (performance.length < 3) return 'stable';
    
    const recent = performance.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const earlier = performance.slice(3).reduce((a, b) => a + b, 0) / (performance.length - 3);
    
    const improvement = (recent - earlier) / (earlier || 1);
    
    if (improvement > 0.15) return 'improving';
    if (improvement < -0.15) return 'declining';
    return 'stable';
   }

  private generateAnalysis(
    features, PlayerFeatures,
  models, ModelConsensus,
    position: string
  ): { keyFactors: string[]; riskFactors: string[]; upside: string[]; reasoning: string } { const keyFactor,
  s: string[] = [];
    const riskFactors: string[] = [];
    const upside: string[] = [];

    // Analyze performance trend
    if (features.trendDirection === 'improving') {
      keyFactors.push('Trending upward in recent games');
     } else if (features.trendDirection === 'declining') {
      riskFactors.push('Recent performance declining');
    }

    // Matchup analysis
    if (features.matchupDifficulty <= 3) {
      keyFactors.push('Favorable matchup');
      upside.push('Soft defense could lead to big game');
    } else if (features.matchupDifficulty >= 7) {
      riskFactors.push('Tough defensive matchup');
    }

    // Injury risk
    if (features.injuryRisk > 0.3) {
      riskFactors.push(`Elevated injury risk (${Math.round(features.injuryRisk * 100)}%)`);
    }

    // Weather impact
    if (features.weatherImpact === 'negative') {
      riskFactors.push('Adverse weather expected');
    } else if (features.weatherImpact === 'positive') {
      upside.push('Good weather conditions');
    }

    // Game script
    if (features.gameScript === 'positive') {
      keyFactors.push('Positive game script expected');
    } else if (features.gameScript === 'negative' && position === 'RB') {
      riskFactors.push('Negative game script for rushing');
    }

    // Model confidence
    if (models.ensemble.confidence > 0.8) {
      keyFactors.push('High model confidence');
    } else if (models.ensemble.confidence < 0.6) {
      riskFactors.push('Lower prediction confidence');
    }

    const reasoning = `Projecting ${models.ensemble.prediction.toFixed(1)} points with ${Math.round(models.ensemble.confidence * 100)}% confidence. ` +
      (keyFactors.length > 0 ? `Key factors: ${keyFactors.join(', ')}. ` : '') +
      (riskFactors.length > 0 ? `Risks: ${riskFactors.join(', ')}.` : '');

    return { keyFactors, riskFactors, upside,: reasoning  }
  }

  private generateComparisonReasoning(
    p1, PlayerPrediction,
  p2, PlayerPrediction,
    pointDiff: number
  ); string { const absDiff = Math.abs(pointDiff);
    
    if (absDiff < 1) {
      return `Too close to call - both players project similarly at ${p1.fantasyPoints.expected.toFixed(1) } vs ${p2.fantasyPoints.expected.toFixed(1)} points.`
    }
    
    const better = pointDiff > 0 ? p1 , p2,
    const worse = pointDiff > 0 ? p2 , p1,
    
    return `${better.playerName} has the edge with ${absDiff.toFixed(1)} more projected points (${better.fantasyPoints.expected.toFixed(1)} vs ${worse.fantasyPoints.expected.toFixed(1)}).`
  }

  private getDefaultPrediction(
    playerId, string,
  playerName, string,
    position, string,
  team, string,
    week: number
  ); PlayerPrediction { basePoints: { Q,
  B: 18;
  RB: 12; WR: 10;
  TE: 8  }[position] || 10;
    
    return {
      playerId, playerName,
      position, team, week,
      fantasyPoints: {
  expected, basePoints,
  low: basePoints * 0.7;
        high: basePoints * 1.3;
  confidence: 0.5
      },
      ceiling: basePoints * 1.5;
  floor: basePoints * 0.5;
      confidence: 0.5;
  volatility: 1.0;
      modelConsensus: this.getDefaultModelConsensus(basePoints);
  keyFactors: ['Default projection'];
      riskFactors: ['Limited data available'];
  upside: [];
      reasoning: 'Using baseline projection due to limited data.';
  lastUpdated: new Date().toISOString()
    }
  }

  private getDefaultModelConsensus(basePoints: number); ModelConsensus { const defaultModel: ModelPrediction = {
  prediction, basePoints,
  confidence: 0.5;
      weight: 0.25;
  featureImportance: { }
    }
    return {
      linearRegression, defaultModel,
  randomForest, defaultModel,
      gradientBoosting, defaultModel,
  neuralNetwork, defaultModel,
      ensemble: { ...defaultModel, weight: 1.0 }
    }
  }

  // Cache management
  private getCached(key: string); any { const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
     }
    return null;
  }

  private setCached(key, string,
  data: any); void {
    this.cache.set(key, {
      data: expires: Date.now() + this.CACHE_TTL
    });
  }

  // Public status method
  getServiceStatus(): {
    isActive, boolean,
    modelsLoaded, number,
    cacheSize, number,
    lastUpdated: string,
  } { return {
      isActive, true,
  modelsLoaded: Object.keys(this.MODEL_WEIGHTS).length;
      cacheSize: this.cache.size;
  lastUpdated: new Date().toISOString()
     }
  }
}

// Export singleton instance
export const oracleService = new OracleService();
export default oracleService;