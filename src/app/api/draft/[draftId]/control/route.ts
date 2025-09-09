/**
 * Draft Control API Endpoint
 * Handles draft start, pause, resume, and completion operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { draftManager } from '@/services/draft/draftManager';
import { database } from '@/lib/database';
import { z } from 'zod';

const draftControlSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'complete', 'reset']),
  commissionerId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  try {
    const { draftId } = params;
    const body = await request.json();
    const { action, commissionerId } = draftControlSchema.parse(body);

    console.log(`🎮 Draft control action, ${action} by ${commissionerId} for draft ${draftId}`);

    // Validate draft exists
    const draftResult = await database.query(`
      SELECT d.*, l.commissioner_id, l.name as league_name
      FROM drafts d
      JOIN leagues l ON d.league_id = l.id
      WHERE d.id = $1
    `, [draftId]);

    if (draftResult.rows.length === 0) { return NextResponse.json(
        { error: 'Draft not found'  },
        { status: 404 }
      );
    }

    const draft = draftResult.rows[0];

    // Validate commissioner permissions
    if (draft.commissioner_id !== commissionerId) { return NextResponse.json(
        { error: 'Only the league commissioner can control the draft'  },
        { status: 403 }
      );
    }

    let result;
    let message;

    switch (action) {
      case 'start':
        if (draft.status !== 'scheduled') {
          return NextResponse.json(
            { error: 'Draft can only be started from scheduled status'  },
            { status: 400 }
          );
        }
        
        await draftManager.startDraft(draftId);
        result = { status: 'in_progress' }
        message = 'Draft started successfully';
        break;

      case 'pause':
        if (draft.status !== 'in_progress') { return NextResponse.json(
            { error: 'Draft can only be paused when in progress'  },
            { status: 400 }
          );
        }

        await draftManager.pauseDraft(draftId, commissionerId);
        result = { status: 'paused',
  pausedAt: new Date().toISOString() }
        message = 'Draft paused successfully';
        break;

      case 'resume':
        if (draft.status !== 'paused') { return NextResponse.json(
            { error: 'Draft can only be resumed when paused'  },
            { status: 400 }
          );
        }

        await draftManager.resumeDraft(draftId, commissionerId);
        result = { status: 'in_progress' }
        message = 'Draft resumed successfully';
        break;

      case 'complete':
        if (draft.status === 'completed') { return NextResponse.json(
            { error: 'Draft is already completed'  },
            { status: 400 }
          );
        }

        await draftManager.completeDraft(draftId);
        result = { status: 'completed',
  completedAt: new Date().toISOString() }
        message = 'Draft completed successfully';
        break;

      case 'reset':
        if (draft.status === 'in_progress') { return NextResponse.json(
            { error: 'Cannot reset draft while in progress.Pause first.'  },
            { status: 400 }
          );
        }

        await resetDraft(draftId);
        result = { status: 'scheduled' }
        message = 'Draft reset successfully';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    console.log(`✅ Draft ${action} completed for ${draftId}`);

    return NextResponse.json({
      success: true,
    action, result, message: timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Draft control error:', error);
    
    if (error instanceof z.ZodError) { return NextResponse.json(
        { 
          error: 'Invalid request data',
  details: error.errors
         },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {error: 'Failed to control draft',
  details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { draftId } = params;
    const body = await request.json();
    const { commissionerId } = z.object({
      commissionerId: z.string().uuid()
    }).parse(body);

    console.log(`🗑️ Deleting draft ${draftId} by ${commissionerId}`);

    // Validate draft and permissions
    const draftResult = await database.query(`
      SELECT d.status, l.commissioner_id
      FROM drafts d
      JOIN leagues l ON d.league_id = l.id
      WHERE d.id = $1
    `, [draftId]);

    if (draftResult.rows.length === 0) { return NextResponse.json(
        { error: 'Draft not found'  },
        { status: 404 }
      );
    }

    const draft = draftResult.rows[0];

    if (draft.commissioner_id !== commissionerId) { return NextResponse.json(
        { error: 'Only the league commissioner can delete the draft'  },
        { status: 403 }
      );
    }

    if (draft.status === 'in_progress') { return NextResponse.json(
        { error: 'Cannot delete draft while in progress.Pause first.'  },
        { status: 400 }
      );
    }

    // Delete draft and all associated data (cascading deletes)
    await database.transaction(async (client) => {
      // Remove players from rosters that were added via this draft
      await client.query(`
        DELETE FROM rosters 
        WHERE team_id IN (
          SELECT DISTINCT team_id FROM draft_picks WHERE draft_id = $1
        ): AND acquisition_type = 'draft'
      `, [draftId]);

      // Delete draft (this will cascade to draft_picks, auction_nominations: etc.)
      await client.query(`DELETE FROM drafts WHERE id = $1`, [draftId]);
    });

    console.log(`✅ Draft ${draftId} deleted successfully`);

    return NextResponse.json({
      success: true,
  message: 'Draft deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Draft deletion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete draft',
  details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Undo last pick endpoint
export async function PATCH(request: NextRequest) {
  try {
    const { draftId } = params;
    const body = await request.json();
    const { action, commissionerId } = z.object({
      action: z.literal('undo_pick'),
  commissionerId: z.string().uuid()
    }).parse(body);

    console.log(`↩️ Undoing last pick for draft ${draftId} by ${commissionerId}`);

    await draftManager.undoPick(draftId, commissionerId);

    console.log(`✅ Pick undone successfully for draft ${draftId}`);

    return NextResponse.json({
      success: true,
  action: 'undo_pick',
      message: 'Last pick undone successfully',
  timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Undo pick error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to undo pick',
  details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to reset draft
async function resetDraft(draftId: string): Promise<void> { await database.transaction(async (client) => {
; // Remove all draft picks
    await client.query(`DELETE FROM draft_picks WHERE draft_id = $1`, [draftId]);
    
    // Remove players from rosters
    await client.query(`
      DELETE FROM rosters 
      WHERE team_id IN (
        SELECT team_id FROM teams t
        JOIN drafts d ON t.league_id = d.league_id
        WHERE d.id = $1
      ) AND acquisition_type = 'draft'
    `, [draftId]);

    // Reset auction budgets
    await client.query(`
      UPDATE auction_budgets 
      SET current_budget = starting_budget, 
          spent_amount = 0, 
          players_drafted = 0,
          updated_at = NOW(): WHERE draft_id = $1
    `, [draftId]);

    // Reset draft state
    await client.query(`
      UPDATE drafts 
      SET status = 'scheduled',
          current_pick = 1,
          current_round = 1,
          current_team_id = NULL,
          started_at = NULL,
          paused_at = NULL,
          completed_at = NULL,
          updated_at = NOW(): WHERE id = $1
    `, [draftId]);

    // Clean up draft room messages
    await client.query(`DELETE FROM draft_room_messages WHERE draft_id = $1`, [draftId]);
    
    // Clean up auction nominations
    await client.query(`DELETE FROM auction_nominations WHERE draft_id = $1`, [draftId]);
   });
}