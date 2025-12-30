/**
 * Healthcare Platform Core Schema
 * Shared tables for all healthcare modules (Cardiologie, Ophtalmologie, etc.)
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';
import { contacts } from './crm';
import { employees } from './hr';

// ============================================================================
// SHARED PATIENT MANAGEMENT
// ============================================================================

/**
 * Healthcare Patients
 * Shared patient records across all healthcare modules
 */
export const healthcarePatients = sqliteTable('healthcare_patients', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),

  // Patient info
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  gender: text('gender').notNull().default('male'),
  nationalId: text('national_id'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  bloodType: text('blood_type'),
  allergies: text('allergies'),
  medicalHistory: text('medical_history'),
  familyHistory: text('family_history'),
  insuranceProvider: text('insurance_provider'),
  insuranceNumber: text('insurance_number'),
  notes: text('notes'),
  status: text('status').default('active'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// SHARED CONSULTATIONS
// ============================================================================

/**
 * Healthcare Consultations
 * Generic consultation records for all modules
 * Matches actual database structure
 */
export const healthcareConsultations = sqliteTable('healthcare_consultations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),
  module: text('module', { enum: ['cardiology', 'ophthalmology', 'dialyse', 'general'] }).notNull(),

  // Date and time
  consultationDate: text('consultation_date').notNull(),
  consultationTime: text('consultation_time'),

  // Type
  consultationType: text('consultation_type', { enum: ['routine', 'urgent', 'follow_up', 'initial', 'emergency', 'pre_operative', 'post_operative'] }).notNull(),

  // Provider
  doctorId: text('doctor_id'),
  doctorName: text('doctor_name'),

  // Clinical
  chiefComplaint: text('chief_complaint'),
  diagnosis: text('diagnosis'),
  treatmentPlan: text('treatment_plan'),
  notes: text('notes'),
  followUpDate: text('follow_up_date'),

  // Status
  status: text('status', { enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'] }).default('scheduled'),

  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// ============================================================================
// SHARED EXAMINATIONS
// ============================================================================

/**
 * Healthcare Examinations
 * Generic examination/test records
 */
export const healthcareExaminations = sqliteTable('healthcare_examinations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  examinationNumber: text('examination_number').notNull(),
  examinationDate: integer('examination_date', { mode: 'timestamp' }).notNull(),
  module: text('module', { enum: ['cardiology', 'ophthalmology', 'dialyse', 'general'] }).notNull(),

  // Examination type (module-specific)
  examinationType: text('examination_type').notNull(), // ECG, OCT, Echo, etc.
  examinationSubtype: text('examination_subtype'),

  // Provider
  performedBy: text('performed_by').references(() => employees.id, { onDelete: 'set null' }),
  interpretedBy: text('interpreted_by').references(() => employees.id, { onDelete: 'set null' }),
  interpretedAt: integer('interpreted_at', { mode: 'timestamp' }),

  // Results
  findings: text('findings'),
  interpretation: text('interpretation'),
  conclusion: text('conclusion'),
  recommendations: text('recommendations'),

  // Measurements (JSON for flexibility)
  measurements: text('measurements'), // JSON object with module-specific measurements

  // Media
  mediaUrls: text('media_urls'), // JSON array of R2 URLs
  reportUrl: text('report_url'), // PDF report URL

  // Status
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'reviewed', 'cancelled'] }).default('pending'),
  urgency: text('urgency', { enum: ['routine', 'urgent', 'stat'] }).default('routine'),

  // Alerts
  hasAbnormalFindings: integer('has_abnormal_findings', { mode: 'boolean' }).default(false),
  abnormalFindings: text('abnormal_findings'), // JSON array

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// IMPLANTED DEVICES
// ============================================================================

/**
 * Healthcare Implanted Devices
 * Track implanted medical devices (pacemakers, IOLs, stents, etc.)
 */
export const healthcareImplantedDevices = sqliteTable('healthcare_implanted_devices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  deviceNumber: text('device_number').notNull(),
  module: text('module', { enum: ['cardiology', 'ophthalmology', 'dialyse', 'general'] }).notNull(),

  // Device information
  deviceType: text('device_type').notNull(), // pacemaker, icd, stent, iol, etc.
  deviceSubtype: text('device_subtype'),
  manufacturer: text('manufacturer'),
  model: text('model'),
  serialNumber: text('serial_number'),
  lotNumber: text('lot_number'),

  // Implantation
  implantationDate: integer('implantation_date', { mode: 'timestamp' }).notNull(),
  implantationSite: text('implantation_site'),
  implantedBy: text('implanted_by').references(() => employees.id, { onDelete: 'set null' }),
  implantationProcedure: text('implantation_procedure'),

  // Device-specific data (JSON for flexibility)
  deviceSettings: text('device_settings'), // JSON - e.g., pacemaker settings, IOL power
  deviceMeasurements: text('device_measurements'), // JSON - e.g., lead impedances

  // Status
  status: text('status', { enum: ['active', 'replaced', 'explanted', 'malfunctioning'] }).default('active'),
  statusDate: integer('status_date', { mode: 'timestamp' }),
  statusReason: text('status_reason'),

  // Replacement info
  replacedById: text('replaced_by_id'),
  replacementDate: integer('replacement_date', { mode: 'timestamp' }),
  replacementReason: text('replacement_reason'),

  // Follow-up
  lastCheckDate: integer('last_check_date', { mode: 'timestamp' }),
  nextCheckDate: integer('next_check_date', { mode: 'timestamp' }),
  checkIntervalMonths: integer('check_interval_months'),

  // Warranty and lifespan
  warrantyExpiry: integer('warranty_expiry', { mode: 'timestamp' }),
  expectedEndOfLife: integer('expected_end_of_life', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// CHRONIC CONDITIONS
// ============================================================================

/**
 * Healthcare Chronic Conditions
 * Track chronic conditions and comorbidities
 */
export const healthcareChronicConditions = sqliteTable('healthcare_chronic_conditions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  // Condition details
  conditionCode: text('condition_code'), // ICD-10 code
  conditionName: text('condition_name').notNull(),
  module: text('module', { enum: ['cardiology', 'ophthalmology', 'dialyse', 'general'] }).notNull(),
  category: text('category'), // e.g., cardiovascular, metabolic, neurological

  // Diagnosis
  diagnosisDate: integer('diagnosis_date', { mode: 'timestamp' }),
  diagnosedBy: text('diagnosed_by').references(() => employees.id, { onDelete: 'set null' }),
  diagnosisMethod: text('diagnosis_method'),

  // Severity and stage
  severity: text('severity', { enum: ['mild', 'moderate', 'severe', 'critical'] }),
  stage: text('stage'), // Disease-specific staging (e.g., NYHA class, DR stage)

  // Status
  status: text('status', { enum: ['active', 'controlled', 'resolved', 'in_remission'] }).default('active'),
  statusDate: integer('status_date', { mode: 'timestamp' }),

  // Treatment
  currentTreatment: text('current_treatment'),
  treatmentGoals: text('treatment_goals'),
  treatmentResponse: text('treatment_response', { enum: ['excellent', 'good', 'partial', 'poor', 'unknown'] }),

  // Monitoring
  monitoringParameters: text('monitoring_parameters'), // JSON array of what to monitor
  lastAssessmentDate: integer('last_assessment_date', { mode: 'timestamp' }),
  nextAssessmentDate: integer('next_assessment_date', { mode: 'timestamp' }),

  // Risk factors
  riskFactors: text('risk_factors'), // JSON array
  complications: text('complications'), // JSON array of associated complications

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// ALERTS
// ============================================================================

/**
 * Healthcare Alerts
 * Clinical alerts and reminders across modules
 */
export const healthcareAlerts = sqliteTable('healthcare_alerts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  module: text('module', { enum: ['cardiology', 'ophthalmology', 'dialyse', 'general'] }).notNull(),

  alertType: text('alert_type', {
    enum: ['appointment_due', 'examination_due', 'device_check', 'lab_due', 'medication_review',
           'condition_worsening', 'abnormal_result', 'follow_up_needed', 'custom']
  }).notNull(),
  severity: text('severity', { enum: ['info', 'warning', 'critical'] }).notNull(),

  title: text('title').notNull(),
  description: text('description'),

  dueDate: integer('due_date', { mode: 'timestamp' }),
  triggeredAt: integer('triggered_at', { mode: 'timestamp' }),

  status: text('status', { enum: ['active', 'acknowledged', 'resolved', 'dismissed', 'snoozed'] }).default('active'),
  snoozedUntil: integer('snoozed_until', { mode: 'timestamp' }),

  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  acknowledgedBy: text('acknowledged_by').references(() => users.id, { onDelete: 'set null' }),
  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
  resolvedBy: text('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolutionNotes: text('resolution_notes'),

  // Reference to related entity
  relatedToType: text('related_to_type'), // consultation, examination, device, condition
  relatedToId: text('related_to_id'),

  // Auto-generated
  isAutoGenerated: integer('is_auto_generated', { mode: 'boolean' }).default(false),
  generationRule: text('generation_rule'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// DOCUMENTS
// ============================================================================

/**
 * Healthcare Documents
 * Medical documents and attachments
 */
export const healthcareDocuments = sqliteTable('healthcare_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  module: text('module', { enum: ['cardiology', 'ophthalmology', 'dialyse', 'general'] }).notNull(),

  documentType: text('document_type', {
    enum: ['consultation_report', 'examination_report', 'lab_result', 'prescription',
           'referral_letter', 'discharge_summary', 'consent_form', 'imaging', 'other']
  }).notNull(),

  title: text('title').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(), // R2 URL
  fileType: text('file_type').notNull(), // MIME type
  fileSize: integer('file_size'), // bytes

  // Associated records
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),
  examinationId: text('examination_id').references(() => healthcareExaminations.id, { onDelete: 'set null' }),

  // Document date (may differ from upload date)
  documentDate: integer('document_date', { mode: 'timestamp' }),

  // Access control
  isConfidential: integer('is_confidential', { mode: 'boolean' }).default(false),
  accessLevel: text('access_level', { enum: ['all', 'physicians_only', 'owner_only'] }).default('all'),

  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// APPOINTMENTS
// ============================================================================

/**
 * Healthcare Appointments
 * Shared appointment scheduling
 */
export const healthcareAppointments = sqliteTable('healthcare_appointments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  appointmentNumber: text('appointment_number').notNull(),
  module: text('module', { enum: ['cardiology', 'ophthalmology', 'dialyse', 'general'] }).notNull(),

  appointmentType: text('appointment_type', {
    enum: ['consultation', 'examination', 'procedure', 'follow_up', 'device_check', 'other']
  }).notNull(),

  // Scheduling
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
  scheduledTime: text('scheduled_time'), // "09:00"
  durationMinutes: integer('duration_minutes').default(30),

  // Provider
  providerId: text('provider_id').references(() => employees.id, { onDelete: 'set null' }),
  location: text('location'),
  room: text('room'),

  // Status
  status: text('status', { enum: ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'] }).default('scheduled'),

  // Confirmation
  confirmedAt: integer('confirmed_at', { mode: 'timestamp' }),
  confirmedBy: text('confirmed_by'),
  reminderSent: integer('reminder_sent', { mode: 'boolean' }).default(false),
  reminderSentAt: integer('reminder_sent_at', { mode: 'timestamp' }),

  // Check-in/out
  checkedInAt: integer('checked_in_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),

  // Cancellation/Reschedule
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
  cancelledBy: text('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
  cancellationReason: text('cancellation_reason'),
  rescheduledFromId: text('rescheduled_from_id'),
  rescheduledToId: text('rescheduled_to_id'),

  // Recurrence
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurrenceRule: text('recurrence_rule'), // RRULE format
  recurrenceGroupId: text('recurrence_group_id'),

  reason: text('reason'),
  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type HealthcarePatient = typeof healthcarePatients.$inferSelect;
export type InsertHealthcarePatient = typeof healthcarePatients.$inferInsert;

export type HealthcareConsultation = typeof healthcareConsultations.$inferSelect;
export type InsertHealthcareConsultation = typeof healthcareConsultations.$inferInsert;

export type HealthcareExamination = typeof healthcareExaminations.$inferSelect;
export type InsertHealthcareExamination = typeof healthcareExaminations.$inferInsert;

export type HealthcareImplantedDevice = typeof healthcareImplantedDevices.$inferSelect;
export type InsertHealthcareImplantedDevice = typeof healthcareImplantedDevices.$inferInsert;

export type HealthcareChronicCondition = typeof healthcareChronicConditions.$inferSelect;
export type InsertHealthcareChronicCondition = typeof healthcareChronicConditions.$inferInsert;

export type HealthcareAlert = typeof healthcareAlerts.$inferSelect;
export type InsertHealthcareAlert = typeof healthcareAlerts.$inferInsert;

export type HealthcareDocument = typeof healthcareDocuments.$inferSelect;
export type InsertHealthcareDocument = typeof healthcareDocuments.$inferInsert;

export type HealthcareAppointment = typeof healthcareAppointments.$inferSelect;
export type InsertHealthcareAppointment = typeof healthcareAppointments.$inferInsert;
