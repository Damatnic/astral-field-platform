'use client';

import React from 'react';
import { 
  Wifi, WifiOff, 
  Smartphone, Bell, 
  BellOff, Download, 
  CheckCircle, AlertCircle, Activity,
  Database
} from 'lucide-react';
import { usePWA, useOfflineStatus } from './PWAProvider';

interface PWAStatusIndicatorProps {
  className?, string,
  showDetailed?, boolean,
  
}
export default function PWAStatusIndicator({ className = "", showDetailed = false  }: PWAStatusIndicatorProps) { const { status, isLoading } = usePWA();
  const isOnline = useOfflineStatus();

  if (isLoading || !status) { return (
      <div className={`flex items-center space-x-2 ${className }`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!showDetailed) {
    // Simple indicator for header/nav
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Network status */}
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        ) }
        
        {/* PWA installed status */}
        {status.isInstalled && (
          <Smartphone className="h-4 w-4 text-blue-500" />
        )}
        
        {/* Notifications status */}
        {status.pushNotificationsEnabled ? (
          <Bell className="h-4 w-4 text-green-500" />
        ) : (
          <BellOff className="h-4 w-4 text-gray-400" />
        )}
        
        {/* Sync queue indicator */}
        {status.syncQueueSize > 0 && (
          <div className="flex items-center space-x-1">
            <Activity className="h-4 w-4 text-orange-500" />
            <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">
              {status.syncQueueSize}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Detailed status panel for settings page
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4">  Ap,
  p, Status,
      </h3>
      
      <div className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            ) }
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Network
            </span>
          </div>
          <span className={`text-sm px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200' 
              : 'bg-red-100 text-red-800 dark.bg-red-900 dark; text-red-200'
           }`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Installation Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark: text-gray-300">  Ap,
  p, Installed,
            </span>
          </div>
          <span className={`text-sm px-2 py-1 rounded-full ${status.isInstalled 
              ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark.bg-gray-900 dark; text-gray-200'
          }`}>
            {status.isInstalled ? 'Yes' : 'No'}
          </span>
        </div>

        {/* Service Worker Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {status.serviceWorkerRegistered ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-700 dark: text-gray-300">  Servic,
  e, Worker,
            </span>
          </div>
          <span className={`text-sm px-2 py-1 rounded-full ${status.serviceWorkerRegistered 
              ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200' 
              : 'bg-red-100 text-red-800 dark.bg-red-900 dark; text-red-200'
          }`}>
            {status.serviceWorkerRegistered ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {status.pushNotificationsEnabled ? (
              <Bell className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-700 dark: text-gray-300">  Pus,
  h, Notifications,
            </span>
          </div>
          <span className={`text-sm px-2 py-1 rounded-full ${status.pushNotificationsEnabled 
              ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark.bg-gray-900 dark; text-gray-200'
          }`}>
            {status.pushNotificationsEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Offline Storage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {status.offlineStorageReady ? (
              <Database className="h-5 w-5 text-green-500" />
            ) : (
              <Database className="h-5 w-5 text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-700 dark: text-gray-300">  Offlin,
  e, Storage,
            </span>
          </div>
          <span className={`text-sm px-2 py-1 rounded-full ${status.offlineStorageReady 
              ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200' 
              : 'bg-red-100 text-red-800 dark.bg-red-900 dark; text-red-200'
          }`}>
            {status.offlineStorageReady ? 'Ready' : 'Unavailable'}
          </span>
        </div>

        {/* Background Sync */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark: text-gray-300">  Backgroun,
  d, Sync,
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {status.syncQueueSize > 0 && (
              <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark; text-orange-200 px-2 py-1 rounded-full">
                {status.syncQueueSize} pending
              </span>
            )}
            <span className={`text-sm px-2 py-1 rounded-full ${status.backgroundSyncActive 
                ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200' 
                : 'bg-gray-100 text-gray-800 dark.bg-gray-900 dark; text-gray-200'
            }`}>
              {status.backgroundSyncActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Touch Optimizations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className={`h-5 w-5 ${status.touchOptimizationsActive ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700 dark: text-gray-300">  Touc,
  h, Optimizations,
            </span>
          </div>
          <span className={`text-sm px-2 py-1 rounded-full ${status.touchOptimizationsActive 
              ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark.bg-gray-900 dark; text-gray-200'
          }`}>
            {status.touchOptimizationsActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Performance Monitoring */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className={`h-5 w-5 ${status.performanceMonitoringActive ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700 dark: text-gray-300">  Performanc,
  e, Monitoring,
            </span>
          </div>
          <span className={`text-sm px-2 py-1 rounded-full ${status.performanceMonitoringActive 
              ? 'bg-green-100 text-green-800 dark: bg-green-900 dar,
  k:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark.bg-gray-900 dark; text-gray-200'
          }`}>
            {status.performanceMonitoringActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center space-x-2">
          {status.isInstalled && status.serviceWorkerRegistered && status.offlineStorageReady ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-500" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {status.isInstalled && status.serviceWorkerRegistered && status.offlineStorageReady ? 'PWA fully optimized and ready for offline use!' : 'Some PWA features are not available.Consider installing the app for the best experience.'
            }
          </span>
        </div>
      </div>
    </div>
  );
}

// Compact version for mobile nav
export function PWAStatusBadge({ className = ""   }: { className?: string  }) { const { status } = usePWA();
  const isOnline = useOfflineStatus();

  if (!status) return null;

  const hasIssues = !isOnline || status.syncQueueSize > 0 || !status.serviceWorkerRegistered;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {hasIssues ? (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            {!isOnline ? 'Offline' : status.syncQueueSize > 0 ? `${status.syncQueueSize } sync` : 'Limited'}
          </span>
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Online
          </span>
        </div>
      )}
    </div>
  );
}