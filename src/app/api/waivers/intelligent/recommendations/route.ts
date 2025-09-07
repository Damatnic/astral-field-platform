import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const leagueId = searchParams.get("leagueId");
    const teamId = searchParams.get("teamId");

    if (!leagueId) {
      return NextResponse.json(
        { error: "League ID is required" },
        { status: 400 },
      );
    }

    // Mock waiver recommendations
    const recommendations = [
      {
        playerId: "player_888",
        playerName: "Tank Dell",
        team: "HOU",
        position: "WR",
        priority: "high",
        reasoning: "Increased target share with injury to top receiver",
        projectedValue: 12.5,
        recommendedBid: 15,
        confidence: 85,
        targetTeams: teamId ? [teamId] : ["team_2", "team_5"],
      },
      {
        playerId: "player_999",
        playerName: "Roschon Johnson",
        team: "CHI",
        position: "RB",
        priority: "medium",
        reasoning: "Backup with standalone value in favorable matchup",
        projectedValue: 8.2,
        recommendedBid: 8,
        confidence: 72,
        targetTeams: teamId ? [teamId] : ["team_1", "team_4"],
      },
      {
        playerId: "player_777",
        playerName: "Noah Brown",
        team: "HOU",
        position: "WR",
        priority: "low",
        reasoning: "Deep league flyer with upside potential",
        projectedValue: 4.1,
        recommendedBid: 2,
        confidence: 58,
        targetTeams: teamId ? [teamId] : ["team_6"],
      },
    ];

    // Filter by team if provided
    const filteredRecommendations = teamId
      ? recommendations.filter((rec) => rec.targetTeams.includes(teamId))
      : recommendations;

    return NextResponse.json({
      leagueId,
      teamId,
      recommendations: filteredRecommendations,
      count: filteredRecommendations.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch waiver recommendations" },
      { status: 500 },
    );
  }
}
