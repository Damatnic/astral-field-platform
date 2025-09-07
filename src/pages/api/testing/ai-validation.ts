import { NextApiRequest, NextApiResponse } from 'next';
import { AIAccuracyValidator } from '../../../services/testing/aiAccuracyValidator';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';

const validator = new AIAccuracyValidator();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const allowed = await rateLimitMiddleware(req, res, {
    maxRequests: 10, // Lower limit for testing endpoints as they can be resource-intensive
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `ai-validation:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
  });

  if (!allowed) return;

  try {
    const userId = await authenticateUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // For testing endpoints, you might want additional authorization checks
    // to ensure only authorized users can run comprehensive tests

    if (req.method === 'POST') {
      const { action, testType, serviceFilter } = req.body;

      switch (action) {
        case 'run_comprehensive_validation':
          // Run full validation suite
          const validationSuite = await validator.runComprehensiveValidation();
          
          return res.status(200).json({
            success: true,
            data: validationSuite,
            message: 'Comprehensive validation completed',
            executionTime: validationSuite.overallResults.executionTime
          });

        case 'run_service_validation':
          if (!serviceFilter) {
            return res.status(400).json({ error: 'Service filter is required' });
          }
          
          // This would run validation for specific service only
          // For now, run comprehensive and filter results
          const serviceValidation = await validator.runComprehensiveValidation();
          
          // Filter results by service
          const filteredResults = {
            ...serviceValidation,
            serviceResults: Object.fromEntries(
              Object.entries(serviceValidation.serviceResults).filter(
                ([service]) => service === serviceFilter
              )
            )
          };
          
          return res.status(200).json({
            success: true,
            data: filteredResults,
            message: `Validation completed for ${serviceFilter}`
          });

        case 'validate_accuracy_thresholds':
          const currentMetrics = await validator.getCurrentAccuracyMetrics();
          
          return res.status(200).json({
            success: true,
            data: currentMetrics,
            message: 'Current accuracy metrics retrieved'
          });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    if (req.method === 'GET') {
      const { type, days, service } = req.query;

      switch (type) {
        case 'history':
          const daysBack = days ? parseInt(days as string) : 30;
          const history = await validator.getValidationHistory(daysBack);
          
          return res.status(200).json({
            success: true,
            data: history,
            type: 'validation_history',
            period: `${daysBack} days`
          });

        case 'current_metrics':
          const metrics = await validator.getCurrentAccuracyMetrics();
          
          // Filter by service if specified
          const filteredMetrics = service && typeof service === 'string' 
            ? { [service]: metrics[service] } 
            : metrics;
          
          return res.status(200).json({
            success: true,
            data: filteredMetrics,
            type: 'accuracy_metrics',
            lastUpdated: new Date().toISOString()
          });

        case 'validation_status':
          // Get overall system validation status
          const allMetrics = await validator.getCurrentAccuracyMetrics();
          
          const systemStatus = {
            totalServices: Object.keys(allMetrics).length,
            servicesAboveBaseline: Object.values(allMetrics).filter(m => m.accuracy > 0.7).length,
            averageAccuracy: Object.values(allMetrics).reduce((sum, m) => sum + m.accuracy, 0) / Object.values(allMetrics).length || 0,
            lastValidationRun: Object.values(allMetrics)[0]?.lastUpdated || null,
            systemHealthStatus: calculateSystemHealth(allMetrics)
          };
          
          return res.status(200).json({
            success: true,
            data: systemStatus,
            type: 'system_validation_status'
          });

        case 'test_templates':
          // Return available test templates and types
          const testInfo = {
            availableTestTypes: [
              {
                type: 'prediction',
                name: 'Prediction Accuracy Tests',
                description: 'Tests for ML prediction accuracy and confidence',
                services: ['mlPipeline'],
                estimatedTime: '15-30 seconds'
              },
              {
                type: 'recommendation',
                name: 'Recommendation Quality Tests', 
                description: 'Tests for AI recommendation relevance and quality',
                services: ['oracle'],
                estimatedTime: '20-35 seconds'
              },
              {
                type: 'analysis',
                name: 'Analysis Accuracy Tests',
                description: 'Tests for data analysis and insight generation',
                services: ['oracle', 'userBehavior', 'seasonStrategy'],
                estimatedTime: '25-40 seconds'
              },
              {
                type: 'strategy',
                name: 'Strategy Generation Tests',
                description: 'Tests for strategic recommendations and planning',
                services: ['seasonStrategy', 'autoDraft'],
                estimatedTime: '30-60 seconds'
              },
              {
                type: 'trade_evaluation',
                name: 'Trade Analysis Tests',
                description: 'Tests for trade evaluation and fairness scoring',
                services: ['tradeAnalysis'],
                estimatedTime: '20-30 seconds'
              }
            ],
            totalEstimatedTime: '90-180 seconds for comprehensive validation'
          };
          
          return res.status(200).json({
            success: true,
            data: testInfo,
            type: 'test_templates'
          });

        default:
          const defaultMetrics = await validator.getCurrentAccuracyMetrics();
          return res.status(200).json({
            success: true,
            data: defaultMetrics,
            type: 'default_metrics'
          });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('AI validation API error:', error);

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (error.message?.includes('Rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (error.message?.includes('Service not found') || error.message?.includes('Invalid service')) {
      return res.status(404).json({ error: 'Service not found or invalid' });
    }

    if (error.message?.includes('Validation timeout') || error.message?.includes('timeout')) {
      return res.status(408).json({ 
        error: 'Validation timeout',
        message: 'The validation process took too long to complete. This may indicate system performance issues.'
      });
    }

    if (error.message?.includes('Insufficient data') || error.message?.includes('No test data')) {
      return res.status(422).json({ 
        error: 'Insufficient test data',
        message: 'Not enough data available to run comprehensive validation tests.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'AI validation failed'
    });
  }
}

function calculateSystemHealth(metrics: Record<string, any>): 'healthy' | 'warning' | 'critical' {
  const services = Object.values(metrics);
  if (services.length === 0) return 'critical';
  
  const averageAccuracy = services.reduce((sum: number, m: any) => sum + (m.accuracy || 0), 0) / services.length;
  const criticalServices = services.filter((m: any) => (m.accuracy || 0) < 0.6).length;
  const warningServices = services.filter((m: any) => (m.accuracy || 0) < 0.75 && (m.accuracy || 0) >= 0.6).length;
  
  if (criticalServices > 0 || averageAccuracy < 0.6) {
    return 'critical';
  } else if (warningServices > services.length * 0.3 || averageAccuracy < 0.75) {
    return 'warning';
  } else {
    return 'healthy';
  }
}
