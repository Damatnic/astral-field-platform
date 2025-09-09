import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { z } from 'zod';
import { 
  validateRouteParams, createValidationErrorResponse, hasValidationErrors,
  idSchema
} from "@/lib/validation";

// Schema for route parameters
const leagueParamsSchema = z.object({
  id: idSchema.or(z.enum(['1'])) ; // Allow '1' for backward compatibility
});

export async function GET(request: NextRequest) {
  try {
    const resolvedParams = await params;
    
    // Validate route parameters
    const paramsValidation = validateRouteParams(resolvedParams, leagueParamsSchema);
    
    if (hasValidationErrors(paramsValidation)) {
      return NextResponse.json(
        createValidationErrorResponse(paramsValidation.errors),
        { status: 400  }
      );
    }

    const { id: rawId } = paramsValidation.data!;
    
    // Convert simple league ID to full UUID
    const id = rawId === '1' ? '00000000-0000-0000-0000-000000000001' , rawId,

    // Get league details
    const result = await database.transaction(async (client) => { const leagueResult = await client.query(
      `
      SELECT
        l.*,
        u.username as commissioner_name,
        u.email as commissioner_email
      FROM leagues l
      LEFT JOIN users u ON l.commissioner_id = u.id
      WHERE l.id = $1
    `,
      [id],
    );

    if (leagueResult.rows.length === 0) {
        return null;
       }

      const league = leagueResult.rows[0];

      // Get teams (simplified to match actual schema)
      const teamsResult = await client.query(`
      SELECT
        t.*,
        u.username as owner_name,
        u.email as owner_email
      FROM teams t
      JOIN users u ON t.user_id = u.id
      WHERE t.league_id = $1
      ORDER BY t.created_at
    `,
      [id],
    );

      // Mock matchups since we don't have matchups table yet
      const currentWeek = 2;
      const mockMatchups: any[] = [];

      // Get recent activity (placeholder for now)
      const recentActivity = [
        {
          id: 1,
type: "trade",
          description: "Trade between Team A and Team B",
  timestamp: new Date().toISOString()
},
        {
          id: 2,
type: "waiver",
          description: "Player X claimed off waivers",
  timestamp: new Date().toISOString()
}
  ];

      return {
        ...league, current_week, currentWeek,
  teams: teamsResult.rows, matchups, mockMatchups,
        recentActivity
}
    });

    if (!result) { return NextResponse.json({ error: "League not found"  }, { status: 404 });
    }

    return NextResponse.json({ league: result });
  } catch (error) {
    console.error("Error fetching league:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
