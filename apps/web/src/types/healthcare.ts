/**
 * Healthcare Module Shared Types
 * Common interfaces used across Dialyse, Cardiology, and Ophthalmology modules
 */

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ============================================================================
// BASE ENTITY TYPES
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other';
}

// ============================================================================
// PATIENT TYPES
// ============================================================================

export interface BasePatient extends BaseEntity {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  medicalRecordNumber?: string;
  status: string;
}

export interface HealthcarePatient extends BasePatient {
  contact?: Contact;
  bloodType?: string | null;
  primaryDiagnosis?: string | null;
  lastConsultation?: string | null;
  nextAppointment?: string | null;
  hasActiveAlerts?: boolean;
}

export interface DialysePatient extends HealthcarePatient {
  medicalId: string;
  patientStatus: 'active' | 'transferred' | 'deceased' | 'transplanted' | 'recovered';
  hivStatus: 'negative' | 'positive' | 'unknown';
  hbvStatus: 'negative' | 'positive' | 'unknown';
  hcvStatus: 'negative' | 'positive' | 'unknown';
  requiresIsolation: boolean;
  dialysisStartDate: string | null;
  contact: Contact;
}

export interface CardiologyPatient extends HealthcarePatient {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  hasPacemaker?: boolean;
  hasStent?: boolean;
}

export interface OphthalmologyPatient extends HealthcarePatient {
  hasGlaucoma?: boolean;
  hasDmla?: boolean;
  hasIolImplant?: boolean;
}

// ============================================================================
// STATS TYPES
// ============================================================================

export interface BaseStats {
  total: number;
}

export interface PatientStats extends BaseStats {
  active: number;
  inactive?: number;
  newThisMonth?: number;
}

export interface DialysePatientStats extends PatientStats {
  totalPatients: number;
  activePatients: number;
  isolationPatients: number;
  recentlyAdded: number;
}

export interface MachineStats extends BaseStats {
  totalMachines: number;
  availableMachines: number;
  inUseMachines: number;
  maintenanceMachines: number;
  outOfServiceMachines: number;
  isolationMachines: number;
}

export interface AlertStats extends BaseStats {
  active: number;
  acknowledged: number;
  resolved: number;
  critical: number;
  high?: number;
  medium?: number;
  low?: number;
}

// ============================================================================
// CONSULTATION TYPES
// ============================================================================

export interface BaseConsultation extends BaseEntity {
  patientId: string;
  date: string;
  type: string;
  notes?: string | null;
  diagnosis?: string | null;
  recommendations?: string | null;
  followUpDate?: string | null;
}

export interface CardiologyConsultation extends BaseConsultation {
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  heartRate?: number | null;
  weight?: number | null;
  ecgFindings?: string | null;
}

export interface OphthalmologyConsultation extends BaseConsultation {
  visualAcuityRight?: string | null;
  visualAcuityLeft?: string | null;
  intraocularPressureRight?: number | null;
  intraocularPressureLeft?: number | null;
  anteriorSegmentFindings?: string | null;
  posteriorSegmentFindings?: string | null;
}

// ============================================================================
// ALERT TYPES
// ============================================================================

export interface BaseAlert extends BaseEntity {
  patientId: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description?: string | null;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  dueDate?: string | null;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
}

export interface DialyseAlert extends BaseAlert {
  alertType: 'prescription_renewal' | 'lab_due' | 'vaccination' | 'vascular_access' | 'serology_update' | 'weight_deviation' | 'custom';
}

// ============================================================================
// DIALYSE-SPECIFIC TYPES
// ============================================================================

export interface DialyseMachine extends BaseEntity {
  machineNumber: string;
  model: string;
  manufacturer: string | null;
  serialNumber: string | null;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  isolationOnly: boolean;
  location: string | null;
  totalHours: number;
  totalSessions: number;
  installationDate: string | null;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  warrantyExpiry: string | null;
  notes: string | null;
}

export interface DialyseSession extends BaseEntity {
  patientId: string;
  sessionNumber: string;
  sessionDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  machineId?: string | null;
  slotId?: string | null;
}

export interface DialyseMaintenance extends BaseEntity {
  machineId: string;
  type: 'preventive' | 'corrective' | 'calibration' | 'inspection';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  completedDate: string | null;
  technician: string | null;
  description: string;
  findings: string | null;
  partsReplaced: string | null;
  laborHours: number | null;
  cost: number | null;
  nextMaintenanceDate: string | null;
  notes: string | null;
}

export interface DialyseStaff extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'nephrologist' | 'nurse' | 'technician' | 'dietician' | 'social_worker' | 'administrative';
  licenseNumber: string | null;
  licenseExpiry: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  schedule?: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
}

// ============================================================================
// CARDIOLOGY-SPECIFIC TYPES
// ============================================================================

export interface Pacemaker extends BaseEntity {
  patientId: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  implantDate: string;
  batteryStatus: 'good' | 'fair' | 'low' | 'critical';
  lastCheckDate: string | null;
  nextCheckDate: string | null;
}

export interface Stent extends BaseEntity {
  patientId: string;
  location: string;
  type: string;
  implantDate: string;
  interventionReason: string | null;
}

export interface RiskScore extends BaseEntity {
  patientId: string;
  scoreType: 'cha2ds2-vasc' | 'has-bled' | 'heart' | 'grace' | 'timi';
  score: number;
  calculatedDate: string;
  notes: string | null;
}

// ============================================================================
// OPHTHALMOLOGY-SPECIFIC TYPES
// ============================================================================

export interface OctScan extends BaseEntity {
  patientId: string;
  scanDate: string;
  eye: 'right' | 'left' | 'both';
  findings: string | null;
  imagePath: string | null;
}

export interface IvtInjection extends BaseEntity {
  patientId: string;
  injectionDate: string;
  eye: 'right' | 'left';
  medication: string;
  dose: string | null;
  indication: string | null;
  complications: string | null;
}

export interface VisualField extends BaseEntity {
  patientId: string;
  testDate: string;
  eye: 'right' | 'left';
  md: number | null; // Mean Deviation
  psd: number | null; // Pattern Standard Deviation
  vfi: number | null; // Visual Field Index
  testReliability: 'reliable' | 'borderline' | 'unreliable';
}

// ============================================================================
// FILTER & FORM TYPES
// ============================================================================

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  name: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: FilterOption[];
  placeholder?: string;
  min?: number;
  max?: number;
}

// ============================================================================
// MODULE TYPES
// ============================================================================

export type HealthcareModule = 'dialyse' | 'cardiology' | 'ophthalmology';

export interface ModuleConfig {
  module: HealthcareModule;
  basePath: string;
  apiEndpoint: string;
  icon: React.ComponentType;
  color: string;
}
