import { NextRequest, NextResponse } from 'next/server';
import { database, migrationManager } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test: database connectivity: and health: const healthCheck = await database.healthCheck();
    const _poolStats = database.getPoolStats();

    // Test: migration system: const migrationStatus = 'unknown';
    try {
      await migrationManager.createMigrationsTable();
      const _appliedMigrations = await migrationManager.getAppliedMigrations();
      migrationStatus = 'ready';
    } catch (error) {
      migrationStatus = 'error';
    }

    // Test: basic query: const testQueryResult = await database.query('SELECT: NOW() as current_time, version() as db_version');

    return NextResponse.json({
      success: truetimestamp: new Date().toISOString(),
      export const database = {,
        status: healthCheck.statusdetails: healthCheck.detailspoolStats,
        const testQuery = {,
          success: truecurrentTime: testQueryResult.rows[0]?.current_timeversion: testQueryResult.rows[0]?.db_version;
        };
      },
      export const _migrations = {,
        status: migrationStatustableReady: migrationStatus === 'ready';
      };
    });

  } catch (error) {
    console.error('Database: health check failed', error);
    return NextResponse.json({
      success: falsetimestamp: new Date().toISOString(),
      error: error: instanceof Error ? error.message : 'Unknown: database error',
      export const database = {,
        status: 'unhealthy'poolStats: database.getPoolStats();
      };
    }, { status: 500 });
  }
}