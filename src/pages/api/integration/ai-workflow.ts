import { NextApiRequest, NextApiResponse } from 'next';
import { AISystemsIntegrator } from '../../../services/integration/aiSystemsIntegrator';
import { authenticateUser } from '../../../lib/auth-utils';
import { rateLimitMiddleware } from '../../../lib/rate-limit';

const integrator = new AISystemsIntegrator();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rateLimitResult = await rateLimitMiddleware(req, res, {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => `ai-workflow:${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
  });

  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter
    });
  }

  try {
    const userId = await authenticateUser(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.method === 'POST') {
      const { workflowType, leagueId, parameters = {} } = req.body;

      if (!workflowType || !leagueId) {
        return res.status(400).json({ 
          error: 'Workflow type and league ID are required' 
        });
      }

      // Validate workflow type
      const validWorkflowTypes = [
        'recommendation_generation',
        'trade_analysis', 
        'lineup_optimization',
        'draft_assistance',
        'season_planning'
      ];

      if (!validWorkflowTypes.includes(workflowType)) {
        return res.status(400).json({ 
          error: 'Invalid workflow type',
          validTypes: validWorkflowTypes
        });
      }

      // Execute the AI workflow
      const workflowExecution = await integrator.executeAIWorkflow(
        workflowType,
        userId,
        leagueId,
        parameters
      );

      const statusCode = workflowExecution.overallStatus === 'completed' ? 200 : 
                         workflowExecution.overallStatus === 'failed' ? 500 : 202;

      return res.status(statusCode).json({
        success: workflowExecution.overallStatus === 'completed',
        data: workflowExecution,
        message: getWorkflowStatusMessage(workflowExecution.overallStatus)
      });
    }

    if (req.method === 'GET') {
      const { workflowId, leagueId, type = 'status' } = req.query;

      if (workflowId && typeof workflowId === 'string') {
        // Get specific workflow status
        // This would require storing and retrieving workflow executions
        // For now, return a placeholder response
        return res.status(200).json({
          success: true,
          data: {
            workflowId,
            status: 'completed',
            message: 'Workflow execution details'
          }
        });
      }

      if (leagueId && typeof leagueId === 'string') {
        // Get workflow history for a league
        // This would query the database for past workflow executions
        return res.status(200).json({
          success: true,
          data: {
            workflows: [],
            message: 'No recent workflows found'
          },
          type: 'workflow_history'
        });
      }

      // Get available workflow types and their descriptions
      const workflowInfo = {
        availableWorkflows: [
          {
            type: 'recommendation_generation',
            name: 'AI Recommendation Generation',
            description: 'Generates comprehensive AI-powered recommendations for lineup, trades, and waivers',
            estimatedTime: '30-45 seconds',
            steps: ['User Analysis', 'ML Predictions', 'Oracle Insights', 'Trade Opportunities']
          },
          {
            type: 'trade_analysis',
            name: 'Advanced Trade Analysis',
            description: 'Deep analysis of trade proposals with fairness scoring and impact modeling',
            estimatedTime: '20-30 seconds',
            steps: ['Trade Evaluation', 'Impact Modeling', 'Fairness Scoring', 'Counter Offers']
          },
          {
            type: 'lineup_optimization',
            name: 'Optimal Lineup Generation',
            description: 'AI-powered lineup optimization based on matchups, projections, and risk tolerance',
            estimatedTime: '15-25 seconds',
            steps: ['Player Predictions', 'Matchup Analysis', 'Lineup Generation', 'Risk Assessment']
          },
          {
            type: 'draft_assistance',
            name: 'Draft Strategy Assistant',
            description: 'Real-time draft guidance with player valuations and strategic recommendations',
            estimatedTime: '20-30 seconds',
            steps: ['Draft Analysis', 'Player Values', 'Strategy Recommendation', 'Position Targets']
          },
          {
            type: 'season_planning',
            name: 'Season Strategy Planning',
            description: 'Comprehensive season-long strategic planning with playoff projections',
            estimatedTime: '45-60 seconds',
            steps: ['Team Analysis', 'Playoff Projections', 'Phase Strategies', 'Performance Tracking']
          }
        ]
      };

      return res.status(200).json({
        success: true,
        data: workflowInfo,
        type: 'workflow_info'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('AI workflow API error:', error);

    if (error.message?.includes('Authentication')) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    if (error.message?.includes('Rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (error.message?.includes('League not found')) {
      return res.status(404).json({ error: 'League not found' });
    }

    if (error.message?.includes('Service') && error.message?.includes('not available')) {
      return res.status(503).json({ 
        error: 'AI service temporarily unavailable',
        message: 'One or more AI services are currently unavailable. Please try again later.'
      });
    }

    if (error.message?.includes('Workflow timeout')) {
      return res.status(408).json({ 
        error: 'Workflow execution timeout',
        message: 'The AI workflow took too long to complete. Please try again.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'AI workflow execution failed'
    });
  }
}

function getWorkflowStatusMessage(status: string): string {
  switch (status) {
    case 'completed':
      return 'AI workflow completed successfully';
    case 'failed':
      return 'AI workflow failed to complete';
    case 'running':
      return 'AI workflow is still executing';
    case 'pending':
      return 'AI workflow is queued for execution';
    default:
      return 'Unknown workflow status';
  }
}