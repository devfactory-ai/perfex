/**
 * Ophthalmology Surgery Workflow Service
 * Pre-operative, intra-operative, and post-operative workflow management
 */

import { logger } from '../../utils/logger';

export interface PreOperativeChecklist {
  id: string;
  surgeryId: string;
  patientId: string;
  // Visual assessments
  visualAcuityBaselineOD?: number; // logMAR
  visualAcuityBaselineOS?: number;
  bestCorrectedVAOD?: number;
  bestCorrectedVAOS?: number;
  // Pressure measurements
  intraocularPressureOD?: number; // mmHg
  intraocularPressureOS?: number;
  // Biometry
  axialLengthOD?: number; // mm
  axialLengthOS?: number;
  korneaKeratomteryOD?: string;
  korneaKeratomteryOS?: string;
  // IOL calculation
  targetRefraction?: number;
  selectedIOL?: string;
  iolPower?: number;
  // Risk factors
  anticoagulationStatus: 'none' | 'stopped' | 'continued' | 'bridging';
  anticoagulationNotes?: string;
  diabetesStatus: 'none' | 'controlled' | 'uncontrolled';
  hba1c?: number;
  allergies?: string[];
  // Consents
  informedConsentSigned: boolean;
  consentDate?: Date;
  anesthesiaConsentSigned: boolean;
  patientEducationCompleted: boolean;
  // Pre-op drops
  preOpDropsInstructions?: string;
  dilationDropsGiven: boolean;
  antibioticDropsStarted: boolean;
  // Final checks
  fastingConfirmed: boolean;
  labResultsReviewed: boolean;
  eyeMarked: boolean;
  sideConfirmed: 'OD' | 'OS' | 'OU';
  completedAt?: Date;
  completedBy?: string;
}

export interface IntraOperativeNotes {
  id: string;
  surgeryId: string;
  // Timing
  surgeryStartTime: Date;
  surgeryEndTime?: Date;
  // Anesthesia
  anesthesiaType: 'topical' | 'peribulbar' | 'retrobulbar' | 'general';
  anesthesiaNotes?: string;
  // Procedure
  surgeonId: string;
  assistantId?: string;
  procedureType: string;
  eye: 'OD' | 'OS';
  // Technique details (for cataract)
  incisionType?: string;
  incisionSize?: number; // mm
  capsulorrhexisSize?: number; // mm
  phacoPower?: number;
  phacoTime?: number; // seconds
  // IOL
  iolImplanted?: string;
  iolPowerUsed?: number;
  iolPosition?: 'bag' | 'sulcus' | 'ac' | 'scleral_fixated';
  // Complications
  complications: string[];
  complicationNotes?: string;
  // Post-op instructions given
  postOpInstructionsGiven: boolean;
}

export interface PostOperativeAssessment {
  id: string;
  surgeryId: string;
  assessmentDate: Date;
  dayPostOp: number; // 1, 7, 30, 90, etc.
  // Visual outcomes
  uncorrectedVAOD?: number;
  uncorrectedVAOS?: number;
  bestCorrectedVAOD?: number;
  bestCorrectedVAOS?: number;
  // Refraction
  sphereOD?: number;
  cylinderOD?: number;
  axisOD?: number;
  sphereOS?: number;
  cylinderOS?: number;
  axisOS?: number;
  // Pressure
  iopOD?: number;
  iopOS?: number;
  // Examination findings
  cornealClarity: 'clear' | 'mild_edema' | 'moderate_edema' | 'severe_edema';
  anteriorChamber: 'quiet' | 'trace_cells' | 'mild_reaction' | 'moderate_reaction' | 'severe_reaction';
  iolPosition: 'centered' | 'decentered' | 'tilted' | 'subluxated';
  pcr: boolean; // Posterior capsule rupture
  cme: boolean; // Cystoid macular edema
  // Complications
  complications: string[];
  // Medications
  currentMedications: string[];
  // Next steps
  nextFollowUp?: Date;
  additionalProceduresNeeded?: string[];
  assessedBy: string;
}

export interface SurgeryOutcome {
  surgeryId: string;
  patientId: string;
  eye: 'OD' | 'OS';
  procedureType: string;
  surgeryDate: Date;
  // Preoperative
  preOpBCVA: number;
  preOpIOP: number;
  // Final outcomes (at 3 months)
  finalUCVA?: number;
  finalBCVA?: number;
  finalIOP?: number;
  refractiveOutcome?: number; // Difference from target
  // Success metrics
  vaImprovement: number; // Lines gained
  targetRefractionAchieved: boolean;
  complicationFree: boolean;
  patientSatisfied?: boolean;
  // Overall
  overallSuccess: boolean;
}

export class SurgeryWorkflowService {
  constructor(private db: D1Database) {}

  /**
   * Create pre-operative checklist for a surgery
   */
  async createPreOpChecklist(
    organizationId: string,
    surgeryId: string,
    patientId: string
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(`
      INSERT INTO ophthalmology_surgery_preop (
        id, surgery_id, patient_id, organization_id,
        anticoagulation_status, diabetes_status,
        informed_consent_signed, anesthesia_consent_signed,
        patient_education_completed, dilation_drops_given,
        antibiotic_drops_started, fasting_confirmed,
        lab_results_reviewed, eye_marked,
        created_at
      ) VALUES (?, ?, ?, ?, 'none', 'none', 0, 0, 0, 0, 0, 0, 0, 0, ?)
    `).bind(id, surgeryId, patientId, organizationId, now).run();

    logger.info('Pre-op checklist created', { surgeryId, patientId });
    return id;
  }

  /**
   * Update pre-operative checklist
   */
  async updatePreOpChecklist(
    organizationId: string,
    checklistId: string,
    data: Partial<PreOperativeChecklist>
  ): Promise<boolean> {
    const updates: string[] = [];
    const values: any[] = [];

    // Map fields to database columns
    const fieldMap: Record<string, string> = {
      visualAcuityBaselineOD: 'visual_acuity_baseline_od',
      visualAcuityBaselineOS: 'visual_acuity_baseline_os',
      bestCorrectedVAOD: 'best_corrected_va_od',
      bestCorrectedVAOS: 'best_corrected_va_os',
      intraocularPressureOD: 'intraocular_pressure_od',
      intraocularPressureOS: 'intraocular_pressure_os',
      axialLengthOD: 'axial_length_od',
      axialLengthOS: 'axial_length_os',
      targetRefraction: 'target_refraction',
      selectedIOL: 'selected_iol',
      iolPower: 'iol_power',
      anticoagulationStatus: 'anticoagulation_status',
      anticoagulationNotes: 'anticoagulation_notes',
      diabetesStatus: 'diabetes_status',
      hba1c: 'hba1c',
      informedConsentSigned: 'informed_consent_signed',
      anesthesiaConsentSigned: 'anesthesia_consent_signed',
      patientEducationCompleted: 'patient_education_completed',
      dilationDropsGiven: 'dilation_drops_given',
      antibioticDropsStarted: 'antibiotic_drops_started',
      fastingConfirmed: 'fasting_confirmed',
      labResultsReviewed: 'lab_results_reviewed',
      eyeMarked: 'eye_marked',
      sideConfirmed: 'side_confirmed',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (key in data) {
        updates.push(`${column} = ?`);
        const value = (data as any)[key];
        values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
      }
    }

    if (data.allergies) {
      updates.push('allergies = ?');
      values.push(JSON.stringify(data.allergies));
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(checklistId, organizationId);

    const result = await this.db.prepare(`
      UPDATE ophthalmology_surgery_preop
      SET ${updates.join(', ')}
      WHERE id = ? AND organization_id = ?
    `).bind(...values).run();

    return (result.meta?.changes || 0) > 0;
  }

  /**
   * Complete pre-operative checklist
   */
  async completePreOpChecklist(
    organizationId: string,
    checklistId: string,
    completedBy: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    // Get the checklist
    const checklist = await this.db.prepare(`
      SELECT * FROM ophthalmology_surgery_preop
      WHERE id = ? AND organization_id = ?
    `).bind(checklistId, organizationId).first<any>();

    if (!checklist) {
      return { valid: false, errors: ['Checklist non trouvee'] };
    }

    // Validate required fields
    const errors: string[] = [];

    if (!checklist.informed_consent_signed) {
      errors.push('Consentement eclaire non signe');
    }
    if (!checklist.anesthesia_consent_signed) {
      errors.push('Consentement anesthesie non signe');
    }
    if (!checklist.eye_marked) {
      errors.push('Oeil non marque');
    }
    if (!checklist.side_confirmed) {
      errors.push('Cote non confirme');
    }
    if (!checklist.lab_results_reviewed) {
      errors.push('Resultats labo non verifies');
    }
    if (!checklist.visual_acuity_baseline_od && !checklist.visual_acuity_baseline_os) {
      errors.push('Acuite visuelle baseline non mesuree');
    }
    if (!checklist.intraocular_pressure_od && !checklist.intraocular_pressure_os) {
      errors.push('Pression intraoculaire non mesuree');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Mark as completed
    await this.db.prepare(`
      UPDATE ophthalmology_surgery_preop
      SET completed_at = ?, completed_by = ?, updated_at = ?
      WHERE id = ? AND organization_id = ?
    `).bind(
      new Date().toISOString(), completedBy,
      new Date().toISOString(), checklistId, organizationId
    ).run();

    logger.info('Pre-op checklist completed', { checklistId, completedBy });
    return { valid: true, errors: [] };
  }

  /**
   * Create intra-operative notes
   */
  async createIntraOpNotes(
    organizationId: string,
    surgeryId: string,
    data: Omit<IntraOperativeNotes, 'id'>
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(`
      INSERT INTO ophthalmology_surgery_intraop (
        id, surgery_id, organization_id,
        surgery_start_time, surgery_end_time,
        anesthesia_type, anesthesia_notes,
        surgeon_id, assistant_id, procedure_type, eye,
        incision_type, incision_size, capsulorrhexis_size,
        phaco_power, phaco_time,
        iol_implanted, iol_power_used, iol_position,
        complications, complication_notes,
        post_op_instructions_given,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, surgeryId, organizationId,
      data.surgeryStartTime.toISOString(),
      data.surgeryEndTime?.toISOString() || null,
      data.anesthesiaType, data.anesthesiaNotes || null,
      data.surgeonId, data.assistantId || null,
      data.procedureType, data.eye,
      data.incisionType || null, data.incisionSize || null,
      data.capsulorrhexisSize || null,
      data.phacoPower || null, data.phacoTime || null,
      data.iolImplanted || null, data.iolPowerUsed || null,
      data.iolPosition || null,
      JSON.stringify(data.complications), data.complicationNotes || null,
      data.postOpInstructionsGiven ? 1 : 0,
      now
    ).run();

    logger.info('Intra-op notes created', { surgeryId });
    return id;
  }

  /**
   * Create post-operative assessment
   */
  async createPostOpAssessment(
    organizationId: string,
    surgeryId: string,
    data: Omit<PostOperativeAssessment, 'id'>
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(`
      INSERT INTO ophthalmology_surgery_postop (
        id, surgery_id, organization_id,
        assessment_date, day_post_op,
        uncorrected_va_od, uncorrected_va_os,
        best_corrected_va_od, best_corrected_va_os,
        sphere_od, cylinder_od, axis_od,
        sphere_os, cylinder_os, axis_os,
        iop_od, iop_os,
        corneal_clarity, anterior_chamber, iol_position,
        pcr, cme,
        complications, current_medications,
        next_follow_up, additional_procedures_needed,
        assessed_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, surgeryId, organizationId,
      data.assessmentDate.toISOString(), data.dayPostOp,
      data.uncorrectedVAOD || null, data.uncorrectedVAOS || null,
      data.bestCorrectedVAOD || null, data.bestCorrectedVAOS || null,
      data.sphereOD || null, data.cylinderOD || null, data.axisOD || null,
      data.sphereOS || null, data.cylinderOS || null, data.axisOS || null,
      data.iopOD || null, data.iopOS || null,
      data.cornealClarity, data.anteriorChamber, data.iolPosition,
      data.pcr ? 1 : 0, data.cme ? 1 : 0,
      JSON.stringify(data.complications), JSON.stringify(data.currentMedications),
      data.nextFollowUp?.toISOString() || null,
      JSON.stringify(data.additionalProceduresNeeded || []),
      data.assessedBy,
      now
    ).run();

    logger.info('Post-op assessment created', { surgeryId, dayPostOp: data.dayPostOp });
    return id;
  }

  /**
   * Calculate surgery outcomes
   */
  async calculateSurgeryOutcome(
    organizationId: string,
    surgeryId: string
  ): Promise<SurgeryOutcome | null> {
    // Get surgery details
    const surgery = await this.db.prepare(`
      SELECT s.*, p.id as patient_id
      FROM ophthalmology_surgeries s
      JOIN healthcare_patients p ON s.patient_id = p.id
      WHERE s.id = ? AND s.organization_id = ?
    `).bind(surgeryId, organizationId).first<any>();

    if (!surgery) {
      return null;
    }

    // Get pre-op data
    const preOp = await this.db.prepare(`
      SELECT * FROM ophthalmology_surgery_preop
      WHERE surgery_id = ? AND organization_id = ?
    `).bind(surgeryId, organizationId).first<any>();

    // Get intra-op data
    const intraOp = await this.db.prepare(`
      SELECT * FROM ophthalmology_surgery_intraop
      WHERE surgery_id = ? AND organization_id = ?
    `).bind(surgeryId, organizationId).first<any>();

    // Get most recent post-op (ideally 3-month)
    const postOp = await this.db.prepare(`
      SELECT * FROM ophthalmology_surgery_postop
      WHERE surgery_id = ? AND organization_id = ?
      ORDER BY day_post_op DESC
      LIMIT 1
    `).bind(surgeryId, organizationId).first<any>();

    if (!preOp || !postOp) {
      return null;
    }

    const eye = intraOp?.eye || surgery.eye || 'OD';
    const preOpVA = eye === 'OD' ? preOp.best_corrected_va_od : preOp.best_corrected_va_os;
    const postOpVA = eye === 'OD' ? postOp.best_corrected_va_od : postOp.best_corrected_va_os;
    const preOpIOP = eye === 'OD' ? preOp.intraocular_pressure_od : preOp.intraocular_pressure_os;
    const postOpIOP = eye === 'OD' ? postOp.iop_od : postOp.iop_os;

    // Calculate VA improvement (in logMAR, lower is better)
    const vaImprovement = preOpVA && postOpVA ? (preOpVA - postOpVA) * 10 : 0; // Lines gained

    // Check if target refraction achieved
    const targetRefraction = preOp.target_refraction || 0;
    const actualRefraction = eye === 'OD' ? postOp.sphere_od : postOp.sphere_os;
    const targetAchieved = actualRefraction !== null
      ? Math.abs(actualRefraction - targetRefraction) <= 0.5
      : false;

    // Check complications
    const intraOpComplications = intraOp ? JSON.parse(intraOp.complications || '[]') : [];
    const postOpComplications = JSON.parse(postOp.complications || '[]');
    const complicationFree = intraOpComplications.length === 0 && postOpComplications.length === 0;

    // Overall success criteria
    const overallSuccess = vaImprovement >= 0 && targetAchieved && complicationFree;

    const outcome: SurgeryOutcome = {
      surgeryId,
      patientId: surgery.patient_id,
      eye,
      procedureType: surgery.procedure_type || intraOp?.procedure_type || 'unknown',
      surgeryDate: new Date(surgery.surgery_date),
      preOpBCVA: preOpVA || 0,
      preOpIOP: preOpIOP || 0,
      finalUCVA: eye === 'OD' ? postOp.uncorrected_va_od : postOp.uncorrected_va_os,
      finalBCVA: postOpVA,
      finalIOP: postOpIOP,
      refractiveOutcome: actualRefraction !== null ? actualRefraction - targetRefraction : undefined,
      vaImprovement,
      targetRefractionAchieved: targetAchieved,
      complicationFree,
      overallSuccess,
    };

    logger.info('Surgery outcome calculated', { surgeryId, overallSuccess, vaImprovement });
    return outcome;
  }

  /**
   * Get surgery workflow summary
   */
  async getSurgeryWorkflowSummary(
    organizationId: string,
    surgeryId: string
  ): Promise<{
    surgery: any;
    preOp: any;
    intraOp: any;
    postOpAssessments: any[];
    outcome: SurgeryOutcome | null;
  } | null> {
    const surgery = await this.db.prepare(`
      SELECT * FROM ophthalmology_surgeries
      WHERE id = ? AND organization_id = ?
    `).bind(surgeryId, organizationId).first<any>();

    if (!surgery) {
      return null;
    }

    const [preOp, intraOp, postOpResult, outcome] = await Promise.all([
      this.db.prepare(`
        SELECT * FROM ophthalmology_surgery_preop
        WHERE surgery_id = ? AND organization_id = ?
      `).bind(surgeryId, organizationId).first<any>(),

      this.db.prepare(`
        SELECT * FROM ophthalmology_surgery_intraop
        WHERE surgery_id = ? AND organization_id = ?
      `).bind(surgeryId, organizationId).first<any>(),

      this.db.prepare(`
        SELECT * FROM ophthalmology_surgery_postop
        WHERE surgery_id = ? AND organization_id = ?
        ORDER BY day_post_op ASC
      `).bind(surgeryId, organizationId).all(),

      this.calculateSurgeryOutcome(organizationId, surgeryId),
    ]);

    return {
      surgery,
      preOp,
      intraOp,
      postOpAssessments: postOpResult.results || [],
      outcome,
    };
  }
}
