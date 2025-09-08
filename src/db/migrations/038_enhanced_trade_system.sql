-- Enhanced Trade System Tables
-- Supports complex multi-team trades, approval workflows, and comprehensive analysis

-- Multi-team trades
CREATE TABLE IF NOT EXISTS multi_team_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    initiating_team_id UUID REFERENCES teams(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, expired, vetoed, completed
    expiration_date TIMESTAMP,
    accepted_teams UUID[] DEFAULT '{}',
    veto_votes INTEGER DEFAULT 0,
    veto_threshold INTEGER DEFAULT 0,
    veto_voters UUID[] DEFAULT '{}',
    trade_analysis JSONB,
    commissioner_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    INDEX idx_multi_team_trades_league (league_id),
    INDEX idx_multi_team_trades_status (status)
);

-- Multi-team trade participants
CREATE TABLE IF NOT EXISTS multi_team_trade_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    multi_team_trade_id UUID REFERENCES multi_team_trades(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    has_accepted BOOLEAN DEFAULT false,
    accepted_at TIMESTAMP,
    giving_value DECIMAL(10,2) DEFAULT 0,
    receiving_value DECIMAL(10,2) DEFAULT 0,
    net_value DECIMAL(10,2) DEFAULT 0,
    INDEX idx_multi_trade_participants_trade (multi_team_trade_id),
    INDEX idx_multi_trade_participants_team (team_id)
);

-- Enhanced trade items with conditional picks and complex assets
ALTER TABLE trade_items ADD COLUMN IF NOT EXISTS is_conditional BOOLEAN DEFAULT false;
ALTER TABLE trade_items ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}';
ALTER TABLE trade_items ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(10,2);
ALTER TABLE trade_items ADD COLUMN IF NOT EXISTS protection_level VARCHAR(50); -- unprotected, lottery, top_5, etc.

-- Trade votes and veto system
CREATE TABLE IF NOT EXISTS trade_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    multi_team_trade_id UUID REFERENCES multi_team_trades(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    vote_type VARCHAR(20) NOT NULL, -- approve, veto, abstain
    reasoning TEXT,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trade_votes_trade (trade_id),
    INDEX idx_trade_votes_multi_trade (multi_team_trade_id),
    INDEX idx_trade_votes_team (team_id),
    UNIQUE(trade_id, team_id),
    UNIQUE(multi_team_trade_id, team_id)
);

-- Trade history and audit trail
CREATE TABLE IF NOT EXISTS trade_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    multi_team_trade_id UUID REFERENCES multi_team_trades(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- proposed, accepted, rejected, vetoed, modified, executed
    actor_user_id UUID REFERENCES users(id),
    actor_team_id UUID REFERENCES teams(id),
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trade_audit_trade (trade_id),
    INDEX idx_trade_audit_multi (multi_team_trade_id),
    INDEX idx_trade_audit_timestamp (timestamp DESC)
);

-- Trade negotiations and counter-offers
CREATE TABLE IF NOT EXISTS trade_negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    counter_offer_number INTEGER DEFAULT 1,
    proposing_team_id UUID REFERENCES teams(id),
    receiving_team_id UUID REFERENCES teams(id),
    proposed_changes JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, superseded
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    responded_at TIMESTAMP,
    INDEX idx_trade_negotiations_original (original_trade_id),
    INDEX idx_trade_negotiations_teams (proposing_team_id, receiving_team_id)
);

-- Trade deadlines and league-specific settings
CREATE TABLE IF NOT EXISTS trade_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE UNIQUE,
    trade_deadline DATE,
    review_period_hours INTEGER DEFAULT 24,
    veto_threshold_percentage INTEGER DEFAULT 50,
    commissioner_veto_enabled BOOLEAN DEFAULT true,
    allow_multi_team_trades BOOLEAN DEFAULT true,
    max_teams_in_trade INTEGER DEFAULT 3,
    allow_future_draft_picks BOOLEAN DEFAULT true,
    max_future_years INTEGER DEFAULT 2,
    allow_faab_trades BOOLEAN DEFAULT true,
    auto_approval_enabled BOOLEAN DEFAULT false,
    auto_approval_fairness_threshold INTEGER DEFAULT 70,
    require_all_positions_filled BOOLEAN DEFAULT true,
    max_players_per_trade INTEGER DEFAULT 8,
    cooling_off_period_hours INTEGER DEFAULT 0,
    public_trade_comments BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade analysis results storage
CREATE TABLE IF NOT EXISTS trade_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    multi_team_trade_id UUID REFERENCES multi_team_trades(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- fairness, risk, positional, future_value
    analysis_data JSONB NOT NULL,
    score DECIMAL(5,2),
    confidence DECIMAL(3,2),
    red_flags JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculation_version VARCHAR(20) DEFAULT '1.0',
    INDEX idx_trade_analysis_trade (trade_id),
    INDEX idx_trade_analysis_multi (multi_team_trade_id),
    INDEX idx_trade_analysis_type (analysis_type)
);

-- Player values tracking for trade analysis
CREATE TABLE IF NOT EXISTS player_trade_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    trade_value DECIMAL(8,2) NOT NULL,
    tier INTEGER,
    position_rank INTEGER,
    trend VARCHAR(20), -- rising, falling, stable
    volatility_score DECIMAL(5,2),
    injury_discount DECIMAL(5,2) DEFAULT 0,
    age_discount DECIMAL(5,2) DEFAULT 0,
    opportunity_score DECIMAL(5,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_sources JSONB DEFAULT '[]',
    INDEX idx_player_trade_values_player_week (player_id, week, season_year),
    INDEX idx_player_trade_values_league (league_id),
    UNIQUE(player_id, league_id, week, season_year)
);

-- Draft pick values for trade evaluation
CREATE TABLE IF NOT EXISTS draft_pick_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_year INTEGER NOT NULL,
    round INTEGER NOT NULL,
    pick_number INTEGER,
    estimated_value DECIMAL(8,2) NOT NULL,
    league_format VARCHAR(50), -- standard, ppr, dynasty, etc.
    team_performance_factor DECIMAL(3,2) DEFAULT 1.0, -- multiplier based on expected team performance
    value_source VARCHAR(50) DEFAULT 'consensus',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_draft_pick_values_year_round (draft_year, round),
    UNIQUE(draft_year, round, pick_number, league_format)
);

-- Trade partner suggestions and compatibility
CREATE TABLE IF NOT EXISTS trade_compatibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team1_id UUID REFERENCES teams(id),
    team2_id UUID REFERENCES teams(id),
    compatibility_score DECIMAL(5,2),
    team1_needs JSONB,
    team2_needs JSONB,
    suggested_trades JSONB,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trade_compatibility_league (league_id),
    INDEX idx_trade_compatibility_teams (team1_id, team2_id),
    UNIQUE(league_id, team1_id, team2_id)
);

-- Trade block and availability system
CREATE TABLE IF NOT EXISTS trade_block (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id),
    asking_price JSONB, -- what they want in return
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    priority_level INTEGER DEFAULT 5 CHECK (priority_level >= 1 AND priority_level <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_trade_block_team (team_id),
    INDEX idx_trade_block_player (player_id),
    INDEX idx_trade_block_active (is_active),
    UNIQUE(team_id, player_id)
);

-- Trade interest tracking
CREATE TABLE IF NOT EXISTS trade_interest (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interested_team_id UUID REFERENCES teams(id),
    target_team_id UUID REFERENCES teams(id),
    target_player_id UUID REFERENCES players(id),
    interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 10),
    max_offer_value DECIMAL(8,2),
    preferred_return JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    INDEX idx_trade_interest_interested_team (interested_team_id),
    INDEX idx_trade_interest_target (target_team_id, target_player_id)
);

-- Add some additional columns to existing tables
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_complexity_score DECIMAL(5,2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS cooling_off_end TIMESTAMP;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS public_comments_enabled BOOLEAN DEFAULT true;

-- Enhanced indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_league_status ON trades(team_sender_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_items_type_value ON trade_items(item_type, estimated_value DESC);
CREATE INDEX IF NOT EXISTS idx_player_trade_values_trend ON player_trade_values(trend, calculated_at DESC);

-- Views for common trade queries

-- Active trade proposals view
CREATE VIEW active_trade_proposals AS
SELECT 
    t.id,
    t.team_sender_id,
    t.team_receiver_id,
    t.status,
    t.expiration_date,
    t.created_at,
    ts.team_name as sender_name,
    tr.team_name as receiver_name,
    COUNT(ti.id) as total_assets,
    SUM(CASE WHEN ti.estimated_value IS NOT NULL THEN ti.estimated_value ELSE 0 END) as total_value,
    tar.score as fairness_score
FROM trades t
JOIN teams ts ON t.team_sender_id = ts.id
JOIN teams tr ON t.team_receiver_id = tr.id
LEFT JOIN trade_items ti ON t.id = ti.trade_id
LEFT JOIN trade_analysis_results tar ON t.id = tar.trade_id AND tar.analysis_type = 'fairness'
WHERE t.status IN ('pending', 'accepted')
GROUP BY t.id, ts.team_name, tr.team_name, tar.score;

-- Trade block marketplace view
CREATE VIEW trade_block_marketplace AS
SELECT 
    tb.id,
    tb.team_id,
    t.team_name,
    tb.player_id,
    p.name as player_name,
    p.position,
    p.team as nfl_team,
    tb.asking_price,
    tb.notes,
    tb.priority_level,
    ptv.trade_value,
    ptv.tier,
    ptv.trend,
    tb.created_at,
    tb.expires_at
FROM trade_block tb
JOIN teams t ON tb.team_id = t.id
JOIN players p ON tb.player_id = p.id
LEFT JOIN player_trade_values ptv ON p.id = ptv.player_id 
    AND t.league_id = ptv.league_id
    AND ptv.week = (SELECT MAX(week) FROM player_trade_values WHERE player_id = p.id AND league_id = t.league_id)
WHERE tb.is_active = true
ORDER BY tb.priority_level DESC, ptv.trade_value DESC;

-- Team needs analysis for trade matching
CREATE VIEW team_trade_needs AS
SELECT 
    t.id as team_id,
    t.team_name,
    t.league_id,
    COUNT(CASE WHEN p.position = 'QB' THEN 1 END) as qb_count,
    COUNT(CASE WHEN p.position = 'RB' THEN 1 END) as rb_count,
    COUNT(CASE WHEN p.position = 'WR' THEN 1 END) as wr_count,
    COUNT(CASE WHEN p.position = 'TE' THEN 1 END) as te_count,
    COUNT(CASE WHEN p.position = 'K' THEN 1 END) as k_count,
    COUNT(CASE WHEN p.position = 'DST' THEN 1 END) as dst_count,
    -- Calculate positional strength scores
    COALESCE(AVG(CASE WHEN p.position = 'QB' THEN ptv.trade_value END), 0) as qb_strength,
    COALESCE(AVG(CASE WHEN p.position = 'RB' THEN ptv.trade_value END), 0) as rb_strength,
    COALESCE(AVG(CASE WHEN p.position = 'WR' THEN ptv.trade_value END), 0) as wr_strength,
    COALESCE(AVG(CASE WHEN p.position = 'TE' THEN ptv.trade_value END), 0) as te_strength,
    -- Identify needs (positions below average roster construction)
    CASE WHEN COUNT(CASE WHEN p.position = 'QB' THEN 1 END) < 2 THEN 'QB' END as qb_need,
    CASE WHEN COUNT(CASE WHEN p.position = 'RB' THEN 1 END) < 4 THEN 'RB' END as rb_need,
    CASE WHEN COUNT(CASE WHEN p.position = 'WR' THEN 1 END) < 4 THEN 'WR' END as wr_need,
    CASE WHEN COUNT(CASE WHEN p.position = 'TE' THEN 1 END) < 2 THEN 'TE' END as te_need
FROM teams t
LEFT JOIN rosters r ON t.id = r.team_id
LEFT JOIN players p ON r.player_id = p.id
LEFT JOIN player_trade_values ptv ON p.id = ptv.player_id 
    AND t.league_id = ptv.league_id
    AND ptv.week = (SELECT MAX(week) FROM player_trade_values WHERE player_id = p.id AND league_id = t.league_id)
GROUP BY t.id, t.team_name, t.league_id;

-- Create functions for trade analysis automation

-- Function to calculate trade fairness
CREATE OR REPLACE FUNCTION calculate_trade_fairness(trade_id_param UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    sender_value DECIMAL(10,2);
    receiver_value DECIMAL(10,2);
    fairness_score DECIMAL(5,2);
BEGIN
    -- Calculate sender's giving value
    SELECT COALESCE(SUM(estimated_value), 0) INTO sender_value
    FROM trade_items 
    WHERE trade_id = trade_id_param AND team_id = (
        SELECT team_sender_id FROM trades WHERE id = trade_id_param
    );
    
    -- Calculate receiver's giving value  
    SELECT COALESCE(SUM(estimated_value), 0) INTO receiver_value
    FROM trade_items 
    WHERE trade_id = trade_id_param AND team_id = (
        SELECT team_receiver_id FROM trades WHERE id = trade_id_param
    );
    
    -- Calculate fairness (closer to 50 = more fair)
    IF sender_value + receiver_value = 0 THEN
        fairness_score := 50.0;
    ELSE
        fairness_score := 50.0 - (ABS(sender_value - receiver_value) / (sender_value + receiver_value) * 100);
    END IF;
    
    RETURN GREATEST(0, LEAST(100, fairness_score));
END;
$$ LANGUAGE plpgsql;

-- Function to update player trade values weekly
CREATE OR REPLACE FUNCTION update_player_trade_values()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- This would contain logic to recalculate player values
    -- Based on recent performance, projections, etc.
    
    -- Placeholder logic - in reality this would be much more complex
    INSERT INTO player_trade_values (
        player_id, league_id, week, season_year, trade_value, 
        tier, position_rank, calculated_at
    )
    SELECT 
        p.id,
        l.id as league_id,
        EXTRACT(WEEK FROM CURRENT_DATE) as week,
        EXTRACT(YEAR FROM CURRENT_DATE) as season_year,
        COALESCE(p.auction_value, p.adp * 2, 50) as trade_value,
        CASE 
            WHEN p.adp <= 12 THEN 1
            WHEN p.adp <= 24 THEN 2
            WHEN p.adp <= 60 THEN 3
            WHEN p.adp <= 120 THEN 4
            ELSE 5
        END as tier,
        ROW_NUMBER() OVER (PARTITION BY p.position ORDER BY COALESCE(p.auction_value, p.adp)) as position_rank,
        CURRENT_TIMESTAMP
    FROM players p
    CROSS JOIN leagues l
    WHERE p.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM player_trade_values ptv 
        WHERE ptv.player_id = p.id 
        AND ptv.league_id = l.id 
        AND ptv.week = EXTRACT(WEEK FROM CURRENT_DATE)
        AND ptv.season_year = EXTRACT(YEAR FROM CURRENT_DATE)
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic trade analysis
CREATE OR REPLACE FUNCTION trigger_trade_analysis()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate fairness score when trade is created
    INSERT INTO trade_analysis_results (
        trade_id, analysis_type, score, calculated_at
    ) VALUES (
        NEW.id, 'fairness', calculate_trade_fairness(NEW.id), CURRENT_TIMESTAMP
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_trade_analysis
    AFTER INSERT ON trades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_trade_analysis();

COMMIT;