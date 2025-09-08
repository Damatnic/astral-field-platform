import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = req.headers.get("authorization");
    if (authHeader !== "Bearer astral-admin-2025") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    console.log("Starting database migration...");

    // Use database transaction for migration
    const result = await database.transaction(async (client) => {
      // Enable UUID extension
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      // Drop existing tables for clean migration
      const tablesToDrop = [
        "ai_insights",
        "activity_feed",
        "notifications",
        "messages",
        "player_stats",
        "draft_picks",
        "drafts",
        "waiver_claims",
        "trade_items",
        "trades",
        "transactions",
        "matchups",
        "lineup_slots",
        "lineups",
        "rosters",
        "players",
        "teams",
        "leagues",
        "users",
        "power_rankings",
        "achievements",
      ];

      for (const table of tablesToDrop) {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      }

    // Create Users table
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        avatar_url TEXT,
        auth_provider VARCHAR(50) DEFAULT 'email',
        mfa_enabled BOOLEAN DEFAULT false,
        mfa_secret VARCHAR(255),
        notification_preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP,
        is_premium BOOLEAN DEFAULT false,
        subscription_tier VARCHAR(20) DEFAULT 'free',
        pin VARCHAR(6),
        is_demo_user BOOLEAN DEFAULT false
      )
    `);

    // Create Leagues table
    await client.query(`
      CREATE TABLE leagues (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        commissioner_id UUID REFERENCES users(id),
        season_year INTEGER NOT NULL,
        league_type VARCHAR(50) DEFAULT 'redraft',
        scoring_type VARCHAR(50) DEFAULT 'ppr',
        max_teams INTEGER DEFAULT 10,
        current_week INTEGER DEFAULT 0,
        draft_date TIMESTAMP,
        draft_type VARCHAR(50) DEFAULT 'snake',
        draft_order_type VARCHAR(50) DEFAULT 'random',
        playoff_teams INTEGER DEFAULT 6,
        playoff_start_week INTEGER DEFAULT 15,
        trade_deadline_week INTEGER DEFAULT 10,
        waiver_type VARCHAR(50) DEFAULT 'faab',
        waiver_budget INTEGER DEFAULT 100,
        waiver_process_day VARCHAR(20) DEFAULT 'wednesday',
        waiver_process_time TIME DEFAULT '03:00:00',
        roster_positions JSONB NOT NULL DEFAULT '{"QB": 1, "RB": 2, "WR": 2, "TE": 1, "FLEX": 1, "DST": 1, "K": 1, "BENCH": 7, "IR": 2}',
        scoring_settings JSONB NOT NULL DEFAULT '{}',
        league_settings JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        is_public BOOLEAN DEFAULT false,
        invite_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Teams table
    await client.query(`
      CREATE TABLE teams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        team_name VARCHAR(255) NOT NULL,
        team_abbreviation VARCHAR(5),
        logo_url TEXT,
        motto TEXT,
        draft_position INTEGER,
        waiver_priority INTEGER,
        waiver_budget_remaining INTEGER,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        ties INTEGER DEFAULT 0,
        points_for DECIMAL(10,2) DEFAULT 0,
        points_against DECIMAL(10,2) DEFAULT 0,
        standing_position INTEGER,
        playoff_seed INTEGER,
        is_eliminated BOOLEAN DEFAULT false,
        streak VARCHAR(10) DEFAULT 'W0',
        last_5 VARCHAR(5) DEFAULT '0-0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(league_id, team_name),
        UNIQUE(league_id, team_abbreviation)
      )
    `);

    // Create Players table
    await client.query(`
      CREATE TABLE players (
        id TEXT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(10) NOT NULL,
        nfl_team VARCHAR(10),
        stats JSONB DEFAULT '{}',
        projections JSONB DEFAULT '{}',
        injury_status VARCHAR(50),
        bye_week INTEGER,
        college VARCHAR(100),
        draft_year INTEGER,
        draft_round INTEGER,
        draft_pick INTEGER,
        photo_url TEXT,
        injury_status VARCHAR(50),
        injury_description TEXT,
        injury_updated_at TIMESTAMP,
        bye_week INTEGER,
        adp DECIMAL(5,2),
        auction_value INTEGER,
        is_rookie BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Rosters table
    await client.query(`
      CREATE TABLE rosters (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        player_id UUID REFERENCES players(id),
        roster_position VARCHAR(20),
        acquisition_type VARCHAR(50),
        acquisition_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acquisition_cost INTEGER,
        is_keeper BOOLEAN DEFAULT false,
        keeper_round INTEGER,
        keeper_years_remaining INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, player_id)
      )
    `);

    // Create Lineups table
    await client.query(`
      CREATE TABLE lineups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        week INTEGER NOT NULL,
        season_year INTEGER NOT NULL,
        is_locked BOOLEAN DEFAULT false,
        total_projected_points DECIMAL(10,2),
        total_actual_points DECIMAL(10,2),
        optimal_points DECIMAL(10,2),
        efficiency_rating DECIMAL(5,2),
        rank_projected INTEGER,
        rank_actual INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        locked_at TIMESTAMP,
        UNIQUE(team_id, week, season_year)
      )
    `);

    // Create Lineup Slots table
    await client.query(`
      CREATE TABLE lineup_slots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lineup_id UUID REFERENCES lineups(id) ON DELETE CASCADE,
        player_id UUID REFERENCES players(id),
        slot_position VARCHAR(20) NOT NULL,
        projected_points DECIMAL(10,2),
        actual_points DECIMAL(10,2),
        is_locked BOOLEAN DEFAULT false,
        lock_time TIMESTAMP,
        game_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lineup_id, slot_position)
      )
    `);

    // Create Matchups table
    await client.query(`
      CREATE TABLE matchups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
        week INTEGER NOT NULL,
        season_year INTEGER NOT NULL,
        home_team_id UUID REFERENCES teams(id),
        away_team_id UUID REFERENCES teams(id),
        home_score DECIMAL(10,2) DEFAULT 0,
        away_score DECIMAL(10,2) DEFAULT 0,
        home_projected DECIMAL(10,2),
        away_projected DECIMAL(10,2),
        home_optimal_score DECIMAL(10,2),
        away_optimal_score DECIMAL(10,2),
        winner_id UUID REFERENCES teams(id),
        is_playoff BOOLEAN DEFAULT false,
        is_championship BOOLEAN DEFAULT false,
        is_consolation BOOLEAN DEFAULT false,
        is_complete BOOLEAN DEFAULT false,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(league_id, week, season_year, home_team_id, away_team_id)
      )
    `);

    // Create Transactions table
    await client.query(`
      CREATE TABLE transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
        transaction_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        initiated_by UUID REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        processed_at TIMESTAMP,
        details JSONB NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Trades table
    await client.query(`
      CREATE TABLE trades (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
        team_sender_id UUID REFERENCES teams(id),
        team_receiver_id UUID REFERENCES teams(id),
        status VARCHAR(50) DEFAULT 'proposed',
        expiration_date TIMESTAMP,
        accepted_at TIMESTAMP,
        rejected_at TIMESTAMP,
        veto_votes INTEGER DEFAULT 0,
        veto_threshold INTEGER,
        veto_voters UUID[] DEFAULT '{}',
        commissioner_review BOOLEAN DEFAULT false,
        trade_grade_sender VARCHAR(5),
        trade_grade_receiver VARCHAR(5),
        ai_analysis JSONB,
        counter_offer_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add foreign key for counter offers
    await client.query(`
      ALTER TABLE trades 
      ADD CONSTRAINT fk_counter_offer 
      FOREIGN KEY (counter_offer_id) 
      REFERENCES trades(id)
    `);

    // Create Trade Items table
    await client.query(`
      CREATE TABLE trade_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id),
        player_id UUID REFERENCES players(id),
        draft_pick_round INTEGER,
        draft_pick_year INTEGER,
        draft_pick_original_team_id UUID REFERENCES teams(id),
        faab_amount INTEGER,
        item_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Waiver Claims table
    await client.query(`
      CREATE TABLE waiver_claims (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id),
        player_add_id UUID REFERENCES players(id),
        player_drop_id UUID REFERENCES players(id),
        waiver_priority INTEGER,
        faab_amount INTEGER,
        process_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        failure_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Drafts table
    await client.query(`
      CREATE TABLE drafts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
        draft_date TIMESTAMP NOT NULL,
        draft_type VARCHAR(50) DEFAULT 'snake',
        rounds INTEGER NOT NULL,
        seconds_per_pick INTEGER DEFAULT 90,
        status VARCHAR(50) DEFAULT 'scheduled',
        current_pick INTEGER,
        current_round INTEGER,
        current_team_id UUID REFERENCES teams(id),
        is_complete BOOLEAN DEFAULT false,
        draft_order UUID[],
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        paused_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Draft Picks table
    await client.query(`
      CREATE TABLE draft_picks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id),
        player_id UUID REFERENCES players(id),
        pick_number INTEGER NOT NULL,
        round INTEGER NOT NULL,
        pick_time TIMESTAMP,
        time_taken INTEGER,
        is_keeper BOOLEAN DEFAULT false,
        auto_drafted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(draft_id, pick_number)
      )
    `);

    // Create Player Stats table
    await client.query(`
      CREATE TABLE player_stats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        player_id UUID REFERENCES players(id),
        week INTEGER NOT NULL,
        season_year INTEGER NOT NULL,
        opponent VARCHAR(10),
        is_home BOOLEAN,
        game_date TIMESTAMP,
        game_time VARCHAR(20),
        weather_conditions JSONB,
        stats JSONB NOT NULL,
        fantasy_points_standard DECIMAL(10,2),
        fantasy_points_ppr DECIMAL(10,2),
        fantasy_points_half_ppr DECIMAL(10,2),
        is_projection BOOLEAN DEFAULT false,
        confidence_rating DECIMAL(3,2),
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, week, season_year, is_projection)
      )
    `);

    // Create Messages table
    await client.query(`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        team_id UUID REFERENCES teams(id),
        message_type VARCHAR(50) DEFAULT 'chat',
        content TEXT NOT NULL,
        parent_message_id UUID REFERENCES messages(id),
        thread_id UUID,
        is_pinned BOOLEAN DEFAULT false,
        reactions JSONB DEFAULT '{}',
        mentions UUID[] DEFAULT '{}',
        attachments JSONB DEFAULT '[]',
        edited_at TIMESTAMP,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Notifications table
    await client.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        title VARCHAR(255) NOT NULL,
        message TEXT,
        data JSONB DEFAULT '{}',
        action_url TEXT,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        is_email_sent BOOLEAN DEFAULT false,
        is_push_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Activity Feed table
    await client.query(`
      CREATE TABLE activity_feed (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        actor_user_id UUID REFERENCES users(id),
        actor_team_id UUID REFERENCES teams(id),
        target_user_id UUID REFERENCES users(id),
        target_team_id UUID REFERENCES teams(id),
        description TEXT,
        metadata JSONB DEFAULT '{}',
        importance VARCHAR(20) DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create AI Insights table
    await client.query(`
      CREATE TABLE ai_insights (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        league_id UUID REFERENCES leagues(id),
        team_id UUID REFERENCES teams(id),
        player_id UUID REFERENCES players(id),
        week INTEGER,
        insight_type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        description TEXT,
        confidence_score DECIMAL(3,2),
        impact_score DECIMAL(3,2),
        insight_data JSONB NOT NULL,
        action_items JSONB DEFAULT '[]',
        is_actionable BOOLEAN DEFAULT true,
        is_dismissed BOOLEAN DEFAULT false,
        dismissed_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Power Rankings table
    await client.query(`
      CREATE TABLE power_rankings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        week INTEGER NOT NULL,
        season_year INTEGER NOT NULL,
        rank INTEGER NOT NULL,
        previous_rank INTEGER,
        power_score DECIMAL(10,2),
        trend VARCHAR(20),
        playoff_probability DECIMAL(5,2),
        championship_probability DECIMAL(5,2),
        strength_of_schedule DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(league_id, team_id, week, season_year)
      )
    `);

    // Create Achievements table
    await client.query(`
      CREATE TABLE achievements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        team_id UUID REFERENCES teams(id),
        league_id UUID REFERENCES leagues(id),
        achievement_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon_url TEXT,
        metadata JSONB DEFAULT '{}',
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create all indexes
    const indexes = [
      "CREATE INDEX idx_users_email ON users(email)",
      "CREATE INDEX idx_users_username ON users(username)",
      "CREATE INDEX idx_users_pin ON users(pin) WHERE is_demo_user = true",
      "CREATE INDEX idx_leagues_commissioner ON leagues(commissioner_id)",
      "CREATE INDEX idx_leagues_active ON leagues(is_active)",
      "CREATE INDEX idx_teams_league ON teams(league_id)",
      "CREATE INDEX idx_teams_user ON teams(user_id)",
      "CREATE INDEX idx_teams_standings ON teams(league_id, wins DESC, points_for DESC)",
      "CREATE INDEX idx_players_position ON players(position)",
      "CREATE INDEX idx_players_team ON players(team)",
      "CREATE INDEX idx_players_name ON players(name)",
      "CREATE INDEX idx_rosters_team ON rosters(team_id)",
      "CREATE INDEX idx_rosters_player ON rosters(player_id)",
      "CREATE INDEX idx_lineups_team_week ON lineups(team_id, week, season_year)",
      "CREATE INDEX idx_lineup_slots_lineup ON lineup_slots(lineup_id)",
      "CREATE INDEX idx_matchups_league_week ON matchups(league_id, week, season_year)",
      "CREATE INDEX idx_matchups_teams ON matchups(home_team_id, away_team_id)",
      "CREATE INDEX idx_transactions_league ON transactions(league_id)",
      "CREATE INDEX idx_transactions_user ON transactions(initiated_by)",
      "CREATE INDEX idx_transactions_status ON transactions(status)",
      "CREATE INDEX idx_trades_status ON trades(status)",
      "CREATE INDEX idx_trades_teams ON trades(team_sender_id, team_receiver_id)",
      "CREATE INDEX idx_waiver_claims_team ON waiver_claims(team_id)",
      "CREATE INDEX idx_waiver_claims_status ON waiver_claims(status)",
      "CREATE INDEX idx_draft_picks_draft ON draft_picks(draft_id)",
      "CREATE INDEX idx_draft_picks_team ON draft_picks(team_id)",
      "CREATE INDEX idx_player_stats_player_week ON player_stats(player_id, week, season_year)",
      "CREATE INDEX idx_player_stats_projection ON player_stats(is_projection)",
      "CREATE INDEX idx_messages_league ON messages(league_id)",
      "CREATE INDEX idx_messages_user ON messages(user_id)",
      "CREATE INDEX idx_messages_created ON messages(created_at DESC)",
      "CREATE INDEX idx_notifications_user ON notifications(user_id, is_read)",
      "CREATE INDEX idx_notifications_created ON notifications(created_at DESC)",
      "CREATE INDEX idx_activity_feed_league ON activity_feed(league_id, created_at DESC)",
      "CREATE INDEX idx_ai_insights_team ON ai_insights(team_id)",
      "CREATE INDEX idx_ai_insights_actionable ON ai_insights(is_actionable, is_dismissed)",
      "CREATE INDEX idx_power_rankings_league_week ON power_rankings(league_id, week, season_year)",
    ];

    for (const index of indexes) {
      await client.query(index);
    }

    // Create update timestamp trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Add update triggers
    const triggeredTables = [
      "users",
      "leagues",
      "teams",
      "players",
      "lineups",
      "trades",
      "player_stats",
    ];

    for (const table of triggeredTables) {
      await client.query(`
        CREATE TRIGGER update_${table}_updated_at 
        BEFORE UPDATE ON ${table}
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
      `);
    }

    // Insert demo users
    const demoUsers = [
      {
        name: "Jon Kornbeck",
        email: "jon@astralfield.com",
        username: "jkornbeck",
        pin: "1001",
      },
      {
        name: "Jack McCaigue",
        email: "jack@astralfield.com",
        username: "jmccaigue",
        pin: "1002",
      },
      {
        name: "Nick Hartley",
        email: "nick@astralfield.com",
        username: "nhartley",
        pin: "1003",
      },
      {
        name: "Cason Minor",
        email: "cason@astralfield.com",
        username: "cminor",
        pin: "1004",
      },
      {
        name: "Brittany Bergum",
        email: "brittany@astralfield.com",
        username: "bbergum",
        pin: "1005",
      },
      {
        name: "David Jarvey",
        email: "david@astralfield.com",
        username: "djarvey",
        pin: "1006",
      },
      {
        name: "Larry McCaigue",
        email: "larry@astralfield.com",
        username: "lmccaigue",
        pin: "1007",
      },
      {
        name: "Renee McCaigue",
        email: "renee@astralfield.com",
        username: "rmccaigue",
        pin: "1008",
      },
      {
        name: "Nicholas D'Amato",
        email: "nicholas@astralfield.com",
        username: "ndamato",
        pin: "1009",
      },
      {
        name: "Kaity Lorbecki",
        email: "kaity@astralfield.com",
        username: "klorbecki",
        pin: "1010",
      },
    ];

    const userIds = [];
    for (const user of demoUsers) {
      const result = await client.query(`
        INSERT INTO users (email, username, display_name, pin, is_demo_user)
        VALUES (${user.email}, ${user.username}, ${user.name}, ${user.pin}, true)
        RETURNING id
      `);
      userIds.push(result.rows[0].id);
    }

    // Create demo league
    const leagueResult = await client.query(`
      INSERT INTO leagues (
        name, 
        commissioner_id, 
        season_year,
        scoring_type,
        max_teams
      )
      VALUES (
        'Astral Field Championship League',
        ${userIds[8]},
        2025,
        'ppr',
        10
      )
      RETURNING id
    `);

    const leagueId = leagueResult.rows[0].id;

    // Create teams for all users
    const teamNames = [
      "Kornbeck Crushers",
      "McCaigue Mavericks",
      "Hartley Heroes",
      "Minor Threats",
      "Bergum Blitz",
      "Jarvey Giants",
      "Larry Legends",
      "Renee Raiders",
      "Damato Dynasty",
      "Kaity Knights",
    ];

    for (let i = 0; i < userIds.length; i++) {
      await client.query(`
        INSERT INTO teams (
          league_id,
          user_id,
          team_name,
          team_abbreviation,
          waiver_priority,
          waiver_budget_remaining
        )
        VALUES (
          ${leagueId},
          ${userIds[i]},
          ${teamNames[i]},
          ${teamNames[i].substring(0, 3).toUpperCase()},
          ${i + 1},
          100
        )
      `);
    }

    console.log("Migration completed successfully!");
    
    return {
      usersCreated: userIds.length,
      leagueId,
      tablesCreated: tablesToDrop.length,
      indexesCreated: indexes.length,
    };
    }); // End of transaction

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully!",
      data: result,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    const result = await database.transaction(async (client) => {
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const users = await client.query(`
        SELECT COUNT(*) as count FROM users WHERE is_demo_user = true
      `);

      const leagues = await client.query(`
        SELECT COUNT(*) as count FROM leagues
      `);

      return {
        tables: tables.rows.map((r) => r.table_name),
        demoUsers: users.rows[0]?.count || 0,
        activeLeagues: leagues.rows[0]?.count || 0,
      };
    });

    return NextResponse.json({
      success: true,
      status: "ready",
      database: result,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: "not_migrated",
      error: error instanceof Error ? error.message : "Database not ready",
    });
  }
}
