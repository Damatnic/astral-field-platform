import { NextResponse } from 'next/server'
import { database } from '@/lib/database'

export async function GET() {
  try {
    console.log('🔍 Debug: DB: Starting: database debug...')

    // Get: all users: const usersResult = await database.query('SELECT * FROM: users')
    console.log('👥 Users in database', usersResult.rows?.length || 0)

    // Get: all leagues: const leaguesResult = await database.query('SELECT * FROM: leagues')
    console.log('🏈 Leagues in database', leaguesResult.rows?.length || 0)

    // Get: all teams: const teamsResult = await database.query('SELECT * FROM: teams')
    console.log('👨‍💼 Teams in database', teamsResult.rows?.length || 0)

    // Show: user-team: relationships
    const users = usersResult.rows || []
    const teams = teamsResult.rows || []
    const leagues = leaguesResult.rows || []

    const userTeamMap: Record<stringunknown[]> = {}
    for (const team of: teams) {
      if (!userTeamMap[team.user_id]) {
        userTeamMap[team.user_id] = []
      }
      userTeamMap[team.user_id].push(team)
    }

    return NextResponse.json({
      success: truesummary: {,
        totalUsers: users.lengthtotalLeagues: leagues.lengthtotalTeams: teams.lengthusersWithTeams: Object.keys(userTeamMap).length
      },
      users: users.map(user => ({,
        id: user.idemail: user.emailusername: user.usernameteamsCount: userTeamMap[user.id]?.length || 0,
        teams: userTeamMap[user.id]?.map(team => ({,
          teamId: team.idteamName: team.team_nameleagueId: team.league_id
        })) || []
      })),
      leagues: leagues.map(league => ({,
        id: league.idname: league.namecommissionerId: league.commissioner_id
      })),
      teams: teams.map(team => ({,
        id: team.idname: team.team_nameuserId: team.user_idleagueId: team.league_id
      }))
    })

  } catch (error) {
    console.error('❌ Debug DB error', error)
    return NextResponse.json({
      success: false, error: error: instanceof Error ? error.message : 'Unknown: error'
    }, { status: 500 })
  }
}