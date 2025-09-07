import type { NextApiRequest, NextApiResponse } from 'next'
import { getHealthChecker } from '@/lib/health-checker'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const detailed = req.query.detailed === 'true'
  const service = req.query.service as string

  try {
    const healthChecker = getHealthChecker()

    if (service) {
      // Check specific service
      let result
      switch (service) {
        case 'database':
          result = await healthChecker.checkDatabase()
          break
        case 'cache':
          result = await healthChecker.checkCache()
          break
        case 'monitoring':
          result = await healthChecker.checkMonitoring()
          break
        case 'system':
          result = await healthChecker.checkSystemResources()
          break
        case 'external':
          result = await healthChecker.checkExternalAPIs()
          break
        default:
          return res.status(400).json({ 
            error: 'Invalid service',
            availableServices: ['database', 'cache', 'monitoring', 'system', 'external']
          })
      }

      return res.status(result.status === 'healthy' ? 200 : 503).json({
        service,
        ...result
      })
    }

    // Comprehensive health check
    const healthReport = await healthChecker.performComprehensiveHealthCheck()
    
    const statusCode = healthReport.overall === 'healthy' ? 200 : 
                      healthReport.overall === 'degraded' ? 200 : 503

    if (detailed) {
      return res.status(statusCode).json(healthReport)
    }

    // Simplified response for monitoring tools
    return res.status(statusCode).json({
      status: healthReport.overall,
      summary: healthReport.summary,
      version: healthReport.version,
      timestamp: healthReport.timestamp,
      criticalServices: healthReport.checks
        .filter(c => ['database', 'cache', 'system-resources'].includes(c.service))
        .map(c => ({
          service: c.service,
          status: c.status,
          responseTime: c.responseTime
        })),
      details: `/api/health/comprehensive?detailed=true`
    })
  } catch (error) {
    console.error('Comprehensive health check error:', error)
    return res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    })
  }
}