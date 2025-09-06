import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { database } from '@/lib/database'
import tradeAnalysisEngine from '@/services/ai/tradeAnalysisEngine'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const leagueId = searchParams.get('leagueId')
    const position = searchParams.get('position')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID required' },
        { status: 400 }
      )
    }

    // Verify user has access to this league
    const leagueAccess = await verifyLeagueAccess(session.user.id, leagueId)
    if (!leagueAccess) {
      return NextResponse.json(
        { error: 'No access to this league' },
        { status: 403 }
      )
    }

    if (playerId) {
      // Get specific player valuation
      const valuation = await getPlayerValuation(playerId, leagueId)
      return NextResponse.json({
        success: true,
        valuation
      })
    } else {
      // Get top player valuations
      const valuations = await getTopPlayerValuations(leagueId, position, limit)
      return NextResponse.json({
        success: true,
        valuations,
        metadata: {
          total: valuations.length,
          position: position || 'all',
          lastUpdated: new Date().toISOString()
        }
      })
    }

  } catch (error: any) {
    logger.error('Failed to fetch player valuations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player valuations' },
      { status: 500 }
    )
  }
}

// Update player valuations (admin or scheduled job)
export async function POST(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { playerIds, leagueId, force = false } = body

    if (!playerIds || !Array.isArray(playerIds) || !leagueId) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Verify user has access to this league
    const leagueAccess = await verifyLeagueAccess(session.user.id, leagueId)
    if (!leagueAccess) {
      return NextResponse.json(
        { error: 'No access to this league' },
        { status: 403 }
      )
    }

    // Limit batch size
    if (playerIds.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 players per batch' },
        { status: 400 }
      )
    }

    // Check if valuations need updating (unless forced)
    if (!force) {
      const recentValuations = await checkRecentValuations(playerIds, leagueId)
      const needsUpdate = playerIds.filter(id => !recentValuations.includes(id))
      
      if (needsUpdate.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'All valuations are up to date',
          updated: []
        })
      }
    }

    // Update valuations
    const updatedValuations = await updatePlayerValuations(playerIds, leagueId)

    return NextResponse.json({
      success: true,
      updated: updatedValuations,
      metadata: {
        totalUpdated: updatedValuations.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    logger.error('Failed to update player valuations:', error)
    return NextResponse.json(
      { error: 'Failed to update player valuations' },
      { status: 500 }
    )
  }
}

// Get trade market activity for players
export async function PUT(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { playerIds, leagueId } = body

    if (!playerIds || !Array.isArray(playerIds) || !leagueId) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Verify user has access to this league
    const leagueAccess = await verifyLeagueAccess(session.user.id, leagueId)
    if (!leagueAccess) {
      return NextResponse.json(
        { error: 'No access to this league' },
        { status: 403 }
      )
    }

    // Get market activity for players
    const marketData = await Promise.all(
      playerIds.map(playerId => getPlayerMarketActivity(playerId, leagueId))
    )

    return NextResponse.json({
      success: true,
      marketData,
      metadata: {
        leagueTradeVolume: await getLeagueTradeVolume(leagueId),
        hotPlayers: await getHotPlayers(leagueId),
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    logger.error('Failed to fetch trade market data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trade market data' },
      { status: 500 }
    )
  }
}

// Helper functions
async function verifyLeagueAccess(userId: string, leagueId: string): Promise<boolean> {
  const result = await neonDb.selectSingle('teams', {
    where: { user_id: userId, league_id: leagueId }
  })
  return !!result.data
}

async function getPlayerValuation(playerId: string, leagueId: string): Promise<any> {
  // First check database for recent valuation
  const result = await neonDb.selectSingle('player_valuations', {
    where: { player_id: playerId, league_id: leagueId }
  })

  if (result.data && isValuationRecent(result.data.last_calculated)) {
    return formatValuation(result.data)
  }

  // Calculate fresh valuation
  const engineValuation = await tradeAnalysisEngine['calculatePlayerValuation'](playerId, leagueId)
  
  return {
    playerId,
    currentValue: engineValuation.currentValue,
    projectedValue: engineValuation.projectedValue,
    playoffValue: engineValuation.dimensions.playoffWeeksProjection,
    dynastyValue: engineValuation.dimensions.dynastyValue,
    confidence: engineValuation.confidence,
    breakdown: {
      consistency: engineValuation.dimensions.consistencyMetric,
      ceiling: engineValuation.dimensions.ceilingPotential,
      floor: engineValuation.dimensions.floorSafety,
      trend: engineValuation.dimensions.recentTrendValue,
      injury_risk: engineValuation.dimensions.injuryRiskScore,
      schedule_strength: engineValuation.dimensions.remainingScheduleDifficulty,
      team_context: engineValuation.dimensions.teamOffenseRating
    },
    lastUpdated: new Date().toISOString()
  }
}

async function getTopPlayerValuations(leagueId: string, position: string | null, limit: number): Promise<any[]> {
  let query = `
    SELECT 
      pv.*,
      p.name,
      p.position,
      p.team,
      p.image_url
    FROM player_valuations pv
    JOIN players p ON pv.player_id = p.id
    WHERE pv.league_id = $1
  `
  const params: any[] = [leagueId]

  if (position) {
    query += ` AND p.position = $2`
    params.push(position)
  }

  query += ` ORDER BY pv.current_value DESC LIMIT $${params.length + 1}`
  params.push(limit)

  const result = await neonDb.query(query, params)
  
  if (!result.data) return []

  return result.data.map(row => ({
    playerId: row.player_id,
    name: row.name,
    position: row.position,
    team: row.team,
    imageUrl: row.image_url,
    currentValue: row.current_value,
    projectedValue: row.rest_of_season_value,
    playoffValue: row.playoff_weeks_value,
    dynastyValue: row.dynasty_value,
    consistency: row.consistency_score,
    upside: row.upside_score,
    injuryRisk: row.injury_risk_score,
    trend: row.value_trend,
    lastUpdated: row.last_calculated
  }))
}

async function checkRecentValuations(playerIds: string[], leagueId: string): Promise<string[]> {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
  
  const query = `
    SELECT player_id 
    FROM player_valuations 
    WHERE league_id = $1 
      AND player_id = ANY($2::uuid[]) 
      AND last_calculated > $3
  `
  
  const result = await neonDb.query(query, [leagueId, playerIds, oneHourAgo])
  return result.data?.map(row => row.player_id) || []
}

async function updatePlayerValuations(playerIds: string[], leagueId: string): Promise<any[]> {
  const updated = []
  
  for (const playerId of playerIds) {
    try {
      const valuation = await tradeAnalysisEngine['calculatePlayerValuation'](playerId, leagueId)
      updated.push({
        playerId,
        currentValue: valuation.currentValue,
        projectedValue: valuation.projectedValue,
        confidence: valuation.confidence
      })
    } catch (error) {
      logger.error(`Failed to update valuation for player ${playerId}:`, error)
    }
  }
  
  return updated
}

async function getPlayerMarketActivity(playerId: string, leagueId: string): Promise<any> {
  // Check if player exists in trade market table
  const marketResult = await neonDb.selectSingle('player_trade_market', {
    where: { player_id: playerId, league_id: leagueId }
  })

  if (marketResult.data) {
    return marketResult.data
  }

  // Calculate market activity from trades
  const tradeQuery = `
    SELECT COUNT(*) as trade_count,
           MAX(created_at) as last_trade_date
    FROM trades
    WHERE (proposed_players::jsonb @> $1::jsonb 
           OR requested_players::jsonb @> $1::jsonb)
      AND status IN ('completed', 'accepted')
  `
  
  const tradeResult = await neonDb.query(tradeQuery, [JSON.stringify([playerId])])
  
  const offerQuery = `
    SELECT COUNT(*) as offer_count
    FROM trades
    WHERE proposed_players::jsonb @> $1::jsonb
      AND status != 'cancelled'
  `
  
  const offerResult = await neonDb.query(offerQuery, [JSON.stringify([playerId])])
  
  const requestQuery = `
    SELECT COUNT(*) as request_count
    FROM trades
    WHERE requested_players::jsonb @> $1::jsonb
      AND status != 'cancelled'
  `
  
  const requestResult = await neonDb.query(requestQuery, [JSON.stringify([playerId])])

  const tradeCount = tradeResult.data?.[0]?.trade_count || 0
  const offerCount = offerResult.data?.[0]?.offer_count || 0
  const requestCount = requestResult.data?.[0]?.request_count || 0

  // Calculate interest level
  let interestLevel = 'none'
  const totalActivity = tradeCount + offerCount + requestCount
  if (totalActivity >= 10) interestLevel = 'very_high'
  else if (totalActivity >= 5) interestLevel = 'high'
  else if (totalActivity >= 2) interestLevel = 'moderate'
  else if (totalActivity >= 1) interestLevel = 'low'

  // Store in database for future use
  await neonDb.insert('player_trade_market', {
    player_id: playerId,
    league_id: leagueId,
    trade_interest_level: interestLevel,
    times_traded: tradeCount,
    times_offered: offerCount,
    times_requested: requestCount,
    sentiment_score: calculateSentiment(offerCount, requestCount),
    buy_sell_ratio: requestCount > 0 ? offerCount / requestCount : 0
  })

  return {
    playerId,
    interestLevel,
    timesTraded: tradeCount,
    timesOffered: offerCount,
    timesRequested: requestCount,
    sentiment: calculateSentiment(offerCount, requestCount),
    lastTradeDate: tradeResult.data?.[0]?.last_trade_date
  }
}

async function getLeagueTradeVolume(leagueId: string): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  
  const query = `
    SELECT COUNT(*) as volume
    FROM trades
    WHERE proposing_team_id IN (
      SELECT id FROM teams WHERE league_id = $1
    )
    AND created_at > $2
  `
  
  const result = await neonDb.query(query, [leagueId, thirtyDaysAgo])
  return result.data?.[0]?.volume || 0
}

async function getHotPlayers(leagueId: string): Promise<any[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  
  const query = `
    SELECT 
      p.id,
      p.name,
      p.position,
      p.team,
      COUNT(*) as activity_count
    FROM players p
    JOIN trades t ON (
      t.proposed_players::jsonb @> to_jsonb(ARRAY[p.id])
      OR t.requested_players::jsonb @> to_jsonb(ARRAY[p.id])
    )
    WHERE t.created_at > $1
      AND t.proposing_team_id IN (
        SELECT id FROM teams WHERE league_id = $2
      )
    GROUP BY p.id, p.name, p.position, p.team
    ORDER BY activity_count DESC
    LIMIT 10
  `
  
  const result = await neonDb.query(query, [sevenDaysAgo, leagueId])
  return result.data || []
}

function isValuationRecent(lastCalculated: string): boolean {
  const oneHourAgo = Date.now() - 3600000
  return new Date(lastCalculated).getTime() > oneHourAgo
}

function formatValuation(data: any): any {
  return {
    playerId: data.player_id,
    currentValue: data.current_value,
    projectedValue: data.rest_of_season_value,
    playoffValue: data.playoff_weeks_value,
    dynastyValue: data.dynasty_value,
    consistency: data.consistency_score,
    upside: data.upside_score,
    floor: data.floor_score,
    injuryRisk: data.injury_risk_score,
    volatility: data.volatility_score,
    scheduleStrength: data.schedule_strength_remaining,
    playoffSchedule: data.playoff_schedule_strength,
    trend: data.value_trend,
    momentum: data.momentum_score,
    teamContext: {
      offenseRating: data.team_offense_rating,
      oLineRating: data.offensive_line_rating,
      qbRating: data.quarterback_rating
    },
    lastUpdated: data.last_calculated
  }
}

function calculateSentiment(offers: number, requests: number): number {
  if (offers === 0 && requests === 0) return 50
  const total = offers + requests
  const requestRatio = requests / total
  return Math.round(requestRatio * 100)
}