/**
 * Perfex Dialyse SDK
 * SDK for integrating Perfex Dialyse (Dialysis Healthcare) module into external ERP systems
 *
 * @packageDocumentation
 */

// Client
export { DialyseClient, DialyseApiError } from './client';

// Types - Enums
export type {
  SerologyStatus,
  PatientStatus,
  BloodType,
  VascularAccessType,
  VascularAccessStatus,
  DialysisType,
  PrescriptionStatus,
  MachineStatus,
  MaintenanceType,
  MaintenanceStatus,
  SessionStatus,
  SessionPhase,
  IncidentType,
  IncidentSeverity,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from './types';

// Types - Patient
export type {
  DialysePatient,
  CreatePatientInput,
  UpdatePatientInput,
  PatientStats,
} from './types';

// Types - Vascular Access
export type {
  VascularAccess,
  CreateVascularAccessInput,
} from './types';

// Types - Prescription
export type {
  DialysePrescription,
  CreatePrescriptionInput,
} from './types';

// Types - Machine
export type {
  DialysisMachine,
  CreateMachineInput,
  MachineStats,
  MachineMaintenance,
  CreateMaintenanceInput,
} from './types';

// Types - Session
export type {
  DialysisSession,
  CreateSessionInput,
  SessionSlot,
  CreateSlotInput,
  SessionRecord,
  CreateSessionRecordInput,
  SessionIncident,
  CreateSessionIncidentInput,
} from './types';

// Types - Lab Results
export type {
  LabResult,
  CreateLabResultInput,
} from './types';

// Types - Alerts
export type {
  ClinicalAlert,
  CreateAlertInput,
  AlertStats,
} from './types';

// Types - Dashboard & API
export type {
  DashboardData,
  ApiResponse,
  PaginatedResponse,
  DialyseSdkConfig,
} from './types';
