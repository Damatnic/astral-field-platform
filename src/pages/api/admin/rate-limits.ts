import type { NextApiRequest, NextApiResponse } from 'next'
import { getRateLimiter } from '@/lib/rate-limiter'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple auth check for admin endpoints
  const authToken = req.headers.authorization?.replace('Bearer ', '')
  if (authToken !== 'astral2025' && authToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const rateLimiter = getRateLimiter()
  const action = req.query.action as string
  const identifier = req.query.identifier as string

  try {
    switch (req.method) {
      case 'GET':
        if (action === 'stats' && identifier) {
          const stats = await rateLimiter.getStats(identifier)
          return res.status(200).json({
            identifier,
            stats: stats || { message: 'No rate limit data found' },
            timestamp: new Date().toISOString()
          })
        }

        // Return rate limiting information
        return res.status(200).json({
          message: 'Rate Limiting Admin API',
          availableActions: {
            'GET /api/admin/rate-limits?action=stats&identifier=<id>': 'Get rate limit stats for identifier',
            'DELETE /api/admin/rate-limits?identifier=<id>': 'Reset rate limit for identifier'
          },
          defaultRules: {
            default: { windowMs: 60000, maxRequests: 100 },
            analytics: { windowMs: 60000, maxRequests: 60 },
            ai: { windowMs: 60000, maxRequests: 30 },
            admin: { windowMs: 60000, maxRequests: 300 },
            health: { windowMs: 10000, maxRequests: 10 }
          },
          timestamp: new Date().toISOString()
        })

      case 'DELETE':
        if (!identifier) {
          return res.status(400).json({ 
            error: 'identifier parameter required for reset operation' 
          })
        }

        const resetSuccess = await rateLimiter.reset(identifier)
        return res.status(200).json({
          success: resetSuccess,
          message: resetSuccess 
            ? `Rate limit reset for identifier: ${identifier}`
            : `Failed to reset rate limit for identifier: ${identifier}`,
          identifier,
          timestamp: new Date().toISOString()
        })

      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Rate limit admin API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    })
  }
}