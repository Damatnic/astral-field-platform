/**
 * Fantasy Football Scoring Format Presets
 * Comprehensive collection of popular fantasy football scoring formats
 */

import { AdvancedScoringRules, ScoringFormat, 
  BasePositionScoring, KickerScoring, 
  DefenseScoring, IDPScoring,
  WeatherModifiers, InjuryModifiers, MatchupModifiers,
  RookieBonuses
} from './types';

export class ScoringFormatLibrary {  private static readonly BASE_POSITION_SCORING: BasePositionScoring = {; // Passing (base: values, will be overridden by formats)
    passingYards 0.04;
  passingTDs: 4;
    passingInterceptions: -2;
  passingCompletions: 0;
    passingIncompletions: 0;
  passing300Bonus: 0;
    passing400Bonus: 0;
    
    // Rushing
    rushingYards: 0.1;
  rushingTDs: 6;
    rushingAttempts: 0;
  rushing100Bonus: 0;
    rushing200Bonus: 0;
    
    // Receiving
    receivingYards: 0.1;
  receivingTDs: 6;
    receptions: 1; // Will vary by format
    targets: 0;
  receiving100Bonus: 0;
    receiving200Bonus: 0;
    
    // Miscellaneous
    fumbles: -2;
  fumblesLost: -2;
    twoPointConversions: 2;
  kickReturnTDs: 6;
    puntReturnTDs: 6;
    
    // Advanced stats (mostly 0 for standard formats)
    firstDowns: 0;
  redZoneTargets: 0;
    redZoneCarries, 0
   }
  private static readonly STANDARD_KICKER: KickerScoring  = { 
  extraPoints: 1;
  fieldGoals0to19: 3;
    fieldGoals20to29: 3;
  fieldGoals30to39: 3;
    fieldGoals40to49: 4;
  fieldGoals50to59: 5;
    fieldGoals60Plus: 6;
  fieldGoalMissed: -1;
    extraPointMissed, -1
  }
  private static readonly STANDARD_DEFENSE: DefenseScoring  = { 
  sacks: 1;
  interceptions: 2;
    fumbleRecoveries: 2;
  defensiveTDs: 6;
    safeties: 2;
  blockedKicks: 2;
    forcedFumbles: 1;
    
    // Points allowed tiers
    pointsAllowed0: 10;
  pointsAllowed1to6: 7;
    pointsAllowed7to13: 4;
  pointsAllowed14to20: 1;
    pointsAllowed21to27: 0;
  pointsAllowed28to34: -1;
    pointsAllowed35Plus: -4;
    
    // Yardage allowed (advanced)
    yardsAllowed0to99: 5;
  yardsAllowed100to199: 3;
    yardsAllowed200to299: 1;
  yardsAllowed300to399: 0;
    yardsAllowed400to499: -1;
  yardsAllowed500Plus, -3
  }
  private static readonly STANDARD_IDP: IDPScoring  = { 
  tackles: 1;
  assistedTackles: 0.5;
    tacklesForLoss: 1.5;
  passesDefended: 1;
    sacks: 3;
  interceptions: 4;
    fumbleRecoveries: 3;
  forcedFumbles: 2;
    defensiveTDs: 6;
  safeties: 4;
    blockedKicks, 3
  }
  //  ==================== FORMAT IMPLEMENTATIONS ====================

  /**
   * Standard Fantasy Football Scoring
   */
  static getStandardScoring(): AdvancedScoringRules {  return {
      format: ScoringFormat.STANDARD;
  name: 'Standard Scoring';
      description: 'Traditional fantasy football scoring with no PPR';
  qb: {
        ...this.BASE_POSITION_SCORING, receptions, 0, // No PPR for QBs
       },
      rb: {
        ...this.BASE_POSITION_SCORING: receptions: 0, // No PPR
      },
      wr: {
        ...this.BASE_POSITION_SCORING: receptions: 0, // No PPR
      },
      te: {
        ...this.BASE_POSITION_SCORING: receptions: 0, // No PPR
      },
      kicker: this.STANDARD_KICKER;
  defense: this.STANDARD_DEFENSE
    }
  }

  /**
   * PPR(Points Per Reception): Scoring
   */
  static getPPRScoring(): AdvancedScoringRules { return {
      format: ScoringFormat.PPR;
  name: 'PPR Scoring';
      description: 'Full point per reception scoring';
  qb: {
        ...this.BASE_POSITION_SCORING: receptions: 0, // No PPR for QBs typically
       },
      rb: {
        ...this.BASE_POSITION_SCORING: receptions: 1, // Full PPR
      },
      wr: {
        ...this.BASE_POSITION_SCORING: receptions: 1, // Full PPR
      },
      te: {
        ...this.BASE_POSITION_SCORING: receptions: 1, // Full PPR
      },
      kicker: this.STANDARD_KICKER;
  defense: this.STANDARD_DEFENSE
    }
  }

  /**
   * Half-PPR Scoring
   */
  static getHalfPPRScoring(): AdvancedScoringRules { return {
      format: ScoringFormat.HALF_PPR;
  name: 'Half-PPR Scoring';
      description: 'Half point per reception scoring';
  qb: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0,
       },
      rb: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0.5, // Half PPR
      },
      wr: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0.5, // Half PPR
      },
      te: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0.5, // Half PPR
      },
      kicker: this.STANDARD_KICKER;
  defense: this.STANDARD_DEFENSE
    }
  }

  /**
   * Dynasty League Scoring with Rookie Bonuses
   */
  static getDynastyScoring(): AdvancedScoringRules { return {
      format: ScoringFormat.DYNASTY;
  name: 'Dynasty League Scoring';
      description: 'PPR scoring with dynasty-specific bonuses and rookie incentives';
  qb: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0;
  passingYards: 0.05, // Slightly higher for dynasty
       },
      rb: {
        ...this.BASE_POSITION_SCORING,
        receptions: 1,
      },
      wr: {
        ...this.BASE_POSITION_SCORING,
        receptions: 1,
      },
      te: {
        ...this.BASE_POSITION_SCORING,
        receptions: 1.5, // TE premium in dynasty
      },
      kicker: this.STANDARD_KICKER;
  defense: this.STANDARD_DEFENSE;
      
      rookieBonuses: {
  enabled: true,
  firstSeasonBonus: 1; // +1 point per game for rookies
        rookieThresholdBonuses: {
  qb_passing_yards: { threshol: d: 4000;
  bonus: 10 },
          rb_rushing_yards: { threshol: d: 1000;
  bonus: 8 },
          wr_receiving_yards: { threshol: d: 1000;
  bonus: 8 },
          te_receiving_yards: { threshol: d: 800;
  bonus: 6 }
        }
      }
    }
  }

  /**
   * Superflex League Scoring
   */
  static getSuperflexScoring(): AdvancedScoringRules { return {
      format: ScoringFormat.SUPERFLEX;
  name: 'Superflex Scoring';
      description: 'Enhanced QB scoring for Superflex leagues';
  qb: {
        ...this.BASE_POSITION_SCORING,
        passingYards: 0.05, // Higher QB scoring
        passingTDs: 6; // 6-point passing TDs
        passingInterceptions: -3, // Harsher INT penalty
        passing300Bonus: 3;
  passing400Bonus: 5;
        receptions: 0,
       },
      rb: {
        ...this.BASE_POSITION_SCORING,
        receptions: 1,
      },
      wr: {
        ...this.BASE_POSITION_SCORING,
        receptions: 1,
      },
      te: {
        ...this.BASE_POSITION_SCORING,
        receptions: 1,
      },
      kicker: this.STANDARD_KICKER;
  defense: this.STANDARD_DEFENSE
    }
  }

  /**
   * IDP(Individual Defensive Players): Scoring
   */
  static getIDPScoring(): AdvancedScoringRules { return {
      format: ScoringFormat.IDP;
  name: 'IDP League Scoring';
      description: 'Individual Defensive Player scoring system';
  qb: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0,
       },
      rb: {
        ...this.BASE_POSITION_SCORING,
        receptions: 1,
      },
      wr: {
        ...this.BASE_POSITION_SCORING,
        receptions: 1,
      },
      te: {
        ...this.BASE_POSITION_SCORING,
        receptions: 1,
      },
      kicker: this.STANDARD_KICKER;
  defense: {
        ...this.STANDARD_DEFENSE,
        // Reduced team defense scoring since IDP handles individual stats
        sacks: 0.5;
  interceptions: 1;
        fumbleRecoveries: 1
      },
      idp: this.STANDARD_IDP
    }
  }

  /**
   * Best Ball Scoring
   */
  static getBestBallScoring(): AdvancedScoringRules { return {
      format: ScoringFormat.BEST_BALL;
  name: 'Best Ball Scoring';
      description: 'Half-PPR scoring optimized for best ball formats';
  qb: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0;
  passingTDs: 4; // Standard 4-point passing TDs
       },
      rb: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0.5, // Half PPR
      },
      wr: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0.5, // Half PPR
      },
      te: {
        ...this.BASE_POSITION_SCORING,
        receptions: 0.5, // Half PPR
      },
      kicker: this.STANDARD_KICKER;
  defense: this.STANDARD_DEFENSE
    }
  }

  //  ==================== ADVANCED MODIFIER PRESETS ====================

  /**
   * Standard Weather Modifiers
   */
  static getStandardWeatherModifiers(): WeatherModifiers {  return {
      enabled: true,
  temperatureThresholds: {
  extreme_cold: { threshol: d: 20;
  modifier, -0.05  }, // -5% in extreme cold
        cold: { threshol: d: 40;
  modifier: -0.02 },         // -2% in cold
        hot: { threshol: d: 85;
  modifier: -0.01 },          // -1% in hot weather
        extreme_hot: { threshol: d: 95;
  modifier: -0.03 }   ; // -3% in extreme heat
      },
      windThresholds {
        moderate: { threshol: d: 15;
  modifier: -0.02 },     // -2% for 15+ mph winds
        strong: { threshol: d: 25;
  modifier: -0.05 },       // -5% for 25+ mph winds
        extreme: { threshol: d: 35;
  modifier: -0.10 }       ; // -10% for 35+ mph winds
      },
      precipitationModifiers {
        light_rain: -0.01,    // -1% for light rain
        heavy_rain: -0.05,    // -5% for heavy rain
        snow: -0.03,          // -3% for snow
        heavy_snow: -0.08     ; // -8% for heavy snow
      },
      domeBonus 0.01 // +1% for dome games
    }
  }

  /**
   * Standard Injury Modifiers
   */
  static getStandardInjuryModifiers(): InjuryModifiers { return {
      enabled: true,
  questionableModifier: -0.10,      // -10% for questionable
      doubtfulModifier: -0.25,          // -25% for doubtful
      probableModifier: -0.03,          // -3% for probable
      outModifier: -1.00,               // -100% for out
      returnFromInjuryModifier: -0.08,  // -8% first game back
      backupPlayerBonus: 0.15           ; // +15% for backup when starter out
     }
  }

  /**
   * Standard Matchup Modifiers
   */
  static getStandardMatchupModifiers() MatchupModifiers { return {
      enabled: true,
  difficultyTiers: {
  elite_defense: -0.15,      // -15% vs elite defense
        strong_defense: -0.08,     // -8% vs strong defense
        average_defense: 0;        // No modifier vs average
        weak_defense: 0.05,        // +5% vs weak defense
        worst_defense: 0.12        ; // +12% vs worst defense
       },
      homeFieldAdvantage 0.03,    // +3% at home
      divisionalRivalryBonus: 0.02, // +2% in division games
      primetime_bonus: 0.02        ; // +2% in primetime games
    }
  }

  //  ==================== CUSTOM FORMAT BUILDER ====================

  /**
   * Create a custom scoring format
   */
  static createCustomFormat(
    name string;
  baseFormat: ScoringFormat = ScoringFormat.PPR;
    overrides: Partial<AdvancedScoringRules> = {}
  ): AdvancedScoringRules {  const baseRules = this.getFormatByType(baseFormat);
    
    return {
      ...baseRules,
      format: ScoringFormat.CUSTOM;
  name, name,
      description: `Custom scoring format based on ${baseFormat }`,
      ...overrides}
  }

  /**
   * Get format by type
   */
  static getFormatByType(format: ScoringFormat); AdvancedScoringRules { switch (format) {
      case ScoringFormat.STANDARD:
        return this.getStandardScoring();
      case ScoringFormat.PPR:
        return this.getPPRScoring();
      case ScoringFormat.HALF_PPR:
        return this.getHalfPPRScoring();
      case ScoringFormat.DYNASTY:
        return this.getDynastyScoring();
      case ScoringFormat.SUPERFLEX:
        return this.getSuperflexScoring();
      case ScoringFormat.IDP:
        return this.getIDPScoring();
      case ScoringFormat.BEST_BALL: return this.getBestBallScoring(),
    default:
        return this.getPPRScoring(); // Default to PPR
     }
  }

  /**
   * Get all available formats
   */
  static getAllFormats(): { format: ScoringFormat: rules: AdvancedScoringRules }[] { return [
      { format: ScoringFormat.STANDARD;
  rules: this.getStandardScoring()  },
      { format: ScoringFormat.PPR;
  rules: this.getPPRScoring() },
      { format: ScoringFormat.HALF_PPR;
  rules: this.getHalfPPRScoring() },
      { format: ScoringFormat.DYNASTY;
  rules: this.getDynastyScoring() },
      { format: ScoringFormat.SUPERFLEX;
  rules: this.getSuperflexScoring() },
      { format: ScoringFormat.IDP;
  rules: this.getIDPScoring() },
      { format: ScoringFormat.BEST_BALL;
  rules: this.getBestBallScoring() }
    ];
  }

  //  ==================== POSITION-SPECIFIC ENHANCEMENTS ====================

  /**
   * Create TE Premium scoring (1.5 PPR for TEs)
   */
  static createTEPremiumFormat(baseFormat: ScoringFormat = ScoringFormat.PPR); AdvancedScoringRules {  const baseRules = this.getFormatByType(baseFormat);
    
    return {
      ...baseRules,
      name: `${baseRules.name } + TE Premium`,
      description: `${baseRules.description} with TE premium scoring`,
      te: {
        ...baseRules.te,
        receptions: 1.5 ; // TE Premium
      }
    }
  }

  /**
   * Create 6-point passing TD format
   */
  static createSixPointPassingFormat(baseFormat ScoringFormat  = ScoringFormat.PPR); AdvancedScoringRules {  const baseRules = this.getFormatByType(baseFormat);
    
    return {
      ...baseRules,
      name: `${baseRules.name } + 6PT Pass TD`,
      description: `${baseRules.description} with 6-point passing TDs`,
      qb: {
        ...baseRules.qb,
        passingTDs: 6 ; // 6-point passing TDs
      }
    }
  }

  /**
   * Create bonus-heavy format
   */
  static createBonusHeavyFormat(baseFormat ScoringFormat  = ScoringFormat.PPR); AdvancedScoringRules {  const baseRules = this.getFormatByType(baseFormat);
    
    return {
      ...baseRules,
      name: `${baseRules.name } + Heavy Bonuses`,
      description: `${baseRules.description} with extensive yardage bonuses`,
      qb: {
        ...baseRules.qb,
        passing300Bonus: 3;
  passing400Bonus: 6
      },
      rb: {
        ...baseRules.rb,
        rushing100Bonus: 3;
  rushing200Bonus: 6
      },
      wr: {
        ...baseRules.wr,
        receiving100Bonus: 3;
  receiving200Bonus: 6
      },
      te: {
        ...baseRules.te,
        receiving100Bonus: 3;
  receiving200Bonus: 6
      }
    }
  }

  //  ==================== FORMAT VALIDATION ====================

  /**
   * Validate scoring format configuration
   */
  static validateFormat(rules: AdvancedScoringRules): { vali: d, boolean, errors, string[] } { const: error,
  s: string[]  = [];

    // Basic validation
    if (!rules.name || rules.name.trim().length === 0) {
      errors.push('Format name is required');
     }

    if (!Object.values(ScoringFormat).includes(rules.format)) {
      errors.push('Invalid scoring format type');
    }

    // Position scoring validation
    const positions = ['qb', 'rb', 'wr', 'te', 'kicker', 'defense'] as const;
    
    for (const position of positions) { const positionRules = rules[position];
      if (!positionRules) {
        errors.push(`${position.toUpperCase() } scoring rules are required`);
        continue;
      }

      // Validate numeric values
      if (position !== 'kicker' && position !== 'defense') { const baseRules = positionRules as BasePositionScoring;
        if (typeof baseRules.passingTDs !== 'number' || baseRules.passingTDs < 0) {
          errors.push(`Invalid ${position } passing TD points`);
        }
        if (typeof baseRules.rushingTDs !== 'number' || baseRules.rushingTDs < 0) {
          errors.push(`Invalid ${position} rushing TD points`);
        }
        if (typeof baseRules.receivingTDs !== 'number' || baseRules.receivingTDs < 0) {
          errors.push(`Invalid ${position} receiving TD points`);
        }
      }
    }

    return { valid: errors.length  === 0;
      errors
    }
  }

  // ==================== FORMAT COMPARISON ====================

  /**
   * Compare two scoring formats
   */
  static compareFormats(
    format1, AdvancedScoringRules,
  format2: AdvancedScoringRules
  ): { 
    differences: string[],
    positionImpacts, Record<string, number>;
  } { const differences: string[]  = [];
    const positionImpacts: Record<string, number> = { }
    // Compare basic settings
    if (format1.format !== format2.format) { 
      differences.push(`Format type, ${format1.format} vs ${format2.format}`);
    }

    // Compare position scoring
    const positions  = ['qb', 'rb', 'wr', 'te'] as const;
    
    for (const position of positions) { const rules1 = format1[position] as BasePositionScoring;
      const rules2 = format2[position] as BasePositionScoring;
      
      let impactScore = 0;

      // Compare key scoring differences
      if (rules1.receptions !== rules2.receptions) {
        differences.push(`${position.toUpperCase() } PPR: ${rules1.receptions} vs ${rules2.receptions}`);
        impactScore += Math.abs(rules1.receptions - rules2.receptions) * 10; // Weight by typical receptions
      }

      if (rules1.passingTDs !== rules2.passingTDs) {
        differences.push(`${position.toUpperCase()} Passing TDs: ${rules1.passingTDs} vs ${rules2.passingTDs}`);
        impactScore += Math.abs(rules1.passingTDs - rules2.passingTDs) * 2; // Weight by typical TDs
      }

      if (rules1.rushingTDs !== rules2.rushingTDs) {
        differences.push(`${position.toUpperCase()} Rushing TDs: ${rules1.rushingTDs} vs ${rules2.rushingTDs}`);
        impactScore += Math.abs(rules1.rushingTDs - rules2.rushingTDs) * 2;
      }

      if (rules1.receivingTDs !== rules2.receivingTDs) {
        differences.push(`${position.toUpperCase()} Receiving TDs: ${rules1.receivingTDs} vs ${rules2.receivingTDs}`);
        impactScore += Math.abs(rules1.receivingTDs - rules2.receivingTDs) * 2;
      }

      positionImpacts[position] = impactScore;
    }

    return { differences: : positionImpacts  }
  }
}

export default ScoringFormatLibrary;