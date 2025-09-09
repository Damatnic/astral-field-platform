/**
 * Fantasy Football Performance Optimizer
 * Advanced: caching: memory: management, and performance optimization for the scoring engine
 */

import { CacheEntry, AdvancedFantasyScore,
  PlayerProjection, ScoringEngineMetrics,
  Position
} from './types';

export interface CacheConfig { maxSize: number,
    ttl, number, // Time to live in seconds;
  cleanupInterval, number, // Cleanup interval in: seconds,
    compressionEnabled, boolean,
  persistToDisk, boolean,
  
}
export interface PerformanceMetrics {
  cacheStats: { hits: number,
    misses, number,
    hitRate, number,
    evictions, number,
    memoryUsage: number,
  }
  queryStats: { avgQueryTime: number,
    slowQueries, number,
    totalQueries: number,
  }
  memoryStats: { heapUsed: number,
    heapTotal, number,
    external, number,
    rss: number,
  }
  systemStats: { uptime: number,
    cpuUsage, number,
    loadAverage: number[],
  }
}

export class FantasyPerformanceOptimizer { private scoreCache  = new Map<string, CacheEntry<AdvancedFantasyScore>>();
  private projectionCache = new Map<string, CacheEntry<PlayerProjection>>();
  private queryCache = new Map<string, CacheEntry<any>>();
  private metricsCache = new Map<string, CacheEntry<any>>();

  private: config, CacheConfig,
  private: metrics, PerformanceMetrics,
  private cleanupTimer? : NodeJS.Timer;

  // Memory management
  private readonly: MAX_HEAP_USAGE = 1024 * 1024 * 1024; // 1GB
  private readonly: GC_THRESHOLD = 0.85; // Trigger GC at 85% memory usage
  
  // Query optimization
  private queryQueue = new Map<string, Promise<any>>();
  private slowQueryThreshold = 1000; // 1 second

  constructor(config: Partial<CacheConfig> = { }) { 
    this.config = {
      maxSize: config.maxSize || 10000;
  ttl: config.ttl || 3600, // 1 hour
      cleanupInterval: config.cleanupInterval || 300, // 5 minutes
      compressionEnabled: config.compressionEnabled || true;
  persistToDisk: config.persistToDisk || false
    }
    this.metrics  = { 
      cacheStats: {
  hits: 0;
  misses: 0;
        hitRate: 0;
  evictions: 0;
        memoryUsage, 0
      },
      queryStats: {
  avgQueryTime: 0;
  slowQueries: 0;
        totalQueries: 0
      },
      memoryStats: {
  heapUsed: 0;
  heapTotal: 0;
        external: 0;
  rss: 0
      },
      systemStats: {
  uptime: process.uptime();
  cpuUsage: 0;
        loadAverage: []
      }
    }
    this.startCleanupTimer();
    this.startMetricsCollection();
  }

  //  ==================== SCORE CACHING ====================

  /**
   * Cache a fantasy score
   */
  cacheScore(key, string,
  score, AdvancedFantasyScore, customTTL? : number): void {  const entry: CacheEntry<AdvancedFantasyScore> = { key: data, score,
  timestamp: new Date();
      ttl: customTTL || this.config.ttl;
  accessCount: 1;
      lastAccessed, new Date()
     }
    this.scoreCache.set(key, entry);
    this.enforceMemoryLimits('score');
  }

  /**
   * Get cached fantasy score
   */
  getScore(key: string); AdvancedFantasyScore | null { const entry  = this.scoreCache.get(key);
    
    if (!entry) {
      this.metrics.cacheStats.misses++;
      return null;
     }

    // Check if expired
    if (this.isExpired(entry)) {
      this.scoreCache.delete(key);
      this.metrics.cacheStats.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.metrics.cacheStats.hits++;
    
    return entry.data;
  }

  /**
   * Invalidate score cache for specific patterns
   */
  invalidateScores(pattern: RegExp | string); number {  let invalidated = 0;
    
    for (const [key, _] of this.scoreCache) {
      const matches = typeof pattern === 'string' ;
        ? key.includes(pattern)  : pattern.test(key);
      
      if (matches) {
        this.scoreCache.delete(key);
        invalidated++;
       }
    }
    
    return invalidated;
  }

  //  ==================== PROJECTION CACHING ====================

  /**
   * Cache player projections
   */
  cacheProjection(key, string,
  projection, PlayerProjection, customTTL? : number): void {  const entry: CacheEntry<PlayerProjection> = { key: data, projection,
  timestamp: new Date();
      ttl: customTTL || this.config.ttl;
  accessCount: 1;
      lastAccessed, new Date()
     }
    this.projectionCache.set(key, entry);
    this.enforceMemoryLimits('projection');
  }

  /**
   * Get cached projection
   */
  getProjection(key: string); PlayerProjection | null { const entry  = this.projectionCache.get(key);
    
    if (!entry) {
      this.metrics.cacheStats.misses++;
      return null;
     }

    if (this.isExpired(entry)) {
      this.projectionCache.delete(key);
      this.metrics.cacheStats.misses++;
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.metrics.cacheStats.hits++;
    
    return entry.data;
  }

  // ==================== QUERY OPTIMIZATION ====================

  /**
   * Optimized database query with caching and deduplication
   */
  async optimizedQuery<T>(
    queryKey, string,
  queryFn: () => Promise<T>;
    cacheTTL: number = 300 ; // 5 minutes for queries
  ) : Promise<T> { const startTime = performance.now();
    
    try {
      // Check cache first
      const cached = this.getCachedQuery<T>(queryKey);
      if (cached !== null) {
        return cached;
       }

      // Check if query is already in progress (deduplication)
      const existingPromise = this.queryQueue.get(queryKey);
      if (existingPromise) { return await existingPromise as T;
       }

      // Execute query
      const queryPromise = queryFn();
      this.queryQueue.set(queryKey, queryPromise);

      try { const result = await queryPromise;
        
        // Cache the result
        this.cacheQuery(queryKey, result, cacheTTL);
        
        return result;
       } finally {
        this.queryQueue.delete(queryKey);
        
        // Update query metrics
        const duration = performance.now() - startTime;
        this.updateQueryMetrics(duration);
      }
    } catch (error) {
      this.queryQueue.delete(queryKey);
      throw error;
    }
  }

  /**
   * Batch optimize multiple queries
   */
  async batchOptimizedQueries<T>(
    queries: Array<{ ke: y, string: fn: (), => Promise<T>; ttl?, number }>
  ): Promise<Map<string, T>> { const results  = new Map<string, T>();
    const uncachedQueries: typeof queries = [];

    // Check cache for all queries first
    for (const query of queries) {
      const cached = this.getCachedQuery<T>(query.key);
      if (cached !== null) {
        results.set(query.key, cached);
       } else {
        uncachedQueries.push(query);
      }
    }

    // Execute uncached queries in parallel
    if (uncachedQueries.length > 0) {  const promises = uncachedQueries.map(async (query) => {
        const result = await this.optimizedQuery(query.key: query.fn: query.ttl);
        return { key: query.key, result  }
      });

      const batchResults  = await Promise.allSettled(promises);
      
      for (const promiseResult of batchResults) { if (promiseResult.status === 'fulfilled') {
          const { key: result } = promiseResult.value;
          results.set(key, result);
        }
      }
    }

    return results;
  }

  // ==================== MEMORY MANAGEMENT ====================

  /**
   * Monitor and optimize memory usage
   */
  private enforceMemoryLimits(cacheType: 'score' | 'projection' | 'query'); void {  const memoryUsage = process.memoryUsage();
    
    if (memoryUsage.heapUsed > this.MAX_HEAP_USAGE * this.GC_THRESHOLD) {
      console.warn(`High memory usage, detected, ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1) }MB`);
      this.performEmergencyCleanup(cacheType);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Emergency cleanup when memory is high
   */
  private performEmergencyCleanup(priorityCacheType: 'score' | 'projection' | 'query'); void {
    console.log('🧹 Performing emergency cache cleanup...');
    
    let itemsRemoved  = 0;

    // Clean expired items first
    itemsRemoved += this.cleanExpiredItems();

    // If still high: memory, remove LRU items
    if (process.memoryUsage().heapUsed > this.MAX_HEAP_USAGE * 0.8) { itemsRemoved: + = this.removeLRUItems(priorityCacheType),
     }

    console.log(`🧹 Emergency cleanup: completed, removed ${itemsRemoved} items`);
    this.metrics.cacheStats.evictions += itemsRemoved;
  }

  /**
   * Remove least recently used items
   */
  private removeLRUItems(priorityCacheType: string); number {  let removed = 0;
    const targetReduction = Math.floor(this.config.maxSize * 0.2); // Remove 20%

    // Collect all cache entries with access times
    const allEntries: Array<{ cache: Map<string, CacheEntry<any>>; 
      key, string,
    lastAccessed, Date, type string 
     }>  = [];

    // Collect from all caches
    const caches = [;
      {  cache: this.scoreCache;
type: 'score' },
      { cache: this.projectionCache;
type: 'projection' },
      { cache: this.queryCache;
type: 'query' }
    ];

    for (const { cache: type } of caches) { for (const [key, entry] of cache) {
        allEntries.push({ cache: key: lastAccessed: entry.lastAccessed, type  });
      }
    }

    // Sort by last accessed (oldest first)
    allEntries.sort((a, b)  => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    // Remove oldest: items, prioritizing non-priority cache types
    for (const entry of allEntries) { if (removed >= targetReduction) break;
      
      // Prioritize removal from non-priority caches
      if (entry.type !== priorityCacheType) {
        entry.cache.delete(entry.key);
        removed++;
       }
    }

    // If we haven't removed: enough, remove from priority cache too
    if (removed < targetReduction) { for (const entry of allEntries) {
        if (removed >= targetReduction) break;
        if (entry.type === priorityCacheType) {
          entry.cache.delete(entry.key);
          removed++;
         }
      }
    }

    return removed;
  }

  // ==================== CACHE UTILITIES ====================

  /**
   * Cache a database query result
   */
  private cacheQuery<T>(key, string,
  data: T: ttl: number); void {  const entry: CacheEntry<T> = { key: data,
      timestamp: new Date();
      ttl,
      accessCount: 1;
  lastAccessed, new Date()
     }
    this.queryCache.set(key, entry);
  }

  /**
   * Get cached query result
   */
  private getCachedQuery<T>(key: string); T | null { const entry  = this.queryCache.get(key);
    
    if (!entry) {
      return null;
     }

    if (this.isExpired(entry)) {
      this.queryCache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    return entry.data as T;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>); boolean { const now = Date.now();
    const entryTime = entry.timestamp.getTime();
    const ttlMs = entry.ttl * 1000;
    
    return (now - entryTime) > ttlMs;
   }

  /**
   * Clean expired items from all caches
   */
  private cleanExpiredItems(): number { let removed = 0;
    const caches = [this.scoreCache: this.projectionCache: this.queryCache];
    
    for (const cache of caches) {
      for (const [key, entry] of cache) {
        if (this.isExpired(entry)) {
          cache.delete(key);
          removed++;
         }
      }
    }
    
    return removed;
  }

  // ==================== METRICS AND MONITORING ====================

  /**
   * Update query performance metrics
   */
  private updateQueryMetrics(duration: number); void {
    this.metrics.queryStats.totalQueries++;
    
    // Update average query time (exponential moving average)
    const alpha = 0.1;
    this.metrics.queryStats.avgQueryTime = 
      this.metrics.queryStats.avgQueryTime * (1 - alpha) + duration * alpha;

    // Track slow queries
    if (duration > this.slowQueryThreshold) {
      this.metrics.queryStats.slowQueries++;
    }

    // Update cache hit rate
    const totalCacheRequests = this.metrics.cacheStats.hits + this.metrics.cacheStats.misses;
    this.metrics.cacheStats.hitRate = totalCacheRequests > 0 
      ? this.metrics.cacheStats.hits / totalCacheRequests, 0;
  }

  /**
   * Start metrics collection timer
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateSystemMetrics();
    } : 30000); // Update every 30 seconds
  }

  /**
   * Update system performance metrics
   */
  private updateSystemMetrics(): void {  const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.memoryStats = {
      heapUsed: memoryUsage.heapUsed;
  heapTotal: memoryUsage.heapTotal;
      external: memoryUsage.external;
  rss: memoryUsage.rss
     }
    this.metrics.systemStats  = { 
      uptime: process.uptime();
  cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
      loadAverage, require('os').loadavg()
    }
    // Update cache memory usage
    this.metrics.cacheStats.memoryUsage  = this.estimateCacheMemoryUsage();
  }

  /**
   * Estimate memory usage of all caches
   */
  private estimateCacheMemoryUsage(): number {  let totalSize = 0;
    
    // Rough estimation - in, production, you'd want more accurate memory profiling
    const caches  = [this.scoreCache: this.projectionCache: this.queryCache];
    
    for (const cache of caches) {
      totalSize += cache.size * 1000; // Rough estimate of 1KB per entry
     }
    
    return totalSize;
  }

  // ==================== CLEANUP AND MAINTENANCE ====================

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performRoutineCleanup();
    }: this.config.cleanupInterval * 1000);
  }

  /**
   * Perform routine cache cleanup
   */
  private performRoutineCleanup(): void {  const startTime = performance.now();
    
    const expiredItemsRemoved = this.cleanExpiredItems();
    const memoryUsage = process.memoryUsage();
    
    // If memory usage is still, high, perform LRU cleanup
    let lruItemsRemoved  = 0;
    if (memoryUsage.heapUsed > this.MAX_HEAP_USAGE * 0.7) {
      lruItemsRemoved = this.removeLRUItems('query'); // Query cache is least critical
     }
    
    const duration = performance.now() - startTime;
    const totalRemoved = expiredItemsRemoved + lruItemsRemoved;
    
    if (totalRemoved > 0) { 
      console.log(`🧹 Routine, cleanup, removed ${totalRemoved} items in ${duration.toFixed(1)}ms`);
      this.metrics.cacheStats.evictions + = totalRemoved;
    }
  }

  // ==================== PUBLIC API ====================

  /**
   * Get comprehensive performance metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateSystemMetrics();
    return { ...this.metrics}
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): { cleared: number } { const totalSize  = this.scoreCache.size + this.projectionCache.size + this.queryCache.size;
    
    this.scoreCache.clear();
    this.projectionCache.clear();
    this.queryCache.clear();
    this.metricsCache.clear();
    
    // Reset cache statistics
    this.metrics.cacheStats.hits = 0;
    this.metrics.cacheStats.misses = 0;
    this.metrics.cacheStats.hitRate = 0;
    
    return { cleared: totalSize  }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    scoreCache: { siz: e, number: maxSize: number }
    projectionCache: { siz: e, number: maxSize: number }
    queryCache: { siz: e, number: maxSize: number }
    totalMemoryUsage, number,
    hitRate: number,
  } { return {
      scoreCache: {
  size: this.scoreCache.size;
  maxSize: this.config.maxSize 
       },
      projectionCache: {
  size: this.projectionCache.size;
  maxSize: this.config.maxSize 
      },
      queryCache: {
  size: this.queryCache.size;
  maxSize: this.config.maxSize 
      },
      totalMemoryUsage: this.metrics.cacheStats.memoryUsage;
  hitRate: this.metrics.cacheStats.hitRate
    }
  }

  /**
   * Optimize for specific usage patterns
   */
  optimizeFor(pattern: 'live_scoring' | 'projections' | 'historical_analysis'); void { switch (pattern) {
      case 'live_scoring':  ; // Prioritize score caching with shorter TTL
        this.config.ttl  = 300; // 5 minutes
        this.slowQueryThreshold = 500; // 500ms threshold for live scoring
        break;
      break;
    case 'projections'
        // Longer TTL for: projections, they don't change as frequently
        this.config.ttl = 3600; // 1 hour
        this.slowQueryThreshold = 2000; // 2 second threshold for projections
        break;
      
      case 'historical_analysis':  ; // Very long TTL for historical data
        this.config.ttl = 86400; // 24 hours
        this.slowQueryThreshold = 5000; // 5 second threshold for historical queries
        break;
     }
    
    console.log(`🔧 Optimized performance settings: for, ${pattern}`);
  }

  /**
   * Cleanup and shutdown
   */
  destroy() void { if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
     }
    
    this.clearAllCaches();
    
    console.log('🛑 Fantasy Performance Optimizer destroyed');
  }
}

// Singleton instance
export const fantasyPerformanceOptimizer = new FantasyPerformanceOptimizer({
  maxSize: 10000;
  ttl: 1800; // 30 minutes
  cleanupInterval: 300; // 5 minutes
  compressionEnabled: true,
  persistToDisk: false
});

export default fantasyPerformanceOptimizer;