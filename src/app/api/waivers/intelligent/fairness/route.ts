import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const leagueId = searchParams.get('leagueId')
    const teamId = searchParams.get('teamId')
    const period = searchParams.get('period') || '30d'

    if (!leagueId) {
      return NextResponse.json(
        { error: 'League ID is required' },
        { status: 400 }
      )
    }

    if (teamId) {
      // Get fairness metrics for specific team
      const metrics = await getTeamFairnessMetrics(teamId, leagueId, period)
      return NextResponse.json(metrics)
    }

    // Get fairness metrics for all teams in league
    const { data: teams } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('league_id', leagueId)

    if (!teams) {
      return NextResponse.json(
        { error: 'No teams found' },
        { status: 404 }
      )
    }

    const leagueMetrics = await Promise.all(
      teams.map(async (team) => ({
        teamId: team.id,
        teamName: team.team_name,
        ...await getTeamFairnessMetrics(team.id, leagueId, period)
      }))
    )

    // Calculate league-wide fairness statistics
    const leagueStats = calculateLeagueFairnessStats(leagueMetrics)

    return NextResponse.json({
      teams: leagueMetrics,
      leagueStats,
      competitiveBalance: calculateCompetitiveBalance(leagueMetrics),
      monopolizationRisk: detectMonopolization(leagueMetrics)
    })

  } catch (error) {
    console.error('Error fetching fairness metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fairness metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { leagueId, adjustments } = await request.json()

    if (!leagueId || !adjustments) {
      return NextResponse.json(
        { error: 'League ID and adjustments are required' },
        { status: 400 }
      )
    }

    // Apply fairness adjustments
    for (const [teamId, adjustment] of Object.entries(adjustments)) {
      await applyFairnessAdjustment(teamId, leagueId, adjustment as number)
    }

    // Recalculate fairness metrics
    const { data: config } = await supabase
      .from('waiver_configurations')
      .select('*')
      .eq('league_id', leagueId)
      .single()

    if (config?.fairness_mode === 'strict') {
      await enforceStrictFairness(leagueId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error applying fairness adjustments:', error)
    return NextResponse.json(
      { error: 'Failed to apply adjustments' },
      { status: 500 }
    )
  }
}

async function getTeamFairnessMetrics(teamId: string, leagueId: string, period: string) {
  const supabase = getSupabase()
  const daysAgo = period === '7d' ? 7 : period === '14d' ? 14 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)

  // Get recent waiver claims
  const { data: claims } = await supabase
    .from('waiver_claims')
    .select('*')
    .eq('team_id', teamId)
    .gte('created_at', startDate.toISOString())

  const successful = claims?.filter(c => c.status === 'successful').length || 0
  const total = claims?.length || 0
  const successRate = total > 0 ? successful / total : 0

  // Get high-value acquisitions
  const { data: highValue } = await supabase
    .from('waiver_fairness_tracking')
    .select('*')
    .eq('team_id', teamId)
    .gte('player_value', 15) // Top tier players
    .gte('acquisition_date', startDate.toISOString())

  // Get budget usage
  const { data: budget } = await supabase
    .from('waiver_budgets')
    .select('*')
    .eq('team_id', teamId)
    .eq('season_year', new Date().getFullYear())
    .single()

  // Get team standings
  const { data: standings } = await supabase
    .from('teams')
    .select('wins, losses, waiver_priority')
    .eq('id', teamId)
    .single()

  // Get latest fairness tracking
  const { data: fairness } = await supabase
    .from('waiver_fairness_tracking')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    successRate,
    totalClaims: total,
    successfulClaims: successful,
    highValueAcquisitions: highValue?.length || 0,
    budgetUsed: budget?.total_spent || 0,
    budgetRemaining: budget?.current_budget || 100,
    averageBid: budget?.average_bid || 0,
    standingsPosition: calculateStandingsPosition(standings),
    waiverPriority: standings?.waiver_priority || 999,
    fairnessMultiplier: fairness?.fairness_multiplier || 1.0,
    monopolizationScore: fairness?.monopolization_score || 0,
    needScore: await calculateNeedScore(teamId)
  }
}

function calculateStandingsPosition(standings: any): number {
  if (!standings) return 10
  const winPercentage = standings.wins / (standings.wins + standings.losses || 1)
  return Math.round((1 - winPercentage) * 10) + 1
}

async function calculateNeedScore(teamId: string): Promise<number> {
  const supabase = getSupabase()
  // Analyze roster composition and injuries
  const { data: roster } = await supabase
    .from('roster_players')
    .select(`
      *,
      players(position, injury_status)
    `)
    .eq('team_id', teamId)

  if (!roster) return 0.5

  // Count positions
  const positionCounts: Record<string, number> = {}
  let injuredStarters = 0

  for (const player of roster) {
    const pos = player.players?.position
    if (pos) {
      positionCounts[pos] = (positionCounts[pos] || 0) + 1
    }
    if (player.players?.injury_status && player.starter) {
      injuredStarters++
    }
  }

  // Calculate need based on roster imbalance and injuries
  let needScore = 0
  
  // Check for position shortages
  const idealCounts: Record<string, number> = {
    QB: 2,
    RB: 4,
    WR: 5,
    TE: 2,
    K: 1,
    DST: 1
  }

  for (const [pos, ideal] of Object.entries(idealCounts)) {
    const actual = positionCounts[pos] || 0
    if (actual < ideal) {
      needScore += (ideal - actual) * 0.1
    }
  }

  // Add injury factor
  needScore += injuredStarters * 0.15

  return Math.min(needScore, 1.0)
}

function calculateLeagueFairnessStats(metrics: any[]) {
  const successRates = metrics.map(m => m.successRate)
  const budgetUsed = metrics.map(m => m.budgetUsed)
  
  return {
    avgSuccessRate: average(successRates),
    stdDevSuccessRate: standardDeviation(successRates),
    avgBudgetUsed: average(budgetUsed),
    giniCoefficient: calculateGini(successRates),
    fairnessScore: calculateOverallFairness(metrics)
  }
}

function calculateCompetitiveBalance(metrics: any[]): number {
  // Lower variance in success rates = better balance
  const successRates = metrics.map(m => m.successRate)
  const stdDev = standardDeviation(successRates)
  return Math.max(0, 1 - stdDev * 2)
}

function detectMonopolization(metrics: any[]): any[] {
  const threshold = 0.7 // 70% success rate is concerning
  return metrics
    .filter(m => m.successRate > threshold || m.highValueAcquisitions > 3)
    .map(m => ({
      teamId: m.teamId,
      teamName: m.teamName,
      risk: m.successRate > 0.8 ? 'high' : 'medium',
      successRate: m.successRate,
      highValueAcquisitions: m.highValueAcquisitions
    }))
}

async function applyFairnessAdjustment(teamId: string, leagueId: string, adjustment: number) {
  const supabase = getSupabase()
  const { data: current } = await supabase
    .from('waiver_fairness_tracking')
    .select('fairness_multiplier')
    .eq('team_id', teamId)
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const newMultiplier = Math.max(0.5, Math.min(2.0, (current?.fairness_multiplier || 1.0) + adjustment))

  await supabase
    .from('waiver_fairness_tracking')
    .insert({
      team_id: teamId,
      league_id: leagueId,
      fairness_multiplier: newMultiplier,
      acquisition_date: new Date().toISOString()
    })
}

async function enforceStrictFairness(leagueId: string) {
  // Reset waiver priorities based on reverse standings
  const supabase = getSupabase()
  const { data: teams } = await supabase
    .from('teams')
    .select('id, wins, losses')
    .eq('league_id', leagueId)
    .order('wins', { ascending: true })

  if (teams) {
    for (let i = 0; i < teams.length; i++) {
      await supabase
        .from('teams')
        .update({ waiver_priority: i + 1 })
        .eq('id', teams[i].id)
    }
  }
}

// Utility functions
function average(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function standardDeviation(arr: number[]): number {
  const avg = average(arr)
  const variance = arr.reduce((sum, x) => sum + Math.pow(x - avg, 2), 0) / arr.length
  return Math.sqrt(variance)
}

function calculateGini(values: number[]): number {
  // Gini coefficient for measuring inequality
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  let sum = 0
  
  for (let i = 0; i < n; i++) {
    sum += (2 * (i + 1) - n - 1) * sorted[i]
  }
  
  return sum / (n * sorted.reduce((a, b) => a + b, 0))
}

function calculateOverallFairness(metrics: any[]): number {
  const gini = calculateGini(metrics.map(m => m.successRate))
  const balance = calculateCompetitiveBalance(metrics)
  const monopolization = detectMonopolization(metrics).length / metrics.length
  
  return (1 - gini) * 0.4 + balance * 0.4 + (1 - monopolization) * 0.2
}
