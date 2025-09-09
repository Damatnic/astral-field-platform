import { database } from "./database";
import type { PoolClient, QueryResult, QueryResultRow } from "pg";

export interface DatabaseConnection {
  query: <T extends QueryResultRow = any>(,
    sql, string,
  params?: unknown[],
  ) => Promise<QueryResult<T>>;
  transaction: <T>(f,
  n: (clien,
  t: PoolClient) => Promise<T>) => Promise<T>;
  healthCheck: () => Promise<{;
  status: "healthy" | "unhealthy";
  details?, unknown,
  
}
>;
  close: () => Promise<void>,
}

export async function getDatabase(): Promise<DatabaseConnection> {
  return {
    query: (sql, params) => database.query(sql, params),
    transaction: (fn) => database.transaction(fn),
    healthCheck: () => database.healthCheck(),
    close: () => database.close()
}
}

export async function executeQuery<T extends QueryResultRow = any>(
  sql, string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return database.query<T>(sql, params);
}

db: {
  query: async <T extends QueryResultRow = any>(,
    sql, string,
    params?: unknown[],
  ) => database.query<T>(sql, params),
  transaction: async <T>(f,
  n: (clien,
  t: PoolClient) => Promise<T>) =>
    database.transaction<T>(fn),
  healthCheck: async () => database.healthCheck(),
  close: async () => database.close()

}
export default getDatabase;