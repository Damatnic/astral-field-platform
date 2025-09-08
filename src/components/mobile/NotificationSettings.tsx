'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle,
  CheckCircle2,
  X,
  Settings,
  TrendingUp,
  Users,
  Shuffle,
  Calendar,
  MessageCircle,
  Info
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { TouchButton, PrimaryButton, SecondaryButton } from '@/components/mobile/TouchButton';
import { hapticFeedback } from '@/lib/mobile/touchOptimization';

interface NotificationSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const notificationTypes = [
  {
    key: 'scoreUpdates' as const,
    title: 'Live Score Updates',
    description: 'Get notified when your players score points',
    icon: TrendingUp,
    color: '#10B981',
    category: 'Game Updates'
  },
  {
    key: 'matchupReminders' as const,
    title: 'Matchup Reminders',
    description: 'Reminders before your weekly matchups start',
    icon: Calendar,
    color: '#3B82F6',
    category: 'Game Updates'
  },
  {
    key: 'waiverAlerts' as const,
    title: 'Waiver Wire Alerts',
    description: 'Updates on waiver claims and deadlines',
    icon: Shuffle,
    color: '#F59E0B',
    category: 'League Management'
  },
  {
    key: 'tradeNotifications' as const,
    title: 'Trade Notifications',
    description: 'New trade proposals and trade completions',
    icon: Users,
    color: '#8B5CF6',
    category: 'League Management'
  },
  {
    key: 'draftReminders' as const,
    title: 'Draft Reminders',
    description: 'Alerts for upcoming draft sessions',
    icon: Calendar,
    color: '#EF4444',
    category: 'Draft'
  },
  {
    key: 'chatMessages' as const,
    title: 'Chat Messages',
    description: 'New messages in league chat',
    icon: MessageCircle,
    color: '#06B6D4',
    category: 'Social'
  },
  {
    key: 'general' as const,
    title: 'General Updates',
    description: 'Important announcements and app updates',
    icon: Info,
    color: '#6B7280',
    category: 'System'
  }
];

export default function NotificationSettings({ 
  isOpen = true, 
  onClose, 
  className = '' 
}: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
    clearError,
    canSubscribe,
    canUnsubscribe,
    needsPermission,
    isBlocked
  } = usePushNotifications();

  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleNotification = async (key: keyof typeof preferences) => {
    hapticFeedback('light');
    
    try {
      await updatePreferences({ [key]: !preferences[key] });
    } catch (error) {
      console.error('Failed to update notification preference:', error);
    }
  };

  const handleSubscribe = async () => {
    hapticFeedback('medium');
    
    try {
      if (needsPermission) {
        await requestPermission();
      } else {
        await subscribe();
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  const handleUnsubscribe = async () => {
    hapticFeedback('medium');
    
    try {
      await unsubscribe();
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  };

  const handleTestNotification = async () => {
    hapticFeedback('light');
    
    try {
      await sendTestNotification();
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 3000);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const getStatusColor = () => {
    if (isBlocked) return '#EF4444';
    if (isSubscribed) return '#10B981';
    if (needsPermission) return '#F59E0B';
    return '#6B7280';
  };

  const getStatusText = () => {
    if (isBlocked) return 'Blocked';
    if (isSubscribed) return 'Active';
    if (needsPermission) return 'Permission Needed';
    if (!isSupported) return 'Not Supported';
    return 'Disabled';
  };

  const groupedNotifications = notificationTypes.reduce((acc, notification) => {
    if (!acc[notification.category]) {
      acc[notification.category] = [];
    }
    acc[notification.category].push(notification);
    return acc;
  }, {} as Record<string, typeof notificationTypes>);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={`
            bg-gray-900 rounded-t-3xl sm:rounded-3xl 
            border border-gray-800 shadow-2xl
            w-full max-w-md max-h-[90vh] overflow-hidden
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${getStatusColor()}20` }}
              >
                {isSubscribed ? (
                  <Bell className="w-5 h-5" style={{ color: getStatusColor() }} />
                ) : (
                  <BellOff className="w-5 h-5" style={{ color: getStatusColor() }} />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Notifications</h2>
                <p className="text-sm text-gray-400">{getStatusText()}</p>
              </div>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-medium">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-red-400 text-sm underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}

            {/* Not Supported */}
            {!isSupported && (
              <div className="p-6">
                <div className="text-center">
                  <Smartphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Notifications Not Supported
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Your browser doesn't support push notifications. Try using a modern browser or updating your current one.
                  </p>
                </div>
              </div>
            )}

            {/* Blocked */}
            {isBlocked && (
              <div className="p-6">
                <div className="text-center">
                  <BellOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Notifications Blocked
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    You've blocked notifications for this site. To enable them, click the lock icon in your browser's address bar and allow notifications.
                  </p>
                </div>
              </div>
            )}

            {/* Main Controls */}
            {isSupported && !isBlocked && (
              <div className="p-6 space-y-6">
                {/* Enable/Disable Notifications */}
                <div className="space-y-4">
                  {needsPermission && (
                    <div className="text-center">
                      <Bell className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">
                        Stay Updated
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Enable notifications to get real-time updates about your fantasy teams, trades, and more.
                      </p>
                    </div>
                  )}

                  {canSubscribe && (
                    <PrimaryButton
                      onClick={handleSubscribe}
                      loading={isLoading}
                      fullWidth
                      icon={Bell}
                      haptic="medium"
                    >
                      Enable Notifications
                    </PrimaryButton>
                  )}

                  {canUnsubscribe && (
                    <div className="space-y-3">
                      <SecondaryButton
                        onClick={handleUnsubscribe}
                        loading={isLoading}
                        fullWidth
                        icon={BellOff}
                        haptic="medium"
                      >
                        Disable All Notifications
                      </SecondaryButton>

                      <TouchButton
                        onClick={handleTestNotification}
                        variant="ghost"
                        size="sm"
                        fullWidth
                        disabled={testNotificationSent}
                        icon={testNotificationSent ? CheckCircle2 : Smartphone}
                        haptic="light"
                      >
                        {testNotificationSent ? 'Test Sent!' : 'Send Test Notification'}
                      </TouchButton>
                    </div>
                  )}
                </div>

                {/* Notification Preferences */}
                {isSubscribed && (
                  <div className="space-y-6">
                    {Object.entries(groupedNotifications).map(([category, notifications]) => (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                          {category}
                        </h4>
                        
                        <div className="space-y-3">
                          {notifications.map((notification) => {
                            const Icon = notification.icon;
                            const isEnabled = preferences[notification.key];
                            
                            return (
                              <motion.button
                                key={notification.key}
                                onClick={() => handleToggleNotification(notification.key)}
                                className="w-full flex items-center space-x-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors touch-manipulation"
                                whileTap={{ scale: 0.98 }}
                              >
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${notification.color}20` }}
                                >
                                  <Icon 
                                    className="w-5 h-5" 
                                    style={{ color: notification.color }}
                                  />
                                </div>
                                
                                <div className="flex-1 text-left">
                                  <p className="text-white font-medium">
                                    {notification.title}
                                  </p>
                                  <p className="text-gray-400 text-sm">
                                    {notification.description}
                                  </p>
                                </div>
                                
                                <motion.div
                                  animate={{ rotate: isEnabled ? 0 : 180 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {isEnabled ? (
                                    <ToggleRight 
                                      className="w-8 h-8 text-blue-400" 
                                    />
                                  ) : (
                                    <ToggleLeft 
                                      className="w-8 h-8 text-gray-600" 
                                    />
                                  )}
                                </motion.div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Advanced Settings */}
                    <div>
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Advanced Settings</span>
                      </button>

                      <AnimatePresence>
                        {showAdvanced && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-gray-800/30 rounded-xl"
                          >
                            <div className="space-y-3 text-sm text-gray-400">
                              <p><strong>Browser:</strong> {navigator.userAgent.split(' ')[0]}</p>
                              <p><strong>Permission:</strong> {permission}</p>
                              <p><strong>Subscribed:</strong> {isSubscribed ? 'Yes' : 'No'}</p>
                              <p><strong>Service Worker:</strong> {'serviceWorker' in navigator ? 'Supported' : 'Not Supported'}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}