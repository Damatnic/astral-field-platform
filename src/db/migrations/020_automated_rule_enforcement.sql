-- =============================================
-- Automated Rule Enforcement System Migration
-- =============================================

-- League Rules Configuration Table
CREATE TABLE IF NOT EXISTS league_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    automated BOOLEAN NOT NULL DEFAULT false,
    enforcement_level VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (enforcement_level IN ('warning', 'penalty', 'automatic')),
    custom_logic TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate rules
    CONSTRAINT idx_league_rules_unique UNIQUE (league_id, rule_type)
);

-- Indexes for league rules
CREATE INDEX IF NOT EXISTS idx_league_rules_league_id ON league_rules(league_id);
CREATE INDEX IF NOT EXISTS idx_league_rules_active ON league_rules(active, enforcement_level);
CREATE INDEX IF NOT EXISTS idx_league_rules_type ON league_rules(rule_type);

-- Rule Violations Table
CREATE TABLE IF NOT EXISTS rule_violations (
    id VARCHAR(255) PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
    description TEXT NOT NULL,
    context JSONB NOT NULL DEFAULT '{}',
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    auto_resolved BOOLEAN NOT NULL DEFAULT false,
    resolution TEXT NULL,
    penalty_applied JSONB NULL,
    resolved_at TIMESTAMPTZ NULL,
    resolved_by UUID NULL REFERENCES users(id)
);

-- Indexes for rule violations
CREATE INDEX IF NOT EXISTS idx_rule_violations_league_id ON rule_violations(league_id);
CREATE INDEX IF NOT EXISTS idx_rule_violations_team_id ON rule_violations(team_id);
CREATE INDEX IF NOT EXISTS idx_rule_violations_type ON rule_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_rule_violations_severity ON rule_violations(severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_rule_violations_unresolved ON rule_violations(auto_resolved, detected_at) WHERE auto_resolved = false;

-- Conflict Resolution Table
CREATE TABLE IF NOT EXISTS conflict_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL,
    parties JSONB NOT NULL DEFAULT '[]', -- Array of team/user IDs involved
    context JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'mediation', 'resolved', 'escalated')),
    ai_suggestion TEXT NULL,
    resolution TEXT NULL,
    resolved_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL
);

-- Indexes for conflict resolutions
CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_league_id ON conflict_resolutions(league_id);
CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_status ON conflict_resolutions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_type ON conflict_resolutions(conflict_type);

-- Score Adjustments Table (for penalties)
CREATE TABLE IF NOT EXISTS score_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    week INT NOT NULL,
    adjustment_points DECIMAL(6,2) NOT NULL,
    reason TEXT NOT NULL,
    applied_by VARCHAR(20) NOT NULL DEFAULT 'system',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate adjustments
    CONSTRAINT idx_score_adjustments_unique UNIQUE (team_id, week, reason)
);

-- Indexes for score adjustments
CREATE INDEX IF NOT EXISTS idx_score_adjustments_team_week ON score_adjustments(team_id, week);
CREATE INDEX IF NOT EXISTS idx_score_adjustments_applied_at ON score_adjustments(applied_at DESC);

-- Rule Enforcement Actions Table (audit trail)
CREATE TABLE IF NOT EXISTS rule_enforcement_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_id VARCHAR(255) NOT NULL REFERENCES rule_violations(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB NOT NULL DEFAULT '{}',
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_by VARCHAR(20) NOT NULL DEFAULT 'system',
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT NULL
);

-- Indexes for enforcement actions
CREATE INDEX IF NOT EXISTS idx_enforcement_actions_violation_id ON rule_enforcement_actions(violation_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_actions_executed_at ON rule_enforcement_actions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_enforcement_actions_success ON rule_enforcement_actions(success, executed_at);

-- League Rule Templates Table (predefined rule sets)
CREATE TABLE IF NOT EXISTS league_rule_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    rules_config JSONB NOT NULL,
    league_type VARCHAR(20) NOT NULL DEFAULT 'standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint on template name
    CONSTRAINT idx_league_rule_templates_unique UNIQUE (template_name, league_type)
);

-- Indexes for rule templates
CREATE INDEX IF NOT EXISTS idx_rule_templates_league_type ON league_rule_templates(league_type);
CREATE INDEX IF NOT EXISTS idx_rule_templates_name ON league_rule_templates(template_name);

-- Trade Veto Tracking Table (enhanced trade oversight)
CREATE TABLE IF NOT EXISTS trade_veto_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    veto_reason VARCHAR(50) NOT NULL,
    vetoed_by UUID NOT NULL REFERENCES users(id),
    veto_details JSONB DEFAULT '{}',
    ai_fairness_score DECIMAL(5,4) NULL,
    commissioner_review BOOLEAN NOT NULL DEFAULT false,
    vetoed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for trade veto tracking
CREATE INDEX IF NOT EXISTS idx_trade_veto_tracking_trade_id ON trade_veto_tracking(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_veto_tracking_league_id ON trade_veto_tracking(league_id);
CREATE INDEX IF NOT EXISTS idx_trade_veto_tracking_vetoed_at ON trade_veto_tracking(vetoed_at DESC);

-- =============================================
-- Functions and Procedures
-- =============================================

-- Function to check if a team violates roster limits
CREATE OR REPLACE FUNCTION check_roster_limits(p_team_id UUID, p_limits JSONB)
RETURNS TABLE(
    position VARCHAR,
    current_count INT,
    limit_exceeded BOOLEAN,
    excess_count INT
) AS $$
BEGIN
    RETURN QUERY
    WITH position_counts AS (
        SELECT 
            p.position,
            COUNT(*)::INT as current_count,
            COALESCE((p_limits->>p.position)::INT, 999) as position_limit
        FROM roster_players rp
        JOIN players p ON rp.player_id = p.id
        WHERE rp.team_id = p_team_id
        GROUP BY p.position
    )
    SELECT 
        pc.position,
        pc.current_count,
        pc.current_count > pc.position_limit as limit_exceeded,
        GREATEST(0, pc.current_count - pc.position_limit) as excess_count
    FROM position_counts pc
    WHERE pc.current_count > pc.position_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trade fairness score using AI-enhanced metrics
CREATE OR REPLACE FUNCTION calculate_trade_fairness_score(p_trade_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    fairness_score DECIMAL := 0.5;
    proposing_value DECIMAL := 0;
    receiving_value DECIMAL := 0;
    position_balance_factor DECIMAL := 1.0;
    injury_impact_factor DECIMAL := 1.0;
BEGIN
    -- Calculate total value for proposing team's players
    SELECT COALESCE(SUM(p.projected_points * p.adp_weight), 0)
    INTO proposing_value
    FROM trade_players tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.trade_id = p_trade_id 
        AND tp.team_id = (SELECT proposing_team_id FROM trades WHERE id = p_trade_id);

    -- Calculate total value for receiving team's players  
    SELECT COALESCE(SUM(p.projected_points * p.adp_weight), 0)
    INTO receiving_value
    FROM trade_players tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.trade_id = p_trade_id 
        AND tp.team_id = (SELECT receiving_team_id FROM trades WHERE id = p_trade_id);

    -- Avoid division by zero
    IF proposing_value = 0 AND receiving_value = 0 THEN
        RETURN 0.5;
    END IF;

    IF proposing_value + receiving_value = 0 THEN
        RETURN 0.5;
    END IF;

    -- Calculate base fairness (closer to 0.5 = more fair)
    fairness_score := LEAST(proposing_value, receiving_value) / GREATEST(proposing_value, receiving_value);

    -- Apply position balance factor (trading similar positions is more natural)
    WITH position_analysis AS (
        SELECT 
            COUNT(DISTINCT p.position) as unique_positions,
            COUNT(*) as total_players
        FROM trade_players tp
        JOIN players p ON tp.player_id = p.id
        WHERE tp.trade_id = p_trade_id
    )
    SELECT 
        CASE 
            WHEN unique_positions = 1 THEN 1.1  -- Same position trade
            WHEN unique_positions <= 3 THEN 1.0  -- Reasonable position diversity
            ELSE 0.9  -- Many different positions (slightly suspicious)
        END
    INTO position_balance_factor
    FROM position_analysis;

    -- Apply injury impact factor
    WITH injury_analysis AS (
        SELECT COUNT(*) as injured_players
        FROM trade_players tp
        JOIN players p ON tp.player_id = p.id
        WHERE tp.trade_id = p_trade_id 
            AND p.injury_status IN ('out', 'doubtful', 'questionable')
    )
    SELECT 
        CASE 
            WHEN injured_players = 0 THEN 1.0
            WHEN injured_players = 1 THEN 0.95
            ELSE 0.8  -- Multiple injured players is concerning
        END
    INTO injury_impact_factor
    FROM injury_analysis;

    -- Final fairness score
    fairness_score := fairness_score * position_balance_factor * injury_impact_factor;

    RETURN GREATEST(0, LEAST(1, fairness_score));
END;
$$ LANGUAGE plpgsql;

-- Function to detect potential collusion patterns
CREATE OR REPLACE FUNCTION detect_collusion_patterns(p_league_id UUID)
RETURNS TABLE(
    team_id_1 UUID,
    team_id_2 UUID,
    team_name_1 VARCHAR,
    team_name_2 VARCHAR,
    suspicion_score DECIMAL,
    evidence_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH team_interactions AS (
        SELECT 
            t.proposing_team_id as team_1,
            t.receiving_team_id as team_2,
            pt.team_name as name_1,
            rt.team_name as name_2,
            COUNT(*) as trade_count,
            AVG(calculate_trade_fairness_score(t.id)) as avg_fairness,
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_trades,
            STRING_AGG(DISTINCT p1.position, ',') as positions_exchanged
        FROM trades t
        JOIN teams pt ON t.proposing_team_id = pt.id
        JOIN teams rt ON t.receiving_team_id = rt.id
        LEFT JOIN trade_players tp ON t.id = tp.trade_id
        LEFT JOIN players p1 ON tp.player_id = p1.id
        WHERE t.league_id = p_league_id 
            AND t.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY t.proposing_team_id, t.receiving_team_id, pt.team_name, rt.team_name
        HAVING COUNT(*) >= 2
    ),
    suspicion_analysis AS (
        SELECT 
            *,
            CASE 
                WHEN trade_count >= 5 AND avg_fairness < 0.3 THEN 0.9
                WHEN trade_count >= 4 AND avg_fairness < 0.4 THEN 0.7
                WHEN trade_count >= 3 AND avg_fairness < 0.5 THEN 0.6
                WHEN trade_count >= 6 THEN 0.5
                ELSE 0.2
            END as calculated_suspicion,
            jsonb_build_object(
                'trade_count', trade_count,
                'avg_fairness', avg_fairness,
                'completed_trades', completed_trades,
                'positions_exchanged', positions_exchanged,
                'timeframe', '90 days'
            ) as evidence
        FROM team_interactions
    )
    SELECT 
        team_1,
        team_2,
        name_1,
        name_2,
        calculated_suspicion,
        evidence
    FROM suspicion_analysis
    WHERE calculated_suspicion > 0.4
    ORDER BY calculated_suspicion DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-resolve simple violations
CREATE OR REPLACE FUNCTION auto_resolve_violation(p_violation_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    violation_record RECORD;
    resolution_success BOOLEAN := false;
BEGIN
    -- Get violation details
    SELECT * INTO violation_record 
    FROM rule_violations 
    WHERE id = p_violation_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Handle different violation types
    CASE violation_record.violation_type
        WHEN 'waiver_budget' THEN
            -- Adjust waiver bid to available budget
            UPDATE waiver_claims 
            SET bid_amount = (
                SELECT FLOOR(current_budget * 0.9)
                FROM waiver_budgets 
                WHERE team_id = violation_record.team_id
            )
            WHERE id = (violation_record.context->>'claimId')::UUID;
            
            resolution_success := true;

        WHEN 'roster_limits' THEN
            -- Auto-drop lowest value player if excess is small
            IF (violation_record.context->>'excess_count')::INT = 1 THEN
                DELETE FROM roster_players 
                WHERE id = (
                    SELECT rp.id
                    FROM roster_players rp
                    JOIN players p ON rp.player_id = p.id
                    WHERE rp.team_id = violation_record.team_id
                    ORDER BY p.projected_points ASC, p.adp DESC
                    LIMIT 1
                );
                resolution_success := true;
            END IF;

        WHEN 'lineup_deadline' THEN
            -- Set automatic lineup using highest projected players
            -- This would integrate with the lineup optimization service
            resolution_success := false; -- Requires external service call

        ELSE
            resolution_success := false;
    END CASE;

    -- Update violation record if resolved
    IF resolution_success THEN
        UPDATE rule_violations 
        SET 
            auto_resolved = true,
            resolved_at = NOW(),
            resolution = 'Automatically resolved by system'
        WHERE id = p_violation_id;
        
        -- Log the enforcement action
        INSERT INTO rule_enforcement_actions (
            violation_id, action_type, action_details, success
        ) VALUES (
            p_violation_id,
            'auto_resolution',
            jsonb_build_object('resolution_type', violation_record.violation_type),
            true
        );
    END IF;

    RETURN resolution_success;
END;
$$ LANGUAGE plpgsql;

-- Function to generate rule enforcement summary
CREATE OR REPLACE FUNCTION generate_enforcement_summary(p_league_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE(
    violation_type VARCHAR,
    total_violations INT,
    auto_resolved INT,
    manual_resolved INT,
    pending_violations INT,
    severity_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH violation_stats AS (
        SELECT 
            rv.violation_type,
            COUNT(*) as total_violations,
            COUNT(CASE WHEN rv.auto_resolved = true THEN 1 END) as auto_resolved,
            COUNT(CASE WHEN rv.auto_resolved = false AND rv.resolved_at IS NOT NULL THEN 1 END) as manual_resolved,
            COUNT(CASE WHEN rv.resolved_at IS NULL THEN 1 END) as pending_violations,
            jsonb_object_agg(
                rv.severity, 
                COUNT(CASE WHEN rv.severity IS NOT NULL THEN 1 END)
            ) as severity_breakdown
        FROM rule_violations rv
        WHERE rv.league_id = p_league_id 
            AND rv.detected_at >= NOW() - INTERVAL '1 day' * p_days
        GROUP BY rv.violation_type
    )
    SELECT * FROM violation_stats
    ORDER BY total_violations DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Triggers and Automation
-- =============================================

-- Trigger to update rule timestamps
CREATE OR REPLACE FUNCTION update_league_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_league_rules_timestamp ON league_rules;
CREATE TRIGGER trigger_update_league_rules_timestamp
    BEFORE UPDATE ON league_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_league_rules_timestamp();

-- Trigger to automatically attempt resolution of simple violations
CREATE OR REPLACE FUNCTION trigger_auto_violation_resolution()
RETURNS TRIGGER AS $$
BEGIN
    -- Attempt auto-resolution for specific violation types
    IF NEW.violation_type IN ('waiver_budget', 'roster_limits') 
       AND NEW.severity IN ('minor', 'major') THEN
        
        -- Schedule auto-resolution attempt (would be handled by background job)
        INSERT INTO rule_enforcement_actions (
            violation_id, action_type, action_details, executed_by
        ) VALUES (
            NEW.id,
            'auto_resolution_scheduled',
            jsonb_build_object('violation_type', NEW.violation_type),
            'trigger'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_violation_resolution ON rule_violations;
CREATE TRIGGER trigger_auto_violation_resolution
    AFTER INSERT ON rule_violations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_violation_resolution();

-- =============================================
-- Views for Common Queries
-- =============================================

-- View for active violations requiring attention
CREATE OR REPLACE VIEW active_violations_summary AS
SELECT 
    rv.id,
    rv.league_id,
    l.name as league_name,
    rv.team_id,
    t.team_name,
    rv.violation_type,
    rv.severity,
    rv.description,
    rv.detected_at,
    rv.auto_resolved,
    CASE 
        WHEN rv.resolved_at IS NULL THEN 'pending'
        WHEN rv.auto_resolved THEN 'auto_resolved'
        ELSE 'manually_resolved'
    END as resolution_status,
    EXTRACT(HOURS FROM (NOW() - rv.detected_at))::INT as hours_since_detection
FROM rule_violations rv
JOIN leagues l ON rv.league_id = l.id
JOIN teams t ON rv.team_id = t.id
WHERE rv.resolved_at IS NULL
ORDER BY rv.severity DESC, rv.detected_at ASC;

-- View for league rule compliance overview
CREATE OR REPLACE VIEW league_compliance_overview AS
WITH compliance_stats AS (
    SELECT 
        l.id as league_id,
        l.name as league_name,
        COUNT(rv.id) as total_violations,
        COUNT(CASE WHEN rv.severity = 'critical' THEN 1 END) as critical_violations,
        COUNT(CASE WHEN rv.severity = 'major' THEN 1 END) as major_violations,
        COUNT(CASE WHEN rv.severity = 'minor' THEN 1 END) as minor_violations,
        COUNT(CASE WHEN rv.auto_resolved = true THEN 1 END) as auto_resolved_count,
        COUNT(CASE WHEN rv.resolved_at IS NULL THEN 1 END) as pending_violations
    FROM leagues l
    LEFT JOIN rule_violations rv ON l.id = rv.league_id 
        AND rv.detected_at >= NOW() - INTERVAL '30 days'
    GROUP BY l.id, l.name
)
SELECT 
    *,
    CASE 
        WHEN critical_violations > 0 THEN 'critical'
        WHEN major_violations > 5 THEN 'concerning'
        WHEN total_violations > 10 THEN 'moderate'
        ELSE 'good'
    END as compliance_status,
    CASE 
        WHEN total_violations > 0 THEN ROUND((auto_resolved_count::DECIMAL / total_violations) * 100, 1)
        ELSE 100.0
    END as auto_resolution_rate
FROM compliance_stats
ORDER BY critical_violations DESC, total_violations DESC;

-- =============================================
-- Default Rule Templates
-- =============================================

-- Insert standard rule templates
INSERT INTO league_rule_templates (template_name, description, rules_config, league_type) VALUES
('Standard League Rules', 'Default rule set for standard fantasy football leagues', 
'{
    "lineup_deadline": {
        "enforcement_level": "penalty",
        "config": {
            "deadline_offset_minutes": -60,
            "penalties": {"lineupDeadline": -5}
        }
    },
    "roster_limits": {
        "enforcement_level": "automatic", 
        "config": {
            "limits": {"QB": 4, "RB": 8, "WR": 8, "TE": 3, "K": 2, "DST": 3}
        }
    },
    "waiver_budget": {
        "enforcement_level": "automatic",
        "config": {"auto_adjust_bids": true}
    },
    "add_drop_limits": {
        "enforcement_level": "warning",
        "config": {"weeklyLimit": 10}
    }
}', 'standard'),

('Strict Enforcement', 'High enforcement rule set with automatic penalties',
'{
    "lineup_deadline": {
        "enforcement_level": "penalty",
        "config": {
            "deadline_offset_minutes": 0,
            "penalties": {"lineupDeadline": -10}
        }
    },
    "roster_limits": {
        "enforcement_level": "automatic",
        "config": {
            "limits": {"QB": 3, "RB": 6, "WR": 6, "TE": 2, "K": 1, "DST": 2}
        }
    },
    "inactive_manager": {
        "enforcement_level": "penalty",
        "config": {"inactiveDays": 7, "penalties": {"inactivity": -15}}
    },
    "collusion_detection": {
        "enforcement_level": "penalty",
        "config": {"suspicion_threshold": 0.6}
    }
}', 'strict'),

('Casual League Rules', 'Lenient rule set focused on fun and participation',
'{
    "lineup_deadline": {
        "enforcement_level": "warning",
        "config": {
            "deadline_offset_minutes": -180,
            "penalties": {"lineupDeadline": -2}
        }
    },
    "roster_limits": {
        "enforcement_level": "warning",
        "config": {
            "limits": {"QB": 5, "RB": 10, "WR": 10, "TE": 4, "K": 3, "DST": 3}
        }
    },
    "add_drop_limits": {
        "enforcement_level": "warning", 
        "config": {"weeklyLimit": 15}
    },
    "inactive_manager": {
        "enforcement_level": "automatic",
        "config": {"inactiveDays": 14}
    }
}', 'casual')

ON CONFLICT (template_name, league_type) DO NOTHING;

-- =============================================
-- Performance Indexes
-- =============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_rule_violations_league_team_type ON rule_violations(league_id, team_id, violation_type);
CREATE INDEX IF NOT EXISTS idx_rule_violations_detection_resolution ON rule_violations(detected_at DESC, resolved_at NULLS FIRST);
CREATE INDEX IF NOT EXISTS idx_enforcement_actions_violation_success ON rule_enforcement_actions(violation_id, success, executed_at DESC);

-- Partial indexes for active data
CREATE INDEX IF NOT EXISTS idx_active_violations ON rule_violations(league_id, severity DESC, detected_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pending_conflicts ON conflict_resolutions(league_id, created_at DESC) WHERE status IN ('pending', 'mediation');

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON TABLE league_rules IS 'Configuration table for automated rule enforcement in fantasy leagues';
COMMENT ON TABLE rule_violations IS 'Records of detected rule violations with context and resolution tracking';
COMMENT ON TABLE conflict_resolutions IS 'Tracks conflicts between league members requiring mediation';
COMMENT ON TABLE score_adjustments IS 'Score penalties and adjustments applied for rule violations';
COMMENT ON TABLE rule_enforcement_actions IS 'Audit trail of all enforcement actions taken';
COMMENT ON TABLE league_rule_templates IS 'Predefined rule sets for different league types';
COMMENT ON TABLE trade_veto_tracking IS 'Enhanced tracking of trade vetoes and fairness analysis';

COMMENT ON FUNCTION check_roster_limits(UUID, JSONB) IS 'Validates team roster against position limits';
COMMENT ON FUNCTION calculate_trade_fairness_score(UUID) IS 'AI-enhanced trade fairness calculation';
COMMENT ON FUNCTION detect_collusion_patterns(UUID) IS 'Detects suspicious trading patterns indicating possible collusion';
COMMENT ON FUNCTION auto_resolve_violation(VARCHAR) IS 'Automatically resolves simple rule violations';
COMMENT ON FUNCTION generate_enforcement_summary(UUID, INT) IS 'Generates comprehensive rule enforcement statistics';

COMMENT ON VIEW active_violations_summary IS 'Current unresolved violations requiring attention';
COMMENT ON VIEW league_compliance_overview IS 'League-wide compliance metrics and status summary';