/**
 * Pulmonology Service - Pneumologie
 *
 * Fonctionnalités:
 * - Spirométrie et EFR
 * - Gestion BPCO
 * - Apnée du sommeil
 * - Oxygénothérapie
 * - Asthme
 * - Fibrose pulmonaire
 */

export interface PulmonologyPatient {
  id: string;
  patientId: string;
  diagnoses: PulmonaryDiagnosis[];
  spirometryResults: SpirometryResult[];
  sleepStudies: SleepStudy[];
  oxygenTherapy?: OxygenTherapy;
  ventilatorSupport?: VentilatorSupport;
  cpapTherapy?: CPAPTherapy;
  bronchoscopies: Bronchoscopy[];
  pleuralProcedures: PleuralProcedure[];
  pulmonaryRehabSessions: PulmonaryRehab[];
  smokingHistory: SmokingHistory;
  environmentalExposures: EnvironmentalExposure[];
  vaccinations: { flu: Date[]; pneumococcal: Date[] };
  actionPlans: ActionPlan[];
  inhalerTechnique: InhalerTechnique[];
  sixMinuteWalkTests: SixMinuteWalkTest[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PulmonaryDiagnosis {
  id: string;
  icdCode: string;
  diagnosis: string;
  type: PulmonaryDiagnosisType;
  severity?: string;
  goldStage?: '1' | '2' | '3' | '4';
  ginaStep?: 1 | 2 | 3 | 4 | 5;
  diagnosisDate: Date;
  diagnosedBy: string;
  status: 'active' | 'resolved' | 'chronic';
}

export type PulmonaryDiagnosisType =
  | 'asthma' | 'copd' | 'ild' | 'ipf' | 'sarcoidosis'
  | 'bronchiectasis' | 'cystic_fibrosis' | 'lung_cancer'
  | 'osa' | 'csa' | 'osas' | 'ohs' | 'pulmonary_hypertension'
  | 'pleural_effusion' | 'pneumonia' | 'pe' | 'ards'
  | 'tb' | 'aspergillosis' | 'other';

// Spirometry
export interface SpirometryResult {
  id: string;
  date: Date;
  performedBy: string;
  technician: string;
  indication: string;
  preBronchodilator: SpirometryValues;
  postBronchodilator?: SpirometryValues;
  bronchodilatorResponse: boolean;
  bronchodilatorUsed?: string;
  quality: 'A' | 'B' | 'C' | 'D' | 'F';
  acceptability: boolean;
  reproducibility: boolean;
  interpretation: SpirometryInterpretation;
  patternType: 'obstructive' | 'restrictive' | 'mixed' | 'normal';
  notes?: string;
}

export interface SpirometryValues {
  fvc: number;
  fvcPredicted: number;
  fvcPercent: number;
  fev1: number;
  fev1Predicted: number;
  fev1Percent: number;
  fev1FvcRatio: number;
  fev1FvcLLN: number;
  pef: number;
  pefPercent: number;
  fef2575?: number;
  fef2575Percent?: number;
  fvc6?: number;
  fev6?: number;
  fev1Fev6Ratio?: number;
}

export interface SpirometryInterpretation {
  obstruction: boolean;
  obstructionSeverity?: 'mild' | 'moderate' | 'moderately_severe' | 'severe' | 'very_severe';
  restriction: boolean;
  restrictionSeverity?: 'mild' | 'moderate' | 'severe';
  bronchodilatorResponse: boolean;
  responsePercent?: number;
  impression: string;
  recommendations: string[];
}

// Sleep Studies
export interface SleepStudy {
  id: string;
  type: 'psg' | 'hsat' | 'mslt' | 'mwt' | 'split_night';
  date: Date;
  facility: string;
  technician?: string;
  interpretedBy: string;
  totalSleepTime: number;
  sleepEfficiency: number;
  sleepLatency: number;
  remLatency?: number;
  sleepStages: SleepStages;
  respiratoryEvents: RespiratoryEvents;
  ahi: number;
  oai: number;
  cai: number;
  odi: number;
  lowestSpo2: number;
  meanSpo2: number;
  timeBelow90: number;
  timeBelow88: number;
  snoring: boolean;
  snoringPercent?: number;
  plms?: number;
  plmsArousals?: number;
  arousalIndex: number;
  heartRhythm: string;
  diagnosis: SleepDiagnosis;
  recommendations: string[];
  cpapTitration?: CPAPTitration;
}

export interface SleepStages {
  n1Percent: number;
  n2Percent: number;
  n3Percent: number;
  remPercent: number;
  wakePercent: number;
}

export interface RespiratoryEvents {
  obstructiveApneas: number;
  centralApneas: number;
  mixedApneas: number;
  hypopneas: number;
  reras: number;
  cheyneStokesPeriods?: number;
}

export interface SleepDiagnosis {
  primaryDiagnosis: string;
  severity: 'mild' | 'moderate' | 'severe' | 'none';
  osaPresent: boolean;
  csaPresent: boolean;
  hypoventilation: boolean;
  insomnia: boolean;
  narcolepsy: boolean;
  plmd: boolean;
}

export interface CPAPTitration {
  optimalPressure: number;
  optimalPressureMode: 'cpap' | 'apap' | 'bipap';
  bipapSettings?: { ipap: number; epap: number };
  apapRange?: { min: number; max: number };
  residualAhi: number;
  leakAcceptable: boolean;
  maskType: string;
  efficacy: 'excellent' | 'good' | 'fair' | 'poor';
}

// CPAP/BiPAP Therapy
export interface CPAPTherapy {
  id: string;
  startDate: Date;
  device: CPAPDevice;
  settings: CPAPSettings;
  mask: MaskInfo;
  compliance: ComplianceData[];
  adjustments: TherapyAdjustment[];
  supplies: SupplyOrder[];
  nextFollowUp: Date;
  status: 'active' | 'discontinued' | 'non_compliant';
}

export interface CPAPDevice {
  manufacturer: string;
  model: string;
  serialNumber: string;
  mode: 'cpap' | 'apap' | 'bipap' | 'bipap_st' | 'asv';
  wifiEnabled: boolean;
  humidifier: boolean;
}

export interface CPAPSettings {
  pressure?: number;
  ipap?: number;
  epap?: number;
  pressureMin?: number;
  pressureMax?: number;
  rampTime: number;
  rampPressure: number;
  humidityLevel: number;
  reliefSetting?: string;
  backupRate?: number;
}

export interface MaskInfo {
  type: 'nasal' | 'nasal_pillows' | 'full_face' | 'hybrid';
  manufacturer: string;
  model: string;
  size: string;
  lastReplaced: Date;
  fitCheck: boolean;
}

export interface ComplianceData {
  date: Date;
  usageHours: number;
  daysUsed: number;
  totalDays: number;
  compliancePercent: number;
  avgUsageOnUsedDays: number;
  residualAhi: number;
  leakRate: number;
  pressure95?: number;
  events: { oa: number; ca: number; h: number };
}

export interface TherapyAdjustment {
  date: Date;
  adjustedBy: string;
  reason: string;
  previousSettings: Partial<CPAPSettings>;
  newSettings: Partial<CPAPSettings>;
}

export interface SupplyOrder {
  orderDate: Date;
  items: { item: string; quantity: number }[];
  status: 'ordered' | 'shipped' | 'delivered';
  nextReorderDate: Date;
}

// Oxygen Therapy
export interface OxygenTherapy {
  id: string;
  indication: string;
  prescribedDate: Date;
  prescribedBy: string;
  qualification: OxygenQualification;
  settings: OxygenSettings[];
  deliveryDevice: OxygenDevice;
  supplier: string;
  complianceChecks: OxygenCompliance[];
  recertificationDue: Date;
  status: 'active' | 'discontinued';
}

export interface OxygenQualification {
  restingSpo2: number;
  restingPo2?: number;
  exerciseSpo2?: number;
  sleepSpo2?: number;
  qualificationMethod: 'abg' | 'oximetry' | 'sleep_study' | 'exercise_test';
  qualificationDate: Date;
  meetsMMACriteria: boolean;
}

export interface OxygenSettings {
  activity: 'rest' | 'exertion' | 'sleep' | 'continuous';
  flowRate: number;
  flowUnit: 'lpm' | 'percent';
  targetSpo2: number;
  hoursPerDay: number;
}

export interface OxygenDevice {
  type: 'concentrator' | 'liquid' | 'compressed' | 'portable_concentrator';
  manufacturer: string;
  model: string;
  deliveryMethod: 'nasal_cannula' | 'simple_mask' | 'venturi' | 'non_rebreather' | 'high_flow';
  portableUnit: boolean;
}

export interface OxygenCompliance {
  date: Date;
  hoursUsed: number;
  spo2Achieved: number;
  deviceWorking: boolean;
  issues?: string;
}

// Ventilator Support
export interface VentilatorSupport {
  id: string;
  type: 'niv' | 'invasive';
  indication: string;
  startDate: Date;
  device: { manufacturer: string; model: string; serialNumber: string };
  settings: VentilatorSettings;
  interface?: string;
  tracheostomy?: TracheostomyInfo;
  weaningStatus?: 'not_started' | 'in_progress' | 'weaned' | 'chronic';
  complianceData: VentilatorCompliance[];
}

export interface VentilatorSettings {
  mode: string;
  ipap?: number;
  epap?: number;
  peep?: number;
  ps?: number;
  tidalVolume?: number;
  respiratoryRate?: number;
  fio2: number;
  tiMin?: number;
  tiMax?: number;
  riseTime?: number;
  backupRate?: number;
}

export interface TracheostomyInfo {
  size: number;
  type: string;
  manufacturer: string;
  lastChanged: Date;
  nextChange: Date;
  cuffed: boolean;
  fenestrated: boolean;
}

export interface VentilatorCompliance {
  date: Date;
  hoursUsed: number;
  leakRate: number;
  tidalVolume: number;
  minuteVentilation: number;
  triggerPercent: number;
  spo2: number;
  issues?: string;
}

// Bronchoscopy
export interface Bronchoscopy {
  id: string;
  date: Date;
  type: 'diagnostic' | 'therapeutic' | 'interventional';
  indication: string;
  performedBy: string;
  assistedBy: string[];
  sedation: string;
  findings: BronchoscopyFindings;
  procedures: BronchoscopyProcedure[];
  specimens: BronchoscopySpecimen[];
  complications?: string[];
  report: string;
}

export interface BronchoscopyFindings {
  airwayAnatomy: string;
  mucosa: string;
  secretions: string;
  masses: string;
  endobronchialLesions: string;
  extrinsicCompression: string;
  other: string;
}

export interface BronchoscopyProcedure {
  procedure: 'bal' | 'brushing' | 'biopsy' | 'ebus' | 'stent' | 'dilation' | 'cryotherapy' | 'laser' | 'argon';
  location: string;
  details: string;
  success: boolean;
}

export interface BronchoscopySpecimen {
  type: 'bal' | 'brushing' | 'biopsy' | 'washing';
  site: string;
  sentFor: string[];
  results?: string;
}

// Pleural Procedures
export interface PleuralProcedure {
  id: string;
  type: 'thoracentesis' | 'chest_tube' | 'pleurodesis' | 'tunneled_catheter' | 'thoracoscopy';
  date: Date;
  indication: string;
  performedBy: string;
  side: 'left' | 'right';
  imaging: string;
  fluidRemoved?: number;
  fluidCharacter?: string;
  fluidAnalysis?: PleuralFluidAnalysis;
  complications?: string[];
  followUp: string;
}

export interface PleuralFluidAnalysis {
  appearance: string;
  ph: number;
  protein: number;
  ldh: number;
  glucose: number;
  cellCount: number;
  differential: string;
  culture?: string;
  cytology?: string;
  lightsCriteria: 'transudate' | 'exudate';
}

// Pulmonary Rehabilitation
export interface PulmonaryRehab {
  id: string;
  sessionNumber: number;
  date: Date;
  duration: number;
  exercises: ExerciseSession[];
  education: string[];
  preSessionVitals: { hr: number; bp: string; spo2: number; rr: number };
  postSessionVitals: { hr: number; bp: string; spo2: number; rr: number };
  borgScalePre: number;
  borgScalePost: number;
  oxygenUsed: boolean;
  oxygenFlow?: number;
  therapistNotes: string;
}

export interface ExerciseSession {
  type: 'treadmill' | 'cycle' | 'arm_ergometer' | 'strength' | 'flexibility' | 'breathing';
  duration: number;
  intensity: string;
  distance?: number;
  resistance?: number;
  spo2During: number;
  symptoms: string[];
}

// Six Minute Walk Test
export interface SixMinuteWalkTest {
  id: string;
  date: Date;
  performedBy: string;
  preTest: { hr: number; bp: string; spo2: number; rr: number; borgDyspnea: number; borgFatigue: number };
  postTest: { hr: number; bp: string; spo2: number; rr: number; borgDyspnea: number; borgFatigue: number };
  lowestSpo2: number;
  oxygenUsed: boolean;
  oxygenFlow?: number;
  distanceWalked: number;
  predictedDistance: number;
  percentPredicted: number;
  stops: number;
  reasonsForStopping?: string[];
  supplementalO2Required: boolean;
  interpretation: string;
}

// Action Plans
export interface ActionPlan {
  id: string;
  type: 'asthma' | 'copd';
  createdDate: Date;
  createdBy: string;
  greenZone: ZoneInstructions;
  yellowZone: ZoneInstructions;
  redZone: ZoneInstructions;
  triggers?: string[];
  peakFlowBest?: number;
  patientEducated: boolean;
  lastReviewed: Date;
}

export interface ZoneInstructions {
  symptoms: string[];
  peakFlowRange?: { min: number; max: number };
  medications: { name: string; dose: string; frequency: string }[];
  actions: string[];
  whenToCall: string[];
}

// Inhaler Technique
export interface InhalerTechnique {
  date: Date;
  assessedBy: string;
  inhaler: string;
  inhalerType: 'mdi' | 'dpi' | 'smi' | 'nebulizer';
  spacerUsed: boolean;
  stepsPassed: number;
  totalSteps: number;
  errors: string[];
  educationProvided: boolean;
  demonstrationGiven: boolean;
  returnDemonstration: boolean;
  notes?: string;
}

// Smoking History
export interface SmokingHistory {
  status: 'never' | 'former' | 'current';
  packYears?: number;
  startAge?: number;
  quitDate?: Date;
  cigarettesPerDay?: number;
  yearsSmoked?: number;
  otherTobacco?: string[];
  vaping?: boolean;
  cessationAttempts?: CessationAttempt[];
  secondhandExposure?: boolean;
}

export interface CessationAttempt {
  date: Date;
  method: string;
  duration: string;
  successful: boolean;
}

// Environmental Exposures
export interface EnvironmentalExposure {
  type: 'occupational' | 'environmental' | 'hobby';
  exposure: string;
  duration: string;
  frequency: string;
  protectionUsed: boolean;
  currentlyExposed: boolean;
}

export class PulmonologyService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async createPulmonologyPatient(patientId: string): Promise<PulmonologyPatient> {
    const patient: PulmonologyPatient = {
      id: crypto.randomUUID(),
      patientId,
      diagnoses: [],
      spirometryResults: [],
      sleepStudies: [],
      bronchoscopies: [],
      pleuralProcedures: [],
      pulmonaryRehabSessions: [],
      smokingHistory: { status: 'never' },
      environmentalExposures: [],
      vaccinations: { flu: [], pneumococcal: [] },
      actionPlans: [],
      inhalerTechnique: [],
      sixMinuteWalkTests: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.savePulmonologyPatient(patient);
    return patient;
  }

  async recordSpirometry(
    pulmonologyPatientId: string,
    result: Omit<SpirometryResult, 'id' | 'interpretation'>
  ): Promise<SpirometryResult> {
    const interpretation = this.interpretSpirometry(result);

    const spirometry: SpirometryResult = {
      ...result,
      id: crypto.randomUUID(),
      interpretation
    };

    const patient = await this.getPulmonologyPatient(pulmonologyPatientId);
    if (patient) {
      patient.spirometryResults.push(spirometry);
      patient.updatedAt = new Date();
      await this.updatePulmonologyPatient(patient);
    }

    return spirometry;
  }

  private interpretSpirometry(result: Omit<SpirometryResult, 'id' | 'interpretation'>): SpirometryInterpretation {
    const pre = result.preBronchodilator;
    const post = result.postBronchodilator;

    let obstruction = false;
    let obstructionSeverity: SpirometryInterpretation['obstructionSeverity'];
    let restriction = false;
    let restrictionSeverity: SpirometryInterpretation['restrictionSeverity'];

    // Check for obstruction (FEV1/FVC < LLN or < 0.70)
    if (pre.fev1FvcRatio < pre.fev1FvcLLN || pre.fev1FvcRatio < 0.70) {
      obstruction = true;

      // Grade severity by FEV1 percent predicted
      if (pre.fev1Percent >= 80) obstructionSeverity = 'mild';
      else if (pre.fev1Percent >= 50) obstructionSeverity = 'moderate';
      else if (pre.fev1Percent >= 35) obstructionSeverity = 'severe';
      else obstructionSeverity = 'very_severe';
    }

    // Check for restriction (FVC < LLN)
    if (pre.fvcPercent < 80 && pre.fev1FvcRatio >= 0.70) {
      restriction = true;

      if (pre.fvcPercent >= 70) restrictionSeverity = 'mild';
      else if (pre.fvcPercent >= 50) restrictionSeverity = 'moderate';
      else restrictionSeverity = 'severe';
    }

    // Bronchodilator response
    let bronchodilatorResponse = false;
    let responsePercent: number | undefined;

    if (post) {
      const fev1Change = ((post.fev1 - pre.fev1) / pre.fev1) * 100;
      const fev1AbsoluteChange = post.fev1 - pre.fev1;

      if (fev1Change >= 12 && fev1AbsoluteChange >= 0.2) {
        bronchodilatorResponse = true;
        responsePercent = fev1Change;
      }
    }

    let impression = '';
    const recommendations: string[] = [];

    if (!obstruction && !restriction) {
      impression = 'Normal spirometry';
    } else if (obstruction && !restriction) {
      impression = `Obstructive ventilatory defect, ${obstructionSeverity}`;
      if (bronchodilatorResponse) {
        impression += ' with significant bronchodilator response';
        recommendations.push('Consider asthma diagnosis');
      } else {
        recommendations.push('Consider COPD if appropriate clinical context');
      }
    } else if (restriction && !obstruction) {
      impression = `Restrictive pattern, ${restrictionSeverity} - confirm with lung volumes`;
      recommendations.push('Order complete pulmonary function tests with lung volumes and DLCO');
    } else {
      impression = 'Mixed obstructive and restrictive pattern';
      recommendations.push('Order complete pulmonary function tests');
    }

    return {
      obstruction,
      obstructionSeverity,
      restriction,
      restrictionSeverity,
      bronchodilatorResponse,
      responsePercent,
      impression,
      recommendations
    };
  }

  async recordSleepStudy(
    pulmonologyPatientId: string,
    study: Omit<SleepStudy, 'id'>
  ): Promise<SleepStudy> {
    const newStudy: SleepStudy = {
      ...study,
      id: crypto.randomUUID()
    };

    const patient = await this.getPulmonologyPatient(pulmonologyPatientId);
    if (patient) {
      patient.sleepStudies.push(newStudy);
      patient.updatedAt = new Date();
      await this.updatePulmonologyPatient(patient);
    }

    return newStudy;
  }

  async initiateCPAPTherapy(
    pulmonologyPatientId: string,
    therapy: Omit<CPAPTherapy, 'id' | 'compliance' | 'adjustments' | 'supplies' | 'status'>
  ): Promise<CPAPTherapy> {
    const cpapTherapy: CPAPTherapy = {
      ...therapy,
      id: crypto.randomUUID(),
      compliance: [],
      adjustments: [],
      supplies: [],
      status: 'active'
    };

    const patient = await this.getPulmonologyPatient(pulmonologyPatientId);
    if (patient) {
      patient.cpapTherapy = cpapTherapy;
      patient.updatedAt = new Date();
      await this.updatePulmonologyPatient(patient);
    }

    return cpapTherapy;
  }

  async recordCPAPCompliance(
    pulmonologyPatientId: string,
    compliance: ComplianceData
  ): Promise<void> {
    const patient = await this.getPulmonologyPatient(pulmonologyPatientId);
    if (!patient?.cpapTherapy) throw new Error('No active CPAP therapy');

    patient.cpapTherapy.compliance.push(compliance);

    // Check compliance threshold (4+ hours, 70% of nights)
    if (compliance.compliancePercent < 70 || compliance.avgUsageOnUsedDays < 4) {
      patient.cpapTherapy.status = 'non_compliant';
      await this.alertNonCompliance(patient);
    }

    patient.updatedAt = new Date();
    await this.updatePulmonologyPatient(patient);
  }

  async recordSixMinuteWalk(
    pulmonologyPatientId: string,
    test: Omit<SixMinuteWalkTest, 'id' | 'interpretation'>
  ): Promise<SixMinuteWalkTest> {
    const interpretation = this.interpret6MWT(test);

    const newTest: SixMinuteWalkTest = {
      ...test,
      id: crypto.randomUUID(),
      interpretation
    };

    const patient = await this.getPulmonologyPatient(pulmonologyPatientId);
    if (patient) {
      patient.sixMinuteWalkTests.push(newTest);
      patient.updatedAt = new Date();
      await this.updatePulmonologyPatient(patient);
    }

    return newTest;
  }

  private interpret6MWT(test: Omit<SixMinuteWalkTest, 'id' | 'interpretation'>): string {
    const parts: string[] = [];

    parts.push(`Distance walked: ${test.distanceWalked}m (${test.percentPredicted}% predicted)`);

    if (test.lowestSpo2 < 88) {
      parts.push('Significant desaturation during exercise');
    } else if (test.lowestSpo2 < 90) {
      parts.push('Mild desaturation during exercise');
    }

    if (test.supplementalO2Required) {
      parts.push('Supplemental oxygen required during exercise');
    }

    if (test.percentPredicted < 80) {
      parts.push('Reduced exercise capacity');
    }

    return parts.join('. ');
  }

  async createAsthmaActionPlan(
    pulmonologyPatientId: string,
    plan: Omit<ActionPlan, 'id' | 'createdDate' | 'lastReviewed'>
  ): Promise<ActionPlan> {
    const actionPlan: ActionPlan = {
      ...plan,
      id: crypto.randomUUID(),
      type: 'asthma',
      createdDate: new Date(),
      lastReviewed: new Date()
    };

    const patient = await this.getPulmonologyPatient(pulmonologyPatientId);
    if (patient) {
      patient.actionPlans.push(actionPlan);
      patient.updatedAt = new Date();
      await this.updatePulmonologyPatient(patient);
    }

    return actionPlan;
  }

  // Database stubs
  private async savePulmonologyPatient(patient: PulmonologyPatient): Promise<void> {}
  private async updatePulmonologyPatient(patient: PulmonologyPatient): Promise<void> {}
  private async getPulmonologyPatient(id: string): Promise<PulmonologyPatient | null> { return null; }
  private async alertNonCompliance(patient: PulmonologyPatient): Promise<void> {}
}

export default PulmonologyService;
