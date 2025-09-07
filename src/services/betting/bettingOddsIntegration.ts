// @ts-nocheck
import { Player, Team, GameData, MatchupData } from '@/types/fantasy';
import { StatisticalModelingService } from '../analytics/statisticalModelingService';
import { FantasyFootballSpecialistAI } from '../ai/fantasyFootballSpecialistAI';

interface Sportsbook {
  id: string;
  name: 'draftkings' | 'fanduel' | 'mgm' | 'caesars' | 'pointsbet' | 'barstool' | 'bet365';
  jurisdiction: string;
  lastUpdate: Date;
  reliability: number; // 0-1 score
  marketCoverage: string[];
  limits: {
    min: number;
    max: number;
  };
}

interface BettingLine {
  sportsbook: Sportsbook['name'];
  market: 'spread' | 'total' | 'moneyline' | 'player_props' | 'team_props' | 'futures';
  submarket?: string; // e.g., 'passing_yards', 'receiving_yards', 'anytime_td'
  gameId: string;
  playerId?: string;
  line: number;
  odds: {
    american: number;
    decimal: number;
    implied: number; // Implied probability percentage
  };
  limits: {
    min: number;
    max: number;
  };
  movement: {
    opening: number;
    current: number;
    direction: 'up' | 'down' | 'stable';
    significant: boolean; // >10% move
  };
  timestamp: Date;
  volume?: number; // Betting volume if available
  sharpAction?: 'yes' | 'no' | 'unknown';
}

interface MarketAnalysis {
  market: string;
  consensus: {
    line: number;
    range: [number, number];
    standardDeviation: number;
  };
  bookmakerDivergence: {
    sportsbook: string;
    line: number;
    deviation: number;
    reasoning?: string;
  }[];
  sharpAction: {
    detected: boolean;
    direction: 'over' | 'under' | 'favorite' | 'underdog';
    confidence: number;
    indicators: string[];
  };
  marketInefficiencies: {
    opportunity: string;
    expectedValue: number;
    confidence: number;
    reasoning: string;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
  historicalAccuracy: {
    overHits: number;
    underHits: number;
    pushes: number;
    sampleSize: number;
    variance: number;
  };
}

interface PlayerPropAnalysis {
  player: Player;
  market: string; // 'passing_yards', 'rushing_yards', 'receiving_yards', 'touchdowns', etc.
  lines: BettingLine[];
  analysis: {
    recommendedLine: number;
    confidence: number;
    factors: {
      historical: number;
      matchup: number;
      weather: number;
      gameScript: number;
      injury: number;
      rest: number;
    };
    projection: {
      expected: number;
      floor: number;
      ceiling: number;
      distribution: number[];
    };
    recommendation: {
      side: 'over' | 'under' | 'avoid';
      reasoning: string[];
      expectedValue: number;
      kelly: number; // Kelly criterion bet size
    };
  };
  correlations: {
    player: string;
    market: string;
    correlation: number;
    reasoning: string;
  }[];
}

interface GameTotalAnalysis {
  game: MatchupData;
  lines: BettingLine[];
  analysis: {
    recommendedTotal: number;
    confidence: number;
    factors: {
      offensiveMatchups: number;
      defensiveMatchups: number;
      pace: number;
      weather: number;
      motivation: number;
      trends: number;
    };
    projection: {
      expected: number;
      variance: number;
      distribution: number[];
    };
    recommendation: {
      side: 'over' | 'under' | 'avoid';
      reasoning: string[];
      expectedValue: number;
    };
  };
  teamTotals: {
    team: string;
    projected: number;
    confidence: number;
    keyDrivers: string[];
  }[];
}

interface FantasyBettingEdge {
  type: 'lineup_correlation' | 'prop_arbitrage' | 'market_inefficiency' | 'contrarian_opportunity';
  description: string;
  fantasyPlayers: Player[];
  bettingMarkets: {
    market: string;
    line: number;
    recommendation: string;
  }[];
  expectedEdge: number;
  confidence: number;
  reasoning: string[];
  implementation: {
    fantasyAction: string;
    bettingAction: string;
    sizing: string;
  };
  riskMitigation: string[];
}

interface LiveBettingAlert {
  gameId: string;
  market: string;
  player?: Player;
  alert: {
    type: 'line_movement' | 'volume_spike' | 'injury_news' | 'weather_change' | 'sharp_action';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    actionRequired: string;
    timeframe: 'immediate' | 'pre_game' | 'in_game';
  };
  newLine: number;
  previousLine: number;
  movement: number;
  fantasyImplications: {
    affectedPlayers: Player[];
    impactLevel: number;
    recommendedAction: string;
  };
  timestamp: Date;
}

export class BettingOddsIntegration {
  private statisticalModeling: StatisticalModelingService;
  private fantasyAI: FantasyFootballSpecialistAI;
  private oddsCache: Map<string, BettingLine[]> = new Map();
  private analysisCache: Map<string, MarketAnalysis> = new Map();
  private sportsbooks: Sportsbook[] = [];

  constructor() {
    this.statisticalModeling = new StatisticalModelingService();
    this.fantasyAI = new FantasyFootballSpecialistAI();
    this.initializeSportsbooks();
  }

  async aggregateOddsData(config: {
    games: MatchupData[];
    markets: string[];
    sportsbooks?: string[];
    updateFrequency?: number; // minutes
  }): Promise<{
    games: {
      gameId: string;
      markets: Record<string, BettingLine[]>;
      lastUpdate: Date;
    }[];
    consensus: Record<string, MarketAnalysis>;
    alerts: LiveBettingAlert[];
  }> {
    const games = [];
    const consensus: Record<string, MarketAnalysis> = {};
    const alerts: LiveBettingAlert[] = [];

    // Aggregate odds for each game
    for (const game of config.games) {
      const gameOdds = await this.fetchGameOdds(game.id, config.markets, config.sportsbooks);
      
      games.push({
        gameId: game.id,
        markets: gameOdds,
        lastUpdate: new Date()
      });

      // Generate market analysis for each market
      for (const market of config.markets) {
        if (gameOdds[market]?.length > 0) {
          const analysis = await this.analyzeMarket(gameOdds[market], market, game);
          consensus[`${game.id}_${market}`] = analysis;
          
          // Check for alerts
          const marketAlerts = this.generateMarketAlerts(gameOdds[market], analysis, game);
          alerts.push(...marketAlerts);
        }
      }
    }

    return { games, consensus, alerts };
  }

  async analyzePlayerProps(config: {
    player: Player;
    game: MatchupData;
    markets: string[];
    sportsbooks?: string[];
    historicalGames?: number;
  }): Promise<PlayerPropAnalysis[]> {
    const analyses: PlayerPropAnalysis[] = [];

    for (const market of config.markets) {
      // Fetch current lines for this player/market
      const lines = await this.fetchPlayerPropLines(config.player.id, market, config.sportsbooks);
      
      if (lines.length === 0) continue;

      // Analyze the market
      const analysis = await this.analyzePlayerPropMarket(
        config.player,
        market,
        lines,
        config.game,
        config.historicalGames || 10
      );

      // Find correlations with other markets
      const correlations = await this.findPropCorrelations(
        config.player,
        market,
        config.game
      );

      analyses.push({
        player: config.player,
        market,
        lines,
        analysis,
        correlations
      });
    }

    return analyses.sort((a, b) => b.analysis.recommendation.expectedValue - a.analysis.recommendation.expectedValue);
  }

  async analyzeGameTotals(config: {
    games: MatchupData[];
    sportsbooks?: string[];
    includeTeamTotals?: boolean;
  }): Promise<GameTotalAnalysis[]> {
    const analyses: GameTotalAnalysis[] = [];

    for (const game of config.games) {
      // Fetch total lines
      const lines = await this.fetchGameTotalLines(game.id, config.sportsbooks);
      
      if (lines.length === 0) continue;

      // Analyze the total
      const analysis = await this.analyzeGameTotal(game, lines);

      // Analyze team totals if requested
      const teamTotals = config.includeTeamTotals 
        ? await this.analyzeTeamTotals(game, lines)
        : [];

      analyses.push({
        game,
        lines,
        analysis,
        teamTotals
      });
    }

    return analyses.sort((a, b) => b.analysis.recommendation.expectedValue - a.analysis.recommendation.expectedValue);
  }

  async identifyFantasyBettingEdges(config: {
    userLineup: Player[];
    availableGames: MatchupData[];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    bankroll?: number;
  }): Promise<FantasyBettingEdge[]> {
    const edges: FantasyBettingEdge[] = [];

    // Lineup correlation opportunities
    const correlationEdges = await this.findLineupCorrelationEdges(
      config.userLineup,
      config.availableGames
    );
    edges.push(...correlationEdges);

    // Prop arbitrage opportunities
    const arbitrageEdges = await this.findPropArbitrageOpportunities(
      config.userLineup,
      config.availableGames
    );
    edges.push(...arbitrageEdges);

    // Market inefficiencies
    const inefficiencyEdges = await this.findMarketInefficiencies(
      config.userLineup,
      config.availableGames,
      config.riskTolerance
    );
    edges.push(...inefficiencyEdges);

    // Contrarian opportunities
    const contrarianEdges = await this.findContrarianOpportunities(
      config.userLineup,
      config.availableGames
    );
    edges.push(...contrarianEdges);

    return edges
      .filter(edge => this.passesRiskFilter(edge, config.riskTolerance))
      .sort((a, b) => b.expectedEdge - a.expectedEdge)
      .slice(0, 15);
  }

  async trackLineMovement(config: {
    markets: { gameId: string; market: string; playerId?: string }[];
    alertThresholds: {
      movementPercent: number;
      volumeSpike: number;
      timeframe: number; // minutes
    };
    notifications: {
      webhook?: string;
      email?: string;
      sms?: string;
    };
  }): Promise<{
    tracking: {
      id: string;
      market: any;
      currentLine: number;
      movements: {
        timestamp: Date;
        oldLine: number;
        newLine: number;
        movement: number;
        sportsbook: string;
      }[];
      alerts: LiveBettingAlert[];
    }[];
    summary: {
      totalMovements: number;
      significantMovements: number;
      sharpAction: number;
      opportunities: number;
    };
  }> {
    const tracking = [];
    let totalMovements = 0;
    let significantMovements = 0;
    let sharpAction = 0;
    let opportunities = 0;

    for (const market of config.markets) {
      const trackingData = await this.trackSingleMarket(market, config.alertThresholds);
      tracking.push(trackingData);

      totalMovements += trackingData.movements.length;
      significantMovements += trackingData.movements.filter(m => Math.abs(m.movement) > config.alertThresholds.movementPercent).length;
      sharpAction += trackingData.alerts.filter(a => a.alert.type === 'sharp_action').length;
      opportunities += trackingData.alerts.filter(a => a.alert.severity === 'high' || a.alert.severity === 'critical').length;
    }

    return {
      tracking,
      summary: {
        totalMovements,
        significantMovements,
        sharpAction,
        opportunities
      }
    };
  }

  async simulateBettingScenarios(config: {
    proposedBets: {
      market: string;
      line: number;
      side: string;
      amount: number;
      odds: number;
    }[];
    fantasyLineup: Player[];
    simulations: number;
    bankroll: number;
  }): Promise<{
    scenarios: {
      name: string;
      probability: number;
      fantasyPoints: number;
      bettingProfit: number;
      totalReturn: number;
      roi: number;
    }[];
    expectedValue: {
      fantasy: number;
      betting: number;
      combined: number;
    };
    riskMetrics: {
      maxDrawdown: number;
      sharpeRatio: number;
      winRate: number;
      averageWin: number;
      averageLoss: number;
    };
    correlationAnalysis: {
      fantasyBettingCorrelation: number;
      hedgingOpportunities: string[];
      riskConcentration: number;
    };
  }> {
    const scenarios = [];
    const simulations = config.simulations || 10000;
    
    // Run Monte Carlo simulations
    const results = [];
    for (let i = 0; i < simulations; i++) {
      const simulation = await this.runSingleSimulation(config);
      results.push(simulation);
    }

    // Generate scenarios from simulation results
    const scenarioGroups = this.groupSimulationResults(results);
    for (const group of scenarioGroups) {
      scenarios.push({
        name: group.name,
        probability: group.count / simulations,
        fantasyPoints: group.avgFantasyPoints,
        bettingProfit: group.avgBettingProfit,
        totalReturn: group.avgTotalReturn,
        roi: group.avgROI
      });
    }

    // Calculate expected values
    const expectedValue = {
      fantasy: results.reduce((sum, r) => sum + r.fantasyPoints, 0) / results.length,
      betting: results.reduce((sum, r) => sum + r.bettingProfit, 0) / results.length,
      combined: results.reduce((sum, r) => sum + r.totalReturn, 0) / results.length
    };

    // Calculate risk metrics
    const riskMetrics = this.calculateRiskMetrics(results, config.bankroll);

    // Analyze correlations
    const correlationAnalysis = this.analyzeCorrelations(results, config);

    return {
      scenarios,
      expectedValue,
      riskMetrics,
      correlationAnalysis
    };
  }

  private initializeSportsbooks(): void {
    this.sportsbooks = [
      {
        id: 'dk',
        name: 'draftkings',
        jurisdiction: 'US',
        lastUpdate: new Date(),
        reliability: 0.95,
        marketCoverage: ['spread', 'total', 'moneyline', 'player_props', 'team_props', 'futures'],
        limits: { min: 1, max: 50000 }
      },
      {
        id: 'fd',
        name: 'fanduel',
        jurisdiction: 'US',
        lastUpdate: new Date(),
        reliability: 0.94,
        marketCoverage: ['spread', 'total', 'moneyline', 'player_props', 'team_props', 'futures'],
        limits: { min: 1, max: 40000 }
      },
      {
        id: 'mgm',
        name: 'mgm',
        jurisdiction: 'US',
        lastUpdate: new Date(),
        reliability: 0.90,
        marketCoverage: ['spread', 'total', 'moneyline', 'player_props', 'team_props'],
        limits: { min: 1, max: 25000 }
      },
      {
        id: 'caesars',
        name: 'caesars',
        jurisdiction: 'US',
        lastUpdate: new Date(),
        reliability: 0.92,
        marketCoverage: ['spread', 'total', 'moneyline', 'player_props', 'team_props', 'futures'],
        limits: { min: 1, max: 30000 }
      }
    ];
  }

  private async fetchGameOdds(gameId: string, markets: string[], sportsbooks?: string[]): Promise<Record<string, BettingLine[]>> {
    const cacheKey = `game_${gameId}_${markets.join('_')}`;
    
    if (this.oddsCache.has(cacheKey)) {
      return this.groupLinesByMarket(this.oddsCache.get(cacheKey)!);
    }

    // In a real implementation, this would fetch from multiple sportsbook APIs
    const lines: BettingLine[] = [];
    
    const targetBooks = sportsbooks || this.sportsbooks.map(sb => sb.name);
    
    for (const book of targetBooks) {
      for (const market of markets) {
        // Simulate fetching odds data
        const mockLines = await this.generateMockLines(gameId, market, book);
        lines.push(...mockLines);
      }
    }

    this.oddsCache.set(cacheKey, lines);
    
    // Cache for 2 minutes
    setTimeout(() => this.oddsCache.delete(cacheKey), 120000);
    
    return this.groupLinesByMarket(lines);
  }

  private async analyzeMarket(lines: BettingLine[], market: string, game: MatchupData): Promise<MarketAnalysis> {
    const cacheKey = `analysis_${game.id}_${market}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    // Calculate consensus
    const lineValues = lines.map(l => l.line);
    const consensus = {
      line: lineValues.reduce((a, b) => a + b, 0) / lineValues.length,
      range: [Math.min(...lineValues), Math.max(...lineValues)] as [number, number],
      standardDeviation: this.calculateStandardDeviation(lineValues)
    };

    // Identify divergent bookmakers
    const bookmakerDivergence = lines
      .map(line => ({
        sportsbook: line.sportsbook,
        line: line.line,
        deviation: Math.abs(line.line - consensus.line)
      }))
      .filter(d => d.deviation > consensus.standardDeviation * 1.5)
      .sort((a, b) => b.deviation - a.deviation);

    // Detect sharp action
    const sharpAction = await this.detectSharpAction(lines, market);

    // Find market inefficiencies
    const marketInefficiencies = await this.findInefficiencies(lines, consensus, game);

    // Calculate historical accuracy
    const historicalAccuracy = await this.calculateHistoricalAccuracy(market, game);

    const analysis: MarketAnalysis = {
      market,
      consensus,
      bookmakerDivergence,
      sharpAction,
      marketInefficiencies,
      historicalAccuracy
    };

    this.analysisCache.set(cacheKey, analysis);
    
    // Cache for 5 minutes
    setTimeout(() => this.analysisCache.delete(cacheKey), 300000);
    
    return analysis;
  }

  private async analyzePlayerPropMarket(
    player: Player,
    market: string,
    lines: BettingLine[],
    game: MatchupData,
    historicalGames: number
  ): Promise<PlayerPropAnalysis['analysis']> {
    // Calculate recommended line using multiple models
    const recommendedLine = await this.calculatePlayerPropLine(player, market, game, historicalGames);
    
    // Assess confidence based on data quality and model agreement
    const confidence = await this.assessPropConfidence(player, market, lines, recommendedLine);
    
    // Analyze contributing factors
    const factors = await this.analyzePropFactors(player, market, game);
    
    // Generate projection distribution
    const projection = await this.generatePropProjection(player, market, game, recommendedLine);
    
    // Generate recommendation
    const recommendation = await this.generatePropRecommendation(
      lines,
      projection,
      confidence,
      factors
    );

    return {
      recommendedLine,
      confidence,
      factors,
      projection,
      recommendation
    };
  }

  // Helper methods for complex calculations
  private groupLinesByMarket(lines: BettingLine[]): Record<string, BettingLine[]> {
    const grouped: Record<string, BettingLine[]> = {};
    
    for (const line of lines) {
      const key = line.submarket ? `${line.market}_${line.submarket}` : line.market;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(line);
    }
    
    return grouped;
  }

  private async generateMockLines(gameId: string, market: string, sportsbook: string): Promise<BettingLine[]> {
    // Generate realistic mock betting lines
    const baseLines: Record<string, number> = {
      'spread': -3.5,
      'total': 47.5,
      'moneyline': -150,
      'passing_yards': 275.5,
      'rushing_yards': 85.5,
      'receiving_yards': 65.5,
      'anytime_td': 1.5
    };

    const baseLine = baseLines[market] || 100;
    const variance = Math.random() * 2 - 1; // -1 to 1
    const line = baseLine + variance;

    return [{
      sportsbook: sportsbook as Sportsbook['name'],
      market: market as BettingLine['market'],
      gameId,
      line,
      odds: {
        american: -110,
        decimal: 1.91,
        implied: 52.4
      },
      limits: { min: 1, max: 1000 },
      movement: {
        opening: line - 0.5,
        current: line,
        direction: 'up' as const,
        significant: false
      },
      timestamp: new Date()
    }];
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private async detectSharpAction(lines: BettingLine[], market: string): Promise<MarketAnalysis['sharpAction']> {
    // Analyze line movement patterns, volume, and timing to detect sharp action
    const significantMoves = lines.filter(l => l.movement.significant);
    const sharpIndicators = [];

    if (significantMoves.length > 2) {
      sharpIndicators.push('Multiple significant line moves');
    }

    const detected = sharpIndicators.length > 0;
    
    return {
      detected,
      direction: detected ? 'over' : 'under',
      confidence: detected ? 0.7 : 0.3,
      indicators: sharpIndicators
    };
  }

  private async findInefficiencies(lines: BettingLine[], consensus: any, game: MatchupData): Promise<MarketAnalysis['marketInefficiencies']> {
    const inefficiencies = [];
    
    // Look for lines that deviate significantly from consensus
    for (const line of lines) {
      const deviation = Math.abs(line.line - consensus.line);
      if (deviation > consensus.standardDeviation * 2) {
        inefficiencies.push({
          opportunity: `${line.sportsbook} offering ${line.line} vs consensus ${consensus.line.toFixed(1)}`,
          expectedValue: deviation * 0.1, // Simplified EV calculation
          confidence: 0.6,
          reasoning: 'Significant deviation from market consensus',
          riskLevel: 'medium' as const
        });
      }
    }
    
    return inefficiencies;
  }

  private async calculateHistoricalAccuracy(market: string, game: MatchupData): Promise<MarketAnalysis['historicalAccuracy']> {
    // Would analyze historical data for accuracy
    return {
      overHits: 45,
      underHits: 52,
      pushes: 3,
      sampleSize: 100,
      variance: 0.15
    };
  }

  // Additional placeholder methods for complex calculations
  private async fetchPlayerPropLines(playerId: string, market: string, sportsbooks?: string[]): Promise<BettingLine[]> { return []; }
  private async fetchGameTotalLines(gameId: string, sportsbooks?: string[]): Promise<BettingLine[]> { return []; }
  private async calculatePlayerPropLine(player: Player, market: string, game: MatchupData, historicalGames: number): Promise<number> { return 100; }
  private async assessPropConfidence(player: Player, market: string, lines: BettingLine[], recommendedLine: number): Promise<number> { return 0.7; }
  private async analyzePropFactors(player: Player, market: string, game: MatchupData): Promise<any> {
    return { historical: 0.8, matchup: 0.6, weather: 0.1, gameScript: 0.7, injury: 0.0, rest: 0.5 };
  }
  private async generatePropProjection(player: Player, market: string, game: MatchupData, recommendedLine: number): Promise<any> {
    return { expected: recommendedLine, floor: recommendedLine * 0.7, ceiling: recommendedLine * 1.4, distribution: [] };
  }
  private async generatePropRecommendation(lines: BettingLine[], projection: any, confidence: number, factors: any): Promise<any> {
    return { side: 'over', reasoning: ['Strong historical trend'], expectedValue: 0.15, kelly: 0.05 };
  }
  private async findPropCorrelations(player: Player, market: string, game: MatchupData): Promise<any[]> { return []; }
  private async analyzeGameTotal(game: MatchupData, lines: BettingLine[]): Promise<any> { return {}; }
  private async analyzeTeamTotals(game: MatchupData, lines: BettingLine[]): Promise<any[]> { return []; }
  private generateMarketAlerts(lines: BettingLine[], analysis: MarketAnalysis, game: MatchupData): LiveBettingAlert[] { return []; }
  private async findLineupCorrelationEdges(lineup: Player[], games: MatchupData[]): Promise<FantasyBettingEdge[]> { return []; }
  private async findPropArbitrageOpportunities(lineup: Player[], games: MatchupData[]): Promise<FantasyBettingEdge[]> { return []; }
  private async findMarketInefficiencies(lineup: Player[], games: MatchupData[], riskTolerance: string): Promise<FantasyBettingEdge[]> { return []; }
  private async findContrarianOpportunities(lineup: Player[], games: MatchupData[]): Promise<FantasyBettingEdge[]> { return []; }
  private passesRiskFilter(edge: FantasyBettingEdge, riskTolerance: string): boolean { return true; }
  private async trackSingleMarket(market: any, thresholds: any): Promise<any> { return { id: '1', market, currentLine: 100, movements: [], alerts: [] }; }
  private async runSingleSimulation(config: any): Promise<any> { return { fantasyPoints: 150, bettingProfit: 25, totalReturn: 175, roi: 0.15 }; }
  private groupSimulationResults(results: any[]): any[] { 
    return [
      { name: 'Best Case', count: results.length * 0.1, avgFantasyPoints: 180, avgBettingProfit: 50, avgTotalReturn: 230, avgROI: 0.35 },
      { name: 'Most Likely', count: results.length * 0.6, avgFantasyPoints: 150, avgBettingProfit: 10, avgTotalReturn: 160, avgROI: 0.08 },
      { name: 'Worst Case', count: results.length * 0.3, avgFantasyPoints: 120, avgBettingProfit: -20, avgTotalReturn: 100, avgROI: -0.12 }
    ];
  }
  private calculateRiskMetrics(results: any[], bankroll: number): any {
    return {
      maxDrawdown: 0.15,
      sharpeRatio: 0.8,
      winRate: 0.65,
      averageWin: 45,
      averageLoss: -25
    };
  }
  private analyzeCorrelations(results: any[], config: any): any {
    return {
      fantasyBettingCorrelation: 0.3,
      hedgingOpportunities: ['Fade your WR props when starting opposing QB'],
      riskConcentration: 0.4
    };
  }
}
// @ts-nocheck
