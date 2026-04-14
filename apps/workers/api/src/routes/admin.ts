/**
 * Admin Routes
 * Platform administration endpoints for super_admin and admin users
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, like, desc, and, sql } from 'drizzle-orm';
import { users, organizations, organizationMembers } from '@perfex/database';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware, superAdminMiddleware } from '../middleware/admin';
import { hashPassword } from '../utils/crypto';

const admin = new Hono<{ Bindings: Env }>();

// All routes require authentication
admin.use('*', authMiddleware);

// ============================================
// PLATFORM STATS (Admin & Super Admin)
// ============================================

/**
 * GET /admin/stats
 * Get platform statistics
 */
admin.get('/stats', adminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);

  try {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [orgCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(organizations);

    const [adminCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.platformRole, 'admin'));

    const [superAdminCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.platformRole, 'super_admin'));

    return c.json({
      data: {
        totalUsers: userCount.count,
        totalOrganizations: orgCount.count,
        adminCount: adminCount.count,
        superAdminCount: superAdminCount.count,
      },
    });
  } catch (error) {
    return c.json(
      { error: { code: 'FETCH_FAILED', message: 'Failed to fetch stats' } },
      500
    );
  }
});

// ============================================
// ORGANIZATION MANAGEMENT (Admin & Super Admin)
// ============================================

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  industry: z.enum(['bakery', 'healthcare', 'retail', 'services', 'manufacturing', 'other']).optional(),
  settings: z.record(z.any()).optional(),
});

/**
 * GET /admin/organizations
 * List all organizations
 */
admin.get('/organizations', adminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const search = c.req.query('search');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    let query = db
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset);

    const orgs = await query.all();

    // Get member counts for each org
    const orgsWithCounts = await Promise.all(
      orgs.map(async (org) => {
        const [memberCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(organizationMembers)
          .where(eq(organizationMembers.organizationId, org.id));

        return {
          ...org,
          settings: org.settings ? JSON.parse(org.settings as string) : null,
          memberCount: memberCount.count,
        };
      })
    );

    return c.json({ data: orgsWithCounts });
  } catch (error) {
    return c.json(
      { error: { code: 'FETCH_FAILED', message: 'Failed to fetch organizations' } },
      500
    );
  }
});

/**
 * POST /admin/organizations
 * Create a new organization
 */
admin.post('/organizations', adminMiddleware, zValidator('json', createOrganizationSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const data = c.req.valid('json');

  try {
    // Check if slug already exists
    const existing = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, data.slug))
      .get();

    if (existing) {
      return c.json(
        { error: { code: 'SLUG_EXISTS', message: 'Organization slug already exists' } },
        400
      );
    }

    const orgId = crypto.randomUUID();
    const now = new Date();

    const settings = {
      industry: data.industry || 'other',
      ...data.settings,
    };

    await db.insert(organizations).values({
      id: orgId,
      name: data.name,
      slug: data.slug,
      settings: JSON.stringify(settings),
      createdAt: now,
      updatedAt: now,
    });

    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .get();

    return c.json({
      data: {
        ...org,
        settings: org?.settings ? JSON.parse(org.settings as string) : null,
      },
    }, 201);
  } catch (error) {
    return c.json(
      { error: { code: 'CREATE_FAILED', message: 'Failed to create organization' } },
      500
    );
  }
});

/**
 * PUT /admin/organizations/:id
 * Update organization
 */
admin.put('/organizations/:id', adminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const orgId = c.req.param('id');
  const data = await c.req.json();

  try {
    const existing = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .get();

    if (!existing) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Organization not found' } },
        404
      );
    }

    await db
      .update(organizations)
      .set({
        name: data.name || existing.name,
        settings: data.settings ? JSON.stringify(data.settings) : existing.settings,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    const updated = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .get();

    return c.json({
      data: {
        ...updated,
        settings: updated?.settings ? JSON.parse(updated.settings as string) : null,
      },
    });
  } catch (error) {
    return c.json(
      { error: { code: 'UPDATE_FAILED', message: 'Failed to update organization' } },
      500
    );
  }
});

/**
 * DELETE /admin/organizations/:id
 * Delete organization
 */
admin.delete('/organizations/:id', superAdminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const orgId = c.req.param('id');

  try {
    // Delete all memberships first
    await db
      .delete(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    // Delete organization
    await db
      .delete(organizations)
      .where(eq(organizations.id, orgId));

    return c.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    return c.json(
      { error: { code: 'DELETE_FAILED', message: 'Failed to delete organization' } },
      500
    );
  }
});

// ============================================
// USER MANAGEMENT (Admin & Super Admin)
// ============================================

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  platformRole: z.enum(['user', 'admin']).default('user'),
  organizationId: z.string().optional(),
  organizationRole: z.enum(['owner', 'admin', 'member']).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  active: z.boolean().optional(),
  platformRole: z.enum(['user', 'admin']).optional(),
});

/**
 * GET /admin/users
 * List all users
 */
admin.get('/users', adminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const search = c.req.query('search');
  const role = c.req.query('role');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        platformRole: users.platformRole,
        active: users.active,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    // Get organization memberships for each user
    const usersWithOrgs = await Promise.all(
      allUsers.map(async (user) => {
        const memberships = await db
          .select({
            organizationId: organizationMembers.organizationId,
            role: organizationMembers.role,
            orgName: organizations.name,
          })
          .from(organizationMembers)
          .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
          .where(eq(organizationMembers.userId, user.id))
          .all();

        return {
          ...user,
          organizations: memberships,
        };
      })
    );

    return c.json({ data: usersWithOrgs });
  } catch (error) {
    return c.json(
      { error: { code: 'FETCH_FAILED', message: 'Failed to fetch users' } },
      500
    );
  }
});

/**
 * POST /admin/users
 * Create a new user
 */
admin.post('/users', adminMiddleware, zValidator('json', createUserSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const data = c.req.valid('json');
  const currentUserRole = c.get('platformRole');

  // Only super_admin can create admin users
  if (data.platformRole === 'admin' && currentUserRole !== 'super_admin') {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'Only super admins can create admin users' } },
      403
    );
  }

  try {
    // Check if email already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .get();

    if (existing) {
      return c.json(
        { error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } },
        400
      );
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(data.password);
    const now = new Date();

    await db.insert(users).values({
      id: userId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      platformRole: data.platformRole,
      emailVerified: true,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // Add to organization if specified
    if (data.organizationId) {
      await db.insert(organizationMembers).values({
        id: crypto.randomUUID(),
        organizationId: data.organizationId,
        userId,
        role: data.organizationRole || 'member',
        joinedAt: now,
      });
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        platformRole: users.platformRole,
        active: users.active,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    return c.json({ data: user }, 201);
  } catch (error) {
    return c.json(
      { error: { code: 'CREATE_FAILED', message: 'Failed to create user' } },
      500
    );
  }
});

/**
 * PUT /admin/users/:id
 * Update user
 */
admin.put('/users/:id', adminMiddleware, zValidator('json', updateUserSchema), async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.param('id');
  const data = c.req.valid('json');
  const currentUserRole = c.get('platformRole');

  // Only super_admin can change platform roles
  if (data.platformRole && currentUserRole !== 'super_admin') {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'Only super admins can change platform roles' } },
      403
    );
  }

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!existing) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    // Cannot modify super_admin unless you are super_admin
    if (existing.platformRole === 'super_admin' && currentUserRole !== 'super_admin') {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot modify super admin users' } },
        403
      );
    }

    await db
      .update(users)
      .set({
        firstName: data.firstName || existing.firstName,
        lastName: data.lastName || existing.lastName,
        active: data.active !== undefined ? data.active : existing.active,
        platformRole: data.platformRole || existing.platformRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const updated = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        platformRole: users.platformRole,
        active: users.active,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    return c.json({ data: updated });
  } catch (error) {
    return c.json(
      { error: { code: 'UPDATE_FAILED', message: 'Failed to update user' } },
      500
    );
  }
});

/**
 * DELETE /admin/users/:id
 * Delete user (deactivate)
 */
admin.delete('/users/:id', superAdminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.param('id');
  const currentUserId = c.get('userId');

  // Cannot delete yourself
  if (userId === currentUserId) {
    return c.json(
      { error: { code: 'FORBIDDEN', message: 'Cannot delete your own account' } },
      403
    );
  }

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!existing) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    // Cannot delete super_admin
    if (existing.platformRole === 'super_admin') {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot delete super admin users' } },
        403
      );
    }

    // Soft delete - deactivate user
    await db
      .update(users)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return c.json({ message: 'User deactivated successfully' });
  } catch (error) {
    return c.json(
      { error: { code: 'DELETE_FAILED', message: 'Failed to delete user' } },
      500
    );
  }
});

// ============================================
// ORGANIZATION MEMBER MANAGEMENT
// ============================================

/**
 * POST /admin/organizations/:orgId/members
 * Add user to organization
 */
admin.post('/organizations/:orgId/members', adminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const orgId = c.req.param('orgId');
  const { userId, role = 'member' } = await c.req.json();

  try {
    // Check if organization exists
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .get();

    if (!org) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Organization not found' } },
        404
      );
    }

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    // Check if already a member
    const existingMember = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, userId)
        )
      )
      .get();

    if (existingMember) {
      return c.json(
        { error: { code: 'ALREADY_MEMBER', message: 'User is already a member' } },
        400
      );
    }

    await db.insert(organizationMembers).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId,
      role,
      joinedAt: new Date(),
    });

    return c.json({ message: 'User added to organization successfully' }, 201);
  } catch (error) {
    return c.json(
      { error: { code: 'ADD_FAILED', message: 'Failed to add user to organization' } },
      500
    );
  }
});

/**
 * PUT /admin/organizations/:orgId/members/:userId
 * Update member role in organization
 */
admin.put('/organizations/:orgId/members/:userId', adminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const orgId = c.req.param('orgId');
  const userId = c.req.param('userId');
  const { role } = await c.req.json();

  try {
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, userId)
        )
      )
      .get();

    if (!membership) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Membership not found' } },
        404
      );
    }

    await db
      .update(organizationMembers)
      .set({ role })
      .where(eq(organizationMembers.id, membership.id));

    return c.json({ message: 'Member role updated successfully' });
  } catch (error) {
    return c.json(
      { error: { code: 'UPDATE_FAILED', message: 'Failed to update member role' } },
      500
    );
  }
});

/**
 * DELETE /admin/organizations/:orgId/members/:userId
 * Remove user from organization
 */
admin.delete('/organizations/:orgId/members/:userId', adminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const orgId = c.req.param('orgId');
  const userId = c.req.param('userId');

  try {
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, userId)
        )
      );

    return c.json({ message: 'User removed from organization successfully' });
  } catch (error) {
    return c.json(
      { error: { code: 'REMOVE_FAILED', message: 'Failed to remove user from organization' } },
      500
    );
  }
});

// ============================================
// SUPER ADMIN ONLY: ADMIN MANAGEMENT
// ============================================

/**
 * POST /admin/promote
 * Promote user to admin (Super Admin only)
 */
admin.post('/promote', superAdminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const { userId } = await c.req.json();

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    if (user.platformRole === 'admin' || user.platformRole === 'super_admin') {
      return c.json(
        { error: { code: 'ALREADY_ADMIN', message: 'User is already an admin' } },
        400
      );
    }

    await db
      .update(users)
      .set({ platformRole: 'admin', updatedAt: new Date() })
      .where(eq(users.id, userId));

    return c.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    return c.json(
      { error: { code: 'PROMOTE_FAILED', message: 'Failed to promote user' } },
      500
    );
  }
});

/**
 * POST /admin/demote
 * Demote admin to user (Super Admin only)
 */
admin.post('/demote', superAdminMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const { userId } = await c.req.json();

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        404
      );
    }

    if (user.platformRole === 'super_admin') {
      return c.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot demote super admin' } },
        403
      );
    }

    if (user.platformRole !== 'admin') {
      return c.json(
        { error: { code: 'NOT_ADMIN', message: 'User is not an admin' } },
        400
      );
    }

    await db
      .update(users)
      .set({ platformRole: 'user', updatedAt: new Date() })
      .where(eq(users.id, userId));

    return c.json({ message: 'Admin demoted to user successfully' });
  } catch (error) {
    return c.json(
      { error: { code: 'DEMOTE_FAILED', message: 'Failed to demote admin' } },
      500
    );
  }
});

export default admin;
