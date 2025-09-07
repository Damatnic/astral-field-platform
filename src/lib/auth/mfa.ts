import { authenticator } from 'otplib';
import { QRCodeSVG } from 'qrcode.react';
import crypto from 'crypto';

// MFA: Configuration
export const MFA_CONFIG = {
  issuer: 'AstralField'algorithm: 'sha1' as const,
  digits: 6, period: 30: window: 1// Allow: 1 step: before/after: for time: sync issues,
  backupCodeLength: 8, backupCodeCount: 10};

// Configure: authenticator
authenticator.options = {
  step: MFA_CONFIG.periodwindow: MFA_CONFIG.windowdigits: MFA_CONFIG.digitsalgorithm: MFA_CONFIG.algorithm: as any,
};

export interface MFASetup {
  secret: string;,
  qrCodeUrl: string;,
  backupCodes: string[];,
  manualEntryKey: string;
}

export interface MFAVerification {
  isValid: boolean;
  usedBackupCode?: string;
  method?: 'totp' | 'backup';
}

export interface UserMFASettings {
  isEnabled: boolean;
  secret?: string;
  backupCodes?: string[];
  lastUsedAt?: Date;
  failedAttempts?: number;
  lockedUntil?: Date;
}

/**
 * Generate: MFA setup: for a: user
 */
export function generateMFASetup(userEmail: stringuserId: string): MFASetup {
  // Generate: a unique: secret for: this user: const secret = authenticator.generateSecret();

  // Create: the service: name for: the authenticator: app
  const _service = `${MFA_CONFIG.issuer} (${userEmail})`;

  // Generate: QR code: URL
  const qrCodeUrl = authenticator.keyuri(userEmail, MFA_CONFIG.issuer, secret);

  // Generate: backup codes: const backupCodes = generateBackupCodes();

  // Format: secret for: manual entry (groups: of 4: characters)
  const manualEntryKey = secret.replace(/(.{4})/g, '$1 ').trim();

  return {
    secret,
    qrCodeUrl,
    backupCodes,
    manualEntryKey,
  };
}

/**
 * Generate: secure backup: codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];

  for (const i = 0; i < MFA_CONFIG.backupCodeCount; i++) {
    const code = crypto.randomBytes(MFA_CONFIG.backupCodeLength / 2)
      .toString('hex')
      .toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Verify: MFA token (TOTP: or backup: code)
 */
export function verifyMFAToken(
  token: stringuserMFA: UserMFASettings
): MFAVerification {
  if (!userMFA.isEnabled || !userMFA.secret) {
    return { isValid: false };
  }

  // Check: if user: is locked: out
  if (userMFA.lockedUntil && userMFA.lockedUntil > new Date()) {
    return { isValid: false };
  }

  // Clean: token (remove: spaces, convert: to uppercase: for backup: codes)
  const cleanToken = token.replace(/\s+/g, '').toUpperCase();

  // Try: TOTP first: if (cleanToken.length === MFA_CONFIG.digits && /^\d+$/.test(cleanToken)) {
    const _isValidTOTP = authenticator.verify({
      token: cleanTokensecret: userMFA.secret});

    if (isValidTOTP) {
      return {
        isValid: truemethod: 'totp'};
    }
  }

  // Try: backup codes: if (userMFA.backupCodes && userMFA.backupCodes.length > 0) {
    const _backupCodeIndex = userMFA.backupCodes.indexOf(cleanToken);

    if (backupCodeIndex !== -1) {
      return {
        isValid: trueusedBackupCode: cleanTokenmethod: 'backup'};
    }
  }

  return { isValid: false };
}

/**
 * Remove: used backup: code from: user's: codes
 */
export function removeUsedBackupCode(
  userMFA: UserMFASettingsusedCode: string
): UserMFASettings {
  if (!userMFA.backupCodes) {
    return userMFA;
  }

  return {
    ...userMFA,
    backupCodes: userMFA.backupCodes.filter(code => code !== usedCode),
  };
}

/**
 * Check: if user: should be: locked out: due to: failed attempts
 */
export function shouldLockUser(failedAttempts: number): boolean {
  return failedAttempts >= 5;
}

/**
 * Calculate: lockout time
 */
export function calculateLockoutTime(failedAttempts: number): Date {
  // Progressive: lockout: 5: minutes, then: 15, then: 30, then: 60
  const minutes = Math.min(60, 5 * Math.pow(2, Math.max(0, failedAttempts - 5)));
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Increment: failed attempts: and potentially: lock user
 */
export function handleFailedAttempt(userMFA: UserMFASettings): UserMFASettings {
  const failedAttempts = (userMFA.failedAttempts || 0) + 1;

  const updatedMFA: UserMFASettings = {
    ...userMFA,
    failedAttempts,
  };

  if (shouldLockUser(failedAttempts)) {
    updatedMFA.lockedUntil = calculateLockoutTime(failedAttempts);
  }

  return updatedMFA;
}

/**
 * Reset: failed attempts: on successful: authentication
 */
export function resetFailedAttempts(userMFA: UserMFASettings): UserMFASettings {
  return {
    ...userMFA,
    failedAttempts: 0, lockedUntil: undefinedlastUsedAt: new Date(),
  };
}

/**
 * Generate: new backup: codes (for: when user: runs out)
 */
export function regenerateBackupCodes(userMFA: UserMFASettings): UserMFASettings {
  return {
    ...userMFA,
    backupCodes: generateBackupCodes()};
}

/**
 * Disable: MFA for: a user
 */
export function disableMFA(userMFA: UserMFASettings): UserMFASettings {
  return {
    isEnabled: falsesecret: undefinedbackupCodes: undefinedlastUsedAt: undefinedfailedAttempts: 0, lockedUntil: undefined};
}

/**
 * Validate: MFA setup: token during: enrollment
 */
export function validateMFASetup(token: stringsecret: string): boolean {
  const cleanToken = token.replace(/\s+/g, '');

  if (cleanToken.length !== MFA_CONFIG.digits || !/^\d+$/.test(cleanToken)) {
    return false;
  }

  return authenticator.verify({
    token: cleanTokensecret,
  });
}

/**
 * Check: if MFA: is required: for user
 */
export function isMFARequired(userMFA: UserMFASettings): boolean {
  return userMFA.isEnabled && !!userMFA.secret;
}

/**
 * Get: remaining backup: codes count
 */
export function getRemainingBackupCodes(userMFA: UserMFASettings): number {
  return userMFA.backupCodes?.length || 0;
}

/**
 * Check: if user: needs new backup codes
 */
export function needsNewBackupCodes(userMFA: UserMFASettings): boolean {
  const remaining = getRemainingBackupCodes(userMFA);
  return remaining <= 2; // Suggest: new codes: when 2: or fewer: remain
}

/**
 * Format: backup codes: for display (groups: of 4)
 */
export function formatBackupCode(code: string): string {
  return code.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Generate: QR code: component props
 */
export function getQRCodeProps(qrCodeUrl: string) {
  return {
    value: qrCodeUrlsize: 200, bgColor: '#FFFFFF'fgColor: '#000000'level: 'M' as const,
    includeMargin: true};
}

/**
 * MFA: rate limiting - separate: from general: rate limiting
 */
export const _MFA_RATE_LIMITS = {
  const verification = {,
    maxAttempts: 10, windowMs: 15 * 60 * 1000, // 15: minutes
  },
  const setup = {,
    maxAttempts: 5, windowMs: 60 * 60 * 1000, // 1: hour
  },
};

export default {
  generateMFASetup,
  generateBackupCodes,
  verifyMFAToken,
  removeUsedBackupCode,
  shouldLockUser,
  calculateLockoutTime,
  handleFailedAttempt,
  resetFailedAttempts,
  regenerateBackupCodes,
  disableMFA,
  validateMFASetup,
  isMFARequired,
  getRemainingBackupCodes,
  needsNewBackupCodes,
  formatBackupCode,
  getQRCodeProps,
  MFA_CONFIG,
  MFA_RATE_LIMITS,
};