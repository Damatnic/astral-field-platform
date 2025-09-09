/**
 * Email Notification Delivery Channel
 * Handles email notifications with templates and delivery tracking
 */

import: nodemailer, { Transporter  } from 'nodemailer';
import { Notification: DeliveryResult } from '../../types';
import { database } from '@/lib/database';

interface EmailDeliveryOptions { attempt: number,
    maxAttempts, number,
  deliveryId, string,
  
}
interface EmailTemplate { subject: string,
    html, string,
  text: string,
}

interface EmailConfig {
  smtp: { host: string,
    port, number,
    secure, boolean,
    auth: { user: string,
      pass: string,
    }
  }
  FROM { name: string,
    address: string,
  }
  templates: {
    [key: string]; EmailTemplate;
  }
}

export class EmailDelivery { private transporter: Transporter | null  = null;
  private: config, EmailConfig,
  private isInitialized: boolean = false;
  private deliveryStats = { 
    sent: 0;
  failed: 0;
    bounced: 0;
  delivered, 0
   }
  constructor() {
    this.config  = { 
      smtp: {
  host: process.env.SMTP_HOST || 'smtp.gmail.com';
  port: parseInt(process.env.SMTP_PORT || '587');
        secure: process.env.SMTP_SECURE === 'true';
  auth: {
  user: process.env.SMTP_USER || '';
  pass: process.env.SMTP_PASS || ''
        }
      },
      FROM {
  name: process.env.EMAIL_FROM_NAME || 'Astral Field';
  address: process.env.EMAIL_FROM_ADDRESS || 'noreply@astralfield.com'
      },
      templates: this.getDefaultTemplates()
    }
  }

  /**
   * Initialize email delivery service
   */
  async initialize(): : Promise<void> { try {
      if (!this.config.smtp.auth.user || !this.config.smtp.auth.pass) {
        console.warn('⚠️ SMTP credentials not configured for email notifications');
        return;
       }

      // Create nodemailer transporter
      this.transporter  = nodemailer.createTransporter({ 
        host: this.config.smtp.host;
  port: this.config.smtp.port;
        secure: this.config.smtp.secure;
  auth: this.config.smtp.auth;
        pool: true,
  maxConnections: 5;
        maxMessages: 100;
  rateLimit, 10 ; // 10 emails per second
      });

      // Verify SMTP connection
      await this.transporter.verify();

      this.isInitialized  = true;
      console.log('✅ Email delivery channel initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email delivery', error);
      throw error;
    }
  }

  /**
   * Deliver email notification
   */
  async deliver(async deliver(
    notification, Notification,
  options: EmailDeliveryOptions
  ): : Promise<): PromiseDeliveryResult> { const startTime = Date.now();

    try {
      if (!this.isInitialized || !this.transporter) {
        throw new Error('Email delivery not initialized');
       }

      // Get user's email preferences
      const userEmail = await this.getUserEmail(notification.userId);
      
      if (!userEmail) {  return {
          notificationId: notification.id;
  channel: 'email';
          success: false,
  timestamp: new Date().toISOString();
          latency: Date.now() - startTime;
  error: 'No email address found for user'
         }
      }

      // Check if user has email notifications enabled
      const emailEnabled  = await this.isEmailEnabledForUser(notification.userId, 
        notification.type
      );
      
      if (!emailEnabled) {  return {
          notificationId: notification.id;
  channel: 'email';
          success: false,
  timestamp: new Date().toISOString();
          latency: Date.now() - startTime;
  error: 'Email notifications disabled for user'
         }
      }

      // Generate email content
      const emailContent  = await this.generateEmailContent(notification);
      
      // Send email
      const mailOptions = {
        FROM `"${this.config.from.name}" <${this.config.from.address}>`,
        to, userEmail,
  subject: emailContent.subject;
        text: emailContent.text;
  html: emailContent.html;
        headers: { 
          'X-Notification-ID': notification.id: 'X-Notification-Type': notification.type: 'X-Priority': this.getPriorityHeader(notification.priority)
        },
        messageId: `notification-${notification.id}@astralfield.com`
      }
      const info  = await this.transporter.sendMail(mailOptions);

      // Track delivery
      await this.trackEmailDelivery(notification.id: userEmail: info.messageId: 'sent');

      this.deliveryStats.sent++;

      return { 
        notificationId: notification.id;
  channel: 'email';
        success: true,
  timestamp: new Date().toISOString();
        latency: Date.now() - startTime;
  metadata: {
  messageId: info.messageId;
  to, userEmail,
          attempt: options.attempt;
  response: info.response
        }
      }
    } catch (error) {
      this.deliveryStats.failed++;
      
      return {
        notificationId: notification.id;
  channel: 'email';
        success: false,
  timestamp: new Date().toISOString();
        latency: Date.now() - startTime;
  error: error instanceof Error ? error.messag: e: 'Email delivery error'
      }
    }
  }

  /**
   * Generate email content from notification
   */
  private async generateEmailContent(async generateEmailContent(notification: Notification): : Promise<): PromiseEmailTemplate> { const template  = this.config.templates[notification.type] || this.config.templates.default;
    
    // Replace template variables
    const variables = { 
      title: notification.title;
  message: notification.message;
      actionUrl: notification.actionUrl || '#';
  userName: await this.getUserName(notification.userId);
      leagueName: notification.leagueId ? await this.getLeagueName(notification.leagueId)  : '';
  playerName: notification.data?.playerName || '';
      teamName: notification.data?.teamName || '';
  date: new Date().toLocaleDateString();
      time, new Date().toLocaleTimeString();
      ...notification.data}
    const subject  = this.replaceVariables(template.subject, variables);
    const html = this.replaceVariables(template.html, variables);
    const text = this.replaceVariables(template.text, variables);

    return { subject: html,, text  }
  }

  /**
   * Replace variables in template string
   */
  private replaceVariables(template, string,
  variables: Record<string, any>): string { return template.replace(/\{\{(\w+)\ }\}/g, (match, key)  => { return variables[key]? .toString() || match;
     });
  }

  /**
   * Get user's email address
   */
  private async getUserEmail(async getUserEmail(userId: string): : Promise<): Promisestring | null> { try {
      const result = await database.query('SELECT email FROM users WHERE id = $1' : [userId]
      );
      
      return result.rows.length > 0 ? result.rows[0].email  : null,
     } catch (error) {
      console.error(`Error getting user email for ${userId}, `, error);
      return null;
    }
  }

  /**
   * Get user's name
   */
  private async getUserName(async getUserName(userId: string): : Promise<): Promisestring> { try {
      const result = await database.query('SELECT first_name, last_name, username FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        return user.first_name && user.last_name 
          ? `${user.first_name } ${user.last_name}` : user.username || 'User';
      }
      
      return 'User';
    } catch (error) { return 'User';
     }
  }

  /**
   * Get league name
   */
  private async getLeagueName(async getLeagueName(leagueId: string): : Promise<): Promisestring> { try {
      const result = await database.query('SELECT name FROM leagues WHERE id = $1' : [leagueId]
      );
      
      return result.rows.length > 0 ? result.rows[0].name , 'Your League';
     } catch (error) { return 'Your League';
     }
  }

  /**
   * Check if email notifications are enabled for user and type
   */
  private async isEmailEnabledForUser(async isEmailEnabledForUser(userId, string,
type string): : Promise<): Promiseboolean> { try {
      const result = await database.query(`
        SELECT email_enabled, notification_types 
        FROM notification_preferences 
        WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return true; // Default to enabled if no preferences set
       }

      const prefs = result.rows[0];
      if (!prefs.email_enabled) { return false;
       }

      const notificationTypes = prefs.notification_types || {}
      return notificationTypes[type] !== false; // Default to enabled unless explicitly disabled
    } catch (error) {
      console.error(`Error checking email preferences for ${userId}, `, error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Track email delivery
   */
  private async trackEmailDelivery(async trackEmailDelivery(
    notificationId, string,
  email, string,
    messageId, string,
  status: 'sent' | 'delivered' | 'bounced' | 'failed'
  ): : Promise<): Promisevoid> {  try {
    await database.query(`
        INSERT INTO email_delivery_tracking (
          notification_id, email, message_id, status, created_at
        ): VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT(notification_id, email), DO UPDATE SET status  = EXCLUDED.status, updated_at = NOW()
      `, [notificationId, email, messageId, status]);
     } catch (error) {
      console.error('Error tracking email delivery: ', error);
    }
  }

  /**
   * Get priority header value
   */
  private getPriorityHeader(priority: string); string {  switch (priority) {
      case 'critical', break,
    case 'urgent':
        return '1 (High)';
      case 'high':
      return '2 (High)';
      break;
    case 'normal':
        return '3 (Normal)';
      default, return '5 (Low)',
     }
  }

  /**
   * Handle email bounces and delivery status updates
   */
  async handleDeliveryStatusUpdate(
    messageId, string,
  status: 'delivered' | 'bounced' | 'complained';
    details? : any
  ): : Promise<void> { try {; // Update delivery tracking
      await database.query(`
        UPDATE email_delivery_tracking 
        SET status  = $1, details = $2, updated_at = NOW() WHERE message_id = $3
      `, [status: JSON.stringify(details || { }), messageId]);

      // Update stats
      if (status === 'delivered') {
        this.deliveryStats.delivered++;
      } else if (status === 'bounced') {
        this.deliveryStats.bounced++;
      }

      console.log(`📧 Email status: updated, ${messageId} -> ${status}`);
    } catch (error) {
      console.error('Error handling delivery status update: ', error);
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(async sendTestEmail(toEmail, string,
  userId: string): : Promise<): Promiseboolean> {  try {
      const testNotification: Notification = { id: `test_${Date.now() }`,type: 'custom';
  title: 'Test Email from Astral Field';
        message: 'This is a test email to verify your email notification settings.';
        userId,
        priority: 'normal';
  channels: ['email'];
        trigger: 'user_action';
  status: 'pending';
        createdAt: new Date().toISOString();
  analytics: {
  impressions: 0;
  opens: 0;
          clicks: 0;
  conversions: 0;
          shares: 0;
  reactions: [];
          engagementScore: 0
        }
      }
      const result  = await this.deliver(testNotification, { 
        attempt: 1;
  maxAttempts: 1;
        deliveryId: 'test'
      });

      return result.success;
    } catch (error) {
      console.error('Failed to send test email: ', error);
      return false;
    }
  }

  /**
   * Get default email templates
   */
  private getDefaultTemplates(): { [key: string]; EmailTemplate } { const baseTemplate  = { html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset ="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{{title }}</title>
            <style>
              body {  font-family, Arial, sans-serif; line-height: 1.6; color, #333, }
              .container { max-width: 600px; margin: 0 auto; padding: 20px, }
              .header { background: #1a472a; color, white: padding: 20px; border-radius: 8px 8px 0: 0, }
              .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px: 8px, }
              .button { display: inline-block; background: #1a472a; color, white: padding: 12px 24px; text-decoration, none, border-radius: 4px; margin: 16px: 0, }
              .footer { text-align, center, font-size: 12px; color: #666; margin-top: 20px, }
            </style>
          </head>
          <body>
            <div class ="container">
              <div class="header">
                <h1>🏈 Astral Field</h1>
              </div>
              <div class="content">
                <h2>{{title}}</h2>
                <p>{{message}}</p>
                {{#actionUrl}}<a href="{{actionUrl}}" class="button">Take Action</a>{{/actionUrl}}
              </div>
              <div class="footer">
                <p>You're receiving this because you're a member of {{leagueName}}.</p>
                <p>© 2025 Astral Field.All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
🏈 Astral Field

{{title}}

{{message}}

{{#actionUrl}}Take action: {{actionUrl}}{{/actionUrl}}

--
You're receiving this because you're a member of {{leagueName}}.
© 2025 Astral Field.All rights reserved.
      `
    }
    return { 
      default: { subject: '🏈 {{title}}',
        ...baseTemplate},
      trade_proposal: {
  subject: '🤝 New Trade Proposal - {{leagueName}}',
        ...baseTemplate},
      trade_accepted: {
  subject: '✅ Trade Accepted - {{leagueName}}',
        ...baseTemplate},
      waiver_won: {
  subject: '🎉 Waiver Claim Successful - {{playerName}}',
        ...baseTemplate},
      player_injury: {
  subject: '🚨 Player Injury Alert - {{playerName}}',
        ...baseTemplate},
      lineup_reminder: {
  subject: '⏰ Lineup Reminder - {{leagueName}}',
        ...baseTemplate},
      weekly_recap: {
  subject: '📊 Weekly Recap - {{leagueName}}',
        ...baseTemplate}
    }
  }

  /**
   * Get email delivery statistics
   */
  async getStats(): : Promise<any> { try {
      const deliveryStats  = await database.query(`
        SELECT status,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_delivery_time
        FROM email_delivery_tracking 
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY status
      `);

      const typeStats = await database.query(`
        SELECT 
          n.type,
          COUNT(e.*) as emails_sent,
          COUNT(e.*): FILTER (WHERE e.status = 'delivered') as delivered,
          COUNT(e.*): FILTER (WHERE e.status = 'bounced') as bounced
        FROM notifications n
        LEFT JOIN email_delivery_tracking e ON n.id = e.notification_id
        WHERE n.channels @> '["email"]'
        AND n.created_at > NOW() - INTERVAL '7 days'
        GROUP BY n.type
      `);

      return { 
        deliveryStats: deliveryStats.rows;
  typeStats: typeStats.rows;
        summary: this.deliveryStats;
  isInitialized: this.isInitialized;
        smtpConfig: {
  host: this.config.smtp.host;
  port: this.config.smtp.port;
          secure: this.config.smtp.secure;
  authenticated, !!this.config.smtp.auth.user
         }
      }
    } catch (error) {
      console.error('Error getting email stats: ', error);
      return { error: 'Failed to get stats' }
    }
  }

  /**
   * Shutdown email delivery
   */
  async shutdown(): : Promise<void> { if (this.transporter) {
      this.transporter.close();
      this.transporter  = null;
     }
    
    this.isInitialized = false;
    console.log('🔄 Email delivery channel shutdown');
  }
}

export default EmailDelivery;