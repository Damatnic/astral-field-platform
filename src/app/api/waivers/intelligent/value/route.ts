import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import WaiverValueAssessment from '@/services/ai/waiverValueAssessment'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase environment is not configured')
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
        { error: 'League ID is required' },
        { status: 400 }
      )
    }

    const valueAssessment = new WaiverValueAssessment()

    if (playerId) {
      // Get value for specific player
      const { data: league } = await supabase
        .from('leagues')
        .select('settings')
        .eq('id', leagueId)
        .single()

      const teamContext = teamId ? await getTeamContext(teamId) : undefined

      const value = await valueAssessment.calculatePlayerValue(
        playerId,
        league?.settings || {},
        teamContext
      )

      // Store assessment
      await storeValueAssessment(playerId, value)

      return NextResponse.json(value)
    }

    // Get top valued waiver players
    const players = await getTopWaiverPlayers(leagueId, position, limit)
    
    // Calculate values for all players
    const { data: league } = await supabase
      .from('leagues')
      .select('settings')
      .eq('id', leagueId)
      .single()

    const valuedPlayers = await Promise.all(
      players.map(async (player) => {
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

    // Sort by overall value
    valuedPlayers.sort((a, b) => b.waiverValue.overallValue - a.waiverValue.overallValue)

    return NextResponse.json({
      players: valuedPlayers,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error calculating player values:', error)
    return NextResponse.json(
      { error: 'Failed to calculate player values' },
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
        { error: 'Player ID, League ID, and League Type are required' },
        { status: 400 }
      )
    }

    const valueAssessment = new WaiverValueAssessment()

    // Differentiate value between league types
    const values = await valueAssessment.differentiateLeagueTypeValue(
      playerId,
      leagueType
    )

    // Store differentiated values
    await supabase
      .from('waiver_value_assessments')
      .insert({
        player_id: playerId,
        assessment_date: new Date().toISOString().split('T')[0],
        dynasty_value: values.dynastyValue,
        base_value: values.redraftValue,
        overall_value: leagueType === 'dynasty' ? values.dynastyValue : values.redraftValue,
        metrics: {
          leagueType,
          difference: values.difference
        }
      })

    return NextResponse.json(values)

  } catch (error) {
    console.error('Error differentiating player values:', error)
    return NextResponse.json(
      { error: 'Failed to differentiate values' },
      { status: 500 }
    )
  }
}

async function getTeamContext(teamId: string) {
  const supabase = getSupabase()
  // Get team roster and needs
  const { data: roster } = await supabase
    .from('roster_players')
    .select(`
      *,
      players(position)
    `)
    .eq('team_id', teamId)

  const positionCounts: Record<string, number> = {}
  for (const player of roster || []) {
    const pos = player.players?.position
    if (pos) {
      positionCounts[pos] = (positionCounts[pos] || 0) + 1
    }
  }

  // Calculate needs based on roster composition
  const needs: Record<string, number> = {
    QB: Math.max(0, 2 - (positionCounts.QB || 0)) / 2,
    RB: Math.max(0, 4 - (positionCounts.RB || 0)) / 4,
    WR: Math.max(0, 5 - (positionCounts.WR || 0)) / 5,
    TE: Math.max(0, 2 - (positionCounts.TE || 0)) / 2,
    K: Math.max(0, 1 - (positionCounts.K || 0)),
    DST: Math.max(0, 1 - (positionCounts.DST || 0))
  }

  return {
    teamId,
    rosterNeeds: needs
  }
}

async function getTopWaiverPlayers(leagueId: string, position?: string | null, limit: number = 20) {
  const supabase = getSupabase()
  // Get rostered players to exclude
  const { data: rostered } = await supabase
    .from('roster_players')
    .select('player_id')
    .eq('league_id', leagueId)

  const rosteredIds = rostered?.map(r => r.player_id) || []

  // Build query for available players
  let query = supabase
    .from('players')
    .select('*')
    .not('id', 'in', `(${rosteredIds.join(',')})`)

  if (position) {
    query = query.eq('position', position)
  }

  const { data: players } = await query
    .order('projected_points', { ascending: false })
    .limit(limit * 2) // Get extra to filter

  // Filter out injured/suspended players for better recommendations
  return (players || []).filter(p => 
    !['out', 'suspended'].includes(p.injury_status?.toLowerCase() || '')
  ).slice(0, limit)
}

async function storeValueAssessment(playerId: string, value: any) {
  try {
    const supabase = getSupabase()
    await supabase
      .from('waiver_value_assessments')
      .upsert({
        player_id: playerId,
        assessment_date: new Date().toISOString().split('T')[0],
        base_value: value.baseValue,
        breakout_score: value.breakoutScore,
        replacement_value: value.replacementValue,
        streaming_value: value.streamingValue,
        dynasty_value: value.dynastyValue,
        scarcity_adjustment: value.scarcityAdjustment,
        schedule_strength: value.scheduleStrength,
        injury_impact: value.injuryImpact,
        overall_value: value.overallValue,
        confidence_score: value.confidence,
        metrics: value
      })
  } catch (error) {
    console.error('Error storing value assessment:', error)
  }
}
