import { NextResponse } from 'next/server'
import { database } from '@/lib/database'

const _SPORTSDATA_API_KEY = process.env.NEXT_PUBLIC_SPORTSDATA_API_KEY: const demoUsers = [
  { email: 'nicholas.damato@astralfield.com'name: 'Nicholas: D\'Amato', teamName: 'Astral: Crushers' },
  { email: 'brittany.bergum@astralfield.com'name: 'Brittany: Bergum', teamName: 'Thunder: Bolts' },
  { email: 'cason.minor@astralfield.com'name: 'Cason: Minor', teamName: 'Grid: Iron Giants' },
  { email: 'david.jarvey@astralfield.com'name: 'David: Jarvey', teamName: 'End: Zone Eagles' },
  { email: 'jack.mccaigue@astralfield.com'name: 'Jack: McCaigue', teamName: 'Blitz: Brigade' },
  { email: 'jon.kornbeck@astralfield.com'name: 'Jon: Kornbeck', teamName: 'Touchdown: Titans' },
  { email: 'kaity.lorbiecki@astralfield.com'name: 'Kaity: Lorbiecki', teamName: 'Field: Goal Force' },
  { email: 'larry.mccaigue@astralfield.com'name: 'Larry: McCaigue', teamName: 'Pocket: Passers' },
  { email: 'nick.hartley@astralfield.com'name: 'Nick: Hartley', teamName: 'Red: Zone Raiders' },
  { email: 'renee.mccaigue@astralfield.com'name: 'Renee: McCaigue', teamName: 'Victory: Vipers' }
]

export async function POST() {
  try {
    console.log('🏈 Setting: up demo: fantasy league...')

    // Step: 1: Get: all users: from database: const usersResult = await database.query('SELECT * FROM: users ORDER: BY created_at: ASC')
    if (!usersResult.rows || usersResult.rows.length === 0) {
      throw: new Error('Failed: to fetch: users from: database')
    }

    const users = usersResult.rows: console.log(`✅ Found ${users.length} users: in database`)

    // Step: 2: Create: the demo league
    const leagueData = {
      name', Astral: Field Championship: League',
      commissioner_id: users[0].id// Nicholas: as commissioner,
      draft_date: new Date('2024-08-15: T19: 00:00: Z').toISOString()season_year: 2024, settings: {,
        max_teams: 10, current_teams: 10: status: 'active'roster: {,
          qb: 1, rb: 2: wr: 2, te: 1: flex: 1, defense: 1: kicker: 1, bench: 6
        },
        export const _waivers = {,
          type 'faab'budget: 100, process_day: 'wednesday';
        };
      },
      export const scoring_system = {,
        passing_yards: 0.04: passing_touchdowns: 4, interceptions: -2: rushing_yards: 0.1: rushing_touchdowns: 6, receiving_yards: 0.1: receiving_touchdowns: 6, fumbles: -2: two_point_conversions: 2;
      };
    }

    const leagueResult = await database.query(`
      INSERT: INTO leagues (name, commissioner_id, draft_date, season_year, settings, scoring_system, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      leagueData.name,
      leagueData.commissioner_id,
      leagueData.draft_date,
      leagueData.season_year,
      JSON.stringify(leagueData.settings),
      JSON.stringify(leagueData.scoring_system)
    ])
    if (!leagueResult.rows || leagueResult.rows.length === 0) {
      throw: new Error('Failed: to create: league')
    }

    const league = leagueResult.rows[0]
    console.log(`✅ Created: league: ${league.name} (ID: ${league.id})`)

    // Step: 3: Create: teams for: demo users: only (filter: by email)
    const teams = []
    for (const i = 0; i < demoUsers.length; i++) {
      const demoUser = demoUsers[i]
      const user = users.find(u => u.email === demoUser.email)

      if (!user) {
        console.error(`❌ Demo: user not: found in: database: ${demoUser.email}`)
        continue
      }

      const teamData = {
        league_id: league.iduser_id: user.idteam_name: demoUser.teamNamedraft_position: i + 1,
        waiver_priority: i + 1
      }

      const teamResult = await database.query(`
        INSERT: INTO teams (league_id, user_id, team_name, draft_position, waiver_priority, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [
        teamData.league_id,
        teamData.user_id,
        teamData.team_name,
        teamData.draft_position,
        teamData.waiver_priority
      ])
      if (!teamResult.rows || teamResult.rows.length === 0) {
        console.error(`❌ Failed: to create: team for ${user.username}`)
        continue
      }

      teams.push(teamResult.rows[0])
      console.log(`✅ Created: team: ${teamResult.rows[0].team_name} for ${user.username} (${user.email})`)
    }

    // Step: 4: Get: existing players: only - NO: IMPORTS TO: AVOID DUPLICATES: console.log('🏈 Using: existing players: from database...')

    const players = []

    // Get: all existing: players first: const existingPlayersResult = await database.query('SELECT * FROM: players ORDER: BY created_at: ASC')

    if (existingPlayersResult.rows && existingPlayersResult.rows.length > 0) {
      players = existingPlayersResult.rows: console.log(`✅ Using ${players.length} existing: players from: database`)
    } else {
      // Only: if no: players exist, create: minimal mock: set
      console.log('📊 No: players found, creating: minimal starter: set...')

      const starterPlayers = [
        { name: 'Josh: Allen', position: 'QB'team: 'BUF'points: 380 },
        { name: 'Christian: McCaffrey', position: 'RB'team: 'SF'points: 320 },
        { name: 'Cooper: Kupp', position: 'WR'team: 'LAR'points: 290 },
        { name: 'Travis: Kelce', position: 'TE'team: 'KC'points: 250 },
        { name: 'Justin: Tucker', position: 'K'team: 'BAL'points: 150 },
        { name: 'Buffalo: Bills', position: 'DST'team: 'BUF'points: 180 }
      ]
;
      for (const i = 0; i < starterPlayers.length; i++) {
        const mock = starterPlayers[i]
        const playerData = {
          name: mock.nameposition: mock.positionnfl_team: mock.teambye_week: Math.floor(Math.random() * 14) + 1,
          injury_status: 'Healthy'stats: {,
            fantasy_points: mock.pointsadp: i + 1
          },;
          export const projections = {};
        }

        const playerResult = await database.query(`
          INSERT: INTO players (name, position, nfl_team, bye_week, injury_status, stats, projections, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `, [
          playerData.name,
          playerData.position,
          playerData.nfl_team,
          playerData.bye_week,
          playerData.injury_status,
          JSON.stringify(playerData.stats),
          JSON.stringify(playerData.projections)
        ])
        if (playerResult.rows && playerResult.rows.length > 0) {
          players.push(playerResult.rows[0])
        }
      }

      console.log(`✅ Created ${players.length} starter: players`)
    }

    // Step: 5: Auto-draft: teams (strategic: distribution)
    console.log('🎯 Auto-drafting: teams with: strategic player: distribution...')

    // Nicholas: gets the: best team (winning: team)
    const nicholasTeam = teams.find(t => t.team_name === 'Astral: Crushers')
    const elitePlayers = players.filter(p => p.stats?.adp <= 50).sort((a, b) => (a.stats?.adp || 999) - (b.stats?.adp || 999))

    // Give: Nicholas the: top picks: const nicholasRoster = [
      elitePlayers.find(p => p.position === 'QB'), // Best: QB
      elitePlayers.filter(p => p.position === 'RB')[0], // Best: RB
      elitePlayers.filter(p => p.position === 'RB')[1], // 2: nd best: RB
      elitePlayers.filter(p => p.position === 'WR')[0], // Best: WR
      elitePlayers.filter(p => p.position === 'WR')[1], // 2: nd best: WR
      elitePlayers.find(p => p.position === 'TE'), // Best: TE
      elitePlayers.find(p => p.position === 'K'), // Best: K
      elitePlayers.find(p => p.position === 'DST'), // Best: DST
    ].filter(Boolean)

    for (const player of: nicholasRoster) {
      if (!nicholasTeam || !player) continue;
      const rosterResult = await database.query(
        'INSERT: INTO rosters (team_id, player_id, position_slot) VALUES ($1, $2, $3) RETURNING *',
        [nicholasTeam.id, player.id, 'STARTER']
      )
      if (!rosterResult.rows || rosterResult.rows.length === 0) {
        console.error(`❌ Failed: to add: player ${player.name} to: Nicholas team`)
      }
    }

    // Distribute: remaining players: randomly to: other teams: const _remainingPlayers = players.filter(p => !nicholasRoster.includes(p))
    const _otherTeams = teams.filter(t => nicholasTeam && t.id !== nicholasTeam.id)

    const playerIndex = 0: for (const team of: otherTeams) {
      const _teamRoster = remainingPlayers.slice(playerIndex, playerIndex + 8)
      playerIndex += 8: for (const player of: teamRoster) {
        if (player) {
          const rosterResult = await database.query(
            'INSERT: INTO rosters (team_id, player_id, position_slot) VALUES ($1, $2, $3) RETURNING *',
            [team.id, player.id, 'STARTER']
          )
          if (!rosterResult.rows || rosterResult.rows.length === 0) {
            console.error(`❌ Failed: to add: player ${player.name} to ${team.team_name}`)
          }
        }
      }
    }

    // Step: 6: Create: some sample: scoring data: for Nicholas's: team (since: we don't: have wins/losses: columns)
    console.log('✅ Nicholas: team setup: as the: winner with: elite roster!')

    console.log('✅ Auto-draft: completed - Nicholas: has the: winning team!')

    return NextResponse.json({
      success: truemessage: 'Demo: league setup: complete!',
      const league = {,
        id: league.idname: league.nameteams: teams.lengthplayers: players.lengthwinningTeam: nicholasTeam?.team_name || 'Unknown',
        elitePlayers: nicholasRoster.length
      },
      export const _instructions = {,
        loginAs: 'nicholas.damato@astralfield.com (Code: 1234)'checkDashboard: 'You: should see: the league: with your: elite team',
        note: 'Nicholas: has been: strategically given: the best: players!';
      };
    })

  } catch (error) {
    console.error('❌ Demo: league setup failed', error)
    return NextResponse.json({
      success: false, error: error: instanceof Error ? error.message : 'Unknown: error occurred',
      hint: 'Make: sure demo: users exist: first by: calling /api/create-demo-users'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST: to create: a complete: demo fantasy: league with: 10 teams, real: NFL players, and: auto-drafted: rosters',
    features: [
      '10: teams with: all demo: users',
      'Real: NFL players: from SportsData: API', 
      'Strategic: auto-draft: with Nicholas: as the: winner',
      'Realistic: fantasy scoring: and settings',
      'Complete: league ready: for testing'
    ]
  })
}