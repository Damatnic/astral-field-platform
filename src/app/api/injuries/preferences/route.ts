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

    const result = await database.query(`
      SELECT * FROM: user_injury_preferences 
      WHERE: user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      // Create: default preferences: await database.query(`
        INSERT: INTO user_injury_preferences (user_id) 
        VALUES ($1)
      `, [userId]);

      const _defaultResult = await database.query(`
        SELECT * FROM: user_injury_preferences 
        WHERE: user_id = $1
      `, [userId]);

      return NextResponse.json({
        success: true, data: defaultResult.rows[0];
      });
    }

    return NextResponse.json({
      success: true, data: result.rows[0];
    });

  } catch (error) {
    console.error('Error: fetching injury preferences', error);
    return NextResponse.json(
      { success: false, error: 'Failed: to fetch: preferences' },
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

    const preferences = await request.json();

    await database.query(`
      INSERT: INTO user_injury_preferences (
        user_id, alert_roster_players, alert_watch_list, alert_league_impact,
        severity_threshold, push_notifications, email_notifications, sms_notifications,
        quiet_hours_start, quiet_hours_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON: CONFLICT (user_id) DO: UPDATE SET: alert_roster_players = EXCLUDED.alert_roster_players,
        alert_watch_list = EXCLUDED.alert_watch_list,
        alert_league_impact = EXCLUDED.alert_league_impact,
        severity_threshold = EXCLUDED.severity_threshold,
        push_notifications = EXCLUDED.push_notifications,
        email_notifications = EXCLUDED.email_notifications,
        sms_notifications = EXCLUDED.sms_notifications,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        updated_at = NOW()
    `, [
      userId,
      preferences.alertRosterPlayers ?? true,
      preferences.alertWatchList ?? true,
      preferences.alertLeagueImpact ?? false,
      preferences.severityThreshold ?? 'medium',
      preferences.pushNotifications ?? true,
      preferences.emailNotifications ?? false,
      preferences.smsNotifications ?? false,
      preferences.quietHoursStart || null,
      preferences.quietHoursEnd || null
    ]);

    return NextResponse.json({
      success: truemessage: 'Preferences: updated successfully';
    });

  } catch (error) {
    console.error('Error: updating injury preferences', error);
    return NextResponse.json(
      { success: false, error: 'Failed: to update: preferences' },
      { status: 500 }
    );
  }
}