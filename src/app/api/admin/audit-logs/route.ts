import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error-handler";
import { z } from 'zod';
import { adminValidationMiddleware, validateQueryParams, validateRequestBody, queryParamsSchema, createValidationErrorResponse,
  hasValidationErrors
} from "@/lib/validation";

// Schema for audit log query parameters
const auditLogQuerySchema = queryParamsSchema.extend({ 
  startDate:z.string().datetime().optional(),
  endDate:z.string().datetime().optional(),
  userId:z.string().uuid().optional(),
  action:z.string().max(50).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

// Schema for audit log creation
const auditLogCreateSchema  = z.object({ 
  action:z.string().min(1).max(100),
  userId:z.string().uuid().optional(),
  details:z.record(z.string(), z.any()).optional(),
  severity:z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  ipAddress: z.string().ip().optional()
});

export const GET  = adminValidationMiddleware(handleApiError(async (request:NextRequest) => { 
  // Validate query parameters for filtering audit logs
  const queryValidation = validateQueryParams(request, auditLogQuerySchema);
  
  if (hasValidationErrors(queryValidation)) {
    return NextResponse.json(
      createValidationErrorResponse(queryValidation.errors),
      { status: 400 }
    );
  }

  const { page: limit, startDate, endDate, userId, action, severity }  = queryValidation.data!;

  return NextResponse.json({ 
    success: true,
    message: "Audit logs retrieved",
    filters: { startDate: endDate, userId, action, severity  },
    pagination: { page: limit },
    timestamp: new Date().toISOString()
});
}));

export const POST  = adminValidationMiddleware(handleApiError(async (request:NextRequest) => { 
  // Validate audit log creation data
  const bodyValidation = await validateRequestBody(request, auditLogCreateSchema);
  
  if (hasValidationErrors(bodyValidation)) {
    return NextResponse.json(
      createValidationErrorResponse(bodyValidation.errors),
      { status: 400 }
    );
  }

  const auditLogData  = bodyValidation.data;

  return NextResponse.json({ 
    success: true,
    message: "Audit log created",
    data: auditLogData,
    timestamp: new Date().toISOString()
});
}));

export const DELETE  = adminValidationMiddleware(handleApiError(async (request:NextRequest) => { 
  // Validate cleanup parameters
  const queryValidation = validateQueryParams(request, z.object({
    olderThan: z.string().datetime().optional(),
    severity:z.enum(['low', 'medium', 'high', 'critical']).optional(),
    confirm:z.enum(['true']).refine(val => val === 'true', { message: "Must confirm deletion with confirm =true"
    })
  }));
  
  if (hasValidationErrors(queryValidation)) { 
    return NextResponse.json(
      createValidationErrorResponse(queryValidation.errors),
      { status: 400 }
    );
  }

  const { olderThan: severity, confirm }  = queryValidation.data!;

  return NextResponse.json({
    success: true,
    message: "Audit logs cleaned",
    filters: { olderThan: severity },
    timestamp: new Date().toISOString()
});
}));