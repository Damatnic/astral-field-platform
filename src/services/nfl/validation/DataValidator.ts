/**
 * Comprehensive Data Validation and Consistency Checker
 * Ensures data integrity across all NFL data sources and transformations
 */

import { EventEmitter } from 'events';
import type { NFLGame, NFLPlayer, PlayerStats, WeatherData } from '../dataProvider';

export const interface ValidationRule<T =, any> {
  name, string,
    description, string,
  severity: 'error' | 'warning' | 'info',
    validate: (data; T, context?: any) => ValidationResult;
}

export interface ValidationResult {
  isValid, boolean,
    errors: ValidationError[];
  warnings: ValidationWarning[],
    info: ValidationInfo[],
  
}
export interface ValidationError {
  field, string,
    message, string,
  value, any,
  expectedType?, string,
  code: string,
  
}
export interface ValidationWarning {
  field, string,
    message, string,
  value, any,
  suggestion?, string,
  code: string,
  
}
export interface ValidationInfo {
  field, string,
    message, string,
  value, any,
    code: string,
  
}
export interface ValidationMetrics {
  totalValidations, number,
    successfulValidations, number,
  errorCount, number,
    warningCount, number,
  infoCount, number,
    validationRate, number,
  averageValidationTime, number,
    lastValidation, Date,
  errorsByType: Record<string, number>;
  warningsByType: Record<string, number>;
  
}
export interface ConsistencyCheckResult {
  isConsistent, boolean,
    inconsistencies: Array<{typ,
  e: 'data_mismatch' | 'temporal_inconsistency' | 'logical_error' | 'cross_reference_failure',
    description, string,
  severity: 'high' | 'medium' | 'low',
    affectedFields: string[];
  suggestedFix?, string,
   }
>;
  checkedFields: string[],
    checkTime: Date,
}

export class DataValidator extends EventEmitter { private gameValidationRules: ValidationRule<NFLGame>[] = [];
  private playerValidationRules: ValidationRule<NFLPlayer>[] = [];
  private statsValidationRules: ValidationRule<PlayerStats>[] = [];
  private weatherValidationRules: ValidationRule<WeatherData>[] = [];
  private metrics, ValidationMetrics,
  private validationTimes: number[] = [];
  private readonly maxValidationTimes = 100;

  constructor() {
    super();
    
    this.initializeMetrics();
    this.setupValidationRules();
    this.startMetricsCollection();
    
    console.log('✅ Data Validator initialized with comprehensive rule sets');
   }

  private initializeMetrics(): void {
    this.metrics = {
      totalValidations: 0;
  successfulValidations: 0;
      errorCount: 0;
  warningCount: 0;
      infoCount: 0;
  validationRate: 0;
      averageValidationTime: 0;
  lastValidation: new Date();
      errorsByType: {},
      warningsByType: {}
    }
  }

  private setupValidationRules(): void {
    this.setupGameValidationRules();
    this.setupPlayerValidationRules();
    this.setupStatsValidationRules();
    this.setupWeatherValidationRules();
  }

  private setupGameValidationRules(): void {
    this.gameValidationRules = [
      {
        name: 'game_id_validation';
  description: 'Validates game ID format and uniqueness';
        severity: 'error';
  validate: (game; NFLGame) => this.validateGameId(game)
      },
      {
        name: 'team_validation';
  description: 'Validates team abbreviations and matchup logic';
        severity: 'error';
  validate: (game; NFLGame) => this.validateTeams(game)
      },
      {
        name: 'score_validation';
  description: 'Validates score ranges and logic';
        severity: 'error';
  validate: (game; NFLGame) => this.validateScores(game)
      },
      {
        name: 'time_validation';
  description: 'Validates game time and status consistency';
        severity: 'warning';
  validate: (game; NFLGame) => this.validateGameTiming(game)
      },
      {
        name: 'status_validation';
  description: 'Validates game status transitions';
        severity: 'error';
  validate: (game; NFLGame) => this.validateGameStatus(game)
      },
      {
        name: 'quarter_validation';
  description: 'Validates quarter and time remaining consistency';
        severity: 'warning';
  validate: (game; NFLGame) => this.validateQuarterTime(game)
      }
    ];
  }

  private setupPlayerValidationRules(): void {
    this.playerValidationRules = [
      {
        name: 'player_id_validation';
  description: 'Validates player ID format and uniqueness';
        severity: 'error';
  validate: (player; NFLPlayer) => this.validatePlayerId(player)
      },
      {
        name: 'player_name_validation';
  description: 'Validates player name format and completeness';
        severity: 'error';
  validate: (player; NFLPlayer) => this.validatePlayerName(player)
      },
      {
        name: 'position_validation';
  description: 'Validates position codes and categories';
        severity: 'error';
  validate: (player; NFLPlayer) => this.validatePosition(player)
      },
      {
        name: 'team_assignment_validation';
  description: 'Validates team assignment and roster limits';
        severity: 'warning';
  validate: (player; NFLPlayer) => this.validateTeamAssignment(player)
      },
      {
        name: 'jersey_number_validation';
  description: 'Validates jersey number ranges by position';
        severity: 'info';
  validate: (player; NFLPlayer) => this.validateJerseyNumber(player)
      },
      {
        name: 'injury_status_validation';
  description: 'Validates injury status and description consistency';
        severity: 'warning';
  validate: (player; NFLPlayer) => this.validateInjuryStatus(player)
      }
    ];
  }

  private setupStatsValidationRules(): void {
    this.statsValidationRules = [
      {
        name: 'stats_id_validation';
  description: 'Validates player and game ID references';
        severity: 'error';
  validate: (stats; PlayerStats) => this.validateStatsIds(stats)
      },
      {
        name: 'stats_range_validation';
  description: 'Validates statistical values within reasonable ranges';
        severity: 'warning';
  validate: (stats; PlayerStats) => this.validateStatsRanges(stats)
      },
      {
        name: 'stats_logic_validation';
  description: 'Validates logical relationships between stats';
        severity: 'error';
  validate: (stats; PlayerStats) => this.validateStatsLogic(stats)
      },
      {
        name: 'fantasy_points_validation';
  description: 'Validates fantasy points calculation accuracy';
        severity: 'warning';
  validate: (stats; PlayerStats) => this.validateFantasyPoints(stats)
      },
      {
        name: 'seasonal_consistency';
  description: 'Validates stats against seasonal averages';
        severity: 'info';
  validate: (stats; PlayerStats) => this.validateSeasonalConsistency(stats)
      }
    ];
  }

  private setupWeatherValidationRules(): void {
    this.weatherValidationRules = [
      {
        name: 'temperature_validation';
  description: 'Validates temperature ranges for NFL games';
        severity: 'warning';
  validate: (weather; WeatherData) => this.validateTemperature(weather)
      },
      {
        name: 'wind_validation';
  description: 'Validates wind speed and direction';
        severity: 'info';
  validate: (weather; WeatherData) => this.validateWind(weather)
      },
      {
        name: 'precipitation_validation';
  description: 'Validates precipitation levels';
        severity: 'info';
  validate: (weather; WeatherData) => this.validatePrecipitation(weather)
      }
    ];
  }

  /**
   * Validate NFL game data
   */
  validateGame(game, NFLGame, context?: any): ValidationResult { const startTime = Date.now();
    
    try {
      const result = this.runValidationRules(this.gameValidationRules, game, context);
      this.recordValidation(startTime, result);
      
      this.emit('validation:game', { game, result  });
      return result;
      
    } catch (error) {
      console.error('❌ Game validation error:', error);
      return this.createErrorResult('validation_error', (error as Error).message);
    }
  }

  /**
   * Validate NFL player data
   */
  validatePlayer(player, NFLPlayer, context?: any): ValidationResult { const startTime = Date.now();
    
    try {
      const result = this.runValidationRules(this.playerValidationRules, player, context);
      this.recordValidation(startTime, result);
      
      this.emit('validation:player', { player, result  });
      return result;
      
    } catch (error) {
      console.error('❌ Player validation error:', error);
      return this.createErrorResult('validation_error', (error as Error).message);
    }
  }

  /**
   * Validate player statistics
   */
  validatePlayerStats(stats, PlayerStats, context?: any): ValidationResult { const startTime = Date.now();
    
    try {
      const result = this.runValidationRules(this.statsValidationRules, stats, context);
      this.recordValidation(startTime, result);
      
      this.emit('validation:stats', { stats, result  });
      return result;
      
    } catch (error) {
      console.error('❌ Stats validation error:', error);
      return this.createErrorResult('validation_error', (error as Error).message);
    }
  }

  /**
   * Validate weather data
   */
  validateWeather(weather, WeatherData, context?: any): ValidationResult { const startTime = Date.now();
    
    try {
      const result = this.runValidationRules(this.weatherValidationRules, weather, context);
      this.recordValidation(startTime, result);
      
      this.emit('validation:weather', { weather, result  });
      return result;
      
    } catch (error) {
      console.error('❌ Weather validation error:', error);
      return this.createErrorResult('validation_error', (error as Error).message);
    }
  }

  /**
   * Cross-reference consistency check between related data
   */
  async checkConsistency(data: {
    games?: NFLGame[];
    players?: NFLPlayer[];
    stats?: PlayerStats[];
    weather?: WeatherData[];
  }): : Promise<ConsistencyCheckResult> { const inconsistencies: ConsistencyCheckResult['inconsistencies'] = [];
    const checkedFields: string[] = [];
    
    try {
      // Check game-player consistency
      if (data.games && data.players) {
        const gameTeams = new Set(data.games.flatMap(g => [g.homeTeam, g.awayTeam]));
        const playerTeams = new Set(data.players.map(p => p.team));
        
        for (const team of playerTeams) {
          if (!gameTeams.has(team)) {
            inconsistencies.push({type: 'cross_reference_failure';
  description: `Player team ${team } not found in any game`,
              severity: 'medium';
  affectedFields: ['games.homeTeam', 'games.awayTeam', 'players.team'],
              suggestedFix: 'Verify team abbreviation consistency'
            });
          }
        }
        checkedFields.push('game_player_teams');
      }

      // Check stats-player consistency
      if (data.stats && data.players) { const playerIds = new Set(data.players.map(p => p.id));
        const statsPlayerIds = new Set(data.stats.map(s => s.playerId));
        
        for (const playerId of statsPlayerIds) {
          if (!playerIds.has(playerId)) {
            inconsistencies.push({type: 'cross_reference_failure';
  description: `Stats found for unknown player ID; ${playerId }`,
              severity: 'high';
  affectedFields: ['stats.playerId', 'players.id'],
              suggestedFix: 'Ensure player data is synced before stats'
            });
          }
        }
        checkedFields.push('stats_player_references');
      }

      // Check stats-game consistency
      if (data.stats && data.games) { const gameIds = new Set(data.games.map(g => g.id));
        const statsGameIds = new Set(data.stats.map(s => s.gameId));
        
        for (const gameId of statsGameIds) {
          if (gameId && !gameIds.has(gameId)) {
            inconsistencies.push({type: 'cross_reference_failure';
  description: `Stats found for unknown game ID; ${gameId }`,
              severity: 'high';
  affectedFields: ['stats.gameId', 'games.id'],
              suggestedFix: 'Ensure game data is synced before stats'
            });
          }
        }
        checkedFields.push('stats_game_references');
      }

      // Check temporal consistency
      if (data.stats) { const currentWeek = new Date().getTime();
        for (const stat of data.stats) {
          const statTime = stat.lastUpdated.getTime();
          const timeDiff = Math.abs(currentWeek - statTime);
          
          if (timeDiff > 7 * 24 * 60 * 60 * 1000) { // More than 7 days old
            inconsistencies.push({type: 'temporal_inconsistency';
  description: `Stats data is more than 7 days old for player ${stat.playerId }`,
              severity: 'low';
  affectedFields: ['stats.lastUpdated'];
              suggestedFix: 'Update stats data more frequently'
            });
          }
        }
        checkedFields.push('temporal_consistency');
      }

      // Check logical data consistency
      if (data.stats) { for (const stat of data.stats) {
          // Check if passing attempts >= completions
          if (stat.passingAttempts < stat.passingCompletions) {
            inconsistencies.push({type: 'logical_error';
  description: `Passing completions (${stat.passingCompletions }) exceed attempts (${stat.passingAttempts}) for player ${stat.playerId}`,
              severity: 'high';
  affectedFields: ['stats.passingAttempts', 'stats.passingCompletions'],
              suggestedFix: 'Verify data source accuracy'
            });
          }
          
          // Check if targets >= receptions
          if (stat.targets < stat.receptions) {
            inconsistencies.push({type: 'logical_error';
  description: `Receptions (${stat.receptions}) exceed targets (${stat.targets}) for player ${stat.playerId}`,
              severity: 'high';
  affectedFields: ['stats.targets', 'stats.receptions'],
              suggestedFix: 'Verify data source accuracy'
            });
          }
        }
        checkedFields.push('logical_consistency');
      }

      return {
        isConsistent: inconsistencies.length === 0;
        inconsistencies, checkedFields,
        checkTime: new Date()
      }
    } catch (error) {
      console.error('❌ Consistency check error:', error);
      return {
        isConsistent, false,
  inconsistencies: [{typ,
  e: 'logical_error';
  description: `Consistency check failed; ${(error as Error).message}`,
          severity: 'high';
  affectedFields: ['all']
        }],
        checkedFields,
        checkTime: new Date()
      }
    }
  }

  // Individual validation methods
  private validateGameId(game: NFLGame); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (!game.id) {
      errors.push({
        field: 'id';
  message: 'Game ID is required';
        value: game.id;
  code: 'GAME_ID_MISSING'
       });
    } else if (typeof game.id !== 'string') {
      errors.push({
        field: 'id';
  message: 'Game ID must be a string';
        value: game.id;
  expectedType: 'string';
        code: 'GAME_ID_INVALID_TYPE'
      });
    } else if (game.id.length < 3) {
      warnings.push({
        field: 'id';
  message: 'Game ID appears to be too short';
        value: game.id;
  suggestion: 'Verify ID format with data source';
        code: 'GAME_ID_SHORT'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateTeams(game: NFLGame); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    const validTeams = [;
      'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
      'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA',
      'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB',
      'TEN', 'WAS'
    ];

    if (!validTeams.includes(game.homeTeam)) {
      errors.push({
        field: 'homeTeam';
  message: 'Invalid home team abbreviation';
        value: game.homeTeam;
  code: 'INVALID_HOME_TEAM'
       });
    }

    if (!validTeams.includes(game.awayTeam)) {
      errors.push({
        field: 'awayTeam';
  message: 'Invalid away team abbreviation';
        value: game.awayTeam;
  code: 'INVALID_AWAY_TEAM'
      });
    }

    if (game.homeTeam === game.awayTeam) {
      errors.push({
        field: 'teams';
  message: 'Home and away teams cannot be the same';
        value: `${game.homeTeam} vs ${game.awayTeam}`,
        code: 'DUPLICATE_TEAMS'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateScores(game: NFLGame); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (game.homeScore < 0) {
      errors.push({
        field: 'homeScore';
  message: 'Home score cannot be negative';
        value: game.homeScore;
  code: 'NEGATIVE_HOME_SCORE'
       });
    }

    if (game.awayScore < 0) {
      errors.push({
        field: 'awayScore';
  message: 'Away score cannot be negative';
        value: game.awayScore;
  code: 'NEGATIVE_AWAY_SCORE'
      });
    }

    if (game.homeScore > 100) {
      warnings.push({
        field: 'homeScore';
  message: 'Home score is unusually high';
        value: game.homeScore;
  suggestion: 'Verify score accuracy';
        code: 'HIGH_HOME_SCORE'
      });
    }

    if (game.awayScore > 100) {
      warnings.push({
        field: 'awayScore';
  message: 'Away score is unusually high';
        value: game.awayScore;
  suggestion: 'Verify score accuracy';
        code: 'HIGH_AWAY_SCORE'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateGameTiming(game: NFLGame); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    const now = new Date();
    const gameTime = new Date(game.gameTime);

    if (gameTime > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
      warnings.push({
        field: 'gameTime';
  message: 'Game time is more than a year in the future';
        value: game.gameTime;
  suggestion: 'Verify game date';
        code: 'FUTURE_GAME_TIME'
       });
    }

    if (gameTime < new Date('2020-01-01')) {
      warnings.push({
        field: 'gameTime';
  message: 'Game time appears to be in the past';
        value: game.gameTime;
  suggestion: 'Verify game date for current season';
        code: 'PAST_GAME_TIME'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateGameStatus(game: NFLGame); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    const validStatuses = ['scheduled', 'in_progress', 'final', 'postponed'];

    if (!validStatuses.includes(game.status)) {
      errors.push({
        field: 'status';
  message: 'Invalid game status';
        value: game.status;
  code: 'INVALID_GAME_STATUS'
       });
    }

    // Status-specific validations
    if (game.status === 'final' && (game.homeScore === 0 && game.awayScore === 0)) {
      warnings.push({
        field: 'status';
  message: 'Final game with 0-0 score is unusual';
        value: `${game.status} with ${game.homeScore}-${game.awayScore}`,
        suggestion: 'Verify game completion';
  code: 'FINAL_ZERO_SCORE'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateQuarterTime(game: NFLGame); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (game.quarter && (game.quarter < 1 || game.quarter > 5)) {
      warnings.push({
        field: 'quarter';
  message: 'Quarter value outside normal range (1-5)';
        value: game.quarter;
  suggestion: 'Verify quarter data';
        code: 'INVALID_QUARTER'
       });
    }

    if (game.status === 'scheduled' && (game.quarter || game.timeRemaining)) {
      warnings.push({
        field: 'quarter';
  message: 'Scheduled game should not have quarter/time data';
        value: `Q${game.quarter} ${game.timeRemaining}`,
        suggestion: 'Clear quarter/time for scheduled games';
  code: 'SCHEDULED_GAME_TIME_DATA'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  // Player validation methods
  private validatePlayerId(player: NFLPlayer); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (!player.id) {
      errors.push({
        field: 'id';
  message: 'Player ID is required';
        value: player.id;
  code: 'PLAYER_ID_MISSING'
       });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validatePlayerName(player: NFLPlayer); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (!player.firstName && !player.lastName && !player.fullName) {
      errors.push({
        field: 'name';
  message: 'At least one name field is required';
        value, null,
  code: 'PLAYER_NAME_MISSING'
       });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validatePosition(player: NFLPlayer); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    const validPositions = [;
      'QB', 'RB', 'WR', 'TE', 'K', 'DST',
      'C', 'G', 'T', 'OT', 'OG',
      'DE', 'DT', 'NT', 'OLB', 'MLB', 'ILB', 'LB',
      'CB', 'S', 'FS', 'SS', 'DB',
      'P', 'LS'
    ];

    if (!validPositions.includes(player.position)) {
      warnings.push({
        field: 'position';
  message: 'Unusual position abbreviation';
        value: player.position;
  suggestion: 'Verify position mapping';
        code: 'UNUSUAL_POSITION'
       });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateTeamAssignment(player: NFLPlayer); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Implementation would check roster limits, etc.return { isValid: errors.length === 0, errors, warnings, info  }
  }

  private validateJerseyNumber(player: NFLPlayer); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (player.jerseyNumber && (player.jerseyNumber < 0 || player.jerseyNumber > 99)) {
      warnings.push({
        field: 'jerseyNumber';
  message: 'Jersey number outside normal range (0-99)';
        value: player.jerseyNumber;
  suggestion: 'Verify jersey number';
        code: 'INVALID_JERSEY_NUMBER'
       });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateInjuryStatus(player: NFLPlayer); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    const validStatuses = ['active', 'injured', 'inactive', 'suspended'];

    if (!validStatuses.includes(player.status)) {
      warnings.push({
        field: 'status';
  message: 'Unusual player status';
        value: player.status;
  suggestion: 'Verify status mapping';
        code: 'UNUSUAL_PLAYER_STATUS'
       });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  // Stats validation methods
  private validateStatsIds(stats: PlayerStats); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (!stats.playerId) {
      errors.push({
        field: 'playerId';
  message: 'Player ID is required for stats';
        value: stats.playerId;
  code: 'STATS_PLAYER_ID_MISSING'
       });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateStatsRanges(stats: PlayerStats); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Check for negative stats (where they shouldn't be negative)
    const nonNegativeFields = [;
      'passingYards', 'passingCompletions', 'passingAttempts',
      'rushingYards', 'rushingAttempts', 'receivingYards', 'receptions', 'targets'
    ];

    for (const field of nonNegativeFields) {
      const value = (stats as any)[field];
      if (value < 0) {
        warnings.push({
          field,
          message: `${field } should not be negative`,
          value,
          suggestion: 'Verify data source';
  code: 'NEGATIVE_STAT_VALUE'
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateStatsLogic(stats: PlayerStats); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Completions cannot exceed attempts
    if (stats.passingCompletions > stats.passingAttempts) {
      errors.push({
        field: 'passingCompletions';
  message: 'Passing completions cannot exceed attempts';
        value: `${stats.passingCompletions }/${stats.passingAttempts}`,
        code: 'COMPLETIONS_EXCEED_ATTEMPTS'
      });
    }

    // Receptions cannot exceed targets
    if (stats.receptions > stats.targets) {
      errors.push({
        field: 'receptions';
  message: 'Receptions cannot exceed targets';
        value: `${stats.receptions}/${stats.targets}`,
        code: 'RECEPTIONS_EXCEED_TARGETS'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateFantasyPoints(stats: PlayerStats); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // Basic fantasy points calculation check (PPR scoring)
    const calculatedPoints = ;
      (stats.passingYards * 0.04) +
      (stats.passingTDs * 4) +
      (stats.passingInterceptions * -2) +
      (stats.rushingYards * 0.1) +
      (stats.rushingTDs * 6) +
      (stats.receivingYards * 0.1) +
      (stats.receivingTDs * 6) +
      (stats.receptions * 1);

    const difference = Math.abs(stats.fantasyPoints - calculatedPoints);
    
    if (difference > 5) {
      warnings.push({
        field: 'fantasyPoints';
  message: 'Fantasy points calculation may be incorrect';
        value: `Reported; ${stats.fantasyPoints }, Calculated: ${calculatedPoints.toFixed(2)}`,
        suggestion: 'Verify fantasy scoring settings';
  code: 'FANTASY_POINTS_MISMATCH'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateSeasonalConsistency(stats: PlayerStats); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    // This would compare against historical averages
    // For now, just basic range checks
    if (stats.passingYards > 600) {
      info.push({
        field: 'passingYards';
  message: 'Exceptionally high passing yards for single game';
        value: stats.passingYards;
  code: 'HIGH_PASSING_YARDS'
       });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  // Weather validation methods
  private validateTemperature(weather: WeatherData); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (weather.temperature < -20 || weather.temperature > 120) {
      warnings.push({
        field: 'temperature';
  message: 'Temperature outside typical range for NFL games';
        value: weather.temperature;
  suggestion: 'Verify temperature reading';
        code: 'EXTREME_TEMPERATURE'
       });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validateWind(weather: WeatherData); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (weather.windSpeed < 0) {
      errors.push({
        field: 'windSpeed';
  message: 'Wind speed cannot be negative';
        value: weather.windSpeed;
  code: 'NEGATIVE_WIND_SPEED'
       });
    }

    if (weather.windSpeed > 50) {
      warnings.push({
        field: 'windSpeed';
  message: 'Extremely high wind speed for NFL game';
        value: weather.windSpeed;
  suggestion: 'Verify wind conditions';
        code: 'HIGH_WIND_SPEED'
      });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  private validatePrecipitation(weather: WeatherData); ValidationResult { const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const info: ValidationInfo[] = [];

    if (weather.precipitation < 0) {
      errors.push({
        field: 'precipitation';
  message: 'Precipitation cannot be negative';
        value: weather.precipitation;
  code: 'NEGATIVE_PRECIPITATION'
       });
    }

    return { isValid: errors.length === 0, errors, warnings, info }
  }

  // Utility methods
  private runValidationRules<T>(
    rules: ValidationRule<T>[];
  data, T, 
    context?: any
  ): ValidationResult { const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    const allInfo: ValidationInfo[] = [];

    for (const rule of rules) {
      try {
        const result = rule.validate(data: context);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
        allInfo.push(...result.info);} catch (error) {
        allErrors.push({
          field: 'validation_rule';
  message: `Rule '${rule.name}' faile,
  d: ${(error as Error).message}`,
          value, null,
  code: 'RULE_EXECUTION_ERROR'
        });
      }
    }

    return {
      isValid: allErrors.length === 0;
  errors, allErrors,
      warnings, allWarnings,
  info: allInfo
    }
  }

  private createErrorResult(code, string,
  message: string); ValidationResult { return {
      isValid, false,
  errors: [{
  field: 'system';
        message: value, null,
        code
       }],
      warnings: [];
  info: []
    }
  }

  private recordValidation(startTime, number,
  result: ValidationResult); void { const validationTime = Date.now() - startTime;
    this.validationTimes.push(validationTime);
    
    if (this.validationTimes.length > this.maxValidationTimes) {
      this.validationTimes.shift();
     }

    this.metrics.totalValidations++;
    this.metrics.errorCount += result.errors.length;
    this.metrics.warningCount += result.warnings.length;
    this.metrics.infoCount += result.info.length;
    this.metrics.lastValidation = new Date();

    if (result.isValid) {
      this.metrics.successfulValidations++;
    }

    this.metrics.averageValidationTime = 
      this.validationTimes.reduce((a, b) => a + b, 0) / this.validationTimes.length;

    // Track error types
    for (const error of result.errors) {
      this.metrics.errorsByType[error.code] = (this.metrics.errorsByType[error.code] || 0) + 1;
    }

    // Track warning types
    for (const warning of result.warnings) {
      this.metrics.warningsByType[warning.code] = (this.metrics.warningsByType[warning.code] || 0) + 1;
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.metrics.validationRate = this.metrics.totalValidations > 0
        ? (this.metrics.successfulValidations / this.metrics.totalValidations) * 100 : 0;

      this.emit('metrics:updated', this.getMetrics());
    }, 60000); // Update every minute
  }

  /**
   * Get validation metrics
   */
  getMetrics(): ValidationMetrics { return { ...this.metrics}
  }

  /**
   * Add custom validation rule
   */
  addValidationRule<T>(
    dataType: 'game' | 'player' | 'stats' | 'weather';
  rule: ValidationRule<T>
  ); void { switch (dataType) {
      case 'game':
      this.gameValidationRules.push(rule as ValidationRule<NFLGame>);
        break;
      break;
    case 'player':
        this.playerValidationRules.push(rule as ValidationRule<NFLPlayer>);
        break;
      case 'stats':
      this.statsValidationRules.push(rule as ValidationRule<PlayerStats>);
        break;
      break;
    case 'weather':
        this.weatherValidationRules.push(rule as ValidationRule<WeatherData>);
        break;
     }

    console.log(`✅ Added custom validation rule '${rule.name}' for ${dataType}`);
  }

  /**
   * Get validation summary report
   */
  getValidationReport(): {
    totalRules, number,
    recentValidations, number,
    topErrors: Array<{ cod,
  e, string, count: number }>;
    topWarnings: Array<{ cod,
  e, string, count: number }>;
    performance: {
  averageTime, number,
      successRate: number,
    }
  } { const topErrors = Object.entries(this.metrics.errorsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, count  }));

    const topWarnings = Object.entries(this.metrics.warningsByType);
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }));

    return {
      totalRules: this.gameValidationRules.length + 
                 this.playerValidationRules.length + 
                 this.statsValidationRules.length + 
                 this.weatherValidationRules.length;
  recentValidations: this.metrics.totalValidations;
      topErrors, topWarnings,
      performance: {
  averageTime: this.metrics.averageValidationTime;
  successRate: this.metrics.validationRate
      }
    }
  }
}

export { DataValidator }