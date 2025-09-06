-- AI Accuracy Validation and Testing Tables
-- Migration: 025_ai_validation_tables.sql

-- AI validation suites table to track comprehensive test runs
CREATE TABLE IF NOT EXISTS ai_validation_suites (
    suite_id VARCHAR(255) PRIMARY KEY,
    suite_name VARCHAR(200) NOT NULL,
    description TEXT,
    total_tests INTEGER NOT NULL DEFAULT 0,
    passed_tests INTEGER NOT NULL DEFAULT 0,
    failed_tests INTEGER GENERATED ALWAYS AS (total_tests - passed_tests) STORED,
    overall_accuracy DECIMAL(5,4) NOT NULL DEFAULT 0 CHECK (overall_accuracy >= 0 AND overall_accuracy <= 1),
    execution_time INTEGER, -- milliseconds
    results_summary JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_by VARCHAR(255) REFERENCES users(id)
);

-- Individual AI validation results for each test case
CREATE TABLE IF NOT EXISTS ai_validation_results (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL,
    suite_id VARCHAR(255) NOT NULL REFERENCES ai_validation_suites(suite_id),
    service_name VARCHAR(100) NOT NULL,
    test_type VARCHAR(50) NOT NULL CHECK (test_type IN (
        'prediction', 'recommendation', 'analysis', 'strategy', 'trade_evaluation', 
        'integration', 'performance', 'accuracy'
    )),
    passed BOOLEAN NOT NULL DEFAULT false,
    accuracy DECIMAL(5,4) DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 1),
    expected_output JSONB,
    actual_output JSONB,
    deviation DECIMAL(5,4) GENERATED ALWAYS AS (1 - accuracy) STORED,
    execution_time_ms INTEGER,
    errors JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    test_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Service-level accuracy metrics aggregated from test results
CREATE TABLE IF NOT EXISTS ai_service_accuracy_metrics (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    suite_id VARCHAR(255) NOT NULL REFERENCES ai_validation_suites(suite_id),
    test_type VARCHAR(50) DEFAULT 'all',
    total_tests INTEGER NOT NULL DEFAULT 0,
    passed_tests INTEGER NOT NULL DEFAULT 0,
    failed_tests INTEGER GENERATED ALWAYS AS (total_tests - passed_tests) STORED,
    accuracy DECIMAL(5,4) NOT NULL DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 1),
    avg_execution_time DECIMAL(10,2),
    confidence_interval JSONB, -- [lower_bound, upper_bound]
    baseline_comparison DECIMAL(5,4), -- comparison to previous baseline
    trend VARCHAR(20) DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'declining')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(service_name, suite_id, test_type)
);

-- Baseline accuracy standards for each service and test type
CREATE TABLE IF NOT EXISTS ai_accuracy_baselines (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    minimum_accuracy DECIMAL(5,4) NOT NULL CHECK (minimum_accuracy >= 0 AND minimum_accuracy <= 1),
    target_accuracy DECIMAL(5,4) NOT NULL CHECK (target_accuracy >= 0 AND target_accuracy <= 1),
    max_execution_time INTEGER, -- milliseconds
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES users(id),
    UNIQUE(service_name, test_type)
);

-- Test case templates for reusable test scenarios
CREATE TABLE IF NOT EXISTS ai_test_case_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    input_template JSONB NOT NULL,
    expected_output_template JSONB,
    validation_rules JSONB DEFAULT '{}', -- rules for determining pass/fail
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES users(id)
);

-- Continuous monitoring alerts for AI system accuracy
CREATE TABLE IF NOT EXISTS ai_accuracy_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'accuracy_drop', 'performance_degradation', 'test_failure', 'baseline_breach'
    )),
    service_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    current_value DECIMAL(10,4),
    threshold_value DECIMAL(10,4),
    alert_data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255) REFERENCES users(id)
);

-- Model performance history for tracking accuracy over time
CREATE TABLE IF NOT EXISTS ai_model_performance_history (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    performance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    accuracy_score DECIMAL(5,4) NOT NULL CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    mean_squared_error DECIMAL(10,6),
    mean_absolute_error DECIMAL(10,6),
    sample_size INTEGER,
    training_data_version VARCHAR(50),
    model_version VARCHAR(50),
    hyperparameters JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Optimized indexes for performance and query patterns
-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_validation_suites_created_at 
ON ai_validation_suites(created_at DESC) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_validation_suites_suite_name_time
ON ai_validation_suites(suite_name, created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_validation_results_suite_service_type 
ON ai_validation_results(suite_id, service_name, test_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_validation_results_service_accuracy 
ON ai_validation_results(service_name, accuracy DESC, passed, created_at DESC) 
WHERE accuracy IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_validation_results_test_performance 
ON ai_validation_results(test_type, execution_time_ms, accuracy DESC)
WHERE execution_time_ms IS NOT NULL;

-- Service metrics optimized indexes
CREATE INDEX IF NOT EXISTS idx_service_metrics_service_type_time 
ON ai_service_accuracy_metrics(service_name, test_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_metrics_accuracy_trend
ON ai_service_accuracy_metrics(accuracy DESC, trend, created_at DESC)
WHERE accuracy >= 0.5;

CREATE INDEX IF NOT EXISTS idx_service_metrics_baseline_comparison
ON ai_service_accuracy_metrics(service_name, baseline_comparison, created_at DESC)
WHERE baseline_comparison IS NOT NULL;

-- Alert system indexes
CREATE INDEX IF NOT EXISTS idx_accuracy_alerts_status_severity 
ON ai_accuracy_alerts(status, severity, created_at DESC)
WHERE status IN ('active', 'acknowledged');

CREATE INDEX IF NOT EXISTS idx_accuracy_alerts_service_type_status
ON ai_accuracy_alerts(service_name, alert_type, status, created_at DESC);

-- Performance history indexes
CREATE INDEX IF NOT EXISTS idx_model_performance_service_date 
ON ai_model_performance_history(service_name, performance_date DESC, accuracy_score DESC);

CREATE INDEX IF NOT EXISTS idx_model_performance_accuracy_trend
ON ai_model_performance_history(model_name, accuracy_score DESC, performance_date DESC)
WHERE accuracy_score IS NOT NULL;

-- Baseline and template indexes
CREATE INDEX IF NOT EXISTS idx_baselines_service_type_active
ON ai_accuracy_baselines(service_name, test_type, minimum_accuracy, target_accuracy);

CREATE INDEX IF NOT EXISTS idx_templates_service_type_active
ON ai_test_case_templates(service_name, test_type, is_active)
WHERE is_active = true;

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_active_alerts_service_time
ON ai_accuracy_alerts(service_name, created_at DESC)
WHERE status = 'active';

-- Covering indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_validation_results_dashboard_stats
ON ai_validation_results(service_name, test_type, passed, accuracy, created_at DESC)
INCLUDE (execution_time_ms);

CREATE INDEX IF NOT EXISTS idx_service_metrics_dashboard_summary
ON ai_service_accuracy_metrics(service_name, test_type, accuracy, trend, created_at DESC)
INCLUDE (total_tests, passed_tests, avg_execution_time);

-- Insert baseline accuracy standards for AI services
INSERT INTO ai_accuracy_baselines (service_name, test_type, minimum_accuracy, target_accuracy, max_execution_time, description) VALUES
('mlPipeline', 'prediction', 0.70, 0.85, 30000, 'Player performance prediction accuracy baseline'),
('mlPipeline', 'analysis', 0.65, 0.80, 25000, 'Statistical analysis accuracy baseline'),
('oracle', 'recommendation', 0.60, 0.75, 20000, 'AI recommendation quality baseline'),
('oracle', 'analysis', 0.70, 0.85, 25000, 'Strategic analysis accuracy baseline'),
('tradeAnalysis', 'trade_evaluation', 0.75, 0.90, 15000, 'Trade evaluation accuracy baseline'),
('seasonStrategy', 'strategy', 0.65, 0.80, 35000, 'Season strategy recommendation baseline'),
('userBehavior', 'analysis', 0.70, 0.85, 20000, 'User behavior analysis baseline'),
('gameMonitor', 'prediction', 0.80, 0.90, 10000, 'Real-time game monitoring baseline'),
('intelligentWaiver', 'recommendation', 0.65, 0.80, 15000, 'Waiver recommendation baseline'),
('autoDraft', 'strategy', 0.70, 0.85, 30000, 'Auto-draft strategy baseline')
ON CONFLICT (service_name, test_type) DO NOTHING;

-- Insert test case templates for common scenarios
INSERT INTO ai_test_case_templates (template_name, test_type, service_name, description, input_template, expected_output_template, validation_rules) VALUES
('Player Performance Prediction', 'prediction', 'mlPipeline', 'Standard player prediction test with historical data', 
 '{"playerId": "", "week": 0, "season": 2024}', 
 '{"projectedPoints": 0, "confidence": 0, "variance": 0}',
 '{"accuracy_threshold": 0.7, "confidence_min": 0.6}'),

('Trade Fairness Evaluation', 'trade_evaluation', 'tradeAnalysis', 'Evaluate trade proposal fairness and impact',
 '{"proposingUser": "", "receivingUser": "", "proposingPlayers": [], "receivingPlayers": []}',
 '{"fairnessScore": 0, "impactScore": 0, "recommendationStrength": ""}',
 '{"fairness_min": 0.3, "impact_threshold": 0.1}'),

('Season Strategy Generation', 'strategy', 'seasonStrategy', 'Generate comprehensive season strategy recommendations',
 '{"userId": "", "leagueId": "", "currentWeek": 0}',
 '{"recommendationCount": 0, "actionableItems": 0, "timelineRelevance": 0}',
 '{"min_recommendations": 3, "actionable_ratio": 0.6}'),

('AI Recommendation Quality', 'recommendation', 'oracle', 'Test AI recommendation generation quality and relevance',
 '{"userId": "", "leagueId": "", "context": ""}',
 '{"recommendationCount": 0, "averageConfidence": 0, "categoryBalance": true}',
 '{"min_recommendations": 3, "min_confidence": 0.6}'),

('User Behavior Analysis', 'analysis', 'userBehavior', 'Analyze user patterns and preferences accuracy',
 '{"userId": "", "leagueId": "", "analysisType": "preferences"}',
 '{"patternCount": 0, "confidenceScore": 0, "actionableInsights": 0}',
 '{"min_patterns": 2, "min_confidence": 0.7}')
ON CONFLICT DO NOTHING;

-- Functions for AI accuracy validation

-- Function to calculate service accuracy trends
CREATE OR REPLACE FUNCTION calculate_accuracy_trend(
    p_service_name VARCHAR(100),
    p_test_type VARCHAR(50) DEFAULT 'all',
    p_days_back INTEGER DEFAULT 30
)
RETURNS VARCHAR(20) AS $$
DECLARE
    recent_accuracy DECIMAL;
    older_accuracy DECIMAL;
    trend_result VARCHAR(20);
BEGIN
    -- Get recent accuracy (last week)
    SELECT AVG(accuracy) INTO recent_accuracy
    FROM ai_service_accuracy_metrics
    WHERE service_name = p_service_name 
      AND (p_test_type = 'all' OR test_type = p_test_type)
      AND created_at >= NOW() - INTERVAL '7 days';
    
    -- Get older accuracy (previous week)
    SELECT AVG(accuracy) INTO older_accuracy
    FROM ai_service_accuracy_metrics
    WHERE service_name = p_service_name 
      AND (p_test_type = 'all' OR test_type = p_test_type)
      AND created_at >= NOW() - INTERVAL '14 days'
      AND created_at < NOW() - INTERVAL '7 days';
    
    -- Determine trend
    IF recent_accuracy IS NULL OR older_accuracy IS NULL THEN
        trend_result := 'stable';
    ELSIF recent_accuracy > older_accuracy * 1.05 THEN
        trend_result := 'improving';
    ELSIF recent_accuracy < older_accuracy * 0.95 THEN
        trend_result := 'declining';
    ELSE
        trend_result := 'stable';
    END IF;
    
    -- Update the trend in the metrics table
    UPDATE ai_service_accuracy_metrics 
    SET trend = trend_result
    WHERE service_name = p_service_name 
      AND (p_test_type = 'all' OR test_type = p_test_type)
      AND created_at >= NOW() - INTERVAL '7 days';
    
    RETURN trend_result;
END;
$$ LANGUAGE plpgsql;

-- Function to check if service meets baseline requirements
CREATE OR REPLACE FUNCTION check_service_baseline_compliance(
    p_service_name VARCHAR(100),
    p_test_type VARCHAR(50)
)
RETURNS TABLE (
    meets_minimum BOOLEAN,
    meets_target BOOLEAN,
    current_accuracy DECIMAL,
    minimum_required DECIMAL,
    target_accuracy DECIMAL,
    performance_ratio DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_metrics AS (
        SELECT accuracy
        FROM ai_service_accuracy_metrics
        WHERE service_name = p_service_name AND test_type = p_test_type
        ORDER BY created_at DESC
        LIMIT 1
    ),
    baseline AS (
        SELECT minimum_accuracy, target_accuracy
        FROM ai_accuracy_baselines
        WHERE service_name = p_service_name AND test_type = p_test_type
    )
    SELECT 
        (lm.accuracy >= b.minimum_accuracy) as meets_minimum,
        (lm.accuracy >= b.target_accuracy) as meets_target,
        lm.accuracy as current_accuracy,
        b.minimum_accuracy as minimum_required,
        b.target_accuracy as target_accuracy,
        CASE 
            WHEN b.minimum_accuracy > 0 THEN lm.accuracy / b.minimum_accuracy
            ELSE 0
        END as performance_ratio
    FROM latest_metrics lm
    CROSS JOIN baseline b;
END;
$$ LANGUAGE plpgsql;

-- Function to generate accuracy alerts
CREATE OR REPLACE FUNCTION generate_accuracy_alert(
    p_service_name VARCHAR(100),
    p_alert_type VARCHAR(50),
    p_current_value DECIMAL,
    p_threshold_value DECIMAL,
    p_description TEXT
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
    severity_level VARCHAR(20);
BEGIN
    -- Determine severity based on how far below threshold
    IF p_current_value < p_threshold_value * 0.7 THEN
        severity_level := 'critical';
    ELSIF p_current_value < p_threshold_value * 0.85 THEN
        severity_level := 'high';
    ELSE
        severity_level := 'medium';
    END IF;
    
    -- Insert alert
    INSERT INTO ai_accuracy_alerts (
        alert_type, service_name, severity, title, description,
        current_value, threshold_value, status
    )
    VALUES (
        p_alert_type,
        p_service_name,
        severity_level,
        p_service_name || ' ' || p_alert_type || ' detected',
        p_description,
        p_current_value,
        p_threshold_value,
        'active'
    )
    RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Optimized function to get validation summary statistics with better performance
CREATE OR REPLACE FUNCTION get_validation_summary_stats(
    p_days_back INTEGER DEFAULT 7,
    p_service_name VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    total_test_runs BIGINT,
    avg_accuracy DECIMAL,
    median_accuracy DECIMAL,
    services_above_baseline INTEGER,
    services_below_baseline INTEGER,
    active_alerts INTEGER,
    improvement_trend_services INTEGER,
    declining_trend_services INTEGER,
    avg_execution_time_ms DECIMAL,
    total_tests_passed BIGINT,
    total_tests_failed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH date_filter AS (
        SELECT NOW() - INTERVAL '1 day' * p_days_back as cutoff_date
    ),
    recent_suites AS (
        SELECT suite_id, overall_accuracy, total_tests, passed_tests
        FROM ai_validation_suites, date_filter
        WHERE created_at >= cutoff_date
        AND (p_service_name IS NULL OR suite_name ILIKE '%' || p_service_name || '%')
        AND completed_at IS NOT NULL
    ),
    recent_results AS (
        SELECT service_name, accuracy, passed, execution_time_ms
        FROM ai_validation_results vr, date_filter
        WHERE vr.created_at >= cutoff_date
        AND (p_service_name IS NULL OR vr.service_name = p_service_name)
        AND accuracy IS NOT NULL
    ),
    service_compliance AS (
        SELECT DISTINCT
            sam.service_name,
            sam.accuracy,
            sam.trend,
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM ai_accuracy_baselines ab 
                    WHERE ab.service_name = sam.service_name 
                    AND ab.test_type = sam.test_type
                    AND sam.accuracy >= ab.minimum_accuracy
                ) THEN 1 ELSE 0 
            END as meets_baseline
        FROM ai_service_accuracy_metrics sam, date_filter
        WHERE sam.created_at >= cutoff_date
        AND (p_service_name IS NULL OR sam.service_name = p_service_name)
    ),
    aggregated_stats AS (
        SELECT 
            COUNT(*) as suite_count,
            AVG(overall_accuracy) as avg_acc,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY overall_accuracy) as median_acc,
            SUM(total_tests) as total_tests,
            SUM(passed_tests) as passed_tests
        FROM recent_suites
    ),
    execution_stats AS (
        SELECT AVG(execution_time_ms) as avg_exec_time
        FROM recent_results
        WHERE execution_time_ms IS NOT NULL
    ),
    compliance_stats AS (
        SELECT 
            COUNT(CASE WHEN meets_baseline = 1 THEN 1 END) as above_baseline,
            COUNT(CASE WHEN meets_baseline = 0 THEN 1 END) as below_baseline,
            COUNT(CASE WHEN trend = 'improving' THEN 1 END) as improving,
            COUNT(CASE WHEN trend = 'declining' THEN 1 END) as declining
        FROM service_compliance
    ),
    alert_stats AS (
        SELECT COUNT(*) as active_alert_count
        FROM ai_accuracy_alerts 
        WHERE status = 'active'
        AND (p_service_name IS NULL OR service_name = p_service_name)
    )
    SELECT 
        COALESCE(ag.suite_count, 0)::BIGINT,
        COALESCE(ag.avg_acc, 0)::DECIMAL,
        COALESCE(ag.median_acc, 0)::DECIMAL,
        COALESCE(cs.above_baseline, 0)::INTEGER,
        COALESCE(cs.below_baseline, 0)::INTEGER,
        COALESCE(als.active_alert_count, 0)::INTEGER,
        COALESCE(cs.improving, 0)::INTEGER,
        COALESCE(cs.declining, 0)::INTEGER,
        COALESCE(es.avg_exec_time, 0)::DECIMAL,
        COALESCE(ag.passed_tests, 0)::BIGINT,
        COALESCE(ag.total_tests - ag.passed_tests, 0)::BIGINT
    FROM aggregated_stats ag
    CROSS JOIN compliance_stats cs
    CROSS JOIN alert_stats als
    CROSS JOIN execution_stats es;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create alerts when accuracy drops
CREATE OR REPLACE FUNCTION trigger_accuracy_alert()
RETURNS TRIGGER AS $$
DECLARE
    baseline_record RECORD;
    alert_description TEXT;
BEGIN
    -- Check if accuracy dropped below baseline
    SELECT * INTO baseline_record
    FROM ai_accuracy_baselines
    WHERE service_name = NEW.service_name AND test_type = NEW.test_type;
    
    IF FOUND AND NEW.accuracy < baseline_record.minimum_accuracy THEN
        alert_description := 'Service accuracy (' || ROUND(NEW.accuracy * 100, 1) || 
                           '%) dropped below minimum baseline (' || 
                           ROUND(baseline_record.minimum_accuracy * 100, 1) || '%)';
        
        PERFORM generate_accuracy_alert(
            NEW.service_name,
            'accuracy_drop',
            NEW.accuracy,
            baseline_record.minimum_accuracy,
            alert_description
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_accuracy_alert ON ai_service_accuracy_metrics;
CREATE TRIGGER trigger_accuracy_alert
    AFTER INSERT OR UPDATE OF accuracy ON ai_service_accuracy_metrics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_accuracy_alert();

-- Trigger to update model performance history
CREATE OR REPLACE FUNCTION update_model_performance_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert daily performance snapshot
    INSERT INTO ai_model_performance_history (
        model_name, service_name, accuracy_score, sample_size
    )
    VALUES (
        NEW.service_name || '_model',
        NEW.service_name,
        NEW.accuracy,
        NEW.total_tests
    )
    ON CONFLICT (model_name, service_name, performance_date) 
    DO UPDATE SET
        accuracy_score = EXCLUDED.accuracy_score,
        sample_size = EXCLUDED.sample_size;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_model_performance ON ai_service_accuracy_metrics;
CREATE TRIGGER trigger_update_model_performance
    AFTER INSERT OR UPDATE ON ai_service_accuracy_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_model_performance_history();

-- Views for easy access to validation data

-- View for latest service accuracy metrics
CREATE OR REPLACE VIEW latest_service_accuracy AS
SELECT DISTINCT ON (service_name, test_type)
    service_name,
    test_type,
    accuracy,
    total_tests,
    passed_tests,
    failed_tests,
    avg_execution_time,
    trend,
    created_at,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM ai_accuracy_baselines ab 
            WHERE ab.service_name = sam.service_name 
              AND ab.test_type = sam.test_type
              AND sam.accuracy >= ab.minimum_accuracy
        ) THEN 'compliant'
        ELSE 'below_baseline'
    END as compliance_status
FROM ai_service_accuracy_metrics sam
ORDER BY service_name, test_type, created_at DESC;

-- View for validation dashboard summary
CREATE OR REPLACE VIEW validation_dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM ai_validation_suites WHERE created_at >= NOW() - INTERVAL '7 days') as recent_test_runs,
    (SELECT AVG(overall_accuracy) FROM ai_validation_suites WHERE created_at >= NOW() - INTERVAL '7 days') as avg_accuracy_7d,
    (SELECT COUNT(DISTINCT service_name) FROM latest_service_accuracy WHERE compliance_status = 'compliant') as compliant_services,
    (SELECT COUNT(DISTINCT service_name) FROM latest_service_accuracy WHERE compliance_status = 'below_baseline') as non_compliant_services,
    (SELECT COUNT(*) FROM ai_accuracy_alerts WHERE status = 'active') as active_alerts,
    (SELECT COUNT(DISTINCT service_name) FROM latest_service_accuracy WHERE trend = 'improving') as improving_services,
    (SELECT COUNT(DISTINCT service_name) FROM latest_service_accuracy WHERE trend = 'declining') as declining_services;

-- Comments for documentation
COMMENT ON TABLE ai_validation_suites IS 'Comprehensive AI system validation test suites and their results';
COMMENT ON TABLE ai_validation_results IS 'Individual test case results from AI validation suites';
COMMENT ON TABLE ai_service_accuracy_metrics IS 'Aggregated accuracy metrics for each AI service';
COMMENT ON TABLE ai_accuracy_baselines IS 'Baseline accuracy standards and thresholds for AI services';
COMMENT ON TABLE ai_test_case_templates IS 'Reusable test case templates for consistent validation';
COMMENT ON TABLE ai_accuracy_alerts IS 'Automated alerts for AI system accuracy issues';
COMMENT ON TABLE ai_model_performance_history IS 'Historical performance tracking for AI models';

COMMENT ON FUNCTION calculate_accuracy_trend IS 'Calculates accuracy trend for a service over time';
COMMENT ON FUNCTION check_service_baseline_compliance IS 'Checks if service meets minimum and target accuracy baselines';
COMMENT ON FUNCTION generate_accuracy_alert IS 'Creates automated alerts when accuracy issues are detected';
COMMENT ON FUNCTION get_validation_summary_stats IS 'Returns summary statistics for validation dashboard';