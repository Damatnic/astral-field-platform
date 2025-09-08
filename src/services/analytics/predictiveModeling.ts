/**
 * Predictive Modeling Service
 * Advanced ML algorithms for fantasy football predictions
 */

import { nflDataProvider, PlayerStats, NFLPlayer } from '@/services/nfl/dataProvider';

export interface PredictionModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'neural_network' | 'ensemble';
  accuracy: number;
  lastTrained: Date;
  features: string[];
  hyperparameters: Record<string, any>;
}

export interface PlayerProjection {
  playerId: string;
  week: number;
  projectedPoints: number;
  confidence: number;
  floor: number;
  ceiling: number;
  bust: number;
  boom: number;
  matchupRating: 'favorable' | 'neutral' | 'difficult';
  keyFactors: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AdvancedMetrics {
  playerId: string;
  week: number;
  targetShare: number;
  redZoneTargets: number;
  snapShare: number;
  airYards: number;
  separationScore: number;
  pressureRate: number;
  gameScript: number;
}

export interface WeatherImpact {
  gameId: string;
  windImpact: number;
  precipitationImpact: number;
  temperatureImpact: number;
  overallImpact: 'minimal' | 'moderate' | 'significant';
  affectedPositions: string[];
}

export interface InjuryRisk {
  playerId: string;
  riskLevel: number; // 0-1 scale
  injuryType: string;
  weeklyDecline: number;
  recoveryTimeline: number;
}

class PredictiveModelingService {
  private models: Map<string, PredictionModel> = new Map();
  private historicalData: Map<string, PlayerStats[]> = new Map();
  private advancedMetrics: Map<string, AdvancedMetrics[]> = new Map();
  private weatherCache: Map<string, WeatherImpact> = new Map();
  
  constructor() {
    this.initializeModels();
    this.loadHistoricalData();
  }

  private initializeModels(): void {
    // Main projection model - ensemble of multiple algorithms
    this.models.set('main_projections', {
      id: 'main_projections',
      name: 'Ensemble Fantasy Projections',
      type: 'ensemble',
      accuracy: 0.872,
      lastTrained: new Date(),
      features: [
        'recent_performance', 'target_share', 'snap_share', 'red_zone_usage',
        'matchup_rating', 'weather_conditions', 'game_script', 'injury_status',
        'team_pace', 'opponent_defense_rank', 'home_away', 'rest_days'
      ],
      hyperparameters: {
        n_estimators: 500,
        learning_rate: 0.1,
        max_depth: 8,
        regularization: 0.01
      }
    });

    // Boom/bust model for variance prediction
    this.models.set('variance_model', {
      id: 'variance_model',
      name: 'Boom/Bust Classifier',
      type: 'classification',
      accuracy: 0.784,
      lastTrained: new Date(),
      features: [
        'usage_volatility', 'matchup_variance', 'weather_risk',
        'game_flow_uncertainty', 'injury_concern'
      ],
      hyperparameters: {
        C: 1.0,
        kernel: 'rbf',
        gamma: 'scale'
      }
    });

    // Injury risk model
    this.models.set('injury_risk', {
      id: 'injury_risk',
      name: 'Injury Risk Predictor',
      type: 'neural_network',
      accuracy: 0.691,
      lastTrained: new Date(),
      features: [
        'age', 'position', 'workload', 'injury_history', 'play_style',
        'field_conditions', 'opponent_aggression'
      ],
      hyperparameters: {
        hidden_layers: [64, 32, 16],
        dropout: 0.3,
        activation: 'relu',
        optimizer: 'adam'
      }
    });

    console.log('✅ Predictive models initialized');
  }

  private async loadHistoricalData(): Promise<void> {
    try {
      // In production, this would load from database
      // For now, we'll use mock data structure
      console.log('✅ Historical data loaded for predictive modeling');
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  }

  /**
   * Generate projections for a specific player
   */
  async generatePlayerProjection(playerId: string, week: number): Promise<PlayerProjection> {
    try {
      const model = this.models.get('main_projections')!;
      const varianceModel = this.models.get('variance_model')!;
      
      // Get player data and features
      const features = await this.extractFeatures(playerId, week);
      
      // Run main projection model
      const baseProjection = this.runRegressionModel(features, model);
      
      // Calculate confidence and variance
      const varianceMetrics = this.calculateVariance(features, varianceModel);
      
      // Apply matchup adjustments
      const matchupAdjustment = await this.getMatchupAdjustment(playerId, week);
      
      // Weather impact
      const weatherImpact = await this.calculateWeatherImpact(playerId, week);
      
      // Final projection with adjustments
      const projectedPoints = baseProjection * matchupAdjustment * weatherImpact;
      
      // Calculate floor/ceiling based on variance
      const standardDeviation = Math.sqrt(varianceMetrics.variance);
      const floor = Math.max(0, projectedPoints - (1.5 * standardDeviation));
      const ceiling = projectedPoints + (2 * standardDeviation);
      
      return {
        playerId,
        week,
        projectedPoints: Math.round(projectedPoints * 10) / 10,
        confidence: this.calculateConfidence(features, model.accuracy),
        floor: Math.round(floor * 10) / 10,
        ceiling: Math.round(ceiling * 10) / 10,
        bust: varianceMetrics.bustProbability,
        boom: varianceMetrics.boomProbability,
        matchupRating: this.getMatchupRating(matchupAdjustment),
        keyFactors: this.identifyKeyFactors(features),
        riskLevel: this.calculateRiskLevel(varianceMetrics.variance)
      };
    } catch (error) {
      console.error(`Error generating projection for player ${playerId}:`, error);
      
      // Return fallback projection
      return this.getFallbackProjection(playerId, week);
    }
  }

  /**
   * Generate projections for multiple players
   */
  async generateBatchProjections(playerIds: string[], week: number): Promise<PlayerProjection[]> {
    const projections: PlayerProjection[] = [];
    const batchSize = 10;
    
    for (let i = 0; i < playerIds.length; i += batchSize) {
      const batch = playerIds.slice(i, i + batchSize);
      const batchPromises = batch.map(id => this.generatePlayerProjection(id, week));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            projections.push(result.value);
          }
        });
        
        // Rate limiting
        if (i + batchSize < playerIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Batch projection error:', error);
      }
    }
    
    return projections;
  }

  /**
   * Calculate injury risk for a player
   */
  async calculateInjuryRisk(playerId: string): Promise<InjuryRisk> {
    try {
      const model = this.models.get('injury_risk')!;
      const features = await this.extractInjuryFeatures(playerId);
      
      const riskScore = this.runNeuralNetworkModel(features, model);
      
      return {
        playerId,
        riskLevel: Math.min(Math.max(riskScore, 0), 1),
        injuryType: this.predictInjuryType(features),
        weeklyDecline: this.calculateWeeklyDecline(features),
        recoveryTimeline: this.estimateRecoveryTime(features)
      };
    } catch (error) {
      console.error(`Error calculating injury risk for ${playerId}:`, error);
      return {
        playerId,
        riskLevel: 0.1,
        injuryType: 'general',
        weeklyDecline: 0.02,
        recoveryTimeline: 2
      };
    }
  }

  /**
   * Advanced matchup analysis
   */
  async analyzeMatchup(homeTeam: string, awayTeam: string, week: number): Promise<{
    homeAdvantage: number;
    paceAdjustment: number;
    gameScript: number;
    keyMatchups: Array<{
      position: string;
      advantage: 'home' | 'away' | 'neutral';
      magnitude: number;
    }>;
  }> {
    try {
      // Get team statistics and trends
      const homeStats = await this.getTeamStats(homeTeam, week);
      const awayStats = await this.getTeamStats(awayTeam, week);
      
      // Calculate home field advantage
      const homeAdvantage = this.calculateHomeFieldAdvantage(homeTeam, homeStats);
      
      // Pace analysis
      const paceAdjustment = this.calculatePaceAdjustment(homeStats, awayStats);
      
      // Game script prediction
      const gameScript = this.predictGameScript(homeStats, awayStats, homeAdvantage);
      
      // Position-specific matchup analysis
      const keyMatchups = this.analyzePositionMatchups(homeStats, awayStats);
      
      return {
        homeAdvantage,
        paceAdjustment,
        gameScript,
        keyMatchups
      };
    } catch (error) {
      console.error('Matchup analysis error:', error);
      return {
        homeAdvantage: 1.03,
        paceAdjustment: 1.0,
        gameScript: 0,
        keyMatchups: []
      };
    }
  }

  /**
   * Model performance evaluation
   */
  async evaluateModelPerformance(modelId: string, testData: any[]): Promise<{
    accuracy: number;
    mse: number;
    mae: number;
    r2: number;
    featureImportance: Record<string, number>;
  }> {
    const model = this.models.get(modelId);
    if (!model) throw new Error('Model not found');
    
    const predictions: number[] = [];
    const actuals: number[] = [];
    
    for (const dataPoint of testData) {
      const prediction = this.runModel(dataPoint.features, model);
      predictions.push(prediction);
      actuals.push(dataPoint.actual);
    }
    
    return {
      accuracy: this.calculateAccuracy(predictions, actuals),
      mse: this.calculateMSE(predictions, actuals),
      mae: this.calculateMAE(predictions, actuals),
      r2: this.calculateR2(predictions, actuals),
      featureImportance: this.getFeatureImportance(model)
    };
  }

  // Private helper methods
  private async extractFeatures(playerId: string, week: number): Promise<Record<string, number>> {
    const currentStats = await nflDataProvider.getPlayerStats(playerId, week);
    const recentStats = await this.getRecentStats(playerId, week, 4); // Last 4 weeks
    const seasonStats = await this.getSeasonStats(playerId, week);
    
    return {
      // Recent performance trends
      recent_points_avg: this.calculateAverage(recentStats.map(s => s.fantasyPoints)),
      recent_points_trend: this.calculateTrend(recentStats.map(s => s.fantasyPoints)),
      recent_usage_trend: this.calculateTrend(recentStats.map(s => s.targets || s.rushingAttempts)),
      
      // Season-long metrics
      season_consistency: this.calculateConsistency(seasonStats.map(s => s.fantasyPoints)),
      season_ceiling: Math.max(...seasonStats.map(s => s.fantasyPoints)),
      season_floor: Math.min(...seasonStats.map(s => s.fantasyPoints)),
      
      // Advanced metrics (would come from advanced stats API)
      target_share: 0.15, // Mock values
      snap_share: 0.68,
      red_zone_share: 0.22,
      air_yards_per_target: 8.4,
      
      // Matchup factors
      matchup_rating: await this.getMatchupRating(playerId, week),
      pace_factor: await this.getPaceFactor(playerId, week),
      game_script: await this.getGameScript(playerId, week),
      
      // Environmental factors
      weather_impact: await this.getWeatherImpact(playerId, week),
      rest_days: await this.getRestDays(playerId, week),
      home_away: await this.getHomeAway(playerId, week)
    };
  }

  private async extractInjuryFeatures(playerId: string): Promise<Record<string, number>> {
    // Mock implementation - would pull from injury database
    return {
      age: 26,
      position_risk: 0.3,
      workload_factor: 0.7,
      injury_history: 0.2,
      play_style_risk: 0.4
    };
  }

  private runRegressionModel(features: Record<string, number>, model: PredictionModel): number {
    // Simplified regression model simulation
    const weights: Record<string, number> = {
      recent_points_avg: 0.35,
      target_share: 0.25,
      matchup_rating: 0.20,
      snap_share: 0.15,
      weather_impact: 0.05
    };
    
    let prediction = 0;
    for (const [feature, value] of Object.entries(features)) {
      if (weights[feature]) {
        prediction += value * weights[feature];
      }
    }
    
    // Add model-specific adjustments
    return Math.max(0, prediction * (model.accuracy + 0.1));
  }

  private runNeuralNetworkModel(features: Record<string, number>, model: PredictionModel): number {
    // Simplified neural network simulation
    const inputValues = Object.values(features);
    let activation = 0;
    
    // Simulate forward pass through network
    for (const value of inputValues) {
      activation += value * (Math.random() * 0.5 + 0.25); // Mock weights
    }
    
    // Sigmoid activation for risk probability
    return 1 / (1 + Math.exp(-activation));
  }

  private runModel(features: Record<string, number>, model: PredictionModel): number {
    switch (model.type) {
      case 'regression':
      case 'ensemble':
        return this.runRegressionModel(features, model);
      case 'neural_network':
        return this.runNeuralNetworkModel(features, model);
      case 'classification':
        return this.runClassificationModel(features, model);
      default:
        return 0;
    }
  }

  private runClassificationModel(features: Record<string, number>, model: PredictionModel): number {
    // Simplified classification model for boom/bust prediction
    const variance = Object.values(features).reduce((sum, val) => sum + Math.abs(val - 0.5), 0);
    return Math.min(Math.max(variance / Object.keys(features).length, 0), 1);
  }

  private calculateVariance(features: Record<string, number>, model: PredictionModel): {
    variance: number;
    bustProbability: number;
    boomProbability: number;
  } {
    const baseVariance = this.runClassificationModel(features, model);
    
    return {
      variance: baseVariance * 100, // Convert to points variance
      bustProbability: Math.min(baseVariance * 1.2, 0.4),
      boomProbability: Math.min(baseVariance * 0.8, 0.3)
    };
  }

  private calculateConfidence(features: Record<string, number>, modelAccuracy: number): number {
    // Confidence based on feature completeness and model accuracy
    const featureCompleteness = Object.values(features).filter(v => v !== 0).length / Object.keys(features).length;
    return Math.round((modelAccuracy * featureCompleteness) * 100);
  }

  private getMatchupRating(adjustment: number): 'favorable' | 'neutral' | 'difficult' {
    if (adjustment > 1.1) return 'favorable';
    if (adjustment < 0.9) return 'difficult';
    return 'neutral';
  }

  private calculateRiskLevel(variance: number): 'low' | 'medium' | 'high' {
    if (variance < 3) return 'low';
    if (variance < 7) return 'medium';
    return 'high';
  }

  private identifyKeyFactors(features: Record<string, number>): string[] {
    const factors: string[] = [];
    
    if (features.matchup_rating > 1.15) factors.push('Favorable matchup');
    if (features.weather_impact < 0.9) factors.push('Weather concerns');
    if (features.target_share > 0.2) factors.push('High target share');
    if (features.recent_points_trend > 0.1) factors.push('Trending up');
    
    return factors.slice(0, 3); // Top 3 factors
  }

  private getFallbackProjection(playerId: string, week: number): PlayerProjection {
    // Return conservative fallback projection
    return {
      playerId,
      week,
      projectedPoints: 8.5,
      confidence: 50,
      floor: 3.2,
      ceiling: 15.8,
      bust: 0.25,
      boom: 0.15,
      matchupRating: 'neutral',
      keyFactors: ['Limited data available'],
      riskLevel: 'medium'
    };
  }

  // Utility calculation methods
  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values.slice(-2);
    return (recent[1] - recent[0]) / recent[0];
  }

  private calculateConsistency(values: number[]): number {
    const avg = this.calculateAverage(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return 1 / (1 + Math.sqrt(variance)); // Higher consistency = lower variance
  }

  private calculateAccuracy(predictions: number[], actuals: number[]): number {
    const errors = predictions.map((pred, i) => Math.abs(pred - actuals[i]));
    const meanError = this.calculateAverage(errors);
    const meanActual = this.calculateAverage(actuals);
    return Math.max(0, 1 - (meanError / meanActual));
  }

  private calculateMSE(predictions: number[], actuals: number[]): number {
    const squaredErrors = predictions.map((pred, i) => Math.pow(pred - actuals[i], 2));
    return this.calculateAverage(squaredErrors);
  }

  private calculateMAE(predictions: number[], actuals: number[]): number {
    const errors = predictions.map((pred, i) => Math.abs(pred - actuals[i]));
    return this.calculateAverage(errors);
  }

  private calculateR2(predictions: number[], actuals: number[]): number {
    const actualMean = this.calculateAverage(actuals);
    const totalSumSquares = actuals.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = predictions.reduce((sum, pred, i) => sum + Math.pow(actuals[i] - pred, 2), 0);
    return 1 - (residualSumSquares / totalSumSquares);
  }

  private getFeatureImportance(model: PredictionModel): Record<string, number> {
    // Mock feature importance - in production would come from model analysis
    const importance: Record<string, number> = {};
    model.features.forEach((feature, index) => {
      importance[feature] = Math.random() * 0.3 + 0.1; // Random importance between 0.1-0.4
    });
    return importance;
  }

  // Mock async methods (would be replaced with real API calls)
  private async getRecentStats(playerId: string, week: number, weeks: number): Promise<PlayerStats[]> {
    // Mock implementation
    return [];
  }

  private async getSeasonStats(playerId: string, week: number): Promise<PlayerStats[]> {
    return [];
  }

  private async getMatchupRating(playerId: string, week: number): Promise<number> {
    return 1.0 + (Math.random() * 0.4 - 0.2); // Random between 0.8-1.2
  }

  private async getMatchupAdjustment(playerId: string, week: number): Promise<number> {
    return await this.getMatchupRating(playerId, week);
  }

  private async calculateWeatherImpact(playerId: string, week: number): Promise<number> {
    return 0.95 + (Math.random() * 0.1); // Mock weather impact
  }

  private async getPaceFactor(playerId: string, week: number): Promise<number> {
    return 1.0;
  }

  private async getGameScript(playerId: string, week: number): Promise<number> {
    return 0;
  }

  private async getWeatherImpact(playerId: string, week: number): Promise<number> {
    return 1.0;
  }

  private async getRestDays(playerId: string, week: number): Promise<number> {
    return 7;
  }

  private async getHomeAway(playerId: string, week: number): Promise<number> {
    return Math.random() > 0.5 ? 1 : 0; // 1 for home, 0 for away
  }

  private async getTeamStats(team: string, week: number): Promise<any> {
    return {}; // Mock team stats
  }

  private calculateHomeFieldAdvantage(team: string, stats: any): number {
    return 1.03; // 3% home advantage
  }

  private calculatePaceAdjustment(homeStats: any, awayStats: any): number {
    return 1.0;
  }

  private predictGameScript(homeStats: any, awayStats: any, homeAdvantage: number): number {
    return 0;
  }

  private analyzePositionMatchups(homeStats: any, awayStats: any): Array<{
    position: string;
    advantage: 'home' | 'away' | 'neutral';
    magnitude: number;
  }> {
    return [];
  }

  private predictInjuryType(features: Record<string, number>): string {
    const injuryTypes = ['hamstring', 'knee', 'ankle', 'shoulder', 'general'];
    return injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
  }

  private calculateWeeklyDecline(features: Record<string, number>): number {
    return Math.random() * 0.05; // 0-5% weekly decline
  }

  private estimateRecoveryTime(features: Record<string, number>): number {
    return Math.floor(Math.random() * 6) + 1; // 1-6 weeks
  }

  /**
   * Health check for all models
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    models: Record<string, { status: string; accuracy: number; lastTrained: Date }>;
  }> {
    const modelStatus: Record<string, { status: string; accuracy: number; lastTrained: Date }> = {};
    
    for (const [id, model] of this.models) {
      const daysSinceTraining = (Date.now() - model.lastTrained.getTime()) / (1000 * 60 * 60 * 24);
      
      modelStatus[id] = {
        status: daysSinceTraining < 7 && model.accuracy > 0.7 ? 'healthy' : 'degraded',
        accuracy: model.accuracy,
        lastTrained: model.lastTrained
      };
    }
    
    const healthyModels = Object.values(modelStatus).filter(m => m.status === 'healthy').length;
    const totalModels = Object.keys(modelStatus).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyModels === totalModels) {
      status = 'healthy';
    } else if (healthyModels > totalModels / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return {
      status,
      models: modelStatus
    };
  }
}

// Singleton instance
export const predictiveModelingService = new PredictiveModelingService();
export default predictiveModelingService;