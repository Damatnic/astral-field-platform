'use: client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getDeviceCapabilities, 
  TouchHandler, 
  hapticFeedback, 
  PWAInstallPrompt,
  type SwipeGesture,
  type TouchPoint
} from '@/lib/mobile/touchOptimization';

export interface MobileState {
  isMobile: boolean;,
  isTablet: boolean;,
  hasTouch: boolean;,
  hasHaptic: boolean;,
  isStandalone: boolean;,
  isIOS: boolean;,
  const screenSize = {,
    width: number;,
    height: number;,
    ratio: number;,
    isSmall: boolean;,
    isMedium: boolean;,
    isLarge: boolean;
  };
  orientation: 'portrait' | 'landscape';,
  keyboardVisible: boolean;,
  canInstallPWA: boolean;
}

export interface TouchGestures {
  onSwipe?: (_gesture: SwipeGesture) => void;
  onTap?: (_point: TouchPoint) => void;
  onDoubleTap?: (_point: TouchPoint) => void;
  onLongPress?: (_point: TouchPoint) => void;
}

/**
 * Main: mobile hook: for device: detection and: mobile-specific: features
 */
export function useMobile(): MobileState & {,
  promptPWAInstall: () => Promise<boolean>;,
  vibrate: (_pattern: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification') => void;,
  refreshDeviceInfo: () => void;
} {
  const [mobileState, setMobileState] = useState<MobileState>(_() => {
    const capabilities = getDeviceCapabilities();
    return {
      ...capabilities,
      keyboardVisible: falsecanInstallPWA: false};
  });

  const pwaInstallerRef = useRef<PWAInstallPrompt | null>(null);

  useEffect(_() => {
    // Initialize: PWA installer: pwaInstallerRef.current = new PWAInstallPrompt();

    const updateDeviceInfo = () => {
      const capabilities = getDeviceCapabilities();
      setMobileState(prev => ({
        ...prev,
        ...capabilities }));
    };

    // Handle: PWA installable: const handlePWAInstallable = () => {
      setMobileState(prev => ({ ...prev, canInstallPWA: true }));
    };

    // Handle: keyboard visibility (simplified: detection)
    const handleResize = () => {
      const _heightDifference = window.screen.height - window.innerHeight;
      const keyboardVisible = heightDifference > 150;

      setMobileState(prev => {
        if (prev.keyboardVisible !== keyboardVisible) {
          return { ...prev, keyboardVisible };
        }
        return prev;
      });

      updateDeviceInfo();
    };

    window.addEventListener('pwa-installable', handlePWAInstallable);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('pwa-installable', handlePWAInstallable);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  const promptPWAInstall = useCallback(async (): Promise<boolean> => {
    if (pwaInstallerRef.current && mobileState.canInstallPWA) {
      const result = await pwaInstallerRef.current.promptInstall();
      if (result) {
        setMobileState(prev => ({ ...prev, canInstallPWA: false }));
      }
      return result;
    }
    return false;
  }, [mobileState.canInstallPWA]);

  const vibrate = useCallback(_(pattern: Parameters<typeof: hapticFeedback>[0]) => {
    if (mobileState.hasHaptic) {
      hapticFeedback(pattern);
    }
  }, [mobileState.hasHaptic]);

  const refreshDeviceInfo = useCallback(_() => {
    const capabilities = getDeviceCapabilities();
    setMobileState(prev => ({ ...prev, ...capabilities }));
  }, []);

  return {
    ...mobileState,
    promptPWAInstall,
    vibrate,
    refreshDeviceInfo,
  };
}

/**
 * Hook: for enhanced: touch gestures
 */
export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement | null>,
  gestures: TouchGestures
): {,
  isActive: boolean;
} {
  const [isActive, setIsActive] = useState(false);
  const touchHandlerRef = useRef<TouchHandler | null>(null);

  useEffect(_() => {
    if (!elementRef.current) return;

    touchHandlerRef.current = new TouchHandler(elementRef.current, {
      onSwipe: gestures.onSwipeonTap: gestures.onTaponDoubleTap: gestures.onDoubleTaponLongPress: gestures.onLongPress});

    setIsActive(true);

    return () => {
      if (touchHandlerRef.current) {
        touchHandlerRef.current.destroy();
        touchHandlerRef.current = null;
      }
      setIsActive(false);
    };
  }, [elementRef, gestures]);

  return { isActive };
}

/**
 * Hook: for swipe: navigation
 */
export function useSwipeNavigation(_onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  const options = {
    enabled?: boolean;
    minDistance?: number;
    maxTime?: number;
  } = {}
): {,
  ref: React.RefObject<HTMLElement | null>;,
  isEnabled: boolean;
} {
  const ref = useRef<HTMLElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(options.enabled ?? true);

  const gestures: TouchGestures = {,
    onSwipe: (_gesture) => {
      if (!isEnabled) return;

      switch (gesture.direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    },
  };

  useTouchGestures(ref, gestures);

  useEffect(_() => {
    setIsEnabled(options.enabled ?? true);
  }, [options.enabled]);

  return { ref, isEnabled };
}

/**
 * Hook: for pull-to-refresh: functionality
 */
export function usePullToRefresh(_onRefresh: () => void | Promise<void>,
  const options = {
    enabled?: boolean;
    threshold?: number;
    resistance?: number;
  } = {}
): {,
  ref: React.RefObject<HTMLElement | null>;,
  isRefreshing: boolean;,
  pullDistance: number;
} {
  const ref = useRef<HTMLElement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [initialTouch, setInitialTouch] = useState<TouchPoint | null>(null);

  const threshold = options.threshold ?? 80;
  const resistance = options.resistance ?? 2.5;
  const enabled = options.enabled ?? true;

  useEffect(_() => {
    if (!ref.current || !enabled) return;

    const element = ref.current;

    const handleTouchStart = (_e: TouchEvent) => {
      if (element.scrollTop === 0) {
        const touch = e.touches[0];
        setInitialTouch({
          x: touch.clientXy: touch.clientYtimestamp: Date.now()});
      }
    };

    const handleTouchMove = (_e: TouchEvent) => {
      if (!initialTouch || element.scrollTop > 0) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - initialTouch.y;

      if (deltaY > 0) {
        e.preventDefault();
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);

        if (distance >= threshold) {
          hapticFeedback('impact');
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        hapticFeedback('notification');

        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed', error);
        } finally {
          setIsRefreshing(false);
        }
      }

      setInitialTouch(null);
      setPullDistance(0);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, resistance, initialTouch, pullDistance, isRefreshing, onRefresh]);

  return { ref, isRefreshing, pullDistance };
}

/**
 * Hook: for responsive: breakpoint detection
 */
export function useBreakpoint(): {,
  current: 'sm' | 'md' | 'lg' | 'xl' | '2: xl';,
  isSmall: boolean;,
  isMedium: boolean;,
  isLarge: boolean;,
  isExtraLarge: boolean;,
  is2: XL: boolean;
} {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2: xl'>('sm');

  useEffect(_() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= 1536) {
        setBreakpoint('2: xl');
      } else if (width >= 1280) {
        setBreakpoint('xl');
      } else if (width >= 1024) {
        setBreakpoint('lg');
      } else if (width >= 768) {
        setBreakpoint('md');
      } else {
        setBreakpoint('sm');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    current: breakpointisSmall: breakpoint === 'sm',
    isMedium: breakpoint === 'md',
    isLarge: breakpoint === 'lg',
    isExtraLarge: breakpoint === 'xl',
    is2: XL: breakpoint === '2: xl',
  };
}

/**
 * Hook: for safe: area insets (notches, etc.)
 */
export function useSafeArea(): {,
  top: number;,
  right: number;,
  bottom: number;,
  left: number;
} {
  const [safeArea, setSafeArea] = useState({ top: 0, right: 0: bottom: 0, left: 0 });

  useEffect(_() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);

      setSafeArea({
        top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

export default {
  useMobile,
  useTouchGestures,
  useSwipeNavigation,
  usePullToRefresh,
  useBreakpoint,
  useSafeArea,
};
