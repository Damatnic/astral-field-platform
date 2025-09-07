import { getCacheManager } from './cache-manager'

export interface RateLimitRule {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Max requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: any) => string
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  current: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

class RateLimiter {
  private cache = getCacheManager()
  private defaultRules: Record<string, RateLimitRule> = {
    // Default rules for different endpoint types
    default: {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 100      // 100 requests per minute
    },
    analytics: {
      windowMs: 60 * 1000,  // 1 minute  
      maxRequests: 60       // 60 requests per minute
    },
    ai: {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 30       // 30 requests per minute
    },
    admin: {
      windowMs: 60 * 1000,  // 1 minute
      maxRequests: 300      // 300 requests per minute for admin
    },
    health: {
      windowMs: 10 * 1000,  // 10 seconds
      maxRequests: 10       // 10 requests per 10 seconds
    }
  }

  async checkRateLimit(
    identifier: string,
    rule: RateLimitRule | string = 'default'
  ): Promise<RateLimitResult> {
    // Get rule configuration
    const ruleConfig = typeof rule === 'string' 
      ? this.defaultRules[rule] || this.defaultRules.default
      : rule

    const now = Date.now()
    const windowStart = now - ruleConfig.windowMs
    const key = `ratelimit:${identifier}`

    try {
      // Get existing request data
      const existing = await this.cache.get<{
        requests: { timestamp: number; success?: boolean }[]
        windowStart: number
      }>(key) || { requests: [], windowStart: now }

      // Filter out requests outside current window
      const validRequests = existing.requests.filter(
        req => req.timestamp > windowStart
      )

      // Count current requests based on rule settings
      let currentCount = validRequests.length
      if (ruleConfig.skipSuccessfulRequests) {
        currentCount = validRequests.filter(req => !req.success).length
      }
      if (ruleConfig.skipFailedRequests) {
        currentCount = validRequests.filter(req => req.success !== false).length
      }

      const allowed = currentCount < ruleConfig.maxRequests
      const resetTime = windowStart + ruleConfig.windowMs

      // Update request history if allowed
      if (allowed) {
        validRequests.push({ timestamp: now })
        await this.cache.set(key, {
          requests: validRequests,
          windowStart: existing.windowStart
        }, Math.ceil(ruleConfig.windowMs / 1000))
      }

      return {
        allowed,
        limit: ruleConfig.maxRequests,
        current: currentCount + (allowed ? 1 : 0),
        remaining: Math.max(0, ruleConfig.maxRequests - currentCount - (allowed ? 1 : 0)),
        resetTime,
        retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000)
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // Default to allowing request on cache errors
      return {
        allowed: true,
        limit: ruleConfig.maxRequests,
        current: 1,
        remaining: ruleConfig.maxRequests - 1,
        resetTime: now + ruleConfig.windowMs
      }
    }
  }

  async recordResult(identifier: string, success: boolean, rule: RateLimitRule | string = 'default'): Promise<void> {
    const ruleConfig = typeof rule === 'string' 
      ? this.defaultRules[rule] || this.defaultRules.default
      : rule

    // Skip recording if rule doesn't care about success/failure
    if (ruleConfig.skipSuccessfulRequests && success) return
    if (ruleConfig.skipFailedRequests && !success) return

    try {
      const key = `ratelimit:${identifier}`
      const now = Date.now()
      const windowStart = now - ruleConfig.windowMs

      const existing = await this.cache.get<{
        requests: { timestamp: number; success?: boolean }[]
        windowStart: number
      }>(key) || { requests: [], windowStart: now }

      // Update the most recent request with success status
      const requests = existing.requests.filter(req => req.timestamp > windowStart)
      const lastRequest = requests[requests.length - 1]
      if (lastRequest && Math.abs(lastRequest.timestamp - now) < 1000) {
        lastRequest.success = success
      }

      await this.cache.set(key, {
        requests,
        windowStart: existing.windowStart
      }, Math.ceil(ruleConfig.windowMs / 1000))
    } catch (error) {
      console.error('Failed to record rate limit result:', error)
    }
  }

  generateKey(req: any, prefix = ''): string {
    // Try multiple identification methods
    const ip = req.ip || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress ||
               req.headers?.['x-forwarded-for']?.split(',')[0] ||
               req.headers?.['x-real-ip'] ||
               'unknown'

    const userAgent = req.headers?.['user-agent'] || 'unknown'
    const authToken = req.headers?.authorization?.replace('Bearer ', '') || ''

    // Use auth token as primary identifier if available
    if (authToken && authToken !== '') {
      return `${prefix}auth:${authToken}`
    }

    // Fallback to IP + user agent hash for anonymous requests
    const identifier = `${ip}:${userAgent.slice(0, 50)}`
    return `${prefix}ip:${identifier}`
  }

  // Get current statistics for an identifier
  async getStats(identifier: string): Promise<{
    currentRequests: number
    windowStart: number
    requests: { timestamp: number; success?: boolean }[]
  } | null> {
    try {
      const key = `ratelimit:${identifier}`
      return await this.cache.get(key)
    } catch (error) {
      console.error('Failed to get rate limit stats:', error)
      return null
    }
  }

  // Reset rate limit for an identifier (admin function)
  async reset(identifier: string): Promise<boolean> {
    try {
      const key = `ratelimit:${identifier}`
      return await this.cache.delete(key)
    } catch (error) {
      console.error('Failed to reset rate limit:', error)
      return false
    }
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter()
  }
  return rateLimiterInstance
}

// Middleware wrapper for API routes
export function withRateLimit(
  handler: (req: any, res: any) => Promise<any>,
  config: {
    rule?: RateLimitRule | string
    keyPrefix?: string
    keyGenerator?: (req: any) => string
    onLimitReached?: (req: any, res: any, result: RateLimitResult) => void | Promise<void>
  } = {}
) {
  return async function rateLimitedHandler(req: any, res: any) {
    const rateLimiter = getRateLimiter()
    
    // Generate rate limit key
    const key = config.keyGenerator 
      ? config.keyGenerator(req)
      : rateLimiter.generateKey(req, config.keyPrefix)

    // Check rate limit
    const result = await rateLimiter.checkRateLimit(key, config.rule || 'default')

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit.toString())
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString())

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter?.toString() || '60')
      
      if (config.onLimitReached) {
        await config.onLimitReached(req, res, result)
      } else {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Limit: ${result.limit} requests per window.`,
          retryAfter: result.retryAfter,
          resetTime: new Date(result.resetTime).toISOString()
        })
      }
      return
    }

    // Execute handler and record result
    try {
      const handlerResult = await handler(req, res)
      await rateLimiter.recordResult(key, true, config.rule || 'default')
      return handlerResult
    } catch (error) {
      await rateLimiter.recordResult(key, false, config.rule || 'default')
      throw error
    }
  }
}

export default getRateLimiter