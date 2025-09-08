import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function POST() {
  try {
    console.log('🎯 Setting up demo data...');

    const result = await database.transaction(async (client) => {
      // Create demo users
      await client.query(`
        INSERT INTO users (id, email, username, avatar_url) 
        VALUES 
        ('123e4567-e89b-12d3-a456-426614174000', 'nicholas@example.com', 'Nicholas D''Amato', '/avatars/nicholas.jpg'),
        ('123e4567-e89b-12d3-a456-426614174001', 'kaity@example.com', 'Kaity Lorbecki', '/avatars/kaity.jpg'),
        ('123e4567-e89b-12d3-a456-426614174002', 'mike@example.com', 'Mike Johnson', '/avatars/mike.jpg'),
        ('123e4567-e89b-12d3-a456-426614174003', 'sarah@example.com', 'Sarah Wilson', '/avatars/sarah.jpg')
        ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        updated_at = NOW()
      `);

      // Create demo league with known UUID
      await client.query(`
        INSERT INTO leagues (id, name, commissioner_id, settings, scoring_system, season_year) 
        VALUES (
          '00000000-0000-0000-0000-000000000001',
          'Astral Field League 2025',
          '123e4567-e89b-12d3-a456-426614174000',
          '{"roster_positions": {"QB": 1, "RB": 2, "WR": 3, "TE": 1, "FLEX": 1, "DST": 1, "K": 1, "BENCH": 6}}',
          '{"passing_td": 4, "rushing_td": 6, "receiving_td": 6, "fg_made": 3, "pat_made": 1}',
          2025
        )
        ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        settings = EXCLUDED.settings,
        updated_at = NOW()
      `);

      // Create demo teams
      await client.query(`
        INSERT INTO teams (id, league_id, user_id, team_name, draft_position) 
        VALUES 
        ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174000', 'Team Nicholas', 1),
        ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174001', 'Team Kaity', 2),
        ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174002', 'Team Mike', 3),
        ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '123e4567-e89b-12d3-a456-426614174003', 'Team Sarah', 4)
        ON CONFLICT (id) DO UPDATE SET
        team_name = EXCLUDED.team_name,
        updated_at = NOW()
      `);

      return {
        users: 4,
        leagues: 1,
        teams: 4
      };
    });

    console.log('✅ Demo data setup completed');
    return NextResponse.json({
      success: true,
      message: 'Demo data created successfully',
      data: result,
      instructions: {
        leagueId: '00000000-0000-0000-0000-000000000001',
        note: 'Use this league ID to access the demo league'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Demo data setup failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Demo data setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET handler for browser access
export async function GET() {
  return POST();
}