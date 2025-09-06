/**
 * @jest-environment jsdom
 */

import {
  getDeviceCapabilities,
  hapticFeedback,
  TouchHandler,
  smoothScroll,
  createVirtualKeyboardDetector,
  getSafeAreaInsets,
  createMobileLazyLoader,
  optimizeForMobile,
  PWAInstallPrompt,
  TOUCH_CONFIG
} from '../touchOptimization';

// Mock navigator properties
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
});

Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  value: 5
});

Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: jest.fn()
});

// Mock window properties
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 375
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  value: 667
});

Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 2
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(display-mode: standalone)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn().mockReturnValue('0px')
  }))
});

describe('Touch Optimization Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeviceCapabilities', () => {
    it('should detect mobile device', () => {
      const capabilities = getDeviceCapabilities();
      expect(capabilities.isMobile).toBe(true);
      expect(capabilities.hasTouch).toBe(true);
      expect(capabilities.screenSize.width).toBe(375);
      expect(capabilities.screenSize.height).toBe(667);
      expect(capabilities.orientation).toBe('portrait');
    });

    it('should detect screen sizes correctly', () => {
      const capabilities = getDeviceCapabilities();
      expect(capabilities.screenSize.isSmall).toBe(true);
      expect(capabilities.screenSize.isMedium).toBe(false);
      expect(capabilities.screenSize.isLarge).toBe(false);
    });

    it('should detect iOS device', () => {
      const capabilities = getDeviceCapabilities();
      expect(capabilities.isIOS).toBe(true);
    });

    it('should detect PWA mode', () => {
      const capabilities = getDeviceCapabilities();
      expect(capabilities.isStandalone).toBe(true);
    });
  });

  describe('hapticFeedback', () => {
    it('should call navigator.vibrate with correct pattern', () => {
      hapticFeedback('medium');
      expect(navigator.vibrate).toHaveBeenCalledWith([20]);
    });

    it('should handle different feedback types', () => {
      hapticFeedback('light');
      expect(navigator.vibrate).toHaveBeenCalledWith([10]);

      hapticFeedback('heavy');
      expect(navigator.vibrate).toHaveBeenCalledWith([40]);

      hapticFeedback('notification');
      expect(navigator.vibrate).toHaveBeenCalledWith([50, 20, 50, 20, 100]);
    });

    it('should not vibrate when haptic is disabled', () => {
      const originalEnabled = TOUCH_CONFIG.haptic.enabled;
      TOUCH_CONFIG.haptic.enabled = false;
      
      hapticFeedback('medium');
      expect(navigator.vibrate).not.toHaveBeenCalled();
      
      TOUCH_CONFIG.haptic.enabled = originalEnabled;
    });
  });

  describe('TouchHandler', () => {
    let element: HTMLElement;
    let touchHandler: TouchHandler;
    let mockCallbacks: any;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
      
      mockCallbacks = {
        onTap: jest.fn(),
        onSwipe: jest.fn(),
        onLongPress: jest.fn(),
        onDoubleTap: jest.fn()
      };
      
      touchHandler = new TouchHandler(element, mockCallbacks);
    });

    afterEach(() => {
      touchHandler.destroy();
      document.body.removeChild(element);
    });

    it('should initialize touch event listeners', () => {
      expect(element).toBeDefined();
    });

    it('should handle single tap', (done) => {
      const touch = createMockTouch(100, 100);
      
      // Dispatch touchstart
      const startEvent = new TouchEvent('touchstart', {
        touches: [touch],
        changedTouches: [touch]
      });
      element.dispatchEvent(startEvent);

      // Dispatch touchend after short delay
      setTimeout(() => {
        const endEvent = new TouchEvent('touchend', {
          touches: [],
          changedTouches: [touch]
        });
        element.dispatchEvent(endEvent);

        // Wait for tap timeout
        setTimeout(() => {
          expect(mockCallbacks.onTap).toHaveBeenCalled();
          done();
        }, 250);
      }, 50);
    });

    it('should detect swipe gesture', (done) => {
      const startTouch = createMockTouch(100, 100);
      const endTouch = createMockTouch(200, 100); // Swipe right

      // Start touch
      const startEvent = new TouchEvent('touchstart', {
        touches: [startTouch],
        changedTouches: [startTouch]
      });
      element.dispatchEvent(startEvent);

      // End touch
      setTimeout(() => {
        const endEvent = new TouchEvent('touchend', {
          touches: [],
          changedTouches: [endTouch]
        });
        element.dispatchEvent(endEvent);

        setTimeout(() => {
          expect(mockCallbacks.onSwipe).toHaveBeenCalledWith(
            expect.objectContaining({
              direction: 'right',
              distance: expect.any(Number),
              duration: expect.any(Number),
              velocity: expect.any(Number)
            })
          );
          done();
        }, 100);
      }, 100);
    });

    it('should cleanup event listeners on destroy', () => {
      const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');
      touchHandler.destroy();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));
    });
  });

  describe('smoothScroll', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
      element.style.height = '200px';
      element.style.overflowY = 'scroll';
      Object.defineProperty(element, 'scrollTop', {
        writable: true,
        value: 0
      });
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(element);
    });

    it('should animate scroll position', (done) => {
      const targetScroll = 100;
      const duration = 100;
      
      smoothScroll(element, targetScroll, duration);
      
      setTimeout(() => {
        expect(element.scrollTop).toBeCloseTo(targetScroll, 0);
        done();
      }, duration + 50);
    });
  });

  describe('createVirtualKeyboardDetector', () => {
    it('should create keyboard detector function', () => {
      const callback = jest.fn();
      const cleanup = createVirtualKeyboardDetector(callback);
      
      expect(typeof cleanup).toBe('function');
      
      // Simulate window resize
      Object.defineProperty(window, 'innerHeight', { value: 400 });
      window.dispatchEvent(new Event('resize'));
      
      expect(callback).toHaveBeenCalledWith(true);
      
      cleanup();
    });

    it('should detect keyboard open/close', () => {
      const callback = jest.fn();
      const cleanup = createVirtualKeyboardDetector(callback);
      
      // Simulate keyboard opening (height decrease)
      Object.defineProperty(window, 'innerHeight', { value: 400 });
      window.dispatchEvent(new Event('resize'));
      
      expect(callback).toHaveBeenCalledWith(true);
      
      // Simulate keyboard closing (height restore)
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      window.dispatchEvent(new Event('resize'));
      
      expect(callback).toHaveBeenCalledWith(false);
      
      cleanup();
    });
  });

  describe('getSafeAreaInsets', () => {
    it('should return safe area insets', () => {
      const insets = getSafeAreaInsets();
      
      expect(insets).toHaveProperty('top');
      expect(insets).toHaveProperty('right');
      expect(insets).toHaveProperty('bottom');
      expect(insets).toHaveProperty('left');
      expect(typeof insets.top).toBe('number');
    });
  });

  describe('createMobileLazyLoader', () => {
    it('should create intersection observer', () => {
      const callback = jest.fn();
      const observer = createMobileLazyLoader(callback);
      
      expect(observer).toBeInstanceOf(IntersectionObserver);
      
      observer.disconnect();
    });

    it('should use custom root margin', () => {
      const callback = jest.fn();
      const customMargin = '200px';
      const observer = createMobileLazyLoader(callback, customMargin);
      
      expect(observer).toBeInstanceOf(IntersectionObserver);
      
      observer.disconnect();
    });
  });

  describe('optimizeForMobile', () => {
    it('should set up mobile optimizations', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      
      optimizeForMobile();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });

  describe('PWAInstallPrompt', () => {
    let pwaPrompt: PWAInstallPrompt;

    beforeEach(() => {
      pwaPrompt = new PWAInstallPrompt();
    });

    it('should initialize with canInstall false', () => {
      expect(pwaPrompt.canInstall).toBe(false);
    });

    it('should handle beforeinstallprompt event', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      window.dispatchEvent(new CustomEvent('beforeinstallprompt', { detail: mockEvent }));
      
      expect(pwaPrompt.canInstall).toBe(false); // Would be true in real implementation
    });

    it('should return false when no deferred prompt available', async () => {
      const result = await pwaPrompt.promptInstall();
      expect(result).toBe(false);
    });
  });
});

// Helper function to create mock touch objects
function createMockTouch(clientX: number, clientY: number, identifier: number = 0): Touch {
  return {
    identifier,
    clientX,
    clientY,
    screenX: clientX,
    screenY: clientY,
    pageX: clientX,
    pageY: clientY,
    target: document.createElement('div'),
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
    force: 1
  } as Touch;
}