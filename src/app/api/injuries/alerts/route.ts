import { NextResponse } from "next/server";

export async function GET() {  try {
    // Mock injury alerts
    const alerts = [
      {
        id: "1",
  playerId: "player_123",
        playerName: "Josh Allen",
  team: "BUF",
        position: "QB",
  injuryType: "shoulder",
        severity: "questionable",
  estimatedReturn: "1-2 weeks",
        createdAt: new Date().toISOString()
},
      {
        id: "2",
  playerId: "player_456",
        playerName: "Cooper Kupp",
  team: "LAR",
        position: "WR",
  injuryType: "ankle",
        severity: "doubtful",
  estimatedReturn: "2-3 weeks",
        createdAt: new Date().toISOString()
}
  ];

    return NextResponse.json({ alerts });
  } catch { return NextResponse.json(
      { error: "Failed to fetch injury alerts"  },
      { status: 500 },
    );
  }
}

export async function POST() { try {
    // Mock create alert
    const newAlert  = {
      id: Date.now().toString(),
  message: "New injury alert created",
      timestamp: new Date().toISOString()
}
    return NextResponse.json(newAlert);
  } catch { return NextResponse.json(
      { error: "Failed to create injury alert"  },
      { status: 500 },
    );
  }
}
