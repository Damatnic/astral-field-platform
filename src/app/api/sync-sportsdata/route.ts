import { NextRequest, NextResponse } from 'next/server'
import sportsDataService from '@/services/api/sportsDataService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, team } = body

    // Validate authorization (you may want to add proper auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== 'Bearer astral2025') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let result: { success: number; failed: number; error: string | null }

    switch (action) {
      case 'sync-all-players':
        console.log('Starting sync of all NFL players from SportsData.io...')
        result = await sportsDataService.syncAllPlayersToDatabase()
        break

      case 'sync-team-players':
        if (!team) {
          return NextResponse.json(
            { error: 'Team parameter required for team sync' },
            { status: 400 }
          )
        }
        console.log(`Starting sync of ${team} players from SportsData.io...`)
        result = await sportsDataService.syncTeamPlayersToDatabase(team)
        break

      case 'get-current-week':
        const currentWeek = await sportsDataService.getCurrentWeek()
        return NextResponse.json({ currentWeek })

      case 'get-current-season':
        const currentSeason = await sportsDataService.getCurrentSeason()
        return NextResponse.json({ currentSeason })

      case 'check-games-in-progress':
        const gamesInProgress = await sportsDataService.areGamesInProgress()
        return NextResponse.json({ gamesInProgress })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: sync-all-players, sync-team-players, get-current-week, get-current-season, check-games-in-progress' },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error, success: result.success, failed: result.failed },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Sync completed: ${result.success} successful, ${result.failed} failed`,
      success: result.success,
      failed: result.failed
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get basic info about available operations
    const currentSeason = await sportsDataService.getCurrentSeason()
    const currentWeek = await sportsDataService.getCurrentWeek()
    const gamesInProgress = await sportsDataService.areGamesInProgress()

    return NextResponse.json({
      status: 'SportsData API integration active',
      currentSeason,
      currentWeek,
      gamesInProgress,
      availableActions: [
        'sync-all-players',
        'sync-team-players',
        'get-current-week',
        'get-current-season',
        'check-games-in-progress'
      ]
    })
  } catch (error: any) {
    console.error('SportsData status check error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to SportsData API' },
      { status: 500 }
    )
  }
}