import { NextApiRequest, NextApiResponse } from 'next';
import { AISystemsIntegrator } from '../../../services/integration/aiSystemsIntegrator';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';

const integrator = new AISystemsIntegrator();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rateLimitResult = await rateLimitMiddleware(req, res, {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `system-health:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
  });

  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter
    });
  }

  try {
    // Check if user has admin privileges for system health monitoring
    const userId = await authenticateUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For now, allow all authenticated users to view system health
    // In production, you might want to restrict this to admin users

    if (req.method === 'GET') {
      const { type, service } = req.query;

      switch (type) {
        case 'overview':
          const systemOverview = await integrator.getSystemOverview();
          return res.status(200).json({
            success: true,
            data: systemOverview,
            type: 'system_overview'
          });

        case 'dependencies':
          const dependencyGraph = await integrator.getDependencyGraph();
          return res.status(200).json({
            success: true,
            data: dependencyGraph,
            type: 'dependency_graph'
          });

        case 'detailed':
        default:
          const healthStatus = await integrator.performSystemHealthCheck();
          return res.status(200).json({
            success: true,
            data: healthStatus,
            type: 'health_check_detailed',
            checkedAt: new Date().toISOString()
          });
      }
    }

    if (req.method === 'POST') {
      const { action, serviceId } = req.body;

      switch (action) {
        case 'health_check':
          const healthResults = await integrator.performSystemHealthCheck();
          return res.status(200).json({
            success: true,
            data: healthResults,
            message: 'Health check completed'
          });

        case 'restart_service':
          if (!serviceId) {
            return res.status(400).json({ error: 'Service ID is required for restart' });
          }

          const restartSuccess = await integrator.restartService(serviceId);
          if (restartSuccess) {
            return res.status(200).json({
              success: true,
              message: `Service ${serviceId} restarted successfully`
            });
          } else {
            return res.status(500).json({
              error: `Failed to restart service ${serviceId}`
            });
          }

        case 'get_overview':
          const overview = await integrator.getSystemOverview();
          return res.status(200).json({
            success: true,
            data: overview,
            type: 'system_overview'
          });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('System health API error:', error);

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (error.message?.includes('Rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (error.message?.includes('Service not found') || error.message?.includes('Unknown service')) {
      return res.status(404).json({ error: 'Service not found' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'System health check failed'
    });
  }
}