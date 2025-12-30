/**
 * Organization Routes
 * CRUD operations for organizations and member management
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types';
import { OrganizationService } from '../services/organization.service';
import { authMiddleware } from '../middleware/auth';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '@perfex/shared';

const organizations = new Hono<{ Bindings: Env }>();

// All routes require authentication
organizations.use('*', authMiddleware);

/**
 * POST /organizations
 * Create a new organization
 * AUTH-076
 */
organizations.post('/', zValidator('json', createOrganizationSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  try {
    const orgService = new OrganizationService(c.env.DB, c.env.CACHE);
    const organization = await orgService.create(data, userId);

    return c.json(organization, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create organization';

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
 * GET /organizations
 * Get user's organizations
 * AUTH-077
 */
organizations.get('/', async (c) => {
  const userId = c.get('userId');

  try {
    const orgService = new OrganizationService(c.env.DB, c.env.CACHE);
    const organizations = await orgService.getUserOrganizations(userId);

    return c.json(organizations);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get organizations';

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
 * GET /organizations/:id
 * Get organization by ID
 * AUTH-078
 */
organizations.get('/:id', async (c) => {
  const userId = c.get('userId');
  const orgId = c.req.param('id');

  try {
    const orgService = new OrganizationService(c.env.DB, c.env.CACHE);
    const organization = await orgService.getById(orgId, userId);

    return c.json(organization);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get organization';

    return c.json(
      {
        error: {
          code: 'NOT_FOUND',
          message,
        },
      },
      404
    );
  }
});

/**
 * PUT /organizations/:id
 * Update organization
 * AUTH-079
 */
organizations.put('/:id', zValidator('json', updateOrganizationSchema), async (c) => {
  const userId = c.get('userId');
  const orgId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const orgService = new OrganizationService(c.env.DB, c.env.CACHE);
    const organization = await orgService.update(orgId, userId, data);

    return c.json(organization);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update organization';

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
 * DELETE /organizations/:id
 * Delete organization
 * AUTH-080
 */
organizations.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const orgId = c.req.param('id');

  try {
    const orgService = new OrganizationService(c.env.DB, c.env.CACHE);
    await orgService.delete(orgId, userId);

    return c.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete organization';

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

/**
 * POST /organizations/:id/invite
 * Invite member to organization
 * AUTH-081
 */
organizations.post('/:id/invite', zValidator('json', inviteMemberSchema), async (c) => {
  const userId = c.get('userId');
  const orgId = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const orgService = new OrganizationService(c.env.DB, c.env.CACHE);
    const result = await orgService.inviteMember(orgId, userId, data);

    return c.json({
      message: 'Invitation sent successfully',
      invitationToken: result.invitationToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to invite member';

    return c.json(
      {
        error: {
          code: 'INVITE_FAILED',
          message,
        },
      },
      400
    );
  }
});

/**
 * GET /organizations/:id/members
 * Get organization members
 * AUTH-082
 */
organizations.get('/:id/members', async (c) => {
  const userId = c.get('userId');
  const orgId = c.req.param('id');

  try {
    const orgService = new OrganizationService(c.env.DB, c.env.CACHE);
    const members = await orgService.getMembers(orgId, userId);

    return c.json(members);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get members';

    return c.json(
      {
        error: {
          code: 'FETCH_FAILED',
          message,
        },
      },
      403
    );
  }
});

/**
 * PUT /organizations/:id/members/:userId
 * Update member role
 * AUTH-083
 */
organizations.put('/:id/members/:userId', zValidator('json', updateMemberRoleSchema), async (c) => {
  const userId = c.get('userId');
  const orgId = c.req.param('id');
  const targetUserId = c.req.param('userId');
  const data = c.req.valid('json');

  try {
    const orgService = new OrganizationService(c.env.DB, c.env.CACHE);
    await orgService.updateMemberRole(orgId, targetUserId, userId, data);

    return c.json({ message: 'Member role updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update member role';

    return c.json(
      {
        error: {
          code: 'UPDATE_FAILED',
          message,
        },
      },
      403
    );
  }
});

/**
 * DELETE /organizations/:id/members/:userId
 * Remove member from organization
 * AUTH-084
 */
organizations.delete('/:id/members/:userId', async (c) => {
  const userId = c.get('userId');
  const orgId = c.req.param('id');
  const targetUserId = c.req.param('userId');

  try {
    const orgService = new OrganizationService(c.env.DB, c.env.CACHE);
    await orgService.removeMember(orgId, targetUserId, userId);

    return c.json({ message: 'Member removed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove member';

    return c.json(
      {
        error: {
          code: 'REMOVE_FAILED',
          message,
        },
      },
      403
    );
  }
});

export default organizations;
