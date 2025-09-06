-- Social Trading and Strategy Sharing Migration
-- Comprehensive social trading system with strategies, portfolios, and performance tracking

-- Trading strategies table
CREATE TABLE IF NOT EXISTS trading_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    strategy_type VARCHAR(50) NOT NULL CHECK (strategy_type IN ('draft', 'waiver', 'trade', 'lineup', 'season_long', 'dfs')),
    scoring_format VARCHAR(20) DEFAULT 'ppr' CHECK (scoring_format IN ('standard', 'ppr', 'half_ppr', 'superflex', 'dynasty')),
    league_size INTEGER CHECK (league_size BETWEEN 8 AND 16),
    difficulty_level VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    
    -- Strategy content
    strategy_content JSONB NOT NULL DEFAULT '{}', -- Detailed strategy steps and rules
    key_principles TEXT[],
    target_positions VARCHAR(20)[],
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    time_commitment VARCHAR(50),
    
    -- Performance metrics
    success_rate DECIMAL(5,2), -- Percentage success rate
    avg_weekly_points DECIMAL(6,2),
    total_followers INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_saves INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    performance_score DECIMAL(8,2), -- Calculated performance score
    
    -- Strategy visibility and access
    is_public BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2), -- Price if premium strategy
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified by experts
    
    -- Analytics and tracking
    view_count INTEGER DEFAULT 0,
    copy_count INTEGER DEFAULT 0, -- How many times strategy was copied
    last_updated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT trading_strategies_title_check CHECK (char_length(title) >= 3),
    CONSTRAINT trading_strategies_description_check CHECK (char_length(description) >= 10)
);

-- Strategy followers table (users following strategies)
CREATE TABLE IF NOT EXISTS strategy_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(strategy_id, user_id)
);

-- Strategy likes/reactions table
CREATE TABLE IF NOT EXISTS strategy_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'rocket', 'thinking')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(strategy_id, user_id, reaction_type)
);

-- Strategy comments table
CREATE TABLE IF NOT EXISTS strategy_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES strategy_comments(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_by_creator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT strategy_comments_content_check CHECK (char_length(content) >= 3)
);

-- Strategy performance tracking
CREATE TABLE IF NOT EXISTS strategy_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID NOT NULL REFERENCES trading_strategies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User implementing the strategy
    week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 18),
    season INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    
    -- Performance metrics
    weekly_points DECIMAL(6,2),
    weekly_rank INTEGER,
    moves_made INTEGER DEFAULT 0, -- Number of moves/changes made
    strategy_adherence DECIMAL(5,2), -- How closely they followed the strategy (%)
    outcome VARCHAR(20), -- 'win', 'loss', 'tie'
    
    -- Detailed tracking
    lineup_changes JSONB DEFAULT '[]',
    waiver_moves JSONB DEFAULT '[]',
    trade_activity JSONB DEFAULT '[]',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(strategy_id, user_id, week, season)
);

-- Social portfolios (users can share their team builds and lineups)
CREATE TABLE IF NOT EXISTS social_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    portfolio_type VARCHAR(30) NOT NULL CHECK (portfolio_type IN ('draft_results', 'current_roster', 'trade_targets', 'waiver_watchlist', 'lineup_optimizer')),
    
    -- Portfolio configuration
    league_settings JSONB NOT NULL DEFAULT '{}', -- League size, scoring, etc.
    roster_composition JSONB NOT NULL DEFAULT '{}', -- Current players and positions
    target_players JSONB DEFAULT '[]', -- Players they're targeting
    avoid_players JSONB DEFAULT '[]', -- Players they're avoiding
    strategy_notes TEXT,
    
    -- Social metrics
    follower_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    copy_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Performance tracking
    current_rank INTEGER,
    total_points DECIMAL(8,2),
    weekly_avg DECIMAL(6,2),
    best_week DECIMAL(6,2),
    worst_week DECIMAL(6,2),
    
    -- Visibility settings
    is_public BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    allow_copying BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT social_portfolios_title_check CHECK (char_length(title) >= 3)
);

-- Portfolio followers table
CREATE TABLE IF NOT EXISTS portfolio_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES social_portfolios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(portfolio_id, user_id)
);

-- Trading signals and recommendations
CREATE TABLE IF NOT EXISTS trading_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    signal_type VARCHAR(30) NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold', 'avoid', 'sleeper', 'bust')),
    player_id INTEGER NOT NULL, -- References SportsData player
    player_name VARCHAR(100) NOT NULL,
    player_position VARCHAR(10),
    player_team VARCHAR(10),
    
    -- Signal details
    title VARCHAR(255) NOT NULL,
    reasoning TEXT NOT NULL,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 10),
    time_horizon VARCHAR(20) CHECK (time_horizon IN ('immediate', 'weekly', 'monthly', 'season', 'dynasty')),
    target_price DECIMAL(8,2), -- Target trade value or draft cost
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- Performance tracking
    outcome VARCHAR(20), -- 'hit', 'miss', 'pending'
    actual_performance DECIMAL(6,2),
    accuracy_score DECIMAL(5,2),
    
    -- Social engagement
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    follow_count INTEGER DEFAULT 0, -- Users following this signal
    
    -- Metadata
    expires_at TIMESTAMP WITH TIME ZONE,
    is_premium BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Signal votes table (upvotes/downvotes)
CREATE TABLE IF NOT EXISTS signal_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL REFERENCES trading_signals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(signal_id, user_id)
);

-- Signal followers (users following specific signals)
CREATE TABLE IF NOT EXISTS signal_followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL REFERENCES trading_signals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(signal_id, user_id)
);

-- Trade proposals and social trading
CREATE TABLE IF NOT EXISTS social_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Trade details
    offered_players JSONB NOT NULL DEFAULT '[]', -- Players being offered
    requested_players JSONB NOT NULL DEFAULT '[]', -- Players being requested
    trade_type VARCHAR(30) DEFAULT 'player_for_player' CHECK (trade_type IN ('player_for_player', 'player_for_pick', 'multi_team', 'package_deal')),
    league_context JSONB, -- League settings, scoring format, etc.
    
    -- Analysis and reasoning
    trade_analysis JSONB, -- AI or user analysis of trade value
    reasoning TEXT,
    expected_outcome TEXT,
    risk_assessment VARCHAR(20) CHECK (risk_assessment IN ('low', 'medium', 'high')),
    
    -- Community feedback
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- Trade status
    status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'expired', 'withdrawn')),
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Social features
    is_public BOOLEAN DEFAULT TRUE,
    allow_counteroffers BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trade votes and feedback
CREATE TABLE IF NOT EXISTS trade_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES social_trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    side_preference VARCHAR(10) CHECK (side_preference IN ('team_a', 'team_b', 'even')), -- Which side wins
    reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(trade_id, user_id)
);

-- Social leaderboards for top traders/strategists
CREATE TABLE IF NOT EXISTS trader_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leaderboard_type VARCHAR(30) NOT NULL CHECK (leaderboard_type IN ('strategy_creator', 'signal_accuracy', 'trade_analyzer', 'portfolio_performance')),
    season INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    week INTEGER CHECK (week BETWEEN 1 AND 18),
    
    -- Performance metrics
    score DECIMAL(10,2) NOT NULL,
    rank INTEGER,
    total_entries INTEGER, -- Total participants in this leaderboard
    percentile DECIMAL(5,2), -- User's percentile ranking
    
    -- Detailed stats
    stats JSONB DEFAULT '{}', -- Specific stats for each leaderboard type
    achievements TEXT[], -- Badges or achievements earned
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, leaderboard_type, season, week)
);

-- User social trading stats
CREATE TABLE IF NOT EXISTS user_trading_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Strategy creation stats
    strategies_created INTEGER DEFAULT 0,
    strategies_followers INTEGER DEFAULT 0,
    avg_strategy_rating DECIMAL(3,2),
    
    -- Signal performance
    signals_created INTEGER DEFAULT 0,
    signal_accuracy DECIMAL(5,2), -- Overall accuracy percentage
    successful_signals INTEGER DEFAULT 0,
    total_signal_votes INTEGER DEFAULT 0,
    
    -- Trade analysis
    trades_analyzed INTEGER DEFAULT 0,
    trade_accuracy DECIMAL(5,2),
    avg_trade_rating DECIMAL(3,2),
    
    -- Social engagement
    total_followers INTEGER DEFAULT 0,
    total_following INTEGER DEFAULT 0,
    total_likes_received INTEGER DEFAULT 0,
    total_likes_given INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    
    -- Performance tracking
    best_strategy_performance DECIMAL(6,2),
    total_strategy_implementations INTEGER DEFAULT 0,
    avg_weekly_performance DECIMAL(6,2),
    
    -- Achievements and badges
    badges JSONB DEFAULT '[]',
    achievement_points INTEGER DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trading_strategies_creator_id ON trading_strategies(creator_id);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_type ON trading_strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_public ON trading_strategies(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_trading_strategies_featured ON trading_strategies(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_trading_strategies_performance ON trading_strategies(performance_score DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_followers_user_id ON strategy_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_followers_strategy_id ON strategy_followers(strategy_id);

CREATE INDEX IF NOT EXISTS idx_strategy_performance_strategy_id ON strategy_performance(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_user_id ON strategy_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_week_season ON strategy_performance(week, season);

CREATE INDEX IF NOT EXISTS idx_social_portfolios_user_id ON social_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_social_portfolios_type ON social_portfolios(portfolio_type);
CREATE INDEX IF NOT EXISTS idx_social_portfolios_public ON social_portfolios(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_trading_signals_creator_id ON trading_signals(creator_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_player_id ON trading_signals(player_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_type ON trading_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_trades_proposer_id ON social_trades(proposer_id);
CREATE INDEX IF NOT EXISTS idx_social_trades_status ON social_trades(status);
CREATE INDEX IF NOT EXISTS idx_social_trades_created_at ON social_trades(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trader_leaderboards_user_id ON trader_leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_trader_leaderboards_type_season ON trader_leaderboards(leaderboard_type, season);
CREATE INDEX IF NOT EXISTS idx_trader_leaderboards_rank ON trader_leaderboards(rank);

-- Function to update strategy stats
CREATE OR REPLACE FUNCTION update_strategy_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'strategy_followers' THEN
            UPDATE trading_strategies 
            SET total_followers = total_followers + 1
            WHERE id = NEW.strategy_id;
            
            UPDATE user_trading_stats 
            SET total_followers = total_followers + 1
            WHERE user_id = (SELECT creator_id FROM trading_strategies WHERE id = NEW.strategy_id);
            
        ELSIF TG_TABLE_NAME = 'strategy_reactions' THEN
            UPDATE trading_strategies 
            SET total_likes = total_likes + 1
            WHERE id = NEW.strategy_id;
            
            UPDATE user_trading_stats 
            SET total_likes_received = total_likes_received + 1
            WHERE user_id = (SELECT creator_id FROM trading_strategies WHERE id = NEW.strategy_id);
            
        ELSIF TG_TABLE_NAME = 'strategy_comments' THEN
            UPDATE trading_strategies 
            SET total_comments = total_comments + 1
            WHERE id = NEW.strategy_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'strategy_followers' THEN
            UPDATE trading_strategies 
            SET total_followers = GREATEST(total_followers - 1, 0)
            WHERE id = OLD.strategy_id;
            
            UPDATE user_trading_stats 
            SET total_followers = GREATEST(total_followers - 1, 0)
            WHERE user_id = (SELECT creator_id FROM trading_strategies WHERE id = OLD.strategy_id);
            
        ELSIF TG_TABLE_NAME = 'strategy_reactions' THEN
            UPDATE trading_strategies 
            SET total_likes = GREATEST(total_likes - 1, 0)
            WHERE id = OLD.strategy_id;
            
            UPDATE user_trading_stats 
            SET total_likes_received = GREATEST(total_likes_received - 1, 0)
            WHERE user_id = (SELECT creator_id FROM trading_strategies WHERE id = OLD.strategy_id);
            
        ELSIF TG_TABLE_NAME = 'strategy_comments' THEN
            UPDATE trading_strategies 
            SET total_comments = GREATEST(total_comments - 1, 0)
            WHERE id = OLD.strategy_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for strategy stats
CREATE TRIGGER strategy_followers_stats_trigger
    AFTER INSERT OR DELETE ON strategy_followers
    FOR EACH ROW EXECUTE FUNCTION update_strategy_stats();

CREATE TRIGGER strategy_reactions_stats_trigger
    AFTER INSERT OR DELETE ON strategy_reactions
    FOR EACH ROW EXECUTE FUNCTION update_strategy_stats();

CREATE TRIGGER strategy_comments_stats_trigger
    AFTER INSERT OR DELETE ON strategy_comments
    FOR EACH ROW EXECUTE FUNCTION update_strategy_stats();

-- Function to update signal stats
CREATE OR REPLACE FUNCTION update_signal_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'signal_votes' THEN
            IF NEW.vote_type = 'upvote' THEN
                UPDATE trading_signals 
                SET upvote_count = upvote_count + 1
                WHERE id = NEW.signal_id;
            ELSE
                UPDATE trading_signals 
                SET downvote_count = downvote_count + 1
                WHERE id = NEW.signal_id;
            END IF;
        ELSIF TG_TABLE_NAME = 'signal_followers' THEN
            UPDATE trading_signals 
            SET follow_count = follow_count + 1
            WHERE id = NEW.signal_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'signal_votes' THEN
            IF OLD.vote_type = 'upvote' THEN
                UPDATE trading_signals 
                SET upvote_count = GREATEST(upvote_count - 1, 0)
                WHERE id = OLD.signal_id;
            ELSE
                UPDATE trading_signals 
                SET downvote_count = GREATEST(downvote_count - 1, 0)
                WHERE id = OLD.signal_id;
            END IF;
        ELSIF TG_TABLE_NAME = 'signal_followers' THEN
            UPDATE trading_signals 
            SET follow_count = GREATEST(follow_count - 1, 0)
            WHERE id = OLD.signal_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for signal stats
CREATE TRIGGER signal_votes_stats_trigger
    AFTER INSERT OR DELETE ON signal_votes
    FOR EACH ROW EXECUTE FUNCTION update_signal_stats();

CREATE TRIGGER signal_followers_stats_trigger
    AFTER INSERT OR DELETE ON signal_followers
    FOR EACH ROW EXECUTE FUNCTION update_signal_stats();