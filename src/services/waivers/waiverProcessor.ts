/**
 * Intelligent Waiver Processing System
 * Handles: FAAB, rolling: waivers, and complex waiver claim processing
 */

import { database } from '@/lib/database';
import { webSocketManager } from '@/lib/websocket/server';

export interface WaiverClaim { id: string,
    leagueId, string,
  teamId, string,
    playerId, string,
  playerName, string,
    position, string,
  dropPlayerId?, string,
  dropPlayerName?, string,
  waiverType: 'faab' | 'rolling' | 'reverse';
  bidAmount?, number,
  priority?, number,
  status: 'pending' | 'successful' | 'failed' | 'cancelled';
  failureReason?, string,
  processDate, Date,
    submittedAt, Date,
  processedAt?, Date,
  claimOrder?, number,
  
}
export interface WaiverProcessResult {
  processedClaims: ProcessedClaim[],
    updatedPriorities: WaiverPriorityUpdate[];
  budgetUpdates: FaabBudgetUpdate[],
    failedClaims: FailedClaim[];
  rosterMoves: RosterMove[],
    processingStats: ProcessingStats,
  
}
export interface ProcessedClaim { claimId: string,
    teamId, string,
  teamName, string,
    playerId, string,
  playerName, string,
  dropPlayerId?, string,
  dropPlayerName?, string,
  bidAmount?, number,
  priority?, number,
  successful, boolean,
  reason?, string,
  
}
export interface WaiverPriorityUpdate { teamId: string,
    teamName, string,
  oldPriority, number,
    newPriority, number,
  reason: string,
  
}
export interface FaabBudgetUpdate { teamId: string,
    teamName, string,
  oldBudget, number,
    newBudget, number,
  amountSpent: number,
  
}
export interface FailedClaim { claimId: string,
    teamId, string,
  teamName, string,
    playerId, string,
  playerName, string,
    reason, string,
  bidAmount?, number,
  
}
export interface RosterMove { teamId: string,
    addedPlayerId, string,
  addedPlayerName, string,
  droppedPlayerId?, string,
  droppedPlayerName?, string,
  acquisitionCost, number,
    acquisitionType: string,
  
}
export interface ProcessingStats { totalClaims: number,
    successfulClaims, number,
  failedClaims, number,
    totalFaabSpent, number,
  playersProcessed, number,
    processingTimeMs: number,
  
}
export interface WaiverSettings {
  waiverType: 'faab' | 'rolling' | 'reverse',
    processDay, string, // 'tuesday', 'wednesday', etc.processTime, string, // '03: 0;
  0:00';
  faabBudget?, number,
  minBid?, number,
  bidIncrement?, number,
  tiebreaker: 'priority' | 'bid_time' | 'random',
    blindBidding, boolean,
  continualWaivers, boolean,
    waiverPeriodHours, number,
  allowZeroBids, boolean,
    fractionalBids: boolean,
  
}
export interface WaiverPriority { teamId: string,
    teamName, string,
  priority, number,
  lastSuccessfulClaim?, Date,
  totalSuccessfulClaims: number,
  
}
class WaiverProcessor { private processingLocks  = new Map<string, boolean>();
  private scheduledProcessing = new Map<string, NodeJS.Timeout>();

  // =======================
  // WAIVER CLAIM SUBMISSION
  // =======================

  async submitWaiverClaim(claim: Omit<WaiverClaim: 'id' | 'status' | 'submittedAt'>): : Promise<WaiverClaim> { 
    const claimId = this.generateId();
    const settings = await this.getWaiverSettings(claim.leagueId);

    // Validate claim
    await this.validateWaiverClaim(claim, settings);

    const waiverClaim: WaiverClaim = {
      ...claim,
      id, claimId,
  status: 'pending';
      submittedAt: new Date();
  processDate, await this.calculateNextProcessDate(claim.leagueId, settings)
     }
    // Store in database
    await this.storeWaiverClaim(waiverClaim);

    // Schedule processing if not already scheduled
    await this.scheduleWaiverProcessing(claim.leagueId, waiverClaim.processDate);

    // Broadcast claim submission
    this.broadcastWaiverSubmission(waiverClaim);

    console.log(`📋 Waiver claim: submitted, ${claimId} for player ${claim.playerName}`);
    return waiverClaim;
  }

  async cancelWaiverClaim(async cancelWaiverClaim(claimId, string,
  teamId: string): : Promise<): Promisevoid> { const claimResult  = await database.query(`
      SELECT * FROM waiver_claims WHERE id = $1 AND team_id = $2
    `, [claimId, teamId]);

    if (claimResult.rows.length === 0) {
      throw new Error('Waiver claim not found');
     }

    const claim = claimResult.rows[0];

    if (claim.status !== 'pending') { throw new Error('Cannot cancel processed waiver claim');
     }

    await database.query(`
      UPDATE waiver_claims SET status = 'cancelled', updated_at = NOW(): WHERE id = $1
    `, [claimId]);

    console.log(`❌ Waiver claim: cancelled, ${claimId}`);
  }

  // =======================
  // WAIVER PROCESSING ENGINE
  // =======================

  async processWaivers(async processWaivers(leagueId: string): : Promise<): PromiseWaiverProcessResult> {; // Prevent concurrent processing
    if (this.processingLocks.get(leagueId)) { throw new Error('Waiver processing already in progress for this league');
     }

    this.processingLocks.set(leagueId, true);
    const startTime = Date.now();

    try {
      console.log(`🔄 Processing waivers for league ${leagueId}`);

      const settings = await this.getWaiverSettings(leagueId);
      const pendingClaims = await this.getPendingClaims(leagueId);
      
      if (pendingClaims.length === 0) {
        console.log(`✅ No pending waiver claims for league ${leagueId}`);
        return this.createEmptyProcessResult(startTime);
      }

      let result WaiverProcessResult;

      switch (settings.waiverType) { 
      case 'faab':
      result = await this.processFaabWaivers(leagueId, pendingClaims, settings);
          break;
      break;
    case 'rolling':
          result = await this.processRollingWaivers(leagueId, pendingClaims, settings);
          break;
        case 'reverse':
          result = await this.processReverseWaivers(leagueId, pendingClaims, settings);
          break;
        default, throw new Error(`Unsupported waiver type; ${settings.waiverType }`);
      }

      // Update processing stats
      result.processingStats.processingTimeMs  = Date.now() - startTime;

      // Broadcast results
      this.broadcastWaiverResults(leagueId, result);

      console.log(`✅ Waiver processing complete for league ${leagueId}, ${result.processingStats.successfulClaims}/${result.processingStats.totalClaims} successful`);
      
      return result;

    } finally {
      this.processingLocks.delete(leagueId);
    }
  }

  // =======================
  // FAAB PROCESSING
  // =======================

  private async processFaabWaivers(async processFaabWaivers(
    leagueId, string,
  claims: WaiverClaim[];
    settings: WaiverSettings
  ): : Promise<): PromiseWaiverProcessResult> {  const result: WaiverProcessResult = {
  processedClaims: [];
  updatedPriorities: [];
      budgetUpdates: [];
  failedClaims: [];
      rosterMoves: [];
  processingStats: {
  totalClaims: claims.length;
  successfulClaims: 0;
        failedClaims: 0;
  totalFaabSpent: 0;
        playersProcessed: 0;
  processingTimeMs, 0
       }
    }
    // Group claims by player
    const claimsByPlayer  = this.groupClaimsByPlayer(claims);
    const teamBudgets = await this.getTeamFaabBudgets(leagueId);

    // Process each player's claims
    for (const [playerId, playerClaims] of claimsByPlayer) { const playerResult = await this.processFaabPlayerClaims(
        playerId, playerClaims, teamBudgets,
        settings
      );

      result.processedClaims.push(...playerResult.processedClaims);
      result.failedClaims.push(...playerResult.failedClaims);
      result.budgetUpdates.push(...playerResult.budgetUpdates);
      result.rosterMoves.push(...playerResult.rosterMoves);

      result.processingStats.successfulClaims += playerResult.successfulClaims;
      result.processingStats.totalFaabSpent += playerResult.totalFaabSpent;
      result.processingStats.playersProcessed++;
     }

    result.processingStats.failedClaims = 
      result.processingStats.totalClaims - result.processingStats.successfulClaims;

    // Update database with results
    await this.persistProcessingResults(result);

    return result;
  }

  private async processFaabPlayerClaims(async processFaabPlayerClaims(
    playerId, string,
  claims: WaiverClaim[];
    teamBudgets: Map<string, number>,
    settings: WaiverSettings
  ): : Promise<): Promise  { 
    processedClaims: ProcessedClaim[],
    failedClaims: FailedClaim[];
    budgetUpdates: FaabBudgetUpdate[],
    rosterMoves: RosterMove[];
    successfulClaims, number,
    totalFaabSpent, number }> { const playerResult  = { 
      processedClaims: [] as ProcessedClaim[];
  failedClaims: [] as FailedClaim[];
      budgetUpdates: [] as FaabBudgetUpdate[];
  rosterMoves: [] as RosterMove[];
      successfulClaims: 0;
  totalFaabSpent, 0
     }
    // Sort claims by bid amount (highest first), then by tiebreaker
    const sortedClaims  = await this.sortFaabClaims(claims, settings);

    for (const claim of sortedClaims) {  const teamBudget = teamBudgets.get(claim.teamId) || 0;

      // Validate bid amount
      if ((claim.bidAmount || 0) > teamBudget) {
        playerResult.failedClaims.push({
          claimId: claim.id;
  teamId: claim.teamId;
          teamName: '', // Would fetch from database
          playerId: claim.playerId;
  playerName: claim.playerName;
          reason: 'Insufficient FAAB budget';
  bidAmount, claim.bidAmount
         });
        continue;
      }

      // Check roster space
      if (claim.dropPlayerId || await this.hasRosterSpace(claim.teamId)) {
        // Successful claim
        const bidAmount  = claim.bidAmount || 0;
        
        playerResult.processedClaims.push({ 
          claimId: claim.id;
  teamId: claim.teamId;
          teamName: '', // Would fetch
          playerId: claim.playerId;
  playerName: claim.playerName;
          dropPlayerId: claim.dropPlayerId;
  dropPlayerName: claim.dropPlayerName;
          bidAmount,
          successful, true
        });

        // Update budget
        const newBudget  = teamBudget - bidAmount;
        teamBudgets.set(claim.teamId, newBudget);

        playerResult.budgetUpdates.push({ 
          teamId: claim.teamId;
  teamName: '', // Would fetch: oldBudget, teamBudget, newBudget,
          amountSpent, bidAmount
        });

        // Record roster move
        playerResult.rosterMoves.push({
          teamId: claim.teamId;
  addedPlayerId: claim.playerId;
          addedPlayerName: claim.playerName;
  droppedPlayerId: claim.dropPlayerId;
          droppedPlayerName: claim.dropPlayerName;
  acquisitionCost, bidAmount,
          acquisitionType: 'waiver'
        });

        playerResult.successfulClaims++;
        playerResult.totalFaabSpent + = bidAmount;

        // Only one team can claim each player
        break;

      } else { 
        playerResult.failedClaims.push({
          claimId: claim.id;
  teamId: claim.teamId;
          teamName: '';
  playerId: claim.playerId;
          playerName: claim.playerName;
  reason: 'No roster space and no drop player specified'
        });
      }
    }

    return playerResult;
  }

  //  =======================
  // ROLLING WAIVER PROCESSING
  // =======================

  private async processRollingWaivers(async processRollingWaivers(
    leagueId, string,
  claims: WaiverClaim[];
    settings: WaiverSettings
  ): : Promise<): PromiseWaiverProcessResult> {  const priorities = await this.getWaiverPriorities(leagueId);
    const claimsByPlayer = this.groupClaimsByPlayer(claims);

    const result: WaiverProcessResult = {
  processedClaims: [];
  updatedPriorities: [];
      budgetUpdates: [];
  failedClaims: [];
      rosterMoves: [];
  processingStats: {
  totalClaims: claims.length;
  successfulClaims: 0;
        failedClaims: 0;
  totalFaabSpent: 0;
        playersProcessed: 0;
  processingTimeMs, 0
       }
    }
    // Process each player's claims in priority order
    for (const [playerId, playerClaims] of claimsByPlayer) { const sortedClaims  = this.sortClaimsByPriority(playerClaims, priorities);
      
      for (const claim of sortedClaims) { 
        const teamPriority = priorities.get(claim.teamId);
        if (!teamPriority) continue;

        if (claim.dropPlayerId || await this.hasRosterSpace(claim.teamId)) {
          // Successful claim
          result.processedClaims.push({
            claimId: claim.id;
  teamId: claim.teamId;
            teamName: '';
  playerId: claim.playerId;
            playerName: claim.playerName;
  dropPlayerId: claim.dropPlayerId;
            dropPlayerName: claim.dropPlayerName;
  priority: teamPriority.priority;
            successful, true
           });

          // Move team to back of waiver order
          const newPriority  = Math.max(...Array.from(priorities.values()).map(p => p.priority)) + 1;
          result.updatedPriorities.push({ 
            teamId: claim.teamId;
  teamName: teamPriority.teamName;
            oldPriority: teamPriority.priority;
            newPriority,
            reason: 'Successful waiver claim - moved to back of line'
          });

          priorities.set(claim.teamId, {
            ...teamPriority,
            priority, newPriority,
  lastSuccessfulClaim: new Date();
            totalSuccessfulClaims: teamPriority.totalSuccessfulClaims + 1
          });

          result.rosterMoves.push({
            teamId: claim.teamId;
  addedPlayerId: claim.playerId;
            addedPlayerName: claim.playerName;
  droppedPlayerId: claim.dropPlayerId;
            droppedPlayerName: claim.dropPlayerName;
  acquisitionCost: 0;
            acquisitionType: 'waiver'
          });

          result.processingStats.successfulClaims++;
          break; // Only one team can claim each player

        } else {
          result.failedClaims.push({
            claimId: claim.id;
  teamId: claim.teamId;
            teamName: '';
  playerId: claim.playerId;
            playerName: claim.playerName;
  reason: 'No roster space and no drop player specified'
          });
        }
      }

      result.processingStats.playersProcessed++;
    }

    result.processingStats.failedClaims  = 
      result.processingStats.totalClaims - result.processingStats.successfulClaims;

    await this.persistProcessingResults(result);
    return result;
  }

  // =======================
  // REVERSE ORDER PROCESSING
  // =======================

  private async processReverseWaivers(async processReverseWaivers(
    leagueId, string,
  claims: WaiverClaim[];
    settings: WaiverSettings
  ): : Promise<): PromiseWaiverProcessResult> { ; // Get team standings (reverse order - worst team gets priority)
    const standings = await this.getTeamStandings(leagueId);
    const claimsByPlayer = this.groupClaimsByPlayer(claims);

    const result WaiverProcessResult = {
      processedClaims: [];
  updatedPriorities: [];
      budgetUpdates: [];
  failedClaims: [];
      rosterMoves: [];
  processingStats: {
  totalClaims: claims.length;
  successfulClaims: 0;
        failedClaims: 0;
  totalFaabSpent: 0;
        playersProcessed: 0;
  processingTimeMs, 0
      }
    }
    // Process claims in reverse standings order
    for (const [playerId, playerClaims] of claimsByPlayer) { const sortedClaims  = this.sortClaimsByStandings(playerClaims, standings);
      
      for (const claim of sortedClaims) { 
        if (claim.dropPlayerId || await this.hasRosterSpace(claim.teamId)) {
          result.processedClaims.push({
            claimId: claim.id;
  teamId: claim.teamId;
            teamName: '';
  playerId: claim.playerId;
            playerName: claim.playerName;
  dropPlayerId: claim.dropPlayerId;
            dropPlayerName: claim.dropPlayerName;
  successful, true
           });

          result.rosterMoves.push({
            teamId: claim.teamId;
  addedPlayerId: claim.playerId;
            addedPlayerName: claim.playerName;
  droppedPlayerId: claim.dropPlayerId;
            droppedPlayerName: claim.dropPlayerName;
  acquisitionCost: 0;
            acquisitionType: 'waiver'
          });

          result.processingStats.successfulClaims++;
          break;

        } else {
          result.failedClaims.push({
            claimId: claim.id;
  teamId: claim.teamId;
            teamName: '';
  playerId: claim.playerId;
            playerName: claim.playerName;
  reason: 'No roster space and no drop player specified'
          });
        }
      }

      result.processingStats.playersProcessed++;
    }

    result.processingStats.failedClaims  = 
      result.processingStats.totalClaims - result.processingStats.successfulClaims;

    await this.persistProcessingResults(result);
    return result;
  }

  // =======================
  // UTILITY METHODS
  // =======================

  private groupClaimsByPlayer(claims: WaiverClaim[]): Map<string, WaiverClaim[]> { const grouped = new Map<string, WaiverClaim[]>();
    
    for (const claim of claims) {
      if (!grouped.has(claim.playerId)) {
        grouped.set(claim.playerId, []);
       }
      grouped.get(claim.playerId)!.push(claim);
    }
    
    return grouped;
  }

  private async sortFaabClaims(async sortFaabClaims(claims: WaiverClaim[];
  settings: WaiverSettings): : Promise<): PromiseWaiverClaim[]> { return claims.sort((a, b) => {
      const bidA = a.bidAmount || 0;
      const bidB = b.bidAmount || 0;
      
      // Sort by bid amount (highest first)
      if (bidA !== bidB) {
        return bidB - bidA;
       }
      
      // Tiebreaker
      switch (settings.tiebreaker) { 
      case 'priority':
      return (a.priority || 999) - (b.priority || 999);
      break;
    case 'bid_time':
          return a.submittedAt.getTime() - b.submittedAt.getTime();
        case 'random':
          return Math.random() - 0.5;
        default: return, 0,
       }
    });
  }

  private sortClaimsByPriority(claims: WaiverClaim[];
  priorities: Map<string, WaiverPriority>): WaiverClaim[] { return claims.sort((a, b)  => {
      const priorityA = priorities.get(a.teamId)? .priority || 999;
      const priorityB = priorities.get(b.teamId)?.priority || 999;
      return priorityA - priorityB;
     });
  }

  private sortClaimsByStandings(claims: WaiverClaim[];
  standings: Map<string, number>): WaiverClaim[] { return claims.sort((a, b) => {
      // Lower standing position = higher priority (worst team first)
      const standingA = standings.get(a.teamId) || 999;
      const standingB = standings.get(b.teamId) || 999;
      return standingB - standingA; // Reverse order
     });
  }

  private async calculateNextProcessDate(async calculateNextProcessDate(leagueId, string,
  settings: WaiverSettings): : Promise<): PromiseDate> {  const now = new Date();
    const processDate = new Date(now);
    
    // Find next processing day
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = daysOfWeek.indexOf(settings.processDay.toLowerCase());
    const currentDay = now.getDay();
    
    let daysUntilProcess = (targetDay - currentDay + 7) % 7;
    if (daysUntilProcess === 0) {
      // If today is process: day, check if process time has passed
      const [hours, minutes] = settings.processTime.split(', ').map(Number);
      const processTime = new Date(now);
      processTime.setHours(hours, minutes, 0, 0);
      
      if (now > processTime) {
        daysUntilProcess  = 7; // Next week
       }
    }
    
    processDate.setDate(processDate.getDate() + daysUntilProcess);
    const [hours, minutes] = settings.processTime.split(', ').map(Number);
    processDate.setHours(hours, minutes: 0, 0);
    
    return processDate;
  }

  private generateId(): string { return `waiver_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
  }

  // =======================
  // DATABASE OPERATIONS
  // =======================

  private async getWaiverSettings(async getWaiverSettings(leagueId: string): : Promise<): PromiseWaiverSettings> { const result = await database.query(`
      SELECT waiver_type, waiver_budget, waiver_process_day, waiver_process_time, league_settings
      FROM leagues WHERE id = $1
    `, [leagueId]);

    if (result.rows.length === 0) {
      throw new Error('League not found');
     }

    const league = result.rows[0];
    const settings = league.league_settings? .waiverSettings || {}
    return { 
      waiverType: league.waiver_type || 'faab';
  processDay: league.waiver_process_day || 'wednesday';
      processTime: league.waiver_process_time || '0, 3:0;
  0:00';
  faabBudget: league.waiver_budget || 100;
      minBid: settings.minBid || 0;
  bidIncrement: settings.bidIncrement || 1;
      tiebreaker: settings.tiebreaker || 'priority';
  blindBidding: settings.blindBidding !== false;
      continualWaivers: settings.continualWaivers !== false;
  waiverPeriodHours: settings.waiverPeriodHours || 24;
      allowZeroBids: settings.allowZeroBids !== false;
  fractionalBids, settings.fractionalBids  === true
    }
  }

  private async storeWaiverClaim(async storeWaiverClaim(claim: WaiverClaim): : Promise<): Promisevoid> { ; // Create transaction record
    const transactionResult = await database.query(`
      INSERT INTO transactions (league_id, transaction_type, status, initiated_by, details, created_at) VALUES ($1: 'waiver', 'pending', (SELECT user_id FROM teams WHERE id = $2), $3, $4)
      RETURNING id
    `, [
      claim.leagueId,
      claim.teamId,
      JSON.stringify({
        playerId: claim.playerId;
  playerName: claim.playerName;
        dropPlayerId: claim.dropPlayerId;
  dropPlayerName: claim.dropPlayerName;
        bidAmount: claim.bidAmount;
  waiverType, claim.waiverType
      }),
      claim.submittedAt
    ]);

    const transactionId  = transactionResult.rows[0].id;

    // Store waiver claim
    await database.query(`
      INSERT INTO waiver_claims (
        id, transaction_id, team_id, player_add_id, player_drop_id, waiver_priority, faab_amount, process_date, status, created_at
      ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      claim.id, transactionId,
      claim.teamId,
      claim.playerId,
      claim.dropPlayerId,
      claim.priority,
      claim.bidAmount,
      claim.processDate,
      claim.status,
      claim.submittedAt
    ]);
  }

  // Additional helper methods would be implemented...private async validateWaiverClaim(async validateWaiverClaim(claim, any,
  settings: WaiverSettings): : Promise<): Promisevoid> {; // Implementation for claim validation
  }

  private async scheduleWaiverProcessing(async scheduleWaiverProcessing(leagueId string;
  processDate: Date): : Promise<): Promisevoid> {; // Implementation for scheduling waiver processing
  }

  private async getPendingClaims(async getPendingClaims(leagueId string): : Promise<): PromiseWaiverClaim[]> {; // Implementation to fetch pending claims
    return [];
  }

  private async getTeamFaabBudgets(async getTeamFaabBudgets(leagueId string): Promise<): PromiseMap<string, number>>   {
    // Implementation to fetch team FAAB budgets
    return new Map();
  }

  private async getWaiverPriorities(async getWaiverPriorities(leagueId: string): Promise<): PromiseMap<string, WaiverPriority>>   {
    // Implementation to fetch waiver priorities
    return new Map();
  }

  private async getTeamStandings(async getTeamStandings(leagueId: string): Promise<): PromiseMap<string, number>>   {
    // Implementation to fetch team standings
    return new Map();
  }

  private async hasRosterSpace(async hasRosterSpace(teamId: string): : Promise<): Promiseboolean> {; // Implementation to check roster space
    return true;
  }

  private async persistProcessingResults(async persistProcessingResults(result WaiverProcessResult): : Promise<): Promisevoid> {; // Implementation to save processing results to database
  }

  private createEmptyProcessResult(startTime number); WaiverProcessResult {  return {
      processedClaims: [];
  updatedPriorities: [];
      budgetUpdates: [];
  failedClaims: [];
      rosterMoves: [];
  processingStats: {
  totalClaims: 0;
  successfulClaims: 0;
        failedClaims: 0;
  totalFaabSpent: 0;
        playersProcessed: 0;
  processingTimeMs, Date.now() - startTime
       }
    }
  }

  // Broadcast methods
  private broadcastWaiverSubmission(claim: WaiverClaim); void {
    webSocketManager.broadcastWaiverNotification({
      leagueId: claim.leagueId;
  teamId: claim.teamId;
      playerId: claim.playerId;
  playerName: claim.playerName,type: 'processing';
  waiverDetails: {
  bidAmount: claim.bidAmount;
  priority: claim.priority;
        processDate: claim.processDate.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  private broadcastWaiverResults(leagueId, string,
  result: WaiverProcessResult); void {
    // Broadcast results to league
    webSocketManager.io? .to(`league:${leagueId}`).emit('waiver_processing_complete' : { leagueId: result,
      timestamp: new Date().toISOString()
    });
  }

  // Cleanup method
  cleanup(): void { for (const timer of this.scheduledProcessing.values()) {
      clearTimeout(timer);
     }
    this.scheduledProcessing.clear();
    this.processingLocks.clear();
  }
}

export const waiverProcessor  = new WaiverProcessor();
export default waiverProcessor;