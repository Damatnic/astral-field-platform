import { NextResponse } from 'next/server'
import { neonServerless } from '@/lib/neon-serverless'

export async function GET() {
  try {
    console.log('🔍 Debug DB: Starting database debug...')

    // Get all users
    const usersResult = await neonServerless.select('users', {})
    console.log('👥 Users in database:', usersResult.data?.length || 0)
    
    // Get all leagues
    const leaguesResult = await neonServerless.select('leagues', {})
    console.log('🏈 Leagues in database:', leaguesResult.data?.length || 0)
    
    // Get all teams
    const teamsResult = await neonServerless.select('teams', {})
    console.log('👨‍💼 Teams in database:', teamsResult.data?.length || 0)

    // Show user-team relationships
    const users = usersResult.data || []
    const teams = teamsResult.data || []
    const leagues = leaguesResult.data || []

    const userTeamMap: Record<string, any[]> = {}
    for (const team of teams) {
      if (!userTeamMap[team.user_id]) {
        userTeamMap[team.user_id] = []
      }
      userTeamMap[team.user_id].push(team)
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: users.length,
        totalLeagues: leagues.length,
        totalTeams: teams.length,
        usersWithTeams: Object.keys(userTeamMap).length
      },
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        teamsCount: userTeamMap[user.id]?.length || 0,
        teams: userTeamMap[user.id]?.map(team => ({
          teamId: team.id,
          teamName: team.team_name,
          leagueId: team.league_id
        })) || []
      })),
      leagues: leagues.map(league => ({
        id: league.id,
        name: league.name,
        commissionerId: league.commissioner_id
      })),
      teams: teams.map(team => ({
        id: team.id,
        name: team.team_name,
        userId: team.user_id,
        leagueId: team.league_id
      }))
    })

  } catch (error) {
    console.error('❌ Debug DB error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}