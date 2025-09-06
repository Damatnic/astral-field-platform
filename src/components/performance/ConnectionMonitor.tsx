'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wifi,
  WifiOff,
  Signal,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  Zap,
  Clock
} from 'lucide-react'
import { useAccessibility } from '@/components/accessibility'

type ConnectionStatus = 'online' | 'offline' | 'slow' | 'reconnecting' | 'unstable'

interface ConnectionStats {
  ping: number
  downloadSpeed: number
  uploadSpeed: number
  packetLoss: number
  jitter: number
  lastCheck: number
}

interface ConnectionMonitorProps {
  onConnectionChange?: (status: ConnectionStatus) => void
  showUI?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  pingInterval?: number
  speedTestInterval?: number
}

export default function ConnectionMonitor({
  onConnectionChange,
  showUI = true,
  position = 'top-right',
  pingInterval = 5000,
  speedTestInterval = 30000
}: ConnectionMonitorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [stats, setStats] = useState<ConnectionStats>({
    ping: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    packetLoss: 0,
    jitter: 0,
    lastCheck: Date.now()
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastFailure, setLastFailure] = useState<string | null>(null)
  
  const { announceToScreenReader } = useAccessibility()
  const pingIntervalRef = useRef<NodeJS.Timeout>()
  const speedTestIntervalRef = useRef<NodeJS.Timeout>()
  const retryTimeoutRef = useRef<NodeJS.Timeout>()
  const isMonitoring = useRef(false)

  // Network information API support
  const getNetworkInfo = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      return {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      }
    }
    return null
  }, [])

  // Ping test using fetch
  const performPingTest = useCallback(async (): Promise<number> => {
    const startTime = performance.now()
    
    try {
      await fetch('/api/health?_=' + Date.now(), { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      const endTime = performance.now()
      return Math.round(endTime - startTime)
    } catch (error) {
      throw new Error('Ping failed')
    }
  }, [])

  // Speed test using download timing
  const performSpeedTest = useCallback(async (): Promise<{ download: number; upload: number }> => {
    try {
      // Download speed test (approximate)
      const downloadStart = performance.now()
      const response = await fetch('/api/health?size=1mb', { cache: 'no-cache' })
      const downloadEnd = performance.now()
      const downloadTime = downloadEnd - downloadStart
      const downloadSpeed = response.headers.get('content-length') 
        ? (parseInt(response.headers.get('content-length')!) * 8) / (downloadTime / 1000) / 1000000
        : 0

      // Upload speed test (small data)
      const uploadData = new Blob(['0'.repeat(1000)]) // 1KB test data
      const uploadStart = performance.now()
      await fetch('/api/health', {
        method: 'POST',
        body: uploadData,
        cache: 'no-cache'
      })
      const uploadEnd = performance.now()
      const uploadTime = uploadEnd - uploadStart
      const uploadSpeed = (uploadData.size * 8) / (uploadTime / 1000) / 1000000

      return {
        download: Math.round(downloadSpeed * 100) / 100,
        upload: Math.round(uploadSpeed * 100) / 100
      }
    } catch (error) {
      return { download: 0, upload: 0 }
    }
  }, [])

  // Comprehensive connection check
  const checkConnection = useCallback(async () => {
    if (!isMonitoring.current) return

    try {
      const networkInfo = getNetworkInfo()
      const ping = await performPingTest()
      
      let newStatus: ConnectionStatus = 'online'
      let newStats = { ...stats, ping, lastCheck: Date.now() }

      // Determine status based on ping and network conditions
      if (ping > 2000) {
        newStatus = 'slow'
        setLastFailure('High latency detected')
      } else if (networkInfo?.effectiveType === 'slow-2g') {
        newStatus = 'slow'
        setLastFailure('Slow network connection')
      } else if (ping > 1000) {
        newStatus = 'unstable'
        setLastFailure('Unstable connection')
      } else {
        newStatus = 'online'
        setLastFailure(null)
        setRetryCount(0)
      }

      // Add network info to stats if available
      if (networkInfo) {
        newStats = {
          ...newStats,
          downloadSpeed: networkInfo.downlink,
          jitter: networkInfo.rtt
        }
      }

      setStats(newStats)
      setStatus(newStatus)
      
      // Announce significant status changes
      if (status !== newStatus) {
        const message = getStatusMessage(newStatus)
        announceToScreenReader(message, newStatus === 'offline' ? 'assertive' : 'polite')
        onConnectionChange?.(newStatus)
      }

    } catch (error) {
      console.error('Connection check failed:', error)
      
      setStatus('offline')
      setLastFailure(error instanceof Error ? error.message : 'Connection failed')
      setRetryCount(prev => prev + 1)
      
      announceToScreenReader('Connection lost. Attempting to reconnect...', 'assertive')
      onConnectionChange?.('offline')
      
      // Retry with exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000)
      retryTimeoutRef.current = setTimeout(() => {
        if (isMonitoring.current) {
          setStatus('reconnecting')
          checkConnection()
        }
      }, retryDelay)
    }
  }, [stats, status, retryCount, getNetworkInfo, performPingTest, announceToScreenReader, onConnectionChange])

  // Periodic speed test
  const performPeriodicSpeedTest = useCallback(async () => {
    if (status === 'offline' || !isMonitoring.current) return

    try {
      const { download, upload } = await performSpeedTest()
      setStats(prev => ({
        ...prev,
        downloadSpeed: download,
        uploadSpeed: upload,
        lastCheck: Date.now()
      }))
    } catch (error) {
      console.error('Speed test failed:', error)
    }
  }, [status, performSpeedTest])

  // Start monitoring
  useEffect(() => {
    isMonitoring.current = true

    // Initial check
    checkConnection()
    
    // Set up intervals
    pingIntervalRef.current = setInterval(checkConnection, pingInterval)
    speedTestIntervalRef.current = setInterval(performPeriodicSpeedTest, speedTestInterval)

    // Listen to online/offline events
    const handleOnline = () => {
      setStatus('online')
      setLastFailure(null)
      setRetryCount(0)
      checkConnection()
      announceToScreenReader('Connection restored', 'polite')
    }

    const handleOffline = () => {
      setStatus('offline')
      setLastFailure('Browser reports offline')
      announceToScreenReader('Connection lost', 'assertive')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      isMonitoring.current = false
      
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (speedTestIntervalRef.current) clearInterval(speedTestIntervalRef.current)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection, performPeriodicSpeedTest, pingInterval, speedTestInterval, announceToScreenReader])

  const getStatusMessage = (connectionStatus: ConnectionStatus): string => {
    switch (connectionStatus) {
      case 'online': return 'Connection is stable'
      case 'offline': return 'Connection lost'
      case 'slow': return 'Connection is slow'
      case 'unstable': return 'Connection is unstable'
      case 'reconnecting': return 'Reconnecting...'
      default: return 'Connection status unknown'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-400" />
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-400" />
      case 'slow':
        return <Signal className="h-4 w-4 text-yellow-400" />
      case 'unstable':
        return <AlertTriangle className="h-4 w-4 text-orange-400" />
      case 'reconnecting':
        return <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'border-green-500 bg-green-900/20'
      case 'offline': return 'border-red-500 bg-red-900/20'
      case 'slow': return 'border-yellow-500 bg-yellow-900/20'
      case 'unstable': return 'border-orange-500 bg-orange-900/20'
      case 'reconnecting': return 'border-blue-500 bg-blue-900/20'
      default: return 'border-gray-500 bg-gray-900/20'
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left': return 'top-4 left-4'
      case 'top-right': return 'top-4 right-4'
      case 'bottom-left': return 'bottom-4 left-4'
      case 'bottom-right': return 'bottom-4 right-4'
      default: return 'top-4 right-4'
    }
  }

  if (!showUI) return null

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      <motion.div
        className={`border rounded-lg p-3 shadow-lg backdrop-blur-sm ${getStatusColor()}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-white hover:bg-white/10 rounded px-2 py-1 transition-colors"
          aria-label={`Connection status: ${getStatusMessage(status)}`}
          aria-expanded={isExpanded}
        >
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {stats.ping > 0 && `${stats.ping}ms`}
          </span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/20 text-white text-xs space-y-2"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="ml-1 capitalize">{status}</span>
                </div>
                <div>
                  <span className="text-gray-400">Ping:</span>
                  <span className="ml-1">{stats.ping}ms</span>
                </div>
                
                {stats.downloadSpeed > 0 && (
                  <>
                    <div>
                      <span className="text-gray-400">Down:</span>
                      <span className="ml-1">{stats.downloadSpeed.toFixed(1)}Mbps</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Up:</span>
                      <span className="ml-1">{stats.uploadSpeed.toFixed(1)}Mbps</span>
                    </div>
                  </>
                )}
                
                <div className="col-span-2">
                  <span className="text-gray-400">Last check:</span>
                  <span className="ml-1">
                    {new Date(stats.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {lastFailure && (
                <div className="text-red-400 text-xs">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  {lastFailure}
                </div>
              )}

              {retryCount > 0 && (
                <div className="text-yellow-400 text-xs">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Retry attempt {retryCount}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={checkConnection}
                  className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 rounded px-2 py-1 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh</span>
                </button>
                
                <div className="flex items-center space-x-1">
                  {status === 'online' && (
                    <Check className="h-3 w-3 text-green-400" />
                  )}
                  {status === 'offline' && (
                    <X className="h-3 w-3 text-red-400" />
                  )}
                  {(status === 'slow' || status === 'unstable') && (
                    <Zap className="h-3 w-3 text-yellow-400" />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Hook for using connection status in components
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [stats, setStats] = useState<ConnectionStats>({
    ping: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    packetLoss: 0,
    jitter: 0,
    lastCheck: Date.now()
  })

  return {
    status,
    stats,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isSlow: status === 'slow',
    isUnstable: status === 'unstable',
    isReconnecting: status === 'reconnecting'
  }
}

// Component for offline fallback
export function OfflineFallback({ children }: { children: React.ReactNode }) {
  const { isOffline } = useConnectionStatus()

  if (isOffline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 bg-gray-800 rounded-lg border border-gray-700 p-8">
        <WifiOff className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">You're Offline</h2>
        <p className="text-gray-400 text-center mb-4">
          Some features may not be available while you're disconnected.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    )
  }

  return <>{children}</>
}