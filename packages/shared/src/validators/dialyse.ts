/**
 * Dialyse (Dialysis) Healthcare Module Validators (Zod schemas)
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const serologyStatusEnum = z.enum(['negative', 'positive', 'unknown']);
export const patientStatusEnum = z.enum(['active', 'transferred', 'deceased', 'transplanted', 'recovered']);
export const bloodTypeEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

export const vascularAccessTypeEnum = z.enum(['fav', 'catheter_permanent', 'catheter_temporary', 'graft']);
export const vascularAccessStatusEnum = z.enum(['active', 'failed', 'removed', 'maturing']);

export const dialysisTypeEnum = z.enum(['hemodialysis', 'hemofiltration', 'hemodiafiltration']);
export const prescriptionStatusEnum = z.enum(['active', 'expired', 'cancelled', 'superseded']);

export const machineStatusEnum = z.enum(['available', 'in_use', 'maintenance', 'out_of_service']);
export const maintenanceTypeEnum = z.enum(['preventive', 'corrective', 'calibration', 'inspection']);
export const maintenanceStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);

export const sessionStatusEnum = z.enum(['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']);
export const sessionPhaseEnum = z.enum(['pre', 'intra', 'post']);

export const incidentTypeEnum = z.enum(['hypotension', 'cramps', 'nausea', 'bleeding', 'clotting', 'fever', 'chest_pain', 'arrhythmia', 'access_problem', 'other']);
export const incidentSeverityEnum = z.enum(['mild', 'moderate', 'severe']);

export const medicationRouteEnum = z.enum(['iv', 'sc', 'oral', 'dialysate']);
export const signatureTypeEnum = z.enum(['nurse_start', 'nurse_end', 'doctor_validation']);

export const labImportMethodEnum = z.enum(['manual', 'file_import', 'api']);

export const alertTypeEnum = z.enum(['prescription_renewal', 'lab_due', 'vaccination', 'vascular_access', 'serology_update', 'weight_deviation', 'custom']);
export const alertSeverityEnum = z.enum(['info', 'warning', 'critical']);
export const alertStatusEnum = z.enum(['active', 'acknowledged', 'resolved', 'dismissed']);

// ============================================================================
// PATIENT VALIDATORS
// ============================================================================

/**
 * Create patient schema
 */
export const createPatientSchema = z.object({
  // Contact info (for CRM contact creation)
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional().nullable(),
  mobile: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),

  // Medical identifiers
  medicalId: z.string().min(1).max(50),
  photo: z.string().url().optional().nullable(),

  // Emergency contact
  emergencyContactName: z.string().max(200).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  emergencyContactRelation: z.string().max(100).optional().nullable(),

  // Medical info
  bloodType: bloodTypeEnum.optional().nullable(),
  dryWeight: z.number().min(20).max(200).optional().nullable(),
  renalFailureEtiology: z.string().max(500).optional().nullable(),
  medicalHistory: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),

  // Serology
  hivStatus: serologyStatusEnum.default('unknown'),
  hbvStatus: serologyStatusEnum.default('unknown'),
  hcvStatus: serologyStatusEnum.default('unknown'),
  serologyLastUpdate: z.string().datetime().or(z.date()).optional().nullable(),
  requiresIsolation: z.boolean().default(false),

  // Vaccination
  hepatitisBVaccinated: z.boolean().default(false),
  hepatitisBLastDose: z.string().datetime().or(z.date()).optional().nullable(),

  // Status
  patientStatus: patientStatusEnum.default('active'),
  dialysisStartDate: z.string().datetime().or(z.date()).optional().nullable(),

  notes: z.string().max(5000).optional().nullable(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

/**
 * Update patient schema
 */
export const updatePatientSchema = z.object({
  // Contact info
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional().nullable(),
  mobile: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),

  // Medical identifiers
  medicalId: z.string().min(1).max(50).optional(),
  photo: z.string().url().optional().nullable(),

  // Emergency contact
  emergencyContactName: z.string().max(200).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  emergencyContactRelation: z.string().max(100).optional().nullable(),

  // Medical info
  bloodType: bloodTypeEnum.optional().nullable(),
  dryWeight: z.number().min(20).max(200).optional().nullable(),
  renalFailureEtiology: z.string().max(500).optional().nullable(),
  medicalHistory: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),

  // Serology
  hivStatus: serologyStatusEnum.optional(),
  hbvStatus: serologyStatusEnum.optional(),
  hcvStatus: serologyStatusEnum.optional(),
  serologyLastUpdate: z.string().datetime().or(z.date()).optional().nullable(),
  requiresIsolation: z.boolean().optional(),

  // Vaccination
  hepatitisBVaccinated: z.boolean().optional(),
  hepatitisBLastDose: z.string().datetime().or(z.date()).optional().nullable(),

  // Status
  patientStatus: patientStatusEnum.optional(),
  dialysisStartDate: z.string().datetime().or(z.date()).optional().nullable(),

  notes: z.string().max(5000).optional().nullable(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

/**
 * Update serology schema
 */
export const updateSerologySchema = z.object({
  hivStatus: serologyStatusEnum,
  hbvStatus: serologyStatusEnum,
  hcvStatus: serologyStatusEnum,
  requiresIsolation: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export type UpdateSerologyInput = z.infer<typeof updateSerologySchema>;

// ============================================================================
// VASCULAR ACCESS VALIDATORS
// ============================================================================

/**
 * Create vascular access schema
 */
export const createVascularAccessSchema = z.object({
  patientId: z.string().uuid(),
  type: vascularAccessTypeEnum,
  location: z.string().min(1).max(200),
  creationDate: z.string().datetime().or(z.date()).optional().nullable(),
  surgeon: z.string().max(200).optional().nullable(),
  status: vascularAccessStatusEnum.default('active'),
  lastControlDate: z.string().datetime().or(z.date()).optional().nullable(),
  nextControlDate: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateVascularAccessInput = z.infer<typeof createVascularAccessSchema>;

/**
 * Update vascular access schema
 */
export const updateVascularAccessSchema = z.object({
  type: vascularAccessTypeEnum.optional(),
  location: z.string().min(1).max(200).optional(),
  creationDate: z.string().datetime().or(z.date()).optional().nullable(),
  surgeon: z.string().max(200).optional().nullable(),
  status: vascularAccessStatusEnum.optional(),
  failureDate: z.string().datetime().or(z.date()).optional().nullable(),
  failureReason: z.string().max(500).optional().nullable(),
  removalDate: z.string().datetime().or(z.date()).optional().nullable(),
  lastControlDate: z.string().datetime().or(z.date()).optional().nullable(),
  nextControlDate: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateVascularAccessInput = z.infer<typeof updateVascularAccessSchema>;

// ============================================================================
// PRESCRIPTION VALIDATORS
// ============================================================================

/**
 * Create prescription schema
 */
export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  type: dialysisTypeEnum,
  isPermanent: z.boolean().default(true),

  // Session parameters
  durationMinutes: z.number().int().min(60).max(480), // 1-8 hours
  frequencyPerWeek: z.number().int().min(1).max(7),
  dryWeight: z.number().min(20).max(200).optional().nullable(),
  bloodFlowRate: z.number().int().min(100).max(500).optional().nullable(), // ml/min
  dialysateFlowRate: z.number().int().min(300).max(800).optional().nullable(), // ml/min

  // Dialyzer
  dialyzerType: z.string().max(100).optional().nullable(),
  membraneSurface: z.number().min(0.5).max(3).optional().nullable(), // m2

  // Anticoagulation
  anticoagulationType: z.string().max(100).optional().nullable(),
  anticoagulationDose: z.string().max(100).optional().nullable(),
  anticoagulationProtocol: z.string().max(500).optional().nullable(),

  // Medications
  sessionMedications: z.array(z.object({
    name: z.string(),
    dose: z.string(),
    route: medicationRouteEnum,
  })).optional(),

  // Dialysate
  dialysateType: z.string().max(100).optional().nullable(),
  dialysateSodium: z.number().int().min(130).max(150).optional().nullable(),
  dialysatePotassium: z.number().min(0).max(4).optional().nullable(),
  dialysateBicarbonate: z.number().int().min(25).max(40).optional().nullable(),
  dialysateCalcium: z.number().min(1).max(2).optional().nullable(),

  // Validity
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional().nullable(),

  notes: z.string().max(2000).optional().nullable(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

/**
 * Update prescription schema
 */
export const updatePrescriptionSchema = createPrescriptionSchema.partial().omit({ patientId: true });

export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>;

// ============================================================================
// MACHINE VALIDATORS
// ============================================================================

/**
 * Create machine schema
 */
export const createMachineSchema = z.object({
  machineNumber: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  manufacturer: z.string().max(100).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  warehouseId: z.string().uuid().optional().nullable(),
  status: machineStatusEnum.default('available'),
  isolationOnly: z.boolean().default(false),
  location: z.string().max(100).optional().nullable(),
  installationDate: z.string().datetime().or(z.date()).optional().nullable(),
  warrantyExpiry: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateMachineInput = z.infer<typeof createMachineSchema>;

/**
 * Update machine schema
 */
export const updateMachineSchema = z.object({
  machineNumber: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(100).optional(),
  manufacturer: z.string().max(100).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  warehouseId: z.string().uuid().optional().nullable(),
  status: machineStatusEnum.optional(),
  isolationOnly: z.boolean().optional(),
  location: z.string().max(100).optional().nullable(),
  installationDate: z.string().datetime().or(z.date()).optional().nullable(),
  lastMaintenanceDate: z.string().datetime().or(z.date()).optional().nullable(),
  nextMaintenanceDate: z.string().datetime().or(z.date()).optional().nullable(),
  warrantyExpiry: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateMachineInput = z.infer<typeof updateMachineSchema>;

/**
 * Create maintenance record schema
 */
export const createMaintenanceRecordSchema = z.object({
  machineId: z.string().uuid(),
  type: maintenanceTypeEnum,
  scheduledDate: z.string().datetime().or(z.date()).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  vendor: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordSchema>;

/**
 * Update maintenance record schema
 */
export const updateMaintenanceRecordSchema = z.object({
  type: maintenanceTypeEnum.optional(),
  status: maintenanceStatusEnum.optional(),
  scheduledDate: z.string().datetime().or(z.date()).optional().nullable(),
  completedDate: z.string().datetime().or(z.date()).optional().nullable(),
  performedBy: z.string().max(200).optional().nullable(),
  vendor: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  workPerformed: z.string().max(2000).optional().nullable(),
  cost: z.number().min(0).optional(),
  downtime: z.number().int().min(0).optional(),
  partsReplaced: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateMaintenanceRecordInput = z.infer<typeof updateMaintenanceRecordSchema>;

// ============================================================================
// SESSION VALIDATORS
// ============================================================================

/**
 * Create session slot schema
 */
export const createSessionSlotSchema = z.object({
  name: z.string().min(1).max(100),
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  daysOfWeek: z.array(z.number().int().min(0).max(6)), // 0=Sunday, 6=Saturday
  maxPatients: z.number().int().min(1).max(50),
  active: z.boolean().default(true),
});

export type CreateSessionSlotInput = z.infer<typeof createSessionSlotSchema>;

/**
 * Update session slot schema
 */
export const updateSessionSlotSchema = createSessionSlotSchema.partial();

export type UpdateSessionSlotInput = z.infer<typeof updateSessionSlotSchema>;

/**
 * Create session schema
 */
export const createSessionSchema = z.object({
  patientId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  machineId: z.string().uuid().optional().nullable(),
  slotId: z.string().uuid().optional().nullable(),
  sessionDate: z.string().datetime().or(z.date()),
  scheduledStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  primaryNurseId: z.string().uuid().optional().nullable(),
  supervisingDoctorId: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

/**
 * Create recurring sessions schema
 */
export const createRecurringSessionsSchema = z.object({
  patientId: z.string().uuid(),
  prescriptionId: z.string().uuid(),
  machineId: z.string().uuid().optional().nullable(),
  slotId: z.string().uuid(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)), // Days to create sessions
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  scheduledStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  primaryNurseId: z.string().uuid().optional().nullable(),
});

export type CreateRecurringSessionsInput = z.infer<typeof createRecurringSessionsSchema>;

/**
 * Update session schema
 */
export const updateSessionSchema = z.object({
  machineId: z.string().uuid().optional().nullable(),
  slotId: z.string().uuid().optional().nullable(),
  sessionDate: z.string().datetime().or(z.date()).optional(),
  scheduledStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  status: sessionStatusEnum.optional(),
  primaryNurseId: z.string().uuid().optional().nullable(),
  supervisingDoctorId: z.string().uuid().optional().nullable(),
  cancellationReason: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

// ============================================================================
// SESSION MONITORING VALIDATORS
// ============================================================================

/**
 * Create session record schema
 */
export const createSessionRecordSchema = z.object({
  sessionId: z.string().uuid(),
  phase: sessionPhaseEnum,
  recordTime: z.string().datetime().or(z.date()),

  // Vitals
  weightKg: z.number().min(20).max(300).optional().nullable(),
  systolicBp: z.number().int().min(50).max(300).optional().nullable(),
  diastolicBp: z.number().int().min(30).max(200).optional().nullable(),
  heartRate: z.number().int().min(30).max(250).optional().nullable(),
  temperature: z.number().min(34).max(42).optional().nullable(),

  // Machine parameters
  arterialPressure: z.number().int().min(-300).max(0).optional().nullable(),
  venousPressure: z.number().int().min(0).max(300).optional().nullable(),
  transmembranePressure: z.number().int().min(0).max(500).optional().nullable(),
  bloodFlowRate: z.number().int().min(0).max(600).optional().nullable(),
  dialysateFlowRate: z.number().int().min(0).max(1000).optional().nullable(),
  cumulativeUF: z.number().min(0).max(10000).optional().nullable(),

  // Clinical
  clinicalState: z.object({
    symptoms: z.array(z.string()).optional(),
    painLevel: z.number().int().min(0).max(10).optional(),
    fatigueLevel: z.number().int().min(0).max(10).optional(),
    notes: z.string().optional(),
  }).optional().nullable(),
  vascularAccessState: z.string().max(500).optional().nullable(),

  // Post-dialysis
  compressionTime: z.number().int().min(0).max(60).optional().nullable(),
  ufAchieved: z.number().min(0).max(10000).optional().nullable(),
  ufPrescribed: z.number().min(0).max(10000).optional().nullable(),

  hasIncident: z.boolean().default(false),
});

export type CreateSessionRecordInput = z.infer<typeof createSessionRecordSchema>;

/**
 * Create incident schema
 */
export const createIncidentSchema = z.object({
  sessionId: z.string().uuid(),
  sessionRecordId: z.string().uuid().optional().nullable(),
  incidentTime: z.string().datetime().or(z.date()),
  type: incidentTypeEnum,
  severity: incidentSeverityEnum,
  description: z.string().max(1000).optional().nullable(),
  intervention: z.string().max(1000).optional().nullable(),
  outcome: z.string().max(500).optional().nullable(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

/**
 * Create session medication schema
 */
export const createSessionMedicationSchema = z.object({
  sessionId: z.string().uuid(),
  medicationName: z.string().min(1).max(200),
  dose: z.string().min(1).max(100),
  route: medicationRouteEnum,
  administeredAt: z.string().datetime().or(z.date()),
  lotId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateSessionMedicationInput = z.infer<typeof createSessionMedicationSchema>;

/**
 * Create session consumable schema
 */
export const createSessionConsumableSchema = z.object({
  sessionId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  lotId: z.string().uuid().optional().nullable(),
  quantity: z.number().min(0),
  unit: z.string().min(1).max(50),
});

export type CreateSessionConsumableInput = z.infer<typeof createSessionConsumableSchema>;

/**
 * Create session signature schema
 */
export const createSessionSignatureSchema = z.object({
  sessionId: z.string().uuid(),
  signatureType: signatureTypeEnum,
  signatureData: z.string().optional().nullable(),
});

export type CreateSessionSignatureInput = z.infer<typeof createSessionSignatureSchema>;

// ============================================================================
// LAB RESULTS VALIDATORS
// ============================================================================

/**
 * Create lab result schema
 */
export const createLabResultSchema = z.object({
  patientId: z.string().uuid(),
  labDate: z.string().datetime().or(z.date()),
  labSource: z.string().max(200).optional().nullable(),
  importMethod: labImportMethodEnum.default('manual'),

  // Key markers
  urea: z.number().min(0).optional().nullable(),
  ureaPre: z.number().min(0).optional().nullable(),
  ureaPost: z.number().min(0).optional().nullable(),
  creatinine: z.number().min(0).optional().nullable(),
  ktV: z.number().min(0).max(3).optional().nullable(),
  hemoglobin: z.number().min(0).max(25).optional().nullable(),
  hematocrit: z.number().min(0).max(100).optional().nullable(),
  pth: z.number().min(0).optional().nullable(),
  calcium: z.number().min(0).max(5).optional().nullable(),
  phosphorus: z.number().min(0).max(10).optional().nullable(),
  potassium: z.number().min(0).max(10).optional().nullable(),
  sodium: z.number().min(100).max(170).optional().nullable(),
  bicarbonate: z.number().min(0).max(50).optional().nullable(),
  albumin: z.number().min(0).max(100).optional().nullable(),
  ferritin: z.number().min(0).optional().nullable(),
  transferrinSaturation: z.number().min(0).max(100).optional().nullable(),
  crp: z.number().min(0).optional().nullable(),

  // Extended results
  allResults: z.record(z.number()).optional(),

  notes: z.string().max(2000).optional().nullable(),
});

export type CreateLabResultInput = z.infer<typeof createLabResultSchema>;

/**
 * Update lab result schema
 */
export const updateLabResultSchema = createLabResultSchema.partial().omit({ patientId: true });

export type UpdateLabResultInput = z.infer<typeof updateLabResultSchema>;

/**
 * Import lab results schema
 */
export const importLabResultsSchema = z.object({
  patientId: z.string().uuid(),
  labDate: z.string().datetime().or(z.date()),
  labSource: z.string().max(200).optional().nullable(),
  results: z.array(z.object({
    marker: z.string(),
    value: z.number(),
    unit: z.string().optional(),
  })),
});

export type ImportLabResultsInput = z.infer<typeof importLabResultsSchema>;

// ============================================================================
// CLINICAL ALERTS VALIDATORS
// ============================================================================

/**
 * Create clinical alert schema
 */
export const createClinicalAlertSchema = z.object({
  patientId: z.string().uuid(),
  alertType: alertTypeEnum,
  severity: alertSeverityEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  relatedToType: z.string().max(50).optional().nullable(),
  relatedToId: z.string().uuid().optional().nullable(),
});

export type CreateClinicalAlertInput = z.infer<typeof createClinicalAlertSchema>;

/**
 * Update clinical alert schema
 */
export const updateClinicalAlertSchema = z.object({
  status: alertStatusEnum.optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  resolutionNotes: z.string().max(1000).optional().nullable(),
});

export type UpdateClinicalAlertInput = z.infer<typeof updateClinicalAlertSchema>;

// ============================================================================
// QUERY VALIDATORS
// ============================================================================

/**
 * List patients query schema
 */
export const listPatientsQuerySchema = z.object({
  status: patientStatusEnum.optional(),
  requiresIsolation: z.coerce.boolean().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>;

/**
 * List sessions query schema
 */
export const listSessionsQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  machineId: z.string().uuid().optional(),
  slotId: z.string().uuid().optional(),
  status: sessionStatusEnum.optional(),
  dateFrom: z.string().datetime().or(z.date()).optional(),
  dateTo: z.string().datetime().or(z.date()).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

/**
 * Calendar view query schema
 */
export const calendarViewQuerySchema = z.object({
  date: z.string().datetime().or(z.date()),
  view: z.enum(['day', 'week']).default('day'),
});

export type CalendarViewQuery = z.infer<typeof calendarViewQuerySchema>;

/**
 * List alerts query schema
 */
export const listAlertsQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  alertType: alertTypeEnum.optional(),
  severity: alertSeverityEnum.optional(),
  status: alertStatusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListAlertsQuery = z.infer<typeof listAlertsQuerySchema>;

/**
 * Lab trends query schema
 */
export const labTrendsQuerySchema = z.object({
  patientId: z.string().uuid(),
  markers: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().or(z.date()).optional(),
  dateTo: z.string().datetime().or(z.date()).optional(),
});

export type LabTrendsQuery = z.infer<typeof labTrendsQuerySchema>;

/**
 * Report query schema
 */
export const reportQuerySchema = z.object({
  dateFrom: z.string().datetime().or(z.date()),
  dateTo: z.string().datetime().or(z.date()),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
