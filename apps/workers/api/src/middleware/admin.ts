/**
 * Admin Authorization Middleware
 * Restricts access to admin and super_admin users only
 */

import { createMiddleware } from 'hono/factory';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '@perfex/database';
import type { Env } from '../types';

/**
 * Middleware that requires user to be an admin or super_admin
 */
export const adminMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      401
    );
  }

  const db = drizzle(c.env.DB);
  const user = await db
    .select({ platformRole: users.platformRole })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user || (user.platformRole !== 'admin' && user.platformRole !== 'super_admin')) {
    return c.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      },
      403
    );
  }

  // Store platform role in context for further checks
  c.set('platformRole', user.platformRole);

  await next();
});

/**
 * Middleware that requires user to be a super_admin
 */
export const superAdminMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      401
    );
  }

  const db = drizzle(c.env.DB);
  const user = await db
    .select({ platformRole: users.platformRole })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user || user.platformRole !== 'super_admin') {
    return c.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'Super admin access required',
        },
      },
      403
    );
  }

  c.set('platformRole', user.platformRole);

  await next();
});

/**
 * Extend Hono context with platform role
 */
declare module 'hono' {
  interface ContextVariableMap {
    platformRole: 'user' | 'admin' | 'super_admin';
  }
}
