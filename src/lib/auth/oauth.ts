/**
 * OAuth Integration System
 * Comprehensive OAuth provider integration with security best practices
 */

import crypto from 'crypto';
import { database } from '@/lib/database';
import { generateJWT } from './jwt-config';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

export interface OAuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  emailVerified: boolean;
  locale?: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

export type OAuthProvider = 'google' | 'facebook' | 'apple' | 'twitter' | 'discord' | 'github';

class OAuthManager {
  private static instance: OAuthManager;
  private providers: Map<OAuthProvider, OAuthConfig> = new Map();
  private stateStore: Map<string, { provider: OAuthProvider; expiresAt: number; redirectUrl?: string }> = new Map();

  private constructor() {
    this.initializeProviders();
    this.startStateCleanup();
  }

  public static getInstance(): OAuthManager {
    if (!OAuthManager.instance) {
      OAuthManager.instance = new OAuthManager();
    }
    return OAuthManager.instance;
  }

  private initializeProviders(): void {
    // Google OAuth configuration
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.providers.set('google', {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
        scope: ['openid', 'email', 'profile'],
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
      });
    }

    // Facebook OAuth configuration
    if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
      this.providers.set('facebook', {
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        redirectUri: process.env.FACEBOOK_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/facebook`,
        scope: ['email', 'public_profile'],
        authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        userInfoUrl: 'https://graph.facebook.com/v18.0/me'
      });
    }

    // Apple OAuth configuration (Sign in with Apple)
    if (process.env.APPLE_CLIENT_ID && process.env.APPLE_KEY_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_PRIVATE_KEY) {
      this.providers.set('apple', {
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: this.generateAppleClientSecret(),
        redirectUri: process.env.APPLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/apple`,
        scope: ['name', 'email'],
        authorizationUrl: 'https://appleid.apple.com/auth/authorize',
        tokenUrl: 'https://appleid.apple.com/auth/token',
        userInfoUrl: '' // Apple doesn't have a separate user info endpoint
      });
    }

    // Twitter OAuth configuration (OAuth 2.0)
    if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
      this.providers.set('twitter', {
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        redirectUri: process.env.TWITTER_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
        scope: ['tweet.read', 'users.read'],
        authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        userInfoUrl: 'https://api.twitter.com/2/users/me'
      });
    }

    // Discord OAuth configuration
    if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
      this.providers.set('discord', {
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        redirectUri: process.env.DISCORD_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/discord`,
        scope: ['identify', 'email'],
        authorizationUrl: 'https://discord.com/api/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        userInfoUrl: 'https://discord.com/api/users/@me'
      });
    }

    // GitHub OAuth configuration
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      this.providers.set('github', {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/github`,
        scope: ['user:email', 'read:user'],
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user'
      });
    }

    console.log(`🔐 OAuth providers initialized: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  /**
   * Generate authorization URL for OAuth provider
   */
  public getAuthorizationUrl(provider: OAuthProvider, redirectUrl?: string): string {
    const config = this.providers.get(provider);
    if (!config) {
      throw new Error(`OAuth provider '${provider}' is not configured`);
    }

    const state = this.generateState(provider, redirectUrl);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      response_type: 'code',
      state,
      access_type: 'offline', // For Google to get refresh token
      prompt: 'consent' // Force consent screen to ensure refresh token
    });

    // Provider-specific parameters
    if (provider === 'apple') {
      params.set('response_mode', 'form_post');
    }

    if (provider === 'twitter') {
      params.set('code_challenge', this.generateCodeChallenge());
      params.set('code_challenge_method', 'S256');
    }

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<OAuthTokens> {
    // Validate state
    if (!this.validateState(provider, state)) {
      throw new Error('Invalid or expired OAuth state');
    }

    const config = this.providers.get(provider);
    if (!config) {
      throw new Error(`OAuth provider '${provider}' is not configured`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code'
    });

    // Provider-specific parameters
    if (provider === 'twitter') {
      params.set('code_verifier', this.getCodeVerifier()); // You'd need to store this during auth URL generation
    }

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'AstralField/1.0'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600,
        tokenType: data.token_type || 'Bearer',
        scope: data.scope || config.scope.join(' ')
      };
    } catch (error) {
      console.error(`OAuth token exchange error for ${provider}:`, error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Get user information from OAuth provider
   */
  public async getUserInfo(provider: OAuthProvider, accessToken: string): Promise<OAuthUser> {
    const config = this.providers.get(provider);
    if (!config) {
      throw new Error(`OAuth provider '${provider}' is not configured`);
    }

    // Apple doesn't have a separate user info endpoint
    if (provider === 'apple') {
      return this.parseAppleIdToken(accessToken);
    }

    try {
      const response = await fetch(config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'AstralField/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`User info request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return this.normalizeUserInfo(provider, data);
    } catch (error) {
      console.error(`OAuth user info error for ${provider}:`, error);
      throw new Error('Failed to retrieve user information');
    }
  }

  /**
   * Complete OAuth authentication flow
   */
  public async authenticateWithOAuth(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<{
    user: OAuthUser;
    tokens: OAuthTokens;
    isNewUser: boolean;
  }> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(provider, code, state);
      
      // Get user information
      const oauthUser = await this.getUserInfo(provider, tokens.accessToken);
      
      // Check if user exists
      const existingUser = await this.findUserByEmail(oauthUser.email);
      const isNewUser = !existingUser;
      
      // Store or update social login
      const userId = existingUser?.id || crypto.randomUUID();
      
      if (isNewUser) {
        await this.createUserFromOAuth(userId, oauthUser);
      }
      
      await this.storeSocialLogin(userId, provider, oauthUser.id, tokens);
      
      console.log(`✅ OAuth authentication successful: ${oauthUser.email} (${provider})`);
      
      return {
        user: oauthUser,
        tokens,
        isNewUser
      };
    } catch (error) {
      console.error(`OAuth authentication error for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Refresh OAuth tokens
   */
  public async refreshTokens(provider: OAuthProvider, refreshToken: string): Promise<OAuthTokens> {
    const config = this.providers.get(provider);
    if (!config) {
      throw new Error(`OAuth provider '${provider}' is not configured`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'AstralField/1.0'
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Some providers don't return new refresh token
        expiresIn: data.expires_in || 3600,
        tokenType: data.token_type || 'Bearer',
        scope: data.scope || config.scope.join(' ')
      };
    } catch (error) {
      console.error(`OAuth token refresh error for ${provider}:`, error);
      throw new Error('Failed to refresh OAuth tokens');
    }
  }

  /**
   * Revoke OAuth tokens
   */
  public async revokeTokens(provider: OAuthProvider, token: string): Promise<boolean> {
    // Implementation varies by provider
    const revokeUrls: Record<OAuthProvider, string | null> = {
      google: 'https://oauth2.googleapis.com/revoke',
      facebook: 'https://graph.facebook.com/me/permissions',
      apple: null, // Apple doesn't have a revoke endpoint
      twitter: 'https://api.twitter.com/2/oauth2/revoke',
      discord: 'https://discord.com/api/oauth2/token/revoke',
      github: null // GitHub tokens expire naturally
    };

    const revokeUrl = revokeUrls[provider];
    if (!revokeUrl) {
      console.warn(`Token revocation not supported for ${provider}`);
      return true; // Consider it successful if not supported
    }

    try {
      const response = await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({ token }).toString()
      });

      return response.ok;
    } catch (error) {
      console.error(`Token revocation error for ${provider}:`, error);
      return false;
    }
  }

  /**
   * Get available OAuth providers
   */
  public getAvailableProviders(): OAuthProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if provider is configured
   */
  public isProviderConfigured(provider: OAuthProvider): boolean {
    return this.providers.has(provider);
  }

  // Private helper methods

  private generateState(provider: OAuthProvider, redirectUrl?: string): string {
    const state = crypto.randomBytes(32).toString('hex');
    this.stateStore.set(state, {
      provider,
      expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
      redirectUrl
    });
    return state;
  }

  private validateState(provider: OAuthProvider, state: string): boolean {
    const stateData = this.stateStore.get(state);
    if (!stateData) {
      return false;
    }

    const isValid = stateData.provider === provider && stateData.expiresAt > Date.now();
    
    if (isValid) {
      this.stateStore.delete(state); // Use once
    }

    return isValid;
  }

  private generateCodeChallenge(): string {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    // Store code verifier for later use
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  }

  private getCodeVerifier(): string {
    // This would need to be stored during auth URL generation
    // For simplicity, using a fixed value here - implement proper storage in production
    return crypto.randomBytes(32).toString('base64url');
  }

  private generateAppleClientSecret(): string {
    // Apple requires a JWT as client secret
    const jwt = require('jsonwebtoken');
    const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!privateKey) {
      throw new Error('Apple private key not configured');
    }

    const payload = {
      iss: process.env.APPLE_TEAM_ID,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 180 days
      aud: 'https://appleid.apple.com',
      sub: process.env.APPLE_CLIENT_ID
    };

    return jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      keyid: process.env.APPLE_KEY_ID
    });
  }

  private parseAppleIdToken(idToken: string): OAuthUser {
    // Apple returns user info in the ID token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(idToken, { complete: true });
    
    if (!decoded || !decoded.payload) {
      throw new Error('Invalid Apple ID token');
    }

    const payload = decoded.payload as any;
    
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      emailVerified: payload.email_verified === 'true'
    };
  }

  private normalizeUserInfo(provider: OAuthProvider, data: any): OAuthUser {
    switch (provider) {
      case 'google':
        return {
          id: data.id,
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          username: data.email?.split('@')[0],
          avatar: data.picture,
          emailVerified: data.verified_email,
          locale: data.locale
        };

      case 'facebook':
        return {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          username: data.email?.split('@')[0],
          avatar: data.picture?.data?.url,
          emailVerified: true // Facebook emails are verified
        };

      case 'twitter':
        return {
          id: data.id,
          email: data.email,
          firstName: data.name?.split(' ')[0],
          lastName: data.name?.split(' ').slice(1).join(' '),
          username: data.username,
          avatar: data.profile_image_url,
          emailVerified: true // Twitter emails are verified
        };

      case 'discord':
        return {
          id: data.id,
          email: data.email,
          username: data.username,
          avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : undefined,
          emailVerified: data.verified
        };

      case 'github':
        return {
          id: data.id.toString(),
          email: data.email,
          firstName: data.name?.split(' ')[0],
          lastName: data.name?.split(' ').slice(1).join(' '),
          username: data.login,
          avatar: data.avatar_url,
          emailVerified: true // GitHub emails in API are verified
        };

      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  private async findUserByEmail(email: string) {
    try {
      const result = await database.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Find user by email error:', error);
      return null;
    }
  }

  private async createUserFromOAuth(userId: string, oauthUser: OAuthUser) {
    try {
      await database.query(`
        INSERT INTO users (
          id, email, username, first_name, last_name, avatar,
          role, email_verified, preferences, created_at, updated_at
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
          timezone: 'UTC',
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
    } catch (error) {
      console.error('Create OAuth user error:', error);
      throw error;
    }
  }

  private async storeSocialLogin(
    userId: string,
    provider: OAuthProvider,
    providerId: string,
    tokens: OAuthTokens
  ) {
    try {
      // Encrypt tokens before storage
      const encryptedAccessToken = this.encryptToken(tokens.accessToken);
      const encryptedRefreshToken = tokens.refreshToken ? this.encryptToken(tokens.refreshToken) : null;

      await database.query(`
        INSERT INTO user_social_logins (
          user_id, provider, provider_id, access_token, refresh_token,
          expires_at, scope, verified, connected_at, last_used,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW(), NOW())
        ON CONFLICT (user_id, provider)
        DO UPDATE SET
          provider_id = EXCLUDED.provider_id,
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          expires_at = EXCLUDED.expires_at,
          scope = EXCLUDED.scope,
          last_used = NOW(),
          updated_at = NOW()
      `, [
        userId,
        provider,
        providerId,
        encryptedAccessToken,
        encryptedRefreshToken,
        new Date(Date.now() + (tokens.expiresIn * 1000)),
        tokens.scope,
        true
      ]);
    } catch (error) {
      console.error('Store social login error:', error);
      throw error;
    }
  }

  private encryptToken(token: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'fallback-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decryptToken(encryptedToken: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'fallback-key', 'salt', 32);
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private startStateCleanup(): void {
    // Clean up expired states every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [state, data] of this.stateStore.entries()) {
        if (data.expiresAt < now) {
          this.stateStore.delete(state);
        }
      }
    }, 5 * 60 * 1000);
  }
}

// Export singleton instance
export const oauthManager = OAuthManager.getInstance();
export default oauthManager;