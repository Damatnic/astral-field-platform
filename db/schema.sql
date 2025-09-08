-- Astral Field Database Schema
-- Fantasy Football League Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    commissioner_id UUID REFERENCES users(id),
    season_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    current_week INTEGER DEFAULT 1,
    max_teams INTEGER DEFAULT 12,
    scoring_settings JSONB DEFAULT '{}'::jsonb,
    roster_settings JSONB DEFAULT '{}'::jsonb,
    waiver_settings JSONB DEFAULT '{}'::jsonb,
    trade_settings JSONB DEFAULT '{}'::jsonb,
    draft_settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    team_name VARCHAR(100) NOT NULL,
    team_abbreviation VARCHAR(5),
    logo_url TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    points_for DECIMAL(10,2) DEFAULT 0,
    points_against DECIMAL(10,2) DEFAULT 0,
    waiver_priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, user_id)
);

-- NFL Teams table
CREATE TABLE IF NOT EXISTS nfl_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(5) UNIQUE NOT NULL,
    city VARCHAR(100),
    conference VARCHAR(10),
    division VARCHAR(20),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFL Players table
CREATE TABLE IF NOT EXISTS nfl_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(10) NOT NULL,
    jersey_number INTEGER,
    team_id UUID REFERENCES nfl_teams(id),
    height_inches INTEGER,
    weight_lbs INTEGER,
    birth_date DATE,
    years_pro INTEGER,
    college VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    injury_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roster table (fantasy team rosters)
CREATE TABLE IF NOT EXISTS rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES nfl_players(id),
    position_slot VARCHAR(10) NOT NULL, -- QB, RB, WR, TE, FLEX, K, DST, BN
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    is_starter BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, player_id, week, season_year)
);

-- Matchups table
CREATE TABLE IF NOT EXISTS matchups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    home_team_id UUID REFERENCES teams(id),
    away_team_id UUID REFERENCES teams(id),
    home_score DECIMAL(10,2) DEFAULT 0,
    away_score DECIMAL(10,2) DEFAULT 0,
    is_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, week, season_year, home_team_id, away_team_id)
);

-- Player Stats table
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES nfl_players(id),
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    game_date DATE,
    opponent_team_id UUID REFERENCES nfl_teams(id),
    is_home BOOLEAN DEFAULT false,
    
    -- Passing stats
    passing_yards INTEGER DEFAULT 0,
    passing_tds INTEGER DEFAULT 0,
    passing_interceptions INTEGER DEFAULT 0,
    passing_completions INTEGER DEFAULT 0,
    passing_attempts INTEGER DEFAULT 0,
    
    -- Rushing stats
    rushing_yards INTEGER DEFAULT 0,
    rushing_tds INTEGER DEFAULT 0,
    rushing_attempts INTEGER DEFAULT 0,
    
    -- Receiving stats
    receiving_yards INTEGER DEFAULT 0,
    receiving_tds INTEGER DEFAULT 0,
    receptions INTEGER DEFAULT 0,
    targets INTEGER DEFAULT 0,
    
    -- Kicking stats
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    extra_points_made INTEGER DEFAULT 0,
    extra_points_attempted INTEGER DEFAULT 0,
    
    -- Defense stats
    sacks DECIMAL(3,1) DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    fumble_recoveries INTEGER DEFAULT 0,
    defensive_tds INTEGER DEFAULT 0,
    safeties INTEGER DEFAULT 0,
    points_allowed INTEGER DEFAULT 0,
    
    -- Fantasy points
    fantasy_points DECIMAL(10,2) DEFAULT 0,
    projected_points DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, week, season_year)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    proposing_team_id UUID REFERENCES teams(id),
    receiving_team_id UUID REFERENCES teams(id),
    proposed_players JSONB NOT NULL, -- Array of player IDs from proposing team
    requested_players JSONB NOT NULL, -- Array of player IDs from receiving team
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, expired
    proposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waiver Claims table
CREATE TABLE IF NOT EXISTS waiver_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES nfl_players(id),
    dropped_player_id UUID REFERENCES nfl_players(id),
    priority INTEGER NOT NULL,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, successful, failed
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Draft table
CREATE TABLE IF NOT EXISTS draft_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES nfl_players(id),
    round INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    overall_pick INTEGER NOT NULL,
    pick_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_keeper BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League Settings table
CREATE TABLE IF NOT EXISTS league_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, setting_key)
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    league_id UUID REFERENCES leagues(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_leagues_season ON leagues(season_year);
CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league_id);
CREATE INDEX IF NOT EXISTS idx_teams_user ON teams(user_id);
CREATE INDEX IF NOT EXISTS idx_rosters_team_week ON rosters(team_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_rosters_player ON rosters(player_id);
CREATE INDEX IF NOT EXISTS idx_matchups_league_week ON matchups(league_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_week ON player_stats(player_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_trades_league ON trades(league_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_league_week ON waiver_claims(league_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_draft_picks_league ON draft_picks(league_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_league ON audit_logs(league_id);

-- Insert default NFL teams
INSERT INTO nfl_teams (name, abbreviation, city, conference, division) VALUES
('Bills', 'BUF', 'Buffalo', 'AFC', 'East'),
('Dolphins', 'MIA', 'Miami', 'AFC', 'East'),
('Patriots', 'NE', 'New England', 'AFC', 'East'),
('Jets', 'NYJ', 'New York', 'AFC', 'East'),
('Ravens', 'BAL', 'Baltimore', 'AFC', 'North'),
('Bengals', 'CIN', 'Cincinnati', 'AFC', 'North'),
('Browns', 'CLE', 'Cleveland', 'AFC', 'North'),
('Steelers', 'PIT', 'Pittsburgh', 'AFC', 'North'),
('Texans', 'HOU', 'Houston', 'AFC', 'South'),
('Colts', 'IND', 'Indianapolis', 'AFC', 'South'),
('Jaguars', 'JAX', 'Jacksonville', 'AFC', 'South'),
('Titans', 'TEN', 'Tennessee', 'AFC', 'South'),
('Broncos', 'DEN', 'Denver', 'AFC', 'West'),
('Chiefs', 'KC', 'Kansas City', 'AFC', 'West'),
('Raiders', 'LV', 'Las Vegas', 'AFC', 'West'),
('Chargers', 'LAC', 'Los Angeles', 'AFC', 'West'),
('Cowboys', 'DAL', 'Dallas', 'NFC', 'East'),
('Giants', 'NYG', 'New York', 'NFC', 'East'),
('Eagles', 'PHI', 'Philadelphia', 'NFC', 'East'),
('Commanders', 'WAS', 'Washington', 'NFC', 'East'),
('Bears', 'CHI', 'Chicago', 'NFC', 'North'),
('Lions', 'DET', 'Detroit', 'NFC', 'North'),
('Packers', 'GB', 'Green Bay', 'NFC', 'North'),
('Vikings', 'MIN', 'Minnesota', 'NFC', 'North'),
('Falcons', 'ATL', 'Atlanta', 'NFC', 'South'),
('Panthers', 'CAR', 'Carolina', 'NFC', 'South'),
('Saints', 'NO', 'New Orleans', 'NFC', 'South'),
('Buccaneers', 'TB', 'Tampa Bay', 'NFC', 'South'),
('Cardinals', 'ARI', 'Arizona', 'NFC', 'West'),
('Rams', 'LAR', 'Los Angeles', 'NFC', 'West'),
('49ers', 'SF', 'San Francisco', 'NFC', 'West'),
('Seahawks', 'SEA', 'Seattle', 'NFC', 'West')
ON CONFLICT (abbreviation) DO NOTHING;

-- Insert demo league
INSERT INTO leagues (id, name, description, season_year, current_week, max_teams) VALUES
('00000000-0000-0000-0000-000000000001', 'Demo League 2025', 'Demonstration league for testing', 2025, 1, 12)
ON CONFLICT (id) DO NOTHING;

-- Insert demo users
INSERT INTO users (id, username, email, first_name, last_name) VALUES
('11111111-1111-1111-1111-111111111111', 'demo_user_1', 'demo1@example.com', 'Mike', 'Johnson'),
('22222222-2222-2222-2222-222222222222', 'demo_user_2', 'demo2@example.com', 'Sarah', 'Wilson'),
('33333333-3333-3333-3333-333333333333', 'demo_user_3', 'demo3@example.com', 'Alex', 'Brown'),
('44444444-4444-4444-4444-444444444444', 'demo_user_4', 'demo4@example.com', 'Jessica', 'Davis')
ON CONFLICT (id) DO NOTHING;

-- Insert demo teams
INSERT INTO teams (id, league_id, user_id, team_name, team_abbreviation) VALUES
('user-team-1', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Thunder Hawks', 'THK'),
('user-team-2', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Lightning Bolts', 'LTB'),
('user-team-3', '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'Fire Dragons', 'FDR'),
('user-team-4', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Ice Wolves', 'ICW')
ON CONFLICT (id) DO NOTHING;

-- Insert demo matchup
INSERT INTO matchups (league_id, week, season_year, home_team_id, away_team_id, home_score, away_score) VALUES
('00000000-0000-0000-0000-000000000001', 1, 2025, 'user-team-1', 'user-team-2', 127.3, 118.7)
ON CONFLICT (league_id, week, season_year, home_team_id, away_team_id) DO NOTHING;

-- Insert some demo NFL players
INSERT INTO nfl_players (id, external_id, first_name, last_name, position, jersey_number) VALUES
('p1', 'josh-allen', 'Josh', 'Allen', 'QB', 17),
('p2', 'patrick-mahomes', 'Patrick', 'Mahomes', 'QB', 15),
('p3', 'christian-mccaffrey', 'Christian', 'McCaffrey', 'RB', 23),
('p4', 'derrick-henry', 'Derrick', 'Henry', 'RB', 22),
('p5', 'alvin-kamara', 'Alvin', 'Kamara', 'RB', 41),
('p6', 'tyreek-hill', 'Tyreek', 'Hill', 'WR', 10),
('p7', 'davante-adams', 'Davante', 'Adams', 'WR', 17),
('p8', 'stefon-diggs', 'Stefon', 'Diggs', 'WR', 14),
('p9', 'deandre-hopkins', 'DeAndre', 'Hopkins', 'WR', 10),
('p10', 'travis-kelce', 'Travis', 'Kelce', 'TE', 87),
('p11', 'mark-andrews', 'Mark', 'Andrews', 'TE', 89),
('p12', 'justin-tucker', 'Justin', 'Tucker', 'K', 9),
('p13', 'harrison-butker', 'Harrison', 'Butker', 'K', 7)
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nfl_players_updated_at BEFORE UPDATE ON nfl_players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matchups_updated_at BEFORE UPDATE ON matchups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Chat System Tables

-- Chat Rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'general', -- general, trades, waivers, private
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, name)
);

-- Chat Room Members table (for private rooms)
CREATE TABLE IF NOT EXISTS chat_room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- member, moderator, admin
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, emoji, gif, system
    reply_to_id UUID REFERENCES chat_messages(id), -- for threaded replies
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Typing Indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Message Read Status table
CREATE TABLE IF NOT EXISTS message_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Chat Moderation table
CREATE TABLE IF NOT EXISTS chat_moderation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES users(id),
    action VARCHAR(20) NOT NULL, -- delete, edit, warn, ban
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push Notifications table
CREATE TABLE IF NOT EXISTS push_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Analytics table
CREATE TABLE IF NOT EXISTS chat_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_messages INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    top_topics JSONB DEFAULT '[]'::jsonb,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, date)
);

-- User Chat Preferences table
CREATE TABLE IF NOT EXISTS user_chat_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    mention_notifications BOOLEAN DEFAULT true,
    private_message_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, league_id)
);

-- Create indexes for chat performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_league ON chat_rooms(league_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_room ON typing_indicators(room_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_user ON push_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_league_date ON chat_analytics(league_id, date DESC);

-- Create triggers for chat tables
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_chat_preferences_updated_at BEFORE UPDATE ON user_chat_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default chat rooms for demo league
INSERT INTO chat_rooms (id, league_id, name, description, type) VALUES
('general-room', '00000000-0000-0000-0000-000000000001', 'General', 'General discussion for the league', 'general'),
('trades-room', '00000000-0000-0000-0000-000000000001', 'Trades', 'Discuss trades and deals', 'trades'),
('waivers-room', '00000000-0000-0000-0000-000000000001', 'Waivers', 'Waiver wire discussions', 'waivers')
ON CONFLICT (id) DO NOTHING;
CREATE TRIGGER update_league_settings_updated_at BEFORE UPDATE ON league_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();