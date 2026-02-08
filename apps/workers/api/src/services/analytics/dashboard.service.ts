/**
 * Dashboard Analytics Service
 * Provides comprehensive analytics for healthcare modules
 *
 * Features:
 * - Real-time KPIs for each module
 * - Trend analysis
 * - Performance metrics
 * - Comparative statistics
 */

import { drizzle } from 'drizzle-orm/d1';
import { sql, eq, and, gte, lte, count, avg, sum, desc } from 'drizzle-orm';
import { logger } from '../../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface KPIMetric {
  name: string;
  value: number;
  unit?: string;
  previousValue?: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'stable';
  target?: number;
  targetStatus?: 'above' | 'below' | 'on_target';
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface DistributionItem {
  category: string;
  count: number;
  percentage: number;
  color?: string;
}

// ============================================================================
// Dialyse Analytics
// ============================================================================

export interface DialyseAnalytics {
  kpis: {
    totalPatients: KPIMetric;
    activePatients: KPIMetric;
    sessionsToday: KPIMetric;
    sessionsThisMonth: KPIMetric;
    avgKtV: KPIMetric;
    ktVAdequacy: KPIMetric;
    machineUtilization: KPIMetric;
    avgSessionDuration: KPIMetric;
    complicationRate: KPIMetric;
    alertsActive: KPIMetric;
  };
  trends: {
    sessionsPerDay: TrendDataPoint[];
    ktVTrend: TrendDataPoint[];
    patientGrowth: TrendDataPoint[];
  };
  distributions: {
    serologyStatus: DistributionItem[];
    accessType: DistributionItem[];
    dialysisModality: DistributionItem[];
    machineStatus: DistributionItem[];
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
}

export class DialyseAnalyticsService {
  constructor(private db: D1Database) {}

  async getDashboardAnalytics(
    organizationId: string,
    dateRange?: DateRange
  ): Promise<DialyseAnalytics> {
    const drizzleDb = drizzle(this.db);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel queries for KPIs
    const [
      patientStats,
      sessionStatsToday,
      sessionStatsMonth,
      sessionStatsLastMonth,
      ktVStats,
      machineStats,
      alertStats,
    ] = await Promise.all([
      // Patient counts
      this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as new_this_month
        FROM dialyse_patients
        WHERE organization_id = ?
      `).bind(startOfMonth.toISOString(), organizationId).first() as any,

      // Today's sessions
      this.db.prepare(`
        SELECT COUNT(*) as count, AVG(actual_duration) as avg_duration
        FROM dialyse_sessions
        WHERE organization_id = ?
        AND DATE(session_date) = DATE('now')
      `).bind(organizationId).first() as any,

      // This month's sessions
      this.db.prepare(`
        SELECT
          COUNT(*) as count,
          AVG(CASE WHEN kt_v IS NOT NULL THEN kt_v ELSE NULL END) as avg_ktv,
          SUM(CASE WHEN kt_v >= 1.2 THEN 1 ELSE 0 END) as adequate_ktv,
          SUM(CASE WHEN complications IS NOT NULL AND complications != '[]' THEN 1 ELSE 0 END) as with_complications
        FROM dialyse_sessions
        WHERE organization_id = ?
        AND session_date >= ?
      `).bind(organizationId, startOfMonth.toISOString()).first() as any,

      // Last month's sessions (for comparison)
      this.db.prepare(`
        SELECT COUNT(*) as count, AVG(kt_v) as avg_ktv
        FROM dialyse_sessions
        WHERE organization_id = ?
        AND session_date >= ? AND session_date <= ?
      `).bind(organizationId, startOfLastMonth.toISOString(), endOfLastMonth.toISOString()).first() as any,

      // Kt/V statistics
      this.db.prepare(`
        SELECT
          AVG(kt_v) as avg,
          MIN(kt_v) as min,
          MAX(kt_v) as max,
          COUNT(*) as total,
          SUM(CASE WHEN kt_v >= 1.2 THEN 1 ELSE 0 END) as adequate
        FROM dialyse_sessions
        WHERE organization_id = ?
        AND kt_v IS NOT NULL
        AND session_date >= DATE('now', '-30 days')
      `).bind(organizationId).first() as any,

      // Machine statistics
      this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
          SUM(CASE WHEN status = 'out_of_service' THEN 1 ELSE 0 END) as out_of_service
        FROM dialyse_machines
        WHERE organization_id = ?
      `).bind(organizationId).first() as any,

      // Active alerts
      this.db.prepare(`
        SELECT
          severity,
          COUNT(*) as count
        FROM dialyse_clinical_alerts
        WHERE organization_id = ?
        AND status = 'active'
        GROUP BY severity
      `).bind(organizationId).all() as any,
    ]);

    // Calculate KPIs
    const totalPatients = patientStats?.total || 0;
    const activePatients = patientStats?.active || 0;
    const sessionsToday = sessionStatsToday?.count || 0;
    const sessionsThisMonth = sessionStatsMonth?.count || 0;
    const sessionsLastMonth = sessionStatsLastMonth?.count || 0;
    const avgKtV = ktVStats?.avg || 0;
    const ktVAdequacyRate = ktVStats?.total > 0
      ? (ktVStats.adequate / ktVStats.total) * 100
      : 0;
    const machineUtilization = machineStats?.total > 0
      ? (machineStats.active / machineStats.total) * 100
      : 0;
    const complicationRate = sessionStatsMonth?.count > 0
      ? ((sessionStatsMonth.with_complications || 0) / sessionStatsMonth.count) * 100
      : 0;

    // Parse alerts
    const alertCounts = { critical: 0, warning: 0, info: 0 };
    if (alertStats?.results) {
      for (const row of alertStats.results) {
        if (row.severity === 'critical') alertCounts.critical = row.count;
        else if (row.severity === 'high' || row.severity === 'warning') alertCounts.warning = row.count;
        else alertCounts.info = row.count;
      }
    }

    // Get trends (last 30 days)
    const sessionsPerDayQuery = await this.db.prepare(`
      SELECT
        DATE(session_date) as date,
        COUNT(*) as value
      FROM dialyse_sessions
      WHERE organization_id = ?
      AND session_date >= DATE('now', '-30 days')
      GROUP BY DATE(session_date)
      ORDER BY date
    `).bind(organizationId).all() as any;

    const ktVTrendQuery = await this.db.prepare(`
      SELECT
        DATE(session_date) as date,
        AVG(kt_v) as value
      FROM dialyse_sessions
      WHERE organization_id = ?
      AND kt_v IS NOT NULL
      AND session_date >= DATE('now', '-30 days')
      GROUP BY DATE(session_date)
      ORDER BY date
    `).bind(organizationId).all() as any;

    // Get distributions
    const [serologyDist, accessDist, modalityDist, machineStatusDist] = await Promise.all([
      this.db.prepare(`
        SELECT
          CASE
            WHEN hbsag_status = 'positive' OR hcv_status = 'positive' OR hiv_status = 'positive'
            THEN 'Positive'
            ELSE 'Negative'
          END as category,
          COUNT(*) as count
        FROM dialyse_patients
        WHERE organization_id = ? AND status = 'active'
        GROUP BY category
      `).bind(organizationId).all() as any,

      this.db.prepare(`
        SELECT vascular_access_type as category, COUNT(*) as count
        FROM dialyse_patients
        WHERE organization_id = ? AND status = 'active'
        GROUP BY vascular_access_type
      `).bind(organizationId).all() as any,

      this.db.prepare(`
        SELECT dialysis_modality as category, COUNT(*) as count
        FROM dialyse_patients
        WHERE organization_id = ? AND status = 'active'
        GROUP BY dialysis_modality
      `).bind(organizationId).all() as any,

      this.db.prepare(`
        SELECT status as category, COUNT(*) as count
        FROM dialyse_machines
        WHERE organization_id = ?
        GROUP BY status
      `).bind(organizationId).all() as any,
    ]);

    return {
      kpis: {
        totalPatients: {
          name: 'Total Patients',
          value: totalPatients,
          previousValue: totalPatients - (patientStats?.new_this_month || 0),
          change: patientStats?.new_this_month || 0,
          changeType: (patientStats?.new_this_month || 0) > 0 ? 'increase' : 'stable',
        },
        activePatients: {
          name: 'Patients Actifs',
          value: activePatients,
        },
        sessionsToday: {
          name: 'Séances Aujourd\'hui',
          value: sessionsToday,
        },
        sessionsThisMonth: {
          name: 'Séances ce Mois',
          value: sessionsThisMonth,
          previousValue: sessionsLastMonth,
          change: sessionsThisMonth - sessionsLastMonth,
          changeType: this.getChangeType(sessionsThisMonth, sessionsLastMonth),
        },
        avgKtV: {
          name: 'Kt/V Moyen',
          value: Math.round(avgKtV * 100) / 100,
          target: 1.2,
          targetStatus: avgKtV >= 1.4 ? 'above' : avgKtV >= 1.2 ? 'on_target' : 'below',
        },
        ktVAdequacy: {
          name: 'Adéquation Kt/V',
          value: Math.round(ktVAdequacyRate),
          unit: '%',
          target: 90,
          targetStatus: ktVAdequacyRate >= 90 ? 'on_target' : 'below',
        },
        machineUtilization: {
          name: 'Utilisation Machines',
          value: Math.round(machineUtilization),
          unit: '%',
        },
        avgSessionDuration: {
          name: 'Durée Moyenne Séance',
          value: Math.round(sessionStatsToday?.avg_duration || 240),
          unit: 'min',
        },
        complicationRate: {
          name: 'Taux Complications',
          value: Math.round(complicationRate * 10) / 10,
          unit: '%',
          target: 5,
          targetStatus: complicationRate <= 5 ? 'on_target' : 'below',
        },
        alertsActive: {
          name: 'Alertes Actives',
          value: alertCounts.critical + alertCounts.warning,
        },
      },
      trends: {
        sessionsPerDay: this.formatTrend(sessionsPerDayQuery?.results || []),
        ktVTrend: this.formatTrend(ktVTrendQuery?.results || [], true),
        patientGrowth: [], // Would need historical data
      },
      distributions: {
        serologyStatus: this.formatDistribution(serologyDist?.results || []),
        accessType: this.formatDistribution(accessDist?.results || []),
        dialysisModality: this.formatDistribution(modalityDist?.results || []),
        machineStatus: this.formatDistribution(machineStatusDist?.results || []),
      },
      alerts: alertCounts,
    };
  }

  private getChangeType(current: number, previous: number): 'increase' | 'decrease' | 'stable' {
    if (current > previous) return 'increase';
    if (current < previous) return 'decrease';
    return 'stable';
  }

  private formatTrend(results: any[], round: boolean = false): TrendDataPoint[] {
    return results.map(r => ({
      date: r.date,
      value: round ? Math.round(r.value * 100) / 100 : r.value,
    }));
  }

  private formatDistribution(results: any[]): DistributionItem[] {
    const total = results.reduce((sum, r) => sum + r.count, 0);
    return results.map(r => ({
      category: r.category || 'Non spécifié',
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0,
    }));
  }
}

// ============================================================================
// Cardiology Analytics
// ============================================================================

export interface CardiologyAnalytics {
  kpis: {
    totalPatients: KPIMetric;
    activePatients: KPIMetric;
    consultationsThisMonth: KPIMetric;
    ecgsThisMonth: KPIMetric;
    echosThisMonth: KPIMetric;
    pacemakers: KPIMetric;
    stents: KPIMetric;
    avgLVEF: KPIMetric;
    highRiskPatients: KPIMetric;
    alertsActive: KPIMetric;
  };
  trends: {
    consultationsPerDay: TrendDataPoint[];
    lvefTrend: TrendDataPoint[];
    proceduresPerMonth: TrendDataPoint[];
  };
  distributions: {
    diagnosisCategories: DistributionItem[];
    riskLevels: DistributionItem[];
    procedureTypes: DistributionItem[];
  };
}

export class CardiologyAnalyticsService {
  constructor(private db: D1Database) {}

  async getDashboardAnalytics(
    organizationId: string,
    dateRange?: DateRange
  ): Promise<CardiologyAnalytics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      patientStats,
      consultationStats,
      ecgStats,
      echoStats,
      deviceStats,
      riskStats,
    ] = await Promise.all([
      // Patient counts
      this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
        FROM healthcare_patients
        WHERE company_id = ? AND module = 'cardiology'
      `).bind(organizationId).first() as any,

      // Consultations this month
      this.db.prepare(`
        SELECT COUNT(*) as count
        FROM healthcare_consultations
        WHERE organization_id = ?
        AND module = 'cardiology'
        AND consultation_date >= ?
      `).bind(organizationId, startOfMonth.toISOString()).first() as any,

      // ECGs this month
      this.db.prepare(`
        SELECT COUNT(*) as count
        FROM cardiology_ecg_records
        WHERE organization_id = ?
        AND recording_date >= ?
      `).bind(organizationId, startOfMonth.toISOString()).first() as any,

      // Echocardiograms with LVEF
      this.db.prepare(`
        SELECT
          COUNT(*) as count,
          AVG(lvef) as avg_lvef
        FROM cardiology_echocardiograms
        WHERE organization_id = ?
        AND exam_date >= ?
      `).bind(organizationId, startOfMonth.toISOString()).first() as any,

      // Devices
      this.db.prepare(`
        SELECT
          SUM(CASE WHEN device_type = 'pacemaker' THEN 1 ELSE 0 END) as pacemakers,
          SUM(CASE WHEN device_type = 'stent' THEN 1 ELSE 0 END) as stents,
          SUM(CASE WHEN device_type = 'icd' THEN 1 ELSE 0 END) as icds
        FROM cardiology_pacemakers
        WHERE organization_id = ? AND status = 'active'
      `).bind(organizationId).first() as any,

      // Risk scores
      this.db.prepare(`
        SELECT
          SUM(CASE WHEN risk_level = 'high' OR risk_level = 'very_high' THEN 1 ELSE 0 END) as high_risk,
          COUNT(*) as total
        FROM cardiology_risk_scores
        WHERE organization_id = ?
        AND calculated_date >= DATE('now', '-90 days')
      `).bind(organizationId).first() as any,
    ]);

    // Get trends
    const consultationsPerDayQuery = await this.db.prepare(`
      SELECT
        DATE(consultation_date) as date,
        COUNT(*) as value
      FROM healthcare_consultations
      WHERE organization_id = ?
      AND module = 'cardiology'
      AND consultation_date >= DATE('now', '-30 days')
      GROUP BY DATE(consultation_date)
      ORDER BY date
    `).bind(organizationId).all() as any;

    // Get distributions
    const diagnosisDist = await this.db.prepare(`
      SELECT primary_diagnosis as category, COUNT(*) as count
      FROM healthcare_consultations
      WHERE organization_id = ? AND module = 'cardiology'
      AND consultation_date >= DATE('now', '-90 days')
      GROUP BY primary_diagnosis
      ORDER BY count DESC
      LIMIT 10
    `).bind(organizationId).all() as any;

    return {
      kpis: {
        totalPatients: {
          name: 'Total Patients',
          value: patientStats?.total || 0,
        },
        activePatients: {
          name: 'Patients Actifs',
          value: patientStats?.active || 0,
        },
        consultationsThisMonth: {
          name: 'Consultations ce Mois',
          value: consultationStats?.count || 0,
        },
        ecgsThisMonth: {
          name: 'ECG ce Mois',
          value: ecgStats?.count || 0,
        },
        echosThisMonth: {
          name: 'Échocardiographies ce Mois',
          value: echoStats?.count || 0,
        },
        pacemakers: {
          name: 'Pacemakers Actifs',
          value: deviceStats?.pacemakers || 0,
        },
        stents: {
          name: 'Stents Posés',
          value: deviceStats?.stents || 0,
        },
        avgLVEF: {
          name: 'FEVG Moyenne',
          value: Math.round(echoStats?.avg_lvef || 0),
          unit: '%',
          target: 55,
          targetStatus: (echoStats?.avg_lvef || 0) >= 55 ? 'on_target' : 'below',
        },
        highRiskPatients: {
          name: 'Patients Haut Risque',
          value: riskStats?.high_risk || 0,
        },
        alertsActive: {
          name: 'Alertes Actives',
          value: 0, // Would need alerts table query
        },
      },
      trends: {
        consultationsPerDay: this.formatTrend(consultationsPerDayQuery?.results || []),
        lvefTrend: [],
        proceduresPerMonth: [],
      },
      distributions: {
        diagnosisCategories: this.formatDistribution(diagnosisDist?.results || []),
        riskLevels: [],
        procedureTypes: [],
      },
    };
  }

  private formatTrend(results: any[]): TrendDataPoint[] {
    return results.map(r => ({
      date: r.date,
      value: r.value,
    }));
  }

  private formatDistribution(results: any[]): DistributionItem[] {
    const total = results.reduce((sum, r) => sum + r.count, 0);
    return results.map(r => ({
      category: r.category || 'Non spécifié',
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0,
    }));
  }
}

// ============================================================================
// Ophthalmology Analytics
// ============================================================================

export interface OphthalmologyAnalytics {
  kpis: {
    totalPatients: KPIMetric;
    activePatients: KPIMetric;
    consultationsThisMonth: KPIMetric;
    octScansThisMonth: KPIMetric;
    ivtInjectionsThisMonth: KPIMetric;
    surgeriesThisMonth: KPIMetric;
    avgIOP: KPIMetric;
    avgVisualAcuity: KPIMetric;
    dmePatients: KPIMetric;
    glaucomaPatients: KPIMetric;
  };
  trends: {
    consultationsPerDay: TrendDataPoint[];
    injectionsTrend: TrendDataPoint[];
    iopTrend: TrendDataPoint[];
  };
  distributions: {
    diagnosisCategories: DistributionItem[];
    surgeryTypes: DistributionItem[];
    injectionTypes: DistributionItem[];
  };
}

export class OphthalmologyAnalyticsService {
  constructor(private db: D1Database) {}

  async getDashboardAnalytics(
    organizationId: string,
    dateRange?: DateRange
  ): Promise<OphthalmologyAnalytics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      patientStats,
      consultationStats,
      octStats,
      ivtStats,
      surgeryStats,
      iopStats,
    ] = await Promise.all([
      // Patient counts
      this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
        FROM healthcare_patients
        WHERE company_id = ? AND module = 'ophthalmology'
      `).bind(organizationId).first() as any,

      // Consultations this month
      this.db.prepare(`
        SELECT COUNT(*) as count
        FROM healthcare_consultations
        WHERE organization_id = ?
        AND module = 'ophthalmology'
        AND consultation_date >= ?
      `).bind(organizationId, startOfMonth.toISOString()).first() as any,

      // OCT scans
      this.db.prepare(`
        SELECT COUNT(*) as count
        FROM ophthalmology_oct_scans
        WHERE organization_id = ?
        AND scan_date >= ?
      `).bind(organizationId, startOfMonth.toISOString()).first() as any,

      // IVT injections
      this.db.prepare(`
        SELECT
          COUNT(*) as count,
          drug_name,
          COUNT(*) as drug_count
        FROM ophthalmology_ivt_injections
        WHERE organization_id = ?
        AND injection_date >= ?
        GROUP BY drug_name
      `).bind(organizationId, startOfMonth.toISOString()).all() as any,

      // Surgeries
      this.db.prepare(`
        SELECT
          COUNT(*) as count,
          surgery_type,
          COUNT(*) as type_count
        FROM ophthalmology_surgeries
        WHERE organization_id = ?
        AND surgery_date >= ?
        GROUP BY surgery_type
      `).bind(organizationId, startOfMonth.toISOString()).all() as any,

      // Average IOP from tonometry
      this.db.prepare(`
        SELECT
          AVG(iop_right) as avg_iop_right,
          AVG(iop_left) as avg_iop_left
        FROM ophthalmology_tonometry
        WHERE organization_id = ?
        AND measurement_date >= DATE('now', '-30 days')
      `).bind(organizationId).first() as any,
    ]);

    // Get trends
    const consultationsPerDayQuery = await this.db.prepare(`
      SELECT
        DATE(consultation_date) as date,
        COUNT(*) as value
      FROM healthcare_consultations
      WHERE organization_id = ?
      AND module = 'ophthalmology'
      AND consultation_date >= DATE('now', '-30 days')
      GROUP BY DATE(consultation_date)
      ORDER BY date
    `).bind(organizationId).all() as any;

    const avgIOP = iopStats
      ? ((iopStats.avg_iop_right || 0) + (iopStats.avg_iop_left || 0)) / 2
      : 0;

    const totalIVT = ivtStats?.results?.reduce((sum: number, r: any) => sum + r.count, 0) || 0;
    const totalSurgeries = surgeryStats?.results?.reduce((sum: number, r: any) => sum + r.count, 0) || 0;

    return {
      kpis: {
        totalPatients: {
          name: 'Total Patients',
          value: patientStats?.total || 0,
        },
        activePatients: {
          name: 'Patients Actifs',
          value: patientStats?.active || 0,
        },
        consultationsThisMonth: {
          name: 'Consultations ce Mois',
          value: consultationStats?.count || 0,
        },
        octScansThisMonth: {
          name: 'OCT ce Mois',
          value: octStats?.count || 0,
        },
        ivtInjectionsThisMonth: {
          name: 'IVT ce Mois',
          value: totalIVT,
        },
        surgeriesThisMonth: {
          name: 'Chirurgies ce Mois',
          value: totalSurgeries,
        },
        avgIOP: {
          name: 'PIO Moyenne',
          value: Math.round(avgIOP * 10) / 10,
          unit: 'mmHg',
          target: 21,
          targetStatus: avgIOP <= 21 ? 'on_target' : 'below',
        },
        avgVisualAcuity: {
          name: 'Acuité Visuelle Moy.',
          value: 0, // Would need VA data
          unit: '/10',
        },
        dmePatients: {
          name: 'Patients OMD',
          value: 0, // Would need diagnosis query
        },
        glaucomaPatients: {
          name: 'Patients Glaucome',
          value: 0, // Would need diagnosis query
        },
      },
      trends: {
        consultationsPerDay: this.formatTrend(consultationsPerDayQuery?.results || []),
        injectionsTrend: [],
        iopTrend: [],
      },
      distributions: {
        diagnosisCategories: [],
        surgeryTypes: this.formatDistribution(
          surgeryStats?.results?.map((r: any) => ({
            category: r.surgery_type,
            count: r.type_count,
          })) || []
        ),
        injectionTypes: this.formatDistribution(
          ivtStats?.results?.map((r: any) => ({
            category: r.drug_name,
            count: r.drug_count,
          })) || []
        ),
      },
    };
  }

  private formatTrend(results: any[]): TrendDataPoint[] {
    return results.map(r => ({
      date: r.date,
      value: r.value,
    }));
  }

  private formatDistribution(results: any[]): DistributionItem[] {
    const total = results.reduce((sum, r) => sum + r.count, 0);
    return results.map(r => ({
      category: r.category || 'Non spécifié',
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0,
    }));
  }
}

// ============================================================================
// Global Analytics
// ============================================================================

export interface GlobalHealthcareAnalytics {
  overview: {
    totalPatients: number;
    totalConsultations: number;
    totalProcedures: number;
    activeAlerts: number;
  };
  moduleBreakdown: {
    dialyse: { patients: number; sessionsToday: number };
    cardiology: { patients: number; consultationsToday: number };
    ophthalmology: { patients: number; consultationsToday: number };
  };
  recentActivity: {
    type: string;
    module: string;
    description: string;
    timestamp: string;
    user?: string;
  }[];
  upcomingTasks: {
    type: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
  }[];
}

export class GlobalAnalyticsService {
  constructor(private db: D1Database) {}

  async getGlobalDashboard(organizationId: string): Promise<GlobalHealthcareAnalytics> {
    const [
      dialyseStats,
      cardiologyStats,
      ophthalmologyStats,
      consultationStats,
      alertStats,
    ] = await Promise.all([
      // Dialyse
      this.db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM dialyse_patients WHERE organization_id = ? AND status = 'active') as patients,
          (SELECT COUNT(*) FROM dialyse_sessions WHERE organization_id = ? AND DATE(session_date) = DATE('now')) as sessions_today
      `).bind(organizationId, organizationId).first() as any,

      // Cardiology
      this.db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM healthcare_patients WHERE company_id = ? AND module = 'cardiology' AND status = 'active') as patients,
          (SELECT COUNT(*) FROM healthcare_consultations WHERE organization_id = ? AND module = 'cardiology' AND DATE(consultation_date) = DATE('now')) as consultations_today
      `).bind(organizationId, organizationId).first() as any,

      // Ophthalmology
      this.db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM healthcare_patients WHERE company_id = ? AND module = 'ophthalmology' AND status = 'active') as patients,
          (SELECT COUNT(*) FROM healthcare_consultations WHERE organization_id = ? AND module = 'ophthalmology' AND DATE(consultation_date) = DATE('now')) as consultations_today
      `).bind(organizationId, organizationId).first() as any,

      // Total consultations this month
      this.db.prepare(`
        SELECT COUNT(*) as count
        FROM healthcare_consultations
        WHERE organization_id = ?
        AND consultation_date >= DATE('now', 'start of month')
      `).bind(organizationId).first() as any,

      // Active alerts
      this.db.prepare(`
        SELECT COUNT(*) as count
        FROM healthcare_alerts
        WHERE organization_id = ? AND status = 'active'
      `).bind(organizationId).first() as any,
    ]);

    const totalPatients =
      (dialyseStats?.patients || 0) +
      (cardiologyStats?.patients || 0) +
      (ophthalmologyStats?.patients || 0);

    return {
      overview: {
        totalPatients,
        totalConsultations: consultationStats?.count || 0,
        totalProcedures: 0, // Would aggregate procedures
        activeAlerts: alertStats?.count || 0,
      },
      moduleBreakdown: {
        dialyse: {
          patients: dialyseStats?.patients || 0,
          sessionsToday: dialyseStats?.sessions_today || 0,
        },
        cardiology: {
          patients: cardiologyStats?.patients || 0,
          consultationsToday: cardiologyStats?.consultations_today || 0,
        },
        ophthalmology: {
          patients: ophthalmologyStats?.patients || 0,
          consultationsToday: ophthalmologyStats?.consultations_today || 0,
        },
      },
      recentActivity: [],
      upcomingTasks: [],
    };
  }
}

// ============================================================================
// Main Export
// ============================================================================

export class DashboardAnalyticsService {
  dialyse: DialyseAnalyticsService;
  cardiology: CardiologyAnalyticsService;
  ophthalmology: OphthalmologyAnalyticsService;
  global: GlobalAnalyticsService;

  constructor(private db: D1Database) {
    this.dialyse = new DialyseAnalyticsService(db);
    this.cardiology = new CardiologyAnalyticsService(db);
    this.ophthalmology = new OphthalmologyAnalyticsService(db);
    this.global = new GlobalAnalyticsService(db);
  }
}

export default DashboardAnalyticsService;
