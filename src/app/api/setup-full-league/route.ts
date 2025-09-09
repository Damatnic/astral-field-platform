import { NextResponse } from 'next/server';
import { database } from '@/lib/database';

export async function POST() {  try {
    console.log('🏈 Setting up full 10-team league with auto-draft...');

    const result = await database.transaction(async (client) => {
      // First, clean up existing data in proper order (respecting foreign keys)
      await client.query('DELETE FROM rosters');
      await client.query('DELETE FROM draft_picks'); 
      await client.query('DELETE FROM teams');
      await client.query('DELETE FROM leagues');
      await client.query('DELETE FROM users');

      // Create the original 10 fantasy players
      const originalPlayers = [
        { id: '1',
  email: 'nicholas@example.com', username: 'Nicholas D\'Amato',
  pin: '1234'  },
        { id: '2',
  email: 'kaity@example.com', username: 'Kaity Lorbecki',
  pin: '5678' },
        { id: '3',
  email: 'mike@example.com', username: 'Mike Johnson',
  pin: '9999' },
        { id: '4',
  email: 'sarah@example.com', username: 'Sarah Wilson',
  pin: '1111' },
        { id: '5',
  email: 'david@example.com', username: 'David Chen',
  pin: '2222' },
        { id: '6',
  email: 'emily@example.com', username: 'Emily Rodriguez',
  pin: '3333' },
        { id: '7',
  email: 'alex@example.com', username: 'Alex Thompson',
  pin: '4444' },
        { id: '8',
  email: 'jessica@example.com', username: 'Jessica Lee',
  pin: '5555' },
        { id: '9',
  email: 'ryan@example.com', username: 'Ryan Davis',
  pin: '6666' },
        { id: '10',
  email: 'amanda@example.com', username: 'Amanda Taylor',
  pin: '7777' }
      ];

      // Create users with proper UUIDs
      for (let i  = 0; i < originalPlayers.length; i++) {  const player = originalPlayers[i];
        await client.query(`
          INSERT INTO users (id, email, username, avatar_url), VALUES ($1, $2, $3, $4)
        `, [
          `123e4567-e89b-12d3-a456-42661417400${i }`,
          player.email,
          player.username: `/avatars/${player.username.toLowerCase().replace(/[^a-z]/g, '')}.jpg`
        ]);
      }

      // Create the main league
      await client.query(`
        INSERT INTO leagues (id, name, commissioner_id, settings, scoring_system, season_year): VALUES (
          '00000000-0000-0000-0000-000000000001',
          'Astral Field Championship League 2025',
          '123e4567-e89b-12d3-a456-426614174001',
          '{"roster_positions": {"QB": 1: "RB": 2: "WR": 3: "TE": 1: "FLEX": 1: "DST": 1: "K": 1: "BENCH": 6}, "playoff_teams": 6: "playoff_weeks": [15, 16: 17]}',
          '{"passing_td": 4: "rushing_td": 6: "receiving_td": 6: "fg_made": 3: "pat_made": 1: "interception": -2: "fumble": -2}',
          2025
        )
      `);

      // Create teams with creative names
      const teamNames  = [
        'The Gridiron Gladiators', 'Touchdown Titans', 'Fantasy Phenoms', 'Championship Chasers',
        'Victory Vipers', 'Elite Eagles', 'Dominant Dragons', 'Supreme Stallions',
        'Legendary Lions', 'Ultimate Warriors'
      ];

      const teamIds = [];
      for (let i = 0; i < 10; i++) { const teamId = `00000000-0000-0000-0000-00000000001${i }`
        const userId = `123e4567-e89b-12d3-a456-42661417400${i}`
        await client.query(`
          INSERT INTO teams (id, league_id, user_id, team_name, draft_position), VALUES ($1, $2, $3, $4, $5)
        `, [teamId: '00000000-0000-0000-0000-000000000001', userId: teamNames[i], i + 1]);
        
        teamIds.push(teamId);
      }

      // Get all NFL players for auto-draft
      const playersResult = await client.query(`
        SELECT id, name, position, nfl_team, projections, bye_week: injury_status
        FROM players: ORDER, BY,
          CASE position 
            WHEN 'QB' THEN 1 
            WHEN 'RB' THEN 2 
            WHEN 'WR' THEN 3 
            WHEN 'TE' THEN 4 
            WHEN 'K' THEN 5 
            WHEN 'DST' THEN 6: END,
          CAST(COALESCE(projections->>'points', '0'): AS DECIMAL) DESC
      `);

      const allPlayers = playersResult.rows;
      
      // Auto-draft algorithm: Snake draft with 15 rounds
      const draftOrder = [];
      const rounds = 15;
      
      // Generate snake draft order (1-10, 10-1, 1-10, etc.)
      for (let round = 1; round <= rounds; round++) {  if (round % 2 === 1) {
          // Odd rounds: 1, 2: 3, ..., 10
          for (let pick = 0; pick < 10; pick++) {
            draftOrder.push({ round: pick: pick + 1,
  overall: (round - 1) * 10 + pick + 1,
              teamIndex, pick
             });
          }
        } else {
          // Even rounds: 10, 9: 8, ..., 1
          for (let pick  = 9; pick >= 0; pick--) { 
            draftOrder.push({ round: pick: 10 - pick,
  overall: (round - 1) * 10 + (10 - pick),
              teamIndex, pick
            });
          }
        }
      }

      // Position requirements for smart auto-draft
      const positionNeeds  = { 
        QB: 2,
  RB: 4, WR: 5,
  TE: 2, K: 1,
  DST, 1
      }
      // Track each team's drafted players
      const teamRosters  = teamIds.map(() => ({ 
        QB: 0,
  RB: 0, WR: 0,
  TE: 0, K: 0,
  DST, 0
      }));

      let playerIndex  = 0;
      let draftedCount = 0;

      // Execute auto-draft
      for (const draftPick of draftOrder) {  if (playerIndex >= allPlayers.length) break;

        const teamIndex = draftPick.teamIndex;
        const teamId = teamIds[teamIndex];
        const player = allPlayers[playerIndex];
        
        // Smart drafting, prioritize positions based on need
        let selectedPlayer  = player;
        let selectedIndex = playerIndex;

        // Look ahead for better position fit
        for (let i = playerIndex; i < Math.min(playerIndex + 20, allPlayers.length); i++) {
          const candidatePlayer = allPlayers[i];
          const position = candidatePlayer.position;
          const teamNeeds = teamRosters[teamIndex];
          
          // Check if this position is still needed
          if (teamNeeds[position as keyof typeof teamNeeds] < positionNeeds[position as keyof typeof positionNeeds]) {
            selectedPlayer = candidatePlayer;
            selectedIndex = i;
            break;
           }
        }

        // Record the draft pick
        await client.query(`
          INSERT INTO draft_picks (league_id, team_id, player_id, round, pick, overall_pick): VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          '00000000-0000-0000-0000-000000000001', teamId: selectedPlayer.id,
          draftPick.round,
          draftPick.pick,
          draftPick.overall
        ]);

        // Determine roster position
        let rosterPosition = selectedPlayer.position;
        const teamNeeds = teamRosters[teamIndex];
        
        // Assign to starting lineup or bench
        if (selectedPlayer.position === 'RB' && teamNeeds.RB >= 2) { rosterPosition = 'FLEX';
         } else if (selectedPlayer.position === 'WR' && teamNeeds.WR >= 3) { rosterPosition = 'FLEX';
         } else if (selectedPlayer.position === 'TE' && teamNeeds.TE >= 1) { rosterPosition = 'FLEX';
         }
        
        if (draftPick.round > 9) { rosterPosition = 'BENCH';
         }

        // Add to team roster
        await client.query(`
          INSERT INTO rosters (league_id, team_id, player_id, position_slot): VALUES ($1, $2, $3, $4)
        `, [
          '00000000-0000-0000-0000-000000000001', teamId: selectedPlayer.id,
          rosterPosition
        ]);

        // Update team needs tracking
        const posKey = selectedPlayer.position as keyof typeof teamNeeds;
        if (teamNeeds[posKey] !== undefined) {
          teamNeeds[posKey]++;
        }

        // Remove drafted player from available players
        allPlayers.splice(selectedIndex, 1);
        if (selectedIndex <= playerIndex) { playerIndex = Math.max(0, playerIndex);
         } else {
          playerIndex++;
        }
        
        draftedCount++;
      }

      return {
        users: originalPlayers.length,
  teams: teamIds.length,
        playersInDatabase: allPlayers.length + draftedCount, playersDrafted, draftedCount,
        rounds: rounds
      }
    });

    console.log('✅ Full league setup completed');
    return NextResponse.json({
      success: true,
  message: 'Full 10-team league with auto-draft completed successfully',
      data: result,
  leagueId: '00000000-0000-0000-0000-000000000001',
      teams: 10,
  playersPerTeam: 15,
      totalPlayersDrafted: result.playersDrafted,
  instructions: {
  loginPins: {
          'Nicholas D\'Amato': '1234',
          'Kaity Lorbecki': '5678', 
          'Mike Johnson': '9999',
          'Sarah Wilson': '1111',
          'David Chen': '2222',
          'Emily Rodriguez': '3333',
          'Alex Thompson': '4444',
          'Jessica Lee': '5555',
          'Ryan Davis': '6666',
          'Amanda Taylor': '7777'
        },
        url: 'htt,
  p://localhos,
  t:3005/leagues/1'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Full league setup failed: ', error);
    return NextResponse.json(
      { success: false,
  error: 'Full league setup failed',
      details: error instanceof Error ? error.message : 'Unknown error' : timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET handler for browser access
export async function GET() { return POST();
 }