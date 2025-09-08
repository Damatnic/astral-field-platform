-- Astral Field Complete Database Schema
-- Fantasy Football League Management System
-- Consolidated schema including all missing tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==================================================
-- CORE USER AND LEAGUE TABLES
-- ==================================================

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

-- ==================================================
-- NFL AND PLAYER DATA TABLES
-- ==================================================

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

-- NFL Players table (enhanced from original)
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

-- Players table (simplified for fantasy usage)
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    position VARCHAR(10) NOT NULL CHECK (position IN ('QB', 'RB', 'WR', 'TE', 'K', 'DST')),
    nfl_team VARCHAR(10) NOT NULL,
    player_id VARCHAR(50) UNIQUE, -- External API ID
    stats JSONB DEFAULT '{}',
    projections JSONB DEFAULT '{}',
    injury_status VARCHAR(50) DEFAULT 'healthy',
    bye_week INTEGER CHECK (bye_week BETWEEN 1 AND 18),
    ownership_percentage DECIMAL(5,2) DEFAULT 0,
    projected_points DECIMAL(10,2) DEFAULT 0,
    waiver_priority INTEGER DEFAULT 999,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, nfl_team, position)
);

-- NFL Games table
CREATE TABLE IF NOT EXISTS nfl_games (
    id VARCHAR(50) PRIMARY KEY, -- External game ID
    season_year INTEGER NOT NULL,
    week INTEGER NOT NULL,
    home_team VARCHAR(10) NOT NULL,
    away_team VARCHAR(10) NOT NULL,
    game_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, final, postponed
    quarter INTEGER DEFAULT 1,
    time_remaining VARCHAR(10),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    weather_conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- ROSTER AND LINEUP MANAGEMENT
-- ==================================================

-- Roster table (fantasy team rosters)
CREATE TABLE IF NOT EXISTS rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id),
    position_slot VARCHAR(10) NOT NULL, -- QB, RB, WR, TE, FLEX, K, DST, BN
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    is_starter BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, player_id, week, season_year)
);

-- Lineups table
CREATE TABLE IF NOT EXISTS lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 18),
    season_year INTEGER NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    total_projected_points DECIMAL(10,2) DEFAULT 0,
    total_actual_points DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, week, season_year)
);

-- ==================================================
-- SCORING AND STATISTICS
-- ==================================================

-- Player Stats table
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id),
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

-- Player Projections table
CREATE TABLE IF NOT EXISTS player_projections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 18),
    season_year INTEGER NOT NULL,
    projected_points DECIMAL(10,2) DEFAULT 0,
    projection_source VARCHAR(50) DEFAULT 'internal',
    confidence_level DECIMAL(3,2) DEFAULT 0.5,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Detailed projections
    passing_yards INTEGER DEFAULT 0,
    passing_tds INTEGER DEFAULT 0,
    rushing_yards INTEGER DEFAULT 0,
    rushing_tds INTEGER DEFAULT 0,
    receiving_yards INTEGER DEFAULT 0,
    receiving_tds INTEGER DEFAULT 0,
    receptions INTEGER DEFAULT 0,
    
    UNIQUE(player_id, week, season_year, projection_source)
);

-- Live Fantasy Scores table
CREATE TABLE IF NOT EXISTS live_fantasy_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 18),
    season_year INTEGER NOT NULL,
    current_points DECIMAL(10,2) DEFAULT 0,
    projected_points DECIMAL(10,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    game_status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, player_id, week, season_year)
);

-- ==================================================
-- MATCHUPS AND COMPETITION
-- ==================================================

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

-- ==================================================
-- TRADING AND TRANSACTIONS
-- ==================================================

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    proposing_team_id UUID REFERENCES teams(id),
    receiving_team_id UUID REFERENCES teams(id),
    proposed_players JSONB NOT NULL,
    requested_players JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    proposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade History table
CREATE TABLE IF NOT EXISTS trade_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team1_id UUID NOT NULL REFERENCES teams(id),
    team2_id UUID NOT NULL REFERENCES teams(id),
    team1_players JSONB NOT NULL,
    team2_players JSONB NOT NULL,
    trade_value_team1 DECIMAL(10,2),
    trade_value_team2 DECIMAL(10,2),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    week_executed INTEGER,
    season_year INTEGER NOT NULL
);

-- Waiver Claims table
CREATE TABLE IF NOT EXISTS waiver_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    dropped_player_id UUID REFERENCES players(id),
    priority INTEGER NOT NULL,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waiver Activity table
CREATE TABLE IF NOT EXISTS waiver_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('claim', 'drop', 'add')),
    player_added_id UUID REFERENCES players(id),
    player_dropped_id UUID REFERENCES players(id),
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    waiver_priority_used INTEGER,
    faab_bid INTEGER DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- DRAFT SYSTEM
-- ==================================================

-- Draft table
CREATE TABLE IF NOT EXISTS draft_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    round INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    overall_pick INTEGER NOT NULL,
    pick_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_keeper BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- INJURY TRACKING
-- ==================================================

-- Injury Reports table
CREATE TABLE IF NOT EXISTS injury_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    injury_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'season_ending')),
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL,
    estimated_return_week INTEGER,
    fantasy_impact JSONB NOT NULL DEFAULT '{}',
    replacement_data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'healing', 'resolved', 'worsened')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- CHAT AND MESSAGING SYSTEM
-- ==================================================

-- Chat Rooms table (enhanced)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('general', 'trades', 'waivers', 'off-topic', 'game-thread', 'celebrations', 'trash-talk')),
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, type)
);

-- Enhanced Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    room_type VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'gif', 'file', 'system')),
    reply_to_id UUID REFERENCES chat_messages(id),
    gif_url TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    is_edited BOOLEAN DEFAULT false,
    edit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE
);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'gif', 'file', 'emoji')),
    gif_url TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    is_read BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE
);

-- Message Reactions (for chat messages)
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Direct Message Reactions
CREATE TABLE IF NOT EXISTS dm_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- User Chat Preferences
CREATE TABLE IF NOT EXISTS user_chat_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    mention_notifications BOOLEAN DEFAULT true,
    private_message_notifications BOOLEAN DEFAULT true,
    trash_talk_notifications BOOLEAN DEFAULT true,
    game_update_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, league_id)
);

-- ==================================================
-- COMMUNITY FORUM SYSTEM
-- ==================================================

-- Forum Categories
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    sort_order INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT false,
    required_role VARCHAR(20),
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Threads
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_announcement BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    last_post_id UUID,
    last_post_at TIMESTAMP WITH TIME ZONE,
    last_post_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Fantasy football specific fields
    is_trade_discussion BOOLEAN DEFAULT false,
    is_waiver_discussion BOOLEAN DEFAULT false,
    is_player_discussion BOOLEAN DEFAULT false,
    related_player_id UUID REFERENCES players(id),
    related_team_name VARCHAR(50),
    fantasy_week INTEGER CHECK (fantasy_week BETWEEN 1 AND 18)
);

-- Forum Posts
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    parent_post_id UUID REFERENCES forum_posts(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_solution BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    edit_count INTEGER DEFAULT 0,
    last_edited_at TIMESTAMP WITH TIME ZONE,
    last_edited_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Content moderation
    is_moderated BOOLEAN DEFAULT false,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by UUID REFERENCES users(id),
    moderation_reason TEXT
);

-- Forum Post Reactions
CREATE TABLE IF NOT EXISTS forum_post_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh', 'angry', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, reaction_type)
);

-- Forum Tags
CREATE TABLE IF NOT EXISTS forum_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Thread Tags (junction table)
CREATE TABLE IF NOT EXISTS forum_thread_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES forum_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(thread_id, tag_id)
);

-- Forum User Stats
CREATE TABLE IF NOT EXISTS forum_user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ==================================================
-- NOTIFICATIONS SYSTEM
-- ==================================================

-- Enhanced Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('player_injury', 'score_update', 'trade_offer', 'trade_completed', 'waiver_result', 'league_announcement', 'mention', 'celebration', 'direct_message', 'system')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push Notification Tokens
CREATE TABLE IF NOT EXISTS push_notification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, token, platform)
);

-- ==================================================
-- LIVE GAME FEATURES
-- ==================================================

-- Live Game Plays
CREATE TABLE IF NOT EXISTS game_plays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id VARCHAR(50) NOT NULL,
    nfl_game_id VARCHAR(50),
    quarter INTEGER NOT NULL,
    time_remaining VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    play_type VARCHAR(30) NOT NULL CHECK (play_type IN ('touchdown', 'field-goal', 'interception', 'fumble', 'sack', 'big-play', 'regular', 'penalty')),
    player_id VARCHAR(50),
    player_name VARCHAR(100),
    team VARCHAR(10),
    yards INTEGER,
    points INTEGER DEFAULT 0,
    is_scoring_play BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Play Reactions
CREATE TABLE IF NOT EXISTS play_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    play_id UUID NOT NULL REFERENCES game_plays(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(play_id, user_id, emoji)
);

-- Live User Reactions
CREATE TABLE IF NOT EXISTS live_user_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id VARCHAR(50) NOT NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- SYSTEM AND MONITORING
-- ==================================================

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

-- User Preferences (enhanced)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, league_id, preference_key)
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- ==================================================
-- INDEXES FOR PERFORMANCE
-- ==================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_leagues_season ON leagues(season_year);
CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league_id);
CREATE INDEX IF NOT EXISTS idx_teams_user ON teams(user_id);

-- Player and stats indexes
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(nfl_team);
CREATE INDEX IF NOT EXISTS idx_players_injury ON players(injury_status);
CREATE INDEX IF NOT EXISTS idx_players_ownership ON players(ownership_percentage);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_week ON player_stats(player_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_projections_player_week ON player_projections(player_id, week, season_year);

-- Roster and lineup indexes
CREATE INDEX IF NOT EXISTS idx_rosters_team_week ON rosters(team_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_rosters_player ON rosters(player_id);
CREATE INDEX IF NOT EXISTS idx_lineups_team_week ON lineups(team_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_lineups_league ON lineups(league_id, week, season_year);

-- Live scoring indexes
CREATE INDEX IF NOT EXISTS idx_live_scores_team_week ON live_fantasy_scores(team_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_live_scores_player ON live_fantasy_scores(player_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_live_scores_league ON live_fantasy_scores(league_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_live_scores_updated ON live_fantasy_scores(last_updated DESC);

-- Game and matchup indexes
CREATE INDEX IF NOT EXISTS idx_matchups_league_week ON matchups(league_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_nfl_games_week ON nfl_games(season_year, week);
CREATE INDEX IF NOT EXISTS idx_nfl_games_teams ON nfl_games(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_nfl_games_date ON nfl_games(game_date);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_trades_league ON trades(league_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_league_week ON waiver_claims(league_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_waiver_activity_league ON waiver_activity(league_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_waiver_activity_team ON waiver_activity(team_id, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_draft_picks_league ON draft_picks(league_id);

-- Injury tracking indexes
CREATE INDEX IF NOT EXISTS idx_injury_reports_player ON injury_reports(player_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_injury_reports_severity ON injury_reports(severity, status);
CREATE INDEX IF NOT EXISTS idx_injury_reports_return ON injury_reports(estimated_return_week);

-- Chat and messaging indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_league ON chat_rooms(league_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_league_room_time ON chat_messages(league_id, room_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON dm_reactions(message_id);

-- Forum indexes
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_post_reactions_post ON forum_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_thread_tags_thread ON forum_thread_tags(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_thread_tags_tag ON forum_thread_tags(tag_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_notification_tokens(user_id, is_active);

-- Live game indexes
CREATE INDEX IF NOT EXISTS idx_game_plays_game_time ON game_plays(game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_play_reactions_play ON play_reactions(play_id, created_at);
CREATE INDEX IF NOT EXISTS idx_live_reactions_game ON live_user_reactions(game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_reactions_league ON live_user_reactions(league_id, created_at DESC);

-- System indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_league ON audit_logs(league_id);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prefs_key ON user_preferences(preference_key);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name, recorded_at DESC);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_search_name ON players USING gin(to_tsvector('english', name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_threads_search ON forum_threads USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_posts_search ON forum_posts USING gin(to_tsvector('english', content));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_fts ON chat_messages USING gin(to_tsvector('english', content));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_direct_messages_fts ON direct_messages USING gin(to_tsvector('english', content));

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_live_scores_team_current ON live_fantasy_scores(team_id, game_status, current_points DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_position_active ON players(position, is_active, projected_points DESC);

-- ==================================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- ==================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nfl_players_updated_at BEFORE UPDATE ON nfl_players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nfl_games_updated_at BEFORE UPDATE ON nfl_games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lineups_updated_at BEFORE UPDATE ON lineups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matchups_updated_at BEFORE UPDATE ON matchups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON direct_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_chat_preferences_updated_at BEFORE UPDATE ON user_chat_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_categories_updated_at BEFORE UPDATE ON forum_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_tags_updated_at BEFORE UPDATE ON forum_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_user_stats_updated_at BEFORE UPDATE ON forum_user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_notification_tokens_updated_at BEFORE UPDATE ON push_notification_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_league_settings_updated_at BEFORE UPDATE ON league_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- INITIAL DATA INSERTS
-- ==================================================

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

-- Insert default forum categories
INSERT INTO forum_categories (name, slug, description, sort_order) VALUES
('General Discussion', 'general', 'General fantasy football discussion', 1),
('Trade Talk', 'trades', 'Discuss trades and deal proposals', 2),
('Waiver Wire', 'waivers', 'Waiver wire pickups and discussions', 3),
('Injury Reports', 'injuries', 'Player injury discussions and impact', 4),
('Rookie Talk', 'rookies', 'Rookie player discussions and analysis', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert common forum tags
INSERT INTO forum_tags (name, slug, description) VALUES
('trade', 'trade', 'Trade related discussions'),
('waiver', 'waiver', 'Waiver wire topics'),
('injury', 'injury', 'Player injury discussions'),
('rookie', 'rookie', 'Rookie player topics'),
('analysis', 'analysis', 'In-depth player analysis'),
('news', 'news', 'Breaking news and updates')
ON CONFLICT (slug) DO NOTHING;

-- Insert default chat rooms for existing leagues
INSERT INTO chat_rooms (league_id, name, description, type, created_at) 
SELECT 
    l.id,
    CASE 
        WHEN r.type = 'general' THEN 'General Chat'
        WHEN r.type = 'trades' THEN 'Trade Talk'
        WHEN r.type = 'waivers' THEN 'Waiver Wire'
        WHEN r.type = 'trash-talk' THEN 'Trash Talk Central'
        WHEN r.type = 'celebrations' THEN 'Victory Celebrations'
        ELSE INITCAP(r.type)
    END as name,
    CASE 
        WHEN r.type = 'general' THEN 'General league discussion'
        WHEN r.type = 'trades' THEN 'Discuss trades and proposals'
        WHEN r.type = 'waivers' THEN 'Waiver wire pickup discussions'
        WHEN r.type = 'trash-talk' THEN 'Competitive banter and roasting'
        WHEN r.type = 'celebrations' THEN 'Celebrate your victories!'
        ELSE 'League ' || r.type || ' discussion'
    END as description,
    r.type,
    NOW()
FROM leagues l
CROSS JOIN (VALUES 
    ('general'),
    ('trades'), 
    ('waivers'),
    ('trash-talk'),
    ('celebrations')
) AS r(type)
WHERE NOT EXISTS (
    SELECT 1 FROM chat_rooms cr 
    WHERE cr.league_id = l.id AND cr.type = r.type
);

-- ==================================================
-- COMMENTS
-- ==================================================

COMMENT ON TABLE players IS 'Core players table for fantasy football - stores all NFL players with stats and projections';
COMMENT ON TABLE injury_reports IS 'Tracks player injuries with fantasy impact analysis and replacement recommendations';
COMMENT ON TABLE live_fantasy_scores IS 'Real-time fantasy scoring for players during games';
COMMENT ON TABLE lineups IS 'Weekly fantasy lineups for each team';
COMMENT ON TABLE nfl_games IS 'NFL game schedule and live game information';
COMMENT ON TABLE forum_categories IS 'Categories for community forum discussions';
COMMENT ON TABLE forum_threads IS 'Forum discussion threads with fantasy football context';
COMMENT ON TABLE forum_posts IS 'Individual posts within forum threads';
COMMENT ON TABLE forum_tags IS 'Tags for categorizing and searching forum content';
COMMENT ON TABLE player_projections IS 'Weekly projections for fantasy players from various sources';
COMMENT ON TABLE user_preferences IS 'User-specific preferences and settings';
COMMENT ON TABLE waiver_activity IS 'Log of all waiver wire transactions';
COMMENT ON TABLE trade_history IS 'Historical record of executed trades with valuation';
COMMENT ON TABLE performance_metrics IS 'System performance and monitoring metrics';