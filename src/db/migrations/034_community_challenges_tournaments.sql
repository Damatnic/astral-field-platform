-- Community Challenges and Tournaments Migration
-- Comprehensive gaming system with contests, leaderboards, and rewards

-- Tournament categories and types
CREATE TABLE IF NOT EXISTS tournament_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES tournament_categories(id),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Tournament details
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    rules TEXT NOT NULL,
    tournament_type VARCHAR(30) NOT NULL CHECK (tournament_type IN ('draft_contest', 'season_long', 'weekly_challenge', 'prediction', 'trivia', 'portfolio', 'trading')),
    
    -- Tournament format
    format_type VARCHAR(30) DEFAULT 'single_elimination' CHECK (format_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'ladder', 'battle_royale')),
    scoring_system VARCHAR(30) DEFAULT 'points_based' CHECK (scoring_system IN ('points_based', 'head_to_head', 'accuracy', 'roi', 'ranking')),
    
    -- Participation limits
    max_participants INTEGER,
    min_participants INTEGER DEFAULT 2,
    participant_count INTEGER DEFAULT 0,
    
    -- Entry requirements
    entry_fee DECIMAL(8,2) DEFAULT 0.0,
    entry_requirements JSONB DEFAULT '{}', -- Account age, tier, etc.
    is_invite_only BOOLEAN DEFAULT FALSE,
    invite_code VARCHAR(20),
    
    -- Tournament schedule
    registration_start TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_end TIMESTAMP WITH TIME ZONE NOT NULL,
    tournament_start TIMESTAMP WITH TIME ZONE NOT NULL,
    tournament_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Prize structure
    total_prize_pool DECIMAL(10,2) DEFAULT 0.0,
    prize_distribution JSONB DEFAULT '{}', -- How prizes are distributed
    sponsor_prizes JSONB DEFAULT '[]', -- Non-monetary prizes
    
    -- Tournament status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'registration_open', 'registration_closed', 'active', 'completed', 'cancelled')),
    
    -- Visibility and features
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    allow_spectators BOOLEAN DEFAULT TRUE,
    live_commentary BOOLEAN DEFAULT FALSE,
    
    -- Tournament settings
    settings JSONB DEFAULT '{}', -- Specific settings per tournament type
    
    -- Performance tracking
    view_count INTEGER DEFAULT 0,
    follow_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT tournaments_title_check CHECK (char_length(title) >= 3),
    CONSTRAINT tournaments_dates_check CHECK (registration_start < registration_end AND registration_end <= tournament_start AND tournament_start < tournament_end)
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Participation details
    entry_paid DECIMAL(8,2) DEFAULT 0.0,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    team_name VARCHAR(100),
    
    -- Performance tracking
    current_score DECIMAL(10,2) DEFAULT 0.0,
    current_rank INTEGER,
    best_rank INTEGER,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    matches_lost INTEGER DEFAULT 0,
    
    -- Tournament-specific data
    participant_data JSONB DEFAULT '{}', -- Draft results, lineup choices, etc.
    
    -- Status
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'eliminated', 'withdrawn', 'disqualified')),
    eliminated_at TIMESTAMP WITH TIME ZONE,
    final_rank INTEGER,
    prize_won DECIMAL(8,2) DEFAULT 0.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tournament_id, user_id)
);

-- Tournament matches/rounds
CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    
    -- Match details
    match_name VARCHAR(100),
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    
    -- Participants (can be more than 2 for group matches)
    participant_ids UUID[] NOT NULL,
    
    -- Match results
    winner_id UUID REFERENCES tournament_participants(id),
    scores JSONB DEFAULT '{}', -- Participant scores
    match_data JSONB DEFAULT '{}', -- Match-specific data
    
    -- Match schedule
    scheduled_start TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Match status
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community challenges (separate from tournaments)
CREATE TABLE IF NOT EXISTS community_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Challenge details
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    challenge_type VARCHAR(30) NOT NULL CHECK (challenge_type IN ('prediction', 'pick_em', 'survivor', 'confidence', 'streak', 'trivia', 'photo_contest')),
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    
    -- Challenge parameters
    target_metric VARCHAR(50), -- What they're trying to achieve
    target_value DECIMAL(10,2), -- Target value to reach
    success_criteria JSONB DEFAULT '{}', -- How success is measured
    
    -- Participation
    max_participants INTEGER,
    participant_count INTEGER DEFAULT 0,
    entry_fee DECIMAL(6,2) DEFAULT 0.0,
    
    -- Timeline
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Rewards
    reward_pool DECIMAL(8,2) DEFAULT 0.0,
    reward_type VARCHAR(30) DEFAULT 'points' CHECK (reward_type IN ('points', 'cash', 'badges', 'items')),
    reward_distribution JSONB DEFAULT '{}',
    
    -- Challenge status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'judging', 'completed', 'cancelled')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_sponsored BOOLEAN DEFAULT FALSE,
    sponsor_info JSONB DEFAULT '{}',
    
    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    participant_rating DECIMAL(3,2) DEFAULT 0.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Challenge participants and submissions
CREATE TABLE IF NOT EXISTS challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Submission details
    submission_data JSONB NOT NULL DEFAULT '{}',
    submission_text TEXT,
    submission_files TEXT[], -- URLs to uploaded files
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Scoring and ranking
    score DECIMAL(10,2) DEFAULT 0.0,
    accuracy DECIMAL(5,2), -- For prediction challenges
    rank INTEGER,
    is_winner BOOLEAN DEFAULT FALSE,
    
    -- Rewards earned
    points_earned INTEGER DEFAULT 0,
    cash_earned DECIMAL(8,2) DEFAULT 0.0,
    badges_earned TEXT[] DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'participating' CHECK (status IN ('participating', 'submitted', 'judged', 'withdrawn')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(challenge_id, user_id)
);

-- Leaderboards for various competitions
CREATE TABLE IF NOT EXISTS community_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(30) NOT NULL CHECK (leaderboard_type IN ('tournament_wins', 'challenge_points', 'prediction_accuracy', 'streak_record', 'monthly_champion')),
    time_period VARCHAR(20) NOT NULL CHECK (time_period IN ('all_time', 'yearly', 'monthly', 'weekly', 'daily')),
    
    -- Time range for the leaderboard
    period_start DATE,
    period_end DATE,
    
    -- Leaderboard entries
    entries JSONB NOT NULL DEFAULT '[]', -- Array of {user_id, rank, score, stats}
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Leaderboard settings
    max_entries INTEGER DEFAULT 100,
    auto_update BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(leaderboard_type, time_period, period_start, period_end)
);

-- Achievement and badge system
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Achievement details
    category VARCHAR(30) CHECK (category IN ('tournament', 'challenge', 'social', 'streak', 'milestone', 'special')),
    difficulty VARCHAR(20) CHECK (difficulty IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    
    -- Achievement criteria
    criteria_met JSONB NOT NULL DEFAULT '{}',
    progress_data JSONB DEFAULT '{}',
    
    -- Achievement rewards
    points_awarded INTEGER DEFAULT 0,
    badge_icon VARCHAR(10),
    badge_color VARCHAR(7),
    title_unlocked VARCHAR(50),
    
    -- Achievement metadata
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_type VARCHAR(30), -- tournament, challenge, etc.
    source_id UUID, -- ID of the tournament/challenge
    
    -- Display settings
    is_displayed BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User gaming stats and progression
CREATE TABLE IF NOT EXISTS user_gaming_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Tournament stats
    tournaments_joined INTEGER DEFAULT 0,
    tournaments_won INTEGER DEFAULT 0,
    tournament_winrate DECIMAL(5,2) DEFAULT 0.0,
    total_tournament_earnings DECIMAL(10,2) DEFAULT 0.0,
    
    -- Challenge stats
    challenges_completed INTEGER DEFAULT 0,
    challenges_won INTEGER DEFAULT 0,
    challenge_winrate DECIMAL(5,2) DEFAULT 0.0,
    total_challenge_points INTEGER DEFAULT 0,
    
    -- Prediction stats
    predictions_made INTEGER DEFAULT 0,
    predictions_correct INTEGER DEFAULT 0,
    prediction_accuracy DECIMAL(5,2) DEFAULT 0.0,
    longest_prediction_streak INTEGER DEFAULT 0,
    current_prediction_streak INTEGER DEFAULT 0,
    
    -- Gaming level and progression
    total_experience_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    level_progress DECIMAL(5,2) DEFAULT 0.0,
    
    -- Rankings
    overall_rank INTEGER,
    tournament_rank INTEGER,
    prediction_rank INTEGER,
    
    -- Achievement counts
    total_achievements INTEGER DEFAULT 0,
    rare_achievements INTEGER DEFAULT 0,
    epic_achievements INTEGER DEFAULT 0,
    legendary_achievements INTEGER DEFAULT 0,
    
    -- Gaming preferences
    preferred_tournament_types VARCHAR(30)[] DEFAULT '{}',
    preferred_challenge_types VARCHAR(30)[] DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tournament/challenge follows
CREATE TABLE IF NOT EXISTS tournament_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (
        (tournament_id IS NOT NULL AND challenge_id IS NULL) OR
        (tournament_id IS NULL AND challenge_id IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_category_id ON tournaments(category_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_dates ON tournaments(registration_start, registration_end);
CREATE INDEX IF NOT EXISTS idx_tournaments_featured ON tournaments(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_status ON tournament_participants(status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_rank ON tournament_participants(current_rank);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);

CREATE INDEX IF NOT EXISTS idx_community_challenges_creator_id ON community_challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_community_challenges_type ON community_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_community_challenges_status ON community_challenges(status);
CREATE INDEX IF NOT EXISTS idx_community_challenges_dates ON community_challenges(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_rank ON challenge_participants(rank);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_category ON user_achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_gaming_stats_user_id ON user_gaming_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gaming_stats_level ON user_gaming_stats(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_user_gaming_stats_rank ON user_gaming_stats(overall_rank);

-- Function to update gaming stats
CREATE OR REPLACE FUNCTION update_gaming_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'tournament_participants' THEN
            -- Update tournaments joined count
            INSERT INTO user_gaming_stats (user_id, tournaments_joined)
            VALUES (NEW.user_id, 1)
            ON CONFLICT (user_id)
            DO UPDATE SET tournaments_joined = user_gaming_stats.tournaments_joined + 1;
            
        ELSIF TG_TABLE_NAME = 'challenge_participants' THEN
            -- Update challenges completed count (when submitted)
            IF NEW.status = 'submitted' THEN
                INSERT INTO user_gaming_stats (user_id, challenges_completed)
                VALUES (NEW.user_id, 1)
                ON CONFLICT (user_id)
                DO UPDATE SET challenges_completed = user_gaming_stats.challenges_completed + 1;
            END IF;
            
        ELSIF TG_TABLE_NAME = 'user_achievements' THEN
            -- Update achievement counts and experience points
            INSERT INTO user_gaming_stats (user_id, total_achievements, total_experience_points)
            VALUES (NEW.user_id, 1, NEW.points_awarded)
            ON CONFLICT (user_id)
            DO UPDATE SET 
                total_achievements = user_gaming_stats.total_achievements + 1,
                total_experience_points = user_gaming_stats.total_experience_points + NEW.points_awarded,
                rare_achievements = user_gaming_stats.rare_achievements + CASE WHEN NEW.difficulty = 'rare' THEN 1 ELSE 0 END,
                epic_achievements = user_gaming_stats.epic_achievements + CASE WHEN NEW.difficulty = 'epic' THEN 1 ELSE 0 END,
                legendary_achievements = user_gaming_stats.legendary_achievements + CASE WHEN NEW.difficulty = 'legendary' THEN 1 ELSE 0 END;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF TG_TABLE_NAME = 'tournament_participants' THEN
            -- Update tournament wins when status changes to winner
            IF OLD.final_rank IS NULL AND NEW.final_rank = 1 THEN
                UPDATE user_gaming_stats 
                SET 
                    tournaments_won = tournaments_won + 1,
                    total_tournament_earnings = total_tournament_earnings + COALESCE(NEW.prize_won, 0),
                    tournament_winrate = CASE WHEN tournaments_joined > 0 THEN (tournaments_won + 1) * 100.0 / tournaments_joined ELSE 0 END
                WHERE user_id = NEW.user_id;
            END IF;
            
        ELSIF TG_TABLE_NAME = 'challenge_participants' THEN
            -- Update challenge wins
            IF OLD.is_winner = FALSE AND NEW.is_winner = TRUE THEN
                UPDATE user_gaming_stats 
                SET 
                    challenges_won = challenges_won + 1,
                    total_challenge_points = total_challenge_points + NEW.points_earned,
                    challenge_winrate = CASE WHEN challenges_completed > 0 THEN challenges_won * 100.0 / challenges_completed ELSE 0 END
                WHERE user_id = NEW.user_id;
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for gaming stats
CREATE TRIGGER tournament_participants_stats_trigger
    AFTER INSERT OR UPDATE ON tournament_participants
    FOR EACH ROW EXECUTE FUNCTION update_gaming_stats();

CREATE TRIGGER challenge_participants_stats_trigger
    AFTER INSERT OR UPDATE ON challenge_participants
    FOR EACH ROW EXECUTE FUNCTION update_gaming_stats();

CREATE TRIGGER user_achievements_stats_trigger
    AFTER INSERT ON user_achievements
    FOR EACH ROW EXECUTE FUNCTION update_gaming_stats();

-- Function to calculate user level based on experience points
CREATE OR REPLACE FUNCTION calculate_user_level(experience_points INTEGER)
RETURNS TABLE(level INTEGER, progress DECIMAL(5,2)) AS $$
DECLARE
    calculated_level INTEGER;
    points_for_current_level INTEGER;
    points_for_next_level INTEGER;
    level_progress DECIMAL(5,2);
BEGIN
    -- Level calculation: Level = floor(sqrt(XP / 100)) + 1
    calculated_level := GREATEST(1, FLOOR(SQRT(experience_points / 100.0)) + 1);
    
    -- Calculate progress to next level
    points_for_current_level := POWER(calculated_level - 1, 2) * 100;
    points_for_next_level := POWER(calculated_level, 2) * 100;
    
    level_progress := CASE 
        WHEN points_for_next_level = points_for_current_level THEN 0.0
        ELSE ((experience_points - points_for_current_level) * 100.0) / (points_for_next_level - points_for_current_level)
    END;
    
    RETURN QUERY SELECT calculated_level, LEAST(100.0, GREATEST(0.0, level_progress));
END;
$$ LANGUAGE plpgsql;

-- Insert default tournament categories
INSERT INTO tournament_categories (name, slug, description, icon, color) VALUES
('Fantasy Draft', 'fantasy-draft', 'Draft-based tournament competitions', '🎯', '#3b82f6'),
('Weekly Challenges', 'weekly-challenges', 'Short-term weekly competitions', '⚡', '#10b981'),
('Prediction Contests', 'prediction-contests', 'Test your prediction skills', '🔮', '#8b5cf6'),
('Trading Tournaments', 'trading-tournaments', 'Best fantasy traders compete', '📈', '#f59e0b'),
('Trivia Championships', 'trivia-championships', 'Fantasy football knowledge tests', '🧠', '#ef4444'),
('Season-Long Leagues', 'season-long-leagues', 'Full season competitions', '🏆', '#6366f1')
ON CONFLICT (slug) DO NOTHING;