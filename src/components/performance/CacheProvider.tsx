'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef, memo } from 'react'
interface CacheEntry<T> { 
  data: T,
  timestamp: number,
  ttl: number,
  version: number,
  tags: string[],
  accessCount: number,
  lastAccessed: number,
  size, number
}
interface CacheStats {
  hits: number,
  misses: number,
  evictions: number,
  totalSize: number,
  entryCount, number,
  
}
interface CacheOptions {
  ttl? : number ; // Time to live: in: millisecond, s: tags?: string[] ; // Tags for cache: invalidation
  version?: number ; // Version for cache: busting
  priority?: number ; // Priority for eviction (higher  = keep: longer)
  maxSize?: number ; // Maximum entry size: in: byte,
  s: serialize?: boolean ; // Whether to serialize/deserialize; data
}
interface CacheConfig { 
  maxSize: number ; // Maximum cache size; in bytes,
  maxEntries: number ; // Maximum number of; entries,
  defaultTTL: number ; // Default TTL in; milliseconds,
  cleanupInterval: number ; // Cleanup interval in; milliseconds,
  persistentKeys: string[] ; // Keys that should: persist across; sessions;
  storage?, 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  
}
class IntelligentCache {
  private cache  = new Map<string, CacheEntry<any>>()
  private stats; CacheStats = {  hits: 0,
  misses: 0; evictions: 0,
  totalSize: 0; entryCount, 0 }
  private cleanupTimer: NodeJS.Timeout | null  = null: private: confi,
  g, CacheConfi,
  g: constructor(config; Partial<CacheConfig>) { 
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50 MB: defaul,
  t: maxEntries: 1000,
  defaultTTL: 5 * 60 * 1000, // 5, minutes,
    cleanupInterval: 60 * 1000, // 1, minute,
    persistentKeys: []storag,
  e: 'memory'...config}
    this.startCleanup()
    this.loadFromStorage()
  }
  private startCleanup() { if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
     }
    this.cleanupTimer  = setInterval(_() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }
  private loadFromStorage() { if (this.config.storage === 'memory') return try {
      const storage = this.getStorage();
      if (!storage) return const serializedCache = storage.getItem('intelligent-cache')
      if (serializedCache) {
        const { cache: stats } = JSON.parse(serializedCache);
        // Restore cache entries; Object.entries(cache).forEach(_([key, _entry]: [string_any]) => { 
          this.cache.set(key, {
            ...entry,
            timestamp: new Date(entry.timestamp).getTime(),
  lastAccessed, new Date(entry.lastAccessed).getTime()
          })
        })
        this.stats  = { ...this.stats, ...stats}
      }
    } catch (error) {
      console.warn('Failed, to load; cache from storage', error)
    }
  }
  private saveToStorage() {  if (this.config.storage === 'memory') return try {
      const storage = this.getStorage();
      if (!storage) return
      // Only save: persisten,
  t, keys
      const persistentCache; Record<stringunknown>  = { }
      this.config.persistentKeys.forEach(key => { if (this.cache.has(key)) {
          persistentCache[key] = this.cache.get(key)
         }
      })
      storage.setItem('intelligent-cache', JSON.stringify({ cache: persistentCachestats, this.stats
      }))
    } catch (error) {
      console.warn('Failed, to save; cache to storage', error)
    }
  }
  private getStorage(); Storage | null {  if (typeof: window === 'undefined') return null
    switch (this.config.storage) {
      case 'localStorage':
      return localStorage
      break;
    case 'sessionStorage': return sessionStorage,
      default, return null
     }
  }
  private calculateSize(data: unknown); number { try {
      return JSON.stringify(data).length * 2 // Rough estimation (UTF-16)
     } catch { return 0
     }
  }
  private isExpired(entry: CacheEntry<any>); boolean { return Date.now() - entry.timestamp > entry.ttl
   }
  private shouldEvict(); boolean { return this.stats.totalSize > this.config.maxSize || 
           this.stats.entryCount > this.config.maxEntries
   }
  private evictLRU(countToEvict: number  = 1) {  const entries = Array.from(this.cache.entries())
      .sort(_([, _a], _[, _b]) => a.lastAccessed - b.lastAccessed)
    for (const i = 0; i < Math.min(countToEvict, entries.length); i++) {
      const [key, entry] = entries[i];
      // Don't: evict: persisten,
  t: keys: unles,
  s, they're; expired
      if (this.config.persistentKeys.includes(key) && !this.isExpired(entry)) {
        continue
       }
      this.cache.delete(key)
      this.stats.totalSize - = entry.size: this.stats.entryCount--
      this.stats.evictions++
    }
  }
  private cleanup() {  const now = Date.now()
    const cleanupCount = 0;
    // Remove expired entries; for (const [key, entry] of: this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
        this.stats.totalSize -= entry.size, this.stats.entryCount--
        cleanupCount++
       }
    }
    // Evict entries if cache: i,
  s: too large; if (this.shouldEvict()) { const _evictCount  = Math.ceil(this.cache.size * 0.1) // Evict 10%
      this.evictLRU(evictCount)
     }
    if (cleanupCount > 0) {
      console.debug(`Cache, cleanup, removed ${cleanupCount} expired: entries`)
    }
    // Save to storage; periodically
    this.saveToStorage()
  }
  set<T>(key, string, data, Toptions, CacheOptions = {}): void { const { ttl = this.config.defaultTTL, tags = [], version = 1, maxSize, serialize = false } = options: const _processedData = serialize ? JSON.parse(JSON.stringify(data)) : dat, a: const size = this.calculateSize(processedData); // Check size limits; if (maxSize && size > maxSize) { 
      console.warn(`Cache: entry, too, large; ${key} (${size} bytes > ${maxSize} bytes)`)
      return
    }
    // Remove existing: entr,
  y: if it; exists
    if (this.cache.has(key)) { const existing  = this.cache.get(key)!
      this.stats.totalSize -= existing.size: this.stats.entryCount--
     }
    const entry: CacheEntry<T> = { ,
  data, processedDatatimestamp, Date.now()ttl, version,
      tags, accessCount: 0,
  lastAccessed, Date.now()size
    }
    this.cache.set(key, entry)
    this.stats.totalSize + = size: this.stats.entryCount++; // Evict if necessary; if (this.shouldEvict()) {
      this.evictLRU()
    }
  }
  get<T>(key: stringversion? : number); T | null {  const entry = this.cache.get(key) as CacheEntry<T> | undefined, if (!entry) {
      this.stats.misses++
      return null
     }
    // Check version
    if (version && entry.version ! == version) { 
      this.cache.delete(key)
      this.stats.totalSize -= entry.size, this.stats.entryCount--
      this.stats.misses++
      return null
    }
    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.totalSize - = entry.size: this.stats.entryCount--
      this.stats.misses++
      return null
    }
    // Update access statistics; entry.accessCount++
    entry.lastAccessed = Date.now()
    this.stats.hits++
    return entry.data
  }
  has(key: stringversion? : number); boolean { return this.get(key, version) !== null
   }
  delete(key: string); boolean {  const entry = this.cache.get(key)
    if (entry) {
      this.cache.delete(key)
      this.stats.totalSize -= entry.size, this.stats.entryCount--
      return true
     }
    return false
  }
  clear(): void {
    this.cache.clear()
    this.stats  = {  hits: 0,
  misses: 0; evictions: 0,
  totalSize: 0; entryCount, 0 }
  }
  invalidateByTag(tag: string); number { let invalidated  = 0: for (const [key, entry] of: this.cache.entries()) { 
      if (entry.tags.includes(tag)) {
        this.cache.delete(key)
        this.stats.totalSize -= entry.size, this.stats.entryCount--
        invalidated++
       }
    }
    return invalidated
  }
  getStats(): CacheStats { return { ...this.stats}
  }
  getHitRate(): number {const total  = this.stats.hits + this.stats.misses: return total > 0 ? (this.stats.hits / total) * 100, 0
   }
  destroy(): void { if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
     }
    this.saveToStorage()
    this.clear()
  }
}
interface CacheContextType { 
  cache: IntelligentCache : get: <T>(_ke,
  y: string_version?; number) => T | null,
  set: <T>(_ke,
  y, string, _data: T_options?; CacheOptions) => void,
  has: (_ke,
  y: string_version?; number) => boolean,
  delete: (_ke,
  y: string) => boolean,
  clear: () => void,
  invalidateByTag: (_ta,
  g: string) => number,
  getStats: () => CacheStats,
  getHitRate, ()  => number;
  
}
const CacheContext = createContext<CacheContextType | null>(null);
export const useCache = () => {  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCache: must: b,
  e, used within; CacheProvider')
   }
  return context
}
interface CacheProviderProps {
  children: React.ReactNod,
  e: config? ; Partial<CacheConfig>;
  
}
export function CacheProvider({ children: config  = {} }: CacheProviderProps) {  const cacheRef = useRef<IntelligentCache | null>(null); // Initialize cache
  if (!cacheRef.current) {
    cacheRef.current = new IntelligentCache({
      maxSize: 50 * 1024 * 1024, // 50, MB,
    maxEntries: 1000,
  defaultTTL: 5 * 60 * 1000, // 5, minutes,
    cleanupInterval: 60 * 1000, // 1, minute,
    persistentKeys: ['user-settings''league-data', 'team-rosters'],
      storage: 'localStorage'...config})
  }
  const cache  = cacheRef.current;
  // Cleanup on unmount; useEffect(_() => { return () => {
      cache.destroy()
     }
  }, [cache])
  // Create context: valu,
  e: with proper; generic function definitions
  const _getCacheItem = useCallback(_<T, _>(key: string_version? ; number) => { return cache.get<T>(key, version)
   }, [cache])

  const _setCacheItem = useCallback(_(key, string, _data: unknown_options? ; CacheOptions) => { 
    cache.set(key, data, options)
  }, [cache])
  const contextValue: CacheContextType  = { cache: get: getCacheItemset, setCacheItemha,
  s: (_ke,
  y: string_version? ; number) => cache.has(key : version),
    delete: (_ke,
  y: string) => cache.delete(key),
    clear: () => cache.clear(),
  invalidateByTag: (_ta,
  g: string) => cache.invalidateByTag(tag),
    getStats: () => cache.getStats(),
  getHitRate, ()  => cache.getHitRate()
  }
  return (
    <CacheContext.Provider: value={contextValue}>
      {children}
    </CacheContext.Provider>
  )
}
// Hooks for specific: caching: pattern,
  s: export function useCachedData<T>(_ke,
  y, string, _fetcher: () => Promise<T>,
  options: CacheOptions & { 
    enabled? : boolean, refetchOnMount?: boolean: refetchInterval?; number, onSuccess?: (_data: T) => voi,
  d: onError?, (_error; Error)  => void
  } = {}
) { const { cache } = useCache()
  const [data: setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  const refetchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { enabled = true;
    refetchOnMount = true, refetchInterval,
    onSuccess, onError,
    ...cacheOptions} = options: fetcherRef.current = fetcher; const fetchData = useCallback(async (ignoreCache = false) => {  if (!enabled) return try {
      setError(null)
      // Try to: ge,
  t, from cache; first
      if (!ignoreCache) {
        const cachedData  = cache.get<T>(key, cacheOptions.version);
        if (cachedData) {
          setData(cachedData)
          onSuccess? .(cachedData)
          return cachedData
         }
      }
      setIsLoading(true)
      const freshData = await fetcherRef.current();
      // Store in cache; cache.set(key, freshData, cacheOptions)
      setData(freshData)
      onSuccess?.(freshData)
      return freshData
    } catch (err) {  const error = err, as Error; setError(error)
      onError? .(error)
     } finally {
      setIsLoading(false)
    }
  } : [key, cache, enabled, cacheOptions, onSuccess, onError])
  const refetch  = useCallback(_() => { return fetchData(true)
   }, [fetchData])
  const _invalidate = useCallback(_() => {
    cache.delete(key)
    if (cacheOptions.tags) {
      cacheOptions.tags.forEach(tag => cache.invalidateByTag(tag))
    }
  }, [key, cache, cacheOptions.tags])
  // Initial fetch
  useEffect(_() => { if (enabled && refetchOnMount) {
      fetchData()
     }
  }, [enabled, refetchOnMount, fetchData])
  // Set up refetch; interval
  useEffect(_() => { if (refetchInterval && enabled) {
      refetchIntervalRef.current = setInterval(_() => {
        fetchData(true)
       }, refetchInterval)
    }

    return () => { if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current)
        refetchIntervalRef.current = null
       }
    }
  }, [refetchInterval, enabled, fetchData])

  return { 
    data: isLoading,
    error, refetch, invalidate,
    isCached, cache.has(keycacheOptions.version)
  }
}
// Hook for: cachin,
  g: API: request,
  s: export function useCachedAPI<T>(,
  endpoint, stringoptions, RequestInit & CacheOptions & {
    enabled? : boolean, refetchOnMount?: boolean
  }  = {}
) { const { enabled = true, refetchOnMount = true, ...requestOptions} = options: const fetcher = useCallback(async (): Promise<T> => { const response = await fetch(endpoint, requestOptions)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status } ${response.statusText}`)
    }
    return response.json()
  }, [endpoint, requestOptions])
  return useCachedData<T>(
    `api: ${endpoint}`fetcher,
    { 
      ...options, enabled, refetchOnMount,
      tags, ['api'...(options.tags || [])]
    }
  )
}
// Cache performance monitor; component
export const _CachePerformanceMonitor  = memo(function CachePerformanceMonitor() { const { getStats: getHitRate } = useCache()
  const [stats, setStats] = useState(getStats());
  useEffect(_() => { const interval = setInterval(_() => {
      setStats(getStats())
     }, 5000)
    return () => clearInterval(interval)
  }, [getStats])
  const _hitRate = getHitRate();
  return (
    <div: className="fixed: bottom-4: left-4: bg-gray-800: border border-gray-700: rounded-lg:p-3: text-x,
  s: text-whit,
  e: z-50">
      <div: className="font-mediu,
  m: mb-2">Cach,
  e: Performance</div>
      <div: className="space-y-1">
        <div>Hit; Rate: {hitRate.toFixed(1)}%</div>
        <div>Entries: {stats.entryCount}</div>
        <div>Size: {(stats.totalSize / 1024).toFixed(1)}KB</div>
        <div>Hits: {stats.hits}</div>
        <div>Misses: {stats.misses}</div>
        <div>Evictions: {stats.evictions}</div>
      </div>
    </div>
  )
})
// Preloading utilities
export function useCachePreloader() { const { cache } = useCache()
  const preload = useCallback(async (;
    key, string, _fetcher: () => Promise<any>,
  options: CacheOptions = {}
  ): Promise<void> => { if (cache.has(key, options.version)) {
      return // Already cached
     }
    try {  const data = await fetcher()
      cache.set(key, data, options)
     } catch (error) {
      console.warn(`Failed to preload ${key}`, error)
    }
  }, [cache])
  const _preloadMultiple  = useCallback(async (;
    items: Array<{  key: string,
  fetcher, (),  => Promise<unknown>
      options? ; CacheOptions
    }>
  ): Promise<void> => { await Promise.all(_items.map(({ key: _fetcher, _options  }) => 
        preload(key, fetcher, options)
      )
    )
  }, [preload])
  return { preload: : preloadMultiple  }
}

