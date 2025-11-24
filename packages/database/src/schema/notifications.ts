/**
 * Notifications Module Schema
 * User notifications and alerts
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';

/**
 * Notifications
 * System notifications for users
 */
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // info, success, warning, error, mention, task, approval
  title: text('title').notNull(),
  message: text('message'),
  link: text('link'), // URL to related resource
  relatedId: text('related_id'), // ID of related entity
  relatedType: text('related_type'), // Type of related entity (invoice, project, etc)
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Audit Logs
 * Track all changes in the system for compliance
 */
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // create, update, delete, login, logout
  entityType: text('entity_type').notNull(), // invoice, project, employee, etc
  entityId: text('entity_id'),
  changes: text('changes'), // JSON string of changes
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: text('metadata'), // JSON string of additional data
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * System Settings
 * Organization-level configuration and preferences
 */
export const systemSettings = sqliteTable('system_settings', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // general, finance, crm, notifications, etc
  key: text('key').notNull(),
  value: text('value'), // JSON string
  description: text('description'),
  updatedBy: text('updated_by').references(() => users.id),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
