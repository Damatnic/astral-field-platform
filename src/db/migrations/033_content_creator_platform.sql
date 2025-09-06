-- Expert Content Creator Platform Migration
-- Comprehensive creator economy with articles, videos, courses, and monetization

-- Content creators profile and verification
CREATE TABLE IF NOT EXISTS content_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    creator_handle VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_image_url TEXT,
    
    -- Verification and credentials
    is_verified BOOLEAN DEFAULT FALSE,
    verification_type VARCHAR(30) CHECK (verification_type IN ('fantasy_expert', 'former_player', 'analyst', 'journalist', 'influencer')),
    verification_details JSONB DEFAULT '{}',
    credentials TEXT[],
    
    -- Specialization
    expertise_areas VARCHAR(50)[] DEFAULT '{}', -- draft, waiver, trade, dfs, dynasty, etc.
    primary_positions VARCHAR(10)[] DEFAULT '{}', -- QB, RB, WR, TE, etc.
    league_formats VARCHAR(20)[] DEFAULT '{}', -- redraft, dynasty, superflex, ppr, etc.
    
    -- Creator stats
    total_followers INTEGER DEFAULT 0,
    total_content INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0,
    
    -- Creator tier and reputation
    creator_tier VARCHAR(20) DEFAULT 'bronze' CHECK (creator_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    reputation_score INTEGER DEFAULT 0,
    accuracy_score DECIMAL(5,2) DEFAULT 0.0,
    
    -- Monetization settings
    monetization_enabled BOOLEAN DEFAULT FALSE,
    subscription_price DECIMAL(8,2), -- Monthly subscription price
    pay_per_content BOOLEAN DEFAULT FALSE,
    accepts_tips BOOLEAN DEFAULT TRUE,
    
    -- Creator program status
    creator_program_status VARCHAR(20) DEFAULT 'pending' CHECK (creator_program_status IN ('pending', 'approved', 'suspended', 'rejected')),
    program_applied_at TIMESTAMP WITH TIME ZONE,
    program_approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Social links
    social_links JSONB DEFAULT '{}', -- Twitter, YouTube, TikTok, etc.
    website_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT content_creators_handle_check CHECK (char_length(creator_handle) >= 3),
    CONSTRAINT content_creators_display_name_check CHECK (char_length(display_name) >= 2)
);

-- Creator content table (articles, videos, podcasts, etc.)
CREATE TABLE IF NOT EXISTS creator_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES content_creators(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN ('article', 'video', 'podcast', 'infographic', 'course', 'live_stream')),
    
    -- Content details
    description TEXT,
    content_data JSONB NOT NULL DEFAULT '{}', -- Article text, video URL, etc.
    thumbnail_url TEXT,
    duration_minutes INTEGER, -- For videos/podcasts
    
    -- Content categorization
    category VARCHAR(50) NOT NULL, -- draft_analysis, waiver_wire, trade_targets, etc.
    tags VARCHAR(50)[] DEFAULT '{}',
    target_positions VARCHAR(10)[] DEFAULT '{}',
    fantasy_week INTEGER CHECK (fantasy_week BETWEEN 1 AND 18),
    season INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    
    -- Publishing and access
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'scheduled')),
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    -- Monetization
    is_premium BOOLEAN DEFAULT FALSE,
    price DECIMAL(8,2), -- One-time purchase price
    requires_subscription BOOLEAN DEFAULT FALSE,
    
    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    
    -- Performance tracking
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- SEO and discoverability
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    keywords TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT creator_content_title_check CHECK (char_length(title) >= 3)
);

-- Creator courses and educational content
CREATE TABLE IF NOT EXISTS creator_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES content_creators(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    
    -- Course structure
    course_outline JSONB NOT NULL DEFAULT '[]', -- Array of modules/lessons
    total_lessons INTEGER DEFAULT 0,
    estimated_duration_hours DECIMAL(4,1),
    difficulty_level VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    
    -- Course content
    cover_image_url TEXT,
    preview_video_url TEXT,
    course_materials JSONB DEFAULT '[]', -- PDFs, templates, etc.
    
    -- Pricing and access
    price DECIMAL(8,2) NOT NULL,
    payment_type VARCHAR(20) DEFAULT 'one_time' CHECK (payment_type IN ('one_time', 'subscription', 'free')),
    has_free_preview BOOLEAN DEFAULT TRUE,
    free_preview_lessons INTEGER DEFAULT 1,
    
    -- Course stats
    enrollment_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.0,
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0,
    
    -- Course status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES creator_courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_type VARCHAR(20) DEFAULT 'paid' CHECK (enrollment_type IN ('paid', 'free', 'gifted', 'promotional')),
    
    -- Progress tracking
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    completed_lessons INTEGER DEFAULT 0,
    current_lesson_id UUID,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Completion and certification
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url TEXT,
    
    -- Enrollment details
    amount_paid DECIMAL(8,2),
    payment_method VARCHAR(50),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(course_id, user_id)
);

-- Content ratings and reviews
CREATE TABLE IF NOT EXISTS content_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('content', 'course')),
    content_id UUID NOT NULL, -- References either creator_content or creator_courses
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    
    -- Review metrics
    helpful_votes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, content_type, content_id)
);

-- Creator subscriptions
CREATE TABLE IF NOT EXISTS creator_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES content_creators(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_tier VARCHAR(30) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'vip')),
    
    -- Subscription details
    monthly_price DECIMAL(8,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    
    -- Subscription status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment tracking
    total_paid DECIMAL(10,2) DEFAULT 0.0,
    payment_failures INTEGER DEFAULT 0,
    last_payment_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(creator_id, subscriber_id)
);

-- Creator earnings and payouts
CREATE TABLE IF NOT EXISTS creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES content_creators(id) ON DELETE CASCADE,
    earning_type VARCHAR(30) NOT NULL CHECK (earning_type IN ('subscription', 'content_purchase', 'course_sale', 'tip', 'affiliate', 'sponsorship')),
    
    -- Transaction details
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0.0,
    net_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Source tracking
    source_id UUID, -- ID of content, course, or subscription
    source_type VARCHAR(20), -- 'content', 'course', 'subscription', etc.
    payer_id UUID REFERENCES users(id),
    
    -- Payout status
    payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processed', 'failed', 'held')),
    payout_date TIMESTAMP WITH TIME ZONE,
    payout_method VARCHAR(50),
    payout_reference VARCHAR(100),
    
    -- Metadata
    transaction_id VARCHAR(100),
    payment_processor VARCHAR(50),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creator analytics and insights
CREATE TABLE IF NOT EXISTS creator_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES content_creators(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Content metrics
    daily_views INTEGER DEFAULT 0,
    daily_likes INTEGER DEFAULT 0,
    daily_comments INTEGER DEFAULT 0,
    daily_shares INTEGER DEFAULT 0,
    daily_bookmarks INTEGER DEFAULT 0,
    
    -- Audience metrics
    new_followers INTEGER DEFAULT 0,
    lost_followers INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    
    -- Engagement metrics
    engagement_rate DECIMAL(5,2) DEFAULT 0.0,
    avg_view_duration_seconds INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0.0,
    
    -- Earnings metrics
    daily_earnings DECIMAL(10,2) DEFAULT 0.0,
    new_subscribers INTEGER DEFAULT 0,
    subscription_churn INTEGER DEFAULT 0,
    
    -- Top content
    top_content_ids UUID[] DEFAULT '{}',
    trending_topics TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(creator_id, date)
);

-- Creator collaborations and partnerships
CREATE TABLE IF NOT EXISTS creator_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_creator_id UUID NOT NULL REFERENCES content_creators(id) ON DELETE CASCADE,
    collaborator_creator_id UUID NOT NULL REFERENCES content_creators(id) ON DELETE CASCADE,
    
    -- Collaboration details
    collaboration_type VARCHAR(30) NOT NULL CHECK (collaboration_type IN ('joint_content', 'guest_appearance', 'series', 'course', 'event')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Revenue sharing
    revenue_split_percentage DECIMAL(5,2), -- Primary creator's share
    total_earnings DECIMAL(10,2) DEFAULT 0.0,
    
    -- Collaboration status
    status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Content tracking
    content_ids UUID[] DEFAULT '{}', -- Associated content pieces
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creator achievement system
CREATE TABLE IF NOT EXISTS creator_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES content_creators(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Achievement criteria
    criteria_met JSONB NOT NULL DEFAULT '{}',
    threshold_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    
    -- Achievement rewards
    badge_icon VARCHAR(10),
    badge_color VARCHAR(7),
    reputation_points INTEGER DEFAULT 0,
    monetary_reward DECIMAL(8,2),
    
    -- Achievement status
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_creators_user_id ON content_creators(user_id);
CREATE INDEX IF NOT EXISTS idx_content_creators_handle ON content_creators(creator_handle);
CREATE INDEX IF NOT EXISTS idx_content_creators_verified ON content_creators(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_content_creators_tier ON content_creators(creator_tier);

CREATE INDEX IF NOT EXISTS idx_creator_content_creator_id ON creator_content(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_content_status ON creator_content(status);
CREATE INDEX IF NOT EXISTS idx_creator_content_published ON creator_content(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_creator_content_category ON creator_content(category);
CREATE INDEX IF NOT EXISTS idx_creator_content_premium ON creator_content(is_premium);

CREATE INDEX IF NOT EXISTS idx_creator_courses_creator_id ON creator_courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_courses_status ON creator_courses(status);
CREATE INDEX IF NOT EXISTS idx_creator_courses_published ON creator_courses(published_at DESC) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_completed ON course_enrollments(is_completed);

CREATE INDEX IF NOT EXISTS idx_content_ratings_content ON content_ratings(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_ratings_user ON content_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_creator ON creator_subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_subscriber ON creator_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_status ON creator_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_date ON creator_earnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_payout ON creator_earnings(payout_status);

CREATE INDEX IF NOT EXISTS idx_creator_analytics_creator_date ON creator_analytics(creator_id, date DESC);

-- Function to update creator stats
CREATE OR REPLACE FUNCTION update_creator_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'creator_content' AND NEW.status = 'published' THEN
            -- Increment content count
            UPDATE content_creators 
            SET total_content = total_content + 1
            WHERE id = NEW.creator_id;
            
        ELSIF TG_TABLE_NAME = 'creator_subscriptions' AND NEW.status = 'active' THEN
            -- Increment follower count
            UPDATE content_creators 
            SET total_followers = total_followers + 1
            WHERE id = NEW.creator_id;
            
        ELSIF TG_TABLE_NAME = 'content_ratings' THEN
            -- Update average rating
            UPDATE content_creators 
            SET 
                total_ratings = total_ratings + 1,
                avg_rating = (
                    SELECT AVG(rating::DECIMAL) 
                    FROM content_ratings cr
                    JOIN creator_content cc ON cr.content_id = cc.id
                    WHERE cc.creator_id = (
                        SELECT creator_id FROM creator_content WHERE id = NEW.content_id
                    )
                )
            WHERE id = (SELECT creator_id FROM creator_content WHERE id = NEW.content_id);
            
        ELSIF TG_TABLE_NAME = 'creator_earnings' THEN
            -- Update creator tier based on earnings
            DECLARE
                creator_total_earnings DECIMAL(10,2);
                new_tier VARCHAR(20);
            BEGIN
                SELECT COALESCE(SUM(net_amount), 0) INTO creator_total_earnings
                FROM creator_earnings
                WHERE creator_id = NEW.creator_id;
                
                -- Determine new tier based on total earnings
                IF creator_total_earnings >= 50000 THEN
                    new_tier := 'diamond';
                ELSIF creator_total_earnings >= 20000 THEN
                    new_tier := 'platinum';
                ELSIF creator_total_earnings >= 5000 THEN
                    new_tier := 'gold';
                ELSIF creator_total_earnings >= 1000 THEN
                    new_tier := 'silver';
                ELSE
                    new_tier := 'bronze';
                END IF;
                
                UPDATE content_creators 
                SET creator_tier = new_tier
                WHERE id = NEW.creator_id;
            END;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME = 'creator_subscriptions' THEN
            -- Handle subscription status changes
            IF OLD.status = 'active' AND NEW.status != 'active' THEN
                UPDATE content_creators 
                SET total_followers = GREATEST(total_followers - 1, 0)
                WHERE id = NEW.creator_id;
            ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
                UPDATE content_creators 
                SET total_followers = total_followers + 1
                WHERE id = NEW.creator_id;
            END IF;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'creator_subscriptions' AND OLD.status = 'active' THEN
            UPDATE content_creators 
            SET total_followers = GREATEST(total_followers - 1, 0)
            WHERE id = OLD.creator_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for creator stats
CREATE TRIGGER creator_content_stats_trigger
    AFTER INSERT OR UPDATE ON creator_content
    FOR EACH ROW EXECUTE FUNCTION update_creator_stats();

CREATE TRIGGER creator_subscriptions_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON creator_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_creator_stats();

CREATE TRIGGER content_ratings_stats_trigger
    AFTER INSERT ON content_ratings
    FOR EACH ROW EXECUTE FUNCTION update_creator_stats();

CREATE TRIGGER creator_earnings_stats_trigger
    AFTER INSERT ON creator_earnings
    FOR EACH ROW EXECUTE FUNCTION update_creator_stats();

-- Function to generate daily analytics
CREATE OR REPLACE FUNCTION generate_daily_creator_analytics()
RETURNS void AS $$
DECLARE
    creator_record RECORD;
BEGIN
    FOR creator_record IN SELECT id FROM content_creators WHERE creator_program_status = 'approved' LOOP
        INSERT INTO creator_analytics (creator_id, date)
        VALUES (creator_record.id, CURRENT_DATE)
        ON CONFLICT (creator_id, date) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;