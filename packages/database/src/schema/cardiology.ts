/**
 * Cardiology Module Schema
 * Specialized tables for cardiac care: ECG, Echo, Holter, Pacemakers, Stents, Risk Scores
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';
import { employees } from './hr';
import { healthcarePatients, healthcareConsultations, healthcareExaminations } from './healthcare';

// ============================================================================
// ECG RECORDS
// ============================================================================

/**
 * Cardiology ECG Records
 * Electrocardiogram recordings and interpretations
 */
export const cardiologyEcgRecords = sqliteTable('cardiology_ecg_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  examinationId: text('examination_id').references(() => healthcareExaminations.id, { onDelete: 'set null' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  ecgNumber: text('ecg_number').notNull(),
  recordingDate: integer('recording_date', { mode: 'timestamp' }).notNull(),

  // ECG Type
  ecgType: text('ecg_type', { enum: ['standard_12_lead', 'rhythm_strip', 'stress_test', 'signal_averaged'] }).notNull(),

  // Recording parameters
  paperSpeed: integer('paper_speed'), // mm/s (25 or 50)
  gain: real('gain'), // mm/mV (10 or 20)
  filterSettings: text('filter_settings'),

  // Measurements
  heartRate: integer('heart_rate'), // bpm
  prInterval: integer('pr_interval'), // ms
  qrsDuration: integer('qrs_duration'), // ms
  qtInterval: integer('qt_interval'), // ms
  qtcInterval: integer('qtc_interval'), // ms (corrected)
  axis: integer('axis'), // degrees

  // Rhythm
  rhythm: text('rhythm', { enum: ['sinus', 'afib', 'aflutter', 'svt', 'vt', 'paced', 'other'] }),
  rhythmRegularity: text('rhythm_regularity', { enum: ['regular', 'irregular', 'regularly_irregular', 'irregularly_irregular'] }),

  // Findings (JSON arrays)
  pWaveFindings: text('p_wave_findings'),
  qrsFindings: text('qrs_findings'),
  stSegmentFindings: text('st_segment_findings'),
  tWaveFindings: text('t_wave_findings'),

  // Abnormalities
  hasAbnormalities: integer('has_abnormalities', { mode: 'boolean' }).default(false),
  abnormalities: text('abnormalities'), // JSON array

  // Interpretation
  interpretation: text('interpretation'),
  clinicalCorrelation: text('clinical_correlation'),
  comparison: text('comparison'), // Comparison with previous ECGs

  // AI Analysis
  aiAnalysis: text('ai_analysis'), // JSON - AI-generated findings
  aiConfidence: real('ai_confidence'), // 0-1

  // Media
  ecgImageUrl: text('ecg_image_url'), // R2 URL
  ecgPdfUrl: text('ecg_pdf_url'),
  rawDataUrl: text('raw_data_url'), // For digital ECG data

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
// ECHOCARDIOGRAMS
// ============================================================================

/**
 * Cardiology Echocardiograms
 * Cardiac ultrasound examinations
 */
export const cardiologyEchocardiograms = sqliteTable('cardiology_echocardiograms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  examinationId: text('examination_id').references(() => healthcareExaminations.id, { onDelete: 'set null' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  echoNumber: text('echo_number').notNull(),
  studyDate: integer('study_date', { mode: 'timestamp' }).notNull(),

  // Echo Type
  echoType: text('echo_type', { enum: ['tte', 'tee', 'stress', 'contrast', 'strain'] }).notNull(),
  indication: text('indication'),

  // Left Ventricle
  lvEf: real('lv_ef'), // Ejection fraction %
  lvEfMethod: text('lv_ef_method', { enum: ['visual', 'biplane', 'simpson', '3d'] }),
  lvedd: real('lvedd'), // End-diastolic diameter mm
  lvesd: real('lvesd'), // End-systolic diameter mm
  lvMass: real('lv_mass'), // g
  lvMassIndex: real('lv_mass_index'), // g/m²
  lvWallMotion: text('lv_wall_motion'), // JSON - wall motion abnormalities
  gls: real('gls'), // Global longitudinal strain %

  // Left Atrium
  laVolume: real('la_volume'), // mL
  laVolumeIndex: real('la_volume_index'), // mL/m²
  laDimension: real('la_dimension'), // mm

  // Right Ventricle
  rvFunction: text('rv_function', { enum: ['normal', 'mildly_reduced', 'moderately_reduced', 'severely_reduced'] }),
  tapse: real('tapse'), // mm
  rvsp: real('rvsp'), // mmHg (RV systolic pressure)
  rvBasalDiameter: real('rv_basal_diameter'), // mm

  // Right Atrium
  raArea: real('ra_area'), // cm²
  raPressure: real('ra_pressure'), // mmHg (estimated)

  // Valves - Mitral
  mitralRegurgitation: text('mitral_regurgitation', { enum: ['none', 'trivial', 'mild', 'moderate', 'severe'] }),
  mitralStenosis: text('mitral_stenosis', { enum: ['none', 'mild', 'moderate', 'severe'] }),
  mitralArea: real('mitral_area'), // cm²
  mitralMeanGradient: real('mitral_mean_gradient'), // mmHg
  mitralEVelocity: real('mitral_e_velocity'), // m/s
  mitralAVelocity: real('mitral_a_velocity'), // m/s
  mitralEARatio: real('mitral_ea_ratio'),
  ePrime: real('e_prime'), // cm/s (tissue Doppler)
  eOverEPrime: real('e_over_e_prime'), // E/e' ratio

  // Valves - Aortic
  aorticRegurgitation: text('aortic_regurgitation', { enum: ['none', 'trivial', 'mild', 'moderate', 'severe'] }),
  aorticStenosis: text('aortic_stenosis', { enum: ['none', 'mild', 'moderate', 'severe'] }),
  aorticValveArea: real('aortic_valve_area'), // cm²
  aorticMeanGradient: real('aortic_mean_gradient'), // mmHg
  aorticPeakGradient: real('aortic_peak_gradient'), // mmHg
  aorticPeakVelocity: real('aortic_peak_velocity'), // m/s

  // Valves - Tricuspid
  tricuspidRegurgitation: text('tricuspid_regurgitation', { enum: ['none', 'trivial', 'mild', 'moderate', 'severe'] }),
  tricuspidRegurgitationVelocity: real('tricuspid_regurgitation_velocity'), // m/s

  // Valves - Pulmonic
  pulmonicRegurgitation: text('pulmonic_regurgitation', { enum: ['none', 'trivial', 'mild', 'moderate', 'severe'] }),

  // Aorta
  aorticRootDiameter: real('aortic_root_diameter'), // mm
  ascendingAortaDiameter: real('ascending_aorta_diameter'), // mm
  aorticArchDiameter: real('aortic_arch_diameter'), // mm

  // Pericardium
  pericardialEffusion: text('pericardial_effusion', { enum: ['none', 'trivial', 'small', 'moderate', 'large'] }),
  pericardialEffusionLocation: text('pericardial_effusion_location'),

  // Diastolic Function
  diastolicFunction: text('diastolic_function', { enum: ['normal', 'grade_1', 'grade_2', 'grade_3', 'indeterminate'] }),

  // IVC
  ivcDiameter: real('ivc_diameter'), // mm
  ivcCollapsibility: real('ivc_collapsibility'), // %

  // All measurements (JSON for extensibility)
  allMeasurements: text('all_measurements'),

  // Findings
  findings: text('findings'),
  abnormalFindings: text('abnormal_findings'), // JSON array
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
  videoUrls: text('video_urls'), // JSON array
  reportUrl: text('report_url'),

  // Provider
  sonographer: text('sonographer').references(() => employees.id, { onDelete: 'set null' }),
  interpretedBy: text('interpreted_by').references(() => employees.id, { onDelete: 'set null' }),
  interpretedAt: integer('interpreted_at', { mode: 'timestamp' }),

  status: text('status', { enum: ['pending', 'preliminary', 'final', 'amended'] }).default('pending'),
  urgency: text('urgency', { enum: ['routine', 'urgent', 'stat'] }).default('routine'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// HOLTER RECORDS
// ============================================================================

/**
 * Cardiology Holter Records
 * Ambulatory ECG monitoring (24h, 48h, 7-day)
 */
export const cardiologyHolterRecords = sqliteTable('cardiology_holter_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  examinationId: text('examination_id').references(() => healthcareExaminations.id, { onDelete: 'set null' }),

  holterNumber: text('holter_number').notNull(),
  indication: text('indication'),

  // Recording period
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  durationHours: real('duration_hours'),
  analyzedDurationHours: real('analyzed_duration_hours'),

  // Monitor type
  monitorType: text('monitor_type', { enum: ['standard', 'extended', 'event_recorder', 'loop_recorder'] }),
  deviceModel: text('device_model'),

  // Heart rate
  minHeartRate: integer('min_heart_rate'),
  maxHeartRate: integer('max_heart_rate'),
  avgHeartRate: integer('avg_heart_rate'),
  minHeartRateTime: integer('min_heart_rate_time', { mode: 'timestamp' }),
  maxHeartRateTime: integer('max_heart_rate_time', { mode: 'timestamp' }),

  // Heart rate variability
  sdnn: real('sdnn'), // ms
  rmssd: real('rmssd'), // ms

  // Arrhythmia counts
  totalQrsComplexes: integer('total_qrs_complexes'),

  // Supraventricular
  svePrematureBeats: integer('sve_premature_beats'),
  svePercent: real('sve_percent'),
  svtEpisodes: integer('svt_episodes'),
  longestSvtDuration: integer('longest_svt_duration'), // seconds
  afibEpisodes: integer('afib_episodes'),
  afibBurden: real('afib_burden'), // %
  aflutterEpisodes: integer('aflutter_episodes'),

  // Ventricular
  pvePrematureBeats: integer('pve_premature_beats'),
  pvePercent: real('pve_percent'),
  couplets: integer('couplets'),
  triplets: integer('triplets'),
  vtEpisodes: integer('vt_episodes'),
  longestVtDuration: integer('longest_vt_duration'), // seconds
  longestVtRate: integer('longest_vt_rate'), // bpm

  // Pauses
  pausesOver2s: integer('pauses_over_2s'),
  pausesOver3s: integer('pauses_over_3s'),
  longestPause: real('longest_pause'), // seconds
  longestPauseTime: integer('longest_pause_time', { mode: 'timestamp' }),

  // Conduction
  avBlock1: integer('av_block_1', { mode: 'boolean' }),
  avBlock2Type1: integer('av_block_2_type1', { mode: 'boolean' }),
  avBlock2Type2: integer('av_block_2_type2', { mode: 'boolean' }),
  avBlock3: integer('av_block_3', { mode: 'boolean' }),

  // ST segment
  stDepressionEpisodes: integer('st_depression_episodes'),
  stElevationEpisodes: integer('st_elevation_episodes'),
  stAnalysisDetails: text('st_analysis_details'), // JSON

  // Patient diary
  patientDiary: text('patient_diary'), // JSON - symptoms with timestamps

  // Findings
  significantFindings: text('significant_findings'), // JSON array
  hasSignificantFindings: integer('has_significant_findings', { mode: 'boolean' }).default(false),

  // Interpretation
  interpretation: text('interpretation'),
  conclusion: text('conclusion'),
  recommendations: text('recommendations'),
  comparison: text('comparison'),

  // AI Analysis
  aiAnalysis: text('ai_analysis'),
  aiConfidence: real('ai_confidence'),

  // Media
  reportUrl: text('report_url'),
  rawDataUrl: text('raw_data_url'),
  selectedStripsUrls: text('selected_strips_urls'), // JSON array

  // Provider
  analyzedBy: text('analyzed_by').references(() => employees.id, { onDelete: 'set null' }),
  interpretedBy: text('interpreted_by').references(() => employees.id, { onDelete: 'set null' }),
  interpretedAt: integer('interpreted_at', { mode: 'timestamp' }),

  status: text('status', { enum: ['recording', 'analyzing', 'pending_interpretation', 'final'] }).default('recording'),
  urgency: text('urgency', { enum: ['routine', 'urgent', 'stat'] }).default('routine'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// PACEMAKERS / ICDs
// ============================================================================

/**
 * Cardiology Pacemakers
 * Pacemakers, ICDs, and CRT devices
 */
export const cardiologyPacemakers = sqliteTable('cardiology_pacemakers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  deviceNumber: text('device_number').notNull(),

  // Device type
  deviceType: text('device_type', { enum: ['single_chamber_pacemaker', 'dual_chamber_pacemaker', 'crt_p', 'single_chamber_icd', 'dual_chamber_icd', 'crt_d', 'leadless'] }).notNull(),
  indication: text('indication').notNull(),

  // Device info
  manufacturer: text('manufacturer').notNull(),
  model: text('model').notNull(),
  serialNumber: text('serial_number').notNull(),

  // Implantation
  implantDate: integer('implant_date', { mode: 'timestamp' }).notNull(),
  implantedBy: text('implanted_by').references(() => employees.id, { onDelete: 'set null' }),
  implantCenter: text('implant_center'),
  implantProcedure: text('implant_procedure'),

  // Leads
  leads: text('leads'), // JSON array of lead details

  // Programming
  mode: text('mode'), // e.g., DDD, VVI, etc.
  lowerRate: integer('lower_rate'), // bpm
  upperRate: integer('upper_rate'), // bpm
  avDelay: integer('av_delay'), // ms
  outputSettings: text('output_settings'), // JSON

  // ICD-specific
  vtZone: text('vt_zone'), // JSON - VT zone settings
  vfZone: text('vf_zone'), // JSON - VF zone settings
  therapySettings: text('therapy_settings'), // JSON - ATP, shock settings

  // CRT-specific
  lvLead: text('lv_lead'), // JSON - LV lead details
  lvPacingVector: text('lv_pacing_vector'),

  // Battery
  batteryStatus: text('battery_status', { enum: ['ok', 'elective_replacement', 'end_of_life'] }).default('ok'),
  batteryVoltage: real('battery_voltage'), // V
  batteryImpedance: integer('battery_impedance'), // Ohms
  estimatedLongevity: text('estimated_longevity'),

  // Lead measurements (latest)
  raPacing: text('ra_pacing'), // JSON - threshold, impedance, sensing
  rvPacing: text('rv_pacing'), // JSON
  lvPacing: text('lv_pacing'), // JSON

  // Events since last check
  pacingPercentage: text('pacing_percentage'), // JSON - RA, RV, LV percentages
  episodesSinceLastCheck: text('episodes_since_last_check'), // JSON - AT/AF, VT, VF counts
  therapiesDelivered: text('therapies_delivered'), // JSON - ATP, shocks

  // Status
  status: text('status', { enum: ['active', 'replaced', 'explanted', 'end_of_life'] }).default('active'),
  statusDate: integer('status_date', { mode: 'timestamp' }),
  statusReason: text('status_reason'),

  // Replacement
  replacedById: text('replaced_by_id'),
  replacementDate: integer('replacement_date', { mode: 'timestamp' }),
  replacementReason: text('replacement_reason'),

  // Follow-up
  lastInterrogationDate: integer('last_interrogation_date', { mode: 'timestamp' }),
  nextInterrogationDate: integer('next_interrogation_date', { mode: 'timestamp' }),
  remoteMonitoringEnabled: integer('remote_monitoring_enabled', { mode: 'boolean' }).default(false),
  remoteMonitoringPlatform: text('remote_monitoring_platform'),

  // MRI compatibility
  mriConditional: integer('mri_conditional', { mode: 'boolean' }).default(false),
  mriConditions: text('mri_conditions'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Cardiology Pacemaker Interrogations
 * Device check/interrogation records
 */
export const cardiologyPacemakerInterrogations = sqliteTable('cardiology_pacemaker_interrogations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  pacemakerId: text('pacemaker_id').notNull().references(() => cardiologyPacemakers.id, { onDelete: 'cascade' }),

  interrogationNumber: text('interrogation_number').notNull(),
  interrogationDate: integer('interrogation_date', { mode: 'timestamp' }).notNull(),
  interrogationType: text('interrogation_type', { enum: ['in_person', 'remote', 'emergency'] }).notNull(),

  // Battery
  batteryVoltage: real('battery_voltage'),
  batteryImpedance: integer('battery_impedance'),
  batteryStatus: text('battery_status', { enum: ['ok', 'elective_replacement', 'end_of_life'] }),

  // Lead measurements
  raThreshold: real('ra_threshold'),
  raImpedance: integer('ra_impedance'),
  raSensing: real('ra_sensing'),
  rvThreshold: real('rv_threshold'),
  rvImpedance: integer('rv_impedance'),
  rvSensing: real('rv_sensing'),
  lvThreshold: real('lv_threshold'),
  lvImpedance: integer('lv_impedance'),
  lvSensing: real('lv_sensing'),

  // Pacing percentages
  atPacingPercent: real('at_pacing_percent'),
  vpPacingPercent: real('vp_pacing_percent'),
  bvPacingPercent: real('bv_pacing_percent'),

  // Episodes
  atAfEpisodes: integer('at_af_episodes'),
  atAfBurden: real('at_af_burden'),
  vtEpisodes: integer('vt_episodes'),
  vfEpisodes: integer('vf_episodes'),
  atpDelivered: integer('atp_delivered'),
  shocksDelivered: integer('shocks_delivered'),

  // Events log (JSON)
  significantEvents: text('significant_events'),

  // Programming changes
  programmingChanges: text('programming_changes'), // JSON - before/after
  programmingChangesReason: text('programming_changes_reason'),

  // Findings
  findings: text('findings'),
  hasAlerts: integer('has_alerts', { mode: 'boolean' }).default(false),
  alerts: text('alerts'), // JSON array

  // Provider
  performedBy: text('performed_by').references(() => employees.id, { onDelete: 'set null' }),
  reviewedBy: text('reviewed_by').references(() => employees.id, { onDelete: 'set null' }),

  // Media
  reportUrl: text('report_url'),
  printoutUrls: text('printout_urls'), // JSON array

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// STENTS
// ============================================================================

/**
 * Cardiology Stents
 * Coronary stents and PCI procedures
 */
export const cardiologyStents = sqliteTable('cardiology_stents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  stentNumber: text('stent_number').notNull(),

  // Procedure info
  procedureDate: integer('procedure_date', { mode: 'timestamp' }).notNull(),
  procedureType: text('procedure_type', { enum: ['primary_pci', 'elective_pci', 'rescue_pci', 'staged_pci'] }).notNull(),
  indication: text('indication').notNull(),
  clinicalPresentation: text('clinical_presentation', { enum: ['stemi', 'nstemi', 'unstable_angina', 'stable_angina', 'silent_ischemia'] }),

  // Lesion details
  vesselName: text('vessel_name').notNull(), // LAD, LCx, RCA, LM, etc.
  vesselSegment: text('vessel_segment'),
  lesionType: text('lesion_type', { enum: ['a', 'b1', 'b2', 'c'] }),
  prestenosisPct: integer('prestenosis_pct'),
  lesionLength: real('lesion_length'), // mm
  referenceVesselDiameter: real('reference_vessel_diameter'), // mm
  isBifurcation: integer('is_bifurcation', { mode: 'boolean' }).default(false),
  isCto: integer('is_cto', { mode: 'boolean' }).default(false),

  // Stent details
  stentType: text('stent_type', { enum: ['des', 'bms', 'bioresorbable', 'drug_coated_balloon'] }).notNull(),
  stentManufacturer: text('stent_manufacturer'),
  stentModel: text('stent_model'),
  stentDiameter: real('stent_diameter'), // mm
  stentLength: real('stent_length'), // mm
  deploymentPressure: integer('deployment_pressure'), // atm
  postDilationPressure: integer('post_dilation_pressure'), // atm

  // Multiple stents
  numberOfStents: integer('number_of_stents').default(1),
  additionalStents: text('additional_stents'), // JSON array for multiple stents

  // Result
  poststenosisPct: integer('poststenosis_pct'),
  timiFlow: integer('timi_flow'), // 0-3
  procedureSuccess: integer('procedure_success', { mode: 'boolean' }).default(true),
  complications: text('complications'), // JSON array

  // Operator
  operator: text('operator').references(() => employees.id, { onDelete: 'set null' }),
  cathLab: text('cath_lab'),

  // Access
  accessSite: text('access_site', { enum: ['radial', 'femoral', 'brachial'] }),
  accessSide: text('access_side', { enum: ['left', 'right'] }),

  // Imaging
  ifrFfrPerformed: integer('ifr_ffr_performed', { mode: 'boolean' }).default(false),
  ifrFfrValue: real('ifr_ffr_value'),
  ivusPerformed: integer('ivus_performed', { mode: 'boolean' }).default(false),
  octPerformed: integer('oct_performed', { mode: 'boolean' }).default(false),

  // Medications post-PCI
  antiplateletRegimen: text('antiplatelet_regimen'), // JSON
  daptDuration: integer('dapt_duration'), // months recommended

  // Follow-up
  followUpAngiogramDate: integer('follow_up_angiogram_date', { mode: 'timestamp' }),
  inStentRestenosis: integer('in_stent_restenosis', { mode: 'boolean' }),
  stentThrombosis: integer('stent_thrombosis', { mode: 'boolean' }),

  // Media
  angiogramUrls: text('angiogram_urls'), // JSON array
  reportUrl: text('report_url'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// RISK SCORES
// ============================================================================

/**
 * Cardiology Risk Scores
 * Cardiovascular risk assessments (SCORE2, CHA2DS2-VASc, HAS-BLED, etc.)
 */
export const cardiologyRiskScores = sqliteTable('cardiology_risk_scores', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  scoreType: text('score_type', {
    enum: ['score2', 'score2_op', 'cha2ds2_vasc', 'has_bled', 'heart', 'timi', 'grace', 'crusade', 'framingham', 'euroscore2', 'syntax']
  }).notNull(),
  calculationDate: integer('calculation_date', { mode: 'timestamp' }).notNull(),

  // Input parameters (JSON - varies by score type)
  inputParameters: text('input_parameters').notNull(),

  // Score result
  scoreValue: real('score_value').notNull(),
  riskCategory: text('risk_category', { enum: ['very_low', 'low', 'moderate', 'high', 'very_high'] }),
  riskPercentage: real('risk_percentage'), // For scores that give % risk

  // Interpretation
  interpretation: text('interpretation'),
  recommendations: text('recommendations'),

  // Comparison
  previousScoreId: text('previous_score_id'),
  scoreChange: real('score_change'),

  // AI recommendation
  aiRecommendation: text('ai_recommendation'),

  calculatedBy: text('calculated_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedBy: text('reviewed_by').references(() => employees.id, { onDelete: 'set null' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// CARDIAC EVENTS
// ============================================================================

/**
 * Cardiology Cardiac Events
 * Major adverse cardiac events (MACE) and other cardiac events
 */
export const cardiologyCardiacEvents = sqliteTable('cardiology_cardiac_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  eventNumber: text('event_number').notNull(),
  eventDate: integer('event_date', { mode: 'timestamp' }).notNull(),

  eventType: text('event_type', {
    enum: ['mi', 'stemi', 'nstemi', 'unstable_angina', 'heart_failure', 'stroke', 'tia', 'cardiac_arrest',
           'arrhythmia', 'syncope', 'bleeding', 'stent_thrombosis', 'restenosis', 'hospitalization', 'other']
  }).notNull(),

  severity: text('severity', { enum: ['mild', 'moderate', 'severe', 'fatal'] }).notNull(),

  // Clinical details
  symptoms: text('symptoms'), // JSON array
  vitalSigns: text('vital_signs'), // JSON
  troponinPeak: real('troponin_peak'),
  otherBiomarkers: text('other_biomarkers'), // JSON

  // Management
  management: text('management'),
  interventions: text('interventions'), // JSON array
  hospitalized: integer('hospitalized', { mode: 'boolean' }).default(false),
  hospitalAdmissionDate: integer('hospital_admission_date', { mode: 'timestamp' }),
  hospitalDischargeDate: integer('hospital_discharge_date', { mode: 'timestamp' }),
  icuStay: integer('icu_stay', { mode: 'boolean' }).default(false),

  // Outcome
  outcome: text('outcome', { enum: ['recovered', 'ongoing', 'chronic_sequelae', 'fatal'] }),
  sequelae: text('sequelae'), // JSON array

  // Related entities
  relatedStentId: text('related_stent_id').references(() => cardiologyStents.id, { onDelete: 'set null' }),
  relatedPacemakerId: text('related_pacemaker_id').references(() => cardiologyPacemakers.id, { onDelete: 'set null' }),

  // Documentation
  documentUrls: text('document_urls'), // JSON array

  reportedBy: text('reported_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedBy: text('verified_by').references(() => employees.id, { onDelete: 'set null' }),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// MEDICATIONS
// ============================================================================

/**
 * Cardiology Medications
 * Cardiovascular medications and prescriptions
 */
export const cardiologyMedications = sqliteTable('cardiology_medications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),

  // Medication details
  medicationName: text('medication_name').notNull(),
  genericName: text('generic_name'),
  medicationClass: text('medication_class', {
    enum: ['antiplatelet', 'anticoagulant', 'statin', 'beta_blocker', 'ace_inhibitor', 'arb', 'arni',
           'calcium_channel_blocker', 'diuretic', 'mra', 'antiarrhythmic', 'nitrate', 'sglt2i', 'other']
  }),

  // Dosing
  dose: text('dose').notNull(),
  doseUnit: text('dose_unit'),
  frequency: text('frequency').notNull(),
  route: text('route', { enum: ['oral', 'iv', 'sc', 'im', 'topical', 'sublingual'] }).default('oral'),

  // Duration
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }),
  isOngoing: integer('is_ongoing', { mode: 'boolean' }).default(true),

  // Indication
  indication: text('indication'),
  targetParameter: text('target_parameter'), // e.g., "BP < 130/80", "HR < 70"

  // Prescriber
  prescribedBy: text('prescribed_by').references(() => employees.id, { onDelete: 'set null' }),

  // Status
  status: text('status', { enum: ['active', 'discontinued', 'on_hold', 'completed'] }).default('active'),
  discontinuationReason: text('discontinuation_reason'),
  discontinuedAt: integer('discontinued_at', { mode: 'timestamp' }),
  discontinuedBy: text('discontinued_by').references(() => users.id, { onDelete: 'set null' }),

  // Monitoring
  requiresMonitoring: integer('requires_monitoring', { mode: 'boolean' }).default(false),
  monitoringParameters: text('monitoring_parameters'), // JSON

  // Side effects
  sideEffects: text('side_effects'), // JSON array of reported side effects

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CardiologyEcgRecord = typeof cardiologyEcgRecords.$inferSelect;
export type InsertCardiologyEcgRecord = typeof cardiologyEcgRecords.$inferInsert;

export type CardiologyEchocardiogram = typeof cardiologyEchocardiograms.$inferSelect;
export type InsertCardiologyEchocardiogram = typeof cardiologyEchocardiograms.$inferInsert;

export type CardiologyHolterRecord = typeof cardiologyHolterRecords.$inferSelect;
export type InsertCardiologyHolterRecord = typeof cardiologyHolterRecords.$inferInsert;

export type CardiologyPacemaker = typeof cardiologyPacemakers.$inferSelect;
export type InsertCardiologyPacemaker = typeof cardiologyPacemakers.$inferInsert;

export type CardiologyPacemakerInterrogation = typeof cardiologyPacemakerInterrogations.$inferSelect;
export type InsertCardiologyPacemakerInterrogation = typeof cardiologyPacemakerInterrogations.$inferInsert;

export type CardiologyStent = typeof cardiologyStents.$inferSelect;
export type InsertCardiologyStent = typeof cardiologyStents.$inferInsert;

export type CardiologyRiskScore = typeof cardiologyRiskScores.$inferSelect;
export type InsertCardiologyRiskScore = typeof cardiologyRiskScores.$inferInsert;

export type CardiologyCardiacEvent = typeof cardiologyCardiacEvents.$inferSelect;
export type InsertCardiologyCardiacEvent = typeof cardiologyCardiacEvents.$inferInsert;

export type CardiologyMedication = typeof cardiologyMedications.$inferSelect;
export type InsertCardiologyMedication = typeof cardiologyMedications.$inferInsert;
