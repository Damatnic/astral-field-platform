-- =============================================
-- Intelligent Auto-Draft System Migration
-- =============================================

-- Auto Draft Configuration Table
CREATE TABLE IF NOT EXISTS auto_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    config JSONB NOT NULL,
    draft_state JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'initialized' CHECK (status IN ('initialized', 'active', 'paused', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for auto drafts
CREATE INDEX IF NOT EXISTS idx_auto_drafts_league_id ON auto_drafts(league_id);
CREATE INDEX IF NOT EXISTS idx_auto_drafts_status ON auto_drafts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_drafts_created_at ON auto_drafts(created_at DESC);

-- Draft Orders Table (for transparency and record keeping)
CREATE TABLE IF NOT EXISTS draft_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES auto_drafts(id) ON DELETE CASCADE,
    draft_order JSONB NOT NULL, -- Array of team IDs in draft order
    randomization_seed VARCHAR(100) NULL, -- For reproducible randomization
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by VARCHAR(20) NOT NULL DEFAULT 'system'
);

-- Indexes for draft orders
CREATE INDEX IF NOT EXISTS idx_draft_orders_league_id ON draft_orders(league_id);
CREATE INDEX IF NOT EXISTS idx_draft_orders_draft_id ON draft_orders(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_orders_generated_at ON draft_orders(generated_at DESC);

-- Team Draft Personalities Table
CREATE TABLE IF NOT EXISTS draft_personalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES auto_drafts(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    strategy VARCHAR(20) NOT NULL CHECK (strategy IN ('value_based', 'positional', 'contrarian', 'safe', 'aggressive', 'balanced')),
    risk_tolerance DECIMAL(3,2) NOT NULL CHECK (risk_tolerance >= 0 AND risk_tolerance <= 1),
    position_preferences JSONB NOT NULL DEFAULT '{}',
    target_players JSONB DEFAULT '[]',
    avoid_players JSONB DEFAULT '[]',
    personality_traits JSONB NOT NULL DEFAULT '{}',
    draft_notes JSONB DEFAULT '[]',
    ai_generated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to ensure one personality per team per draft
    CONSTRAINT idx_draft_personalities_unique UNIQUE (draft_id, team_id)
);

-- Indexes for draft personalities
CREATE INDEX IF NOT EXISTS idx_draft_personalities_draft_id ON draft_personalities(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_personalities_team_id ON draft_personalities(team_id);
CREATE INDEX IF NOT EXISTS idx_draft_personalities_strategy ON draft_personalities(strategy);
CREATE INDEX IF NOT EXISTS idx_draft_personalities_risk ON draft_personalities(risk_tolerance DESC);

-- Draft Picks Table (detailed record of each pick)
CREATE TABLE IF NOT EXISTS draft_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES auto_drafts(id) ON DELETE CASCADE,
    pick_number INT NOT NULL,
    round_number INT NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player_name VARCHAR(100) NULL, -- Snapshot in case player is deleted
    position VARCHAR(10) NOT NULL,
    pick_time_seconds INT NOT NULL DEFAULT 30,
    ai_confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    alternative_options JSONB DEFAULT '[]', -- Array of other players considered
    reasoning TEXT NOT NULL,
    value_score DECIMAL(5,3) DEFAULT 0,
    positional_rank INT DEFAULT 0,
    overall_rank INT DEFAULT 0,
    adp_differential INT DEFAULT 0, -- How far from ADP this player was picked
    pick_made_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to ensure no duplicate picks
    CONSTRAINT idx_draft_picks_unique UNIQUE (draft_id, pick_number)
);

-- Indexes for draft picks
CREATE INDEX IF NOT EXISTS idx_draft_picks_draft_id ON draft_picks(draft_id, pick_number);
CREATE INDEX IF NOT EXISTS idx_draft_picks_team_id ON draft_picks(team_id, round_number);
CREATE INDEX IF NOT EXISTS idx_draft_picks_player_id ON draft_picks(player_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_position ON draft_picks(position, round_number);
CREATE INDEX IF NOT EXISTS idx_draft_picks_made_at ON draft_picks(pick_made_at DESC);

-- Player Draft Evaluations Table (AI assessments)
CREATE TABLE IF NOT EXISTS player_draft_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES auto_drafts(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    overall_value DECIMAL(5,3) NOT NULL CHECK (overall_value >= 0 AND overall_value <= 1),
    positional_value DECIMAL(5,3) NOT NULL CHECK (positional_value >= 0 AND positional_value <= 1),
    injury_risk DECIMAL(5,3) NOT NULL CHECK (injury_risk >= 0 AND injury_risk <= 1),
    upside_score DECIMAL(5,3) NOT NULL CHECK (upside_score >= 0 AND upside_score <= 1),
    floor_score DECIMAL(5,3) NOT NULL CHECK (floor_score >= 0 AND floor_score <= 1),
    consistency_score DECIMAL(5,3) NOT NULL CHECK (consistency_score >= 0 AND consistency_score <= 1),
    breakout_probability DECIMAL(5,3) DEFAULT 0,
    bust_probability DECIMAL(5,3) DEFAULT 0,
    sleeper_probability DECIMAL(5,3) DEFAULT 0,
    ai_notes TEXT NULL,
    evaluation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to ensure one evaluation per player per draft
    CONSTRAINT idx_player_evaluations_unique UNIQUE (draft_id, player_id)
);

-- Indexes for player evaluations
CREATE INDEX IF NOT EXISTS idx_player_evaluations_draft_id ON player_draft_evaluations(draft_id);
CREATE INDEX IF NOT EXISTS idx_player_evaluations_player_id ON player_draft_evaluations(player_id);
CREATE INDEX IF NOT EXISTS idx_player_evaluations_overall_value ON player_draft_evaluations(overall_value DESC);
CREATE INDEX IF NOT EXISTS idx_player_evaluations_upside ON player_draft_evaluations(upside_score DESC);
CREATE INDEX IF NOT EXISTS idx_player_evaluations_sleeper ON player_draft_evaluations(sleeper_probability DESC);

-- Draft Position Tiers Table (for tier-based drafting)
CREATE TABLE IF NOT EXISTS draft_position_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES auto_drafts(id) ON DELETE CASCADE,
    position VARCHAR(10) NOT NULL,
    tier_number INT NOT NULL,
    tier_name VARCHAR(50) NULL,
    player_ids JSONB NOT NULL DEFAULT '[]', -- Array of player IDs in this tier
    tier_floor DECIMAL(5,3) NOT NULL, -- Minimum value for this tier
    tier_ceiling DECIMAL(5,3) NOT NULL, -- Maximum value for this tier
    player_count INT GENERATED ALWAYS AS (jsonb_array_length(player_ids)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate tiers
    CONSTRAINT idx_position_tiers_unique UNIQUE (draft_id, position, tier_number)
);

-- Indexes for position tiers
CREATE INDEX IF NOT EXISTS idx_position_tiers_draft_id ON draft_position_tiers(draft_id);
CREATE INDEX IF NOT EXISTS idx_position_tiers_position ON draft_position_tiers(position, tier_number);
CREATE INDEX IF NOT EXISTS idx_position_tiers_tier_number ON draft_position_tiers(tier_number);

-- Draft Strategy Analytics Table (performance tracking)
CREATE TABLE IF NOT EXISTS draft_strategy_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES auto_drafts(id) ON DELETE CASCADE,
    strategy VARCHAR(20) NOT NULL,
    team_count INT NOT NULL DEFAULT 1,
    avg_pick_time DECIMAL(5,2) NOT NULL,
    avg_confidence DECIMAL(3,2) NOT NULL,
    position_distribution JSONB NOT NULL DEFAULT '{}',
    value_captured DECIMAL(5,2) NOT NULL DEFAULT 0, -- Total value relative to ADP
    risk_level DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    upside_potential DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    floor_rating DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    strategy_adherence DECIMAL(3,2) NOT NULL DEFAULT 1.0, -- How well strategy was followed
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint for one analysis per strategy per draft
    CONSTRAINT idx_strategy_analytics_unique UNIQUE (draft_id, strategy)
);

-- Indexes for strategy analytics
CREATE INDEX IF NOT EXISTS idx_strategy_analytics_draft_id ON draft_strategy_analytics(draft_id);
CREATE INDEX IF NOT EXISTS idx_strategy_analytics_strategy ON draft_strategy_analytics(strategy);
CREATE INDEX IF NOT EXISTS idx_strategy_analytics_value ON draft_strategy_analytics(value_captured DESC);

-- Draft Recommendation Engine Table (AI suggestions)
CREATE TABLE IF NOT EXISTS draft_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES auto_drafts(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    pick_number INT NOT NULL,
    recommended_players JSONB NOT NULL DEFAULT '[]', -- Ordered array of recommended player IDs
    reasoning JSONB NOT NULL DEFAULT '{}', -- Detailed reasoning for each recommendation
    roster_needs JSONB NOT NULL DEFAULT '{}',
    draft_context JSONB NOT NULL DEFAULT '{}', -- Available players, tier breaks, etc.
    confidence_scores JSONB NOT NULL DEFAULT '{}', -- Confidence for each recommendation
    alternative_strategies JSONB DEFAULT '[]', -- Other viable approaches
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used BOOLEAN NOT NULL DEFAULT false,
    actual_pick UUID REFERENCES players(id) ON DELETE SET NULL,
    
    -- Unique constraint for one recommendation per team per pick
    CONSTRAINT idx_draft_recommendations_unique UNIQUE (draft_id, team_id, pick_number)
);

-- Indexes for draft recommendations
CREATE INDEX IF NOT EXISTS idx_draft_recommendations_draft_team ON draft_recommendations(draft_id, team_id);
CREATE INDEX IF NOT EXISTS idx_draft_recommendations_pick ON draft_recommendations(pick_number);
CREATE INDEX IF NOT EXISTS idx_draft_recommendations_generated_at ON draft_recommendations(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_draft_recommendations_used ON draft_recommendations(used);

-- =============================================
-- Functions and Procedures
-- =============================================

-- Function to calculate draft grade for a team
CREATE OR REPLACE FUNCTION calculate_draft_grade(p_draft_id UUID, p_team_id UUID)
RETURNS TABLE(
    overall_grade DECIMAL,
    position_grades JSONB,
    value_score DECIMAL,
    needs_filled DECIMAL,
    risk_assessment VARCHAR
) AS $$
DECLARE
    total_value DECIMAL := 0;
    total_picks INT := 0;
    position_scores JSONB := '{}';
    needs_score DECIMAL := 0;
    risk_score DECIMAL := 0;
BEGIN
    -- Calculate overall value captured
    SELECT 
        COALESCE(SUM(dp.value_score), 0),
        COUNT(*)
    INTO total_value, total_picks
    FROM draft_picks dp
    WHERE dp.draft_id = p_draft_id AND dp.team_id = p_team_id;

    -- Calculate position distribution scores
    WITH position_analysis AS (
        SELECT 
            dp.position,
            COUNT(*) as picks,
            AVG(pde.positional_value) as avg_positional_value,
            AVG(pde.upside_score) as avg_upside,
            AVG(pde.injury_risk) as avg_risk
        FROM draft_picks dp
        JOIN player_draft_evaluations pde ON dp.player_id = pde.player_id 
            AND dp.draft_id = pde.draft_id
        WHERE dp.draft_id = p_draft_id AND dp.team_id = p_team_id
        GROUP BY dp.position
    )
    SELECT jsonb_object_agg(
        position, 
        jsonb_build_object(
            'picks', picks,
            'avg_value', ROUND(avg_positional_value::NUMERIC, 3),
            'avg_upside', ROUND(avg_upside::NUMERIC, 3),
            'avg_risk', ROUND(avg_risk::NUMERIC, 3),
            'grade', CASE 
                WHEN avg_positional_value >= 0.8 THEN 'A'
                WHEN avg_positional_value >= 0.6 THEN 'B'
                WHEN avg_positional_value >= 0.4 THEN 'C'
                WHEN avg_positional_value >= 0.2 THEN 'D'
                ELSE 'F'
            END
        )
    )
    INTO position_scores
    FROM position_analysis;

    -- Calculate needs fulfillment
    -- This would analyze if essential positions were filled appropriately
    needs_score := LEAST(1.0, total_picks / 15.0); -- Simplified

    -- Calculate risk assessment
    SELECT AVG(pde.injury_risk)
    INTO risk_score
    FROM draft_picks dp
    JOIN player_draft_evaluations pde ON dp.player_id = pde.player_id 
        AND dp.draft_id = pde.draft_id
    WHERE dp.draft_id = p_draft_id AND dp.team_id = p_team_id;

    -- Return results
    RETURN QUERY SELECT 
        CASE 
            WHEN total_picks = 0 THEN 0::DECIMAL
            ELSE LEAST(1.0, total_value / total_picks)
        END as overall_grade,
        COALESCE(position_scores, '{}'::JSONB) as position_grades,
        COALESCE(total_value, 0) as value_score,
        COALESCE(needs_score, 0) as needs_filled,
        CASE 
            WHEN risk_score IS NULL THEN 'unknown'
            WHEN risk_score <= 0.3 THEN 'low'
            WHEN risk_score <= 0.6 THEN 'moderate'
            ELSE 'high'
        END as risk_assessment;
END;
$$ LANGUAGE plpgsql;

-- Function to generate draft recap statistics
CREATE OR REPLACE FUNCTION generate_draft_recap(p_draft_id UUID)
RETURNS TABLE(
    draft_summary JSONB,
    team_summaries JSONB,
    position_analysis JSONB,
    strategy_performance JSONB,
    notable_picks JSONB
) AS $$
DECLARE
    recap_data JSONB;
    team_data JSONB;
    position_data JSONB;
    strategy_data JSONB;
    notable_data JSONB;
BEGIN
    -- Draft summary
    WITH draft_stats AS (
        SELECT 
            COUNT(*) as total_picks,
            AVG(pick_time_seconds) as avg_pick_time,
            AVG(ai_confidence) as avg_confidence,
            MIN(pick_made_at) as draft_start,
            MAX(pick_made_at) as draft_end
        FROM draft_picks
        WHERE draft_id = p_draft_id
    )
    SELECT jsonb_build_object(
        'total_picks', total_picks,
        'avg_pick_time', ROUND(avg_pick_time::NUMERIC, 1),
        'avg_confidence', ROUND(avg_confidence::NUMERIC, 3),
        'draft_duration_minutes', EXTRACT(EPOCH FROM (draft_end - draft_start)) / 60,
        'draft_start', draft_start,
        'draft_end', draft_end
    )
    INTO recap_data
    FROM draft_stats;

    -- Team summaries
    WITH team_stats AS (
        SELECT 
            t.id as team_id,
            t.team_name,
            COUNT(dp.id) as picks_made,
            AVG(dp.ai_confidence) as avg_confidence,
            AVG(dp.pick_time_seconds) as avg_pick_time,
            (SELECT strategy FROM draft_personalities WHERE team_id = t.id AND draft_id = p_draft_id) as strategy
        FROM teams t
        LEFT JOIN draft_picks dp ON t.id = dp.team_id AND dp.draft_id = p_draft_id
        WHERE t.id IN (
            SELECT DISTINCT team_id FROM draft_picks WHERE draft_id = p_draft_id
        )
        GROUP BY t.id, t.team_name
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'team_id', team_id,
            'team_name', team_name,
            'strategy', strategy,
            'picks_made', picks_made,
            'avg_confidence', ROUND(avg_confidence::NUMERIC, 3),
            'avg_pick_time', ROUND(avg_pick_time::NUMERIC, 1)
        )
    )
    INTO team_data
    FROM team_stats;

    -- Position analysis
    WITH position_stats AS (
        SELECT 
            position,
            COUNT(*) as total_picks,
            AVG(pick_number) as avg_pick_number,
            MIN(pick_number) as first_pick,
            MAX(pick_number) as last_pick,
            COUNT(DISTINCT team_id) as teams_drafting
        FROM draft_picks
        WHERE draft_id = p_draft_id
        GROUP BY position
    )
    SELECT jsonb_object_agg(
        position,
        jsonb_build_object(
            'total_picks', total_picks,
            'avg_pick', ROUND(avg_pick_number::NUMERIC, 1),
            'first_pick', first_pick,
            'last_pick', last_pick,
            'teams_drafting', teams_drafting
        )
    )
    INTO position_data
    FROM position_stats;

    -- Strategy performance
    SELECT jsonb_agg(
        jsonb_build_object(
            'strategy', strategy,
            'team_count', team_count,
            'avg_confidence', avg_confidence,
            'value_captured', value_captured,
            'risk_level', risk_level
        )
    )
    INTO strategy_data
    FROM draft_strategy_analytics
    WHERE draft_id = p_draft_id;

    -- Notable picks (biggest steals/reaches)
    WITH notable_picks AS (
        SELECT 
            dp.*,
            t.team_name,
            ABS(dp.adp_differential) as differential_abs,
            CASE 
                WHEN dp.adp_differential > 20 THEN 'reach'
                WHEN dp.adp_differential < -20 THEN 'steal'
                ELSE 'fair'
            END as pick_type
        FROM draft_picks dp
        JOIN teams t ON dp.team_id = t.id
        WHERE dp.draft_id = p_draft_id
          AND ABS(dp.adp_differential) > 15
        ORDER BY differential_abs DESC
        LIMIT 10
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'player_name', player_name,
            'team_name', team_name,
            'pick_number', pick_number,
            'position', position,
            'adp_differential', adp_differential,
            'pick_type', pick_type,
            'reasoning', reasoning
        )
    )
    INTO notable_data
    FROM notable_picks;

    -- Return all results
    RETURN QUERY SELECT 
        COALESCE(recap_data, '{}'::JSONB),
        COALESCE(team_data, '[]'::JSONB),
        COALESCE(position_data, '{}'::JSONB),
        COALESCE(strategy_data, '[]'::JSONB),
        COALESCE(notable_data, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Function to analyze draft efficiency
CREATE OR REPLACE FUNCTION analyze_draft_efficiency(p_draft_id UUID)
RETURNS TABLE(
    pick_number INT,
    round_number INT,
    efficiency_score DECIMAL,
    value_available DECIMAL,
    tier_breaks INT,
    optimal_positions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH pick_analysis AS (
        SELECT 
            dp.pick_number,
            dp.round_number,
            dp.team_id,
            pde.overall_value,
            -- Calculate how much value was left on board
            (
                SELECT MAX(pde2.overall_value) 
                FROM player_draft_evaluations pde2
                WHERE pde2.draft_id = p_draft_id 
                  AND pde2.player_id NOT IN (
                      SELECT player_id 
                      FROM draft_picks dp2 
                      WHERE dp2.draft_id = p_draft_id 
                        AND dp2.pick_number <= dp.pick_number
                        AND dp2.player_id IS NOT NULL
                  )
            ) as best_available_value,
            -- Count tier breaks at this pick
            (
                SELECT COUNT(DISTINCT tier_number)
                FROM draft_position_tiers dpt
                WHERE dpt.draft_id = p_draft_id
                  AND dpt.tier_floor <= pde.overall_value
                  AND dpt.tier_ceiling >= pde.overall_value
            ) as tier_breaks
        FROM draft_picks dp
        JOIN player_draft_evaluations pde ON dp.player_id = pde.player_id 
            AND dp.draft_id = pde.draft_id
        WHERE dp.draft_id = p_draft_id
        ORDER BY dp.pick_number
    )
    SELECT 
        pa.pick_number,
        pa.round_number,
        CASE 
            WHEN pa.best_available_value = 0 THEN 1.0
            ELSE LEAST(1.0, pa.overall_value / pa.best_available_value)
        END as efficiency_score,
        COALESCE(pa.best_available_value, 0) as value_available,
        pa.tier_breaks,
        ARRAY[]::TEXT[] as optimal_positions -- Simplified for now
    FROM pick_analysis pa;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Triggers and Automation
-- =============================================

-- Trigger to update draft timestamps
CREATE OR REPLACE FUNCTION update_auto_drafts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Set started_at when status changes to 'active'
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        NEW.started_at = NOW();
    END IF;
    
    -- Set completed_at when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_auto_drafts_timestamp ON auto_drafts;
CREATE TRIGGER trigger_update_auto_drafts_timestamp
    BEFORE UPDATE ON auto_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_auto_drafts_timestamp();

-- Trigger to calculate analytics after draft completion
CREATE OR REPLACE FUNCTION trigger_draft_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run when draft is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Calculate strategy analytics for each strategy used
        INSERT INTO draft_strategy_analytics (
            draft_id, strategy, team_count, avg_pick_time, avg_confidence,
            position_distribution, value_captured, risk_level, upside_potential
        )
        SELECT 
            NEW.id,
            dp_stats.strategy,
            dp_stats.team_count,
            dp_stats.avg_pick_time,
            dp_stats.avg_confidence,
            dp_stats.position_distribution,
            dp_stats.avg_value,
            dp_stats.avg_risk,
            dp_stats.avg_upside
        FROM (
            SELECT 
                dp.strategy,
                COUNT(DISTINCT dpi.team_id) as team_count,
                AVG(dpi.pick_time_seconds) as avg_pick_time,
                AVG(dpi.ai_confidence) as avg_confidence,
                jsonb_object_agg(dpi.position, position_counts.cnt) as position_distribution,
                AVG(pde.overall_value) as avg_value,
                AVG(pde.injury_risk) as avg_risk,
                AVG(pde.upside_score) as avg_upside
            FROM draft_personalities dp
            JOIN draft_picks dpi ON dp.team_id = dpi.team_id AND dp.draft_id = dpi.draft_id
            JOIN player_draft_evaluations pde ON dpi.player_id = pde.player_id 
                AND dpi.draft_id = pde.draft_id
            LEFT JOIN LATERAL (
                SELECT COUNT(*) as cnt
                FROM draft_picks dpi2
                WHERE dpi2.team_id = dpi.team_id 
                  AND dpi2.draft_id = dpi.draft_id
                  AND dpi2.position = dpi.position
            ) position_counts ON true
            WHERE dp.draft_id = NEW.id
            GROUP BY dp.strategy
        ) dp_stats
        ON CONFLICT (draft_id, strategy) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_draft_analytics ON auto_drafts;
CREATE TRIGGER trigger_draft_analytics
    AFTER UPDATE ON auto_drafts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_draft_analytics();

-- =============================================
-- Views for Common Queries
-- =============================================

-- View for active drafts
CREATE OR REPLACE VIEW active_auto_drafts AS
SELECT 
    ad.*,
    l.name as league_name,
    (
        SELECT COUNT(*) 
        FROM draft_picks dp 
        WHERE dp.draft_id = ad.id
    ) as picks_completed,
    (
        SELECT COUNT(*) * (
            SELECT jsonb_array_length(
                COALESCE(ad.draft_state->'config'->>'rounds', '15')::jsonb
            )
        )
        FROM draft_personalities dp 
        WHERE dp.draft_id = ad.id
    ) as total_picks_needed
FROM auto_drafts ad
JOIN leagues l ON ad.league_id = l.id
WHERE ad.status IN ('active', 'paused')
ORDER BY ad.created_at DESC;

-- View for draft leaderboards
CREATE OR REPLACE VIEW draft_leaderboards AS
WITH team_grades AS (
    SELECT 
        ad.id as draft_id,
        ad.league_id,
        l.name as league_name,
        dp.team_id,
        t.team_name,
        dp.strategy,
        dg.overall_grade,
        dg.value_score,
        dg.risk_assessment,
        RANK() OVER (PARTITION BY ad.id ORDER BY dg.overall_grade DESC) as grade_rank,
        RANK() OVER (PARTITION BY ad.id ORDER BY dg.value_score DESC) as value_rank
    FROM auto_drafts ad
    JOIN leagues l ON ad.league_id = l.id
    JOIN draft_personalities dp ON ad.id = dp.draft_id
    JOIN teams t ON dp.team_id = t.id
    CROSS JOIN LATERAL calculate_draft_grade(ad.id, dp.team_id) dg
    WHERE ad.status = 'completed'
)
SELECT 
    *,
    CASE 
        WHEN grade_rank = 1 THEN 'Best Overall'
        WHEN value_rank = 1 THEN 'Best Value'
        WHEN grade_rank <= 3 THEN 'Top 3'
        ELSE 'Participant'
    END as performance_tier
FROM team_grades
ORDER BY draft_id DESC, grade_rank ASC;

-- =============================================
-- Sample Data and Configuration
-- =============================================

-- Insert default draft personality templates
INSERT INTO draft_personalities (
    draft_id, team_id, user_id, strategy, risk_tolerance, 
    position_preferences, personality_traits, draft_notes, ai_generated
) 
SELECT 
    '00000000-0000-0000-0000-000000000000'::UUID, -- Template draft ID
    '00000000-0000-0000-0000-000000000000'::UUID, -- Template team ID
    NULL,
    strategy_name,
    risk_val,
    preferences,
    traits,
    notes,
    true
FROM (VALUES
    ('value_based', 0.3, 
     '{"QB": 0.15, "RB": 0.35, "WR": 0.35, "TE": 0.10, "K": 0.02, "DST": 0.03}',
     '{"veteranBias": true, "consistencyFocused": true, "injuryAverse": true}',
     '["Focus on proven value", "Avoid reaches", "Target consistent producers"]'),
    ('positional', 0.6,
     '{"QB": 0.10, "RB": 0.45, "WR": 0.30, "TE": 0.10, "K": 0.02, "DST": 0.03}',
     '{"handcuffsLover": true, "upside_chaser": true}',
     '["RB early and often", "Build positional depth", "Don''t chase QBs"]'),
    ('aggressive', 0.9,
     '{"QB": 0.10, "RB": 0.40, "WR": 0.35, "TE": 0.10, "K": 0.02, "DST": 0.03}',
     '{"rookieFocused": true, "sleperHunter": true, "upside_chaser": true}',
     '["Swing for the fences", "Target breakouts", "High risk high reward"]')
) AS templates(strategy_name, risk_val, preferences, traits, notes)
WHERE NOT EXISTS (
    SELECT 1 FROM draft_personalities 
    WHERE draft_id = '00000000-0000-0000-0000-000000000000'::UUID
);

-- =============================================
-- Performance Indexes
-- =============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_draft_picks_comprehensive ON draft_picks(draft_id, team_id, round_number, pick_number);
CREATE INDEX IF NOT EXISTS idx_player_evaluations_comprehensive ON player_draft_evaluations(draft_id, overall_value DESC, positional_value DESC);
CREATE INDEX IF NOT EXISTS idx_draft_personalities_comprehensive ON draft_personalities(draft_id, strategy, risk_tolerance);

-- Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_active_auto_drafts ON auto_drafts(league_id, created_at DESC) WHERE status IN ('active', 'paused');
CREATE INDEX IF NOT EXISTS idx_completed_auto_drafts ON auto_drafts(completed_at DESC) WHERE status = 'completed';

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON TABLE auto_drafts IS 'Configuration and state tracking for intelligent auto-draft sessions';
COMMENT ON TABLE draft_orders IS 'Transparent record of draft order generation for each draft';
COMMENT ON TABLE draft_personalities IS 'AI-generated personalities and strategies for each team in auto-drafts';
COMMENT ON TABLE draft_picks IS 'Detailed record of every pick made during auto-drafts';
COMMENT ON TABLE player_draft_evaluations IS 'AI assessments and valuations of players for draft purposes';
COMMENT ON TABLE draft_position_tiers IS 'Position-based tiers for tier-based drafting strategies';
COMMENT ON TABLE draft_strategy_analytics IS 'Performance analytics for different drafting strategies';
COMMENT ON TABLE draft_recommendations IS 'AI-generated pick recommendations for each draft decision';

COMMENT ON FUNCTION calculate_draft_grade(UUID, UUID) IS 'Calculates comprehensive draft grade for a team';
COMMENT ON FUNCTION generate_draft_recap(UUID) IS 'Generates complete draft recap with statistics and analysis';
COMMENT ON FUNCTION analyze_draft_efficiency(UUID) IS 'Analyzes pick efficiency and value capture throughout draft';

COMMENT ON VIEW active_auto_drafts IS 'Real-time view of ongoing auto-draft sessions with progress tracking';
COMMENT ON VIEW draft_leaderboards IS 'Performance rankings and grades for completed drafts';