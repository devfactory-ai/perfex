/**
 * Emergency Department (ED) Service - Gestion des Urgences
 *
 * Fonctionnalités:
 * - Système de triage (échelle CIMU/ESI)
 * - Prise en charge trauma
 * - Workflow urgences
 * - Temps d'attente et suivi
 * - Alertes critiques
 * - Ressources et lits
 */

// Types pour Emergency Department
export interface EDPatient {
  id: string;
  patientId: string;
  visitId: string;
  arrivalTime: Date;
  arrivalMode: ArrivalMode;
  chiefComplaint: string;
  triageLevel: TriageLevel;
  triageScore: number;
  triageTime?: Date;
  triageNurseId?: string;
  status: EDStatus;
  location?: EDLocation;
  assignedPhysicianId?: string;
  assignedNurseId?: string;
  assignedTeam?: string;
  acuityLevel: number;
  isTrauma: boolean;
  traumaLevel?: TraumaLevel;
  isStroke: boolean;
  strokeCode?: StrokeCode;
  isSTEMI: boolean;
  isSepsis: boolean;
  isPediatric: boolean;
  isGeriatric: boolean;
  isPsychiatric: boolean;
  vitals: EDVitals[];
  assessments: EDAssessment[];
  orders: EDOrder[];
  interventions: EDIntervention[];
  consultations: EDConsultation[];
  disposition?: EDDisposition;
  estimatedDischargeTime?: Date;
  actualDischargeTime?: Date;
  lengthOfStay?: number; // minutes
  waitTime?: number; // minutes until first physician contact
  doorToProvider?: number; // minutes
  alerts: EDAlert[];
  notes: EDNote[];
  createdAt: Date;
  updatedAt: Date;
}

export type ArrivalMode =
  | 'ambulatory' | 'ambulance' | 'helicopter' | 'police'
  | 'private_vehicle' | 'transfer' | 'walk_in';

export type TriageLevel = 1 | 2 | 3 | 4 | 5; // CIMU/ESI scale

export type EDStatus =
  | 'arrived' | 'waiting_triage' | 'triaged' | 'waiting_bed'
  | 'in_treatment' | 'awaiting_results' | 'awaiting_consult'
  | 'awaiting_admission' | 'awaiting_discharge' | 'discharged'
  | 'admitted' | 'transferred' | 'left_without_being_seen'
  | 'left_against_medical_advice' | 'deceased';

export type TraumaLevel = 'alpha' | 'bravo' | 'charlie' | 'minor';

export interface StrokeCode {
  type: 'ischemic' | 'hemorrhagic' | 'tia' | 'unknown';
  lastKnownWell: Date;
  nihssScore?: number;
  ctCompleted: boolean;
  tpaEligible: boolean;
  tpaAdministered: boolean;
  thrombectomyCandidate: boolean;
}

export interface EDLocation {
  zone: string;
  bed: string;
  room?: string;
  type: 'bed' | 'chair' | 'hallway' | 'trauma_bay' | 'resuscitation' | 'isolation';
  assignedAt: Date;
}

export interface EDVitals {
  id: string;
  timestamp: Date;
  recordedBy: string;
  temperature?: number;
  temperatureUnit: 'C' | 'F';
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  supplementalOxygen?: string;
  painScore?: number;
  glasgowComaScale?: {
    eye: number;
    verbal: number;
    motor: number;
    total: number;
  };
  bloodGlucose?: number;
  alerts: string[];
}

export interface EDAssessment {
  id: string;
  type: AssessmentType;
  assessedBy: string;
  assessedAt: Date;
  findings: string;
  clinicalImpression?: string;
  differentialDiagnosis?: string[];
  workingDiagnosis?: string;
  icdCodes?: string[];
  acuityChange?: {
    from: number;
    to: number;
    reason: string;
  };
}

export type AssessmentType =
  | 'initial' | 'nursing' | 'physician' | 'reassessment'
  | 'pain' | 'fall_risk' | 'suicide_risk' | 'discharge';

export interface EDOrder {
  id: string;
  type: OrderType;
  orderedBy: string;
  orderedAt: Date;
  priority: 'routine' | 'urgent' | 'stat' | 'asap';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  details: Record<string, any>;
  results?: string;
  completedAt?: Date;
  completedBy?: string;
}

export type OrderType =
  | 'lab' | 'imaging' | 'medication' | 'procedure' | 'iv_fluids'
  | 'diet' | 'activity' | 'nursing' | 'consult' | 'discharge';

export interface EDIntervention {
  id: string;
  type: string;
  performedBy: string;
  performedAt: Date;
  description: string;
  outcome?: string;
  complications?: string;
  duration?: number; // minutes
}

export interface EDConsultation {
  id: string;
  specialty: string;
  requestedBy: string;
  requestedAt: Date;
  urgency: 'routine' | 'urgent' | 'emergent';
  reason: string;
  consultantId?: string;
  consultantName?: string;
  responseTime?: number; // minutes
  findings?: string;
  recommendations?: string;
  completedAt?: Date;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
}

export interface EDDisposition {
  type: DispositionType;
  decidedBy: string;
  decidedAt: Date;
  destination?: string;
  admittingService?: string;
  admittingPhysician?: string;
  bedRequest?: string;
  transferTo?: string;
  transferReason?: string;
  dischargeInstructions?: string;
  followUp?: FollowUpInstruction[];
  prescriptions?: string[];
  returnPrecautions?: string[];
}

export type DispositionType =
  | 'discharge_home' | 'discharge_with_services' | 'admit_inpatient'
  | 'admit_observation' | 'admit_icu' | 'transfer' | 'ama'
  | 'lwbs' | 'deceased' | 'hospice';

export interface FollowUpInstruction {
  provider: string;
  specialty?: string;
  timeframe: string;
  reason: string;
  scheduled: boolean;
  appointmentId?: string;
}

export interface EDAlert {
  id: string;
  type: EDAlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  triggeredAt: Date;
  triggeredBy?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  autoResolved: boolean;
}

export type EDAlertType =
  | 'abnormal_vital' | 'critical_result' | 'wait_time' | 'bed_assignment'
  | 'stroke_alert' | 'stemi_alert' | 'trauma_alert' | 'sepsis_alert'
  | 'code_blue' | 'rapid_response' | 'fall_risk' | 'elopement_risk'
  | 'medication_due' | 'reassessment_due' | 'boarding_time';

export interface EDNote {
  id: string;
  type: 'progress' | 'nursing' | 'physician' | 'procedure' | 'communication';
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  addendum?: string;
  addendumAt?: Date;
}

// Triage Assessment
export interface TriageAssessment {
  patientId: string;
  visitId: string;
  assessedBy: string;
  assessedAt: Date;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  allergies: string[];
  medications: string[];
  pastMedicalHistory: string[];
  lastMealTime?: Date;
  lastTetanus?: Date;
  immunocompromised: boolean;
  pregnant: boolean;
  pregnancyWeeks?: number;
  vitals: EDVitals;
  painAssessment?: PainAssessment;
  acuityFactors: AcuityFactor[];
  triageLevel: TriageLevel;
  triageRationale: string;
  immediateInterventions?: string[];
  isolationRequired: boolean;
  isolationType?: 'contact' | 'droplet' | 'airborne' | 'reverse';
}

export interface PainAssessment {
  location: string[];
  intensity: number; // 0-10
  quality: string[];
  onset: string;
  duration: string;
  aggravating: string[];
  relieving: string[];
  radiation: string;
}

export interface AcuityFactor {
  factor: string;
  impact: 'increase' | 'decrease' | 'neutral';
  points: number;
  rationale: string;
}

// ED Metrics and Dashboard
export interface EDMetrics {
  timestamp: Date;
  currentCensus: number;
  waitingCount: number;
  inTreatmentCount: number;
  boardingCount: number;
  averageWaitTime: number; // minutes
  averageDoorToProvider: number;
  averageLengthOfStay: number;
  lwbsRate: number; // percentage
  leftAmaCount: number;
  admissionRate: number;
  bedOccupancy: number;
  triageLevelBreakdown: Record<TriageLevel, number>;
  acuityByZone: Record<string, { count: number; avgAcuity: number }>;
  pendingAdmissions: number;
  criticalPatients: number;
  ambulanceDiversion: boolean;
}

export interface TraumaActivation {
  id: string;
  level: TraumaLevel;
  activatedAt: Date;
  activatedBy: string;
  mechanism: string;
  eta?: number; // minutes
  patientAge?: number;
  patientGender?: string;
  vitals?: Partial<EDVitals>;
  injuries?: string[];
  gcs?: number;
  teamNotified: TeamMember[];
  traumaBay: string;
  status: 'pending' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  patientId?: string;
  visitId?: string;
  deactivatedAt?: Date;
  deactivatedBy?: string;
  deactivationReason?: string;
}

export interface TeamMember {
  role: string;
  userId?: string;
  name?: string;
  notifiedAt: Date;
  acknowledgedAt?: Date;
  arrivedAt?: Date;
}

// Sepsis Screening
export interface SepsisScreening {
  patientId: string;
  visitId: string;
  screenedBy: string;
  screenedAt: Date;
  sirsPositive: boolean;
  sirsCriteria: {
    temperature: boolean; // >38°C or <36°C
    heartRate: boolean; // >90
    respiratoryRate: boolean; // >20 or PaCO2 <32
    wbc: boolean; // >12000 or <4000 or >10% bands
  };
  qsofaScore: number;
  qsofaCriteria: {
    respiratoryRate: boolean; // ≥22
    alteredMentation: boolean;
    systolicBP: boolean; // ≤100
  };
  suspectedInfection: boolean;
  infectionSource?: string;
  lactateLevel?: number;
  sepsisLikely: boolean;
  septicShock: boolean;
  bundleInitiated: boolean;
  bundleItems: SepsisBundleItem[];
}

export interface SepsisBundleItem {
  item: string;
  dueTime: Date;
  completedAt?: Date;
  completedBy?: string;
  status: 'pending' | 'completed' | 'not_applicable';
}

export class EmergencyDepartmentService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // ==================== PATIENT REGISTRATION ====================

  async registerPatient(data: {
    patientId: string;
    arrivalMode: ArrivalMode;
    chiefComplaint: string;
    isTrauma?: boolean;
    traumaLevel?: TraumaLevel;
  }): Promise<EDPatient> {
    const visitId = crypto.randomUUID();
    const patient: EDPatient = {
      id: crypto.randomUUID(),
      patientId: data.patientId,
      visitId,
      arrivalTime: new Date(),
      arrivalMode: data.arrivalMode,
      chiefComplaint: data.chiefComplaint,
      triageLevel: 3, // Default, will be updated after triage
      triageScore: 0,
      status: 'arrived',
      acuityLevel: 3,
      isTrauma: data.isTrauma || false,
      traumaLevel: data.traumaLevel,
      isStroke: false,
      isSTEMI: false,
      isSepsis: false,
      isPediatric: false, // Will be determined from patient age
      isGeriatric: false,
      isPsychiatric: false,
      vitals: [],
      assessments: [],
      orders: [],
      interventions: [],
      consultations: [],
      alerts: [],
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check for trauma activation
    if (data.isTrauma && data.traumaLevel) {
      await this.activateTraumaTeam(patient, data.traumaLevel);
    }

    await this.saveEDPatient(patient);
    return patient;
  }

  // ==================== TRIAGE ====================

  async performTriage(assessment: TriageAssessment): Promise<{
    patient: EDPatient;
    alerts: EDAlert[];
    recommendedLocation: EDLocation;
  }> {
    const patient = await this.getEDPatientByVisit(assessment.visitId);
    if (!patient) {
      throw new Error('Patient visit not found');
    }

    // Calculate triage level using ESI/CIMU algorithm
    const triageResult = this.calculateTriageLevel(assessment);

    patient.triageLevel = triageResult.level;
    patient.triageScore = triageResult.score;
    patient.triageTime = new Date();
    patient.triageNurseId = assessment.assessedBy;
    patient.status = 'triaged';
    patient.acuityLevel = triageResult.level;

    // Add triage vitals
    patient.vitals.push(assessment.vitals);

    // Check for special protocols
    const alerts = await this.checkSpecialProtocols(patient, assessment);
    patient.alerts.push(...alerts);

    // Recommend location based on triage level and availability
    const recommendedLocation = await this.recommendLocation(patient);

    // Add triage assessment
    patient.assessments.push({
      id: crypto.randomUUID(),
      type: 'initial',
      assessedBy: assessment.assessedBy,
      assessedAt: assessment.assessedAt,
      findings: assessment.historyOfPresentIllness,
      clinicalImpression: assessment.triageRationale,
      differentialDiagnosis: [],
      acuityChange: undefined
    });

    patient.updatedAt = new Date();
    await this.updateEDPatient(patient);

    return { patient, alerts, recommendedLocation };
  }

  private calculateTriageLevel(assessment: TriageAssessment): { level: TriageLevel; score: number } {
    let score = 0;
    let level: TriageLevel = 3;

    // ESI Algorithm
    // Level 1: Immediate life-saving intervention required
    if (this.requiresImmediateIntervention(assessment)) {
      return { level: 1, score: 100 };
    }

    // Level 2: High risk, confused/lethargic/disoriented, severe pain
    if (this.isHighRisk(assessment)) {
      return { level: 2, score: 80 };
    }

    // Levels 3-5 based on expected resource needs
    const resourceCount = this.estimateResourceNeeds(assessment);

    if (resourceCount >= 2) {
      level = 3;
      score = 60;
    } else if (resourceCount === 1) {
      level = 4;
      score = 40;
    } else {
      level = 5;
      score = 20;
    }

    // Adjust for vital sign abnormalities
    const vitalScore = this.assessVitalSigns(assessment.vitals);
    if (vitalScore > 0) {
      level = Math.max(1, level - 1) as TriageLevel;
      score += vitalScore;
    }

    // Apply acuity factors
    for (const factor of assessment.acuityFactors) {
      if (factor.impact === 'increase') {
        score += factor.points;
        if (factor.points >= 20 && level > 2) {
          level = (level - 1) as TriageLevel;
        }
      } else if (factor.impact === 'decrease') {
        score -= factor.points;
      }
    }

    return { level, score: Math.min(100, Math.max(0, score)) };
  }

  private requiresImmediateIntervention(assessment: TriageAssessment): boolean {
    const vitals = assessment.vitals;

    // Unresponsive
    if (vitals.glasgowComaScale && vitals.glasgowComaScale.total <= 8) return true;

    // Pulseless
    if (vitals.heartRate === 0) return true;

    // Apneic
    if (vitals.respiratoryRate === 0) return true;

    // Severe respiratory distress
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 85) return true;

    // Check for immediate life threats based on chief complaint
    const immediateThreats = [
      'cardiac arrest', 'respiratory arrest', 'anaphylaxis',
      'active seizure', 'massive hemorrhage', 'airway obstruction'
    ];

    return immediateThreats.some(threat =>
      assessment.chiefComplaint.toLowerCase().includes(threat)
    );
  }

  private isHighRisk(assessment: TriageAssessment): boolean {
    const vitals = assessment.vitals;

    // Altered mental status
    if (vitals.glasgowComaScale && vitals.glasgowComaScale.total < 15) return true;

    // Severe pain (8-10)
    if (vitals.painScore && vitals.painScore >= 8) return true;

    // High-risk chief complaints
    const highRiskComplaints = [
      'chest pain', 'stroke symptoms', 'difficulty breathing',
      'suicidal', 'homicidal', 'overdose', 'major trauma',
      'severe allergic reaction', 'syncope', 'gi bleed'
    ];

    if (highRiskComplaints.some(complaint =>
      assessment.chiefComplaint.toLowerCase().includes(complaint)
    )) return true;

    // Immunocompromised with fever
    if (assessment.immunocompromised && vitals.temperature && vitals.temperature >= 38) {
      return true;
    }

    return false;
  }

  private estimateResourceNeeds(assessment: TriageAssessment): number {
    let resources = 0;

    const chiefComplaint = assessment.chiefComplaint.toLowerCase();

    // Labs needed
    if (['pain', 'fever', 'infection', 'weakness', 'dizziness'].some(s => chiefComplaint.includes(s))) {
      resources++;
    }

    // Imaging needed
    if (['pain', 'injury', 'fall', 'trauma', 'headache', 'chest'].some(s => chiefComplaint.includes(s))) {
      resources++;
    }

    // IV/medications
    if (['pain', 'nausea', 'dehydration', 'fever'].some(s => chiefComplaint.includes(s))) {
      resources++;
    }

    // Procedure likely
    if (['laceration', 'abscess', 'fracture', 'dislocation'].some(s => chiefComplaint.includes(s))) {
      resources++;
    }

    return resources;
  }

  private assessVitalSigns(vitals: EDVitals): number {
    let score = 0;

    // Heart rate
    if (vitals.heartRate) {
      if (vitals.heartRate < 50 || vitals.heartRate > 120) score += 10;
      if (vitals.heartRate < 40 || vitals.heartRate > 150) score += 20;
    }

    // Blood pressure
    if (vitals.bloodPressureSystolic) {
      if (vitals.bloodPressureSystolic < 90 || vitals.bloodPressureSystolic > 180) score += 10;
      if (vitals.bloodPressureSystolic < 80 || vitals.bloodPressureSystolic > 200) score += 20;
    }

    // Respiratory rate
    if (vitals.respiratoryRate) {
      if (vitals.respiratoryRate < 10 || vitals.respiratoryRate > 24) score += 10;
      if (vitals.respiratoryRate < 8 || vitals.respiratoryRate > 30) score += 20;
    }

    // Oxygen saturation
    if (vitals.oxygenSaturation) {
      if (vitals.oxygenSaturation < 94) score += 10;
      if (vitals.oxygenSaturation < 90) score += 20;
    }

    // Temperature
    if (vitals.temperature) {
      if (vitals.temperature < 36 || vitals.temperature > 38.5) score += 5;
      if (vitals.temperature < 35 || vitals.temperature > 40) score += 15;
    }

    return score;
  }

  private async checkSpecialProtocols(
    patient: EDPatient,
    assessment: TriageAssessment
  ): Promise<EDAlert[]> {
    const alerts: EDAlert[] = [];
    const complaint = assessment.chiefComplaint.toLowerCase();

    // Stroke Protocol
    if (complaint.includes('stroke') || complaint.includes('weakness') ||
        complaint.includes('speech') || complaint.includes('facial droop')) {
      patient.isStroke = true;
      alerts.push({
        id: crypto.randomUUID(),
        type: 'stroke_alert',
        severity: 'critical',
        message: 'STROKE ALERT: Activate stroke protocol',
        triggeredAt: new Date(),
        autoResolved: false
      });
    }

    // STEMI Protocol
    if (complaint.includes('chest pain') || complaint.includes('cardiac')) {
      // Would check ECG results
      alerts.push({
        id: crypto.randomUUID(),
        type: 'stemi_alert',
        severity: 'warning',
        message: 'Chest pain: Obtain ECG within 10 minutes',
        triggeredAt: new Date(),
        autoResolved: false
      });
    }

    // Sepsis Screening
    const sepsisScreen = await this.screenForSepsis(patient, assessment);
    if (sepsisScreen.sepsisLikely) {
      patient.isSepsis = true;
      alerts.push({
        id: crypto.randomUUID(),
        type: 'sepsis_alert',
        severity: 'critical',
        message: 'SEPSIS ALERT: Initiate sepsis bundle',
        triggeredAt: new Date(),
        autoResolved: false
      });
    }

    return alerts;
  }

  // ==================== SPECIAL PROTOCOLS ====================

  async activateStrokeCode(
    visitId: string,
    lastKnownWell: Date,
    symptoms: string[]
  ): Promise<{ patient: EDPatient; strokeCode: StrokeCode }> {
    const patient = await this.getEDPatientByVisit(visitId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const strokeCode: StrokeCode = {
      type: 'unknown',
      lastKnownWell,
      ctCompleted: false,
      tpaEligible: false,
      tpaAdministered: false,
      thrombectomyCandidate: false
    };

    patient.isStroke = true;
    patient.strokeCode = strokeCode;
    patient.triageLevel = 1;
    patient.status = 'in_treatment';

    // Add stroke alert
    patient.alerts.push({
      id: crypto.randomUUID(),
      type: 'stroke_alert',
      severity: 'critical',
      message: 'CODE STROKE ACTIVATED',
      triggeredAt: new Date(),
      autoResolved: false
    });

    // Notify stroke team
    await this.notifyStrokeTeam(patient, strokeCode);

    await this.updateEDPatient(patient);
    return { patient, strokeCode };
  }

  async activateTraumaTeam(
    patient: EDPatient,
    level: TraumaLevel,
    mechanism?: string
  ): Promise<TraumaActivation> {
    const activation: TraumaActivation = {
      id: crypto.randomUUID(),
      level,
      activatedAt: new Date(),
      activatedBy: 'system',
      mechanism: mechanism || 'Unknown',
      teamNotified: [],
      traumaBay: await this.assignTraumaBay(),
      status: 'pending',
      patientId: patient.patientId,
      visitId: patient.visitId
    };

    // Get trauma team members based on level
    const teamRoles = this.getTraumaTeamRoles(level);
    for (const role of teamRoles) {
      activation.teamNotified.push({
        role,
        notifiedAt: new Date()
      });
      // Send notifications
      await this.notifyTeamMember(role, activation);
    }

    patient.isTrauma = true;
    patient.traumaLevel = level;
    patient.triageLevel = level === 'alpha' ? 1 : 2;
    patient.location = {
      zone: 'trauma',
      bed: activation.traumaBay,
      type: 'trauma_bay',
      assignedAt: new Date()
    };

    await this.updateEDPatient(patient);
    return activation;
  }

  async screenForSepsis(
    patient: EDPatient,
    assessment: TriageAssessment
  ): Promise<SepsisScreening> {
    const vitals = assessment.vitals;

    // SIRS Criteria
    const sirsCriteria = {
      temperature: vitals.temperature ? (vitals.temperature > 38 || vitals.temperature < 36) : false,
      heartRate: vitals.heartRate ? vitals.heartRate > 90 : false,
      respiratoryRate: vitals.respiratoryRate ? vitals.respiratoryRate > 20 : false,
      wbc: false // Would need lab results
    };

    const sirsCount = Object.values(sirsCriteria).filter(Boolean).length;

    // qSOFA
    const qsofaCriteria = {
      respiratoryRate: vitals.respiratoryRate ? vitals.respiratoryRate >= 22 : false,
      alteredMentation: vitals.glasgowComaScale ? vitals.glasgowComaScale.total < 15 : false,
      systolicBP: vitals.bloodPressureSystolic ? vitals.bloodPressureSystolic <= 100 : false
    };

    const qsofaScore = Object.values(qsofaCriteria).filter(Boolean).length;

    // Check for suspected infection
    const infectionKeywords = ['fever', 'infection', 'uti', 'pneumonia', 'cellulitis', 'sepsis'];
    const suspectedInfection = infectionKeywords.some(k =>
      assessment.chiefComplaint.toLowerCase().includes(k)
    );

    const screening: SepsisScreening = {
      patientId: patient.patientId,
      visitId: patient.visitId,
      screenedBy: assessment.assessedBy,
      screenedAt: new Date(),
      sirsPositive: sirsCount >= 2,
      sirsCriteria,
      qsofaScore,
      qsofaCriteria,
      suspectedInfection,
      sepsisLikely: (sirsCount >= 2 || qsofaScore >= 2) && suspectedInfection,
      septicShock: false,
      bundleInitiated: false,
      bundleItems: []
    };

    if (screening.sepsisLikely) {
      // Create sepsis bundle items
      const now = new Date();
      screening.bundleItems = [
        {
          item: 'Lactate level',
          dueTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
          status: 'pending'
        },
        {
          item: 'Blood cultures before antibiotics',
          dueTime: new Date(now.getTime() + 60 * 60 * 1000),
          status: 'pending'
        },
        {
          item: 'Broad-spectrum antibiotics',
          dueTime: new Date(now.getTime() + 60 * 60 * 1000),
          status: 'pending'
        },
        {
          item: 'IV fluid resuscitation (30 mL/kg)',
          dueTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours
          status: 'pending'
        }
      ];
    }

    return screening;
  }

  // ==================== BED MANAGEMENT ====================

  async assignBed(
    visitId: string,
    location: EDLocation,
    assignedBy: string
  ): Promise<EDPatient> {
    const patient = await this.getEDPatientByVisit(visitId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    patient.location = {
      ...location,
      assignedAt: new Date()
    };

    if (patient.status === 'waiting_bed') {
      patient.status = 'in_treatment';
    }

    patient.updatedAt = new Date();
    await this.updateEDPatient(patient);

    // Log bed assignment
    await this.logEDEvent(visitId, 'bed_assigned', assignedBy, { location });

    return patient;
  }

  async getAvailableBeds(): Promise<{
    zone: string;
    beds: { bed: string; type: string; available: boolean; patient?: string }[];
  }[]> {
    // Fetch bed availability from database
    return [];
  }

  private async recommendLocation(patient: EDPatient): Promise<EDLocation> {
    // Based on triage level and patient needs
    let zone = 'main';
    let type: EDLocation['type'] = 'bed';

    if (patient.triageLevel === 1) {
      zone = 'resuscitation';
      type = 'resuscitation';
    } else if (patient.isTrauma) {
      zone = 'trauma';
      type = 'trauma_bay';
    } else if (patient.triageLevel === 2) {
      zone = 'acute';
      type = 'bed';
    } else if (patient.isPsychiatric) {
      zone = 'behavioral';
      type = 'bed';
    } else if (patient.triageLevel >= 4) {
      zone = 'fast_track';
      type = 'chair';
    }

    // Find available bed in recommended zone
    const availableBed = await this.findAvailableBed(zone, type);

    return {
      zone,
      bed: availableBed || 'waiting',
      type,
      assignedAt: new Date()
    };
  }

  // ==================== ORDERS AND RESULTS ====================

  async placeOrder(
    visitId: string,
    order: Omit<EDOrder, 'id' | 'status' | 'orderedAt'>
  ): Promise<EDOrder> {
    const patient = await this.getEDPatientByVisit(visitId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const newOrder: EDOrder = {
      ...order,
      id: crypto.randomUUID(),
      orderedAt: new Date(),
      status: 'pending'
    };

    patient.orders.push(newOrder);
    patient.updatedAt = new Date();

    await this.updateEDPatient(patient);

    // Route order to appropriate department
    await this.routeOrder(newOrder);

    return newOrder;
  }

  async updateOrderResult(
    visitId: string,
    orderId: string,
    results: string,
    completedBy: string
  ): Promise<EDOrder> {
    const patient = await this.getEDPatientByVisit(visitId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const order = patient.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.results = results;
    order.status = 'completed';
    order.completedAt = new Date();
    order.completedBy = completedBy;

    // Check for critical results
    if (this.isCriticalResult(order.type, results)) {
      patient.alerts.push({
        id: crypto.randomUUID(),
        type: 'critical_result',
        severity: 'critical',
        message: `Critical ${order.type} result requires immediate attention`,
        triggeredAt: new Date(),
        autoResolved: false
      });

      // Notify physician
      if (patient.assignedPhysicianId) {
        await this.notifyCriticalResult(patient.assignedPhysicianId, order);
      }
    }

    patient.updatedAt = new Date();
    await this.updateEDPatient(patient);

    return order;
  }

  // ==================== DISPOSITION ====================

  async setDisposition(
    visitId: string,
    disposition: EDDisposition
  ): Promise<EDPatient> {
    const patient = await this.getEDPatientByVisit(visitId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    patient.disposition = disposition;
    patient.status = this.getStatusFromDisposition(disposition.type);
    patient.updatedAt = new Date();

    if (disposition.type === 'admit_inpatient' || disposition.type === 'admit_observation') {
      // Create admission request
      await this.createAdmissionRequest(patient, disposition);
    }

    if (disposition.type === 'transfer') {
      // Initiate transfer process
      await this.initiateTransfer(patient, disposition);
    }

    await this.updateEDPatient(patient);
    return patient;
  }

  async dischargePatient(
    visitId: string,
    dischargedBy: string,
    instructions: string,
    followUp: FollowUpInstruction[]
  ): Promise<EDPatient> {
    const patient = await this.getEDPatientByVisit(visitId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    patient.status = 'discharged';
    patient.actualDischargeTime = new Date();
    patient.lengthOfStay = Math.round(
      (patient.actualDischargeTime.getTime() - patient.arrivalTime.getTime()) / 60000
    );

    if (!patient.disposition) {
      patient.disposition = {
        type: 'discharge_home',
        decidedBy: dischargedBy,
        decidedAt: new Date(),
        dischargeInstructions: instructions,
        followUp
      };
    }

    patient.updatedAt = new Date();
    await this.updateEDPatient(patient);

    // Send discharge instructions to patient portal
    await this.sendDischargeInstructions(patient);

    return patient;
  }

  // ==================== METRICS AND DASHBOARD ====================

  async getEDMetrics(): Promise<EDMetrics> {
    const patients = await this.getAllActiveEDPatients();
    const now = new Date();

    const waiting = patients.filter(p =>
      ['arrived', 'waiting_triage', 'triaged', 'waiting_bed'].includes(p.status)
    );

    const inTreatment = patients.filter(p =>
      ['in_treatment', 'awaiting_results', 'awaiting_consult'].includes(p.status)
    );

    const boarding = patients.filter(p =>
      ['awaiting_admission'].includes(p.status)
    );

    // Calculate wait times
    const waitTimes = waiting.map(p =>
      Math.round((now.getTime() - p.arrivalTime.getTime()) / 60000)
    );

    const avgWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0;

    // Triage breakdown
    const triageLevelBreakdown: Record<TriageLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const p of patients) {
      triageLevelBreakdown[p.triageLevel]++;
    }

    return {
      timestamp: now,
      currentCensus: patients.length,
      waitingCount: waiting.length,
      inTreatmentCount: inTreatment.length,
      boardingCount: boarding.length,
      averageWaitTime: avgWaitTime,
      averageDoorToProvider: 0, // Calculate from doorToProvider times
      averageLengthOfStay: 0,
      lwbsRate: 0,
      leftAmaCount: 0,
      admissionRate: 0,
      bedOccupancy: 0,
      triageLevelBreakdown,
      acuityByZone: {},
      pendingAdmissions: boarding.length,
      criticalPatients: patients.filter(p => p.triageLevel <= 2).length,
      ambulanceDiversion: false
    };
  }

  async getPatientTrackingBoard(): Promise<{
    zones: {
      name: string;
      patients: {
        visitId: string;
        name: string;
        bed: string;
        triageLevel: TriageLevel;
        status: EDStatus;
        waitTime: number;
        physician?: string;
        nurse?: string;
        alerts: number;
      }[];
    }[];
  }> {
    const patients = await this.getAllActiveEDPatients();
    const zones: Map<string, any[]> = new Map();

    for (const p of patients) {
      const zone = p.location?.zone || 'waiting';
      if (!zones.has(zone)) {
        zones.set(zone, []);
      }

      zones.get(zone)!.push({
        visitId: p.visitId,
        name: 'Patient Name', // Would fetch from patient record
        bed: p.location?.bed || '-',
        triageLevel: p.triageLevel,
        status: p.status,
        waitTime: Math.round((new Date().getTime() - p.arrivalTime.getTime()) / 60000),
        physician: p.assignedPhysicianId,
        nurse: p.assignedNurseId,
        alerts: p.alerts.filter(a => !a.acknowledgedAt).length
      });
    }

    return {
      zones: Array.from(zones.entries()).map(([name, patients]) => ({
        name,
        patients
      }))
    };
  }

  // ==================== HELPER METHODS ====================

  private getTraumaTeamRoles(level: TraumaLevel): string[] {
    const baseRoles = ['trauma_surgeon', 'emergency_physician', 'trauma_nurse', 'respiratory_therapist'];

    if (level === 'alpha') {
      return [...baseRoles, 'anesthesiologist', 'neurosurgeon', 'orthopedic_surgeon', 'radiologist'];
    } else if (level === 'bravo') {
      return [...baseRoles, 'anesthesiologist'];
    }

    return ['emergency_physician', 'trauma_nurse'];
  }

  private getStatusFromDisposition(type: DispositionType): EDStatus {
    switch (type) {
      case 'discharge_home':
      case 'discharge_with_services':
        return 'awaiting_discharge';
      case 'admit_inpatient':
      case 'admit_observation':
      case 'admit_icu':
        return 'awaiting_admission';
      case 'transfer':
        return 'awaiting_discharge';
      case 'ama':
        return 'left_against_medical_advice';
      case 'lwbs':
        return 'left_without_being_seen';
      case 'deceased':
        return 'deceased';
      default:
        return 'awaiting_discharge';
    }
  }

  private isCriticalResult(orderType: OrderType, results: string): boolean {
    // Define critical value thresholds
    const criticalPatterns = [
      /troponin.*positive/i,
      /potassium.*(>6|<2\.5)/i,
      /glucose.*(>500|<40)/i,
      /hemoglobin.*<7/i,
      /platelet.*<50/i,
      /inr.*>5/i,
      /lactate.*>4/i
    ];

    return criticalPatterns.some(pattern => pattern.test(results));
  }

  // Database stubs
  private async saveEDPatient(patient: EDPatient): Promise<void> {}
  private async updateEDPatient(patient: EDPatient): Promise<void> {}
  private async getEDPatientByVisit(visitId: string): Promise<EDPatient | null> { return null; }
  private async getAllActiveEDPatients(): Promise<EDPatient[]> { return []; }
  private async logEDEvent(visitId: string, event: string, userId: string, data: any): Promise<void> {}
  private async notifyStrokeTeam(patient: EDPatient, strokeCode: StrokeCode): Promise<void> {}
  private async notifyTeamMember(role: string, activation: TraumaActivation): Promise<void> {}
  private async assignTraumaBay(): Promise<string> { return 'TB1'; }
  private async findAvailableBed(zone: string, type: string): Promise<string | null> { return null; }
  private async routeOrder(order: EDOrder): Promise<void> {}
  private async notifyCriticalResult(physicianId: string, order: EDOrder): Promise<void> {}
  private async createAdmissionRequest(patient: EDPatient, disposition: EDDisposition): Promise<void> {}
  private async initiateTransfer(patient: EDPatient, disposition: EDDisposition): Promise<void> {}
  private async sendDischargeInstructions(patient: EDPatient): Promise<void> {}
}

export default EmergencyDepartmentService;
