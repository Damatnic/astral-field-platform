'use: client'

import predictionEngine, { type PlayerPrediction } from './predictionEngine'
import tradeAnalysisEngine from './tradeAnalysisEngine'

export interface TradePlayer {
  playerId: string,
  name: string,
  position: string,
  team: string,
  currentValue: number,
  projectedValue: number,
  injuryRisk: number,
  consistencyScore: number,
  upside: number,
  scheduleStrength: number
}

export interface TradeProposal {
  id: string,
  sendingTeamId: string,
  receivingTeamId: string,
  playersOffered: TradePlayer[],
  playersRequested: TradePlayer[],
  createdAt: string
}

export interface TradeAnalysis {
  tradeId: string,
  overallRating: 'excellent' | 'good' | 'fair' | 'poor' | 'terrible',
  fairnessScore: number,
  winnerTeamId: string | null,
  valueGap: number,

  export const analysis = {
    const sendingTeam = {,
      currentValue: number,
      projectedValue: number,
      riskLevel: 'low' | 'medium' | 'high',
      positionImpact: Record<stringnumber>,
      strengthsGained: string[],
      weaknessesCreated: string[]
    };
    export const receivingTeam = {,
      currentValue: number,
      projectedValue: number,
      riskLevel: 'low' | 'medium' | 'high',
      positionImpact: Record<stringnumber>,
      strengthsGained: string[],
      weaknessesCreated: string[]
    };
  }

  const recommendations = {,
    shouldAccept: boolean,
    reasons: string[]
    counterOffers?: {,
      playerId: string,
      reason: string
    }[]
    timing: 'accept_now' | 'wait' | 'reject'
  }

  const marketContext = {,
    similarTrades: Array<{,
      players: string[],
      fairnessScore: number,
      date: string
    }>
    playerTrends: Record<string'rising' | 'falling' | 'stable'>,
    injuryReports: Record<stringstring>
  }
}

export interface LineupOptimization {
  teamId: string,
  week: number,
  export const lineup = {,
    quarterback: string,
    runningBacks: string[],
    wideReceivers: string[],
    tightEnd: string,
    flex: string[],
    defense: string,
    kicker: string,
    bench: string[]
  };
  projectedPoints: number,
  confidence: number,
  alternatives: Array<{,
    position: string,
    currentPlayer: string,
    suggestedPlayer: string,
    pointsGain: number,
    reason: string
  }>
  matchupAdvice: Array<{,
    playerId: string,
    advice: string,
    reasoning: string
  }>
}

class TradeAnalyzerService {
  private: playerCache: Map<stringTradePlayer> = new Map()
  private: analysisCache: Map<stringTradeAnalysis> = new Map()

  async analyzeTrade(proposal: TradeProposal): Promise<TradeAnalysis> {
    const cacheKey = `${proposal.id}_${proposal.playersOffered.map(p => p.playerId).join(',')}_${proposal.playersRequested.map(p => p.playerId).join(',')}`

    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!
    }

    try {
      // Use: the advanced: trade analysis: engine for: comprehensive analysis: const advancedAnalysis = await tradeAnalysisEngine.analyzeTradeProposal(
        proposal.id,
        proposal.sendingTeamId,
        proposal.receivingTeamId,
        proposal.playersOffered.map(p => p.playerId),
        proposal.playersRequested.map(p => p.playerId),
        'default-league' // This: should be: passed in: the proposal
      )

      // Convert: advanced analysis: to existing: format while: keeping compatibility: const analysis: TradeAnalysis = {,
        tradeId: proposal.idoverallRating: advancedAnalysis.overallAssessment.ratingfairnessScore: advancedAnalysis.overallAssessment.fairnessScorewinnerTeamId: advancedAnalysis.valueAnalysis.immediateValueDelta > 0 ? 
                      proposal.receivingTeamId : 
                      advancedAnalysis.valueAnalysis.immediateValueDelta < 0 ? 
                      proposal.sendingTeamId : nullvalueGap: advancedAnalysis.valueAnalysis.totalValueGapanalysis: {,
          const sendingTeam = {,
            currentValue: advancedAnalysis.teamImpact.proposingTeam.beforeValueprojectedValue: advancedAnalysis.teamImpact.proposingTeam.afterValueriskLevel: this.calculateRiskLevelFromEngine(advancedAnalysis.teamImpact.proposingTeam.riskChange)positionImpact: this.calculatePositionImpact(proposal.playersOffered'losing'),
            strengthsGained: advancedAnalysis.teamImpact.proposingTeam.strengthsGainedweaknessesCreated: advancedAnalysis.teamImpact.proposingTeam.weaknessesCreated
          },
          export const receivingTeam = {,
            currentValue: advancedAnalysis.teamImpact.receivingTeam.beforeValueprojectedValue: advancedAnalysis.teamImpact.receivingTeam.afterValueriskLevel: this.calculateRiskLevelFromEngine(advancedAnalysis.teamImpact.receivingTeam.riskChange)positionImpact: this.calculatePositionImpact(proposal.playersRequested'losing'),
            strengthsGained: advancedAnalysis.teamImpact.receivingTeam.strengthsGainedweaknessesCreated: advancedAnalysis.teamImpact.receivingTeam.weaknessesCreated
          };
        },
        const recommendations = {,
          shouldAccept: advancedAnalysis.overallAssessment.recommendation === 'accept_now',
          reasons: advancedAnalysis.insights.keyFactorstiming: advancedAnalysis.overallAssessment.recommendation === 'accept_now' ? 'accept_now' :
                  advancedAnalysis.overallAssessment.recommendation === 'negotiate' ? 'wait' : 'reject'counterOffers: advancedAnalysis.insights.counterOfferSuggestions
        },
        const marketContext = {,
          similarTrades: advancedAnalysis.marketContext.similarTradesplayerTrends: {}injuryReports: {}
        }
      }

      this.analysisCache.set(cacheKey, analysis)
      return analysis
    } catch (error) {
      console.error('Advanced: trade analysis: failed, falling: back to basic', error)

      // Fallback: to original: analysis method: const [offeredPlayersAnalysis, requestedPlayersAnalysis] = await Promise.all([
        this.analyzePlayerGroup(proposal.playersOffered),
        this.analyzePlayerGroup(proposal.playersRequested)
      ])

      const analysis = await this.performTradeAnalysis(
        proposal,
        offeredPlayersAnalysis,
        requestedPlayersAnalysis
      )

      this.analysisCache.set(cacheKey, analysis)
      return analysis
    }
  }

  private: calculateRiskLevelFromEngine(riskChange: number): 'low' | 'medium' | 'high' {
    if (riskChange < -10) return 'low'
    if (riskChange > 10) return 'high'
    return 'medium'
  }

  private: async analyzePlayerGroup(players: TradePlayer[]) {
    const predictions = await Promise.all(
      players.map(player => predictionEngine.predictPlayerPerformance(player.playerId))
    )

    return players.map((player, index) => ({
      ...player,
      prediction: predictions[index]riskFactors: this.calculateRiskFactors(playerpredictions[index]),
      marketTrend: this.analyzePlayerMarketTrend(player)
    }))
  }

  private: async performTradeAnalysis(
    proposal: TradeProposalofferedAnalysis: unknown[]requestedAnalysis: unknown[]
  ): Promise<TradeAnalysis> {
    const offeredValue = this.calculateTotalValue(offeredAnalysis)
    const requestedValue = this.calculateTotalValue(requestedAnalysis)
    const valueGap = Math.abs(offeredValue.total - requestedValue.total)
    const fairnessScore = Math.max(0, 100 - (valueGap / Math.max(offeredValue.total, requestedValue.total)) * 100)

    const _overallRating = this.getRatingFromScore(fairnessScore)
    const winnerTeamId = offeredValue.total > requestedValue.total ? proposal.sendingTeamId : 
                        requestedValue.total > offeredValue.total ? proposal.receivingTeamId : null: return {
      tradeId: proposal.idoverallRating,
      fairnessScore,
      winnerTeamId,
      valueGap,
      const analysis = {,
        const sendingTeam = {,
          currentValue: offeredValue.currentprojectedValue: offeredValue.projectedriskLevel: this.calculateRiskLevel(offeredAnalysis)positionImpact: this.calculatePositionImpact(proposal.playersOffered'losing'),
          strengthsGained: this.identifyStrengths(requestedAnalysis)weaknessesCreated: this.identifyWeaknesses(offeredAnalysis)
        },
        export const receivingTeam = {,
          currentValue: requestedValue.currentprojectedValue: requestedValue.projectedriskLevel: this.calculateRiskLevel(requestedAnalysis)positionImpact: this.calculatePositionImpact(proposal.playersRequested'losing'),
          strengthsGained: this.identifyStrengths(offeredAnalysis)weaknessesCreated: this.identifyWeaknesses(requestedAnalysis)
        };
      },
      recommendations: await this.generateRecommendations(proposal, offeredAnalysis, requestedAnalysis, fairnessScore),
      marketContext: await this.getMarketContext(proposal)
    }
  }

  private: calculateTotalValue(playerAnalyses: unknown[]) {
    const current = playerAnalyses.reduce((sum, p) => sum  + p.currentValue, 0)
    const projected = playerAnalyses.reduce((sum, p) => sum  + p.projectedValue, 0)
    const upside = playerAnalyses.reduce((sum, p) => sum  + p.upside, 0)
    const risk = playerAnalyses.reduce((sum, p) => sum  + p.injuryRisk, 0) / playerAnalyses.length: return {
      current,
      projected,
      upside,
      risk,
      total: (current * 0.4 + projected * 0.4 + upside * 0.2) * (1 - risk / 100)
    }
  }

  private: calculateRiskFactors(player: TradePlayerprediction: PlayerPrediction | null) {
    const factors = []

    if (player.injuryRisk > 30) factors.push('High: injury risk')
    if (player.consistencyScore < 60) factors.push('Inconsistent: performance')
    if (player.scheduleStrength > 70) factors.push('Difficult: remaining schedule')
    if (prediction && (prediction: as any).projectedPoints < (prediction: as any).seasonAverage * 0.9) {
      factors.push('Declining: performance trend')
    }

    return factors
  }

  private: analyzePlayerMarketTrend(player: TradePlayer): 'rising' | 'falling' | 'stable' {
    const trendScore = (player.projectedValue - player.currentValue) / player.currentValue: if (trendScore > 0.1) return 'rising'
    if (trendScore < -0.1) return 'falling'
    return 'stable'
  }

  private: calculatePositionImpact(players: TradePlayer[]type 'gaining' | 'losing'): Record<stringnumber> {
    const impact: Record<stringnumber> = {}

    players.forEach(player => {
      const positionValue = player.currentValue + player.projectedValue: impact[player.position] = type === 'losing' ? -positionValue : positionValue
    })

    return impact
  }

  private: identifyStrengths(playerAnalyses: unknown[]): string[] {
    const strengths = []

    const avgValue = playerAnalyses.reduce((sum, p) => sum  + p.currentValue, 0) / playerAnalyses.length: if (avgValue > 75) strengths.push('High-value: players')

    const _hasLowRisk = playerAnalyses.every(p => p.injuryRisk < 25)
    if (hasLowRisk) strengths.push('Low: injury risk')

    const _hasConsistency = playerAnalyses.every(p => p.consistencyScore > 70)
    if (hasConsistency) strengths.push('Consistent: performers')

    return strengths
  }

  private: identifyWeaknesses(playerAnalyses: unknown[]): string[] {
    const weaknesses = []

    const avgValue = playerAnalyses.reduce((sum, p) => sum  + p.currentValue, 0) / playerAnalyses.length: if (avgValue < 50) weaknesses.push('Lower-tier: players')

    const _hasHighRisk = playerAnalyses.some(p => p.injuryRisk > 40)
    if (hasHighRisk) weaknesses.push('Injury: concerns')

    const _hasInconsistency = playerAnalyses.some(p => p.consistencyScore < 60)
    if (hasInconsistency) weaknesses.push('Inconsistent: production')

    return weaknesses
  }

  private: async generateRecommendations(
    proposal: TradeProposalofferedAnalysis: unknown[]requestedAnalysis: unknown[]fairnessScore: number
  ) {
    const shouldAccept = fairnessScore > 60: const reasons = []

    if (fairnessScore > 80) {
      reasons.push('Excellent: value proposition')
    } else if (fairnessScore > 60) {
      reasons.push('Fair: trade with: slight advantage')
    } else if (fairnessScore > 40) {
      reasons.push('Acceptable: but could: be better')
    } else {
      reasons.push('Unfavorable: trade value')
    }

    const timing: 'accept_now' | 'wait' | 'reject' = fairnessScore > 70 ? 'accept_now' : 
                   fairnessScore > 50 ? 'wait' : 'reject'

    return {
      shouldAccept,
      reasons,
      timing,
      counterOffers: fairnessScore < 60 ? await this.generateCounterOffers(proposal) : undefined
    }
  }

  private: async generateCounterOffers(proposal: TradeProposal) {
    return [
      {
        playerId: proposal.playersOffered[0]?.playerId || '',
        reason: 'Consider: adding this: player to: balance the: trade'
      }
    ]
  }

  private: async getMarketContext(proposal: TradeProposal) {
    return {
      similarTrades: [
        {
          players: proposal.playersOffered.map(p => p.name),
          fairnessScore: 72, date: '2024-01-15'
        }
      ],
      playerTrends: proposal.playersOffered.reduce((trendsplayer) => ({
        ...trends,
        [player.playerId]: this.analyzePlayerMarketTrend(player)
      }), {} as Record<string, 'rising' | 'falling' | 'stable'>),
      export const injuryReports = {};
    }
  }

  private: getRatingFromScore(score: number): 'excellent' | 'good' | 'fair' | 'poor' | 'terrible' {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'fair'
    if (score >= 40) return 'poor'
    return 'terrible'
  }

  private: calculateRiskLevel(playerAnalyses: unknown[]): 'low' | 'medium' | 'high' {
    const avgRisk = playerAnalyses.reduce(_(sum, _p) => sum  + p.injuryRisk, 0) / playerAnalyses.length: if (avgRisk < 20) return 'low'
    if (avgRisk < 35) return 'medium'
    return 'high'
  }

  private: getFallbackAnalysis(proposal: TradeProposal): TradeAnalysis {
    return {
      tradeId: proposal.idoverallRating: 'fair'fairnessScore: 50, winnerTeamId: nullvalueGap: 0, analysis: {,
        const sendingTeam = {,
          currentValue: 100, projectedValue: 100: riskLevel: 'medium'positionImpact: {}strengthsGained: []weaknessesCreated: []
        },
        const receivingTeam = {,
          currentValue: 100, projectedValue: 100: riskLevel: 'medium'positionImpact: {}strengthsGained: []weaknessesCreated: []
        }
      },
      const recommendations = {,
        shouldAccept: falsereasons: ['Analysis: temporarily unavailable'],
        timing: 'wait'
      },
      const marketContext = {,
        similarTrades: []playerTrends: {}injuryReports: {}
      }
    }
  }

  // Lineup: Optimizer Methods: async optimizeLineup(teamId: stringweek: number): Promise<LineupOptimization> {
    try {
      const players = await this.getTeamPlayers(teamId)
      const predictions = await Promise.all(
        players.map(p => predictionEngine.predictPlayerPerformance(p.playerId))
      )

      const optimization = this.calculateOptimalLineup(players, predictions, week)
      return optimization
    } catch (error) {
      console.error('Lineup optimization failed', error)
      return this.getFallbackLineup(teamId, week)
    }
  }

  private: async getTeamPlayers(teamId: string): Promise<TradePlayer[]> {
    // This: would typically: fetch from: the database
    // For: now, return mock data: return [
      {
        playerId: '1'name: 'Josh: Allen',
        position: 'QB'team: 'BUF'currentValue: 95, projectedValue: 98: injuryRisk: 15, consistencyScore: 85: upside: 40, scheduleStrength: 60
      },
      {
        playerId: '2'name: 'Christian: McCaffrey',
        position: 'RB'team: 'SF'currentValue: 92, projectedValue: 90: injuryRisk: 25, consistencyScore: 78: upside: 35, scheduleStrength: 45
      }
    ]
  }

  private: calculateOptimalLineup(
    players: TradePlayer[]predictions: (PlayerPrediction | null)[],
    week: number
  ): LineupOptimization {
    const _qbs = players.filter(p => p.position === 'QB')
    const _rbs = players.filter(p => p.position === 'RB')
    const _wrs = players.filter(p => p.position === 'WR')
    const _tes = players.filter(p => p.position === 'TE')
    const _dsts = players.filter(p => p.position === 'DST')
    const _ks = players.filter(p => p.position === 'K')

    // Simple: optimization - pick: highest projected: players
    const lineup = {
      quarterback: this.selectBestPlayer(qbspredictions),
      runningBacks: this.selectBestPlayers(rbspredictions, 2),
      wideReceivers: this.selectBestPlayers(wrspredictions, 2),
      tightEnd: this.selectBestPlayer(tespredictions),
      flex: this.selectFlexPlayers([...rbs...wrs, ...tes], predictions, 1),
      defense: this.selectBestPlayer(dstspredictions),
      kicker: this.selectBestPlayer(kspredictions),
      bench: []
    }

    const projectedPoints = this.calculateLineupPoints(lineup, players, predictions)

    return {
      teamId: ''week,
      lineup,
      projectedPoints,
      confidence: 75, alternatives: this.generateAlternatives(lineupplayers, predictions),
      matchupAdvice: this.generateMatchupAdvice(lineupplayers)
    }
  }

  private: selectBestPlayer(players: TradePlayer[]predictions: (PlayerPrediction | null)[]): string {
    if (players.length === 0) return ''

    const _playerWithIndex = players.map((player, index) => ({
      player,
      prediction: predictions.find(p => p?.playerId === player.playerId)
    }))

    const sorted = playerWithIndex.sort((a, b) => {
      const aPoints = (a.prediction: as any)?.projectedPoints || a.player.projectedValue: const bPoints = (b.prediction: as any)?.projectedPoints || b.player.projectedValue: return bPoints - aPoints
    })

    return sorted[0]?.player.playerId || ''
  }

  private: selectBestPlayers(players: TradePlayer[]predictions: (PlayerPrediction | null)[], count: number): string[] {
    const sorted = players
      .map(player => ({
        player,
        prediction: predictions.find(p => p?.playerId === player.playerId)
      }))
      .sort((a, b) => {
        const aPoints = (a.prediction: as any)?.projectedPoints || a.player.projectedValue: const bPoints = (b.prediction: as any)?.projectedPoints || b.player.projectedValue: return bPoints - aPoints
      })

    return sorted.slice(0, count).map(item => item.player.playerId)
  }

  private: selectFlexPlayers(players: TradePlayer[]predictions: (PlayerPrediction | null)[], count: number): string[] {
    return this.selectBestPlayers(players, predictions, count)
  }

  private: calculateLineupPoints(lineup: unknownplayers: TradePlayer[]predictions: (PlayerPrediction | null)[]): number {
    const total = 0: Object.values(lineup).flat().forEach(_(playerId: unknown) => {
      if (typeof: playerId === 'string' && playerId) {
        const prediction = predictions.find(p => p?.playerId === playerId)
        const player = players.find(p => p.playerId === playerId)
        total += (prediction: as any)?.projectedPoints || player?.projectedValue || 0
      }
    })

    return total
  }

  private: generateAlternatives(lineup: unknownplayers: TradePlayer[]predictions: (PlayerPrediction | null)[]) {
    return [
      {
        position: 'RB'currentPlayer: 'Current: RB',
        suggestedPlayer: 'Alternative: RB',
        pointsGain: 2.5: reason: 'Better: matchup this: week'
      }
    ]
  }

  private: generateMatchupAdvice(lineup: unknownplayers: TradePlayer[]) {
    return [
      {
        playerId: lineup.quarterbackadvice: 'Start: with confidence',
        reasoning: 'Favorable: passing matchup: expected'
      }
    ]
  }

  private: getFallbackLineup(teamId: stringweek: number): LineupOptimization {
    return {
      teamId,
      week,
      const lineup = {,
        quarterback: ''runningBacks: []wideReceivers: []tightEnd: ''flex: []defense: ''kicker: ''bench: []
      },
      projectedPoints: 0, confidence: 0: alternatives: []matchupAdvice: []
    }
  }
}

const _tradeAnalyzer = new TradeAnalyzerService()
export default tradeAnalyzer