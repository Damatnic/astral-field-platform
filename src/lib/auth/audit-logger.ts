/**
 * Comprehensive Audit Logging System
 * Enterprise-grade security event tracking and compliance logging
 */

import { database } from '@/lib/database';
import crypto from 'crypto';

export type EventType = 
  | 'authentication' 
  | 'authorization' 
  | 'data_access' 
  | 'data_modification'
  | 'user_management'
  | 'system_administration'
  | 'security_incident'
  | 'compliance';

export type EventCategory = 
  | 'login' 
  | 'logout' 
  | 'password_change'
  | 'mfa_setup'
  | 'mfa_verification'
  | 'role_change'
  | 'permission_grant'
  | 'permission_revoke'
  | 'data_export'
  | 'data_import'
  | 'admin_action'
  | 'security_violation'
  | 'compliance_check';

export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface AuditEvent {
  id?: string;
  userId?: string;
  sessionId?: string;
  eventType: EventType;
  eventCategory: EventCategory;
  severity: SeverityLevel;
  action: string;
  resource?: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  
  // Request context
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  
  // Result information
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  
  // Compliance fields
  complianceRelevant: boolean;
  retentionDays?: number;
  
  // Timestamps
  timestamp: Date;
  processedAt?: Date;
}

export interface AuditQuery {
  userId?: string;
  eventType?: EventType;
  eventCategory?: EventCategory;
  severity?: SeverityLevel;
  resource?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditReport {
  period: { start: Date; end: Date };
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByCategory: Record<EventCategory, number>;
  eventsBySeverity: Record<SeverityLevel, number>;
  topUsers: Array<{ userId: string; eventCount: number; username?: string }>;
  topIPs: Array<{ ipAddress: string; eventCount: number }>;
  securityIncidents: number;
  complianceEvents: number;
  failureRate: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    eventType?: EventType;
    eventCategory?: EventCategory;
    severity?: SeverityLevel;
    threshold?: number;
    timeWindow?: number; // minutes
    failurePattern?: boolean;
    anomalyDetection?: boolean;
  };
  actions: {
    emailNotification?: boolean;
    slackNotification?: boolean;
    autoBlock?: boolean;
    escalateSeverity?: boolean;
  };
  enabled: boolean;
}

class AuditLogger {
  private static instance: AuditLogger;
  private eventQueue: AuditEvent[] = [];
  private alertRules: AlertRule[] = [];
  private alertHistory = new Map<string, { count: number; lastTriggered: Date }>();

  private constructor() {
    this.initializeDefaultAlertRules();
    this.startBackgroundProcessing();
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   */
  public async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'processedAt'>): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        complianceRelevant: this.isComplianceRelevant(event.eventCategory),
        retentionDays: this.getRetentionPeriod(event.eventType, event.complianceRelevant),
        ...event
      };

      // Add to queue for async processing
      this.eventQueue.push(auditEvent);

      // Process immediately for critical events
      if (event.severity === 'critical') {
        await this.processEvent(auditEvent);
      }

      console.log(`📋 Audit event logged: ${event.action} (${event.severity})`);
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw to avoid breaking the main flow
    }
  }

  /**
   * Log authentication event
   */
  public async logAuthentication(
    userId: string | null,
    action: 'login_attempt' | 'login_success' | 'login_failure' | 'logout',
    context: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      method?: string;
      failureReason?: string;
      mfaUsed?: boolean;
    } = {}
  ): Promise<void> {
    const success = action === 'login_success' || action === 'logout';
    const severity: SeverityLevel = success ? 'info' : 'medium';

    await this.logEvent({
      userId: userId || undefined,
      sessionId: context.sessionId,
      eventType: 'authentication',
      eventCategory: action.startsWith('login') ? 'login' : 'logout',
      severity,
      action,
      description: this.getAuthenticationDescription(action, context),
      metadata: {
        method: context.method,
        mfaUsed: context.mfaUsed,
        failureReason: context.failureReason
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      success,
      errorMessage: context.failureReason
    });
  }

  /**
   * Log authorization event
   */
  public async logAuthorization(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    context: {
      resourceId?: string;
      requiredRole?: string;
      currentRole?: string;
      ipAddress?: string;
      reason?: string;
    } = {}
  ): Promise<void> {
    await this.logEvent({
      userId,
      eventType: 'authorization',
      eventCategory: granted ? 'data_access' : 'security_violation',
      severity: granted ? 'info' : 'medium',
      action: `${action}_${resource}`,
      resource,
      resourceId: context.resourceId,
      description: `${granted ? 'Granted' : 'Denied'} ${action} access to ${resource}`,
      metadata: {
        requiredRole: context.requiredRole,
        currentRole: context.currentRole,
        reason: context.reason
      },
      ipAddress: context.ipAddress,
      success: granted,
      errorMessage: granted ? undefined : context.reason
    });
  }

  /**
   * Log data access event
   */
  public async logDataAccess(
    userId: string,
    resource: string,
    action: 'read' | 'export' | 'download',
    context: {
      resourceId?: string;
      recordCount?: number;
      query?: string;
      exportFormat?: string;
      ipAddress?: string;
      sessionId?: string;
    } = {}
  ): Promise<void> {
    const severity: SeverityLevel = action === 'export' ? 'medium' : 'info';

    await this.logEvent({
      userId,
      sessionId: context.sessionId,
      eventType: 'data_access',
      eventCategory: action === 'export' ? 'data_export' : 'data_access',
      severity,
      action: `${action}_${resource}`,
      resource,
      resourceId: context.resourceId,
      description: `${action.toUpperCase()} operation on ${resource}`,
      metadata: {
        recordCount: context.recordCount,
        query: context.query,
        exportFormat: context.exportFormat
      },
      ipAddress: context.ipAddress,
      success: true
    });
  }

  /**
   * Log data modification event
   */
  public async logDataModification(
    userId: string,
    resource: string,
    action: 'create' | 'update' | 'delete' | 'import',
    resourceId: string,
    context: {
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      recordCount?: number;
      ipAddress?: string;
      sessionId?: string;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    const success = context.success !== false;
    const severity: SeverityLevel = action === 'delete' ? 'high' : 'medium';

    await this.logEvent({
      userId,
      sessionId: context.sessionId,
      eventType: 'data_modification',
      eventCategory: action === 'import' ? 'data_import' : 'data_modification',
      severity,
      action: `${action}_${resource}`,
      resource,
      resourceId,
      description: `${action.toUpperCase()} operation on ${resource} ${resourceId}`,
      metadata: {
        oldValues: action === 'update' ? this.sanitizeValues(context.oldValues) : undefined,
        newValues: action !== 'delete' ? this.sanitizeValues(context.newValues) : undefined,
        recordCount: context.recordCount
      },
      ipAddress: context.ipAddress,
      success,
      errorMessage: context.errorMessage
    });
  }

  /**
   * Log user management event
   */
  public async logUserManagement(
    adminUserId: string,
    targetUserId: string,
    action: 'create' | 'update' | 'delete' | 'suspend' | 'activate' | 'role_change',
    context: {
      oldRole?: string;
      newRole?: string;
      reason?: string;
      ipAddress?: string;
      sessionId?: string;
    } = {}
  ): Promise<void> {
    await this.logEvent({
      userId: adminUserId,
      sessionId: context.sessionId,
      eventType: 'user_management',
      eventCategory: action === 'role_change' ? 'role_change' : 'user_management',
      severity: 'high',
      action: `${action}_user`,
      resource: 'user',
      resourceId: targetUserId,
      description: `${action.toUpperCase()} operation on user ${targetUserId}`,
      metadata: {
        targetUserId,
        oldRole: context.oldRole,
        newRole: context.newRole,
        reason: context.reason
      },
      ipAddress: context.ipAddress,
      success: true
    });
  }

  /**
   * Log security incident
   */
  public async logSecurityIncident(
    type: 'brute_force' | 'unauthorized_access' | 'data_breach' | 'malicious_activity' | 'system_compromise',
    description: string,
    context: {
      userId?: string;
      ipAddress?: string;
      affectedResources?: string[];
      severity?: SeverityLevel;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    await this.logEvent({
      userId: context.userId,
      eventType: 'security_incident',
      eventCategory: 'security_violation',
      severity: context.severity || 'critical',
      action: type,
      description,
      metadata: {
        incidentType: type,
        affectedResources: context.affectedResources,
        ...context.metadata
      },
      ipAddress: context.ipAddress,
      success: false // Security incidents are always failures
    });
  }

  /**
   * Query audit events
   */
  public async queryEvents(query: AuditQuery): Promise<{
    events: AuditEvent[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      let sql = 'SELECT * FROM security_events WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      // Build WHERE clause
      if (query.userId) {
        sql += ` AND user_id = $${++paramCount}`;
        params.push(query.userId);
      }

      if (query.eventType) {
        sql += ` AND event_type = $${++paramCount}`;
        params.push(query.eventType);
      }

      if (query.eventCategory) {
        sql += ` AND event_category = $${++paramCount}`;
        params.push(query.eventCategory);
      }

      if (query.severity) {
        sql += ` AND severity = $${++paramCount}`;
        params.push(query.severity);
      }

      if (query.resource) {
        sql += ` AND metadata->>'resource' = $${++paramCount}`;
        params.push(query.resource);
      }

      if (query.success !== undefined) {
        sql += ` AND metadata->>'success' = $${++paramCount}`;
        params.push(query.success.toString());
      }

      if (query.startDate) {
        sql += ` AND timestamp >= $${++paramCount}`;
        params.push(query.startDate);
      }

      if (query.endDate) {
        sql += ` AND timestamp <= $${++paramCount}`;
        params.push(query.endDate);
      }

      if (query.ipAddress) {
        sql += ` AND ip_address = $${++paramCount}`;
        params.push(query.ipAddress);
      }

      // Add sorting
      const sortBy = query.sortBy || 'timestamp';
      const sortOrder = query.sortOrder || 'desc';
      sql += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

      // Get total count first
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
      const countResult = await database.query(countSql, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Add pagination
      const limit = query.limit || 50;
      const offset = query.offset || 0;
      sql += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
      params.push(limit, offset);

      const result = await database.query(sql, params);

      const events: AuditEvent[] = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        sessionId: row.session_id,
        eventType: row.event_type,
        eventCategory: row.event_category,
        severity: row.severity,
        action: row.description, // Using description as action for now
        resource: row.metadata?.resource,
        resourceId: row.metadata?.resourceId,
        description: row.description,
        metadata: row.metadata,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        requestId: row.request_id,
        success: row.metadata?.success !== false,
        errorCode: row.metadata?.errorCode,
        errorMessage: row.metadata?.errorMessage,
        complianceRelevant: row.metadata?.complianceRelevant || false,
        retentionDays: row.metadata?.retentionDays,
        timestamp: new Date(row.timestamp),
        processedAt: row.processed_at ? new Date(row.processed_at) : undefined
      }));

      return {
        events,
        totalCount,
        hasMore: offset + limit < totalCount
      };
    } catch (error) {
      console.error('Audit query error:', error);
      return { events: [], totalCount: 0, hasMore: false };
    }
  }

  /**
   * Generate audit report
   */
  public async generateReport(startDate: Date, endDate: Date): Promise<AuditReport> {
    try {
      const query = `
        SELECT 
          event_type,
          event_category,
          severity,
          user_id,
          ip_address,
          metadata->>'success' as success,
          metadata->>'complianceRelevant' as compliance_relevant,
          COUNT(*) as count
        FROM security_events 
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY event_type, event_category, severity, user_id, ip_address, success, compliance_relevant
      `;

      const result = await database.query(query, [startDate, endDate]);

      const report: AuditReport = {
        period: { start: startDate, end: endDate },
        totalEvents: 0,
        eventsByType: {} as Record<EventType, number>,
        eventsByCategory: {} as Record<EventCategory, number>,
        eventsBySeverity: {} as Record<SeverityLevel, number>,
        topUsers: [],
        topIPs: [],
        securityIncidents: 0,
        complianceEvents: 0,
        failureRate: 0
      };

      const userCounts = new Map<string, number>();
      const ipCounts = new Map<string, number>();
      let totalEvents = 0;
      let failedEvents = 0;

      for (const row of result.rows) {
        const count = parseInt(row.count);
        totalEvents += count;

        // Count by type
        report.eventsByType[row.event_type as EventType] = 
          (report.eventsByType[row.event_type as EventType] || 0) + count;

        // Count by category
        report.eventsByCategory[row.event_category as EventCategory] = 
          (report.eventsByCategory[row.event_category as EventCategory] || 0) + count;

        // Count by severity
        report.eventsBySeverity[row.severity as SeverityLevel] = 
          (report.eventsBySeverity[row.severity as SeverityLevel] || 0) + count;

        // Count security incidents
        if (row.event_type === 'security_incident') {
          report.securityIncidents += count;
        }

        // Count compliance events
        if (row.compliance_relevant === 'true') {
          report.complianceEvents += count;
        }

        // Count failures
        if (row.success === 'false') {
          failedEvents += count;
        }

        // Count by user
        if (row.user_id) {
          userCounts.set(row.user_id, (userCounts.get(row.user_id) || 0) + count);
        }

        // Count by IP
        if (row.ip_address) {
          ipCounts.set(row.ip_address, (ipCounts.get(row.ip_address) || 0) + count);
        }
      }

      report.totalEvents = totalEvents;
      report.failureRate = totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0;

      // Get top users and IPs
      report.topUsers = Array.from(userCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, eventCount]) => ({ userId, eventCount }));

      report.topIPs = Array.from(ipCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ipAddress, eventCount]) => ({ ipAddress, eventCount }));

      return report;
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }

  /**
   * Add or update alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    const existingIndex = this.alertRules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.alertRules[existingIndex] = rule;
    } else {
      this.alertRules.push(rule);
    }
    console.log(`📢 Alert rule ${rule.enabled ? 'enabled' : 'disabled'}: ${rule.name}`);
  }

  /**
   * Export audit data (compliance-ready)
   */
  public async exportAuditData(
    startDate: Date,
    endDate: Date,
    format: 'csv' | 'json' = 'json'
  ): Promise<string> {
    const { events } = await this.queryEvents({
      startDate,
      endDate,
      limit: 100000, // Large limit for export
      sortBy: 'timestamp',
      sortOrder: 'asc'
    });

    if (format === 'csv') {
      return this.convertToCSV(events);
    } else {
      return JSON.stringify({
        exportDate: new Date().toISOString(),
        period: { start: startDate, end: endDate },
        eventCount: events.length,
        events
      }, null, 2);
    }
  }

  // Private helper methods

  private async processEvent(event: AuditEvent): Promise<void> {
    try {
      // Store in database
      await database.query(`
        INSERT INTO security_events (
          id, user_id, session_id, event_type, event_category, severity,
          description, metadata, ip_address, user_agent, request_id, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        event.id,
        event.userId,
        event.sessionId,
        event.eventType,
        event.eventCategory,
        event.severity,
        event.description,
        JSON.stringify({
          ...event.metadata,
          success: event.success,
          errorCode: event.errorCode,
          errorMessage: event.errorMessage,
          complianceRelevant: event.complianceRelevant,
          retentionDays: event.retentionDays,
          resource: event.resource,
          resourceId: event.resourceId
        }),
        event.ipAddress,
        event.userAgent,
        event.requestId,
        event.timestamp
      ]);

      // Check alert rules
      await this.checkAlertRules(event);
    } catch (error) {
      console.error('Event processing error:', error);
    }
  }

  private async checkAlertRules(event: AuditEvent): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      if (this.matchesAlertConditions(rule.conditions, event)) {
        await this.triggerAlert(rule, event);
      }
    }
  }

  private matchesAlertConditions(conditions: AlertRule['conditions'], event: AuditEvent): boolean {
    if (conditions.eventType && conditions.eventType !== event.eventType) return false;
    if (conditions.eventCategory && conditions.eventCategory !== event.eventCategory) return false;
    if (conditions.severity && conditions.severity !== event.severity) return false;
    if (conditions.failurePattern && event.success) return false;

    return true;
  }

  private async triggerAlert(rule: AlertRule, event: AuditEvent): Promise<void> {
    const key = `${rule.id}_${event.userId || 'system'}`;
    const history = this.alertHistory.get(key) || { count: 0, lastTriggered: new Date(0) };
    
    const now = new Date();
    const windowMs = (rule.conditions.timeWindow || 60) * 60 * 1000;

    // Reset count if outside time window
    if (now.getTime() - history.lastTriggered.getTime() > windowMs) {
      history.count = 0;
    }

    history.count++;
    history.lastTriggered = now;
    this.alertHistory.set(key, history);

    // Check if threshold is met
    const threshold = rule.conditions.threshold || 1;
    if (history.count >= threshold) {
      console.warn(`🚨 Alert triggered: ${rule.name} (${history.count}/${threshold})`);
      
      // Execute alert actions
      if (rule.actions.emailNotification) {
        await this.sendEmailAlert(rule, event, history);
      }
      
      if (rule.actions.autoBlock && event.ipAddress) {
        await this.autoBlockIP(event.ipAddress, rule.name);
      }

      // Reset count after triggering
      history.count = 0;
    }
  }

  private async sendEmailAlert(rule: AlertRule, event: AuditEvent, history: any): Promise<void> {
    // Implementation would integrate with your email service
    console.log(`📧 Email alert sent for rule: ${rule.name}`);
  }

  private async autoBlockIP(ipAddress: string, reason: string): Promise<void> {
    // Integration with security middleware to block IP
    console.log(`🚫 Auto-blocking IP ${ipAddress} - ${reason}`);
  }

  private getAuthenticationDescription(
    action: string,
    context: { method?: string; mfaUsed?: boolean; failureReason?: string }
  ): string {
    const methodStr = context.method ? ` via ${context.method}` : '';
    const mfaStr = context.mfaUsed ? ' with MFA' : '';
    const reasonStr = context.failureReason ? ` - ${context.failureReason}` : '';
    
    return `User ${action}${methodStr}${mfaStr}${reasonStr}`;
  }

  private sanitizeValues(values?: Record<string, any>): Record<string, any> | undefined {
    if (!values) return undefined;

    const sanitized = { ...values };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private isComplianceRelevant(category: EventCategory): boolean {
    const complianceCategories: EventCategory[] = [
      'data_export',
      'data_import',
      'permission_grant',
      'permission_revoke',
      'role_change',
      'admin_action'
    ];
    
    return complianceCategories.includes(category);
  }

  private getRetentionPeriod(eventType: EventType, complianceRelevant: boolean): number {
    if (complianceRelevant) return 2555; // 7 years for compliance
    if (eventType === 'security_incident') return 1095; // 3 years for security
    return 365; // 1 year default
  }

  private convertToCSV(events: AuditEvent[]): string {
    const headers = [
      'ID', 'Timestamp', 'User ID', 'Event Type', 'Event Category', 'Severity',
      'Action', 'Resource', 'Description', 'IP Address', 'Success', 'Error Message'
    ];

    const rows = events.map(event => [
      event.id || '',
      event.timestamp.toISOString(),
      event.userId || '',
      event.eventType,
      event.eventCategory,
      event.severity,
      event.action,
      event.resource || '',
      event.description,
      event.ipAddress || '',
      event.success.toString(),
      event.errorMessage || ''
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'multiple-failed-logins',
        name: 'Multiple Failed Logins',
        description: 'Alert on multiple failed login attempts',
        conditions: {
          eventCategory: 'login',
          threshold: 5,
          timeWindow: 15,
          failurePattern: true
        },
        actions: {
          emailNotification: true,
          autoBlock: true
        },
        enabled: true
      },
      {
        id: 'admin-actions',
        name: 'Administrative Actions',
        description: 'Alert on all admin actions',
        conditions: {
          eventType: 'system_administration',
          threshold: 1
        },
        actions: {
          emailNotification: true
        },
        enabled: true
      },
      {
        id: 'security-incidents',
        name: 'Security Incidents',
        description: 'Alert on all security incidents',
        conditions: {
          eventType: 'security_incident',
          threshold: 1
        },
        actions: {
          emailNotification: true,
          escalateSeverity: true
        },
        enabled: true
      }
    ];
  }

  private startBackgroundProcessing(): void {
    // Process event queue every 5 seconds
    setInterval(async () => {
      if (this.eventQueue.length === 0) return;

      const events = this.eventQueue.splice(0, 100); // Process in batches
      for (const event of events) {
        await this.processEvent(event);
      }
    }, 5000);
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();
export default auditLogger;