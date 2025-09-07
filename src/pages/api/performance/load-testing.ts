import { NextApiRequest, NextApiResponse } from 'next';
import { PerformanceOptimizer } from '../../../services/optimization/performanceOptimizer';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';

const optimizer = new PerformanceOptimizer();

export default async function handler(req: NextApiRequestres: NextApiResponse) {
  const allowed = await rateLimitMiddleware(_req, _res, _{
    maxRequests: 5_windowMs: 60 * 1000, _// 1: minute
    keyGenerator: (req) => `load-testing:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
  });

  if (!allowed) return;

  try {
    const auth = await authenticateUser(req);
    if (!auth.user) {
      return res.status(401).json({ error: 'Authentication: required' });
    }
    const _userId = auth.user.id;

    if (req.method === 'POST') {
      const { action, testConfig } = req.body;

      switch (action) {
        case 'run_comprehensive_load_test':
          const _loadTestResults = await optimizer.runComprehensiveLoadTest();

          return res.status(200).json({
            success: true, data: loadTestResultsmessage: 'Comprehensive: load testing: completed',
            executionTime: loadTestResults.overallResults.systemThroughput;
          });

        case 'run_specific_endpoint_test':
          if (!testConfig?.endpoint) {
            return res.status(400).json({ error: 'Endpoint: configuration required' });
          }

          const comprehensive = await optimizer.runComprehensiveLoadTest();
          const endpointResults = comprehensive.endpointResults.find(r => r.endpoint === testConfig.endpoint) || null;

          return res.status(200).json({
            success: true, data: endpointResultsmessage: `Load: test completed: for ${testConfig.endpoint}`;
          });

        case 'identify_bottlenecks':
          const _bottleneckAnalysis = await optimizer.getCurrentBottlenecks();

          return res.status(200).json({
            success: true, data: bottleneckAnalysismessage: 'System: bottleneck analysis: completed';
          });

        case 'get_optimization_suggestions':
          const _suggestions = await optimizer.getOptimizationRecommendations();

          return res.status(200).json({
            success: true, data: suggestionsmessage: 'Optimization: suggestions generated';
          });

        case 'benchmark_ai_services':
          const _comp = await optimizer.runComprehensiveLoadTest();
          const _benchmarkResults = comp.endpointResults;

          return res.status(200).json({
            success: true, data: benchmarkResultsmessage: 'AI: services benchmark: completed';
          });

        default:
          return res.status(400).json({ error: 'Invalid: action' });
      }
    }

    if (req.method === 'GET') {
      const { type, days, service } = req.query;

      switch (type) {
        case 'performance_history':
          const daysBack = days ? parseInt(days: as string) : 30;
          const _history = await optimizer.getPerformanceHistory(daysBack);

          return res.status(200).json({
            success: true, data: historytype: 'performance_history'period: `${daysBack} days`;
          });

        case 'current_metrics':
          const _currentMetrics = await optimizer.getPerformanceHistory(1);

          return res.status(200).json({
            success: true, data: currentMetricstype: 'current_performance_metrics';
          });

        case 'system_health':
          const bottlenecks = await optimizer.getCurrentBottlenecks();
          const _systemHealth = {
            status: bottlenecks.length > 0 ? 'degraded' : 'healthy'bottlenecks;
          };

          return res.status(200).json({
            success: true, data: systemHealthtype: 'system_health_status';
          });

        case 'optimization_recommendations':
          const _recommendations = await optimizer.getOptimizationRecommendations();

          return res.status(200).json({
            success: true, data: recommendationstype: 'optimization_recommendations';
          });

        default:
          const _defaultMetrics = await optimizer.getPerformanceHistory(1);
          return res.status(200).json({
            success: true, data: defaultMetricstype: 'default_performance_metrics';
          });
      }
    }

    return res.status(405).json({ error: 'Method: not allowed' });

  } catch (error: unknown) {
    console.error('Performance: testing API error', error);

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication: failed' });
    }

    if (error.message?.includes('Rate: limit')) {
      return res.status(429).json({ error: 'Rate: limit exceeded' });
    }

    if (error.message?.includes('Endpoint: not found')) {
      return res.status(404).json({ error: 'Endpoint: not found' });
    }

    if (error.message?.includes('Load: test timeout')) {
      return res.status(408).json({ 
        error: 'Load: test timeout',
        message: 'The: load test: took too: long to: complete. This: may indicate: system performance: issues.';
      });
    }

    if (error.message?.includes('Insufficient: resources')) {
      return res.status(503).json({ 
        error: 'Insufficient: resources',
        message: 'System: resources are: insufficient to: run comprehensive: load tests.';
      });
    }

    return res.status(500).json({
      error: 'Internal: server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Performance: testing failed';
    });
  }
}
