import { neonServerless } from '@/lib/neon-serverless'
import type { Tables, TablesInsert, TablesUpdate, Database } from '@/types/database'

type Trade = Database['public']['Tables']['trades']['Row']
type TradeInsert = Database['public']['Tables']['trades']['Insert']
// type TradeParticipant = Database['public']['Tables']['trade_participants']['Row']
// type TradeItem = Database['public']['Tables']['trade_items']['Row']

export interface CreateTradeData {
  initiatorTeamId: string
  receiverTeamId: string
  offeredPlayers: string[]
  requestedPlayers: string[]
  message?: string
}

export interface TradeProposal {
  id: string
  initiatorTeam: {
    id: string
    name: string
    user: string
  }
  receiverTeam: {
    id: string
    name: string
    user: string
  }
  offeredPlayers: Array<{
    id: string
    name: string
    position: string
    team: string
  }>
  requestedPlayers: Array<{
    id: string
    name: string
    position: string
    team: string
  }>
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  message?: string
  createdAt: string
  expiresAt: string
}

export interface TradeAnalysis {
  fairnessScore: number
  initiatorAdvantage: number
  receiverAdvantage: number
  positionBalance: {
    initiator: Record<string, number>
    receiver: Record<string, number>
  }
  valueComparison: {
    offered: number
    requested: number
    difference: number
  }
  recommendation: 'accept' | 'reject' | 'consider'
  reasoning: string[]
}

class TradeService {
  async createTrade(leagueId: string, data: CreateTradeData): Promise<{ success: boolean; tradeId?: string; error?: string }> {
    try {
      // Validate teams are in the same league
      const teamsResult = await neonServerless.select('teams', {
        where: { in: { id: [data.initiatorTeamId, data.receiverTeamId] } }
      })
      if (teamsResult.error) throw new Error(teamsResult.error)
      const teams = teamsResult.data

      if (!teams || teams.length !== 2 || !teams.every((team: any) => team.league_id === leagueId)) {
        return { success: false, error: 'Invalid teams for trade' }
      }

      // Validate player ownership
      const ownershipResult = await neonServerless.select('rosters', {
        where: { in: { player_id: [...data.offeredPlayers, ...data.requestedPlayers] } }
      })
      if (ownershipResult.error) throw new Error(ownershipResult.error)
      const playerOwnerships = ownershipResult.data

      // Verify offered players belong to initiator
      const offeredOwnership = (playerOwnerships || []).filter((p: any) => data.offeredPlayers.includes(p.player_id))
      if (!offeredOwnership || !offeredOwnership.every((p: any) => p.team_id === data.initiatorTeamId)) {
        return { success: false, error: 'You can only trade players you own' }
      }

      // Verify requested players belong to receiver
      const requestedOwnership = (playerOwnerships || []).filter((p: any) => data.requestedPlayers.includes(p.player_id))
      if (!requestedOwnership || !requestedOwnership.every((p: any) => p.team_id === data.receiverTeamId)) {
        return { success: false, error: 'Requested players must belong to the other team' }
      }

      // Create trade proposal
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiration

      const tradeInsert: TradeInsert = {
        proposing_team_id: data.initiatorTeamId,
        receiving_team_id: data.receiverTeamId,
        proposed_players: data.offeredPlayers as any,
        requested_players: data.requestedPlayers as any,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      }

      const tradeResult = await neonServerless.insert('trades', tradeInsert)
      if (tradeResult.error || !tradeResult.data) throw new Error(tradeResult.error || 'Failed to create trade')
      const trade = tradeResult.data

      // Add trade items
      const tradeItems = [
        ...data.offeredPlayers.map(playerId => ({
          trade_id: trade.id,
          player_id: playerId,
          from_team_id: data.initiatorTeamId,
          to_team_id: data.receiverTeamId,
        })),
        ...data.requestedPlayers.map(playerId => ({
          trade_id: trade.id,
          player_id: playerId,
          from_team_id: data.receiverTeamId,
          to_team_id: data.initiatorTeamId,
        }))
      ]

      const itemsResult = await neonServerless.insert('trade_items', tradeItems)
      if (itemsResult.error) throw new Error(itemsResult.error)

      return { success: true, tradeId: trade.id }
    } catch (error) {
      console.error('Error creating trade:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create trade' 
      }
    }
  }

  async getTeamTrades(teamId: string): Promise<{ trades: TradeProposal[]; error?: string }> {
    try {
      // Simplified query - get basic trade data first
      const tradesResult = await neonServerless.select('trades', {
        where: { 
          or: [
            { eq: { proposing_team_id: teamId } },
            { eq: { receiving_team_id: teamId } }
          ]
        },
        order: { column: 'created_at', ascending: false }
      })
      if (tradesResult.error) throw new Error(tradesResult.error)
      const trades = tradesResult.data

      const formattedTrades: TradeProposal[] = (trades || []).map((trade: any) => ({
        id: trade.id,
        initiatorTeam: {
          id: (trade.initiator_team as any).id,
          name: (trade.initiator_team as any).team_name,
          user: (trade.initiator_team as any).users.username,
        },
        receiverTeam: {
          id: (trade.receiver_team as any).id,
          name: (trade.receiver_team as any).team_name,
          user: (trade.receiver_team as any).users.username,
        },
        offeredPlayers: trade.trade_items
          .filter((item: any) => item.from_team_id === (trade.initiator_team as any).id)
          .map((item: any) => ({
            id: (item.players as any).id,
            name: (item.players as any).name,
            position: (item.players as any).position,
            team: (item.players as any).team,
          })),
        requestedPlayers: trade.trade_items
          .filter((item: any) => item.from_team_id === (trade.receiver_team as any).id)
          .map((item: any) => ({
            id: (item.players as any).id,
            name: (item.players as any).name,
            position: (item.players as any).position,
            team: (item.players as any).team,
          })),
        status: trade.status as any,
        message: trade.message || undefined,
        createdAt: trade.created_at,
        expiresAt: trade.expires_at,
      }))

      return { trades: formattedTrades }
    } catch (error) {
      console.error('Error fetching trades:', error)
      return { 
        trades: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch trades' 
      }
    }
  }

  async respondToTrade(tradeId: string, response: 'accepted' | 'rejected'): Promise<{ success: boolean; error?: string }> {
    try {
      if (response === 'accepted') {
        // Execute the trade
        const success = await this.executeTrade(tradeId)
        if (!success) {
          return { success: false, error: 'Failed to execute trade' }
        }
      }

      // Update trade status
      const updateResult = await neonServerless.update('trades', 
        { 
          status: response,
          processed_at: new Date().toISOString(),
        },
        { eq: { id: tradeId } }
      )
      if (updateResult.error) throw new Error(updateResult.error)

      return { success: true }
    } catch (error) {
      console.error('Error responding to trade:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to respond to trade' 
      }
    }
  }

  private async executeTrade(tradeId: string): Promise<boolean> {
    try {
      // Get trade items
      const itemsResult = await neonServerless.select('trade_items', {
        where: { eq: { trade_id: tradeId } }
      })
      if (itemsResult.error || !itemsResult.data) return false
      const tradeItems = itemsResult.data

      // Update roster_players for each trade item
      for (const item of tradeItems) {
        const updateResult = await neonServerless.update('rosters',
          { team_id: item.to_team_id },
          { player_id: item.player_id, team_id: item.from_team_id }
        )
        if (updateResult.error) {
          console.error('Error updating roster player:', updateResult.error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error executing trade:', error)
      return false
    }
  }

  async analyzeTrade(
    offeredPlayers: string[], 
    requestedPlayers: string[]
  ): Promise<{ analysis: TradeAnalysis; error?: string }> {
    try {
      // Get player data (simplified - no joins for now)
      const playersResult = await neonServerless.select('players', {
        where: { in: { id: [...offeredPlayers, ...requestedPlayers] } }
      })
      if (playersResult.error) throw new Error(playersResult.error)
      const players = playersResult.data

      const offeredData = (players || []).filter((p: any) => offeredPlayers.includes(p.id))
      const requestedData = (players || []).filter((p: any) => requestedPlayers.includes(p.id))

      // Calculate values (simplified - using default values)
      const offeredValue = offeredData.reduce((sum: number, player: any) => {
        // Use default fantasy point values based on position
        const defaultPoints = player.position === 'QB' ? 18 : player.position === 'RB' ? 12 : player.position === 'WR' ? 10 : 8
        return sum + defaultPoints
      }, 0)

      const requestedValue = requestedData.reduce((sum: number, player: any) => {
        const defaultPoints = player.position === 'QB' ? 18 : player.position === 'RB' ? 12 : player.position === 'WR' ? 10 : 8
        return sum + defaultPoints
      }, 0)

      const valueDifference = requestedValue - offeredValue
      const fairnessScore = Math.max(0, 100 - Math.abs(valueDifference) * 2)

      // Position balance analysis
      const getPositionCounts = (playerList: any[]) => {
        return playerList.reduce((acc, player) => {
          acc[player.position] = (acc[player.position] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      const analysis: TradeAnalysis = {
        fairnessScore,
        initiatorAdvantage: Math.max(0, valueDifference),
        receiverAdvantage: Math.max(0, -valueDifference),
        positionBalance: {
          initiator: getPositionCounts(requestedData),
          receiver: getPositionCounts(offeredData),
        },
        valueComparison: {
          offered: offeredValue,
          requested: requestedValue,
          difference: valueDifference,
        },
        recommendation: fairnessScore >= 70 ? 'accept' : fairnessScore >= 40 ? 'consider' : 'reject',
        reasoning: this.generateTradeReasoning(fairnessScore, valueDifference, offeredData, requestedData),
      }

      return { analysis }
    } catch (error) {
      console.error('Error analyzing trade:', error)
      return {
        analysis: {
          fairnessScore: 50,
          initiatorAdvantage: 0,
          receiverAdvantage: 0,
          positionBalance: { initiator: {}, receiver: {} },
          valueComparison: { offered: 0, requested: 0, difference: 0 },
          recommendation: 'consider',
          reasoning: ['Unable to analyze trade due to data error'],
        },
        error: error instanceof Error ? error.message : 'Failed to analyze trade'
      }
    }
  }

  private generateTradeReasoning(
    fairnessScore: number, 
    valueDifference: number, 
    offeredData: any[], 
    requestedData: any[]
  ): string[] {
    const reasoning: string[] = []

    if (fairnessScore >= 80) {
      reasoning.push('This is a very fair trade with balanced value on both sides.')
    } else if (fairnessScore >= 60) {
      reasoning.push('This trade shows reasonable value balance.')
    } else if (fairnessScore >= 40) {
      reasoning.push('This trade has some value imbalance that should be considered.')
    } else {
      reasoning.push('This trade shows significant value imbalance.')
    }

    if (Math.abs(valueDifference) > 20) {
      const favored = valueDifference > 0 ? 'receiver' : 'initiator'
      reasoning.push(`The ${favored} appears to gain significantly more value in this trade.`)
    }

    if (offeredData.length !== requestedData.length) {
      const morePlayer = offeredData.length > requestedData.length ? 'offering' : 'receiving'
      reasoning.push(`Consider that one side is ${morePlayer} more players, which affects roster depth.`)
    }

    return reasoning
  }

  async cancelTrade(tradeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateResult = await neonServerless.update('trades',
        { status: 'cancelled' },
        { eq: { id: tradeId } }
      )
      if (updateResult.error) throw new Error(updateResult.error)

      return { success: true }
    } catch (error) {
      console.error('Error cancelling trade:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel trade' 
      }
    }
  }
}

const tradeService = new TradeService()
export default tradeService