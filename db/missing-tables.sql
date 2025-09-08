-- Missing Database Tables Analysis and SQL Definitions
-- Astral Field Fantasy Football Platform
-- Generated from codebase analysis

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==================================================
-- CORE MISSING TABLES
-- ==================================================

-- 1. PLAYERS TABLE (Referenced in many places but not in main schema)
-- Used in: players API routes, roster management, draft system
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
    
    -- Indexes for performance
    INDEX idx_players_position ON players(position),
    INDEX idx_players_team ON players(nfl_team),
    INDEX idx_players_injury ON players(injury_status),
    INDEX idx_players_ownership ON players(ownership_percentage),
    UNIQUE(name, nfl_team, position)
);

-- 2. INJURY REPORTS TABLE
-- Referenced in: src/services/ai/injuryImpactAnalyzer.ts.bak
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_injury_reports_player ON injury_reports(player_id, reported_at DESC),
    INDEX idx_injury_reports_severity ON injury_reports(severity, status),
    INDEX idx_injury_reports_return ON injury_reports(estimated_return_week)
);

-- 3. LIVE FANTASY SCORES TABLE
-- Referenced in: src/services/fantasy/scoringEngine.ts, src/app/api/live/scores/route.ts
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
    game_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, live, final
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_live_scores_team_week ON live_fantasy_scores(team_id, week, season_year),
    INDEX idx_live_scores_player ON live_fantasy_scores(player_id, week, season_year),
    INDEX idx_live_scores_league ON live_fantasy_scores(league_id, week, season_year),
    INDEX idx_live_scores_updated ON live_fantasy_scores(last_updated DESC),
    UNIQUE(team_id, player_id, week, season_year)
);

-- 4. LINEUPS TABLE
-- Referenced in: src/app/api/init-league/route.ts
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
    
    -- Indexes
    INDEX idx_lineups_team_week ON lineups(team_id, week, season_year),
    INDEX idx_lineups_league ON lineups(league_id, week, season_year),
    UNIQUE(team_id, week, season_year)
);

-- 5. NFL GAMES TABLE
-- Referenced in: src/app/api/live/games/route.ts
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_nfl_games_week ON nfl_games(season_year, week),
    INDEX idx_nfl_games_teams ON nfl_games(home_team, away_team),
    INDEX idx_nfl_games_date ON nfl_games(game_date),
    INDEX idx_nfl_games_status ON nfl_games(status)
);

-- ==================================================
-- COMMUNITY AND FORUM TABLES (if not in migrations)
-- ==================================================

-- Forum tables are defined in migrations, but ensuring they exist
-- These are referenced in: src/app/api/community/ routes

-- Forum Categories (if not exists from migration)
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    sort_order INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT false,
    required_role VARCHAR(20),
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Threads (if not exists from migration)
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

-- Forum Posts (if not exists from migration)
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

-- Forum Post Reactions (if not exists from migration)
CREATE TABLE IF NOT EXISTS forum_post_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh', 'angry', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(post_id, user_id, reaction_type)
);

-- Forum Tags (referenced in community API)
CREATE TABLE IF NOT EXISTS forum_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color
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

-- Forum User Stats (referenced in community API)
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
-- ENHANCED NOTIFICATION TABLES
-- ==================================================

-- The notifications table is in enhanced-chat-schema.sql but ensure it exists
-- This is heavily referenced in notification APIs

-- ==================================================
-- ADDITIONAL MISSING TABLES FROM ANALYSIS
-- ==================================================

-- PLAYER PROJECTIONS (separate from player stats)
CREATE TABLE IF NOT EXISTS player_projections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 18),
    season_year INTEGER NOT NULL,
    projected_points DECIMAL(10,2) DEFAULT 0,
    projection_source VARCHAR(50) DEFAULT 'internal', -- internal, external, consensus
    confidence_level DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Detailed projections by category
    passing_yards INTEGER DEFAULT 0,
    passing_tds INTEGER DEFAULT 0,
    rushing_yards INTEGER DEFAULT 0,
    rushing_tds INTEGER DEFAULT 0,
    receiving_yards INTEGER DEFAULT 0,
    receiving_tds INTEGER DEFAULT 0,
    receptions INTEGER DEFAULT 0,
    
    -- Indexes
    INDEX idx_projections_player_week ON player_projections(player_id, week, season_year),
    INDEX idx_projections_week ON player_projections(week, season_year),
    UNIQUE(player_id, week, season_year, projection_source)
);

-- USER PREFERENCES (for personalized features)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE, -- NULL for global preferences
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_user_prefs_user ON user_preferences(user_id),
    INDEX idx_user_prefs_key ON user_preferences(preference_key),
    UNIQUE(user_id, league_id, preference_key)
);

-- WAIVER WIRE ACTIVITY LOG (for tracking waiver moves)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_waiver_activity_league ON waiver_activity(league_id, week, season_year),
    INDEX idx_waiver_activity_team ON waiver_activity(team_id, processed_at DESC)
);

-- TRADE HISTORY (enhanced trade tracking)
CREATE TABLE IF NOT EXISTS trade_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team1_id UUID NOT NULL REFERENCES teams(id),
    team2_id UUID NOT NULL REFERENCES teams(id),
    team1_players JSONB NOT NULL, -- Array of player objects with names/positions
    team2_players JSONB NOT NULL,
    trade_value_team1 DECIMAL(10,2),
    trade_value_team2 DECIMAL(10,2),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    week_executed INTEGER,
    season_year INTEGER NOT NULL,
    
    -- Indexes
    INDEX idx_trade_history_league ON trade_history(league_id, season_year),
    INDEX idx_trade_history_teams ON trade_history(team1_id, team2_id)
);

-- PERFORMANCE METRICS (for system monitoring)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB DEFAULT '{}', -- Additional metadata
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_performance_metrics_name ON performance_metrics(metric_name, recorded_at DESC),
    INDEX idx_performance_metrics_time ON performance_metrics(recorded_at DESC)
);

-- ==================================================
-- CREATE TRIGGERS FOR UPDATED_AT COLUMNS
-- ==================================================

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at columns
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at 
    BEFORE UPDATE ON players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lineups_updated_at ON lineups;
CREATE TRIGGER update_lineups_updated_at 
    BEFORE UPDATE ON lineups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nfl_games_updated_at ON nfl_games;
CREATE TRIGGER update_nfl_games_updated_at 
    BEFORE UPDATE ON nfl_games 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_categories_updated_at ON forum_categories;
CREATE TRIGGER update_forum_categories_updated_at 
    BEFORE UPDATE ON forum_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_threads_updated_at ON forum_threads;
CREATE TRIGGER update_forum_threads_updated_at 
    BEFORE UPDATE ON forum_threads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER update_forum_posts_updated_at 
    BEFORE UPDATE ON forum_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_tags_updated_at ON forum_tags;
CREATE TRIGGER update_forum_tags_updated_at 
    BEFORE UPDATE ON forum_tags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_user_stats_updated_at ON forum_user_stats;
CREATE TRIGGER update_forum_user_stats_updated_at 
    BEFORE UPDATE ON forum_user_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ==================================================

-- Enhanced indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_search_name ON players USING gin(to_tsvector('english', name));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_threads_search ON forum_threads USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forum_posts_search ON forum_posts USING gin(to_tsvector('english', content));

-- Composite indexes for common WHERE clauses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_live_scores_team_current ON live_fantasy_scores(team_id, game_status, current_points DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_players_position_active ON players(position, is_active, projected_points DESC);

-- ==================================================
-- FOREIGN KEY CONSTRAINTS
-- ==================================================

-- Add missing foreign key constraints where needed
-- (Most are already defined in table creation, this ensures any missed ones)

-- Ensure injury_reports references are properly constrained
ALTER TABLE injury_reports 
ADD CONSTRAINT IF NOT EXISTS fk_injury_reports_player 
FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Ensure live_fantasy_scores references are constrained  
ALTER TABLE live_fantasy_scores 
ADD CONSTRAINT IF NOT EXISTS fk_live_scores_team 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE live_fantasy_scores 
ADD CONSTRAINT IF NOT EXISTS fk_live_scores_player 
FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;

-- Ensure lineups references are constrained
ALTER TABLE lineups 
ADD CONSTRAINT IF NOT EXISTS fk_lineups_team 
FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- ==================================================
-- INITIAL DATA FOR NEW TABLES
-- ==================================================

-- Insert default forum categories if they don't exist
INSERT INTO forum_categories (name, slug, description, sort_order) VALUES
('General Discussion', 'general', 'General fantasy football discussion', 1),
('Trade Talk', 'trades', 'Discuss trades and deal proposals', 2),
('Waiver Wire', 'waivers', 'Waiver wire pickups and discussions', 3),
('Injury Reports', 'injuries', 'Player injury discussions and impact', 4),
('Rookie Talk', 'rookies', 'Rookie player discussions and analysis', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert common tags
INSERT INTO forum_tags (name, slug, description) VALUES
('trade', 'trade', 'Trade related discussions'),
('waiver', 'waiver', 'Waiver wire topics'),
('injury', 'injury', 'Player injury discussions'),
('rookie', 'rookie', 'Rookie player topics'),
('analysis', 'analysis', 'In-depth player analysis'),
('news', 'news', 'Breaking news and updates')
ON CONFLICT (slug) DO NOTHING;

-- ==================================================
-- COMMENTS AND DOCUMENTATION
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