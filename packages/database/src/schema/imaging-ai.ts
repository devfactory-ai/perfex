/**
 * AI-Powered Diagnostic Imaging Module Schema
 * Automated analysis of ECG, OCT, Fundus, and Echocardiography images
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';
import { healthcarePatients } from './healthcare';
import { employees } from './hr';

// ============================================================================
// IMAGING ANALYSIS - CORE
// ============================================================================

/**
 * Imaging Analysis
 * Core table for all medical image analyses
 */
export const imagingAnalysis = sqliteTable('imaging_analysis', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  // Examination reference (links to cardiology/ophthalmology exams)
  examinationId: text('examination_id'),
  examinationType: text('examination_type'), // 'cardiology_ecg', 'ophthalmology_oct', etc.

  // Image type
  imageType: text('image_type', {
    enum: ['ecg', 'oct', 'fundus', 'echocardiogram', 'visual_field', 'angiography', 'xray', 'ct', 'mri', 'other']
  }).notNull(),
  imageSubtype: text('image_subtype'), // More specific: '12_lead', 'macular_cube', 'parasternal_long', etc.

  // Image storage
  imageUrl: text('image_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  originalFileName: text('original_file_name'),
  fileFormat: text('file_format'), // DICOM, JPEG, PNG, PDF
  fileSizeBytes: integer('file_size_bytes'),

  // Acquisition details
  acquisitionDate: integer('acquisition_date', { mode: 'timestamp' }).notNull(),
  equipment: text('equipment'), // Device/machine used
  manufacturer: text('manufacturer'),
  protocolUsed: text('protocol_used'),
  technicianId: text('technician_id').references(() => employees.id),

  // Module association
  sourceModule: text('source_module', {
    enum: ['cardiology', 'ophthalmology', 'dialyse', 'general']
  }),

  // AI Analysis status
  aiModel: text('ai_model'), // 'llama-3.1-8b', 'custom-ecg-v2', etc.
  aiModelVersion: text('ai_model_version'),
  analysisStatus: text('analysis_status', {
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
  }).default('pending'),
  analysisStartedAt: integer('analysis_started_at', { mode: 'timestamp' }),
  analysisCompletedAt: integer('analysis_completed_at', { mode: 'timestamp' }),
  analysisError: text('analysis_error'),

  // AI Findings (general)
  aiFindings: text('ai_findings'), // JSON - structured findings
  aiMeasurements: text('ai_measurements'), // JSON - automated measurements
  aiDiagnosis: text('ai_diagnosis'), // JSON - suggested diagnoses
  aiConfidence: real('ai_confidence'), // 0-1 overall confidence
  aiAnnotations: text('ai_annotations'), // JSON - image annotations/markings
  aiSummary: text('ai_summary'), // Text summary for clinicians

  // Clinical flags
  hasAbnormality: integer('has_abnormality', { mode: 'boolean' }).default(false),
  abnormalityCount: integer('abnormality_count').default(0),
  criticalFinding: integer('critical_finding', { mode: 'boolean' }).default(false),
  requiresUrgentReview: integer('requires_urgent_review', { mode: 'boolean' }).default(false),
  urgencyLevel: text('urgency_level', { enum: ['routine', 'priority', 'urgent', 'stat'] }).default('routine'),

  // Physician review
  reviewStatus: text('review_status', {
    enum: ['pending', 'in_review', 'reviewed', 'signed', 'amended']
  }).default('pending'),
  reviewedBy: text('reviewed_by').references(() => employees.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewerAgreement: text('reviewer_agreement', {
    enum: ['agree', 'partially_agree', 'disagree', 'needs_clarification']
  }),
  physicianFindings: text('physician_findings'),
  physicianDiagnosis: text('physician_diagnosis'),
  physicianNotes: text('physician_notes'),

  // Comparison
  comparedToId: text('compared_to_id'), // Previous analysis ID
  progressionStatus: text('progression_status', {
    enum: ['improved', 'stable', 'worsened', 'new_finding', 'not_applicable']
  }),
  progressionNotes: text('progression_notes'),

  // Digital signature
  signedBy: text('signed_by').references(() => employees.id),
  signedAt: integer('signed_at', { mode: 'timestamp' }),
  digitalSignature: text('digital_signature'),

  // Report
  reportGenerated: integer('report_generated', { mode: 'boolean' }).default(false),
  reportUrl: text('report_url'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// ECG ANALYSIS
// ============================================================================

/**
 * ECG Analysis
 * Detailed ECG interpretation with rhythm analysis, intervals, and abnormalities
 */
export const ecgAnalysis = sqliteTable('imaging_ecg_analysis', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  imagingAnalysisId: text('imaging_analysis_id').notNull().references(() => imagingAnalysis.id, { onDelete: 'cascade' }),

  // ECG Type
  ecgType: text('ecg_type', {
    enum: ['12_lead', '6_lead', '3_lead', 'single_lead', 'holter', 'event_monitor', 'stress_test']
  }).default('12_lead'),
  durationSeconds: integer('duration_seconds'),

  // Basic Measurements
  heartRate: integer('heart_rate'), // bpm
  heartRateVariability: real('heart_rate_variability'), // ms
  rrInterval: real('rr_interval'), // ms

  // Rhythm Analysis
  rhythm: text('rhythm', {
    enum: ['normal_sinus', 'sinus_bradycardia', 'sinus_tachycardia', 'atrial_fibrillation',
           'atrial_flutter', 'svt', 'ventricular_tachycardia', 'ventricular_fibrillation',
           'paced', 'junctional', 'idioventricular', 'asystole', 'other']
  }),
  rhythmRegularity: text('rhythm_regularity', { enum: ['regular', 'regularly_irregular', 'irregularly_irregular'] }),
  rhythmConfidence: real('rhythm_confidence'), // 0-1

  // Intervals (ms)
  prInterval: real('pr_interval'),
  prIntervalStatus: text('pr_interval_status', { enum: ['normal', 'short', 'prolonged'] }),
  qrsDuration: real('qrs_duration'),
  qrsDurationStatus: text('qrs_duration_status', { enum: ['normal', 'prolonged'] }),
  qtInterval: real('qt_interval'),
  qtcInterval: real('qtc_interval'), // Corrected QT
  qtcFormula: text('qtc_formula', { enum: ['bazett', 'fridericia', 'framingham'] }).default('bazett'),
  qtcStatus: text('qtc_status', { enum: ['normal', 'borderline', 'prolonged', 'short'] }),

  // Axis (degrees)
  pAxis: integer('p_axis'),
  qrsAxis: integer('qrs_axis'),
  qrsAxisDeviation: text('qrs_axis_deviation', { enum: ['normal', 'left', 'right', 'extreme'] }),
  tAxis: integer('t_axis'),

  // Wave Analysis
  pWaveAbnormalities: text('p_wave_abnormalities'), // JSON - ['bifid', 'peaked', 'absent', etc.]
  qrsAbnormalities: text('qrs_abnormalities'), // JSON - ['pathological_q', 'poor_r_progression', etc.]
  stChanges: text('st_changes'), // JSON - [{lead: 'V1', type: 'elevation', mm: 2}, ...]
  stElevationPresent: integer('st_elevation_present', { mode: 'boolean' }).default(false),
  stDepressionPresent: integer('st_depression_present', { mode: 'boolean' }).default(false),
  tWaveChanges: text('t_wave_changes'), // JSON - ['inverted', 'peaked', 'flattened', ...]
  uWavePresent: integer('u_wave_present', { mode: 'boolean' }).default(false),

  // Conduction Abnormalities
  conductionAbnormalities: text('conduction_abnormalities'), // JSON
  avBlock: text('av_block', { enum: ['none', 'first_degree', 'second_degree_type1', 'second_degree_type2', 'third_degree'] }),
  bundleBranchBlock: text('bundle_branch_block', { enum: ['none', 'rbbb', 'lbbb', 'bifascicular', 'trifascicular'] }),
  fascicularBlock: text('fascicular_block', { enum: ['none', 'lafb', 'lpfb'] }),

  // Arrhythmias
  arrhythmias: text('arrhythmias'), // JSON - detected arrhythmias with counts
  pvcsCount: integer('pvcs_count'),
  pacsCount: integer('pacs_count'),
  pausesDetected: integer('pauses_detected', { mode: 'boolean' }).default(false),
  longestPauseMs: integer('longest_pause_ms'),

  // Ischemia/Infarction
  ischemiaPresent: integer('ischemia_present', { mode: 'boolean' }).default(false),
  ischemiaTerritory: text('ischemia_territory'), // JSON - affected territories
  infarctionPattern: text('infarction_pattern', { enum: ['none', 'stemi', 'nstemi', 'old_mi', 'posterior'] }),
  infarctionLocation: text('infarction_location'), // anterior, inferior, lateral, etc.

  // Hypertrophy
  lvhPresent: integer('lvh_present', { mode: 'boolean' }).default(false),
  lvhCriteria: text('lvh_criteria'), // Sokolow-Lyon, Cornell, etc.
  rvhPresent: integer('rvh_present', { mode: 'boolean' }).default(false),

  // AI Interpretation
  aiInterpretation: text('ai_interpretation'), // Structured text interpretation
  differentialDiagnoses: text('differential_diagnoses'), // JSON - ranked list
  clinicalCorrelation: text('clinical_correlation'), // Suggested clinical context
  urgencyScore: integer('urgency_score'), // 1-10 scale

  // Comparison with previous
  comparedToEcgId: text('compared_to_ecg_id'),
  changesFromPrevious: text('changes_from_previous'), // JSON - notable changes

  // Per-lead data
  leadData: text('lead_data'), // JSON - detailed per-lead measurements

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// OCT ANALYSIS
// ============================================================================

/**
 * OCT Analysis
 * Optical Coherence Tomography analysis for ophthalmology
 */
export const octAnalysis = sqliteTable('imaging_oct_analysis', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  imagingAnalysisId: text('imaging_analysis_id').notNull().references(() => imagingAnalysis.id, { onDelete: 'cascade' }),

  // Eye and scan type
  eye: text('eye', { enum: ['od', 'os'] }).notNull(), // Right (OD) or Left (OS)
  scanType: text('scan_type', {
    enum: ['macular_cube', 'optic_disc_cube', 'line_scan', 'radial', 'raster', 'angio_oct', 'wide_field']
  }).notNull(),
  scanPattern: text('scan_pattern'), // 512x128, 200x200, etc.
  signalStrength: integer('signal_strength'), // 1-10 quality score

  // Macular Measurements (in microns)
  centralMacularThickness: integer('central_macular_thickness'), // Central subfield
  avgMacularThickness: integer('avg_macular_thickness'),
  macularVolume: real('macular_volume'), // mm3

  // ETDRS Grid Measurements
  centralSubfield: integer('central_subfield'),
  innerSuperior: integer('inner_superior'),
  innerInferior: integer('inner_inferior'),
  innerNasal: integer('inner_nasal'),
  innerTemporal: integer('inner_temporal'),
  outerSuperior: integer('outer_superior'),
  outerInferior: integer('outer_inferior'),
  outerNasal: integer('outer_nasal'),
  outerTemporal: integer('outer_temporal'),

  // RNFL Measurements (for glaucoma)
  avgRnflThickness: integer('avg_rnfl_thickness'),
  rnflSymmetry: integer('rnfl_symmetry'), // % inter-eye symmetry
  rnflQuadrants: text('rnfl_quadrants'), // JSON - {superior, inferior, nasal, temporal}
  rnflClockHours: text('rnfl_clock_hours'), // JSON - 12 clock hour values
  rnflStatus: text('rnfl_status', { enum: ['normal', 'borderline', 'abnormal'] }),

  // Ganglion Cell Analysis
  gcl_iplThickness: integer('gcl_ipl_thickness'),
  gcl_iplMinimum: integer('gcl_ipl_minimum'),
  gcl_iplStatus: text('gcl_ipl_status', { enum: ['normal', 'borderline', 'abnormal'] }),

  // Optic Disc Measurements
  cupDiscRatio: real('cup_disc_ratio'),
  cupDiscRatioVertical: real('cup_disc_ratio_vertical'),
  cupVolume: real('cup_volume'),
  rimArea: real('rim_area'),
  discArea: real('disc_area'),

  // Pathology Detection
  // Drusen
  drusenPresent: integer('drusen_present', { mode: 'boolean' }).default(false),
  drusenType: text('drusen_type'), // JSON - [small, medium, large, soft, hard]
  drusenVolume: real('drusen_volume'),
  drusenArea: real('drusen_area'),

  // Fluid
  fluidPresent: integer('fluid_present', { mode: 'boolean' }).default(false),
  fluidType: text('fluid_type', { enum: ['none', 'irf', 'srf', 'ped', 'mixed'] }), // Intraretinal, Subretinal, PED
  fluidVolume: real('fluid_volume'),
  fluidLocations: text('fluid_locations'), // JSON - grid locations

  // Macular conditions
  epiretinalMembrane: integer('epiretinal_membrane', { mode: 'boolean' }).default(false),
  epiretinalMembraneSeverity: text('erm_severity', { enum: ['mild', 'moderate', 'severe'] }),
  vitreomacularTraction: integer('vitreomacular_traction', { mode: 'boolean' }).default(false),
  vmtStatus: text('vmt_status', { enum: ['none', 'focal', 'broad'] }),
  macularHole: integer('macular_hole', { mode: 'boolean' }).default(false),
  macularHoleStage: text('macular_hole_stage', { enum: ['1a', '1b', '2', '3', '4'] }),
  macularHoleSize: integer('macular_hole_size'), // microns

  // Atrophy
  atrophyPresent: integer('atrophy_present', { mode: 'boolean' }).default(false),
  geographicAtrophyArea: real('geographic_atrophy_area'), // mm2
  rpeAtrophyArea: real('rpe_atrophy_area'),

  // CNV (Choroidal Neovascularization)
  cnvPresent: integer('cnv_present', { mode: 'boolean' }).default(false),
  cnvType: text('cnv_type', { enum: ['type1', 'type2', 'type3', 'mixed'] }),
  cnvActivity: text('cnv_activity', { enum: ['active', 'inactive', 'scar'] }),

  // Layer Segmentation
  segmentationLayers: text('segmentation_layers'), // JSON - layer boundaries
  segmentationQuality: text('segmentation_quality', { enum: ['good', 'fair', 'poor', 'failed'] }),
  layerAbnormalities: text('layer_abnormalities'), // JSON - specific layer issues

  // Abnormal regions
  abnormalRegions: text('abnormal_regions'), // JSON - marked regions with coordinates

  // Disease staging
  amdStage: text('amd_stage', { enum: ['none', 'early', 'intermediate', 'late_dry', 'late_wet'] }),
  diabeticRetinopathySeverity: text('dr_severity', { enum: ['none', 'mild_npdr', 'moderate_npdr', 'severe_npdr', 'pdr'] }),
  dmePresent: integer('dme_present', { mode: 'boolean' }).default(false),
  dmeType: text('dme_type', { enum: ['focal', 'diffuse', 'cme', 'mixed'] }),

  // Glaucoma assessment
  glaucomaRisk: text('glaucoma_risk', { enum: ['low', 'moderate', 'high'] }),
  glaucomaIndicators: text('glaucoma_indicators'), // JSON - specific findings

  // Comparison
  comparedToOctId: text('compared_to_oct_id'),
  changeFromPrevious: text('change_from_previous'), // JSON - quantified changes
  progressionAnalysis: text('progression_analysis'),

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// FUNDUS ANALYSIS
// ============================================================================

/**
 * Fundus Analysis
 * Retinal fundus photography analysis
 */
export const fundusAnalysis = sqliteTable('imaging_fundus_analysis', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  imagingAnalysisId: text('imaging_analysis_id').notNull().references(() => imagingAnalysis.id, { onDelete: 'cascade' }),

  // Image details
  eye: text('eye', { enum: ['od', 'os'] }).notNull(),
  imageField: text('image_field', {
    enum: ['central', 'temporal', 'nasal', 'superior', 'inferior', 'wide_field', 'ultra_wide', 'montage']
  }).default('central'),
  fieldAngle: integer('field_angle'), // 30, 45, 60, 200 degrees
  dilation: integer('dilation', { mode: 'boolean' }).default(true),
  imageQuality: text('image_quality', { enum: ['excellent', 'good', 'fair', 'poor', 'ungradable'] }),

  // Optic Disc
  opticDiscAppearance: text('optic_disc_appearance', { enum: ['normal', 'abnormal', 'not_visible'] }),
  opticDiscEdges: text('optic_disc_edges', { enum: ['well_defined', 'blurred', 'elevated'] }),
  cupDiscRatioEstimate: real('cup_disc_ratio_estimate'),
  pallor: integer('pallor', { mode: 'boolean' }).default(false),
  neovascularization_disc: integer('neovascularization_disc', { mode: 'boolean' }).default(false),
  discHemorrhage: integer('disc_hemorrhage', { mode: 'boolean' }).default(false),

  // Macula
  maculaAppearance: text('macula_appearance', { enum: ['normal', 'abnormal', 'not_visible'] }),
  fovealReflex: text('foveal_reflex', { enum: ['present', 'diminished', 'absent'] }),
  maculaEdema: integer('macula_edema', { mode: 'boolean' }).default(false),
  maculaExudates: integer('macula_exudates', { mode: 'boolean' }).default(false),
  maculaHemorrhage: integer('macula_hemorrhage', { mode: 'boolean' }).default(false),
  maculaDrusen: integer('macula_drusen', { mode: 'boolean' }).default(false),
  maculaPigmentChanges: integer('macula_pigment_changes', { mode: 'boolean' }).default(false),

  // Vessels
  arteriovenousRatio: real('arteriovenous_ratio'),
  arteriolarNarrowing: integer('arteriolar_narrowing', { mode: 'boolean' }).default(false),
  venousTortuosity: integer('venous_tortuosity', { mode: 'boolean' }).default(false),
  neovascularizationElsewhere: integer('neovascularization_elsewhere', { mode: 'boolean' }).default(false),
  venousBeading: integer('venous_beading', { mode: 'boolean' }).default(false),
  irma: integer('irma', { mode: 'boolean' }).default(false), // Intraretinal microvascular abnormalities

  // Hemorrhages
  hemorrhagesPresent: integer('hemorrhages_present', { mode: 'boolean' }).default(false),
  hemorrhageTypes: text('hemorrhage_types'), // JSON - [dot, blot, flame, preretinal, vitreous]
  hemorrhageQuadrants: text('hemorrhage_quadrants'), // JSON - affected quadrants
  hemorrhageCount: text('hemorrhage_count', { enum: ['none', 'few', 'moderate', 'numerous'] }),

  // Exudates
  hardExudates: integer('hard_exudates', { mode: 'boolean' }).default(false),
  hardExudatesLocation: text('hard_exudates_location'), // JSON
  cottonWoolSpots: integer('cotton_wool_spots', { mode: 'boolean' }).default(false),
  cottonWoolSpotsCount: integer('cotton_wool_spots_count'),

  // Drusen
  drusenPresent: integer('drusen_present', { mode: 'boolean' }).default(false),
  drusenClassification: text('drusen_classification'), // JSON - type, size, distribution

  // Other findings
  pigmentaryChanges: text('pigmentary_changes'), // JSON
  atrophy: text('atrophy'), // JSON
  scars: text('scars'), // JSON - laser scars, chorioretinal scars
  retinalDetachment: integer('retinal_detachment', { mode: 'boolean' }).default(false),

  // Disease Grading
  drGrade: text('dr_grade', {
    enum: ['no_dr', 'mild_npdr', 'moderate_npdr', 'severe_npdr', 'pdr', 'ungradable']
  }),
  drGradeConfidence: real('dr_grade_confidence'),
  amdGrade: text('amd_grade', {
    enum: ['no_amd', 'early_amd', 'intermediate_amd', 'advanced_amd_dry', 'advanced_amd_wet']
  }),
  amdGradeConfidence: real('amd_grade_confidence'),

  // Referral recommendation
  referralRecommended: integer('referral_recommended', { mode: 'boolean' }).default(false),
  referralUrgency: text('referral_urgency', { enum: ['routine', 'soon', 'urgent', 'emergent'] }),
  referralReason: text('referral_reason'),

  // Lesion annotations
  lesionAnnotations: text('lesion_annotations'), // JSON - detected lesions with coordinates

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// ECHOCARDIOGRAM ANALYSIS
// ============================================================================

/**
 * Echocardiogram Analysis
 * Cardiac ultrasound analysis with chamber measurements and valve assessments
 */
export const echoAnalysis = sqliteTable('imaging_echo_analysis', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  imagingAnalysisId: text('imaging_analysis_id').notNull().references(() => imagingAnalysis.id, { onDelete: 'cascade' }),

  // Study type
  studyType: text('study_type', {
    enum: ['tte', 'tee', 'stress_echo', 'contrast_echo', 'bubble_study', '3d_echo']
  }).default('tte'),
  studyQuality: text('study_quality', { enum: ['excellent', 'good', 'fair', 'poor', 'non_diagnostic'] }),
  studyLimitations: text('study_limitations'), // JSON - technical limitations

  // LV Systolic Function
  lvef: real('lvef'), // Ejection fraction %
  lvefMethod: text('lvef_method', { enum: ['visual', 'biplane', 'simpson', '3d', 'auto'] }),
  lvefCategory: text('lvef_category', { enum: ['normal', 'mildly_reduced', 'moderately_reduced', 'severely_reduced'] }),

  // LV Dimensions (mm)
  lvedd: real('lvedd'), // LV end-diastolic diameter
  lvesd: real('lvesd'), // LV end-systolic diameter
  lvPosteriorWall: real('lv_posterior_wall'),
  ivSeptum: real('iv_septum'), // Interventricular septum

  // LV Volumes (ml)
  lvedv: real('lvedv'), // LV end-diastolic volume
  lvesv: real('lvesv'), // LV end-systolic volume
  strokeVolume: real('stroke_volume'),
  cardiacOutput: real('cardiac_output'), // L/min
  cardiacIndex: real('cardiac_index'), // L/min/m2

  // LV Mass
  lvMass: real('lv_mass'), // grams
  lvMassIndex: real('lv_mass_index'), // g/m2
  lvhPresent: integer('lvh_present', { mode: 'boolean' }).default(false),
  lvhSeverity: text('lvh_severity', { enum: ['mild', 'moderate', 'severe'] }),
  lvhPattern: text('lvh_pattern', { enum: ['concentric', 'eccentric', 'asymmetric'] }),

  // Global Longitudinal Strain
  gls: real('gls'), // Global longitudinal strain %
  glsNormal: integer('gls_normal', { mode: 'boolean' }),
  segmentalStrain: text('segmental_strain'), // JSON - per segment values

  // Wall Motion
  wallMotionAbnormalities: integer('wall_motion_abnormalities', { mode: 'boolean' }).default(false),
  wallMotionScore: real('wall_motion_score'), // Wall motion score index
  wallMotionBySegment: text('wall_motion_by_segment'), // JSON - 16/17 segment model
  akineticSegments: text('akinetic_segments'), // JSON
  hypokineticSegments: text('hypokinetic_segments'), // JSON
  dyskineticSegments: text('dyskinetic_segments'), // JSON

  // LV Diastolic Function
  diastolicGrade: text('diastolic_grade', {
    enum: ['normal', 'grade_1', 'grade_2', 'grade_3', 'indeterminate']
  }),
  eWave: real('e_wave'), // cm/s
  aWave: real('a_wave'), // cm/s
  eaRatio: real('ea_ratio'),
  ePrimeSeptal: real('e_prime_septal'), // cm/s
  ePrimeLateral: real('e_prime_lateral'),
  ePrimeAvg: real('e_prime_avg'),
  eeRatio: real('ee_ratio'),
  decelerationTime: real('deceleration_time'), // ms
  laVolume: real('la_volume'), // ml
  laVolumeIndex: real('la_volume_index'), // ml/m2
  trVelocity: real('tr_velocity'), // m/s

  // Left Atrium
  laDimension: real('la_dimension'), // mm
  laArea: real('la_area'), // cm2
  laEnlarged: integer('la_enlarged', { mode: 'boolean' }).default(false),

  // Right Ventricle
  rvFunction: text('rv_function', { enum: ['normal', 'mildly_reduced', 'moderately_reduced', 'severely_reduced'] }),
  tapse: real('tapse'), // mm
  rvSprime: real('rv_s_prime'), // cm/s
  rvFac: real('rv_fac'), // Fractional area change %
  rvBasalDiameter: real('rv_basal_diameter'),
  rvDilated: integer('rv_dilated', { mode: 'boolean' }).default(false),
  rvsp: real('rvsp'), // Right ventricular systolic pressure (mmHg)

  // Right Atrium
  raArea: real('ra_area'),
  raEnlarged: integer('ra_enlarged', { mode: 'boolean' }).default(false),

  // Aortic Valve
  aorticValve: text('aortic_valve'), // JSON - detailed findings
  avMorphology: text('av_morphology', { enum: ['trileaflet', 'bicuspid', 'unicuspid', 'prosthetic', 'not_visualized'] }),
  aorticStenosis: text('aortic_stenosis', { enum: ['none', 'mild', 'moderate', 'severe'] }),
  avPeakVelocity: real('av_peak_velocity'), // m/s
  avMeanGradient: real('av_mean_gradient'), // mmHg
  avArea: real('av_area'), // cm2 by continuity
  aorticRegurgitation: text('aortic_regurgitation', { enum: ['none', 'trace', 'mild', 'moderate', 'severe'] }),
  arJetWidth: real('ar_jet_width'),
  arVenaContracta: real('ar_vena_contracta'),

  // Mitral Valve
  mitralValve: text('mitral_valve'), // JSON
  mvMorphology: text('mv_morphology', { enum: ['normal', 'myxomatous', 'rheumatic', 'prosthetic', 'calcified'] }),
  mitralStenosis: text('mitral_stenosis', { enum: ['none', 'mild', 'moderate', 'severe'] }),
  mvArea: real('mv_area'), // cm2
  mvMeanGradient: real('mv_mean_gradient'),
  mitralRegurgitation: text('mitral_regurgitation', { enum: ['none', 'trace', 'mild', 'moderate', 'moderate_severe', 'severe'] }),
  mrMechanism: text('mr_mechanism'), // degenerative, functional, etc.
  mrVenaContracta: real('mr_vena_contracta'),
  mrEroa: real('mr_eroa'), // Effective regurgitant orifice area
  mvProlapse: integer('mv_prolapse', { mode: 'boolean' }).default(false),

  // Tricuspid Valve
  tricuspidValve: text('tricuspid_valve'), // JSON
  tricuspidRegurgitation: text('tricuspid_regurgitation', { enum: ['none', 'trace', 'mild', 'moderate', 'severe'] }),
  trVenaContracta: real('tr_vena_contracta'),

  // Pulmonic Valve
  pulmonicValve: text('pulmonic_valve'), // JSON
  pulmonicRegurgitation: text('pulmonic_regurgitation', { enum: ['none', 'trace', 'mild', 'moderate', 'severe'] }),

  // Aorta
  aorticRootDiameter: real('aortic_root_diameter'),
  ascendingAortaDiameter: real('ascending_aorta_diameter'),
  aorticAneurysm: integer('aortic_aneurysm', { mode: 'boolean' }).default(false),

  // Pericardium
  pericardialEffusion: text('pericardial_effusion', { enum: ['none', 'trace', 'small', 'moderate', 'large'] }),
  effusionLocation: text('effusion_location'), // circumferential, loculated
  tamponadePhysiology: integer('tamponade_physiology', { mode: 'boolean' }).default(false),

  // Other findings
  vegetations: integer('vegetations', { mode: 'boolean' }).default(false),
  thrombus: integer('thrombus', { mode: 'boolean' }).default(false),
  thrombusLocation: text('thrombus_location'),
  mass: integer('mass', { mode: 'boolean' }).default(false),
  patentForamenOvale: integer('patent_foramen_ovale', { mode: 'boolean' }),
  asd: integer('asd', { mode: 'boolean' }),
  vsd: integer('vsd', { mode: 'boolean' }),

  // AI Summary
  aiSummary: text('ai_summary'),
  majorFindings: text('major_findings'), // JSON
  recommendations: text('recommendations'), // JSON
  changeFromPrevious: text('change_from_previous'),

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// IMAGING REPORTS
// ============================================================================

/**
 * Imaging Reports
 * Generated reports from imaging analyses
 */
export const imagingReports = sqliteTable('imaging_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  imagingAnalysisId: text('imaging_analysis_id').notNull().references(() => imagingAnalysis.id, { onDelete: 'cascade' }),

  // Report identification
  reportNumber: text('report_number').notNull(),
  reportType: text('report_type', {
    enum: ['preliminary', 'final', 'addendum', 'amended', 'comparison']
  }).default('final'),

  // Report content
  title: text('title').notNull(),
  clinicalHistory: text('clinical_history'),
  indication: text('indication'),
  technique: text('technique'),
  comparison: text('comparison'), // Previous studies compared
  findings: text('findings'), // Main findings text
  measurements: text('measurements'), // JSON - key measurements
  impression: text('impression'), // Diagnosis/impression
  recommendations: text('recommendations'),

  // Report generation
  generatedBy: text('generated_by', { enum: ['ai', 'physician', 'template', 'hybrid'] }),
  aiGenerated: integer('ai_generated', { mode: 'boolean' }).default(false),
  aiConfidence: real('ai_confidence'),

  // Report status
  status: text('status', {
    enum: ['draft', 'pending_review', 'reviewed', 'signed', 'distributed', 'amended']
  }).default('draft'),

  // Physician review
  reviewedBy: text('reviewed_by').references(() => employees.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  modifications: text('modifications'), // JSON - changes made by physician

  // Signature
  signedBy: text('signed_by').references(() => employees.id),
  signedAt: integer('signed_at', { mode: 'timestamp' }),
  signatureMethod: text('signature_method', { enum: ['electronic', 'digital_certificate', 'biometric'] }),

  // Distribution
  distributedAt: integer('distributed_at', { mode: 'timestamp' }),
  distributedTo: text('distributed_to'), // JSON - recipients
  faxedTo: text('faxed_to'),
  emailedTo: text('emailed_to'),

  // Report file
  reportUrl: text('report_url'),
  pdfUrl: text('pdf_url'),
  format: text('format', { enum: ['pdf', 'html', 'dicom_sr'] }),

  // Critical results
  criticalResult: integer('critical_result', { mode: 'boolean' }).default(false),
  criticalResultCommunicated: integer('critical_result_communicated', { mode: 'boolean' }),
  criticalResultCommunicatedTo: text('critical_result_communicated_to'),
  criticalResultCommunicatedAt: integer('critical_result_communicated_at', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
