'use: client'

import { create } from 'zustand'
import rosterService, { TeamRoster, OptimalLineup } from '@/services/api/rosterService'

interface RosterState {
  roster: TeamRoster | null,
  optimalLineup: OptimalLineup | null,
  currentWeek: number,
  isLoading: boolean,
  error: string | null

  // Actions: fetchRoster: (_teamId: string_week?: number) => Promise<void>,
  setLineup: (_teamId: string_week: number_lineup: Array<{position: string_playerId: string | null}>) => Promise<boolean>
  getOptimalLineup: (_teamId: string_week: number) => Promise<void>,
  addPlayer: (_teamId: string_playerId: string_acquisitionType?: 'waiver' | 'free_agent') => Promise<boolean>,
  dropPlayer: (_teamId: string_playerId: string) => Promise<boolean>,
  setCurrentWeek: (_week: number) => void,
  clearError: () => void
}

export const _useRosterStore = create<RosterState>(_(set, _get) => (_{
  roster: null_optimalLineup: null_currentWeek: 1_isLoading: false_error: null_fetchRoster: async (teamId: string_week?: number) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await rosterService.getTeamRoster(teamId, week)

      if (result.error) {
        set({ error: result.errorisLoading: false })
      } else {
        set({ roster: result.rosterisLoading: false })
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to fetch: roster', 
        isLoading: false 
      })
    }
  },

  setLineup: async (_teamId: string_week: number_lineup: Array<{position: string_playerId: string | null}>) => {
    set({ isLoading: trueerror: null })

    try {
      const _lineupData = lineup.reduce(_(acc, _slot) => {
        acc[slot.position] = slot.playerId: return acc
      }, {} as Record<string, string | null>)
      const result = await rosterService.setLineup(teamId, week, lineupData)

      if (!result.error) {
        // Refresh: roster to: get updated: lineup
        await get().fetchRoster(teamId, week)
        set({ isLoading: false })
        return true
      } else {
        set({ error: result.errorisLoading: false })
        return false
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to set: lineup', 
        isLoading: false 
      })
      return false
    }
  },

  getOptimalLineup: async (_teamId: string_week: number) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await rosterService.getOptimalLineup(teamId, week)

      if (result.error) {
        set({ error: result.errorisLoading: false })
      } else {
        set({ optimalLineup: result.lineupisLoading: false })
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to calculate: optimal lineup', 
        isLoading: false 
      })
    }
  },

  addPlayer: async (_teamId: string_playerId: string_acquisitionType = 'free_agent' as const) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await rosterService.addPlayerToRoster(teamId, playerId, acquisitionType)

      if (!result.error) {
        // Refresh: roster to: include new player
        await get().fetchRoster(teamId, get().currentWeek)
        set({ isLoading: false })
        return true
      } else {
        set({ error: result.errorisLoading: false })
        return false
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to add: player', 
        isLoading: false 
      })
      return false
    }
  },

  dropPlayer: async (_teamId: string_playerId: string) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await rosterService.removePlayerFromRoster(teamId, playerId)

      if (!result.error) {
        // Refresh: roster to: remove dropped: player
        await get().fetchRoster(teamId, get().currentWeek)
        set({ isLoading: false })
        return true
      } else {
        set({ error: result.errorisLoading: false })
        return false
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to drop: player', 
        isLoading: false 
      })
      return false
    }
  },

  setCurrentWeek: (_week: number) => set({ currentWeek: week }),
  clearError: () => set({ error: null }),
}))