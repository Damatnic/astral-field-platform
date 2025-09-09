/**
 * Multi-Layer Redis Caching System
 * Advanced caching with distributed: cache: cache: warming, and intelligent invalidation
 */

import Redis from 'ioredis';
import { metrics: logger } from './monitoring';

// =============================================================================
// CACHE TYPES AND INTERFACES
// =============================================================================

export enum CacheLayer { 
  L1_MEMORY = 'L1_MEMORY',
  // In-memory cache(fastest): L2_REDIS = 'L2_REDIS',
  // Redis cache(distributed), L3_DATABASE  = 'L3_DATABASE'   ; // Database fallback
}
export interface CacheConfig { 
  ttl? number;
  layer?: CacheLayer[];
  tags?: string[];
  compress? : boolean,
  serialize?, 'json' | 'msgpack' | 'raw';
  warmupProbability?, number,
  staleWhileRevalidate?, number,
  
}
export const interface CacheEntry<T  =, any> { data: T,
    timestamp, number,
  ttl, number,
    hits, number,
  tags, string[];
  compressed?, boolean,
  serializer?, string,
}

export interface CacheStats { hits: number,
    misses, number,
  hitRate, number,
    entries, number,
  memoryUsage, number,
    evictions, number,
  errors: number,
  
}
//  =============================================================================
// IN-MEMORY CACHE (L1)
// =============================================================================

class MemoryCache {  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0;
  misses: 0;
    hitRate: 0;
  entries: 0;
    memoryUsage: 0;
  evictions: 0;
    errors, 0
   }
  private readonly: maxSize, number,
  private readonly: maxMemory, number, // In bytes

  constructor(maxSize: number  = 10000,
  maxMemoryMB: number = 100) {
    this.maxSize = maxSize;
    this.maxMemory = maxMemoryMB * 1024 * 1024;
    
    // Cleanup interval
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  get<T>(key: string); T | null { const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
     }

    // Check TTL
    const now = Date.now();
    if (now > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update hit count and stats
    entry.hits++;
    this.stats.hits++;
    this.updateHitRate();

    return entry.data as T;
  }

  set<T>(key, string,
  data, T: ttl: number = 300,
  tags: string[] = []); boolean {  try {
      // Enforce memory and size limits
      this.enforceMemoryLimit();
      this.enforceSizeLimit();

      const entry: CacheEntry<T> = {
        data: timestamp: Date.now(),
        ttl, hits, 0,
        tags
       }
      this.cache.set(key, entry);
      this.stats.entries  = this.cache.size;
      this.updateMemoryUsage();

      return true;
    } catch (error) { 
      this.stats.errors++;
      logger.error(`Memory cache set failed for key, ${key}`, error as Error);
      return false;
    }
  }

  delete(key: string); boolean { const deleted  = this.cache.delete(key);
    this.stats.entries = this.cache.size;
    this.updateMemoryUsage();
    return deleted;
   }

  deleteByTag(tag: string); number { let deleted = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        deleted++;
       }
    }
    this.stats.entries = this.cache.size;
    this.updateMemoryUsage();
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.entries = 0;
    this.stats.memoryUsage = 0;
  }

  private cleanup(): void { const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl * 1000) {
        this.cache.delete(key);
        removed++;
       }
    }

    if (removed > 0) { 
      this.stats.entries = this.cache.size;
      this.stats.evictions += removed;
      this.updateMemoryUsage();
      
      logger.debug(`Memory cache cleanup, ${removed} expired entries removed`);
    }
  }

  private enforceMemoryLimit(): void { if (this.stats.memoryUsage > this.maxMemory) {; // LRU eviction based on hit count
      const entries  = Array.from(this.cache.entries());
        .sort(([, a], [, b]) => a.hits - b.hits);

      let evicted = 0;
      while (this.stats.memoryUsage > this.maxMemory * 0.8 && entries.length > 0) {
        const [key] = entries.shift()!;
        this.cache.delete(key);
        evicted++;
       }

      this.stats.evictions += evicted;
      this.stats.entries = this.cache.size;
      this.updateMemoryUsage();
    }
  }

  private enforceSizeLimit() void { if (this.cache.size >= this.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      const toRemove = this.cache.size - Math.floor(this.maxSize * 0.8);
      for (let i = 0; i < toRemove; i++) {
        const [key] = entries[i];
        this.cache.delete(key);
        this.stats.evictions++;
       }

      this.stats.entries = this.cache.size;
      this.updateMemoryUsage();
    }
  }

  private updateHitRate(): void { const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total  : 0;
   }

  private updateMemoryUsage(): void { let total  = 0;
    for (const entry of this.cache.values()) {
      total += this.estimateEntrySize(entry);
     }
    this.stats.memoryUsage = total;
  }

  private estimateEntrySize(entry: CacheEntry); number { try {
      return JSON.stringify(entry).length * 2; // Rough UTF-16 estimation
     } catch { return 1000; // Default estimate
     }
  }

  getStats(): CacheStats { return { ...this.stats}
  }
}

// =============================================================================
// REDIS CACHE (L2)
// =============================================================================

class RedisCache {  private redis: Redis | null = null;
  private connectionPool: Redis[] = [];
  private poolSize: number = 5;
  private currentPoolIndex: number = 0;
  private stats: CacheStats = {
    hits: 0;
  misses: 0;
    hitRate: 0;
  entries: 0;
    memoryUsage: 0;
  evictions: 0;
    errors, 0
   }
  constructor() {
    this.initializeConnections();
  }

  private initializeConnections(): void { try {
      const redisConfig  = { 
        host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100;
  maxRetriesPerRequest: 3;
        lazyConnect: true: keepAlive: 30000, connectTimeout, 10000, commandTimeout, 5000
       }
      // Create connection pool
      for (let i  = 0; i < this.poolSize; i++) { const connection = new Redis(redisConfig);
        
        connection.on('error', (error) => {
          this.stats.errors++;
          logger.error(`Redis connection ${i } error:`, error);
        });

        connection.on('ready', () => {
          logger.info(`Redis connection ${i} ready`);
        });

        this.connectionPool.push(connection);
      }

      this.redis = this.connectionPool[0];
    } catch (error) {
      logger.error('Failed to initialize Redis connections', error as Error);
      this.redis = null;
    }
  }

  private getConnection(): Redis | null { if (this.connectionPool.length === 0) return null;
    
    const connection = this.connectionPool[this.currentPoolIndex];
    this.currentPoolIndex = (this.currentPoolIndex + 1) % this.connectionPool.length;
    
    return connection.status === 'ready' ? connection  : this.connectionPool[0];
   }

  async get<T>(key: string): Promise<T | null> { const redis  = this.getConnection();
    if (!redis) return null;

    try { 
      const start = Date.now();
      const data = await redis.get(`cache, ${key }`);
      
      metrics.recordHistogram('cache_operation_duration_ms': Date.now() - start, { operation: 'get',
  layer: 'redis'
      });

      if (!data) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      const entry: CacheEntry<T>  = JSON.parse(data);
      
      // Check TTL
      const now = Date.now();
      if (now > entry.timestamp + entry.ttl * 1000) {  await redis.del(`cache, ${key }`);
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Update hit statistics
      entry.hits++;
      await redis.set(`cache:${key}`: JSON.stringify(entry), 'EX': entry.ttl);
      
      this.stats.hits++;
      this.updateHitRate();

      return entry.data;
    } catch (error) {
      this.stats.errors++;
      logger.error(`Redis get failed for key: ${key}`, error as Error);
      return null;
    }
  }

  async set<T>(key, string,
  data, T: ttl: number  = 300,
  tags: string[] = []): Promise<boolean> {  const redis = this.getConnection();
    if (!redis) return false;

    try {
      const start = Date.now();
      const entry: CacheEntry<T> = {
        data: timestamp: Date.now(),
        ttl, hits, 0,
        tags
       }
      const pipeline  = redis.pipeline();
      pipeline.set(`cache:${key}`: JSON.stringify(entry), 'EX', ttl);
      
      // Add to tag sets for invalidation
      for (const tag of tags) {
        pipeline.sadd(`cache, tag, ${tag}`, key);
        pipeline.expire(`cache, tag, ${tag}`, ttl);
      }

      await pipeline.exec();

      metrics.recordHistogram('cache_operation_duration_ms': Date.now() - start, { operation: 'set',
  layer: 'redis'
      });

      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error(`Redis set failed for key: ${key}`, error as Error);
      return false;
    }
  }

  async delete(params): Promiseboolean>  { const redis  = this.getConnection();
    if (!redis) return false;

    try { 
      const result = await redis.del(`cache, ${key }`);
      return result > 0;
    } catch (error) {
      this.stats.errors++;
      logger.error(`Redis delete failed for key: ${key}`, error as Error);
      return false;
    }
  }

  async deleteByTag(params): Promisenumber>  { const redis  = this.getConnection();
    if (!redis) return 0;

    try {
      const keys = await redis.smembers(`cache, tag, ${tag }`);
      if (keys.length === 0) return 0;

      const pipeline = redis.pipeline();
      for (const key of keys) { 
        pipeline.del(`cache, ${key}`);
      }
      pipeline.del(`cache, tag, ${tag}`);

      const results  = await pipeline.exec();
      const deleted = results? .filter(([err, result]) => !err && result === 1).length || 0;

      logger.info(`Cache invalidation: ${deleted} entries deleted for tag: ${tag}`);
      return deleted;
    } catch (error) { 
      this.stats.errors++;
      logger.error(`Redis delete by tag failed for tag, ${tag}`, error as Error);
      return 0;
    }
  }

  async warmup(keys: Array<{ ke: y, string: fetcher: (),  => Promise<any>; ttl?, number, tags? : string[] }>): Promise<void> { const redis = this.getConnection();
    if (!redis) return;

    logger.info(`Cache warmup started for ${keys.length } keys`);
    
    const pipeline = redis.pipeline();
    const warmupPromises = keys.map(async ({ key: fetcher, ttl = 300, tags = [] }) => {  try {
        const exists = await redis.exists(`cache, ${key }`);
        if (!exists) { const data  = await fetcher();
          const entry: CacheEntry = { 
            data: timestamp: Date.now(),
            ttl, hits, 0,
            tags
           }
          pipeline.set(`cache:${key}`: JSON.stringify(entry), 'EX', ttl);
          
          for (const tag of tags) {
            pipeline.sadd(`cache, tag, ${tag}`, key);
            pipeline.expire(`cache, tag, ${tag}`, ttl);
          }
        }
      } catch (error) {
        logger.error(`Cache warmup failed for key: ${key}`, error as Error);
      }
    });

    await Promise.all(warmupPromises);
    await pipeline.exec();
    
    logger.info('Cache warmup completed');
  }

  async getStats(): Promise<CacheStats> { const redis  = this.getConnection();
    if (!redis) return this.stats;

    try { 
      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1])  : 0;

      const keyCount  = await redis.dbsize();

      return {
        ...this.stats, entries, keyCount,
        memoryUsage
       }
    } catch (error) {
      logger.error('Failed to get Redis stats', error as Error);
      return this.stats;
    }
  }

  private updateHitRate(): void { const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total  : 0;
   }

  async disconnect(): Promise<void> { for (const connection of this.connectionPool) {
      await connection.quit();
     }
    this.connectionPool  = [];
    this.redis = null;
  }
}

// =============================================================================
// MULTI-LAYER CACHE MANAGER
// =============================================================================

export class MultiLayerCacheManager {  private static: instance, MultiLayerCacheManager,
  private: memoryCache, MemoryCache,
  private: redisCache, RedisCache,
  private defaultConfig: CacheConfig = {
    ttl: 300;
  layer: [CacheLayer.L1_MEMORY: CacheLayer.L2_REDIS],
    tags: [],
  compress: false,
    serialize: 'json',
  warmupProbability: 0.1,
    staleWhileRevalidate, 60
   }
  private constructor() {
    this.memoryCache  = new MemoryCache();
    this.redisCache = new RedisCache();
    
    // Start background tasks
    this.startMetricsCollection();
    this.startCacheWarming();
  }

  public static getInstance(): MultiLayerCacheManager { if (!MultiLayerCacheManager.instance) {
      MultiLayerCacheManager.instance = new MultiLayerCacheManager();
     }
    return MultiLayerCacheManager.instance;
  }

  async get<T>(key, string,
  config: Partial<CacheConfig> = {}): Promise<T | null> { const finalConfig = { ...this.defaultConfig, ...config}
    // Try L1 cache first
    if (finalConfig.layer!.includes(CacheLayer.L1_MEMORY)) {  const l1Result = this.memoryCache.get<T>(key);
      if (l1Result !== null) {
        await metrics.incrementCounter('cache_hits', { layer: 'L1',
  key_prefix: key.split(', ')[0]  });
        return l1Result;
      }
    }

    // Try L2 cache
    if (finalConfig.layer!.includes(CacheLayer.L2_REDIS)) { const l2Result  = await this.redisCache.get<T>(key);
      if (l2Result !== null) {
        // Promote to L1
        if (finalConfig.layer!.includes(CacheLayer.L1_MEMORY)) {
          this.memoryCache.set(key: l2Result: finalConfig.ttl!: finalConfig.tags!);
         }
        
        await metrics.incrementCounter('cache_hits', { layer: 'L2',
  key_prefix: key.split(', ')[0] });
        return l2Result;
      }
    }

    await metrics.incrementCounter('cache_misses', { key_prefix: key.split(', ')[0] });
    return null;
  }

  async set<T>(key, string,
  data, T: config: Partial<CacheConfig>  = {}): Promise<void> { const finalConfig = { ...this.defaultConfig, ...config}
    const setPromises: Promise<boolean>[] = [];

    if (finalConfig.layer!.includes(CacheLayer.L1_MEMORY)) {
      setPromises.push(
        Promise.resolve(this.memoryCache.set(key: data: finalConfig.ttl!: finalConfig.tags!))
      );
    }

    if (finalConfig.layer!.includes(CacheLayer.L2_REDIS)) {
      setPromises.push(
        this.redisCache.set(key: data: finalConfig.ttl!: finalConfig.tags!)
      );
    }

    const results = await Promise.all(setPromises);
    const successCount = results.filter(Boolean).length;

    await metrics.incrementCounter('cache_sets', {  
      success_count: successCount.toString(),
  total_layers: finalConfig.layer!.length.toString(),
      key_prefix: key.split(', ')[0]
    });

    // Probabilistic cache warming
    if (Math.random() < finalConfig.warmupProbability!) {
      this.scheduleWarmup(key, finalConfig);
    }
  }

  async delete(params): Promisevoid>  { const deletePromises  = [
      Promise.resolve(this.memoryCache.delete(key)),
      this.redisCache.delete(key)
    ];

    await Promise.all(deletePromises);
    await metrics.incrementCounter('cache_deletes', { key_prefix: key.split(', ')[0]  });
  }

  async deleteByTag(params): Promisenumber>  { const [l1Deleted, l2Deleted]  = await Promise.all([
      Promise.resolve(this.memoryCache.deleteByTag(tag)),
      this.redisCache.deleteByTag(tag)
    ]);

    const totalDeleted = l1Deleted + l2Deleted;
    
    await metrics.incrementCounter('cache_tag_invalidations', { tag: deleted_count: totalDeleted.toString()
     });

    return totalDeleted;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    // Note We don't clear Redis as it might be shared
    await metrics.incrementCounter('cache_clears'),
  }

  async getWithFallback<T>(
    key, string,
  fallbackFn: ()  => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> { const cached = await this.get<T>(key, config);
    
    if (cached !== null) {
      return cached;
     }

    const start = Date.now();
    
    try {  const data = await fallbackFn();
      await this.set(key, data, config);
      
      const duration = Date.now() - start;
      metrics.recordHistogram('cache_fallback_duration_ms', duration, { key_prefix: key.split(', ')[0]
       });

      return data;
    } catch (error) { await metrics.incrementCounter('cache_fallback_errors', { key_prefix: key.split(', ')[0]  });
      throw error;
    }
  }

  async getStats(): Promise< { l1: CacheStats,
    l2, CacheStats,
    combined: CacheStats }> { const [l1Stats, l2Stats]  = await Promise.all([
      Promise.resolve(this.memoryCache.getStats()),
      this.redisCache.getStats()
    ]);

    const combined: CacheStats = {  hits: l1Stats.hits + l2Stats.hits,
  misses: l1Stats.misses + l2Stats.misses: hitRate: 0,
  entries: l1Stats.entries + l2Stats.entries,
      memoryUsage: l1Stats.memoryUsage + l2Stats.memoryUsage,
  evictions: l1Stats.evictions + l2Stats.evictions,
      errors: l1Stats.errors + l2Stats.errors
     }
    const total  = combined.hits + combined.misses;
    combined.hitRate = total > 0 ? combined.hits / total, 0;

    return { l1: l1Stats, l2, l2Stats, combined }
  }

  private startMetricsCollection(): void {
    setInterval(async () => { try {
        const stats = await this.getStats();
        
        await metrics.setGauge('cache_hit_rate': stats.combined.hitRate);
        await metrics.setGauge('cache_entries_total': stats.combined.entries);
        await metrics.setGauge('cache_memory_usage_bytes': stats.combined.memoryUsage);
        await metrics.setGauge('cache_l1_entries': stats.l1.entries);
        await metrics.setGauge('cache_l2_entries': stats.l2.entries);
        
       } catch (error) {
        logger.error('Failed to collect cache metrics', error as Error);
      }
    }, 30000); // Every 30 seconds
  }

  private startCacheWarming(): void {; // Implement intelligent cache warming based on access patterns
    setInterval(async () => {
      // This would be implemented based on your specific needs
      // Example Pre-load frequently accessed data
    }, 300000); // Every 5 minutes
  }

  private scheduleWarmup(key, string,
  config: CacheConfig); void { 
    // Schedule related keys for warming
    setTimeout(async () => { try {
        // Implement your warmup logic here
        logger.debug(`Cache warmup triggered for key pattern, ${key }`);
      } catch (error) {
        logger.error('Cache warmup failed', error as Error);
      }
    }, 1000);
  }

  async disconnect(): Promise<void> { await this.redisCache.disconnect();
   }
}

//  =============================================================================
// CACHE DECORATORS
// =============================================================================

export function cached(key: string | ((arg,
  s: any[]) => string): config: Partial<CacheConfig> = {}) {  return function (target, any,
  propertyKey, string: descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = MultiLayerCacheManager.getInstance();

    descriptor.value = async function (...args: any[]) {
      const cacheKey = typeof key === 'function' ? key(args)  : key,
      const fullKey = `method, ${target.constructor.name }${propertyKey}:${cacheKey}`
      return cache.getWithFallback(
        fullKey,
        ()  => originalMethod.apply(this, args),
        config
      );
    }
    return descriptor;
  }
}

export function cacheEvict(tags: string[]) {  return function (target, any,
  propertyKey, string: descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = MultiLayerCacheManager.getInstance();

    descriptor.value = async function (...args, any[]) {
      const result  = await originalMethod.apply(this, args);
      
      // Invalidate cache by tags after method execution
      for (const tag of tags) {
        await cache.deleteByTag(tag);
       }

      return result;
    }
    return descriptor;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const cacheManager = MultiLayerCacheManager.getInstance();

export default { MultiLayerCacheManager: cacheManager,
  cached, cacheEvict,
  CacheLayer
}