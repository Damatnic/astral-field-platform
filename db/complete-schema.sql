-- Astral Field Complete Database Schema
-- Consolidated from all schema sources
-- Version: 2.0.0 - Unified Schema
-- Created: 2025-01-08

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CORE USER AND AUTHENTICATION TABLES
-- ============================================================================

-- Users table (unified from all sources)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stack_user_id TEXT UNIQUE, -- Stack Auth integration
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- For non-Stack Auth users
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(100),
    avatar_url TEXT,
    auth_provider VARCHAR(50) DEFAULT 'email',
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    preferences JSONB DEFAULT '{}'::jsonb,
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    pin VARCHAR(6), -- For demo mode
    is_demo_user BOOLEAN DEFAULT false
);

-- ============================================================================
-- LEAGUE MANAGEMENT TABLES
-- ============================================================================

-- Leagues table (comprehensive from all sources)
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    commissioner_id UUID REFERENCES users(id),
    season_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    current_week INTEGER DEFAULT 1,
    max_teams INTEGER DEFAULT 12,
    league_type VARCHAR(50) DEFAULT 'redraft', -- redraft, keeper, dynasty
    scoring_type VARCHAR(50) DEFAULT 'ppr', -- standard, ppr, half_ppr, custom
    draft_date TIMESTAMP WITH TIME ZONE,
    draft_type VARCHAR(50) DEFAULT 'snake', -- snake, auction, linear
    draft_order_type VARCHAR(50) DEFAULT 'random',
    playoff_teams INTEGER DEFAULT 6,
    playoff_start_week INTEGER DEFAULT 15,
    trade_deadline_week INTEGER DEFAULT 10,
    waiver_type VARCHAR(50) DEFAULT 'faab',
    waiver_budget INTEGER DEFAULT 100,
    waiver_process_day VARCHAR(20) DEFAULT 'wednesday',
    waiver_process_time TIME DEFAULT '03:00:00',
    roster_positions JSONB DEFAULT '{
        "QB": 1, "RB": 2, "WR": 2, "TE": 1, "FLEX": 1, 
        "DST": 1, "K": 1, "BENCH": 7, "IR": 2
    }'::jsonb,
    scoring_settings JSONB DEFAULT '{
        "passing": {"yards": 0.04, "touchdowns": 4, "interceptions": -2},
        "rushing": {"yards": 0.1, "touchdowns": 6},
        "receiving": {"receptions": 1, "yards": 0.1, "touchdowns": 6},
        "kicking": {"pat": 1, "fg_0_39": 3, "fg_40_49": 4, "fg_50_plus": 5},
        "defense": {"sack": 1, "interception": 2, "fumble_recovery": 2, "touchdown": 6}
    }'::jsonb,
    roster_settings JSONB DEFAULT '{}'::jsonb,
    waiver_settings JSONB DEFAULT '{}'::jsonb,
    trade_settings JSONB DEFAULT '{}'::jsonb,
    draft_settings JSONB DEFAULT '{}'::jsonb,
    league_settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    invite_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table (unified structure)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    team_name VARCHAR(255) NOT NULL,
    team_abbreviation VARCHAR(5),
    logo_url TEXT,
    motto TEXT,
    draft_position INTEGER,
    waiver_priority INTEGER DEFAULT 1,
    waiver_budget_remaining INTEGER,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    points_for DECIMAL(10,2) DEFAULT 0,
    points_against DECIMAL(10,2) DEFAULT 0,
    standing_position INTEGER,
    playoff_seed INTEGER,
    is_eliminated BOOLEAN DEFAULT false,
    streak VARCHAR(10) DEFAULT 'W0',
    last_5 VARCHAR(5) DEFAULT '0-0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, user_id),
    UNIQUE(league_id, team_name)
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

-- ============================================================================
-- PLAYER AND NFL TABLES
-- ============================================================================

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

-- NFL Players table (comprehensive)
CREATE TABLE IF NOT EXISTS nfl_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) UNIQUE, -- External API IDs
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL, -- Full name for compatibility
    position VARCHAR(10) NOT NULL,
    jersey_number INTEGER,
    team_id UUID REFERENCES nfl_teams(id),
    team VARCHAR(10), -- NFL team abbreviation for compatibility
    height_inches INTEGER,
    height VARCHAR(10), -- String format for compatibility
    weight_lbs INTEGER,
    weight INTEGER, -- Alias for compatibility
    birth_date DATE,
    age INTEGER,
    years_pro INTEGER,
    years_experience INTEGER, -- Alias for compatibility
    college VARCHAR(100),
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    injury_status VARCHAR(50), -- healthy, questionable, doubtful, out, ir
    injury_description TEXT,
    injury_updated_at TIMESTAMP WITH TIME ZONE,
    bye_week INTEGER,
    adp DECIMAL(5,2), -- Average Draft Position
    auction_value INTEGER,
    is_rookie BOOLEAN DEFAULT false,
    stats JSONB DEFAULT '{}'::jsonb, -- Current season stats
    projections JSONB DEFAULT '{}'::jsonb, -- Season projections
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROSTER AND LINEUP MANAGEMENT
-- ============================================================================

-- Rosters table (team-player relationships)
CREATE TABLE IF NOT EXISTS rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES nfl_players(id),
    position_slot VARCHAR(20), -- QB, RB1, RB2, WR1, WR2, TE, FLEX, DST, K, BENCH, IR
    roster_position VARCHAR(20), -- Alias for compatibility
    acquisition_type VARCHAR(50) DEFAULT 'draft', -- draft, waiver, trade, free_agent
    acquisition_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acquisition_cost INTEGER, -- FAAB amount or draft round
    week INTEGER, -- For weekly roster tracking
    season_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    is_starter BOOLEAN DEFAULT false,
    is_keeper BOOLEAN DEFAULT false,
    keeper_round INTEGER,
    keeper_years_remaining INTEGER,
    dropped_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, player_id, week, season_year)
);

-- Weekly Lineups
CREATE TABLE IF NOT EXISTS lineups (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(team_id, week, season_year)
);

-- Lineup Slots
CREATE TABLE IF NOT EXISTS lineup_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lineup_id UUID REFERENCES lineups(id) ON DELETE CASCADE,
    player_id UUID REFERENCES nfl_players(id),
    slot_position VARCHAR(20) NOT NULL, -- QB, RB, WR, TE, FLEX, DST, K
    projected_points DECIMAL(10,2),
    actual_points DECIMAL(10,2),
    is_locked BOOLEAN DEFAULT false,
    lock_time TIMESTAMP WITH TIME ZONE,
    game_status VARCHAR(50), -- scheduled, in_progress, final
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lineup_id, slot_position)
);

-- ============================================================================
-- MATCHUPS AND SCORING
-- ============================================================================

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
    home_projected DECIMAL(10,2),
    away_projected DECIMAL(10,2),
    home_optimal_score DECIMAL(10,2),
    away_optimal_score DECIMAL(10,2),
    winner_id UUID REFERENCES teams(id),
    is_playoff BOOLEAN DEFAULT false,
    is_championship BOOLEAN DEFAULT false,
    is_consolation BOOLEAN DEFAULT false,
    is_complete BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, week, season_year, home_team_id, away_team_id)
);

-- Player Stats table (comprehensive stats tracking)
CREATE TABLE IF NOT EXISTS player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES nfl_players(id),
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    game_date DATE,
    opponent VARCHAR(10),
    opponent_team_id UUID REFERENCES nfl_teams(id),
    is_home BOOLEAN DEFAULT false,
    game_time VARCHAR(20),
    weather_conditions JSONB,
    
    -- Individual stat columns (for compatibility)
    passing_yards INTEGER DEFAULT 0,
    passing_tds INTEGER DEFAULT 0,
    passing_interceptions INTEGER DEFAULT 0,
    passing_completions INTEGER DEFAULT 0,
    passing_attempts INTEGER DEFAULT 0,
    rushing_yards INTEGER DEFAULT 0,
    rushing_tds INTEGER DEFAULT 0,
    rushing_attempts INTEGER DEFAULT 0,
    receiving_yards INTEGER DEFAULT 0,
    receiving_tds INTEGER DEFAULT 0,
    receptions INTEGER DEFAULT 0,
    targets INTEGER DEFAULT 0,
    field_goals_made INTEGER DEFAULT 0,
    field_goals_attempted INTEGER DEFAULT 0,
    extra_points_made INTEGER DEFAULT 0,
    extra_points_attempted INTEGER DEFAULT 0,
    sacks DECIMAL(3,1) DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    fumble_recoveries INTEGER DEFAULT 0,
    defensive_tds INTEGER DEFAULT 0,
    safeties INTEGER DEFAULT 0,
    points_allowed INTEGER DEFAULT 0,
    
    -- Flexible stats structure (for extensibility)
    stats JSONB DEFAULT '{}'::jsonb,
    game_stats JSONB DEFAULT '{}'::jsonb, -- Alias for compatibility
    
    -- Fantasy points for different scoring systems
    fantasy_points DECIMAL(10,2) DEFAULT 0,
    fantasy_points_standard DECIMAL(10,2),
    fantasy_points_ppr DECIMAL(10,2),
    fantasy_points_half_ppr DECIMAL(10,2),
    projected_points DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    is_projection BOOLEAN DEFAULT false,
    confidence_rating DECIMAL(3,2), -- For projections
    source VARCHAR(50) DEFAULT 'nfl', -- nfl, espn, yahoo, custom
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, week, season_year, is_projection)
);

-- ============================================================================
-- DRAFT SYSTEM
-- ============================================================================

-- Drafts table
CREATE TABLE IF NOT EXISTS drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    draft_date TIMESTAMP WITH TIME ZONE NOT NULL,
    draft_type VARCHAR(50) DEFAULT 'snake',
    rounds INTEGER NOT NULL,
    seconds_per_pick INTEGER DEFAULT 90,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, paused
    current_pick INTEGER,
    current_round INTEGER,
    current_team_id UUID REFERENCES teams(id),
    is_complete BOOLEAN DEFAULT false,
    draft_order UUID[], -- Array of team IDs in draft order
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Draft Picks table
CREATE TABLE IF NOT EXISTS draft_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES nfl_players(id),
    round INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    overall_pick INTEGER NOT NULL,
    pick_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_taken INTEGER, -- Seconds to make pick
    is_keeper BOOLEAN DEFAULT false,
    auto_drafted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, overall_pick),
    UNIQUE(draft_id, pick_number)
);

-- ============================================================================
-- TRADING SYSTEM
-- ============================================================================

-- Transactions table (parent for all transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- add, drop, trade, draft, commissioner
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled, completed
    initiated_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    details JSONB NOT NULL, -- Flexible structure for different transaction types
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades table (comprehensive trading system)
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    proposing_team_id UUID REFERENCES teams(id), -- Backward compatibility
    receiving_team_id UUID REFERENCES teams(id), -- Backward compatibility
    team_sender_id UUID REFERENCES teams(id),
    team_receiver_id UUID REFERENCES teams(id),
    proposed_players JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of player IDs from proposing team
    requested_players JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of player IDs from receiving team
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, expired, vetoed, proposed
    proposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    veto_votes INTEGER DEFAULT 0,
    veto_threshold INTEGER,
    veto_voters UUID[] DEFAULT '{}',
    commissioner_review BOOLEAN DEFAULT false,
    trade_grade_sender VARCHAR(5),
    trade_grade_receiver VARCHAR(5),
    ai_analysis JSONB,
    counter_offer_id UUID REFERENCES trades(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade Items table (detailed trade components)
CREATE TABLE IF NOT EXISTS trade_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES nfl_players(id),
    draft_pick_round INTEGER,
    draft_pick_year INTEGER,
    draft_pick_original_team_id UUID REFERENCES teams(id),
    faab_amount INTEGER,
    item_type VARCHAR(50) NOT NULL, -- player, pick, faab
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- WAIVER SYSTEM
-- ============================================================================

-- Waiver Claims table
CREATE TABLE IF NOT EXISTS waiver_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES nfl_players(id), -- Player being added
    player_add_id UUID REFERENCES nfl_players(id), -- Alias for compatibility
    dropped_player_id UUID REFERENCES nfl_players(id), -- Player being dropped
    player_drop_id UUID REFERENCES nfl_players(id), -- Alias for compatibility
    priority INTEGER NOT NULL,
    waiver_priority INTEGER, -- Alias for compatibility
    faab_amount INTEGER,
    week INTEGER NOT NULL,
    season_year INTEGER NOT NULL,
    process_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, successful, failed, cancelled
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENHANCED CHAT AND MESSAGING SYSTEM
-- ============================================================================

-- Chat Rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'general', -- general, trades, waivers, off-topic, game-thread, celebrations, trash-talk
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, name),
    UNIQUE(league_id, type)
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
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    room_type VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, emoji, gif, file, system
    reply_to_id UUID REFERENCES chat_messages(id), -- for threaded replies
    parent_message_id UUID REFERENCES chat_messages(id), -- Alias for compatibility
    gif_url TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    is_edited BOOLEAN DEFAULT false,
    edit_count INTEGER DEFAULT 0,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Direct Messages table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, gif, file, emoji
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

-- Message Reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Direct Message Reactions table
CREATE TABLE IF NOT EXISTS dm_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Typing Indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 seconds'),
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
    action VARCHAR(20) NOT NULL, -- delete, edit, warn, ban, hide, timeout
    reason TEXT,
    duration_minutes INTEGER, -- For timeouts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    trash_talk_notifications BOOLEAN DEFAULT true,
    game_update_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, league_id)
);

-- ============================================================================
-- ADVANCED MESSAGING FEATURES
-- ============================================================================

-- Trash Talk Messages table
CREATE TABLE IF NOT EXISTS trash_talk_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, gif, meme, roast
    gif_url TEXT,
    meme_url TEXT,
    is_roast BOOLEAN DEFAULT false,
    target_user_id UUID REFERENCES users(id),
    roast_quality_score DECIMAL(3,1), -- Community rating 1-10
    is_moderated BOOLEAN DEFAULT false,
    moderation_reason TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trash Talk Reactions table
CREATE TABLE IF NOT EXISTS trash_talk_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES trash_talk_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- League Celebrations table
CREATE TABLE IF NOT EXISTS league_celebrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    celebration_type VARCHAR(30) NOT NULL, -- touchdown, victory, milestone, championship, comeback, perfect_week
    trigger_data JSONB, -- Details about what triggered the celebration
    message TEXT,
    gif_url TEXT,
    duration_seconds INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- ============================================================================
-- LIVE GAME FEATURES
-- ============================================================================

-- Game Plays table (for live game commentary)
CREATE TABLE IF NOT EXISTS game_plays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id VARCHAR(50) NOT NULL,
    nfl_game_id VARCHAR(50), -- External NFL API game ID
    quarter INTEGER NOT NULL,
    time_remaining VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    play_type VARCHAR(30) NOT NULL, -- touchdown, field-goal, interception, fumble, sack, big-play, regular, penalty
    player_id VARCHAR(50),
    player_name VARCHAR(100),
    team VARCHAR(10),
    yards INTEGER,
    points INTEGER DEFAULT 0,
    is_scoring_play BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Play Reactions table
CREATE TABLE IF NOT EXISTS play_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    play_id UUID NOT NULL REFERENCES game_plays(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(play_id, user_id, emoji)
);

-- Live User Reactions table
CREATE TABLE IF NOT EXISTS live_user_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id VARCHAR(50) NOT NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS AND COMMUNICATION
-- ============================================================================

-- Enhanced Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- player_injury, score_update, trade_offer, trade_completed, waiver_result, league_announcement, mention, celebration, direct_message, system
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent, normal
    title VARCHAR(255) NOT NULL,
    message TEXT,
    body TEXT, -- Alias for compatibility
    data JSONB DEFAULT '{}', -- Additional structured data
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_email_sent BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Push Notification Tokens table
CREATE TABLE IF NOT EXISTS push_notification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL, -- web, ios, android
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, token, platform)
);

-- Push Notifications table (legacy compatibility)
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

-- ============================================================================
-- ANALYTICS AND INSIGHTS
-- ============================================================================

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, date)
);

-- Power Rankings table
CREATE TABLE IF NOT EXISTS power_rankings (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, team_id, week, season_year)
);

-- AI Insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES leagues(id),
    team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES nfl_players(id),
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
    dismissed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- COMMUNITY AND GAMIFICATION
-- ============================================================================

-- Messages table (general league messaging)
CREATE TABLE IF NOT EXISTS messages (
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
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Feed table
CREATE TABLE IF NOT EXISTS activity_feed (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    league_id UUID REFERENCES leagues(id),
    achievement_type VARCHAR(50) NOT NULL, -- highest_score, biggest_blowout, best_draft, etc
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    metadata JSONB DEFAULT '{}',
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MONITORING AND SYSTEM METRICS
-- ============================================================================

-- Audit Logs table
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

-- WebSocket Connection Metrics table
CREATE TABLE IF NOT EXISTS websocket_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    total_connections INTEGER DEFAULT 0,
    peak_connections INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    data_transferred_mb DECIMAL(10,2) DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    average_latency_ms DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, hour)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_stack_user_id ON users(stack_user_id);
CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin) WHERE is_demo_user = true;

CREATE INDEX IF NOT EXISTS idx_leagues_commissioner ON leagues(commissioner_id);
CREATE INDEX IF NOT EXISTS idx_leagues_season ON leagues(season_year);
CREATE INDEX IF NOT EXISTS idx_leagues_active ON leagues(is_active);

CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league_id);
CREATE INDEX IF NOT EXISTS idx_teams_user ON teams(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_standings ON teams(league_id, wins DESC, points_for DESC);

CREATE INDEX IF NOT EXISTS idx_nfl_players_position ON nfl_players(position);
CREATE INDEX IF NOT EXISTS idx_nfl_players_team ON nfl_players(team);
CREATE INDEX IF NOT EXISTS idx_nfl_players_name ON nfl_players(name);
CREATE INDEX IF NOT EXISTS idx_nfl_players_external_id ON nfl_players(external_id);

CREATE INDEX IF NOT EXISTS idx_rosters_team ON rosters(team_id);
CREATE INDEX IF NOT EXISTS idx_rosters_player ON rosters(player_id);
CREATE INDEX IF NOT EXISTS idx_rosters_team_week ON rosters(team_id, week, season_year);

CREATE INDEX IF NOT EXISTS idx_lineups_team_week ON lineups(team_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_lineup_slots_lineup ON lineup_slots(lineup_id);

CREATE INDEX IF NOT EXISTS idx_matchups_league_week ON matchups(league_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_matchups_teams ON matchups(home_team_id, away_team_id);

CREATE INDEX IF NOT EXISTS idx_player_stats_player_week ON player_stats(player_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_player_stats_projection ON player_stats(is_projection);

CREATE INDEX IF NOT EXISTS idx_draft_picks_league ON draft_picks(league_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_draft ON draft_picks(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_picks_team ON draft_picks(team_id);

CREATE INDEX IF NOT EXISTS idx_transactions_league ON transactions(league_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(initiated_by);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_trades_league ON trades(league_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_teams ON trades(team_sender_id, team_receiver_id);

CREATE INDEX IF NOT EXISTS idx_waiver_claims_league_week ON waiver_claims(league_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_team ON waiver_claims(team_id);
CREATE INDEX IF NOT EXISTS idx_waiver_claims_status ON waiver_claims(status);

-- Chat and messaging indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_league ON chat_rooms(league_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_league_room_time ON chat_messages(league_id, room_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_room ON typing_indicators(room_id, expires_at);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_push_notification_tokens_user ON push_notification_tokens(user_id, is_active);

-- Live game indexes
CREATE INDEX IF NOT EXISTS idx_game_plays_game_time ON game_plays(game_id, quarter, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_play_reactions_play ON play_reactions(play_id, created_at);
CREATE INDEX IF NOT EXISTS idx_live_user_reactions_game ON live_user_reactions(game_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_user_reactions_league ON live_user_reactions(league_id, created_at DESC);

-- Trash talk indexes
CREATE INDEX IF NOT EXISTS idx_trash_talk_league_time ON trash_talk_messages(league_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_talk_target_user ON trash_talk_messages(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_talk_reactions_message ON trash_talk_reactions(message_id, created_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_chat_analytics_league_date ON chat_analytics(league_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_power_rankings_league_week ON power_rankings(league_id, week, season_year);
CREATE INDEX IF NOT EXISTS idx_ai_insights_team ON ai_insights(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_actionable ON ai_insights(is_actionable, is_dismissed);

-- Activity and audit indexes
CREATE INDEX IF NOT EXISTS idx_messages_league ON messages(league_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_league ON activity_feed(league_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_league ON audit_logs(league_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_fts ON chat_messages USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_direct_messages_fts ON direct_messages USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_trash_talk_fts ON trash_talk_messages USING gin(to_tsvector('english', content));

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nfl_players_updated_at BEFORE UPDATE ON nfl_players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rosters_updated_at BEFORE UPDATE ON rosters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lineups_updated_at BEFORE UPDATE ON lineups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matchups_updated_at BEFORE UPDATE ON matchups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waiver_claims_updated_at BEFORE UPDATE ON waiver_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_league_settings_updated_at BEFORE UPDATE ON league_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON direct_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_chat_preferences_updated_at BEFORE UPDATE ON user_chat_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_push_notification_tokens_updated_at BEFORE UPDATE ON push_notification_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired typing indicators
    DELETE FROM typing_indicators WHERE expires_at < NOW() - INTERVAL '1 minute';
    
    -- Clean up old live user reactions (keep last 24 hours)
    DELETE FROM live_user_reactions WHERE created_at < NOW() - INTERVAL '24 hours';
    
    -- Clean up expired notifications
    DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Clean up inactive push tokens (not used in 30 days)
    UPDATE push_notification_tokens 
    SET is_active = FALSE 
    WHERE last_used < NOW() - INTERVAL '30 days' AND is_active = TRUE;
    
    -- Clean up expired celebrations
    DELETE FROM league_celebrations WHERE expires_at < NOW();
    
    -- Archive old websocket metrics (keep last 90 days)
    DELETE FROM websocket_metrics WHERE date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DEFAULT DATA INSERTS
-- ============================================================================

-- Insert default NFL teams
INSERT INTO nfl_teams (name, abbreviation, city, conference, division, primary_color, secondary_color) VALUES
('Bills', 'BUF', 'Buffalo', 'AFC', 'East', '#00338D', '#C60C30'),
('Dolphins', 'MIA', 'Miami', 'AFC', 'East', '#008E97', '#FC4C02'),
('Patriots', 'NE', 'New England', 'AFC', 'East', '#002244', '#C60C30'),
('Jets', 'NYJ', 'New York', 'AFC', 'East', '#125740', '#FFFFFF'),
('Ravens', 'BAL', 'Baltimore', 'AFC', 'North', '#241773', '#9E7C0C'),
('Bengals', 'CIN', 'Cincinnati', 'AFC', 'North', '#FB4F14', '#000000'),
('Browns', 'CLE', 'Cleveland', 'AFC', 'North', '#311D00', '#FF3C00'),
('Steelers', 'PIT', 'Pittsburgh', 'AFC', 'North', '#FFB612', '#101820'),
('Texans', 'HOU', 'Houston', 'AFC', 'South', '#03202F', '#A71930'),
('Colts', 'IND', 'Indianapolis', 'AFC', 'South', '#002C5F', '#A2AAAD'),
('Jaguars', 'JAX', 'Jacksonville', 'AFC', 'South', '#006778', '#D7A22A'),
('Titans', 'TEN', 'Tennessee', 'AFC', 'South', '#0C2340', '#4B92DB'),
('Broncos', 'DEN', 'Denver', 'AFC', 'West', '#FB4F14', '#002244'),
('Chiefs', 'KC', 'Kansas City', 'AFC', 'West', '#E31837', '#FFB81C'),
('Raiders', 'LV', 'Las Vegas', 'AFC', 'West', '#000000', '#A5ACAF'),
('Chargers', 'LAC', 'Los Angeles', 'AFC', 'West', '#0080C6', '#FFC20E'),
('Cowboys', 'DAL', 'Dallas', 'NFC', 'East', '#003594', '#041E42'),
('Giants', 'NYG', 'New York', 'NFC', 'East', '#0B2265', '#A71930'),
('Eagles', 'PHI', 'Philadelphia', 'NFC', 'East', '#004C54', '#A5ACAF'),
('Commanders', 'WAS', 'Washington', 'NFC', 'East', '#5A1414', '#FFB612'),
('Bears', 'CHI', 'Chicago', 'NFC', 'North', '#0B162A', '#C83803'),
('Lions', 'DET', 'Detroit', 'NFC', 'North', '#0076B6', '#B0B7BC'),
('Packers', 'GB', 'Green Bay', 'NFC', 'North', '#203731', '#FFB612'),
('Vikings', 'MIN', 'Minnesota', 'NFC', 'North', '#4F2683', '#FFC62F'),
('Falcons', 'ATL', 'Atlanta', 'NFC', 'South', '#A71930', '#000000'),
('Panthers', 'CAR', 'Carolina', 'NFC', 'South', '#0085CA', '#101820'),
('Saints', 'NO', 'New Orleans', 'NFC', 'South', '#D3BC8D', '#101820'),
('Buccaneers', 'TB', 'Tampa Bay', 'NFC', 'South', '#D50A0A', '#FF7900'),
('Cardinals', 'ARI', 'Arizona', 'NFC', 'West', '#97233F', '#000000'),
('Rams', 'LAR', 'Los Angeles', 'NFC', 'West', '#003594', '#FFA300'),
('49ers', 'SF', 'San Francisco', 'NFC', 'West', '#AA0000', '#B3995D'),
('Seahawks', 'SEA', 'Seattle', 'NFC', 'West', '#002244', '#69BE28')
ON CONFLICT (abbreviation) DO NOTHING;

-- Insert demo league for testing
INSERT INTO leagues (id, name, description, season_year, current_week, max_teams) VALUES
('00000000-0000-0000-0000-000000000001', 'Demo League 2025', 'Demonstration league for testing and development', 2025, 1, 12)
ON CONFLICT (id) DO NOTHING;

-- Insert demo users
INSERT INTO users (id, username, email, first_name, last_name, is_demo_user, pin) VALUES
('11111111-1111-1111-1111-111111111111', 'demo_user_1', 'demo1@example.com', 'Mike', 'Johnson', true, '111111'),
('22222222-2222-2222-2222-222222222222', 'demo_user_2', 'demo2@example.com', 'Sarah', 'Wilson', true, '222222'),
('33333333-3333-3333-3333-333333333333', 'demo_user_3', 'demo3@example.com', 'Alex', 'Brown', true, '333333'),
('44444444-4444-4444-4444-444444444444', 'demo_user_4', 'demo4@example.com', 'Jessica', 'Davis', true, '444444')
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

-- Insert default chat rooms for demo league
INSERT INTO chat_rooms (id, league_id, name, description, type) VALUES
('general-room', '00000000-0000-0000-0000-000000000001', 'General Chat', 'General discussion for the league', 'general'),
('trades-room', '00000000-0000-0000-0000-000000000001', 'Trade Talk', 'Discuss trades and deals', 'trades'),
('waivers-room', '00000000-0000-0000-0000-000000000001', 'Waiver Wire', 'Waiver wire discussions', 'waivers'),
('trash-talk-room', '00000000-0000-0000-0000-000000000001', 'Trash Talk Central', 'Competitive banter and roasting', 'trash-talk')
ON CONFLICT (id) DO NOTHING;

-- Insert some demo NFL players for testing
INSERT INTO nfl_players (id, external_id, first_name, last_name, name, position, jersey_number, team) VALUES
('p1', 'josh-allen', 'Josh', 'Allen', 'Josh Allen', 'QB', 17, 'BUF'),
('p2', 'patrick-mahomes', 'Patrick', 'Mahomes', 'Patrick Mahomes', 'QB', 15, 'KC'),
('p3', 'christian-mccaffrey', 'Christian', 'McCaffrey', 'Christian McCaffrey', 'RB', 23, 'SF'),
('p4', 'derrick-henry', 'Derrick', 'Henry', 'Derrick Henry', 'RB', 22, 'TEN'),
('p5', 'alvin-kamara', 'Alvin', 'Kamara', 'Alvin Kamara', 'RB', 41, 'NO'),
('p6', 'tyreek-hill', 'Tyreek', 'Hill', 'Tyreek Hill', 'WR', 10, 'MIA'),
('p7', 'davante-adams', 'Davante', 'Adams', 'Davante Adams', 'WR', 17, 'LV'),
('p8', 'stefon-diggs', 'Stefon', 'Diggs', 'Stefon Diggs', 'WR', 14, 'BUF'),
('p9', 'deandre-hopkins', 'DeAndre', 'Hopkins', 'DeAndre Hopkins', 'WR', 10, 'ARI'),
('p10', 'travis-kelce', 'Travis', 'Kelce', 'Travis Kelce', 'TE', 87, 'KC'),
('p11', 'mark-andrews', 'Mark', 'Andrews', 'Mark Andrews', 'TE', 89, 'BAL'),
('p12', 'justin-tucker', 'Justin', 'Tucker', 'Justin Tucker', 'K', 9, 'BAL'),
('p13', 'harrison-butker', 'Harrison', 'Butker', 'Harrison Butker', 'K', 7, 'KC')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SCHEMA MIGRATION COMPLETE
-- ============================================================================

-- Create a view to check schema completeness
CREATE OR REPLACE VIEW schema_health AS
SELECT 
    'complete-schema-v2.0.0' AS schema_version,
    COUNT(*) AS total_tables,
    NOW() AS last_updated,
    'Schema consolidation completed successfully' AS status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Astral Field Complete Schema v2.0.0 has been successfully applied!';
    RAISE NOTICE 'Total tables created: %', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE');
END $$;