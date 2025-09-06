import { NextResponse } from 'next/server'
import { database } from '@/lib/database'

export async function POST() {
  try {
    console.log('🔧 Initializing database schema...')

    // CRITICAL FIX: Force drop and recreate rosters table to ensure it exists in current database
    console.log('🗑️ Dropping existing rosters table if it exists...')
    const dropRostersTable = `DROP TABLE IF EXISTS rosters CASCADE;`
    try {
      const dropResult = await database.query(dropRostersTable)
      console.log('Drop table completed successfully')
    } catch (error) {
      console.warn('Drop table warning:', error instanceof Error ? error.message : 'Unknown error')
    }

    console.log('📋 Creating fresh rosters table...')
    // Create rosters table if it doesn't exist
    const createRostersTable = `
      CREATE TABLE rosters (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
        player_id UUID REFERENCES players(id) NOT NULL,
        position_slot TEXT NOT NULL DEFAULT 'STARTER',
        acquired_date TIMESTAMPTZ DEFAULT NOW(),
        dropped_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(team_id, player_id)
      );
    `

    const result = await database.query(createRostersTable)
    console.log('Rosters table created successfully')

    // Create index if it doesn't exist
    const createIndex = `
      CREATE INDEX IF NOT EXISTS idx_rosters_team_id ON rosters(team_id);
      CREATE INDEX IF NOT EXISTS idx_rosters_player_id ON rosters(player_id);
    `

    try {
      const indexResult = await database.query(createIndex)
      console.log('Indexes created successfully')
    } catch (error) {
      console.warn('Index creation warning:', error instanceof Error ? error.message : 'Unknown error')
    }

    console.log('✅ Database schema initialized successfully')

    return NextResponse.json({
      success: true,
      message: 'Database schema initialized successfully',
      tables: ['rosters'],
      indexes: ['idx_rosters_team_id', 'idx_rosters_player_id']
    })

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database initialization failed'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🔍 Debugging database schema...')

    // Check what tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `
    
    const tablesResult = await database.query(tablesQuery)

    // Check rosters table specifically
    const rostersQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'rosters' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `
    
    const rostersResult = await database.query(rostersQuery)
    
    // Check if rosters table exists by trying to select from it
    let rostersExists = false
    let rostersTestError = null
    
    try {
      const testResult = await database.query('SELECT COUNT(*) FROM rosters LIMIT 1')
      rostersExists = true
    } catch (error) {
      rostersExists = false
      rostersTestError = error instanceof Error ? error.message : 'Unknown error'
    }

    // Check counts
    const usersResult = await database.query('SELECT COUNT(*) as count FROM users')
    const teamsResult = await database.query('SELECT COUNT(*) as count FROM teams')
    const playersResult = await database.query('SELECT COUNT(*) as count FROM players')

    return NextResponse.json({
      success: true,
      diagnosis: {
        tables: tablesResult.rows || [],
        rosters: {
          exists: rostersExists,
          testError: rostersTestError,
          columns: rostersResult.rows || []
        },
        counts: {
          users: usersResult.rows?.[0]?.count || 0,
          teams: teamsResult.rows?.[0]?.count || 0,
          players: playersResult.rows?.[0]?.count || 0
        }
      },
      info: 'POST to initialize missing database tables and indexes'
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Database diagnosis failed',
      info: 'POST to initialize missing database tables and indexes'
    })
  }
}