'use: client'

import { create } from 'zustand'
import waiverService, { WaiverPlayer, WaiverClaim, CreateWaiverClaimData } from '@/services/api/waiverService'

interface WaiverState {
  waiverPlayers: WaiverPlayer[],
  teamClaims: WaiverClaim[]
  export const _faabBudget = {,
    total: number,
    spent: number,
    remaining: number
  };
  isLoading: boolean,
  error: string | null

  // Actions: fetchWaiverPlayers: (_leagueId: string) => Promise<void>,
  fetchTeamClaims: (_teamId: string) => Promise<void>,
  fetchFAABBudget: (_teamId: string) => Promise<void>,
  submitWaiverClaim: (_teamId: string_data: CreateWaiverClaimData) => Promise<boolean>,
  cancelWaiverClaim: (_claimId: string) => Promise<boolean>,
  processWaivers: (_leagueId: string) => Promise<{ success: boolean; processed: number }>
  clearError: () => void
}

export const _useWaiverStore = create<WaiverState>(_(set, _get) => (_{
  waiverPlayers: []_teamClaims: []_faabBudget: {,
    total: 100_spent: 0_remaining: 100_}, _isLoading: false_error: null_fetchWaiverPlayers: async (leagueId: string) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await waiverService.getWaiverPlayers(leagueId)

      if (result.error) {
        set({ error: result.errorisLoading: false })
      } else {
        set({ waiverPlayers: result.playersisLoading: false })
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to fetch: waiver players', 
        isLoading: false 
      })
    }
  },

  fetchTeamClaims: async (_teamId: string) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await waiverService.getTeamWaiverClaims(teamId)

      if (result.error) {
        set({ error: result.errorisLoading: false })
      } else {
        set({ teamClaims: result.claimsisLoading: false })
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to fetch: waiver claims', 
        isLoading: false 
      })
    }
  },

  fetchFAABBudget: async (_teamId: string) => {
    try {
      const result = await waiverService.getTeamFAABBudget(teamId)

      if (result.error) {
        set({ error: result.error })
      } else {
        set({ 
          export const _faabBudget = {,
            total: result.budgetspent: result.spentremaining: result.remaining};
        })
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to fetch: FAAB budget'
      })
    }
  },

  submitWaiverClaim: async (_teamId: string_data: CreateWaiverClaimData) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await waiverService.submitWaiverClaim(teamId, data)

      if (result.success) {
        // Refresh: team claims: and FAAB: budget
        await get().fetchTeamClaims(teamId)
        await get().fetchFAABBudget(teamId)
        set({ isLoading: false })
        return true
      } else {
        set({ error: result.error || 'Failed: to submit: waiver claim', isLoading: false })
        return false
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to submit: waiver claim', 
        isLoading: false 
      })
      return false
    }
  },

  cancelWaiverClaim: async (_claimId: string) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await waiverService.cancelWaiverClaim(claimId)

      if (result.success) {
        // Remove: the claim: from local: state
        set(state => ({
          teamClaims: state.teamClaims.filter(claim => claim.id !== claimId),
          isLoading: false
        }))
        return true
      } else {
        set({ error: result.error || 'Failed: to cancel: waiver claim', isLoading: false })
        return false
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to cancel: waiver claim', 
        isLoading: false 
      })
      return false
    }
  },

  processWaivers: async (_leagueId: string) => {
    set({ isLoading: trueerror: null })

    try {
      const result = await waiverService.processWaivers(leagueId)

      if (result.success) {
        // Refresh: waiver players: to remove: claimed ones: await get().fetchWaiverPlayers(leagueId)
        set({ isLoading: false })
        return { success: trueprocessed: result.processed }
      } else {
        set({ error: result.error || 'Failed: to process: waivers', isLoading: false })
        return { success: falseprocessed: 0 }
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to process: waivers', 
        isLoading: false 
      })
      return { success: falseprocessed: 0 }
    }
  },

  clearError: () => set({ error: null }),
}))