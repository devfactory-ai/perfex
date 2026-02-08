/**
 * Neurology Service
 *
 * Fonctionnalités:
 * - EEG et interprétation
 * - EMG/Études de conduction nerveuse
 * - Gestion AVC
 * - Épilepsie et crises
 * - Maladies neurodégénératives
 * - Céphalées et migraines
 */

export interface NeurologyPatient {
  id: string;
  patientId: string;
  diagnoses: NeurologicalDiagnosis[];
  eegStudies: EEGStudy[];
  emgStudies: EMGStudy[];
  strokeHistory: StrokeEvent[];
  seizureHistory: SeizureEvent[];
  headacheHistory: HeadacheRecord[];
  cognitiveAssessments: CognitiveAssessment[];
  movementDisorders?: MovementDisorderProfile;
  msMriFindings?: MSMRIFinding[];
  neurologicalExams: NeurologicalExam[];
  medications: NeurologyMedication[];
  surgeries: NeurosurgeryRecord[];
  neuromodulation?: NeuromodulationDevice;
  createdAt: Date;
  updatedAt: Date;
}

export interface NeurologicalDiagnosis {
  id: string;
  icdCode: string;
  diagnosis: string;
  category: NeurologyCategory;
  subtype?: string;
  diagnosisDate: Date;
  diagnosedBy: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'chronic' | 'progressive';
}

export type NeurologyCategory =
  | 'stroke' | 'epilepsy' | 'headache' | 'dementia'
  | 'parkinsons' | 'ms' | 'als' | 'myasthenia'
  | 'neuropathy' | 'movement_disorder' | 'neuromuscular'
  | 'sleep_disorder' | 'brain_tumor' | 'tbi' | 'other';

// EEG Studies
export interface EEGStudy {
  id: string;
  date: Date;
  type: EEGType;
  duration: number;
  technician: string;
  interpretedBy: string;
  indication: string;
  medications: string[];
  priorSeizure?: Date;
  sleepState: string[];
  activationProcedures: ActivationProcedure[];
  backgroundActivity: BackgroundActivity;
  abnormalFindings: EEGAbnormality[];
  seizuresRecorded: RecordedSeizure[];
  impression: string;
  clinicalCorrelation: string;
  recommendations: string[];
}

export type EEGType =
  | 'routine' | 'prolonged' | 'ambulatory' | 'continuous_icu'
  | 'video_eeg' | 'sleep_deprived' | 'intraoperative';

export interface ActivationProcedure {
  procedure: 'hyperventilation' | 'photic_stimulation' | 'sleep' | 'eye_closure';
  response: string;
  abnormalResponse: boolean;
}

export interface BackgroundActivity {
  posteriorDominantRhythm: {
    frequency: number;
    amplitude: string;
    symmetry: boolean;
    reactivity: boolean;
  };
  organization: 'normal' | 'mildly_disorganized' | 'moderately_disorganized' | 'severely_disorganized';
  sleepArchitecture?: string;
  asymmetries?: string[];
}

export interface EEGAbnormality {
  type: EEGAbnormalityType;
  location: string;
  morphology: string;
  frequency?: number;
  amplitude?: string;
  duration?: string;
  state: 'wakefulness' | 'drowsiness' | 'sleep' | 'all';
  clinicalSignificance: string;
}

export type EEGAbnormalityType =
  | 'spikes' | 'sharp_waves' | 'spike_wave' | 'polyspikes'
  | 'pleds' | 'gpeds' | 'triphasic' | 'focal_slowing'
  | 'generalized_slowing' | 'burst_suppression' | 'other';

export interface RecordedSeizure {
  id: string;
  startTime: Date;
  duration: number;
  electrographicOnset: string;
  electrographicPattern: string;
  clinicalManifestations: string[];
  postictalChanges: string;
  classification: SeizureClassification;
}

// EMG Studies
export interface EMGStudy {
  id: string;
  date: Date;
  type: 'routine_emg' | 'ncv' | 'emg_ncv' | 'single_fiber' | 'repetitive_stim';
  indication: string;
  performedBy: string;
  interpretedBy: string;
  nerveConductionStudies?: NerveConductionStudy[];
  needleEMG?: NeedleEMGFinding[];
  repetitiveStimulation?: RepetitiveStimResult[];
  impression: string;
  diagnosis: string[];
  recommendations: string[];
}

export interface NerveConductionStudy {
  nerve: string;
  side: 'left' | 'right';
  type: 'motor' | 'sensory' | 'mixed';
  latency: { value: number; normal: number };
  amplitude: { value: number; normal: number };
  conductionVelocity?: { value: number; normal: number };
  fWave?: { value: number; normal: number };
  interpretation: 'normal' | 'abnormal_demyelinating' | 'abnormal_axonal' | 'absent';
}

export interface NeedleEMGFinding {
  muscle: string;
  side: 'left' | 'right';
  insertionalActivity: 'normal' | 'increased' | 'decreased';
  spontaneousActivity: {
    fibrillations: 'none' | '1+' | '2+' | '3+' | '4+';
    positiveSharpWaves: 'none' | '1+' | '2+' | '3+' | '4+';
    fasciculations: boolean;
    myotonia: boolean;
    complexRepetitiveDischarges: boolean;
  };
  mupMorphology: {
    amplitude: 'normal' | 'increased' | 'decreased';
    duration: 'normal' | 'prolonged' | 'shortened';
    polyphasia: 'normal' | 'increased';
  };
  recruitment: 'normal' | 'reduced' | 'early' | 'absent';
  interpretation: string;
}

export interface RepetitiveStimResult {
  nerve: string;
  muscle: string;
  stimulationRate: number;
  decrement: number;
  abnormal: boolean;
  postExercise?: { immediate: number; delayed: number };
}

// Stroke Management
export interface StrokeEvent {
  id: string;
  date: Date;
  type: 'ischemic' | 'hemorrhagic' | 'tia' | 'subarachnoid';
  subtype?: string;
  toastClassification?: string;
  location: string[];
  lastKnownWell: Date;
  nihssOnArrival: number;
  nihss24hr?: number;
  nihssDischarge?: number;
  mrsPreStroke: number;
  mrsDischarge?: number;
  mrs90Day?: number;
  imaging: StrokeImaging[];
  interventions: StrokeIntervention[];
  etiology?: StrokeEtiology;
  riskFactors: string[];
  secondaryPrevention: SecondaryPrevention;
  complications: string[];
  rehabilitation?: RehabilitationPlan;
}

export interface StrokeImaging {
  modality: 'ct' | 'cta' | 'ctp' | 'mri' | 'mra' | 'dsa' | 'carotid_ultrasound' | 'tcd';
  date: Date;
  findings: string;
  aspectsScore?: number;
  infarctVolume?: number;
  penumbraVolume?: number;
  vesselOcclusion?: string;
  collaterals?: string;
}

export interface StrokeIntervention {
  type: 'tpa' | 'thrombectomy' | 'hemicraniectomy' | 'evd' | 'clipping' | 'coiling' | 'carotid_stent' | 'cea';
  date: Date;
  doorToNeedle?: number;
  doorToGroin?: number;
  ticiScore?: string;
  complications?: string[];
  outcome: string;
}

export interface StrokeEtiology {
  classification: 'large_vessel' | 'cardioembolism' | 'small_vessel' | 'other_determined' | 'cryptogenic';
  source?: string;
  workupComplete: boolean;
  pendingTests?: string[];
}

export interface SecondaryPrevention {
  antiplatelet?: string;
  anticoagulation?: { drug: string; indication: string };
  statin: boolean;
  statinDose?: string;
  antihypertensive?: string[];
  bloodPressureTarget: string;
  lipidTarget: string;
  smokingCessation: boolean;
  diabetesControl: boolean;
  lifestyleModifications: string[];
}

export interface RehabilitationPlan {
  startDate: Date;
  type: 'inpatient' | 'outpatient' | 'home' | 'snf';
  therapies: { type: string; frequency: string }[];
  goals: string[];
  progress: string;
}

// Seizure/Epilepsy Management
export interface SeizureEvent {
  id: string;
  date: Date;
  time?: Date;
  duration: number;
  witnessed: boolean;
  description: string;
  aura?: string;
  classification: SeizureClassification;
  triggers?: string[];
  postictal: PostictalState;
  injuryOccurred: boolean;
  injuryDescription?: string;
  emergencyServicesUsed: boolean;
  rescueMedicationUsed: boolean;
  rescueMedication?: string;
  medicationCompliance: boolean;
  sleepDeprivation: boolean;
  alcoholUse: boolean;
  missedDoses: boolean;
}

export interface SeizureClassification {
  onset: 'focal' | 'generalized' | 'unknown';
  awareness?: 'aware' | 'impaired' | 'unknown';
  motorOnset?: 'motor' | 'non_motor';
  motorType?: string;
  evolutionToGTC: boolean;
}

export interface PostictalState {
  duration: number;
  confusion: boolean;
  toddsParalysis: boolean;
  affectedSide?: string;
  speechDifficulty: boolean;
  headache: boolean;
  fatigue: boolean;
}

export interface EpilepsyProfile {
  syndromeType?: string;
  seizureTypes: SeizureClassification[];
  firstSeizureDate: Date;
  averageFrequency: string;
  lastSeizure?: Date;
  seizureFreeMonths?: number;
  controlStatus: 'controlled' | 'partially_controlled' | 'refractory';
  drugsTriedCount: number;
  currentMedications: NeurologyMedication[];
  surgeryCandiate: boolean;
  surgeryEvaluation?: EpilepsySurgeryEval;
  vnsImplanted: boolean;
  rnsImplanted: boolean;
  drivingRestrictions: boolean;
  pregnancyConsiderations?: string;
}

export interface EpilepsySurgeryEval {
  phaseCompleted: '1' | '2' | '3';
  videoEEGResult: string;
  mriFindings: string;
  petFindings?: string;
  wada?: { language: string; memory: string };
  neuropsychResults?: string;
  candidacy: 'good' | 'moderate' | 'poor' | 'not_candidate';
  proposedSurgery?: string;
}

// Headache Management
export interface HeadacheRecord {
  id: string;
  date: Date;
  startTime: Date;
  duration: number;
  intensity: number;
  type: HeadacheType;
  location: string[];
  quality: string[];
  associatedSymptoms: string[];
  aura?: AuraDescription;
  triggers?: string[];
  relievingFactors?: string[];
  abortiveTreatment?: { medication: string; effective: boolean };
  preventiveTaken: boolean;
  functionalImpact: 'none' | 'mild' | 'moderate' | 'severe';
  erVisit: boolean;
}

export type HeadacheType =
  | 'migraine_without_aura' | 'migraine_with_aura' | 'chronic_migraine'
  | 'tension' | 'cluster' | 'medication_overuse' | 'post_traumatic'
  | 'cervicogenic' | 'new_daily_persistent' | 'other';

export interface AuraDescription {
  type: 'visual' | 'sensory' | 'speech' | 'motor' | 'brainstem' | 'retinal';
  duration: number;
  description: string;
}

export interface MigraineProfile {
  diagnosis: HeadacheType;
  frequency: number; // days per month
  chronicMigraine: boolean;
  medicationOveruse: boolean;
  midasScore?: number;
  hit6Score?: number;
  currentPreventives: NeurologyMedication[];
  failedPreventives: string[];
  botoxCandidate: boolean;
  cgrpCandidate: boolean;
  triggers: string[];
  auraTypes?: string[];
}

// Cognitive Assessment
export interface CognitiveAssessment {
  id: string;
  date: Date;
  assessedBy: string;
  reason: string;
  tests: CognitiveTest[];
  overallImpression: string;
  diagnosis?: string;
  recommendations: string[];
}

export interface CognitiveTest {
  name: string;
  score: number;
  maxScore: number;
  percentile?: number;
  interpretation: string;
}

export interface DementiaProfile {
  type: 'alzheimers' | 'vascular' | 'lewy_body' | 'frontotemporal' | 'mixed' | 'mci' | 'other';
  stage: 'preclinical' | 'mild' | 'moderate' | 'severe';
  onsetDate: Date;
  mmseBaseline?: number;
  mmseCurrent?: number;
  mocaBaseline?: number;
  mocaCurrent?: number;
  functionalStatus: string;
  behavioralSymptoms: string[];
  medications: NeurologyMedication[];
  caregiverInfo: { name: string; relationship: string; phone: string };
  advanceDirectives: boolean;
  drivingStatus: 'driving' | 'restricted' | 'stopped';
}

// Movement Disorders
export interface MovementDisorderProfile {
  type: 'parkinsons' | 'essential_tremor' | 'dystonia' | 'chorea' | 'tics' | 'ataxia' | 'other';
  diagnosis: string;
  onsetDate: Date;
  hoehnYahrStage?: number;
  updrsScores?: { date: Date; motor: number; total: number }[];
  motorFluctuations: boolean;
  dyskinesias: boolean;
  onOffPhenomenon: boolean;
  medications: NeurologyMedication[];
  dbsImplanted: boolean;
  dbsSettings?: DBSSettings;
  physicalTherapy: boolean;
  speechTherapy: boolean;
  occupationalTherapy: boolean;
}

export interface DBSSettings {
  target: 'stn' | 'gpi' | 'vim' | 'other';
  leftSettings: { amplitude: number; pulseWidth: number; frequency: number };
  rightSettings: { amplitude: number; pulseWidth: number; frequency: number };
  lastProgrammed: Date;
  batteryStatus: string;
}

// MS Management
export interface MSMRIFinding {
  date: Date;
  brain: {
    newLesions: number;
    totalLesionLoad: string;
    enhancingLesions: number;
    atrophy: 'none' | 'mild' | 'moderate' | 'severe';
    blackHoles: number;
  };
  spine?: {
    cervical: { lesions: number; enhancing: number };
    thoracic: { lesions: number; enhancing: number };
  };
  comparison: string;
  impression: string;
}

export interface MSProfile {
  type: 'rrms' | 'spms' | 'ppms' | 'cis';
  diagnosisDate: Date;
  relapseCount: number;
  lastRelapse?: Date;
  edssScore: number;
  edssHistory: { date: Date; score: number }[];
  currentDMT?: string;
  previousDMTs: string[];
  jcvStatus: 'positive' | 'negative' | 'unknown';
  jcvIndex?: number;
  mriFrequency: string;
  pregnancyPlanning: boolean;
}

// Neurological Exam
export interface NeurologicalExam {
  id: string;
  date: Date;
  examiner: string;
  mentalStatus: {
    alertness: string;
    orientation: string;
    attention: string;
    memory: string;
    language: string;
    calculations: string;
  };
  cranialNerves: CranialNerveExam;
  motor: MotorExam;
  sensory: SensoryExam;
  reflexes: ReflexExam;
  coordination: CoordinationExam;
  gait: GaitExam;
  meningealSigns: { nuchalRigidity: boolean; kernig: boolean; brudzinski: boolean };
  impressions: string;
}

export interface CranialNerveExam {
  cn1: string;
  cn2: { acuity: string; fields: string; fundoscopy: string };
  cn3_4_6: { pupils: string; eom: string; ptosis: boolean };
  cn5: { sensory: string; motor: string; corneal: string };
  cn7: { forehead: string; smile: string; eyeClosure: string };
  cn8: { hearing: string; vestibular: string };
  cn9_10: { palate: string; gag: string; voice: string };
  cn11: { trapezius: string; scm: string };
  cn12: { tongue: string };
}

export interface MotorExam {
  bulk: { upper: string; lower: string };
  tone: { upper: string; lower: string };
  strength: {
    rightUpper: Record<string, number>;
    leftUpper: Record<string, number>;
    rightLower: Record<string, number>;
    leftLower: Record<string, number>;
  };
  pronatorDrift: boolean;
  involuntaryMovements?: string;
}

export interface SensoryExam {
  lightTouch: { upper: string; lower: string };
  pinprick: { upper: string; lower: string };
  vibration: { upper: string; lower: string };
  proprioception: { upper: string; lower: string };
  temperature?: string;
  corticalSensation?: string;
}

export interface ReflexExam {
  biceps: { right: number; left: number };
  triceps: { right: number; left: number };
  brachioradialis: { right: number; left: number };
  knee: { right: number; left: number };
  ankle: { right: number; left: number };
  plantar: { right: 'flexor' | 'extensor' | 'equivocal'; left: 'flexor' | 'extensor' | 'equivocal' };
  hoffman: { right: boolean; left: boolean };
  clonus: { right: boolean; left: boolean };
}

export interface CoordinationExam {
  fingerNose: { right: string; left: string };
  heelShin: { right: string; left: string };
  rapidAlternating: { right: string; left: string };
  romberg: 'negative' | 'positive' | 'not_tested';
}

export interface GaitExam {
  pattern: string;
  baseWidth: 'normal' | 'narrow' | 'wide';
  armSwing: string;
  tandemGait: string;
  heelWalk: string;
  toeWalk: string;
  turningStability: string;
  aidUsed?: string;
}

// Medications
export interface NeurologyMedication {
  id: string;
  medicationId: string;
  name: string;
  class: NeurologyMedicationClass;
  indication: string;
  dose: number;
  unit: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  effectivenessRating?: number;
  sideEffects: string[];
  levelMonitoring?: { date: Date; level: number; range: string }[];
  status: 'active' | 'discontinued' | 'on_hold';
}

export type NeurologyMedicationClass =
  | 'aed_sodium_channel' | 'aed_calcium_channel' | 'aed_gaba' | 'aed_sv2a' | 'aed_other'
  | 'dopamine_agonist' | 'levodopa' | 'mao_b_inhibitor' | 'comt_inhibitor'
  | 'triptan' | 'cgrp_antagonist' | 'preventive_migraine'
  | 'dmt_injectable' | 'dmt_oral' | 'dmt_infusion'
  | 'cholinesterase_inhibitor' | 'nmda_antagonist'
  | 'muscle_relaxant' | 'botulinum_toxin' | 'other';

// Neuromodulation
export interface NeuromodulationDevice {
  type: 'vns' | 'rns' | 'dbs' | 'scs';
  manufacturer: string;
  model: string;
  serialNumber: string;
  implantDate: Date;
  implantedBy: string;
  indication: string;
  settings: Record<string, any>;
  batteryStatus: string;
  lastInterrogation: Date;
  nextInterrogation: Date;
  adjustments: { date: Date; changes: string; outcome: string }[];
}

// Neurosurgery
export interface NeurosurgeryRecord {
  id: string;
  date: Date;
  type: string;
  indication: string;
  surgeon: string;
  procedure: string;
  findings: string;
  pathology?: string;
  complications?: string[];
  outcome: string;
  followUp: string;
}

export class NeurologyService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async createNeurologyPatient(patientId: string): Promise<NeurologyPatient> {
    const patient: NeurologyPatient = {
      id: crypto.randomUUID(),
      patientId,
      diagnoses: [],
      eegStudies: [],
      emgStudies: [],
      strokeHistory: [],
      seizureHistory: [],
      headacheHistory: [],
      cognitiveAssessments: [],
      neurologicalExams: [],
      medications: [],
      surgeries: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveNeurologyPatient(patient);
    return patient;
  }

  async recordEEG(
    neurologyPatientId: string,
    study: Omit<EEGStudy, 'id'>
  ): Promise<EEGStudy> {
    const patient = await this.getNeurologyPatient(neurologyPatientId);
    if (!patient) throw new Error('Patient not found');

    const eegStudy: EEGStudy = {
      ...study,
      id: crypto.randomUUID()
    };

    patient.eegStudies.push(eegStudy);
    patient.updatedAt = new Date();
    await this.updateNeurologyPatient(patient);

    return eegStudy;
  }

  async recordSeizure(
    neurologyPatientId: string,
    seizure: Omit<SeizureEvent, 'id'>
  ): Promise<SeizureEvent> {
    const patient = await this.getNeurologyPatient(neurologyPatientId);
    if (!patient) throw new Error('Patient not found');

    const seizureEvent: SeizureEvent = {
      ...seizure,
      id: crypto.randomUUID()
    };

    patient.seizureHistory.push(seizureEvent);
    patient.updatedAt = new Date();

    // Alert if severe or injury occurred
    if (seizure.injuryOccurred || seizure.emergencyServicesUsed) {
      await this.alertSeizureEvent(patient, seizureEvent);
    }

    await this.updateNeurologyPatient(patient);
    return seizureEvent;
  }

  async calculateNIHSS(components: Record<string, number>): Promise<{
    total: number;
    interpretation: string;
    severity: 'minor' | 'moderate' | 'moderate_severe' | 'severe';
  }> {
    const total = Object.values(components).reduce((a, b) => a + b, 0);

    let severity: 'minor' | 'moderate' | 'moderate_severe' | 'severe';
    let interpretation: string;

    if (total === 0) {
      severity = 'minor';
      interpretation = 'No stroke symptoms';
    } else if (total <= 4) {
      severity = 'minor';
      interpretation = 'Minor stroke';
    } else if (total <= 15) {
      severity = 'moderate';
      interpretation = 'Moderate stroke';
    } else if (total <= 20) {
      severity = 'moderate_severe';
      interpretation = 'Moderate to severe stroke';
    } else {
      severity = 'severe';
      interpretation = 'Severe stroke';
    }

    return { total, interpretation, severity };
  }

  async recordStrokeEvent(
    neurologyPatientId: string,
    stroke: Omit<StrokeEvent, 'id'>
  ): Promise<StrokeEvent> {
    const patient = await this.getNeurologyPatient(neurologyPatientId);
    if (!patient) throw new Error('Patient not found');

    const strokeEvent: StrokeEvent = {
      ...stroke,
      id: crypto.randomUUID()
    };

    patient.strokeHistory.push(strokeEvent);
    patient.updatedAt = new Date();
    await this.updateNeurologyPatient(patient);

    // Activate stroke protocol notifications
    await this.activateStrokeProtocol(patient, strokeEvent);

    return strokeEvent;
  }

  async getSeizureFrequency(
    neurologyPatientId: string,
    months: number = 3
  ): Promise<{
    total: number;
    perMonth: number;
    byType: Record<string, number>;
    trend: 'improving' | 'stable' | 'worsening';
    lastSeizure?: Date;
  }> {
    const patient = await this.getNeurologyPatient(neurologyPatientId);
    if (!patient) throw new Error('Patient not found');

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const recentSeizures = patient.seizureHistory.filter(
      s => s.date >= cutoff
    );

    const byType: Record<string, number> = {};
    for (const s of recentSeizures) {
      const type = s.classification.onset;
      byType[type] = (byType[type] || 0) + 1;
    }

    const sortedSeizures = patient.seizureHistory
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    // Calculate trend by comparing halves of the period
    const halfPeriod = months / 2;
    const midpoint = new Date();
    midpoint.setMonth(midpoint.getMonth() - halfPeriod);

    const recentHalf = recentSeizures.filter(s => s.date >= midpoint).length;
    const olderHalf = recentSeizures.filter(s => s.date < midpoint).length;

    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (recentHalf < olderHalf * 0.7) trend = 'improving';
    else if (recentHalf > olderHalf * 1.3) trend = 'worsening';

    return {
      total: recentSeizures.length,
      perMonth: recentSeizures.length / months,
      byType,
      trend,
      lastSeizure: sortedSeizures[0]?.date
    };
  }

  async getHeadacheDiary(
    neurologyPatientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    headaches: HeadacheRecord[];
    totalDays: number;
    headacheDays: number;
    averageIntensity: number;
    triggerAnalysis: { trigger: string; count: number }[];
    medicationEffectiveness: { medication: string; effective: number; total: number }[];
  }> {
    const patient = await this.getNeurologyPatient(neurologyPatientId);
    if (!patient) throw new Error('Patient not found');

    const headaches = patient.headacheHistory.filter(
      h => h.date >= startDate && h.date <= endDate
    );

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const uniqueDays = new Set(
      headaches.map(h => h.date.toISOString().split('T')[0])
    );

    const triggerCounts: Record<string, number> = {};
    const medEffectiveness: Record<string, { effective: number; total: number }> = {};

    for (const h of headaches) {
      for (const trigger of h.triggers || []) {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      }

      if (h.abortiveTreatment) {
        if (!medEffectiveness[h.abortiveTreatment.medication]) {
          medEffectiveness[h.abortiveTreatment.medication] = { effective: 0, total: 0 };
        }
        medEffectiveness[h.abortiveTreatment.medication].total++;
        if (h.abortiveTreatment.effective) {
          medEffectiveness[h.abortiveTreatment.medication].effective++;
        }
      }
    }

    return {
      headaches,
      totalDays,
      headacheDays: uniqueDays.size,
      averageIntensity: headaches.length > 0
        ? headaches.reduce((a, b) => a + b.intensity, 0) / headaches.length
        : 0,
      triggerAnalysis: Object.entries(triggerCounts)
        .map(([trigger, count]) => ({ trigger, count }))
        .sort((a, b) => b.count - a.count),
      medicationEffectiveness: Object.entries(medEffectiveness)
        .map(([medication, data]) => ({
          medication,
          effective: data.effective,
          total: data.total
        }))
    };
  }

  // Database stubs
  private async saveNeurologyPatient(patient: NeurologyPatient): Promise<void> {}
  private async updateNeurologyPatient(patient: NeurologyPatient): Promise<void> {}
  private async getNeurologyPatient(id: string): Promise<NeurologyPatient | null> { return null; }
  private async alertSeizureEvent(patient: NeurologyPatient, seizure: SeizureEvent): Promise<void> {}
  private async activateStrokeProtocol(patient: NeurologyPatient, stroke: StrokeEvent): Promise<void> {}
}

export default NeurologyService;
