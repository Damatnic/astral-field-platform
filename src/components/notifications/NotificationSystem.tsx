/**
 * Real-Time Notification System
 * Handles live alerts for player injuries, scores, trades, waivers, and league announcements
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Notification {
  id: string;
  type: 'player_injury' | 'score_update' | 'trade_offer' | 'trade_completed' | 'waiver_result' | 'league_announcement' | 'mention' | 'celebration';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  data?: any;
  createdAt: string;
  expiresAt?: string;
}

interface NotificationSystemProps {
  userId: string;
  leagueIds: string[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

const NOTIFICATION_SOUNDS = {
  low: '/sounds/notification-soft.mp3',
  medium: '/sounds/notification-medium.mp3',
  high: '/sounds/notification-high.mp3',
  urgent: '/sounds/notification-urgent.mp3'
};

const NOTIFICATION_ICONS = {
  player_injury: '🚑',
  score_update: '🏈',
  trade_offer: '🔄',
  trade_completed: '✅',
  waiver_result: '📝',
  league_announcement: '📢',
  mention: '💬',
  celebration: '🎉'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-600/20 border-gray-500/30',
  medium: 'bg-blue-600/20 border-blue-500/30',
  high: 'bg-yellow-600/20 border-yellow-500/30',
  urgent: 'bg-red-600/20 border-red-500/30'
};

const PRIORITY_DURATIONS = {
  low: 5000,
  medium: 8000,
  high: 12000,
  urgent: 20000
};

export default function NotificationSystem({ 
  userId, 
  leagueIds, 
  position = 'top-right',
  maxVisible = 5
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { isConnected, on, off } = useWebSocket();

  // Load user preferences and existing notifications
  useEffect(() => {
    loadNotifications();
    loadUserPreferences();
  }, [userId]);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!isConnected) return;

    const handleNotification = (notification: Notification) => {
      addNotification(notification);
    };

    const handlePlayerInjury = (data: {
      playerId: string;
      playerName: string;
      injury: string;
      severity: 'questionable' | 'doubtful' | 'out';
      affectedTeams: string[];
    }) => {
      if (data.affectedTeams.some(teamId => leagueIds.includes(teamId))) {
        addNotification({
          id: `injury-${data.playerId}-${Date.now()}`,
          type: 'player_injury',
          title: `${data.playerName} Injury Update`,
          message: `${data.playerName} is ${data.severity} with ${data.injury}`,
          priority: data.severity === 'out' ? 'urgent' : 'high',
          isRead: false,
          data,
          createdAt: new Date().toISOString()
        });
      }
    };

    const handleScoreUpdate = (data: {
      leagueId: string;
      teamId: string;
      playerId: string;
      playerName: string;
      points: number;
      change: number;
      playDescription?: string;
    }) => {
      if (leagueIds.includes(data.leagueId) && Math.abs(data.change) >= 10) {
        addNotification({
          id: `score-${data.playerId}-${Date.now()}`,
          type: 'score_update',
          title: `Big Play Alert!`,
          message: `${data.playerName} just scored ${data.change > 0 ? '+' : ''}${data.change} points!`,
          priority: Math.abs(data.change) >= 20 ? 'urgent' : 'high',
          isRead: false,
          data,
          createdAt: new Date().toISOString()
        });
      }
    };

    const handleTradeOffer = (data: {
      tradeId: string;
      leagueId: string;
      fromTeam: string;
      toTeam: string;
      fromTeamName: string;
      toTeamName: string;
      playersOffered: string[];
      playersRequested: string[];
    }) => {
      if (leagueIds.includes(data.leagueId) && (data.toTeam === userId || data.fromTeam === userId)) {
        addNotification({
          id: `trade-${data.tradeId}`,
          type: 'trade_offer',
          title: 'New Trade Offer',
          message: `${data.fromTeam === userId ? data.toTeamName : data.fromTeamName} sent you a trade offer`,
          priority: 'high',
          isRead: false,
          data,
          createdAt: new Date().toISOString()
        });
      }
    };

    const handleWaiverResult = (data: {
      leagueId: string;
      teamId: string;
      playerId: string;
      playerName: string;
      result: 'claimed' | 'failed';
      priority: number;
    }) => {
      if (leagueIds.includes(data.leagueId) && data.teamId === userId) {
        addNotification({
          id: `waiver-${data.playerId}-${Date.now()}`,
          type: 'waiver_result',
          title: `Waiver ${data.result === 'claimed' ? 'Successful' : 'Failed'}`,
          message: data.result === 'claimed' 
            ? `You successfully claimed ${data.playerName}`
            : `Your waiver claim for ${data.playerName} failed`,
          priority: data.result === 'claimed' ? 'medium' : 'low',
          isRead: false,
          data,
          createdAt: new Date().toISOString()
        });
      }
    };

    const handleMention = (data: {
      leagueId: string;
      senderId: string;
      senderUsername: string;
      message: string;
      roomType: string;
    }) => {
      if (leagueIds.includes(data.leagueId)) {
        addNotification({
          id: `mention-${data.senderId}-${Date.now()}`,
          type: 'mention',
          title: `${data.senderUsername} mentioned you`,
          message: data.message.substring(0, 100),
          priority: 'medium',
          isRead: false,
          data,
          createdAt: new Date().toISOString()
        });
      }
    };

    const handleCelebration = (data: {
      leagueId: string;
      userId: string;
      username: string;
      type: 'touchdown' | 'victory' | 'milestone';
      message: string;
    }) => {
      if (leagueIds.includes(data.leagueId) && data.userId !== userId) {
        addNotification({
          id: `celebration-${data.userId}-${Date.now()}`,
          type: 'celebration',
          title: `${data.username} is celebrating! 🎉`,
          message: data.message,
          priority: 'low',
          isRead: false,
          data,
          createdAt: new Date().toISOString()
        });
      }
    };

    on('notification', handleNotification);
    on('player_injury', handlePlayerInjury);
    on('score_update', handleScoreUpdate);
    on('trade_offer', handleTradeOffer);
    on('waiver_result', handleWaiverResult);
    on('mention', handleMention);
    on('celebration', handleCelebration);

    return () => {
      off('notification', handleNotification);
      off('player_injury', handlePlayerInjury);
      off('score_update', handleScoreUpdate);
      off('trade_offer', handleTradeOffer);
      off('waiver_result', handleWaiverResult);
      off('mention', handleMention);
      off('celebration', handleCelebration);
    };
  }, [isConnected, userId, leagueIds]);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const preferences = await response.json();
        setSoundEnabled(preferences.notificationSounds !== false);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => {
      const exists = prev.find(n => n.id === notification.id);
      if (exists) return prev;
      
      return [notification, ...prev].slice(0, 50); // Keep last 50 notifications
    });

    setUnreadCount(prev => prev + 1);

    // Show notification if not minimized
    if (!isMinimized) {
      setVisibleNotifications(prev => {
        const newVisible = [notification.id, ...prev].slice(0, maxVisible);
        
        // Auto-hide after duration
        setTimeout(() => {
          setVisibleNotifications(current => 
            current.filter(id => id !== notification.id)
          );
        }, PRIORITY_DURATIONS[notification.priority]);
        
        return newVisible;
      });
    }

    // Play sound if enabled
    if (soundEnabled && notification.priority !== 'low') {
      playNotificationSound(notification.priority);
    }
  }, [isMinimized, maxVisible, soundEnabled]);

  const playNotificationSound = (priority: string) => {
    try {
      const audio = new Audio(NOTIFICATION_SOUNDS[priority as keyof typeof NOTIFICATION_SOUNDS]);
      audio.volume = 0.3;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = (notificationId: string) => {
    setVisibleNotifications(prev => prev.filter(id => id !== notificationId));
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Handle specific notification actions
    switch (notification.type) {
      case 'trade_offer':
        window.location.href = `/leagues/${notification.data?.leagueId}/trades`;
        break;
      case 'mention':
        window.location.href = `/leagues/${notification.data?.leagueId}/chat`;
        break;
      case 'player_injury':
        window.location.href = `/players/${notification.data?.playerId}`;
        break;
      default:
        // Generic action - just mark as read
        break;
    }
  };

  if (isMinimized) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors relative"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {Math.min(unreadCount, 99)}
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 w-80 max-w-sm`}>
      {/* Notification Panel Header */}
      <div className="mb-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1 rounded transition-colors ${
              soundEnabled ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-gray-400'
            }`}
            title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Minimize"
          >
            ➖
          </button>
        </div>
      </div>

      {/* Visible Notifications */}
      <div className="space-y-2">
        {visibleNotifications.map(notificationId => {
          const notification = notifications.find(n => n.id === notificationId);
          if (!notification) return null;

          return (
            <div
              key={notification.id}
              className={`${PRIORITY_COLORS[notification.priority]} backdrop-blur-sm rounded-lg p-4 border cursor-pointer transition-all duration-300 hover:shadow-lg animate-slideInRight`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-xl flex-shrink-0">
                    {NOTIFICATION_ICONS[notification.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white text-sm truncate">
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notification.id);
                  }}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mt-2 p-2 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Reconnecting...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// CSS for animations (add to global styles)
const styles = `
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slideInRight {
  animation: slideInRight 0.3s ease-out;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`;