/**
 * Report Generator Service
 * Generates clinical reports for healthcare modules
 *
 * Features:
 * - Monthly/Quarterly activity reports
 * - Patient-specific reports
 * - Quality indicators (KDQOI, etc.)
 * - Regulatory compliance reports
 * - Export to multiple formats
 */

import { logger } from '../../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ReportMetadata {
  id: string;
  title: string;
  type: ReportType;
  module: 'dialyse' | 'cardiology' | 'ophthalmology' | 'global';
  generatedAt: Date;
  generatedBy: string;
  organizationId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  format: 'json' | 'csv' | 'html';
}

export type ReportType =
  | 'monthly_activity'
  | 'quarterly_activity'
  | 'patient_summary'
  | 'quality_indicators'
  | 'kdqoi'
  | 'infection_surveillance'
  | 'vascular_access'
  | 'lab_trends'
  | 'procedure_log'
  | 'adverse_events'
  | 'audit_compliance';

export interface ReportSection {
  title: string;
  type: 'summary' | 'table' | 'chart' | 'text' | 'list';
  data: any;
}

export interface GeneratedReport {
  metadata: ReportMetadata;
  sections: ReportSection[];
  summary: string;
  recommendations: string[];
}

// ============================================================================
// Dialyse Report Generator
// ============================================================================

export class DialyseReportGenerator {
  constructor(private db: D1Database) {}

  /**
   * Generate monthly activity report
   */
  async generateMonthlyActivityReport(
    organizationId: string,
    year: number,
    month: number,
    generatedBy: string
  ): Promise<GeneratedReport> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [
      patientStats,
      sessionStats,
      ktVStats,
      complicationStats,
      machineStats,
    ] = await Promise.all([
      // Patient statistics
      this.db.prepare(`
        SELECT
          COUNT(*) as total_patients,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_patients,
          SUM(CASE WHEN created_at >= ? AND created_at <= ? THEN 1 ELSE 0 END) as new_patients,
          SUM(CASE WHEN status = 'deceased' AND updated_at >= ? AND updated_at <= ? THEN 1 ELSE 0 END) as deceased,
          SUM(CASE WHEN status = 'transferred' AND updated_at >= ? AND updated_at <= ? THEN 1 ELSE 0 END) as transferred
        FROM dialyse_patients
        WHERE organization_id = ?
      `).bind(
        startDate.toISOString(), endDate.toISOString(),
        startDate.toISOString(), endDate.toISOString(),
        startDate.toISOString(), endDate.toISOString(),
        organizationId
      ).first(),

      // Session statistics
      this.db.prepare(`
        SELECT
          COUNT(*) as total_sessions,
          AVG(actual_duration) as avg_duration,
          AVG(uf_volume) as avg_uf,
          AVG(blood_flow_rate) as avg_blood_flow,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM dialyse_sessions
        WHERE organization_id = ?
        AND session_date >= ? AND session_date <= ?
      `).bind(organizationId, startDate.toISOString(), endDate.toISOString()).first(),

      // Kt/V statistics
      this.db.prepare(`
        SELECT
          AVG(kt_v) as avg_ktv,
          MIN(kt_v) as min_ktv,
          MAX(kt_v) as max_ktv,
          COUNT(*) as total_measured,
          SUM(CASE WHEN kt_v >= 1.2 THEN 1 ELSE 0 END) as adequate,
          SUM(CASE WHEN kt_v >= 1.4 THEN 1 ELSE 0 END) as optimal
        FROM dialyse_sessions
        WHERE organization_id = ?
        AND session_date >= ? AND session_date <= ?
        AND kt_v IS NOT NULL
      `).bind(organizationId, startDate.toISOString(), endDate.toISOString()).first(),

      // Complications
      this.db.prepare(`
        SELECT
          json_extract(complications, '$[0].type') as complication_type,
          COUNT(*) as count
        FROM dialyse_sessions
        WHERE organization_id = ?
        AND session_date >= ? AND session_date <= ?
        AND complications IS NOT NULL AND complications != '[]'
        GROUP BY complication_type
      `).bind(organizationId, startDate.toISOString(), endDate.toISOString()).all(),

      // Machine utilization
      this.db.prepare(`
        SELECT
          m.name as machine_name,
          COUNT(s.id) as session_count,
          AVG(s.actual_duration) as avg_duration
        FROM dialyse_machines m
        LEFT JOIN dialyse_sessions s ON m.id = s.machine_id
        AND s.session_date >= ? AND s.session_date <= ?
        WHERE m.organization_id = ?
        GROUP BY m.id
      `).bind(startDate.toISOString(), endDate.toISOString(), organizationId).all(),
    ]);

    const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(startDate);

    // Build report sections
    const sections: ReportSection[] = [
      {
        title: 'Résumé de l\'Activité',
        type: 'summary',
        data: {
          periode: monthName,
          patientsActifs: patientStats?.active_patients || 0,
          nouveauxPatients: patientStats?.new_patients || 0,
          decedes: patientStats?.deceased || 0,
          transferes: patientStats?.transferred || 0,
          seancesRealisees: sessionStats?.completed || 0,
          seancesAnnulees: sessionStats?.cancelled || 0,
          tauxRealisation: sessionStats?.total_sessions > 0
            ? Math.round((sessionStats.completed / sessionStats.total_sessions) * 100)
            : 0,
        },
      },
      {
        title: 'Indicateurs de Qualité',
        type: 'table',
        data: {
          headers: ['Indicateur', 'Valeur', 'Objectif', 'Statut'],
          rows: [
            ['Kt/V Moyen', ktVStats?.avg_ktv?.toFixed(2) || 'N/A', '≥ 1.40', this.getStatus(ktVStats?.avg_ktv, 1.4)],
            ['% Kt/V ≥ 1.2', ktVStats?.total_measured > 0
              ? `${Math.round((ktVStats.adequate / ktVStats.total_measured) * 100)}%`
              : 'N/A', '≥ 90%', this.getStatus((ktVStats?.adequate / ktVStats?.total_measured) * 100, 90)],
            ['% Kt/V ≥ 1.4', ktVStats?.total_measured > 0
              ? `${Math.round((ktVStats.optimal / ktVStats.total_measured) * 100)}%`
              : 'N/A', '≥ 70%', this.getStatus((ktVStats?.optimal / ktVStats?.total_measured) * 100, 70)],
            ['Durée Moyenne Séance', `${Math.round(sessionStats?.avg_duration || 0)} min`, '≥ 240 min', this.getStatus(sessionStats?.avg_duration, 240)],
            ['UF Moyenne', `${Math.round(sessionStats?.avg_uf || 0)} mL`, '-', '-'],
          ],
        },
      },
      {
        title: 'Complications',
        type: 'table',
        data: {
          headers: ['Type', 'Nombre', 'Pourcentage'],
          rows: (complicationStats?.results || []).map((c: any) => [
            c.complication_type || 'Non spécifié',
            c.count,
            `${Math.round((c.count / (sessionStats?.total_sessions || 1)) * 100)}%`,
          ]),
        },
      },
      {
        title: 'Utilisation des Machines',
        type: 'table',
        data: {
          headers: ['Machine', 'Séances', 'Durée Moyenne'],
          rows: (machineStats?.results || []).map((m: any) => [
            m.machine_name,
            m.session_count,
            `${Math.round(m.avg_duration || 0)} min`,
          ]),
        },
      },
    ];

    // Generate recommendations
    const recommendations: string[] = [];

    if (ktVStats?.avg_ktv && ktVStats.avg_ktv < 1.4) {
      recommendations.push('Kt/V moyen en dessous de l\'objectif optimal (1.4). Envisager d\'augmenter la durée ou le débit sanguin.');
    }

    if (ktVStats?.total_measured && (ktVStats.adequate / ktVStats.total_measured) < 0.9) {
      recommendations.push('Moins de 90% des patients atteignent un Kt/V ≥ 1.2. Réviser les protocoles de dialyse.');
    }

    const complicationRate = (complicationStats?.results?.length || 0) / (sessionStats?.total_sessions || 1);
    if (complicationRate > 0.05) {
      recommendations.push('Taux de complications supérieur à 5%. Analyser les causes et mettre en place des mesures préventives.');
    }

    if (sessionStats?.cancelled > sessionStats?.completed * 0.05) {
      recommendations.push('Taux d\'annulation élevé. Investiguer les causes d\'annulation des séances.');
    }

    const summary = `Rapport d'activité dialyse pour ${monthName}. ` +
      `${patientStats?.active_patients || 0} patients actifs, ` +
      `${sessionStats?.completed || 0} séances réalisées. ` +
      `Kt/V moyen: ${ktVStats?.avg_ktv?.toFixed(2) || 'N/A'}.`;

    return {
      metadata: {
        id: crypto.randomUUID(),
        title: `Rapport Mensuel Dialyse - ${monthName}`,
        type: 'monthly_activity',
        module: 'dialyse',
        generatedAt: new Date(),
        generatedBy,
        organizationId,
        dateRange: { start: startDate, end: endDate },
        format: 'json',
      },
      sections,
      summary,
      recommendations,
    };
  }

  /**
   * Generate KDQOI (Kidney Disease Quality of Care Initiative) report
   */
  async generateKDQOIReport(
    organizationId: string,
    year: number,
    quarter: number,
    generatedBy: string
  ): Promise<GeneratedReport> {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);

    const [
      ktVStats,
      hemoglobinStats,
      phosphorusStats,
      calciumStats,
      pthStats,
      albuminStats,
      accessStats,
    ] = await Promise.all([
      // Kt/V adequacy
      this.db.prepare(`
        SELECT
          COUNT(DISTINCT patient_id) as total_patients,
          COUNT(DISTINCT CASE WHEN kt_v >= 1.2 THEN patient_id END) as adequate_ktv
        FROM dialyse_sessions
        WHERE organization_id = ?
        AND session_date >= ? AND session_date <= ?
        AND kt_v IS NOT NULL
      `).bind(organizationId, startDate.toISOString(), endDate.toISOString()).first(),

      // Hemoglobin targets
      this.db.prepare(`
        SELECT
          COUNT(DISTINCT patient_id) as total,
          COUNT(DISTINCT CASE WHEN hemoglobin >= 10 AND hemoglobin <= 12 THEN patient_id END) as in_range
        FROM dialyse_lab_results
        WHERE organization_id = ?
        AND collection_date >= ? AND collection_date <= ?
        AND hemoglobin IS NOT NULL
      `).bind(organizationId, startDate.toISOString(), endDate.toISOString()).first(),

      // Phosphorus control
      this.db.prepare(`
        SELECT
          COUNT(DISTINCT patient_id) as total,
          COUNT(DISTINCT CASE WHEN phosphorus >= 3.5 AND phosphorus <= 5.5 THEN patient_id END) as in_range
        FROM dialyse_lab_results
        WHERE organization_id = ?
        AND collection_date >= ? AND collection_date <= ?
        AND phosphorus IS NOT NULL
      `).bind(organizationId, startDate.toISOString(), endDate.toISOString()).first(),

      // Calcium control
      this.db.prepare(`
        SELECT
          COUNT(DISTINCT patient_id) as total,
          COUNT(DISTINCT CASE WHEN calcium >= 8.4 AND calcium <= 10.2 THEN patient_id END) as in_range
        FROM dialyse_lab_results
        WHERE organization_id = ?
        AND collection_date >= ? AND collection_date <= ?
        AND calcium IS NOT NULL
      `).bind(organizationId, startDate.toISOString(), endDate.toISOString()).first(),

      // PTH control
      this.db.prepare(`
        SELECT
          COUNT(DISTINCT patient_id) as total,
          COUNT(DISTINCT CASE WHEN pth >= 150 AND pth <= 600 THEN patient_id END) as in_range
        FROM dialyse_lab_results
        WHERE organization_id = ?
        AND collection_date >= ? AND collection_date <= ?
        AND pth IS NOT NULL
      `).bind(organizationId, startDate.toISOString(), endDate.toISOString()).first(),

      // Albumin levels
      this.db.prepare(`
        SELECT
          COUNT(DISTINCT patient_id) as total,
          COUNT(DISTINCT CASE WHEN albumin >= 4.0 THEN patient_id END) as adequate
        FROM dialyse_lab_results
        WHERE organization_id = ?
        AND collection_date >= ? AND collection_date <= ?
        AND albumin IS NOT NULL
      `).bind(organizationId, startDate.toISOString(), endDate.toISOString()).first(),

      // Vascular access distribution
      this.db.prepare(`
        SELECT
          vascular_access_type,
          COUNT(*) as count
        FROM dialyse_patients
        WHERE organization_id = ? AND status = 'active'
        GROUP BY vascular_access_type
      `).bind(organizationId).all(),
    ]);

    const quarterName = `Q${quarter} ${year}`;

    const calculatePercentage = (inRange: number, total: number): number => {
      return total > 0 ? Math.round((inRange / total) * 100) : 0;
    };

    const sections: ReportSection[] = [
      {
        title: 'Indicateurs KDQOI',
        type: 'table',
        data: {
          headers: ['Indicateur', 'Objectif', 'Atteint', 'Pourcentage', 'Cible KDQOI'],
          rows: [
            [
              'Adéquation Dialyse (Kt/V ≥ 1.2)',
              '≥ 90%',
              `${ktVStats?.adequate_ktv || 0}/${ktVStats?.total_patients || 0}`,
              `${calculatePercentage(ktVStats?.adequate_ktv, ktVStats?.total_patients)}%`,
              this.getKDQOIStatus(calculatePercentage(ktVStats?.adequate_ktv, ktVStats?.total_patients), 90),
            ],
            [
              'Hémoglobine 10-12 g/dL',
              '≥ 80%',
              `${hemoglobinStats?.in_range || 0}/${hemoglobinStats?.total || 0}`,
              `${calculatePercentage(hemoglobinStats?.in_range, hemoglobinStats?.total)}%`,
              this.getKDQOIStatus(calculatePercentage(hemoglobinStats?.in_range, hemoglobinStats?.total), 80),
            ],
            [
              'Phosphore 3.5-5.5 mg/dL',
              '≥ 70%',
              `${phosphorusStats?.in_range || 0}/${phosphorusStats?.total || 0}`,
              `${calculatePercentage(phosphorusStats?.in_range, phosphorusStats?.total)}%`,
              this.getKDQOIStatus(calculatePercentage(phosphorusStats?.in_range, phosphorusStats?.total), 70),
            ],
            [
              'Calcium 8.4-10.2 mg/dL',
              '≥ 80%',
              `${calciumStats?.in_range || 0}/${calciumStats?.total || 0}`,
              `${calculatePercentage(calciumStats?.in_range, calciumStats?.total)}%`,
              this.getKDQOIStatus(calculatePercentage(calciumStats?.in_range, calciumStats?.total), 80),
            ],
            [
              'PTH 150-600 pg/mL',
              '≥ 50%',
              `${pthStats?.in_range || 0}/${pthStats?.total || 0}`,
              `${calculatePercentage(pthStats?.in_range, pthStats?.total)}%`,
              this.getKDQOIStatus(calculatePercentage(pthStats?.in_range, pthStats?.total), 50),
            ],
            [
              'Albumine ≥ 4.0 g/dL',
              '≥ 60%',
              `${albuminStats?.adequate || 0}/${albuminStats?.total || 0}`,
              `${calculatePercentage(albuminStats?.adequate, albuminStats?.total)}%`,
              this.getKDQOIStatus(calculatePercentage(albuminStats?.adequate, albuminStats?.total), 60),
            ],
          ],
        },
      },
      {
        title: 'Accès Vasculaires',
        type: 'table',
        data: {
          headers: ['Type d\'Accès', 'Nombre', 'Pourcentage', 'Objectif'],
          rows: (accessStats?.results || []).map((a: any) => {
            const total = accessStats.results.reduce((s: number, r: any) => s + r.count, 0);
            const pct = Math.round((a.count / total) * 100);
            let target = '-';
            if (a.vascular_access_type === 'fistula') target = '≥ 65% (cible)';
            else if (a.vascular_access_type === 'catheter') target = '< 20% (idéal)';
            return [a.vascular_access_type, a.count, `${pct}%`, target];
          }),
        },
      },
    ];

    // Calculate fistula rate for recommendations
    const fistulaData = accessStats?.results?.find((a: any) => a.vascular_access_type === 'fistula');
    const totalAccess = accessStats?.results?.reduce((s: number, r: any) => s + r.count, 0) || 0;
    const fistulaRate = totalAccess > 0 ? (fistulaData?.count || 0) / totalAccess : 0;

    const recommendations: string[] = [];

    if (calculatePercentage(ktVStats?.adequate_ktv, ktVStats?.total_patients) < 90) {
      recommendations.push('Adéquation Kt/V inférieure à l\'objectif KDQOI. Optimiser les prescriptions de dialyse.');
    }

    if (fistulaRate < 0.65) {
      recommendations.push('Taux de fistules inférieur à 65%. Intensifier le programme de création de fistules.');
    }

    if (calculatePercentage(hemoglobinStats?.in_range, hemoglobinStats?.total) < 80) {
      recommendations.push('Contrôle de l\'anémie sous-optimal. Réviser les protocoles d\'érythropoïétine.');
    }

    if (calculatePercentage(phosphorusStats?.in_range, phosphorusStats?.total) < 70) {
      recommendations.push('Hyperphosphorémie fréquente. Renforcer l\'éducation diététique et les chélateurs.');
    }

    const summary = `Rapport KDQOI pour ${quarterName}. ` +
      `${ktVStats?.total_patients || 0} patients évalués. ` +
      `Taux d'adéquation Kt/V: ${calculatePercentage(ktVStats?.adequate_ktv, ktVStats?.total_patients)}%.`;

    return {
      metadata: {
        id: crypto.randomUUID(),
        title: `Rapport KDQOI - ${quarterName}`,
        type: 'kdqoi',
        module: 'dialyse',
        generatedAt: new Date(),
        generatedBy,
        organizationId,
        dateRange: { start: startDate, end: endDate },
        format: 'json',
      },
      sections,
      summary,
      recommendations,
    };
  }

  /**
   * Generate patient-specific report
   */
  async generatePatientReport(
    organizationId: string,
    patientId: string,
    dateRange: { start: Date; end: Date },
    generatedBy: string
  ): Promise<GeneratedReport> {
    const [
      patientInfo,
      sessionHistory,
      labHistory,
      prescriptionInfo,
    ] = await Promise.all([
      this.db.prepare(`
        SELECT * FROM dialyse_patients
        WHERE id = ? AND organization_id = ?
      `).bind(patientId, organizationId).first(),

      this.db.prepare(`
        SELECT
          session_date,
          kt_v,
          actual_duration,
          pre_weight,
          post_weight,
          uf_volume,
          blood_flow_rate,
          complications,
          notes
        FROM dialyse_sessions
        WHERE patient_id = ? AND organization_id = ?
        AND session_date >= ? AND session_date <= ?
        ORDER BY session_date DESC
      `).bind(patientId, organizationId, dateRange.start.toISOString(), dateRange.end.toISOString()).all(),

      this.db.prepare(`
        SELECT *
        FROM dialyse_lab_results
        WHERE patient_id = ? AND organization_id = ?
        AND collection_date >= ? AND collection_date <= ?
        ORDER BY collection_date DESC
        LIMIT 10
      `).bind(patientId, organizationId, dateRange.start.toISOString(), dateRange.end.toISOString()).all(),

      this.db.prepare(`
        SELECT * FROM dialyse_prescriptions
        WHERE patient_id = ? AND organization_id = ? AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(patientId, organizationId).first(),
    ]);

    if (!patientInfo) {
      throw new Error('Patient not found');
    }

    const sessions = sessionHistory?.results || [];
    const labs = labHistory?.results || [];

    // Calculate averages
    const avgKtV = sessions.length > 0
      ? sessions.reduce((sum: number, s: any) => sum + (s.kt_v || 0), 0) / sessions.filter((s: any) => s.kt_v).length
      : 0;

    const avgUF = sessions.length > 0
      ? sessions.reduce((sum: number, s: any) => sum + (s.uf_volume || 0), 0) / sessions.length
      : 0;

    const sections: ReportSection[] = [
      {
        title: 'Informations Patient',
        type: 'summary',
        data: {
          nom: `${patientInfo.first_name} ${patientInfo.last_name}`,
          dateNaissance: patientInfo.date_of_birth,
          modalite: patientInfo.dialysis_modality,
          accesVasculaire: patientInfo.vascular_access_type,
          dateDebutDialyse: patientInfo.dialysis_start_date,
          serologieHBs: patientInfo.hbsag_status,
          serologieHCV: patientInfo.hcv_status,
          serologieHIV: patientInfo.hiv_status,
        },
      },
      {
        title: 'Résumé des Séances',
        type: 'summary',
        data: {
          nombreSeances: sessions.length,
          ktVMoyen: avgKtV.toFixed(2),
          ufMoyenne: `${Math.round(avgUF)} mL`,
          dureeMoyenne: sessions.length > 0
            ? `${Math.round(sessions.reduce((s: number, x: any) => s + (x.actual_duration || 0), 0) / sessions.length)} min`
            : 'N/A',
        },
      },
      {
        title: 'Historique des Séances',
        type: 'table',
        data: {
          headers: ['Date', 'Kt/V', 'Durée', 'Poids Pré', 'Poids Post', 'UF'],
          rows: sessions.slice(0, 10).map((s: any) => [
            new Date(s.session_date).toLocaleDateString('fr-FR'),
            s.kt_v?.toFixed(2) || '-',
            `${s.actual_duration} min`,
            `${s.pre_weight} kg`,
            `${s.post_weight} kg`,
            `${s.uf_volume} mL`,
          ]),
        },
      },
      {
        title: 'Résultats de Laboratoire',
        type: 'table',
        data: {
          headers: ['Date', 'Hémoglobine', 'Créatinine', 'Urée', 'Potassium', 'Phosphore'],
          rows: labs.slice(0, 5).map((l: any) => [
            new Date(l.collection_date).toLocaleDateString('fr-FR'),
            l.hemoglobin ? `${l.hemoglobin} g/dL` : '-',
            l.creatinine ? `${l.creatinine} mg/dL` : '-',
            l.bun ? `${l.bun} mg/dL` : '-',
            l.potassium ? `${l.potassium} mEq/L` : '-',
            l.phosphorus ? `${l.phosphorus} mg/dL` : '-',
          ]),
        },
      },
    ];

    if (prescriptionInfo) {
      sections.push({
        title: 'Prescription Active',
        type: 'summary',
        data: {
          modalite: prescriptionInfo.modality,
          frequence: prescriptionInfo.frequency,
          dureeSeance: `${prescriptionInfo.session_duration} min`,
          poidsSecCible: `${prescriptionInfo.dry_weight_target} kg`,
          debitSang: `${prescriptionInfo.blood_flow_rate} mL/min`,
          debitDialysat: `${prescriptionInfo.dialysate_flow_rate} mL/min`,
        },
      });
    }

    const recommendations: string[] = [];

    if (avgKtV < 1.2 && avgKtV > 0) {
      recommendations.push('Kt/V moyen insuffisant. Revoir la prescription de dialyse.');
    }

    const summary = `Rapport patient ${patientInfo.first_name} ${patientInfo.last_name}. ` +
      `${sessions.length} séances réalisées. Kt/V moyen: ${avgKtV > 0 ? avgKtV.toFixed(2) : 'N/A'}.`;

    return {
      metadata: {
        id: crypto.randomUUID(),
        title: `Rapport Patient - ${patientInfo.first_name} ${patientInfo.last_name}`,
        type: 'patient_summary',
        module: 'dialyse',
        generatedAt: new Date(),
        generatedBy,
        organizationId,
        dateRange,
        format: 'json',
      },
      sections,
      summary,
      recommendations,
    };
  }

  private getStatus(value: number | undefined, target: number): string {
    if (!value) return '⚪ N/A';
    return value >= target ? '🟢 Atteint' : '🔴 Non atteint';
  }

  private getKDQOIStatus(percentage: number, target: number): string {
    if (percentage >= target) return '✅ Conforme';
    if (percentage >= target * 0.8) return '⚠️ Proche';
    return '❌ Non conforme';
  }
}

// ============================================================================
// Export Functions
// ============================================================================

export function reportToCSV(report: GeneratedReport): string {
  const lines: string[] = [];

  // Header
  lines.push(`"${report.metadata.title}"`);
  lines.push(`"Généré le: ${report.metadata.generatedAt.toISOString()}"`);
  lines.push(`"Période: ${report.metadata.dateRange.start.toISOString()} - ${report.metadata.dateRange.end.toISOString()}"`);
  lines.push('');

  // Sections
  for (const section of report.sections) {
    lines.push(`"${section.title}"`);

    if (section.type === 'table' && section.data.headers && section.data.rows) {
      lines.push(section.data.headers.map((h: string) => `"${h}"`).join(','));
      for (const row of section.data.rows) {
        lines.push(row.map((cell: any) => `"${cell}"`).join(','));
      }
    } else if (section.type === 'summary' && typeof section.data === 'object') {
      for (const [key, value] of Object.entries(section.data)) {
        lines.push(`"${key}","${value}"`);
      }
    }

    lines.push('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('"Recommandations"');
    for (const rec of report.recommendations) {
      lines.push(`"${rec}"`);
    }
  }

  return lines.join('\n');
}

export function reportToHTML(report: GeneratedReport): string {
  let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${report.metadata.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #3498db; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .summary { background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary dt { font-weight: bold; color: #2c3e50; }
    .summary dd { margin: 5px 0 15px 0; color: #7f8c8d; }
    .recommendations { background: #fef9e7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .recommendations li { margin: 10px 0; }
    .meta { color: #95a5a6; font-size: 0.9em; margin-bottom: 30px; }
  </style>
</head>
<body>
  <h1>${report.metadata.title}</h1>
  <p class="meta">
    Généré le ${report.metadata.generatedAt.toLocaleDateString('fr-FR')} |
    Période: ${report.metadata.dateRange.start.toLocaleDateString('fr-FR')} - ${report.metadata.dateRange.end.toLocaleDateString('fr-FR')}
  </p>
`;

  for (const section of report.sections) {
    html += `<h2>${section.title}</h2>`;

    if (section.type === 'table' && section.data.headers && section.data.rows) {
      html += '<table><thead><tr>';
      for (const header of section.data.headers) {
        html += `<th>${header}</th>`;
      }
      html += '</tr></thead><tbody>';
      for (const row of section.data.rows) {
        html += '<tr>';
        for (const cell of row) {
          html += `<td>${cell}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
    } else if (section.type === 'summary' && typeof section.data === 'object') {
      html += '<div class="summary"><dl>';
      for (const [key, value] of Object.entries(section.data)) {
        html += `<dt>${key}</dt><dd>${value}</dd>`;
      }
      html += '</dl></div>';
    }
  }

  if (report.recommendations.length > 0) {
    html += `
  <h2>Recommandations</h2>
  <div class="recommendations">
    <ul>
      ${report.recommendations.map(r => `<li>${r}</li>`).join('\n')}
    </ul>
  </div>`;
  }

  html += `
</body>
</html>`;

  return html;
}

// ============================================================================
// Main Export
// ============================================================================

export class ReportGeneratorService {
  dialyse: DialyseReportGenerator;

  constructor(private db: D1Database) {
    this.dialyse = new DialyseReportGenerator(db);
  }
}

export default ReportGeneratorService;
