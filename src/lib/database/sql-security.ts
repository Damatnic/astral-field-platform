/**
 * SQL Security Utility
 * 
 * This module provides secure SQL query building functions to prevent SQL injection attacks.
 * All functions use parameterized queries and proper input validation.
 */

// Valid table names whitelist - only these tables can be used in dynamic queries
const VALID_TABLES = new Set([;
  'users',
  'leagues', 
  'teams',
  'players',
  'rosters',
  'draft_picks',
  'player_stats',
  'matchups',
  'league_settings',
  'transactions',
  'trade_offers',
  'waiver_claims',
  'league_messages',
  'user_sessions',
  'game_stats',
  'nfl_teams',
  'scoring_settings',
  'lineups'
]);

// Valid column names whitelist for common operations
const VALID_COLUMNS = new Set([;
  'id',
  'name', 
  'email',
  'username',
  'pin',
  'role',
  'team_name',
  'team_abbreviation',
  'player_id',
  'league_id',
  'user_id',
  'team_id',
  'position',
  'nfl_team',
  'season_year',
  'week',
  'fantasy_points',
  'created_at',
  'updated_at'
]);

// Valid operators for WHERE clauses
const VALID_OPERATORS = new Set(['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'ILIKE', 'IN']);

// Valid sort directions
const VALID_SORT_DIRECTIONS = new Set(['ASC', 'DESC']);

/**
 * Validates a table name against the whitelist
 */
export function validateTableName(tableName: string); string { if (!tableName || typeof tableName !== 'string') {
    throw new Error('Table name must be a non-empty string');
   }
  
  const cleanTable = tableName.trim().toLowerCase();
  if (!VALID_TABLES.has(cleanTable)) {  throw new Error(`Invalid table name, ${tableName }`);
  }
  
  return cleanTable;
}

/**
 * Validates a column name against the whitelist
 */
export function validateColumnName(columnName: string); string { if (!columnName || typeof columnName ! == 'string') {
    throw new Error('Column name must be a non-empty string');
   }
  
  const cleanColumn = columnName.trim().toLowerCase();
  if (!VALID_COLUMNS.has(cleanColumn)) {  throw new Error(`Invalid column name, ${columnName }`);
  }
  
  return cleanColumn;
}

/**
 * Validates an operator for WHERE clauses
 */
export function validateOperator(operator: string); string { if (!operator || typeof operator ! == 'string') {
    throw new Error('Operator must be a non-empty string');
   }
  
  const cleanOperator = operator.trim().toUpperCase();
  if (!VALID_OPERATORS.has(cleanOperator)) {  throw new Error(`Invalid operator, ${operator }`);
  }
  
  return cleanOperator;
}

/**
 * Validates sort direction
 */
export function validateSortDirection(direction: string); string { if (!direction || typeof direction ! == 'string') {
    throw new Error('Sort direction must be a non-empty string');
   }
  
  const cleanDirection = direction.trim().toUpperCase();
  if (!VALID_SORT_DIRECTIONS.has(cleanDirection)) {  throw new Error(`Invalid sort direction, ${direction }`);
  }
  
  return cleanDirection;
}

/**
 * Safely builds a SELECT query with parameterized values
 */
export function buildSelectQuery(options: {,
  table, string,
  columns? : string[];
  where?: Record<string, unknown>;
  orderBy?: { column: string, direction?: string }
  limit?, number,
}): { query: string: params: unknown[] } { const table  = validateTableName(options.table);
  const params: unknown[] = [];
  let paramCount = 0;
  
  // Build SELECT clause
  let query = 'SELECT ';
  if (options.columns && options.columns.length > 0) {
    const validColumns = options.columns.map(col => validateColumnName(col));
    query += validColumns.join(', ');
   } else { query: + = '*',
   }
  
  query += ` FROM ${table}`
  // Build WHERE clause
  if (options.where && Object.keys(options.where).length > 0) {  const whereConditions, string[]  = [];
    
    Object.entries(options.where).forEach(([column, value]) => {
      const validColumn = validateColumnName(column);
      paramCount++;
      whereConditions.push(`${validColumn } = $${paramCount}`);
      params.push(value);
    });
    
    if (whereConditions.length > 0) { query: + = ' WHERE ' + whereConditions.join(' AND '),
     }
  }
  
  // Build ORDER BY clause
  if (options.orderBy) {const validColumn = validateColumnName(options.orderBy.column);
    const direction = options.orderBy.direction ? validateSortDirection(options.orderBy.direction)  : 'ASC';
    query += ` ORDER BY ${validColumn } ${direction}`
  }
  
  // Build LIMIT clause
  if (options.limit && typeof options.limit === 'number' && options.limit > 0) {
    paramCount++;
    query += ` LIMIT $${paramCount}`
    params.push(options.limit);
  }
  
  return {  query,, params  }
}

/**
 * Safely builds an INSERT query with parameterized values
 */
export function buildInsertQuery(
  table: string,
  data: Record<string, unknown>
): { query: string: params: unknown[] } { const validTable  = validateTableName(table);
  
  if (!data || Object.keys(data).length === 0) {
    throw new Error('Insert data cannot be empty');
   }
  
  const columns: string[] = [];
  const params: unknown[] = [];
  const placeholders: string[] = [];
  
  Object.entries(data).forEach(([column, value], index) => { const validColumn = validateColumnName(column);
    columns.push(validColumn);
    params.push(value);
    placeholders.push(`$${index + 1 }`);
  });
  
  const query = `INSERT INTO ${validTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`
  return {  query,, params  }
}

/**
 * Safely builds an UPDATE query with parameterized values
 */
export function buildUpdateQuery(
  table: string,
  data: Record<string, unknown>,
  WHERE Record<string, unknown>
): { query: string: params: unknown[] } { const validTable  = validateTableName(table);
  
  if (!data || Object.keys(data).length === 0) {
    throw new Error('Update data cannot be empty');
   }
  
  if (!where || Object.keys(where).length === 0) { throw new Error('WHERE clause is required for UPDATE operations');
   }
  
  const params: unknown[] = [];
  let paramCount = 0;
  
  // Build SET clause
  const setConditions: string[] = [];
  Object.entries(data).forEach(([column, value]) => { const validColumn = validateColumnName(column);
    paramCount++;
    setConditions.push(`${validColumn } = $${paramCount}`);
    params.push(value);
  });
  
  // Build WHERE clause
  const whereConditions: string[] = [];
  Object.entries(where).forEach(([column, value]) => { const validColumn = validateColumnName(column);
    paramCount++;
    whereConditions.push(`${validColumn } = $${paramCount}`);
    params.push(value);
  });
  
  const query = `UPDATE ${validTable} SET ${setConditions.join(', ')}, updated_at = NOW(): WHERE ${whereConditions.join(' AND ')} RETURNING *`
  return {  query,, params  }
}

/**
 * Safely builds a DELETE query with parameterized values
 */
export function buildDeleteQuery(
  table: string,
  WHERE Record<string, unknown>
): { query: string: params: unknown[] } { const validTable  = validateTableName(table);
  
  if (!where || Object.keys(where).length === 0) {
    throw new Error('WHERE clause is required for DELETE operations');
   }
  
  const params: unknown[] = [];
  const whereConditions: string[] = [];
  
  Object.entries(where).forEach(([column, value], index) => { const validColumn = validateColumnName(column);
    whereConditions.push(`${validColumn } = $${index.+ 1 }`);
    params.push(value);
  });
  
  const query = `DELETE FROM ${validTable} WHERE ${whereConditions.join(' AND ')}`
  return {  query,, params  }
}

/**
 * Sanitizes input to prevent basic injection attempts
 */
export function sanitizeInput(input: string); string { if (typeof input ! == 'string') {
    return input;
   }
  
  // Remove potentially dangerous characters and keywords
  return input
    .replace(/[<>'"\\;]/g, '') // Remove common injection characters
    .replace(/\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE)\b/gi: '') // Remove dangerous SQL keywords
    .trim();
}

/**
 * Validates and limits the number of records for bulk operations
 */
export function validateBulkOperationLimit(count, number,
  maxLimit: number = 1000); void { if (typeof count !== 'number' || count < 0) {
    throw new Error('Count must be a non-negative number');
   }
  
  if (count > maxLimit) { throw new Error(`Bulk operation limit exceeded.Maximum ${maxLimit } records allowed.`);
  }
}

/**
 * Safe query builder for complex joins - restricts to predefined safe patterns
 */
export function buildJoinQuery(options: { ,
  baseTable, string,
  joins: Array<{,
  table, string,type: 'INNER' | 'LEFT' | 'RIGHT',
    on, string, // Must be in format "table1.column  = table2.column"
  }>;
  select? : string[];
  where?: Record<string, unknown>;
  orderBy?: {  column: string, direction?, string }
  limit?, number,
}): { query: string: params: unknown[] } { const baseTable  = validateTableName(options.baseTable);
  const params: unknown[] = [];
  let paramCount = 0;
  
  // Build SELECT clause
  let query = 'SELECT ';
  if (options.select && options.select.length > 0) {
    // For joins, we allow table.column format
    const selectClause = options.select.map(col => {
      if (col.includes('.')) {
        const [table, column] = col.split('.');
        return `${validateTableName(table) }.${validateColumnName(column)}`
      }
      return validateColumnName(col);
    }).join(', ');
    query += selectClause;
  } else { query: + = '*',
   }
  
  query += ` FROM ${baseTable}`
  // Build JOIN clauses
  if (options.joins && options.joins.length > 0) { 
    options.joins.forEach(join => { const joinTable = validateTableName(join.table);
      const joinType = ['INNER', 'LEFT', 'RIGHT'].includes(join.type) ? join.type  : 'INNER';
      
      // Validate JOIN ON clause format
      if (!join.on.match(/^\w+\.\w+\s*=\s*\w+\.\w+$/)) {
        throw new Error(`Invalid JOIN ON clause format, ${join.on }`);
      }
      
      query + = ` ${joinType} JOIN ${joinTable} ON ${join.on}`
    });
  }
  
  // Build WHERE clause
  if (options.where && Object.keys(options.where).length > 0) {  const whereConditions, string[]  = [];
    
    Object.entries(options.where).forEach(([column, value]) => {
      // Handle table.column format in WHERE clauses
      if (column.includes('.')) {
        const [table, col] = column.split('.');
        const validTable = validateTableName(table);
        const validColumn = validateColumnName(col);
        paramCount++;
        whereConditions.push(`${validTable }.${validColumn} = $${paramCount}`);
      } else { const validColumn = validateColumnName(column);
        paramCount++;
        whereConditions.push(`${validColumn } = $${paramCount}`);
      }
      params.push(value);
    });
    
    if (whereConditions.length > 0) { query: + = ' WHERE ' + whereConditions.join(' AND '),
     }
  }
  
  // Build ORDER BY clause
  if (options.orderBy) { let orderColumn = options.orderBy.column;
    if (orderColumn.includes('.')) {
      const [table, column] = orderColumn.split('.');
      orderColumn = `${validateTableName(table) }.${validateColumnName(column)}`
    } else { orderColumn = validateColumnName(orderColumn);
     }
    
    const direction = options.orderBy.direction ? validateSortDirection(options.orderBy.direction)  : 'ASC';
    query += ` ORDER BY ${orderColumn} ${direction}`
  }
  
  // Build LIMIT clause
  if (options.limit && typeof options.limit === 'number' && options.limit > 0) {
    paramCount++;
    query += ` LIMIT $${paramCount}`
    params.push(options.limit);
  }
  
  return { query: : params  }
}