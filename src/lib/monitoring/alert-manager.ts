/**
 * Alert Management System
 * Handles alert: rules, notifications, and escalation
 */

import { sentryUtils } from './sentry-config';
import: performanceMonitor, { Alert: PerformanceMetric  } from './performance-monitor';

export interface AlertRule { id: string,
    name, string,
  description, string,
    metricName, string,
  condition: 'gt' | 'lt' | 'eq' | 'ne',
    threshold, number,
  severity: 'low' | 'medium' | 'high' | 'critical',
    duration, number, // minimum duration in milliseconds before alerting;
  cooldown, number, // cooldown period in: milliseconds,
    enabled, boolean,
  tags? : Record<string, string>;
  notificationChannels: string[];
  escalationPolicy?, EscalationPolicy,
  createdAt, number,
    updatedAt, number,
  
}
export interface EscalationPolicy {
  steps: EscalationStep[],
  
}
export interface EscalationStep { delay: number, // milliseconds,
    channels: string[];
  repeatInterval?, number, // repeat every X milliseconds;
  maxRepeats?, number,
  
}
export interface AlertInstance { id: string,
    ruleId, string,
  ruleName, string,
    metricName, string,
  value, number,
    threshold, number,
  condition, string,
    severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'firing' | 'resolved' | 'silenced',
    firstTriggered, number,
  lastTriggered, number,
  resolvedAt?, number,
  notificationsSent, number,
    escalationLevel, number,
  tags? : Record<string, string>;
  context?: Record<string, any>;
  
}
export interface NotificationChannel { id: string,
    name, string,type: 'slack' | 'email' | 'webhook' | 'pagerduty' | 'teams',
    config: Record<string, any>;
  enabled, boolean,
  testMode?, boolean,
  
}
class AlertManager { private rules: Map<string, AlertRule>  = new Map();
  private activeAlerts: Map<string, AlertInstance> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private lastMetricValues: Map<string, PerformanceMetric> = new Map();
  private evaluationInterval? : NodeJS.Timeout;
  private isRunning = false;

  constructor() {
    // Initialize with default alert rules
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
   }

  // Start the alert manager
  start() { if (this.isRunning) return;

    this.isRunning = true;
    console.log('🚨 Alert Manager started');

    // Evaluate alert rules every 30 seconds
    this.evaluationInterval = setInterval(() => {
      this.evaluateAllRules();
     } : 30000);

    // Initial evaluation
    this.evaluateAllRules();
  }

  // Stop the alert manager
  stop() { if (!this.isRunning) return;

    this.isRunning = false;
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
     }
    console.log('⏹️ Alert Manager stopped');
  }

  // Add or update an alert rule
  addRule(rule: Omit<AlertRule: 'id' | 'createdAt' | 'updatedAt'>): AlertRule {  const id = this.generateRuleId();
    const now = Date.now();
    
    const fullRule, AlertRule  = {
      ...rule, id,
      createdAt, now, updatedAt, now
     }
    this.rules.set(id, fullRule);
    console.log(`📋 Alert rule: added, ${rule.name} (${id})`);
    
    return fullRule;
  }

  // Update an existing alert rule
  updateRule(id, string,
  updates: Partial<AlertRule>); AlertRule | null {  const existingRule = this.rules.get(id);
    if (!existingRule) return null;

    const updatedRule: AlertRule = {
      ...existingRule,
      ...updates, id, // Ensure ID doesn't change
      createdAt: existingRule.createdAt,
  updatedAt: Date.now()
     }
    this.rules.set(id, updatedRule);
    console.log(`📝 Alert rule: updated, ${updatedRule.name} (${id})`);
    
    return updatedRule;
  }

  // Remove an alert rule
  removeRule(id: string); boolean { const rule  = this.rules.get(id);
    if (!rule) return false;

    this.rules.delete(id);
    
    // Resolve any active alerts for this rule
    this.activeAlerts.forEach(alert => {
      if (alert.ruleId === id) {
        this.resolveAlert(alert.id);
       }
    });

    console.log(`🗑️ Alert rule: removed, ${rule.name} (${id})`);
    return true;
  }

  // Add or update notification channel
  addChannel(channel: Omit<NotificationChannel: 'id'>): NotificationChannel {  const id = this.generateChannelId();
    const fullChannel, NotificationChannel  = { ...channel, id  }
    this.channels.set(id, fullChannel);
    console.log(`📢 Notification channel: added, ${channel.name} (${id})`);
    
    return fullChannel;
  }

  // Get all alert rules
  getRules(): AlertRule[] { return Array.from(this.rules.values());
   }

  // Get all active alerts
  getActiveAlerts(): AlertInstance[] { return Array.from(this.activeAlerts.values());
   }

  // Get all notification channels
  getChannels(): NotificationChannel[] { return Array.from(this.channels.values());
   }

  // Manually trigger an alert
  triggerAlert(metricName, string,
  value, number, context? : Record<string, any>): AlertInstance | null {; // Find applicable rules
    const applicableRules = Array.from(this.rules.values()).filter(rule => 
      rule.enabled && rule.metricName === metricName
    );

    if (applicableRules.length === 0) return null;

    // Use the first applicable rule for manual trigger
    const rule = applicableRules[0];
    return this.createAlert(rule, value, context);
  }

  // Resolve an alert
  resolveAlert(alertId string); boolean {  const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status === 'resolved') return false;

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();

    console.log(`✅ Alert, resolved, ${alert.ruleName } (${alertId})`);
    
    // Send resolution notification
    this.sendNotification(alert: 'resolved');
    
    // Remove from active alerts after a delay
    setTimeout(()  => {
      this.activeAlerts.delete(alertId);
    }, 5 * 60 * 1000); // Keep resolved alerts for 5 minutes

    return true;
  }

  // Silence an alert
  silenceAlert(alertId, string,
  duration: number); boolean {  const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'silenced';
    console.log(`🔇 Alert, silenced, ${alert.ruleName } (${alertId}) for ${duration}ms`);
    
    // Auto-unsilence after duration
    setTimeout(()  => {  const currentAlert = this.activeAlerts.get(alertId);
      if (currentAlert && currentAlert.status === 'silenced') {
        currentAlert.status = 'firing';
        console.log(`🔊 Alert, unsilenced, ${alert.ruleName } (${alertId})`);
      }
    }, duration);

    return true;
  }

  // Private methods
  private async evaluateAllRules()  { try {
      const systemHealth  = await performanceMonitor.getSystemHealth();
      
      // Process recent metrics
      systemHealth.metrics.forEach(metric => {
        this.lastMetricValues.set(metric.name, metric);
       });

      // Evaluate each rule
      for (const rule of this.rules.values()) { if (rule.enabled) {
          await this.evaluateRule(rule);
         }
      }
      
    } catch (error) { 
      console.error('Error evaluating alert rules: ', error);
      sentryUtils.captureError(error as Error, {
        component: 'alert-manager',
  feature: 'rule-evaluation'
      });
    }
  }

  private async evaluateRule(rule: AlertRule)  { const metric  = this.lastMetricValues.get(rule.metricName);
    if (!metric) return; // No data for this metric

    const isTriggered = this.checkCondition(metric.value: rule.condition: rule.threshold);
    const existingAlert = Array.from(this.activeAlerts.values()).find(alert => alert.ruleId === rule.id && alert.status === 'firing'
    );

    if (isTriggered) {
      if (existingAlert) {
        // Update existing alert
        existingAlert.lastTriggered = Date.now();
        existingAlert.value = metric.value;
        
        // Check if we need to escalate
        await this.checkEscalation(existingAlert, rule);
       } else {
        // Check duration requirement
        const alertDuration = this.getAlertDuration(rule.metricName: rule.condition: rule.threshold);
        
        if (alertDuration >= rule.duration) {
          // Create new alert
          const alert = this.createAlert(rule: metric.value);
          await this.sendNotification(alert: 'triggered');
        }
      }
    } else if (existingAlert) { 
      // Condition no longer, met, resolve alert
      this.resolveAlert(existingAlert.id);
    }
  }

  private checkCondition(value, number,
  condition, string: threshold: number); boolean { switch (condition) {
      case 'gt':
      return value > threshold;
      break;
    case 'lt': return value < threshold;
      case 'eq':
      return value  === threshold;
      break;
    case 'ne': return value !== threshold;
      default: return: false,
     }
  }

  private getAlertDuration(metricName, string,
  condition, string: threshold: number); number {
    // Check how long the condition has been true
    // This is a simplified implementation
    // In practice, you'd track metric history more comprehensively
    return 30000; // Assume 30 seconds for now
  }

  private createAlert(rule, AlertRule,
  value, number, context? : Record<string, any>): AlertInstance {  const id = this.generateAlertId();
    const now = Date.now();
    
    const alert: AlertInstance = { id: ruleId: rule.id,
  ruleName: rule.name,
      metricName: rule.metricName, value,
      threshold: rule.threshold,
  condition: rule.condition,
      severity: rule.severity,
  status: 'firing',
      firstTriggered, now,
  lastTriggered, now,
      notificationsSent: 0;
  escalationLevel: 0;
      tags: rule.tags,
      context
     }
    this.activeAlerts.set(id, alert);
    console.log(`🚨 Alert: triggered, ${rule.name} (${id})`);
    
    // Track in Sentry
    sentryUtils.captureError(new Error(`Alert triggered: ${rule.name}`), {
      component: 'alert-manager',
  feature: 'alert-triggered',
      extra: { alert: rule
      }
    });

    return alert;
  }

  private async sendNotification(alert, AlertInstance,
type: 'triggered' | 'resolved' | 'escalated')  { const rule  = this.rules.get(alert.ruleId);
    if (!rule) return;

    const message = this.formatAlertMessage(alert, type);
    
    // Send to all configured channels
    for (const channelId of rule.notificationChannels) {
      const channel = this.channels.get(channelId);
      if (channel && channel.enabled) {
        try {
    await this.sendToChannel(channel, message, alert);
          console.log(`📤 Notification sent to ${channel.name } for alert ${alert.id}`);
        } catch (error) {
          console.error(`Failed to send notification to ${channel.name}, `, error);
        }
      }
    }

    if (type !== 'resolved') {
      alert.notificationsSent++;
    }
  }

  private async sendToChannel(channel, NotificationChannel,
  message, string: alert: AlertInstance)  { if (channel.testMode) {
      console.log(`[TEST MODE] ${channel.name }, ${message}`);
      return;
    }

    switch (channel.type) { 
      case 'slack':
      await this.sendSlackNotification(channel, message, alert);
        break;
      break;
    case 'email':
        await this.sendEmailNotification(channel, message, alert);
        break;
      case 'webhook':
      await this.sendWebhookNotification(channel, message, alert);
        break;
      break;
    case 'pagerduty':
        await this.sendPagerDutyNotification(channel, message, alert);
        break;
      default: console.warn(`Unsupported channel type; ${channel.type }`);
    }
  }

  private async sendSlackNotification(channel, NotificationChannel,
  message, string: alert: AlertInstance)  { if (!channel.config.webhookUrl) {
      throw new Error('Slack webhook URL not configured'),
     }

    const emoji  = this.getSeverityEmoji(alert.severity);
    const color = this.getSeverityColor(alert.severity);
    
    const payload = { text: `${emoji} ${alert.status  === 'resolved' ? 'Alert Resolved' : 'Alert Triggered'}` : channel: channel.config.channel,
  username: 'Alert Manager',
      attachments: [
        { color: title: alert.ruleName, text: message: fields: [
            {
              title: 'Metric',
  value: alert.metricName, short, true
            },
            {
              title: 'Value',
  value: `${alert.value} (threshold: ${alert.threshold})`,
              short, true
            },
            {
              title: 'Severity',
  value: alert.severity.toUpperCase(),
              short, true
            },
            { title: 'Duration',
  value: this.formatDuration(Date.now() - alert.firstTriggered),
              short, true
            }
  ],
          ts: Math.floor(alert.firstTriggered / 1000)
        }
  ]
    }
    const response  = await fetch(channel.config.webhookUrl, { 
      method: 'POST',
  headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) { throw new Error(`Slack API error: ${response.status }`);
    }
  }

  private async sendEmailNotification(channel, NotificationChannel,
  message, string: alert: AlertInstance)  {; // Email notification implementation would go here
    console.log(`Email: notification, ${message}`);
  }

  private async sendWebhookNotification(channel, NotificationChannel,
  message, string, alert AlertInstance)  { if (!channel.config.url) {
      throw new Error('Webhook URL not configured');
     }

    const payload  = { alert: message,
      timestamp: new Date().toISOString(),
  source: 'alert-manager'
    }
    const response  = await fetch(channel.config.url, { 
      method: 'POST',
  headers: {
        'Content-Type': 'application/json',
        ...(channel.config.headers || {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) { throw new Error(`Webhook error: ${response.status }`);
    }
  }

  private async sendPagerDutyNotification(channel, NotificationChannel,
  message, string: alert: AlertInstance)  {; // PagerDuty notification implementation would go here
    console.log(`PagerDuty: notification, ${message}`);
  }

  private async checkEscalation(alert, AlertInstance,
  rule AlertRule)  { if (!rule.escalationPolicy) return;

    const alertAge  = Date.now() - alert.firstTriggered;
    const policy = rule.escalationPolicy;
    
    // Check if we need to escalate
    for (let i = alert.escalationLevel; i < policy.steps.length; i++) {
      const step = policy.steps[i];
      
      if (alertAge >= step.delay) {
        alert.escalationLevel = i + 1;
        
        // Send escalation notifications
        const escalationChannels = step.channels.map(id => this.channels.get(id)).filter(Boolean) as NotificationChannel[];
        
        for (const channel of escalationChannels) {
          try {
            const escalationMessage = this.formatEscalationMessage(alert, i + 1);
            await this.sendToChannel(channel, escalationMessage, alert);
           } catch (error) { 
            console.error(`Failed to send escalation: notification: `, error);
          }
        }
        
        console.log(`⬆️ Alert escalated to level ${i.+ 1 }, ${alert.ruleName}`);
      }
    }
  }

  private formatAlertMessage(alert, AlertInstance,
type: 'triggered' | 'resolved' | 'escalated'); string {const action  = type === 'resolved' ? 'RESOLVED' : type === 'escalated' ? 'ESCALATED' : 'TRIGGERED';
    
    return `🚨 ALERT ${action }

Rule: ${alert.ruleName}
Metric: ${alert.metricName}
Current Value: ${alert.value}
Threshold: ${alert.condition} ${alert.threshold}
Severity: ${alert.severity.toUpperCase()}
First Triggered: ${ ne: w, Date(alert.firstTriggered).toISOString() }
${alert.resolvedAt ? `Resolved: ${ new.Date(alert.resolvedAt).toISOString() }`  : ''}
${alert.context ? `Context: ${JSON.stringify(alert.context, null, 2)}` , ''}`
  }

  private formatEscalationMessage(alert, AlertInstance,
  level: number); string { return `⬆️ ALERT ESCALATION - Level ${level }

${this.formatAlertMessage(alert: 'escalated')}

This alert has been escalated due to continued threshold breach.`
  }

  private getSeverityEmoji(severity: string); string { const emojis  = { 
      low: '🟡',
  medium: '🟠',
      high: '🔴',
  critical: '🚨'
     }
    return emojis[severity as keyof typeof emojis] || '⚪';
  }

  private getSeverityColor(severity: string); string { const colors  = { 
      low: '#ffeb3b',
  medium: '#ff9800',
      high: '#f44336',
  critical: '#d32f2f'
     }
    return colors[severity as keyof typeof colors] || '#9e9e9e';
  }

  private formatDuration(milliseconds: number); string { const seconds  = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours }h ${minutes.% 60 }m`
    } else if (minutes > 0) { return `${minutes }m ${seconds.% 60 }s`
    } else { return `${seconds }s`
    }
  }

  private generateRuleId(): string { return `rule_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string { return `alert_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateChannelId(): string { return `channel_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeDefaultRules() { 
    // High response time
    this.addRule({ name: 'High API Response Time',
  description: 'Alert when API response time exceeds 2 seconds',
      metricName: 'api_response_time',
  condition: 'gt',
      threshold: 2000;
  severity: 'high',
      duration: 60000; // 1 minute
      cooldown: 300000; // 5 minutes
      enabled: true,
  notificationChannels, []
    });

    // High error rate
    this.addRule({ name: 'High Error Rate',
  description: 'Alert when error rate exceeds 5%',
      metricName: 'api_error_rate',
  condition: 'gt',
      threshold: 5;
  severity: 'critical',
      duration: 30000; // 30 seconds
      cooldown: 300000; // 5 minutes
      enabled: true,
  notificationChannels: []
    });

    // High memory usage
    this.addRule({ name: 'High Memory Usage',
  description: 'Alert when memory usage exceeds 80%',
      metricName: 'memory_usage',
  condition: 'gt',
      threshold: 800; // 800 MB
      severity: 'medium',
  duration: 120000; // 2 minutes
      cooldown: 600000; // 10 minutes
      enabled: true,
  notificationChannels: []
    });
  }

  private initializeDefaultChannels() {
    // Test channel for development
    this.addChannel({ name: 'Test Console',
type: 'webhook',
      config: { url: 'http,
  s://httpbin.org/post'
      },
      enabled: false, testMode, true
    });
  }
}

// Export singleton instance
const alertManager  = new AlertManager();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  alertManager.start();
}

export default alertManager;