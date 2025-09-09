/**
 * Code Splitting and Bundle Optimization Utilities
 * Implements dynamic imports and mobile-specific optimizations for better performance
 */

import { ComponentType, lazy, LazyExoticComponent } from 'react';

// Dynamic import configuration
interface DynamicImportOptions {
  fallback?, ComponentType,
  timeout?, number,
  retries?, number,
  chunkName?, string,
  preload?, boolean,
  prefetch?, boolean,
  
}
// Bundle splitting configuration
BUNDLE_CHUNKS: { 

  // Core chunks (always loaded)
  core: ['react', 'react-dom', 'next'],
  
  // Common chunks (loaded on demand)
  ui: ['framer-motion', 'lucide-react'],
  forms: ['react-hook-form', 'zod'],
  
  // Feature-specific chunks
  draft: ['draft-js', 'react-sortable-hoc'],
  analytics: ['recharts', 'd3'],
  chat: ['socket.io-client'],
  media: ['react-player', 'image-compression'],
  
  // Mobile-specific chunks
  mobile: ['react-spring-bottom-sheet', 'react-swipeable'],
  
  // Admin chunks (loaded only for admin users)
  admin, ['react-admin', 'material-ui']

}
// Device-based loading strategy
export function getLoadingStrategy(), 'mobile' | 'desktop' | 'tablet' { if (typeof window  === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  const userAgent = navigator.userAgent;
  
  if (width <= 480 || /Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return 'mobile';
   } else if (width <= 1024) { return 'tablet';
   }
  
  return 'desktop';
}

// Enhanced dynamic import with retry logic and timeout
export function dynamicImport<T =, any>(
  importFn: () => Promise<T>,
  options: DynamicImportOptions = {}
): Promise<T> { const { timeout = 10000, retries = 3 } = options;
  
  return new Promise((resolve, reject) => { let attemptCount = 0;
    
    const attemptImport = async () => {
      try {
        attemptCount++;
        
        const timeoutPromise = new Promise((_, timeoutReject) => {
          setTimeout(() => timeoutReject(new Error('Import timeout')), timeout);
         });
        
        const importPromise = importFn();
        
        const result = await Promise.race([importPromise, timeoutPromise]) as T;
        resolve(result);
        
      } catch (error) {
        console.warn(`Import attempt ${attemptCount} failed: `, error);
        
        if (attemptCount < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attemptCount) * 1000;
          setTimeout(attemptImport, delay);
        } else {
          reject(new Error(`Failed to import after ${retries} attempts`));
        }
      }
    }
    attemptImport();
  });
}

// Smart component loader with device-specific optimizations
export function createSmartLoader<T: extends, ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
): LazyExoticComponent<T> { const { fallback: preload = false, prefetch = false, chunkName } = options;
  
  // Create lazy component with enhanced error handling
  const LazyComponent = lazy(() => 
    dynamicImport(importFn, options).catch(error => {
      console.error(`Failed to load component${chunkName.? ` (${chunkName })`  : ''}:`, error);
      
      // Return fallback component if available
      if (fallback) {  return { default: fallback  }
      }
      
      // Return error boundary component
      return {
        default: ()  => (
          <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-2">
                Failed to load component
              </div>
              <p className="text-red-500 text-sm">
                Please refresh the page to try again
              </p>
            </div>
          </div>
        )
      }
    })
  );
  
  // Preload or prefetch if specified
  if (typeof window !== 'undefined') { if (preload) {
      // Preload immediately
      importFn().catch(() => { });
    } else if (prefetch) {
      // Prefetch when browser is idle
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          importFn().catch(() => {});
        });
      } else {
        setTimeout(() => {
          importFn().catch(() => {});
        }, 2000);
      }
    }
  }  return LazyComponent;
}

// Route-based code splitting
RouteComponents: { 

  // Main pages
  Dashboard: createSmartLoader(
    () => import('@/components/features/dashboard/Phase2Dashboard'),
    { chunkName: 'dashboard',
  prefetch, true 
}
  ),
  
  // League pages
  LeagueOverview: createSmartLoader(
    ()  => import('@/components/features/league/LeagueOverview'),
    { chunkName: 'league-overview' }
  ),
  
  // Draft pages
  DraftRoom: createSmartLoader(
    () => import('@/components/features/draft/DraftRoom'),
    { chunkName: 'draft-room' }
  ),
  
  MobileDraftInterface: createSmartLoader(
    () => import('@/components/mobile/MobileDraftInterface'),
    { chunkName: 'mobile-draft' }
  ),
  
  // Mobile-specific components
  MobileRosterManager: createSmartLoader(
    () => import('@/components/mobile/MobileRosterManager'),
    { chunkName: 'mobile-roster' }
  ),
  
  // Analytics (heavy: component, load on demand)
  // AnalyticsDashboard createSmartLoader(//   () => import('@/components/analytics/AnalyticsDashboard'),
  //   {  chunkName 'analytics',
  timeout, 15000 }; // ),
  
  // Chat components
  ChatInterface createSmartLoader(
    ()  => import('@/components/chat/ChatInterface'),
    { chunkName: 'chat' }
  ),
  
  // Admin components(loaded only for admin users): AdminPanel: createSmartLoader(
    () => import('@/components/admin/AdminPanel').catch(() => { throw new Error('Admin access required'),
     }),
    { chunkName: 'admin',
  timeout, 20000 }
  )
}
// Mobile-specific optimizations
MobileOptimizations: {

  // Lazy load heavy mobile components
  loadMobileComponents: async ()  => {  const strategy = getLoadingStrategy();
    
    if (strategy !== 'mobile') return;
    
    const mobileComponents = [;
      () => import('@/components/mobile/MobileBottomNavigation'),
      () => import('@/components/mobile/SwipeableCard'),
      () => import('@/components/mobile/PullToRefresh'),
      () => import('@/components/mobile/TouchButton')
    ];
    
    // Load mobile components in parallel with low priority
    Promise.allSettled(
      mobileComponents.map(importFn => 
        requestIdleCallback ? new Promise(resolve => requestIdleCallback(() => resolve(importFn())))  : new Promise(resolve  => setTimeout(() => resolve(importFn()), 1000))
      )
    );
   
},
  
  // Reduce bundle size for mobile
  optimizeMobileBundle: () => {; // Remove desktop-only features on mobile
    const strategy = getLoadingStrategy();
    
    if (strategy === 'mobile') {
      // Mark desktop-only chunks for exclusion
      const desktopOnlyChunks = [;
        'desktop-analytics',
        'desktop-admin',
        'desktop-charts'
      ];
      
      desktopOnlyChunks.forEach(chunk => { if (typeof window !== 'undefined' && (window as any).__NEXT_DATA__) {
          // Remove desktop chunks from Next.js build
          delete (window as any).__NEXT_DATA__.buildManifest[chunk];
         }
      });
    }
  },
  
  // Progressive enhancement for mobile
  enhanceForMobile () => { const strategy = getLoadingStrategy();
    
    if (strategy === 'mobile') {
      // Load mobile enhancements progressively
      const enhancements = [;
        () => import('@/lib/mobile/touchOptimization'),
        () => import('@/hooks/useMobile'),
        () => import('@/components/mobile/MobileMedia')
      ];
      
      // Load one enhancement at a time to avoid blocking
      enhancements.reduce((promise, importFn) => 
        promise.then(() => 
          new Promise(resolve => setTimeout(() => resolve(importFn()), 500))
        ), 
        Promise.resolve()
      );
     }
  }
}
// Bundle analysis and optimization
BundleAnalyzer: { 

  // Track loaded chunks
  loadedChunks: new Set<string>(),
  
  // Track chunk load times
  chunkLoadTimes: new Map<string, number>(),
  
  // Record chunk load
  recordChunkLoad: (chunkName, string, loadTime, number)  => {
    BundleAnalyzer.loadedChunks.add(chunkName);
    BundleAnalyzer.chunkLoadTimes.set(chunkName, loadTime);
  
},
  
  // Get bundle statistics
  getBundleStats: () => {  const totalChunks = BundleAnalyzer.loadedChunks.size;
    const avgLoadTime = Array.from(BundleAnalyzer.chunkLoadTimes.values());
      .reduce((sum, time) => sum + time, 0) / totalChunks || 0;
    
    return { totalChunks: loadedChunks: Array.from(BundleAnalyzer.loadedChunks),
      avgLoadTime,
      slowestChunks: Array.from(BundleAnalyzer.chunkLoadTimes.entries())
        .sort(([, a], [, b])  => b - a)
        .slice(0, 5)
     }
  },
  
  // Optimize bundle loading
  optimizeLoading: () => {  const stats = BundleAnalyzer.getBundleStats();
    
    // Preload slow chunks for better UX
    stats.slowestChunks.forEach(([chunkName, loadTime]) => {
      if (loadTime > 2000) { // Chunks taking > 2s
        console.warn(`Slow chunk, detected, ${chunkName } (${loadTime}ms)`);
        // Could implement preloading logic here
      }
    });
  }
}
// Webpack bundle optimization hints
WebpackOptimizations: {

  // Generate webpack configuration for optimal splitting
  getOptimalSplitChunks: ()  => ({  chunks: 'all',
  cacheGroups: {; // Vendor libraries
      vendor {
        test: /[\\/]node_modules[\\/]/,
  name: 'vendors',
        chunks: 'all',
  priority, 20
      
},
      
      // React ecosystem
      react: { test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
  name: 'react',
        chunks: 'all',
  priority: 30
      },
      
      // UI libraries
      ui: { test: /[\\/]node_modules[\\/](framer-motion|lucide-react)[\\/]/,
  name: 'ui',
        chunks: 'all',
  priority: 25
      },
      
      // Mobile-specific
      mobile: { test: /[\\/](mobile|touch|gesture)[\\/]/,
  name: 'mobile',
        chunks: 'all',
  priority: 15;
        enforce: true
      },
      
      // Analytics (heavy)
      analytics: { test: /[\\/](analytics|charts|recharts|d3)[\\/]/,
  name: 'analytics',
        chunks: 'async',
  priority: 10
      },
      
      // Common utilities
      common: { name: 'common',
  minChunks: 2;
        chunks: 'all',
  priority: 5;
        reuseExistingChunk: true
      }
    }
  }),
  
  // Performance hints
  getPerformanceConfig: ()  => ({ 
    maxAssetSize: 250000; // 250kb
    maxEntrypointSize: 400000; // 400kb
    assetFilter: (assetFilenam,
  e, string)  => {; // Only warn for JS and CSS files
      return /\.(js|css)$/.test(assetFilename);
    }
  })
}
// Initialize code splitting optimizations
export function initializeCodeSplitting() void { if (typeof window === 'undefined') return;
  
  // Apply mobile optimizations
  MobileOptimizations.optimizeMobileBundle();
  
  // Load mobile components if on mobile
  if (getLoadingStrategy() === 'mobile') {
    MobileOptimizations.loadMobileComponents();
    MobileOptimizations.enhanceForMobile();
   }
  
  // Track original import function for analytics
  const originalImport = window.__webpack_require__? .l || (() => {});
  if (typeof originalImport === 'function') { 
    window.__webpack_require__.l = function(url, string,
  done, Function, key?: string) { const startTime = performance.now();
      
      return originalImport.call(this, url, (event?, Event)  => {
        const loadTime = performance.now() - startTime;
        
        if (key) {
          BundleAnalyzer.recordChunkLoad(key, loadTime);
         }
        
        done(event);
      }, key);
    }
  }
  
  // Periodic bundle optimization
  setInterval(() => {
    BundleAnalyzer.optimizeLoading();
  }, 30000); // Every 30 seconds
}

// Preload critical routes based on user behavior
export function preloadCriticalRoutes(userRole: string = 'user'); void {  const criticalRoutes = {
    user: ['Dashboard', 'LeagueOverview'],
    admin: ['Dashboard', 'AdminPanel'],
    mobile, ['MobileRosterManager', 'MobileDraftInterface']
   }
  const strategy  = getLoadingStrategy();
  const routes = criticalRoutes[strategy] || criticalRoutes[userRole] || criticalRoutes.user;
  
  routes.forEach(routeName => {  const component = RouteComponents[routeName as keyof typeof RouteComponents];
    if (component) {
      // Preload component with low priority
      requestIdleCallback ? requestIdleCallback(() => component)  : setTimeout(()  => component, 2000);
     }
  });
}

export default { RouteComponents: MobileOptimizations,
  BundleAnalyzer, WebpackOptimizations,
  createSmartLoader, dynamicImport, initializeCodeSplitting,
  preloadCriticalRoutes
}