/**
 * Authentication Middleware
 * Verify JWT tokens and protect routes
 */

import { Context, Next } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { verifyToken } from '../utils/crypto';
import type { Env } from '../types';
import type { AccessTokenPayload } from '@perfex/shared';
import { organizationMembers, companies } from '@perfex/database';

/**
 * Extend Hono context with user data
 */
declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
    organizationId: string | null;
    realOrganizationId: string | null; // The actual organization ID (org-xxx)
    companyIds: string[];
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

    // Fetch organization ID - validate user membership for security
    const requestedOrgId = c.req.header('x-organization-id') || null;
    let organizationId: string | null = null;

    // Always lookup user's organization memberships for validation
    try {
      const db = drizzle(c.env.DB);
      const memberships = await db
        .select({ organizationId: organizationMembers.organizationId })
        .from(organizationMembers)
        .where(eq(organizationMembers.userId, payload.sub));

      // If a specific organization is requested via header, validate membership
      if (requestedOrgId) {
        const hasAccess = memberships.some(m => m.organizationId === requestedOrgId);
        if (hasAccess) {
          organizationId = requestedOrgId;
        } else {
          // SECURITY: User doesn't belong to the requested organization
          return c.json(
            {
              error: {
                code: 'FORBIDDEN',
                message: 'Access denied to this organization',
              },
            },
            403
          );
        }
      } else if (memberships.length > 0) {
        // No specific org requested - use user's first organization
        organizationId = memberships[0].organizationId;
      }
    } catch {
      // Continue without organization - some routes may not require it
    }

    // Fetch company IDs for this organization
    let companyIds: string[] = [];
    if (organizationId) {
      try {
        const db = drizzle(c.env.DB);
        const orgCompanies = await db
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.organizationId, organizationId));
        companyIds = orgCompanies.map((c) => c.id);
      } catch {
        // Continue if company lookup fails
      }
    }

    // Add user data to context
    c.set('userId', payload.sub);
    c.set('userEmail', payload.email);
    // Store the real organization ID for modules that need it (like dialyse)
    c.set('realOrganizationId', organizationId);
    // For healthcare modules that use company_id, use the first company ID
    // This provides backward compatibility with routes using organizationId as company filter
    c.set('organizationId', companyIds.length > 0 ? companyIds[0] : organizationId);
    c.set('companyIds', companyIds);

    // Fetch user's actual role from organization membership
    let userRole = 'member'; // Default role
    if (organizationId) {
      try {
        const db = drizzle(c.env.DB);
        const membership = await db
          .select({ role: organizationMembers.role })
          .from(organizationMembers)
          .where(eq(organizationMembers.userId, payload.sub))
          .limit(1);

        if (membership.length > 0 && membership[0].role) {
          userRole = membership[0].role;
        }
      } catch (error) {
        // Continue with default role if lookup fails
      }
    }

    // Set user object with actual role from database
    c.set('user', {
      id: payload.sub,
      email: payload.email,
      role: userRole,
      permissions: [], // Will be populated by RBAC middleware when checking specific permissions
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
