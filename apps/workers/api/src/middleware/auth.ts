/**
 * Authentication Middleware
 * Verify JWT tokens and protect routes
 */

import { Context, Next } from 'hono';
import { verifyToken } from '../utils/crypto';
import type { Env } from '../index';
import type { AccessTokenPayload } from '@perfex/shared';

/**
 * Extend Hono context with user data
 */
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
    organizationId: string | null;
    user: {
      id: string;
      email: string;
      role: string;
      permissions: string[];
    };
  }
}

/**
 * Auth middleware
 * Verifies JWT token and adds user data to context
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  // Get token from Authorization header
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      },
      401
    );
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    // Verify token
    const payload = verifyToken<AccessTokenPayload>(token, c.env.JWT_SECRET);

    if (payload.type !== 'access') {
      return c.json(
        {
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token type',
          },
        },
        401
      );
    }

    // Extract organization ID from header
    const organizationId = c.req.header('x-organization-id') || null;

    // Add user data to context
    c.set('userId', payload.sub);
    c.set('userEmail', payload.email);
    c.set('organizationId', organizationId);

    // Set user object with admin role (for now, until we implement proper RBAC)
    c.set('user', {
      id: payload.sub,
      email: payload.email,
      role: 'admin', // Grant admin access to all authenticated users for now
      permissions: [], // Will be populated when RBAC is fully implemented
    });

    await next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token verification failed';

    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message,
        },
      },
      401
    );
  }
}

/**
 * Optional auth middleware
 * Adds user data to context if token is valid, but doesn't fail if missing
 */
export async function optionalAuthMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const payload = verifyToken<AccessTokenPayload>(token, c.env.JWT_SECRET);

      if (payload.type === 'access') {
        c.set('userId', payload.sub);
        c.set('userEmail', payload.email);
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  await next();
}

// Re-export permission middleware for convenience
export { requirePermissions, requireAnyPermission, requireRole } from './permissions';
export { requirePermissions as requirePermission } from './permissions'; // Alias

// Export auth middleware with alternative name
export const requireAuth = authMiddleware;
