import { neonDb } from '@/lib/database'
import { logger } from '@/lib/logger'
import { MemoryCache } from '@/lib/cache'

export interface LiveGameData {
  gameId: string
  homeTeam: string
  awayTeam: string
  week: number
  quarter: number
  timeRemaining: string
  homeScore: number
  awayScore: number
  possession: string
  down: number
  distance: number
  yardLine: number
  gameStatus: 'scheduled' | 'active' | 'halftime' | 'final' | 'postponed'
  weatherConditions?: {
    temperature: number
    windSpeed: number
    precipitation: number
  }
  lastUpdate: string
}

export interface PlayerGameUpdate {
  playerId: string
  gameId: string
  stats: {
    passingYards?: number
    passingTouchdowns?: number
    rushingYards?: number
    rushingTouchdowns?: number
    receptions?: number
    receivingYards?: number
    receivingTouchdowns?: number
    fumbles?: number
    interceptions?: number
  }
  snapsPlayed: number
  targetShare: number
  redZoneTargets: number
  fantasyPoints: number
  projectedFinalPoints: number
  lastUpdate: string
}

export interface GameScriptAnalysis {
  gameId: string
  gameScript: 'neutral' | 'positive' | 'negative' | 'blowout'
  passingGameScript: number // -1 to 1, negative favors running
  timeRemaining: number // minutes
  scoreDifferential: number
  playCallTendencies: {
    passRate: number
    runRate: number
    redZonePassRate: number
  }
  garbageTime: boolean
  urgencyFactor: number // 0-1, how urgent offensive play is
}

export interface LiveProjectionUpdate {
  playerId: string
  originalProjection: number
  liveProjection: number
  adjustment: number
  adjustmentReasons: Array<{
    factor: string
    impact: number
    confidence: number
  }>
  confidenceLevel: number
  remainingUpside: number
  timestamp: string
}

class LiveGameMonitor {
  private activeGames: Map<string, LiveGameData> = new Map()
  private playerUpdates: Map<string, PlayerGameUpdate> = new Map()
  private gameScripts: Map<string, GameScriptAnalysis> = new Map()
  private projectionAdjustments: Map<string, LiveProjectionUpdate> = new Map()
  private monitoringInterval: NodeJS.Timeout | null = null
  private websocketConnections: Set<any> = new Set()

  constructor() {
    this.startGameMonitoring()
    this.initializeDataSources()
  }

  // Start monitoring live games
  async startLiveMonitoring(week: number): Promise<{
    gamesMonitored: number
    playersTracked: number
    monitoringActive: boolean
  }> {
    logger.info('Starting live game monitoring', { week })

    try {
      // Get active games for the week
      const { data: games } = await neonDb.query(`
        SELECT * FROM nfl_schedule 
        WHERE week = $1 AND game_status IN ('active', 'scheduled')
        ORDER BY game_time ASC
      `, [week])

      if (!games || games.length === 0) {
        logger.info('No active games found for monitoring', { week })
        return { gamesMonitored: 0, playersTracked: 0, monitoringActive: false }
      }

      // Initialize monitoring for each game
      let playersTracked = 0
      for (const game of games) {
        await this.initializeGameMonitoring(game)
        
        // Count players in this game
        const { data: gamePlayers } = await neonDb.query(`
          SELECT COUNT(DISTINCT p.id) as player_count
          FROM players p 
          WHERE p.nfl_team IN ($1, $2) AND p.active = true
        `, [game.home_team, game.away_team])
        
        playersTracked += gamePlayers?.[0]?.player_count || 0
      }

      // Start real-time monitoring
      this.startRealTimeUpdates()

      logger.info('Live monitoring started successfully', {
        week,
        gamesMonitored: games.length,
        playersTracked
      })

      return {
        gamesMonitored: games.length,
        playersTracked,
        monitoringActive: true
      }

    } catch (error) {
      logger.error('Failed to start live monitoring', error as Error, { week })
      throw error
    }
  }

  // Get current live data for a specific game
  async getLiveGameData(gameId: string): Promise<{
    gameData: LiveGameData
    keyPlayers: Array<{
      playerId: string
      playerName: string
      position: string
      currentPoints: number
      projectedFinal: number
      trend: 'up' | 'down' | 'stable'
    }>
    gameScript: GameScriptAnalysis
    significantEvents: Array<{
      time: string
      event: string
      playersAffected: string[]
      fantasyImpact: 'positive' | 'negative' | 'neutral'
    }>
  }> {
    logger.info('Getting live game data', { gameId })

    try {
      const gameData = this.activeGames.get(gameId)
      if (!gameData) {
        throw new Error(`Game ${gameId} not found in monitoring`)
      }

      // Get key fantasy players in this game
      const keyPlayers = await this.getKeyGamePlayers(gameId)
      
      // Get current game script analysis
      const gameScript = this.gameScripts.get(gameId) || await this.analyzeGameScript(gameId)
      
      // Get recent significant events
      const significantEvents = await this.getRecentSignificantEvents(gameId)

      return {
        gameData,
        keyPlayers,
        gameScript,
        significantEvents
      }

    } catch (error) {
      logger.error('Failed to get live game data', error as Error, { gameId })
      throw error
    }
  }

  // Monitor specific player during live games
  async monitorPlayer(playerId: string): Promise<{
    currentStatus: PlayerGameUpdate
    liveProjection: LiveProjectionUpdate
    keyMetrics: {
      snapShare: number
      targetShare: number
      redZoneOpportunities: number
      gameScriptFavorability: number
    }
    alerts: Array<{
      type: 'opportunity' | 'concern' | 'injury' | 'benching'
      message: string
      impact: number
    }>
  }> {
    logger.info('Monitoring individual player', { playerId })

    try {
      // Get current player update
      const currentStatus = this.playerUpdates.get(playerId)
      if (!currentStatus) {
        throw new Error(`Player ${playerId} not found in live monitoring`)
      }

      // Get live projection update
      const liveProjection = this.projectionAdjustments.get(playerId) || 
        await this.calculateLiveProjection(playerId)

      // Calculate key metrics
      const keyMetrics = await this.calculatePlayerMetrics(playerId, currentStatus)
      
      // Check for alerts
      const alerts = await this.checkPlayerAlerts(playerId, currentStatus, liveProjection)

      return {
        currentStatus,
        liveProjection,
        keyMetrics,
        alerts
      }

    } catch (error) {
      logger.error('Failed to monitor player', error as Error, { playerId })
      throw error
    }
  }

  // Get real-time scoring adjustments for all players
  async getRealTimeScoringAdjustments(week: number): Promise<{
    totalAdjustments: number
    significantChanges: Array<{
      playerId: string
      playerName: string
      originalProjection: number
      adjustedProjection: number
      change: number
      reasons: string[]
    }>
    gameScriptImpacts: Array<{
      gameId: string
      impact: string
      playersAffected: number
    }>
  }> {
    logger.info('Getting real-time scoring adjustments', { week })

    try {
      const significantChanges = []
      const gameScriptImpacts = []
      let totalAdjustments = 0

      // Process all active projection adjustments
      for (const [playerId, adjustment] of this.projectionAdjustments.entries()) {
        totalAdjustments++
        
        if (Math.abs(adjustment.adjustment) >= 2.0) { // Significant change threshold
          const { data: player } = await neonDb.selectSingle('players', {
            where: { id: playerId }
          })

          significantChanges.push({
            playerId,
            playerName: player?.name || 'Unknown',
            originalProjection: adjustment.originalProjection,
            adjustedProjection: adjustment.liveProjection,
            change: adjustment.adjustment,
            reasons: adjustment.adjustmentReasons.map(r => r.factor)
          })
        }
      }

      // Analyze game script impacts
      for (const [gameId, gameScript] of this.gameScripts.entries()) {
        const gameData = this.activeGames.get(gameId)
        if (gameData && gameScript.gameScript !== 'neutral') {
          const playersInGame = await this.getPlayersInGame(gameId)
          gameScriptImpacts.push({
            gameId,
            impact: `${gameScript.gameScript} game script (${gameScript.scoreDifferential} point differential)`,
            playersAffected: playersInGame.length
          })
        }
      }

      return {
        totalAdjustments,
        significantChanges: significantChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
        gameScriptImpacts
      }

    } catch (error) {
      logger.error('Failed to get scoring adjustments', error as Error)
      throw error
    }
  }

  // Broadcast live updates to connected clients
  broadcastLiveUpdate(updateType: string, data: any): void {
    const update = {
      type: updateType,
      timestamp: new Date().toISOString(),
      data
    }

    // Send to all connected WebSocket clients
    this.websocketConnections.forEach(connection => {
      try {
        connection.send(JSON.stringify(update))
      } catch (error) {
        logger.warn('Failed to send update to client', { error: (error as Error).message })
        this.websocketConnections.delete(connection)
      }
    })

    // Cache the update for new connections
    MemoryCache.set(`live_update_${updateType}`, update, 60) // 1 minute cache
  }

  // Private helper methods

  private async initializeGameMonitoring(game: any): Promise<void> {
    const gameData: LiveGameData = {
      gameId: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      week: game.week,
      quarter: 1,
      timeRemaining: '15:00',
      homeScore: 0,
      awayScore: 0,
      possession: game.home_team,
      down: 1,
      distance: 10,
      yardLine: 25,
      gameStatus: game.game_status,
      lastUpdate: new Date().toISOString()
    }

    this.activeGames.set(game.id, gameData)
    
    // Initialize game script analysis
    const gameScript: GameScriptAnalysis = {
      gameId: game.id,
      gameScript: 'neutral',
      passingGameScript: 0,
      timeRemaining: 60, // 60 minutes
      scoreDifferential: 0,
      playCallTendencies: {
        passRate: 0.6,
        runRate: 0.4,
        redZonePassRate: 0.65
      },
      garbageTime: false,
      urgencyFactor: 0
    }

    this.gameScripts.set(game.id, gameScript)
  }

  private startGameMonitoring(): void {
    // Monitor games every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.updateAllGames()
    }, 30000)
  }

  private async updateAllGames(): Promise<void> {
    for (const gameId of this.activeGames.keys()) {
      try {
        await this.updateGameData(gameId)
        await this.updateGameScript(gameId)
        await this.updatePlayerProjections(gameId)
      } catch (error) {
        logger.warn('Failed to update game', { gameId, error: (error as Error).message })
      }
    }
  }

  private async updateGameData(gameId: string): Promise<void> {
    const gameData = this.activeGames.get(gameId)
    if (!gameData) return

    // Simulate live data update (would integrate with real API)
    const updatedData: Partial<LiveGameData> = {
      quarter: Math.min(4, gameData.quarter),
      timeRemaining: this.calculateTimeRemaining(gameData),
      homeScore: gameData.homeScore + (Math.random() < 0.1 ? Math.floor(Math.random() * 7) + 1 : 0),
      awayScore: gameData.awayScore + (Math.random() < 0.1 ? Math.floor(Math.random() * 7) + 1 : 0),
      lastUpdate: new Date().toISOString()
    }

    Object.assign(gameData, updatedData)
    this.activeGames.set(gameId, gameData)

    // Broadcast update
    this.broadcastLiveUpdate('game_update', { gameId, ...updatedData })
  }

  private async updateGameScript(gameId: string): Promise<void> {
    const gameData = this.activeGames.get(gameId)
    const gameScript = this.gameScripts.get(gameId)
    if (!gameData || !gameScript) return

    const scoreDifferential = gameData.homeScore - gameData.awayScore
    const timeRemainingMinutes = this.parseTimeRemaining(gameData.timeRemaining, gameData.quarter)

    // Update game script analysis
    gameScript.scoreDifferential = Math.abs(scoreDifferential)
    gameScript.timeRemaining = timeRemainingMinutes
    gameScript.urgencyFactor = this.calculateUrgencyFactor(scoreDifferential, timeRemainingMinutes)
    gameScript.garbageTime = this.isGarbageTime(scoreDifferential, timeRemainingMinutes)

    // Determine overall game script
    if (Math.abs(scoreDifferential) >= 21 && timeRemainingMinutes < 20) {
      gameScript.gameScript = 'blowout'
      gameScript.passingGameScript = scoreDifferential < 0 ? 0.8 : -0.6
    } else if (Math.abs(scoreDifferential) >= 10) {
      gameScript.gameScript = scoreDifferential < 0 ? 'negative' : 'positive'
      gameScript.passingGameScript = scoreDifferential < 0 ? 0.4 : -0.3
    } else {
      gameScript.gameScript = 'neutral'
      gameScript.passingGameScript = 0
    }

    this.gameScripts.set(gameId, gameScript)

    // Broadcast game script update
    this.broadcastLiveUpdate('game_script_update', { gameId, gameScript })
  }

  private async updatePlayerProjections(gameId: string): Promise<void> {
    const gameData = this.activeGames.get(gameId)
    const gameScript = this.gameScripts.get(gameId)
    if (!gameData || !gameScript) return

    // Get all players in this game
    const playersInGame = await this.getPlayersInGame(gameId)

    for (const playerId of playersInGame) {
      await this.updatePlayerProjection(playerId, gameData, gameScript)
    }
  }

  private async updatePlayerProjection(
    playerId: string,
    gameData: LiveGameData,
    gameScript: GameScriptAnalysis
  ): Promise<void> {
    try {
      const currentUpdate = this.playerUpdates.get(playerId)
      const existingProjection = this.projectionAdjustments.get(playerId)

      // Get player info
      const { data: player } = await neonDb.selectSingle('players', {
        where: { id: playerId }
      })

      if (!player) return

      // Calculate projection adjustment based on current game state
      const adjustment = await this.calculateProjectionAdjustment(player, gameData, gameScript, currentUpdate)

      if (Math.abs(adjustment.adjustment) >= 0.5) { // Threshold for updates
        this.projectionAdjustments.set(playerId, adjustment)
        
        // Broadcast significant projection changes
        if (Math.abs(adjustment.adjustment) >= 2.0) {
          this.broadcastLiveUpdate('projection_change', {
            playerId,
            playerName: player.name,
            adjustment: adjustment.adjustment,
            newProjection: adjustment.liveProjection,
            reasons: adjustment.adjustmentReasons.map(r => r.factor)
          })
        }
      }

    } catch (error) {
      logger.warn('Failed to update player projection', { playerId, error: (error as Error).message })
    }
  }

  private async calculateProjectionAdjustment(
    player: any,
    gameData: LiveGameData,
    gameScript: GameScriptAnalysis,
    currentStats?: PlayerGameUpdate
  ): Promise<LiveProjectionUpdate> {
    const originalProjection = currentStats?.projectedFinalPoints || 12 // Default projection
    let adjustment = 0
    const adjustmentReasons = []

    // Game script adjustments
    if (gameScript.gameScript !== 'neutral') {
      let gameScriptAdjustment = 0
      
      if (player.position === 'QB') {
        gameScriptAdjustment = gameScript.passingGameScript * 3 // Up to ±3 points
      } else if (player.position === 'RB') {
        gameScriptAdjustment = -gameScript.passingGameScript * 2 // Opposite of passing
      } else if (['WR', 'TE'].includes(player.position)) {
        gameScriptAdjustment = gameScript.passingGameScript * 2
      }

      if (Math.abs(gameScriptAdjustment) > 0.5) {
        adjustment += gameScriptAdjustment
        adjustmentReasons.push({
          factor: `${gameScript.gameScript} game script`,
          impact: gameScriptAdjustment,
          confidence: 0.8
        })
      }
    }

    // Time remaining adjustments
    const timeMultiplier = gameScript.timeRemaining / 60 // Normalize to full game
    if (timeMultiplier < 0.5 && !gameScript.garbageTime) {
      const timeAdjustment = (0.5 - timeMultiplier) * -2 // Reduce projection as time runs out
      adjustment += timeAdjustment
      adjustmentReasons.push({
        factor: 'Limited time remaining',
        impact: timeAdjustment,
        confidence: 0.9
      })
    }

    // Garbage time adjustments
    if (gameScript.garbageTime) {
      let garbageTimeAdjustment = 0
      if (['WR', 'TE'].includes(player.position)) {
        garbageTimeAdjustment = 1.5 // Benefit from garbage time
      } else if (player.position === 'RB') {
        garbageTimeAdjustment = -1.0 // Less likely to run in garbage time
      }

      if (Math.abs(garbageTimeAdjustment) > 0) {
        adjustment += garbageTimeAdjustment
        adjustmentReasons.push({
          factor: 'Garbage time scenario',
          impact: garbageTimeAdjustment,
          confidence: 0.7
        })
      }
    }

    const liveProjection = originalProjection + adjustment

    return {
      playerId: player.id,
      originalProjection,
      liveProjection: Math.max(0, liveProjection),
      adjustment,
      adjustmentReasons,
      confidenceLevel: adjustmentReasons.reduce((sum, r) => sum + r.confidence, 0) / Math.max(adjustmentReasons.length, 1),
      remainingUpside: Math.max(0, liveProjection * 1.5 - (currentStats?.fantasyPoints || 0)),
      timestamp: new Date().toISOString()
    }
  }

  private async getKeyGamePlayers(gameId: string): Promise<Array<{
    playerId: string
    playerName: string
    position: string
    currentPoints: number
    projectedFinal: number
    trend: 'up' | 'down' | 'stable'
  }>> {
    const playersInGame = await this.getPlayersInGame(gameId)
    const keyPlayers = []

    for (const playerId of playersInGame.slice(0, 20)) { // Top 20 players
      const playerUpdate = this.playerUpdates.get(playerId)
      const projection = this.projectionAdjustments.get(playerId)
      
      if (playerUpdate) {
        const { data: player } = await neonDb.selectSingle('players', {
          where: { id: playerId }
        })

        keyPlayers.push({
          playerId,
          playerName: player?.name || 'Unknown',
          position: player?.position || 'UNKNOWN',
          currentPoints: playerUpdate.fantasyPoints,
          projectedFinal: projection?.liveProjection || playerUpdate.projectedFinalPoints,
          trend: this.calculateTrend(projection?.adjustment || 0)
        })
      }
    }

    return keyPlayers.sort((a, b) => b.projectedFinal - a.projectedFinal)
  }

  private async getPlayersInGame(gameId: string): Promise<string[]> {
    const gameData = this.activeGames.get(gameId)
    if (!gameData) return []

    const { data: players } = await neonDb.query(`
      SELECT id FROM players 
      WHERE nfl_team IN ($1, $2) AND active = true
    `, [gameData.homeTeam, gameData.awayTeam])

    return players?.map((p: any) => p.id) || []
  }

  private calculateTrend(adjustment: number): 'up' | 'down' | 'stable' {
    if (adjustment > 1) return 'up'
    if (adjustment < -1) return 'down'
    return 'stable'
  }

  private calculateTimeRemaining(gameData: LiveGameData): string {
    // Simulate time progression
    const currentMinutes = parseInt(gameData.timeRemaining.split(':')[0])
    const currentSeconds = parseInt(gameData.timeRemaining.split(':')[1])
    
    let newMinutes = currentMinutes
    let newSeconds = Math.max(0, currentSeconds - 30)
    
    if (newSeconds === 0 && newMinutes > 0) {
      newMinutes -= 1
      newSeconds = 59
    }

    return `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`
  }

  private parseTimeRemaining(timeRemaining: string, quarter: number): number {
    const [minutes, seconds] = timeRemaining.split(':').map(Number)
    const quarterMinutes = minutes + (seconds / 60)
    const remainingQuarters = Math.max(0, 4 - quarter)
    return quarterMinutes + (remainingQuarters * 15)
  }

  private calculateUrgencyFactor(scoreDifferential: number, timeRemaining: number): number {
    if (timeRemaining < 5 && Math.abs(scoreDifferential) < 7) return 1.0
    if (timeRemaining < 10 && Math.abs(scoreDifferential) < 14) return 0.8
    if (timeRemaining < 20 && Math.abs(scoreDifferential) < 21) return 0.6
    return Math.max(0, (60 - timeRemaining) / 60 * 0.4)
  }

  private isGarbageTime(scoreDifferential: number, timeRemaining: number): boolean {
    return Math.abs(scoreDifferential) >= 21 && timeRemaining < 15
  }

  private startRealTimeUpdates(): void {
    // Start WebSocket server or connect to existing one
    logger.info('Starting real-time update broadcasting')
  }

  private initializeDataSources(): void {
    // Initialize connections to live data feeds
    logger.info('Initializing live data sources')
  }

  private async analyzeGameScript(gameId: string): Promise<GameScriptAnalysis> {
    // Placeholder - would analyze current game script
    return {
      gameId,
      gameScript: 'neutral',
      passingGameScript: 0,
      timeRemaining: 60,
      scoreDifferential: 0,
      playCallTendencies: { passRate: 0.6, runRate: 0.4, redZonePassRate: 0.65 },
      garbageTime: false,
      urgencyFactor: 0
    }
  }

  private async getRecentSignificantEvents(gameId: string): Promise<any[]> {
    return [] // Placeholder
  }

  private async calculateLiveProjection(playerId: string): Promise<LiveProjectionUpdate> {
    return {
      playerId,
      originalProjection: 12,
      liveProjection: 12,
      adjustment: 0,
      adjustmentReasons: [],
      confidenceLevel: 0.7,
      remainingUpside: 6,
      timestamp: new Date().toISOString()
    }
  }

  private async calculatePlayerMetrics(playerId: string, status: PlayerGameUpdate): Promise<any> {
    return {
      snapShare: status.snapsPlayed / 70 * 100, // Assuming 70 snaps per game
      targetShare: status.targetShare * 100,
      redZoneOpportunities: status.redZoneTargets,
      gameScriptFavorability: 0.5
    }
  }

  private async checkPlayerAlerts(playerId: string, status: PlayerGameUpdate, projection: LiveProjectionUpdate): Promise<any[]> {
    const alerts = []

    if (projection.adjustment > 2) {
      alerts.push({
        type: 'opportunity',
        message: 'Live projection increased significantly due to game script',
        impact: projection.adjustment
      })
    }

    if (status.snapsPlayed < 10 && status.lastUpdate) {
      alerts.push({
        type: 'concern',
        message: 'Low snap count may indicate injury or benching',
        impact: -2
      })
    }

    return alerts
  }

  // Cleanup method
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.activeGames.clear()
    this.playerUpdates.clear()
    this.gameScripts.clear()
    this.projectionAdjustments.clear()
    logger.info('Live game monitoring stopped')
  }
}

const liveMonitor = new LiveGameMonitor()
export default liveMonitor