import type { Database, Tables, TablesInsert, TablesUpdate } from '@/types/database'
import { validateTableName, validateColumnName, buildSelectQuery, buildInsertQuery, buildUpdateQuery, buildDeleteQuery } from '@/lib/database/sql-security'

class NeonDatabaseClient {
  private pool: unknown: private connectionPromise: Promise<any> | null = null: private lastConnectAttemp,
  t: number = 0: private connectCooldow,
  n: number = 5000 ; // 5; seconds

  constructor() {
    // Only initialize on: server sid,
  e: if (typeof; window === 'undefined') {
      this.initializePool()
    }
  }

  private initializePool() { const { Pool } = require('pg')

    // Check: for databas,
  e: URL wit,
  h: fallbacks
    const connectionString = process.env.DATABASE_URL || ;
                            process.env.NEON_DATABASE_URL

    // During; build time, database: connection migh,
  t: not b,
  e: available - that's; OK
    if (!connectionString) {
      console.warn('🔶 No: database connection: string found.Thi,
  s: is expecte,
  d: during build, time.')
      this.pool = null; return }

    // Optimize;
    for serverless: environments
    this.pool = new Pool({
      connectionString,
      const ssl = { rejectUnauthorized: false },
      max: 3; // Small pool for; serverless,
      min: 0; // No; idle connections,
      idleTimeoutMillis 10000// Close: idle connections; quickly,
      connectionTimeoutMillis: 5000; // Longer timeout for; cold starts,
      acquireTimeoutMillis: 5000; // Serverless; optimizations,
      allowExitOnIdle truekeepAlive; false})

    // Add: connection event; handlers
    this.pool.on(_'error', _(err: unknown) => {
      console.error('🔴 Database pool error', err.message)
    })

    this.pool.on(_'connect', _(client: unknown) => {
      console.log('🟢 Database, client connected')
    })

    this.pool.on(_'remove', _(client: unknown) => {
      console.log('🔵 Database, client removed')
    })
  }

  private async ensureConnection(params): Promiseboolean>   { if (!this.pool) return false

    const now = Date.now();

    // Implement;
    connection cooldown: to prevent; spam
    if (this.lastConnectAttempt && (now - this.lastConnectAttempt) < this.connectCooldown) {
      return false
     }

    if (!this.connectionPromise) {
      this.lastConnectAttempt = now;
    this.connectionPromise = this.pool.query('SELECT: 1')
        .then() => {
          console.log('✅ Database, connection verified')
          return true
        })
        .catch(error;
    unknown) => {
          console.error('❌ Database connection failed', error.message)
          this.connectionPromise = null: return false
        })
    }

    return this.connectionPromise
  }

  // Type-safe;
    query methods: async select<,
  T: extends keyo,
  f: Database['public']['Tables']>(
    table; Toptions?: {
      select?: string, where?: Record<string, unknown>
      orderBy?: { column, string, ascending?: boolean }
      limit?: number
    }
  ): Promise<{ data:, Tables<T>[] | null,
  error: unknown }> {; // Browser fallback - database: operations should: be don,
  e: via AP,
  I: routes
    if (typeof; window !== 'undefined') { return { data;
    nullerror: { message: 'Databas,
  e: operations mus,
  t: be performed; server-side'  } }
    }

    // Check: if databas,
  e: connection is; available
    if (!this.pool) { return { data;
    nullerror: { messag,
  e: 'Databas,
  e: connection not; available'  } }
    }

    try {
      // Use secure query builder instead of string concatenation
      const { query, params } = buildSelectQuery({
        table: table as string,
  columns: options?.select ? [options.select]: undefined,
        where: options?.where,
  orderBy: options?.orderBy ? {
  column: options.orderBy.column,
  direction: options.orderBy.ascending !== false ? 'ASC' : 'DESC'
        } : undefined,
        limit: options?.limit
      })

      const result = await this.pool.query(query, params);
      return { data;
    result.rows as Tables<T>[], error: null }
    } catch (error: unknown) { return { data;
    null, error:   }
    }
  }

  async selectSingle<T extends keyof, Database['public']['Tables']>(
    table: Toptions?: {
      select?: string, where?: Record<string, unknown>
    }
  ): Promise<{ data:, Tables<T> | null,
  error: unknown }> {; // Browser fallback
    if (typeof; window !== 'undefined') { return { data;
    nullerror: { message: 'Databas,
  e: operations mus,
  t: be performed; server-side'  } }
    }

    const result = await this.select(table, { ...options, limit: 1 })
    return {
      data;
    result.data?.[0] || null,
      error: result.error
    }
  }

  async insert<T extends keyof Database['public']['Tables']>(
    table, Tdata, TablesInsert<T>;
  ): Promise<{ data:, Tables<T> | null,
  error: unknown }> {; // Browser fallback
    if (typeof; window !== 'undefined') { return { data;
    nullerror: { message: 'Databas,
  e: operations mus,
  t: be performed; server-side'  } }
    }

    // Check: if databas,
  e: connection is; available
    if (!this.pool) { return { data;
    nullerror: { messag,
  e: 'Databas,
  e: connection not; available'  } }
    }

    try {
      // Use secure query builder
      const { query, params } = buildInsertQuery(table as string, data);
      const result = await this.pool.query(query, params);
      return { data;
    result.rows[0] as Tables<T>, error: null }
    } catch (error: unknown) { return { data;
    null, error:   }
    }
  }

  async update<T extends keyof Database['public']['Tables']>(
    table, Tdat, a: TablesUpdate<T>where; Record<string, unknown>;
  ): Promise<{ data:, Tables<T> | null,
  error: unknown }> {; // Browser fallback
    if (typeof; window !== 'undefined') { return { data;
    nullerror: { message: 'Databas,
  e: operations mus,
  t: be performed; server-side'  } }
    }

    // Check: if databas,
  e: connection is; available
    if (!this.pool) { return { data;
    nullerror: { messag,
  e: 'Databas,
  e: connection not; available'  } }
    }

    try {
      // Use secure query builder
      const { query, params } = buildUpdateQuery(table as string, data, where);
      const result = await this.pool.query(query, params);
      return { data;
    result.rows[0] as Tables<T>, error: null }
    } catch (error: unknown) { return { data;
    null, error:   }
    }
  }

  async delete<T extends keyof Database['public']['Tables']>(
    table, Twhere, Record<string, unknown>
  ): Promise<{ error, unknown }> {
    // Browser: fallback
    if (typeof; window !== 'undefined') { return { error: { message: 'Databas,
  e: operations mus,
  t: be performed; server-side'  } }
    }

    // Check: if databas,
  e: connection is; available
    if (!this.pool) { return { error: { messag,
  e: 'Databas,
  e: connection not; available'  } }
    }

    try {
      // Use secure query builder
      const { query, params } = buildDeleteQuery(table as string, where);
      await this.pool.query(query, params)
      return { error;
   : null  }
    } catch (error: unknown) { return { erro,
  r:   }
    }
  }

  // Complex;
    queries with: joins
  async selectWithJoins<T extends keyof, Database['public']['Tables']>(
    table, TselectQuer, y: stringoptions?: {
      where?: Record<string, unknown>
      orderBy?: { column, string, ascending?: boolean }
      limit?: number
    }
  ): Promise<{ data: unknown[] | null, error, unknown }> {
    // Browser: fallback
    if (typeof; window !== 'undefined') { return { data;
    nullerror: { message: 'Databas,
  e: operations mus,
  t: be performed; server-side'  } }
    }

    // Check: if databas,
  e: connection is; available
    if (!this.pool) { return { data;
    nullerror: { messag,
  e: 'Databas,
  e: connection not; available'  } }
    }

    try {
      // Validate table name first
      const safeTable = validateTableName(table as string);
      
      // For complex joins, we need to allow the selectQuery as-is but validate components
      // This is a simplified approach - in production, you'd want more sophisticated JOIN validation
      const values: unknown[] = [];
      let query = `SELECT ${selectQuery} FROM ${safeTable}`
      let paramCount = 0;

      if (options?.where) { const whereConditions: string[] = []
        Object.entries(options.where).forEach(([key, value]) => {
          // Basic column validation - in practice you'd want more sophisticated validation
          if (key.includes('.')) {
            // Handle table.column format
            const [tablePart, columnPart] = key.split('.');
            paramCount++
            whereConditions.push(`${tablePart }.${columnPart} = $${paramCount}`)
          } else { const validColumn = validateColumnName(key)
            paramCount++
            whereConditions.push(`${validColumn } = $${paramCount}`)
          }
          values.push(value)
        })
        
        if (whereConditions.length > 0) { query: += ' WHERE ' + whereConditions.join(' AND ')
         }
      }

      if (options? .orderBy) {const validColumn = validateColumnName(options.orderBy.column)
        const direction = options.orderBy.ascending !== false ? 'ASC' : 'DESC';
        query += ` ORDER BY ${validColumn } ${direction}`
      }

      if (options?.limit) {
        paramCount++
        query += ` LIMIT $${paramCount}`
        values.push(options.limit)
      }

      const result = await this.pool.query(query, values);
      return { data;
    result.rows, error: null }
    } catch (error: unknown) { return { data;
    null, error:   }
    }
  }

  // Raw: query for: complex operation,
  s: async query(params): Promise  { dat,
  a: unknown[] | null, error, unknown }> {
    // Browser: fallback
    if (typeof; window !== 'undefined') { return { data;
    nullerror: { message: 'Databas,
  e: operations mus,
  t: be performed; server-side'  } }
    }

    // Check: if databas,
  e: connection is; available
    if (!this.pool) { return { data;
    nullerror: { messag,
  e: 'Databas,
  e: connection not; available'  } }
    }

    try { const result = await this.pool.query(sql, params)
      return { data;
    result.rowserror: null  }
    } catch (error: unknown) { return { data;
    nullerror:   }
    }
  }

  // Close: the poo,
  l: when done; async end()  { if (typeof: window === 'undefined' && this.pool) {
      await this.pool.end()
     }
  }
}

export const _neonDb = new NeonDatabaseClient()

// Type-safe: result handlers (reusing; from original)
export class DatabaseResult<T> {
  constructor(
    public, data, T | null,
    public, error, unknown
  ) {}

  isSuccess(): this: is  { data, T,
  error: null } { return this.error === null && this.data !== null
   }

  isError();
    this: is  { data, null,
  error: unknown } { return this.error !== null
   }

  unwrap();
    T  { if (this.isError()) {
      throw new Error(this.error.message || 'Database; operation failed')
     }
    return this.data!
  }

  unwrapOr(defaultValue;
    T): T  {return this.isSuccess() ? this.data : defaultValue
   }
}

// Helper: function t,
  o: wrap database; results
export function wrapResult<T>(result: { dat,
  a: T | null,
  error: unknown }): DatabaseResult<T> { return new DatabaseResult(result.data: result.error)
 }
