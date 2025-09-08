/**
 * Advanced Rate Limiting and DDoS Protection System
 * Multi-layered rate limiting with Redis backend, adaptive thresholds, and intelligent blocking
 */

import Redis from 'ioredis';
import { metrics, logger } from './monitoring';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export enum RateLimitType {
  PER_IP = 'per_ip',
  PER_USER = 'per_user',
  PER_ENDPOINT = 'per_endpoint',
  PER_API_KEY = 'per_api_key',
  GLOBAL = 'global'
}

export enum RateLimitStrategy {
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window',
  TOKEN_BUCKET = 'token_bucket',
  LEAKY_BUCKET = 'leaky_bucket'
}

export interface RateLimitRule {
  id: string;
  type: RateLimitType;
  strategy: RateLimitStrategy;
  limit: number;
  window: number; // in seconds
  burst?: number; // for token bucket
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  handler?: (req: any, res: any, next: any) => void;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  rule: RateLimitRule;
}

export interface DDoSProtectionConfig {
  enabled: boolean;
  suspiciousThreshold: number; // requests per second to trigger monitoring
  blockThreshold: number; // requests per second to trigger block
  blockDuration: number; // in seconds
  whitelistedIPs: string[];
  whitelistedUserAgents: string[];
}

export interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  activeRules: number;
  blockedIPs: number;
  blockRate: number;
}

export interface SuspiciousActivity {
  ip: string;
  requestCount: number;
  timeWindow: number;
  userAgent?: string;
  endpoints: string[];
  suspicious: boolean;
  blocked: boolean;
}

// =============================================================================
// RATE LIMITER STRATEGIES
// =============================================================================

abstract class RateLimitStrategy {
  abstract check(key: string, rule: RateLimitRule, redis: Redis): Promise<RateLimitResult>;
  abstract reset(key: string, redis: Redis): Promise<void>;
}

class FixedWindowStrategy extends RateLimitStrategy {
  async check(key: string, rule: RateLimitRule, redis: Redis): Promise<RateLimitResult> {
    const window = Math.floor(Date.now() / 1000 / rule.window) * rule.window;
    const windowKey = `${key}:${window}`;
    
    const pipeline = redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, rule.window);
    
    const results = await pipeline.exec();
    const count = results?.[0]?.[1] as number || 0;
    
    const remaining = Math.max(0, rule.limit - count);
    const resetTime = (window + rule.window) * 1000;
    
    return {
      allowed: count <= rule.limit,
      remaining,
      resetTime,
      retryAfter: count > rule.limit ? resetTime - Date.now() : undefined,
      rule
    };
  }

  async reset(key: string, redis: Redis): Promise<void> {
    const pattern = `${key}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

class SlidingWindowStrategy extends RateLimitStrategy {
  async check(key: string, rule: RateLimitRule, redis: Redis): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - (rule.window * 1000);
    
    const pipeline = redis.pipeline();
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Count requests in window
    pipeline.zcard(key);
    
    // Set expiration
    pipeline.expire(key, rule.window);
    
    const results = await pipeline.exec();
    const count = results?.[2]?.[1] as number || 0;
    
    const remaining = Math.max(0, rule.limit - count);
    const resetTime = now + (rule.window * 1000);
    
    return {
      allowed: count <= rule.limit,
      remaining,
      resetTime,
      retryAfter: count > rule.limit ? rule.window * 1000 : undefined,
      rule
    };
  }

  async reset(key: string, redis: Redis): Promise<void> {
    await redis.del(key);
  }
}

class TokenBucketStrategy extends RateLimitStrategy {
  async check(key: string, rule: RateLimitRule, redis: Redis): Promise<RateLimitResult> {
    const now = Date.now();
    const bucketKey = `bucket:${key}`;
    
    // Get current bucket state
    const bucketData = await redis.hmget(bucketKey, 'tokens', 'lastRefill');
    let tokens = parseInt(bucketData[0] || rule.limit.toString());
    let lastRefill = parseInt(bucketData[1] || now.toString());
    
    // Calculate tokens to add based on time passed
    const timePassed = (now - lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * (rule.limit / rule.window));
    tokens = Math.min(rule.burst || rule.limit, tokens + tokensToAdd);
    
    const allowed = tokens > 0;
    
    if (allowed) {
      tokens -= 1;
    }
    
    // Update bucket state
    const pipeline = redis.pipeline();
    pipeline.hmset(bucketKey, 'tokens', tokens, 'lastRefill', now);
    pipeline.expire(bucketKey, rule.window * 2);
    await pipeline.exec();
    
    const resetTime = now + ((rule.limit - tokens) * rule.window * 1000 / rule.limit);
    
    return {
      allowed,
      remaining: tokens,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((1 / (rule.limit / rule.window)) * 1000),
      rule
    };
  }

  async reset(key: string, redis: Redis): Promise<void> {
    await redis.del(`bucket:${key}`);
  }
}

// =============================================================================
// ADVANCED RATE LIMITER
// =============================================================================

export class AdvancedRateLimiter {
  private static instance: AdvancedRateLimiter;
  private redis: Redis | null = null;
  private rules: Map<string, RateLimitRule> = new Map();
  private strategies: Map<RateLimitStrategy, RateLimitStrategy> = new Map();
  private stats: RateLimitStats = {
    totalRequests: 0,
    blockedRequests: 0,
    allowedRequests: 0,
    activeRules: 0,
    blockedIPs: 0,
    blockRate: 0
  };
  
  private ddosConfig: DDoSProtectionConfig = {
    enabled: true,
    suspiciousThreshold: 100, // 100 req/sec
    blockThreshold: 1000,     // 1000 req/sec
    blockDuration: 300,       // 5 minutes
    whitelistedIPs: ['127.0.0.1', '::1'],
    whitelistedUserAgents: []
  };

  private constructor() {
    this.initializeRedis();
    this.initializeStrategies();
    this.loadDefaultRules();
    this.startBackgroundTasks();
  }

  public static getInstance(): AdvancedRateLimiter {
    if (!AdvancedRateLimiter.instance) {
      AdvancedRateLimiter.instance = new AdvancedRateLimiter();
    }
    return AdvancedRateLimiter.instance;
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_RATE_LIMIT_DB || '1'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      this.redis.on('error', (error) => {
        logger.error('Rate limiter Redis connection error:', error);
        metrics.incrementCounter('rate_limit_redis_errors');
      });

      this.redis.on('ready', () => {
        logger.info('Rate limiter Redis connection ready');
      });
    } catch (error) {
      logger.error('Failed to initialize Redis for rate limiting:', error as Error);
      this.redis = null;
    }
  }

  private initializeStrategies(): void {
    this.strategies.set(RateLimitStrategy.FIXED_WINDOW, new FixedWindowStrategy());
    this.strategies.set(RateLimitStrategy.SLIDING_WINDOW, new SlidingWindowStrategy());
    this.strategies.set(RateLimitStrategy.TOKEN_BUCKET, new TokenBucketStrategy());
  }

  private loadDefaultRules(): void {
    const defaultRules: RateLimitRule[] = [
      {
        id: 'global_rate_limit',
        type: RateLimitType.GLOBAL,
        strategy: RateLimitStrategy.SLIDING_WINDOW,
        limit: 10000,
        window: 60, // 1 minute
      },
      {
        id: 'per_ip_strict',
        type: RateLimitType.PER_IP,
        strategy: RateLimitStrategy.SLIDING_WINDOW,
        limit: 1000,
        window: 60, // 1 minute
      },
      {
        id: 'per_ip_burst',
        type: RateLimitType.PER_IP,
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        limit: 100,
        window: 60,
        burst: 200,
      },
      {
        id: 'api_endpoints',
        type: RateLimitType.PER_ENDPOINT,
        strategy: RateLimitStrategy.FIXED_WINDOW,
        limit: 5000,
        window: 60,
      },
      {
        id: 'authenticated_users',
        type: RateLimitType.PER_USER,
        strategy: RateLimitStrategy.TOKEN_BUCKET,
        limit: 2000,
        window: 60,
        burst: 5000,
        skipSuccessfulRequests: false,
      },
    ];

    for (const rule of defaultRules) {
      this.addRule(rule);
    }
  }

  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
    this.stats.activeRules = this.rules.size;
    
    logger.info(`Rate limit rule added: ${rule.id}`, {
      type: rule.type,
      strategy: rule.strategy,
      limit: rule.limit,
      window: rule.window
    });
  }

  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.stats.activeRules = this.rules.size;
      logger.info(`Rate limit rule removed: ${ruleId}`);
    }
    return removed;
  }

  async check(
    identifier: string, 
    ruleIds: string[] = [], 
    context: {
      ip?: string;
      userId?: string;
      endpoint?: string;
      userAgent?: string;
      apiKey?: string;
    } = {}
  ): Promise<RateLimitResult[]> {
    if (!this.redis) {
      logger.warn('Rate limiter Redis not available, allowing request');
      return [];
    }

    this.stats.totalRequests++;

    // Check DDoS protection first
    if (this.ddosConfig.enabled && context.ip) {
      const blocked = await this.checkDDoSProtection(context.ip, context.userAgent);
      if (blocked) {
        this.stats.blockedRequests++;
        await metrics.incrementCounter('rate_limit_blocked', { 
          reason: 'ddos_protection',
          ip: context.ip 
        });
        
        return [{
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + (this.ddosConfig.blockDuration * 1000),
          retryAfter: this.ddosConfig.blockDuration * 1000,
          rule: {
            id: 'ddos_protection',
            type: RateLimitType.PER_IP,
            strategy: RateLimitStrategy.FIXED_WINDOW,
            limit: 0,
            window: this.ddosConfig.blockDuration
          }
        }];
      }
    }

    // Check specified rules or all applicable rules
    const rulesToCheck = ruleIds.length > 0 
      ? ruleIds.map(id => this.rules.get(id)).filter(Boolean) as RateLimitRule[]
      : this.getApplicableRules(context);

    const results: RateLimitResult[] = [];

    for (const rule of rulesToCheck) {
      try {
        const key = this.generateKey(identifier, rule, context);
        const strategy = this.strategies.get(rule.strategy);
        
        if (!strategy) {
          logger.error(`Unknown rate limit strategy: ${rule.strategy}`);
          continue;
        }

        const result = await strategy.check(key, rule, this.redis);
        results.push(result);

        // Track metrics
        await metrics.incrementCounter('rate_limit_checks', {
          rule_id: rule.id,
          allowed: result.allowed.toString()
        });

        if (!result.allowed) {
          logger.warn('Rate limit exceeded', {
            rule: rule.id,
            identifier,
            key,
            remaining: result.remaining,
            resetTime: new Date(result.resetTime).toISOString()
          });
        }

      } catch (error) {
        logger.error(`Rate limit check failed for rule ${rule.id}:`, error as Error);
        await metrics.incrementCounter('rate_limit_errors', { rule_id: rule.id });
      }
    }

    // Update stats
    const blocked = results.some(r => !r.allowed);
    if (blocked) {
      this.stats.blockedRequests++;
    } else {
      this.stats.allowedRequests++;
    }

    this.updateBlockRate();

    return results;
  }

  async reset(identifier: string, ruleId?: string, context: any = {}): Promise<void> {
    if (!this.redis) return;

    const rulesToReset = ruleId 
      ? [this.rules.get(ruleId)].filter(Boolean) as RateLimitRule[]
      : Array.from(this.rules.values());

    for (const rule of rulesToReset) {
      try {
        const key = this.generateKey(identifier, rule, context);
        const strategy = this.strategies.get(rule.strategy);
        
        if (strategy) {
          await strategy.reset(key, this.redis);
          logger.info(`Rate limit reset for rule ${rule.id}`, { identifier, key });
        }
      } catch (error) {
        logger.error(`Rate limit reset failed for rule ${rule.id}:`, error as Error);
      }
    }
  }

  private async checkDDoSProtection(ip: string, userAgent?: string): Promise<boolean> {
    // Check if IP is whitelisted
    if (this.ddosConfig.whitelistedIPs.includes(ip)) {
      return false;
    }

    // Check if user agent is whitelisted
    if (userAgent && this.ddosConfig.whitelistedUserAgents.some(ua => userAgent.includes(ua))) {
      return false;
    }

    // Check if IP is already blocked
    const blockKey = `ddos:block:${ip}`;
    const isBlocked = await this.redis!.exists(blockKey);
    
    if (isBlocked) {
      await metrics.incrementCounter('ddos_blocked_requests', { ip });
      return true;
    }

    // Track request rate
    const rateKey = `ddos:rate:${ip}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    const pipeline = this.redis!.pipeline();
    pipeline.zremrangebyscore(rateKey, 0, windowStart);
    pipeline.zadd(rateKey, now, `${now}-${Math.random()}`);
    pipeline.zcard(rateKey);
    pipeline.expire(rateKey, 60);

    const results = await pipeline.exec();
    const requestCount = results?.[2]?.[1] as number || 0;

    // Check if threshold exceeded
    if (requestCount > this.ddosConfig.blockThreshold) {
      // Block the IP
      await this.redis!.setex(blockKey, this.ddosConfig.blockDuration, '1');
      
      logger.warn('DDoS protection triggered - IP blocked', {
        ip,
        requestCount,
        threshold: this.ddosConfig.blockThreshold,
        blockDuration: this.ddosConfig.blockDuration
      });

      await metrics.incrementCounter('ddos_blocks_created', { ip });
      this.stats.blockedIPs++;
      
      return true;
    }

    // Check for suspicious activity
    if (requestCount > this.ddosConfig.suspiciousThreshold) {
      logger.info('Suspicious activity detected', {
        ip,
        requestCount,
        threshold: this.ddosConfig.suspiciousThreshold
      });

      await metrics.incrementCounter('ddos_suspicious_activity', { ip });
    }

    return false;
  }

  private getApplicableRules(context: any): RateLimitRule[] {
    const applicable: RateLimitRule[] = [];

    for (const rule of this.rules.values()) {
      switch (rule.type) {
        case RateLimitType.GLOBAL:
          applicable.push(rule);
          break;
        case RateLimitType.PER_IP:
          if (context.ip) applicable.push(rule);
          break;
        case RateLimitType.PER_USER:
          if (context.userId) applicable.push(rule);
          break;
        case RateLimitType.PER_ENDPOINT:
          if (context.endpoint) applicable.push(rule);
          break;
        case RateLimitType.PER_API_KEY:
          if (context.apiKey) applicable.push(rule);
          break;
      }
    }

    return applicable;
  }

  private generateKey(identifier: string, rule: RateLimitRule, context: any): string {
    if (rule.keyGenerator) {
      return rule.keyGenerator({ identifier, ...context });
    }

    const baseKey = `rl:${rule.id}`;

    switch (rule.type) {
      case RateLimitType.GLOBAL:
        return `${baseKey}:global`;
      case RateLimitType.PER_IP:
        return `${baseKey}:ip:${context.ip || identifier}`;
      case RateLimitType.PER_USER:
        return `${baseKey}:user:${context.userId || identifier}`;
      case RateLimitType.PER_ENDPOINT:
        return `${baseKey}:endpoint:${context.endpoint || identifier}`;
      case RateLimitType.PER_API_KEY:
        return `${baseKey}:apikey:${context.apiKey || identifier}`;
      default:
        return `${baseKey}:${identifier}`;
    }
  }

  async getSuspiciousActivity(): Promise<SuspiciousActivity[]> {
    if (!this.redis) return [];

    try {
      const keys = await this.redis.keys('ddos:rate:*');
      const activities: SuspiciousActivity[] = [];

      for (const key of keys) {
        const ip = key.split(':').pop() || '';
        const count = await this.redis.zcard(key);
        
        if (count > this.ddosConfig.suspiciousThreshold) {
          const blocked = await this.redis.exists(`ddos:block:${ip}`);
          
          activities.push({
            ip,
            requestCount: count,
            timeWindow: 60,
            endpoints: [], // Would need additional tracking
            suspicious: count > this.ddosConfig.suspiciousThreshold,
            blocked: blocked === 1
          });
        }
      }

      return activities.sort((a, b) => b.requestCount - a.requestCount);
    } catch (error) {
      logger.error('Failed to get suspicious activity:', error as Error);
      return [];
    }
  }

  getStats(): RateLimitStats {
    return { ...this.stats };
  }

  private updateBlockRate(): void {
    const total = this.stats.totalRequests;
    this.stats.blockRate = total > 0 ? this.stats.blockedRequests / total : 0;
  }

  private startBackgroundTasks(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(async () => {
      await this.cleanup();
    }, 300000);

    // Update metrics every 30 seconds
    setInterval(async () => {
      await this.updateMetrics();
    }, 30000);

    // Adaptive threshold adjustment every 10 minutes
    setInterval(async () => {
      await this.adaptiveThresholdAdjustment();
    }, 600000);
  }

  private async cleanup(): Promise<void> {
    if (!this.redis) return;

    try {
      // Clean up expired DDoS tracking keys
      const ddosKeys = await this.redis.keys('ddos:rate:*');
      let cleaned = 0;

      for (const key of ddosKeys) {
        const size = await this.redis.zcard(key);
        if (size === 0) {
          await this.redis.del(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.info(`Rate limiter cleanup: ${cleaned} expired keys removed`);
      }
    } catch (error) {
      logger.error('Rate limiter cleanup failed:', error as Error);
    }
  }

  private async updateMetrics(): Promise<void> {
    try {
      const stats = this.getStats();
      
      await metrics.setGauge('rate_limit_total_requests', stats.totalRequests);
      await metrics.setGauge('rate_limit_blocked_requests', stats.blockedRequests);
      await metrics.setGauge('rate_limit_allowed_requests', stats.allowedRequests);
      await metrics.setGauge('rate_limit_active_rules', stats.activeRules);
      await metrics.setGauge('rate_limit_blocked_ips', stats.blockedIPs);
      await metrics.setGauge('rate_limit_block_rate', stats.blockRate);

      // Get suspicious activity count
      const suspiciousActivities = await this.getSuspiciousActivity();
      await metrics.setGauge('rate_limit_suspicious_ips', suspiciousActivities.length);

    } catch (error) {
      logger.error('Failed to update rate limiter metrics:', error as Error);
    }
  }

  private async adaptiveThresholdAdjustment(): Promise<void> {
    // Implement adaptive threshold logic based on historical data
    try {
      const suspiciousActivities = await this.getSuspiciousActivity();
      const avgActivity = suspiciousActivities.reduce((sum, activity) => 
        sum + activity.requestCount, 0) / Math.max(suspiciousActivities.length, 1);

      // Adjust thresholds based on activity patterns
      if (avgActivity > this.ddosConfig.suspiciousThreshold * 2) {
        // High activity detected, increase sensitivity
        this.ddosConfig.suspiciousThreshold = Math.floor(this.ddosConfig.suspiciousThreshold * 0.9);
        this.ddosConfig.blockThreshold = Math.floor(this.ddosConfig.blockThreshold * 0.9);
        
        logger.info('DDoS thresholds adjusted (more sensitive)', {
          suspicious: this.ddosConfig.suspiciousThreshold,
          block: this.ddosConfig.blockThreshold
        });
      } else if (avgActivity < this.ddosConfig.suspiciousThreshold * 0.5) {
        // Low activity, relax thresholds slightly
        this.ddosConfig.suspiciousThreshold = Math.floor(this.ddosConfig.suspiciousThreshold * 1.1);
        this.ddosConfig.blockThreshold = Math.floor(this.ddosConfig.blockThreshold * 1.1);
        
        logger.info('DDoS thresholds adjusted (less sensitive)', {
          suspicious: this.ddosConfig.suspiciousThreshold,
          block: this.ddosConfig.blockThreshold
        });
      }
    } catch (error) {
      logger.error('Adaptive threshold adjustment failed:', error as Error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

// =============================================================================
// MIDDLEWARE FACTORY
// =============================================================================

export function createRateLimitMiddleware(
  ruleIds: string[],
  options: {
    keyGenerator?: (req: any) => string;
    onLimitReached?: (req: any, res: any, result: RateLimitResult) => void;
    skipIf?: (req: any) => boolean;
  } = {}
) {
  const rateLimiter = AdvancedRateLimiter.getInstance();

  return async (req: any, res: any, next: any) => {
    try {
      // Skip rate limiting if condition is met
      if (options.skipIf && options.skipIf(req)) {
        return next();
      }

      const identifier = options.keyGenerator ? options.keyGenerator(req) : req.ip || 'unknown';
      const context = {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: req.path,
        userAgent: req.get('User-Agent'),
        apiKey: req.get('X-API-Key') || req.get('Authorization')
      };

      const results = await rateLimiter.check(identifier, ruleIds, context);
      const blocked = results.find(r => !r.allowed);

      if (blocked) {
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': blocked.rule.limit.toString(),
          'X-RateLimit-Remaining': blocked.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(blocked.resetTime / 1000).toString(),
        });

        if (blocked.retryAfter) {
          res.set('Retry-After', Math.ceil(blocked.retryAfter / 1000).toString());
        }

        if (options.onLimitReached) {
          options.onLimitReached(req, res, blocked);
        } else {
          res.status(429).json({
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${Math.ceil((blocked.retryAfter || 0) / 1000)} seconds.`,
            retryAfter: blocked.retryAfter
          });
        }
        return;
      }

      // Set success headers for the most restrictive rule
      const mostRestrictive = results.reduce((min, current) => 
        current.remaining < min.remaining ? current : min
      );

      if (mostRestrictive) {
        res.set({
          'X-RateLimit-Limit': mostRestrictive.rule.limit.toString(),
          'X-RateLimit-Remaining': mostRestrictive.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(mostRestrictive.resetTime / 1000).toString(),
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error as Error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const rateLimiter = AdvancedRateLimiter.getInstance();

export default {
  AdvancedRateLimiter,
  rateLimiter,
  createRateLimitMiddleware,
  RateLimitType,
  RateLimitStrategy
};