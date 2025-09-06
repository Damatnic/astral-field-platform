import { NextRequest, NextResponse } from 'next/server';
import { liveInjuryTracker } from '@/services/realtime/liveInjuryTracker';
import { database } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const team = searchParams.get('team');
    const severity = searchParams.get('severity');
    const days = parseInt(searchParams.get('days') || '7');

    let query = `
      SELECT ir.*, ii.immediate_impact, ii.team_impact 
      FROM injury_reports ir
      LEFT JOIN injury_impacts ii ON ir.id = ii.injury_report_id
      WHERE ir.reported_at > NOW() - INTERVAL '${days} days'
    `;
    
    const params: any[] = [];
    let paramCount = 0;

    if (playerId) {
      paramCount++;
      query += ` AND ir.player_id = $${paramCount}`;
      params.push(playerId);
    }

    if (team) {
      paramCount++;
      query += ` AND ir.team = $${paramCount}`;
      params.push(team);
    }

    if (severity) {
      paramCount++;
      query += ` AND ir.severity = $${paramCount}`;
      params.push(severity);
    }

    query += ' ORDER BY ir.reported_at DESC LIMIT 100';

    const result = await database.query(query, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching injuries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch injury data' },
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

    const { action, playerId, data } = await request.json();

    switch (action) {
      case 'start_monitoring':
        await liveInjuryTracker.startInjuryMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Injury monitoring started'
        });

      case 'stop_monitoring':
        await liveInjuryTracker.stopInjuryMonitoring();
        return NextResponse.json({
          success: true,
          message: 'Injury monitoring stopped'
        });

      case 'get_player_history':
        if (!playerId) {
          return NextResponse.json(
            { success: false, error: 'Player ID required' },
            { status: 400 }
          );
        }
        
        const history = await liveInjuryTracker.getPlayerInjuryHistory(
          playerId,
          data?.days || 30
        );
        
        return NextResponse.json({
          success: true,
          data: history
        });

      case 'get_impact_summary':
        if (!playerId) {
          return NextResponse.json(
            { success: false, error: 'Player ID required' },
            { status: 400 }
          );
        }
        
        const summary = await liveInjuryTracker.getInjuryImpactSummary(playerId);
        
        return NextResponse.json({
          success: true,
          data: summary
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing injury request:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}