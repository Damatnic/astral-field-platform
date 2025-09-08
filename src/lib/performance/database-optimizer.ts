/**
 * Database Performance Optimizer
 * Advanced query optimization, connection pooling, and performance monitoring
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { metrics, logger } from './monitoring';
import { cacheManager } from './redis-cache';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  rows: number;
  cached: boolean;
  error?: string;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
  totalCount: number;
}

export interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  activeConnections: number;
  poolStats: ConnectionPoolStats;
  slowQueries: number;
  errors: number;
}

export interface QueryOptimizationHint {
  type: 'index' | 'join' | 'limit' | 'cache' | 'partition';
  suggestion: string;
  impact: 'low' | 'medium' | 'high';
  query: string;
}

export interface QueryCacheConfig {
  ttl: number;
  tags: string[];
  key?: string;
  invalidateOn?: string[];
}

// =============================================================================
// ADVANCED CONNECTION POOL MANAGER
// =============================================================================

class AdvancedConnectionPool {
  private pools: Map<string, Pool> = new Map();
  private readonly defaultPoolConfig = {
    max: 20,                    // Maximum connections
    min: 2,                     // Minimum connections
    idleTimeoutMillis: 30000,   // 30 seconds
    connectionTimeoutMillis: 10000, // 10 seconds
    acquireTimeoutMillis: 60000,    // 60 seconds
    createTimeoutMillis: 8000,      // 8 seconds
    destroyTimeoutMillis: 5000,     // 5 seconds
    createRetryIntervalMillis: 200,  // 200ms
    reapIntervalMillis: 1000,       // 1 second
    fifo: false,                    // LIFO for better cache locality
  };

  private queryStats = new Map<string, QueryMetrics[]>();
  private slowQueries: QueryMetrics[] = [];
  private readonly slowQueryThreshold = 1000; // 1 second

  constructor() {
    this.initializePools();
    this.startHealthMonitoring();
    this.startQueryAnalytics();
  }

  private initializePools(): void {
    // Primary database pool
    this.createPool('primary', {
      connectionString: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
      ...this.defaultPoolConfig,
      max: parseInt(process.env.DB_POOL_MAX || '20'),
    });

    // Read replica pool (if available)
    if (process.env.DATABASE_READ_URL) {
      this.createPool('read', {
        connectionString: process.env.DATABASE_READ_URL,
        ...this.defaultPoolConfig,
        max: parseInt(process.env.DB_READ_POOL_MAX || '15'),
      });
    }

    // Analytics database pool (if available)
    if (process.env.ANALYTICS_DATABASE_URL) {
      this.createPool('analytics', {
        connectionString: process.env.ANALYTICS_DATABASE_URL,
        ...this.defaultPoolConfig,
        max: parseInt(process.env.DB_ANALYTICS_POOL_MAX || '10'),
      });
    }
  }

  private createPool(name: string, config: any): void {
    try {
      const needsSSL = 
        process.env.PGSSLMODE === 'require' ||
        /sslmode=require/i.test(config.connectionString) ||
        !!process.env.NEON_DATABASE_URL ||
        process.env.NODE_ENV === 'production';

      const pool = new Pool({
        ...config,
        ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
      });

      // Pool event handlers
      pool.on('connect', (client) => {
        logger.debug(`Database client connected to pool: ${name}`);
        metrics.incrementCounter('db_connections_created', { pool: name });
      });

      pool.on('acquire', (client) => {
        metrics.incrementCounter('db_connections_acquired', { pool: name });
      });

      pool.on('release', (client) => {
        metrics.incrementCounter('db_connections_released', { pool: name });
      });

      pool.on('remove', (client) => {
        logger.debug(`Database client removed from pool: ${name}`);
        metrics.incrementCounter('db_connections_removed', { pool: name });
      });

      pool.on('error', (err, client) => {
        logger.error(`Database pool error in ${name}:`, err);
        metrics.incrementCounter('db_pool_errors', { pool: name });
      });

      this.pools.set(name, pool);
      logger.info(`Database pool '${name}' initialized successfully`);
    } catch (error) {
      logger.error(`Failed to create database pool '${name}':`, error as Error);
      throw error;
    }
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
    poolName: string = 'primary',
    cacheConfig?: QueryCacheConfig
  ): Promise<QueryResult<T>> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Database pool '${poolName}' not found`);
    }

    const queryId = this.generateQueryId(text, params);
    const startTime = Date.now();
    let cached = false;
    let result: QueryResult<T>;

    try {
      // Check cache first if configured
      if (cacheConfig && this.isReadQuery(text)) {
        const cacheKey = cacheConfig.key || `query:${queryId}`;
        const cachedResult = await cacheManager.get<QueryResult<T>>(cacheKey);
        
        if (cachedResult) {
          cached = true;
          result = cachedResult;
          
          this.recordQueryMetrics({
            query: this.sanitizeQuery(text),
            duration: Date.now() - startTime,
            timestamp: new Date(),
            success: true,
            rows: result.rows.length,
            cached: true
          });

          await metrics.incrementCounter('db_cache_hits', { pool: poolName });
          return result;
        }
      }

      // Execute query
      result = await pool.query<T>(text, params);

      // Cache result if configured and successful
      if (cacheConfig && this.isReadQuery(text) && result.rows.length > 0) {
        const cacheKey = cacheConfig.key || `query:${queryId}`;
        await cacheManager.set(cacheKey, result, {
          ttl: cacheConfig.ttl,
          tags: cacheConfig.tags
        });
      }

      const duration = Date.now() - startTime;

      // Record metrics
      this.recordQueryMetrics({
        query: this.sanitizeQuery(text),
        duration,
        timestamp: new Date(),
        success: true,
        rows: result.rows.length,
        cached: false
      });

      // Track slow queries
      if (duration > this.slowQueryThreshold) {
        this.recordSlowQuery({
          query: this.sanitizeQuery(text),
          duration,
          timestamp: new Date(),
          success: true,
          rows: result.rows.length,
          cached: false
        });
      }

      await metrics.incrementCounter('db_queries_total', { 
        pool: poolName, 
        success: 'true',
        cached: cached.toString()
      });
      
      metrics.recordHistogram('db_query_duration_ms', duration, { 
        pool: poolName,
        query_type: this.getQueryType(text)
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordQueryMetrics({
        query: this.sanitizeQuery(text),
        duration,
        timestamp: new Date(),
        success: false,
        rows: 0,
        cached: false,
        error: (error as Error).message
      });

      await metrics.incrementCounter('db_queries_total', { 
        pool: poolName, 
        success: 'false' 
      });
      
      logger.error(`Database query failed in pool '${poolName}':`, error as Error, {
        query: this.sanitizeQuery(text),
        params: params?.length || 0,
        duration
      });

      throw error;
    }
  }

  async transaction<T>(
    fn: (client: PoolClient) => Promise<T>,
    poolName: string = 'primary'
  ): Promise<T> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Database pool '${poolName}' not found`);
    }

    const client = await pool.connect();
    const startTime = Date.now();

    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');

      const duration = Date.now() - startTime;
      
      await metrics.incrementCounter('db_transactions_total', { 
        pool: poolName, 
        success: 'true' 
      });
      
      metrics.recordHistogram('db_transaction_duration_ms', duration, { 
        pool: poolName 
      });

      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logger.error('Transaction rollback failed:', rollbackError as Error);
      }

      const duration = Date.now() - startTime;
      
      await metrics.incrementCounter('db_transactions_total', { 
        pool: poolName, 
        success: 'false' 
      });
      
      logger.error(`Database transaction failed in pool '${poolName}':`, error as Error, {
        duration
      });

      throw error;
    } finally {
      client.release();
    }
  }

  async getPoolStats(poolName: string = 'primary'): Promise<ConnectionPoolStats> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Database pool '${poolName}' not found`);
    }

    return {
      totalConnections: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount,
      totalCount: pool.totalCount
    };
  }

  async healthCheck(poolName: string = 'primary'): Promise<DatabaseHealth> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      return {
        status: 'unhealthy',
        responseTime: 0,
        activeConnections: 0,
        poolStats: { totalConnections: 0, idleConnections: 0, waitingClients: 0, totalCount: 0 },
        slowQueries: 0,
        errors: 0
      };
    }

    try {
      const start = Date.now();
      await pool.query('SELECT 1 as health_check');
      const responseTime = Date.now() - start;
      
      const poolStats = await this.getPoolStats(poolName);
      
      // Calculate health status based on response time and connections
      let status: DatabaseHealth['status'] = 'healthy';
      if (responseTime > 5000 || poolStats.waitingClients > 10) {
        status = 'unhealthy';
      } else if (responseTime > 1000 || poolStats.waitingClients > 5) {
        status = 'degraded';
      }

      return {
        status,
        responseTime,
        activeConnections: poolStats.totalConnections - poolStats.idleConnections,
        poolStats,
        slowQueries: this.slowQueries.length,
        errors: this.getErrorCount()
      };
    } catch (error) {
      logger.error(`Health check failed for pool '${poolName}':`, error as Error);
      
      return {
        status: 'unhealthy',
        responseTime: 0,
        activeConnections: 0,
        poolStats: await this.getPoolStats(poolName),
        slowQueries: this.slowQueries.length,
        errors: this.getErrorCount()
      };
    }
  }

  getOptimizationHints(): QueryOptimizationHint[] {
    const hints: QueryOptimizationHint[] = [];

    // Analyze slow queries
    for (const slowQuery of this.slowQueries.slice(-50)) { // Last 50 slow queries
      if (slowQuery.query.toLowerCase().includes('select') && !slowQuery.query.toLowerCase().includes('limit')) {
        hints.push({
          type: 'limit',
          suggestion: 'Consider adding LIMIT clause to prevent large result sets',
          impact: 'medium',
          query: slowQuery.query
        });
      }

      if (slowQuery.query.toLowerCase().includes('join') && slowQuery.duration > 5000) {
        hints.push({
          type: 'index',
          suggestion: 'Slow JOIN detected - check if proper indexes exist on join columns',
          impact: 'high',
          query: slowQuery.query
        });
      }

      if (slowQuery.query.toLowerCase().includes('where') && !slowQuery.cached) {
        hints.push({
          type: 'cache',
          suggestion: 'Frequently executed query - consider caching',
          impact: 'medium',
          query: slowQuery.query
        });
      }
    }

    return hints;
  }

  private recordQueryMetrics(metrics: QueryMetrics): void {
    const queryHash = this.hashQuery(metrics.query);
    const existing = this.queryStats.get(queryHash) || [];
    
    existing.push(metrics);
    
    // Keep only last 1000 executions per query
    if (existing.length > 1000) {
      existing.shift();
    }
    
    this.queryStats.set(queryHash, existing);
  }

  private recordSlowQuery(metrics: QueryMetrics): void {
    this.slowQueries.push(metrics);
    
    // Keep only last 100 slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries.shift();
    }

    logger.warn('Slow query detected', {
      query: metrics.query,
      duration: metrics.duration,
      rows: metrics.rows
    });
  }

  private generateQueryId(text: string, params?: any[]): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return this.hashQuery(`${text}${paramStr}`);
  }

  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data and normalize for logging
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim()
      .substring(0, 500);     // Limit length
  }

  private isReadQuery(query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery.startsWith('select') || 
           normalizedQuery.startsWith('with');
  }

  private getQueryType(query: string): string {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.startsWith('select')) return 'select';
    if (normalizedQuery.startsWith('insert')) return 'insert';
    if (normalizedQuery.startsWith('update')) return 'update';
    if (normalizedQuery.startsWith('delete')) return 'delete';
    if (normalizedQuery.startsWith('create')) return 'create';
    if (normalizedQuery.startsWith('alter')) return 'alter';
    if (normalizedQuery.startsWith('drop')) return 'drop';
    return 'other';
  }

  private getErrorCount(): number {
    let errors = 0;
    for (const metrics of this.queryStats.values()) {
      errors += metrics.filter(m => !m.success).length;
    }
    return errors;
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const [name, pool] of this.pools) {
        try {
          const health = await this.healthCheck(name);
          
          await metrics.setGauge('db_health_response_time_ms', health.responseTime, { pool: name });
          await metrics.setGauge('db_active_connections', health.activeConnections, { pool: name });
          await metrics.setGauge('db_pool_total_connections', health.poolStats.totalConnections, { pool: name });
          await metrics.setGauge('db_pool_idle_connections', health.poolStats.idleConnections, { pool: name });
          await metrics.setGauge('db_pool_waiting_clients', health.poolStats.waitingClients, { pool: name });
          await metrics.setGauge('db_slow_queries_count', health.slowQueries, { pool: name });
          
        } catch (error) {
          logger.error(`Failed to collect health metrics for pool ${name}:`, error as Error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  private startQueryAnalytics(): void {
    setInterval(() => {
      try {
        // Calculate query statistics
        let totalQueries = 0;
        let slowQueries = 0;
        let avgDuration = 0;
        let totalDuration = 0;

        for (const metrics of this.queryStats.values()) {
          for (const metric of metrics) {
            totalQueries++;
            totalDuration += metric.duration;
            
            if (metric.duration > this.slowQueryThreshold) {
              slowQueries++;
            }
          }
        }

        if (totalQueries > 0) {
          avgDuration = totalDuration / totalQueries;
        }

        logger.info('Query analytics', {
          totalQueries,
          slowQueries,
          avgDuration: Math.round(avgDuration),
          slowQueryRate: totalQueries > 0 ? (slowQueries / totalQueries) : 0
        });

      } catch (error) {
        logger.error('Failed to generate query analytics:', error as Error);
      }
    }, 300000); // Every 5 minutes
  }

  async close(): Promise<void> {
    const closePromises = Array.from(this.pools.values()).map(pool => pool.end());
    await Promise.all(closePromises);
    this.pools.clear();
  }
}

// =============================================================================
// DATABASE OPTIMIZER
// =============================================================================

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private connectionPool: AdvancedConnectionPool;

  private constructor() {
    this.connectionPool = new AdvancedConnectionPool();
  }

  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  // Optimized query execution with automatic caching
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
    options: {
      pool?: string;
      cache?: QueryCacheConfig;
      timeout?: number;
    } = {}
  ): Promise<QueryResult<T>> {
    const { pool = 'primary', cache, timeout = 30000 } = options;

    // Add query timeout
    return Promise.race([
      this.connectionPool.query<T>(text, params, pool, cache),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      )
    ]);
  }

  // Optimized transaction with retry logic
  async transaction<T>(
    fn: (client: PoolClient) => Promise<T>,
    options: {
      pool?: string;
      retries?: number;
      retryDelay?: number;
    } = {}
  ): Promise<T> {
    const { pool = 'primary', retries = 3, retryDelay = 1000 } = options;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.connectionPool.transaction(fn, pool);
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        const isRetryable = this.isRetryableError(error as Error);
        if (!isRetryable) {
          throw error;
        }

        logger.warn(`Transaction attempt ${attempt} failed, retrying...`, {
          error: (error as Error).message,
          attempt,
          pool
        });

        await this.delay(retryDelay * attempt);
      }
    }

    throw new Error('Transaction failed after all retries');
  }

  // Batch operations for improved performance
  async batchInsert<T>(
    table: string,
    columns: string[],
    values: T[][],
    options: {
      batchSize?: number;
      onConflict?: string;
      pool?: string;
    } = {}
  ): Promise<number> {
    const { batchSize = 1000, onConflict, pool = 'primary' } = options;
    
    let totalInserted = 0;
    
    for (let i = 0; i < values.length; i += batchSize) {
      const batch = values.slice(i, i + batchSize);
      
      const placeholders = batch.map((_, rowIndex) => 
        `(${columns.map((_, colIndex) => 
          `$${rowIndex * columns.length + colIndex + 1}`
        ).join(', ')})`
      ).join(', ');
      
      const flatValues = batch.flat();
      
      let query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
      
      if (onConflict) {
        query += ` ${onConflict}`;
      }
      
      const result = await this.query(query, flatValues, { pool });
      totalInserted += result.rowCount || 0;
    }
    
    return totalInserted;
  }

  // Optimized pagination
  async paginate<T extends QueryResultRow = any>(
    baseQuery: string,
    params: any[],
    options: {
      page?: number;
      limit?: number;
      orderBy?: string;
      pool?: string;
      cache?: QueryCacheConfig;
    } = {}
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const { 
      page = 1, 
      limit = 50, 
      orderBy = 'id ASC', 
      pool = 'primary',
      cache 
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Count total records
    const countQuery = baseQuery.replace(
      /^SELECT.*?FROM/i, 
      'SELECT COUNT(*) as total FROM'
    ).replace(/ORDER BY.*$/i, '');
    
    const [dataResult, countResult] = await Promise.all([
      this.query<T>(
        `${baseQuery} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
        { pool, cache }
      ),
      this.query<{ total: string }>(countQuery, params, { pool, cache })
    ]);
    
    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  async getHealth(): Promise<DatabaseHealth> {
    return this.connectionPool.healthCheck();
  }

  getOptimizationHints(): QueryOptimizationHint[] {
    return this.connectionPool.getOptimizationHints();
  }

  async getPoolStats(pool: string = 'primary'): Promise<ConnectionPoolStats> {
    return this.connectionPool.getPoolStats(pool);
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'connection terminated',
      'connection reset',
      'timeout expired',
      'server closed the connection unexpectedly',
      'connection to server lost'
    ];
    
    return retryableErrors.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    await this.connectionPool.close();
  }
}

// =============================================================================
// DECORATORS
// =============================================================================

export function dbCache(config: QueryCacheConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // This would integrate with the caching system
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

export function dbMonitor(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        
        metrics.recordHistogram('db_operation_duration_ms', duration, {
          operation,
          success: 'true'
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        metrics.recordHistogram('db_operation_duration_ms', duration, {
          operation,
          success: 'false'
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const db = DatabaseOptimizer.getInstance();

export default {
  DatabaseOptimizer,
  db,
  dbCache,
  dbMonitor
};