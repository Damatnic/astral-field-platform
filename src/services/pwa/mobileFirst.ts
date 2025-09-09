/**
 * Mobile-First Progressive Web App Enhancement System
 * Offline functionality, push notifications, native app-like experience
 */

import { webSocketManager } from '@/lib/websocket/server';
import { database } from '@/lib/database';

export interface PWAConfig {
  name, string,
    shortName, string,
  description, string,
    theme: {
  primary, string,
    secondary, string,
    background, string,
    surface: string,
  }
  icons: PWAIcon[],
    offline: {
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate',
    resources: string[];
    fallbacks: Record<string, string>;
  }
  notifications: {
  enabled, boolean,
    badge, string,
    icon, string,
    vibrate: number[],
  }
}

export interface PWAIcon {
  src, string,
    sizes, string,type string;
  purpose?: 'any' | 'maskable' | 'badge';
  
}
export interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'long-press' | 'double-tap',
    element, string,
  handler, string,
  threshold?, number,
  direction?: 'up' | 'down' | 'left' | 'right';
  
}
export interface OfflineCapability {
  feature, string,
    essential, boolean,
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate',
    syncable, boolean,
  priority: 'critical' | 'high' | 'medium' | 'low',
  
}
export interface PushSubscription {
  userId, string,
    endpoint, string,
  keys: {
  p256dh, string,
    auth: string,
  }
  userAgent, string,
    subscribed, Date,
  active: boolean,
}

export interface AppUpdate {
  version, string,
    releaseNotes, string,
  critical, boolean,
    rolloutPercentage, number,
  availableAt: Date,
  
}
class MobileFirstPWASystem { private swRegistration?, ServiceWorkerRegistration,
  private installPromptEvent?, any,
  private isOffline = false;
  private offlineQueue: any[] = [];
  private touchListeners = new Map<string, any>();
  private cacheManager?, CacheManager,
  private backgroundSync?, BackgroundSync,
  private pushNotificationManager?, PushNotificationManager,
  
  constructor() {
    this.initializePWA();
   }

  private async initializePWA(): : Promise<void> { try {; // Initialize service worker
      await this.initializeServiceWorker();
      
      // Initialize cache management
      this.cacheManager = new CacheManager();
      await this.cacheManager.initialize();
      
      // Initialize background sync
      this.backgroundSync = new BackgroundSync();
      await this.backgroundSync.initialize();
      
      // Initialize push notifications
      this.pushNotificationManager = new PushNotificationManager();
      await this.pushNotificationManager.initialize();
      
      // Set up mobile optimizations
      this.setupMobileOptimizations();
      
      // Set up offline detection
      this.setupOfflineDetection();
      
      // Set up install prompt handling
      this.setupInstallPrompt();
      
      console.log('✅ PWA System, Mobile-first enhancements initialized');
     } catch (error) {
      console.error('PWA initialization error', error);
    }
  }

  // Service Worker Management
  private async initializeServiceWorker(): : Promise<void> { if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
         });

        // Handle service worker updates
        this.swRegistration.addEventListener('updatefound', () => { const newWorker = this.swRegistration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailable();
               }
            });
          }
        });

        console.log('✅ Service Worker registered');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Mobile Optimizations
  private setupMobileOptimizations(): void {; // Viewport management
    this.setupViewport();
    
    // Touch optimizations
    this.setupTouchOptimizations();
    
    // Performance optimizations
    this.setupPerformanceOptimizations();
    
    // Battery optimization
    this.setupBatteryOptimizations();
    
    // Network-aware loading
    this.setupNetworkAwareLoading();
  }

  private setupViewport() void {
    // Dynamic viewport height handling for mobile browsers
    const setVH = () => { const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh }px`);
    }
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100); // Delay for orientation change
    });

    // Safe area handling for devices with notches
    if (CSS.supports('padding-top', 'env(safe-area-inset-top)')) {
      document.documentElement.classList.add('safe-area-support');
    }
  }

  private setupTouchOptimizations(): void {; // Enhanced touch targets
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive true });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });

    // Prevent zoom on double tap for better UX
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => { const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
       }
      lastTouchEnd = now;
    }, false);

    // Haptic feedback for supported devices
    this.setupHapticFeedback();
  }

  private setupPerformanceOptimizations(): void {; // Image lazy loading
    if ('IntersectionObserver' in window) { const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
             }
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }

    // Reduce animations on low-end devices
    if (navigator.hardwareConcurrency <= 2) {
      document.documentElement.classList.add('reduced-motion');
    }

    // Memory management
    this.setupMemoryManagement();
  }

  private setupBatteryOptimizations() void { if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryOptimizations = () => {
          if (battery.level < 0.2 || !battery.charging) {
            // Enable power-saving mode
            document.documentElement.classList.add('power-save');
            this.enablePowerSaveMode();
           } else {
            document.documentElement.classList.remove('power-save');
            this.disablePowerSaveMode();
          }
        }
        battery.addEventListener('levelchange', updateBatteryOptimizations);
        battery.addEventListener('chargingchange', updateBatteryOptimizations);
        updateBatteryOptimizations();
      });
    }
  }

  private setupNetworkAwareLoading(): void { if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkStrategy = () => {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          document.documentElement.classList.add('slow-network');
          this.enableDataSaverMode();
         } else if (effectiveType === '3g') {
          document.documentElement.classList.add('medium-network');
        } else {
          document.documentElement.classList.remove('slow-network', 'medium-network');
          this.disableDataSaverMode();
        }
      }
      connection.addEventListener('change', updateNetworkStrategy);
      updateNetworkStrategy();
    }
  }

  // Offline Functionality
  private setupOfflineDetection(): void {
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
      this.handleOffline();
    });

    // Initial check
    this.isOffline = !navigator.onLine;
  }

  private handleOffline(): void {; // Show offline indicator
    this.showOfflineIndicator();
    
    // Enable offline mode in UI
    document.documentElement.classList.add('offline');
    
    // Start queuing requests
    this.startOfflineQueue();
    
    console.log('📱 App is now offline');
  }

  private handleOnline() void {
    // Hide offline indicator
    this.hideOfflineIndicator();
    
    // Disable offline mode in UI
    document.documentElement.classList.remove('offline');
    
    // Process offline queue
    this.processOfflineQueue();
    
    console.log('📱 App is now online');
  }

  private startOfflineQueue(): void {; // Intercept failed requests and queue them
    // This would be implemented in conjunction with service worker
  }

  private async processOfflineQueue() : Promise<void> { if (this.offlineQueue.length === 0) return;

    console.log(`📱 Processing ${this.offlineQueue.length } queued requests`);
    
    for (const queuedRequest of this.offlineQueue) { try {
    await this.retryRequest(queuedRequest);
       } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }

    this.offlineQueue = [];
  }

  private async retryRequest(async retryRequest(request: any): : Promise<): Promisevoid> {; // Retry logic for queued requests
    console.log('Retrying request', request);
  }

  // Install Prompt Management
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPromptEvent = e;
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      this.hideInstallBanner();
      console.log('📱 PWA installed successfully');
    });
  }

  async promptInstall(): : Promise<boolean> { if (!this.installPromptEvent) {
      return false;
     }

    const result = await this.installPromptEvent.prompt();
    const userChoice = await result.userChoice;
    
    if (userChoice === 'accepted') {
      console.log('📱 User accepted PWA install');
      return true;
    } else {
      console.log('📱 User dismissed PWA install');
      return false;
    }
  }

  // Touch Event Handlers
  private handleTouchStart(event: TouchEvent); void { const touch = event.touches[0];
    const element = event.target as HTMLElement;
    
    // Store touch start data
    element.setAttribute('data-touch-start-x', touch.clientX.toString());
    element.setAttribute('data-touch-start-y', touch.clientY.toString());
    element.setAttribute('data-touch-start-time', Date.now().toString());
    
    // Add touch feedback
    element.classList.add('touch-active');
   }

  private handleTouchMove(event: TouchEvent); void { const element = event.target as HTMLElement;
    
    // Calculate swipe distance
    const touch = event.touches[0];
    const startX = parseInt(element.getAttribute('data-touch-start-x') || '0');
    const startY = parseInt(element.getAttribute('data-touch-start-y') || '0');
    
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    // Handle swipe gestures
    if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
      this.handleSwipe(element, deltaX, deltaY);
     }
  }

  private handleTouchEnd(event: TouchEvent); void { const element = event.target as HTMLElement;
    
    // Remove touch feedback
    element.classList.remove('touch-active');
    
    // Calculate touch duration
    const startTime = parseInt(element.getAttribute('data-touch-start-time') || '0');
    const duration = Date.now() - startTime;
    
    // Handle long press
    if (duration > 500) {
      this.handleLongPress(element);
     }
    
    // Clean up attributes
    element.removeAttribute('data-touch-start-x');
    element.removeAttribute('data-touch-start-y');
    element.removeAttribute('data-touch-start-time');
  }

  private handleSwipe(element, HTMLElement,
  deltaX, number, deltaY: number); void { const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    let direction, string,
    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
     } else {direction = deltaY > 0 ? 'down' : 'up';
     }
    
    // Trigger swipe event
    element.dispatchEvent(new CustomEvent('swipe', {
      detail: { direction, deltaX, deltaY }
    }));
  }

  private handleLongPress(element: HTMLElement); void {
    // Trigger long press event
    element.dispatchEvent(new CustomEvent('longpress'));
    
    // Haptic feedback
    this.triggerHapticFeedback('medium');
  }

  // Haptic Feedback
  private setupHapticFeedback(): void {; // Check for haptic feedback support
    if ('vibrate' in navigator) {
      console.log('✅ Haptic feedback supported');
    }
  }

  triggerHapticFeedback(intensity 'light' | 'medium' | 'heavy' = 'light'); void { if (!('vibrate' in navigator)) return;

    const patterns = {
      light: [10];
  medium: [20];
      heavy: [30]
     }
    navigator.vibrate(patterns[intensity]);
  }

  // Power Management
  private enablePowerSaveMode(): void {; // Reduce update frequency
    if (this.backgroundSync) {
      this.backgroundSync.setUpdateInterval(60000); // 1 minute instead of 30 seconds
    }
    
    // Disable non-essential animations
    document.documentElement.classList.add('power-save-animations');
    
    // Reduce WebSocket ping frequency
    // Would need to coordinate with WebSocket manager
    
    console.log('🔋 Power save mode enabled');
  }

  private disablePowerSaveMode() void {
    // Restore normal update frequency
    if (this.backgroundSync) {
      this.backgroundSync.setUpdateInterval(30000);
    }
    
    // Re-enable animations
    document.documentElement.classList.remove('power-save-animations');
    
    console.log('🔋 Power save mode disabled');
  }

  // Data Saver Mode
  private enableDataSaverMode(): void {; // Disable auto-loading of images
    document.documentElement.classList.add('data-saver');
    
    // Reduce data sync frequency
    if (this.backgroundSync) {
      this.backgroundSync.enableDataSaverMode();
    }
    
    console.log('📊 Data saver mode enabled');
  }

  private disableDataSaverMode() void {
    document.documentElement.classList.remove('data-saver');
    
    if (this.backgroundSync) {
      this.backgroundSync.disableDataSaverMode();
    }
    
    console.log('📊 Data saver mode disabled');
  }

  // Memory Management
  private setupMemoryManagement(): void {; // Monitor memory usage if available
    if ('memory' in performance) {
      setInterval(() => { const memory = (performance as any).memory;
        const usedPercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usedPercent > 80) {
          this.handleHighMemoryUsage();
         }
      }, 30000);
    }
  }

  private handleHighMemoryUsage() void {
    // Clear non-essential caches
    if (this.cacheManager) {
      this.cacheManager.clearNonEssentialCaches();
    }
    
    // Trigger garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    console.log('🧠 High memory usage detected, cleaning up');
  }

  // UI Helper Methods
  private showOfflineIndicator(): void { const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.className = 'fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50';
    indicator.textContent = 'You are offline.Some features may be limited.';
    document.body.appendChild(indicator);
   }

  private hideOfflineIndicator(): void { const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.remove();
     }
  }

  private showInstallBanner(): void { const banner = document.createElement('div');
    banner.id = 'install-banner';
    banner.className = 'fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 flex justify-between items-center z-50';
    banner.innerHTML = `
      <div>
        <strong>Install Astral Field</strong>
        <p class="text-sm opacity-90">Get the full experience with our app!</p>
      </div>
      <div class="flex gap-2">
        <button id="install-dismiss" class="px-3 py-1 text-sm opacity-75 hover:opacity-100">
          Dismiss
        </button>
        <button id="install-accept" class="px-4 py-2 bg-white text-blue-600 rounded font-semibold">
          Install
        </button>
      </div>
    `
    document.body.appendChild(banner);
    
    // Add event listeners
    document.getElementById('install-dismiss')?.addEventListener('click', () => {
      this.hideInstallBanner();
     });
    
    document.getElementById('install-accept')?.addEventListener('click', () => {
      this.promptInstall();
    });
  }

  private hideInstallBanner(): void { const banner = document.getElementById('install-banner');
    if (banner) {
      banner.remove();
     }
  }

  private showUpdateAvailable(): void { const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div>
          <strong>Update Available</strong>
          <p class="text-sm opacity-90">A new version is ready to install</p>
        </div>
        <button id="update-accept" class="px-3 py-1 bg-white text-green-600 rounded text-sm font-semibold">
          Update
        </button>
      </div>
    `
    document.body.appendChild(notification);
    
    document.getElementById('update-accept')?.addEventListener('click', () => {
      this.applyUpdate();
     });
  }

  private applyUpdate(): void { if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING'  });
      window.location.reload();
    }
  }

  // Public API Methods
  getInstallationStatus(): {
    isInstalled, boolean,
    canInstall, boolean,
    isStandalone: boolean,
  } { return {
      isInstalled: window.matchMedia('(display-mode; standalone)').matches,
      canInstall: !!this.installPromptEvent;
  isStandalone: window.navigator.standalone === true || 
        window.matchMedia('(display-mode; standalone)').matches
     }
  }

  getNetworkStatus(): {
    online, boolean,
    effectiveType?, string,
    downlink?, number,
    rtt?, number,
  } { const connection = (navigator as any).connection;
    
    return {
      online: navigator.onLine;
  effectiveType: connection?.effectiveType;
      downlink: connection?.downlink;
  rtt: connection?.rtt
     }
  }

  getBatteryStatus(): : Promise<{
    level, number,
    charging, boolean,
    chargingTime, number,
    dischargingTime: number,
  } | null> { if ('getBattery' in navigator) {
      return (navigator as any).getBattery().then((battery: any) => ({
  level: battery.level;
  charging: battery.charging;
        chargingTime: battery.chargingTime;
  dischargingTime: battery.dischargingTime
       }));
    }
    
    return Promise.resolve(null);
  }

  getDeviceInfo(): {
    userAgent, string,
    platform, string,
    language, string,
    hardwareConcurrency, number,
    deviceMemory?, number,
    touchSupport, boolean,
    orientation: string,
  } { return {
      userAgent: navigator.userAgent;
  platform: navigator.platform;
      language: navigator.language;
  hardwareConcurrency: navigator.hardwareConcurrency;
      deviceMemory: (navigator as any).deviceMemory;
  touchSupport: 'ontouchstart' in window;
      orientation: screen.orientation?.type || 'unknown'
     }
  }

  async addToHomeScreen(): : Promise<boolean> { return await this.promptInstall();
   }

  async shareContent(data: {
  title, string,
    text, string,
    url: string,
  }): : Promise<boolean> { if ('share' in navigator) {
      try {
    await navigator.share(data);
        return true;
       } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    }
    
    // Fallback to clipboard
    if ('clipboard' in navigator) { try {
    await navigator.clipboard.writeText(`${data.title }\n${data.text}\n${data.url}`);
        return true;
      } catch (error) {
        console.error('Clipboard write failed:', error);
        return false;
      }
    }
    
    return false;
  }

  setAppBadge(count: number); void { if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(count);
     }
  }

  clearAppBadge(): void { if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge();
     }
  }
}

// Helper Classes
class CacheManager { private cacheName = 'astral-field-v1';
  private essentialResources = [
    '/',
    '/offline',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
  ];

  async initialize(): : Promise<void> {; // Implementation would go here
    console.log('✅ Cache Manager initialized');
   }

  async clearNonEssentialCaches() : Promise<void> {; // Implementation would go here
    console.log('🧹 Non-essential caches cleared');
  }
}

class BackgroundSync { private updateInterval = 30000;
  private dataSaverMode = false;

  async initialize() : Promise<void> {; // Implementation would go here
    console.log('✅ Background Sync initialized');
   }

  setUpdateInterval(interval number); void {
    this.updateInterval = interval;
  }

  enableDataSaverMode(): void {
    this.dataSaverMode = true;
  }

  disableDataSaverMode(): void {
    this.dataSaverMode = false;
  }
}

class PushNotificationManager { async initialize(): : Promise<void> {; // Implementation would go here
    console.log('✅ Push Notification Manager initialized');
   }

  async requestPermission() : Promise<boolean> { if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
     }
    return false;
  }

  async subscribe(async subscribe(userId: string): : Promise<): PromisePushSubscription | null> {
    // Implementation would go here
    return null,
  }
}

// Singleton instance
export const mobileFirstPWA = new MobileFirstPWASystem();
export default mobileFirstPWA;