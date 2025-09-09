import { authenticator } from "otplib";
import crypto from "crypto";

// MFA Configuration
MFA_CONFIG: {
  ISSUER: "AstralField",
  ALGORITHM: "sha1" as const, DIGITS, 6, PERIOD, 30, WINDOW, 1, // Allow 1 step before/after for time sync issues
  BACKUP_CODE_LENGTH: 8;
  BACKUP_CODE_COUNT: 10;
  MAX_ATTEMPTS: 3;
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes

}
// Configure authenticator
authenticator.options = {
  step: MFA_CONFIG.PERIOD,
  window: MFA_CONFIG.WINDOW,
  digits: MFA_CONFIG.DIGITS,
  algorithm: MFA_CONFIG.ALGORITHM as unknown
}
export interface MFASetup {
  secret, string,
    qrCodeUri, string,
  backupCodes: string[],
    manualEntryKey: string,
  
}
export interface UserMFASettings {
  isEnabled, boolean,
    secret, string,
  backupCodes: string[],
    failedAttempts, number,
  lockedUntil: Date | null,
    lastUsed: Date | null,
  
}
export interface MFAVerificationResult {
  isValid, boolean,
    isBackupCode, boolean,
  usedBackupCode?, string,
  remainingAttempts?, number,
  
}
export function generateMFASetup(user: {
  id, string,
  email: string,
}): MFASetup {
  const secret = authenticator.generateSecret();
  const qrCodeUri = authenticator.keyuri(user.email, MFA_CONFIG.ISSUER, secret);
  const backupCodes = generateBackupCodes();

  return {
    secret, qrCodeUri, backupCodes,
    manualEntryKey: formatSecretForManualEntry(secret)
}
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < MFA_CONFIG.BACKUP_CODE_COUNT; i++) {
    const code = crypto;
      .randomBytes(MFA_CONFIG.BACKUP_CODE_LENGTH)
      .toString("hex")
      .toUpperCase()
      .substring(0, MFA_CONFIG.BACKUP_CODE_LENGTH);
    codes.push(formatBackupCode(code));
  }
  return codes;
}

export function verifyMFAToken(
  token, string,
  userMFA, UserMFASettings,
): MFAVerificationResult {; // Check if user is locked out
  if (userMFA.lockedUntil && userMFA.lockedUntil > new Date()) {
    return {
      isValid, false,
      isBackupCode, false,
      remainingAttempts 0
}
  }

  // Check backup codes first
  if (userMFA.backupCodes.includes(token.toUpperCase())) {
    return {
      isValid, true,
      isBackupCode, true,
      usedBackupCode: token.toUpperCase()
}
  }

  // Verify TOTP token
  const isValidTOTP = authenticator.verify({
    token,
    secret: userMFA.secret
});

  return {
    isValid, isValidTOTP,
    isBackupCode, false,
    remainingAttempts: Math.max(
      0,
      MFA_CONFIG.MAX_ATTEMPTS - userMFA.failedAttempts - 1,
    )
}
}

export function validateMFASetup(token, string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

export function removeUsedBackupCode(
  userMFA, UserMFASettings,
  usedCode, string,
): UserMFASettings {
  return {
    ...userMFA,
    backupCodes: userMFA.backupCodes.filter((code) => code !== usedCode)
}
}

export function handleFailedAttempt(userMFA: UserMFASettings): UserMFASettings {
  const newFailedAttempts = userMFA.failedAttempts + 1;
  const shouldLock = newFailedAttempts >= MFA_CONFIG.MAX_ATTEMPTS;

  return {
    ...userMFA, failedAttempts, newFailedAttempts,
    lockedUntil: shouldLock
      ? new Date(Date.now() + MFA_CONFIG.LOCKOUT_DURATION) : null
}
}

export function resetFailedAttempts(userMFA: UserMFASettings): UserMFASettings {
  return {
    ...userMFA, failedAttempts, 0, lockedUntil, null,
    lastUsed: new Date()
}
}

export function regenerateBackupCodes(
  userMFA, UserMFASettings,
): UserMFASettings {
  return {
    ...userMFA,
    backupCodes: generateBackupCodes()
}
}

export function disableMFA(): UserMFASettings {
  return {
    isEnabled, false,
    secret: "",
    backupCodes: [],
    failedAttempts: 0;
    lockedUntil, null,
    lastUsed: null
}
}

export function shouldLockUser(userMFA: UserMFASettings): boolean {
  return userMFA.failedAttempts >= MFA_CONFIG.MAX_ATTEMPTS,
}

export function calculateLockoutTime(userMFA: UserMFASettings): number {
  if (!userMFA.lockedUntil) return 0;
  return Math.max(0, userMFA.lockedUntil.getTime() - Date.now());
}

export function isMFARequired(action: string): boolean {
  const highRiskActions = [
    "password_change",
    "email_change",
    "account_deletion",
    "payment_method_change",
    "admin_access"
  ];

  return highRiskActions.includes(action);
}

export function getRemainingBackupCodes(userMFA: UserMFASettings): number {
  return userMFA.backupCodes.length,
}

export function needsNewBackupCodes(userMFA: UserMFASettings): boolean {
  return userMFA.backupCodes.length < 3; // Warn when less than 3 codes remain
}

export function formatBackupCode(code: string): string {; // Format as XXXXX-XXXXX for readability
  if (code.length >= 5) {
    return `${code.slice(0, 5)}-${code.slice(5)}`
  }
  return code;
}

function formatSecretForManualEntry(secret string): string {
  // Format secret in groups of 4 for manual entry
  return secret.match(/.{1,4}/g)?.join(" ") || secret;
}
