'use client'

import { create } from 'zustand'
import type { LeagueLiveScoring } from '@/services/server/liveScoringService'
import socketService from '@/services/websocket/socketService'
import notificationService, { type Notification, type PushNotificationConfig } from '@/services/notification/notificationService'

interface LiveState {
  // Live Scoring
  liveScoring: LeagueLiveScoring | null
  isLiveScoringActive: boolean
  lastUpdate: string | null
  
  // Socket Connection
  isConnected: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  
  // Notifications
  notifications: Notification[]
  unreadCount: number
  notificationPreferences: PushNotificationConfig | null
  
  // Loading States
  isLoading: boolean
  error: string | null
  pollIntervalId?: any | null
  
  // Actions - Live Scoring
  startLiveScoring: (leagueId: string, week?: number) => Promise<void>
  stopLiveScoring: (leagueId: string) => Promise<void>
  refreshLiveScoring: (leagueId: string, week: number) => Promise<void>
  enableAutoRefresh: (leagueId: string, week: number, intervalMs?: number) => void
  disableAutoRefresh: () => void
  
  // Actions - Socket Connection
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  subscribeToLeague: (leagueId: string) => Promise<void>
  subscribeToTeam: (teamId: string) => Promise<void>
  
  // Actions - Notifications
  initializeNotifications: (userId: string) => Promise<void>
  markNotificationAsRead: (notificationId: string) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  updateNotificationPreferences: (preferences: Partial<PushNotificationConfig>) => Promise<void>
  
  // Utility Actions
  clearError: () => void
}

export const useLiveStore = create<LiveState>((set, get) => ({
  // Initial State
  liveScoring: null,
  isLiveScoringActive: false,
  lastUpdate: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  notifications: [],
  unreadCount: 0,
  notificationPreferences: null,
  isLoading: false,
  error: null,
  pollIntervalId: null,

  // Live Scoring Actions
  startLiveScoring: async (leagueId: string, week?: number) => {
    set({ isLoading: true, error: null })
    
    try {
      // Check league settings to decide if auto-refresh should be enabled
      let allowAuto = false
      try {
        const settingsRes = await fetch(`/api/league/settings?leagueId=${encodeURIComponent(leagueId)}`)
        if (settingsRes.ok) {
          const s = await settingsRes.json()
          if (s.live_polling_enabled) {
            allowAuto = true
          }
        }
      } catch {}

      // Initial fetch
      const api = `/api/live/league?leagueId=${encodeURIComponent(leagueId)}&week=${encodeURIComponent(String(week || 1))}`
      const res = await fetch(api)
      const liveScoring: LeagueLiveScoring = await res.json()
      
      set({ 
        liveScoring,
        isLiveScoringActive: true,
        lastUpdate: new Date().toISOString(),
        isLoading: false 
      })

      // Optional: also subscribe to sockets if available (no-op if server doesn't broadcast)
      socketService.on('player_scores', (event) => {
        if (event.leagueId === leagueId) {
          set({ liveScoring: event.data, lastUpdate: event.timestamp })
        }
      })

      // Start auto-refresh every 30s by default, only if allowed
      if (allowAuto) {
        const poll = setInterval(async () => {
          try {
            const api2 = `/api/live/league?leagueId=${encodeURIComponent(leagueId)}&week=${encodeURIComponent(String(week || 1))}`
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
        error: error instanceof Error ? error.message : 'Failed to start live scoring',
        isLoading: false 
      })
    }
  },

  stopLiveScoring: async (_leagueId: string) => {
    try {
      // Remove socket handlers
      socketService.off('player_scores', () => {})
      const currId = get().pollIntervalId
      if (currId) {
        clearInterval(currId)
      }
      
      set({ 
        isLiveScoringActive: false,
        liveScoring: null,
        pollIntervalId: null
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to stop live scoring'
      })
    }
  },

  refreshLiveScoring: async (leagueId: string, week: number) => {
    set({ isLoading: true, error: null })
    
    try {
      const api = `/api/live/league?leagueId=${encodeURIComponent(leagueId)}&week=${encodeURIComponent(String(week))}`
      const res = await fetch(api)
      if (!res.ok) throw new Error('Live scoring API error')
      const liveScoring: LeagueLiveScoring = await res.json()
      
      set({ 
        liveScoring,
        lastUpdate: new Date().toISOString(),
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh live scoring',
        isLoading: false 
      })
    }
  },

  enableAutoRefresh: (leagueId: string, week: number, intervalMs = 30000) => {
    const curr = get().pollIntervalId
    if (curr) clearInterval(curr)
    const poll = setInterval(async () => {
      try {
        const api = `/api/live/league?leagueId=${encodeURIComponent(leagueId)}&week=${encodeURIComponent(String(week))}`
        const res = await fetch(api)
        if (res.ok) {
          const data: LeagueLiveScoring = await res.json()
          set({ liveScoring: data, lastUpdate: new Date().toISOString() })
        }
      } catch {}
    }, intervalMs)
    set({ pollIntervalId: poll })
  },

  disableAutoRefresh: () => {
    const curr = get().pollIntervalId
    if (curr) clearInterval(curr)
    set({ pollIntervalId: null })
  },

  // Socket Connection Actions
  connect: async () => {
    set({ connectionStatus: 'connecting' })
    
    try {
      const connected = await socketService.connect()
      
      if (connected) {
        set({ 
          isConnected: true,
          connectionStatus: 'connected' 
        })
      } else {
        set({ 
          isConnected: false,
          connectionStatus: 'error',
          error: 'Failed to establish socket connection'
        })
      }
    } catch (error) {
      set({ 
        isConnected: false,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Socket connection failed'
      })
    }
  },

  disconnect: async () => {
    try {
      await socketService.disconnect()
      
      set({ 
        isConnected: false,
        connectionStatus: 'disconnected' 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to disconnect'
      })
    }
  },

  subscribeToLeague: async (leagueId: string) => {
    try {
      if (!get().isConnected) {
        await get().connect()
      }
      
      await socketService.subscribeToLeague(leagueId)
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to subscribe to league'
      })
    }
  },

  subscribeToTeam: async (teamId: string) => {
    try {
      if (!get().isConnected) {
        await get().connect()
      }
      
      await socketService.subscribeToTeam(teamId)
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to subscribe to team'
      })
    }
  },

  // Notification Actions
  initializeNotifications: async (userId: string) => {
    try {
      await notificationService.initialize(userId)
      
      // Subscribe to notification updates
      const unsubscribe = notificationService.subscribe((notifications) => {
        set({ 
          notifications,
          unreadCount: notificationService.getUnreadCount()
        })
      })
      
      // Get initial notifications and preferences
      const notifications = notificationService.getNotifications()
      const preferences = notificationService.getPreferences()
      
      set({ 
        notifications,
        unreadCount: notificationService.getUnreadCount(),
        notificationPreferences: preferences
      })
      
      // Store unsubscribe function for cleanup
      // In a real app, you'd want to handle this properly
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize notifications'
      })
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      
      set({ 
        unreadCount: notificationService.getUnreadCount()
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to mark notification as read'
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
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read'
      })
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)
      
      set({ 
        unreadCount: notificationService.getUnreadCount()
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete notification'
      })
    }
  },

  updateNotificationPreferences: async (preferences: Partial<PushNotificationConfig>) => {
    try {
      await notificationService.updatePreferences(preferences)
      
      const updatedPreferences = notificationService.getPreferences()
      
      set({ 
        notificationPreferences: updatedPreferences
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update notification preferences'
      })
    }
  },

  // Utility Actions
  clearError: () => set({ error: null }),
}))

// Selector hooks for better performance
export const useLiveScoring = () => {
  const { liveScoring, isLiveScoringActive, lastUpdate } = useLiveStore()
  return { liveScoring, isLiveScoringActive, lastUpdate }
}

export const useSocketConnection = () => {
  const { isConnected, connectionStatus } = useLiveStore()
  return { isConnected, connectionStatus }
}

export const useNotifications = () => {
  const { notifications, unreadCount, notificationPreferences } = useLiveStore()
  return { notifications, unreadCount, notificationPreferences }
}
