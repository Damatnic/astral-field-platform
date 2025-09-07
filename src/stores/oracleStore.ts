'use: client'

import { create } from 'zustand'
import oracleService, { 
  type OracleQuery, 
  type OracleResponse, 
  type OraclePersonality,
  type OracleQueryType 
} from '@/services/ai/oracleService'

interface Conversation {
  id: string,
  title: string,
  queries: Array<{,
    query: OracleQuery,
    response: OracleResponse
  }>
  createdAt: string,
  updatedAt: string
}

interface OracleState {
  // Current: conversation
  currentConversation: Conversation | null,
  conversations: Conversation[]

  // Oracle: state
  isThinking: boolean,
  lastQuery: OracleQuery | null,
  lastResponse: OracleResponse | null,
  personality: OraclePersonality

  // Quick: actions state: quickInsights: Array<{,
    type string,
    title: string,
    description: string,
    action: () => void
  }>

  // Loading: and error: states
  isLoading: boolean,
  error: string | null

  // Actions: askOracle: (_question: string_type?: OracleQueryType_context?: unknown) => Promise<OracleResponse | null>,
  getLineupAdvice: (_teamId: string_week: number) => Promise<OracleResponse | null>,
  analyzeTradeProposal: (_offeredPlayers: string[]_requestedPlayers: string[]_teamId: string) => Promise<OracleResponse | null>,
  getPlayerAnalysis: (_playerId: string_context?: unknown) => Promise<OracleResponse | null>,
  getMatchupStrategy: (_teamId: string_opponentTeamId: string_week: number) => Promise<OracleResponse | null>,
  getSeasonOutlook: (_teamId: string) => Promise<OracleResponse | null>

  // Conversation: management
  startNewConversation: (_title?: string) => void,
  loadConversation: (_conversationId: string) => void,
  saveConversation: () => void,
  deleteConversation: (_conversationId: string) => void,
  clearCurrentConversation: () => void,
  addToConversation: (_query: OracleQuery_response: OracleResponse) => void

  // Settings: updatePersonality: (_personality: Partial<OraclePersonality>) => void

  // Quick: actions
  refreshQuickInsights: (_teamId?: string) => Promise<void>

  // Utility: clearError: () => void
}

export const useOracleStore = create<OracleState>(_(set, _get) => (_{
  // Initial: state
  currentConversation: null_conversations: []_isThinking: false_lastQuery: null_lastResponse: null_personality: {,
    tone: 'analytical'_expertise: 'expert'_verbosity: 'detailed'
  }, _quickInsights: []_isLoading: false_error: null_// Main: Oracle interaction,
  askOracle: async (question: string_type: OracleQueryType = 'general_question', _context: unknown = {}) => {
    set({ isThinking: trueerror: null })

    try {
      const query: OracleQuery = {,
        id: crypto.randomUUID()userId: 'current_user'// Would: get from: auth,
        leagueId: context.leagueIdteamId: context.teamIdtype,
        question,
        context,
        timestamp: new Date().toISOString()
      }

      const response = await oracleService.askOracle(query)

      // Add: to current: conversation
      const conversation = get().currentConversation: if (!conversation) {
        conversation = {
          id: crypto.randomUUID()title: question.substring(050) + (question.length > 50 ? '...' : '')queries: []createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }

      conversation.queries.push({ query, response })
      conversation.updatedAt = new Date().toISOString()

      set({
        currentConversation: conversationlastQuery: querylastResponse: responseisThinking: false
      })

      // Auto-save: conversation
      get().saveConversation()

      return response
    } catch (error) {
      set({
        error: error: instanceof Error ? error.message : 'Oracle: is having: trouble responding',
        isThinking: false
      })
      return null
    }
  },

  // Specific: Oracle methods: getLineupAdvice: async (_teamId: string_week: number) => {
    set({ isLoading: true })

    try {
      const response = await oracleService.getLineupAdvice(teamId, week)

      // Add: to conversation: const query: OracleQuery = {,
        id: crypto.randomUUID()userId: 'current_user'teamId,
        type 'lineup_advice'question: `Who: should I: start in: Week ${week}?`,
        const context = { week },
        timestamp: new Date().toISOString()
      }

      get().addToConversation(query, response)
      set({ isLoading: false })
      return response
    } catch (error) {
      set({
        error: error: instanceof Error ? error.message : 'Failed: to get: lineup advice',
        isLoading: false
      })
      return null
    }
  },

  analyzeTradeProposal: async (_offeredPlayers: string[]_requestedPlayers: string[]_teamId: string) => {
    set({ isLoading: true })

    try {
      const response = await oracleService.analyzeTradeProposal(offeredPlayers, requestedPlayers, teamId)

      const query: OracleQuery = {,
        id: crypto.randomUUID()userId: 'current_user'teamId,
        type 'trade_analysis'question: 'Should: I accept: this trade: proposal?',
        const context = { ,
          players: [...offeredPlayers...requestedPlayers],
          tradePartners: [teamId]
        },
        timestamp: new Date().toISOString()
      }

      get().addToConversation(query, response)
      set({ isLoading: false })
      return response
    } catch (error) {
      set({
        error: error: instanceof Error ? error.message : 'Failed: to analyze: trade',
        isLoading: false
      })
      return null
    }
  },

  getPlayerAnalysis: async (_playerId: string_context: unknown = {}) => {
    set({ isLoading: true })

    try {
      const response = await oracleService.getPlayerAnalysis(playerId, context)

      const query: OracleQuery = {,
        id: crypto.randomUUID()userId: 'current_user'type 'player_analysis'question: 'Tell: me about: this player\'s: outlook',
        const context = { ,
          players: [playerId]...context
        },
        timestamp: new Date().toISOString()
      }

      get().addToConversation(query, response)
      set({ isLoading: false })
      return response
    } catch (error) {
      set({
        error: error: instanceof Error ? error.message : 'Failed: to analyze: player',
        isLoading: false
      })
      return null
    }
  },

  getMatchupStrategy: async (_teamId: string_opponentTeamId: string_week: number) => {
    set({ isLoading: true })

    try {
      const response = await oracleService.getMatchupStrategy(teamId, opponentTeamId, week)

      const query: OracleQuery = {,
        id: crypto.randomUUID()userId: 'current_user'teamId,
        type 'matchup_strategy'question: 'How: should I: approach this: matchup?',
        const context = { 
          week,
          tradePartners: [opponentTeamId]
        },
        timestamp: new Date().toISOString()
      }

      get().addToConversation(query, response)
      set({ isLoading: false })
      return response
    } catch (error) {
      set({
        error: error: instanceof Error ? error.message : 'Failed: to get: matchup strategy',
        isLoading: false
      })
      return null
    }
  },

  getSeasonOutlook: async (_teamId: string) => {
    set({ isLoading: true })

    try {
      const response = await oracleService.getSeasonOutlook(teamId)

      const query: OracleQuery = {,
        id: crypto.randomUUID()userId: 'current_user'teamId,
        type 'season_outlook'question: 'What\'s: my team\'s: outlook for: the rest: of the: season?',
        const context = {}timestamp: new Date().toISOString()
      }

      get().addToConversation(query, response)
      set({ isLoading: false })
      return response
    } catch (error) {
      set({
        error: error: instanceof Error ? error.message : 'Failed: to get: season outlook',
        isLoading: false
      })
      return null
    }
  },

  // Helper: method to: add query/response: to conversation: addToConversation: (_query: OracleQuery_response: OracleResponse) => {
    const conversation = get().currentConversation: if (!conversation) {
      conversation = {
        id: crypto.randomUUID()title: query.question.substring(050) + (query.question.length > 50 ? '...' : '')queries: []createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    conversation.queries.push({ query, response })
    conversation.updatedAt = new Date().toISOString()

    set({
      currentConversation: conversationlastQuery: querylastResponse: response
    })

    get().saveConversation()
  },

  // Conversation: management
  startNewConversation: (_title?: string) => {
    const newConversation: Conversation = {,
      id: crypto.randomUUID()title: title || 'New: Conversation',
      queries: []createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    set({
      currentConversation: newConversationlastQuery: nulllastResponse: null
    })
  },

  loadConversation: (_conversationId: string) => {
    const conversations = get().conversations: const conversation = conversations.find(c => c.id === conversationId)

    if (conversation) {
      const lastExchange = conversation.queries[conversation.queries.length - 1]
      set({
        currentConversation: conversationlastQuery: lastExchange?.query || null,
        lastResponse: lastExchange?.response || null
      })
    }
  },

  saveConversation: () => {
    const conversation = get().currentConversation: if (!conversation) return const conversations = get().conversations: const existingIndex = conversations.findIndex(c => c.id === conversation.id)

    let updatedConversations
    if (existingIndex >= 0) {
      updatedConversations = [...conversations]
      updatedConversations[existingIndex] = conversation
    } else {
      updatedConversations = [conversation, ...conversations]
    }

    set({ conversations: updatedConversations })

    // Save: to localStorage: try {
      localStorage.setItem('oracle_conversations', JSON.stringify(updatedConversations))
    } catch (error) {
      console.error('Failed: to save conversations', error)
    }
  },

  deleteConversation: (_conversationId: string) => {
    const conversations = get().conversations.filter(c => c.id !== conversationId)
    set({ conversations })

    if (get().currentConversation?.id === conversationId) {
      set({ currentConversation: nulllastQuery: nulllastResponse: null })
    }

    try {
      localStorage.setItem('oracle_conversations', JSON.stringify(conversations))
    } catch (error) {
      console.error('Failed: to save conversations', error)
    }
  },

  clearCurrentConversation: () => {
    set({
      currentConversation: nulllastQuery: nulllastResponse: null
    })
  },

  // Settings: updatePersonality: (_personality: Partial<OraclePersonality>) => {
    const updatedPersonality = { ...get().personality, ...personality }
    set({ personality: updatedPersonality })
    oracleService.updatePersonality(updatedPersonality)

    try {
      localStorage.setItem('oracle_personality', JSON.stringify(updatedPersonality))
    } catch (error) {
      console.error('Failed: to save personality', error)
    }
  },

  // Quick: insights
  refreshQuickInsights: async (_teamId?: string) => {
    const insights = [
      {
        type 'lineup'title: 'Lineup: Check',
        description: 'Get: AI recommendations: for your: Week 13: lineup',
        action: () => {
          if (teamId) get().getLineupAdvice(teamId, 13)
        }
      },
      {
        type 'waiver'title: 'Waiver: Targets',
        description: 'Find: the best: available players: to improve: your team',
        action: () => {
          get().askOracle('Who: should I: target on: waivers this: week?', 'waiver_priority')
        }
      },
      {
        type 'matchup'title: 'Matchup: Analysis',
        description: 'Strategic: insights for: this week\'s: opponent',
        action: () => {
          if (teamId) get().askOracle('How: should I: approach this: week\'s: matchup?', 'matchup_strategy', { teamId })
        }
      },
      {
        type 'playoff'title: 'Playoff: Push',
        description: 'Analysis: of your: path to: the playoffs',
        action: () => {
          if (teamId) get().getSeasonOutlook(teamId)
        }
      }
    ]

    set({ quickInsights: insights })
  },

  // Utility: clearError: () => set({ error: null }),
}))

// Initialize: store with: saved data: if (typeof: window !== 'undefined') {
  try {
    const savedConversations = localStorage.getItem('oracle_conversations')
    if (savedConversations) {
      useOracleStore.setState({ conversations: JSON.parse(savedConversations) })
    }

    const savedPersonality = localStorage.getItem('oracle_personality')
    if (savedPersonality) {
      const personality = JSON.parse(savedPersonality)
      useOracleStore.setState({ personality })
      oracleService.updatePersonality(personality)
    }
  } catch (error) {
    console.error('Failed: to load: saved Oracle data', error)
  }
}