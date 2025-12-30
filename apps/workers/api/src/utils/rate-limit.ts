/**
 * Rate limiting utilities using KV
 */

import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { logger } from './logger';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

/**
 * Rate limit presets
 */
export const RATE_LIMITS = {
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  REGISTER: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  PASSWORD_RESET: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  PASSWORDLESS: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  API_AUTH: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  API_PUBLIC: { maxAttempts: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  API_SENSITIVE: { maxAttempts: 20, windowMs: 60 * 1000 }, // 20 requests per minute for sensitive ops
} as const;

/**
 * Check if rate limit is exceeded
 * Returns true if limit is NOT exceeded (request should be allowed)
 */
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<boolean> {
  const rateLimitKey = `ratelimit:${key}`;
  const data = await kv.get(rateLimitKey, 'json') as { count: number; firstAttempt: number } | null;

  if (!data) {
    // No previous attempts
    return true;
  }

  const now = Date.now();
  const windowExpired = now - data.firstAttempt > config.windowMs;

  if (windowExpired) {
    // Window expired, allow request
    return true;
  }

  // Check if limit exceeded
  return data.count < config.maxAttempts;
}

/**
 * Increment rate limit counter
 */
export async function incrementRateLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<void> {
  const rateLimitKey = `ratelimit:${key}`;
  const data = await kv.get(rateLimitKey, 'json') as { count: number; firstAttempt: number } | null;

  const now = Date.now();

  if (!data) {
    // First attempt
    await kv.put(
      rateLimitKey,
      JSON.stringify({ count: 1, firstAttempt: now }),
      { expirationTtl: Math.floor(config.windowMs / 1000) }
    );
    return;
  }

  const windowExpired = now - data.firstAttempt > config.windowMs;

  if (windowExpired) {
    // Window expired, reset counter
    await kv.put(
      rateLimitKey,
      JSON.stringify({ count: 1, firstAttempt: now }),
      { expirationTtl: Math.floor(config.windowMs / 1000) }
    );
    return;
  }

  // Increment counter
  await kv.put(
    rateLimitKey,
    JSON.stringify({ count: data.count + 1, firstAttempt: data.firstAttempt }),
    { expirationTtl: Math.floor(config.windowMs / 1000) }
  );
}

/**
 * Get remaining attempts
 */
export async function getRemainingAttempts(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<number> {
  const rateLimitKey = `ratelimit:${key}`;
  const data = await kv.get(rateLimitKey, 'json') as { count: number; firstAttempt: number } | null;

  if (!data) {
    return config.maxAttempts;
  }

  const now = Date.now();
  const windowExpired = now - data.firstAttempt > config.windowMs;

  if (windowExpired) {
    return config.maxAttempts;
  }

  return Math.max(0, config.maxAttempts - data.count);
}

/**
 * Rate limiting middleware
 * Creates a Hono middleware that checks rate limits
 */
export const rateLimitMiddleware = (
  config: RateLimitConfig,
  keyGenerator?: (c: Context) => string
) => {
  return createMiddleware(async (c: Context, next) => {
    // Get KV namespace from env
    const kv = (c.env as { CACHE?: KVNamespace }).CACHE;

    if (!kv) {
      // If no KV, allow request but log warning
      logger.warn('Rate limit middleware: KV namespace not available');
      return next();
    }

    // Generate rate limit key
    const clientIp = c.req.header('cf-connecting-ip') ||
                     c.req.header('x-forwarded-for')?.split(',')[0] ||
                     'unknown';
    const userId = c.get('userId') || '';
    const path = c.req.path;

    const key = keyGenerator
      ? keyGenerator(c)
      : `${path}:${clientIp}:${userId}`;

    // Check rate limit
    const allowed = await checkRateLimit(kv, key, config);

    if (!allowed) {
      const remaining = await getRemainingAttempts(kv, key, config);
      const retryAfter = Math.ceil(config.windowMs / 1000);

      logger.warn('Rate limit exceeded', {
        key,
        clientIp,
        userId,
        path,
        config,
      });

      // Set rate limit headers
      c.header('X-RateLimit-Limit', String(config.maxAttempts));
      c.header('X-RateLimit-Remaining', String(remaining));
      c.header('Retry-After', String(retryAfter));

      return c.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              retryAfter,
              limit: config.maxAttempts,
              windowSeconds: Math.ceil(config.windowMs / 1000),
            },
          },
        },
        429
      );
    }

    // Increment counter
    await incrementRateLimit(kv, key, config);

    // Add rate limit headers
    const remaining = await getRemainingAttempts(kv, key, config);
    c.header('X-RateLimit-Limit', String(config.maxAttempts));
    c.header('X-RateLimit-Remaining', String(remaining));

    return next();
  });
};

/**
 * Strict rate limiting for authentication endpoints
 * Uses IP + endpoint as key (no user ID since user is authenticating)
 */
export const authRateLimitMiddleware = (config: RateLimitConfig = RATE_LIMITS.LOGIN) => {
  return rateLimitMiddleware(config, (c) => {
    const clientIp = c.req.header('cf-connecting-ip') ||
                     c.req.header('x-forwarded-for')?.split(',')[0] ||
                     'unknown';
    return `auth:${c.req.path}:${clientIp}`;
  });
};

/**
 * API rate limiting for authenticated endpoints
 * Uses user ID + endpoint as key
 */
export const apiRateLimitMiddleware = (config: RateLimitConfig = RATE_LIMITS.API_AUTH) => {
  return rateLimitMiddleware(config, (c) => {
    const userId = c.get('userId') || 'anonymous';
    const endpoint = c.req.path.split('/').slice(0, 4).join('/'); // Normalize endpoint
    return `api:${endpoint}:${userId}`;
  });
};
