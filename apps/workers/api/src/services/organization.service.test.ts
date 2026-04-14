/**
 * Organization Service Tests
 *
 * Mocks the drizzle-orm/d1 module to intercept all DB operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationService } from './organization.service';
import { createMockD1Database, createMockKVNamespace } from '../__tests__/mocks/database.mock';
import { testOrganization, testUser } from '../__tests__/mocks/fixtures';

// Response queue consumed by get/all/run calls
let callIndex = 0;
let responses: Array<{ get?: any; all?: any[]; run?: any }> = [];

function nextResponse(type: 'get' | 'all' | 'run') {
  const idx = callIndex++;
  const resp = idx < responses.length ? responses[idx] : {};
  if (type === 'get') return resp.get ?? undefined;
  if (type === 'all') return resp.all ?? [];
  return resp.run ?? { changes: 1 };
}

/**
 * Create a chainable query builder mock.
 * - select/from/where/innerJoin/set return `this` (chainable)
 * - get/all return promises consuming the response queue
 * - insert().values(), update().set().where(), delete().where() are thenable
 *   (await-ing them consumes a 'run' response)
 */
function createQueryBuilder() {
  let isWrite = false; // true after insert/update/delete

  function makeThenableBuilder(): any {
    const builder: any = new Proxy({}, {
      get(_target, prop) {
        // Terminal read operations
        if (prop === 'get') {
          return () => Promise.resolve(nextResponse('get'));
        }
        if (prop === 'all') {
          return () => Promise.resolve(nextResponse('all'));
        }
        if (prop === 'run') {
          return () => Promise.resolve(nextResponse('run'));
        }

        // Make await-able for write operations (insert/update/delete chains)
        if (prop === 'then') {
          if (isWrite) {
            // Consume a 'run' response when awaited
            const result = Promise.resolve(nextResponse('run'));
            return result.then.bind(result);
          }
          return undefined; // Not thenable for select chains
        }

        // Track write operations
        if (prop === 'insert' || prop === 'update' || prop === 'delete') {
          isWrite = true;
          return () => builder;
        }

        if (prop === 'select') {
          isWrite = false;
          return (...args: any[]) => builder;
        }

        // All other chainable methods
        return (..._args: any[]) => builder;
      },
    });
    return builder;
  }

  return makeThenableBuilder();
}

let mockDrizzleDb: any;

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn().mockImplementation(() => mockDrizzleDb),
}));

vi.stubGlobal('crypto', {
  randomUUID: vi.fn().mockReturnValue('mock-uuid-001'),
});

vi.mock('../utils/crypto', () => ({
  generateRandomToken: vi.fn().mockReturnValue('mock-invitation-token'),
}));

function setupResponses(r: Array<{ get?: any; all?: any[]; run?: any }>) {
  callIndex = 0;
  responses = r;
}

describe('OrganizationService', () => {
  let service: OrganizationService;
  let mockDb: D1Database;
  let mockCache: KVNamespace;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockD1Database();
    mockCache = createMockKVNamespace();
    mockDrizzleDb = createQueryBuilder();
    callIndex = 0;
    responses = [];
    service = new OrganizationService(mockDb, mockCache);
  });

  describe('constructor', () => {
    it('should create an OrganizationService instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(OrganizationService);
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create an organization and add creator as owner', async () => {
      const createdOrg = {
        id: 'mock-uuid-001',
        name: 'New Organization',
        slug: 'new-organization',
        logoUrl: null,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setupResponses([
        { get: undefined },        // 0: slug check - not found
        { run: { changes: 1 } },   // 1: insert organization (thenable await)
        { run: { changes: 1 } },   // 2: insert member (thenable await)
        { get: createdOrg },        // 3: select created org
      ]);

      const result = await service.create(
        { name: 'New Organization' } as any,
        testUser.id
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid-001');
      expect(result.name).toBe('New Organization');
      expect(result.slug).toBe('new-organization');
    });

    it('should throw if slug already exists', async () => {
      setupResponses([
        { get: { id: 'existing-org', slug: 'new-organization' } },
      ]);

      await expect(
        service.create({ name: 'New Organization' } as any, testUser.id)
      ).rejects.toThrow('Organization slug already exists');
    });

    it('should use provided slug instead of generating one', async () => {
      const createdOrg = {
        id: 'mock-uuid-001',
        name: 'My Org',
        slug: 'custom-slug',
        logoUrl: null,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setupResponses([
        { get: undefined },
        { run: { changes: 1 } },
        { run: { changes: 1 } },
        { get: createdOrg },
      ]);

      const result = await service.create(
        { name: 'My Org', slug: 'custom-slug' } as any,
        testUser.id
      );

      expect(result.slug).toBe('custom-slug');
    });

    it('should throw if created org cannot be retrieved', async () => {
      setupResponses([
        { get: undefined },
        { run: { changes: 1 } },
        { run: { changes: 1 } },
        { get: undefined },
      ]);

      await expect(
        service.create({ name: 'New Org' } as any, testUser.id)
      ).rejects.toThrow('Failed to create organization');
    });
  });

  // ---------------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------------
  describe('getById', () => {
    it('should return organization when user has access', async () => {
      const orgData = {
        id: testOrganization.id,
        name: testOrganization.name,
        slug: testOrganization.slug,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { get: orgData },
      ]);

      const result = await service.getById(testOrganization.id, testUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(testOrganization.id);
      expect(result.name).toBe(testOrganization.name);
    });

    it('should throw when user does not have access', async () => {
      setupResponses([{ get: undefined }]);

      await expect(
        service.getById(testOrganization.id, 'unauthorized-user')
      ).rejects.toThrow('Organization not found or access denied');
    });

    it('should throw when organization does not exist', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: 'x', userId: testUser.id, role: 'owner' } },
        { get: undefined },
      ]);

      await expect(
        service.getById('non-existent', testUser.id)
      ).rejects.toThrow('Organization not found');
    });

    it('should parse settings JSON when present', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'member' } },
        { get: { id: testOrganization.id, name: testOrganization.name, slug: testOrganization.slug, settings: '{"theme":"dark"}', createdAt: new Date(), updatedAt: new Date() } },
      ]);

      const result = await service.getById(testOrganization.id, testUser.id);
      expect(result.settings).toEqual({ theme: 'dark' });
    });
  });

  // ---------------------------------------------------------------------------
  // getUserOrganizations (list)
  // ---------------------------------------------------------------------------
  describe('getUserOrganizations', () => {
    it('should return empty array when user has no organizations', async () => {
      setupResponses([{ all: [] }]);

      const result = await service.getUserOrganizations(testUser.id);
      expect(result).toEqual([]);
    });

    it('should return organizations with stats', async () => {
      const orgRow = {
        org: {
          id: testOrganization.id,
          name: testOrganization.name,
          slug: testOrganization.slug,
          settings: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        member: {
          id: 'm1',
          organizationId: testOrganization.id,
          userId: testUser.id,
          role: 'owner',
        },
      };

      setupResponses([
        { all: [orgRow] },
        { all: [{ id: 'm1' }, { id: 'm2' }] },
        { get: { user: { firstName: 'Test', lastName: 'Owner', email: 'owner@test.com' } } },
      ]);

      const result = await service.getUserOrganizations(testUser.id);
      expect(result.length).toBe(1);
      expect(result[0].memberCount).toBe(2);
      expect(result[0].ownerName).toBe('Test Owner');
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update organization when user is owner', async () => {
      const updatedOrg = {
        id: testOrganization.id,
        name: 'Updated Name',
        slug: testOrganization.slug,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setupResponses([
        // update permission check
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        // update query (thenable)
        { run: { changes: 1 } },
        // getById -> membership check
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        // getById -> org select
        { get: updatedOrg },
      ]);

      const result = await service.update(testOrganization.id, testUser.id, { name: 'Updated Name' } as any);
      expect(result.name).toBe('Updated Name');
    });

    it('should update organization when user is admin', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'admin' } },
        { run: { changes: 1 } },
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'admin' } },
        { get: { id: testOrganization.id, name: 'Admin Updated', slug: testOrganization.slug, settings: null, createdAt: new Date(), updatedAt: new Date() } },
      ]);

      const result = await service.update(testOrganization.id, testUser.id, { name: 'Admin Updated' } as any);
      expect(result.name).toBe('Admin Updated');
    });

    it('should throw when user is a regular member', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'member' } },
      ]);

      await expect(
        service.update(testOrganization.id, testUser.id, { name: 'X' } as any)
      ).rejects.toThrow('Permission denied');
    });

    it('should throw when user is not a member', async () => {
      setupResponses([{ get: undefined }]);

      await expect(
        service.update(testOrganization.id, 'stranger', { name: 'X' } as any)
      ).rejects.toThrow('Permission denied');
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete organization when user is owner', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { run: { changes: 3 } }, // delete members (thenable)
        { run: { changes: 1 } }, // delete org (thenable)
      ]);

      await expect(service.delete(testOrganization.id, testUser.id)).resolves.toBeUndefined();
    });

    it('should throw when user is admin (not owner)', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'admin' } },
      ]);

      await expect(
        service.delete(testOrganization.id, testUser.id)
      ).rejects.toThrow('Only organization owner can delete the organization');
    });

    it('should throw when user is not a member', async () => {
      setupResponses([{ get: undefined }]);

      await expect(
        service.delete(testOrganization.id, 'stranger')
      ).rejects.toThrow('Only organization owner can delete the organization');
    });
  });

  // ---------------------------------------------------------------------------
  // getMembers
  // ---------------------------------------------------------------------------
  describe('getMembers', () => {
    it('should throw when user does not have access', async () => {
      setupResponses([{ get: undefined }]);

      await expect(
        service.getMembers(testOrganization.id, 'unauthorized-user')
      ).rejects.toThrow('Access denied');
    });

    it('should return members when user has access', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'member' } },
        {
          all: [
            {
              member: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner', joinedAt: new Date() },
              user: { id: testUser.id, email: testUser.email, firstName: 'Test', lastName: 'User', avatarUrl: null },
            },
          ],
        },
      ]);

      const members = await service.getMembers(testOrganization.id, testUser.id);
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBe(1);
      expect(members[0].role).toBe('owner');
      expect(members[0].user.email).toBe(testUser.email);
    });
  });

  // ---------------------------------------------------------------------------
  // inviteMember (addMember)
  // ---------------------------------------------------------------------------
  describe('inviteMember', () => {
    it('should create invitation when user is owner', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { get: undefined }, // invited user not found by email
      ]);

      const result = await service.inviteMember(
        testOrganization.id,
        testUser.id,
        { email: 'newuser@example.com', role: 'member' } as any
      );

      expect(result.invitationToken).toBe('mock-invitation-token');
      expect(mockCache.put).toHaveBeenCalledWith(
        'invitation:mock-invitation-token',
        expect.any(String),
        { expirationTtl: 604800 }
      );
    });

    it('should create invitation when user is admin', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'admin' } },
        { get: undefined },
      ]);

      const result = await service.inviteMember(
        testOrganization.id,
        testUser.id,
        { email: 'new@example.com', role: 'member' } as any
      );

      expect(result.invitationToken).toBe('mock-invitation-token');
    });

    it('should throw when user lacks permission', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'member' } },
      ]);

      await expect(
        service.inviteMember(testOrganization.id, testUser.id, { email: 'x@y.com', role: 'member' } as any)
      ).rejects.toThrow('Permission denied');
    });

    it('should throw when invited user is already a member', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { get: { id: 'existing-user-id', email: 'existing@example.com' } },
        { get: { id: 'm2', organizationId: testOrganization.id, userId: 'existing-user-id', role: 'member' } },
      ]);

      await expect(
        service.inviteMember(testOrganization.id, testUser.id, { email: 'existing@example.com', role: 'member' } as any)
      ).rejects.toThrow('User is already a member of this organization');
    });
  });

  // ---------------------------------------------------------------------------
  // removeMember
  // ---------------------------------------------------------------------------
  describe('removeMember', () => {
    it('should remove a member when user is owner', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { get: { id: 'm2', organizationId: testOrganization.id, userId: 'target-user', role: 'member' } },
        { run: { changes: 1 } }, // delete (thenable)
      ]);

      await expect(
        service.removeMember(testOrganization.id, 'target-user', testUser.id)
      ).resolves.toBeUndefined();
    });

    it('should throw when user lacks permission', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'member' } },
      ]);

      await expect(
        service.removeMember(testOrganization.id, 'target-user', testUser.id)
      ).rejects.toThrow('Permission denied');
    });

    it('should throw when target member not found', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { get: undefined },
      ]);

      await expect(
        service.removeMember(testOrganization.id, 'non-existent', testUser.id)
      ).rejects.toThrow('Member not found');
    });

    it('should throw when trying to remove owner', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { get: { id: 'm-owner', organizationId: testOrganization.id, userId: 'owner-user', role: 'owner' } },
      ]);

      await expect(
        service.removeMember(testOrganization.id, 'owner-user', testUser.id)
      ).rejects.toThrow('Cannot remove organization owner');
    });
  });

  // ---------------------------------------------------------------------------
  // updateMemberRole
  // ---------------------------------------------------------------------------
  describe('updateMemberRole', () => {
    it('should update member role when user is owner', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { get: { id: 'm2', organizationId: testOrganization.id, userId: 'target-user', role: 'member' } },
        { run: { changes: 1 } }, // update (thenable)
      ]);

      await expect(
        service.updateMemberRole(testOrganization.id, 'target-user', testUser.id, { role: 'admin' } as any)
      ).resolves.toBeUndefined();
    });

    it('should throw when user lacks permission', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'member' } },
      ]);

      await expect(
        service.updateMemberRole(testOrganization.id, 'target-user', testUser.id, { role: 'admin' } as any)
      ).rejects.toThrow('Permission denied');
    });

    it('should throw when target member not found', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { get: undefined },
      ]);

      await expect(
        service.updateMemberRole(testOrganization.id, 'non-existent', testUser.id, { role: 'admin' } as any)
      ).rejects.toThrow('Member not found');
    });

    it('should throw when trying to change owner role', async () => {
      setupResponses([
        { get: { id: 'm1', organizationId: testOrganization.id, userId: testUser.id, role: 'owner' } },
        { get: { id: 'm-owner', organizationId: testOrganization.id, userId: 'owner-user', role: 'owner' } },
      ]);

      await expect(
        service.updateMemberRole(testOrganization.id, 'owner-user', testUser.id, { role: 'admin' } as any)
      ).rejects.toThrow('Cannot change owner role');
    });
  });
});
