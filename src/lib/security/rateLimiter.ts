import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter - in production, use Redis or similar
interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  checkLimit(
    identifier: string, 
    maxRequests: number, 
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.store[identifier] || this.store[identifier].resetTime < now) {
      // Initialize or reset window
      this.store[identifier] = {
        requests: 1,
        resetTime: now + windowMs
      };
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: this.store[identifier].resetTime
      };
    }
    
    const current = this.store[identifier];
    
    if (current.requests >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }
    
    current.requests++;
    
    return {
      allowed: true,
      remaining: maxRequests - current.requests,
      resetTime: current.resetTime
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// Rate limiting configurations
export const RATE_LIMITS = {
  // API endpoints
  api: {
    requests: 100,
    window: 15 * 60 * 1000, // 15 minutes
  },
  // Authentication endpoints
  auth: {
    requests: 10,
    window: 15 * 60 * 1000, // 15 minutes
  },
  // Search endpoints
  search: {
    requests: 30,
    window: 60 * 1000, // 1 minute
  },
  // AI/Oracle endpoints
  ai: {
    requests: 20,
    window: 60 * 1000, // 1 minute
  },
  // Draft actions
  draft: {
    requests: 50,
    window: 60 * 1000, // 1 minute
  },
  // Trade actions
  trade: {
    requests: 25,
    window: 60 * 1000, // 1 minute
  }
};

/**
 * Rate limiting middleware for API routes
 */
export function createRateLimit(
  maxRequests: number = RATE_LIMITS.api.requests,
  windowMs: number = RATE_LIMITS.api.window
) {
  return function rateLimit(request: NextRequest): NextResponse | null {
    try {
      // Get identifier (IP address or user ID from auth)
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      // Check for user ID in authorization header
      const auth = request.headers.get('authorization');
      const userId = auth ? extractUserIdFromAuth(auth) : null;
      
      // Use user ID if available, otherwise fall back to IP
      const identifier = userId || ip;
      
      const result = rateLimiter.checkLimit(identifier, maxRequests, windowMs);
      
      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }
      
      return null; // Allow request to proceed
    } catch (error) {
      console.error('Rate limiter error:', error);
      return null; // Allow request on error (fail open)
    }
  };
}

/**
 * Rate limiting helper for specific endpoint types
 */
export const rateLimiters = {
  api: createRateLimit(RATE_LIMITS.api.requests, RATE_LIMITS.api.window),
  auth: createRateLimit(RATE_LIMITS.auth.requests, RATE_LIMITS.auth.window),
  search: createRateLimit(RATE_LIMITS.search.requests, RATE_LIMITS.search.window),
  ai: createRateLimit(RATE_LIMITS.ai.requests, RATE_LIMITS.ai.window),
  draft: createRateLimit(RATE_LIMITS.draft.requests, RATE_LIMITS.draft.window),
  trade: createRateLimit(RATE_LIMITS.trade.requests, RATE_LIMITS.trade.window)
};

/**
 * Extract user ID from authorization header
 */
function extractUserIdFromAuth(auth: string): string | null {
  try {
    // Handle different auth schemes
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      // In a real app, you'd decode/verify the JWT
      // For now, return a simple hash of the token
      return btoa(token).slice(0, 10);
    }
    
    if (auth.startsWith('Basic ')) {
      const credentials = atob(auth.slice(6));
      const [username] = credentials.split(':');
      return username;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

export { rateLimiter };