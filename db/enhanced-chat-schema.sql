-- Enhanced Chat and Real-Time Features Database Schema
-- Supports advanced chat, direct messaging, live game commentary, and notifications

-- Chat Rooms (enhanced with more room types)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('general', 'trades', 'waivers', 'off-topic', 'game-thread', 'celebrations', 'trash-talk')),
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, type)
);

-- Enhanced Chat Messages (with more message types and features)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    is_edited BOOLEAN DEFAULT FALSE,
    edit_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    INDEX (league_id, room_type, created_at DESC),
    INDEX (user_id, created_at DESC)
);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'gif', 'file', 'emoji')),
    gif_url TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    INDEX (sender_id, recipient_id, created_at DESC),
    INDEX (recipient_id, sender_id, created_at DESC),
    INDEX (recipient_id, is_read, created_at DESC)
);

-- Message Reactions (enhanced for both chat and DM)
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji),
    INDEX (message_id, created_at)
);

-- Direct Message Reactions
CREATE TABLE IF NOT EXISTS dm_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji),
    INDEX (message_id, created_at)
);

-- Typing Indicators
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 seconds'),
    UNIQUE(room_id, user_id),
    INDEX (room_id, expires_at)
);

-- Chat Moderation
CREATE TABLE IF NOT EXISTS chat_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('warn', 'hide', 'delete', 'timeout')),
    reason TEXT,
    duration_minutes INTEGER, -- For timeouts
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX (message_id),
    INDEX (moderator_id, created_at)
);

-- User Chat Preferences
CREATE TABLE IF NOT EXISTS user_chat_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    mention_notifications BOOLEAN DEFAULT TRUE,
    private_message_notifications BOOLEAN DEFAULT TRUE,
    trash_talk_notifications BOOLEAN DEFAULT TRUE,
    game_update_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, league_id)
);

-- Chat Analytics
CREATE TABLE IF NOT EXISTS chat_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_messages INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    top_topics TEXT[], -- Array of trending topics
    engagement_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(league_id, date)
);

-- Live Game Plays (for game commentary)
CREATE TABLE IF NOT EXISTS game_plays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id VARCHAR(50) NOT NULL,
    nfl_game_id VARCHAR(50), -- External NFL API game ID
    quarter INTEGER NOT NULL,
    time_remaining VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    play_type VARCHAR(30) NOT NULL CHECK (play_type IN ('touchdown', 'field-goal', 'interception', 'fumble', 'sack', 'big-play', 'regular', 'penalty')),
    player_id VARCHAR(50),
    player_name VARCHAR(100),
    team VARCHAR(10),
    yards INTEGER,
    points INTEGER DEFAULT 0,
    is_scoring_play BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX (game_id, created_at DESC),
    INDEX (player_id, created_at DESC)
);

-- Play Reactions (for live game commentary)
CREATE TABLE IF NOT EXISTS play_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    play_id UUID NOT NULL REFERENCES game_plays(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(play_id, user_id, emoji),
    INDEX (play_id, created_at),
    INDEX (game_id, created_at DESC)
);

-- Live User Reactions (for general game reactions)
CREATE TABLE IF NOT EXISTS live_user_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id VARCHAR(50) NOT NULL,
    league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX (game_id, created_at DESC),
    INDEX (league_id, created_at DESC)
);

-- Enhanced Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('player_injury', 'score_update', 'trade_offer', 'trade_completed', 'waiver_result', 'league_announcement', 'mention', 'celebration', 'direct_message', 'system')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional structured data
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE, -- For push notifications
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX (user_id, is_read, created_at DESC),
    INDEX (user_id, type, created_at DESC),
    INDEX (expires_at) WHERE expires_at IS NOT NULL
);

-- Push Notification Tokens (for mobile/web push)
CREATE TABLE IF NOT EXISTS push_notification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_used TIMESTAMPTZ,
    UNIQUE(user_id, token, platform),
    INDEX (user_id, is_active)
);

-- Trash Talk Messages (special handling for competitive banter)
CREATE TABLE IF NOT EXISTS trash_talk_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'gif', 'meme', 'roast')),
    gif_url TEXT,
    meme_url TEXT,
    is_roast BOOLEAN DEFAULT FALSE,
    target_user_id UUID REFERENCES users(id),
    roast_quality_score DECIMAL(3,1), -- Community rating 1-10
    is_moderated BOOLEAN DEFAULT FALSE,
    moderation_reason TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX (league_id, created_at DESC),
    INDEX (target_user_id, created_at DESC),
    INDEX (user_id, created_at DESC)
);

-- Trash Talk Reactions
CREATE TABLE IF NOT EXISTS trash_talk_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES trash_talk_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji),
    INDEX (message_id, created_at)
);

-- League Celebrations (for big moments)
CREATE TABLE IF NOT EXISTS league_celebrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    celebration_type VARCHAR(30) NOT NULL CHECK (celebration_type IN ('touchdown', 'victory', 'milestone', 'championship', 'comeback', 'perfect_week')),
    trigger_data JSONB, -- Details about what triggered the celebration
    message TEXT,
    gif_url TEXT,
    duration_seconds INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
    INDEX (league_id, is_active, created_at DESC),
    INDEX (user_id, created_at DESC)
);

-- WebSocket Connection Metrics (for monitoring)
CREATE TABLE IF NOT EXISTS websocket_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    total_connections INTEGER DEFAULT 0,
    peak_connections INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    data_transferred_mb DECIMAL(10,2) DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    average_latency_ms DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, hour)
);

-- Indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_league_room_time ON chat_messages(league_id, room_type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, priority, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_plays_game_time ON game_plays(game_id, quarter, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trash_talk_league_time ON trash_talk_messages(league_id, created_at DESC);

-- Full-text search indexes for message content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_fts ON chat_messages USING gin(to_tsvector('english', content));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_direct_messages_fts ON direct_messages USING gin(to_tsvector('english', content));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trash_talk_fts ON trash_talk_messages USING gin(to_tsvector('english', content));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON direct_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_chat_preferences_updated_at BEFORE UPDATE ON user_chat_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup functions for maintenance
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
    
    -- Archive old websocket metrics (keep last 30 days detailed, summarize older)
    DELETE FROM websocket_metrics WHERE date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job for cleanup (if using pg_cron)
-- SELECT cron.schedule('cleanup-expired-data', '0 */6 * * *', 'SELECT cleanup_expired_data();');

-- Initial data for default chat rooms
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