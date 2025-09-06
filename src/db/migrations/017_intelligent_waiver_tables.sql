-- Intelligent Waiver Processing Tables
-- Phase 6: Intelligent League Management

-- Enhanced waiver claims table with fairness tracking
ALTER TABLE waiver_claims 
ADD COLUMN IF NOT EXISTS bid_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS fairness_score DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS need_score DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS value_score DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS conflict_resolution_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS processing_batch_id UUID;

-- Waiver fairness tracking table
CREATE TABLE IF NOT EXISTS waiver_fairness_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES players(id),
    player_value DECIMAL(10, 2),
    acquisition_date TIMESTAMPTZ NOT NULL,
    success_rate_7d DECIMAL(5, 2),
    success_rate_30d DECIMAL(5, 2),
    total_acquisitions INTEGER DEFAULT 0,
    high_value_acquisitions INTEGER DEFAULT 0,
    monopolization_score DECIMAL(5, 2),
    fairness_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waiver value assessments table
CREATE TABLE IF NOT EXISTS waiver_value_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) NOT NULL,
    assessment_date DATE NOT NULL,
    base_value DECIMAL(10, 2),
    breakout_score DECIMAL(5, 2),
    replacement_value DECIMAL(10, 2),
    streaming_value DECIMAL(10, 2),
    dynasty_value DECIMAL(10, 2),
    scarcity_adjustment DECIMAL(5, 2),
    schedule_strength DECIMAL(5, 2),
    injury_impact DECIMAL(5, 2),
    overall_value DECIMAL(10, 2),
    confidence_score DECIMAL(5, 2),
    metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, assessment_date)
);

-- Waiver recommendations table
CREATE TABLE IF NOT EXISTS waiver_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES players(id) NOT NULL,
    recommendation_week INTEGER NOT NULL,
    recommendation_score DECIMAL(10, 2),
    bid_suggestion DECIMAL(10, 2),
    drop_candidates JSONB,
    reasoning TEXT,
    timing VARCHAR(20) CHECK (timing IN ('immediate', 'wait', 'monitor')),
    alternative_targets JSONB,
    was_claimed BOOLEAN DEFAULT FALSE,
    claim_successful BOOLEAN,
    actual_bid DECIMAL(10, 2),
    feedback_score DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waiver processing batches for tracking
CREATE TABLE IF NOT EXISTS waiver_processing_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
    processing_type VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_claims INTEGER DEFAULT 0,
    successful_claims INTEGER DEFAULT 0,
    failed_claims INTEGER DEFAULT 0,
    fairness_adjustments JSONB,
    processing_stats JSONB,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team waiver patterns for learning
CREATE TABLE IF NOT EXISTS team_waiver_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_data JSONB NOT NULL,
    frequency DECIMAL(5, 2),
    success_rate DECIMAL(5, 2),
    average_bid DECIMAL(10, 2),
    position_preferences JSONB,
    timing_preferences JSONB,
    last_observed TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waiver market analysis
CREATE TABLE IF NOT EXISTS waiver_market_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES players(id) NOT NULL,
    week INTEGER NOT NULL,
    market_value DECIMAL(10, 2),
    average_bid DECIMAL(10, 2),
    highest_bid DECIMAL(10, 2),
    lowest_bid DECIMAL(10, 2),
    total_claims INTEGER DEFAULT 0,
    successful_team_id UUID REFERENCES teams(id),
    position_rank INTEGER,
    overall_rank INTEGER,
    competition_level DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, player_id, week)
);

-- Player breakout tracking
CREATE TABLE IF NOT EXISTS player_breakout_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) NOT NULL,
    detection_date DATE NOT NULL,
    breakout_score DECIMAL(5, 2),
    age_factor DECIMAL(5, 2),
    opportunity_increase DECIMAL(5, 2),
    efficiency_improvement DECIMAL(5, 2),
    talent_score DECIMAL(5, 2),
    situation_change DECIMAL(5, 2),
    prediction_confidence DECIMAL(5, 2),
    actual_performance JSONB,
    prediction_accuracy DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, detection_date)
);

-- Waiver budget tracking (FAAB)
CREATE TABLE IF NOT EXISTS waiver_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
    season_year INTEGER NOT NULL,
    initial_budget DECIMAL(10, 2) DEFAULT 100,
    current_budget DECIMAL(10, 2) DEFAULT 100,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    largest_bid DECIMAL(10, 2),
    successful_bids INTEGER DEFAULT 0,
    failed_bids INTEGER DEFAULT 0,
    average_bid DECIMAL(10, 2),
    last_transaction_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, season_year)
);

-- Waiver configuration per league
CREATE TABLE IF NOT EXISTS waiver_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL UNIQUE,
    waiver_type VARCHAR(50) DEFAULT 'rolling' CHECK (waiver_type IN ('rolling', 'faab', 'reverse_standings', 'continual')),
    faab_budget DECIMAL(10, 2) DEFAULT 100,
    allow_zero_dollar_bids BOOLEAN DEFAULT TRUE,
    tiebreak_rule VARCHAR(50) DEFAULT 'priority' CHECK (tiebreak_rule IN ('priority', 'record', 'points_for', 'random')),
    fairness_mode VARCHAR(20) DEFAULT 'balanced' CHECK (fairness_mode IN ('strict', 'balanced', 'competitive')),
    monopolization_threshold DECIMAL(5, 2) DEFAULT 0.6,
    competitive_balance_weight DECIMAL(5, 2) DEFAULT 0.5,
    processing_schedule VARCHAR(50),
    auto_process BOOLEAN DEFAULT FALSE,
    min_bid_amount DECIMAL(10, 2) DEFAULT 0,
    continuous_waivers BOOLEAN DEFAULT FALSE,
    waiver_period_hours INTEGER DEFAULT 48,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_waiver_fairness_team ON waiver_fairness_tracking(team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_fairness_league ON waiver_fairness_tracking(league_id);
CREATE INDEX IF NOT EXISTS idx_waiver_value_player ON waiver_value_assessments(player_id);
CREATE INDEX IF NOT EXISTS idx_waiver_value_date ON waiver_value_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_waiver_rec_team ON waiver_recommendations(team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_rec_week ON waiver_recommendations(recommendation_week);
CREATE INDEX IF NOT EXISTS idx_waiver_market_league ON waiver_market_analysis(league_id, week);
CREATE INDEX IF NOT EXISTS idx_waiver_patterns_team ON team_waiver_patterns(team_id);
CREATE INDEX IF NOT EXISTS idx_breakout_player ON player_breakout_tracking(player_id);
CREATE INDEX IF NOT EXISTS idx_waiver_budget_team ON waiver_budgets(team_id, season_year);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_batch ON waiver_claims(processing_batch_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waiver_fairness_updated_at 
    BEFORE UPDATE ON waiver_fairness_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waiver_patterns_updated_at 
    BEFORE UPDATE ON team_waiver_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waiver_budgets_updated_at 
    BEFORE UPDATE ON waiver_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waiver_config_updated_at 
    BEFORE UPDATE ON waiver_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();