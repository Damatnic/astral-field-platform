/**
 * Enterprise OAuth Authentication API
 * OAuth provider integration with security and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from '@/lib/auth/security-middleware';
import { oauthManager, OAuthProvider } from '@/lib/auth/oauth';
import { auditLogger } from '@/lib/auth/audit-logger';
import { generateJWT } from '@/lib/auth/jwt-config';
import { database } from '@/lib/database';
import crypto from 'crypto';

interface OAuthCallbackRequest {
  code: string,
  state: string,
  error?: string;
  error_description?: string;
}
export async function GET(request: NextRequest) {
  try {
    const provider = params.provider as OAuthProvider;
    const url = new URL(request.url);

    // Check if provider is supported
    if (!oauthManager.isProviderConfigured(provider)) {
      return NextResponse.json(
      { success: false,
      error: `OAuth provider '${provider }' is not configured`
      }, { status: 400 });
    }

    // Handle authorization URL generation
    if (url.pathname.endsWith('/authorize')) { const redirectUrl = url.searchParams.get('redirect_url');
      const authUrl = oauthManager.getAuthorizationUrl(provider, redirectUrl || undefined);
      
      return NextResponse.json({
        success: true,
      authorizationUrl: authUrl
       });
    }

    // Handle OAuth callback
    return await handleOAuthCallback(request, provider);

  } catch (error) {
    console.error(`OAuth ${params.provider} error, `, error);
    return NextResponse.json(
      { success: false,
      error: 'OAuth authentication failed'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const startTime = Date.now();

  try {
    const provider = params.provider as OAuthProvider;
    
    // Security validation
    const securityCheck = await securityMiddleware.validateRequest(request, `/api/auth/enterprise/oauth/${provider }`);
    if (securityCheck) { return securityCheck;
     }

    // Check if provider is supported
    if (!oauthManager.isProviderConfigured(provider)) { return NextResponse.json(
      { success: false,
      error: `OAuth provider '${provider }' is not configured`
      }, { status: 400 });
    }

    const requestBody: OAuthCallbackRequest = await request.json();
    const { code, state, error, error_description } = requestBody;

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Handle OAuth errors
    if (error) { await auditLogger.logAuthentication(null, 'login_failure', {
        ipAddress: ip,
        userAgent,
        method: `oauth_${provider }`,
        failureReason: `OAuth error; ${error} - ${error_description}`
      });

      return NextResponse.json(
      { success: false,
      error: error_description || `OAuth authentication failed; ${error}`
      }, { status: 400 });
    }

    if (!code || !state) { await auditLogger.logAuthentication(null, 'login_failure', {
        ipAddress: ip,
        userAgent,
        method: `oauth_${provider }`,
        failureReason: 'Missing authorization code or state'
      });

      return NextResponse.json(
      { success: false,
      error: 'Missing authorization code or state parameter'
      }, { status: 400 });
    }

    // Authenticate with OAuth provider
    const oauthResult = await oauthManager.authenticateWithOAuth(provider, code, state);
    
    if (!oauthResult.user) { await auditLogger.logAuthentication(null, 'login_failure', {
        ipAddress: ip,
        userAgent,
        method: `oauth_${provider }`,
        failureReason: 'Failed to retrieve user information from OAuth provider'
      });

      return NextResponse.json(
      { success: false,
      error: 'Failed to retrieve user information from OAuth provider'
      }, { status: 400 });
    }

    const oauthUser = oauthResult.user;
    let userId: string;
    let isNewUser = oauthResult.isNewUser;

    if (isNewUser) {
      // Create new user account
      userId = crypto.randomUUID();
      
      await database.query(`
        INSERT INTO users (
          id, email, username, first_name, last_name, avatar, role, email_verified, preferences, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `, [
        userId,
        oauthUser.email.toLowerCase(),
        oauthUser.username || oauthUser.email.split('@')[0],
        oauthUser.firstName,
        oauthUser.lastName,
        oauthUser.avatar,
        'player', // Default role
        oauthUser.emailVerified,
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
          }
        })
      ]);

      // Log user creation
      await auditLogger.logUserManagement('system', userId, 'create', {
        reason: `OAuth registration via ${provider}`,
        ipAddress: ip
      });
    } else {
      // Find existing user
      const existingUser = await database.query(`
        SELECT id FROM users WHERE email = $1
      `, [oauthUser.email.toLowerCase()]);

      if (existingUser.rows.length === 0) { throw new Error('User not found after OAuth authentication');
       }

      userId = existingUser.rows[0].id;
    }

    // Store/update social login
    await database.query(`
      INSERT INTO user_social_logins (
        user_id, provider, provider_id, email, verified, connected_at, access_token, refresh_token, expires_at, last_used, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, NOW(), NOW(), NOW())
      ON CONFLICT(user_id, provider) DO UPDATE SET
        provider_id = EXCLUDED.provider_id,
        email = EXCLUDED.email,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        last_used = NOW(),
        updated_at = NOW()
    `, [
      userId,
      provider,
      oauthUser.id,
      oauthUser.email,
      oauthUser.emailVerified,
      oauthResult.tokens.accessToken, // Should be encrypted in production
      oauthResult.tokens.refreshToken,
      oauthResult.tokens.expiresIn ? new Date(Date.now() + (oauthResult.tokens.expiresIn * 1000)) : null
    ]);

    // Update user last login
    await database.query(`
      UPDATE users 
      SET last_login = NOW(), updated_at = NOW() WHERE id = $1
    `, [userId]);

    // Create session
    const sessionId = crypto.randomUUID();
    const tokenPayload = { userId, sessionId }
    const sessionToken = await generateJWT(tokenPayload);
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session
    await database.query(`
      INSERT INTO user_sessions (
        id, user_id, token_hash, refresh_token_hash, expires_at, device_info, ip_address, user_agent, last_activity, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), true, NOW())
    `, [
      sessionId, userId, crypto.createHash('sha256').update(sessionToken).digest('hex'),
      crypto.createHash('sha256').update(refreshToken).digest('hex'), expiresAt, JSON.stringify({
  device: 'Unknown',
  os: 'Unknown',
        browser: 'Unknown'
      }), ip, userAgent
    ]);

    // Log successful authentication
    await auditLogger.logAuthentication(userId, 'login_success', {
      ipAddress: ip, userAgent, sessionId,
      method: `oauth_${provider}`
    });

    // Get updated user data
    const userResult = await database.query(`
      SELECT 
        id, email, username, first_name, last_name, avatar, role, email_verified, phone_verified, mfa_enabled, last_login, preferences
      FROM users 
      WHERE id = $1
    `, [userId]);

    const user = userResult.rows[0];

    const responseTime = Date.now() - startTime;
    console.log(`✅ OAuth login successful, ${provider} - ${oauthUser.email} (${responseTime}ms)`);

    return NextResponse.json({
      success: true,
      message: `${provider} authentication successful`,
      isNewUser,
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar,
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
      oauth: {
        provider,
        providerId: oauthUser.id,
  accessToken: oauthResult.tokens.accessToken // Only for initial setup
      }
    });

  } catch (error) {
    console.error(`OAuth ${params.provider} POST error, `, error);
    
    await auditLogger.logAuthentication(null, 'login_failure', {
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || '',
      method: `oauth_${params.provider}`,
      failureReason: 'System error'
    });

    return NextResponse.json(
      { success: false,
      error: `${params.provider} authentication failed`
    }, { status: 500 });
  }
}

async function handleOAuthCallback(request: NextRequest, provider: OAuthProvider) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';

  // Handle OAuth errors
  if (error) {
    await auditLogger.logAuthentication(null, 'login_failure', {
      ipAddress: ip,
        userAgent,
        method: `oauth_${provider }`,
      failureReason: `OAuth callback error; ${error} - ${errorDescription}`
    });

    // Redirect to frontend with error
    const redirectUrl = new URL('/auth/error', process.env.NEXTAUTH_URL);
    redirectUrl.searchParams.set('error', error);
    redirectUrl.searchParams.set('description', errorDescription || '');
    return NextResponse.redirect(redirectUrl);
  }

  if (!code || !state) { await auditLogger.logAuthentication(null, 'login_failure', {
      ipAddress: ip,
        userAgent,
        method: `oauth_${provider }`,
      failureReason: 'Missing code or state in OAuth callback'
    });

    const redirectUrl = new URL('/auth/error', process.env.NEXTAUTH_URL);
    redirectUrl.searchParams.set('error', 'missing_parameters');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Complete OAuth flow
    const oauthResult = await oauthManager.authenticateWithOAuth(provider, code, state);
    
    // Create temporary token for frontend to complete registration/login
    const tempToken = crypto.randomBytes(32).toString('hex');
    
    // Store OAuth result temporarily (in production, use Redis or similar)
    // For now, we'll redirect to frontend with a temporary token
    
    const redirectUrl = new URL('/auth/oauth/complete', process.env.NEXTAUTH_URL);
    redirectUrl.searchParams.set('provider', provider);
    redirectUrl.searchParams.set('token', tempToken);
    redirectUrl.searchParams.set('new_user', oauthResult.isNewUser.toString());
    
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error(`OAuth callback error for ${provider}, `, error);
    
    await auditLogger.logAuthentication(null, 'login_failure', {
      ipAddress: ip,
        userAgent,
        method: `oauth_${provider}`,
      failureReason: 'OAuth callback processing failed'
    });

    const redirectUrl = new URL('/auth/error', process.env.NEXTAUTH_URL);
    redirectUrl.searchParams.set('error', 'callback_failed');
    return NextResponse.redirect(redirectUrl);
  }
}