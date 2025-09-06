-- Performance Optimization and Load Testing Tables
-- Migration: 026_performance_optimization_tables.sql

-- Performance load test results table
CREATE TABLE IF NOT EXISTS performance_load_tests (
    test_id VARCHAR(255) PRIMARY KEY,
    test_name VARCHAR(200) DEFAULT 'Comprehensive Load Test',
    total_endpoints INTEGER NOT NULL DEFAULT 0,
    average_response_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_requests INTEGER NOT NULL DEFAULT 0,
    overall_error_rate DECIMAL(5,4) DEFAULT 0 CHECK (overall_error_rate >= 0 AND overall_error_rate <= 1),
    system_throughput DECIMAL(10,2) DEFAULT 0, -- requests per second
    test_duration INTEGER DEFAULT 60000, -- milliseconds
    concurrent_users INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES users(id)
);

-- Individual endpoint performance results
CREATE TABLE IF NOT EXISTS performance_endpoint_results (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL REFERENCES performance_load_tests(test_id),
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) DEFAULT 'GET',
    service_name VARCHAR(100),
    concurrent_users INTEGER NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    average_response_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_response_time DECIMAL(10,2) DEFAULT 0,
    max_response_time DECIMAL(10,2) DEFAULT 0,
    p50_response_time DECIMAL(10,2),
    p95_response_time DECIMAL(10,2),
    p99_response_time DECIMAL(10,2),
    requests_per_second DECIMAL(10,2) DEFAULT 0,
    error_rate DECIMAL(5,4) DEFAULT 0 CHECK (error_rate >= 0 AND error_rate <= 1),
    bottlenecks JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    is_critical_path BOOLEAN DEFAULT false,
    expected_load VARCHAR(20) CHECK (expected_load IN ('low', 'medium', 'high')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- System bottlenecks identified during testing
CREATE TABLE IF NOT EXISTS performance_bottlenecks (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL REFERENCES performance_load_tests(test_id),
    component VARCHAR(100) NOT NULL,
    bottleneck_type VARCHAR(50) NOT NULL CHECK (bottleneck_type IN (
        'cpu', 'memory', 'database', 'network', 'external_api', 'cache', 'storage'
    )),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200),
    description TEXT,
    metrics JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    estimated_impact DECIMAL(5,2) DEFAULT 0, -- percentage impact on performance
    resolution_status VARCHAR(20) DEFAULT 'open' CHECK (resolution_status IN ('open', 'in_progress', 'resolved', 'deferred')),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance optimization suggestions
CREATE TABLE IF NOT EXISTS performance_optimization_suggestions (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL REFERENCES performance_load_tests(test_id),
    suggestion_type VARCHAR(50) NOT NULL CHECK (suggestion_type IN (
        'caching', 'database', 'api', 'memory', 'network', 'architecture', 'monitoring'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    expected_impact TEXT,
    implementation TEXT,
    estimated_effort VARCHAR(20) DEFAULT 'medium' CHECK (estimated_effort IN ('low', 'medium', 'high')),
    potential_savings JSONB DEFAULT '{}',
    implementation_status VARCHAR(20) DEFAULT 'pending' CHECK (implementation_status IN (
        'pending', 'in_progress', 'implemented', 'rejected', 'deferred'
    )),
    implemented_at TIMESTAMP,
    actual_impact TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES users(id)
);

-- Real-time performance metrics collection
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) DEFAULT 'GET',
    service_name VARCHAR(100),
    response_time DECIMAL(10,2) NOT NULL,
    status_code INTEGER,
    request_size INTEGER, -- bytes
    response_size INTEGER, -- bytes
    user_agent TEXT,
    client_ip INET,
    user_id VARCHAR(255) REFERENCES users(id),
    memory_usage DECIMAL(10,2), -- MB
    cpu_usage DECIMAL(5,2), -- percentage
    cache_hit BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance alerts and thresholds
CREATE TABLE IF NOT EXISTS performance_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'high_response_time', 'high_error_rate', 'low_throughput', 'resource_exhaustion'
    )),
    endpoint VARCHAR(500),
    service_name VARCHAR(100),
    threshold_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    alert_data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    acknowledged_by VARCHAR(255) REFERENCES users(id),
    resolved_by VARCHAR(255) REFERENCES users(id)
);

-- Performance improvement tracking
CREATE TABLE IF NOT EXISTS performance_improvements (
    id SERIAL PRIMARY KEY,
    improvement_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    baseline_metrics JSONB NOT NULL DEFAULT '{}',
    target_metrics JSONB NOT NULL DEFAULT '{}',
    actual_metrics JSONB DEFAULT '{}',
    implementation_date DATE DEFAULT CURRENT_DATE,
    measurement_period INTERVAL DEFAULT INTERVAL '7 days',
    improvement_percentage DECIMAL(5,2),
    cost_impact DECIMAL(10,2),
    resource_impact JSONB DEFAULT '{}',
    rollback_plan TEXT,
    success_criteria TEXT,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN (
        'planned', 'in_progress', 'measuring', 'successful', 'failed', 'rolled_back'
    )),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES users(id)
);

-- Performance baselines for comparison
CREATE TABLE IF NOT EXISTS performance_baselines (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(500) NOT NULL,
    service_name VARCHAR(100),
    baseline_type VARCHAR(50) DEFAULT 'weekly_average',
    average_response_time DECIMAL(10,2) NOT NULL,
    p95_response_time DECIMAL(10,2),
    p99_response_time DECIMAL(10,2),
    requests_per_second DECIMAL(10,2),
    error_rate DECIMAL(5,4),
    sample_size INTEGER NOT NULL DEFAULT 0,
    baseline_period INTERVAL DEFAULT INTERVAL '7 days',
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(endpoint, service_name, baseline_type, valid_from)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_load_tests_created_at 
ON performance_load_tests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_endpoint_results_test_endpoint 
ON performance_endpoint_results(test_id, endpoint);

CREATE INDEX IF NOT EXISTS idx_endpoint_results_response_time 
ON performance_endpoint_results(average_response_time DESC);

CREATE INDEX IF NOT EXISTS idx_endpoint_results_error_rate 
ON performance_endpoint_results(error_rate DESC);

CREATE INDEX IF NOT EXISTS idx_bottlenecks_severity_status 
ON performance_bottlenecks(severity, resolution_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_optimization_suggestions_priority_status 
ON performance_optimization_suggestions(priority, implementation_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint_time 
ON performance_metrics(endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_response_time 
ON performance_metrics(response_time DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_status_severity 
ON performance_alerts(status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_baselines_endpoint 
ON performance_baselines(endpoint, valid_from DESC);

-- Insert default performance thresholds
INSERT INTO performance_baselines (endpoint, service_name, average_response_time, p95_response_time, requests_per_second, error_rate) VALUES
('/api/ai/oracle', 'oracle', 2000, 4000, 5, 0.02),
('/api/ai/ml-predictions', 'mlPipeline', 3000, 6000, 3, 0.03),
('/api/trades/analysis', 'tradeAnalysis', 1500, 3000, 8, 0.01),
('/api/realtime/game-monitor', 'gameMonitor', 500, 1000, 20, 0.05),
('/api/waiver/intelligent', 'intelligentWaiver', 1000, 2000, 10, 0.01),
('/api/draft/auto-draft', 'autoDraft', 2500, 5000, 2, 0.02),
('/api/analytics/predictive-dashboard', 'predictiveAnalytics', 1200, 2500, 12, 0.01),
('/api/analytics/comparative-analysis', 'comparativeAnalysis', 800, 1500, 15, 0.005),
('/api/analytics/season-strategy', 'seasonStrategy', 1800, 3500, 6, 0.015),
('/api/analytics/performance-attribution', 'performanceAttribution', 600, 1200, 18, 0.005),
('/api/integration/ai-workflow', 'integration', 4000, 8000, 1, 0.04),
('/api/integration/system-health', 'integration', 300, 600, 25, 0.001)
ON CONFLICT (endpoint, service_name, baseline_type, valid_from) DO NOTHING;

-- Functions for performance optimization

-- Function to calculate performance trends
CREATE OR REPLACE FUNCTION calculate_performance_trend(
    p_endpoint VARCHAR(500),
    p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
    avg_response_time DECIMAL,
    trend_direction VARCHAR(20),
    trend_percentage DECIMAL,
    sample_count BIGINT
) AS $$
DECLARE
    recent_avg DECIMAL;
    older_avg DECIMAL;
    trend_pct DECIMAL;
    trend_dir VARCHAR(20);
BEGIN
    -- Get recent performance (last 3 days)
    SELECT AVG(response_time) INTO recent_avg
    FROM performance_metrics
    WHERE endpoint = p_endpoint
      AND created_at >= NOW() - INTERVAL '3 days';
    
    -- Get older performance (4-7 days ago)
    SELECT AVG(response_time) INTO older_avg
    FROM performance_metrics
    WHERE endpoint = p_endpoint
      AND created_at >= NOW() - INTERVAL '7 days'
      AND created_at < NOW() - INTERVAL '3 days';
    
    -- Calculate trend
    IF recent_avg IS NULL OR older_avg IS NULL OR older_avg = 0 THEN
        trend_pct := 0;
        trend_dir := 'stable';
    ELSE
        trend_pct := ((recent_avg - older_avg) / older_avg) * 100;
        IF trend_pct > 10 THEN
            trend_dir := 'degrading';
        ELSIF trend_pct < -10 THEN
            trend_dir := 'improving';
        ELSE
            trend_dir := 'stable';
        END IF;
    END IF;
    
    RETURN QUERY
    SELECT 
        COALESCE(recent_avg, 0) as avg_response_time,
        trend_dir as trend_direction,
        COALESCE(trend_pct, 0) as trend_percentage,
        (SELECT COUNT(*) FROM performance_metrics 
         WHERE endpoint = p_endpoint 
           AND created_at >= NOW() - INTERVAL '1 day' * p_days_back) as sample_count;
END;
$$ LANGUAGE plpgsql;

-- Function to detect performance anomalies
CREATE OR REPLACE FUNCTION detect_performance_anomalies(
    p_endpoint VARCHAR(500) DEFAULT NULL,
    p_threshold_multiplier DECIMAL DEFAULT 2.0
)
RETURNS TABLE (
    endpoint VARCHAR(500),
    current_avg_response DECIMAL,
    baseline_avg_response DECIMAL,
    anomaly_severity VARCHAR(20),
    anomaly_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_performance AS (
        SELECT 
            pm.endpoint,
            AVG(pm.response_time) as current_avg,
            COUNT(*) as sample_count
        FROM performance_metrics pm
        WHERE (p_endpoint IS NULL OR pm.endpoint = p_endpoint)
          AND pm.created_at >= NOW() - INTERVAL '1 hour'
        GROUP BY pm.endpoint
        HAVING COUNT(*) >= 10 -- Minimum sample size
    ),
    baseline_comparison AS (
        SELECT 
            rp.endpoint,
            rp.current_avg,
            pb.average_response_time as baseline_avg,
            CASE 
                WHEN rp.current_avg > pb.average_response_time * (p_threshold_multiplier * 2) THEN 'critical'
                WHEN rp.current_avg > pb.average_response_time * p_threshold_multiplier THEN 'high'
                WHEN rp.current_avg > pb.average_response_time * (p_threshold_multiplier * 0.7) THEN 'medium'
                ELSE 'normal'
            END as severity
        FROM recent_performance rp
        JOIN performance_baselines pb ON rp.endpoint = pb.endpoint
        WHERE pb.valid_from <= CURRENT_DATE 
          AND (pb.valid_until IS NULL OR pb.valid_until >= CURRENT_DATE)
    )
    SELECT 
        bc.endpoint::VARCHAR(500),
        bc.current_avg,
        bc.baseline_avg,
        bc.severity::VARCHAR(20),
        CASE bc.severity
            WHEN 'critical' THEN 'Response time is critically high - ' || ROUND((bc.current_avg - bc.baseline_avg), 0) || 'ms above baseline'
            WHEN 'high' THEN 'Response time is significantly elevated - ' || ROUND((bc.current_avg - bc.baseline_avg), 0) || 'ms above baseline'
            WHEN 'medium' THEN 'Response time is moderately elevated - ' || ROUND((bc.current_avg - bc.baseline_avg), 0) || 'ms above baseline'
            ELSE 'Performance within normal range'
        END::TEXT
    FROM baseline_comparison bc
    WHERE bc.severity != 'normal'
    ORDER BY 
        CASE bc.severity 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
        END,
        bc.current_avg DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to generate performance summary
CREATE OR REPLACE FUNCTION get_performance_summary(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    total_requests BIGINT,
    avg_response_time DECIMAL,
    p95_response_time DECIMAL,
    error_rate DECIMAL,
    slowest_endpoints JSONB,
    highest_error_endpoints JSONB,
    performance_alerts INTEGER
) AS $$
DECLARE
    slow_endpoints JSONB;
    error_endpoints JSONB;
BEGIN
    -- Get slowest endpoints
    SELECT json_agg(
        json_build_object(
            'endpoint', endpoint,
            'avg_response_time', ROUND(avg_response_time, 2),
            'request_count', request_count
        )
    ) INTO slow_endpoints
    FROM (
        SELECT 
            endpoint,
            AVG(response_time) as avg_response_time,
            COUNT(*) as request_count
        FROM performance_metrics
        WHERE created_at >= NOW() - INTERVAL '1 hour' * p_hours_back
        GROUP BY endpoint
        ORDER BY avg_response_time DESC
        LIMIT 5
    ) slow;
    
    -- Get highest error rate endpoints
    SELECT json_agg(
        json_build_object(
            'endpoint', endpoint,
            'error_rate', ROUND(error_rate * 100, 2),
            'total_requests', total_requests
        )
    ) INTO error_endpoints
    FROM (
        SELECT 
            endpoint,
            COUNT(CASE WHEN status_code >= 400 THEN 1 END)::DECIMAL / COUNT(*) as error_rate,
            COUNT(*) as total_requests
        FROM performance_metrics
        WHERE created_at >= NOW() - INTERVAL '1 hour' * p_hours_back
        GROUP BY endpoint
        HAVING COUNT(*) >= 10
        ORDER BY error_rate DESC
        LIMIT 5
    ) errors;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM performance_metrics WHERE created_at >= NOW() - INTERVAL '1 hour' * p_hours_back) as total_requests,
        (SELECT AVG(response_time) FROM performance_metrics WHERE created_at >= NOW() - INTERVAL '1 hour' * p_hours_back) as avg_response_time,
        (SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) FROM performance_metrics WHERE created_at >= NOW() - INTERVAL '1 hour' * p_hours_back) as p95_response_time,
        (SELECT COUNT(CASE WHEN status_code >= 400 THEN 1 END)::DECIMAL / COUNT(*) FROM performance_metrics WHERE created_at >= NOW() - INTERVAL '1 hour' * p_hours_back) as error_rate,
        COALESCE(slow_endpoints, '[]'::jsonb) as slowest_endpoints,
        COALESCE(error_endpoints, '[]'::jsonb) as highest_error_endpoints,
        (SELECT COUNT(*)::INTEGER FROM performance_alerts WHERE status = 'active') as performance_alerts;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate performance alerts
CREATE OR REPLACE FUNCTION generate_performance_alert(
    p_endpoint VARCHAR(500),
    p_alert_type VARCHAR(50),
    p_current_value DECIMAL,
    p_threshold_value DECIMAL,
    p_severity VARCHAR(20) DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
    alert_title VARCHAR(200);
    alert_description TEXT;
BEGIN
    -- Generate alert title and description based on type
    CASE p_alert_type
        WHEN 'high_response_time' THEN
            alert_title := 'High Response Time: ' || p_endpoint;
            alert_description := 'Response time (' || ROUND(p_current_value, 0) || 'ms) exceeds threshold (' || ROUND(p_threshold_value, 0) || 'ms)';
        WHEN 'high_error_rate' THEN
            alert_title := 'High Error Rate: ' || p_endpoint;
            alert_description := 'Error rate (' || ROUND(p_current_value * 100, 2) || '%) exceeds threshold (' || ROUND(p_threshold_value * 100, 2) || '%)';
        WHEN 'low_throughput' THEN
            alert_title := 'Low Throughput: ' || p_endpoint;
            alert_description := 'Throughput (' || ROUND(p_current_value, 1) || ' req/s) below threshold (' || ROUND(p_threshold_value, 1) || ' req/s)';
        ELSE
            alert_title := p_alert_type || ': ' || p_endpoint;
            alert_description := 'Current value (' || p_current_value || ') exceeds threshold (' || p_threshold_value || ')';
    END CASE;
    
    -- Insert alert
    INSERT INTO performance_alerts (
        alert_type, endpoint, threshold_value, current_value, 
        severity, title, description, status
    )
    VALUES (
        p_alert_type, p_endpoint, p_threshold_value, p_current_value,
        p_severity, alert_title, alert_description, 'active'
    )
    RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create performance alerts
CREATE OR REPLACE FUNCTION trigger_performance_monitoring()
RETURNS TRIGGER AS $$
DECLARE
    baseline_record RECORD;
BEGIN
    -- Check response time against baseline
    SELECT average_response_time INTO baseline_record
    FROM performance_baselines
    WHERE endpoint = NEW.endpoint
      AND valid_from <= CURRENT_DATE
      AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
    ORDER BY valid_from DESC
    LIMIT 1;
    
    -- Generate alert if response time is significantly above baseline
    IF FOUND AND NEW.response_time > baseline_record.average_response_time * 2 THEN
        PERFORM generate_performance_alert(
            NEW.endpoint,
            'high_response_time',
            NEW.response_time,
            baseline_record.average_response_time * 2,
            CASE 
                WHEN NEW.response_time > baseline_record.average_response_time * 5 THEN 'critical'
                WHEN NEW.response_time > baseline_record.average_response_time * 3 THEN 'high'
                ELSE 'medium'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic performance monitoring
DROP TRIGGER IF EXISTS trigger_performance_monitoring ON performance_metrics;
CREATE TRIGGER trigger_performance_monitoring
    AFTER INSERT ON performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_performance_monitoring();

-- Views for easy access to performance data

-- View for current performance status
CREATE OR REPLACE VIEW current_performance_status AS
SELECT 
    endpoint,
    service_name,
    COUNT(*) as requests_24h,
    AVG(response_time) as avg_response_time_24h,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time_24h,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END)::DECIMAL / COUNT(*) as error_rate_24h,
    MAX(created_at) as last_request
FROM performance_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint, service_name
ORDER BY avg_response_time_24h DESC;

-- View for performance optimization dashboard
CREATE OR REPLACE VIEW performance_dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM performance_load_tests WHERE created_at >= NOW() - INTERVAL '30 days') as load_tests_30d,
    (SELECT AVG(average_response_time) FROM performance_load_tests WHERE created_at >= NOW() - INTERVAL '7 days') as avg_response_time_7d,
    (SELECT COUNT(*) FROM performance_bottlenecks WHERE resolution_status = 'open') as open_bottlenecks,
    (SELECT COUNT(*) FROM performance_optimization_suggestions WHERE implementation_status = 'pending' AND priority IN ('high', 'critical')) as high_priority_suggestions,
    (SELECT COUNT(*) FROM performance_alerts WHERE status = 'active') as active_alerts,
    (SELECT COUNT(DISTINCT endpoint) FROM current_performance_status WHERE avg_response_time_24h > 3000) as slow_endpoints;

-- Comments for documentation
COMMENT ON TABLE performance_load_tests IS 'Comprehensive load testing results for AI system endpoints';
COMMENT ON TABLE performance_endpoint_results IS 'Individual endpoint performance metrics from load tests';
COMMENT ON TABLE performance_bottlenecks IS 'Identified system bottlenecks and performance issues';
COMMENT ON TABLE performance_optimization_suggestions IS 'AI-generated optimization recommendations';
COMMENT ON TABLE performance_metrics IS 'Real-time performance metrics collection';
COMMENT ON TABLE performance_alerts IS 'Automated performance alerts and thresholds';
COMMENT ON TABLE performance_improvements IS 'Tracking of implemented performance improvements';
COMMENT ON TABLE performance_baselines IS 'Baseline performance metrics for comparison';

COMMENT ON FUNCTION calculate_performance_trend IS 'Calculates performance trends for endpoints over time';
COMMENT ON FUNCTION detect_performance_anomalies IS 'Detects performance anomalies compared to baselines';
COMMENT ON FUNCTION get_performance_summary IS 'Returns comprehensive performance summary statistics';
COMMENT ON FUNCTION generate_performance_alert IS 'Creates automated performance alerts when thresholds are exceeded';