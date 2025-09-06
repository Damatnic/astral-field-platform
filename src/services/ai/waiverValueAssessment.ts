import { database } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { AIRouterService } from './aiRouterService'
import { PredictionEngine } from './predictionEngine'
import { AdaptiveLearningEngine } from './adaptiveLearningEngine'

export interface PlayerMetrics {
  playerId: string
  name: string
  position: string
  team: string
  recentPoints: number[]
  averagePoints: number
  consistency: number
  trend: 'rising' | 'falling' | 'stable'
  injuryStatus?: string
  snapPercentage: number
  targetShare?: number
  touchShare?: number
  redZoneShare?: number
}

export interface WaiverValueMetrics {
  baseValue: number
  breakoutScore: number
  replacementValue: number
  streamingValue: number
  dynastyValue: number
  scarcityAdjustment: number
  scheduleStrength: number
  injuryImpact: number
  overallValue: number
  confidence: number
}

export interface BreakoutIndicators {
  ageProfile: number // Young players have higher breakout potential
  opportunityIncrease: number // Recent increase in snaps/targets
  efficiencyImprovement: number // Improving yards per touch/target
  talentScore: number // Based on draft capital, athleticism
  situationChange: number // New coaching, injuries to starters
  historicalComparison: number // Similar players who broke out
}

export interface StreamingMetrics {
  matchupRating: number
  weatherImpact: number
  vegasProjection: number // Based on game totals, spreads
  homeAwayFactor: number
  restDaysFactor: number
  historicalPerformance: number // vs this opponent
}

export class WaiverValueAssessment {
  private aiRouter: AIRouterService
  private predictionEngine: PredictionEngine
  private learningEngine: AdaptiveLearningEngine
  private metricsCache: Map<string, WaiverValueMetrics> = new Map()
  private readonly CACHE_DURATION = 3600000 // 1 hour

  constructor() {
    this.aiRouter = new AIRouterService()
    this.predictionEngine = new PredictionEngine()
    this.learningEngine = new AdaptiveLearningEngine()
  }

  /**
   * Comprehensive player value calculation for waiver wire
   */
  async calculatePlayerValue(
    playerId: string,
    leagueSettings: any,
    teamContext?: { teamId: string; rosterNeeds: any }
  ): Promise<WaiverValueMetrics> {
    // Check cache
    const cacheKey = `${playerId}-${JSON.stringify(leagueSettings)}-${teamContext?.teamId || 'general'}`
    const cached = this.getCachedValue(cacheKey)
    if (cached) return cached

    try {
      // Get player data and recent performance
      const playerMetrics = await this.getPlayerMetrics(playerId)
      
      // Calculate base value from recent performance
      const baseValue = this.calculateBaseValue(playerMetrics, leagueSettings)
      
      // Identify breakout potential
      const breakoutScore = await this.identifyBreakoutCandidate(playerMetrics)
      
      // Calculate replacement value (value over waiver average)
      const replacementValue = await this.calculateReplacementValue(
        playerMetrics,
        leagueSettings
      )
      
      // Calculate streaming value for upcoming matchups
      const streamingValue = await this.calculateStreamingValue(playerMetrics)
      
      // Calculate dynasty/keeper value
      const dynastyValue = await this.calculateDynastyValue(playerMetrics)
      
      // Adjust for position scarcity
      const scarcityAdjustment = await this.calculateScarcityAdjustment(
        playerMetrics.position,
        leagueSettings
      )
      
      // Evaluate schedule strength ROS
      const scheduleStrength = await this.evaluateScheduleStrength(playerMetrics)
      
      // Factor in injury concerns
      const injuryImpact = await this.assessInjuryImpact(playerMetrics)
      
      // Combine all factors with weights
      const overallValue = this.combineValueMetrics({
        baseValue,
        breakoutScore,
        replacementValue,
        streamingValue,
        dynastyValue,
        scarcityAdjustment,
        scheduleStrength,
        injuryImpact
      }, leagueSettings, teamContext)
      
      // Calculate confidence in assessment
      const confidence = this.calculateConfidence(playerMetrics)
      
      const metrics: WaiverValueMetrics = {
        baseValue,
        breakoutScore,
        replacementValue,
        streamingValue,
        dynastyValue,
        scarcityAdjustment,
        scheduleStrength,
        injuryImpact,
        overallValue,
        confidence
      }
      
      // Cache the result
      this.cacheValue(cacheKey, metrics)
      
      // Track for learning
      await this.trackValueAssessment(playerId, metrics)
      
      return metrics
    } catch (error) {
      console.error('Error calculating player value:', error)
      return this.getDefaultMetrics()
    }
  }

  /**
   * Identify breakout candidates using AI analysis
   */
  async identifyBreakoutCandidate(metrics: PlayerMetrics): Promise<number> {
    const indicators = await this.calculateBreakoutIndicators(metrics)
    
    // Use AI to analyze breakout potential
    const aiAnalysis = await this.aiRouter.query({
      messages: [
        {
          role: 'system',
          content: 'You are an expert at identifying NFL breakout players based on advanced metrics and situational factors.'
        },
        {
          role: 'user',
          content: `Analyze breakout potential for:
            Player: ${metrics.name} (${metrics.position})
            Recent Performance: ${metrics.recentPoints.join(', ')} points
            Trend: ${metrics.trend}
            Snap %: ${metrics.snapPercentage}
            Target/Touch Share: ${metrics.targetShare || metrics.touchShare || 0}%
            Age Factor: ${indicators.ageProfile}
            Opportunity Change: ${indicators.opportunityIncrease}
            Efficiency Trend: ${indicators.efficiencyImprovement}
            
            Provide a breakout score from 0-100.`
        }
      ],
      capabilities: ['fantasy_analysis', 'data_analysis'],
      complexity: 'moderate',
      priority: 'medium'
    })
    
    // Parse AI score and combine with quantitative analysis
    const aiScore = this.parseAIScore(aiAnalysis.content)
    const quantScore = this.calculateQuantitativeBreakoutScore(indicators)
    
    // Weighted combination
    return aiScore * 0.6 + quantScore * 0.4
  }

  /**
   * Calculate injury replacement urgency and value
   */
  async calculateInjuryReplacementValue(
    playerId: string,
    leagueId: string
  ): Promise<number> {
    // Get current injury situations in the league
    const { data: injuries } = await supabase
      .from('player_injuries')
      .select(`
        *,
        players(position, team, projected_return)
      `)
      .eq('status', 'out')
      .gte('projected_return', new Date().toISOString())
    
    if (!injuries || injuries.length === 0) return 0
    
    // Get player info
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()
    
    if (!player) return 0
    
    let replacementValue = 0
    
    // Check if player is a direct handcuff
    const isHandcuff = await this.checkIfHandcuff(player, injuries)
    if (isHandcuff) {
      replacementValue += 30
    }
    
    // Check if player fills injured position need
    const positionNeed = injuries.filter(inj => inj.players?.position === player.position).length
    replacementValue += positionNeed * 10
    
    // Factor in player's team situation (starter injured?)
    const teamInjuries = injuries.filter(inj => inj.players?.team === player.team)
    if (teamInjuries.length > 0) {
      replacementValue += 15 // Opportunity increase due to team injuries
    }
    
    return Math.min(replacementValue, 50) // Cap at 50
  }

  /**
   * Calculate streaming value based on upcoming matchups
   */
  async calculateStreamingValue(metrics: PlayerMetrics): Promise<number> {
    const streamingMetrics = await this.getStreamingMetrics(metrics)
    
    let value = 0
    
    // Matchup quality (defensive rankings, recent performance)
    value += streamingMetrics.matchupRating * 20
    
    // Vegas projections (high totals = more scoring opportunities)
    if (streamingMetrics.vegasProjection > 24) {
      value += 15
    } else if (streamingMetrics.vegasProjection > 20) {
      value += 10
    }
    
    // Home/away considerations
    if (streamingMetrics.homeAwayFactor > 0) {
      value += 5
    }
    
    // Weather impact (good weather = bonus for passing game)
    value += streamingMetrics.weatherImpact * 10
    
    // Historical performance vs opponent
    value += streamingMetrics.historicalPerformance * 5
    
    // Rest days advantage
    if (streamingMetrics.restDaysFactor > 7) {
      value += 5
    }
    
    return Math.min(value, 60) // Cap streaming value
  }

  /**
   * Calculate dynasty value for keeper leagues
   */
  async calculateDynastyValue(metrics: PlayerMetrics): Promise<number> {
    // Get player age and contract info
    const { data: player } = await supabase
      .from('players')
      .select('age, years_pro, draft_year, draft_round')
      .eq('id', metrics.playerId)
      .single()
    
    if (!player) return 0
    
    let dynastyValue = 0
    
    // Age factor (younger = more valuable)
    if (player.age <= 23) {
      dynastyValue += 30
    } else if (player.age <= 25) {
      dynastyValue += 20
    } else if (player.age <= 27) {
      dynastyValue += 10
    }
    
    // Experience factor (2-4 years optimal)
    if (player.years_pro >= 2 && player.years_pro <= 4) {
      dynastyValue += 15
    }
    
    // Draft capital (high picks have more invested)
    if (player.draft_round === 1) {
      dynastyValue += 20
    } else if (player.draft_round === 2) {
      dynastyValue += 10
    }
    
    // Current performance trend
    if (metrics.trend === 'rising') {
      dynastyValue += 20
    } else if (metrics.trend === 'stable') {
      dynastyValue += 10
    }
    
    // Position value (RBs depreciate faster)
    if (metrics.position === 'WR' || metrics.position === 'TE') {
      dynastyValue *= 1.2
    } else if (metrics.position === 'RB' && player.age > 26) {
      dynastyValue *= 0.7
    }
    
    return dynastyValue
  }

  /**
   * Differentiate value between dynasty and redraft
   */
  async differentiateLeagueTypeValue(
    playerId: string,
    leagueType: 'redraft' | 'dynasty' | 'keeper',
    keeperRules?: any
  ): Promise<{ redraftValue: number; dynastyValue: number; difference: number }> {
    const metrics = await this.getPlayerMetrics(playerId)
    
    // Calculate redraft value (current season only)
    const redraftValue = await this.calculateRedraftValue(metrics)
    
    // Calculate dynasty value (3+ year outlook)
    const dynastyValue = await this.calculateDynastyValue(metrics)
    
    // Adjust for keeper rules if applicable
    let adjustedDynastyValue = dynastyValue
    if (leagueType === 'keeper' && keeperRules) {
      adjustedDynastyValue = this.adjustForKeeperRules(dynastyValue, keeperRules)
    }
    
    return {
      redraftValue,
      dynastyValue: adjustedDynastyValue,
      difference: adjustedDynastyValue - redraftValue
    }
  }

  /**
   * Helper methods
   */
  
  private async getPlayerMetrics(playerId: string): Promise<PlayerMetrics> {
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()
    
    const { data: recentStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('week', { ascending: false })
      .limit(5)
    
    const recentPoints = recentStats?.map(s => s.fantasy_points) || []
    const averagePoints = recentPoints.reduce((a, b) => a + b, 0) / (recentPoints.length || 1)
    
    // Calculate consistency (lower std dev = more consistent)
    const consistency = this.calculateConsistency(recentPoints)
    
    // Determine trend
    const trend = this.determineTrend(recentPoints)
    
    return {
      playerId,
      name: player?.name || 'Unknown',
      position: player?.position || 'Unknown',
      team: player?.nfl_team || 'FA',
      recentPoints,
      averagePoints,
      consistency,
      trend,
      injuryStatus: player?.injury_status,
      snapPercentage: player?.snap_percentage || 0,
      targetShare: player?.target_share,
      touchShare: player?.touch_share,
      redZoneShare: player?.red_zone_share
    }
  }
  
  private calculateBaseValue(metrics: PlayerMetrics, leagueSettings: any): number {
    // Position-based multipliers
    const positionMultipliers: Record<string, number> = {
      QB: 1.0,
      RB: 1.2,
      WR: 1.1,
      TE: 0.9,
      K: 0.5,
      DST: 0.6
    }
    
    const multiplier = positionMultipliers[metrics.position] || 1.0
    
    // Base value from average points
    let value = metrics.averagePoints * multiplier
    
    // Adjust for consistency (consistent players more valuable)
    value *= (1 + metrics.consistency * 0.2)
    
    // Adjust for trend
    if (metrics.trend === 'rising') {
      value *= 1.15
    } else if (metrics.trend === 'falling') {
      value *= 0.85
    }
    
    // Adjust for league scoring settings
    if (leagueSettings.scoring_type === 'ppr') {
      if (metrics.position === 'RB' || metrics.position === 'WR') {
        value *= 1.1
      }
    }
    
    return value
  }
  
  private async calculateReplacementValue(
    metrics: PlayerMetrics,
    leagueSettings: any
  ): Promise<number> {
    // Get average waiver wire player at position
    const { data: waiverPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('position', metrics.position)
      .eq('roster_status', 'available')
      .order('projected_points', { ascending: false })
      .limit(20)
    
    const avgWaiverPoints = waiverPlayers
      ?.slice(5, 15) // Get middle tier of available players
      .reduce((sum, p) => sum + (p.projected_points || 0), 0) / 10 || 0
    
    // Replacement value is points above average waiver player
    return Math.max(0, metrics.averagePoints - avgWaiverPoints)
  }
  
  private async calculateBreakoutIndicators(metrics: PlayerMetrics): Promise<BreakoutIndicators> {
    const { data: player } = await supabase
      .from('players')
      .select('age, draft_year, draft_round')
      .eq('id', metrics.playerId)
      .single()
    
    return {
      ageProfile: player?.age <= 25 ? 1.0 : 0.5,
      opportunityIncrease: metrics.snapPercentage > 70 ? 0.8 : 0.4,
      efficiencyImprovement: metrics.trend === 'rising' ? 0.9 : 0.3,
      talentScore: player?.draft_round <= 3 ? 0.8 : 0.4,
      situationChange: 0.5, // Would need more context
      historicalComparison: 0.6 // Would need ML model
    }
  }
  
  private calculateQuantitativeBreakoutScore(indicators: BreakoutIndicators): number {
    const weights = {
      ageProfile: 0.2,
      opportunityIncrease: 0.25,
      efficiencyImprovement: 0.2,
      talentScore: 0.15,
      situationChange: 0.1,
      historicalComparison: 0.1
    }
    
    return Object.entries(indicators).reduce(
      (score, [key, value]) => score + value * weights[key as keyof typeof weights] * 100,
      0
    )
  }
  
  private async getStreamingMetrics(metrics: PlayerMetrics): Promise<StreamingMetrics> {
    // This would integrate with schedule and matchup data
    return {
      matchupRating: 0.7,
      weatherImpact: 0,
      vegasProjection: 23,
      homeAwayFactor: 1,
      restDaysFactor: 7,
      historicalPerformance: 0.5
    }
  }
  
  private async calculateScarcityAdjustment(position: string, leagueSettings: any): Promise<number> {
    // Get available players at position
    const { data: available } = await supabase
      .from('players')
      .select('id')
      .eq('position', position)
      .eq('roster_status', 'available')
    
    const scarcityScore = 1 - (available?.length || 0) / 100
    return Math.max(0, Math.min(1, scarcityScore))
  }
  
  private async evaluateScheduleStrength(metrics: PlayerMetrics): Promise<number> {
    // Would analyze upcoming opponents
    return 0.5
  }
  
  private async assessInjuryImpact(metrics: PlayerMetrics): Promise<number> {
    if (metrics.injuryStatus === 'out') return -1
    if (metrics.injuryStatus === 'doubtful') return -0.7
    if (metrics.injuryStatus === 'questionable') return -0.3
    return 0
  }
  
  private combineValueMetrics(
    metrics: Omit<WaiverValueMetrics, 'overallValue' | 'confidence'>,
    leagueSettings: any,
    teamContext?: any
  ): number {
    let weights = {
      baseValue: 0.3,
      breakoutScore: 0.15,
      replacementValue: 0.2,
      streamingValue: 0.1,
      dynastyValue: 0.1,
      scarcityAdjustment: 0.05,
      scheduleStrength: 0.05,
      injuryImpact: 0.05
    }
    
    // Adjust weights based on league type
    if (leagueSettings.league_type === 'dynasty') {
      weights.dynastyValue = 0.25
      weights.baseValue = 0.2
    }
    
    // Adjust for team context if provided
    if (teamContext?.rosterNeeds) {
      // Increase weight for positions of need
      weights.scarcityAdjustment = 0.15
    }
    
    return Object.entries(metrics).reduce(
      (total, [key, value]) => total + value * (weights[key as keyof typeof weights] || 0),
      0
    )
  }
  
  private calculateConsistency(points: number[]): number {
    if (points.length < 2) return 0.5
    const avg = points.reduce((a, b) => a + b, 0) / points.length
    const variance = points.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / points.length
    const stdDev = Math.sqrt(variance)
    return 1 - Math.min(stdDev / (avg || 1), 1)
  }
  
  private determineTrend(points: number[]): 'rising' | 'falling' | 'stable' {
    if (points.length < 3) return 'stable'
    const recent = points.slice(0, 2).reduce((a, b) => a + b, 0) / 2
    const previous = points.slice(2, 4).reduce((a, b) => a + b, 0) / 2
    if (recent > previous * 1.2) return 'rising'
    if (recent < previous * 0.8) return 'falling'
    return 'stable'
  }
  
  private parseAIScore(content: string): number {
    const match = content.match(/\d+/g)
    return match ? parseInt(match[0]) : 50
  }
  
  private async checkIfHandcuff(player: any, injuries: any[]): Promise<boolean> {
    // Would check depth charts and handcuff relationships
    return false
  }
  
  private async calculateRedraftValue(metrics: PlayerMetrics): Promise<number> {
    return metrics.averagePoints * 10 // Simplified
  }
  
  private adjustForKeeperRules(value: number, rules: any): number {
    // Would adjust based on keeper cost, rounds, etc.
    return value
  }
  
  private getCachedValue(key: string): WaiverValueMetrics | null {
    const cached = this.metricsCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.metrics
    }
    return null
  }
  
  private cacheValue(key: string, metrics: WaiverValueMetrics): void {
    this.metricsCache.set(key, {
      metrics,
      timestamp: Date.now()
    })
  }
  
  private async trackValueAssessment(playerId: string, metrics: WaiverValueMetrics): Promise<void> {
    // Track for learning and improvement
    await supabase
      .from('waiver_value_assessments')
      .insert({
        player_id: playerId,
        metrics,
        timestamp: new Date().toISOString()
      })
  }
  
  private getDefaultMetrics(): WaiverValueMetrics {
    return {
      baseValue: 0,
      breakoutScore: 0,
      replacementValue: 0,
      streamingValue: 0,
      dynastyValue: 0,
      scarcityAdjustment: 0,
      scheduleStrength: 0,
      injuryImpact: 0,
      overallValue: 0,
      confidence: 0
    }
  }
}

export default WaiverValueAssessment