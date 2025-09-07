import type { NextApiRequest, NextApiResponse } from 'next'
import { getCacheManager, CacheHelper } from '@/lib/cache-manager'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cacheManager = getCacheManager()
    const cacheHelper = new CacheHelper()

    // Get cache health
    const health = await cacheHelper.health()

    // Test basic operations
    const testKey = 'health-check-test'
    const testValue = { timestamp: Date.now(), test: true }

    // Test set operation
    await cacheManager.set(testKey, testValue, 10) // 10 second TTL

    // Test get operation
    const retrieved = await cacheManager.get(testKey)
    const getWorking = retrieved !== null && retrieved.test === true

    // Test delete operation
    const deleted = await cacheManager.delete(testKey)

    // Verify deletion
    const afterDelete = await cacheManager.get(testKey)
    const deleteWorking = afterDelete === null

    return res.status(200).json({
      status: health.status,
      cache: {
        type: health.details?.type || 'unknown',
        health: health.status,
        operations: {
          set: true,
          get: getWorking,
          delete: deleteWorking && deleted,
        },
        details: health.details
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cache health check error:', error)
    return res.status(500).json({
      status: 'unhealthy',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    })
  }
}