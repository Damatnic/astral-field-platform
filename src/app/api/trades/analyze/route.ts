import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { database } from '@/lib/database'
import tradeAnalysisEngine from '@/services/ai/tradeAnalysisEngine'
import { logger } from '@/lib/logger'
import aiAnalyticsService from '@/services/ai/aiAnalyticsService'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
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
      analyzeOnly = false // If true, don't save to database
    } = body

    // Validate required fields
    if (!proposingTeamId || !receivingTeamId || !playersOffered || !playersRequested || !leagueId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Log the analysis request
    logger.info('Trade analysis requested', {
      userId: session.user.id,
      leagueId,
      tradeId,
      playersOffered: playersOffered.length,
      playersRequested: playersRequested.length
    })

    // Perform comprehensive trade analysis
    const startTime = Date.now()
    const analysis = await tradeAnalysisEngine.analyzeTradeProposal(
      tradeId || generateTradeId(),
      proposingTeamId,
      receivingTeamId,
      playersOffered,
      playersRequested,
      leagueId
    )
    const analysisTime = Date.now() - startTime

    // Track AI usage for analytics
    await aiAnalyticsService.logAIInteraction(
      {
        messages: [
          {
            role: 'system',
            content: 'Trade analysis system'
          },
          {
            role: 'user',
            content: `Analyze trade: ${playersOffered.length} for ${playersRequested.length} players`
          }
        ],
        capabilities: ['fantasy_analysis', 'data_analysis', 'complex_reasoning'],
        complexity: 'expert',
        priority: 'high',
        userId: session.user.id
      },
      {
        content: JSON.stringify(analysis),
        provider: 'trade_analysis_engine',
        tokensUsed: 0, // Engine doesn't use tokens directly
        actualCost: calculateAnalysisCost(playersOffered.length + playersRequested.length),
        latency: analysisTime,
        cached: false,
        confidence: analysis.overallAssessment.confidence,
        timestamp: new Date().toISOString()
      }
    )

    // Save trade analysis if not in analyze-only mode
    if (!analyzeOnly && tradeId) {
      await saveTradeAnalysis(tradeId, analysis, leagueId)
    }

    // Add user-specific insights
    const userTeamId = await getUserTeamId(session.user.id, leagueId)
    const perspective = getAnalysisPerspective(
      analysis,
      userTeamId,
      proposingTeamId,
      receivingTeamId
    )

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        userPerspective: perspective
      },
      metadata: {
        analysisTime,
        confidence: analysis.overallAssessment.confidence,
        version: '1.0'
      }
    })

  } catch (error: any) {
    logger.error('Trade analysis failed:', error)
    return NextResponse.json(
      { error: 'Failed to analyze trade', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tradeId = searchParams.get('tradeId')
    const leagueId = searchParams.get('leagueId')

    if (!tradeId || !leagueId) {
      return NextResponse.json(
        { error: 'Trade ID and League ID required' },
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

    // Fetch existing trade analysis
    const result = await neonDb.selectSingle('trade_evaluations', {
      where: { trade_id: tradeId }
    })

    if (!result.data) {
      return NextResponse.json(
        { error: 'Trade analysis not found' },
        { status: 404 }
      )
    }

    // Get user perspective
    const userTeamId = await getUserTeamId(session.user.id, leagueId)
    const tradeResult = await neonDb.selectSingle('trades', {
      where: { id: tradeId }
    })

    const perspective = tradeResult.data ? getAnalysisPerspective(
      result.data as any,
      userTeamId,
      tradeResult.data.proposing_team_id,
      tradeResult.data.receiving_team_id
    ) : null

    return NextResponse.json({
      success: true,
      analysis: result.data,
      userPerspective: perspective
    })

  } catch (error: any) {
    logger.error('Failed to fetch trade analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trade analysis' },
      { status: 500 }
    )
  }
}

// Batch analysis for multiple trades
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trades, leagueId } = body

    if (!trades || !Array.isArray(trades) || !leagueId) {
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
    if (trades.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 trades per batch' },
        { status: 400 }
      )
    }

    // Analyze trades in parallel
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

    return NextResponse.json({
      success: true,
      analyses,
      metadata: {
        totalAnalyzed: analyses.length,
        averageConfidence: analyses.reduce((sum, a) => sum + a.overallAssessment.confidence, 0) / analyses.length
      }
    })

  } catch (error: any) {
    logger.error('Batch trade analysis failed:', error)
    return NextResponse.json(
      { error: 'Failed to analyze trades' },
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

async function getUserTeamId(userId: string, leagueId: string): Promise<string | null> {
  const result = await neonDb.selectSingle('teams', {
    where: { user_id: userId, league_id: leagueId }
  })
  return result.data?.id || null
}

function generateTradeId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function calculateAnalysisCost(playerCount: number): number {
  // Base cost + per-player cost
  const baseCost = 0.01
  const perPlayerCost = 0.005
  return baseCost + (playerCount * perPlayerCost)
}

async function saveTradeAnalysis(tradeId: string, analysis: any, leagueId: string): Promise<void> {
  try {
    // Save main evaluation
    await neonDb.insert('trade_evaluations', {
      trade_id: tradeId,
      league_id: leagueId,
      fairness_score: analysis.overallAssessment.fairnessScore,
      overall_rating: analysis.overallAssessment.rating,
      confidence_level: analysis.overallAssessment.confidence,
      value_gap: analysis.valueAnalysis.totalValueGap,
      immediate_value_delta: analysis.valueAnalysis.immediateValueDelta,
      rest_of_season_value_delta: analysis.valueAnalysis.restOfSeasonValueDelta,
      dynasty_value_delta: analysis.valueAnalysis.dynastyValueDelta,
      proposing_team_impact: analysis.teamImpact.proposingTeam,
      receiving_team_impact: analysis.teamImpact.receivingTeam,
      proposing_team_playoff_prob_change: analysis.playoffImpact.proposingTeam.playoffProbabilityChange,
      receiving_team_playoff_prob_change: analysis.playoffImpact.receivingTeam.playoffProbabilityChange,
      proposing_team_championship_prob_change: analysis.playoffImpact.proposingTeam.championshipProbabilityChange,
      receiving_team_championship_prob_change: analysis.playoffImpact.receivingTeam.championshipProbabilityChange,
      analysis_dimensions: analysis.insights,
      recommendation: analysis.overallAssessment.recommendation,
      counter_offer_suggestions: analysis.insights.counterOfferSuggestions,
      key_insights: analysis.insights.keyFactors,
      similar_trades: analysis.marketContext.similarTrades,
      market_timing_assessment: analysis.marketContext.marketTiming
    })

    // Save fairness breakdown
    const evaluationResult = await neonDb.selectSingle('trade_evaluations', {
      where: { trade_id: tradeId }
    })

    if (evaluationResult.data) {
      await neonDb.insert('trade_fairness_scores', {
        trade_evaluation_id: evaluationResult.data.id,
        overall_fairness: analysis.fairnessBreakdown.overall,
        value_balance: analysis.fairnessBreakdown.valueBalance,
        need_fulfillment_balance: analysis.fairnessBreakdown.needsFulfillmentBalance,
        risk_balance: analysis.fairnessBreakdown.riskBalance,
        position_value_balance: analysis.fairnessBreakdown.positionalBalance,
        immediate_impact_balance: analysis.fairnessBreakdown.timingBalance,
        long_term_balance: analysis.valueAnalysis.dynastyValueDelta || 50,
        playoff_impact_balance: (analysis.playoffImpact.proposingTeam.playoffProbabilityChange + 
                                analysis.playoffImpact.receivingTeam.playoffProbabilityChange) / 2,
        league_context_adjustment: analysis.fairnessBreakdown.contextAdjustments,
        component_scores: analysis.fairnessBreakdown,
        fairness_breakdown: analysis.insights.keyFactors,
        imbalance_factors: analysis.insights.risks
      })
    }
  } catch (error) {
    logger.error('Failed to save trade analysis:', error)
  }
}

function getAnalysisPerspective(
  analysis: any,
  userTeamId: string | null,
  proposingTeamId: string,
  receivingTeamId: string
): any {
  if (!userTeamId) return null

  const isProposingTeam = userTeamId === proposingTeamId
  const isReceivingTeam = userTeamId === receivingTeamId
  const isInvolved = isProposingTeam || isReceivingTeam

  if (!isInvolved) {
    return {
      role: 'observer',
      impact: 'This trade could affect league dynamics',
      recommendation: 'Monitor for market opportunities'
    }
  }

  const team = isProposingTeam ? 'proposingTeam' : 'receivingTeam'
  const teamImpact = analysis.teamImpact[team]
  const playoffImpact = analysis.playoffImpact[team]

  return {
    role: isProposingTeam ? 'proposing' : 'receiving',
    shouldAccept: analysis.overallAssessment.fairnessScore >= 60 && teamImpact.afterValue > teamImpact.beforeValue,
    valueChange: teamImpact.afterValue - teamImpact.beforeValue,
    playoffProbChange: playoffImpact.playoffProbabilityChange,
    championshipProbChange: playoffImpact.championshipProbabilityChange,
    strengths: teamImpact.strengthsGained,
    weaknesses: teamImpact.weaknessesCreated,
    personalRecommendation: getPersonalRecommendation(
      analysis.overallAssessment.fairnessScore,
      teamImpact,
      playoffImpact,
      isProposingTeam
    )
  }
}

function getPersonalRecommendation(
  fairnessScore: number,
  teamImpact: any,
  playoffImpact: any,
  isProposing: boolean
): string {
  const valueImprovement = teamImpact.afterValue > teamImpact.beforeValue
  const playoffImprovement = playoffImpact.playoffProbabilityChange > 0

  if (fairnessScore >= 80 && valueImprovement && playoffImprovement) {
    return 'Strongly recommend accepting - excellent value and playoff improvement'
  } else if (fairnessScore >= 60 && (valueImprovement || playoffImprovement)) {
    return 'Consider accepting - fair trade with some benefits'
  } else if (fairnessScore >= 40 && !valueImprovement) {
    return isProposing ? 'Consider improving your offer' : 'Request better compensation'
  } else {
    return isProposing ? 'Reconsider this trade - poor value' : 'Reject - unfavorable terms'
  }
}