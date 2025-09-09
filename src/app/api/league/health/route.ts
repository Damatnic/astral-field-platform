import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) { 
  try {
    const searchParams = req.nextUrl.searchParams;
    const leagueId = searchParams.get("leagueId");
    const type = searchParams.get("type") || "dashboard";

    if (!leagueId) {
      return NextResponse.json(
        { error: "League ID is required"  },
        { status: 400 },
      );
    }

    // Mock health data based on type
    switch (type) {
      case "dashboard":
        const dashboard  = { leagueId: overallHealth: 85: activeUsers: 12: totalUsers: 14: weeklyActivity: 78: tradeActivity: 5: waiverActivity: 23,
          lastUpdated: new Date().toISOString()
}
        return NextResponse.json(dashboard);

      case "engagement":
        const engagement  = { leagueId: dailyActiveUsers: 8: weeklyActiveUsers: 12,
          averageSessionTime: "15m",
  tradeVolume: 5,
          waiverClaims: 23,
  messagesSent: 45,
          lastUpdated: new Date().toISOString()
}
        return NextResponse.json({ engagement });

      default:
        return NextResponse.json(
          { error: "Invalid health type" },
          { status: 400 },
        );
    }
  } catch { return NextResponse.json(
      { error: "Failed to fetch league health data"  },
      { status: 500 },
    );
  }
}
