import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock injury data
    const injuries = [
      {
        id: "1",
        playerId: "player_123",
        playerName: "Josh Allen",
        team: "BUF",
        position: "QB",
        injuryType: "shoulder",
        severity: "questionable",
        status: "day-to-day",
        estimatedReturn: "1 week",
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "2",
        playerId: "player_456",
        playerName: "Cooper Kupp",
        team: "LAR",
        position: "WR",
        injuryType: "ankle",
        severity: "doubtful",
        status: "week-to-week",
        estimatedReturn: "2-3 weeks",
        lastUpdated: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: injuries,
      count: injuries.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch injury data" },
      { status: 500 },
    );
  }
}
