/**
 * Ophthalmology Module Schema
 * Specialized tables for eye care: OCT, Visual Fields, Biometry, IOL, IVT, Surgeries
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';
import { employees } from './hr';
import { healthcarePatients, healthcareConsultations, healthcareExaminations } from './healthcare';

// ============================================================================
// OCT SCANS
// ============================================================================

/**
 * Ophthalmology OCT Scans
 * Optical Coherence Tomography imaging
 */
export const ophthalmologyOctScans = sqliteTable('ophthalmology_oct_scans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  examinationId: text('examination_id').references(() => healthcareExaminations.id, { onDelete: 'set null' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  octNumber: text('oct_number').notNull(),
  scanDate: integer('scan_date', { mode: 'timestamp' }).notNull(),

  // Eye
  eye: text('eye', { enum: ['od', 'os', 'ou'] }).notNull(), // OD=Right, OS=Left, OU=Both

  // Scan type
  octType: text('oct_type', { enum: ['macula', 'optic_nerve', 'anterior_segment', 'angiography', 'wide_field'] }).notNull(),
  scanPattern: text('scan_pattern'), // e.g., "512x128", "200x200"

  // Device
  deviceManufacturer: text('device_manufacturer'),
  deviceModel: text('device_model'),

  // Signal quality
  signalStrength: integer('signal_strength'), // 0-10 or 0-100 depending on device

  // Macula measurements
  centralMacularThickness: real('central_macular_thickness'), // µm
  avgMacularThickness: real('avg_macular_thickness'), // µm
  maculaVolume: real('macula_volume'), // mm³
  etdrsMap: text('etdrs_map'), // JSON - 9 zones values

  // Retinal layers
  rnflThickness: real('rnfl_thickness'), // µm (if macular scan)
  gclIplThickness: real('gcl_ipl_thickness'), // µm
  rpeThickness: real('rpe_thickness'), // µm

  // Optic nerve measurements
  rnflAverage: real('rnfl_average'), // µm
  rnflSuperior: real('rnfl_superior'),
  rnflInferior: real('rnfl_inferior'),
  rnflNasal: real('rnfl_nasal'),
  rnflTemporal: real('rnfl_temporal'),
  rnflClockHours: text('rnfl_clock_hours'), // JSON array of 12 values
  cupDiscRatio: real('cup_disc_ratio'),
  rimArea: real('rim_area'), // mm²
  discArea: real('disc_area'), // mm²
  cupVolume: real('cup_volume'), // mm³

  // OCT Angiography
  superficialVesselDensity: real('superficial_vessel_density'), // %
  deepVesselDensity: real('deep_vessel_density'), // %
  fazArea: real('faz_area'), // mm² (Foveal Avascular Zone)
  fazPerimeter: real('faz_perimeter'), // mm
  flowArea: text('flow_area'), // JSON

  // All measurements (JSON for flexibility)
  allMeasurements: text('all_measurements'),

  // Findings
  findings: text('findings'),
  abnormalFindings: text('abnormal_findings'), // JSON array
  hasAbnormalFindings: integer('has_abnormal_findings', { mode: 'boolean' }).default(false),

  // Pathology detection
  epiretinalMembrane: integer('epiretinal_membrane', { mode: 'boolean' }),
  macularHole: integer('macular_hole', { mode: 'boolean' }),
  macularEdema: integer('macular_edema', { mode: 'boolean' }),
  subretinalFluid: integer('subretinal_fluid', { mode: 'boolean' }),
  pigmentEpitheliumDetachment: integer('pigment_epithelium_detachment', { mode: 'boolean' }),
  drusen: integer('drusen', { mode: 'boolean' }),
  geographicAtrophy: integer('geographic_atrophy', { mode: 'boolean' }),
  choroidalNeovascularization: integer('choroidal_neovascularization', { mode: 'boolean' }),

  // Interpretation
  interpretation: text('interpretation'),
  conclusion: text('conclusion'),
  recommendations: text('recommendations'),
  comparison: text('comparison'),

  // Progression analysis
  progressionStatus: text('progression_status', { enum: ['stable', 'improving', 'worsening', 'new_finding'] }),
  comparedToScanId: text('compared_to_scan_id'),

  // AI Analysis
  aiAnalysis: text('ai_analysis'),
  aiConfidence: real('ai_confidence'),
  aiDetectedPathologies: text('ai_detected_pathologies'), // JSON array

  // Media
  imageUrls: text('image_urls'), // JSON array
  reportUrl: text('report_url'),
  rawDataUrl: text('raw_data_url'),

  // Provider
  performedBy: text('performed_by').references(() => employees.id, { onDelete: 'set null' }),
  interpretedBy: text('interpreted_by').references(() => employees.id, { onDelete: 'set null' }),
  interpretedAt: integer('interpreted_at', { mode: 'timestamp' }),

  status: text('status', { enum: ['pending', 'interpreted', 'reviewed', 'verified'] }).default('pending'),
  urgency: text('urgency', { enum: ['routine', 'urgent', 'stat'] }).default('routine'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// VISUAL FIELDS
// ============================================================================

/**
 * Ophthalmology Visual Fields
 * Perimetry / Visual field testing
 */
export const ophthalmologyVisualFields = sqliteTable('ophthalmology_visual_fields', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  examinationId: text('examination_id').references(() => healthcareExaminations.id, { onDelete: 'set null' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  vfNumber: text('vf_number').notNull(),
  testDate: integer('test_date', { mode: 'timestamp' }).notNull(),

  // Eye
  eye: text('eye', { enum: ['od', 'os'] }).notNull(),

  // Test parameters
  testType: text('test_type', { enum: ['sita_standard', 'sita_fast', 'sita_faster', 'full_threshold', 'screening', 'kinetic'] }).notNull(),
  testPattern: text('test_pattern'), // e.g., "24-2", "30-2", "10-2"
  stimulus: text('stimulus'), // Size III, V, etc.
  background: integer('background'), // cd/m²

  // Device
  deviceManufacturer: text('device_manufacturer'),
  deviceModel: text('device_model'),

  // Reliability indices
  fixationLosses: real('fixation_losses'), // %
  falsePositives: real('false_positives'), // %
  falseNegatives: real('false_negatives'), // %
  testDuration: integer('test_duration'), // seconds
  isReliable: integer('is_reliable', { mode: 'boolean' }),

  // Global indices
  meanDeviation: real('mean_deviation'), // dB
  mdProbability: real('md_probability'), // %
  patternStandardDeviation: real('pattern_standard_deviation'), // dB (PSD)
  psdProbability: real('psd_probability'), // %
  visualFieldIndex: real('visual_field_index'), // % (VFI)
  ghtResult: text('ght_result', { enum: ['within_normal', 'borderline', 'outside_normal', 'generalized_reduction', 'abnormally_high'] }),

  // Sensitivity map
  sensitivityValues: text('sensitivity_values'), // JSON - threshold values at each point
  totalDeviationValues: text('total_deviation_values'), // JSON
  patternDeviationValues: text('pattern_deviation_values'), // JSON
  probabilityValues: text('probability_values'), // JSON

  // Defects
  defectType: text('defect_type'), // e.g., "arcuate", "nasal step", "central", "diffuse"
  defectLocation: text('defect_location'), // e.g., "superior", "inferior", "paracentral"
  defectSeverity: text('defect_severity', { enum: ['none', 'mild', 'moderate', 'severe'] }),

  // Glaucoma staging
  glaucomaStagingSystem: text('glaucoma_staging_system'), // e.g., "HPA", "GSS2"
  glaucomaStage: text('glaucoma_stage'),

  // Progression
  progressionStatus: text('progression_status', { enum: ['stable', 'possible_progression', 'likely_progression', 'improving'] }),
  progressionRate: real('progression_rate'), // dB/year
  comparedToVfId: text('compared_to_vf_id'),

  // All data (JSON for extensibility)
  allData: text('all_data'),

  // Findings
  findings: text('findings'),
  hasAbnormalFindings: integer('has_abnormal_findings', { mode: 'boolean' }).default(false),

  // Interpretation
  interpretation: text('interpretation'),
  conclusion: text('conclusion'),
  recommendations: text('recommendations'),
  comparison: text('comparison'),

  // AI Analysis
  aiAnalysis: text('ai_analysis'),
  aiConfidence: real('ai_confidence'),

  // Media
  imageUrls: text('image_urls'), // JSON array
  reportUrl: text('report_url'),

  // Provider
  performedBy: text('performed_by').references(() => employees.id, { onDelete: 'set null' }),
  interpretedBy: text('interpreted_by').references(() => employees.id, { onDelete: 'set null' }),
  interpretedAt: integer('interpreted_at', { mode: 'timestamp' }),

  status: text('status', { enum: ['pending', 'interpreted', 'reviewed', 'verified'] }).default('pending'),
  urgency: text('urgency', { enum: ['routine', 'urgent', 'stat'] }).default('routine'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// BIOMETRY
// ============================================================================

/**
 * Ophthalmology Biometry
 * Ocular biometry for IOL calculation
 */
export const ophthalmologyBiometry = sqliteTable('ophthalmology_biometry', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  biometryNumber: text('biometry_number').notNull(),
  measurementDate: integer('measurement_date', { mode: 'timestamp' }).notNull(),

  // Eye
  eye: text('eye', { enum: ['od', 'os'] }).notNull(),

  // Device
  deviceType: text('device_type', { enum: ['optical', 'ultrasound', 'swept_source'] }).notNull(),
  deviceManufacturer: text('device_manufacturer'),
  deviceModel: text('device_model'),

  // Axial length
  axialLength: real('axial_length').notNull(), // mm
  axialLengthSd: real('axial_length_sd'),
  axialLengthSnr: real('axial_length_snr'),

  // Keratometry
  k1: real('k1').notNull(), // D (flat meridian)
  k1Axis: integer('k1_axis'), // degrees
  k2: real('k2').notNull(), // D (steep meridian)
  k2Axis: integer('k2_axis'), // degrees
  avgK: real('avg_k'), // D
  deltaK: real('delta_k'), // D (astigmatism)
  keratometryType: text('keratometry_type', { enum: ['automated', 'manual', 'topography'] }),

  // Anterior chamber depth
  acd: real('acd'), // mm (internal ACD)
  acdExternal: real('acd_external'), // mm (external ACD)

  // Lens thickness
  lensThickness: real('lens_thickness'), // mm

  // White-to-white
  wtw: real('wtw'), // mm (horizontal white-to-white)

  // Pupil
  pupilDiameter: real('pupil_diameter'), // mm
  pupilDiameterPhotopic: real('pupil_diameter_photopic'),
  pupilDiameterMesopic: real('pupil_diameter_mesopic'),

  // Central corneal thickness
  cct: integer('cct'), // µm

  // Posterior corneal astigmatism
  posteriorK1: real('posterior_k1'),
  posteriorK1Axis: integer('posterior_k1_axis'),
  posteriorK2: real('posterior_k2'),
  posteriorK2Axis: integer('posterior_k2_axis'),

  // Total corneal power
  totalCorneaPower: real('total_cornea_power'),
  totalCorneaAstigmatism: real('total_cornea_astigmatism'),
  totalCorneaAstigmatismAxis: integer('total_cornea_astigmatism_axis'),

  // All measurements (JSON for additional data)
  allMeasurements: text('all_measurements'),

  // IOL calculations
  iolCalculations: text('iol_calculations'), // JSON array of formula results

  // Target refraction
  targetRefraction: real('target_refraction'), // D

  // Quality
  measurementQuality: text('measurement_quality', { enum: ['excellent', 'good', 'fair', 'poor'] }),
  qualityIssues: text('quality_issues'), // JSON array

  // Provider
  performedBy: text('performed_by').references(() => employees.id, { onDelete: 'set null' }),
  reviewedBy: text('reviewed_by').references(() => employees.id, { onDelete: 'set null' }),

  // Media
  reportUrl: text('report_url'),
  imageUrls: text('image_urls'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// IOL IMPLANTS
// ============================================================================

/**
 * Ophthalmology IOL Implants
 * Intraocular lens implants
 */
export const ophthalmologyIolImplants = sqliteTable('ophthalmology_iol_implants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  surgeryId: text('surgery_id').references(() => ophthalmologySurgeries.id, { onDelete: 'set null' }),
  biometryId: text('biometry_id').references(() => ophthalmologyBiometry.id, { onDelete: 'set null' }),

  iolNumber: text('iol_number').notNull(),
  implantDate: integer('implant_date', { mode: 'timestamp' }).notNull(),

  // Eye
  eye: text('eye', { enum: ['od', 'os'] }).notNull(),

  // IOL details
  manufacturer: text('manufacturer').notNull(),
  model: text('model').notNull(),
  iolType: text('iol_type', { enum: ['monofocal', 'toric', 'multifocal', 'edof', 'toric_multifocal', 'toric_edof', 'accommodating', 'phakic'] }).notNull(),
  material: text('material'), // e.g., "hydrophobic acrylic", "hydrophilic acrylic"
  serialNumber: text('serial_number'),
  lotNumber: text('lot_number'),

  // Power
  sphericalPower: real('spherical_power').notNull(), // D
  cylinderPower: real('cylinder_power'), // D (for toric)
  cylinderAxis: integer('cylinder_axis'), // degrees (for toric)
  addPower: real('add_power'), // D (for multifocal)

  // Physical characteristics
  opticDiameter: real('optic_diameter'), // mm
  overallDiameter: real('overall_diameter'), // mm
  hapticDesign: text('haptic_design'),
  aCOnstant: real('a_constant'),
  sfConstant: real('sf_constant'),
  pAcdConstant: real('p_acd_constant'),

  // Calculation
  formulaUsed: text('formula_used'), // e.g., "SRK/T", "Barrett Universal II", "Hill-RBF"
  targetRefraction: real('target_refraction'), // D
  predictedRefraction: real('predicted_refraction'), // D

  // Position (for toric)
  intendedAxis: integer('intended_axis'), // degrees
  actualAxis: integer('actual_axis'), // degrees
  rotationFromIntended: integer('rotation_from_intended'), // degrees

  // Outcome
  postopRefraction: text('postop_refraction'), // JSON - sphere, cylinder, axis at different timepoints
  finalSphere: real('final_sphere'),
  finalCylinder: real('final_cylinder'),
  finalAxis: integer('final_axis'),
  refractionPredictionError: real('refraction_prediction_error'),

  // Visual acuity outcome
  finalBcvaDistance: text('final_bcva_distance'), // e.g., "20/20"
  finalBcvaNear: text('final_bcva_near'),
  finalUcvaDistance: text('final_ucva_distance'),
  finalUcvaNear: text('final_ucva_near'),

  // Complications
  hasComplications: integer('has_complications', { mode: 'boolean' }).default(false),
  complications: text('complications'), // JSON array
  pcoOccurred: integer('pco_occurred', { mode: 'boolean' }), // Posterior capsule opacification
  pcoTreatmentDate: integer('pco_treatment_date', { mode: 'timestamp' }),

  // Status
  status: text('status', { enum: ['implanted', 'explanted', 'exchanged', 'repositioned'] }).default('implanted'),
  statusDate: integer('status_date', { mode: 'timestamp' }),
  statusReason: text('status_reason'),

  // Surgeon
  surgeon: text('surgeon').references(() => employees.id, { onDelete: 'set null' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// IVT INJECTIONS
// ============================================================================

/**
 * Ophthalmology IVT Injections
 * Intravitreal injections
 */
export const ophthalmologyIvtInjections = sqliteTable('ophthalmology_ivt_injections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  ivtNumber: text('ivt_number').notNull(),
  injectionDate: integer('injection_date', { mode: 'timestamp' }).notNull(),

  // Eye
  eye: text('eye', { enum: ['od', 'os'] }).notNull(),

  // Indication
  indication: text('indication', {
    enum: ['wet_amd', 'dme', 'rvo_me', 'cnv', 'pdr', 'uveitis', 'endophthalmitis', 'other']
  }).notNull(),
  indicationDetails: text('indication_details'),

  // Medication
  medication: text('medication', {
    enum: ['aflibercept', 'ranibizumab', 'bevacizumab', 'brolucizumab', 'faricimab',
           'dexamethasone_implant', 'fluocinolone_implant', 'triamcinolone', 'vancomycin', 'ceftazidime', 'other']
  }).notNull(),
  medicationBrand: text('medication_brand'),
  dose: text('dose').notNull(),
  lotNumber: text('lot_number'),
  expirationDate: integer('expiration_date', { mode: 'timestamp' }),

  // Treatment protocol
  treatmentProtocol: text('treatment_protocol', { enum: ['loading', 'prn', 'treat_and_extend', 'fixed', 'observe_and_extend'] }),
  injectionInSeries: integer('injection_in_series'), // e.g., 3rd injection
  nextPlannedInterval: integer('next_planned_interval'), // weeks

  // Pre-injection
  preIopOd: integer('pre_iop_od'), // mmHg
  preIopOs: integer('pre_iop_os'),
  preVaOd: text('pre_va_od'), // e.g., "20/40"
  preVaOs: text('pre_va_os'),
  preCmt: integer('pre_cmt'), // Central macular thickness µm

  // Injection details
  quadrant: text('quadrant', { enum: ['inferotemporal', 'inferonasal', 'superotemporal', 'superonasal'] }),
  distanceFromLimbus: real('distance_from_limbus'), // mm
  needleGauge: integer('needle_gauge'), // 30G, 32G, etc.
  anesthesia: text('anesthesia', { enum: ['topical', 'subconjunctival', 'retrobulbar', 'peribulbar'] }),
  antiseptic: text('antiseptic'), // e.g., "povidone-iodine 5%"

  // Post-injection
  postIop: integer('post_iop'), // mmHg
  iopCheckTime: integer('iop_check_time'), // minutes after injection
  lightPerception: integer('light_perception', { mode: 'boolean' }),
  countFingers: integer('count_fingers', { mode: 'boolean' }),

  // Complications
  hasComplications: integer('has_complications', { mode: 'boolean' }).default(false),
  complications: text('complications'), // JSON array

  // Outcome at follow-up
  followUpDate: integer('follow_up_date', { mode: 'timestamp' }),
  postVa: text('post_va'),
  postCmt: integer('post_cmt'),
  anatomicResponse: text('anatomic_response', { enum: ['complete', 'partial', 'none', 'worsened'] }),
  functionalResponse: text('functional_response', { enum: ['improved', 'stable', 'worsened'] }),

  // Performer
  performedBy: text('performed_by').references(() => employees.id, { onDelete: 'set null' }),
  assistedBy: text('assisted_by').references(() => employees.id, { onDelete: 'set null' }),

  // Location
  location: text('location'), // e.g., "OR 1", "Minor procedure room"

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// SURGERIES
// ============================================================================

/**
 * Ophthalmology Surgeries
 * Ophthalmic surgical procedures
 */
export const ophthalmologySurgeries = sqliteTable('ophthalmology_surgeries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  surgeryNumber: text('surgery_number').notNull(),
  surgeryDate: integer('surgery_date', { mode: 'timestamp' }).notNull(),

  // Eye
  eye: text('eye', { enum: ['od', 'os', 'ou'] }).notNull(),

  // Surgery type
  surgeryType: text('surgery_type', {
    enum: ['phaco', 'ecce', 'icce', 'iol_exchange', 'vitrectomy', 'retinal_detachment',
           'glaucoma_trab', 'glaucoma_tube', 'migs', 'corneal_transplant', 'pterygium',
           'strabismus', 'oculoplastics', 'laser_refractive', 'prk', 'lasik', 'smile', 'other']
  }).notNull(),
  surgerySubtype: text('surgery_subtype'),
  indication: text('indication'),
  diagnosis: text('diagnosis'), // JSON array of ICD codes

  // Surgical team
  surgeon: text('surgeon').references(() => employees.id, { onDelete: 'set null' }),
  assistantSurgeon: text('assistant_surgeon').references(() => employees.id, { onDelete: 'set null' }),
  anesthesiologist: text('anesthesiologist').references(() => employees.id, { onDelete: 'set null' }),
  scrubNurse: text('scrub_nurse').references(() => employees.id, { onDelete: 'set null' }),

  // Anesthesia
  anesthesiaType: text('anesthesia_type', { enum: ['topical', 'local', 'peribulbar', 'retrobulbar', 'general'] }),
  anesthesiaDrugs: text('anesthesia_drugs'), // JSON array

  // Timing
  scheduledStartTime: integer('scheduled_start_time', { mode: 'timestamp' }),
  actualStartTime: integer('actual_start_time', { mode: 'timestamp' }),
  actualEndTime: integer('actual_end_time', { mode: 'timestamp' }),
  durationMinutes: integer('duration_minutes'),

  // Pre-operative
  preOpVa: text('pre_op_va'),
  preOpIop: integer('pre_op_iop'),
  preOpExam: text('pre_op_exam'),
  preOpMedications: text('pre_op_medications'), // JSON array

  // Procedure details
  procedureDetails: text('procedure_details'),
  techniquesUsed: text('techniques_used'), // JSON array
  implantedDevices: text('implanted_devices'), // JSON array
  consumablesUsed: text('consumables_used'), // JSON array

  // Intraoperative findings
  intraOpFindings: text('intra_op_findings'),
  intraOpComplications: text('intra_op_complications'), // JSON array
  hasComplications: integer('has_complications', { mode: 'boolean' }).default(false),

  // Outcome
  surgeryOutcome: text('surgery_outcome', { enum: ['successful', 'complicated', 'converted', 'aborted'] }),
  immediateVa: text('immediate_va'),
  immediateIop: integer('immediate_iop'),

  // Post-operative
  postOpMedications: text('post_op_medications'), // JSON array
  postOpInstructions: text('post_op_instructions'),
  firstFollowUpDate: integer('first_follow_up_date', { mode: 'timestamp' }),

  // Follow-up outcomes
  finalVa: text('final_va'),
  finalIop: integer('final_iop'),
  finalOutcome: text('final_outcome', { enum: ['excellent', 'good', 'fair', 'poor'] }),
  lateComplications: text('late_complications'), // JSON array

  // Billing
  billingCodes: text('billing_codes'), // JSON array

  // Documentation
  operativeReportUrl: text('operative_report_url'),
  videoUrls: text('video_urls'), // JSON array
  imageUrls: text('image_urls'), // JSON array
  consentFormUrl: text('consent_form_url'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// REFRACTION
// ============================================================================

/**
 * Ophthalmology Refraction
 * Refraction and visual acuity records
 */
export const ophthalmologyRefraction = sqliteTable('ophthalmology_refraction', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  refractionNumber: text('refraction_number').notNull(),
  examinationDate: integer('examination_date', { mode: 'timestamp' }).notNull(),

  // Right eye (OD)
  odSphere: real('od_sphere'),
  odCylinder: real('od_cylinder'),
  odAxis: integer('od_axis'),
  odAdd: real('od_add'),
  odPrism: real('od_prism'),
  odPrismBase: text('od_prism_base'),
  odPd: real('od_pd'), // Pupillary distance

  // Left eye (OS)
  osSphere: real('os_sphere'),
  osCylinder: real('os_cylinder'),
  osAxis: integer('os_axis'),
  osAdd: real('os_add'),
  osPrism: real('os_prism'),
  osPrismBase: text('os_prism_base'),
  osPd: real('os_pd'),

  // Binocular PD
  nearPd: real('near_pd'),
  distancePd: real('distance_pd'),

  // Refraction type
  refractionType: text('refraction_type', { enum: ['manifest', 'cycloplegic', 'autorefractor', 'retinoscopy', 'trial_frame'] }).notNull(),
  cycloplegicAgent: text('cycloplegic_agent'),

  // Visual acuity - Uncorrected
  odUcvaDistance: text('od_ucva_distance'), // e.g., "20/200"
  odUcvaNear: text('od_ucva_near'),
  osUcvaDistance: text('os_ucva_distance'),
  osUcvaNear: text('os_ucva_near'),
  ouUcvaDistance: text('ou_ucva_distance'),
  ouUcvaNear: text('ou_ucva_near'),

  // Visual acuity - Best corrected
  odBcvaDistance: text('od_bcva_distance'),
  odBcvaNear: text('od_bcva_near'),
  osBcvaDistance: text('os_bcva_distance'),
  osBcvaNear: text('os_bcva_near'),
  ouBcvaDistance: text('ou_bcva_distance'),
  ouBcvaNear: text('ou_bcva_near'),

  // Visual acuity - Pinhole
  odPinhole: text('od_pinhole'),
  osPinhole: text('os_pinhole'),

  // Previous prescription
  previousRx: text('previous_rx'), // JSON
  rxChange: text('rx_change'), // JSON - difference from previous

  // Notes
  dominantEye: text('dominant_eye', { enum: ['od', 'os'] }),
  accommodativeAmplitude: real('accommodative_amplitude'), // D

  performedBy: text('performed_by').references(() => employees.id, { onDelete: 'set null' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// TONOMETRY
// ============================================================================

/**
 * Ophthalmology Tonometry
 * Intraocular pressure measurements
 */
export const ophthalmologyTonometry = sqliteTable('ophthalmology_tonometry', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  measurementNumber: text('measurement_number').notNull(),
  measurementDate: integer('measurement_date', { mode: 'timestamp' }).notNull(),
  measurementTime: text('measurement_time'), // Time of day for diurnal curve

  // Method
  tonometryMethod: text('tonometry_method', { enum: ['goldmann', 'non_contact', 'icare', 'tono_pen', 'palpation'] }).notNull(),
  deviceModel: text('device_model'),

  // Measurements
  iopOd: integer('iop_od'), // mmHg
  iopOs: integer('iop_os'), // mmHg

  // Correction factors
  cctOd: integer('cct_od'), // Central corneal thickness µm
  cctOs: integer('cct_os'),
  iopOdCorrected: integer('iop_od_corrected'), // CCT-corrected IOP
  iopOsCorrected: integer('iop_os_corrected'),

  // Context
  isOnGlaucomaMedications: integer('is_on_glaucoma_medications', { mode: 'boolean' }),
  currentMedications: text('current_medications'), // JSON array
  isDiurnalCurve: integer('is_diurnal_curve', { mode: 'boolean' }).default(false),
  diurnalCurveId: text('diurnal_curve_id'),

  // Target IOP (for glaucoma patients)
  targetIopOd: integer('target_iop_od'),
  targetIopOs: integer('target_iop_os'),
  isAtTarget: integer('is_at_target', { mode: 'boolean' }),

  performedBy: text('performed_by').references(() => employees.id, { onDelete: 'set null' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// FUNDUS PHOTOS
// ============================================================================

/**
 * Ophthalmology Fundus Photos
 * Retinal photography
 */
export const ophthalmologyFundusPhotos = sqliteTable('ophthalmology_fundus_photos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  photoNumber: text('photo_number').notNull(),
  captureDate: integer('capture_date', { mode: 'timestamp' }).notNull(),

  // Eye
  eye: text('eye', { enum: ['od', 'os'] }).notNull(),

  // Photo type
  photoType: text('photo_type', { enum: ['color', 'red_free', 'autofluorescence', 'icg', 'fluorescein', 'wide_field', 'montage'] }).notNull(),
  fieldOfView: text('field_of_view'), // e.g., "50°", "200° UWF"

  // Device
  deviceManufacturer: text('device_manufacturer'),
  deviceModel: text('device_model'),

  // Dilation
  dilated: integer('dilated', { mode: 'boolean' }).default(true),
  dilatingAgent: text('dilating_agent'),

  // Image quality
  imageQuality: text('image_quality', { enum: ['excellent', 'good', 'fair', 'poor'] }),
  qualityIssues: text('quality_issues'), // JSON array

  // Findings
  findings: text('findings'),
  abnormalFindings: text('abnormal_findings'), // JSON array
  hasAbnormalFindings: integer('has_abnormal_findings', { mode: 'boolean' }).default(false),

  // Specific findings checklist
  opticDiscAppearance: text('optic_disc_appearance'),
  cupDiscRatio: real('cup_disc_ratio'),
  maculaAppearance: text('macula_appearance'),
  vesselAppearance: text('vessel_appearance'),
  peripheryAppearance: text('periphery_appearance'),

  // Pathology flags
  hemorrhages: integer('hemorrhages', { mode: 'boolean' }),
  exudates: integer('exudates', { mode: 'boolean' }),
  cottonWoolSpots: integer('cotton_wool_spots', { mode: 'boolean' }),
  neovascularization: integer('neovascularization', { mode: 'boolean' }),
  drusen: integer('drusen', { mode: 'boolean' }),
  pigmentChanges: integer('pigment_changes', { mode: 'boolean' }),
  retinalDetachment: integer('retinal_detachment', { mode: 'boolean' }),

  // AI Analysis
  aiAnalysis: text('ai_analysis'),
  aiDetectedPathologies: text('ai_detected_pathologies'), // JSON array
  aiConfidence: real('ai_confidence'),

  // Media
  imageUrl: text('image_url').notNull(), // R2 URL
  thumbnailUrl: text('thumbnail_url'),
  annotatedImageUrl: text('annotated_image_url'),

  // Provider
  performedBy: text('performed_by').references(() => employees.id, { onDelete: 'set null' }),
  gradedBy: text('graded_by').references(() => employees.id, { onDelete: 'set null' }),
  gradedAt: integer('graded_at', { mode: 'timestamp' }),

  status: text('status', { enum: ['pending', 'graded', 'reviewed'] }).default('pending'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// OSDI SCORES
// ============================================================================

/**
 * Ophthalmology OSDI Scores
 * Ocular Surface Disease Index questionnaire
 */
export const ophthalmologyOsdiScores = sqliteTable('ophthalmology_osdi_scores', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  assessmentDate: integer('assessment_date', { mode: 'timestamp' }).notNull(),

  // OSDI questions (0-4 scale each)
  // Section A: Symptoms
  q1LightSensitivity: integer('q1_light_sensitivity'),
  q2GrittyFeeling: integer('q2_gritty_feeling'),
  q3PainfulEyes: integer('q3_painful_eyes'),
  q4BlurredVision: integer('q4_blurred_vision'),
  q5PoorVision: integer('q5_poor_vision'),

  // Section B: Vision-related function
  q6Reading: integer('q6_reading'),
  q7Driving: integer('q7_driving'),
  q8Computer: integer('q8_computer'),
  q9Television: integer('q9_television'),

  // Section C: Environmental triggers
  q10WindyConditions: integer('q10_windy_conditions'),
  q11LowHumidity: integer('q11_low_humidity'),
  q12AirConditioning: integer('q12_air_conditioning'),

  // Calculated scores
  totalScore: real('total_score').notNull(), // 0-100
  symptomSubscore: real('symptom_subscore'),
  visionSubscore: real('vision_subscore'),
  triggerSubscore: real('trigger_subscore'),

  // Classification
  severity: text('severity', { enum: ['normal', 'mild', 'moderate', 'severe'] }).notNull(),

  // Comparison
  previousScoreId: text('previous_score_id'),
  scoreChange: real('score_change'),

  // Raw responses
  rawResponses: text('raw_responses'), // JSON with N/A handling

  administeredBy: text('administered_by').references(() => users.id, { onDelete: 'set null' }),

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type OphthalmologyOctScan = typeof ophthalmologyOctScans.$inferSelect;
export type InsertOphthalmologyOctScan = typeof ophthalmologyOctScans.$inferInsert;

export type OphthalmologyVisualField = typeof ophthalmologyVisualFields.$inferSelect;
export type InsertOphthalmologyVisualField = typeof ophthalmologyVisualFields.$inferInsert;

export type OphthalmologyBiometry = typeof ophthalmologyBiometry.$inferSelect;
export type InsertOphthalmologyBiometry = typeof ophthalmologyBiometry.$inferInsert;

export type OphthalmologyIolImplant = typeof ophthalmologyIolImplants.$inferSelect;
export type InsertOphthalmologyIolImplant = typeof ophthalmologyIolImplants.$inferInsert;

export type OphthalmologyIvtInjection = typeof ophthalmologyIvtInjections.$inferSelect;
export type InsertOphthalmologyIvtInjection = typeof ophthalmologyIvtInjections.$inferInsert;

export type OphthalmologySurgery = typeof ophthalmologySurgeries.$inferSelect;
export type InsertOphthalmologySurgery = typeof ophthalmologySurgeries.$inferInsert;

export type OphthalmologyRefraction = typeof ophthalmologyRefraction.$inferSelect;
export type InsertOphthalmologyRefraction = typeof ophthalmologyRefraction.$inferInsert;

export type OphthalmologyTonometry = typeof ophthalmologyTonometry.$inferSelect;
export type InsertOphthalmologyTonometry = typeof ophthalmologyTonometry.$inferInsert;

export type OphthalmologyFundusPhoto = typeof ophthalmologyFundusPhotos.$inferSelect;
export type InsertOphthalmologyFundusPhoto = typeof ophthalmologyFundusPhotos.$inferInsert;

export type OphthalmologyOsdiScore = typeof ophthalmologyOsdiScores.$inferSelect;
export type InsertOphthalmologyOsdiScore = typeof ophthalmologyOsdiScores.$inferInsert;
