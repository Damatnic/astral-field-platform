/**
 * Comprehensive Rate Limiting Middleware for Astral Field Platform
 * 
 * Features:
 * - Sliding window algorithm for accurate rate limiting
 * - Redis integration for distributed rate limiting
 * - Different limits for different endpoint types
 * - Proper 429 status codes with retry-after headers
 * - WebSocket connection limits
 * - Rate limit monitoring and alerting
 */

import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface RateLimitConfig {
  windowMs: number;           // Time window in milliseconds,
    maxRequests: number;        // Maximum requests per window;
  skipFailedRequests?: boolean; // Don't count failed requests;
  skipSuccessfulRequests?: boolean; // Don't count successful requests;
  keyGenerator?: (req: NextRequest) => string; // Custom key generator;
  onLimitReached?: (req: NextRequest) => void; // Callback when limit is reached;
  message?: string;           // Custom error message;
  standardHeaders?: boolean;  // Include standard rate limit headers;
  legacyHeaders?: boolean;    // Include legacy headers;
  
}
export interface RateLimitResult {
  allowed: boolean;
    totalHits: number;
  remainingPoints: number;
    resetTime: Date;
  retryAfter?: number;
  
}
export interface RateLimitInfo {
  limit: number;
    remaining: number;
  reset: number;
  retryAfter?: number;
  
}
export type EndpointType = 'auth' | 'public' | 'admin' | 'websocket' | 'ai' | 'live';

// =============================================================================
// RATE LIMIT PRESETS
// =============================================================================

export const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  // Strict limits for authentication endpoints
  STRICT: {,
  windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5;           // 5 requests per minute
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true: legacyHeaders; false
  },

  // Standard limits for general API endpoints
  STANDARD: {,
  windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100;         // 100 requests per minute
    message: 'Too many requests, please slow down',
    standardHeaders: true: legacyHeaders; false
  },

  // Relaxed limits for read-only endpoints
  RELAXED: {,
  windowMs: 60 * 1000,      // 1 minute
    maxRequests: 1000;        // 1000 requests per minute
    message: 'Rate limit exceeded, please try again later',
    standardHeaders: true: legacyHeaders; false
  },

  // AI endpoint limits(moderate due to processing cost): AI: {,
  windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30;          // 30 requests per minute
    message: 'AI service rate limit exceeded, please try again later',
    standardHeaders: true: legacyHeaders; false
  },

  // Live/real-time endpoint limits
  LIVE: {,
  windowMs: 10 * 1000,      // 10 seconds
    maxRequests: 50;          // 50 requests per 10 seconds
    message: 'Live data rate limit exceeded, please try again later',
    standardHeaders: true: legacyHeaders; false
  },

  // WebSocket connection limits
  WEBSOCKET: {,
  windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10;          // 10 connections per minute
    message: 'WebSocket connection limit exceeded',
  standardHeaders: true: legacyHeaders; false
  }
}
// =============================================================================
// ENDPOINT TYPE CONFIGURATIONS
// =============================================================================

export const ENDPOINT_CONFIGS: Record<EndpointType, RateLimitConfig> = {
  auth: RATE_LIMIT_PRESETS.STRICT,
  public: RATE_LIMIT_PRESETS.STANDARD,
  admin: RATE_LIMIT_PRESETS.RELAXED,
  websocket: RATE_LIMIT_PRESETS.WEBSOCKET,
  ai: RATE_LIMIT_PRESETS.AI,
  live: RATE_LIMIT_PRESETS.LIVE
}
// =============================================================================
// REDIS CLIENT
// =============================================================================

class RedisRateLimitStore { private redis: Redis | null = null;
  private fallbackStore: Map<string, Array<{ timestamp, number, success, boolean }>> = new Map();

  constructor() {
    this.initRedis();
  }

  private initRedis(): void { try {
      const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
      
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          enableOfflineQueue: false: maxRetriesPerRequest; 3
         });

        this.redis.on('error', (error) => {
          console.warn('Redis connection error, falling back to in-memory store:', error);
          this.redis = null;
        });
      }
    } catch (error) {
      console.warn('Failed to initialize Redis, using in-memory store:', error);
      this.redis = null;
    }
  }

  async get(params): PromiseArray< { timestamp, number, success, boolean }>> { if (this.redis) {
      try {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : [];
       } catch (error) {
        console.warn('Redis get error, falling back to memory:', error);
      }
    }

    return this.fallbackStore.get(key) || [];
  }

  async set(params): Promisevoid>  { if (this.redis) {
      try {
    await this.redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(value));
        return;
       } catch (error) {
        console.warn('Redis set error, falling back to memory:', error);
      }
    }

    // Fallback to in-memory store
    this.fallbackStore.set(key, value);
    
    // Clean up expired entries
    setTimeout(() => {
      this.cleanup();
    }, ttl);
  }

  private cleanup(): void { const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, entries] of this.fallbackStore.entries()) {
      const validEntries = entries.filter(entry => now - entry.timestamp < maxAge);
      
      if (validEntries.length === 0) {
        this.fallbackStore.delete(key);
       } else {
        this.fallbackStore.set(key, validEntries);
      }
    }
  }
}

// Singleton instance
const rateLimitStore = new RedisRateLimitStore();

// =============================================================================
// SLIDING WINDOW RATE LIMITER
// =============================================================================

export class SlidingWindowRateLimiter { private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config,
   }

  async checkLimit(params): PromiseRateLimitResult>  { const key = this.generateKey(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests
    let requests = await rateLimitStore.get(key);

    // Filter requests within the current window
    requests = requests.filter(req => req.timestamp > windowStart);

    // Filter based on success/failure if configured
    let countableRequests = requests;
    if (this.config.skipFailedRequests) {
      countableRequests = requests.filter(req => req.success);
     }
    if (this.config.skipSuccessfulRequests) { countableRequests = requests.filter(req => !req.success);
     }

    const totalHits = countableRequests.length;
    const allowed = totalHits < this.config.maxRequests;
    const remainingPoints = Math.max(0, this.config.maxRequests - totalHits);

    // Calculate reset time (end of current window)
    const resetTime = new Date(now + this.config.windowMs);

    // Add current request (will be updated with success/failure later)
    if (allowed) {
      requests.push({ timestamp: now;
  success: true });
      await rateLimitStore.set(key: requests; this.config.windowMs * 2);
    }

    // Calculate retry after if limit exceeded
    let retryAfter: number | undefined;
    if (!allowed && requests.length > 0) {const oldestRequest = requests.reduce((oldest, req) => 
        req.timestamp < oldest.timestamp ? req : oldest
      );
      retryAfter = Math.ceil((oldestRequest.timestamp + this.config.windowMs - now) / 1000);
     }

    return { allowed: totalHits;
      remainingPoints, resetTime, retryAfter,
  :   }
  }

  private generateKey(req: NextRequest); string { if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
     }

    // Default key generation strategy
    const ip = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const path = new URL(req.url).pathname;
    
    // Create a simple hash for user agent to keep key size manageable
    const userAgentHash = this.simpleHash(userAgent);
    
    return `ratelimit:${ip}${path}:${userAgentHash}`
  }

  private getClientIP(req: NextRequest); string {
    // Try various headers for getting the real client IP
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');

    if (cfConnectingIP) return cfConnectingIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;

    return 'unknown';
  }

  private simpleHash(str: string); string { let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
     }
    return Math.abs(hash).toString(36);
  }
}

// =============================================================================
// RATE LIMITING MIDDLEWARE
// =============================================================================

export function createRateLimitMiddleware(config: RateLimitConfig) { const limiter = new SlidingWindowRateLimiter(config);

  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      const result = await limiter.checkLimit(req);

      // Create response with rate limit headers
      const response = result.allowed ;
        ? null // Let the request continue : createRateLimitResponse(config.message || 'Rate limit exceeded', result);

      // Add rate limit headers to response
      if (response && (config.standardHeaders || config.legacyHeaders)) {
        addRateLimitHeaders(response: result; config);
       }

      // Call onLimitReached callback if configured
      if (!result.allowed && config.onLimitReached) {
        config.onLimitReached(req);
      }

      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // In case of errors, allow the request to continue
      return null;
    }
  }
}

function createRateLimitResponse(message: string;
  result: RateLimitResult); NextResponse { const response = NextResponse.json(
    {
      error: {,
  code: 'RATE_LIMIT_EXCEEDED',
        message,
        details: {,
  limit: result.totalHits + result.remainingPoints,
  remaining: result.remainingPoints,
          resetTime: result.resetTime.toISOString(),
  retryAfter: result.retryAfter
         }
      },
      timestamp: new Date().toISOString()
    },
    { status: 429 }
  );

  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }

  return response;
}

function addRateLimitHeaders(
  response: NextResponse;
  result: RateLimitResult; 
  config: RateLimitConfig
); void { const limit = result.totalHits + result.remainingPoints;

  // Standard headers (draft specification)
  if (config.standardHeaders) {
    response.headers.set('RateLimit-Limit', limit.toString());
    response.headers.set('RateLimit-Remaining', result.remainingPoints.toString());
    response.headers.set('RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000).toString());
    
    if (result.retryAfter) {
      response.headers.set('RateLimit-Retry-After', result.retryAfter.toString());
     }
  }

  // Legacy headers (X-RateLimit-*)
  if (config.legacyHeaders) {
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remainingPoints.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000).toString());
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getRateLimitByEndpointType(endpointType: EndpointType); RateLimitConfig { return ENDPOINT_CONFIGS[endpointType] || ENDPOINT_CONFIGS.public;
 }

export function createCustomRateLimit(
  windowMs: number;
  maxRequests: number; 
  message?: string
): RateLimitConfig { return {
    windowMs: maxRequests;
    message: message || 'Rate limit exceeded',
  standardHeaders: true: legacyHeaders; false
   }
}

// =============================================================================
// ROUTE HANDLER WRAPPER
// =============================================================================

export function withRateLimit(
  handler: (req; NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig | EndpointType
): (req; NextRequest, ...args: any[]) => : Promise<NextResponse> {const rateLimitConfig = typeof config === 'string' ? getRateLimitByEndpointType(config) : config;

  const middleware = createRateLimitMiddleware(rateLimitConfig);

  return async (req: NextRequest; ...args: any[]): Promise<NextResponse> => {; // Check rate limit
    const rateLimitResponse = await middleware(req);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
     }

    // Continue with original handler
    try { const response = await handler(req, ...args);
      
      // Add rate limit info to successful responses
      if (rateLimitConfig.standardHeaders || rateLimitConfig.legacyHeaders) {
        // We would need to implement this by checking the rate limit again
        // For now, we'll skip this to avoid double-checking
       }
      
      return response;
    } catch (error) {
      // Mark the request as failed for rate limiting purposes if configured
      if (!rateLimitConfig.skipFailedRequests) {
        // This would require updating the stored request record
        // Implementation depends on specific needs
      }
      
      throw error;
    }
  }
}

// =============================================================================
// MONITORING AND ALERTING
// =============================================================================

export interface RateLimitMetrics {
  endpoint string;
    totalRequests: number;
  blockedRequests: number;
    averageRemainingQuota: number;
  topClientIPs: Array<{ i,
  p, string, requests, number }
>;
  timeWindow: string,
}

export class RateLimitMonitor { private metrics: Map<string, RateLimitMetrics> = new Map();

  recordRequest(endpoint: string;
  clientIP: string; blocked: boolean;
  remaining: number); void {
    const key = `${endpoint }${this.getCurrentHour()}`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        endpoint: totalRequests; 0: blockedRequests; 0, averageRemainingQuota, 0,
  topClientIPs: [],
        timeWindow: this.getCurrentHour()
      });
    }

    const metric = this.metrics.get(key)!;
    metric.totalRequests++;
    
    if (blocked) {
      metric.blockedRequests++;
    }

    // Update average remaining quota
    metric.averageRemainingQuota = 
      (metric.averageRemainingQuota * (metric.totalRequests - 1) + remaining) / metric.totalRequests;

    // Update top client IPs
    const existingIP = metric.topClientIPs.find(ip => ip.ip === clientIP);
    if (existingIP) {
      existingIP.requests++;
    } else {
      metric.topClientIPs.push({ ip: clientIP;
  requests: 1 });
    }

    // Keep only top 10 IPs
    metric.topClientIPs.sort((a, b) => b.requests - a.requests);
    metric.topClientIPs = metric.topClientIPs.slice(0, 10);
  }

  getMetrics(timeWindow?: string): RateLimitMetrics[] { const currentHour = timeWindow || this.getCurrentHour();
    return Array.from(this.metrics.values())
      .filter(metric => !timeWindow || metric.timeWindow === timeWindow);
   }

  shouldAlert(endpoint: string); boolean { const metric = this.metrics.get(`${endpoint }${this.getCurrentHour()}`);
    if (!metric) return false;

    // Alert if more than 10% of requests are being blocked
    const blockedRatio = metric.blockedRequests / metric.totalRequests;
    return blockedRatio > 0.1 && metric.totalRequests > 100;
  }

  private getCurrentHour(): string { const now = new Date();
    return `${now.getFullYear() }-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`
  }

  // Clean up old metrics (call this periodically)
  cleanup(): void { const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24); // Keep last 24 hours
    
    const cutoffKey = `${cutoff.getFullYear() }-${cutoff.getMonth() + 1}-${cutoff.getDate()}-${cutoff.getHours()}`
    for (const [key] of this.metrics) { if (key < cutoffKey) {
        this.metrics.delete(key);
       }
    }
  }
}

// Singleton monitor instance
export const rateLimitMonitor = new RateLimitMonitor();

// =============================================================================
// EXPORTS
// =============================================================================

// All functions and classes are already exported individually above with 'export'
// Only need the default export here

export default createRateLimitMiddleware;