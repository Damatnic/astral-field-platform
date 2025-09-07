import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Define the 10 players with their profile data
const LEAGUE_PLAYERS = [
  { id: 1, name: 'Jon Kornbeck', email: 'jon.kornbeck@astralfield.com', teamName: 'Kornbeck\'s Krusaders', abbreviation: 'KRN' },
  { id: 2, name: 'Jack McCaigue', email: 'jack.mccaigue@astralfield.com', teamName: 'Jack\'s Juggernauts', abbreviation: 'JAC' },
  { id: 3, name: 'Nick Hartley', email: 'nick.hartley@astralfield.com', teamName: 'Hartley\'s Heroes', abbreviation: 'HRT' },
  { id: 4, name: 'Cason Minor', email: 'cason.minor@astralfield.com', teamName: 'Minor League', abbreviation: 'MIN' },
  { id: 5, name: 'Brittany Bergum', email: 'brittany.bergum@astralfield.com', teamName: 'Bergum\'s Blitz', abbreviation: 'BRG' },
  { id: 6, name: 'David Jarvey', email: 'david.jarvey@astralfield.com', teamName: 'Jarvey\'s Giants', abbreviation: 'JRV' },
  { id: 7, name: 'Larry McCaigue', email: 'larry.mccaigue@astralfield.com', teamName: 'Larry\'s Legends', abbreviation: 'LAR' },
  { id: 8, name: 'Renee McCaigue', email: 'renee.mccaigue@astralfield.com', teamName: 'Renee\'s Raiders', abbreviation: 'REN' },
  { id: 9, name: 'Nicholas D\'Amato', email: 'nicholas.damato@astralfield.com', teamName: 'D\'Amato Dynasty', abbreviation: 'DAM' },
  { id: 10, name: 'Kaity Lorbecki', email: 'kaity.lorbecki@astralfield.com', teamName: 'Kaity\'s Knights', abbreviation: 'KAI', isAdmin: true }
];

const LEAGUE_CONFIG = {
  name: 'Astral Field Championship League',
  season: 2024,
  maxTeams: 10,
  scoringSystem: 'PPR', // Points Per Reception
  playoffTeams: 6,
  regularSeasonWeeks: 14,
  playoffWeeks: 3,
  tradeDeadlineWeek: 10,
  waiverType: 'FAAB', // Free Agent Acquisition Budget
  waiverBudget: 100,
  rosterSize: 16,
  startingLineup: {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    FLEX: 1,
    DST: 1,
    K: 1,
    BENCH: 7
  }
};

export async function POST(req: NextRequest) {
  try {
    console.log('Initializing league with 10 players...');

    // Step 1: Create or verify users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        pin VARCHAR(4) DEFAULT '1234',
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Step 2: Create leagues table
    await sql`
      CREATE TABLE IF NOT EXISTS leagues (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        season INTEGER NOT NULL,
        commissioner_id INTEGER,
        max_teams INTEGER DEFAULT 10,
        scoring_system VARCHAR(50) DEFAULT 'PPR',
        playoff_teams INTEGER DEFAULT 6,
        regular_season_weeks INTEGER DEFAULT 14,
        playoff_weeks INTEGER DEFAULT 3,
        trade_deadline_week INTEGER DEFAULT 10,
        waiver_type VARCHAR(50) DEFAULT 'FAAB',
        waiver_budget INTEGER DEFAULT 100,
        roster_size INTEGER DEFAULT 16,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Step 3: Create teams table
    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        team_name VARCHAR(255) NOT NULL,
        abbreviation VARCHAR(5) NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        ties INTEGER DEFAULT 0,
        points_for DECIMAL(10, 2) DEFAULT 0,
        points_against DECIMAL(10, 2) DEFAULT 0,
        waiver_priority INTEGER,
        waiver_budget INTEGER DEFAULT 100,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(league_id, team_name),
        UNIQUE(league_id, abbreviation)
      )
    `;

    // Step 4: Create rosters table for player assignments
    await sql`
      CREATE TABLE IF NOT EXISTS rosters (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        player_id VARCHAR(50) NOT NULL,
        player_name VARCHAR(255) NOT NULL,
        position VARCHAR(10) NOT NULL,
        nfl_team VARCHAR(10),
        starter BOOLEAN DEFAULT false,
        acquisition_type VARCHAR(50) DEFAULT 'draft',
        acquisition_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Step 5: Insert all 10 users
    for (const player of LEAGUE_PLAYERS) {
      await sql`
        INSERT INTO users (profile_id, name, email, pin, role)
        VALUES (${player.id}, ${player.name}, ${player.email}, '1234', ${player.isAdmin ? 'admin' : 'user'})
        ON CONFLICT (profile_id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    // Step 6: Create the main league
    const leagueResult = await sql`
      INSERT INTO leagues (
        name, 
        season, 
        commissioner_id,
        max_teams,
        scoring_system,
        playoff_teams,
        regular_season_weeks,
        playoff_weeks,
        trade_deadline_week,
        waiver_type,
        waiver_budget,
        roster_size
      )
      VALUES (
        ${LEAGUE_CONFIG.name},
        ${LEAGUE_CONFIG.season},
        10, -- Admin user as commissioner
        ${LEAGUE_CONFIG.maxTeams},
        ${LEAGUE_CONFIG.scoringSystem},
        ${LEAGUE_CONFIG.playoffTeams},
        ${LEAGUE_CONFIG.regularSeasonWeeks},
        ${LEAGUE_CONFIG.playoffWeeks},
        ${LEAGUE_CONFIG.tradeDeadlineWeek},
        ${LEAGUE_CONFIG.waiverType},
        ${LEAGUE_CONFIG.waiverBudget},
        ${LEAGUE_CONFIG.rosterSize}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    let leagueId: number;
    
    if (leagueResult.rows.length > 0) {
      leagueId = leagueResult.rows[0].id;
    } else {
      // League already exists, get its ID
      const existingLeague = await sql`
        SELECT id FROM leagues 
        WHERE name = ${LEAGUE_CONFIG.name} 
        AND season = ${LEAGUE_CONFIG.season}
        LIMIT 1
      `;
      leagueId = existingLeague.rows[0].id;
    }

    // Step 7: Create teams for all 10 players
    for (let i = 0; i < LEAGUE_PLAYERS.length; i++) {
      const player = LEAGUE_PLAYERS[i];
      
      await sql`
        INSERT INTO teams (
          league_id,
          user_id,
          team_name,
          abbreviation,
          waiver_priority,
          waiver_budget
        )
        VALUES (
          ${leagueId},
          ${player.id},
          ${player.teamName},
          ${player.abbreviation},
          ${i + 1}, -- Initial waiver priority based on order
          ${LEAGUE_CONFIG.waiverBudget}
        )
        ON CONFLICT (league_id, team_name) 
        DO UPDATE SET 
          abbreviation = EXCLUDED.abbreviation,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    // Step 8: Create matchups table for scheduling
    await sql`
      CREATE TABLE IF NOT EXISTS matchups (
        id SERIAL PRIMARY KEY,
        league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
        week INTEGER NOT NULL,
        home_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        home_score DECIMAL(10, 2) DEFAULT 0,
        away_score DECIMAL(10, 2) DEFAULT 0,
        is_playoff BOOLEAN DEFAULT false,
        is_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(league_id, week, home_team_id, away_team_id)
      )
    `;

    // Step 9: Generate regular season schedule (round-robin)
    const teamIds = Array.from({ length: 10 }, (_, i) => i + 1);
    let week = 1;

    // Simple round-robin scheduling
    for (let round = 0; round < LEAGUE_CONFIG.regularSeasonWeeks; round++) {
      const matches = generateWeekMatchups(teamIds, round);
      
      for (const match of matches) {
        await sql`
          INSERT INTO matchups (
            league_id,
            week,
            home_team_id,
            away_team_id,
            is_playoff
          )
          VALUES (
            ${leagueId},
            ${week},
            ${match.home},
            ${match.away},
            false
          )
          ON CONFLICT DO NOTHING
        `;
      }
      week++;
    }

    // Step 10: Create initial league settings
    await sql`
      CREATE TABLE IF NOT EXISTS league_settings (
        id SERIAL PRIMARY KEY,
        league_id INTEGER REFERENCES leagues(id) ON DELETE CASCADE,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(league_id, setting_key)
      )
    `;

    // Insert roster position limits
    const rosterSettings = [
      { key: 'roster_qb', value: '1' },
      { key: 'roster_rb', value: '2' },
      { key: 'roster_wr', value: '2' },
      { key: 'roster_te', value: '1' },
      { key: 'roster_flex', value: '1' },
      { key: 'roster_dst', value: '1' },
      { key: 'roster_k', value: '1' },
      { key: 'roster_bench', value: '7' },
      { key: 'current_week', value: '1' },
      { key: 'draft_status', value: 'pending' }
    ];

    for (const setting of rosterSettings) {
      await sql`
        INSERT INTO league_settings (league_id, setting_key, setting_value)
        VALUES (${leagueId}, ${setting.key}, ${setting.value})
        ON CONFLICT (league_id, setting_key) 
        DO UPDATE SET 
          setting_value = EXCLUDED.setting_value
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'League initialized successfully!',
      data: {
        leagueId,
        leagueName: LEAGUE_CONFIG.name,
        season: LEAGUE_CONFIG.season,
        totalTeams: LEAGUE_PLAYERS.length,
        players: LEAGUE_PLAYERS.map(p => ({
          id: p.id,
          name: p.name,
          teamName: p.teamName,
          abbreviation: p.abbreviation
        })),
        settings: LEAGUE_CONFIG
      }
    });

  } catch (error) {
    console.error('League initialization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize league', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// Helper function to generate weekly matchups
function generateWeekMatchups(teams: number[], weekOffset: number) {
  const matches = [];
  const teamsArray = [...teams];
  
  // Rotate teams for round-robin scheduling
  for (let i = 0; i < weekOffset; i++) {
    teamsArray.push(teamsArray.splice(1, 1)[0]);
  }
  
  // Create matchups for this week
  for (let i = 0; i < teamsArray.length / 2; i++) {
    matches.push({
      home: teamsArray[i],
      away: teamsArray[teamsArray.length - 1 - i]
    });
  }
  
  return matches;
}

// GET endpoint to check league status
export async function GET() {
  try {
    const leagues = await sql`
      SELECT 
        l.*,
        COUNT(DISTINCT t.id) as team_count
      FROM leagues l
      LEFT JOIN teams t ON l.id = t.league_id
      WHERE l.status = 'active'
      GROUP BY l.id
      ORDER BY l.created_at DESC
      LIMIT 1
    `;

    if (leagues.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active league found. Please initialize the league first.',
        initialized: false
      });
    }

    const league = leagues.rows[0];
    
    const teams = await sql`
      SELECT 
        t.*,
        u.name as owner_name,
        u.email as owner_email
      FROM teams t
      JOIN users u ON t.user_id = u.id
      WHERE t.league_id = ${league.id}
      ORDER BY t.wins DESC, t.points_for DESC
    `;

    return NextResponse.json({
      success: true,
      initialized: true,
      league: {
        ...league,
        teams: teams.rows
      }
    });

  } catch (error) {
    console.error('Error checking league status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check league status',
        success: false 
      },
      { status: 500 }
    );
  }
}