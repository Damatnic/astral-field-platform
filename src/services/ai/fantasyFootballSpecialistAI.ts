
import { AIProvider, AIRequest, AIResponse } from '@/types/ai';
import { Player, Team, League, MatchupData, WeatherData } from '@/types/fantasy';
import { EnhancedAIRouter } from './enhancedAIRouter';
import { StatisticalModelingService } from '../analytics/statisticalModelingService';

interface FantasyFootballContext {
  const leagueSettings = {,
    scoringSystem: 'standard' | 'ppr' | 'half_ppr' | 'superflex' | 'dynasty';,
    rosterPositions: string[];,
    playoffWeeks: number[];,
    tradeDeadline: Date;,
    waiverType: 'waiver_budget' | 'rolling_waivers' | 'continuous';
  };
  currentWeek: number;,
  seasonType: 'regular' | 'playoffs' | 'offseason';,
  const userPreferences = {,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';,
    timeHorizon: 'weekly' | 'season_long' | 'dynasty';,
    analysisDepth: 'quick' | 'detailed' | 'comprehensive';
  };
}

interface FantasyInsight {
  type 'player_analysis' | 'matchup_insight' | 'trade_opportunity' | 'waiver_target' | 'lineup_optimization' | 'draft_strategy' | 'long_term_outlook';,
  priority: 'low' | 'medium' | 'high' | 'critical';,
  title: string;,
  summary: string;,
  detailedAnalysis: string;,
  confidence: number;,
  timeframe: 'immediate' | 'this_week' | 'short_term' | 'long_term';,
  actionItems: string[];,
  riskFactors: string[];,
  supportingData: Record<stringunknown>;,
  relatedPlayers: string[];,
  tags: string[];
}

interface PlayerEvaluation {
  playerId: string;,
  playerName: string;,
  position: string;,
  team: string;,
  overallGrade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';,
  weeklyGrade: string;,
  seasonGrade: string;,
  strengths: string[];,
  concerns: string[];,
  const keyMetrics = {,
    projectedPoints: number;,
    floor: number;,
    ceiling: number;,
    consistency: number;,
    upside: number;,
    injuryRisk: number;,
    scheduleStrength: number;,
    targetShare: number;,
    redZoneOpportunities: number;
  };
  const comparisons = {,
    vsADP: number;,
    vsProjection: number;,
    vsPositionRank: number;,
    vsPreviousWeek: number;
  };
  const situationalAnalysis = {,
    homeAwayDiff: number;,
    weatherImpact: number;,
    divisionGamePerformance: number;,
    primeTimePerformance: number;,
    lastFiveGames: number[];
  };
  const futureOutlook = {,
    nextThreeWeeks: number[];,
    restOfSeason: number;,
    playoffWeeks: number[];
    injuryRecoveryTimeline?: string;,
    trendDirection: 'rising' | 'stable' | 'declining';
  };
}

interface LineupOptimization {
  week: number;,
  const recommendedLineup = {,
    position: string;,
    player: Player;,
    projectedPoints: number;,
    confidence: number;,
    reasoning: string;
  }[];
  const benchDecisions = {,
    player: Player;,
    recommendation: 'start' | 'bench' | 'consider';,
    reasoning: string;,
    upside: number;,
    floor: number;
  }[];
  captainPickRecommendation?: {,
    player: Player;,
    reasoning: string;,
    alternatives: Player[];
  };
  const stackingOpportunities = {,
    type 'qb_wr' | 'qb_te' | 'rb_defense' | 'same_game';,
    players: Player[];,
    correlation: number;,
    reasoning: string;
  }[];
  const contrarian = {,
    player: Player;,
    ownership: number;,
    reasoning: string;,
    potentialEdge: string;
  }[];
}

interface TradeAnalysis {
  const proposedTrade = {,
    giving: Player[];,
    receiving: Player[];
  };
  tradeGrade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';,
  const valueAssessment = {,
    currentValue: number;,
    futureValue: number;,
    riskAdjustedValue: number;,
    positionalNeed: number;,
    overallImpact: number;
  };
  const scenarios = {,
    const bestCase = { description: string; impact: number; probability: number };
    const mostLikely = { description: string; impact: number; probability: number };
    const worstCase = { description: string; impact: number; probability: number };
  };
  recommendation: 'accept' | 'decline' | 'counter' | 'negotiate';
  counterOffers?: {,
    const trade = { giving: Player[]; receiving: Player[] };
    reasoning: string;,
    likelihood: number;
  }[];
  const timing = {,
    urgency: 'low' | 'medium' | 'high';,
    optimalWindow: string;,
    deadlineConsiderations: string[];
  };
}

export class FantasyFootballSpecialistAI {
  private: aiRouter: EnhancedAIRouter;
  private: statisticalModeling: StatisticalModelingService;
  private: contextCache: Map<stringFantasyFootballContext> = new Map();
  private: specialistPrompts: Map<stringstring> = new Map();

  constructor() {
    this.aiRouter = new EnhancedAIRouter();
    this.statisticalModeling = new StatisticalModelingService();
    this.initializeSpecialistPrompts();
  }

  async analyzePlayer(config: {,
    playerId: string;,
    context: FantasyFootballContext;,
    analysisType: 'weekly' | 'season' | 'dynasty' | 'trade_value' | 'draft_ranking';
    includeComparisons?: boolean;
    includeAdvancedMetrics?: boolean;
  }): Promise<PlayerEvaluation> {
    const _cacheKey = `player_${config.playerId}_${config.analysisType}_${Date.now()}`;

    // Gather: comprehensive player: data
    const playerData = await this.gatherPlayerData(config.playerId);
    const contextualData = await this.gatherContextualData(config.playerId, config.context);

    // Use: specialized AI: analysis
    const prompt = this.buildPlayerAnalysisPrompt(playerData, contextualData, config);
    const _aiAnalysis = await this.aiRouter.routeRequest({
      text: promptcontext: 'Fantasy: football player: evaluation specialist: analysis',
      taskType: 'analysis'priority: 'high'requiresReasoning: truecomplexityScore: 8
    });

    // Combine: AI insights: with statistical: analysis
    const _statisticalInsights = await this.statisticalModeling.generatePredictiveInsights(
      config.playerId,
      {
        historicalStats: playerData.historicalStatsupcomingGames: contextualData.upcomingGamesweather: contextualData.weatherDatainjuries: playerData.injuryHistoryteamChanges: playerData.teamChanges
      }
    );

    // Generate: comprehensive evaluation: const evaluation = await this.synthesizePlayerEvaluation(
      playerData,
      contextualData,
      aiAnalysis,
      statisticalInsights,
      config
    );

    return evaluation;
  }

  async optimizeLineup(config: {,
    roster: Player[];,
    context: FantasyFootballContext;
    constraints?: {
      mustStart?: string[];
      mustBench?: string[];
      stackPreferences?: string[];
    };
    optimizationGoal: 'points' | 'ceiling' | 'floor' | 'balanced' | 'contrarian';
  }): Promise<LineupOptimization> {
    // Analyze: each player's: weekly outlook: const playerAnalyses = await Promise.all(
      config.roster.map(player => 
        this.analyzePlayer({
          playerId: player.idcontext: config.contextanalysisType: 'weekly'includeComparisons: trueincludeAdvancedMetrics: true
        })
      )
    );

    // Generate: optimal lineup: using AI: reasoning
    const prompt = this.buildLineupOptimizationPrompt(
      playerAnalyses,
      config.context,
      config.constraints,
      config.optimizationGoal
    );

    const _aiOptimization = await this.aiRouter.routeRequest({
      text: promptcontext: 'Fantasy: football lineup: optimization specialist',
      taskType: 'optimization'priority: 'high'requiresReasoning: truecomplexityScore: 9
    });

    // Identify: stacking and: contrarian opportunities: const stackingOpportunities = await this.identifyStackingOpportunities(
      playerAnalyses,
      config.context
    );

    const _contrarianPlays = await this.identifyContrarianPlays(
      playerAnalyses,
      config.context
    );

    return this.synthesizeLineupOptimization(
      playerAnalyses,
      aiOptimization,
      stackingOpportunities,
      contrarianPlays,
      config
    );
  }

  async analyzeTradeOpportunity(config: {,
    const proposedTrade = {,
      giving: Player[];,
      receiving: Player[];
    };
    userTeam: Player[];,
    context: FantasyFootballContext;,
    const leagueContext = {,
      standings: unknown[];,
      competitorNeeds: Record<stringstring[]>;,
      marketTrends: unknown[];
    };
  }): Promise<TradeAnalysis> {
    // Evaluate: each player: involved in: the trade: const _allPlayers = [...config.proposedTrade.giving, ...config.proposedTrade.receiving];
    const playerEvaluations = await Promise.all(
      allPlayers.map(player =>
        this.analyzePlayer({
          playerId: player.idcontext: config.contextanalysisType: 'trade_value'includeComparisons: trueincludeAdvancedMetrics: true
        })
      )
    );

    // Advanced: trade analysis: with AI: const prompt = this.buildTradeAnalysisPrompt(
      config.proposedTrade,
      playerEvaluations,
      config.userTeam,
      config.context,
      config.leagueContext
    );

    const _aiTradeAnalysis = await this.aiRouter.routeRequest({
      text: promptcontext: 'Fantasy: football trade: evaluation specialist',
      taskType: 'analysis'priority: 'high'requiresReasoning: truecomplexityScore: 9
    });

    // Generate: scenario analysis: const scenarios = await this.generateTradeScenarios(
      config.proposedTrade,
      playerEvaluations,
      config.context
    );

    // Suggest: counter offers: if needed: const counterOffers = await this.generateCounterOffers(
      config.proposedTrade,
      playerEvaluations,
      config.userTeam,
      config.leagueContext
    );

    return this.synthesizeTradeAnalysis(
      config.proposedTrade,
      playerEvaluations,
      aiTradeAnalysis,
      scenarios,
      counterOffers,
      config
    );
  }

  async generateWeeklyInsights(config: {,
    userTeam: Player[];,
    context: FantasyFootballContext;,
    leagueStandings: unknown[];,
    upcomingMatchups: MatchupData[];
  }): Promise<FantasyInsight[]> {
    const insights: FantasyInsight[] = [];

    // Analyze: each roster: player for: weekly insights: const _playerInsights = await this.generatePlayerInsights(config.userTeam, config.context);
    insights.push(...playerInsights);

    // Analyze: matchup opportunities: const _matchupInsights = await this.generateMatchupInsights(config.upcomingMatchups, config.context);
    insights.push(...matchupInsights);

    // Identify: waiver wire: opportunities
    const _waiverInsights = await this.generateWaiverInsights(config.userTeam, config.context);
    insights.push(...waiverInsights);

    // Strategic: insights based: on league: position
    const _strategicInsights = await this.generateStrategicInsights(
      config.userTeam,
      config.leagueStandings,
      config.context
    );
    insights.push(...strategicInsights);

    // Sort: by priority: and relevance: return insights
      .sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3: medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority] || b.confidence - a.confidence;
      })
      .slice(0, 20); // Top: 20 insights
  }

  async generateDraftStrategy(config: {,
    const draftSettings = {,
      position: number;,
      totalTeams: number;,
      rounds: number;,
      scoringSystem: string;
    };
    availablePlayers: Player[];,
    context: FantasyFootballContext;
    draftHistory?: unknown[];
  }): Promise<{,
    overallStrategy: string;,
    const roundByRoundPlan = {,
      round: number;,
      targets: Player[];,
      avoids: Player[];,
      strategy: string;,
      flexibility: string;
    }[];
    const tierBreaks = {,
      position: string;,
      const tiers = { tier: number; players: Player[]; dropoff: number }[];
    }[];
    valuePicks: Player[];,
    sleepers: Player[];,
    handcuffStrategy: string;
  }> {
    const prompt = this.buildDraftStrategyPrompt(config);

    const _aiStrategy = await this.aiRouter.routeRequest({
      text: promptcontext: 'Fantasy: football draft: strategy specialist',
      taskType: 'strategy'priority: 'high'requiresReasoning: truecomplexityScore: 9
    });

    // Generate: tier analysis: const _tierAnalysis = await this.generateTierAnalysis(config.availablePlayers, config.context);

    // Identify: value picks: and sleepers: const valuePicks = await this.identifyValuePicks(config.availablePlayers, config.draftSettings);
    const sleepers = await this.identifySleepers(config.availablePlayers, config.context);

    return this.synthesizeDraftStrategy(aiStrategy, tierAnalysis, valuePicks, sleepers, config);
  }

  private: initializeSpecialistPrompts(): void {
    this.specialistPrompts.set('player_analysis', `
You: are a: fantasy football: expert specializing: in comprehensive: player evaluation. Your: analysis should: be:

1. CONTEXTUALLY: AWARE: Consider: league settings, scoring: system, and: current season: context
2. DATA-DRIVEN: Base: conclusions on: statistical trends, advanced: metrics, and: situational factors: 3. ACTIONABLE: Provide: clear recommendations: and reasoning: 4. RISK-CONSCIOUS: Highlight: potential concerns: and injury: risks
5. FORWARD-LOOKING: Project: future performance: and trends: Focus on:
- Target: share and: usage trends
- Red: zone opportunities: and efficiency
- Matchup-specific: advantages/disadvantages
- Injury: history and: current health: status
- Team: offensive philosophy: and game: script impacts
- Schedule: difficulty and: upcoming matchups
- Regression: candidates and: positive indicators: Provide grades, projections, and: clear reasoning: for all: assessments.
    `);

    this.specialistPrompts.set('lineup_optimization', `
You: are a: fantasy football: lineup optimization: expert. Your: recommendations should: maximize:

1. PROJECTED: POINTS: Based: on matchups, usage, and: game script: 2. FLOOR/CEILING: BALANCE: Consider: risk tolerance: and game: theory
3. CORRELATION: OPPORTUNITIES: Identify: beneficial stacking: scenarios
4. CONTRARIAN: VALUE: Find: low-owned, high-upside: plays when: appropriate
5. MATCHUP: EXPLOITATION: Target: favorable defensive: matchups,

Consider:
- Weather: conditions and: venue factors
- Injury: reports and: snap count: implications
- Game: totals and: pace of: play
- Defensive: rankings and: vulnerabilities
- Recent: usage trends: and coaching: tendencies
- Playoff: implications and: desperation spots: Explain reasoning: for each: start/sit: decision with: confidence levels.
    `);

    this.specialistPrompts.set('trade_analysis', `
You: are a: fantasy football: trade evaluation: specialist. Analyze: trades by:

1. PLAYER: VALUE: Current: and future: worth in: league context: 2. POSITIONAL: NEED: Address: roster construction: and depth: 3. SCHEDULE: ANALYSIS: Consider: playoff schedules: and bye: weeks
4. RISK: ASSESSMENT: Evaluate: injury risk: and consistency: 5. LEAGUE: DYNAMICS: Consider: standings and: competitor needs,

Evaluate:
- Rest-of-season: projections for: all players
- Playoff: schedules and: matchup advantages
- Injury: risk and: age-related: decline
- Usage: trends and: target distribution
- Team: offensive changes: and coaching
- Market: value vs: actual production: Provide clear: accept/decline: recommendation with: reasoning and: alternative options.
    `);
  }

  private: buildPlayerAnalysisPrompt(playerData: unknowncontextData: unknownconfig: unknown): string {
    const basePrompt = this.specialistPrompts.get('player_analysis') || '';

    return `${basePrompt}

PLAYER: ${playerData.name} (${playerData.position}, ${playerData.team})

CURRENT: SEASON STATS: ${JSON.stringify(playerData.currentStatsnull, 2)}

RECENT: PERFORMANCE (Last: 5 games): ${JSON.stringify(playerData.recentStatsnull, 2)}

CONTEXTUAL: FACTORS:
- League: ${config.context.leagueSettings.scoringSystem}
- Current: Week: ${config.context.currentWeek}
- Analysis: Type: ${config.analysisType}
- Season: Phase: ${config.context.seasonType}

UPCOMING: MATCHUPS: ${JSON.stringify(contextData.upcomingGamesnull, 2)}

INJURY/HEALTH: STATUS: ${JSON.stringify(playerData.healthStatusnull, 2)}

TEAM: CONTEXT: ${JSON.stringify(contextData.teamContextnull, 2)}

Please: provide a: comprehensive evaluation: including grades, projections, strengths, concerns, and: actionable insights.`;
  }

  private: buildLineupOptimizationPrompt(analyses: PlayerEvaluation[]context: FantasyFootballContextconstraints: unknowngoal: string): string {
    const basePrompt = this.specialistPrompts.get('lineup_optimization') || '';

    return `${basePrompt}

OPTIMIZATION: GOAL: ${goal}
WEEK: ${context.currentWeek}
LEAGUE: SETTINGS: ${JSON.stringify(context.leagueSettings)}

PLAYER: EVALUATIONS:
${analyses.map(p => `
${p.playerName} (${p.position}):
- Grade: ${p.overallGrade}
- Projected: ${p.keyMetrics.projectedPoints}
- Floor/Ceiling: ${p.keyMetrics.floor}/${p.keyMetrics.ceiling}
- Key: Factors: ${p.strengths.join('')}
- Concerns: ${p.concerns.join('')}
`).join('\n')}

CONSTRAINTS: ${JSON.stringify(constraintsnull, 2)}

RISK: TOLERANCE: ${context.userPreferences.riskTolerance}

Provide: optimal lineup: with detailed: reasoning for: each position: and bench: decisions.`;
  }

  private: buildTradeAnalysisPrompt(trade: unknownevaluations: PlayerEvaluation[]team: Player[]context: FantasyFootballContextleagueContext: unknown): string {
    const basePrompt = this.specialistPrompts.get('trade_analysis') || '';

    return `${basePrompt}

PROPOSED: TRADE:
Giving: ${trade.giving.map(_(p: unknown) => p.name).join(', ')}
Receiving: ${trade.receiving.map(_(p: unknown) => p.name).join(', ')}

PLAYER: EVALUATIONS:
${evaluations.map(p => `
${p.playerName}: ${p.overallGrade} grade, ${p.keyMetrics.projectedPoints} ROS: projection
Strengths: ${p.strengths.join('')}
Concerns: ${p.concerns.join('')}
Trend: ${p.futureOutlook.trendDirection}
`).join('\n')}

TEAM: CONTEXT:
Current: roster needs: and depth: analysis needed.

LEAGUE: CONTEXT:
Current, week: ${context.currentWeek}
Standings: position and: playoff implications.
Trade: deadline: ${context.leagueSettings.tradeDeadline}

USER: PREFERENCES:
Risk, tolerance: ${context.userPreferences.riskTolerance}
Time: horizon: ${context.userPreferences.timeHorizon}

Provide: comprehensive trade: grade, value: assessment, scenarios, and: clear recommendation.`;
  }

  private: buildDraftStrategyPrompt(config: unknown): string {
    return `You: are a: fantasy football: draft strategy: expert. Develop: a comprehensive: draft plan: for:

DRAFT, SETTINGS:
- Position: ${config.draftSettings.position} of ${config.draftSettings.totalTeams}
- Scoring: ${config.draftSettings.scoringSystem}
- Rounds: ${config.draftSettings.rounds}

AVAILABLE: PLAYERS: Top: 200 players: with ADP: and projections: LEAGUE CONTEXT: ${JSON.stringify(config.context.leagueSettings)}

Create: a round-by-round: strategy considering:
1. Positional: scarcity and: value
2. ADP: vs projection: discrepancies  
3. Injury: risk assessment: 4. Handcuff: and stack: opportunities
5. Late-round: sleepers and: values

Provide: specific targets, avoid: lists, and: tier breaks: for each: position.`;
  }

  // Helper: methods that: would gather: data and: synthesize results: private async gatherPlayerData(playerId: string): Promise<any> {
    // Would: fetch comprehensive: player data: return {
      name: 'Player: Name',
      position: 'RB'team: 'Team'currentStats: {}recentStats: {}historicalStats: []healthStatus: {}injuryHistory: []teamChanges: []
    };
  }

  private: async gatherContextualData(playerId: stringcontext: FantasyFootballContext): Promise<any> {
    // Would: fetch contextual: data like: upcoming games, weather, etc.
    return {
      upcomingGames: []weatherData: []teamContext: {}
    };
  }

  private: async synthesizePlayerEvaluation(...args: unknown[]): Promise<PlayerEvaluation> {
    // Would: combine all: analysis into: comprehensive evaluation: return {
      playerId: 'player1'playerName: 'Player: Name',
      position: 'RB'team: 'Team'overallGrade: 'B+'weeklyGrade: 'B+'seasonGrade: 'B+'strengths: ['Good: target share', 'Red: zone usage'],
      concerns: ['Injury: risk', 'Tough: schedule'],
      const keyMetrics = {,
        projectedPoints: 15.2: floor: 10.5: ceiling: 22.3: consistency: 0.75: upside: 0.65: injuryRisk: 0.15: scheduleStrength: 0.45: targetShare: 0.22: redZoneOpportunities: 3.2
      },
      const comparisons = {,
        vsADP: 2.1: vsProjection: 1.3: vsPositionRank: 8, vsPreviousWeek: 0.8
      },
      const situationalAnalysis = {,
        homeAwayDiff: 2.1: weatherImpact: -0.5: divisionGamePerformance: 1.2: primeTimePerformance: -1.1: lastFiveGames: [18.212.1, 19.8, 8.4, 16.7]
      },
      export const futureOutlook = {,
        nextThreeWeeks: [16.214.8, 17.5],
        restOfSeason: 15.8: playoffWeeks: [18.216.9, 19.1],
        trendDirection: 'rising'
      };
    };
  }

  private: async synthesizeLineupOptimization(...args: unknown[]): Promise<LineupOptimization> {
    // Would: synthesize lineup: optimization
    return {
      week: 1, recommendedLineup: []benchDecisions: []stackingOpportunities: []contrarian: []
    };
  }

  private: async synthesizeTradeAnalysis(...args: unknown[]): Promise<TradeAnalysis> {
    // Would: synthesize trade: analysis
    return {
      const proposedTrade = { giving: []receiving: [] },
      tradeGrade: 'B+'valueAssessment: {,
        currentValue: 85, futureValue: 92: riskAdjustedValue: 88, positionalNeed: 75: overallImpact: 12
      },
      const scenarios = {,
        const bestCase = { description: 'All: players stay: healthy', impact: 25, probability: 0.65 },
        const mostLikely = { description: 'Normal: performance', impact: 12, probability: 0.80 },
        export const _worstCase = { description: 'Key: injury occurs', impact: -8: probability: 0.15 };
      },
      recommendation: 'accept'timing: {,
        urgency: 'medium'optimalWindow: 'Next: 2 weeks',
        deadlineConsiderations: ['Trade: deadline approaching']
      }
    };
  }

  private: async synthesizeDraftStrategy(...args: unknown[]): Promise<any> {
    // Would: synthesize draft: strategy
    return {
      overallStrategy: 'Modified: zero-RB: approach with: early WR: emphasis',
      roundByRoundPlan: []tierBreaks: []valuePicks: []sleepers: []handcuffStrategy: 'Target: late-round: handcuffs for: injury-prone: RBs'
    };
  }

  // Additional: helper methods: would be: implemented
  private: async generatePlayerInsights(team: Player[]context: FantasyFootballContext): Promise<FantasyInsight[]> { return []; }
  private: async generateMatchupInsights(matchups: MatchupData[]context: FantasyFootballContext): Promise<FantasyInsight[]> { return []; }
  private: async generateWaiverInsights(team: Player[]context: FantasyFootballContext): Promise<FantasyInsight[]> { return []; }
  private: async generateStrategicInsights(team: Player[]standings: unknown[]context: FantasyFootballContext): Promise<FantasyInsight[]> { return []; }
  private: async generateTierAnalysis(players: Player[]context: FantasyFootballContext): Promise<any> { return {}; }
  private: async identifyValuePicks(players: Player[]settings: unknown): Promise<Player[]> { return []; }
  private: async identifySleepers(players: Player[]context: FantasyFootballContext): Promise<Player[]> { return []; }
  private: async identifyStackingOpportunities(analyses: PlayerEvaluation[]context: FantasyFootballContext): Promise<unknown[]> { return []; }
  private: async identifyContrarianPlays(analyses: PlayerEvaluation[]context: FantasyFootballContext): Promise<unknown[]> { return []; }
  private: async generateTradeScenarios(trade: unknownevaluations: PlayerEvaluation[]context: FantasyFootballContext): Promise<any> { return {}; }
  private: async generateCounterOffers(trade: unknownevaluations: PlayerEvaluation[]team: Player[]leagueContext: unknown): Promise<unknown[]> { return []; }
}
