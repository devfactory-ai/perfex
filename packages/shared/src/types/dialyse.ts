/**
 * Dialyse (Dialysis) Healthcare Module Types
 */

import type { Contact } from './crm';

// ============================================================================
// ENUMS
// ============================================================================

export type SerologyStatus = 'negative' | 'positive' | 'unknown';
export type PatientStatus = 'active' | 'transferred' | 'deceased' | 'transplanted' | 'recovered';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type VascularAccessType = 'fav' | 'catheter_permanent' | 'catheter_temporary' | 'graft';
export type VascularAccessStatus = 'active' | 'failed' | 'removed' | 'maturing';

export type DialysisType = 'hemodialysis' | 'hemofiltration' | 'hemodiafiltration';
export type PrescriptionStatus = 'active' | 'expired' | 'cancelled' | 'superseded';

export type MachineStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';
export type DialyseMaintenanceType = 'preventive' | 'corrective' | 'calibration' | 'inspection';
export type DialyseMaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type SessionStatus = 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type SessionPhase = 'pre' | 'intra' | 'post';

export type IncidentType = 'hypotension' | 'cramps' | 'nausea' | 'bleeding' | 'clotting' | 'fever' | 'chest_pain' | 'arrhythmia' | 'access_problem' | 'other';
export type IncidentSeverity = 'mild' | 'moderate' | 'severe';

export type MedicationRoute = 'iv' | 'sc' | 'oral' | 'dialysate';
export type SignatureType = 'nurse_start' | 'nurse_end' | 'doctor_validation';

export type LabImportMethod = 'manual' | 'file_import' | 'api';

export type AlertType = 'prescription_renewal' | 'lab_due' | 'vaccination' | 'vascular_access' | 'serology_update' | 'weight_deviation' | 'custom';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

// ============================================================================
// PATIENT INTERFACES
// ============================================================================

/**
 * Dialyse Patient (extends CRM Contact)
 */
export interface DialysePatient {
  id: string;
  organizationId: string;
  contactId: string;
  medicalId: string;
  photo: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  bloodType: BloodType | null;
  dryWeight: number | null;
  renalFailureEtiology: string | null;
  medicalHistory: string | null; // JSON
  allergies: string | null; // JSON array
  contraindications: string | null; // JSON array
  hivStatus: SerologyStatus;
  hbvStatus: SerologyStatus;
  hcvStatus: SerologyStatus;
  serologyLastUpdate: Date | null;
  requiresIsolation: boolean;
  hepatitisBVaccinated: boolean;
  hepatitisBLastDose: Date | null;
  patientStatus: PatientStatus;
  dialysisStartDate: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dialyse Patient with Contact details
 */
export interface DialysePatientWithContact extends DialysePatient {
  contact: Contact;
}

/**
 * Dialyse Patient with full details (contact, prescriptions, accesses)
 */
export interface DialysePatientFull extends DialysePatientWithContact {
  activePrescription: DialysePrescription | null;
  activeVascularAccess: VascularAccess | null;
  vascularAccesses: VascularAccess[];
  recentLabResult: LabResult | null;
  activeAlerts: ClinicalAlert[];
}

/**
 * Vascular Access
 */
export interface VascularAccess {
  id: string;
  organizationId: string;
  patientId: string;
  type: VascularAccessType;
  location: string;
  creationDate: Date | null;
  surgeon: string | null;
  status: VascularAccessStatus;
  failureDate: Date | null;
  failureReason: string | null;
  removalDate: Date | null;
  lastControlDate: Date | null;
  nextControlDate: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PRESCRIPTION INTERFACES
// ============================================================================

/**
 * Dialyse Prescription
 */
export interface DialysePrescription {
  id: string;
  organizationId: string;
  patientId: string;
  prescribedBy: string;
  prescriptionNumber: string;
  type: DialysisType;
  isPermanent: boolean;
  durationMinutes: number;
  frequencyPerWeek: number;
  dryWeight: number | null;
  bloodFlowRate: number | null;
  dialysateFlowRate: number | null;
  dialyzerType: string | null;
  membraneSurface: number | null;
  anticoagulationType: string | null;
  anticoagulationDose: string | null;
  anticoagulationProtocol: string | null;
  sessionMedications: string | null; // JSON array
  dialysateType: string | null;
  dialysateSodium: number | null;
  dialysatePotassium: number | null;
  dialysateBicarbonate: number | null;
  dialysateCalcium: number | null;
  startDate: Date;
  endDate: Date | null;
  status: PrescriptionStatus;
  supersededById: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dialyse Prescription with patient info
 */
export interface DialysePrescriptionWithPatient extends DialysePrescription {
  patient: DialysePatientWithContact;
}

// ============================================================================
// MACHINE INTERFACES
// ============================================================================

/**
 * Dialysis Machine
 */
export interface DialysisMachine {
  id: string;
  organizationId: string;
  warehouseId: string | null;
  machineNumber: string;
  model: string;
  manufacturer: string | null;
  serialNumber: string | null;
  status: MachineStatus;
  isolationOnly: boolean;
  location: string | null;
  totalHours: number;
  totalSessions: number;
  installationDate: Date | null;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  warrantyExpiry: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Machine Maintenance Record
 */
export interface MachineMaintenanceRecord {
  id: string;
  organizationId: string;
  machineId: string;
  maintenanceNumber: string;
  type: DialyseMaintenanceType;
  status: DialyseMaintenanceStatus;
  scheduledDate: Date | null;
  completedDate: Date | null;
  performedBy: string | null;
  vendor: string | null;
  description: string | null;
  workPerformed: string | null;
  cost: number;
  downtime: number | null;
  partsReplaced: string | null; // JSON array
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Machine with maintenance records
 */
export interface DialysisMachineWithMaintenance extends DialysisMachine {
  maintenanceRecords: MachineMaintenanceRecord[];
}

// ============================================================================
// SESSION INTERFACES
// ============================================================================

/**
 * Session Slot
 */
export interface DialysisSessionSlot {
  id: string;
  organizationId: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string; // JSON array
  maxPatients: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dialysis Session
 */
export interface DialysisSession {
  id: string;
  organizationId: string;
  patientId: string;
  prescriptionId: string;
  machineId: string | null;
  slotId: string | null;
  sessionNumber: string;
  sessionDate: Date;
  status: SessionStatus;
  scheduledStartTime: string | null;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  actualDurationMinutes: number | null;
  isRecurring: boolean;
  recurrenceGroupId: string | null;
  primaryNurseId: string | null;
  supervisingDoctorId: string | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  cancelledAt: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session with related data
 */
export interface DialysisSessionWithDetails extends DialysisSession {
  patient: DialysePatientWithContact;
  prescription: DialysePrescription;
  machine: DialysisMachine | null;
  slot: DialysisSessionSlot | null;
  records: SessionRecord[];
  incidents: SessionIncident[];
  medications: SessionMedication[];
  consumables: SessionConsumable[];
  signatures: SessionSignature[];
}

/**
 * Session Record (monitoring data)
 */
export interface SessionRecord {
  id: string;
  sessionId: string;
  phase: SessionPhase;
  recordTime: Date;
  weightKg: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  heartRate: number | null;
  temperature: number | null;
  arterialPressure: number | null;
  venousPressure: number | null;
  transmembranePressure: number | null;
  bloodFlowRate: number | null;
  dialysateFlowRate: number | null;
  cumulativeUF: number | null;
  clinicalState: string | null; // JSON
  vascularAccessState: string | null;
  compressionTime: number | null;
  ufAchieved: number | null;
  ufPrescribed: number | null;
  hasIncident: boolean;
  recordedBy: string;
  createdAt: Date;
}

/**
 * Session Incident
 */
export interface SessionIncident {
  id: string;
  sessionId: string;
  sessionRecordId: string | null;
  incidentTime: Date;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string | null;
  intervention: string | null;
  outcome: string | null;
  reportedBy: string;
  createdAt: Date;
}

/**
 * Session Medication
 */
export interface SessionMedication {
  id: string;
  sessionId: string;
  medicationName: string;
  dose: string;
  route: MedicationRoute;
  administeredAt: Date;
  administeredBy: string;
  lotId: string | null;
  notes: string | null;
  createdAt: Date;
}

/**
 * Session Consumable
 */
export interface SessionConsumable {
  id: string;
  sessionId: string;
  inventoryItemId: string;
  lotId: string | null;
  quantity: number;
  unit: string;
  createdAt: Date;
}

/**
 * Session Signature
 */
export interface SessionSignature {
  id: string;
  sessionId: string;
  signatureType: SignatureType;
  signedBy: string;
  signedAt: Date;
  signatureData: string | null;
  createdAt: Date;
}

// ============================================================================
// LAB RESULTS INTERFACES
// ============================================================================

/**
 * Lab Result
 */
export interface LabResult {
  id: string;
  organizationId: string;
  patientId: string;
  labDate: Date;
  labSource: string | null;
  importMethod: LabImportMethod;
  urea: number | null;
  ureaPre: number | null;
  ureaPost: number | null;
  creatinine: number | null;
  ktV: number | null;
  hemoglobin: number | null;
  hematocrit: number | null;
  pth: number | null;
  calcium: number | null;
  phosphorus: number | null;
  potassium: number | null;
  sodium: number | null;
  bicarbonate: number | null;
  albumin: number | null;
  ferritin: number | null;
  transferrinSaturation: number | null;
  crp: number | null;
  allResults: string | null; // JSON
  hasOutOfRangeValues: boolean;
  outOfRangeMarkers: string | null; // JSON array
  reviewedBy: string | null;
  reviewedAt: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lab Result with patient info
 */
export interface LabResultWithPatient extends LabResult {
  patient: DialysePatientWithContact;
}

/**
 * Lab Trends data for charts
 */
export interface LabTrends {
  patientId: string;
  marker: string;
  data: Array<{
    date: Date;
    value: number;
    isOutOfRange: boolean;
  }>;
  normalRange: {
    min: number;
    max: number;
  };
}

// ============================================================================
// CLINICAL ALERTS INTERFACES
// ============================================================================

/**
 * Clinical Alert
 */
export interface ClinicalAlert {
  id: string;
  organizationId: string;
  patientId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: AlertStatus;
  assignedTo: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  relatedToType: string | null;
  relatedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Clinical Alert with patient info
 */
export interface ClinicalAlertWithPatient extends ClinicalAlert {
  patient: DialysePatientWithContact;
}

// ============================================================================
// STATISTICS & REPORTING INTERFACES
// ============================================================================

/**
 * Dialyse Dashboard Stats
 */
export interface DialyseDashboardStats {
  totalPatients: number;
  activePatients: number;
  isolationPatients: number;
  todaySessions: number;
  completedToday: number;
  inProgressSessions: number;
  totalMachines: number;
  availableMachines: number;
  maintenanceMachines: number;
  activeAlerts: number;
  criticalAlerts: number;
}

/**
 * Activity Report
 */
export interface ActivityReport {
  period: {
    start: Date;
    end: Date;
  };
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowSessions: number;
  averageDuration: number;
  occupancyRate: number;
  sessionsBySlot: Array<{
    slotName: string;
    count: number;
  }>;
  sessionsByMachine: Array<{
    machineNumber: string;
    count: number;
    hours: number;
  }>;
}

/**
 * Quality Indicators
 */
export interface QualityIndicators {
  period: {
    start: Date;
    end: Date;
  };
  incidentRate: number;
  averageKtV: number;
  ktVAboveTarget: number; // percentage
  hemoglobinInRange: number; // percentage
  phosphorusInRange: number; // percentage
  shortenedSessions: number;
  hospitalizations: number;
}

/**
 * Calendar View Data
 */
export interface CalendarViewData {
  date: Date;
  slots: Array<{
    slot: DialysisSessionSlot;
    machines: Array<{
      machine: DialysisMachine;
      session: DialysisSession | null;
      patient: DialysePatientWithContact | null;
    }>;
  }>;
}

/**
 * Daily Worklist
 */
export interface DailyWorklist {
  date: Date;
  slots: Array<{
    slot: DialysisSessionSlot;
    sessions: Array<{
      session: DialysisSession;
      patient: DialysePatientWithContact;
      prescription: DialysePrescription;
      machine: DialysisMachine | null;
    }>;
  }>;
}
