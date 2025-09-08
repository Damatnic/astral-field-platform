import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function POST() {
  try {
    console.log("🚀 Setting up Neon database tables...");

    // Create all tables from the schema
    await database.transaction(async (client) => {
      // Drop existing tables to ensure clean schema
      console.log("🗑️ Dropping existing tables for clean setup...");
      await client.query('DROP TABLE IF EXISTS player_stats CASCADE');
      await client.query('DROP TABLE IF EXISTS draft_picks CASCADE');
      await client.query('DROP TABLE IF EXISTS rosters CASCADE');
      await client.query('DROP TABLE IF EXISTS teams CASCADE');
      await client.query('DROP TABLE IF EXISTS players CASCADE');
      await client.query('DROP TABLE IF EXISTS leagues CASCADE');
      await client.query('DROP TABLE IF EXISTS users CASCADE');
      
      // Enable UUID extension
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          stack_user_id TEXT UNIQUE,
          email TEXT UNIQUE NOT NULL,
          username TEXT UNIQUE NOT NULL,
          avatar_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Leagues table
      await client.query(`
        CREATE TABLE IF NOT EXISTS leagues (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          commissioner_id UUID REFERENCES users(id) NOT NULL,
          settings JSONB DEFAULT '{}',
          scoring_system JSONB DEFAULT '{}',
          draft_date TIMESTAMPTZ,
          season_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Teams table
      await client.query(`
        CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
          user_id UUID REFERENCES users(id) NOT NULL,
          team_name TEXT NOT NULL,
          draft_position INTEGER,
          waiver_priority INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(league_id, user_id),
          UNIQUE(league_id, team_name)
        )
      `);

      // Players table
      await client.query(`
        CREATE TABLE IF NOT EXISTS players (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          position TEXT NOT NULL,
          nfl_team TEXT NOT NULL,
          stats JSONB DEFAULT '{}',
          projections JSONB DEFAULT '{}',
          injury_status TEXT,
          bye_week INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(name, nfl_team, position)
        )
      `);

      // Rosters table
      await client.query(`
        CREATE TABLE IF NOT EXISTS rosters (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
          player_id TEXT REFERENCES players(id) NOT NULL,
          position_slot TEXT NOT NULL,
          acquired_date TIMESTAMPTZ DEFAULT NOW(),
          dropped_date TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // Draft picks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS draft_picks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          league_id UUID REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
          player_id TEXT REFERENCES players(id) NOT NULL,
          round INTEGER NOT NULL,
          pick INTEGER NOT NULL,
          overall_pick INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(league_id, overall_pick)
        )
      `);

      // Player stats table
      await client.query(`
        CREATE TABLE IF NOT EXISTS player_stats (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          player_id TEXT REFERENCES players(id) ON DELETE CASCADE NOT NULL,
          season_year INTEGER NOT NULL,
          week INTEGER NOT NULL,
          game_stats JSONB DEFAULT '{}',
          fantasy_points DECIMAL(6,2) NOT NULL,
          is_final BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(player_id, season_year, week)
        )
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_players_nfl_team ON players(nfl_team)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_player_stats_season_week ON player_stats(season_year, week)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_teams_league_id ON teams(league_id)');
    });

    const setupResults = {
      success: true,
      message: "Database tables created successfully",
      tables: [
        "users",
        "leagues", 
        "teams",
        "players",
        "rosters",
        "draft_picks",
        "player_stats",
      ],
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Database setup completed");
    return NextResponse.json(setupResults);
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Database setup failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
