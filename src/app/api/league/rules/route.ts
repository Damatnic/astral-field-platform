import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { AutomatedRuleEnforcementService } from '@/services/league/automatedRuleEnforcement';
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
const ruleEnforcement = new AutomatedRuleEnforcementService(
  pool,
  wsManager,
  aiRouter,
  behaviorAnalysis
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const action = searchParams.get('action') || 'summary';
    const userId = searchParams.get('userId');

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to league
    const { data: league } = await supabase
      .from('leagues')
      .select('commissioner_id')
      .eq('id', leagueId)
      .single();

    const { data: userTeam } = await supabase
      .from('teams')
      .select('id, user_id')
      .eq('league_id', leagueId)
      .eq('user_id', userId)
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
      case 'summary':
        const summary = await ruleEnforcement.getRuleViolationSummary(leagueId);
        
        // Filter sensitive data for non-commissioners
        if (!isCommissioner) {
          summary.violations = summary.violations.filter(v => 
            v.teamId === userTeam?.id || v.severity !== 'minor'
          );
        }

        return NextResponse.json(summary);

      case 'rules':
        const client = await pool.connect();
        try {
          const { rows: rules } = await client.query(`
            SELECT * FROM league_rules 
            WHERE league_id = $1 
            ORDER BY rule_type
          `, [leagueId]);

          return NextResponse.json({ rules });
        } finally {
          client.release();
        }

      case 'violations':
        const days = parseInt(searchParams.get('days') || '30');
        const client2 = await pool.connect();
        try {
          let query = `
            SELECT rv.*, t.team_name, u.email as user_email
            FROM rule_violations rv
            JOIN teams t ON rv.team_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE rv.league_id = $1 
              AND rv.detected_at >= NOW() - INTERVAL '${days} days'
          `;

          let params = [leagueId];

          // Non-commissioners can only see their own violations or public ones
          if (!isCommissioner && userTeam) {
            query += ' AND (rv.team_id = $2 OR rv.severity IN (\'major\', \'critical\'))';
            params.push(userTeam.id);
          }

          query += ' ORDER BY rv.detected_at DESC';

          const { rows: violations } = await client2.query(query, params);

          return NextResponse.json({ violations });
        } finally {
          client2.release();
        }

      case 'templates':
        const client3 = await pool.connect();
        try {
          const { rows: templates } = await client3.query(`
            SELECT * FROM league_rule_templates 
            ORDER BY league_type, template_name
          `);

          return NextResponse.json({ templates });
        } finally {
          client3.release();
        }

      case 'compliance':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const client4 = await pool.connect();
        try {
          const { rows: compliance } = await client4.query(
            'SELECT * FROM generate_enforcement_summary($1, $2)',
            [leagueId, parseInt(searchParams.get('days') || '30')]
          );

          // Get league compliance overview
          const { rows: overview } = await client4.query(`
            SELECT * FROM league_compliance_overview 
            WHERE league_id = $1
          `, [leagueId]);

          return NextResponse.json({ 
            compliance,
            overview: overview[0] || {}
          });
        } finally {
          client4.release();
        }

      case 'collusion':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const client5 = await pool.connect();
        try {
          const { rows: collusionPatterns } = await client5.query(
            'SELECT * FROM detect_collusion_patterns($1)',
            [leagueId]
          );

          return NextResponse.json({ collusionPatterns });
        } finally {
          client5.release();
        }

      case 'fairness':
        const tradeId = searchParams.get('tradeId');
        if (!tradeId) {
          return NextResponse.json(
            { error: 'Trade ID is required for fairness analysis' },
            { status: 400 }
          );
        }

        const client6 = await pool.connect();
        try {
          const { rows: fairnessScore } = await client6.query(
            'SELECT calculate_trade_fairness_score($1) as fairness_score',
            [tradeId]
          );

          return NextResponse.json({ 
            fairnessScore: fairnessScore[0]?.fairness_score || 0 
          });
        } finally {
          client6.release();
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error fetching rule data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rule data' },
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
      case 'start-enforcement':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        await ruleEnforcement.startRuleEnforcement(leagueId);
        return NextResponse.json({ 
          success: true, 
          message: 'Rule enforcement started' 
        });

      case 'stop-enforcement':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        await ruleEnforcement.stopRuleEnforcement(leagueId);
        return NextResponse.json({ 
          success: true, 
          message: 'Rule enforcement stopped' 
        });

      case 'create-rule':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const ruleId = await ruleEnforcement.createCustomRule(leagueId, {
          ruleType: data.ruleType,
          config: data.config,
          enforcementLevel: data.enforcementLevel,
          automated: data.automated,
          customLogic: data.customLogic
        });

        return NextResponse.json({ 
          success: true, 
          ruleId,
          message: 'Rule created successfully' 
        });

      case 'update-rule':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { ruleId: updateRuleId, ...ruleUpdates } = data;
        
        const client = await pool.connect();
        try {
          await client.query(`
            UPDATE league_rules 
            SET 
              config = COALESCE($1, config),
              enforcement_level = COALESCE($2, enforcement_level),
              automated = COALESCE($3, automated),
              active = COALESCE($4, active),
              custom_logic = COALESCE($5, custom_logic),
              updated_at = NOW()
            WHERE id = $6 AND league_id = $7
          `, [
            ruleUpdates.config ? JSON.stringify(ruleUpdates.config) : null,
            ruleUpdates.enforcementLevel,
            ruleUpdates.automated,
            ruleUpdates.active,
            ruleUpdates.customLogic,
            updateRuleId,
            leagueId
          ]);

          return NextResponse.json({ 
            success: true, 
            message: 'Rule updated successfully' 
          });
        } finally {
          client.release();
        }

      case 'apply-template':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { templateName, leagueType } = data;
        
        const client2 = await pool.connect();
        try {
          // Get template configuration
          const { rows: template } = await client2.query(`
            SELECT rules_config FROM league_rule_templates 
            WHERE template_name = $1 AND league_type = $2
          `, [templateName, leagueType || 'standard']);

          if (template.length === 0) {
            return NextResponse.json(
              { error: 'Template not found' },
              { status: 404 }
            );
          }

          const rulesConfig = template[0].rules_config;

          // Apply each rule from template
          for (const [ruleType, ruleConfig] of Object.entries(rulesConfig)) {
            await client2.query(`
              INSERT INTO league_rules (
                league_id, rule_type, config, enforcement_level, automated, active
              ) VALUES ($1, $2, $3, $4, $5, true)
              ON CONFLICT (league_id, rule_type) 
              DO UPDATE SET
                config = EXCLUDED.config,
                enforcement_level = EXCLUDED.enforcement_level,
                automated = EXCLUDED.automated,
                updated_at = NOW()
            `, [
              leagueId,
              ruleType,
              JSON.stringify((ruleConfig as any).config || {}),
              (ruleConfig as any).enforcement_level || 'warning',
              (ruleConfig as any).automated || false
            ]);
          }

          return NextResponse.json({ 
            success: true, 
            message: `Applied ${templateName} rule template` 
          });
        } finally {
          client2.release();
        }

      case 'manual-scan':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const violations = await ruleEnforcement.performRuleEnforcementScan(leagueId);
        return NextResponse.json({ 
          success: true, 
          violations,
          message: `Manual scan completed. Found ${violations.length} violations.` 
        });

      case 'resolve-violation':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { violationId, resolution } = data;
        
        const client3 = await pool.connect();
        try {
          await client3.query(`
            UPDATE rule_violations 
            SET 
              auto_resolved = false,
              resolved_at = NOW(),
              resolved_by = $1,
              resolution = $2
            WHERE id = $3 AND league_id = $4
          `, [userId, resolution, violationId, leagueId]);

          return NextResponse.json({ 
            success: true, 
            message: 'Violation resolved successfully' 
          });
        } finally {
          client3.release();
        }

      case 'resolve-conflict':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { conflictId, conflictResolution } = data;
        await ruleEnforcement.resolveConflict(conflictId, conflictResolution, userId);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Conflict resolved successfully' 
        });

      case 'auto-resolve':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { violationId: autoViolationId } = data;
        
        const client4 = await pool.connect();
        try {
          const { rows: result } = await client4.query(
            'SELECT auto_resolve_violation($1) as resolved',
            [autoViolationId]
          );

          const resolved = result[0]?.resolved || false;

          return NextResponse.json({ 
            success: resolved,
            message: resolved ? 'Violation auto-resolved' : 'Auto-resolution not possible'
          });
        } finally {
          client4.release();
        }

      case 'create-penalty':
        if (!isCommissioner) {
          return NextResponse.json(
            { error: 'Commissioner access required' },
            { status: 403 }
          );
        }

        const { teamId, week, points, reason } = data;
        
        const client5 = await pool.connect();
        try {
          await client5.query(`
            INSERT INTO score_adjustments (
              team_id, week, adjustment_points, reason, applied_by
            ) VALUES ($1, $2, $3, $4, $5)
          `, [teamId, week, points, reason, 'commissioner']);

          return NextResponse.json({ 
            success: true, 
            message: 'Penalty applied successfully' 
          });
        } finally {
          client5.release();
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing rule request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');
    const ruleId = searchParams.get('ruleId');
    const userId = searchParams.get('userId');

    if (!leagueId || !ruleId) {
      return NextResponse.json(
        { error: 'League ID and Rule ID are required' },
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
        UPDATE league_rules 
        SET active = false, updated_at = NOW()
        WHERE id = $1 AND league_id = $2
      `, [ruleId, leagueId]);

      return NextResponse.json({ 
        success: true, 
        message: 'Rule deactivated successfully' 
      });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deactivating rule:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate rule' },
      { status: 500 }
    );
  }
}