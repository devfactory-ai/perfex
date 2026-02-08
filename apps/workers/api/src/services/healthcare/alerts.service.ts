/**
 * Healthcare Alerts Service
 * Intelligent alert system for healthcare modules
 */

import { logger } from '../../utils/logger';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

export enum AlertType {
  SEROLOGY_CHANGE = 'dialyse.serology_change',
  WEIGHT_DEVIATION = 'dialyse.weight_deviation',
  KTV_LOW = 'dialyse.ktv_low',
  MACHINE_MAINTENANCE = 'dialyse.machine_maintenance',
  MISSED_SESSION = 'dialyse.missed_session',
  LVEF_CRITICAL = 'cardiology.lvef_critical',
  PACEMAKER_CHECK_DUE = 'cardiology.pacemaker_check_due',
  IOP_HIGH = 'ophthalmology.iop_high',
  IVT_DUE = 'ophthalmology.ivt_due',
}

export interface Alert {
  id: string;
  organizationId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  patientId?: string;
  patientName?: string;
  data?: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
}

export class HealthcareAlertsService {
  constructor(private db: D1Database) {}

  async createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'status'>): Promise<Alert> {
    const id = crypto.randomUUID();
    const createdAt = new Date();

    await this.db.prepare(`
      INSERT INTO healthcare_alerts (
        id, organization_id, type, severity, title, message,
        patient_id, patient_name, data, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `).bind(
      id, alert.organizationId, alert.type, alert.severity,
      alert.title, alert.message, alert.patientId || null,
      alert.patientName || null, alert.data ? JSON.stringify(alert.data) : null,
      createdAt.toISOString()
    ).run();

    logger.info('Alert created', { id, type: alert.type, severity: alert.severity });
    return { ...alert, id, status: 'active', createdAt };
  }

  async checkDialysePatientAlerts(orgId: string, patientId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const patient = await this.db.prepare(
      'SELECT * FROM dialyse_patients WHERE id = ? AND organization_id = ?'
    ).bind(patientId, orgId).first<any>();

    if (!patient) return alerts;

    const recentSession = await this.db.prepare(`
      SELECT post_weight, ktv FROM dialyse_sessions
      WHERE patient_id = ? AND status = 'completed'
      ORDER BY session_date DESC LIMIT 1
    `).bind(patientId).first<any>();

    if (recentSession && patient.dry_weight) {
      const deviation = Math.abs(recentSession.post_weight - patient.dry_weight);
      if (deviation > 2) {
        alerts.push(await this.createAlert({
          organizationId: orgId,
          type: AlertType.WEIGHT_DEVIATION,
          severity: deviation > 3 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
          title: 'Deviation du poids sec',
          message: 'Ecart de ' + deviation.toFixed(1) + 'kg par rapport au poids sec cible',
          patientId,
          patientName: patient.first_name + ' ' + patient.last_name,
          data: { dryWeight: patient.dry_weight, actualWeight: recentSession.post_weight },
        }));
      }
    }

    if (recentSession?.ktv && recentSession.ktv < 1.2) {
      alerts.push(await this.createAlert({
        organizationId: orgId,
        type: AlertType.KTV_LOW,
        severity: recentSession.ktv < 1.0 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        title: 'KT/V insuffisant',
        message: 'KT/V de ' + recentSession.ktv.toFixed(2) + ' (objectif: >= 1.2)',
        patientId,
        patientName: patient.first_name + ' ' + patient.last_name,
        data: { ktv: recentSession.ktv },
      }));
    }

    return alerts;
  }

  async acknowledgeAlert(id: string, userId: string, orgId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE healthcare_alerts SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ?
      WHERE id = ? AND organization_id = ? AND status = 'active'
    `).bind(userId, new Date().toISOString(), id, orgId).run();
    return (result.meta?.changes || 0) > 0;
  }

  async resolveAlert(id: string, userId: string, orgId: string): Promise<boolean> {
    const result = await this.db.prepare(`
      UPDATE healthcare_alerts SET status = 'resolved', resolved_by = ?, resolved_at = ?
      WHERE id = ? AND organization_id = ?
    `).bind(userId, new Date().toISOString(), id, orgId).run();
    return (result.meta?.changes || 0) > 0;
  }

  async getActiveAlerts(orgId: string, patientId?: string): Promise<Alert[]> {
    let query = 'SELECT * FROM healthcare_alerts WHERE organization_id = ? AND status = ?';
    const params: any[] = [orgId, 'active'];

    if (patientId) {
      query += ' AND patient_id = ?';
      params.push(patientId);
    }

    query += ' ORDER BY CASE severity WHEN "emergency" THEN 1 WHEN "critical" THEN 2 WHEN "warning" THEN 3 ELSE 4 END, created_at DESC';

    const result = await this.db.prepare(query).bind(...params).all();
    return (result.results || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      type: row.type as AlertType,
      severity: row.severity as AlertSeverity,
      title: row.title,
      message: row.message,
      patientId: row.patient_id,
      patientName: row.patient_name,
      data: row.data ? JSON.parse(row.data) : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
    })) as Alert[];
  }

  async getAlertStats(orgId: string): Promise<{ total: number; bySeverity: Record<string, number> }> {
    const stats = await this.db.prepare(`
      SELECT severity, COUNT(*) as count FROM healthcare_alerts
      WHERE organization_id = ? AND status = 'active' GROUP BY severity
    `).bind(orgId).all();

    const bySeverity: Record<string, number> = {};
    let total = 0;

    (stats.results || []).forEach((row: any) => {
      bySeverity[row.severity] = row.count;
      total += row.count;
    });

    return { total, bySeverity };
  }
}
