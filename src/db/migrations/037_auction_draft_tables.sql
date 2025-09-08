-- Advanced Auction Draft Support Tables
-- Extends the existing draft system with auction-specific functionality

-- Auction nominations table
CREATE TABLE IF NOT EXISTS auction_nominations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id),
    nominating_team_id UUID REFERENCES teams(id),
    current_bid INTEGER NOT NULL DEFAULT 1,
    current_bidder UUID REFERENCES teams(id),
    time_remaining INTEGER NOT NULL DEFAULT 30, -- seconds
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    INDEX idx_auction_nominations_draft (draft_id),
    INDEX idx_auction_nominations_active (is_active)
);

-- Auction bid history
CREATE TABLE IF NOT EXISTS auction_bid_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomination_id UUID REFERENCES auction_nominations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    bid_amount INTEGER NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_winning_bid BOOLEAN DEFAULT false,
    INDEX idx_auction_bids_nomination (nomination_id),
    INDEX idx_auction_bids_team (team_id)
);

-- Team auction budgets tracking
CREATE TABLE IF NOT EXISTS auction_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    starting_budget INTEGER NOT NULL,
    current_budget INTEGER NOT NULL,
    spent_amount INTEGER DEFAULT 0,
    players_drafted INTEGER DEFAULT 0,
    remaining_roster_spots INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(draft_id, team_id),
    INDEX idx_auction_budgets_draft_team (draft_id, team_id)
);

-- Draft pick timer history for analytics
CREATE TABLE IF NOT EXISTS draft_pick_timers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    pick_number INTEGER NOT NULL,
    team_id UUID REFERENCES teams(id),
    timer_started TIMESTAMP NOT NULL,
    timer_paused TIMESTAMP,
    timer_resumed TIMESTAMP,
    pick_made_at TIMESTAMP,
    total_time_taken INTEGER, -- seconds
    was_auto_pick BOOLEAN DEFAULT false,
    pause_count INTEGER DEFAULT 0,
    INDEX idx_draft_timers_draft (draft_id),
    INDEX idx_draft_timers_pick (pick_number)
);

-- Enhanced draft settings for advanced features
CREATE TABLE IF NOT EXISTS draft_advanced_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE UNIQUE,
    keeper_settings JSONB DEFAULT '{}', -- keeper rules and costs
    rookie_draft_settings JSONB DEFAULT '{}', -- rookie/supplemental draft rules
    compensation_picks JSONB DEFAULT '[]', -- compensatory picks
    trade_draft_picks_enabled BOOLEAN DEFAULT false,
    draft_pick_trades JSONB DEFAULT '[]', -- traded picks
    auto_pick_settings JSONB DEFAULT '{}', -- auto-pick preferences per team
    draft_room_settings JSONB DEFAULT '{}', -- chat, moderation, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Keeper player designations
CREATE TABLE IF NOT EXISTS keeper_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    keeper_year INTEGER NOT NULL,
    keeper_round INTEGER, -- what round pick this keeper costs
    keeper_cost INTEGER, -- auction cost for keeper
    keeper_years_remaining INTEGER DEFAULT 1,
    is_franchise_tag BOOLEAN DEFAULT false, -- special keeper designation
    designation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_after_season INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_keeper_players_league (league_id),
    INDEX idx_keeper_players_team (team_id),
    UNIQUE(team_id, player_id, keeper_year)
);

-- Draft pick trading
CREATE TABLE IF NOT EXISTS draft_pick_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    original_team_id UUID REFERENCES teams(id),
    new_team_id UUID REFERENCES teams(id),
    draft_year INTEGER NOT NULL,
    round INTEGER NOT NULL,
    pick_number INTEGER, -- specific pick number if known
    conditions JSONB DEFAULT '{}', -- conditional picks, protections, etc.
    is_conditional BOOLEAN DEFAULT false,
    condition_met BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_draft_pick_trades_league (league_id),
    INDEX idx_draft_pick_trades_trade (trade_id),
    INDEX idx_draft_pick_trades_teams (original_team_id, new_team_id)
);

-- Pre-draft rankings and player queues
CREATE TABLE IF NOT EXISTS draft_player_queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    queue_position INTEGER NOT NULL,
    notes TEXT,
    target_round INTEGER,
    max_price INTEGER, -- for auction drafts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_draft_queues_draft_team (draft_id, team_id),
    INDEX idx_draft_queues_position (queue_position),
    UNIQUE(draft_id, team_id, player_id)
);

-- Draft room chat and communication
CREATE TABLE IF NOT EXISTS draft_room_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    message_type VARCHAR(50) DEFAULT 'chat', -- chat, pick_announcement, system, trade_talk
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false, -- private messages to specific teams
    recipient_team_id UUID REFERENCES teams(id), -- for private messages
    reactions JSONB DEFAULT '{}',
    is_moderated BOOLEAN DEFAULT false,
    moderation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_draft_messages_draft (draft_id),
    INDEX idx_draft_messages_user (user_id),
    INDEX idx_draft_messages_created (created_at DESC)
);

-- Draft analytics and insights
CREATE TABLE IF NOT EXISTS draft_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    analytics_type VARCHAR(50) NOT NULL, -- 'needs_analysis', 'value_picks', 'reaches', 'steals'
    data JSONB NOT NULL,
    score DECIMAL(5,2),
    rank INTEGER,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    week_calculated INTEGER, -- for trending analysis
    INDEX idx_draft_analytics_draft_team (draft_id, team_id),
    INDEX idx_draft_analytics_type (analytics_type)
);

-- Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_draft_picks_draft_order ON draft_picks(draft_id, pick_number);
CREATE INDEX IF NOT EXISTS idx_drafts_league_status ON drafts(league_id, status);
CREATE INDEX IF NOT EXISTS idx_auction_nominations_player ON auction_nominations(player_id);

-- Add auction amount column to draft_picks if not exists
ALTER TABLE draft_picks ADD COLUMN IF NOT EXISTS auction_amount INTEGER;
ALTER TABLE draft_picks ADD COLUMN IF NOT EXISTS is_keeper_pick BOOLEAN DEFAULT false;
ALTER TABLE draft_picks ADD COLUMN IF NOT EXISTS keeper_round INTEGER;

-- Update drafts table with additional auction fields
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS auction_budget INTEGER DEFAULT 200;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS min_bid INTEGER DEFAULT 1;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS bid_increment INTEGER DEFAULT 1;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS nomination_timer INTEGER DEFAULT 30;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS bidding_timer INTEGER DEFAULT 30;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS auto_pick_enabled BOOLEAN DEFAULT true;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS autopick_delay INTEGER DEFAULT 10;

-- Add trigger for updating auction budgets
CREATE OR REPLACE FUNCTION update_auction_budget()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.auction_amount IS NOT NULL THEN
        UPDATE auction_budgets 
        SET current_budget = current_budget - NEW.auction_amount,
            spent_amount = spent_amount + NEW.auction_amount,
            players_drafted = players_drafted + 1,
            remaining_roster_spots = remaining_roster_spots - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE team_id = NEW.team_id 
        AND draft_id = NEW.draft_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_auction_budget
    AFTER INSERT ON draft_picks
    FOR EACH ROW
    EXECUTE FUNCTION update_auction_budget();

-- Add trigger to track draft pick timing
CREATE OR REPLACE FUNCTION track_draft_pick_timing()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO draft_pick_timers (
        draft_id, pick_number, team_id, timer_started, 
        pick_made_at, total_time_taken, was_auto_pick
    ) VALUES (
        NEW.draft_id, 
        NEW.pick_number, 
        NEW.team_id,
        CURRENT_TIMESTAMP - INTERVAL '1 second' * NEW.time_taken,
        NEW.pick_time,
        NEW.time_taken,
        NEW.auto_drafted
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_draft_timing
    AFTER INSERT ON draft_picks
    FOR EACH ROW
    EXECUTE FUNCTION track_draft_pick_timing();

-- Create some useful views for draft analytics

-- Draft efficiency view
CREATE VIEW draft_efficiency_stats AS
SELECT 
    d.id as draft_id,
    d.league_id,
    COUNT(dp.id) as total_picks,
    AVG(dp.time_taken) as avg_pick_time,
    COUNT(CASE WHEN dp.auto_drafted THEN 1 END) as auto_picks,
    COUNT(CASE WHEN dp.auto_drafted THEN 1 END) * 100.0 / COUNT(dp.id) as auto_pick_percentage,
    MIN(dp.pick_time) as draft_started,
    MAX(dp.pick_time) as last_pick_time,
    EXTRACT(EPOCH FROM (MAX(dp.pick_time) - MIN(dp.pick_time))) / 3600 as draft_duration_hours
FROM drafts d
LEFT JOIN draft_picks dp ON d.id = dp.draft_id
GROUP BY d.id, d.league_id;

-- Auction budget summary view
CREATE VIEW auction_budget_summary AS
SELECT 
    ab.*,
    t.team_name,
    ab.starting_budget - ab.current_budget as total_spent,
    CASE 
        WHEN ab.remaining_roster_spots = 0 THEN 0
        ELSE ab.current_budget / ab.remaining_roster_spots 
    END as avg_remaining_per_roster_spot,
    CASE
        WHEN ab.starting_budget = 0 THEN 0
        ELSE (ab.starting_budget - ab.current_budget) * 100.0 / ab.starting_budget
    END as budget_spent_percentage
FROM auction_budgets ab
JOIN teams t ON ab.team_id = t.id;

-- Team draft needs analysis view
CREATE VIEW team_draft_needs AS
SELECT 
    t.id as team_id,
    t.team_name,
    t.league_id,
    l.roster_positions,
    COUNT(CASE WHEN p.position = 'QB' THEN 1 END) as qb_count,
    COUNT(CASE WHEN p.position = 'RB' THEN 1 END) as rb_count,
    COUNT(CASE WHEN p.position = 'WR' THEN 1 END) as wr_count,
    COUNT(CASE WHEN p.position = 'TE' THEN 1 END) as te_count,
    COUNT(CASE WHEN p.position = 'K' THEN 1 END) as k_count,
    COUNT(CASE WHEN p.position = 'DST' THEN 1 END) as dst_count,
    COUNT(*) as total_players_drafted
FROM teams t
JOIN leagues l ON t.league_id = l.id
LEFT JOIN rosters r ON t.id = r.team_id
LEFT JOIN players p ON r.player_id = p.id
GROUP BY t.id, t.team_name, t.league_id, l.roster_positions;

COMMIT;