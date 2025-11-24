/**
 * Document Management Module Types
 */

export type DocumentAccessLevel = 'organization' | 'department' | 'user';
export type DocumentAction = 'view' | 'download' | 'edit' | 'delete';
export type ShareType = 'internal' | 'external' | 'public';
export type SharePermission = 'view' | 'download' | 'edit';
export type EmailStatus = 'pending' | 'sending' | 'sent' | 'failed';
export type ReportType = 'table' | 'chart' | 'pivot';

export interface DocumentCategory {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  parentId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  organizationId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  version: number;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isPublic: boolean;
  accessLevel: DocumentAccessLevel;
  tags: string | null; // JSON array
  metadata: string | null; // JSON object
  checksum: string | null;
  downloadCount: number;
  lastAccessedAt: Date | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  id: string;
  organizationId: string;
  documentId: string;
  version: number;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  changeNote: string | null;
  uploadedBy: string;
  createdAt: Date;
}

export interface DocumentAccessLog {
  id: string;
  organizationId: string;
  documentId: string;
  userId: string | null;
  action: DocumentAction;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface DocumentShare {
  id: string;
  organizationId: string;
  documentId: string;
  shareType: ShareType;
  sharedWith: string | null;
  permissions: SharePermission;
  expiresAt: Date | null;
  shareToken: string | null;
  accessCount: number;
  sharedBy: string;
  createdAt: Date;
}

export interface EmailTemplate {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  variables: string | null; // JSON array
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailQueue {
  id: string;
  organizationId: string;
  templateId: string | null;
  toEmail: string;
  toName: string | null;
  fromEmail: string | null;
  fromName: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  status: EmailStatus;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date | null;
  sentAt: Date | null;
  error: string | null;
  metadata: string | null; // JSON
  createdAt: Date;
}

export interface Report {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  category: string;
  reportType: ReportType;
  dataSource: string;
  configuration: string; // JSON
  filters: string | null; // JSON
  columns: string | null; // JSON
  sortBy: string | null;
  groupBy: string | null;
  isPublic: boolean;
  isFavorite: boolean;
  runCount: number;
  lastRunAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledReport {
  id: string;
  organizationId: string;
  reportId: string;
  name: string;
  schedule: string; // Cron expression
  recipients: string; // JSON array
  format: string;
  isActive: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
