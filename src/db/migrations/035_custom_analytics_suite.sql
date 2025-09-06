-- Custom Analytics Suite Migration
-- Advanced dashboard builder and analytics infrastructure

-- Custom dashboard configurations
CREATE TABLE IF NOT EXISTS custom_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dashboard_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Dashboard configuration
    layout_config JSONB NOT NULL DEFAULT '{}', -- Grid layout, responsive breakpoints
    widget_configs JSONB NOT NULL DEFAULT '[]', -- Widget configurations and positions
    data_sources JSONB NOT NULL DEFAULT '{}', -- Connected data sources
    
    -- Dashboard settings
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    refresh_interval INTEGER DEFAULT 300, -- Seconds
    auto_refresh BOOLEAN DEFAULT TRUE,
    
    -- Sharing and permissions
    sharing_settings JSONB DEFAULT '{}',
    view_permissions JSONB DEFAULT '{}',
    edit_permissions JSONB DEFAULT '{}',
    
    -- Usage analytics
    view_count INTEGER DEFAULT 0,
    clone_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, slug),
    CONSTRAINT custom_dashboards_name_check CHECK (char_length(dashboard_name) >= 3)
);

-- Widget definitions and configurations
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN (
        'chart', 'table', 'metric', 'alert', 'player_card', 'leaderboard', 
        'news_feed', 'weather', 'schedule', 'standings', 'trade_analyzer'
    )),
    widget_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Widget configuration schema
    config_schema JSONB NOT NULL DEFAULT '{}', -- JSON schema for widget configuration
    default_config JSONB NOT NULL DEFAULT '{}', -- Default widget configuration
    
    -- Widget capabilities
    data_requirements JSONB DEFAULT '{}', -- Required data sources and formats
    supported_sports VARCHAR(20)[] DEFAULT '{}', -- Sports this widget supports
    premium_only BOOLEAN DEFAULT FALSE,
    
    -- Widget metadata
    category VARCHAR(50) NOT NULL,
    tags VARCHAR(50)[] DEFAULT '{}',
    version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    
    -- Widget status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'beta')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-defined custom metrics and calculations
CREATE TABLE IF NOT EXISTS custom_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Metric definition
    calculation_formula TEXT NOT NULL, -- SQL-like formula for calculation
    data_sources JSONB NOT NULL DEFAULT '{}', -- Required data tables/APIs
    parameters JSONB DEFAULT '{}', -- Configurable parameters
    
    -- Metric configuration
    output_type VARCHAR(30) DEFAULT 'numeric' CHECK (output_type IN ('numeric', 'percentage', 'currency', 'text', 'boolean')),
    format_options JSONB DEFAULT '{}', -- Display formatting options
    aggregation_method VARCHAR(30) DEFAULT 'sum' CHECK (aggregation_method IN ('sum', 'avg', 'min', 'max', 'count', 'custom')),
    
    -- Metric scope
    applies_to VARCHAR(30) DEFAULT 'player' CHECK (applies_to IN ('player', 'team', 'league', 'matchup', 'season')),
    supported_sports VARCHAR(20)[] DEFAULT '{}',
    
    -- Usage and validation
    is_validated BOOLEAN DEFAULT FALSE,
    validation_results JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    
    -- Sharing
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, metric_name)
);

-- Dashboard data sources and connections
CREATE TABLE IF NOT EXISTS dashboard_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
        'platform_data', 'external_api', 'custom_metric', 'spreadsheet', 'database'
    )),
    
    -- Connection configuration
    connection_config JSONB NOT NULL DEFAULT '{}', -- API keys, endpoints, etc.
    data_schema JSONB DEFAULT '{}', -- Expected data structure
    refresh_settings JSONB DEFAULT '{}', -- How often to refresh data
    
    -- Data source status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'testing')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    sync_frequency INTEGER DEFAULT 3600, -- Seconds
    
    -- Usage tracking
    dashboard_count INTEGER DEFAULT 0, -- How many dashboards use this source
    data_usage_mb DECIMAL(10,2) DEFAULT 0.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, source_name)
);

-- Advanced statistical models and analysis
CREATE TABLE IF NOT EXISTS statistical_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN (
        'linear_regression', 'logistic_regression', 'time_series', 'correlation_analysis',
        'monte_carlo', 'bayesian_analysis', 'clustering', 'classification'
    )),
    
    -- Model configuration
    model_parameters JSONB NOT NULL DEFAULT '{}', -- Model-specific parameters
    training_data_config JSONB DEFAULT '{}', -- Training data configuration
    feature_selection JSONB DEFAULT '{}', -- Selected features for the model
    
    -- Model performance
    performance_metrics JSONB DEFAULT '{}', -- Accuracy, R², RMSE, etc.
    validation_results JSONB DEFAULT '{}', -- Cross-validation results
    confidence_intervals JSONB DEFAULT '{}', -- Statistical confidence
    
    -- Model status and metadata
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'training', 'ready', 'deprecated')),
    training_start TIMESTAMP WITH TIME ZONE,
    training_end TIMESTAMP WITH TIME ZONE,
    last_prediction_at TIMESTAMP WITH TIME ZONE,
    
    -- Usage statistics
    prediction_count INTEGER DEFAULT 0,
    accuracy_score DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, model_name)
);

-- Model predictions and results storage
CREATE TABLE IF NOT EXISTS model_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES statistical_models(id) ON DELETE CASCADE,
    prediction_target VARCHAR(255) NOT NULL, -- What is being predicted
    prediction_context JSONB NOT NULL DEFAULT '{}', -- Input features and context
    
    -- Prediction results
    predicted_value DECIMAL(15,6),
    confidence_score DECIMAL(5,4),
    prediction_interval JSONB DEFAULT '{}', -- Upper/lower bounds
    feature_importance JSONB DEFAULT '{}', -- Which features drove the prediction
    
    -- Prediction metadata
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    target_date DATE, -- When the prediction is for
    sport VARCHAR(20),
    season INTEGER,
    week INTEGER,
    
    -- Validation and accuracy
    actual_value DECIMAL(15,6), -- Actual outcome (when available)
    accuracy_score DECIMAL(5,4), -- How accurate was this prediction
    is_validated BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market simulation configurations and results
CREATE TABLE IF NOT EXISTS market_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    simulation_name VARCHAR(255) NOT NULL,
    simulation_type VARCHAR(50) NOT NULL CHECK (simulation_type IN (
        'draft_simulation', 'trade_market', 'waiver_wire', 'season_outcome', 'championship_probability'
    )),
    
    -- Simulation configuration
    simulation_parameters JSONB NOT NULL DEFAULT '{}', -- Simulation-specific settings
    market_conditions JSONB DEFAULT '{}', -- Current market state
    scenario_variations JSONB DEFAULT '{}', -- Different scenarios to test
    
    -- Simulation execution
    iterations INTEGER DEFAULT 1000,
    random_seed INTEGER,
    execution_time_ms INTEGER,
    
    -- Results and analysis
    simulation_results JSONB DEFAULT '{}', -- Detailed simulation outcomes
    probability_distributions JSONB DEFAULT '{}', -- Outcome probability curves
    risk_metrics JSONB DEFAULT '{}', -- Risk assessment results
    optimization_suggestions JSONB DEFAULT '{}', -- Recommended actions
    
    -- Simulation status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, simulation_name)
);

-- Performance attribution analysis
CREATE TABLE IF NOT EXISTS performance_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    sport VARCHAR(20) NOT NULL,
    season INTEGER NOT NULL,
    
    -- Overall performance metrics
    total_points DECIMAL(10,2),
    league_rank INTEGER,
    points_above_average DECIMAL(10,2),
    percentile_rank DECIMAL(5,2),
    
    -- Attribution breakdown
    draft_contribution DECIMAL(10,2), -- Points from draft picks
    waiver_contribution DECIMAL(10,2), -- Points from waiver pickups
    trade_contribution DECIMAL(10,2), -- Points gained/lost from trades
    lineup_optimization DECIMAL(10,2), -- Points from optimal lineup setting
    luck_factor DECIMAL(10,2), -- Points from luck (injuries, randomness)
    
    -- Detailed analysis
    draft_analysis JSONB DEFAULT '{}', -- Draft round performance, value picks
    waiver_analysis JSONB DEFAULT '{}', -- Successful/missed pickups
    trade_analysis JSONB DEFAULT '{}', -- Trade values and outcomes
    lineup_analysis JSONB DEFAULT '{}', -- Bench points analysis
    
    -- Comparative metrics
    vs_league_average JSONB DEFAULT '{}', -- How each factor compared to league
    vs_optimal JSONB DEFAULT '{}', -- How close to theoretical optimal
    improvement_suggestions JSONB DEFAULT '{}', -- Specific recommendations
    
    -- Attribution metadata
    analysis_confidence DECIMAL(3,2) DEFAULT 0.0, -- Confidence in attribution
    methodology_version VARCHAR(10) DEFAULT '1.0',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, analysis_period_start, analysis_period_end, sport, season)
);

-- User analytics preferences and settings
CREATE TABLE IF NOT EXISTS user_analytics_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Dashboard preferences
    default_dashboard_id UUID REFERENCES custom_dashboards(id),
    preferred_chart_types JSONB DEFAULT '{}', -- Chart type preferences by data type
    color_scheme VARCHAR(20) DEFAULT 'astral_dark',
    animation_enabled BOOLEAN DEFAULT TRUE,
    
    -- Analytics preferences
    confidence_threshold DECIMAL(3,2) DEFAULT 0.80, -- Minimum confidence for recommendations
    risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    analysis_depth VARCHAR(20) DEFAULT 'standard' CHECK (analysis_depth IN ('basic', 'standard', 'advanced', 'expert')),
    
    -- Notification preferences
    alert_thresholds JSONB DEFAULT '{}', -- Custom alert thresholds
    notification_methods JSONB DEFAULT '{}', -- Email, push, in-app, etc.
    alert_frequency VARCHAR(20) DEFAULT 'real_time' CHECK (alert_frequency IN ('real_time', 'hourly', 'daily', 'weekly')),
    
    -- Data preferences
    preferred_data_sources VARCHAR(50)[] DEFAULT '{}',
    data_retention_days INTEGER DEFAULT 365,
    export_formats VARCHAR(20)[] DEFAULT '{"json","csv","pdf"}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_user_id ON custom_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_public ON custom_dashboards(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_template ON custom_dashboards(is_template) WHERE is_template = true;

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_category ON dashboard_widgets(category);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_status ON dashboard_widgets(status);

CREATE INDEX IF NOT EXISTS idx_custom_metrics_user_id ON custom_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_metrics_public ON custom_metrics(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_custom_metrics_applies_to ON custom_metrics(applies_to);

CREATE INDEX IF NOT EXISTS idx_dashboard_data_sources_user_id ON dashboard_data_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_data_sources_type ON dashboard_data_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_data_sources_status ON dashboard_data_sources(status);

CREATE INDEX IF NOT EXISTS idx_statistical_models_user_id ON statistical_models(user_id);
CREATE INDEX IF NOT EXISTS idx_statistical_models_type ON statistical_models(model_type);
CREATE INDEX IF NOT EXISTS idx_statistical_models_status ON statistical_models(status);

CREATE INDEX IF NOT EXISTS idx_model_predictions_model_id ON model_predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_model_predictions_target_date ON model_predictions(target_date);
CREATE INDEX IF NOT EXISTS idx_model_predictions_sport_season ON model_predictions(sport, season);

CREATE INDEX IF NOT EXISTS idx_market_simulations_user_id ON market_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_market_simulations_type ON market_simulations(simulation_type);
CREATE INDEX IF NOT EXISTS idx_market_simulations_status ON market_simulations(status);

CREATE INDEX IF NOT EXISTS idx_performance_attribution_user_id ON performance_attribution(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_attribution_period ON performance_attribution(analysis_period_start, analysis_period_end);
CREATE INDEX IF NOT EXISTS idx_performance_attribution_sport_season ON performance_attribution(sport, season);

-- Function to validate custom metric formulas
CREATE OR REPLACE FUNCTION validate_metric_formula(formula TEXT, data_sources JSONB)
RETURNS JSONB AS $$
DECLARE
    validation_result JSONB := '{"valid": false, "errors": [], "warnings": []}';
    sql_check TEXT;
BEGIN
    -- Basic syntax validation
    IF formula IS NULL OR LENGTH(TRIM(formula)) < 5 THEN
        validation_result := jsonb_set(validation_result, '{errors}', 
            validation_result->'errors' || '["Formula cannot be empty or too short"]'::jsonb);
        RETURN validation_result;
    END IF;
    
    -- Check for dangerous SQL keywords
    IF formula ~* '\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b' THEN
        validation_result := jsonb_set(validation_result, '{errors}', 
            validation_result->'errors' || '["Formula contains dangerous SQL keywords"]'::jsonb);
        RETURN validation_result;
    END IF;
    
    -- If we get here, basic validation passed
    validation_result := jsonb_set(validation_result, '{valid}', 'true'::jsonb);
    
    RETURN validation_result;
EXCEPTION
    WHEN OTHERS THEN
        validation_result := jsonb_set(validation_result, '{errors}', 
            validation_result->'errors' || ('["Validation error: ' || SQLERRM || '"]')::jsonb);
        RETURN validation_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update dashboard usage statistics
CREATE OR REPLACE FUNCTION update_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Track widget usage when added to dashboards
        IF TG_TABLE_NAME = 'custom_dashboards' THEN
            -- Count widget usage from the widget_configs
            DECLARE
                widget_config JSONB;
                widget_type TEXT;
            BEGIN
                FOR widget_config IN SELECT jsonb_array_elements(NEW.widget_configs)
                LOOP
                    widget_type := widget_config->>'type';
                    UPDATE dashboard_widgets 
                    SET usage_count = usage_count + 1 
                    WHERE widget_type = widget_type;
                END LOOP;
            END;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dashboard statistics
CREATE TRIGGER custom_dashboards_stats_trigger
    AFTER INSERT ON custom_dashboards
    FOR EACH ROW EXECUTE FUNCTION update_dashboard_stats();

-- Insert default dashboard widgets
INSERT INTO dashboard_widgets (widget_type, widget_name, description, config_schema, default_config, category, supported_sports) VALUES
('chart', 'Player Performance Chart', 'Visualize player performance over time', 
 '{"type": "object", "properties": {"chartType": {"type": "string", "enum": ["line", "bar", "area"]}, "timeRange": {"type": "string"}}}', 
 '{"chartType": "line", "timeRange": "season", "showTrendline": true}', 
 'visualization', '["football", "basketball", "baseball", "hockey", "soccer"]'),

('metric', 'Fantasy Points Display', 'Display key fantasy points metrics', 
 '{"type": "object", "properties": {"displayType": {"type": "string", "enum": ["large", "compact", "detailed"]}, "includeProjections": {"type": "boolean"}}}', 
 '{"displayType": "large", "includeProjections": true, "showComparison": true}', 
 'metrics', '["football", "basketball", "baseball", "hockey", "soccer"]'),

('table', 'Player Rankings Table', 'Sortable table of player rankings and stats', 
 '{"type": "object", "properties": {"columns": {"type": "array"}, "sortBy": {"type": "string"}, "pageSize": {"type": "number"}}}', 
 '{"columns": ["name", "position", "team", "points", "projection"], "sortBy": "points", "pageSize": 20}', 
 'data', '["football", "basketball", "baseball", "hockey", "soccer"]'),

('alert', 'Custom Alerts Panel', 'Display important alerts and notifications', 
 '{"type": "object", "properties": {"alertTypes": {"type": "array"}, "maxAlerts": {"type": "number"}}}', 
 '{"alertTypes": ["injury", "trade", "waiver"], "maxAlerts": 10, "autoRefresh": true}', 
 'alerts', '["football", "basketball", "baseball", "hockey", "soccer"]'),

('player_card', 'Player Information Card', 'Detailed player information and stats', 
 '{"type": "object", "properties": {"showImage": {"type": "boolean"}, "includeBio": {"type": "boolean"}}}', 
 '{"showImage": true, "includeBio": false, "showRecentNews": true}', 
 'player', '["football", "basketball", "baseball", "hockey", "soccer"]'),

('leaderboard', 'League Leaderboard', 'Current league standings and rankings', 
 '{"type": "object", "properties": {"showPositions": {"type": "array"}, "highlightUser": {"type": "boolean"}}}', 
 '{"showPositions": ["all"], "highlightUser": true, "showTrends": true}', 
 'league', '["football", "basketball", "baseball", "hockey", "soccer"]')
ON CONFLICT DO NOTHING;

-- Insert sample custom metrics for common fantasy calculations
INSERT INTO custom_metrics (user_id, metric_name, display_name, description, calculation_formula, output_type, applies_to, supported_sports) VALUES
-- This would normally require actual user IDs, but we'll create them as templates
(gen_random_uuid(), 'points_per_game', 'Points Per Game', 'Average fantasy points per game played', 
 'SUM(fantasy_points) / COUNT(games_played)', 'numeric', 'player', '["football", "basketball", "baseball", "hockey"]'),

(gen_random_uuid(), 'consistency_score', 'Consistency Score', 'Measure of week-to-week performance consistency', 
 '1 - (STDDEV(weekly_points) / AVG(weekly_points))', 'percentage', 'player', '["football", "basketball", "baseball", "hockey"]'),

(gen_random_uuid(), 'value_over_replacement', 'Value Over Replacement', 'Points above replacement level player', 
 'total_points - (SELECT AVG(total_points) FROM replacement_players)', 'numeric', 'player', '["football", "basketball", "baseball", "hockey"]')
ON CONFLICT DO NOTHING;