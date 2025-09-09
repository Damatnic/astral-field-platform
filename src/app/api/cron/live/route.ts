import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    const isVercel = !!process.env.VERCEL;
    const cronKey = process.env.CRON_KEY;

    if (!isVercel && cronKey && key !== cronKey) {
      return NextResponse.json({ error: "Forbidden"  }, { status: 403 });
    }

    // Mock live scoring update
    const nowIso = new Date().toISOString();

    // Mock leagues data
    const leagues = [
      { id: "1",
  scoring_ppr: 1 },
      { id: "2",
  scoring_ppr: 0.5 },
      { id: "3",
  scoring_ppr: 0 }
  ];

    const updates = [];
    for (const league of leagues) {
      // Mock scoring update
      updates.push({
        leagueId: league.id,
  scoringType: league.scoring_ppr ? "PPR" : "Standard",
        playersUpdated: Math.floor(Math.random() * 50) + 10,
  timestamp: nowIso
});
    }

    console.log(
      `🏈 Live scoring cron completed, Updated ${leagues.length} leagues`,
    );

    return NextResponse.json({
      success: true,
  message: `Live scoring updated for ${leagues.length} leagues`,
      leagues, updates,
  timestamp: nowIso
});
  } catch (error: unknown) {
    console.error("❌ Live scoring cron error:", error);
    return NextResponse.json(
      { success: false,
        error: error instanceof Error ? error.message : "Live scoring update failed"
      },
      { status: 500 },
    );
  }
}
