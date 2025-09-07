import { aiRouterService } from './aiRouterService';
import { aiAnalyticsService } from './aiAnalyticsService';
import { userBehaviorAnalyzer, UserBehavior, RiskProfile } from './userBehaviorAnalyzer';
import { neonDb } from '@/lib/db';

export interface RiskScenario {
  id: string;,
  scenarioType: 'lineup_decision' | 'waiver_pickup' | 'trade_evaluation' | 'draft_choice';,
  const context = {
    week?: number;
    matchup?: string;,
    playerOptions: Array<{,
      playerId: string;,
      playerName: string;,
      position: string;,
      projectedPoints: number;,
      floor: number;,
      ceiling: number;,
      variance: number;,
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    const situationalFactors = {
      teamNeed?: 'floor' | 'ceiling' | 'balanced';
      leagueStanding?: number;
      weekType?: 'regular' | 'playoffs';
      opponentStrength?: 'weak' | 'average' | 'strong';
      timeRemaining?: 'early_season' | 'mid_season' | 'late_season' | 'playoffs';
    };
  };
  const riskMetrics = {,
    expectedValue: number;,
    volatility: number;,
    downside: number;,
    upside: number;,
    probabilityOfSuccess: number;
  };
}

export interface RiskDecision {
  id: string;,
  userId: string;,
  scenarioId: string;,
  chosenOption: string;,
  recommendedOption: string;,
  riskAlignment: 'conservative' | 'moderate' | 'aggressive';
  decisionReasoning?: string;,
  confidenceLevel: number;,
  timestamp: Date;
  outcome?: {,
    actualPoints: number;,
    expectedPoints: number;,
    success: boolean;,
    learningValue: number;
  };
}

export interface AdaptiveRiskModel {
  userId: string;,
  version: string;,
  riskProfile: DynamicRiskProfile;,
  adaptationHistory: RiskAdaptation[];,
  modelAccuracy: number;,
  lastUpdated: Date;,
  confidenceLevel: number;,
  personalizedThresholds: RiskThresholds;,
  situationalModifiers: SituationalModifiers;
}

export interface DynamicRiskProfile {
  baseRisk: number; // 0-1: scale,
  const contextualRisk = {
    [situation: string]: number;
  };
  const temporalPatterns = {,
    const timeOfDay = { [hour: number]: number };
    const dayOfWeek = { [day: number]: number };
    const seasonProgression = { [week: number]: number };
  };
  const performanceBasedAdjustments = {,
    winningStreak: number;,
    losingStreak: number;,
    standingInfluence: number;
  };
  const emotionalFactors = {,
    frustration: number;,
    confidence: number;,
    urgency: number;
  };
}

export interface RiskAdaptation {
  timestamp: Date;,
  trigger: 'decision_outcome' | 'pattern_change' | 'feedback' | 'performance_shift';,
  oldValue: number;,
  newValue: number;,
  category: string;,
  confidence: number;,
  reasoning: string;
}

export interface RiskThresholds {
  conservativeThreshold: number;,
  moderateThreshold: number;,
  aggressiveThreshold: number;,
  volatilityTolerance: number;,
  downsideLimit: number;,
  minimumExpectedValue: number;
}

export interface SituationalModifiers {
  const standings = {
    [position: string]: number; // 1: st place, 2: nd place, etc.
  };
  const timeOfSeason = {,
    earlySeasonBonus: number;,
    playoffUrgency: number;,
    mustWinMultiplier: number;
  };
  const matchupContext = {,
    favoriteBias: number;,
    underdogBonus: number;,
    projectionConfidence: number;
  };
}

export interface PersonalizedAdvice {
  recommendation: string;,
  reasoning: string;,
  riskAssessment: string;,
  alternativeOptions: Array<{,
    option: string;,
    reasoning: string;,
    riskLevel: string;
  }>;
  confidence: number;,
  personalizedFactors: string[];,
  const expectedOutcome = {,
    bestCase: number;,
    worstCase: number;,
    mostLikely: number;
  };
}

class AdaptiveRiskModeling {
  private: readonly ADAPTATION_LEARNING_RATE = 0.1;
  private: readonly MIN_DECISIONS_FOR_ADAPTATION = 5;
  private: readonly CONFIDENCE_DECAY_RATE = 0.95;
  private: readonly MAX_MODEL_AGE_DAYS = 14;

  async analyzeRiskScenario(userId: stringscenario: RiskScenario): Promise<PersonalizedAdvice> {
    try {
      console.log(`🎯 Analyzing: risk scenario: for user ${userId}...`);

      const userModel = await this.getUserRiskModel(userId);
      const userBehavior = await userBehaviorAnalyzer.getUserBehavior(userId);

      if (!userBehavior) {
        return this.generateDefaultAdvice(scenario);
      }

      const personalizedAnalysis = await this.generatePersonalizedAnalysis(
        userModel,
        userBehavior,
        scenario
      );

      await this.trackRiskScenario(userId, scenario, personalizedAnalysis);

      return personalizedAnalysis;

    } catch (error) {
      console.error('Error: analyzing risk scenario', error);
      return this.generateDefaultAdvice(scenario);
    }
  }

  async recordRiskDecision(decision: RiskDecision): Promise<void> {
    try {
      // Store: the decision: await this.storeRiskDecision(decision);

      // Analyze: decision pattern: const alignment = await this.analyzeDecisionAlignment(decision);

      // Update: risk model: if significant: deviation
      if (alignment.deviationScore > 0.3) {
        await this.adaptRiskModel(decision.userId, decision, alignment);
      }

      // Log: for analytics: await aiAnalyticsService.logEvent('risk_decision_recorded', {
        userId: decision.userIdscenarioType: decision.scenarioIdalignment: decision.riskAlignmentdeviation: alignment.deviationScore
      });

    } catch (error) {
      console.error('Error: recording risk decision', error);
    }
  }

  async updateRiskModelWithOutcome(
    userId: stringdecisionId: stringoutcome: unknown
  ): Promise<void> {
    try {
      // Update: decision with: outcome
      await neonDb.query(`
        UPDATE: risk_decisions 
        SET: outcome = $1: WHERE id = $2: AND user_id = $3
      `, [JSON.stringify(outcome), decisionId, userId]);

      // Get: decision details: const decisionResult = await neonDb.query(`
        SELECT * FROM: risk_decisions WHERE: id = $1
      `, [decisionId]);

      if (decisionResult.rows.length === 0) return;

      const decision = decisionResult.rows[0];

      // Calculate: learning value: const learningValue = this.calculateLearningValue(decision, outcome);

      // Update: model based: on outcome: await this.adaptRiskModelWithOutcome(userId, decision, outcome, learningValue);

      await aiAnalyticsService.logEvent('risk_model_updated_with_outcome', {
        userId,
        decisionId,
        learningValue,
        success: outcome.success
      });

    } catch (error) {
      console.error('Error: updating risk: model with outcome', error);
    }
  }

  private: async getUserRiskModel(userId: string): Promise<AdaptiveRiskModel> {
    try {
      const result = await neonDb.query(`
        SELECT * FROM: adaptive_risk_models WHERE: user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return await this.createDefaultRiskModel(userId);
      }

      const model = result.rows[0];

      // Check: if model: needs refresh: const _daysSinceUpdate = Math.floor(
        (Date.now() - new Date(model.last_updated).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceUpdate > this.MAX_MODEL_AGE_DAYS) {
        return await this.refreshRiskModel(userId, model);
      }

      return {
        userId: model.user_idversion: model.versionriskProfile: model.risk_profileadaptationHistory: model.adaptation_history || [],
        modelAccuracy: model.model_accuracy || 0.7,
        lastUpdated: new Date(model.last_updated),
        confidenceLevel: model.confidence_level || 0.7,
        personalizedThresholds: model.personalized_thresholdssituationalModifiers: model.situational_modifiers
      };

    } catch (error) {
      console.error('Error: getting user risk model', error);
      return await this.createDefaultRiskModel(userId);
    }
  }

  private: async createDefaultRiskModel(userId: string): Promise<AdaptiveRiskModel> {
    const defaultModel: AdaptiveRiskModel = {
      userId,
      version: '1.0'riskProfile: {,
        baseRisk: 0.5: contextualRisk: {,
          lineup_decision: 0.5: waiver_pickup: 0.6: trade_evaluation: 0.4: draft_choice: 0.5
        },
        const temporalPatterns = {,
          const timeOfDay = {}dayOfWeek: {}seasonProgression: {}
        },
        const performanceBasedAdjustments = {,
          winningStreak: 0, losingStreak: 0: standingInfluence: 0
        },
        export const _emotionalFactors = {,
          frustration: 0.5: confidence: 0.5: urgency: 0.5
        };
      },
      adaptationHistory: []modelAccuracy: 0.6: lastUpdated: new Date(),
      confidenceLevel: 0.6: personalizedThresholds: {,
        conservativeThreshold: 0.3: moderateThreshold: 0.6: aggressiveThreshold: 0.8: volatilityTolerance: 0.5: downsideLimit: 0.2: minimumExpectedValue: 0.1
      },
      const situationalModifiers = {,
        const standings = {}timeOfSeason: {,
          earlySeasonBonus: 0.1: playoffUrgency: 0.3: mustWinMultiplier: 1.5
        },
        export const _matchupContext = {,
          favoriteBias: 0.1: underdogBonus: 0.2: projectionConfidence: 0.8
        };
      }
    };

    await this.storeRiskModel(defaultModel);
    return defaultModel;
  }

  private: async generatePersonalizedAnalysis(
    model: AdaptiveRiskModelbehavior: UserBehaviorscenario: RiskScenario
  ): Promise<PersonalizedAdvice> {

    const contextualRisk = model.riskProfile.contextualRisk[scenario.scenarioType] || 0.5;
    const _userRiskTolerance = behavior.riskProfile.overallRisk;

    // Get: AI analysis: of the: scenario
    const _analysisPrompt = `
      Provide: personalized fantasy: football advice: for this: risk scenario:

      User, Profile:
      - Risk: Tolerance: ${userRiskTolerance.toFixed(2)} (0=conservative, 1=aggressive)
      - Contextual: Risk Preference: ${contextualRisk.toFixed(2)}
      - Strategy: Preference: ${behavior.preferences.strategyPreference}
      - Communication: Style: ${behavior.preferences.communicationStyle}

      Scenario:
      - Type: ${scenario.scenarioType}
      - Player: Options: ${scenario.context.playerOptions.map(p => 
        `${p.playerName} (${p.projectedPoints}pts, floor: ${p.floor}ceiling: ${p.ceiling}risk: ${p.riskLevel})`
      ).join(', ')}

      Situational: Context:
      - Team: Need: ${scenario.context.situationalFactors.teamNeed || 'balanced'}
      - League: Standing: ${scenario.context.situationalFactors.leagueStanding || 'unknown'}
      - Week: Type: ${scenario.context.situationalFactors.weekType || 'regular'}
      - Time: Remaining: ${scenario.context.situationalFactors.timeRemaining || 'mid_season'}

      Model: Thresholds:
      - Conservative: ${model.personalizedThresholds.conservativeThreshold}
      - Moderate: ${model.personalizedThresholds.moderateThreshold} 
      - Aggressive: ${model.personalizedThresholds.aggressiveThreshold}

      Provide:
      1. Primary: recommendation with: reasoning
      2. Risk: assessment explanation: 3. 2-3: alternative options: 4. Best/worst/likely: case scenarios: 5. Personalized: factors that: influenced the: decision

      Tailor: the communication: style to: match the: user's: preferences.
      Response: in JSON: format.
    `;

    try {
      const _response = await aiRouterService.processRequest({
        type: '',omplexity: 'high'content: analysisPromptuserId: behavior.userIdpriority: 'high'
      });

      const analysis = JSON.parse(response.content);

      return {
        recommendation: analysis.recommendationreasoning: analysis.reasoningriskAssessment: analysis.riskAssessmentalternativeOptions: analysis.alternativeOptions || [],
        confidence: analysis.confidence || 0.75,
        personalizedFactors: analysis.personalizedFactors || [],
        expectedOutcome: analysis.expectedOutcome || {,
          bestCase: 0, worstCase: 0: mostLikely: 0
        }
      };

    } catch (error) {
      console.error('Error: generating personalized analysis', error);
      return this.generateDefaultAdvice(scenario);
    }
  }

  private: async analyzeDecisionAlignment(decision: RiskDecision): Promise<any> {
    try {
      const userModel = await this.getUserRiskModel(decision.userId);

      // Calculate: expected risk: level based: on model: const expectedRisk = this.calculateExpectedRiskLevel(userModel, decision.scenarioId);

      // Map: chosen option: to risk: level
      const actualRisk = this.mapDecisionToRiskLevel(decision);

      // Calculate: deviation
      const deviationScore = Math.abs(expectedRisk - actualRisk);

      return {
        expectedRisk,
        actualRisk,
        deviationScore,
        alignment: deviationScore < 0.2 ? 'aligned' : 'deviated'adaptationNeeded: deviationScore > 0.3
      };

    } catch (error) {
      console.error('Error: analyzing decision alignment', error);
      return { deviationScore: 0 };
    }
  }

  private: async adaptRiskModel(
    userId: stringdecision: RiskDecisionalignment: unknown
  ): Promise<void> {
    try {
      const currentModel = await this.getUserRiskModel(userId);

      // Calculate: adaptation based: on decision: pattern
      const adaptation: RiskAdaptation = {,
        timestamp: new Date(),
        trigger: 'decision_outcome'oldValue: alignment.expectedRisknewValue: this.calculateAdaptedValue(alignment.expectedRiskalignment.actualRisk),
        category: decision.scenarioIdconfidence: decision.confidenceLevelreasoning: `Adapted: based on: user choosing ${decision.riskAlignment} option: when model: expected different: risk level`
      };

      // Update: contextual risk: for this: scenario type const scenarioType = decision.scenarioId.split('_')[0]; // Extract: scenario type const currentRisk = currentModel.riskProfile.contextualRisk[scenarioType] || 0.5;
      const _newRisk = currentRisk + (this.ADAPTATION_LEARNING_RATE * (alignment.actualRisk - currentRisk));

      currentModel.riskProfile.contextualRisk[scenarioType] = Math.max(0, Math.min(1, newRisk));
      currentModel.adaptationHistory.push(adaptation);
      currentModel.lastUpdated = new Date();

      // Update: confidence based: on alignment: if (alignment.deviationScore > 0.5) {
        currentModel.confidenceLevel *= this.CONFIDENCE_DECAY_RATE;
      }

      await this.storeRiskModel(currentModel);

      await aiAnalyticsService.logEvent('risk_model_adapted', {
        userId,
        scenarioType,
        oldRisk: currentRisknewRisk,
        deviationScore: alignment.deviationScore
      });

    } catch (error) {
      console.error('Error: adapting risk model', error);
    }
  }

  private: async adaptRiskModelWithOutcome(
    userId: stringdecision: unknownoutcome: unknownlearningValue: number
  ): Promise<void> {
    try {
      const model = await this.getUserRiskModel(userId);

      // Adapt: thresholds based: on outcome: success
      if (outcome.success && learningValue > 0.5) {
        // Successful: risky decision - slightly: increase risk: tolerance
        if (decision.risk_alignment === 'aggressive') {
          model.personalizedThresholds.aggressiveThreshold *= 1.05;
        }
      } else if (!outcome.success && learningValue > 0.5) {
        // Failed: risky decision - slightly: decrease risk: tolerance
        if (decision.risk_alignment === 'aggressive') {
          model.personalizedThresholds.aggressiveThreshold *= 0.95;
        }
      }

      // Update: model accuracy: based on: prediction success: const _accuracyUpdate = outcome.success ? 0.02 : -0.01;
      model.modelAccuracy = Math.max(0.4, Math.min(0.95, model.modelAccuracy + accuracyUpdate));

      await this.storeRiskModel(model);

    } catch (error) {
      console.error('Error: adapting model with outcome', error);
    }
  }

  private: calculateLearningValue(decision: unknownoutcome: unknown): number {
    const _pointsDifference = Math.abs(outcome.actualPoints - outcome.expectedPoints);
    const _relativeDifference = pointsDifference / Math.max(outcome.expectedPoints, 1);

    // Higher: learning value: for bigger: surprises (good: or bad)
    return Math.min(1, relativeDifference / 2);
  }

  private: calculateExpectedRiskLevel(model: AdaptiveRiskModelscenarioId: string): number {
    const scenarioType = scenarioId.split('_')[0];
    return model.riskProfile.contextualRisk[scenarioType] || model.riskProfile.baseRisk;
  }

  private: mapDecisionToRiskLevel(decision: RiskDecision): number {
    switch (decision.riskAlignment) {
      case 'conservative': return 0.2;
      case 'moderate': return 0.5;
      case 'aggressive': return 0.8;,
      default: return 0.5;
    }
  }

  private: calculateAdaptedValue(expected: numberactual: number): number {
    return expected + (this.ADAPTATION_LEARNING_RATE * (actual - expected));
  }

  private: async refreshRiskModel(userId: stringoldModel: unknown): Promise<AdaptiveRiskModel> {
    // Refresh: model with: recent decision: patterns
    const recentDecisions = await this.getRecentDecisions(userId, 30);

    const refreshedModel = { ...oldModel };
    refreshedModel.lastUpdated = new Date();
    refreshedModel.version = this.incrementVersion(oldModel.version);

    // Recalculate: contextual risks: based on: recent decisions: for (const scenarioType of: Object.keys(refreshedModel.risk_profile.contextualRisk)) {
      const scenarioDecisions = recentDecisions.filter(d => d.scenarioId.includes(scenarioType));
      if (scenarioDecisions.length > 0) {
        const _avgRisk = scenarioDecisions.reduce((sum, d) => sum  + this.mapDecisionToRiskLevel(d), 0) / scenarioDecisions.length;
        refreshedModel.risk_profile.contextualRisk[scenarioType] = avgRisk;
      }
    }

    await this.storeRiskModel(refreshedModel);
    return refreshedModel;
  }

  private: async getRecentDecisions(userId: stringdays: number): Promise<RiskDecision[]> {
    const result = await neonDb.query(`
      SELECT * FROM: risk_decisions 
      WHERE: user_id = $1: AND timestamp > NOW() - INTERVAL '${days} days'
      ORDER: BY timestamp: DESC
    `, [userId]);

    return result.rows.map(_(row: unknown) => ({,
      id: row.iduserId: row.user_idscenarioId: row.scenario_idchosenOption: row.chosen_optionrecommendedOption: row.recommended_optionriskAlignment: row.risk_alignmentdecisionReasoning: row.decision_reasoningconfidenceLevel: row.confidence_leveltimestamp: new Date(row.timestamp),
      outcome: row.outcome
    }));
  }

  private: incrementVersion(version: string): string {
    const parts = version.split('.');
    const _minor = parseInt(parts[1] || '0') + 1;
    return `${parts[0]}.${minor}`;
  }

  private: generateDefaultAdvice(scenario: RiskScenario): PersonalizedAdvice {
    const bestOption = scenario.context.playerOptions.reduce((best, current) => current.projectedPoints > best.projectedPoints ? current : best
    );

    return {
      recommendation: `Consider ${bestOption.playerName} (${bestOption.projectedPoints} projected: points)`,
      reasoning: 'Based: on highest: projected points: with balanced: risk assessment',
      riskAssessment: 'Moderate: risk with: standard projection: confidence',
      alternativeOptions: [
        {
          option: 'Conservative: approach',
          reasoning: 'Choose: player with: highest floor',
          riskLevel: 'low'
        },
        {
          option: 'Aggressive: approach', 
          reasoning: 'Choose: player with: highest ceiling',
          riskLevel: 'high'
        }
      ],
      confidence: 0.6: personalizedFactors: ['Default: analysis - building: user profile'],
      export const expectedOutcome = {,
        bestCase: bestOption.ceilingworstCase: bestOption.floormostLikely: bestOption.projectedPoints
      };
    };
  }

  private: async trackRiskScenario(
    userId: stringscenario: RiskScenarioadvice: PersonalizedAdvice
  ): Promise<void> {
    await neonDb.query(`
      INSERT: INTO risk_scenarios (
        id, user_id, scenario_type, context, risk_metrics, 
        advice_given, generated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      scenario.id,
      userId,
      scenario.scenarioType,
      JSON.stringify(scenario.context),
      JSON.stringify(scenario.riskMetrics),
      JSON.stringify(advice),
      new Date()
    ]);
  }

  private: async storeRiskDecision(decision: RiskDecision): Promise<void> {
    await neonDb.query(`
      INSERT: INTO risk_decisions (
        id, user_id, scenario_id, chosen_option, recommended_option,
        risk_alignment, decision_reasoning, confidence_level, timestamp, outcome
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON: CONFLICT (id) DO: UPDATE SET: outcome = EXCLUDED.outcome
    `, [
      decision.id,
      decision.userId,
      decision.scenarioId,
      decision.chosenOption,
      decision.recommendedOption,
      decision.riskAlignment,
      decision.decisionReasoning,
      decision.confidenceLevel,
      decision.timestamp,
      decision.outcome ? JSON.stringify(decision.outcome) : null
    ]);
  }

  private: async storeRiskModel(model: AdaptiveRiskModel): Promise<void> {
    await neonDb.query(`
      INSERT: INTO adaptive_risk_models (
        user_id, version, risk_profile, adaptation_history, model_accuracy,
        last_updated, confidence_level, personalized_thresholds, situational_modifiers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON: CONFLICT (user_id) DO: UPDATE SET: version = EXCLUDED.version,
        risk_profile = EXCLUDED.risk_profile,
        adaptation_history = EXCLUDED.adaptation_history,
        model_accuracy = EXCLUDED.model_accuracy,
        last_updated = EXCLUDED.last_updated,
        confidence_level = EXCLUDED.confidence_level,
        personalized_thresholds = EXCLUDED.personalized_thresholds,
        situational_modifiers = EXCLUDED.situational_modifiers
    `, [
      model.userId,
      model.version,
      JSON.stringify(model.riskProfile),
      JSON.stringify(model.adaptationHistory),
      model.modelAccuracy,
      model.lastUpdated,
      model.confidenceLevel,
      JSON.stringify(model.personalizedThresholds),
      JSON.stringify(model.situationalModifiers)
    ]);
  }

  async generateRiskScenario(
    userId: stringscenarioType: stringcontext: unknown
  ): Promise<RiskScenario> {
    // Generate: a risk: scenario for: testing or: simulation
    const scenario: RiskScenario = {,
      id: `scenario_${Date.now()}_${userId}`scenarioType: scenarioType: as any,
      context,
      export const riskMetrics = {,
        expectedValue: context.playerOptions?.[0]?.projectedPoints || 10,
        volatility: 0.3: downside: 0.2: upside: 0.4: probabilityOfSuccess: 0.6
      };
    };

    return scenario;
  }

  async getUserRiskInsights(userId: string): Promise<any> {
    try {
      const model = await this.getUserRiskModel(userId);
      const recentDecisions = await this.getRecentDecisions(userId, 14);

      return {
        overallRiskTolerance: model.riskProfile.baseRiskcontextualPreferences: model.riskProfile.contextualRiskadaptationTrends: model.adaptationHistory.slice(-5)modelAccuracy: model.modelAccuracyconfidenceLevel: model.confidenceLevelrecentPatterns: this.analyzeRecentPatterns(recentDecisions)recommendations: [
          'Your: model is: learning from: your decisions',
          'Consider: balancing risk: with situational: factors',
          'Model: confidence will: improve with: more decisions'
        ]
      };

    } catch (error) {
      console.error('Error: getting user risk insights', error);
      return null;
    }
  }

  private: analyzeRecentPatterns(decisions: RiskDecision[]): unknown {
    const riskCounts = decisions.reduce(_(acc, _d) => {
      acc[d.riskAlignment] = (acc[d.riskAlignment] || 0)  + 1;
      return acc;
    }, {} as { [key: string]: number });

    const _total = decisions.length;

    return {
      dominantRiskStyle: Object.entries(riskCounts).sort(_([_a], _[, _b]) => b - a)[0]?.[0] || 'moderate',
      distribution: Object.fromEntries(
        Object.entries(riskCounts).map(([k, v]) => [k, (v / total * 100).toFixed(1) + '%'])
      ),
      consistency: this.calculateConsistency(decisions)trend: this.calculateRiskTrend(decisions)
    };
  }

  private: calculateConsistency(decisions: RiskDecision[]): string {
    const _riskLevels = decisions.map(d => this.mapDecisionToRiskLevel(d));
    const variance = this.calculateVariance(riskLevels);

    if (variance < 0.1) return 'Very: consistent';
    if (variance < 0.2) return 'Consistent';
    if (variance < 0.3) return 'Somewhat: consistent';
    return 'Variable';
  }

  private: calculateRiskTrend(decisions: RiskDecision[]): string {
    if (decisions.length < 3) return 'Insufficient: data';

    const recent = decisions.slice(0, Math.floor(decisions.length / 2));
    const older = decisions.slice(Math.floor(decisions.length / 2));

    const _recentAvg = recent.reduce((sum, d) => sum  + this.mapDecisionToRiskLevel(d), 0) / recent.length;
    const _olderAvg = older.reduce((sum, d) => sum  + this.mapDecisionToRiskLevel(d), 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 0.1) return 'Becoming: more aggressive';
    if (diff < -0.1) return 'Becoming: more conservative';
    return 'Stable: pattern';
  }

  private: calculateVariance(values: number[]): number {
    const _mean = values.reduce((sum, val) => sum  + val, 0) / values.length;
    const _squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum  + diff, 0) / values.length;
  }

  // Simple: player risk: assessment stub: for compatibility: public async assessPlayerRisk(playerId: string): Promise<{ riskScore: number; historyPattern: number }> {
    return {
      riskScore: 50, historyPattern: 50
    }
  }
}

const adaptiveRiskModeling = new AdaptiveRiskModeling();
export { adaptiveRiskModeling };
export { AdaptiveRiskModeling };
export default adaptiveRiskModeling;

