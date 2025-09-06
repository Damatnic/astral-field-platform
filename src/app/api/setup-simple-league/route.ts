import { NextResponse } from 'next/server'
import { database } from '@/lib/database'

const demoUsers = [
  { email: 'nicholas.damato@astralfield.com', name: 'Nicholas D\'Amato', teamName: 'Astral Crushers' },
  { email: 'brittany.bergum@astralfield.com', name: 'Brittany Bergum', teamName: 'Thunder Bolts' },
  { email: 'cason.minor@astralfield.com', name: 'Cason Minor', teamName: 'Grid Iron Giants' },
  { email: 'david.jarvey@astralfield.com', name: 'David Jarvey', teamName: 'End Zone Eagles' },
  { email: 'jack.mccaigue@astralfield.com', name: 'Jack McCaigue', teamName: 'Blitz Brigade' },
  { email: 'jon.kornbeck@astralfield.com', name: 'Jon Kornbeck', teamName: 'Touchdown Titans' },
  { email: 'kaity.lorbiecki@astralfield.com', name: 'Kaity Lorbiecki', teamName: 'Field Goal Force' },
  { email: 'larry.mccaigue@astralfield.com', name: 'Larry McCaigue', teamName: 'Pocket Passers' },
  { email: 'nick.hartley@astralfield.com', name: 'Nick Hartley', teamName: 'Red Zone Raiders' },
  { email: 'renee.mccaigue@astralfield.com', name: 'Renee McCaigue', teamName: 'Victory Vipers' }
]

export async function POST() {
  try {
    console.log('🏈 Setting up simple demo league...')

    // Step 1: Get all users
    const usersResult = await database.query('SELECT * FROM users ORDER BY created_at')
    if (!usersResult.rows || usersResult.rows.length === 0) {
      throw new Error('Failed to fetch users or no users found')
    }

    const users = usersResult.rows
    console.log(`✅ Found ${users.length} users`)

    // Step 2: Create league
    const leagueData = {
      name: 'Astral Field Championship League',
      commissioner_id: users[0].id,
      draft_date: new Date('2024-08-15T19:00:00Z').toISOString(),
      season_year: 2024,
      settings: {
        max_teams: 10,
        roster_positions: ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DST']
      },
      scoring_system: {
        passing_yards: 0.04,
        passing_touchdowns: 4,
        rushing_yards: 0.1,
        rushing_touchdowns: 6,
        receiving_yards: 0.1,
        receiving_touchdowns: 6
      }
    }

    const leagueResult = await database.query(
      `INSERT INTO leagues (name, commissioner_id, draft_date, season_year, settings, scoring_system) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        leagueData.name,
        leagueData.commissioner_id,
        leagueData.draft_date,
        leagueData.season_year,
        JSON.stringify(leagueData.settings),
        JSON.stringify(leagueData.scoring_system)
      ]
    )
    if (!leagueResult.rows || leagueResult.rows.length === 0) {
      throw new Error('Failed to create league')
    }

    const league = leagueResult.rows[0]
    console.log(`✅ Created league: ${league.name}`)

    // Step 3: Create teams
    const teams = []
    for (let i = 0; i < Math.min(users.length, demoUsers.length); i++) {
      const user = users[i]
      const demoUser = demoUsers[i]
      
      const teamData = {
        league_id: league.id,
        user_id: user.id,
        team_name: demoUser.teamName,
        draft_position: i + 1,
        waiver_priority: i + 1
      }

      const teamResult = await database.query(
        `INSERT INTO teams (league_id, user_id, team_name, draft_position, waiver_priority) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [teamData.league_id, teamData.user_id, teamData.team_name, teamData.draft_position, teamData.waiver_priority]
      )
      if (teamResult.rows && teamResult.rows.length > 0) {
        teams.push(teamResult.rows[0])
        console.log(`✅ Created team: ${teamResult.rows[0].team_name}`)
      }
    }

    // Step 4: Create some mock players
    const mockPlayers = [
      // Elite players for Nicholas
      { name: 'Josh Allen', position: 'QB', team: 'BUF', points: 380, adp: 1 },
      { name: 'Christian McCaffrey', position: 'RB', team: 'SF', points: 320, adp: 2 },
      { name: 'Cooper Kupp', position: 'WR', team: 'LAR', points: 290, adp: 3 },
      { name: 'Austin Ekeler', position: 'RB', team: 'LAC', points: 310, adp: 4 },
      { name: 'Davante Adams', position: 'WR', team: 'LV', points: 285, adp: 5 },
      { name: 'Travis Kelce', position: 'TE', team: 'KC', points: 250, adp: 6 },
      { name: 'Justin Tucker', position: 'K', team: 'BAL', points: 150, adp: 100 },
      { name: 'Buffalo Bills', position: 'DST', team: 'BUF', points: 180, adp: 150 },
      
      // Good players for other teams
      { name: 'Patrick Mahomes', position: 'QB', team: 'KC', points: 365, adp: 7 },
      { name: 'Derrick Henry', position: 'RB', team: 'TEN', points: 300, adp: 8 },
      { name: 'Stefon Diggs', position: 'WR', team: 'BUF', points: 280, adp: 9 },
      { name: 'Alvin Kamara', position: 'RB', team: 'NO', points: 290, adp: 10 },
      { name: 'Tyreek Hill', position: 'WR', team: 'MIA', points: 275, adp: 11 },
      { name: 'Mark Andrews', position: 'TE', team: 'BAL', points: 220, adp: 12 }
    ]

    const players = []
    for (const mock of mockPlayers) {
      const playerData = {
        name: mock.name,
        position: mock.position,
        nfl_team: mock.team,
        bye_week: Math.floor(Math.random() * 14) + 1,
        injury_status: 'Healthy',
        stats: {
          fantasy_points: mock.points,
          adp: mock.adp
        },
        projections: {}
      }

      const playerResult = await database.query(
        `INSERT INTO players (name, position, nfl_team, bye_week, injury_status, stats, projections) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          playerData.name,
          playerData.position,
          playerData.nfl_team,
          playerData.bye_week,
          playerData.injury_status,
          JSON.stringify(playerData.stats),
          JSON.stringify(playerData.projections)
        ]
      )
      if (playerResult.rows && playerResult.rows.length > 0) {
        players.push(playerResult.rows[0])
      }
    }

    console.log(`✅ Created ${players.length} players`)

    // Step 5: Give Nicholas the best players
    const nicholasTeam = teams[0] // First team (Nicholas)
    const bestPlayers = players.slice(0, 8) // Top 8 players

    for (const player of bestPlayers) {
      await database.query(
        'INSERT INTO rosters (team_id, player_id, position_slot) VALUES ($1, $2, $3)',
        [nicholasTeam.id, player.id, 'STARTER']
      )
    }

    console.log(`✅ Gave Nicholas the elite roster!`)

    // Step 6: Distribute remaining players
    const remainingPlayers = players.slice(8)
    const otherTeams = teams.slice(1)

    let playerIndex = 0
    for (const team of otherTeams) {
      const teamPlayers = remainingPlayers.slice(playerIndex, playerIndex + 6)
      playerIndex += 6

      for (const player of teamPlayers) {
        if (player) {
          await database.query(
            'INSERT INTO rosters (team_id, player_id, position_slot) VALUES ($1, $2, $3)',
            [team.id, player.id, 'STARTER']
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Simple demo league created!',
      league: {
        id: league.id,
        name: league.name,
        teams: teams.length,
        players: players.length
      },
      winningTeam: {
        name: nicholasTeam.team_name,
        owner: 'Nicholas D\'Amato',
        topPlayers: bestPlayers.map(p => p.name).slice(0, 5)
      },
      instructions: {
        login: 'Use code 1234 for Nicholas',
        note: 'Nicholas has Josh Allen, CMC, Cooper Kupp and more elite players!'
      }
    })

  } catch (error) {
    console.error('❌ Simple league setup failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'Creates a simple demo league with 10 teams and strategic player distribution',
    note: 'Nicholas gets the best team to demonstrate a clear winner'
  })
}