'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Smartphone, 
  Download, 
  Share, 
  Plus, 
  Apple,
  Chrome,
  Wifi,
  WifiOff,
  RefreshCw,
  Star
} from 'lucide-react'

interface PWAInstallEvent extends Event {
  readonly platforms: ReadonlyArray<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: PWAInstallEvent
  }
}

interface AppInstallBannerProps {
  className?: string
}

export function AppInstallBanner({ className = '' }: AppInstallBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallEvent | null>(null)
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    canInstall: false
  })

  useEffect(() => {
    // Check if user has already dismissed the banner
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const lastDismissed = dismissed ? parseInt(dismissed) : 0
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    
    // Don't show if dismissed within the last week
    if (lastDismissed > weekAgo) {
      return
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true

    setDeviceInfo({
      isIOS,
      isAndroid,
      isStandalone,
      canInstall: false
    })

    // Don't show if already installed/standalone
    if (isStandalone) {
      return
    }

    // Listen for PWA install prompt (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: PWAInstallEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setDeviceInfo(prev => ({ ...prev, canInstall: true }))
      
      // Show banner after a short delay to not be intrusive
      setTimeout(() => {
        setIsVisible(true)
      }, 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS and other browsers, show after some interaction time
    if (isIOS || (!isAndroid && !isStandalone)) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 10000) // Show after 10 seconds

      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt && deviceInfo.canInstall) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
        trackInstallEvent('pwa_installed', 'accepted')
      } else {
        console.log('User dismissed the install prompt')
        trackInstallEvent('pwa_dismissed', 'dismissed')
      }
      
      setDeferredPrompt(null)
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    trackInstallEvent('pwa_dismissed', 'manual')
  }

  const trackInstallEvent = (action: string, outcome: string) => {
    // Track install events for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: 'PWA',
        event_label: outcome,
        value: 1
      })
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed bottom-4 left-4 right-4 z-40 ${className}`}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-2xl border border-blue-500/20 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1">
                  Install Astral Field
                </h3>
                <p className="text-sm text-blue-100 mb-3">
                  Get the full app experience with offline access, push notifications, and faster loading.
                </p>
                
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-blue-100">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>Offline access</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bell className="h-3 w-3" />
                    <span>Push notifications</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RefreshCw className="h-3 w-3" />
                    <span>Faster loading</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {deviceInfo.canInstall && (
                    <button
                      onClick={handleInstall}
                      className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Install App</span>
                    </button>
                  )}
                  
                  {deviceInfo.isIOS && (
                    <IOSInstallInstructions />
                  )}
                  
                  {!deviceInfo.canInstall && !deviceInfo.isIOS && (
                    <div className="text-xs text-blue-100">
                      Add to home screen for the best experience
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function IOSInstallInstructions() {
  const [showInstructions, setShowInstructions] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowInstructions(true)}
        className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>Add to Home Screen</span>
      </button>

      <AnimatePresence>
        {showInstructions && (
          <IOSInstallModal onClose={() => setShowInstructions(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Add to Home Screen</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">1</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">
                  Tap the <Share className="inline h-4 w-4 mx-1" /> <strong>Share</strong> button in Safari
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">2</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">
                  Select <Plus className="inline h-4 w-4 mx-1" /> <strong>"Add to Home Screen"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">3</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">
                  Tap <strong>"Add"</strong> to install the app
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                The app will appear on your home screen and work offline with push notifications.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// PWA Status Indicator
export function PWAStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Check if running as PWA
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone === true
    }

    setIsStandalone(checkStandalone())

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial online status
    setIsOnline(navigator.onLine)

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true)
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        const waitingWorker = registration.waiting
        if (waitingWorker) {
          waitingWorker.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      })
    }
  }

  // Only show if running as PWA
  if (!isStandalone) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-30">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-orange-600 text-white px-3 py-2 rounded-lg shadow-lg mb-2 flex items-center space-x-2"
          >
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Offline Mode</span>
          </motion.div>
        )}

        {updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">Update Available</span>
            <button
              onClick={handleUpdate}
              className="ml-2 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
            >
              Update
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// App Loading Splash Screen for PWA
export function PWALoadingSplash() {
  const [isVisible, setIsVisible] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Only show splash for PWA
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone === true
    }

    if (checkStandalone()) {
      setIsStandalone(true)
      
      // Hide splash after app loads
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 2000)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [])

  if (!isStandalone || !isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center"
      >
        <div className="text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="h-16 w-16 bg-blue-500 rounded-xl mb-4 mx-auto flex items-center justify-center"
          >
            <Smartphone className="h-8 w-8 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Astral Field
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-gray-400"
          >
            Fantasy Football Platform
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8"
          >
            <div className="flex space-x-1 justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for PWA utilities
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallEvent | null>(null)

  useEffect(() => {
    const checkInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone === true
    }

    setIsInstalled(checkInstalled())

    const handleBeforeInstallPrompt = (e: PWAInstallEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setCanInstall(false)
      return outcome === 'accepted'
    }
    return false
  }

  return {
    isInstalled,
    canInstall,
    install
  }
}

// Import missing Bell icon
import { Bell } from 'lucide-react'