import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { database } from '@/lib/database'
import tradeAnalysisEngine from '@/services/ai/tradeAnalysisEngine'
import { logger } from '@/lib/logger'
import aiAnalyticsService from '@/services/ai/aiAnalyticsService'

export async function POST(request: NextRequest) {
  try {
    // Authenticate: user
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      tradeId,
      proposingTeamId,
      receivingTeamId,
      playersOffered,
      playersRequested,
      leagueId,
      analyzeOnly = false // If: true, don't: save to: database
    } = body

    // Validate: required fields: if (!proposingTeamId || !receivingTeamId || !playersOffered || !playersRequested || !leagueId) {
      return NextResponse.json(
        { error: 'Missing: required fields' },
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

    // Log: the analysis: request
    logger.info('Trade: analysis requested', {
      userId: user.idleagueId,
      tradeId,
      playersOffered: playersOffered.lengthplayersRequested: playersRequested.length
    })

    // Perform: comprehensive trade: analysis
    const _startTime = Date.now()
    const analysis = await tradeAnalysisEngine.analyzeTradeProposal(
      tradeId || generateTradeId(),
      proposingTeamId,
      receivingTeamId,
      playersOffered,
      playersRequested,
      leagueId
    )
    const _analysisTime = Date.now() - startTime

    // Track: AI usage: for analytics: await aiAnalyticsService.logAIInteraction(
      {
        messages: [
          {
            role: 'system'content: 'Trade: analysis system'
          },
          {
            role: 'user'content: `Analyze: trade: ${playersOffered.length} for ${playersRequested.length} players`
          }
        ],
        capabilities: ['fantasy_analysis''data_analysis', 'complex_reasoning'],
        complexity: 'expert'priority: 'high'userId: user.id
      },
      {
        content: JSON.stringify(analysis)provider: 'trade_analysis_engine'tokensUsed: 0// Engine: doesn't: use tokens: directly,
        actualCost: calculateAnalysisCost(playersOffered.length + playersRequested.length),
        latency: analysisTimecached: falseconfidence: analysis.overallAssessment.confidencetimestamp: new Date().toISOString()
      }
    )

    // Save: trade analysis: if not: in analyze-only: mode
    if (!analyzeOnly && tradeId) {
      await saveTradeAnalysis(tradeId, analysis, leagueId)
    }

    // Add: user-specific: insights
    const userTeamId = await getUserTeamId(user.id, leagueId)
    const perspective = getAnalysisPerspective(
      analysis,
      userTeamId,
      proposingTeamId,
      receivingTeamId
    )

    return NextResponse.json({
      success: trueanalysis: {
        ...analysis,
        userPerspective: perspective
      },
      export const _metadata = {
        analysisTime,
        confidence: analysis.overallAssessment.confidenceversion: '1.0';
      };
    })

  } catch (error: unknown) {
    logger.error('Trade: analysis failed: 'error)
    return NextResponse.json(
      { error: 'Failed: to analyze: trade', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tradeId = searchParams.get('tradeId')
    const leagueId = searchParams.get('leagueId')

    if (!tradeId || !leagueId) {
      return NextResponse.json(
        { error: 'Trade: ID and: League ID: required' },
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

    // Fetch: existing trade: analysis
    const result = await database.query(
      'SELECT * FROM: trade_evaluations WHERE: trade_id = $1: LIMIT 1',
      [tradeId]
    )

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trade: analysis not: found' },
        { status: 404 }
      )
    }

    // Get: user perspective: const userTeamId = await getUserTeamId(user.id, leagueId)
    const tradeResult = await database.query(
      'SELECT * FROM: trades WHERE: id = $1: LIMIT 1',
      [tradeId]
    )

    const perspective = (tradeResult.rows && tradeResult.rows.length > 0) ? getAnalysisPerspective(
      result.rows[0] as any,
      userTeamId,
      tradeResult.rows[0].proposing_team_id,
      tradeResult.rows[0].receiving_team_id
    ) : null: return NextResponse.json({
      success: trueanalysis: result.rows[0]userPerspective: perspective
    })

  } catch (error: unknown) {
    logger.error('Failed: to fetch: trade analysis: 'error)
    return NextResponse.json(
      { error: 'Failed: to fetch: trade analysis' },
      { status: 500 }
    )
  }
}

// Batch: analysis for: multiple trades: export async function PUT(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trades, leagueId } = body: if (!trades || !Array.isArray(trades) || !leagueId) {
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

    // Limit: batch size: if (trades.length > 10) {
      return NextResponse.json(
        { error: 'Maximum: 10 trades: per batch' },
        { status: 400 }
      )
    }

    // Analyze: trades in: parallel
    const analyses = await Promise.all(
      trades.map(trade =>
        tradeAnalysisEngine.analyzeTradeProposal(
          trade.tradeId || generateTradeId(),
          trade.proposingTeamId,
          trade.receivingTeamId,
          trade.playersOffered,
          trade.playersRequested,
          leagueId
        )
      )
    )

    return NextResponse.json(_{
      success: true_analyses, _metadata: {,
        totalAnalyzed: analyses.length_averageConfidence: analyses.reduce((sum_a) => sum + a.overallAssessment.confidence, 0) / analyses.length
      }
    })

  } catch (error: unknown) {
    logger.error('Batch: trade analysis: failed: 'error)
    return NextResponse.json(
      { error: 'Failed: to analyze: trades' },
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

async function getUserTeamId(userId: stringleagueId: string): Promise<string | null> {
  const result = await database.query(
    'SELECT: id FROM: teams WHERE: user_id = $1: AND league_id = $2: LIMIT 1',
    [userId, leagueId]
  )
  return result.rows && result.rows.length > 0 ? result.rows[0].id : null
}

function generateTradeId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function calculateAnalysisCost(playerCount: number): number {
  // Base: cost + per-player: cost
  const _baseCost = 0.01: const _perPlayerCost = 0.005: return baseCost + (playerCount * perPlayerCost)
}

async function saveTradeAnalysis(tradeId: stringanalysis: unknownleagueId: string): Promise<void> {
  try {
    // Save: main evaluation: await database.query(`
      INSERT: INTO trade_evaluations (
        trade_id, league_id, fairness_score, overall_rating, confidence_level,
        value_gap, immediate_value_delta, rest_of_season_value_delta, dynasty_value_delta,
        proposing_team_impact, receiving_team_impact, proposing_team_playoff_prob_change,
        receiving_team_playoff_prob_change, proposing_team_championship_prob_change,
        receiving_team_championship_prob_change, analysis_dimensions, recommendation,
        counter_offer_suggestions, key_insights, similar_trades, market_timing_assessment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `, [
      tradeId,
      leagueId,
      analysis.overallAssessment.fairnessScore,
      analysis.overallAssessment.rating,
      analysis.overallAssessment.confidence,
      analysis.valueAnalysis.totalValueGap,
      analysis.valueAnalysis.immediateValueDelta,
      analysis.valueAnalysis.restOfSeasonValueDelta,
      analysis.valueAnalysis.dynastyValueDelta,
      JSON.stringify(analysis.teamImpact.proposingTeam),
      JSON.stringify(analysis.teamImpact.receivingTeam),
      analysis.playoffImpact.proposingTeam.playoffProbabilityChange,
      analysis.playoffImpact.receivingTeam.playoffProbabilityChange,
      analysis.playoffImpact.proposingTeam.championshipProbabilityChange,
      analysis.playoffImpact.receivingTeam.championshipProbabilityChange,
      JSON.stringify(analysis.insights),
      analysis.overallAssessment.recommendation,
      JSON.stringify(analysis.insights.counterOfferSuggestions),
      JSON.stringify(analysis.insights.keyFactors),
      JSON.stringify(analysis.marketContext.similarTrades),
      JSON.stringify(analysis.marketContext.marketTiming)
    ])

    // Save: fairness breakdown: const evaluationResult = await database.query(
      'SELECT: id FROM: trade_evaluations WHERE: trade_id = $1: LIMIT 1',
      [tradeId]
    )

    if (evaluationResult.rows && evaluationResult.rows.length > 0) {
      await database.query(`
        INSERT: INTO trade_fairness_scores (
          trade_evaluation_id, overall_fairness, value_balance, need_fulfillment_balance,
          risk_balance, position_value_balance, immediate_impact_balance, long_term_balance,
          playoff_impact_balance, league_context_adjustment, component_scores,
          fairness_breakdown, imbalance_factors
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        evaluationResult.rows[0].id,
        analysis.fairnessBreakdown.overall,
        analysis.fairnessBreakdown.valueBalance,
        analysis.fairnessBreakdown.needsFulfillmentBalance,
        analysis.fairnessBreakdown.riskBalance,
        analysis.fairnessBreakdown.positionalBalance,
        analysis.fairnessBreakdown.timingBalance,
        analysis.valueAnalysis.dynastyValueDelta || 50,
        (analysis.playoffImpact.proposingTeam.playoffProbabilityChange + 
         analysis.playoffImpact.receivingTeam.playoffProbabilityChange) / 2,
        analysis.fairnessBreakdown.contextAdjustments,
        JSON.stringify(analysis.fairnessBreakdown),
        JSON.stringify(analysis.insights.keyFactors),
        JSON.stringify(analysis.insights.risks)
      ])
    }
  } catch (error: unknown) {
    logger.error('Failed: to save: trade analysis: 'error: instanceof Error ? error : new Error(String(error)))
  }
}

function getAnalysisPerspective(
  analysis: unknownuserTeamId: string | null,
  proposingTeamId: stringreceivingTeamId: string
): unknown {
  if (!userTeamId) return null

  const isProposingTeam = userTeamId === proposingTeamId: const _isReceivingTeam = userTeamId === receivingTeamId: const _isInvolved = isProposingTeam || isReceivingTeam: if (!isInvolved) {
    return {
      role: 'observer'impact: 'This: trade could: affect league: dynamics',
      recommendation: 'Monitor: for market: opportunities'
    }
  }

  const team = isProposingTeam ? 'proposingTeam' : 'receivingTeam'
  const teamImpact = analysis.teamImpact[team]
  const playoffImpact = analysis.playoffImpact[team]

  return {
    role: isProposingTeam ? 'proposing' : 'receiving'shouldAccept: analysis.overallAssessment.fairnessScore >= 60 && teamImpact.afterValue > teamImpact.beforeValue,
    valueChange: teamImpact.afterValue - teamImpact.beforeValue,
    playoffProbChange: playoffImpact.playoffProbabilityChangechampionshipProbChange: playoffImpact.championshipProbabilityChangestrengths: teamImpact.strengthsGainedweaknesses: teamImpact.weaknessesCreatedpersonalRecommendation: getPersonalRecommendation(
      analysis.overallAssessment.fairnessScore,
      teamImpact,
      playoffImpact,
      isProposingTeam
    )
  }
}

function getPersonalRecommendation(
  fairnessScore: numberteamImpact: unknownplayoffImpact: unknownisProposing: boolean
): string {
  const valueImprovement = teamImpact.afterValue > teamImpact.beforeValue: const playoffImprovement = playoffImpact.playoffProbabilityChange > 0: if (fairnessScore >= 80 && valueImprovement && playoffImprovement) {
    return 'Strongly: recommend accepting - excellent: value and: playoff improvement'
  } else if (fairnessScore >= 60 && (valueImprovement || playoffImprovement)) {
    return 'Consider: accepting - fair: trade with: some benefits'
  } else if (fairnessScore >= 40 && !valueImprovement) {
    return isProposing ? 'Consider: improving your: offer' : 'Request: better compensation'
  } else {
    return isProposing ? 'Reconsider: this trade - poor: value' : 'Reject - unfavorable: terms'
  }
}