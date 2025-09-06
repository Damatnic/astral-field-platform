import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'
import sportsDataService from '@/services/api/sportsDataService'
import liveScoringServerService from '@/services/server/liveScoringService'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const key = url.searchParams.get('key')
    const isVercel = !!process.env.VERCEL
    const cronKey = process.env.CRON_KEY

    if (!isVercel && cronKey && key !== cronKey) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find leagues with live window active
    const nowIso = new Date().toISOString()
    const res = await database.query(
      `SELECT id, scoring_ppr FROM leagues WHERE live_polling_enabled = true AND (live_polling_until IS NULL OR live_polling_until > $1)`,
      [nowIso]
    ) as any

    const rows = Array.isArray(res?.data) ? res.data : res
    const leagues: Array<{ id: string; scoring_ppr?: number }> = Array.isArray(rows)
      ? rows.map((r: any) => ({ id: r.id, scoring_ppr: r.scoring_ppr != null ? Number(r.scoring_ppr) : undefined }))
      : []

    if (leagues.length === 0) {
      return NextResponse.json({ message: 'No active live windows', processed: 0 })
    }

    const week = await sportsDataService.getCurrentWeek().catch(() => 1)
    let processed = 0
    const details: any[] = []
    for (const lg of leagues) {
      try {
        const result = await liveScoringServerService.refreshLeagueLiveStats(lg.id, week, lg.scoring_ppr)
        processed++
        details.push({ leagueId: lg.id, updated: result.updated, skipped: result.skipped, ppr: result.ppr })
      } catch (e: any) {
        details.push({ leagueId: lg.id, error: e?.message || 'failed' })
      }
    }

    return NextResponse.json({ message: 'Live cron tick complete', processed, details })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}

