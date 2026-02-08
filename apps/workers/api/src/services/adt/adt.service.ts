/**
 * ADT Service - Admission, Discharge, Transfer
 *
 * Fonctionnalités:
 * - Gestion des admissions hospitalières
 * - Sorties et transferts
 * - Gestion des lits et unités
 * - Census en temps réel
 * - Historique des mouvements
 */

// Types pour ADT
export interface Admission {
  id: string;
  patientId: string;
  visitNumber: string;
  admissionNumber: string;
  admissionType: AdmissionType;
  admissionClass: AdmissionClass;
  admissionSource: AdmissionSource;
  admissionDateTime: Date;
  expectedDischargeDate?: Date;
  admittingPhysicianId: string;
  attendingPhysicianId: string;
  primaryDiagnosis?: string;
  admissionDiagnosis?: string;
  icdCodes?: string[];
  drgCode?: string;
  chiefComplaint?: string;
  reasonForAdmission: string;
  priority: 'elective' | 'urgent' | 'emergent';
  status: AdmissionStatus;
  location: PatientLocation;
  previousLocations: LocationHistory[];
  isolationStatus?: IsolationStatus;
  codeStatus: CodeStatus;
  allergies: string[];
  specialNeeds?: string[];
  dietOrder?: string;
  activityOrder?: string;
  fallRiskLevel: 'low' | 'moderate' | 'high';
  vteRiskLevel: 'low' | 'moderate' | 'high';
  pressureUlcerRisk: 'low' | 'moderate' | 'high';
  insuranceInfo?: InsuranceInfo;
  guarantor?: GuarantorInfo;
  emergencyContact?: EmergencyContact;
  advanceDirectives?: AdvanceDirective[];
  consents: Consent[];
  precertification?: Precertification;
  estimatedCharges?: number;
  actualCharges?: number;
  dischargeInfo?: DischargeInfo;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type AdmissionType =
  | 'inpatient' | 'observation' | 'outpatient' | 'emergency'
  | 'same_day_surgery' | 'recurring' | 'newborn';

export type AdmissionClass =
  | 'medical' | 'surgical' | 'obstetric' | 'psychiatric'
  | 'rehabilitation' | 'skilled_nursing' | 'hospice';

export type AdmissionSource =
  | 'physician_referral' | 'emergency_room' | 'transfer_hospital'
  | 'transfer_snf' | 'court_law' | 'self_referral' | 'newborn';

export type AdmissionStatus =
  | 'pending' | 'pre_admitted' | 'admitted' | 'in_house'
  | 'pending_discharge' | 'discharged' | 'cancelled';

export interface PatientLocation {
  facility: string;
  building?: string;
  floor: string;
  unit: string;
  room: string;
  bed: string;
  bedStatus: BedStatus;
  assignedAt: Date;
  assignedBy: string;
  nurseStation?: string;
  attendingPhysician?: string;
}

export type BedStatus =
  | 'occupied' | 'available' | 'cleaning' | 'maintenance'
  | 'blocked' | 'reserved' | 'isolation';

export interface LocationHistory {
  location: PatientLocation;
  fromDateTime: Date;
  toDateTime: Date;
  reason: string;
  transferredBy: string;
}

export interface IsolationStatus {
  type: IsolationType;
  reason: string;
  organism?: string;
  startDate: Date;
  endDate?: Date;
  precautions: string[];
  ppe: string[];
}

export type IsolationType =
  | 'contact' | 'droplet' | 'airborne' | 'protective'
  | 'contact_enteric' | 'contact_mrsa' | 'neutropenic';

export interface CodeStatus {
  code: 'full_code' | 'dnr' | 'dni' | 'dnr_dni' | 'comfort_care';
  documentedAt: Date;
  documentedBy: string;
  notes?: string;
}

export interface InsuranceInfo {
  primaryInsurance: Insurance;
  secondaryInsurance?: Insurance;
  tertiaryInsurance?: Insurance;
  authorizationNumber?: string;
  authorizedDays?: number;
  authorizationExpiry?: Date;
}

export interface Insurance {
  payerId: string;
  payerName: string;
  planName: string;
  memberId: string;
  groupNumber?: string;
  subscriberName: string;
  subscriberRelation: string;
  effectiveDate: Date;
  terminationDate?: Date;
  copay?: number;
  deductible?: number;
  deductibleMet?: number;
  outOfPocketMax?: number;
  outOfPocketMet?: number;
}

export interface GuarantorInfo {
  name: string;
  relation: string;
  address: string;
  phone: string;
  email?: string;
  employer?: string;
  ssn?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  isLegalGuardian: boolean;
  canMakeDecisions: boolean;
}

export interface AdvanceDirective {
  type: 'living_will' | 'poa_healthcare' | 'dnr_order' | 'polst' | 'other';
  documentDate: Date;
  documentLocation?: string;
  notes?: string;
}

export interface Consent {
  type: string;
  signedAt: Date;
  signedBy: string;
  relationship: string;
  witnessedBy: string;
  documentId?: string;
}

export interface Precertification {
  authorizationNumber: string;
  authorizedFrom: Date;
  authorizedTo: Date;
  authorizedDays: number;
  usedDays: number;
  remainingDays: number;
  services: string[];
  status: 'approved' | 'pending' | 'denied' | 'expired';
}

export interface DischargeInfo {
  dischargeDateTime: Date;
  dischargeDisposition: DischargeDisposition;
  dischargeType: 'routine' | 'ama' | 'expired' | 'transfer' | 'elopement';
  dischargedBy: string;
  dischargeDiagnosis?: string;
  icdCodes?: string[];
  drgCode?: string;
  actualLengthOfStay: number;
  dischargeToLocation?: string;
  transportMode?: string;
  followUpInstructions?: string;
  followUpAppointments?: FollowUpAppointment[];
  dischargeCondition: 'improved' | 'unchanged' | 'worsened' | 'expired';
  dischargeMedications?: string[];
  homeHealth?: boolean;
  dme?: string[];
}

export type DischargeDisposition =
  | 'home' | 'home_with_services' | 'snf' | 'rehab' | 'ltac'
  | 'hospice_home' | 'hospice_facility' | 'psychiatric' | 'another_hospital'
  | 'ama' | 'expired' | 'other';

export interface FollowUpAppointment {
  provider: string;
  specialty: string;
  scheduledDate?: Date;
  timeframe: string;
  reason: string;
  instructions?: string;
}

// Bed Management
export interface Bed {
  id: string;
  facilityId: string;
  building: string;
  floor: string;
  unit: string;
  room: string;
  bedNumber: string;
  bedType: BedType;
  status: BedStatus;
  features: string[];
  currentPatientId?: string;
  currentAdmissionId?: string;
  lastCleanedAt?: Date;
  lastMaintenanceAt?: Date;
  outOfServiceReason?: string;
  outOfServiceUntil?: Date;
  reservedFor?: {
    patientId: string;
    admissionId: string;
    reservedUntil: Date;
  };
}

export type BedType =
  | 'standard' | 'icu' | 'ccu' | 'nicu' | 'picu' | 'burn'
  | 'isolation' | 'bariatric' | 'psychiatric' | 'labor_delivery'
  | 'recovery' | 'step_down' | 'telemetry';

export interface Unit {
  id: string;
  facilityId: string;
  name: string;
  code: string;
  type: UnitType;
  floor: string;
  building: string;
  totalBeds: number;
  operationalBeds: number;
  nurseStation: string;
  nurseManagerId?: string;
  chargeNurseId?: string;
  specialties: string[];
  acceptingAdmissions: boolean;
  targetOccupancy: number;
  maxOccupancy: number;
}

export type UnitType =
  | 'medical' | 'surgical' | 'icu' | 'ccu' | 'nicu' | 'picu'
  | 'maternity' | 'pediatric' | 'psychiatric' | 'rehabilitation'
  | 'oncology' | 'cardiac' | 'neuro' | 'orthopedic' | 'step_down'
  | 'telemetry' | 'emergency' | 'observation';

export interface Transfer {
  id: string;
  admissionId: string;
  patientId: string;
  fromLocation: PatientLocation;
  toLocation: PatientLocation;
  transferType: TransferType;
  requestedAt: Date;
  requestedBy: string;
  reason: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: TransferStatus;
  approvedBy?: string;
  approvedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  specialRequirements?: string[];
}

export type TransferType =
  | 'internal' | 'step_up' | 'step_down' | 'external'
  | 'procedure' | 'diagnostic' | 'therapy';

export type TransferStatus =
  | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

// Census and Metrics
export interface CensusSnapshot {
  timestamp: Date;
  facilityId: string;
  totalBeds: number;
  operationalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  blockedBeds: number;
  cleaningBeds: number;
  occupancyRate: number;
  admissionsToday: number;
  dischargesToday: number;
  transfersToday: number;
  pendingAdmissions: number;
  pendingDischarges: number;
  pendingTransfers: number;
  byUnit: UnitCensus[];
  byService: ServiceCensus[];
  byInsurance: { payer: string; count: number }[];
}

export interface UnitCensus {
  unitId: string;
  unitName: string;
  totalBeds: number;
  occupied: number;
  available: number;
  blocked: number;
  occupancyRate: number;
  avgLOS: number;
  pendingAdmissions: number;
  pendingDischarges: number;
}

export interface ServiceCensus {
  service: string;
  attendingPhysician: string;
  patientCount: number;
  avgLOS: number;
  pendingDischarges: number;
}

export class ADTService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // ==================== ADMISSIONS ====================

  async createAdmission(data: {
    patientId: string;
    admissionType: AdmissionType;
    admissionClass: AdmissionClass;
    admissionSource: AdmissionSource;
    admittingPhysicianId: string;
    attendingPhysicianId: string;
    reasonForAdmission: string;
    priority: 'elective' | 'urgent' | 'emergent';
    requestedUnit?: string;
    requestedRoom?: string;
    isolationType?: IsolationType;
    specialNeeds?: string[];
    createdBy: string;
  }): Promise<Admission> {
    const admissionId = crypto.randomUUID();
    const visitNumber = await this.generateVisitNumber();
    const admissionNumber = await this.generateAdmissionNumber();

    // Find available bed
    const location = await this.findAvailableBed({
      admissionType: data.admissionType,
      admissionClass: data.admissionClass,
      requestedUnit: data.requestedUnit,
      requestedRoom: data.requestedRoom,
      isolationType: data.isolationType,
      specialNeeds: data.specialNeeds
    });

    if (!location) {
      throw new Error('No suitable bed available');
    }

    const admission: Admission = {
      id: admissionId,
      patientId: data.patientId,
      visitNumber,
      admissionNumber,
      admissionType: data.admissionType,
      admissionClass: data.admissionClass,
      admissionSource: data.admissionSource,
      admissionDateTime: new Date(),
      admittingPhysicianId: data.admittingPhysicianId,
      attendingPhysicianId: data.attendingPhysicianId,
      reasonForAdmission: data.reasonForAdmission,
      priority: data.priority,
      status: 'admitted',
      location,
      previousLocations: [],
      codeStatus: {
        code: 'full_code',
        documentedAt: new Date(),
        documentedBy: data.createdBy
      },
      allergies: [],
      fallRiskLevel: 'moderate',
      vteRiskLevel: 'moderate',
      pressureUlcerRisk: 'low',
      consents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy
    };

    if (data.isolationType) {
      admission.isolationStatus = {
        type: data.isolationType,
        reason: 'Admission requirement',
        startDate: new Date(),
        precautions: this.getIsolationPrecautions(data.isolationType),
        ppe: this.getRequiredPPE(data.isolationType)
      };
    }

    // Assign bed
    await this.assignBed(location, admissionId, data.patientId);

    // Save admission
    await this.saveAdmission(admission);

    // Send notifications
    await this.notifyAdmission(admission);

    // Create admission orders
    await this.createAdmissionOrders(admission);

    return admission;
  }

  async preAdmit(data: {
    patientId: string;
    scheduledAdmissionDate: Date;
    admissionType: AdmissionType;
    admissionClass: AdmissionClass;
    admittingPhysicianId: string;
    attendingPhysicianId: string;
    reasonForAdmission: string;
    requestedUnit?: string;
    requestedRoom?: string;
    createdBy: string;
  }): Promise<Admission> {
    const admissionId = crypto.randomUUID();
    const visitNumber = await this.generateVisitNumber();
    const admissionNumber = await this.generateAdmissionNumber();

    const admission: Admission = {
      id: admissionId,
      patientId: data.patientId,
      visitNumber,
      admissionNumber,
      admissionType: data.admissionType,
      admissionClass: data.admissionClass,
      admissionSource: 'physician_referral',
      admissionDateTime: data.scheduledAdmissionDate,
      admittingPhysicianId: data.admittingPhysicianId,
      attendingPhysicianId: data.attendingPhysicianId,
      reasonForAdmission: data.reasonForAdmission,
      priority: 'elective',
      status: 'pre_admitted',
      location: {
        facility: 'main',
        floor: 'TBD',
        unit: data.requestedUnit || 'TBD',
        room: data.requestedRoom || 'TBD',
        bed: 'TBD',
        bedStatus: 'reserved',
        assignedAt: new Date(),
        assignedBy: data.createdBy
      },
      previousLocations: [],
      codeStatus: {
        code: 'full_code',
        documentedAt: new Date(),
        documentedBy: data.createdBy
      },
      allergies: [],
      fallRiskLevel: 'moderate',
      vteRiskLevel: 'moderate',
      pressureUlcerRisk: 'low',
      consents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy
    };

    await this.saveAdmission(admission);
    return admission;
  }

  async convertPreAdmitToAdmit(
    admissionId: string,
    location: PatientLocation,
    convertedBy: string
  ): Promise<Admission> {
    const admission = await this.getAdmission(admissionId);
    if (!admission) {
      throw new Error('Admission not found');
    }

    if (admission.status !== 'pre_admitted') {
      throw new Error('Can only convert pre-admitted patients');
    }

    admission.status = 'admitted';
    admission.admissionDateTime = new Date();
    admission.location = location;
    admission.updatedAt = new Date();

    await this.assignBed(location, admissionId, admission.patientId);
    await this.updateAdmission(admission);
    await this.notifyAdmission(admission);

    return admission;
  }

  async updateAdmissionInfo(
    admissionId: string,
    updates: Partial<Admission>,
    updatedBy: string
  ): Promise<Admission> {
    const admission = await this.getAdmission(admissionId);
    if (!admission) {
      throw new Error('Admission not found');
    }

    // Apply updates
    Object.assign(admission, updates, { updatedAt: new Date() });

    await this.updateAdmission(admission);
    await this.logADTEvent(admissionId, 'admission_updated', updatedBy, updates);

    return admission;
  }

  // ==================== TRANSFERS ====================

  async requestTransfer(data: {
    admissionId: string;
    toUnit: string;
    toRoom?: string;
    toBed?: string;
    transferType: TransferType;
    reason: string;
    priority: 'routine' | 'urgent' | 'stat';
    specialRequirements?: string[];
    requestedBy: string;
  }): Promise<Transfer> {
    const admission = await this.getAdmission(data.admissionId);
    if (!admission) {
      throw new Error('Admission not found');
    }

    // Find available bed in destination
    const toLocation = await this.findAvailableBedInUnit(
      data.toUnit,
      data.toRoom,
      data.toBed
    );

    if (!toLocation && data.priority !== 'stat') {
      throw new Error('No bed available in requested unit');
    }

    const transfer: Transfer = {
      id: crypto.randomUUID(),
      admissionId: data.admissionId,
      patientId: admission.patientId,
      fromLocation: admission.location,
      toLocation: toLocation || {
        facility: admission.location.facility,
        floor: 'TBD',
        unit: data.toUnit,
        room: data.toRoom || 'TBD',
        bed: data.toBed || 'TBD',
        bedStatus: 'reserved',
        assignedAt: new Date(),
        assignedBy: data.requestedBy
      },
      transferType: data.transferType,
      requestedAt: new Date(),
      requestedBy: data.requestedBy,
      reason: data.reason,
      priority: data.priority,
      status: 'pending',
      specialRequirements: data.specialRequirements
    };

    await this.saveTransfer(transfer);

    // Auto-approve for stat transfers
    if (data.priority === 'stat') {
      return this.approveTransfer(transfer.id, data.requestedBy);
    }

    // Notify bed management
    await this.notifyTransferRequest(transfer);

    return transfer;
  }

  async approveTransfer(transferId: string, approvedBy: string): Promise<Transfer> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    transfer.status = 'approved';
    transfer.approvedBy = approvedBy;
    transfer.approvedAt = new Date();

    await this.updateTransfer(transfer);
    await this.notifyTransferApproved(transfer);

    return transfer;
  }

  async executeTransfer(transferId: string, executedBy: string): Promise<Transfer> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'approved') {
      throw new Error('Transfer must be approved before execution');
    }

    const admission = await this.getAdmission(transfer.admissionId);
    if (!admission) {
      throw new Error('Admission not found');
    }

    // Update transfer status
    transfer.status = 'in_progress';
    await this.updateTransfer(transfer);

    // Release old bed
    await this.releaseBed(admission.location);

    // Record location history
    admission.previousLocations.push({
      location: admission.location,
      fromDateTime: admission.location.assignedAt,
      toDateTime: new Date(),
      reason: transfer.reason,
      transferredBy: executedBy
    });

    // Assign new bed
    await this.assignBed(transfer.toLocation, admission.id, admission.patientId);

    // Update admission location
    admission.location = {
      ...transfer.toLocation,
      assignedAt: new Date(),
      assignedBy: executedBy
    };
    admission.updatedAt = new Date();

    await this.updateAdmission(admission);

    // Complete transfer
    transfer.status = 'completed';
    transfer.completedAt = new Date();
    transfer.completedBy = executedBy;

    await this.updateTransfer(transfer);
    await this.logADTEvent(admission.id, 'transfer_completed', executedBy, { transfer });

    return transfer;
  }

  async cancelTransfer(transferId: string, reason: string, cancelledBy: string): Promise<void> {
    const transfer = await this.getTransfer(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status === 'completed') {
      throw new Error('Cannot cancel completed transfer');
    }

    transfer.status = 'cancelled';
    transfer.notes = reason;

    // Release reserved bed if any
    if (transfer.toLocation.bedStatus === 'reserved') {
      await this.releaseReservation(transfer.toLocation);
    }

    await this.updateTransfer(transfer);
    await this.logADTEvent(transfer.admissionId, 'transfer_cancelled', cancelledBy, { reason });
  }

  // ==================== DISCHARGES ====================

  async initiateDischarge(data: {
    admissionId: string;
    dischargeDisposition: DischargeDisposition;
    expectedDischargeDateTime?: Date;
    dischargeToLocation?: string;
    initiatedBy: string;
  }): Promise<Admission> {
    const admission = await this.getAdmission(data.admissionId);
    if (!admission) {
      throw new Error('Admission not found');
    }

    admission.status = 'pending_discharge';
    admission.expectedDischargeDate = data.expectedDischargeDateTime || new Date();
    admission.dischargeInfo = {
      dischargeDateTime: new Date(), // Placeholder
      dischargeDisposition: data.dischargeDisposition,
      dischargeType: 'routine',
      dischargedBy: data.initiatedBy,
      actualLengthOfStay: 0,
      dischargeToLocation: data.dischargeToLocation,
      dischargeCondition: 'improved'
    };
    admission.updatedAt = new Date();

    await this.updateAdmission(admission);
    await this.notifyPendingDischarge(admission);

    // Start discharge checklist
    await this.createDischargeChecklist(admission);

    return admission;
  }

  async completeDischarge(data: {
    admissionId: string;
    dischargeDiagnosis: string;
    icdCodes?: string[];
    dischargeInstructions: string;
    followUpAppointments?: FollowUpAppointment[];
    dischargeMedications?: string[];
    homeHealth?: boolean;
    dme?: string[];
    transportMode: string;
    dischargeCondition: 'improved' | 'unchanged' | 'worsened';
    dischargedBy: string;
  }): Promise<Admission> {
    const admission = await this.getAdmission(data.admissionId);
    if (!admission) {
      throw new Error('Admission not found');
    }

    const dischargeDateTime = new Date();
    const losMinutes = dischargeDateTime.getTime() - admission.admissionDateTime.getTime();
    const losDays = Math.ceil(losMinutes / (1000 * 60 * 60 * 24));

    admission.status = 'discharged';
    admission.dischargeInfo = {
      dischargeDateTime,
      dischargeDisposition: admission.dischargeInfo?.dischargeDisposition || 'home',
      dischargeType: 'routine',
      dischargedBy: data.dischargedBy,
      dischargeDiagnosis: data.dischargeDiagnosis,
      icdCodes: data.icdCodes,
      actualLengthOfStay: losDays,
      followUpInstructions: data.dischargeInstructions,
      followUpAppointments: data.followUpAppointments,
      dischargeCondition: data.dischargeCondition,
      dischargeMedications: data.dischargeMedications,
      homeHealth: data.homeHealth,
      dme: data.dme,
      transportMode: data.transportMode
    };
    admission.updatedAt = new Date();

    // Release bed
    await this.releaseBed(admission.location);
    await this.markBedForCleaning(admission.location);

    await this.updateAdmission(admission);
    await this.logADTEvent(admission.id, 'discharged', data.dischargedBy, admission.dischargeInfo);

    // Generate discharge summary
    await this.generateDischargeSummary(admission);

    // Send to patient portal
    await this.sendDischargeInstructions(admission);

    return admission;
  }

  async dischargeAMA(
    admissionId: string,
    reason: string,
    witnessedBy: string,
    dischargedBy: string
  ): Promise<Admission> {
    const admission = await this.getAdmission(admissionId);
    if (!admission) {
      throw new Error('Admission not found');
    }

    const dischargeDateTime = new Date();
    const losMinutes = dischargeDateTime.getTime() - admission.admissionDateTime.getTime();
    const losDays = Math.ceil(losMinutes / (1000 * 60 * 60 * 24));

    admission.status = 'discharged';
    admission.dischargeInfo = {
      dischargeDateTime,
      dischargeDisposition: 'ama',
      dischargeType: 'ama',
      dischargedBy,
      actualLengthOfStay: losDays,
      dischargeCondition: 'unchanged',
      followUpInstructions: `Patient left against medical advice. Reason: ${reason}. Witnessed by: ${witnessedBy}`
    };
    admission.updatedAt = new Date();

    await this.releaseBed(admission.location);
    await this.updateAdmission(admission);
    await this.logADTEvent(admission.id, 'ama_discharge', dischargedBy, { reason, witnessedBy });

    return admission;
  }

  async recordExpired(
    admissionId: string,
    timeOfDeath: Date,
    pronouncedBy: string,
    causeOfDeath?: string
  ): Promise<Admission> {
    const admission = await this.getAdmission(admissionId);
    if (!admission) {
      throw new Error('Admission not found');
    }

    const losMinutes = timeOfDeath.getTime() - admission.admissionDateTime.getTime();
    const losDays = Math.ceil(losMinutes / (1000 * 60 * 60 * 24));

    admission.status = 'discharged';
    admission.dischargeInfo = {
      dischargeDateTime: timeOfDeath,
      dischargeDisposition: 'ama', // Will be overwritten
      dischargeType: 'expired',
      dischargedBy: pronouncedBy,
      actualLengthOfStay: losDays,
      dischargeCondition: 'expired',
      dischargeDiagnosis: causeOfDeath
    };
    admission.updatedAt = new Date();

    await this.releaseBed(admission.location);
    await this.updateAdmission(admission);
    await this.logADTEvent(admission.id, 'expired', pronouncedBy, { timeOfDeath, causeOfDeath });

    // Trigger mortality review workflow
    await this.triggerMortalityReview(admission);

    return admission;
  }

  // ==================== BED MANAGEMENT ====================

  async getBedStatus(facilityId: string): Promise<{
    total: number;
    available: number;
    occupied: number;
    cleaning: number;
    blocked: number;
    byUnit: Map<string, { total: number; available: number; occupied: number }>;
  }> {
    const beds = await this.getAllBeds(facilityId);

    const status = {
      total: beds.length,
      available: 0,
      occupied: 0,
      cleaning: 0,
      blocked: 0,
      byUnit: new Map<string, { total: number; available: number; occupied: number }>()
    };

    for (const bed of beds) {
      switch (bed.status) {
        case 'available': status.available++; break;
        case 'occupied': status.occupied++; break;
        case 'cleaning': status.cleaning++; break;
        case 'blocked':
        case 'maintenance': status.blocked++; break;
      }

      if (!status.byUnit.has(bed.unit)) {
        status.byUnit.set(bed.unit, { total: 0, available: 0, occupied: 0 });
      }
      const unitStatus = status.byUnit.get(bed.unit)!;
      unitStatus.total++;
      if (bed.status === 'available') unitStatus.available++;
      if (bed.status === 'occupied') unitStatus.occupied++;
    }

    return status;
  }

  async findAvailableBed(criteria: {
    admissionType: AdmissionType;
    admissionClass: AdmissionClass;
    requestedUnit?: string;
    requestedRoom?: string;
    isolationType?: IsolationType;
    specialNeeds?: string[];
  }): Promise<PatientLocation | null> {
    // Get all available beds matching criteria
    const availableBeds = await this.getAvailableBeds(criteria);

    if (availableBeds.length === 0) {
      return null;
    }

    // Sort by preference (requested unit/room first)
    availableBeds.sort((a, b) => {
      if (criteria.requestedUnit) {
        if (a.unit === criteria.requestedUnit && b.unit !== criteria.requestedUnit) return -1;
        if (b.unit === criteria.requestedUnit && a.unit !== criteria.requestedUnit) return 1;
      }
      if (criteria.requestedRoom) {
        if (a.room === criteria.requestedRoom && b.room !== criteria.requestedRoom) return -1;
        if (b.room === criteria.requestedRoom && a.room !== criteria.requestedRoom) return 1;
      }
      return 0;
    });

    const bed = availableBeds[0];

    return {
      facility: bed.facilityId,
      floor: bed.floor,
      unit: bed.unit,
      room: bed.room,
      bed: bed.bedNumber,
      bedStatus: 'available',
      assignedAt: new Date(),
      assignedBy: 'system'
    };
  }

  async blockBed(
    bedId: string,
    reason: string,
    until?: Date,
    blockedBy?: string
  ): Promise<void> {
    const bed = await this.getBed(bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    if (bed.status === 'occupied') {
      throw new Error('Cannot block occupied bed');
    }

    bed.status = 'blocked';
    bed.outOfServiceReason = reason;
    bed.outOfServiceUntil = until;

    await this.updateBed(bed);
    await this.logBedEvent(bedId, 'blocked', blockedBy || 'system', { reason, until });
  }

  async unblockBed(bedId: string, unblockedBy: string): Promise<void> {
    const bed = await this.getBed(bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    bed.status = 'available';
    bed.outOfServiceReason = undefined;
    bed.outOfServiceUntil = undefined;

    await this.updateBed(bed);
    await this.logBedEvent(bedId, 'unblocked', unblockedBy, {});
  }

  async markBedCleaned(bedId: string, cleanedBy: string): Promise<void> {
    const bed = await this.getBed(bedId);
    if (!bed) {
      throw new Error('Bed not found');
    }

    if (bed.status !== 'cleaning') {
      throw new Error('Bed is not in cleaning status');
    }

    bed.status = 'available';
    bed.lastCleanedAt = new Date();

    await this.updateBed(bed);
    await this.logBedEvent(bedId, 'cleaned', cleanedBy, {});

    // Notify waiting admissions
    await this.notifyBedAvailable(bed);
  }

  // ==================== CENSUS AND METRICS ====================

  async getCurrentCensus(facilityId: string): Promise<CensusSnapshot> {
    const now = new Date();
    const admissions = await this.getActiveAdmissions(facilityId);
    const beds = await this.getAllBeds(facilityId);

    const snapshot: CensusSnapshot = {
      timestamp: now,
      facilityId,
      totalBeds: beds.length,
      operationalBeds: beds.filter(b => !['blocked', 'maintenance'].includes(b.status)).length,
      occupiedBeds: beds.filter(b => b.status === 'occupied').length,
      availableBeds: beds.filter(b => b.status === 'available').length,
      blockedBeds: beds.filter(b => ['blocked', 'maintenance'].includes(b.status)).length,
      cleaningBeds: beds.filter(b => b.status === 'cleaning').length,
      occupancyRate: 0,
      admissionsToday: 0,
      dischargesToday: 0,
      transfersToday: 0,
      pendingAdmissions: admissions.filter(a => a.status === 'pre_admitted').length,
      pendingDischarges: admissions.filter(a => a.status === 'pending_discharge').length,
      pendingTransfers: 0,
      byUnit: [],
      byService: [],
      byInsurance: []
    };

    snapshot.occupancyRate = snapshot.operationalBeds > 0
      ? (snapshot.occupiedBeds / snapshot.operationalBeds) * 100
      : 0;

    // Calculate today's movements
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    for (const admission of admissions) {
      if (admission.admissionDateTime >= todayStart) {
        snapshot.admissionsToday++;
      }
      if (admission.dischargeInfo?.dischargeDateTime &&
          admission.dischargeInfo.dischargeDateTime >= todayStart) {
        snapshot.dischargesToday++;
      }
    }

    return snapshot;
  }

  async getAdmissionForecast(
    facilityId: string,
    days: number
  ): Promise<{
    date: Date;
    expectedAdmissions: number;
    expectedDischarges: number;
    projectedCensus: number;
    projectedOccupancy: number;
  }[]> {
    // Based on scheduled admissions and expected discharges
    const forecast: any[] = [];
    const currentCensus = await this.getCurrentCensus(facilityId);

    let runningCensus = currentCensus.occupiedBeds;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const scheduled = await this.getScheduledAdmissions(facilityId, date);
      const expectedDischarges = await this.getExpectedDischarges(facilityId, date);

      runningCensus = runningCensus + scheduled.length - expectedDischarges.length;

      forecast.push({
        date,
        expectedAdmissions: scheduled.length,
        expectedDischarges: expectedDischarges.length,
        projectedCensus: runningCensus,
        projectedOccupancy: currentCensus.operationalBeds > 0
          ? (runningCensus / currentCensus.operationalBeds) * 100
          : 0
      });
    }

    return forecast;
  }

  // ==================== HELPER METHODS ====================

  private async generateVisitNumber(): Promise<string> {
    const date = new Date();
    const prefix = 'V';
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${dateStr}${random}`;
  }

  private async generateAdmissionNumber(): Promise<string> {
    const date = new Date();
    const prefix = 'A';
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${dateStr}${random}`;
  }

  private getIsolationPrecautions(type: IsolationType): string[] {
    const precautions: Record<IsolationType, string[]> = {
      contact: ['Gown', 'Gloves', 'Dedicated equipment'],
      droplet: ['Surgical mask', 'Eye protection', 'Gown', 'Gloves'],
      airborne: ['N95 respirator', 'Negative pressure room', 'Gown', 'Gloves'],
      protective: ['Gown', 'Gloves', 'Mask', 'Hand hygiene'],
      contact_enteric: ['Gown', 'Gloves', 'Enhanced hand washing'],
      contact_mrsa: ['Gown', 'Gloves', 'Dedicated equipment', 'Enhanced cleaning'],
      neutropenic: ['Mask', 'Hand hygiene', 'No fresh flowers/plants', 'Cooked foods only']
    };
    return precautions[type] || [];
  }

  private getRequiredPPE(type: IsolationType): string[] {
    const ppe: Record<IsolationType, string[]> = {
      contact: ['Gown', 'Gloves'],
      droplet: ['Surgical mask', 'Eye protection', 'Gown', 'Gloves'],
      airborne: ['N95 respirator', 'Eye protection', 'Gown', 'Gloves'],
      protective: ['Gown', 'Gloves', 'Surgical mask'],
      contact_enteric: ['Gown', 'Gloves'],
      contact_mrsa: ['Gown', 'Gloves'],
      neutropenic: ['Surgical mask', 'Gloves']
    };
    return ppe[type] || [];
  }

  // Database stubs
  private async saveAdmission(admission: Admission): Promise<void> {}
  private async updateAdmission(admission: Admission): Promise<void> {}
  private async getAdmission(id: string): Promise<Admission | null> { return null; }
  private async getActiveAdmissions(facilityId: string): Promise<Admission[]> { return []; }
  private async saveTransfer(transfer: Transfer): Promise<void> {}
  private async updateTransfer(transfer: Transfer): Promise<void> {}
  private async getTransfer(id: string): Promise<Transfer | null> { return null; }
  private async getAllBeds(facilityId: string): Promise<Bed[]> { return []; }
  private async getBed(id: string): Promise<Bed | null> { return null; }
  private async updateBed(bed: Bed): Promise<void> {}
  private async getAvailableBeds(criteria: any): Promise<Bed[]> { return []; }
  private async assignBed(location: PatientLocation, admissionId: string, patientId: string): Promise<void> {}
  private async releaseBed(location: PatientLocation): Promise<void> {}
  private async releaseReservation(location: PatientLocation): Promise<void> {}
  private async markBedForCleaning(location: PatientLocation): Promise<void> {}
  private async findAvailableBedInUnit(unit: string, room?: string, bed?: string): Promise<PatientLocation | null> { return null; }
  private async getScheduledAdmissions(facilityId: string, date: Date): Promise<Admission[]> { return []; }
  private async getExpectedDischarges(facilityId: string, date: Date): Promise<Admission[]> { return []; }
  private async logADTEvent(admissionId: string, event: string, userId: string, data: any): Promise<void> {}
  private async logBedEvent(bedId: string, event: string, userId: string, data: any): Promise<void> {}
  private async notifyAdmission(admission: Admission): Promise<void> {}
  private async notifyPendingDischarge(admission: Admission): Promise<void> {}
  private async notifyTransferRequest(transfer: Transfer): Promise<void> {}
  private async notifyTransferApproved(transfer: Transfer): Promise<void> {}
  private async notifyBedAvailable(bed: Bed): Promise<void> {}
  private async createAdmissionOrders(admission: Admission): Promise<void> {}
  private async createDischargeChecklist(admission: Admission): Promise<void> {}
  private async generateDischargeSummary(admission: Admission): Promise<void> {}
  private async sendDischargeInstructions(admission: Admission): Promise<void> {}
  private async triggerMortalityReview(admission: Admission): Promise<void> {}
}

export default ADTService;
