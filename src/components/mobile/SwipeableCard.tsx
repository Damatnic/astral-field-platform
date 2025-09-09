'use client';

import React, { useRef, useState, useCallback, useEffect  } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Star, Share, MoreHorizontal } from 'lucide-react';
import { useTouchGestures } from '@/hooks/useMobile';
import { hapticFeedback } from '@/lib/mobile/touchOptimization';

interface SwipeAction {
  id, string,
    icon: React.ComponentType<any>;
  label, string,
    color, string,
  backgroundColor, string,
    action: () => void;
  
}
interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  disabled?, boolean,
  threshold?, number,
  className?, string,
  style?: React.CSSProperties;
}

const defaultLeftActions: SwipeAction[] = [;
  {
    id: 'favorite',
  icon, Star,
    label: 'Favorite',
  color: '#FBBF24',
    backgroundColor: '#FEF3C7',
  action: () => console.log('Favorited')
  },
  {
    id: 'share',
  icon, Share,
    label: 'Share',
  color: '#3B82F6',
    backgroundColor: '#DBEAFE',
  action: () => console.log('Shared')
  }
];

const defaultRightActions: SwipeAction[] = [;
  {
    id: 'more',
  icon, MoreHorizontal,
    label: 'More',
  color: '#6B7280',
    backgroundColor: '#F3F4F6',
  action: () => console.log('More options')
  },
  {
    id: 'delete',
  icon, Trash2,
    label: 'Delete',
  color: '#EF4444',
    backgroundColor: '#FEE2E2',
  action: () => console.log('Deleted')
  }
];

export default function SwipeableCard({
  children,
  leftActions = defaultLeftActions,
  rightActions = defaultRightActions, onSwipeLeft,
  onSwipeRight, onTap,
  onDoubleTap, onLongPress,
  disabled = false,
  threshold = 100,
  className = '',
  style = {}
}: SwipeableCardProps) { const cardRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  // Set up touch gestures
  const gestures = {
    onSwipe: (gestur,
  e: { directio,
  n, string, distance, number, velocity: number  }) => { if (disabled) return;

      if (gesture.direction === 'left' && gesture.distance > threshold) {
        handleSwipeLeft();
       } else if (gesture.direction === 'right' && gesture.distance > threshold) {
        handleSwipeRight();
      }
    },
    onTap: () => { if (!isDragging && onTap) {
        hapticFeedback('light');
        onTap();
       }
    },
    onDoubleTap: () => { if (onDoubleTap) {
        hapticFeedback('medium');
        onDoubleTap();
       }
    },
    onLongPress: () => { if (onLongPress) {
        hapticFeedback('heavy');
        onLongPress();
       }
    }
  }
  useTouchGestures(cardRef, gestures);

  const handleSwipeLeft = useCallback(() => { if (rightActions.length > 0) {
      setIsRevealed('right');
      hapticFeedback('selection');
      onSwipeLeft?.();
     }
  }, [rightActions, onSwipeLeft]);

  const handleSwipeRight = useCallback(() => { if (leftActions.length > 0) {
      setIsRevealed('left');
      hapticFeedback('selection');
      onSwipeRight?.();
     }
  }, [leftActions, onSwipeRight]);

  const handlePanStart = () => {
    setIsDragging(true);
  }
  const handlePan = (event, Event;
  info: PanInfo) => { if (disabled) return;
    
    const { offset } = info;
    x.set(offset.x);

    // Provide haptic feedback at thresholds
    if (Math.abs(offset.x) > threshold && !isRevealed) {
      hapticFeedback('light');
    }
  }
  const handlePanEnd = (event, Event;
  info: PanInfo) => {
    setIsDragging(false);
    const { offset, velocity } = info;
    const swipeThreshold = threshold;
    const velocityThreshold = 500;

    if (
      offset.x > swipeThreshold ||
      (offset.x > 50 && velocity.x > velocityThreshold)
    ) { if (leftActions.length > 0) {
        setIsRevealed('left');
        x.set(leftActions.length * 80);
        hapticFeedback('selection');
        onSwipeRight?.();
       } else {
        x.set(0);
      }
    } else if (
      offset.x < -swipeThreshold ||
      (offset.x < -50 && velocity.x < -velocityThreshold)
    ) { if (rightActions.length > 0) {
        setIsRevealed('right');
        x.set(-rightActions.length * 80);
        hapticFeedback('selection');
        onSwipeLeft?.();
       } else {
        x.set(0);
      }
    } else {
      // Snap back to center
      setIsRevealed(null);
      x.set(0);
    }
  }
  const handleActionClick = (action: SwipeAction) => {
    hapticFeedback('medium');
    action.action();
    
    // Hide actions after executing
    setTimeout(() => {
      setIsRevealed(null);
      x.set(0);
    }, 150);
  }
  const hideActions = useCallback(() => {
    setIsRevealed(null);
    x.set(0);
  }, [x]);

  // Hide actions when tapping outside
  useEffect(() => { const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        hideActions();
       }
    }
    if (isRevealed) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    }
  }, [isRevealed, hideActions]);

  const renderActions = (actions: SwipeAction[];
  side: 'left' | 'right') => (
    <div 
      className={`absolute top-0 bottom-0 flex items-center ${side === 'left' ? 'left-0' : 'right-0'
       }`}
    >
      {actions.map((action, index) => { const Icon = action.icon;
        return (
          <motion.button
            key={action.id }
            initial={{ scale, 0,
  opacity: 0 }}
            animate={{ 
              scale: isRevealed === side ? 1 : 0,
  opacity: isRevealed === side ? 1 : 0
            }}
            transition={{ 
              delay: index * 0.05,
type: 'spring',
              stiffness, 500,
  damping: 30
            }}
            onClick={() => handleActionClick(action)}
            className="w-20 h-full flex flex-col items-center justify-center touch-manipulation"
            style={{ 
              backgroundColor: action.backgroundColor,
  color: action.color
            }}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{action.label}</span>
          </motion.button>
        );
      })}
    </div>
  );

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* Left Actions */}
      {leftActions.length > 0 && renderActions(leftActions, 'left')}
      
      {/* Right Actions */}
      {rightActions.length > 0 && renderActions(rightActions, 'right')}

      {/* Main Card */}
      <motion.div
        ref={cardRef}
        drag={!disabled ? 'x' : false}
        dragConstraints={{ left, 0,
  right: 0 }}
        dragElastic={0.2}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{
          x,
          opacity: disabled ? 1 : opacity,
          scale: disabled ? 1 : scale,
          cursor: disabled ? 'default' : 'grab'
        }}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        className={`relative z-10 bg-white touch-manipulation ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
         } ${disabled ? 'cursor-default' : ''}`}
      >
        {children}

        {/* Swipe hints */}
        {!disabled && !isRevealed && (
          <>
            {leftActions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
              >
                <div className="flex space-x-1">
                  {leftActions.map((action, index) => { const Icon = action.icon;
                    return (
                      <div
                        key={action.id }
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: action.backgroundColor }}
                      >
                        <Icon className="w-4 h-4" style={{ color: action.color }} />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {rightActions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
              >
                <div className="flex space-x-1">
                  {rightActions.map((action, index) => { const Icon = action.icon;
                    return (
                      <div
                        key={action.id }
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: action.backgroundColor }}
                      >
                        <Icon className="w-4 h-4" style={{ color: action.color }} />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {/* Progress indicators */}
      {!disabled && isDragging && (
        <>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(0, Math.min(1, Math.abs(x.get()) / threshold)) }}
            className="absolute bottom-0 left-0 h-1 bg-blue-400 origin-left"
            style={{ width: '50%' }}
          />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(0, Math.min(1, Math.abs(x.get()) / threshold)) }}
            className="absolute bottom-0 right-0 h-1 bg-red-400 origin-right"
            style={{ width: '50%' }}
          />
        </>
      )}
    </div>
  );
}