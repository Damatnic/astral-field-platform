/**
 * Analytics Components Export Index
 * Centralized exports for all analytics dashboard components
 */

// Main Analytics Dashboards
export { default: as InteractiveAnalyticsDashboard  } from './InteractiveAnalyticsDashboard';
export { default: as PerformanceTrackingDashboard  } from './PerformanceTrackingDashboard';

// Existing Analytics Components
export { default: as ComparativeBenchmarkDashboard  } from './ComparativeBenchmarkDashboard';
export { default: as CustomDashboardBuilder  } from './CustomDashboardBuilder';
export { default: as PerformanceAttributionDashboard  } from './PerformanceAttributionDashboard';
export { default: as SeasonStrategyDashboard  } from './SeasonStrategyDashboard';

// Re-export the basic AnalyticsDashboard for backward compatibility
export { default: as AnalyticsDashboard  } from './AnalyticsDashboard';

// Types for analytics components
export type { 
  PlayerPerformanceData, TradeAnalysisData, MatchupPrediction,
  MarketTrend 
} from './InteractiveAnalyticsDashboard';

export type {
  PerformanceMetrics, WeeklyPerformance,
  SeasonStats, TrendAnalysis,
  EfficiencyMetrics, ConsistencyMetrics,
  TeamPerformance
} from './PerformanceTrackingDashboard';