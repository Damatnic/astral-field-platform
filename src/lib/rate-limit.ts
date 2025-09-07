// Rate limiting utility for API endpoints
// Simple in-memory rate limiting implementation

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: any) => string;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig>) {
    this.config = {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      keyGenerator: (req: any) => req.ip || 'anonymous',
      message: 'Too many requests, please try again later.',
      ...config
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  async checkLimit(req: any): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.config.keyGenerator!(req);
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.storage.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime) {
        this.storage.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters
export const defaultRateLimit = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000 // 1 minute
});

export const aiRateLimit = new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000 // 1 minute
});

export const authRateLimit = new RateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
});

export const strictRateLimit = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000 // 1 minute
});

// Utility function for API routes
export async function applyRateLimit(req: any, rateLimiter: RateLimiter = defaultRateLimit) {
  const result = await rateLimiter.checkLimit(req);
  
  if (!result.allowed) {
    const error = new Error('Rate limit exceeded') as any;
    error.status = 429;
    error.remaining = result.remaining;
    error.resetTime = result.resetTime;
    throw error;
  }

  return result;
}

// Middleware function for Next.js API routes
export async function rateLimitMiddleware(req: any, res: any, config?: RateLimitConfig) {
  const rateLimiter = config ? new RateLimiter(config) : defaultRateLimit;
  
  try {
    const result = await rateLimiter.checkLimit(req);
    
    if (!result.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        remaining: result.remaining,
        resetTime: result.resetTime
      });
      return false;
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetTime);
    
    return true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true; // Allow request if rate limiting fails
  }
}

export default RateLimiter;
