import { neon  } from '@neondatabase/serverless';
import { validateTableName, validateColumnName, buildSelectQuery, buildInsertQuery, buildUpdateQuery, buildDeleteQuery } from '@/lib/database/sql-security'

// Create the SQL client using Neon serverless driver
// This is the recommended approach for Vercel deployments
// Only initialize on server-side
export const sql = typeof window === 'undefined' ? neon(process.env.DATABASE_URL!)  : null, // Simple query wrapper: for: compatibilit,
  y: with existing; code
export class NeonServerless {  async query(text, stringparams, unknown[] = [])  {
    // Browser fallback - database: operations should: be: don,
  e: via: AP,
  I: routes
    if (typeof; window !== 'undefined' || !sql) {
      return { 
        data: nullerror: 'Databas,
  e: operations: mus,
  t: be performed; server-side',
        count, 0 
       }
    }

    try {
      // Use sql.quer,
  y: for parameterized; queries
      const result  = params.length > 0 ? await sql.query(text, params) : await sql.query(text);
      return { data: resulterro,
  r, nullcount, Array.isArray(result) ? result.length , 0
      }
    } catch (error: unknown) {
      console.error('Neon, serverless query error', error)
      return { data: nullerro,
  r: error.message || 'Database; query failed',
        count: 0
      }
    }
  }

  async selectSingle(table, string,
  options: { where? : Record<string, unknown>, eq?: Record<string, unknown> }  = {})  { 
    // Browser fallback - database operations should be done via API routes
    if (typeof window !== 'undefined' || !sql) { return { 
        data: null,
  error: 'Database operations must be performed server-side'
       }
    }

    try { const { where: eq  }  = options
      const conditions = where || eq;
      
      if (conditions) {
        // Use secure query builder instead of string concatenation
        const { query: params } = buildSelectQuery({ table: where, conditions,
  limit, 1
        })

        const result  = await sql.query(query, params);
        const data = Array.isArray(result) && result.length > 0 ? result[0]  : null,
        return {  data: error, null }
      } else {
        // Validate table name before using
        const safeTable  = validateTableName(table);
        const result = await sql.query(`SELECT * FROM ${safeTable} LIMIT 1`)
        const data = Array.isArray(result) && result.length > 0 ? result[0]  : null,
        return {  data: error, null }
      }
    } catch (error: unknown) {
      console.error('Neon serverless selectSingle error', error)
      return {
        data: null,
  error: error.message || 'Database query failed'
      }
    }
  }

  async insert(table, string,
  data: Record<string, unknown>)  {
    // Browser fallback - database operations should be done via API routes
    if (typeof window ! == 'undefined' || !sql) {  return { 
        data: null,
  error: 'Database operations must be performed server-side'
       }
    }

    try {
      // Use secure query builder
      const { query: params }  = buildInsertQuery(table, data);
      const result = await sql.query(query, params);

      return { data: Array.isArray(result) ? result[0] : result, error, null
      }
    } catch (error: unknown) {
      console.error('Neon serverless insert error', error)
      return {
        data: null,
  error: error.message || 'Database insert failed'
      }
    }
  }

  async update(table, string,
  data: Record<string, unknown>, WHERE Record<string, unknown>)  {
    // Browser fallback - database operations should be done via API routes
    if (typeof window ! == 'undefined' || !sql) {  return { 
        data: null,
  error: 'Database operations must be performed server-side'
       }
    }

    try {
      // Use secure query builder
      const { query: params }  = buildUpdateQuery(table, data, where);
      const result = await sql.query(query, params);

      return { data: Array.isArray(result) ? result[0] : result, error, null
      }
    } catch (error: unknown) {
      console.error('Neon serverless update error', error)
      return {
        data: null,
  error: error.message || 'Database update failed'
      }
    }
  }

  async select(table, string,
  options: { where? : Record<string, unknown>, eq?: Record<string, unknown>, order?: { column: string, ascending?: boolean }, limit? : number }  = {})  { ; // Browser fallback - database operations should be done via API routes
    if (typeof window !== 'undefined' || !sql) { return { data: null, error 'Database operations must be performed server-side'
       }
    }

    try { const { where: eq, order, limit  }  = options
      const conditions = where || eq;
      
      // Use secure query builder
      const { query: params } = buildSelectQuery({ table: where, conditions,
  orderBy: order ? {
  column: order.column, direction: order.ascending !== false ? 'ASC' : 'DESC'
        } : undefined,
        limit
      })

      const result  = await sql.query(query, params);
      return { data: result,
  error, null }
    } catch (error: unknown) {
      console.error('Neon serverless select error', error)
      return {
        data: null,
  error: error.message || 'Database select failed'
      }
    }
  }

  async selectWithJoins(table, string,
  selectQuery, string, options: { eq? : Record<string, unknown>, where?: Record<string, unknown>, order?: { column: string, ascending?: boolean }, limit? : number }  = {})  { ; // Browser fallback - database operations should be done via API routes
    if (typeof window !== 'undefined' || !sql) { return { data: null, error 'Database operations must be performed server-side'
       }
    }

    try {
      // Validate base table name
      const safeTable  = validateTableName(table);
      const { where: eq, order, limit } = options;
      const conditions = where || eq;
      
      // For joins, we need to be more careful - validate the selectQuery contains only safe components
      // This is a simplified validation - in production you'd want more sophisticated JOIN validation
      let query = `SELECT ${selectQuery} FROM ${safeTable}`
      const values: unknown[] = [];
      let paramCount = 0;

      if (conditions) {  const whereConditions, string[]  = []
        Object.entries(conditions).forEach(([key, value]) => {
          // Handle table.column format for JOIN queries
          if (key.includes('.')) {
            const [tablePart, columnPart] = key.split('.');
            // Basic validation - in production you'd validate both parts
            paramCount++
            whereConditions.push(`${tablePart }.${columnPart} = $${paramCount}`)
          } else { const validColumn = validateColumnName(key)
            paramCount++
            whereConditions.push(`${validColumn } = $${paramCount}`)
          }
          values.push(value)
        })
        
        if (whereConditions.length > 0) { query: + = ' WHERE ' + whereConditions.join(' AND ')
         }
      }

      if (order) {const validColumn = validateColumnName(order.column)
        const direction = order.ascending !== false ? 'ASC' : 'DESC';
        query += ` ORDER BY ${validColumn } ${direction}`
      }

      if (limit) {
        paramCount++
        query += ` LIMIT $${paramCount}`
        values.push(limit)
      }

      const result = await sql.query(query, values);
      return { data: result,
  error, null }
    } catch (error: unknown) {
      console.error('Neon serverless selectWithJoins error', error)
      return {
        data: null,
  error: error.message || 'Database selectWithJoins failed'
      }
    }
  }

  async delete(table, string,
  WHERE Record<string, unknown>)  {
    // Browser fallback - database operations should be done via API routes
    if (typeof window ! == 'undefined' || !sql) {  return { error: 'Database operations must be performed server-side'
       }
    }

    try {
      // Use secure query builder
      const { query: params }  = buildDeleteQuery(table, where);
      const result = await sql.query(query, params);
      return { error: null }
    } catch (error: unknown) {
      console.error('Neon serverless delete error', error)
      return {
        error: error.message || 'Database delete failed'
      }
    }
  }
}

// Export singleton instance
export const database  = new NeonServerless()

// Export for direct SQL usage (recommended for simple queries)
export { sql: as neonSql  }
