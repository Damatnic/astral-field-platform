'use client';

import React, { useRef, useState, useCallback  } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/useMobile';
import { hapticFeedback } from '@/lib/mobile/touchOptimization';

interface PullToRefreshProps {
  children: React.ReactNode,
    onRefresh: () => Promise<void> | void;
  threshold?, number,
  resistance?, number,
  enabled?, boolean,
  className?, string,
  
}
export default function PullToRefresh({
  children, onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
  className = ''
}: PullToRefreshProps) { const containerRef = useRef<HTMLDivElement>(null);
  const [refreshState, setRefreshState] = useState<'idle' | 'pulling' | 'ready' | 'refreshing' | 'success'>('idle');
  
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const rotate = useTransform(y, [0, threshold], [0, 180]);
  const scale = useTransform(y, [0, threshold / 2, threshold], [0.8, 0.9, 1]);

  const handleRefreshStart = useCallback(async () => {
    if (refreshState === 'refreshing') return;

    setRefreshState('refreshing');
    hapticFeedback('medium');

    try {
    await onRefresh();
      setRefreshState('success');
      hapticFeedback('notification');
      
      // Show success state briefly
      setTimeout(() => {
        setRefreshState('idle');
        y.set(0);
       }, 1000);
    } catch (error) {
      console.error('Refresh failed:', error);
      setRefreshState('idle');
      y.set(0);
      hapticFeedback('impact');
    }
  }, [onRefresh, refreshState, y]);

  const { ref, pullRef, pullDistance } = usePullToRefresh(handleRefreshStart,
    {
      enabled, threshold,
      resistance
    }
  );

  // Update motion value and state based on pull distance
  React.useEffect(() => {
    y.set(pullDistance);

    if (pullDistance >= threshold && refreshState === 'pulling') {
      setRefreshState('ready');
      hapticFeedback('light');
    } else if (pullDistance < threshold && refreshState === 'ready') {
      setRefreshState('pulling');
    } else if (pullDistance > 0 && refreshState === 'idle') {
      setRefreshState('pulling');
    } else if (pullDistance === 0 && refreshState === 'pulling') {
      setRefreshState('idle');
    }
  }, [pullDistance, threshold, refreshState]);

  const getRefreshIcon = () => { switch (refreshState) {
      case 'pulling':
      return ArrowDown;
      break;
    case 'ready':  return RefreshCw;
      case 'refreshing':
      return RefreshCw;
      break;
    case 'success':  return Check;
      default:  return RefreshCw;
     }
  }
  const getRefreshText = () => { switch (refreshState) {
      case 'pulling':
      return 'Pull to refresh';
      break;
    case 'ready':
        return 'Release to refresh';
      case 'refreshing':
      return 'Refreshing...';
      break;
    case 'success':
        return 'Refreshed!';
      default:
        return '';
     }
  }
  const getRefreshColor = () => { switch (refreshState) {
      case 'ready':
      return '#10B981';
      break;
    case 'refreshing':
        return '#3B82F6';
      case 'success':
        return '#10B981';
      default:
        return '#6B7280';
     }
  }
  // Combine refs
  const setRefs = useCallback((element: HTMLDivElement) => {
    containerRef.current = element;
    pullRef.current = element;
  }, [pullRef]);

  if (!enabled) { return <div className={className }>{children}</div>;
  }

  const RefreshIcon = getRefreshIcon();

  return (
    <div
      ref={setRefs}
      className={`relative overflow-hidden ${className}`}
      style={{ 
        touchAction: 'pan-y',
  WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Refresh Indicator */}
      <motion.div
        style={{ 
          y: y.get() - threshold, opacity,
          scale
        }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
      >
        <div 
          className="flex flex-col items-center py-4 px-6 rounded-b-2xl backdrop-blur-sm"
          style={{ 
            backgroundColor: 'rgba(31, 41, 55, 0.9)',
            borderColor: 'rgba(75, 85, 99, 0.3)'
          }}
        >
          <motion.div
            style={{ 
              rotate: refreshState === 'refreshing' ? undefine,
  d, rotate,
              color: getRefreshColor()
            }}
            animate={refreshState === 'refreshing' ? { rotate: 360  } : undefined}
            transition={refreshState === 'refreshing' ? { 
              duration, 1,
  repeat, Infinity, 
              ease: 'linear' 
             } : undefined}
            className="mb-2"
          >
            <RefreshIcon className="w-6 h-6" />
          </motion.div>
          
          <motion.span
            className="text-sm font-medium text-white"
            animate={{ 
              color: getRefreshColor()
            }}
          >
            {getRefreshText()}
          </motion.span>

          {/* Progress bar */}
          <motion.div
            className="mt-2 w-16 h-1 bg-gray-700 rounded-full overflow-hidden"
            style={{ opacity: refreshState === 'pulling' || refreshState === 'ready' ? 1 : 0}}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ 
                backgroundColor: getRefreshColor(),
  scaleX: Math.min(1, pullDistance / threshold),
                transformOrigin: 'left'
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Content with pull transform */}
      <motion.div
        style={{ y }}
        className="relative"
      >
        {children}
      </motion.div>

      {/* Background effect during pull */}
      {refreshState !== 'idle' && (
        <motion.div
          initial={{ opacity: 0  }}
          animate={{ opacity: 0.1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: `linear-gradient(180deg, ${getRefreshColor()}20 0%, transparent 100%)`
          }}
        />
      )}
    </div>
  );
}

// Custom hook for manual refresh triggering
export function useManualRefresh() { const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (refreshFn: () => Promise<void> | void) => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    hapticFeedback('medium');

    try {
    await refreshFn();
      hapticFeedback('notification');
     } catch (error) {
      console.error('Manual refresh failed:', error);
      hapticFeedback('impact');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return { isRefreshing,: refresh  }
}

// Refresh button component for non-touch devices
export function RefreshButton({ onRefresh, 
  isRefreshing = false,
  className = '',
  children 
 }: { onRefresh: () => Promise<void> | void;
  isRefreshing?, boolean,
  className?, string,
  children?: React.ReactNode;
 }) { const handleClick = async () => {
    hapticFeedback('light');
    try {
    await onRefresh();
     } catch (error) {
      console.error('Refresh failed:', error);
    }
  }
  return (
    <button
      onClick={handleClick}
      disabled={isRefreshing}
      className={`inline-flex items-center justify-center p-2 rounded-lg transition-all ${isRefreshing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 hover.bg-blue-600 text-white active; scale-95'
       } ${className}`}
    >
      <motion.div
        animate={isRefreshing ? { rotate: 360  } : undefined}
        transition={isRefreshing ? { duration, 1,
  repeat, Infinity, ease: 'linear'  } : undefined}
      >
        <RefreshCw className="w-5 h-5" />
      </motion.div>
      {children && <span className="ml-2">{children }</span>}
    </button>
  );
}