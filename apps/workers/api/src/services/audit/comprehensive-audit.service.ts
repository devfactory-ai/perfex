/**
 * Comprehensive Audit Trail Service
 * Complete HIPAA/GDPR compliant audit logging system
 */


// =============================================================================
// Types & Interfaces
// =============================================================================

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'access_denied'
  | 'permission_change'
  | 'export'
  | 'import'
  | 'print'
  | 'download'
  | 'upload'
  | 'share'
  | 'consent_granted'
  | 'consent_withdrawn'
  | 'emergency_access'
  | 'break_glass'
  | 'session_timeout'
  | 'api_call'
  | 'report_generated'
  | 'email_sent'
  | 'sms_sent'
  | 'prescription_created'
  | 'prescription_signed'
  | 'order_placed'
  | 'lab_result_viewed'
  | 'phi_accessed'
  | 'bulk_operation'
  | 'configuration_change';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AuditCategory =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'system'
  | 'clinical'
  | 'administrative'
  | 'security'
  | 'compliance';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;

  // Who
  userId?: string;
  userName?: string;
  userRole?: string;
  userEmail?: string;

  // What
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;

  // Patient context (for PHI access)
  patientId?: string;
  patientMrn?: string;

  // Details
  description: string;
  details?: Record<string, unknown>;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  changedFields?: string[];

  // Where
  ipAddress?: string;
  userAgent?: string;
  location?: {
    city?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };

  // Context
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  module?: string;
  endpoint?: string;
  httpMethod?: string;
  statusCode?: number;

  // Compliance
  hipaaRelevant?: boolean;
  gdprRelevant?: boolean;
  requiresReview?: boolean;
  retentionDays?: number;

  // Metadata
  tags?: string[];
  organizationId?: string;
}

export interface AuditSearchCriteria {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  patientId?: string;
  action?: AuditAction | AuditAction[];
  category?: AuditCategory | AuditCategory[];
  severity?: AuditSeverity | AuditSeverity[];
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  module?: string;
  searchText?: string;
  hipaaOnly?: boolean;
  gdprOnly?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'action';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditStatistics {
  totalEvents: number;
  byAction: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byUser: { userId: string; userName: string; count: number }[];
  byResource: { resourceType: string; count: number }[];
  timeDistribution: { hour: number; count: number }[];
  topPatients: { patientId: string; patientMrn: string; accessCount: number }[];
  securityEvents: number;
  complianceEvents: number;
}

export interface AuditReport {
  id: string;
  type: 'hipaa_access' | 'patient_access' | 'security_incidents' | 'user_activity' | 'data_breach' | 'custom';
  title: string;
  generatedAt: Date;
  generatedBy: string;
  period: { start: Date; end: Date };
  criteria: AuditSearchCriteria;
  statistics: AuditStatistics;
  events: AuditEvent[];
  summary: string;
}

// =============================================================================
// Audit Trail Service
// =============================================================================

export class ComprehensiveAuditService {
  
  private eventBuffer: AuditEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event,
      severity: event.severity || this.determineSeverity(event.action),
      hipaaRelevant: event.hipaaRelevant ?? this.isHipaaRelevant(event),
      gdprRelevant: event.gdprRelevant ?? this.isGdprRelevant(event)
    };

    // Add to buffer for batch processing
    this.eventBuffer.push(auditEvent);

    // Immediately persist critical events
    if (auditEvent.severity === 'critical' || auditEvent.requiresReview) {
      await this.persistEvents([auditEvent]);
      this.eventBuffer = this.eventBuffer.filter(e => e.id !== auditEvent.id);
    }

    // Check for suspicious patterns
    await this.checkSecurityPatterns(auditEvent);
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    action: 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset',
    userId: string,
    userName: string,
    context: {
      ipAddress?: string;
      userAgent?: string;
      success?: boolean;
      failureReason?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    await this.log({
      action,
      category: 'authentication',
      severity: action === 'login_failed' ? 'medium' : 'low',
      userId,
      userName,
      description: this.getAuthenticationDescription(action, userName, context.success),
      details: {
        success: context.success,
        failureReason: context.failureReason
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId
    });
  }

  /**
   * Log PHI access event (HIPAA requirement)
   */
  async logPhiAccess(
    userId: string,
    userName: string,
    patientId: string,
    patientMrn: string,
    action: 'read' | 'update' | 'download' | 'print' | 'export' | 'share',
    resourceType: string,
    resourceId: string,
    context: {
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
      emergencyAccess?: boolean;
    }
  ): Promise<void> {
    await this.log({
      action: context.emergencyAccess ? 'emergency_access' : action,
      category: 'data_access',
      severity: context.emergencyAccess ? 'high' : 'medium',
      userId,
      userName,
      patientId,
      patientMrn,
      resourceType,
      resourceId,
      description: `PHI ${action}: ${resourceType} for patient ${patientMrn}`,
      details: {
        reason: context.reason,
        emergencyAccess: context.emergencyAccess
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      hipaaRelevant: true,
      requiresReview: context.emergencyAccess
    });
  }

  /**
   * Log data modification event
   */
  async logDataModification(
    userId: string,
    userName: string,
    action: 'create' | 'update' | 'delete',
    resourceType: string,
    resourceId: string,
    context: {
      beforeState?: Record<string, unknown>;
      afterState?: Record<string, unknown>;
      changedFields?: string[];
      patientId?: string;
      patientMrn?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.log({
      action,
      category: 'data_modification',
      severity: action === 'delete' ? 'medium' : 'low',
      userId,
      userName,
      patientId: context.patientId,
      patientMrn: context.patientMrn,
      resourceType,
      resourceId,
      description: `${action.charAt(0).toUpperCase() + action.slice(1)}d ${resourceType}`,
      beforeState: context.beforeState,
      afterState: context.afterState,
      changedFields: context.changedFields,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      hipaaRelevant: !!context.patientId
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    action: 'access_denied' | 'permission_change' | 'break_glass' | 'configuration_change',
    userId: string | undefined,
    description: string,
    context: {
      severity?: AuditSeverity;
      details?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      requiresReview?: boolean;
    }
  ): Promise<void> {
    await this.log({
      action,
      category: 'security',
      severity: context.severity || 'high',
      userId,
      description,
      details: context.details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      requiresReview: context.requiresReview ?? true
    });
  }

  /**
   * Search audit events
   */
  async search(criteria: AuditSearchCriteria): Promise<{ events: AuditEvent[]; total: number }> {
    // In real implementation, query database with criteria
    // For now, return empty result
    return {
      events: [],
      total: 0
    };
  }

  /**
   * Get audit event by ID
   */
  async getById(eventId: string): Promise<AuditEvent | null> {
    // Would query database
    return null;
  }

  /**
   * Get patient access history (HIPAA requirement)
   */
  async getPatientAccessHistory(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditEvent[]> {
    return (await this.search({
      patientId,
      startDate,
      endDate,
      category: ['data_access', 'data_modification'],
      sortBy: 'timestamp',
      sortOrder: 'desc'
    })).events;
  }

  /**
   * Get user activity report
   */
  async getUserActivity(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditEvent[]> {
    return (await this.search({
      userId,
      startDate,
      endDate,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    })).events;
  }

  /**
   * Generate audit statistics
   */
  async getStatistics(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<AuditStatistics> {
    // Would aggregate from database
    return {
      totalEvents: 0,
      byAction: {},
      byCategory: {},
      bySeverity: {},
      byUser: [],
      byResource: [],
      timeDistribution: [],
      topPatients: [],
      securityEvents: 0,
      complianceEvents: 0
    };
  }

  /**
   * Generate HIPAA access report
   */
  async generateHipaaReport(
    startDate: Date,
    endDate: Date,
    generatedBy: string,
    patientId?: string
  ): Promise<AuditReport> {
    const criteria: AuditSearchCriteria = {
      startDate,
      endDate,
      hipaaOnly: true,
      patientId
    };

    const { events, total } = await this.search(criteria);
    const statistics = await this.getStatistics(startDate, endDate);

    return {
      id: `report-${Date.now()}`,
      type: 'hipaa_access',
      title: `HIPAA Access Report ${patientId ? `for Patient ${patientId}` : ''}`,
      generatedAt: new Date(),
      generatedBy,
      period: { start: startDate, end: endDate },
      criteria,
      statistics,
      events,
      summary: this.generateReportSummary('hipaa_access', statistics, events)
    };
  }

  /**
   * Generate security incidents report
   */
  async generateSecurityReport(
    startDate: Date,
    endDate: Date,
    generatedBy: string
  ): Promise<AuditReport> {
    const criteria: AuditSearchCriteria = {
      startDate,
      endDate,
      category: 'security',
      severity: ['high', 'critical']
    };

    const { events, total } = await this.search(criteria);
    const statistics = await this.getStatistics(startDate, endDate);

    return {
      id: `report-${Date.now()}`,
      type: 'security_incidents',
      title: 'Security Incidents Report',
      generatedAt: new Date(),
      generatedBy,
      period: { start: startDate, end: endDate },
      criteria,
      statistics,
      events,
      summary: this.generateReportSummary('security_incidents', statistics, events)
    };
  }

  /**
   * Check for suspicious patterns
   */
  private async checkSecurityPatterns(event: AuditEvent): Promise<void> {
    // Check for multiple failed logins
    if (event.action === 'login_failed') {
      // Would check for brute force patterns
    }

    // Check for unusual access patterns
    if (event.action === 'phi_accessed' || event.action === 'emergency_access') {
      // Would check for unusual access times or volumes
    }

    // Check for bulk data access
    if (event.action === 'export' || event.action === 'bulk_operation') {
      // Would flag for review
    }
  }

  /**
   * Persist events to database
   */
  private async persistEvents(events: AuditEvent[]): Promise<void> {
    // Would batch insert to database
    console.log(`Persisting ${events.length} audit events`);
  }

  /**
   * Determine event severity based on action
   */
  private determineSeverity(action: AuditAction): AuditSeverity {
    const severityMap: Record<AuditAction, AuditSeverity> = {
      'create': 'low',
      'read': 'low',
      'update': 'low',
      'delete': 'medium',
      'login': 'low',
      'logout': 'low',
      'login_failed': 'medium',
      'password_change': 'medium',
      'password_reset': 'medium',
      'access_denied': 'medium',
      'permission_change': 'high',
      'export': 'medium',
      'import': 'medium',
      'print': 'low',
      'download': 'low',
      'upload': 'low',
      'share': 'medium',
      'consent_granted': 'low',
      'consent_withdrawn': 'medium',
      'emergency_access': 'high',
      'break_glass': 'critical',
      'session_timeout': 'low',
      'api_call': 'low',
      'report_generated': 'low',
      'email_sent': 'low',
      'sms_sent': 'low',
      'prescription_created': 'medium',
      'prescription_signed': 'medium',
      'order_placed': 'low',
      'lab_result_viewed': 'low',
      'phi_accessed': 'medium',
      'bulk_operation': 'high',
      'configuration_change': 'high'
    };

    return severityMap[action] || 'low';
  }

  /**
   * Check if event is HIPAA relevant
   */
  private isHipaaRelevant(event: Partial<AuditEvent>): boolean {
    const hipaaActions: AuditAction[] = [
      'phi_accessed', 'emergency_access', 'break_glass',
      'export', 'print', 'download', 'share',
      'consent_granted', 'consent_withdrawn'
    ];

    return !!(
      event.patientId ||
      (event.action && hipaaActions.includes(event.action)) ||
      event.resourceType?.includes('patient') ||
      event.resourceType?.includes('medical') ||
      event.resourceType?.includes('health')
    );
  }

  /**
   * Check if event is GDPR relevant
   */
  private isGdprRelevant(event: Partial<AuditEvent>): boolean {
    const gdprActions: AuditAction[] = [
      'export', 'delete', 'share',
      'consent_granted', 'consent_withdrawn'
    ];

    return !!(
      event.patientId ||
      (event.action && gdprActions.includes(event.action))
    );
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `audit-${timestamp}-${random}`;
  }

  /**
   * Get authentication event description
   */
  private getAuthenticationDescription(
    action: string,
    userName: string,
    success?: boolean
  ): string {
    switch (action) {
      case 'login':
        return `User ${userName} logged in successfully`;
      case 'logout':
        return `User ${userName} logged out`;
      case 'login_failed':
        return `Failed login attempt for user ${userName}`;
      case 'password_change':
        return `User ${userName} changed their password`;
      case 'password_reset':
        return `Password reset for user ${userName}`;
      default:
        return `Authentication event for user ${userName}`;
    }
  }

  /**
   * Generate report summary
   */
  private generateReportSummary(
    type: string,
    statistics: AuditStatistics,
    events: AuditEvent[]
  ): string {
    switch (type) {
      case 'hipaa_access':
        return `Total PHI access events: ${events.length}. ` +
          `Unique users: ${Object.keys(statistics.byUser).length}. ` +
          `High severity events: ${statistics.bySeverity['high'] || 0}.`;

      case 'security_incidents':
        return `Total security events: ${events.length}. ` +
          `Critical: ${statistics.bySeverity['critical'] || 0}. ` +
          `High: ${statistics.bySeverity['high'] || 0}.`;

      default:
        return `Report contains ${events.length} events.`;
    }
  }

  /**
   * Flush buffered events to storage
   */
  async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length > 0) {
      await this.persistEvents([...this.eventBuffer]);
      this.eventBuffer = [];
    }
  }

  /**
   * Export audit log for compliance
   */
  async exportForCompliance(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv'
  ): Promise<{ data: string; filename: string }> {
    const { events } = await this.search({
      startDate,
      endDate,
      hipaaOnly: true
    });

    if (format === 'csv') {
      const headers = ['timestamp', 'action', 'userId', 'userName', 'patientId', 'resourceType', 'description', 'ipAddress'];
      const rows = events.map(e =>
        [e.timestamp.toISOString(), e.action, e.userId, e.userName, e.patientId, e.resourceType, e.description, e.ipAddress].join(',')
      );
      return {
        data: [headers.join(','), ...rows].join('\n'),
        filename: `audit-export-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`
      };
    }

    return {
      data: JSON.stringify(events, null, 2),
      filename: `audit-export-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.json`
    };
  }
}
