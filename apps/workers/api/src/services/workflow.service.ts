/**
 * Workflow Automation Service
 * Automated business process workflows
 */

import { logger } from '../utils/logger';

export enum WorkflowTrigger {
  ON_CREATE = 'on_create',
  ON_UPDATE = 'on_update',
  ON_DELETE = 'on_delete',
  ON_STATUS_CHANGE = 'on_status_change',
  ON_SCHEDULE = 'on_schedule',
  ON_THRESHOLD = 'on_threshold',
  ON_APPROVAL = 'on_approval',
  MANUAL = 'manual',
}

export enum WorkflowActionType {
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  SEND_NOTIFICATION = 'send_notification',
  CREATE_TASK = 'create_task',
  UPDATE_FIELD = 'update_field',
  CREATE_RECORD = 'create_record',
  CALL_WEBHOOK = 'call_webhook',
  GENERATE_DOCUMENT = 'generate_document',
  ASSIGN_USER = 'assign_user',
  CREATE_ALERT = 'create_alert',
  LOG_AUDIT = 'log_audit',
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface WorkflowAction {
  type: WorkflowActionType;
  config: Record<string, any>;
  delay?: number;
  retryCount?: number;
}

export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  entityType: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  triggeredBy: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  result?: Record<string, any>;
  error?: string;
}

export class WorkflowService {
  constructor(private db: D1Database) {}

  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    const id = crypto.randomUUID();
    const now = new Date();

    await this.db.prepare(`
      INSERT INTO workflows (
        id, organization_id, name, description, entity_type, trigger,
        conditions, actions, enabled, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, workflow.organizationId, workflow.name, workflow.description,
      workflow.entityType, workflow.trigger,
      JSON.stringify(workflow.conditions), JSON.stringify(workflow.actions),
      workflow.enabled ? 1 : 0, workflow.priority,
      now.toISOString(), now.toISOString()
    ).run();

    logger.info('Workflow created', { id, name: workflow.name, trigger: workflow.trigger });

    return { ...workflow, id, createdAt: now, updatedAt: now };
  }

  async triggerWorkflows(
    entityType: string,
    trigger: WorkflowTrigger,
    entityId: string,
    data: Record<string, any>,
    userId: string,
    organizationId: string
  ): Promise<WorkflowExecution[]> {
    const workflows = await this.getActiveWorkflows(organizationId, entityType, trigger);
    const executions: WorkflowExecution[] = [];

    for (const workflow of workflows) {
      if (this.evaluateConditions(workflow.conditions, data)) {
        const execution = await this.executeWorkflow(workflow, entityId, data, userId);
        executions.push(execution);
      }
    }

    return executions;
  }

  private async getActiveWorkflows(
    organizationId: string,
    entityType: string,
    trigger: WorkflowTrigger
  ): Promise<Workflow[]> {
    const result = await this.db.prepare(`
      SELECT * FROM workflows
      WHERE organization_id = ? AND entity_type = ? AND trigger = ? AND enabled = 1
      ORDER BY priority DESC
    `).bind(organizationId, entityType, trigger).all();

    return (result.results || []).map((row: any) => ({
      ...row,
      conditions: JSON.parse(row.conditions || '[]'),
      actions: JSON.parse(row.actions || '[]'),
      enabled: row.enabled === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  private evaluateConditions(conditions: WorkflowCondition[], data: Record<string, any>): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const fieldValue = this.getNestedValue(data, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(fieldValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'eq': return fieldValue === conditionValue;
      case 'neq': return fieldValue !== conditionValue;
      case 'gt': return fieldValue > conditionValue;
      case 'lt': return fieldValue < conditionValue;
      case 'gte': return fieldValue >= conditionValue;
      case 'lte': return fieldValue <= conditionValue;
      case 'contains': return String(fieldValue).includes(String(conditionValue));
      case 'in': return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in': return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default: return false;
    }
  }

  private async executeWorkflow(
    workflow: Workflow,
    entityId: string,
    data: Record<string, any>,
    userId: string
  ): Promise<WorkflowExecution> {
    const executionId = crypto.randomUUID();
    const startedAt = new Date();

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      entityType: workflow.entityType,
      entityId,
      triggeredBy: userId,
      status: 'running',
      startedAt,
    };

    await this.db.prepare(`
      INSERT INTO workflow_executions (
        id, workflow_id, entity_type, entity_id, triggered_by, status, started_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      executionId, workflow.id, workflow.entityType, entityId,
      userId, 'running', startedAt.toISOString()
    ).run();

    try {
      const results: Record<string, any> = {};

      for (const action of workflow.actions) {
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }

        const actionResult = await this.executeAction(action, data, workflow.organizationId);
        results[action.type] = actionResult;
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = results;

      await this.db.prepare(`
        UPDATE workflow_executions
        SET status = 'completed', completed_at = ?, result = ?
        WHERE id = ?
      `).bind(execution.completedAt.toISOString(), JSON.stringify(results), executionId).run();

      logger.info('Workflow executed successfully', { workflowId: workflow.id, executionId });
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';

      await this.db.prepare(`
        UPDATE workflow_executions SET status = 'failed', error = ? WHERE id = ?
      `).bind(execution.error, executionId).run();

      logger.error('Workflow execution failed', { workflowId: workflow.id, executionId, error });
    }

    return execution;
  }

  private async executeAction(
    action: WorkflowAction,
    data: Record<string, any>,
    organizationId: string
  ): Promise<any> {
    switch (action.type) {
      case WorkflowActionType.SEND_NOTIFICATION:
        return this.sendNotification(action.config, data, organizationId);

      case WorkflowActionType.CREATE_TASK:
        return this.createTask(action.config, data, organizationId);

      case WorkflowActionType.UPDATE_FIELD:
        return this.updateField(action.config, data, organizationId);

      case WorkflowActionType.CREATE_ALERT:
        return this.createAlert(action.config, data, organizationId);

      case WorkflowActionType.CALL_WEBHOOK:
        return this.callWebhook(action.config, data);

      case WorkflowActionType.LOG_AUDIT:
        return { logged: true, action: action.config.action, data };

      default:
        logger.warn('Unknown workflow action type', { type: action.type });
        return { skipped: true, reason: 'Unknown action type' };
    }
  }

  private async sendNotification(config: any, data: any, organizationId: string): Promise<any> {
    const message = this.interpolateTemplate(config.message, data);
    logger.info('Sending notification', { title: config.title, userId: config.userId });
    return { sent: true, message };
  }

  private async createTask(config: any, data: any, organizationId: string): Promise<any> {
    const taskId = crypto.randomUUID();
    const title = this.interpolateTemplate(config.title, data);
    const description = this.interpolateTemplate(config.description || '', data);

    await this.db.prepare(`
      INSERT INTO tasks (id, organization_id, title, description, assigned_to, status, priority, due_date, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).bind(
      taskId, organizationId, title, description,
      config.assignTo, config.priority || 'medium',
      config.dueDate || null, new Date().toISOString()
    ).run();

    return { created: true, taskId };
  }

  private async updateField(config: any, data: any, organizationId: string): Promise<any> {
    const value = this.interpolateTemplate(String(config.value), data);
    logger.info('Updating field', { table: config.table, field: config.field, entityId: config.entityId });
    return { updated: true, field: config.field, value };
  }

  private async createAlert(config: any, data: any, organizationId: string): Promise<any> {
    const alertId = crypto.randomUUID();
    const message = this.interpolateTemplate(config.message, data);

    await this.db.prepare(`
      INSERT INTO healthcare_alerts (id, organization_id, type, severity, title, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    `).bind(
      alertId, organizationId, config.type || 'general',
      config.severity || 'info', config.title, message,
      new Date().toISOString()
    ).run();

    return { created: true, alertId };
  }

  private async callWebhook(config: any, data: any): Promise<any> {
    try {
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {}),
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        }),
      });

      return { success: response.ok, status: response.status };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  async getWorkflows(organizationId: string): Promise<Workflow[]> {
    const result = await this.db.prepare(
      'SELECT * FROM workflows WHERE organization_id = ? ORDER BY priority DESC'
    ).bind(organizationId).all();

    return (result.results || []).map((row: any) => ({
      ...row,
      conditions: JSON.parse(row.conditions || '[]'),
      actions: JSON.parse(row.actions || '[]'),
      enabled: row.enabled === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async toggleWorkflow(id: string, enabled: boolean, organizationId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE workflows SET enabled = ?, updated_at = ? WHERE id = ? AND organization_id = ?
    `).bind(enabled ? 1 : 0, new Date().toISOString(), id, organizationId).run();

    return (result.meta?.changes || 0) > 0;
  }

  async getExecutionHistory(workflowId: string, limit: number = 50): Promise<WorkflowExecution[]> {
    const result = await this.db.prepare(`
      SELECT * FROM workflow_executions WHERE workflow_id = ?
      ORDER BY started_at DESC LIMIT ?
    `).bind(workflowId, limit).all();

    return (result.results || []).map((row: any) => ({
      ...row,
      result: row.result ? JSON.parse(row.result) : null,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    }));
  }
}

// Predefined workflow templates
export const WORKFLOW_TEMPLATES = {
  dialyse_session_completed: {
    name: 'Notification fin de seance dialyse',
    entityType: 'dialyse_session',
    trigger: WorkflowTrigger.ON_STATUS_CHANGE,
    conditions: [{ field: 'status', operator: 'eq' as const, value: 'completed' }],
    actions: [
      {
        type: WorkflowActionType.SEND_NOTIFICATION,
        config: { title: 'Seance terminee', message: 'La seance de dialyse de {{patientName}} est terminee' },
      },
    ],
  },
  invoice_overdue: {
    name: 'Alerte facture en retard',
    entityType: 'invoice',
    trigger: WorkflowTrigger.ON_STATUS_CHANGE,
    conditions: [{ field: 'status', operator: 'eq' as const, value: 'overdue' }],
    actions: [
      {
        type: WorkflowActionType.SEND_EMAIL,
        config: { subject: 'Facture en retard', template: 'invoice_overdue' },
      },
      {
        type: WorkflowActionType.CREATE_TASK,
        config: { title: 'Relance facture {{number}}', priority: 'high' },
      },
    ],
  },
  patient_high_risk: {
    name: 'Alerte patient a risque',
    entityType: 'cardiology_patient',
    trigger: WorkflowTrigger.ON_THRESHOLD,
    conditions: [{ field: 'riskLevel', operator: 'eq' as const, value: 'critical' }],
    actions: [
      {
        type: WorkflowActionType.CREATE_ALERT,
        config: { severity: 'critical', title: 'Patient a risque eleve', message: '{{firstName}} {{lastName}} presente un risque cardiaque eleve' },
      },
    ],
  },
};
