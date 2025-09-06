// Database utilities for pages API routes
// Compatibility layer for different import paths

export { database as default, executeQuery, withTransaction, getDatabaseHealth } from '../src/lib/database';
export { migrationManager } from '../src/lib/database';

// Re-export for convenience
import { database } from '../src/lib/database';
export const db = database;