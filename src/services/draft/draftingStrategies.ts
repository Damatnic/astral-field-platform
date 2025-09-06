import { Pool } from 'pg';
import { AIRouterService } from '../ai/router';

interface PlayerEvaluation {
  playerId: string;
  overallValue: number;
  positionalValue: number;
  teamFit: number;
  adpDifferential: number;
  injuryRisk: number;
  upside: number;
  floor: number;
  consistency: number;
  age: number;
  rookieBonus: number;
}

interface DraftContext {
  currentRound: number;
  currentPick: number;
  totalRounds: number;
  teamsInLeague: number;
  availablePlayers: PlayerEvaluation[];
  rosterNeeds: Record<string, number>;
  budgetRemaining?: number;
  teamPersonality: any;
}

interface StrategyRecommendation {
  playerId: string;
  confidence: number;
  reasoning: string;
  alternativeOptions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  expectedValue: number;
}

export class DraftingStrategiesService {
  private pool: Pool;
  private aiRouter: AIRouterService;

  constructor(pool: Pool, aiRouter: AIRouterService) {
    this.pool = pool;
    this.aiRouter = aiRouter;
  }

  async executeValueBasedStrategy(context: DraftContext): Promise<StrategyRecommendation> {
    // Value-based drafting focuses on getting the best player regardless of position
    const availablePlayers = context.availablePlayers
      .filter(p => this.isReasonablePositionNeed(p, context.rosterNeeds))
      .sort((a, b) => b.overallValue - a.overallValue);

    const topOptions = availablePlayers.slice(0, 5);
    
    // Apply value-based filters
    const valueTargets = topOptions.filter(p => {
      const isGoodValue = p.adpDifferential <= 10; // Not reaching too far
      const isLowRisk = p.injuryRisk < 0.6;
      const hasConsistency = p.consistency > 0.4;
      
      return isGoodValue && (isLowRisk || hasConsistency);
    });

    const selectedPlayer = valueTargets[0] || topOptions[0];

    const reasoning = await this.generateValueBasedReasoning(selectedPlayer, context);

    return {
      playerId: selectedPlayer.playerId,
      confidence: this.calculateConfidence(selectedPlayer, 'value_based', context),
      reasoning,
      alternativeOptions: topOptions.slice(1, 4).map(p => p.playerId),
      riskLevel: selectedPlayer.injuryRisk > 0.6 ? 'high' : 
                 selectedPlayer.injuryRisk > 0.3 ? 'medium' : 'low',
      expectedValue: selectedPlayer.overallValue
    };
  }

  async executePositionalStrategy(context: DraftContext): Promise<StrategyRecommendation> {
    // Positional drafting prioritizes scarce positions early
    const positionPriority = this.getPositionPriority(context.currentRound);
    
    let bestPick: PlayerEvaluation | null = null;
    let selectedFromPriority = false;

    // First, try to get best player from priority positions
    for (const position of positionPriority) {
      const positionPlayers = context.availablePlayers
        .filter(p => this.getPlayerPosition(p.playerId) === position)
        .sort((a, b) => b.positionalValue - a.positionalValue);

      if (positionPlayers.length > 0 && context.rosterNeeds[position] > 0) {
        bestPick = positionPlayers[0];
        selectedFromPriority = true;
        break;
      }
    }

    // Fallback to best available if no priority position available
    if (!bestPick) {
      bestPick = context.availablePlayers
        .filter(p => context.rosterNeeds[this.getPlayerPosition(p.playerId)] > 0)
        .sort((a, b) => b.positionalValue - a.positionalValue)[0];
    }

    if (!bestPick) {
      bestPick = context.availablePlayers[0];
    }

    const reasoning = await this.generatePositionalReasoning(
      bestPick, 
      context, 
      selectedFromPriority,
      positionPriority
    );

    return {
      playerId: bestPick.playerId,
      confidence: this.calculateConfidence(bestPick, 'positional', context),
      reasoning,
      alternativeOptions: context.availablePlayers
        .filter(p => p.playerId !== bestPick!.playerId)
        .sort((a, b) => b.positionalValue - a.positionalValue)
        .slice(0, 3)
        .map(p => p.playerId),
      riskLevel: this.assessRiskLevel(bestPick),
      expectedValue: bestPick.positionalValue
    };
  }

  async executeContrarianStrategy(context: DraftContext): Promise<StrategyRecommendation> {
    // Contrarian strategy looks for undervalued players and position arbitrage
    const contrarianTargets = context.availablePlayers
      .filter(p => {
        const isUndervalued = p.adpDifferential < -15; // Going later than ADP
        const hasUpside = p.upside > 0.6;
        const isAtLeastViable = p.overallValue > 0.3;
        
        return (isUndervalued || hasUpside) && isAtLeastViable;
      })
      .sort((a, b) => b.upside - a.upside);

    // Look for position arbitrage opportunities (e.g., taking QB/TE when others avoid)
    const arbitragePositions = this.findArbitrageOpportunities(context);
    
    let selectedPlayer: PlayerEvaluation;

    if (arbitragePositions.length > 0 && Math.random() > 0.3) {
      // 70% chance to exploit arbitrage
      const arbitragePosition = arbitragePositions[0];
      selectedPlayer = context.availablePlayers
        .filter(p => this.getPlayerPosition(p.playerId) === arbitragePosition)
        .sort((a, b) => b.overallValue - a.overallValue)[0];
    } else {
      selectedPlayer = contrarianTargets[0] || context.availablePlayers[0];
    }

    const reasoning = await this.generateContrarianReasoning(selectedPlayer, context, arbitragePositions);

    return {
      playerId: selectedPlayer.playerId,
      confidence: this.calculateConfidence(selectedPlayer, 'contrarian', context) * 0.9, // Slightly lower confidence
      reasoning,
      alternativeOptions: contrarianTargets.slice(1, 4).map(p => p.playerId),
      riskLevel: 'medium', // Contrarian picks are inherently riskier
      expectedValue: selectedPlayer.upside
    };
  }

  async executeSafeStrategy(context: DraftContext): Promise<StrategyRecommendation> {
    // Safe strategy prioritizes consistency and low injury risk
    const safeTargets = context.availablePlayers
      .filter(p => {
        const isLowRisk = p.injuryRisk < 0.4;
        const isConsistent = p.consistency > 0.5;
        const isProvenVeteran = p.age >= 3; // At least 3 years experience
        const isNotReach = p.adpDifferential <= 15; // Don't reach too far
        
        return isLowRisk && isConsistent && isProvenVeteran && isNotReach;
      })
      .sort((a, b) => (b.consistency + b.floor) - (a.consistency + a.floor));

    // Prefer players with established track records
    const veteranTargets = safeTargets.filter(p => p.age >= 5);
    const selectedPlayer = veteranTargets[0] || safeTargets[0] || context.availablePlayers[0];

    const reasoning = await this.generateSafeReasoning(selectedPlayer, context);

    return {
      playerId: selectedPlayer.playerId,
      confidence: this.calculateConfidence(selectedPlayer, 'safe', context),
      reasoning,
      alternativeOptions: safeTargets.slice(1, 4).map(p => p.playerId),
      riskLevel: 'low',
      expectedValue: selectedPlayer.floor
    };
  }

  async executeAggressiveStrategy(context: DraftContext): Promise<StrategyRecommendation> {
    // Aggressive strategy chases upside and breakout potential
    const aggressiveTargets = context.availablePlayers
      .filter(p => {
        const hasHighUpside = p.upside > 0.7;
        const isYoungWithPotential = p.age <= 4 && p.upside > 0.5;
        const isRookie = p.age === 0;
        const hasSleperPotential = p.adpDifferential < -20; // Way later than expected
        
        return hasHighUpside || isYoungWithPotential || isRookie || hasSleperPotential;
      })
      .sort((a, b) => b.upside - a.upside);

    // Prefer rookies and young players
    const youthTargets = aggressiveTargets.filter(p => p.age <= 2);
    const selectedPlayer = youthTargets[0] || aggressiveTargets[0] || context.availablePlayers[0];

    const reasoning = await this.generateAggressiveReasoning(selectedPlayer, context);

    return {
      playerId: selectedPlayer.playerId,
      confidence: this.calculateConfidence(selectedPlayer, 'aggressive', context) * 0.8, // Lower confidence due to risk
      reasoning,
      alternativeOptions: aggressiveTargets.slice(1, 4).map(p => p.playerId),
      riskLevel: 'high',
      expectedValue: selectedPlayer.upside
    };
  }

  async executeBalancedStrategy(context: DraftContext): Promise<StrategyRecommendation> {
    // Balanced strategy adapts to draft flow and fills needs intelligently
    const needsWeight = this.calculateNeedsWeight(context.currentRound);
    
    const balancedScores = context.availablePlayers.map(player => {
      const position = this.getPlayerPosition(player.playerId);
      const needScore = context.rosterNeeds[position] || 0;
      
      const balancedScore = 
        player.overallValue * 0.4 +
        player.positionalValue * 0.3 +
        (needScore * needsWeight) * 0.2 +
        ((1 - player.injuryRisk) * 0.1);

      return { ...player, balancedScore };
    }).sort((a, b) => b.balancedScore - a.balancedScore);

    const selectedPlayer = balancedScores[0];
    const reasoning = await this.generateBalancedReasoning(selectedPlayer, context, needsWeight);

    return {
      playerId: selectedPlayer.playerId,
      confidence: this.calculateConfidence(selectedPlayer, 'balanced', context),
      reasoning,
      alternativeOptions: balancedScores.slice(1, 4).map(p => p.playerId),
      riskLevel: selectedPlayer.injuryRisk > 0.5 ? 'medium' : 'low',
      expectedValue: selectedPlayer.balancedScore || selectedPlayer.overallValue
    };
  }

  // Helper methods for strategy execution

  private getPositionPriority(round: number): string[] {
    if (round <= 3) return ['RB', 'WR', 'QB', 'TE'];
    if (round <= 6) return ['RB', 'WR', 'TE', 'QB'];
    if (round <= 10) return ['WR', 'RB', 'QB', 'TE'];
    if (round <= 13) return ['QB', 'TE', 'DST', 'K'];
    return ['DST', 'K', 'QB', 'TE'];
  }

  private findArbitrageOpportunities(context: DraftContext): string[] {
    const opportunities: string[] = [];
    
    // Check if QB is being avoided (good time to take elite QB)
    const qbCount = this.countRecentPicksByPosition('QB', context, 3);
    if (qbCount === 0 && context.currentRound >= 3 && context.currentRound <= 6) {
      opportunities.push('QB');
    }

    // Check if TE is being avoided (good time to take elite TE)
    const teCount = this.countRecentPicksByPosition('TE', context, 5);
    if (teCount <= 1 && context.currentRound >= 2 && context.currentRound <= 5) {
      opportunities.push('TE');
    }

    // Check for DST/K opportunities in middle rounds
    if (context.currentRound >= 8 && context.currentRound <= 10) {
      const dstCount = this.countRecentPicksByPosition('DST', context, 10);
      if (dstCount === 0) opportunities.push('DST');
    }

    return opportunities;
  }

  private countRecentPicksByPosition(position: string, context: DraftContext, recentPicks: number): number {
    // This would count recent picks of a position (simulated)
    return Math.floor(Math.random() * 3); // Simplified for demo
  }

  private isReasonablePositionNeed(player: PlayerEvaluation, needs: Record<string, number>): boolean {
    const position = this.getPlayerPosition(player.playerId);
    return needs[position] > 0 || Object.values(needs).every(n => n === 0);
  }

  private calculateNeedsWeight(round: number): number {
    if (round <= 4) return 0.2; // Early rounds: talent over need
    if (round <= 8) return 0.4; // Middle rounds: balance
    if (round <= 12) return 0.6; // Late rounds: fill needs
    return 0.8; // Final rounds: must fill roster spots
  }

  private assessRiskLevel(player: PlayerEvaluation): 'low' | 'medium' | 'high' {
    if (player.injuryRisk > 0.6) return 'high';
    if (player.injuryRisk > 0.3 || player.age === 0) return 'medium';
    return 'low';
  }

  private calculateConfidence(player: PlayerEvaluation, strategy: string, context: DraftContext): number {
    let baseConfidence = 0.7;

    // Adjust based on how well player fits strategy
    const strategyFitBonuses = {
      value_based: player.consistency * 0.2,
      positional: player.positionalValue * 0.2,
      contrarian: player.upside * 0.2,
      safe: (1 - player.injuryRisk) * 0.2,
      aggressive: player.upside * 0.2,
      balanced: player.overallValue * 0.2
    };

    const fitBonus = strategyFitBonuses[strategy as keyof typeof strategyFitBonuses] || 0;
    
    // Adjust for draft context
    const roundBonus = context.currentRound <= 3 ? 0.1 : 0; // More confident in early rounds
    const needsBonus = context.rosterNeeds[this.getPlayerPosition(player.playerId)] > 0 ? 0.1 : 0;

    return Math.min(0.95, baseConfidence + fitBonus + roundBonus + needsBonus);
  }

  private getPlayerPosition(playerId: string): string {
    // This would query the database for the actual position
    // For now, return a mock position
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    const hash = playerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return positions[hash % positions.length];
  }

  // AI-powered reasoning generation

  private async generateValueBasedReasoning(
    player: PlayerEvaluation, 
    context: DraftContext
  ): Promise<string> {
    const prompt = `Generate draft reasoning for a value-based pick:

Player metrics:
- Overall Value: ${player.overallValue.toFixed(2)}
- Consistency: ${player.consistency.toFixed(2)}
- Injury Risk: ${player.injuryRisk.toFixed(2)}
- ADP Differential: ${player.adpDifferential}

Draft context:
- Round: ${context.currentRound}
- Pick: ${context.currentPick}

Generate 1-2 sentences explaining why this is a good value pick focusing on proven production and safety.`;

    try {
      const response = await this.aiRouter.generateResponse({
        model: 'claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        context: { action: 'draft_reasoning', strategy: 'value_based' }
      });
      return response.content;
    } catch {
      return `Solid value pick with ${Math.round(player.consistency * 100)}% consistency and minimal injury risk`;
    }
  }

  private async generatePositionalReasoning(
    player: PlayerEvaluation,
    context: DraftContext,
    fromPriority: boolean,
    priorities: string[]
  ): Promise<string> {
    const position = this.getPlayerPosition(player.playerId);
    const prompt = `Generate draft reasoning for a positional strategy pick:

Player: ${position} with positional value ${player.positionalValue.toFixed(2)}
Round: ${context.currentRound}
From priority position: ${fromPriority}
Position priorities this round: ${priorities.join(', ')}

Generate 1-2 sentences explaining the positional strategy logic.`;

    try {
      const response = await this.aiRouter.generateResponse({
        model: 'claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        context: { action: 'draft_reasoning', strategy: 'positional' }
      });
      return response.content;
    } catch {
      return fromPriority ? 
        `Building ${position} depth early - scarcity at position demands priority` :
        `Best positional value available - filling roster construction needs`;
    }
  }

  private async generateContrarianReasoning(
    player: PlayerEvaluation,
    context: DraftContext,
    arbitragePositions: string[]
  ): Promise<string> {
    const position = this.getPlayerPosition(player.playerId);
    const isArbitrage = arbitragePositions.includes(position);
    
    const prompt = `Generate contrarian draft reasoning:

Player upside: ${player.upside.toFixed(2)}
ADP differential: ${player.adpDifferential}
Position: ${position}
Is arbitrage opportunity: ${isArbitrage}
Round: ${context.currentRound}

Generate 1-2 sentences explaining the contrarian value and market inefficiency.`;

    try {
      const response = await this.aiRouter.generateResponse({
        model: 'claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        context: { action: 'draft_reasoning', strategy: 'contrarian' }
      });
      return response.content;
    } catch {
      return isArbitrage ? 
        `Market inefficiency at ${position} - others sleeping on elite option` :
        `Undervalued breakout candidate with ${Math.round(player.upside * 100)}% upside potential`;
    }
  }

  private async generateSafeReasoning(
    player: PlayerEvaluation,
    context: DraftContext
  ): Promise<string> {
    const prompt = `Generate safe strategy draft reasoning:

Player age: ${player.age} years
Injury risk: ${player.injuryRisk.toFixed(2)}
Consistency: ${player.consistency.toFixed(2)}
Floor score: ${player.floor.toFixed(2)}
Round: ${context.currentRound}

Generate 1-2 sentences emphasizing safety and proven track record.`;

    try {
      const response = await this.aiRouter.generateResponse({
        model: 'claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        context: { action: 'draft_reasoning', strategy: 'safe' }
      });
      return response.content;
    } catch {
      return `Safe veteran pick with proven track record and ${Math.round((1 - player.injuryRisk) * 100)}% health reliability`;
    }
  }

  private async generateAggressiveReasoning(
    player: PlayerEvaluation,
    context: DraftContext
  ): Promise<string> {
    const prompt = `Generate aggressive strategy draft reasoning:

Player upside: ${player.upside.toFixed(2)}
Age: ${player.age}
Breakout potential: ${player.rookieBonus > 0 ? 'High (Rookie)' : 'Moderate'}
Round: ${context.currentRound}

Generate 1-2 sentences emphasizing upside and ceiling potential.`;

    try {
      const response = await this.aiRouter.generateResponse({
        model: 'claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        context: { action: 'draft_reasoning', strategy: 'aggressive' }
      });
      return response.content;
    } catch {
      const isRookie = player.age === 0;
      return isRookie ?
        `High-upside rookie with massive ceiling - swing for league-winning potential` :
        `Breakout candidate with ${Math.round(player.upside * 100)}% upside - worth the risk`;
    }
  }

  private async generateBalancedReasoning(
    player: PlayerEvaluation,
    context: DraftContext,
    needsWeight: number
  ): Promise<string> {
    const position = this.getPlayerPosition(player.playerId);
    const hasNeed = context.rosterNeeds[position] > 0;
    
    const prompt = `Generate balanced strategy draft reasoning:

Overall value: ${player.overallValue.toFixed(2)}
Position: ${position}
Fills roster need: ${hasNeed}
Round: ${context.currentRound}
Needs weight: ${needsWeight.toFixed(2)}

Generate 1-2 sentences explaining the balanced approach between value and need.`;

    try {
      const response = await this.aiRouter.generateResponse({
        model: 'claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        context: { action: 'draft_reasoning', strategy: 'balanced' }
      });
      return response.content;
    } catch {
      return hasNeed ?
        `Best player available that fills ${position} need - optimal balance of value and roster construction` :
        `Best overall value available - staying flexible with draft flow`;
    }
  }

  // Public API for strategy recommendations
  async getStrategyRecommendation(
    strategy: string,
    context: DraftContext
  ): Promise<StrategyRecommendation> {
    switch (strategy) {
      case 'value_based':
        return this.executeValueBasedStrategy(context);
      case 'positional':
        return this.executePositionalStrategy(context);
      case 'contrarian':
        return this.executeContrarianStrategy(context);
      case 'safe':
        return this.executeSafeStrategy(context);
      case 'aggressive':
        return this.executeAggressiveStrategy(context);
      case 'balanced':
      default:
        return this.executeBalancedStrategy(context);
    }
  }

  async compareStrategies(context: DraftContext): Promise<{
    recommendations: Record<string, StrategyRecommendation>;
    bestOverall: string;
    riskAssessment: string;
  }> {
    const strategies = ['value_based', 'positional', 'contrarian', 'safe', 'aggressive', 'balanced'];
    
    const recommendations: Record<string, StrategyRecommendation> = {};
    
    for (const strategy of strategies) {
      recommendations[strategy] = await this.getStrategyRecommendation(strategy, context);
    }

    // Determine best overall strategy for this context
    const bestOverall = this.determineBestStrategy(recommendations, context);
    
    // Assess overall risk level
    const riskLevels = Object.values(recommendations).map(r => r.riskLevel);
    const highRiskCount = riskLevels.filter(r => r === 'high').length;
    const riskAssessment = highRiskCount > 3 ? 'high' : 
                         highRiskCount > 1 ? 'medium' : 'low';

    return {
      recommendations,
      bestOverall,
      riskAssessment
    };
  }

  private determineBestStrategy(
    recommendations: Record<string, StrategyRecommendation>,
    context: DraftContext
  ): string {
    // Score each strategy based on context
    const scores: Record<string, number> = {};

    Object.entries(recommendations).forEach(([strategy, rec]) => {
      let score = rec.confidence * 0.4 + rec.expectedValue * 0.6;
      
      // Context adjustments
      if (context.currentRound <= 3 && strategy === 'value_based') score += 0.1;
      if (context.currentRound <= 6 && strategy === 'positional') score += 0.1;
      if (context.currentRound >= 7 && strategy === 'balanced') score += 0.1;
      
      scores[strategy] = score;
    });

    return Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
}