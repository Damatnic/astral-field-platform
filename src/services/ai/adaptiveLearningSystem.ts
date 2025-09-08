/**
 * Adaptive Learning System for AI Predictions
 * Continuously improves prediction accuracy by learning from outcomes
 */

import { database } from '../../lib/database';
import { aiPredictionEngine, type PlayerPrediction } from './predictionEngine';

export interface PredictionOutcome {
  predictionId: string;
  playerId: string;
  week: number;
  season: number;
  predictedPoints: number;
  actualPoints: number;
  accuracy: number;
  error: number;
  absoluteError: number;
  factors: {
    matchup: number;
    weather: number;
    injury: number;
    form: number;
    gameScript: number;
  };
  modelWeights: Record<string, number>;
  timestamp: Date;
}

export interface ModelPerformance {
  modelName: string;
  totalPredictions: number;
  averageAccuracy: number;
  averageError: number;
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  lastUpdated: Date;
  performanceByPosition: Record<string, {
    accuracy: number;
    predictions: number;
    error: number;
  }>;
  performanceByWeek: Record<number, {
    accuracy: number;
    predictions: number;
    error: number;
  }>;
  confidenceCalibration: Array<{
    confidenceRange: string;
    accuracy: number;
    count: number;
  }>;
}

export interface LearningInsight {
  type: 'factor_importance' | 'model_bias' | 'position_accuracy' | 'temporal_pattern';
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  supportingData: any;
  discoveredAt: Date;
}

export interface AdaptiveWeights {
  playerId?: string;
  position?: string;
  modelWeights: Record<string, number>;
  factorWeights: Record<string, number>;
  lastUpdated: Date;
  learningRate: number;
  confidenceAdjustment: number;
}

class AdaptiveLearningSystem {
  private performanceCache = new Map<string, ModelPerformance>();
  private learningInsights: LearningInsight[] = [];
  private adaptiveWeights = new Map<string, AdaptiveWeights>();
  private readonly LEARNING_RATE = 0.1;
  private readonly MIN_SAMPLES = 10;
  private readonly CACHE_TTL = 3600000; // 1 hour

  // Record a prediction outcome for learning
  async recordPredictionOutcome(
    predictionId: string,
    playerId: string,
    week: number,
    season: number,
    predictedPoints: number,
    actualPoints: number,
    factors: any,
    modelWeights: Record<string, number>
  ): Promise<void> {
    try {
      // Calculate accuracy metrics
      const error = actualPoints - predictedPoints;
      const absoluteError = Math.abs(error);
      const accuracy = Math.max(0, 1 - (absoluteError / Math.max(actualPoints, 1)));

      const outcome: PredictionOutcome = {
        predictionId,
        playerId,
        week,
        season,
        predictedPoints,
        actualPoints,
        accuracy,
        error,
        absoluteError,
        factors,
        modelWeights,
        timestamp: new Date()
      };

      // Store outcome in database
      await this.storePredictionOutcome(outcome);

      // Update model performance metrics
      await this.updateModelPerformance(outcome);

      // Learn from the outcome
      await this.learnFromOutcome(outcome);

      // Update adaptive weights
      await this.updateAdaptiveWeights(outcome);

      console.log(`📊 Recorded prediction outcome for ${playerId}: ${accuracy.toFixed(2)} accuracy`);
    } catch (error) {
      console.error('Error recording prediction outcome:', error);
    }
  }

  // Get model performance analytics
  async getModelPerformance(
    modelName?: string,
    position?: string,
    timeframe: 'week' | 'month' | 'season' = 'month'
  ): Promise<ModelPerformance[]> {
    try {
      const cacheKey = `performance_${modelName || 'all'}_${position || 'all'}_${timeframe}`;
      const cached = this.performanceCache.get(cacheKey);
      
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_TTL) {
        return [cached];
      }

      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'season':
          startDate.setMonth(0, 1); // Start of year
          break;
      }

      // Query prediction outcomes
      let query = `
        SELECT 
          po.*,
          np.position
        FROM prediction_outcomes po
        JOIN nfl_players np ON po.player_id = np.id
        WHERE po.timestamp >= $1 AND po.timestamp <= $2
      `;
      
      const params: any[] = [startDate, endDate];
      
      if (position) {
        query += ` AND np.position = $${params.length + 1}`;
        params.push(position);
      }

      const result = await database.query(query, params);
      const outcomes = result.rows;

      if (outcomes.length === 0) {
        return [];
      }

      // Calculate performance metrics
      const performance = this.calculateModelPerformance(outcomes, modelName);
      
      // Cache the result
      this.performanceCache.set(cacheKey, performance);
      
      return [performance];
    } catch (error) {
      console.error('Error getting model performance:', error);
      return [];
    }
  }

  // Get learning insights
  async getLearningInsights(
    category?: 'factor_importance' | 'model_bias' | 'position_accuracy' | 'temporal_pattern'
  ): Promise<LearningInsight[]> {
    let insights = this.learningInsights;
    
    if (category) {
      insights = insights.filter(insight => insight.type === category);
    }
    
    return insights
      .sort((a, b) => b.discoveredAt.getTime() - a.discoveredAt.getTime())
      .slice(0, 20); // Return top 20 insights
  }

  // Get adaptive weights for improved predictions
  async getAdaptiveWeights(
    playerId?: string,
    position?: string
  ): Promise<AdaptiveWeights | null> {
    // Try player-specific weights first
    if (playerId) {
      const playerWeights = this.adaptiveWeights.get(`player_${playerId}`);
      if (playerWeights) return playerWeights;
    }
    
    // Fall back to position-specific weights
    if (position) {
      const positionWeights = this.adaptiveWeights.get(`position_${position}`);
      if (positionWeights) return positionWeights;
    }
    
    // Return global weights if no specific weights found
    return this.adaptiveWeights.get('global') || null;
  }

  // Generate enhanced predictions using learned weights
  async generateEnhancedPrediction(
    playerId: string,
    week: number
  ): Promise<PlayerPrediction> {
    try {
      // Get base prediction from AI engine
      const basePrediction = await aiPredictionEngine.generatePlayerPrediction(playerId, week);
      
      // Get adaptive weights
      const playerData = await this.getPlayerData(playerId);
      const weights = await this.getAdaptiveWeights(playerId, playerData.position);
      
      if (!weights) {
        return basePrediction; // No adaptive learning yet
      }
      
      // Apply learned adjustments
      const adjustedPrediction = this.applyAdaptiveAdjustments(basePrediction, weights);
      
      return adjustedPrediction;
    } catch (error) {
      console.error('Error generating enhanced prediction:', error);
      return aiPredictionEngine.generatePlayerPrediction(playerId, week);
    }
  }

  // Private helper methods
  private async storePredictionOutcome(outcome: PredictionOutcome): Promise<void> {
    try {
      await database.query(`
        INSERT INTO prediction_outcomes (
          prediction_id, player_id, week, season, predicted_points,
          actual_points, accuracy, error, absolute_error,
          factors, model_weights, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        outcome.predictionId,
        outcome.playerId,
        outcome.week,
        outcome.season,
        outcome.predictedPoints,
        outcome.actualPoints,
        outcome.accuracy,
        outcome.error,
        outcome.absoluteError,
        JSON.stringify(outcome.factors),
        JSON.stringify(outcome.modelWeights),
        outcome.timestamp
      ]);
    } catch (error) {
      console.error('Error storing prediction outcome:', error);
    }
  }

  private calculateModelPerformance(
    outcomes: any[],
    modelName?: string
  ): ModelPerformance {
    if (outcomes.length === 0) {
      throw new Error('No outcomes to calculate performance from');
    }

    // Calculate overall metrics
    const totalPredictions = outcomes.length;
    const averageAccuracy = outcomes.reduce((sum, o) => sum + parseFloat(o.accuracy), 0) / totalPredictions;
    const averageError = outcomes.reduce((sum, o) => sum + parseFloat(o.error), 0) / totalPredictions;
    
    // Calculate MAPE (Mean Absolute Percentage Error)
    const mape = outcomes.reduce((sum, o) => {
      const actual = parseFloat(o.actual_points);
      const absoluteError = parseFloat(o.absolute_error);
      return sum + (actual > 0 ? (absoluteError / actual) : 0);
    }, 0) / totalPredictions;
    
    // Calculate RMSE (Root Mean Square Error)
    const rmse = Math.sqrt(
      outcomes.reduce((sum, o) => sum + Math.pow(parseFloat(o.error), 2), 0) / totalPredictions
    );

    // Performance by position
    const positionGroups = outcomes.reduce((groups, o) => {
      const pos = o.position;
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(o);
      return groups;
    }, {} as Record<string, any[]>);

    const performanceByPosition: Record<string, any> = {};
    Object.entries(positionGroups).forEach(([position, posOutcomes]) => {
      const outcomes = posOutcomes as any[];
      performanceByPosition[position] = {
        accuracy: outcomes.reduce((sum, o) => sum + parseFloat(o.accuracy), 0) / outcomes.length,
        predictions: outcomes.length,
        error: outcomes.reduce((sum, o) => sum + parseFloat(o.error), 0) / outcomes.length
      };
    });

    // Performance by week
    const weekGroups = outcomes.reduce((groups, o) => {
      const week = o.week;
      if (!groups[week]) groups[week] = [];
      groups[week].push(o);
      return groups;
    }, {} as Record<number, any[]>);

    const performanceByWeek: Record<number, any> = {};
    Object.entries(weekGroups).forEach(([week, weekOutcomes]) => {
      const outcomes = weekOutcomes as any[];
      performanceByWeek[parseInt(week)] = {
        accuracy: outcomes.reduce((sum, o) => sum + parseFloat(o.accuracy), 0) / outcomes.length,
        predictions: outcomes.length,
        error: outcomes.reduce((sum, o) => sum + parseFloat(o.error), 0) / outcomes.length
      };
    });

    // Confidence calibration
    const confidenceRanges = [
      { min: 0, max: 20, label: '0-20%' },
      { min: 20, max: 40, label: '20-40%' },
      { min: 40, max: 60, label: '40-60%' },
      { min: 60, max: 80, label: '60-80%' },
      { min: 80, max: 100, label: '80-100%' }
    ];

    const confidenceCalibration = confidenceRanges.map(range => {
      const rangeOutcomes = outcomes.filter(o => {
        const confidence = parseFloat(o.confidence || '70');
        return confidence >= range.min && confidence < range.max;
      });

      return {
        confidenceRange: range.label,
        accuracy: rangeOutcomes.length > 0 
          ? rangeOutcomes.reduce((sum, o) => sum + parseFloat(o.accuracy), 0) / rangeOutcomes.length
          : 0,
        count: rangeOutcomes.length
      };
    });

    return {
      modelName: modelName || 'ensemble',
      totalPredictions,
      averageAccuracy,
      averageError,
      mape,
      rmse,
      lastUpdated: new Date(),
      performanceByPosition,
      performanceByWeek,
      confidenceCalibration
    };
  }

  private async updateModelPerformance(outcome: PredictionOutcome): Promise<void> {
    // Update individual model performance metrics
    Object.entries(outcome.modelWeights).forEach(([modelName, weight]) => {
      if (weight > 0) {
        // This model contributed to the prediction
        this.updateModelMetrics(modelName, outcome, weight);
      }
    });
  }

  private updateModelMetrics(modelName: string, outcome: PredictionOutcome, weight: number): void {
    // Implementation would update running averages for model performance
    // For now, just log the update
    console.log(`Updated metrics for ${modelName}: accuracy ${outcome.accuracy.toFixed(2)}`);
  }

  private async learnFromOutcome(outcome: PredictionOutcome): Promise<void> {
    // Identify learning opportunities
    await this.identifyFactorImportance(outcome);
    await this.detectModelBias(outcome);
    await this.analyzePositionAccuracy(outcome);
    await this.findTemporalPatterns(outcome);
  }

  private async identifyFactorImportance(outcome: PredictionOutcome): Promise<void> {
    // Analyze which factors led to good/bad predictions
    const factorAccuracies: Record<string, number> = {};
    
    Object.entries(outcome.factors).forEach(([factor, value]) => {
      // Correlate factor strength with prediction accuracy
      const correlationScore = this.calculateFactorCorrelation(factor, value, outcome.accuracy);
      factorAccuracies[factor] = correlationScore;
    });

    // Generate insights for significantly important factors
    Object.entries(factorAccuracies).forEach(([factor, score]) => {
      if (Math.abs(score) > 0.3) { // Significant correlation
        this.learningInsights.push({
          type: 'factor_importance',
          description: `${factor} shows ${score > 0 ? 'positive' : 'negative'} correlation with prediction accuracy`,
          impact: Math.abs(score) > 0.6 ? 'high' : Math.abs(score) > 0.4 ? 'medium' : 'low',
          recommendation: score > 0 
            ? `Increase weight of ${factor} in future predictions`
            : `Reduce weight of ${factor} or improve its calculation`,
          supportingData: { factor, score, outcome: outcome.predictionId },
          discoveredAt: new Date()
        });
      }
    });
  }

  private calculateFactorCorrelation(factor: string, value: number, accuracy: number): number {
    // Simplified correlation calculation
    // In a full implementation, this would use historical data
    return (value - 0.5) * (accuracy - 0.5) * 2;
  }

  private async detectModelBias(outcome: PredictionOutcome): Promise<void> {
    // Check for systematic over/under predictions
    if (Math.abs(outcome.error) > 5) { // Significant error
      const biasDirection = outcome.error > 0 ? 'under' : 'over';
      
      this.learningInsights.push({
        type: 'model_bias',
        description: `Model shows ${biasDirection}-prediction bias for this outcome`,
        impact: 'medium',
        recommendation: `Adjust base prediction weights to reduce ${biasDirection}-prediction tendency`,
        supportingData: { 
          error: outcome.error, 
          playerId: outcome.playerId, 
          week: outcome.week 
        },
        discoveredAt: new Date()
      });
    }
  }

  private async analyzePositionAccuracy(outcome: PredictionOutcome): Promise<void> {
    const playerData = await this.getPlayerData(outcome.playerId);
    
    if (outcome.accuracy < 0.6) { // Poor accuracy
      this.learningInsights.push({
        type: 'position_accuracy',
        description: `Low accuracy prediction for ${playerData.position} position`,
        impact: 'medium',
        recommendation: `Review ${playerData.position}-specific prediction factors and weights`,
        supportingData: { 
          position: playerData.position, 
          accuracy: outcome.accuracy,
          playerId: outcome.playerId
        },
        discoveredAt: new Date()
      });
    }
  }

  private async findTemporalPatterns(outcome: PredictionOutcome): Promise<void> {
    // Analyze week-specific patterns
    if (outcome.week <= 3 && outcome.accuracy < 0.5) {
      this.learningInsights.push({
        type: 'temporal_pattern',
        description: `Poor accuracy in early season (Week ${outcome.week})`,
        impact: 'low',
        recommendation: 'Consider different weighting for early season predictions',
        supportingData: { week: outcome.week, accuracy: outcome.accuracy },
        discoveredAt: new Date()
      });
    }
  }

  private async updateAdaptiveWeights(outcome: PredictionOutcome): Promise<void> {
    const playerData = await this.getPlayerData(outcome.playerId);
    
    // Update player-specific weights
    await this.updatePlayerWeights(outcome, playerData);
    
    // Update position-specific weights
    await this.updatePositionWeights(outcome, playerData.position);
    
    // Update global weights
    await this.updateGlobalWeights(outcome);
  }

  private async updatePlayerWeights(outcome: PredictionOutcome, playerData: any): Promise<void> {
    const key = `player_${outcome.playerId}`;
    let weights = this.adaptiveWeights.get(key);
    
    if (!weights) {
      weights = {
        playerId: outcome.playerId,
        modelWeights: { ...outcome.modelWeights },
        factorWeights: { ...outcome.factors },
        lastUpdated: new Date(),
        learningRate: this.LEARNING_RATE,
        confidenceAdjustment: 1.0
      };
    }
    
    // Apply learning rate adjustment based on prediction accuracy
    const learningMultiplier = outcome.accuracy > 0.8 ? 1.1 : outcome.accuracy < 0.4 ? 0.9 : 1.0;
    
    Object.entries(outcome.modelWeights).forEach(([model, weight]) => {
      weights!.modelWeights[model] = (weights!.modelWeights[model] || 0.25) * learningMultiplier;
    });
    
    Object.entries(outcome.factors).forEach(([factor, value]) => {
      const adjustment = (outcome.accuracy - 0.5) * this.LEARNING_RATE;
      weights!.factorWeights[factor] = Math.max(0.1, Math.min(1.0, 
        (weights!.factorWeights[factor] || 0.5) + adjustment
      ));
    });
    
    weights.lastUpdated = new Date();
    this.adaptiveWeights.set(key, weights);
  }

  private async updatePositionWeights(outcome: PredictionOutcome, position: string): Promise<void> {
    const key = `position_${position}`;
    let weights = this.adaptiveWeights.get(key);
    
    if (!weights) {
      weights = {
        position,
        modelWeights: { ...outcome.modelWeights },
        factorWeights: { ...outcome.factors },
        lastUpdated: new Date(),
        learningRate: this.LEARNING_RATE * 0.5, // Slower learning for position weights
        confidenceAdjustment: 1.0
      };
    }
    
    // Similar weight updates but with reduced learning rate
    const positionLearningRate = this.LEARNING_RATE * 0.3;
    const adjustment = (outcome.accuracy - 0.5) * positionLearningRate;
    
    Object.entries(outcome.factors).forEach(([factor, value]) => {
      weights!.factorWeights[factor] = Math.max(0.2, Math.min(0.8,
        (weights!.factorWeights[factor] || 0.5) + adjustment
      ));
    });
    
    weights.lastUpdated = new Date();
    this.adaptiveWeights.set(key, weights);
  }

  private async updateGlobalWeights(outcome: PredictionOutcome): Promise<void> {
    const key = 'global';
    let weights = this.adaptiveWeights.get(key);
    
    if (!weights) {
      weights = {
        modelWeights: { openai: 0.3, anthropic: 0.25, gemini: 0.25, deepseek: 0.2 },
        factorWeights: { matchup: 0.3, weather: 0.1, injury: 0.2, form: 0.25, gameScript: 0.15 },
        lastUpdated: new Date(),
        learningRate: this.LEARNING_RATE * 0.1, // Very slow global learning
        confidenceAdjustment: 1.0
      };
    }
    
    // Very conservative global weight updates
    const globalLearningRate = this.LEARNING_RATE * 0.05;
    const adjustment = (outcome.accuracy - 0.5) * globalLearningRate;
    
    Object.entries(outcome.factors).forEach(([factor, value]) => {
      weights!.factorWeights[factor] = Math.max(0.05, Math.min(0.5,
        (weights!.factorWeights[factor] || 0.2) + adjustment
      ));
    });
    
    weights.lastUpdated = new Date();
    this.adaptiveWeights.set(key, weights);
  }

  private applyAdaptiveAdjustments(
    basePrediction: PlayerPrediction,
    weights: AdaptiveWeights
  ): PlayerPrediction {
    // Apply learned factor weight adjustments
    const adjustedFactors = { ...basePrediction.factors };
    
    Object.entries(weights.factorWeights).forEach(([factor, weight]) => {
      if (adjustedFactors[factor as keyof typeof adjustedFactors] !== undefined) {
        adjustedFactors[factor as keyof typeof adjustedFactors] *= weight;
      }
    });
    
    // Adjust confidence based on historical performance
    const adjustedConfidence = Math.round(basePrediction.confidence * weights.confidenceAdjustment);
    
    // Apply small adjustments to projected points based on learned biases
    const biasAdjustment = this.calculateBiasAdjustment(basePrediction, weights);
    const adjustedPoints = Math.max(0, basePrediction.projectedPoints + biasAdjustment);
    
    return {
      ...basePrediction,
      projectedPoints: Math.round(adjustedPoints * 10) / 10,
      confidence: Math.max(1, Math.min(100, adjustedConfidence)),
      factors: adjustedFactors
    };
  }

  private calculateBiasAdjustment(prediction: PlayerPrediction, weights: AdaptiveWeights): number {
    // Small adjustment based on learned biases (typically -2 to +2 points)
    const confidenceFactor = (weights.confidenceAdjustment - 1.0) * 0.1;
    const baseBias = prediction.projectedPoints * confidenceFactor;
    
    return Math.max(-3, Math.min(3, baseBias));
  }

  private async getPlayerData(playerId: string): Promise<any> {
    try {
      const result = await database.query(`
        SELECT * FROM nfl_players WHERE id = $1
      `, [playerId]);
      
      return result.rows[0] || {};
    } catch (error) {
      console.error('Error getting player data:', error);
      return {};
    }
  }

  // Health check and diagnostics
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    totalOutcomes: number;
    learningInsights: number;
    adaptiveWeights: number;
    averageAccuracy: number | null;
  }> {
    try {
      // Get recent outcomes count
      const outcomesResult = await database.query(`
        SELECT COUNT(*) as count, AVG(accuracy) as avg_accuracy
        FROM prediction_outcomes 
        WHERE timestamp >= NOW() - INTERVAL '30 days'
      `);
      
      const totalOutcomes = parseInt(outcomesResult.rows[0]?.count || '0');
      const averageAccuracy = parseFloat(outcomesResult.rows[0]?.avg_accuracy || '0');
      
      return {
        status: totalOutcomes > this.MIN_SAMPLES ? 'healthy' : 'degraded',
        totalOutcomes,
        learningInsights: this.learningInsights.length,
        adaptiveWeights: this.adaptiveWeights.size,
        averageAccuracy: totalOutcomes > 0 ? averageAccuracy : null
      };
    } catch (error) {
      console.error('Error in health check:', error);
      return {
        status: 'unhealthy',
        totalOutcomes: 0,
        learningInsights: this.learningInsights.length,
        adaptiveWeights: this.adaptiveWeights.size,
        averageAccuracy: null
      };
    }
  }
}

// Singleton instance
export const adaptiveLearningSystem = new AdaptiveLearningSystem();
export default adaptiveLearningSystem;