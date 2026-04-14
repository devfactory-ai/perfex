/**
 * @perfex/shared
 * Shared types, validators, and utilities for Perfex ERP
 */

// Types
export * from './types/api';
export * from './types/auth';
export * from './types/finance';
export * from './types/inventory';
export * from './types/hr';
export * from './types/assets';
export * from './types/notifications';
export * from './types/audit';

// Validators
export * from './validators/auth';
export * from './validators/finance';
export * from './validators/inventory';
export * from './validators/hr';
export * from './validators/assets';
export * from './validators/notifications';
export * from './validators/audit';

// Organization types - exported selectively to avoid conflicts
export type {
  Organization,
  OrganizationMemberWithUser,
  OrganizationWithStats,
  Invitation,
  Permission,
  PermissionKey,
} from './types/organizations';

export {
  PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from './types/organizations';
