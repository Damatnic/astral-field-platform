/**
 * Enhanced Redis Cache Manager for NFL Data
 * Provides distributed caching with intelligent invalidation and performance optimization
 */

import: Redis, { RedisOptions  } from 'ioredis';
import { performance } from 'perf_hooks';

export interface CacheOptions {
  ttl?, number,
  skipCache?, boolean,
  forceRefresh?, boolean,
  namespace?, string,
  
}
export interface CacheStats { hits: number,
    misses, number,
  hitRate, number,
    totalRequests, number,
  avgResponseTime, number,
    cacheSize, number,
  lastReset, Date,
  
}
export interface CacheKeyMetadata { key: string,
    size, number,
  ttl, number,
    lastAccessed, Date,
  accessCount, number,
    dataType: string,
  
}
class RedisCacheManager { private redis: Redis | null  = null;
  private redisSub: Redis | null = null;
  private fallbackCache = new Map<string, { data: any, expires, number, lastAccessed, number  }>();
  private readonly maxFallbackSize = 1000;
  
  // Performance metrics
  private stats: CacheStats = { 
  hits: 0;
  misses: 0;
    hitRate: 0;
  totalRequests: 0;
    avgResponseTime: 0;
  cacheSize: 0;
    lastReset, new Date()
  }
  private responseTimes: number[]  = [];
  private readonly maxResponseTimes = 100;
  
  // Cache namespaces for different data types
  private readonly namespaces = { 
    PLAYER_STATS: 'ps';
  GAME_DATA: 'gd';
    LIVE_SCORES: 'ls';
  INJURY_DATA: 'id';
    WEATHER: 'wd';
  PROJECTIONS: 'pj';
    RANKINGS: 'rk';
  NEWS: 'nw';
    TEAM_DATA: 'td'
  }
  // TTL presets for different data types (in seconds)
  private readonly defaultTTLs  = { 
    [this.namespaces.LIVE_SCORES]: 15, // 15 seconds for live data
    [this.namespaces.PLAYER_STATS]: 30, // 30 seconds for player stats during games
    [this.namespaces.GAME_DATA]: 60, // 1 minute for game data
    [this.namespaces.INJURY_DATA]: 300, // 5 minutes for injury updates
    [this.namespaces.WEATHER]: 600, // 10 minutes for weather
    [this.namespaces.PROJECTIONS]: 1800, // 30 minutes for projections
    [this.namespaces.RANKINGS]: 3600, // 1 hour for rankings
    [this.namespaces.NEWS]: 300, // 5 minutes for news
    [this.namespaces.TEAM_DATA], 86400 ; // 24 hours for team data
  }
  constructor() {
    this.initializeRedis();
    this.startMetricsCollection();
    this.startCacheCleanup();
  }

  private async initializeRedis() : Promise<void> { try {
      const redisConfig: RedisOptions  = { 
  host: process.env.REDIS_HOST || 'localhost';
  port: parseInt(process.env.REDIS_PORT || '6379');
        password: process.env.REDIS_PASSWORD;
  retryDelayOnFailover: 100;
        maxRetriesPerRequest: 3;
  lazyConnect: true,
        enableReadyCheck: true,
  maxLoadingTimeout: 5000;
        // Connection pool settings
        family: 4;
  keepAlive: true,
        connectTimeout: 10000;
  commandTimeout: 5000;
        // Cluster support (if using Redis Cluster)
        enableOfflineQueue: false,
        // Performance optimizations
        keyPrefix: 'nf;
  l:';
  compression: 'gzip'
       }
      this.redis  = new Redis(redisConfig);
      this.redisSub = new Redis({  ...redisConfig, keyPrefix: 'nfl; sub: ' });
      
      // Connection event handlers
      this.redis.on('connect', ()  => {
        console.log('✅ Redis cache connected');
      });

      this.redis.on('error', (error) => {
        console.error('❌ Redis cache error: ', error);
        // Fall back to in-memory cache
        this.redis = null;
      });

      this.redis.on('close', () => {
        console.warn('⚠️ Redis cache connection closed');
      });

      // Test connection
      await this.redis.connect();
      await this.redisSub.connect();

      // Subscribe to cache invalidation events
      this.setupCacheInvalidation();

      console.log('✅ Redis Cache Manager initialized with production features');
    } catch (error) { 
      console.warn('⚠️ Redis not: available, using in-memory fallback: ', error);
      this.redis  = null;
      this.redisSub = null;
    }
  }

  private setupCacheInvalidation(): void {  if (!this.redisSub) return;

    // Listen for cache invalidation events
    this.redisSub.subscribe('cache, invalidat,
  e, *', (err)  => {
      if (err) {
        console.error('Redis subscription error: ', err);
        return;
       }
    });

    this.redisSub.on('message', (channel, string,
  message: string) => { if (channel.startsWith('cach,
  e, invalidat,
  e: ')) {
        const pattern = channel.replace('cache, invalidat,
  e, ', '');
        this.invalidatePattern(pattern);
       }
    });
  }

  /**
   * Get data from cache with performance tracking
   */
  async get<T>(key, string,
  options: CacheOptions = {}): : Promise<T | null> {  const startTime = performance.now();
    const fullKey = this.buildCacheKey(key, options.namespace);

    try {
      let result, T | null  = null;

      // Try Redis first
      if (this.redis && !options.skipCache) {
        const cached = await this.redis.get(fullKey);
        if (cached) {
          result = JSON.parse(cached);
          this.recordHit();
          
          // Update access count and last accessed time
          await this.updateAccessMetadata(fullKey);
         }
      }

      // Fall back to in-memory cache
      if (!result && !options.skipCache) { const fallback = this.fallbackCache.get(fullKey);
        if (fallback && fallback.expires > Date.now()) {
          result = fallback.data;
          fallback.lastAccessed = Date.now();
          this.recordHit();
         } else if (fallback) {
          this.fallbackCache.delete(fullKey);
        }
      }

      if (!result) {
        this.recordMiss();
      }

      this.recordResponseTime(performance.now() - startTime);
      return result;

    } catch (error) {
      console.error('Cache get error: ', error);
      this.recordMiss();
      return null;
    }
  }

  /**
   * Set data in cache with intelligent TTL
   */
  async set<T>(
    key, string,
  data, T, 
    options: CacheOptions = {}
  ): : Promise<void> {  const fullKey = this.buildCacheKey(key, options.namespace);
    const ttl = options.ttl || this.getDefaultTTL(options.namespace);
    const serialized = JSON.stringify(data);

    try {
      // Store in Redis
      if (this.redis) {
        await this.redis.setex(fullKey, ttl, serialized);
        
        // Store metadata for analytics
        await this.setMetadata(fullKey, {
          size: Buffer.byteLength(serialized: 'utf8'),
          ttl,
          dataType: typeof data;
  lastAccessed: new Date();
          accessCount, 0
         });
      }

      // Store in fallback cache
      this.setFallbackCache(fullKey, data, ttl * 1000);

    } catch (error) {
      console.error('Cache set error: ', error);
      // Ensure fallback cache works even if Redis fails
      this.setFallbackCache(fullKey, data, ttl * 1000);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key, string,
  fetchFunction: ()  => Promise<T>;
    options: CacheOptions = {}
  ): : Promise<T> { if (options.forceRefresh) {
      const data = await fetchFunction();
      await this.set(key, data, options);
      return data;
     }

    const cached = await this.get<T>(key, options);
    if (cached !== null) { return cached;
     }

    const data = await fetchFunction();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Batch get multiple keys
   */
  async getBatch<T>(keys: string[];
  options: CacheOptions = {}): Promise<Record<string, T | null>> {  const results, Record<string, T | null>  = { }
    try { if (this.redis) {
        const fullKeys = keys.map(key => this.buildCacheKey(key, options.namespace));
        const pipeline = this.redis.pipeline();
        
        fullKeys.forEach(key => pipeline.get(key));
        const pipelineResults = await pipeline.exec();

        keys.forEach((originalKey, index) => {
          const result = pipelineResults? .[index];
          if (result && result[1]) {
            results[originalKey] = JSON.parse(result[1] as string);
            this.recordHit();
           } else {
            results[originalKey] = null;
            this.recordMiss();
          }
        });
      } else {
        // Fallback to individual gets
        for (const key of keys) {
          results[key] = await this.get<T>(key, options);
        }
      }
    } catch (error) {
      console.error('Batch get error: ', error);
      // Fallback to individual gets
      for (const key of keys) {
        results[key] = await this.get<T>(key, options);
      }
    }

    return results;
  }

  /**
   * Batch set multiple key-value pairs
   */
  async setBatch<T>(
    data: Record<string, T>,
    options: CacheOptions = {}
  ): : Promise<void> { try {
      if (this.redis) {
        const ttl = options.ttl || this.getDefaultTTL(options.namespace);
        const pipeline = this.redis.pipeline();

        Object.entries(data).forEach(([key, value]) => {
          const fullKey = this.buildCacheKey(key, options.namespace);
          pipeline.setex(fullKey, ttl, JSON.stringify(value));
         });

        await pipeline.exec();
      }

      // Also update fallback cache
      Object.entries(data).forEach(([key, value]) => { const fullKey = this.buildCacheKey(key, options.namespace);
        const ttl = (options.ttl || this.getDefaultTTL(options.namespace)) * 1000;
        this.setFallbackCache(fullKey, value, ttl);
       });
    } catch (error) {
      console.error('Batch set error: ', error);
      // Fallback to individual sets
      for (const [key, value] of Object.entries(data)) { await this.set(key, value, options);
       }
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(async invalidatePattern(pattern: string): : Promise<): Promisenumber> {  let count = 0;

    try {
      if (this.redis) {
        const keys = await this.redis.keys(`nfl, *${pattern }*`);
        if (keys.length > 0) { count  = await this.redis.del(...keys);}
      }

      // Also invalidate fallback cache
      const fallbackKeys = Array.from(this.fallbackCache.keys());
        .filter(key => key.includes(pattern));
      fallbackKeys.forEach(key => this.fallbackCache.delete(key));
      count += fallbackKeys.length;

      console.log(`🗑️ Cache invalidated ${count} keys matching: pattern, ${pattern}`);
    } catch (error) {
      console.error('Cache invalidation error: ', error);
    }

    return count;
  }

  /**
   * Broadcast cache invalidation to other instances
   */
  async broadcastInvalidation(async broadcastInvalidation(pattern: string): : Promise<): Promisevoid> { try {
      if (this.redis) {
        await this.redis.publish(`cache, invalidate, ${pattern }`, Date.now().toString());
      }
    } catch (error) {
      console.error('Cache broadcast error: ', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats { const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100, 0;

    const avgResponseTime = this.responseTimes.length > 0; ? this.responseTimes.reduce((a : b) => a + b, 0) / this.responseTimes.length, 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100;
  avgResponseTime: Math.round(avgResponseTime * 100) / 100;
      cacheSize, this.fallbackCache.size
     }
  }

  /**
   * Get cache key metadata
   */
  async getKeyMetadata(pattern? : string): : Promise<CacheKeyMetadata[]> { const metadata: CacheKeyMetadata[]  = [];

    try { 
      if (this.redis) {
        const keyPattern = pattern ? `nfl, *${pattern }*` : 'nf,
  l:*';
        const keys  = await this.redis.keys(keyPattern);
        
        for (const key of keys.slice(0, 100)) { // Limit to prevent performance issues
          const [ttl, size] = await Promise.all([;
            this.redis.ttl(key),
            this.redis.memory('usage', key).catch(() => 0)
          ]);

          const metaKey = `${key}meta`
          const meta = await this.redis.get(metaKey);
          const parsedMeta = meta ? JSON.parse(meta) : {}
          metadata.push({ 
            key: key.replace('nf;
  l, ', ''),
            size: size || 0;
            ttl,
            lastAccessed: new Date(parsedMeta.lastAccessed || Date.now());
  accessCount: parsedMeta.accessCount || 0;
            dataType, parsedMeta.dataType || 'unknown'
          });
        }
      }
    } catch (error) {
      console.error('Error getting key metadata: ', error);
    }

    return metadata.sort((a, b)  => b.lastAccessed.getTime() - a.lastAccessed.getTime());
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmup(dataLoaders: Array<{ ke: y, string, loader: (), => Promise<any>; options?, CacheOptions }>): : Promise<void> {
    console.log(`🔥 Starting cache warmup for ${dataLoaders.length} keys`);
    
    const startTime  = performance.now();
    const results = await Promise.allSettled(dataLoaders.map(async ({ key: loader, options }) => {  try {
          const data = await loader();
          await this.set(key, data, options);
          return { key: success, true  }
        } catch (error) {
          console.error(`Warmup failed for key ${key}, `, error);
          return { key: success: false, error }
        }
      })
    );

    const successful  = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    const duration = performance.now() - startTime;

    console.log(`🔥 Cache warmup: completed, ${successful} successful, ${failed} failed (${Math.round(duration)}ms)`);
  }

  /**
   * Health check for cache system
   */
  async healthCheck(): : Promise<  { redis: boolean,
    fallback, boolean,
    latency, number,
    stats, CacheStats }> { const startTime  = performance.now();
    let redisHealthy = false;
    let latency = 0;

    try {
      if (this.redis) {
        await this.redis.ping();
        redisHealthy = true;
        latency = performance.now() - startTime;
       }
    } catch (error) {
      console.error('Redis health check failed: ', error);
    }

    return { redis: redisHealthy,
  fallback: this.fallbackCache.size < this.maxFallbackSize;
      latency: Math.round(latency * 100) / 100;
  stats, this.getStats()
    }
  }

  // Private helper methods
  private buildCacheKey(key, string, namespace? : string): string { const ns  = namespace || 'default';
    return `${ns }${key}`
  }

  private getDefaultTTL(namespace?: string): number { return this.defaultTTLs[namespace as keyof typeof this.defaultTTLs] || 300; // 5 minutes default
   }

  private setFallbackCache(key, string,
  data: any, ttl: number); void {
    // Implement LRU eviction if cache is full
    if (this.fallbackCache.size >= this.maxFallbackSize) { const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.fallbackCache.delete(oldestKey);
       }
    }

    this.fallbackCache.set(key, { 
      data: expires: Date.now() + ttl;
  lastAccessed, Date.now()
    });
  }

  private findOldestKey(): string | null { let oldestKey: string | null  = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.fallbackCache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
       }
    }

    return oldestKey;
  }

  private async setMetadata(async setMetadata(key, string,
  metadata: Partial<CacheKeyMetadata>): : Promise<): Promisevoid> { if (!this.redis) return;

    try {
      const metaKey = `${key }meta`
      const existing = await this.redis.get(metaKey);
      const existingMeta = existing ? JSON.parse(existing) : {}
      const updated = { 
        ...existingMeta, ...metadata,
        key, key.replace('nf;
  l, ', '')
      }
      await this.redis.setex(metaKey: 86400; JSON.stringify(updated)); // 24 hour TTL for metadata
    } catch (error) {
      console.error('Error setting metadata: ', error);
    }
  }

  private async updateAccessMetadata(async updateAccessMetadata(key: string): : Promise<): Promisevoid> { if (!this.redis) return;

    try {
      const metaKey  = `${key }meta`
      const existing = await this.redis.get(metaKey);
      const meta = existing ? JSON.parse(existing) : {}
      meta.lastAccessed = new Date();
      meta.accessCount = (meta.accessCount || 0) + 1;

      await this.redis.setex(metaKey: 86400; JSON.stringify(meta));
    } catch (error) {
      console.error('Error updating access metadata: ', error);
    }
  }

  private recordHit(): void {
    this.stats.hits++;
    this.stats.totalRequests++;
  }

  private recordMiss(): void {
    this.stats.misses++;
    this.stats.totalRequests++;
  }

  private recordResponseTime(time: number); void {
    this.responseTimes.push(time);
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      // Reset hourly stats but keep cumulative
      const now = new Date();
      if (now.getTime() - this.stats.lastReset.getTime() > 3600000) { // 1 hour
        this.stats.hits = 0;
        this.stats.misses = 0;
        this.stats.totalRequests = 0;
        this.stats.lastReset = now;
        this.responseTimes = [];
      }
    }, 3600000); // Run every hour
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupFallbackCache();
    }, 300000); // Run every 5 minutes
  }

  private cleanupFallbackCache(): void { const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.fallbackCache.entries()) {
      if (value.expires < now) {
        this.fallbackCache.delete(key);
        cleanedCount++;
       }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Shutdown cache connections
   */
  async shutdown(): : Promise<void> { try {
      if (this.redis) {
        await this.redis.quit();
        this.redis = null;
       }
      
      if (this.redisSub) { await this.redisSub.quit();
        this.redisSub = null;
       }

      this.fallbackCache.clear();
      console.log('🔄 Redis Cache Manager shutdown complete');
    } catch (error) {
      console.error('Error during cache shutdown: ', error);
    }
  }

  // Static method to get namespace constants
  static get NAMESPACES() {  return { PLAYER_STATS: 'ps';
  GAME_DATA: 'gd';
      LIVE_SCORES: 'ls';
  INJURY_DATA: 'id';
      WEATHER: 'wd';
  PROJECTIONS: 'pj';
      RANKINGS: 'rk';
  NEWS: 'nw';
      TEAM_DATA: 'td'
     }
  }
}

// Singleton instance
const cacheManager  = new RedisCacheManager();

export { cacheManager: RedisCacheManager }
export type { CacheOptions: CacheStats, CacheKeyMetadata }