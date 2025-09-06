import {
  withPerformanceMonitoring,
  recordMetric,
  startMeasurement,
  getPerformanceMetrics,
  getPerformanceStats,
  clearPerformanceMetrics,
  debounce,
  throttle,
  memoize,
  TTLCache,
  BatchProcessor,
  createIntersectionObserver,
  preloadImages,
  ResourceManager,
  type PerformanceMetrics
} from '../optimization';

// Mock performance.now()
const mockNow = jest.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockNow }
});

describe('Performance Optimization Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNow.mockReturnValue(1000); // Default timestamp
    clearPerformanceMetrics();
  });

  describe('withPerformanceMonitoring', () => {
    it('should monitor sync function performance', () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(1050); // 50ms execution
      
      const testFn = jest.fn((..._args: any[]) => 'result');
      const monitoredFn = withPerformanceMonitoring(testFn, 'test-function');
      
      const result = monitoredFn('arg1', 'arg2');
      
      expect(result).toBe('result');
      expect(testFn).toHaveBeenCalledWith('arg1', 'arg2');
      
      const metrics = getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-function');
      expect(metrics[0].duration).toBe(50);
    });

    it('should monitor async function performance', async () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(1100); // 100ms execution
      
      const testFn = jest.fn().mockResolvedValue('async-result');
      const monitoredFn = withPerformanceMonitoring(testFn, 'async-function');
      
      const result = await monitoredFn('arg1');
      
      expect(result).toBe('async-result');
      
      const metrics = getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('async-function');
      expect(metrics[0].duration).toBe(100);
    });

    it('should handle function errors', () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(1025); // 25ms execution
      
      const errorFn = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const monitoredFn = withPerformanceMonitoring(errorFn, 'error-function');
      
      expect(() => monitoredFn()).toThrow('Test error');
      
      const metrics = getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('error-function_ERROR');
    });
  });

  describe('recordMetric', () => {
    it('should record performance metric', () => {
      const metric: PerformanceMetrics = {
        name: 'test-metric',
        startTime: 1000,
        endTime: 1050,
        duration: 50
      };
      
      recordMetric(metric);
      
      const metrics = getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metric);
    });

    it('should limit stored metrics to prevent memory bloat', () => {
      // Add 1001 metrics
      for (let i = 0; i < 1001; i++) {
        recordMetric({
          name: `metric-${i}`,
          startTime: 1000 + i,
          endTime: 1050 + i,
          duration: 50
        });
      }
      
      const metrics = getPerformanceMetrics();
      expect(metrics).toHaveLength(1000); // Should be capped at 1000
    });
  });

  describe('startMeasurement', () => {
    it('should return function that records measurement', () => {
      mockNow.mockReturnValueOnce(1000).mockReturnValueOnce(1075); // 75ms
      
      const endMeasurement = startMeasurement('measurement-test');
      endMeasurement();
      
      const metrics = getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('measurement-test');
      expect(metrics[0].duration).toBe(75);
    });
  });

  describe('getPerformanceStats', () => {
    beforeEach(() => {
      // Add sample metrics
      recordMetric({ name: 'fast', startTime: 1000, endTime: 1010, duration: 10 });
      recordMetric({ name: 'slow', startTime: 2000, endTime: 2100, duration: 100 });
      recordMetric({ name: 'fast', startTime: 3000, endTime: 3015, duration: 15 });
    });

    it('should calculate correct statistics', () => {
      const stats = getPerformanceStats();
      
      expect(stats.totalMeasurements).toBe(3);
      expect(stats.averageDuration).toBe((10 + 100 + 15) / 3);
      expect(stats.slowestOperation?.duration).toBe(100);
      expect(stats.fastestOperation?.duration).toBe(10);
      expect(stats.operationsByName.fast.count).toBe(2);
      expect(stats.operationsByName.slow.count).toBe(1);
    });

    it('should handle empty metrics', () => {
      clearPerformanceMetrics();
      
      const stats = getPerformanceStats();
      expect(stats.totalMeasurements).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.slowestOperation).toBeNull();
      expect(stats.fastestOperation).toBeNull();
    });
  });

  describe('debounce', () => {
    it('should delay function execution', (done) => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);
      
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');
      
      expect(fn).not.toHaveBeenCalled();
      
      setTimeout(() => {
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('arg3');
        done();
      }, 150);
    });

    it('should reset timer on subsequent calls', (done) => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);
      
      debouncedFn('arg1');
      
      setTimeout(() => {
        debouncedFn('arg2'); // This should reset the timer
      }, 50);
      
      setTimeout(() => {
        expect(fn).not.toHaveBeenCalled(); // Should not have been called yet
      }, 120);
      
      setTimeout(() => {
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('arg2');
        done();
      }, 180);
    });
  });

  describe('throttle', () => {
    it('should limit function execution frequency', (done) => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);
      
      throttledFn('arg1');
      throttledFn('arg2'); // Should be ignored
      throttledFn('arg3'); // Should be ignored
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');
      
      setTimeout(() => {
        throttledFn('arg4'); // Should execute after throttle period
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenCalledWith('arg4');
        done();
      }, 150);
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      const expensiveFn = jest.fn((x: number) => x * 2);
      const memoizedFn = memoize(expensiveFn);
      
      const result1 = memoizedFn(5);
      const result2 = memoizedFn(5); // Should use cache
      const result3 = memoizedFn(10); // New calculation
      
      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(result3).toBe(20);
      expect(expensiveFn).toHaveBeenCalledTimes(2); // Not called for cached result
    });

    it('should use custom key generator', () => {
      const fn = jest.fn((obj: { id: number; name: string }) => obj.id * 10);
      const memoizedFn = memoize(fn, (obj) => obj.id.toString());
      
      const result1 = memoizedFn({ id: 1, name: 'first' });
      const result2 = memoizedFn({ id: 1, name: 'second' }); // Different object, same ID
      
      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(fn).toHaveBeenCalledTimes(1); // Should use cache based on ID
    });
  });

  describe('TTLCache', () => {
    let cache: TTLCache<string, number>;

    beforeEach(() => {
      cache = new TTLCache<string, number>(100); // 100ms TTL
    });

    it('should store and retrieve values', () => {
      cache.set('key1', 42);
      expect(cache.get('key1')).toBe(42);
      expect(cache.has('key1')).toBe(true);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should expire values after TTL', (done) => {
      cache.set('key1', 42);
      expect(cache.get('key1')).toBe(42);
      
      setTimeout(() => {
        expect(cache.get('key1')).toBeUndefined();
        expect(cache.has('key1')).toBe(false);
        done();
      }, 150);
    });

    it('should delete values', () => {
      cache.set('key1', 42);
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all values', () => {
      cache.set('key1', 42);
      cache.set('key2', 24);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('BatchProcessor', () => {
    it('should batch process items', async () => {
      const processor = jest.fn().mockResolvedValue(['result1', 'result2']);
      const batchProcessor = new BatchProcessor(processor, 2, 50);
      
      const promise1 = batchProcessor.process('item1');
      const promise2 = batchProcessor.process('item2');
      
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenCalledWith(['item1', 'item2']);
    });

    it('should process immediately when batch is full', async () => {
      const processor = jest.fn().mockResolvedValue(['result1', 'result2']);
      const batchProcessor = new BatchProcessor(processor, 2, 1000); // Long delay
      
      const promise1 = batchProcessor.process('item1');
      const promise2 = batchProcessor.process('item2'); // Should trigger immediate processing
      
      await Promise.all([promise1, promise2]);
      
      expect(processor).toHaveBeenCalledTimes(1);
    });

    it('should handle processing errors', async () => {
      const processor = jest.fn().mockRejectedValue(new Error('Processing failed'));
      const batchProcessor = new BatchProcessor(processor, 2, 50);
      
      const promise1 = batchProcessor.process('item1');
      const promise2 = batchProcessor.process('item2');
      
      await expect(promise1).rejects.toThrow('Processing failed');
      await expect(promise2).rejects.toThrow('Processing failed');
    });
  });

  describe('createIntersectionObserver', () => {
    it('should create intersection observer with default options', () => {
      const callback = jest.fn();
      const observer = createIntersectionObserver(callback);
      
      expect(observer).toBeInstanceOf(IntersectionObserver);
      
      observer.disconnect();
    });

    it('should create intersection observer with custom options', () => {
      const callback = jest.fn();
      const options = {
        root: document.body,
        rootMargin: '100px',
        threshold: 0.5
      };
      const observer = createIntersectionObserver(callback, options);
      
      expect(observer).toBeInstanceOf(IntersectionObserver);
      
      observer.disconnect();
    });
  });

  describe('preloadImages', () => {
    it('should preload images successfully', async () => {
      const urls = ['image1.jpg', 'image2.png'];
      
      // Mock Image constructor
      const mockImages: any[] = [];
      global.Image = jest.fn().mockImplementation(() => {
        const img = {
          onload: null,
          onerror: null,
          src: ''
        };
        mockImages.push(img);
        return img;
      });
      
      const preloadPromise = preloadImages(urls);
      
      // Simulate successful loads
      mockImages.forEach(img => {
        setTimeout(() => img.onload?.(), 10);
      });
      
      await expect(preloadPromise).resolves.toEqual([undefined, undefined]);
    });

    it('should handle image load errors', async () => {
      const urls = ['invalid-image.jpg'];
      
      global.Image = jest.fn().mockImplementation(() => ({
        onload: null,
        onerror: null,
        src: ''
      }));
      
      const preloadPromise = preloadImages(urls);
      
      // Simulate error
      const mockImg = (global.Image as jest.Mock).mock.results[0].value;
      setTimeout(() => mockImg.onerror?.(new Error('Load failed')), 10);
      
      await expect(preloadPromise).rejects.toThrow();
    });
  });

  describe('ResourceManager', () => {
    it('should manage resources and cleanup', () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();
      const manager = new ResourceManager();
      
      manager.add(cleanup1);
      manager.add(cleanup2);
      
      manager.cleanup();
      
      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup errors gracefully', () => {
      const errorCleanup = jest.fn().mockImplementation(() => {
        throw new Error('Cleanup failed');
      });
      const normalCleanup = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const manager = new ResourceManager();
      manager.add(errorCleanup);
      manager.add(normalCleanup);
      
      expect(() => manager.cleanup()).not.toThrow();
      expect(errorCleanup).toHaveBeenCalled();
      expect(normalCleanup).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Resource cleanup error:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });
});
