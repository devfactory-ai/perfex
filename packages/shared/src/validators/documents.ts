/**
 * Document Management validators (Zod schemas)
 */

import { z } from 'zod';

// Document Category validators
export const createDocumentCategorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  color: z.string().max(20).default('#3B82F6'),
  icon: z.string().max(100).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

export type CreateDocumentCategoryInput = z.infer<typeof createDocumentCategorySchema>;

// Document validators
export const createDocumentSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  fileName: z.string().min(1).max(500),
  fileSize: z.number().int().min(0),
  mimeType: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional().nullable(),
  relatedEntityType: z.string().max(100).optional().nullable(),
  relatedEntityId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().default(false),
  accessLevel: z.enum(['organization', 'department', 'user']).default('organization'),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const updateDocumentSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  isPublic: z.boolean().optional(),
  accessLevel: z.enum(['organization', 'department', 'user']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// Document Share validators
export const createDocumentShareSchema = z.object({
  documentId: z.string().uuid(),
  shareType: z.enum(['internal', 'external', 'public']),
  sharedWith: z.string().max(300).optional().nullable(),
  permissions: z.enum(['view', 'download', 'edit']),
  expiresAt: z.string().datetime().or(z.date()).optional().nullable(),
});

export type CreateDocumentShareInput = z.infer<typeof createDocumentShareSchema>;

// Email Template validators
export const createEmailTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional().nullable(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;

export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(500).optional(),
  bodyHtml: z.string().min(1).optional(),
  bodyText: z.string().optional().nullable(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;

// Email Queue validators
export const queueEmailSchema = z.object({
  templateId: z.string().uuid().optional().nullable(),
  toEmail: z.string().email(),
  toName: z.string().max(200).optional().nullable(),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional().nullable(),
  scheduledFor: z.string().datetime().or(z.date()).optional().nullable(),
  metadata: z.record(z.any()).optional(),
});

export type QueueEmailInput = z.infer<typeof queueEmailSchema>;

// Report validators
export const createReportSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1).max(100),
  reportType: z.enum(['table', 'chart', 'pivot']),
  dataSource: z.string().min(1).max(100),
  configuration: z.record(z.any()),
  filters: z.record(z.any()).optional().nullable(),
  columns: z.array(z.any()).optional().nullable(),
  sortBy: z.string().max(200).optional().nullable(),
  groupBy: z.string().max(200).optional().nullable(),
  isPublic: z.boolean().default(false),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  configuration: z.record(z.any()).optional(),
  filters: z.record(z.any()).optional().nullable(),
  columns: z.array(z.any()).optional().nullable(),
  sortBy: z.string().max(200).optional().nullable(),
  groupBy: z.string().max(200).optional().nullable(),
  isPublic: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

export type UpdateReportInput = z.infer<typeof updateReportSchema>;

// Scheduled Report validators
export const createScheduledReportSchema = z.object({
  reportId: z.string().uuid(),
  name: z.string().min(1).max(200),
  schedule: z.string().min(1).max(100), // Cron expression
  recipients: z.array(z.string().email()).min(1),
  format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
  isActive: z.boolean().default(true),
});

export type CreateScheduledReportInput = z.infer<typeof createScheduledReportSchema>;
