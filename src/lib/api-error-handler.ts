import { NextResponse } from 'next/server'

export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: unknown;
}

export class ApiErrorResponse extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, status: number = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createErrorResponse(error: ApiError | Error | unknown, fallbackMessage?: string): NextResponse {
  console.error('API Error', error);

  // If it's our custom ApiErrorResponse
  if (error instanceof ApiErrorResponse) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      timestamp: new Date().toISOString()
    }, { status: error.status });
  }

  // If it's a standard Error
  if (error instanceof Error) {
    return NextResponse.json({
      error: fallbackMessage || error.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }

  // For unknown error types
  return NextResponse.json({
    error: fallbackMessage || 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  }, { status: 500 });
}

export function handleApiError<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}

// Common error types
export const CommonErrors = {
  ValidationError: (message: string) => new ApiErrorResponse(message, 400, 'VALIDATION_ERROR'),
  Unauthorized: (message: string = 'Unauthorized') => new ApiErrorResponse(message, 401, 'UNAUTHORIZED'),
  Forbidden: (message: string = 'Forbidden') => new ApiErrorResponse(message, 403, 'FORBIDDEN'),
  NotFound: (message: string = 'Resource not found') => new ApiErrorResponse(message, 404, 'NOT_FOUND'),
  Conflict: (message: string) => new ApiErrorResponse(message, 409, 'CONFLICT'),
  RateLimitExceeded: (message: string = 'Too many requests') => new ApiErrorResponse(message, 429, 'RATE_LIMIT_EXCEEDED'),
  InternalError: (message: string = 'Internal server error') => new ApiErrorResponse(message, 500, 'INTERNAL_ERROR')
};
