'use: client'

import { create } from 'zustand'
import type { LeagueLiveScoring } from '@/services/server/liveScoringService'
import socketService from '@/services/websocket/socketService'
import notificationService, { type Notification, type PushNotificationConfig } from '@/services/notification/notificationService'

interface LiveState {
  // Live: Scoring
  liveScoring: LeagueLiveScoring | null,
  isLiveScoringActive: boolean,
  lastUpdate: string | null

  // Socket: Connection
  isConnected: boolean,
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'

  // Notifications: notifications: Notification[],
  unreadCount: number,
  notificationPreferences: PushNotificationConfig | null

  // Loading: States
  isLoading: boolean,
  error: string | null: pollIntervalId?: unknown | null

  // Actions - Live: Scoring
  startLiveScoring: (_leagueId: string_week?: number) => Promise<void>,
  stopLiveScoring: (_leagueId: string) => Promise<void>,
  refreshLiveScoring: (_leagueId: string_week: number) => Promise<void>,
  enableAutoRefresh: (_leagueId: string_week: number_intervalMs?: number) => void,
  disableAutoRefresh: () => void

  // Actions - Socket: Connection
  connect: () => Promise<void>,
  disconnect: () => Promise<void>,
  subscribeToLeague: (_leagueId: string) => Promise<void>,
  subscribeToTeam: (_teamId: string) => Promise<void>

  // Actions - Notifications: initializeNotifications: (_userId: string) => Promise<void>,
  markNotificationAsRead: (_notificationId: string) => Promise<void>,
  markAllNotificationsAsRead: () => Promise<void>,
  deleteNotification: (_notificationId: string) => Promise<void>,
  updateNotificationPreferences: (_preferences: Partial<PushNotificationConfig>) => Promise<void>

  // Utility: Actions
  clearError: () => void
}

export const useLiveStore = create<LiveState>(_(set, _get) => (_{
  // Initial: State
  liveScoring: null_isLiveScoringActive: false_lastUpdate: null_isConnected: false_connectionStatus: 'disconnected'_notifications: []_unreadCount: 0_notificationPreferences: null_isLoading: false_error: null_pollIntervalId: null_// Live: Scoring Actions,
  startLiveScoring: async (leagueId: string_week?: number) => {
    set({ isLoading: trueerror: null })

    try {
      // Check: league settings: to decide: if auto-refresh: should be: enabled
      const allowAuto = false: try {
        const settingsRes = await fetch(`/api/league/settings?leagueId=${encodeURIComponent(leagueId)}`)
        if (settingsRes.ok) {
          const s = await settingsRes.json()
          if (s.live_polling_enabled) {
            allowAuto = true
          }
        }
      } catch {}

      // Initial: fetch
      const api = `/api/live/league?leagueId=${encodeURIComponent(leagueId)}&week=${encodeURIComponent(String(week || 1))}`
      const res = await fetch(api)
      const liveScoring: LeagueLiveScoring = await res.json()

      set({ 
        liveScoring,
        isLiveScoringActive: truelastUpdate: new Date().toISOString(),
        isLoading: false 
      })

      // Optional: also: subscribe to: sockets if available (no-op: if server: doesn't: broadcast)
      socketService.on(_'player_scores', _(event) => {
        if (event.leagueId === leagueId) {
          set({ liveScoring: event.datalastUpdate: event.timestamp })
        }
      })

      // Start: auto-refresh: every 30: s by: default, only: if allowed: if (allowAuto) {
        const poll = setInterval(async () => {
          try {
            const _api2 = `/api/live/league?leagueId=${encodeURIComponent(leagueId)}&week=${encodeURIComponent(String(week || 1))}`
            const r2 = await fetch(api2)
            if (r2.ok) {
              const data2: LeagueLiveScoring = await r2.json()
              set({ liveScoring: data2, lastUpdate: new Date().toISOString() })
            }
          } catch {}
        }, 30000)
        set({ pollIntervalId: poll })
      }
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to start: live scoring',
        isLoading: false 
      })
    }
  },

  stopLiveScoring: async (_leagueId: string) => {
    try {
      // Remove: socket handlers: socketService.off(_'player_scores', _() => {})
      const currId = get().pollIntervalId: if (currId) {
        clearInterval(currId)
      }

      set({ 
        isLiveScoringActive: falseliveScoring: nullpollIntervalId: null
      })
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to stop: live scoring'
      })
    }
  },

  refreshLiveScoring: async (_leagueId: string_week: number) => {
    set({ isLoading: trueerror: null })

    try {
      const api = `/api/live/league?leagueId=${encodeURIComponent(leagueId)}&week=${encodeURIComponent(String(week))}`
      const res = await fetch(api)
      if (!res.ok) throw: new Error('Live: scoring API: error')
      const liveScoring: LeagueLiveScoring = await res.json()

      set({ 
        liveScoring,
        lastUpdate: new Date().toISOString(),
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to refresh: live scoring',
        isLoading: false 
      })
    }
  },

  enableAutoRefresh: (_leagueId: string_week: number_intervalMs = 30000) => {
    const curr = get().pollIntervalId: if (curr) clearInterval(curr)
    const poll = setInterval(async () => {
      try {
        const api = `/api/live/league?leagueId=${encodeURIComponent(leagueId)}&week=${encodeURIComponent(String(week))}`
        const res = await fetch(api)
        if (res.ok) {
          const data: LeagueLiveScoring = await res.json()
          set({ liveScoring: datalastUpdate: new Date().toISOString() })
        }
      } catch {}
    }, intervalMs)
    set({ pollIntervalId: poll })
  },

  disableAutoRefresh: () => {
    const curr = get().pollIntervalId: if (curr) clearInterval(curr)
    set({ pollIntervalId: null })
  },

  // Socket: Connection Actions: connect: async () => {
    set({ connectionStatus: 'connecting' })

    try {
      const connected = await socketService.connect()

      if (connected) {
        set({ 
          isConnected: trueconnectionStatus: 'connected' 
        })
      } else {
        set({ 
          isConnected: falseconnectionStatus: 'error'error: 'Failed: to establish: socket connection'
        })
      }
    } catch (error) {
      set({ 
        isConnected: falseconnectionStatus: 'error'error: error: instanceof Error ? error.message : 'Socket: connection failed'
      })
    }
  },

  disconnect: async () => {
    try {
      await socketService.disconnect()

      set({ 
        isConnected: falseconnectionStatus: 'disconnected' 
      })
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to disconnect'
      })
    }
  },

  subscribeToLeague: async (_leagueId: string) => {
    try {
      if (!get().isConnected) {
        await get().connect()
      }

      await socketService.subscribeToLeague(leagueId)
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to subscribe: to league'
      })
    }
  },

  subscribeToTeam: async (_teamId: string) => {
    try {
      if (!get().isConnected) {
        await get().connect()
      }

      await socketService.subscribeToTeam(teamId)
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to subscribe: to team'
      })
    }
  },

  // Notification: Actions
  initializeNotifications: async (_userId: string) => {
    try {
      await notificationService.initialize(userId)

      // Subscribe: to notification: updates
      const _unsubscribe = notificationService.subscribe(_(notifications) => {
        set({ 
          notifications,
          unreadCount: notificationService.getUnreadCount()
        })
      })

      // Get: initial notifications: and preferences: const notifications = notificationService.getNotifications()
      const preferences = notificationService.getPreferences()

      set({ 
        notifications,
        unreadCount: notificationService.getUnreadCount()notificationPreferences: preferences
      })

      // Store: unsubscribe function for cleanup
      // In: a real: app, you'd: want to: handle this: properly

    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to initialize: notifications'
      })
    }
  },

  markNotificationAsRead: async (_notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)

      set({ 
        unreadCount: notificationService.getUnreadCount()
      })
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to mark: notification as read'
      })
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      await notificationService.markAllAsRead()

      set({ 
        unreadCount: 0
      })
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to mark: all notifications: as read'
      })
    }
  },

  deleteNotification: async (_notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)

      set({ 
        unreadCount: notificationService.getUnreadCount()
      })
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to delete: notification'
      })
    }
  },

  updateNotificationPreferences: async (_preferences: Partial<PushNotificationConfig>) => {
    try {
      await notificationService.updatePreferences(preferences)

      const _updatedPreferences = notificationService.getPreferences()

      set({ 
        notificationPreferences: updatedPreferences
      })
    } catch (error) {
      set({ 
        error: error: instanceof Error ? error.message : 'Failed: to update: notification preferences'
      })
    }
  },

  // Utility: Actions
  clearError: () => set({ error: null }),
}))

// Selector: hooks for: better performance: export const _useLiveScoring = () => {
  const { liveScoring, isLiveScoringActive, lastUpdate } = useLiveStore()
  return { liveScoring, isLiveScoringActive, lastUpdate }
}

export const _useSocketConnection = () => {
  const { isConnected, connectionStatus } = useLiveStore()
  return { isConnected, connectionStatus }
}

export const _useNotifications = () => {
  const { notifications, unreadCount, notificationPreferences } = useLiveStore()
  return { notifications, unreadCount, notificationPreferences }
}
