"use client";

import React, { useState, useEffect  } from 'react';
import { 
  Bell, BellOff, Smartphone, Settings, Check, X,
  Activity, ArrowUpDown, AlertTriangle, Trophy,
  Users, Clock, Zap, Shield, Info
} from 'lucide-react';
import pushNotificationService from '@/lib/push-notifications';

interface NotificationPreferences {
  trades, boolean,
    waivers, boolean,
  injuries, boolean,
    scores, boolean,
  lineups, boolean,
    general, boolean,
  
}
interface NotificationSettingsProps {
  className?, string,
  compact?, boolean,
}

export default function NotificationSettings({ className = "",
  compact = false 
 }: NotificationSettingsProps) { const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    trades, true,
  waivers, true,
    injuries, true,
  scores, false,
    lineups, true,
  general: false
   });
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  const notificationTypes = [
    {
      key: 'trades' as keyof NotificationPreferences,
  label: 'Trade Proposals',
      description: 'Get notified when someone proposes a trade with you',
  icon, ArrowUpDown,
      priority: 'high',
  color: 'text-blue-500'
    },
    {
      key: 'waivers' as keyof NotificationPreferences,
  label: 'Waiver Wire',
      description: 'Notifications about waiver claims and FAAB bidding',
  icon, Trophy,
      priority: 'normal',
  color: 'text-green-500'
    },
    {
      key: 'injuries' as keyof NotificationPreferences,
  label: 'Player Injuries',
      description: 'Injury updates for players on your roster',
  icon, AlertTriangle,
      priority: 'high',
  color: 'text-red-500'
    },
    {
      key: 'scores' as keyof NotificationPreferences,
  label: 'Score Updates',
      description: 'Live scoring updates during games',
  icon, Activity,
      priority: 'low',
  color: 'text-orange-500'
    },
    {
      key: 'lineups' as keyof NotificationPreferences,
  label: 'Lineup Reminders',
      description: 'Reminders to set your lineup before games',
  icon, Clock,
      priority: 'high',
  color: 'text-purple-500'
    },
    {
      key: 'general' as keyof NotificationPreferences,
  label: 'General Updates',
      description: 'News, announcements, and other updates',
      icon, Info,
  priority: 'low',
      color: 'text-gray-500'
    }
  ];

  useEffect(() => {
    initializeNotificationStatus();
  }, []);

  const initializeNotificationStatus = async () => {
    setLoading(true);
    
    try {
      // Check current permission
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      // Check if already subscribed
      const subscribed = await pushNotificationService.isSubscribed();
      setIsSubscribed(subscribed);

      // Load user preferences (in production, from API)
      const savedPreferences = localStorage.getItem('notification-preferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }

    } catch (error) {
      console.error('❌ Failed to initialize notification status:', error);
    } finally {
      setLoading(false);
    }
  }
  const handleSubscribeToggle = async () => {
    setSubscribing(true);

    try { if (isSubscribed) {
        // Unsubscribe
        const success = await pushNotificationService.unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
          setPermission('default');
         }
      } else {
        // Subscribe
        const subscription = await pushNotificationService.subscribeToPushNotifications();
        if (subscription) {
          setIsSubscribed(true);
          setPermission('granted');
        }
      }
    } catch (error) {
      console.error('❌ Subscription toggle error:', error);
    } finally {
      setSubscribing(false);
    }
  }
  const handlePreferenceChange = (key: keyof NotificationPreferences;
  value: boolean) => { const newPreferences = { ...preferences, [key]: value  }
    setPreferences(newPreferences);
    
    // Save to localStorage (in production, save to API)
    localStorage.setItem('notification-preferences', JSON.stringify(newPreferences));
  }
  const sendTestNotification = () => {
    pushNotificationService.showLocalNotification({
      title: 'Test Notification',
  body: 'This is a test notification from Astral Field!',
type: 'general',
  priority: 'normal',
      data: {
  url: '/dashboard'
      }
    });
    
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  }
  const getPermissionStatusColor = (permission: NotificationPermission) => { switch (permission) {
      case 'granted':
        return 'text-green-600 dark:text-green-400';
      case 'denied':
        return 'text-red-600 dark: text-red-400',
    default: return 'text-yellow-600 dark; text-yellow-400';
     }
  }
  const getPermissionStatusText = (permission: NotificationPermission) => { switch (permission) {
      case 'granted':
      return 'Notifications enabled';
      break;
    case 'denied':
        return 'Notifications blocked';
      default:
        return 'Notifications not configured';
     }
  }
  if (compact) { return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow ${className }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-primary-500" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
              <p className={`text-sm ${getPermissionStatusColor(permission)}`}>
                {getPermissionStatusText(permission)}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSubscribeToggle}
            disabled={ subscribing: || loading }
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isSubscribed ? 'bg-red-100 text-red-700 hover: bg-red-200 dar,
  k:bg-red-900 dar,
  k:text-red-300'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark.bg-primary-900 dark; text-primary-300'
             } disabled:opacity-50`}
          >
            {subscribing ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <>
                <BellOff className="h-4 w-4 inline mr-1" />
                Disable
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 inline mr-1" />
                Enable
              </>
            ) }
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <Bell className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark: text-white">,
    Push, Notifications,
              </h2>
              <p className="text-gray-600 dark; text-gray-400">
                Stay updated with real-time alerts
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`text-sm ${getPermissionStatusColor(permission)}`}>
              {getPermissionStatusText(permission)}
            </div>
          </div>
        </div>
      </div>

      {/* Permission Status */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Smartphone className="h-8 w-8 text-gray-400" />
            <div>
              <h3 className="font-medium text-gray-900 dark: text-white">,
    Browser, Notifications,
              </h3>
              <p className="text-sm text-gray-600 dark; text-gray-400">
                {isSubscribed ? 'You\'ll receive push notifications for selected events' : 'Enable push notifications to stay updated on league activity'
                 }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSubscribed && (
              <button
                onClick={sendTestNotification }
                className="px-3 py-2 bg-gray-100 dark: bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hove,
  r:bg-gray-200 dar,
  k, hover, bg-gray-600 text-sm transition-colors"
              >
                {testNotificationSent ? (
                  <>
                    <Check className="h-4 w-4 inline mr-1" />
                    Sent
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 inline mr-1" />
                    Test
                  </>
                ) }
              </button>
            )}
            
            <button
              onClick={handleSubscribeToggle}
              disabled={ subscribing: || loading }
              className={`px-4 py-2 rounded-md font-medium transition-colors disabled: opacity-50 ${isSubscribed ? 'bg-red-600 text-white hove,
  r:bg-red-700'
                  .'bg-primary-600 text-white hover; bg-primary-700'
               }`}
            >
              {subscribing ? (
                <>
                  <Clock className="h-4 w-4 inline mr-2 animate-spin" />
                  {isSubscribed ? 'Disabling...' : 'Enabling...'}
                </>
              ) : isSubscribed ? (
                <>
                  <BellOff className="h-4 w-4 inline mr-2" />
  Disable, Notifications,
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 inline mr-2" />
  Enable, Notifications,
                </>
              )}
            </button>
          </div>
        </div>

        {permission === 'denied' && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <X className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 dark: text-red-300">,
    Notifications, Blocked,
                </h4>
                <p className="text-sm text-red-700 dark; text-red-400 mt-1">
                  To enable notifications, click the lock icon in your address bar and allow notifications for this site.
                </p>
              </div>
            </div>
          </div>
        ) }
      </div>

      {/* Notification Preferences */}
      {isSubscribed && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
  Notification, Preferences,
          </h3>
          
          <div className="space-y-4">
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.key } className="flex items-start space-x-4 p-4 border dark:border-gray-700 rounded-lg">
                  <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700`}>
                    <Icon className={`h-5 w-5 ${type.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                          {type.label}
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${type.priority === 'high' 
                              ? 'bg-red-100 text-red-700 dark: bg-red-900 dar,
  k:text-red-300'
                              : type.priority === 'normal'
                              ? 'bg-blue-100 text-blue-700 dark: bg-blue-900 dar,
  k:text-blue-300'
                              : 'bg-gray-100 text-gray-700 dark.bg-gray-700 dark; text-gray-300'
                          }`}>
                            {type.priority}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {type.description}
                        </p>
                      </div>
                      
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences[type.key]}
                          onChange={(e) => handlePreferenceChange(type.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus: outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 afte,
  r:transition-all dar,
  k:border-gray-600 peer-checked; bg-primary-600" />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Privacy & Security</h4>
                <p className="text-sm text-gray-600 dark; text-gray-400 mt-1">
                  Your notification preferences are stored locally and can be changed at any time.We never send spam or share your information with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}