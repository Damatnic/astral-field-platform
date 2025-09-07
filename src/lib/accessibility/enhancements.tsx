'use client'

import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react'
import { motion } from 'framer-motion'

// Accessibility Context
interface AccessibilityContextType {
  isHighContrastMode: boolean
  isReducedMotion: boolean
  fontSize: 'small' | 'normal' | 'large'
  screenReaderEnabled: boolean
  keyboardNavigation: boolean
  toggleHighContrast: () => void
  setFontSize: (size: 'small' | 'normal' | 'large') => void
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

// Accessibility Provider
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isHighContrastMode, setIsHighContrastMode] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [fontSize, setFontSizeState] = useState<'small' | 'normal' | 'large'>('normal')
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false)
  const [keyboardNavigation, setKeyboardNavigation] = useState(false)
  
  const screenReaderRef = useRef<HTMLDivElement>(null)

  // Detect user preferences on mount
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setIsReducedMotion(prefersReducedMotion)

    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    setIsHighContrastMode(prefersHighContrast)

    // Detect screen reader usage
    const checkScreenReader = () => {
      // Check for common screen reader indicators
      const hasScreenReader = !!(
        window.navigator.userAgent.includes('NVDA') ||
        window.navigator.userAgent.includes('JAWS') ||
        window.speechSynthesis ||
        document.querySelector('[aria-hidden="true"]')
      )
      setScreenReaderEnabled(hasScreenReader)
    }

    checkScreenReader()

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true)
      }
    }

    const handleMouseDown = () => {
      setKeyboardNavigation(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    // Load saved preferences
    const savedPreferences = localStorage.getItem('accessibility-preferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setIsHighContrastMode(parsed.highContrast || false)
        setFontSizeState(parsed.fontSize || 'normal')
      } catch (error) {
        console.error('Failed to parse accessibility preferences:', error)
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement

    // High contrast mode
    if (isHighContrastMode) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Font size
    root.classList.remove('font-small', 'font-normal', 'font-large')
    root.classList.add(`font-${fontSize}`)

    // Keyboard navigation
    if (keyboardNavigation) {
      root.classList.add('keyboard-navigation')
    } else {
      root.classList.remove('keyboard-navigation')
    }

    // Reduced motion
    if (isReducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Save preferences
    const preferences = {
      highContrast: isHighContrastMode,
      fontSize,
      reducedMotion: isReducedMotion
    }
    localStorage.setItem('accessibility-preferences', JSON.stringify(preferences))
  }, [isHighContrastMode, fontSize, keyboardNavigation, isReducedMotion])

  const toggleHighContrast = useCallback(() => {
    setIsHighContrastMode(prev => !prev)
  }, [])

  const setFontSize = useCallback((size: 'small' | 'normal' | 'large') => {
    setFontSizeState(size)
  }, [])

  const announceToScreenReader = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (screenReaderRef.current) {
      screenReaderRef.current.setAttribute('aria-live', priority)
      screenReaderRef.current.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        if (screenReaderRef.current) {
          screenReaderRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  const contextValue: AccessibilityContextType = {
    isHighContrastMode,
    isReducedMotion,
    fontSize,
    screenReaderEnabled,
    keyboardNavigation,
    toggleHighContrast,
    setFontSize,
    announceToScreenReader
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      {/* Screen reader announcements */}
      <div
        ref={screenReaderRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </AccessibilityContext.Provider>
  )
}

// Accessible Button Component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  children: React.ReactNode
}

export function AccessibleButton({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled,
  children,
  className = '',
  onClick,
  ...props
}: AccessibleButtonProps) {
  const { isReducedMotion, announceToScreenReader } = useAccessibility()
  const [isFocused, setIsFocused] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return
    
    announceToScreenReader('Button activated')
    onClick?.(e)
  }, [loading, disabled, onClick, announceToScreenReader])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      setIsPressed(true)
    }
  }, [])

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      setIsPressed(false)
    }
  }, [])

  const baseClasses = `
    relative inline-flex items-center justify-center
    font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
    ${className}
  `

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  }

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  }

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={handleClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={disabled || loading}
      aria-describedby={loading ? 'loading-description' : undefined}
      whileTap={!isReducedMotion ? { scale: 0.95 } : undefined}
      whileHover={!isReducedMotion ? { scale: 1.02 } : undefined}
      {...props}
    >
      {loading && (
        <>
          <div 
            className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
            aria-hidden="true"
          />
          <span id="loading-description" className="sr-only">Loading, please wait</span>
        </>
      )}
      {children}
    </motion.button>
  )
}

// Skip Link Component
export function SkipLink({ href = '#main', children = 'Skip to main content' }: {
  href?: string
  children?: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 
                 focus:ring-2 focus:ring-white focus:ring-offset-2"
    >
      {children}
    </a>
  )
}

// Focus Trap Hook
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])

  return containerRef
}

// Accessible Form Components
export function AccessibleInput({
  label,
  error,
  required = false,
  className = '',
  id,
  ...props
}: {
  label: string
  error?: string
  required?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="space-y-1">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-300"
      >
        {label}
        {required && <span className="text-red-400 ml-1" aria-label="required">*</span>}
      </label>
      
      <input
        id={inputId}
        className={`
          block w-full px-3 py-2 border rounded-lg
          bg-gray-700 border-gray-600 text-white
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
        required={required}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Accessible Modal with Focus Management
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}: AccessibleModalProps) {
  const { isReducedMotion, announceToScreenReader } = useAccessibility()
  const modalRef = useFocusTrap(isOpen)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      announceToScreenReader(`${title} dialog opened`, 'assertive')
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, title, announceToScreenReader])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
        announceToScreenReader('Dialog closed')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, announceToScreenReader])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <motion.div
        ref={modalRef}
        className={`
          relative bg-gray-800 rounded-xl shadow-2xl border border-gray-700
          w-full max-w-md max-h-[90vh] overflow-y-auto
          ${className}
        `}
        initial={!isReducedMotion ? { opacity: 0, scale: 0.9, y: 20 } : { opacity: 0 }}
        animate={!isReducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1 }}
        exit={!isReducedMotion ? { opacity: 0, scale: 0.9, y: 20 } : { opacity: 0 }}
        transition={{ duration: isReducedMotion ? 0 : 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 id="modal-title" className="text-xl font-semibold text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// High Contrast Toggle Component
export function HighContrastToggle({ className = '' }: { className?: string }) {
  const { isHighContrastMode, toggleHighContrast } = useAccessibility()

  return (
    <button
      onClick={toggleHighContrast}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg
        bg-gray-700 hover:bg-gray-600 text-white
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-pressed={isHighContrastMode}
      aria-label={`${isHighContrastMode ? 'Disable' : 'Enable'} high contrast mode`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
      <span>High Contrast</span>
      {isHighContrastMode && <span className="sr-only">enabled</span>}
    </button>
  )
}

// Font Size Controls
export function FontSizeControls({ className = '' }: { className?: string }) {
  const { fontSize, setFontSize } = useAccessibility()

  const sizes = [
    { value: 'small', label: 'Small', description: 'Smaller text size' },
    { value: 'normal', label: 'Normal', description: 'Default text size' },
    { value: 'large', label: 'Large', description: 'Larger text size' }
  ] as const

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-300">
        Font Size
      </label>
      <div className="flex space-x-2" role="radiogroup" aria-label="Font size selection">
        {sizes.map((size) => (
          <button
            key={size.value}
            onClick={() => setFontSize(size.value)}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-colors
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${fontSize === size.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }
            `}
            role="radio"
            aria-checked={fontSize === size.value}
            aria-describedby={`font-size-${size.value}-desc`}
          >
            {size.label}
            <span id={`font-size-${size.value}-desc`} className="sr-only">
              {size.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Landmark Navigation Component
export function LandmarkNavigation() {
  const landmarks = [
    { id: 'main', label: 'Main content' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'sidebar', label: 'Sidebar' },
    { id: 'footer', label: 'Footer' }
  ]

  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 
                   bg-blue-600 text-white px-4 py-2 rounded-lg z-50
                   focus:ring-2 focus:ring-white focus:ring-offset-2"
      >
        Navigate landmarks
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-4">
              Navigate to:
            </h2>
            <div className="space-y-2">
              {landmarks.map((landmark) => (
                <button
                  key={landmark.id}
                  onClick={() => {
                    document.getElementById(landmark.id)?.focus()
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 rounded"
                >
                  {landmark.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Screen Reader Only Text Component
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  )
}

// Live Region Hook for Dynamic Updates
export function useLiveRegion() {
  const { announceToScreenReader } = useAccessibility()
  
  const announce = useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    announceToScreenReader(message, priority)
  }, [announceToScreenReader])

  return { announce }
}