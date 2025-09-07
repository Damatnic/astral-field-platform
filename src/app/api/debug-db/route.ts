import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock database debug information
    const mockData = {
      users: [
        { id: "1", email: "user1@example.com", username: "user1" },
        { id: "2", email: "user2@example.com", username: "user2" },
      ],
      teams: [
        { id: "1", user_id: "1", team_name: "Team 1", league_id: "1" },
        { id: "2", user_id: "2", team_name: "Team 2", league_id: "1" },
      ],
      leagues: [{ id: "1", name: "Test League", commissioner_id: "1" }],
    };

    const users = mockData.users;
    const teams = mockData.teams;
    const leagues = mockData.leagues;

    const userTeamMap: Record<string, unknown[]> = {};
    for (const team of teams) {
      if (!userTeamMap[team.user_id]) {
        userTeamMap[team.user_id] = [];
      }
      userTeamMap[team.user_id].push(team);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalUsers: users.length,
        totalTeams: teams.length,
        totalLeagues: leagues.length,
        averageTeamsPerUser: teams.length / Math.max(users.length, 1),
      },
      data: {
        users,
        teams,
        leagues,
        userTeamMap,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Database debug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database debug failed",
      },
      { status: 500 },
    );
  }
}
