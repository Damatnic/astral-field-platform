-- Multi-Agent Development Team Coordination System - Database Schema
-- Comprehensive schema for managing agents, tasks, and coordination

-- =================================================================================
-- AGENT MANAGEMENT TABLES
-- =================================================================================

-- Registered agents in the system
CREATE TABLE IF NOT EXISTS multi_agent_agents (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    capabilities JSONB NOT NULL,
    status JSONB,
    performance JSONB,
    health JSONB,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Indexes for performance
    INDEX idx_agents_type (type),
    INDEX idx_agents_active (is_active),
    INDEX idx_agents_updated (updated_at)
);

-- Agent heartbeat and health monitoring
CREATE TABLE IF NOT EXISTS multi_agent_heartbeats (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL REFERENCES multi_agent_agents(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    health_data JSONB,
    metrics JSONB,
    
    INDEX idx_heartbeats_agent (agent_id),
    INDEX idx_heartbeats_timestamp (timestamp)
);

-- =================================================================================
-- TASK MANAGEMENT TABLES
-- =================================================================================

-- Tasks in the coordination system
CREATE TABLE IF NOT EXISTS multi_agent_tasks (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    assigned_agent_id VARCHAR(100) REFERENCES multi_agent_agents(id),
    required_skills JSONB,
    estimated_duration INTEGER, -- minutes
    dependencies JSONB,
    files JSONB,
    context JSONB,
    quality JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB,
    
    INDEX idx_tasks_type (type),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_priority (priority),
    INDEX idx_tasks_assigned (assigned_agent_id),
    INDEX idx_tasks_created (created_at)
);

-- Task execution history
CREATE TABLE IF NOT EXISTS multi_agent_task_executions (
    id BIGSERIAL PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL REFERENCES multi_agent_tasks(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL REFERENCES multi_agent_agents(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    success BOOLEAN,
    result JSONB,
    error_message TEXT,
    execution_time INTEGER, -- milliseconds
    
    INDEX idx_executions_task (task_id),
    INDEX idx_executions_agent (agent_id),
    INDEX idx_executions_started (started_at)
);

-- Task dependencies tracking
CREATE TABLE IF NOT EXISTS multi_agent_task_dependencies (
    id BIGSERIAL PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL REFERENCES multi_agent_tasks(id) ON DELETE CASCADE,
    depends_on_task_id VARCHAR(100) NOT NULL REFERENCES multi_agent_tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'completion',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (task_id, depends_on_task_id),
    INDEX idx_deps_task (task_id),
    INDEX idx_deps_depends_on (depends_on_task_id)
);

-- =================================================================================
-- CONFLICT MANAGEMENT TABLES
-- =================================================================================

-- Code conflicts detected and resolved
CREATE TABLE IF NOT EXISTS multi_agent_conflicts (
    id VARCHAR(100) PRIMARY KEY,
    files JSONB NOT NULL,
    conflict_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    involved_agents JSONB,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution JSONB,
    
    INDEX idx_conflicts_type (conflict_type),
    INDEX idx_conflicts_severity (severity),
    INDEX idx_conflicts_detected (detected_at)
);

-- =================================================================================
-- QUALITY ASSURANCE TABLES
-- =================================================================================

-- Quality gate executions
CREATE TABLE IF NOT EXISTS multi_agent_quality_gates (
    id BIGSERIAL PRIMARY KEY,
    gate_name VARCHAR(100) NOT NULL,
    task_id VARCHAR(100) NOT NULL REFERENCES multi_agent_tasks(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) NOT NULL REFERENCES multi_agent_agents(id) ON DELETE CASCADE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    passed BOOLEAN NOT NULL,
    score INTEGER, -- 0-100
    results JSONB,
    issues JSONB,
    
    INDEX idx_quality_gates_task (task_id),
    INDEX idx_quality_gates_agent (agent_id),
    INDEX idx_quality_gates_executed (executed_at)
);

-- Code review results
CREATE TABLE IF NOT EXISTS multi_agent_code_reviews (
    id BIGSERIAL PRIMARY KEY,
    task_id VARCHAR(100) NOT NULL REFERENCES multi_agent_tasks(id) ON DELETE CASCADE,
    reviewer_agent_id VARCHAR(100) NOT NULL REFERENCES multi_agent_agents(id) ON DELETE CASCADE,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_status VARCHAR(20) NOT NULL, -- approved, rejected, needs_changes
    score INTEGER, -- 0-100
    files_reviewed JSONB,
    issues JSONB,
    suggestions JSONB,
    
    INDEX idx_reviews_task (task_id),
    INDEX idx_reviews_reviewer (reviewer_agent_id),
    INDEX idx_reviews_status (approval_status)
);

-- =================================================================================
-- KNOWLEDGE BASE TABLES
-- =================================================================================

-- Knowledge items in the shared knowledge base
CREATE TABLE IF NOT EXISTS multi_agent_knowledge_items (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    tags JSONB,
    related_files JSONB,
    created_by VARCHAR(100) NOT NULL REFERENCES multi_agent_agents(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    votes INTEGER DEFAULT 0,
    validated BOOLEAN DEFAULT false,
    examples JSONB,
    
    INDEX idx_knowledge_type (type),
    INDEX idx_knowledge_tags USING GIN (tags),
    INDEX idx_knowledge_created_by (created_by),
    INDEX idx_knowledge_votes (votes)
);

-- Knowledge patterns and best practices
CREATE TABLE IF NOT EXISTS multi_agent_patterns (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    pattern TEXT NOT NULL,
    anti_pattern TEXT,
    when_to_use TEXT,
    benefits JSONB,
    drawbacks JSONB,
    examples JSONB,
    related_patterns JSONB,
    difficulty VARCHAR(20) DEFAULT 'intermediate',
    applicability JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_patterns_category (category),
    INDEX idx_patterns_difficulty (difficulty),
    INDEX idx_patterns_name (name)
);

-- Architectural decision records
CREATE TABLE IF NOT EXISTS multi_agent_architectural_decisions (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    context TEXT NOT NULL,
    decision TEXT NOT NULL,
    rationale TEXT NOT NULL,
    consequences JSONB,
    alternatives JSONB,
    status VARCHAR(20) DEFAULT 'proposed',
    decision_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_date TIMESTAMP,
    stakeholders JSONB,
    related_decisions JSONB,
    implementation JSONB,
    
    INDEX idx_adr_status (status),
    INDEX idx_adr_decision_date (decision_date)
);

-- =================================================================================
-- PERFORMANCE MONITORING TABLES
-- =================================================================================

-- Performance metrics for agents and system
CREATE TABLE IF NOT EXISTS multi_agent_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    metric_unit VARCHAR(20),
    agent_id VARCHAR(100) REFERENCES multi_agent_agents(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    
    INDEX idx_metrics_name (metric_name),
    INDEX idx_metrics_agent (agent_id),
    INDEX idx_metrics_timestamp (timestamp)
);

-- System health snapshots
CREATE TABLE IF NOT EXISTS multi_agent_health_snapshots (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_status VARCHAR(20) NOT NULL,
    agent_stats JSONB,
    task_stats JSONB,
    performance_stats JSONB,
    resource_stats JSONB,
    alerts JSONB,
    
    INDEX idx_health_timestamp (timestamp),
    INDEX idx_health_status (overall_status)
);

-- Performance alerts
CREATE TABLE IF NOT EXISTS multi_agent_alerts (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    actions JSONB,
    
    INDEX idx_alerts_type (type),
    INDEX idx_alerts_severity (severity),
    INDEX idx_alerts_timestamp (timestamp),
    INDEX idx_alerts_resolved (resolved)
);

-- =================================================================================
-- ERROR CORRECTION TABLES
-- =================================================================================

-- Error patterns for automatic correction
CREATE TABLE IF NOT EXISTS multi_agent_error_patterns (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    pattern TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    auto_fixable BOOLEAN DEFAULT false,
    description TEXT,
    common_causes JSONB,
    diagnostic_steps JSONB,
    resolution_steps JSONB,
    prevention_measures JSONB,
    related_patterns JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_error_patterns_category (category),
    INDEX idx_error_patterns_severity (severity),
    INDEX idx_error_patterns_auto_fixable (auto_fixable)
);

-- Error occurrences and corrections
CREATE TABLE IF NOT EXISTS multi_agent_error_occurrences (
    id VARCHAR(100) PRIMARY KEY,
    pattern_id VARCHAR(100) REFERENCES multi_agent_error_patterns(id),
    task_id VARCHAR(100) REFERENCES multi_agent_tasks(id) ON DELETE CASCADE,
    agent_id VARCHAR(100) REFERENCES multi_agent_agents(id) ON DELETE CASCADE,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'detected',
    attempts INTEGER DEFAULT 0,
    resolution_log JSONB,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fixed_at TIMESTAMP,
    escalated_at TIMESTAMP,
    
    INDEX idx_errors_pattern (pattern_id),
    INDEX idx_errors_task (task_id),
    INDEX idx_errors_agent (agent_id),
    INDEX idx_errors_status (status),
    INDEX idx_errors_detected (detected_at)
);

-- =================================================================================
-- COMMUNICATION TABLES
-- =================================================================================

-- Agent message history
CREATE TABLE IF NOT EXISTS multi_agent_messages (
    id BIGSERIAL PRIMARY KEY,
    message_id VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    sender_id VARCHAR(100) NOT NULL REFERENCES multi_agent_agents(id) ON DELETE CASCADE,
    recipient_id VARCHAR(100) REFERENCES multi_agent_agents(id) ON DELETE CASCADE, -- NULL for broadcasts
    content JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    requires_ack BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    correlation_id VARCHAR(100),
    
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_recipient (recipient_id),
    INDEX idx_messages_type (type),
    INDEX idx_messages_timestamp (timestamp),
    INDEX idx_messages_correlation (correlation_id)
);

-- WebSocket connection tracking
CREATE TABLE IF NOT EXISTS multi_agent_connections (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL REFERENCES multi_agent_agents(id) ON DELETE CASCADE,
    socket_id VARCHAR(100) NOT NULL,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    connection_duration INTEGER, -- seconds
    subscriptions JSONB,
    
    INDEX idx_connections_agent (agent_id),
    INDEX idx_connections_socket (socket_id),
    INDEX idx_connections_connected (connected_at)
);

-- =================================================================================
-- CONFIGURATION AND AUDIT TABLES
-- =================================================================================

-- System configuration
CREATE TABLE IF NOT EXISTS multi_agent_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Audit trail for important system events
CREATE TABLE IF NOT EXISTS multi_agent_audit_log (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    agent_id VARCHAR(100) REFERENCES multi_agent_agents(id) ON DELETE SET NULL,
    task_id VARCHAR(100) REFERENCES multi_agent_tasks(id) ON DELETE SET NULL,
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_event_type (event_type),
    INDEX idx_audit_agent (agent_id),
    INDEX idx_audit_task (task_id),
    INDEX idx_audit_timestamp (timestamp)
);

-- =================================================================================
-- VIEWS FOR COMMON QUERIES
-- =================================================================================

-- Active agents with current status
CREATE VIEW multi_agent_active_agents AS
SELECT 
    a.*,
    h.timestamp as last_heartbeat,
    h.health_data,
    h.metrics
FROM multi_agent_agents a
LEFT JOIN (
    SELECT DISTINCT ON (agent_id) 
        agent_id, 
        timestamp, 
        health_data, 
        metrics
    FROM multi_agent_heartbeats
    ORDER BY agent_id, timestamp DESC
) h ON a.id = h.agent_id
WHERE a.is_active = true;

-- Task queue with priorities
CREATE VIEW multi_agent_task_queue AS
SELECT 
    t.*,
    COALESCE(array_length(array(SELECT jsonb_array_elements_text(t.dependencies)), 1), 0) as dependency_count,
    CASE 
        WHEN t.priority = 'critical' THEN 1000
        WHEN t.priority = 'high' THEN 750
        WHEN t.priority = 'medium' THEN 500
        WHEN t.priority = 'low' THEN 250
    END + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.created_at)) / 3600 as priority_score
FROM multi_agent_tasks t
WHERE t.status IN ('pending', 'assigned')
ORDER BY priority_score DESC;

-- System health overview
CREATE VIEW multi_agent_system_overview AS
SELECT 
    (SELECT COUNT(*) FROM multi_agent_agents WHERE is_active = true) as total_agents,
    (SELECT COUNT(*) FROM multi_agent_active_agents WHERE last_heartbeat > CURRENT_TIMESTAMP - INTERVAL '5 minutes') as online_agents,
    (SELECT COUNT(*) FROM multi_agent_tasks WHERE status = 'pending') as pending_tasks,
    (SELECT COUNT(*) FROM multi_agent_tasks WHERE status = 'in_progress') as active_tasks,
    (SELECT COUNT(*) FROM multi_agent_tasks WHERE status = 'completed' AND completed_at > CURRENT_TIMESTAMP - INTERVAL '1 day') as completed_today,
    (SELECT COUNT(*) FROM multi_agent_conflicts WHERE resolved_at IS NULL) as unresolved_conflicts,
    (SELECT COUNT(*) FROM multi_agent_alerts WHERE resolved = false) as active_alerts;

-- =================================================================================
-- STORED PROCEDURES AND FUNCTIONS
-- =================================================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_multi_agent_data(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old heartbeats
    DELETE FROM multi_agent_heartbeats 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old metrics
    DELETE FROM multi_agent_metrics 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Clean up old messages
    DELETE FROM multi_agent_messages 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Clean up old completed tasks (keep failed/blocked ones longer)
    DELETE FROM multi_agent_tasks 
    WHERE status = 'completed' 
    AND completed_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate agent performance score
CREATE OR REPLACE FUNCTION calculate_agent_performance_score(agent_id_param VARCHAR(100))
RETURNS DECIMAL AS $$
DECLARE
    success_rate DECIMAL;
    avg_completion_time DECIMAL;
    task_count INTEGER;
    performance_score DECIMAL;
BEGIN
    -- Get task statistics for the agent
    SELECT 
        COUNT(*),
        AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100,
        AVG(execution_time)
    INTO task_count, success_rate, avg_completion_time
    FROM multi_agent_task_executions
    WHERE agent_id = agent_id_param
    AND started_at > CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Calculate performance score (0-100)
    IF task_count = 0 THEN
        RETURN 50.0; -- Default score for new agents
    END IF;
    
    performance_score := success_rate * 0.6 + 
                        CASE 
                            WHEN avg_completion_time < 60000 THEN 40.0 -- < 1 minute
                            WHEN avg_completion_time < 300000 THEN 30.0 -- < 5 minutes
                            WHEN avg_completion_time < 600000 THEN 20.0 -- < 10 minutes
                            ELSE 10.0
                        END * 0.4;
    
    RETURN ROUND(performance_score, 2);
END;
$$ LANGUAGE plpgsql;

-- =================================================================================
-- INDEXES FOR PERFORMANCE
-- =================================================================================

-- Additional composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON multi_agent_tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON multi_agent_tasks(assigned_agent_id, status);
CREATE INDEX IF NOT EXISTS idx_metrics_agent_timestamp ON multi_agent_metrics(agent_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_sender_timestamp ON multi_agent_messages(sender_id, timestamp);

-- =================================================================================
-- INITIAL DATA
-- =================================================================================

-- Insert default configuration
INSERT INTO multi_agent_config (key, value, description) VALUES
('max_concurrent_tasks', '3', 'Maximum concurrent tasks per agent'),
('task_assignment_strategy', '"skill_based"', 'Task assignment strategy'),
('heartbeat_interval', '30', 'Heartbeat interval in seconds'),
('performance_monitoring_interval', '60', 'Performance monitoring interval in seconds')
ON CONFLICT (key) DO NOTHING;

-- Insert default error patterns
INSERT INTO multi_agent_error_patterns (id, name, category, pattern, severity, auto_fixable, description) VALUES
('ts-compilation', 'TypeScript Compilation Error', 'syntax', 'error TS\\d+:', 'medium', true, 'TypeScript compiler errors preventing build'),
('missing-dependency', 'Missing Dependency Error', 'dependency', 'Cannot find module|Module not found', 'medium', true, 'Required dependency is not installed'),
('env-config', 'Environment Configuration Error', 'configuration', 'Environment variable|Missing required environment', 'high', true, 'Missing or invalid environment configuration')
ON CONFLICT (id) DO NOTHING;

COMMIT;