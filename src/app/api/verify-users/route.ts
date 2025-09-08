import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET() {
  try {
    const result = await database.transaction(async (client) => {
      // Get all demo users with their PINs
      const usersResult = await client.query(`
        SELECT 
          id,
          username,
          email,
          pin,
          is_demo_user,
          created_at
        FROM users
        WHERE is_demo_user = true OR pin IS NOT NULL
        ORDER BY 
          CASE 
            WHEN email LIKE '%damato%' THEN 0
            ELSE 1
          END,
          created_at
      `);

      // Get league info
      const leagueResult = await client.query(`
        SELECT 
          l.id,
          l.name,
          l.season_year,
          l.current_week,
          u.username as commissioner_name
        FROM leagues l
        LEFT JOIN users u ON l.commissioner_id = u.id
        ORDER BY l.created_at DESC
        LIMIT 1
      `);

      // Get teams
      const teamsResult = await client.query(`
        SELECT 
          t.team_name,
          t.team_abbreviation,
          t.wins,
          t.losses,
          t.points_for,
          u.username as owner
        FROM teams t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.wins DESC, t.points_for DESC
      `);

      return {
        users: usersResult.rows,
        league: leagueResult.rows[0] || null,
        teams: teamsResult.rows
      };
    });

    return NextResponse.json({
      success: true,
      message: "Current users and their PINs",
      correctPins: {
        "Nicholas D'Amato": "1009 (Admin/Commissioner)",
        "Jon Kornbeck": "1001",
        "Jack McCaigue": "1002",
        "Nick Hartley": "1003",
        "Cason Minor": "1004",
        "Brittany Bergum": "1005",
        "David Jarvey": "1006",
        "Larry McCaigue": "1007",
        "Renee McCaigue": "1008",
        "Kaity Lorbecki": "1010"
      },
      currentData: result,
      instructions: [
        "If PINs don't match above, run /api/reset-and-setup to fix",
        "Nicholas D'Amato should have PIN 1009",
        "Old PIN 1234 should NOT work anymore"
      ]
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to verify users",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}