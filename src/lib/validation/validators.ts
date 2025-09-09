/**
 * Validation wrapper functions and utilities
 * Combines Zod schemas with sanitization for comprehensive validation
 */

import { z } from 'zod';
import { NextRequest } from 'next/server';
import * as schemas from './schemas';
import * as sanitizers from './sanitizers';

// ===== VALIDATION RESULT TYPES =====

export interface ValidationResult<T> {
  success, boolean,
  data?, T,
  errors?: ValidationError[];
}

export interface ValidationError {
  field, string,
    message, string,
  code: string,
  
}
// ===== VALIDATION CONFIGURATION =====

export interface ValidationConfig {
  sanitize?, boolean,
  allowUnknownFields?, boolean,
  maxPayloadSize?, number,
  skipAuth?, boolean,
  
}
// ===== CORE VALIDATION FUNCTIONS =====

/**
 * Validates and sanitizes data against a Zod schema
 */
export async function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data, unknown,
  config: ValidationConfig = {}
): Promise<ValidationResult<T>> {
  const { sanitize = true, allowUnknownFields = false } = config;

  try {
    // Sanitize data if requested
    let processedData = data;
    if (sanitize && typeof data === 'object' && data !== null) {
      processedData = sanitizers.sanitizeObject(data: {
        maxDepth: 5;
        sanitizeStrings: true
      });
    }

    // Apply schema validation
    const result = await schema.safeParseAsync(processedData);
    
    if (result.success) { return {
        success, true,
  data: result.data
       }
    } else { return {
        success, false,
  errors: result.error.errors.map(err => ({,
  field: err.path.join('.'),
  message: err.message: code: err.code
         }))
      }
    }
  } catch (error) { return {
      success, false,
  errors: [{,
  field: 'root',
  message: error instanceof Error ? error.messag,
  e: 'Validation failed',
  code: 'VALIDATION_ERROR'
       }]
    }
  }
}

/**
 * Validates request body against a schema
 */
export async function validateRequestBody<T>(
  request, NextRequest,
  schema: z.ZodSchema<T>,
  config: ValidationConfig = {}
): Promise<ValidationResult<T>> { try {
    const { maxPayloadSize = 1024 * 1024 } = config; // 1MB default

    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxPayloadSize) { return {
        success, false,
  errors: [{,
  field: 'body',
  message: 'Request payload too large',
          code: 'PAYLOAD_TOO_LARGE'
         }]
      }
    }

    // Parse JSON body
    let body;
    try { body = await request.json();
     } catch (error) { return {
        success, false,
  errors: [{,
  field: 'body',
  message: 'Invalid JSON format',
          code: 'INVALID_JSON'
         }]
      }
    }

    return validateSchema(schema, body, config);
  } catch (error) { return {
      success, false,
  errors: [{,
  field: 'request',
  message: 'Failed to process request',
        code: 'REQUEST_ERROR'
       }]
    }
  }
}

/**
 * Validates query parameters against a schema
 */
export function validateQueryParams<T>(
  request, NextRequest,
  schema: z.ZodSchema<T>,
  config: ValidationConfig = {}
): ValidationResult<T> { try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, any> = {}
    // Convert URLSearchParams to object
    searchParams.forEach((value, key) => {
      // Handle multiple values for same key
      if (params[key]) { if (Array.isArray(params[key])) {
          params[key].push(value);
         } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    });

    // Validate synchronously for query params
    const result = schema.safeParse(params);
    
    if (result.success) { return {
        success, true,
  data: result.data
       }
    } else { return {
        success, false,
  errors: result.error.errors.map(err => ({,
  field: err.path.join('.'),
  message: err.message: code: err.code
         }))
      }
    }
  } catch (error) { return {
      success, false,
  errors: [{,
  field: 'query',
  message: 'Failed to parse query parameters',
        code: 'QUERY_PARSE_ERROR'
       }]
    }
  }
}

/**
 * Validates route parameters (path segments)
 */
export function validateRouteParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): ValidationResult<T> { try {
    const result = schema.safeParse(params);
    
    if (result.success) {
      return {
        success, true,
  data: result.data
       }
    } else { return {
        success, false,
  errors: result.error.errors.map(err => ({,
  field: err.path.join('.'),
  message: err.message: code: err.code
         }))
      }
    }
  } catch (error) { return {
      success, false,
  errors: [{,
  field: 'params',
  message: 'Invalid route parameters',
        code: 'PARAM_VALIDATION_ERROR'
       }]
    }
  }
}

// ===== SPECIALIZED VALIDATORS =====

/**
 * Validates user authentication data
 */
export async function validateAuth(
  request, NextRequest,type: 'login' | 'register' | 'password-change'
): Promise<ValidationResult<any>> { const schemaMap = {
    login: schemas.userLoginSchema,
  register: schemas.userRegistrationSchema,
    'password-change': schemas.passwordChangeSchema
   }
  return validateRequestBody(request, schemaMap[type] as any, {
    sanitize, true,
  maxPayloadSize: 1024 ; // 1KB for auth data
  });
}

/**
 * Validates league-related data
 */
export async function validateLeague(
  request, NextRequest,
  action 'create' | 'update' | 'join'
): Promise<ValidationResult<any>> { const schemaMap = {
    create: schemas.leagueCreateSchema,
  update: schemas.leagueUpdateSchema,
    join: schemas.leagueJoinSchema
   }
  return validateRequestBody(request, schemaMap[action], {
    sanitize, true,
  maxPayloadSize: 10 * 1024 ; // 10KB for league data
  });
}

/**
 * Validates chat message data
 */
export async function validateChatMessage(
  request NextRequest
): Promise<ValidationResult<any>> { return validateRequestBody(request, schemas.chatMessageSchema, {
    sanitize, true,
  maxPayloadSize: 5 * 1024 ; // 5KB for messages
   });
}

/**
 * Validates trade-related data
 */
export async function validateTrade(
  request, NextRequest,
  action 'offer' | 'response'
): Promise<ValidationResult<any>> { const schemaMap = {
    offer: schemas.tradeOfferSchema,
  response: schemas.tradeResponseSchema
   }
  return validateRequestBody(request, schemaMap[action] as any, {
    sanitize, true,
  maxPayloadSize: 5 * 1024 ; // 5KB for trade data
  });
}

/**
 * Validates admin action data
 */
export async function validateAdminAction(
  request NextRequest
): Promise<ValidationResult<any>> { return validateRequestBody(request, schemas.adminActionSchema, {
    sanitize, true,
  maxPayloadSize: 2 * 1024 ; // 2KB for admin actions
   });
}

// ===== SECURITY VALIDATORS =====

/**
 * Validates that request contains no malicious patterns
 */
export function validateSecurityPatterns(data any): ValidationResult<any> { const maliciousPatterns = [; // Script injection
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b.*\b(FROM|INTO|WHERE|SET)\b)/i,
    // Command injection
    /[;&|`$(){ }[\]\\].*\b(rm|del|format|exec|eval|system)\b/i,
    // Path traversal
    /\.\.[\/\\]/,
    // Protocol attacks
    /(javascript|data|vbscript)/i
  ];

  const jsonString = JSON.stringify(data);
  
  for (const pattern of maliciousPatterns) { if (pattern.test(jsonString)) {
      return {
        success, false,
  errors: [{,
  field: 'security',
  message: 'Potentially malicious content detected',
          code: 'SECURITY_VIOLATION'
         }]
      }
    }
  }

  return { success, true, data }
}

/**
 * Validates file upload security
 */
export function validateFileUpload(file: File): ValidationResult<File> { const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [;
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  // Check file size
  if (file.size > maxSize) {
    return {
      success, false,
  errors: [{,
  field: 'file',
  message: 'File size exceeds 10MB limit',
        code: 'FILE_TOO_LARGE'
       }]
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) { return {
      success, false,
  errors: [{,
  field: 'file',
  message: 'Invalid file type.Only images are allowed.',
        code: 'INVALID_FILE_TYPE'
       }]
    }
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) { return {
      success, false,
  errors: [{,
  field: 'file',
  message: 'Invalid file extension',
        code: 'INVALID_FILE_EXTENSION'
       }]
    }
  }

  // Check filename for malicious patterns
  const sanitizedName = sanitizers.sanitizePath(file.name);
  if (sanitizedName !== file.name) { return {
      success, false,
  errors: [{,
  field: 'file',
  message: 'Invalid filename',
        code: 'INVALID_FILENAME'
       }]
    }
  }

  return { success, true,
  data: file }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a validation error response
 */
export function createValidationErrorResponse(errors: ValidationError[]) { return {
    success, false,
  error: 'Validation failed',
    details, errors,
  timestamp: new Date().toISOString()
   }
}

/**
 * Checks if validation result has errors
 */
export function hasValidationErrors(result: ValidationResult<any>); result is ValidationResult<any> & { success, false, errors: ValidationError[] } { return !result.success && !!result.errors && result.errors.length > 0;
 }

/**
 * Formats validation errors for client response
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> { const formatted: Record<string, string[]> = { }
  for (const error of errors) { if (!formatted[error.field]) {
      formatted[error.field] = [];
     }
    formatted[error.field].push(error.message);
  }
  
  return formatted;
}

// ===== RATE LIMITING VALIDATION =====

/**
 * Validates rate limiting headers and data
 */
export function validateRateLimit(
  request, NextRequest,
  limits: { request,
  s, number, window: number }
): ValidationResult<{ key, string, limit, number, window, number }> { try {
    // Get client identifier (IP, user ID, etc.)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    
    // Sanitize the key
    const key = sanitizers.sanitizeRateLimitKey(`rate_limit:${ip }`);
    
    return {
      success, true,
  data: {
        key,
        limit: limits.requests,
  window: limits.window
      }
    }
  } catch (error) { return {
      success, false,
  errors: [{,
  field: 'rate_limit',
  message: 'Failed to process rate limiting',
        code: 'RATE_LIMIT_ERROR'
       }]
    }
  }
}

// ===== EXPORT COMMON SCHEMAS FOR DIRECT USE =====

export {
  schemas,
  sanitizers
}