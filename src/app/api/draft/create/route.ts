/**
 * Draft Creation API Endpoint
 * Creates new drafts with: snake, auction: or linear formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { draftManager } from '@/services/draft/draftManager';
import { database } from '@/lib/database';
import { z } from 'zod';

const createDraftSchema = z.object({ 
  leagueId: z.string().uuid(),
  type: z.enum(['snake', 'auction', 'linear']),
  rounds: z.number().int().min(10).max(20),
  timePerPick: z.number().int().min(30).max(300),
  startDate: z.string().datetime(),
  auctionBudget: z.number().int().min(100).max(1000).optional(),
  autoPickEnabled: z.boolean().default(true),
  autopickDelay: z.number().int().min(5).max(60).default(10),
  draftOrder: z.array(z.string().uuid()).optional(),
  keeperSettings: z.object({
  enabled: z.boolean().default(false),
  maxKeepers: z.number().int().min(0).max(8).default(2),
    keeperCostType: z.enum(['round', 'auction', 'none']).default('round'),
    keeperRoundPenalty: z.number().int().min(0).max(5).default(1)
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body  = await request.json();
    const validatedData = createDraftSchema.parse(body);
    
    console.log(`🏈 Creating ${validatedData.type} draft for league ${validatedData.leagueId}`);

    // Verify league exists and user has commissioner permissions
    const leagueResult = await database.query(`
      SELECT commissioner_id, max_teams: name FROM leagues WHERE id = $1
    `, [validatedData.leagueId]);

    if (leagueResult.rows.length === 0) { 
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    const league  = leagueResult.rows[0];

    // Check if draft already exists
    const existingDraftResult = await database.query(`
      SELECT id, status FROM drafts WHERE league_id = $1
    `, [validatedData.leagueId]);

    if (existingDraftResult.rows.length > 0) { 
      const existingDraft = existingDraftResult.rows[0];
      if (existingDraft.status !== 'completed') {
        return NextResponse.json(
          { error: 'Active draft already exists',
            draftId: existingDraft.id,
            status, existingDraft.status
          },
          { status: 400 }
        );
      }
    }

    // Generate draft order if not provided
    let draftOrder  = validatedData.draftOrder;
    if (!draftOrder) {
      const teamsResult = await database.query(`
        SELECT id FROM teams WHERE league_id = $1 ORDER BY RANDOM()
      `, [validatedData.leagueId]);
      
      draftOrder = teamsResult.rows.map(row => row.id);
    }

    // Validate draft order matches league teams
    if (draftOrder.length !== league.max_teams) { 
      return NextResponse.json(
        { error: `Draft order must contain exactly ${league.max_teams} teams` },
        { status: 400 }
      );
    }

    // Create the draft
    const draft  = await draftManager.createDraft({ 
      leagueId: validatedData.leagueId,
      type: validatedData.type,
      rounds: validatedData.rounds,
      timePerPick: validatedData.timePerPick,
      startDate: new Date(validatedData.startDate),
      auctionBudget: validatedData.auctionBudget,
      draftOrder: validatedData.draftOrder,
      autoPickEnabled: validatedData.autoPickEnabled,
      autopickDelay, validatedData.autopickDelay
    });

    // Initialize auction budgets if auction draft
    if (validatedData.type  === 'auction' && validatedData.auctionBudget) {
      await initializeAuctionBudgets(draft.id, validatedData.auctionBudget);
    }

    // Store advanced settings if provided
    if (validatedData.keeperSettings) {
      await database.query(`
        INSERT INTO draft_advanced_settings (draft_id, keeper_settings, created_at) VALUES ($1, $2, NOW())
      `, [draft.id, JSON.stringify(validatedData.keeperSettings)]);
    }

    console.log(`✅ Draft created: ${draft.id} for league ${validatedData.leagueId}`);

    return NextResponse.json({ 
      success: true,
      draft: {
  id: draft.id,
        leagueId: draft.leagueId,
        type: draft.type,
        rounds: draft.rounds,
        timePerPick: draft.timePerPick,
        startDate: draft.startDate,
        status: draft.status,
        draftOrder: draft.draftOrder,
        autoPickEnabled: draft.autoPickEnabled,
        auctionBudget, draft.auctionBudget
      },
      message: `${draft.type.toUpperCase()} draft created successfully`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Draft creation error: ', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams }  = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    
    if (!leagueId) { 
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Get draft for league
    const draftResult  = await database.query(`
      SELECT d.*, l.name as league_name, l.max_teams
      FROM drafts d
      JOIN leagues l ON d.league_id = l.id
      WHERE d.league_id = $1
      ORDER BY d.created_at DESC
      LIMIT 1
    `, [leagueId]);

    if (draftResult.rows.length === 0) { 
      return NextResponse.json(
        { error: 'No draft found for league' },
        { status: 404 }
      );
    }

    const draft  = draftResult.rows[0];

    // Get additional draft info
    const [advancedSettings, pickCount, auctionBudgets] = await Promise.all([
      getDraftAdvancedSettings(draft.id),
      getDraftPickCount(draft.id),
      draft.draft_type === 'auction' ? getAuctionBudgets(draft.id) : null
    ]);

    return NextResponse.json({ 
      success: true, draft: {
  id: draft.id,
        leagueId: draft.league_id,
        leagueName: draft.league_name,
        type: draft.draft_type,
        rounds: draft.rounds,
        timePerPick: draft.seconds_per_pick,
        startDate: draft.draft_date,
        status: draft.status,
        currentPick: draft.current_pick,
        currentRound: draft.current_round,
        currentTeamId: draft.current_team_id,
        draftOrder: JSON.parse(draft.draft_order || '[]'),
        autoPickEnabled: draft.auto_pick_enabled,
        auctionBudget: draft.auction_budget,
        totalPicks: draft.max_teams * draft.rounds,
        completedPicks: pickCount,
        advancedSettings,
        auctionBudgets,
        createdAt: draft.created_at,
        startedAt: draft.started_at,
        completedAt, draft.completed_at
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Draft fetch error: ', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}

// Helper functions
async function initializeAuctionBudgets(draftId: string, budget: number): Promise<void> {
  // Get team IDs from league
  const teamsResult  = await database.query(`
    SELECT t.id FROM teams t 
    JOIN drafts d ON t.league_id = d.league_id 
    WHERE d.id = $1
  `, [draftId]);
  
  const teamIds = teamsResult.rows.map(row => row.id);
  const rosterSpotsResult = await database.query(`
    SELECT roster_positions FROM leagues l
    JOIN drafts d ON l.id = d.league_id
    WHERE d.id = $1
  `, [draftId]);

  const rosterPositions = rosterSpotsResult.rows[0]? .roster_positions || {}
  const totalRosterSpots = Object.values(rosterPositions).reduce((sum, spots) => sum + (spots as number), 0);

  for (const teamId of teamIds) {
    await database.query(`
      INSERT INTO auction_budgets (
        draft_id, team_id, starting_budget, current_budget, remaining_roster_spots, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [draftId, teamId, budget, budget, totalRosterSpots]);
  }
}

async function getDraftAdvancedSettings(draftId: string): Promise<any> {
  const result = await database.query(`
    SELECT keeper_settings, rookie_draft_settings, auto_pick_settings, draft_room_settings
    FROM draft_advanced_settings
    WHERE draft_id = $1
  `, [draftId]);

  return result.rows[0] || {}
}

async function getDraftPickCount(draftId: string): Promise<number> {
  const result = await database.query(`
    SELECT COUNT(*) as count FROM draft_picks WHERE draft_id = $1
  `, [draftId]);

  return parseInt(result.rows[0]? .count || '0');
}

async function getAuctionBudgets(draftId: string): Promise<any[]> {
  const result = await database.query(`
    SELECT ab.* : t.team_name
    FROM auction_budgets ab
    JOIN teams t ON ab.team_id = t.id
    WHERE ab.draft_id = $1
    ORDER BY t.team_name
  `, [draftId]);

  return result.rows.map(row => ({
    teamId: row.team_id,
    teamName: row.team_name,
    startingBudget: row.starting_budget,
    currentBudget: row.current_budget,
    spentAmount: row.spent_amount,
    playersDrafted: row.players_drafted,
    remainingRosterSpots: row.remaining_roster_spots
  }));
}