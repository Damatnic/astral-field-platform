import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get league details
    const leagueResult = await db.query(
      `
      SELECT 
        l.*,
        u.display_name as commissioner_name,
        u.email as commissioner_email
      FROM leagues l
      LEFT JOIN users u ON l.commissioner_id = u.id
      WHERE l.id = $1 AND l.is_active = true
    `,
      [id],
    );

    if (leagueResult.rows.length === 0) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    const league = leagueResult.rows[0];

    // Get teams with standings
    const teamsResult = await db.query(
      `
      SELECT 
        t.*,
        u.display_name as owner_name,
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
    const matchupsResult = await db.query(
      `
      SELECT 
        m.*,
        ht.team_name as home_team_name,
        ht.team_abbreviation as home_team_abbreviation,
        at.team_name as away_team_name,
        at.team_abbreviation as away_team_abbreviation,
        hu.display_name as home_owner_name,
        au.display_name as away_owner_name
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

    return NextResponse.json({
      league: {
        ...league,
        teams: teamsResult.rows,
        matchups: matchupsResult.rows,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching league:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
