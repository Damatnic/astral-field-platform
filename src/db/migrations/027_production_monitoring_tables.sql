-- Production monitoring tables for comprehensive system and user metrics tracking

-- System performance metrics tracking
CREATE TABLE IF NOT EXISTS production_system_metrics (
    id SERIAL PRIMARY KEY,
    response_time DECIMAL(10,2) NOT NULL DEFAULT 0, -- Average response time in ms
    throughput DECIMAL(10,2) NOT NULL DEFAULT 0, -- Requests per second
    error_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- Error rate as decimal (0.05 = 5%)
    active_users INTEGER NOT NULL DEFAULT 0, -- Currently active users
    ai_accuracy_scores JSONB NOT NULL DEFAULT '{}', -- AI service accuracy scores
    cpu_usage DECIMAL(5,2) NOT NULL DEFAULT 0, -- CPU usage percentage
    memory_usage DECIMAL(5,2) NOT NULL DEFAULT 0, -- Memory usage percentage
    database_usage DECIMAL(5,2) NOT NULL DEFAULT 0, -- Database usage percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User engagement and feature usage metrics
CREATE TABLE IF NOT EXISTS production_user_engagement_metrics (
    id SERIAL PRIMARY KEY,
    total_active_users INTEGER NOT NULL DEFAULT 0,
    ai_feature_usage JSONB NOT NULL DEFAULT '{}', -- Feature name to usage count mapping
    user_satisfaction_ratings JSONB NOT NULL DEFAULT '{}', -- Feature to average rating mapping
    feature_adoption_rates JSONB NOT NULL DEFAULT '{}', -- Feature to adoption rate mapping
    average_session_duration DECIMAL(10,2) NOT NULL DEFAULT 0, -- In seconds
    bounce_rate DECIMAL(5,4) NOT NULL DEFAULT 0, -- As decimal percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI service performance metrics tracking
CREATE TABLE IF NOT EXISTS production_ai_performance_metrics (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    average_response_time DECIMAL(10,2) NOT NULL DEFAULT 0, -- In milliseconds
    accuracy_score DECIMAL(5,4) NOT NULL DEFAULT 0, -- As decimal (0.85 = 85%)
    cost_per_request DECIMAL(8,4) NOT NULL DEFAULT 0, -- In dollars
    error_types JSONB NOT NULL DEFAULT '{}', -- Error type to count mapping
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert and notification tracking
CREATE TABLE IF NOT EXISTS production_alerts (
    id SERIAL PRIMARY KEY,
    rule_id VARCHAR(100) NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    metric VARCHAR(100) NOT NULL,
    current_value DECIMAL(15,6) NOT NULL,
    threshold DECIMAL(15,6) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    notification_channels JSONB NOT NULL DEFAULT '[]',
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- User feedback and satisfaction tracking
CREATE TABLE IF NOT EXISTS user_feedback_ratings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    feature_name VARCHAR(100) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI feature usage detailed logging
CREATE TABLE IF NOT EXISTS ai_feature_usage_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    feature_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    response_time_ms INTEGER,
    session_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User session tracking for engagement analysis
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    user_id VARCHAR(50),
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    session_duration INTEGER, -- In seconds, calculated on session end
    pages_visited INTEGER DEFAULT 0,
    ai_interactions INTEGER DEFAULT 0,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity logs for engagement tracking
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health status tracking
CREATE TABLE IF NOT EXISTS system_health_status (
    id SERIAL PRIMARY KEY,
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('healthy', 'warning', 'critical')),
    component_statuses JSONB NOT NULL DEFAULT '{}', -- Component to status mapping
    active_alerts INTEGER NOT NULL DEFAULT 0,
    last_health_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uptime_percentage DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance optimization recommendations tracking
CREATE TABLE IF NOT EXISTS performance_optimization_history (
    id SERIAL PRIMARY KEY,
    recommendation_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    implementation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (implementation_status IN ('pending', 'in_progress', 'completed', 'rejected')),
    expected_improvement TEXT,
    actual_improvement TEXT,
    implementation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_production_system_metrics_created_at 
ON production_system_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_production_user_engagement_created_at 
ON production_user_engagement_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_production_ai_performance_service_time 
ON production_ai_performance_metrics(service_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_production_alerts_severity_created 
ON production_alerts(severity, created_at DESC) WHERE resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_feedback_ratings_feature_created 
ON user_feedback_ratings(feature_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feature_usage_user_feature_created 
ON ai_feature_usage_logs(user_id, feature_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_start 
ON user_sessions(user_id, session_start DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_created 
ON user_activity_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_created 
ON system_health_status(created_at DESC);

-- Functions for automated metric calculations

-- Function to calculate system health status
CREATE OR REPLACE FUNCTION calculate_system_health()
RETURNS TABLE (
    status VARCHAR(20),
    metrics JSONB,
    active_alerts INTEGER
) AS $$
DECLARE
    latest_metrics RECORD;
    alert_count INTEGER;
    health_status VARCHAR(20) := 'healthy';
BEGIN
    -- Get latest system metrics
    SELECT * INTO latest_metrics
    FROM production_system_metrics
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get active alerts count
    SELECT COUNT(*) INTO alert_count
    FROM production_alerts
    WHERE created_at > NOW() - INTERVAL '1 hour'
      AND resolved = FALSE;
    
    -- Determine health status
    IF latest_metrics IS NULL THEN
        health_status := 'critical';
    ELSIF latest_metrics.error_rate > 0.1 OR latest_metrics.response_time > 2000 THEN
        health_status := 'critical';
    ELSIF latest_metrics.error_rate > 0.05 OR latest_metrics.response_time > 1000 OR alert_count > 0 THEN
        health_status := 'warning';
    END IF;
    
    RETURN QUERY SELECT 
        health_status,
        CASE 
            WHEN latest_metrics IS NOT NULL THEN
                jsonb_build_object(
                    'response_time', latest_metrics.response_time,
                    'throughput', latest_metrics.throughput,
                    'error_rate', latest_metrics.error_rate,
                    'active_users', latest_metrics.active_users,
                    'cpu_usage', latest_metrics.cpu_usage,
                    'memory_usage', latest_metrics.memory_usage
                )
            ELSE '{}'::jsonb
        END,
        alert_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user engagement trends
CREATE OR REPLACE FUNCTION calculate_engagement_trends(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    current_active_users INTEGER,
    previous_active_users INTEGER,
    engagement_trend VARCHAR(20),
    top_features JSONB
) AS $$
DECLARE
    current_users INTEGER;
    previous_users INTEGER;
    trend VARCHAR(20) := 'stable';
    features_json JSONB;
BEGIN
    -- Get current period active users
    SELECT total_active_users INTO current_users
    FROM production_user_engagement_metrics
    WHERE created_at > NOW() - INTERVAL concat(days_back, ' days')
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get previous period active users
    SELECT total_active_users INTO previous_users
    FROM production_user_engagement_metrics
    WHERE created_at BETWEEN NOW() - INTERVAL concat(days_back * 2, ' days') 
                         AND NOW() - INTERVAL concat(days_back, ' days')
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Calculate trend
    IF current_users > previous_users * 1.1 THEN
        trend := 'up';
    ELSIF current_users < previous_users * 0.9 THEN
        trend := 'down';
    END IF;
    
    -- Get top features from latest metrics
    SELECT ai_feature_usage INTO features_json
    FROM production_user_engagement_metrics
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN QUERY SELECT 
        COALESCE(current_users, 0),
        COALESCE(previous_users, 0),
        trend,
        COALESCE(features_json, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to get AI service performance summary
CREATE OR REPLACE FUNCTION get_ai_performance_summary(service VARCHAR DEFAULT NULL)
RETURNS TABLE (
    service_name VARCHAR,
    avg_response_time DECIMAL,
    success_rate DECIMAL,
    accuracy_score DECIMAL,
    total_requests INTEGER,
    cost_efficiency DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        papm.service_name,
        AVG(papm.average_response_time) as avg_response_time,
        CASE 
            WHEN SUM(papm.total_requests) > 0 
            THEN SUM(papm.successful_requests)::DECIMAL / SUM(papm.total_requests)
            ELSE 0 
        END as success_rate,
        AVG(papm.accuracy_score) as accuracy_score,
        SUM(papm.total_requests)::INTEGER as total_requests,
        CASE 
            WHEN AVG(papm.cost_per_request) > 0 
            THEN AVG(papm.accuracy_score) / AVG(papm.cost_per_request)
            ELSE 0 
        END as cost_efficiency
    FROM production_ai_performance_metrics papm
    WHERE (service IS NULL OR papm.service_name = service)
      AND papm.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY papm.service_name
    ORDER BY cost_efficiency DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session duration when session ends
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_end IS NOT NULL AND OLD.session_end IS NULL THEN
        NEW.session_duration := EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start));
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_duration
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_duration();

-- Trigger to automatically resolve old alerts
CREATE OR REPLACE FUNCTION auto_resolve_old_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-resolve alerts older than 24 hours for non-critical issues
    UPDATE production_alerts 
    SET resolved = TRUE, resolved_at = NOW()
    WHERE created_at < NOW() - INTERVAL '24 hours'
      AND severity IN ('low', 'medium')
      AND resolved = FALSE;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the auto-resolve function periodically
CREATE TRIGGER trigger_auto_resolve_alerts
    AFTER INSERT ON production_alerts
    FOR EACH STATEMENT
    EXECUTE FUNCTION auto_resolve_old_alerts();

-- Create views for common monitoring queries

-- Real-time system health view
CREATE OR REPLACE VIEW v_system_health_realtime AS
SELECT 
    psm.*,
    CASE 
        WHEN psm.error_rate > 0.1 OR psm.response_time > 2000 THEN 'critical'
        WHEN psm.error_rate > 0.05 OR psm.response_time > 1000 THEN 'warning'
        ELSE 'healthy'
    END as health_status,
    (SELECT COUNT(*) FROM production_alerts 
     WHERE created_at > NOW() - INTERVAL '1 hour' AND resolved = FALSE) as active_alerts
FROM production_system_metrics psm
WHERE psm.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY psm.created_at DESC;

-- User engagement summary view
CREATE OR REPLACE VIEW v_user_engagement_summary AS
SELECT 
    puem.*,
    CASE 
        WHEN puem.bounce_rate > 0.7 THEN 'poor'
        WHEN puem.bounce_rate > 0.5 THEN 'average'
        ELSE 'good'
    END as engagement_quality,
    CASE 
        WHEN puem.average_session_duration > 600 THEN 'high'
        WHEN puem.average_session_duration > 300 THEN 'medium'
        ELSE 'low'
    END as session_engagement
FROM production_user_engagement_metrics puem
WHERE puem.created_at > NOW() - INTERVAL '1 hour'
ORDER BY puem.created_at DESC;

-- AI performance dashboard view
CREATE OR REPLACE VIEW v_ai_performance_dashboard AS
SELECT 
    service_name,
    AVG(average_response_time) as avg_response_time,
    SUM(total_requests) as total_requests,
    CASE 
        WHEN SUM(total_requests) > 0 
        THEN SUM(successful_requests)::DECIMAL / SUM(total_requests)
        ELSE 0 
    END as success_rate,
    AVG(accuracy_score) as avg_accuracy,
    SUM(total_requests * cost_per_request) as total_cost,
    COUNT(*) as metric_count
FROM production_ai_performance_metrics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY service_name
ORDER BY avg_accuracy DESC;

COMMENT ON TABLE production_system_metrics IS 'System-wide performance metrics including response time, throughput, and resource usage';
COMMENT ON TABLE production_user_engagement_metrics IS 'User engagement metrics including feature usage, satisfaction ratings, and session data';
COMMENT ON TABLE production_ai_performance_metrics IS 'AI service performance metrics including accuracy, cost, and error tracking';
COMMENT ON TABLE production_alerts IS 'System alerts and notifications with acknowledgment tracking';
COMMENT ON TABLE user_feedback_ratings IS 'User feedback and satisfaction ratings for AI features';
COMMENT ON TABLE ai_feature_usage_logs IS 'Detailed logging of AI feature usage by users';
COMMENT ON TABLE user_sessions IS 'User session tracking for engagement analysis';
COMMENT ON TABLE user_activity_logs IS 'General user activity logging for behavioral analysis';
COMMENT ON TABLE system_health_status IS 'Overall system health status tracking';
COMMENT ON TABLE performance_optimization_history IS 'History of performance optimization recommendations and implementations';