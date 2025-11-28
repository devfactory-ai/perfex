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

  // Smart Audit System - Core
  'audit:read': 'View audit tasks and findings',
  'audit:create': 'Create audit tasks',
  'audit:update': 'Update audit tasks',
  'audit:delete': 'Delete audit tasks',
  'audit:complete': 'Complete audit tasks with findings',

  // Smart Audit System - EF1 Risk Assessment
  'audit:risk:read': 'View risk assessments',
  'audit:risk:create': 'Run risk assessments',
  'audit:risk:generate': 'Generate audit tasks from assessments',

  // Smart Audit System - EF2 Compliance Copilot
  'audit:compliance:read': 'View compliance checks',
  'audit:compliance:use': 'Use compliance copilot chat',
  'audit:compliance:check': 'Run compliance checks',
  'audit:compliance:kb:read': 'View knowledge base',
  'audit:compliance:kb:manage': 'Manage knowledge base entries',

  // Smart Audit System - EF3 Commonality Study
  'audit:commonality:read': 'View commonality studies',
  'audit:commonality:create': 'Create commonality analyses',
  'audit:commonality:approve': 'Approve commonality studies',

  // Smart Audit System - Proposals
  'audit:proposals:read': 'View improvement proposals',
  'audit:proposals:create': 'Create improvement proposals',
  'audit:proposals:submit': 'Submit proposals for approval',
  'audit:proposals:approve': 'Approve improvement proposals',
  'audit:proposals:implement': 'Manage proposal implementation',

  // Smart Audit System - Schedules & Config
  'audit:schedules:read': 'View audit schedules',
  'audit:schedules:manage': 'Manage audit schedules',
  'audit:config:read': 'View audit configuration',
  'audit:config:manage': 'Manage audit configuration',
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
    // Smart Audit System - Admin has full audit permissions
    'audit:read',
    'audit:create',
    'audit:update',
    'audit:delete',
    'audit:complete',
    'audit:risk:read',
    'audit:risk:create',
    'audit:risk:generate',
    'audit:compliance:read',
    'audit:compliance:use',
    'audit:compliance:check',
    'audit:compliance:kb:read',
    'audit:compliance:kb:manage',
    'audit:commonality:read',
    'audit:commonality:create',
    'audit:commonality:approve',
    'audit:proposals:read',
    'audit:proposals:create',
    'audit:proposals:submit',
    'audit:proposals:approve',
    'audit:proposals:implement',
    'audit:schedules:read',
    'audit:schedules:manage',
    'audit:config:read',
    'audit:config:manage',
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
    // Smart Audit System - Member has read and basic create permissions
    'audit:read',
    'audit:create',
    'audit:update',
    'audit:complete',
    'audit:risk:read',
    'audit:compliance:read',
    'audit:compliance:use',
    'audit:compliance:kb:read',
    'audit:commonality:read',
    'audit:proposals:read',
    'audit:proposals:create',
    'audit:proposals:submit',
    'audit:schedules:read',
    'audit:config:read',
  ],
};
