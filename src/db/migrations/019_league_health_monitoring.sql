-- =============================================
-- League Health Monitoring System Migration
-- =============================================

-- League Health Metrics Table
CREATE TABLE IF NOT EXISTS league_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    overall_score DECIMAL(5,4) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    competitive_balance DECIMAL(5,4) NOT NULL CHECK (competitive_balance >= 0 AND competitive_balance <= 1),
    user_engagement DECIMAL(5,4) NOT NULL CHECK (user_engagement >= 0 AND user_engagement <= 1),
    activity_level DECIMAL(5,4) NOT NULL CHECK (activity_level >= 0 AND activity_level <= 1),
    trade_volume DECIMAL(5,4) NOT NULL CHECK (trade_volume >= 0 AND trade_volume <= 1),
    waiver_participation DECIMAL(5,4) NOT NULL CHECK (waiver_participation >= 0 AND waiver_participation <= 1),
    content_interaction DECIMAL(5,4) NOT NULL CHECK (content_interaction >= 0 AND content_interaction <= 1),
    retention_rate DECIMAL(5,4) NOT NULL CHECK (retention_rate >= 0 AND retention_rate <= 1),
    satisfaction_score DECIMAL(5,4) NOT NULL CHECK (satisfaction_score >= 0 AND satisfaction_score <= 1),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT idx_league_health_metrics_league_recorded UNIQUE (league_id, recorded_at)
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_league_health_metrics_league_id ON league_health_metrics(league_id);
CREATE INDEX IF NOT EXISTS idx_league_health_metrics_recorded_at ON league_health_metrics(recorded_at DESC);

-- League Health Alerts Table
CREATE TABLE IF NOT EXISTS league_health_alerts (
    id VARCHAR(255) PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    affected_users JSONB DEFAULT '[]',
    suggested_actions JSONB NOT NULL DEFAULT '[]',
    automated BOOLEAN NOT NULL DEFAULT false,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ NULL,
    resolved_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS idx_league_health_alerts_league_id ON league_health_alerts(league_id);
CREATE INDEX IF NOT EXISTS idx_league_health_alerts_severity ON league_health_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_league_health_alerts_resolved ON league_health_alerts(resolved, created_at);

-- League Health Assessments (comprehensive reports)
CREATE TABLE IF NOT EXISTS league_health_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    health_metrics JSONB NOT NULL,
    engagement_profiles JSONB NOT NULL,
    balance_metrics JSONB NOT NULL,
    trends JSONB NOT NULL,
    recommendations JSONB NOT NULL,
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for assessments
CREATE INDEX IF NOT EXISTS idx_league_health_assessments_league_id ON league_health_assessments(league_id);
CREATE INDEX IF NOT EXISTS idx_league_health_assessments_date ON league_health_assessments(assessment_date DESC);

-- User Engagement Tracking Table
CREATE TABLE IF NOT EXISTS user_engagement_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    engagement_score DECIMAL(5,4) NOT NULL CHECK (engagement_score >= 0 AND engagement_score <= 1),
    activity_level VARCHAR(20) NOT NULL CHECK (activity_level IN ('high', 'medium', 'low', 'inactive')),
    risk_level DECIMAL(5,4) NOT NULL CHECK (risk_level >= 0 AND risk_level <= 1),
    preferred_actions JSONB DEFAULT '[]',
    interaction_patterns JSONB DEFAULT '{}',
    last_activity TIMESTAMPTZ,
    tracking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates per day
    CONSTRAINT idx_user_engagement_tracking_unique UNIQUE (user_id, league_id, DATE(tracking_date))
);

-- Indexes for engagement tracking
CREATE INDEX IF NOT EXISTS idx_user_engagement_tracking_user_league ON user_engagement_tracking(user_id, league_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_tracking_risk ON user_engagement_tracking(risk_level DESC, tracking_date);
CREATE INDEX IF NOT EXISTS idx_user_engagement_tracking_activity ON user_engagement_tracking(activity_level, tracking_date);

-- League Initiatives Table (for automated engagement activities)
CREATE TABLE IF NOT EXISTS league_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NULL,
    participation_count INT DEFAULT 0,
    success_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for initiatives
CREATE INDEX IF NOT EXISTS idx_league_initiatives_league_id ON league_initiatives(league_id);
CREATE INDEX IF NOT EXISTS idx_league_initiatives_active ON league_initiatives(active, start_date);

-- League Health Configuration Table
CREATE TABLE IF NOT EXISTS league_health_config (
    league_id UUID PRIMARY KEY REFERENCES leagues(id) ON DELETE CASCADE,
    monitoring_enabled BOOLEAN NOT NULL DEFAULT true,
    alert_thresholds JSONB NOT NULL DEFAULT '{
        "overall_score": 0.5,
        "user_engagement": 0.4,
        "competitive_balance": 0.3,
        "activity_level": 0.3,
        "retention_rate": 0.6
    }',
    automated_responses JSONB NOT NULL DEFAULT '{
        "reengagement_messages": true,
        "engagement_initiatives": true,
        "lineup_assistance": true
    }',
    notification_settings JSONB NOT NULL DEFAULT '{
        "commissioners": true,
        "daily_summary": false,
        "weekly_report": true,
        "critical_alerts": true
    }',
    assessment_frequency VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (assessment_frequency IN ('hourly', 'daily', 'weekly')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to calculate league health score trends
CREATE OR REPLACE FUNCTION calculate_health_trend(p_league_id UUID, p_days INT DEFAULT 7)
RETURNS TABLE(
    date DATE,
    overall_score DECIMAL,
    engagement_change DECIMAL,
    trend_direction VARCHAR(10)
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_scores AS (
        SELECT 
            DATE(recorded_at) as metric_date,
            AVG(overall_score) as avg_score,
            AVG(user_engagement) as avg_engagement
        FROM league_health_metrics 
        WHERE league_id = p_league_id 
            AND recorded_at >= NOW() - INTERVAL '1 day' * p_days
        GROUP BY DATE(recorded_at)
        ORDER BY metric_date
    ),
    score_trends AS (
        SELECT 
            metric_date,
            avg_score,
            avg_engagement,
            LAG(avg_engagement) OVER (ORDER BY metric_date) as prev_engagement
        FROM daily_scores
    )
    SELECT 
        metric_date::DATE,
        avg_score,
        COALESCE(avg_engagement - prev_engagement, 0) as engagement_change,
        CASE 
            WHEN avg_engagement - COALESCE(prev_engagement, avg_engagement) > 0.05 THEN 'improving'
            WHEN avg_engagement - COALESCE(prev_engagement, avg_engagement) < -0.05 THEN 'declining'
            ELSE 'stable'
        END as trend_direction
    FROM score_trends
    WHERE prev_engagement IS NOT NULL OR metric_date = (SELECT MIN(metric_date) FROM score_trends);
END;
$$ LANGUAGE plpgsql;

-- Function to identify at-risk users
CREATE OR REPLACE FUNCTION identify_at_risk_users(p_league_id UUID)
RETURNS TABLE(
    user_id UUID,
    team_name VARCHAR,
    risk_score DECIMAL,
    days_inactive INT,
    risk_factors JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_activity AS (
        SELECT 
            t.user_id,
            t.team_name,
            MAX(ual.created_at) as last_activity,
            COUNT(ual.id) as activity_count,
            COUNT(CASE WHEN ual.action_type = 'lineup_change' THEN 1 END) as lineup_changes,
            COUNT(CASE WHEN ual.action_type = 'trade_propose' THEN 1 END) as trade_activity,
            COUNT(CASE WHEN ual.action_type = 'waiver_claim' THEN 1 END) as waiver_activity
        FROM teams t
        LEFT JOIN user_activity_log ual ON t.user_id = ual.user_id 
            AND ual.league_id = p_league_id 
            AND ual.created_at >= NOW() - INTERVAL '14 days'
        WHERE t.league_id = p_league_id AND t.active = true
        GROUP BY t.user_id, t.team_name
    ),
    risk_calculation AS (
        SELECT 
            ua.user_id,
            ua.team_name,
            EXTRACT(DAYS FROM (NOW() - COALESCE(ua.last_activity, NOW() - INTERVAL '30 days')))::INT as days_inactive,
            ua.activity_count,
            ua.lineup_changes,
            ua.trade_activity,
            ua.waiver_activity,
            -- Calculate risk score (0-1, higher = more risk)
            GREATEST(0, LEAST(1,
                CASE 
                    WHEN ua.last_activity IS NULL THEN 1.0
                    WHEN EXTRACT(DAYS FROM (NOW() - ua.last_activity)) > 14 THEN 1.0
                    WHEN EXTRACT(DAYS FROM (NOW() - ua.last_activity)) > 7 THEN 0.8
                    WHEN EXTRACT(DAYS FROM (NOW() - ua.last_activity)) > 3 THEN 0.6
                    ELSE 0.0
                END +
                CASE 
                    WHEN ua.activity_count = 0 THEN 0.3
                    WHEN ua.activity_count < 3 THEN 0.2
                    WHEN ua.activity_count < 7 THEN 0.1
                    ELSE 0.0
                END +
                CASE 
                    WHEN ua.lineup_changes = 0 THEN 0.3
                    WHEN ua.lineup_changes < 2 THEN 0.1
                    ELSE 0.0
                END
            )) as risk_score
        FROM user_activity ua
    )
    SELECT 
        rc.user_id,
        rc.team_name,
        rc.risk_score,
        rc.days_inactive,
        jsonb_build_object(
            'days_inactive', rc.days_inactive,
            'activity_count', rc.activity_count,
            'lineup_changes', rc.lineup_changes,
            'trade_activity', rc.trade_activity,
            'waiver_activity', rc.waiver_activity,
            'inactivity_level', CASE 
                WHEN rc.days_inactive > 14 THEN 'severe'
                WHEN rc.days_inactive > 7 THEN 'moderate'
                WHEN rc.days_inactive > 3 THEN 'mild'
                ELSE 'none'
            END
        ) as risk_factors
    FROM risk_calculation rc
    WHERE rc.risk_score > 0.3
    ORDER BY rc.risk_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate competitive balance score
CREATE OR REPLACE FUNCTION calculate_competitive_balance_score(p_league_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    balance_score DECIMAL := 0;
    win_variance DECIMAL;
    score_variance DECIMAL;
    waiver_equity DECIMAL;
    trade_balance DECIMAL;
BEGIN
    -- Calculate win percentage variance
    WITH team_records AS (
        SELECT 
            wins::DECIMAL / GREATEST(wins + losses, 1) as win_pct
        FROM teams 
        WHERE league_id = p_league_id AND active = true
    ),
    variance_calc AS (
        SELECT 
            AVG(win_pct) as avg_win_pct,
            STDDEV(win_pct) as stddev_win_pct
        FROM team_records
    )
    SELECT COALESCE(1 - (stddev_win_pct / NULLIF(avg_win_pct, 0)), 0.5)
    INTO win_variance
    FROM variance_calc;

    -- Calculate scoring variance
    WITH recent_scores AS (
        SELECT weekly_score
        FROM team_weekly_scores 
        WHERE league_id = p_league_id 
            AND weekly_score > 0
            AND week_number >= (
                SELECT MAX(week_number) - 4 
                FROM team_weekly_scores 
                WHERE league_id = p_league_id
            )
    ),
    score_stats AS (
        SELECT 
            AVG(weekly_score) as avg_score,
            STDDEV(weekly_score) as stddev_score
        FROM recent_scores
    )
    SELECT COALESCE(1 - (stddev_score / NULLIF(avg_score, 0)), 0.5)
    INTO score_variance
    FROM score_stats;

    -- Get waiver equity from fairness system
    SELECT COALESCE(AVG(fairness_multiplier), 1.0)
    INTO waiver_equity
    FROM waiver_fairness_tracking 
    WHERE league_id = p_league_id 
        AND created_at >= NOW() - INTERVAL '30 days';

    -- Calculate trade balance
    WITH trade_participation AS (
        SELECT team_id, COUNT(*) as trade_count
        FROM (
            SELECT proposing_team_id as team_id FROM trades WHERE league_id = p_league_id AND status = 'completed'
            UNION ALL
            SELECT receiving_team_id as team_id FROM trades WHERE league_id = p_league_id AND status = 'completed'
        ) t
        GROUP BY team_id
    ),
    trade_stats AS (
        SELECT 
            AVG(trade_count) as avg_trades,
            STDDEV(trade_count) as stddev_trades
        FROM trade_participation
    )
    SELECT COALESCE(1 - (stddev_trades / NULLIF(avg_trades, 1)), 0.5)
    INTO trade_balance
    FROM trade_stats;

    -- Combine metrics with weights
    balance_score := (
        COALESCE(win_variance, 0.5) * 0.3 +
        COALESCE(score_variance, 0.5) * 0.3 +
        COALESCE((waiver_equity - 0.5) * 2, 0.5) * 0.25 +  -- Normalize waiver equity
        COALESCE(trade_balance, 0.5) * 0.15
    );

    RETURN GREATEST(0, LEAST(1, balance_score));
END;
$$ LANGUAGE plpgsql;

-- Trigger to update league health alerts when resolved
CREATE OR REPLACE FUNCTION update_league_health_alert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- If alert is being resolved, set resolved_at
    IF NEW.resolved = true AND OLD.resolved = false THEN
        NEW.resolved_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to alerts table
DROP TRIGGER IF EXISTS trigger_update_league_health_alert_timestamp ON league_health_alerts;
CREATE TRIGGER trigger_update_league_health_alert_timestamp
    BEFORE UPDATE ON league_health_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_league_health_alert_timestamp();

-- Trigger to update league health config timestamp
CREATE OR REPLACE FUNCTION update_league_health_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_league_health_config_timestamp ON league_health_config;
CREATE TRIGGER trigger_update_league_health_config_timestamp
    BEFORE UPDATE ON league_health_config
    FOR EACH ROW
    EXECUTE FUNCTION update_league_health_config_timestamp();

-- =============================================
-- Views for Common Queries
-- =============================================

-- View for current league health status
CREATE OR REPLACE VIEW current_league_health AS
SELECT DISTINCT ON (lhm.league_id)
    l.id as league_id,
    l.name as league_name,
    lhm.overall_score,
    lhm.competitive_balance,
    lhm.user_engagement,
    lhm.activity_level,
    lhm.retention_rate,
    lhm.recorded_at,
    CASE 
        WHEN lhm.overall_score >= 0.8 THEN 'excellent'
        WHEN lhm.overall_score >= 0.6 THEN 'good'
        WHEN lhm.overall_score >= 0.4 THEN 'fair'
        WHEN lhm.overall_score >= 0.2 THEN 'poor'
        ELSE 'critical'
    END as health_status,
    (
        SELECT COUNT(*) 
        FROM league_health_alerts lha 
        WHERE lha.league_id = l.id 
            AND lha.resolved = false 
            AND lha.created_at >= NOW() - INTERVAL '7 days'
    ) as active_alerts
FROM leagues l
LEFT JOIN league_health_metrics lhm ON l.id = lhm.league_id
WHERE lhm.recorded_at IS NOT NULL
ORDER BY lhm.league_id, lhm.recorded_at DESC;

-- View for at-risk users across all leagues
CREATE OR REPLACE VIEW at_risk_users_summary AS
SELECT 
    l.id as league_id,
    l.name as league_name,
    t.id as team_id,
    t.team_name,
    u.email as user_email,
    uat.risk_level,
    uat.activity_level,
    uat.last_activity,
    EXTRACT(DAYS FROM (NOW() - uat.last_activity))::INT as days_inactive
FROM user_engagement_tracking uat
JOIN teams t ON uat.user_id = t.user_id AND uat.league_id = t.league_id
JOIN leagues l ON t.league_id = l.id
JOIN users u ON t.user_id = u.id
WHERE uat.risk_level > 0.5 
    AND uat.tracking_date >= CURRENT_DATE - INTERVAL '3 days'
    AND t.active = true
ORDER BY uat.risk_level DESC, l.name, t.team_name;

-- =============================================
-- Initial Configuration
-- =============================================

-- Insert default health configuration for existing leagues
INSERT INTO league_health_config (league_id)
SELECT id FROM leagues 
WHERE id NOT IN (SELECT league_id FROM league_health_config)
ON CONFLICT (league_id) DO NOTHING;

-- =============================================
-- Performance Indexes
-- =============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_league_health_metrics_composite ON league_health_metrics(league_id, recorded_at DESC, overall_score);
CREATE INDEX IF NOT EXISTS idx_league_health_alerts_active ON league_health_alerts(league_id, resolved, severity) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_user_engagement_tracking_risk ON user_engagement_tracking(league_id, risk_level DESC, tracking_date DESC);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_league_health_alerts_unresolved ON league_health_alerts(league_id, created_at DESC) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_league_initiatives_active ON league_initiatives(league_id, start_date DESC) WHERE active = true;

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON TABLE league_health_metrics IS 'Stores periodic league health assessment scores';
COMMENT ON TABLE league_health_alerts IS 'Stores health alerts and warnings for leagues requiring attention';
COMMENT ON TABLE league_health_assessments IS 'Stores comprehensive health assessment reports';
COMMENT ON TABLE user_engagement_tracking IS 'Tracks individual user engagement patterns and risk levels';
COMMENT ON TABLE league_initiatives IS 'Stores automated engagement initiatives and challenges';
COMMENT ON TABLE league_health_config IS 'Configuration settings for league health monitoring';

COMMENT ON FUNCTION calculate_health_trend(UUID, INT) IS 'Calculates league health trend over specified days';
COMMENT ON FUNCTION identify_at_risk_users(UUID) IS 'Identifies users at risk of abandoning the league';
COMMENT ON FUNCTION calculate_competitive_balance_score(UUID) IS 'Calculates overall competitive balance score for a league';

COMMENT ON VIEW current_league_health IS 'Current health status for all leagues with latest metrics';
COMMENT ON VIEW at_risk_users_summary IS 'Summary of users at risk across all leagues';