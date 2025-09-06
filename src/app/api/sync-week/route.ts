import { NextRequest, NextResponse } from 'next/server'
import sportsDataService from '@/services/api/sportsDataService'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_SETUP_KEY || 'astral2025'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const action = body?.action as string | undefined
    const week = body?.week as number | undefined

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    switch (action) {
      case 'sync-projections': {
        const result = await sportsDataService.syncWeeklyProjectionsToDatabase(week)
        if (result.error) return NextResponse.json(result, { status: 500 })
        return NextResponse.json({ message: 'Weekly projections synced', ...result })
      }
      case 'sync-stats': {
        const result = await sportsDataService.syncWeeklyStatsToDatabase(week)
        if (result.error) return NextResponse.json(result, { status: 500 })
        return NextResponse.json({ message: 'Weekly stats synced', ...result })
      }
      default:
        return NextResponse.json({ error: 'Invalid action. Use sync-projections|sync-stats' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const [season, week, gamesInProgress] = await Promise.all([
      sportsDataService.getCurrentSeason().catch(() => null),
      sportsDataService.getCurrentWeek().catch(() => null),
      sportsDataService.areGamesInProgress().catch(() => false)
    ])
    return NextResponse.json({ season, week, gamesInProgress, actions: ['sync-projections','sync-stats'] })
  } catch {
    return NextResponse.json({ actions: ['sync-projections','sync-stats'] })
  }
}

