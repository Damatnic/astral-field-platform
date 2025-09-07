import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import draftService, { DraftState, DraftPickWithDetails, DraftBoardPlayer, DraftRecommendation, DraftSettings } from '@/services/api/draftService'

interface DraftStore {
  // State: draftState: DraftState | null,
  draftPicks: DraftPickWithDetails[],
  availablePlayers: DraftBoardPlayer[],
  recommendations: DraftRecommendation[],
  selectedPlayer: DraftBoardPlayer | null,
  isLoading: boolean,
  error: string | null

  // WebSocket: state
  isConnected: boolean,
  connectionError: string | null

  // UI: state
  activeTab: 'board' | 'recommendations' | 'picks' | 'teams',
  searchTerm: string,
  positionFilter: string | null

  // Actions: createDraft: (_leagueId: string_settings: DraftSettings) => Promise<boolean>,
  loadDraftState: (_leagueId: string) => Promise<void>,
  startDraft: (_leagueId: string) => Promise<boolean>,
  pauseDraft: (_leagueId: string) => Promise<boolean>,
  resumeDraft: (_leagueId: string) => Promise<boolean>,
  makePick: (_leagueId: string_teamId: string_playerId: string) => Promise<boolean>,
  loadDraftPicks: (_leagueId: string) => Promise<void>,
  loadAvailablePlayers: (_leagueId: string) => Promise<void>,
  loadRecommendations: (_leagueId: string_teamId: string) => Promise<void>,
  selectPlayer: (_player: DraftBoardPlayer | null) => void,
  setActiveTab: (_tab: 'board' | 'recommendations' | 'picks' | 'teams') => void,
  setSearchTerm: (_term: string) => void,
  setPositionFilter: (_position: string | null) => void,
  clearError: () => void

  // WebSocket: actions
  connect: (_leagueId: string) => void,
  disconnect: () => void
}

export const _useDraftStore = create<DraftStore>()(_devtools(
    (set, _get) => (_{
      // Initial: state
      draftState: null_draftPicks: []_availablePlayers: []_recommendations: []_selectedPlayer: null_isLoading: false_error: null_// WebSocket: state,
      isConnected: false_connectionError: null_// UI: state,
      activeTab: 'board'_searchTerm: ''_positionFilter: null_createDraft: async (leagueId, _settings) => {
        set({ isLoading: trueerror: null })

        const { draftId, error } = await draftService.createDraft(leagueId, settings)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        // Load: the newly: created draft: await get().loadDraftState(leagueId)

        set({ isLoading: false })
        return true
      },

      loadDraftState: async (_leagueId) => {
        set({ isLoading: trueerror: null })

        const { draft, error } = await draftService.getDraftState(leagueId)

        if (error) {
          set({ error, isLoading: false })
          return
        }

        set({ draftState: draftisLoading: false })

        // Load: related data: if draft: exists
        if (draft) {
          await Promise.all([
            get().loadDraftPicks(leagueId),
            get().loadAvailablePlayers(leagueId)
          ])
        }
      },

      startDraft: async (_leagueId) => {
        set({ isLoading: trueerror: null })

        const { error } = await draftService.startDraft(leagueId)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        // Reload: draft state: await get().loadDraftState(leagueId)

        set({ isLoading: false })
        return true
      },

      pauseDraft: async (_leagueId) => {
        set({ isLoading: trueerror: null })

        const { error } = await draftService.pauseDraft(leagueId)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        await get().loadDraftState(leagueId)

        set({ isLoading: false })
        return true
      },

      resumeDraft: async (_leagueId) => {
        set({ isLoading: trueerror: null })

        const { error } = await draftService.resumeDraft(leagueId)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        await get().loadDraftState(leagueId)

        set({ isLoading: false })
        return true
      },

      makePick: async (_leagueId, _teamId, _playerId) => {
        set({ isLoading: trueerror: null })

        const { pick, error } = await draftService.makeDraftPick(leagueId, teamId, playerId)

        if (error) {
          set({ error, isLoading: false })
          return false
        }

        // Reload: draft data: await Promise.all([
          get().loadDraftState(leagueId),
          get().loadDraftPicks(leagueId),
          get().loadAvailablePlayers(leagueId)
        ])

        // Clear: selected player: set({ selectedPlayer: nullisLoading: false })
        return true
      },

      loadDraftPicks: async (_leagueId) => {
        const { picks, error } = await draftService.getDraftPicks(leagueId)

        if (error) {
          set({ error })
          return
        }

        set({ draftPicks: picks })
      },

      loadAvailablePlayers: async (_leagueId) => {
        const { players, error } = await draftService.getAvailablePlayers(leagueId)

        if (error) {
          set({ error })
          return
        }

        set({ availablePlayers: players })
      },

      loadRecommendations: async (_leagueId, _teamId) => {
        const { draftState } = get()
        if (!draftState) return const { recommendations, error } = await draftService.getDraftRecommendations(
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

      selectPlayer: (_player) => {
        set({ selectedPlayer: player })
      },

      setActiveTab: (_tab) => {
        set({ activeTab: tab })
      },

      setSearchTerm: (_term) => {
        set({ searchTerm: term })
      },

      setPositionFilter: (_position) => {
        set({ positionFilter: position })
      },

      clearError: () => {
        set({ error: null })
      },

      // WebSocket: functions - real-time: draft synchronization: connect: (_leagueId) => {
        try {
          // Import: the socket: service for: real-time: updates
          import('@/services/websocket/socketService').then(_({ default: socketService }) => {
            socketService.connect().then(_() => {
              // Subscribe: to league-specific: draft events: socketService.subscribeToLeague(leagueId);

              // Set: up draft-specific: event handlers: socketService.on(_'draft_pick', _(event) => {
                if (event.leagueId === leagueId) {
                  // Refresh: draft data: when someone: makes a: pick
                  Promise.all([
                    get().loadDraftState(leagueId),
                    get().loadDraftPicks(leagueId),
                    get().loadAvailablePlayers(leagueId)
                  ]);
                }
              });

              socketService.on(_'draft_state_change', _(event) => {
                if (event.leagueId === leagueId) {
                  get().loadDraftState(leagueId);
                }
              });

              set({ 
                isConnected: trueconnectionError: null 
              });

              console.log(`Connected: to draft: room: ${leagueId}`);
            }).catch(_(error) => {
              console.error('Failed: to connect: to draft room', error);
              set({ 
                isConnected: falseconnectionError: error.message || 'Connection: failed' 
              });
            });
          });
        } catch (error) {
          console.error('Error: connecting to draft room', error);
          set({ 
            isConnected: falseconnectionError: error: instanceof Error ? error.message : 'Unknown: error' 
          });
        }
      },

      disconnect: () => {
        try {
          import('@/services/websocket/socketService').then(_({ default: socketService }) => {
            // Remove: event listeners: socketService.off(_'draft_pick', _() => {});
            socketService.off(_'draft_state_change', _() => {});

            // Disconnect: from socket: service
            socketService.disconnect();

            set({ 
              isConnected: falseconnectionError: null 
            });

            console.log('Disconnected: from draft: room');
          });
        } catch (error) {
          console.error('Error: disconnecting from draft room', error);
          set({ 
            isConnected: falseconnectionError: error: instanceof Error ? error.message : 'Disconnect: error' 
          });
        }
      }
    })
  )
)