-- Trade Analysis Tables for Phase 5: Advanced Trade Intelligence
-- Tables for comprehensive multi-dimensional trade analysis with playoff impact modeling

-- Trade Evaluations Table
-- Stores comprehensive analysis for each trade proposal
CREATE TABLE IF NOT EXISTS trade_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    
    -- Overall Assessment
    fairness_score DECIMAL(5,2) NOT NULL CHECK (fairness_score >= 0 AND fairness_score <= 100),
    overall_rating VARCHAR(20) NOT NULL CHECK (overall_rating IN ('excellent', 'good', 'fair', 'poor', 'terrible')),
    confidence_level DECIMAL(5,2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
    
    -- Value Analysis
    value_gap DECIMAL(10,2) NOT NULL,
    immediate_value_delta DECIMAL(10,2) NOT NULL,
    rest_of_season_value_delta DECIMAL(10,2) NOT NULL,
    dynasty_value_delta DECIMAL(10,2),
    
    -- Team Impact Scores
    proposing_team_impact JSONB NOT NULL DEFAULT '{}',
    receiving_team_impact JSONB NOT NULL DEFAULT '{}',
    
    -- Playoff Impact Analysis
    proposing_team_playoff_prob_change DECIMAL(5,2),
    receiving_team_playoff_prob_change DECIMAL(5,2),
    proposing_team_championship_prob_change DECIMAL(5,2),
    receiving_team_championship_prob_change DECIMAL(5,2),
    
    -- Detailed Analysis (50+ data points)
    analysis_dimensions JSONB NOT NULL DEFAULT '{}',
    
    -- Recommendations
    recommendation VARCHAR(20) NOT NULL CHECK (recommendation IN ('accept_now', 'negotiate', 'wait', 'reject')),
    counter_offer_suggestions JSONB DEFAULT '[]',
    key_insights TEXT[],
    
    -- Market Context
    similar_trades JSONB DEFAULT '[]',
    market_timing_assessment VARCHAR(20) CHECK (market_timing_assessment IN ('buy_low', 'sell_high', 'neutral', 'hold')),
    
    -- Metadata
    ai_provider VARCHAR(50),
    ai_confidence DECIMAL(5,2),
    analysis_version VARCHAR(10) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Player Valuations Table
-- Real-time player valuations with multiple scoring dimensions
CREATE TABLE IF NOT EXISTS player_valuations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    
    -- Current Values
    current_value DECIMAL(10,2) NOT NULL,
    rest_of_season_value DECIMAL(10,2) NOT NULL,
    playoff_weeks_value DECIMAL(10,2) NOT NULL,
    dynasty_value DECIMAL(10,2),
    
    -- Positional Adjustments
    position_scarcity_multiplier DECIMAL(5,3) DEFAULT 1.0,
    replacement_level_delta DECIMAL(10,2),
    
    -- Performance Metrics
    consistency_score DECIMAL(5,2) CHECK (consistency_score >= 0 AND consistency_score <= 100),
    upside_score DECIMAL(5,2) CHECK (upside_score >= 0 AND upside_score <= 100),
    floor_score DECIMAL(5,2) CHECK (floor_score >= 0 AND floor_score <= 100),
    
    -- Risk Factors
    injury_risk_score DECIMAL(5,2) CHECK (injury_risk_score >= 0 AND injury_risk_score <= 100),
    volatility_score DECIMAL(5,2) CHECK (volatility_score >= 0 AND volatility_score <= 100),
    
    -- Schedule Analysis
    schedule_strength_remaining DECIMAL(5,2),
    playoff_schedule_strength DECIMAL(5,2),
    matchup_advantages JSONB DEFAULT '{}',
    
    -- Trend Analysis
    value_trend VARCHAR(20) CHECK (value_trend IN ('rising_fast', 'rising', 'stable', 'declining', 'declining_fast')),
    momentum_score DECIMAL(5,2),
    
    -- Context Factors
    team_offense_rating DECIMAL(5,2),
    offensive_line_rating DECIMAL(5,2),
    quarterback_rating DECIMAL(5,2), -- For pass catchers
    game_script_projection VARCHAR(20),
    
    -- Historical Performance
    playoff_performance_history JSONB DEFAULT '{}',
    prime_time_performance JSONB DEFAULT '{}',
    weather_impact_analysis JSONB DEFAULT '{}',
    
    -- Metadata
    last_calculated TIMESTAMP DEFAULT NOW(),
    calculation_version VARCHAR(10) DEFAULT '1.0',
    data_quality_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trade Fairness Scores Table
-- Detailed fairness assessment across multiple dimensions
CREATE TABLE IF NOT EXISTS trade_fairness_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_evaluation_id UUID NOT NULL REFERENCES trade_evaluations(id) ON DELETE CASCADE,
    
    -- Core Fairness Metrics
    overall_fairness DECIMAL(5,2) NOT NULL CHECK (overall_fairness >= 0 AND overall_fairness <= 100),
    value_balance DECIMAL(5,2) CHECK (value_balance >= 0 AND value_balance <= 100),
    need_fulfillment_balance DECIMAL(5,2) CHECK (need_fulfillment_balance >= 0 AND need_fulfillment_balance <= 100),
    risk_balance DECIMAL(5,2) CHECK (risk_balance >= 0 AND risk_balance <= 100),
    
    -- Position-Specific Balance
    position_value_balance JSONB NOT NULL DEFAULT '{}',
    
    -- Timing Factors
    immediate_impact_balance DECIMAL(5,2),
    long_term_balance DECIMAL(5,2),
    playoff_impact_balance DECIMAL(5,2),
    
    -- Context Adjustments
    league_context_adjustment DECIMAL(5,2) DEFAULT 0,
    team_standings_adjustment DECIMAL(5,2) DEFAULT 0,
    roster_construction_adjustment DECIMAL(5,2) DEFAULT 0,
    
    -- Component Scores (50+ data points)
    component_scores JSONB NOT NULL DEFAULT '{}',
    
    -- Explanation
    fairness_breakdown TEXT[],
    imbalance_factors TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trade History Analytics Table
-- Historical trade outcomes for learning and improvement
CREATE TABLE IF NOT EXISTS trade_history_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    trade_evaluation_id UUID REFERENCES trade_evaluations(id) ON DELETE SET NULL,
    
    -- Pre-Trade Predictions
    predicted_proposing_team_benefit DECIMAL(10,2),
    predicted_receiving_team_benefit DECIMAL(10,2),
    predicted_fairness DECIMAL(5,2),
    
    -- Actual Outcomes (calculated post-trade)
    actual_proposing_team_benefit DECIMAL(10,2),
    actual_receiving_team_benefit DECIMAL(10,2),
    actual_fairness DECIMAL(5,2),
    
    -- Performance Tracking
    weeks_since_trade INTEGER,
    proposing_team_record_since JSONB DEFAULT '{}',
    receiving_team_record_since JSONB DEFAULT '{}',
    
    -- Player Performance Since Trade
    traded_players_performance JSONB DEFAULT '{}',
    
    -- Accuracy Metrics
    prediction_accuracy DECIMAL(5,2),
    value_prediction_error DECIMAL(10,2),
    
    -- Learning Insights
    key_learnings TEXT[],
    model_adjustments JSONB DEFAULT '{}',
    
    evaluated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Player Trade Market Table
-- Track player trade market activity and trends
CREATE TABLE IF NOT EXISTS player_trade_market (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    
    -- Market Activity
    trade_interest_level VARCHAR(20) CHECK (trade_interest_level IN ('very_high', 'high', 'moderate', 'low', 'none')),
    times_traded INTEGER DEFAULT 0,
    times_offered INTEGER DEFAULT 0,
    times_requested INTEGER DEFAULT 0,
    
    -- Value Trends
    avg_trade_value DECIMAL(10,2),
    value_volatility DECIMAL(5,2),
    peak_value DECIMAL(10,2),
    peak_value_date DATE,
    trough_value DECIMAL(10,2),
    trough_value_date DATE,
    
    -- Common Trade Partners
    commonly_traded_with JSONB DEFAULT '[]',
    commonly_traded_for JSONB DEFAULT '[]',
    
    -- Market Sentiment
    sentiment_score DECIMAL(5,2),
    buy_sell_ratio DECIMAL(5,2),
    
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trade Package Templates Table
-- Store successful trade package patterns
CREATE TABLE IF NOT EXISTS trade_package_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    
    -- Template Info
    template_name VARCHAR(255),
    template_type VARCHAR(50) CHECK (template_type IN ('2_for_1', '3_for_2', 'blockbuster', 'buy_low', 'sell_high', 'position_swap')),
    
    -- Package Structure
    giving_positions VARCHAR(10)[],
    receiving_positions VARCHAR(10)[],
    value_range_min DECIMAL(10,2),
    value_range_max DECIMAL(10,2),
    
    -- Success Metrics
    times_used INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    avg_fairness_score DECIMAL(5,2),
    
    -- Context
    ideal_timing VARCHAR(50),
    team_situation_tags TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trade_evaluations_trade_id ON trade_evaluations(trade_id);
CREATE INDEX idx_trade_evaluations_league_id ON trade_evaluations(league_id);
CREATE INDEX idx_trade_evaluations_fairness ON trade_evaluations(fairness_score);
CREATE INDEX idx_trade_evaluations_created ON trade_evaluations(created_at DESC);

CREATE INDEX idx_player_valuations_player_id ON player_valuations(player_id);
CREATE INDEX idx_player_valuations_league_id ON player_valuations(league_id);
CREATE INDEX idx_player_valuations_value ON player_valuations(current_value DESC);
CREATE INDEX idx_player_valuations_updated ON player_valuations(updated_at DESC);

CREATE INDEX idx_trade_fairness_evaluation ON trade_fairness_scores(trade_evaluation_id);
CREATE INDEX idx_trade_history_trade ON trade_history_analytics(trade_id);
CREATE INDEX idx_trade_market_player ON player_trade_market(player_id, league_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trade_evaluations_updated_at
    BEFORE UPDATE ON trade_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_valuations_updated_at
    BEFORE UPDATE ON player_valuations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_history_analytics_updated_at
    BEFORE UPDATE ON trade_history_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();