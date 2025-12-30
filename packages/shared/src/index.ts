/**
 * @perfex/shared
 * Shared types, validators, and utilities for Perfex ERP
 */

// Types
export * from './types/api';
export * from './types/auth';
export * from './types/finance';
export * from './types/crm';
export * from './types/projects';
export * from './types/inventory';
export * from './types/hr';
export * from './types/procurement';
export * from './types/sales';
export * from './types/manufacturing';
export * from './types/assets';
export * from './types/notifications';
export * from './types/documents';
export * from './types/workflows';
export * from './types/audit';
export * from './types/dialyse';

// Validators
export * from './validators/auth';
export * from './validators/finance';
export * from './validators/crm';
export * from './validators/projects';
export * from './validators/inventory';
export * from './validators/hr';
export * from './validators/procurement';
export * from './validators/sales';
export * from './validators/manufacturing';
export * from './validators/assets';
export * from './validators/notifications';
export * from './validators/documents';
export * from './validators/workflows';
export * from './validators/audit';
export * from './validators/dialyse';

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
