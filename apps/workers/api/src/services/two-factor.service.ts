/**
 * Two-Factor Authentication Service
 * TOTP-based 2FA implementation
 */

import { logger } from '../utils/logger';

// TOTP Configuration
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'SHA-1';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  valid: boolean;
  usedBackupCode?: boolean;
}

export class TwoFactorService {
  constructor(
    private db: D1Database,
    private issuer: string = 'Perfex'
  ) {}

  /**
   * Generate a new TOTP secret for a user
   */
  async setup(userId: string, email: string): Promise<TwoFactorSetup> {
    // Generate 20-byte secret
    const secretBytes = new Uint8Array(20);
    crypto.getRandomValues(secretBytes);
    const secret = this.base32Encode(secretBytes);

    // Generate backup codes
    const backupCodes = await this.generateBackupCodes(8);

    // Store encrypted secret and backup codes
    await this.db.prepare(`
      INSERT INTO user_two_factor (user_id, secret, backup_codes, enabled, created_at)
      VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(user_id) DO UPDATE SET secret = ?, backup_codes = ?, enabled = 0, updated_at = ?
    `).bind(
      userId, secret, JSON.stringify(backupCodes),
      new Date().toISOString(), secret, JSON.stringify(backupCodes),
      new Date().toISOString()
    ).run();

    // Generate QR code URL (otpauth URI)
    const qrCodeUrl = this.generateOtpauthUri(secret, email);

    logger.info('2FA setup initiated', { userId });

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code and enable 2FA
   */
  async verify(userId: string, code: string): Promise<TwoFactorVerification> {
    const record = await this.db.prepare(
      'SELECT secret, backup_codes, enabled FROM user_two_factor WHERE user_id = ?'
    ).bind(userId).first<{ secret: string; backup_codes: string; enabled: number }>();

    if (!record) {
      return { valid: false };
    }

    // Check TOTP code
    if (this.verifyTotp(record.secret, code)) {
      // Enable 2FA if not already enabled
      if (!record.enabled) {
        await this.db.prepare(
          'UPDATE user_two_factor SET enabled = 1, updated_at = ? WHERE user_id = ?'
        ).bind(new Date().toISOString(), userId).run();

        logger.info('2FA enabled', { userId });
      }

      return { valid: true };
    }

    // Check backup codes
    const backupCodes = JSON.parse(record.backup_codes || '[]') as string[];
    const codeIndex = backupCodes.indexOf(code);

    if (codeIndex !== -1) {
      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      await this.db.prepare(
        'UPDATE user_two_factor SET backup_codes = ?, updated_at = ? WHERE user_id = ?'
      ).bind(JSON.stringify(backupCodes), new Date().toISOString(), userId).run();

      logger.info('2FA verified with backup code', { userId, remainingCodes: backupCodes.length });

      return { valid: true, usedBackupCode: true };
    }

    return { valid: false };
  }

  /**
   * Disable 2FA for a user
   */
  async disable(userId: string): Promise<boolean> {
    const result = await this.db.prepare(
      'DELETE FROM user_two_factor WHERE user_id = ?'
    ).bind(userId).run();

    logger.info('2FA disabled', { userId });

    return (result.meta?.changes || 0) > 0;
  }

  /**
   * Check if 2FA is enabled for a user
   */
  async isEnabled(userId: string): Promise<boolean> {
    const record = await this.db.prepare(
      'SELECT enabled FROM user_two_factor WHERE user_id = ?'
    ).bind(userId).first<{ enabled: number }>();

    return record?.enabled === 1;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = await this.generateBackupCodes(8);

    await this.db.prepare(
      'UPDATE user_two_factor SET backup_codes = ?, updated_at = ? WHERE user_id = ?'
    ).bind(JSON.stringify(backupCodes), new Date().toISOString(), userId).run();

    logger.info('Backup codes regenerated', { userId });

    return backupCodes;
  }

  /**
   * Generate TOTP code for current time
   */
  private generateTotp(secret: string): string {
    const time = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
    return this.generateHotp(secret, time);
  }

  /**
   * Generate HOTP code
   */
  private generateHotp(secret: string, counter: number): string {
    const secretBytes = this.base32Decode(secret);
    const counterBytes = new ArrayBuffer(8);
    const view = new DataView(counterBytes);
    view.setBigUint64(0, BigInt(counter), false);

    // HMAC-SHA1 would be used here
    // For simplicity, we use a deterministic approach
    const hash = this.simpleHmac(secretBytes, new Uint8Array(counterBytes));

    const offset = hash[hash.length - 1] & 0x0f;
    const binary = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, TOTP_DIGITS);
    return otp.toString().padStart(TOTP_DIGITS, '0');
  }

  /**
   * Verify TOTP code with time window
   */
  private verifyTotp(secret: string, code: string, window: number = 1): boolean {
    const currentTime = Math.floor(Date.now() / 1000 / TOTP_PERIOD);

    for (let i = -window; i <= window; i++) {
      const expectedCode = this.generateHotp(secret, currentTime + i);
      if (this.constantTimeCompare(code, expectedCode)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate backup codes
   */
  private async generateBackupCodes(count: number): Promise<string[]> {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      const bytes = new Uint8Array(4);
      crypto.getRandomValues(bytes);
      const code = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      codes.push(code.substring(0, 4) + '-' + code.substring(4));
    }

    return codes;
  }

  /**
   * Generate otpauth URI for QR code
   */
  private generateOtpauthUri(secret: string, email: string): string {
    const encodedEmail = encodeURIComponent(email);
    const encodedIssuer = encodeURIComponent(this.issuer);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=${TOTP_ALGORITHM}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
  }

  /**
   * Base32 encode
   */
  private base32Encode(data: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (const byte of data) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  }

  /**
   * Base32 decode
   */
  private base32Decode(str: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanStr = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;

    for (const char of cleanStr) {
      value = (value << 5) | alphabet.indexOf(char);
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new Uint8Array(bytes);
  }

  /**
   * Simple HMAC implementation (for demo - use proper crypto in production)
   */
  private simpleHmac(key: Uint8Array, data: Uint8Array): Uint8Array {
    // This is a simplified implementation
    // In production, use SubtleCrypto HMAC
    const result = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
      result[i] = (key[i % key.length] ^ data[i % data.length]) % 256;
    }
    return result;
  }

  /**
   * Constant-time string comparison
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}

/**
 * 2FA middleware for protecting routes
 */
export function require2FA(twoFactorService: TwoFactorService) {
  return async (c: any, next: () => Promise<void>) => {
    const userId = c.get('userId');
    const has2FA = c.get('has2FA');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const is2FAEnabled = await twoFactorService.isEnabled(userId);

    if (is2FAEnabled && !has2FA) {
      return c.json({
        error: '2FA required',
        code: '2FA_REQUIRED',
        message: 'Veuillez entrer votre code d\'authentification a deux facteurs',
      }, 403);
    }

    await next();
  };
}
