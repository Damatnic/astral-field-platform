import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = req.headers.get('authorization');
    if (authHeader !== 'Bearer astral-admin-2025') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    console.log('Running database migration from SQL file...');

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', '001_complete_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration SQL
    console.log('Executing migration SQL...');
    await db.query(migrationSQL);
    
    console.log('Migration completed successfully!');

    // Verify tables were created
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully!',
      data: {
        tablesCreated: tables.rows.length,
        tables: tables.rows.map(r => r.table_name)
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    let userCount = 0;
    let leagueCount = 0;
    
    try {
      const users = await db.query('SELECT COUNT(*) as count FROM users WHERE is_demo_user = true');
      userCount = parseInt(users.rows[0]?.count || '0');
    } catch (e) {
      // Table might not exist
    }
    
    try {
      const leagues = await db.query('SELECT COUNT(*) as count FROM leagues WHERE is_active = true');
      leagueCount = parseInt(leagues.rows[0]?.count || '0');
    } catch (e) {
      // Table might not exist
    }

    return NextResponse.json({
      success: true,
      status: tables.rows.length > 0 ? 'ready' : 'not_migrated',
      database: {
        tables: tables.rows.map(r => r.table_name),
        demoUsers: userCount,
        activeLeagues: leagueCount
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'not_migrated',
      error: error instanceof Error ? error.message : 'Database not ready'
    });
  }
}