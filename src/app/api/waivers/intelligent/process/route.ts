import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import IntelligentWaiverProcessor from '@/services/ai/intelligentWaiverProcessor'
import WaiverValueAssessment from '@/services/ai/waiverValueAssessment'
import AIAnalyticsService from '@/services/ai/aiAnalyticsService'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase environment is not configured')
  }
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { leagueId, mode = 'auto' } = await request.json()

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }

    // Get league waiver configuration
    const { data: config, error: configError } = await supabase
      .from('waiver_configurations')
      .select('*')
      .eq('league_id', leagueId)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'League waiver configuration not found' },
        { status: 404 }
      )
    }

    // Initialize processor
    const processor = new IntelligentWaiverProcessor()
    const analytics = AIAnalyticsService

    // Track processing start
    const { data: batch, error: batchError } = await supabase
      .from('waiver_processing_batches')
      .insert({
        league_id: leagueId,
        processing_type: mode,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (batchError) {
      console.error('Error creating batch:', batchError)
    }

    // Process waivers with intelligent algorithms
    const result = await processor.processWaivers({
      leagueId,
      waiverType: config.waiver_type,
      faabBudget: config.faab_budget,
      allowZeroDollarBids: config.allow_zero_dollar_bids,
      tiebreakRule: config.tiebreak_rule,
      fairnessMode: config.fairness_mode,
      monopolizationThreshold: config.monopolization_threshold,
      competitiveBalanceWeight: config.competitive_balance_weight
    })

    // Update batch with results
    if (batch) {
      await supabase
        .from('waiver_processing_batches')
        .update({
          completed_at: new Date().toISOString(),
          total_claims: result.processed,
          successful_claims: result.successful.length,
          failed_claims: result.failed.length,
          fairness_adjustments: result.fairnessReport,
          processing_stats: {
            avgFairnessScore: calculateAvgFairness(result.fairnessReport),
            competitiveBalance: calculateCompetitiveBalance(result.fairnessReport)
          }
        })
        .eq('id', batch.id)
    }

    // Track analytics
    const aiRequest = {
      messages: [{ role: 'system' as const, content: 'Waiver processing system' }],
      capabilities: ['fantasy_analysis' as const, 'data_analysis' as const],
      complexity: 'moderate' as const,
      priority: 'high' as const,
      userId: 'system'
    }
    
    const response = {
      content: JSON.stringify(result),
      provider: 'intelligent_processor',
      tokensUsed: 0,
      actualCost: 0,
      latency: Date.now() - new Date(batch?.started_at || Date.now()).getTime(),
      cached: false,
      confidence: 0.9,
      timestamp: new Date().toISOString()
    }
    
    await analytics.logAIInteraction(aiRequest, response, true)

    // Send notifications to affected teams
    await sendWaiverNotifications(result.successful, result.failed)

    return NextResponse.json({
      success: true,
      processed: result.processed,
      successful: result.successful.length,
      failed: result.failed.length,
      fairnessReport: result.fairnessReport,
      batchId: batch?.id
    })

  } catch (error) {
    console.error('Error processing waivers:', error)
    return NextResponse.json(
      { error: 'Failed to process waivers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get('leagueId')
    const batchId = searchParams.get('batchId')

    if (batchId) {
      // Get specific batch results
      const { data, error } = await supabase
        .from('waiver_processing_batches')
        .select('*')
        .eq('id', batchId)
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(data)
    }

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }

    // Get processing history
    const { data, error } = await supabase
      .from('waiver_processing_batches')
      .select('*')
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching waiver processing history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch processing history' },
      { status: 500 }
    )
  }
}

function calculateAvgFairness(fairnessReport: any): number {
  const values = Object.values(fairnessReport)
  if (values.length === 0) return 1.0
  
  const sum = values.reduce((acc: number, team: any) => {
    return acc + (team.fairnessMultiplier || 1.0)
  }, 0)
  
  return sum / values.length
}

function calculateCompetitiveBalance(fairnessReport: any): number {
  const values = Object.values(fairnessReport)
  if (values.length === 0) return 1.0
  
  // Calculate standard deviation of success rates
  const successRates = values.map((team: any) => team.recentSuccessRate || 0)
  const avg = successRates.reduce((a, b) => a + b, 0) / successRates.length
  const variance = successRates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) / successRates.length
  const stdDev = Math.sqrt(variance)
  
  // Lower std dev = better competitive balance
  return Math.max(0, 1 - stdDev)
}

async function sendWaiverNotifications(successful: any[], failed: any[]) {
  // Implementation would send notifications via email/push
  console.log(`Sending notifications for ${successful.length} successful and ${failed.length} failed claims`)
}
