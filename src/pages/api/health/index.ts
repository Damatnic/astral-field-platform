import type { NextApiRequest, NextApiResponse } from 'next'
import { database } from '@/lib/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Basic health check - fast response for load balancers
    const startTime = Date.now()
    const dbHealth = await Promise.race([
      database.healthCheck(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
    ]) as { status: string; details?: any }

    const responseTime = Date.now() - startTime
    const isHealthy = dbHealth.status === 'healthy'

    const response = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      responseTime,
      services: {
        database: {
          status: dbHealth.status,
          responseTime: dbHealth.details?.responseTimeMs || responseTime
        },
        api: {
          status: 'healthy',
          environment: process.env.NODE_ENV || 'development'
        }
      },
      links: {
        comprehensive: '/api/health/comprehensive',
        detailed: '/api/health/comprehensive?detailed=true',
        database: '/api/health/database',
        cache: '/api/health/cache'
      }
    }

    const statusCode = isHealthy ? 200 : 503
    return res.status(statusCode).json(response)
  } catch (error) {
    console.error('Health check error:', error)
    return res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      links: {
        comprehensive: '/api/health/comprehensive'
      }
    })
  }
}