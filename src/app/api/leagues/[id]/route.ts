import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get league details
    const result = await database.transaction(async (client) => {
      const leagueResult = await client.query(
      `
      SELECT 
        l.*,
        u.username as commissioner_name,
        u.email as commissioner_email
      FROM leagues l
      LEFT JOIN users u ON l.commissioner_id = u.id
      WHERE l.id = $1 AND l.is_active = true
    `,
      [id],
    );

    if (leagueResult.rows.length === 0) {
        return null;
      }

      const league = leagueResult.rows[0];

      // Get teams with standings
      const teamsResult = await client.query(
      `
      SELECT 
        t.*,
        u.username as owner_name,
        u.email as owner_email,
        u.pin as owner_pin
      FROM teams t
      JOIN users u ON t.user_id = u.id
      WHERE t.league_id = $1
      ORDER BY t.wins DESC, t.points_for DESC
    `,
      [id],
    );

      // Get current week matchups
      const matchupsResult = await client.query(
      `
      SELECT 
        m.*,
        ht.team_name as home_team_name,
        ht.team_abbreviation as home_team_abbreviation,
        at.team_name as away_team_name,
        at.team_abbreviation as away_team_abbreviation,
        hu.username as home_owner_name,
        au.username as away_owner_name
      FROM matchups m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN users hu ON ht.user_id = hu.id
      LEFT JOIN users au ON at.user_id = au.id
      WHERE m.league_id = $1 AND m.week = $2 AND m.season_year = $3
      ORDER BY m.created_at
    `,
      [id, league.current_week, league.season_year],
    );

      // Get recent activity (placeholder for now)
      const recentActivity = [
        {
          id: 1,
          type: "trade",
          description: "Trade between Team A and Team B",
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          type: "waiver",
          description: "Player X claimed off waivers",
          timestamp: new Date().toISOString(),
        },
      ];

      return {
        ...league,
        teams: teamsResult.rows,
        matchups: matchupsResult.rows,
        recentActivity,
      };
    });

    if (!result) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    return NextResponse.json({ league: result });
  } catch (error) {
    console.error("Error fetching league:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
