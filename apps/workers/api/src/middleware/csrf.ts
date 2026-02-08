/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { logger } from '../utils/logger';

/**
 * CSRF Configuration
 */
export interface CsrfConfig {
  /** Header name for CSRF token */
  headerName: string;
  /** Cookie name for CSRF token */
  cookieName: string;
  /** Token expiration in seconds */
  tokenExpiry: number;
  /** Methods that require CSRF validation */
  protectedMethods: string[];
  /** Paths to exclude from CSRF protection */
  excludePaths: string[];
}

/**
 * Default CSRF configuration
 */
export const DEFAULT_CSRF_CONFIG: CsrfConfig = {
  headerName: 'X-CSRF-Token',
  cookieName: 'csrf_token',
  tokenExpiry: 3600, // 1 hour
  protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  excludePaths: [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/passwordless/request',
    '/api/v1/auth/passwordless/verify',
    '/api/v1/health',
    '/api/v1/test',
  ],
};

/**
 * Generate a cryptographically secure CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash CSRF token for storage
 */
async function hashCsrfToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify CSRF token using constant-time comparison
 */
async function verifyCsrfToken(token: string, storedHash: string): Promise<boolean> {
  const tokenHash = await hashCsrfToken(token);

  // Constant-time comparison
  if (tokenHash.length !== storedHash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < tokenHash.length; i++) {
    result |= tokenHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF Protection Middleware
 *
 * Implementation uses the Synchronizer Token Pattern:
 * 1. Server generates a token and stores hash in session/KV
 * 2. Token is sent to client (via cookie or response)
 * 3. Client sends token back in header for state-changing requests
 * 4. Server validates token matches stored hash
 */
export const csrfMiddleware = (config: Partial<CsrfConfig> = {}) => {
  const cfg = { ...DEFAULT_CSRF_CONFIG, ...config };

  return createMiddleware(async (c: Context, next) => {
    const method = c.req.method;
    const path = c.req.path;

    // Skip CSRF for safe methods
    if (!cfg.protectedMethods.includes(method)) {
      return next();
    }

    // Skip CSRF for excluded paths
    if (cfg.excludePaths.some(excludePath => path.startsWith(excludePath))) {
      return next();
    }

    // Get CSRF token from header
    const csrfToken = c.req.header(cfg.headerName);

    if (!csrfToken) {
      logger.warn('CSRF token missing', { path, method });
      return c.json(
        {
          success: false,
          error: {
            code: 'CSRF_TOKEN_MISSING',
            message: 'CSRF token is required for this request',
          },
        },
        403
      );
    }

    // Get user session to retrieve stored token hash
    const userId = c.get('userId');
    if (!userId) {
      // No authenticated user, CSRF check not applicable
      return next();
    }

    // Get stored token hash from KV
    const kv = (c.env as { CACHE?: KVNamespace }).CACHE;
    if (!kv) {
      logger.warn('CSRF middleware: KV namespace not available');
      return next();
    }

    const storedHash = await kv.get(`csrf:${userId}`);

    if (!storedHash) {
      logger.warn('CSRF token not found in storage', { userId, path });
      return c.json(
        {
          success: false,
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid or expired CSRF token. Please refresh and try again.',
          },
        },
        403
      );
    }

    // Verify token
    const isValid = await verifyCsrfToken(csrfToken, storedHash);

    if (!isValid) {
      logger.warn('CSRF token validation failed', { userId, path });
      return c.json(
        {
          success: false,
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid CSRF token. Please refresh and try again.',
          },
        },
        403
      );
    }

    return next();
  });
};

/**
 * Middleware to generate and set CSRF token for the user
 * Should be called after authentication
 *
 * IMPORTANT: This middleware generates the token BEFORE processing
 * and stores it in context so it can be included in responses properly.
 */
export const setCsrfToken = (config: Partial<CsrfConfig> = {}) => {
  const cfg = { ...DEFAULT_CSRF_CONFIG, ...config };

  return createMiddleware(async (c: Context, next) => {
    // Pre-generate token for authenticated users
    const userId = c.get('userId');

    if (userId) {
      const kv = (c.env as { CACHE?: KVNamespace }).CACHE;

      if (kv) {
        // Check if user already has a valid CSRF token
        const existingHash = await kv.get(`csrf:${userId}`);

        if (!existingHash) {
          // Generate new CSRF token BEFORE processing the request
          const csrfToken = await generateCsrfToken();
          const tokenHash = await hashCsrfToken(csrfToken);

          // Store hash in KV
          await kv.put(`csrf:${userId}`, tokenHash, {
            expirationTtl: cfg.tokenExpiry,
          });

          // Store token in context for the handler to use
          c.set('csrfToken', csrfToken);

          // Also set in response header immediately
          c.header(cfg.headerName, csrfToken);
        }
      }
    }

    await next();
  });
};

/**
 * Get CSRF token from context or generate a new one
 * Use this in auth responses to include the token
 */
export async function getOrCreateCsrfToken(
  c: Context,
  userId: string,
  config: Partial<CsrfConfig> = {}
): Promise<string | null> {
  const cfg = { ...DEFAULT_CSRF_CONFIG, ...config };

  // Check if already generated in this request
  const existingToken = c.get('csrfToken');
  if (existingToken) {
    return existingToken;
  }

  const kv = (c.env as { CACHE?: KVNamespace }).CACHE;
  if (!kv) {
    return null;
  }

  // Check if user has existing token - if so, don't generate new one
  // Client should use their existing token
  const existingHash = await kv.get(`csrf:${userId}`);
  if (existingHash) {
    // Token exists but we don't store the raw token, so client needs to use their cached one
    // Return null to indicate no new token
    return null;
  }

  // Generate new token
  const csrfToken = await generateCsrfToken();
  const tokenHash = await hashCsrfToken(csrfToken);

  await kv.put(`csrf:${userId}`, tokenHash, {
    expirationTtl: cfg.tokenExpiry,
  });

  c.set('csrfToken', csrfToken);
  c.header(cfg.headerName, csrfToken);

  return csrfToken;
}

/**
 * Endpoint to get a fresh CSRF token
 * Client can call this to get a new token
 */
export async function refreshCsrfToken(
  userId: string,
  kv: KVNamespace,
  config: Partial<CsrfConfig> = {}
): Promise<string> {
  const cfg = { ...DEFAULT_CSRF_CONFIG, ...config };

  // Generate new CSRF token
  const csrfToken = await generateCsrfToken();
  const tokenHash = await hashCsrfToken(csrfToken);

  // Store hash in KV
  await kv.put(`csrf:${userId}`, tokenHash, {
    expirationTtl: cfg.tokenExpiry,
  });

  return csrfToken;
}

/**
 * Invalidate CSRF token (on logout)
 */
export async function invalidateCsrfToken(
  userId: string,
  kv: KVNamespace
): Promise<void> {
  await kv.delete(`csrf:${userId}`);
}

/**
 * Hono context type extension for CSRF
 */
declare module 'hono' {
  interface ContextVariableMap {
    csrfToken?: string;
  }
}
