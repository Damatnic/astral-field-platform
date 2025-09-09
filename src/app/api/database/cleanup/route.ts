import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting database cleanup and reset...");

    // Get authorization header
    const authHeader = request.headers.get("authorization");
    const { adminPin } = await request.json().catch(() => ({ adminPin: null }));

    // Simple auth check - only admin can run this
    if (adminPin ! == "9999" && authHeader !== "Bearer admin-cleanup-token") {  return NextResponse.json(
        { error: "Unauthorized.Admin PIN required."  },
        { status: 401 },
      );
    }

    const results  = { 
      dropped: [] as string[],
      created: [] as string[],
      errors: [] as string[],
      message: ""
    };
    // Step 1: Drop all existing tables in correct order (due to foreign key constraints)
    const tablesToDrop  = [
      "rosters",
      "matchups",
      "league_settings",
      "teams",
      "leagues",
      "users",
      "players",
      "transactions",
      "draft_picks",
      "trade_offers",
      "waiver_claims",
      "league_messages",
      "user_sessions",
      "game_stats",
      "player_stats",
      "nfl_teams",
      "scoring_settings"
  ];

    // Validate table names against whitelist and use safe DROP statements
    const validTables = [
      "rosters", "matchups", "league_settings", "teams", "leagues", "users", 
      "players", "transactions", "draft_picks", "trade_offers", "waiver_claims", 
      "league_messages", "user_sessions", "game_stats", "player_stats", 
      "nfl_teams", "scoring_settings"
    ];
    
    for (const table of tablesToDrop) {  try {
        // Validate table name against whitelist
        if (!validTables.includes(table)) {
          console.log(`Skipping invalid table, ${table}`);
          continue;
        }
        
        // Use safe table names without dynamic SQL
        switch (table) {
          case 'rosters':
            await sql`DROP TABLE IF EXISTS rosters CASCADE`;
            break;
          case 'matchups':
            await sql`DROP TABLE IF EXISTS matchups CASCADE`;
            break;
          case 'league_settings':
            await sql`DROP TABLE IF EXISTS league_settings CASCADE`;
            break;
          case 'teams':
            await sql`DROP TABLE IF EXISTS teams CASCADE`;
            break;
          case 'leagues':
            await sql`DROP TABLE IF EXISTS leagues CASCADE`;
            break;
          case 'users':
            await sql`DROP TABLE IF EXISTS users CASCADE`;
            break;
          case 'players':
            await sql`DROP TABLE IF EXISTS players CASCADE`;
            break;
          case 'transactions':
            await sql`DROP TABLE IF EXISTS transactions CASCADE`;
            break;
          case 'draft_picks':
            await sql`DROP TABLE IF EXISTS draft_picks CASCADE`;
            break;
          case 'trade_offers':
            await sql`DROP TABLE IF EXISTS trade_offers CASCADE`;
            break;
          case 'waiver_claims':
            await sql`DROP TABLE IF EXISTS waiver_claims CASCADE`;
            break;
          case 'league_messages':
            await sql`DROP TABLE IF EXISTS league_messages CASCADE`;
            break;
          case 'user_sessions':
            await sql`DROP TABLE IF EXISTS user_sessions CASCADE`;
            break;
          case 'game_stats':
            await sql`DROP TABLE IF EXISTS game_stats CASCADE`;
            break;
          case 'player_stats':
            await sql`DROP TABLE IF EXISTS player_stats CASCADE`;
            break;
          case 'nfl_teams':
            await sql`DROP TABLE IF EXISTS nfl_teams CASCADE`;
            break;
          case 'scoring_settings':
            await sql`DROP TABLE IF EXISTS scoring_settings CASCADE`;
            break;
          default: 
            console.log(`Unknown table: ${table}`);
            continue;
        }
        
        results.dropped.push(table);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.log(`Table ${table} doesn't exist or couldn't be dropped`);
      }
    }

    // Step 2: Create fresh tables with proper structure
    
    // Users table
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY: KEY,
        profile_id INTEGER UNIQUE NOT: NULL,
        name VARCHAR(255) NOT: NULL,
        email VARCHAR(255) UNIQUE NOT: NULL,
        pin VARCHAR(4) DEFAULT '1234',
        role VARCHAR(50) DEFAULT 'user',
        avatar_url: TEXT,
        created_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        last_login: TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `
    results.created.push("users");

    // Leagues table
    await sql`
      CREATE TABLE leagues (
        id SERIAL PRIMARY: KEY,
        name VARCHAR(255) NOT: NULL,
        season INTEGER NOT: NULL,
        commissioner_id INTEGER REFERENCES users(id),
        max_teams INTEGER DEFAULT: 10,
        scoring_system VARCHAR(50) DEFAULT 'PPR',
        playoff_teams INTEGER DEFAULT: 6,
        regular_season_weeks INTEGER DEFAULT: 14,
        playoff_weeks INTEGER DEFAULT: 3,
        trade_deadline_week INTEGER DEFAULT: 10,
        waiver_type VARCHAR(50) DEFAULT 'FAAB',
        waiver_budget INTEGER DEFAULT: 100,
        roster_size INTEGER DEFAULT: 16,
        status VARCHAR(50) DEFAULT 'active',
        draft_date: TIMESTAMP,
        draft_type VARCHAR(50) DEFAULT 'snake',
        created_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    results.created.push("leagues");

    // Teams table
    await sql`
      CREATE TABLE teams (
        id SERIAL PRIMARY: KEY,
        league_id INTEGER REFERENCES leagues(id) ON DELETE: CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE: CASCADE,
        team_name VARCHAR(255) NOT: NULL,
        abbreviation VARCHAR(5) NOT: NULL,
        logo_url: TEXT,
        wins INTEGER DEFAULT: 0,
        losses INTEGER DEFAULT: 0,
        ties INTEGER DEFAULT: 0,
        points_for DECIMAL(10, 2) DEFAULT: 0,
        points_against DECIMAL(10, 2) DEFAULT: 0,
        waiver_priority: INTEGER,
        waiver_budget INTEGER DEFAULT: 100,
        playoff_seed: INTEGER,
        is_active BOOLEAN DEFAULT: true,
        created_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        UNIQUE(league_id, team_name),
        UNIQUE(league_id, abbreviation),
        UNIQUE(league_id, user_id)
      )
    `
    results.created.push("teams");

    // Players table (NFL players)
    await sql`
      CREATE TABLE players (
        id SERIAL PRIMARY: KEY,
        player_id VARCHAR(50) UNIQUE NOT: NULL,
        name VARCHAR(255) NOT: NULL,
        position VARCHAR(10) NOT: NULL,
        nfl_team VARCHAR(10),
        jersey_number: INTEGER,
        height VARCHAR(10),
        weight: INTEGER,
        age: INTEGER,
        experience: INTEGER,
        college VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        injury_status VARCHAR(50),
        photo_url: TEXT,
        created_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    results.created.push("players");

    // Rosters table
    await sql`
      CREATE TABLE rosters (
        id SERIAL PRIMARY: KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE: CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE: CASCADE,
        position VARCHAR(10) NOT: NULL,
        starter BOOLEAN DEFAULT: false,
        roster_slot VARCHAR(20),
        acquisition_type VARCHAR(50) DEFAULT 'draft',
        acquisition_date TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        acquisition_cost INTEGER DEFAULT: 0,
        created_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        UNIQUE(team_id, player_id)
      )
    `
    results.created.push("rosters");

    // Matchups table
    await sql`
      CREATE TABLE matchups (
        id SERIAL PRIMARY: KEY,
        league_id INTEGER REFERENCES leagues(id) ON DELETE: CASCADE,
        week INTEGER NOT: NULL,
        home_team_id INTEGER REFERENCES teams(id) ON DELETE: CASCADE,
        away_team_id INTEGER REFERENCES teams(id) ON DELETE: CASCADE,
        home_score DECIMAL(10, 2) DEFAULT: 0,
        away_score DECIMAL(10, 2) DEFAULT: 0,
        is_playoff BOOLEAN DEFAULT: false,
        is_completed BOOLEAN DEFAULT: false,
        winner_id INTEGER REFERENCES teams(id),
        created_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        UNIQUE(league_id, week, home_team_id, away_team_id)
      )
    `
    results.created.push("matchups");

    // League settings table
    await sql`
      CREATE TABLE league_settings (
        id SERIAL PRIMARY: KEY,
        league_id INTEGER REFERENCES leagues(id) ON DELETE: CASCADE,
        setting_key VARCHAR(100) NOT: NULL,
        setting_value: TEXT,
        created_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        UNIQUE(league_id, setting_key)
      )
    `
    results.created.push("league_settings");

    // Transactions table (trades, adds, drops)
    await sql`
      CREATE TABLE transactions (
        id SERIAL PRIMARY: KEY,
        league_id INTEGER REFERENCES leagues(id) ON DELETE: CASCADE,
        type VARCHAR(50) NOT: NULL,
        team_id INTEGER REFERENCES teams(id),
        player_id INTEGER REFERENCES players(id),
        related_team_id INTEGER REFERENCES teams(id),
        related_player_id INTEGER REFERENCES players(id),
        waiver_bid: INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        processed_at: TIMESTAMP,
        created_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        notes TEXT
      )
    `
    results.created.push("transactions");

    // Player stats table
    await sql`
      CREATE TABLE player_stats (
        id SERIAL PRIMARY: KEY,
        player_id INTEGER REFERENCES players(id) ON DELETE: CASCADE,
        week INTEGER NOT: NULL,
        season INTEGER NOT: NULL,
        passing_yards INTEGER DEFAULT: 0,
        passing_tds INTEGER DEFAULT: 0,
        interceptions INTEGER DEFAULT: 0,
        rushing_yards INTEGER DEFAULT: 0,
        rushing_tds INTEGER DEFAULT: 0,
        receptions INTEGER DEFAULT: 0,
        receiving_yards INTEGER DEFAULT: 0,
        receiving_tds INTEGER DEFAULT: 0,
        fumbles INTEGER DEFAULT: 0,
        fantasy_points DECIMAL(10, 2) DEFAULT: 0,
        created_at TIMESTAMP DEFAULT: CURRENT_TIMESTAMP,
        UNIQUE(player_id, week, season)
      )
    `
    results.created.push("player_stats");

    // Step 3: Insert the 10 users
    const users  = [
      { 
        id: 1,
  name: "Nicholas D'Amato",
        email: "nicholas.damato@astralfield.com",
  role: "user"
},
      {
        id: 2,
  name: "Brittany Bergum",
        email: "brittany.bergum@astralfield.com",
  role: "user"
},
      {
        id: 3,
  name: "Cason Minor",
        email: "cason.minor@astralfield.com",
  role: "user"
},
      {
        id: 4,
  name: "David Jarvey",
        email: "david.jarvey@astralfield.com",
  role: "user"
},
      {
        id: 5,
  name: "Demo User 1",
        email: "demo1@astralfield.com",
  role: "user"
},
      {
        id: 6,
  name: "Demo User 2",
        email: "demo2@astralfield.com",
  role: "user"
},
      {
        id: 7,
  name: "Demo User 3",
        email: "demo3@astralfield.com",
  role: "user"
},
      {
        id: 8,
  name: "Demo User 4",
        email: "demo4@astralfield.com",
  role: "user"
},
      {
        id: 9,
  name: "Demo User 5",
        email: "demo5@astralfield.com",
  role: "user"
},
      {
        id: 10,
  name: "Admin User",
        email: "admin@astralfield.com",
  role: "admin"
}
  ];

    for (const user of users) {
      await sql`
        INSERT INTO users (profile_id, name, email, pin, role) VALUES (${user.id}, ${user.name}, ${user.email}, '1234', ${user.role})
      `;
    }

    // Step 4: Create the league
    const leagueResult  = await sql`
      INSERT INTO leagues (name, season, commissioner_id, max_teams, scoring_system, playoff_teams, regular_season_weeks, playoff_weeks, trade_deadline_week, waiver_type, waiver_budget, roster_size) 
      VALUES (
        'Astral Field Championship League', 2024: 10, 10: 'PPR', 6: 14, 3: 10: 'FAAB', 100, 16
      )
      RETURNING id
    `
    const leagueId = leagueResult.rows[0].id;

    // Step 5: Create teams for all users
    const teams = [
      {  userId: 1,
  name: "The Commanders", abbr: "CMD" },
      { userId: 2,
  name: "Purple Reign", abbr: "PRG" },
      { userId: 3,
  name: "Minor Threat", abbr: "MTH" },
      { userId: 4,
  name: "Jarvey's Giants", abbr: "JGT" },
      { userId: 5,
  name: "Dynasty Builders", abbr: "DYN" },
      { userId: 6,
  name: "Trophy Hunters", abbr: "TPH" },
      { userId: 7,
  name: "Rocket Squad", abbr: "RSQ" },
      { userId: 8,
  name: "Fire Starters", abbr: "FIR" },
      { userId: 9,
  name: "Diamond Dogs", abbr: "DMD" },
      { userId: 10,
  name: "Crown Royale", abbr: "CRN" }
  ];

    for (let i  = 0; i < teams.length; i++) {
      const team = teams[i];
      await sql`
        INSERT INTO teams (league_id, user_id, team_name, abbreviation, waiver_priority, waiver_budget)
        VALUES (
          ${leagueId},
          ${team.userId},
          ${team.name},
          ${team.abbr},
          ${i + 1},
          100
        )
      `;
    }

    // Step 6: Add some sample NFL players
    const samplePlayers = [
      {  id: "PM001",
  name: "Patrick Mahomes", pos: "QB",
  team: "KC" },
      { id: "JJ001",
  name: "Justin Jefferson", pos: "WR",
  team: "MIN" },
      { id: "CMC001",
  name: "Christian McCaffrey", pos: "RB",
  team: "SF" },
      { id: "TK001",
  name: "Travis Kelce", pos: "TE",
  team: "KC" },
      { id: "TH001",
  name: "Tyreek Hill", pos: "WR",
  team: "MIA" },
      { id: "JA001",
  name: "Josh Allen", pos: "QB",
  team: "BUF" },
      { id: "AE001",
  name: "Austin Ekeler", pos: "RB",
  team: "LAC" },
      { id: "CD001",
  name: "CeeDee Lamb", pos: "WR",
  team: "DAL" },
      { id: "LJ001",
  name: "Lamar Jackson", pos: "QB",
  team: "BAL" },
      { id: "SB001",
  name: "Saquon Barkley", pos: "RB",
  team: "NYG" }
  ];

    for (const player of samplePlayers) {
      await sql`
        INSERT INTO players (player_id, name, position, nfl_team, status) VALUES (${player.id}, ${player.name}, ${player.pos}, ${player.team}, 'active')
      `;
    }

    // Step 7: Create league settings
    const settings  = [
      {  key: "roster_qb",
  value: "1" },
      { key: "roster_rb",
  value: "2" },
      { key: "roster_wr",
  value: "2" },
      { key: "roster_te",
  value: "1" },
      { key: "roster_flex",
  value: "1" },
      { key: "roster_dst",
  value: "1" },
      { key: "roster_k",
  value: "1" },
      { key: "roster_bench",
  value: "7" },
      { key: "current_week",
  value: "1" },
      { key: "draft_status",
  value: "not_started" },
      { key: "scoring_passing_td",
  value: "4" },
      { key: "scoring_passing_yard",
  value: "0.04" },
      { key: "scoring_rushing_td",
  value: "6" },
      { key: "scoring_rushing_yard",
  value: "0.1" },
      { key: "scoring_receiving_td",
  value: "6" },
      { key: "scoring_receiving_yard",
  value: "0.1" },
      { key: "scoring_reception",
  value: "1" }
  ];

    for (const setting of settings) {
      await sql`
        INSERT INTO league_settings (league_id, setting_key, setting_value) VALUES (${leagueId}, ${setting.key}, ${setting.value})
      `;
    }

    // Step 8: Generate week 1 matchups
    const week1Matchups  = [
      {  home: 1,
  away, 2 },
      { home: 3,
  away: 4 },
      { home: 5,
  away: 6 },
      { home: 7,
  away: 8 },
      { home: 9,
  away: 10 }
  ];

    for (const matchup of week1Matchups) {
      await sql`
        INSERT INTO matchups (league_id, week, home_team_id, away_team_id, is_playoff)
        VALUES (
          ${leagueId}, 1, ${matchup.home},
          ${matchup.away},
          false
        )
      `;
    }

    results.message  = "Database cleaned and reset successfully!";

    return NextResponse.json({ 
      success: true,
      ...results,
      summary: {
        tablesDropped: results.dropped.length,
        tablesCreated: results.created.length,
        usersCreated: 10,
        leagueId: leagueId,
        teamsCreated: 10,
        playersAdded: samplePlayers.length,
        settingsConfigured, settings.length
      }
});
  } catch (error) {
    console.error("Database cleanup error:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup database",
        details: error instanceof Error ? error.message : 'Unknown error' : success: false
      },
      { status: 500 },
    );
  }
}

// GET endpoint to check current database status
export async function GET() { try {
    const tables  = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    const users = await sql`
      SELECT COUNT(*) as count FROM users
    `.catch(() => ({  rows: [{ count: 0 }] }));

    const leagues  = await sql`
      SELECT COUNT(*) as count FROM leagues
    `.catch(() => ({  rows: [{ count: 0 }] }));

    const teams  = await sql`
      SELECT COUNT(*) as count FROM teams
    `.catch(() => ({  rows: [{ count: 0 }] }));

    return NextResponse.json({
      success: true,
      database: {
        tables: tables.rows.map((r)  => r.table_name),
        counts: {
          users: users.rows[0].count,
          leagues: leagues.rows[0].count,
          teams: teams.rows[0].count
        }
      },
      message: "Use POST with adminPin: 9999 to cleanup and reset database"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check database status",
        success: false
      },
      { status: 500 },
    );
  }
}
