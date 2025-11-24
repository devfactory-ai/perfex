/**
 * Organization validators (Zod schemas)
 */

import { z } from 'zod';

/**
 * Create organization schema
 */
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100).trim(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  logoUrl: z.string().url().optional().nullable(),
  settings: z.record(z.any()).optional().nullable(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

/**
 * Update organization schema
 */
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  logoUrl: z.string().url().optional().nullable(),
  settings: z.record(z.any()).optional().nullable(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

/**
 * Invite member schema
 */
export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be either admin or member' }),
  }),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

/**
 * Update member role schema
 */
export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

/**
 * Accept invitation schema
 */
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

/**
 * Create custom role schema
 */
export const createRoleSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  organizationId: z.string().uuid().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

/**
 * Update custom role schema
 */
export const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  permissions: z.array(z.string()).min(1).optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
