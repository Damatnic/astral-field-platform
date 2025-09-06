-- Personalized Communication Tables

CREATE TABLE IF NOT EXISTS user_communication_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  primary_style VARCHAR(20) NOT NULL DEFAULT 'casual' CHECK (primary_style IN ('conservative', 'aggressive', 'analytical', 'casual', 'encouraging', 'competitive')),
  secondary_style VARCHAR(20) CHECK (secondary_style IN ('conservative', 'aggressive', 'analytical', 'casual', 'encouraging', 'competitive')),
  adaptation_history JSONB NOT NULL DEFAULT '[]',
  preferences JSONB NOT NULL DEFAULT '{}',
  contextual_styles JSONB NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.60,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  response_patterns JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS communication_templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('recommendation', 'analysis', 'alert', 'feedback', 'greeting')),
  communication_style VARCHAR(20) NOT NULL CHECK (communication_style IN ('conservative', 'aggressive', 'analytical', 'casual', 'encouraging', 'competitive')),
  template_content TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(4,3) NOT NULL DEFAULT 0.500,
  contexts TEXT[] NOT NULL DEFAULT '{}',
  effectiveness_score DECIMAL(3,2) DEFAULT 0.50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(template_id)
);

CREATE TABLE IF NOT EXISTS communication_tracking (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  style_used VARCHAR(20) NOT NULL,
  template_used VARCHAR(100),
  confidence DECIMAL(3,2) NOT NULL,
  personalization_factors JSONB NOT NULL DEFAULT '{}',
  context VARCHAR(50) NOT NULL,
  estimated_engagement DECIMAL(3,2) NOT NULL,
  actual_engagement DECIMAL(3,2),
  user_response VARCHAR(20),
  response_time_minutes INTEGER,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS style_adaptations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  adaptation_trigger VARCHAR(50) NOT NULL CHECK (adaptation_trigger IN ('feedback', 'behavior_change', 'context_switch', 'performance', 'manual')),
  from_style VARCHAR(20) NOT NULL,
  to_style VARCHAR(20) NOT NULL,
  context VARCHAR(50),
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  reasoning TEXT,
  performance_before DECIMAL(3,2),
  performance_after DECIMAL(3,2),
  applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMP,
  validation_result VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_feedback (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tracking_id INTEGER REFERENCES communication_tracking(id) ON DELETE CASCADE,
  feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('rating', 'reaction', 'response_time', 'action_taken', 'explicit_feedback')),
  feedback_value JSONB NOT NULL DEFAULT '{}',
  sentiment_score DECIMAL(3,2),
  engagement_indicator VARCHAR(20),
  action_taken VARCHAR(50),
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  impact_on_profile DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_experiments (
  id SERIAL PRIMARY KEY,
  experiment_name VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  experiment_type VARCHAR(30) NOT NULL CHECK (experiment_type IN ('ab_test', 'style_comparison', 'template_test', 'preference_test')),
  control_variant JSONB NOT NULL DEFAULT '{}',
  test_variant JSONB NOT NULL DEFAULT '{}',
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  results JSONB DEFAULT '{}',
  statistical_significance DECIMAL(4,3),
  winner VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_analytics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  analysis_period_start TIMESTAMP NOT NULL,
  analysis_period_end TIMESTAMP NOT NULL,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  average_engagement DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  response_rate DECIMAL(4,3) NOT NULL DEFAULT 0.000,
  average_response_time_minutes INTEGER,
  style_distribution JSONB NOT NULL DEFAULT '{}',
  most_effective_style VARCHAR(20),
  least_effective_style VARCHAR(20),
  preference_stability_score DECIMAL(3,2),
  adaptation_frequency INTEGER DEFAULT 0,
  user_satisfaction_score DECIMAL(3,2),
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communication_insights (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL,
  insight_title VARCHAR(200) NOT NULL,
  insight_description TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  actionable BOOLEAN DEFAULT TRUE,
  category VARCHAR(30) NOT NULL,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  supporting_data JSONB NOT NULL DEFAULT '{}',
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  acted_upon BOOLEAN DEFAULT FALSE,
  impact_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_communication_profiles_user_id ON user_communication_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_profiles_primary_style ON user_communication_profiles(primary_style);
CREATE INDEX IF NOT EXISTS idx_communication_profiles_last_updated ON user_communication_profiles(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_communication_templates_style ON communication_templates(communication_style);
CREATE INDEX IF NOT EXISTS idx_communication_templates_category ON communication_templates(category);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON communication_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_communication_templates_effectiveness ON communication_templates(effectiveness_score DESC);

CREATE INDEX IF NOT EXISTS idx_communication_tracking_user_id ON communication_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_tracking_generated_at ON communication_tracking(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_tracking_style ON communication_tracking(style_used);
CREATE INDEX IF NOT EXISTS idx_communication_tracking_user_generated ON communication_tracking(user_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_style_adaptations_user_id ON style_adaptations(user_id);
CREATE INDEX IF NOT EXISTS idx_style_adaptations_applied_at ON style_adaptations(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_adaptations_trigger ON style_adaptations(adaptation_trigger);

CREATE INDEX IF NOT EXISTS idx_message_feedback_user_id ON message_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_submitted_at ON message_feedback(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_feedback_processed ON message_feedback(processed_at) WHERE processed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_communication_experiments_user_id ON communication_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_experiments_status ON communication_experiments(status);
CREATE INDEX IF NOT EXISTS idx_communication_experiments_dates ON communication_experiments(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_communication_analytics_user_id ON communication_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_analytics_calculated_at ON communication_analytics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_analytics_period ON communication_analytics(analysis_period_start, analysis_period_end);

CREATE INDEX IF NOT EXISTS idx_communication_insights_user_id ON communication_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_insights_discovered_at ON communication_insights(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_insights_actionable ON communication_insights(actionable) WHERE actionable = TRUE;
CREATE INDEX IF NOT EXISTS idx_communication_insights_priority ON communication_insights(priority DESC);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_communication_templates_updated_at 
  BEFORE UPDATE ON communication_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tracking_recent ON communication_tracking(user_id, generated_at DESC) 
  WHERE generated_at > NOW() - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_adaptations_recent ON style_adaptations(user_id, applied_at DESC) 
  WHERE applied_at > NOW() - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_feedback_unprocessed ON message_feedback(user_id, submitted_at DESC) 
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_insights_active ON communication_insights(user_id, priority DESC) 
  WHERE actionable = TRUE AND (expires_at IS NULL OR expires_at > NOW());

-- Functions for communication analytics
CREATE OR REPLACE FUNCTION calculate_communication_effectiveness(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS DECIMAL AS $$
DECLARE
  total_messages INTEGER;
  total_engagement DECIMAL;
  avg_engagement DECIMAL;
BEGIN
  -- Count total messages sent in the specified period
  SELECT COUNT(*), COALESCE(AVG(actual_engagement), AVG(estimated_engagement))
  INTO total_messages, avg_engagement
  FROM communication_tracking
  WHERE user_id = p_user_id 
    AND generated_at > NOW() - INTERVAL '1 day' * p_days;
  
  -- Return average engagement or default if no messages
  RETURN COALESCE(avg_engagement, 0.5);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_optimal_communication_style(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  optimal_style VARCHAR(20);
BEGIN
  -- Find the style with the highest average engagement
  SELECT style_used INTO optimal_style
  FROM communication_tracking
  WHERE user_id = p_user_id 
    AND generated_at > NOW() - INTERVAL '30 days'
    AND actual_engagement IS NOT NULL
  GROUP BY style_used
  ORDER BY AVG(actual_engagement) DESC
  LIMIT 1;
  
  -- Return the optimal style or default to current primary style
  RETURN COALESCE(optimal_style, 
    (SELECT primary_style FROM user_communication_profiles WHERE user_id = p_user_id),
    'casual'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_template_effectiveness()
RETURNS void AS $$
DECLARE
  template_record RECORD;
BEGIN
  -- Update effectiveness scores for all active templates
  FOR template_record IN 
    SELECT template_id, 
           COUNT(*) as usage_count,
           AVG(COALESCE(actual_engagement, estimated_engagement)) as avg_effectiveness
    FROM communication_tracking ct
    JOIN communication_templates t ON ct.template_used = t.template_id
    WHERE ct.generated_at > NOW() - INTERVAL '30 days'
      AND t.is_active = TRUE
    GROUP BY template_id
  LOOP
    UPDATE communication_templates 
    SET effectiveness_score = template_record.avg_effectiveness,
        usage_count = template_record.usage_count,
        updated_at = NOW()
    WHERE template_id = template_record.template_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically adapt communication styles based on performance
CREATE OR REPLACE FUNCTION auto_adapt_communication_styles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  current_effectiveness DECIMAL;
  optimal_style VARCHAR(20);
BEGIN
  -- Check all users with sufficient communication history
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM communication_tracking 
    WHERE generated_at > NOW() - INTERVAL '7 days'
    GROUP BY user_id
    HAVING COUNT(*) >= 5
  LOOP
    -- Calculate current style effectiveness
    current_effectiveness := calculate_communication_effectiveness(user_record.user_id, 30);
    
    -- Get optimal style
    optimal_style := get_optimal_communication_style(user_record.user_id);
    
    -- Check if adaptation is needed (current effectiveness < 0.6 and optimal style different)
    IF current_effectiveness < 0.6 AND optimal_style IS NOT NULL AND 
       optimal_style != (SELECT primary_style FROM user_communication_profiles WHERE user_id = user_record.user_id)
    THEN
      -- Record the adaptation
      INSERT INTO style_adaptations (
        user_id, adaptation_trigger, from_style, to_style, 
        confidence, reasoning, performance_before
      )
      SELECT 
        user_record.user_id,
        'performance',
        primary_style,
        optimal_style,
        0.8,
        'Auto-adaptation due to low engagement scores',
        current_effectiveness
      FROM user_communication_profiles 
      WHERE user_id = user_record.user_id;
      
      -- Update the user's primary style
      UPDATE user_communication_profiles 
      SET primary_style = optimal_style,
          confidence = LEAST(confidence + 0.1, 0.95),
          last_updated = NOW()
      WHERE user_id = user_record.user_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert default communication templates
INSERT INTO communication_templates (template_id, category, communication_style, template_content, variables) VALUES
-- Conservative style templates
('conservative_recommendation_1', 'recommendation', 'conservative', 'Based on careful analysis, you might want to consider {playerName}. The projection suggests {projectedPoints} points with a relatively stable floor.', ARRAY['playerName', 'projectedPoints']),
('conservative_analysis_1', 'analysis', 'conservative', 'The matchup analysis indicates {reasoning}. While there are no guarantees, the data suggests a cautious approach would be prudent.', ARRAY['reasoning']),
('conservative_alert_1', 'alert', 'conservative', 'Please note: {playerName} has been reported as {injuryStatus}. You may want to review your lineup as a precaution.', ARRAY['playerName', 'injuryStatus']),

-- Aggressive style templates  
('aggressive_recommendation_1', 'recommendation', 'aggressive', 'This is your moment! {playerName} is primed for a huge week - {projectedPoints} points incoming. Don''t hesitate!', ARRAY['playerName', 'projectedPoints']),
('aggressive_analysis_1', 'analysis', 'aggressive', 'The stars are aligning perfectly! {reasoning} This is exactly the kind of opportunity that wins championships!', ARRAY['reasoning']),
('aggressive_alert_1', 'alert', 'aggressive', 'URGENT: {playerName} update - {injuryStatus}! Time to pivot quickly and capitalize on this situation!', ARRAY['playerName', 'injuryStatus']),

-- Analytical style templates
('analytical_recommendation_1', 'recommendation', 'analytical', 'Statistical analysis indicates {playerName} has a 73% probability of exceeding {projectedPoints} points based on {reasoning}.', ARRAY['playerName', 'projectedPoints', 'reasoning']),
('analytical_analysis_1', 'analysis', 'analytical', 'Cross-referencing multiple data sources: {reasoning}. Confidence interval suggests optimal strategy with 85% certainty.', ARRAY['reasoning']),
('analytical_alert_1', 'alert', 'analytical', 'Data update: {playerName} status changed to {injuryStatus}. Recommendation algorithm suggests immediate lineup review.', ARRAY['playerName', 'injuryStatus']),

-- Casual style templates
('casual_recommendation_1', 'recommendation', 'casual', 'Hey! Just wanted to give you a heads up - {playerName} looks really solid this week. I''m thinking {projectedPoints} points. What do you think?', ARRAY['playerName', 'projectedPoints']),
('casual_analysis_1', 'analysis', 'casual', 'So here''s what I''m seeing: {reasoning}. Pretty interesting matchup if you ask me!', ARRAY['reasoning']),
('casual_alert_1', 'alert', 'casual', 'Quick update on {playerName} - they''re now listed as {injuryStatus}. Might want to double-check your lineup!', ARRAY['playerName', 'injuryStatus']),

-- Encouraging style templates
('encouraging_recommendation_1', 'recommendation', 'encouraging', 'You''re making great decisions this season! {playerName} could be another winning move - projecting {projectedPoints} points!', ARRAY['playerName', 'projectedPoints']),
('encouraging_analysis_1', 'analysis', 'encouraging', 'Your analytical skills are really paying off! {reasoning} This insight could give you a real edge!', ARRAY['reasoning']),
('encouraging_alert_1', 'alert', 'encouraging', 'Stay positive! While {playerName} is {injuryStatus}, this could be an opportunity to showcase your adaptability!', ARRAY['playerName', 'injuryStatus']),

-- Competitive style templates
('competitive_recommendation_1', 'recommendation', 'competitive', 'Time to dominate! {playerName} is your secret weapon this week - {projectedPoints} points to crush the competition!', ARRAY['playerName', 'projectedPoints']),
('competitive_analysis_1', 'analysis', 'competitive', 'Here''s your competitive advantage: {reasoning}. This is how championships are won!', ARRAY['reasoning']),
('competitive_alert_1', 'alert', 'competitive', 'Game changer! {playerName} is {injuryStatus} - time to outmaneuver your opponents and seize this opportunity!', ARRAY['playerName', 'injuryStatus']);

-- Create view for communication performance insights
CREATE OR REPLACE VIEW communication_performance_insights AS
SELECT 
  ucp.user_id,
  ucp.primary_style,
  ucp.confidence,
  ucp.last_updated,
  
  -- Recent activity metrics
  COALESCE(recent_stats.messages_sent, 0) as messages_last_30_days,
  COALESCE(recent_stats.avg_engagement, 0.5) as average_engagement,
  COALESCE(recent_stats.response_rate, 0) as response_rate,
  
  -- Style effectiveness
  COALESCE(style_effectiveness.effectiveness, 0.5) as style_effectiveness,
  get_optimal_communication_style(ucp.user_id) as recommended_style,
  
  -- Adaptation history
  COALESCE(adaptation_stats.total_adaptations, 0) as total_adaptations,
  COALESCE(adaptation_stats.recent_adaptations, 0) as adaptations_last_30_days

FROM user_communication_profiles ucp

LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as messages_sent,
    AVG(COALESCE(actual_engagement, estimated_engagement)) as avg_engagement,
    COUNT(*) FILTER (WHERE user_response IS NOT NULL) * 1.0 / NULLIF(COUNT(*), 0) as response_rate
  FROM communication_tracking 
  WHERE generated_at > NOW() - INTERVAL '30 days'
  GROUP BY user_id
) recent_stats ON ucp.user_id = recent_stats.user_id

LEFT JOIN (
  SELECT 
    user_id,
    AVG(COALESCE(actual_engagement, estimated_engagement)) as effectiveness
  FROM communication_tracking ct
  JOIN user_communication_profiles ucp ON ct.user_id = ucp.user_id
  WHERE ct.style_used = ucp.primary_style
    AND ct.generated_at > NOW() - INTERVAL '30 days'
  GROUP BY user_id
) style_effectiveness ON ucp.user_id = style_effectiveness.user_id

LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_adaptations,
    COUNT(*) FILTER (WHERE applied_at > NOW() - INTERVAL '30 days') as recent_adaptations
  FROM style_adaptations
  GROUP BY user_id
) adaptation_stats ON ucp.user_id = adaptation_stats.user_id;