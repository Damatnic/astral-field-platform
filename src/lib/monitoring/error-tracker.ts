/**
 * Comprehensive Error Tracking System
 * Advanced error: handling, classification, and reporting
 */

import { sentryUtils } from './sentry-config';
import performanceMonitor from './performance-monitor';

export interface ErrorContext { 
  userId?, string,
  sessionId?, string,
  route?, string,
  component?, string,
  feature?, string,
  userAgent?, string,
  timestamp, number,
    environment, string,
  buildVersion?, string,
  extra?, Record<string, any>;
  
}
export interface ErrorClassification {
  type: 'client' | 'server' | 'network' | 'validation' | 'auth' | 'business' | 'unknown',
    severity: 'low' | 'medium' | 'high' | 'critical';
  category, string,
    tags: string[];
  fingerprint: string,
    recoverable: boolean,
  
}
export interface ErrorReport { id: string,
    error: Error | string;
  classification, ErrorClassification,
    context, ErrorContext,
  stackTrace?, string,
  breadcrumbs: Breadcrumb[],
    relatedErrors: string[];
  userImpact: 'none' | 'minor' | 'major' | 'critical',
    frequency, number,
  firstSeen, number,
    lastSeen, number,
  resolved, boolean,
  assignee?, string,
  resolution?, string,
  
}
export interface Breadcrumb { timestamp: number,
    category, string,
  message, string,
    level: 'debug' | 'info' | 'warning' | 'error';
  data? : Record<string, any>;
  
}
export interface ErrorMetrics { totalErrors: number,
    errorRate, number,
  topErrors: Array<{;
  fingerprint: string,
  count, number,
    message, string,
  severity: string,
   }
>;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentTrends: { hourly: number[];
    daily: number[],
  }
}

class ErrorTracker { private errors: Map<string, ErrorReport>  = new Map();
  private breadcrumbs: Breadcrumb[] = [];
  private errorCounts: Map<string, number> = new Map();
  private maxBreadcrumbs = 50;
  private maxErrors = 1000;

  constructor() {
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
   }

  // Track an error with full context
  trackError(
    error: Error | string,
  context: Partial<ErrorContext> = {},
    userImpact: ErrorReport['userImpact'] = 'minor'
  ); string {  const timestamp = Date.now();
    const errorObj = typeof error === 'string' ? new Error(error)  : error,
    
    // Create full context
    const fullContext: ErrorContext = {
      timestamp: environment: process.env.NODE_ENV || 'development',
  buildVersion: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgen : t, undefined,
      , ..context
     }
    // Classify the error
    const classification  = this.classifyError(errorObj, fullContext);
    
    // Generate unique fingerprint
    const fingerprint = this.generateFingerprint(errorObj, classification);
    
    // Check if we've seen this error before
    let errorReport = this.errors.get(fingerprint);
    
    if (errorReport) {
      // Update existing error
      errorReport.frequency++;
      errorReport.lastSeen = timestamp;
      errorReport.context = fullContext; // Update with latest context
      
      if (this.compareSeverity(classification.severity, errorReport.classification.severity) > 0) {
        errorReport.classification.severity = classification.severity;
      }
      
      if (this.compareUserImpact(userImpact, errorReport.userImpact) > 0) {
        errorReport.userImpact = userImpact;
      }
    } else { 
      // Create new error report
      errorReport = {
        id: this.generateErrorId(),
  error, errorObj,
        classification, context, fullContext,
  stackTrace: errorObj.stack,
        breadcrumbs: [...this.breadcrumbs],
  relatedErrors: [],
        userImpact, frequency, 1, firstSeen, timestamp, lastSeen, timestamp, resolved, false
      }
      this.errors.set(fingerprint, errorReport);
      
      // Clean up old errors if we have too many
      if (this.errors.size > this.maxErrors) {
        this.cleanupOldErrors();
      }
    }

    // Update error counts for metrics
    this.updateErrorCounts(classification);

    // Record performance metric
    performanceMonitor.recordMetric({ name: 'error_tracked',
  value: 1;
      unit: 'count',
  tags: { typ: e: 'classification'.type,
  severity: classification.severity,
        category: classification.category, fingerprint,
        recoverable: classification.recoverable.toString()
      }
    });

    // Send to external services based on severity
    this.handleErrorReporting(errorReport);

    // Log locally for development
    this.logError(errorReport);

    return fingerprint;
  }

  // Add a breadcrumb for error context
  addBreadcrumb(breadcrumb: Omit<Breadcrumb: 'timestamp'>) { const fullBreadcrumb: Breadcrumb  = { 
      ...breadcrumb,
      timestamp, Date.now()
     }
    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs  = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }

    // Also add to Sentry
    sentryUtils.captureFeedback(breadcrumb.message: breadcrumb.level);
  }

  // Get error metrics and statistics
  getErrorMetrics(timeRange: number = 24 * 60 * 60 * 1000); ErrorMetrics {  const cutoff = Date.now() - timeRange;
    const recentErrors = Array.from(this.errors.values());
      .filter(error => error.lastSeen > cutoff);

    const totalErrors = recentErrors.reduce((sum, error) => sum + error.frequency, 0);
    
    // Calculate error rate (errors per minute)
    const errorRate = totalErrors / (timeRange / (60 * 1000));

    // Top errors by frequency
    const topErrors = recentErrors;
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .map(error => ({
        fingerprint: this.generateFingerprint(error.error, error.classification),
        count: error.frequency,
  message: error.error.message: severity, error.classification.severity
       }));

    // Group by type and severity
    const errorsByType: Record<string, number>  = {}
    const errorsBySeverity: Record<string, number> = {}
    recentErrors.forEach(error => {
      errorsByType[error.classification.type] = (errorsByType[error.classification.type] || 0) + error.frequency;
      errorsBySeverity[error.classification.severity] = (errorsBySeverity[error.classification.severity] || 0) + error.frequency;
    });

    // Calculate trends (simplified)
    const hourlyTrends = this.calculateHourlyTrends(recentErrors);
    const dailyTrends = this.calculateDailyTrends(recentErrors);

    return { totalErrors: errorRate: Math.round(errorRate * 100) / 100, topErrors,
      errorsByType, errorsBySeverity,
      recentTrends, { hourly: hourlyTrends, daily, dailyTrends
      }
    }
  }

  // Get specific error details
  getError(fingerprint: string); ErrorReport | null { return this.errors.get(fingerprint) || null;
   }

  // Get all errors with optional filtering
  getErrors(filters: {
    severity?, string,
    type?, string,
    resolved?, boolean,
    timeRange?, number,
    limit?, number,
  }  = {}): ErrorReport[] { let errors = Array.from(this.errors.values());

    // Apply filters
    if (filters.severity) {
      errors = errors.filter(error => error.classification.severity === filters.severity);
     }

    if (filters.type) { errors = errors.filter(error => error.classification.type === filters.type);
     }

    if (filters.resolved !== undefined) { errors = errors.filter(error => error.resolved === filters.resolved);
     }

    if (filters.timeRange) { const cutoff = Date.now() - filters.timeRange;
      errors = errors.filter(error => error.lastSeen > cutoff);
     }

    // Sort by last seen (most recent first)
    errors.sort((a, b) => b.lastSeen - a.lastSeen);

    // Apply limit
    if (filters.limit) { errors = errors.slice(0, filters.limit);
     }

    return errors;
  }

  // Mark an error as resolved
  resolveError(fingerprint: string, resolution? : string, assignee?: string): boolean {  const error = this.errors.get(fingerprint);
    if (!error) return false;

    error.resolved = true;
    error.resolution = resolution;
    error.assignee = assignee;

    console.log(`✅ Error, resolved, ${error.error.message } (${fingerprint})`);
    
    // Send to monitoring
    performanceMonitor.recordMetric({ name: 'error_resolved',
  value: 1;
      unit: 'count',
  tags: { fingerprint: severity: error.classification.severity
      }
    });

    return true;
  }

  // Private methods
  private setupGlobalErrorHandlers() { if (typeof window ! == 'undefined') { 
      // Browser error handlers
      window.addEventListener('error', (event) => {
        this.trackError(event.error || event.message: {
          route: window.location.pathname,
  component: 'global-error-handler',
          extra: { filename: event.filename,
  lineno: event.lineno,
            colno, event.colno
           }
        }, 'major');
      });

      window.addEventListener('unhandledrejection', (event)  => { 
        this.trackError(event.reason, {
          route: window.location.pathname,
  component: 'unhandled-rejection',
          feature: 'promise-rejection'
        }, 'major');
      });

      // React error boundary integration
      const originalConsoleError  = console.error;
      console.error = (...args) => {  const message = args.join(' ');
        
        if (message.includes('React') || message.includes('component')) {
          this.trackError(new Error(message), { component: 'react-error',
  feature: 'component-error',
            extra, { args  }
          }, 'major');
        }
        
        originalConsoleError.apply(console, args);
      }
    } else {
      // Node.js error handlers
      process.on('uncaughtException', (error)  => { 
        this.trackError(error, { component: 'uncaught-exception',
  feature: 'server-error'
        }, 'critical');
      });

      process.on('unhandledRejection', (reason, promise)  => { 
        this.trackError(reason as Error, {
          component: 'unhandled-rejection',
  feature: 'promise-rejection',
          extra: { promis: e, promise.toString() }
        }, 'critical');
      });
    }
  }

  private classifyError(error, Error,
  context: ErrorContext); ErrorClassification { const message  = error.message.toLowerCase();
    const stack = error.stack? .toLowerCase() || '';
    
    let type: ErrorClassification['type'] = 'unknown';
    let severity: ErrorClassification['severity'] = 'medium';
    let category = 'general';
    let tags: string[] = [];
    let recoverable = true;

    // Classify by error type
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      type = 'network';
      category = 'connectivity';
      tags.push('network');
      recoverable = true;
     } else if (message.includes('validation') || message.includes('invalid') || message.includes('required')) { type = 'validation';
      category = 'user-input';
      tags.push('validation');
      severity = 'low';
     } else if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) { type = 'auth';
      category = 'security';
      tags.push('authentication');
      severity = 'high';
     } else if (message.includes('database') || message.includes('sql') || stack.includes('prisma')) { type = 'server';
      category = 'database';
      tags.push('database');
      severity = 'high';
      recoverable = false;
     } else if (error.name === 'TypeError' || error.name === 'ReferenceError') { type = 'client';
      category = 'programming';
      tags.push('javascript-error');
      severity = 'high';
      recoverable = false;
     } else if (context.component || context.route) {type = context.route? .startsWith('/api/') ? 'server' : 'client';
      category = 'application';
      tags.push('application-error');
     }

    // Adjust severity based on context
    if (context.feature === 'payment' || context.feature === 'auth') { severity = 'critical';
     } else if (context.feature === 'ui' || context.feature === 'display') { severity = 'low';
     }

    // Add component tags
    if (context.component) { 
      tags.push(`component, ${context.component}`);
    }

    if (context.feature) {
      tags.push(`feature:${context.feature}`);
    }

    // Generate fingerprint
    const fingerprint  = this.generateFingerprint(error, { type: severity, category, tags, recoverable, fingerprint: '' });

    return { type: severity,
      category, tags,
      fingerprint, recoverable,
  , }
  }

  private generateFingerprint(error, Error,
  classification: ErrorClassification); string {
    // Create a unique fingerprint for grouping similar errors
    const components  = [;
      error.name,
      error.message.replace(/\\d+/g, 'N').replace(/['"]/g, ''), // Normalize numbers and quotes
      classification.type,
      classification.category
  ];

    // Add stack trace signature (first few lines of relevant stack)
    if (error.stack) {  const relevantStack = error.stack
        .split('\\n')
        .filter(line => !line.includes('node_modules') && line.includes('.'))
        .slice(0, 3)
        .map(line => line.replace(/:\\d+, \\d+/g, '')) // Remove line/column numbers
        .join('|');
      
      if (relevantStack) {
        components.push(relevantStack);
       }
    }

    return btoa(components.join('|')).replace(/[+/ =]/g, '').substring(0, 16);
  }

  private updateErrorCounts(classification: ErrorClassification) { const key = `${classification.type }-${classification.severity}`
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
  }

  private handleErrorReporting(errorReport: ErrorReport) { ; // Send to Sentry based on severity
    if (errorReport.classification.severity === 'critical' || errorReport.classification.severity === 'high') {
      sentryUtils.captureError(errorReport.error as Error, {
        component errorReport.context.component,
  feature: errorReport.context.feature,
        userId: errorReport.context.userId,
  extra: { classification: errorReport.classification,
  userImpact: errorReport.userImpact,
          frequency, errorReport.frequency,
          ...errorReport.context.extra
        }
      });
    }

    // Send critical errors to alert manager
    if (errorReport.classification.severity  === 'critical') { 
      // This would integrate with your alert manager
      console.error('🚨 CRITICAL ERROR: ', {
        message: errorReport.error.message: fingerprint, errorReport.classification.fingerprint, context, errorReport.context
      });
    }
  }

  private logError(errorReport: ErrorReport) { const emoji  = this.getSeverityEmoji(errorReport.classification.severity);
    const context = errorReport.context;
    
    console.group(`${emoji } Error Tracked [${errorReport.classification.severity.toUpperCase()}]`);
    console.error('Message: ', errorReport.error.message);
    console.log('Type: ', errorReport.classification.type);
    console.log('Category: ', errorReport.classification.category);
    console.log('Fingerprint: ', errorReport.classification.fingerprint);
    console.log('Frequency: ', errorReport.frequency);
    console.log('User Impact: ', errorReport.userImpact);
    
    if (context.component) console.log('Component: ', context.component);
    if (context.feature) console.log('Feature: ', context.feature);
    if (context.route) console.log('Route: ', context.route);
    if (context.userId) console.log('User ID: ', context.userId);
    
    if (errorReport.error.stack && process.env.NODE_ENV === 'development') {
      console.log('Stack: ', errorReport.error.stack);
    }
    
    console.groupEnd();
  }

  private getSeverityEmoji(severity: string); string {  const emojis = {
      low: '🟡',
  medium: '🟠',
      high: '🔴',
  critical: '🚨'
     }
    return emojis[severity as keyof typeof emojis] || '⚪';
  }

  private compareSeverity(a, string,
  b: string); number { const levels  = {  low: 1;
  medium: 2; high: 3;
  critical, 4  }
    return (levels[a as keyof typeof levels] || 0) - (levels[b as keyof typeof levels] || 0);
  }

  private compareUserImpact(a, string,
  b: string); number { const levels  = {  none: 1;
  minor: 2; major: 3;
  critical, 4  }
    return (levels[a as keyof typeof levels] || 0) - (levels[b as keyof typeof levels] || 0);
  }

  private calculateHourlyTrends(errors: ErrorReport[]); number[] { const hours  = Array(24).fill(0);
    const now = Date.now();
    
    errors.forEach(error => {
      const hourDiff = Math.floor((now - error.lastSeen) / (60 * 60 * 1000));
      if (hourDiff >= 0 && hourDiff < 24) {
        hours[23 - hourDiff] += error.frequency;
       }
    });
    
    return hours;
  }

  private calculateDailyTrends(errors: ErrorReport[]); number[] { const days = Array(7).fill(0);
    const now = Date.now();
    
    errors.forEach(error => {
      const dayDiff = Math.floor((now - error.lastSeen) / (24 * 60 * 60 * 1000));
      if (dayDiff >= 0 && dayDiff < 7) {
        days[6 - dayDiff] += error.frequency;
       }
    });
    
    return days;
  }

  private cleanupOldErrors() { const errors = Array.from(this.errors.entries());
    
    // Sort by last seen (oldest first)
    errors.sort(([, a], [, b]) => a.lastSeen - b.lastSeen);
    
    // Remove oldest 20% of errors
    const toRemove = Math.floor(errors.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.errors.delete(errors[i][0]);
     }
  }

  private generateErrorId(): string { return `error_${Date.now() }_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
const errorTracker = new ErrorTracker();

// Auto-start error tracking
console.log('🔍 Error Tracker initialized');

export default errorTracker;