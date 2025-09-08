/**
 * Advanced Fantasy Football Scoring System Types
 * Comprehensive type definitions for all fantasy football scoring formats
 */

import { NFLPlayer, PlayerStats, WeatherData } from '@/services/nfl/dataProvider';

// ==================== SCORING FORMAT DEFINITIONS ====================

export enum ScoringFormat {
  STANDARD = 'standard',
  PPR = 'ppr',
  HALF_PPR = 'half_ppr',
  DYNASTY = 'dynasty',
  SUPERFLEX = 'superflex',
  IDP = 'idp', // Individual Defensive Players
  BEST_BALL = 'best_ball',
  CUSTOM = 'custom'
}

export enum Position {
  QB = 'QB',
  RB = 'RB',
  WR = 'WR',
  TE = 'TE',
  FLEX = 'FLEX',
  SUPERFLEX = 'SFLEX',
  K = 'K',
  DST = 'DST',
  DL = 'DL', // Defensive Line
  LB = 'LB', // Linebacker
  DB = 'DB'  // Defensive Back
}

// ==================== COMPREHENSIVE SCORING RULES ====================

export interface BasePositionScoring {
  // Passing
  passingYards: number;
  passingTDs: number;
  passingInterceptions: number;
  passingCompletions?: number;
  passingIncompletions?: number;
  passing300Bonus?: number;
  passing400Bonus?: number;
  
  // Rushing
  rushingYards: number;
  rushingTDs: number;
  rushingAttempts?: number;
  rushing100Bonus?: number;
  rushing200Bonus?: number;
  
  // Receiving
  receivingYards: number;
  receivingTDs: number;
  receptions: number;
  targets?: number;
  receiving100Bonus?: number;
  receiving200Bonus?: number;
  
  // Miscellaneous
  fumbles: number;
  fumblesLost?: number;
  twoPointConversions?: number;
  kickReturnTDs?: number;
  puntReturnTDs?: number;
  
  // Special scoring
  firstDowns?: number;
  redZoneTargets?: number;
  redZoneCarries?: number;
}

export interface KickerScoring {
  extraPoints: number;
  fieldGoals0to19?: number;
  fieldGoals20to29?: number;
  fieldGoals30to39: number;
  fieldGoals40to49: number;
  fieldGoals50to59?: number;
  fieldGoals60Plus?: number;
  fieldGoalMissed: number;
  extraPointMissed?: number;
}

export interface DefenseScoring {
  sacks: number;
  interceptions: number;
  fumbleRecoveries: number;
  defensiveTDs: number;
  safeties: number;
  blockedKicks?: number;
  forcedFumbles?: number;
  
  // Points allowed tiers
  pointsAllowed0: number;
  pointsAllowed1to6: number;
  pointsAllowed7to13: number;
  pointsAllowed14to20: number;
  pointsAllowed21to27: number;
  pointsAllowed28to34: number;
  pointsAllowed35Plus: number;
  
  // Yardage allowed (for advanced leagues)
  yardsAllowed0to99?: number;
  yardsAllowed100to199?: number;
  yardsAllowed200to299?: number;
  yardsAllowed300to399?: number;
  yardsAllowed400to499?: number;
  yardsAllowed500Plus?: number;
}

export interface IDPScoring {
  tackles: number;
  assistedTackles?: number;
  tacklesForLoss?: number;
  passesDefended?: number;
  sacks: number;
  interceptions: number;
  fumbleRecoveries: number;
  forcedFumbles?: number;
  defensiveTDs: number;
  safeties: number;
  blockedKicks?: number;
}

export interface AdvancedScoringRules {
  format: ScoringFormat;
  name: string;
  description?: string;
  
  // Position-specific scoring
  qb: BasePositionScoring;
  rb: BasePositionScoring;
  wr: BasePositionScoring;
  te: BasePositionScoring;
  kicker: KickerScoring;
  defense: DefenseScoring;
  idp?: IDPScoring; // For IDP leagues
  
  // Advanced modifiers
  weatherModifiers?: WeatherModifiers;
  injuryModifiers?: InjuryModifiers;
  matchupModifiers?: MatchupModifiers;
  
  // Dynasty-specific
  rookieBonuses?: RookieBonuses;
  
  // Custom rules
  customRules?: CustomRule[];
  
  // Performance bonuses
  performanceBonuses?: PerformanceBonus[];
}

// ==================== MODIFIER SYSTEMS ====================

export interface WeatherModifiers {
  enabled: boolean;
  temperatureThresholds: {
    extreme_cold: { threshold: number; modifier: number }; // < 20°F
    cold: { threshold: number; modifier: number };         // 20-40°F
    hot: { threshold: number; modifier: number };          // > 85°F
    extreme_hot: { threshold: number; modifier: number };  // > 95°F
  };
  windThresholds: {
    moderate: { threshold: number; modifier: number };     // 10-20 mph
    strong: { threshold: number; modifier: number };       // 20-30 mph
    extreme: { threshold: number; modifier: number };      // > 30 mph
  };
  precipitationModifiers: {
    light_rain: number;
    heavy_rain: number;
    snow: number;
    heavy_snow: number;
  };
  domeBonus?: number; // Bonus for dome games
}

export interface InjuryModifiers {
  enabled: boolean;
  questionableModifier: number;  // -5% to -15%
  doubtfulModifier: number;      // -20% to -40%
  probableModifier: number;      // -2% to -5%
  outModifier: number;           // -100%
  returnFromInjuryModifier: number; // First game back
  backupPlayerBonus?: number;    // When starter is out
}

export interface MatchupModifiers {
  enabled: boolean;
  difficultyTiers: {
    elite_defense: number;       // Top 5 defense vs position
    strong_defense: number;      // Top 10 defense vs position
    average_defense: number;     // Middle tier defense
    weak_defense: number;        // Bottom 10 defense vs position
    worst_defense: number;       // Bottom 5 defense vs position
  };
  homeFieldAdvantage?: number;
  divisionalRivalryBonus?: number;
  primetime_bonus?: number;
}

export interface RookieBonuses {
  enabled: boolean;
  firstSeasonBonus: number;
  rookieThresholdBonuses: {
    qb_passing_yards: { threshold: number; bonus: number };
    rb_rushing_yards: { threshold: number; bonus: number };
    wr_receiving_yards: { threshold: number; bonus: number };
    te_receiving_yards: { threshold: number; bonus: number };
  };
}

// ==================== CUSTOM RULES ENGINE ====================

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number; // For rule ordering
  active: boolean;
}

export interface RuleCondition {
  type: 'stat_threshold' | 'game_situation' | 'player_attribute' | 'composite';
  field: string; // stat field or attribute
  operator: '>' | '<' | '==' | '>=' | '<=' | 'between' | 'in';
  value: number | string | number[] | string[];
  position?: Position[];
  gameWeek?: number[];
}

export interface RuleAction {
  type: 'add_points' | 'multiply_points' | 'set_points' | 'add_percentage';
  value: number;
  applyTo: 'total' | 'stat_category' | 'specific_stat';
  target?: string; // specific stat if applicable
}

export interface PerformanceBonus {
  id: string;
  name: string;
  description: string;
  positions: Position[];
  conditions: BonusCondition[];
  points: number;
  maxOccurrences?: number; // per game/week/season
}

export interface BonusCondition {
  stat: string;
  threshold: number;
  operator: '>=' | '<=' | '==' | 'between';
  additionalRequirements?: BonusCondition[];
}

// ==================== SCORING CALCULATION RESULTS ====================

export interface AdvancedFantasyScore {
  playerId: string;
  playerName: string;
  position: Position;
  teamId: string;
  leagueId: string;
  week: number;
  season: number;
  
  // Core scoring
  basePoints: number;
  modifiedPoints: number;
  finalPoints: number;
  
  // Detailed breakdown
  breakdown: ScoreBreakdown;
  
  // Modifiers applied
  modifiersApplied: AppliedModifier[];
  
  // Performance metrics
  efficiency: PerformanceMetrics;
  
  // Metadata
  lastUpdated: Date;
  isProjection: boolean;
  confidence?: number; // 0-100 for projections
  volatility?: number; // Standard deviation for risk assessment
}

export interface ScoreBreakdown {
  // Base categories
  passing: CategoryScore;
  rushing: CategoryScore;
  receiving: CategoryScore;
  kicking?: CategoryScore;
  defense?: CategoryScore;
  idp?: CategoryScore;
  
  // Bonuses and penalties
  performanceBonuses: BonusScore[];
  weatherAdjustments: number;
  injuryAdjustments: number;
  matchupAdjustments: number;
  customRuleAdjustments: CustomRuleScore[];
  
  // Totals
  baseTotal: number;
  modifierTotal: number;
  finalTotal: number;
}

export interface CategoryScore {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  stats: StatContribution[];
}

export interface StatContribution {
  statName: string;
  statValue: number;
  pointsPerUnit: number;
  totalPoints: number;
}

export interface BonusScore {
  bonusName: string;
  points: number;
  trigger: string;
}

export interface CustomRuleScore {
  ruleName: string;
  points: number;
  description: string;
}

export interface AppliedModifier {
  type: 'weather' | 'injury' | 'matchup' | 'custom';
  name: string;
  multiplier: number;
  pointsAdjustment: number;
  reason: string;
}

export interface PerformanceMetrics {
  targetShare?: number;        // For WR/TE
  redZoneShare?: number;       // Percentage of team RZ opportunities
  snapCount?: number;          // Total snaps played
  snapPercentage?: number;     // Percentage of team snaps
  aiRPOE?: number;            // Air Yards - Receiving Yards Over Expected
  efficiency: {
    yardsPerTouch?: number;
    yardsPerTarget?: number;
    yardsPerAttempt?: number;
    touchdownRate?: number;
  };
}

// ==================== BATCH PROCESSING & OPTIMIZATION ====================

export interface BatchProcessingJob {
  id: string;
  jobType: 'live_scoring' | 'projection_update' | 'historical_analysis' | 'rule_validation';
  status: 'pending' | 'processing' | 'completed' | 'error';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Job parameters
  leagueIds?: string[];
  playerIds?: string[];
  weeks?: number[];
  seasons?: number[];
  
  // Processing metrics
  startTime?: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  recordsProcessed?: number;
  errors?: string[];
  
  // Results
  results?: any;
  performance: {
    avgTimePerRecord: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
}

export interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in seconds
  accessCount: number;
  lastAccessed: Date;
}

// ==================== PROJECTION ALGORITHMS ====================

export interface ProjectionModel {
  id: string;
  name: string;
  type: 'regression' | 'machine_learning' | 'composite' | 'expert_consensus';
  position: Position;
  accuracy: {
    mape: number;      // Mean Absolute Percentage Error
    rmse: number;      // Root Mean Square Error
    correlation: number; // Correlation with actual results
  };
  lastTrained: Date;
  features: string[];
  weights: Record<string, number>;
}

export interface PlayerProjection {
  playerId: string;
  position: Position;
  week: number;
  season: number;
  
  // Projected stats
  projectedStats: Partial<PlayerStats>;
  
  // Confidence intervals
  confidence: {
    floor: number;    // 10th percentile
    ceiling: number;  // 90th percentile
    median: number;   // 50th percentile
  };
  
  // Risk assessment
  riskFactors: RiskFactor[];
  volatility: number;
  
  // Model information
  modelUsed: string;
  lastUpdated: Date;
  dataPoints: number; // Historical games used
}

export interface RiskFactor {
  type: 'injury' | 'matchup' | 'weather' | 'usage' | 'recent_performance';
  severity: 'low' | 'medium' | 'high';
  impact: number; // -100 to +100
  description: string;
}

// ==================== LEAGUE CONFIGURATION ====================

export interface LeagueConfiguration {
  id: string;
  name: string;
  scoringFormat: ScoringFormat;
  scoringRules: AdvancedScoringRules;
  
  // Roster settings
  rosterPositions: {
    qb: number;
    rb: number;
    wr: number;
    te: number;
    flex: number;
    superflex: number;
    k: number;
    dst: number;
    bench: number;
    ir: number;
    idp?: {
      dl: number;
      lb: number;
      db: number;
    };
  };
  
  // Advanced settings
  playoffWeeks: number[];
  tradingDeadline: number; // week number
  waiverSystem: 'faab' | 'rolling' | 'reverse_standings';
  
  // Performance tracking
  performanceTracking: {
    trackEfficiency: boolean;
    trackVolatility: boolean;
    trackRiskFactors: boolean;
    weeklyAnalytics: boolean;
  };
}

// ==================== REAL-TIME UPDATES ====================

export interface LiveScoreUpdate {
  id: string;
  playerId: string;
  teamId: string;
  leagueId: string;
  
  // Score changes
  previousPoints: number;
  currentPoints: number;
  pointsChange: number;
  
  // What changed
  statChanges: StatChange[];
  modifierChanges: ModifierChange[];
  
  // Context
  gameContext: {
    quarter: number;
    timeRemaining: string;
    gameStatus: string;
    lastPlay?: string;
  };
  
  timestamp: Date;
  sequence: number; // For ordering updates
}

export interface StatChange {
  statType: string;
  previousValue: number;
  currentValue: number;
  pointsImpact: number;
  description: string;
}

export interface ModifierChange {
  modifierType: 'weather' | 'injury' | 'matchup';
  description: string;
  pointsImpact: number;
}

// ==================== PERFORMANCE MONITORING ====================

export interface ScoringEngineMetrics {
  // Performance metrics
  avgCalculationTime: number; // milliseconds
  calculationsPerSecond: number;
  memoryUsage: number;
  cacheHitRate: number;
  
  // Accuracy metrics
  projectionAccuracy: {
    mape: number;
    rmse: number;
    correlation: number;
  };
  
  // System health
  lastUpdate: Date;
  errorRate: number;
  uptime: number;
  
  // Processing volumes
  dailyCalculations: number;
  weeklyProjections: number;
  liveUpdates: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: HealthIssue[];
  metrics: ScoringEngineMetrics;
  lastCheck: Date;
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'performance' | 'accuracy' | 'data' | 'system';
  description: string;
  timestamp: Date;
  resolved?: boolean;
}