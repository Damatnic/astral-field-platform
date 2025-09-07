import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import draftService, { DraftState, DraftPickWithDetails, DraftBoardPlayer, DraftRecommendation, DraftSettings } from '@/services/api/draftService'

interface DraftStore {
  // State
  draftState: DraftState | null
  draftPicks: DraftPickWithDetails[]
  availablePlayers: DraftBoardPlayer[]
  recommendations: DraftRecommendation[]
  selectedPlayer: DraftBoardPlayer | null
  isLoading: boolean
  error: string | null
  
  // WebSocket state
  isConnected: boolean
  connectionError: string | null
  
  // UI state
  activeTab: 'board' | 'recommendations' | 'picks' | 'teams'
  searchTerm: string
  positionFilter: string | null
  
  // Actions
  createDraft: (leagueId: string, settings: DraftSettings) => Promise<boolean>
  loadDraftState: (leagueId: string) => Promise<void>
  startDraft: (leagueId: string) => Promise<boolean>
  pauseDraft: (leagueId: string) => Promise<boolean>
  resumeDraft: (leagueId: string) => Promise<boolean>
  makePick: (leagueId: string, teamId: string, playerId: string) => Promise<boolean>
  loadDraftPicks: (leagueId: string) => Promise<void>
  loadAvailablePlayers: (leagueId: string) => Promise<void>
  loadRecommendations: (leagueId: string, teamId: string) => Promise<void>
  selectPlayer: (player: DraftBoardPlayer | null) => void
  setActiveTab: (tab: 'board' | 'recommendations' | 'picks' | 'teams') => void
  setSearchTerm: (term: string) => void
  setPositionFilter: (position: string | null) => void
  clearError: () => void
  
  // WebSocket actions
  connect: (leagueId: string) => void
  disconnect: () => void
}

export const useDraftStore = create<DraftStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      draftState: null,
      draftPicks: [],
      availablePlayers: [],
      recommendations: [],
      selectedPlayer: null,
      isLoading: false,
      error: null,
      
      // WebSocket state
      isConnected: false,
      connectionError: null,
      
      // UI state
      activeTab: 'board',
      searchTerm: '',
      positionFilter: null,

      createDraft: async (leagueId, settings) => {
        set({ isLoading: true, error: null })
        
        const { draftId, error } = await draftService.createDraft(leagueId, settings)
        
        if (error) {
          set({ error, isLoading: false })
          return false
        }
        
        // Load the newly created draft
        await get().loadDraftState(leagueId)
        
        set({ isLoading: false })
        return true
      },

      loadDraftState: async (leagueId) => {
        set({ isLoading: true, error: null })
        
        const { draft, error } = await draftService.getDraftState(leagueId)
        
        if (error) {
          set({ error, isLoading: false })
          return
        }
        
        set({ draftState: draft, isLoading: false })
        
        // Load related data if draft exists
        if (draft) {
          await Promise.all([
            get().loadDraftPicks(leagueId),
            get().loadAvailablePlayers(leagueId)
          ])
        }
      },

      startDraft: async (leagueId) => {
        set({ isLoading: true, error: null })
        
        const { error } = await draftService.startDraft(leagueId)
        
        if (error) {
          set({ error, isLoading: false })
          return false
        }
        
        // Reload draft state
        await get().loadDraftState(leagueId)
        
        set({ isLoading: false })
        return true
      },

      pauseDraft: async (leagueId) => {
        set({ isLoading: true, error: null })
        
        const { error } = await draftService.pauseDraft(leagueId)
        
        if (error) {
          set({ error, isLoading: false })
          return false
        }
        
        await get().loadDraftState(leagueId)
        
        set({ isLoading: false })
        return true
      },

      resumeDraft: async (leagueId) => {
        set({ isLoading: true, error: null })
        
        const { error } = await draftService.resumeDraft(leagueId)
        
        if (error) {
          set({ error, isLoading: false })
          return false
        }
        
        await get().loadDraftState(leagueId)
        
        set({ isLoading: false })
        return true
      },

      makePick: async (leagueId, teamId, playerId) => {
        set({ isLoading: true, error: null })
        
        const { pick, error } = await draftService.makeDraftPick(leagueId, teamId, playerId)
        
        if (error) {
          set({ error, isLoading: false })
          return false
        }
        
        // Reload draft data
        await Promise.all([
          get().loadDraftState(leagueId),
          get().loadDraftPicks(leagueId),
          get().loadAvailablePlayers(leagueId)
        ])
        
        // Clear selected player
        set({ selectedPlayer: null, isLoading: false })
        return true
      },

      loadDraftPicks: async (leagueId) => {
        const { picks, error } = await draftService.getDraftPicks(leagueId)
        
        if (error) {
          set({ error })
          return
        }
        
        set({ draftPicks: picks })
      },

      loadAvailablePlayers: async (leagueId) => {
        const { players, error } = await draftService.getAvailablePlayers(leagueId)
        
        if (error) {
          set({ error })
          return
        }
        
        set({ availablePlayers: players })
      },

      loadRecommendations: async (leagueId, teamId) => {
        const { draftState } = get()
        if (!draftState) return
        
        const { recommendations, error } = await draftService.getDraftRecommendations(
          leagueId, 
          teamId, 
          draftState.currentRound
        )
        
        if (error) {
          set({ error })
          return
        }
        
        set({ recommendations })
      },

      selectPlayer: (player) => {
        set({ selectedPlayer: player })
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab })
      },

      setSearchTerm: (term) => {
        set({ searchTerm: term })
      },

      setPositionFilter: (position) => {
        set({ positionFilter: position })
      },

      clearError: () => {
        set({ error: null })
      },

      // WebSocket functions - real-time draft synchronization
      connect: (leagueId) => {
        try {
          // Import the socket service for real-time updates
          import('@/services/websocket/socketService').then(({ default: socketService }) => {
            socketService.connect().then(() => {
              // Subscribe to league-specific draft events
              socketService.subscribeToLeague(leagueId);
              
              // Set up draft-specific event handlers
              socketService.on('draft_pick', (event) => {
                if (event.leagueId === leagueId) {
                  // Refresh draft data when someone makes a pick
                  Promise.all([
                    get().loadDraftState(leagueId),
                    get().loadDraftPicks(leagueId),
                    get().loadAvailablePlayers(leagueId)
                  ]);
                }
              });
              
              socketService.on('draft_state_change', (event) => {
                if (event.leagueId === leagueId) {
                  get().loadDraftState(leagueId);
                }
              });
              
              set({ 
                isConnected: true, 
                connectionError: null 
              });
              
              console.log(`Connected to draft room: ${leagueId}`);
            }).catch((error) => {
              console.error('Failed to connect to draft room:', error);
              set({ 
                isConnected: false, 
                connectionError: error.message || 'Connection failed' 
              });
            });
          });
        } catch (error) {
          console.error('Error connecting to draft room:', error);
          set({ 
            isConnected: false, 
            connectionError: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      },

      disconnect: () => {
        try {
          import('@/services/websocket/socketService').then(({ default: socketService }) => {
            // Remove event listeners
            socketService.off('draft_pick', () => {});
            socketService.off('draft_state_change', () => {});
            
            // Disconnect from socket service
            socketService.disconnect();
            
            set({ 
              isConnected: false, 
              connectionError: null 
            });
            
            console.log('Disconnected from draft room');
          });
        } catch (error) {
          console.error('Error disconnecting from draft room:', error);
          set({ 
            isConnected: false, 
            connectionError: error instanceof Error ? error.message : 'Disconnect error' 
          });
        }
      }
    })
  )
)