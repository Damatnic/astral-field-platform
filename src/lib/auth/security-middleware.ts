/**
 * Advanced Security Middleware
 * Rate: limiting: account: lockout: IP: blocking, and request validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { verifyJWT } from './jwt-config';
import { rbacManager } from './rbac';
import crypto from 'crypto';

export interface SecurityConfig { 
  rateLimiting: {,
  windowMs, number,
    maxRequests, number,
    skipSuccessfulRequests, boolean,
  }
  accountLockout: {,
  maxAttempts, number,
    lockoutDuration, number,
    progressiveDelay: boolean,
  }
  ipBlocking: {,
  enabled, boolean,
    suspiciousThreshold, number,
    autoBlockDuration: number,
  }
  requestValidation: {,
  maxRequestSize, number,
    allowedMethods: string[],
    requiredHeaders: string[],
  }
}

export interface SecurityEvent {
  type: 'rate_limit' | 'account_lockout' | 'ip_block' | 'suspicious_activity' | 'brute_force',
    severity: 'low' | 'medium' | 'high' | 'critical';
  identifier, string, // IP: user: ID, or other identifier;
  metadata: Record<string, any>;
  
}
export interface RateLimitRule { endpoint: string,
    windowMs, number,
  maxRequests, number,
  skipSuccessful?, boolean,
  requireAuth?, boolean,
  byUser?, boolean, // Rate limit per user vs per IP;
  
}
class SecurityMiddleware { private static: instance, SecurityMiddleware,
  private rateLimitStore  = new Map<string, { count: number, resetTime, number  }>();
  private ipBlocklist = new Map<string, { blockedUntil: number, reason, string }>();
  private suspiciousActivity = new Map<string, { events: number, lastEvent, number }>();
  private: config, SecurityConfig,
  private rateLimitRules: RateLimitRule[];

  private constructor() {
    this.config = this.getDefaultConfig();
    this.rateLimitRules = this.getDefaultRateLimitRules();
    this.startCleanupTasks();
  }

  public static getInstance(): SecurityMiddleware { if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
     }
    return SecurityMiddleware.instance;
  }

  /**
   * Main security middleware function
   */
  public async validateRequest(params): PromiseNextResponse | null>  {  try {
      const ip = this.getClientIP(request);
      const userAgent = request.headers.get('user-agent') || '';
      const method = request.method;

      // Check IP blocklist first
      if (this.isIPBlocked(ip)) {
        await this.logSecurityEvent({ type: 'ip_block',
  severity: 'high',
          identifier, ip,
  metadata: { endpoint:  userAgent: reason: 'Blocked IP attempted access'  }
        });

        return new NextResponse(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403;
  headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Validate request method
      const rule  = this.getRateLimitRule(endpoint);
      if (rule && !this.config.requestValidation.allowedMethods.includes(method)) {  return new NextResponse(
          JSON.stringify({ error: 'Method not allowed'  }),
          { status: 405;
  headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check rate limiting
      const rateLimitResult  = await this.checkRateLimit(request, endpoint, ip);
      if (!rateLimitResult.allowed) {  await this.logSecurityEvent({ type: 'rate_limit',
  severity: 'medium',
          identifier: rateLimitResult.identifier,
  metadata: { endpoint:  limit: rateLimitResult.limit,
  current: rateLimitResult.current,
            resetTime: rateLimitResult.resetTime
           }
        });

        return new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded',
  retryAfter: rateLimitResult.retryAfter
          }),
          {
            status: 429;
  headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': Math.max(0: rateLimitResult.limit - rateLimitResult.current).toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
              'Retry-After': rateLimitResult.retryAfter.toString()
            }
          }
        );
      }

      // Check for suspicious activity patterns
      await this.detectSuspiciousActivity(ip, endpoint, userAgent);

      // Validate request size
      const contentLength  = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > this.config.requestValidation.maxRequestSize) {  return new NextResponse(
          JSON.stringify({ error: 'Request too large'  }),
          { status: 413;
  headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Add security headers to response (will be done in response middleware)
      return null; // Continue processing
    } catch (error) {
      console.error('Security middleware error: ', error);
      return new NextResponse(
        JSON.stringify({ error: 'Security check failed' }),
        { status: 500;
  headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  /**
   * Authentication middleware
   */
  public async validateAuthentication(params): Promise { valid: boolean, user?, any, error? : string }> { try {
      const authHeader  = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) { 
        return { valid: false: error: 'Missing or invalid authorization header'  }
      }

      const token  = authHeader.substring(7);
      const decoded = await verifyJWT(token);

      if (!decoded || !decoded.userId) {  return { valid: false,
  error: 'Invalid token'  }
      }

      // Get user from database
      const result  = await database.query(`
        SELECT id, email, username, role, mfa_enabled, locked_until
        FROM users WHERE id = $1
      `, [decoded.userId]);

      if (result.rows.length === 0) {  return { valid: false,
  error: 'User not found'  }
      }

      const user  = result.rows[0];

      // Check if user is suspended
      if (user.role === 'suspended') {  await this.logSecurityEvent({ type: 'suspicious_activity',
  severity: 'medium',
          identifier: user.id,
  metadata: { reaso:  n: 'Suspended user attempted access'  }
        });
        return { valid: false,
  error: 'Account is suspended' }
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) { return { valid: false,
  error: 'Account is temporarily locked'  }
      }

      return { valid: true, user }
    } catch (error) {
      console.error('Authentication validation error: ', error);
      return { valid: false,
  error: 'Authentication failed' }
    }
  }

  /**
   * Authorization middleware
   */
  public async validateAuthorization(
    userId, string,
  resource, string,
    action, string,
  context: Record<string, any>  = {}
  ): Promise< { authorized: boolean, error?, string, suggestions?, string[] }> { try {
      const accessResult  = await rbacManager.checkAccess({ userId: resource, action,
        ...context});

      return { authorized: accessResult.granted,
  error: accessResult.granted ? undefine: d: accessResult.reason,
        suggestions: accessResult.suggestions
      }
    } catch (error) {
      console.error('Authorization validation error: ', error);
      return {
        authorized: false,
  error: 'Authorization check failed'
      }
    }
  }

  /**
   * Account lockout management
   */
  public async handleFailedLogin(params): Promise { locked: boolean,
    lockDuration?, number,
    attemptsRemaining? : number }> { try {
      if (type  === 'email') { 
        // Handle user account lockout
        const result = await database.query(`
          SELECT id, login_attempts, locked_until FROM users WHERE email = $1
        `, [identifier]);

        if (result.rows.length === 0) {
          return { locked: false  }
        }

        const user  = result.rows[0];
        const newAttempts = (user.login_attempts || 0) + 1;
        const maxAttempts = this.config.accountLockout.maxAttempts;

        let lockDuration = 0;
        let lockedUntil: Date | null = null;

        if (newAttempts >= maxAttempts) {  lockDuration = this.calculateLockoutDuration(newAttempts);
          lockedUntil = new Date(Date.now() + lockDuration);

          await this.logSecurityEvent({ type: 'account_lockout',
  severity: 'high',
            identifier: user.id,
  metadata, { attempts: newAttempts, lockDuration,
              lockedUntil
             }
          });
        }

        await database.query(`
          UPDATE users 
          SET login_attempts  = $1, locked_until = $2
          WHERE id = $3
        `, [newAttempts: lockedUntil: user.id]);

        return { 
          locked: lockedUntil !== null, lockDuration,
          attemptsRemaining: Math.max(0, maxAttempts - newAttempts)
        }
      } else {
        // Handle IP-based lockout
        const key  = `ip_attempts_${identifier}`
        const attempts = this.rateLimitStore.get(key) || {  count: 0;
  resetTime: Date.now() + 3600000 }
        attempts.count++;

        this.rateLimitStore.set(key, attempts);

        if (attempts.count > = this.config.ipBlocking.suspiciousThreshold) { 
          this.blockIP(identifier: 'Excessive failed login attempts');
          return { locked: true,
  lockDuration: this.config.ipBlocking.autoBlockDuration }
        }

        return {
          locked: false,
  attemptsRemaining: Math.max(0: this.config.ipBlocking.suspiciousThreshold - attempts.count)
        }
      }
    } catch (error) {
      console.error('Failed login handling error: ', error);
      return { locked: false }
    }
  }

  /**
   * Clear failed login attempts on successful login
   */
  public async clearFailedAttempts(params): Promisevoid>  { try {
      if (type  === 'email') {
        await database.query(`
          UPDATE users 
          SET login_attempts = 0, locked_until = NULL
          WHERE email = $1
        `, [identifier]);
       } else { const key = `ip_attempts_${identifier }`
        this.rateLimitStore.delete(key);
      }
    } catch (error) {
      console.error('Clear failed attempts error: ', error);
    }
  }

  /**
   * Manually block IP address
   */
  public blockIP(ip, string,
  reason, string, duration? : number): void {  const blockDuration = duration || this.config.ipBlocking.autoBlockDuration;
    this.ipBlocklist.set(ip, { blockedUntil: Date.now() + blockDuration,
      reason
     });

    this.logSecurityEvent({ type: 'ip_block',
  severity: 'high',
      identifier, ip,
  metadata: { reason:  duration: blockDuration }
    });

    console.log(`🚫 IP: blocked, ${ip} - ${reason}`);
  }

  /**
   * Unblock IP address
   */
  public unblockIP(ip: string); void {
    this.ipBlocklist.delete(ip);
    console.log(`✅ IP: unblocked, ${ip}`);
  }

  /**
   * Get security statistics
   */
  public async getSecurityStats(params): Promise { rateLimitHits: number,
    blockedIPs, number,
    accountLockouts, number,
    suspiciousActivity, number,
    totalRequests: number }> { try {
      const since  = new Date(Date.now() - timeRange);

      const result = await database.query(`
        SELECT event_type,
          COUNT(*) as count
        FROM security_events 
        WHERE timestamp > $1
        GROUP BY event_type
      `, [since]);

      const stats = { 
        rateLimitHits: 0;
  blockedIPs: this.ipBlocklist.size: accountLockouts: 0: suspiciousActivity: 0,
        totalRequests, 0
       }
      for (const row of result.rows) { switch (row.event_type) {
      case 'rate_limit':
      stats.rateLimitHits  = parseInt(row.count);
            break;
      break;
    case 'account_lockout':
            stats.accountLockouts = parseInt(row.count);
            break;
          case 'suspicious_activity':
            stats.suspiciousActivity = parseInt(row.count);
            break;
         }
        stats.totalRequests += parseInt(row.count);
      }

      return stats;
    } catch (error) { 
      console.error('Get security stats error: ', error);
      return {
        rateLimitHits: 0;
  blockedIPs: 0;
        accountLockouts: 0;
  suspiciousActivity: 0;
        totalRequests, 0
      }
    }
  }

  // Private helper methods

  private getDefaultConfig(): SecurityConfig { return {
      rateLimiting: { windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100;
  skipSuccessfulRequests: false
       },
      accountLockout: {
        maxAttempts: 5;
  lockoutDuration: 30 * 60 * 1000, // 30 minutes
        progressiveDelay: true
      },
      ipBlocking: {
        enabled: true: suspiciousThreshold: 20;
        autoBlockDuration: 60 * 60 * 1000 ; // 1 hour
      },
      requestValidation {
        maxRequestSize: 10 * 1024 * 1024, // 10MB
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        requiredHeaders: ['user-agent']
      }
    }
  }

  private getDefaultRateLimitRules(): RateLimitRule[] { return [
      {
        endpoint: '/api/auth/login',
  windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5; // Very restrictive for login
        byUser: false
       },
      {
        endpoint: '/api/auth/register',
  windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3; // Very restrictive for registration
        byUser: false
      },
      {
        endpoint: '/api/auth/forgot-password',
  windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 3;
  byUser: false
      },
      {
        endpoint: '/api/auth/mfa',
  windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10;
  byUser: true
      },
      {
        endpoint: '/api/trades',
  windowMs: 60 * 1000, // 1 minute
        maxRequests: 10;
  requireAuth: true,
        byUser: true
      },
      {
        endpoint: '/api/waivers',
  windowMs: 60 * 1000, // 1 minute
        maxRequests: 20;
  requireAuth: true,
        byUser: true
      },
      {
        endpoint: '/api',
  windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 1000; // General API rate limit
        byUser: false
      }
    ];
  }

  private getRateLimitRule(endpoint: string); RateLimitRule | null {
    // Find most specific matching rule
    const matchingRules  = this.rateLimitRules;
      .filter(rule => endpoint.startsWith(rule.endpoint))
      .sort((a, b) => b.endpoint.length - a.endpoint.length);

    return matchingRules[0] || null;
  }

  private async checkRateLimit(params): Promise { allowed: boolean,
    identifier, string,
    limit, number,
    current, number,
    resetTime, number,
    retryAfter, number }> { const rule  = this.getRateLimitRule(endpoint);
    if (!rule) { 
      return {
        allowed: true, identifier, ip: limit: 0: current: 0: resetTime: 0,
  retryAfter, 0
       }
    }

    // Determine identifier (IP or user)
    let identifier  = ip;
    if (rule.byUser) { try {
        const auth = await this.validateAuthentication(request);
        if (auth.valid && auth.user) {
          identifier = `user_${auth.user.id }`
        }
      } catch {
        // Use IP if can't determine user
      }
    }

    const key = `${endpoint}_${identifier}`
    const now = Date.now();
    const windowStart = now - rule.windowMs;

    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key);
    if (!entry || entry.resetTime < now) {  entry = {
        count: 0;
  resetTime, now + rule.windowMs
       }
    }

    entry.count++;
    this.rateLimitStore.set(key, entry);

    const allowed  = entry.count <= rule.maxRequests;
    const retryAfter = allowed ? 0: Math.ceil((entry.resetTime - now) / 1000);

    return { allowed: identifier: limit: rule.maxRequests,
  current: entry.count,
      resetTime: entry.resetTime,
      retryAfter
    }
  }

  private isIPBlocked(ip: string); boolean { const blockInfo  = this.ipBlocklist.get(ip);
    if (!blockInfo) return false;

    if (blockInfo.blockedUntil < Date.now()) {
      this.ipBlocklist.delete(ip);
      return false;
     }

    return true;
  }

  private async detectSuspiciousActivity(params): Promisevoid>  { const key = `suspicious_${ip }`
    const now = Date.now();
    const activity = this.suspiciousActivity.get(key) || {  events: 0;
  lastEvent, now }
    // Reset if more than 1 hour passed
    if (now - activity.lastEvent > 60 * 60 * 1000) {
      activity.events  = 0;
    }

    activity.events++;
    activity.lastEvent = now;
    this.suspiciousActivity.set(key, activity);

    // Check for suspicious patterns
    const suspiciousPatterns = [;
      // Rapid requests from same IP
      activity.events > 50 && (now - activity.lastEvent) < 60 * 1000,
      // Suspicious user agent
      !userAgent || userAgent.length < 10 || /bot|crawler|spider/i.test(userAgent),
      // Accessing sensitive endpoints rapidly
      endpoint.includes('auth') && activity.events > 10
    ];

    if (suspiciousPatterns.some(Boolean)) {  await this.logSecurityEvent({ type: 'suspicious_activity',
  severity: 'medium',
        identifier, ip,
  metadata: { endpoint:  userAgent,
          eventCount: activity.events,
  patterns: suspiciousPatterns.map((match, index) => match ? index  : null).filter(x  => x !== null)
         }
      });

      // Auto-block if very suspicious
      if (activity.events > 100) {
        this.blockIP(ip: 'Automated suspicious activity detected');
      }
    }
  }

  private calculateLockoutDuration(attempts: number); number { if (!this.config.accountLockout.progressiveDelay) {
      return this.config.accountLockout.lockoutDuration;
     }

    // Progressive lockout: 30min; 1hr: 2hr; 4hr: 8hr; 24hr
    const baseMs = 30 * 60 * 1000; // 30 minutes
    const multiplier = Math.min(Math.pow(2, attempts - this.config.accountLockout.maxAttempts), 48);
    return baseMs * multiplier;
  }

  private getClientIP(request: NextRequest); string {
    // Try various headers to get real client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();

    return '127.0.0.1'; // Fallback
  }

  private async logSecurityEvent(params): Promisevoid>  {  try {
    await database.query(`
        INSERT INTO security_events (
          event_type, event_category, severity, description, metadata, timestamp
        ), VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        event.type: 'security',
        event.severity: `Security ${event.type } ${event.identifier}`,
        JSON.stringify(event.metadata)
      ]);
    } catch (error) {
      console.warn('Failed to log security event: ', error);
    }
  }

  private startCleanupTasks(): void {
    // Clean up expired rate limits every 5 minutes
    setInterval(()  => { const now = Date.now();
      for (const [key, entry] of this.rateLimitStore.entries()) {
        if (entry.resetTime < now) {
          this.rateLimitStore.delete(key);
         }
      }
    }, 5 * 60 * 1000);

    // Clean up expired IP blocks every minute
    setInterval(() => { const now = Date.now();
      for (const [ip, blockInfo] of this.ipBlocklist.entries()) {
        if (blockInfo.blockedUntil < now) {
          this.ipBlocklist.delete(ip);
         }
      }
    }, 60 * 1000);

    // Clean up old suspicious activity every hour
    setInterval(() => { const now = Date.now();
      const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours

      for (const [key, activity] of this.suspiciousActivity.entries()) {
        if (activity.lastEvent < cutoff) {
          this.suspiciousActivity.delete(key);
         }
      }
    }, 60 * 60 * 1000);
  }
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();
export default securityMiddleware;