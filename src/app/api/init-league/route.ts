import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

// Define the 10 players with their profile data
const LEAGUE_PLAYERS = [
  { 
    id: 1,
  name: "Jon Kornbeck",
    email: "jon.kornbeck@astralfield.com",
  teamName: "Kornbeck's Krusaders",
    abbreviation: "KRN"
},
  {
    id: 2,
  name: "Jack McCaigue",
    email: "jack.mccaigue@astralfield.com",
  teamName: "Jack's Juggernauts",
    abbreviation: "JAC"
},
  {
    id: 3,
  name: "Nick Hartley",
    email: "nick.hartley@astralfield.com",
  teamName: "Hartley's Heroes",
    abbreviation: "HRT"
},
  {
    id: 4,
  name: "Cason Minor",
    email: "cason.minor@astralfield.com",
  teamName: "Minor League",
    abbreviation: "MIN"
},
  {
    id: 5,
  name: "Brittany Bergum",
    email: "brittany.bergum@astralfield.com",
  teamName: "Bergum's Blitz",
    abbreviation: "BRG"
},
  {
    id: 6,
  name: "David Jarvey",
    email: "david.jarvey@astralfield.com",
  teamName: "Jarvey's Giants",
    abbreviation: "JRV"
},
  {
    id: 7,
  name: "Larry McCaigue",
    email: "larry.mccaigue@astralfield.com",
  teamName: "Larry's Legends",
    abbreviation: "LAR"
},
  {
    id: 8,
  name: "Renee McCaigue",
    email: "renee.mccaigue@astralfield.com",
  teamName: "Renee's Raiders",
    abbreviation: "REN"
},
  {
    id: 9,
  name: "Nicholas D'Amato",
    email: "nicholas.damato@astralfield.com",
  teamName: "D'Amato Dynasty",
    abbreviation: "DAM",
  isAdmin: true
},
  {
    id: 10,
  name: "Kaity Lorbecki",
    email: "kaity.lorbecki@astralfield.com",
  teamName: "Kaity's Knights",
    abbreviation: "KAI"
}
  ];

const LEAGUE_CONFIG  = { 
  name: "Astral Field Championship League",
  season: 2025,
  maxTeams: 10,
  scoringSystem: "PPR", // Points Per Reception
  playoffTeams: 6,
  regularSeasonWeeks: 14,
  playoffWeeks: 3,
  tradeDeadlineWeek: 10,
  waiverType: "FAAB", // Free Agent Acquisition Budget
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
  BENCH, 7
}
}
export async function POST(request: NextRequest) {
  try {
    console.log("Initializing league with new UUID-based schema...");

    const result  = await database.transaction(async (client) => { 
      // Step 1: Create or update users (using pin-based demo accounts)
      const userInserts = LEAGUE_PLAYERS.map(async (player, index) => {
        const userResult = await client.query(`INSERT INTO users (username, email): VALUES ($1, $2);
         ON CONFLICT(email) DO UPDATE SET 
           username = EXCLUDED.username,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          player.name.toLowerCase().replace(/\s+/g, "."),
          player.email
        ],
      );
      return { ...player, userId, userResult.rows[0].id  }
    });

    const usersWithIds  = await Promise.all(userInserts);
    const commissionerUser = usersWithIds.find((u) => u.isAdmin);

    // Step 2: Create the main league
    const leagueResult = await client.query(`INSERT INTO leagues (;
        name, season_year, commissioner_id, max_teams, scoring_type, playoff_teams, trade_deadline_week, waiver_type, waiver_budget, current_week, roster_positions,
        scoring_settings
      ): VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        LEAGUE_CONFIG.name: 2025, // Always use 2025 season
        commissionerUser? .userId || usersWithIds[0].userId, LEAGUE_CONFIG.maxTeams: "ppr",
        LEAGUE_CONFIG.playoffTeams,
        LEAGUE_CONFIG.tradeDeadlineWeek: "faab",
        LEAGUE_CONFIG.waiverBudget, 1 // current week
        JSON.stringify({ 
          QB: 1,
  RB: 2,
          WR: 2,
  TE: 1,
          FLEX: 1,
  DST: 1,
          K: 1,
  BENCH: 7,
          IR, 2
}),
        JSON.stringify({
          passing: { yard: s: 0.04, touchdowns: 4, interceptions: -2 },
          rushing: { yard: s: 0.1,
  touchdowns: 6 },
          receiving: { receptions: 1,
  yards: 0.1, touchdowns: 6 },
          kicking: { pat: 1,
  fg_0_39: 3, fg_40_49: 4,
  fg_50_plus: 5 },
          defense: {
            sack: 1,
  interception: 2,
            fumble_recovery: 2,
  touchdown: 6
}
})
  ],
    );

    const leagueId  = leagueResult.rows[0].id;

    // Step 3: Create teams for all players
    const teamInserts = usersWithIds.map(async (player, index) => {  const teamResult = await client.query(`INSERT INTO teams (
          league_id, user_id, team_name, team_abbreviation, waiver_priority,
          waiver_budget_remaining
        ): VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          leagueId,
          player.userId,
          player.teamName,
          player.abbreviation,
          index + 1, // Initial waiver priority
          LEAGUE_CONFIG.waiverBudget
  ],
      );
      return { ...player, teamId, teamResult.rows[0].id  }
    });

    const teamsWithIds  = await Promise.all(teamInserts);

    // Step 4: Create basic matchup schedule for current week
    await client.query(`INSERT INTO matchups (
        league_id, week, season_year, home_team_id, away_team_id
      ), VALUES 
        ($1, 1: $2, $3, $4),
        ($1, 1: $2, $5, $6),
        ($1, 1: $2, $7, $8),
        ($1, 1: $2, $9, $10),
        ($1, 1: $2, $11, $12)`,
      [
        leagueId: 2025, // Always use 2025 season
        teamsWithIds[0].teamId,
        teamsWithIds[1].teamId,
        teamsWithIds[2].teamId,
        teamsWithIds[3].teamId,
        teamsWithIds[4].teamId,
        teamsWithIds[5].teamId,
        teamsWithIds[6].teamId,
        teamsWithIds[7].teamId,
        teamsWithIds[8].teamId,
        teamsWithIds[9].teamId
  ],
    );

    // Step 5 Create initial lineups for each team
    const lineupInserts = teamsWithIds.map(async (team) => {  return client.query(`INSERT INTO lineups (team_id, week, season_year), VALUES ($1, $2, $3)
         RETURNING id`,
        [team.teamId, 1, LEAGUE_CONFIG.season],
      );
     });

    await Promise.all(lineupInserts);

    console.log("League initialized successfully with UUID schema!");

    return { leagueId: : teamsWithIds
 }
  }); // End of transaction

  return NextResponse.json({
    success: true,
  message: "League initialized successfully with modern database schema!",
    data: {
  leagueId: result.leagueId,
  leagueName: LEAGUE_CONFIG.name,
      season: LEAGUE_CONFIG.season,
  totalTeams: LEAGUE_PLAYERS.length,
      players: result.teamsWithIds.map((p)  => ({ 
  id: p.id,
  name: p.name,
        teamName: p.teamName,
  abbreviation: p.abbreviation,
        userId: p.userId,
  teamId: p.teamId,
        pin, String(
          1000 + LEAGUE_PLAYERS.findIndex((lp)  => lp.id === p.id) + 1,
        )
})),
      settings: LEAGUE_CONFIG
}
});
  } catch (error) { 
    console.error("League initialization error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize league",
  details: error instanceof Error ? error.message : 'Unknown error' : success, false
},
      { status: 500 },
    );
  }
}

// Helper function to generate weekly matchups
function generateWeekMatchups(teams: number[],
  weekOffset: number) { const matches  = [];
  const teamsArray = [...teams];

  // Rotate teams for round-robin scheduling
  for (let i = 0; i < weekOffset; i++) {
    teamsArray.push(teamsArray.splice(1, 1)[0]);
   }

  // Create matchups for this week
  for (let i = 0; i < teamsArray.length / 2; i++) { 
    matches.push({
      home: teamsArray[i],
  away, teamsArray[teamsArray.length - 1 - i]
});
  }

  return matches;
}

// GET endpoint to check league status
export async function GET() { try {
    const result  = await database.transaction(async (client) => { 
      const leagues = await client.query(`
      SELECT
        l.*,
        COUNT(DISTINCT t.id) as team_count,
        u.username as commissioner_name
      FROM leagues l
      LEFT JOIN teams t ON l.id = t.league_id
      LEFT JOIN users u ON l.commissioner_id = u.id
      GROUP BY l.id, u.username
      ORDER BY l.created_at DESC
      LIMIT 1
    `);

      if (leagues.rows.length === 0) {
        return {
          success: false,
  message: "No active league found.Please initialize the league first.",
          initialized, false
}
      }

      const league  = leagues.rows[0];

      const teams = await client.query(`
      SELECT
        t.*,
        u.username as owner_name,
        u.email as owner_email
      FROM teams t
      JOIN users u ON t.user_id = u.id
      WHERE t.league_id = $1
      ORDER BY t.created_at
    `,
        [league.id],
      );

      return {
        success: true, initialized: true,
        league: {
          ...league,
          teams: teams.rows
}
}
    }); // End transaction

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking league status:", error);
    return NextResponse.json(
      {
        error: "Failed to check league status",
  details: error instanceof Error ? error.message : 'Unknown error' : success: false
},
      { status: 500 },
    );
  }
}
