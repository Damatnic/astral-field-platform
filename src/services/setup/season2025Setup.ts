import { database } from '@/lib/database';

export interface NFLPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  experience: number;
  fantasyProjection: number;
  averageDraftPosition: number;
}

export interface FantasyTeam {
  id: number;
  name: string;
  owner: string;
  abbreviation: string;
  draftPosition: number;
}

export interface DraftPick {
  round: number;
  pick: number;
  teamId: number;
  playerId: string;
  playerName: string;
  position: string;
  team: string;
}

export class Season2025Setup {
  private nflTeams = [
    { id: 1, abbreviation: 'ARI', city: 'Arizona', name: 'Cardinals', conference: 'NFC', division: 'West', byeWeek: 11 },
    { id: 2, abbreviation: 'ATL', city: 'Atlanta', name: 'Falcons', conference: 'NFC', division: 'South', byeWeek: 12 },
    { id: 3, abbreviation: 'BAL', city: 'Baltimore', name: 'Ravens', conference: 'AFC', division: 'North', byeWeek: 14 },
    { id: 4, abbreviation: 'BUF', city: 'Buffalo', name: 'Bills', conference: 'AFC', division: 'East', byeWeek: 12 },
    { id: 5, abbreviation: 'CAR', city: 'Carolina', name: 'Panthers', conference: 'NFC', division: 'South', byeWeek: 11 },
    { id: 6, abbreviation: 'CHI', city: 'Chicago', name: 'Bears', conference: 'NFC', division: 'North', byeWeek: 7 },
    { id: 7, abbreviation: 'CIN', city: 'Cincinnati', name: 'Bengals', conference: 'AFC', division: 'North', byeWeek: 12 },
    { id: 8, abbreviation: 'CLE', city: 'Cleveland', name: 'Browns', conference: 'AFC', division: 'North', byeWeek: 10 },
    { id: 9, abbreviation: 'DAL', city: 'Dallas', name: 'Cowboys', conference: 'NFC', division: 'East', byeWeek: 7 },
    { id: 10, abbreviation: 'DEN', city: 'Denver', name: 'Broncos', conference: 'AFC', division: 'West', byeWeek: 14 },
    { id: 11, abbreviation: 'DET', city: 'Detroit', name: 'Lions', conference: 'NFC', division: 'North', byeWeek: 5 },
    { id: 12, abbreviation: 'GB', city: 'Green Bay', name: 'Packers', conference: 'NFC', division: 'North', byeWeek: 10 },
    { id: 13, abbreviation: 'HOU', city: 'Houston', name: 'Texans', conference: 'AFC', division: 'South', byeWeek: 14 },
    { id: 14, abbreviation: 'IND', city: 'Indianapolis', name: 'Colts', conference: 'AFC', division: 'South', byeWeek: 14 },
    { id: 15, abbreviation: 'JAX', city: 'Jacksonville', name: 'Jaguars', conference: 'AFC', division: 'South', byeWeek: 12 },
    { id: 16, abbreviation: 'KC', city: 'Kansas City', name: 'Chiefs', conference: 'AFC', division: 'West', byeWeek: 6 },
    { id: 17, abbreviation: 'LV', city: 'Las Vegas', name: 'Raiders', conference: 'AFC', division: 'West', byeWeek: 10 },
    { id: 18, abbreviation: 'LAC', city: 'Los Angeles', name: 'Chargers', conference: 'AFC', division: 'West', byeWeek: 5 },
    { id: 19, abbreviation: 'LAR', city: 'Los Angeles', name: 'Rams', conference: 'NFC', division: 'West', byeWeek: 6 },
    { id: 20, abbreviation: 'MIA', city: 'Miami', name: 'Dolphins', conference: 'AFC', division: 'East', byeWeek: 6 },
    { id: 21, abbreviation: 'MIN', city: 'Minnesota', name: 'Vikings', conference: 'NFC', division: 'North', byeWeek: 6 },
    { id: 22, abbreviation: 'NE', city: 'New England', name: 'Patriots', conference: 'AFC', division: 'East', byeWeek: 14 },
    { id: 23, abbreviation: 'NO', city: 'New Orleans', name: 'Saints', conference: 'NFC', division: 'South', byeWeek: 12 },
    { id: 24, abbreviation: 'NYG', city: 'New York', name: 'Giants', conference: 'NFC', division: 'East', byeWeek: 11 },
    { id: 25, abbreviation: 'NYJ', city: 'New York', name: 'Jets', conference: 'AFC', division: 'East', byeWeek: 12 },
    { id: 26, abbreviation: 'PHI', city: 'Philadelphia', name: 'Eagles', conference: 'NFC', division: 'East', byeWeek: 5 },
    { id: 27, abbreviation: 'PIT', city: 'Pittsburgh', name: 'Steelers', conference: 'AFC', division: 'North', byeWeek: 9 },
    { id: 28, abbreviation: 'SF', city: 'San Francisco', name: '49ers', conference: 'NFC', division: 'West', byeWeek: 9 },
    { id: 29, abbreviation: 'SEA', city: 'Seattle', name: 'Seahawks', conference: 'NFC', division: 'West', byeWeek: 10 },
    { id: 30, abbreviation: 'TB', city: 'Tampa Bay', name: 'Buccaneers', conference: 'NFC', division: 'South', byeWeek: 11 },
    { id: 31, abbreviation: 'TEN', city: 'Tennessee', name: 'Titans', conference: 'AFC', division: 'South', byeWeek: 5 },
    { id: 32, abbreviation: 'WAS', city: 'Washington', name: 'Commanders', conference: 'NFC', division: 'East', byeWeek: 14 }
  ];

  private fantasyTeams: FantasyTeam[] = [
    { id: 1, name: 'Astral Crushers', owner: 'Nicholas D\'Amato', abbreviation: 'ACR', draftPosition: 3 },
    { id: 2, name: 'Thunder Bolts', owner: 'Brittany Bergum', abbreviation: 'THU', draftPosition: 1 },
    { id: 3, name: 'Victory Vipers', owner: 'Marcus Thompson', abbreviation: 'VIP', draftPosition: 2 },
    { id: 4, name: 'Championship Chasers', owner: 'Sarah Williams', abbreviation: 'CHA', draftPosition: 4 },
    { id: 5, name: 'Kaity\'s Killers', owner: 'Kaity Lorbecki', abbreviation: 'KIL', draftPosition: 5 },
    { id: 6, name: 'End Zone Eagles', owner: 'David Jarvey', abbreviation: 'EZE', draftPosition: 6 },
    { id: 7, name: 'Grid Iron Giants', owner: 'Cason Minor', abbreviation: 'GIG', draftPosition: 7 },
    { id: 8, name: 'Playoff Predators', owner: 'Mike Rodriguez', abbreviation: 'PRE', draftPosition: 8 },
    { id: 9, name: 'Fantasy Phenoms', owner: 'Jessica Chen', abbreviation: 'PHE', draftPosition: 9 },
    { id: 10, name: 'Title Town Titans', owner: 'Alex Johnson', abbreviation: 'TTT', draftPosition: 10 }
  ];

  private topNFLPlayers: NFLPlayer[] = [
    // Round 1 Elite Players
    { id: 'cmc-1', name: 'Christian McCaffrey', position: 'RB', team: 'SF', experience: 7, fantasyProjection: 22.5, averageDraftPosition: 1.2 },
    { id: 'jt-2', name: 'Jonathan Taylor', position: 'RB', team: 'IND', experience: 4, fantasyProjection: 21.8, averageDraftPosition: 2.1 },
    { id: 'dh-3', name: 'Derrick Henry', position: 'RB', team: 'BAL', experience: 8, fantasyProjection: 20.9, averageDraftPosition: 3.4 },
    { id: 'cd-4', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', experience: 4, fantasyProjection: 20.2, averageDraftPosition: 4.8 },
    { id: 'tj-5', name: 'Tyreek Hill', position: 'WR', team: 'MIA', experience: 8, fantasyProjection: 19.8, averageDraftPosition: 5.2 },
    
    // Round 2 Players
    { id: 'jh-6', name: 'Jalen Hurts', position: 'QB', team: 'PHI', experience: 4, fantasyProjection: 25.1, averageDraftPosition: 15.3 },
    { id: 'asb-7', name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', experience: 3, fantasyProjection: 18.7, averageDraftPosition: 18.2 },
    { id: 'jg-8', name: 'Jahmyr Gibbs', position: 'RB', team: 'DET', experience: 2, fantasyProjection: 17.9, averageDraftPosition: 22.1 },
    { id: 'ma-9', name: 'Mark Andrews', position: 'TE', team: 'BAL', experience: 6, fantasyProjection: 15.8, averageDraftPosition: 28.5 },
    { id: 'dk-10', name: 'DK Metcalf', position: 'WR', team: 'SEA', experience: 5, fantasyProjection: 17.2, averageDraftPosition: 31.2 },
    
    // Additional Quality Players
    { id: 'ja-11', name: 'Josh Allen', position: 'QB', team: 'BUF', experience: 6, fantasyProjection: 24.8, averageDraftPosition: 12.1 },
    { id: 'lm-12', name: 'Lamar Jackson', position: 'QB', team: 'BAL', experience: 6, fantasyProjection: 24.2, averageDraftPosition: 13.8 },
    { id: 'pm-13', name: 'Patrick Mahomes', position: 'QB', team: 'KC', experience: 7, fantasyProjection: 23.9, averageDraftPosition: 14.2 },
    { id: 'ac-14', name: 'Austin Ekeler', position: 'RB', team: 'WAS', experience: 7, fantasyProjection: 16.8, averageDraftPosition: 25.7 },
    { id: 'dp-15', name: 'DeVonta Smith', position: 'WR', team: 'PHI', experience: 3, fantasyProjection: 16.9, averageDraftPosition: 29.3 }
  ];

  async clearExistingData(): Promise<void> {
    console.log('🧹 Clearing existing mock data...');
    
    // Clear in proper order to avoid foreign key conflicts
    await database.query('DELETE FROM lineup_entries');
    await database.query('DELETE FROM roster_players');
    await database.query('DELETE FROM teams');
    await database.query('DELETE FROM players');
    await database.query('DELETE FROM nfl_teams');
    await database.query("DELETE FROM leagues WHERE name LIKE '%Demo%' OR name LIKE '%Mock%'");
    
    console.log('✅ Mock data cleared successfully');
  }

  async setupNFLTeams(): Promise<void> {
    console.log('🏈 Setting up 32 NFL teams...');
    
    for (const team of this.nflTeams) {
      await sql`
        INSERT INTO nfl_teams (
          id, abbreviation, city, name, conference, division, bye_week, 
          primary_color, secondary_color, created_at, updated_at
        ) VALUES (
          ${team.id}, ${team.abbreviation}, ${team.city}, ${team.name},
          ${team.conference}, ${team.division}, ${team.byeWeek},
          '#1f2937', '#374151', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          abbreviation = EXCLUDED.abbreviation,
          city = EXCLUDED.city,
          name = EXCLUDED.name,
          conference = EXCLUDED.conference,
          division = EXCLUDED.division,
          bye_week = EXCLUDED.bye_week,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    
    console.log('✅ NFL teams setup complete');
  }

  async setupNFLPlayers(): Promise<void> {
    console.log('👥 Setting up NFL players...');
    
    for (const player of this.topNFLPlayers) {
      await sql`
        INSERT INTO players (
          id, name, position, team_abbreviation, experience, 
          fantasy_projection, average_draft_position, created_at, updated_at
        ) VALUES (
          ${player.id}, ${player.name}, ${player.position}, ${player.team},
          ${player.experience}, ${player.fantasyProjection}, ${player.averageDraftPosition},
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          position = EXCLUDED.position,
          team_abbreviation = EXCLUDED.team_abbreviation,
          experience = EXCLUDED.experience,
          fantasy_projection = EXCLUDED.fantasy_projection,
          average_draft_position = EXCLUDED.average_draft_position,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    
    console.log('✅ NFL players setup complete');
  }

  async createLeague(): Promise<number> {
    console.log('🏆 Creating 2025 Astral Field League...');
    
    const result = await sql`
      INSERT INTO leagues (
        name, season, team_count, scoring_system, trade_deadline,
        playoff_weeks, championship_week, created_at, updated_at
      ) VALUES (
        'Astral Field 2025 Championship League', 2025, 10, 'PPR',
        '2025-11-28', '15,16', 17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id
    `;
    
    const leagueId = result[0].id;
    console.log(`✅ League created with ID: ${leagueId}`);
    return leagueId;
  }

  async createFantasyTeams(leagueId: number): Promise<void> {
    console.log('🏟️ Creating fantasy teams...');
    
    for (const team of this.fantasyTeams) {
      await sql`
        INSERT INTO teams (
          id, league_id, team_name, abbreviation, owner_name,
          wins, losses, ties, points_for, points_against,
          waiver_priority, waiver_budget, created_at, updated_at
        ) VALUES (
          ${team.id}, ${leagueId}, ${team.name}, ${team.abbreviation}, ${team.owner},
          0, 0, 0, 0.0, 0.0, ${team.draftPosition}, 100.0,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          league_id = EXCLUDED.league_id,
          team_name = EXCLUDED.team_name,
          abbreviation = EXCLUDED.abbreviation,
          owner_name = EXCLUDED.owner_name,
          waiver_priority = EXCLUDED.waiver_priority,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    
    console.log('✅ Fantasy teams created');
  }

  generateDraftResults(): DraftPick[] {
    const draftPicks: DraftPick[] = [];
    const availablePlayers = [...this.topNFLPlayers];
    
    // Nicholas's strategic picks (Team ID 1, Draft Position 3)
    const nicholasTargets = [
      { round: 1, playerId: 'dh-3' }, // Derrick Henry - Elite RB
      { round: 2, playerId: 'cd-4' }, // CeeDee Lamb - WR1
      { round: 3, playerId: 'jh-6' }, // Jalen Hurts - Dual threat QB
      { round: 4, playerId: 'asb-7' }, // Amon-Ra St. Brown - PPR machine
      { round: 5, playerId: 'jg-8' }, // Jahmyr Gibbs - Pass catching RB2
      { round: 6, playerId: 'ma-9' }  // Mark Andrews - Elite TE
    ];

    for (let round = 1; round <= 16; round++) {
      const draftOrder = round % 2 === 1 
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Odd rounds: normal order
        : [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // Even rounds: snake order
      
      for (const draftPos of draftOrder) {
        const teamId = this.fantasyTeams.find(t => t.draftPosition === draftPos)?.id || draftPos;
        const pickNumber = ((round - 1) * 10) + draftOrder.indexOf(draftPos) + 1;
        
        let selectedPlayer: NFLPlayer;
        
        // Strategic picks for Nicholas (team ID 1)
        if (teamId === 1 && round <= 6) {
          const targetPick = nicholasTargets.find(t => t.round === round);
          if (targetPick) {
            const targetPlayer = availablePlayers.find(p => p.id === targetPick.playerId);
            if (targetPlayer) {
              selectedPlayer = targetPlayer;
              availablePlayers.splice(availablePlayers.indexOf(targetPlayer), 1);
            } else {
              selectedPlayer = availablePlayers.shift()!;
            }
          } else {
            selectedPlayer = availablePlayers.shift()!;
          }
        } else {
          // Other teams get best available
          selectedPlayer = availablePlayers.shift()!;
        }
        
        if (selectedPlayer) {
          draftPicks.push({
            round,
            pick: pickNumber,
            teamId,
            playerId: selectedPlayer.id,
            playerName: selectedPlayer.name,
            position: selectedPlayer.position,
            team: selectedPlayer.team
          });
        }
      }
    }
    
    return draftPicks;
  }

  async executeDraft(leagueId: number, draftPicks: DraftPick[]): Promise<void> {
    console.log('📝 Executing draft...');
    
    for (const pick of draftPicks) {
      // Add to roster
      await sql`
        INSERT INTO roster_players (
          team_id, player_id, acquired_date, acquisition_type, created_at, updated_at
        ) VALUES (
          ${pick.teamId}, ${pick.playerId}, CURRENT_TIMESTAMP, 'draft',
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;
    }
    
    console.log(`✅ Draft complete - ${draftPicks.length} picks processed`);
  }

  async generateWeek1Results(): Promise<void> {
    console.log('📊 Generating Week 1 results...');
    
    // Week 1 scoring results (Nicholas leads!)
    const week1Scores = [
      { teamId: 1, points: 128.7, result: 'W' }, // Nicholas - 1st place!
      { teamId: 2, points: 124.3, result: 'W' }, // Brittany
      { teamId: 3, points: 121.8, result: 'W' }, // Marcus  
      { teamId: 4, points: 119.2, result: 'W' }, // Sarah
      { teamId: 5, points: 116.5, result: 'W' }, // Kaity
      { teamId: 6, points: 114.1, result: 'L' }, // David
      { teamId: 7, points: 110.8, result: 'L' }, // Cason
      { teamId: 8, points: 107.4, result: 'L' }, // Mike
      { teamId: 9, points: 103.9, result: 'L' }, // Jessica
      { teamId: 10, points: 98.6, result: 'L' }   // Alex
    ];
    
    for (const score of week1Scores) {
      const wins = score.result === 'W' ? 1 : 0;
      const losses = score.result === 'L' ? 1 : 0;
      
      await sql`
        UPDATE teams SET
          wins = ${wins},
          losses = ${losses},
          points_for = ${score.points},
          points_against = ${120.0 - score.points + 120.0}, -- Realistic opponent scoring
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${score.teamId}
      `;
    }
    
    console.log('✅ Week 1 results updated - Nicholas leads the league!');
  }

  async setupComplete2025Season(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🚀 Starting complete 2025 NFL season setup...');
      
      // Step 1: Clear existing data
      await this.clearExistingData();
      
      // Step 2: Setup NFL infrastructure
      await this.setupNFLTeams();
      await this.setupNFLPlayers();
      
      // Step 3: Create league and teams
      const leagueId = await this.createLeague();
      await this.createFantasyTeams(leagueId);
      
      // Step 4: Execute strategic draft
      const draftPicks = this.generateDraftResults();
      await this.executeDraft(leagueId, draftPicks);
      
      // Step 5: Generate Week 1 results
      await this.generateWeek1Results();
      
      console.log('🏆 2025 season setup complete!');
      
      return {
        success: true,
        message: '2025 NFL Season setup completed successfully!',
        data: {
          leagueId,
          teams: this.fantasyTeams.length,
          players: this.topNFLPlayers.length,
          nflTeams: this.nflTeams.length,
          currentWeek: 2,
          leader: 'Nicholas D\'Amato (Astral Crushers)',
          leaderScore: 128.7
        }
      };
      
    } catch (error) {
      console.error('❌ Season setup failed:', error);
      return {
        success: false,
        message: `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async validateSetup(): Promise<{ valid: boolean; checks: any[] }> {
    const checks = [];
    
    try {
      // Check NFL teams
      const nflTeamsCount = await sql`SELECT COUNT(*) as count FROM nfl_teams`;
      checks.push({
        name: 'NFL Teams',
        expected: 32,
        actual: parseInt(nflTeamsCount[0].count),
        passed: parseInt(nflTeamsCount[0].count) === 32
      });
      
      // Check players
      const playersCount = await sql`SELECT COUNT(*) as count FROM players`;
      checks.push({
        name: 'NFL Players',
        expected: '15+',
        actual: parseInt(playersCount[0].count),
        passed: parseInt(playersCount[0].count) >= 15
      });
      
      // Check league
      const leaguesCount = await sql`SELECT COUNT(*) as count FROM leagues WHERE season = 2025`;
      checks.push({
        name: '2025 League',
        expected: 1,
        actual: parseInt(leaguesCount[0].count),
        passed: parseInt(leaguesCount[0].count) === 1
      });
      
      // Check fantasy teams
      const teamsCount = await sql`SELECT COUNT(*) as count FROM teams`;
      checks.push({
        name: 'Fantasy Teams',
        expected: 10,
        actual: parseInt(teamsCount[0].count),
        passed: parseInt(teamsCount[0].count) === 10
      });
      
      // Check roster assignments
      const rostersCount = await sql`SELECT COUNT(*) as count FROM roster_players`;
      checks.push({
        name: 'Roster Players',
        expected: '60+',
        actual: parseInt(rostersCount[0].count),
        passed: parseInt(rostersCount[0].count) >= 60
      });
      
      // Check Nicholas is leading
      const leaderCheck = await sql`
        SELECT team_name, owner_name, points_for 
        FROM teams 
        ORDER BY points_for DESC 
        LIMIT 1
      `;
      const isNicholasLeading = leaderCheck[0]?.owner_name === 'Nicholas D\'Amato';
      checks.push({
        name: 'Nicholas Leading',
        expected: 'Nicholas D\'Amato',
        actual: leaderCheck[0]?.owner_name || 'None',
        passed: isNicholasLeading
      });
      
      const allPassed = checks.every(check => check.passed);
      return { valid: allPassed, checks };
      
    } catch (error) {
      console.error('Validation error:', error);
      return { 
        valid: false, 
        checks: [{ 
          name: 'Validation Error', 
          expected: 'Success', 
          actual: error instanceof Error ? error.message : 'Unknown error',
          passed: false 
        }]
      };
    }
  }
}

export const season2025Setup = new Season2025Setup();