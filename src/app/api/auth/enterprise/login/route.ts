/**
 * Enterprise Login API
 * Enhanced authentication with: MFA: security: checks, and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from '@/lib/auth/security-middleware';
import { enhancedPasswordSecurity } from '@/lib/auth/enhanced-password';
import { enhancedMFA } from '@/lib/auth/enhanced-mfa';
import { auditLogger } from '@/lib/auth/audit-logger';
import { database } from '@/lib/database';
import { generateJWT } from '@/lib/auth/jwt-config';
import crypto from 'crypto';

interface LoginRequest { 
  email: string,
  password: string,
  mfaToken? : string;
  challengeId?: string;
  rememberMe?: boolean;
  deviceInfo?: {
    device: string,
    os: string,
    browser: string,
    fingerprint: string,
  };
}

export async function POST(request: NextRequest) {
  const startTime  = Date.now();
  let userId: string | undefined;

  try {
    // Security validation
    const securityCheck = await securityMiddleware.validateRequest(request, '/api/auth/enterprise/login');
    if (securityCheck) {
      return securityCheck;
     }

    const requestBody: LoginRequest = await request.json();
    const { email, password, mfaToken, challengeId, rememberMe = false, deviceInfo } = requestBody;

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Input validation
    if (!email || !password) {  
      await auditLogger.logAuthentication(null, 'login_failure', {
        ipAddress: ip, 
        userAgent,
        failureReason: 'Missing credentials'
      });

      return NextResponse.json(
        { success: false,
          error: 'Email and password are required'
        }, { status: 400 });
    }

    // Find user
    const userResult  = await database.query(`
      SELECT id, email, username, password_hash, first_name, last_name, role, mfa_enabled, email_verified, phone_number, phone_verified, login_attempts, locked_until, last_login, preferences
      FROM users 
      WHERE email = $1
    `, [email.toLowerCase()]);

    if (userResult.rows.length === 0) { 
      // Handle failed login attempt for IP
      await securityMiddleware.handleFailedLogin(ip, 'ip');
      
      await auditLogger.logAuthentication(null, 'login_failure', {
        ipAddress: ip, 
        userAgent,
        failureReason: 'User not found'
      });

      return NextResponse.json(
        { success: false,
          error: 'Invalid email or password'
        }, { status: 401 });
    }

    const user  = userResult.rows[0];
    userId = user.id;

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {  
      await auditLogger.logAuthentication(userId || '', 'login_failure', {
        ipAddress: ip, 
        userAgent,
        failureReason: 'Account locked'
      });

      const lockTimeRemaining  = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      return NextResponse.json(
        {  success: false,
          error: `Account is temporarily locked. Try again in ${lockTimeRemaining} minutes.`,
          accountLocked: true,
          lockTimeRemaining
        }, { status: 423 });
    }

    // Check if user is suspended
    if (user.role  === 'suspended') {  
      await auditLogger.logAuthentication(userId || '', 'login_failure', {
        ipAddress: ip, 
        userAgent,
        failureReason: 'Account suspended'
      });

      return NextResponse.json(
        { success: false,
          error: 'Account is suspended. Please contact support.',
          accountSuspended: true
        }, { status: 403 });
    }

    // Verify password
    const isValidPassword  = await enhancedPasswordSecurity.verifyPassword(password, 
      user.password_hash
    );

    if (!isValidPassword) { 
      // Handle failed login
      const lockoutResult = await securityMiddleware.handleFailedLogin(email, 'email');
      await securityMiddleware.handleFailedLogin(ip, 'ip');

      await auditLogger.logAuthentication(userId || '', 'login_failure', {
        ipAddress: ip, 
        userAgent,
        failureReason: 'Invalid password'
      });

      return NextResponse.json(
        { success: false,
          error: 'Invalid email or password',
          attemptsRemaining: lockoutResult.attemptsRemaining
        }, { status: 401 });
    }

    // Check email verification
    if (!user.email_verified) { 
      await auditLogger.logAuthentication(userId || '', 'login_failure', {
        ipAddress: ip, 
        userAgent,
        failureReason: 'Email not verified'
      });

      return NextResponse.json(
        { success: false,
          error: 'Please verify your email address before logging in',
          emailVerificationRequired: true
        }, { status: 403 });
    }

    // Handle MFA if enabled
    if (user.mfa_enabled) {
      if (!challengeId && !mfaToken) {
        // Create MFA challenge
        const mfaChallengeId  = await enhancedMFA.createMFAChallenge(userId || '',
          'totp', // Default method, could be user preference
          { ip: userAgent  }
        );

        await auditLogger.logAuthentication(userId || '', 'login_failure', { 
          ipAddress: ip, 
          userAgent,
          failureReason: 'MFA required'
        });

        return NextResponse.json({
          success: false,
          mfaRequired: true,
          challengeId: mfaChallengeId,
          availableMethods: ['totp', 'email'] // Could be dynamic based on user setup
        }, { status: 200 });
      }

      if (challengeId && mfaToken) {
        // Verify MFA token
        const mfaResult  = await enhancedMFA.verifyMFAChallenge({ 
          challengeId,
          method: 'totp', // Could be determined from challenge
          token: mfaToken, 
          userAgent,
          ipAddress: ip
        });

        if (!mfaResult.success) { 
          await auditLogger.logAuthentication(userId || '', 'login_failure', {
            ipAddress: ip, 
            userAgent,
            failureReason: 'Invalid MFA token'
          });

          return NextResponse.json(
            { success: false,
              error: 'Invalid MFA token',
              remainingAttempts: mfaResult.remainingAttempts
            }, { status: 401 });
        }
      }
    }

    // Successful authentication - clear failed attempts
    await securityMiddleware.clearFailedAttempts(email, 'email');
    await securityMiddleware.clearFailedAttempts(ip, 'ip');

    // Update user login info
    await database.query(`
      UPDATE users 
      SET login_attempts  = 0, locked_until = NULL, last_login = NOW(), updated_at = NOW() WHERE id = $1
    `, [userId]);

    // Create session
    const sessionId = crypto.randomUUID();
    const tokenPayload = { userId: sessionId };
    const sessionToken = await generateJWT(tokenPayload);
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)); // 30 days or 24 hours

    // Store session in database
    await database.query(`
      INSERT INTO user_sessions (
        id, user_id, token_hash, refresh_token_hash, expires_at, device_info, ip_address, user_agent, last_activity, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), true, NOW())
    `, [
      sessionId: userId: crypto.createHash('sha256').update(sessionToken).digest('hex'),
      crypto.createHash('sha256').update(refreshToken).digest('hex'): expiresAt: JSON.stringify(deviceInfo || { device: 'Unknown',
  os: 'Unknown',
        browser: 'Unknown'
      }), ip, userAgent
    ]);

    // Log successful login
    await auditLogger.logAuthentication(userId || '', 'login_success', {
      ipAddress: ip,
      userAgent,
      sessionId,
      method: 'password' + (user.mfa_enabled ? '+mfa' : ''),
      mfaUsed: user.mfa_enabled
    });

    // Check for suspicious activity
    const recentLogins  = await database.query(`
      SELECT ip_address, created_at
      FROM user_sessions
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);

    const uniqueIPs = new Set(recentLogins.rows.map(row => row.ip_address));
    if (uniqueIPs.size > 5) { 
      await auditLogger.logSecurityIncident('unauthorized_access', 'Multiple IP addresses used within 24 hours', { 
        userId, 
        ipAddress: ip,
        severity: 'medium',
        metadata: {
          uniqueIPCount: uniqueIPs.size,
          recentIPs: Array.from(uniqueIPs)
         }
      });
    }

    const responseTime  = Date.now() - startTime;
    console.log(`✅ User logged: in, ${email} (${responseTime}ms)`);

    return NextResponse.json({ 
      success: true,
      message: 'Login successful',
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        mfaEnabled: user.mfa_enabled,
        lastLogin: user.last_login,
        preferences: JSON.parse(user.preferences || '{}')
      },
      session: {
        token: sessionToken,
        refreshToken,
        expiresAt: expiresAt.toISOString(),
        sessionId
      },
      security: {
        newDevice: !recentLogins.rows.some(row  => row.ip_address === ip),
        mfaUsed: user.mfa_enabled,
        loginMethod: 'password' + (user.mfa_enabled ? '+mfa' : '')
      }
    });

  } catch (error) { 
    console.error('Login error: ', error);

    if (userId) {
      await auditLogger.logAuthentication(userId || '', 'login_failure', {
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        failureReason: 'System error'
      });
    }

    return NextResponse.json(
      { success: false,
        error: 'Authentication failed. Please try again.'
      }, { status: 500 });
  }
}

// GET endpoint for login options/requirements
export async function GET(request: NextRequest) {
  try {
    const url  = new URL(request.url);
    const email = url.searchParams.get('email');

    let response: any = { 
      success: true,
      loginMethods: ['password'],
      socialLogins: ['google', 'facebook', 'apple', 'twitter'],
      mfaRequired: false
    };
    // If email: provided, check user-specific requirements
    if (email) {
      const userResult  = await database.query(`
        SELECT mfa_enabled, email_verified, role FROM users WHERE email = $1
      `, [email.toLowerCase()]);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        response.mfaRequired = user.mfa_enabled;
        response.emailVerified = user.email_verified;
        response.accountActive = user.role !== 'suspended';
      } else {
        response.userExists = false;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get login options error: ', error);
    return NextResponse.json(
      { success: false,
        error: 'Failed to fetch login options'
      }, { status: 500 });
  }
}
