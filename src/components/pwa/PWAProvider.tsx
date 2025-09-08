'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import PWAManager, { PWAStatus, PWAConfig } from '../../services/pwa/pwaManager';
import { toast } from 'react-hot-toast';

interface PWAContextType {
  pwaManager: PWAManager;
  status: PWAStatus | null;
  isLoading: boolean;
  installApp: () => Promise<boolean>;
  requestNotifications: () => Promise<NotificationPermission>;
  subscribeToNotifications: () => Promise<PushSubscription | null>;
  unsubscribeFromNotifications: () => Promise<boolean>;
}

const PWAContext = createContext<PWAContextType | null>(null);

interface PWAProviderProps {
  children: ReactNode;
  config?: Partial<PWAConfig>;
}

export default function PWAProvider({ children, config }: PWAProviderProps) {
  const [pwaManager] = useState(() => PWAManager.getInstance());
  const [status, setStatus] = useState<PWAStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializePWA = async () => {
      try {
        console.log('🚀 Initializing PWA...');
        setIsLoading(true);

        // Initialize PWA Manager with configuration
        const success = await pwaManager.initialize(config);
        
        if (!mounted) return;

        if (success) {
          const currentStatus = await pwaManager.getStatus();
          setStatus(currentStatus);
          setIsInitialized(true);
          console.log('✅ PWA initialized successfully', currentStatus);
        } else {
          console.warn('⚠️ PWA initialization failed, some features may not work');
          // Set a basic status for graceful degradation
          setStatus({
            isInstalled: false,
            isOnline: navigator.onLine,
            serviceWorkerRegistered: false,
            offlineStorageReady: false,
            pushNotificationsEnabled: false,
            touchOptimizationsActive: false,
            performanceMonitoringActive: false,
            backgroundSyncActive: false,
            cacheSize: 0,
            syncQueueSize: 0
          });
        }
      } catch (error) {
        console.error('❌ PWA initialization error:', error);
        if (mounted) {
          // Graceful degradation
          setStatus({
            isInstalled: false,
            isOnline: navigator.onLine,
            serviceWorkerRegistered: false,
            offlineStorageReady: false,
            pushNotificationsEnabled: false,
            touchOptimizationsActive: false,
            performanceMonitoringActive: false,
            backgroundSyncActive: false,
            cacheSize: 0,
            syncQueueSize: 0
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Only initialize on client side
    if (typeof window !== 'undefined') {
      initializePWA();
    } else {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [pwaManager, config]);

  useEffect(() => {
    if (!isInitialized) return;

    // Set up event listeners for PWA events
    const handlePWAReady = (event: CustomEvent) => {
      console.log('🎉 PWA is ready!', event.detail);
      toast.success('App is ready for offline use!', {
        duration: 3000,
        position: 'bottom-center',
      });
    };

    const handleNetworkStatusChange = (isOnline: boolean) => {
      if (isOnline) {
        toast.success('📶 Connection restored - syncing data...', {
          duration: 2000,
          position: 'bottom-center',
        });
      } else {
        toast('📵 Offline mode - changes will sync when reconnected', {
          duration: 4000,
          position: 'bottom-center',
          icon: '📵',
        });
      }
    };

    const handleSyncSuccess = (event: CustomEvent) => {
      const { count } = event.detail;
      if (count > 0) {
        toast.success(`✅ Synced ${count} changes successfully!`, {
          duration: 2000,
          position: 'bottom-center',
        });
      }
    };

    const handleSyncFailure = (event: CustomEvent) => {
      toast.error('❌ Some changes failed to sync. Will retry automatically.', {
        duration: 4000,
        position: 'bottom-center',
      });
    };

    const handleOfflineNotification = (event: CustomEvent) => {
      const { message } = event.detail;
      toast(message, {
        duration: 3000,
        position: 'bottom-center',
        icon: '📱',
      });
    };

    const handleMemoryCleanup = () => {
      console.log('🧹 Memory cleanup performed');
    };

    const handleAppUpdate = () => {
      toast('🔄 App update available! Reload to get the latest version.', {
        duration: 0, // Persistent
        position: 'top-center',
        style: {
          background: '#3B82F6',
          color: 'white',
        },
      });
    };

    // Event listeners
    window.addEventListener('pwa-ready', handlePWAReady as EventListener);
    window.addEventListener('online', () => handleNetworkStatusChange(true));
    window.addEventListener('offline', () => handleNetworkStatusChange(false));
    window.addEventListener('show-sync-success', handleSyncSuccess as EventListener);
    window.addEventListener('sync-permanent-failure', handleSyncFailure as EventListener);
    window.addEventListener('show-offline-notification', handleOfflineNotification as EventListener);
    window.addEventListener('memory-cleanup', handleMemoryCleanup);
    window.addEventListener('pwa-update-available', handleAppUpdate);

    return () => {
      window.removeEventListener('pwa-ready', handlePWAReady as EventListener);
      window.removeEventListener('online', () => handleNetworkStatusChange(true));
      window.removeEventListener('offline', () => handleNetworkStatusChange(false));
      window.removeEventListener('show-sync-success', handleSyncSuccess as EventListener);
      window.removeEventListener('sync-permanent-failure', handleSyncFailure as EventListener);
      window.removeEventListener('show-offline-notification', handleOfflineNotification as EventListener);
      window.removeEventListener('memory-cleanup', handleMemoryCleanup);
      window.removeEventListener('pwa-update-available', handleAppUpdate);
    };
  }, [isInitialized]);

  // Context methods
  const installApp = async (): Promise<boolean> => {
    try {
      const installed = await pwaManager.installApp();
      if (installed) {
        toast.success('🎉 App installed successfully!', {
          duration: 3000,
          position: 'bottom-center',
        });
        // Update status
        const newStatus = await pwaManager.getStatus();
        setStatus(newStatus);
      }
      return installed;
    } catch (error) {
      console.error('Failed to install app:', error);
      toast.error('Failed to install app. Please try again.', {
        duration: 3000,
        position: 'bottom-center',
      });
      return false;
    }
  };

  const requestNotifications = async (): Promise<NotificationPermission> => {
    try {
      const permission = await pwaManager.requestNotificationPermission();
      
      if (permission === 'granted') {
        toast.success('🔔 Notifications enabled!', {
          duration: 2000,
          position: 'bottom-center',
        });
      } else if (permission === 'denied') {
        toast.error('🔕 Notifications blocked. Enable in browser settings.', {
          duration: 4000,
          position: 'bottom-center',
        });
      }
      
      // Update status
      const newStatus = await pwaManager.getStatus();
      setStatus(newStatus);
      
      return permission;
    } catch (error) {
      console.error('Failed to request notifications:', error);
      toast.error('Failed to enable notifications.', {
        duration: 3000,
        position: 'bottom-center',
      });
      return 'denied';
    }
  };

  const subscribeToNotifications = async (): Promise<PushSubscription | null> => {
    try {
      const subscription = await pwaManager.subscribeToNotifications();
      
      if (subscription) {
        toast.success('📱 Push notifications enabled!', {
          duration: 2000,
          position: 'bottom-center',
        });
        
        // Update status
        const newStatus = await pwaManager.getStatus();
        setStatus(newStatus);
      }
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      toast.error('Failed to enable push notifications.', {
        duration: 3000,
        position: 'bottom-center',
      });
      return null;
    }
  };

  const unsubscribeFromNotifications = async (): Promise<boolean> => {
    try {
      const unsubscribed = await pwaManager.unsubscribeFromNotifications();
      
      if (unsubscribed) {
        toast.success('🔕 Notifications disabled', {
          duration: 2000,
          position: 'bottom-center',
        });
        
        // Update status
        const newStatus = await pwaManager.getStatus();
        setStatus(newStatus);
      }
      
      return unsubscribed;
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      toast.error('Failed to disable notifications.', {
        duration: 3000,
        position: 'bottom-center',
      });
      return false;
    }
  };

  const contextValue: PWAContextType = {
    pwaManager,
    status,
    isLoading,
    installApp,
    requestNotifications,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      {/* Loading overlay for initial PWA setup */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-gray-700 dark:text-gray-300">Setting up app features...</span>
            </div>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}

// Hook to use PWA context
export function usePWA() {
  const context = useContext(PWAContext);
  
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  
  return context;
}

// Hook for offline status
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}

// Hook for PWA installation status
export function useInstallStatus() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };
    
    checkInstalled();
    
    // Listen for installation events
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setIsInstallable(true);
    };
    
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  return { isInstallable, isInstalled };
}