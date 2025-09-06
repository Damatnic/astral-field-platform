-- Trade Opportunity Detection Tables

CREATE TABLE IF NOT EXISTS trade_opportunities (
  id VARCHAR(255) PRIMARY KEY,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  proposed_trade JSONB NOT NULL DEFAULT '{}',
  analysis JSONB NOT NULL DEFAULT '{}',
  reasoning JSONB NOT NULL DEFAULT '{}',
  urgency VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  market_context JSONB NOT NULL DEFAULT '{}',
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  priority INTEGER NOT NULL DEFAULT 50,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'viewed', 'proposed', 'rejected', 'expired')),
  viewed_by_from_user BOOLEAN DEFAULT FALSE,
  viewed_by_to_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_trade_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  trading_activity VARCHAR(15) NOT NULL DEFAULT 'moderate' CHECK (trading_activity IN ('inactive', 'conservative', 'moderate', 'active', 'aggressive')),
  preferred_trade_types TEXT[] NOT NULL DEFAULT ARRAY['positional_need'],
  risk_tolerance DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  response_time INTEGER NOT NULL DEFAULT 24, -- hours
  acceptance_rate DECIMAL(4,3) NOT NULL DEFAULT 0.300,
  last_active TIMESTAMP NOT NULL DEFAULT NOW(),
  team_needs JSONB NOT NULL DEFAULT '[]',
  trading_patterns JSONB NOT NULL DEFAULT '{}',
  trade_count INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, league_id)
);

CREATE TABLE IF NOT EXISTS league_scan_results (
  id SERIAL PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  scan_type VARCHAR(20) NOT NULL DEFAULT 'full' CHECK (scan_type IN ('full', 'targeted', 'partial')),
  total_combinations INTEGER NOT NULL,
  viable_opportunities INTEGER NOT NULL,
  top_opportunities_count INTEGER NOT NULL,
  market_insights JSONB NOT NULL DEFAULT '[]',
  scan_duration INTEGER NOT NULL, -- milliseconds
  scan_completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  next_scan_scheduled TIMESTAMP,
  scan_status VARCHAR(20) DEFAULT 'completed' CHECK (scan_status IN ('running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_patterns (
  id SERIAL PRIMARY KEY,
  pattern_type VARCHAR(30) NOT NULL,
  pattern_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  success_rate DECIMAL(4,3) NOT NULL DEFAULT 0.500,
  average_fairness DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  typical_timeframe VARCHAR(50),
  key_indicators TEXT[] NOT NULL DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pattern_type, pattern_name)
);

CREATE TABLE IF NOT EXISTS market_insights (
  id SERIAL PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  insight_type VARCHAR(30) NOT NULL CHECK (insight_type IN ('buyer_need', 'seller_opportunity', 'market_shift', 'urgent_action')),
  player_id VARCHAR(255),
  player_name VARCHAR(100),
  description TEXT NOT NULL,
  affected_users UUID[] NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  action_window_hours INTEGER NOT NULL DEFAULT 24,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  acted_upon BOOLEAN DEFAULT FALSE,
  impact_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_interactions (
  id SERIAL PRIMARY KEY,
  opportunity_id VARCHAR(255) REFERENCES trade_opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(30) NOT NULL CHECK (interaction_type IN ('view', 'like', 'dislike', 'propose', 'counter_propose', 'reject', 'accept')),
  interaction_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_market_activity (
  id SERIAL PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  player_id VARCHAR(255) NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  position VARCHAR(10) NOT NULL,
  activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('trade_completed', 'trade_proposed', 'trade_rejected', 'high_interest', 'value_spike', 'value_drop')),
  activity_data JSONB NOT NULL DEFAULT '{}',
  market_impact DECIMAL(3,2) DEFAULT 0.0,
  activity_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_feedback (
  id SERIAL PRIMARY KEY,
  opportunity_id VARCHAR(255) REFERENCES trade_opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('quality_rating', 'relevance_rating', 'timing_rating', 'fairness_rating', 'text_feedback')),
  feedback_value JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  impact_on_algorithm DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_compatibility_matrix (
  id SERIAL PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  trade_history_count INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  avg_response_time_hours INTEGER,
  complementary_needs JSONB DEFAULT '{}',
  risk_compatibility DECIMAL(3,2) DEFAULT 0.50,
  communication_compatibility DECIMAL(3,2) DEFAULT 0.50,
  last_calculated TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(league_id, user_a_id, user_b_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_opportunities_from_user ON trade_opportunities(from_user_id);
CREATE INDEX IF NOT EXISTS idx_trade_opportunities_to_user ON trade_opportunities(to_user_id);
CREATE INDEX IF NOT EXISTS idx_trade_opportunities_league ON trade_opportunities(league_id);
CREATE INDEX IF NOT EXISTS idx_trade_opportunities_discovered_at ON trade_opportunities(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_opportunities_priority ON trade_opportunities(priority DESC);
CREATE INDEX IF NOT EXISTS idx_trade_opportunities_urgency ON trade_opportunities(urgency);
CREATE INDEX IF NOT EXISTS idx_trade_opportunities_status ON trade_opportunities(status);

CREATE INDEX IF NOT EXISTS idx_user_trade_profiles_user_league ON user_trade_profiles(user_id, league_id);
CREATE INDEX IF NOT EXISTS idx_user_trade_profiles_activity ON user_trade_profiles(trading_activity);
CREATE INDEX IF NOT EXISTS idx_user_trade_profiles_last_active ON user_trade_profiles(last_active DESC);

CREATE INDEX IF NOT EXISTS idx_league_scan_results_league ON league_scan_results(league_id);
CREATE INDEX IF NOT EXISTS idx_league_scan_results_completed_at ON league_scan_results(scan_completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_league_scan_results_next_scan ON league_scan_results(next_scan_scheduled);

CREATE INDEX IF NOT EXISTS idx_market_insights_league ON market_insights(league_id);
CREATE INDEX IF NOT EXISTS idx_market_insights_type ON market_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_market_insights_discovered_at ON market_insights(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_insights_priority ON market_insights(priority DESC);
CREATE INDEX IF NOT EXISTS idx_market_insights_expires_at ON market_insights(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunity_interactions_opportunity ON opportunity_interactions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interactions_user ON opportunity_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_interactions_timestamp ON opportunity_interactions(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_trade_market_activity_league ON trade_market_activity(league_id);
CREATE INDEX IF NOT EXISTS idx_trade_market_activity_player ON trade_market_activity(player_id);
CREATE INDEX IF NOT EXISTS idx_trade_market_activity_date ON trade_market_activity(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_trade_market_activity_type ON trade_market_activity(activity_type);

CREATE INDEX IF NOT EXISTS idx_opportunity_feedback_opportunity ON opportunity_feedback(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_feedback_user ON opportunity_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_feedback_submitted_at ON opportunity_feedback(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_compatibility_matrix_league ON trade_compatibility_matrix(league_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_matrix_users ON trade_compatibility_matrix(user_a_id, user_b_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_matrix_score ON trade_compatibility_matrix(compatibility_score DESC);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_opportunities_active ON trade_opportunities(from_user_id, priority DESC) 
  WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW());

CREATE INDEX IF NOT EXISTS idx_opportunities_unviewed ON trade_opportunities(to_user_id, discovered_at DESC) 
  WHERE viewed_by_to_user = FALSE AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_insights_actionable ON market_insights(league_id, priority DESC) 
  WHERE acted_upon = FALSE AND (expires_at IS NULL OR expires_at > NOW());

CREATE INDEX IF NOT EXISTS idx_patterns_active ON trade_patterns(pattern_type, success_rate DESC) 
  WHERE is_active = TRUE;

-- Triggers for updated_at timestamps
CREATE TRIGGER update_user_trade_profiles_updated_at 
  BEFORE UPDATE ON user_trade_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_patterns_updated_at 
  BEFORE UPDATE ON trade_patterns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trade_compatibility_matrix_updated_at 
  BEFORE UPDATE ON trade_compatibility_matrix 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Functions for trade opportunity management
CREATE OR REPLACE FUNCTION calculate_user_trade_activity(p_user_id UUID, p_league_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  trade_count INTEGER;
  recent_activity INTEGER;
  activity_level VARCHAR(15);
BEGIN
  -- Count total trades in the league
  SELECT COUNT(*) INTO trade_count
  FROM trade_history th
  WHERE (th.proposer_id = p_user_id OR th.receiver_id = p_user_id)
    AND th.league_id = p_league_id
    AND th.status = 'completed';
  
  -- Count recent activity (last 30 days)
  SELECT COUNT(*) INTO recent_activity
  FROM trade_history th
  WHERE (th.proposer_id = p_user_id OR th.receiver_id = p_user_id)
    AND th.league_id = p_league_id
    AND th.created_at > NOW() - INTERVAL '30 days';
  
  -- Determine activity level
  IF recent_activity = 0 AND trade_count = 0 THEN
    activity_level := 'inactive';
  ELSIF recent_activity = 0 AND trade_count <= 2 THEN
    activity_level := 'conservative';
  ELSIF recent_activity <= 2 OR trade_count <= 5 THEN
    activity_level := 'moderate';
  ELSIF recent_activity <= 5 OR trade_count <= 10 THEN
    activity_level := 'active';
  ELSE
    activity_level := 'aggressive';
  END IF;
  
  RETURN activity_level;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_trade_compatibility_scores()
RETURNS void AS $$
DECLARE
  league_record RECORD;
  user_pair RECORD;
  compatibility DECIMAL(3,2);
BEGIN
  -- Update compatibility scores for all leagues
  FOR league_record IN SELECT id FROM leagues WHERE is_active = TRUE LOOP
    
    -- Get all user pairs in the league
    FOR user_pair IN 
      SELECT DISTINCT 
        lm1.user_id as user_a_id,
        lm2.user_id as user_b_id
      FROM league_memberships lm1
      JOIN league_memberships lm2 ON lm1.league_id = lm2.league_id
      WHERE lm1.league_id = league_record.id
        AND lm1.user_id < lm2.user_id  -- Avoid duplicates and self-pairs
        AND lm1.is_active = TRUE 
        AND lm2.is_active = TRUE
    LOOP
      
      -- Calculate compatibility (simplified version)
      SELECT 0.5 + (
        CASE 
          WHEN tp1.trading_activity = tp2.trading_activity THEN 0.1 
          ELSE 0.0 
        END +
        CASE 
          WHEN ABS(tp1.risk_tolerance - tp2.risk_tolerance) < 0.2 THEN 0.1 
          ELSE 0.0 
        END +
        CASE 
          WHEN tp1.response_time + tp2.response_time < 48 THEN 0.1 
          ELSE 0.0 
        END
      ) INTO compatibility
      FROM user_trade_profiles tp1, user_trade_profiles tp2
      WHERE tp1.user_id = user_pair.user_a_id 
        AND tp2.user_id = user_pair.user_b_id
        AND tp1.league_id = league_record.id
        AND tp2.league_id = league_record.id;
      
      -- Update or insert compatibility score
      INSERT INTO trade_compatibility_matrix (
        league_id, user_a_id, user_b_id, compatibility_score, last_calculated
      ) VALUES (
        league_record.id, user_pair.user_a_id, user_pair.user_b_id, 
        COALESCE(compatibility, 0.5), NOW()
      )
      ON CONFLICT (league_id, user_a_id, user_b_id) DO UPDATE SET
        compatibility_score = EXCLUDED.compatibility_score,
        last_calculated = EXCLUDED.last_calculated,
        updated_at = NOW();
      
    END LOOP;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION expire_old_opportunities()
RETURNS void AS $$
BEGIN
  -- Mark expired opportunities
  UPDATE trade_opportunities 
  SET status = 'expired' 
  WHERE expires_at < NOW() 
    AND status = 'active';
  
  -- Clean up old market insights
  DELETE FROM market_insights 
  WHERE expires_at < NOW();
  
  -- Clean up old scan results (keep last 30 days)
  DELETE FROM league_scan_results 
  WHERE scan_completed_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old interactions (keep last 90 days)
  DELETE FROM opportunity_interactions 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Clean up old market activity (keep last 180 days)
  DELETE FROM trade_market_activity 
  WHERE activity_date < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- Insert default trade patterns
INSERT INTO trade_patterns (pattern_type, pattern_name, description, success_rate, average_fairness, typical_timeframe, key_indicators) VALUES
('positional_swap', '1-for-1 Positional Need', 'Direct swap addressing mutual positional needs', 0.650, 0.85, '2-3 days', ARRAY['complementary_needs', 'similar_tier']),
('upgrade_downgrade', 'Quality for Depth', 'Trading depth players for higher quality starter', 0.580, 0.75, '3-5 days', ARRAY['roster_depth', 'tier_differential', 'bye_week_coverage']),
('depth_consolidation', '2-for-1 Upgrade', 'Consolidating depth into single higher-tier player', 0.720, 0.70, '1-2 days', ARRAY['excess_depth', 'starting_lineup_need', 'playoff_focus']),
('buy_low_sell_high', 'Value Arbitrage', 'Capitalizing on market inefficiencies and perception gaps', 0.450, 0.65, '1-3 days', ARRAY['recent_performance_divergence', 'injury_recovery', 'schedule_advantage']),
('injury_response', 'Injury Replacement', 'Quick trades to address injury situations', 0.800, 0.60, '6-24 hours', ARRAY['recent_injury', 'depth_available', 'urgency_factor']),
('playoff_push', 'Win-Now Mode', 'Trading future assets for immediate production', 0.550, 0.70, '2-4 days', ARRAY['playoff_race', 'schedule_strength', 'championship_window']),
('dynasty_rebuild', 'Future Asset Accumulation', 'Trading current production for future value', 0.600, 0.75, '5-10 days', ARRAY['team_record', 'player_age', 'draft_capital']),
('handcuff_trade', 'Backfield Insurance', 'Trading for injury insurance or committee clarity', 0.700, 0.80, '1-2 days', ARRAY['injury_risk', 'touch_share', 'playoff_schedule']),
('streaming_trade', 'Matchup Optimization', 'Short-term trades for specific matchup advantages', 0.650, 0.65, '1-2 days', ARRAY['matchup_advantage', 'single_week_need', 'opponent_weakness']),
('blockbuster', 'Multi-Player Overhaul', 'Large trades reshaping multiple roster positions', 0.400, 0.60, '7-14 days', ARRAY['roster_overhaul', 'multiple_needs', 'trust_factor']);

-- Create materialized view for opportunity dashboard
CREATE MATERIALIZED VIEW opportunity_dashboard AS
SELECT 
  l.id as league_id,
  l.name as league_name,
  
  -- Scan metrics
  COALESCE(lsr.total_combinations, 0) as total_combinations,
  COALESCE(lsr.viable_opportunities, 0) as viable_opportunities,
  lsr.scan_completed_at as last_scan,
  lsr.next_scan_scheduled,
  
  -- Active opportunities
  COALESCE(active_ops.opportunity_count, 0) as active_opportunities,
  COALESCE(active_ops.critical_count, 0) as critical_opportunities,
  COALESCE(active_ops.high_count, 0) as high_opportunities,
  
  -- Market insights
  COALESCE(insights.total_insights, 0) as active_insights,
  COALESCE(insights.urgent_insights, 0) as urgent_insights,
  
  -- User engagement
  COALESCE(engagement.active_users, 0) as active_trading_users,
  COALESCE(engagement.avg_response_time, 24) as avg_response_time_hours

FROM leagues l

LEFT JOIN LATERAL (
  SELECT * FROM league_scan_results lsr2
  WHERE lsr2.league_id = l.id
  ORDER BY lsr2.scan_completed_at DESC
  LIMIT 1
) lsr ON TRUE

LEFT JOIN (
  SELECT 
    league_id,
    COUNT(*) as opportunity_count,
    COUNT(*) FILTER (WHERE urgency = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE urgency = 'high') as high_count
  FROM trade_opportunities
  WHERE status = 'active' 
    AND (expires_at IS NULL OR expires_at > NOW())
  GROUP BY league_id
) active_ops ON l.id = active_ops.league_id

LEFT JOIN (
  SELECT 
    league_id,
    COUNT(*) as total_insights,
    COUNT(*) FILTER (WHERE priority >= 4) as urgent_insights
  FROM market_insights
  WHERE acted_upon = FALSE 
    AND (expires_at IS NULL OR expires_at > NOW())
  GROUP BY league_id
) insights ON l.id = insights.league_id

LEFT JOIN (
  SELECT 
    league_id,
    COUNT(DISTINCT user_id) as active_users,
    AVG(response_time) as avg_response_time
  FROM user_trade_profiles
  WHERE trading_activity != 'inactive'
    AND last_active > NOW() - INTERVAL '14 days'
  GROUP BY league_id
) engagement ON l.id = engagement.league_id

WHERE l.is_active = TRUE;

-- Index for the materialized view
CREATE INDEX IF NOT EXISTS idx_opportunity_dashboard_league_id ON opportunity_dashboard(league_id);

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_opportunity_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY opportunity_dashboard;
END;
$$ LANGUAGE plpgsql;