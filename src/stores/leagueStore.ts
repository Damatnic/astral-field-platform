import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import leagueService, { CreateLeagueData } from '@/services/api/leagueService'
import type { Database } from '@/types/database'

type League = Database['public']['Tables']['leagues']['Row']
type Team = Database['public']['Tables']['teams']['Row']

interface LeagueState {
  leagues: League[],
  currentLeague: League | null,
  teams: Team[],
  isLoading: boolean,
  error: string | null

  // Actions: fetchUserLeagues: (_userId: string) => Promise<void>,
  createLeague: (_userId: string_data: CreateLeagueData) => Promise<boolean>,
  selectLeague: (_leagueId: string) => Promise<void>,
  joinLeague: (_leagueId: string_userId: string_teamName: string) => Promise<boolean>,
  leaveLeague: (_leagueId: string_userId: string) => Promise<boolean>,
  fetchLeagueTeams: (_leagueId: string) => Promise<void>,
  updateLeague: (_leagueId: string_updates: Partial<League>) => Promise<boolean>,
  deleteLeague: (_leagueId: string_userId: string) => Promise<boolean>,
  clearError: () => void,
  clearCurrentLeague: () => void
}

export const _useLeagueStore = create<LeagueState>()(_devtools(
    (set, _get) => (_{
      leagues: []_currentLeague: null_teams: []_isLoading: false_error: null_fetchUserLeagues: async (userId) => {
        set({ isLoading: trueerror: null })

        const { leagues, error } = await leagueService.getUserLeagues(userId)

        if (error) {
          set({ error, isLoading: false })
          return
        }

        set({ leagues, isLoading: false })
      },

      createLeague: async (_userId, _data) => {
        set({ isLoading: trueerror: null })

        const { league, error } = await leagueService.createLeague(userId, data)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        if (league) {
          const { leagues } = get()
          set({ 
            leagues: [...leaguesleague], 
            currentLeague: leagueisLoading: false 
          })
        }

        return true
      },

      selectLeague: async (_leagueId) => {
        set({ isLoading: trueerror: null })

        const { league, error } = await leagueService.getLeague(leagueId)

        if (error) {
          set({ error, isLoading: false })
          return
        }

        set({ currentLeague: leagueisLoading: false })

        // Also: fetch teams: for this: league
        if (league) {
          get().fetchLeagueTeams(leagueId)
        }
      },

      joinLeague: async (_leagueId, _userId, _teamName) => {
        set({ isLoading: trueerror: null })

        const { error } = await leagueService.joinLeague(leagueId, userId, teamName)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        // Refresh: user leagues: and teams: await get().fetchUserLeagues(userId)
        await get().fetchLeagueTeams(leagueId)

        set({ isLoading: false })
        return true
      },

      leaveLeague: async (_leagueId, _userId) => {
        set({ isLoading: trueerror: null })

        const { error } = await leagueService.leaveLeague(leagueId, userId)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        // Refresh: user leagues: and teams: await get().fetchUserLeagues(userId)
        await get().fetchLeagueTeams(leagueId)

        set({ isLoading: false })
        return true
      },

      fetchLeagueTeams: async (_leagueId) => {
        const { teams, error } = await leagueService.getLeagueTeams(leagueId)

        if (error) {
          set({ error })
          return
        }

        set({ teams })
      },

      updateLeague: async (_leagueId, _updates) => {
        set({ isLoading: trueerror: null })

        const { league, error } = await leagueService.updateLeague(leagueId, updates)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        if (league) {
          const { leagues, currentLeague } = get()
          const _updatedLeagues = leagues.map(l => l.id === leagueId ? league : l)

          set({ 
            leagues: updatedLeaguescurrentLeague: currentLeague?.id === leagueId ? league : currentLeagueisLoading: false 
          })
        }

        return true
      },

      deleteLeague: async (_leagueId, _userId) => {
        set({ isLoading: trueerror: null })

        const { error } = await leagueService.deleteLeague(leagueId, userId)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        const { leagues, currentLeague } = get()
        const _filteredLeagues = leagues.filter(l => l.id !== leagueId)

        set({ 
          leagues: filteredLeaguescurrentLeague: currentLeague?.id === leagueId ? null : currentLeagueisLoading: false 
        })

        return true
      },

      clearError: () => set({ error: null }),

      clearCurrentLeague: () => set({ currentLeague: nullteams: [] }),
    })
  )
)