import { NextRequest, NextResponse } from 'next/server';
import { tradeOpportunityDetector } from '@/services/ai/tradeOpportunityDetector';
import { verifyAuth } from '@/lib/auth';
import { neonDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const leagueId = searchParams.get('leagueId');
    const limit = parseInt(searchParams.get('limit') || '10');

    switch (action) {
      case 'user_opportunities':
        const opportunities = await tradeOpportunityDetector.getUserOpportunities(userId, limit);
        return NextResponse.json({
          success: true,
          data: {
            opportunities,
            count: opportunities.length
          }
        });

      case 'league_scan_status':
        if (!leagueId) {
          return NextResponse.json(
            { success: false, error: 'League ID required' },
            { status: 400 }
          );
        }

        const scanResults = await tradeOpportunityDetector.getLastScanResults(leagueId);
        return NextResponse.json({
          success: true,
          data: scanResults
        });

      case 'market_insights':
        if (!leagueId) {
          return NextResponse.json(
            { success: false, error: 'League ID required' },
            { status: 400 }
          );
        }

        const insights = await getMarketInsights(leagueId, limit);
        return NextResponse.json({
          success: true,
          data: insights
        });

      case 'opportunity_dashboard':
        if (!leagueId) {
          return NextResponse.json(
            { success: false, error: 'League ID required' },
            { status: 400 }
          );
        }

        const dashboard = await getOpportunityDashboard(leagueId);
        return NextResponse.json({
          success: true,
          data: dashboard
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in trade opportunities API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, leagueId, focusUserId, ...data } = await request.json();

    switch (action) {
      case 'scan_league':
        if (!leagueId) {
          return NextResponse.json(
            { success: false, error: 'League ID required' },
            { status: 400 }
          );
        }

        // Check if user has permission to scan this league
        const hasPermission = await checkLeaguePermission(userId, leagueId);
        if (!hasPermission) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        const scanResults = await tradeOpportunityDetector.scanLeagueForOpportunities(
          leagueId,
          focusUserId
        );

        return NextResponse.json({
          success: true,
          data: scanResults
        });

      case 'record_interaction':
        const { opportunityId, interactionType, interactionData } = data;
        
        if (!opportunityId || !interactionType) {
          return NextResponse.json(
            { success: false, error: 'Opportunity ID and interaction type required' },
            { status: 400 }
          );
        }

        await recordOpportunityInteraction(opportunityId, userId, interactionType, interactionData);

        return NextResponse.json({
          success: true,
          message: 'Interaction recorded'
        });

      case 'submit_feedback':
        const { opportunityId: feedbackOpportunityId, feedbackType, feedbackValue } = data;
        
        if (!feedbackOpportunityId || !feedbackType) {
          return NextResponse.json(
            { success: false, error: 'Opportunity ID and feedback type required' },
            { status: 400 }
          );
        }

        await submitOpportunityFeedback(feedbackOpportunityId, userId, feedbackType, feedbackValue);

        return NextResponse.json({
          success: true,
          message: 'Feedback submitted'
        });

      case 'update_trade_profile':
        const { preferences } = data;
        
        if (!preferences) {
          return NextResponse.json(
            { success: false, error: 'Preferences required' },
            { status: 400 }
          );
        }

        await updateUserTradeProfile(userId, leagueId, preferences);

        return NextResponse.json({
          success: true,
          message: 'Trade profile updated'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in trade opportunities POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, opportunityId, ...data } = await request.json();

    switch (action) {
      case 'mark_viewed':
        if (!opportunityId) {
          return NextResponse.json(
            { success: false, error: 'Opportunity ID required' },
            { status: 400 }
          );
        }

        await markOpportunityViewed(opportunityId, userId);

        return NextResponse.json({
          success: true,
          message: 'Opportunity marked as viewed'
        });

      case 'update_status':
        const { status } = data;
        
        if (!opportunityId || !status) {
          return NextResponse.json(
            { success: false, error: 'Opportunity ID and status required' },
            { status: 400 }
          );
        }

        await updateOpportunityStatus(opportunityId, status, userId);

        return NextResponse.json({
          success: true,
          message: 'Opportunity status updated'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in trade opportunities PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function checkLeaguePermission(userId: string, leagueId: string): Promise<boolean> {
  try {
    const result = await neonDb.query(`
      SELECT 1 FROM league_memberships 
      WHERE user_id = $1 AND league_id = $2 AND is_active = TRUE
    `, [userId, leagueId]);

    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking league permission:', error);
    return false;
  }
}

async function getMarketInsights(leagueId: string, limit: number) {
  const result = await neonDb.query(`
    SELECT * FROM market_insights
    WHERE league_id = $1 
    AND acted_upon = FALSE 
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY priority DESC, discovered_at DESC
    LIMIT $2
  `, [leagueId, limit]);

  return result.rows.map(row => ({
    id: row.id,
    type: row.insight_type,
    playerId: row.player_id,
    playerName: row.player_name,
    description: row.description,
    affectedUsers: row.affected_users,
    confidence: row.confidence,
    actionWindow: row.action_window_hours,
    priority: row.priority,
    discoveredAt: row.discovered_at,
    expiresAt: row.expires_at
  }));
}

async function getOpportunityDashboard(leagueId: string) {
  const result = await neonDb.query(`
    SELECT * FROM opportunity_dashboard WHERE league_id = $1
  `, [leagueId]);

  if (result.rows.length === 0) {
    return {
      leagueId,
      totalCombinations: 0,
      viableOpportunities: 0,
      activeOpportunities: 0,
      criticalOpportunities: 0,
      highOpportunities: 0,
      activeInsights: 0,
      urgentInsights: 0,
      activeTradingUsers: 0,
      avgResponseTimeHours: 24,
      lastScan: null,
      nextScanScheduled: null
    };
  }

  const row = result.rows[0];
  return {
    leagueId: row.league_id,
    leagueName: row.league_name,
    totalCombinations: row.total_combinations,
    viableOpportunities: row.viable_opportunities,
    activeOpportunities: row.active_opportunities,
    criticalOpportunities: row.critical_opportunities,
    highOpportunities: row.high_opportunities,
    activeInsights: row.active_insights,
    urgentInsights: row.urgent_insights,
    activeTradingUsers: row.active_trading_users,
    avgResponseTimeHours: row.avg_response_time_hours,
    lastScan: row.last_scan,
    nextScanScheduled: row.next_scan_scheduled
  };
}

async function recordOpportunityInteraction(
  opportunityId: string, 
  userId: string, 
  interactionType: string, 
  interactionData: any
) {
  await neonDb.query(`
    INSERT INTO opportunity_interactions (
      opportunity_id, user_id, interaction_type, interaction_data
    ) VALUES ($1, $2, $3, $4)
  `, [opportunityId, userId, interactionType, JSON.stringify(interactionData)]);
}

async function submitOpportunityFeedback(
  opportunityId: string, 
  userId: string, 
  feedbackType: string, 
  feedbackValue: any
) {
  await neonDb.query(`
    INSERT INTO opportunity_feedback (
      opportunity_id, user_id, feedback_type, feedback_value
    ) VALUES ($1, $2, $3, $4)
  `, [opportunityId, userId, feedbackType, JSON.stringify(feedbackValue)]);
}

async function updateUserTradeProfile(userId: string, leagueId: string, preferences: any) {
  await neonDb.query(`
    INSERT INTO user_trade_profiles (
      user_id, league_id, trading_activity, preferred_trade_types, 
      risk_tolerance, response_time, team_needs, trading_patterns
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (user_id, league_id) DO UPDATE SET
      trading_activity = EXCLUDED.trading_activity,
      preferred_trade_types = EXCLUDED.preferred_trade_types,
      risk_tolerance = EXCLUDED.risk_tolerance,
      response_time = EXCLUDED.response_time,
      team_needs = EXCLUDED.team_needs,
      trading_patterns = EXCLUDED.trading_patterns,
      updated_at = NOW()
  `, [
    userId,
    leagueId,
    preferences.tradingActivity || 'moderate',
    preferences.preferredTradeTypes || ['positional_need'],
    preferences.riskTolerance || 0.5,
    preferences.responseTime || 24,
    JSON.stringify(preferences.teamNeeds || []),
    JSON.stringify(preferences.tradingPatterns || {})
  ]);
}

async function markOpportunityViewed(opportunityId: string, userId: string) {
  // Determine which user viewed it (from_user or to_user)
  const opportunity = await neonDb.query(`
    SELECT from_user_id, to_user_id FROM trade_opportunities WHERE id = $1
  `, [opportunityId]);

  if (opportunity.rows.length === 0) {
    throw new Error('Opportunity not found');
  }

  const { from_user_id, to_user_id } = opportunity.rows[0];
  
  if (userId === from_user_id) {
    await neonDb.query(`
      UPDATE trade_opportunities 
      SET viewed_by_from_user = TRUE 
      WHERE id = $1
    `, [opportunityId]);
  } else if (userId === to_user_id) {
    await neonDb.query(`
      UPDATE trade_opportunities 
      SET viewed_by_to_user = TRUE 
      WHERE id = $1
    `, [opportunityId]);
  }

  // Record interaction
  await recordOpportunityInteraction(opportunityId, userId, 'view', {});
}

async function updateOpportunityStatus(opportunityId: string, status: string, userId: string) {
  await neonDb.query(`
    UPDATE trade_opportunities 
    SET status = $1 
    WHERE id = $2 AND (from_user_id = $3 OR to_user_id = $3)
  `, [status, opportunityId, userId]);
}