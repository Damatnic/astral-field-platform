/**
 * Performance Optimization Utilities
 * Provides debouncing, throttling, memoization, and lazy loading helpers
 */

/**
 * Debounce function - delays execution until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Throttle function - ensures a function is only called at most once
 * during a specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: NodeJS.Timeout | null = null;
  let lastRan: number | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      if (lastFunc) clearTimeout(lastFunc);
      
      lastFunc = setTimeout(() => {
        if (lastRan && Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (lastRan ? Date.now() - lastRan : 0));
    }
  };
}

/**
 * Memoization function - caches the results of expensive function calls
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

/**
 * Request Animation Frame throttle - ensures smooth 60fps animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      func.apply(context, args);
      rafId = null;
    });
  };
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages(selector = 'img[data-src]'): () => void {
  const images = document.querySelectorAll<HTMLImageElement>(selector);
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    
    images.forEach((img) => imageObserver.observe(img));
    
    return () => {
      images.forEach((img) => imageObserver.unobserve(img));
    };
  } else {
    // Fallback for browsers that don't support Intersection Observer
    images.forEach((img) => {
      const src = img.dataset.src;
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
    });
    
    return () => {};
  }
}

/**
 * Preload critical resources
 */
export function preloadResources(resources: Array<{ href: string; as: string }>) {
  resources.forEach(({ href, as }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Batch DOM updates using requestIdleCallback
 */
export function batchUpdate(
  updates: Array<() => void>,
  deadline = 50
): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      const handle = requestIdleCallback((idleDeadline) => {
        while (updates.length > 0 && idleDeadline.timeRemaining() > 0) {
          const update = updates.shift();
          if (update) update();
        }
        
        if (updates.length > 0) {
          batchUpdate(updates, deadline).then(resolve);
        } else {
          resolve();
        }
      }, { timeout: deadline });
      
      return () => cancelIdleCallback(handle);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      updates.forEach((update) => update());
      resolve();
    }
  });
}

/**
 * Memory-efficient array chunking for processing large datasets
 */
export function* chunkArray<T>(array: T[], chunkSize: number): Generator<T[]> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

/**
 * Web Worker pool for CPU-intensive tasks
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ data: any; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private busyWorkers = new Set<Worker>();
  
  constructor(workerScript: string, poolSize = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push(worker);
    }
  }
  
  async execute(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
      
      if (availableWorker) {
        this.runWorker(availableWorker, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }
  
  private runWorker(
    worker: Worker,
    data: any,
    resolve: (value: any) => void,
    reject: (error: any) => void
  ) {
    this.busyWorkers.add(worker);
    
    const handleMessage = (e: MessageEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      this.busyWorkers.delete(worker);
      
      resolve(e.data);
      
      // Process next item in queue
      const next = this.queue.shift();
      if (next) {
        this.runWorker(worker, next.data, next.resolve, next.reject);
      }
    };
    
    const handleError = (e: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      this.busyWorkers.delete(worker);
      
      reject(e);
      
      // Process next item in queue
      const next = this.queue.shift();
      if (next) {
        this.runWorker(worker, next.data, next.resolve, next.reject);
      }
    };
    
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage(data);
  }
  
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
    this.busyWorkers.clear();
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures: Array<{ name: string; duration: number }> = [];
  
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (start && end) {
      const duration = end - (typeof start === 'number' ? start : 0);
      this.measures.push({ name, duration });
      
      if ('performance' in window && 'measure' in performance) {
        try {
          performance.measure(name, startMark, endMark);
        } catch (e) {
          // Some browsers might not support all marks
        }
      }
      
      return duration;
    }
    
    return 0;
  }
  
  getMetrics() {
    const metrics: any = {
      measures: this.measures,
      navigation: {},
      resources: []
    };
    
    if ('performance' in window) {
      // Navigation timing
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (nav) {
        metrics.navigation = {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          domInteractive: nav.domInteractive - nav.fetchStart,
          timeToFirstByte: nav.responseStart - nav.requestStart
        };
      }
      
      // Resource timing
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      metrics.resources = resources.slice(-10).map(r => ({
        name: r.name.split('/').pop(),
        duration: r.duration,
        size: r.transferSize || 0,
        type: r.initiatorType
      }));
    }
    
    return metrics;
  }
  
  clear() {
    this.marks.clear();
    this.measures = [];
    
    if ('performance' in window && 'clearMarks' in performance) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();