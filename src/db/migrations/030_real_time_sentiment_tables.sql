-- Real-time sentiment analysis tables for social media and news monitoring

-- Real-time sentiment data storage
CREATE TABLE IF NOT EXISTS real_time_sentiment (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(200) NOT NULL UNIQUE, -- Unique ID from source platform
    source VARCHAR(100) NOT NULL, -- twitter, reddit, ESPN, etc.
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('twitter', 'reddit', 'news', 'podcast', 'beat_reporter')),
    content TEXT NOT NULL,
    author VARCHAR(200),
    author_verified BOOLEAN DEFAULT FALSE,
    author_followers INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    player_mentions JSONB NOT NULL DEFAULT '[]', -- Array of player names mentioned
    team_mentions JSONB NOT NULL DEFAULT '[]', -- Array of team names mentioned
    raw_sentiment VARCHAR(20) NOT NULL CHECK (raw_sentiment IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive')),
    sentiment_score DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (sentiment_score BETWEEN -1 AND 1), -- -1 to 1
    confidence DECIMAL(4,3) NOT NULL DEFAULT 0.500 CHECK (confidence BETWEEN 0 AND 1),
    fantasy_relevance DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (fantasy_relevance BETWEEN 0 AND 1),
    urgency VARCHAR(10) NOT NULL DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    topics JSONB NOT NULL DEFAULT '[]', -- injury, trade, performance, etc.
    influence_score DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (influence_score BETWEEN 0 AND 1),
    engagement_metrics JSONB DEFAULT '{}', -- likes, shares, comments, upvotes
    processing_metadata JSONB DEFAULT '{}', -- AI processing details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sentiment alerts generated from analysis
CREATE TABLE IF NOT EXISTS sentiment_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('injury_concern', 'trade_rumor', 'lineup_change', 'performance_issue', 'opportunity')),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    player_name VARCHAR(100) NOT NULL,
    team_name VARCHAR(50),
    summary TEXT NOT NULL,
    supporting_evidence JSONB NOT NULL DEFAULT '[]', -- Array of related sentiment data
    confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.500 CHECK (confidence_score BETWEEN 0 AND 1),
    time_window VARCHAR(20), -- Duration of analysis window
    action_recommendation TEXT,
    user_notifications_sent BOOLEAN DEFAULT FALSE,
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'resolved', 'expired', 'dismissed')),
    resolution_notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trending topics based on sentiment analysis
CREATE TABLE IF NOT EXISTS trending_sentiment_topics (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(200) NOT NULL,
    category VARCHAR(30) DEFAULT 'general' CHECK (category IN ('player', 'team', 'injury', 'trade', 'coaching', 'general')),
    mention_count INTEGER NOT NULL DEFAULT 1,
    avg_sentiment DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (avg_sentiment BETWEEN -1 AND 1),
    avg_influence DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (avg_influence BETWEEN 0 AND 1),
    sentiment_trend VARCHAR(10) DEFAULT 'stable' CHECK (sentiment_trend IN ('improving', 'declining', 'stable', 'volatile')),
    timeframe VARCHAR(5) NOT NULL CHECK (timeframe IN ('1h', '4h', '12h', '24h')),
    peak_mention_time TIMESTAMP WITH TIME ZONE,
    related_players JSONB DEFAULT '[]',
    related_teams JSONB DEFAULT '[]',
    top_sources JSONB DEFAULT '[]', -- Most influential sources
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(topic, timeframe)
);

-- Sentiment source configuration and health
CREATE TABLE IF NOT EXISTS sentiment_sources (
    id SERIAL PRIMARY KEY,
    source_id VARCHAR(50) NOT NULL UNIQUE,
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('twitter', 'reddit', 'news', 'podcast', 'beat_reporter')),
    api_endpoint VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    update_frequency_minutes INTEGER DEFAULT 15,
    rate_limit_per_hour INTEGER DEFAULT 100,
    rate_limit_remaining INTEGER DEFAULT 100,
    last_successful_update TIMESTAMP WITH TIME ZONE,
    last_error TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player sentiment history for trend analysis
CREATE TABLE IF NOT EXISTS player_sentiment_history (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    team_name VARCHAR(50),
    date_hour TIMESTAMP WITH TIME ZONE NOT NULL, -- Hourly aggregation
    mention_count INTEGER NOT NULL DEFAULT 0,
    avg_sentiment DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (avg_sentiment BETWEEN -1 AND 1),
    sentiment_volatility DECIMAL(4,3) NOT NULL DEFAULT 0.000, -- Standard deviation
    avg_influence DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    top_sentiment_topics JSONB DEFAULT '[]',
    dominant_source_type VARCHAR(20),
    verified_author_percentage DECIMAL(3,2) DEFAULT 0.00,
    total_engagement INTEGER DEFAULT 0,
    alert_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_name, date_hour)
);

-- Sentiment analysis performance metrics
CREATE TABLE IF NOT EXISTS sentiment_analysis_metrics (
    id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_items_processed INTEGER NOT NULL DEFAULT 0,
    successful_analyses INTEGER NOT NULL DEFAULT 0,
    failed_analyses INTEGER NOT NULL DEFAULT 0,
    avg_processing_time_ms INTEGER NOT NULL DEFAULT 0,
    avg_confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    alerts_generated INTEGER NOT NULL DEFAULT 0,
    trending_topics_identified INTEGER NOT NULL DEFAULT 0,
    unique_players_mentioned INTEGER NOT NULL DEFAULT 0,
    total_influence_processed DECIMAL(10,3) DEFAULT 0.000,
    source_breakdown JSONB DEFAULT '{}', -- Breakdown by source type
    sentiment_distribution JSONB DEFAULT '{}', -- Distribution of sentiment categories
    topic_breakdown JSONB DEFAULT '{}', -- Most common topics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(analysis_date)
);

-- User sentiment alert subscriptions
CREATE TABLE IF NOT EXISTS user_sentiment_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('player', 'team', 'topic', 'all')),
    target_value VARCHAR(200) NOT NULL, -- player name, team name, or topic
    alert_types JSONB NOT NULL DEFAULT '[]', -- Which alert types to receive
    severity_threshold VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (severity_threshold IN ('low', 'medium', 'high', 'critical')),
    notification_methods JSONB NOT NULL DEFAULT '[]', -- email, push, sms
    is_active BOOLEAN DEFAULT TRUE,
    last_notification_sent TIMESTAMP WITH TIME ZONE,
    total_notifications_sent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sentiment keyword tracking
CREATE TABLE IF NOT EXISTS sentiment_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('injury', 'trade', 'performance', 'coaching', 'positive', 'negative')),
    sentiment_weight DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (sentiment_weight BETWEEN -1 AND 1), -- How much this keyword affects sentiment
    fantasy_relevance DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (fantasy_relevance BETWEEN 0 AND 1),
    urgency_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    usage_count INTEGER DEFAULT 0,
    accuracy_score DECIMAL(4,3) DEFAULT 0.500, -- How accurate this keyword is for predictions
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sentiment analysis model performance
CREATE TABLE IF NOT EXISTS sentiment_model_performance (
    id SERIAL PRIMARY KEY,
    model_provider VARCHAR(50) NOT NULL, -- claude, gpt4o, etc.
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_analyses INTEGER NOT NULL DEFAULT 0,
    avg_confidence DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    avg_processing_time_ms INTEGER NOT NULL DEFAULT 0,
    accuracy_score DECIMAL(4,3), -- When validation data is available
    cost_per_analysis DECIMAL(6,4) DEFAULT 0.0000, -- In dollars
    alert_precision DECIMAL(4,3), -- Percentage of alerts that were actionable
    alert_recall DECIMAL(4,3), -- Percentage of important events that generated alerts
    user_satisfaction_rating DECIMAL(3,2), -- From user feedback
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model_provider, analysis_date)
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_real_time_sentiment_published_desc 
ON real_time_sentiment(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_real_time_sentiment_player_mentions 
ON real_time_sentiment USING GIN(player_mentions);

CREATE INDEX IF NOT EXISTS idx_real_time_sentiment_source_type_published 
ON real_time_sentiment(source_type, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_real_time_sentiment_sentiment_relevance 
ON real_time_sentiment(sentiment_score DESC, fantasy_relevance DESC) WHERE fantasy_relevance > 0.5;

CREATE INDEX IF NOT EXISTS idx_real_time_sentiment_urgency_published 
ON real_time_sentiment(urgency, published_at DESC) WHERE urgency IN ('high', 'critical');

CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_player_severity_created 
ON sentiment_alerts(player_name, severity, created_at DESC) WHERE alert_status = 'active';

CREATE INDEX IF NOT EXISTS idx_sentiment_alerts_expires_status 
ON sentiment_alerts(expires_at, alert_status) WHERE alert_status = 'active';

CREATE INDEX IF NOT EXISTS idx_trending_sentiment_topics_timeframe_mentions 
ON trending_sentiment_topics(timeframe, mention_count DESC, last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_player_sentiment_history_player_date 
ON player_sentiment_history(player_name, date_hour DESC);

CREATE INDEX IF NOT EXISTS idx_user_sentiment_subscriptions_user_active 
ON user_sentiment_subscriptions(user_id, is_active) WHERE is_active = true;

-- Functions for sentiment analysis and trending detection

-- Function to calculate sentiment trend for a player
CREATE OR REPLACE FUNCTION calculate_player_sentiment_trend(p_player_name VARCHAR, hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
    current_sentiment DECIMAL,
    sentiment_change DECIMAL,
    mention_count BIGINT,
    trend_direction VARCHAR
) AS $$
DECLARE
    current_avg DECIMAL;
    previous_avg DECIMAL;
    mentions BIGINT;
    change DECIMAL;
BEGIN
    -- Get current period sentiment
    SELECT AVG(sentiment_score), COUNT(*) 
    INTO current_avg, mentions
    FROM real_time_sentiment
    WHERE p_player_name = ANY(string_to_array(player_mentions::text, ','))
      AND published_at > NOW() - INTERVAL concat(hours_back, ' hours');
    
    -- Get previous period sentiment
    SELECT AVG(sentiment_score)
    INTO previous_avg
    FROM real_time_sentiment
    WHERE p_player_name = ANY(string_to_array(player_mentions::text, ','))
      AND published_at BETWEEN NOW() - INTERVAL concat(hours_back * 2, ' hours')
                           AND NOW() - INTERVAL concat(hours_back, ' hours');
    
    -- Calculate change
    change := COALESCE(current_avg, 0) - COALESCE(previous_avg, 0);
    
    RETURN QUERY SELECT 
        COALESCE(current_avg, 0.0)::DECIMAL,
        change,
        COALESCE(mentions, 0)::BIGINT,
        CASE 
            WHEN change > 0.1 THEN 'improving'
            WHEN change < -0.1 THEN 'declining'
            ELSE 'stable'
        END::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- Function to get top sentiment influencers
CREATE OR REPLACE FUNCTION get_top_sentiment_influencers(hours_back INTEGER DEFAULT 24, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    author VARCHAR,
    total_influence DECIMAL,
    mention_count BIGINT,
    avg_sentiment DECIMAL,
    verified BOOLEAN,
    followers INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rts.author,
        SUM(rts.influence_score)::DECIMAL as total_influence,
        COUNT(*)::BIGINT as mention_count,
        AVG(rts.sentiment_score)::DECIMAL as avg_sentiment,
        rts.author_verified,
        MAX(rts.author_followers) as followers
    FROM real_time_sentiment rts
    WHERE rts.published_at > NOW() - INTERVAL concat(hours_back, ' hours')
      AND rts.influence_score > 0.5
      AND rts.fantasy_relevance > 0.3
    GROUP BY rts.author, rts.author_verified
    ORDER BY total_influence DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to detect sentiment anomalies
CREATE OR REPLACE FUNCTION detect_sentiment_anomalies(sensitivity DECIMAL DEFAULT 2.0)
RETURNS TABLE (
    player_name VARCHAR,
    current_sentiment DECIMAL,
    expected_sentiment DECIMAL,
    deviation DECIMAL,
    significance VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH player_stats AS (
        SELECT 
            unnest(string_to_array(player_mentions::text, ',')) as player,
            AVG(sentiment_score) as recent_sentiment
        FROM real_time_sentiment
        WHERE published_at > NOW() - INTERVAL '2 hours'
        GROUP BY player
        HAVING COUNT(*) >= 3
    ),
    player_baseline AS (
        SELECT 
            unnest(string_to_array(player_mentions::text, ',')) as player,
            AVG(sentiment_score) as baseline_sentiment,
            STDDEV(sentiment_score) as sentiment_stddev
        FROM real_time_sentiment
        WHERE published_at BETWEEN NOW() - INTERVAL '7 days' AND NOW() - INTERVAL '2 hours'
        GROUP BY player
        HAVING COUNT(*) >= 10
    )
    SELECT 
        ps.player::VARCHAR,
        ps.recent_sentiment::DECIMAL,
        pb.baseline_sentiment::DECIMAL,
        ABS(ps.recent_sentiment - pb.baseline_sentiment)::DECIMAL as deviation,
        CASE 
            WHEN ABS(ps.recent_sentiment - pb.baseline_sentiment) > (sensitivity * pb.sentiment_stddev) THEN 'high'
            WHEN ABS(ps.recent_sentiment - pb.baseline_sentiment) > pb.sentiment_stddev THEN 'medium'
            ELSE 'low'
        END::VARCHAR as significance
    FROM player_stats ps
    JOIN player_baseline pb ON ps.player = pb.player
    WHERE ABS(ps.recent_sentiment - pb.baseline_sentiment) > pb.sentiment_stddev
    ORDER BY deviation DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate hourly player sentiment
CREATE OR REPLACE FUNCTION aggregate_hourly_sentiment()
RETURNS INTEGER AS $$
DECLARE
    rows_processed INTEGER := 0;
    hour_to_process TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Find the latest hour that needs processing
    SELECT DATE_TRUNC('hour', MAX(published_at))
    INTO hour_to_process
    FROM real_time_sentiment
    WHERE published_at <= NOW() - INTERVAL '1 hour'
      AND NOT EXISTS (
          SELECT 1 FROM player_sentiment_history psh
          WHERE psh.date_hour = DATE_TRUNC('hour', real_time_sentiment.published_at)
      );
    
    IF hour_to_process IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Aggregate sentiment data for that hour
    INSERT INTO player_sentiment_history (
        player_name, date_hour, mention_count, avg_sentiment,
        sentiment_volatility, avg_influence, top_sentiment_topics,
        dominant_source_type, verified_author_percentage, total_engagement
    )
    SELECT 
        unnest(string_to_array(player_mentions::text, ',')) as player_name,
        hour_to_process,
        COUNT(*) as mention_count,
        AVG(sentiment_score) as avg_sentiment,
        STDDEV(sentiment_score) as sentiment_volatility,
        AVG(influence_score) as avg_influence,
        array_agg(DISTINCT unnest(topics)) as top_sentiment_topics,
        MODE() WITHIN GROUP (ORDER BY source_type) as dominant_source_type,
        (COUNT(*) FILTER (WHERE author_verified = true)::DECIMAL / COUNT(*)) as verified_author_percentage,
        SUM(
            COALESCE((engagement_metrics->>'likes')::INTEGER, 0) +
            COALESCE((engagement_metrics->>'shares')::INTEGER, 0) +
            COALESCE((engagement_metrics->>'comments')::INTEGER, 0) +
            COALESCE((engagement_metrics->>'upvotes')::INTEGER, 0)
        ) as total_engagement
    FROM real_time_sentiment
    WHERE DATE_TRUNC('hour', published_at) = hour_to_process
    GROUP BY player_name
    ON CONFLICT (player_name, date_hour) DO NOTHING;
    
    GET DIAGNOSTICS rows_processed = ROW_COUNT;
    
    RETURN rows_processed;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic processing

-- Trigger to update trending topics when new sentiment is added
CREATE OR REPLACE FUNCTION update_trending_on_sentiment_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Update topic mentions for 4-hour window
    INSERT INTO trending_sentiment_topics (
        topic, mention_count, avg_sentiment, avg_influence, timeframe, last_updated
    )
    SELECT 
        unnest(NEW.topics),
        1,
        NEW.sentiment_score,
        NEW.influence_score,
        '4h',
        NOW()
    WHERE array_length(NEW.topics, 1) > 0
    ON CONFLICT (topic, timeframe) DO UPDATE SET
        mention_count = trending_sentiment_topics.mention_count + 1,
        avg_sentiment = (trending_sentiment_topics.avg_sentiment * trending_sentiment_topics.mention_count + NEW.sentiment_score) / (trending_sentiment_topics.mention_count + 1),
        avg_influence = (trending_sentiment_topics.avg_influence * trending_sentiment_topics.mention_count + NEW.influence_score) / (trending_sentiment_topics.mention_count + 1),
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trending_on_sentiment_insert
    AFTER INSERT ON real_time_sentiment
    FOR EACH ROW
    EXECUTE FUNCTION update_trending_on_sentiment_insert();

-- Trigger to update source statistics
CREATE OR REPLACE FUNCTION update_source_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sentiment_sources 
    SET 
        total_requests = total_requests + 1,
        successful_requests = successful_requests + 1,
        last_successful_update = NOW(),
        updated_at = NOW()
    WHERE source_id = NEW.source;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_source_stats
    AFTER INSERT ON real_time_sentiment
    FOR EACH ROW
    EXECUTE FUNCTION update_source_stats();

-- Views for common queries

-- Real-time sentiment dashboard view
CREATE OR REPLACE VIEW v_sentiment_dashboard AS
SELECT 
    rts.player_mentions,
    rts.raw_sentiment,
    rts.sentiment_score,
    rts.fantasy_relevance,
    rts.urgency,
    rts.influence_score,
    rts.source_type,
    rts.published_at,
    CASE 
        WHEN rts.urgency IN ('high', 'critical') AND rts.fantasy_relevance > 0.7 THEN 'immediate_attention'
        WHEN rts.sentiment_score < -0.5 AND rts.influence_score > 0.6 THEN 'negative_trend'
        WHEN rts.sentiment_score > 0.5 AND rts.influence_score > 0.6 THEN 'positive_trend'
        ELSE 'monitor'
    END as action_priority
FROM real_time_sentiment rts
WHERE rts.published_at > NOW() - INTERVAL '4 hours'
  AND rts.fantasy_relevance > 0.3
ORDER BY rts.influence_score DESC, rts.published_at DESC;

-- Player sentiment summary view
CREATE OR REPLACE VIEW v_player_sentiment_summary AS
SELECT 
    unnest(string_to_array(player_mentions::text, ',')) as player_name,
    COUNT(*) as total_mentions,
    AVG(sentiment_score) as avg_sentiment,
    AVG(influence_score) as avg_influence,
    AVG(fantasy_relevance) as avg_relevance,
    COUNT(*) FILTER (WHERE urgency IN ('high', 'critical')) as urgent_mentions,
    MAX(published_at) as last_mention,
    string_agg(DISTINCT source_type, ', ') as mention_sources
FROM real_time_sentiment
WHERE published_at > NOW() - INTERVAL '24 hours'
  AND array_length(string_to_array(player_mentions::text, ','), 1) > 0
GROUP BY player_name
HAVING COUNT(*) >= 2
ORDER BY avg_influence DESC, total_mentions DESC;

COMMENT ON TABLE real_time_sentiment IS 'Real-time sentiment data from social media, news, and other sources';
COMMENT ON TABLE sentiment_alerts IS 'Automated alerts generated from sentiment analysis patterns';
COMMENT ON TABLE trending_sentiment_topics IS 'Trending topics based on mention volume and sentiment changes';
COMMENT ON TABLE player_sentiment_history IS 'Hourly aggregated sentiment history for trend analysis';
COMMENT ON TABLE sentiment_sources IS 'Configuration and health monitoring for sentiment data sources';
COMMENT ON TABLE user_sentiment_subscriptions IS 'User preferences for sentiment-based notifications';