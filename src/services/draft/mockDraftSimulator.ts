/**
 * Advanced Mock Draft Simulator with AI Opponents
 * Realistic AI opponent behavior that mimics real fantasy managers
 */

import { database } from '../../lib/database';
import { aiPredictionEngine } from '../ai/predictionEngine';
import { draftAssistant, type DraftRecommendation, type TeamNeeds } from './draftAssistant';

export interface MockDraftSettings {
  leagueSize: number;
  rounds: number;
  scoringFormat: 'standard' | 'ppr' | 'half_ppr';
  startingPositions: Record<string, number>;
  draftType: 'snake' | 'linear';
  timerLength: number; // seconds per pick
  aiPersonalities: AIPersonality[];
}

export interface AIPersonality {
  teamId: string;
  name: string;
  archetype: 'analytics' | 'traditional' | 'homer' | 'contrarian' | 'rookie_lover' | 'veteran_focused';
  aggressiveness: number; // 0-1, how likely to reach for players
  consistency: number; // 0-1, how much they stick to rankings
  positionPreference: Record<string, number>; // Position weighting
  riskTolerance: number; // 0-1, willingness to draft risky players
  reactionTime: number; // Average seconds to make pick
}

export interface MockDraftPick {
  pickNumber: number;
  round: number;
  pickInRound: number;
  teamId: string;
  playerId: string;
  playerName: string;
  position: string;
  adp: number;
  reach: number; // Difference from ADP
  reasoning: string;
  timeToDecision: number;
}

export interface MockDraftResult {
  draftId: string;
  settings: MockDraftSettings;
  picks: MockDraftPick[];
  teamRosters: Record<string, MockDraftPick[]>;
  userTeamAnalysis: {
    grade: string;
    strengths: string[];
    weaknesses: string[];
    sleepers: string[];
    reaches: string[];
    overallRank: number;
  };
  draftAnalysis: {
    surprises: MockDraftPick[];
    steals: MockDraftPick[];
    reaches: MockDraftPick[];
    positionRuns: Array<{
      position: string;
      startRound: number;
      pickCount: number;
    }>;
  };
}

export interface DraftBoard {
  available: DraftPlayer[];
  picked: DraftPlayer[];
  positionCounts: Record<string, number>;
  runs: Array<{
    position: string;
    picks: number;
    round: number;
  }>;
}

export interface DraftPlayer {
  playerId: string;
  name: string;
  position: string;
  team: string;
  adp: number;
  projectedPoints: number;
  tier: number;
  bye: number;
  injuryRisk: number;
  upside: number;
  floor: number;
  consistency: number;
}

class MockDraftSimulator {
  private activeDrafts = new Map<string, MockDraftResult>();
  private aiPersonalityTemplates: Record<string, Partial<AIPersonality>> = {
    analytics: {
      archetype: 'analytics',
      aggressiveness: 0.2,
      consistency: 0.9,
      riskTolerance: 0.3,
      reactionTime: 8,
      positionPreference: { QB: 0.8, RB: 1.2, WR: 1.1, TE: 0.7, K: 0.3, DST: 0.4 }
    },
    traditional: {
      archetype: 'traditional',
      aggressiveness: 0.4,
      consistency: 0.7,
      riskTolerance: 0.5,
      reactionTime: 12,
      positionPreference: { QB: 1.0, RB: 1.1, WR: 1.0, TE: 0.8, K: 0.6, DST: 0.7 }
    },
    homer: {
      archetype: 'homer',
      aggressiveness: 0.6,
      consistency: 0.5,
      riskTolerance: 0.7,
      reactionTime: 6,
      positionPreference: { QB: 1.0, RB: 1.0, WR: 1.0, TE: 1.0, K: 1.0, DST: 1.0 }
    },
    contrarian: {
      archetype: 'contrarian',
      aggressiveness: 0.8,
      consistency: 0.4,
      riskTolerance: 0.8,
      reactionTime: 15,
      positionPreference: { QB: 0.6, RB: 0.9, WR: 0.8, TE: 1.2, K: 0.8, DST: 0.9 }
    },
    rookie_lover: {
      archetype: 'rookie_lover',
      aggressiveness: 0.7,
      consistency: 0.6,
      riskTolerance: 0.9,
      reactionTime: 10,
      positionPreference: { QB: 1.0, RB: 1.3, WR: 1.2, TE: 1.1, K: 0.4, DST: 0.5 }
    },
    veteran_focused: {
      archetype: 'veteran_focused',
      aggressiveness: 0.3,
      consistency: 0.8,
      riskTolerance: 0.2,
      reactionTime: 14,
      positionPreference: { QB: 1.1, RB: 1.0, WR: 1.0, TE: 0.9, K: 0.7, DST: 0.8 }
    }
  };

  // Start a new mock draft simulation
  async startMockDraft(
    userTeamId: string,
    settings: MockDraftSettings
  ): Promise<string> {
    try {
      const draftId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Initialize draft board
      const draftBoard = await this.initializeDraftBoard(settings);
      
      // Generate AI personalities
      const aiPersonalities = this.generateAIPersonalities(settings.leagueSize, userTeamId);
      
      // Create draft state
      const draftResult: MockDraftResult = {
        draftId,
        settings: { ...settings, aiPersonalities },
        picks: [],
        teamRosters: {},
        userTeamAnalysis: {
          grade: 'TBD',
          strengths: [],
          weaknesses: [],
          sleepers: [],
          reaches: [],
          overallRank: 0
        },
        draftAnalysis: {
          surprises: [],
          steals: [],
          reaches: [],
          positionRuns: []
        }
      };

      // Initialize team rosters
      for (let i = 1; i <= settings.leagueSize; i++) {
        draftResult.teamRosters[`team_${i}`] = [];
      }

      this.activeDrafts.set(draftId, draftResult);
      
      console.log(`🏈 Mock draft started: ${draftId} with ${settings.leagueSize} teams`);
      return draftId;
    } catch (error) {
      console.error('Error starting mock draft:', error);
      throw new Error('Failed to start mock draft');
    }
  }

  // Simulate the entire draft automatically
  async simulateFullDraft(draftId: string): Promise<MockDraftResult> {
    const draft = this.activeDrafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    try {
      const totalPicks = draft.settings.leagueSize * draft.settings.rounds;
      const draftBoard = await this.initializeDraftBoard(draft.settings);

      // Generate draft order
      const draftOrder = this.generateDraftOrder(draft.settings);

      for (let pickNumber = 1; pickNumber <= totalPicks; pickNumber++) {
        const teamId = draftOrder[pickNumber - 1];
        const round = Math.ceil(pickNumber / draft.settings.leagueSize);
        const pickInRound = ((pickNumber - 1) % draft.settings.leagueSize) + 1;

        // Make the pick
        const pick = await this.makeAIPick(
          draftId,
          teamId,
          pickNumber,
          round,
          pickInRound,
          draftBoard,
          draft.settings.aiPersonalities.find(p => p.teamId === teamId)!
        );

        draft.picks.push(pick);
        draft.teamRosters[teamId].push(pick);

        // Remove picked player from available
        draftBoard.available = draftBoard.available.filter(p => p.playerId !== pick.playerId);
        draftBoard.picked.push(draftBoard.available.find(p => p.playerId === pick.playerId)!);
        
        // Update position counts
        draftBoard.positionCounts[pick.position] = (draftBoard.positionCounts[pick.position] || 0) + 1;
      }

      // Analyze the draft
      await this.analyzeDraft(draft);

      console.log(`✅ Mock draft completed: ${draftId}`);
      return draft;
    } catch (error) {
      console.error('Error simulating draft:', error);
      throw new Error('Failed to simulate draft');
    }
  }

  // Make a single pick for user with AI recommendations
  async makeUserPick(
    draftId: string,
    userTeamId: string,
    playerId: string
  ): Promise<MockDraftPick> {
    const draft = this.activeDrafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    try {
      const pickNumber = draft.picks.length + 1;
      const round = Math.ceil(pickNumber / draft.settings.leagueSize);
      const pickInRound = ((pickNumber - 1) % draft.settings.leagueSize) + 1;

      // Get player data
      const playerResult = await database.query(`
        SELECT np.*, COALESCE(np.adp, 999) as adp
        FROM nfl_players np
        WHERE np.id = $1
      `, [playerId]);

      if (playerResult.rows.length === 0) {
        throw new Error('Player not found');
      }

      const player = playerResult.rows[0];
      const adp = parseFloat(player.adp) || pickNumber;
      const reach = pickNumber - adp;

      const pick: MockDraftPick = {
        pickNumber,
        round,
        pickInRound,
        teamId: userTeamId,
        playerId,
        playerName: `${player.first_name} ${player.last_name}`,
        position: player.position,
        adp,
        reach,
        reasoning: 'User selection',
        timeToDecision: 0
      };

      draft.picks.push(pick);
      draft.teamRosters[userTeamId].push(pick);

      return pick;
    } catch (error) {
      console.error('Error making user pick:', error);
      throw new Error('Failed to make user pick');
    }
  }

  // Get AI recommendations for user's next pick
  async getPickRecommendations(
    draftId: string,
    userTeamId: string,
    count: number = 5
  ): Promise<DraftRecommendation[]> {
    const draft = this.activeDrafts.get(draftId);
    if (!draft) throw new Error('Draft not found');

    try {
      // Get available players
      const pickedPlayerIds = draft.picks.map(p => p.playerId);
      const availableResult = await database.query(`
        SELECT np.*, COALESCE(np.adp, 999) as adp
        FROM nfl_players np
        WHERE np.id NOT IN (${pickedPlayerIds.map((_, i) => `$${i + 1}`).join(',')})
        ORDER BY COALESCE(np.adp, 999) ASC
        LIMIT 50
      `, pickedPlayerIds);

      const availablePlayers = availableResult.rows.map(row => row.id);
      const currentPick = draft.picks.length + 1;

      // Use draft assistant for recommendations
      return await draftAssistant.getDraftRecommendations(
        'mock_league',
        userTeamId,
        currentPick,
        availablePlayers
      );
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  // Private helper methods
  private async initializeDraftBoard(settings: MockDraftSettings): Promise<DraftBoard> {
    try {
      // Get all draftable players
      const playersResult = await database.query(`
        SELECT 
          np.id as player_id,
          CONCAT(np.first_name, ' ', np.last_name) as name,
          np.position,
          COALESCE(nt.abbreviation, 'FA') as team,
          COALESCE(np.adp, 999) as adp,
          COALESCE(np.projected_points, 0) as projected_points,
          COALESCE(np.tier, 10) as tier,
          COALESCE(nt.bye_week, 0) as bye,
          COALESCE(np.injury_risk, 0.1) as injury_risk,
          COALESCE(np.upside_score, 0.5) as upside,
          COALESCE(np.floor_score, 0.5) as floor,
          COALESCE(np.consistency_score, 0.5) as consistency
        FROM nfl_players np
        LEFT JOIN nfl_teams nt ON np.team_id = nt.id
        WHERE np.adp IS NOT NULL AND np.adp <= 300
        ORDER BY np.adp ASC
      `);

      const available: DraftPlayer[] = playersResult.rows.map(row => ({
        playerId: row.player_id,
        name: row.name,
        position: row.position,
        team: row.team,
        adp: parseFloat(row.adp),
        projectedPoints: parseFloat(row.projected_points),
        tier: parseInt(row.tier),
        bye: parseInt(row.bye),
        injuryRisk: parseFloat(row.injury_risk),
        upside: parseFloat(row.upside),
        floor: parseFloat(row.floor),
        consistency: parseFloat(row.consistency)
      }));

      return {
        available,
        picked: [],
        positionCounts: {},
        runs: []
      };
    } catch (error) {
      console.error('Error initializing draft board:', error);
      return {
        available: [],
        picked: [],
        positionCounts: {},
        runs: []
      };
    }
  }

  private generateAIPersonalities(leagueSize: number, userTeamId: string): AIPersonality[] {
    const personalities: AIPersonality[] = [];
    const archetypes = Object.keys(this.aiPersonalityTemplates);

    for (let i = 1; i <= leagueSize; i++) {
      const teamId = `team_${i}`;
      
      if (teamId === userTeamId) continue; // Skip user team

      const archetype = archetypes[i % archetypes.length];
      const template = this.aiPersonalityTemplates[archetype];

      personalities.push({
        teamId,
        name: `AI Team ${i}`,
        archetype: template.archetype!,
        aggressiveness: template.aggressiveness! + (Math.random() - 0.5) * 0.2,
        consistency: template.consistency! + (Math.random() - 0.5) * 0.2,
        positionPreference: { ...template.positionPreference! },
        riskTolerance: template.riskTolerance! + (Math.random() - 0.5) * 0.2,
        reactionTime: template.reactionTime! + Math.random() * 5
      });
    }

    return personalities;
  }

  private generateDraftOrder(settings: MockDraftSettings): string[] {
    const order: string[] = [];
    const teams: string[] = [];

    for (let i = 1; i <= settings.leagueSize; i++) {
      teams.push(`team_${i}`);
    }

    for (let round = 1; round <= settings.rounds; round++) {
      if (settings.draftType === 'snake' && round % 2 === 0) {
        // Reverse order for even rounds in snake draft
        order.push(...teams.slice().reverse());
      } else {
        order.push(...teams);
      }
    }

    return order;
  }

  private async makeAIPick(
    draftId: string,
    teamId: string,
    pickNumber: number,
    round: number,
    pickInRound: number,
    draftBoard: DraftBoard,
    personality: AIPersonality
  ): Promise<MockDraftPick> {
    try {
      // Analyze team needs
      const draft = this.activeDrafts.get(draftId)!;
      const teamRoster = draft.teamRosters[teamId];
      const teamNeeds = this.analyzeTeamNeeds(teamRoster, draft.settings);

      // Get candidate players
      const candidates = this.getCandidatePlayers(
        draftBoard.available,
        teamNeeds,
        personality,
        pickNumber
      );

      // AI decision making
      const selectedPlayer = this.makeAIDecision(candidates, personality, teamNeeds, round);

      // Calculate metrics
      const reach = pickNumber - selectedPlayer.adp;
      const reasoning = this.generatePickReasoning(selectedPlayer, personality, teamNeeds, reach);
      const timeToDecision = this.calculateDecisionTime(personality, selectedPlayer);

      return {
        pickNumber,
        round,
        pickInRound,
        teamId,
        playerId: selectedPlayer.playerId,
        playerName: selectedPlayer.name,
        position: selectedPlayer.position,
        adp: selectedPlayer.adp,
        reach,
        reasoning,
        timeToDecision
      };
    } catch (error) {
      console.error('Error making AI pick:', error);
      // Fallback to first available player
      const fallbackPlayer = draftBoard.available[0];
      return {
        pickNumber,
        round,
        pickInRound,
        teamId,
        playerId: fallbackPlayer.playerId,
        playerName: fallbackPlayer.name,
        position: fallbackPlayer.position,
        adp: fallbackPlayer.adp,
        reach: pickNumber - fallbackPlayer.adp,
        reasoning: 'Fallback selection',
        timeToDecision: 10
      };
    }
  }

  private analyzeTeamNeeds(roster: MockDraftPick[], settings: MockDraftSettings): TeamNeeds {
    const positionCounts: Record<string, number> = {};
    const positionNeeds: Record<string, number> = {};

    // Count current positions
    roster.forEach(pick => {
      positionCounts[pick.position] = (positionCounts[pick.position] || 0) + 1;
    });

    // Calculate needs based on starting requirements
    Object.entries(settings.startingPositions).forEach(([position, required]) => {
      const current = positionCounts[position] || 0;
      if (current < required) {
        positionNeeds[position] = 10; // Critical need
      } else if (current === required) {
        positionNeeds[position] = 7; // Depth need
      } else {
        positionNeeds[position] = Math.max(0, 5 - (current - required));
      }
    });

    return {
      teamId: 'mock_team',
      teamName: 'Mock Team',
      positionNeeds,
      overallNeeds: Object.values(positionNeeds).reduce((sum, need) => sum + need, 0) / Object.keys(positionNeeds).length,
      draftStrategy: 'balanced',
      targetPositions: Object.entries(positionNeeds)
        .filter(([_, need]) => need >= 8)
        .map(([position, _]) => position)
    };
  }

  private getCandidatePlayers(
    available: DraftPlayer[],
    teamNeeds: TeamNeeds,
    personality: AIPersonality,
    pickNumber: number
  ): DraftPlayer[] {
    // Filter to reasonable ADP range based on personality
    const adpBuffer = 20 + (personality.aggressiveness * 30); // 20-50 pick buffer
    const candidates = available.filter(player => 
      player.adp <= pickNumber + adpBuffer
    );

    // Score players based on team needs and personality
    return candidates
      .map(player => ({
        ...player,
        aiScore: this.calculateAIScore(player, teamNeeds, personality)
      }))
      .sort((a, b) => (b as any).aiScore - (a as any).aiScore)
      .slice(0, 15); // Top 15 candidates
  }

  private calculateAIScore(
    player: DraftPlayer,
    teamNeeds: TeamNeeds,
    personality: AIPersonality
  ): number {
    let score = 50; // Base score

    // Position need bonus
    const needLevel = teamNeeds.positionNeeds[player.position] || 0;
    score += needLevel * 2;

    // Position preference
    const positionPref = personality.positionPreference[player.position] || 1;
    score += (positionPref - 1) * 10;

    // Risk tolerance adjustment
    if (player.injuryRisk > 0.3) {
      score -= (1 - personality.riskTolerance) * 20;
    }

    // Upside preference for aggressive personalities
    if (personality.aggressiveness > 0.6) {
      score += player.upside * 15;
    }

    // Consistency preference for conservative personalities
    if (personality.aggressiveness < 0.4) {
      score += player.consistency * 15;
    }

    // Age/rookie preference
    if (personality.archetype === 'rookie_lover') {
      // Assume rookies have lower floor scores
      if (player.floor < 0.4) score += 10;
    } else if (personality.archetype === 'veteran_focused') {
      if (player.floor > 0.6) score += 10;
    }

    return Math.max(0, score);
  }

  private makeAIDecision(
    candidates: DraftPlayer[],
    personality: AIPersonality,
    teamNeeds: TeamNeeds,
    round: number
  ): DraftPlayer {
    // Apply consistency factor
    const consistencyThreshold = personality.consistency;
    
    if (Math.random() < consistencyThreshold) {
      // Pick from top 3 candidates
      const topCandidates = candidates.slice(0, 3);
      return topCandidates[Math.floor(Math.random() * topCandidates.length)];
    } else {
      // More unpredictable choice from top 8
      const extendedCandidates = candidates.slice(0, 8);
      return extendedCandidates[Math.floor(Math.random() * extendedCandidates.length)];
    }
  }

  private generatePickReasoning(
    player: DraftPlayer,
    personality: AIPersonality,
    teamNeeds: TeamNeeds,
    reach: number
  ): string {
    const reasons: string[] = [];

    if (teamNeeds.positionNeeds[player.position] >= 8) {
      reasons.push(`addresses critical ${player.position} need`);
    }

    if (reach > 10) {
      reasons.push(`${personality.archetype} personality justifies reach for upside`);
    } else if (reach < -10) {
      reasons.push('excellent value at this pick');
    }

    if (player.tier <= 3) {
      reasons.push('elite tier player');
    }

    if (personality.riskTolerance > 0.7 && player.upside > 0.7) {
      reasons.push('high upside play');
    }

    return reasons.length > 0 
      ? reasons.join(', ')
      : `${personality.archetype} AI selection`;
  }

  private calculateDecisionTime(personality: AIPersonality, player: DraftPlayer): number {
    const baseTime = personality.reactionTime;
    
    // Add variability
    const variance = baseTime * 0.3;
    const time = baseTime + (Math.random() - 0.5) * variance;
    
    return Math.max(3, Math.round(time));
  }

  private async analyzeDraft(draft: MockDraftResult): Promise<void> {
    try {
      // Analyze picks for surprises, steals, and reaches
      draft.draftAnalysis.surprises = draft.picks.filter(pick => Math.abs(pick.reach) > 15);
      draft.draftAnalysis.steals = draft.picks.filter(pick => pick.reach < -10);
      draft.draftAnalysis.reaches = draft.picks.filter(pick => pick.reach > 15);

      // Identify position runs
      const positionRuns: Array<{ position: string; startRound: number; pickCount: number }> = [];
      let currentRun: { position: string; startRound: number; pickCount: number } | null = null;

      for (let i = 0; i < draft.picks.length; i++) {
        const pick = draft.picks[i];
        
        if (currentRun && currentRun.position === pick.position) {
          currentRun.pickCount++;
        } else {
          if (currentRun && currentRun.pickCount >= 3) {
            positionRuns.push(currentRun);
          }
          currentRun = {
            position: pick.position,
            startRound: pick.round,
            pickCount: 1
          };
        }
      }

      if (currentRun && currentRun.pickCount >= 3) {
        positionRuns.push(currentRun);
      }

      draft.draftAnalysis.positionRuns = positionRuns;

      console.log(`📊 Draft analysis completed for ${draft.draftId}`);
    } catch (error) {
      console.error('Error analyzing draft:', error);
    }
  }

  // Get draft results
  getDraftResult(draftId: string): MockDraftResult | undefined {
    return this.activeDrafts.get(draftId);
  }

  // Clean up completed drafts
  cleanup(draftId: string): void {
    this.activeDrafts.delete(draftId);
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeDrafts: number;
    aiPersonalityTypes: number;
  }> {
    try {
      await database.query('SELECT 1');

      return {
        status: 'healthy',
        activeDrafts: this.activeDrafts.size,
        aiPersonalityTypes: Object.keys(this.aiPersonalityTemplates).length
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        activeDrafts: this.activeDrafts.size,
        aiPersonalityTypes: Object.keys(this.aiPersonalityTemplates).length
      };
    }
  }
}

// Singleton instance
export const mockDraftSimulator = new MockDraftSimulator();
export default mockDraftSimulator;