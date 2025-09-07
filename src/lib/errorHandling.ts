// Comprehensive Error Handling System
// Centralized error management with logging, monitoring, and recovery

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// ERROR TYPES AND CLASSIFICATIONS
// =============================================================================

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  SECURITY = 'security'
}

export interface ErrorContext {
  userId?: string;
  leagueId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  requestId?: string;
  timestamp?: Date;
  additionalData?: Record<string, any>;
}

export interface ErrorDetails {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: ErrorContext;
  stack?: string;
  cause?: Error;
  retryable?: boolean;
  userMessage?: string;
  internalMessage?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

export class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly internalMessage: string;
  public readonly metadata?: Record<string, any>;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'AppError';
    this.code = details.code;
    this.category = details.category;
    this.severity = details.severity;
    this.context = details.context;
    this.retryable = details.retryable ?? false;
    this.userMessage = details.userMessage || this.getDefaultUserMessage();
    this.internalMessage = details.internalMessage || details.message;
    this.metadata = details.metadata;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    // Preserve original error stack if cause is provided
    if (details.cause) {
      this.stack = `${this.stack}\nCaused by: ${details.cause.stack}`;
    }
  }

  private getDefaultUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorCategory.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.DATABASE:
        return 'A database error occurred. Please try again later.';
      case ErrorCategory.EXTERNAL_API:
        return 'External service is temporarily unavailable.';
      case ErrorCategory.RATE_LIMIT:
        return 'Too many requests. Please wait before trying again.';
      case ErrorCategory.NETWORK:
        return 'Network error. Please check your connection.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      retryable: this.retryable,
      userMessage: this.userMessage,
      internalMessage: this.internalMessage,
      metadata: this.metadata,
      stack: this.stack
    };
  }
}

// Specific error classes for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: ErrorContext) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      context,
      userMessage: `Invalid ${field || 'input'}: ${message}`,
      metadata: { field }
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: ErrorContext) {
    super({
      code: 'AUTHENTICATION_ERROR',
      message,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      context,
      userMessage: 'Please log in to continue.'
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(resource: string, action: string, context?: ErrorContext) {
    super({
      code: 'AUTHORIZATION_ERROR',
      message: `Access denied to ${resource} for ${action}`,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      context,
      userMessage: 'You do not have permission to perform this action.',
      metadata: { resource, action }
    });
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, cause?: Error, context?: ErrorContext) {
    super({
      code: 'DATABASE_ERROR',
      message: `Database operation failed: ${operation}`,
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      context,
      cause,
      retryable: true,
      userMessage: 'A database error occurred. Please try again.',
      metadata: { operation }
    });
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, status?: number, cause?: Error, context?: ErrorContext) {
    super({
      code: 'EXTERNAL_API_ERROR',
      message: `External API error from ${service}${status ? ` (${status})` : ''}`,
      category: ErrorCategory.EXTERNAL_API,
      severity: ErrorSeverity.MEDIUM,
      context,
      cause,
      retryable: true,
      userMessage: 'External service is temporarily unavailable.',
      metadata: { service, status }
    });
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, windowMs: number, context?: ErrorContext) {
    super({
      code: 'RATE_LIMIT_ERROR',
      message: `Rate limit exceeded: ${limit} requests per ${windowMs}ms`,
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      context,
      retryable: true,
      userMessage: 'Too many requests. Please wait before trying again.',
      metadata: { limit, windowMs }
    });
  }
}

export class SecurityError extends AppError {
  constructor(violation: string, context?: ErrorContext) {
    super({
      code: 'SECURITY_ERROR',
      message: `Security violation: ${violation}`,
      category: ErrorCategory.SECURITY,
      severity: ErrorSeverity.HIGH,
      context,
      userMessage: 'Security check failed. Please try again.',
      metadata: { violation }
    });
  }
}

// =============================================================================
// ERROR HANDLER CLASS
// =============================================================================

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: Array<{ error: AppError; timestamp: Date }> = [];
  private readonly maxQueueSize = 1000;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handle(error: Error | AppError, context?: ErrorContext): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
      // Merge additional context if provided
      if (context) {
        appError = new AppError({
          code: appError.code,
          message: appError.message,
          category: appError.category,
          severity: appError.severity,
          context: { ...(appError.context || {}), ...context },
          userMessage: appError.userMessage,
          internalMessage: appError.internalMessage,
          metadata: appError.metadata,
          retryable: appError.retryable
        });
      }
    } else {
      // Convert generic Error to AppError
      appError = new AppError({
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred',
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.MEDIUM,
        context,
        cause: error
      });
    }

    // Add to error queue for monitoring
    this.addToQueue(appError);

    // Log the error
    this.logError(appError);

    // Handle critical errors immediately
    if (appError.severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(appError);
    }

    return appError;
  }

  private addToQueue(error: AppError): void {
    this.errorQueue.push({ error, timestamp: new Date() });
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logData = {
      code: error.code,
      message: error.message,
      category: error.category,
      severity: error.severity,
      context: error.context,
      metadata: error.metadata,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    // Use appropriate logging method based on severity
    switch (logLevel) {
      case 'error':
        console.error(`[ERROR] ${error.code}:`, logData);
        break;
      case 'warn':
        console.warn(`[WARN] ${error.code}:`, logData);
        break;
      default:
        console.log(`[INFO] ${error.code}:`, logData);
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(logData);
    }
  }

  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      default:
        return 'info';
    }
  }

  private handleCriticalError(error: AppError): void {
    // Immediate notification for critical errors
    console.error('[CRITICAL ERROR]', error.toJSON());
    
    // In production, trigger alerts
    if (process.env.NODE_ENV === 'production') {
      this.triggerAlert(error);
    }
  }

  private async sendToExternalLogger(logData: any): Promise<void> {
    try {
      // Example: Send to external logging service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logData)
      // });
    } catch (loggingError) {
      console.error('Failed to send log to external service:', loggingError);
    }
  }

  private async triggerAlert(error: AppError): Promise<void> {
    try {
      // Example: Send alert to monitoring service
      // await fetch('/api/alerts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     type: 'critical_error',
      //     error: error.toJSON(),
      //     timestamp: new Date().toISOString()
      //   })
      // });
    } catch (alertError) {
      console.error('Failed to trigger alert:', alertError);
    }
  }

  public getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    recentErrors: Array<{ code: string; count: number }>;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = this.errorQueue.filter(
      item => item.timestamp >= oneHourAgo
    );

    const bySeverity = {} as Record<ErrorSeverity, number>;
    const byCategory = {} as Record<ErrorCategory, number>;
    const errorCounts = {} as Record<string, number>;

    recentErrors.forEach(item => {
      const { error } = item;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
    });

    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }));

    return {
      total: recentErrors.length,
      bySeverity,
      byCategory,
      recentErrors: topErrors
    };
  }
}

// =============================================================================
// MIDDLEWARE AND UTILITIES
// =============================================================================

export function createErrorResponse(error: AppError, request?: NextRequest): NextResponse {
  const statusCode = getHttpStatusCode(error);
  
  const responseData = {
    error: {
      code: error.code,
      message: error.userMessage,
      category: error.category,
      retryable: error.retryable
    },
    requestId: error.context?.requestId || generateRequestId(),
    timestamp: new Date().toISOString()
  };

  // Add debug info in development
  if (process.env.NODE_ENV === 'development') {
    responseData.error = {
      ...responseData.error,
      internalMessage: error.internalMessage,
      stack: error.stack,
      metadata: error.metadata
    } as any;
  }

  return NextResponse.json(responseData, { status: statusCode });
}

function getHttpStatusCode(error: AppError): number {
  switch (error.category) {
    case ErrorCategory.VALIDATION:
      return 400;
    case ErrorCategory.AUTHENTICATION:
      return 401;
    case ErrorCategory.AUTHORIZATION:
      return 403;
    case ErrorCategory.RATE_LIMIT:
      return 429;
    case ErrorCategory.EXTERNAL_API:
      return 502;
    case ErrorCategory.DATABASE:
    case ErrorCategory.SYSTEM:
      return 500;
    default:
      return error.severity === ErrorSeverity.CRITICAL ? 500 : 400;
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// ASYNC ERROR WRAPPER
// =============================================================================

export function asyncErrorWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Partial<ErrorContext>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance();
      const appError = errorHandler.handle(error as Error, context);
      throw appError;
    }
  }) as T;
}

// =============================================================================
// ERROR RECOVERY UTILITIES
// =============================================================================

export class ErrorRecovery {
  public static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000,
    context?: ErrorContext
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for non-retryable errors
        if (error instanceof AppError && !error.retryable) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const errorHandler = ErrorHandler.getInstance();
    throw errorHandler.handle(lastError!, context);
  }

  public static async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (error) {
      console.warn('Primary operation failed, trying fallback:', error);
      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        const errorHandler = ErrorHandler.getInstance();
        throw errorHandler.handle(fallbackError as Error, context);
      }
    }
  }

  public static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context?: ErrorContext
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AppError({
          code: 'OPERATION_TIMEOUT',
          message: `Operation timed out after ${timeoutMs}ms`,
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.MEDIUM,
          context,
          metadata: { timeoutMs }
        }));
      }, timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Export for testing
export { ErrorHandler as ErrorHandlerClass };
