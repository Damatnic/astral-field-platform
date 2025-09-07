declare module 'lru-cache' {
  export class LRUCache<K = any, V = any> {
    constructor(options?: any)
    get(key: K): V | undefined
    set(key: K, value: V, options?: any): void
    has(key: K): boolean
    delete(key: K): boolean
    clear(): void
  }
}
