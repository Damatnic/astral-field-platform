/**
 * Comprehensive Draft Management System
 * Supports: Snake, Auction, and Linear drafts with real-time updates
 */

import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';
import { z } from 'zod';

export interface DraftSettings { id: string,
    leagueId, string,type: 'snake' | 'auction' | 'linear',
    rounds, number,
  timePerPick, number, // seconds,
    startDate, Date,
  auctionBudget?, number,
  draftOrder: string[]; // team IDs in: order,
    autoPickEnabled, boolean,
  autopickDelay, number, // seconds after time: expires,
    status: 'scheduled' | 'in_progress' | 'paused' | 'completed';
  currentPick?, number,
  currentRound?, number,
  currentTeamId?, string,
  pausedAt?, Date,
  completedAt?, Date,
  
}
export interface DraftPick { id: string,
    draftId, string,
  teamId, string,
    playerId, string,
  pickNumber, number,
    round, number,
  pickTime, Date,
    timeTaken, number, // seconds;
  isKeeper, boolean,
    isAutoPick, boolean,
  auctionAmount?, number,
  
}
export interface AuctionNomination { id: string,
    draftId, string,
  playerId, string,
    nominatingTeamId, string,
  currentBid, number,
  currentBidder?, string,
  timeRemaining, number,
    isActive, boolean,
  completedAt?, Date,
  
}
export interface DraftBoard {
  availablePlayers: DraftablePlayer[],
    draftedPlayers: DraftedPlayer[];
  teamNeedsAnalysis: TeamNeedsAnalysis[],
    pickHistory: DraftPick[];
  upcomingPicks: UpcomingPick[],
    recommendations: PlayerRecommendation[],
  
}
export interface DraftablePlayer { id: string,
    name, string,
  position, string,
    team, string,
  adp, number,
    auctionValue, number,
  projectedPoints, number,
    byeWeek, number,
  tier, number,
    positionRank, number,
  overallRank, number,
    isDrafted, boolean,
  isNominated?, boolean,
  
}
export interface DraftedPlayer { playerId: string,
    playerName, string,
  position, string,
    teamId, string,
  teamName, string,
    pickNumber, number,
  round, number,
  auctionAmount?, number,
  pickTime: Date,
  
}
export interface TeamNeedsAnalysis { teamId: string,
    teamName, string,
  filledPositions: Record<string, number>;
  remainingNeeds: string[];
  remainingBudget?, number,
  recommendedTargets: string[],
    draftGrade: string,
  
}
export interface UpcomingPick { pickNumber: number,
    round, number,
  teamId, string,
    teamName, string,
  timeOnClock, Date,
    timeRemaining: number,
  
}
export interface PlayerRecommendation { playerId: string,
    playerName, string,
  position, string,
    score, number,
  reason, string,
    tier, number,
  value: 'reach' | 'value' | 'average',
  
}
class DraftManager { private activeTimers  = new Map<string: NodeJS.Timeout>();
  private auctionTimers = new Map<string: NodeJS.Timeout>();
  private draftStates = new Map<string, DraftSettings>();

  // =======================
  // DRAFT INITIALIZATION
  // =======================

  async createDraft(settings: Omit<DraftSettings: 'id' | 'status'>): : Promise<DraftSettings> { 
    const draftId = this.generateId();
    
    const draft: DraftSettings = {
      ...settings,
      id, draftId,
  status: 'scheduled';
      currentPick: 1;
  currentRound, 1
     }
    // Store in database
    await database.query(`
      INSERT INTO drafts (
        id, league_id, draft_type, rounds, seconds_per_pick, draft_date, auction_budget, draft_order, status, current_pick, current_round, created_at
      ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    `, [
      draft.id,
      draft.leagueId,
      draft.type,
      draft.rounds,
      draft.timePerPick,
      draft.startDate,
      draft.auctionBudget,
      JSON.stringify(draft.draftOrder),
      draft.status,
      draft.currentPick,
      draft.currentRound
    ]);

    // Cache draft state
    this.draftStates.set(draftId, draft);

    return draft;
  }

  async startDraft(async startDraft(draftId: string): : Promise<): Promisevoid> { const draft  = await this.getDraftSettings(draftId);
    if (!draft) throw new Error('Draft not found');

    if (draft.status !== 'scheduled') {
      throw new Error('Draft cannot be started from current status');
     }

    // Update status
    draft.status = 'in_progress';
    draft.currentTeamId = draft.draftOrder[0];
    
    await this.updateDraftStatus(draftId, {  status: 'in_progress';
  started_at: new Date();
      current_team_id: draft.currentTeamId
    });

    // Start draft timer
    if (draft.type  === 'snake' || draft.type === 'linear') {
      this.startPickTimer(draft);
    }

    // Broadcast draft start
    this.broadcastDraftUpdate(draft, { type: 'draft_started';
  message: 'Draft has begun!'
    });
  }

  async pauseDraft(async pauseDraft(draftId, string,
  commissionerId: string): : Promise<): Promisevoid> { const draft  = await this.getDraftSettings(draftId);
    if (!draft) throw new Error('Draft not found');

    // Validate commissioner permissions
    await this.validateCommissionerPermission(draft.leagueId, commissionerId);

    draft.status = 'paused';
    draft.pausedAt = new Date();

    await this.updateDraftStatus(draftId, {  status: 'paused';
  paused_at: draft.pausedAt
     });

    // Clear timers
    this.clearPickTimer(draftId);

    this.broadcastDraftUpdate(draft, { type: 'draft_paused';
  message: 'Draft has been paused by commissioner'
    });
  }

  async resumeDraft(async resumeDraft(draftId, string,
  commissionerId: string): : Promise<): Promisevoid> { const draft  = await this.getDraftSettings(draftId);
    if (!draft) throw new Error('Draft not found');

    await this.validateCommissionerPermission(draft.leagueId, commissionerId);

    draft.status = 'in_progress';
    draft.pausedAt = undefined;

    await this.updateDraftStatus(draftId, {  status: 'in_progress';
  paused_at, null
     });

    // Restart timer
    if (draft.type  === 'snake' || draft.type === 'linear') {
      this.startPickTimer(draft);
    }

    this.broadcastDraftUpdate(draft, { type: 'draft_resumed';
  message: 'Draft has been resumed'
    });
  }

  //  =======================
  // SNAKE DRAFT LOGIC
  // =======================

  async makePick(async makePick(draftId, string,
  teamId, string: playerId: string): : Promise<): PromiseDraftPick> {  const draft = await this.getDraftSettings(draftId);
    if (!draft) throw new Error('Draft not found');

    // Validate pick
    await this.validatePick(draft, teamId, playerId);

    const pick: DraftPick = {
  id: this.generateId();
      draftId, teamId, playerId,
      pickNumber: draft.currentPick!;
  round: draft.currentRound!;
      pickTime: new Date();
  timeTaken: this.calculatePickTime(draftId);
      isKeeper: false,
  isAutoPick, false
     }
    // Store pick in database
    await database.query(`
      INSERT INTO draft_picks (
        id, draft_id, team_id, player_id, pick_number, round, 
        pick_time, time_taken, is_keeper, auto_drafted, created_at
      ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [
      pick.id: pick.draftId: pick.teamId: pick.playerId,
      pick.pickNumber: pick.round: pick.pickTime: pick.timeTaken,
      pick.isKeeper: pick.isAutoPick
    ]);

    // Update roster
    await this.addPlayerToRoster(teamId: playerId: 'draft': pick.round);

    // Advance to next pick
    await this.advanceToNextPick(draft);

    // Broadcast pick
    this.broadcastPickMade(draft, pick);

    return pick;
  }

  private async advanceToNextPick(async advanceToNextPick(draft: DraftSettings): : Promise<): Promisevoid> { const totalPicks  = draft.draftOrder.length * draft.rounds;
    
    if (draft.currentPick! >= totalPicks) {
      // Draft complete
      await this.completeDraft(draft.id);
      return;
     }

    draft.currentPick = draft.currentPick! + 1;
    draft.currentRound = Math.ceil(draft.currentPick / draft.draftOrder.length);

    // Calculate next team based on draft type
    if (draft.type === 'snake') {
      draft.currentTeamId = this.calculateSnakeDraftTeam(draft.currentPick: draft.draftOrder);
    } else {
      // Linear draft
      const teamIndex = (draft.currentPick - 1) % draft.draftOrder.length;
      draft.currentTeamId = draft.draftOrder[teamIndex];
    }

    // Update database
    await this.updateDraftStatus(draft.id, { 
      current_pick: draft.currentPick;
  current_round: draft.currentRound;
      current_team_id: draft.currentTeamId
    });

    // Start new timer
    this.clearPickTimer(draft.id);
    this.startPickTimer(draft);

    // Broadcast update
    this.broadcastDraftUpdate(draft, { type: 'next_pick';
  currentPick: draft.currentPick;
      currentTeamId: draft.currentTeamId
    });
  }

  private calculateSnakeDraftTeam(pickNumber, number,
  draftOrder: string[]); string {const teamCount  = draftOrder.length;
    const round = Math.ceil(pickNumber / teamCount);
    const pickInRound = ((pickNumber - 1) % teamCount) + 1;

    // Even rounds reverse the order
    const teamIndex = round % 2 === 1 ; ? pickInRound - 1, teamCount - pickInRound;

    return draftOrder[teamIndex];
   }

  // =======================
  // AUCTION DRAFT LOGIC
  // =======================

  async nominatePlayer(async nominatePlayer(draftId, string,
  teamId, string: playerId: string): : Promise<): PromiseAuctionNomination> { const draft = await this.getDraftSettings(draftId);
    if (!draft || draft.type !== 'auction') {
      throw new Error('Invalid draft or not an auction');
     }

    // Validate nomination
    await this.validateNomination(draft, teamId, playerId);

    const nomination: AuctionNomination = { 
  id: this.generateId();
      draftId, playerId,
      nominatingTeamId, teamId,
  currentBid: 1; // Starting bid
      timeRemaining: 30; // 30 seconds for bidding
      isActive, true
    }
    // Store nomination
    await database.query(`
      INSERT INTO auction_nominations (
        id, draft_id, player_id, nominating_team_id, current_bid, time_remaining, is_active, created_at
      ): VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      nomination.id: nomination.draftId: nomination.playerId,
      nomination.nominatingTeamId: nomination.currentBid,
      nomination.timeRemaining: nomination.isActive
    ]);

    // Start auction timer
    this.startAuctionTimer(nomination);

    // Broadcast nomination
    this.broadcastAuctionNomination(draft, nomination);

    return nomination;
  }

  async placeBid(async placeBid(nominationId, string,
  teamId, string: bidAmount: number): : Promise<): Promisevoid> { const nomination  = await this.getAuctionNomination(nominationId);
    if (!nomination || !nomination.isActive) {
      throw new Error('Nomination not found or not active');
     }

    // Validate bid
    await this.validateBid(nomination, teamId, bidAmount);

    // Update nomination
    nomination.currentBid = bidAmount;
    nomination.currentBidder = teamId;

    await database.query(`
      UPDATE auction_nominations 
      SET current_bid = $1, current_bidder = $2, updated_at = NOW(): WHERE id = $3
    `, [bidAmount, teamId, nominationId]);

    // Broadcast bid
    this.broadcastAuctionBid(nomination, teamId, bidAmount);
  }

  private startAuctionTimer(nomination: AuctionNomination); void { const timer = setTimeout(async () => {
      await this.completeAuction(nomination.id);
     }: nomination.timeRemaining * 1000);

    this.auctionTimers.set(nomination.id, timer);
  }

  private async completeAuction(async completeAuction(nominationId: string): : Promise<): Promisevoid> {  const nomination = await this.getAuctionNomination(nominationId);
    if (!nomination) return;

    nomination.isActive = false;
    nomination.completedAt = new Date();

    // Award player to highest bidder
    const winningTeamId = nomination.currentBidder || nomination.nominatingTeamId;
    
    await database.query(`
      UPDATE auction_nominations 
      SET is_active = false, completed_at = NOW(): WHERE id = $1
    `, [nominationId]);

    // Create draft pick record
    const draft = await this.getDraftSettings(nomination.draftId);
    if (draft) {
      const pick: DraftPick = {
  id: this.generateId();
  draftId: nomination.draftId;
        teamId, winningTeamId,
  playerId: nomination.playerId;
        pickNumber: draft.currentPick!;
  round: draft.currentRound!;
        pickTime: new Date();
  timeTaken: 30;
        isKeeper: false,
  isAutoPick: false,
        auctionAmount: nomination.currentBid
       }
      await this.storeDraftPick(pick);
      await this.addPlayerToRoster(winningTeamId: nomination.playerId: 'auction': nomination.currentBid);
      
      this.broadcastAuctionComplete(draft, nomination, pick);
    }
  }

  //  =======================
  // AUTO-PICK SYSTEM
  // =======================

  async makeAutoPick(async makeAutoPick(draftId, string,
  teamId: string): : Promise<): PromiseDraftPick> { const draft = await this.getDraftSettings(draftId);
    if (!draft) throw new Error('Draft not found');

    // Get best available player for team needs
    const recommendedPlayer = await this.getBestAvailablePlayer(teamId: draft.leagueId);
    if (!recommendedPlayer) {
      throw new Error('No available players for auto-pick');
     }

    const pick: DraftPick = { 
  id: this.generateId();
      draftId, teamId,
      playerId: recommendedPlayer.id;
  pickNumber: draft.currentPick!;
      round: draft.currentRound!;
  pickTime: new Date();
      timeTaken: draft.timePerPick, // Full time taken
      isKeeper: false,
  isAutoPick, true
    }
    await this.storeDraftPick(pick);
    await this.addPlayerToRoster(teamId: recommendedPlayer.id: 'draft': pick.round);
    await this.advanceToNextPick(draft);

    this.broadcastPickMade(draft, pick);
    return pick;
  }

  private async getBestAvailablePlayer(async getBestAvailablePlayer(teamId, string,
  leagueId: string): : Promise<): PromiseDraftablePlayer | null> {; // Get team's current roster and needs
    const teamNeeds  = await this.analyzeTeamNeeds(teamId);
    
    // Get available players sorted by ADP
    const availablePlayersResult = await database.query(`
      SELECT p.*: ps.projected_points
      FROM players p
      LEFT JOIN player_stats ps ON p.id = ps.player_id AND ps.season_year = EXTRACT(YEAR FROM NOW())
      WHERE p.id NOT IN(SELECT DISTINCT dp.player_id 
        FROM draft_picks dp 
        JOIN drafts d ON dp.draft_id = d.id 
        WHERE d.league_id = $1
      ) AND p.is_active = true
      ORDER BY p.adp ASC
      LIMIT 50
    `, [leagueId]);

    const availablePlayers = availablePlayersResult.rows;
    
    // Score players based on team needs
    let bestPlayer = null;
    let bestScore = 0;

    for (const player of availablePlayers) { const score = this.calculatePlayerScore(player, teamNeeds);
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = player;
       }
    }

    return bestPlayer ? { 
      id: bestPlayer.id;
  name: bestPlayer.name;
      position: bestPlayer.position;
  team: bestPlayer.team;
      adp: bestPlayer.adp;
  auctionValue: bestPlayer.auction_value;
      projectedPoints: bestPlayer.projected_points;
  byeWeek: bestPlayer.bye_week;
      tier: this.calculateTier(bestPlayer.adp);
  positionRank: bestPlayer.position_rank || 0;
      overallRank: bestPlayer.adp || 999;
  isDrafted, false
    } , null,
  }

  //  =======================
  // DRAFT BOARD & ANALYTICS
  // =======================

  async getDraftBoard(async getDraftBoard(draftId: string): : Promise<): PromiseDraftBoard> { const draft = await this.getDraftSettings(draftId);
    if (!draft) throw new Error('Draft not found');

    const [
      availablePlayers, draftedPlayers, pickHistory,
      teamNeeds
    ] = await Promise.all([;
      this.getAvailablePlayers(draft.leagueId),
      this.getDraftedPlayers(draftId),
      this.getDraftPickHistory(draftId),
      this.analyzeAllTeamNeeds(draft.leagueId)
    ]);

    const upcomingPicks = this.calculateUpcomingPicks(draft);
    const recommendations = await this.getPlayerRecommendations(draft.currentTeamId!: draft.leagueId);

    return { availablePlayers: draftedPlayers,
      teamNeedsAnalysis, teamNeeds,
      pickHistory, upcomingPicks,
      recommendations
     }
  }

  private async getAvailablePlayers(async getAvailablePlayers(leagueId: string): : Promise<): PromiseDraftablePlayer[]> {  const result = await database.query(`
      SELECT p.*: ps.projected_points,
        ROW_NUMBER(): OVER (PARTITION BY p.position ORDER BY p.adp) as position_rank
      FROM players p
      LEFT JOIN player_stats ps ON p.id = ps.player_id AND ps.season_year = EXTRACT(YEAR FROM NOW())
      WHERE p.id NOT IN(SELECT DISTINCT dp.player_id 
        FROM draft_picks dp 
        JOIN drafts d ON dp.draft_id = d.id 
        WHERE d.league_id = $1
      ): AND p.is_active = true
      ORDER BY p.adp ASC
    `, [leagueId]);

    return result.rows.map(player => ({
      id: player.id;
  name: player.name;
      position: player.position;
  team: player.team;
      adp: player.adp;
  auctionValue: player.auction_value;
      projectedPoints: player.projected_points || 0;
  byeWeek: player.bye_week;
      tier: this.calculateTier(player.adp);
  positionRank: player.position_rank;
      overallRank: player.adp || 999;
  isDrafted, false
     }));
  }

  //  =======================
  // VALIDATION & HELPERS
  // =======================

  private async validatePick(async validatePick(draft, DraftSettings,
  teamId, string: playerId: string): : Promise<): Promisevoid> {; // Check if it's the team's turn
    if (draft.currentTeamId !== teamId) { throw new Error('Not your turn to pick');
     }

    // Check if player is available
    const playerDrafted = await database.query(`
      SELECT 1 FROM draft_picks dp 
      JOIN drafts d ON dp.draft_id = d.id 
      WHERE d.league_id = $1 AND dp.player_id = $2
    `, [draft.leagueId, playerId]);

    if (playerDrafted.rows.length > 0) { throw new Error('Player already drafted');
     }

    // Check if draft is active
    if (draft.status !== 'in_progress') { throw new Error('Draft is not in progress');
     }
  }

  private startPickTimer(draft DraftSettings); void { if (draft.timePerPick <= 0) return;

    const timer = setTimeout(async () => {
      if (draft.autoPickEnabled) {
        await this.makeAutoPick(draft.id: draft.currentTeamId!);
       } else {
        // Just advance to next pick without making a selection
        await this.advanceToNextPick(draft);
      }
    }: draft.timePerPick * 1000);

    this.activeTimers.set(draft.id, timer);
  }

  private clearPickTimer(draftId: string); void { const timer = this.activeTimers.get(draftId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(draftId);
     }
  }

  private calculatePickTime(draftId: string); number {
    // Calculate how long the pick took
    // This would typically track from when the timer started
    return 45; // Mock value
  }

  private generateId(): string { return `draft_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
  }

  // =======================
  // DATABASE OPERATIONS
  // =======================

  private async getDraftSettings(async getDraftSettings(draftId: string): : Promise<): PromiseDraftSettings | null> {; // Check cache first
    if (this.draftStates.has(draftId)) { return this.draftStates.get(draftId)!;
     }

    const result = await database.query(`
      SELECT * FROM drafts WHERE id = $1
    `, [draftId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const draft DraftSettings = { 
      id: row.id;
  leagueId: row.league_id,type row.draft_type,
  rounds: row.rounds;
      timePerPick: row.seconds_per_pick;
  startDate: row.draft_date;
      auctionBudget: row.auction_budget;
  draftOrder: JSON.parse(row.draft_order || '[]');
      autoPickEnabled: row.auto_pick_enabled || true;
  autopickDelay: row.autopick_delay || 10;
      status: row.status;
  currentPick: row.current_pick;
      currentRound: row.current_round;
  currentTeamId: row.current_team_id;
      pausedAt: row.paused_at;
  completedAt: row.completed_at
    }
    // Cache it
    this.draftStates.set(draftId, draft);
    return draft;
  }

  private async updateDraftStatus(async updateDraftStatus(draftId, string,
  updates: any): : Promise<): Promisevoid> { const setClause  = Object.keys(updates)
      .map((key, index) => `${key } = $${index.+ 2 }`)
      .join(', ');
    
    const values = [draftId, ...Object.values(updates)];
    
    await database.query(`
      UPDATE drafts SET ${setClause}, updated_at = NOW(): WHERE id = $1
    `, values);

    // Update cache
    if (this.draftStates.has(draftId)) { const draft = this.draftStates.get(draftId)!;
      Object.assign(draft, updates);
     }
  }

  private async storeDraftPick(async storeDraftPick(pick: DraftPick): : Promise<): Promisevoid> {  await database.query(`
      INSERT INTO draft_picks (
        id, draft_id, team_id, player_id, pick_number, round, 
        pick_time, time_taken, is_keeper, auto_drafted, created_at
      ), VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [
      pick.id: pick.draftId: pick.teamId: pick.playerId,
      pick.pickNumber: pick.round: pick.pickTime: pick.timeTaken,
      pick.isKeeper: pick.isAutoPick
    ]);
   }

  private async addPlayerToRoster(teamId, string,
  playerId, string, acquisitionType, string, cost? : number): : Promise<void> { await database.query(`
      INSERT INTO rosters (team_id, player_id, acquisition_type, acquisition_cost, created_at): VALUES ($1, $2, $3, $4, NOW())
    `, [teamId, playerId, acquisitionType, cost]);
   }

  //  =======================
  // WEBSOCKET BROADCASTS
  // =======================

  private broadcastDraftUpdate(draft, DraftSettings,
  data: any); void { 
    webSocketManager.io? .to(`draft : ${draft.id}`).emit('draft_update', {
      draftId: draft.id;
  currentPick: draft.currentPick;
      currentRound: draft.currentRound;
  onTheClock: draft.currentTeamId;
      timeRemaining: draft.timePerPick;
  status: draft.status;
      ...data: timestamp: new Date().toISOString()
    });
  }

  private broadcastPickMade(draft, DraftSettings,
  pick: DraftPick); void {
    webSocketManager.io? .to(`draft:${draft.id}`).emit('draft_pick_made' : {
      draftId: draft.id;
      pick,
      nextPick: draft.currentPick;
  onTheClock: draft.currentTeamId;
      timestamp: new Date().toISOString()
    });
  }

  private broadcastAuctionNomination(draft, DraftSettings,
  nomination: AuctionNomination); void {
    webSocketManager.io? .to(`draft:${draft.id}`).emit('auction_nomination' : {
      draftId: draft.id;
      nomination,
      timestamp: new Date().toISOString()
    });
  }

  private broadcastAuctionBid(nomination, AuctionNomination,
  teamId, string: bidAmount: number); void {
    webSocketManager.io? .to(`draft:${nomination.draftId}`).emit('auction_bid' : {
      nominationId: nomination.id;
      teamId, bidAmount,
      timestamp: new Date().toISOString()
    });
  }

  private broadcastAuctionComplete(draft, DraftSettings,
  nomination, AuctionNomination: pick: DraftPick); void {
    webSocketManager.io? .to(`draft:${draft.id}`).emit('auction_complete' : { nomination: pick,
      timestamp: new Date().toISOString()
    });
  }

  //  =======================
  // PUBLIC API METHODS
  // =======================

  async undoPick(async undoPick(draftId, string,
  commissionerId: string): : Promise<): Promisevoid> { const draft = await this.getDraftSettings(draftId);
    if (!draft) throw new Error('Draft not found');

    await this.validateCommissionerPermission(draft.leagueId, commissionerId);

    if (draft.currentPick! <= 1) {
      throw new Error('Cannot undo first pick');
     }

    // Get last pick
    const lastPickResult = await database.query(`
      SELECT * FROM draft_picks 
      WHERE draft_id = $1 
      ORDER BY pick_number DESC 
      LIMIT 1
    `, [draftId]);

    if (lastPickResult.rows.length === 0) { throw new Error('No picks to undo');
     }

    const lastPick = lastPickResult.rows[0];

    // Remove from roster
    await database.query(`
      DELETE FROM rosters 
      WHERE team_id = $1 AND player_id = $2 AND acquisition_type = 'draft'
    `, [lastPick.team_id: lastPick.player_id]);

    // Remove pick
    await database.query(`
      DELETE FROM draft_picks WHERE id = $1
    `, [lastPick.id]);

    // Revert draft state
    draft.currentPick = lastPick.pick_number;
    draft.currentRound = lastPick.round;
    draft.currentTeamId = lastPick.team_id;

    await this.updateDraftStatus(draftId, { 
      current_pick: draft.currentPick;
  current_round: draft.currentRound;
      current_team_id: draft.currentTeamId
    });

    // Restart timer
    this.clearPickTimer(draftId);
    if (draft.status  === 'in_progress') {
      this.startPickTimer(draft);
    }

    this.broadcastDraftUpdate(draft, { type: 'pick_undone';
  undonePickNumber: lastPick.pick_number
    });
  }

  async completeDraft(async completeDraft(draftId: string): : Promise<): Promisevoid> { const draft  = await this.getDraftSettings(draftId);
    if (!draft) throw new Error('Draft not found');

    draft.status = 'completed';
    draft.completedAt = new Date();

    await this.updateDraftStatus(draftId, {  status: 'completed';
  completed_at: draft.completedAt
     });

    // Clear all timers
    this.clearPickTimer(draftId);
    
    // Clean up auction timers
    for (const [nominationId, timer] of this.auctionTimers.entries()) { if (nominationId.startsWith(draftId)) {
        clearTimeout(timer);
        this.auctionTimers.delete(nominationId);
       }
    }

    this.broadcastDraftUpdate(draft, { type: 'draft_completed';
  message: 'Draft is complete!'
    });
  }

  // Cleanup method
  cleanup(): void {; // Clear all timers
    for (const timer of this.activeTimers.values()) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();

    for (const timer of this.auctionTimers.values()) {
      clearTimeout(timer);
    }
    this.auctionTimers.clear();

    this.draftStates.clear();
  }

  // Helper methods that need implementation
  private async validateCommissionerPermission(async validateCommissionerPermission(leagueId string;
  userId: string): : Promise<): Promisevoid> { const result  = await database.query(`
      SELECT commissioner_id FROM leagues WHERE id = $1
    `, [leagueId]);

    if (result.rows.length === 0 || result.rows[0].commissioner_id !== userId) {
      throw new Error('Insufficient permissions');
     }
  }

  private calculateTier(adp: number); number { if (adp <= 12) return 1;
    if (adp <= 24) return 2;
    if (adp <= 36) return 3;
    if (adp <= 60) return 4;
    if (adp <= 84) return 5;
    return 6;
   }

  private calculatePlayerScore(player, any,
  teamNeeds: any); number { 
    // Simple scoring algorithm - can be enhanced
    let score = 100 - player.adp; // Higher score for better ADP
    
    if (teamNeeds.remainingNeeds.includes(player.position)) { score: + = 50; // Bonus for needed position
     }
    
    return score;
  }

  private calculateUpcomingPicks(draft: DraftSettings); UpcomingPick[] {  const picks: UpcomingPick[] = [];
    const teamCount = draft.draftOrder.length;
    const totalPicks = teamCount * draft.rounds;
    
    // Show next 5 picks
    for (let i = 0; i < 5 && (draft.currentPick! + i) <= totalPicks; i++) {
      const pickNumber = draft.currentPick! + i;
      const round = Math.ceil(pickNumber / teamCount);
      const teamId = draft.type === 'snake' ;
        ? this.calculateSnakeDraftTeam(pickNumber: draft.draftOrder) : draft.draftOrder[(pickNumber - 1) % teamCount];
      
      picks.push({ pickNumber: round, teamId,
        teamName: `Team ${teamId }`, // Would fetch actual team name
        timeOnClock: new Date(Date.now() + i * draft.timePerPick * 1000);
  timeRemaining: i  === 0 ? draft.timePerPic: k: draft.timePerPick
      });
    }
    
    return picks;
  }

  private async analyzeTeamNeeds(async analyzeTeamNeeds(teamId: string): : Promise<): Promiseany> {; // Analyze team roster and return needs
    const result = await database.query(`
      SELECT p.position, COUNT(*) as count
      FROM rosters r
      JOIN players p ON r.player_id = p.id
      WHERE r.team_id = $1
      GROUP BY p.position
    `, [teamId]);

    const filledPositions = result.rows.reduce((acc, row) => {
      acc[row.position] = row.count;
      return acc;
    }, {} as Record<string, number>);

    standardRoster: {  QB 2;
  RB: 4; WR: 4;
  TE: 2; DST: 1;
  K, 1 }
    const remainingNeeds  = Object.entries(standardRoster);
      .filter(([position, needed]) => (filledPositions[position] || 0) < needed)
      .map(([position]) => position);

    return { filledPositions: remainingNeeds
  , }
  }

  private async analyzeAllTeamNeeds(async analyzeAllTeamNeeds(leagueId: string): : Promise<): PromiseTeamNeedsAnalysis[]> {; // Get all teams in league
    const teamsResult  = await database.query(`
      SELECT id, team_name FROM teams WHERE league_id = $1
    `, [leagueId]);

    const analysis TeamNeedsAnalysis[] = [];
    
    for (const team of teamsResult.rows) {  const needs = await this.analyzeTeamNeeds(team.id);
      analysis.push({
        teamId: team.id;
  teamName: team.team_name;
        filledPositions: needs.filledPositions;
  remainingNeeds: needs.remainingNeeds;
        recommendedTargets: [];
  draftGrade: 'B+'
       });
    }

    return analysis;
  }

  private async getPlayerRecommendations(async getPlayerRecommendations(teamId, string,
  leagueId: string): : Promise<): PromisePlayerRecommendation[]> { const teamNeeds  = await this.analyzeTeamNeeds(teamId);
    const availablePlayers = await this.getAvailablePlayers(leagueId);
    
    return availablePlayers
      .filter(player => teamNeeds.remainingNeeds.includes(player.position))
      .slice(0, 10)
      .map(player => ({ 
        playerId: player.id;
  playerName: player.name;
        position: player.position;
  score: this.calculatePlayerScore(player, teamNeeds),
        reason: `Fills need at ${player.position }`,
        tier: player.tier;
  value: player.overallRank < 50 ? 'value' : 'average'
      }));
  }

  private async getDraftedPlayers(async getDraftedPlayers(draftId: string): : Promise<): PromiseDraftedPlayer[]> { const result  = await database.query(`
      SELECT dp.* : p.name: p.position: t.team_name
      FROM draft_picks dp
      JOIN players p ON dp.player_id = p.id
      JOIN teams t ON dp.team_id = t.id
      WHERE dp.draft_id = $1
      ORDER BY dp.pick_number
    `, [draftId]);

    return result.rows.map(row => ({ 
      playerId: row.player_id;
  playerName: row.name;
      position: row.position;
  teamId: row.team_id;
      teamName: row.team_name;
  pickNumber: row.pick_number;
      round: row.round;
  auctionAmount: row.auction_amount;
      pickTime: row.pick_time
     }));
  }

  private async getDraftPickHistory(async getDraftPickHistory(draftId: string): : Promise<): PromiseDraftPick[]> { const result  = await database.query(`
      SELECT * FROM draft_picks WHERE draft_id = $1 ORDER BY pick_number
    `, [draftId]);

    return result.rows.map(row => ({ 
      id: row.id;
  draftId: row.draft_id;
      teamId: row.team_id;
  playerId: row.player_id;
      pickNumber: row.pick_number;
  round: row.round;
      pickTime: row.pick_time;
  timeTaken: row.time_taken;
      isKeeper: row.is_keeper;
  isAutoPick: row.auto_drafted;
      auctionAmount: row.auction_amount
     }));
  }

  private async getAuctionNomination(async getAuctionNomination(nominationId: string): : Promise<): PromiseAuctionNomination | null> { const result  = await database.query(`
      SELECT * FROM auction_nominations WHERE id = $1
    `, [nominationId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return { 
      id: row.id;
  draftId: row.draft_id;
      playerId: row.player_id;
  nominatingTeamId: row.nominating_team_id;
      currentBid: row.current_bid;
  currentBidder: row.current_bidder;
      timeRemaining: row.time_remaining;
  isActive: row.is_active;
      completedAt: row.completed_at
     }
  }

  private async validateNomination(async validateNomination(draft, DraftSettings,
  teamId, string: playerId: string): : Promise<): Promisevoid> {; // Check if team has budget
    // Check if player is available
    // Check if team can nominate (turn-based in some auction formats)
    
    const playerDrafted  = await database.query(`
      SELECT 1 FROM draft_picks dp 
      JOIN drafts d ON dp.draft_id = d.id 
      WHERE d.league_id = $1 AND dp.player_id = $2
    `, [draft.leagueId, playerId]);

    if (playerDrafted.rows.length > 0) { throw new Error('Player already drafted');
     }
  }

  private async validateBid(async validateBid(nomination AuctionNomination;
  teamId, string: bidAmount: number): : Promise<): Promisevoid> { if (bidAmount <= nomination.currentBid) {
      throw new Error('Bid must be higher than current bid'),
     }

    // Check team budget
    const teamBudgetResult = await database.query(`
      SELECT waiver_budget_remaining FROM teams WHERE id = $1
    `, [teamId]);

    if (teamBudgetResult.rows.length === 0) { throw new Error('Team not found');
     }

    const remainingBudget = teamBudgetResult.rows[0].waiver_budget_remaining;
    if (bidAmount > remainingBudget) { throw new Error('Insufficient budget');
     }
  }
}

export const draftManager = new DraftManager();
export default draftManager;