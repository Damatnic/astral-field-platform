/**
 * Enterprise User Registration API
 * Enhanced registration with email verification, password policies, and security checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from '@/lib/auth/security-middleware';
import { enhancedPasswordSecurity } from '@/lib/auth/enhanced-password';
import { auditLogger } from '@/lib/auth/audit-logger';
import { database } from '@/lib/database';
import { generateJWT } from '@/lib/auth/jwt-config';
import crypto from 'crypto';

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  marketingConsent?: boolean;
  inviteCode?: string;
}

export async function POST(request: NextRequest) {
  let userId: string | undefined;
  const startTime = Date.now();

  try {
    // Security validation
    const securityCheck = await securityMiddleware.validateRequest(request, '/api/auth/enterprise/register');
    if (securityCheck) {
      return securityCheck;
    }

    const requestBody: RegisterRequest = await request.json();
    const { 
      email, 
      username, 
      password, 
      firstName, 
      lastName, 
      phoneNumber,
      acceptTerms,
      acceptPrivacy,
      marketingConsent = false,
      inviteCode
    } = requestBody;

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Input validation
    if (!email || !username || !password) {
      await auditLogger.logAuthentication(null, 'login_failure', {
        ipAddress: ip,
        userAgent,
        failureReason: 'Missing required fields'
      });

      return NextResponse.json({
        success: false,
        error: 'Email, username, and password are required'
      }, { status: 400 });
    }

    // Terms acceptance validation
    if (!acceptTerms || !acceptPrivacy) {
      return NextResponse.json({
        success: false,
        error: 'You must accept the Terms of Service and Privacy Policy'
      }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 });
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        success: false,
        error: 'Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores'
      }, { status: 400 });
    }

    // Check for existing user
    const existingUser = await database.query(`
      SELECT id, email, username FROM users 
      WHERE email = $1 OR username = $2
    `, [email.toLowerCase(), username]);

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      const field = existing.email === email.toLowerCase() ? 'email' : 'username';
      
      await auditLogger.logAuthentication(null, 'login_failure', {
        ipAddress: ip,
        userAgent,
        failureReason: `${field} already exists`
      });

      return NextResponse.json({
        success: false,
        error: `A user with this ${field} already exists`
      }, { status: 409 });
    }

    // Validate password strength
    const passwordValidation = await enhancedPasswordSecurity.validatePassword(
      password,
      undefined,
      username,
      { firstName: firstName || '', lastName: lastName || '', email }
    );

    if (!passwordValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Password does not meet security requirements',
        passwordErrors: passwordValidation.errors,
        passwordWarnings: passwordValidation.warnings,
        strength: passwordValidation.strength
      }, { status: 400 });
    }

    // Check invite code if provided
    let inviteValid = true;
    let inviterUserId: string | undefined;
    if (inviteCode) {
      const inviteResult = await database.query(`
        SELECT id, invited_by, expires_at, used_at 
        FROM user_invites 
        WHERE code = $1
      `, [inviteCode]);

      if (inviteResult.rows.length === 0) {
        inviteValid = false;
      } else {
        const invite = inviteResult.rows[0];
        if (invite.used_at || (invite.expires_at && new Date(invite.expires_at) < new Date())) {
          inviteValid = false;
        } else {
          inviterUserId = invite.invited_by;
        }
      }

      if (!inviteValid) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or expired invite code'
        }, { status: 400 });
      }
    }

    // Hash password
    const passwordHash = await enhancedPasswordSecurity.hashPassword(password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    userId = crypto.randomUUID();
    await database.query(`
      INSERT INTO users (
        id, email, username, password_hash, first_name, last_name, phone_number,
        role, email_verified, email_verification_token, email_verification_expires,
        preferences, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    `, [
      userId,
      email.toLowerCase(),
      username,
      passwordHash.hash,
      firstName,
      lastName,
      phoneNumber,
      'player', // Default role
      false,
      verificationToken,
      verificationExpires,
      JSON.stringify({
        theme: 'auto',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
          trades: true,
          waivers: true,
          lineups: true,
          injuries: true,
          news: true
        },
        privacy: {
          profileVisible: true,
          statsVisible: true,
          tradesVisible: true,
          allowDirectMessages: true
        },
        marketingConsent
      })
    ]);

    // Store password in history
    await enhancedPasswordSecurity.storePasswordHistory(
      userId,
      passwordHash.hash,
      passwordHash.algorithm,
      passwordValidation.strength.score
    );

    // Mark invite as used
    if (inviteCode) {
      await database.query(`
        UPDATE user_invites 
        SET used_at = NOW(), used_by = $1
        WHERE code = $2
      `, [userId, inviteCode]);
    }

    // Generate session token
    const sessionToken = await generateJWT({ userId });

    // Log successful registration
    await auditLogger.logAuthentication(userId, 'login_success', {
      ipAddress: ip,
      userAgent,
      method: 'registration'
    });

    await auditLogger.logUserManagement('system', userId, 'create', {
      reason: inviterUserId ? `User registration with invite from ${inviterUserId}` : 'User registration',
      ipAddress: ip
    });

    // Send verification email (in production)
    // await emailService.sendVerificationEmail(email, verificationToken);

    const responseTime = Date.now() - startTime;
    console.log(`✅ User registered: ${email} (${responseTime}ms)`);

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: userId,
        email: email.toLowerCase(),
        username,
        firstName,
        lastName,
        emailVerified: false,
        role: 'player'
      },
      token: sessionToken,
      verificationRequired: true,
      passwordStrength: passwordValidation.strength
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (userId) {
      await auditLogger.logAuthentication(userId, 'login_failure', {
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        failureReason: 'System error during registration'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Registration failed. Please try again.'
    }, { status: 500 });
  }
}

// GET endpoint for registration requirements
export async function GET() {
  try {
    const passwordPolicy = enhancedPasswordSecurity.getPasswordPolicy();
    
    return NextResponse.json({
      success: true,
      requirements: {
        password: {
          minLength: passwordPolicy.minLength,
          maxLength: passwordPolicy.maxLength,
          requireLowercase: passwordPolicy.requireLowercase,
          requireUppercase: passwordPolicy.requireUppercase,
          requireNumbers: passwordPolicy.requireNumbers,
          requireSpecialChars: passwordPolicy.requireSpecialChars,
          minSpecialChars: passwordPolicy.minSpecialChars
        },
        username: {
          minLength: 3,
          maxLength: 30,
          pattern: '^[a-zA-Z0-9_-]+$',
          description: 'Letters, numbers, hyphens, and underscores only'
        },
        email: {
          required: true,
          verification: true
        },
        terms: {
          termsOfService: true,
          privacyPolicy: true,
          marketingOptional: true
        }
      }
    });
  } catch (error) {
    console.error('Get requirements error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch requirements'
    }, { status: 500 });
  }
}