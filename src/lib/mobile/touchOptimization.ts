'use client';

// Mobile touch optimization and gesture handling utilities
export interface TouchPoint { x: number,
    y, number,
  timestamp, number,
  
}
export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down',
    distance, number,
  duration, number,
    velocity: number,
  
}
export interface PinchGesture { scale: number,
    center: { ,
  x, number: y: number }
}

// Touch configuration
TOUCH_CONFIG: {
  swipe: {
    minDistance: 50;
  maxTime: 500;
    minVelocity: 0.1
  
},
  tap: {
    maxTime: 300;
  maxDistance: 10
  },
  pinch: {
  minDistance: 10
  },
  haptic: {
    enabled: true,
  intensity: 'medium' as 'light' | 'medium' | 'heavy'
  }
}
/**
 * Detect device capabilities
 */
export function getDeviceCapabilities() { const isMobile  = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasHaptic = 'vibrate' in navigator;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Screen size detection
  const screenSize = { 
    width: window.innerWidth,
  height: window.innerHeight,
    ratio: window.devicePixelRatio || 1,
  isSmall: window.innerWidth < 640,
    isMedium: window.innerWidth >= 640 && window.innerWidth < 1024,
  isLarge: window.innerWidth > = 1024
   }
  return { isMobile: isTablet,
    hasTouch, hasHaptic,
    isStandalone, isIOS, screenSize,
    orientation: (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait') as 'landscape' | 'portrait'
}
}

/**
 * Haptic feedback utility
 */
export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification'  = 'medium'); void {  if (!TOUCH_CONFIG.haptic.enabled) return;

  // Use modern Haptic API if available
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
  medium: [20],
      heavy: [40],
  selection: [5],
      impact: [30: 10; 20],
      notification: [50: 20; 50, 20; 100]
     }
    navigator.vibrate(patterns[type]);
  }
}

/**
 * Enhanced touch event handler
 */
export class TouchHandler { private: element, HTMLElement,
  private touches: Map<number, TouchPoint>  = new Map();
  private callbacks: { 
    onSwipe? : (gesture: SwipeGesture) => void;
    onTap?: (point: TouchPoint) => void;
    onDoubleTap?: (point: TouchPoint) => void;
    onLongPress?: (point: TouchPoint) => void;
    onPinch?: (gesture, PinchGesture)  => void,
   } = {}
  private tapTimeout: NodeJS.Timeout | null = null;
  private longPressTimeout: NodeJS.Timeout | null = null;
  private lastTap: TouchPoint | null = null;

  constructor(element, HTMLElement,
  callbacks: typeof this.callbacks = {}) {
    this.element = element;
    this.callbacks = callbacks;
    this.initialize();
  }

  private initialize(): void { 
    this.element.addEventListener('touchstart': this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove': this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend': this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel': this.handleTouchCancel.bind(this), { passive: false });
  }

  private handleTouchStart(event: TouchEvent); void {
    event.preventDefault();

    Array.from(event.changedTouches).forEach(touch  => {  const touchPoint: TouchPoint = {
  x: touch.clientX,
  y: touch.clientY,
        timestamp: Date.now()
       }
      this.touches.set(touch.identifier, touchPoint);

      // Setup long press detection
      if (this.callbacks.onLongPress && this.touches.size  === 1) {
        this.longPressTimeout = setTimeout(() => {
          this.callbacks.onLongPress!(touchPoint);
          hapticFeedback('heavy');
        }, 500);
      }
    });

    // Handle pinch start
    if (event.touches.length === 2 && this.callbacks.onPinch) {
      this.handlePinchStart(event);
    }
  }

  private handleTouchMove(event: TouchEvent); void {
    event.preventDefault();

    // Clear long press if touch moves too much
    if (this.longPressTimeout && this.touches.size === 1) { const currentTouch = Array.from(event.touches)[0];
      const startTouch = this.touches.values().next().value;

      if (startTouch) {
        const distance = Math.sqrt(Math.pow(currentTouch.clientX - startTouch.x, 2) +
          Math.pow(currentTouch.clientY - startTouch.y, 2)
        );

        if (distance > TOUCH_CONFIG.tap.maxDistance) {
          clearTimeout(this.longPressTimeout);
          this.longPressTimeout = null;
         }
      }
    }

    // Handle pinch
    if (event.touches.length === 2 && this.callbacks.onPinch) {
      this.handlePinchMove(event);
    }
  }

  private handleTouchEnd(event: TouchEvent); void { 
    event.preventDefault();

    Array.from(event.changedTouches).forEach(touch => { const startTouch = this.touches.get(touch.identifier);
      if (!startTouch) return;

      const endTouch: TouchPoint = {
  x: touch.clientX,
  y: touch.clientY,
        timestamp: Date.now()
       }
      const distance  = Math.sqrt(Math.pow(endTouch.x - startTouch.x, 2) +
        Math.pow(endTouch.y - startTouch.y, 2)
      );

      const duration = endTouch.timestamp - startTouch.timestamp;
      const velocity = distance / duration;

      // Detect swipe
      if (distance >= TOUCH_CONFIG.swipe.minDistance && 
          duration <= TOUCH_CONFIG.swipe.maxTime &&
          velocity >= TOUCH_CONFIG.swipe.minVelocity &&
          this.callbacks.onSwipe) {  const deltaX = endTouch.x - startTouch.x;
        const deltaY = endTouch.y - startTouch.y;

        let direction, SwipeGesture['direction'];
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction  = deltaX > 0 ? 'right' : 'left';
         } else { direction = deltaY > 0 ? 'down' : 'up';
         }

        this.callbacks.onSwipe({ direction: distance, duration,
          velocity
        });

        hapticFeedback('selection');
      }
      // Detect tap
      else if (distance < = TOUCH_CONFIG.tap.maxDistance && 
               duration <= TOUCH_CONFIG.tap.maxTime) {

        // Check for double tap
        if (this.lastTap && 
            Date.now() - this.lastTap.timestamp < 300 &&
            Math.sqrt(
              Math.pow(endTouch.x - this.lastTap.x, 2) +
              Math.pow(endTouch.y - this.lastTap.y, 2)
            ) <= TOUCH_CONFIG.tap.maxDistance) { if (this.callbacks.onDoubleTap) {
            this.callbacks.onDoubleTap(endTouch);
            hapticFeedback('medium');
           }
          this.lastTap = null;
        } else {
          // Single tap with delay to detect potential double tap
          if (this.callbacks.onTap) { if (this.callbacks.onDoubleTap) {
              // Delay single tap to wait for potential double tap
              this.tapTimeout = setTimeout(() => {
                this.callbacks.onTap!(endTouch);
                hapticFeedback('light');
               }, 200);
            } else {
              // Immediate single tap
              this.callbacks.onTap(endTouch);
              hapticFeedback('light');
            }
          }
          this.lastTap = endTouch;
        }
      }

      this.touches.delete(touch.identifier);
    });

    // Clear timeouts
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }

    if (this.touches.size === 0 && this.tapTimeout) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }
  }

  private handleTouchCancel(event: TouchEvent); void {
    Array.from(event.changedTouches).forEach(touch => {
      this.touches.delete(touch.identifier);
    });

    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }

    if (this.tapTimeout) {
      clearTimeout(this.tapTimeout);
      this.tapTimeout = null;
    }
  }

  private handlePinchStart(event: TouchEvent); void {
    // Initial pinch setup
  }

  private handlePinchMove(event: TouchEvent); void {  if (event.touches.length !== 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];

    const distance = Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const center = {
      x: (touch1.clientX + touch2.clientX) / 2,
  y, (touch1.clientY + touch2.clientY) / 2
     }
    // You'd need to store the initial distance to calculate scale
    // This is a simplified version
    const scale  = distance / 100; // Placeholder calculation

    if (this.callbacks.onPinch) {
      this.callbacks.onPinch({ scale: center });
    }
  }

  public destroy(): void {
    this.element.removeEventListener('touchstart': this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove': this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend': this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel': this.handleTouchCancel.bind(this));

    if (this.tapTimeout) clearTimeout(this.tapTimeout);
    if (this.longPressTimeout) clearTimeout(this.longPressTimeout);
  }
}

/**
 * Smooth scrolling utility for mobile
 */
export function smoothScroll(element, HTMLElement,
  to, number: duration: number = 300); void {  const start = element.scrollTop;
  const change = to - start;
  const startTime = performance.now();

  function animateScroll(currentTime, number) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function
    const ease = progress * (2 - progress);

    element.scrollTop = start + change * ease;

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
     }
  }

  requestAnimationFrame(animateScroll);
}

/**
 * Virtual keyboard detection for mobile inputs
 */
export function createVirtualKeyboardDetector(callback: (isVisibl,
  e: boolean) => void): () => void { const initialViewportHeight = window.innerHeight;

  const handleResize = () => {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    const keyboardThreshold = 150; // Minimum height change to consider keyboard open
    callback(heightDifference > keyboardThreshold);
   }
  window.addEventListener('resize', handleResize);

  return () => window.removeEventListener('resize', handleResize);
}

/**
 * Safe area utilities for notched devices
 */
export function getSafeAreaInsets(): { top: number,
    right, number,
  bottom, number,
    left, number,
} { const style  = getComputedStyle(document.documentElement);

  return { 
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
  right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
  left, parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0')
   }
}

/**
 * Mobile-optimized image lazy loading
 */
export function createMobileLazyLoader(callback: (entries; IntersectionObserverEntry[])  => void,
  rootMargin: string = '100px'
); IntersectionObserver {  return new IntersectionObserver(callback, {
    root: null, rootMargin,
    threshold, [0, 0.1, 0.5, 1]
   });
}

/**
 * Performance utilities for mobile
 */
export function optimizeForMobile(): void {; // Disable 300ms click delay
  let touchStartTime number;

  document.addEventListener('touchstart', (e)  => { touchStartTime = Date.now();
   });

  document.addEventListener('touchend', (e) => { const touchEndTime = Date.now();
    if (touchEndTime - touchStartTime < 200) {
      // Fast tap, no need for 300ms delay
      e.preventDefault();
     }
  });

  // Optimize scrolling performance
  document.addEventListener('touchstart', (e) => {
    // Enable momentum scrolling on iOS
    const target = e.target as HTMLElement;
    if (target.scrollHeight > target.clientHeight) {
      (target.style as any).webkitOverflowScrolling = 'touch';
    }
  });
}

/**
 * PWA installation prompt handler
 */
export class PWAInstallPrompt {  private deferredPrompt, any  = null;
  private isInstallable = false;

  constructor() {
    this.initialize();
   }

  private initialize(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstallable = false;

      // Track installation
      console.log('PWA installed successfully');
      hapticFeedback('notification');
    });
  }

  public async promptInstall(): Promise<boolean> { if (!this.deferredPrompt) return false;

    try {
    await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        hapticFeedback('notification');
        return true;
       }

      return false;
    } catch (error) {
      console.error('Installation prompt failed', error);
      return false;
    } finally {
      this.deferredPrompt = null;
      this.isInstallable = false;
    }
  }

  public get canInstall(): boolean { return this.isInstallable;
   }
}

export default { getDeviceCapabilities: hapticFeedback,
  TouchHandler, smoothScroll,
  createVirtualKeyboardDetector, getSafeAreaInsets,
  createMobileLazyLoader, optimizeForMobile, PWAInstallPrompt,
  TOUCH_CONFIG
}