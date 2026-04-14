/**
 * CSRF Middleware Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import {
  generateCsrfToken,
  csrfMiddleware,
  setCsrfToken,
  getOrCreateCsrfToken,
  DEFAULT_CSRF_CONFIG,
} from './csrf';
import { createMockKVNamespace } from '../__tests__/mocks/database.mock';

// Suppress logger output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

type Env = { Bindings: { CACHE?: KVNamespace; ENVIRONMENT?: string } };

// Use a path that does NOT collide with any excludePaths prefix
// (e.g. '/api/v1/test' is excluded, so '/api/v1/test-resource' would be excluded too)
const PROTECTED_PATH = '/api/v1/resources';

// Helper to create a Hono app with csrf middleware and configurable env/context
function createTestApp(options: {
  kv?: KVNamespace | null;
  environment?: string;
  userId?: string | null;
}) {
  const app = new Hono<Env>();

  // Set userId in context if provided
  if (options.userId !== undefined && options.userId !== null) {
    app.use('*', async (c, next) => {
      c.set('userId', options.userId);
      await next();
    });
  }

  app.use('*', csrfMiddleware());

  // Add test routes
  app.get(PROTECTED_PATH, (c) => c.json({ ok: true }));
  app.post(PROTECTED_PATH, (c) => c.json({ ok: true }));
  app.put(PROTECTED_PATH, (c) => c.json({ ok: true }));
  app.delete(PROTECTED_PATH, (c) => c.json({ ok: true }));
  app.post('/api/v1/auth/login', (c) => c.json({ ok: true }));
  app.post('/api/v1/auth/register', (c) => c.json({ ok: true }));
  app.post('/api/v1/auth/refresh', (c) => c.json({ ok: true }));

  // Build env bindings
  const env: Record<string, any> = {};
  if (options.kv !== undefined && options.kv !== null) {
    env.CACHE = options.kv;
  }
  if (options.environment !== undefined) {
    env.ENVIRONMENT = options.environment;
  }

  return {
    request: (path: string, init?: RequestInit) =>
      app.request(path, init, env),
  };
}

// Helper to store a valid CSRF token in KV and return it
async function storeValidToken(kv: KVNamespace, userId: string): Promise<string> {
  const token = await generateCsrfToken();
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  await kv.put(`csrf:${userId}`, hash, { expirationTtl: 3600 });
  return token;
}

describe('CSRF Middleware', () => {
  describe('generateCsrfToken', () => {
    it('should return a 64-char hex string', async () => {
      const token = await generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return unique values on each call', async () => {
      const token1 = await generateCsrfToken();
      const token2 = await generateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('csrfMiddleware', () => {
    let mockKv: KVNamespace;

    beforeEach(() => {
      mockKv = createMockKVNamespace();
    });

    it('should pass through GET requests without CSRF check', async () => {
      const app = createTestApp({ kv: mockKv, userId: 'user-1' });
      const res = await app.request(PROTECTED_PATH, { method: 'GET' });
      expect(res.status).toBe(200);
    });

    it('should pass through POST to excluded paths (login)', async () => {
      const app = createTestApp({ kv: mockKv, userId: 'user-1' });
      const res = await app.request('/api/v1/auth/login', { method: 'POST' });
      expect(res.status).toBe(200);
    });

    it('should pass through POST to excluded paths (register)', async () => {
      const app = createTestApp({ kv: mockKv, userId: 'user-1' });
      const res = await app.request('/api/v1/auth/register', { method: 'POST' });
      expect(res.status).toBe(200);
    });

    it('should pass through POST to excluded paths (refresh)', async () => {
      const app = createTestApp({ kv: mockKv, userId: 'user-1' });
      const res = await app.request('/api/v1/auth/refresh', { method: 'POST' });
      expect(res.status).toBe(200);
    });

    it('should return 403 for POST without CSRF token header', async () => {
      const app = createTestApp({ kv: mockKv, userId: 'user-1' });
      const res = await app.request(PROTECTED_PATH, { method: 'POST' });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('should return 403 for POST with invalid CSRF token', async () => {
      const userId = 'user-1';
      await storeValidToken(mockKv, userId);

      const app = createTestApp({ kv: mockKv, userId });
      const res = await app.request(PROTECTED_PATH, {
        method: 'POST',
        headers: { 'X-CSRF-Token': 'invalid-token-value' },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('should return 403 when no token is stored in KV for the user', async () => {
      const app = createTestApp({ kv: mockKv, userId: 'user-1' });
      const res = await app.request(PROTECTED_PATH, {
        method: 'POST',
        headers: { 'X-CSRF-Token': 'some-token' },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('should pass through POST with valid CSRF token', async () => {
      const userId = 'user-1';
      const validToken = await storeValidToken(mockKv, userId);

      const app = createTestApp({ kv: mockKv, userId });
      const res = await app.request(PROTECTED_PATH, {
        method: 'POST',
        headers: { 'X-CSRF-Token': validToken },
      });
      expect(res.status).toBe(200);
    });

    it('should pass through for non-authenticated users (no userId)', async () => {
      const app = createTestApp({ kv: mockKv, userId: null });
      const res = await app.request(PROTECTED_PATH, {
        method: 'POST',
        headers: { 'X-CSRF-Token': 'any-token' },
      });
      expect(res.status).toBe(200);
    });

    it('should return 503 when KV not available in production', async () => {
      const app = createTestApp({ kv: null, environment: 'production', userId: 'user-1' });
      const res = await app.request(PROTECTED_PATH, {
        method: 'POST',
        headers: { 'X-CSRF-Token': 'any-token' },
      });
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should pass through with warning when KV not available in development', async () => {
      const app = createTestApp({ kv: null, environment: 'development', userId: 'user-1' });
      const res = await app.request(PROTECTED_PATH, {
        method: 'POST',
        headers: { 'X-CSRF-Token': 'any-token' },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('setCsrfToken', () => {
    let mockKv: KVNamespace;

    beforeEach(() => {
      mockKv = createMockKVNamespace();
    });

    it('should generate and store token for authenticated users', async () => {
      const app = new Hono<Env>();
      const userId = 'user-1';
      const env = { CACHE: mockKv };

      app.use('*', async (c, next) => {
        c.set('userId', userId);
        await next();
      });
      app.use('*', setCsrfToken());
      app.get('/test', (c) => {
        const token = c.get('csrfToken');
        return c.json({ csrfToken: token });
      });

      const res = await app.request('/test', { method: 'GET' }, env);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.csrfToken).toBeDefined();
      expect(body.csrfToken).toHaveLength(64);

      // Verify token was stored in KV
      expect(mockKv.put).toHaveBeenCalledWith(
        `csrf:${userId}`,
        expect.any(String),
        expect.objectContaining({ expirationTtl: DEFAULT_CSRF_CONFIG.tokenExpiry })
      );

      // Verify header was set
      expect(res.headers.get('X-CSRF-Token')).toBe(body.csrfToken);
    });

    it('should not generate if token already exists in KV', async () => {
      const app = new Hono<Env>();
      const userId = 'user-1';
      const env = { CACHE: mockKv };

      // Pre-store a token hash
      await mockKv.put(`csrf:${userId}`, 'existing-hash');

      app.use('*', async (c, next) => {
        c.set('userId', userId);
        await next();
      });
      app.use('*', setCsrfToken());
      app.get('/test', (c) => {
        const token = c.get('csrfToken');
        return c.json({ csrfToken: token ?? null });
      });

      const res = await app.request('/test', { method: 'GET' }, env);
      const body = await res.json();

      // Should not have generated a new token
      expect(body.csrfToken).toBeNull();
      // put should only have been called once (the pre-store), not again by the middleware
      expect(mockKv.put).toHaveBeenCalledTimes(1);
    });

    it('should do nothing for unauthenticated users', async () => {
      const app = new Hono<Env>();
      const env = { CACHE: mockKv };

      app.use('*', setCsrfToken());
      app.get('/test', (c) => {
        const token = c.get('csrfToken');
        return c.json({ csrfToken: token ?? null });
      });

      const res = await app.request('/test', { method: 'GET' }, env);
      const body = await res.json();

      expect(body.csrfToken).toBeNull();
      expect(mockKv.get).not.toHaveBeenCalled();
      expect(mockKv.put).not.toHaveBeenCalled();
    });
  });

  describe('getOrCreateCsrfToken', () => {
    let mockKv: KVNamespace;

    beforeEach(() => {
      mockKv = createMockKVNamespace();
    });

    it('should return existing token from context if available', async () => {
      const app = new Hono<Env>();
      const env = { CACHE: mockKv };

      app.get('/test', async (c) => {
        c.set('csrfToken', 'existing-context-token');
        const token = await getOrCreateCsrfToken(c, 'user-1');
        return c.json({ token });
      });

      const res = await app.request('/test', { method: 'GET' }, env);
      const body = await res.json();
      expect(body.token).toBe('existing-context-token');
      // Should not have touched KV at all
      expect(mockKv.get).not.toHaveBeenCalled();
    });

    it('should return null if KV not available', async () => {
      const app = new Hono<Env>();

      app.get('/test', async (c) => {
        const token = await getOrCreateCsrfToken(c, 'user-1');
        return c.json({ token });
      });

      const res = await app.request('/test', { method: 'GET' }, {});
      const body = await res.json();
      expect(body.token).toBeNull();
    });

    it('should return null if user already has a stored token hash', async () => {
      const app = new Hono<Env>();
      const userId = 'user-1';
      const env = { CACHE: mockKv };
      await mockKv.put(`csrf:${userId}`, 'existing-hash');

      app.get('/test', async (c) => {
        const token = await getOrCreateCsrfToken(c, userId);
        return c.json({ token });
      });

      const res = await app.request('/test', { method: 'GET' }, env);
      const body = await res.json();
      // Returns null because the raw token is not stored, only the hash
      expect(body.token).toBeNull();
    });

    it('should create a new token if none exists', async () => {
      const app = new Hono<Env>();
      const userId = 'user-1';
      const env = { CACHE: mockKv };

      app.get('/test', async (c) => {
        const token = await getOrCreateCsrfToken(c, userId);
        return c.json({ token });
      });

      const res = await app.request('/test', { method: 'GET' }, env);
      const body = await res.json();

      expect(body.token).toBeDefined();
      expect(body.token).toHaveLength(64);
      expect(body.token).toMatch(/^[0-9a-f]{64}$/);

      // Verify it was stored in KV
      expect(mockKv.put).toHaveBeenCalledWith(
        `csrf:${userId}`,
        expect.any(String),
        expect.objectContaining({ expirationTtl: DEFAULT_CSRF_CONFIG.tokenExpiry })
      );

      // Verify header was set
      expect(res.headers.get('X-CSRF-Token')).toBe(body.token);
    });
  });
});
