/**
 * Rate limiting utilities using KV
 */

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
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
  API_AUTH: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  API_PUBLIC: { maxAttempts: 30, windowMs: 60 * 1000 }, // 30 requests per minute
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
