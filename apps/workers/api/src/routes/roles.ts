/**
 * Roles Routes
 * Custom roles and permissions management
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types';
import { RoleService } from '../services/role.service';
import { authMiddleware } from '../middleware/auth';
import {
  createRoleSchema,
  updateRoleSchema,
} from '@perfex/shared';

const roles = new Hono<{ Bindings: Env }>();

// All routes require authentication
roles.use('*', authMiddleware);

/**
 * GET /roles
 * Get roles (optionally filtered by organization)
 * AUTH-086
 */
roles.get('/', async (c) => {
  const userId = c.get('userId');
  const organizationId = c.req.query('organizationId');

  try {
    const roleService = new RoleService(c.env.DB);
    const rolesList = await roleService.list(organizationId, userId);

    return c.json(rolesList);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get roles';

    return c.json(
      {
        error: {
          code: 'FETCH_FAILED',
          message,
        },
      },
      400
    );
  }
});

/**
 * POST /roles
 * Create a custom role
 * AUTH-087
 */
roles.post('/', zValidator('json', createRoleSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  try {
    const roleService = new RoleService(c.env.DB);
    const role = await roleService.create(data, userId);

    return c.json(role, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create role';

    return c.json(
      {
        error: {
          code: 'CREATE_FAILED',
          message,
        },
      },
      400
    );
  }
});

/**
 * PUT /roles/:id
 * Update role
 * AUTH-088
 */
roles.put('/:id', zValidator('json', updateRoleSchema), async (c) => {
  const userId = c.get('userId');
  const roleId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const roleService = new RoleService(c.env.DB);
    const role = await roleService.update(roleId, data, userId);

    return c.json(role);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update role';

    return c.json(
      {
        error: {
          code: 'UPDATE_FAILED',
          message,
        },
      },
      400
    );
  }
});

/**
 * DELETE /roles/:id
 * Delete role
 * AUTH-089
 */
roles.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const roleId = c.req.param('id');

  try {
    const roleService = new RoleService(c.env.DB);
    await roleService.delete(roleId, userId);

    return c.json({ message: 'Role deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete role';

    return c.json(
      {
        error: {
          code: 'DELETE_FAILED',
          message,
        },
      },
      403
    );
  }
});

export default roles;
