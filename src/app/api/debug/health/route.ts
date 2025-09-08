import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET() {
  const health = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      hasUrl: !!process.env.DATABASE_URL,
      hasNeonUrl: !!process.env.NEON_DATABASE_URL,
      connected: false,
      error: null as string | null,
      tables: [] as string[],
    },
  };

  try {
    // Test database connection
    const result = await database.transaction(async (client) => {
      // Check connection
      await client.query("SELECT 1");
      health.database.connected = true;

      // Get list of tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      health.database.tables = tablesResult.rows.map(r => r.table_name);

      // Check if we have data
      const counts: Record<string, number> = {};
      
      try {
        const usersResult = await client.query("SELECT COUNT(*) as count FROM users");
        counts.users = parseInt(usersResult.rows[0]?.count || "0");
      } catch (e) {
        counts.users = 0;
      }

      try {
        const leaguesResult = await client.query("SELECT COUNT(*) as count FROM leagues");
        counts.leagues = parseInt(leaguesResult.rows[0]?.count || "0");
      } catch (e) {
        counts.leagues = 0;
      }

      try {
        const playersResult = await client.query("SELECT COUNT(*) as count FROM players");
        counts.players = parseInt(playersResult.rows[0]?.count || "0");
      } catch (e) {
        counts.players = 0;
      }

      return counts;
    });

    return NextResponse.json({
      ...health,
      data: result,
      status: "healthy",
      message: health.database.tables.length > 0 
        ? "Database connected and initialized" 
        : "Database connected but no tables found - run migration"
    });
  } catch (error) {
    health.database.error = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json({
      ...health,
      status: "unhealthy",
      message: "Database connection failed - check environment variables",
      setupInstructions: [
        "1. Ensure DATABASE_URL is set in Vercel environment variables",
        "2. The URL should be: postgresql://neondb_owner:npg_De9Fi3RcNzrX@ep-odd-hat-adfb8gbg-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
        "3. After setting, redeploy the application",
        "4. Then visit /api/database/migrate to initialize the database"
      ]
    }, { status: 500 });
  }
}