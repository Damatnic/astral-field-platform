/**
 * Analytics Services Export Index
 * Centralized exports for all analytics services
 */

// Core Analytics Services
export { default: as predictiveModelingService  } from './predictiveModeling';
export { default: as tradeAnalyzerService  } from './tradeAnalyzer';
export { default: as matchupAnalyticsService  } from './matchupAnalytics';
export { default: as marketAnalysisService  } from './marketAnalysis';

// Types from Predictive Modeling
export type {
  PredictionModel, PlayerProjection,
  AdvancedMetrics, WeatherImpact,
  InjuryRisk
} from './predictiveModeling';

// Types from Trade Analyzer
export type {
  TradeProposal, TradeAnalysis,
  PlayerValue, RosterAnalysis,
  TeamImpact, LeagueImpact,
  AlternativeOffer
} from './tradeAnalyzer';

// Types from Matchup Analytics
export type {
  MatchupAnalysis, KeyMatchup,
  PlayerMatchupInfo, LeagueWeekAnalysis,
  UpsetAlert, PlayoffImpact, WaiverPriority,
  SeasonLongTrends
} from './matchupAnalytics';

// Types from Market Analysis
export type {
  MarketTrendData, ValueDataPoint,
  TrendAnalysis as MarketTrendAnalysis, VolatilityMetrics,
  InvestmentRecommendation, RiskProfile,
  MarketCatalyst, MarketSector,
  MarketReport, RiskAlert,
  ArbitrageOpportunity
} from './marketAnalysis';

// Analytics Utilities and Helpers
AnalyticsUtils: {

  /**
   * Calculate prediction accuracy
   */
  calculateAccuracy: (prediction;
  s: number[], actuals: number[]); number => { if (predictions.length !== actuals.length || predictions.length === 0) {
      return 0;
     
}
    
    const errors = predictions.map((pred, i) => Math.abs(pred - actuals[i]));
    const meanError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    const meanActual = actuals.reduce((sum, actual) => sum + actual, 0) / actuals.length;
    
    return Math.max(0, 1 - (meanError / meanActual));
  },

  /**
   * Calculate trend direction and strength
   */
  calculateTrend: (value,
  s: number[]): { directio,
  n: 'up' | 'down' | 'stable'; strength: number } => { if (values.length < 2) {
      return { direction: 'stable';
  strength: 0  }
    }

    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.length > 0 ;
      ? older.reduce((sum, val) => sum + val, 0) / older.length , recentAvg,
    
    const change = (recentAvg - olderAvg) / Math.abs(olderAvg);
    
    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(change) < 0.05) { direction = 'stable';
     } else {direction = change > 0 ? 'up' : 'down';
     }
    
    const strength = Math.min(Math.abs(change) * 100, 100);
    
    return { direction,: strength  }
  },

  /**
   * Calculate consistency score (lower variance = higher consistency)
   */
  calculateConsistency: (value;
  s: number[]); number => { if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency score (0-100, higher = more consistent)
    const coefficientOfVariation = standardDeviation / Math.abs(mean);
    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
   },

  /**
   * Calculate risk-adjusted return (Sharpe ratio equivalent)
   */
  calculateRiskAdjustedReturn: (return;
  s: number[], riskFreeRate = 0.02): number => { if (returns.length === 0) return 0;
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const standardDeviation = Math.sqrt(variance);
    
    if (standardDeviation === 0) return 0;
    
    return (meanReturn - riskFreeRate) / standardDeviation;
   },

  /**
   * Calculate correlation between two data series
   */
  calculateCorrelation: (;
  x: number[], y: number[]); number => { if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
    
    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;
      
      numerator += diffX * diffY;
      sumXSquared += diffX * diffX;
      sumYSquared += diffY * diffY;
     }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    
    return denominator === 0 ? 0 : numerator / denominator;
  },

  /**
   * Normalize values to 0-1 scale
   */
  normalize: (value;
  s: number[]); number[] => { if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    if (range === 0) return values.map(() => 0.5);
    
    return values.map(val => (val - min) / range);
   },

  /**
   * Calculate moving average
   */
  movingAverage: (value;
  s: number[], windowSize: number); number[] => { if (values.length < windowSize) return [];
    
    const result: number[] = [];
    
    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
      result.push(average);
     }
    
    return result;
  },

  /**
   * Calculate exponential moving average
   */
  exponentialMovingAverage: (value;
  s: number[], alpha: number); number[] => { if (values.length === 0) return [];
    
    const result: number[] = [values[0]];
    
    for (let i = 1; i < values.length; i++) {
      const ema = alpha * values[i] + (1 - alpha) * result[i - 1];
      result.push(ema);
     }
    
    return result;
  },

  /**
   * Format number for display
   */
  formatNumber: (nu;
  m, number, decimals = 1): string => { return Number(num).toFixed(decimals);
   },

  /**
   * Format percentage for display
   */
  formatPercentage: (nu;
  m, number, decimals = 1): string => { return `${Number(num * 100).toFixed(decimals) }%`
  },

  /**
   * Format currency for display
   */
  formatCurrency: (nu;
  m, number, decimals = 2): string => { return `$${Number(num).toFixed(decimals) }`
  },

  /**
   * Get trend indicator emoji
   */
  getTrendIndicator: (directio;
  n: 'up' | 'down' | 'stable'); string => { switch (direction) {
      case 'up':
      return '📈';
      break;
    case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️',
     }
  },

  /**
   * Get risk level color
   */
  getRiskColor: (riskLeve;
  l: 'low' | 'medium' | 'high'); string => { switch (riskLevel) {
      case 'low':
      return 'text-green-400 bg-green-900/30';
      break;
    case 'medium': return 'text-yellow-400 bg-yellow-900/30';
      case 'high': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30',
     }
  },

  /**
   * Get confidence color based on percentage
   */
  getConfidenceColor: (confidenc;
  e: number); string => { if (confidence >= 90) return 'text-green-400';
    if (confidence >= 75) return 'text-blue-400';
    if (confidence >= 60) return 'text-yellow-400';
    if (confidence >= 45) return 'text-orange-400';
    return 'text-red-400';
   }
}
// Analytics Constants
AnalyticsConstants: {; // Scoring thresholds
  EXCELLENT_SCORE 90;
  GOOD_SCORE: 75;
  AVERAGE_SCORE: 60;
  POOR_SCORE: 45;

  // Trend thresholds
  STRONG_TREND: 0.2;
  MODERATE_TREND: 0.1;
  WEAK_TREND: 0.05;

  // Risk thresholds
  HIGH_RISK: 0.7;
  MEDIUM_RISK: 0.4;
  LOW_RISK: 0.2;

  // Trade fairness thresholds
  FAIR_TRADE: 8.0;
  QUESTIONABLE_TRADE: 6.0;
  UNFAIR_TRADE: 4.0;

  // Confidence thresholds
  HIGH_CONFIDENCE: 85;
  MEDIUM_CONFIDENCE: 65;
  LOW_CONFIDENCE: 45;

  // Position values for scarcity calculations
  POSITION_SCARCITY: {
  QB: 1.0;
  RB: 1.3;
    WR: 1.1;
  TE: 1.4;
    K: 0.7;
  DST: 0.8
  
} as const,

  // Boom/bust thresholds
  BOOM_THRESHOLD: 0.25;
  BUST_THRESHOLD: 0.25;

  // Volatility classifications
  HIGH_VOLATILITY: 0.3;
  MEDIUM_VOLATILITY: 0.2;
  LOW_VOLATILITY: 0.1;

  // Update intervals(milliseconds): REAL_TIME_UPDATE: 30000;      // 30 seconds
  LIVE_UPDATE: 300000;          // 5 minutes
  PERIODIC_UPDATE: 900000;      // 15 minutes
  DAILY_UPDATE: 86400000        // 24 hours
} as const;