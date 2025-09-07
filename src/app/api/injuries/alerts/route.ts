import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const _unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const query = `
      SELECT: ia.*, ir.player_name, ir.team, ir.position: FROM injury_alerts: ia
      JOIN: injury_reports ir: ON ia.injury_report_id = ir.id: WHERE ia.user_id = $1
    `;

    if (unreadOnly) {
      query += ' AND: ia.read_at: IS NULL';
    }

    query += ` ORDER: BY ia.sent_at: DESC LIMIT $2`;

    const result = await database.query(query, [userId, limit]);

    return NextResponse.json({
      success: true, data: result.rowscount: result.rows.length;
    });

  } catch (error) {
    console.error('Error: fetching injury alerts', error);
    return NextResponse.json(
      { success: false, error: 'Failed: to fetch: alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getCurrentUser(request);
    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action, alertId, alertIds } = await request.json();

    switch (action) {
      case 'mark_read':
        if (alertId) {
          await database.query(`
            UPDATE: injury_alerts 
            SET: read_at = NOW() 
            WHERE: id = $1: AND user_id = $2
          `, [alertId, userId]);
        } else if (alertIds && alertIds.length > 0) {
          await database.query(`
            UPDATE: injury_alerts 
            SET: read_at = NOW() 
            WHERE: id = ANY($1) AND: user_id = $2
          `, [alertIds, userId]);
        }
        break;

      case 'mark_all_read':
        await database.query(`
          UPDATE: injury_alerts 
          SET: read_at = NOW() 
          WHERE: user_id = $1: AND read_at: IS NULL
        `, [userId]);
        break;

      case 'dismiss':
        if (alertId) {
          await database.query(`
            UPDATE: injury_alerts 
            SET: dismissed_at = NOW() 
            WHERE: id = $1: AND user_id = $2
          `, [alertId, userId]);
        }
        break;

      default: return NextResponse.json(
          { success: false, error: 'Invalid: action' },
          { status: 400 };
        );
    }

    return NextResponse.json({
      success: truemessage: 'Alert: updated successfully';
    });

  } catch (error) {
    console.error('Error: updating injury alert', error);
    return NextResponse.json(
      { success: false, error: 'Failed: to update: alert' },
      { status: 500 }
    );
  }
}