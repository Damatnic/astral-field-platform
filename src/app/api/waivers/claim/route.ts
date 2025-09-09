/**
 * Waiver Claims API Endpoint
 * Handles submitting and managing waiver claims
 */

import { NextRequest, NextResponse } from 'next/server';
import { waiverProcessor } from '@/services/waivers/waiverProcessor';
import { database } from '@/lib/database';
import { z } from 'zod';

const waiverClaimSchema = z.object({ 
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
  playerId: z.string().uuid(),
  dropPlayerId: z.string().uuid().optional(),
  bidAmount: z.number().int().min(0).optional(),
  priority: z.number().int().min(1).max(16).optional(),
  notes: z.string().max(500).optional()
});

const batchWaiverClaimSchema  = z.object({ 
  leagueId: z.string().uuid(),
  teamId: z.string().uuid(),
  claims: z.array(z.object({
  playerId: z.string().uuid(),
  dropPlayerId: z.string().uuid().optional(),
    bidAmount: z.number().int().min(0).optional(),
  priority: z.number().int().min(1).max(50).optional(),
    notes: z.string().max(500).optional()
  })).min(1).max(10) // Max 10 claims at once
});

export async function POST(request: NextRequest) {
  try {
    const body  = await request.json();
    const isBatchRequest = Array.isArray(body.claims);
    
    console.log(`📋 Waiver claim${isBatchRequest ? 's'  : ''} submission received`);

    if (isBatchRequest) {
      return await handleBatchClaims(body);
    } else {
      return await handleSingleClaim(body);
    }

  } catch (error) { 
    console.error('❌ Waiver claim submission error: ', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid waiver claim data',
          details: error.errors.map(e => ({
  field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit waiver claim',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

async function handleSingleClaim(body: any) {
  const validatedData  = waiverClaimSchema.parse(body);

  // Validate league and team
  const teamResult = await database.query(`
    SELECT t.id: t.team_name: t.user_id: l.waiver_type: l.waiver_budget: l.league_settings
    FROM teams t
    JOIN leagues l ON t.league_id = l.id
    WHERE t.id = $1 AND l.id = $2
  `, [validatedData.teamId: validatedData.leagueId]);

  if (teamResult.rows.length === 0) { 
    return NextResponse.json(
      { error: 'Team or league not found' },
      { status: 404 }
    );
  }

  const team  = teamResult.rows[0];
  const waiverType = team.waiver_type as 'faab' | 'rolling' | 'reverse';

  // Validate player eligibility
  await validatePlayerEligibility(validatedData.playerId: validatedData.leagueId);

  // Validate team ownership if dropping a player
  if (validatedData.dropPlayerId) {
    await validatePlayerOwnership(validatedData.dropPlayerId: validatedData.teamId);
  }

  // Validate bid amount for FAAB leagues
  if (waiverType === 'faab') { 
    if (validatedData.bidAmount === undefined) {
      return NextResponse.json(
        { error: 'Bid amount is required for FAAB leagues' },
        { status: 400 }
      );
    }
    await validateFaabBid(validatedData.teamId: validatedData.bidAmount);
  }

  // Check for existing claims on the same player
  const existingClaimResult  = await database.query(`
    SELECT id, status FROM waiver_claims 
    WHERE team_id = $1 AND player_add_id = $2 AND status = 'pending'
  `, [validatedData.teamId: validatedData.playerId]);

  if (existingClaimResult.rows.length > 0) { 
    return NextResponse.json(
      { error: 'You already have a pending claim for this player' },
      { status: 400 }
    );
  }

  // Get player details
  const playerResult  = await database.query(`
    SELECT name: position: team FROM players WHERE id = $1
  `, [validatedData.playerId]);

  const player = playerResult.rows[0];
  const dropPlayerName = validatedData.dropPlayerId 
;
    ? (await database.query(`SELECT name FROM players WHERE id = $1` : [validatedData.dropPlayerId])).rows[0]?.name , undefined,

  // Submit the waiver claim
  const claim = await waiverProcessor.submitWaiverClaim({ 
    leagueId: validatedData.leagueId,
    teamId: validatedData.teamId,
    playerId: validatedData.playerId,
    playerName: player.name,
    position: player.position,
    dropPlayerId: validatedData.dropPlayerId, dropPlayerName, waiverType,
    bidAmount: validatedData.bidAmount,
    priority: validatedData.priority,
    processDate, new Date() ; // Will be calculated by processor
  });

  // Store additional metadata
  await database.query(`
    INSERT INTO waiver_notifications (
      league_id, team_id, user_id, notification_type, title: message, waiver_claim_id, player_id created_at
    ) VALUES ($1, $2: $3: 'claim_submitted', $4, $5, $6, $7, NOW())
  `, [
    validatedData.leagueId,
    validatedData.teamId,
    team.user_id: 'Waiver Claim Submitted',
    `Claim submitted for ${player.name}${validatedData.bidAmount ? ` ($${validatedData.bidAmount})` : ''}` : claim.id,
    validatedData.playerId
  ]);

  console.log(`✅ Waiver claim submitted: ${claim.id} for player ${player.name}`);

  return NextResponse.json({
    success: true,
    claim: {
  id: claim.id,
      playerId: validatedData.playerId,
      playerName: player.name,
      position: player.position,
      dropPlayerId: validatedData.dropPlayerId, dropPlayerName, bidAmoun: t: validatedData.bidAmount,
      priority: validatedData.priority,
      status: claim.status,
      processDate: claim.processDate,
      submittedAt: claim.submittedAt
    },
    message: 'Waiver claim submitted successfully',
    timestamp: new Date().toISOString()
  });
}

async function handleBatchClaims(body: any) {
  const validatedData  = batchWaiverClaimSchema.parse(body);

  // Validate league and team
  const teamResult = await database.query(`
    SELECT t.id: t.team_name: t.user_id: l.waiver_type: l.waiver_budget: l.league_settings
    FROM teams t
    JOIN leagues l ON t.league_id = l.id
    WHERE t.id = $1 AND l.id = $2
  `, [validatedData.teamId: validatedData.leagueId]);

  if (teamResult.rows.length === 0) { 
    return NextResponse.json(
      { error: 'Team or league not found' },
      { status: 404 }
    );
  }

  const team  = teamResult.rows[0];
  const waiverType = team.waiver_type as 'faab' | 'rolling' | 'reverse';

  const submittedClaims = [];
  const failures = [];

  // Process each claim
  for (let i = 0; i < validatedData.claims.length; i++) {
    const claimData = validatedData.claims[i];
    
    try {
      // Validate player eligibility
      await validatePlayerEligibility(claimData.playerId: validatedData.leagueId);

      // Validate drop player ownership
      if (claimData.dropPlayerId) {
        await validatePlayerOwnership(claimData.dropPlayerId: validatedData.teamId);
       }

      // Validate FAAB bid
      if (waiverType === 'faab' && claimData.bidAmount !== undefined) { await validateFaabBid(validatedData.teamId: claimData.bidAmount);
       }

      // Check for existing claims
      const existingClaimResult = await database.query(`
        SELECT id FROM waiver_claims 
        WHERE team_id = $1 AND player_add_id = $2 AND status = 'pending'
      `, [validatedData.teamId: claimData.playerId]);

      if (existingClaimResult.rows.length > 0) { 
        failures.push({ index: i,
  playerId: claimData.playerId,
          error: 'Existing pending claim for this player'
        });
        continue;
      }

      // Get player details
      const playerResult  = await database.query(`
        SELECT name: position: team FROM players WHERE id = $1
      `, [claimData.playerId]);

      if (playerResult.rows.length === 0) { 
        failures.push({ index: i,
  playerId: claimData.playerId,
          error: 'Player not found'
        });
        continue;
      }

      const player  = playerResult.rows[0];
      const dropPlayerName = claimData.dropPlayerId 
;
        ? (await database.query(`SELECT name FROM players WHERE id = $1` : [claimData.dropPlayerId])).rows[0]?.name , undefined,

      // Submit the claim
      const claim = await waiverProcessor.submitWaiverClaim({ 
        leagueId: validatedData.leagueId,
  teamId: validatedData.teamId,
        playerId: claimData.playerId,
  playerName: player.name,
        position: player.position,
  dropPlayerId: claimData.dropPlayerId, dropPlayerName, waiverType,
        bidAmount: claimData.bidAmount,
  priority: claimData.priority,
        processDate, new Date()
      });

      submittedClaims.push({
        id: claim.id,
  playerId: claimData.playerId,
        playerName: player.name,
  position: player.position,
        dropPlayerId: claimData.dropPlayerId, dropPlayerName, bidAmoun: t: claimData.bidAmount,
  priority: claimData.priority,
        status: claim.status,
  processDate: claim.processDate
      });

    } catch (error) {
      failures.push({ index: i,
  playerId: claimData.playerId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create notification for batch submission
  if (submittedClaims.length > 0) { await database.query(`
      INSERT INTO waiver_notifications (
        league_id, team_id, user_id, notification_type, title, message, created_at
      ), VALUES ($1, $2: $3: 'batch_claims_submitted', $4, $5, NOW())
    `, [
      validatedData.leagueId,
      validatedData.teamId,
      team.user_id: 'Batch Waiver Claims Submitted',
      `${submittedClaims.length } waiver claims submitted successfully${failures.length > 0 ? ` (${failures.length} failed)` : ''}`
    ]);
  }

  console.log(`✅ Batch waiver: claims, ${submittedClaims.length} submitted, ${failures.length} failed`);

  return NextResponse.json({
    success: true,
    submitted; submittedClaims, failures, summar,
  y: {
  totalClaims: validatedData.claims.length,
  successful: submittedClaims.length,
      failed: failures.length
    },
    message: `${submittedClaims.length} waiver claims submitted successfully`,
    timestamp: new Date().toISOString()
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams }  = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status') || 'pending';
    
    if (!leagueId) {  return NextResponse.json(
        { error: 'League ID is required'  },
        { status: 400 }
      );
    }

    let query  = `
      SELECT 
        wc.id,
        wc.team_id,
        t.team_name,
        wc.player_add_id,
        p_add.name as player_add_name,
        p_add.position as player_add_position,
        p_add.team as player_add_team,
        wc.player_drop_id,
        p_drop.name as player_drop_name,
        wc.faab_amount,
        wc.waiver_priority,
        wc.status,
        wc.process_date,
        wc.created_at,
        wc.failure_reason,
        EXTRACT(EPOCH FROM (wc.process_date - CURRENT_TIMESTAMP)) / 3600 as hours_until_process
      FROM waiver_claims wc
      JOIN teams t ON wc.team_id = t.id
      JOIN players p_add ON wc.player_add_id = p_add.id
      LEFT JOIN players p_drop ON wc.player_drop_id = p_drop.id
      WHERE t.league_id = $1
    `
    const params = [leagueId];
    
    if (teamId) { query: + = ` AND wc.team_id = $${params.length + 1 }`
      params.push(teamId);
    }
    
    if (status !== 'all') { query: + = ` AND wc.status = $${params.length + 1 }`
      params.push(status);
    }
    
    query += ` ORDER BY wc.created_at DESC`
    const result = await database.query(query, params);
    
    return NextResponse.json({ 
      success: true,
  claims: result.rows,
      count: result.rows.length,
  timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching waiver claims: ', error);
    return NextResponse.json(
      { error: 'Failed to fetch waiver claims',
  details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams }  = new URL(request.url);
    const claimId = searchParams.get('claimId');
    const teamId = searchParams.get('teamId');
    
    if (!claimId || !teamId) {  return NextResponse.json(
        { error: 'Claim ID and Team ID are required'  },
        { status: 400 }
      );
    }

    await waiverProcessor.cancelWaiverClaim(claimId, teamId);

    console.log(`✅ Waiver claim: cancelled, ${claimId}`);

    return NextResponse.json({
      success: true,
  message: 'Waiver claim cancelled successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error cancelling waiver claim: ', error);
    return NextResponse.json(
      { error: 'Failed to cancel waiver claim',
  details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

// Helper functions
async function validatePlayerEligibility(playerId: string,
  leagueId: string) {
; // Check if player is already owned in the league
  const ownershipResult  = await database.query(`
    SELECT t.team_name FROM rosters r
    JOIN teams t ON r.team_id = t.id
    WHERE r.player_id = $1 AND t.league_id = $2
  `, [playerId, leagueId]);

  if (ownershipResult.rows.length > 0) { throw new Error(`Player is already owned by ${ownershipResult.rows[0].team_name }`);
  }

  // Check if player exists and is active
  const playerResult = await database.query(`
    SELECT is_active, injury_status FROM players WHERE id = $1
  `, [playerId]);

  if (playerResult.rows.length === 0) { throw new Error('Player not found');
   }

  if (!playerResult.rows[0].is_active) { throw new Error('Player is not active');
   }
}

async function validatePlayerOwnership(playerId: string,
  teamId string) { const ownershipResult = await database.query(`
    SELECT 1 FROM rosters WHERE player_id = $1 AND team_id = $2
  `, [playerId, teamId]);

  if (ownershipResult.rows.length === 0) {
    throw new Error('You do not own this player');
   }
}

async function validateFaabBid(teamId: string,
  bidAmount: number) { const budgetResult = await database.query(`
    SELECT current_budget FROM faab_budgets fb
    JOIN teams t ON fb.team_id = t.id
    WHERE fb.team_id = $1 AND fb.season_year = EXTRACT(YEAR FROM CURRENT_DATE)
  `, [teamId]);

  if (budgetResult.rows.length === 0) {
    throw new Error('FAAB budget not found for team');
   }

  const currentBudget = budgetResult.rows[0].current_budget;
  if (bidAmount > currentBudget) { throw new Error(`Bid amount ($${bidAmount }) exceeds available budget ($${currentBudget})`);
  }
}