import { NextResponse } from 'next/server'
import { database } from '@/lib/database'

export async function POST() {
  try {
    console.log('🔧 Initializing database schema...')

    // CRITICAL FIX: Force drop and recreate rosters table to ensure it exists in current database
    console.log('🗑️ Dropping existing rosters table if it exists...')
    const dropRostersTable = `DROP TABLE IF EXISTS rosters CASCADE;`
    const dropResult = await database.query(dropRostersTable)
    if (dropResult.error) {
      console.warn('Drop table warning:', dropResult.error)
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
    if (result.error) {
      throw new Error(result.error)
    }

    // Create index if it doesn't exist
    const createIndex = `
      CREATE INDEX IF NOT EXISTS idx_rosters_team_id ON rosters(team_id);
      CREATE INDEX IF NOT EXISTS idx_rosters_player_id ON rosters(player_id);
    `

    const indexResult = await database.query(createIndex)
    if (indexResult.error) {
      console.warn('Index creation warning:', indexResult.error)
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
      rostersExists = !testResult.error
      if (testResult.error) {
        rostersTestError = testResult.error
      }
    } catch (error) {
      rostersTestError = error instanceof Error ? error.message : 'Unknown error'
    }

    // Check counts
    const usersResult = await database.query('SELECT COUNT(*) as count FROM users')
    const teamsResult = await database.query('SELECT COUNT(*) as count FROM teams')
    const playersResult = await database.query('SELECT COUNT(*) as count FROM players')

    return NextResponse.json({
      success: true,
      diagnosis: {
        tables: tablesResult.data || [],
        tablesError: tablesResult.error,
        rosters: {
          exists: rostersExists,
          testError: rostersTestError,
          columns: rostersResult.data || [],
          columnError: rostersResult.error
        },
        counts: {
          users: usersResult.data?.[0]?.count || 0,
          teams: teamsResult.data?.[0]?.count || 0,
          players: playersResult.data?.[0]?.count || 0,
          usersError: usersResult.error,
          teamsError: teamsResult.error,
          playersError: playersResult.error
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