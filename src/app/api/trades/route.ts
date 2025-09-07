import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const leagueId = searchParams.get("leagueId");
    const teamId = searchParams.get("teamId");

    if (!leagueId) {
      return NextResponse.json(
        { error: "League ID required" },
        { status: 400 },
      );
    }

    // Mock trades list
    const trades = [
      {
        id: "trade_1",
        leagueId,
        status: "pending",
        team1: {
          id: "team_1",
          name: "Team Alpha",
          playersOffered: ["Cooper Kupp", "D'Andre Swift"],
        },
        team2: {
          id: "team_2",
          name: "Team Beta",
          playersOffered: ["Tyreek Hill"],
        },
        proposedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        votes: {
          approve: 8,
          veto: 2,
          pending: 2,
        },
      },
      {
        id: "trade_2",
        leagueId,
        status: "completed",
        team1: {
          id: "team_3",
          name: "Team Gamma",
          playersOffered: ["Josh Allen"],
        },
        team2: {
          id: "team_4",
          name: "Team Delta",
          playersOffered: ["Lamar Jackson", "DeAndre Hopkins"],
        },
        proposedAt: new Date(Date.now() - 172800000).toISOString(),
        completedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    // Filter by team if provided
    const filteredTrades = teamId
      ? trades.filter(
          (trade) => trade.team1.id === teamId || trade.team2.id === teamId,
        )
      : trades;

    return NextResponse.json({
      trades: filteredTrades,
      count: filteredTrades.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch trades" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leagueId, team1Id, team2Id, team1Players, team2Players } = body;

    if (!leagueId || !team1Id || !team2Id) {
      return NextResponse.json(
        { error: "League ID, team1 ID, and team2 ID are required" },
        { status: 400 },
      );
    }

    // Mock trade creation
    const newTrade = {
      id: `trade_${Date.now()}`,
      leagueId,
      status: "pending",
      team1: {
        id: team1Id,
        playersOffered: team1Players || [],
      },
      team2: {
        id: team2Id,
        playersOffered: team2Players || [],
      },
      proposedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 604800000).toISOString(), // 7 days
    };

    return NextResponse.json(newTrade);
  } catch {
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 },
    );
  }
}
