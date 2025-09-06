-- Database Optimization and Enhanced Indexing
-- Migration: 036_database_optimization_indexes.sql
-- Comprehensive indexing strategy for all major tables

-- =============================================================================
-- USER AND AUTHENTICATION INDEXES
-- =============================================================================

-- Users table optimizations
CREATE INDEX IF NOT EXISTS idx_users_email_verified_active
ON users(email, email_verified, is_active)
WHERE email_verified = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_users_created_at_desc
ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_last_login_active
ON users(last_login DESC, is_active)
WHERE is_active = true;

-- =============================================================================
-- LEAGUE AND TEAM INDEXES
-- =============================================================================

-- Leagues table optimizations
CREATE INDEX IF NOT EXISTS idx_leagues_owner_created_desc
ON leagues(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leagues_status_season
ON leagues(status, season_year)
WHERE status IN ('active', 'draft_in_progress');

CREATE INDEX IF NOT EXISTS idx_leagues_format_type_active
ON leagues(league_format, league_type, is_active)
WHERE is_active = true;

-- Teams table optimizations
CREATE INDEX IF NOT EXISTS idx_teams_league_owner
ON teams(league_id, owner_id);

CREATE INDEX IF NOT EXISTS idx_teams_league_standings
ON teams(league_id, wins DESC, points_for DESC);

-- =============================================================================
-- PLAYER AND ROSTER INDEXES
-- =============================================================================

-- Players table optimizations (if exists)
CREATE INDEX IF NOT EXISTS idx_players_position_team_active
ON players(position, team, status)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_players_fantasy_points_position
ON players(fantasy_points DESC, position)
WHERE fantasy_points IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_players_name_searchable
ON players USING gin(to_tsvector('english', name))
WHERE status = 'active';

-- Player stats optimizations
CREATE INDEX IF NOT EXISTS idx_player_stats_player_week_season
ON player_stats(player_id, week, season_year);

CREATE INDEX IF NOT EXISTS idx_player_stats_fantasy_points_desc
ON player_stats(fantasy_points DESC, week, season_year)
WHERE fantasy_points IS NOT NULL;

-- Roster management indexes
CREATE INDEX IF NOT EXISTS idx_rosters_team_position
ON roster_players(team_id, position, is_starter);

CREATE INDEX IF NOT EXISTS idx_rosters_team_bench_active
ON roster_players(team_id, is_starter, is_active)
WHERE is_active = true;

-- =============================================================================
-- FANTASY FOOTBALL SPECIFIC INDEXES
-- =============================================================================

-- Matchups and scoring
CREATE INDEX IF NOT EXISTS idx_matchups_league_week_season
ON matchups(league_id, week, season_year);

CREATE INDEX IF NOT EXISTS idx_matchups_team_performance
ON matchups(home_team_id, away_team_id, home_score DESC, away_score DESC);

-- Waivers and transactions
CREATE INDEX IF NOT EXISTS idx_waivers_league_week_priority
ON waiver_claims(league_id, week, waiver_priority, status);

CREATE INDEX IF NOT EXISTS idx_waivers_user_status_time
ON waiver_claims(user_id, status, created_at DESC)
WHERE status IN ('pending', 'processed');

CREATE INDEX IF NOT EXISTS idx_transactions_league_type_time
ON transactions(league_id, transaction_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_recent
ON transactions(user_id, created_at DESC)
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Draft related indexes
CREATE INDEX IF NOT EXISTS idx_draft_picks_league_round_pick
ON draft_picks(league_id, round, pick_number);

CREATE INDEX IF NOT EXISTS idx_draft_picks_user_player
ON draft_picks(user_id, player_id, league_id);

-- =============================================================================
-- AI AND ANALYTICS INDEXES
-- =============================================================================

-- AI predictions and recommendations
CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_week_accuracy
ON ai_predictions(user_id, week, accuracy_score DESC)
WHERE accuracy_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_predictions_player_confidence
ON ai_predictions(player_id, confidence_score DESC, prediction_type);

-- User behavior analytics
CREATE INDEX IF NOT EXISTS idx_user_actions_user_time_type
ON user_actions(user_id, created_at DESC, action_type);

CREATE INDEX IF NOT EXISTS idx_user_actions_league_activity
ON user_actions(league_id, action_type, created_at DESC)
WHERE league_id IS NOT NULL;

-- ML model performance
CREATE INDEX IF NOT EXISTS idx_model_performance_name_date
ON ml_model_performance(model_name, performance_date DESC);

CREATE INDEX IF NOT EXISTS idx_model_performance_accuracy_trend
ON ml_model_performance(accuracy_score DESC, model_name)
WHERE accuracy_score >= 0.5;

-- =============================================================================
-- TRADE AND MARKET ANALYSIS INDEXES
-- =============================================================================

-- Trade proposals and analysis
CREATE INDEX IF NOT EXISTS idx_trade_proposals_initiator_status
ON trade_proposals(initiating_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trade_proposals_league_status_time
ON trade_proposals(league_id, status, created_at DESC)
WHERE status IN ('pending', 'accepted', 'rejected');

-- Trade analysis results
CREATE INDEX IF NOT EXISTS idx_trade_analysis_proposal_score
ON trade_analysis(proposal_id, fairness_score DESC);

-- Market trends
CREATE INDEX IF NOT EXISTS idx_market_trends_player_week
ON market_trends(player_id, week, trend_score DESC);

-- =============================================================================
-- GAMIFICATION AND SOCIAL INDEXES
-- =============================================================================

-- User achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_earned
ON user_achievements(user_id, earned_at DESC, achievement_type);

CREATE INDEX IF NOT EXISTS idx_user_achievements_league_recent
ON user_achievements(league_id, earned_at DESC)
WHERE earned_at >= NOW() - INTERVAL '7 days';

-- Virtual currency transactions
CREATE INDEX IF NOT EXISTS idx_currency_transactions_user_type_time
ON virtual_currency_transactions(user_id, transaction_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_currency_transactions_currency_amount
ON virtual_currency_transactions(currency_type, amount DESC, status)
WHERE status = 'completed';

-- Community features
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_time_active
ON forum_posts(topic_id, created_at DESC, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_forum_posts_user_recent
ON forum_posts(user_id, created_at DESC)
WHERE created_at >= NOW() - INTERVAL '30 days';

-- =============================================================================
-- PERFORMANCE AND MONITORING INDEXES
-- =============================================================================

-- System performance logs
CREATE INDEX IF NOT EXISTS idx_performance_logs_service_time
ON performance_logs(service_name, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_logs_response_time_slow
ON performance_logs(response_time_ms DESC, service_name)
WHERE response_time_ms > 1000;

-- Error tracking
CREATE INDEX IF NOT EXISTS idx_error_logs_service_severity_time
ON error_logs(service_name, severity, created_at DESC)
WHERE severity IN ('error', 'critical');

-- API usage tracking
CREATE INDEX IF NOT EXISTS idx_api_usage_user_endpoint_time
ON api_usage_logs(user_id, endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_rate_limiting
ON api_usage_logs(user_id, endpoint, created_at)
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- =============================================================================
-- DASHBOARD AND ANALYTICS SUITE INDEXES (from migration 035)
-- =============================================================================

-- Custom dashboards
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_user_public_active
ON custom_dashboards(user_id, is_public, last_modified_at DESC)
WHERE is_public = true OR user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_custom_dashboards_slug_lookup
ON custom_dashboards(slug, user_id)
WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_custom_dashboards_template_featured
ON custom_dashboards(is_template, is_public, view_count DESC)
WHERE is_template = true;

-- Dashboard widgets
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type_category_active
ON dashboard_widgets(widget_type, category, status)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_rating_usage
ON dashboard_widgets(avg_rating DESC, usage_count DESC)
WHERE avg_rating >= 3.0;

-- Custom metrics
CREATE INDEX IF NOT EXISTS idx_custom_metrics_user_validated
ON custom_metrics(user_id, is_validated, created_at DESC)
WHERE is_validated = true;

CREATE INDEX IF NOT EXISTS idx_custom_metrics_public_featured
ON custom_metrics(is_public, is_featured, usage_count DESC)
WHERE is_public = true;

-- Data sources
CREATE INDEX IF NOT EXISTS idx_dashboard_data_sources_user_status
ON dashboard_data_sources(user_id, status, last_sync_at DESC)
WHERE status IN ('active', 'error');

CREATE INDEX IF NOT EXISTS idx_dashboard_data_sources_type_sync
ON dashboard_data_sources(source_type, sync_frequency, last_sync_at);

-- Statistical models
CREATE INDEX IF NOT EXISTS idx_statistical_models_user_type_status
ON statistical_models(user_id, model_type, status)
WHERE status IN ('trained', 'deployed');

CREATE INDEX IF NOT EXISTS idx_statistical_models_accuracy_performance
ON statistical_models(accuracy DESC, model_type)
WHERE accuracy >= 0.7;

-- =============================================================================
-- COVERING INDEXES FOR COMMON DASHBOARD QUERIES
-- =============================================================================

-- User dashboard overview
CREATE INDEX IF NOT EXISTS idx_user_overview_covering
ON users(id, email, created_at, last_login, is_active)
INCLUDE (username, display_name);

-- League performance summary
CREATE INDEX IF NOT EXISTS idx_league_summary_covering
ON leagues(id, owner_id, status, season_year)
INCLUDE (name, league_format, created_at);

-- Team standings covering index
CREATE INDEX IF NOT EXISTS idx_team_standings_covering
ON teams(league_id, wins, losses, points_for DESC)
INCLUDE (team_name, owner_id, points_against);

-- Player performance covering index
CREATE INDEX IF NOT EXISTS idx_player_performance_covering
ON player_stats(player_id, week, season_year, fantasy_points DESC)
INCLUDE (position, team);

-- =============================================================================
-- SPECIALIZED INDEXES FOR COMPLEX QUERIES
-- =============================================================================

-- Multi-column indexes for complex WHERE clauses
CREATE INDEX IF NOT EXISTS idx_user_league_team_complex
ON teams(owner_id, league_id, is_active)
WHERE is_active = true;

-- Time-series analysis indexes
CREATE INDEX IF NOT EXISTS idx_time_series_player_performance
ON player_stats(player_id, season_year, week)
INCLUDE (fantasy_points, position);

-- Geographic/location-based indexes (if applicable)
CREATE INDEX IF NOT EXISTS idx_users_timezone_activity
ON users(timezone, last_login DESC)
WHERE is_active = true;

-- =============================================================================
-- EXPRESSION INDEXES FOR CALCULATED VALUES
-- =============================================================================

-- Win percentage calculation index
CREATE INDEX IF NOT EXISTS idx_teams_win_percentage
ON teams((wins::float / NULLIF(wins + losses, 0)) DESC, league_id)
WHERE wins + losses > 0;

-- Average fantasy points per game
CREATE INDEX IF NOT EXISTS idx_players_avg_fantasy_points
ON player_stats(player_id, (fantasy_points / NULLIF(games_played, 0)) DESC)
WHERE games_played > 0;

-- =============================================================================
-- MAINTENANCE AND CLEANUP FUNCTIONS
-- =============================================================================

-- Function to analyze index usage and identify unused indexes
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    num_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    usage_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        indexname::TEXT,
        idx_scan as num_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        CASE 
            WHEN idx_scan = 0 THEN 0
            ELSE ROUND((idx_tup_fetch::numeric / idx_tup_read::numeric) * 100, 2)
        END as usage_ratio
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get table and index size information
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
    table_name TEXT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT,
    row_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        pg_size_pretty(pg_total_relation_size(t.table_name::regclass)) as table_size,
        pg_size_pretty(pg_indexes_size(t.table_name::regclass)) as index_size,
        pg_size_pretty(pg_total_relation_size(t.table_name::regclass) + pg_indexes_size(t.table_name::regclass)) as total_size,
        (SELECT reltuples::BIGINT FROM pg_class WHERE relname = t.table_name) as row_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    ORDER BY pg_total_relation_size(t.table_name::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify slow queries and suggest indexes
CREATE OR REPLACE FUNCTION suggest_missing_indexes()
RETURNS TABLE (
    suggested_index TEXT,
    reasoning TEXT
) AS $$
BEGIN
    RETURN QUERY
    VALUES 
        ('Consider analyzing pg_stat_statements for frequently used queries', 'Enable query performance tracking'),
        ('Review pg_stat_user_tables for tables with high sequential scans', 'High seq_scan values may indicate missing indexes'),
        ('Check pg_stat_user_indexes for unused indexes', 'Remove indexes with idx_scan = 0 if not needed'),
        ('Monitor autovacuum_count and analyze_count', 'Tables with high update/delete activity need regular maintenance');
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AUTOMATED MAINTENANCE PROCEDURES
-- =============================================================================

-- Procedure to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ANALYZE ' || quote_ident(table_record.tablename);
    END LOOP;
    
    -- Log the maintenance activity
    INSERT INTO maintenance_log (activity, description, completed_at)
    VALUES ('table_statistics_update', 'Updated statistics for all tables', NOW())
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create maintenance log table if it doesn't exist
CREATE TABLE IF NOT EXISTS maintenance_log (
    id SERIAL PRIMARY KEY,
    activity VARCHAR(100) NOT NULL,
    description TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERFORMANCE MONITORING VIEWS
-- =============================================================================

-- View for monitoring index effectiveness
CREATE OR REPLACE VIEW index_effectiveness_summary AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_category,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
JOIN pg_class ON pg_class.oid = indexrelid
ORDER BY idx_scan DESC;

-- View for table maintenance status
CREATE OR REPLACE VIEW table_maintenance_status AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins + n_tup_upd + n_tup_del as total_modifications,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    seq_scan as sequential_scans,
    seq_tup_read as sequential_tuples_read,
    idx_scan as index_scans,
    idx_tup_fetch as index_tuples_fetched,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY total_modifications DESC;

-- Comments for documentation
COMMENT ON FUNCTION analyze_index_usage IS 'Analyzes index usage patterns to identify optimization opportunities';
COMMENT ON FUNCTION get_table_sizes IS 'Returns size information for all tables and their indexes';
COMMENT ON FUNCTION suggest_missing_indexes IS 'Provides suggestions for database optimization';
COMMENT ON FUNCTION update_table_statistics IS 'Updates table statistics for query optimizer';
COMMENT ON VIEW index_effectiveness_summary IS 'Summary of index usage effectiveness';
COMMENT ON VIEW table_maintenance_status IS 'Current maintenance status of all tables';

-- Final index cleanup - remove any potentially duplicate or redundant indexes
-- This should be done carefully in production after analyzing usage patterns
-- Example of conditional index cleanup (commented out for safety):
/*
-- Remove duplicate indexes after confirming they're not being used
-- DROP INDEX IF EXISTS old_redundant_index_name;
*/