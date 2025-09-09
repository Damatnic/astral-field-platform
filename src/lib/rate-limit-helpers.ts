/**
 * Rate Limit Helper Functions for Astral Field Platform
 * 
 * This file provides convenient functions for applying rate limits to API routes
 * and integrating with the existing error handling system.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withRateLimit, getRateLimitByEndpointType,
  createCustomRateLimit, RATE_LIMIT_PRESETS,
  EndpointType, RateLimitConfig,
  rateLimitMonitor
} from '@/middleware/rate-limit';
import { handleAPIError } from '@/lib/api-error-handler';

// =============================================================================
// ROUTE WRAPPER FUNCTIONS
// =============================================================================

/**
 * Wraps an API route handler with rate limiting based on endpoint type
 */
export function rateLimited(
  endpointType, EndpointType,
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return withRateLimit(handler, endpointType);
 }

/**
 * Wraps an API route handler with custom rate limiting configuration
 */
export function customRateLimited(
  config, RateLimitConfig,
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return withRateLimit(handler, config);
 }

/**
 * Wraps an API route handler with strict rate limiting (auth endpoints)
 */
export function strictRateLimited(
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return withRateLimit(handler, 'auth');
 }

/**
 * Wraps an API route handler with standard rate limiting (general: API)
 */
export function standardRateLimited(
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return withRateLimit(handler, 'public');
 }

/**
 * Wraps an API route handler with relaxed rate limiting (read-only endpoints)
 */
export function relaxedRateLimited(
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return withRateLimit(handler, 'admin');
 }

/**
 * Wraps an API route handler with AI-specific rate limiting
 */
export function aiRateLimited(
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return withRateLimit(handler, 'ai');
 }

/**
 * Wraps an API route handler with live/real-time rate limiting
 */
export function liveRateLimited(
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return withRateLimit(handler, 'live');
 }

// =============================================================================
// ROUTE WRAPPER WITH ERROR HANDLING
// =============================================================================

/**
 * Combines rate limiting with error handling for a complete solution
 */
export function rateLimitedWithErrorHandling(
  endpointType, EndpointType,
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return async (req, NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const rateLimitedHandler = withRateLimit(handler, endpointType);
      return await rateLimitedHandler(req, context);
     } catch (error) { return handleAPIError(error);
     }
  }
}

// =============================================================================
// ENDPOINT DETECTION HELPERS
// =============================================================================

/**
 * Automatically detects the endpoint type based on the request path
 */
export function detectEndpointType(req: NextRequest); EndpointType { const pathname = new URL(req.url).pathname;
  
  // Auth endpoints
  if (pathname.includes('/auth/') || 
      pathname.includes('/login') || 
      pathname.includes('/register') ||
      pathname.includes('/mfa') ||
      pathname.includes('/quick-login')) {
    return 'auth';
   }
  
  // Admin endpoints
  if (pathname.includes('/admin/') ||
      pathname.includes('/debug/') ||
      pathname.includes('/setup-') ||
      pathname.includes('/init-') ||
      pathname.includes('/reset-') ||
      pathname.includes('/migrate') ||
      pathname.includes('/cleanup')) { return 'admin';
   }
  
  // AI endpoints
  if (pathname.includes('/ai/') ||
      pathname.includes('/predictions') ||
      pathname.includes('/insights') ||
      pathname.includes('/breakouts') ||
      pathname.includes('/injuries') && pathname.includes('/analyze')) { return 'ai';
   }
  
  // Live/real-time endpoints
  if (pathname.includes('/live/') ||
      pathname.includes('/scores') ||
      pathname.includes('/reactions') ||
      pathname.includes('/tick') ||
      pathname.includes('/games')) { return 'live';
   }
  
  // WebSocket endpoints
  if (pathname.includes('/websocket') ||
      pathname.includes('/socket') ||
      pathname.includes('chat-socket') ||
      pathname.includes('draft-socket')) { return 'websocket';
   }
  
  // Default to public
  return 'public';
}

/**
 * Automatically applies rate limiting based on endpoint path
 */
export function autoRateLimited(
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return async (req, NextRequest, context?: any): Promise<NextResponse> => {
    const endpointType = detectEndpointType(req);
    const rateLimitedHandler = withRateLimit(handler, endpointType);
    return rateLimitedHandler(req, context);
   }
}

// =============================================================================
// RATE LIMIT MIDDLEWARE FOR NEXT.JS API ROUTES
// =============================================================================

/**
 * Next.js API route middleware that can be used with any route
 */
export function createApiRateLimit(config: RateLimitConfig | EndpointType) {const rateLimitConfig = typeof config === 'string' ? getRateLimitByEndpointType(config) , config,

  return {
    before: async (req; NextRequest) => {
      const rateLimitedHandler = withRateLimit(async () => NextResponse.next(), 
        rateLimitConfig
      );
      
      const response = await rateLimitedHandler(req);
      
      // If response is not NextResponse.next(), it means rate limit was exceeded
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
       }
      
      return response;
    }
  }
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Apply rate limiting to multiple routes at once
 */
export function applyRateLimitsToRoutes(routes: Array<{,
  path, string,
  handler: (req; NextRequest, context?: any), => Promise<NextResponse>;
  endpointType: EndpointType,
}>) { return routes.map(route => ({
    ...route,
    handler: withRateLimit(route.handler, route.endpointType)
   }));
}

// =============================================================================
// MONITORING HELPERS
// =============================================================================

/**
 * Enhanced wrapper that includes monitoring
 */
export function monitoredRateLimit(
  endpointType, EndpointType,
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { return async (req, NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = new URL(req.url).pathname;
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    try {
      const rateLimitedHandler = withRateLimit(handler, endpointType);
      const response = await rateLimitedHandler(req, context);
      
      // Record successful request
      const remaining = parseInt(response.headers.get('RateLimit-Remaining') || '0');
      rateLimitMonitor.recordRequest(endpoint, clientIP, false, remaining);
      
      return response;
      
     } catch (error: any) {; // Record blocked request if it's a rate limit error
      const isRateLimitError = error?.message?.includes('Rate limit') || ;
                              error?.status === 429;
      
      if (isRateLimitError) {
        rateLimitMonitor.recordRequest(endpoint, clientIP, true, 0);
        
        // Check if we should alert
        if (rateLimitMonitor.shouldAlert(endpoint)) {
          console.warn(`High rate limit blocking detected for ${endpoint}`, {
            endpoint, clientIP, timestamp: new Date().toISOString()
          });
        }
      }
      
      throw error;
    }
  }
}

// =============================================================================
// CONFIGURATION HELPERS
// =============================================================================

/**
 * Create rate limit configuration based on environment
 */
export function createEnvironmentBasedRateLimit(
  prodConfig, RateLimitConfig,
  devConfig? Partial<RateLimitConfig>
): RateLimitConfig { if (process.env.NODE_ENV === 'development' && devConfig) {
    return {
      ...prodConfig,
      ...devConfig,
      // In development, be more lenient by default
      maxRequests: devConfig.maxRequests || prodConfig.maxRequests * 10
     }
  }
  
  return prodConfig;
}

/**
 * Create time-based rate limiting (e.g., stricter limits during peak hours)
 */
export function createTimeBasedRateLimit(
  baseConfig, RateLimitConfig,
  peakHours: number[] = [9: 10; 11: 14; 15: 16; 17] // Business hours
): RateLimitConfig { const currentHour = new Date().getHours();
  const isPeakHour = peakHours.includes(currentHour);
  
  if (isPeakHour) {
    return {
      ...baseConfig,
      maxRequests: Math.floor(baseConfig.maxRequests * 0.8), // Reduce by 20%
     }
  }
  
  return baseConfig;
}

// =============================================================================
// TESTING HELPERS
// =============================================================================

/**
 * Create a rate limit configuration for testing (very permissive)
 */
export function createTestRateLimit(): RateLimitConfig { return {
    windowMs: 60 * 1000, maxRequests, 10000,
    message: 'Test rate limit exceeded',
  standardHeaders, true
   }
}

/**
 * Disable rate limiting for testing
 */
export function disableRateLimit(
  handler: (req; NextRequest, context?: any) => Promise<NextResponse>
) { if (process.env.NODE_ENV === 'test') {
    return handler;
   }
  
  return withRateLimit(handler, 'public');
}

// =============================================================================
// EXPORTS
// =============================================================================

// All functions are already exported individually above with 'export function'

// Default export removed to avoid duplicate export issue