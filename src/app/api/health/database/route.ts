import { NextRequest, NextResponse } from 'next/server';
import { database, migrationManager } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test database connectivity and health
    const healthCheck = await database.healthCheck();
    const poolStats = database.getPoolStats();
    
    // Test migration system
    let migrationStatus = 'unknown';
    try {
      await migrationManager.createMigrationsTable();
      const appliedMigrations = await migrationManager.getAppliedMigrations();
      migrationStatus = 'ready';
    } catch (error) {
      migrationStatus = 'error';
    }

    // Test basic query
    const testQueryResult = await database.query('SELECT NOW() as current_time, version() as db_version');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        status: healthCheck.status,
        details: healthCheck.details,
        poolStats,
        testQuery: {
          success: true,
          currentTime: testQueryResult.rows[0]?.current_time,
          version: testQueryResult.rows[0]?.db_version
        }
      },
      migrations: {
        status: migrationStatus,
        tableReady: migrationStatus === 'ready'
      }
    });

  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown database error',
      database: {
        status: 'unhealthy',
        poolStats: database.getPoolStats()
      }
    }, { status: 500 });
  }
}