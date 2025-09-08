/**
 * Enhanced Multi-Factor Authentication System
 * Supports TOTP, SMS, Email, and Backup Codes with enterprise security features
 */

import { authenticator } from "otplib";
import crypto from "crypto";
import { database } from '@/lib/database';
import QRCode from 'qrcode';

// Enhanced MFA Configuration
export const ENHANCED_MFA_CONFIG = {
  ISSUER: "AstralField",
  ALGORITHM: "sha1" as const,
  DIGITS: 6,
  PERIOD: 30,
  WINDOW: 1,
  BACKUP_CODE_LENGTH: 8,
  BACKUP_CODE_COUNT: 10,
  MAX_ATTEMPTS: 3,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // SMS Configuration
  SMS_TOKEN_LENGTH: 6,
  SMS_TOKEN_EXPIRY: 5 * 60 * 1000, // 5 minutes
  SMS_MAX_ATTEMPTS: 3,
  
  // Email Configuration  
  EMAIL_TOKEN_LENGTH: 8,
  EMAIL_TOKEN_EXPIRY: 10 * 60 * 1000, // 10 minutes
  EMAIL_MAX_ATTEMPTS: 3,
  
  // Challenge Configuration
  CHALLENGE_EXPIRY: 5 * 60 * 1000, // 5 minutes
  MAX_CONCURRENT_CHALLENGES: 3
};

export type MFAMethod = 'totp' | 'sms' | 'email' | 'backup_codes';

export interface EnhancedMFASetup {
  totpSecret: string;
  qrCodeUri: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
  methods: MFAMethod[];
}

export interface MFAChallenge {
  id: string;
  userId: string;
  method: MFAMethod;
  token: string;
  hashedToken: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  verified: boolean;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface SMSProvider {
  sendSMS(phoneNumber: string, message: string): Promise<boolean>;
}

export interface EmailProvider {
  sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean>;
}

export interface MFAVerificationAttempt {
  challengeId: string;
  method: MFAMethod;
  token: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface MFAVerificationResult {
  success: boolean;
  method: MFAMethod;
  remainingAttempts: number;
  nextMethod?: MFAMethod;
  backupCodeUsed?: string;
  error?: string;
}

class EnhancedMFAManager {
  private static instance: EnhancedMFAManager;
  private smsProvider?: SMSProvider;
  private emailProvider?: EmailProvider;
  private challenges = new Map<string, MFAChallenge>();

  private constructor() {
    this.setupAuthenticator();
    this.startChallengeCleanup();
  }

  public static getInstance(): EnhancedMFAManager {
    if (!EnhancedMFAManager.instance) {
      EnhancedMFAManager.instance = new EnhancedMFAManager();
    }
    return EnhancedMFAManager.instance;
  }

  public setSMSProvider(provider: SMSProvider): void {
    this.smsProvider = provider;
  }

  public setEmailProvider(provider: EmailProvider): void {
    this.emailProvider = provider;
  }

  private setupAuthenticator(): void {
    authenticator.options = {
      step: ENHANCED_MFA_CONFIG.PERIOD,
      window: ENHANCED_MFA_CONFIG.WINDOW,
      digits: ENHANCED_MFA_CONFIG.DIGITS,
      algorithm: ENHANCED_MFA_CONFIG.ALGORITHM as any,
    };
  }

  /**
   * Generate comprehensive MFA setup for user
   */
  public async generateMFASetup(user: {
    id: string;
    email: string;
    phoneNumber?: string;
  }): Promise<EnhancedMFASetup> {
    try {
      const totpSecret = authenticator.generateSecret();
      const qrCodeUri = authenticator.keyuri(
        user.email,
        ENHANCED_MFA_CONFIG.ISSUER,
        totpSecret
      );

      // Generate QR code data URL for display
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUri, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });

      const backupCodes = this.generateBackupCodes();
      const availableMethods: MFAMethod[] = ['totp', 'backup_codes'];

      // Add SMS if phone number is available and provider is configured
      if (user.phoneNumber && this.smsProvider) {
        availableMethods.push('sms');
      }

      // Email is always available
      if (this.emailProvider) {
        availableMethods.push('email');
      }

      return {
        totpSecret,
        qrCodeUri,
        qrCodeDataUrl,
        backupCodes,
        manualEntryKey: this.formatSecretForManualEntry(totpSecret),
        methods: availableMethods
      };
    } catch (error) {
      console.error('MFA setup generation error:', error);
      throw new Error('Failed to generate MFA setup');
    }
  }

  /**
   * Create MFA challenge for authentication
   */
  public async createMFAChallenge(
    userId: string,
    preferredMethod: MFAMethod,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Check for existing active challenges
      await this.cleanupUserChallenges(userId);

      const challengeId = crypto.randomUUID();
      let token = '';
      let hashedToken = '';
      let maxAttempts = ENHANCED_MFA_CONFIG.MAX_ATTEMPTS;

      switch (preferredMethod) {
        case 'sms':
          token = this.generateNumericToken(ENHANCED_MFA_CONFIG.SMS_TOKEN_LENGTH);
          hashedToken = this.hashToken(token);
          maxAttempts = ENHANCED_MFA_CONFIG.SMS_MAX_ATTEMPTS;
          break;

        case 'email':
          token = this.generateAlphanumericToken(ENHANCED_MFA_CONFIG.EMAIL_TOKEN_LENGTH);
          hashedToken = this.hashToken(token);
          maxAttempts = ENHANCED_MFA_CONFIG.EMAIL_MAX_ATTEMPTS;
          break;

        case 'totp':
        case 'backup_codes':
          // No token generation needed for TOTP/backup codes
          break;

        default:
          throw new Error(`Unsupported MFA method: ${preferredMethod}`);
      }

      const challenge: MFAChallenge = {
        id: challengeId,
        userId,
        method: preferredMethod,
        token,
        hashedToken,
        attempts: 0,
        maxAttempts,
        expiresAt: new Date(Date.now() + ENHANCED_MFA_CONFIG.CHALLENGE_EXPIRY),
        verified: false,
        metadata,
        createdAt: new Date()
      };

      this.challenges.set(challengeId, challenge);

      // Send token if applicable
      await this.sendMFAToken(userId, preferredMethod, token);

      // Store challenge in database
      await this.storeMFAChallenge(challenge);

      console.log(`🔐 MFA challenge created: ${challengeId} (${preferredMethod})`);
      return challengeId;
    } catch (error) {
      console.error('MFA challenge creation error:', error);
      throw error;
    }
  }

  /**
   * Verify MFA challenge
   */
  public async verifyMFAChallenge(attempt: MFAVerificationAttempt): Promise<MFAVerificationResult> {
    try {
      const challenge = this.challenges.get(attempt.challengeId);
      if (!challenge) {
        return {
          success: false,
          method: attempt.method,
          remainingAttempts: 0,
          error: 'Challenge not found or expired'
        };
      }

      // Check if challenge has expired
      if (challenge.expiresAt < new Date()) {
        this.challenges.delete(attempt.challengeId);
        return {
          success: false,
          method: challenge.method,
          remainingAttempts: 0,
          error: 'Challenge has expired'
        };
      }

      // Check if max attempts exceeded
      if (challenge.attempts >= challenge.maxAttempts) {
        return {
          success: false,
          method: challenge.method,
          remainingAttempts: 0,
          error: 'Maximum attempts exceeded'
        };
      }

      challenge.attempts++;

      let isValid = false;
      let backupCodeUsed: string | undefined;

      switch (challenge.method) {
        case 'totp':
          isValid = await this.verifyTOTPToken(challenge.userId, attempt.token);
          break;

        case 'sms':
        case 'email':
          isValid = this.hashToken(attempt.token) === challenge.hashedToken;
          break;

        case 'backup_codes':
          const backupResult = await this.verifyBackupCode(challenge.userId, attempt.token);
          isValid = backupResult.isValid;
          backupCodeUsed = backupResult.usedCode;
          break;

        default:
          throw new Error(`Unsupported MFA method: ${challenge.method}`);
      }

      const remainingAttempts = Math.max(0, challenge.maxAttempts - challenge.attempts);

      if (isValid) {
        challenge.verified = true;
        this.challenges.delete(attempt.challengeId);

        // Log successful verification
        await this.logMFAEvent(challenge.userId, 'mfa_verification_success', {
          method: challenge.method,
          challengeId: attempt.challengeId,
          userAgent: attempt.userAgent,
          ipAddress: attempt.ipAddress
        });

        // Remove used backup code if applicable
        if (backupCodeUsed) {
          await this.removeBackupCode(challenge.userId, backupCodeUsed);
        }

        return {
          success: true,
          method: challenge.method,
          remainingAttempts,
          backupCodeUsed
        };
      } else {
        // Log failed verification
        await this.logMFAEvent(challenge.userId, 'mfa_verification_failed', {
          method: challenge.method,
          challengeId: attempt.challengeId,
          attempts: challenge.attempts,
          userAgent: attempt.userAgent,
          ipAddress: attempt.ipAddress
        });

        return {
          success: false,
          method: challenge.method,
          remainingAttempts,
          error: 'Invalid verification code'
        };
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      return {
        success: false,
        method: attempt.method,
        remainingAttempts: 0,
        error: 'Verification failed'
      };
    }
  }

  /**
   * Enable MFA for user
   */
  public async enableMFA(
    userId: string,
    totpSecret: string,
    verificationToken: string,
    backupCodes: string[],
    phoneNumber?: string
  ): Promise<boolean> {
    try {
      // Verify TOTP token first
      const isValidTOTP = authenticator.verify({
        token: verificationToken,
        secret: totpSecret
      });

      if (!isValidTOTP) {
        return false;
      }

      // Encrypt sensitive data
      const encryptedSecret = this.encryptData(totpSecret);
      const encryptedBackupCodes = backupCodes.map(code => this.encryptData(code));

      // Update user MFA settings
      await database.query(`
        UPDATE users 
        SET 
          mfa_enabled = true,
          mfa_secret = $1,
          mfa_backup_codes = $2,
          phone_number = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [
        encryptedSecret,
        JSON.stringify(encryptedBackupCodes),
        phoneNumber,
        userId
      ]);

      // Log MFA enablement
      await this.logMFAEvent(userId, 'mfa_enabled', {
        methods: ['totp', 'backup_codes', ...(phoneNumber ? ['sms'] : []), 'email']
      });

      console.log(`🔐 MFA enabled for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('MFA enable error:', error);
      return false;
    }
  }

  /**
   * Disable MFA for user
   */
  public async disableMFA(userId: string, verificationToken: string): Promise<boolean> {
    try {
      // Verify current MFA token
      const isValid = await this.verifyTOTPToken(userId, verificationToken);
      if (!isValid) {
        return false;
      }

      // Update user settings
      await database.query(`
        UPDATE users 
        SET 
          mfa_enabled = false,
          mfa_secret = NULL,
          mfa_backup_codes = NULL,
          updated_at = NOW()
        WHERE id = $1
      `, [userId]);

      // Revoke all active sessions to force re-authentication
      await database.query(`
        UPDATE user_sessions SET is_active = false WHERE user_id = $1
      `, [userId]);

      // Log MFA disablement
      await this.logMFAEvent(userId, 'mfa_disabled', {});

      console.log(`🔐 MFA disabled for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('MFA disable error:', error);
      return false;
    }
  }

  /**
   * Generate new backup codes
   */
  public async regenerateBackupCodes(userId: string, verificationToken: string): Promise<string[] | null> {
    try {
      // Verify current MFA token
      const isValid = await this.verifyTOTPToken(userId, verificationToken);
      if (!isValid) {
        return null;
      }

      const newBackupCodes = this.generateBackupCodes();
      const encryptedBackupCodes = newBackupCodes.map(code => this.encryptData(code));

      await database.query(`
        UPDATE users 
        SET mfa_backup_codes = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(encryptedBackupCodes), userId]);

      // Log backup codes regeneration
      await this.logMFAEvent(userId, 'backup_codes_regenerated', {
        codesCount: newBackupCodes.length
      });

      return newBackupCodes;
    } catch (error) {
      console.error('Backup codes regeneration error:', error);
      return null;
    }
  }

  /**
   * Get user MFA status
   */
  public async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    methods: MFAMethod[];
    backupCodesRemaining: number;
  }> {
    try {
      const result = await database.query(`
        SELECT mfa_enabled, mfa_backup_codes, phone_number
        FROM users WHERE id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      const methods: MFAMethod[] = [];
      let backupCodesRemaining = 0;

      if (user.mfa_enabled) {
        methods.push('totp');

        if (user.mfa_backup_codes) {
          const encryptedCodes = JSON.parse(user.mfa_backup_codes);
          backupCodesRemaining = encryptedCodes.length;
          if (backupCodesRemaining > 0) {
            methods.push('backup_codes');
          }
        }

        if (user.phone_number && this.smsProvider) {
          methods.push('sms');
        }

        if (this.emailProvider) {
          methods.push('email');
        }
      }

      return {
        enabled: user.mfa_enabled,
        methods,
        backupCodesRemaining
      };
    } catch (error) {
      console.error('Get MFA status error:', error);
      return {
        enabled: false,
        methods: [],
        backupCodesRemaining: 0
      };
    }
  }

  // Private helper methods

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < ENHANCED_MFA_CONFIG.BACKUP_CODE_COUNT; i++) {
      const code = crypto
        .randomBytes(ENHANCED_MFA_CONFIG.BACKUP_CODE_LENGTH)
        .toString('hex')
        .toUpperCase()
        .substring(0, ENHANCED_MFA_CONFIG.BACKUP_CODE_LENGTH);
      codes.push(this.formatBackupCode(code));
    }
    return codes;
  }

  private formatBackupCode(code: string): string {
    if (code.length >= 4) {
      return `${code.slice(0, 4)}-${code.slice(4)}`;
    }
    return code;
  }

  private formatSecretForManualEntry(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(" ") || secret;
  }

  private generateNumericToken(length: number): string {
    let token = '';
    for (let i = 0; i < length; i++) {
      token += Math.floor(Math.random() * 10);
    }
    return token;
  }

  private generateAlphanumericToken(length: number): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async verifyTOTPToken(userId: string, token: string): Promise<boolean> {
    try {
      const result = await database.query(`
        SELECT mfa_secret FROM users WHERE id = $1 AND mfa_enabled = true
      `, [userId]);

      if (result.rows.length === 0) {
        return false;
      }

      const encryptedSecret = result.rows[0].mfa_secret;
      if (!encryptedSecret) {
        return false;
      }

      const secret = this.decryptData(encryptedSecret);
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  private async verifyBackupCode(userId: string, code: string): Promise<{
    isValid: boolean;
    usedCode?: string;
  }> {
    try {
      const result = await database.query(`
        SELECT mfa_backup_codes FROM users WHERE id = $1 AND mfa_enabled = true
      `, [userId]);

      if (result.rows.length === 0) {
        return { isValid: false };
      }

      const encryptedCodes = JSON.parse(result.rows[0].mfa_backup_codes || '[]');
      const formattedCode = this.formatBackupCode(code.toUpperCase());

      for (const encryptedCode of encryptedCodes) {
        const decryptedCode = this.decryptData(encryptedCode);
        if (decryptedCode === formattedCode) {
          return { isValid: true, usedCode: formattedCode };
        }
      }

      return { isValid: false };
    } catch (error) {
      console.error('Backup code verification error:', error);
      return { isValid: false };
    }
  }

  private async removeBackupCode(userId: string, usedCode: string): Promise<void> {
    try {
      const result = await database.query(`
        SELECT mfa_backup_codes FROM users WHERE id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return;
      }

      const encryptedCodes = JSON.parse(result.rows[0].mfa_backup_codes || '[]');
      const updatedCodes = encryptedCodes.filter((encryptedCode: string) => {
        const decryptedCode = this.decryptData(encryptedCode);
        return decryptedCode !== usedCode;
      });

      await database.query(`
        UPDATE users SET mfa_backup_codes = $1 WHERE id = $2
      `, [JSON.stringify(updatedCodes), userId]);
    } catch (error) {
      console.error('Remove backup code error:', error);
    }
  }

  private async sendMFAToken(userId: string, method: MFAMethod, token: string): Promise<void> {
    try {
      const userResult = await database.query(`
        SELECT email, phone_number, first_name FROM users WHERE id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      switch (method) {
        case 'sms':
          if (user.phone_number && this.smsProvider) {
            const message = `Your AstralField verification code is: ${token}. Valid for 5 minutes.`;
            await this.smsProvider.sendSMS(user.phone_number, message);
          }
          break;

        case 'email':
          if (this.emailProvider) {
            const subject = 'AstralField - Verification Code';
            const html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">AstralField Verification</h2>
                <p>Hello ${user.first_name || 'User'},</p>
                <p>Your verification code is:</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
                  <h1 style="font-family: monospace; font-size: 36px; color: #1f2937; margin: 0;">${token}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 12px;">
                  This is an automated message from AstralField. Please do not reply.
                </p>
              </div>
            `;
            const text = `Your AstralField verification code is: ${token}. Valid for 10 minutes.`;
            await this.emailProvider.sendEmail(user.email, subject, html, text);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${method} token:`, error);
    }
  }

  private encryptData(data: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decryptData(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private async storeMFAChallenge(challenge: MFAChallenge): Promise<void> {
    try {
      await database.query(`
        INSERT INTO mfa_challenges (
          id, user_id, method, token_hash, attempts, max_attempts,
          expires_at, verified, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        challenge.id,
        challenge.userId,
        challenge.method,
        challenge.hashedToken,
        challenge.attempts,
        challenge.maxAttempts,
        challenge.expiresAt,
        challenge.verified,
        JSON.stringify(challenge.metadata),
        challenge.createdAt
      ]);
    } catch (error) {
      // Table might not exist yet, that's okay
      console.warn('Could not store MFA challenge in database:', error);
    }
  }

  private async cleanupUserChallenges(userId: string): Promise<void> {
    // Remove expired challenges for user
    for (const [challengeId, challenge] of this.challenges.entries()) {
      if (challenge.userId === userId && (challenge.expiresAt < new Date() || challenge.verified)) {
        this.challenges.delete(challengeId);
      }
    }

    // Limit concurrent challenges per user
    const userChallenges = Array.from(this.challenges.values()).filter(c => c.userId === userId);
    if (userChallenges.length >= ENHANCED_MFA_CONFIG.MAX_CONCURRENT_CHALLENGES) {
      // Remove oldest challenge
      userChallenges.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      this.challenges.delete(userChallenges[0].id);
    }
  }

  private startChallengeCleanup(): void {
    // Clean up expired challenges every minute
    setInterval(() => {
      const now = new Date();
      for (const [challengeId, challenge] of this.challenges.entries()) {
        if (challenge.expiresAt < now) {
          this.challenges.delete(challengeId);
        }
      }
    }, 60 * 1000);
  }

  private async logMFAEvent(userId: string, eventType: string, metadata: any): Promise<void> {
    try {
      await database.query(`
        INSERT INTO security_events (
          user_id, event_type, event_category, severity, description, metadata, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        userId,
        eventType,
        'authentication',
        'medium',
        `MFA ${eventType.replace('mfa_', '').replace('_', ' ')}`,
        JSON.stringify(metadata)
      ]);
    } catch (error) {
      // Table might not exist yet, that's okay
      console.warn('Could not log MFA event:', error);
    }
  }
}

// Default SMS Provider using console (replace with actual SMS service)
export class ConsoleSMSProvider implements SMSProvider {
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    console.log(`📱 SMS to ${phoneNumber}: ${message}`);
    return true;
  }
}

// Default Email Provider using console (replace with actual email service)
export class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    console.log(`📧 Email to ${to}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text || 'No text version'}`);
    return true;
  }
}

// Export singleton instance
export const enhancedMFA = EnhancedMFAManager.getInstance();

// Initialize default providers (replace in production)
enhancedMFA.setSMSProvider(new ConsoleSMSProvider());
enhancedMFA.setEmailProvider(new ConsoleEmailProvider());

export default enhancedMFA;