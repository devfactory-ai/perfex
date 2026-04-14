/**
 * Permissions Middleware Tests
 * Tests for role-based access control middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockContext, type MockContext } from '../__tests__/mocks/hono.mock';
import { requirePermissions, requireAnyPermission, requireRole } from './permissions';

// Mock the logger to avoid console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock RoleService (imported but unused in current implementation)
vi.mock('../services/role.service', () => ({
  RoleService: {},
}));

/**
 * Helper: create a mock context with a user set
 */
function createContextWithUser(user: { id: string; role: string } | null): MockContext {
  const ctx = createMockContext();
  if (user) {
    ctx.var['user'] = user;
  }
  return ctx;
}

/**
 * Helper: run a middleware and return the response (or null if next() was called)
 */
async function runMiddleware(
  middleware: ReturnType<typeof requirePermissions>,
  ctx: MockContext
): Promise<Response | null> {
  let nextCalled = false;
  const next = vi.fn(async () => {
    nextCalled = true;
  });

  const result = await middleware(ctx as any, next);

  if (nextCalled) {
    return null; // Middleware passed through
  }

  return result as Response;
}

// ─── requirePermissions ─────────────────────────────────────────────────────

describe('requirePermissions', () => {
  describe('authentication checks', () => {
    it('should return 401 if no user in context', async () => {
      const middleware = requirePermissions('users:read');
      const ctx = createContextWithUser(null);

      const response = await runMiddleware(middleware, ctx);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(401);
      const body = await response!.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('wildcard permission (*)', () => {
    it('should grant admin access to any permission', async () => {
      const middleware = requirePermissions('some:random:permission');
      const ctx = createContextWithUser({ id: 'user-1', role: 'admin' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull(); // next() called
    });

    it('should grant owner access to any permission', async () => {
      const middleware = requirePermissions('anything:goes:here');
      const ctx = createContextWithUser({ id: 'user-1', role: 'owner' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });
  });

  describe('module wildcard (e.g. bakery:*)', () => {
    it('should grant manager with bakery:* access to bakery:products:read', async () => {
      const middleware = requirePermissions('bakery:products:read');
      const ctx = createContextWithUser({ id: 'user-1', role: 'manager' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });

    it('should grant member with bakery:* access to bakery:orders:create', async () => {
      const middleware = requirePermissions('bakery:orders:create');
      const ctx = createContextWithUser({ id: 'user-1', role: 'member' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });

    it('should grant manager with dialyse wildcard-like permissions for dialyse sub-resources', async () => {
      // Manager has explicit dialyse:patients:read, not dialyse:*
      const middleware = requirePermissions('dialyse:patients:read');
      const ctx = createContextWithUser({ id: 'user-1', role: 'manager' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });
  });

  describe('exact match', () => {
    it('should grant manager access to users:read (exact match)', async () => {
      const middleware = requirePermissions('users:read');
      const ctx = createContextWithUser({ id: 'user-1', role: 'manager' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });

    it('should grant viewer access to documents:read', async () => {
      const middleware = requirePermissions('documents:read');
      const ctx = createContextWithUser({ id: 'user-1', role: 'viewer' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });
  });

  describe('non-matching permissions', () => {
    it('should deny manager access to a permission not in their list', async () => {
      const middleware = requirePermissions('system:admin:settings');
      const ctx = createContextWithUser({ id: 'user-1', role: 'manager' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
      const body = await response!.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('should deny viewer access to users:create (write operation)', async () => {
      const middleware = requirePermissions('users:create');
      const ctx = createContextWithUser({ id: 'user-1', role: 'viewer' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
    });
  });

  describe('member role read-only checks', () => {
    it('should grant member access to accounts:read', async () => {
      const middleware = requirePermissions('accounts:read');
      const ctx = createContextWithUser({ id: 'user-1', role: 'member' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });

    it('should deny member access to accounts:create (write operation)', async () => {
      const middleware = requirePermissions('accounts:create');
      const ctx = createContextWithUser({ id: 'user-1', role: 'member' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
    });

    it('should deny member access to accounts:delete', async () => {
      const middleware = requirePermissions('accounts:delete');
      const ctx = createContextWithUser({ id: 'user-1', role: 'member' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
    });
  });

  describe('viewer role limited to read-only', () => {
    it('should grant viewer access to invoices:read', async () => {
      const middleware = requirePermissions('invoices:read');
      const ctx = createContextWithUser({ id: 'user-1', role: 'viewer' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });

    it('should deny viewer access to invoices:create', async () => {
      const middleware = requirePermissions('invoices:create');
      const ctx = createContextWithUser({ id: 'user-1', role: 'viewer' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
    });

    it('should deny viewer access to employees:read (not in viewer list)', async () => {
      const middleware = requirePermissions('employees:read');
      const ctx = createContextWithUser({ id: 'user-1', role: 'viewer' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
    });
  });

  describe('multiple required permissions (all must match)', () => {
    it('should pass when user has all required permissions', async () => {
      const middleware = requirePermissions(['users:read', 'accounts:read']);
      const ctx = createContextWithUser({ id: 'user-1', role: 'manager' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });

    it('should fail if user lacks one of the required permissions', async () => {
      const middleware = requirePermissions(['users:read', 'system:admin:settings']);
      const ctx = createContextWithUser({ id: 'user-1', role: 'manager' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
      const body = await response!.json();
      expect(body.error.details.required).toBe('system:admin:settings');
    });

    it('should pass for admin even with multiple exotic permissions', async () => {
      const middleware = requirePermissions(['x:y:z', 'a:b:c', 'foo:bar']);
      const ctx = createContextWithUser({ id: 'user-1', role: 'admin' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });
  });

  describe('string vs array argument', () => {
    it('should accept a single string permission', async () => {
      const middleware = requirePermissions('users:read');
      const ctx = createContextWithUser({ id: 'user-1', role: 'manager' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull();
    });
  });

  describe('unknown role defaults to member', () => {
    it('should treat a user with no role as member', async () => {
      const middleware = requirePermissions('users:read');
      const ctx = createContextWithUser({ id: 'user-1', role: '' });
      // The code does: user.role || 'member'
      // Empty string is falsy, so it falls back to 'member'

      const response = await runMiddleware(middleware, ctx);

      expect(response).toBeNull(); // member has users:read
    });

    it('should deny unknown role permissions not in member list', async () => {
      const middleware = requirePermissions('users:create');
      const ctx = createContextWithUser({ id: 'user-1', role: 'unknown_role' });

      const response = await runMiddleware(middleware, ctx);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
    });
  });
});

// ─── requireAnyPermission ───────────────────────────────────────────────────

describe('requireAnyPermission', () => {
  it('should return 401 if no user in context', async () => {
    const middleware = requireAnyPermission(['users:read', 'users:create']);
    const ctx = createContextWithUser(null);

    const response = await runMiddleware(middleware, ctx);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(401);
    const body = await response!.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should pass for admin regardless of permissions', async () => {
    const middleware = requireAnyPermission(['nonexistent:permission']);
    const ctx = createContextWithUser({ id: 'user-1', role: 'admin' });

    const response = await runMiddleware(middleware, ctx);

    expect(response).toBeNull();
  });

  it('should pass if user has one of the required permissions', async () => {
    const middleware = requireAnyPermission(['system:admin', 'users:read']);
    const ctx = createContextWithUser({ id: 'user-1', role: 'viewer' });

    const response = await runMiddleware(middleware, ctx);

    expect(response).toBeNull(); // viewer has users:read
  });

  it('should deny if user has none of the required permissions', async () => {
    const middleware = requireAnyPermission(['system:admin', 'system:config']);
    const ctx = createContextWithUser({ id: 'user-1', role: 'viewer' });

    const response = await runMiddleware(middleware, ctx);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
    const body = await response!.json();
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.details.required).toEqual(['system:admin', 'system:config']);
  });

  it('should pass if module wildcard covers one of the permissions', async () => {
    const middleware = requireAnyPermission(['bakery:sales:read', 'system:admin']);
    const ctx = createContextWithUser({ id: 'user-1', role: 'member' });

    const response = await runMiddleware(middleware, ctx);

    expect(response).toBeNull(); // member has bakery:*
  });
});

// ─── requireRole ────────────────────────────────────────────────────────────

describe('requireRole', () => {
  it('should return 401 if no user in context', async () => {
    const middleware = requireRole('manager');
    const ctx = createContextWithUser(null);

    const response = await runMiddleware(middleware, ctx);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(401);
    const body = await response!.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('should pass when user role matches required role', async () => {
    const middleware = requireRole('manager');
    const ctx = createContextWithUser({ id: 'user-1', role: 'manager' });

    const response = await runMiddleware(middleware, ctx);

    expect(response).toBeNull();
  });

  it('should pass for admin regardless of required role', async () => {
    const middleware = requireRole('owner');
    const ctx = createContextWithUser({ id: 'user-1', role: 'admin' });

    const response = await runMiddleware(middleware, ctx);

    expect(response).toBeNull();
  });

  it('should deny when user role does not match required role', async () => {
    const middleware = requireRole('owner');
    const ctx = createContextWithUser({ id: 'user-1', role: 'member' });

    const response = await runMiddleware(middleware, ctx);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
    const body = await response!.json();
    expect(body.error.message).toBe("Role 'owner' required");
  });

  it('should deny viewer when manager role is required', async () => {
    const middleware = requireRole('manager');
    const ctx = createContextWithUser({ id: 'user-1', role: 'viewer' });

    const response = await runMiddleware(middleware, ctx);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
  });

  it('should deny owner when checking is not admin (owner != admin bypass only)', async () => {
    // owner role does NOT bypass requireRole checks (only admin does)
    const middleware = requireRole('manager');
    const ctx = createContextWithUser({ id: 'user-1', role: 'owner' });

    const response = await runMiddleware(middleware, ctx);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
  });
});
