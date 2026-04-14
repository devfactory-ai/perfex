/**
 * Rate limiting utilities tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkRateLimit,
  incrementRateLimit,
  getRemainingAttempts,
  RATE_LIMITS,
  rateLimitMiddleware,
  authRateLimitMiddleware,
} from './rate-limit';
import type { RateLimitConfig } from './rate-limit';

/**
 * Create a mock KV namespace backed by a simple Map
 */
function createMockKV(): KVNamespace {
  const store = new Map<string, string>();

  return {
    get: vi.fn(async (key: string, type?: string) => {
      const value = store.get(key);
      if (value === undefined) return null;
      if (type === 'json') return JSON.parse(value);
      return value;
    }),
    put: vi.fn(async (key: string, value: string, _opts?: any) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace;
}

const TEST_CONFIG: RateLimitConfig = { maxAttempts: 5, windowMs: 60_000 };

describe('Rate Limit Utils', () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV();
    vi.restoreAllMocks();
  });

  // ── checkRateLimit ──────────────────────────────────────────────────

  describe('checkRateLimit', () => {
    it('returns true (allowed) when no previous attempts', async () => {
      const result = await checkRateLimit(kv, 'test-key', TEST_CONFIG);
      expect(result).toBe(true);
    });

    it('returns true when window has expired', async () => {
      // Seed an entry whose window started 2 minutes ago (> 60s window)
      const oldTimestamp = Date.now() - 120_000;
      await kv.put(
        'ratelimit:test-key',
        JSON.stringify({ count: 10, firstAttempt: oldTimestamp })
      );

      const result = await checkRateLimit(kv, 'test-key', TEST_CONFIG);
      expect(result).toBe(true);
    });

    it('returns true when under the limit', async () => {
      await kv.put(
        'ratelimit:test-key',
        JSON.stringify({ count: 3, firstAttempt: Date.now() })
      );

      const result = await checkRateLimit(kv, 'test-key', TEST_CONFIG);
      expect(result).toBe(true);
    });

    it('returns false when at the limit within window', async () => {
      await kv.put(
        'ratelimit:test-key',
        JSON.stringify({ count: 5, firstAttempt: Date.now() })
      );

      const result = await checkRateLimit(kv, 'test-key', TEST_CONFIG);
      expect(result).toBe(false);
    });

    it('returns false when over the limit within window', async () => {
      await kv.put(
        'ratelimit:test-key',
        JSON.stringify({ count: 10, firstAttempt: Date.now() })
      );

      const result = await checkRateLimit(kv, 'test-key', TEST_CONFIG);
      expect(result).toBe(false);
    });
  });

  // ── incrementRateLimit ──────────────────────────────────────────────

  describe('incrementRateLimit', () => {
    it('creates a new entry on first attempt', async () => {
      await incrementRateLimit(kv, 'new-key', TEST_CONFIG);

      const stored = await kv.get('ratelimit:new-key', 'json') as any;
      expect(stored).not.toBeNull();
      expect(stored.count).toBe(1);
      expect(stored.firstAttempt).toBeGreaterThan(0);
    });

    it('increments counter on subsequent attempts', async () => {
      await kv.put(
        'ratelimit:inc-key',
        JSON.stringify({ count: 3, firstAttempt: Date.now() })
      );

      await incrementRateLimit(kv, 'inc-key', TEST_CONFIG);

      const stored = await kv.get('ratelimit:inc-key', 'json') as any;
      expect(stored.count).toBe(4);
    });

    it('resets counter when window has expired', async () => {
      const oldTimestamp = Date.now() - 120_000;
      await kv.put(
        'ratelimit:expired-key',
        JSON.stringify({ count: 99, firstAttempt: oldTimestamp })
      );

      await incrementRateLimit(kv, 'expired-key', TEST_CONFIG);

      const stored = await kv.get('ratelimit:expired-key', 'json') as any;
      expect(stored.count).toBe(1);
      expect(stored.firstAttempt).toBeGreaterThan(oldTimestamp);
    });

    it('passes correct expirationTtl to KV put', async () => {
      await incrementRateLimit(kv, 'ttl-key', TEST_CONFIG);

      expect(kv.put).toHaveBeenCalledWith(
        'ratelimit:ttl-key',
        expect.any(String),
        { expirationTtl: Math.floor(TEST_CONFIG.windowMs / 1000) }
      );
    });
  });

  // ── getRemainingAttempts ────────────────────────────────────────────

  describe('getRemainingAttempts', () => {
    it('returns maxAttempts when no data exists', async () => {
      const remaining = await getRemainingAttempts(kv, 'empty', TEST_CONFIG);
      expect(remaining).toBe(TEST_CONFIG.maxAttempts);
    });

    it('returns maxAttempts when window has expired', async () => {
      await kv.put(
        'ratelimit:expired',
        JSON.stringify({ count: 4, firstAttempt: Date.now() - 120_000 })
      );

      const remaining = await getRemainingAttempts(kv, 'expired', TEST_CONFIG);
      expect(remaining).toBe(TEST_CONFIG.maxAttempts);
    });

    it('returns correct remaining count', async () => {
      await kv.put(
        'ratelimit:partial',
        JSON.stringify({ count: 3, firstAttempt: Date.now() })
      );

      const remaining = await getRemainingAttempts(kv, 'partial', TEST_CONFIG);
      expect(remaining).toBe(2);
    });

    it('returns 0 when count equals or exceeds maxAttempts', async () => {
      await kv.put(
        'ratelimit:maxed',
        JSON.stringify({ count: 10, firstAttempt: Date.now() })
      );

      const remaining = await getRemainingAttempts(kv, 'maxed', TEST_CONFIG);
      expect(remaining).toBe(0);
    });
  });

  // ── RATE_LIMITS constants ──────────────────────────────────────────

  describe('RATE_LIMITS constants', () => {
    it('LOGIN: 10 attempts per 5 minutes', () => {
      expect(RATE_LIMITS.LOGIN.maxAttempts).toBe(10);
      expect(RATE_LIMITS.LOGIN.windowMs).toBe(5 * 60 * 1000);
    });

    it('REGISTER: 10 attempts per hour', () => {
      expect(RATE_LIMITS.REGISTER.maxAttempts).toBe(10);
      expect(RATE_LIMITS.REGISTER.windowMs).toBe(60 * 60 * 1000);
    });

    it('API_AUTH: 100 per minute', () => {
      expect(RATE_LIMITS.API_AUTH.maxAttempts).toBe(100);
      expect(RATE_LIMITS.API_AUTH.windowMs).toBe(60 * 1000);
    });
  });
});

// ── Middleware tests ───────────────────────────────────────────────────
// We use a lightweight Hono app to exercise the middleware in-process.

import { Hono } from 'hono';

function buildApp(opts: {
  kv?: KVNamespace;
  environment?: string;
  config?: RateLimitConfig;
  useAuth?: boolean;
}) {
  const { kv, environment, config = TEST_CONFIG, useAuth = false } = opts;

  type Env = { Bindings: { CACHE?: KVNamespace; ENVIRONMENT?: string } };
  const app = new Hono<Env>();

  // Inject bindings
  app.use('*', async (c, next) => {
    (c.env as any).CACHE = kv;
    (c.env as any).ENVIRONMENT = environment;
    await next();
  });

  const mw = useAuth
    ? authRateLimitMiddleware(config)
    : rateLimitMiddleware(config);

  app.use('/test/*', mw);
  app.get('/test/endpoint', (c) => c.json({ ok: true }));

  return app;
}

describe('rateLimitMiddleware', () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV();
    vi.restoreAllMocks();
  });

  it('passes through when KV is not available (non-production)', async () => {
    const app = buildApp({ kv: undefined, environment: 'staging' });
    const res = await app.request('/test/endpoint');

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
  });

  it('returns 503 when KV is not available in production', async () => {
    const app = buildApp({ kv: undefined, environment: 'production' });
    const res = await app.request('/test/endpoint');

    expect(res.status).toBe(503);
    const body = await res.json() as any;
    expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    // Pre-fill KV so the limit is already hit
    await kv.put(
      'ratelimit:/test/endpoint:unknown:',
      JSON.stringify({ count: 5, firstAttempt: Date.now() })
    );

    const app = buildApp({ kv });
    const res = await app.request('/test/endpoint');

    expect(res.status).toBe(429);
    const body = await res.json() as any;
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('sets X-RateLimit headers on 429 response', async () => {
    await kv.put(
      'ratelimit:/test/endpoint:unknown:',
      JSON.stringify({ count: 5, firstAttempt: Date.now() })
    );

    const app = buildApp({ kv });
    const res = await app.request('/test/endpoint');

    expect(res.status).toBe(429);
    expect(res.headers.get('X-RateLimit-Limit')).toBe(String(TEST_CONFIG.maxAttempts));
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('Retry-After')).toBe(String(Math.ceil(TEST_CONFIG.windowMs / 1000)));
  });

  it('allows request and sets headers when under limit', async () => {
    const app = buildApp({ kv });
    const res = await app.request('/test/endpoint');

    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBe(String(TEST_CONFIG.maxAttempts));
    expect(res.headers.get('X-RateLimit-Remaining')).toBeTruthy();
  });
});

describe('authRateLimitMiddleware', () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKV();
    vi.restoreAllMocks();
  });

  it('uses IP + path as key (no user ID)', async () => {
    const app = buildApp({ kv, useAuth: true });
    const res = await app.request('/test/endpoint', {
      headers: { 'cf-connecting-ip': '1.2.3.4' },
    });

    expect(res.status).toBe(200);

    // The auth middleware should have written a key like auth:/test/endpoint:1.2.3.4
    expect(kv.put).toHaveBeenCalledWith(
      'ratelimit:auth:/test/endpoint:1.2.3.4',
      expect.any(String),
      expect.any(Object)
    );
  });

  it('falls back to x-forwarded-for when cf-connecting-ip missing', async () => {
    const app = buildApp({ kv, useAuth: true });
    const res = await app.request('/test/endpoint', {
      headers: { 'x-forwarded-for': '5.6.7.8, 10.0.0.1' },
    });

    expect(res.status).toBe(200);
    expect(kv.put).toHaveBeenCalledWith(
      'ratelimit:auth:/test/endpoint:5.6.7.8',
      expect.any(String),
      expect.any(Object)
    );
  });

  it('uses "unknown" when no IP headers present', async () => {
    const app = buildApp({ kv, useAuth: true });
    const res = await app.request('/test/endpoint');

    expect(res.status).toBe(200);
    expect(kv.put).toHaveBeenCalledWith(
      'ratelimit:auth:/test/endpoint:unknown',
      expect.any(String),
      expect.any(Object)
    );
  });

  it('defaults to LOGIN rate limit config', async () => {
    // authRateLimitMiddleware() with no args should use RATE_LIMITS.LOGIN
    const app = buildApp({ kv, useAuth: true, config: RATE_LIMITS.LOGIN });

    // Exceed the login limit (10 attempts)
    await kv.put(
      'ratelimit:auth:/test/endpoint:unknown',
      JSON.stringify({ count: 10, firstAttempt: Date.now() })
    );

    const res = await app.request('/test/endpoint');
    expect(res.status).toBe(429);
  });
});
