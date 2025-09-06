import { db } from '../../db/database';

interface SystemMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeUsers: number;
  aiAccuracyScores: Record<string, number>;
  resourceUtilization: {
    cpu: number;
    memory: number;
    database: number;
  };
  timestamp: Date;
}

interface UserEngagementMetrics {
  totalActiveUsers: number;
  aiFeatureUsage: Record<string, number>;
  userSatisfactionRatings: Record<string, number>;
  featureAdoptionRates: Record<string, number>;
  sessionDurations: number[];
  bounceRate: number;
  timestamp: Date;
}

interface AIPerformanceMetrics {
  serviceName: string;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  accuracyScore: number;
  costPerRequest: number;
  errorTypes: Record<string, number>;
  timestamp: Date;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
}

export class ProductionMonitor {
  private alertRules: AlertRule[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.initializeDefaultAlertRules();
  }

  private initializeDefaultAlertRules() {
    this.alertRules = [
      {
        id: 'high_response_time',
        name: 'High Response Time',
        metric: 'response_time',
        condition: 'greater_than',
        threshold: 1000, // 1 second
        severity: 'high',
        enabled: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'greater_than',
        threshold: 0.05, // 5%
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'slack', 'pagerduty']
      },
      {
        id: 'low_ai_accuracy',
        name: 'Low AI Accuracy',
        metric: 'ai_accuracy',
        condition: 'less_than',
        threshold: 0.85, // 85%
        severity: 'medium',
        enabled: true,
        notificationChannels: ['email']
      },
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        metric: 'cpu_usage',
        condition: 'greater_than',
        threshold: 0.85, // 85%
        severity: 'high',
        enabled: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'low_user_engagement',
        name: 'Low User Engagement',
        metric: 'active_users',
        condition: 'less_than',
        threshold: 10,
        severity: 'low',
        enabled: true,
        notificationChannels: ['email']
      }
    ];
  }

  async startMonitoring(intervalMs: number = 60000) {
    if (this.isMonitoring) {
      console.log('Monitoring already started');
      return;
    }

    console.log(`Starting production monitoring with ${intervalMs/1000}s interval`);
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectAndAnalyzeMetrics();
      } catch (error) {
        console.error('Error in monitoring cycle:', error);
      }
    }, intervalMs);

    // Initial collection
    await this.collectAndAnalyzeMetrics();
  }

  async stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Production monitoring stopped');
  }

  private async collectAndAnalyzeMetrics() {
    try {
      // Collect system metrics
      const systemMetrics = await this.collectSystemMetrics();
      await this.storeSystemMetrics(systemMetrics);

      // Collect user engagement metrics
      const userMetrics = await this.collectUserEngagementMetrics();
      await this.storeUserEngagementMetrics(userMetrics);

      // Collect AI performance metrics
      const aiMetrics = await this.collectAIPerformanceMetrics();
      await this.storeAIPerformanceMetrics(aiMetrics);

      // Check alert rules
      await this.checkAlertRules(systemMetrics, userMetrics, aiMetrics);

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  private async collectSystemMetrics(): Promise<SystemMetrics> {
    // Get response time metrics
    const responseTimeQuery = await db.query(`
      SELECT AVG(response_time) as avg_response_time,
             COUNT(*) as total_requests,
             COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
      FROM api_request_logs
      WHERE created_at > NOW() - INTERVAL '5 minutes'
    `);

    const responseData = responseTimeQuery.rows[0];
    const responseTime = parseFloat(responseData?.avg_response_time || '0');
    const totalRequests = parseInt(responseData?.total_requests || '0');
    const errorCount = parseInt(responseData?.error_count || '0');
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    // Get throughput (requests per second over last 5 minutes)
    const throughput = totalRequests / (5 * 60);

    // Get active users count
    const activeUsersQuery = await db.query(`
      SELECT COUNT(DISTINCT user_id) as active_users
      FROM user_activity_logs
      WHERE created_at > NOW() - INTERVAL '5 minutes'
    `);
    const activeUsers = parseInt(activeUsersQuery.rows[0]?.active_users || '0');

    // Get AI accuracy scores
    const aiAccuracyQuery = await db.query(`
      SELECT service_name,
             AVG(accuracy_score) as avg_accuracy
      FROM ai_accuracy_metrics
      WHERE created_at > NOW() - INTERVAL '15 minutes'
      GROUP BY service_name
    `);
    
    const aiAccuracyScores: Record<string, number> = {};
    for (const row of aiAccuracyQuery.rows) {
      aiAccuracyScores[row.service_name] = parseFloat(row.avg_accuracy);
    }

    // Simulate resource utilization (would come from system monitoring in real implementation)
    const resourceUtilization = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      database: Math.random() * 100
    };

    return {
      responseTime,
      throughput,
      errorRate,
      activeUsers,
      aiAccuracyScores,
      resourceUtilization,
      timestamp: new Date()
    };
  }

  private async collectUserEngagementMetrics(): Promise<UserEngagementMetrics> {
    // Get total active users
    const activeUsersQuery = await db.query(`
      SELECT COUNT(DISTINCT user_id) as total_active_users
      FROM user_activity_logs
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);
    const totalActiveUsers = parseInt(activeUsersQuery.rows[0]?.total_active_users || '0');

    // Get AI feature usage
    const aiFeatureUsageQuery = await db.query(`
      SELECT feature_name,
             COUNT(*) as usage_count
      FROM ai_feature_usage_logs
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY feature_name
    `);
    
    const aiFeatureUsage: Record<string, number> = {};
    for (const row of aiFeatureUsageQuery.rows) {
      aiFeatureUsage[row.feature_name] = parseInt(row.usage_count);
    }

    // Get user satisfaction ratings
    const satisfactionQuery = await db.query(`
      SELECT feature_name,
             AVG(rating) as avg_rating
      FROM user_feedback_ratings
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY feature_name
    `);
    
    const userSatisfactionRatings: Record<string, number> = {};
    for (const row of satisfactionQuery.rows) {
      userSatisfactionRatings[row.feature_name] = parseFloat(row.avg_rating);
    }

    // Get feature adoption rates
    const adoptionQuery = await db.query(`
      SELECT feature_name,
             COUNT(DISTINCT user_id)::float / NULLIF((SELECT COUNT(*) FROM users WHERE is_active = true), 0) as adoption_rate
      FROM ai_feature_usage_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY feature_name
    `);
    
    const featureAdoptionRates: Record<string, number> = {};
    for (const row of adoptionQuery.rows) {
      featureAdoptionRates[row.feature_name] = parseFloat(row.adoption_rate || '0');
    }

    // Get session durations
    const sessionDurationQuery = await db.query(`
      SELECT session_duration
      FROM user_sessions
      WHERE created_at > NOW() - INTERVAL '1 hour'
      AND session_duration IS NOT NULL
      LIMIT 1000
    `);
    
    const sessionDurations = sessionDurationQuery.rows.map(row => parseInt(row.session_duration));

    // Calculate bounce rate (simplified - sessions < 30 seconds)
    const shortSessions = sessionDurations.filter(duration => duration < 30).length;
    const bounceRate = sessionDurations.length > 0 ? shortSessions / sessionDurations.length : 0;

    return {
      totalActiveUsers,
      aiFeatureUsage,
      userSatisfactionRatings,
      featureAdoptionRates,
      sessionDurations,
      bounceRate,
      timestamp: new Date()
    };
  }

  private async collectAIPerformanceMetrics(): Promise<AIPerformanceMetrics[]> {
    const aiServices = ['oracle', 'mlPipeline', 'tradeAnalysis', 'autoDraft', 'seasonStrategy', 'userBehavior'];
    const metrics: AIPerformanceMetrics[] = [];

    for (const serviceName of aiServices) {
      const performanceQuery = await db.query(`
        SELECT COUNT(*) as total_requests,
               COUNT(CASE WHEN success = true THEN 1 END) as successful_requests,
               AVG(response_time_ms) as avg_response_time,
               AVG(cost_cents) as avg_cost,
               AVG(accuracy_score) as avg_accuracy
        FROM ai_service_logs
        WHERE service_name = $1
          AND created_at > NOW() - INTERVAL '15 minutes'
      `, [serviceName]);

      const errorTypesQuery = await db.query(`
        SELECT error_type,
               COUNT(*) as error_count
        FROM ai_service_logs
        WHERE service_name = $1
          AND success = false
          AND created_at > NOW() - INTERVAL '15 minutes'
        GROUP BY error_type
      `, [serviceName]);

      const data = performanceQuery.rows[0];
      const totalRequests = parseInt(data?.total_requests || '0');
      const successfulRequests = parseInt(data?.successful_requests || '0');
      const averageResponseTime = parseFloat(data?.avg_response_time || '0');
      const accuracyScore = parseFloat(data?.avg_accuracy || '0');
      const costPerRequest = parseFloat(data?.avg_cost || '0') / 100; // Convert cents to dollars

      const errorTypes: Record<string, number> = {};
      for (const row of errorTypesQuery.rows) {
        errorTypes[row.error_type] = parseInt(row.error_count);
      }

      metrics.push({
        serviceName,
        totalRequests,
        successfulRequests,
        averageResponseTime,
        accuracyScore,
        costPerRequest,
        errorTypes,
        timestamp: new Date()
      });
    }

    return metrics;
  }

  private async storeSystemMetrics(metrics: SystemMetrics) {
    await db.query(`
      INSERT INTO production_system_metrics (
        response_time, throughput, error_rate, active_users,
        ai_accuracy_scores, cpu_usage, memory_usage, database_usage,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      metrics.responseTime,
      metrics.throughput,
      metrics.errorRate,
      metrics.activeUsers,
      JSON.stringify(metrics.aiAccuracyScores),
      metrics.resourceUtilization.cpu,
      metrics.resourceUtilization.memory,
      metrics.resourceUtilization.database,
      metrics.timestamp
    ]);
  }

  private async storeUserEngagementMetrics(metrics: UserEngagementMetrics) {
    await db.query(`
      INSERT INTO production_user_engagement_metrics (
        total_active_users, ai_feature_usage, user_satisfaction_ratings,
        feature_adoption_rates, average_session_duration, bounce_rate,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      metrics.totalActiveUsers,
      JSON.stringify(metrics.aiFeatureUsage),
      JSON.stringify(metrics.userSatisfactionRatings),
      JSON.stringify(metrics.featureAdoptionRates),
      metrics.sessionDurations.reduce((a, b) => a + b, 0) / metrics.sessionDurations.length || 0,
      metrics.bounceRate,
      metrics.timestamp
    ]);
  }

  private async storeAIPerformanceMetrics(metrics: AIPerformanceMetrics[]) {
    for (const metric of metrics) {
      await db.query(`
        INSERT INTO production_ai_performance_metrics (
          service_name, total_requests, successful_requests,
          average_response_time, accuracy_score, cost_per_request,
          error_types, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        metric.serviceName,
        metric.totalRequests,
        metric.successfulRequests,
        metric.averageResponseTime,
        metric.accuracyScore,
        metric.costPerRequest,
        JSON.stringify(metric.errorTypes),
        metric.timestamp
      ]);
    }
  }

  private async checkAlertRules(
    systemMetrics: SystemMetrics,
    userMetrics: UserEngagementMetrics,
    aiMetrics: AIPerformanceMetrics[]
  ) {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      let metricValue: number = 0;
      let shouldAlert = false;

      // Get the current value for the metric
      switch (rule.metric) {
        case 'response_time':
          metricValue = systemMetrics.responseTime;
          break;
        case 'error_rate':
          metricValue = systemMetrics.errorRate;
          break;
        case 'cpu_usage':
          metricValue = systemMetrics.resourceUtilization.cpu / 100;
          break;
        case 'active_users':
          metricValue = userMetrics.totalActiveUsers;
          break;
        case 'ai_accuracy':
          // Check if any AI service is below threshold
          const aiAccuracies = Object.values(systemMetrics.aiAccuracyScores);
          metricValue = aiAccuracies.length > 0 ? Math.min(...aiAccuracies) : 1;
          break;
        default:
          continue;
      }

      // Check if alert condition is met
      switch (rule.condition) {
        case 'greater_than':
          shouldAlert = metricValue > rule.threshold;
          break;
        case 'less_than':
          shouldAlert = metricValue < rule.threshold;
          break;
        case 'equals':
          shouldAlert = metricValue === rule.threshold;
          break;
        case 'not_equals':
          shouldAlert = metricValue !== rule.threshold;
          break;
      }

      if (shouldAlert) {
        await this.triggerAlert(rule, metricValue);
      }
    }
  }

  private async triggerAlert(rule: AlertRule, currentValue: number) {
    const alertData = {
      ruleId: rule.id,
      ruleName: rule.name,
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      severity: rule.severity,
      timestamp: new Date()
    };

    // Store alert in database
    await db.query(`
      INSERT INTO production_alerts (
        rule_id, rule_name, metric, current_value, threshold,
        severity, notification_channels, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      alertData.ruleId,
      alertData.ruleName,
      alertData.metric,
      alertData.currentValue,
      alertData.threshold,
      alertData.severity,
      JSON.stringify(rule.notificationChannels),
      alertData.timestamp
    ]);

    // Send notifications
    await this.sendAlertNotifications(rule, alertData);

    console.log(`🚨 Alert triggered: ${rule.name} - ${alertData.metric} = ${currentValue} (threshold: ${rule.threshold})`);
  }

  private async sendAlertNotifications(rule: AlertRule, alertData: any) {
    for (const channel of rule.notificationChannels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alertData);
            break;
          case 'slack':
            await this.sendSlackAlert(alertData);
            break;
          case 'pagerduty':
            await this.sendPagerDutyAlert(alertData);
            break;
        }
      } catch (error) {
        console.error(`Failed to send alert to ${channel}:`, error);
      }
    }
  }

  private async sendEmailAlert(alertData: any) {
    // Email alert implementation would go here
    console.log(`📧 Email alert sent: ${alertData.ruleName}`);
  }

  private async sendSlackAlert(alertData: any) {
    // Slack alert implementation would go here
    console.log(`💬 Slack alert sent: ${alertData.ruleName}`);
  }

  private async sendPagerDutyAlert(alertData: any) {
    // PagerDuty alert implementation would go here
    console.log(`📟 PagerDuty alert sent: ${alertData.ruleName}`);
  }

  // Utility methods for dashboard and reporting
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: SystemMetrics | null;
    activeAlerts: number;
  }> {
    // Get latest metrics
    const metricsQuery = await db.query(`
      SELECT * FROM production_system_metrics
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const metrics = metricsQuery.rows[0];
    
    // Get active alerts count
    const alertsQuery = await db.query(`
      SELECT COUNT(*) as active_alerts
      FROM production_alerts
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);
    
    const activeAlerts = parseInt(alertsQuery.rows[0]?.active_alerts || '0');

    // Determine overall health status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (metrics) {
      const systemMetrics: SystemMetrics = {
        responseTime: parseFloat(metrics.response_time),
        throughput: parseFloat(metrics.throughput),
        errorRate: parseFloat(metrics.error_rate),
        activeUsers: parseInt(metrics.active_users),
        aiAccuracyScores: JSON.parse(metrics.ai_accuracy_scores || '{}'),
        resourceUtilization: {
          cpu: parseFloat(metrics.cpu_usage),
          memory: parseFloat(metrics.memory_usage),
          database: parseFloat(metrics.database_usage)
        },
        timestamp: new Date(metrics.created_at)
      };

      // Determine health based on metrics
      if (systemMetrics.errorRate > 0.1 || systemMetrics.responseTime > 2000) {
        status = 'critical';
      } else if (systemMetrics.errorRate > 0.05 || systemMetrics.responseTime > 1000 || activeAlerts > 0) {
        status = 'warning';
      }

      return { status, metrics: systemMetrics, activeAlerts };
    }

    return { status: 'critical', metrics: null, activeAlerts };
  }

  async getUserEngagementSummary(days: number = 7): Promise<{
    totalUsers: number;
    activeUsers: number;
    engagementTrend: 'up' | 'down' | 'stable';
    topFeatures: Array<{ feature: string; usage: number }>;
  }> {
    const summaryQuery = await db.query(`
      WITH recent_metrics AS (
        SELECT *,
               ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
        FROM production_user_engagement_metrics
        WHERE created_at > NOW() - INTERVAL '${days} days'
      ),
      latest AS (
        SELECT * FROM recent_metrics WHERE rn = 1
      ),
      previous AS (
        SELECT * FROM recent_metrics WHERE rn = (SELECT COUNT(*) / 2 FROM recent_metrics)
      )
      SELECT 
        l.total_active_users as current_users,
        p.total_active_users as previous_users,
        l.ai_feature_usage as current_features
      FROM latest l
      LEFT JOIN previous p ON true
    `);

    const data = summaryQuery.rows[0];
    const currentUsers = parseInt(data?.current_users || '0');
    const previousUsers = parseInt(data?.previous_users || '0');
    const currentFeatures = JSON.parse(data?.current_features || '{}');

    // Determine engagement trend
    let engagementTrend: 'up' | 'down' | 'stable' = 'stable';
    if (currentUsers > previousUsers * 1.1) {
      engagementTrend = 'up';
    } else if (currentUsers < previousUsers * 0.9) {
      engagementTrend = 'down';
    }

    // Get top features
    const topFeatures = Object.entries(currentFeatures)
      .map(([feature, usage]) => ({ feature, usage: usage as number }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    return {
      totalUsers: currentUsers,
      activeUsers: currentUsers,
      engagementTrend,
      topFeatures
    };
  }
}