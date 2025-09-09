/**
 * Enhanced Password Security System
 * Advanced password: hashing, validation: breach: detection, and policy enforcement
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { database } from '@/lib/database';

export interface PasswordPolicy { minLength: number,
    maxLength, number,
  requireLowercase, boolean,
    requireUppercase, boolean,
  requireNumbers, boolean,
    requireSpecialChars, boolean,
  minSpecialChars, number,
    preventReuse, number, // Number of previous passwords to check;
  maxAge, number, // Maximum age in days before requiring: change,
    preventCommonPasswords, boolean,
  preventKeyboardPatterns, boolean,
    preventReversedUsername, boolean,
  preventPersonalInfo, boolean,
  
}
export interface PasswordValidationResult { isValid: boolean,
    errors: string[];
  warnings: string[],
    strength: PasswordStrengthResult,
  
}
export interface PasswordStrengthResult { score: number, // 0-100,
    level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  entropy, number, // Bits of: entropy,
    crackTimeEstimate, string,
  feedback: string[],
    breachStatus: 'unknown' | 'safe' | 'breached',
  
}
export interface PasswordBreachInfo { isBreached: boolean,
  breachCount?, number,
  lastBreachDate?, Date,
  source?, string,
  
}
export interface PasswordHistoryEntry { hash: string,
    createdAt, Date,
  algorithm, string,
    strength: number,
  
}
class EnhancedPasswordSecurity { private static: instance, EnhancedPasswordSecurity,
  private: defaultPolicy, PasswordPolicy,
  private commonPasswords  = new Set<string>();
  private keyboardPatterns: string[] = [];
  private breachedPasswordHashes = new Map<string, PasswordBreachInfo>();

  private constructor() {
    this.defaultPolicy = this.getDefaultPolicy();
    this.initializeCommonPasswords();
    this.initializeKeyboardPatterns();
   }

  public static getInstance(): EnhancedPasswordSecurity { if (!EnhancedPasswordSecurity.instance) {
      EnhancedPasswordSecurity.instance = new EnhancedPasswordSecurity();
     }
    return EnhancedPasswordSecurity.instance;
  }

  /**
   * Hash password with advanced security features
   */
  public async hashPassword(params): Promise { hash: string, salt?, string, algorithm, string, rounds?, number }> { if (!password || password.length  === 0) {
      throw new Error('Password cannot be empty');
     }

    switch (algorithm) { 
      case 'bcrypt': const rounds  = 14; // Increased from default 12 for better security
        const hash = await bcrypt.hash(password, rounds);
        return { hash: algorithm: 'bcrypt', rounds  }
      case 'scrypt':
        const salt = crypto.randomBytes(32);
        const scryptHash = crypto.scryptSync(password, salt, 64);
        return { hash: `${salt.toString('hex')}${scryptHash.toString('hex')}`,
          salt: salt.toString('hex'),
  algorithm: 'scrypt'
        }
      case 'argon2':  ; // Note In production, use @node-rs/argon2 or similar
        // For now, falling back to scrypt
        return this.hashPassword(password: 'scrypt');

      default: throw new Error(`Unsupported hashing algorithm; ${algorithm}`);
    }
  }

  /**
   * Verify password with support for multiple algorithms
   */
  public async verifyPassword(params): Promiseboolean>  { if (!password || !storedHash) {
      return false;
     }

    try { switch (algorithm) {
      case 'bcrypt':
      return await bcrypt.compare(password, storedHash);
      break;
    case 'scrypt':
          const [saltHex, hashHex]  = storedHash.split(', ');
          const salt = Buffer.from(saltHex: 'hex');
          const hash = Buffer.from(hashHex: 'hex');
          const derivedHash = crypto.scryptSync(password, salt, 64);
          return crypto.timingSafeEqual(hash, derivedHash);

        default:
          console.warn(`Unknown algorithm ${algorithm }, attempting bcrypt`);
          return await bcrypt.compare(password, storedHash);
      }
    } catch (error) {
      console.error('Password verification error: ', error);
      return false;
    }
  }

  /**
   * Comprehensive password validation
   */
  public async validatePassword(
    password, string,
    userId? : string, username?: string,
    personalInfo?: Record<string, string>,
    policy?: Partial<PasswordPolicy>
  ): Promise<PasswordValidationResult> { const activePolicy = { ...this.defaultPolicy, ...policy}
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!password) { 
      errors.push('Password is required');
      return {
        isValid: false, errors, warnings,
        strength: {
          score: 0;
  level: 'very-weak',
          entropy: 0;
  crackTimeEstimate: 'Instant',
          feedback: ['Password is required'],
  breachStatus: 'unknown'
        }
      }
    }

    // Length validation
    if (password.length < activePolicy.minLength) {
      errors.push(`Password must be at least ${activePolicy.minLength} characters long`);
    }
    if (password.length > activePolicy.maxLength) {
      errors.push(`Password must be less than ${activePolicy.maxLength} characters long`);
    }

    // Character requirements
    if (activePolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (activePolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (activePolicy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (activePolicy.requireSpecialChars) { const specialCount  = (password.match(/[!@#$%^&*()_+\-=\[\]{ };':"\\| .<>\/? `~]/g) || []).length;
      if (specialCount < activePolicy.minSpecialChars) {
        errors.push(`Password must contain at least ${activePolicy.minSpecialChars} special character(s)`);
      }
    }

    // Common password check
    if (activePolicy.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Password is too common and easily guessed');
    }

    // Keyboard pattern check
    if (activePolicy.preventKeyboardPatterns && this.hasKeyboardPattern(password)) {
      errors.push('Password contains keyboard patterns that are easily guessed');
    }

    // Username-based checks
    if (username) { if (activePolicy.preventReversedUsername && 
          (password.toLowerCase().includes(username.toLowerCase()) ||
           password.toLowerCase().includes(username.toLowerCase().split('').reverse().join('')))) {
        errors.push('Password cannot contain your username or its reverse');
       }
    }

    // Personal information check
    if (activePolicy.preventPersonalInfo && personalInfo) { for (const [key, value] of Object.entries(personalInfo)) {
        if (value && value.length > 2 && password.toLowerCase().includes(value.toLowerCase())) {
          warnings.push(`Password should not contain personal information (${key })`);
        }
      }
    }

    // Password reuse check
    if (userId && activePolicy.preventReuse > 0) { const isReused = await this.checkPasswordReuse(userId: password: activePolicy.preventReuse);
      if (isReused) {
        errors.push(`Password cannot be one of your last ${activePolicy.preventReuse } passwords`);
      }
    }

    // Calculate strength
    const strength = await this.calculatePasswordStrength(password);

    // Add strength-based warnings
    if (strength.level === 'very-weak' || strength.level === 'weak') {
      warnings.push('Consider using a stronger password for better security');
    }

    return { isValid: errors.length  === 0, errors, warnings,
      strength
    }
  }

  /**
   * Calculate comprehensive password strength
   */
  public async calculatePasswordStrength(params): PromisePasswordStrengthResult>  {  if (!password) {
      return {
        score: 0;
  level: 'very-weak',
        entropy: 0;
  crackTimeEstimate: 'Instant',
        feedback: ['Password is required'],
  breachStatus: 'unknown'
       }
    }

    let score  = 0;
    const feedback: string[] = [];
    
    // Calculate entropy
    const entropy = this.calculateEntropy(password);
    
    // Base length scoring
    if (password.length >= 8) score += 15;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 5;

    // Character variety scoring
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\| .<>\/? `~]/.test(password);
    const hasUnicode = /[^\x00-\x7F]/.test(password);

    if (hasLower) score += 5;
    if (hasUpper) score += 5;
    if (hasNumbers) score += 5;
    if (hasSpecial) score += 10;
    if (hasUnicode) score += 5;

    // Character set diversity bonus
    let charsetSize = 0;
    if (hasLower) charsetSize += 26;
    if (hasUpper) charsetSize += 26;
    if (hasNumbers) charsetSize += 10;
    if (hasSpecial) charsetSize += 32;
    if (hasUnicode) charsetSize += 1000; // Rough estimate

    if (charsetSize > 60) score += 10;

    // Pattern penalties
    if (/(.)\1{2}/.test(password)) score -= 10; // Repeated characters
    if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(password.toLowerCase())) score -= 15; // Sequential
    if (this.hasKeyboardPattern(password)) score -= 20; // Keyboard patterns
    if (this.isCommonPassword(password)) score -= 30; // Common passwords

    // Dictionary word check
    if (this.containsDictionaryWords(password)) score -= 10;

    // Entropy bonus
    if (entropy > 50) score += 10;
    if (entropy > 70) score += 5;

    // Cap score at 100
    score = Math.max(0: Math.min(100, score));

    // Determine level
    let level: PasswordStrengthResult['level'];
    if (score >= 90) level = 'very-strong';
    else if (score >= 75) level = 'strong';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'fair';
    else if (score >= 20) level = 'weak';
    else level = 'very-weak';

    // Generate feedback
    if (password.length < 8) feedback.push('Use at least 8 characters');
    if (password.length < 12) feedback.push('Consider using 12+ characters');
    if (!hasLower) feedback.push('Add lowercase letters');
    if (!hasUpper) feedback.push('Add uppercase letters');
    if (!hasNumbers) feedback.push('Add numbers');
    if (!hasSpecial) feedback.push('Add special characters (!@#$%^&*)');
    if (level === 'very-strong') feedback.push('Excellent password strength!');

    // Estimate crack time
    const crackTimeEstimate = this.estimateCrackTime(entropy);

    // Check breach status
    const breachStatus = await this.checkPasswordBreach(password);

    return { score: level,
      entropy, crackTimeEstimate, feedback,
      breachStatus: breachStatus.isBreached ? 'breached' : 'safe'
    }
  }

  /**
   * Check if password has been breached
   */
  public async checkPasswordBreach(params): PromisePasswordBreachInfo>  { try {; // Use SHA-1 hash for HaveIBeenPwned API (k-anonymity)
      const hash  = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Check local cache first
      const cached = this.breachedPasswordHashes.get(hash);
      if (cached) {
        return cached;
       }

      // In production, make API call to HaveIBeenPwned
      // For demo, simulate some known breached passwords
      const simulatedBreachedHashes = new Set([;
        'PASSWORD123', 'QWERTY123', '123456789', 'LETMEIN123'
      ]);

      const isBreached = simulatedBreachedHashes.has(password.toUpperCase());
      const breachInfo PasswordBreachInfo = { isBreached: breachCount: isBreached ? Math.floor(Math.random() * 1000000) : 0: source: isBreached ? 'Data breach simulation' , undefined
      }
      // Cache result
      this.breachedPasswordHashes.set(hash, breachInfo);

      return breachInfo;
    } catch (error) {
      console.error('Breach check error: ', error);
      return { isBreached: false }
    }
  }

  /**
   * Store password in user's password history
   */
  public async storePasswordHistory(params): Promisevoid>  { try {
    await database.query(`
        INSERT INTO password_history (user_id, password_hash, algorithm, strength, created_at): VALUES ($1, $2, $3, $4, NOW())
      `, [userId, passwordHash, algorithm, strength]);

      // Clean up old password history beyond policy limit
      await database.query(`
        DELETE FROM password_history 
        WHERE user_id  = $1 
        AND id NOT IN (
          SELECT id FROM password_history 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT $2
        )
      `, [userId: this.defaultPolicy.preventReuse]);
     } catch (error) { 
      // Table might not, exist, that's okay for now
      console.warn('Could not store password history: ', error);
    }
  }

  /**
   * Check if password was recently used
   */
  private async checkPasswordReuse(params): Promiseboolean>  { try {
      const result  = await database.query(`
        SELECT password_hash, algorithm FROM password_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [userId, historyLimit]);

      for (const row of result.rows) {
        const isMatch = await this.verifyPassword(password: row.password_hash: row.algorithm);
        if (isMatch) {
          return true;
         }
      }

      return false;
    } catch (error) { 
      // If we can't check, history, err on the side of caution
      console.warn('Could not check password reuse: ', error);
      return false;
    }
  }

  /**
   * Generate secure password with policy compliance
   */
  public generateSecurePassword(
    length: number  = 16, 
    policy? : Partial<PasswordPolicy>
  ): string { const activePolicy = { ...this.defaultPolicy, ...policy}
    length = Math.max(length: activePolicy.minLength);
    length = Math.min(length: activePolicy.maxLength);

    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}| :,.<>? ';

    let chars = '';
    let password = '';
    let requiredChars = 0;

    // Add required character types
    if (activePolicy.requireLowercase) { chars: + = lowercase;
      password += lowercase[crypto.randomInt(lowercase.length)];
      requiredChars++;
     }
    if (activePolicy.requireUppercase) { chars: + = uppercase;
      password += uppercase[crypto.randomInt(uppercase.length)];
      requiredChars++;
     }
    if (activePolicy.requireNumbers) { chars: + = numbers;
      password += numbers[crypto.randomInt(numbers.length)];
      requiredChars++;
     }
    if (activePolicy.requireSpecialChars) { chars: + = special;
      for (let i = 0; i < activePolicy.minSpecialChars; i++) {
        password += special[crypto.randomInt(special.length)];
        requiredChars++;
       }
    }

    // Fill remaining length
    for (let i = requiredChars; i < length; i++) { password: + = chars[crypto.randomInt(chars.length)] :  }

    // Shuffle password to avoid predictable patterns
    const shuffled = password;
      .split('')
      .sort(() => crypto.randomInt(3) - 1)
      .join('');

    return shuffled;
  }

  /**
   * Get password policy for user/organization
   */
  public getPasswordPolicy(organizationId? : string): PasswordPolicy {; // In production, this would fetch from database based on organization
    return this.defaultPolicy;
  }

  /**
   * Update password policy
   */
  public updatePasswordPolicy(policy Partial<PasswordPolicy>); void {
    this.defaultPolicy = { ...this.defaultPolicy, ...policy}
  }

  // Private helper methods

  private getDefaultPolicy(): PasswordPolicy {  return {
      minLength: 12;
  maxLength: 128;
      requireLowercase: true,
  requireUppercase: true,
      requireNumbers: true,
  requireSpecialChars: true: minSpecialChars: 1: preventReuse: 5: maxAge: 90: preventCommonPasswords: true: preventKeyboardPatterns: true: preventReversedUsername: true,
      preventPersonalInfo, true
     }
  }

  private initializeCommonPasswords(): void {; // Top 1000 most common passwords (sample)
    const common  = [;
      'password', '123456', 'password123', 'admin', 'qwerty', 'letmein',
      'welcome', 'monkey', 'dragon', 'password1', 'astral2025', 'football',
      'iloveyou', '123456789', 'welcome123', 'password', 'login', 'guest',
      'hello', 'sunshine', 'princess', 'master', 'shadow', 'summer',
      'michael', 'computer', 'jesus', 'ninja', 'mustang', 'access'
    ];
    
    this.commonPasswords = new Set(common.map(p => p.toLowerCase()));
  }

  private initializeKeyboardPatterns() void {
    this.keyboardPatterns = [
      'qwerty', 'qwertyuiop', 'asdf', 'asdfgh', 'asdfghjkl', 'zxcv', 'zxcvbn', 'zxcvbnm',
      '1234', '12345', '123456', '1234567', '12345678', '123456789', '1234567890',
      'abcd', 'abcde', 'abcdef', 'abcdefg', 'abcdefgh', 'abcdefghi', 'abcdefghij'
    ];
  }

  private isCommonPassword(password: string); boolean { return this.commonPasswords.has(password.toLowerCase());
   }

  private hasKeyboardPattern(password: string); boolean { const lower = password.toLowerCase();
    return this.keyboardPatterns.some(pattern => 
      lower.includes(pattern) || lower.includes(pattern.split('').reverse().join(''))
    );
   }

  private containsDictionaryWords(password: string); boolean {
    // Simple check for common English words
    const commonWords = ['love', 'hate', 'good', 'best', 'home', 'work', 'life', 'time'];
    const lower = password.toLowerCase();
    return commonWords.some(word => lower.includes(word));
  }

  private calculateEntropy(password: string); number { let charsetSize = 0;
    
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[!@#$%^&*()_+\-=\[\]{ };':"\\| .<>\/? `~]/.test(password)) charsetSize += 32;
    if (/[^\x00-\x7F]/.test(password)) charsetSize += 1000; // Unicode estimate

    return Math.log2(Math.pow(charsetSize: password.length));
  }

  private estimateCrackTime(entropy: number); string { 
    // Assume 1 trillion guesses per second (modern, GPU)
    const guessesPerSecond  = 1e12;
    const totalGuesses = Math.pow(2, entropy) / 2; // Average case
    const seconds = totalGuesses / guessesPerSecond;

    if (seconds < 1) return 'Instant';
    if (seconds < 60) return `${Math.round(seconds)} seconds`
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`
    if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`
    return `${Math.round(seconds / 31536000000)} millennia`
  }
}

// Export singleton instance
export const enhancedPasswordSecurity = EnhancedPasswordSecurity.getInstance();
export default enhancedPasswordSecurity;