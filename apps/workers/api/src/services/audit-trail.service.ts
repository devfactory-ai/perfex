/**
 * Audit Trail Service
 * Complete activity logging for compliance and security
 */

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, gte, lte, sql, like } from 'drizzle-orm';
import { logger } from '../utils/logger';

/**
 * Audit action types
 */
export enum AuditAction {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  PASSWORD_CHANGED = 'auth.password_changed',
  PASSWORD_RESET = 'auth.password_reset',
  TOKEN_REFRESH = 'auth.token_refresh',

  // CRUD operations
  CREATE = 'data.create',
  READ = 'data.read',
  UPDATE = 'data.update',
  DELETE = 'data.delete',
  RESTORE = 'data.restore',

  // Bulk operations
  BULK_CREATE = 'data.bulk_create',
  BULK_UPDATE = 'data.bulk_update',
  BULK_DELETE = 'data.bulk_delete',

  // Export/Import
  EXPORT = 'data.export',
  IMPORT = 'data.import',

  // Access
  ACCESS_DENIED = 'access.denied',
  PERMISSION_CHANGED = 'access.permission_changed',
  ROLE_CHANGED = 'access.role_changed',

  // System
  CONFIG_CHANGED = 'system.config_changed',
  MODULE_ENABLED = 'system.module_enabled',
  MODULE_DISABLED = 'system.module_disabled',

  // Healthcare specific
  PATIENT_VIEWED = 'healthcare.patient_viewed',
  MEDICAL_RECORD_ACCESSED = 'healthcare.record_accessed',
  PRESCRIPTION_CREATED = 'healthcare.prescription_created',
  SESSION_STARTED = 'healthcare.session_started',
  SESSION_COMPLETED = 'healthcare.session_completed',
  ALERT_CREATED = 'healthcare.alert_created',
  ALERT_ACKNOWLEDGED = 'healthcare.alert_acknowledged',

  // Finance
  INVOICE_SENT = 'finance.invoice_sent',
  PAYMENT_RECORDED = 'finance.payment_recorded',
  REFUND_PROCESSED = 'finance.refund_processed',
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  action: AuditAction | string;
  entityType: string;
  entityId: string | null;
  entityName?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Audit query options
 */
export interface AuditQueryOptions {
  organizationId: string;
  userId?: string;
  action?: AuditAction | string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit Trail Service class
 */
export class AuditTrailService {
  constructor(
    private db: D1Database,
    private cache?: KVNamespace
  ) {}

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = crypto.randomUUID();
    const timestamp = new Date();

    try {
      // Store in D1
      await this.db
        .prepare(`
          INSERT INTO audit_logs (
            id, organization_id, user_id, user_email, action,
            entity_type, entity_id, entity_name, old_value, new_value,
            metadata, ip_address, user_agent, timestamp, session_id,
            success, error_message
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          entry.organizationId,
          entry.userId,
          entry.userEmail,
          entry.action,
          entry.entityType,
          entry.entityId,
          entry.entityName || null,
          entry.oldValue ? JSON.stringify(entry.oldValue) : null,
          entry.newValue ? JSON.stringify(entry.newValue) : null,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.ipAddress || null,
          entry.userAgent || null,
          timestamp.toISOString(),
          entry.sessionId || null,
          entry.success ? 1 : 0,
          entry.errorMessage || null
        )
        .run();

      // Log sensitive actions to console as well
      if (this.isSensitiveAction(entry.action)) {
        logger.info('Sensitive action logged', {
          action: entry.action,
          userId: entry.userId,
          entityType: entry.entityType,
          entityId: entry.entityId,
        });
      }

      return id;
    } catch (error) {
      logger.error('Failed to log audit entry', { error, entry });
      throw error;
    }
  }

  /**
   * Query audit logs
   */
  async query(options: AuditQueryOptions): Promise<{
    logs: AuditLogEntry[];
    total: number;
  }> {
    const conditions: string[] = ['organization_id = ?'];
    const params: any[] = [options.organizationId];

    if (options.userId) {
      conditions.push('user_id = ?');
      params.push(options.userId);
    }

    if (options.action) {
      conditions.push('action = ?');
      params.push(options.action);
    }

    if (options.entityType) {
      conditions.push('entity_type = ?');
      params.push(options.entityType);
    }

    if (options.entityId) {
      conditions.push('entity_id = ?');
      params.push(options.entityId);
    }

    if (options.startDate) {
      conditions.push('timestamp >= ?');
      params.push(options.startDate.toISOString());
    }

    if (options.endDate) {
      conditions.push('timestamp <= ?');
      params.push(options.endDate.toISOString());
    }

    if (options.search) {
      conditions.push('(entity_name LIKE ? OR user_email LIKE ?)');
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    const whereClause = conditions.join(' AND ');
    const orderDir = options.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Get total count
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM audit_logs WHERE ${whereClause}`)
      .bind(...params)
      .first<{ count: number }>();

    // Get logs
    const logs = await this.db
      .prepare(
        `SELECT * FROM audit_logs WHERE ${whereClause}
         ORDER BY timestamp ${orderDir} LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all();

    return {
      logs: (logs.results || []).map(this.mapLogEntry),
      total: countResult?.count || 0,
    };
  }

  /**
   * Get audit log by ID
   */
  async getById(
    id: string,
    organizationId: string
  ): Promise<AuditLogEntry | null> {
    const result = await this.db
      .prepare(
        'SELECT * FROM audit_logs WHERE id = ? AND organization_id = ?'
      )
      .bind(id, organizationId)
      .first();

    return result ? this.mapLogEntry(result) : null;
  }

  /**
   * Get entity history (all changes to a specific entity)
   */
  async getEntityHistory(
    entityType: string,
    entityId: string,
    organizationId: string
  ): Promise<AuditLogEntry[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM audit_logs
         WHERE organization_id = ? AND entity_type = ? AND entity_id = ?
         ORDER BY timestamp DESC LIMIT 100`
      )
      .bind(organizationId, entityType, entityId)
      .all();

    return (result.results || []).map(this.mapLogEntry);
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    userId: string,
    organizationId: string,
    days: number = 30
  ): Promise<AuditLogEntry[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.db
      .prepare(
        `SELECT * FROM audit_logs
         WHERE organization_id = ? AND user_id = ? AND timestamp >= ?
         ORDER BY timestamp DESC LIMIT 500`
      )
      .bind(organizationId, userId, startDate.toISOString())
      .all();

    return (result.results || []).map(this.mapLogEntry);
  }

  /**
   * Get security events (failed logins, access denied, etc.)
   */
  async getSecurityEvents(
    organizationId: string,
    days: number = 7
  ): Promise<AuditLogEntry[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const securityActions = [
      AuditAction.LOGIN_FAILED,
      AuditAction.ACCESS_DENIED,
      AuditAction.PASSWORD_CHANGED,
      AuditAction.PASSWORD_RESET,
      AuditAction.PERMISSION_CHANGED,
      AuditAction.ROLE_CHANGED,
    ];

    const placeholders = securityActions.map(() => '?').join(',');

    const result = await this.db
      .prepare(
        `SELECT * FROM audit_logs
         WHERE organization_id = ? AND action IN (${placeholders}) AND timestamp >= ?
         ORDER BY timestamp DESC LIMIT 200`
      )
      .bind(organizationId, ...securityActions, startDate.toISOString())
      .all();

    return (result.results || []).map(this.mapLogEntry);
  }

  /**
   * Get audit statistics
   */
  async getStats(
    organizationId: string,
    days: number = 30
  ): Promise<{
    totalEvents: number;
    byAction: Record<string, number>;
    byEntityType: Record<string, number>;
    byUser: { userId: string; email: string; count: number }[];
    failedOperations: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total events
    const totalResult = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM audit_logs
         WHERE organization_id = ? AND timestamp >= ?`
      )
      .bind(organizationId, startDate.toISOString())
      .first<{ count: number }>();

    // By action
    const byActionResult = await this.db
      .prepare(
        `SELECT action, COUNT(*) as count FROM audit_logs
         WHERE organization_id = ? AND timestamp >= ?
         GROUP BY action`
      )
      .bind(organizationId, startDate.toISOString())
      .all();

    // By entity type
    const byEntityResult = await this.db
      .prepare(
        `SELECT entity_type, COUNT(*) as count FROM audit_logs
         WHERE organization_id = ? AND timestamp >= ?
         GROUP BY entity_type`
      )
      .bind(organizationId, startDate.toISOString())
      .all();

    // By user
    const byUserResult = await this.db
      .prepare(
        `SELECT user_id, user_email, COUNT(*) as count FROM audit_logs
         WHERE organization_id = ? AND timestamp >= ?
         GROUP BY user_id, user_email ORDER BY count DESC LIMIT 10`
      )
      .bind(organizationId, startDate.toISOString())
      .all();

    // Failed operations
    const failedResult = await this.db
      .prepare(
        `SELECT COUNT(*) as count FROM audit_logs
         WHERE organization_id = ? AND success = 0 AND timestamp >= ?`
      )
      .bind(organizationId, startDate.toISOString())
      .first<{ count: number }>();

    const byAction: Record<string, number> = {};
    (byActionResult.results || []).forEach((row: any) => {
      byAction[row.action] = row.count;
    });

    const byEntityType: Record<string, number> = {};
    (byEntityResult.results || []).forEach((row: any) => {
      byEntityType[row.entity_type] = row.count;
    });

    return {
      totalEvents: totalResult?.count || 0,
      byAction,
      byEntityType,
      byUser: (byUserResult.results || []).map((row: any) => ({
        userId: row.user_id,
        email: row.user_email,
        count: row.count,
      })),
      failedOperations: failedResult?.count || 0,
    };
  }

  /**
   * Purge old audit logs (for compliance with retention policies)
   */
  async purgeOldLogs(organizationId: string, daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.db
      .prepare(
        `DELETE FROM audit_logs
         WHERE organization_id = ? AND timestamp < ?`
      )
      .bind(organizationId, cutoffDate.toISOString())
      .run();

    return result.meta?.changes || 0;
  }

  /**
   * Check if action is sensitive
   */
  private isSensitiveAction(action: string): boolean {
    const sensitiveActions = [
      AuditAction.LOGIN_FAILED,
      AuditAction.ACCESS_DENIED,
      AuditAction.PASSWORD_CHANGED,
      AuditAction.DELETE,
      AuditAction.BULK_DELETE,
      AuditAction.PERMISSION_CHANGED,
      AuditAction.ROLE_CHANGED,
      AuditAction.MEDICAL_RECORD_ACCESSED,
    ];
    return sensitiveActions.includes(action as AuditAction);
  }

  /**
   * Map database row to AuditLogEntry
   */
  private mapLogEntry(row: any): AuditLogEntry {
    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      userEmail: row.user_email,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      entityName: row.entity_name,
      oldValue: row.old_value ? JSON.parse(row.old_value) : undefined,
      newValue: row.new_value ? JSON.parse(row.new_value) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: new Date(row.timestamp),
      sessionId: row.session_id,
      success: row.success === 1,
      errorMessage: row.error_message,
    };
  }
}

/**
 * Helper to create audit entry from request context
 */
export function createAuditEntry(
  ctx: any,
  action: AuditAction | string,
  entityType: string,
  entityId: string | null,
  options: {
    entityName?: string;
    oldValue?: Record<string, any>;
    newValue?: Record<string, any>;
    metadata?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
  } = {}
): Omit<AuditLogEntry, 'id' | 'timestamp'> {
  return {
    organizationId: ctx.get('organizationId'),
    userId: ctx.get('userId'),
    userEmail: ctx.get('userEmail') || 'unknown',
    action,
    entityType,
    entityId,
    entityName: options.entityName,
    oldValue: options.oldValue,
    newValue: options.newValue,
    metadata: options.metadata,
    ipAddress: ctx.req.header('CF-Connecting-IP') || ctx.req.header('X-Forwarded-For'),
    userAgent: ctx.req.header('User-Agent'),
    sessionId: ctx.get('sessionId'),
    success: options.success !== false,
    errorMessage: options.errorMessage,
  };
}
