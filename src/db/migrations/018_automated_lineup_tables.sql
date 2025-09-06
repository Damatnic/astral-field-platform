-- Automated Lineup Optimization Tables

CREATE TABLE IF NOT EXISTS league_automation_settings (
  id SERIAL PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  enable_automation BOOLEAN DEFAULT TRUE,
  inactivity_threshold INTEGER DEFAULT 7, -- days
  automation_level VARCHAR(20) DEFAULT 'suggestions' CHECK (automation_level IN ('notifications', 'suggestions', 'auto_set')),
  preserve_user_preferences BOOLEAN DEFAULT TRUE,
  respect_manual_overrides BOOLEAN DEFAULT TRUE,
  notify_on_changes BOOLEAN DEFAULT TRUE,
  require_commissioner_approval BOOLEAN DEFAULT FALSE,
  blacklist_players TEXT[] DEFAULT '{}',
  position_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(league_id)
);

CREATE TABLE IF NOT EXISTS lineup_optimizations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  original_lineup JSONB NOT NULL DEFAULT '{}',
  optimized_lineup JSONB NOT NULL DEFAULT '{}',
  changes JSONB NOT NULL DEFAULT '[]',
  projection_improvement DECIMAL(5,2) NOT NULL DEFAULT 0,
  reasoning TEXT[] NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP,
  user_feedback VARCHAR(20) CHECK (user_feedback IN ('helpful', 'neutral', 'unhelpful')),
  actual_improvement DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automated_actions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('lineup_optimization', 'waiver_claim', 'drop_player', 'notification_sent')),
  action_data JSONB NOT NULL DEFAULT '{}',
  automation_level VARCHAR(20) NOT NULL,
  performed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reverted_at TIMESTAMP,
  revert_reason TEXT,
  user_notified BOOLEAN DEFAULT FALSE,
  commissioner_approved BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_activity_tracking (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  activity_type VARCHAR(30) NOT NULL,
  activity_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inactivity_analysis (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inactivity_level VARCHAR(15) NOT NULL CHECK (inactivity_level IN ('mild', 'moderate', 'severe', 'abandoned')),
  days_since_activity INTEGER NOT NULL,
  last_lineup_change TIMESTAMP,
  last_login TIMESTAMP,
  last_waiver_claim TIMESTAMP,
  last_trade TIMESTAMP,
  recent_actions_count INTEGER DEFAULT 0,
  response_pattern VARCHAR(15) NOT NULL CHECK (response_pattern IN ('active', 'sporadic', 'inactive')),
  automation_recommendation VARCHAR(20) NOT NULL CHECK (automation_recommendation IN ('none', 'notifications', 'suggestions', 'auto_set')),
  improvement_potential DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, league_id, analysis_date)
);

CREATE TABLE IF NOT EXISTS lineup_patterns (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  pattern_type VARCHAR(30) NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  frequency INTEGER DEFAULT 1,
  success_rate DECIMAL(4,3) DEFAULT 0.500,
  confidence DECIMAL(3,2) DEFAULT 0.50,
  first_observed TIMESTAMP NOT NULL DEFAULT NOW(),
  last_observed TIMESTAMP NOT NULL DEFAULT NOW(),
  pattern_strength DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS optimization_feedback (
  id SERIAL PRIMARY KEY,
  optimization_id INTEGER REFERENCES lineup_optimizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('rating', 'applied', 'ignored', 'modified', 'text_feedback')),
  feedback_value JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  impact_on_algorithm DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commissioner_approvals (
  id SERIAL PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  automated_action_id INTEGER REFERENCES automated_actions(id) ON DELETE CASCADE,
  commissioner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  proposed_changes JSONB NOT NULL DEFAULT '{}',
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP,
  status VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  commissioner_notes TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_analytics (
  id SERIAL PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  analysis_period_start TIMESTAMP NOT NULL,
  analysis_period_end TIMESTAMP NOT NULL,
  total_optimizations INTEGER DEFAULT 0,
  successful_optimizations INTEGER DEFAULT 0,
  average_improvement DECIMAL(5,2) DEFAULT 0,
  automation_usage_rate DECIMAL(4,3) DEFAULT 0,
  user_satisfaction_score DECIMAL(3,2) DEFAULT 0.50,
  inactive_managers_count INTEGER DEFAULT 0,
  automation_impact_score DECIMAL(3,2) DEFAULT 0.50,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lineup_optimizations_user_id ON lineup_optimizations(user_id);
CREATE INDEX IF NOT EXISTS idx_lineup_optimizations_league_id ON lineup_optimizations(league_id);
CREATE INDEX IF NOT EXISTS idx_lineup_optimizations_week ON lineup_optimizations(week);
CREATE INDEX IF NOT EXISTS idx_lineup_optimizations_timestamp ON lineup_optimizations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lineup_optimizations_applied ON lineup_optimizations(applied, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_automated_actions_user_id ON automated_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_automated_actions_league_id ON automated_actions(league_id);
CREATE INDEX IF NOT EXISTS idx_automated_actions_performed_at ON automated_actions(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_automated_actions_type ON automated_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_user_activity_tracking_user_id ON user_activity_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_tracking_league_id ON user_activity_tracking(league_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_tracking_timestamp ON user_activity_tracking(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_tracking_type ON user_activity_tracking(activity_type);

CREATE INDEX IF NOT EXISTS idx_inactivity_analysis_user_league ON inactivity_analysis(user_id, league_id);
CREATE INDEX IF NOT EXISTS idx_inactivity_analysis_date ON inactivity_analysis(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_inactivity_analysis_level ON inactivity_analysis(inactivity_level);
CREATE INDEX IF NOT EXISTS idx_inactivity_analysis_league ON inactivity_analysis(league_id);

CREATE INDEX IF NOT EXISTS idx_lineup_patterns_user_id ON lineup_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_lineup_patterns_league_id ON lineup_patterns(league_id);
CREATE INDEX IF NOT EXISTS idx_lineup_patterns_type ON lineup_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_lineup_patterns_strength ON lineup_patterns(pattern_strength DESC);

CREATE INDEX IF NOT EXISTS idx_optimization_feedback_optimization ON optimization_feedback(optimization_id);
CREATE INDEX IF NOT EXISTS idx_optimization_feedback_user ON optimization_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_feedback_submitted_at ON optimization_feedback(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_commissioner_approvals_league ON commissioner_approvals(league_id);
CREATE INDEX IF NOT EXISTS idx_commissioner_approvals_status ON commissioner_approvals(status);
CREATE INDEX IF NOT EXISTS idx_commissioner_approvals_requested_at ON commissioner_approvals(requested_at DESC);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_optimizations_recent ON lineup_optimizations(user_id, timestamp DESC) 
  WHERE timestamp > NOW() - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_actions_pending_approval ON automated_actions(league_id, performed_at DESC) 
  WHERE commissioner_approved IS NULL;

CREATE INDEX IF NOT EXISTS idx_inactivity_current ON inactivity_analysis(league_id, inactivity_level) 
  WHERE analysis_date = CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_approvals_pending ON commissioner_approvals(commissioner_id, requested_at DESC) 
  WHERE status = 'pending' AND (expires_at IS NULL OR expires_at > NOW());

-- Triggers for updated_at timestamps
CREATE TRIGGER update_league_automation_settings_updated_at 
  BEFORE UPDATE ON league_automation_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lineup_patterns_updated_at 
  BEFORE UPDATE ON lineup_patterns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Functions for automation management
CREATE OR REPLACE FUNCTION calculate_user_inactivity_score(p_user_id UUID, p_league_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  days_since_lineup INTEGER;
  days_since_login INTEGER;
  recent_actions INTEGER;
  inactivity_score DECIMAL;
BEGIN
  -- Calculate days since last lineup change
  SELECT COALESCE(
    EXTRACT(DAY FROM NOW() - MAX(timestamp)), 999
  ) INTO days_since_lineup
  FROM user_activity_tracking
  WHERE user_id = p_user_id 
    AND league_id = p_league_id
    AND activity_type = 'lineup_change';
  
  -- Calculate days since last login
  SELECT COALESCE(
    EXTRACT(DAY FROM NOW() - MAX(timestamp)), 999
  ) INTO days_since_login
  FROM user_activity_tracking
  WHERE user_id = p_user_id 
    AND activity_type = 'login';
  
  -- Count recent actions (last 7 days)
  SELECT COUNT(*) INTO recent_actions
  FROM user_activity_tracking
  WHERE user_id = p_user_id 
    AND league_id = p_league_id
    AND timestamp > NOW() - INTERVAL '7 days';
  
  -- Calculate inactivity score (0 = very active, 1 = completely inactive)
  inactivity_score := LEAST(
    (LEAST(days_since_lineup, days_since_login) / 30.0) + 
    (CASE WHEN recent_actions = 0 THEN 0.3 ELSE -0.1 * recent_actions END),
    1.0
  );
  
  RETURN GREATEST(0.0, inactivity_score);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_lineup_improvement_potential(p_user_id UUID, p_league_id UUID, p_week INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  current_projection DECIMAL;
  optimal_projection DECIMAL;
  improvement DECIMAL;
BEGIN
  -- Get current lineup projection
  SELECT COALESCE(SUM(pp.projected_points), 0) INTO current_projection
  FROM user_lineups ul
  JOIN player_projections pp ON ul.player_id = pp.player_id
  WHERE ul.user_id = p_user_id 
    AND ul.league_id = p_league_id
    AND pp.week = p_week;
  
  -- Get optimal lineup projection (simplified - top projected available players)
  SELECT COALESCE(SUM(best_projections.projected_points), 0) INTO optimal_projection
  FROM (
    SELECT pp.projected_points,
           ROW_NUMBER() OVER (PARTITION BY p.position ORDER BY pp.projected_points DESC) as rn
    FROM user_rosters ur
    JOIN players p ON ur.player_id = p.id
    JOIN player_projections pp ON p.id = pp.player_id
    WHERE ur.user_id = p_user_id 
      AND ur.league_id = p_league_id
      AND pp.week = p_week
      AND p.injury_status != 'out'
      AND p.bye_week != p_week
  ) best_projections
  WHERE best_projections.rn <= CASE 
    WHEN best_projections.position = 'QB' THEN 1
    WHEN best_projections.position = 'RB' THEN 2  
    WHEN best_projections.position = 'WR' THEN 2
    WHEN best_projections.position = 'TE' THEN 1
    WHEN best_projections.position = 'K' THEN 1
    WHEN best_projections.position = 'DEF' THEN 1
    ELSE 0
  END;
  
  improvement := GREATEST(0, optimal_projection - current_projection);
  RETURN improvement;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_inactivity_analysis()
RETURNS void AS $$
DECLARE
  league_record RECORD;
  user_record RECORD;
  inactivity_score DECIMAL;
  improvement_potential DECIMAL;
  current_week INTEGER;
BEGIN
  -- Get current week
  SELECT MAX(week) INTO current_week FROM player_projections;
  
  -- Update inactivity analysis for all leagues
  FOR league_record IN SELECT id FROM leagues WHERE is_active = TRUE LOOP
    
    -- Analyze each user in the league
    FOR user_record IN 
      SELECT u.id as user_id
      FROM users u
      JOIN league_memberships lm ON u.id = lm.user_id
      WHERE lm.league_id = league_record.id 
        AND lm.is_active = TRUE
    LOOP
      
      -- Calculate inactivity score
      inactivity_score := calculate_user_inactivity_score(user_record.user_id, league_record.id);
      
      -- Calculate improvement potential
      improvement_potential := get_lineup_improvement_potential(user_record.user_id, league_record.id, current_week);
      
      -- Insert or update inactivity analysis
      INSERT INTO inactivity_analysis (
        user_id, league_id, analysis_date, inactivity_level,
        days_since_activity, improvement_potential,
        last_lineup_change, last_login, recent_actions_count,
        response_pattern, automation_recommendation
      )
      SELECT 
        user_record.user_id,
        league_record.id,
        CURRENT_DATE,
        CASE 
          WHEN inactivity_score < 0.2 THEN 'mild'
          WHEN inactivity_score < 0.5 THEN 'moderate' 
          WHEN inactivity_score < 0.8 THEN 'severe'
          ELSE 'abandoned'
        END,
        LEAST(
          COALESCE(EXTRACT(DAY FROM NOW() - MAX(uat1.timestamp)), 999),
          COALESCE(EXTRACT(DAY FROM NOW() - MAX(uat2.timestamp)), 999)
        ),
        improvement_potential,
        MAX(uat1.timestamp),
        MAX(uat2.timestamp),
        COUNT(uat3.id),
        CASE 
          WHEN inactivity_score < 0.3 THEN 'active'
          WHEN inactivity_score < 0.7 THEN 'sporadic'
          ELSE 'inactive'
        END,
        CASE 
          WHEN inactivity_score < 0.2 THEN 'none'
          WHEN inactivity_score < 0.4 THEN 'notifications'
          WHEN inactivity_score < 0.7 THEN 'suggestions'
          ELSE 'auto_set'
        END
      FROM user_activity_tracking uat1
      LEFT JOIN user_activity_tracking uat2 ON uat2.user_id = user_record.user_id AND uat2.activity_type = 'login'
      LEFT JOIN user_activity_tracking uat3 ON uat3.user_id = user_record.user_id AND uat3.league_id = league_record.id AND uat3.timestamp > NOW() - INTERVAL '7 days'
      WHERE uat1.user_id = user_record.user_id 
        AND uat1.league_id = league_record.id
        AND uat1.activity_type = 'lineup_change'
      GROUP BY user_record.user_id, league_record.id
      
      ON CONFLICT (user_id, league_id, analysis_date) DO UPDATE SET
        inactivity_level = EXCLUDED.inactivity_level,
        days_since_activity = EXCLUDED.days_since_activity,
        improvement_potential = EXCLUDED.improvement_potential,
        last_lineup_change = EXCLUDED.last_lineup_change,
        last_login = EXCLUDED.last_login,
        recent_actions_count = EXCLUDED.recent_actions_count,
        response_pattern = EXCLUDED.response_pattern,
        automation_recommendation = EXCLUDED.automation_recommendation;
      
    END LOOP;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_automation_data()
RETURNS void AS $$
BEGIN
  -- Clean up old activity tracking (keep last 90 days)
  DELETE FROM user_activity_tracking WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Clean up old lineup optimizations (keep last 365 days)
  DELETE FROM lineup_optimizations WHERE timestamp < NOW() - INTERVAL '365 days';
  
  -- Clean up old inactivity analysis (keep last 180 days)
  DELETE FROM inactivity_analysis WHERE analysis_date < CURRENT_DATE - INTERVAL '180 days';
  
  -- Clean up old automated actions (keep last 180 days)
  DELETE FROM automated_actions WHERE performed_at < NOW() - INTERVAL '180 days';
  
  -- Clean up old optimization feedback (keep last 365 days)
  DELETE FROM optimization_feedback WHERE submitted_at < NOW() - INTERVAL '365 days';
  
  -- Clean up expired commissioner approvals
  DELETE FROM commissioner_approvals WHERE expires_at < NOW();
  
  -- Update pattern strengths (decay over time)
  UPDATE lineup_patterns 
  SET pattern_strength = pattern_strength * 0.95
  WHERE last_observed < NOW() - INTERVAL '14 days';
  
  -- Delete very weak patterns
  DELETE FROM lineup_patterns WHERE pattern_strength < 0.1;
END;
$$ LANGUAGE plpgsql;

-- Create view for automation dashboard
CREATE OR REPLACE VIEW automation_dashboard AS
SELECT 
  l.id as league_id,
  l.name as league_name,
  las.enable_automation,
  las.automation_level,
  las.inactivity_threshold,
  
  -- Current inactive users
  COALESCE(inactive_stats.inactive_count, 0) as inactive_managers_count,
  COALESCE(inactive_stats.severe_inactive, 0) as severe_inactive_count,
  COALESCE(inactive_stats.total_improvement_potential, 0) as total_improvement_potential,
  
  -- Recent optimizations
  COALESCE(optimization_stats.recent_optimizations, 0) as optimizations_last_week,
  COALESCE(optimization_stats.avg_improvement, 0) as avg_improvement_points,
  COALESCE(optimization_stats.success_rate, 0) as optimization_success_rate,
  
  -- Automation usage
  COALESCE(usage_stats.auto_applied, 0) as auto_applications_last_week,
  COALESCE(usage_stats.suggestions_sent, 0) as suggestions_sent_last_week,
  COALESCE(usage_stats.user_satisfaction, 0.5) as user_satisfaction_score

FROM leagues l

LEFT JOIN league_automation_settings las ON l.id = las.league_id

LEFT JOIN (
  SELECT 
    league_id,
    COUNT(*) as inactive_count,
    COUNT(*) FILTER (WHERE inactivity_level IN ('severe', 'abandoned')) as severe_inactive,
    SUM(improvement_potential) as total_improvement_potential
  FROM inactivity_analysis
  WHERE analysis_date = CURRENT_DATE
  GROUP BY league_id
) inactive_stats ON l.id = inactive_stats.league_id

LEFT JOIN (
  SELECT 
    league_id,
    COUNT(*) as recent_optimizations,
    AVG(projection_improvement) as avg_improvement,
    AVG(CASE WHEN applied THEN 1.0 ELSE 0.0 END) as success_rate
  FROM lineup_optimizations
  WHERE timestamp > NOW() - INTERVAL '7 days'
  GROUP BY league_id
) optimization_stats ON l.id = optimization_stats.league_id

LEFT JOIN (
  SELECT 
    league_id,
    COUNT(*) FILTER (WHERE action_type = 'lineup_optimization' AND performed_at > NOW() - INTERVAL '7 days') as auto_applied,
    COUNT(*) FILTER (WHERE action_type = 'notification_sent' AND performed_at > NOW() - INTERVAL '7 days') as suggestions_sent,
    COALESCE(AVG((feedback_value->>'rating')::decimal), 0.5) as user_satisfaction
  FROM automated_actions aa
  LEFT JOIN optimization_feedback of ON aa.id = of.optimization_id
  GROUP BY league_id
) usage_stats ON l.id = usage_stats.league_id

WHERE l.is_active = TRUE;

-- Index for the view
CREATE INDEX IF NOT EXISTS idx_automation_dashboard_league_id ON automation_dashboard USING btree(league_id);

-- Insert default automation settings for existing leagues
INSERT INTO league_automation_settings (league_id, enable_automation, automation_level)
SELECT id, TRUE, 'suggestions'
FROM leagues 
WHERE is_active = TRUE
ON CONFLICT (league_id) DO NOTHING;