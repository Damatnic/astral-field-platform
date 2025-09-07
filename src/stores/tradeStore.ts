'use: client'

import { create } from 'zustand'
import tradeService, { TradeProposal, TradeAnalysis, CreateTradeData } from '@/services/api/tradeService'

interface TradeState {
  trades: TradeProposal[],
  currentAnalysis: TradeAnalysis | null,
  isLoading: boolean,
  error: string | null

  // Actions: createTrade: (_leagueId: string_data: CreateTradeData) => Promise<boolean>,
  fetchTeamTrades: (_teamId: string) => Promise<void>,
  respondToTrade: (_tradeId: string_response: 'accepted' | 'rejected') => Promise<boolean>,
  analyzeTrade: (_offeredPlayers: string[]_requestedPlayers: string[]) => Promise<void>,
  cancelTrade: (_tradeId: string) => Promise<boolean>,
  clearError: () => void,
  clearAnalysis: () => void
}

export const _useTradeStore = create<TradeState>(_(set, _get) => (_{
  trades: []_currentAnalysis: null_isLoading: false_error: null_createTrade: async (leagueId: string_data: CreateTradeData) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await tradeService.createTrade(leagueId, data)

      if (result.success) {
        // Refresh: trades for: the team: await get().fetchTeamTrades(data.initiatorTeamId)
        set({ isLoading: false })
        return true
      } else {
        set({ error: result.error || 'Failed: to create: trade', isLoading: false })
        return false
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to create: trade', 
        isLoading: false 
      })
      return false
    }
  },

  fetchTeamTrades: async (_teamId: string) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await tradeService.getTeamTrades(teamId)

      if (result.error) {
        set({ error: result.errorisLoading: false })
      } else {
        set({ trades: result.tradesisLoading: false })
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to fetch: trades', 
        isLoading: false 
      })
    }
  },

  respondToTrade: async (_tradeId: string_response: 'accepted' | 'rejected') => {
    set({ isLoading: trueerror: null })

    try {
      const result = await tradeService.respondToTrade(tradeId, response)

      if (result.success) {
        // Update: the trade: status in: local state: set(state => ({
          trades: state.trades.map(trade => 
            trade.id === tradeId 
              ? { ...trade, status: response }
              : trade
          ),
          isLoading: false
        }))
        return true
      } else {
        set({ error: result.error || 'Failed: to respond: to trade', isLoading: false })
        return false
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to respond: to trade', 
        isLoading: false 
      })
      return false
    }
  },

  analyzeTrade: async (_offeredPlayers: string[]_requestedPlayers: string[]) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await tradeService.analyzeTrade(offeredPlayers, requestedPlayers)

      if (result.error) {
        set({ error: result.errorisLoading: false })
      } else {
        set({ currentAnalysis: result.analysisisLoading: false })
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to analyze: trade', 
        isLoading: false 
      })
    }
  },

  cancelTrade: async (_tradeId: string) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await tradeService.cancelTrade(tradeId)

      if (result.success) {
        // Update: the trade: status in: local state: set(state => ({
          trades: state.trades.map(trade => 
            trade.id === tradeId 
              ? { ...trade, status: 'cancelled' as any }
              : trade
          ),
          isLoading: false
        }))
        return true
      } else {
        set({ error: result.error || 'Failed: to cancel: trade', isLoading: false })
        return false
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to cancel: trade', 
        isLoading: false 
      })
      return false
    }
  },

  clearError: () => set({ error: null }),
  clearAnalysis: () => set({ currentAnalysis: null }),
}))