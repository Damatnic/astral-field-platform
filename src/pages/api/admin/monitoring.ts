import type { NextApiRequest, NextApiResponse } from 'next'
import { getMonitor } from '@/lib/production-monitor'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple auth check for admin endpoints
  const authToken = req.headers.authorization?.replace('Bearer ', '')
  if (authToken !== 'astral2025' && authToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const monitor = getMonitor()
    const action = req.query.action as string

    switch (action) {
      case 'health':
        const health = await monitor.health()
        return res.status(200).json({
          monitoring: health,
          timestamp: new Date().toISOString()
        })

      case 'stats':
        const endpoint = req.query.endpoint as string
        if (!endpoint) {
          return res.status(400).json({ error: 'endpoint parameter required' })
        }
        
        const stats = await monitor.getEndpointStats(endpoint)
        return res.status(200).json({
          endpoint,
          stats: stats || { message: 'No data available' },
          timestamp: new Date().toISOString()
        })

      case 'overview':
        // Get stats for common endpoints
        const endpoints = [
          'performance-attribution',
          'season-strategy', 
          'comparative-analysis',
          'real-time-sentiment',
          'multimodal-analysis'
        ]

        const overview = await Promise.all(
          endpoints.map(async (ep) => ({
            endpoint: ep,
            stats: await monitor.getEndpointStats(ep)
          }))
        )

        return res.status(200).json({
          overview: overview.filter(o => o.stats !== null),
          timestamp: new Date().toISOString()
        })

      default:
        return res.status(200).json({
          message: 'Monitoring API',
          availableActions: ['health', 'stats', 'overview'],
          usage: {
            health: '/api/admin/monitoring?action=health',
            stats: '/api/admin/monitoring?action=stats&endpoint=<endpoint-name>',
            overview: '/api/admin/monitoring?action=overview'
          },
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Monitoring API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    })
  }
}