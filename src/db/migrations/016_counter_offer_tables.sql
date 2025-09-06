-- Counter-Offer Generation Tables

CREATE TABLE IF NOT EXISTS counter_offers (
  id VARCHAR(255) PRIMARY KEY,
  original_trade_id VARCHAR(255) NOT NULL,
  counter_offer_id VARCHAR(255) NOT NULL,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  original_trade JSONB NOT NULL DEFAULT '{}',
  counter_trade JSONB NOT NULL DEFAULT '{}',
  reasoning JSONB NOT NULL DEFAULT '{}',
  strategic_analysis JSONB NOT NULL DEFAULT '{}',
  negotiation_strategy JSONB NOT NULL DEFAULT '{}',
  fairness_improvement JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  acceptance_probability DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'proposed', 'viewed', 'accepted', 'rejected', 'expired')),
  response VARCHAR(20) CHECK (response IN ('accepted', 'rejected', 'countered')),
  responded_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS negotiation_sessions (
  id SERIAL PRIMARY KEY,
  trade_thread_id VARCHAR(255) NOT NULL,
  participant_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  session_start TIMESTAMP NOT NULL DEFAULT NOW(),
  session_end TIMESTAMP,
  total_offers INTEGER DEFAULT 0,
  total_counter_offers INTEGER DEFAULT 0,
  final_outcome VARCHAR(20) CHECK (final_outcome IN ('accepted', 'rejected', 'abandoned', 'expired')),
  negotiation_duration INTEGER, -- minutes
  session_summary JSONB DEFAULT '{}',
  ai_assistance_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offer_interactions (
  id SERIAL PRIMARY KEY,
  counter_offer_id VARCHAR(255) REFERENCES counter_offers(counter_offer_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(30) NOT NULL CHECK (interaction_type IN ('view', 'analyze', 'propose', 'accept', 'reject', 'modify', 'comment')),
  interaction_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS negotiation_strategies (
  id SERIAL PRIMARY KEY,
  strategy_name VARCHAR(100) NOT NULL,
  strategy_type VARCHAR(30) NOT NULL CHECK (strategy_type IN ('collaborative', 'competitive', 'accommodating', 'compromising', 'avoiding')),
  description TEXT NOT NULL,
  success_rate DECIMAL(4,3) NOT NULL DEFAULT 0.500,
  use_cases TEXT[] NOT NULL DEFAULT '{}',
  tactics JSONB NOT NULL DEFAULT '[]',
  effectiveness_by_context JSONB DEFAULT '{}',
  created_by VARCHAR(50) DEFAULT 'system',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(strategy_name)
);

CREATE TABLE IF NOT EXISTS trade_modifications (
  id SERIAL PRIMARY KEY,
  original_trade_id VARCHAR(255) NOT NULL,
  modification_type VARCHAR(30) NOT NULL CHECK (modification_type IN ('add_player', 'remove_player', 'replace_player', 'add_pick', 'add_faab', 'adjust_terms')),
  modification_details JSONB NOT NULL DEFAULT '{}',
  value_impact DECIMAL(6,2) DEFAULT 0,
  fairness_impact DECIMAL(4,3) DEFAULT 0,
  acceptance_likelihood DECIMAL(3,2) DEFAULT 0.50,
  suggested_by VARCHAR(20) NOT NULL CHECK (suggested_by IN ('ai', 'user', 'system')),
  reasoning TEXT,
  applied_in_counter BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counter_offer_feedback (
  id SERIAL PRIMARY KEY,
  counter_offer_id VARCHAR(255) REFERENCES counter_offers(counter_offer_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('quality_rating', 'relevance_rating', 'creativity_rating', 'fairness_rating', 'acceptance_likelihood', 'text_feedback')),
  feedback_value JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  impact_on_algorithm DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS negotiation_analytics (
  id SERIAL PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  analysis_period_start TIMESTAMP NOT NULL,
  analysis_period_end TIMESTAMP NOT NULL,
  total_negotiations INTEGER NOT NULL DEFAULT 0,
  successful_negotiations INTEGER NOT NULL DEFAULT 0,
  average_duration_minutes INTEGER DEFAULT 0,
  average_counter_offers DECIMAL(4,2) DEFAULT 0,
  most_effective_strategy VARCHAR(100),
  ai_assistance_usage DECIMAL(4,3) DEFAULT 0,
  fairness_improvement_avg DECIMAL(4,3) DEFAULT 0,
  user_satisfaction_score DECIMAL(3,2) DEFAULT 0.50,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strategic_insights (
  id SERIAL PRIMARY KEY,
  insight_type VARCHAR(50) NOT NULL,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_title VARCHAR(200) NOT NULL,
  insight_description TEXT NOT NULL,
  actionable_recommendations TEXT[] NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  category VARCHAR(30) NOT NULL,
  supporting_data JSONB NOT NULL DEFAULT '{}',
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  acted_upon BOOLEAN DEFAULT FALSE,
  impact_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_counter_offers_original_trade ON counter_offers(original_trade_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_from_user ON counter_offers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_to_user ON counter_offers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_generated_at ON counter_offers(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_counter_offers_acceptance_probability ON counter_offers(acceptance_probability DESC);
CREATE INDEX IF NOT EXISTS idx_counter_offers_priority ON counter_offers(priority);
CREATE INDEX IF NOT EXISTS idx_counter_offers_status ON counter_offers(status);

CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_participants ON negotiation_sessions(participant_a_id, participant_b_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_league ON negotiation_sessions(league_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_start ON negotiation_sessions(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_outcome ON negotiation_sessions(final_outcome);

CREATE INDEX IF NOT EXISTS idx_offer_interactions_counter_offer ON offer_interactions(counter_offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_interactions_user ON offer_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_interactions_timestamp ON offer_interactions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_trade_modifications_original_trade ON trade_modifications(original_trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_modifications_type ON trade_modifications(modification_type);
CREATE INDEX IF NOT EXISTS idx_trade_modifications_acceptance_likelihood ON trade_modifications(acceptance_likelihood DESC);

CREATE INDEX IF NOT EXISTS idx_counter_offer_feedback_counter_offer ON counter_offer_feedback(counter_offer_id);
CREATE INDEX IF NOT EXISTS idx_counter_offer_feedback_user ON counter_offer_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_counter_offer_feedback_submitted_at ON counter_offer_feedback(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_insights_league ON strategic_insights(league_id);
CREATE INDEX IF NOT EXISTS idx_strategic_insights_user ON strategic_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_strategic_insights_discovered_at ON strategic_insights(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategic_insights_priority ON strategic_insights(priority DESC);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_counter_offers_pending ON counter_offers(to_user_id, generated_at DESC) 
  WHERE status = 'pending' AND (expires_at IS NULL OR expires_at > NOW());

CREATE INDEX IF NOT EXISTS idx_negotiations_active ON negotiation_sessions(league_id, session_start DESC) 
  WHERE session_end IS NULL;

CREATE INDEX IF NOT EXISTS idx_insights_actionable ON strategic_insights(user_id, priority DESC) 
  WHERE acted_upon = FALSE AND (expires_at IS NULL OR expires_at > NOW());

-- Triggers for updated_at timestamps
CREATE TRIGGER update_negotiation_strategies_updated_at 
  BEFORE UPDATE ON negotiation_strategies 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Functions for counter-offer management
CREATE OR REPLACE FUNCTION calculate_negotiation_success_rate(p_user_id UUID, p_league_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_negotiations INTEGER;
  successful_negotiations INTEGER;
  success_rate DECIMAL;
BEGIN
  -- Count total negotiations where user participated
  SELECT COUNT(*) INTO total_negotiations
  FROM negotiation_sessions ns
  WHERE (ns.participant_a_id = p_user_id OR ns.participant_b_id = p_user_id)
    AND ns.league_id = p_league_id
    AND ns.session_end IS NOT NULL;
  
  -- Count successful negotiations (ended in acceptance)
  SELECT COUNT(*) INTO successful_negotiations
  FROM negotiation_sessions ns
  WHERE (ns.participant_a_id = p_user_id OR ns.participant_b_id = p_user_id)
    AND ns.league_id = p_league_id
    AND ns.final_outcome = 'accepted';
  
  -- Calculate success rate
  IF total_negotiations > 0 THEN
    success_rate := successful_negotiations::decimal / total_negotiations::decimal;
  ELSE
    success_rate := 0;
  END IF;
  
  RETURN success_rate;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_negotiation_style(p_user_id UUID, p_league_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  collaborative_count INTEGER;
  competitive_count INTEGER;
  total_count INTEGER;
  negotiation_style VARCHAR(30);
BEGIN
  -- Analyze user's counter-offer patterns
  SELECT 
    COUNT(*) FILTER (WHERE (negotiation_strategy->>'approach') = 'collaborative') as collaborative,
    COUNT(*) FILTER (WHERE (negotiation_strategy->>'approach') = 'competitive') as competitive,
    COUNT(*) as total
  INTO collaborative_count, competitive_count, total_count
  FROM counter_offers co
  WHERE (co.from_user_id = p_user_id OR co.to_user_id = p_user_id)
    AND co.league_id = p_league_id
    AND co.generated_at > NOW() - INTERVAL '90 days';
  
  -- Determine dominant style
  IF total_count = 0 THEN
    negotiation_style := 'unknown';
  ELSIF collaborative_count > competitive_count THEN
    negotiation_style := 'collaborative';
  ELSIF competitive_count > collaborative_count THEN
    negotiation_style := 'competitive';
  ELSE
    negotiation_style := 'balanced';
  END IF;
  
  RETURN negotiation_style;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION expire_old_counter_offers()
RETURNS void AS $$
BEGIN
  -- Mark expired counter-offers
  UPDATE counter_offers 
  SET status = 'expired' 
  WHERE expires_at < NOW() 
    AND status IN ('pending', 'proposed');
  
  -- Close expired negotiation sessions
  UPDATE negotiation_sessions 
  SET session_end = NOW(), 
      final_outcome = 'expired'
  WHERE session_end IS NULL 
    AND session_start < NOW() - INTERVAL '7 days';
  
  -- Clean up old interactions (keep last 180 days)
  DELETE FROM offer_interactions 
  WHERE timestamp < NOW() - INTERVAL '180 days';
  
  -- Clean up old feedback (keep last 365 days)
  DELETE FROM counter_offer_feedback 
  WHERE submitted_at < NOW() - INTERVAL '365 days';
  
  -- Clean up old modifications (keep last 180 days)
  DELETE FROM trade_modifications 
  WHERE created_at < NOW() - INTERVAL '180 days';
  
  -- Expire old strategic insights
  UPDATE strategic_insights 
  SET acted_upon = TRUE 
  WHERE expires_at < NOW() 
    AND acted_upon = FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_negotiation_analytics()
RETURNS void AS $$
DECLARE
  league_record RECORD;
BEGIN
  -- Update negotiation analytics for all active leagues
  FOR league_record IN SELECT id FROM leagues WHERE is_active = TRUE LOOP
    
    INSERT INTO negotiation_analytics (
      league_id,
      analysis_period_start,
      analysis_period_end,
      total_negotiations,
      successful_negotiations,
      average_duration_minutes,
      average_counter_offers,
      ai_assistance_usage,
      fairness_improvement_avg
    )
    SELECT 
      league_record.id,
      NOW() - INTERVAL '30 days',
      NOW(),
      COUNT(*) as total_negotiations,
      COUNT(*) FILTER (WHERE final_outcome = 'accepted') as successful_negotiations,
      AVG(negotiation_duration) as average_duration_minutes,
      AVG(total_counter_offers) as average_counter_offers,
      AVG(CASE WHEN ai_assistance_used THEN 1.0 ELSE 0.0 END) as ai_assistance_usage,
      AVG((co.fairness_improvement->>'improvedFairness')::decimal - (co.fairness_improvement->>'originalFairness')::decimal) as fairness_improvement_avg
    FROM negotiation_sessions ns
    LEFT JOIN counter_offers co ON ns.trade_thread_id = co.original_trade_id
    WHERE ns.league_id = league_record.id
      AND ns.session_start > NOW() - INTERVAL '30 days'
    GROUP BY league_record.id
    HAVING COUNT(*) > 0
    
    ON CONFLICT (league_id, analysis_period_start) DO UPDATE SET
      total_negotiations = EXCLUDED.total_negotiations,
      successful_negotiations = EXCLUDED.successful_negotiations,
      average_duration_minutes = EXCLUDED.average_duration_minutes,
      average_counter_offers = EXCLUDED.average_counter_offers,
      ai_assistance_usage = EXCLUDED.ai_assistance_usage,
      fairness_improvement_avg = EXCLUDED.fairness_improvement_avg,
      calculated_at = NOW();
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert default negotiation strategies
INSERT INTO negotiation_strategies (strategy_name, strategy_type, description, success_rate, use_cases, tactics) VALUES
('Win-Win Collaboration', 'collaborative', 'Focus on finding mutually beneficial solutions that address both teams'' needs', 0.750, ARRAY['long-term relationships', 'complex trades', 'league harmony'], '["Emphasize mutual benefits", "Share reasoning transparently", "Explore creative alternatives"]'),
('Value-Focused Negotiation', 'competitive', 'Negotiate from position of strength by demonstrating superior value proposition', 0.650, ARRAY['clear value advantage', 'deadline pressure', 'one-sided needs'], '["Lead with data", "Highlight scarcity", "Set firm boundaries"]'),
('Need-Based Compromise', 'compromising', 'Find middle ground by identifying overlapping team needs and mutual concessions', 0.680, ARRAY['balanced rosters', 'similar team strength', 'deadline trades'], '["Identify shared interests", "Propose incremental adjustments", "Package complementary pieces"]'),
('Accommodating Support', 'accommodating', 'Prioritize relationship and future trading opportunities over immediate value extraction', 0.580, ARRAY['rebuilding teams', 'helping competitive teams', 'relationship building'], '["Show flexibility", "Offer additional value", "Focus on future opportunities"]'),
('Strategic Positioning', 'competitive', 'Use market timing and leverage points to maximize negotiation position', 0.620, ARRAY['seller''s market', 'injury situations', 'playoff push'], '["Time offers strategically", "Create urgency", "Leverage market conditions"]'),
('Relationship Building', 'collaborative', 'Emphasize long-term trading partnership and league community', 0.700, ARRAY['new league members', 'frequent trading partners', 'commissioner relations'], '["Acknowledge past trades", "Reference future opportunities", "Maintain positive tone"]');

-- Create materialized view for negotiation dashboard
CREATE MATERIALIZED VIEW negotiation_dashboard AS
SELECT 
  l.id as league_id,
  l.name as league_name,
  
  -- Active negotiations
  COALESCE(active_negotiations.active_count, 0) as active_negotiations,
  COALESCE(active_negotiations.avg_duration_hours, 0) as avg_negotiation_duration_hours,
  
  -- Counter-offer metrics
  COALESCE(counter_metrics.pending_offers, 0) as pending_counter_offers,
  COALESCE(counter_metrics.high_probability_offers, 0) as high_probability_offers,
  COALESCE(counter_metrics.avg_acceptance_probability, 0.5) as avg_acceptance_probability,
  
  -- Success rates
  COALESCE(success_metrics.success_rate, 0) as negotiation_success_rate,
  COALESCE(success_metrics.ai_assistance_rate, 0) as ai_assistance_usage_rate,
  COALESCE(success_metrics.avg_fairness_improvement, 0) as avg_fairness_improvement,
  
  -- Recent activity
  COALESCE(activity_metrics.offers_last_week, 0) as counter_offers_last_week,
  COALESCE(activity_metrics.completed_negotiations, 0) as completed_negotiations_last_week

FROM leagues l

LEFT JOIN (
  SELECT 
    league_id,
    COUNT(*) as active_count,
    AVG(EXTRACT(EPOCH FROM (NOW() - session_start))/3600) as avg_duration_hours
  FROM negotiation_sessions
  WHERE session_end IS NULL
  GROUP BY league_id
) active_negotiations ON l.id = active_negotiations.league_id

LEFT JOIN (
  SELECT 
    league_id,
    COUNT(*) as pending_offers,
    COUNT(*) FILTER (WHERE acceptance_probability >= 0.7) as high_probability_offers,
    AVG(acceptance_probability) as avg_acceptance_probability
  FROM counter_offers
  WHERE status = 'pending' 
    AND (expires_at IS NULL OR expires_at > NOW())
  GROUP BY league_id
) counter_metrics ON l.id = counter_metrics.league_id

LEFT JOIN (
  SELECT 
    league_id,
    COALESCE(AVG(CASE WHEN final_outcome = 'accepted' THEN 1.0 ELSE 0.0 END), 0) as success_rate,
    COALESCE(AVG(CASE WHEN ai_assistance_used THEN 1.0 ELSE 0.0 END), 0) as ai_assistance_rate,
    COALESCE(AVG((co.fairness_improvement->>'improvedFairness')::decimal - (co.fairness_improvement->>'originalFairness')::decimal), 0) as avg_fairness_improvement
  FROM negotiation_sessions ns
  LEFT JOIN counter_offers co ON ns.trade_thread_id = co.original_trade_id
  WHERE ns.session_start > NOW() - INTERVAL '30 days'
  GROUP BY league_id
) success_metrics ON l.id = success_metrics.league_id

LEFT JOIN (
  SELECT 
    league_id,
    COUNT(*) FILTER (WHERE generated_at > NOW() - INTERVAL '7 days') as offers_last_week,
    COUNT(DISTINCT ns.id) as completed_negotiations
  FROM counter_offers co
  LEFT JOIN negotiation_sessions ns ON co.original_trade_id = ns.trade_thread_id
  WHERE ns.session_start > NOW() - INTERVAL '7 days'
    AND ns.session_end IS NOT NULL
  GROUP BY league_id
) activity_metrics ON l.id = activity_metrics.league_id

WHERE l.is_active = TRUE;

-- Index for the materialized view
CREATE INDEX IF NOT EXISTS idx_negotiation_dashboard_league_id ON negotiation_dashboard(league_id);

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_negotiation_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY negotiation_dashboard;
END;
$$ LANGUAGE plpgsql;