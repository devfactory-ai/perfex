/**
 * Cardiology Workflow Service
 * Manages complete patient journey from admission to follow-up
 *
 * Workflow stages:
 * 1. Initial Consultation → Triage & Risk Assessment
 * 2. Diagnostic Workup → ECG, Echo, Stress Test, Coronary Angiography
 * 3. Decision Making → Conservative vs Interventional
 * 4. Intervention → PCI, CABG, Device Implant
 * 5. Post-Procedure Care → Monitoring, Complications
 * 6. Discharge Planning → Medications, Follow-up
 * 7. Cardiac Rehabilitation → Exercise, Education
 */

import { logger } from '../../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type WorkflowStage =
  | 'admission'
  | 'triage'
  | 'consultation'
  | 'diagnostics'
  | 'decision'
  | 'intervention'
  | 'post_procedure'
  | 'monitoring'
  | 'discharge'
  | 'rehabilitation'
  | 'follow_up'
  | 'completed';

export type UrgencyLevel = 'elective' | 'urgent' | 'emergent' | 'stat';

export type InterventionType =
  | 'medical_management'
  | 'pci'           // Percutaneous Coronary Intervention
  | 'cabg'          // Coronary Artery Bypass Graft
  | 'valve_repair'
  | 'valve_replacement'
  | 'pacemaker'
  | 'icd'           // Implantable Cardioverter Defibrillator
  | 'crt'           // Cardiac Resynchronization Therapy
  | 'ablation'
  | 'other';

export interface WorkflowState {
  id: string;
  patientId: string;
  organizationId: string;
  currentStage: WorkflowStage;
  urgency: UrgencyLevel;
  interventionType?: InterventionType;
  admissionDate: Date;
  expectedDischargeDate?: Date;
  actualDischargeDate?: Date;
  primaryDiagnosis: string;
  riskScore?: number;
  riskCategory?: 'low' | 'intermediate' | 'high' | 'very_high';

  // Stage completion tracking
  stagesCompleted: {
    stage: WorkflowStage;
    completedAt: Date;
    completedBy: string;
    notes?: string;
  }[];

  // Checklist items per stage
  checklists: {
    [key in WorkflowStage]?: {
      item: string;
      required: boolean;
      completed: boolean;
      completedAt?: Date;
      completedBy?: string;
    }[];
  };

  // Alerts and flags
  alerts: {
    type: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowTransition {
  from: WorkflowStage;
  to: WorkflowStage;
  timestamp: Date;
  userId: string;
  reason?: string;
  autoAdvanced: boolean;
}

export interface DiagnosticResult {
  type: 'ecg' | 'echo' | 'stress_test' | 'cath' | 'ct_angio' | 'mri' | 'holter' | 'labs';
  date: Date;
  findings: string;
  interpretation: string;
  actionRequired: boolean;
  urgency?: UrgencyLevel;
}

export interface Dischargeplan {
  medications: {
    name: string;
    dose: string;
    frequency: string;
    duration: string;
    notes?: string;
  }[];
  restrictions: string[];
  followUpAppointments: {
    specialty: string;
    timeframe: string;
    scheduled?: boolean;
    date?: Date;
  }[];
  cardiacRehab: boolean;
  rehabDetails?: {
    startDate: Date;
    sessions: number;
    goals: string[];
  };
  patientEducation: string[];
  emergencyInstructions: string;
}

// ============================================================================
// Workflow Checklists
// ============================================================================

export const STAGE_CHECKLISTS: Record<WorkflowStage, { item: string; required: boolean }[]> = {
  admission: [
    { item: 'Verify patient identity', required: true },
    { item: 'Record vital signs', required: true },
    { item: 'Obtain medical history', required: true },
    { item: 'Review current medications', required: true },
    { item: 'Check allergies', required: true },
    { item: 'Obtain consent forms', required: true },
    { item: 'Assign bed/room', required: false },
  ],
  triage: [
    { item: 'Assess chest pain characteristics', required: true },
    { item: 'Obtain 12-lead ECG', required: true },
    { item: 'Draw cardiac markers', required: true },
    { item: 'Calculate HEART score', required: true },
    { item: 'Determine urgency level', required: true },
  ],
  consultation: [
    { item: 'Complete history and physical', required: true },
    { item: 'Review prior records', required: true },
    { item: 'Assess cardiovascular risk factors', required: true },
    { item: 'Document working diagnosis', required: true },
    { item: 'Create initial management plan', required: true },
  ],
  diagnostics: [
    { item: 'Order baseline labs (CBC, BMP, lipids)', required: true },
    { item: 'Perform echocardiogram', required: false },
    { item: 'Schedule stress test if indicated', required: false },
    { item: 'Order CT angiography if indicated', required: false },
    { item: 'Review all results', required: true },
  ],
  decision: [
    { item: 'Review all diagnostic results', required: true },
    { item: 'Discuss options with patient/family', required: true },
    { item: 'Document shared decision making', required: true },
    { item: 'Obtain informed consent if intervention', required: false },
    { item: 'Schedule procedure if indicated', required: false },
  ],
  intervention: [
    { item: 'Pre-procedure checklist completed', required: true },
    { item: 'Procedure performed', required: true },
    { item: 'Immediate complications assessed', required: true },
    { item: 'Procedure report documented', required: true },
    { item: 'Post-procedure orders written', required: true },
  ],
  post_procedure: [
    { item: 'Monitor vitals q15min x 4, then q1h', required: true },
    { item: 'Check access site for bleeding', required: true },
    { item: 'Assess for chest pain', required: true },
    { item: 'Repeat ECG', required: false },
    { item: 'Check labs if indicated', required: false },
  ],
  monitoring: [
    { item: 'Daily assessment', required: true },
    { item: 'Monitor telemetry', required: true },
    { item: 'Review medications', required: true },
    { item: 'Assess for complications', required: true },
    { item: 'Update risk assessment', required: false },
  ],
  discharge: [
    { item: 'Discharge medications reconciled', required: true },
    { item: 'Prescriptions provided', required: true },
    { item: 'Follow-up appointments scheduled', required: true },
    { item: 'Patient education completed', required: true },
    { item: 'Discharge summary dictated', required: true },
    { item: 'Cardiac rehab referral if indicated', required: false },
  ],
  rehabilitation: [
    { item: 'Initial assessment completed', required: true },
    { item: 'Exercise prescription created', required: true },
    { item: 'Risk factor modification plan', required: true },
    { item: 'Psychosocial assessment', required: false },
    { item: 'Progress tracking initiated', required: true },
  ],
  follow_up: [
    { item: 'Review symptoms', required: true },
    { item: 'Physical examination', required: true },
    { item: 'Review medications', required: true },
    { item: 'Order follow-up tests if needed', required: false },
    { item: 'Adjust treatment plan', required: false },
    { item: 'Schedule next follow-up', required: true },
  ],
  completed: [],
};

// ============================================================================
// Workflow Service
// ============================================================================

export class CardiologyWorkflowService {
  private workflows: Map<string, WorkflowState> = new Map();

  /**
   * Initialize a new patient workflow
   */
  initializeWorkflow(
    patientId: string,
    organizationId: string,
    userId: string,
    initialData: {
      urgency: UrgencyLevel;
      primaryDiagnosis: string;
      admissionDate?: Date;
    }
  ): WorkflowState {
    const id = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const workflow: WorkflowState = {
      id,
      patientId,
      organizationId,
      currentStage: 'admission',
      urgency: initialData.urgency,
      admissionDate: initialData.admissionDate || now,
      primaryDiagnosis: initialData.primaryDiagnosis,
      stagesCompleted: [],
      checklists: this.initializeChecklists(),
      alerts: [],
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };

    // Set expected discharge based on urgency
    workflow.expectedDischargeDate = this.calculateExpectedDischarge(
      workflow.admissionDate,
      initialData.urgency
    );

    this.workflows.set(id, workflow);

    logger.info('Workflow initialized', {
      workflowId: id,
      patientId,
      urgency: initialData.urgency,
    });

    return workflow;
  }

  /**
   * Initialize all stage checklists
   */
  private initializeChecklists(): WorkflowState['checklists'] {
    const checklists: WorkflowState['checklists'] = {};

    for (const [stage, items] of Object.entries(STAGE_CHECKLISTS)) {
      checklists[stage as WorkflowStage] = items.map((item) => ({
        item: item.item,
        required: item.required,
        completed: false,
      }));
    }

    return checklists;
  }

  /**
   * Calculate expected discharge date
   */
  private calculateExpectedDischarge(admissionDate: Date, urgency: UrgencyLevel): Date {
    const days = {
      elective: 3,
      urgent: 5,
      emergent: 7,
      stat: 10,
    };

    const discharge = new Date(admissionDate);
    discharge.setDate(discharge.getDate() + days[urgency]);
    return discharge;
  }

  /**
   * Advance workflow to next stage
   */
  advanceStage(
    workflowId: string,
    userId: string,
    options?: {
      force?: boolean;
      notes?: string;
      skipValidation?: boolean;
    }
  ): { success: boolean; workflow?: WorkflowState; errors?: string[] } {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return { success: false, errors: ['Workflow not found'] };
    }

    // Validate current stage completion
    if (!options?.skipValidation && !options?.force) {
      const validation = this.validateStageCompletion(workflow);
      if (!validation.valid) {
        return { success: false, errors: validation.missingItems };
      }
    }

    // Get next stage
    const nextStage = this.getNextStage(workflow.currentStage);
    if (!nextStage) {
      return { success: false, errors: ['Workflow already completed'] };
    }

    // Record stage completion
    workflow.stagesCompleted.push({
      stage: workflow.currentStage,
      completedAt: new Date(),
      completedBy: userId,
      notes: options?.notes,
    });

    // Advance to next stage
    workflow.currentStage = nextStage;
    workflow.updatedAt = new Date();

    logger.info('Workflow stage advanced', {
      workflowId,
      from: workflow.stagesCompleted[workflow.stagesCompleted.length - 1].stage,
      to: nextStage,
      userId,
    });

    return { success: true, workflow };
  }

  /**
   * Get the next stage in the workflow
   */
  private getNextStage(currentStage: WorkflowStage): WorkflowStage | null {
    const stageOrder: WorkflowStage[] = [
      'admission',
      'triage',
      'consultation',
      'diagnostics',
      'decision',
      'intervention',
      'post_procedure',
      'monitoring',
      'discharge',
      'rehabilitation',
      'follow_up',
      'completed',
    ];

    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) {
      return null;
    }

    return stageOrder[currentIndex + 1];
  }

  /**
   * Validate stage completion requirements
   */
  validateStageCompletion(workflow: WorkflowState): {
    valid: boolean;
    missingItems: string[];
  } {
    const checklist = workflow.checklists[workflow.currentStage] || [];
    const missingItems: string[] = [];

    for (const item of checklist) {
      if (item.required && !item.completed) {
        missingItems.push(item.item);
      }
    }

    return {
      valid: missingItems.length === 0,
      missingItems,
    };
  }

  /**
   * Complete a checklist item
   */
  completeChecklistItem(
    workflowId: string,
    stage: WorkflowStage,
    itemIndex: number,
    userId: string
  ): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.checklists[stage]) {
      return false;
    }

    const item = workflow.checklists[stage]![itemIndex];
    if (!item) {
      return false;
    }

    item.completed = true;
    item.completedAt = new Date();
    item.completedBy = userId;
    workflow.updatedAt = new Date();

    // Check if stage can auto-advance
    const validation = this.validateStageCompletion(workflow);
    if (validation.valid) {
      this.addAlert(workflowId, {
        type: 'info',
        message: `Stage "${stage}" requirements completed. Ready to advance.`,
      });
    }

    return true;
  }

  /**
   * Set intervention type
   */
  setInterventionType(workflowId: string, interventionType: InterventionType): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.interventionType = interventionType;
    workflow.updatedAt = new Date();

    // Adjust expected discharge based on intervention
    if (interventionType === 'cabg') {
      // CABG typically requires longer stay
      const newDischarge = new Date(workflow.admissionDate);
      newDischarge.setDate(newDischarge.getDate() + 10);
      workflow.expectedDischargeDate = newDischarge;
    }

    return true;
  }

  /**
   * Update risk assessment
   */
  updateRiskAssessment(
    workflowId: string,
    riskScore: number,
    riskCategory: 'low' | 'intermediate' | 'high' | 'very_high'
  ): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.riskScore = riskScore;
    workflow.riskCategory = riskCategory;
    workflow.updatedAt = new Date();

    // Add alert for high-risk patients
    if (riskCategory === 'high' || riskCategory === 'very_high') {
      this.addAlert(workflowId, {
        type: 'warning',
        message: `High-risk patient: ${riskCategory} (score: ${riskScore.toFixed(1)}%)`,
      });
    }

    return true;
  }

  /**
   * Add alert to workflow
   */
  addAlert(
    workflowId: string,
    alert: { type: 'info' | 'warning' | 'critical'; message: string }
  ): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.alerts.push({
      ...alert,
      timestamp: new Date(),
      acknowledged: false,
    });
    workflow.updatedAt = new Date();

    return true;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(workflowId: string, alertIndex: number): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.alerts[alertIndex]) return false;

    workflow.alerts[alertIndex].acknowledged = true;
    workflow.updatedAt = new Date();

    return true;
  }

  /**
   * Add diagnostic result
   */
  addDiagnosticResult(workflowId: string, result: DiagnosticResult): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    // Add alert if action required
    if (result.actionRequired) {
      this.addAlert(workflowId, {
        type: result.urgency === 'stat' || result.urgency === 'emergent' ? 'critical' : 'warning',
        message: `${result.type.toUpperCase()}: ${result.interpretation}`,
      });
    }

    // Mark diagnostic checklist items as complete
    const diagnosticsChecklist = workflow.checklists.diagnostics;
    if (diagnosticsChecklist) {
      const typeMapping: Record<string, string> = {
        ecg: 'Obtain 12-lead ECG',
        echo: 'Perform echocardiogram',
        stress_test: 'Schedule stress test',
        labs: 'Order baseline labs',
      };

      const itemText = typeMapping[result.type];
      if (itemText) {
        const itemIndex = diagnosticsChecklist.findIndex((i) => i.item.includes(itemText.split(' ')[0]));
        if (itemIndex >= 0) {
          diagnosticsChecklist[itemIndex].completed = true;
          diagnosticsChecklist[itemIndex].completedAt = result.date;
        }
      }
    }

    workflow.updatedAt = new Date();
  }

  /**
   * Generate discharge plan
   */
  generateDischargePlan(workflowId: string): Dischargeplan | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    // Base medications for cardiac patients
    const baseMedications = [
      { name: 'Aspirin', dose: '81mg', frequency: 'Daily', duration: 'Indefinite', notes: 'Take with food' },
      { name: 'Atorvastatin', dose: '40mg', frequency: 'Daily at bedtime', duration: 'Indefinite' },
    ];

    // Add intervention-specific medications
    const interventionMeds: typeof baseMedications = [];
    if (workflow.interventionType === 'pci') {
      interventionMeds.push(
        { name: 'Clopidogrel', dose: '75mg', frequency: 'Daily', duration: '12 months minimum', notes: 'Do not stop without consulting cardiologist' },
        { name: 'Pantoprazole', dose: '40mg', frequency: 'Daily', duration: 'While on dual antiplatelet' }
      );
    } else if (workflow.interventionType === 'cabg') {
      interventionMeds.push(
        { name: 'Metoprolol', dose: '25mg', frequency: 'Twice daily', duration: 'Indefinite' },
        { name: 'Lisinopril', dose: '10mg', frequency: 'Daily', duration: 'Indefinite' }
      );
    } else if (workflow.interventionType === 'pacemaker' || workflow.interventionType === 'icd') {
      interventionMeds.push(
        { name: 'Warfarin', dose: 'Per INR', frequency: 'Daily', duration: '3 months post-implant', notes: 'Target INR 2-3' }
      );
    }

    // Restrictions
    const restrictions: string[] = [
      'No driving for 1 week after procedure',
      'No heavy lifting (>10 lbs) for 2 weeks',
    ];

    if (workflow.interventionType === 'cabg') {
      restrictions.push(
        'Sternal precautions for 6-8 weeks',
        'No driving for 4-6 weeks',
        'No swimming until incision healed'
      );
    }

    // Follow-up appointments
    const followUpAppointments = [
      { specialty: 'Cardiology', timeframe: '1-2 weeks', scheduled: false },
      { specialty: 'Primary Care', timeframe: '2-4 weeks', scheduled: false },
    ];

    if (workflow.interventionType === 'pacemaker' || workflow.interventionType === 'icd') {
      followUpAppointments.push({ specialty: 'Device Clinic', timeframe: '1 week', scheduled: false });
    }

    // Cardiac rehab recommendation
    const cardiacRehab = workflow.interventionType !== 'medical_management';

    return {
      medications: [...baseMedications, ...interventionMeds],
      restrictions,
      followUpAppointments,
      cardiacRehab,
      rehabDetails: cardiacRehab
        ? {
            startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
            sessions: 36,
            goals: [
              'Improve cardiovascular fitness',
              'Risk factor modification',
              'Psychosocial support',
              'Return to normal activities',
            ],
          }
        : undefined,
      patientEducation: [
        'Heart-healthy diet education',
        'Medication compliance importance',
        'Smoking cessation if applicable',
        'Exercise guidelines',
        'Warning signs to watch for',
      ],
      emergencyInstructions:
        'Si vous ressentez une douleur thoracique, un essoufflement, des palpitations ou une perte de connaissance, appelez le 15 (SAMU) immédiatement.',
    };
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowState | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get workflow summary for dashboard
   */
  getWorkflowSummary(workflowId: string): {
    stage: WorkflowStage;
    progress: number;
    daysInHospital: number;
    expectedDischarge: Date | undefined;
    alerts: number;
    criticalAlerts: number;
  } | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const stages: WorkflowStage[] = [
      'admission', 'triage', 'consultation', 'diagnostics', 'decision',
      'intervention', 'post_procedure', 'monitoring', 'discharge',
      'rehabilitation', 'follow_up', 'completed',
    ];

    const currentIndex = stages.indexOf(workflow.currentStage);
    const progress = Math.round(((currentIndex + 1) / stages.length) * 100);

    const daysInHospital = Math.ceil(
      (Date.now() - workflow.admissionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const unacknowledgedAlerts = workflow.alerts.filter((a) => !a.acknowledged);

    return {
      stage: workflow.currentStage,
      progress,
      daysInHospital,
      expectedDischarge: workflow.expectedDischargeDate,
      alerts: unacknowledgedAlerts.length,
      criticalAlerts: unacknowledgedAlerts.filter((a) => a.type === 'critical').length,
    };
  }

  /**
   * Get all workflows for an organization
   */
  listWorkflows(
    organizationId: string,
    filters?: {
      stage?: WorkflowStage;
      urgency?: UrgencyLevel;
      patientId?: string;
    }
  ): WorkflowState[] {
    const workflows = Array.from(this.workflows.values()).filter(
      (w) => w.organizationId === organizationId
    );

    if (!filters) return workflows;

    return workflows.filter((w) => {
      if (filters.stage && w.currentStage !== filters.stage) return false;
      if (filters.urgency && w.urgency !== filters.urgency) return false;
      if (filters.patientId && w.patientId !== filters.patientId) return false;
      return true;
    });
  }

  /**
   * Get stage-specific metrics
   */
  getStageMetrics(organizationId: string): Record<WorkflowStage, number> {
    const metrics: Record<WorkflowStage, number> = {
      admission: 0,
      triage: 0,
      consultation: 0,
      diagnostics: 0,
      decision: 0,
      intervention: 0,
      post_procedure: 0,
      monitoring: 0,
      discharge: 0,
      rehabilitation: 0,
      follow_up: 0,
      completed: 0,
    };

    for (const workflow of this.workflows.values()) {
      if (workflow.organizationId === organizationId) {
        metrics[workflow.currentStage]++;
      }
    }

    return metrics;
  }
}

// Export singleton instance
export const cardiologyWorkflowService = new CardiologyWorkflowService();
export default cardiologyWorkflowService;
