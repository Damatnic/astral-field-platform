/**
 * Deployment Rollback API Endpoint
 * Handles manual rollback triggers and rollback status
 */

import { NextRequest, NextResponse } from 'next/server';
import rollbackManager from '@/lib/deployment/rollback-manager';
import { sentryUtils } from '@/lib/monitoring/sentry-config';

// GET - Get rollback status and deployment history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'history') {
      const deploymentHistory = rollbackManager.getDeploymentHistory();
      return NextResponse.json({
        success: true,
        deployments: deploymentHistory,
        current: rollbackManager.getCurrentDeployment(),
      });
    }

    if (action === 'criteria') {
      const criteria = rollbackManager.getRollbackCriteria();
      return NextResponse.json({
        success: true,
        criteria,
      });
    }

    if (action === 'status') {
      const currentDeployment = rollbackManager.getCurrentDeployment();
      const isMonitoring = currentDeployment?.status === 'deploying';
      
      return NextResponse.json({
        success: true,
        monitoring: isMonitoring,
        currentDeployment,
        criteria: rollbackManager.getRollbackCriteria(),
      });
    }

    // Default: return current status
    const currentDeployment = rollbackManager.getCurrentDeployment();
    return NextResponse.json({
      success: true,
      currentDeployment,
      monitoring: currentDeployment?.status === 'deploying',
    });

  } catch (error) {
    console.error('Rollback status error:', error);
    
    sentryUtils.captureError(error as Error, {
      component: 'rollback-api',
      feature: 'get-status',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get rollback status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Trigger manual rollback or record deployment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'trigger') {
      const { reason, force } = data;

      if (!reason) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rollback reason is required',
          },
          { status: 400 }
        );
      }

      // Check if there's a current deployment to rollback
      const currentDeployment = rollbackManager.getCurrentDeployment();
      if (!currentDeployment) {
        return NextResponse.json(
          {
            success: false,
            error: 'No current deployment found to rollback',
          },
          { status: 400 }
        );
      }

      // Prevent rollback if already rolled back (unless forced)
      if (currentDeployment.status === 'rolled_back' && !force) {
        return NextResponse.json(
          {
            success: false,
            error: 'Current deployment is already rolled back',
          },
          { status: 400 }
        );
      }

      console.log(`🔄 Manual rollback triggered by API: ${reason}`);

      // Execute rollback
      const result = await rollbackManager.triggerManualRollback(reason);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Rollback completed successfully',
          result,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Rollback failed',
            details: result.reason,
            result,
          },
          { status: 500 }
        );
      }
    }

    if (action === 'record') {
      const { id, url, version, environment } = data;

      // Validate required fields
      if (!id || !url || !version || !environment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields: id, url, version, environment',
          },
          { status: 400 }
        );
      }

      if (!['staging', 'production'].includes(environment)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Environment must be staging or production',
          },
          { status: 400 }
        );
      }

      // Record the deployment
      const deployment = rollbackManager.recordDeployment({
        id,
        url,
        version,
        environment: environment as 'staging' | 'production',
      });

      console.log(`📦 New deployment recorded: ${id} (${environment})`);

      return NextResponse.json({
        success: true,
        message: 'Deployment recorded successfully',
        deployment,
      });
    }

    if (action === 'update-criteria') {
      const criteria = data.criteria;

      if (!criteria || typeof criteria !== 'object') {
        return NextResponse.json(
          {
            success: false,
            error: 'Criteria object is required',
          },
          { status: 400 }
        );
      }

      // Validate criteria values
      const validCriteria = ['maxErrorRate', 'maxResponseTime', 'minHealthScore', 'minSuccessRate', 'maxCriticalAlerts', 'healthCheckWindow', 'evaluationPeriod'];
      const invalidKeys = Object.keys(criteria).filter(key => !validCriteria.includes(key));

      if (invalidKeys.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid criteria keys: ${invalidKeys.join(', ')}`,
            validKeys: validCriteria,
          },
          { status: 400 }
        );
      }

      rollbackManager.updateRollbackCriteria(criteria);

      return NextResponse.json({
        success: true,
        message: 'Rollback criteria updated successfully',
        criteria: rollbackManager.getRollbackCriteria(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Supported actions: trigger, record, update-criteria',
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Rollback API error:', error);
    
    sentryUtils.captureError(error as Error, {
      component: 'rollback-api',
      feature: 'post-action',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH - Update deployment status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { deploymentId, status, healthScore, metrics } = body;

    if (!deploymentId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'deploymentId and status are required',
        },
        { status: 400 }
      );
    }

    const validStatuses = ['deploying', 'active', 'rolled_back', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // This is a simplified implementation
    // In a real system, you'd update the deployment record in the rollback manager
    const currentDeployment = rollbackManager.getCurrentDeployment();
    
    if (currentDeployment && currentDeployment.id === deploymentId) {
      currentDeployment.status = status as any;
      
      if (healthScore !== undefined) {
        currentDeployment.healthScore = healthScore;
      }
      
      if (metrics) {
        currentDeployment.metrics = metrics;
      }

      return NextResponse.json({
        success: true,
        message: 'Deployment status updated',
        deployment: currentDeployment,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Deployment not found or not current',
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Rollback update error:', error);
    
    sentryUtils.captureError(error as Error, {
      component: 'rollback-api',
      feature: 'update-status',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update deployment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Clear deployment history or cancel rollback monitoring
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'clear-history') {
      // This would clear deployment history
      // Implementation depends on how you want to handle this
      return NextResponse.json({
        success: true,
        message: 'Deployment history cleared (not implemented)',
      });
    }

    if (action === 'cancel-monitoring') {
      // This would stop active monitoring
      return NextResponse.json({
        success: true,
        message: 'Monitoring cancelled (not implemented)',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Supported actions: clear-history, cancel-monitoring',
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Rollback delete error:', error);
    
    sentryUtils.captureError(error as Error, {
      component: 'rollback-api',
      feature: 'delete-action',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process delete request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}