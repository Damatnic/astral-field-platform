-- Astral Field Fantasy Football Platform
-- Complete Database Schema Migration
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;
DROP TABLE IF EXISTS draft_picks CASCADE;
DROP TABLE IF EXISTS drafts CASCADE;
DROP TABLE IF EXISTS waiver_claims CASCADE;
DROP TABLE IF EXISTS trade_items CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS matchups CASCADE;
DROP TABLE IF EXISTS lineup_slots CASCADE;
DROP TABLE IF EXISTS lineups CASCADE;
DROP TABLE IF EXISTS rosters CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    auth_provider VARCHAR(50) DEFAULT 'email',
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    is_premium BOOLEAN DEFAULT false,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    pin VARCHAR(6), -- For demo mode
    is_demo_user BOOLEAN DEFAULT false
);

-- Leagues
CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    commissioner_id UUID REFERENCES users(id),
    season_year INTEGER NOT NULL,
    league_type VARCHAR(50) DEFAULT 'redraft', -- redraft, keeper, dynasty
    scoring_type VARCHAR(50) DEFAULT 'ppr', -- standard, ppr, half_ppr, custom
    max_teams INTEGER DEFAULT 10,
    current_week INTEGER DEFAULT 0,
    draft_date TIMESTAMP,
    draft_type VARCHAR(50) DEFAULT 'snake', -- snake, auction, linear
    draft_order_type VARCHAR(50) DEFAULT 'random', -- random, manual, last_year_reverse
    playoff_teams INTEGER DEFAULT 6,
    playoff_start_week INTEGER DEFAULT 15,
    trade_deadline_week INTEGER DEFAULT 10,
    waiver_type VARCHAR(50) DEFAULT 'faab', -- faab, rolling, reverse_standings
    waiver_budget INTEGER DEFAULT 100,
    waiver_process_day VARCHAR(20) DEFAULT 'wednesday',
    waiver_process_time TIME DEFAULT '03:00:00',
    roster_positions JSONB NOT NULL DEFAULT '{
        "QB": 1,
        "RB": 2,
        "WR": 2,
        "TE": 1,
        "FLEX": 1,
        "DST": 1,
        "K": 1,
        "BENCH": 7,
        "IR": 2
    }',
    scoring_settings JSONB NOT NULL DEFAULT '{
        "passing": {
            "yards": 0.04,
            "touchdowns": 4,
            "interceptions": -2,
            "two_point_conversions": 2
        },
        "rushing": {
            "yards": 0.1,
            "touchdowns": 6,
            "two_point_conversions": 2
        },
        "receiving": {
            "receptions": 1,
            "yards": 0.1,
            "touchdowns": 6,
            "two_point_conversions": 2
        },
        "kicking": {
            "pat": 1,
            "fg_0_39": 3,
            "fg_40_49": 4,
            "fg_50_plus": 5,
            "fg_missed": -1
        },
        "defense": {
            "sack": 1,
            "interception": 2,
            "fumble_recovery": 2,
            "touchdown": 6,
            "safety": 2,
            "block_kick": 2,
            "points_allowed_0": 10,
            "points_allowed_1_6": 7,
            "points_allowed_7_13": 4,
            "points_allowed_14_20": 1,
            "points_allowed_21_27": 0,
            "points_allowed_28_34": -1,
            "points_allowed_35_plus": -4
        }
    }',
    league_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    invite_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    team_name VARCHAR(255) NOT NULL,
    team_abbreviation VARCHAR(5),
    logo_url TEXT,
    motto TEXT,
    draft_position INTEGER,
    waiver_priority INTEGER,
    waiver_budget_remaining INTEGER,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    points_for DECIMAL(10,2) DEFAULT 0,
    points_against DECIMAL(10,2) DEFAULT 0,
    standing_position INTEGER,
    playoff_seed INTEGER,
    is_eliminated BOOLEAN DEFAULT false,
    streak VARCHAR(10) DEFAULT 'W0', -- W3, L2, etc
    last_5 VARCHAR(5) DEFAULT '0-0', -- 3-2, 1-4, etc
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, team_name),
    UNIQUE(league_id, team_abbreviation)
);

-- NFL Players Master Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) UNIQUE, -- ESPN/Yahoo/Sleeper ID
    name VARCHAR(255) NOT NULL,
    position VARCHAR(10) NOT NULL,
    team VARCHAR(10), -- NFL team abbreviation
    jersey_number INTEGER,
    height VARCHAR(10),
    weight INTEGER,
    age INTEGER,
    years_experience INTEGER,
    college VARCHAR(100),
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    photo_url TEXT,
    injury_status VARCHAR(50), -- healthy, questionable, doubtful, out, ir
    injury_description TEXT,
    injury_updated_at TIMESTAMP,
    bye_week INTEGER,
    adp DECIMAL(5,2), -- Average Draft Position
    auction_value INTEGER,
    is_rookie BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rosters (Team-Player Relationships)
CREATE TABLE rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id),
    roster_position VARCHAR(20), -- QB, RB1, RB2, WR1, WR2, TE, FLEX, DST, K, BENCH, IR
    acquisition_type VARCHAR(50), -- draft, waiver, trade, free_agent
    acquisition_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acquisition_cost INTEGER, -- FAAB amount or draft round
    is_keeper BOOLEAN DEFAULT false,
    keeper_round INTEGER,
    keeper_years_remaining INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, player_id)
);

-- Weekly Lineups
CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    total_projected_points DECIMAL(10,2),
    total_actual_points DECIMAL(10,2),
    optimal_points DECIMAL(10,2), -- Best possible lineup score
    efficiency_rating DECIMAL(5,2), -- actual/optimal percentage
    rank_projected INTEGER,
    rank_actual INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    locked_at TIMESTAMP,
    UNIQUE(team_id, week, season_year)
);

-- Lineup Slots
CREATE TABLE lineup_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lineup_id UUID REFERENCES lineups(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id),
    slot_position VARCHAR(20) NOT NULL, -- QB, RB, WR, TE, FLEX, DST, K
    projected_points DECIMAL(10,2),
    actual_points DECIMAL(10,2),
    is_locked BOOLEAN DEFAULT false,
    lock_time TIMESTAMP,
    game_status VARCHAR(50), -- scheduled, in_progress, final
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lineup_id, slot_position)
);

-- Matchups
CREATE TABLE matchups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    home_score DECIMAL(10,2) DEFAULT 0,
    away_score DECIMAL(10,2) DEFAULT 0,
    home_projected DECIMAL(10,2),
    away_projected DECIMAL(10,2),
    home_optimal_score DECIMAL(10,2),
    away_optimal_score DECIMAL(10,2),
    winner_id UUID REFERENCES teams(id),
    is_playoff BOOLEAN DEFAULT false,
    is_championship BOOLEAN DEFAULT false,
    is_consolation BOOLEAN DEFAULT false,
    is_complete BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, week, season_year, home_team_id, away_team_id)
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- add, drop, trade, draft, commissioner
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled, completed
    initiated_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    processed_at TIMESTAMP,
    details JSONB NOT NULL, -- Flexible structure for different transaction types
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    team_sender_id UUID REFERENCES teams(id),
    team_receiver_id UUID REFERENCES teams(id),
    status VARCHAR(50) DEFAULT 'proposed', -- proposed, accepted, rejected, cancelled, expired, vetoed
    expiration_date TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    veto_votes INTEGER DEFAULT 0,
    veto_threshold INTEGER,
    veto_voters UUID[] DEFAULT '{}',
    commissioner_review BOOLEAN DEFAULT false,
    trade_grade_sender VARCHAR(5),
    trade_grade_receiver VARCHAR(5),
    ai_analysis JSONB,
    counter_offer_id UUID REFERENCES trades(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade Items
CREATE TABLE trade_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    draft_pick_round INTEGER,
    draft_pick_year INTEGER,
    draft_pick_original_team_id UUID REFERENCES teams(id),
    faab_amount INTEGER,
    item_type VARCHAR(50) NOT NULL, -- player, pick, faab
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waiver Claims
CREATE TABLE waiver_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_add_id UUID REFERENCES players(id),
    player_drop_id UUID REFERENCES players(id),
    waiver_priority INTEGER,
    faab_amount INTEGER,
    process_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- pending, successful, failed, cancelled
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Draft
CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    draft_date TIMESTAMP NOT NULL,
    draft_type VARCHAR(50) DEFAULT 'snake',
    rounds INTEGER NOT NULL,
    seconds_per_pick INTEGER DEFAULT 90,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, paused
    current_pick INTEGER,
    current_round INTEGER,
    current_team_id UUID REFERENCES teams(id),
    is_complete BOOLEAN DEFAULT false,
    draft_order UUID[], -- Array of team IDs in draft order
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    paused_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Draft Picks
CREATE TABLE draft_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    pick_number INTEGER NOT NULL,
    round INTEGER NOT NULL,
    pick_time TIMESTAMP,
    time_taken INTEGER, -- Seconds to make pick
    is_keeper BOOLEAN DEFAULT false,
    auto_drafted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(draft_id, pick_number)
);

-- Player Stats
CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id),
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    opponent VARCHAR(10),
    is_home BOOLEAN,
    game_date TIMESTAMP,
    game_time VARCHAR(20),
    weather_conditions JSONB,
    stats JSONB NOT NULL, -- Flexible stats structure
    fantasy_points_standard DECIMAL(10,2),
    fantasy_points_ppr DECIMAL(10,2),
    fantasy_points_half_ppr DECIMAL(10,2),
    is_projection BOOLEAN DEFAULT false,
    confidence_rating DECIMAL(3,2), -- For projections
    source VARCHAR(50), -- nfl, espn, yahoo, custom
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, week, season_year, is_projection)
);

-- Chat Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    message_type VARCHAR(50) DEFAULT 'chat', -- chat, trade_offer, announcement, system, taunt
    content TEXT NOT NULL,
    parent_message_id UUID REFERENCES messages(id),
    thread_id UUID,
    is_pinned BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '{}',
    mentions UUID[] DEFAULT '{}', -- Array of mentioned user IDs
    attachments JSONB DEFAULT '[]',
    edited_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- trade, waiver, injury, score_update, chat_mention, lineup_reminder
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_email_sent BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- League Activity Feed
CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- trade, waiver, lineup_change, message, achievement
    actor_user_id UUID REFERENCES users(id),
    actor_team_id UUID REFERENCES teams(id),
    target_user_id UUID REFERENCES users(id),
    target_team_id UUID REFERENCES teams(id),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    importance VARCHAR(20) DEFAULT 'normal', -- low, normal, high
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights and Predictions
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id),
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    week INTEGER,
    insight_type VARCHAR(50) NOT NULL, -- trade_suggestion, lineup_optimization, waiver_target, injury_impact
    title VARCHAR(255),
    description TEXT,
    confidence_score DECIMAL(3,2),
    impact_score DECIMAL(3,2), -- Potential impact on team performance
    insight_data JSONB NOT NULL,
    action_items JSONB DEFAULT '[]',
    is_actionable BOOLEAN DEFAULT true,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Power Rankings
CREATE TABLE power_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    previous_rank INTEGER,
    power_score DECIMAL(10,2),
    trend VARCHAR(20), -- rising, falling, steady
    playoff_probability DECIMAL(5,2),
    championship_probability DECIMAL(5,2),
    strength_of_schedule DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(league_id, team_id, week, season_year)
);

-- Awards and Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    league_id UUID REFERENCES leagues(id),
    achievement_type VARCHAR(50) NOT NULL, -- highest_score, biggest_blowout, best_draft, etc
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    metadata JSONB DEFAULT '{}',
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_pin ON users(pin) WHERE is_demo_user = true;
CREATE INDEX idx_leagues_commissioner ON leagues(commissioner_id);
CREATE INDEX idx_leagues_active ON leagues(is_active);
CREATE INDEX idx_teams_league ON teams(league_id);
CREATE INDEX idx_teams_user ON teams(user_id);
CREATE INDEX idx_teams_standings ON teams(league_id, wins DESC, points_for DESC);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_team ON players(team);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_rosters_team ON rosters(team_id);
CREATE INDEX idx_rosters_player ON rosters(player_id);
CREATE INDEX idx_lineups_team_week ON lineups(team_id, week, season_year);
CREATE INDEX idx_lineup_slots_lineup ON lineup_slots(lineup_id);
CREATE INDEX idx_matchups_league_week ON matchups(league_id, week, season_year);
CREATE INDEX idx_matchups_teams ON matchups(home_team_id, away_team_id);
CREATE INDEX idx_transactions_league ON transactions(league_id);
CREATE INDEX idx_transactions_user ON transactions(initiated_by);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_teams ON trades(team_sender_id, team_receiver_id);
CREATE INDEX idx_waiver_claims_team ON waiver_claims(team_id);
CREATE INDEX idx_waiver_claims_status ON waiver_claims(status);
CREATE INDEX idx_draft_picks_draft ON draft_picks(draft_id);
CREATE INDEX idx_draft_picks_team ON draft_picks(team_id);
CREATE INDEX idx_player_stats_player_week ON player_stats(player_id, week, season_year);
CREATE INDEX idx_player_stats_projection ON player_stats(is_projection);
CREATE INDEX idx_messages_league ON messages(league_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_activity_feed_league ON activity_feed(league_id, created_at DESC);
CREATE INDEX idx_ai_insights_team ON ai_insights(team_id);
CREATE INDEX idx_ai_insights_actionable ON ai_insights(is_actionable, is_dismissed);
CREATE INDEX idx_power_rankings_league_week ON power_rankings(league_id, week, season_year);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lineups_updated_at BEFORE UPDATE ON lineups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();