'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion'
import { 
  Check, 
  X, 
  Heart, 
  ThumbsUp, 
  ArrowUp, 
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Sun,
  Moon
} from 'lucide-react'

// Global animation settings
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return prefersReducedMotion
}

// Enhanced Button with Press Animation
interface MicroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  loading?: boolean
  success?: boolean
  error?: boolean
}

export function MicroButton({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  success = false,
  error = false,
  disabled,
  className = '',
  onClick,
  ...props
}: MicroButtonProps) {
  const prefersReducedMotion = useReducedMotion()
  const [isPressed, setIsPressed] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return
    
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)
    
    if (success || error) {
      setShowFeedback(true)
      setTimeout(() => setShowFeedback(false), 2000)
    }
    
    onClick?.(e)
  }, [disabled, loading, success, error, onClick])

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-700/50 text-gray-300'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <motion.button
      className={`
        relative inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200 focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
      whileTap={!prefersReducedMotion ? { scale: 0.98 } : undefined}
      whileHover={!prefersReducedMotion ? { scale: 1.02 } : undefined}
      {...props}
    >
      {/* Ripple Effect */}
      <AnimatePresence>
        {isPressed && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-lg"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Loading Spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mr-2"
          >
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Error Feedback */}
      <AnimatePresence>
        {showFeedback && (success || error) && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="mr-2"
          >
            {success ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <X className="w-4 h-4 text-red-400" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <span className={loading ? 'opacity-70' : ''}>{children}</span>
    </motion.button>
  )
}

// Animated Like Button
export function LikeButton({ 
  liked: initialLiked = false,
  onToggle,
  count = 0,
  className = ''
}: {
  liked?: boolean
  onToggle?: (liked: boolean) => void
  count?: number
  className?: string
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayCount, setDisplayCount] = useState(count)
  const prefersReducedMotion = useReducedMotion()

  const handleClick = useCallback(() => {
    const newLikedState = !liked
    setLiked(newLikedState)
    setIsAnimating(true)
    
    // Update count with animation
    setDisplayCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1))
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
    
    setTimeout(() => setIsAnimating(false), 600)
    onToggle?.(newLikedState)
  }, [liked, onToggle])

  return (
    <motion.button
      onClick={handleClick}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
        ${liked ? 'bg-red-500/10 text-red-400' : 'bg-gray-700/50 text-gray-400 hover:text-red-400'}
        ${className}
      `}
      whileTap={!prefersReducedMotion ? { scale: 0.95 } : undefined}
    >
      <motion.div
        animate={!prefersReducedMotion ? {
          scale: isAnimating ? [1, 1.3, 1] : 1,
          rotate: isAnimating ? [0, 12, -12, 0] : 0
        } : undefined}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Heart 
          className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} 
          style={{ color: liked ? '#ef4444' : undefined }}
        />
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.span
          key={displayCount}
          initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          exit={!prefersReducedMotion ? { opacity: 0, y: -10 } : undefined}
          className="text-sm font-medium"
        >
          {displayCount}
        </motion.span>
      </AnimatePresence>

      {/* Floating hearts animation */}
      <AnimatePresence>
        {isAnimating && liked && !prefersReducedMotion && (
          <div className="absolute">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  opacity: 1,
                  scale: 0.5,
                  x: 0,
                  y: 0
                }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: (Math.random() - 0.5) * 40,
                  y: -20 - Math.random() * 20
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
              >
                <Heart className="w-3 h-3 fill-current text-red-400" />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// Scroll to Top Button
export function ScrollToTopButton({ className = '' }: { className?: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    setIsClicked(true)
    
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    })
    
    setTimeout(() => setIsClicked(false), 300)
  }, [prefersReducedMotion])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          className={`
            fixed bottom-20 right-6 z-40 p-3 rounded-full
            bg-blue-600 hover:bg-blue-700 text-white shadow-lg
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${className}
          `}
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: isClicked ? 0.9 : 1, 
            y: 0,
            rotate: isClicked ? 360 : 0
          }}
          exit={{ opacity: 0, scale: 0, y: 20 }}
          whileHover={!prefersReducedMotion ? { scale: 1.1 } : undefined}
          whileTap={!prefersReducedMotion ? { scale: 0.9 } : undefined}
          transition={{ duration: 0.2 }}
        >
          <ArrowUp className="w-5 h-5" />
          <span className="sr-only">Scroll to top</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// Loading Progress Bar
export function ProgressBar({ 
  progress = 0,
  className = '',
  showSparkle = true,
  color = 'blue'
}: {
  progress: number
  className?: string
  showSparkle?: boolean
  color?: 'blue' | 'green' | 'purple' | 'red'
}) {
  const prefersReducedMotion = useReducedMotion()
  const sparkleRef = useRef<HTMLDivElement>(null)
  
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600'
  }

  return (
    <div className={`relative h-2 bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className={`h-full ${colors[color]} relative`}
        initial={{ width: '0%' }}
        animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' }}
      >
        {/* Shimmer Effect */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}

        {/* Sparkle at the end */}
        <AnimatePresence>
          {showSparkle && progress > 5 && progress < 100 && !prefersReducedMotion && (
            <motion.div
              ref={sparkleRef}
              className="absolute right-0 top-1/2 transform -translate-y-1/2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [1, 0.5, 1],
                scale: [1, 1.2, 1],
                rotate: [0, 90, 180, 270, 360]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Sparkles className="w-3 h-3 text-yellow-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Success Checkmark Animation
export function SuccessCheckmark({ 
  isVisible = false,
  size = 'md',
  className = ''
}: {
  isVisible: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const prefersReducedMotion = useReducedMotion()
  
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            flex items-center justify-center rounded-full bg-green-100
            ${sizes[size]} ${className}
          `}
          initial={!prefersReducedMotion ? { 
            scale: 0, 
            opacity: 0,
            rotate: -180 
          } : { opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            rotate: 0
          }}
          exit={{ 
            scale: 0, 
            opacity: 0
          }}
          transition={{ 
            duration: 0.5, 
            ease: 'easeOut',
            type: 'spring',
            stiffness: 200
          }}
        >
          <motion.div
            initial={!prefersReducedMotion ? { pathLength: 0 } : undefined}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Check className="w-full h-full text-green-600" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Shake Animation Hook
export function useShakeAnimation() {
  const [shouldShake, setShouldShake] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const shake = useCallback(() => {
    if (prefersReducedMotion) return
    
    setShouldShake(true)
    
    // Haptic feedback for error
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }
    
    setTimeout(() => setShouldShake(false), 600)
  }, [prefersReducedMotion])

  const shakeAnimation = shouldShake && !prefersReducedMotion ? {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.6 }
  } : {}

  return { shake, shakeAnimation }
}

// Card Hover Effect
export function InteractiveCard({
  children,
  onClick,
  className = '',
  glowOnHover = true
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  glowOnHover?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-300, 300], [10, -10])
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }, [prefersReducedMotion, mouseX, mouseY])

  return (
    <motion.div
      className={`
        relative rounded-xl cursor-pointer transition-all duration-300
        ${glowOnHover && isHovered ? 'shadow-2xl shadow-blue-500/20' : ''}
        ${className}
      `}
      style={!prefersReducedMotion ? {
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d'
      } : undefined}
      whileHover={!prefersReducedMotion ? { scale: 1.02 } : undefined}
      whileTap={!prefersReducedMotion ? { scale: 0.98 } : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        if (!prefersReducedMotion) {
          mouseX.set(0)
          mouseY.set(0)
        }
      }}
      onClick={onClick}
    >
      {children}
      
      {/* Glow effect */}
      {glowOnHover && isHovered && !prefersReducedMotion && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 to-purple-400/10 pointer-events-none" />
      )}
    </motion.div>
  )
}

// Sound ToggleLeft Button
export function SoundToggle({
  enabled: initialEnabled = true,
  onToggle,
  className = ''
}: {
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
  className?: string
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = useCallback(() => {
    const newState = !enabled
    setEnabled(newState)
    setIsAnimating(true)
    
    // Play a subtle sound when enabling
    if (newState && 'AudioContext' in window) {
      try {
        const audioContext = new AudioContext()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
      } catch (error) {
        // Ignore audio errors
      }
    }
    
    setTimeout(() => setIsAnimating(false), 300)
    onToggle?.(newState)
  }, [enabled, onToggle])

  return (
    <motion.button
      onClick={handleToggle}
      className={`
        relative p-2 rounded-lg transition-colors
        ${enabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}
        hover:bg-opacity-80 focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      whileTap={{ scale: 0.95 }}
      animate={{ rotate: isAnimating ? [0, -15, 15, 0] : 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={enabled ? 'on' : 'off'}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.15 }}
        >
          {enabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sound waves animation when enabled */}
      <AnimatePresence>
        {enabled && (
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{ right: i * 4 }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// Pull to Refresh Component
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 70,
  className = ''
}: {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  className?: string
}) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY === 0 || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY)
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, threshold + 20))
    }
  }, [startY, threshold, isRefreshing])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
    setStartY(0)
  }, [pullDistance, threshold, isRefreshing, onRefresh])

  const refreshProgress = Math.min(pullDistance / threshold, 1)

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-blue-600/10"
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: Math.max(pullDistance, isRefreshing ? 60 : 0),
              opacity: 1
            }}
            exit={{ height: 0, opacity: 0 }}
            style={{ 
              transform: `translateY(${Math.max(0, pullDistance - threshold)}px)`
            }}
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : refreshProgress * 360 }}
              transition={{ 
                duration: isRefreshing ? 1 : 0,
                repeat: isRefreshing ? Infinity : 0,
                ease: 'linear'
              }}
            >
              <motion.div
                animate={{ 
                  scale: refreshProgress >= 1 ? 1.2 : 1,
                  color: refreshProgress >= 1 ? '#10b981' : '#6b7280'
                }}
              >
                <ArrowUp className="w-6 h-6" />
              </motion.div>
            </motion.div>
            
            <motion.span
              className="ml-2 text-sm font-medium"
              animate={{ 
                color: refreshProgress >= 1 ? '#10b981' : '#6b7280'
              }}
            >
              {isRefreshing ? 'Refreshing...' : 
               refreshProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        style={{ 
          transform: `translateY(${pullDistance}px)`
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}