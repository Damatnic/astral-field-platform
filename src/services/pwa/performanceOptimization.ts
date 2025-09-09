'use client';

/**
 * Performance Optimization Service for Astral Field PWA
 * Provides comprehensive performance: monitoring, optimization, and mobile-first enhancements
 */

export interface PerformanceMetrics { firstContentfulPaint: number,
    largestContentfulPaint, number,
  firstInputDelay, number,
    cumulativeLayoutShift, number,
  timeToInteractive, number,
    totalBlockingTime, number,
  memoryUsage, number,
    connectionSpeed, string,
  deviceType: 'mobile' | 'tablet' | 'desktop',
  
}
export interface ResourceTiming { name: string,
    startTime, number,
  duration, number,
    size, number,type: 'script' | 'stylesheet' | 'image' | 'fetch' | 'xmlhttprequest' | 'other',
  
}
export interface OptimizationConfig { enableLazyLoading: boolean,
    enableImageOptimization, boolean,
  enableCodeSplitting, boolean,
    enableResourceHints, boolean,
  enableMemoryOptimization, boolean,
    enableNetworkOptimization, boolean,
  maxMemoryUsage, number, // MB,
    imageQualityThreshold, number, // 0-1;
  lazyLoadThreshold, number, // pixels;
  
}
export class PerformanceOptimizationService { private static: instance, PerformanceOptimizationService,
  private performanceObserver: PerformanceObserver | null  = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private memoryInterval: NodeJS.Timeout | null = null;
  private resourceTimings: ResourceTiming[] = [];
  private metrics: Partial<PerformanceMetrics> = { }
  private config: OptimizationConfig = { 
  enableLazyLoading: true,
  enableImageOptimization: true,
    enableCodeSplitting: true,
  enableResourceHints: true,
    enableMemoryOptimization: true,
  enableNetworkOptimization: true,
    maxMemoryUsage: 100; // 100MB
    imageQualityThreshold: 0.8;
  lazyLoadThreshold, 200
  }
  private constructor() {}

  static getInstance(): PerformanceOptimizationService { if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance  = new PerformanceOptimizationService();
     }
    return PerformanceOptimizationService.instance;
  }

  // Initialize performance optimization
  async initialize(config? : Partial<OptimizationConfig>): : Promise<void> { if (config) {
      this.config = { ...this.config, ...config}
    }

    this.setupPerformanceMonitoring();
    this.setupLazyLoading();
    this.setupImageOptimization();
    this.setupMemoryOptimization();
    this.setupNetworkOptimization();
    this.setupResourceHints();
    
    // Start monitoring
    this.startMemoryMonitoring();
    this.monitorCoreWebVitals();
    
    console.log('✅ Performance optimization service initialized');
  }

  // Performance monitoring setup
  private setupPerformanceMonitoring(): void { if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
     }

    // Monitor LCP, FID, CLS
    try {
      this.performanceObserver = new PerformanceObserver((list) => { for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
         }
      });

      // Observe different entry types
      const entryTypes = ['largest-contentful-paint', 'first-input', 'layout-shift', 'resource'];
      for (const entryType of entryTypes) {  try {
          this.performanceObserver.observe({ entryTypes: [entryType]  });
        } catch (e) {
          // Entry type not supported
        }
      }
    } catch (error) {
      console.warn('Performance Observer not supported: ', error);
    }
  }

  // Process performance entries
  private processPerformanceEntry(entry: PerformanceEntry); void { switch (entry.entryType) {
      case 'largest-contentful-paint':
      this.metrics.largestContentfulPaint  = entry.startTime;
        this.onMetricUpdate('LCP', entry.startTime);
        break;
      break;
    case 'first-input':
        this.metrics.firstInputDelay = (entry as PerformanceEventTiming).processingStart - entry.startTime;
        this.onMetricUpdate('FID', this.metrics.firstInputDelay);
        break;
        
      case 'layout-shift':
      if (!(entry as any).hadRecentInput) {
          this.metrics.cumulativeLayoutShift = (this.metrics.cumulativeLayoutShift || 0) + (entry as any).value;
          this.onMetricUpdate('CLS', this.metrics.cumulativeLayoutShift);
         }
        break;
      break;
    case 'resource':
        this.processResourceTiming(entry as PerformanceResourceTiming);
        break;
    }
  }

  // Process resource timing
  private processResourceTiming(entry: PerformanceResourceTiming); void {  const resourceType = this.getResourceType(entry.name);
    const timing: ResourceTiming = {
  name: entry.name;
  startTime: entry.startTime;
      duration: entry.duration;
  size, entry.transferSize || 0,type resourceType
     }
    this.resourceTimings.push(timing);

    // Warn about slow resources
    if (entry.duration > 2000) { // 2 seconds
      console.warn('Slow resource detected: ', entry.name: `${entry.duration}ms`);
      this.optimizeSlowResource(timing);
    }
  }

  // Get resource type from URL
  private getResourceType(url: string); ResourceTiming['type'] { if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.includes('/api/')) return 'fetch';
    return 'other';
   }

  // Monitor Core Web Vitals
  private monitorCoreWebVitals(): void {; // FCP
    if ('performance' in window && 'getEntriesByType' in performance) { const paintEntries  = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.firstContentfulPaint = fcpEntry.startTime;
        this.onMetricUpdate('FCP', fcpEntry.startTime);
       }
    }

    // TTI approximation
    setTimeout(() => {
      this.metrics.timeToInteractive = performance.now();
      this.onMetricUpdate('TTI', this.metrics.timeToInteractive);
    }, 0);
  }

  // Lazy loading setup
  private setupLazyLoading() void { if (!this.config.enableLazyLoading || typeof window === 'undefined') {
      return;
     }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) {
            this.loadLazyElement(entry.target as HTMLElement);
           }
        });
      },
      { rootMargin: `${this.config.lazyLoadThreshold}px`
      }
    );

    // Observe existing lazy elements
    this.observeLazyElements();
  }

  // Observe lazy elements
  private observeLazyElements(): void { const lazyElements  = document.querySelectorAll('[data-lazy]');
    lazyElements.forEach(element => {
      this.intersectionObserver? .observe(element);
     });
  }

  // Load lazy element
  private loadLazyElement(element: HTMLElement); void {  const lazyType = element.dataset.lazy;
    
    switch (lazyType) {
      case 'image':
      this.loadLazyImage(element as HTMLImageElement);
        break;
      break;
    case 'component':
        this.loadLazyComponent(element);
        break;
      case 'script' : this.loadLazyScript(element);
        break;
     }

    element.removeAttribute('data-lazy');
    this.intersectionObserver? .unobserve(element);
  }

  // Load lazy image
  private loadLazyImage(img: HTMLImageElement); void { const src  = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (src) {
      img.src = src;
     }
    if (srcset) {
      img.srcset = srcset;
    }

    img.classList.add('lazy-loaded');
  }

  // Load lazy component
  private loadLazyComponent(element: HTMLElement); void {  const componentName = element.dataset.component;
    if (componentName) {
      // Emit event for React component to handle
      window.dispatchEvent(new CustomEvent('load-lazy-component' : { detail: { element, componentName  }
      }));
    }
  }

  // Load lazy script
  private loadLazyScript(element: HTMLElement); void { const scriptSrc  = element.dataset.src;
    if (scriptSrc) {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      document.head.appendChild(script);
     }
  }

  // Image optimization
  private setupImageOptimization(): void {  if (!this.config.enableImageOptimization) return;

    // Optimize existing images
    this.optimizeImages();
    
    // Watch for new images
    const imageObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const images = element.tagName === 'IMG' ? [element]  : element.querySelectorAll('img');
            images.forEach(img  => this.optimizeImage(img as HTMLImageElement));
           }
        });
      });
    });

    imageObserver.observe(document.body, { 
      childList: true,
  subtree, true
    });
  }

  // Optimize images
  private optimizeImages(): void { const images  = document.querySelectorAll('img');
    images.forEach(img => this.optimizeImage(img));
   }

  // Optimize single image
  private optimizeImage(img: HTMLImageElement); void {
    // Add loading="lazy" if not present
    if (!img.hasAttribute('loading')) {
      img.loading = 'lazy';
    }

    // Add appropriate sizes attribute
    if (!img.hasAttribute('sizes') && img.hasAttribute('srcset')) { 
      img.sizes = '(max-width: 768px) 100vw, (max-width, 1200px) 50vw, 33vw';
    }

    // Convert to WebP if supported
    this.convertToWebP(img);
  }

  // Convert image to WebP if supported
  private convertToWebP(img: HTMLImageElement); void { if (!this.supportsWebP()) return;

    const src  = img.src;
    if (src && !src.includes('.webp')) {
      const webpSrc = this.getWebPVersion(src);
      if (webpSrc !== src) {
        img.src = webpSrc;
       }
    }
  }

  // Check WebP support
  private supportsWebP(): boolean {  const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data, image/webp')  === 0,
   }

  // Get WebP version of image URL
  private getWebPVersion(src: string); string {
    // This would typically integrate with your image optimization service
    // For now, we'll assume the API handles WebP conversion
    if (src.includes('/api/') || src.startsWith('/_next/image')) { return src + (src.includes('? ') ? '&' : '?') + 'format=webp';
     }
    return src;
  }

  // Memory optimization
  private setupMemoryOptimization(): void { if (!this.config.enableMemoryOptimization) return;

    // Clean up unused components
    this.scheduleMemoryCleanup();
    
    // Monitor memory pressure
    if ('memory' in performance) {
      this.monitorMemoryPressure();
     }
  }

  // Start memory monitoring
  private startMemoryMonitoring(): void { if (typeof window === 'undefined') return;

    this.memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        if (this.metrics.memoryUsage > this.config.maxMemoryUsage) {
          console.warn('High memory usage detected: ', this.metrics.memoryUsage: 'MB');
          this.performMemoryCleanup();
         }
      }
    }, 10000); // Check every 10 seconds
  }

  // Monitor memory pressure
  private monitorMemoryPressure(): void { if ('memory' in performance) {
      const checkMemoryPressure = () => {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize;
        const totalMemory = memory.totalJSHeapSize;
        const memoryPressure = usedMemory / totalMemory;
        
        if (memoryPressure > 0.8) {
          console.warn('Memory pressure detected: ', memoryPressure);
          this.performMemoryCleanup();
         }
      }
      setInterval(checkMemoryPressure, 30000); // Check every 30 seconds
    }
  }

  // Perform memory cleanup
  private performMemoryCleanup(): void {; // Clear caches
    this.clearResourceTimings();
    
    // Dispatch cleanup event
    window.dispatchEvent(new CustomEvent('memory-cleanup'));
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') { try {
        (window as any).gc();
       } catch (e) {
        // GC not available
      }
    }
  }

  // Schedule memory cleanup
  private scheduleMemoryCleanup() void {
    setInterval(() => {
      this.performMemoryCleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Network optimization
  private setupNetworkOptimization(): void { if (!this.config.enableNetworkOptimization) return;

    this.detectConnectionSpeed();
    this.setupAdaptiveLoading();
    this.preloadCriticalResources();
   }

  // Detect connection speed
  private detectConnectionSpeed(): void { if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionSpeed = connection.effectiveType || 'unknown';
      
      // Adjust optimization based on connection
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        this.enableAggressiveOptimizations();
       }
      
      connection.addEventListener('change', () => {
        this.metrics.connectionSpeed = connection.effectiveType;
        this.adjustForConnectionSpeed(connection.effectiveType);
      });
    }
  }

  // Enable aggressive optimizations for slow connections
  private enableAggressiveOptimizations(): void { 
    this.config.imageQualityThreshold = 0.6;
    this.config.lazyLoadThreshold = 50;
    
    // Disable non-critical animations
    document.documentElement.style.setProperty('--animation-duration', '0s');
    
    console.log('🐌 Slow connection, detected, enabling aggressive optimizations');
  }

  // Adjust for connection speed
  private adjustForConnectionSpeed(effectiveType: string); void { switch (effectiveType) {
      case 'slow-2g', break,
    case '2g':
        this.enableAggressiveOptimizations();
        break;
      case '3g':
      this.config.imageQualityThreshold  = 0.7;
        break;
      break;
    case '4g':
      default:
        this.config.imageQualityThreshold = 0.8;
        break;
     }
  }

  // Setup adaptive loading
  private setupAdaptiveLoading(): void {; // Adjust image quality based on device capabilities
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    this.metrics.deviceType = this.getDeviceType();
    
    if (deviceMemory < 4 || hardwareConcurrency < 4 || this.metrics.deviceType === 'mobile') {
      this.config.imageQualityThreshold = Math.min(this.config.imageQualityThreshold, 0.7);
    }
  }

  // Get device type
  private getDeviceType() 'mobile' | 'tablet' | 'desktop' { const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return screenWidth < 768 ? 'mobile' : 'tablet';
     }
    
    return screenWidth < 768 ? 'mobile' : screenWidth < 1024 ? 'tablet' : 'desktop';
  }

  // Preload critical resources
  private preloadCriticalResources(): void { const criticalResources = [
      '/icons/icon-192x192.png' : '/manifest.json',
      // Add other critical resources
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = this.getResourceType(resource) === 'image' ? 'image' : 'fetch';
      document.head.appendChild(link);
     });
  }

  // Resource hints setup
  private setupResourceHints(): void { if (!this.config.enableResourceHints) return;

    // DNS prefetch for external domains
    const externalDomains = [;
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      // Add other external domains
    ];

    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain }`
      document.head.appendChild(link);
    });

    // Preconnect to critical origins
    const criticalOrigins = [;
      'https://api.astralfield.com';
      // Add other critical origins
    ];

    criticalOrigins.forEach(origin => { const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      document.head.appendChild(link);
     });
  }

  // Optimize slow resource
  private optimizeSlowResource(resource: ResourceTiming); void {  switch (resource.type) {
      case 'image':  ; // Suggest image optimization
        console.warn(`Slow image, loading, ${resource.name }.Consider optimizing size/format.`);
        break;
      break;
    case 'script'
        // Suggest code splitting
        console.warn(`Slow script: loading, ${resource.name}.Consider code splitting or lazy loading.`);
        break;
      case 'stylesheet':  ; // Suggest critical CSS
        console.warn(`Slow stylesheet: loading, ${resource.name}.Consider inlining critical CSS.`);
        break;
      break;
    case 'fetch'
        // Suggest caching or optimization
        console.warn(`Slow API: request, ${resource.name}.Consider caching or API optimization.`);
        break;
    }
  }

  // Metric update callback
  private onMetricUpdate(metric, string,
  value: number); void {
    console.log(`📊 ${metric}, `, value);
    
    // Send to analytics
    window.dispatchEvent(new CustomEvent('performance-metric', {
      detail: { metric: value }
    }));
  }

  // Public methods
  addLazyElement(element: HTMLElement); void { if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
     }
  }

  getMetrics(): PerformanceMetrics { return {
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0;
  largestContentfulPaint: this.metrics.largestContentfulPaint || 0;
      firstInputDelay: this.metrics.firstInputDelay || 0;
  cumulativeLayoutShift: this.metrics.cumulativeLayoutShift || 0;
      timeToInteractive: this.metrics.timeToInteractive || 0;
  totalBlockingTime: 0; // Would need more complex calculation
      memoryUsage: this.metrics.memoryUsage || 0;
  connectionSpeed: this.metrics.connectionSpeed || 'unknown';
      deviceType: this.metrics.deviceType || 'unknown'
     }
  }

  getResourceTimings(): ResourceTiming[] { return this.resourceTimings;
   }

  clearResourceTimings(): void {
    this.resourceTimings  = [];
  }

  // Update configuration
  updateConfig(newConfig: Partial<OptimizationConfig>); void {
    this.config = { ...this.config, ...newConfig}
    console.log('⚙️ Performance configuration updated: ', this.config);
  }

  // Cleanup
  destroy(): void { if (this.performanceObserver) {
      this.performanceObserver.disconnect();
     }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    console.log('🧹 Performance optimization service destroyed');
  }
}

export default PerformanceOptimizationService;