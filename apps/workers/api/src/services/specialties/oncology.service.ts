/**
 * Oncology Service - Gestion Oncologique
 *
 * Fonctionnalités:
 * - Protocoles de chimiothérapie
 * - Tumor Board
 * - Staging TNM
 * - Suivi rémission
 * - Radiothérapie
 * - Immunothérapie
 */

export interface OncologyPatient {
  id: string;
  patientId: string;
  primaryDiagnosis: CancerDiagnosis;
  secondaryDiagnoses?: CancerDiagnosis[];
  stage: TNMStaging;
  histology: Histology;
  biomarkers: Biomarker[];
  geneticProfile?: GeneticProfile;
  performanceStatus: PerformanceStatus;
  treatmentPlan?: TreatmentPlan;
  chemotherapyCycles: ChemotherapyCycle[];
  radiotherapySessions: RadiotherapySession[];
  surgeries: OncologySurgery[];
  immunotherapySessions: ImmunotherapySession[];
  clinicalTrials?: ClinicalTrialEnrollment[];
  responseAssessments: ResponseAssessment[];
  survivorshipPlan?: SurvivorshipPlan;
  palliativeCare?: PalliativeCareRecord;
  tumorBoardReviews: TumorBoardReview[];
  status: OncologyStatus;
  dateOfDiagnosis: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CancerDiagnosis {
  icdCode: string;
  snomedCode?: string;
  cancerType: string;
  subtype?: string;
  site: string;
  laterality?: 'left' | 'right' | 'bilateral' | 'na';
  morphologyCode?: string;
  diagnosisDate: Date;
  diagnosisMethod: string;
  confirmedBy: string;
}

export interface TNMStaging {
  clinicalT: string;
  clinicalN: string;
  clinicalM: string;
  pathologicalT?: string;
  pathologicalN?: string;
  pathologicalM?: string;
  stage: string;
  stageGroup: string;
  stagingSystem: 'AJCC8' | 'AJCC7' | 'FIGO' | 'AnnArbor' | 'Other';
  stagingDate: Date;
  stagedBy: string;
  notes?: string;
}

export interface Histology {
  type: string;
  grade: 'G1' | 'G2' | 'G3' | 'G4' | 'GX';
  differentation: 'well' | 'moderate' | 'poor' | 'undifferentiated';
  specimenId: string;
  pathologyReport: string;
  reportDate: Date;
  pathologistId: string;
}

export interface Biomarker {
  name: string;
  result: string;
  value?: number;
  unit?: string;
  interpretation: 'positive' | 'negative' | 'equivocal' | 'not_tested';
  clinicalSignificance?: string;
  testedDate: Date;
  methodology: string;
}

export interface GeneticProfile {
  mutations: GeneticMutation[];
  msi: 'MSI-H' | 'MSS' | 'MSI-L' | 'unknown';
  tmb?: number;
  tmbUnit: 'mut/Mb';
  pdl1?: number;
  pdl1Assay?: string;
  hrd?: boolean;
  ngsPlatform?: string;
  reportDate: Date;
}

export interface GeneticMutation {
  gene: string;
  variant: string;
  variantType: 'missense' | 'nonsense' | 'frameshift' | 'splice' | 'amplification' | 'deletion' | 'fusion';
  pathogenicity: 'pathogenic' | 'likely_pathogenic' | 'vus' | 'benign' | 'likely_benign';
  actionable: boolean;
  therapyImplications?: string[];
}

export interface PerformanceStatus {
  ecog: 0 | 1 | 2 | 3 | 4;
  karnofsky?: number;
  assessedDate: Date;
  assessedBy: string;
}

export type OncologyStatus =
  | 'newly_diagnosed' | 'on_treatment' | 'surveillance'
  | 'remission' | 'progression' | 'recurrence'
  | 'palliative' | 'hospice' | 'deceased';

// Treatment Plan
export interface TreatmentPlan {
  id: string;
  intent: 'curative' | 'adjuvant' | 'neoadjuvant' | 'palliative' | 'definitive';
  modalities: TreatmentModality[];
  protocol?: ChemotherapyProtocol;
  startDate: Date;
  expectedEndDate?: Date;
  status: 'planned' | 'active' | 'completed' | 'suspended' | 'cancelled';
  approvedBy: string;
  approvedAt: Date;
  tumorBoardApproval?: string;
  clinicalTrialId?: string;
  notes?: string;
}

export type TreatmentModality =
  | 'surgery' | 'chemotherapy' | 'radiation' | 'immunotherapy'
  | 'targeted_therapy' | 'hormone_therapy' | 'stem_cell_transplant'
  | 'car_t' | 'watchful_waiting';

export interface ChemotherapyProtocol {
  id: string;
  name: string;
  regimen: string;
  drugs: ChemotherapyDrug[];
  cycleLength: number;
  cycleLengthUnit: 'days' | 'weeks';
  numberOfCycles: number;
  premedications: Premedication[];
  supportiveCare: SupportiveCare[];
  doseModifications: DoseModification[];
  monitoringRequirements: string[];
}

export interface ChemotherapyDrug {
  drugId: string;
  drugName: string;
  genericName: string;
  dose: number;
  doseUnit: string;
  doseBasis: 'mg/m2' | 'mg/kg' | 'AUC' | 'flat';
  route: 'IV' | 'PO' | 'SC' | 'IM' | 'IT';
  infusionDuration?: number;
  schedule: string; // e.g., "Day 1, 8, 15"
  maxLifetimeDose?: number;
  vesicant: boolean;
}

export interface Premedication {
  drugName: string;
  dose: string;
  route: string;
  timing: string;
}

export interface SupportiveCare {
  type: 'antiemetic' | 'growth_factor' | 'hydration' | 'other';
  medication: string;
  dose: string;
  schedule: string;
}

export interface DoseModification {
  toxicity: string;
  grade: number;
  modification: string;
  newDose?: number;
}

// Chemotherapy Cycle
export interface ChemotherapyCycle {
  id: string;
  cycleNumber: number;
  protocolId: string;
  startDate: Date;
  endDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  drugs: CycleAdministration[];
  labsPreTreatment: LabResult[];
  vitalsPreTreatment: VitalsRecord;
  toxicities: ToxicityAssessment[];
  doseModifications: AppliedDoseModification[];
  nursingNotes?: string;
  physicianNotes?: string;
  nextCycleDate?: Date;
}

export interface CycleAdministration {
  drugId: string;
  drugName: string;
  plannedDose: number;
  actualDose: number;
  doseUnit: string;
  percentOfPlanned: number;
  route: string;
  startTime: Date;
  endTime?: Date;
  infusionReaction: boolean;
  reactionDetails?: string;
  administeredBy: string;
  verifiedBy: string;
}

export interface LabResult {
  test: string;
  value: number;
  unit: string;
  referenceRange: string;
  abnormal: boolean;
  critical: boolean;
}

export interface VitalsRecord {
  bp: string;
  hr: number;
  temp: number;
  weight: number;
  height: number;
  bsa: number;
}

export interface ToxicityAssessment {
  toxicity: string;
  category: string;
  grade: 1 | 2 | 3 | 4 | 5;
  ctcaeCode: string;
  onsetDate: Date;
  resolvedDate?: Date;
  attribution: 'definite' | 'probable' | 'possible' | 'unlikely' | 'unrelated';
  intervention?: string;
  outcome?: string;
}

export interface AppliedDoseModification {
  drugId: string;
  reason: string;
  originalDose: number;
  modifiedDose: number;
  percentReduction: number;
  approvedBy: string;
}

// Radiotherapy
export interface RadiotherapySession {
  id: string;
  courseId: string;
  fractionNumber: number;
  totalFractions: number;
  date: Date;
  site: string;
  technique: 'IMRT' | 'VMAT' | '3D-CRT' | 'SRS' | 'SBRT' | 'Proton' | 'Brachytherapy';
  prescribedDose: number;
  deliveredDose: number;
  doseUnit: 'Gy' | 'cGy';
  machineId: string;
  therapistId: string;
  physicistId?: string;
  imagingUsed: string[];
  skinReaction?: number;
  otherToxicities?: ToxicityAssessment[];
  notes?: string;
}

// Surgery
export interface OncologySurgery {
  id: string;
  surgicalCaseId: string;
  procedureType: string;
  intent: 'curative' | 'palliative' | 'diagnostic' | 'staging';
  margins: 'R0' | 'R1' | 'R2' | 'RX';
  lymphNodesExamined?: number;
  lymphNodesPositive?: number;
  pathologyFinal?: string;
  complications?: string[];
  date: Date;
  surgeonId: string;
}

// Immunotherapy
export interface ImmunotherapySession {
  id: string;
  drug: string;
  drugClass: 'PD1_inhibitor' | 'PDL1_inhibitor' | 'CTLA4_inhibitor' | 'CAR_T' | 'BiTE' | 'vaccine' | 'other';
  cycleNumber: number;
  dose: number;
  doseUnit: string;
  date: Date;
  infusionDuration: number;
  irAEs?: ImmuneRelatedAE[];
  response?: string;
  administeredBy: string;
}

export interface ImmuneRelatedAE {
  organ: string;
  grade: 1 | 2 | 3 | 4 | 5;
  description: string;
  treatment: string;
  corticosteroidDose?: string;
  resolved: boolean;
  permanentDiscontinuation: boolean;
}

// Response Assessment
export interface ResponseAssessment {
  id: string;
  date: Date;
  assessmentType: 'imaging' | 'clinical' | 'biomarker' | 'combined';
  criteria: 'RECIST' | 'PERCIST' | 'iRECIST' | 'Cheson' | 'Lugano' | 'RANO' | 'clinical';
  response: 'CR' | 'PR' | 'SD' | 'PD' | 'NE';
  targetLesions?: LesionMeasurement[];
  nonTargetLesions?: string;
  newLesions: boolean;
  newLesionSites?: string[];
  overallAssessment: string;
  assessedBy: string;
  imagingStudyId?: string;
  biomarkerChange?: {
    marker: string;
    baseline: number;
    current: number;
    percentChange: number;
  };
}

export interface LesionMeasurement {
  site: string;
  baseline: number;
  current: number;
  percentChange: number;
  bestResponse?: number;
}

// Tumor Board
export interface TumorBoardReview {
  id: string;
  date: Date;
  boardType: 'multidisciplinary' | 'disease_specific';
  attendees: BoardAttendee[];
  presentedBy: string;
  clinicalSummary: string;
  imagingReview: string;
  pathologyReview: string;
  discussionPoints: string[];
  recommendations: BoardRecommendation[];
  consensusReached: boolean;
  dissent?: string;
  followUpDate?: Date;
  minutes?: string;
}

export interface BoardAttendee {
  userId: string;
  name: string;
  specialty: string;
  role: 'chair' | 'presenter' | 'discussant' | 'observer';
  present: boolean;
}

export interface BoardRecommendation {
  category: 'treatment' | 'diagnostic' | 'staging' | 'clinical_trial' | 'supportive' | 'other';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  dueDate?: Date;
  status: 'pending' | 'completed' | 'declined';
}

// Clinical Trials
export interface ClinicalTrialEnrollment {
  trialId: string;
  trialName: string;
  nctNumber: string;
  sponsor: string;
  phase: 'I' | 'I/II' | 'II' | 'II/III' | 'III' | 'IV';
  enrollmentDate: Date;
  arm?: string;
  screeningStatus: 'screening' | 'enrolled' | 'screen_failure' | 'withdrawn' | 'completed';
  consentDate: Date;
  principalInvestigator: string;
  studyCoordinator: string;
}

// Survivorship
export interface SurvivorshipPlan {
  id: string;
  createdDate: Date;
  treatmentSummary: string;
  surveillanceSchedule: SurveillanceItem[];
  lateEffectsRisk: LateEffect[];
  healthMaintenanceRecommendations: string[];
  psychosocialSupport: string[];
  lifestyleRecommendations: string[];
  primaryCareProvider: string;
  oncologyFollowUp: string;
}

export interface SurveillanceItem {
  test: string;
  frequency: string;
  duration: string;
  purpose: string;
}

export interface LateEffect {
  effect: string;
  riskLevel: 'low' | 'moderate' | 'high';
  causedBy: string;
  screening: string;
  prevention?: string;
}

// Palliative Care
export interface PalliativeCareRecord {
  referralDate: Date;
  palliativeTeamId: string;
  goals: string[];
  symptomManagement: SymptomManagement[];
  advanceCarePlanning: boolean;
  hospiceReferral?: Date;
  hospiceProvider?: string;
}

export interface SymptomManagement {
  symptom: string;
  severity: number;
  interventions: string[];
  effectiveness: string;
}

export class OncologyService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async createOncologyPatient(data: {
    patientId: string;
    diagnosis: CancerDiagnosis;
    staging: TNMStaging;
    histology: Histology;
  }): Promise<OncologyPatient> {
    const patient: OncologyPatient = {
      id: crypto.randomUUID(),
      patientId: data.patientId,
      primaryDiagnosis: data.diagnosis,
      stage: data.staging,
      histology: data.histology,
      biomarkers: [],
      performanceStatus: {
        ecog: 1,
        assessedDate: new Date(),
        assessedBy: 'system'
      },
      chemotherapyCycles: [],
      radiotherapySessions: [],
      surgeries: [],
      immunotherapySessions: [],
      responseAssessments: [],
      tumorBoardReviews: [],
      status: 'newly_diagnosed',
      dateOfDiagnosis: data.diagnosis.diagnosisDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveOncologyPatient(patient);
    return patient;
  }

  async createTreatmentPlan(
    oncologyPatientId: string,
    plan: Omit<TreatmentPlan, 'id' | 'approvedAt'>
  ): Promise<TreatmentPlan> {
    const patient = await this.getOncologyPatient(oncologyPatientId);
    if (!patient) throw new Error('Oncology patient not found');

    const treatmentPlan: TreatmentPlan = {
      ...plan,
      id: crypto.randomUUID(),
      approvedAt: new Date()
    };

    patient.treatmentPlan = treatmentPlan;
    patient.status = 'on_treatment';
    patient.updatedAt = new Date();

    await this.updateOncologyPatient(patient);
    return treatmentPlan;
  }

  async recordChemotherapyCycle(
    oncologyPatientId: string,
    cycle: Omit<ChemotherapyCycle, 'id'>
  ): Promise<ChemotherapyCycle> {
    const patient = await this.getOncologyPatient(oncologyPatientId);
    if (!patient) throw new Error('Oncology patient not found');

    const newCycle: ChemotherapyCycle = {
      ...cycle,
      id: crypto.randomUUID()
    };

    patient.chemotherapyCycles.push(newCycle);
    patient.updatedAt = new Date();

    await this.updateOncologyPatient(patient);
    return newCycle;
  }

  async recordResponseAssessment(
    oncologyPatientId: string,
    assessment: Omit<ResponseAssessment, 'id'>
  ): Promise<ResponseAssessment> {
    const patient = await this.getOncologyPatient(oncologyPatientId);
    if (!patient) throw new Error('Oncology patient not found');

    const newAssessment: ResponseAssessment = {
      ...assessment,
      id: crypto.randomUUID()
    };

    patient.responseAssessments.push(newAssessment);

    // Update patient status based on response
    if (assessment.response === 'CR') {
      patient.status = 'remission';
    } else if (assessment.response === 'PD') {
      patient.status = 'progression';
    }

    patient.updatedAt = new Date();

    await this.updateOncologyPatient(patient);
    return newAssessment;
  }

  async scheduleTumorBoard(
    oncologyPatientId: string,
    review: Omit<TumorBoardReview, 'id'>
  ): Promise<TumorBoardReview> {
    const patient = await this.getOncologyPatient(oncologyPatientId);
    if (!patient) throw new Error('Oncology patient not found');

    const newReview: TumorBoardReview = {
      ...review,
      id: crypto.randomUUID()
    };

    patient.tumorBoardReviews.push(newReview);
    patient.updatedAt = new Date();

    await this.updateOncologyPatient(patient);

    // Notify attendees
    for (const attendee of review.attendees) {
      await this.notifyTumorBoardAttendee(attendee, newReview);
    }

    return newReview;
  }

  async calculateToxicityGrade(symptoms: string[]): Promise<ToxicityAssessment[]> {
    // Map symptoms to CTCAE grades
    return [];
  }

  async getChemotherapyProtocols(cancerType: string): Promise<ChemotherapyProtocol[]> {
    return [];
  }

  async checkDoseModificationNeeded(
    cycle: ChemotherapyCycle,
    labResults: LabResult[]
  ): Promise<AppliedDoseModification[]> {
    const modifications: AppliedDoseModification[] = [];

    // Check ANC for neutropenia
    const anc = labResults.find(l => l.test === 'ANC');
    if (anc && anc.value < 1000) {
      for (const drug of cycle.drugs) {
        modifications.push({
          drugId: drug.drugId,
          reason: `ANC < 1000 (${anc.value})`,
          originalDose: drug.plannedDose,
          modifiedDose: drug.plannedDose * 0.75,
          percentReduction: 25,
          approvedBy: ''
        });
      }
    }

    // Check platelets
    const platelets = labResults.find(l => l.test === 'Platelets');
    if (platelets && platelets.value < 75000) {
      // Dose reduction needed
    }

    // Check creatinine for renal dosing
    const creatinine = labResults.find(l => l.test === 'Creatinine');
    if (creatinine) {
      // Calculate CrCl and adjust doses
    }

    return modifications;
  }

  // Database stubs
  private async saveOncologyPatient(patient: OncologyPatient): Promise<void> {}
  private async updateOncologyPatient(patient: OncologyPatient): Promise<void> {}
  private async getOncologyPatient(id: string): Promise<OncologyPatient | null> { return null; }
  private async notifyTumorBoardAttendee(attendee: BoardAttendee, review: TumorBoardReview): Promise<void> {}
}

export default OncologyService;
