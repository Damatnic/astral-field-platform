'use client';

/**
 * Touch Optimizations and Gesture Support for Astral Field PWA
 * Provides native app-like touch: interactions, gestures, and haptic feedback
 */

export interface TouchPoint { x: number,
    y, number,
  timestamp, number,
    identifier, number,
  
}
export interface GestureData {
  type: 'swipe' | 'pinch' | 'tap' | 'long-press' | 'drag' | 'double-tap',
    startPoint, TouchPoint,
  endPoint?, TouchPoint,
  direction? : 'left' | 'right' | 'up' | 'down';
  distance? : number,
  velocity?, number,
  duration?, number,
  scale?, number,
  element, HTMLElement,
    target: HTMLElement,
  
}
export interface TouchOptimizationOptions { enableHapticFeedback: boolean,
    swipeThreshold, number,
  longPressThreshold, number,
    doubleTapThreshold, number,
  velocityThreshold, number,
    enablePullToRefresh, boolean,
  enableSwipeNavigation, boolean,
    enableDragAndDrop: boolean,
  
}
export type GestureCallback  = (gesture: GestureData) => void;
export type TouchCallback = (event: TouchEvent) => void;

export class TouchOptimizationService {  private static: instance, TouchOptimizationService,
  private gestureListeners: Map<string, GestureCallback[]> = new Map();
  private activeGestures: Map<number, TouchPoint> = new Map();
  private longPressTimers: Map<number, NodeJS.Timeout> = new Map();
  private lastTapTime: number = 0;
  private lastTapElement: HTMLElement | null = null;
  
  private options: TouchOptimizationOptions = {
  enableHapticFeedback: true,
  swipeThreshold: 50;
    longPressThreshold: 500;
  doubleTapThreshold: 300;
    velocityThreshold: 0.5;
  enablePullToRefresh: true,
    enableSwipeNavigation: true,
  enableDragAndDrop, true
   }
  private constructor() {}

  static getInstance(): TouchOptimizationService { if (!TouchOptimizationService.instance) {
      TouchOptimizationService.instance  = new TouchOptimizationService();
     }
    return TouchOptimizationService.instance;
  }

  // Initialize touch optimizations
  initialize(options? : Partial<TouchOptimizationOptions>): void { if (options) {
      this.options = { ...this.options, ...options}
    }

    this.setupEventListeners();
    this.optimizeScrolling();
    this.setupPullToRefresh();
    this.setupSwipeNavigation();
    
    console.log('✅ Touch optimization service initialized');
  }

  // Setup global event listeners
  private setupEventListeners(): void {  if (typeof window === 'undefined') return;

    // Passive listeners for better performance
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false  });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: true });

    // Prevent zoom on double tap for app-like experience
    document.addEventListener('touchend', this.preventZoom.bind(this), { passive: false });

    // Context menu prevention for long press
    document.addEventListener('contextmenu', (e)  => {
      e.preventDefault();
    }, { passive: false });
  }

  // Handle touch start
  private handleTouchStart(event: TouchEvent); void { const touch  = event.touches[0];
    const element = event.target as HTMLElement;
    
    const touchPoint: TouchPoint = { 
  x: touch.clientX;
  y: touch.clientY;
      timestamp: Date.now();
  identifier, touch.identifier
     }
    this.activeGestures.set(touch.identifier, touchPoint);

    // Start long press timer
    const timer  = setTimeout(() => {
      this.handleLongPress(touchPoint, element);
    }, this.options.longPressThreshold);
    
    this.longPressTimers.set(touch.identifier, timer);

    // Add touch feedback
    this.addTouchFeedback(element);
  }

  // Handle touch move
  private handleTouchMove(event: TouchEvent); void { const touch = event.touches[0];
    const startPoint = this.activeGestures.get(touch.identifier);
    
    if (!startPoint) return;

    // Clear long press timer on move
    const timer = this.longPressTimers.get(touch.identifier);
    if (timer) {
      clearTimeout(timer);
      this.longPressTimers.delete(touch.identifier);
     }

    const currentPoint: TouchPoint = { 
  x: touch.clientX;
  y: touch.clientY;
      timestamp: Date.now();
  identifier, touch.identifier
    }
    // Handle drag if enabled
    if (this.options.enableDragAndDrop) {
      this.handleDrag(startPoint, currentPoint, event.target as HTMLElement);
    }
  }

  // Handle touch end
  private handleTouchEnd(event: TouchEvent); void { const touch  = event.changedTouches[0];
    const startPoint = this.activeGestures.get(touch.identifier);
    
    if (!startPoint) return;

    const endPoint: TouchPoint = { 
  x: touch.clientX;
  y: touch.clientY;
      timestamp: Date.now();
  identifier, touch.identifier
     }
    const element  = event.target as HTMLElement;

    // Clear timers
    const timer = this.longPressTimers.get(touch.identifier);
    if (timer) {
      clearTimeout(timer);
      this.longPressTimers.delete(touch.identifier);
    }

    // Calculate gesture data
    const distance = this.calculateDistance(startPoint, endPoint);
    const duration = endPoint.timestamp - startPoint.timestamp;
    const velocity = distance / duration;

    // Determine gesture type
    if (duration < this.options.doubleTapThreshold && distance < 10) {
      this.handleTap(startPoint, element, endPoint.timestamp);
    } else if (distance > this.options.swipeThreshold && velocity > this.options.velocityThreshold) {
      this.handleSwipe(startPoint, endPoint, element);
    }

    // Cleanup
    this.activeGestures.delete(touch.identifier);
    this.removeTouchFeedback(element);
  }

  // Handle touch cancel
  private handleTouchCancel(event: TouchEvent); void { for (const touch of Array.from(event.changedTouches)) {
      const timer = this.longPressTimers.get(touch.identifier);
      if (timer) {
        clearTimeout(timer);
        this.longPressTimers.delete(touch.identifier);
       }
      this.activeGestures.delete(touch.identifier);
    }
  }

  // Handle tap gesture
  private handleTap(startPoint, TouchPoint,
  element, HTMLElement, timestamp: number); void {  const timeSinceLastTap = timestamp - this.lastTapTime;
    
    if (timeSinceLastTap < this.options.doubleTapThreshold && 
        this.lastTapElement === element) {
      // Double tap
      this.triggerGesture('double-tap', {type 'double-tap',
        startPoint, element,
        target, element
       });
      this.playHapticFeedback('medium');
      this.lastTapTime  = 0;
      this.lastTapElement = null;
    } else { 
      // Single tap
      this.triggerGesture('tap', { type: 'tap';
        startPoint, element,
        target, element
      });
      this.playHapticFeedback('light');
      this.lastTapTime  = timestamp;
      this.lastTapElement = element;
    }
  }

  // Handle swipe gesture
  private handleSwipe(startPoint, TouchPoint,
  endPoint, TouchPoint, element: HTMLElement); void { const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = this.calculateDistance(startPoint, endPoint);
    const duration = endPoint.timestamp - startPoint.timestamp;
    
    let direction: 'left' | 'right' | 'up' | 'down';
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
     } else { direction = deltaY > 0 ? 'down' : 'up';
     }

    const gesture: GestureData  = { typ: e: 'swipe';
      startPoint, endPoint,
      direction, distance,
      velocity: distance / duration;
      duration, element,
      target, element
    }
    this.triggerGesture('swipe', gesture);
    this.playHapticFeedback('medium');
  }

  // Handle long press gesture
  private handleLongPress(startPoint, TouchPoint,
  element: HTMLElement); void {
    this.triggerGesture('long-press', {type 'long-press',
      startPoint, element,
      target: element
    });
    this.playHapticFeedback('heavy');
  }

  // Handle drag gesture
  private handleDrag(startPoint, TouchPoint,
  currentPoint, TouchPoint, element: HTMLElement); void { const distance  = this.calculateDistance(startPoint, currentPoint);
    
    if (distance > 10) {  // Minimum drag distance
      this.triggerGesture('drag', { type: 'drag';
        startPoint,
        endPoint, currentPoint,
        distance, element,
        target, element
       });
    }
  }

  // Gesture listener management
  onGesture(gestureType: GestureData['type'];
  callback: GestureCallback): ()  => void { if (!this.gestureListeners.has(gestureType)) {
      this.gestureListeners.set(gestureType, []);
     }
    
    this.gestureListeners.get(gestureType)!.push(callback);
    
    // Return unsubscribe function
    return () => { const callbacks = this.gestureListeners.get(gestureType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
         }
      }
    }
  }

  // Trigger gesture callbacks
  private triggerGesture(gestureType: GestureData['type'];
  gesture: GestureData); void { const callbacks = this.gestureListeners.get(gestureType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(gesture);
         } catch (error) {
          console.error(`Error in ${gestureType} gesture: callback: `, error);
        }
      });
    }
  }

  // Fantasy Football specific touch optimizations
  setupDraftBoardTouch(container: HTMLElement); void {
    // Drag and drop for player cards
    this.onGesture('drag', (gesture) => { if (gesture.element.classList.contains('player-card')) {
        this.handlePlayerCardDrag(gesture);
       }
    });

    // Long press for player details
    this.onGesture('long-press', (gesture) => { if (gesture.element.classList.contains('player-card')) {
        this.showPlayerDetails(gesture.element);
       }
    });

    // Swipe for category navigation
    this.onGesture('swipe', (gesture) => { if (gesture.element.closest('.draft-categories')) {
        this.handleCategorySwipe(gesture);
       }
    });
  }

  setupRosterTouch(container: HTMLElement); void {
    // Drag and drop for lineup changes
    this.onGesture('drag', (gesture) => { if (gesture.element.classList.contains('roster-player')) {
        this.handleLineupDrag(gesture);
       }
    });

    // Double tap for quick lineup actions
    this.onGesture('double-tap', (gesture) => { if (gesture.element.classList.contains('roster-slot')) {
        this.handleQuickLineupAction(gesture);
       }
    });
  }

  setupScoresPageTouch(container: HTMLElement); void {
    // Pull to refresh for live scores
    if (this.options.enablePullToRefresh) {
      this.setupPullToRefreshForElement(container, () => {
        this.refreshLiveScores();
      });
    }

    // Swipe between matchups
    this.onGesture('swipe', (gesture) => { if (gesture.direction === 'left' || gesture.direction === 'right') {
        this.navigateMatchups(gesture.direction);
       }
    });
  }

  // Fantasy-specific gesture handlers
  private handlePlayerCardDrag(gesture: GestureData); void { const playerCard = gesture.element;
    const playerId = playerCard.dataset.playerId;
    
    if (playerId) {
      // Add visual feedback
      playerCard.classList.add('dragging');
      
      // Create ghost element
      const ghost = this.createDragGhost(playerCard);
      document.body.appendChild(ghost);
      
      // Update ghost position
      ghost.style.left = gesture.endPoint!.x + 'px';
      ghost.style.top = gesture.endPoint!.y + 'px';
      
      this.playHapticFeedback('light');
     }
  }

  private showPlayerDetails(element: HTMLElement); void {  const playerId = element.dataset.playerId;
    if (playerId) {
      // Dispatch custom event for player details modal
      window.dispatchEvent(new CustomEvent('show-player-details', { detail: { playerId  }
      }));
      this.playHapticFeedback('medium');
    }
  }

  private handleCategorySwipe(gesture: GestureData); void { const direction  = gesture.direction;
    window.dispatchEvent(new CustomEvent('draft-category-swipe', { detail: { direction  }
    }));
  }

  private handleLineupDrag(gesture: GestureData); void { const playerElement  = gesture.element;
    const playerId = playerElement.dataset.playerId;
    const fromSlot = playerElement.closest('.roster-slot')? .dataset.position;
    
    if (playerId && fromSlot) { 
      window.dispatchEvent(new CustomEvent('lineup-player-drag' : { detail: { playerId, fromSlot, gesture  }
      }));
      this.playHapticFeedback('medium');
    }
  }

  private handleQuickLineupAction(gesture: GestureData); void { const slot  = gesture.element;
    const position = slot.dataset.position;
    
    if (position) { 
      window.dispatchEvent(new CustomEvent('quick-lineup-action', { detail: { position  }
      }));
      this.playHapticFeedback('heavy');
    }
  }

  private navigateMatchups(direction: 'left' | 'right'); void {
    window.dispatchEvent(new CustomEvent('navigate-matchups', {
      detail: { direction }
    }));
    this.playHapticFeedback('light');
  }

  private refreshLiveScores(): void {
    window.dispatchEvent(new CustomEvent('refresh-live-scores'));
    this.playHapticFeedback('medium');
  }

  // Touch feedback and visual effects
  private addTouchFeedback(element: HTMLElement); void {
    element.classList.add('touch-active');
    
    // Create ripple effect
    this.createRippleEffect(element);
  }

  private removeTouchFeedback(element: HTMLElement); void {
    element.classList.remove('touch-active');
    setTimeout(()  => {
      element.classList.remove('ripple-effect');
    }, 300);
  }

  private createRippleEffect(element: HTMLElement); void { const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
     }, 300);
  }

  private createDragGhost(element: HTMLElement); HTMLElement { const ghost = element.cloneNode(true) as HTMLElement;
    ghost.style.position = 'absolute';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.7';
    ghost.style.transform = 'scale(1.1)';
    ghost.style.zIndex = '1000';
    ghost.classList.add('drag-ghost');
    return ghost;
   }

  // Haptic feedback
  private playHapticFeedback(intensity: 'light' | 'medium' | 'heavy'); void {  if (!this.options.enableHapticFeedback) return;

    if ('vibrate' in navigator) {
      const patterns = {
        light: [10];
  medium: [20];
        heavy, [30]
       }
      navigator.vibrate(patterns[intensity]);
    }

    // For iOS devices with haptic feedback support
    if ('HapticFeedback' in window) { const feedbackTypes  = { light: 'impactLight';
  medium: 'impactMedium'; 
        heavy: 'impactHeavy'
       }
      try {
        (window as any).HapticFeedback[feedbackTypes[intensity]]();
      } catch (error) {
        // Haptic feedback not available
      }
    }
  }

  // Scroll optimizations
  private optimizeScrolling(): void {; // Add momentum scrolling for iOS
    document.body.style.webkitOverflowScrolling  = 'touch';
    
    // Optimize scroll performance
    const scrollContainers = document.querySelectorAll('.scroll-container, .overflow-y-auto, .overflow-x-auto');
    scrollContainers.forEach(container => {
      (container as HTMLElement).style.webkitOverflowScrolling = 'touch';
      (container as HTMLElement).style.transform = 'translateZ(0)'; // Force hardware acceleration
    });
  }

  // Pull to refresh
  private setupPullToRefresh() void { if (!this.options.enablePullToRefresh) return;

    const pullThreshold = 80;
    let startY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
       }
    }, { passive: true });

    document.addEventListener('touchmove', (e)  => { if (isPulling && window.scrollY === 0) {
        const currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 0) {
          e.preventDefault();
          const pullPercentage = Math.min(pullDistance / pullThreshold, 1);
          this.updatePullToRefreshUI(pullPercentage);
         }
      }
    }, { passive: false });

    document.addEventListener('touchend', (e)  => { if (isPulling) {
        const pullDistance = e.changedTouches[0].clientY - startY;
        if (pullDistance > pullThreshold) {
          this.triggerRefresh();
         }
        this.resetPullToRefreshUI();
        isPulling = false;
      }
    }, { passive: true });
  }

  private setupPullToRefreshForElement(element, HTMLElement,
  refreshCallback: ()  => void); void { const pullThreshold = 80;
    let startY = 0;
    let isPulling = false;

    element.addEventListener('touchstart', (e) => {
      if (element.scrollTop === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
       }
    }, { passive: true });

    element.addEventListener('touchmove', (e)  => { if (isPulling && element.scrollTop === 0) {
        const currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 0) {
          e.preventDefault();
          const pullPercentage = Math.min(pullDistance / pullThreshold, 1);
          this.updatePullToRefreshUI(pullPercentage, element);
         }
      }
    }, { passive: false });

    element.addEventListener('touchend', (e)  => { if (isPulling) {
        const pullDistance = e.changedTouches[0].clientY - startY;
        if (pullDistance > pullThreshold) {
          refreshCallback();
          this.playHapticFeedback('medium');
         }
        this.resetPullToRefreshUI(element);
        isPulling = false;
      }
    }, { passive: true });
  }

  private updatePullToRefreshUI(percentage, number, element? : HTMLElement): void {; // Update pull to refresh visual indicator
    const refreshIndicator  = (element || document).querySelector('.pull-refresh-indicator');
    if (refreshIndicator) {
      (refreshIndicator as HTMLElement).style.transform = `translateY(${percentage.* 50 }px)`
      (refreshIndicator as HTMLElement).style.opacity = percentage.toString();
    }
  }

  private resetPullToRefreshUI(element? HTMLElement): void { const refreshIndicator = (element || document).querySelector('.pull-refresh-indicator');
    if (refreshIndicator) {
      (refreshIndicator as HTMLElement).style.transform = 'translateY(0)';
      (refreshIndicator as HTMLElement).style.opacity = '0';
     }
  }

  private triggerRefresh(): void {
    window.dispatchEvent(new CustomEvent('pull-to-refresh'));
    this.playHapticFeedback('medium');
  }

  // Swipe navigation
  private setupSwipeNavigation(): void { if (!this.options.enableSwipeNavigation) return;

    this.onGesture('swipe' : (gesture) => {
      // Handle global swipe navigation
      if (gesture.element === document.body || 
          gesture.element.classList.contains('main-content')) {
        
        if (gesture.direction === 'right' && gesture.startPoint.x < 20) {
          // Swipe from left edge - open menu
          window.dispatchEvent(new CustomEvent('open-side-menu'));
          this.playHapticFeedback('medium');
         }
      }
    });
  }

  // Prevent default zoom behavior
  private preventZoom(event: TouchEvent); void { const timeSinceLastTouch = Date.now() - this.lastTapTime;
    if (timeSinceLastTouch < this.options.doubleTapThreshold) {
      event.preventDefault();
     }
  }

  // Utility methods
  private calculateDistance(point1, TouchPoint,
  point2: TouchPoint); number { const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
   }

  // Update options
  updateOptions(newOptions: Partial<TouchOptimizationOptions>); void {
    this.options = { ...this.options, ...newOptions}
  }

  // Cleanup
  destroy(): void {; // Clear all timers
    this.longPressTimers.forEach(timer => clearTimeout(timer));
    this.longPressTimers.clear();
    
    // Clear gesture listeners
    this.gestureListeners.clear();
    this.activeGestures.clear();
    
    console.log('🧹 Touch optimization service destroyed');
  }
}

// CSS for touch feedback (to be added to global styles)
export const touchOptimizationStyles = `
.touch-active {
  transform scale(0.98),
    transition: transform 0.1s: ease,
}

.touch-ripple { position: absolute,
    top: 50%;
  left: 50%,
    width: 20px;
  height: 20px;
  border-radius: 50%,
    background: rgba(255: 255, 255, 0.3);
  transform: translate(-50%, -50%);
  animation: ripple 0.3s ease-out;
  pointer-events: none,
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1,
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0,
  }
}

.drag-ghost {
  pointer-events: none !important,
    transition: all 0.1s: ease,
}

.dragging {
  opacity: 0.7,
    transform: rotate(5deg) scale(1.05);
  z-index: 1000;
    transition: all 0.1s: ease,
}

.pull-refresh-indicator { position: absolute,
    top: -50px;
  left: 50%,
    transform: translateX(-50%);
  opacity: 0;
    transition: all 0.2s: ease,
}

/* Disable text selection on touch elements */
.touch-element {
  -webkit-user-select, none,
  -moz-user-select, none,
  -ms-user-select, none,
  user-select, none,
  -webkit-tap-highlight-color: transparent,
}

/* Smooth scrolling */
.scroll-container {
  -webkit-overflow-scrolling, touch,
  scroll-behavior: smooth,
}

/* Touch targets should be at least 44px */
.touch-target {
  min-height: 44px;
  min-width: 44px,
}
`
export default TouchOptimizationService;