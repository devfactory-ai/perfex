/**
 * Seed Routes Tests
 * Tests for seed validation, bakery seeding, deletion, and status endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import { createMockD1Database } from '../__tests__/mocks/database.mock';

// Mock hashPassword to avoid bcrypt overhead in tests
vi.mock('../utils/crypto', () => ({
  hashPassword: vi.fn().mockResolvedValue('$2a$10$mockedhash'),
}));

// Mock getDb (used by bakery-full route)
vi.mock('../db', () => ({
  getDb: vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  }),
}));

// Import seed routes after mocks are defined
import seedRoutes from './seed';

const SEED_KEY = 'test-seed-secret-key';

function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: createMockD1Database(),
    ENVIRONMENT: 'development',
    SEED_SECRET_KEY: SEED_KEY,
    ...overrides,
  } as unknown as Env;
}

function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/seed', seedRoutes);
  return app;
}

async function makeRequest(
  app: Hono<{ Bindings: Env }>,
  method: string,
  path: string,
  env?: Env,
  headers?: Record<string, string>
) {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  const req = new Request(`http://localhost${path}`, init);
  return app.fetch(req, env || createMockEnv());
}

describe('Seed Routes', () => {
  let app: Hono<{ Bindings: Env }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  // ──────────────────────────────────────────
  // validateSeedAccess (tested via route behavior)
  // ──────────────────────────────────────────
  describe('validateSeedAccess', () => {
    it('returns 403 in production environment', async () => {
      const env = createMockEnv({ ENVIRONMENT: 'production' } as any);
      const res = await makeRequest(app, 'POST', '/seed/bakery', env, {
        'X-Seed-Key': SEED_KEY,
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Not allowed in production');
    });

    it('returns 500 if SEED_SECRET_KEY not configured', async () => {
      const env = createMockEnv({ SEED_SECRET_KEY: undefined } as any);
      const res = await makeRequest(app, 'POST', '/seed/bakery', env, {
        'X-Seed-Key': 'some-key',
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('SEED_SECRET_KEY not configured');
    });

    it('returns 401 with wrong seed key', async () => {
      const res = await makeRequest(app, 'POST', '/seed/bakery', undefined, {
        'X-Seed-Key': 'wrong-key',
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Invalid seed key');
    });

    it('returns 401 with missing seed key header', async () => {
      const res = await makeRequest(app, 'POST', '/seed/bakery');
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Invalid seed key');
    });

    it('passes with correct seed key', async () => {
      const res = await makeRequest(app, 'POST', '/seed/bakery', undefined, {
        'X-Seed-Key': SEED_KEY,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  // ──────────────────────────────────────────
  // DELETE /seed/bakery
  // ──────────────────────────────────────────
  describe('DELETE /seed/bakery', () => {
    it('returns 403 in production', async () => {
      const env = createMockEnv({ ENVIRONMENT: 'production' } as any);
      const res = await makeRequest(app, 'DELETE', '/seed/bakery', env, {
        'X-Seed-Key': SEED_KEY,
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Not allowed in production');
    });

    it('returns 401 without valid seed key', async () => {
      const res = await makeRequest(app, 'DELETE', '/seed/bakery', undefined, {
        'X-Seed-Key': 'invalid',
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Invalid seed key');
    });

    it('successfully deletes bakery data', async () => {
      const env = createMockEnv();
      const res = await makeRequest(app, 'DELETE', '/seed/bakery', env, {
        'X-Seed-Key': SEED_KEY,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe('Bakery data cleaned');
      // Verify prepare was called multiple times for each DELETE statement
      expect(env.DB.prepare).toHaveBeenCalled();
      const prepareCalls = (env.DB.prepare as any).mock.calls;
      // All calls should be DELETE statements
      for (const call of prepareCalls) {
        expect(call[0].trim()).toMatch(/^DELETE FROM/);
      }
    });

    it('returns 500 on database error', async () => {
      const env = createMockEnv();
      (env.DB.prepare as any).mockImplementation(() => {
        throw new Error('DB connection failed');
      });
      const res = await makeRequest(app, 'DELETE', '/seed/bakery', env, {
        'X-Seed-Key': SEED_KEY,
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('DB connection failed');
    });
  });

  // ──────────────────────────────────────────
  // POST /seed/bakery
  // ──────────────────────────────────────────
  describe('POST /seed/bakery', () => {
    it('returns 403 in production', async () => {
      const env = createMockEnv({ ENVIRONMENT: 'production' } as any);
      const res = await makeRequest(app, 'POST', '/seed/bakery', env, {
        'X-Seed-Key': SEED_KEY,
      });
      expect(res.status).toBe(403);
    });

    it('returns success with organization info', async () => {
      const res = await makeRequest(app, 'POST', '/seed/bakery', undefined, {
        'X-Seed-Key': SEED_KEY,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.organization.id).toBe('org-bakery-001');
      expect(body.data.organization.name).toBe('Boulangerie Au Pain Doré');
      expect(body.data.accounts).toHaveLength(4);
    });

    it('response does NOT contain password fields', async () => {
      const res = await makeRequest(app, 'POST', '/seed/bakery', undefined, {
        'X-Seed-Key': SEED_KEY,
      });
      const body = await res.json();
      const bodyStr = JSON.stringify(body);
      expect(bodyStr).not.toContain('password');
      expect(bodyStr).not.toContain('password_hash');
      expect(bodyStr).not.toContain('Demo@2024');
      expect(bodyStr).not.toContain('Baker@2024');
      expect(bodyStr).not.toContain('Sales@2024');
      expect(bodyStr).not.toContain('Delivery@2024');
      expect(bodyStr).not.toContain('$2a$10$');
    });

    it('accounts list includes expected roles and emails', async () => {
      const res = await makeRequest(app, 'POST', '/seed/bakery', undefined, {
        'X-Seed-Key': SEED_KEY,
      });
      const body = await res.json();
      const emails = body.data.accounts.map((a: any) => a.email);
      expect(emails).toContain('bakery-admin@perfex.io');
      expect(emails).toContain('bakery-baker@perfex.io');
      expect(emails).toContain('bakery-sales@perfex.io');
      expect(emails).toContain('bakery-delivery@perfex.io');
    });

    it('returns 500 on seeding error', async () => {
      const env = createMockEnv();
      (env.DB.prepare as any).mockImplementation(() => {
        throw new Error('Insert failed');
      });
      const res = await makeRequest(app, 'POST', '/seed/bakery', env, {
        'X-Seed-Key': SEED_KEY,
      });
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Insert failed');
    });
  });

  // ──────────────────────────────────────────
  // GET /seed/status
  // ──────────────────────────────────────────
  describe('GET /seed/status', () => {
    it('returns status with counts when data exists', async () => {
      const env = createMockEnv();
      const mockPrepare = env.DB.prepare as any;
      // Override prepare to return different values per query
      let callIndex = 0;
      mockPrepare.mockImplementation(() => {
        const stmt: any = {
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true }),
          all: vi.fn().mockResolvedValue({ results: [] }),
          raw: vi.fn().mockResolvedValue([]),
          first: vi.fn(),
        };
        // The status endpoint makes 3 queries in order:
        // 1. organizations count, 2. bakery_products count, 3. bakery_articles count
        if (callIndex === 0) {
          stmt.first = vi.fn().mockResolvedValue({ count: 1 });
        } else if (callIndex === 1) {
          stmt.first = vi.fn().mockResolvedValue({ count: 8 });
        } else if (callIndex === 2) {
          stmt.first = vi.fn().mockResolvedValue({ count: 10 });
        }
        callIndex++;
        return stmt;
      });

      const res = await makeRequest(app, 'GET', '/seed/status', env);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.hasBakeryOrg).toBe(true);
      expect(body.data.bakeryProducts).toBe(8);
      expect(body.data.bakeryArticles).toBe(10);
      expect(body.data.seeded).toBe(true);
    });

    it('returns zeroed status when no data exists', async () => {
      const env = createMockEnv();
      const mockPrepare = env.DB.prepare as any;
      mockPrepare.mockImplementation(() => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 0 }),
        run: vi.fn().mockResolvedValue({ success: true }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        raw: vi.fn().mockResolvedValue([]),
      }));

      const res = await makeRequest(app, 'GET', '/seed/status', env);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.hasBakeryOrg).toBe(false);
      expect(body.data.bakeryProducts).toBe(0);
      expect(body.data.bakeryArticles).toBe(0);
      expect(body.data.seeded).toBe(false);
    });

    it('returns fallback response on database error', async () => {
      const env = createMockEnv();
      (env.DB.prepare as any).mockImplementation(() => {
        throw new Error('Table not found');
      });

      const res = await makeRequest(app, 'GET', '/seed/status', env);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.hasBakeryOrg).toBe(false);
      expect(body.data.seeded).toBe(false);
      expect(body.error).toBe('Table not found');
    });

    it('does not require seed key authentication', async () => {
      // Status endpoint has no validateSeedAccess call
      const res = await makeRequest(app, 'GET', '/seed/status');
      expect(res.status).toBe(200);
    });
  });
});
