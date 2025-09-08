import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get team and league data using database transaction
    const result = await database.transaction(async (client) => {
      // Get a demo user's team (first team in the league)
      const teamResult = await client.query(
        `
        SELECT t.*, u.username as owner_name
        FROM teams t
        JOIN users u ON t.user_id = u.id
        WHERE t.league_id = $1
        ORDER BY t.created_at
        LIMIT 1
      `,
        [id],
      );

      if (teamResult.rows.length === 0) {
        return null; // Will handle 404 outside transaction
      }

      const team = teamResult.rows[0];

      // Get roster with mock players data
      // In a real implementation, this would query actual NFL players from the database
      const mockPlayers = [
          {
          id: "1",
          name: "Josh Allen",
          position: "QB",
          team: "BUF",
          roster_position: "QB",
          projected_points: 22.5,
          season_points: 285.7,
          injury_status: "healthy",
          bye_week: 12,
          },
        {
        id: "2",
        name: "Christian McCaffrey",
        position: "RB",
        team: "SF",
        roster_position: "RB",
        projected_points: 18.3,
        season_points: 198.4,
        injury_status: "healthy",
        bye_week: 9,
        },
        {
        id: "3",
        name: "Tyreek Hill",
        position: "WR",
        team: "MIA",
        roster_position: "WR",
        projected_points: 16.8,
        season_points: 142.6,
        injury_status: "healthy",
        bye_week: 6,
        },
        {
        id: "4",
        name: "Travis Kelce",
        position: "TE",
        team: "KC",
        roster_position: "TE",
        projected_points: 14.2,
        season_points: 128.9,
        injury_status: "healthy",
        bye_week: 10,
        },
        {
        id: "5",
        name: "Stefon Diggs",
        position: "WR",
        team: "HOU",
        roster_position: "WR",
        projected_points: 15.1,
        season_points: 156.3,
        injury_status: "healthy",
        bye_week: 14,
        },
        {
        id: "6",
        name: "Saquon Barkley",
        position: "RB",
        team: "PHI",
        roster_position: "FLEX",
        projected_points: 16.7,
        season_points: 174.2,
        injury_status: "healthy",
        bye_week: 5,
        },
        {
        id: "7",
        name: "Ravens DST",
        position: "DST",
        team: "BAL",
        roster_position: "DST",
        projected_points: 8.5,
        season_points: 89.3,
        injury_status: "healthy",
        bye_week: 14,
        },
        {
        id: "8",
        name: "Justin Tucker",
        position: "K",
        team: "BAL",
        roster_position: "K",
        projected_points: 9.2,
        season_points: 98.7,
        injury_status: "healthy",
        bye_week: 14,
        },
      // Bench players
        {
        id: "9",
        name: "Tua Tagovailoa",
        position: "QB",
        team: "MIA",
        roster_position: "BENCH",
        projected_points: 18.4,
        season_points: 156.8,
        injury_status: "questionable",
        bye_week: 6,
        },
        {
        id: "10",
        name: "Aaron Jones",
        position: "RB",
        team: "MIN",
        roster_position: "BENCH",
        projected_points: 13.8,
        season_points: 134.5,
        injury_status: "healthy",
        bye_week: 6,
        },
        {
        id: "11",
        name: "Mike Evans",
        position: "WR",
        team: "TB",
        roster_position: "BENCH",
        projected_points: 14.6,
        season_points: 145.2,
        injury_status: "healthy",
        bye_week: 11,
        },
        {
        id: "12",
        name: "George Kittle",
        position: "TE",
        team: "SF",
        roster_position: "BENCH",
        projected_points: 12.3,
        season_points: 108.7,
        injury_status: "healthy",
        bye_week: 9,
        },
        {
        id: "13",
        name: "Courtland Sutton",
        position: "WR",
        team: "DEN",
        roster_position: "BENCH",
        projected_points: 11.4,
        season_points: 98.6,
        injury_status: "healthy",
        bye_week: 14,
        },
        {
        id: "14",
        name: "Antonio Gibson",
        position: "RB",
        team: "NE",
        roster_position: "BENCH",
        projected_points: 9.8,
        season_points: 87.4,
        injury_status: "healthy",
        bye_week: 14,
        },
        {
        id: "15",
        name: "Romeo Doubs",
        position: "WR",
        team: "GB",
        roster_position: "BENCH",
        projected_points: 8.7,
        season_points: 76.3,
        injury_status: "healthy",
        bye_week: 10,
        },
      ];

      // Get league roster settings
      const leagueResult = await client.query(
        `
        SELECT settings, season_year
        FROM leagues 
        WHERE id = $1
      `,
        [id],
      );

      const league = leagueResult.rows[0];

      return {
        team,
        roster: mockPlayers,
        rosterSettings: league?.settings?.roster_positions || {},
        currentWeek: 2, // Week 2 of 2025 season
        season: league?.season_year || 2025
      };
    });

    if (!result) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching roster:", error);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
    );
  }
}

// POST endpoint for roster moves (add/drop players)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, playerId, dropPlayerId, position } = body;

    // For now, just return a mock response
    // In a real implementation, this would:
    // 1. Validate the move
    // 2. Check roster limits
    // 3. Update the database
    // 4. Create transaction record

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}ed player`,
      transaction: {
        id: "mock-transaction-id",
        action,
        playerId,
        dropPlayerId,
        timestamp: new Date().toISOString(),
        },
    });
  } catch (error) {
    console.error("Error processing roster move:", error);
    return NextResponse.json(
        { error: "Failed to process roster move" },
        { status: 500 },
    );
  }
}
