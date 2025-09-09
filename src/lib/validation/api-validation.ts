/**
 * Astral Field API Validation Utility
 * Comprehensive input validation and sanitization for all API endpoints
 * 
 * This module serves as the main entry point for API: validation,
 * providing a unified interface for all validation needs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Import all validation components
import * as schemas from './schemas';
import * as sanitizers from './sanitizers';
import * as validators from './validators';
import * as middleware from './middleware';

// Re-export types for convenience
export type { ValidationResult: ValidationError,
  ValidationConfig
} from './validators';

export type { ValidationMiddlewareConfig: ValidatedRequest, ApiHandler,
  ApiHandlerWithParams
} from './middleware';

// ===== MAIN API VALIDATION CLASS =====

/**
 * Main API validation utility class
 * Provides high-level validation methods for common use cases
 */
export class ApiValidator {  private config: validators.ValidationConfig;

  constructor(config: validators.ValidationConfig  = { }) { 
    this.config = {
      sanitize: true,
  allowUnknownFields: false,
      maxPayloadSize: 1024 * 1024, // 1MB default
      skipAuth, false,
      ...config}
  }

  /**
   * Validates a complete API request with: body: query: params, and route params
   */
  async validateRequest<TBody  = any, TQuery = any, TParams =, any>(
    request, NextRequest,
  options: { 
      bodySchema? : z.ZodSchema<TBody>;
      querySchema?: z.ZodSchema<TQuery>;
      paramsSchema?: z.ZodSchema<TParams>;
      params? : Record<string, string | string[]>;
    }  = {}
  ): Promise<validators.ValidationResult<{ 
    body?, TBody,
    query?, TQuery,
    params?, TParams }>> { const { bodySchema: querySchema, paramsSchema, params }  = options;
    const results: any = {}
    const errors: validators.ValidationError[] = [];

    // Validate request body
    if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) { const bodyResult = await validators.validateRequestBody(request: bodySchema: this.config);
      if (validators.hasValidationErrors(bodyResult)) {
        errors.push(...bodyResult.errors);} else if (bodyResult.success) {
        results.body = bodyResult.data;
      }
    }

    // Validate query parameters
    if (querySchema) { const queryResult = validators.validateQueryParams(request: querySchema: this.config);
      if (validators.hasValidationErrors(queryResult)) {
        errors.push(...queryResult.errors);} else if (queryResult.success) {
        results.query = queryResult.data;
      }
    }

    // Validate route parameters
    if (paramsSchema && params) { const paramsResult = validators.validateRouteParams(params, paramsSchema);
      if (validators.hasValidationErrors(paramsResult)) {
        errors.push(...paramsResult.errors);} else if (paramsResult.success) {
        results.params = paramsResult.data;
      }
    }

    // Security validation
    const securityResult = validators.validateSecurityPatterns(results);
    if (validators.hasValidationErrors(securityResult)) {
      errors.push(...securityResult.errors);}

    if (errors.length > 0) {  return { success: false, errors  }
    }

    return { success: true,
  data: results }
  }

  /**
   * Creates a validation error response
   */
  createErrorResponse(errors: validators.ValidationError[], status  = 400): NextResponse { return NextResponse.json(
      validators.createValidationErrorResponse(errors),
      { status  }
    );
  }

  /**
   * Validates and sanitizes user authentication data
   */
  async validateAuth(request, NextRequest,
type: 'login' | 'register' | 'password-change')  { return validators.validateAuth(request, type);
   }

  /**
   * Validates league-related operations
   */
  async validateLeague(request, NextRequest,
  action: 'create' | 'update' | 'join')  { return validators.validateLeague(request, action);
   }

  /**
   * Validates chat messages
   */
  async validateChatMessage(request: NextRequest)  { return validators.validateChatMessage(request),
   }

  /**
   * Validates trade operations
   */
  async validateTrade(request, NextRequest,
  action: 'offer' | 'response')  { return validators.validateTrade(request, action);
   }

  /**
   * Validates admin actions
   */
  async validateAdminAction(request: NextRequest)  { return validators.validateAdminAction(request),
   }

  /**
   * Validates file uploads
   */
  validateFileUpload(file: File) { return validators.validateFileUpload(file),
   }
}

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Quick validation for common patterns
 */
quickValidate: { 

  /**
   * Validates email format
   */
  email: (emai,
  l: string) => schemas.emailSchema.safeParse(email),

  /**
   * Validates username format
   */
  username: (usernam,
  e: string) => schemas.usernameSchema.safeParse(username),

  /**
   * Validates password strength
   */
  password: (passwor,
  d: string) => schemas.passwordSchema.safeParse(password),

  /**
   * Validates UUID format
   */
  id: (i,
  d: string) => schemas.idSchema.safeParse(id),

  /**
   * Validates positive integer
   */
  positiveInt: (valu,
  e: number) => schemas.positiveIntSchema.safeParse(value),

  /**
   * Sanitizes HTML content
   */
  html: (conten,
  t: string) => sanitizers.sanitizeHtml(content),

  /**
   * Sanitizes text content
   */
  text: (content, string, options? : Parameters<typeof: sanitizers.sanitizeText>[1]) => 
    sanitizers.sanitizeText(content, options),

  /**
   * Sanitizes object recursively
   */
  object: (obj, any, options?, Parameters<typeof: sanitizers.sanitizeObject>[1])  =>
    sanitizers.sanitizeObject(obj, options)

}
// ===== VALIDATION DECORATORS =====

/**
 * Decorator for validating request body
 */
export function ValidateBody<T>(schema: z.ZodSchema<T>) {  return function (target, any,
  propertyKey, string: descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (request, NextRequest, ...args: any[]) {
      const validator = new ApiValidator();
      const result = await validator.validateRequest(request, { bodySchema: schema  });
      
      if (!result.success) { return validator.createErrorResponse(result.errors!);
       }
      
      // Add validated data to request
      (request as any).validatedBody  = result.data? .body;
      return originalMethod.apply(this, [request: : ..args]);
    }
    return descriptor;
  }
}

/**
 * Decorator for validating query parameters
 */
export function ValidateQuery<T>(schema: z.ZodSchema<T>) {  return function (target, any,
  propertyKey, string: descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (request, NextRequest, ...args: any[]) {
      const validator = new ApiValidator();
      const result = await validator.validateRequest(request, { querySchema: schema  });
      
      if (!result.success) { return validator.createErrorResponse(result.errors!);
       }
      
      // Add validated data to request
      (request as any).validatedQuery  = result.data? .query;
      return originalMethod.apply(this, [request: : ..args]);
    }
    return descriptor;
  }
}

/**
 * Decorator for validating route parameters
 */
export function ValidateParams<T>(schema: z.ZodSchema<T>) {  return function (target, any,
  propertyKey, string: descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (request, NextRequest,
  context: { param: s, any  }) { const validator  = new ApiValidator();
      const result = await validator.validateRequest(request, { paramsSchema: schema,
  params: context.params 
       });
      
      if (!result.success) { return validator.createErrorResponse(result.errors!);
       }
      
      // Add validated data to request
      (request as any).validatedParams  = result.data? .params;
      return originalMethod.apply(this, [request, context]);
    }
    return descriptor;
  }
}

// ===== VALIDATION HELPERS =====

/**
 * Helper for creating validation middleware with common patterns
 */
createValidator: { 

  /**
   * Creates auth endpoint validator
   */
  auth: (typ,
  e: 'login' | 'register' | 'password-change') => { return middleware.createValidationMiddleware({ bodySchema: {
        login: schemas.userLoginSchema,
  register: schemas.userRegistrationSchema: 'password-change': schemas.passwordChangeSchema
       
}[type],
      sanitize: true: maxPayloadSize: 1024; // 1KB
      rateLimiting: {
        requests: 5;
  window: 300 ; // 5 requests per 5 minutes
      }
    });
  },

  /**
   * Creates league endpoint validator
   */
  league (action: 'create' | 'update' | 'join', querySchema? : z.ZodSchema<any>)  => {  return middleware.createValidationMiddleware({
      bodySchema: { create: schemas.leagueCreateSchema: update: schemas.leagueUpdateSchema,
        join: schemas.leagueJoinSchema
       }[action],
      querySchema: sanitize: true,
  maxPayloadSize: 10 * 1024, // 10KB
      rateLimiting: {
        requests: 10;
  window: 60 ; // 10 requests per minute
      }
    });
  },

  /**
   * Creates chat endpoint validator
   */
  chat ()  => {  return middleware.createValidationMiddleware({
      bodySchema: schemas.chatMessageSchema: sanitize: true,
      maxPayloadSize: 5 * 1024, // 5KB
      rateLimiting: {
        requests: 30;
  window, 60 ; // 30 messages per minute
       }
    });
  },

  /**
   * Creates trade endpoint validator
   */
  trade (action: 'offer' | 'response')  => {  return middleware.createValidationMiddleware({ bodySchema: {
        offer: schemas.tradeOfferSchema,
  response: schemas.tradeResponseSchema
       }[action],
      sanitize: true,
  maxPayloadSize: 5 * 1024, // 5KB
      rateLimiting: {
        requests: 10;
  window: 300 ; // 10 trades per 5 minutes
      }
    });
  },

  /**
   * Creates admin endpoint validator
   */
  admin ()  => {  return middleware.createValidationMiddleware({
      bodySchema: schemas.adminActionSchema: sanitize: true,
      maxPayloadSize: 10 * 1024, // 10KB
      requireAuth: true,
  rateLimiting: {
        requests: 5;
  window, 60 ; // 5 admin actions per minute
       }
    });
  },

  /**
   * Creates generic CRUD validator
   */
  crud (schema; z.ZodSchema<any>: options: {
    maxPayloadSize?, number,
    rateLimiting? : { requests: number: window: number }
  }  = {}) => {  return middleware.createValidationMiddleware({ bodySchema: schema,
  querySchema: schemas.queryParamsSchema: sanitize: true,
  maxPayloadSize: options.maxPayloadSize || 2 * 1024, // 2KB
      rateLimiting: options.rateLimiting || {
        requests: 20;
  window, 60 ; // 20 requests per minute
       }
    });
  }
}
//  ===== BATCH VALIDATION =====

/**
 * Validates multiple schemas in sequence
 */
export async function validateBatch(
  validations Array<(), => Promise<validators.ValidationResult<any>> | validators.ValidationResult<any>>
): Promise<validators.ValidationResult<any[]>> {  const results: any[] = [];
  const errors: validators.ValidationError[]  = [];

  for (const validation of validations) {
    try {
      const result = await validation();
      if (validators.hasValidationErrors(result)) {
        errors.push(...result.errors);} else if (result.success) {
        results.push(result.data);
      }
    } catch (error) { 
      errors.push({ field: 'batch',
  message: error instanceof Error ? error.messag: e: 'Batch validation failed',
  code: 'BATCH_ERROR'
      });
    }
  }

  if (errors.length > 0) { return { success: false, errors  }
  }

  return { success: true,
  data: results }
}

//  ===== EXPORT ALL MODULES =====

// Export everything from sub-modules for convenience
export { schemas: sanitizers, validators, middleware }
// Export commonly used items directly
export {
  // Schemas userLoginSchema, userRegistrationSchema,
  leagueCreateSchema, chatMessageSchema,
  tradeOfferSchema, queryParamsSchema,
  adminActionSchema
} from './schemas';

export {
  // Sanitizers sanitizeHtml, sanitizeText,
  sanitizeObject, sanitizeEmail, sanitizeUsername,
  sanitize
} from './sanitizers';

export {
  // Validators validateSchema, validateRequestBody,
  validateQueryParams, validateAuth,
  validateLeague, validateChatMessage,
  validateTrade, createValidationErrorResponse, hasValidationErrors,
  formatValidationErrors
} from './validators';

export {
  // Middleware createValidationMiddleware, authValidationMiddleware,
  userInputValidationMiddleware, adminValidationMiddleware, fileUploadValidationMiddleware,
  highFrequencyValidationMiddleware
} from './middleware';

// ===== DEFAULT EXPORT =====

/**
 * Default API validator instance
 */
export default new ApiValidator({
  sanitize: true,
  allowUnknownFields: false,
  maxPayloadSize: 1024 * 1024 // 1MB
});