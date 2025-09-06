import { AIProvider } from '@/types/ai';
import { Player, Team, GameData, WeatherData } from '@/types/fantasy';

interface RegressionModel {
  id: string;
  name: string;
  type: 'linear' | 'polynomial' | 'ridge' | 'lasso' | 'elastic_net' | 'random_forest' | 'gradient_boosting';
  features: string[];
  target: string;
  coefficients?: Record<string, number>;
  performance: {
    r2: number;
    mse: number;
    mae: number;
    crossValidationScore: number;
  };
  createdAt: Date;
  lastTrained: Date;
}

interface TimeSeriesModel {
  id: string;
  name: string;
  type: 'arima' | 'sarima' | 'lstm' | 'prophet' | 'exponential_smoothing';
  seasonality: 'none' | 'weekly' | 'seasonal' | 'both';
  forecastHorizon: number;
  performance: {
    mape: number;
    rmse: number;
    mae: number;
    directionalAccuracy: number;
  };
  parameters: Record<string, any>;
  createdAt: Date;
  lastTrained: Date;
}

interface StatisticalAnalysis {
  correlationMatrix: Record<string, Record<string, number>>;
  principalComponents: {
    component: number;
    varianceExplained: number;
    loadings: Record<string, number>;
  }[];
  clustersAnalysis: {
    clusterId: number;
    centeroid: Record<string, number>;
    members: string[];
    characteristics: string[];
  }[];
  outlierDetection: {
    playerId: string;
    outlierScore: number;
    reasons: string[];
  }[];
}

interface PredictiveInsight {
  type: 'trend' | 'anomaly' | 'correlation' | 'forecast' | 'risk_assessment';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timeframe: string;
  data: Record<string, any>;
  recommendations: string[];
}

export class StatisticalModelingService {
  private regressionModels: Map<string, RegressionModel> = new Map();
  private timeSeriesModels: Map<string, TimeSeriesModel> = new Map();
  private modelCache: Map<string, any> = new Map();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_DATA_SIZE = 10000;
  private readonly ALLOWED_FEATURES = ['passing_yards', 'rushing_yards', 'receiving_yards', 'touchdowns', 'targets', 'completions', 'attempts', 'receptions'];

  private sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input.replace(/[<>"'&]/g, '').substring(0, 1000);
    }
    if (typeof input === 'number') {
      // Ensure number is finite and within reasonable bounds
      if (!Number.isFinite(input) || Math.abs(input) > 1000000) {
        throw new Error('Invalid number value');
      }
      return input;
    }
    if (Array.isArray(input)) {
      if (input.length > this.MAX_DATA_SIZE) {
        throw new Error(`Data array too large (max ${this.MAX_DATA_SIZE} items)`);
      }
      return input.map(item => this.sanitizeInput(item));
    }
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        if (typeof key === 'string' && key.length <= 100) {
          sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
        }
      }
      return sanitized;
    }
    return input;
  }

  private validateFeatures(features: string[]): void {
    if (!Array.isArray(features) || features.length === 0) {
      throw new Error('Features must be a non-empty array');
    }
    if (features.length > 50) {
      throw new Error('Too many features (max 50)');
    }
    const invalidFeatures = features.filter(f => !this.ALLOWED_FEATURES.includes(f));
    if (invalidFeatures.length > 0) {
      throw new Error(`Invalid features: ${invalidFeatures.join(', ')}`);
    }
  }

  private manageCacheSize(): void {
    if (this.modelCache.size > this.MAX_CACHE_SIZE) {
      const oldestKey = this.modelCache.keys().next().value;
      this.modelCache.delete(oldestKey);
    }
  }

  async createRegressionModel(config: {
    name: string;
    type: RegressionModel['type'];
    features: string[];
    target: string;
    trainingData: Record<string, any>[];
    validationSplit?: number;
  }): Promise<RegressionModel> {
    try {
      // Input validation and sanitization
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid configuration object');
      }
      
      if (!config.name || typeof config.name !== 'string' || config.name.length > 100) {
        throw new Error('Invalid model name');
      }
      
      if (!config.type || !['linear', 'polynomial', 'ridge', 'lasso', 'elastic_net', 'random_forest', 'gradient_boosting'].includes(config.type)) {
        throw new Error('Invalid model type');
      }
      
      this.validateFeatures(config.features);
      
      if (!config.target || typeof config.target !== 'string' || !this.ALLOWED_FEATURES.includes(config.target)) {
        throw new Error('Invalid target variable');
      }
      
      if (!Array.isArray(config.trainingData) || config.trainingData.length === 0) {
        throw new Error('Training data must be a non-empty array');
      }
      
      if (config.trainingData.length > this.MAX_DATA_SIZE) {
        throw new Error(`Training data too large (max ${this.MAX_DATA_SIZE} samples)`);
      }
      
      const validationSplit = config.validationSplit ?? 0.2;
      if (validationSplit < 0 || validationSplit > 0.5) {
        throw new Error('Validation split must be between 0 and 0.5');
      }
      
      // Sanitize inputs
      const sanitizedConfig = {
        ...config,
        name: this.sanitizeInput(config.name),
        features: config.features.map(f => this.sanitizeInput(f)),
        target: this.sanitizeInput(config.target),
        trainingData: this.sanitizeInput(config.trainingData)
      };
      
      const modelId = `regression_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare training data
      const { trainingSet, validationSet } = this.splitData(
        sanitizedConfig.trainingData, 
        validationSplit
      );

    // Train model based on type
    const trainedModel = await this.trainRegressionModel(
      config.type,
      trainingSet,
      config.features,
      config.target
    );

    // Evaluate model performance
    const performance = await this.evaluateRegressionModel(
      trainedModel,
      validationSet,
      config.features,
      config.target
    );

    const model: RegressionModel = {
      id: modelId,
      name: config.name,
      type: config.type,
      features: config.features,
      target: config.target,
      coefficients: trainedModel.coefficients,
      performance,
      createdAt: new Date(),
      lastTrained: new Date()
    };

    this.regressionModels.set(modelId, model);
    this.modelCache.set(modelId, trainedModel);

      // Store model in database
      await this.saveModelToDatabase(model);

      return model;
    } catch (error) {
      console.error('Error creating regression model:', error);
      throw new Error(`Failed to create regression model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createTimeSeriesModel(config: {
    name: string;
    type: TimeSeriesModel['type'];
    seasonality: TimeSeriesModel['seasonality'];
    forecastHorizon: number;
    timeSeriesData: { timestamp: Date; value: number; features?: Record<string, number> }[];
    parameters?: Record<string, any>;
  }): Promise<TimeSeriesModel> {
    const modelId = `timeseries_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare time series data
    const preparedData = this.prepareTimeSeriesData(config.timeSeriesData, config.seasonality);

    // Train time series model
    const trainedModel = await this.trainTimeSeriesModel(
      config.type,
      preparedData,
      config.seasonality,
      config.forecastHorizon,
      config.parameters || {}
    );

    // Evaluate model performance
    const performance = await this.evaluateTimeSeriesModel(
      trainedModel,
      preparedData,
      config.forecastHorizon
    );

    const model: TimeSeriesModel = {
      id: modelId,
      name: config.name,
      type: config.type,
      seasonality: config.seasonality,
      forecastHorizon: config.forecastHorizon,
      performance,
      parameters: trainedModel.parameters,
      createdAt: new Date(),
      lastTrained: new Date()
    };

    this.timeSeriesModels.set(modelId, model);
    this.modelCache.set(modelId, trainedModel);

      // Store model in database
      await this.saveTimeSeriesModelToDatabase(model);

      return model;
    } catch (error) {
      console.error('Error creating time series model:', error);
      throw new Error(`Failed to create time series model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async performStatisticalAnalysis(data: Record<string, any>[]): Promise<StatisticalAnalysis> {
    try {
      // Input validation
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
      }
      
      if (data.length > this.MAX_DATA_SIZE) {
        throw new Error(`Data too large (max ${this.MAX_DATA_SIZE} samples)`);
      }
      
      // Sanitize data
      const sanitizedData = this.sanitizeInput(data);
      
      // Calculate correlation matrix
      const correlationMatrix = this.calculateCorrelationMatrix(sanitizedData);

    // Perform PCA
    const principalComponents = await this.performPCA(data);

    // Cluster analysis
    const clustersAnalysis = await this.performClusterAnalysis(data);

    // Outlier detection
    const outlierDetection = this.detectOutliers(data);

      return {
        correlationMatrix,
        principalComponents,
        clustersAnalysis,
        outlierDetection
      };
    } catch (error) {
      console.error('Error performing statistical analysis:', error);
      throw new Error(`Statistical analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePredictiveInsights(
    playerId: string,
    contextData: {
      historicalStats: Record<string, number>[];
      upcomingGames: GameData[];
      weather?: WeatherData[];
      injuries: string[];
      teamChanges: string[];
    }
  ): Promise<PredictiveInsight[]> {
    try {
      // Input validation
      if (!playerId || typeof playerId !== 'string' || playerId.length > 50) {
        throw new Error('Invalid player ID');
      }
      
      if (!contextData || typeof contextData !== 'object') {
        throw new Error('Invalid context data');
      }
      
      if (!Array.isArray(contextData.historicalStats)) {
        throw new Error('Historical stats must be an array');
      }
      
      if (contextData.historicalStats.length > 1000) {
        throw new Error('Too much historical data (max 1000 records)');
      }
      
      // Sanitize inputs
      const sanitizedPlayerId = this.sanitizeInput(playerId);
      const sanitizedContextData = this.sanitizeInput(contextData);
      
      const insights: PredictiveInsight[] = [];

    // Trend analysis
    const trendInsight = await this.analyzeTrends(playerId, contextData.historicalStats);
    if (trendInsight) insights.push(trendInsight);

    // Anomaly detection
    const anomalies = await this.detectAnomalies(playerId, contextData.historicalStats);
    insights.push(...anomalies);

    // Performance forecasting
    const forecasts = await this.generateForecasts(playerId, contextData);
    insights.push(...forecasts);

    // Risk assessment
    const riskAssessment = await this.assessRisks(playerId, contextData);
    if (riskAssessment) insights.push(riskAssessment);

    // Correlation insights
    const correlations = await this.findCorrelations(playerId, contextData);
    insights.push(...correlations);

      return insights.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error generating predictive insights:', error);
      throw new Error(`Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private splitData(data: Record<string, any>[], validationSplit: number) {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(data.length * (1 - validationSplit));
    
    return {
      trainingSet: shuffled.slice(0, splitIndex),
      validationSet: shuffled.slice(splitIndex)
    };
  }

  private async trainRegressionModel(
    type: RegressionModel['type'],
    trainingData: Record<string, any>[],
    features: string[],
    target: string
  ) {
    // Extract features and target values
    const X = trainingData.map(row => features.map(feature => row[feature] || 0));
    const y = trainingData.map(row => row[target] || 0);

    switch (type) {
      case 'linear':
        return this.trainLinearRegression(X, y, features);
      case 'polynomial':
        return this.trainPolynomialRegression(X, y, features);
      case 'ridge':
        return this.trainRidgeRegression(X, y, features);
      case 'lasso':
        return this.trainLassoRegression(X, y, features);
      case 'elastic_net':
        return this.trainElasticNetRegression(X, y, features);
      case 'random_forest':
        return this.trainRandomForestRegression(X, y, features);
      case 'gradient_boosting':
        return this.trainGradientBoostingRegression(X, y, features);
      default:
        throw new Error(`Unsupported regression type: ${type}`);
    }
  }

  private async trainLinearRegression(X: number[][], y: number[], features: string[]) {
    // Simple linear regression using normal equation
    // X'X * β = X'y
    const XTranspose = this.transpose(X);
    const XTX = this.multiply(XTranspose, X);
    const XTy = this.multiplyVector(XTranspose, y);
    const coefficients = this.solve(XTX, XTy);

    const coefficientsMap: Record<string, number> = {};
    features.forEach((feature, i) => {
      coefficientsMap[feature] = coefficients[i];
    });

    return {
      type: 'linear',
      coefficients: coefficientsMap,
      predict: (features: number[]) => {
        return features.reduce((sum, feature, i) => sum + feature * coefficients[i], 0);
      }
    };
  }

  private async trainTimeSeriesModel(
    type: TimeSeriesModel['type'],
    data: any[],
    seasonality: TimeSeriesModel['seasonality'],
    forecastHorizon: number,
    parameters: Record<string, any>
  ) {
    switch (type) {
      case 'arima':
        return this.trainARIMA(data, parameters);
      case 'sarima':
        return this.trainSARIMA(data, seasonality, parameters);
      case 'lstm':
        return this.trainLSTM(data, forecastHorizon, parameters);
      case 'prophet':
        return this.trainProphet(data, seasonality, parameters);
      case 'exponential_smoothing':
        return this.trainExponentialSmoothing(data, seasonality, parameters);
      default:
        throw new Error(`Unsupported time series type: ${type}`);
    }
  }

  private async analyzeTrends(playerId: string, historicalStats: Record<string, number>[]): Promise<PredictiveInsight | null> {
    if (historicalStats.length < 5) return null;

    const recentStats = historicalStats.slice(-5);
    const trends: Record<string, { direction: 'up' | 'down' | 'stable'; strength: number }> = {};

    // Analyze trends for each stat
    for (const statKey of Object.keys(recentStats[0])) {
      const values = recentStats.map(stat => stat[statKey]);
      const trend = this.calculateTrend(values);
      trends[statKey] = trend;
    }

    // Find most significant trends
    const significantTrends = Object.entries(trends)
      .filter(([_, trend]) => trend.strength > 0.5)
      .sort(([_, a], [__, b]) => b.strength - a.strength)
      .slice(0, 3);

    if (significantTrends.length === 0) return null;

    const trendDescriptions = significantTrends.map(([stat, trend]) => 
      `${stat} trending ${trend.direction} (strength: ${(trend.strength * 100).toFixed(1)}%)`
    );

    return {
      type: 'trend',
      title: 'Performance Trends Detected',
      description: `Recent performance shows ${trendDescriptions.join(', ')}`,
      confidence: Math.max(...significantTrends.map(([_, trend]) => trend.strength)),
      impact: significantTrends.length > 2 ? 'high' : significantTrends.length > 1 ? 'medium' : 'low',
      timeframe: 'Last 5 games',
      data: { trends, significantTrends },
      recommendations: this.generateTrendRecommendations(significantTrends)
    };
  }

  private calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; strength: number } {
    if (values.length < 2) return { direction: 'stable', strength: 0 };

    // Calculate linear regression slope
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (values[i] - yMean), 0);
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    if (denominator === 0) return { direction: 'stable', strength: 0 };

    const slope = numerator / denominator;
    const correlation = this.calculateCorrelation(x, values);
    
    return {
      direction: slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'stable',
      strength: Math.abs(correlation)
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;

    const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
    const xVariance = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
    const yVariance = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);

    const denominator = Math.sqrt(xVariance * yVariance);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private generateTrendRecommendations(trends: [string, { direction: 'up' | 'down' | 'stable'; strength: number }][]): string[] {
    return trends.map(([stat, trend]) => {
      if (trend.direction === 'up' && trend.strength > 0.7) {
        return `Consider increasing ${stat}-dependent strategies`;
      } else if (trend.direction === 'down' && trend.strength > 0.7) {
        return `Monitor ${stat} decline and consider alternatives`;
      }
      return `Keep tracking ${stat} performance closely`;
    });
  }

  private async detectAnomalies(playerId: string, historicalStats: Record<string, number>[]): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    
    if (historicalStats.length < 10) return insights;

    // Calculate z-scores for each stat
    for (const statKey of Object.keys(historicalStats[0])) {
      const values = historicalStats.map(stat => stat[statKey]);
      const recent = values.slice(-3);
      const historical = values.slice(0, -3);
      
      const historicalMean = historical.reduce((a, b) => a + b, 0) / historical.length;
      const historicalStd = Math.sqrt(
        historical.reduce((sum, val) => sum + Math.pow(val - historicalMean, 2), 0) / historical.length
      );

      const anomalies = recent.filter(val => {
        const zScore = Math.abs(val - historicalMean) / historicalStd;
        return zScore > 2.5; // 99% confidence interval
      });

      if (anomalies.length > 0) {
        insights.push({
          type: 'anomaly',
          title: `${statKey} Anomaly Detected`,
          description: `Recent ${statKey} values are ${anomalies.length > 1 ? 'consistently' : ''} unusual compared to historical performance`,
          confidence: Math.min(0.95, (anomalies.length / recent.length) * 0.8 + 0.15),
          impact: anomalies.length > 1 ? 'high' : 'medium',
          timeframe: 'Last 3 games',
          data: { anomalies, historicalMean, historicalStd },
          recommendations: [`Investigate factors affecting ${statKey}`, `Monitor ${statKey} closely in upcoming games`]
        });
      }
    }

    return insights;
  }

  private async generateForecasts(playerId: string, contextData: any): Promise<PredictiveInsight[]> {
    // This would use trained time series models to generate forecasts
    // For now, return a placeholder
    return [{
      type: 'forecast',
      title: 'Performance Forecast',
      description: 'AI model predicts performance trends for upcoming games',
      confidence: 0.75,
      impact: 'medium',
      timeframe: 'Next 3 games',
      data: { forecast: 'placeholder' },
      recommendations: ['Monitor model predictions', 'Adjust lineup based on forecast']
    }];
  }

  private async assessRisks(playerId: string, contextData: any): Promise<PredictiveInsight | null> {
    const riskFactors: { factor: string; weight: number; description: string }[] = [];

    // Injury risk
    if (contextData.injuries.length > 0) {
      riskFactors.push({
        factor: 'injury_history',
        weight: 0.8,
        description: 'Recent injury concerns'
      });
    }

    // Team changes risk
    if (contextData.teamChanges.length > 0) {
      riskFactors.push({
        factor: 'team_changes',
        weight: 0.6,
        description: 'Recent team roster changes'
      });
    }

    if (riskFactors.length === 0) return null;

    const overallRisk = riskFactors.reduce((sum, factor) => sum + factor.weight, 0) / riskFactors.length;

    return {
      type: 'risk_assessment',
      title: 'Risk Assessment',
      description: `Identified ${riskFactors.length} risk factor(s) affecting performance`,
      confidence: 0.8,
      impact: overallRisk > 0.7 ? 'high' : overallRisk > 0.4 ? 'medium' : 'low',
      timeframe: 'Immediate',
      data: { riskFactors, overallRisk },
      recommendations: riskFactors.map(factor => `Monitor ${factor.factor}: ${factor.description}`)
    };
  }

  private async findCorrelations(playerId: string, contextData: any): Promise<PredictiveInsight[]> {
    // Analyze correlations between different factors and performance
    // For now, return a placeholder
    return [{
      type: 'correlation',
      title: 'Performance Correlations',
      description: 'Strong correlations found between weather conditions and performance',
      confidence: 0.65,
      impact: 'medium',
      timeframe: 'Weather dependent',
      data: { correlations: 'placeholder' },
      recommendations: ['Consider weather conditions in lineup decisions']
    }];
  }

  // Matrix operations helpers
  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  private multiply(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        result[i][j] = 0;
        for (let k = 0; k < a[0].length; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return result;
  }

  private multiplyVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => 
      row.reduce((sum, val, i) => sum + val * vector[i], 0)
    );
  }

  private solve(A: number[][], b: number[]): number[] {
    // Simple Gaussian elimination for small matrices
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }

    // Back substitution
    const x: number[] = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= augmented[i][j] * x[j];
      }
      x[i] /= augmented[i][i];
    }

    return x;
  }

  private calculateCorrelationMatrix(data: Record<string, any>[]): Record<string, Record<string, number>> {
    if (data.length === 0) return {};

    const keys = Object.keys(data[0]);
    const correlations: Record<string, Record<string, number>> = {};

    for (const key1 of keys) {
      correlations[key1] = {};
      for (const key2 of keys) {
        const values1 = data.map(row => row[key1]).filter(val => typeof val === 'number');
        const values2 = data.map(row => row[key2]).filter(val => typeof val === 'number');
        
        if (values1.length > 1 && values2.length > 1) {
          correlations[key1][key2] = this.calculateCorrelation(values1, values2);
        } else {
          correlations[key1][key2] = 0;
        }
      }
    }

    return correlations;
  }

  private async performPCA(data: Record<string, any>[]): Promise<{ component: number; varianceExplained: number; loadings: Record<string, number> }[]> {
    // Placeholder PCA implementation
    return [
      {
        component: 1,
        varianceExplained: 0.45,
        loadings: { rushing_yards: 0.8, touchdowns: 0.7, targets: 0.6 }
      },
      {
        component: 2,
        varianceExplained: 0.25,
        loadings: { passing_yards: 0.8, completions: 0.7, attempts: 0.6 }
      }
    ];
  }

  private async performClusterAnalysis(data: Record<string, any>[]): Promise<{ clusterId: number; centeroid: Record<string, number>; members: string[]; characteristics: string[] }[]> {
    // Placeholder clustering implementation
    return [
      {
        clusterId: 1,
        centeroid: { rushing_yards: 120, touchdowns: 1.2 },
        members: ['player1', 'player2'],
        characteristics: ['High rushing production', 'Consistent red zone touches']
      }
    ];
  }

  private detectOutliers(data: Record<string, any>[]): { playerId: string; outlierScore: number; reasons: string[] }[] {
    // Simple outlier detection using z-scores
    const outliers: { playerId: string; outlierScore: number; reasons: string[] }[] = [];
    
    if (data.length < 3) return outliers;

    const keys = Object.keys(data[0]).filter(key => key !== 'playerId');
    
    for (const row of data) {
      let maxZScore = 0;
      const reasons: string[] = [];
      
      for (const key of keys) {
        if (typeof row[key] === 'number') {
          const values = data.map(r => r[key]).filter(v => typeof v === 'number');
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
          
          if (std > 0) {
            const zScore = Math.abs(row[key] - mean) / std;
            if (zScore > 2.5) {
              maxZScore = Math.max(maxZScore, zScore);
              reasons.push(`Unusual ${key}: ${row[key]} (z-score: ${zScore.toFixed(2)})`);
            }
          }
        }
      }
      
      if (maxZScore > 2.5) {
        outliers.push({
          playerId: row.playerId || row.id || 'unknown',
          outlierScore: maxZScore,
          reasons
        });
      }
    }
    
    return outliers.sort((a, b) => b.outlierScore - a.outlierScore);
  }

  private async trainARIMA(data: any[], parameters: Record<string, any>) {
    // Placeholder ARIMA implementation
    return { type: 'arima', parameters: { p: 1, d: 1, q: 1 } };
  }

  private async trainSARIMA(data: any[], seasonality: any, parameters: Record<string, any>) {
    return { type: 'sarima', parameters: { p: 1, d: 1, q: 1, P: 1, D: 1, Q: 1, s: 12 } };
  }

  private async trainLSTM(data: any[], forecastHorizon: number, parameters: Record<string, any>) {
    return { type: 'lstm', parameters: { units: 50, epochs: 100, batchSize: 32 } };
  }

  private async trainProphet(data: any[], seasonality: any, parameters: Record<string, any>) {
    return { type: 'prophet', parameters: { seasonalityMode: 'multiplicative' } };
  }

  private async trainExponentialSmoothing(data: any[], seasonality: any, parameters: Record<string, any>) {
    return { type: 'exponential_smoothing', parameters: { alpha: 0.3, beta: 0.1, gamma: 0.1 } };
  }

  private prepareTimeSeriesData(data: any[], seasonality: any) {
    // Data preprocessing for time series
    return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private async evaluateRegressionModel(model: any, validationSet: any[], features: string[], target: string) {
    const predictions = validationSet.map(row => {
      const featureValues = features.map(feature => row[feature] || 0);
      return model.predict(featureValues);
    });
    
    const actual = validationSet.map(row => row[target]);
    
    // Calculate metrics
    const mse = predictions.reduce((sum, pred, i) => sum + Math.pow(pred - actual[i], 2), 0) / predictions.length;
    const mae = predictions.reduce((sum, pred, i) => sum + Math.abs(pred - actual[i]), 0) / predictions.length;
    
    const actualMean = actual.reduce((a, b) => a + b, 0) / actual.length;
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = predictions.reduce((sum, pred, i) => sum + Math.pow(actual[i] - pred, 2), 0);
    const r2 = 1 - (residualSumSquares / totalSumSquares);

    return {
      r2,
      mse,
      mae,
      crossValidationScore: r2 // Simplified
    };
  }

  private async evaluateTimeSeriesModel(model: any, data: any[], forecastHorizon: number) {
    // Placeholder time series evaluation
    return {
      mape: 15.2,
      rmse: 8.7,
      mae: 6.1,
      directionalAccuracy: 0.72
    };
  }

  private async saveModelToDatabase(model: RegressionModel) {
    try {
      const response = await fetch('/api/analytics/models/regression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save regression model');
      }
    } catch (error) {
      console.error('Error saving regression model:', error);
    }
  }

  private async saveTimeSeriesModelToDatabase(model: TimeSeriesModel) {
    try {
      const response = await fetch('/api/analytics/models/timeseries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save time series model');
      }
    } catch (error) {
      console.error('Error saving time series model:', error);
    }
  }

  // Additional regression implementations would go here
  private async trainPolynomialRegression(X: number[][], y: number[], features: string[]) {
    // Placeholder polynomial regression
    return this.trainLinearRegression(X, y, features);
  }

  private async trainRidgeRegression(X: number[][], y: number[], features: string[]) {
    // Placeholder ridge regression  
    return this.trainLinearRegression(X, y, features);
  }

  private async trainLassoRegression(X: number[][], y: number[], features: string[]) {
    // Placeholder lasso regression
    return this.trainLinearRegression(X, y, features);
  }

  private async trainElasticNetRegression(X: number[][], y: number[], features: string[]) {
    // Placeholder elastic net regression
    return this.trainLinearRegression(X, y, features);
  }

  private async trainRandomForestRegression(X: number[][], y: number[], features: string[]) {
    // Placeholder random forest regression
    return this.trainLinearRegression(X, y, features);
  }

  private async trainGradientBoostingRegression(X: number[][], y: number[], features: string[]) {
    // Placeholder gradient boosting regression
    return this.trainLinearRegression(X, y, features);
  }
}