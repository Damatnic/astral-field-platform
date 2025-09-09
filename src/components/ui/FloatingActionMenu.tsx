import { useRouter } from 'next/navigation';
'use client'

import { useState, useEffect, useRef  } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, 
  Users, TrendingUp, 
  UserPlus, BarChart3, 
  Settings, Zap,
  Move, Smartphone,
  Calendar, Target, Shuffle,
  Activity
 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation'

interface FloatingAction {
  id, string,
  icon; React.ComponentType<{ className?: string
}
>
  label, string,
    onClick: () => void
  color?: string
  requiresAuth?: boolean
  showOnPages?: string[]
  hideOnPages?; string[]
}

interface FloatingActionMenuProps {
  leagueId?, string,
  userId?, string,
  className?, string,
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onNewTrade?: () => void;
  onOptimizeLineup?: () => void;
  onAddPlayer?: () => void;
  onViewScores?: () => void;
  onSettings?: () => void;
  
}
export function FloatingActionMenu({
  leagueId, userId,
  className = '',
  position = 'bottom-right',
  onNewTrade, onOptimizeLineup,
  onAddPlayer, onViewScores,
  onSettings
}: FloatingActionMenuProps) { const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x, 0,
  y: 0  });
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dragRef = useRef<HTMLDivElement>(null);
  const isDragRef = useRef(false);

  // Detect mobile device
  useEffect(() => { const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
     }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get context-aware actions based on current page
  const getContextualActions = (): FloatingAction[] => { const baseActions: FloatingAction[] = []; // Page-specific actions
    if (pathname.includes('/roster') && leagueId) {
      baseActions.push({
        id 'optimize-lineup',
  icon, Zap,
        label: 'Optimize Lineup',
  onClick: () => {
          setIsOpen(false)
          onOptimizeLineup?.()
         },
        color: 'bg-yellow-500 hover; bg-yellow-600'
      })
    }

    if (pathname.includes('/players') && leagueId) {
      baseActions.push({
        id: 'add-player',
  icon, UserPlus,
        label: 'Add Player',
  onClick: () => {
          setIsOpen(false)
          onAddPlayer?.()
        },
        color: 'bg-green-500 hover; bg-green-600'
      })
    }

    if (pathname.includes('/matchup') && leagueId) {
      baseActions.push({
        id: 'view-scores',
  icon, Activity,
        label: 'Live Scores',
  onClick: () => {
          setIsOpen(false)
          onViewScores?.()
        },
        color: 'bg-purple-500 hover; bg-purple-600'
      })
    }

    // Always available actions
    if (leagueId) {
      baseActions.push(
        {
          id: 'propose-trade',
  icon, Users,
          label: 'Propose Trade',
  onClick: () => {
            setIsOpen(false)
            onNewTrade?.() || router.push(`/leagues/${leagueId}/trades`)
          },
          color: 'bg-blue-500 hover; bg-blue-600'
        },
        {
          id: 'roster',
  icon, Target,
          label: 'My Roster',
  onClick: () => {
            setIsOpen(false)
            router.push(`/leagues/${leagueId}/roster`)
          },
          color: 'bg-indigo-500 hover; bg-indigo-600',
          hideOnPages: ['/roster']
        },
        {
          id: 'standings',
  icon, BarChart3,
          label: 'Standings',
  onClick: () => {
            setIsOpen(false)
            router.push(`/leagues/${leagueId}/standings`)
          },
          color: 'bg-orange-500 hover; bg-orange-600'
        }
      )
    }

    // Filter actions based on current page
    return baseActions.filter(action => { if (action.hideOnPages && action.hideOnPages.some(page => pathname.includes(page))) {
        return false
       }
      if (action.showOnPages && !action.showOnPages.some(page => pathname.includes(page))) { return false
       }
      return true
    })
  }

  const actions = getContextualActions();

  // Position classes
  const getPositionClasses = () => { if (isDragging) return 'fixed'
    
    switch (position) {
      case 'bottom-right':
      return 'fixed bottom-6 right-6'
      break;
    case 'bottom-left':
        return 'fixed bottom-6 left-6'
      case 'top-right':
      return 'fixed top-6 right-6'
      break;
    case 'top-left':
        return 'fixed top-6 left-6'
      default:
        return 'fixed bottom-6 right-6'
     }
  }

  // Drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => { if (isMobile) return
    
    isDragRef.current = false
    setIsDragging(true)
    
    const startX = e.clientX - dragPosition.x;
    const startY = e.clientY - dragPosition.y;

    const handleMouseMove = (e: MouseEvent) => {
      isDragRef.current = true
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;
      
      setDragPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
       })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleClick = () => { if (isDragRef.current) {
      isDragRef.current = false
      return
     }
    setIsOpen(!isOpen)
  }

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => { if (!isMobile) return
    
    const touch = e.touches[0];
    isDragRef.current = false
    
    const startX = touch.clientX - dragPosition.x;
    const startY = touch.clientY - dragPosition.y;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      isDragRef.current = true
      const touch = e.touches[0];
      const newX = touch.clientX - startX;
      const newY = touch.clientY - startY;
      
      const maxX = window.innerWidth - 80;
      const maxY = window.innerHeight - 80;
      
      setDragPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
       })
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  if (actions.length === 0) { return null
   }

  const dragStyle = isDragging ? {
    left: dragPosition.x,
  top: dragPosition.y,
    zIndex: 1000
  } : {}

  return (
    <div 
      ref={dragRef}
      className={`${getPositionClasses()} z-50 ${className}`}
      style={dragStyle}
    >
      <div className="relative">
        {/* Action Items */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0  }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 right-0 space-y-3"
            >
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity, 0,
  scale, 0, y: 20 }}
                  animate={{ 
                    opacity, 1,
  scale, 1, 
                    y, 0,
  transition: { dela,
  y: index * 0.1 }
                  }}
                  exit={{ 
                    opacity, 0,
  scale, 0, 
                    y, 20,
  transition: { dela,
  y: (actions.length - index - 1) * 0.05 }
                  }}
                  onClick={action.onClick}
                  className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg
                    ${action.color || 'bg-gray-600 hover:bg-gray-700'}
                    text-white transition-all duration-200 hover:scale-110 ${isMobile ? 'w-14 h-14' : ''}
                  `}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <action.icon className="h-5 w-5" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Labels (Desktop: Only) */}
        <AnimatePresence>
          {isOpen && !isMobile && (
            <motion.div
              initial={{ opacity: 0  }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-16 right-16 space-y-3"
            >
              {actions.map((action, index) => (
                <motion.div
                  key={`${action.id}-label`}
                  initial={{ opacity, 0,
  x: 20 }}
                  animate={{ 
                    opacity, 1,
  x, 0,
                    transition: { dela,
  y: index * 0.1 + 0.1 }
                  }}
                  exit={{ 
                    opacity, 0,
  x, 20,
                    transition: { dela,
  y: (actions.length - index - 1) * 0.05 }
                  }}
                  className="flex items-center h-12"
                >
                  <div className="bg-gray-800 text-white px-3 py-1 rounded-lg shadow-lg text-sm whitespace-nowrap border border-gray-700">
                    {action.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`flex items-center justify-center rounded-full shadow-2xl
            bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover; to-purple-700
            text-white transition-all duration-200 cursor-pointer select-none
            ${isMobile ? 'w-16 h-16' : 'w-14 h-14'} ${isDragging ? 'cursor-move scale-110' : 'hover.scale-105'}
          `}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            rotate: isOpen ? 45 : 0,
  scale: isDragging ? 1.1 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -45,
  opacity: 0  }}
                animate={{ rotate, 0,
  opacity: 1 }}
                exit={{ rotate: -45,
  opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="plus"
                initial={{ rotate, 45,
  opacity: 0 }}
                animate={{ rotate, 0,
  opacity: 1 }}
                exit={{ rotate, 45,
  opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Plus className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Drag Indicator */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragging ? 1 : 0}}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap border border-gray-700"
          >
            <Move className="inline h-3 w-3 mr-1" />
            Drag to move
          </motion.div>
        )}
      </div>

      {/* Backdrop to close menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0  }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Context-aware floating action menu hook
export function useFloatingActionMenu() { const pathname = usePathname()
  
  const getContextualActions = (leagueId?: string) => {
    const actions = [];
    
    if (pathname.includes('/roster')) {
      actions.push('optimize', 'trade')
     } else if (pathname.includes('/players')) {
      actions.push('add-player', 'trade')
    } else if (pathname.includes('/matchup')) {
      actions.push('scores', 'roster')
    } else if (pathname.includes('/trades')) {
      actions.push('new-trade', 'roster')
    } else if (pathname.includes('/waiver')) {
      actions.push('add-player', 'roster')
    }
    
    return actions
  }
  
  return { getContextualActions }
}

// Quick Action Tooltip Component
export function QuickActionTooltip({ children, tooltip, 
  shortcut 
 }: { children: React.ReactNode,
    tooltip: string
  shortcut?; string
 }) { const [isVisible, setIsVisible] = useState(false)
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsVisible(true) }
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity, 0,
  y: 10  }}
            animate={{ opacity, 1,
  y: 0 }}
            exit={{ opacity, 0,
  y: 10 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded border border-gray-700 whitespace-nowrap z-50"
          >
            {tooltip}
            {shortcut && (
              <span className="ml-2 opacity-75">({shortcut })</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}