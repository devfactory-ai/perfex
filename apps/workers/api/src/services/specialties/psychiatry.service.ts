/**
 * Psychiatry / Mental Health Service
 *
 * Fonctionnalités:
 * - Évaluations psychiatriques (PHQ-9, GAD-7, etc.)
 * - Suivi thérapies
 * - Gestion médicaments psychotropes
 * - Plans de traitement
 * - Gestion de crise
 * - Téléconsultation psychiatrique
 */

export interface PsychiatryPatient {
  id: string;
  patientId: string;
  diagnoses: PsychiatricDiagnosis[];
  riskAssessments: RiskAssessment[];
  assessments: PsychiatricAssessment[];
  treatmentPlan?: MentalHealthTreatmentPlan;
  medications: PsychotropicMedication[];
  therapySessions: TherapySession[];
  crisisInterventions: CrisisIntervention[];
  hospitalizations: PsychiatricHospitalization[];
  substanceUseHistory?: SubstanceUseHistory;
  traumaHistory?: TraumaHistory;
  legalStatus?: LegalStatus;
  safetyPlan?: SafetyPlan;
  advanceDirective?: PsychiatricAdvanceDirective;
  primaryPsychiatristId?: string;
  primaryTherapistId?: string;
  caseManagerId?: string;
  status: 'active' | 'stable' | 'crisis' | 'inpatient' | 'discharged';
  createdAt: Date;
  updatedAt: Date;
}

export interface PsychiatricDiagnosis {
  id: string;
  icdCode: string;
  dsmCode?: string;
  diagnosis: string;
  severity: 'mild' | 'moderate' | 'severe' | 'in_remission' | 'partial_remission';
  specifiers?: string[];
  diagnosisDate: Date;
  diagnosedBy: string;
  isPrimary: boolean;
  status: 'active' | 'resolved' | 'rule_out';
}

export interface RiskAssessment {
  id: string;
  date: Date;
  assessedBy: string;
  suicideRisk: RiskLevel;
  suicideFactors: string[];
  homicideRisk: RiskLevel;
  homicideFactors: string[];
  selfHarmRisk: RiskLevel;
  violenceRisk: RiskLevel;
  elopementRisk: RiskLevel;
  fallRisk: RiskLevel;
  currentIdeation: boolean;
  ideationType?: 'passive' | 'active_without_plan' | 'active_with_plan' | 'active_with_intent';
  previousAttempts: PreviousAttempt[];
  protectiveFactors: string[];
  riskFactors: string[];
  overallRiskLevel: RiskLevel;
  recommendedLevel: 'outpatient' | 'intensive_outpatient' | 'partial_hospitalization' | 'inpatient' | 'emergency';
  safetyPlanRequired: boolean;
  hospitalizeRecommended: boolean;
  clinicalNotes: string;
}

export type RiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'imminent';

export interface PreviousAttempt {
  date: Date;
  method: string;
  lethality: 'low' | 'moderate' | 'high';
  outcome: string;
  hospitalizedAfter: boolean;
}

// Standardized Assessments
export interface PsychiatricAssessment {
  id: string;
  type: AssessmentType;
  date: Date;
  administeredBy: string;
  scores: Record<string, number>;
  totalScore: number;
  interpretation: string;
  severity?: string;
  responses?: AssessmentResponse[];
  clinicalNotes?: string;
  followUpRecommended: boolean;
  nextAssessmentDate?: Date;
}

export type AssessmentType =
  | 'PHQ-9' | 'PHQ-2' | 'GAD-7' | 'GAD-2'
  | 'AUDIT' | 'AUDIT-C' | 'DAST-10'
  | 'PCL-5' | 'MDQ' | 'ASRS' | 'Y-BOCS'
  | 'MMSE' | 'MoCA' | 'CGI' | 'HAM-D' | 'HAM-A'
  | 'PANSS' | 'BPRS' | 'MADRS' | 'AIMS'
  | 'Columbia_Suicide' | 'Beck_Depression' | 'Beck_Anxiety'
  | 'ACE' | 'PSS' | 'PHQ-15' | 'CSSRS' | 'Custom';

export interface AssessmentResponse {
  questionNumber: number;
  questionText: string;
  response: number | string;
  maxScore?: number;
}

export interface PHQ9Assessment extends PsychiatricAssessment {
  type: 'PHQ-9';
  q1LittleInterest: number;
  q2FeelingDown: number;
  q3SleepProblems: number;
  q4LittleEnergy: number;
  q5AppetiteChanges: number;
  q6FeelingBad: number;
  q7TroubleConcentrating: number;
  q8MovingSlowly: number;
  q9ThoughtsOfDeath: number;
  functionalDifficulty: 'not_difficult' | 'somewhat' | 'very' | 'extremely';
}

export interface GAD7Assessment extends PsychiatricAssessment {
  type: 'GAD-7';
  q1Nervous: number;
  q2CantStopWorrying: number;
  q3WorryingTooMuch: number;
  q4TroubleRelaxing: number;
  q5Restless: number;
  q6EasilyAnnoyed: number;
  q7FeelAfraid: number;
}

// Treatment Plan
export interface MentalHealthTreatmentPlan {
  id: string;
  createdDate: Date;
  reviewDate: Date;
  goals: TreatmentGoal[];
  interventions: Intervention[];
  medicationPlan?: MedicationPlan;
  therapyModality: TherapyModality[];
  frequency: string;
  crisisContactPlan: string;
  participantsInPlan: string[];
  patientSignature?: boolean;
  signedDate?: Date;
  status: 'draft' | 'active' | 'completed' | 'revised';
}

export interface TreatmentGoal {
  id: string;
  domain: 'symptom_reduction' | 'functioning' | 'safety' | 'coping' | 'relationship' | 'other';
  shortTerm: boolean;
  description: string;
  measurableObjective: string;
  targetDate: Date;
  progress: 'not_started' | 'in_progress' | 'achieved' | 'partially_achieved' | 'not_achieved';
  progressNotes?: string[];
}

export interface Intervention {
  type: string;
  description: string;
  frequency: string;
  responsibleParty: string;
  startDate: Date;
  endDate?: Date;
}

export type TherapyModality =
  | 'CBT' | 'DBT' | 'ACT' | 'EMDR' | 'IPT'
  | 'Psychodynamic' | 'Supportive' | 'Family'
  | 'Group' | 'Art' | 'Music' | 'Play'
  | 'Exposure' | 'MI' | 'Solution_Focused';

// Medications
export interface PsychotropicMedication {
  id: string;
  medicationId: string;
  medicationName: string;
  class: MedicationClass;
  dose: number;
  doseUnit: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  targetSymptoms: string[];
  sideEffects: SideEffect[];
  blackBoxWarning: boolean;
  controlledSubstance: boolean;
  schedule?: string;
  priorAuthRequired: boolean;
  clozapineMonitoring?: ClozapineMonitoring;
  lithiumMonitoring?: LithiumMonitoring;
  status: 'active' | 'discontinued' | 'on_hold';
  discontinuationReason?: string;
  adherenceIssues?: string[];
}

export type MedicationClass =
  | 'SSRI' | 'SNRI' | 'TCA' | 'MAOI' | 'Atypical_Antidepressant'
  | 'First_Gen_Antipsychotic' | 'Second_Gen_Antipsychotic'
  | 'Mood_Stabilizer' | 'Benzodiazepine' | 'Non_Benzo_Anxiolytic'
  | 'Stimulant' | 'Non_Stimulant_ADHD' | 'Hypnotic'
  | 'Anticholinergic' | 'Other';

export interface SideEffect {
  effect: string;
  severity: 'mild' | 'moderate' | 'severe';
  onset: Date;
  managedBy?: string;
  resolved: boolean;
}

export interface MedicationPlan {
  currentMedications: string[];
  plannedChanges: {
    medication: string;
    action: 'start' | 'increase' | 'decrease' | 'discontinue' | 'switch';
    timeline: string;
    rationale: string;
  }[];
  monitoringRequired: string[];
}

export interface ClozapineMonitoring {
  registryEnrolled: boolean;
  registryNumber: string;
  ancHistory: { date: Date; value: number; status: 'green' | 'yellow' | 'red' }[];
  currentMonitoringFrequency: 'weekly' | 'biweekly' | 'monthly';
  dispensable: boolean;
}

export interface LithiumMonitoring {
  levels: { date: Date; value: number; inRange: boolean }[];
  renalFunction: { date: Date; creatinine: number; bun: number }[];
  thyroidFunction: { date: Date; tsh: number }[];
  lastEKG?: Date;
}

// Therapy Sessions
export interface TherapySession {
  id: string;
  date: Date;
  duration: number;
  type: 'individual' | 'group' | 'family' | 'couples';
  modality: TherapyModality;
  therapistId: string;
  attendees?: string[];
  format: 'in_person' | 'telehealth_video' | 'telehealth_phone';
  sessionNumber: number;
  presentingIssues: string[];
  interventionsUsed: string[];
  patientResponse: string;
  homework?: string;
  progressTowardGoals: string;
  mentalStatusExam?: MentalStatusExam;
  riskAssessment?: {
    suicidalIdeation: boolean;
    homicidalIdeation: boolean;
    assessed: boolean;
    notes: string;
  };
  nextSessionPlan: string;
  clinicalNote: string;
  signedBy: string;
  signedAt: Date;
  cosigned?: { by: string; at: Date };
}

export interface MentalStatusExam {
  appearance: string;
  behavior: string;
  speech: string;
  mood: string;
  affect: string;
  thoughtProcess: string;
  thoughtContent: string;
  perceptions: string;
  cognition: string;
  insight: string;
  judgment: string;
}

// Crisis Management
export interface CrisisIntervention {
  id: string;
  date: Date;
  type: 'phone' | 'in_person' | 'mobile_team' | 'er_visit';
  precipitant: string;
  presentation: string;
  riskLevel: RiskLevel;
  interventions: string[];
  outcome: 'resolved' | 'hospitalized' | 'referred' | 'ongoing';
  disposition: string;
  followUpPlan: string;
  responderId: string;
  duration: number;
  policeInvolved: boolean;
  ambulanceUsed: boolean;
}

export interface SafetyPlan {
  id: string;
  createdDate: Date;
  lastReviewed: Date;
  warningSignsTriggers: string[];
  copingStrategies: string[];
  distractionTechniques: string[];
  socialSupports: { name: string; phone: string; relationship: string }[];
  professionalContacts: { name: string; phone: string; role: string }[];
  emergencyContacts: { name: string; phone: string }[];
  crisisHotlines: string[];
  environmentSafety: {
    meansRestriction: string[];
    safetyMeasures: string[];
  };
  reasonsForLiving: string[];
  patientCommitment: string;
  patientSignature: boolean;
  clinicianSignature: string;
}

// Hospitalization
export interface PsychiatricHospitalization {
  id: string;
  admissionDate: Date;
  dischargeDate?: Date;
  facilityName: string;
  facilityType: 'psychiatric_hospital' | 'general_hospital_psych_unit' | 'crisis_stabilization' | 'residential';
  admissionType: 'voluntary' | 'involuntary' | 'emergency';
  legalStatus: LegalStatus;
  admissionReason: string;
  diagnosesAtAdmission: string[];
  diagnosesAtDischarge?: string[];
  treatmentReceived: string[];
  medicationChanges: string[];
  dischargeDisposition?: string;
  dischargePlan?: string;
  followUpAppointments?: { provider: string; date: Date }[];
  lengthOfStay?: number;
}

export interface LegalStatus {
  status: 'voluntary' | 'involuntary_evaluation' | 'involuntary_treatment' | 'conservatorship' | 'outpatient_commitment';
  startDate: Date;
  endDate?: Date;
  courtOrderNumber?: string;
  reviewDate?: Date;
  conditions?: string[];
}

// Substance Use
export interface SubstanceUseHistory {
  hasHistory: boolean;
  substances: SubstanceUse[];
  treatmentHistory: SubstanceTreatment[];
  currentlyInRecovery: boolean;
  sobrietyDate?: Date;
  attendingSupport: boolean;
  supportType?: string[];
}

export interface SubstanceUse {
  substance: string;
  category: 'alcohol' | 'opioids' | 'stimulants' | 'cannabis' | 'benzodiazepines' | 'hallucinogens' | 'tobacco' | 'other';
  route?: string;
  frequency: string;
  amount?: string;
  ageOfFirstUse?: number;
  lastUse?: Date;
  withdrawalRisk: boolean;
  ivUse: boolean;
  status: 'active' | 'in_remission' | 'history';
}

export interface SubstanceTreatment {
  type: 'detox' | 'residential' | 'outpatient' | 'iop' | 'mat' | 'aa_na' | 'other';
  facilityName?: string;
  startDate: Date;
  endDate?: Date;
  completedSuccessfully: boolean;
  medicationsUsed?: string[];
}

// Trauma
export interface TraumaHistory {
  hasHistory: boolean;
  aceScore?: number;
  traumaTypes: TraumaType[];
  ptsdDiagnosis: boolean;
  traumaProcessed: boolean;
  traumaFocusedTherapy: boolean;
  triggers?: string[];
  groundingTechniques?: string[];
}

export interface TraumaType {
  type: 'childhood_abuse' | 'childhood_neglect' | 'domestic_violence' | 'sexual_assault' | 'combat' | 'accident' | 'medical' | 'witness_violence' | 'natural_disaster' | 'other';
  ageAtOccurrence?: string;
  singleOrRepeated: 'single' | 'repeated';
  perpetratorRelationship?: string;
  disclosed: boolean;
}

// Advance Directive
export interface PsychiatricAdvanceDirective {
  id: string;
  createdDate: Date;
  documentId?: string;
  preferences: {
    hospitalPreferences: string[];
    hospitalAvoidances: string[];
    medicationPreferences: string[];
    medicationRefusals: string[];
    treatmentPreferences: string[];
    treatmentRefusals: string[];
  };
  healthcareAgent?: {
    name: string;
    relationship: string;
    phone: string;
    alternateAgent?: { name: string; phone: string };
  };
  crisisPreferences?: string;
  electroconvulsiveTherapy: 'consent' | 'refuse' | 'conditional';
  restraints: 'consent' | 'refuse' | 'conditional';
  seclusion: 'consent' | 'refuse' | 'conditional';
  involuntaryMedication: 'consent' | 'refuse' | 'conditional';
  witnessedBy: string;
  notarized: boolean;
  status: 'active' | 'revoked';
}

export class PsychiatryService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async createPsychiatryPatient(
    patientId: string,
    diagnosis: PsychiatricDiagnosis
  ): Promise<PsychiatryPatient> {
    const patient: PsychiatryPatient = {
      id: crypto.randomUUID(),
      patientId,
      diagnoses: [diagnosis],
      riskAssessments: [],
      assessments: [],
      medications: [],
      therapySessions: [],
      crisisInterventions: [],
      hospitalizations: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.savePsychiatryPatient(patient);
    return patient;
  }

  async conductPHQ9(
    psychiatryPatientId: string,
    responses: Record<string, number>,
    administeredBy: string
  ): Promise<PHQ9Assessment> {
    const totalScore = Object.values(responses).reduce((a, b) => a + b, 0);
    let severity: string;
    let interpretation: string;

    if (totalScore <= 4) {
      severity = 'none_minimal';
      interpretation = 'No to minimal depression';
    } else if (totalScore <= 9) {
      severity = 'mild';
      interpretation = 'Mild depression - watchful waiting, repeat PHQ-9';
    } else if (totalScore <= 14) {
      severity = 'moderate';
      interpretation = 'Moderate depression - treatment plan indicated';
    } else if (totalScore <= 19) {
      severity = 'moderately_severe';
      interpretation = 'Moderately severe depression - active treatment indicated';
    } else {
      severity = 'severe';
      interpretation = 'Severe depression - immediate intervention recommended';
    }

    const assessment: PHQ9Assessment = {
      id: crypto.randomUUID(),
      type: 'PHQ-9',
      date: new Date(),
      administeredBy,
      scores: responses,
      totalScore,
      severity,
      interpretation,
      q1LittleInterest: responses.q1 || 0,
      q2FeelingDown: responses.q2 || 0,
      q3SleepProblems: responses.q3 || 0,
      q4LittleEnergy: responses.q4 || 0,
      q5AppetiteChanges: responses.q5 || 0,
      q6FeelingBad: responses.q6 || 0,
      q7TroubleConcentrating: responses.q7 || 0,
      q8MovingSlowly: responses.q8 || 0,
      q9ThoughtsOfDeath: responses.q9 || 0,
      functionalDifficulty: 'somewhat',
      followUpRecommended: totalScore >= 10
    };

    // Check item 9 for suicide screening
    if (responses.q9 >= 1) {
      await this.triggerSuicideScreening(psychiatryPatientId);
    }

    const patient = await this.getPsychiatryPatient(psychiatryPatientId);
    if (patient) {
      patient.assessments.push(assessment);
      patient.updatedAt = new Date();
      await this.updatePsychiatryPatient(patient);
    }

    return assessment;
  }

  async conductGAD7(
    psychiatryPatientId: string,
    responses: Record<string, number>,
    administeredBy: string
  ): Promise<GAD7Assessment> {
    const totalScore = Object.values(responses).reduce((a, b) => a + b, 0);
    let severity: string;
    let interpretation: string;

    if (totalScore <= 4) {
      severity = 'minimal';
      interpretation = 'Minimal anxiety';
    } else if (totalScore <= 9) {
      severity = 'mild';
      interpretation = 'Mild anxiety';
    } else if (totalScore <= 14) {
      severity = 'moderate';
      interpretation = 'Moderate anxiety - consider treatment';
    } else {
      severity = 'severe';
      interpretation = 'Severe anxiety - active treatment recommended';
    }

    const assessment: GAD7Assessment = {
      id: crypto.randomUUID(),
      type: 'GAD-7',
      date: new Date(),
      administeredBy,
      scores: responses,
      totalScore,
      severity,
      interpretation,
      q1Nervous: responses.q1 || 0,
      q2CantStopWorrying: responses.q2 || 0,
      q3WorryingTooMuch: responses.q3 || 0,
      q4TroubleRelaxing: responses.q4 || 0,
      q5Restless: responses.q5 || 0,
      q6EasilyAnnoyed: responses.q6 || 0,
      q7FeelAfraid: responses.q7 || 0,
      followUpRecommended: totalScore >= 10
    };

    const patient = await this.getPsychiatryPatient(psychiatryPatientId);
    if (patient) {
      patient.assessments.push(assessment);
      patient.updatedAt = new Date();
      await this.updatePsychiatryPatient(patient);
    }

    return assessment;
  }

  async conductRiskAssessment(
    psychiatryPatientId: string,
    assessment: Omit<RiskAssessment, 'id'>
  ): Promise<RiskAssessment> {
    const patient = await this.getPsychiatryPatient(psychiatryPatientId);
    if (!patient) throw new Error('Patient not found');

    const newAssessment: RiskAssessment = {
      ...assessment,
      id: crypto.randomUUID()
    };

    patient.riskAssessments.push(newAssessment);

    // Update patient status based on risk
    if (newAssessment.overallRiskLevel === 'imminent' || newAssessment.overallRiskLevel === 'high') {
      patient.status = 'crisis';
    }

    // Create safety plan if required
    if (newAssessment.safetyPlanRequired && !patient.safetyPlan) {
      await this.initiateSafetyPlan(psychiatryPatientId);
    }

    patient.updatedAt = new Date();
    await this.updatePsychiatryPatient(patient);

    // Alert care team for high risk
    if (['high', 'imminent'].includes(newAssessment.overallRiskLevel)) {
      await this.alertCareTeam(patient, newAssessment);
    }

    return newAssessment;
  }

  async createSafetyPlan(
    psychiatryPatientId: string,
    plan: Omit<SafetyPlan, 'id' | 'createdDate' | 'lastReviewed'>
  ): Promise<SafetyPlan> {
    const patient = await this.getPsychiatryPatient(psychiatryPatientId);
    if (!patient) throw new Error('Patient not found');

    const safetyPlan: SafetyPlan = {
      ...plan,
      id: crypto.randomUUID(),
      createdDate: new Date(),
      lastReviewed: new Date()
    };

    patient.safetyPlan = safetyPlan;
    patient.updatedAt = new Date();

    await this.updatePsychiatryPatient(patient);
    return safetyPlan;
  }

  async recordTherapySession(
    psychiatryPatientId: string,
    session: Omit<TherapySession, 'id' | 'signedAt'>
  ): Promise<TherapySession> {
    const patient = await this.getPsychiatryPatient(psychiatryPatientId);
    if (!patient) throw new Error('Patient not found');

    const newSession: TherapySession = {
      ...session,
      id: crypto.randomUUID(),
      signedAt: new Date()
    };

    patient.therapySessions.push(newSession);
    patient.updatedAt = new Date();

    await this.updatePsychiatryPatient(patient);
    return newSession;
  }

  async recordCrisisIntervention(
    psychiatryPatientId: string,
    intervention: Omit<CrisisIntervention, 'id'>
  ): Promise<CrisisIntervention> {
    const patient = await this.getPsychiatryPatient(psychiatryPatientId);
    if (!patient) throw new Error('Patient not found');

    const newIntervention: CrisisIntervention = {
      ...intervention,
      id: crypto.randomUUID()
    };

    patient.crisisInterventions.push(newIntervention);
    patient.status = 'crisis';
    patient.updatedAt = new Date();

    await this.updatePsychiatryPatient(patient);

    // Notify care team
    await this.notifyCrisisIntervention(patient, newIntervention);

    return newIntervention;
  }

  async prescribePsychotropic(
    psychiatryPatientId: string,
    medication: Omit<PsychotropicMedication, 'id' | 'status'>
  ): Promise<PsychotropicMedication> {
    const patient = await this.getPsychiatryPatient(psychiatryPatientId);
    if (!patient) throw new Error('Patient not found');

    // Check for contraindications
    const contraindications = await this.checkPsychotropicContraindications(
      patient,
      medication.medicationId
    );

    if (contraindications.length > 0) {
      throw new Error(`Contraindication: ${contraindications.join(', ')}`);
    }

    const newMedication: PsychotropicMedication = {
      ...medication,
      id: crypto.randomUUID(),
      status: 'active'
    };

    patient.medications.push(newMedication);
    patient.updatedAt = new Date();

    await this.updatePsychiatryPatient(patient);

    // Set up monitoring for special medications
    if (medication.medicationName.toLowerCase() === 'clozapine') {
      await this.initializeClozapineMonitoring(psychiatryPatientId, newMedication.id);
    }
    if (medication.medicationName.toLowerCase().includes('lithium')) {
      await this.initializeLithiumMonitoring(psychiatryPatientId, newMedication.id);
    }

    return newMedication;
  }

  async getAssessmentTrends(
    psychiatryPatientId: string,
    assessmentType: AssessmentType,
    months: number = 12
  ): Promise<{ date: Date; score: number }[]> {
    const patient = await this.getPsychiatryPatient(psychiatryPatientId);
    if (!patient) return [];

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    return patient.assessments
      .filter(a => a.type === assessmentType && a.date >= cutoff)
      .map(a => ({ date: a.date, score: a.totalScore }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Database stubs
  private async savePsychiatryPatient(patient: PsychiatryPatient): Promise<void> {}
  private async updatePsychiatryPatient(patient: PsychiatryPatient): Promise<void> {}
  private async getPsychiatryPatient(id: string): Promise<PsychiatryPatient | null> { return null; }
  private async triggerSuicideScreening(patientId: string): Promise<void> {}
  private async initiateSafetyPlan(patientId: string): Promise<void> {}
  private async alertCareTeam(patient: PsychiatryPatient, assessment: RiskAssessment): Promise<void> {}
  private async notifyCrisisIntervention(patient: PsychiatryPatient, intervention: CrisisIntervention): Promise<void> {}
  private async checkPsychotropicContraindications(patient: PsychiatryPatient, medicationId: string): Promise<string[]> { return []; }
  private async initializeClozapineMonitoring(patientId: string, medicationId: string): Promise<void> {}
  private async initializeLithiumMonitoring(patientId: string, medicationId: string): Promise<void> {}
}

export default PsychiatryService;
