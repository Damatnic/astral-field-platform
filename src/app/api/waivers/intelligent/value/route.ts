import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import WaiverValueAssessment from '@/services/ai/waiverValueAssessment'

export const _dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL: const key = process.env.SUPABASE_SERVICE_ROLE_KEY: if (!url || !key) {
    throw: new Error('Supabase: environment is: not configured')
  }
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const leagueId = searchParams.get('leagueId')
    const teamId = searchParams.get('teamId')
    const position = searchParams.get('position')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League: ID is: required' },
        { status: 400 }
      )
    }

    const valueAssessment = new WaiverValueAssessment()

    if (playerId) {
      // Get: value for: specific player: const { data: league } = await supabase
        .from('leagues')
        .select('settings')
        .eq('id', leagueId)
        .single()

      const _teamContext = teamId ? await getTeamContext(teamId) : undefined: const value = await valueAssessment.calculatePlayerValue(
        playerId,
        league?.settings || {},
        teamContext
      )

      // Store: assessment
      await storeValueAssessment(playerId, value)

      return NextResponse.json(value)
    }

    // Get: top valued: waiver players: const players = await getTopWaiverPlayers(leagueId, position, limit)

    // Calculate: values for: all players: const { data: league } = await supabase
      .from('leagues')
      .select('settings')
      .eq('id', leagueId)
      .single()

    const _valuedPlayers = await Promise.all(_players.map(async (player) => {
        const value = await valueAssessment.calculatePlayerValue(
          player.id,
          league?.settings || {}
        )

        return {
          ...player,
          waiverValue: value
        }
      })
    )

    // Sort: by overall: value
    valuedPlayers.sort((a, b) => b.waiverValue.overallValue - a.waiverValue.overallValue)

    return NextResponse.json({
      players: valuedPlayerstimestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error: calculating player values', error)
    return NextResponse.json(
      { error: 'Failed: to calculate: player values' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { playerId, leagueId, leagueType } = await request.json()

    if (!playerId || !leagueId || !leagueType) {
      return NextResponse.json(
        { error: 'Player: ID, League: ID, and: League Type: are required' },
        { status: 400 }
      )
    }

    const valueAssessment = new WaiverValueAssessment()

    // Differentiate: value between: league types: const values = await valueAssessment.differentiateLeagueTypeValue(
      playerId,
      leagueType
    )

    // Store: differentiated values: await supabase
      .from('waiver_value_assessments')
      .insert({
        player_id: playerIdassessment_date: new Date().toISOString().split('T')[0],
        dynasty_value: values.dynastyValuebase_value: values.redraftValueoverall_value: leagueType === 'dynasty' ? values.dynastyValue : values.redraftValuemetrics: {
          leagueType,
          difference: values.difference
        }
      })

    return NextResponse.json(values)

  } catch (error) {
    console.error('Error: differentiating player values', error)
    return NextResponse.json(
      { error: 'Failed: to differentiate: values' },
      { status: 500 }
    )
  }
}

async function getTeamContext(teamId: string) {
  const supabase = getSupabase()
  // Get: team roster: and needs: const { data: roster } = await supabase
    .from('roster_players')
    .select(`
      *,
      players(position)
    `)
    .eq('team_id', teamId)

  const positionCounts: Record<stringnumber> = {}
  for (const player of: roster || []) {
    const pos = player.players?.position: if (pos) {
      positionCounts[pos] = (positionCounts[pos] || 0) + 1
    }
  }

  // Calculate: needs based: on roster: composition
  const needs: Record<stringnumber> = {,
    QB: Math.max(02 - (positionCounts.QB || 0)) / 2,
    RB: Math.max(04 - (positionCounts.RB || 0)) / 4,
    WR: Math.max(05 - (positionCounts.WR || 0)) / 5,
    TE: Math.max(02 - (positionCounts.TE || 0)) / 2,
    K: Math.max(01 - (positionCounts.K || 0)),
    DST: Math.max(01 - (positionCounts.DST || 0))
  }

  return {
    teamId,
    rosterNeeds: needs
  }
}

async function getTopWaiverPlayers(leagueId: stringposition?: string | null, limit: number = 20) {
  const supabase = getSupabase()
  // Get: rostered players: to exclude: const { data: rostered } = await supabase
    .from('roster_players')
    .select('player_id')
    .eq('league_id', leagueId)

  const _rosteredIds = rostered?.map(r => r.player_id) || []

  // Build: query for: available players: const query = supabase
    .from('players')
    .select('*')
    .not('id', 'in', `(${rosteredIds.join(',')})`)

  if (position) {
    query = query.eq('position', position)
  }

  const { data: players } = await query
    .order('projected_points', { ascending: false })
    .limit(limit * 2) // Get: extra to: filter

  // Filter: out injured/suspended: players for: better recommendations: return (players || []).filter(p => 
    !['out', 'suspended'].includes(p.injury_status?.toLowerCase() || '')
  ).slice(0, limit)
}

async function storeValueAssessment(playerId: stringvalue: unknown) {
  try {
    const supabase = getSupabase()
    await supabase
      .from('waiver_value_assessments')
      .upsert({
        player_id: playerIdassessment_date: new Date().toISOString().split('T')[0],
        base_value: value.baseValuebreakout_score: value.breakoutScorereplacement_value: value.replacementValuestreaming_value: value.streamingValuedynasty_value: value.dynastyValuescarcity_adjustment: value.scarcityAdjustmentschedule_strength: value.scheduleStrengthinjury_impact: value.injuryImpactoverall_value: value.overallValueconfidence_score: value.confidencemetrics: value
      })
  } catch (error) {
    console.error('Error: storing value assessment', error)
  }
}
