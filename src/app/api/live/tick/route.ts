import { NextRequest, NextResponse } from 'next/server'
import sportsDataService from '@/services/api/sportsDataService'
import liveScoringServerService from '@/services/server/liveScoringService'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_SETUP_KEY || 'astral2025'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const leagueId: string | undefined = body?.leagueId
    const week: number | undefined = body?.week
    const ppr: number = typeof body?.ppr === 'number' ? body.ppr : 0.5

    let sync: any = null
    if (leagueId) {
      const currWeek = week || (await sportsDataService.getCurrentWeek().catch(() => 1))
      sync = await liveScoringServerService.refreshLeagueLiveStats(leagueId, currWeek, ppr)
    } else {
      // fallback to global weekly stats sync if no league provided
      sync = await sportsDataService.syncWeeklyStatsToDatabase(week)
      if (sync.error) return NextResponse.json(sync, { status: 500 })
    }

    let live: any = null
    if (leagueId) {
      const wk = week || (await sportsDataService.getCurrentWeek().catch(() => 1))
      live = await liveScoringServerService.getLeagueLiveScoring(leagueId, wk)
    }

    return NextResponse.json({ message: 'Live tick processed', sync, live })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', usage: 'POST with { leagueId?, week? } and admin Authorization' })
}
