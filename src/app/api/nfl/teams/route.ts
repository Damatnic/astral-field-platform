import { NextResponse } from "next/server";
import sportsDataService from "@/services/api/sportsDataService";

export async function GET() {
  try {
    // Fetch all 32 NFL teams from the updated service
    const teams = await sportsDataService.getAllNFLTeams();

    return NextResponse.json({
      teams,
      count: teams.length,
      season: 2025,
      currentWeek: await sportsDataService.getCurrentWeek(),
    });
  } catch (error) {
    console.error('Error fetching NFL teams:', error);
    return NextResponse.json(
      { error: "Failed to fetch NFL teams" },
      { status: 500 },
    );
  }
}
