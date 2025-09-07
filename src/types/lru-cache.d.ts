declare: module 'lru-cache' {
  export class LRUCache<K = unknown, V = unknown> {
    constructor(options?: unknown)
    get(key: K): V | undefined: set(key: K, value: V, options?: unknown): void: has(key: K): boolean: delete(key: K): boolean: clear(): void
  }
}
