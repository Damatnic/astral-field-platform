-- Continuous learning and user feedback analysis tables

-- User AI preferences and personalization data
CREATE TABLE IF NOT EXISTS user_ai_preferences (
    user_id VARCHAR(50) PRIMARY KEY,
    preferences JSONB NOT NULL DEFAULT '{}', -- General preferences and feature priorities
    communication_style VARCHAR(20) NOT NULL DEFAULT 'balanced' 
        CHECK (communication_style IN ('conservative', 'aggressive', 'analytical', 'balanced')),
    risk_tolerance DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (risk_tolerance BETWEEN 0 AND 1),
    learning_history JSONB NOT NULL DEFAULT '[]', -- Array of learning events
    personalization_score DECIMAL(3,2) NOT NULL DEFAULT 0.00, -- How well personalized (0-1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Continuous learning sessions tracking
CREATE TABLE IF NOT EXISTS continuous_learning_sessions (
    id SERIAL PRIMARY KEY,
    patterns_identified INTEGER NOT NULL DEFAULT 0,
    improvements_made INTEGER NOT NULL DEFAULT 0,
    confidence_avg DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (confidence_avg BETWEEN 0 AND 1),
    processing_duration_ms INTEGER NOT NULL DEFAULT 0,
    feedback_samples_analyzed INTEGER NOT NULL DEFAULT 0,
    users_affected INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning patterns identified during analysis
CREATE TABLE IF NOT EXISTS learning_patterns (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES continuous_learning_sessions(id) ON DELETE CASCADE,
    pattern_name VARCHAR(200) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL DEFAULT 'behavioral', -- behavioral, preference, satisfaction, performance
    confidence DECIMAL(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    frequency INTEGER NOT NULL DEFAULT 0,
    user_segment VARCHAR(50) NOT NULL DEFAULT 'general',
    feature_context VARCHAR(100) NOT NULL,
    outcomes JSONB NOT NULL DEFAULT '[]', -- Array of associated outcomes
    action_recommendations JSONB NOT NULL DEFAULT '[]', -- Recommended actions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI model improvement history
CREATE TABLE IF NOT EXISTS ai_model_improvements (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    pattern_identified VARCHAR(200),
    improvement_factor DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    old_performance DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    new_performance DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    improvement_type VARCHAR(50) NOT NULL DEFAULT 'accuracy' 
        CHECK (improvement_type IN ('accuracy', 'efficiency', 'user_satisfaction', 'cost_optimization')),
    validation_metric DECIMAL(4,3),
    rollback_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model improvement history with session tracking
CREATE TABLE IF NOT EXISTS model_improvement_history (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES continuous_learning_sessions(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    improvement_type VARCHAR(50) NOT NULL 
        CHECK (improvement_type IN ('accuracy', 'efficiency', 'user_satisfaction', 'cost_optimization')),
    old_metric DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
    new_metric DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
    rollout_status VARCHAR(20) NOT NULL DEFAULT 'testing' 
        CHECK (rollout_status IN ('testing', 'partial', 'full', 'rolled_back')),
    validation_results JSONB DEFAULT '{}',
    rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System parameter updates based on learning
CREATE TABLE IF NOT EXISTS system_parameter_updates (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) NOT NULL,
    parameter_type VARCHAR(100) NOT NULL,
    parameter_value DECIMAL(10,6) NOT NULL,
    previous_value DECIMAL(10,6),
    adjustment_reason TEXT,
    impact_assessment JSONB DEFAULT '{}',
    rollback_available BOOLEAN NOT NULL DEFAULT TRUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback aggregation and analysis
CREATE TABLE IF NOT EXISTS user_feedback_analysis (
    id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    feature_name VARCHAR(100) NOT NULL,
    total_feedback_count INTEGER NOT NULL DEFAULT 0,
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    sentiment_distribution JSONB NOT NULL DEFAULT '{}', -- positive, negative, neutral counts
    common_themes JSONB NOT NULL DEFAULT '[]', -- Array of common feedback themes
    improvement_suggestions JSONB NOT NULL DEFAULT '[]', -- Array of suggested improvements
    priority_score DECIMAL(3,2) NOT NULL DEFAULT 0.00, -- Priority for addressing (0-1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(analysis_date, feature_name)
);

-- A/B testing for model improvements
CREATE TABLE IF NOT EXISTS model_ab_tests (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(200) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    control_version VARCHAR(20) NOT NULL,
    treatment_version VARCHAR(20) NOT NULL,
    user_assignment_criteria JSONB NOT NULL DEFAULT '{}',
    success_metrics JSONB NOT NULL DEFAULT '[]', -- Array of metrics to track
    test_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    test_end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'planning' 
        CHECK (status IN ('planning', 'running', 'paused', 'completed', 'cancelled')),
    results JSONB DEFAULT '{}',
    confidence_level DECIMAL(4,3) DEFAULT 0.95,
    sample_size_required INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test user assignments
CREATE TABLE IF NOT EXISTS ab_test_user_assignments (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES model_ab_tests(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    assigned_variant VARCHAR(20) NOT NULL CHECK (assigned_variant IN ('control', 'treatment')),
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(test_id, user_id)
);

-- A/B test results tracking
CREATE TABLE IF NOT EXISTS ab_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES model_ab_tests(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    variant VARCHAR(20) NOT NULL CHECK (variant IN ('control', 'treatment')),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature usage patterns for personalization
CREATE TABLE IF NOT EXISTS feature_usage_patterns (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    usage_frequency DECIMAL(6,2) NOT NULL DEFAULT 0.00, -- Uses per day
    success_rate DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    avg_satisfaction DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    preferred_communication_style VARCHAR(20),
    optimal_timing JSONB DEFAULT '{}', -- Time patterns when user is most active
    context_preferences JSONB DEFAULT '{}', -- Contextual preferences
    last_usage TIMESTAMP WITH TIME ZONE,
    pattern_confidence DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_name)
);

-- Personalization effectiveness tracking
CREATE TABLE IF NOT EXISTS personalization_effectiveness (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    personalization_applied JSONB NOT NULL DEFAULT '{}', -- What personalizations were applied
    before_metrics JSONB NOT NULL DEFAULT '{}', -- Metrics before personalization
    after_metrics JSONB NOT NULL DEFAULT '{}', -- Metrics after personalization
    effectiveness_score DECIMAL(4,3) NOT NULL DEFAULT 0.000, -- How effective (0-1)
    measurement_period_days INTEGER NOT NULL DEFAULT 7,
    confidence_level DECIMAL(4,3) NOT NULL DEFAULT 0.000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning algorithm performance tracking
CREATE TABLE IF NOT EXISTS learning_algorithm_performance (
    id SERIAL PRIMARY KEY,
    algorithm_name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    accuracy_score DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
    precision_score DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
    recall_score DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
    f1_score DECIMAL(6,4) NOT NULL DEFAULT 0.0000,
    training_samples INTEGER NOT NULL DEFAULT 0,
    validation_samples INTEGER NOT NULL DEFAULT 0,
    training_duration_ms INTEGER NOT NULL DEFAULT 0,
    model_size_bytes BIGINT NOT NULL DEFAULT 0,
    deployment_status VARCHAR(20) NOT NULL DEFAULT 'training'
        CHECK (deployment_status IN ('training', 'validation', 'testing', 'production', 'retired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_updated 
ON user_ai_preferences(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_continuous_learning_sessions_created 
ON continuous_learning_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_patterns_session_confidence 
ON learning_patterns(session_id, confidence DESC);

CREATE INDEX IF NOT EXISTS idx_learning_patterns_feature_pattern 
ON learning_patterns(feature_context, pattern_name);

CREATE INDEX IF NOT EXISTS idx_ai_model_improvements_model_created 
ON ai_model_improvements(model_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_improvement_history_session 
ON model_improvement_history(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_parameter_updates_feature_applied 
ON system_parameter_updates(feature_name, applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_feedback_analysis_feature_date 
ON user_feedback_analysis(feature_name, analysis_date DESC);

CREATE INDEX IF NOT EXISTS idx_model_ab_tests_status_dates 
ON model_ab_tests(status, test_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_ab_test_user_assignments_user_test 
ON ab_test_user_assignments(user_id, test_id);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_variant_metric 
ON ab_test_results(test_id, variant, metric_name);

CREATE INDEX IF NOT EXISTS idx_feature_usage_patterns_user_updated 
ON feature_usage_patterns(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_personalization_effectiveness_user_created 
ON personalization_effectiveness(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_algorithm_performance_name_version 
ON learning_algorithm_performance(algorithm_name, version, created_at DESC);

-- Functions for learning analytics

-- Function to calculate personalization effectiveness
CREATE OR REPLACE FUNCTION calculate_personalization_effectiveness(p_user_id VARCHAR, days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    effectiveness_score DECIMAL,
    improvement_areas JSONB,
    recommendations JSONB
) AS $$
DECLARE
    before_satisfaction DECIMAL;
    after_satisfaction DECIMAL;
    before_engagement DECIMAL;
    after_engagement DECIMAL;
    effectiveness DECIMAL;
BEGIN
    -- Get satisfaction before personalization
    SELECT AVG(rating) INTO before_satisfaction
    FROM user_feedback_ratings
    WHERE user_id = p_user_id
      AND created_at BETWEEN NOW() - INTERVAL concat((days_back * 2), ' days') 
                         AND NOW() - INTERVAL concat(days_back, ' days');
    
    -- Get satisfaction after personalization
    SELECT AVG(rating) INTO after_satisfaction
    FROM user_feedback_ratings
    WHERE user_id = p_user_id
      AND created_at > NOW() - INTERVAL concat(days_back, ' days');
    
    -- Get engagement before personalization
    SELECT COUNT(*)::DECIMAL / days_back INTO before_engagement
    FROM ai_feature_usage_logs
    WHERE user_id = p_user_id
      AND created_at BETWEEN NOW() - INTERVAL concat((days_back * 2), ' days') 
                         AND NOW() - INTERVAL concat(days_back, ' days');
    
    -- Get engagement after personalization
    SELECT COUNT(*)::DECIMAL / days_back INTO after_engagement
    FROM ai_feature_usage_logs
    WHERE user_id = p_user_id
      AND created_at > NOW() - INTERVAL concat(days_back, ' days');
    
    -- Calculate effectiveness score
    effectiveness := (
        COALESCE((after_satisfaction - before_satisfaction) / 4.0, 0) * 0.6 +
        COALESCE((after_engagement - before_engagement) / GREATEST(before_engagement, 1), 0) * 0.4
    );
    
    effectiveness := GREATEST(LEAST(effectiveness, 1.0), -1.0);
    
    RETURN QUERY SELECT 
        effectiveness,
        jsonb_build_object(
            'satisfaction_change', COALESCE(after_satisfaction - before_satisfaction, 0),
            'engagement_change', COALESCE(after_engagement - before_engagement, 0)
        ),
        CASE 
            WHEN effectiveness < -0.2 THEN jsonb_build_array('recalibrate_preferences', 'analyze_negative_feedback')
            WHEN effectiveness < 0.1 THEN jsonb_build_array('fine_tune_personalization', 'increase_feature_variety')
            ELSE jsonb_build_array('maintain_current_approach', 'explore_advanced_features')
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to get top learning patterns
CREATE OR REPLACE FUNCTION get_top_learning_patterns(days_back INTEGER DEFAULT 30, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    pattern_name VARCHAR,
    total_frequency INTEGER,
    avg_confidence DECIMAL,
    affected_features JSONB,
    recommended_actions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lp.pattern_name,
        SUM(lp.frequency)::INTEGER as total_frequency,
        AVG(lp.confidence) as avg_confidence,
        jsonb_agg(DISTINCT lp.feature_context) as affected_features,
        jsonb_agg(DISTINCT lp.action_recommendations) as recommended_actions
    FROM learning_patterns lp
    JOIN continuous_learning_sessions cls ON lp.session_id = cls.id
    WHERE cls.created_at > NOW() - INTERVAL concat(days_back, ' days')
    GROUP BY lp.pattern_name
    ORDER BY total_frequency DESC, avg_confidence DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze model improvement trends
CREATE OR REPLACE FUNCTION analyze_model_improvement_trends(model VARCHAR DEFAULT NULL)
RETURNS TABLE (
    model_name VARCHAR,
    total_improvements INTEGER,
    avg_improvement DECIMAL,
    trend_direction VARCHAR,
    latest_performance DECIMAL,
    recommendation VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mih.model_name,
        COUNT(*)::INTEGER as total_improvements,
        AVG(mih.new_metric - mih.old_metric) as avg_improvement,
        CASE 
            WHEN AVG(mih.new_metric - mih.old_metric) > 0.01 THEN 'improving'
            WHEN AVG(mih.new_metric - mih.old_metric) < -0.01 THEN 'declining'
            ELSE 'stable'
        END as trend_direction,
        (ARRAY_AGG(mih.new_metric ORDER BY mih.created_at DESC))[1] as latest_performance,
        CASE 
            WHEN AVG(mih.new_metric - mih.old_metric) > 0.02 THEN 'continue_current_approach'
            WHEN AVG(mih.new_metric - mih.old_metric) BETWEEN 0.01 AND 0.02 THEN 'optimize_further'
            WHEN AVG(mih.new_metric - mih.old_metric) BETWEEN -0.01 AND 0.01 THEN 'investigate_stagnation'
            ELSE 'urgent_intervention_needed'
        END as recommendation
    FROM model_improvement_history mih
    JOIN continuous_learning_sessions cls ON mih.session_id = cls.id
    WHERE cls.created_at > NOW() - INTERVAL '30 days'
      AND (model IS NULL OR mih.model_name = model)
    GROUP BY mih.model_name
    ORDER BY avg_improvement DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user preferences timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_preferences_timestamp
    BEFORE UPDATE ON user_ai_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_timestamp();

-- Trigger to update feature usage patterns
CREATE OR REPLACE FUNCTION update_feature_usage_patterns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    
    -- Recalculate pattern confidence based on data recency and volume
    NEW.pattern_confidence := LEAST(
        (EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 86400.0) * 0.1 + -- Recency factor
        LEAST(NEW.usage_frequency / 10.0, 0.5) + -- Frequency factor
        NEW.success_rate * 0.3 + -- Success factor
        LEAST(NEW.avg_satisfaction / 5.0, 0.2), -- Satisfaction factor
        1.0
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_usage_patterns
    BEFORE UPDATE ON feature_usage_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_usage_patterns();

-- Views for monitoring and analytics

-- Real-time learning effectiveness view
CREATE OR REPLACE VIEW v_learning_effectiveness_realtime AS
SELECT 
    cls.created_at as session_date,
    cls.patterns_identified,
    cls.improvements_made,
    cls.confidence_avg,
    cls.feedback_samples_analyzed,
    cls.users_affected,
    CASE 
        WHEN cls.improvements_made > 0 AND cls.confidence_avg > 0.7 THEN 'highly_effective'
        WHEN cls.improvements_made > 0 OR cls.confidence_avg > 0.5 THEN 'moderately_effective'
        ELSE 'low_effectiveness'
    END as effectiveness_level
FROM continuous_learning_sessions cls
WHERE cls.created_at > NOW() - INTERVAL '24 hours'
ORDER BY cls.created_at DESC;

-- User personalization status view
CREATE OR REPLACE VIEW v_user_personalization_status AS
SELECT 
    uap.user_id,
    uap.communication_style,
    uap.risk_tolerance,
    uap.personalization_score,
    jsonb_array_length(uap.learning_history) as learning_events_count,
    EXTRACT(EPOCH FROM (NOW() - uap.updated_at)) / 3600 as hours_since_update,
    CASE 
        WHEN uap.personalization_score > 0.8 THEN 'highly_personalized'
        WHEN uap.personalization_score > 0.5 THEN 'moderately_personalized'
        WHEN uap.personalization_score > 0.2 THEN 'lightly_personalized'
        ELSE 'not_personalized'
    END as personalization_level
FROM user_ai_preferences uap
ORDER BY uap.personalization_score DESC;

-- Model performance trends view
CREATE OR REPLACE VIEW v_model_performance_trends AS
SELECT 
    mih.model_name,
    COUNT(*) as total_improvements,
    AVG(mih.new_metric - mih.old_metric) as avg_improvement_delta,
    MAX(mih.new_metric) as peak_performance,
    MIN(mih.old_metric) as baseline_performance,
    MAX(mih.created_at) as last_improvement_date,
    CASE 
        WHEN AVG(mih.new_metric - mih.old_metric) > 0.05 THEN 'excellent'
        WHEN AVG(mih.new_metric - mih.old_metric) > 0.02 THEN 'good'
        WHEN AVG(mih.new_metric - mih.old_metric) > 0.01 THEN 'fair'
        ELSE 'needs_attention'
    END as improvement_grade
FROM model_improvement_history mih
WHERE mih.created_at > NOW() - INTERVAL '90 days'
GROUP BY mih.model_name
ORDER BY avg_improvement_delta DESC;

COMMENT ON TABLE user_ai_preferences IS 'User personalization preferences and learning history';
COMMENT ON TABLE continuous_learning_sessions IS 'Tracking of continuous learning analysis sessions';
COMMENT ON TABLE learning_patterns IS 'Patterns identified during learning analysis';
COMMENT ON TABLE ai_model_improvements IS 'Individual AI model improvements and their results';
COMMENT ON TABLE model_improvement_history IS 'Historical tracking of model improvements by session';
COMMENT ON TABLE system_parameter_updates IS 'System parameter adjustments based on learning';
COMMENT ON TABLE user_feedback_analysis IS 'Aggregated analysis of user feedback by feature';
COMMENT ON TABLE model_ab_tests IS 'A/B testing framework for model improvements';
COMMENT ON TABLE ab_test_user_assignments IS 'User assignments for A/B tests';
COMMENT ON TABLE ab_test_results IS 'Results tracking for A/B tests';
COMMENT ON TABLE feature_usage_patterns IS 'User-specific feature usage patterns for personalization';
COMMENT ON TABLE personalization_effectiveness IS 'Measurement of personalization effectiveness per user';
COMMENT ON TABLE learning_algorithm_performance IS 'Performance metrics for learning algorithms';