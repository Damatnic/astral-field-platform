// Error Handling Middleware for Next.js API Routes
// Centralized error processing and response formatting

import { NextRequest, NextResponse } from 'next/server';
import {
  AppError,
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
  errorHandler,
  createErrorResponse,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError
} from '@/lib/errorHandling';

// =============================================================================
// MIDDLEWARE TYPES
// =============================================================================

export type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>;

export interface ErrorMiddlewareOptions {
  enableLogging?: boolean;
  includeStackTrace?: boolean;
  corsEnabled?: boolean;
  rateLimiting?: {
    windowMs: number;
    maxRequests: number;
  };
}

// =============================================================================
// REQUEST CONTEXT EXTRACTION
// =============================================================================

function extractErrorContext(request: NextRequest): ErrorContext {
  const url = new URL(request.url);
  
  return {
    endpoint: url.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ipAddress: extractClientIP(request),
    requestId: generateRequestId(),
    timestamp: new Date(),
    additionalData: {
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries(request.headers.entries())
    }
  };
}

function extractClientIP(request: NextRequest): string {
  // Check various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIp || remoteAddr || 'unknown';
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// RATE LIMITING UTILITIES
// =============================================================================

class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  public checkLimit(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs * 2; // Keep extra buffer
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > cutoff);
      
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Default rate limiter instance
const defaultRateLimiter = new RateLimiter();

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export function validateRequired(
  data: any, 
  requiredFields: string[]
): void {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      missing[0]
    );
  }
}

export function validateTypes(
  data: any,
  schema: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
): void {
  for (const [field, expectedType] of Object.entries(schema)) {
    const value = data[field];
    
    if (value === undefined || value === null) {
      continue; // Allow null/undefined unless marked as required
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (actualType !== expectedType) {
      throw new ValidationError(
        `Field '${field}' must be of type ${expectedType}, got ${actualType}`,
        field
      );
    }
  }
}

export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    // Remove potentially dangerous characters
    return data
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 10000); // Limit length
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      // Sanitize key
      const cleanKey = typeof key === 'string' 
        ? key.replace(/[<>"'&]/g, '').substring(0, 100)
        : key;
      
      sanitized[cleanKey] = sanitizeInput(value);
    }
    
    return sanitized;
  }
  
  return data;
}

// =============================================================================
// CORS UTILITIES
// =============================================================================

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// =============================================================================
// MAIN ERROR MIDDLEWARE
// =============================================================================

export function withErrorHandling(
  handler: ApiHandler,
  options: ErrorMiddlewareOptions = {}
): ApiHandler {
  const {
    enableLogging = true,
    includeStackTrace = process.env.NODE_ENV === 'development',
    corsEnabled = true,
    rateLimiting
  } = options;

  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const errorContext = extractErrorContext(request);
    
    try {
      // Handle OPTIONS requests for CORS
      if (request.method === 'OPTIONS' && corsEnabled) {
        const response = new NextResponse(null, { status: 200 });
        return addCorsHeaders(response);
      }

      // Rate limiting
      if (rateLimiting) {
        const rateLimiter = new RateLimiter(
          rateLimiting.windowMs,
          rateLimiting.maxRequests
        );
        
        const identifier = errorContext.ipAddress || 'unknown';
        
        if (!rateLimiter.checkLimit(identifier)) {
          throw new RateLimitError(
            rateLimiting.maxRequests,
            rateLimiting.windowMs,
            errorContext
          );
        }
      }

      // Input sanitization for POST/PUT requests
      if (request.method === 'POST' || request.method === 'PUT') {
        try {
          const contentType = request.headers.get('content-type') || '';
          
          if (contentType.includes('application/json')) {
            const body = await request.json();
            const sanitizedBody = sanitizeInput(body);
            
            // Create new request with sanitized body
            const sanitizedRequest = new NextRequest(request.url, {
              method: request.method,
              headers: request.headers,
              body: JSON.stringify(sanitizedBody)
            });
            
            request = sanitizedRequest;
          }
        } catch (parseError) {
          throw new ValidationError('Invalid JSON in request body');
        }
      }

      // Execute the handler
      let response = await handler(request, context);

      // Add CORS headers if enabled
      if (corsEnabled) {
        response = addCorsHeaders(response);
      }

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Add request ID to response
      if (errorContext.requestId) {
        response.headers.set('X-Request-ID', errorContext.requestId);
      }

      return response;

    } catch (error) {
      // Handle the error using our centralized error handler
      let appError: AppError;
      
      if (error instanceof AppError) {
        appError = error;
        // Merge context
        appError.context = { ...appError.context, ...errorContext };
      } else {
        // Convert unknown errors to AppError
        appError = errorHandler.handle(error as Error, errorContext);
      }

      // Create error response
      let errorResponse = createErrorResponse(appError, request);

      // Add CORS headers to error response if enabled
      if (corsEnabled) {
        errorResponse = addCorsHeaders(errorResponse);
      }

      // Add security headers to error response
      errorResponse.headers.set('X-Content-Type-Options', 'nosniff');
      errorResponse.headers.set('X-Frame-Options', 'DENY');
      
      // Add request ID to error response
      if (errorContext.requestId) {
        errorResponse.headers.set('X-Request-ID', errorContext.requestId);
      }

      return errorResponse;
    }
  };
}

// =============================================================================
// SPECIALIZED MIDDLEWARE VARIANTS
// =============================================================================

export function withValidation(
  handler: ApiHandler,
  validationRules: {
    required?: string[];
    types?: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>;
    custom?: (data: any) => void;
  }
): ApiHandler {
  return withErrorHandling(async (request: NextRequest, context?: any) => {
    // Extract request data based on method
    let requestData: any = {};
    
    if (request.method === 'GET') {
      const url = new URL(request.url);
      requestData = Object.fromEntries(url.searchParams);
    } else if (request.method === 'POST' || request.method === 'PUT') {
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        requestData = await request.json();
      }
    }

    // Apply validation rules
    if (validationRules.required) {
      validateRequired(requestData, validationRules.required);
    }
    
    if (validationRules.types) {
      validateTypes(requestData, validationRules.types);
    }
    
    if (validationRules.custom) {
      validationRules.custom(requestData);
    }

    return handler(request, context);
  });
}

export function withAuth(
  handler: ApiHandler,
  options: {
    required?: boolean;
    roles?: string[];
  } = {}
): ApiHandler {
  return withErrorHandling(async (request: NextRequest, context?: any) => {
    const { required = true, roles = [] } = options;
    
    // Extract authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader && required) {
      throw new AuthenticationError('Authorization header missing');
    }
    
    if (authHeader && !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Invalid authorization format');
    }
    
    // Extract token
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token && required) {
      throw new AuthenticationError('Authorization token missing');
    }
    
    // TODO: Implement actual token validation
    // const user = await validateToken(token);
    
    // if (!user && required) {
    //   throw new AuthenticationError('Invalid or expired token');
    // }
    
    // Role-based authorization
    // if (roles.length > 0 && user && !roles.some(role => user.roles.includes(role))) {
    //   throw new AuthorizationError('resource', 'access');
    // }
    
    return handler(request, context);
  });
}

export function withRateLimit(
  handler: ApiHandler,
  windowMs: number = 60000,
  maxRequests: number = 100
): ApiHandler {
  return withErrorHandling(handler, {
    rateLimiting: { windowMs, maxRequests }
  });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function createSuccessResponse<T>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  );
}

export function createValidationResponse(
  errors: Array<{ field: string; message: string }>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      },
      timestamp: new Date().toISOString()
    },
    { status: 400 }
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  extractErrorContext,
  extractClientIP,
  generateRequestId,
  RateLimiter,
  addCorsHeaders
};

// Export default middleware
export default withErrorHandling;