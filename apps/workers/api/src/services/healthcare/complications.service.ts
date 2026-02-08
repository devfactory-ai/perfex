/**
 * Post-Operative Complications Management Service
 * Tracks, alerts, and manages complications across all healthcare modules
 *
 * Supports:
 * - Dialysis: Access site issues, hypotension, cramping, arrhythmia
 * - Cardiology: Bleeding, arrhythmia, MI, device issues
 * - Ophthalmology: Endophthalmitis, retinal detachment, IOL issues
 */

import { logger } from '../../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type HealthcareModule = 'dialyse' | 'cardiology' | 'ophthalmology';

export type ComplicationSeverity = 'mild' | 'moderate' | 'severe' | 'life_threatening';

export type ComplicationStatus =
  | 'suspected'
  | 'confirmed'
  | 'monitoring'
  | 'treated'
  | 'resolved'
  | 'chronic';

export interface Complication {
  id: string;
  patientId: string;
  organizationId: string;
  module: HealthcareModule;
  procedureId?: string;
  procedureType?: string;
  procedureDate?: Date;

  // Complication details
  type: string;
  description: string;
  severity: ComplicationSeverity;
  status: ComplicationStatus;

  // Timing
  onsetDate: Date;
  onsetTiming: 'intra_procedure' | 'immediate' | 'early' | 'late';
  daysPostProcedure?: number;

  // Clinical details
  symptoms: string[];
  signs: string[];
  diagnosticFindings?: string;
  causativeFactors?: string[];

  // Management
  treatments: {
    treatment: string;
    startDate: Date;
    endDate?: Date;
    outcome?: string;
  }[];
  requiresHospitalization: boolean;
  requiresIntervention: boolean;
  interventionType?: string;

  // Outcomes
  resolution?: {
    date: Date;
    outcome: 'complete_resolution' | 'partial_resolution' | 'sequelae' | 'death';
    permanentDeficit?: string;
    notes?: string;
  };

  // Metadata
  reportedBy: string;
  reportedAt: Date;
  updatedAt: Date;
  updates: {
    date: Date;
    userId: string;
    changes: string;
  }[];
}

export interface ComplicationAlert {
  id: string;
  complicationId: string;
  patientId: string;
  severity: ComplicationSeverity;
  message: string;
  module: HealthcareModule;
  requiresImmediateAction: boolean;
  escalationLevel: 1 | 2 | 3;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
}

export interface ComplicationStats {
  total: number;
  bySeverity: Record<ComplicationSeverity, number>;
  byStatus: Record<ComplicationStatus, number>;
  byType: Record<string, number>;
  avgDaysToResolution: number;
  hospitalizationRate: number;
  reinterventionRate: number;
}

// ============================================================================
// Complication Definitions by Module
// ============================================================================

export const COMPLICATION_TYPES: Record<HealthcareModule, {
  type: string;
  category: string;
  defaultSeverity: ComplicationSeverity;
  earlyWarningSymptoms: string[];
  requiredActions: string[];
}[]> = {
  dialyse: [
    {
      type: 'access_site_bleeding',
      category: 'Vascular Access',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Bleeding at access site', 'Hematoma formation', 'Pain'],
      requiredActions: ['Apply pressure', 'Monitor hemoglobin', 'Evaluate access'],
    },
    {
      type: 'access_thrombosis',
      category: 'Vascular Access',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Loss of thrill', 'Absent bruit', 'Arm swelling'],
      requiredActions: ['Doppler ultrasound', 'Vascular surgery consult', 'Anticoagulation'],
    },
    {
      type: 'access_infection',
      category: 'Vascular Access',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Fever', 'Redness at site', 'Purulent drainage', 'Pain'],
      requiredActions: ['Blood cultures', 'Start antibiotics', 'Consider catheter removal'],
    },
    {
      type: 'intradialytic_hypotension',
      category: 'Hemodynamic',
      defaultSeverity: 'mild',
      earlyWarningSymptoms: ['Dizziness', 'Nausea', 'Cramping', 'Low BP'],
      requiredActions: ['Trendelenburg position', 'Reduce UF rate', 'Saline bolus'],
    },
    {
      type: 'cardiac_arrhythmia',
      category: 'Cardiac',
      defaultSeverity: 'severe',
      earlyWarningSymptoms: ['Palpitations', 'Chest pain', 'Syncope', 'ECG changes'],
      requiredActions: ['ECG', 'Check electrolytes', 'Cardiology consult'],
    },
    {
      type: 'disequilibrium_syndrome',
      category: 'Neurological',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Headache', 'Nausea', 'Confusion', 'Seizure'],
      requiredActions: ['Stop dialysis', 'Supportive care', 'CT head if severe'],
    },
    {
      type: 'air_embolism',
      category: 'Procedural',
      defaultSeverity: 'life_threatening',
      earlyWarningSymptoms: ['Sudden dyspnea', 'Cyanosis', 'Chest pain', 'Altered consciousness'],
      requiredActions: ['Stop dialysis', 'Left lateral decubitus', 'High-flow O2', 'Emergency response'],
    },
  ],
  cardiology: [
    {
      type: 'access_site_bleeding',
      category: 'Vascular',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Groin hematoma', 'Decreasing hemoglobin', 'Hypotension'],
      requiredActions: ['Manual compression', 'Check CBC', 'Consider transfusion'],
    },
    {
      type: 'retroperitoneal_bleeding',
      category: 'Vascular',
      defaultSeverity: 'severe',
      earlyWarningSymptoms: ['Back pain', 'Abdominal pain', 'Hypotension', 'Tachycardia'],
      requiredActions: ['CT abdomen', 'Fluid resuscitation', 'Blood transfusion', 'Vascular surgery consult'],
    },
    {
      type: 'coronary_dissection',
      category: 'Procedural',
      defaultSeverity: 'life_threatening',
      earlyWarningSymptoms: ['Chest pain', 'ST changes', 'Hemodynamic instability'],
      requiredActions: ['Emergent CABG evaluation', 'IABP if needed', 'Cardiac surgery consult'],
    },
    {
      type: 'stent_thrombosis',
      category: 'Thrombotic',
      defaultSeverity: 'life_threatening',
      earlyWarningSymptoms: ['Chest pain', 'ST elevation', 'Cardiogenic shock'],
      requiredActions: ['Emergent cath lab activation', 'Aspiration thrombectomy', 'GP IIb/IIIa inhibitor'],
    },
    {
      type: 'stroke',
      category: 'Neurological',
      defaultSeverity: 'severe',
      earlyWarningSymptoms: ['Focal weakness', 'Speech changes', 'Visual changes', 'Confusion'],
      requiredActions: ['Neurology consult', 'CT head', 'Consider thrombolysis'],
    },
    {
      type: 'contrast_induced_nephropathy',
      category: 'Renal',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Rising creatinine 48-72h post', 'Oliguria'],
      requiredActions: ['IV hydration', 'Monitor renal function', 'Nephrology consult if severe'],
    },
    {
      type: 'pacemaker_pocket_infection',
      category: 'Device',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Fever', 'Erythema over pocket', 'Pocket swelling', 'Drainage'],
      requiredActions: ['Blood cultures', 'Device extraction evaluation', 'Antibiotics'],
    },
    {
      type: 'lead_dislodgement',
      category: 'Device',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Loss of capture', 'Inappropriate shocks', 'New arrhythmia'],
      requiredActions: ['Device interrogation', 'CXR', 'Lead revision if needed'],
    },
    {
      type: 'cardiac_tamponade',
      category: 'Pericardial',
      defaultSeverity: 'life_threatening',
      earlyWarningSymptoms: ['Hypotension', 'JVD', 'Muffled heart sounds', 'Pulsus paradoxus'],
      requiredActions: ['Emergent echo', 'Pericardiocentesis', 'OR backup'],
    },
  ],
  ophthalmology: [
    {
      type: 'endophthalmitis',
      category: 'Infectious',
      defaultSeverity: 'life_threatening', // Vision-threatening
      earlyWarningSymptoms: ['Pain', 'Decreased vision', 'Hypopyon', 'Lid swelling'],
      requiredActions: ['Emergent vitrectomy evaluation', 'Intravitreal antibiotics', 'Vitreous tap'],
    },
    {
      type: 'retinal_detachment',
      category: 'Retinal',
      defaultSeverity: 'severe',
      earlyWarningSymptoms: ['Flashes', 'Floaters', 'Visual field loss', 'Curtain effect'],
      requiredActions: ['Urgent dilated exam', 'OCT/B-scan', 'Surgical repair evaluation'],
    },
    {
      type: 'cystoid_macular_edema',
      category: 'Macular',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Blurred vision', 'Decreased VA 4-6 weeks post-op'],
      requiredActions: ['OCT', 'NSAID drops', 'Steroid drops', 'Consider intravitreal injection'],
    },
    {
      type: 'iol_dislocation',
      category: 'IOL',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Sudden visual change', 'Glare', 'Diplopia', 'Edge visualization'],
      requiredActions: ['Dilated exam', 'A-scan', 'IOL repositioning/exchange evaluation'],
    },
    {
      type: 'posterior_capsule_opacification',
      category: 'Capsular',
      defaultSeverity: 'mild',
      earlyWarningSymptoms: ['Gradual vision decrease', 'Glare', 'Halos'],
      requiredActions: ['VA check', 'Slit lamp exam', 'YAG laser capsulotomy if significant'],
    },
    {
      type: 'elevated_iop',
      category: 'Pressure',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Eye pain', 'Headache', 'Corneal edema', 'Halos'],
      requiredActions: ['IOP check', 'Gonioscopy', 'IOP-lowering drops', 'Consider surgery if uncontrolled'],
    },
    {
      type: 'corneal_edema',
      category: 'Corneal',
      defaultSeverity: 'mild',
      earlyWarningSymptoms: ['Blurred vision', 'Halos', 'Corneal haze'],
      requiredActions: ['Pachymetry', 'Specular microscopy', 'Hypertonic saline drops'],
    },
    {
      type: 'wound_leak',
      category: 'Wound',
      defaultSeverity: 'moderate',
      earlyWarningSymptoms: ['Shallow AC', 'Hypotony', 'Seidel positive'],
      requiredActions: ['Seidel test', 'Bandage contact lens', 'Wound revision if persistent'],
    },
    {
      type: 'suprachoroidal_hemorrhage',
      category: 'Hemorrhagic',
      defaultSeverity: 'severe',
      earlyWarningSymptoms: ['Severe pain', 'Vision loss', 'Hard eye', 'Dark choroidal elevation'],
      requiredActions: ['B-scan ultrasound', 'Urgent surgical evaluation', 'IOP management'],
    },
  ],
};

// ============================================================================
// Complications Service
// ============================================================================

export class ComplicationsService {
  private complications: Map<string, Complication> = new Map();
  private alerts: Map<string, ComplicationAlert> = new Map();

  /**
   * Report a new complication
   */
  reportComplication(data: {
    patientId: string;
    organizationId: string;
    module: HealthcareModule;
    type: string;
    severity: ComplicationSeverity;
    description: string;
    symptoms: string[];
    procedureId?: string;
    procedureType?: string;
    procedureDate?: Date;
    userId: string;
  }): Complication {
    const id = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    // Calculate onset timing
    let onsetTiming: Complication['onsetTiming'] = 'late';
    let daysPostProcedure: number | undefined;

    if (data.procedureDate) {
      daysPostProcedure = Math.floor(
        (now.getTime() - data.procedureDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysPostProcedure === 0) {
        onsetTiming = 'intra_procedure';
      } else if (daysPostProcedure <= 1) {
        onsetTiming = 'immediate';
      } else if (daysPostProcedure <= 7) {
        onsetTiming = 'early';
      } else {
        onsetTiming = 'late';
      }
    }

    const complication: Complication = {
      id,
      patientId: data.patientId,
      organizationId: data.organizationId,
      module: data.module,
      procedureId: data.procedureId,
      procedureType: data.procedureType,
      procedureDate: data.procedureDate,
      type: data.type,
      description: data.description,
      severity: data.severity,
      status: 'suspected',
      onsetDate: now,
      onsetTiming,
      daysPostProcedure,
      symptoms: data.symptoms,
      signs: [],
      treatments: [],
      requiresHospitalization: data.severity === 'severe' || data.severity === 'life_threatening',
      requiresIntervention: data.severity === 'life_threatening',
      reportedBy: data.userId,
      reportedAt: now,
      updatedAt: now,
      updates: [],
    };

    this.complications.set(id, complication);

    // Create alert for moderate+ severity
    if (data.severity !== 'mild') {
      this.createAlert(complication);
    }

    logger.info('Complication reported', {
      complicationId: id,
      patientId: data.patientId,
      module: data.module,
      type: data.type,
      severity: data.severity,
    });

    return complication;
  }

  /**
   * Create alert for a complication
   */
  private createAlert(complication: Complication): ComplicationAlert {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const escalationLevel = complication.severity === 'life_threatening'
      ? 3
      : complication.severity === 'severe'
        ? 2
        : 1;

    const alert: ComplicationAlert = {
      id: alertId,
      complicationId: complication.id,
      patientId: complication.patientId,
      severity: complication.severity,
      module: complication.module,
      message: `${complication.severity.toUpperCase()} complication: ${complication.type} - ${complication.description}`,
      requiresImmediateAction: complication.severity === 'life_threatening',
      escalationLevel: escalationLevel as 1 | 2 | 3,
      createdAt: new Date(),
    };

    this.alerts.set(alertId, alert);

    return alert;
  }

  /**
   * Update complication status
   */
  updateStatus(
    complicationId: string,
    status: ComplicationStatus,
    userId: string,
    notes?: string
  ): Complication | null {
    const complication = this.complications.get(complicationId);
    if (!complication) return null;

    const previousStatus = complication.status;
    complication.status = status;
    complication.updatedAt = new Date();
    complication.updates.push({
      date: new Date(),
      userId,
      changes: `Status changed from ${previousStatus} to ${status}${notes ? `: ${notes}` : ''}`,
    });

    return complication;
  }

  /**
   * Add treatment to complication
   */
  addTreatment(
    complicationId: string,
    treatment: {
      treatment: string;
      startDate: Date;
      endDate?: Date;
      outcome?: string;
    },
    userId: string
  ): Complication | null {
    const complication = this.complications.get(complicationId);
    if (!complication) return null;

    complication.treatments.push(treatment);
    complication.updatedAt = new Date();
    complication.updates.push({
      date: new Date(),
      userId,
      changes: `Treatment added: ${treatment.treatment}`,
    });

    return complication;
  }

  /**
   * Mark complication as resolved
   */
  resolveComplication(
    complicationId: string,
    resolution: {
      outcome: 'complete_resolution' | 'partial_resolution' | 'sequelae' | 'death';
      permanentDeficit?: string;
      notes?: string;
    },
    userId: string
  ): Complication | null {
    const complication = this.complications.get(complicationId);
    if (!complication) return null;

    complication.status = resolution.outcome === 'complete_resolution' ? 'resolved' : 'chronic';
    complication.resolution = {
      date: new Date(),
      ...resolution,
    };
    complication.updatedAt = new Date();
    complication.updates.push({
      date: new Date(),
      userId,
      changes: `Resolved with outcome: ${resolution.outcome}`,
    });

    return complication;
  }

  /**
   * Get complication by ID
   */
  getById(complicationId: string): Complication | undefined {
    return this.complications.get(complicationId);
  }

  /**
   * Get complications for a patient
   */
  getByPatient(patientId: string): Complication[] {
    return Array.from(this.complications.values()).filter((c) => c.patientId === patientId);
  }

  /**
   * List complications for an organization
   */
  list(
    organizationId: string,
    filters?: {
      module?: HealthcareModule;
      severity?: ComplicationSeverity;
      status?: ComplicationStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): { data: Complication[]; total: number } {
    let complications = Array.from(this.complications.values()).filter(
      (c) => c.organizationId === organizationId
    );

    if (filters) {
      if (filters.module) {
        complications = complications.filter((c) => c.module === filters.module);
      }
      if (filters.severity) {
        complications = complications.filter((c) => c.severity === filters.severity);
      }
      if (filters.status) {
        complications = complications.filter((c) => c.status === filters.status);
      }
      if (filters.startDate) {
        complications = complications.filter((c) => c.onsetDate >= filters.startDate!);
      }
      if (filters.endDate) {
        complications = complications.filter((c) => c.onsetDate <= filters.endDate!);
      }
    }

    // Sort by date desc
    complications.sort((a, b) => b.onsetDate.getTime() - a.onsetDate.getTime());

    const total = complications.length;

    if (filters?.offset) {
      complications = complications.slice(filters.offset);
    }
    if (filters?.limit) {
      complications = complications.slice(0, filters.limit);
    }

    return { data: complications, total };
  }

  /**
   * Get active alerts for an organization
   */
  getActiveAlerts(
    organizationId: string,
    module?: HealthcareModule
  ): ComplicationAlert[] {
    const orgComplications = Array.from(this.complications.values()).filter(
      (c) => c.organizationId === organizationId && (!module || c.module === module)
    );
    const orgComplicationIds = new Set(orgComplications.map((c) => c.id));

    return Array.from(this.alerts.values())
      .filter((a) => orgComplicationIds.has(a.complicationId) && !a.acknowledgedAt)
      .sort((a, b) => {
        // Sort by severity (higher first) then by date
        if (a.escalationLevel !== b.escalationLevel) {
          return b.escalationLevel - a.escalationLevel;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    return true;
  }

  /**
   * Get complication statistics
   */
  getStats(
    organizationId: string,
    filters?: {
      module?: HealthcareModule;
      startDate?: Date;
      endDate?: Date;
    }
  ): ComplicationStats {
    let complications = Array.from(this.complications.values()).filter(
      (c) => c.organizationId === organizationId
    );

    if (filters) {
      if (filters.module) {
        complications = complications.filter((c) => c.module === filters.module);
      }
      if (filters.startDate) {
        complications = complications.filter((c) => c.onsetDate >= filters.startDate!);
      }
      if (filters.endDate) {
        complications = complications.filter((c) => c.onsetDate <= filters.endDate!);
      }
    }

    const bySeverity: Record<ComplicationSeverity, number> = {
      mild: 0,
      moderate: 0,
      severe: 0,
      life_threatening: 0,
    };

    const byStatus: Record<ComplicationStatus, number> = {
      suspected: 0,
      confirmed: 0,
      monitoring: 0,
      treated: 0,
      resolved: 0,
      chronic: 0,
    };

    const byType: Record<string, number> = {};

    let totalDaysToResolution = 0;
    let resolvedCount = 0;
    let hospitalizationCount = 0;
    let reinterventionCount = 0;

    for (const comp of complications) {
      bySeverity[comp.severity]++;
      byStatus[comp.status]++;
      byType[comp.type] = (byType[comp.type] || 0) + 1;

      if (comp.requiresHospitalization) hospitalizationCount++;
      if (comp.requiresIntervention) reinterventionCount++;

      if (comp.resolution) {
        resolvedCount++;
        totalDaysToResolution += Math.floor(
          (comp.resolution.date.getTime() - comp.onsetDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    }

    return {
      total: complications.length,
      bySeverity,
      byStatus,
      byType,
      avgDaysToResolution: resolvedCount > 0 ? Math.round(totalDaysToResolution / resolvedCount) : 0,
      hospitalizationRate: complications.length > 0
        ? Math.round((hospitalizationCount / complications.length) * 100)
        : 0,
      reinterventionRate: complications.length > 0
        ? Math.round((reinterventionCount / complications.length) * 100)
        : 0,
    };
  }

  /**
   * Get complication types for a module
   */
  getComplicationTypes(module: HealthcareModule): typeof COMPLICATION_TYPES[HealthcareModule] {
    return COMPLICATION_TYPES[module];
  }

  /**
   * Get required actions for a complication type
   */
  getRequiredActions(module: HealthcareModule, type: string): string[] {
    const typeInfo = COMPLICATION_TYPES[module].find((t) => t.type === type);
    return typeInfo?.requiredActions || [];
  }
}

// Export singleton instance
export const complicationsService = new ComplicationsService();
export default complicationsService;
