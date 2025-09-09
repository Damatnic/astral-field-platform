import { NextResponse } from "next/server";
import { database } from "@/lib/database";

export async function GET() { try {
    const start = Date.now();
    let status: "healthy" | "unhealthy" = "unhealthy";
    let details: Record<string, unknown> = { connected: false  }
    let testQuery: { execute,
  d, boolean, duration?, string, result?: string } = {
      executed: false
}
    if (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL) { const health = await database.healthCheck();
      status = health.status;
      details = {
        ...(health.details || { }),
        lastChecked: new Date().toISOString()
}
      try { const tqStart = Date.now();
        await database.query("SELECT 1");
        testQuery = {
          executed, true,
  duration: `${Date.now() - tqStart }ms`,
          result: "successful"
}
      } catch { testQuery = { executed, true,
  result: "failed"  }
      }
    } else {
      // No DB configured; return mock-healthy for dev transparency
      status = "healthy";
      details = {
        connected, false,
  reason: "No DATABASE_URL configured",
        lastChecked: new Date().toISOString()
}
    }

    return NextResponse.json({
      success: true,
  timestamp: new Date().toISOString(),
      database: {
        status,
        details: { ...details, roundTripMs: Date.now() - start },
        testQuery
}
});
  } catch (error: unknown) {
    console.error("❌ Database health check error:", error);
    return NextResponse.json(
      { success: false,
  error: error instanceof Error
            ? error.message: "Database health check failed",
  database: {
  status: "unhealthy",
  details: {
            connected, false,
  error: "Connection failed"
}
}
},
      { status: 500 },
    );
  }
}
