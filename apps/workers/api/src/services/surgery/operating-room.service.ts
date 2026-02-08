/**
 * Operating Room Service - Gestion du Bloc Opératoire
 *
 * Fonctionnalités:
 * - Planning chirurgical
 * - Gestion des salles d'opération
 * - Équipes chirurgicales
 * - Gestion anesthésie
 * - Matériel et instruments
 * - Temps opératoires
 */

// Types pour Operating Room
export interface OperatingRoom {
  id: string;
  name: string;
  code: string;
  facilityId: string;
  building: string;
  floor: string;
  type: ORType;
  status: ORStatus;
  capabilities: string[];
  equipment: EquipmentItem[];
  size: 'small' | 'medium' | 'large';
  sterileClass: 'class_a' | 'class_b' | 'class_c';
  hasLaminarFlow: boolean;
  hasRoboticSystem: boolean;
  hasVideoSystem: boolean;
  linkedRecoveryBeds: number;
  maxDuration: number; // minutes
  defaultTurnoverTime: number; // minutes
  isActive: boolean;
  maintenanceSchedule?: MaintenanceSchedule;
}

export type ORType =
  | 'general' | 'cardiac' | 'neuro' | 'orthopedic' | 'ophthalmology'
  | 'ent' | 'urology' | 'gynecology' | 'pediatric' | 'trauma'
  | 'transplant' | 'robotic' | 'hybrid' | 'ambulatory';

export type ORStatus =
  | 'available' | 'in_use' | 'turnover' | 'cleaning' | 'maintenance'
  | 'reserved' | 'blocked' | 'emergency_hold';

export interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
}

export interface MaintenanceSchedule {
  lastMaintenance: Date;
  nextMaintenance: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  notes?: string;
}

export interface SurgicalCase {
  id: string;
  caseNumber: string;
  patientId: string;
  patientName: string;
  mrn: string;
  dateOfBirth: Date;
  admissionId?: string;
  procedureId: string;
  procedureName: string;
  procedureCptCodes: string[];
  laterality?: 'left' | 'right' | 'bilateral' | 'na';
  surgeonId: string;
  surgeonName: string;
  coSurgeonId?: string;
  assistantSurgeons?: string[];
  anesthesiologistId?: string;
  anesthesiaType: AnesthesiaType;
  scheduledDate: Date;
  scheduledStartTime: Date;
  estimatedDuration: number; // minutes
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  operatingRoomId?: string;
  operatingRoomName?: string;
  status: CaseStatus;
  priority: CasePriority;
  patientClass: 'inpatient' | 'outpatient' | 'same_day' | 'emergency';
  preOpDiagnosis?: string;
  postOpDiagnosis?: string;
  icdCodes?: string[];
  surgicalTeam: SurgicalTeamMember[];
  equipment: RequiredEquipment[];
  implants?: Implant[];
  specialRequirements?: string[];
  positioning: PatientPositioning;
  bloodProducts?: BloodProductRequest;
  preOpChecklist: PreOpChecklistItem[];
  intraOpNotes?: IntraOpNote[];
  specimens?: Specimen[];
  complications?: Complication[];
  counts: SurgicalCounts;
  timeStamps: SurgicalTimeStamps;
  consent?: SurgicalConsent;
  anesthesiaRecord?: AnesthesiaRecord;
  recoveryInfo?: RecoveryInfo;
  createdAt: Date;
  updatedAt: Date;
}

export type AnesthesiaType =
  | 'general' | 'regional' | 'spinal' | 'epidural' | 'local'
  | 'mac' | 'sedation' | 'combined' | 'none';

export type CaseStatus =
  | 'requested' | 'scheduled' | 'confirmed' | 'preop_started'
  | 'in_or' | 'procedure_started' | 'closing' | 'in_recovery'
  | 'completed' | 'cancelled' | 'postponed';

export type CasePriority =
  | 'elective' | 'urgent' | 'emergent' | 'add_on';

export interface SurgicalTeamMember {
  role: TeamRole;
  userId: string;
  name: string;
  credentials?: string;
  specialty?: string;
  assignedAt: Date;
  confirmed: boolean;
}

export type TeamRole =
  | 'attending_surgeon' | 'co_surgeon' | 'assistant' | 'resident'
  | 'anesthesiologist' | 'crna' | 'circulating_nurse' | 'scrub_nurse'
  | 'surgical_tech' | 'perfusionist' | 'rep' | 'observer';

export interface RequiredEquipment {
  id: string;
  name: string;
  type: string;
  quantity: number;
  available: boolean;
  notes?: string;
}

export interface Implant {
  id: string;
  name: string;
  manufacturer: string;
  catalogNumber: string;
  lotNumber?: string;
  serialNumber?: string;
  expirationDate?: Date;
  size?: string;
  side?: 'left' | 'right';
  status: 'requested' | 'available' | 'used' | 'wasted';
  usedAt?: Date;
  documentedBy?: string;
}

export interface PatientPositioning {
  position: SurgicalPosition;
  devices: string[];
  pressurePoints: string[];
  notes?: string;
}

export type SurgicalPosition =
  | 'supine' | 'prone' | 'lateral_left' | 'lateral_right'
  | 'lithotomy' | 'trendelenburg' | 'reverse_trendelenburg'
  | 'sitting' | 'beach_chair' | 'jackknife' | 'kidney';

export interface BloodProductRequest {
  typeAndScreen: boolean;
  typeAndCrossMatch: number;
  prbcUnits: number;
  ffpUnits: number;
  plateletUnits: number;
  cryoUnits: number;
  cellSaverRequested: boolean;
  autologousDonation: boolean;
  status: 'requested' | 'available' | 'used';
}

export interface PreOpChecklistItem {
  item: string;
  category: 'identification' | 'consent' | 'site_marking' | 'labs' | 'imaging' | 'npo' | 'medications' | 'equipment';
  required: boolean;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
  exception?: string;
}

export interface IntraOpNote {
  id: string;
  timestamp: Date;
  author: string;
  type: 'narrative' | 'event' | 'complication' | 'count' | 'specimen';
  content: string;
}

export interface Specimen {
  id: string;
  type: string;
  source: string;
  collectedAt: Date;
  collectedBy: string;
  labelVerified: boolean;
  pathologyType: 'routine' | 'frozen_section' | 'culture' | 'cytology';
  result?: string;
  resultAt?: Date;
}

export interface Complication {
  id: string;
  type: string;
  severity: 'minor' | 'moderate' | 'major' | 'life_threatening';
  occurredAt: Date;
  description: string;
  intervention?: string;
  outcome?: string;
  reportedTo?: string;
}

export interface SurgicalCounts {
  initialCount: CountRecord;
  closingCount?: CountRecord;
  finalCount?: CountRecord;
  discrepancy: boolean;
  discrepancyResolution?: string;
  xrayRequired: boolean;
  xrayResult?: string;
}

export interface CountRecord {
  sponges: number;
  sharps: number;
  instruments: number;
  countedBy: string[];
  verifiedAt: Date;
  correct: boolean;
  notes?: string;
}

export interface SurgicalTimeStamps {
  patientInPreOp?: Date;
  preOpStarted?: Date;
  sentForPatient?: Date;
  patientInOR?: Date;
  anesthesiaStart?: Date;
  anesthesiaReady?: Date;
  procedureStart?: Date;
  incisionTime?: Date;
  closureStart?: Date;
  procedureEnd?: Date;
  anesthesiaEnd?: Date;
  patientOutOR?: Date;
  inRecovery?: Date;
  recoveryDischarge?: Date;
  turnoverStart?: Date;
  turnoverEnd?: Date;
}

export interface SurgicalConsent {
  procedureName: string;
  risks: string[];
  alternatives: string[];
  signedBy: string;
  relationship: string;
  signedAt: Date;
  witnessedBy: string;
  documentId?: string;
  siteMarked: boolean;
  siteMarkedBy?: string;
  siteVerified: boolean;
}

export interface AnesthesiaRecord {
  id: string;
  preOpAssessment: PreOpAnesthesiaAssessment;
  asaClass: 1 | 2 | 3 | 4 | 5 | 6;
  asaEmergency: boolean;
  malignantHyperthermiaRisk: boolean;
  difficultAirway: boolean;
  airwayClass: 1 | 2 | 3 | 4;
  anesthesiaType: AnesthesiaType;
  induction: InductionRecord;
  maintenance: MaintenanceRecord;
  emergence?: EmergenceRecord;
  medications: AnesthesiaMedication[];
  vitalSigns: AnesthesiaVitals[];
  fluids: FluidRecord[];
  events: AnesthesiaEvent[];
  bloodLoss: number;
  urineOutput: number;
  complications?: string[];
  postOpPlan: string;
}

export interface PreOpAnesthesiaAssessment {
  npoDuration: number; // hours
  lastSolidFood?: Date;
  lastClearLiquid?: Date;
  allergies: string[];
  medications: string[];
  medicalHistory: string[];
  surgicalHistory: string[];
  anesthesiaHistory: string[];
  familyAnesthesiaHistory?: string;
  smokingStatus: string;
  alcoholUse: string;
  substanceUse?: string;
  functionalCapacity: number; // METs
  heartSounds: string;
  lungSounds: string;
  airwayExam: string;
  dentition: string;
  neckMobility: string;
  mallampatiScore: 1 | 2 | 3 | 4;
  thyromental: string;
  mouthOpening: string;
}

export interface InductionRecord {
  time: Date;
  method: 'iv' | 'inhalation' | 'rapid_sequence';
  medications: { drug: string; dose: string; time: Date }[];
  airwayDevice: string;
  attempts: number;
  grade?: number;
  intubatedBy: string;
  etTubeSize?: string;
  cuffPressure?: number;
  etCO2Confirmed: boolean;
  bilateralBreathSounds: boolean;
}

export interface MaintenanceRecord {
  agents: { agent: string; concentration: string; flow: string }[];
  oxygenFlow: string;
  fio2: number;
  ventilatorMode: string;
  tidalVolume?: number;
  respiratoryRate?: number;
  peep?: number;
  neuromuscularBlockade?: string;
  twofRatio?: number;
}

export interface EmergenceRecord {
  time: Date;
  reversalAgents?: { drug: string; dose: string }[];
  extubationTime?: Date;
  extubationConditions: string;
  oxygenSaturation: number;
  respiratoryStatus: string;
  consciousness: string;
  painLevel?: number;
  nausea: boolean;
  shivering: boolean;
}

export interface AnesthesiaMedication {
  drug: string;
  dose: string;
  route: string;
  time: Date;
  givenBy: string;
}

export interface AnesthesiaVitals {
  time: Date;
  hr?: number;
  sbp?: number;
  dbp?: number;
  map?: number;
  spo2?: number;
  etco2?: number;
  temp?: number;
  rr?: number;
  fio2?: number;
  agent?: string;
  agentConcentration?: number;
}

export interface FluidRecord {
  type: string;
  volume: number;
  startTime: Date;
  endTime?: Date;
  rate?: number;
}

export interface AnesthesiaEvent {
  time: Date;
  event: string;
  action?: string;
  outcome?: string;
}

export interface RecoveryInfo {
  arrivalTime: Date;
  nurse: string;
  initialAssessment: {
    consciousness: string;
    respiration: string;
    circulation: string;
    painLevel: number;
    nausea: boolean;
    aldrete: number;
  };
  vitals: { time: Date; hr: number; bp: string; spo2: number; temp?: number }[];
  interventions: { time: Date; intervention: string; result: string }[];
  dischargeCriteria: { criterion: string; met: boolean }[];
  alderetScoreAtDischarge: number;
  dischargeTime?: Date;
  dischargedTo: 'floor' | 'icu' | 'home' | 'pacu_overnight';
  dischargedBy?: string;
}

// Scheduling
export interface ORSchedule {
  date: Date;
  operatingRoomId: string;
  blocks: ScheduleBlock[];
  cases: ScheduledCase[];
  utilization: number;
  availableMinutes: number;
  scheduledMinutes: number;
}

export interface ScheduleBlock {
  id: string;
  startTime: Date;
  endTime: Date;
  blockType: 'surgeon' | 'service' | 'open' | 'hold' | 'maintenance';
  assignedTo?: string;
  assignedService?: string;
  recurring: boolean;
  notes?: string;
}

export interface ScheduledCase {
  caseId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  estimatedDuration: number;
  procedureName: string;
  surgeonName: string;
  patientName: string;
  status: CaseStatus;
  priority: CasePriority;
}

export class OperatingRoomService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // ==================== CASE MANAGEMENT ====================

  async requestCase(data: {
    patientId: string;
    procedureId: string;
    surgeonId: string;
    preferredDate?: Date;
    preferredTime?: string;
    estimatedDuration: number;
    anesthesiaType: AnesthesiaType;
    priority: CasePriority;
    patientClass: 'inpatient' | 'outpatient' | 'same_day' | 'emergency';
    specialRequirements?: string[];
    equipment?: RequiredEquipment[];
    implants?: Omit<Implant, 'id' | 'status'>[];
    bloodProducts?: BloodProductRequest;
    requestedBy: string;
  }): Promise<SurgicalCase> {
    const caseId = crypto.randomUUID();
    const caseNumber = await this.generateCaseNumber();

    // Get patient and procedure info
    const patient = await this.getPatientInfo(data.patientId);
    const procedure = await this.getProcedureInfo(data.procedureId);
    const surgeon = await this.getSurgeonInfo(data.surgeonId);

    const surgicalCase: SurgicalCase = {
      id: caseId,
      caseNumber,
      patientId: data.patientId,
      patientName: patient.name,
      mrn: patient.mrn,
      dateOfBirth: patient.dob,
      procedureId: data.procedureId,
      procedureName: procedure.name,
      procedureCptCodes: procedure.cptCodes,
      surgeonId: data.surgeonId,
      surgeonName: surgeon.name,
      anesthesiaType: data.anesthesiaType,
      scheduledDate: data.preferredDate || new Date(),
      scheduledStartTime: data.preferredDate || new Date(),
      estimatedDuration: data.estimatedDuration,
      status: 'requested',
      priority: data.priority,
      patientClass: data.patientClass,
      surgicalTeam: [{
        role: 'attending_surgeon',
        userId: data.surgeonId,
        name: surgeon.name,
        credentials: surgeon.credentials,
        specialty: surgeon.specialty,
        assignedAt: new Date(),
        confirmed: true
      }],
      equipment: data.equipment || [],
      implants: data.implants?.map(i => ({ ...i, id: crypto.randomUUID(), status: 'requested' as const })),
      specialRequirements: data.specialRequirements,
      positioning: { position: 'supine', devices: [], pressurePoints: [] },
      bloodProducts: data.bloodProducts,
      preOpChecklist: this.createDefaultChecklist(data.patientClass),
      counts: {
        initialCount: { sponges: 0, sharps: 0, instruments: 0, countedBy: [], verifiedAt: new Date(), correct: true },
        discrepancy: false,
        xrayRequired: false
      },
      timeStamps: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveSurgicalCase(surgicalCase);

    // If emergency, auto-schedule
    if (data.priority === 'emergent') {
      return this.scheduleEmergencyCase(surgicalCase);
    }

    return surgicalCase;
  }

  async scheduleCase(
    caseId: string,
    scheduledDate: Date,
    scheduledTime: Date,
    operatingRoomId: string,
    scheduledBy: string
  ): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    // Validate OR availability
    const isAvailable = await this.checkORAvailability(
      operatingRoomId,
      scheduledDate,
      scheduledTime,
      surgicalCase.estimatedDuration
    );

    if (!isAvailable) {
      throw new Error('Operating room not available for requested time');
    }

    // Validate equipment availability
    if (surgicalCase.equipment.length > 0) {
      const equipmentAvailable = await this.checkEquipmentAvailability(
        surgicalCase.equipment,
        scheduledDate
      );
      if (!equipmentAvailable) {
        throw new Error('Required equipment not available');
      }
    }

    surgicalCase.scheduledDate = scheduledDate;
    surgicalCase.scheduledStartTime = scheduledTime;
    surgicalCase.operatingRoomId = operatingRoomId;
    surgicalCase.operatingRoomName = (await this.getOperatingRoom(operatingRoomId))?.name;
    surgicalCase.status = 'scheduled';
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);

    // Send notifications
    await this.notifyCaseScheduled(surgicalCase);

    return surgicalCase;
  }

  async confirmCase(caseId: string, confirmedBy: string): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.status = 'confirmed';
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async cancelCase(caseId: string, reason: string, cancelledBy: string): Promise<void> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    if (['in_or', 'procedure_started', 'closing'].includes(surgicalCase.status)) {
      throw new Error('Cannot cancel case that is in progress');
    }

    surgicalCase.status = 'cancelled';
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    await this.logOREvent(caseId, 'case_cancelled', cancelledBy, { reason });

    // Notify and release resources
    await this.notifyCaseCancelled(surgicalCase, reason);
    await this.releaseORSlot(surgicalCase);
  }

  async postponeCase(
    caseId: string,
    newDate: Date,
    reason: string,
    postponedBy: string
  ): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    const oldDate = surgicalCase.scheduledDate;

    surgicalCase.status = 'postponed';
    surgicalCase.scheduledDate = newDate;
    surgicalCase.operatingRoomId = undefined; // Need to reschedule
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    await this.logOREvent(caseId, 'case_postponed', postponedBy, { oldDate, newDate, reason });

    // Release old slot
    await this.releaseORSlot({ ...surgicalCase, scheduledDate: oldDate });

    return surgicalCase;
  }

  // ==================== CASE WORKFLOW ====================

  async startPreOp(caseId: string, startedBy: string): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.status = 'preop_started';
    surgicalCase.timeStamps.preOpStarted = new Date();
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async patientInOR(caseId: string, recordedBy: string): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.status = 'in_or';
    surgicalCase.timeStamps.patientInOR = new Date();
    surgicalCase.actualStartTime = new Date();
    surgicalCase.updatedAt = new Date();

    // Update OR status
    if (surgicalCase.operatingRoomId) {
      await this.updateORStatus(surgicalCase.operatingRoomId, 'in_use');
    }

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async procedureStart(caseId: string, startedBy: string): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.status = 'procedure_started';
    surgicalCase.timeStamps.procedureStart = new Date();
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async recordIncision(caseId: string, recordedBy: string): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.timeStamps.incisionTime = new Date();
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async startClosing(caseId: string, recordedBy: string): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.status = 'closing';
    surgicalCase.timeStamps.closureStart = new Date();
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async procedureEnd(caseId: string, endedBy: string): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.timeStamps.procedureEnd = new Date();
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async patientOutOR(caseId: string, recordedBy: string): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.status = 'in_recovery';
    surgicalCase.timeStamps.patientOutOR = new Date();
    surgicalCase.actualEndTime = new Date();
    surgicalCase.actualDuration = surgicalCase.actualStartTime
      ? Math.round((surgicalCase.actualEndTime.getTime() - surgicalCase.actualStartTime.getTime()) / 60000)
      : undefined;
    surgicalCase.updatedAt = new Date();

    // Update OR status to turnover
    if (surgicalCase.operatingRoomId) {
      await this.updateORStatus(surgicalCase.operatingRoomId, 'turnover');
      surgicalCase.timeStamps.turnoverStart = new Date();
    }

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async completeCase(caseId: string, completedBy: string): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.status = 'completed';
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    await this.logOREvent(caseId, 'case_completed', completedBy, {
      duration: surgicalCase.actualDuration
    });

    return surgicalCase;
  }

  // ==================== COUNTS ====================

  async recordInitialCount(
    caseId: string,
    sponges: number,
    sharps: number,
    instruments: number,
    countedBy: string[]
  ): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.counts.initialCount = {
      sponges,
      sharps,
      instruments,
      countedBy,
      verifiedAt: new Date(),
      correct: true
    };
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async recordClosingCount(
    caseId: string,
    sponges: number,
    sharps: number,
    instruments: number,
    countedBy: string[]
  ): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    const initial = surgicalCase.counts.initialCount;
    const correct = sponges === initial.sponges &&
                   sharps === initial.sharps &&
                   instruments === initial.instruments;

    surgicalCase.counts.closingCount = {
      sponges,
      sharps,
      instruments,
      countedBy,
      verifiedAt: new Date(),
      correct
    };

    surgicalCase.counts.discrepancy = !correct;
    surgicalCase.updatedAt = new Date();

    if (!correct) {
      // Alert for count discrepancy
      await this.alertCountDiscrepancy(surgicalCase);
    }

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  async resolveCountDiscrepancy(
    caseId: string,
    resolution: string,
    xrayRequired: boolean,
    xrayResult?: string,
    resolvedBy?: string
  ): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    surgicalCase.counts.discrepancyResolution = resolution;
    surgicalCase.counts.xrayRequired = xrayRequired;
    surgicalCase.counts.xrayResult = xrayResult;
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    await this.logOREvent(caseId, 'count_discrepancy_resolved', resolvedBy || 'system', {
      resolution,
      xrayRequired,
      xrayResult
    });

    return surgicalCase;
  }

  // ==================== SPECIMENS ====================

  async recordSpecimen(
    caseId: string,
    specimen: Omit<Specimen, 'id'>
  ): Promise<Specimen> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    const newSpecimen: Specimen = {
      ...specimen,
      id: crypto.randomUUID()
    };

    if (!surgicalCase.specimens) {
      surgicalCase.specimens = [];
    }
    surgicalCase.specimens.push(newSpecimen);
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);

    // Send to pathology
    await this.sendToPathology(newSpecimen, surgicalCase);

    return newSpecimen;
  }

  async recordSpecimenResult(
    caseId: string,
    specimenId: string,
    result: string
  ): Promise<Specimen> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    const specimen = surgicalCase.specimens?.find(s => s.id === specimenId);
    if (!specimen) {
      throw new Error('Specimen not found');
    }

    specimen.result = result;
    specimen.resultAt = new Date();

    await this.updateSurgicalCase(surgicalCase);

    // Notify surgeon of result
    await this.notifySpecimenResult(surgicalCase, specimen);

    return specimen;
  }

  // ==================== ANESTHESIA ====================

  async createAnesthesiaRecord(
    caseId: string,
    preOpAssessment: PreOpAnesthesiaAssessment,
    anesthesiologistId: string
  ): Promise<AnesthesiaRecord> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    const record: AnesthesiaRecord = {
      id: crypto.randomUUID(),
      preOpAssessment,
      asaClass: this.calculateASAClass(preOpAssessment),
      asaEmergency: surgicalCase.priority === 'emergent',
      malignantHyperthermiaRisk: false,
      difficultAirway: this.assessDifficultAirway(preOpAssessment),
      airwayClass: preOpAssessment.mallampatiScore,
      anesthesiaType: surgicalCase.anesthesiaType,
      induction: {
        time: new Date(),
        method: 'iv',
        medications: [],
        airwayDevice: '',
        attempts: 0,
        intubatedBy: '',
        etCO2Confirmed: false,
        bilateralBreathSounds: false
      },
      maintenance: {
        agents: [],
        oxygenFlow: '',
        fio2: 0,
        ventilatorMode: ''
      },
      medications: [],
      vitalSigns: [],
      fluids: [],
      events: [],
      bloodLoss: 0,
      urineOutput: 0,
      postOpPlan: ''
    };

    surgicalCase.anesthesiaRecord = record;
    surgicalCase.anesthesiologistId = anesthesiologistId;
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return record;
  }

  async recordAnesthesiaVitals(
    caseId: string,
    vitals: AnesthesiaVitals
  ): Promise<void> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase || !surgicalCase.anesthesiaRecord) {
      throw new Error('Anesthesia record not found');
    }

    surgicalCase.anesthesiaRecord.vitalSigns.push(vitals);
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
  }

  async recordAnesthesiaMedication(
    caseId: string,
    medication: AnesthesiaMedication
  ): Promise<void> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase || !surgicalCase.anesthesiaRecord) {
      throw new Error('Anesthesia record not found');
    }

    surgicalCase.anesthesiaRecord.medications.push(medication);
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
  }

  // ==================== RECOVERY (PACU) ====================

  async admitToRecovery(
    caseId: string,
    nurseId: string,
    initialAssessment: RecoveryInfo['initialAssessment']
  ): Promise<RecoveryInfo> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase) {
      throw new Error('Case not found');
    }

    const recoveryInfo: RecoveryInfo = {
      arrivalTime: new Date(),
      nurse: nurseId,
      initialAssessment,
      vitals: [],
      interventions: [],
      dischargeCriteria: this.getRecoveryDischargeCriteria(),
      alderetScoreAtDischarge: 0,
      dischargedTo: 'floor'
    };

    surgicalCase.recoveryInfo = recoveryInfo;
    surgicalCase.timeStamps.inRecovery = new Date();
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return recoveryInfo;
  }

  async recordRecoveryVitals(
    caseId: string,
    vitals: RecoveryInfo['vitals'][0]
  ): Promise<void> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase || !surgicalCase.recoveryInfo) {
      throw new Error('Recovery record not found');
    }

    surgicalCase.recoveryInfo.vitals.push(vitals);
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
  }

  async dischargeFromRecovery(
    caseId: string,
    alderetScore: number,
    dischargeTo: RecoveryInfo['dischargedTo'],
    dischargedBy: string
  ): Promise<SurgicalCase> {
    const surgicalCase = await this.getSurgicalCase(caseId);
    if (!surgicalCase || !surgicalCase.recoveryInfo) {
      throw new Error('Recovery record not found');
    }

    // Validate Aldrete score
    if (alderetScore < 9 && dischargeTo === 'home') {
      throw new Error('Aldrete score must be 9 or higher for discharge home');
    }

    surgicalCase.recoveryInfo.alderetScoreAtDischarge = alderetScore;
    surgicalCase.recoveryInfo.dischargeTime = new Date();
    surgicalCase.recoveryInfo.dischargedTo = dischargeTo;
    surgicalCase.recoveryInfo.dischargedBy = dischargedBy;

    surgicalCase.timeStamps.recoveryDischarge = new Date();
    surgicalCase.status = 'completed';
    surgicalCase.updatedAt = new Date();

    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  // ==================== SCHEDULING ====================

  async getORSchedule(
    date: Date,
    operatingRoomId?: string
  ): Promise<ORSchedule[]> {
    const rooms = operatingRoomId
      ? [await this.getOperatingRoom(operatingRoomId)].filter(Boolean)
      : await this.getAllOperatingRooms();

    const schedules: ORSchedule[] = [];

    for (const room of rooms) {
      if (!room) continue;

      const cases = await this.getCasesForOR(room.id, date);
      const blocks = await this.getBlocksForOR(room.id, date);

      const scheduledMinutes = cases.reduce((sum, c) => sum + c.estimatedDuration, 0);
      const availableMinutes = await this.getAvailableMinutes(room.id, date);

      schedules.push({
        date,
        operatingRoomId: room.id,
        blocks,
        cases: cases.map(c => ({
          caseId: c.id,
          scheduledStart: c.scheduledStartTime,
          scheduledEnd: new Date(c.scheduledStartTime.getTime() + c.estimatedDuration * 60000),
          estimatedDuration: c.estimatedDuration,
          procedureName: c.procedureName,
          surgeonName: c.surgeonName,
          patientName: c.patientName,
          status: c.status,
          priority: c.priority
        })),
        utilization: availableMinutes > 0 ? (scheduledMinutes / availableMinutes) * 100 : 0,
        availableMinutes,
        scheduledMinutes
      });
    }

    return schedules;
  }

  async findAvailableSlot(
    duration: number,
    preferredDate: Date,
    surgeonId: string,
    requirements?: {
      orType?: ORType;
      equipment?: string[];
      roomPreference?: string;
    }
  ): Promise<{
    operatingRoomId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
  }[]> {
    const options: any[] = [];

    // Search within 14 days of preferred date
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const searchDate = new Date(preferredDate);
      searchDate.setDate(searchDate.getDate() + dayOffset);

      // Check surgeon availability
      const surgeonAvailable = await this.checkSurgeonAvailability(surgeonId, searchDate);
      if (!surgeonAvailable) continue;

      // Get available rooms
      const rooms = await this.getAvailableRooms(searchDate, requirements);

      for (const room of rooms) {
        const slots = await this.findAvailableSlotsInRoom(room.id, searchDate, duration);
        for (const slot of slots) {
          options.push({
            operatingRoomId: room.id,
            date: searchDate,
            startTime: slot.start,
            endTime: slot.end
          });
        }
      }
    }

    return options;
  }

  // ==================== HELPER METHODS ====================

  private createDefaultChecklist(patientClass: string): PreOpChecklistItem[] {
    return [
      { item: 'Patient identification verified', category: 'identification', required: true, completed: false },
      { item: 'Consent signed', category: 'consent', required: true, completed: false },
      { item: 'Site marked', category: 'site_marking', required: true, completed: false },
      { item: 'NPO status confirmed', category: 'npo', required: true, completed: false },
      { item: 'Labs reviewed', category: 'labs', required: false, completed: false },
      { item: 'Imaging available', category: 'imaging', required: false, completed: false },
      { item: 'Allergies reviewed', category: 'medications', required: true, completed: false },
      { item: 'Home medications reviewed', category: 'medications', required: true, completed: false },
      { item: 'Anesthesia assessment complete', category: 'consent', required: true, completed: false },
      { item: 'Required equipment available', category: 'equipment', required: true, completed: false }
    ];
  }

  private calculateASAClass(assessment: PreOpAnesthesiaAssessment): 1 | 2 | 3 | 4 | 5 | 6 {
    // Simplified ASA classification
    const seriousConditions = assessment.medicalHistory.filter(h =>
      ['heart failure', 'copd', 'renal failure', 'diabetes', 'stroke'].some(c =>
        h.toLowerCase().includes(c)
      )
    ).length;

    if (seriousConditions >= 3) return 4;
    if (seriousConditions >= 2) return 3;
    if (seriousConditions >= 1 || assessment.medicalHistory.length > 0) return 2;
    return 1;
  }

  private assessDifficultAirway(assessment: PreOpAnesthesiaAssessment): boolean {
    return assessment.mallampatiScore >= 3 ||
           assessment.mouthOpening === 'limited' ||
           assessment.neckMobility === 'limited' ||
           assessment.anesthesiaHistory.some(h => h.toLowerCase().includes('difficult'));
  }

  private getRecoveryDischargeCriteria(): { criterion: string; met: boolean }[] {
    return [
      { criterion: 'Activity - able to move 4 extremities', met: false },
      { criterion: 'Respiration - able to breathe deeply and cough', met: false },
      { criterion: 'Circulation - BP within 20% of baseline', met: false },
      { criterion: 'Consciousness - fully awake', met: false },
      { criterion: 'O2 saturation > 92% on room air', met: false },
      { criterion: 'Pain controlled', met: false },
      { criterion: 'Nausea/vomiting controlled', met: false },
      { criterion: 'Surgical site stable', met: false }
    ];
  }

  private async scheduleEmergencyCase(surgicalCase: SurgicalCase): Promise<SurgicalCase> {
    // Find first available OR or bump elective case
    const availableOR = await this.findEmergencyOR();
    if (availableOR) {
      surgicalCase.operatingRoomId = availableOR.id;
      surgicalCase.operatingRoomName = availableOR.name;
      surgicalCase.scheduledStartTime = new Date();
      surgicalCase.status = 'confirmed';
    }
    await this.updateSurgicalCase(surgicalCase);
    return surgicalCase;
  }

  private async generateCaseNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `OR${dateStr}${random}`;
  }

  // Database stubs
  private async saveSurgicalCase(surgicalCase: SurgicalCase): Promise<void> {}
  private async updateSurgicalCase(surgicalCase: SurgicalCase): Promise<void> {}
  private async getSurgicalCase(id: string): Promise<SurgicalCase | null> { return null; }
  private async getOperatingRoom(id: string): Promise<OperatingRoom | null> { return null; }
  private async getAllOperatingRooms(): Promise<OperatingRoom[]> { return []; }
  private async getCasesForOR(orId: string, date: Date): Promise<SurgicalCase[]> { return []; }
  private async getBlocksForOR(orId: string, date: Date): Promise<ScheduleBlock[]> { return []; }
  private async getPatientInfo(id: string): Promise<any> { return {}; }
  private async getProcedureInfo(id: string): Promise<any> { return {}; }
  private async getSurgeonInfo(id: string): Promise<any> { return {}; }
  private async checkORAvailability(orId: string, date: Date, time: Date, duration: number): Promise<boolean> { return true; }
  private async checkEquipmentAvailability(equipment: RequiredEquipment[], date: Date): Promise<boolean> { return true; }
  private async checkSurgeonAvailability(surgeonId: string, date: Date): Promise<boolean> { return true; }
  private async getAvailableMinutes(orId: string, date: Date): Promise<number> { return 480; }
  private async getAvailableRooms(date: Date, requirements?: any): Promise<OperatingRoom[]> { return []; }
  private async findAvailableSlotsInRoom(orId: string, date: Date, duration: number): Promise<{ start: Date; end: Date }[]> { return []; }
  private async findEmergencyOR(): Promise<OperatingRoom | null> { return null; }
  private async updateORStatus(orId: string, status: ORStatus): Promise<void> {}
  private async releaseORSlot(surgicalCase: SurgicalCase): Promise<void> {}
  private async logOREvent(caseId: string, event: string, userId: string, data: any): Promise<void> {}
  private async notifyCaseScheduled(surgicalCase: SurgicalCase): Promise<void> {}
  private async notifyCaseCancelled(surgicalCase: SurgicalCase, reason: string): Promise<void> {}
  private async alertCountDiscrepancy(surgicalCase: SurgicalCase): Promise<void> {}
  private async sendToPathology(specimen: Specimen, surgicalCase: SurgicalCase): Promise<void> {}
  private async notifySpecimenResult(surgicalCase: SurgicalCase, specimen: Specimen): Promise<void> {}
}

export default OperatingRoomService;
