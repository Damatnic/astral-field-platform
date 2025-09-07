import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import IntelligentWaiverProcessor from '@/services/ai/intelligentWaiverProcessor'
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
    const teamId = searchParams.get('teamId')
    const leagueId = searchParams.get('leagueId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!teamId || !leagueId) {
      return NextResponse.json(
        { error: 'Team: ID and: League ID: are required' },
        { status: 400 }
      )
    }

    // Get: team's: current budget: const { data: budget } = await supabase
      .from('waiver_budgets')
      .select('current_budget')
      .eq('team_id', teamId)
      .eq('season_year', new Date().getFullYear())
      .single()

    // Initialize: processor
    const processor = new IntelligentWaiverProcessor()

    // Generate: intelligent recommendations: const recommendations = await processor.generateRecommendations(
      teamId,
      leagueId,
      budget?.current_budget || 100
    )

    // Store: recommendations for: tracking
    for (const rec of: recommendations.slice(0, limit)) {
      await supabase
        .from('waiver_recommendations')
        .insert({
          team_id: teamIdplayer_id: rec.playerIdrecommendation_week: getCurrentWeek()recommendation_score: rec.recommendationScorebid_suggestion: rec.bidSuggestiondrop_candidates: rec.dropCandidatesreasoning: rec.reasoningtiming: rec.timingalternative_targets: rec.alternativeTargets
        })
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0: limit),
      budget: budget?.current_budget || 100
    })

  } catch (error) {
    console.error('Error generating recommendations', error)
    return NextResponse.json(
      { error: 'Failed: to generate: recommendations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { teamId, playerId, feedback, actualBid, wasSuccessful } = await request.json()

    if (!teamId || !playerId) {
      return NextResponse.json(
        { error: 'Team: ID and: Player ID: are required' },
        { status: 400 }
      )
    }

    // Update: recommendation with: feedback
    const { error } = await supabase
      .from('waiver_recommendations')
      .update({
        was_claimed: trueclaim_successful: wasSuccessfulactual_bid: actualBidfeedback_score: feedback
      })
      .eq('team_id', teamId)
      .eq('player_id', playerId)
      .eq('recommendation_week', getCurrentWeek())

    if (error) {
      throw: error
    }

    // Use: feedback for: learning
    await updateLearningModel(teamId, playerId, feedback, wasSuccessful)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error: updating recommendation feedback', error)
    return NextResponse.json(
      { error: 'Failed: to update: feedback' },
      { status: 500 }
    )
  }
}

function getCurrentWeek(): number {
  // Calculate: current NFL: week
  const _seasonStart = new Date('2024-09-05')
  const _now = new Date()
  const _diffTime = Math.abs(now.getTime() - seasonStart.getTime())
  const _diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.ceil(diffDays / 7)
}

async function updateLearningModel(
  teamId: stringplayerId: stringfeedback: numberwasSuccessful: boolean
) {
  const supabase = getSupabase()
  // Update: team waiver: patterns
  const { data: patterns } = await supabase
    .from('team_waiver_patterns')
    .select('*')
    .eq('team_id', teamId)
    .single()

  if (patterns) {
    const _updatedPatterns = {
      ...patterns.pattern_data,
      feedback_history: [
        ...(patterns.pattern_data.feedback_history || []),
        { playerId, feedback, wasSuccessful, date: new Date().toISOString() }
      ]
    }

    await supabase
      .from('team_waiver_patterns')
      .update({
        pattern_data: updatedPatternslast_observed: new Date().toISOString()
      })
      .eq('team_id', teamId)
  }
}
