// Permission middleware for role-based access control
import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';

/**
 * Middleware to check if user has required permissions
 */
export const requirePermissions = (requiredPermissions: string[]) => {
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

    // Check if user has all required permissions
    const userPermissions = user.permissions || [];
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            details: {
              required: requiredPermissions,
              missing: requiredPermissions.filter(p => !userPermissions.includes(p)),
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
