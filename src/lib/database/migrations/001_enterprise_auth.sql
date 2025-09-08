-- Enterprise Authentication System Database Migration
-- This migration creates all necessary tables for enterprise-grade authentication

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with enhanced security features
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Can be null for OAuth-only users
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar TEXT,
  
  -- Role-based access control
  role VARCHAR(50) NOT NULL DEFAULT 'player' CHECK (role IN ('admin', 'commissioner', 'player', 'analyst', 'viewer', 'suspended')),
  
  -- Security fields
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_verification_token VARCHAR(10),
  phone_verification_expires TIMESTAMP WITH TIME ZONE,
  
  -- MFA settings
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT, -- Encrypted TOTP secret
  mfa_backup_codes JSONB, -- Array of encrypted backup codes
  
  -- Account security
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  
  -- User preferences
  preferences JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

-- User sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Token security
  token_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of JWT token
  refresh_token_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of refresh token
  
  -- Session info
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Device information
  device_info JSONB DEFAULT '{}', -- Browser, OS, device type, etc.
  
  -- Security tracking
  ip_address INET,
  user_agent TEXT,
  location JSONB, -- Geolocation data
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON user_sessions(last_activity);

-- Social logins table for OAuth integration
CREATE TABLE IF NOT EXISTS user_social_logins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'facebook', 'apple', 'twitter', 'discord', 'github')),
  provider_id VARCHAR(255) NOT NULL, -- ID from the OAuth provider
  email VARCHAR(255), -- Email from OAuth provider
  
  -- OAuth data
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  
  -- Status
  verified BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, provider),
  UNIQUE(provider, provider_id)
);

-- Create indexes for social logins
CREATE INDEX IF NOT EXISTS idx_social_logins_user_id ON user_social_logins(user_id);
CREATE INDEX IF NOT EXISTS idx_social_logins_provider ON user_social_logins(provider);
CREATE INDEX IF NOT EXISTS idx_social_logins_provider_id ON user_social_logins(provider_id);

-- Login attempts table for security auditing
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Attempt details
  email VARCHAR(255),
  ip_address INET NOT NULL,
  user_agent TEXT,
  
  -- Result
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(100), -- 'invalid_password', 'user_not_found', 'account_locked', etc.
  
  -- MFA details
  mfa_required BOOLEAN DEFAULT FALSE,
  mfa_verified BOOLEAN DEFAULT FALSE,
  mfa_method VARCHAR(50), -- 'totp', 'sms', 'email', 'backup_code'
  
  -- Location and device
  location JSONB,
  device_fingerprint VARCHAR(255),
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for login attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);

-- Security events table for comprehensive audit logging
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'password_change', 'mfa_setup', etc.
  event_category VARCHAR(50) NOT NULL, -- 'authentication', 'authorization', 'account', 'security'
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Context
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Request details
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(255),
  session_id UUID,
  
  -- Location and device
  location JSONB,
  device_info JSONB,
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for security events
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_category ON security_events(event_category);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);

-- Rate limiting table for API protection
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR(255) NOT NULL, -- IP address, user ID, or API key
  endpoint VARCHAR(255) NOT NULL,
  
  -- Rate limiting data
  requests_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Metadata
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked BOOLEAN DEFAULT FALSE,
  block_reason VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(identifier, endpoint, window_start)
);

-- Create indexes for rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON rate_limits(blocked);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  
  -- Security
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for password reset tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- User permissions table for granular access control
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Permission details
  resource VARCHAR(100) NOT NULL, -- 'leagues', 'teams', 'trades', etc.
  actions TEXT[] NOT NULL, -- ['read', 'write', 'delete']
  conditions JSONB DEFAULT '{}', -- Additional conditions
  
  -- Metadata
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, resource)
);

-- Create indexes for user permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON user_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires_at ON user_permissions(expires_at);

-- Role permissions table for role-based access control
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(50) NOT NULL,
  
  -- Permission details
  resource VARCHAR(100) NOT NULL,
  actions TEXT[] NOT NULL,
  conditions JSONB DEFAULT '{}',
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(role, resource)
);

-- Create indexes for role permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, actions, description) VALUES
  ('admin', '*', ARRAY['*'], 'Full system access'),
  ('commissioner', 'leagues', ARRAY['read', 'update', 'manage'], 'League management'),
  ('commissioner', 'teams', ARRAY['read', 'update', 'manage'], 'Team management'),
  ('commissioner', 'trades', ARRAY['read', 'approve', 'veto'], 'Trade management'),
  ('commissioner', 'waivers', ARRAY['read', 'manage', 'process'], 'Waiver management'),
  ('commissioner', 'settings', ARRAY['read', 'update'], 'League settings'),
  ('commissioner', 'reports', ARRAY['read', 'generate'], 'Reporting access'),
  ('player', 'teams', ARRAY['read', 'update'], 'Own team management'),
  ('player', 'trades', ARRAY['read', 'create', 'accept', 'reject'], 'Trading'),
  ('player', 'waivers', ARRAY['read', 'create'], 'Waiver claims'),
  ('player', 'lineups', ARRAY['read', 'update'], 'Lineup management'),
  ('player', 'messages', ARRAY['read', 'create'], 'League communication'),
  ('analyst', 'players', ARRAY['read'], 'Player data access'),
  ('analyst', 'stats', ARRAY['read'], 'Statistics access'),
  ('analyst', 'analytics', ARRAY['read', 'generate'], 'Analytics tools'),
  ('analyst', 'reports', ARRAY['read'], 'Report viewing'),
  ('viewer', 'leagues', ARRAY['read'], 'League viewing'),
  ('viewer', 'players', ARRAY['read'], 'Player viewing'),
  ('viewer', 'stats', ARRAY['read'], 'Statistics viewing')
ON CONFLICT (role, resource) DO NOTHING;

-- API keys table for API access management
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Key details
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL, -- First few characters for identification
  
  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read'], -- 'read', 'write', 'admin'
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_social_logins_updated_at ON user_social_logins;
CREATE TRIGGER update_user_social_logins_updated_at BEFORE UPDATE ON user_social_logins FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON role_permissions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits;
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create a view for user session summary
CREATE OR REPLACE VIEW user_session_summary AS
SELECT 
  u.id AS user_id,
  u.email,
  u.username,
  COUNT(s.id) AS active_sessions,
  MAX(s.last_activity) AS last_activity,
  COUNT(DISTINCT s.ip_address) AS unique_ips
FROM users u
LEFT JOIN user_sessions s ON u.id = s.user_id AND s.is_active = true AND s.expires_at > NOW()
GROUP BY u.id, u.email, u.username;

-- Create a view for security events summary
CREATE OR REPLACE VIEW security_events_summary AS
SELECT 
  user_id,
  event_type,
  COUNT(*) AS event_count,
  MAX(timestamp) AS last_occurrence,
  COUNT(CASE WHEN severity = 'high' OR severity = 'critical' THEN 1 END) AS high_severity_count
FROM security_events
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY user_id, event_type;

-- Create view for failed login attempts
CREATE OR REPLACE VIEW failed_login_summary AS
SELECT 
  ip_address,
  email,
  COUNT(*) AS failed_attempts,
  MAX(timestamp) AS last_attempt,
  COUNT(DISTINCT email) AS unique_emails_targeted
FROM login_attempts
WHERE success = false AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY ip_address, email
ORDER BY failed_attempts DESC;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '1 day';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old login attempts (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM login_attempts WHERE timestamp < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old security events (keep last 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_events WHERE timestamp < NOW() - INTERVAL '1 year';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO astral_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO astral_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO astral_app_user;

COMMENT ON TABLE users IS 'Enhanced users table with enterprise security features';
COMMENT ON TABLE user_sessions IS 'User sessions with device tracking and security monitoring';
COMMENT ON TABLE user_social_logins IS 'OAuth social login integrations';
COMMENT ON TABLE login_attempts IS 'Login attempt auditing for security monitoring';
COMMENT ON TABLE security_events IS 'Comprehensive security event logging';
COMMENT ON TABLE rate_limits IS 'API rate limiting and abuse prevention';
COMMENT ON TABLE password_reset_tokens IS 'Secure password reset token management';
COMMENT ON TABLE user_permissions IS 'Granular user-specific permissions';
COMMENT ON TABLE role_permissions IS 'Role-based permission definitions';
COMMENT ON TABLE api_keys IS 'API key management for programmatic access';