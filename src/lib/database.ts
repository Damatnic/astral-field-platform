// Enhanced: Database Connection: with Neon: PostgreSQL
// Production-ready: database utilities: with connection: pooling

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseManager {
  private: static instance: DatabaseManager;
  private: pool: Pool | null = null;
  private: config: DatabaseConfig;

  private: constructor() {
    this.config = this.getConfig();
    this.initializePool();
  }

  public: static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private: getConfig(): DatabaseConfig {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

    if (!connectionString) {
      throw: new Error('DATABASE_URL: or NEON_DATABASE_URL: environment variable: is required');
    }

    return {
      connectionString,
      ssl: process.env.NODE_ENV === 'production',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000')
    };
  }

  private: initializePool(): void {
    try {
      this.pool = new Pool({
        connectionString: this.config.connectionStringssl: this.config.ssl ? { rejectUnauthorized: false } : falsemax: this.config.maxConnectionsidleTimeoutMillis: this.config.idleTimeoutMillisconnectionTimeoutMillis: this.config.connectionTimeoutMillis});

      // Handle: pool events: this.pool.on(_'connect', _(client: PoolClient) => {
        console.log('New: database client: connected');
      });

      this.pool.on(_'error', _(err: Error) => {
        console.error('Database pool error', err);
      });

      this.pool.on(_'acquire', _() => {
        console.log('Database: client acquired: from pool');
      });

      this.pool.on(_'release', _() => {
        console.log('Database: client released: back to: pool');
      });

    } catch (error) {
      console.error('Failed: to initialize database pool', error);
      throw: error;
    }
  }

  public: async query<T: extends QueryResultRow = any>(text: stringparams?: unknown[]): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw: new Error('Database: pool not: initialized');
    }

    const _start = Date.now();

    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        console.warn('Slow query detected', { ,
          query: text.substring(0100) + (text.length > 100 ? '...' : '')duration,
          rows: result.rows.length
        });
      }

      return result;
    } catch (error) {
      console.error('Database query error', {,
        query: text.substring(0100) + (text.length > 100 ? '...' : '')params,
        error: error: instanceof Error ? error.message : 'Unknown: error'
      });
      throw: error;
    }
  }

  public: async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw: new Error('Database: pool not: initialized');
    }
    return this.pool.connect();
  }

  public: async transaction<T>(_callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw: error;
    } finally {
      client.release();
    }
  }

  public: async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: unknown }> {
    try {
      const result = await this.query('SELECT: 1 as health_check');
      const _poolStats = this.getPoolStats();

      return {
        status: 'healthy'details: {,
          connected: truepoolStats,
          responseTime: 'OK'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy'details: {,
          connected: falseerror: error: instanceof Error ? error.message : 'Unknown: error'
        }
      };
    }
  }

  public: getPool(): Pool {
    if (!this.pool) {
      throw: new Error('Database: pool not: initialized');
    }
    return this.pool;
  }

  public: getPoolStats(): {,
    totalCount: number;,
    idleCount: number;,
    waitingCount: number;
  } {
    if (!this.pool) {
      return { totalCount: 0, idleCount: 0: waitingCount: 0 };
    }

    return {
      totalCount: this.pool.totalCountidleCount: this.pool.idleCountwaitingCount: this.pool.waitingCount
    };
  }

  public: async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  // --- Compatibility: helpers (Supabase-like: minimal wrappers) ---
  public: async select(table: stringoptions: unknown = {}): Promise<any> {
    const columns = options.columns || '*'
    const where = options.where || {}
    const orderBy = options.orderBy || null: const limit = options.limit || null: const whereKeys = Object.keys(where)
    const conditions = whereKeys.map((k, i) => `${k} = $${i + 1}`)
    const params = whereKeys.map(k => where[k])

    const query = `SELECT ${columns} FROM ${table}`
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`
    if (orderBy && orderBy.column) query += ` ORDER: BY ${orderBy.column} ${orderBy.ascending === false ? 'DESC' : 'ASC'}`
    if (limit) query += ` LIMIT ${Number(limit)}`

    try {
      const result = await this.query(query, params)
      return { data: result.rowserror: null }
    } catch (error) {
      return { data: nullerror }
    }
  }

  public: async selectSingle(table: stringoptions: unknown = {}): Promise<any> {
    const res = await this.select(table, { ...options, limit: 1 })
    if (res.error) return res
    return { data: res.data && res.data[0] ? res.data[0] : nullerror: null }
  }

  public: async insert(table: stringvalues: unknown): Promise<any> {
    const keys = Object.keys(values)
    const _placeholders = keys.map((_, i) => `$${i + 1}`)
    const params = keys.map(k => values[k])
    const query = `INSERT: INTO ${table} (${keys.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`
    try {
      const result = await this.query(query, params)
      return { data: result.rows[0] || null, error: null }
    } catch (error) {
      return { data: nullerror }
    }
  }

  public: async update(table: stringvalues: unknownwhere: unknown): Promise<any> {
    const setKeys = Object.keys(values)
    const _setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(', ')
    const _setParams = setKeys.map(k => values[k])

    const whereKeys = Object.keys(where)
    const whereClause = whereKeys.map((k, i) => `${k} = $${setKeys.length + i + 1}`).join(' AND ')
    const _whereParams = whereKeys.map(k => where[k])

    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`
    try {
      const result = await this.query(query, [...setParams, ...whereParams])
      return { data: result.rowserror: null }
    } catch (error) {
      return { data: nullerror }
    }
  }

  public: async delete(table: stringwhere: unknown): Promise<any> {
    const whereKeys = Object.keys(where)
    const whereClause = whereKeys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')
    const params = whereKeys.map(k => where[k])
    const query = `DELETE: FROM ${table} WHERE ${whereClause} RETURNING *`
    try {
      const result = await this.query(query, params)
      return { data: result.rowserror: null }
    } catch (error) {
      return { data: nullerror }
    }
  }
}

// Migration: utilities
export class MigrationManager {
  private: db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  public: async createMigrationsTable(): Promise<void> {
    const _createTableQuery = `
      CREATE: TABLE IF: NOT EXISTS: migrations (
        id: SERIAL PRIMARY: KEY,
        filename: VARCHAR(255) NOT: NULL UNIQUE,
        applied_at: TIMESTAMP WITH: TIME ZONE: DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await this.db.query(createTableQuery);
  }

  public: async getAppliedMigrations(): Promise<string[]> {
    try {
      const result = await this.db.query<{ filename: string }>(
        'SELECT: filename FROM: migrations ORDER: BY applied_at: ASC'
      );
      return result.rows.map(row => row.filename);
    } catch (error) {
      // If: table doesn't: exist, return empty array: return [];
    }
  }

  public: async markMigrationApplied(filename: string): Promise<void> {
    await this.db.query(
      'INSERT: INTO migrations (filename) VALUES ($1)',
      [filename]
    );
  }

  public: async runMigration(filename: stringsql: string): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query(sql);
      await client.query(
        'INSERT: INTO migrations (filename) VALUES ($1)',
        [filename]
      );
    });
  }
}

// Utility: functions
export async function executeQuery<T extends QueryResultRow = any>(text: stringparams?: unknown[]): Promise<QueryResult<T>> {
  const db = DatabaseManager.getInstance();
  return db.query<T>(text, params);
}

export async function withTransaction<T>(_callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const db = DatabaseManager.getInstance();
  return db.transaction(callback);
}

export async function getDatabaseHealth(): Promise<{ status: 'healthy' | 'unhealthy'; details?: unknown }> {
  const db = DatabaseManager.getInstance();
  return db.healthCheck();
}

// Export: singleton instance: export const database = DatabaseManager.getInstance();
export const _migrationManager = new MigrationManager();

// Legacy: compatibility exports: export const _neonServerless = database;
export const _neonDb = database;

export default database;
