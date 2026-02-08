/**
 * Audit Trail Service
 * Comprehensive audit logging for healthcare data compliance (HIPAA/GDPR)
 * Tracks all data access and modifications
 */

import { logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'PRINT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'ACCESS_DENIED';

export type AuditModule =
  | 'auth'
  | 'users'
  | 'patients'
  | 'dialyse'
  | 'cardiology'
  | 'ophthalmology'
  | 'consultations'
  | 'prescriptions'
  | 'lab_results'
  | 'documents'
  | 'billing'
  | 'reports'
  | 'settings'
  | 'system';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEntry {
  id?: string;
  timestamp: string;
  organizationId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  action: AuditAction;
  module: AuditModule;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  patientId?: string;
  patientName?: string;
  description: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedFields?: string[];
  metadata?: Record<string, unknown>;
  severity: AuditSeverity;
  success: boolean;
  errorMessage?: string;
  sessionId?: string;
  requestId?: string;
}

export interface AuditQueryParams {
  organizationId: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  patientId?: string;
  module?: AuditModule;
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  severity?: AuditSeverity;
  success?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditQueryResult {
  entries: AuditEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Audit Trail Service
// ============================================================================

export class AuditTrailService {
  private db: D1Database;
  private retentionDays: number;

  constructor(db: D1Database, retentionDays = 365 * 7) {
    this.db = db;
    this.retentionDays = retentionDays;
  }

  /**
   * Log an audit entry
   */
  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    try {
      await this.db.prepare(`
        INSERT INTO audit_trail (
          id, timestamp, organization_id, user_id, user_email, user_name, user_role,
          ip_address, user_agent, action, module, resource_type, resource_id, resource_name,
          patient_id, patient_name, description, previous_values, new_values, changed_fields,
          metadata, severity, success, error_message, session_id, request_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        timestamp,
        entry.organizationId,
        entry.userId,
        entry.userEmail || null,
        entry.userName || null,
        entry.userRole || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.action,
        entry.module,
        entry.resourceType,
        entry.resourceId || null,
        entry.resourceName || null,
        entry.patientId || null,
        entry.patientName || null,
        entry.description,
        entry.previousValues ? JSON.stringify(entry.previousValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.changedFields ? JSON.stringify(entry.changedFields) : null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.severity,
        entry.success ? 1 : 0,
        entry.errorMessage || null,
        entry.sessionId || null,
        entry.requestId || null
      ).run();

      // Log critical events
      if (entry.severity === 'critical') {
        logger.warn('Critical audit event', {
          auditId: id,
          action: entry.action,
          module: entry.module,
          resourceType: entry.resourceType,
          userId: entry.userId,
        });
      }

      return id;
    } catch (error) {
      logger.error('Failed to log audit entry', { error, entry });
      throw error;
    }
  }

  /**
   * Log a CREATE action
   */
  async logCreate(params: {
    organizationId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    module: AuditModule;
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    patientId?: string;
    patientName?: string;
    newValues: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    return this.log({
      ...params,
      action: 'CREATE',
      description: `Created ${params.resourceType}: ${params.resourceName || params.resourceId}`,
      severity: this.getSeverity(params.module, 'CREATE'),
      success: true,
    });
  }

  /**
   * Log a READ action (for sensitive data access)
   */
  async logRead(params: {
    organizationId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    module: AuditModule;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    patientId?: string;
    patientName?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    return this.log({
      ...params,
      action: 'READ',
      description: `Accessed ${params.resourceType}${params.resourceName ? `: ${params.resourceName}` : ''}`,
      severity: 'info',
      success: true,
    });
  }

  /**
   * Log an UPDATE action with diff tracking
   */
  async logUpdate(params: {
    organizationId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    module: AuditModule;
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    patientId?: string;
    patientName?: string;
    previousValues: Record<string, unknown>;
    newValues: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const changedFields = this.getChangedFields(params.previousValues, params.newValues);

    return this.log({
      ...params,
      action: 'UPDATE',
      changedFields,
      description: `Updated ${params.resourceType}: ${params.resourceName || params.resourceId} (${changedFields.length} field(s) changed)`,
      severity: this.getSeverity(params.module, 'UPDATE'),
      success: true,
    });
  }

  /**
   * Log a DELETE action
   */
  async logDelete(params: {
    organizationId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    module: AuditModule;
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    patientId?: string;
    patientName?: string;
    previousValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    return this.log({
      ...params,
      action: 'DELETE',
      description: `Deleted ${params.resourceType}: ${params.resourceName || params.resourceId}`,
      severity: this.getSeverity(params.module, 'DELETE'),
      success: true,
    });
  }

  /**
   * Log an EXPORT action
   */
  async logExport(params: {
    organizationId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    module: AuditModule;
    resourceType: string;
    exportFormat: string;
    recordCount: number;
    patientId?: string;
    patientName?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    return this.log({
      ...params,
      action: 'EXPORT',
      description: `Exported ${params.recordCount} ${params.resourceType} record(s) as ${params.exportFormat}`,
      severity: 'warning',
      success: true,
      metadata: {
        ...params.metadata,
        exportFormat: params.exportFormat,
        recordCount: params.recordCount,
      },
    });
  }

  /**
   * Log a login event
   */
  async logLogin(params: {
    organizationId: string;
    userId: string;
    userEmail: string;
    userName?: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    return this.log({
      ...params,
      action: params.success ? 'LOGIN' : 'LOGIN_FAILED',
      module: 'auth',
      resourceType: 'session',
      description: params.success
        ? `User logged in: ${params.userEmail}`
        : `Failed login attempt: ${params.userEmail}`,
      severity: params.success ? 'info' : 'warning',
    });
  }

  /**
   * Log an access denied event
   */
  async logAccessDenied(params: {
    organizationId: string;
    userId: string;
    userEmail?: string;
    userName?: string;
    module: AuditModule;
    resourceType: string;
    resourceId?: string;
    attemptedAction: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    return this.log({
      ...params,
      action: 'ACCESS_DENIED',
      description: `Access denied: ${params.attemptedAction} on ${params.resourceType}${params.resourceId ? ` (${params.resourceId})` : ''}`,
      severity: 'warning',
      success: false,
      errorMessage: 'Insufficient permissions',
    });
  }

  /**
   * Query audit entries
   */
  async query(params: AuditQueryParams): Promise<AuditQueryResult> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);
    const offset = (page - 1) * limit;

    const conditions: string[] = ['organization_id = ?'];
    const bindings: unknown[] = [params.organizationId];

    if (params.startDate) {
      conditions.push('timestamp >= ?');
      bindings.push(params.startDate);
    }

    if (params.endDate) {
      conditions.push('timestamp <= ?');
      bindings.push(params.endDate);
    }

    if (params.userId) {
      conditions.push('user_id = ?');
      bindings.push(params.userId);
    }

    if (params.patientId) {
      conditions.push('patient_id = ?');
      bindings.push(params.patientId);
    }

    if (params.module) {
      conditions.push('module = ?');
      bindings.push(params.module);
    }

    if (params.action) {
      conditions.push('action = ?');
      bindings.push(params.action);
    }

    if (params.resourceType) {
      conditions.push('resource_type = ?');
      bindings.push(params.resourceType);
    }

    if (params.resourceId) {
      conditions.push('resource_id = ?');
      bindings.push(params.resourceId);
    }

    if (params.severity) {
      conditions.push('severity = ?');
      bindings.push(params.severity);
    }

    if (params.success !== undefined) {
      conditions.push('success = ?');
      bindings.push(params.success ? 1 : 0);
    }

    if (params.search) {
      conditions.push('(description LIKE ? OR resource_name LIKE ? OR patient_name LIKE ? OR user_email LIKE ?)');
      const searchTerm = `%${params.search}%`;
      bindings.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await this.db.prepare(
      `SELECT COUNT(*) as total FROM audit_trail WHERE ${whereClause}`
    ).bind(...bindings).first() as { total: number } | null;

    const total = countResult?.total || 0;

    // Get entries
    const results = await this.db.prepare(`
      SELECT * FROM audit_trail
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();

    const entries = (results.results || []).map(row => this.mapRowToEntry(row as Record<string, unknown>));

    return {
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit history for a specific resource
   */
  async getResourceHistory(
    organizationId: string,
    resourceType: string,
    resourceId: string
  ): Promise<AuditEntry[]> {
    const results = await this.db.prepare(`
      SELECT * FROM audit_trail
      WHERE organization_id = ? AND resource_type = ? AND resource_id = ?
      ORDER BY timestamp DESC
      LIMIT 100
    `).bind(organizationId, resourceType, resourceId).all();

    return (results.results || []).map(row => this.mapRowToEntry(row as Record<string, unknown>));
  }

  /**
   * Get audit history for a specific patient
   */
  async getPatientHistory(
    organizationId: string,
    patientId: string,
    limit = 100
  ): Promise<AuditEntry[]> {
    const results = await this.db.prepare(`
      SELECT * FROM audit_trail
      WHERE organization_id = ? AND patient_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(organizationId, patientId, limit).all();

    return (results.results || []).map(row => this.mapRowToEntry(row as Record<string, unknown>));
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(
    organizationId: string,
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalActions: number;
    byAction: Record<string, number>;
    byModule: Record<string, number>;
    byDay: { date: string; count: number }[];
  }> {
    const results = await this.db.prepare(`
      SELECT
        action,
        module,
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM audit_trail
      WHERE organization_id = ? AND user_id = ?
        AND timestamp >= ? AND timestamp <= ?
      GROUP BY action, module, DATE(timestamp)
    `).bind(organizationId, userId, startDate, endDate).all();

    const byAction: Record<string, number> = {};
    const byModule: Record<string, number> = {};
    const byDayMap: Record<string, number> = {};

    for (const row of results.results || []) {
      const r = row as { action: string; module: string; date: string; count: number };
      byAction[r.action] = (byAction[r.action] || 0) + r.count;
      byModule[r.module] = (byModule[r.module] || 0) + r.count;
      byDayMap[r.date] = (byDayMap[r.date] || 0) + r.count;
    }

    const byDay = Object.entries(byDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalActions: Object.values(byAction).reduce((a, b) => a + b, 0),
      byAction,
      byModule,
      byDay,
    };
  }

  /**
   * Clean up old audit entries based on retention policy
   */
  async cleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const result = await this.db.prepare(`
      DELETE FROM audit_trail
      WHERE timestamp < ?
    `).bind(cutoffDate.toISOString()).run();

    const deleted = result.meta?.changes || 0;

    if (deleted > 0) {
      logger.info('Audit trail cleanup completed', {
        deleted,
        retentionDays: this.retentionDays,
        cutoffDate: cutoffDate.toISOString(),
      });
    }

    return deleted;
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  private getSeverity(module: AuditModule, action: AuditAction): AuditSeverity {
    // Critical actions
    if (action === 'DELETE' && ['patients', 'prescriptions', 'lab_results'].includes(module)) {
      return 'critical';
    }

    // Warning actions
    if (['DELETE', 'EXPORT', 'PERMISSION_CHANGE'].includes(action)) {
      return 'warning';
    }

    // Patient data modifications
    if (['UPDATE', 'CREATE'].includes(action) && ['patients', 'prescriptions', 'lab_results'].includes(module)) {
      return 'warning';
    }

    return 'info';
  }

  private getChangedFields(
    previous: Record<string, unknown>,
    current: Record<string, unknown>
  ): string[] {
    const changed: string[] = [];

    // Fields to ignore in change detection
    const ignoreFields = ['updated_at', 'updated_by', 'version'];

    for (const key of Object.keys(current)) {
      if (ignoreFields.includes(key)) continue;

      const prevValue = previous[key];
      const currValue = current[key];

      if (JSON.stringify(prevValue) !== JSON.stringify(currValue)) {
        changed.push(key);
      }
    }

    return changed;
  }

  private mapRowToEntry(row: Record<string, unknown>): AuditEntry {
    return {
      id: row.id as string,
      timestamp: row.timestamp as string,
      organizationId: row.organization_id as string,
      userId: row.user_id as string,
      userEmail: row.user_email as string | undefined,
      userName: row.user_name as string | undefined,
      userRole: row.user_role as string | undefined,
      ipAddress: row.ip_address as string | undefined,
      userAgent: row.user_agent as string | undefined,
      action: row.action as AuditAction,
      module: row.module as AuditModule,
      resourceType: row.resource_type as string,
      resourceId: row.resource_id as string | undefined,
      resourceName: row.resource_name as string | undefined,
      patientId: row.patient_id as string | undefined,
      patientName: row.patient_name as string | undefined,
      description: row.description as string,
      previousValues: row.previous_values ? JSON.parse(row.previous_values as string) : undefined,
      newValues: row.new_values ? JSON.parse(row.new_values as string) : undefined,
      changedFields: row.changed_fields ? JSON.parse(row.changed_fields as string) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      severity: row.severity as AuditSeverity,
      success: row.success === 1,
      errorMessage: row.error_message as string | undefined,
      sessionId: row.session_id as string | undefined,
      requestId: row.request_id as string | undefined,
    };
  }
}

// ============================================================================
// Middleware for automatic audit logging
// ============================================================================

import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';

export interface AuditContext {
  auditService: AuditTrailService;
  startAudit: (params: {
    module: AuditModule;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    patientId?: string;
    patientName?: string;
  }) => void;
  completeAudit: (params: {
    action: AuditAction;
    success: boolean;
    previousValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    errorMessage?: string;
  }) => Promise<void>;
}

declare module 'hono' {
  interface ContextVariableMap {
    audit: AuditContext;
  }
}

export function createAuditMiddleware(db: D1Database) {
  return createMiddleware(async (c: Context, next: Next) => {
    const auditService = new AuditTrailService(db);
    let auditParams: {
      module?: AuditModule;
      resourceType?: string;
      resourceId?: string;
      resourceName?: string;
      patientId?: string;
      patientName?: string;
    } = {};

    const audit: AuditContext = {
      auditService,
      startAudit: (params) => {
        auditParams = params;
      },
      completeAudit: async (params) => {
        if (!auditParams.module || !auditParams.resourceType) return;

        const userId = c.get('userId') as string;
        const organizationId = c.get('organizationId') as string;
        const userEmail = c.get('userEmail') as string | undefined;
        const ipAddress = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
        const userAgent = c.req.header('User-Agent');

        if (!userId || !organizationId) return;

        try {
          await auditService.log({
            organizationId,
            userId,
            userEmail,
            ipAddress,
            userAgent,
            action: params.action,
            module: auditParams.module,
            resourceType: auditParams.resourceType,
            resourceId: auditParams.resourceId,
            resourceName: auditParams.resourceName,
            patientId: auditParams.patientId,
            patientName: auditParams.patientName,
            description: `${params.action} ${auditParams.resourceType}${auditParams.resourceName ? `: ${auditParams.resourceName}` : ''}`,
            previousValues: params.previousValues,
            newValues: params.newValues,
            changedFields: params.previousValues && params.newValues
              ? Object.keys(params.newValues).filter(k =>
                  JSON.stringify(params.previousValues![k]) !== JSON.stringify(params.newValues![k])
                )
              : undefined,
            severity: auditService['getSeverity'](auditParams.module, params.action),
            success: params.success,
            errorMessage: params.errorMessage,
          });
        } catch (error) {
          logger.error('Failed to complete audit', { error });
        }
      },
    };

    c.set('audit', audit);
    await next();
  });
}
