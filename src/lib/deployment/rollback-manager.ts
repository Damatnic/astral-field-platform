/**
 * Automated Rollback Manager
 * Handles intelligent rollback decisions and execution
 */

import { sentryUtils } from '../monitoring/sentry-config';
import performanceMonitor from '../monitoring/performance-monitor';

export interface DeploymentInfo {
  id: string;
  url: string;
  version: string;
  timestamp: number;
  environment: 'staging' | 'production';
  status: 'deploying' | 'active' | 'rolled_back' | 'failed';
  healthScore?: number;
  metrics?: DeploymentMetrics;
}

export interface DeploymentMetrics {
  responseTime: number;
  errorRate: number;
  successRate: number;
  healthChecksPassed: number;
  healthChecksTotal: number;
  criticalAlerts: number;
  warningAlerts: number;
}

export interface RollbackCriteria {
  maxErrorRate: number;
  maxResponseTime: number;
  minHealthScore: number;
  minSuccessRate: number;
  maxCriticalAlerts: number;
  healthCheckWindow: number; // minutes
  evaluationPeriod: number; // minutes after deployment
}

export interface RollbackResult {
  success: boolean;
  previousVersion: string;
  currentVersion: string;
  reason: string;
  rollbackTime: number;
  metrics: {
    errorsBefore: number;
    errorsAfter: number;
    healthScoreBefore: number;
    healthScoreAfter: number;
  };
}

class RollbackManager {
  private deploymentHistory: DeploymentInfo[] = [];
  private currentDeployment: DeploymentInfo | null = null;
  private rollbackCriteria: RollbackCriteria;
  private monitoringActive = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.rollbackCriteria = {
      maxErrorRate: 5, // 5% error rate
      maxResponseTime: 3000, // 3 seconds
      minHealthScore: 70, // 70/100 health score
      minSuccessRate: 95, // 95% success rate
      maxCriticalAlerts: 3, // Max 3 critical alerts
      healthCheckWindow: 5, // 5 minute window
      evaluationPeriod: 10, // Monitor for 10 minutes post-deployment
    };
  }

  // Record a new deployment
  recordDeployment(deployment: Omit<DeploymentInfo, 'timestamp' | 'status'>) {
    const deploymentInfo: DeploymentInfo = {
      ...deployment,
      timestamp: Date.now(),
      status: 'deploying',
    };

    this.deploymentHistory.push(deploymentInfo);
    this.currentDeployment = deploymentInfo;

    // Keep only last 10 deployments
    if (this.deploymentHistory.length > 10) {
      this.deploymentHistory = this.deploymentHistory.slice(-10);
    }

    console.log(`📦 Recorded deployment: ${deployment.id} to ${deployment.environment}`);
    
    // Start monitoring for this deployment
    this.startPostDeploymentMonitoring();

    return deploymentInfo;
  }

  // Start monitoring after deployment
  private startPostDeploymentMonitoring() {
    if (!this.currentDeployment) return;

    this.monitoringActive = true;
    const startTime = Date.now();
    const evaluationEndTime = startTime + (this.rollbackCriteria.evaluationPeriod * 60 * 1000);

    console.log(`🔍 Starting post-deployment monitoring for ${this.rollbackCriteria.evaluationPeriod} minutes`);

    this.monitoringInterval = setInterval(async () => {
      const now = Date.now();
      
      // Stop monitoring after evaluation period
      if (now > evaluationEndTime) {
        this.stopPostDeploymentMonitoring();
        
        if (this.currentDeployment) {
          this.currentDeployment.status = 'active';
          console.log(`✅ Deployment ${this.currentDeployment.id} monitoring completed successfully`);
        }
        return;
      }

      // Check if rollback is needed
      const shouldRollback = await this.evaluateRollbackNeed();
      if (shouldRollback.shouldRollback) {
        console.log(`🚨 Rollback triggered: ${shouldRollback.reason}`);
        
        try {
          const result = await this.executeRollback(shouldRollback.reason);
          if (result.success) {
            console.log(`✅ Rollback completed successfully`);
            this.notifyRollback(result, true);
          } else {
            console.error(`❌ Rollback failed`);
            this.notifyRollback(result, false);
          }
        } catch (error) {
          console.error('Rollback execution error:', error);
          sentryUtils.captureError(error as Error, {
            component: 'rollback-manager',
            feature: 'automated-rollback',
            extra: { deployment: this.currentDeployment },
          });
        }
        
        this.stopPostDeploymentMonitoring();
      }
    }, 30000); // Check every 30 seconds
  }

  // Stop post-deployment monitoring
  private stopPostDeploymentMonitoring() {
    this.monitoringActive = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  // Evaluate if rollback is needed
  private async evaluateRollbackNeed(): Promise<{
    shouldRollback: boolean;
    reason: string;
    metrics: DeploymentMetrics;
  }> {
    if (!this.currentDeployment) {
      return { shouldRollback: false, reason: '', metrics: this.getEmptyMetrics() };
    }

    try {
      // Get current system health
      const systemHealth = await performanceMonitor.getSystemHealth();
      const metrics = await this.collectDeploymentMetrics();

      // Update current deployment metrics
      this.currentDeployment.metrics = metrics;
      this.currentDeployment.healthScore = systemHealth.score;

      // Check each rollback criterion
      const failures = [];

      if (metrics.errorRate > this.rollbackCriteria.maxErrorRate) {
        failures.push(`Error rate ${metrics.errorRate}% exceeds threshold ${this.rollbackCriteria.maxErrorRate}%`);
      }

      if (metrics.responseTime > this.rollbackCriteria.maxResponseTime) {
        failures.push(`Response time ${metrics.responseTime}ms exceeds threshold ${this.rollbackCriteria.maxResponseTime}ms`);
      }

      if (systemHealth.score < this.rollbackCriteria.minHealthScore) {
        failures.push(`Health score ${systemHealth.score} below threshold ${this.rollbackCriteria.minHealthScore}`);
      }

      if (metrics.successRate < this.rollbackCriteria.minSuccessRate) {
        failures.push(`Success rate ${metrics.successRate}% below threshold ${this.rollbackCriteria.minSuccessRate}%`);
      }

      if (metrics.criticalAlerts > this.rollbackCriteria.maxCriticalAlerts) {
        failures.push(`Critical alerts ${metrics.criticalAlerts} exceed threshold ${this.rollbackCriteria.maxCriticalAlerts}`);
      }

      // Health checks failing
      const healthCheckPassRate = (metrics.healthChecksPassed / metrics.healthChecksTotal) * 100;
      if (healthCheckPassRate < 80) { // 80% health check pass rate
        failures.push(`Health check pass rate ${healthCheckPassRate.toFixed(1)}% below 80%`);
      }

      const shouldRollback = failures.length > 0;
      const reason = failures.join('; ');

      if (shouldRollback) {
        // Log the decision
        sentryUtils.captureError(new Error('Automated rollback triggered'), {
          component: 'rollback-manager',
          feature: 'rollback-decision',
          extra: {
            deployment: this.currentDeployment,
            metrics,
            failures,
            systemHealth: systemHealth.score,
          },
        });
      }

      return { shouldRollback, reason, metrics };

    } catch (error) {
      console.error('Error evaluating rollback need:', error);
      
      // In case of evaluation error, don't rollback but log the issue
      sentryUtils.captureError(error as Error, {
        component: 'rollback-manager',
        feature: 'rollback-evaluation',
      });

      return { shouldRollback: false, reason: 'Evaluation error', metrics: this.getEmptyMetrics() };
    }
  }

  // Execute the rollback
  private async executeRollback(reason: string): Promise<RollbackResult> {
    if (!this.currentDeployment) {
      throw new Error('No current deployment to rollback');
    }

    const previousDeployment = this.getPreviousDeployment();
    if (!previousDeployment) {
      throw new Error('No previous deployment found for rollback');
    }

    const rollbackStartTime = Date.now();
    const currentVersion = this.currentDeployment.version;
    const previousVersion = previousDeployment.version;

    try {
      // Collect metrics before rollback
      const metricsBefore = await this.collectDeploymentMetrics();
      const healthBefore = await performanceMonitor.getSystemHealth();

      console.log(`🔄 Rolling back from ${currentVersion} to ${previousVersion}`);

      // Execute rollback based on environment
      if (this.currentDeployment.environment === 'production') {
        await this.rollbackProduction(previousDeployment);
      } else {
        await this.rollbackStaging(previousDeployment);
      }

      // Wait for rollback to take effect
      await this.waitForRollbackCompletion();

      // Collect metrics after rollback
      const metricsAfter = await this.collectDeploymentMetrics();
      const healthAfter = await performanceMonitor.getSystemHealth();

      // Update deployment status
      this.currentDeployment.status = 'rolled_back';
      previousDeployment.status = 'active';
      this.currentDeployment = previousDeployment;

      const rollbackTime = Date.now() - rollbackStartTime;

      console.log(`✅ Rollback completed in ${rollbackTime}ms`);

      return {
        success: true,
        previousVersion,
        currentVersion,
        reason,
        rollbackTime,
        metrics: {
          errorsBefore: metricsBefore.errorRate,
          errorsAfter: metricsAfter.errorRate,
          healthScoreBefore: healthBefore.score,
          healthScoreAfter: healthAfter.score,
        },
      };

    } catch (error) {
      console.error('Rollback execution failed:', error);
      
      const rollbackTime = Date.now() - rollbackStartTime;

      return {
        success: false,
        previousVersion,
        currentVersion,
        reason: `Rollback failed: ${(error as Error).message}`,
        rollbackTime,
        metrics: {
          errorsBefore: 0,
          errorsAfter: 0,
          healthScoreBefore: 0,
          healthScoreAfter: 0,
        },
      };
    }
  }

  // Rollback production deployment
  private async rollbackProduction(targetDeployment: DeploymentInfo) {
    // This would integrate with your deployment platform (Vercel, AWS, etc.)
    // For Vercel, this might look like:
    
    const vercelToken = process.env.VERCEL_TOKEN;
    if (!vercelToken) {
      throw new Error('VERCEL_TOKEN not configured');
    }

    try {
      // Use Vercel API to promote previous deployment
      const response = await fetch('https://api.vercel.com/v9/projects/astral-field/domains', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'astral-field.vercel.app',
          target: targetDeployment.url,
        }),
      });

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status}`);
      }

      console.log('✅ Vercel domain updated to previous deployment');
      
    } catch (error) {
      console.error('Vercel rollback failed:', error);
      throw new Error(`Production rollback failed: ${(error as Error).message}`);
    }
  }

  // Rollback staging deployment
  private async rollbackStaging(targetDeployment: DeploymentInfo) {
    // Similar to production but for staging environment
    console.log('🔄 Rolling back staging deployment');
    
    // Implementation would depend on your staging setup
    // This is a placeholder for staging rollback logic
  }

  // Wait for rollback to complete and stabilize
  private async waitForRollbackCompletion() {
    console.log('⏳ Waiting for rollback to stabilize...');
    
    // Wait for 60 seconds to allow the rollback to take effect
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Perform health checks to confirm rollback success
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch('/api/monitoring/health?service=system');
        if (response.ok) {
          const health = await response.json();
          if (health.overall !== 'unhealthy') {
            console.log('✅ Rollback health checks passed');
            return;
          }
        }
      } catch (error) {
        console.log(`Health check attempt ${attempts + 1} failed`);
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between attempts
    }
    
    console.warn('⚠️ Rollback completed but health checks are still failing');
  }

  // Collect current deployment metrics
  private async collectDeploymentMetrics(): Promise<DeploymentMetrics> {
    try {
      const systemHealth = await performanceMonitor.getSystemHealth();
      const insights = performanceMonitor.getPerformanceInsights();
      
      // Calculate error rate from recent metrics
      const recentMetrics = systemHealth.metrics.slice(-20); // Last 20 metrics
      const apiMetrics = recentMetrics.filter(m => m.name === 'api_requests_total');
      
      let totalRequests = 0;
      let errorRequests = 0;
      
      apiMetrics.forEach(metric => {
        totalRequests++;
        const status = parseInt(metric.tags?.status || '200');
        if (status >= 400) {
          errorRequests++;
        }
      });
      
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
      const successRate = 100 - errorRate;
      
      // Get average response time
      const responseTimeMetrics = recentMetrics.filter(m => m.name === 'api_response_time');
      const avgResponseTime = responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
        : 0;
      
      // Count alerts
      const criticalAlerts = systemHealth.alerts?.filter(a => a.type === 'critical' && !a.resolved).length || 0;
      const warningAlerts = systemHealth.alerts?.filter(a => a.type === 'warning' && !a.resolved).length || 0;
      
      return {
        responseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        healthChecksPassed: systemHealth.summary?.healthy || 0,
        healthChecksTotal: systemHealth.summary?.total || 1,
        criticalAlerts,
        warningAlerts,
      };
      
    } catch (error) {
      console.error('Error collecting deployment metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  // Get empty metrics fallback
  private getEmptyMetrics(): DeploymentMetrics {
    return {
      responseTime: 0,
      errorRate: 0,
      successRate: 100,
      healthChecksPassed: 1,
      healthChecksTotal: 1,
      criticalAlerts: 0,
      warningAlerts: 0,
    };
  }

  // Get previous stable deployment
  private getPreviousDeployment(): DeploymentInfo | null {
    const stableDeployments = this.deploymentHistory
      .filter(d => d.status === 'active' && d.id !== this.currentDeployment?.id)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return stableDeployments[0] || null;
  }

  // Send rollback notifications
  private notifyRollback(result: RollbackResult, success: boolean) {
    const message = success
      ? `✅ Automated rollback completed successfully\\nRolled back from ${result.currentVersion} to ${result.previousVersion}\\nReason: ${result.reason}`
      : `❌ Automated rollback failed\\nAttempted rollback from ${result.currentVersion} to ${result.previousVersion}\\nReason: ${result.reason}`;

    // Send to monitoring systems
    sentryUtils.captureError(new Error(success ? 'Automated rollback completed' : 'Automated rollback failed'), {
      component: 'rollback-manager',
      feature: 'rollback-notification',
      extra: result,
    });

    // Log for visibility
    console.log(message);

    // In production, you might send to Slack, email, or other notification systems
    if (process.env.SLACK_WEBHOOK_URL) {
      fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          channel: '#alerts',
          username: 'Rollback Manager',
          icon_emoji: success ? ':white_check_mark:' : ':x:',
        }),
      }).catch(error => {
        console.error('Failed to send Slack notification:', error);
      });
    }
  }

  // Manual rollback trigger
  async triggerManualRollback(reason: string): Promise<RollbackResult> {
    console.log(`🔄 Manual rollback triggered: ${reason}`);
    
    this.stopPostDeploymentMonitoring();
    return await this.executeRollback(`Manual rollback: ${reason}`);
  }

  // Get deployment history
  getDeploymentHistory(): DeploymentInfo[] {
    return [...this.deploymentHistory].sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get current deployment info
  getCurrentDeployment(): DeploymentInfo | null {
    return this.currentDeployment;
  }

  // Update rollback criteria
  updateRollbackCriteria(criteria: Partial<RollbackCriteria>) {
    this.rollbackCriteria = { ...this.rollbackCriteria, ...criteria };
    console.log('📋 Rollback criteria updated:', this.rollbackCriteria);
  }

  // Get rollback criteria
  getRollbackCriteria(): RollbackCriteria {
    return { ...this.rollbackCriteria };
  }
}

// Export singleton instance
const rollbackManager = new RollbackManager();
export default rollbackManager;