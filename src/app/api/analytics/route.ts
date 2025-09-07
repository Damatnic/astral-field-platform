import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-handler";

export const GET = handleApiError(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "performance";

  // Mock analytics data
  const mockData = {
    performance: {
      totalUsers: 1247,
      activeLeagues: 23,
      totalGames: 156,
      lastUpdated: new Date().toISOString(),
    },
    team: {
      wins: 8,
      losses: 5,
      winPercentage: 0.615,
      pointsFor: 1456.7,
      pointsAgainst: 1342.1,
      averagePoints: 112.1,
    },
  };

  return NextResponse.json({
    success: true,
    data: mockData[type as keyof typeof mockData] || mockData.performance,
    timestamp: new Date().toISOString(),
  });
});

export const POST = handleApiError(async (request: NextRequest) => {
  const body = await request.json();

  return NextResponse.json({
    success: true,
    message: "Analytics data recorded",
    data: body,
    timestamp: new Date().toISOString(),
  });
});
