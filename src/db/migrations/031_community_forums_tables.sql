-- Fantasy Football Community Forums and Discussion Boards Migration
-- Comprehensive forum system with threads, posts, reactions, and moderation

-- Forum categories table
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    sort_order INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    required_role VARCHAR(20), -- 'member', 'premium', 'admin'
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT forum_categories_name_check CHECK (char_length(name) >= 2),
    CONSTRAINT forum_categories_slug_check CHECK (char_length(slug) >= 2)
);

-- Forum threads table
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    last_post_id UUID,
    last_post_at TIMESTAMP WITH TIME ZONE,
    last_post_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Fantasy football specific fields
    is_trade_discussion BOOLEAN DEFAULT FALSE,
    is_waiver_discussion BOOLEAN DEFAULT FALSE,
    is_player_discussion BOOLEAN DEFAULT FALSE,
    related_player_id INTEGER, -- References players from SportsData
    related_team_name VARCHAR(50),
    fantasy_week INTEGER CHECK (fantasy_week BETWEEN 1 AND 18),
    
    CONSTRAINT forum_threads_title_check CHECK (char_length(title) >= 3),
    CONSTRAINT forum_threads_content_check CHECK (char_length(content) >= 10)
);

-- Forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    parent_post_id UUID REFERENCES forum_posts(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_solution BOOLEAN DEFAULT FALSE, -- Mark as solution to thread
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    edit_count INTEGER DEFAULT 0,
    last_edited_at TIMESTAMP WITH TIME ZONE,
    last_edited_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Content moderation
    is_moderated BOOLEAN DEFAULT FALSE,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by UUID REFERENCES users(id),
    moderation_reason TEXT,
    
    CONSTRAINT forum_posts_content_check CHECK (char_length(content) >= 3)
);

-- Post reactions table (likes, dislikes, etc.)
CREATE TABLE IF NOT EXISTS forum_post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'love', 'laugh', 'angry', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(post_id, user_id, reaction_type)
);

-- Thread subscriptions (follow threads for notifications)
CREATE TABLE IF NOT EXISTS forum_thread_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(20) DEFAULT 'all' CHECK (notification_type IN ('all', 'mentions', 'none')),
    last_read_post_id UUID REFERENCES forum_posts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(thread_id, user_id)
);

-- User forum stats table
CREATE TABLE IF NOT EXISTS forum_user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    thread_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    like_received INTEGER DEFAULT 0,
    like_given INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}', -- Array of earned badges
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forum moderation actions log
CREATE TABLE IF NOT EXISTS forum_moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES users(id),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('thread', 'post', 'user')),
    target_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'delete', 'edit', 'lock', 'pin', 'warn', 'ban'
    reason TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Popular forum tags
CREATE TABLE IF NOT EXISTS forum_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Thread tags (many-to-many)
CREATE TABLE IF NOT EXISTS forum_thread_tags (
    thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES forum_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (thread_id, tag_id)
);

-- Forum search index table for fast text search
CREATE TABLE IF NOT EXISTS forum_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('thread', 'post')),
    content_id UUID NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id),
    category_id UUID REFERENCES forum_categories(id),
    tags TEXT[],
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forum_threads_category_id ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author_id ON forum_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at ON forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_last_post_at ON forum_threads(last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned_created ON forum_threads(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_player_id ON forum_threads(related_player_id) WHERE related_player_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_id ON forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent_id ON forum_posts(parent_post_id) WHERE parent_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_forum_post_reactions_post_id ON forum_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_reactions_user_id ON forum_post_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_forum_thread_subscriptions_user_id ON forum_thread_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_thread_subscriptions_thread_id ON forum_thread_subscriptions(thread_id);

CREATE INDEX IF NOT EXISTS idx_forum_search_vector ON forum_search_index USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_forum_search_author ON forum_search_index(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_search_category ON forum_search_index(category_id);

-- Create full-text search triggers
CREATE OR REPLACE FUNCTION update_forum_search_index()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.id IS NOT NULL THEN
            -- Handle thread insert
            INSERT INTO forum_search_index (content_type, content_id, title, content, author_id, category_id, search_vector)
            SELECT 
                'thread',
                NEW.id,
                NEW.title,
                NEW.content,
                NEW.author_id,
                NEW.category_id,
                to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''))
            WHERE TG_TABLE_NAME = 'forum_threads';
            
            -- Handle post insert
            INSERT INTO forum_search_index (content_type, content_id, title, content, author_id, category_id, search_vector)
            SELECT 
                'post',
                NEW.id,
                t.title,
                NEW.content,
                NEW.author_id,
                t.category_id,
                to_tsvector('english', COALESCE(NEW.content, ''))
            FROM forum_threads t
            WHERE t.id = NEW.thread_id AND TG_TABLE_NAME = 'forum_posts';
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update search index
        UPDATE forum_search_index 
        SET 
            content = CASE 
                WHEN TG_TABLE_NAME = 'forum_threads' THEN NEW.content
                ELSE NEW.content
            END,
            title = CASE 
                WHEN TG_TABLE_NAME = 'forum_threads' THEN NEW.title
                ELSE title
            END,
            search_vector = to_tsvector('english', 
                CASE 
                    WHEN TG_TABLE_NAME = 'forum_threads' THEN COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '')
                    ELSE COALESCE(NEW.content, '')
                END
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE content_id = NEW.id 
        AND content_type = CASE 
            WHEN TG_TABLE_NAME = 'forum_threads' THEN 'thread'
            ELSE 'post'
        END;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM forum_search_index WHERE content_id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for search indexing
CREATE TRIGGER forum_threads_search_trigger
    AFTER INSERT OR UPDATE OR DELETE ON forum_threads
    FOR EACH ROW EXECUTE FUNCTION update_forum_search_index();

CREATE TRIGGER forum_posts_search_trigger
    AFTER INSERT OR UPDATE OR DELETE ON forum_posts
    FOR EACH ROW EXECUTE FUNCTION update_forum_search_index();

-- Function to update thread stats
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update thread reply count and last post info
        UPDATE forum_threads 
        SET 
            reply_count = reply_count + 1,
            last_post_id = NEW.id,
            last_post_at = NEW.created_at,
            last_post_user_id = NEW.author_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.thread_id;
        
        -- Update category stats
        UPDATE forum_categories 
        SET 
            post_count = post_count + 1,
            last_activity_at = NEW.created_at
        WHERE id = (SELECT category_id FROM forum_threads WHERE id = NEW.thread_id);
        
        -- Update user stats
        INSERT INTO forum_user_stats (user_id, post_count) 
        VALUES (NEW.author_id, 1)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            post_count = forum_user_stats.post_count + 1,
            last_active_at = NEW.created_at;
            
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update thread reply count
        UPDATE forum_threads 
        SET 
            reply_count = GREATEST(reply_count - 1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.thread_id;
        
        -- Update category stats
        UPDATE forum_categories 
        SET post_count = GREATEST(post_count - 1, 0)
        WHERE id = (SELECT category_id FROM forum_threads WHERE id = OLD.thread_id);
        
        -- Update user stats
        UPDATE forum_user_stats 
        SET post_count = GREATEST(post_count - 1, 0)
        WHERE user_id = OLD.author_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forum_posts_stats_trigger
    AFTER INSERT OR DELETE ON forum_posts
    FOR EACH ROW EXECUTE FUNCTION update_thread_stats();

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update post reaction counts
        UPDATE forum_posts 
        SET 
            like_count = CASE WHEN NEW.reaction_type = 'like' THEN like_count + 1 ELSE like_count END,
            dislike_count = CASE WHEN NEW.reaction_type = 'dislike' THEN dislike_count + 1 ELSE dislike_count END
        WHERE id = NEW.post_id;
        
        -- Update user reputation (likes received)
        UPDATE forum_user_stats 
        SET 
            like_received = CASE WHEN NEW.reaction_type = 'like' THEN like_received + 1 ELSE like_received END,
            reputation_score = reputation_score + CASE WHEN NEW.reaction_type = 'like' THEN 1 WHEN NEW.reaction_type = 'dislike' THEN -1 ELSE 0 END
        WHERE user_id = (SELECT author_id FROM forum_posts WHERE id = NEW.post_id);
        
        -- Update user stats (likes given)
        INSERT INTO forum_user_stats (user_id, like_given) 
        VALUES (NEW.user_id, CASE WHEN NEW.reaction_type = 'like' THEN 1 ELSE 0 END)
        ON CONFLICT (user_id) 
        DO UPDATE SET like_given = forum_user_stats.like_given + CASE WHEN NEW.reaction_type = 'like' THEN 1 ELSE 0 END;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update post reaction counts
        UPDATE forum_posts 
        SET 
            like_count = CASE WHEN OLD.reaction_type = 'like' THEN GREATEST(like_count - 1, 0) ELSE like_count END,
            dislike_count = CASE WHEN OLD.reaction_type = 'dislike' THEN GREATEST(dislike_count - 1, 0) ELSE dislike_count END
        WHERE id = OLD.post_id;
        
        -- Update user reputation
        UPDATE forum_user_stats 
        SET 
            like_received = CASE WHEN OLD.reaction_type = 'like' THEN GREATEST(like_received - 1, 0) ELSE like_received END,
            reputation_score = reputation_score - CASE WHEN OLD.reaction_type = 'like' THEN 1 WHEN OLD.reaction_type = 'dislike' THEN -1 ELSE 0 END
        WHERE user_id = (SELECT author_id FROM forum_posts WHERE id = OLD.post_id);
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forum_reactions_trigger
    AFTER INSERT OR DELETE ON forum_post_reactions
    FOR EACH ROW EXECUTE FUNCTION update_reaction_counts();

-- Insert default forum categories
INSERT INTO forum_categories (name, description, slug, icon, color, sort_order) VALUES
('General Discussion', 'General fantasy football talk and strategy', 'general-discussion', '💬', '#3b82f6', 1),
('Trade Discussion', 'Propose and discuss fantasy trades', 'trade-discussion', '🔄', '#10b981', 2),
('Waiver Wire', 'Discuss available players and waiver claims', 'waiver-wire', '📝', '#f59e0b', 3),
('Player Analysis', 'Deep dive analysis on specific players', 'player-analysis', '📊', '#8b5cf6', 4),
('Lineup Help', 'Get help with start/sit decisions', 'lineup-help', '⚡', '#ef4444', 5),
('League Management', 'Commissioner and league setup discussions', 'league-management', '👑', '#6366f1', 6),
('Injuries & News', 'Latest injury reports and breaking news', 'injuries-news', '🏥', '#f97316', 7),
('Rookie Discussion', 'Discuss rookie players and dynasty impacts', 'rookie-discussion', '🆕', '#84cc16', 8),
('Off-Season', 'Draft prep, keeper discussions, and off-season talk', 'off-season', '🏖️', '#06b6d4', 9),
('Site Feedback', 'Suggestions and feedback for Astral Field', 'site-feedback', '🔧', '#64748b', 10)
ON CONFLICT (slug) DO NOTHING;

-- Create default tags
INSERT INTO forum_tags (name, slug, description, color) VALUES
('Start/Sit', 'start-sit', 'Help with lineup decisions', '#ef4444'),
('Trade', 'trade', 'Trade proposals and analysis', '#10b981'),
('Waiver', 'waiver', 'Waiver wire pickups', '#f59e0b'),
('Injury', 'injury', 'Injury news and analysis', '#f97316'),
('Rookie', 'rookie', 'Rookie player discussion', '#84cc16'),
('Dynasty', 'dynasty', 'Dynasty league strategy', '#8b5cf6'),
('Redraft', 'redraft', 'Redraft league discussion', '#3b82f6'),
('PPR', 'ppr', 'Points per reception leagues', '#06b6d4'),
('Standard', 'standard', 'Standard scoring leagues', '#6366f1'),
('Superflex', 'superflex', 'Superflex league strategy', '#ec4899')
ON CONFLICT (slug) DO NOTHING;