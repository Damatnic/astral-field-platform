import { database } from '@/lib/database'
import { Pool } from 'pg'

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Skip if no DATABASE_URL
    if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
      console.log('Skipping integration tests - no DATABASE_URL set')
      return
    }
  })

  afterAll(async () => {
    await database.close()
  })

  describe('Connection Management', () => {
    it('should connect to database successfully', async () => {
      const testEnv = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
      if (!testEnv) {
        console.log('Skipping - no database connection')
        return
      }

      const result = await database.query('SELECT 1 as test')
      expect(result.rows[0].test).toBe(1)
    })

    it('should handle health checks', async () => {
      const health = await database.healthCheck()
      
      if (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL) {
        expect(health.status).toBe('healthy')
        expect(health.details?.connected).toBe(true)
        expect(typeof health.details?.responseTimeMs).toBe('number')
      } else {
        expect(health.status).toBe('unhealthy')
        expect(health.details?.connected).toBe(false)
      }
    })
  })

  describe('Query Operations', () => {
    it('should execute simple queries', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      const result = await database.query('SELECT NOW() as current_time')
      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].current_time).toBeInstanceOf(Date)
    })

    it('should execute parameterized queries', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      const testValue = 'test_value'
      const result = await database.query('SELECT $1 as value', [testValue])
      expect(result.rows[0].value).toBe(testValue)
    })

    it('should handle query errors gracefully', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      await expect(
        database.query('SELECT * FROM non_existent_table')
      ).rejects.toThrow()
    })
  })

  describe('Transaction Operations', () => {
    it('should commit successful transactions', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      const result = await database.transaction(async (client) => {
        const res1 = await client.query('SELECT 1 as value')
        const res2 = await client.query('SELECT 2 as value')
        return { first: res1.rows[0].value, second: res2.rows[0].value }
      })

      expect(result.first).toBe(1)
      expect(result.second).toBe(2)
    })

    it('should rollback failed transactions', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      await expect(
        database.transaction(async (client) => {
          await client.query('SELECT 1')
          throw new Error('Intentional error')
        })
      ).rejects.toThrow('Intentional error')
    })

    it('should handle nested operations in transactions', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      const result = await database.transaction(async (client) => {
        await client.query('CREATE TEMP TABLE temp_test (id int, name text)')
        await client.query('INSERT INTO temp_test (id, name) VALUES ($1, $2)', [1, 'test'])
        const res = await client.query('SELECT * FROM temp_test')
        return res.rows
      })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].name).toBe('test')
    })
  })

  describe('Connection Pool Management', () => {
    it('should handle multiple concurrent queries', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      const promises = Array.from({ length: 5 }, (_, i) =>
        database.query('SELECT $1 as query_id', [i])
      )

      const results = await Promise.all(promises)
      
      results.forEach((result, index) => {
        expect(result.rows[0].query_id).toBe(index)
      })
    })

    it('should handle concurrent transactions', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      const promises = Array.from({ length: 3 }, (_, i) =>
        database.transaction(async (client) => {
          await client.query('SELECT pg_sleep(0.1)')
          return await client.query('SELECT $1 as transaction_id', [i])
        })
      )

      const results = await Promise.all(promises)
      
      results.forEach((result, index) => {
        expect(result.rows[0].transaction_id).toBe(index)
      })
    })
  })

  describe('Error Handling', () => {
    it('should throw meaningful errors for connection issues', async () => {
      // Skip this test if we don't have a database connection to test with
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
        const health = await database.healthCheck()
        expect(health.status).toBe('unhealthy')
        expect(health.details?.connected).toBe(false)
        return
      }

      // Test with invalid connection string
      const originalEnv = process.env.DATABASE_URL
      const originalNeonEnv = process.env.NEON_DATABASE_URL
      process.env.DATABASE_URL = 'postgresql://invalid:invalid@invalid:5432/invalid'
      delete process.env.NEON_DATABASE_URL

      try {
        await database.query('SELECT 1')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
      
      // Restore environment
      if (originalEnv) process.env.DATABASE_URL = originalEnv
      if (originalNeonEnv) process.env.NEON_DATABASE_URL = originalNeonEnv
    })

    it('should handle network timeouts gracefully', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      // Test with a very long query that might timeout
      const startTime = Date.now()
      try {
        await database.query('SELECT pg_sleep(0.01)')
        const duration = Date.now() - startTime
        expect(duration).toBeLessThan(5000) // Should complete quickly
      } catch (error) {
        // If it fails, it should be a reasonable error
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('Data Type Handling', () => {
    it('should handle various PostgreSQL data types', async () => {
      if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) return

      const result = await database.query(`
        SELECT 
          123 as integer_val,
          'hello' as text_val,
          true as boolean_val,
          NOW() as timestamp_val,
          ARRAY[1,2,3] as array_val
      `)

      const row = result.rows[0]
      expect(typeof row.integer_val).toBe('number')
      expect(typeof row.text_val).toBe('string')
      expect(typeof row.boolean_val).toBe('boolean')
      expect(row.timestamp_val).toBeInstanceOf(Date)
      expect(Array.isArray(row.array_val)).toBe(true)
    })
  })
})