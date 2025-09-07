import type { Redis } from 'ioredis'

interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheManager {
  get<T = any>(key: string): Promise<T | null>
  set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
  health(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>
}

class InMemoryCacheManager implements CacheManager {
  private cache = new Map<string, CacheItem>()
  private readonly defaultTTL = 300 // 5 minutes

  async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if item has expired
    const now = Date.now()
    if (now > item.timestamp + (item.ttl * 1000)) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  async set<T = any>(key: string, value: T, ttlSeconds = this.defaultTTL): Promise<void> {
    const item: CacheItem<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds
    }
    this.cache.set(key, item)
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async health(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    return {
      status: 'healthy',
      details: {
        type: 'in-memory',
        size: this.cache.size,
        maxSize: 1000
      }
    }
  }

  // Clean up expired items periodically
  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + (item.ttl * 1000)) {
        this.cache.delete(key)
      }
    }
  }

  constructor() {
    // Run cleanup every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }
}

class RedisCacheManager implements CacheManager {
  private redis: Redis
  private readonly defaultTTL = 300

  constructor(redis: Redis) {
    this.redis = redis
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set<T = any>(key: string, value: T, ttlSeconds = this.defaultTTL): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      await this.redis.setex(key, ttlSeconds, serialized)
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key)
      return result > 0
    } catch (error) {
      console.error('Redis delete error:', error)
      return false
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb()
    } catch (error) {
      console.error('Redis clear error:', error)
    }
  }

  async health(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      await this.redis.ping()
      const info = await this.redis.info('memory')
      return {
        status: 'healthy',
        details: {
          type: 'redis',
          info: info.split('\n').slice(0, 5).join('\n')
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          type: 'redis',
          error: (error as Error).message
        }
      }
    }
  }
}

// Factory function to create appropriate cache manager
function createCacheManager(): CacheManager {
  // Check for Redis configuration
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL

  if (redisUrl) {
    try {
      // Dynamic import to avoid loading Redis in environments where it's not needed
      const Redis = require('ioredis')
      const redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })

      return new RedisCacheManager(redis)
    } catch (error) {
      console.warn('Redis not available, falling back to in-memory cache:', error)
    }
  }

  return new InMemoryCacheManager()
}

// Singleton instance
let cacheInstance: CacheManager | null = null

export function getCacheManager(): CacheManager {
  if (!cacheInstance) {
    cacheInstance = createCacheManager()
  }
  return cacheInstance
}

// Utility functions for common cache operations
export class CacheHelper {
  private cache: CacheManager

  constructor(cache: CacheManager = getCacheManager()) {
    this.cache = cache
  }

  // Generate cache key for analytics endpoints
  generateAnalyticsKey(endpoint: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    return `analytics:${endpoint}:${sortedParams}`
  }

  // Cache with automatic key generation
  async cacheAnalytics<T>(
    endpoint: string,
    params: Record<string, any>,
    data: T,
    ttlSeconds = 300
  ): Promise<void> {
    const key = this.generateAnalyticsKey(endpoint, params)
    await this.cache.set(key, data, ttlSeconds)
  }

  // Retrieve cached analytics data
  async getCachedAnalytics<T>(
    endpoint: string, 
    params: Record<string, any>
  ): Promise<T | null> {
    const key = this.generateAnalyticsKey(endpoint, params)
    return await this.cache.get<T>(key)
  }

  // Cache wrapper function for analytics endpoints
  async wrapWithCache<T>(
    endpoint: string,
    params: Record<string, any>,
    fetchFunction: () => Promise<T>,
    ttlSeconds = 300
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.getCachedAnalytics<T>(endpoint, params)
    if (cached !== null) {
      return cached
    }

    // Not in cache, fetch data
    const data = await fetchFunction()
    
    // Cache the result
    await this.cacheAnalytics(endpoint, params, data, ttlSeconds)
    
    return data
  }

  // Health check
  async health() {
    return await this.cache.health()
  }
}

// Default export
export default getCacheManager