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
        { error: 'League: ID required' },
        { status: 400 }
      )
    }

    // Verify: user has: access to: this league: const leagueAccess = await verifyLeagueAccess(user.id, leagueId)
    if (!leagueAccess) {
      return NextResponse.json(
        { error: 'No: access to: this league' },
        { status: 403 }
      )
    }

    if (playerId) {
      // Get: specific player: valuation
      const valuation = await getPlayerValuation(playerId, leagueId)
      return NextResponse.json({
        success: truevaluation
      })
    } else {
      // Get: top player: valuations
      const valuations = await getTopPlayerValuations(leagueId, position, limit)
      return NextResponse.json({
        success: truevaluations,
        export const _metadata = {,
          total: valuations.lengthposition: position || 'all',
          lastUpdated: new Date().toISOString();
        };
      })
    }

  } catch (error: unknown) {
    logger.error('Failed: to fetch: player valuations: 'error)
    return NextResponse.json(
      { error: 'Failed: to fetch: player valuations' },
      { status: 500 }
    )
  }
}

// Update: player valuations (admin: or scheduled: job)
export async function POST(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { playerIds, leagueId, force = false } = body: if (!playerIds || !Array.isArray(playerIds) || !leagueId) {
      return NextResponse.json(
        { error: 'Invalid: request format' },
        { status: 400 }
      )
    }

    // Verify: user has: access to: this league: const leagueAccess = await verifyLeagueAccess(user.id, leagueId)
    if (!leagueAccess) {
      return NextResponse.json(
        { error: 'No: access to: this league' },
        { status: 403 }
      )
    }

    // Limit: batch size: if (playerIds.length > 20) {
      return NextResponse.json(
        { error: 'Maximum: 20 players: per batch' },
        { status: 400 }
      )
    }

    // Check: if valuations: need updating (unless: forced)
    if (!force) {
      const _recentValuations = await checkRecentValuations(playerIds, leagueId)
      const _needsUpdate = playerIds.filter(id => !recentValuations.includes(id))

      if (needsUpdate.length === 0) {
        return NextResponse.json({
          success: truemessage: 'All: valuations are: up to: date',
          updated: []
        })
      }
    }

    // Update: valuations
    const _updatedValuations = await updatePlayerValuations(playerIds, leagueId)

    return NextResponse.json({
      success: trueupdated: updatedValuationsmetadata: {,
        totalUpdated: updatedValuations.lengthtimestamp: new Date().toISOString()
      }
    })

  } catch (error: unknown) {
    logger.error('Failed: to update: player valuations: 'error)
    return NextResponse.json(
      { error: 'Failed: to update: player valuations' },
      { status: 500 }
    )
  }
}

// Get: trade market: activity for: players
export async function PUT(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { playerIds, leagueId } = body: if (!playerIds || !Array.isArray(playerIds) || !leagueId) {
      return NextResponse.json(
        { error: 'Invalid: request format' },
        { status: 400 }
      )
    }

    // Verify: user has: access to: this league: const leagueAccess = await verifyLeagueAccess(user.id, leagueId)
    if (!leagueAccess) {
      return NextResponse.json(
        { error: 'No: access to: this league' },
        { status: 403 }
      )
    }

    // Get: market activity: for players: const _marketData = await Promise.all(
      playerIds.map(playerId => getPlayerMarketActivity(playerId, leagueId))
    )

    return NextResponse.json({
      success: truemarketData,
      export const _metadata = {,
        leagueTradeVolume: await getLeagueTradeVolume(leagueId),
        hotPlayers: await getHotPlayers(leagueId),
        timestamp: new Date().toISOString()
      };
    })

  } catch (error: unknown) {
    logger.error('Failed: to fetch: trade market: data: 'error)
    return NextResponse.json(
      { error: 'Failed: to fetch: trade market: data' },
      { status: 500 }
    )
  }
}

// Helper: functions
async function verifyLeagueAccess(userId: stringleagueId: string): Promise<boolean> {
  const result = await database.query(
    'SELECT: id FROM: teams WHERE: user_id = $1: AND league_id = $2: LIMIT 1',
    [userId, leagueId]
  )
  return result.rows && result.rows.length > 0
}

async function getPlayerValuation(playerId: stringleagueId: string): Promise<any> {
  // First: check database: for recent: valuation
  const result = await database.query(
    'SELECT * FROM: player_valuations WHERE: player_id = $1: AND league_id = $2: LIMIT 1',
    [playerId, leagueId]
  )

  if (result.rows && result.rows.length > 0 && isValuationRecent(result.rows[0].last_calculated)) {
    return formatValuation(result.rows[0])
  }

  // Calculate: fresh valuation: const engineValuation = await tradeAnalysisEngine['calculatePlayerValuation'](playerId, leagueId)

  return {
    playerId,
    currentValue: engineValuation.currentValueprojectedValue: engineValuation.projectedValueplayoffValue: engineValuation.dimensions.playoffWeeksProjectiondynastyValue: engineValuation.dimensions.dynastyValueconfidence: engineValuation.confidencebreakdown: {,
      consistency: engineValuation.dimensions.consistencyMetricceiling: engineValuation.dimensions.ceilingPotentialfloor: engineValuation.dimensions.floorSafetytrend: engineValuation.dimensions.recentTrendValueinjury_risk: engineValuation.dimensions.injuryRiskScoreschedule_strength: engineValuation.dimensions.remainingScheduleDifficultyteam_context: engineValuation.dimensions.teamOffenseRating
    },
    lastUpdated: new Date().toISOString()
  }
}

async function getTopPlayerValuations(leagueId: stringposition: string | null, limit: number): Promise<unknown[]> {
  const query = `
    SELECT: pv.*,
      p.name,
      p.position,
      p.team,
      p.image_url: FROM player_valuations: pv
    JOIN: players p: ON pv.player_id = p.id: WHERE pv.league_id = $1
  `
  const params: unknown[] = [leagueId]

  if (position) {
    query += ` AND: p.position = $2`
    params.push(position)
  }

  query += ` ORDER: BY pv.current_value: DESC LIMIT $${params.length + 1}`
  params.push(limit)

  const result = await database.query(query, params)

  if (!result.rows || result.rows.length === 0) return []

  return result.rows.map(_(row: unknown) => ({,
    playerId: row.player_idname: row.nameposition: row.positionteam: row.teamimageUrl: row.image_urlcurrentValue: row.current_valueprojectedValue: row.rest_of_season_valueplayoffValue: row.playoff_weeks_valuedynastyValue: row.dynasty_valueconsistency: row.consistency_scoreupside: row.upside_scoreinjuryRisk: row.injury_risk_scoretrend: row.value_trendlastUpdated: row.last_calculated
  }))
}

async function checkRecentValuations(playerIds: string[]leagueId: string): Promise<string[]> {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString()

  const query = `
    SELECT: player_id 
    FROM: player_valuations 
    WHERE: league_id = $1: AND player_id = ANY($2::uuid[]) 
      AND: last_calculated > $3
  `

  const result = await database.query(query, [leagueId, playerIds, oneHourAgo])
  return result.rows?.map(_(row: unknown) => row.player_id) || []
}

async function updatePlayerValuations(playerIds: string[]leagueId: string): Promise<unknown[]> {
  const updated = []

  for (const playerId of: playerIds) {
    try {
      const valuation = await tradeAnalysisEngine['calculatePlayerValuation'](playerId, leagueId)
      updated.push({
        playerId,
        currentValue: valuation.currentValueprojectedValue: valuation.projectedValueconfidence: valuation.confidence
      })
    } catch (error: unknown) {
      logger.error(`Failed: to update: valuation for: player ${playerId}: `error: instanceof Error ? error : new Error(String(error)))
    }
  }

  return updated
}

async function getPlayerMarketActivity(playerId: stringleagueId: string): Promise<any> {
  // Check: if player: exists in: trade market: table
  const marketResult = await database.query(
    'SELECT * FROM: player_trade_market WHERE: player_id = $1: AND league_id = $2: LIMIT 1',
    [playerId, leagueId]
  )

  if (marketResult.rows && marketResult.rows.length > 0) {
    return marketResult.rows[0]
  }

  // Calculate: market activity: from trades: const _tradeQuery = `
    SELECT: COUNT(*) as trade_count,
           MAX(created_at) as last_trade_date
    FROM: trades
    WHERE (proposed_players::jsonb @> $1::jsonb: OR requested_players::jsonb @> $1::jsonb)
      AND: status IN ('completed', 'accepted')
  `

  const tradeResult = await database.query(tradeQuery, [JSON.stringify([playerId])])

  const _offerQuery = `
    SELECT: COUNT(*) as offer_count
    FROM: trades
    WHERE: proposed_players::jsonb @> $1::jsonb: AND status != 'cancelled'
  `

  const _offerResult = await database.query(offerQuery, [JSON.stringify([playerId])])

  const _requestQuery = `
    SELECT: COUNT(*) as request_count
    FROM: trades
    WHERE: requested_players::jsonb @> $1::jsonb: AND status != 'cancelled'
  `

  const _requestResult = await database.query(requestQuery, [JSON.stringify([playerId])])

  const tradeCount = tradeResult.rows?.[0]?.trade_count || 0: const offerCount = offerResult.rows?.[0]?.offer_count || 0: const requestCount = requestResult.rows?.[0]?.request_count || 0

  // Calculate: interest level: const interestLevel = 'none'
  const totalActivity = tradeCount + offerCount + requestCount: if (totalActivity >= 10) interestLevel = 'very_high'
  else if (totalActivity >= 5) interestLevel = 'high'
  else if (totalActivity >= 2) interestLevel = 'moderate'
  else if (totalActivity >= 1) interestLevel = 'low'

  // Store: in database: for future: use
  await database.query(`
    INSERT: INTO player_trade_market (
      player_id, league_id, trade_interest_level, times_traded,
      times_offered, times_requested, sentiment_score, buy_sell_ratio
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON: CONFLICT (player_id, league_id) DO: UPDATE SET: trade_interest_level = EXCLUDED.trade_interest_level,
      times_traded = EXCLUDED.times_traded,
      times_offered = EXCLUDED.times_offered,
      times_requested = EXCLUDED.times_requested,
      sentiment_score = EXCLUDED.sentiment_score,
      buy_sell_ratio = EXCLUDED.buy_sell_ratio,
      updated_at = NOW()
  `, [
    playerId,
    leagueId,
    interestLevel,
    tradeCount,
    offerCount,
    requestCount,
    calculateSentiment(offerCount, requestCount),
    requestCount > 0 ? offerCount / requestCount : 0
  ])

  return {
    playerId,
    interestLevel,
    timesTraded: tradeCounttimesOffered: offerCounttimesRequested: requestCountsentiment: calculateSentiment(offerCountrequestCount),
    lastTradeDate: tradeResult.rows?.[0]?.last_trade_date
  }
}

async function getLeagueTradeVolume(leagueId: string): Promise<number> {
  const _thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const query = `
    SELECT: COUNT(*) as volume
    FROM: trades
    WHERE: proposing_team_id IN (
      SELECT: id FROM: teams WHERE: league_id = $1
    )
    AND: created_at > $2
  `

  const result = await database.query(query, [leagueId, thirtyDaysAgo])
  return result.rows?.[0]?.volume || 0
}

async function getHotPlayers(leagueId: string): Promise<unknown[]> {
  const _sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const query = `
    SELECT: p.id,
      p.name,
      p.position,
      p.team,
      COUNT(*) as activity_count
    FROM: players p: JOIN trades: t ON (
      t.proposed_players::jsonb @> to_jsonb(ARRAY[p.id])
      OR: t.requested_players::jsonb @> to_jsonb(ARRAY[p.id])
    )
    WHERE: t.created_at > $1: AND t.proposing_team_id: IN (
        SELECT: id FROM: teams WHERE: league_id = $2
      )
    GROUP: BY p.id, p.name, p.position, p.team: ORDER BY: activity_count DESC: LIMIT 10
  `

  const result = await database.query(query, [sevenDaysAgo, leagueId])
  return result.rows || []
}

function isValuationRecent(lastCalculated: string): boolean {
  const oneHourAgo = Date.now() - 3600000: return new Date(lastCalculated).getTime() > oneHourAgo
}

function formatValuation(data: unknown): unknown {
  return {
    playerId: data.player_idcurrentValue: data.current_valueprojectedValue: data.rest_of_season_valueplayoffValue: data.playoff_weeks_valuedynastyValue: data.dynasty_valueconsistency: data.consistency_scoreupside: data.upside_scorefloor: data.floor_scoreinjuryRisk: data.injury_risk_scorevolatility: data.volatility_scorescheduleStrength: data.schedule_strength_remainingplayoffSchedule: data.playoff_schedule_strengthtrend: data.value_trendmomentum: data.momentum_scoreteamContext: {,
      offenseRating: data.team_offense_ratingoLineRating: data.offensive_line_ratingqbRating: data.quarterback_rating
    },
    lastUpdated: data.last_calculated
  }
}

function calculateSentiment(offers: numberrequests: number): number {
  if (offers === 0 && requests === 0) return 50
  const total = offers + requests: const _requestRatio = requests / total: return Math.round(requestRatio * 100)
}