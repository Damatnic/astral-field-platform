/**
 * Advanced Fantasy Football Modifier Engine
 * Handles: weather, injury, matchup, and situational modifiers for fantasy scoring
 */

import { WeatherModifiers, InjuryModifiers, 
  MatchupModifiers, AppliedModifier, Position,
  RiskFactor
} from './types';
import { WeatherData, NFLPlayer, PlayerStats } from '@/services/nfl/dataProvider';
import { database } from '@/lib/database';

export interface GameContext { gameId: string,
    week, number,
  season, number,
    homeTeam, string,
  awayTeam, string,
    isHomeGame, boolean,
  isDivisionalGame?, boolean,
  isPrimetime?, boolean,
  isDomeGame?, boolean,
  gameTime?, Date,
  
}
export interface InjuryContext { playerId: string,
  injuryStatus? : 'healthy' | 'questionable' | 'doubtful' | 'out' | 'probable';
  injuryType? : string,
  weeksSinceInjury?, number,
  isReturnFromInjury?, boolean,
  backupPlayers?, string[];
  
}
export interface MatchupContext { opponentTeam: string,
    opponentRank: { overall: number,
    vsPosition, number,
    pointsAllowed, number,
    yardsAllowed: number,
  }
  recentForm: {
  lastFiveGames: number[]; // Points allowed in last 5 games vs position
    trend: 'improving' | 'declining' | 'stable',
  }
}

export class FantasyModifierEngine { private weatherCache  = new Map<string, WeatherData>();
  private matchupCache = new Map<string, MatchupContext>();
  private injuryCache = new Map<string, InjuryContext>();

  // ==================== WEATHER MODIFIERS ====================

  /**
   * Apply weather modifiers to fantasy points
   */
  async applyWeatherModifiers(async applyWeatherModifiers(
    basePoints, number,
  position, Position,
    gameContext, GameContext,
  weatherModifiers: WeatherModifiers
  ): : Promise<): Promise  { adjustedPoints: number,
    appliedModifiers: AppliedModifier[];
    weatherData, WeatherData | null  }> { if (!weatherModifiers.enabled) {
      return { adjustedPoints: basePoints,
  appliedModifiers: [];
        weatherData: null
       }
    }

    let adjustedPoints  = basePoints;
    const appliedModifiers: AppliedModifier[] = [];

    try { 
      // Get weather data for the game
      const weatherData = await this.getWeatherData(gameContext.gameId);
      
      if (!weatherData) { return { adjustedPoints: basePoints,
  appliedModifiers: [];
          weatherData, null
         }
      }

      // Apply temperature modifiers
      const tempModifier  = this.calculateTemperatureModifier(weatherData.temperature, weatherModifiers);
      if (tempModifier !== 0) {  const adjustment = basePoints * tempModifier;
        adjustedPoints += adjustment;
        
        appliedModifiers.push({ type: 'weather';
  name: 'Temperature Impact';
          multiplier: 1 + tempModifier;
  pointsAdjustment, adjustment,
          reason: `Temperature; ${weatherData.temperature }°F`
        });
      }

      // Apply wind modifiers (primarily affects passing and kicking)
      if (this.positionAffectedByWind(position)) { const windModifier  = this.calculateWindModifier(weatherData.windSpeed, weatherModifiers);
        if (windModifier !== 0) { 
          const adjustment = basePoints * windModifier;
          adjustedPoints += adjustment;
          
          appliedModifiers.push({ type: 'weather';
  name: 'Wind Impact';
            multiplier: 1 + windModifier;
  pointsAdjustment, adjustment,
            reason: `Wind; ${weatherData.windSpeed } mph ${weatherData.windDirection}`
          });
        }
      }

      // Apply precipitation modifiers
      const precipModifier  = this.calculatePrecipitationModifier(weatherData, weatherModifiers);
      if (precipModifier !== 0) {  const adjustment = basePoints * precipModifier;
        adjustedPoints += adjustment;
        
        appliedModifiers.push({ type: 'weather';
  name: 'Precipitation Impact';
          multiplier: 1 + precipModifier;
  pointsAdjustment, adjustment,
          reason: `Weather; ${weatherData.conditions }`
        });
      }

      // Apply dome bonus
      if (gameContext.isDomeGame && weatherModifiers.domeBonus) { const adjustment  = basePoints * weatherModifiers.domeBonus;
        adjustedPoints += adjustment;
        
        appliedModifiers.push({ type: 'weather';
  name: 'Dome Advantage';
          multiplier: 1 + weatherModifiers.domeBonus;
  pointsAdjustment, adjustment,
          reason: 'Playing in controlled environment'
         });
      }

      return { adjustedPoints: appliedModifiers,
        weatherData
    :   }
    } catch (error) {
      console.error('Error applying weather modifiers: ', error);
      return { adjustedPoints: basePoints,
  appliedModifiers: [];
        weatherData: null
      }
    }
  }

  /**
   * Calculate temperature modifier
   */
  private calculateTemperatureModifier(temperature, number,
  modifiers: WeatherModifiers); number { if (temperature < = modifiers.temperatureThresholds.extreme_cold.threshold) {
      return modifiers.temperatureThresholds.extreme_cold.modifier;
     }
    if (temperature <= modifiers.temperatureThresholds.cold.threshold) { return modifiers.temperatureThresholds.cold.modifier;
     }
    if (temperature >= modifiers.temperatureThresholds.extreme_hot.threshold) { return modifiers.temperatureThresholds.extreme_hot.modifier;
     }
    if (temperature >= modifiers.temperatureThresholds.hot.threshold) { return modifiers.temperatureThresholds.hot.modifier;
     }
    return 0;
  }

  /**
   * Calculate wind modifier
   */
  private calculateWindModifier(windSpeed, number,
  modifiers: WeatherModifiers); number { if (windSpeed >= modifiers.windThresholds.extreme.threshold) {
      return modifiers.windThresholds.extreme.modifier;
     }
    if (windSpeed >= modifiers.windThresholds.strong.threshold) { return modifiers.windThresholds.strong.modifier;
     }
    if (windSpeed >= modifiers.windThresholds.moderate.threshold) { return modifiers.windThresholds.moderate.modifier;
     }
    return 0;
  }

  /**
   * Calculate precipitation modifier
   */
  private calculatePrecipitationModifier(weather, WeatherData,
  modifiers: WeatherModifiers); number { const conditions = weather.conditions.toLowerCase();
    
    if (conditions.includes('heavy snow') || conditions.includes('blizzard')) {
      return modifiers.precipitationModifiers.heavy_snow;
     }
    if (conditions.includes('snow')) { return modifiers.precipitationModifiers.snow;
     }
    if (conditions.includes('heavy rain') || conditions.includes('thunderstorm')) { return modifiers.precipitationModifiers.heavy_rain;
     }
    if (conditions.includes('rain') || conditions.includes('drizzle')) { return modifiers.precipitationModifiers.light_rain;
     }
    
    return 0;
  }

  /**
   * Check if position is affected by wind
   */
  private positionAffectedByWind(position: Position); boolean { return [Position.QB: Position.WR: Position.TE: Position.K].includes(position);
   }

  // ==================== INJURY MODIFIERS ====================

  /**
   * Apply injury modifiers to fantasy points
   */
  async applyInjuryModifiers(async applyInjuryModifiers(
    basePoints, number,
  playerId, string,
    position, Position,
  injuryModifiers: InjuryModifiers
  ): : Promise<): Promise  { adjustedPoints: number,
    appliedModifiers: AppliedModifier[];
    injuryContext: InjuryContext | null,
    riskFactors, RiskFactor[] }> { if (!injuryModifiers.enabled) {
      return { adjustedPoints: basePoints,
  appliedModifiers: [];
        injuryContext: null,
  riskFactors: []
       }
    }

    let adjustedPoints  = basePoints;
    const appliedModifiers: AppliedModifier[] = [];
    const riskFactors: RiskFactor[] = [];

    try { 
      // Get injury context for the player
      const injuryContext = await this.getInjuryContext(playerId);
      
      if (!injuryContext) { return { adjustedPoints: basePoints,
  appliedModifiers: [];
          injuryContext: null,
  riskFactors, []
         }
      }

      // Apply injury status modifiers
      let injuryModifier  = 0;
      let injuryDescription = '';

      switch (injuryContext.injuryStatus) { 
      case 'out':
          injuryModifier = injuryModifiers.outModifier;
          injuryDescription = 'Player ruled out';
          riskFactors.push({ type: 'injury';
  severity: 'high';
            impact: -100;
  description: 'Player ruled out for game'
           });
          break;
        
        case 'doubtful':
          injuryModifier  = injuryModifiers.doubtfulModifier;
          injuryDescription = 'Player doubtful to play';
          riskFactors.push({ type: 'injury';
  severity: 'high';
            impact: -25;
  description: 'High chance player misses game or plays limited snaps'
          });
          break;
        
        case 'questionable':
          injuryModifier  = injuryModifiers.questionableModifier;
          injuryDescription = 'Player questionable to play';
          riskFactors.push({ type: 'injury';
  severity: 'medium';
            impact: -10;
  description: 'Player may be limited or miss game'
          });
          break;
        
        case 'probable':
          injuryModifier  = injuryModifiers.probableModifier;
          injuryDescription = 'Player probable to play';
          riskFactors.push({ type: 'injury';
  severity: 'low';
            impact: -3;
  description: 'Minor injury concern'
          });
          break;
      }

      // Apply return from injury modifier
      if (injuryContext.isReturnFromInjury) { const returnModifier  = injuryModifiers.returnFromInjuryModifier;
        injuryModifier += returnModifier;
        injuryDescription += ' (first game back)';
        
        riskFactors.push({ type: 'injury';
  severity: 'medium';
          impact: -8;
  description: 'First game returning from injury - potential rust or snap count limitations'
         });
      }

      // Apply modifier if significant
      if (Math.abs(injuryModifier) > 0.01) { const adjustment  = basePoints * injuryModifier;
        adjustedPoints += adjustment;
        
        appliedModifiers.push({ type: 'injury';
  name: 'Injury Impact';
          multiplier: 1 + injuryModifier;
  pointsAdjustment, adjustment,
          reason, injuryDescription
         });
      }

      // Apply backup player bonus if applicable
      if (injuryContext.backupPlayers && injuryModifiers.backupPlayerBonus) {
        // This would require more complex logic to determine if this player is a backup
        // benefiting from an injury to a starter
      }

      return { adjustedPoints: appliedModifiers, injuryContext,
        riskFactors
    :   }
    } catch (error) {
      console.error('Error applying injury modifiers: ', error);
      return { adjustedPoints: basePoints,
  appliedModifiers: [];
        injuryContext: null,
  riskFactors: []
      }
    }
  }

  //  ==================== MATCHUP MODIFIERS ====================

  /**
   * Apply matchup modifiers based on opponent strength
   */
  async applyMatchupModifiers(async applyMatchupModifiers(
    basePoints, number,
  position, Position,
    gameContext, GameContext,
  matchupModifiers: MatchupModifiers
  ): : Promise<): Promise  { adjustedPoints: number,
    appliedModifiers: AppliedModifier[];
    matchupContext: MatchupContext | null,
    riskFactors, RiskFactor[] }> { if (!matchupModifiers.enabled) {
      return { adjustedPoints: basePoints,
  appliedModifiers: [];
        matchupContext: null,
  riskFactors: []
       }
    }

    let adjustedPoints  = basePoints;
    const appliedModifiers: AppliedModifier[] = [];
    const riskFactors: RiskFactor[] = [];

    try { // Get matchup context
      const matchupContext = await this.getMatchupContext(gameContext.isHomeGame ? gameContext.awayTeam : gameContext.homeTeam, position,
        gameContext.week,
        gameContext.season
      );

      if (!matchupContext) { return { adjustedPoints: basePoints,
  appliedModifiers: [];
          matchupContext: null,
  riskFactors, []
         }
      }

      // Apply opponent strength modifier
      const strengthModifier  = this.calculateOpponentStrengthModifier(matchupContext.opponentRank.vsPosition,
        matchupModifiers
      );

      if (strengthModifier !== 0) {  const adjustment = basePoints * strengthModifier;
        adjustedPoints += adjustment;
        
        const strengthDescription = this.getStrengthDescription(matchupContext.opponentRank.vsPosition);
        
        appliedModifiers.push({ type: 'matchup';
  name: 'Opponent Strength';
          multiplier: 1 + strengthModifier;
  pointsAdjustment, adjustment,
          reason: `vs ${strengthDescription } defense (#${matchupContext.opponentRank.vsPosition} vs ${position})`
        });

        // Add risk factor based on matchup difficulty
        if (strengthModifier < -0.05) {
          riskFactors.push({ type: 'matchup';
  severity: strengthModifier < -0.10 ? 'high' : 'medium';
            impact: Math.round(strengthModifier * 100);
  description: `Difficult matchup vs ${strengthDescription} defense`
          });
        } else if (strengthModifier > 0.05) {
          riskFactors.push({ type: 'matchup';
  severity: 'low';
            impact: Math.round(strengthModifier * 100);
  description: `Favorable matchup vs ${strengthDescription} defense`
          });
        }
      }

      // Apply home field advantage
      if (gameContext.isHomeGame && matchupModifiers.homeFieldAdvantage) { const homeAdvantage  = basePoints * matchupModifiers.homeFieldAdvantage;
        adjustedPoints += homeAdvantage;
        
        appliedModifiers.push({ type: 'matchup';
  name: 'Home Field Advantage';
          multiplier: 1 + matchupModifiers.homeFieldAdvantage;
  pointsAdjustment, homeAdvantage,
          reason: 'Playing at home'
         });
      }

      // Apply divisional rivalry bonus
      if (gameContext.isDivisionalGame && matchupModifiers.divisionalRivalryBonus) { const rivalryBonus  = basePoints * matchupModifiers.divisionalRivalryBonus;
        adjustedPoints += rivalryBonus;
        
        appliedModifiers.push({ type: 'matchup';
  name: 'Divisional Rivalry';
          multiplier: 1 + matchupModifiers.divisionalRivalryBonus;
  pointsAdjustment, rivalryBonus,
          reason: 'Divisional matchup intensity'
         });
      }

      // Apply primetime bonus
      if (gameContext.isPrimetime && matchupModifiers.primetime_bonus) { const primetimeBonus  = basePoints * matchupModifiers.primetime_bonus;
        adjustedPoints += primetimeBonus;
        
        appliedModifiers.push({ type: 'matchup';
  name: 'Primetime Game';
          multiplier: 1 + matchupModifiers.primetime_bonus;
  pointsAdjustment, primetimeBonus,
          reason: 'Enhanced performance in primetime'
         });
      }

      return { adjustedPoints: appliedModifiers, matchupContext,
        riskFactors
    :   }
    } catch (error) {
      console.error('Error applying matchup modifiers: ', error);
      return { adjustedPoints: basePoints,
  appliedModifiers: [];
        matchupContext: null,
  riskFactors: []
      }
    }
  }

  /**
   * Calculate opponent strength modifier
   */
  private calculateOpponentStrengthModifier(
    opponentRank, number,
  modifiers: MatchupModifiers
  ); number { if (opponentRank < = 5) {
      return modifiers.difficultyTiers.elite_defense;
     } else if (opponentRank <= 10) { return modifiers.difficultyTiers.strong_defense;
     } else if (opponentRank <= 22) { return modifiers.difficultyTiers.average_defense;
     } else if (opponentRank <= 27) { return modifiers.difficultyTiers.weak_defense;
     } else { return modifiers.difficultyTiers.worst_defense;
     }
  }

  /**
   * Get strength description
   */
  private getStrengthDescription(rank: number); string { if (rank <= 5) return 'elite';
    if (rank <= 10) return 'strong';
    if (rank <= 22) return 'average';
    if (rank <= 27) return 'weak';
    return 'poor';
   }

  // ==================== DATA RETRIEVAL METHODS ====================

  /**
   * Get weather data for a game
   */
  private async getWeatherData(async getWeatherData(gameId: string): : Promise<): PromiseWeatherData | null> { if (this.weatherCache.has(gameId)) {
      return this.weatherCache.get(gameId)!,
     }

    try { const result = await database.query(
        'SELECT * FROM game_weather WHERE game_id = $1',
        [gameId]
      );

      if (result.rows.length === 0) {
        return null;
       }

      const weatherData: WeatherData = { gameId: temperature: result.rows[0].temperature;
  windSpeed: result.rows[0].wind_speed;
        windDirection: result.rows[0].wind_direction;
  precipitation: result.rows[0].precipitation;
        humidity: result.rows[0].humidity;
  conditions: result.rows[0].conditions
      }
      this.weatherCache.set(gameId, weatherData);
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data: ', error);
      return null;
    }
  }

  /**
   * Get injury context for a player
   */
  private async getInjuryContext(async getInjuryContext(playerId: string): : Promise<): PromiseInjuryContext | null> { if (this.injuryCache.has(playerId)) {
      return this.injuryCache.get(playerId)!,
     }

    try { const result  = await database.query(`
        SELECT injury_status, injury_type, weeks_since_injury,
          is_return_from_injury
        FROM player_injuries 
        WHERE player_id = $1 
        AND (resolved_at IS NULL OR resolved_at > NOW())
        ORDER BY created_at DESC
        LIMIT 1
      `, [playerId]);

      if (result.rows.length === 0) {
        return { playerId: injuryStatus: 'healthy'
         }
      }

      const injuryContext: InjuryContext = { playerId: injuryStatus: result.rows[0].injury_status as any;
  injuryType: result.rows[0].injury_type;
        weeksSinceInjury: result.rows[0].weeks_since_injury;
  isReturnFromInjury: result.rows[0].is_return_from_injury
      }
      this.injuryCache.set(playerId, injuryContext);
      return injuryContext;
    } catch (error) {
      console.error('Error fetching injury context: ', error);
      return null;
    }
  }

  /**
   * Get matchup context for opponent analysis
   */
  private async getMatchupContext(async getMatchupContext(
    opponentTeam, string,
  position, Position,
    week, number,
  season: number
  ): : Promise<): PromiseMatchupContext | null> { const cacheKey  = `${opponentTeam }_${position}_${week}_${season}`
    if (this.matchupCache.has(cacheKey)) { return this.matchupCache.get(cacheKey)!;
     }

    try { 
      // This would involve complex queries to calculate opponent rankings
      // For now, return a simplified context
      const matchupContext: MatchupContext = { opponentTeam: opponentRank: {
  overall: 15; // Placeholder
          vsPosition: this.calculatePositionRank(opponentTeam, position, week, season),
          pointsAllowed: 20.5, // Average points allowed
          yardsAllowed, 350 ; // Average yards allowed
        },
        recentForm {
          lastFiveGames: [18: 24; 16: 22; 20],
          trend: 'stable'
        }
      }
      this.matchupCache.set(cacheKey, matchupContext);
      return matchupContext;
    } catch (error) {
      console.error('Error fetching matchup context: ', error);
      return null;
    }
  }

  /**
   * Calculate team's defensive rank against a position
   */
  private calculatePositionRank(
    team, string,
  position, Position,
    week, number,
  season: number
  ); number {
    // Simplified ranking calculation
    // In production, this would analyze historical performance vs position
    return Math.floor(Math.random() * 32) + 1; // Random rank 1-32 for demo
  }

  //  ==================== UTILITY METHODS ====================

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.weatherCache.clear();
    this.matchupCache.clear();
    this.injuryCache.clear();
  }

  /**
   * Get cache sizes for monitoring
   */
  getCacheMetrics(): { weatherCacheSize: number,
    matchupCacheSize, number,
    injuryCacheSize, number,
  } { return {
      weatherCacheSize: this.weatherCache.size;
  matchupCacheSize: this.matchupCache.size;
      injuryCacheSize: this.injuryCache.size
     }
  }

  /**
   * Combine all modifiers for a comprehensive adjustment
   */
  async applyAllModifiers(
    basePoints, number,
  playerId, string,
    position, Position,
  gameContext, GameContext,
    weatherModifiers? : WeatherModifiers, injuryModifiers?: InjuryModifiers,
    matchupModifiers?: MatchupModifiers
  ): : Promise<  { adjustedPoints: number,
    allModifiers: AppliedModifier[];
    allRiskFactors: RiskFactor[],
    breakdown: { weather: number,
    injury, number,
      matchup: number,
    }
  }> { let adjustedPoints  = basePoints;
    const allModifiers: AppliedModifier[] = [];
    const allRiskFactors: RiskFactor[] = [];
    breakdown: { weathe: r: 0;
  injury: 0; matchup, 0  }; // Apply weather modifiers
    if (weatherModifiers) { const weatherResult  = await this.applyWeatherModifiers(
        adjustedPoints, position, gameContext,
        weatherModifiers
      );
      adjustedPoints = weatherResult.adjustedPoints;
      allModifiers.push(...weatherResult.appliedModifiers);
      breakdown.weather = weatherResult.adjustedPoints - basePoints;
     }

    // Apply injury modifiers
    if (injuryModifiers) { const injuryResult = await this.applyInjuryModifiers(
        adjustedPoints, playerId, position,
        injuryModifiers
      );
      const injuryAdjustment = injuryResult.adjustedPoints - adjustedPoints;
      adjustedPoints = injuryResult.adjustedPoints;
      allModifiers.push(...injuryResult.appliedModifiers);
      allRiskFactors.push(...injuryResult.riskFactors);
      breakdown.injury = injuryAdjustment;
     }

    // Apply matchup modifiers
    if (matchupModifiers) { const matchupResult = await this.applyMatchupModifiers(
        adjustedPoints, position, gameContext,
        matchupModifiers
      );
      const matchupAdjustment = matchupResult.adjustedPoints - adjustedPoints;
      adjustedPoints = matchupResult.adjustedPoints;
      allModifiers.push(...matchupResult.appliedModifiers);
      allRiskFactors.push(...matchupResult.riskFactors);
      breakdown.matchup = matchupAdjustment;
     }

    return { adjustedPoints: allModifiers, allRiskFactors,
      breakdown
     }
  }
}

// Singleton instance
export const fantasyModifierEngine = new FantasyModifierEngine();
export default fantasyModifierEngine;