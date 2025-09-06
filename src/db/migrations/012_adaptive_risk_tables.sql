-- Adaptive Risk Modeling Tables

CREATE TABLE IF NOT EXISTS adaptive_risk_models (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  risk_profile JSONB NOT NULL DEFAULT '{}',
  adaptation_history JSONB NOT NULL DEFAULT '[]',
  model_accuracy DECIMAL(4,3) NOT NULL DEFAULT 0.600,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  confidence_level DECIMAL(3,2) NOT NULL DEFAULT 0.60,
  personalized_thresholds JSONB NOT NULL DEFAULT '{}',
  situational_modifiers JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS risk_scenarios (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_type VARCHAR(30) NOT NULL CHECK (scenario_type IN ('lineup_decision', 'waiver_pickup', 'trade_evaluation', 'draft_choice')),
  context JSONB NOT NULL DEFAULT '{}',
  risk_metrics JSONB NOT NULL DEFAULT '{}',
  advice_given JSONB,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_decisions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_id VARCHAR(255) REFERENCES risk_scenarios(id) ON DELETE CASCADE,
  chosen_option VARCHAR(255) NOT NULL,
  recommended_option VARCHAR(255) NOT NULL,
  risk_alignment VARCHAR(15) NOT NULL CHECK (risk_alignment IN ('conservative', 'moderate', 'aggressive')),
  decision_reasoning TEXT,
  confidence_level DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  outcome JSONB,
  learning_weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_adaptations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  adaptation_trigger VARCHAR(50) NOT NULL CHECK (adaptation_trigger IN ('decision_outcome', 'pattern_change', 'feedback', 'performance_shift')),
  model_component VARCHAR(50) NOT NULL,
  old_value DECIMAL(8,5) NOT NULL,
  new_value DECIMAL(8,5) NOT NULL,
  adaptation_strength DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  reasoning TEXT,
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMP,
  validation_result VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS situational_risk_patterns (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  situation_type VARCHAR(50) NOT NULL,
  situation_context JSONB NOT NULL DEFAULT '{}',
  risk_level DECIMAL(3,2) NOT NULL,
  decision_count INTEGER NOT NULL DEFAULT 1,
  success_rate DECIMAL(4,3),
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  last_observed TIMESTAMP NOT NULL DEFAULT NOW(),
  pattern_strength DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, situation_type, situation_context)
);

CREATE TABLE IF NOT EXISTS risk_model_performance (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model_version VARCHAR(20) NOT NULL,
  prediction_accuracy DECIMAL(4,3) NOT NULL,
  recommendation_follow_rate DECIMAL(4,3),
  avg_outcome_improvement DECIMAL(6,2),
  total_decisions INTEGER NOT NULL DEFAULT 0,
  successful_predictions INTEGER NOT NULL DEFAULT 0,
  evaluation_period_start TIMESTAMP NOT NULL,
  evaluation_period_end TIMESTAMP NOT NULL,
  performance_factors JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_id VARCHAR(255) REFERENCES risk_scenarios(id) ON DELETE CASCADE,
  decision_id VARCHAR(255) REFERENCES risk_decisions(id) ON DELETE CASCADE,
  feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('rating', 'text', 'outcome_correction', 'preference_update')),
  feedback_value JSONB NOT NULL DEFAULT '{}',
  impact_on_model DECIMAL(3,2) DEFAULT 1.0,
  processed BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_scenario_templates (
  id SERIAL PRIMARY KEY,
  scenario_type VARCHAR(30) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  default_context JSONB NOT NULL DEFAULT '{}',
  risk_factors TEXT[] NOT NULL DEFAULT '{}',
  complexity_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (complexity_level IN ('simple', 'medium', 'complex')),
  success_criteria JSONB NOT NULL DEFAULT '{}',
  created_by VARCHAR(50) DEFAULT 'system',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(scenario_type, template_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_adaptive_risk_models_user_id ON adaptive_risk_models(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_risk_models_last_updated ON adaptive_risk_models(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_risk_scenarios_user_id ON risk_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_scenarios_type ON risk_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_risk_scenarios_generated_at ON risk_scenarios(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_scenarios_user_generated ON risk_scenarios(user_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_decisions_user_id ON risk_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_decisions_timestamp ON risk_decisions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_decisions_alignment ON risk_decisions(risk_alignment);
CREATE INDEX IF NOT EXISTS idx_risk_decisions_user_timestamp ON risk_decisions(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_risk_adaptations_user_id ON risk_adaptations(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_adaptations_applied_at ON risk_adaptations(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_adaptations_trigger ON risk_adaptations(adaptation_trigger);

CREATE INDEX IF NOT EXISTS idx_situational_patterns_user_id ON situational_risk_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_situational_patterns_type ON situational_risk_patterns(situation_type);
CREATE INDEX IF NOT EXISTS idx_situational_patterns_last_observed ON situational_risk_patterns(last_observed DESC);

CREATE INDEX IF NOT EXISTS idx_risk_feedback_user_id ON risk_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_feedback_submitted_at ON risk_feedback(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_feedback_processed ON risk_feedback(processed, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_model_performance_user_id ON risk_model_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_model_performance_calculated_at ON risk_model_performance(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_model_performance_accuracy ON risk_model_performance(prediction_accuracy DESC);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_situational_risk_patterns_updated_at 
  BEFORE UPDATE ON situational_risk_patterns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_risk_decisions_recent ON risk_decisions(user_id, timestamp DESC) 
  WHERE timestamp > NOW() - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_scenarios_active ON risk_scenarios(user_id, generated_at DESC) 
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_adaptations_recent ON risk_adaptations(user_id, applied_at DESC) 
  WHERE applied_at > NOW() - INTERVAL '14 days';

-- Function to calculate risk model accuracy
CREATE OR REPLACE FUNCTION calculate_risk_model_accuracy(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS DECIMAL AS $$
DECLARE
  total_decisions INTEGER;
  successful_predictions INTEGER;
  accuracy DECIMAL;
BEGIN
  -- Count total decisions with outcomes in the specified period
  SELECT COUNT(*) INTO total_decisions
  FROM risk_decisions rd
  WHERE rd.user_id = p_user_id 
    AND rd.timestamp > NOW() - INTERVAL '1 day' * p_days
    AND rd.outcome IS NOT NULL;
  
  -- Count successful predictions (where outcome matched expectation)
  SELECT COUNT(*) INTO successful_predictions
  FROM risk_decisions rd
  WHERE rd.user_id = p_user_id 
    AND rd.timestamp > NOW() - INTERVAL '1 day' * p_days
    AND rd.outcome IS NOT NULL
    AND (rd.outcome->>'success')::boolean = true;
  
  -- Calculate accuracy
  IF total_decisions > 0 THEN
    accuracy := successful_predictions::decimal / total_decisions::decimal;
  ELSE
    accuracy := 0.5; -- Default accuracy for new users
  END IF;
  
  RETURN accuracy;
END;
$$ LANGUAGE plpgsql;

-- Function to update risk model performance metrics
CREATE OR REPLACE FUNCTION update_risk_model_performance()
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Update performance metrics for all users with recent decisions
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM risk_decisions 
    WHERE timestamp > NOW() - INTERVAL '7 days'
  LOOP
    INSERT INTO risk_model_performance (
      user_id,
      model_version,
      prediction_accuracy,
      recommendation_follow_rate,
      total_decisions,
      successful_predictions,
      evaluation_period_start,
      evaluation_period_end
    )
    SELECT 
      user_record.user_id,
      COALESCE(arm.version, '1.0'),
      calculate_risk_model_accuracy(user_record.user_id, 30),
      COALESCE(
        (SELECT COUNT(*) FILTER (WHERE chosen_option = recommended_option)::decimal / 
         NULLIF(COUNT(*), 0) 
         FROM risk_decisions 
         WHERE user_id = user_record.user_id 
           AND timestamp > NOW() - INTERVAL '30 days'), 0.5
      ),
      (SELECT COUNT(*) FROM risk_decisions WHERE user_id = user_record.user_id AND timestamp > NOW() - INTERVAL '30 days'),
      (SELECT COUNT(*) FROM risk_decisions WHERE user_id = user_record.user_id AND timestamp > NOW() - INTERVAL '30 days' AND (outcome->>'success')::boolean = true),
      NOW() - INTERVAL '30 days',
      NOW()
    FROM adaptive_risk_models arm
    WHERE arm.user_id = user_record.user_id
    ON CONFLICT (user_id, model_version, evaluation_period_start) DO UPDATE SET
      prediction_accuracy = EXCLUDED.prediction_accuracy,
      recommendation_follow_rate = EXCLUDED.recommendation_follow_rate,
      total_decisions = EXCLUDED.total_decisions,
      successful_predictions = EXCLUDED.successful_predictions,
      calculated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old risk data
CREATE OR REPLACE FUNCTION cleanup_old_risk_data()
RETURNS void AS $$
BEGIN
  -- Delete old scenarios (keep last 180 days)
  DELETE FROM risk_scenarios WHERE generated_at < NOW() - INTERVAL '180 days';
  
  -- Delete old decisions (keep last 365 days)
  DELETE FROM risk_decisions WHERE timestamp < NOW() - INTERVAL '365 days';
  
  -- Delete old adaptations (keep last 90 days)
  DELETE FROM risk_adaptations WHERE applied_at < NOW() - INTERVAL '90 days';
  
  -- Delete old feedback (keep last 180 days)
  DELETE FROM risk_feedback WHERE submitted_at < NOW() - INTERVAL '180 days';
  
  -- Delete old performance metrics (keep last 365 days)
  DELETE FROM risk_model_performance WHERE calculated_at < NOW() - INTERVAL '365 days';
  
  -- Update situational patterns (decay old patterns)
  UPDATE situational_risk_patterns 
  SET pattern_strength = pattern_strength * 0.95
  WHERE last_observed < NOW() - INTERVAL '30 days';
  
  -- Delete very weak patterns
  DELETE FROM situational_risk_patterns WHERE pattern_strength < 0.1;
END;
$$ LANGUAGE plpgsql;

-- Insert default scenario templates
INSERT INTO risk_scenario_templates (scenario_type, template_name, default_context, risk_factors, complexity_level) VALUES
('lineup_decision', 'Weekly Lineup Optimization', '{"week_type": "regular", "position_groups": ["QB", "RB", "WR", "TE", "FLEX"]}', 
 ARRAY['projection_variance', 'matchup_difficulty', 'weather_impact', 'injury_risk'], 'medium'),
 
('waiver_pickup', 'Waiver Wire Priority', '{"budget_remaining": 100, "roster_needs": [], "league_competition": "medium"}', 
 ARRAY['player_upside', 'roster_fit', 'opportunity_cost', 'league_competition'], 'medium'),
 
('trade_evaluation', 'Trade Opportunity Assessment', '{"trade_deadline_proximity": false, "playoff_relevance": false}', 
 ARRAY['value_differential', 'roster_balance', 'schedule_impact', 'playoff_implications'], 'complex'),
 
('draft_choice', 'Draft Pick Selection', '{"draft_round": 1, "picks_remaining": 15, "strategy": "balanced"}', 
 ARRAY['value_over_replacement', 'positional_scarcity', 'roster_construction', 'league_format'], 'complex');

-- Create view for risk model insights
CREATE OR REPLACE VIEW user_risk_insights AS
SELECT 
  arm.user_id,
  arm.version,
  arm.model_accuracy,
  arm.confidence_level,
  arm.last_updated,
  (arm.risk_profile->>'baseRisk')::decimal as base_risk_tolerance,
  
  -- Recent decision patterns
  COALESCE(recent_decisions.total_decisions, 0) as decisions_last_30_days,
  COALESCE(recent_decisions.conservative_pct, 0) as conservative_percentage,
  COALESCE(recent_decisions.moderate_pct, 0) as moderate_percentage, 
  COALESCE(recent_decisions.aggressive_pct, 0) as aggressive_percentage,
  
  -- Performance metrics
  COALESCE(performance.prediction_accuracy, arm.model_accuracy) as current_accuracy,
  COALESCE(performance.recommendation_follow_rate, 0.5) as advice_follow_rate,
  
  -- Adaptation activity
  COALESCE(adaptations.recent_adaptations, 0) as adaptations_last_14_days

FROM adaptive_risk_models arm

LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_decisions,
    ROUND(COUNT(*) FILTER (WHERE risk_alignment = 'conservative') * 100.0 / COUNT(*), 1) as conservative_pct,
    ROUND(COUNT(*) FILTER (WHERE risk_alignment = 'moderate') * 100.0 / COUNT(*), 1) as moderate_pct,
    ROUND(COUNT(*) FILTER (WHERE risk_alignment = 'aggressive') * 100.0 / COUNT(*), 1) as aggressive_pct
  FROM risk_decisions 
  WHERE timestamp > NOW() - INTERVAL '30 days'
  GROUP BY user_id
) recent_decisions ON arm.user_id = recent_decisions.user_id

LEFT JOIN (
  SELECT DISTINCT ON (user_id) 
    user_id, 
    prediction_accuracy, 
    recommendation_follow_rate
  FROM risk_model_performance 
  ORDER BY user_id, calculated_at DESC
) performance ON arm.user_id = performance.user_id

LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as recent_adaptations
  FROM risk_adaptations
  WHERE applied_at > NOW() - INTERVAL '14 days'
  GROUP BY user_id
) adaptations ON arm.user_id = adaptations.user_id;