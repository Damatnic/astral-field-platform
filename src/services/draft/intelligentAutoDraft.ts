import { Pool } from 'pg';
import { WebSocketManager } from '../websocket/manager';
import { AIRouterService } from '../ai/router';
import { UserBehaviorAnalysisService } from '../ai/userBehaviorAnalysis';

interface DraftConfig {
  leagueId: string;
  rounds: number;
  pickTimeLimit: number; // seconds
  draftType: 'snake' | 'linear' | 'auction';
  rosterConfig: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    FLEX: number;
    K: number;
    DST: number;
    BENCH: number;
  };
}

interface TeamPersonality {
  teamId: string;
  userId?: string;
  strategy: 'value_based' | 'positional' | 'contrarian' | 'safe' | 'aggressive' | 'balanced';
  riskTolerance: number; // 0-1
  positionPreferences: Record<string, number>;
  targetPlayers: string[];
  avoidPlayers: string[];
  personalityTraits: {
    handcuffsLover: boolean;
    rookieFocused: boolean;
    veteranBias: boolean;
    injuryAverse: boolean;
    sleperHunter: boolean;
    consistencyFocused: boolean;
    upside_chaser: boolean;
  };
  draftNotes: string[];
}

interface DraftPick {
  pickNumber: number;
  round: number;
  teamId: string;
  playerId?: string;
  playerName?: string;
  position: string;
  pickTime: number;
  aiConfidence: number;
  alternativeOptions: string[];
  reasoning: string;
}

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

interface DraftBoard {
  players: PlayerEvaluation[];
  tiers: Record<string, PlayerEvaluation[]>;
  personalizedRankings: Record<string, PlayerEvaluation[]>; // By team
  sleepers: PlayerEvaluation[];
  busts: PlayerEvaluation[];
  breakouts: PlayerEvaluation[];
}

export class IntelligentAutoDraftService {
  private pool: Pool;
  private wsManager: WebSocketManager;
  private aiRouter: AIRouterService;
  private behaviorAnalysis: UserBehaviorAnalysisService;
  private activeDrafts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    pool: Pool,
    wsManager: WebSocketManager,
    aiRouter: AIRouterService,
    behaviorAnalysis: UserBehaviorAnalysisService
  ) {
    this.pool = pool;
    this.wsManager = wsManager;
    this.aiRouter = aiRouter;
    this.behaviorAnalysis = behaviorAnalysis;
  }

  async initializeAutoDraft(config: DraftConfig): Promise<{
    draftId: string;
    personalities: TeamPersonality[];
    draftOrder: string[];
  }> {
    const draftId = await this.createDraft(config);
    
    // Generate diverse team personalities
    const personalities = await this.generateTeamPersonalities(config.leagueId);
    
    // Create draft order
    const draftOrder = await this.generateDraftOrder(config.leagueId, personalities);
    
    // Prepare AI draft board
    const draftBoard = await this.prepareDraftBoard(config.leagueId, personalities);
    
    // Store draft state
    await this.storeDraftState(draftId, {
      config,
      personalities,
      draftOrder,
      draftBoard,
      currentPick: 1,
      picks: []
    });

    return { draftId, personalities, draftOrder };
  }

  async startAutoDraft(draftId: string): Promise<void> {
    // Start the automated draft process
    const interval = setInterval(async () => {
      await this.processDraftPick(draftId);
    }, 5000); // Pick every 5 seconds for demo speed

    this.activeDrafts.set(draftId, interval);

    // Broadcast draft start
    const draftState = await this.getDraftState(draftId);
    await this.wsManager.broadcastToLeague(draftState.config.leagueId, {
      type: 'draft_started',
      draftId,
      draftOrder: draftState.draftOrder,
      timestamp: new Date().toISOString()
    });
  }

  async processDraftPick(draftId: string): Promise<void> {
    try {
      const draftState = await this.getDraftState(draftId);
      
      if (!draftState || draftState.completed) {
        this.activeDrafts.delete(draftId);
        return;
      }

      const currentTeamIndex = this.getCurrentDraftingTeam(
        draftState.currentPick, 
        draftState.config.rounds,
        draftState.draftOrder.length
      );

      const currentTeamId = draftState.draftOrder[currentTeamIndex];
      const currentPersonality = draftState.personalities.find(p => p.teamId === currentTeamId)!;

      // AI makes the draft pick
      const pick = await this.makeAIDraftPick(
        draftState,
        currentPersonality,
        draftState.currentPick
      );

      // Update draft state
      draftState.picks.push(pick);
      draftState.currentPick++;

      // Check if draft is complete
      const totalPicks = draftState.config.rounds * draftState.draftOrder.length;
      if (draftState.currentPick > totalPicks) {
        draftState.completed = true;
        this.activeDrafts.delete(draftId);
        await this.finalizeDraft(draftId, draftState);
      }

      // Update stored state
      await this.updateDraftState(draftId, draftState);

      // Broadcast pick
      await this.wsManager.broadcastToLeague(draftState.config.leagueId, {
        type: 'draft_pick_made',
        draftId,
        pick,
        currentPick: draftState.currentPick,
        completed: draftState.completed,
        timestamp: new Date().toISOString()
      });

      // Simulate pick time for realism
      await new Promise(resolve => setTimeout(resolve, 
        Math.random() * 3000 + 2000 // 2-5 seconds
      ));

    } catch (error) {
      console.error('Error processing draft pick:', error);
    }
  }

  private async generateTeamPersonalities(leagueId: string): Promise<TeamPersonality[]> {
    const client = await this.pool.connect();
    try {
      const { rows: teams } = await client.query(`
        SELECT t.id, t.team_name, t.user_id, u.email
        FROM teams t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.league_id = $1 AND t.active = true
        ORDER BY t.created_at
      `, [leagueId]);

      const strategies = ['value_based', 'positional', 'contrarian', 'safe', 'aggressive', 'balanced'];
      const personalities: TeamPersonality[] = [];

      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const strategy = strategies[i % strategies.length];
        
        // Generate AI personality using user behavior if available
        const userBehavior = team.user_id ? 
          await this.behaviorAnalysis.getUserBehaviorProfile(team.user_id, leagueId) : null;

        const personality = await this.generatePersonalityForStrategy(strategy, userBehavior);
        
        personalities.push({
          teamId: team.id,
          userId: team.user_id,
          strategy: strategy as any,
          ...personality
        });
      }

      // Ensure diverse strategies
      return this.diversifyPersonalities(personalities);
    } finally {
      client.release();
    }
  }

  private async generatePersonalityForStrategy(
    strategy: string, 
    userBehavior: any
  ): Promise<Partial<TeamPersonality>> {
    const aiPrompt = `Generate a fantasy football draft personality for strategy: ${strategy}

${userBehavior ? `User behavior context: ${JSON.stringify(userBehavior)}` : ''}

Create realistic draft personality with:
1. Risk tolerance (0-1)
2. Position preferences (QB, RB, WR, TE percentages)
3. Personality traits (rookieFocused, veteranBias, etc.)
4. 2-3 draft notes explaining approach

Return JSON format with riskTolerance, positionPreferences, personalityTraits, draftNotes.`;

    const response = await this.aiRouter.generateResponse({
      model: 'claude-3-haiku',
      messages: [{ role: 'user', content: aiPrompt }],
      context: { action: 'draft_personality', strategy }
    });

    try {
      return JSON.parse(response.content);
    } catch {
      // Fallback to default personality
      return this.getDefaultPersonality(strategy);
    }
  }

  private getDefaultPersonality(strategy: string): Partial<TeamPersonality> {
    const defaults: Record<string, Partial<TeamPersonality>> = {
      value_based: {
        riskTolerance: 0.3,
        positionPreferences: { RB: 0.35, WR: 0.35, QB: 0.15, TE: 0.10, DST: 0.03, K: 0.02 },
        personalityTraits: {
          handcuffsLover: false,
          rookieFocused: false,
          veteranBias: true,
          injuryAverse: true,
          sleperHunter: false,
          consistencyFocused: true,
          upside_chaser: false
        },
        draftNotes: ["Focus on proven value", "Avoid reaches", "Target consistent producers"]
      },
      positional: {
        riskTolerance: 0.6,
        positionPreferences: { RB: 0.45, WR: 0.30, QB: 0.10, TE: 0.10, DST: 0.03, K: 0.02 },
        personalityTraits: {
          handcuffsLover: true,
          rookieFocused: false,
          veteranBias: false,
          injuryAverse: false,
          sleperHunter: false,
          consistencyFocused: false,
          upside_chaser: true
        },
        draftNotes: ["RB early and often", "Build depth at scarcity positions", "Don't chase QBs"]
      },
      contrarian: {
        riskTolerance: 0.8,
        positionPreferences: { QB: 0.25, TE: 0.20, WR: 0.30, RB: 0.20, DST: 0.03, K: 0.02 },
        personalityTraits: {
          handcuffsLover: false,
          rookieFocused: true,
          veteranBias: false,
          injuryAverse: false,
          sleperHunter: true,
          consistencyFocused: false,
          upside_chaser: true
        },
        draftNotes: ["Zig when others zag", "Target undervalued positions", "High upside focus"]
      },
      safe: {
        riskTolerance: 0.2,
        positionPreferences: { RB: 0.30, WR: 0.35, QB: 0.20, TE: 0.10, DST: 0.03, K: 0.02 },
        personalityTraits: {
          handcuffsLover: true,
          rookieFocused: false,
          veteranBias: true,
          injuryAverse: true,
          sleperHunter: false,
          consistencyFocused: true,
          upside_chaser: false
        },
        draftNotes: ["Minimize risk", "Target reliable veterans", "Avoid injury-prone players"]
      },
      aggressive: {
        riskTolerance: 0.9,
        positionPreferences: { RB: 0.40, WR: 0.35, QB: 0.10, TE: 0.10, DST: 0.03, K: 0.02 },
        personalityTraits: {
          handcuffsLover: false,
          rookieFocused: true,
          veteranBias: false,
          injuryAverse: false,
          sleperHunter: true,
          consistencyFocused: false,
          upside_chaser: true
        },
        draftNotes: ["Swing for the fences", "Target breakout candidates", "High risk, high reward"]
      },
      balanced: {
        riskTolerance: 0.5,
        positionPreferences: { RB: 0.30, WR: 0.30, QB: 0.20, TE: 0.15, DST: 0.03, K: 0.02 },
        personalityTraits: {
          handcuffsLover: false,
          rookieFocused: false,
          veteranBias: false,
          injuryAverse: false,
          sleperHunter: false,
          consistencyFocused: true,
          upside_chaser: false
        },
        draftNotes: ["Best player available", "Balanced approach", "Adapt to draft flow"]
      }
    };

    return defaults[strategy] || defaults.balanced;
  }

  private diversifyPersonalities(personalities: TeamPersonality[]): TeamPersonality[] {
    // Ensure no duplicate strategies and add variety
    const usedStrategies = new Set<string>();
    const strategies = ['value_based', 'positional', 'contrarian', 'safe', 'aggressive', 'balanced'];
    
    return personalities.map((personality, index) => {
      if (usedStrategies.has(personality.strategy)) {
        // Find unused strategy
        const unusedStrategy = strategies.find(s => !usedStrategies.has(s));
        if (unusedStrategy) {
          personality.strategy = unusedStrategy as any;
        }
      }
      
      usedStrategies.add(personality.strategy);
      
      // Add some randomization to make each team unique
      personality.riskTolerance = Math.max(0.1, Math.min(0.9, 
        personality.riskTolerance + (Math.random() - 0.5) * 0.2
      ));

      return personality;
    });
  }

  private async generateDraftOrder(leagueId: string, personalities: TeamPersonality[]): Promise<string[]> {
    // Randomize draft order fairly
    const teamIds = personalities.map(p => p.teamId);
    
    for (let i = teamIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
    }

    // Store draft order for transparency
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO draft_orders (league_id, draft_order, generated_at)
        VALUES ($1, $2, NOW())
      `, [leagueId, JSON.stringify(teamIds)]);
    } finally {
      client.release();
    }

    return teamIds;
  }

  private async prepareDraftBoard(leagueId: string, personalities: TeamPersonality[]): Promise<DraftBoard> {
    const client = await this.pool.connect();
    try {
      // Get all draftable players
      const { rows: players } = await client.query(`
        SELECT 
          p.*,
          p.projected_points,
          p.adp,
          p.injury_status,
          p.bye_week,
          p.years_exp
        FROM players p
        WHERE p.rostered = false
          AND p.position IN ('QB', 'RB', 'WR', 'TE', 'K', 'DST')
          AND p.projected_points > 0
        ORDER BY p.adp ASC, p.projected_points DESC
      `);

      // Evaluate each player
      const evaluatedPlayers: PlayerEvaluation[] = await Promise.all(
        players.map(player => this.evaluatePlayer(player, personalities))
      );

      // Create position tiers
      const tiers = this.createPositionTiers(evaluatedPlayers);

      // Create personalized rankings for each team
      const personalizedRankings: Record<string, PlayerEvaluation[]> = {};
      for (const personality of personalities) {
        personalizedRankings[personality.teamId] = this.createPersonalizedRankings(
          evaluatedPlayers,
          personality
        );
      }

      // Identify sleepers, busts, and breakouts using AI
      const [sleepers, busts, breakouts] = await Promise.all([
        this.identifySleepers(evaluatedPlayers),
        this.identifyBusts(evaluatedPlayers),
        this.identifyBreakouts(evaluatedPlayers)
      ]);

      return {
        players: evaluatedPlayers,
        tiers,
        personalizedRankings,
        sleepers,
        busts,
        breakouts
      };
    } finally {
      client.release();
    }
  }

  private async evaluatePlayer(player: any, personalities: TeamPersonality[]): Promise<PlayerEvaluation> {
    // Calculate comprehensive player evaluation
    const baseValue = player.projected_points / 100; // Normalize
    const adpValue = Math.max(0, (500 - (player.adp || 300)) / 500); // Higher is better for early ADP
    
    const injuryRisk = this.calculateInjuryRisk(player);
    const ageImpact = this.calculateAgeImpact(player.years_exp);
    const consistencyScore = await this.calculateConsistencyScore(player.id);
    const upsideScore = await this.calculateUpsideScore(player);

    return {
      playerId: player.id,
      overallValue: (baseValue + adpValue) / 2,
      positionalValue: await this.calculatePositionalValue(player),
      teamFit: 0.5, // Will be calculated per team
      adpDifferential: 0, // Will be calculated during draft
      injuryRisk,
      upside: upsideScore,
      floor: consistencyScore,
      consistency: consistencyScore,
      age: player.years_exp || 0,
      rookieBonus: player.years_exp === 0 ? 0.1 : 0
    };
  }

  private calculateInjuryRisk(player: any): number {
    if (player.injury_status === 'out') return 0.9;
    if (player.injury_status === 'doubtful') return 0.7;
    if (player.injury_status === 'questionable') return 0.4;
    
    // Factor in age and position
    const ageRisk = Math.min(0.6, (player.years_exp || 0) * 0.05);
    const positionRisk = player.position === 'RB' ? 0.3 : 0.1;
    
    return Math.min(0.9, ageRisk + positionRisk);
  }

  private calculateAgeImpact(yearsExp: number): number {
    if (!yearsExp) return 1.0; // Rookie bonus
    if (yearsExp <= 3) return 0.9;
    if (yearsExp <= 6) return 1.0; // Prime years
    if (yearsExp <= 9) return 0.8;
    return 0.6; // Veterans
  }

  private async calculateConsistencyScore(playerId: string): Promise<number> {
    // This would analyze historical weekly performance variance
    // For now, return a baseline score
    return 0.5;
  }

  private async calculateUpsideScore(player: any): Promise<number> {
    // Calculate upside based on situation, talent, opportunity
    let upside = 0.5;
    
    if (player.years_exp === 0) upside += 0.2; // Rookies have upside
    if (player.position === 'RB' && player.projected_points > 150) upside += 0.3;
    if (player.position === 'WR' && player.age < 26) upside += 0.2;
    
    return Math.min(1.0, upside);
  }

  private async calculatePositionalValue(player: any): Promise<number> {
    // Calculate value relative to position scarcity
    const positionScarcity = {
      QB: 0.3, // Lots of viable QBs
      RB: 0.8, // RBs are scarce
      WR: 0.6, // Moderate WR scarcity
      TE: 0.9, // Very few elite TEs
      K: 0.1,  // All kickers similar
      DST: 0.2 // Defenses are streamable
    };

    return positionScarcity[player.position as keyof typeof positionScarcity] || 0.5;
  }

  private createPositionTiers(players: PlayerEvaluation[]): Record<string, PlayerEvaluation[]> {
    const tiers: Record<string, PlayerEvaluation[]> = {};
    
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    
    for (const position of positions) {
      const positionPlayers = players.filter(p => {
        // Find player details from the full data
        return true; // Simplified for now
      }).sort((a, b) => b.positionalValue - a.positionalValue);

      // Create tiers (12 players per tier approximately)
      const tierSize = 12;
      const tierCount = Math.ceil(positionPlayers.length / tierSize);
      
      for (let i = 0; i < tierCount; i++) {
        const tierKey = `${position}_tier_${i + 1}`;
        tiers[tierKey] = positionPlayers.slice(i * tierSize, (i + 1) * tierSize);
      }
    }

    return tiers;
  }

  private createPersonalizedRankings(
    players: PlayerEvaluation[],
    personality: TeamPersonality
  ): PlayerEvaluation[] {
    return players.map(player => {
      // Adjust rankings based on personality
      const adjusted = { ...player };
      
      // Apply personality modifiers
      if (personality.personalityTraits.rookieFocused && player.age === 0) {
        adjusted.overallValue += 0.1;
      }
      
      if (personality.personalityTraits.veteranBias && player.age > 6) {
        adjusted.overallValue += 0.05;
      }
      
      if (personality.personalityTraits.injuryAverse) {
        adjusted.overallValue -= player.injuryRisk * 0.3;
      }
      
      if (personality.personalityTraits.upside_chaser) {
        adjusted.overallValue += player.upside * 0.2;
      }
      
      if (personality.personalityTraits.consistencyFocused) {
        adjusted.overallValue += player.consistency * 0.15;
      }
      
      return adjusted;
    }).sort((a, b) => b.overallValue - a.overallValue);
  }

  private async identifySleepers(players: PlayerEvaluation[]): Promise<PlayerEvaluation[]> {
    // AI identifies potential sleepers based on ADP vs projected value
    return players
      .filter(p => p.adpDifferential > 20 && p.upside > 0.7)
      .sort((a, b) => b.upside - a.upside)
      .slice(0, 20);
  }

  private async identifyBusts(players: PlayerEvaluation[]): Promise<PlayerEvaluation[]> {
    // AI identifies potential busts (high ADP, concerning factors)
    return players
      .filter(p => p.adpDifferential < -20 && p.injuryRisk > 0.6)
      .sort((a, b) => b.injuryRisk - a.injuryRisk)
      .slice(0, 15);
  }

  private async identifyBreakouts(players: PlayerEvaluation[]): Promise<PlayerEvaluation[]> {
    // AI identifies breakout candidates
    return players
      .filter(p => p.upside > 0.8 && p.age <= 4)
      .sort((a, b) => b.upside - a.upside)
      .slice(0, 25);
  }

  private getCurrentDraftingTeam(pick: number, rounds: number, teamCount: number): number {
    const round = Math.ceil(pick / teamCount);
    const pickInRound = ((pick - 1) % teamCount) + 1;
    
    // Snake draft logic
    if (round % 2 === 1) {
      return pickInRound - 1; // 0-indexed
    } else {
      return teamCount - pickInRound; // Reverse order
    }
  }

  private async makeAIDraftPick(
    draftState: any,
    personality: TeamPersonality,
    pickNumber: number
  ): Promise<DraftPick> {
    const round = Math.ceil(pickNumber / draftState.draftOrder.length);
    
    // Get current roster needs
    const rosterNeeds = await this.calculateRosterNeeds(personality.teamId, draftState.picks);
    
    // Get available players
    const availablePlayers = this.getAvailablePlayers(draftState.draftBoard.players, draftState.picks);
    
    // Apply personality-based filtering
    const personalizedPlayers = draftState.draftBoard.personalizedRankings[personality.teamId]
      .filter(p => availablePlayers.some(ap => ap.playerId === p.playerId));

    // AI makes selection based on strategy
    const selectedPlayer = await this.selectBestPlayer(
      personalizedPlayers,
      personality,
      rosterNeeds,
      round,
      pickNumber
    );

    // Generate AI reasoning
    const reasoning = await this.generatePickReasoning(selectedPlayer, personality, round, rosterNeeds);

    return {
      pickNumber,
      round,
      teamId: personality.teamId,
      playerId: selectedPlayer.playerId,
      playerName: `Player_${selectedPlayer.playerId}`, // Would get from DB
      position: this.getPlayerPosition(selectedPlayer.playerId), // Would get from DB
      pickTime: Math.floor(Math.random() * 30) + 15, // 15-45 seconds
      aiConfidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      alternativeOptions: personalizedPlayers
        .slice(1, 4)
        .map(p => p.playerId),
      reasoning
    };
  }

  private async calculateRosterNeeds(teamId: string, picks: DraftPick[]): Promise<Record<string, number>> {
    const teamPicks = picks.filter(p => p.teamId === teamId);
    const positionCounts: Record<string, number> = {};
    
    teamPicks.forEach(pick => {
      positionCounts[pick.position] = (positionCounts[pick.position] || 0) + 1;
    });

    // Return needs (higher number = more needed)
    return {
      QB: Math.max(0, 2 - (positionCounts.QB || 0)),
      RB: Math.max(0, 4 - (positionCounts.RB || 0)),
      WR: Math.max(0, 5 - (positionCounts.WR || 0)),
      TE: Math.max(0, 2 - (positionCounts.TE || 0)),
      K: Math.max(0, 1 - (positionCounts.K || 0)),
      DST: Math.max(0, 1 - (positionCounts.DST || 0))
    };
  }

  private getAvailablePlayers(allPlayers: PlayerEvaluation[], picks: DraftPick[]): PlayerEvaluation[] {
    const draftedPlayerIds = new Set(picks.map(p => p.playerId).filter(Boolean));
    return allPlayers.filter(p => !draftedPlayerIds.has(p.playerId));
  }

  private async selectBestPlayer(
    availablePlayers: PlayerEvaluation[],
    personality: TeamPersonality,
    rosterNeeds: Record<string, number>,
    round: number,
    pickNumber: number
  ): Promise<PlayerEvaluation> {
    // Apply strategy-specific selection logic
    switch (personality.strategy) {
      case 'value_based':
        return this.selectByValue(availablePlayers, rosterNeeds);
      
      case 'positional':
        return this.selectByPosition(availablePlayers, rosterNeeds, round);
      
      case 'contrarian':
        return this.selectContrarian(availablePlayers, rosterNeeds);
      
      case 'safe':
        return this.selectSafest(availablePlayers, rosterNeeds);
      
      case 'aggressive':
        return this.selectHighestUpside(availablePlayers, rosterNeeds);
      
      default: // balanced
        return this.selectBalanced(availablePlayers, rosterNeeds, round);
    }
  }

  private selectByValue(players: PlayerEvaluation[], needs: Record<string, number>): PlayerEvaluation {
    // Simple best overall value
    return players.sort((a, b) => b.overallValue - a.overallValue)[0];
  }

  private selectByPosition(players: PlayerEvaluation[], needs: Record<string, number>, round: number): PlayerEvaluation {
    // Early rounds: RB/WR focus
    if (round <= 6) {
      const rbwr = players.filter(p => 
        this.getPlayerPosition(p.playerId) === 'RB' || 
        this.getPlayerPosition(p.playerId) === 'WR'
      );
      if (rbwr.length > 0) {
        return rbwr.sort((a, b) => b.positionalValue - a.positionalValue)[0];
      }
    }
    
    return this.selectByValue(players, needs);
  }

  private selectContrarian(players: PlayerEvaluation[], needs: Record<string, number>): PlayerEvaluation {
    // Look for players going later than ADP suggests
    return players
      .filter(p => p.adpDifferential > 0 || p.upside > 0.7)
      .sort((a, b) => b.upside - a.upside)[0] || players[0];
  }

  private selectSafest(players: PlayerEvaluation[], needs: Record<string, number>): PlayerEvaluation {
    return players
      .filter(p => p.injuryRisk < 0.4)
      .sort((a, b) => b.consistency - a.consistency)[0] || players[0];
  }

  private selectHighestUpside(players: PlayerEvaluation[], needs: Record<string, number>): PlayerEvaluation {
    return players.sort((a, b) => b.upside - a.upside)[0];
  }

  private selectBalanced(players: PlayerEvaluation[], needs: Record<string, number>, round: number): PlayerEvaluation {
    // Balanced approach considering needs and value
    return players.sort((a, b) => {
      const aScore = a.overallValue + (needs[this.getPlayerPosition(a.playerId)] || 0) * 0.1;
      const bScore = b.overallValue + (needs[this.getPlayerPosition(b.playerId)] || 0) * 0.1;
      return bScore - aScore;
    })[0];
  }

  private getPlayerPosition(playerId: string): string {
    // This would query the database for the player's position
    // For now, return a random position for demo
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    return positions[Math.floor(Math.random() * positions.length)];
  }

  private async generatePickReasoning(
    player: PlayerEvaluation,
    personality: TeamPersonality,
    round: number,
    needs: Record<string, number>
  ): Promise<string> {
    const position = this.getPlayerPosition(player.playerId);
    const strategies = {
      value_based: `Great value at this pick - solid floor with ${(player.consistency * 100).toFixed(0)}% consistency`,
      positional: `Building ${position} depth early - position scarcity matters`,
      contrarian: `Undervalued gem with ${(player.upside * 100).toFixed(0)}% breakout potential`,
      safe: `Low-risk pick with proven track record and minimal injury concerns`,
      aggressive: `High upside play - ceiling is worth the risk`,
      balanced: `Best player available that fills a roster need`
    };

    return strategies[personality.strategy] || strategies.balanced;
  }

  // Database operations
  private async createDraft(config: DraftConfig): Promise<string> {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        INSERT INTO auto_drafts (league_id, config, status, created_at)
        VALUES ($1, $2, 'initialized', NOW())
        RETURNING id
      `, [config.leagueId, JSON.stringify(config)]);

      return rows[0].id;
    } finally {
      client.release();
    }
  }

  private async storeDraftState(draftId: string, state: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE auto_drafts 
        SET draft_state = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(state), draftId]);
    } finally {
      client.release();
    }
  }

  private async getDraftState(draftId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT draft_state FROM auto_drafts WHERE id = $1
      `, [draftId]);

      return rows[0] ? JSON.parse(rows[0].draft_state) : null;
    } finally {
      client.release();
    }
  }

  private async updateDraftState(draftId: string, state: any): Promise<void> {
    await this.storeDraftState(draftId, state);
  }

  private async finalizeDraft(draftId: string, draftState: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Mark draft as completed
      await client.query(`
        UPDATE auto_drafts 
        SET status = 'completed', completed_at = NOW()
        WHERE id = $1
      `, [draftId]);

      // Create actual rosters from draft picks
      for (const pick of draftState.picks) {
        if (pick.playerId) {
          await client.query(`
            INSERT INTO roster_players (team_id, player_id, acquired_date, acquisition_type)
            VALUES ($1, $2, NOW(), 'draft')
          `, [pick.teamId, pick.playerId]);
        }
      }

      // Broadcast draft completion
      await this.wsManager.broadcastToLeague(draftState.config.leagueId, {
        type: 'draft_completed',
        draftId,
        totalPicks: draftState.picks.length,
        timestamp: new Date().toISOString()
      });

    } finally {
      client.release();
    }
  }

  // Public API methods
  async getDraftSummary(draftId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT * FROM auto_drafts WHERE id = $1
      `, [draftId]);

      if (rows.length === 0) return null;

      const draft = rows[0];
      const state = JSON.parse(draft.draft_state || '{}');

      return {
        draftId,
        status: draft.status,
        config: JSON.parse(draft.config),
        personalities: state.personalities || [],
        draftOrder: state.draftOrder || [],
        picks: state.picks || [],
        currentPick: state.currentPick || 1,
        completed: state.completed || false,
        createdAt: draft.created_at,
        completedAt: draft.completed_at
      };
    } finally {
      client.release();
    }
  }

  async pauseDraft(draftId: string): Promise<void> {
    const interval = this.activeDrafts.get(draftId);
    if (interval) {
      clearInterval(interval);
      this.activeDrafts.delete(draftId);
    }

    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE auto_drafts SET status = 'paused' WHERE id = $1
      `, [draftId]);
    } finally {
      client.release();
    }
  }

  async resumeDraft(draftId: string): Promise<void> {
    await this.startAutoDraft(draftId);

    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE auto_drafts SET status = 'active' WHERE id = $1
      `, [draftId]);
    } finally {
      client.release();
    }
  }
}