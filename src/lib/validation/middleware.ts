/**
 * Validation middleware for API routes
 * Provides comprehensive request validation and sanitization
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  validateRequestBody,
  validateQueryParams,
  validateRouteParams,
  validateSecurityPatterns,
  createValidationErrorResponse,
  hasValidationErrors,
  ValidationConfig,
  ValidationResult
} from './validators';
import * as sanitizers from './sanitizers';

// ===== MIDDLEWARE TYPES =====

export interface ValidationMiddlewareConfig extends ValidationConfig {
  bodySchema?: z.ZodSchema<any>;
  querySchema?: z.ZodSchema<any>;
  paramsSchema?: z.ZodSchema<any>;
  requireAuth?: boolean;
  rateLimiting?: {
    requests: number;
    window: number; // in seconds
  };
  logValidationErrors?: boolean;
  customValidators?: Array<(request: NextRequest) => Promise<ValidationResult<any>> | ValidationResult<any>>;
}

export interface ValidatedRequest extends NextRequest {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
  sanitizedData?: any;
}

export type ApiHandler = (request: ValidatedRequest, context?: any) => Promise<NextResponse> | NextResponse;
export type ApiHandlerWithParams = (request: ValidatedRequest, params: any) => Promise<NextResponse> | NextResponse;

// ===== RATE LIMITING STORE =====

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// ===== CORE MIDDLEWARE FUNCTION =====

/**
 * Creates a validation middleware with the specified configuration
 */
export function createValidationMiddleware(config: ValidationMiddlewareConfig = {}) {
  return function validationMiddleware<T extends ApiHandler | ApiHandlerWithParams>(handler: T): T {
    return (async (request: NextRequest, ...args: any[]) => {
      const startTime = Date.now();
      const {
        bodySchema,
        querySchema,
        paramsSchema,
        requireAuth = false,
        rateLimiting,
        logValidationErrors = true,
        customValidators = [],
        sanitize = true,
        maxPayloadSize = 1024 * 1024 // 1MB default
      } = config;

      try {
        // ===== RATE LIMITING =====
        if (rateLimiting) {
          const rateLimitResult = await checkRateLimit(request, rateLimiting);
          if (!rateLimitResult.success) {
            return NextResponse.json(
              createValidationErrorResponse(rateLimitResult.errors!),
              { 
                status: 429,
                headers: {
                  'X-RateLimit-Limit': rateLimiting.requests.toString(),
                  'X-RateLimit-Remaining': '0',
                  'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + rateLimiting.window).toString()
                }
              }
            );
          }
        }

        // ===== SECURITY VALIDATION =====
        const securityResult = await validateRequestSecurity(request);
        if (!securityResult.success) {
          if (logValidationErrors) {
            console.warn('Security validation failed:', securityResult.errors);
          }
          return NextResponse.json(
            createValidationErrorResponse(securityResult.errors!),
            { status: 400 }
          );
        }

        // ===== CONTENT LENGTH VALIDATION =====
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > maxPayloadSize) {
          return NextResponse.json(
            createValidationErrorResponse([{
              field: 'body',
              message: `Request payload too large. Maximum size: ${maxPayloadSize} bytes`,
              code: 'PAYLOAD_TOO_LARGE'
            }]),
            { status: 413 }
          );
        }

        const validatedRequest = request as ValidatedRequest;
        const validationErrors: any[] = [];

        // ===== BODY VALIDATION =====
        if (bodySchema && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
          const bodyResult = await validateRequestBody(request, bodySchema, { sanitize, maxPayloadSize });
          if (hasValidationErrors(bodyResult)) {
            validationErrors.push(...bodyResult.errors);
          } else if (bodyResult.success) {
            validatedRequest.validatedBody = bodyResult.data;
          }
        }

        // ===== QUERY PARAMETERS VALIDATION =====
        if (querySchema) {
          const queryResult = validateQueryParams(request, querySchema, { sanitize });
          if (hasValidationErrors(queryResult)) {
            validationErrors.push(...queryResult.errors);
          } else if (queryResult.success) {
            validatedRequest.validatedQuery = queryResult.data;
          }
        }

        // ===== ROUTE PARAMETERS VALIDATION =====
        if (paramsSchema && args.length > 0 && typeof args[0] === 'object') {
          const paramsResult = validateRouteParams(args[0].params || {}, paramsSchema);
          if (hasValidationErrors(paramsResult)) {
            validationErrors.push(...paramsResult.errors);
          } else if (paramsResult.success) {
            validatedRequest.validatedParams = paramsResult.data;
          }
        }

        // ===== CUSTOM VALIDATORS =====
        for (const validator of customValidators) {
          const customResult = await validator(request);
          if (hasValidationErrors(customResult)) {
            validationErrors.push(...customResult.errors);
          }
        }

        // ===== RETURN VALIDATION ERRORS =====
        if (validationErrors.length > 0) {
          if (logValidationErrors) {
            console.warn('Validation errors:', {
              url: request.url,
              method: request.method,
              errors: validationErrors,
              timestamp: new Date().toISOString()
            });
          }
          return NextResponse.json(
            createValidationErrorResponse(validationErrors),
            { status: 400 }
          );
        }

        // ===== CALL ORIGINAL HANDLER =====
        const response = args.length > 0 
          ? await (handler as any)(validatedRequest, args[0])
          : await (handler as any)(validatedRequest);

        // ===== LOG SUCCESSFUL REQUEST =====
        const duration = Date.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Validated request: ${request.method} ${request.url} (${duration}ms)`);
        }

        return response;

      } catch (error) {
        console.error('Validation middleware error:', error);
        
        // Log error details for debugging
        if (logValidationErrors) {
          console.error('Validation middleware error details:', {
            url: request.url,
            method: request.method,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Internal validation error',
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
      }
    }) as T;
  };
}

// ===== SECURITY VALIDATION =====

async function validateRequestSecurity(request: NextRequest): Promise<ValidationResult<any>> {
  try {
    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-original-url',
      'x-rewrite-url'
    ];

    for (const header of suspiciousHeaders) {
      const value = request.headers.get(header);
      if (value && value.includes('..')) {
        return {
          success: false,
          errors: [{
            field: 'headers',
            message: 'Suspicious header detected',
            code: 'SUSPICIOUS_HEADER'
          }]
        };
      }
    }

    // Validate User-Agent
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10 || userAgent.length > 1000) {
      // Log but don't block - some legitimate clients have unusual User-Agents
      if (process.env.NODE_ENV === 'development') {
        console.warn('Suspicious User-Agent:', userAgent);
      }
    }

    // Check for malicious URL patterns
    const url = new URL(request.url);
    if (url.pathname.includes('..') || url.search.includes('<script')) {
      return {
        success: false,
        errors: [{
          field: 'url',
          message: 'Malicious URL pattern detected',
          code: 'MALICIOUS_URL'
        }]
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'security',
        message: 'Security validation failed',
        code: 'SECURITY_ERROR'
      }]
    };
  }
}

// ===== RATE LIMITING =====

async function checkRateLimit(
  request: NextRequest,
  limits: { requests: number; window: number }
): Promise<ValidationResult<any>> {
  try {
    // Get client identifier
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               request.headers.get('remote-addr') || 
               'unknown';
    
    const key = sanitizers.sanitizeRateLimitKey(`${ip}:${request.method}:${new URL(request.url).pathname}`);
    const now = Date.now();
    const windowMs = limits.window * 1000;
    
    // Clean up expired entries
    for (const [entryKey, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(entryKey);
      }
    }
    
    const entry = rateLimitStore.get(key);
    
    if (!entry) {
      // First request in window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { success: true };
    }
    
    if (entry.resetTime < now) {
      // Window has expired, reset
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { success: true };
    }
    
    if (entry.count >= limits.requests) {
      // Rate limit exceeded
      return {
        success: false,
        errors: [{
          field: 'rate_limit',
          message: `Rate limit exceeded. Maximum ${limits.requests} requests per ${limits.window} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED'
        }]
      };
    }
    
    // Increment counter
    entry.count++;
    return { success: true };
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Don't block request on rate limiting errors
    return { success: true };
  }
}

// ===== PRESET MIDDLEWARE CONFIGURATIONS =====

/**
 * Middleware for authentication endpoints
 */
export const authValidationMiddleware = createValidationMiddleware({
  sanitize: true,
  maxPayloadSize: 1024, // 1KB
  rateLimiting: {
    requests: 5,
    window: 300 // 5 requests per 5 minutes
  },
  logValidationErrors: true
});

/**
 * Middleware for user input endpoints (chat, forums)
 */
export const userInputValidationMiddleware = createValidationMiddleware({
  sanitize: true,
  maxPayloadSize: 5 * 1024, // 5KB
  rateLimiting: {
    requests: 30,
    window: 60 // 30 requests per minute
  },
  logValidationErrors: true
});

/**
 * Middleware for admin endpoints
 */
export const adminValidationMiddleware = createValidationMiddleware({
  sanitize: true,
  maxPayloadSize: 10 * 1024, // 10KB
  requireAuth: true,
  rateLimiting: {
    requests: 10,
    window: 60 // 10 requests per minute
  },
  logValidationErrors: true
});

/**
 * Middleware for file upload endpoints
 */
export const fileUploadValidationMiddleware = createValidationMiddleware({
  sanitize: false, // Don't sanitize file data
  maxPayloadSize: 10 * 1024 * 1024, // 10MB
  rateLimiting: {
    requests: 5,
    window: 60 // 5 uploads per minute
  },
  logValidationErrors: true
});

/**
 * Middleware for high-frequency endpoints (live data)
 */
export const highFrequencyValidationMiddleware = createValidationMiddleware({
  sanitize: true,
  maxPayloadSize: 2 * 1024, // 2KB
  rateLimiting: {
    requests: 100,
    window: 60 // 100 requests per minute
  },
  logValidationErrors: false // Reduce log noise
});

// ===== HELPER FUNCTIONS =====

/**
 * Creates a custom validator function
 */
export function createCustomValidator<T>(
  name: string,
  validator: (data: T) => boolean | Promise<boolean>,
  errorMessage: string
) {
  return async (request: NextRequest): Promise<ValidationResult<any>> => {
    try {
      const body = await request.json();
      const isValid = await validator(body);
      
      if (!isValid) {
        return {
          success: false,
          errors: [{
            field: name,
            message: errorMessage,
            code: 'CUSTOM_VALIDATION_FAILED'
          }]
        };
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: name,
          message: 'Custom validation error',
          code: 'CUSTOM_VALIDATION_ERROR'
        }]
      };
    }
  };
}

/**
 * Validates request origin for CORS
 */
export function validateOrigin(allowedOrigins: string[]) {
  return (request: NextRequest): ValidationResult<any> => {
    const origin = request.headers.get('origin');
    
    if (!origin) {
      // Allow requests without origin (e.g., mobile apps, Postman)
      return { success: true };
    }
    
    if (!allowedOrigins.includes(origin)) {
      return {
        success: false,
        errors: [{
          field: 'origin',
          message: 'Request from unauthorized origin',
          code: 'INVALID_ORIGIN'
        }]
      };
    }
    
    return { success: true };
  };
}