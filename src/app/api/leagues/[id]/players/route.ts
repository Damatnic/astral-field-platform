import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await context.params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const position = searchParams.get("position") || "all";
    const availability = searchParams.get("availability") || "all";
    const sortBy = searchParams.get("sortBy") || "adp";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Use database transaction to fetch players
    const result = await database.transaction(async (client) => {
      // Build the WHERE clause
      let whereConditions = [];
      let queryParams: any[] = [leagueId];
      let paramCount = 1;

      if (search) {
        paramCount++;
        whereConditions.push(`(LOWER(p.name) LIKE $${paramCount} OR LOWER(p.nfl_team) LIKE $${paramCount})`);
        queryParams.push(`%${search.toLowerCase()}%`);
      }

      if (position !== "all") {
        paramCount++;
        whereConditions.push(`p.position = $${paramCount}`);
        queryParams.push(position);
      }

      const whereClause = whereConditions.length > 0 
        ? `AND ${whereConditions.join(' AND ')}` 
        : '';

      // Get players with their roster status
      const playersQuery = `
        SELECT 
          p.id,
          p.name,
          p.position,
          p.nfl_team as team,
          p.adp,
          p.projections as projection,
          p.bye_week,
          p.injury_status,
          p.percent_owned as "percentOwned",
          p.percent_started as "percentStarted",
          p.season_stats as "seasonStats",
          p.last_3_games as "last3Games",
          r.team_id as roster_team_id,
          t.team_name as "ownedBy",
          CASE WHEN r.team_id IS NULL THEN true ELSE false END as available
        FROM players p
        LEFT JOIN rosters r ON p.id = r.player_id AND r.league_id = $1
        LEFT JOIN teams t ON r.team_id = t.id
        WHERE 1=1 ${whereClause}
        ORDER BY 
          CASE WHEN '${sortBy}' = 'adp' THEN p.adp END,
          CASE WHEN '${sortBy}' = 'projection' THEN p.projections END DESC,
          CASE WHEN '${sortBy}' = 'percentOwned' THEN p.percent_owned END DESC,
          CASE WHEN '${sortBy}' = 'name' THEN p.name END
        LIMIT ${limit} OFFSET ${offset}
      `;

      const playersResult = await client.query(playersQuery, queryParams);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM players p
        LEFT JOIN rosters r ON p.id = r.player_id AND r.league_id = $1
        WHERE 1=1 ${whereClause}
      `;

      const countResult = await client.query(countQuery, queryParams);
      const totalPlayers = parseInt(countResult.rows[0]?.total || '0');

      // Filter by availability if needed
      let filteredPlayers = playersResult.rows;
      if (availability === "available") {
        filteredPlayers = filteredPlayers.filter(p => p.available);
      } else if (availability === "owned") {
        filteredPlayers = filteredPlayers.filter(p => !p.available);
      }

      // Format the response
      const players = filteredPlayers.map(player => ({
        id: player.id,
        name: player.name,
        position: player.position,
        team: player.team,
        available: player.available,
        ownedBy: player.ownedBy || null,
        percentOwned: player.percentOwned || 0,
        percentStarted: player.percentStarted || 0,
        seasonStats: player.seasonStats || {},
        last3Games: player.last3Games || [],
        projection: player.projection || 0,
        adp: player.adp || 999,
        byeWeek: player.bye_week,
        injuryStatus: player.injury_status
      }));

      return {
        players,
        pagination: {
          page,
          limit,
          total: totalPlayers,
          totalPages: Math.ceil(totalPlayers / limit)
        },
        filters: {
          search,
          position,
          availability,
          sortBy
        }
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching players:", error);
    
    // Return empty array as fallback
    return NextResponse.json({
      players: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      },
      filters: {
        search: "",
        position: "all",
        availability: "all",
        sortBy: "adp"
      },
      error: "Failed to fetch players"
    });
  }
}

// POST endpoint to add a player to roster
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leagueId } = await context.params;
    const { playerId, teamId, action } = await request.json();

    if (!playerId || !teamId) {
      return NextResponse.json(
        { error: "Player ID and Team ID are required" },
        { status: 400 }
      );
    }

    const result = await database.transaction(async (client) => {
      if (action === "add") {
        // Check if player is already rostered
        const checkQuery = `
          SELECT * FROM rosters 
          WHERE player_id = $1 AND league_id = $2
        `;
        const checkResult = await client.query(checkQuery, [playerId, leagueId]);

        if (checkResult.rows.length > 0) {
          throw new Error("Player is already on a roster");
        }

        // Add player to roster
        const addQuery = `
          INSERT INTO rosters (team_id, player_id, league_id, position_slot)
          VALUES ($1, $2, $3, 'BENCH')
          RETURNING *
        `;
        await client.query(addQuery, [teamId, playerId, leagueId]);

        return { success: true, message: "Player added to roster" };
      } else if (action === "drop") {
        // Remove player from roster
        const dropQuery = `
          DELETE FROM rosters 
          WHERE player_id = $1 AND team_id = $2 AND league_id = $3
        `;
        await client.query(dropQuery, [playerId, teamId, leagueId]);

        return { success: true, message: "Player dropped from roster" };
      } else {
        throw new Error("Invalid action. Use 'add' or 'drop'");
      }
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error updating roster:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to update roster" 
      },
      { status: 500 }
    );
  }
}