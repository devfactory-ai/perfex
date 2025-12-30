/**
 * RBAC Middleware
 * Role-Based Access Control for permissions
 * AUTH-090
 */

import { Context, Next } from 'hono';
import type { Env } from '../types';
import { RoleService } from '../services/role.service';

/**
 * Check if user has specific permission
 * Usage: app.get('/admin', checkPermission('users:create'), handler)
 */
export function checkPermission(permission: string) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const userId = c.get('userId');
    const organizationId = c.get('organizationId');

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

    try {
      const roleService = new RoleService(c.env.DB);
      const hasPermission = await roleService.hasPermission(
        userId,
        permission,
        organizationId || undefined
      );

      if (!hasPermission) {
        return c.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: `Missing required permission: ${permission}`,
            },
          },
          403
        );
      }

      await next();
    } catch {
      return c.json(
        {
          error: {
            code: 'PERMISSION_CHECK_FAILED',
            message: 'Failed to verify permissions',
          },
        },
        500
      );
    }
  };
}

/**
 * Check if user has ANY of the specified permissions
 */
export function checkAnyPermission(...permissions: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const userId = c.get('userId');
    const organizationId = c.get('organizationId');

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

    try {
      const roleService = new RoleService(c.env.DB);

      for (const permission of permissions) {
        const hasPermission = await roleService.hasPermission(
          userId,
          permission,
          organizationId || undefined
        );

        if (hasPermission) {
          await next();
          return;
        }
      }

      return c.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: `Missing required permissions: ${permissions.join(', ')}`,
          },
        },
        403
      );
    } catch {
      return c.json(
        {
          error: {
            code: 'PERMISSION_CHECK_FAILED',
            message: 'Failed to verify permissions',
          },
        },
        500
      );
    }
  };
}

/**
 * Check if user has ALL of the specified permissions
 */
export function checkAllPermissions(...permissions: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const userId = c.get('userId');
    const organizationId = c.get('organizationId');

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

    try {
      const roleService = new RoleService(c.env.DB);

      for (const permission of permissions) {
        const hasPermission = await roleService.hasPermission(
          userId,
          permission,
          organizationId || undefined
        );

        if (!hasPermission) {
          return c.json(
            {
              error: {
                code: 'FORBIDDEN',
                message: `Missing required permission: ${permission}`,
              },
            },
            403
          );
        }
      }

      await next();
    } catch {
      return c.json(
        {
          error: {
            code: 'PERMISSION_CHECK_FAILED',
            message: 'Failed to verify permissions',
          },
        },
        500
      );
    }
  };
}
