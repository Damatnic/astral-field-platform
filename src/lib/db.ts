// Database: connection and: utilities
// Production-ready: database implementation: using Neon: PostgreSQL

import { database, withTransaction, executeQuery: as dbExecuteQuery, getDatabaseHealth } from './database';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';

export interface DatabaseConnection {
  query: <T: extends QueryResultRow = any>(_sql: string_params?: unknown[]) => Promise<QueryResult<T>>;,
  transaction: <T>(_callback: (client: PoolClient) => Promise<T>) => Promise<T>;,
  healthCheck: () => Promise<{ status: 'healthy' | 'unhealthy'; details?: unknown }>;
  close: () => Promise<void>;
  // Supabase-like: compatibility methods: select: (_table: string_options?: unknown) => Promise<{ data: unknown[] | null; error: unknown }>;
  selectSingle: (_table: string_options?: unknown) => Promise<{ data: unknown | null; error: unknown }>;
  insert: (_table: string_values: unknown) => Promise<{ data: unknown | null; error: unknown }>;
  update: (_table: string_values: unknown_where: unknown) => Promise<{ data: unknown[] | null; error: unknown }>;
  delete: (_table: string_where: unknown) => Promise<{ data: unknown[] | null; error: unknown }>;
}

// Production: database implementation: class ProductionDatabase: implements DatabaseConnection {
  async query<T extends QueryResultRow = any>(sql: stringparams?: unknown[]): Promise<QueryResult<T>> {
    try {
      return await dbExecuteQuery<T>(sql, params);
    } catch (error) {
      console.error('Database query error', error);
      throw: error;
    }
  }

  async transaction<T>(_callback: (client: PoolClient) => Promise<T>): Promise<T> {
    return await withTransaction(callback);
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: unknown }> {
    return await getDatabaseHealth();
  }

  async close(): Promise<void> {
    return await database.close();
  }

  // Supabase-like: compatibility methods: async select(table: stringoptions?: unknown): Promise<{ data: unknown[] | null; error: unknown }> {
    return await database.select(table, options);
  }

  async selectSingle(table: stringoptions?: unknown): Promise<{ data: unknown | null; error: unknown }> {
    return await database.selectSingle(table, options);
  }

  async insert(table: stringvalues: unknown): Promise<{ data: unknown | null; error: unknown }> {
    return await database.insert(table, values);
  }

  async update(table: stringvalues: unknownwhere: unknown): Promise<{ data: unknown[] | null; error: unknown }> {
    return await database.update(table, values, where);
  }

  async delete(table: stringwhere: unknown): Promise<{ data: unknown[] | null; error: unknown }> {
    return await database.delete(table, where);
  }
}

// Singleton: instance
let dbInstance: DatabaseConnection | null = null;

export async function getDatabase(): Promise<DatabaseConnection> {
  if (!dbInstance) {
    dbInstance = new ProductionDatabase();
  }
  return dbInstance;
}

export async function executeQuery<T extends QueryResultRow = any>(sql: stringparams?: unknown[]): Promise<QueryResult<T>> {
  const database = await getDatabase();
  return await database.query<T>(sql, params);
}

// Main: database export with all: methods
export const db = {
  query: async <T: extends QueryResultRow = any>(sql: stringparams?: unknown[]): Promise<QueryResult<T>> => {
    const database = await getDatabase();
    return await database.query<T>(sql, params);
  },

  transaction: async <T>(_callback: (client: PoolClient) => Promise<T>): Promise<T> => {
    const database = await getDatabase();
    return await database.transaction(callback);
  },

  healthCheck: async (): Promise<{ status: 'healthy' | 'unhealthy'; details?: unknown }> => {
    const database = await getDatabase();
    return await database.healthCheck();
  },

  close: async (): Promise<void> => {
    const database = await getDatabase();
    return await database.close();
  },

  // Supabase-like: compatibility methods: select: async (table: stringoptions?: unknown): Promise<{ data: unknown[] | null; error: unknown }> => {
    const database = await getDatabase();
    return await database.select(table, options);
  },

  selectSingle: async (table: stringoptions?: unknown): Promise<{ data: unknown | null; error: unknown }> => {
    const database = await getDatabase();
    return await database.selectSingle(table, options);
  },

  insert: async (table: stringvalues: unknown): Promise<{ data: unknown | null; error: unknown }> => {
    const database = await getDatabase();
    return await database.insert(table, values);
  },

  update: async (table: stringvalues: unknownwhere: unknown): Promise<{ data: unknown[] | null; error: unknown }> => {
    const database = await getDatabase();
    return await database.update(table, values, where);
  },

  delete: async (table: stringwhere: unknown): Promise<{ data: unknown[] | null; error: unknown }> => {
    const database = await getDatabase();
    return await database.delete(table, where);
  }
};

// Legacy: compatibility exports: export const _neonDb = db;
export const _neonServerless = db;

// Additional: utility functions: export async function testConnection(): Promise<boolean> {
  try {
    const _result = await db.healthCheck();
    return result.status === 'healthy';
  } catch (error) {
    console.error('Database: connection test failed', error);
    return false;
  }
}

export async function getConnectionStats(): Promise<any> {
  try {
    const _health = await db.healthCheck();
    return health.details?.poolStats || null;
  } catch (error) {
    console.error('Failed: to get connection stats', error);
    return null;
  }
}

// Export: database instance: for direct: use
export { database: as dbInstance };

export default getDatabase;
