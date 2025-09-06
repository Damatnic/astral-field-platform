-- Multi-modal AI analysis tables for image, video, and audio processing

-- Multimodal analyses storage
CREATE TABLE IF NOT EXISTS multimodal_analyses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN (
        'player_movement', 'injury_assessment', 'game_film_analysis',
        'social_media', 'news_image', 'podcast', 'press_conference'
    )),
    analysis_result JSONB NOT NULL DEFAULT '{}',
    player_name VARCHAR(100),
    platform VARCHAR(50), -- For social media analysis
    source VARCHAR(200), -- For news/media source
    show_name VARCHAR(200), -- For podcast/show analysis
    relevance_score DECIMAL(4,3) NOT NULL DEFAULT 0.500 CHECK (relevance_score BETWEEN 0 AND 1),
    insights_count INTEGER NOT NULL DEFAULT 0,
    risk_factors_count INTEGER NOT NULL DEFAULT 0,
    confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.500 CHECK (confidence_score BETWEEN 0 AND 1),
    related_players JSONB NOT NULL DEFAULT '[]', -- Array of related player names
    analysis_context VARCHAR(100), -- Additional context for the analysis
    batch_id VARCHAR(50), -- For batch processing tracking
    media_metadata JSONB DEFAULT '{}', -- Media file information
    processing_time_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injury assessment tracking
CREATE TABLE IF NOT EXISTS injury_assessments (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    injury_type VARCHAR(100),
    affected_body_part VARCHAR(50),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'season_ending')),
    movement_analysis JSONB NOT NULL DEFAULT '{}',
    return_timeline JSONB NOT NULL DEFAULT '{}', -- optimistic, realistic, pessimistic
    fantasy_implications JSONB NOT NULL DEFAULT '{}',
    assessment_source VARCHAR(20) NOT NULL CHECK (assessment_source IN ('video', 'image', 'report')),
    confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    medical_context TEXT,
    created_by VARCHAR(50), -- User ID who requested analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game film analysis results
CREATE TABLE IF NOT EXISTS game_film_analyses (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(20) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    position VARCHAR(5) NOT NULL,
    game_context VARCHAR(200),
    week INTEGER,
    season INTEGER,
    performance_metrics JSONB NOT NULL DEFAULT '{}',
    qualitative_analysis JSONB NOT NULL DEFAULT '{}', -- Route running, separation, etc.
    situational_usage JSONB NOT NULL DEFAULT '{}', -- Down/distance, field position
    coaching_tendencies JSONB NOT NULL DEFAULT '[]',
    fantasy_projection JSONB NOT NULL DEFAULT '{}',
    video_metadata JSONB DEFAULT '{}',
    analysis_quality VARCHAR(20) DEFAULT 'good' CHECK (analysis_quality IN ('poor', 'fair', 'good', 'excellent')),
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social media sentiment tracking
CREATE TABLE IF NOT EXISTS social_media_sentiment (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'audio')),
    account_username VARCHAR(100),
    account_followers INTEGER DEFAULT 0,
    account_verified BOOLEAN DEFAULT FALSE,
    account_type VARCHAR(20) DEFAULT 'fan' CHECK (account_type IN ('player', 'reporter', 'analyst', 'fan', 'team')),
    sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive')),
    confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    key_topics JSONB NOT NULL DEFAULT '[]',
    influence_score DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (influence_score BETWEEN 0 AND 1),
    fantasy_relevance DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (fantasy_relevance BETWEEN 0 AND 1),
    action_required BOOLEAN NOT NULL DEFAULT FALSE,
    content_summary TEXT,
    related_players JSONB NOT NULL DEFAULT '[]',
    mentioned_teams JSONB NOT NULL DEFAULT '[]',
    post_engagement JSONB DEFAULT '{}', -- likes, shares, comments
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News and media analysis
CREATE TABLE IF NOT EXISTS news_media_analysis (
    id SERIAL PRIMARY KEY,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('article', 'image', 'video', 'podcast')),
    source VARCHAR(200) NOT NULL,
    headline TEXT,
    content_summary TEXT,
    key_findings JSONB NOT NULL DEFAULT '[]',
    risk_factors JSONB NOT NULL DEFAULT '[]',
    actionable_insights JSONB NOT NULL DEFAULT '[]',
    credibility_score DECIMAL(4,3) NOT NULL DEFAULT 0.500 CHECK (credibility_score BETWEEN 0 AND 1),
    timeliness_score DECIMAL(4,3) NOT NULL DEFAULT 0.500 CHECK (timeliness_score BETWEEN 0 AND 1),
    impact_assessment VARCHAR(20) DEFAULT 'medium' CHECK (impact_assessment IN ('low', 'medium', 'high', 'critical')),
    related_players JSONB NOT NULL DEFAULT '[]',
    related_teams JSONB NOT NULL DEFAULT '[]',
    publication_date TIMESTAMP WITH TIME ZONE,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(50)
);

-- Podcast and audio analysis
CREATE TABLE IF NOT EXISTS podcast_analyses (
    id SERIAL PRIMARY KEY,
    show_name VARCHAR(200) NOT NULL,
    episode_title VARCHAR(300),
    hosts JSONB NOT NULL DEFAULT '[]',
    duration_minutes INTEGER,
    transcript_quality VARCHAR(20) DEFAULT 'good' CHECK (transcript_quality IN ('poor', 'fair', 'good', 'excellent')),
    key_topics JSONB NOT NULL DEFAULT '[]',
    player_mentions JSONB NOT NULL DEFAULT '{}', -- player -> mention context mapping
    expert_opinions JSONB NOT NULL DEFAULT '[]',
    consensus_views JSONB NOT NULL DEFAULT '[]',
    contrarian_views JSONB NOT NULL DEFAULT '[]',
    actionable_advice JSONB NOT NULL DEFAULT '[]',
    time_sensitivity VARCHAR(20) DEFAULT 'medium' CHECK (time_sensitivity IN ('immediate', 'short_term', 'medium', 'long_term')),
    advice_quality VARCHAR(20) DEFAULT 'good' CHECK (advice_quality IN ('poor', 'fair', 'good', 'excellent')),
    supporting_data_quality VARCHAR(20) DEFAULT 'fair' CHECK (supporting_data_quality IN ('poor', 'fair', 'good', 'excellent')),
    publication_date TIMESTAMP WITH TIME ZONE,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(50)
);

-- Analysis performance tracking
CREATE TABLE IF NOT EXISTS analysis_performance_metrics (
    id SERIAL PRIMARY KEY,
    analysis_type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- Which AI provider was used
    processing_time_ms INTEGER NOT NULL,
    input_size_bytes INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0,
    accuracy_score DECIMAL(4,3) CHECK (accuracy_score BETWEEN 0 AND 1),
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback on analyses
CREATE TABLE IF NOT EXISTS analysis_user_feedback (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER NOT NULL, -- References multimodal_analyses.id
    user_id VARCHAR(50) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
    usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    would_use_again BOOLEAN DEFAULT TRUE,
    improvement_suggestions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis templates and presets
CREATE TABLE IF NOT EXISTS analysis_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    analysis_type VARCHAR(50) NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL DEFAULT '{}',
    prompt_template TEXT NOT NULL,
    created_by VARCHAR(50),
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    is_public BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trending analysis topics
CREATE TABLE IF NOT EXISTS trending_analysis_topics (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- player, team, injury, trade, etc.
    mention_count INTEGER NOT NULL DEFAULT 1,
    sentiment_average DECIMAL(3,2) DEFAULT 0.00, -- -1 to 1 scale
    relevance_score DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    last_mentioned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trend_direction VARCHAR(10) DEFAULT 'stable' CHECK (trend_direction IN ('rising', 'stable', 'falling')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic, category)
);

-- Analysis batch processing
CREATE TABLE IF NOT EXISTS analysis_batches (
    id SERIAL PRIMARY KEY,
    batch_name VARCHAR(200),
    user_id VARCHAR(50) NOT NULL,
    total_analyses INTEGER NOT NULL DEFAULT 0,
    completed_analyses INTEGER NOT NULL DEFAULT 0,
    failed_analyses INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    batch_parameters JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_multimodal_analyses_user_type_created 
ON multimodal_analyses(user_id, analysis_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_multimodal_analyses_player_created 
ON multimodal_analyses(player_name, created_at DESC) WHERE player_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_multimodal_analyses_relevance_created 
ON multimodal_analyses(relevance_score DESC, created_at DESC) WHERE relevance_score > 0.5;

CREATE INDEX IF NOT EXISTS idx_injury_assessments_player_severity 
ON injury_assessments(player_name, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_injury_assessments_confidence 
ON injury_assessments(confidence_score DESC, created_at DESC) WHERE confidence_score > 0.7;

CREATE INDEX IF NOT EXISTS idx_game_film_analyses_player_week_season 
ON game_film_analyses(player_name, season DESC, week DESC);

CREATE INDEX IF NOT EXISTS idx_social_media_sentiment_platform_created 
ON social_media_sentiment(platform, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_media_sentiment_relevance 
ON social_media_sentiment(fantasy_relevance DESC, influence_score DESC) WHERE fantasy_relevance > 0.3;

CREATE INDEX IF NOT EXISTS idx_news_media_analysis_impact_created 
ON news_media_analysis(impact_assessment, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_podcast_analyses_show_date 
ON podcast_analyses(show_name, publication_date DESC);

CREATE INDEX IF NOT EXISTS idx_analysis_performance_metrics_type_provider 
ON analysis_performance_metrics(analysis_type, provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trending_analysis_topics_relevance 
ON trending_analysis_topics(relevance_score DESC, mention_count DESC);

-- Functions for analysis insights

-- Function to get trending players from analyses
CREATE OR REPLACE FUNCTION get_trending_players_from_analyses(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    player_name VARCHAR,
    analysis_count BIGINT,
    avg_relevance DECIMAL,
    trend_direction VARCHAR
) AS $$
DECLARE
    cutoff_date TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL concat(days_back, ' days');
    prev_cutoff_date TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL concat(days_back * 2, ' days');
BEGIN
    RETURN QUERY
    WITH recent_analyses AS (
        SELECT 
            ma.player_name,
            COUNT(*) as recent_count,
            AVG(ma.relevance_score) as avg_relevance
        FROM multimodal_analyses ma
        WHERE ma.player_name IS NOT NULL 
          AND ma.created_at > cutoff_date
        GROUP BY ma.player_name
    ),
    previous_analyses AS (
        SELECT 
            ma.player_name,
            COUNT(*) as prev_count
        FROM multimodal_analyses ma
        WHERE ma.player_name IS NOT NULL 
          AND ma.created_at BETWEEN prev_cutoff_date AND cutoff_date
        GROUP BY ma.player_name
    )
    SELECT 
        r.player_name,
        r.recent_count,
        r.avg_relevance,
        CASE 
            WHEN p.prev_count IS NULL THEN 'new'
            WHEN r.recent_count > p.prev_count * 1.5 THEN 'rising'
            WHEN r.recent_count < p.prev_count * 0.5 THEN 'falling'
            ELSE 'stable'
        END::VARCHAR as trend_direction
    FROM recent_analyses r
    LEFT JOIN previous_analyses p ON r.player_name = p.player_name
    WHERE r.recent_count >= 2
    ORDER BY r.recent_count DESC, r.avg_relevance DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze sentiment trends
CREATE OR REPLACE FUNCTION analyze_sentiment_trends(player_name_filter VARCHAR DEFAULT NULL, days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    platform VARCHAR,
    sentiment_distribution JSONB,
    avg_influence DECIMAL,
    total_mentions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sms.platform,
        json_build_object(
            'very_positive', COUNT(*) FILTER (WHERE sms.sentiment = 'very_positive'),
            'positive', COUNT(*) FILTER (WHERE sms.sentiment = 'positive'),
            'neutral', COUNT(*) FILTER (WHERE sms.sentiment = 'neutral'),
            'negative', COUNT(*) FILTER (WHERE sms.sentiment = 'negative'),
            'very_negative', COUNT(*) FILTER (WHERE sms.sentiment = 'very_negative')
        )::JSONB as sentiment_distribution,
        AVG(sms.influence_score) as avg_influence,
        COUNT(*) as total_mentions
    FROM social_media_sentiment sms
    WHERE sms.created_at > NOW() - INTERVAL concat(days_back, ' days')
      AND (player_name_filter IS NULL OR sms.related_players @> json_build_array(player_name_filter)::jsonb)
    GROUP BY sms.platform
    ORDER BY total_mentions DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get high-impact analysis insights
CREATE OR REPLACE FUNCTION get_high_impact_insights(relevance_threshold DECIMAL DEFAULT 0.7, days_back INTEGER DEFAULT 3)
RETURNS TABLE (
    analysis_type VARCHAR,
    player_name VARCHAR,
    key_insight TEXT,
    relevance_score DECIMAL,
    confidence_score DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.analysis_type,
        ma.player_name,
        CASE 
            WHEN ma.analysis_type = 'injury_assessment' THEN 
                COALESCE(ma.analysis_result->>'fantasy_implications'->>'immediateImpact', 'Injury assessment completed')
            WHEN ma.analysis_type = 'social_media' THEN 
                COALESCE(ma.analysis_result->>'summary', 'Social media analysis')
            WHEN ma.analysis_type = 'game_film_analysis' THEN 
                'Game film analysis: ' || COALESCE(ma.analysis_result->>'fantasyProjection'->>'weeklyProjection', '0') || ' projected points'
            ELSE 
                'Analysis completed'
        END::TEXT as key_insight,
        ma.relevance_score,
        ma.confidence_score,
        ma.created_at
    FROM multimodal_analyses ma
    WHERE ma.relevance_score >= relevance_threshold
      AND ma.created_at > NOW() - INTERVAL concat(days_back, ' days')
    ORDER BY ma.relevance_score DESC, ma.confidence_score DESC, ma.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate analysis ROI
CREATE OR REPLACE FUNCTION calculate_analysis_roi(user_id_param VARCHAR, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_analyses BIGINT,
    total_cost_cents BIGINT,
    avg_relevance DECIMAL,
    high_relevance_analyses BIGINT,
    roi_score DECIMAL
) AS $$
DECLARE
    cost_per_analysis INTEGER := 25; -- Estimated 25 cents per analysis
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_analyses,
        (COUNT(*) * cost_per_analysis)::BIGINT as total_cost_cents,
        AVG(ma.relevance_score) as avg_relevance,
        COUNT(*) FILTER (WHERE ma.relevance_score > 0.7) as high_relevance_analyses,
        CASE 
            WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE ma.relevance_score > 0.7)::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END as roi_score
    FROM multimodal_analyses ma
    WHERE ma.user_id = user_id_param
      AND ma.created_at > NOW() - INTERVAL concat(days_back, ' days');
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trending topics
CREATE OR REPLACE FUNCTION update_trending_topics()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract player names and update trending topics
    IF NEW.player_name IS NOT NULL THEN
        INSERT INTO trending_analysis_topics (topic, category, mention_count, relevance_score, last_mentioned)
        VALUES (NEW.player_name, 'player', 1, NEW.relevance_score, NEW.created_at)
        ON CONFLICT (topic, category) DO UPDATE SET
            mention_count = trending_analysis_topics.mention_count + 1,
            relevance_score = (trending_analysis_topics.relevance_score * 0.8) + (NEW.relevance_score * 0.2),
            last_mentioned = NEW.created_at;
    END IF;

    -- Update trend directions hourly
    UPDATE trending_analysis_topics 
    SET trend_direction = 
        CASE 
            WHEN mention_count > (
                SELECT AVG(mention_count) * 1.5 
                FROM trending_analysis_topics t2 
                WHERE t2.category = trending_analysis_topics.category
            ) THEN 'rising'
            WHEN mention_count < (
                SELECT AVG(mention_count) * 0.5 
                FROM trending_analysis_topics t2 
                WHERE t2.category = trending_analysis_topics.category
            ) THEN 'falling'
            ELSE 'stable'
        END
    WHERE last_mentioned > NOW() - INTERVAL '1 hour';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trending_topics
    AFTER INSERT ON multimodal_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_trending_topics();

-- Trigger to update analysis performance metrics
CREATE OR REPLACE FUNCTION record_analysis_performance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO analysis_performance_metrics (
        analysis_type,
        provider,
        processing_time_ms,
        cost_cents,
        accuracy_score,
        success
    ) VALUES (
        NEW.analysis_type,
        COALESCE(NEW.analysis_result->>'metadata'->>'provider', 'unknown'),
        NEW.processing_time_ms,
        COALESCE((NEW.analysis_result->>'metadata'->>'cost')::NUMERIC * 100, 0)::INTEGER,
        NEW.confidence_score,
        NEW.analysis_result IS NOT NULL
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_analysis_performance
    AFTER INSERT ON multimodal_analyses
    FOR EACH ROW
    EXECUTE FUNCTION record_analysis_performance();

-- Views for common queries

-- Real-time analysis dashboard
CREATE OR REPLACE VIEW v_analysis_dashboard AS
SELECT 
    ma.analysis_type,
    ma.player_name,
    ma.relevance_score,
    ma.confidence_score,
    ma.insights_count,
    CASE 
        WHEN ma.analysis_type = 'injury_assessment' THEN 'Medical'
        WHEN ma.analysis_type = 'social_media' THEN 'Social'
        WHEN ma.analysis_type = 'game_film_analysis' THEN 'Performance'
        WHEN ma.analysis_type = 'news_image' THEN 'News'
        WHEN ma.analysis_type = 'podcast' THEN 'Expert Opinion'
        ELSE 'Other'
    END as category,
    ma.created_at,
    CASE 
        WHEN ma.relevance_score > 0.8 THEN 'high'
        WHEN ma.relevance_score > 0.6 THEN 'medium'
        ELSE 'low'
    END as priority
FROM multimodal_analyses ma
WHERE ma.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ma.relevance_score DESC, ma.created_at DESC;

-- Player analysis summary
CREATE OR REPLACE VIEW v_player_analysis_summary AS
SELECT 
    ma.player_name,
    COUNT(*) as total_analyses,
    AVG(ma.relevance_score) as avg_relevance,
    MAX(ma.created_at) as last_analysis,
    COUNT(*) FILTER (WHERE ma.analysis_type = 'injury_assessment') as injury_analyses,
    COUNT(*) FILTER (WHERE ma.analysis_type = 'game_film_analysis') as film_analyses,
    COUNT(*) FILTER (WHERE ma.analysis_type = 'social_media') as social_analyses,
    SUM(ma.insights_count) as total_insights
FROM multimodal_analyses ma
WHERE ma.player_name IS NOT NULL
  AND ma.created_at > NOW() - INTERVAL '30 days'
GROUP BY ma.player_name
ORDER BY avg_relevance DESC, total_analyses DESC;

COMMENT ON TABLE multimodal_analyses IS 'Storage for all multi-modal AI analysis results including video, image, and audio processing';
COMMENT ON TABLE injury_assessments IS 'Detailed injury assessments derived from video/image analysis';
COMMENT ON TABLE game_film_analyses IS 'Game film analysis results for player performance evaluation';
COMMENT ON TABLE social_media_sentiment IS 'Social media sentiment analysis and influence tracking';
COMMENT ON TABLE news_media_analysis IS 'News and media content analysis for fantasy relevance';
COMMENT ON TABLE podcast_analyses IS 'Podcast and audio content analysis for expert insights';
COMMENT ON TABLE analysis_performance_metrics IS 'Performance tracking for analysis operations';
COMMENT ON TABLE analysis_user_feedback IS 'User feedback and ratings for analysis quality';
COMMENT ON TABLE trending_analysis_topics IS 'Trending topics and players based on analysis volume and sentiment';