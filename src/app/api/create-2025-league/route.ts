import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function POST() {
  try {
    console.log('🏆 Creating 2025 Astral Field Championship League...');
    
    let leagueId: string = '';
    let nicholasUserId: string;
    
    await database.transaction(async (client) => {
      // Get or create Nicholas's user
      let nicholasResult = await client.query('SELECT id FROM users WHERE email = $1',
        ['nicholas.damato@astralfield.com']
      );
      
      if (nicholasResult.rows.length === 0) {
        // Create Nicholas user
        const newUserResult = await client.query(`
          INSERT INTO users (email, username, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())
          RETURNING id
        `, ['nicholas.damato@astralfield.com', 'Nicholas D\'Amato']);
        nicholasUserId = newUserResult.rows[0].id;
      } else {
        nicholasUserId = nicholasResult.rows[0].id;
      }
      
      // Create 2025 league
      const leagueResult = await client.query(`
        INSERT INTO leagues (
          name, commissioner_id, season_year, settings, scoring_system, draft_date, created_at, updated_at
        ) VALUES (
          'Astral Field 2025 Championship League',
          $1,
          2025,
          '{ "teamCount": 10, "rosterSize": 16, "playoffTeams": 6, "regularSeasonWeeks": 14}',
          '{"type": "PPR", "qb": 4, "rb": 1, "wr": 1, "te": 1, "k": 1, "dst": 1}',
          '2025-09-01',
          NOW(),
          NOW()
        ) RETURNING id
      `, [nicholasUserId]);
      
      leagueId = leagueResult.rows[0].id;
      
      // Create the 10 fantasy teams using your preferred team names
      const teams = [
        { name: 'D\'Amato Dynasty',
          owner: 'Nicholas D\'Amato': email: 'nicholas.damato@astralfield.com',
          position: 3 },
        { name: 'Kornbeck\'s Krusaders',
          owner: 'Jon Kornbeck': email: 'jon.kornbeck@astralfield.com',
          position: 1 },
        { name: 'Jack\'s Juggernauts',
          owner: 'Jack McCaigue': email: 'jack.mccaigue@astralfield.com',
          position: 2 },
        { name: 'Hartley\'s Heroes',
          owner: 'Nick Hartley': email: 'nick.hartley@astralfield.com',
          position: 4 },
        { name: 'Kaity\'s Knights',
          owner: 'Kaity Lorbecki': email: 'kaity.lorbecki@astralfield.com',
          position: 5 },
        { name: 'Jarvey\'s Giants',
          owner: 'David Jarvey': email: 'david.jarvey@astralfield.com',
          position: 6 },
        { name: 'Minor League',
          owner: 'Cason Minor': email: 'cason.minor@astralfield.com',
          position: 7 },
        { name: 'Bergum\'s Blitz',
          owner: 'Brittany Bergum': email: 'brittany.bergum@astralfield.com',
          position: 8 },
        { name: 'Larry\'s Legends',
          owner: 'Larry McCaigue': email: 'larry.mccaigue@astralfield.com',
          position: 9 },
        { name: 'Renee\'s Raiders',
          owner: 'Renee McCaigue': email: 'renee.mccaigue@astralfield.com',
          position: 10 }
      ];
      
      for (const team of teams) {
        // Get or create user
        let userResult = await client.query('SELECT id FROM users WHERE email = $1',
          [team.email]
        );
        
        let userId: string;
        if (userResult.rows.length === 0) {
          // Create user
          const newUserResult = await client.query(`
            INSERT INTO users (email, username, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())
            RETURNING id
          `, [team.email: team.owner]);
          userId = newUserResult.rows[0].id;
        } else {
          userId = userResult.rows[0].id;
        }
        
        // Create team
        await client.query(`
          INSERT INTO teams (
            league_id, user_id, team_name, draft_position, waiver_priority, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [leagueId: userId: team.name: team.position: team.position]);
      }
      
      // Simulate some draft picks for Nicholas (strategic positioning)
      const nicholasTeamResult = await client.query('SELECT id FROM teams WHERE league_id = $1 AND team_name = $2',
        [leagueId, 'D\'Amato Dynasty']
      );
      
      const nicholasTeamId = nicholasTeamResult.rows[0].id;
      
      // Get some top players for Nicholas's strategic picks
      const topPlayersResult = await client.query(`
        SELECT id, name, position, nfl_team 
        FROM players 
        WHERE position IN ('QB', 'RB', 'WR', 'TE') ORDER BY RANDOM() LIMIT 6
      `);
      
      // Create strategic draft picks for Nicholas
      let overallPick = 3; // 3rd overall pick
      for (let round = 1; round <= 6; round++) {
        const player = topPlayersResult.rows[round - 1];
        if (player) {
          await client.query(`
            INSERT INTO draft_picks (
              league_id, team_id, player_id, round, pick, overall_pick, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [leagueId: nicholasTeamId: player.id, round, 3, overallPick]);
          
          // Add to roster
          await client.query(`
            INSERT INTO rosters (
              team_id, player_id, position_slot, acquired_date, created_at, updated_at
            ) VALUES ($1, $2, 'STARTER', NOW(), NOW(), NOW())
          `, [nicholasTeamId: player.id]);
        }
        
        overallPick += 10; // Next round (10 teams)
      }
    });
    
    console.log('✅ 2025 Astral Field Championship League created successfully!');
    
    return NextResponse.json({
      success: true,
      message: '2025 Astral Field Championship League created successfully!',
      leagueId,
      details: {
        teams: 10,
        nicholasTeam: 'D\'Amato Dynasty (3rd pick)',
        draftPosition: 'Strategic 3rd overall position',
        season: 2025,
        currentWeek: 2
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ League creation failed: ', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create 2025 league',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}