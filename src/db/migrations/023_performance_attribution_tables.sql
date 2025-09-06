-- Performance Attribution and Decision Tracking Tables
-- Migration: 023_performance_attribution_tables.sql

-- Decision tracking table to log all user decisions
CREATE TABLE IF NOT EXISTS decision_tracking (
    decision_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    league_id VARCHAR(255) NOT NULL REFERENCES leagues(id),
    decision_type VARCHAR(50) NOT NULL CHECK (decision_type IN ('trade', 'waiver', 'lineup', 'draft', 'drop')),
    description TEXT NOT NULL,
    week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 17),
    players_before JSONB DEFAULT '[]',
    players_after JSONB DEFAULT '[]',
    reasoning TEXT,
    ai_recommended BOOLEAN DEFAULT false,
    alternatives_considered JSONB DEFAULT '[]',
    expected_impact DECIMAL(8,2) DEFAULT 0,
    actual_impact DECIMAL(8,2),
    impact_timeline VARCHAR(20) CHECK (impact_timeline IN ('immediate', 'short_term', 'long_term', 'season_long')),
    impact_calculated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance impacts table to store calculated decision outcomes
CREATE TABLE IF NOT EXISTS performance_impacts (
    decision_id VARCHAR(255) PRIMARY KEY REFERENCES decision_tracking(decision_id),
    points_gained DECIMAL(8,2) DEFAULT 0,
    points_lost DECIMAL(8,2) DEFAULT 0,
    net_impact DECIMAL(8,2) DEFAULT 0,
    wins_gained INTEGER DEFAULT 0,
    wins_lost INTEGER DEFAULT 0,
    ranking_change INTEGER DEFAULT 0,
    opportunity_cost DECIMAL(8,2) DEFAULT 0,
    impact_confidence DECIMAL(3,2) CHECK (impact_confidence BETWEEN 0 AND 1),
    contributing_factors JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Decision patterns table for behavioral analysis
CREATE TABLE IF NOT EXISTS decision_patterns (
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    league_id VARCHAR(255) NOT NULL REFERENCES leagues(id),
    decision_type VARCHAR(50) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'timing', 'position_bias', 'risk_tolerance', etc.
    pattern_value JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    last_updated TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, league_id, decision_type, pattern_type)
);

-- Attribution summaries for quick access to aggregated data
CREATE TABLE IF NOT EXISTS attribution_summaries (
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    league_id VARCHAR(255) NOT NULL REFERENCES leagues(id),
    decision_type VARCHAR(50) NOT NULL,
    total_decisions INTEGER DEFAULT 0,
    successful_decisions INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4) DEFAULT 0,
    average_impact DECIMAL(8,2) DEFAULT 0,
    total_points_impact DECIMAL(8,2) DEFAULT 0,
    best_decision_id VARCHAR(255),
    worst_decision_id VARCHAR(255),
    last_updated TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, league_id, decision_type)
);

-- Performance attribution insights for storing AI-generated analysis
CREATE TABLE IF NOT EXISTS attribution_insights (
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    league_id VARCHAR(255) NOT NULL REFERENCES leagues(id),
    insight_type VARCHAR(50) NOT NULL, -- 'strength', 'weakness', 'pattern', 'recommendation'
    insight_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    supporting_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_decision_tracking_user_league_week 
ON decision_tracking(user_id, league_id, week_number);

CREATE INDEX IF NOT EXISTS idx_decision_tracking_type_impact 
ON decision_tracking(decision_type, actual_impact DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_decision_tracking_created_at 
ON decision_tracking(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_impacts_net_impact 
ON performance_impacts(net_impact DESC);

CREATE INDEX IF NOT EXISTS idx_decision_patterns_user_league 
ON decision_patterns(user_id, league_id);

CREATE INDEX IF NOT EXISTS idx_attribution_summaries_success_rate 
ON attribution_summaries(success_rate DESC);

CREATE INDEX IF NOT EXISTS idx_attribution_insights_user_league_active 
ON attribution_insights(user_id, league_id, is_active) WHERE is_active = true;

-- Functions for decision tracking automation

-- Function to update attribution summaries when decisions are tracked
CREATE OR REPLACE FUNCTION update_attribution_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert attribution summary
    INSERT INTO attribution_summaries (
        user_id, league_id, decision_type, total_decisions, 
        successful_decisions, success_rate, average_impact, total_points_impact
    )
    SELECT 
        NEW.user_id,
        NEW.league_id,
        NEW.decision_type,
        COUNT(*) as total_decisions,
        COUNT(CASE WHEN COALESCE(NEW.actual_impact, NEW.expected_impact, 0) > 0 THEN 1 END) as successful_decisions,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                COUNT(CASE WHEN COALESCE(NEW.actual_impact, NEW.expected_impact, 0) > 0 THEN 1 END)::DECIMAL / COUNT(*)
            ELSE 0 
        END as success_rate,
        AVG(COALESCE(NEW.actual_impact, NEW.expected_impact, 0)) as average_impact,
        SUM(COALESCE(NEW.actual_impact, NEW.expected_impact, 0)) as total_points_impact
    FROM decision_tracking 
    WHERE user_id = NEW.user_id AND league_id = NEW.league_id AND decision_type = NEW.decision_type
    ON CONFLICT (user_id, league_id, decision_type)
    DO UPDATE SET
        total_decisions = EXCLUDED.total_decisions,
        successful_decisions = EXCLUDED.successful_decisions,
        success_rate = EXCLUDED.success_rate,
        average_impact = EXCLUDED.average_impact,
        total_points_impact = EXCLUDED.total_points_impact,
        last_updated = NOW();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update attribution summaries
DROP TRIGGER IF EXISTS trigger_update_attribution_summary ON decision_tracking;
CREATE TRIGGER trigger_update_attribution_summary
    AFTER INSERT OR UPDATE OF actual_impact ON decision_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_attribution_summary();

-- Function to calculate decision success metrics
CREATE OR REPLACE FUNCTION calculate_decision_success_rate(
    p_user_id VARCHAR(255),
    p_league_id VARCHAR(255),
    p_decision_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    decision_type VARCHAR(50),
    total_decisions BIGINT,
    successful_decisions BIGINT,
    success_rate DECIMAL,
    avg_impact DECIMAL,
    total_impact DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dt.decision_type::VARCHAR(50),
        COUNT(*) as total_decisions,
        COUNT(CASE WHEN COALESCE(dt.actual_impact, dt.expected_impact, 0) > 0 THEN 1 END) as successful_decisions,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN COALESCE(dt.actual_impact, dt.expected_impact, 0) > 0 THEN 1 END)::DECIMAL / COUNT(*))
            ELSE 0 
        END as success_rate,
        AVG(COALESCE(dt.actual_impact, dt.expected_impact, 0)) as avg_impact,
        SUM(COALESCE(dt.actual_impact, dt.expected_impact, 0)) as total_impact
    FROM decision_tracking dt
    WHERE dt.user_id = p_user_id 
        AND dt.league_id = p_league_id
        AND (p_decision_type IS NULL OR dt.decision_type = p_decision_type)
    GROUP BY dt.decision_type
    ORDER BY success_rate DESC, total_decisions DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get decision timeline analysis
CREATE OR REPLACE FUNCTION get_decision_timeline_analysis(
    p_user_id VARCHAR(255),
    p_league_id VARCHAR(255),
    p_weeks INTEGER DEFAULT 17
)
RETURNS TABLE (
    week_number INTEGER,
    total_decisions BIGINT,
    successful_decisions BIGINT,
    avg_impact DECIMAL,
    cumulative_impact DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dt.week_number::INTEGER,
        COUNT(*) as total_decisions,
        COUNT(CASE WHEN COALESCE(dt.actual_impact, dt.expected_impact, 0) > 0 THEN 1 END) as successful_decisions,
        AVG(COALESCE(dt.actual_impact, dt.expected_impact, 0)) as avg_impact,
        SUM(COALESCE(dt.actual_impact, dt.expected_impact, 0)) OVER (ORDER BY dt.week_number) as cumulative_impact
    FROM decision_tracking dt
    WHERE dt.user_id = p_user_id 
        AND dt.league_id = p_league_id
        AND dt.week_number <= p_weeks
    GROUP BY dt.week_number
    ORDER BY dt.week_number;
END;
$$ LANGUAGE plpgsql;

-- Function to identify top performing decisions
CREATE OR REPLACE FUNCTION get_top_decisions(
    p_user_id VARCHAR(255),
    p_league_id VARCHAR(255),
    p_limit INTEGER DEFAULT 5,
    p_best BOOLEAN DEFAULT true
)
RETURNS TABLE (
    decision_id VARCHAR(255),
    decision_type VARCHAR(50),
    description TEXT,
    week_number INTEGER,
    impact DECIMAL,
    reasoning TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    IF p_best THEN
        RETURN QUERY
        SELECT 
            dt.decision_id,
            dt.decision_type,
            dt.description,
            dt.week_number,
            COALESCE(dt.actual_impact, dt.expected_impact, 0) as impact,
            dt.reasoning,
            dt.created_at
        FROM decision_tracking dt
        WHERE dt.user_id = p_user_id AND dt.league_id = p_league_id
        ORDER BY COALESCE(dt.actual_impact, dt.expected_impact, 0) DESC NULLS LAST
        LIMIT p_limit;
    ELSE
        RETURN QUERY
        SELECT 
            dt.decision_id,
            dt.decision_type,
            dt.description,
            dt.week_number,
            COALESCE(dt.actual_impact, dt.expected_impact, 0) as impact,
            dt.reasoning,
            dt.created_at
        FROM decision_tracking dt
        WHERE dt.user_id = p_user_id AND dt.league_id = p_league_id
        ORDER BY COALESCE(dt.actual_impact, dt.expected_impact, 0) ASC NULLS LAST
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate opportunity cost for decisions
CREATE OR REPLACE FUNCTION calculate_opportunity_cost(
    p_decision_id VARCHAR(255)
)
RETURNS DECIMAL AS $$
DECLARE
    decision_record RECORD;
    alternative_performance DECIMAL;
    actual_performance DECIMAL;
BEGIN
    -- Get decision details
    SELECT * INTO decision_record
    FROM decision_tracking dt
    JOIN performance_impacts pi ON dt.decision_id = pi.decision_id
    WHERE dt.decision_id = p_decision_id;
    
    -- If no decision found, return 0
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate what the best alternative would have achieved
    -- This is a simplified calculation - in production would need more complex logic
    alternative_performance := CASE 
        WHEN decision_record.decision_type = 'waiver' THEN 
            -- Estimate average waiver pickup performance
            (SELECT AVG(COALESCE(pi.net_impact, 0)) 
             FROM decision_tracking dt2 
             JOIN performance_impacts pi ON dt2.decision_id = pi.decision_id
             WHERE dt2.decision_type = 'waiver' 
               AND dt2.user_id != decision_record.user_id 
               AND dt2.week_number = decision_record.week_number)
        WHEN decision_record.decision_type = 'trade' THEN
            -- Estimate average trade performance
            (SELECT AVG(COALESCE(pi.net_impact, 0)) 
             FROM decision_tracking dt2 
             JOIN performance_impacts pi ON dt2.decision_id = pi.decision_id
             WHERE dt2.decision_type = 'trade' 
               AND dt2.user_id != decision_record.user_id)
        ELSE 0
    END;
    
    actual_performance := decision_record.net_impact;
    
    -- Opportunity cost is the difference between best alternative and actual performance
    RETURN COALESCE(alternative_performance - actual_performance, 0);
END;
$$ LANGUAGE plpgsql;

-- View for easy access to comprehensive decision analysis
CREATE OR REPLACE VIEW decision_analysis_view AS
SELECT 
    dt.decision_id,
    dt.user_id,
    dt.league_id,
    dt.decision_type,
    dt.description,
    dt.week_number,
    dt.players_before,
    dt.players_after,
    dt.reasoning,
    dt.ai_recommended,
    dt.expected_impact,
    dt.actual_impact,
    dt.impact_timeline,
    pi.points_gained,
    pi.points_lost,
    pi.net_impact,
    pi.wins_gained,
    pi.wins_lost,
    pi.opportunity_cost,
    pi.impact_confidence,
    pi.contributing_factors,
    dt.created_at,
    CASE 
        WHEN dt.actual_impact IS NOT NULL AND dt.actual_impact > 0 THEN 'successful'
        WHEN dt.actual_impact IS NOT NULL AND dt.actual_impact <= 0 THEN 'unsuccessful'
        WHEN dt.expected_impact > 0 THEN 'pending_positive'
        ELSE 'pending_negative'
    END as decision_status,
    CASE 
        WHEN ABS(COALESCE(dt.actual_impact, dt.expected_impact, 0)) > 20 THEN 'high_impact'
        WHEN ABS(COALESCE(dt.actual_impact, dt.expected_impact, 0)) > 5 THEN 'medium_impact'
        ELSE 'low_impact'
    END as impact_level
FROM decision_tracking dt
LEFT JOIN performance_impacts pi ON dt.decision_id = pi.decision_id;

-- Update triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_decision_tracking_updated_at ON decision_tracking;
CREATE TRIGGER update_decision_tracking_updated_at
    BEFORE UPDATE ON decision_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_impacts_updated_at ON performance_impacts;
CREATE TRIGGER update_performance_impacts_updated_at
    BEFORE UPDATE ON performance_impacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE decision_tracking IS 'Tracks all fantasy football decisions made by users for performance attribution analysis';
COMMENT ON TABLE performance_impacts IS 'Stores calculated performance impacts of tracked decisions';
COMMENT ON TABLE decision_patterns IS 'Stores behavioral patterns and tendencies for each user';
COMMENT ON TABLE attribution_summaries IS 'Pre-calculated summaries of decision performance by type';
COMMENT ON TABLE attribution_insights IS 'AI-generated insights about user decision making patterns';

COMMENT ON FUNCTION calculate_decision_success_rate IS 'Calculates success metrics for user decisions by type';
COMMENT ON FUNCTION get_decision_timeline_analysis IS 'Provides week-by-week decision performance analysis';
COMMENT ON FUNCTION get_top_decisions IS 'Returns best or worst performing decisions for a user';
COMMENT ON FUNCTION calculate_opportunity_cost IS 'Calculates opportunity cost for a specific decision';