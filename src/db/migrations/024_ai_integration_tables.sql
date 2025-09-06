-- AI Systems Integration Tables
-- Migration: 024_ai_integration_tables.sql

-- System health checks table to monitor AI service health
CREATE TABLE IF NOT EXISTS system_health_checks (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'critical', 'offline')),
    latency_ms INTEGER,
    error_rate DECIMAL(5,4) DEFAULT 0 CHECK (error_rate >= 0 AND error_rate <= 1),
    details TEXT,
    checked_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI workflow executions table to track complex AI operations
CREATE TABLE IF NOT EXISTS ai_workflow_executions (
    workflow_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
    league_id VARCHAR(255) NOT NULL REFERENCES leagues(id),
    workflow_type VARCHAR(50) NOT NULL CHECK (workflow_type IN (
        'recommendation_generation', 'trade_analysis', 'lineup_optimization', 
        'draft_assistance', 'season_planning', 'injury_analysis', 'waiver_planning'
    )),
    steps JSONB NOT NULL DEFAULT '[]',
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Service dependencies table for integration mapping
CREATE TABLE IF NOT EXISTS service_dependencies (
    id SERIAL PRIMARY KEY,
    service_id VARCHAR(100) NOT NULL,
    depends_on VARCHAR(100) NOT NULL,
    dependency_type VARCHAR(50) DEFAULT 'required' CHECK (dependency_type IN ('required', 'optional', 'fallback')),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(service_id, depends_on)
);

-- AI system metrics for performance monitoring
CREATE TABLE IF NOT EXISTS ai_system_metrics (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(12,4) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Circuit breaker states for fault tolerance
CREATE TABLE IF NOT EXISTS circuit_breaker_states (
    service_name VARCHAR(100) PRIMARY KEY,
    state VARCHAR(20) NOT NULL CHECK (state IN ('closed', 'open', 'half_open')),
    failure_count INTEGER DEFAULT 0,
    last_failure_at TIMESTAMP,
    next_attempt_at TIMESTAMP,
    success_threshold INTEGER DEFAULT 3,
    failure_threshold INTEGER DEFAULT 5,
    timeout_duration INTEGER DEFAULT 60000, -- milliseconds
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI cache entries for performance optimization
CREATE TABLE IF NOT EXISTS ai_cache_entries (
    cache_key VARCHAR(500) PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    cache_value JSONB NOT NULL,
    ttl_seconds INTEGER DEFAULT 3600,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour',
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT NOW()
);

-- Service integration events for audit trail
CREATE TABLE IF NOT EXISTS service_integration_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'service_start', 'service_stop', 'dependency_change', 'health_change'
    service_name VARCHAR(100) NOT NULL,
    event_data JSONB,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP DEFAULT NOW(),
    user_id VARCHAR(255) REFERENCES users(id)
);

-- Workflow step templates for reusable workflow definitions
CREATE TABLE IF NOT EXISTS workflow_step_templates (
    id SERIAL PRIMARY KEY,
    workflow_type VARCHAR(50) NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    method_name VARCHAR(100) NOT NULL,
    parameters_template JSONB DEFAULT '{}',
    is_critical BOOLEAN DEFAULT true,
    timeout_ms INTEGER DEFAULT 30000,
    retry_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workflow_type, step_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_service_time 
ON system_health_checks(service_name, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_status 
ON system_health_checks(status, checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_league 
ON ai_workflow_executions(user_id, league_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_type_status 
ON ai_workflow_executions(workflow_type, overall_status);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at 
ON ai_workflow_executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_dependencies_service 
ON service_dependencies(service_id);

CREATE INDEX IF NOT EXISTS idx_ai_system_metrics_service_time 
ON ai_system_metrics(service_name, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cache_expires 
ON ai_cache_entries(expires_at);

CREATE INDEX IF NOT EXISTS idx_ai_cache_service 
ON ai_cache_entries(service_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_events_service_time 
ON service_integration_events(service_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integration_events_type_severity 
ON service_integration_events(event_type, severity, created_at DESC);

-- Insert default service dependencies
INSERT INTO service_dependencies (service_id, depends_on, dependency_type, priority) VALUES
('oracle', 'aiRouter', 'required', 1),
('oracle', 'mlPipeline', 'optional', 2),
('mlPipeline', 'aiRouter', 'required', 1),
('gameMonitor', 'mlPipeline', 'required', 1),
('gameMonitor', 'oracle', 'optional', 2),
('userBehavior', 'aiRouter', 'required', 1),
('userBehavior', 'performanceAttribution', 'optional', 2),
('tradeAnalysis', 'oracle', 'required', 1),
('tradeAnalysis', 'mlPipeline', 'required', 2),
('tradeAnalysis', 'userBehavior', 'optional', 3),
('intelligentWaiver', 'oracle', 'required', 1),
('intelligentWaiver', 'mlPipeline', 'required', 2),
('autoDraft', 'oracle', 'required', 1),
('autoDraft', 'mlPipeline', 'required', 2),
('predictiveAnalytics', 'mlPipeline', 'required', 1),
('predictiveAnalytics', 'oracle', 'optional', 2),
('comparativeAnalysis', 'predictiveAnalytics', 'required', 1),
('seasonStrategy', 'predictiveAnalytics', 'required', 1),
('seasonStrategy', 'oracle', 'optional', 2)
ON CONFLICT (service_id, depends_on) DO NOTHING;

-- Insert default workflow step templates
INSERT INTO workflow_step_templates (workflow_type, step_name, step_order, service_name, method_name, parameters_template, is_critical, timeout_ms) VALUES
('recommendation_generation', 'Analyze User Preferences', 1, 'userBehavior', 'analyzeUserPreferences', '{"include_recent": true}', true, 15000),
('recommendation_generation', 'Generate ML Predictions', 2, 'mlPipeline', 'generatePlayerPredictions', '{"weeks_ahead": 1}', true, 30000),
('recommendation_generation', 'Get Oracle Insights', 3, 'oracle', 'generateRecommendations', '{"depth": "comprehensive"}', false, 20000),
('recommendation_generation', 'Scan Trade Opportunities', 4, 'tradeAnalysis', 'scanTradeOpportunities', '{"max_results": 10}', false, 25000),

('trade_analysis', 'Evaluate Trade Proposal', 1, 'tradeAnalysis', 'evaluateTradeProposal', '{}', true, 20000),
('trade_analysis', 'Predict Trade Impact', 2, 'mlPipeline', 'predictTradeImpact', '{}', true, 25000),
('trade_analysis', 'Calculate Fairness Score', 3, 'tradeAnalysis', 'calculateFairnessScore', '{}', false, 15000),
('trade_analysis', 'Generate Counter Offers', 4, 'tradeAnalysis', 'generateCounterOffers', '{"max_offers": 5}', false, 30000),

('lineup_optimization', 'Generate Weekly Predictions', 1, 'mlPipeline', 'generateWeeklyPredictions', '{}', true, 30000),
('lineup_optimization', 'Analyze Weekly Matchups', 2, 'oracle', 'analyzeWeeklyMatchups', '{}', true, 20000),
('lineup_optimization', 'Generate Optimal Lineup', 3, 'oracle', 'generateOptimalLineup', '{}', true, 15000),
('lineup_optimization', 'Assess Risk Tolerance', 4, 'userBehavior', 'assessRiskTolerance', '{}', false, 10000),

('draft_assistance', 'Analyze Draft State', 1, 'autoDraft', 'analyzeDraftState', '{}', true, 15000),
('draft_assistance', 'Calculate Player Values', 2, 'mlPipeline', 'calculatePlayerValues', '{}', true, 25000),
('draft_assistance', 'Recommend Draft Strategy', 3, 'autoDraft', 'recommendDraftStrategy', '{}', true, 20000),
('draft_assistance', 'Identify Position Targets', 4, 'autoDraft', 'identifyPositionTargets', '{}', false, 15000),

('season_planning', 'Analyze Team Construction', 1, 'seasonStrategy', 'analyzeTeamConstruction', '{}', true, 20000),
('season_planning', 'Generate Playoff Projections', 2, 'seasonStrategy', 'generatePlayoffProjections', '{}', true, 25000),
('season_planning', 'Create Phase Strategies', 3, 'seasonStrategy', 'generatePhaseStrategies', '{}', false, 30000),
('season_planning', 'Analyze Decision Patterns', 4, 'performanceAttribution', 'analyzeDecisionPatterns', '{}', false, 15000)
ON CONFLICT DO NOTHING;

-- Initialize circuit breaker states for all services
INSERT INTO circuit_breaker_states (service_name, state, failure_threshold, success_threshold) VALUES
('aiRouter', 'closed', 3, 2),
('oracle', 'closed', 5, 3),
('mlPipeline', 'closed', 3, 2),
('gameMonitor', 'closed', 5, 3),
('userBehavior', 'closed', 5, 3),
('tradeAnalysis', 'closed', 5, 3),
('intelligentWaiver', 'closed', 7, 3),
('autoDraft', 'closed', 5, 3),
('predictiveAnalytics', 'closed', 7, 3),
('comparativeAnalysis', 'closed', 10, 2),
('seasonStrategy', 'closed', 7, 3),
('performanceAttribution', 'closed', 10, 2)
ON CONFLICT DO NOTHING;

-- Functions for AI system integration

-- Function to get service health summary
CREATE OR REPLACE FUNCTION get_service_health_summary(
    hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    service_name VARCHAR(100),
    current_status VARCHAR(20),
    avg_latency DECIMAL,
    error_rate DECIMAL,
    uptime_percentage DECIMAL,
    last_check TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_checks AS (
        SELECT 
            shc.service_name,
            shc.status,
            shc.latency_ms,
            shc.checked_at,
            ROW_NUMBER() OVER (PARTITION BY shc.service_name ORDER BY shc.checked_at DESC) as rn
        FROM system_health_checks shc
        WHERE shc.checked_at >= NOW() - INTERVAL '1 hour' * hours_back
    ),
    service_stats AS (
        SELECT 
            rc.service_name,
            MAX(CASE WHEN rc.rn = 1 THEN rc.status END) as current_status,
            AVG(rc.latency_ms) as avg_latency,
            COUNT(CASE WHEN rc.status IN ('degraded', 'critical', 'offline') THEN 1 END)::DECIMAL / COUNT(*) as error_rate,
            COUNT(CASE WHEN rc.status = 'healthy' THEN 1 END)::DECIMAL / COUNT(*) as uptime_percentage,
            MAX(CASE WHEN rc.rn = 1 THEN rc.checked_at END) as last_check
        FROM recent_checks rc
        GROUP BY rc.service_name
    )
    SELECT 
        ss.service_name::VARCHAR(100),
        ss.current_status::VARCHAR(20),
        ROUND(ss.avg_latency, 2) as avg_latency,
        ROUND(ss.error_rate, 4) as error_rate,
        ROUND(ss.uptime_percentage * 100, 2) as uptime_percentage,
        ss.last_check
    FROM service_stats ss
    ORDER BY ss.service_name;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old AI cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_cache_entries WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup event
    INSERT INTO service_integration_events (event_type, service_name, event_data, severity)
    VALUES ('cache_cleanup', 'system', json_build_object('deleted_entries', deleted_count), 'info');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update circuit breaker state
CREATE OR REPLACE FUNCTION update_circuit_breaker_state(
    p_service_name VARCHAR(100),
    p_is_success BOOLEAN
)
RETURNS VARCHAR(20) AS $$
DECLARE
    current_state RECORD;
    new_state VARCHAR(20);
BEGIN
    SELECT * INTO current_state FROM circuit_breaker_states WHERE service_name = p_service_name;
    
    IF NOT FOUND THEN
        INSERT INTO circuit_breaker_states (service_name) VALUES (p_service_name);
        SELECT * INTO current_state FROM circuit_breaker_states WHERE service_name = p_service_name;
    END IF;
    
    IF p_is_success THEN
        -- Success case
        IF current_state.state = 'half_open' THEN
            -- If in half-open and success, move to closed
            new_state := 'closed';
            UPDATE circuit_breaker_states 
            SET state = new_state, failure_count = 0, next_attempt_at = NULL, updated_at = NOW()
            WHERE service_name = p_service_name;
        ELSIF current_state.state = 'open' THEN
            -- Stay open, success doesn't matter when fully open
            new_state := current_state.state;
        ELSE
            -- Reset failure count on success
            new_state := 'closed';
            UPDATE circuit_breaker_states 
            SET failure_count = 0, updated_at = NOW()
            WHERE service_name = p_service_name;
        END IF;
    ELSE
        -- Failure case
        IF current_state.state = 'closed' THEN
            IF current_state.failure_count + 1 >= current_state.failure_threshold THEN
                new_state := 'open';
                UPDATE circuit_breaker_states 
                SET 
                    state = new_state,
                    failure_count = current_state.failure_count + 1,
                    last_failure_at = NOW(),
                    next_attempt_at = NOW() + INTERVAL '1 millisecond' * current_state.timeout_duration,
                    updated_at = NOW()
                WHERE service_name = p_service_name;
            ELSE
                new_state := 'closed';
                UPDATE circuit_breaker_states 
                SET failure_count = current_state.failure_count + 1, last_failure_at = NOW(), updated_at = NOW()
                WHERE service_name = p_service_name;
            END IF;
        ELSIF current_state.state = 'half_open' THEN
            -- Failure in half-open, go back to open
            new_state := 'open';
            UPDATE circuit_breaker_states 
            SET 
                state = new_state,
                failure_count = current_state.failure_count + 1,
                last_failure_at = NOW(),
                next_attempt_at = NOW() + INTERVAL '1 millisecond' * current_state.timeout_duration,
                updated_at = NOW()
            WHERE service_name = p_service_name;
        ELSE
            -- Already open, check if we can try half-open
            IF NOW() >= current_state.next_attempt_at THEN
                new_state := 'half_open';
                UPDATE circuit_breaker_states 
                SET state = new_state, updated_at = NOW()
                WHERE service_name = p_service_name;
            ELSE
                new_state := 'open';
            END IF;
        END IF;
    END IF;
    
    RETURN new_state;
END;
$$ LANGUAGE plpgsql;

-- Function to get workflow execution statistics
CREATE OR REPLACE FUNCTION get_workflow_stats(
    days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    workflow_type VARCHAR(50),
    total_executions BIGINT,
    successful_executions BIGINT,
    failed_executions BIGINT,
    success_rate DECIMAL,
    avg_execution_time_ms DECIMAL,
    last_execution TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        awe.workflow_type::VARCHAR(50),
        COUNT(*) as total_executions,
        COUNT(CASE WHEN awe.overall_status = 'completed' THEN 1 END) as successful_executions,
        COUNT(CASE WHEN awe.overall_status = 'failed' THEN 1 END) as failed_executions,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(COUNT(CASE WHEN awe.overall_status = 'completed' THEN 1 END)::DECIMAL / COUNT(*) * 100, 2)
            ELSE 0 
        END as success_rate,
        ROUND(AVG(awe.execution_time_ms), 2) as avg_execution_time_ms,
        MAX(awe.created_at) as last_execution
    FROM ai_workflow_executions awe
    WHERE awe.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY awe.workflow_type
    ORDER BY total_executions DESC;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic maintenance

-- Trigger to calculate execution time on workflow completion
CREATE OR REPLACE FUNCTION calculate_workflow_execution_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        NEW.execution_time_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.created_at)) * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_execution_time ON ai_workflow_executions;
CREATE TRIGGER trigger_calculate_execution_time
    BEFORE UPDATE ON ai_workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_workflow_execution_time();

-- Trigger to update cache hit count and last accessed
CREATE OR REPLACE FUNCTION update_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_cache_entries 
    SET hit_count = hit_count + 1, last_accessed = NOW()
    WHERE cache_key = NEW.cache_key;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup job for old data (would be run by cron or scheduled job)
-- Clean up old health checks (keep 30 days)
-- Clean up old workflow executions (keep 90 days)  
-- Clean up old integration events (keep 60 days)
-- Clean up expired cache entries

-- View for system dashboard
CREATE OR REPLACE VIEW ai_system_dashboard_view AS
SELECT 
    (SELECT COUNT(*) FROM system_health_checks WHERE checked_at >= NOW() - INTERVAL '1 hour') as recent_health_checks,
    (SELECT COUNT(DISTINCT service_name) FROM system_health_checks WHERE status = 'healthy' AND checked_at >= NOW() - INTERVAL '1 hour') as healthy_services,
    (SELECT COUNT(*) FROM ai_workflow_executions WHERE created_at >= NOW() - INTERVAL '24 hours') as workflows_24h,
    (SELECT COUNT(*) FROM ai_workflow_executions WHERE overall_status = 'completed' AND created_at >= NOW() - INTERVAL '24 hours') as successful_workflows_24h,
    (SELECT COUNT(*) FROM ai_cache_entries WHERE expires_at > NOW()) as active_cache_entries,
    (SELECT COUNT(*) FROM circuit_breaker_states WHERE state != 'closed') as services_with_issues,
    (SELECT AVG(latency_ms) FROM system_health_checks WHERE checked_at >= NOW() - INTERVAL '1 hour' AND latency_ms IS NOT NULL) as avg_system_latency;

-- Comments for documentation
COMMENT ON TABLE system_health_checks IS 'Health check results for all AI services in the system';
COMMENT ON TABLE ai_workflow_executions IS 'Execution logs for complex AI workflows with multiple steps';
COMMENT ON TABLE service_dependencies IS 'Dependency mapping between AI services for integration management';
COMMENT ON TABLE circuit_breaker_states IS 'Circuit breaker states for fault tolerance and service protection';
COMMENT ON TABLE ai_cache_entries IS 'Cached AI responses for performance optimization';
COMMENT ON TABLE service_integration_events IS 'Audit trail for AI system integration events and changes';
COMMENT ON TABLE workflow_step_templates IS 'Reusable templates for AI workflow step definitions';

COMMENT ON FUNCTION get_service_health_summary IS 'Returns health summary statistics for all AI services';
COMMENT ON FUNCTION cleanup_expired_cache IS 'Removes expired cache entries and logs cleanup activity';
COMMENT ON FUNCTION update_circuit_breaker_state IS 'Updates circuit breaker state based on service success/failure';
COMMENT ON FUNCTION get_workflow_stats IS 'Returns workflow execution statistics for monitoring and analysis';