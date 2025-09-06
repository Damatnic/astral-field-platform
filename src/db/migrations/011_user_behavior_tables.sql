-- User Behavior Analysis Tables

CREATE TABLE IF NOT EXISTS user_activities (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'lineup_change', 'waiver_claim', 'trade_proposal', 'trade_accept', 
    'trade_decline', 'player_drop', 'player_add', 'view_analysis', 'request_advice'
  )),
  context JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  outcome JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_behavior_analysis (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  decision_patterns JSONB NOT NULL DEFAULT '[]',
  preferences JSONB NOT NULL DEFAULT '{}',
  risk_profile JSONB NOT NULL DEFAULT '{}',
  engagement_metrics JSONB NOT NULL DEFAULT '{}',
  learning_model JSONB NOT NULL DEFAULT '{}',
  analyzed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS personalized_recommendations (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('lineup', 'waiver', 'trade', 'strategy')),
  recommendation TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high')),
  personalized_factors TEXT[] NOT NULL DEFAULT '{}',
  expected_value DECIMAL(6,2) NOT NULL DEFAULT 0,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  viewed_at TIMESTAMP,
  acted_upon_at TIMESTAMP,
  feedback_score INTEGER CHECK (feedback_score BETWEEN 1 AND 5),
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_learning_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL,
  interaction_data JSONB NOT NULL DEFAULT '{}',
  learning_points JSONB NOT NULL DEFAULT '{}',
  model_updates JSONB NOT NULL DEFAULT '{}',
  accuracy_impact DECIMAL(5,4),
  session_duration INTEGER, -- seconds
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preference_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  preference_type VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB NOT NULL,
  change_reason VARCHAR(255),
  confidence_change DECIMAL(5,4),
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS behavioral_insights (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  insight_text TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  supporting_data JSONB NOT NULL DEFAULT '{}',
  actionable BOOLEAN DEFAULT TRUE,
  category VARCHAR(30) NOT NULL,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  acted_upon BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_performance_metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model_version VARCHAR(20) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,
  predicted_value DECIMAL(8,3),
  actual_value DECIMAL(8,3),
  accuracy_score DECIMAL(5,4),
  confidence_level DECIMAL(3,2),
  prediction_factors JSONB NOT NULL DEFAULT '{}',
  predicted_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_communication_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  communication_style VARCHAR(20) NOT NULL DEFAULT 'analytical' CHECK (communication_style IN ('analytical', 'casual', 'brief')),
  tone_preference VARCHAR(20) NOT NULL DEFAULT 'balanced' CHECK (tone_preference IN ('encouraging', 'neutral', 'analytical', 'competitive')),
  detail_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (detail_level IN ('minimal', 'medium', 'detailed', 'comprehensive')),
  use_emojis BOOLEAN DEFAULT FALSE,
  use_sports_metaphors BOOLEAN DEFAULT TRUE,
  preferred_examples VARCHAR(30) DEFAULT 'recent_games' CHECK (preferred_examples IN ('recent_games', 'historical', 'hypothetical', 'mixed')),
  explanation_style VARCHAR(30) DEFAULT 'logical' CHECK (explanation_style IN ('logical', 'story_based', 'data_driven', 'comparative')),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_action_type ON user_activities(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_timestamp ON user_activities(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_personalized_recommendations_user_id ON personalized_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_recommendations_generated_at ON personalized_recommendations(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_personalized_recommendations_category ON personalized_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_personalized_recommendations_urgency ON personalized_recommendations(urgency);
CREATE INDEX IF NOT EXISTS idx_personalized_recommendations_expires_at ON personalized_recommendations(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_learning_sessions_user_id ON user_learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_sessions_started_at ON user_learning_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_learning_sessions_type ON user_learning_sessions(session_type);

CREATE INDEX IF NOT EXISTS idx_behavioral_insights_user_id ON behavioral_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_insights_discovered_at ON behavioral_insights(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_insights_priority ON behavioral_insights(priority DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_insights_actionable ON behavioral_insights(actionable) WHERE actionable = TRUE;

CREATE INDEX IF NOT EXISTS idx_model_performance_user_id ON model_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_model_performance_predicted_at ON model_performance_metrics(predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_performance_accuracy ON model_performance_metrics(accuracy_score DESC);

CREATE INDEX IF NOT EXISTS idx_user_preference_history_user_id ON user_preference_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preference_history_changed_at ON user_preference_history(changed_at DESC);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_user_behavior_analysis_updated_at 
  BEFORE UPDATE ON user_behavior_analysis 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_communication_preferences_updated_at 
  BEFORE UPDATE ON user_communication_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_activities_recent ON user_activities(user_id, timestamp DESC) 
  WHERE timestamp > NOW() - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_recommendations_active ON personalized_recommendations(user_id, generated_at DESC) 
  WHERE expires_at IS NULL OR expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_insights_active ON behavioral_insights(user_id, priority DESC) 
  WHERE actionable = TRUE AND (expires_at IS NULL OR expires_at > NOW());

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_user_data()
RETURNS void AS $$
BEGIN
  -- Delete old activities (keep last 90 days)
  DELETE FROM user_activities WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Delete expired recommendations
  DELETE FROM personalized_recommendations WHERE expires_at < NOW();
  
  -- Delete expired insights
  DELETE FROM behavioral_insights WHERE expires_at < NOW();
  
  -- Delete old learning sessions (keep last 180 days)
  DELETE FROM user_learning_sessions WHERE started_at < NOW() - INTERVAL '180 days';
  
  -- Delete old preference history (keep last 365 days)
  DELETE FROM user_preference_history WHERE changed_at < NOW() - INTERVAL '365 days';
  
  -- Delete old model metrics (keep last 180 days)
  DELETE FROM model_performance_metrics WHERE predicted_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (would be set up with pg_cron if available)
-- SELECT cron.schedule('cleanup-user-data', '0 2 * * *', 'SELECT cleanup_old_user_data();');