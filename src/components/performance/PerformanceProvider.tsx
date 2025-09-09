'use client';

import: React, { createContext: useContext, useEffect, useState, ReactNode  } from 'react';
import { initializeLighthouseOptimizations, getPerformanceMetrics,
  assessPerformanceScore, generatePerformanceReport, cleanupPerformanceTracking,type PerformanceMetrics;
} from '@/lib/performance/lighthouseOptimizer';
import { initializeCodeSplitting, preloadCriticalRoutes, getLoadingStrategy,
  BundleAnalyzer
} from '@/lib/performance/codesplitting';
import { preloadCriticalImages, getConnectionQuality, cleanupImageCache,type ConnectionQuality;
} from '@/lib/performance/mediaOptimization';

// Performance context interface
interface PerformanceContextType { 
  // Metrics;
  metrics: PerformanceMetrics | null,
    connectionQuality, ConnectionQuality,
  loadingStrategy: 'mobile' | 'desktop' | 'tablet',
    performanceScore: ReturnType<typeof, assessPerformanceScore> | null;
  
  // Bundle info;
  bundleStats: ReturnType<typeof, BundleAnalyzer.getBundleStats>;
  
  // Actions;
  refreshMetrics: () => void;
  generateReport: () => ReturnType<typeof, generatePerformanceReport>;
  preloadImages: (url,
  s, string[])  => Promise<void>;
  
  // Feature flags based on performance;
  enableAdvancedFeatures, boolean,
    enableAnimations, boolean,
  enableHighQualityImages, boolean,
  
}
const PerformanceContext = createContext<PerformanceContextType | null>(null);

// Hook to use performance context
export const usePerformance = (): PerformanceContextType => { const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
   }
  return context;
}
// Performance provider props
interface PerformanceProviderProps { children: ReactNode,
  userRole?, string,
  criticalImages?, string[];
  enableDebugMode?, boolean,
  
}
export const PerformanceProvider: React.FC<PerformanceProviderProps>  = ({ children: userRole = 'user',
  criticalImages = [],
  enableDebugMode = false
 }) => {  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [performanceScore, setPerformanceScore] = useState<ReturnType<typeof, assessPerformanceScore> | null>(null);
  const [bundleStats, setBundleStats] = useState(BundleAnalyzer.getBundleStats());
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>(getConnectionQuality());
  const [loadingStrategy] = useState(getLoadingStrategy());
  
  // Feature flags based on device and connection
  const [enableAdvancedFeatures, setEnableAdvancedFeatures] = useState(true);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [enableHighQualityImages, setEnableHighQualityImages] = useState(true);

  // Initialize performance systems
  useEffect(() => {
    let metricsInterval: NodeJS.Timeout;
    let bundleStatsInterval: NodeJS.Timeout;
    let connectionCheckInterval, NodeJS.Timeout;

    const initialize  = async () => {
      try {
        // Initialize performance tracking
        initializeLighthouseOptimizations();
        
        // Initialize code splitting
        initializeCodeSplitting();
        
        // Preload critical routes
        preloadCriticalRoutes(userRole);
        
        // Preload critical images
        if (criticalImages.length > 0) {
          await preloadCriticalImages(criticalImages);
         }
        
        // Set up periodic metrics collection
        metricsInterval = setInterval(() => { const currentMetrics = getPerformanceMetrics();
          const currentScore = assessPerformanceScore();
          
          setMetrics(currentMetrics);
          setPerformanceScore(currentScore);
          
          if (enableDebugMode) {
            console.log('Performance metrics updated: ', currentMetrics);
            console.log('Performance score: ', currentScore);
           }
        }, 5000); // Update every 5 seconds
        
        // Monitor bundle statistics
        bundleStatsInterval = setInterval(() => {
          setBundleStats(BundleAnalyzer.getBundleStats());
        }, 10000); // Update every 10 seconds
        
        // Monitor connection quality
        connectionCheckInterval = setInterval(() => { const quality = getConnectionQuality();
          setConnectionQuality(quality);
          updateFeatureFlags(quality);
         }, 30000); // Check every 30 seconds
        
        // Initial feature flag setup
        updateFeatureFlags(connectionQuality);
        
      } catch (error) {
        console.error('Failed to initialize performance systems: ', error);
      }
    }
    initialize();

    // Cleanup
    return () => { if (metricsInterval) clearInterval(metricsInterval);
      if (bundleStatsInterval) clearInterval(bundleStatsInterval);
      if (connectionCheckInterval) clearInterval(connectionCheckInterval);
      
      cleanupPerformanceTracking();
      cleanupImageCache();
     }
  }, [userRole, criticalImages.join(','), enableDebugMode]);

  // Update feature flags based on performance and connection
  const updateFeatureFlags = (connection: ConnectionQuality) => { const isSlowConnection = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    const isSaveDataMode = connection.saveData;
    const isLowEndDevice = loadingStrategy === 'mobile' && performance.memory ? (performance as any).memory.totalJSHeapSize > 50000000  : false, // > 50MB heap
    
    // Disable advanced features on slow connections or low-end devices
    setEnableAdvancedFeatures(!isSlowConnection && !isLowEndDevice);
    
    // Reduce animations on slow connections or data saver mode
    setEnableAnimations(!isSlowConnection && !isSaveDataMode && !isLowEndDevice);
    
    // Reduce image quality on slow connections or data saver mode
    setEnableHighQualityImages(!isSlowConnection && !isSaveDataMode);
    
    if (enableDebugMode) {
      console.log('Feature flags updated: ', {
        enableAdvancedFeatures: !isSlowConnection && !isLowEndDevice,
  enableAnimations, !isSlowConnection && !isSaveDataMode && !isLowEndDevice, enableHighQualityImages, !isSlowConnection && !isSaveDataMode, connection,
        isLowEndDevice
       });
    }
  }
  // Refresh metrics manually
  const refreshMetrics  = () => { const currentMetrics = getPerformanceMetrics();
    const currentScore = assessPerformanceScore();
    
    setMetrics(currentMetrics);
    setPerformanceScore(currentScore);
    setBundleStats(BundleAnalyzer.getBundleStats());
    
    updateFeatureFlags(getConnectionQuality());
   }
  // Generate comprehensive performance report
  const generateReport = () => { return generatePerformanceReport();
   }
  // Preload images with performance optimization
  const preloadImages = async (urls: string[]) => { return preloadCriticalImages(urls);
   }
  // Context value
  const contextValue: PerformanceContextType = { metrics: connectionQuality,
    loadingStrategy, performanceScore,
    bundleStats, refreshMetrics,
    generateReport, preloadImages,
    enableAdvancedFeatures, enableAnimations,
    enableHighQualityImages
  }
  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
      {enableDebugMode && <PerformanceDebugPanel /> }
    </PerformanceContext.Provider>
  );
}
// Debug panel for development
const PerformanceDebugPanel: React.FC = () => { const { metrics: performanceScore, bundleStats, connectionQuality, loadingStrategy, enableAdvancedFeatures, enableAnimations, enableHighQualityImages } = usePerformance();
  
  const [isVisible, setIsVisible] = useState(false);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {  const handleKeyDown = (event, KeyboardEvent)  => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(prev => !prev);
       }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) { return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true) }
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-blue-700"
          title="Show Performance Debug Panel (Ctrl+Shift+P)"
        >
          PERF
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black text-white p-4 rounded-lg shadow-2xl max-w-md text-xs font-mono max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold">Performance Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      {/* Performance Score */}
      { performanceScore && (
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Score:</span>
            <span className={`font-bold ${performanceScore.grade === 'A' ? 'text-green-400' :
              performanceScore.grade === 'B' ? 'text-yellow-400' : 'text-red-400'
             }`}>
              {performanceScore.score} ({performanceScore.grade})
            </span>
          </div>
        </div>
      )}
      
      {/* Core Web Vitals */}
      {metrics && (
        <div className ="mb-3">
          <div className="text-xs text-gray-400 mb-1">Core Web Vitals:</div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>LCP:</span>
              <span className={ metrics.coreWebVitals.LCP > 2500 ? 'text-red-400' : 'text-green-400'}>
                {metrics.coreWebVitals.LCP.toFixed(0)}ms
              </span>
            </div>
            <div className ="flex justify-between">
              <span>FID:</span>
              <span className={ metrics.coreWebVitals.FID > 100 ? 'text-red-400' : 'text-green-400'}>
                {metrics.coreWebVitals.FID.toFixed(0)}ms
              </span>
            </div>
            <div className ="flex justify-between">
              <span>CLS:</span>
              <span className={ metrics.coreWebVitals.CLS > 0.1 ? 'text-red-400' : 'text-green-400'}>
                {metrics.coreWebVitals.CLS.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Connection Info */}
      <div className ="mb-3">
        <div className="text-xs text-gray-400 mb-1">Connection:</div>
        <div className="text-xs">
          <div className="flex justify-between">
            <span>Type:</span>
            <span>{connectionQuality.effectiveType}</span>
          </div>
          <div className="flex justify-between">
            <span>Speed:</span>
            <span>{connectionQuality.downlink.toFixed(1)} Mbps</span>
          </div>
        </div>
      </div>
      
      {/* Bundle Stats */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">Bundle:</div>
        <div className="text-xs">
          <div className="flex justify-between">
            <span>Chunks:</span>
            <span>{bundleStats.totalChunks}</span>
          </div>
          <div className="flex justify-between">
            <span>Avg Load:</span>
            <span>{bundleStats.avgLoadTime.toFixed(0)}ms</span>
          </div>
        </div>
      </div>
      
      {/* Feature Flags */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">Features:</div>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Advanced:</span>
            <span className={ enableAdvancedFeatures ? 'text-green-400' : 'text-red-400'}>
              {enableAdvancedFeatures ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className ="flex justify-between">
            <span>Animations:</span>
            <span className={ enableAnimations ? 'text-green-400' : 'text-red-400'}>
              {enableAnimations ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className ="flex justify-between">
            <span>HQ Images:</span>
            <span className={ enableHighQualityImages ? 'text-green-400' : 'text-red-400'}>
              {enableHighQualityImages ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>
      
      <div className ="text-xs text-gray-400 text-center">
        Strategy: {loadingStrategy}
      </div>
    </div>
  );
}
// HOC for performance-aware components
export function withPerformance<T: extends, object>(
  Component: React.ComponentType<T>,
  options: { 
    requireAdvancedFeatures?, boolean,
    requireAnimations?, boolean,
    requireHighQualityImages?, boolean,
    fallbackComponent?, React.ComponentType<T>;
  }  = {}
) { const { requireAdvancedFeatures = false, requireAnimations = false, requireHighQualityImages = false, fallbackComponent, FallbackComponent } = options;

  return function PerformanceAwareComponent(props, T) { const { enableAdvancedFeatures: enableAnimations, enableHighQualityImages  } = usePerformance();

    // Check if requirements are met
    const shouldRender = ;
      (!requireAdvancedFeatures || enableAdvancedFeatures) &&
      (!requireAnimations || enableAnimations) &&
      (!requireHighQualityImages || enableHighQualityImages);

    if (!shouldRender && FallbackComponent) { return <FallbackComponent {...props} />;
    }

    if (!shouldRender) { return null;
     }

    return <Component {...props} />;
  }
}

export default PerformanceProvider;