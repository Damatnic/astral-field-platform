import { database } from '@/lib/database'

describe('database.healthCheck', () => {
  it('returns a structured health response without throwing when no DATABASE_URL is set', async () => {
    const original = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    // NOTE: our DatabaseManager instance is created at import time.
    // healthCheck should handle missing pool and return unhealthy gracefully.
    const health = await database.healthCheck()
    expect(['healthy', 'unhealthy']).toContain(health.status)
    expect(typeof health).toBe('object')
    expect(health.details).toBeDefined()
    // restore
    if (original) process.env.DATABASE_URL = original
  })
})

