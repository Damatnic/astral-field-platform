#!/usr/bin/env node

/**
 * Infrastructure Monitoring Script
 * Monitors deployment health, performance, and infrastructure status
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class InfrastructureMonitor {
  constructor() {
    this.config = {
      endpoints: [
        { name: 'Production', url: 'https://astral-field.vercel.app' },
        { name: 'API Health', url: 'https://astral-field.vercel.app/api/health' },
        { name: 'System Health', url: 'https://astral-field.vercel.app/api/health/system' },
        { name: 'Monitoring Dashboard', url: 'https://astral-field.vercel.app/api/monitoring/dashboard' },
      ],
      alerts: {
        responseTime: 5000, // 5 seconds
        availability: 99.0, // 99% uptime
        errorThreshold: 5, // 5% error rate
      },
      checkInterval: 60000, // 1 minute
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
    };

    this.metrics = {
      checks: [],
      alerts: [],
      startTime: Date.now(),
    };

    this.isRunning = false;
  }

  async start() {
    console.log('🔍 Infrastructure Monitor starting...');
    console.log(`Monitoring ${this.config.endpoints.length} endpoints`);
    console.log(`Check interval: ${this.config.checkInterval / 1000}s`);
    console.log('─'.repeat(60));

    this.isRunning = true;

    // Initial check
    await this.runHealthChecks();

    // Schedule regular checks
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.runHealthChecks();
      }
    }, this.config.checkInterval);

    console.log('✅ Infrastructure Monitor started');
  }

  async stop() {
    console.log('🛑 Infrastructure Monitor stopping...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Generate final report
    await this.generateReport();
    console.log('✅ Infrastructure Monitor stopped');
  }

  async runHealthChecks() {
    console.log(`[${new Date().toISOString()}] Running health checks...`);

    const checkResults = await Promise.allSettled(
      this.config.endpoints.map(endpoint => this.checkEndpoint(endpoint))
    );

    const results = checkResults.map((result, index) => {
      const endpoint = this.config.endpoints[index];
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: endpoint.name,
          url: endpoint.url,
          status: 'error',
          responseTime: 0,
          error: result.reason.message,
          timestamp: Date.now(),
        };
      }
    });

    // Store metrics
    this.metrics.checks.push({
      timestamp: Date.now(),
      results,
    });

    // Analyze results and generate alerts
    await this.analyzeResults(results);

    // Print summary
    this.printHealthSummary(results);

    // Keep only last 1000 checks
    if (this.metrics.checks.length > 1000) {
      this.metrics.checks = this.metrics.checks.slice(-1000);
    }
  }

  async checkEndpoint(endpoint) {
    const startTime = Date.now();
    let attempt = 1;

    while (attempt <= this.config.retryAttempts) {
      try {
        console.log(`  ⏳ Checking ${endpoint.name} (attempt ${attempt})...`);
        
        const result = await this.makeRequest(endpoint.url);
        const responseTime = Date.now() - startTime;

        const checkResult = {
          name: endpoint.name,
          url: endpoint.url,
          status: result.statusCode >= 200 && result.statusCode < 400 ? 'healthy' : 'unhealthy',
          statusCode: result.statusCode,
          responseTime,
          contentLength: result.contentLength,
          timestamp: Date.now(),
          attempt,
        };

        // Parse response if it's JSON
        if (result.contentType?.includes('application/json')) {
          try {
            checkResult.data = JSON.parse(result.body);
          } catch (e) {
            // Ignore JSON parse errors
          }
        }

        return checkResult;

      } catch (error) {
        console.log(`    ❌ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        
        attempt++;
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = 30000; // 30 seconds

      const req = https.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Infrastructure-Monitor/1.0',
          'Accept': 'application/json,text/html,*/*',
        },
      }, (res) => {
        let body = '';
        
        res.on('data', chunk => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            contentType: res.headers['content-type'],
            contentLength: parseInt(res.headers['content-length'] || '0'),
            body,
            responseTime: Date.now() - startTime,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeout}ms`));
      });

      req.end();
    });
  }

  async analyzeResults(results) {
    const now = Date.now();
    const alerts = [];

    for (const result of results) {
      // Check response time
      if (result.responseTime > this.config.alerts.responseTime) {
        alerts.push({
          type: 'high_response_time',
          severity: 'warning',
          endpoint: result.name,
          message: `High response time: ${result.responseTime}ms (threshold: ${this.config.alerts.responseTime}ms)`,
          value: result.responseTime,
          threshold: this.config.alerts.responseTime,
          timestamp: now,
        });
      }

      // Check availability
      if (result.status === 'unhealthy') {
        alerts.push({
          type: 'endpoint_down',
          severity: 'critical',
          endpoint: result.name,
          message: `Endpoint is down: ${result.error || 'Unknown error'}`,
          statusCode: result.statusCode,
          timestamp: now,
        });
      }

      // Check health API responses
      if (result.data && result.data.health) {
        const health = result.data.health;
        
        if (health.status === 'unhealthy') {
          alerts.push({
            type: 'system_unhealthy',
            severity: 'critical',
            endpoint: result.name,
            message: `System health is unhealthy: ${health.score || 0}/100`,
            healthScore: health.score,
            timestamp: now,
          });
        } else if (health.status === 'degraded') {
          alerts.push({
            type: 'system_degraded',
            severity: 'warning',
            endpoint: result.name,
            message: `System health is degraded: ${health.score || 0}/100`,
            healthScore: health.score,
            timestamp: now,
          });
        }
      }
    }

    // Store and process alerts
    if (alerts.length > 0) {
      this.metrics.alerts.push(...alerts);
      await this.handleAlerts(alerts);
    }
  }

  async handleAlerts(alerts) {
    for (const alert of alerts) {
      console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
      
      // Send notifications based on severity
      if (alert.severity === 'critical') {
        await this.sendCriticalAlert(alert);
      } else if (alert.severity === 'warning') {
        await this.sendWarningAlert(alert);
      }
    }
  }

  async sendCriticalAlert(alert) {
    // Send to multiple channels for critical alerts
    const channels = [
      this.sendSlackAlert,
      this.sendEmailAlert,
      this.logAlert,
    ];

    const notifications = channels.map(channel => 
      channel.call(this, alert).catch(error => 
        console.error(`Failed to send alert via ${channel.name}:`, error.message)
      )
    );

    await Promise.allSettled(notifications);
  }

  async sendWarningAlert(alert) {
    // Send warnings to Slack and logs
    await Promise.allSettled([
      this.sendSlackAlert(alert).catch(error => 
        console.error(`Failed to send Slack alert:`, error.message)
      ),
      this.logAlert(alert),
    ]);
  }

  async sendSlackAlert(alert) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('Slack webhook not configured, skipping notification');
      return;
    }

    const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
    const color = alert.severity === 'critical' ? '#d32f2f' : '#ff9800';

    const payload = {
      text: `${emoji} Infrastructure Alert`,
      attachments: [{
        color,
        title: alert.endpoint,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Type',
            value: alert.type,
            short: true,
          },
          {
            title: 'Time',
            value: new Date(alert.timestamp).toISOString(),
            short: false,
          },
        ],
        ts: Math.floor(alert.timestamp / 1000),
      }],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }
  }

  async sendEmailAlert(alert) {
    // Email implementation would go here
    console.log('📧 Email alert sent (mock):', alert.message);
  }

  async logAlert(alert) {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'infrastructure-alerts.log');
    const logEntry = `[${new Date().toISOString()}] ${alert.severity.toUpperCase()}: ${alert.endpoint} - ${alert.message}\n`;

    fs.appendFileSync(logFile, logEntry);
  }

  printHealthSummary(results) {
    const healthy = results.filter(r => r.status === 'healthy').length;
    const total = results.length;
    const avgResponseTime = results
      .filter(r => r.responseTime > 0)
      .reduce((sum, r) => sum + r.responseTime, 0) / total;

    console.log(`📊 Health Summary: ${healthy}/${total} endpoints healthy`);
    console.log(`⏱️  Average response time: ${Math.round(avgResponseTime)}ms`);

    results.forEach(result => {
      const status = result.status === 'healthy' ? '✅' : '❌';
      const time = result.responseTime > 0 ? `${result.responseTime}ms` : 'N/A';
      console.log(`  ${status} ${result.name}: ${time}`);
    });

    console.log('─'.repeat(60));
  }

  async generateReport() {
    const report = {
      summary: {
        monitoringDuration: Date.now() - this.metrics.startTime,
        totalChecks: this.metrics.checks.length,
        totalAlerts: this.metrics.alerts.length,
        generatedAt: new Date().toISOString(),
      },
      endpoints: this.config.endpoints.map(endpoint => {
        const checks = this.metrics.checks.flatMap(c => 
          c.results.filter(r => r.name === endpoint.name)
        );
        
        const healthyChecks = checks.filter(c => c.status === 'healthy').length;
        const availability = checks.length > 0 ? (healthyChecks / checks.length) * 100 : 0;
        const avgResponseTime = checks.length > 0 
          ? checks.reduce((sum, c) => sum + c.responseTime, 0) / checks.length 
          : 0;

        return {
          name: endpoint.name,
          url: endpoint.url,
          totalChecks: checks.length,
          availability: Math.round(availability * 100) / 100,
          averageResponseTime: Math.round(avgResponseTime),
          lastCheck: checks.length > 0 ? checks[checks.length - 1].timestamp : null,
        };
      }),
      alerts: this.metrics.alerts.map(alert => ({
        ...alert,
        timestamp: new Date(alert.timestamp).toISOString(),
      })),
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'infrastructure-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Infrastructure report saved to: ${reportPath}`);
    
    // Print summary
    console.log('\n📊 MONITORING SUMMARY');
    console.log('─'.repeat(60));
    console.log(`Duration: ${this.formatDuration(report.summary.monitoringDuration)}`);
    console.log(`Total checks: ${report.summary.totalChecks}`);
    console.log(`Total alerts: ${report.summary.totalAlerts}`);
    console.log('\n🔗 ENDPOINT AVAILABILITY');
    console.log('─'.repeat(60));
    
    report.endpoints.forEach(endpoint => {
      const status = endpoint.availability >= 99 ? '✅' : endpoint.availability >= 95 ? '⚠️' : '❌';
      console.log(`${status} ${endpoint.name}: ${endpoint.availability}% (${endpoint.averageResponseTime}ms avg)`);
    });

    if (report.alerts.length > 0) {
      console.log('\n🚨 RECENT ALERTS');
      console.log('─'.repeat(60));
      report.alerts.slice(-10).forEach(alert => {
        const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.endpoint}: ${alert.message}`);
      });
    }
  }

  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
async function main() {
  const monitor = new InfrastructureMonitor();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, stopping monitor...');
    await monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, stopping monitor...');
    await monitor.stop();
    process.exit(0);
  });

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'check') {
    // Run a single check
    console.log('🔍 Running single infrastructure check...');
    await monitor.runHealthChecks();
    await monitor.generateReport();
  } else if (command === 'monitor') {
    // Run continuous monitoring
    const duration = args[1] ? parseInt(args[1]) * 60000 : null; // duration in minutes
    
    await monitor.start();
    
    if (duration) {
      console.log(`⏰ Monitoring for ${duration / 60000} minutes...`);
      setTimeout(async () => {
        await monitor.stop();
        process.exit(0);
      }, duration);
    } else {
      console.log('⏰ Monitoring indefinitely (Ctrl+C to stop)...');
    }
  } else {
    console.log('📋 Infrastructure Monitor Usage:');
    console.log('  node monitor.js check           - Run single health check');
    console.log('  node monitor.js monitor [mins]  - Run continuous monitoring');
    console.log('');
    console.log('Environment Variables:');
    console.log('  SLACK_WEBHOOK_URL - Slack webhook for alerts');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Monitor error:', error);
    process.exit(1);
  });
}

module.exports = InfrastructureMonitor;