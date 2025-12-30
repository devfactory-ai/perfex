/**
 * Cryptographic utilities
 * Password hashing and JWT token generation/verification
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AccessTokenPayload, RefreshTokenPayload } from '@perfex/shared';

/**
 * Hash a password using bcrypt (cost 12)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate an access token (24 hours expiry)
 */
export function generateAccessToken(
  userId: string,
  email: string,
  secret: string
): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  };

  return jwt.sign(payload, secret);
}

/**
 * Generate a refresh token (7 days expiry)
 */
export function generateRefreshToken(
  userId: string,
  sessionId: string,
  secret: string
): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    sessionId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };

  return jwt.sign(payload, secret);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken<T = AccessTokenPayload | RefreshTokenPayload>(
  token: string,
  secret: string
): T {
  try {
    return jwt.verify(token, secret) as T;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Generate a random token for email verification or password reset
 */
export function generateRandomToken(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a token using SHA-256 for fast, secure token storage
 * Used for password reset tokens, email verification tokens, etc.
 * Unlike bcrypt, SHA-256 is fast enough for token lookup
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a token against its hash
 * Uses constant-time comparison to prevent timing attacks
 */
export async function verifyTokenHash(token: string, hash: string): Promise<boolean> {
  const tokenHash = await hashToken(token);

  // Constant-time comparison to prevent timing attacks
  if (tokenHash.length !== hash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < tokenHash.length; i++) {
    result |= tokenHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }

  return result === 0;
}
