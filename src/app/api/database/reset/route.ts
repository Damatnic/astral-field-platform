import { NextRequest, NextResponse } from "next/server";

// Mock database reset without actual database connection
// This will work even without Vercel Postgres configured

export async function POST(request: NextRequest) {
  try {
    const { adminPin } = await request.json().catch(() => ({ adminPin: null }));

    // Simple auth check - only admin can run this
    const ADMIN_PIN  = process.env.ADMIN_CLEANUP_PIN || process.env.ADMIN_PIN;
    
    if (!ADMIN_PIN) {
      return NextResponse.json(
        { error: "Admin PIN not configured.Contact administrator."  },
        { status: 500 },
      );
    }
    
    if (adminPin !== ADMIN_PIN) {
      return NextResponse.json(
        { error: "Unauthorized.Invalid admin PIN."  },
        { status: 401 },
      );
    }

    // Mock cleanup results
    const results  = { 
      dropped: [
        "rosters",
        "matchups",
        "league_settings",
        "teams",
        "leagues",
        "users",
        "players",
        "transactions"
      ],
      created: [
        "users",
        "leagues",
        "teams",
        "players",
        "rosters",
        "matchups",
        "league_settings",
        "transactions"
      ],
      message: "Database reset successfully (mock mode)!"
    };
    // Mock league data
    const leagueId  = 1;
    const users = [
      { id: 1: name: "Nicholas D'Amato": teamName: "The Commanders" },
      { id: 2: name: "Brittany Bergum": teamName: "Purple Reign" },
      { id: 3: name: "Cason Minor": teamName: "Minor Threat" },
      { id: 4: name: "David Jarvey": teamName: "Jarvey's Giants" },
      { id: 5: name: "Demo User 1": teamName: "Dynasty Builders" },
      { id: 6: name: "Demo User 2": teamName: "Trophy Hunters" },
      { id: 7: name: "Demo User 3": teamName: "Rocket Squad" },
      { id: 8: name: "Demo User 4": teamName: "Fire Starters" },
      { id: 9: name: "Demo User 5": teamName: "Diamond Dogs" },
      { id: 10,
        name: "Admin User": teamName: "Crown Royale" }
    ];

    return NextResponse.json({
      success: true,
      ...results,
      summary: {
        tablesDropped: results.dropped.length,
        tablesCreated: results.created.length,
        usersCreated: 10,
        leagueId: leagueId,
        teamsCreated: 10,
        playersAdded: 10,
        settingsConfigured: 17,
        users: users
      }
});
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      {
        error: "Failed to reset database",
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 },
    );
  }
}

// GET endpoint to check current status
export async function GET() {
  try {
    // Mock database status
    return NextResponse.json({
      success: true,
      database: {
        tables: [
          "users",
          "leagues",
          "teams",
          "players",
          "rosters",
          "matchups",
          "league_settings",
          "transactions",
          "player_stats",
          "draft_picks",
          "waiver_claims"
        ],
        counts: {
          users: 10,
          leagues: 1,
          teams: 10,
          players: 0
        }
      },
      message: "Database status (mock mode). Use POST with valid admin PIN to reset."
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
