/**
 * Workflow Automation & Integration validators (Zod schemas)
 */

import { z } from 'zod';

// Workflow validators
export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  entityType: z.string().min(1).max(100),
  triggerType: z.enum(['on_create', 'on_update', 'on_status_change', 'scheduled']),
  triggerConditions: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  triggerConditions: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
});

export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

// Workflow Step validators
export const createWorkflowStepSchema = z.object({
  workflowId: z.string().uuid(),
  name: z.string().min(1).max(200),
  stepType: z.enum(['approval', 'notification', 'action', 'condition', 'delay']),
  position: z.number().int().min(0),
  configuration: z.record(z.any()),
  approverType: z.enum(['user', 'role', 'manager', 'custom']).optional().nullable(),
  approverIds: z.array(z.string().uuid()).optional().nullable(),
  requireAllApprovers: z.boolean().default(false),
  actionType: z.enum(['send_email', 'update_field', 'create_task', 'webhook']).optional().nullable(),
  actionConfig: z.record(z.any()).optional().nullable(),
});

export type CreateWorkflowStepInput = z.infer<typeof createWorkflowStepSchema>;

// Workflow Instance validators
export const triggerWorkflowSchema = z.object({
  workflowId: z.string().uuid(),
  entityType: z.string().min(1).max(100),
  entityId: z.string().uuid(),
  metadata: z.record(z.any()).optional().nullable(),
});

export type TriggerWorkflowInput = z.infer<typeof triggerWorkflowSchema>;

// Approval validators
export const respondToApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comments: z.string().max(2000).optional().nullable(),
});

export type RespondToApprovalInput = z.infer<typeof respondToApprovalSchema>;

export const createApprovalSchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string().uuid(),
  approverId: z.string().uuid(),
  workflowInstanceId: z.string().uuid().optional().nullable(),
  stepExecutionId: z.string().uuid().optional().nullable(),
});

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;

// Activity Feed validators
export const createActivityFeedSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  activityType: z.enum(['create', 'update', 'delete', 'comment', 'approve', 'reject', 'status_change']),
  entityType: z.string().min(1).max(100),
  entityId: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  isPublic: z.boolean().default(true),
});

export type CreateActivityFeedInput = z.infer<typeof createActivityFeedSchema>;

// Comment validators
export const createCommentSchema = z.object({
  entityType: z.string().min(1).max(100),
  entityId: z.string().uuid(),
  parentId: z.string().uuid().optional().nullable(),
  content: z.string().min(1).max(5000),
  mentions: z.array(z.string().uuid()).optional().nullable(),
  attachments: z.array(z.string().uuid()).optional().nullable(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

// Webhook validators
export const createWebhookSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  url: z.string().url(),
  secret: z.string().min(1).max(200).optional().nullable(),
  events: z.array(z.string()).min(1),
  isActive: z.boolean().default(true),
  headers: z.record(z.string()).optional().nullable(),
  retryAttempts: z.number().int().min(0).max(10).default(3),
  timeout: z.number().int().min(1).max(300).default(30),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export const updateWebhookSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  url: z.string().url().optional(),
  secret: z.string().min(1).max(200).optional().nullable(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
  headers: z.record(z.string()).optional().nullable(),
  retryAttempts: z.number().int().min(0).max(10).optional(),
  timeout: z.number().int().min(1).max(300).optional(),
});

export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;

// API Key validators
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  permissions: z.array(z.string()).min(1),
  rateLimit: z.number().int().min(1).default(1000),
  ipWhitelist: z.array(z.string().ip()).optional().nullable(),
  expiresAt: z.string().datetime().or(z.date()).optional().nullable(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  permissions: z.array(z.string()).min(1).optional(),
  rateLimit: z.number().int().min(1).optional(),
  ipWhitelist: z.array(z.string().ip()).optional().nullable(),
  expiresAt: z.string().datetime().or(z.date()).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;

// Tag validators
export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().max(20).default('#3B82F6'),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().max(20).optional(),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;

// Entity Tag validators
export const createEntityTagSchema = z.object({
  tagId: z.string().uuid(),
  entityType: z.string().min(1).max(100),
  entityId: z.string().uuid(),
});

export type CreateEntityTagInput = z.infer<typeof createEntityTagSchema>;
