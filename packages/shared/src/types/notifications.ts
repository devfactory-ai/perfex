/**
 * Notifications Module Types
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'mention' | 'task' | 'approval';
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'reject';

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  relatedId: string | null;
  relatedType: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  changes: string | null; // JSON string
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null; // JSON string
  createdAt: Date;
}

export interface SystemSetting {
  id: string;
  organizationId: string;
  category: string;
  key: string;
  value: string | null; // JSON string
  description: string | null;
  updatedBy: string | null;
  updatedAt: Date;
  createdAt: Date;
}
