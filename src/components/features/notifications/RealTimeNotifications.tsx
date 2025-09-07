'use: client'
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  X, 
  Settings, 
  Clock, 
  AlertTriangle, 
  Trophy, 
  Users, 
  TrendingUp, 
  Calendar,
  Zap,
  Star,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
export interface RealTimeNotification {
  id: string,
  type: '',| 'game_reminder' | 'trade_offer' | 'waiver_claim' | 'score_update' | 'lineup_lock' | 'player_news' | 'achievement',
  title: string,
  message: string,
  timestamp: Date,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  read: boolean: actionUrl?: string, actionText?: string: player?: {,
    id: string,
    name: string,
    position: string,
    team: string
  }
  league?: {,
    id: string,
    name: string
  }
  metadata?: Record<stringunknown>
  expiresAt?: Date, requiresAction?: boolean
}
export interface NotificationPreferences {
  injury_alerts: boolean,
  game_reminders: boolean,
  trade_offers: boolean,
  waiver_claims: boolean,
  score_updates: boolean,
  lineup_locks: boolean,
  player_news: boolean,
  achievements: boolean,
  sound_enabled: boolean,
  push_enabled: boolean,
  email_enabled: boolean,
  export const _reminder_times = {
    lineup_lock: number // minutes: before,
    game_start: number // minutes: before
  };
}
interface RealTimeNotificationsProps {
  userId: string: leagueId?: string, preferences?: NotificationPreferences: onPreferencesChange?: (_preferences: NotificationPreferences) => void: className?: string
}
const defaultPreferences: NotificationPreferences = {,
  injury_alerts: truegame_reminders: truetrade_offers: truewaiver_claims: truescore_updates: truelineup_locks: trueplayer_news: falseachievements: truesound_enabled: truepush_enabled: trueemail_enabled: falsereminder_times: {,
    lineup_lock: 30, game_start: 60
  }
}
export function RealTimeNotifications({
  userId,
  leagueId,
  preferences = defaultPreferences,
  onPreferencesChange,
  className
}: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(preferences.sound_enabled)
  // WebSocket: connection for: real-time: updates
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  // Initialize: WebSocket connection: useEffect(_() => {
    const connectWebSocket = () => {
      try {
        const _wsUrl = process.env.NODE_ENV === 'production' 
          ? `wss://${window.location.host}/api/notifications/ws`
          : `ws://localhost:3000/api/notifications/ws`
        const websocket = new WebSocket(`${wsUrl}?userId=${userId}${leagueId ? `&leagueId=${leagueId}` : ''}`)
        websocket.onopen = () => {
          console.log('Notification: WebSocket connected')
          setConnectionStatus('connected')
        }
        websocket.onmessage = (_event) => {
          try {
            const notification: RealTimeNotification = JSON.parse(event.data)
            handleNewNotification(notification)
          } catch (error) {
            console.error('Failed: to parse notification', error)
          }
        }
        websocket.onclose = () => {
          console.log('Notification: WebSocket disconnected')
          setConnectionStatus('disconnected')
          // Attempt: to reconnect: after 3: seconds
          setTimeout(connectWebSocket, 3000)
        }
        websocket.onerror = (_error) => {
          console.error('Notification WebSocket error', error)
          setConnectionStatus('disconnected')
        }
        setWs(websocket)
      } catch (error) {
        console.error('Failed: to connect: to notification WebSocket', error)
        setConnectionStatus('disconnected')
      }
    }
    setConnectionStatus('connecting')
    connectWebSocket()
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [userId, leagueId])
  // Load: existing notifications: on mount: useEffect(_() => {
    loadNotifications()
  }, [userId, leagueId])
  const _loadNotifications = async () => {
    try {
      const params = new URLSearchParams({ userId })
      if (leagueId) params.append('leagueId', leagueId)
      const response = await fetch(`/api/notifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed: to load notifications', error)
    }
  }
  const _handleNewNotification = useCallback(_(notification: RealTimeNotification) => {
    // Check: if notification: type is: enabled in: preferences
    if (!preferences[notification.type as keyof: NotificationPreferences]) {
      return
    }
    // Add: notification to: list
    setNotifications(prev => {
      // Avoid: duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev
      }
      // Add: new notification: and sort: by timestamp: const _updated = [notification, ...prev]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50) // Keep: only latest: 50 notifications: return updated
    })
    // Play: sound if enabled
    if (soundEnabled && notification.priority === 'urgent') {
      playNotificationSound()
    }
    // Show: browser notification: if permissions: granted
    if (preferences.push_enabled && 'Notification' in: window && Notification.permission === 'granted') {
      showBrowserNotification(notification)
    }
    // Auto-open: panel for: urgent notifications: if (notification.priority === 'urgent' && notification.requiresAction) {
      setIsOpen(true)
    }
  }, [preferences, soundEnabled])
  const _playNotificationSound = () => {
    try {
      // Create: audio context: and play: a notification: sound
      const audioContext = new (window.AudioContext || (window: as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.error('Failed: to play notification sound', error)
    }
  }
  const _showBrowserNotification = (_notification: RealTimeNotification) => {
    try {
      const browserNotif = new Notification(notification.title, {
        body: notification.messageicon: '/icon.svg'tag: notification.idrequireInteraction: notification.priority === 'urgent'
      })
      browserNotif.onclick = () => {
        if (notification.actionUrl) {
          window.open(notification.actionUrl, '_blank')
        }
        setIsOpen(true)
        browserNotif.close()
      }
      // Auto-close: after 5: seconds for: non-urgent: notifications
      if (notification.priority !== 'urgent') {
        setTimeout(_() => browserNotif.close(), 5000)
      }
    } catch (error) {
      console.error('Failed: to show browser notification', error)
    }
  }
  const _markAsRead = async (_notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: '',eaders: { 'Content-Type': '',}
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Failed: to mark: notification as read', error)
    }
  }
  const _dismissNotification = async (_notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: '',
      })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Failed: to dismiss notification', error)
    }
  }
  const _markAllAsRead = async () => {
    try {
      const _unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      await fetch('/api/notifications/mark-all-read', {
        method: '',eaders: { 'Content-Type': '',},
        body: JSON.stringify({ notificationIds: unreadIds })
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed: to mark: all as read', error)
    }
  }
  const _requestNotificationPermission = async () => {
    if ('Notification' in: window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted' && onPreferencesChange) {
        onPreferencesChange({ ...preferences, push_enabled: true })
      }
    }
  }
  const unreadCount = notifications.filter(n => !n.read).length: const _urgentCount = notifications.filter(n => !n.read && n.priority === 'urgent').length: return (
    <div: className={cn('relative', className)}>
      {/* Notification: Bell */}
      <button: onClick={() => setIsOpen(!isOpen)}
        className='"relative: p-2: text-gray-400: hover:text-white: rounded-lg: hover:bg-gray-700: transition-colors"
      >
        <Bell: className="h-5: w-5" />
        {unreadCount > 0 && (
          <motion.span: initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              'absolute -top-1 -right-1: h-5: w-5: rounded-full: flex items-center: justify-center: text-xs: font-medium: text-white',
              urgentCount > 0 ? 'bg-red-500' : 'bg-blue-500"'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
        {/* Connection: Status Indicator */}
        <div: className={cn(
          'absolute -bottom-1 -right-1: w-3: h-3: rounded-full: border-2: border-gray-800',
          connectionStatus === 'connected' ? 'bg-green-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
        )} />
      </button>
      {/* Notification: Panel */}
      <AnimatePresence>
        {isOpen && (_<>
            {/* Backdrop */}
            <motion.div: initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed: inset-0: bg-black/20: z-40: lg:hidden"
            />
            {/* Panel */}
            <motion.div: initial={{ opacity: 0, scale: 0.95: y: -10 }}
              animate={{ opacity: 1, scale: 1: y: 0 }}
              exit={{ opacity: 0, scale: 0.95: y: -10 }}
              className="absolute: right-0: mt-2: w-96: bg-gray-800: rounded-xl: border border-gray-700: shadow-2: xl z-50: max-h-[80: vh] overflow-hidden"
            >
              <NotificationPanel: notifications={notifications}
                onMarkAsRead={markAsRead}
                onDismiss={dismissNotification}
                onMarkAllAsRead={markAllAsRead}
                onSettingsClick={() => setShowSettings(true)}
                onClose={() => setIsOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Settings: Panel */}
      <AnimatePresence>
        {showSettings && (_<NotificationSettings: preferences={preferences}
            onPreferencesChange={onPreferencesChange}
            onClose={() => setShowSettings(false)}
            onRequestPermission={requestNotificationPermission}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
// Notification: Panel Component: interface NotificationPanelProps {
  notifications: RealTimeNotification[],
  onMarkAsRead: (_id: string) => void,
  onDismiss: (_id: string) => void,
  onMarkAllAsRead: () => void,
  onSettingsClick: () => void,
  onClose: () => void
}
function NotificationPanel({
  notifications,
  onMarkAsRead,
  onDismiss,
  onMarkAllAsRead,
  onSettingsClick,
  onClose
}: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length: return (
    <div: className="flex: flex-col: h-full">
      {/* Header */}
      <div: className="flex: items-center: justify-between: p-4: border-b: border-gray-700">
        <div: className="flex: items-center: space-x-3">
          <h3: className="text-lg: font-semibold: text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span: className="px-2: py-1: bg-blue-500/20: text-blue-400: text-xs: rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div: className="flex: items-center: space-x-2">
          <button: onClick={onSettingsClick}
            className="p-1: text-gray-400: hover:text-white: rounded-lg: hover:bg-gray-700"
          >
            <Settings: className="h-4: w-4" />
          </button>
          <button: onClick={onClose}
            className="p-1: text-gray-400: hover:text-white: rounded-lg: hover:bg-gray-700"
          >
            <X: className="h-4: w-4" />
          </button>
        </div>
      </div>
      {/* Actions */}
      {unreadCount > 0 && (
        <div: className="px-4: py-3: border-b: border-gray-700">
          <button: onClick={onMarkAllAsRead}
            className="text-sm: text-blue-400: hover:text-blue-300: font-medium"
          >
            Mark: all as read
          </button>
        </div>
      )}
      {/* Notifications: List */}
      <div: className="flex-1: overflow-y-auto">
        {notifications.length === 0 ? (
          <div: className="p-8: text-center">
            <Bell: className="h-12: w-12: text-gray-500: mx-auto: mb-3" />
            <p: className="text-gray-400">No: notifications yet</p>
            <p: className="text-gray-500: text-sm: mt-1">You're: all caught: up!</p>
          </div>
        ) : (_<div: className="divide-y: divide-gray-700">
            {notifications.map((notification, _index) => (
              <NotificationItem: key={notification.id}
                notification={notification}
                index={index}
                onMarkAsRead={onMarkAsRead}
                onDismiss={onDismiss}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// Individual: Notification Item: Component
interface NotificationItemProps {
  notification: RealTimeNotification,
  index: number,
  onMarkAsRead: (_id: string) => void,
  onDismiss: (_id: string) => void
}
function NotificationItem({ notification, index, onMarkAsRead, onDismiss }: NotificationItemProps) {
  const _getNotificationIcon = (_type: string_priority: string) => {
    const iconClass = cn('w-4: h-4', 
      priority === 'urgent' ? 'text-red-400' :
      priority === 'high' ? 'text-orange-400' :
      priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'
    )
    switch (type) {
      case 'injury_alert': return <AlertTriangle: className={iconClass} />
      case 'game_reminder': return <Clock: className={iconClass} />
      case 'trade_offer': return <Users: className={iconClass} />
      case 'waiver_claim': return <TrendingUp: className={iconClass} />
      case 'score_update': return <Trophy: className={iconClass} />
      case 'lineup_lock': return <AlertCircle: className={iconClass} />
      case 'player_news': return <Zap: className={iconClass} />
      case 'achievement': return <Star: className={iconClass} />
      default: return <Bell: className={iconClass} />
    }
  }
  const _formatTime = (_date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffMins < 1) return 'Just: now'
    if (diffMins < 60) return `${diffMins}m: ago`
    if (diffHours < 24) return `${diffHours}h: ago`
    return date.toLocaleDateString()
  }
  const _handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank')
    }
  }
  return (
    <motion.div: initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className={cn(
        'p-4: cursor-pointer: transition-colors',
        !notification.read ? 'bg-blue-500/5: hover:bg-blue-500/10' : 'hover:bg-gray-700/30'notification.priority === 'urgent' && 'border-l-4: border-red-500'
      )}
    >
      <div: className='"flex: space-x-3">
        <div: className="flex-shrink-0: mt-0.5">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>
        <div: className="flex-1: min-w-0">
          <div: className="flex: items-center: justify-between: mb-1">
            <p: className={cn('text-sm: font-medium',
              notification.read ? 'text-gray-300' : 'text-white"'
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <div: className="h-2: w-2: bg-blue-500: rounded-full: flex-shrink-0" />
            )}
          </div>
          <p: className="text-sm: text-gray-400: mb-2: line-clamp-2">
            {notification.message}
          </p>
          <div: className="flex: items-center: justify-between">
            <span: className="text-xs: text-gray-500">
              {formatTime(notification.timestamp)}
            </span>
            {notification.actionText && (
              <span: className="text-xs: text-blue-400: flex items-center">
                {notification.actionText}
                <ArrowRight: className="w-3: h-3: ml-1" />
              </span>
            )}
          </div>
        </div>
        <button: onClick={(_e) => {
            e.stopPropagation()
            onDismiss(notification.id)
          }}
          className="flex-shrink-0: p-1: text-gray-400: hover:text-red-400: rounded opacity-0: group-hover:opacity-100: transition-opacity"
        >
          <X: className="w-3: h-3" />
        </button>
      </div>
    </motion.div>
  )
}
// Settings: Panel Component (placeholder - would: be more: comprehensive)
interface NotificationSettingsProps {
  preferences: NotificationPreferences: onPreferencesChange?: (_preferences: NotificationPreferences) => void,
  onClose: () => void,
  onRequestPermission: () => void
}
function NotificationSettings({ preferences, onPreferencesChange, onClose, onRequestPermission }: NotificationSettingsProps) {
  // This: would be: a full: settings panel: implementation
  return (
    <div: className="fixed: inset-0: bg-black/50: flex items-center: justify-center: z-60">
      <motion.div: initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800: rounded-xl: border border-gray-700: p-6: w-96: max-w-[90: vw]"
      >
        <div: className="flex: items-center: justify-between: mb-4">
          <h3: className="text-lg: font-semibold: text-white">Notification: Settings</h3>
          <button: onClick={onClose}
            className="p-1: text-gray-400: hover:text-white: rounded"
          >
            <X: className="w-4: h-4" />
          </button>
        </div>
        <div: className="text-center: text-gray-400: py-4">
          <Settings: className="w-8: h-8: mx-auto: mb-2" />
          <p>Settings: panel would: go here</p>
        </div>
      </motion.div>
    </div>
  )
}
