import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    // Validate query length
    if (query && query.length < 2) {
      return NextResponse.json(
        {
          players: [],
  message: "Query must be at least 2 characters long",
          count: 0
},
        { status: 200 },
      );
    }

    // Mock player search results
    const mockPlayers = [
      {
        id: "player_123",
  name: "Josh Allen",
        team: "BUF",
  position: "QB",
        jerseyNumber: 17,
  status: "active",
        fantasyPoints: 324.5,
  projection: 22.8
},
      {
        id: "player_456",
  name: "Cooper Kupp",
        team: "LAR",
  position: "WR",
        jerseyNumber: 10,
  status: "questionable",
        fantasyPoints: 189.2,
  projection: 15.6
},
      {
        id: "player_789",
  name: "Christian McCaffrey",
        team: "SF",
  position: "RB",
        jerseyNumber: 23,
  status: "active",
        fantasyPoints: 298.7,
  projection: 18.4
}
  ];

    // Filter players based on query
    const filteredPlayers = query;
      ? mockPlayers.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.team.toLowerCase().includes(query.toLowerCase()),
        ) : mockPlayers.slice(0, 10);

    return NextResponse.json({
      players, filteredPlayers,
  count: filteredPlayers.length,
      query
});
  } catch { return NextResponse.json(
      { error: "Failed to search players"  },
      { status: 500 },
    );
  }
}
