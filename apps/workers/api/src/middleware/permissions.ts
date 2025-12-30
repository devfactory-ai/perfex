// Permission middleware for role-based access control
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import { RoleService } from '../services/role.service';
import { logger } from '../utils/logger';

/**
 * Default permissions for organization member roles
 * Used when no custom roles are assigned
 */
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // Admin has all permissions
  owner: ['*'], // Owner has all permissions
  manager: [
    'users:read', 'users:create', 'users:update',
    'accounts:read', 'accounts:create', 'accounts:update', 'accounts:delete',
    'invoices:read', 'invoices:create', 'invoices:update', 'invoices:delete',
    'payments:read', 'payments:create', 'payments:update',
    'contacts:read', 'contacts:create', 'contacts:update', 'contacts:delete',
    'companies:read', 'companies:create', 'companies:update', 'companies:delete',
    'employees:read', 'employees:create', 'employees:update',
    'inventory:read', 'inventory:create', 'inventory:update',
    'dialyse:patients:read', 'dialyse:patients:create', 'dialyse:patients:update',
    'dialyse:sessions:read', 'dialyse:sessions:create', 'dialyse:sessions:update',
    'dialyse:alerts:read', 'dialyse:alerts:acknowledge',
    'dialyse:labs:read', 'dialyse:labs:create',
    'dialyse:reports:read',
    'cardiology:read', 'cardiology:create', 'cardiology:update',
    'ophthalmology:read', 'ophthalmology:create', 'ophthalmology:update',
    'documents:read', 'documents:create', 'documents:update',
    'reports:read',
  ],
  member: [
    'users:read',
    'accounts:read',
    'invoices:read',
    'contacts:read',
    'companies:read',
    'employees:read',
    'inventory:read',
    'dialyse:patients:read',
    'dialyse:sessions:read',
    'dialyse:labs:read',
    'dialyse:reports:read',
    'cardiology:read',
    'ophthalmology:read',
    'documents:read',
    'reports:read',
  ],
  viewer: [
    'users:read',
    'accounts:read',
    'invoices:read',
    'contacts:read',
    'companies:read',
    'dialyse:patients:read',
    'dialyse:reports:read',
    'documents:read',
  ],
};

/**
 * Check if a permission matches (supports wildcards)
 */
function matchesPermission(userPermission: string, requiredPermission: string): boolean {
  // Wildcard - full access
  if (userPermission === '*') {
    return true;
  }

  // Exact match
  if (userPermission === requiredPermission) {
    return true;
  }

  // Module-level wildcard (e.g., 'dialyse:*' matches 'dialyse:patients:read')
  if (userPermission.endsWith(':*')) {
    const module = userPermission.replace(':*', '');
    if (requiredPermission.startsWith(module + ':')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user has permission based on role
 */
function hasPermissionForRole(role: string, requiredPermission: string): boolean {
  const permissions = DEFAULT_ROLE_PERMISSIONS[role] || [];

  for (const perm of permissions) {
    if (matchesPermission(perm, requiredPermission)) {
      return true;
    }
  }

  return false;
}

/**
 * Middleware to check if user has required permissions
 * Uses role-based permissions from organization membership
 */
export const requirePermissions = (requiredPermissions: string[] | string) => {
  const permissionsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return createMiddleware(async (c: Context, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    const userRole = user.role || 'member';

    // Check if user has all required permissions
    for (const requiredPermission of permissionsArray) {
      if (!hasPermissionForRole(userRole, requiredPermission)) {
        logger.warn('Permission denied', {
          userId: user.id,
          userRole,
          requiredPermission,
        });

        return c.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to perform this action',
              details: {
                required: requiredPermission,
                userRole,
              },
            },
          },
          403
        );
      }
    }

    return next();
  });
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return createMiddleware(async (c: Context, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Admin users have all permissions
    if (user.role === 'admin') {
      return next();
    }

    // Check if user has any of the required permissions
    const userPermissions = user.permissions || [];
    const hasAnyPermission = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAnyPermission) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            details: {
              required: permissions,
            },
          },
        },
        403
      );
    }

    return next();
  });
};

/**
 * Middleware to check if user has a specific role
 */
export const requireRole = (role: string) => {
  return createMiddleware(async (c: Context, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    if (user.role !== role && user.role !== 'admin') {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Role '${role}' required`,
          },
        },
        403
      );
    }

    return next();
  });
};
