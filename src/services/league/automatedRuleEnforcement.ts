// @ts-nocheck
import { Pool } from 'pg';
import { WebSocketManager } from '../websocket/manager';
import { AIRouterService } from '../ai/router';
import { UserBehaviorAnalysisService } from '../ai/userBehaviorAnalysis';

interface RuleViolation {
  id: string;
  leagueId: string;
  teamId: string;
  violationType: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  context: any;
  detectedAt: Date;
  autoResolved: boolean;
  resolution?: string;
  penaltyApplied?: any;
}

interface LeagueRule {
  id: string;
  leagueId: string;
  ruleType: string;
  config: any;
  active: boolean;
  automated: boolean;
  enforcementLevel: 'warning' | 'penalty' | 'automatic';
  customLogic?: string;
}

interface ConflictResolution {
  id: string;
  conflictType: string;
  parties: string[];
  context: any;
  status: 'pending' | 'mediation' | 'resolved' | 'escalated';
  aiSuggestion?: string;
  resolution?: string;
  resolvedBy?: string;
}

interface RuleEnforcementAction {
  type: 'warning' | 'penalty' | 'correction' | 'escalation';
  target: string;
  reason: string;
  automaticAction?: any;
  requiresReview: boolean;
}

export class AutomatedRuleEnforcementService {
  private pool: Pool;
  private wsManager: WebSocketManager;
  private aiRouter: AIRouterService;
  private behaviorAnalysis: UserBehaviorAnalysisService;
  private enforcementIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    pool: Pool,
    wsManager: WebSocketManager,
    aiRouter: AIRouterService,
    behaviorAnalysis: UserBehaviorAnalysisService
  ) {
    this.pool = pool;
    this.wsManager = wsManager;
    this.aiRouter = aiRouter;
    this.behaviorAnalysis = behaviorAnalysis;
  }

  async startRuleEnforcement(leagueId: string): Promise<void> {
    // Stop any existing enforcement
    await this.stopRuleEnforcement(leagueId);

    // Start automated rule monitoring
    const interval = setInterval(async () => {
      await this.performRuleEnforcementScan(leagueId);
    }, 60000); // Every minute

    this.enforcementIntervals.set(leagueId, interval);

    // Perform initial comprehensive scan
    await this.performComprehensiveRuleScan(leagueId);
  }

  async stopRuleEnforcement(leagueId: string): Promise<void> {
    const interval = this.enforcementIntervals.get(leagueId);
    if (interval) {
      clearInterval(interval);
      this.enforcementIntervals.delete(leagueId);
    }
  }

  async performRuleEnforcementScan(leagueId: string): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = [];

    try {
      // Get active rules for the league
      const activeRules = await this.getActiveRules(leagueId);

      // Run enforcement checks for each rule type
      for (const rule of activeRules) {
        const ruleViolations = await this.checkRuleCompliance(rule);
        violations.push(...ruleViolations);
      }

      // Process violations
      for (const violation of violations) {
        await this.processViolation(violation);
      }

      return violations;
    } catch (error) {
      console.error('Error in rule enforcement scan:', error);
      return violations;
    }
  }

  async performComprehensiveRuleScan(leagueId: string): Promise<{
    violations: RuleViolation[];
    conflicts: ConflictResolution[];
    recommendations: string[];
  }> {
    const [violations, conflicts] = await Promise.all([
      this.performRuleEnforcementScan(leagueId),
      this.detectConflicts(leagueId)
    ]);

    const recommendations = await this.generateEnforcementRecommendations(
      leagueId,
      violations,
      conflicts
    );

    return { violations, conflicts, recommendations };
  }

  private async getActiveRules(leagueId: string): Promise<LeagueRule[]> {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT * FROM league_rules 
        WHERE league_id = $1 AND active = true
        ORDER BY enforcement_level DESC, rule_type
      `, [leagueId]);

      return rows;
    } finally {
      client.release();
    }
  }

  private async checkRuleCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = [];

    switch (rule.ruleType) {
      case 'lineup_deadline':
        violations.push(...await this.checkLineupDeadlineCompliance(rule));
        break;
      
      case 'roster_limits':
        violations.push(...await this.checkRosterLimitCompliance(rule));
        break;
      
      case 'trade_deadline':
        violations.push(...await this.checkTradeDeadlineCompliance(rule));
        break;
      
      case 'waiver_budget':
        violations.push(...await this.checkWaiverBudgetCompliance(rule));
        break;
      
      case 'starting_lineup':
        violations.push(...await this.checkStartingLineupCompliance(rule));
        break;
      
      case 'add_drop_limits':
        violations.push(...await this.checkAddDropLimitCompliance(rule));
        break;
      
      case 'trade_review':
        violations.push(...await this.checkTradeReviewCompliance(rule));
        break;
      
      case 'collusion_detection':
        violations.push(...await this.checkCollusionCompliance(rule));
        break;
      
      case 'inactive_manager':
        violations.push(...await this.checkInactiveManagerCompliance(rule));
        break;
      
      case 'custom_rule':
        violations.push(...await this.checkCustomRuleCompliance(rule));
        break;
    }

    return violations;
  }

  private async checkLineupDeadlineCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    const client = await this.pool.connect();
    try {
      const { rows: violations } = await client.query(`
        WITH current_week AS (
          SELECT current_week FROM leagues WHERE id = $1
        ),
        incomplete_lineups AS (
          SELECT 
            t.id as team_id,
            t.team_name,
            t.user_id,
            COUNT(ls.id) as filled_slots,
            (SELECT COUNT(*) FROM lineup_slots WHERE team_id = t.id AND week = cw.current_week AND required = true) as required_slots
          FROM teams t
          CROSS JOIN current_week cw
          LEFT JOIN lineup_slots ls ON t.id = ls.team_id 
            AND ls.week = cw.current_week 
            AND ls.player_id IS NOT NULL
          WHERE t.league_id = $1 AND t.active = true
          GROUP BY t.id, t.team_name, t.user_id, cw.current_week
          HAVING COUNT(ls.id) < (
            SELECT COUNT(*) 
            FROM lineup_slots 
            WHERE team_id = t.id 
              AND week = cw.current_week 
              AND required = true
          )
        )
        SELECT 
          il.*,
          EXTRACT(HOURS FROM (NOW() - $2::timestamptz)) as hours_past_deadline
        FROM incomplete_lineups il
        WHERE NOW() > $2::timestamptz
      `, [
        rule.leagueId, 
        rule.config.deadline || new Date()
      ]);

      return violations.map(v => ({
        id: `lineup_deadline_${v.team_id}_${Date.now()}`,
        leagueId: rule.leagueId,
        teamId: v.team_id,
        violationType: 'lineup_deadline',
        severity: v.hours_past_deadline > 24 ? 'major' : 'minor',
        description: `Team ${v.team_name} failed to set complete lineup by deadline (${v.hours_past_deadline} hours late)`,
        context: {
          filledSlots: v.filled_slots,
          requiredSlots: v.required_slots,
          hoursPastDeadline: v.hours_past_deadline,
          deadline: rule.config.deadline
        },
        detectedAt: new Date(),
        autoResolved: false
      }));
    } finally {
      client.release();
    }
  }

  private async checkRosterLimitCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    const client = await this.pool.connect();
    try {
      const { rows: violations } = await client.query(`
        WITH position_counts AS (
          SELECT 
            t.id as team_id,
            t.team_name,
            p.position,
            COUNT(*) as player_count
          FROM teams t
          JOIN roster_players rp ON t.id = rp.team_id
          JOIN players p ON rp.player_id = p.id
          WHERE t.league_id = $1 AND t.active = true
          GROUP BY t.id, t.team_name, p.position
        ),
        violations AS (
          SELECT 
            pc.*,
            CASE 
              WHEN pc.position = 'QB' AND pc.player_count > $2 THEN 'QB limit exceeded'
              WHEN pc.position = 'RB' AND pc.player_count > $3 THEN 'RB limit exceeded'
              WHEN pc.position = 'WR' AND pc.player_count > $4 THEN 'WR limit exceeded'
              WHEN pc.position = 'TE' AND pc.player_count > $5 THEN 'TE limit exceeded'
              WHEN pc.position = 'K' AND pc.player_count > $6 THEN 'K limit exceeded'
              WHEN pc.position = 'DST' AND pc.player_count > $7 THEN 'DST limit exceeded'
            END as violation_type
          FROM position_counts pc
          WHERE (
            (pc.position = 'QB' AND pc.player_count > $2) OR
            (pc.position = 'RB' AND pc.player_count > $3) OR
            (pc.position = 'WR' AND pc.player_count > $4) OR
            (pc.position = 'TE' AND pc.player_count > $5) OR
            (pc.position = 'K' AND pc.player_count > $6) OR
            (pc.position = 'DST' AND pc.player_count > $7)
          )
        )
        SELECT * FROM violations
      `, [
        rule.leagueId,
        rule.config.limits?.QB || 999,
        rule.config.limits?.RB || 999,
        rule.config.limits?.WR || 999,
        rule.config.limits?.TE || 999,
        rule.config.limits?.K || 999,
        rule.config.limits?.DST || 999
      ]);

      return violations.map(v => ({
        id: `roster_limit_${v.team_id}_${v.position}_${Date.now()}`,
        leagueId: rule.leagueId,
        teamId: v.team_id,
        violationType: 'roster_limits',
        severity: 'major' as const,
        description: `Team ${v.team_name} has ${v.player_count} ${v.position} players (limit: ${rule.config.limits?.[v.position]})`,
        context: {
          position: v.position,
          currentCount: v.player_count,
          limit: rule.config.limits?.[v.position],
          violationType: v.violation_type
        },
        detectedAt: new Date(),
        autoResolved: false
      }));
    } finally {
      client.release();
    }
  }

  private async checkTradeDeadlineCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    const client = await this.pool.connect();
    try {
      const { rows: violations } = await client.query(`
        SELECT 
          t.id,
          t.proposing_team_id,
          t.receiving_team_id,
          t.created_at,
          pt.team_name as proposing_team_name,
          rt.team_name as receiving_team_name
        FROM trades t
        JOIN teams pt ON t.proposing_team_id = pt.id
        JOIN teams rt ON t.receiving_team_id = rt.id
        WHERE t.league_id = $1 
          AND t.status = 'pending'
          AND t.created_at > $2::timestamptz
          AND NOW() > $2::timestamptz
      `, [rule.leagueId, rule.config.deadline]);

      return violations.map(v => ({
        id: `trade_deadline_${v.id}`,
        leagueId: rule.leagueId,
        teamId: v.proposing_team_id,
        violationType: 'trade_deadline',
        severity: 'major' as const,
        description: `Trade proposed by ${v.proposing_team_name} to ${v.receiving_team_name} after trade deadline`,
        context: {
          tradeId: v.id,
          proposingTeam: v.proposing_team_name,
          receivingTeam: v.receiving_team_name,
          deadline: rule.config.deadline,
          proposedAt: v.created_at
        },
        detectedAt: new Date(),
        autoResolved: false
      }));
    } finally {
      client.release();
    }
  }

  private async checkWaiverBudgetCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    const client = await this.pool.connect();
    try {
      const { rows: violations } = await client.query(`
        WITH budget_check AS (
          SELECT 
            t.id as team_id,
            t.team_name,
            wb.current_budget,
            wb.total_spent,
            wc.bid_amount,
            wc.id as claim_id
          FROM teams t
          JOIN waiver_budgets wb ON t.id = wb.team_id
          JOIN waiver_claims wc ON t.id = wc.team_id
          WHERE t.league_id = $1 
            AND wc.status = 'pending'
            AND wc.bid_amount > wb.current_budget
        )
        SELECT * FROM budget_check
      `, [rule.leagueId]);

      return violations.map(v => ({
        id: `waiver_budget_${v.claim_id}`,
        leagueId: rule.leagueId,
        teamId: v.team_id,
        violationType: 'waiver_budget',
        severity: 'major' as const,
        description: `Team ${v.team_name} bid $${v.bid_amount} with only $${v.current_budget} remaining`,
        context: {
          claimId: v.claim_id,
          bidAmount: v.bid_amount,
          currentBudget: v.current_budget,
          totalSpent: v.total_spent
        },
        detectedAt: new Date(),
        autoResolved: false
      }));
    } finally {
      client.release();
    }
  }

  private async checkStartingLineupCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    const client = await this.pool.connect();
    try {
      const { rows: violations } = await client.query(`
        WITH lineup_issues AS (
          SELECT 
            t.id as team_id,
            t.team_name,
            ls.position_type,
            ls.player_id,
            p.injury_status,
            p.team as player_team,
            CASE 
              WHEN p.injury_status IN ('out', 'suspended', 'inactive') THEN 'injured_player_started'
              WHEN ls.player_id IS NULL THEN 'empty_lineup_slot'
              WHEN p.bye_week = (SELECT current_week FROM leagues WHERE id = $1) THEN 'bye_week_player_started'
            END as issue_type
          FROM teams t
          JOIN lineup_slots ls ON t.id = ls.team_id
          LEFT JOIN players p ON ls.player_id = p.id
          WHERE t.league_id = $1 
            AND t.active = true
            AND ls.week = (SELECT current_week FROM leagues WHERE id = $1)
            AND (
              p.injury_status IN ('out', 'suspended', 'inactive') OR
              ls.player_id IS NULL OR
              p.bye_week = (SELECT current_week FROM leagues WHERE id = $1)
            )
        )
        SELECT * FROM lineup_issues
      `, [rule.leagueId]);

      return violations.map(v => ({
        id: `lineup_${v.team_id}_${v.position_type}_${Date.now()}`,
        leagueId: rule.leagueId,
        teamId: v.team_id,
        violationType: 'starting_lineup',
        severity: v.issue_type === 'injured_player_started' ? 'major' : 'minor',
        description: `Team ${v.team_name} has lineup issue: ${v.issue_type} at ${v.position_type}`,
        context: {
          positionType: v.position_type,
          playerId: v.player_id,
          injuryStatus: v.injury_status,
          playerTeam: v.player_team,
          issueType: v.issue_type
        },
        detectedAt: new Date(),
        autoResolved: false
      }));
    } finally {
      client.release();
    }
  }

  private async checkAddDropLimitCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    const client = await this.pool.connect();
    try {
      const { rows: violations } = await client.query(`
        WITH weekly_transactions AS (
          SELECT 
            t.id as team_id,
            t.team_name,
            COUNT(*) as transaction_count
          FROM teams t
          JOIN waiver_claims wc ON t.id = wc.team_id
          WHERE t.league_id = $1 
            AND wc.created_at >= DATE_TRUNC('week', NOW())
            AND wc.status = 'successful'
          GROUP BY t.id, t.team_name
          HAVING COUNT(*) > $2
        )
        SELECT * FROM weekly_transactions
      `, [rule.leagueId, rule.config.weeklyLimit || 999]);

      return violations.map(v => ({
        id: `add_drop_limit_${v.team_id}_${Date.now()}`,
        leagueId: rule.leagueId,
        teamId: v.team_id,
        violationType: 'add_drop_limits',
        severity: 'minor' as const,
        description: `Team ${v.team_name} exceeded weekly add/drop limit (${v.transaction_count}/${rule.config.weeklyLimit})`,
        context: {
          transactionCount: v.transaction_count,
          weeklyLimit: rule.config.weeklyLimit
        },
        detectedAt: new Date(),
        autoResolved: false
      }));
    } finally {
      client.release();
    }
  }

  private async checkTradeReviewCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    const client = await this.pool.connect();
    try {
      const { rows: violations } = await client.query(`
        SELECT 
          t.id,
          t.proposing_team_id,
          t.receiving_team_id,
          t.created_at,
          pt.team_name as proposing_team_name,
          rt.team_name as receiving_team_name,
          EXTRACT(HOURS FROM (NOW() - t.created_at)) as hours_pending
        FROM trades t
        JOIN teams pt ON t.proposing_team_id = pt.id
        JOIN teams rt ON t.receiving_team_id = rt.id
        WHERE t.league_id = $1 
          AND t.status = 'pending'
          AND EXTRACT(HOURS FROM (NOW() - t.created_at)) > $2
      `, [rule.leagueId, rule.config.reviewPeriodHours || 48]);

      return violations.map(v => ({
        id: `trade_review_${v.id}`,
        leagueId: rule.leagueId,
        teamId: v.proposing_team_id,
        violationType: 'trade_review',
        severity: 'minor' as const,
        description: `Trade between ${v.proposing_team_name} and ${v.receiving_team_name} has been pending for ${Math.floor(v.hours_pending)} hours`,
        context: {
          tradeId: v.id,
          proposingTeam: v.proposing_team_name,
          receivingTeam: v.receiving_team_name,
          hoursPending: v.hours_pending,
          reviewPeriod: rule.config.reviewPeriodHours
        },
        detectedAt: new Date(),
        autoResolved: false
      }));
    } finally {
      client.release();
    }
  }

  private async checkCollusionCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    // AI-powered collusion detection
    const collusionSuspicion = await this.detectPotentialCollusion(rule.leagueId);
    
    return collusionSuspicion.map(suspicion => ({
      id: `collusion_${suspicion.teamIds.join('_')}_${Date.now()}`,
      leagueId: rule.leagueId,
      teamId: suspicion.teamIds[0],
      violationType: 'collusion_detection',
      severity: suspicion.confidenceScore > 0.8 ? 'critical' : 'major',
      description: `Potential collusion detected between teams: ${suspicion.teamNames.join(', ')}`,
      context: {
        teamIds: suspicion.teamIds,
        teamNames: suspicion.teamNames,
        confidenceScore: suspicion.confidenceScore,
        evidence: suspicion.evidence,
        suspiciousPatterns: suspicion.patterns
      },
      detectedAt: new Date(),
      autoResolved: false
    }));
  }

  private async checkInactiveManagerCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    const client = await this.pool.connect();
    try {
      const { rows: violations } = await client.query(`
        WITH inactive_managers AS (
          SELECT 
            t.id as team_id,
            t.team_name,
            t.user_id,
            MAX(ual.created_at) as last_activity,
            EXTRACT(DAYS FROM (NOW() - MAX(ual.created_at))) as days_inactive
          FROM teams t
          LEFT JOIN user_activity_log ual ON t.user_id = ual.user_id 
            AND ual.league_id = t.league_id
          WHERE t.league_id = $1 AND t.active = true
          GROUP BY t.id, t.team_name, t.user_id
          HAVING MAX(ual.created_at) IS NULL 
            OR EXTRACT(DAYS FROM (NOW() - MAX(ual.created_at))) > $2
        )
        SELECT * FROM inactive_managers
      `, [rule.leagueId, rule.config.inactiveDays || 14]);

      return violations.map(v => ({
        id: `inactive_manager_${v.team_id}_${Date.now()}`,
        leagueId: rule.leagueId,
        teamId: v.team_id,
        violationType: 'inactive_manager',
        severity: v.days_inactive > 30 ? 'critical' : v.days_inactive > 21 ? 'major' : 'minor',
        description: `Team ${v.team_name} manager has been inactive for ${v.days_inactive || 'unknown'} days`,
        context: {
          userId: v.user_id,
          lastActivity: v.last_activity,
          daysInactive: v.days_inactive,
          threshold: rule.config.inactiveDays
        },
        detectedAt: new Date(),
        autoResolved: false
      }));
    } finally {
      client.release();
    }
  }

  private async checkCustomRuleCompliance(rule: LeagueRule): Promise<RuleViolation[]> {
    // This would execute custom rule logic defined by commissioners
    if (!rule.customLogic) return [];

    try {
      // Parse and execute custom rule logic safely
      const customLogic = JSON.parse(rule.customLogic);
      
      // For security, this would use a sandboxed execution environment
      // For now, we'll return empty array
      console.log('Custom rule logic not implemented yet:', customLogic);
      
      return [];
    } catch (error) {
      console.error('Error executing custom rule logic:', error);
      return [];
    }
  }

  private async detectPotentialCollusion(leagueId: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      // Analyze trading patterns for suspicious behavior
      const { rows: tradingPatterns } = await client.query(`
        WITH trade_analysis AS (
          SELECT 
            t.proposing_team_id,
            t.receiving_team_id,
            pt.team_name as proposing_team_name,
            rt.team_name as receiving_team_name,
            COUNT(*) as trade_count,
            AVG(tp.relative_value) as avg_fairness,
            STRING_AGG(DISTINCT p1.position, ',') as positions_given,
            STRING_AGG(DISTINCT p2.position, ',') as positions_received
          FROM trades t
          JOIN teams pt ON t.proposing_team_id = pt.id
          JOIN teams rt ON t.receiving_team_id = rt.id
          LEFT JOIN trade_players tp ON t.id = tp.trade_id
          LEFT JOIN players p1 ON tp.player_id = p1.id AND tp.team_id = t.proposing_team_id
          LEFT JOIN players p2 ON tp.player_id = p2.id AND tp.team_id = t.receiving_team_id
          WHERE t.league_id = $1 
            AND t.status = 'completed'
            AND t.created_at >= NOW() - INTERVAL '60 days'
          GROUP BY t.proposing_team_id, t.receiving_team_id, pt.team_name, rt.team_name
          HAVING COUNT(*) >= 3 -- Multiple trades between same teams
        )
        SELECT 
          *,
          CASE 
            WHEN trade_count >= 5 THEN 0.8
            WHEN trade_count >= 4 THEN 0.6
            WHEN trade_count >= 3 AND avg_fairness < 0.3 THEN 0.7
            ELSE 0.3
          END as suspicion_score
        FROM trade_analysis
        WHERE trade_count >= 3
        ORDER BY suspicion_score DESC
      `, [leagueId]);

      return tradingPatterns.map(pattern => ({
        teamIds: [pattern.proposing_team_id, pattern.receiving_team_id],
        teamNames: [pattern.proposing_team_name, pattern.receiving_team_name],
        confidenceScore: pattern.suspicion_score,
        evidence: {
          tradeCount: pattern.trade_count,
          averageFairness: pattern.avg_fairness,
          timeframe: '60 days'
        },
        patterns: [
          `${pattern.trade_count} trades between teams`,
          `Average trade fairness: ${Math.round(pattern.avg_fairness * 100)}%`
        ]
      }));
    } finally {
      client.release();
    }
  }

  private async processViolation(violation: RuleViolation): Promise<void> {
    // Store violation in database
    await this.storeViolation(violation);

    // Determine enforcement action
    const action = await this.determineEnforcementAction(violation);

    // Execute enforcement action
    await this.executeEnforcementAction(violation, action);

    // Notify relevant parties
    await this.notifyViolation(violation, action);
  }

  private async storeViolation(violation: RuleViolation): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO rule_violations (
          id, league_id, team_id, violation_type, severity, description,
          context, detected_at, auto_resolved, resolution, penalty_applied
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        violation.id,
        violation.leagueId,
        violation.teamId,
        violation.violationType,
        violation.severity,
        violation.description,
        JSON.stringify(violation.context),
        violation.detectedAt,
        violation.autoResolved,
        violation.resolution,
        JSON.stringify(violation.penaltyApplied)
      ]);
    } finally {
      client.release();
    }
  }

  private async determineEnforcementAction(violation: RuleViolation): Promise<RuleEnforcementAction> {
    // Get rule configuration
    const client = await this.pool.connect();
    let rule: LeagueRule;
    
    try {
      const { rows } = await client.query(`
        SELECT * FROM league_rules 
        WHERE league_id = $1 AND rule_type = $2 AND active = true
      `, [violation.leagueId, violation.violationType]);
      
      rule = rows[0];
    } finally {
      client.release();
    }

    if (!rule) {
      return {
        type: 'warning',
        target: violation.teamId,
        reason: 'Rule not found, issuing warning',
        requiresReview: true
      };
    }

    // AI-powered enforcement decision
    const aiSuggestion = await this.getAIEnforcementSuggestion(violation, rule);

    switch (rule.enforcementLevel) {
      case 'warning':
        return {
          type: 'warning',
          target: violation.teamId,
          reason: violation.description,
          requiresReview: false
        };

      case 'penalty':
        return {
          type: 'penalty',
          target: violation.teamId,
          reason: violation.description,
          automaticAction: this.determinePenalty(violation, rule),
          requiresReview: violation.severity === 'critical'
        };

      case 'automatic':
        return {
          type: 'correction',
          target: violation.teamId,
          reason: violation.description,
          automaticAction: this.determineAutoCorrection(violation, rule),
          requiresReview: false
        };

      default:
        return {
          type: 'escalation',
          target: violation.teamId,
          reason: `Complex violation requiring manual review: ${violation.description}`,
          requiresReview: true
        };
    }
  }

  private async getAIEnforcementSuggestion(
    violation: RuleViolation, 
    rule: LeagueRule
  ): Promise<string> {
    const response = await this.aiRouter.query({
      messages: [{
        role: 'user',
        content: `Analyze this fantasy football rule violation and suggest appropriate enforcement action:

Violation: ${violation.description}
Severity: ${violation.severity}
Rule Type: ${violation.violationType}
Enforcement Level: ${rule.enforcementLevel}
Context: ${JSON.stringify(violation.context)}

Consider:
1. Impact on competitive balance
2. Intent vs. accident
3. Repeat offense patterns
4. League culture and fairness

Provide a brief, specific enforcement recommendation.`
      }],
      capabilities: ['text_generation'],
      complexity: 'medium',
      priority: 'medium'
    });

    return response.content;
  }

  private determinePenalty(violation: RuleViolation, rule: LeagueRule): any {
    const penalties = rule.config.penalties || {};

    switch (violation.violationType) {
      case 'lineup_deadline':
        return {
          type: 'score_penalty',
          points: penalties.lineupDeadline || -5,
          reason: 'Late lineup submission penalty'
        };

      case 'roster_limits':
        return {
          type: 'forced_drop',
          count: 1,
          reason: 'Roster limit violation - must drop player'
        };

      case 'waiver_budget':
        return {
          type: 'claim_rejection',
          reason: 'Insufficient waiver budget'
        };

      case 'add_drop_limits':
        return {
          type: 'transaction_freeze',
          duration: '24 hours',
          reason: 'Weekly transaction limit exceeded'
        };

      default:
        return {
          type: 'warning',
          reason: 'General rule violation'
        };
    }
  }

  private determineAutoCorrection(violation: RuleViolation, rule: LeagueRule): any {
    switch (violation.violationType) {
      case 'lineup_deadline':
        return {
          type: 'auto_lineup',
          reason: 'Automatically setting optimal lineup'
        };

      case 'roster_limits':
        return {
          type: 'auto_drop',
          reason: 'Automatically dropping lowest-value player'
        };

      case 'waiver_budget':
        return {
          type: 'bid_adjustment',
          newBid: Math.floor((violation.context.currentBudget || 0) * 0.9),
          reason: 'Adjusting bid to available budget'
        };

      default:
        return null;
    }
  }

  private async executeEnforcementAction(
    violation: RuleViolation, 
    action: RuleEnforcementAction
  ): Promise<void> {
    if (!action.automaticAction || action.requiresReview) {
      return; // Manual review required
    }

    switch (action.automaticAction.type) {
      case 'score_penalty':
        await this.applyScorePenalty(
          violation.teamId, 
          action.automaticAction.points,
          action.automaticAction.reason
        );
        break;

      case 'auto_lineup':
        await this.setAutomaticLineup(violation.teamId, violation.leagueId);
        break;

      case 'auto_drop':
        await this.automaticPlayerDrop(violation.teamId);
        break;

      case 'bid_adjustment':
        await this.adjustWaiverBid(
          violation.context.claimId, 
          action.automaticAction.newBid
        );
        break;

      case 'claim_rejection':
        await this.rejectWaiverClaim(violation.context.claimId);
        break;
    }

    // Mark violation as auto-resolved
    await this.updateViolationResolution(violation.id, action);
  }

  private async applyScorePenalty(teamId: string, points: number, reason: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const { rows: currentWeek } = await client.query(
        'SELECT current_week FROM leagues WHERE id = (SELECT league_id FROM teams WHERE id = $1)',
        [teamId]
      );

      await client.query(`
        INSERT INTO score_adjustments (
          team_id, week, adjustment_points, reason, applied_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [teamId, currentWeek[0]?.current_week, points, reason]);
    } finally {
      client.release();
    }
  }

  private async setAutomaticLineup(teamId: string, leagueId: string): Promise<void> {
    // This would integrate with the automated lineup optimizer
    // For now, we'll just log the action
    console.log(`Setting automatic lineup for team ${teamId} in league ${leagueId}`);
  }

  private async automaticPlayerDrop(teamId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Find lowest-value player to drop
      const { rows: playersToDrop } = await client.query(`
        SELECT rp.id, rp.player_id, p.name, p.projected_points
        FROM roster_players rp
        JOIN players p ON rp.player_id = p.id
        WHERE rp.team_id = $1
        ORDER BY p.projected_points ASC, p.adp DESC
        LIMIT 1
      `, [teamId]);

      if (playersToDrop.length > 0) {
        await client.query(
          'DELETE FROM roster_players WHERE id = $1',
          [playersToDrop[0].id]
        );

        // Log the automatic drop
        await client.query(`
          INSERT INTO user_activity_log (
            user_id, league_id, action_type, details
          ) VALUES (
            (SELECT user_id FROM teams WHERE id = $1),
            (SELECT league_id FROM teams WHERE id = $1),
            'automatic_drop',
            $2
          )
        `, [
          teamId,
          JSON.stringify({
            playerId: playersToDrop[0].player_id,
            playerName: playersToDrop[0].name,
            reason: 'Roster limit violation - automatic enforcement'
          })
        ]);
      }
    } finally {
      client.release();
    }
  }

  private async adjustWaiverBid(claimId: string, newBid: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE waiver_claims 
        SET bid_amount = $1, updated_at = NOW()
        WHERE id = $2
      `, [newBid, claimId]);
    } finally {
      client.release();
    }
  }

  private async rejectWaiverClaim(claimId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE waiver_claims 
        SET status = 'failed', failure_reason = 'Insufficient budget'
        WHERE id = $1
      `, [claimId]);
    } finally {
      client.release();
    }
  }

  private async updateViolationResolution(
    violationId: string, 
    action: RuleEnforcementAction
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE rule_violations 
        SET 
          auto_resolved = true, 
          resolution = $1,
          penalty_applied = $2,
          resolved_at = NOW()
        WHERE id = $3
      `, [
        action.reason,
        JSON.stringify(action.automaticAction),
        violationId
      ]);
    } finally {
      client.release();
    }
  }

  private async detectConflicts(leagueId: string): Promise<ConflictResolution[]> {
    const client = await this.pool.connect();
    try {
      // Detect various types of conflicts
      const [tradeDisputes, waiverConflicts, ruleDisagreements] = await Promise.all([
        this.detectTradeDisputes(leagueId),
        this.detectWaiverConflicts(leagueId),
        this.detectRuleDisagreements(leagueId)
      ]);

      return [...tradeDisputes, ...waiverConflicts, ...ruleDisagreements];
    } finally {
      client.release();
    }
  }

  private async detectTradeDisputes(leagueId: string): Promise<ConflictResolution[]> {
    // This would analyze vetoed trades and disputes
    return [];
  }

  private async detectWaiverConflicts(leagueId: string): Promise<ConflictResolution[]> {
    // This would detect waiver processing conflicts
    return [];
  }

  private async detectRuleDisagreements(leagueId: string): Promise<ConflictResolution[]> {
    // This would detect disagreements about rule interpretations
    return [];
  }

  private async notifyViolation(
    violation: RuleViolation, 
    action: RuleEnforcementAction
  ): Promise<void> {
    // Notify team owner
    await this.wsManager.sendToUser(violation.teamId, {
      type: 'rule_violation',
      violation,
      action,
      timestamp: new Date().toISOString()
    });

    // Notify commissioners if review required
    if (action.requiresReview) {
      await this.wsManager.sendToLeague(violation.leagueId, {
        type: 'rule_violation_review',
        violation,
        action,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async generateEnforcementRecommendations(
    leagueId: string,
    violations: RuleViolation[],
    conflicts: ConflictResolution[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze violation patterns
    const violationTypes = violations.reduce((acc, v) => {
      acc[v.violationType] = (acc[v.violationType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate recommendations based on patterns
    Object.entries(violationTypes).forEach(([type, count]) => {
      if (count > 3) {
        recommendations.push(`High frequency of ${type.replace('_', ' ')} violations (${count}). Consider rule clarification or adjustment.`);
      }
    });

    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push(`${criticalViolations.length} critical violations detected. Immediate commissioner attention required.`);
    }

    if (conflicts.length > 0) {
      recommendations.push(`${conflicts.length} ongoing conflicts require resolution to maintain league harmony.`);
    }

    return recommendations;
  }

  // Public API methods
  async getRuleViolationSummary(leagueId: string): Promise<{
    violations: RuleViolation[];
    conflicts: ConflictResolution[];
    recommendations: string[];
  }> {
    const client = await this.pool.connect();
    try {
      const { rows: violations } = await client.query(`
        SELECT * FROM rule_violations 
        WHERE league_id = $1 
          AND detected_at >= NOW() - INTERVAL '30 days'
        ORDER BY detected_at DESC
      `, [leagueId]);

      const { rows: conflicts } = await client.query(`
        SELECT * FROM conflict_resolutions 
        WHERE league_id = $1 
          AND status IN ('pending', 'mediation')
        ORDER BY created_at DESC
      `, [leagueId]);

      const recommendations = await this.generateEnforcementRecommendations(
        leagueId, 
        violations, 
        conflicts
      );

      return { violations, conflicts, recommendations };
    } finally {
      client.release();
    }
  }

  async createCustomRule(leagueId: string, rule: Partial<LeagueRule>): Promise<string> {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query(`
        INSERT INTO league_rules (
          id, league_id, rule_type, config, active, automated, 
          enforcement_level, custom_logic
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        leagueId,
        rule.ruleType,
        JSON.stringify(rule.config || {}),
        rule.active ?? true,
        rule.automated ?? false,
        rule.enforcementLevel || 'warning',
        rule.customLogic
      ]);

      return rows[0].id;
    } finally {
      client.release();
    }
  }

  async resolveConflict(conflictId: string, resolution: string, resolvedBy: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        UPDATE conflict_resolutions 
        SET 
          status = 'resolved',
          resolution = $1,
          resolved_by = $2,
          resolved_at = NOW()
        WHERE id = $3
      `, [resolution, resolvedBy, conflictId]);
    } finally {
      client.release();
    }
  }
}
// @ts-nocheck
