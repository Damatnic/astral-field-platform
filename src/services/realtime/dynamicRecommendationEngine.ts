import { database } from '@/lib/database'
import { logger } from '@/lib/logger'
import aiRouter from '../ai/aiRouterService'
import liveMonitor from './liveGameMonitor'
import mlPipeline from '../ml/predictionPipeline'

export interface LiveRecommendation {
  id: string
  userId: string
  type: 'lineup_change' | 'trade_target' | 'waiver_pickup' | 'drop_candidate' | 'start_sit'
  priority: 'critical' | 'high' | 'medium' | 'low'
  confidence: number // 0-1
  urgency: number // 0-1, how time-sensitive this is
  
  recommendation: {
    action: string
    player?: {
      id: string
      name: string
      position: string
    }
    alternative?: {
      id: string
      name: string
      position: string
    }
    reasoning: string
    expectedImpact: number // projected points difference
  }
  
  triggers: Array<{
    event: string
    timestamp: string
    impact: number
  }>
  
  context: {
    gameId?: string
    gameScript?: string
    timeRemaining?: number
    currentScore?: string
    weatherChange?: boolean
  }
  
  validUntil: string // When this recommendation expires
  dismissed: boolean
  timestamp: string
}

export interface RecommendationContext {
  userId: string
  currentLineup: Array<{
    position: string
    playerId: string
    playerName: string
    projected: number
    actual: number
  }>
  benchPlayers: Array<{
    playerId: string
    playerName: string
    position: string
    projected: number
  }>
  gameStates: Map<string, any> // Live game data
  userPreferences: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
    autoApplyRecommendations: boolean
    notificationThreshold: number
  }
}

export interface LiveInsight {
  id: string
  type: 'opportunity' | 'warning' | 'trend' | 'breakout'
  title: string
  description: string
  relevantPlayers: string[]
  actionable: boolean
  confidence: number
  timestamp: string
  expiresAt: string
}

class DynamicRecommendationEngine {
  private activeRecommendations: Map<string, LiveRecommendation[]> = new Map()
  private userContexts: Map<string, RecommendationContext> = new Map()
  private liveInsights: Map<string, LiveInsight[]> = new Map()
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startRecommendationEngine()
  }

  // Generate live recommendations for user
  async generateLiveRecommendations(userId: string): Promise<{
    recommendations: LiveRecommendation[]
    insights: LiveInsight[]
    actionableCount: number
    criticalAlerts: number
  }> {
    logger.info('Generating live recommendations', { userId })

    try {
      // Get or create user context
      const context = await this.getUserContext(userId)
      
      // Update context with latest data
      await this.updateUserContext(userId, context)
      
      // Generate lineup optimization recommendations
      const lineupRecs = await this.generateLineupRecommendations(userId, context)
      
      // Generate waiver/trade recommendations
      const acquisitionRecs = await this.generateAcquisitionRecommendations(userId, context)
      
      // Generate start/sit recommendations for upcoming games
      const startSitRecs = await this.generateStartSitRecommendations(userId, context)
      
      // Combine and prioritize recommendations
      const allRecommendations = [...lineupRecs, ...acquisitionRecs, ...startSitRecs]
      const prioritizedRecs = this.prioritizeRecommendations(allRecommendations, context)
      
      // Generate live insights
      const insights = await this.generateLiveInsights(userId, context)
      
      // Store recommendations
      this.activeRecommendations.set(userId, prioritizedRecs)
      this.liveInsights.set(userId, insights)

      const actionableCount = prioritizedRecs.filter(r => !r.dismissed).length
      const criticalAlerts = prioritizedRecs.filter(r => r.priority === 'critical' && !r.dismissed).length

      return {
        recommendations: prioritizedRecs,
        insights,
        actionableCount,
        criticalAlerts
      }

    } catch (error) {
      logger.error('Failed to generate live recommendations', error as Error, { userId })
      return { recommendations: [], insights: [], actionableCount: 0, criticalAlerts: 0 }
    }
  }

  // Process live game events and update recommendations
  async processLiveGameEvent(gameId: string, event: {
    type: string
    playerId?: string
    data: any
    timestamp: string
  }): Promise<{
    affectedUsers: number
    newRecommendations: number
    updatedRecommendations: number
  }> {
    logger.info('Processing live game event', { gameId, eventType: event.type })

    try {
      let affectedUsers = 0
      let newRecommendations = 0
      let updatedRecommendations = 0

      // Get users who have players in this game
      const affectedUserIds = await this.getUsersWithPlayersInGame(gameId)
      
      for (const userId of affectedUserIds) {
        const context = await this.getUserContext(userId)
        const currentRecs = this.activeRecommendations.get(userId) || []
        
        // Check if event affects user's players
        const playerAffected = this.isPlayerAffected(event, context)
        
        if (playerAffected) {
          affectedUsers++
          
          // Generate new recommendations based on event
          const eventBasedRecs = await this.generateEventBasedRecommendations(userId, event, context)
          newRecommendations += eventBasedRecs.length
          
          // Update existing recommendations
          const updatedRecs = await this.updateExistingRecommendations(currentRecs, event, context)
          updatedRecommendations += updatedRecs
          
          // Merge and store updated recommendations
          const allRecs = [...currentRecs.filter(r => !r.dismissed), ...eventBasedRecs]
          this.activeRecommendations.set(userId, this.prioritizeRecommendations(allRecs, context))
          
          // Send real-time notification if critical
          const criticalRecs = eventBasedRecs.filter(r => r.priority === 'critical')
          if (criticalRecs.length > 0) {
            await this.sendRealTimeNotification(userId, criticalRecs)
          }
        }
      }

      return { affectedUsers, newRecommendations, updatedRecommendations }

    } catch (error) {
      logger.error('Failed to process live game event', error as Error, { gameId })
      return { affectedUsers: 0, newRecommendations: 0, updatedRecommendations: 0 }
    }
  }

  // Get specific recommendation details
  async getRecommendationDetails(recommendationId: string): Promise<{
    recommendation: LiveRecommendation
    supportingData: {
      playerStats: any
      gameContext: any
      historicalComparisons: any[]
      aiReasoning: string
    }
    alternativeActions: Array<{
      action: string
      expectedImpact: number
      reasoning: string
    }>
  }> {
    logger.info('Getting recommendation details', { recommendationId })

    try {
      // Find the recommendation across all users
      let foundRec: LiveRecommendation | null = null
      for (const userRecs of this.activeRecommendations.values()) {
        const rec = userRecs.find(r => r.id === recommendationId)
        if (rec) {
          foundRec = rec
          break
        }
      }

      if (!foundRec) {
        throw new Error(`Recommendation ${recommendationId} not found`)
      }

      // Get supporting data
      const supportingData = await this.getSupportingData(foundRec)
      
      // Generate alternative actions
      const alternativeActions = await this.generateAlternativeActions(foundRec)

      return {
        recommendation: foundRec,
        supportingData,
        alternativeActions
      }

    } catch (error) {
      logger.error('Failed to get recommendation details', error as Error, { recommendationId })
      throw error
    }
  }

  // Apply recommendation and update user data
  async applyRecommendation(userId: string, recommendationId: string): Promise<{
    success: boolean
    changes: Array<{
      type: string
      description: string
    }>
    newProjection: number
  }> {
    logger.info('Applying recommendation', { userId, recommendationId })

    try {
      const userRecs = this.activeRecommendations.get(userId) || []
      const recommendation = userRecs.find(r => r.id === recommendationId)
      
      if (!recommendation) {
        throw new Error('Recommendation not found')
      }

      const changes = []
      let newProjection = 0

      // Apply the recommendation based on type
      switch (recommendation.type) {
        case 'lineup_change':
          const lineupChange = await this.applyLineupChange(userId, recommendation)
          changes.push(...lineupChange.changes)
          newProjection = lineupChange.newProjection
          break
          
        case 'start_sit':
          const startSitChange = await this.applyStartSitChange(userId, recommendation)
          changes.push(...startSitChange.changes)
          newProjection = startSitChange.newProjection
          break
          
        default:
          changes.push({
            type: 'info',
            description: 'Recommendation noted for manual action'
          })
      }

      // Mark recommendation as applied
      recommendation.dismissed = true
      
      // Update stored recommendations
      this.activeRecommendations.set(userId, userRecs)

      // Log the application
      await this.logRecommendationApplication(userId, recommendation, changes)

      return {
        success: true,
        changes,
        newProjection
      }

    } catch (error) {
      logger.error('Failed to apply recommendation', error as Error, { userId, recommendationId })
      return {
        success: false,
        changes: [{ type: 'error', description: 'Failed to apply recommendation' }],
        newProjection: 0
      }
    }
  }

  // Dismiss recommendation
  async dismissRecommendation(userId: string, recommendationId: string, reason?: string): Promise<void> {
    const userRecs = this.activeRecommendations.get(userId) || []
    const recommendation = userRecs.find(r => r.id === recommendationId)
    
    if (recommendation) {
      recommendation.dismissed = true
      await this.logRecommendationDismissal(userId, recommendation, reason)
    }
  }

  // Private helper methods

  private async getUserContext(userId: string): Promise<RecommendationContext> {
    let context = this.userContexts.get(userId)
    
    if (!context) {
      // Create new context
      context = await this.createUserContext(userId)
      this.userContexts.set(userId, context)
    }
    
    return context
  }

  private async createUserContext(userId: string): Promise<RecommendationContext> {
    // Get user's current lineup
    const lineup = await database.query(`
      SELECT 
        sl.position,
        sl.player_id,
        p.name as player_name,
        sl.projected_points,
        COALESCE(pgs.fantasy_points, 0) as actual_points
      FROM starting_lineups sl
      JOIN players p ON sl.player_id = p.id
      LEFT JOIN player_game_stats pgs ON p.id = pgs.player_id AND pgs.week = EXTRACT(week FROM NOW())
      WHERE sl.user_id = $1
    `, [userId])

    // Get bench players
    const bench = await database.query(`
      SELECT 
        rp.player_id,
        p.name as player_name,
        p.position,
        rp.projected_points
      FROM roster_players rp
      JOIN players p ON rp.player_id = p.id
      LEFT JOIN starting_lineups sl ON rp.player_id = sl.player_id AND sl.user_id = $1
      WHERE rp.user_id = $1 AND sl.player_id IS NULL
    `, [userId])

    // Get user preferences
    const prefs = await database.query(`
      SELECT * FROM user_preferences WHERE user_id = $1 LIMIT 1
    `, [userId])
    const prefsData = prefs.rows[0]

    return {
      userId,
      currentLineup: lineup.rows?.map((row: any) => ({
        position: row.position,
        playerId: row.player_id,
        playerName: row.player_name,
        projected: row.projected_points,
        actual: row.actual_points
      })) || [],
      benchPlayers: bench.rows?.map((row: any) => ({
        playerId: row.player_id,
        playerName: row.player_name,
        position: row.position,
        projected: row.projected_points
      })) || [],
      gameStates: new Map(),
      userPreferences: {
        riskTolerance: prefsData?.risk_tolerance || 'moderate',
        autoApplyRecommendations: prefsData?.auto_apply_recommendations || false,
        notificationThreshold: prefsData?.notification_threshold || 0.7
      }
    }
  }

  private async updateUserContext(userId: string, context: RecommendationContext): Promise<void> {
    // Update with latest live game data
    for (const player of [...context.currentLineup, ...context.benchPlayers]) {
      const liveData = await liveMonitor.monitorPlayer(player.playerId).catch(() => null)
      if (liveData) {
        // Update projections with live data
        if (context.currentLineup.find(p => p.playerId === player.playerId)) {
          const lineupPlayer = context.currentLineup.find(p => p.playerId === player.playerId)!
          lineupPlayer.projected = liveData.liveProjection.liveProjection
          lineupPlayer.actual = liveData.currentStatus.fantasyPoints
        } else {
          const benchPlayer = context.benchPlayers.find(p => p.playerId === player.playerId)!
          benchPlayer.projected = liveData.liveProjection.liveProjection
        }
      }
    }
  }

  private async generateLineupRecommendations(userId: string, context: RecommendationContext): Promise<LiveRecommendation[]> {
    const recommendations: LiveRecommendation[] = []

    // Check for underperforming starters with better bench options
    for (const starter of context.currentLineup) {
      const benchAlternatives = context.benchPlayers.filter(b => 
        b.position === starter.position && b.projected > starter.projected + 2
      )

      for (const alternative of benchAlternatives) {
        const expectedImpact = alternative.projected - starter.projected
        
        if (expectedImpact > 2) { // Significant improvement threshold
          recommendations.push({
            id: crypto.randomUUID(),
            userId,
            type: 'lineup_change' as const,
            priority: expectedImpact > 5 ? 'high' : 'medium',
            confidence: 0.8,
            urgency: this.calculateUrgency('lineup_change'),
            recommendation: {
              action: `Start ${alternative.playerName} over ${starter.playerName}`,
              player: {
                id: alternative.playerId,
                name: alternative.playerName,
                position: alternative.position
              },
              alternative: {
                id: starter.playerId,
                name: starter.playerName,
                position: starter.position
              },
              reasoning: `${alternative.playerName} is projected for ${expectedImpact.toFixed(1)} more points based on current game conditions`,
              expectedImpact
            },
            triggers: [{
              event: 'projection_update',
              timestamp: new Date().toISOString(),
              impact: expectedImpact
            }],
            context: {},
            validUntil: this.calculateValidUntil('lineup_change'),
            dismissed: false,
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    return recommendations
  }

  private async generateAcquisitionRecommendations(userId: string, context: RecommendationContext): Promise<LiveRecommendation[]> {
    const recommendations: LiveRecommendation[] = []

    // Get available waiver targets
    const waiverTargets = await database.query(`
      SELECT p.id, p.name, p.position, pp.projected_points
      FROM players p
      LEFT JOIN player_projections pp ON p.id = pp.player_id
      LEFT JOIN roster_players rp ON p.id = rp.player_id
      WHERE rp.player_id IS NULL 
      AND p.active = true
      AND pp.projected_points > 8
      ORDER BY pp.projected_points DESC
      LIMIT 20
    `)

    // Find acquisition opportunities based on injuries or game scripts
    for (const target of waiverTargets.rows || []) {
      const weakestBench = context.benchPlayers
        .filter(b => b.position === target.position)
        .sort((a, b) => a.projected - b.projected)[0]

      if (weakestBench && target.projected_points > weakestBench.projected + 3) {
        recommendations.push({
          id: crypto.randomUUID(),
          userId,
          type: 'waiver_pickup' as const,
          priority: target.projected_points > 15 ? 'high' : 'medium',
          confidence: 0.7,
          urgency: 0.6,
          recommendation: {
            action: `Pick up ${target.name} from waivers`,
            player: {
              id: target.id,
              name: target.name,
              position: target.position
            },
            alternative: {
              id: weakestBench.playerId,
              name: weakestBench.playerName,
              position: weakestBench.position
            },
            reasoning: `${target.name} has significant upside and is available on waivers`,
            expectedImpact: target.projected_points - weakestBench.projected
          },
          triggers: [{
            event: 'waiver_opportunity',
            timestamp: new Date().toISOString(),
            impact: target.projected_points - weakestBench.projected
          }],
          context: {},
          validUntil: this.calculateValidUntil('waiver_pickup'),
          dismissed: false,
          timestamp: new Date().toISOString()
        })
      }
    }

    return recommendations
  }

  private async generateStartSitRecommendations(userId: string, context: RecommendationContext): Promise<LiveRecommendation[]> {
    const recommendations: LiveRecommendation[] = []

    // Use AI to generate start/sit recommendations
    try {
      const lineupText = context.currentLineup.map(p => 
        `${p.playerName} (${p.position}) - ${p.projected} projected`
      ).join('\n')

      const benchText = context.benchPlayers.map(p => 
        `${p.playerName} (${p.position}) - ${p.projected} projected`
      ).join('\n')

      const aiResponse = await aiRouter.query({
        messages: [
          {
            role: 'system',
            content: 'You are an expert fantasy football advisor. Analyze lineups and provide start/sit recommendations.'
          },
          {
            role: 'user',
            content: `Current Lineup:\n${lineupText}\n\nBench:\n${benchText}\n\nProvide your top 3 start/sit recommendations with reasoning.`
          }
        ],
        capabilities: ['fantasy_analysis'],
        complexity: 'moderate',
        priority: 'medium'
      })

      // Parse AI response and create recommendations
      // This would parse the AI response and create structured recommendations
      
    } catch (error) {
      logger.warn('Failed to generate AI start/sit recommendations', { error: (error as Error).message })
    }

    return recommendations
  }

  private prioritizeRecommendations(recommendations: LiveRecommendation[], context: RecommendationContext): LiveRecommendation[] {
    return recommendations
      .filter(r => !r.dismissed)
      .sort((a, b) => {
        // Sort by priority, then expected impact, then urgency
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
        const aPriority = priorityWeight[a.priority]
        const bPriority = priorityWeight[b.priority]
        
        if (aPriority !== bPriority) return bPriority - aPriority
        if (a.recommendation.expectedImpact !== b.recommendation.expectedImpact) {
          return b.recommendation.expectedImpact - a.recommendation.expectedImpact
        }
        return b.urgency - a.urgency
      })
      .slice(0, 10) // Top 10 recommendations
  }

  private async generateLiveInsights(userId: string, context: RecommendationContext): Promise<LiveInsight[]> {
    const insights = []

    // Generate insights about trending players, opportunities, etc.
    insights.push({
      id: crypto.randomUUID(),
      type: 'trend' as const,
      title: 'Live Game Trends',
      description: 'Several players are outperforming projections in early games',
      relevantPlayers: context.currentLineup.slice(0, 3).map(p => p.playerId),
      actionable: false,
      confidence: 0.8,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    })

    return insights
  }

  private startRecommendationEngine(): void {
    // Process recommendations every 2 minutes
    this.processingInterval = setInterval(async () => {
      await this.processAllUserRecommendations()
    }, 2 * 60 * 1000)
  }

  private async processAllUserRecommendations(): Promise<void> {
    const userIds = Array.from(this.userContexts.keys())
    
    for (const userId of userIds) {
      try {
        await this.generateLiveRecommendations(userId)
      } catch (error) {
        logger.warn('Failed to process user recommendations', { userId, error: (error as Error).message })
      }
    }
  }

  private calculateUrgency(type: string): number {
    const urgencyMap = {
      'lineup_change': 0.8,
      'start_sit': 0.9,
      'waiver_pickup': 0.6,
      'trade_target': 0.4,
      'drop_candidate': 0.3
    }
    return urgencyMap[type as keyof typeof urgencyMap] || 0.5
  }

  private calculateValidUntil(type: string): string {
    const hoursMap = {
      'lineup_change': 4,
      'start_sit': 6,
      'waiver_pickup': 48,
      'trade_target': 168, // 1 week
      'drop_candidate': 24
    }
    
    const hours = hoursMap[type as keyof typeof hoursMap] || 24
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
  }

  // Additional helper methods would be implemented here...

  private async getUsersWithPlayersInGame(gameId: string): Promise<string[]> {
    return [] // Placeholder
  }

  private isPlayerAffected(event: any, context: RecommendationContext): boolean {
    return true // Placeholder
  }

  private async generateEventBasedRecommendations(userId: string, event: any, context: RecommendationContext): Promise<LiveRecommendation[]> {
    return [] // Placeholder
  }

  private async updateExistingRecommendations(recommendations: LiveRecommendation[], event: any, context: RecommendationContext): Promise<number> {
    return 0 // Placeholder
  }

  private async sendRealTimeNotification(userId: string, recommendations: LiveRecommendation[]): Promise<void> {
    // Send push notification or WebSocket message
  }

  private async getSupportingData(recommendation: LiveRecommendation): Promise<any> {
    return {} // Placeholder
  }

  private async generateAlternativeActions(recommendation: LiveRecommendation): Promise<any[]> {
    return [] // Placeholder
  }

  private async applyLineupChange(userId: string, recommendation: LiveRecommendation): Promise<any> {
    return { changes: [], newProjection: 0 } // Placeholder
  }

  private async applyStartSitChange(userId: string, recommendation: LiveRecommendation): Promise<any> {
    return { changes: [], newProjection: 0 } // Placeholder
  }

  private async logRecommendationApplication(userId: string, recommendation: LiveRecommendation, changes: any[]): Promise<void> {
    // Log to database
  }

  private async logRecommendationDismissal(userId: string, recommendation: LiveRecommendation, reason?: string): Promise<void> {
    // Log dismissal to database
  }

  // Cleanup method
  stopEngine(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    this.activeRecommendations.clear()
    this.userContexts.clear()
    this.liveInsights.clear()
    logger.info('Dynamic recommendation engine stopped')
  }
}

const recommendationEngine = new DynamicRecommendationEngine()
export default recommendationEngine