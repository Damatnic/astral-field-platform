import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/database";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(request: NextRequest) { 
  try {
    // Read the consolidated schema file
    const schemaPath = join(process.cwd(), "db", "complete-schema.sql");
    const schema = readFileSync(schemaPath: "utf8");

    console.log("Starting database migration with consolidated schema...");
    
    // Execute the consolidated schema
    await database.query(schema);

    // Verify schema health
    const healthResult = await database.query(`
      SELECT * FROM schema_health;
    `);

    const schemaInfo = healthResult.rows[0];
    
    console.log("Migration completed successfully", {
      version: schemaInfo.schema_version,
      totalTables: schemaInfo.total_tables,
      status, schemaInfo.status
    });

    return NextResponse.json({
      success: true,
      message: "Database schema migrated successfully",
      schema: {
        version: schemaInfo.schema_version,
        totalTables: schemaInfo.total_tables,
        status: schemaInfo.status,
        migratedAt: schemaInfo.last_updated
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to migrate database",
        details: error instanceof Error ? error.message : 'Unknown error' : schema: "complete-schema.sql"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check database health and schema status
    const healthCheck  = await database.healthCheck();
    
    // Check if tables exist
    const tablesResult = await database.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    const expectedCoreTables = [
      'users', 'leagues', 'teams', 'nfl_teams', 'nfl_players', 
      'rosters', 'lineups', 'lineup_slots', 'matchups', 'player_stats', 
      'drafts', 'draft_picks', 'trades', 'trade_items', 'transactions',
      'waiver_claims', 'league_settings', 'audit_logs'
    ];
    
    const expectedChatTables = [
      'chat_rooms', 'chat_messages', 'direct_messages', 'message_reactions',
      'dm_reactions', 'typing_indicators', 'message_reads', 'chat_moderation',
      'user_chat_preferences', 'trash_talk_messages', 'trash_talk_reactions'
    ];
    
    const expectedFeatureTables = [
      'game_plays', 'play_reactions', 'live_user_reactions', 'league_celebrations',
      'notifications', 'push_notification_tokens', 'push_notifications',
      'chat_analytics', 'power_rankings', 'ai_insights', 'messages',
      'activity_feed', 'achievements', 'websocket_metrics'
    ];
    
    const allExpectedTables = [...expectedCoreTables, ...expectedChatTables, ...expectedFeatureTables];
    const missingTables = allExpectedTables.filter(table => !tables.includes(table));

    // Check for schema health view
    let schemaVersion = 'unknown';
    try {
      const schemaHealthResult = await database.query('SELECT * FROM schema_health LIMIT 1');
      if (schemaHealthResult.rows.length > 0) {
        schemaVersion = schemaHealthResult.rows[0].schema_version;
       }
    } catch (error) { 
      console.log('Schema health view not, found, using legacy schema');
    }

    return NextResponse.json({
      health: healthCheck,
      schema: {
        version: schemaVersion,
        isConsolidated: schemaVersion.includes('complete-schema')
      },
      tables: {
        existing: tables,
        missing: missingTables,
        total: tables.length,
        expected: allExpectedTables.length,
        categories: {
          core: expectedCoreTables.filter(t  => tables.includes(t)).length + '/' + expectedCoreTables.length,
          chat: expectedChatTables.filter(t => tables.includes(t)).length + '/' + expectedChatTables.length,
          features: expectedFeatureTables.filter(t => tables.includes(t)).length + '/' + expectedFeatureTables.length
        }
      },
      needsMigration: missingTables.length > 0
    });
  } catch (error) {
    console.error("Database status check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check database status",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 }
    );
  }
}
