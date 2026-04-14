/**
 * Token Revocation Service
 * Manages JWT access token blacklisting using Cloudflare KV
 *
 * This service enables:
 * - Single token revocation (logout)
 * - User-wide token revocation (password change, security event)
 * - Token validation during auth middleware
 */

import { logger } from '../utils/logger';

/**
 * Token revocation configuration
 */
export interface TokenRevocationConfig {
  /** KV key prefix for revoked tokens */
  prefix: string;
  /** TTL in seconds (should match or exceed access token lifetime) */
  ttl: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: TokenRevocationConfig = {
  prefix: 'revoked:',
  ttl: 24 * 60 * 60, // 24 hours (matches typical refresh token validity)
};

/**
 * Token Revocation Service
 * Uses Cloudflare KV for distributed token blacklisting
 */
export class TokenRevocationService {
  private readonly config: TokenRevocationConfig;

  constructor(
    private readonly kv: KVNamespace,
    config: Partial<TokenRevocationConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Revoke a single access token by its JTI (JWT ID)
   * Use this for individual token revocation (e.g., logout from one device)
   *
   * @param tokenJti - The JWT ID (jti claim) of the token to revoke
   */
  async revokeToken(tokenJti: string): Promise<void> {
    const key = `${this.config.prefix}token:${tokenJti}`;

    try {
      await this.kv.put(key, '1', {
        expirationTtl: this.config.ttl
      });

      logger.info('Token revoked', { tokenJti });
    } catch (error) {
      logger.error('Failed to revoke token', { tokenJti, error });
      throw error;
    }
  }

  /**
   * Revoke all tokens for a user (global logout)
   * Uses a timestamp-based approach: any token issued before this timestamp is invalid
   *
   * @param userId - The user ID whose tokens should be revoked
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const key = `${this.config.prefix}user:${userId}`;
    const revokedAt = Date.now();

    try {
      await this.kv.put(key, String(revokedAt), {
        expirationTtl: this.config.ttl
      });

      logger.info('All user tokens revoked', { userId, revokedAt });
    } catch (error) {
      logger.error('Failed to revoke user tokens', { userId, error });
      throw error;
    }
  }

  /**
   * Check if a specific token is revoked
   *
   * @param tokenJti - The JWT ID to check
   * @returns true if the token is revoked
   */
  async isTokenRevoked(tokenJti: string): Promise<boolean> {
    const key = `${this.config.prefix}token:${tokenJti}`;

    try {
      const value = await this.kv.get(key);
      return value !== null;
    } catch (error) {
      logger.error('Failed to check token revocation', { tokenJti, error });
      // On error, allow the request (fail open) but log for monitoring
      return false;
    }
  }

  /**
   * Check if user's tokens issued before a certain time are revoked
   *
   * @param userId - The user ID to check
   * @param tokenIssuedAt - The token's iat claim (in seconds, as per JWT spec)
   * @returns true if the token should be considered revoked
   */
  async isUserTokenRevoked(userId: string, tokenIssuedAt: number): Promise<boolean> {
    const key = `${this.config.prefix}user:${userId}`;

    try {
      const revokedAtStr = await this.kv.get(key);

      if (!revokedAtStr) {
        return false; // No user-wide revocation
      }

      const revokedAt = parseInt(revokedAtStr, 10);

      // Token is revoked if it was issued before the revocation timestamp
      // tokenIssuedAt is in seconds (JWT standard), revokedAt is in milliseconds
      const tokenIssuedAtMs = tokenIssuedAt * 1000;

      return tokenIssuedAtMs < revokedAt;
    } catch (error) {
      logger.error('Failed to check user token revocation', { userId, error });
      // On error, allow the request (fail open) but log for monitoring
      return false;
    }
  }

  /**
   * Combined check: is this token revoked either individually or via user-wide revocation?
   *
   * @param tokenJti - The JWT ID
   * @param userId - The user ID
   * @param tokenIssuedAt - The token's iat claim (in seconds)
   * @returns true if the token is revoked
   */
  async isRevoked(
    tokenJti: string | undefined,
    userId: string,
    tokenIssuedAt: number
  ): Promise<boolean> {
    // Check user-wide revocation first (more common case)
    const userRevoked = await this.isUserTokenRevoked(userId, tokenIssuedAt);
    if (userRevoked) {
      return true;
    }

    // Check individual token revocation if JTI is present
    if (tokenJti) {
      return this.isTokenRevoked(tokenJti);
    }

    return false;
  }

  /**
   * Clear user revocation (for testing or admin purposes)
   *
   * @param userId - The user ID to clear revocation for
   */
  async clearUserRevocation(userId: string): Promise<void> {
    const key = `${this.config.prefix}user:${userId}`;

    try {
      await this.kv.delete(key);
      logger.info('User revocation cleared', { userId });
    } catch (error) {
      logger.error('Failed to clear user revocation', { userId, error });
      throw error;
    }
  }
}

/**
 * Factory function to create TokenRevocationService
 * Use this in route handlers to get a properly configured instance
 */
export function createTokenRevocationService(
  kv: KVNamespace,
  config?: Partial<TokenRevocationConfig>
): TokenRevocationService {
  return new TokenRevocationService(kv, config);
}
