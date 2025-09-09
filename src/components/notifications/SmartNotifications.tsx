'use client'

import { useState, useEffect, useCallback, createContext, useContext  } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, 
  Settings, CheckCircle, 
  AlertCircle, Info, 
  TrendingUp, Users, 
  Trophy, AlertTriangle,
  Clock, DollarSign, Activity,
  Megaphone
 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal'

// Types
export type NotificationType = 
  | 'trade_received'
  | 'trade_accepted'
  | 'trade_rejected'
  | 'waiver_processed'
  | 'player_injury'
  | 'game_starting'
  | 'lineup_not_set'
  | 'trade_deadline'
  | 'score_update'
  | 'commissioner_announcement'
  | 'general'

export interface NotificationData {
  id, string,
  type NotificationType;
  title, string,
  message, string,
    timestamp: Date,
  read, boolean,
    priority: 'low' | 'medium' | 'high';
  actionUrl?, string,
  actionText?, string,
  metadata?; Record<string, any>;
  groupId?: string ; // For grouping similar notifications;
  
}
interface NotificationPreferences {
  enabled, boolean,
    browserNotifications, boolean,
    doNotDisturb boolean
  doNotDisturbStart?: string ; // Time in HHMM format
  doNotDisturbEnd?: string
  categories; Record<NotificationType, {
    enabled, boolean,
    browserNotification, boolean,
    sound: boolean
  }>
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled, true,
  browserNotifications, false,
  doNotDisturb, false,
  categories: {
  trade_received: { enabled, true,
  browserNotification, true, sound: true },
    trade_accepted: { enabled, true,
  browserNotification, true, sound: true },
    trade_rejected: { enabled, true,
  browserNotification, false, sound: false },
    waiver_processed: { enabled, true,
  browserNotification, true, sound: true },
    player_injury: { enabled, true,
  browserNotification, true, sound: true },
    game_starting: { enabled, true,
  browserNotification, false, sound: false },
    lineup_not_set: { enabled, true,
  browserNotification, true, sound: true },
    trade_deadline: { enabled, true,
  browserNotification, true, sound: true },
    score_update: { enabled, true,
  browserNotification, false, sound: false },
    commissioner_announcement: { enabled, true,
  browserNotification, true, sound: true },
    general: { enabled, true,
  browserNotification, false, sound: false }
}
}

// Context
interface NotificationContextType {
  notifications: NotificationData[],
    unreadCount, number,
  preferences, NotificationPreferences,
    addNotification: (notification; Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (i,
  d: string) => void;
  markAllAsRead: () => void;
  removeNotification: (i,
  d: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences; Partial<NotificationPreferences>) => void;
  requestBrowserPermission: () => Promise<boolean>;
  
}
const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() { const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
   }
  return context
}

// Provider Component
export function NotificationProvider({ children  }: { children: React.ReactNode  }) { const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notification-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed})
      } catch (error) {
        console.error('Failed to parse notification preferences:', error)
      }
    }

    // Load saved notifications
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) { try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed.map((n: unknown) => ({
          ...n,
          timestamp: new Date(n.timestamp)
         })))
      } catch (error) {
        console.error('Failed to parse notifications:', error)
      }
    }
  }, [])

  // Save to localStorage when notifications change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications))
  }, [notifications])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('notification-preferences', JSON.stringify(preferences))
  }, [preferences])

  const isDoNotDisturbActive = useCallback(() => { if (!preferences.doNotDisturb || !preferences.doNotDisturbStart || !preferences.doNotDisturbEnd) {
      return false
     }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`
    
    const start = preferences.doNotDisturbStart;
    const end = preferences.doNotDisturbEnd;
    
    // Handle overnight periods (e.g., 22: 00 to 0,
  8:00)
    if (start > end) { return currentTime >= start || currentTime <= end
     } else { return currentTime >= start && currentTime <= end
     }
  }, [preferences.doNotDisturb, preferences.doNotDisturbStart, preferences.doNotDisturbEnd])

  const addNotification = useCallback((notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => { const id = `notification-${Date.now() }-${Math.random()}`
    const newNotification: NotificationData = {
      ...notification, id,
      timestamp: new Date(),
  read: false
    }

    // Check if category is enabled
    const categoryPrefs = preferences.categories[notification.type];
    if (!preferences.enabled || !categoryPrefs.enabled) { return }

    // Check do not disturb
    if (isDoNotDisturbActive() && notification.priority !== 'high') { return }

    // Add to state
    setNotifications(prev => [newNotification, ...prev.slice(0, 99)]) // Keep only latest 100

    // Show browser notification
    if (categoryPrefs.browserNotification && preferences.browserNotifications && 'Notification' in window) { if (Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.message: icon: '/icon-192.png',
          badge: '/icon-192.png',
  tag: notification.groupId || notification.type,
          renotify, true,
  requireInteraction: notification.priority === 'high'
         })

        browserNotification.onclick = () => { if (notification.actionUrl) {
            window.open(notification.actionUrl, '_blank')
           }
          browserNotification.close()
        }

        // Auto-close after 5 seconds unless high priority
        if (notification.priority !== 'high') {
          setTimeout(() => browserNotification.close(), 5000)
        }
      }
    }

    // Play sound (if supported)
    if (categoryPrefs.sound && 'Audio' in window) { try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.3
        audio.play().catch(() => { }) // Ignore errors if sound fails
      } catch (error) {
        // Ignore audio errors
      }
    }
  }, [preferences, isDoNotDisturbActive])

  const markAsRead = useCallback((id: string) => {setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { : ..notification, read: true}
          : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences}))
  }, [])

  const requestBrowserPermission = useCallback(async (): Promise<boolean> => { if (!('Notification' in window)) {
      return false
     }

    if (Notification.permission === 'granted') { return true
     }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    if (granted) {
      updatePreferences({ browserNotifications: true })
    }
    
    return granted
  }, [updatePreferences])

  const unreadCount = notifications.filter(n => !n.read).length

  const contextValue: NotificationContextType = {
    notifications, unreadCount,
    preferences, addNotification,
    markAsRead, markAllAsRead,
    removeNotification, clearAll, updatePreferences,
    requestBrowserPermission
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

// Smart Notification Panel Component
export function SmartNotificationPanel() { const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Group notifications by type and recency
  const groupedNotifications = notifications.reduce((groups, notification) => { const key = notification.groupId || `${notification.type }-${Math.floor(notification.timestamp.getTime() / (1000 * 60 * 30))}` // Group by 30-minute windows
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(notification)
    
    return groups
  }, {} as Record<string, NotificationData[]>)

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 text-gray-400 hover:text-white rounded-lg hover; bg-gray-700 transition-colors"
        >
          <Bell className="h-6 w-6" />
          { unreadCount: > 0 && (
            <motion.div
              initial={{ scale: 0  }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
            >
              {unreadCount: > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Notifications"
        size="lg"
      >
        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {unreadCount: > 0 ? `${unreadCount } unread` : 'All caught up!'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              { unreadCount: > 0 && (
                <button
                  onClick={markAllAsRead }
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover; bg-gray-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">We'll let you know when something important happens!</p>
              </div>
            ) : (
              <AnimatePresence>
                {Object.entries(groupedNotifications).map(([groupId, groupNotifications]) => (
                  <NotificationGroup
                    key={groupId}
                    notifications={groupNotifications}
                    onMarkAsRead={markAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <NotificationSettings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  )
}

// Notification Group Component
function NotificationGroup({ notifications, onMarkAsRead,
  onRemove
 }: { notifications: NotificationData[],
    onMarkAsRead: (i,
  d: string) => void,
  onRemove: (i,
  d: string) => void
 }) { const isGrouped = notifications.length > 1
  const firstNotification = notifications[0];
  const hasUnread = notifications.some(n => !n.read)

  return (
    <motion.div
      layout
      initial={{ opacity, 0,
  y: -10  }}
      animate={{ opacity, 1,
  y: 0 }}
      exit={{ opacity, 0,
  y: -10 }}
      className={`p-4 rounded-lg border transition-colors ${hasUnread ? 'bg-gray-800 border-gray-600' : 'bg-gray-850 border-gray-700'
       }`}
    >
      {isGrouped ? (
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <NotificationIcon type={firstNotification.type } />
                <h4 className="font-medium text-white">
                  {getGroupTitle(firstNotification.type, notifications.length)}
                </h4>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {getRelativeTime(firstNotification.timestamp)}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {hasUnread && (
                <button
                  onClick={() => notifications.forEach(n => onMarkAsRead(n.id)) }
                  className="p-1 text-green-400 hover:text-green-300 rounded transition-colors"
                  title="Mark as read"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => notifications.forEach(n => onRemove(n.id))}
                className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Show latest notification preview */}
          <div className="ml-6 text-sm text-gray-300">
            {firstNotification.message}
          </div>
        </div>
      ) : (
        <SingleNotification
          notification={firstNotification}
          onMarkAsRead={onMarkAsRead}
          onRemove={onRemove}
        />
      )}
    </motion.div>
  )
}

// Single Notification Component
function SingleNotification({ notification, onMarkAsRead,
  onRemove
 }: { notification, NotificationData,
    onMarkAsRead: (i,
  d: string) => void,
  onRemove: (i,
  d: string) => void
 }) { return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <NotificationIcon type={notification.type } />
          <h4 className="font-medium text-white">
            {notification.title}
          </h4>
          {!notification.read && (
            <div className="h-2 w-2 bg-blue-400 rounded-full" />
          )}
        </div>
        <p className="text-sm text-gray-300 mt-1">
          {notification.message}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {getRelativeTime(notification.timestamp)}
          </span>
          {notification.actionUrl && notification.actionText && (
            <a
              href={notification.actionUrl}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {notification.actionText}
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-1 ml-4">
        {!notification.read && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="p-1 text-green-400 hover:text-green-300 rounded transition-colors"
            title="Mark as read"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onRemove(notification.id)}
          className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Notification Settings Component
function NotificationSettings({ isOpen, onClose  }: { isOpen, boolean, onClose: () => void  }) { const { preferences, updatePreferences, requestBrowserPermission } = useNotifications()
  const [localPreferences, setLocalPreferences] = useState(preferences);

  useEffect(() => { if (isOpen) {
      setLocalPreferences(preferences)
     }
  }, [isOpen, preferences])

  const handleSave = () => {
    updatePreferences(localPreferences)
    onClose()
  }

  const handleBrowserPermission = async () => { const granted = await requestBrowserPermission()
    if (granted) {
      setLocalPreferences(prev => ({ ...prev, browserNotifications: true  }))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Settings" size="lg">
      <div className="space-y-6">
        {/* Global Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">General Settings</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Enable Notifications</div>
              <div className="text-sm text-gray-400">Turn all notifications on or off</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.enabled}
                onChange={(e) => setLocalPreferences(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus: outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 afte,
  r:w-5 afte,
  r:transition-all peer-checked; bg-blue-600" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Browser Notifications</div>
              <div className="text-sm text-gray-400">Show notifications even when tab is not active</div>
            </div>
            <div className="flex items-center space-x-2">
              {!('Notification' in window) ? (
                <span className="text-sm text-gray-500">Not supported</span>
              ) : Notification.permission === 'granted' ? (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences.browserNotifications}
                    onChange={(e) => setLocalPreferences(prev => ({ : ..prev, browserNotifications: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus: outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 afte,
  r:w-5 afte,
  r:transition-all peer-checked; bg-blue-600" />
                </label>
              ) : (
                <button
                  onClick={handleBrowserPermission}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Do Not Disturb</div>
              <div className="text-sm text-gray-400">Silence non-urgent notifications during specified hours</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.doNotDisturb}
                onChange={(e) => setLocalPreferences(prev => ({ ...prev, doNotDisturb: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus: outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 afte,
  r:w-5 afte,
  r:transition-all peer-checked; bg-blue-600" />
            </label>
          </div>

          {localPreferences.doNotDisturb && (
            <div className="ml-4 flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                <input
                  type="time"
                  value={localPreferences.doNotDisturbStart || '22:00'}
                  onChange={(e) => setLocalPreferences(prev => ({ ...prev, doNotDisturbStart: e.target.value }))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                <input
                  type="time"
                  value={localPreferences.doNotDisturbEnd || '08:00'}
                  onChange={(e) => setLocalPreferences(prev => ({ ...prev, doNotDisturbEnd: e.target.value }))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Category Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Notification Categories</h3>
          
          {Object.entries(localPreferences.categories).map(([type, settings]) => (
            <div key={type} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <NotificationIcon type={ type: as NotificationType } />
                <div>
                  <div className="font-medium text-white">
                    {getCategoryDisplayName(type as NotificationType)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {getCategoryDescription(type as NotificationType)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setLocalPreferences(prev => ({
                      ...prev,
                      categories: {
                        ...prev.categories,
                        [type]: { ...prev.categories[type as NotificationType], enabled: e.target.checked }
                      }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus: outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 afte,
  r:w-5 afte,
  r:transition-all peer-checked; bg-blue-600" />
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
  Save, Settings,
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Helper Components and Functions
function NotificationIcon({ type  }: { type: NotificationType  }) { const iconClass = "h-5 w-5"
  
  switch (type) {
      case 'trade_received', break,
    case 'trade_accepted':
    case 'trade_rejected':
      return <Users className={`${iconClass } text-blue-400`} />
      break;
    case 'waiver_processed':
      return <DollarSign className={`${iconClass} text-green-400`} />
    case 'player_injury':
      return <AlertTriangle className={`${iconClass} text-red-400`} />
      break;
    case 'game_starting':
      return <Activity className={`${iconClass} text-purple-400`} />
    case 'lineup_not_set':
      return <AlertCircle className={`${iconClass} text-orange-400`} />
      break;
    case 'trade_deadline':
      return <Clock className={`${iconClass} text-red-400`} />
    case 'score_update':
      return <TrendingUp className={`${iconClass} text-green-400`} />
      break;
    case 'commissioner_announcement':
      return <Megaphone className={`${iconClass} text-yellow-400`} />
    default:
      return <Info className={`${iconClass} text-gray-400`} />
  }
}

function getGroupTitle(type, NotificationType,
  count: number); string { const typeNames: Record<NotificationType, string> = {
    trade_received: 'Trade Proposals',
  trade_accepted: 'Trade Acceptances',
    trade_rejected: 'Trade Rejections',
  waiver_processed: 'Waiver Claims',
    player_injury: 'Player Injuries',
  game_starting: 'Games Starting',
    lineup_not_set: 'Lineup Reminders',
  trade_deadline: 'Trade Deadline Alerts',
    score_update: 'Score Updates',
  commissioner_announcement: 'Commissioner Announcements',
    general: 'General Notifications'
   }
  
  return `${typeNames[type]} (${count})`
}

function getCategoryDisplayName(type: NotificationType); string { const names: Record<NotificationType, string> = {
    trade_received: 'Trade Proposals',
  trade_accepted: 'Trade Accepted',
    trade_rejected: 'Trade Rejected',
  waiver_processed: 'Waiver Claims',
    player_injury: 'Player Injuries',
  game_starting: 'Game Starting',
    lineup_not_set: 'Lineup Reminders',
  trade_deadline: 'Trade Deadline',
    score_update: 'Score Updates',
  commissioner_announcement: 'Commissioner News',
    general: 'General'
   }
  
  return names[type]
}

function getCategoryDescription(type: NotificationType); string { const descriptions: Record<NotificationType, string> = {
    trade_received: 'When someone sends you a trade proposal',
  trade_accepted: 'When your trade proposal is accepted',
    trade_rejected: 'When your trade proposal is rejected',
  waiver_processed: 'When your waiver claims are processed',
    player_injury: 'When players on your roster get injured',
  game_starting: 'Reminder when your players\' games are starting',
    lineup_not_set: 'Warning when your lineup is not optimized',
  trade_deadline: 'Alerts about approaching trade deadlines',
    score_update: 'Updates about your matchup scores',
  commissioner_announcement: 'Important league announcements',
    general: 'Other notifications'
   }
  
  return descriptions[type]
}

function getRelativeTime(date: Date); string { const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60) }m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}

// Utility functions for other components to use
export function useNotificationHelpers() { const { addNotification  } = useNotifications()
  
  const notifyTradeReceived = useCallback((fromUser, string;
  players: string[]) => {
    addNotification({
type: 'trade_received',
  title: 'New Trade Proposal',
      message: `${fromUser} wants to trade for ${players.join(', ')}`,
      priority: 'high',
  actionUrl: '/trades',
      actionText: 'View Trade',
  groupId: 'trade-proposals'
    })
  }, [addNotification])
  
  const notifyWaiverProcessed = useCallback((player, string;
  successful: boolean) => {
    addNotification({
type: 'waiver_processed',
  title: successful ? 'Waiver Claim Successful' : 'Waiver Claim Failed',
      message: successful 
        ? `You successfully claimed ${player}` : `Your claim for ${player} was unsuccessful`,
      priority: successful ? 'high' : 'medium',
  actionUrl: '/waiver',
      actionText: 'View Waiver Wire'
    })
  }, [addNotification])
  
  const notifyPlayerInjury = useCallback((player, string;
  injury: string) => {
    addNotification({
type: 'player_injury',
  title: 'Player Injury Alert',
      message: `${player} has been listed as ${injury}`,
      priority: 'high',
  actionUrl: '/roster',
      actionText: 'Update Lineup'
    })
  }, [addNotification])
  
  const notifyLineupNotSet = useCallback((gameTime: Date) => {
    addNotification({
type: 'lineup_not_set',
  title: 'Lineup Warning',
      message: `Games start at ${gameTime.toLocaleTimeString()} - make sure your lineup is set!`,
      priority: 'high',
  actionUrl: '/roster',
      actionText: 'Set Lineup'
    })
  }, [addNotification])
  
  return { notifyTradeReceived, notifyWaiverProcessed, notifyPlayerInjury,
    notifyLineupNotSet
:   }
}