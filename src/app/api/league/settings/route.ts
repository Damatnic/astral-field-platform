import { NextRequest, NextResponse } from 'next/server'
import { neonServerless } from '@/lib/neon-serverless'

async function ensureColumns() {
  await neonServerless.query(
    `ALTER TABLE leagues
       ADD COLUMN IF NOT EXISTS live_polling_enabled BOOLEAN DEFAULT false,
       ADD COLUMN IF NOT EXISTS live_polling_until TIMESTAMPTZ NULL,
       ADD COLUMN IF NOT EXISTS scoring_ppr NUMERIC DEFAULT 0.5`
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')
    if (!leagueId) return NextResponse.json({ error: 'leagueId required' }, { status: 400 })

    await ensureColumns()
    const res = await neonServerless.selectSingle('leagues', { where: { id: leagueId } })
    if (res.error || !res.data) return NextResponse.json({ error: 'League not found' }, { status: 404 })

    const enabled = !!(res.data as any).live_polling_enabled
    const until = (res.data as any).live_polling_until || null
    const ppr = (res.data as any).scoring_ppr ?? 0.5
    return NextResponse.json({ leagueId, live_polling_enabled: enabled, live_polling_until: until, scoring_ppr: Number(ppr) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_SETUP_KEY || 'astral2025'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const leagueId: string | undefined = body.leagueId
    const enable: boolean | undefined = body.enable
    const minutes: number | undefined = body.minutes
    const scoring_ppr: number | undefined = typeof body.scoring_ppr === 'number' ? body.scoring_ppr : undefined
    if (!leagueId) {
      return NextResponse.json({ error: 'leagueId required' }, { status: 400 })
    }

    await ensureColumns()

    let until: string | null = null
    if (enable) {
      const ms = (minutes && minutes > 0 ? minutes : 240) * 60 * 1000 // default 4h
      until = new Date(Date.now() + ms).toISOString()
    }

    const updatePayload: any = {}
    if (typeof enable === 'boolean') {
      updatePayload.live_polling_enabled = enable
      updatePayload.live_polling_until = until
    }
    if (typeof scoring_ppr === 'number') {
      updatePayload.scoring_ppr = scoring_ppr
    }
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const update = await neonServerless.update('leagues', updatePayload, { id: leagueId })

    if (update.error) return NextResponse.json({ error: update.error }, { status: 500 })
    return NextResponse.json({ leagueId, ...updatePayload })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update settings' }, { status: 500 })
  }
}
