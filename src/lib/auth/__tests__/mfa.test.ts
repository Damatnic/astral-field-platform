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
    failedAttempts: 0,
    lockedUntil: null,
    lastUsed: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMFASetup', () => {
    it('should generate MFA setup with secret and QR code', () => {
      const setup = generateMFASetup(mockUser);
      
      expect(setup.secret).toBe('TESTSECRET123456');
      expect(setup.qrCodeUri).toBe('otpauth://totp/Test?secret=TESTSECRET123456');
      expect(setup.backupCodes).toHaveLength(MFA_CONFIG.BACKUP_CODE_COUNT);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate the correct number of backup codes', () => {
      const codes = generateBackupCodes();
      
      expect(codes).toHaveLength(MFA_CONFIG.BACKUP_CODE_COUNT);
      expect(codes[0]).toHaveLength(MFA_CONFIG.BACKUP_CODE_LENGTH);
    });
  });

  describe('verifyMFAToken', () => {
    it('should verify valid TOTP token', () => {
      const result = verifyMFAToken('123456', mockUserMFA);
      
      expect(result.isValid).toBe(true);
      expect(result.isBackupCode).toBe(false);
    });

    it('should verify valid backup code', () => {
      const result = verifyMFAToken('AAAAA', mockUserMFA);
      
      expect(result.isValid).toBe(true);
      expect(result.isBackupCode).toBe(true);
      expect(result.usedBackupCode).toBe('AAAAA');
    });

    it('should reject invalid token', () => {
      const { authenticator } = require('otplib');
      authenticator.verify.mockReturnValueOnce(false);
      
      const result = verifyMFAToken('invalid', mockUserMFA);
      
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateMFASetup', () => {
    it('should validate correct setup token', () => {
      const isValid = validateMFASetup('123456', 'TESTSECRET123456');
      
      expect(isValid).toBe(true);
    });
  });

  describe('shouldLockUser', () => {
    it('should lock user after max failed attempts', () => {
      const userMFA = { ...mockUserMFA, failedAttempts: MFA_CONFIG.MAX_ATTEMPTS };
      
      expect(shouldLockUser(userMFA)).toBe(true);
    });

    it('should not lock user before max attempts', () => {
      const userMFA = { ...mockUserMFA, failedAttempts: 1 };
      
      expect(shouldLockUser(userMFA)).toBe(false);
    });
  });

  describe('isMFARequired', () => {
    it('should require MFA for high-risk actions', () => {
      expect(isMFARequired('password_change')).toBe(true);
      expect(isMFARequired('account_deletion')).toBe(true);
    });

    it('should not require MFA for low-risk actions', () => {
      expect(isMFARequired('profile_view')).toBe(false);
    });
  });

  describe('formatBackupCode', () => {
    it('should format backup code correctly', () => {
      const formatted = formatBackupCode('ABCDEFGHIJ');
      
      expect(formatted).toBe('ABCDE-FGHIJ');
    });
  });
});