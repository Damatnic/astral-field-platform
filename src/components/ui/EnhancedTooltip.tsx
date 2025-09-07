'use client'

import { useState, useRef, useEffect, ReactNode, cloneElement, Children, isValidElement } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface TooltipPosition {
  x: number
  y: number
}

export interface EnhancedTooltipProps {
  content: ReactNode
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  delay?: number
  offset?: number
  interactive?: boolean
  arrow?: boolean
  maxWidth?: number
  disabled?: boolean
  className?: string
  contentClassName?: string
  showOnFocus?: boolean
  showOnClick?: boolean
  closeOnScroll?: boolean
}

export function EnhancedTooltip({
  content,
  children,
  placement = 'auto',
  delay = 200,
  offset = 8,
  interactive = false,
  arrow = true,
  maxWidth = 320,
  disabled = false,
  className = '',
  contentClassName = '',
  showOnFocus = false,
  showOnClick = false,
  closeOnScroll = true
}: EnhancedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState<TooltipPosition>({ x: 0, y: 0 })
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top')
  const [mounted, setMounted] = useState(false)
  
  const triggerRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const closeTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const calculatePosition = (): { position: TooltipPosition; placement: typeof actualPlacement } => {
    if (!triggerRef.current || !tooltipRef.current) {
      return { position: { x: 0, y: 0 }, placement: 'top' }
    }

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    let optimalPlacement = placement
    let x = 0
    let y = 0

    // Auto placement - choose best position
    if (placement === 'auto') {
      const spaceTop = triggerRect.top
      const spaceBottom = viewportHeight - triggerRect.bottom
      const spaceLeft = triggerRect.left
      const spaceRight = viewportWidth - triggerRect.right

      if (spaceBottom >= tooltipRect.height + offset) {
        optimalPlacement = 'bottom'
      } else if (spaceTop >= tooltipRect.height + offset) {
        optimalPlacement = 'top'
      } else if (spaceRight >= tooltipRect.width + offset) {
        optimalPlacement = 'right'
      } else if (spaceLeft >= tooltipRect.width + offset) {
        optimalPlacement = 'left'
      } else {
        // Default to top if no space is ideal
        optimalPlacement = 'top'
      }
    }

    // Calculate position based on placement
    switch (optimalPlacement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.top - tooltipRect.height - offset
        break
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.bottom + offset
        break
      case 'left':
        x = triggerRect.left - tooltipRect.width - offset
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
      case 'right':
        x = triggerRect.right + offset
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
    }

    // Viewport boundary adjustments
    if (x < 8) x = 8
    if (x + tooltipRect.width > viewportWidth - 8) {
      x = viewportWidth - tooltipRect.width - 8
    }
    if (y < 8) y = 8
    if (y + tooltipRect.height > viewportHeight - 8) {
      y = viewportHeight - tooltipRect.height - 8
    }

    return {
      position: { x: x + scrollX, y: y + scrollY },
      placement: optimalPlacement
    }
  }

  const showTooltip = () => {
    if (disabled || !content) return

    clearTimeout(closeTimeoutRef.current)
    
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true)
        // Calculate position after tooltip is rendered
        setTimeout(() => {
          const { position: newPosition, placement: newPlacement } = calculatePosition()
          setPosition(newPosition)
          setActualPlacement(newPlacement)
        }, 0)
      }, delay)
    } else {
      setIsVisible(true)
      setTimeout(() => {
        const { position: newPosition, placement: newPlacement } = calculatePosition()
        setPosition(newPosition)
        setActualPlacement(newPlacement)
      }, 0)
    }
  }

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current)
    
    if (interactive) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 100)
    } else {
      setIsVisible(false)
    }
  }

  const handleTooltipEnter = () => {
    if (interactive) {
      clearTimeout(closeTimeoutRef.current)
    }
  }

  const handleTooltipLeave = () => {
    if (interactive) {
      hideTooltip()
    }
  }

  const handleClick = () => {
    if (showOnClick) {
      if (isVisible) {
        hideTooltip()
      } else {
        showTooltip()
      }
    }
  }

  const handleFocus = () => {
    if (showOnFocus) {
      showTooltip()
    }
  }

  const handleBlur = () => {
    if (showOnFocus) {
      hideTooltip()
    }
  }

  // Handle scroll to close tooltip
  useEffect(() => {
    if (closeOnScroll && isVisible) {
      const handleScroll = () => hideTooltip()
      
      window.addEventListener('scroll', handleScroll, true)
      return () => window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isVisible, closeOnScroll])

  // Update position on window resize
  useEffect(() => {
    if (isVisible) {
      const handleResize = () => {
        const { position: newPosition, placement: newPlacement } = calculatePosition()
        setPosition(newPosition)
        setActualPlacement(newPlacement)
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isVisible])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
      clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const triggerProps = {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onClick: handleClick,
    ref: triggerRef
  }

  // Clone child with trigger props
  const trigger = Children.only(children)
  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger, {
        ...triggerProps,
        className: `${trigger.props.className || ''} ${className}`.trim()
      })
    : children

  const tooltipPortal = mounted && isVisible && createPortal(
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`
          fixed z-[9999] pointer-events-none
          ${interactive ? 'pointer-events-auto' : ''}
        `}
        style={{
          left: position.x,
          top: position.y,
          maxWidth
        }}
        onMouseEnter={handleTooltipEnter}
        onMouseLeave={handleTooltipLeave}
      >
        <div
          className={`
            relative bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl border border-gray-700
            ${contentClassName}
          `}
        >
          {/* Arrow */}
          {arrow && (
            <div
              className={`
                absolute w-2 h-2 bg-gray-900 border border-gray-700 rotate-45
                ${actualPlacement === 'top' ? 'bottom-[-5px] left-1/2 transform -translate-x-1/2 border-t-0 border-l-0' : ''}
                ${actualPlacement === 'bottom' ? 'top-[-5px] left-1/2 transform -translate-x-1/2 border-b-0 border-r-0' : ''}
                ${actualPlacement === 'left' ? 'right-[-5px] top-1/2 transform -translate-y-1/2 border-l-0 border-b-0' : ''}
                ${actualPlacement === 'right' ? 'left-[-5px] top-1/2 transform -translate-y-1/2 border-r-0 border-t-0' : ''}
              `}
            />
          )}
          
          <div className="relative z-10 text-sm">
            {content}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )

  return (
    <>
      {triggerElement}
      {tooltipPortal}
    </>
  )
}

// Rich Tooltip with HTML content
interface RichTooltipProps extends Omit<EnhancedTooltipProps, 'content'> {
  title?: string
  description?: ReactNode
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }>
  image?: string
  loading?: boolean
}

export function RichTooltip({
  title,
  description,
  actions = [],
  image,
  loading = false,
  children,
  ...tooltipProps
}: RichTooltipProps) {
  const content = (
    <div className="space-y-3 min-w-0">
      {image && (
        <img 
          src={image} 
          alt={title || 'Tooltip image'} 
          className="w-full h-24 object-cover rounded"
        />
      )}
      
      {title && (
        <div className="font-semibold text-white">
          {title}
        </div>
      )}
      
      {description && (
        <div className="text-gray-300 text-sm leading-relaxed">
          {description}
        </div>
      )}
      
      {actions.length > 0 && (
        <div className="flex space-x-2 pt-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`
                px-3 py-1 text-xs font-medium rounded transition-colors
                ${action.variant === 'primary' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      
      {loading && (
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
          <span>Loading...</span>
        </div>
      )}
    </div>
  )

  return (
    <EnhancedTooltip
      content={content}
      interactive={actions.length > 0 || loading}
      maxWidth={280}
      {...tooltipProps}
    >
      {children}
    </EnhancedTooltip>
  )
}

// Tooltip for keyboard shortcuts
export function ShortcutTooltip({
  shortcut,
  description,
  children,
  ...tooltipProps
}: {
  shortcut: string
  description?: string
  children: ReactNode
} & Omit<EnhancedTooltipProps, 'content'>) {
  const content = (
    <div className="flex items-center space-x-2">
      {description && (
        <span className="text-gray-300">{description}</span>
      )}
      <kbd className="px-2 py-1 text-xs font-mono bg-gray-700 border border-gray-600 rounded">
        {shortcut}
      </kbd>
    </div>
  )

  return (
    <EnhancedTooltip
      content={content}
      placement="top"
      delay={500}
      {...tooltipProps}
    >
      {children}
    </EnhancedTooltip>
  )
}

// Help tooltip with question mark icon
export function HelpTooltip({
  content,
  className = '',
  ...tooltipProps
}: Omit<EnhancedTooltipProps, 'children'> & {
  content: ReactNode
  className?: string
}) {
  return (
    <EnhancedTooltip
      content={content}
      placement="top"
      interactive={true}
      maxWidth={250}
      {...tooltipProps}
    >
      <button
        className={`
          inline-flex items-center justify-center w-4 h-4 rounded-full 
          bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold
          transition-colors cursor-help
          ${className}
        `}
      >
        ?
      </button>
    </EnhancedTooltip>
  )
}

// Tooltip hook for programmatic control
export function useTooltip() {
  const [isVisible, setIsVisible] = useState(false)
  
  const show = () => setIsVisible(true)
  const hide = () => setIsVisible(false)
  const toggle = () => setIsVisible(prev => !prev)
  
  return {
    isVisible,
    show,
    hide,
    toggle
  }
}