/**
 * Message Encryption Service for Secure Chat Communications
 * Implements AES-256-GCM encryption for end-to-end message security
 */

import crypto from 'crypto';

export interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

export interface DecryptedMessage {
  content: string;
  timestamp: string;
}

class MessageEncryption {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly IV_LENGTH = 12;  // 96 bits for GCM

  // Generate a secure key for encryption
  generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  // Derive key from league ID and user credentials
  deriveKey(leagueId: string, userId: string, secret: string): Buffer {
    const keyMaterial = `${leagueId}:${userId}:${secret}`;
    return crypto.pbkdf2Sync(keyMaterial, 'astral-field-salt', 100000, this.KEY_LENGTH, 'sha256');
  }

  // Encrypt a message
  encrypt(content: string, key: Buffer): EncryptedMessage {
    try {
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      cipher.setAAD(Buffer.from('astral-field-chat'));

      let encrypted = cipher.update(content, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      return {
        encryptedContent: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: this.ALGORITHM
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt a message
  decrypt(encryptedMessage: EncryptedMessage, key: Buffer): string {
    try {
      const decipher = crypto.createDecipher(encryptedMessage.algorithm, key);
      decipher.setAAD(Buffer.from('astral-field-chat'));
      decipher.setAuthTag(Buffer.from(encryptedMessage.authTag, 'hex'));

      let decrypted = decipher.update(encryptedMessage.encryptedContent, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // Encrypt message for league (uses league-specific key)
  encryptForLeague(content: string, leagueId: string, userId: string): EncryptedMessage {
    const secret = process.env.ENCRYPTION_SECRET || 'fallback-secret';
    const key = this.deriveKey(leagueId, userId, secret);
    return this.encrypt(content, key);
  }

  // Decrypt message from league
  decryptFromLeague(encryptedMessage: EncryptedMessage, leagueId: string, userId: string): string {
    const secret = process.env.ENCRYPTION_SECRET || 'fallback-secret';
    const key = this.deriveKey(leagueId, userId, secret);
    return this.decrypt(encryptedMessage, key);
  }

  // Hash sensitive data for storage (one-way)
  hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Verify hash
  verifyHash(data: string, hash: string): boolean {
    const computedHash = this.hashSensitiveData(data);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  }
}

// Singleton instance
export const messageEncryption = new MessageEncryption();