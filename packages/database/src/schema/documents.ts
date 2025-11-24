/**
 * Document Management Module Schema
 * File uploads, attachments, and document tracking
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';

/**
 * Document Categories
 * Organize documents into categories
 */
export const documentCategories = sqliteTable('document_categories', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3B82F6'),
  icon: text('icon'),
  parentId: text('parent_id'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Documents
 * Main document/file records
 */
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => documentCategories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(), // Bytes
  mimeType: text('mime_type').notNull(),
  fileUrl: text('file_url').notNull(), // R2 storage URL
  thumbnailUrl: text('thumbnail_url'),
  version: integer('version').notNull().default(1),
  // Attachments to entities
  relatedEntityType: text('related_entity_type'), // invoice, project, company, etc
  relatedEntityId: text('related_entity_id'),
  // Security
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  accessLevel: text('access_level').default('organization'), // organization, department, user
  // Metadata
  tags: text('tags'), // JSON array
  metadata: text('metadata'), // JSON object
  checksum: text('checksum'), // File hash for integrity
  // Tracking
  downloadCount: integer('download_count').default(0),
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Document Versions
 * Track document version history
 */
export const documentVersions = sqliteTable('document_versions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileUrl: text('file_url').notNull(),
  changeNote: text('change_note'),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Document Access Log
 * Track who accessed which documents
 */
export const documentAccessLog = sqliteTable('document_access_log', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // view, download, edit, delete
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Document Shares
 * Share documents with specific users or external parties
 */
export const documentShares = sqliteTable('document_shares', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  documentId: text('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  shareType: text('share_type').notNull(), // internal, external, public
  sharedWith: text('shared_with'), // User ID or email
  permissions: text('permissions').notNull(), // view, download, edit
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  shareToken: text('share_token'), // For external sharing
  accessCount: integer('access_count').default(0),
  sharedBy: text('shared_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Email Templates
 * Predefined email templates for notifications
 */
export const emailTemplates = sqliteTable('email_templates', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(), // invoice_sent, payment_reminder, etc
  category: text('category').notNull(), // finance, crm, hr, etc
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text'),
  variables: text('variables'), // JSON array of available variables
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Email Queue
 * Queue emails for sending
 */
export const emailQueue = sqliteTable('email_queue', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  templateId: text('template_id').references(() => emailTemplates.id, { onDelete: 'set null' }),
  toEmail: text('to_email').notNull(),
  toName: text('to_name'),
  fromEmail: text('from_email'),
  fromName: text('from_name'),
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text'),
  status: text('status').notNull().default('pending'), // pending, sending, sent, failed
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  error: text('error'),
  metadata: text('metadata'), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Reports
 * Saved custom reports
 */
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // finance, sales, inventory, hr, etc
  reportType: text('report_type').notNull(), // table, chart, pivot
  dataSource: text('data_source').notNull(), // Module/entity to report on
  configuration: text('configuration').notNull(), // JSON report config
  filters: text('filters'), // JSON filters
  columns: text('columns'), // JSON column definitions
  sortBy: text('sort_by'),
  groupBy: text('group_by'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  runCount: integer('run_count').default(0),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Scheduled Reports
 * Automatically run and send reports
 */
export const scheduledReports = sqliteTable('scheduled_reports', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  reportId: text('report_id').notNull().references(() => reports.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  schedule: text('schedule').notNull(), // Cron expression
  recipients: text('recipients').notNull(), // JSON array of emails
  format: text('format').notNull().default('pdf'), // pdf, excel, csv
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  nextRunAt: integer('next_run_at', { mode: 'timestamp' }),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
