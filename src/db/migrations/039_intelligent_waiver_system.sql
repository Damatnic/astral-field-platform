-- Intelligent Waiver System Tables
-- Enhanced waiver processing with FAAB, rolling priorities, and advanced analytics

-- Enhanced waiver claims table (extending existing)
ALTER TABLE waiver_claims ADD COLUMN IF NOT EXISTS claim_order INTEGER;
ALTER TABLE waiver_claims ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP;
ALTER TABLE waiver_claims ADD COLUMN IF NOT EXISTS processing_priority DECIMAL(5,2);
ALTER TABLE waiver_claims ADD COLUMN IF NOT EXISTS tiebreaker_data JSONB DEFAULT '{}';
ALTER TABLE waiver_claims ADD COLUMN IF NOT EXISTS is_conditional BOOLEAN DEFAULT false;
ALTER TABLE waiver_claims ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}';

-- Waiver processing history
CREATE TABLE IF NOT EXISTS waiver_processing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    process_date DATE NOT NULL,
    processing_type VARCHAR(50) NOT NULL, -- weekly, daily, manual
    total_claims INTEGER DEFAULT 0,
    successful_claims INTEGER DEFAULT 0,
    failed_claims INTEGER DEFAULT 0,
    total_faab_spent INTEGER DEFAULT 0,
    players_processed INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    processing_details JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'completed', -- running, completed, failed
    INDEX idx_waiver_processing_league_date (league_id, process_date),
    INDEX idx_waiver_processing_status (status)
);

-- FAAB budget tracking per team
CREATE TABLE IF NOT EXISTS faab_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    season_year INTEGER NOT NULL,
    starting_budget INTEGER NOT NULL,
    current_budget INTEGER NOT NULL,
    total_spent INTEGER DEFAULT 0,
    successful_claims INTEGER DEFAULT 0,
    failed_claims INTEGER DEFAULT 0,
    largest_bid INTEGER DEFAULT 0,
    average_bid DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, team_id, season_year),
    INDEX idx_faab_budgets_league_season (league_id, season_year),
    INDEX idx_faab_budgets_team (team_id)
);

-- Waiver priority tracking for rolling waivers
CREATE TABLE IF NOT EXISTS waiver_priorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    current_priority INTEGER NOT NULL,
    last_successful_claim TIMESTAMP,
    total_successful_claims INTEGER DEFAULT 0,
    season_year INTEGER NOT NULL,
    priority_changes JSONB DEFAULT '[]', -- history of priority changes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, team_id, season_year),
    INDEX idx_waiver_priorities_league_priority (league_id, current_priority),
    INDEX idx_waiver_priorities_team (team_id)
);

-- Waiver wire analytics and insights
CREATE TABLE IF NOT EXISTS waiver_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    total_claims INTEGER DEFAULT 0,
    average_bid DECIMAL(8,2) DEFAULT 0,
    highest_bid INTEGER DEFAULT 0,
    winning_bid INTEGER DEFAULT 0,
    winning_team_id UUID REFERENCES teams(id),
    claim_competition_level VARCHAR(20), -- low, medium, high, extreme
    player_value_trend VARCHAR(20), -- rising, falling, stable, volatile
    waiver_priority_impact DECIMAL(5,2), -- how much this affects waiver priority
    recommendation_score DECIMAL(5,2), -- AI recommendation score
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waiver_analytics_league_week (league_id, week, season_year),
    INDEX idx_waiver_analytics_player (player_id),
    UNIQUE(league_id, player_id, week, season_year)
);

-- Waiver claim notifications and alerts
CREATE TABLE IF NOT EXISTS waiver_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- claim_submitted, claim_successful, claim_failed, processing_complete, budget_warning
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    waiver_claim_id UUID REFERENCES waiver_claims(id),
    player_id UUID REFERENCES players(id),
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_waiver_notifications_team_unread (team_id, is_read),
    INDEX idx_waiver_notifications_type (notification_type),
    INDEX idx_waiver_notifications_created (created_at DESC)
);

-- Advanced waiver settings per league
CREATE TABLE IF NOT EXISTS waiver_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
    waiver_type VARCHAR(20) DEFAULT 'faab', -- faab, rolling, reverse, hybrid
    process_schedule VARCHAR(50) DEFAULT 'weekly', -- daily, weekly, manual
    process_day VARCHAR(20) DEFAULT 'wednesday',
    process_time TIME DEFAULT '03:00:00',
    faab_budget INTEGER DEFAULT 100,
    min_bid INTEGER DEFAULT 0,
    max_bid INTEGER, -- optional spending cap per claim
    bid_increment INTEGER DEFAULT 1,
    allow_zero_bids BOOLEAN DEFAULT true,
    fractional_bids BOOLEAN DEFAULT false,
    blind_bidding BOOLEAN DEFAULT true,
    tiebreaker_method VARCHAR(20) DEFAULT 'priority', -- priority, bid_time, random, standings
    waiver_period_hours INTEGER DEFAULT 24,
    continual_waivers BOOLEAN DEFAULT true,
    free_agent_acquisition_budget INTEGER DEFAULT 0, -- separate budget for free agents
    waiver_claim_limit INTEGER, -- max claims per week
    budget_reset_schedule VARCHAR(20), -- never, yearly, weekly
    emergency_adds_enabled BOOLEAN DEFAULT false, -- for injuries during games
    commissioner_exemptions BOOLEAN DEFAULT true,
    advanced_analytics BOOLEAN DEFAULT true,
    auto_drop_injured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waiver claim templates for quick submission
CREATE TABLE IF NOT EXISTS waiver_claim_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    player_criteria JSONB NOT NULL, -- position, team, tier, etc.
    bid_strategy JSONB NOT NULL, -- max_bid, bid_percentage, etc.
    drop_strategy JSONB DEFAULT '{}', -- auto_drop rules
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waiver_templates_team_active (team_id, is_active)
);

-- Waiver wire target list
CREATE TABLE IF NOT EXISTS waiver_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    target_priority INTEGER DEFAULT 5,
    max_bid INTEGER,
    preferred_drop_player_id UUID REFERENCES players(id),
    notes TEXT,
    alert_threshold INTEGER, -- notify when claims reach this level
    auto_claim BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_waiver_targets_team_active (team_id, is_active),
    INDEX idx_waiver_targets_priority (target_priority),
    UNIQUE(team_id, player_id)
);

-- Waiver claim success prediction models
CREATE TABLE IF NOT EXISTS waiver_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    predicted_claims INTEGER DEFAULT 0,
    predicted_winning_bid INTEGER DEFAULT 0,
    competition_level DECIMAL(3,2), -- 0-1 scale
    recommendation VARCHAR(20), -- strong_add, add, hold, drop
    confidence_score DECIMAL(3,2),
    factors JSONB DEFAULT '{}', -- what influences the prediction
    model_version VARCHAR(20) DEFAULT '1.0',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waiver_predictions_league_week (league_id, week, season_year),
    INDEX idx_waiver_predictions_player (player_id),
    INDEX idx_waiver_predictions_recommendation (recommendation)
);

-- Waiver wire market analysis
CREATE TABLE IF NOT EXISTS waiver_market_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    position VARCHAR(10) NOT NULL,
    total_available_players INTEGER DEFAULT 0,
    total_claims INTEGER DEFAULT 0,
    average_bid DECIMAL(8,2) DEFAULT 0,
    median_bid DECIMAL(8,2) DEFAULT 0,
    highest_bid INTEGER DEFAULT 0,
    market_activity_level VARCHAR(20), -- very_low, low, moderate, high, very_high
    position_scarcity_score DECIMAL(5,2),
    bidding_inflation_factor DECIMAL(3,2) DEFAULT 1.0,
    top_targets JSONB DEFAULT '[]',
    value_picks JSONB DEFAULT '[]',
    overpaid_claims JSONB DEFAULT '[]',
    analysis_summary TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_waiver_market_league_week (league_id, week, season_year),
    INDEX idx_waiver_market_position (position)
);

-- Add enhanced indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waiver_claims_process_date ON waiver_claims(process_date, status);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_league_player ON waiver_claims(team_id, player_add_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_faab_bid ON waiver_claims(faab_amount DESC, created_at);

-- Views for common waiver queries

-- Current waiver priorities view
CREATE VIEW current_waiver_priorities AS
SELECT 
    wp.league_id,
    wp.team_id,
    t.team_name,
    wp.current_priority,
    wp.last_successful_claim,
    wp.total_successful_claims,
    RANK() OVER (PARTITION BY wp.league_id ORDER BY wp.current_priority) as priority_rank,
    CASE 
        WHEN wp.last_successful_claim IS NULL THEN 'Never claimed'
        WHEN wp.last_successful_claim < CURRENT_DATE - INTERVAL '7 days' THEN 'Over a week ago'
        ELSE 'Recent'
    END as last_claim_recency
FROM waiver_priorities wp
JOIN teams t ON wp.team_id = t.id
WHERE wp.season_year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY wp.league_id, wp.current_priority;

-- FAAB budget status view
CREATE VIEW faab_budget_status AS
SELECT 
    fb.league_id,
    fb.team_id,
    t.team_name,
    fb.starting_budget,
    fb.current_budget,
    fb.total_spent,
    ROUND((fb.current_budget::DECIMAL / fb.starting_budget) * 100, 1) as budget_remaining_pct,
    fb.successful_claims,
    fb.failed_claims,
    CASE 
        WHEN fb.successful_claims = 0 THEN 0
        ELSE ROUND(fb.total_spent::DECIMAL / fb.successful_claims, 2)
    END as avg_successful_bid,
    fb.largest_bid,
    CASE 
        WHEN fb.current_budget < (fb.starting_budget * 0.1) THEN 'Critical'
        WHEN fb.current_budget < (fb.starting_budget * 0.25) THEN 'Low'
        WHEN fb.current_budget < (fb.starting_budget * 0.5) THEN 'Moderate'
        ELSE 'Healthy'
    END as budget_status
FROM faab_budgets fb
JOIN teams t ON fb.team_id = t.id
WHERE fb.season_year = EXTRACT(YEAR FROM CURRENT_DATE);

-- Active waiver claims view
CREATE VIEW active_waiver_claims AS
SELECT 
    wc.id,
    wc.team_id,
    t.team_name,
    wc.player_add_id,
    p_add.name as player_add_name,
    p_add.position as player_add_position,
    wc.player_drop_id,
    p_drop.name as player_drop_name,
    wc.faab_amount,
    wc.waiver_priority,
    wc.process_date,
    wc.status,
    wc.created_at,
    EXTRACT(EPOCH FROM (wc.process_date - CURRENT_TIMESTAMP)) / 3600 as hours_until_process,
    wa.total_claims as competition_level,
    wa.average_bid as market_average_bid
FROM waiver_claims wc
JOIN teams t ON wc.team_id = t.id
JOIN players p_add ON wc.player_add_id = p_add.id
LEFT JOIN players p_drop ON wc.player_drop_id = p_drop.id
LEFT JOIN waiver_analytics wa ON wc.player_add_id = wa.player_id 
    AND t.league_id = wa.league_id 
    AND wa.week = EXTRACT(WEEK FROM CURRENT_DATE)
WHERE wc.status = 'pending'
ORDER BY wc.process_date, wc.created_at;

-- Waiver wire hotlist view
CREATE VIEW waiver_wire_hotlist AS
SELECT 
    p.id as player_id,
    p.name as player_name,
    p.position,
    p.team as nfl_team,
    wa.league_id,
    wa.total_claims,
    wa.average_bid,
    wa.highest_bid,
    wa.claim_competition_level,
    wa.player_value_trend,
    wp.recommendation,
    wp.confidence_score,
    p.injury_status,
    CASE 
        WHEN wa.total_claims >= 8 THEN 'Must Add'
        WHEN wa.total_claims >= 5 THEN 'Hot Target'
        WHEN wa.total_claims >= 3 THEN 'Solid Add'
        WHEN wa.total_claims >= 1 THEN 'Deep League'
        ELSE 'Available'
    END as add_priority
FROM players p
JOIN waiver_analytics wa ON p.id = wa.player_id
LEFT JOIN waiver_predictions wp ON p.id = wp.player_id AND wa.league_id = wp.league_id
WHERE wa.week = EXTRACT(WEEK FROM CURRENT_DATE)
AND wa.season_year = EXTRACT(YEAR FROM CURRENT_DATE)
AND p.is_active = true
ORDER BY wa.total_claims DESC, wa.average_bid DESC;

-- Functions for waiver processing automation

-- Function to update FAAB budget after successful claim
CREATE OR REPLACE FUNCTION update_faab_budget_after_claim()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'successful' AND OLD.status = 'pending' THEN
        UPDATE faab_budgets 
        SET current_budget = current_budget - COALESCE(NEW.faab_amount, 0),
            total_spent = total_spent + COALESCE(NEW.faab_amount, 0),
            successful_claims = successful_claims + 1,
            largest_bid = GREATEST(largest_bid, COALESCE(NEW.faab_amount, 0)),
            average_bid = (total_spent + COALESCE(NEW.faab_amount, 0)) / (successful_claims + 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE team_id = NEW.team_id 
        AND league_id = (SELECT league_id FROM teams WHERE id = NEW.team_id)
        AND season_year = EXTRACT(YEAR FROM CURRENT_DATE);
    END IF;
    
    IF NEW.status = 'failed' AND OLD.status = 'pending' THEN
        UPDATE faab_budgets 
        SET failed_claims = failed_claims + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE team_id = NEW.team_id 
        AND league_id = (SELECT league_id FROM teams WHERE id = NEW.team_id)
        AND season_year = EXTRACT(YEAR FROM CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_faab_budget
    AFTER UPDATE ON waiver_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_faab_budget_after_claim();

-- Function to update waiver priorities after successful claim
CREATE OR REPLACE FUNCTION update_waiver_priority_after_claim()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'successful' AND OLD.status = 'pending' THEN
        UPDATE waiver_priorities 
        SET current_priority = (
            SELECT COALESCE(MAX(current_priority), 0) + 1 
            FROM waiver_priorities 
            WHERE league_id = (SELECT league_id FROM teams WHERE id = NEW.team_id)
            AND season_year = EXTRACT(YEAR FROM CURRENT_DATE)
        ),
        last_successful_claim = CURRENT_TIMESTAMP,
        total_successful_claims = total_successful_claims + 1,
        priority_changes = priority_changes || jsonb_build_object(
            'timestamp', CURRENT_TIMESTAMP,
            'old_priority', current_priority,
            'reason', 'successful_waiver_claim',
            'claim_id', NEW.id
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE team_id = NEW.team_id 
        AND league_id = (SELECT league_id FROM teams WHERE id = NEW.team_id)
        AND season_year = EXTRACT(YEAR FROM CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_waiver_priority
    AFTER UPDATE ON waiver_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_waiver_priority_after_claim();

-- Function to calculate waiver analytics
CREATE OR REPLACE FUNCTION calculate_waiver_analytics(league_id_param UUID, week_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    processed_players INTEGER := 0;
    player_record RECORD;
BEGIN
    FOR player_record IN
        SELECT DISTINCT wc.player_add_id as player_id
        FROM waiver_claims wc
        JOIN teams t ON wc.team_id = t.id
        WHERE t.league_id = league_id_param
        AND EXTRACT(WEEK FROM wc.process_date) = week_param
        AND wc.status IN ('successful', 'failed')
    LOOP
        INSERT INTO waiver_analytics (
            league_id, player_id, week, season_year,
            total_claims, average_bid, highest_bid, winning_bid,
            winning_team_id, calculated_at
        )
        SELECT 
            league_id_param,
            player_record.player_id,
            week_param,
            EXTRACT(YEAR FROM CURRENT_DATE),
            COUNT(*),
            AVG(COALESCE(wc.faab_amount, 0)),
            MAX(COALESCE(wc.faab_amount, 0)),
            (SELECT COALESCE(faab_amount, 0) FROM waiver_claims WHERE player_add_id = player_record.player_id AND status = 'successful' LIMIT 1),
            (SELECT team_id FROM waiver_claims WHERE player_add_id = player_record.player_id AND status = 'successful' LIMIT 1),
            CURRENT_TIMESTAMP
        FROM waiver_claims wc
        JOIN teams t ON wc.team_id = t.id
        WHERE t.league_id = league_id_param
        AND wc.player_add_id = player_record.player_id
        AND EXTRACT(WEEK FROM wc.process_date) = week_param
        ON CONFLICT (league_id, player_id, week, season_year) 
        DO UPDATE SET
            total_claims = EXCLUDED.total_claims,
            average_bid = EXCLUDED.average_bid,
            highest_bid = EXCLUDED.highest_bid,
            winning_bid = EXCLUDED.winning_bid,
            winning_team_id = EXCLUDED.winning_team_id,
            calculated_at = EXCLUDED.calculated_at;
            
        processed_players := processed_players + 1;
    END LOOP;
    
    RETURN processed_players;
END;
$$ LANGUAGE plpgsql;

COMMIT;