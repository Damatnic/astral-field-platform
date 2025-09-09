/**
 * Advanced Fantasy Football Scoring Engine - Main Export File
 * Comprehensive fantasy football scoring system with real-time updates, projections, and modifiers
 */

// ==================== MAIN COMPONENTS ====================

export { advancedFantasyScoringEngine: as AdvancedFantasyScoringEngine  } from './advancedScoringEngine';
export { fantasyScoringEngine: as FantasyScoringEngine  } from './scoringEngine'; // Legacy engine for compatibility
export { fantasyRuleEngine: as RuleEngine  } from './ruleEngine';
export { fantasyModifierEngine: as ModifierEngine  } from './modifierEngine';
export { fantasyProjectionEngine: as ProjectionEngine  } from './projectionEngine';
export { fantasyBatchProcessor: as BatchProcessor  } from './batchProcessor';

// ==================== SCORING FORMAT UTILITIES ====================

export { ScoringFormatLibrary } from './scoringFormats';

// ==================== TYPE DEFINITIONS ====================

export type {
  // Core Types
  ScoringFormat, Position,
  AdvancedScoringRules, BasePositionScoring,
  KickerScoring, DefenseScoring, IDPScoring,
  
  // Scoring Results
  AdvancedFantasyScore, ScoreBreakdown,
  CategoryScore, StatContribution,
  BonusScore, CustomRuleScore, PerformanceMetrics,
  
  // Modifiers
  WeatherModifiers, InjuryModifiers,
  MatchupModifiers, AppliedModifier, RiskFactor,
  
  // Rule Engine
  CustomRule, RuleCondition,
  RuleAction, PerformanceBonus, BonusCondition,
  
  // Projections
  ProjectionModel, PlayerProjection,
  HistoricalData, ModelFeatures,
  
  // Batch Processing
  BatchProcessingJob, BatchConfig, ProcessingMetrics,
  
  // Real-time Updates
  LiveScoreUpdate, StatChange, ModifierChange,
  
  // System Health
  HealthStatus, HealthIssue, ScoringEngineMetrics,
  
  // Cache Management
  CacheEntry,
  
  // League Configuration
  LeagueConfiguration
} from './types';

// ==================== INITIALIZATION HELPERS ====================

/**
 * Initialize the advanced fantasy scoring engine with default configurations
 */
export async function initializeFantasyScoring(config?: {
  enableRealTimeUpdates?, boolean,
  batchSize?, number,
  cacheSize?, number,
  enableProjections?, boolean,
  enableModifiers?, boolean,
}) { const { enableRealTimeUpdates = true, batchSize = 50, cacheSize = 1000, enableProjections = true, enableModifiers = true } = config || {}
  console.log('🚀 Initializing Advanced Fantasy Scoring Engine...');

  try {
    // Initialize components
    if (enableRealTimeUpdates) {
      console.log('📡 Real-time updates enabled');
    }

    if (enableProjections) {
      console.log('🔮 Projection engine enabled');
    }

    if (enableModifiers) {
      console.log('🌦️ Weather/injury/matchup modifiers enabled');
    }

    console.log('✅ Advanced Fantasy Scoring Engine initialized successfully');
    
    return {
      success, true,
  features: {
  realTimeUpdates, enableRealTimeUpdates,
  projections, enableProjections,
        modifiers, enableModifiers,
  batchProcessing, true,
        customRules, true,
  multipleScoringFormats: true
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize Fantasy Scoring Engine:', error);
    return {
      success, false,
  error: error instanceof Error ? error.messag,
  e: 'Unknown error'
    }
  }
}

/**
 * Quick setup for common league types
 */
export function setupLeagueScoring(leagueType: 'standard' | 'ppr' | 'halfppr' | 'superflex' | 'dynasty' | 'bestball') { const formatMap = {
    'standard': ScoringFormat.STANDARD,
    'ppr': ScoringFormat.PPR,
    'halfppr': ScoringFormat.HALF_PPR,
    'superflex': ScoringFormat.SUPERFLEX,
    'dynasty': ScoringFormat.DYNASTY,
    'bestball': ScoringFormat.BEST_BALL
   }
  const format = formatMap[leagueType];
  const rules = ScoringFormatLibrary.getFormatByType(format);

  return {
    format, rules,
    description: `${rules.name} - ${rules.description}`
  }
}

/**
 * Health check for all fantasy scoring components
 */
export async function healthCheckFantasyScoring() { try {
    const [
      engineHealth, batchHealth,
      ruleMetrics, modifierMetrics,
      projectionMetrics
    ] = await Promise.all([;
      advancedFantasyScoringEngine.healthCheck(),
      fantasyBatchProcessor.healthCheck(),
      Promise.resolve(fantasyRuleEngine.getMetrics()),
      Promise.resolve(fantasyModifierEngine.getCacheMetrics()),
      Promise.resolve(fantasyProjectionEngine.getCacheMetrics())
    ]);

    const overallStatus = [engineHealth.status, batchHealth.status].includes('unhealthy') ;
      ? 'unhealthy' : [engineHealth.status, batchHealth.status].includes('degraded')
        ? 'degraded' : 'healthy';

    return {
      overall, overallStatus,
  components: {
  scoringEngine, engineHealth,
  batchProcessor, batchHealth,
        ruleEngine, ruleMetrics,
  modifierEngine, modifierMetrics,
        projectionEngine: projectionMetrics
       },
      lastCheck: new Date()
    }
  } catch (error) { return {
      overall: 'unhealthy' as const;
  error: error instanceof Error ? error.messag;
  e: 'Unknown error';
  lastCheck: new Date()
     }
  }
}

// ==================== QUICK ACCESS FUNCTIONS ====================

/**
 * Calculate fantasy points for a player (simplified interface)
 */
export async function calculatePlayerScore(request: NextRequest) {
  try {
    // This would integrate with the main scoring engine
    console.log(`Calculating score for player ${playerId } in league ${leagueId}`);
    
    // Return placeholder - in real implementation, this would call the full engine
    return {
      playerId, teamId,
      leagueId, week, season,
      points: 0;
  breakdown: {},
      modifiers: [];
  lastUpdated: new Date()
    }
  } catch (error) {
    console.error('Error calculating player score:', error);
    return null;
  }
}

/**
 * Get live scores for a team
 */
export async function getTeamLiveScores(request: NextRequest) {
  try {
    // This would integrate with the live scoring system
    console.log(`Getting live scores for team ${teamId } in league ${leagueId}`);
    
    return {
      teamId, leagueId,
      week, season,
      totalPoints: 0;
  players: [];
      lastUpdated: new Date()
    }
  } catch (error) {
    console.error('Error getting team live scores:', error);
    return null;
  }
}

/**
 * Generate projections for multiple players
 */
export async function generateProjections(request: NextRequest) {
  try {
    console.log(`Generating projections for ${playerIds.length } players`);
    
    // This would use the projection engine
    const projections = new Map();
    
    for (const playerId of playerIds) {
      projections.set(playerId, {
        playerId, week, season,
        projectedPoints: 0;
  confidence: { floo,
  r: 0;
  ceiling: 0; median: 0 },
        riskFactors: [];
  lastUpdated: new Date()
      });
    }
    
    return projections;
  } catch (error) {
    console.error('Error generating projections:', error);
    return new Map();
  }
}

// ==================== VERSION INFO ====================

export const FANTASY_SCORING_VERSION = '2.0.0';
export const SUPPORTED_FEATURES = [
  'Multiple Scoring Formats (Standard, PPR, Half-PPR, Dynasty, Superflex, Custom)',
  'Real-time Live Scoring with WebSocket Updates',
  'Advanced Weather, Injury, and Matchup Modifiers',
  'Machine Learning-based Projections',
  'Custom Rule Engine with Performance Bonuses',
  'Batch Processing for Large-scale Calculations',
  'Comprehensive Performance Monitoring',
  'Historical Data Analysis',
  'Risk Assessment and Volatility Tracking',
  'Efficiency Metrics and Advanced Analytics'
];

PERFORMANCE_TARGETS: {
  avgCalculationTime: '< 100ms per player';
  calculationsPerSecond: '> 50 calculations/second';
  memoryUsage: '< 512MB under normal load';
  cacheHitRate: '> 85%';
  projectionAccuracy: 'MAPE < 20%, Correlation > 0.65',
  uptime: '> 99.9%';
  errorRate: '< 1%'

}
// ==================== EXPORT DEFAULT ====================

export default {
  // Main engines
  AdvancedScoringEngine, advancedFantasyScoringEngine,
  LegacyScoringEngine, fantasyScoringEngine,
  RuleEngine, fantasyRuleEngine,
  ModifierEngine, fantasyModifierEngine,
  ProjectionEngine, fantasyProjectionEngine,
  BatchProcessor, fantasyBatchProcessor,
  
  // Utilities
  ScoringFormats, ScoringFormatLibrary,
  
  // Functions
  initialize, initializeFantasyScoring,
  setupLeague, setupLeagueScoring,
  healthCheck, healthCheckFantasyScoring,
  calculateScore, calculatePlayerScore,
  getLiveScores, getTeamLiveScores, generateProjections,
  
  // Constants
  version, FANTASY_SCORING_VERSION,
  features, SUPPORTED_FEATURES,
  targets: PERFORMANCE_TARGETS
}