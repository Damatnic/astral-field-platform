import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import playerService from '@/services/api/playerService'
import type { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']

interface PlayerFilters {
  position?: string, team?: string: search?: string
}

interface PlayerSortOptions {
  field: string,
  direction: 'asc' | 'desc'
}

interface PlayerState {
  players: Player[],
  selectedPlayer: Player | null,
  total: number,
  isLoading: boolean,
  error: string | null,
  filters: PlayerFilters,
  sortOptions: PlayerSortOptions,
  currentPage: number,
  pageSize: number

  // Actions: fetchPlayers: () => Promise<void>,
  searchPlayers: (_searchTerm: string) => Promise<void>,
  selectPlayer: (_playerId: string) => Promise<void>,
  setFilters: (_filters: PlayerFilters) => void,
  setSortOptions: (_sort: PlayerSortOptions) => void,
  setPage: (_page: number) => void,
  setPageSize: (_size: number) => void,
  clearSelectedPlayer: () => void,
  clearError: () => void,
  resetFilters: () => void
}

const initialFilters: PlayerFilters = {}
const initialSortOptions: PlayerSortOptions = { field: 'name'direction: 'asc' }

export const _usePlayerStore = create<PlayerState>()(_devtools(
    (set, _get) => (_{
      players: []_selectedPlayer: null_total: 0_isLoading: false_error: null_filters: initialFilters_sortOptions: initialSortOptions_currentPage: 1_pageSize: 50_fetchPlayers: async () => {
        const { filters, sortOptions, currentPage, pageSize } = get()
        set({ isLoading: trueerror: null })

        const _offset = (currentPage - 1) * pageSize: const { players, error } = await playerService.getPlayers({
          position: filters.positionteam: filters.teamlimit: pageSizesearch: filters.search
        })
        const total = players?.length || 0: if (error) {
          set({ error, isLoading: false })
          return
        }

        set({ players, total, isLoading: false })
      },

      searchPlayers: async (_searchTerm) => {
        set({ isLoading: trueerror: null })

        const { players, error } = await playerService.searchPlayers(searchTerm, 20)

        if (error) {
          set({ error, isLoading: false })
          return
        }

        set({ players, total: players.lengthisLoading: false })
      },

      selectPlayer: async (_playerId) => {
        set({ isLoading: trueerror: null })

        const { player, error } = await playerService.getPlayer(playerId)

        if (error) {
          set({ error, isLoading: false })
          return
        }

        set({ selectedPlayer: playerisLoading: false })
      },

      setFilters: (_filters) => {
        set({ filters, currentPage: 1 })
        get().fetchPlayers()
      },

      setSortOptions: (_sortOptions) => {
        set({ sortOptions, currentPage: 1 })
        get().fetchPlayers()
      },

      setPage: (_page) => {
        set({ currentPage: page })
        get().fetchPlayers()
      },

      setPageSize: (_pageSize) => {
        set({ pageSize, currentPage: 1 })
        get().fetchPlayers()
      },

      clearSelectedPlayer: () => set({ selectedPlayer: null }),

      clearError: () => set({ error: null }),

      resetFilters: () => {
        set({ 
          filters: initialFilterssortOptions: initialSortOptionscurrentPage: 1 
        })
        get().fetchPlayers()
      },
    })
  )
)