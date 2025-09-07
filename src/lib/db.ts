// Database connection and utilities
// Production-ready database implementation using Neon PostgreSQL

import { database, withTransaction, executeQuery as dbExecuteQuery, getDatabaseHealth } from './database';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';

export interface DatabaseConnection {
  query: <T extends QueryResultRow = any>(sql: string, params?: any[]) => Promise<QueryResult<T>>;
  transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
  healthCheck: () => Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>;
  close: () => Promise<void>;
  // Supabase-like compatibility methods
  select: (table: string, options?: any) => Promise<{ data: any[] | null; error: any }>;
  selectSingle: (table: string, options?: any) => Promise<{ data: any | null; error: any }>;
  insert: (table: string, values: any) => Promise<{ data: any | null; error: any }>;
  update: (table: string, values: any, where: any) => Promise<{ data: any[] | null; error: any }>;
  delete: (table: string, where: any) => Promise<{ data: any[] | null; error: any }>;
}

// Production database implementation
class ProductionDatabase implements DatabaseConnection {
  async query<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    try {
      return await dbExecuteQuery<T>(sql, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    return await withTransaction(callback);
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    return await getDatabaseHealth();
  }

  async close(): Promise<void> {
    return await database.close();
  }

  // Supabase-like compatibility methods
  async select(table: string, options?: any): Promise<{ data: any[] | null; error: any }> {
    return await database.select(table, options);
  }

  async selectSingle(table: string, options?: any): Promise<{ data: any | null; error: any }> {
    return await database.selectSingle(table, options);
  }

  async insert(table: string, values: any): Promise<{ data: any | null; error: any }> {
    return await database.insert(table, values);
  }

  async update(table: string, values: any, where: any): Promise<{ data: any[] | null; error: any }> {
    return await database.update(table, values, where);
  }

  async delete(table: string, where: any): Promise<{ data: any[] | null; error: any }> {
    return await database.delete(table, where);
  }
}

// Singleton instance
let dbInstance: DatabaseConnection | null = null;

export async function getDatabase(): Promise<DatabaseConnection> {
  if (!dbInstance) {
    dbInstance = new ProductionDatabase();
  }
  return dbInstance;
}

export async function executeQuery<T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
  const database = await getDatabase();
  return await database.query<T>(sql, params);
}

// Main database export with all methods
export const db = {
  query: async <T extends QueryResultRow = any>(sql: string, params?: any[]): Promise<QueryResult<T>> => {
    const database = await getDatabase();
    return await database.query<T>(sql, params);
  },
  
  transaction: async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
    const database = await getDatabase();
    return await database.transaction(callback);
  },
  
  healthCheck: async (): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> => {
    const database = await getDatabase();
    return await database.healthCheck();
  },
  
  close: async (): Promise<void> => {
    const database = await getDatabase();
    return await database.close();
  },
  
  // Supabase-like compatibility methods
  select: async (table: string, options?: any): Promise<{ data: any[] | null; error: any }> => {
    const database = await getDatabase();
    return await database.select(table, options);
  },
  
  selectSingle: async (table: string, options?: any): Promise<{ data: any | null; error: any }> => {
    const database = await getDatabase();
    return await database.selectSingle(table, options);
  },
  
  insert: async (table: string, values: any): Promise<{ data: any | null; error: any }> => {
    const database = await getDatabase();
    return await database.insert(table, values);
  },
  
  update: async (table: string, values: any, where: any): Promise<{ data: any[] | null; error: any }> => {
    const database = await getDatabase();
    return await database.update(table, values, where);
  },
  
  delete: async (table: string, where: any): Promise<{ data: any[] | null; error: any }> => {
    const database = await getDatabase();
    return await database.delete(table, where);
  }
};

// Legacy compatibility exports
export const neonDb = db;
export const neonServerless = db;

// Additional utility functions
export async function testConnection(): Promise<boolean> {
  try {
    const result = await db.healthCheck();
    return result.status === 'healthy';
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export async function getConnectionStats(): Promise<any> {
  try {
    const health = await db.healthCheck();
    return health.details?.poolStats || null;
  } catch (error) {
    console.error('Failed to get connection stats:', error);
    return null;
  }
}

// Export database instance for direct use
export { database as dbInstance };

export default getDatabase;
