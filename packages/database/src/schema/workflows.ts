/**
 * Workflow Automation & Integration Module Schema
 * Workflows, approvals, webhooks, API keys, and activity feed
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';

/**
 * Workflows
 * Define automated workflows and approval processes
 */
export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  entityType: text('entity_type').notNull(), // invoice, purchase_order, expense, etc
  triggerType: text('trigger_type').notNull(), // on_create, on_update, on_status_change, scheduled
  triggerConditions: text('trigger_conditions'), // JSON conditions
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  priority: integer('priority').default(0),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Workflow Steps
 * Individual steps in a workflow
 */
export const workflowSteps = sqliteTable('workflow_steps', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  stepType: text('step_type').notNull(), // approval, notification, action, condition, delay
  position: integer('position').notNull(),
  configuration: text('configuration').notNull(), // JSON config
  // For approval steps
  approverType: text('approver_type'), // user, role, manager, custom
  approverIds: text('approver_ids'), // JSON array
  requireAllApprovers: integer('require_all_approvers', { mode: 'boolean' }).default(false),
  // For action steps
  actionType: text('action_type'), // send_email, update_field, create_task, webhook
  actionConfig: text('action_config'), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Workflow Instances
 * Track execution of workflows
 */
export const workflowInstances = sqliteTable('workflow_instances', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  status: text('status').notNull(), // pending, in_progress, completed, failed, cancelled
  currentStepId: text('current_step_id').references(() => workflowSteps.id),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  triggeredBy: text('triggered_by').references(() => users.id),
  metadata: text('metadata'), // JSON
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Workflow Step Executions
 * Track individual step executions
 */
export const workflowStepExecutions = sqliteTable('workflow_step_executions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  instanceId: text('instance_id').notNull().references(() => workflowInstances.id, { onDelete: 'cascade' }),
  stepId: text('step_id').notNull().references(() => workflowSteps.id),
  status: text('status').notNull(), // pending, in_progress, completed, failed, skipped
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  executedBy: text('executed_by').references(() => users.id),
  result: text('result'), // JSON result
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Approvals
 * Track approval requests
 */
export const approvals = sqliteTable('approvals', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workflowInstanceId: text('workflow_instance_id').references(() => workflowInstances.id, { onDelete: 'cascade' }),
  stepExecutionId: text('step_execution_id').references(() => workflowStepExecutions.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  approverId: text('approver_id').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  comments: text('comments'),
  respondedAt: integer('responded_at', { mode: 'timestamp' }),
  requestedBy: text('requested_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Activity Feed
 * System-wide activity stream
 */
export const activityFeed = sqliteTable('activity_feed', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  activityType: text('activity_type').notNull(), // create, update, delete, comment, approve, etc
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  title: text('title').notNull(),
  description: text('description'),
  metadata: text('metadata'), // JSON with activity details
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Comments
 * Add comments to any entity
 */
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  parentId: text('parent_id'), // For threaded comments
  content: text('content').notNull(),
  mentions: text('mentions'), // JSON array of user IDs
  attachments: text('attachments'), // JSON array of document IDs
  isEdited: integer('is_edited', { mode: 'boolean' }).default(false),
  editedAt: integer('edited_at', { mode: 'timestamp' }),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Webhooks
 * External system integrations
 */
export const webhooks = sqliteTable('webhooks', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  secret: text('secret'), // For signature verification
  events: text('events').notNull(), // JSON array of event types
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  headers: text('headers'), // JSON object of custom headers
  retryAttempts: integer('retry_attempts').default(3),
  timeout: integer('timeout').default(30), // Seconds
  lastTriggeredAt: integer('last_triggered_at', { mode: 'timestamp' }),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Webhook Logs
 * Track webhook delivery attempts
 */
export const webhookLogs = sqliteTable('webhook_logs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  webhookId: text('webhook_id').notNull().references(() => webhooks.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  payload: text('payload').notNull(), // JSON
  status: text('status').notNull(), // success, failed, retrying
  statusCode: integer('status_code'),
  response: text('response'),
  error: text('error'),
  attempt: integer('attempt').default(1),
  duration: integer('duration'), // Milliseconds
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * API Keys
 * For third-party integrations and API access
 */
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for display
  keyHash: text('key_hash').notNull(), // Hashed full key
  permissions: text('permissions').notNull(), // JSON array of permissions
  rateLimit: integer('rate_limit').default(1000), // Requests per hour
  ipWhitelist: text('ip_whitelist'), // JSON array
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * API Key Usage
 * Track API key usage for rate limiting and analytics
 */
export const apiKeyUsage = sqliteTable('api_key_usage', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  apiKeyId: text('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  statusCode: integer('status_code'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  responseTime: integer('response_time'), // Milliseconds
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Tags
 * System-wide tagging for all entities
 */
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#3B82F6'),
  description: text('description'),
  category: text('category'), // Optional categorization
  usageCount: integer('usage_count').default(0),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Entity Tags
 * Link tags to any entity
 */
export const entityTags = sqliteTable('entity_tags', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
