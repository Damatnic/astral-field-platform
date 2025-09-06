import {
  generateMFASetup,
  generateBackupCodes,
  verifyMFAToken,
  validateMFASetup,
  removeUsedBackupCode,
  handleFailedAttempt,
  resetFailedAttempts,
  regenerateBackupCodes,
  disableMFA,
  shouldLockUser,
  calculateLockoutTime,
  isMFARequired,
  getRemainingBackupCodes,
  needsNewBackupCodes,
  formatBackupCode,
  MFA_CONFIG,
  type UserMFASettings
} from '../mfa';

// Mock otplib
jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(() => 'TESTSECRET123456'),
    keyuri: jest.fn(() => 'otpauth://totp/Test?secret=TESTSECRET123456'),
    verify: jest.fn(() => true),
    options: {}
  }
}));

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: jest.fn().mockImplementation((length) => ({
      toString: jest.fn(() => 'A'.repeat(length))
    }))
  }
});

describe('MFA Utils', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com'
  };

  const mockUserMFA: UserMFASettings = {
    isEnabled: true,
    secret: 'TESTSECRET123456',
    backupCodes: ['AAAAA', 'BBBBB', 'CCCCC'],
    lastUsedAt: new Date(),
    failedAttempts: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMFASetup', () => {
    it('should generate MFA setup with all required components', () => {
      const setup = generateMFASetup(mockUser.email, mockUser.id);

      expect(setup).toHaveProperty('secret');
      expect(setup).toHaveProperty('qrCodeUrl');
      expect(setup).toHaveProperty('backupCodes');
      expect(setup).toHaveProperty('manualEntryKey');
      expect(setup.backupCodes).toHaveLength(MFA_CONFIG.backupCodeCount);
    });

    it('should format manual entry key with spaces', () => {
      const setup = generateMFASetup(mockUser.email, mockUser.id);
      expect(setup.manualEntryKey).toContain(' ');
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate correct number of backup codes', () => {
      const codes = generateBackupCodes();
      expect(codes).toHaveLength(MFA_CONFIG.backupCodeCount);
    });

    it('should generate unique codes', () => {
      const codes = generateBackupCodes();
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should generate codes of correct length', () => {
      const codes = generateBackupCodes();
      codes.forEach(code => {
        expect(code).toHaveLength(MFA_CONFIG.backupCodeLength);
      });
    });
  });

  describe('verifyMFAToken', () => {
    it('should return invalid for disabled MFA', () => {
      const disabledMFA: UserMFASettings = { isEnabled: false };
      const result = verifyMFAToken('123456', disabledMFA);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for locked account', () => {
      const lockedMFA: UserMFASettings = {
        ...mockUserMFA,
        lockedUntil: new Date(Date.now() + 60000) // 1 minute from now
      };
      const result = verifyMFAToken('123456', lockedMFA);
      expect(result.isValid).toBe(false);
    });

    it('should verify TOTP token successfully', () => {
      const result = verifyMFAToken('123456', mockUserMFA);
      expect(result.isValid).toBe(true);
      expect(result.method).toBe('totp');
    });

    it('should verify backup code successfully', () => {
      const result = verifyMFAToken('AAAAA', mockUserMFA);
      expect(result.isValid).toBe(true);
      expect(result.method).toBe('backup');
      expect(result.usedBackupCode).toBe('AAAAA');
    });

    it('should return invalid for wrong token', () => {
      // Mock authenticator.verify to return false
      const { authenticator } = require('otplib');
      authenticator.verify.mockReturnValueOnce(false);

      const result = verifyMFAToken('wrong123', mockUserMFA);
      expect(result.isValid).toBe(false);
    });
  });

  describe('removeUsedBackupCode', () => {
    it('should remove used backup code', () => {
      const result = removeUsedBackupCode(mockUserMFA, 'AAAAA');
      expect(result.backupCodes).not.toContain('AAAAA');
      expect(result.backupCodes).toHaveLength(2);
    });

    it('should handle missing backup codes', () => {
      const mfaWithoutCodes: UserMFASettings = { isEnabled: true };
      const result = removeUsedBackupCode(mfaWithoutCodes, 'AAAAA');
      expect(result).toEqual(mfaWithoutCodes);
    });
  });

  describe('handleFailedAttempt', () => {
    it('should increment failed attempts', () => {
      const result = handleFailedAttempt(mockUserMFA);
      expect(result.failedAttempts).toBe(1);
    });

    it('should lock user after too many attempts', () => {
      const mfaWithFailures: UserMFASettings = {
        ...mockUserMFA,
        failedAttempts: 4 // One more will trigger lock
      };
      const result = handleFailedAttempt(mfaWithFailures);
      expect(result.failedAttempts).toBe(5);
      expect(result.lockedUntil).toBeDefined();
      expect(result.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('resetFailedAttempts', () => {
    it('should reset failed attempts and lockout', () => {
      const mfaWithFailures: UserMFASettings = {
        ...mockUserMFA,
        failedAttempts: 3,
        lockedUntil: new Date(Date.now() + 60000)
      };
      const result = resetFailedAttempts(mfaWithFailures);
      expect(result.failedAttempts).toBe(0);
      expect(result.lockedUntil).toBeUndefined();
      expect(result.lastUsedAt).toBeDefined();
    });
  });

  describe('disableMFA', () => {
    it('should disable MFA and clear all data', () => {
      const result = disableMFA(mockUserMFA);
      expect(result.isEnabled).toBe(false);
      expect(result.secret).toBeUndefined();
      expect(result.backupCodes).toBeUndefined();
      expect(result.failedAttempts).toBe(0);
      expect(result.lockedUntil).toBeUndefined();
    });
  });

  describe('shouldLockUser', () => {
    it('should return false for low failed attempts', () => {
      expect(shouldLockUser(2)).toBe(false);
    });

    it('should return true for high failed attempts', () => {
      expect(shouldLockUser(5)).toBe(true);
    });
  });

  describe('calculateLockoutTime', () => {
    it('should calculate progressive lockout times', () => {
      const time1 = calculateLockoutTime(5);
      const time2 = calculateLockoutTime(6);
      
      expect(time1.getTime()).toBeGreaterThan(Date.now());
      expect(time2.getTime()).toBeGreaterThan(time1.getTime());
    });

    it('should cap lockout time at maximum', () => {
      const time1 = calculateLockoutTime(10);
      const time2 = calculateLockoutTime(20);
      
      // Should be capped at 60 minutes
      expect(time2.getTime() - Date.now()).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
    });
  });

  describe('isMFARequired', () => {
    it('should return true for enabled MFA with secret', () => {
      expect(isMFARequired(mockUserMFA)).toBe(true);
    });

    it('should return false for disabled MFA', () => {
      const disabledMFA: UserMFASettings = { isEnabled: false };
      expect(isMFARequired(disabledMFA)).toBe(false);
    });

    it('should return false for enabled MFA without secret', () => {
      const mfaWithoutSecret: UserMFASettings = { isEnabled: true };
      expect(isMFARequired(mfaWithoutSecret)).toBe(false);
    });
  });

  describe('getRemainingBackupCodes', () => {
    it('should return correct count of backup codes', () => {
      expect(getRemainingBackupCodes(mockUserMFA)).toBe(3);
    });

    it('should return 0 for missing backup codes', () => {
      const mfaWithoutCodes: UserMFASettings = { isEnabled: true };
      expect(getRemainingBackupCodes(mfaWithoutCodes)).toBe(0);
    });
  });

  describe('needsNewBackupCodes', () => {
    it('should return false for sufficient backup codes', () => {
      expect(needsNewBackupCodes(mockUserMFA)).toBe(false);
    });

    it('should return true for low backup codes', () => {
      const mfaWithFewCodes: UserMFASettings = {
        ...mockUserMFA,
        backupCodes: ['AAAAA', 'BBBBB'] // Only 2 codes
      };
      expect(needsNewBackupCodes(mfaWithFewCodes)).toBe(true);
    });
  });

  describe('formatBackupCode', () => {
    it('should format code with spaces every 4 characters', () => {
      const formatted = formatBackupCode('ABCDEFGH');
      expect(formatted).toBe('ABCD EFGH');
    });

    it('should handle shorter codes', () => {
      const formatted = formatBackupCode('ABCD');
      expect(formatted).toBe('ABCD');
    });
  });

  describe('validateMFASetup', () => {
    it('should validate correct token', () => {
      const result = validateMFASetup('123456', 'TESTSECRET');
      expect(result).toBe(true);
    });

    it('should reject invalid token format', () => {
      const result = validateMFASetup('abc123', 'TESTSECRET');
      expect(result).toBe(false);
    });

    it('should reject wrong length token', () => {
      const result = validateMFASetup('12345', 'TESTSECRET');
      expect(result).toBe(false);
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should generate new backup codes', () => {
      const result = regenerateBackupCodes(mockUserMFA);
      expect(result.backupCodes).toHaveLength(MFA_CONFIG.backupCodeCount);
      expect(result.backupCodes).not.toEqual(mockUserMFA.backupCodes);
    });
  });
});