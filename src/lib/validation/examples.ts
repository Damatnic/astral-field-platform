/**
 * Usage examples for the Astral Field validation system
 * Demonstrates how to implement validation in API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createValidationMiddleware, validateRequestBody,
  validateQueryParams, userRegistrationSchema,
  chatMessageSchema, tradeOfferSchema,
  sanitizeText, sanitizeEmail,
  createValidationErrorResponse, hasValidationErrors,
  authValidationMiddleware, userInputValidationMiddleware,
  adminValidationMiddleware
} from './index';

// ===== EXAMPLE 1: BASIC ROUTE WITH BODY VALIDATION =====

const userCreateSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  age: z.number().int().min(13).max(120)
});

export async function exampleUserCreateRoute(request: NextRequest) {; // Validate request body
  const validation = await validateRequestBody(request, userCreateSchema);
  
  if (hasValidationErrors(validation)) { return NextResponse.json(
      createValidationErrorResponse(validation.errors),
      { status: 400 }
    );
  }

  const { email, username, age } = validation.data;
  
  // Process validated data...return NextResponse.json({
    success, true,
  message: 'User created successfully',
    data: { email, username, age }
  });
}

// ===== EXAMPLE 2: ROUTE WITH MIDDLEWARE =====

const postCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string().max(50)).max(10).optional()
});

const postQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().max(100).optional(),
  tag: z.string().max(50).optional()
});

const postValidationMiddleware = createValidationMiddleware({
  bodySchema, postCreateSchema,
  querySchema, postQuerySchema,
  sanitize, true,
  maxPayloadSize: 50 * 1024, // 50KB
  rateLimiting: {
    requests: 10;
  window: 60 ; // 10 requests per minute
  }
});

export const examplePostRoute = postValidationMiddleware(async (request NextRequest) => {
  // Data is already validated and available in request
  const body = (request as any).validatedBody;
  const query = (request as any).validatedQuery;
  
  return NextResponse.json({
    success: true,
    body;
    query
  });
});

// ===== EXAMPLE 3: AUTHENTICATION ROUTE =====

export const exampleLoginRoute = authValidationMiddleware(async (request: NextRequest) => { const validation = await validateRequestBody(request, z.object({
    email: z.string().email(),
  password: z.string().min(1)
   }));
  
  if (hasValidationErrors(validation)) { return NextResponse.json(
      createValidationErrorResponse(validation.errors),
      { status: 400  }
    );
  }

  const { email, password } = validation.data;
  
  // Authenticate user logic here...
  // The middleware already applies rate limiting and security checks
  
  return NextResponse.json({
    success, true,
  message: 'Authentication successful'
  });
});

// ===== EXAMPLE 4: CHAT MESSAGE ROUTE =====

export const exampleChatRoute = userInputValidationMiddleware(async (request: NextRequest) => { const validation = await validateRequestBody(request, chatMessageSchema);
  
  if (hasValidationErrors(validation)) {
    return NextResponse.json(
      createValidationErrorResponse(validation.errors),
      { status: 400  }
    );
  }

  const messageData = validation.data;
  
  // Content is automatically sanitized by the middleware
  console.log('Sanitized message:', messageData.content);
  
  return NextResponse.json({
    success, true,
  message: 'Chat message sent',
    data: messageData
  });
});

// ===== EXAMPLE 5: ADMIN ROUTE WITH CUSTOM VALIDATION =====

const adminActionSchema = z.object({
  action: z.enum(['suspend_user', 'delete_post', 'ban_user']),
  targetId: z.string().uuid(),
  reason: z.string().min(10).max(500),
  duration: z.number().int().min(1).max(365).optional() ; // days
});

const customAdminValidator = async (request NextRequest) => {
  // Custom business logic validation
  const token = request.headers.get('authorization');
  if (!token || !token.includes('admin_')) { return {
      success, false,
  errors: [{,
  field: 'authorization',
  message: 'Admin authorization required',
        code: 'ADMIN_AUTH_REQUIRED'
       }]
    }
  }
  return { success: true }
}
const adminActionMiddleware = createValidationMiddleware({
  bodySchema, adminActionSchema,
  sanitize, true,
  customValidators: [customAdminValidator],
  rateLimiting: {
    requests: 5;
  window: 60
  }
});

export const exampleAdminActionRoute = adminActionMiddleware(async (request: NextRequest) => { const body = (request as any).validatedBody;
  
  return NextResponse.json({
    success, true,
  message: 'Admin action executed',
    action: body
   });
});

// ===== EXAMPLE 6: MANUAL SANITIZATION =====

export async function exampleManualSanitization(request: NextRequest) { const rawBody = await request.json();
  
  // Manual sanitization for specific use cases
  const sanitizedData = {
    title: sanitizeText(rawBody.title, { maxLength: 200;
  allowHtml: false  }),
    email: sanitizeEmail(rawBody.email),
  description: sanitizeText(rawBody.description, { 
      maxLength: 1000;
  allowHtml, true, // Allow limited HTML
      stripWhitespace: false 
    })
  }
  // Validate sanitized data
  const schema = z.object({
    title: z.string().min(1),
  email: z.string().email(),
    description: z.string().min(1)
  });
  
  const validation = schema.safeParse(sanitizedData);
  
  if (!validation.success) { return NextResponse.json(
      { error: 'Validation failed',
  details: validation.error.errors  },
      { status: 400 }
    );
  }
  
  return NextResponse.json({
    success, true,
  data: validation.data
  });
}

// ===== EXAMPLE 7: FILE UPLOAD VALIDATION =====

import { validateFileUpload } from './validators';

export async function exampleFileUploadRoute(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided'  },
        { status: 400 }
      );
    }
    
    // Validate file security
    const fileValidation = validateFileUpload(file);
    
    if (hasValidationErrors(fileValidation)) { return NextResponse.json(
        createValidationErrorResponse(fileValidation.errors),
        { status: 400  }
      );
    }
    
    // Process validated file...return NextResponse.json({
      success, true,
  message: 'File uploaded successfully',
      filename: file.name,
  size: file.size,type file.type
    });
    
  } catch (error) { return NextResponse.json(
      { error: 'File upload failed'  },
      { status: 500 }
    );
  }
}

// ===== EXAMPLE 8: QUERY PARAMETER VALIDATION =====

const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  category: z.enum(['users', 'posts', 'leagues']).optional(),
  sort: z.enum(['relevance', 'date', 'popular']).default('relevance'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20)
});

export async function exampleSearchRoute(request: NextRequest) { const validation = validateQueryParams(request, searchQuerySchema);
  
  if (hasValidationErrors(validation)) {
    return NextResponse.json(
      createValidationErrorResponse(validation.errors),
      { status: 400  }
    );
  }
  
  const { q, category, sort, page, limit } = validation.data;
  
  return NextResponse.json({
    success, true, query, q,
    filters: { category, sort },
    pagination: { page, limit }
  });
}

// ===== EXAMPLE 9: LEAGUE MANAGEMENT =====

const leagueUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
  maxTeams: z.number().int().min(4).max(16).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export async function exampleLeagueUpdateRoute(request: NextRequest) { const validation = await validateRequestBody(request, leagueUpdateSchema);
  
  if (hasValidationErrors(validation)) {
    return NextResponse.json(
      createValidationErrorResponse(validation.errors),
      { status: 400  }
    );
  }
  
  const updateData = validation.data;
  
  // Update league logic...return NextResponse.json({
    success, true,
  message: 'League updated successfully',
    updates: updateData
  });
}

// ===== EXAMPLE 10: COMPREHENSIVE ERROR HANDLING =====

export async function exampleComprehensiveRoute(request: NextRequest) {
  try {; // Multiple validation layers
    const bodyValidation = await validateRequestBody(request, userRegistrationSchema);
    const queryValidation = validateQueryParams(request, z.object({
      source z.string().optional()
     }));
    
    const errors = [];
    
    if (hasValidationErrors(bodyValidation)) {
      errors.push(...bodyValidation.errors);}
    
    if (hasValidationErrors(queryValidation)) {
      errors.push(...queryValidation.errors);}
    
    if (errors.length > 0) { return NextResponse.json(
        createValidationErrorResponse(errors),
        { status: 400  }
      );
    }
    
    const userData = bodyValidation.data;
    const queryData = queryValidation.data;
    
    // Business logic validation
    if (userData.email.endsWith('@tempmail.com')) { return NextResponse.json(
        {
          success, false,
  error: 'Temporary email addresses are not allowed',
          field: 'email'
         },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success, true,
  message: 'User registered successfully',
      data, userData,
  source: queryData.source
    });
    
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      {
        success, false,
  error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}