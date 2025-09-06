import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { LeagueHealthMonitoringService } from '@/services/league/leagueHealthMonitor';
import { WebSocketManager } from '@/services/websocket/manager';
import { AIRouterService } from '@/services/ai/router';
import { UserBehaviorAnalysisService } from '@/services/ai/userBehaviorAnalysis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize services
const wsManager = new WebSocketManager();
const aiRouter = new AIRouterService();
const behaviorAnalysis = new UserBehaviorAnalysisService(pool, aiRouter);
const healthMonitor = new LeagueHealthMonitoringService(
  pool,
  wsManager,
  aiRouter,
  behaviorAnalysis
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const action = searchParams.get('action') || 'dashboard';
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to league
    const { data: userTeam } = await supabase
      .from('teams')
      .select('id, user_id, league_id')
      .eq('league_id', leagueId)
      .eq('user_id', userId)
      .single();

    const { data: league } = await supabase
      .from('leagues')
      .select('commissioner_id')
      .eq('id', leagueId)
      .single();

    const isCommissioner = league?.commissioner_id === userId;
    const hasAccess = userTeam || isCommissioner;

    if (!hasAccess && userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'dashboard':
        const dashboard = await healthMonitor.getLeagueHealthDashboard(leagueId);
        
        // Filter sensitive data for non-commissioners
        if (!isCommissioner) {
          dashboard.alerts = dashboard.alerts.filter(alert => 
            alert.severity !== 'low' && !alert.automated
          );
        }

        return NextResponse.json(dashboard);

      case 'engagement':
        const engagement = await healthMonitor.getEngagementInsights(leagueId, userId);
        return NextResponse.json({ engagement });

      case 'trends':
        const client = await pool.connect();
        try {
          const { rows: trends } = await client.query(
            'SELECT * FROM calculate_health_trend($1, $2)',
            [leagueId, days]
          );
          return NextResponse.json({ trends });
        } finally {
          client.release();
        }

      case 'at-risk':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const client2 = await pool.connect();
        try {
          const { rows: atRiskUsers } = await client2.query(
            'SELECT * FROM identify_at_risk_users($1)',
            [leagueId]
          );
          return NextResponse.json({ atRiskUsers });
        } finally {
          client2.release();
        }

      case 'balance':
        const client3 = await pool.connect();
        try {
          const { rows: balanceScore } = await client3.query(
            'SELECT calculate_competitive_balance_score($1) as balance_score',
            [leagueId]
          );
          
          // Get detailed balance metrics
          const { rows: balanceDetails } = await client3.query(`
            WITH win_distribution AS (
              SELECT 
                team_name,
                wins,
                losses,
                wins::DECIMAL / GREATEST(wins + losses, 1) as win_pct,
                points_for,
                points_against
              FROM teams 
              WHERE league_id = $1 AND active = true
            ),
            scoring_stats AS (
              SELECT 
                t.team_name,
                AVG(tws.weekly_score) as avg_score,
                STDDEV(tws.weekly_score) as score_stddev
              FROM teams t
              JOIN team_weekly_scores tws ON t.id = tws.team_id
              WHERE t.league_id = $1 
                AND tws.weekly_score > 0
                AND tws.week_number >= (
                  SELECT MAX(week_number) - 4 
                  FROM team_weekly_scores tws2
                  WHERE tws2.team_id = t.id
                )
              GROUP BY t.id, t.team_name
            )
            SELECT 
              wd.team_name,
              wd.wins,
              wd.losses,
              wd.win_pct,
              wd.points_for,
              wd.points_against,
              ss.avg_score,
              ss.score_stddev
            FROM win_distribution wd
            LEFT JOIN scoring_stats ss ON wd.team_name = ss.team_name
            ORDER BY wd.win_pct DESC
          `, [leagueId]);

          return NextResponse.json({
            balanceScore: balanceScore[0]?.balance_score || 0,
            teamDetails: balanceDetails
          });
        } finally {
          client3.release();
        }

      case 'config':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const client4 = await pool.connect();
        try {
          const { rows: config } = await client4.query(
            'SELECT * FROM league_health_config WHERE league_id = $1',
            [leagueId]
          );
          return NextResponse.json({ config: config[0] || {} });
        } finally {
          client4.release();
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error fetching league health data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league health data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, leagueId, userId, ...data } = body;

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Verify commissioner access for most actions
    const { data: league } = await supabase
      .from('leagues')
      .select('commissioner_id')
      .eq('id', leagueId)
      .single();

    const isCommissioner = league?.commissioner_id === userId;

    switch (action) {
      case 'start-monitoring':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        await healthMonitor.startLeagueMonitoring(leagueId);
        return NextResponse.json({ 
          success: true, 
          message: 'League health monitoring started' 
        });

      case 'stop-monitoring':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        await healthMonitor.stopLeagueMonitoring(leagueId);
        return NextResponse.json({ 
          success: true, 
          message: 'League health monitoring stopped' 
        });

      case 'trigger-assessment':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        await healthMonitor.triggerHealthAssessment(leagueId);
        return NextResponse.json({ 
          success: true, 
          message: 'Health assessment triggered' 
        });

      case 'resolve-alert':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { alertId } = data;
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required' },
            { status: 400 }
          );
        }

        const client = await pool.connect();
        try {
          await client.query(`
            UPDATE league_health_alerts 
            SET resolved = true, resolved_by = $1, resolved_at = NOW()
            WHERE id = $2 AND league_id = $3
          `, [userId, alertId, leagueId]);

          return NextResponse.json({ 
            success: true, 
            message: 'Alert resolved' 
          });
        } finally {
          client.release();
        }

      case 'update-config':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { config } = data;
        if (!config) {
          return NextResponse.json(
            { error: 'Configuration data is required' },
            { status: 400 }
          );
        }

        const client2 = await pool.connect();
        try {
          await client2.query(`
            INSERT INTO league_health_config (
              league_id, monitoring_enabled, alert_thresholds, 
              automated_responses, notification_settings, assessment_frequency
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (league_id) 
            DO UPDATE SET
              monitoring_enabled = EXCLUDED.monitoring_enabled,
              alert_thresholds = EXCLUDED.alert_thresholds,
              automated_responses = EXCLUDED.automated_responses,
              notification_settings = EXCLUDED.notification_settings,
              assessment_frequency = EXCLUDED.assessment_frequency,
              updated_at = NOW()
          `, [
            leagueId,
            config.monitoring_enabled || true,
            JSON.stringify(config.alert_thresholds || {}),
            JSON.stringify(config.automated_responses || {}),
            JSON.stringify(config.notification_settings || {}),
            config.assessment_frequency || 'daily'
          ]);

          return NextResponse.json({ 
            success: true, 
            message: 'Configuration updated' 
          });
        } finally {
          client2.release();
        }

      case 'manual-health-check':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const metrics = await healthMonitor.performHealthCheck(leagueId);
        return NextResponse.json({ 
          success: true, 
          metrics,
          message: 'Manual health check completed' 
        });

      case 'send-engagement-boost':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { targetUsers, messageType } = data;
        
        // This would trigger engagement boost messages
        const client3 = await pool.connect();
        try {
          // Log the engagement initiative
          const { rows: initiative } = await client3.query(`
            INSERT INTO league_initiatives (
              league_id, type, title, description, config
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [
            leagueId,
            'engagement_boost',
            'Manual Engagement Initiative',
            `Commissioner initiated engagement boost: ${messageType}`,
            JSON.stringify({ targetUsers, messageType, triggeredBy: userId })
          ]);

          // Send engagement messages (this would integrate with notification system)
          for (const targetUserId of targetUsers || []) {
            await wsManager.sendToUser(targetUserId, {
              type: 'engagement_boost',
              message: `Your league commissioner has sent an engagement boost! Check your league for updates.`,
              initiative_id: initiative[0].id
            });
          }

          return NextResponse.json({ 
            success: true, 
            message: `Engagement boost sent to ${targetUsers?.length || 0} users` 
          });
        } finally {
          client3.release();
        }

      case 'create-challenge':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { title, description, challengeType, duration } = data;
        
        const client4 = await pool.connect();
        try {
          await client4.query(`
            INSERT INTO league_initiatives (
              league_id, type, title, description, config, end_date
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            leagueId,
            challengeType || 'custom_challenge',
            title,
            description,
            JSON.stringify({ duration, createdBy: userId }),
            duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
          ]);

          return NextResponse.json({ 
            success: true, 
            message: 'Challenge created successfully' 
          });
        } finally {
          client4.release();
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing league health request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, leagueId, userId, resolution } = body;

    if (!alertId || !leagueId) {
      return NextResponse.json(
        { error: 'Alert ID and League ID are required' },
        { status: 400 }
      );
    }

    // Verify commissioner access
    const { data: league } = await supabase
      .from('leagues')
      .select('commissioner_id')
      .eq('id', leagueId)
      .single();

    if (league?.commissioner_id !== userId) {
      return NextResponse.json(
        { error: 'Commissioner access required' },
        { status: 403 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE league_health_alerts 
        SET 
          resolved = true, 
          resolved_by = $1, 
          resolved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2 AND league_id = $3
      `, [userId, alertId, leagueId]);

      // Optionally log the resolution
      if (resolution) {
        await client.query(`
          INSERT INTO user_activity_log (
            user_id, league_id, action_type, details
          ) VALUES ($1, $2, 'alert_resolution', $3)
        `, [
          userId,
          leagueId,
          JSON.stringify({ alertId, resolution })
        ]);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Alert resolved successfully' 
      });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const initiativeId = searchParams.get('initiativeId');
    const userId = searchParams.get('userId');

    if (!leagueId || !initiativeId) {
      return NextResponse.json(
        { error: 'League ID and Initiative ID are required' },
        { status: 400 }
      );
    }

    // Verify commissioner access
    const { data: league } = await supabase
      .from('leagues')
      .select('commissioner_id')
      .eq('id', leagueId)
      .single();

    if (league?.commissioner_id !== userId) {
      return NextResponse.json(
        { error: 'Commissioner access required' },
        { status: 403 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE league_initiatives 
        SET active = false, end_date = NOW()
        WHERE id = $1 AND league_id = $2
      `, [initiativeId, leagueId]);

      return NextResponse.json({ 
        success: true, 
        message: 'Initiative deactivated successfully' 
      });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deactivating initiative:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate initiative' },
      { status: 500 }
    );
  }
}