import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET() { try {
    const result = await database.transaction(async (client) => {
      // Get actual data from database
      const usersResult = await client.query(`
        SELECT id, email, username, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 20
      `);
      
      const teamsResult = await client.query(`
        SELECT t.id, t.user_id, t.team_name, t.league_id, t.wins, t.losses
        FROM teams t
        ORDER BY t.created_at DESC
        LIMIT 20
      `);
      
      const leaguesResult = await client.query(`
        SELECT l.id, l.name, l.commissioner_id, l.season_year, l.current_week
        FROM leagues l
        ORDER BY l.created_at DESC
        LIMIT 10
      `);

      // Build user-team mapping
      const userTeamMap: Record<string, unknown[]> = { }
      for (const team of teamsResult.rows) { if (!userTeamMap[team.user_id]) {
          userTeamMap[team.user_id] = [];
         }
        userTeamMap[team.user_id].push(team);
      }

      return {
        users: usersResult.rows,
  teams: teamsResult.rows,
        leagues: leaguesResult.rows,
        userTeamMap
      }
    });

    return NextResponse.json({
      success: true,
  timestamp: new Date().toISOString(),
      summary: {
  totalUsers: result.users.length,
  totalTeams: result.teams.length,
        totalLeagues: result.leagues.length,
  averageTeamsPerUser: result.teams.length / Math.max(result.users.length, 1)
},
      data: result
});
  } catch (error: unknown) {
    console.error("Database debug error:", error);
    
    // Return empty data as fallback
    return NextResponse.json({
      success: false,
  timestamp: new Date().toISOString(),
      summary: {
        totalUsers: 0,
  totalTeams: 0,
        totalLeagues: 0,
  averageTeamsPerUser: 0
},
      data: {
  users: [],
  teams: [],
        leagues: [],
  userTeamMap: {}
      },
      error: error instanceof Error ? error.message :
  "Database debug failed"
    });
  }
}