-- =============================================
-- Generated Teams and League Composition Tables
-- =============================================

-- Generated Leagues Table (stores complete league compositions)
CREATE TABLE IF NOT EXISTS generated_leagues (
    league_id UUID PRIMARY KEY REFERENCES leagues(id) ON DELETE CASCADE,
    composition JSONB NOT NULL,
    competitive_balance DECIMAL(3,2) NOT NULL CHECK (competitive_balance >= 0 AND competitive_balance <= 1),
    parity_score DECIMAL(3,2) NOT NULL CHECK (parity_score >= 0 AND parity_score <= 1),
    storylines JSONB NOT NULL DEFAULT '[]',
    playoff_projections JSONB NOT NULL DEFAULT '{}',
    key_matchups JSONB NOT NULL DEFAULT '[]',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for generated leagues
CREATE INDEX IF NOT EXISTS idx_generated_leagues_generated_at ON generated_leagues(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_leagues_balance ON generated_leagues(competitive_balance DESC);

-- Generated Teams Table (individual team details)
CREATE TABLE IF NOT EXISTS generated_teams (
    team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    owner_archetype VARCHAR(100) NOT NULL,
    strategy VARCHAR(20) NOT NULL CHECK (strategy IN ('value_based', 'positional', 'contrarian', 'safe', 'aggressive', 'balanced')),
    storyline TEXT NOT NULL,
    projected_wins DECIMAL(3,1) NOT NULL CHECK (projected_wins >= 0 AND projected_wins <= 14),
    strength_of_schedule DECIMAL(3,2) DEFAULT 1.0,
    competitive_rating DECIMAL(3,2) NOT NULL CHECK (competitive_rating >= 0 AND competitive_rating <= 1),
    unique_factors JSONB DEFAULT '[]',
    rivalries JSONB DEFAULT '[]',
    roster_construction JSONB NOT NULL DEFAULT '{}',
    personality_profile JSONB DEFAULT '{}',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for generated teams
CREATE INDEX IF NOT EXISTS idx_generated_teams_league_id ON generated_teams(league_id);
CREATE INDEX IF NOT EXISTS idx_generated_teams_strategy ON generated_teams(strategy);
CREATE INDEX IF NOT EXISTS idx_generated_teams_competitive_rating ON generated_teams(competitive_rating DESC);
CREATE INDEX IF NOT EXISTS idx_generated_teams_projected_wins ON generated_teams(projected_wins DESC);

-- Team Archetypes Reference Table (for consistency and reference)
CREATE TABLE IF NOT EXISTS team_archetypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    archetype_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    default_strategy VARCHAR(20) NOT NULL,
    risk_tolerance_range JSONB NOT NULL DEFAULT '{"min": 0.0, "max": 1.0}',
    position_preferences JSONB NOT NULL DEFAULT '{}',
    personality_traits JSONB NOT NULL DEFAULT '{}',
    draft_notes JSONB DEFAULT '[]',
    usage_frequency DECIMAL(3,2) DEFAULT 0.1 CHECK (usage_frequency >= 0 AND usage_frequency <= 1),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for team archetypes
CREATE INDEX IF NOT EXISTS idx_team_archetypes_active ON team_archetypes(active, usage_frequency DESC);
CREATE INDEX IF NOT EXISTS idx_team_archetypes_strategy ON team_archetypes(default_strategy);

-- League Narratives Table (tracks storylines and their development)
CREATE TABLE IF NOT EXISTS league_narratives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    narrative_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    involved_teams JSONB DEFAULT '[]', -- Array of team IDs
    key_players JSONB DEFAULT '[]', -- Array of player names/IDs
    development_stage VARCHAR(20) DEFAULT 'setup' CHECK (development_stage IN ('setup', 'developing', 'climax', 'resolved')),
    importance_level VARCHAR(20) DEFAULT 'medium' CHECK (importance_level IN ('low', 'medium', 'high', 'critical')),
    week_introduced INT DEFAULT 1,
    week_resolved INT NULL,
    resolution_outcome TEXT NULL,
    fan_engagement_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for league narratives
CREATE INDEX IF NOT EXISTS idx_league_narratives_league_id ON league_narratives(league_id);
CREATE INDEX IF NOT EXISTS idx_league_narratives_type ON league_narratives(narrative_type);
CREATE INDEX IF NOT EXISTS idx_league_narratives_stage ON league_narratives(development_stage);
CREATE INDEX IF NOT EXISTS idx_league_narratives_importance ON league_narratives(importance_level, fan_engagement_score DESC);

-- Team Rivalries Table (detailed rivalry tracking)
CREATE TABLE IF NOT EXISTS team_rivalries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_1_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_2_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    rivalry_type VARCHAR(50) NOT NULL DEFAULT 'competitive',
    intensity_level DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (intensity_level >= 0 AND intensity_level <= 1),
    origin_story TEXT,
    head_to_head_record JSONB DEFAULT '{"team_1_wins": 0, "team_2_wins": 0, "ties": 0}',
    key_moments JSONB DEFAULT '[]',
    next_matchup_week INT NULL,
    rivalry_status VARCHAR(20) DEFAULT 'active' CHECK (rivalry_status IN ('building', 'active', 'intense', 'cooling', 'dormant')),
    fan_interest_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate rivalries
    CONSTRAINT idx_team_rivalries_unique UNIQUE (league_id, team_1_id, team_2_id),
    -- Check constraint to prevent team rivalry with itself
    CONSTRAINT check_different_teams CHECK (team_1_id != team_2_id)
);

-- Indexes for team rivalries
CREATE INDEX IF NOT EXISTS idx_team_rivalries_league_id ON team_rivalries(league_id);
CREATE INDEX IF NOT EXISTS idx_team_rivalries_teams ON team_rivalries(team_1_id, team_2_id);
CREATE INDEX IF NOT EXISTS idx_team_rivalries_intensity ON team_rivalries(intensity_level DESC);
CREATE INDEX IF NOT EXISTS idx_team_rivalries_next_matchup ON team_rivalries(next_matchup_week) WHERE next_matchup_week IS NOT NULL;

-- Season Projections Table (detailed season forecasting)
CREATE TABLE IF NOT EXISTS season_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    projected_wins DECIMAL(3,1) NOT NULL,
    projected_losses DECIMAL(3,1) NOT NULL,
    projected_points_for DECIMAL(7,2) NOT NULL,
    projected_points_against DECIMAL(7,2) NOT NULL,
    playoff_probability DECIMAL(3,2) NOT NULL DEFAULT 0.0 CHECK (playoff_probability >= 0 AND playoff_probability <= 1),
    championship_odds DECIMAL(5,4) NOT NULL DEFAULT 0.0 CHECK (championship_odds >= 0 AND championship_odds <= 1),
    strength_of_schedule DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    remaining_schedule_difficulty DECIMAL(3,2) DEFAULT 1.0,
    key_strengths JSONB DEFAULT '[]',
    key_weaknesses JSONB DEFAULT '[]',
    breakout_scenarios JSONB DEFAULT '[]',
    bust_scenarios JSONB DEFAULT '[]',
    projection_confidence DECIMAL(3,2) DEFAULT 0.7,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint for one projection per team per league
    CONSTRAINT idx_season_projections_unique UNIQUE (league_id, team_id)
);

-- Indexes for season projections
CREATE INDEX IF NOT EXISTS idx_season_projections_league_id ON season_projections(league_id);
CREATE INDEX IF NOT EXISTS idx_season_projections_playoff_odds ON season_projections(playoff_probability DESC);
CREATE INDEX IF NOT EXISTS idx_season_projections_championship_odds ON season_projections(championship_odds DESC);
CREATE INDEX IF NOT EXISTS idx_season_projections_updated ON season_projections(last_updated DESC);

-- Fantasy Matchup Predictions Table
CREATE TABLE IF NOT EXISTS fantasy_matchup_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    team_1_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_2_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    predicted_score_team_1 DECIMAL(6,2) NOT NULL,
    predicted_score_team_2 DECIMAL(6,2) NOT NULL,
    win_probability_team_1 DECIMAL(3,2) NOT NULL CHECK (win_probability_team_1 >= 0 AND win_probability_team_1 <= 1),
    matchup_quality_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    key_matchup_factors JSONB DEFAULT '[]',
    upset_potential DECIMAL(3,2) DEFAULT 0.0,
    narrative_elements JSONB DEFAULT '[]',
    prediction_confidence DECIMAL(3,2) DEFAULT 0.7,
    actual_score_team_1 DECIMAL(6,2) NULL,
    actual_score_team_2 DECIMAL(6,2) NULL,
    prediction_accuracy DECIMAL(3,2) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate predictions
    CONSTRAINT idx_matchup_predictions_unique UNIQUE (league_id, week_number, team_1_id, team_2_id)
);

-- Indexes for matchup predictions
CREATE INDEX IF NOT EXISTS idx_matchup_predictions_league_week ON fantasy_matchup_predictions(league_id, week_number);
CREATE INDEX IF NOT EXISTS idx_matchup_predictions_teams ON fantasy_matchup_predictions(team_1_id, team_2_id);
CREATE INDEX IF NOT EXISTS idx_matchup_predictions_quality ON fantasy_matchup_predictions(matchup_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_matchup_predictions_upset ON fantasy_matchup_predictions(upset_potential DESC);

-- =============================================
-- Functions and Procedures
-- =============================================

-- Function to calculate league competitive balance
CREATE OR REPLACE FUNCTION calculate_league_competitive_balance(p_league_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    balance_score DECIMAL := 0;
    win_variance DECIMAL;
    rating_variance DECIMAL;
BEGIN
    -- Calculate variance in projected wins
    WITH win_stats AS (
        SELECT 
            AVG(projected_wins) as avg_wins,
            STDDEV(projected_wins) as stddev_wins
        FROM generated_teams
        WHERE league_id = p_league_id
    )
    SELECT 
        CASE 
            WHEN stddev_wins = 0 THEN 1.0
            ELSE GREATEST(0, 1 - (stddev_wins / 4.0))  -- Normalize by max reasonable stddev
        END
    INTO win_variance
    FROM win_stats;
    
    -- Calculate variance in competitive ratings
    WITH rating_stats AS (
        SELECT 
            AVG(competitive_rating) as avg_rating,
            STDDEV(competitive_rating) as stddev_rating
        FROM generated_teams
        WHERE league_id = p_league_id
    )
    SELECT 
        CASE 
            WHEN stddev_rating = 0 THEN 1.0
            ELSE GREATEST(0, 1 - (stddev_rating / 0.3))  -- Normalize by reasonable stddev
        END
    INTO rating_variance
    FROM rating_stats;
    
    balance_score := (win_variance * 0.6) + (rating_variance * 0.4);
    
    RETURN GREATEST(0, LEAST(1, balance_score));
END;
$$ LANGUAGE plpgsql;

-- Function to generate rivalry intensity based on factors
CREATE OR REPLACE FUNCTION calculate_rivalry_intensity(
    p_team_1_id UUID, 
    p_team_2_id UUID, 
    p_league_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    intensity DECIMAL := 0.3; -- Base intensity
    team_1_rating DECIMAL;
    team_2_rating DECIMAL;
    strategy_1 VARCHAR;
    strategy_2 VARCHAR;
    rating_diff DECIMAL;
BEGIN
    -- Get team data
    SELECT competitive_rating, strategy
    INTO team_1_rating, strategy_1
    FROM generated_teams
    WHERE team_id = p_team_1_id;
    
    SELECT competitive_rating, strategy
    INTO team_2_rating, strategy_2
    FROM generated_teams
    WHERE team_id = p_team_2_id;
    
    -- Calculate rating difference (closer = more intense rivalry)
    rating_diff := ABS(team_1_rating - team_2_rating);
    intensity := intensity + (0.3 - rating_diff); -- Max 0.3 bonus for identical ratings
    
    -- Strategy opposition increases intensity
    IF (strategy_1 = 'aggressive' AND strategy_2 = 'safe') OR
       (strategy_1 = 'safe' AND strategy_2 = 'aggressive') OR
       (strategy_1 = 'value_based' AND strategy_2 = 'contrarian') OR
       (strategy_1 = 'contrarian' AND strategy_2 = 'value_based') THEN
        intensity := intensity + 0.2;
    END IF;
    
    -- Both high-performing teams = higher intensity
    IF team_1_rating > 0.7 AND team_2_rating > 0.7 THEN
        intensity := intensity + 0.2;
    END IF;
    
    RETURN GREATEST(0.1, LEAST(1.0, intensity));
END;
$$ LANGUAGE plpgsql;

-- Function to update narrative development stages
CREATE OR REPLACE FUNCTION update_narrative_development(p_league_id UUID, p_current_week INT)
RETURNS INT AS $$
DECLARE
    updated_count INT := 0;
    narrative RECORD;
BEGIN
    -- Update narratives based on current week
    FOR narrative IN 
        SELECT id, narrative_type, week_introduced, development_stage
        FROM league_narratives
        WHERE league_id = p_league_id 
          AND development_stage != 'resolved'
    LOOP
        -- Progress narrative stages based on time
        IF narrative.development_stage = 'setup' AND p_current_week > narrative.week_introduced + 2 THEN
            UPDATE league_narratives 
            SET development_stage = 'developing', updated_at = NOW()
            WHERE id = narrative.id;
            updated_count := updated_count + 1;
        
        ELSIF narrative.development_stage = 'developing' AND p_current_week > narrative.week_introduced + 6 THEN
            UPDATE league_narratives 
            SET development_stage = 'climax', updated_at = NOW()
            WHERE id = narrative.id;
            updated_count := updated_count + 1;
        
        -- Resolve season-long narratives in final weeks
        ELSIF p_current_week >= 13 AND narrative.development_stage IN ('developing', 'climax') THEN
            UPDATE league_narratives 
            SET 
                development_stage = 'resolved',
                week_resolved = p_current_week,
                updated_at = NOW()
            WHERE id = narrative.id;
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate season summary statistics
CREATE OR REPLACE FUNCTION generate_season_summary(p_league_id UUID)
RETURNS TABLE(
    total_teams INT,
    avg_competitive_balance DECIMAL,
    most_common_strategy VARCHAR,
    total_rivalries INT,
    active_narratives INT,
    playoff_race_tightness DECIMAL,
    championship_favorite VARCHAR,
    biggest_sleeper VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH team_stats AS (
        SELECT 
            COUNT(*) as team_count,
            AVG(competitive_rating) as avg_rating,
            MODE() WITHIN GROUP (ORDER BY strategy) as common_strategy
        FROM generated_teams
        WHERE league_id = p_league_id
    ),
    rivalry_stats AS (
        SELECT COUNT(*) as rivalry_count
        FROM team_rivalries
        WHERE league_id = p_league_id AND rivalry_status = 'active'
    ),
    narrative_stats AS (
        SELECT COUNT(*) as narrative_count
        FROM league_narratives
        WHERE league_id = p_league_id AND development_stage IN ('developing', 'climax')
    ),
    playoff_stats AS (
        SELECT 
            STDDEV(projected_wins) as win_variance,
            MAX(projected_wins) - MIN(projected_wins) as win_spread
        FROM generated_teams
        WHERE league_id = p_league_id
    ),
    favorite_sleeper AS (
        SELECT 
            (SELECT owner_archetype FROM generated_teams WHERE league_id = p_league_id ORDER BY competitive_rating DESC LIMIT 1) as favorite,
            (SELECT owner_archetype FROM generated_teams WHERE league_id = p_league_id ORDER BY competitive_rating ASC LIMIT 1) as sleeper
    )
    SELECT 
        ts.team_count::INT,
        calculate_league_competitive_balance(p_league_id),
        ts.common_strategy,
        rs.rivalry_count::INT,
        ns.narrative_count::INT,
        CASE 
            WHEN ps.win_variance IS NULL OR ps.win_variance = 0 THEN 1.0
            ELSE GREATEST(0, 1 - (ps.win_variance / 3.0))
        END as tightness,
        fs.favorite,
        fs.sleeper
    FROM team_stats ts
    CROSS JOIN rivalry_stats rs
    CROSS JOIN narrative_stats ns
    CROSS JOIN playoff_stats ps
    CROSS JOIN favorite_sleeper fs;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Triggers and Automation
-- =============================================

-- Trigger to update generated teams timestamp
CREATE OR REPLACE FUNCTION update_generated_teams_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_generated_teams_timestamp ON generated_teams;
CREATE TRIGGER trigger_update_generated_teams_timestamp
    BEFORE UPDATE ON generated_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_generated_teams_timestamp();

-- Trigger to update generated leagues timestamp
CREATE OR REPLACE FUNCTION update_generated_leagues_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_generated_leagues_timestamp ON generated_leagues;
CREATE TRIGGER trigger_update_generated_leagues_timestamp
    BEFORE UPDATE ON generated_leagues
    FOR EACH ROW
    EXECUTE FUNCTION update_generated_leagues_timestamp();

-- Trigger to automatically create rivalries when teams are generated
CREATE OR REPLACE FUNCTION auto_create_rivalries()
RETURNS TRIGGER AS $$
DECLARE
    other_team RECORD;
    rivalry_intensity DECIMAL;
BEGIN
    -- Find potential rivalry partners for the newly inserted team
    FOR other_team IN 
        SELECT team_id, strategy, competitive_rating
        FROM generated_teams
        WHERE league_id = NEW.league_id 
          AND team_id != NEW.team_id
          AND team_id NOT IN (
              SELECT CASE WHEN team_1_id = NEW.team_id THEN team_2_id ELSE team_1_id END
              FROM team_rivalries
              WHERE league_id = NEW.league_id 
                AND (team_1_id = NEW.team_id OR team_2_id = NEW.team_id)
          )
    LOOP
        rivalry_intensity := calculate_rivalry_intensity(NEW.team_id, other_team.team_id, NEW.league_id);
        
        -- Create rivalry if intensity is high enough and team doesn't have too many rivalries
        IF rivalry_intensity > 0.6 AND (
            SELECT COUNT(*) 
            FROM team_rivalries 
            WHERE league_id = NEW.league_id 
              AND (team_1_id = NEW.team_id OR team_2_id = NEW.team_id)
        ) < 2 THEN
            INSERT INTO team_rivalries (
                league_id, team_1_id, team_2_id, intensity_level, rivalry_type
            ) VALUES (
                NEW.league_id, 
                NEW.team_id, 
                other_team.team_id, 
                rivalry_intensity,
                'competitive'
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_rivalries ON generated_teams;
CREATE TRIGGER trigger_auto_create_rivalries
    AFTER INSERT ON generated_teams
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_rivalries();

-- =============================================
-- Default Data Seeding
-- =============================================

-- Insert default team archetypes
INSERT INTO team_archetypes (
    archetype_name, description, default_strategy, risk_tolerance_range,
    position_preferences, personality_traits, draft_notes, usage_frequency
) VALUES 
(
    'The Analytics Expert',
    'Data-driven manager who lives by advanced metrics and value calculations',
    'value_based',
    '{"min": 0.2, "max": 0.4}',
    '{"QB": 0.15, "RB": 0.35, "WR": 0.35, "TE": 0.10, "K": 0.02, "DST": 0.03}',
    '{"veteranBias": true, "consistencyFocused": true, "injuryAverse": true}',
    '["Strict adherence to value metrics", "Avoids reaches at all costs", "Targets proven producers"]',
    0.15
),
(
    'The Zero-RB Enthusiast',
    'Contrarian who fades running backs early to build elite skill position core',
    'contrarian',
    '{"min": 0.6, "max": 0.8}',
    '{"QB": 0.25, "RB": 0.15, "WR": 0.40, "TE": 0.15, "K": 0.02, "DST": 0.03}',
    '{"sleperHunter": true, "upside_chaser": true}',
    '["Fades RB early", "Builds elite WR/TE core", "Finds RB value late"]',
    0.12
),
(
    'The Rookie Hunter',
    'Always chasing the next big breakout from the incoming rookie class',
    'aggressive',
    '{"min": 0.7, "max": 0.9}',
    '{"QB": 0.10, "RB": 0.35, "WR": 0.40, "TE": 0.10, "K": 0.02, "DST": 0.03}',
    '{"rookieFocused": true, "sleperHunter": true, "upside_chaser": true}',
    '["Loves rookie potential", "Chases breakout candidates", "High risk, high reward"]',
    0.10
),
(
    'The Conservative Vet',
    'Plays it safe with proven veterans and established producers',
    'safe',
    '{"min": 0.1, "max": 0.3}',
    '{"QB": 0.20, "RB": 0.30, "WR": 0.30, "TE": 0.15, "K": 0.02, "DST": 0.03}',
    '{"handcuffsLover": true, "veteranBias": true, "injuryAverse": true, "consistencyFocused": true}',
    '["Minimizes risk", "Targets reliable veterans", "Handcuffs key players"]',
    0.13
),
(
    'The Positional Purist',
    'Builds through positional scarcity, especially running back depth',
    'positional',
    '{"min": 0.4, "max": 0.6}',
    '{"QB": 0.08, "RB": 0.50, "WR": 0.30, "TE": 0.07, "K": 0.02, "DST": 0.03}',
    '{"handcuffsLover": true, "consistencyFocused": true}',
    '["RB early and often", "Builds positional depth", "Never chases QBs"]',
    0.11
),
(
    'The Balanced Builder',
    'Takes best player available with a well-rounded approach',
    'balanced',
    '{"min": 0.4, "max": 0.6}',
    '{"QB": 0.18, "RB": 0.28, "WR": 0.30, "TE": 0.18, "K": 0.03, "DST": 0.03}',
    '{"consistencyFocused": true}',
    '["Best player available", "Adapts to draft flow", "Balanced approach"]',
    0.15
),
(
    'The Late-Round Hero',
    'Specializes in finding diamonds in the rough in later rounds',
    'contrarian',
    '{"min": 0.8, "max": 1.0}',
    '{"QB": 0.12, "RB": 0.32, "WR": 0.38, "TE": 0.13, "K": 0.02, "DST": 0.03}',
    '{"rookieFocused": true, "sleperHunter": true, "upside_chaser": true}',
    '["Finds diamonds in rough", "Loves sleeper picks", "Contrarian by nature"]',
    0.09
),
(
    'The Stack Master',
    'Builds correlated lineups with quarterback-receiver stacks',
    'positional',
    '{"min": 0.5, "max": 0.7}',
    '{"QB": 0.25, "RB": 0.25, "WR": 0.35, "TE": 0.10, "K": 0.02, "DST": 0.03}',
    '{"upside_chaser": true}',
    '["Loves QB-WR stacks", "Correlates team scoring", "Boom-or-bust approach"]',
    0.08
),
(
    'The Injury Avoider',
    'Prioritizes health and durability above all other factors',
    'safe',
    '{"min": 0.0, "max": 0.2}',
    '{"QB": 0.22, "RB": 0.26, "WR": 0.30, "TE": 0.17, "K": 0.02, "DST": 0.03}',
    '{"handcuffsLover": true, "veteranBias": true, "injuryAverse": true, "consistencyFocused": true}',
    '["Avoids injury-prone players", "Heavy handcuff strategy", "Values durability"]',
    0.07
)
ON CONFLICT (archetype_name) DO NOTHING;

-- =============================================
-- Performance Indexes
-- =============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_generated_teams_comprehensive ON generated_teams(league_id, competitive_rating DESC, strategy);
CREATE INDEX IF NOT EXISTS idx_team_rivalries_comprehensive ON team_rivalries(league_id, intensity_level DESC, rivalry_status);
CREATE INDEX IF NOT EXISTS idx_league_narratives_comprehensive ON league_narratives(league_id, development_stage, importance_level);

-- =============================================
-- Views for Common Queries
-- =============================================

-- View for active league compositions
CREATE OR REPLACE VIEW active_league_compositions AS
SELECT 
    gl.league_id,
    l.name as league_name,
    gl.competitive_balance,
    gl.parity_score,
    jsonb_array_length(gl.storylines) as storyline_count,
    (gl.playoff_projections->>'favorites')::jsonb as playoff_favorites,
    gl.generated_at,
    COUNT(gt.team_id) as team_count
FROM generated_leagues gl
JOIN leagues l ON gl.league_id = l.id
LEFT JOIN generated_teams gt ON gl.league_id = gt.league_id
GROUP BY gl.league_id, l.name, gl.competitive_balance, gl.parity_score, gl.storylines, gl.playoff_projections, gl.generated_at
ORDER BY gl.generated_at DESC;

-- View for rivalry matchups
CREATE OR REPLACE VIEW upcoming_rivalry_matchups AS
SELECT 
    tr.id,
    tr.league_id,
    l.name as league_name,
    t1.team_name as team_1_name,
    t2.team_name as team_2_name,
    tr.intensity_level,
    tr.rivalry_status,
    tr.next_matchup_week,
    tr.fan_interest_score,
    gt1.owner_archetype as team_1_owner,
    gt2.owner_archetype as team_2_owner,
    gt1.strategy as team_1_strategy,
    gt2.strategy as team_2_strategy
FROM team_rivalries tr
JOIN leagues l ON tr.league_id = l.id
JOIN teams t1 ON tr.team_1_id = t1.id
JOIN teams t2 ON tr.team_2_id = t2.id
LEFT JOIN generated_teams gt1 ON tr.team_1_id = gt1.team_id
LEFT JOIN generated_teams gt2 ON tr.team_2_id = gt2.team_id
WHERE tr.rivalry_status IN ('active', 'intense')
  AND tr.next_matchup_week IS NOT NULL
ORDER BY tr.next_matchup_week ASC, tr.intensity_level DESC;

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON TABLE generated_leagues IS 'Complete AI-generated league compositions with competitive balance and storylines';
COMMENT ON TABLE generated_teams IS 'Individual team profiles with archetypes, strategies, and projected performance';
COMMENT ON TABLE team_archetypes IS 'Reference table of fantasy football owner personality archetypes';
COMMENT ON TABLE league_narratives IS 'Dynamic storylines and narratives that develop throughout the season';
COMMENT ON TABLE team_rivalries IS 'Detailed tracking of team rivalries with intensity and development';
COMMENT ON TABLE season_projections IS 'Comprehensive season forecasting for each team';
COMMENT ON TABLE fantasy_matchup_predictions IS 'Weekly matchup predictions with narrative elements';

COMMENT ON FUNCTION calculate_league_competitive_balance(UUID) IS 'Calculates overall competitive balance score for a generated league';
COMMENT ON FUNCTION calculate_rivalry_intensity(UUID, UUID, UUID) IS 'Determines rivalry intensity between two teams based on multiple factors';
COMMENT ON FUNCTION update_narrative_development(UUID, INT) IS 'Progresses league narratives through their development stages';
COMMENT ON FUNCTION generate_season_summary(UUID) IS 'Generates comprehensive season summary statistics';

COMMENT ON VIEW active_league_compositions IS 'Current league compositions with key metrics and team counts';
COMMENT ON VIEW upcoming_rivalry_matchups IS 'Scheduled rivalry matchups with team details and intensity levels';