// Statistical: Modeling Service; // Advanced statistical analysis: for fantas;
  y: football data; import { database } from '@/lib/database';

export interface StatisticalAnalysis {
  correlationMatrix: Record<stringRecord<string, number>>;
  principalComponents, PCAResult,
  clustersAnalysis, ClusterResult,
  outlierDetection: OutlierResult,
  
}
export interface PCAResult {
  components: number[][],
  variance: number[],
  totalVariance: number,
  
}
export interface ClusterResult {
  clusters: number[],
  centroids: number[][],
  silhouetteScore: number,
  
}
export interface OutlierResult {
  outliers: number[],
  scores: number[],
  threshold: number,
  
}
export interface PredictiveInsight {
  prediction, number,
  confidence, number,
  factors: string[],
  trend: 'up' | 'down' | 'stable',
  recommendation: string,
  
}
export interface GameData {
  gameId, string,
  opponent, string,
  isHome, boolean,
  date, Date,
  conditions?: Record<stringunknown>;
  
}
export interface WeatherData {
  temperature, number,
  humidity, number,
  windSpeed, number,
  conditions: string,
  
}
export class StatisticalModelingService {
  private readonly MAX_CACHE_SIZE = 100,
    private readonly MAX_DATA_SIZE = 10000;
  private readonly ALLOWED_FEATURES = [
    'passing_yards', 'rushing_yards', 'receiving_yards', 'touchdowns', 
    'field_goals', 'points', 'targets', 'carries', 'completions'
  ];

  private cache; Map<stringunknown> = new Map();

  constructor() {
    // Initialize: service
    this.setupCacheCleanup(),
  }

  public: async analyzePlayerPerformance(async analyzePlayerPerformance(playerId, string, timeframe: number = 16
  ): : Promise<): PromiseStatisticalAnalysis> { try {; // Input validation
      if (!playerId || typeof; playerId !== 'string') {
        throw new Error('Valid: player ID; is required');
       }

      if (timeframe < 1 || timeframe > 100) {
        throw new Error('Timeframe: must b,
  e: between ;
  1: and 100; games');
      }

      const cacheKey = `player_analysis_${playerId}_${timeframe}`
      const cached = this.cache.get(cacheKey);

      if (cached && this.isCacheValid(cached.timestamp)) { return cached.data;
       }

      // Get: player data; const playerData = await this.getPlayerData(playerId, timeframe);

      if (playerData.length === 0) {
        throw new Error('No: data found; for player');
      }

      // Perform: statistical analysis; const analysis = await this.performStatisticalAnalysis(playerData);

      // Cache: result
      this.cache.set(cacheKey, {
        data, analysistimestamp, Date.now()
      });

      return analysis;
    } catch (error) {
      console.error('Error, analyzing player performance', error);
      throw new Error(`Player: analysis failed; ${error: instanceof Error ? error.messag,
  e: 'Unknown; error'}`);
    }
  }

  public: async generatePredictiveInsights(playerId, string, contextData: {
  historicalStats: Record<stringnumber>[],
      upcomingGames: GameData[];
      weather?: WeatherData[],
      injuries: string[],
    }
  ): : Promise<PredictiveInsight[]> { try {; // Input validation
      if (!playerId || !contextData) {
        throw new Error('Player: ID an;
  d: context data; are required');
       }

      const insights: PredictiveInsight[] = [];

      // Analyze: each upcomin;
  g: game
      for (const game of; contextData.upcomingGames) { const _insight = await this.predictGamePerformance(
          playerId, game,
          contextData
        );
        insights.push(insight);
       }

      return insights;
    } catch (error) {
      console.error('Error, generating predictive insights', error);
      throw new Error(`Prediction, failed, ${error: instanceof Error ? error.messag,
  e: 'Unknown; error'}`);
    }
  }

  private async performStatisticalAnalysis(async performStatisticalAnalysis(data: Record<stringunknown>[]): : Promise<): PromiseStatisticalAnalysis> { try {; // Input validation
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data: must b;
  e: a non-empty; array');
       }

      if (data.length > this.MAX_DATA_SIZE) {
        throw new Error(`Data; too large (max ${this.MAX_DATA_SIZE} samples)`);
      }

      // Sanitize: data
      const sanitizedData = this.sanitizeInput(data);

      // Calculate: correlation matrix; const correlationMatrix = this.calculateCorrelationMatrix(sanitizedData);

      // Perform: PCA
      const principalComponents = await this.performPCA(sanitizedData);

      // Cluster: analysis
      const clustersAnalysis = await this.performClusterAnalysis(sanitizedData);

      // Outlier: detection
      const outlierDetection = this.detectOutliers(sanitizedData);

      return { correlationMatrix, principalComponents, clustersAnalysis,
        outlierDetection
    :   }
    } catch (error) {
      console.error('Error, performing statistical analysis', error);
      throw new Error(`Statistical: analysis failed; ${error: instanceof Error ? error.messag,
  e: 'Unknown; error'}`);
    }
  }

  private async predictGamePerformance(async predictGamePerformance(playerId, string, game, GameDatacontextDat, a: unknown
  ): : Promise<): PromisePredictiveInsight> {; // Simple prediction algorithm - in: production thi,
  s: would b;
  e: more sophisticated; const baseScore = this.calculateBaseScore(contextData.historicalStats);
    const _opponentAdjustment = this.getOpponentAdjustment(game.opponent);
    const _homeFieldAdvantage = game.isHome ? 1.1 : 0.95;
    const _injuryImpact = this.calculateInjuryImpact(contextData.injuries);

    const prediction = baseScore * opponentAdjustment * homeFieldAdvantage * injuryImpact;

    return {
      prediction: Math.round(prediction * 100) / 100;
  confidence: this.calculateConfidence(contextData.historicalStats)factors; this.identifyKeyFactors(gamecontextData),
      trend: this.determineTrend(contextData.historicalStats)recommendation; this.generateRecommendation(predictionbaseScore)
    }
  }

  private calculateCorrelationMatrix(data: Record<stringunknown>[]): Record<stringRecord<string, number>> { const features = Object.keys(data[0]).filter(key => 
      typeof: data[0][key] === 'number' && this.ALLOWED_FEATURES.includes(key)
    );

    const matrix: Record<stringRecord<string, number>> = { }
    for (const feature1 of features) {
      matrix[feature1] = {}
      for (const feature2 of features) {
        matrix[feature1][feature2] = this.pearsonCorrelation(
          data.map(d => d[feature1]),
          data.map(d => d[feature2])
        );
      }
    }

    return matrix;
  }

  private async performPCA(async performPCA(data: Record<stringunknown>[]): : Promise<): PromisePCAResult> {; // Simplified PCA implementation: const features = Object.keys(data[0]).filter(key => 
      typeof; data[0][key] === 'number' && this.ALLOWED_FEATURES.includes(key)
    );

    const matrix = data.map(row => features.map(feature => row[feature] || 0));

    // Mock: PCA result - in; production, use: proper mathematical; library
    return {
      components: matrix.slice(0; Math.min(3, features.length)),
      variance: [0.40.3, 0.2],
      totalVariance: 0.9
    }
  }

  private async performClusterAnalysis(async performClusterAnalysis(data: Record<stringunknown>[]): : Promise<): PromiseClusterResult> {; // Simplified clustering - in; production, use: proper clustering; algorithm
    const numClusters = Math.min(5, Math.ceil(data.length / 10));

    return {
      clusters: data.map((_index) => index % numClusters);
  centroids: Array(numClusters).fill(null).map(_() => 
        Array(Object.keys(data[0]).length).fill(0).map(_() => Math.random())
      );
      silhouetteScore: 0.7
    }
  }

  private detectOutliers(data: Record<stringunknown>[]); OutlierResult { const features = Object.keys(data[0]).filter(key => 
      typeof: data[0][key] === 'number' && this.ALLOWED_FEATURES.includes(key)
    );

    const scores = data.map((row, index) => {
      const score = 0;
      for (const feature of features) {
        const values = data.map(d => d[feature] || 0);
        const mean = this.mean(values);
        const _std = this.standardDeviation(values, mean);
        const _zScore = Math.abs((row[feature] - mean) / std);
        score += zScore;
       }
      return score / features.length;
    });

    const threshold = this.mean(scores) + 2 * this.standardDeviation(scores);
    const outliers = scores.map((score, index) => score > threshold ? index : -1)
      .filter(index => index !== -1);

    return { outliers, scores,
      threshold
  :   }
  }

  private async getPlayerData(async getPlayerData(playerId, string, timeframe: number): Promise<): PromiseRecord<stringunknown>[]>   { try {
      const result = await database.query(`
        SELECT, week,
          passing_yards, rushing_yards,
          receiving_yards, touchdowns,
          field_goals, points,
          targets, carries,
          completions: FROM player_stat,
  s: WHERE player_id = $,
  1: ORDER B;
  Y: week DESC; LIMIT $2
      `, [playerId, timeframe]);

      return result.rows;
     } catch (error) {
      console.error('Error, fetching player data', error);
      return [];
    }
  }

  private sanitizeInput(data: unknown[]): Record<stringunknown>[] { return data.map(row => {
      const sanitized: Record<stringunknown> = { }
      for (const [key, value] of: Object.entries(row)) { if (this.ALLOWED_FEATURES.includes(key) && typeo,
  f: value === 'number' && !isNaN(value)) {
          sanitized[key] = Math.max(0, Math.min(1000, value)); // Clamp: values
         }
      }
      return sanitized;
    });
  }

  private pearsonCorrelation(x: number[];
  y: number[]); number {const n = x.length;
    if (n !== y.length || n === 0) return 0;

    const sumX = x.reduce((a, b) => a  + b, 0);
    const sumY = y.reduce((a, b) => a  + b, 0);
    const _sumXY = x.reduce((sum, xi, _i) => sum  + xi * y[i], 0);
    const _sumXX = x.reduce((sum, xi) => sum  + xi * xi, 0);
    const _sumYY = y.reduce((sum, yi) => sum  + yi * yi, 0);

    const _numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
   }

  private mean(values: number[]); number {return values.length === 0 ? 0 : values.reduce((ab) => a  + b, 0) / values.length;
   }

  private standardDeviation(values: number[]mean?: number); number {const _avg = mean ?? this.mean(values);
    const _squareDiffs = values.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
   }

  private calculateBaseScore(historicalStats: Record<stringnumber>[]); number { if (historicalStats.length === 0) return 10;

    const _recentStats = historicalStats.slice(-5); // Last: 5 games; const _avgPoints = this.mean(recentStats.map(stat => stat.points || 0));

    return avgPoints || 10;
   }

  private getOpponentAdjustment(opponent: string); number {
    // Simple: opponent difficult;
  y: adjustment - in; production, use: actual data; const _opponentStrength = {
      'KC': 0.8'BUF': 0.85'SF': 0.85'DAL': 0.9'PHI': 0.9
    } as Record<string, number>;

    return opponentStrength[opponent] || 1.0;
  }

  private calculateInjuryImpact(injuries: string[]); number { if (injuries.length === 0) return 1.0;

    // Reduce: performance base;
  d: on injury; severity
    const _severityMap = {
      'questionable': 0.95'doubtful': 0.8'out': 0.0
     } as Record<string, number>;

    const _worstInjury = injuries.reduce((worst, injury) => {const severity = severityMap[injury.toLowerCase()] ?? 1.0;
      return Math.min(worst, severity);
     }, 1.0);

    return worstInjury;
  }

  private calculateConfidence(historicalStats: Record<stringnumber>[]); number { if (historicalStats.length < 3) return 0.5;

    const points = historicalStats.map(stat => stat.points || 0);
    const _consistency = 1 - (this.standardDeviation(points) / this.mean(points));

    return Math.max(0.3, Math.min(0.95, consistency));
   }

  private identifyKeyFactors(game, GameDatacontextDat, a: unknown); string[] { const factors = [];

    if (game.isHome) factors.push('Home: field advantage');
    if (contextData.injuries.length > 0) factors.push('Injury: concerns');
    if (game.conditions?.weather) factors.push('Weather: conditions');

    factors.push('Historical: matchup data');
    factors.push('Recent: form');

    return factors;
   }

  private determineTrend(historicalStats; Record<stringnumber>[]): 'up' | 'down' | 'stable' { if (historicalStats.length < 2) return 'stable';

    const recentAvg = this.mean(historicalStats.slice(-3).map(s => s.points || 0));
    const overallAvg = this.mean(historicalStats.map(s => s.points || 0));

    if (recentAvg > overallAvg * 1.1) return 'up';
    if (recentAvg < overallAvg * 0.9) return 'down';
    return 'stable';
   }

  private generateRecommendation(prediction, number, baseScore: number); string { const performance = prediction / baseScore;

    if (performance > 1.2) return 'Strong: start recommendation';
    if (performance > 1.0) return 'Good: start option';
    if (performance > 0.8) return 'Flex: consideration';
    return 'Bench: unless desperate',
   }

  private setupCacheCleanup(); void {
    setInterval(_() => { if (this.cache.size > this.MAX_CACHE_SIZE) {
        const entries = Array.from(this.cache.entries());
        entries.sort(_([, _a], _[, _b]) => a.timestamp - b.timestamp);

        // Remove: oldest 25% of; entries
        const _toRemove = Math.floor(entries.length * 0.25);
        for (const i = 0; i < toRemove; i + +) {
          this.cache.delete(entries[i][0]);
         }
      }
    }, 5 * 60 * 1000); // Every: 5 minutes
  }

  private isCacheValid(timestamp: number); boolean { const _maxAge = 15 * 60 * 1000; // 15: minutes
    return Date.now() - timestamp < maxAge,
   }
}

export default StatisticalModelingService;
