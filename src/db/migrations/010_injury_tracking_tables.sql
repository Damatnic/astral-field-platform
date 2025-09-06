-- Live Injury Tracking Tables

CREATE TABLE IF NOT EXISTS injury_reports (
  id VARCHAR(255) PRIMARY KEY,
  player_id VARCHAR(255) NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  team VARCHAR(10) NOT NULL,
  position VARCHAR(10) NOT NULL,
  injury_type VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('questionable', 'doubtful', 'out', 'ir', 'pup')),
  body_part VARCHAR(100) NOT NULL,
  reported_at TIMESTAMP NOT NULL,
  game_week INTEGER,
  is_game_time BOOLEAN DEFAULT FALSE,
  source VARCHAR(100) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  expected_return TIMESTAMP,
  recovery_timeline JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS injury_impacts (
  id SERIAL PRIMARY KEY,
  injury_report_id VARCHAR(255) REFERENCES injury_reports(id) ON DELETE CASCADE,
  player_id VARCHAR(255) NOT NULL,
  immediate_impact JSONB NOT NULL,
  team_impact JSONB NOT NULL,
  waiver_analysis JSONB NOT NULL,
  trade_implications JSONB NOT NULL,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(injury_report_id)
);

CREATE TABLE IF NOT EXISTS injury_alerts (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  injury_report_id VARCHAR(255) REFERENCES injury_reports(id) ON DELETE CASCADE,
  player_id VARCHAR(255) NOT NULL,
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('roster_player', 'watch_list', 'league_impact')),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_items TEXT[],
  sent_at TIMESTAMP NOT NULL,
  read_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_injury_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_roster_players BOOLEAN DEFAULT TRUE,
  alert_watch_list BOOLEAN DEFAULT TRUE,
  alert_league_impact BOOLEAN DEFAULT FALSE,
  severity_threshold VARCHAR(10) DEFAULT 'medium' CHECK (severity_threshold IN ('critical', 'high', 'medium', 'low')),
  push_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS injury_analytics (
  id SERIAL PRIMARY KEY,
  injury_report_id VARCHAR(255) REFERENCES injury_reports(id) ON DELETE CASCADE,
  player_id VARCHAR(255) NOT NULL,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  pre_injury_projection DECIMAL(6,2),
  post_injury_projection DECIMAL(6,2),
  actual_performance DECIMAL(6,2),
  projection_accuracy DECIMAL(5,4),
  recovery_accuracy DECIMAL(5,4),
  impact_score DECIMAL(6,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_injury_reports_player_id ON injury_reports(player_id);
CREATE INDEX IF NOT EXISTS idx_injury_reports_reported_at ON injury_reports(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_injury_reports_severity ON injury_reports(severity);
CREATE INDEX IF NOT EXISTS idx_injury_reports_team_week ON injury_reports(team, game_week);

CREATE INDEX IF NOT EXISTS idx_injury_alerts_user_id ON injury_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_injury_alerts_sent_at ON injury_alerts(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_injury_alerts_unread ON injury_alerts(user_id, read_at) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_injury_impacts_player_id ON injury_impacts(player_id);
CREATE INDEX IF NOT EXISTS idx_injury_impacts_calculated_at ON injury_impacts(calculated_at DESC);

CREATE INDEX IF NOT EXISTS idx_injury_analytics_player_week ON injury_analytics(player_id, week, season);
CREATE INDEX IF NOT EXISTS idx_injury_analytics_accuracy ON injury_analytics(projection_accuracy DESC);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_injury_reports_updated_at 
  BEFORE UPDATE ON injury_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_injury_preferences_updated_at 
  BEFORE UPDATE ON user_injury_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();