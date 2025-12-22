/**
 * Perfex Dialyse SDK - Type Definitions
 * Complete type definitions for the Dialysis Healthcare module
 */

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
export type MaintenanceType = 'preventive' | 'corrective' | 'calibration' | 'inspection';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type SessionStatus = 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type SessionPhase = 'pre' | 'intra' | 'post';

export type IncidentType = 'hypotension' | 'cramps' | 'nausea' | 'bleeding' | 'clotting' | 'fever' | 'chest_pain' | 'arrhythmia' | 'access_problem' | 'other';
export type IncidentSeverity = 'mild' | 'moderate' | 'severe';

export type AlertType = 'prescription_renewal' | 'lab_due' | 'vaccination' | 'vascular_access' | 'serology_update' | 'weight_deviation' | 'custom';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

// ============================================================================
// PATIENT
// ============================================================================

export interface DialysePatient {
  id: string;
  organizationId: string;
  contactId: string;
  medicalId: string;
  photo?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  bloodType?: BloodType;
  dryWeight?: number;
  renalFailureEtiology?: string;
  medicalHistory?: Record<string, unknown>;
  allergies?: string[];
  contraindications?: string[];
  hivStatus: SerologyStatus;
  hbvStatus: SerologyStatus;
  hcvStatus: SerologyStatus;
  serologyLastUpdate?: Date;
  requiresIsolation: boolean;
  hepatitisBVaccinated: boolean;
  hepatitisBLastDose?: Date;
  patientStatus: PatientStatus;
  dialysisStartDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    address?: string;
  };
}

export interface CreatePatientInput {
  contactId: string;
  medicalId: string;
  photo?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  bloodType?: BloodType;
  dryWeight?: number;
  renalFailureEtiology?: string;
  medicalHistory?: Record<string, unknown>;
  allergies?: string[];
  contraindications?: string[];
  hivStatus?: SerologyStatus;
  hbvStatus?: SerologyStatus;
  hcvStatus?: SerologyStatus;
  requiresIsolation?: boolean;
  hepatitisBVaccinated?: boolean;
  hepatitisBLastDose?: Date;
  patientStatus?: PatientStatus;
  dialysisStartDate?: Date;
  notes?: string;
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  isolationPatients: number;
  recentlyAdded: number;
}

// ============================================================================
// VASCULAR ACCESS
// ============================================================================

export interface VascularAccess {
  id: string;
  organizationId: string;
  patientId: string;
  type: VascularAccessType;
  location: string;
  creationDate?: Date;
  surgeon?: string;
  status: VascularAccessStatus;
  failureDate?: Date;
  failureReason?: string;
  removalDate?: Date;
  lastControlDate?: Date;
  nextControlDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVascularAccessInput {
  patientId: string;
  type: VascularAccessType;
  location: string;
  creationDate?: Date;
  surgeon?: string;
  status?: VascularAccessStatus;
  notes?: string;
}

// ============================================================================
// PRESCRIPTION
// ============================================================================

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
  dryWeight?: number;
  bloodFlowRate?: number;
  dialysateFlowRate?: number;
  dialyzerType?: string;
  membraneSurface?: number;
  anticoagulationType?: string;
  anticoagulationDose?: string;
  anticoagulationProtocol?: string;
  sessionMedications?: Record<string, unknown>[];
  dialysateType?: string;
  dialysateSodium?: number;
  dialysatePotassium?: number;
  dialysateBicarbonate?: number;
  dialysateCalcium?: number;
  startDate: Date;
  endDate?: Date;
  status: PrescriptionStatus;
  supersededById?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrescriptionInput {
  patientId: string;
  type: DialysisType;
  isPermanent?: boolean;
  durationMinutes: number;
  frequencyPerWeek: number;
  dryWeight?: number;
  bloodFlowRate?: number;
  dialysateFlowRate?: number;
  dialyzerType?: string;
  membraneSurface?: number;
  anticoagulationType?: string;
  anticoagulationDose?: string;
  dialysateType?: string;
  dialysateSodium?: number;
  dialysatePotassium?: number;
  dialysateBicarbonate?: number;
  dialysateCalcium?: number;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

// ============================================================================
// MACHINE
// ============================================================================

export interface DialysisMachine {
  id: string;
  organizationId: string;
  warehouseId?: string;
  machineNumber: string;
  model: string;
  manufacturer?: string;
  serialNumber?: string;
  status: MachineStatus;
  isolationOnly: boolean;
  location?: string;
  totalHours: number;
  totalSessions: number;
  installationDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMachineInput {
  machineNumber: string;
  model: string;
  manufacturer?: string;
  serialNumber?: string;
  status?: MachineStatus;
  isolationOnly?: boolean;
  location?: string;
  installationDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
}

export interface MachineStats {
  totalMachines: number;
  availableMachines: number;
  inUseMachines: number;
  maintenanceMachines: number;
  outOfServiceMachines: number;
  isolationMachines: number;
}

// ============================================================================
// MACHINE MAINTENANCE
// ============================================================================

export interface MachineMaintenance {
  id: string;
  organizationId: string;
  machineId: string;
  maintenanceNumber: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate?: Date;
  completedDate?: Date;
  performedBy?: string;
  vendor?: string;
  description?: string;
  workPerformed?: string;
  cost: number;
  downtime?: number;
  partsReplaced?: string[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMaintenanceInput {
  machineId: string;
  type: MaintenanceType;
  scheduledDate?: Date;
  description?: string;
  vendor?: string;
  notes?: string;
}

// ============================================================================
// SESSION
// ============================================================================

export interface DialysisSession {
  id: string;
  organizationId: string;
  patientId: string;
  prescriptionId: string;
  machineId?: string;
  slotId?: string;
  sessionNumber: string;
  sessionDate: Date;
  status: SessionStatus;
  scheduledStartTime?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDurationMinutes?: number;
  isRecurring: boolean;
  recurrenceGroupId?: string;
  primaryNurseId?: string;
  supervisingDoctorId?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  patient?: DialysePatient;
  machine?: DialysisMachine;
  records?: SessionRecord[];
  incidents?: SessionIncident[];
}

export interface CreateSessionInput {
  patientId: string;
  prescriptionId: string;
  machineId?: string;
  slotId?: string;
  sessionDate: Date;
  scheduledStartTime?: string;
  isRecurring?: boolean;
  primaryNurseId?: string;
  supervisingDoctorId?: string;
  notes?: string;
}

export interface SessionSlot {
  id: string;
  organizationId: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  maxPatients: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSlotInput {
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  maxPatients: number;
  active?: boolean;
}

// ============================================================================
// SESSION RECORDS (Per-dialytic monitoring)
// ============================================================================

export interface SessionRecord {
  id: string;
  sessionId: string;
  phase: SessionPhase;
  recordTime: Date;
  weightKg?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  temperature?: number;
  arterialPressure?: number;
  venousPressure?: number;
  transmembranePressure?: number;
  bloodFlowRate?: number;
  dialysateFlowRate?: number;
  cumulativeUf?: number;
  clinicalState?: string;
  vascularAccessState?: string;
  compressionTime?: number;
  ufAchieved?: number;
  ufPrescribed?: number;
  hasIncident: boolean;
  recordedBy: string;
  createdAt: Date;
}

export interface CreateSessionRecordInput {
  phase: SessionPhase;
  weightKg?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  temperature?: number;
  arterialPressure?: number;
  venousPressure?: number;
  transmembranePressure?: number;
  bloodFlowRate?: number;
  dialysateFlowRate?: number;
  cumulativeUf?: number;
  clinicalState?: string;
  vascularAccessState?: string;
  compressionTime?: number;
  ufAchieved?: number;
  ufPrescribed?: number;
}

// ============================================================================
// SESSION INCIDENTS
// ============================================================================

export interface SessionIncident {
  id: string;
  sessionId: string;
  sessionRecordId?: string;
  incidentTime: Date;
  type: IncidentType;
  severity: IncidentSeverity;
  description?: string;
  intervention?: string;
  outcome?: string;
  reportedBy: string;
  createdAt: Date;
}

export interface CreateSessionIncidentInput {
  type: IncidentType;
  severity: IncidentSeverity;
  description?: string;
  intervention?: string;
  outcome?: string;
}

// ============================================================================
// LAB RESULTS
// ============================================================================

export interface LabResult {
  id: string;
  organizationId: string;
  patientId: string;
  labDate: Date;
  labSource?: string;
  importMethod: 'manual' | 'file_import' | 'api';
  urea?: number;
  ureaPre?: number;
  ureaPost?: number;
  creatinine?: number;
  ktV?: number;
  hemoglobin?: number;
  hematocrit?: number;
  pth?: number;
  calcium?: number;
  phosphorus?: number;
  potassium?: number;
  sodium?: number;
  bicarbonate?: number;
  albumin?: number;
  ferritin?: number;
  transferrinSaturation?: number;
  crp?: number;
  allResults?: Record<string, number>;
  hasOutOfRangeValues: boolean;
  outOfRangeMarkers?: string[];
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabResultInput {
  patientId: string;
  labDate: Date;
  labSource?: string;
  urea?: number;
  ureaPre?: number;
  ureaPost?: number;
  creatinine?: number;
  hemoglobin?: number;
  hematocrit?: number;
  pth?: number;
  calcium?: number;
  phosphorus?: number;
  potassium?: number;
  sodium?: number;
  bicarbonate?: number;
  albumin?: number;
  ferritin?: number;
  transferrinSaturation?: number;
  crp?: number;
  notes?: string;
}

// ============================================================================
// CLINICAL ALERTS
// ============================================================================

export interface ClinicalAlert {
  id: string;
  organizationId: string;
  patientId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  dueDate?: Date;
  status: AlertStatus;
  assignedTo?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  relatedToType?: string;
  relatedToId?: string;
  createdAt: Date;
  updatedAt: Date;
  patient?: DialysePatient;
}

export interface CreateAlertInput {
  patientId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  dueDate?: Date;
  assignedTo?: string;
  relatedToType?: string;
  relatedToId?: string;
}

export interface AlertStats {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

// ============================================================================
// DASHBOARD
// ============================================================================

export interface DashboardData {
  patients: PatientStats;
  machines: MachineStats;
  sessions: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    inProgressSessions: number;
    scheduledSessions: number;
    averageDuration: number;
    incidentCount: number;
  };
  alerts: AlertStats;
  todaySessions: DialysisSession[];
  criticalAlerts: ClinicalAlert[];
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// SDK CONFIG
// ============================================================================

export interface DialyseSdkConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  organizationId?: string;
  timeout?: number;
  headers?: Record<string, string>;
}
