/**
 * Organization types
 */

import type { OrganizationRole } from './auth';

/**
 * Organization
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization member with user info
 */
export interface OrganizationMemberWithUser {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

/**
 * Organization with member count
 */
export interface OrganizationWithStats extends Organization {
  memberCount: number;
  ownerName: string;
}

/**
 * Invitation
 */
export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Permission definition
 */
export interface Permission {
  id: string;
  module: string;
  action: string;
  description: string;
}

/**
 * Common permissions
 */
export const PERMISSIONS = {
  // Users
  'users:read': 'View users',
  'users:create': 'Create users',
  'users:update': 'Update users',
  'users:delete': 'Delete users',

  // Organizations
  'organizations:read': 'View organization',
  'organizations:update': 'Update organization',
  'organizations:delete': 'Delete organization',
  'organizations:members:read': 'View members',
  'organizations:members:invite': 'Invite members',
  'organizations:members:update': 'Update member roles',
  'organizations:members:remove': 'Remove members',

  // Finance
  'finance:invoices:read': 'View invoices',
  'finance:invoices:create': 'Create invoices',
  'finance:invoices:update': 'Update invoices',
  'finance:invoices:delete': 'Delete invoices',
  'finance:payments:read': 'View payments',
  'finance:payments:create': 'Create payments',

  // CRM
  'crm:contacts:read': 'View contacts',
  'crm:contacts:create': 'Create contacts',
  'crm:contacts:update': 'Update contacts',
  'crm:contacts:delete': 'Delete contacts',
  'crm:opportunities:read': 'View opportunities',
  'crm:opportunities:create': 'Create opportunities',
  'crm:opportunities:update': 'Update opportunities',
  'crm:opportunities:delete': 'Delete opportunities',

  // Settings
  'settings:read': 'View settings',
  'settings:update': 'Update settings',

  // AI Features
  'ai:chat:use': 'Use AI chat assistant',
  'ai:search:use': 'Use AI semantic search',
  'ai:extract:use': 'Use AI data extraction',
  'ai:insights:use': 'Use AI insights',
  'ai:usage:view': 'View AI usage statistics',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/**
 * Default role permissions
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<OrganizationRole, PermissionKey[]> = {
  owner: Object.keys(PERMISSIONS) as PermissionKey[], // All permissions
  admin: [
    'users:read',
    'users:create',
    'users:update',
    'organizations:read',
    'organizations:update',
    'organizations:members:read',
    'organizations:members:invite',
    'organizations:members:update',
    'finance:invoices:read',
    'finance:invoices:create',
    'finance:invoices:update',
    'finance:payments:read',
    'finance:payments:create',
    'crm:contacts:read',
    'crm:contacts:create',
    'crm:contacts:update',
    'crm:opportunities:read',
    'crm:opportunities:create',
    'crm:opportunities:update',
    'settings:read',
    'ai:chat:use',
    'ai:search:use',
    'ai:extract:use',
    'ai:insights:use',
    'ai:usage:view',
  ],
  member: [
    'users:read',
    'organizations:read',
    'organizations:members:read',
    'finance:invoices:read',
    'finance:payments:read',
    'crm:contacts:read',
    'crm:opportunities:read',
    'settings:read',
    'ai:chat:use',
    'ai:search:use',
    'ai:insights:use',
  ],
};
