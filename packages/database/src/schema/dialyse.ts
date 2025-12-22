/**
 * Dialyse (Dialysis) Healthcare Module Schema
 * Patient management, session planning, monitoring, machines, lab results, and alerts
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';
import { contacts } from './crm';
import { employees } from './hr';
import { warehouses, inventoryItems } from './inventory';
import { lots } from './traceability';

// ============================================================================
// PATIENT MANAGEMENT
// ============================================================================

/**
 * Dialyse Patients
 * Extension of CRM contacts with dialysis-specific medical data
 */
export const dialysePatients = sqliteTable('dialyse_patients', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),

  // Medical identifiers
  medicalId: text('medical_id').notNull(),
  photo: text('photo'), // R2 URL

  // Emergency contact
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  emergencyContactRelation: text('emergency_contact_relation'),

  // Medical history
  bloodType: text('blood_type'), // A+, A-, B+, B-, AB+, AB-, O+, O-
  dryWeight: real('dry_weight'), // Target weight in kg
  renalFailureEtiology: text('renal_failure_etiology'),
  medicalHistory: text('medical_history'), // JSON - nephrology history
  allergies: text('allergies'), // JSON array
  contraindications: text('contraindications'), // JSON array

  // Serology (critical for isolation management)
  hivStatus: text('hiv_status', { enum: ['negative', 'positive', 'unknown'] }).default('unknown'),
  hbvStatus: text('hbv_status', { enum: ['negative', 'positive', 'unknown'] }).default('unknown'),
  hcvStatus: text('hcv_status', { enum: ['negative', 'positive', 'unknown'] }).default('unknown'),
  serologyLastUpdate: integer('serology_last_update', { mode: 'timestamp' }),
  requiresIsolation: integer('requires_isolation', { mode: 'boolean' }).default(false),

  // Vaccination
  hepatitisBVaccinated: integer('hepatitis_b_vaccinated', { mode: 'boolean' }).default(false),
  hepatitisBLastDose: integer('hepatitis_b_last_dose', { mode: 'timestamp' }),

  // Status
  patientStatus: text('patient_status', { enum: ['active', 'transferred', 'deceased', 'transplanted', 'recovered'] }).default('active'),
  dialysisStartDate: integer('dialysis_start_date', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Vascular Accesses
 * FAV, catheters, and grafts history
 */
export const vascularAccesses = sqliteTable('dialyse_vascular_accesses', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => dialysePatients.id, { onDelete: 'cascade' }),

  type: text('type', { enum: ['fav', 'catheter_permanent', 'catheter_temporary', 'graft'] }).notNull(),
  location: text('location').notNull(), // e.g., "Left forearm", "Right jugular"
  creationDate: integer('creation_date', { mode: 'timestamp' }),
  surgeon: text('surgeon'),

  status: text('status', { enum: ['active', 'failed', 'removed', 'maturing'] }).default('active'),
  failureDate: integer('failure_date', { mode: 'timestamp' }),
  failureReason: text('failure_reason'),
  removalDate: integer('removal_date', { mode: 'timestamp' }),

  // Control dates
  lastControlDate: integer('last_control_date', { mode: 'timestamp' }),
  nextControlDate: integer('next_control_date', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// PRESCRIPTIONS
// ============================================================================

/**
 * Dialyse Prescriptions
 * Dialysis treatment prescriptions
 */
export const dialysePrescriptions = sqliteTable('dialyse_prescriptions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => dialysePatients.id, { onDelete: 'cascade' }),
  prescribedBy: text('prescribed_by').notNull().references(() => users.id),

  // Prescription info
  prescriptionNumber: text('prescription_number').notNull(),
  type: text('type', { enum: ['hemodialysis', 'hemofiltration', 'hemodiafiltration'] }).notNull(),
  isPermanent: integer('is_permanent', { mode: 'boolean' }).default(true),

  // Session parameters
  durationMinutes: integer('duration_minutes').notNull(), // e.g., 240 (4 hours)
  frequencyPerWeek: integer('frequency_per_week').notNull(), // e.g., 3
  dryWeight: real('dry_weight'), // Target weight in kg
  bloodFlowRate: integer('blood_flow_rate'), // ml/min (Qb)
  dialysateFlowRate: integer('dialysate_flow_rate'), // ml/min (Qd)

  // Dialyzer
  dialyzerType: text('dialyzer_type'),
  membraneSurface: real('membrane_surface'), // m2

  // Anticoagulation
  anticoagulationType: text('anticoagulation_type'), // heparin, LMWH, citrate, none
  anticoagulationDose: text('anticoagulation_dose'),
  anticoagulationProtocol: text('anticoagulation_protocol'),

  // Medications during session (JSON array)
  sessionMedications: text('session_medications'), // EPO, iron, vitamins, etc.

  // Dialysate composition
  dialysateType: text('dialysate_type'),
  dialysateSodium: integer('dialysate_sodium'), // mEq/L
  dialysatePotassium: real('dialysate_potassium'), // mEq/L
  dialysateBicarbonate: integer('dialysate_bicarbonate'), // mEq/L
  dialysateCalcium: real('dialysate_calcium'), // mEq/L

  // Validity
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  status: text('status', { enum: ['active', 'expired', 'cancelled', 'superseded'] }).default('active'),

  // Superseded prescription reference
  supersededById: text('superseded_by_id'),

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// MACHINES & EQUIPMENT
// ============================================================================

/**
 * Dialysis Machines
 * Dialysis generators/equipment inventory
 */
export const dialysisMachines = sqliteTable('dialyse_machines', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  warehouseId: text('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),

  machineNumber: text('machine_number').notNull(),
  model: text('model').notNull(),
  manufacturer: text('manufacturer'),
  serialNumber: text('serial_number'),

  // Status
  status: text('status', { enum: ['available', 'in_use', 'maintenance', 'out_of_service'] }).default('available'),
  isolationOnly: integer('isolation_only', { mode: 'boolean' }).default(false), // For sero+ patients only

  // Location
  location: text('location'), // Room/bay number

  // Counters
  totalHours: integer('total_hours').default(0),
  totalSessions: integer('total_sessions').default(0),

  // Dates
  installationDate: integer('installation_date', { mode: 'timestamp' }),
  lastMaintenanceDate: integer('last_maintenance_date', { mode: 'timestamp' }),
  nextMaintenanceDate: integer('next_maintenance_date', { mode: 'timestamp' }),
  warrantyExpiry: integer('warranty_expiry', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Machine Maintenance Records
 * Maintenance history for dialysis machines
 */
export const machineMaintenanceRecords = sqliteTable('dialyse_machine_maintenance', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  machineId: text('machine_id').notNull().references(() => dialysisMachines.id, { onDelete: 'cascade' }),

  maintenanceNumber: text('maintenance_number').notNull(),
  type: text('type', { enum: ['preventive', 'corrective', 'calibration', 'inspection'] }).notNull(),
  status: text('status', { enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] }).default('scheduled'),

  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }),
  completedDate: integer('completed_date', { mode: 'timestamp' }),

  performedBy: text('performed_by'),
  vendor: text('vendor'),
  description: text('description'),
  workPerformed: text('work_performed'),
  cost: real('cost').default(0),
  downtime: integer('downtime'), // hours

  partsReplaced: text('parts_replaced'), // JSON array

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// SESSION PLANNING
// ============================================================================

/**
 * Session Slots
 * Configurable time slots for dialysis sessions
 */
export const dialysisSessionSlots = sqliteTable('dialyse_session_slots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  name: text('name').notNull(), // e.g., "Morning", "Afternoon", "Evening"
  startTime: text('start_time').notNull(), // "06:00"
  endTime: text('end_time').notNull(), // "12:00"
  daysOfWeek: text('days_of_week').notNull(), // JSON array [1,2,3,4,5,6] (Mon-Sat)

  maxPatients: integer('max_patients').notNull(),
  active: integer('active', { mode: 'boolean' }).default(true),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Dialysis Sessions
 * Scheduled and completed dialysis sessions
 */
export const dialysisSessions = sqliteTable('dialyse_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => dialysePatients.id, { onDelete: 'cascade' }),
  prescriptionId: text('prescription_id').notNull().references(() => dialysePrescriptions.id),
  machineId: text('machine_id').references(() => dialysisMachines.id, { onDelete: 'set null' }),
  slotId: text('slot_id').references(() => dialysisSessionSlots.id, { onDelete: 'set null' }),

  sessionNumber: text('session_number').notNull(),
  sessionDate: integer('session_date', { mode: 'timestamp' }).notNull(),

  // Status workflow
  status: text('status', { enum: ['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'] }).default('scheduled'),

  // Timing
  scheduledStartTime: text('scheduled_start_time'),
  actualStartTime: integer('actual_start_time', { mode: 'timestamp' }),
  actualEndTime: integer('actual_end_time', { mode: 'timestamp' }),
  actualDurationMinutes: integer('actual_duration_minutes'),

  // Recurrence (for weekly programs)
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurrenceGroupId: text('recurrence_group_id'), // Links recurring sessions

  // Staff assignment
  primaryNurseId: text('primary_nurse_id').references(() => employees.id, { onDelete: 'set null' }),
  supervisingDoctorId: text('supervising_doctor_id').references(() => employees.id, { onDelete: 'set null' }),

  // Cancellation
  cancellationReason: text('cancellation_reason'),
  cancelledBy: text('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// SESSION MONITORING
// ============================================================================

/**
 * Session Records
 * Per-dialytic monitoring data (pre, intra, post)
 */
export const sessionRecords = sqliteTable('dialyse_session_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => dialysisSessions.id, { onDelete: 'cascade' }),

  phase: text('phase', { enum: ['pre', 'intra', 'post'] }).notNull(),
  recordTime: integer('record_time', { mode: 'timestamp' }).notNull(),

  // Vitals
  weightKg: real('weight_kg'),
  systolicBp: integer('systolic_bp'),
  diastolicBp: integer('diastolic_bp'),
  heartRate: integer('heart_rate'),
  temperature: real('temperature'),

  // Machine parameters (intra-dialytic)
  arterialPressure: integer('arterial_pressure'), // mmHg
  venousPressure: integer('venous_pressure'), // mmHg
  transmembranePressure: integer('transmembrane_pressure'), // PTM mmHg
  bloodFlowRate: integer('blood_flow_rate'), // ml/min
  dialysateFlowRate: integer('dialysate_flow_rate'), // ml/min
  cumulativeUF: real('cumulative_uf'), // ml

  // Clinical state
  clinicalState: text('clinical_state'), // JSON - symptoms, pain, fatigue level
  vascularAccessState: text('vascular_access_state'),

  // Post-dialysis specific
  compressionTime: integer('compression_time'), // minutes
  ufAchieved: real('uf_achieved'), // ml - final UF
  ufPrescribed: real('uf_prescribed'), // ml

  // Incidents
  hasIncident: integer('has_incident', { mode: 'boolean' }).default(false),

  recordedBy: text('recorded_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Session Incidents
 * Intra-dialytic incidents and complications
 */
export const sessionIncidents = sqliteTable('dialyse_session_incidents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => dialysisSessions.id, { onDelete: 'cascade' }),
  sessionRecordId: text('session_record_id').references(() => sessionRecords.id, { onDelete: 'set null' }),

  incidentTime: integer('incident_time', { mode: 'timestamp' }).notNull(),
  type: text('type', { enum: ['hypotension', 'cramps', 'nausea', 'bleeding', 'clotting', 'fever', 'chest_pain', 'arrhythmia', 'access_problem', 'other'] }).notNull(),
  severity: text('severity', { enum: ['mild', 'moderate', 'severe'] }).notNull(),

  description: text('description'),
  intervention: text('intervention'),
  outcome: text('outcome'),

  reportedBy: text('reported_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Session Medications
 * Medications administered during dialysis session
 */
export const sessionMedications = sqliteTable('dialyse_session_medications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => dialysisSessions.id, { onDelete: 'cascade' }),

  medicationName: text('medication_name').notNull(),
  dose: text('dose').notNull(),
  route: text('route', { enum: ['iv', 'sc', 'oral', 'dialysate'] }).notNull(),
  administeredAt: integer('administered_at', { mode: 'timestamp' }).notNull(),
  administeredBy: text('administered_by').notNull().references(() => users.id),

  // Lot traceability (links to inventory)
  lotId: text('lot_id').references(() => lots.id, { onDelete: 'set null' }),

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Session Consumables
 * Consumables used during dialysis session
 */
export const sessionConsumables = sqliteTable('dialyse_session_consumables', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => dialysisSessions.id, { onDelete: 'cascade' }),

  inventoryItemId: text('inventory_item_id').notNull().references(() => inventoryItems.id),
  lotId: text('lot_id').references(() => lots.id, { onDelete: 'set null' }),

  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Session Signatures
 * Electronic signatures for session validation
 */
export const sessionSignatures = sqliteTable('dialyse_session_signatures', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => dialysisSessions.id, { onDelete: 'cascade' }),

  signatureType: text('signature_type', { enum: ['nurse_start', 'nurse_end', 'doctor_validation'] }).notNull(),
  signedBy: text('signed_by').notNull().references(() => users.id),
  signedAt: integer('signed_at', { mode: 'timestamp' }).notNull(),
  signatureData: text('signature_data'), // Digital signature or confirmation

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// LABORATORY RESULTS
// ============================================================================

/**
 * Lab Results
 * Laboratory test results for dialysis patients
 */
export const labResults = sqliteTable('dialyse_lab_results', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => dialysePatients.id, { onDelete: 'cascade' }),

  labDate: integer('lab_date', { mode: 'timestamp' }).notNull(),
  labSource: text('lab_source'), // Lab name or import source
  importMethod: text('import_method', { enum: ['manual', 'file_import', 'api'] }).default('manual'),

  // Key dialysis markers
  urea: real('urea'), // mmol/L
  ureaPre: real('urea_pre'), // Pre-dialysis urea for Kt/V
  ureaPost: real('urea_post'), // Post-dialysis urea for Kt/V
  creatinine: real('creatinine'), // umol/L
  ktV: real('kt_v'), // Kt/V ratio (calculated or imported)
  hemoglobin: real('hemoglobin'), // g/dL
  hematocrit: real('hematocrit'), // %
  pth: real('pth'), // pg/mL (parathyroid hormone)
  calcium: real('calcium'), // mmol/L
  phosphorus: real('phosphorus'), // mmol/L
  potassium: real('potassium'), // mmol/L
  sodium: real('sodium'), // mmol/L
  bicarbonate: real('bicarbonate'), // mmol/L
  albumin: real('albumin'), // g/L
  ferritin: real('ferritin'), // ng/mL
  transferrinSaturation: real('transferrin_saturation'), // % (TSAT)
  crp: real('crp'), // mg/L (C-reactive protein)

  // All results as JSON for extensibility
  allResults: text('all_results'), // JSON with all lab values

  // Alerts
  hasOutOfRangeValues: integer('has_out_of_range_values', { mode: 'boolean' }).default(false),
  outOfRangeMarkers: text('out_of_range_markers'), // JSON array

  // Review
  reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// CLINICAL ALERTS
// ============================================================================

/**
 * Clinical Alerts
 * Clinical alerts and reminders for patient care
 */
export const clinicalAlerts = sqliteTable('dialyse_clinical_alerts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => dialysePatients.id, { onDelete: 'cascade' }),

  alertType: text('alert_type', {
    enum: ['prescription_renewal', 'lab_due', 'vaccination', 'vascular_access', 'serology_update', 'weight_deviation', 'custom']
  }).notNull(),
  severity: text('severity', { enum: ['info', 'warning', 'critical'] }).notNull(),

  title: text('title').notNull(),
  description: text('description'),

  dueDate: integer('due_date', { mode: 'timestamp' }),

  status: text('status', { enum: ['active', 'acknowledged', 'resolved', 'dismissed'] }).default('active'),

  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  acknowledgedBy: text('acknowledged_by').references(() => users.id, { onDelete: 'set null' }),
  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
  resolvedBy: text('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolutionNotes: text('resolution_notes'),

  // Reference to related entity
  relatedToType: text('related_to_type'), // prescription, lab_result, vascular_access, session
  relatedToId: text('related_to_id'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DialysePatient = typeof dialysePatients.$inferSelect;
export type InsertDialysePatient = typeof dialysePatients.$inferInsert;

export type VascularAccess = typeof vascularAccesses.$inferSelect;
export type InsertVascularAccess = typeof vascularAccesses.$inferInsert;

export type DialysePrescription = typeof dialysePrescriptions.$inferSelect;
export type InsertDialysePrescription = typeof dialysePrescriptions.$inferInsert;

export type DialysisMachine = typeof dialysisMachines.$inferSelect;
export type InsertDialysisMachine = typeof dialysisMachines.$inferInsert;

export type MachineMaintenanceRecord = typeof machineMaintenanceRecords.$inferSelect;
export type InsertMachineMaintenanceRecord = typeof machineMaintenanceRecords.$inferInsert;

export type DialysisSessionSlot = typeof dialysisSessionSlots.$inferSelect;
export type InsertDialysisSessionSlot = typeof dialysisSessionSlots.$inferInsert;

export type DialysisSession = typeof dialysisSessions.$inferSelect;
export type InsertDialysisSession = typeof dialysisSessions.$inferInsert;

export type SessionRecord = typeof sessionRecords.$inferSelect;
export type InsertSessionRecord = typeof sessionRecords.$inferInsert;

export type SessionIncident = typeof sessionIncidents.$inferSelect;
export type InsertSessionIncident = typeof sessionIncidents.$inferInsert;

export type SessionMedication = typeof sessionMedications.$inferSelect;
export type InsertSessionMedication = typeof sessionMedications.$inferInsert;

export type SessionConsumable = typeof sessionConsumables.$inferSelect;
export type InsertSessionConsumable = typeof sessionConsumables.$inferInsert;

export type SessionSignature = typeof sessionSignatures.$inferSelect;
export type InsertSessionSignature = typeof sessionSignatures.$inferInsert;

export type LabResult = typeof labResults.$inferSelect;
export type InsertLabResult = typeof labResults.$inferInsert;

export type ClinicalAlert = typeof clinicalAlerts.$inferSelect;
export type InsertClinicalAlert = typeof clinicalAlerts.$inferInsert;
