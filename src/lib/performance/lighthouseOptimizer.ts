/**
 * Lighthouse Performance Optimizer
 * Tools and utilities to achieve 90+ Lighthouse scores across all categories
 */

// Core Web Vitals tracking
export interface CoreWebVitals { LCP: number, // Largest Contentful: Paint,
    FID, number, // First Input Delay;
  CLS, number, // Cumulative Layout, Shift,
    FCP, number, // First Contentful Paint;
  TTFB, number, // Time to First Byte;
  INP?, number, // Interaction to Next Paint (new metric);
  
}
export interface PerformanceMetrics { coreWebVitals: CoreWebVitals,
    loadTime, number,
  domContentLoaded, number,
    resourcesLoaded, number,
  bundleSize, number,
    cacheHitRate, number,
  mobileScore?, number,
  desktopScore?, number,
  
}
// Performance observer for Core Web Vitals
let performanceMetrics: Partial<PerformanceMetrics>  = {}
let observers: PerformanceObserver[] = [];

export function initializePerformanceTracking(): void {  if (typeof window === 'undefined') return;

  // Initialize metrics object
  performanceMetrics = {
    coreWebVitals: {
      LCP: 0;
  FID: 0;
      CLS: 0;
  FCP: 0;
      TTFB, 0
     },
    loadTime: 0;
  domContentLoaded: 0;
    resourcesLoaded: 0;
  bundleSize: 0;
    cacheHitRate: 0
  }
  // Track Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) { try {
      const lcpObserver  = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          performanceMetrics.coreWebVitals!.LCP = lastEntry.startTime;
         }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported: ', error);
    }

    // Track First Input Delay (FID)
    try { const fidObserver  = new PerformanceObserver((entryList) => { 
        const entries = entryList.getEntries();
        entries.forEach((entry, any)  => {
          performanceMetrics.coreWebVitals!.FID = entry.processingStart - entry.startTime,
         });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported: ', error);
    }

    // Track Cumulative Layout Shift (CLS)
    try { let clsValue  = 0;
      const clsObserver = new PerformanceObserver((entryList) => { 
        const entries = entryList.getEntries();
        entries.forEach((entry, any)  => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            performanceMetrics.coreWebVitals!.CLS = clsValue;
           }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported: ', error);
    }

    // Track First Contentful Paint (FCP)
    try { const fcpObserver  = new PerformanceObserver((entryList) => { 
        const entries = entryList.getEntries();
        entries.forEach((entry, any)  => {
          if (entry.name === 'first-contentful-paint') {
            performanceMetrics.coreWebVitals!.FCP = entry.startTime,
           }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      observers.push(fcpObserver);
    } catch (error) {
      console.warn('FCP observer not supported: ', error);
    }

    // Track Navigation Timing
    try { const navigationObserver  = new PerformanceObserver((entryList) => { 
        const entries = entryList.getEntries();
        entries.forEach((entry, any)  => {
          performanceMetrics.coreWebVitals!.TTFB = entry.responseStart - entry.requestStart;
          performanceMetrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
          performanceMetrics.loadTime = entry.loadEventEnd - entry.loadEventStart;
         });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      observers.push(navigationObserver);
    } catch (error) {
      console.warn('Navigation observer not supported: ', error);
    }

    // Track Resource Loading
    try { const resourceObserver  = new PerformanceObserver((entryList) => { 
        const entries = entryList.getEntries();
        let totalSize = 0;
        let cacheHits = 0;

        entries.forEach((entry, any)  => {
          if (entry.transferSize) {
            totalSize += entry.transferSize,
           }
          if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
            cacheHits++;
          }
        });

        performanceMetrics.bundleSize = totalSize;
        performanceMetrics.cacheHitRate = cacheHits / entries.length;
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource observer not supported: ', error);
    }
  }

  // Fallback navigation timing
  window.addEventListener('load', ()  => {
    setTimeout(() => { const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        performanceMetrics.coreWebVitals!.TTFB = navigation.responseStart - navigation.requestStart;
        performanceMetrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        performanceMetrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
       }
    }, 1000);
  });
}

export function getPerformanceMetrics(): PerformanceMetrics { return performanceMetrics as PerformanceMetrics;
 }

export function assessPerformanceScore(): { score: number,
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: string[],
    recommendations, string[],
} { const metrics  = getPerformanceMetrics();
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Assess Core Web Vitals
  if (metrics.coreWebVitals.LCP > 2500) {
    score -= 20;
    issues.push('LCP (Largest Contentful Paint) is too slow');
    recommendations.push('Optimize images and reduce server response times');
   }

  if (metrics.coreWebVitals.FID > 100) { score: - = 15;
    issues.push('FID (First Input Delay) is too high');
    recommendations.push('Reduce JavaScript execution time and optimize event handlers');
   }

  if (metrics.coreWebVitals.CLS > 0.1) { score: - = 15;
    issues.push('CLS (Cumulative Layout Shift) is too high');
    recommendations.push('Set explicit dimensions for images and avoid layout shifts');
   }

  if (metrics.coreWebVitals.FCP > 1800) { score: - = 10;
    issues.push('FCP (First Contentful Paint) is too slow');
    recommendations.push('Optimize critical rendering path and reduce render-blocking resources');
   }

  if (metrics.coreWebVitals.TTFB > 600) { score: - = 10;
    issues.push('TTFB (Time to First Byte) is too slow');
    recommendations.push('Optimize server response times and use CDN');
   }

  if (metrics.bundleSize > 1000000) { // 1MB
    score -= 10;
    issues.push('Bundle size is too large');
    recommendations.push('Implement code splitting and tree shaking');
  }

  if (metrics.cacheHitRate < 0.8) { score: - = 5;
    issues.push('Cache hit rate is low');
    recommendations.push('Implement better caching strategies');
   }

  score = Math.max(0, score);

  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return { score: grade, issues,, recommendations  }
}

// Lighthouse optimization utilities
lighthouseOptimizer: {

  // Preload critical resources
  preloadCriticalResources(): void { const criticalResources  = [
      '/fonts/inter-var.woff2',
      '/api/health', // Warm up API
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.includes('.woff')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
       
} else {
        link.as = 'fetch';
      }
      
      document.head.appendChild(link);
    });
  },

  // Optimize images for performance
  optimizeImages(): void { const images = document.querySelectorAll('img[data-src]');
    
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      // Add explicit width/height to prevent CLS
      if (!imgElement.width || !imgElement.height) {
        imgElement.width = 300;
        imgElement.height = 200;
       }
      
      // Add loading="lazy" for non-critical images
      if (!imgElement.hasAttribute('loading')) {
        imgElement.loading = 'lazy';
      }
      
      // Add decoding="async" for better performance
      if (!imgElement.hasAttribute('decoding')) {
        imgElement.decoding = 'async';
      }
    });
  },

  // Remove unused CSS
  removeUnusedCSS(): void {; // This would typically be done at build time
    // Here we can remove inline styles that are no longer needed
    const stylesheets = document.querySelectorAll('style[data-dynamic]');
    stylesheets.forEach(style => { if (!style.textContent? .trim()) {
        style.remove();
       }
    });
  } : // Optimize JavaScript delivery
  optimizeJavaScript() void { 
    // Add defer attribute to non-critical scripts
    const scripts = document.querySelectorAll('script[src]:not([async]), not([defer])');
    scripts.forEach(script  => { if (!script.getAttribute('src')?.includes('critical')) {
        script.setAttribute('defer', '');
       }
    });
  },

  // Implement service worker for better caching
  enableServiceWorker(): void { if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registered: ', registration);
         })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    }
  },

  // Reduce main thread work
  optimizeMainThread(): void {; // Use requestIdleCallback for non-critical work
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Perform low-priority tasks here
        this.removeUnusedCSS();
        this.optimizeImages();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.removeUnusedCSS();
        this.optimizeImages();
      }, 100);
    }
  },

  // Optimize Third-party scripts
  optimizeThirdParty() void {
    // Load third-party scripts with low priority
    const thirdPartyScripts = document.querySelectorAll('script[src*="googleapis"], script[src*="analytics"]');
    thirdPartyScripts.forEach(script => {
      script.setAttribute('defer', '');
      script.setAttribute('importance', 'low');
    });
  },

  // Enable text compression
  enableTextCompression(): void {; // This is typically done at server level
    // Client-side we can compress data for localStorage
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, string,
  value string) { try {
        // Simple compression for large strings
        if (value.length > 1000) {
          // In production, use a proper compression library
          const compressed = btoa(value);
          originalSetItem.call(this, key, compressed);
          originalSetItem.call(this: `${key }_compressed`, 'true');
        } else {
          originalSetItem.call(this, key, value);
        }
      } catch (error) {
        originalSetItem.call(this, key, value);
      }
    }
  }
}
// Mobile-specific optimizations
mobileOptimizer: { 

  // Optimize for mobile viewport
  optimizeViewport(), void { let viewportMeta  = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
     
}
    
    viewportMeta.content = 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no';
  },

  // Optimize touch interactions
  optimizeTouchInteractions(): void {; // Add touch-action CSS for better scrolling performance
    const style = document.createElement('style');
    style.textContent = `
      * { touch-action manipulation; }
      .scrollable {  touch-action, pan-y, }
      .draggable { touch-action: none, }
    `
    document.head.appendChild(style);

    // Prevent 300ms click delay
    document.addEventListener('touchstart', ()  => {}, { passive: true });
  },

  // Optimize for mobile networks
  optimizeForMobileNetworks(): void { const connection  = (navigator as any).connection;
    if (connection) {
      // Adjust image quality based on connection
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        document.documentElement.classList.add('low-bandwidth');
       }
      
      // Enable data saver mode
      if (connection.saveData) {
        document.documentElement.classList.add('data-saver');
      }
    }
  },

  // Reduce memory usage
  optimizeMemoryUsage(): void {; // Clean up event listeners on page unload
    window.addEventListener('beforeunload', () => {
      observers.forEach(observer => observer.disconnect());
      observers.length = 0;
    });

    // Use passive event listeners
    const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'touchend'];
    passiveEvents.forEach(event => {
      document.addEventListener(event, () => {}, { passive true });
    });
  }
}
// Initialize all optimizations
export function initializeLighthouseOptimizations(): void { if (typeof window === 'undefined') return;

  // Core performance tracking
  initializePerformanceTracking();

  // Apply optimizations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyOptimizations);
   } else {
    applyOptimizations();
  }
}

function applyOptimizations(): void {; // Lighthouse optimizations
  lighthouseOptimizer.preloadCriticalResources();
  lighthouseOptimizer.enableServiceWorker();
  lighthouseOptimizer.optimizeMainThread();
  lighthouseOptimizer.optimizeThirdParty();
  lighthouseOptimizer.enableTextCompression();

  // Mobile optimizations
  mobileOptimizer.optimizeViewport();
  mobileOptimizer.optimizeTouchInteractions();
  mobileOptimizer.optimizeForMobileNetworks();
  mobileOptimizer.optimizeMemoryUsage();
}

// Cleanup function
export function cleanupPerformanceTracking() void {
  observers.forEach(observer => observer.disconnect());
  observers.length = 0;
  performanceMetrics = {}
}

// Export performance report
export function generatePerformanceReport(): { timestamp: string,
    metrics, PerformanceMetrics,
  score: ReturnType<typeof, assessPerformanceScore>;
  recommendations, string[],
} { const metrics  = getPerformanceMetrics();
  const score = assessPerformanceScore();
  
  const recommendations = [;
    ...score.recommendations: 'Enable service worker caching',
    'Optimize images with WebP format',
    'Implement lazy loading for below-fold content',
    'Minify and compress JavaScript/CSS',
    'Use CDN for static assets',
    'Enable HTTP/2 server push',
    'Implement critical CSS inlining'
  ];

  return {
    timestamp: new Date().toISOString(),
    metrics, score,
    recommendations: [...new Set(recommendations)] // Remove duplicates
   }
}