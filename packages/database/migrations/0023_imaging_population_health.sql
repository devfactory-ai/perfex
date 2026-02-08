-- ============================================================================
-- Phase 3: AI-Powered Imaging & Population Health Analytics
-- Migration for imaging analysis and population health management
-- ============================================================================

-- ============================================================================
-- IMAGING ANALYSIS TABLES
-- ============================================================================

-- Core imaging analysis table
CREATE TABLE IF NOT EXISTS imaging_analysis (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

  examination_id TEXT,
  examination_type TEXT,

  image_type TEXT NOT NULL CHECK (image_type IN ('ecg', 'oct', 'fundus', 'echocardiogram', 'visual_field', 'angiography', 'xray', 'ct', 'mri', 'other')),
  image_subtype TEXT,

  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_file_name TEXT,
  file_format TEXT,
  file_size_bytes INTEGER,

  acquisition_date INTEGER NOT NULL,
  equipment TEXT,
  manufacturer TEXT,
  protocol_used TEXT,
  technician_id TEXT REFERENCES employees(id),

  source_module TEXT CHECK (source_module IN ('cardiology', 'ophthalmology', 'dialyse', 'general')),

  ai_model TEXT,
  ai_model_version TEXT,
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  analysis_started_at INTEGER,
  analysis_completed_at INTEGER,
  analysis_error TEXT,

  ai_findings TEXT,
  ai_measurements TEXT,
  ai_diagnosis TEXT,
  ai_confidence REAL,
  ai_annotations TEXT,
  ai_summary TEXT,

  has_abnormality INTEGER DEFAULT 0,
  abnormality_count INTEGER DEFAULT 0,
  critical_finding INTEGER DEFAULT 0,
  requires_urgent_review INTEGER DEFAULT 0,
  urgency_level TEXT DEFAULT 'routine' CHECK (urgency_level IN ('routine', 'priority', 'urgent', 'stat')),

  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'in_review', 'reviewed', 'signed', 'amended')),
  reviewed_by TEXT REFERENCES employees(id),
  reviewed_at INTEGER,
  reviewer_agreement TEXT CHECK (reviewer_agreement IN ('agree', 'partially_agree', 'disagree', 'needs_clarification')),
  physician_findings TEXT,
  physician_diagnosis TEXT,
  physician_notes TEXT,

  compared_to_id TEXT,
  progression_status TEXT CHECK (progression_status IN ('improved', 'stable', 'worsened', 'new_finding', 'not_applicable')),
  progression_notes TEXT,

  signed_by TEXT REFERENCES employees(id),
  signed_at INTEGER,
  digital_signature TEXT,

  report_generated INTEGER DEFAULT 0,
  report_url TEXT,

  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ECG analysis details
CREATE TABLE IF NOT EXISTS imaging_ecg_analysis (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  imaging_analysis_id TEXT NOT NULL REFERENCES imaging_analysis(id) ON DELETE CASCADE,

  ecg_type TEXT DEFAULT '12_lead' CHECK (ecg_type IN ('12_lead', '6_lead', '3_lead', 'single_lead', 'holter', 'event_monitor', 'stress_test')),
  duration_seconds INTEGER,

  heart_rate INTEGER,
  heart_rate_variability REAL,
  rr_interval REAL,

  rhythm TEXT CHECK (rhythm IN ('normal_sinus', 'sinus_bradycardia', 'sinus_tachycardia', 'atrial_fibrillation', 'atrial_flutter', 'svt', 'ventricular_tachycardia', 'ventricular_fibrillation', 'paced', 'junctional', 'idioventricular', 'asystole', 'other')),
  rhythm_regularity TEXT CHECK (rhythm_regularity IN ('regular', 'regularly_irregular', 'irregularly_irregular')),
  rhythm_confidence REAL,

  pr_interval REAL,
  pr_interval_status TEXT CHECK (pr_interval_status IN ('normal', 'short', 'prolonged')),
  qrs_duration REAL,
  qrs_duration_status TEXT CHECK (qrs_duration_status IN ('normal', 'prolonged')),
  qt_interval REAL,
  qtc_interval REAL,
  qtc_formula TEXT DEFAULT 'bazett' CHECK (qtc_formula IN ('bazett', 'fridericia', 'framingham')),
  qtc_status TEXT CHECK (qtc_status IN ('normal', 'borderline', 'prolonged', 'short')),

  p_axis INTEGER,
  qrs_axis INTEGER,
  qrs_axis_deviation TEXT CHECK (qrs_axis_deviation IN ('normal', 'left', 'right', 'extreme')),
  t_axis INTEGER,

  p_wave_abnormalities TEXT,
  qrs_abnormalities TEXT,
  st_changes TEXT,
  st_elevation_present INTEGER DEFAULT 0,
  st_depression_present INTEGER DEFAULT 0,
  t_wave_changes TEXT,
  u_wave_present INTEGER DEFAULT 0,

  conduction_abnormalities TEXT,
  av_block TEXT CHECK (av_block IN ('none', 'first_degree', 'second_degree_type1', 'second_degree_type2', 'third_degree')),
  bundle_branch_block TEXT CHECK (bundle_branch_block IN ('none', 'rbbb', 'lbbb', 'bifascicular', 'trifascicular')),
  fascicular_block TEXT CHECK (fascicular_block IN ('none', 'lafb', 'lpfb')),

  arrhythmias TEXT,
  pvcs_count INTEGER,
  pacs_count INTEGER,
  pauses_detected INTEGER DEFAULT 0,
  longest_pause_ms INTEGER,

  ischemia_present INTEGER DEFAULT 0,
  ischemia_territory TEXT,
  infarction_pattern TEXT CHECK (infarction_pattern IN ('none', 'stemi', 'nstemi', 'old_mi', 'posterior')),
  infarction_location TEXT,

  lvh_present INTEGER DEFAULT 0,
  lvh_criteria TEXT,
  rvh_present INTEGER DEFAULT 0,

  ai_interpretation TEXT,
  differential_diagnoses TEXT,
  clinical_correlation TEXT,
  urgency_score INTEGER,

  compared_to_ecg_id TEXT,
  changes_from_previous TEXT,

  lead_data TEXT,

  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- OCT analysis details
CREATE TABLE IF NOT EXISTS imaging_oct_analysis (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  imaging_analysis_id TEXT NOT NULL REFERENCES imaging_analysis(id) ON DELETE CASCADE,

  eye TEXT NOT NULL CHECK (eye IN ('od', 'os')),
  scan_type TEXT NOT NULL CHECK (scan_type IN ('macular_cube', 'optic_disc_cube', 'line_scan', 'radial', 'raster', 'angio_oct', 'wide_field')),
  scan_pattern TEXT,
  signal_strength INTEGER,

  central_macular_thickness INTEGER,
  avg_macular_thickness INTEGER,
  macular_volume REAL,

  central_subfield INTEGER,
  inner_superior INTEGER,
  inner_inferior INTEGER,
  inner_nasal INTEGER,
  inner_temporal INTEGER,
  outer_superior INTEGER,
  outer_inferior INTEGER,
  outer_nasal INTEGER,
  outer_temporal INTEGER,

  avg_rnfl_thickness INTEGER,
  rnfl_symmetry INTEGER,
  rnfl_quadrants TEXT,
  rnfl_clock_hours TEXT,
  rnfl_status TEXT CHECK (rnfl_status IN ('normal', 'borderline', 'abnormal')),

  gcl_ipl_thickness INTEGER,
  gcl_ipl_minimum INTEGER,
  gcl_ipl_status TEXT CHECK (gcl_ipl_status IN ('normal', 'borderline', 'abnormal')),

  cup_disc_ratio REAL,
  cup_disc_ratio_vertical REAL,
  cup_volume REAL,
  rim_area REAL,
  disc_area REAL,

  drusen_present INTEGER DEFAULT 0,
  drusen_type TEXT,
  drusen_volume REAL,
  drusen_area REAL,

  fluid_present INTEGER DEFAULT 0,
  fluid_type TEXT CHECK (fluid_type IN ('none', 'irf', 'srf', 'ped', 'mixed')),
  fluid_volume REAL,
  fluid_locations TEXT,

  epiretinal_membrane INTEGER DEFAULT 0,
  erm_severity TEXT CHECK (erm_severity IN ('mild', 'moderate', 'severe')),
  vitreomacular_traction INTEGER DEFAULT 0,
  vmt_status TEXT CHECK (vmt_status IN ('none', 'focal', 'broad')),
  macular_hole INTEGER DEFAULT 0,
  macular_hole_stage TEXT CHECK (macular_hole_stage IN ('1a', '1b', '2', '3', '4')),
  macular_hole_size INTEGER,

  atrophy_present INTEGER DEFAULT 0,
  geographic_atrophy_area REAL,
  rpe_atrophy_area REAL,

  cnv_present INTEGER DEFAULT 0,
  cnv_type TEXT CHECK (cnv_type IN ('type1', 'type2', 'type3', 'mixed')),
  cnv_activity TEXT CHECK (cnv_activity IN ('active', 'inactive', 'scar')),

  segmentation_layers TEXT,
  segmentation_quality TEXT CHECK (segmentation_quality IN ('good', 'fair', 'poor', 'failed')),
  layer_abnormalities TEXT,

  abnormal_regions TEXT,

  amd_stage TEXT CHECK (amd_stage IN ('none', 'early', 'intermediate', 'late_dry', 'late_wet')),
  dr_severity TEXT CHECK (dr_severity IN ('none', 'mild_npdr', 'moderate_npdr', 'severe_npdr', 'pdr')),
  dme_present INTEGER DEFAULT 0,
  dme_type TEXT CHECK (dme_type IN ('focal', 'diffuse', 'cme', 'mixed')),

  glaucoma_risk TEXT CHECK (glaucoma_risk IN ('low', 'moderate', 'high')),
  glaucoma_indicators TEXT,

  compared_to_oct_id TEXT,
  change_from_previous TEXT,
  progression_analysis TEXT,

  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Fundus analysis details
CREATE TABLE IF NOT EXISTS imaging_fundus_analysis (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  imaging_analysis_id TEXT NOT NULL REFERENCES imaging_analysis(id) ON DELETE CASCADE,

  eye TEXT NOT NULL CHECK (eye IN ('od', 'os')),
  image_field TEXT DEFAULT 'central' CHECK (image_field IN ('central', 'temporal', 'nasal', 'superior', 'inferior', 'wide_field', 'ultra_wide', 'montage')),
  field_angle INTEGER,
  dilation INTEGER DEFAULT 1,
  image_quality TEXT CHECK (image_quality IN ('excellent', 'good', 'fair', 'poor', 'ungradable')),

  optic_disc_appearance TEXT CHECK (optic_disc_appearance IN ('normal', 'abnormal', 'not_visible')),
  optic_disc_edges TEXT CHECK (optic_disc_edges IN ('well_defined', 'blurred', 'elevated')),
  cup_disc_ratio_estimate REAL,
  pallor INTEGER DEFAULT 0,
  neovascularization_disc INTEGER DEFAULT 0,
  disc_hemorrhage INTEGER DEFAULT 0,

  macula_appearance TEXT CHECK (macula_appearance IN ('normal', 'abnormal', 'not_visible')),
  foveal_reflex TEXT CHECK (foveal_reflex IN ('present', 'diminished', 'absent')),
  macula_edema INTEGER DEFAULT 0,
  macula_exudates INTEGER DEFAULT 0,
  macula_hemorrhage INTEGER DEFAULT 0,
  macula_drusen INTEGER DEFAULT 0,
  macula_pigment_changes INTEGER DEFAULT 0,

  arteriovenous_ratio REAL,
  arteriolar_narrowing INTEGER DEFAULT 0,
  venous_tortuosity INTEGER DEFAULT 0,
  neovascularization_elsewhere INTEGER DEFAULT 0,
  venous_beading INTEGER DEFAULT 0,
  irma INTEGER DEFAULT 0,

  hemorrhages_present INTEGER DEFAULT 0,
  hemorrhage_types TEXT,
  hemorrhage_quadrants TEXT,
  hemorrhage_count TEXT CHECK (hemorrhage_count IN ('none', 'few', 'moderate', 'numerous')),

  hard_exudates INTEGER DEFAULT 0,
  hard_exudates_location TEXT,
  cotton_wool_spots INTEGER DEFAULT 0,
  cotton_wool_spots_count INTEGER,

  drusen_present INTEGER DEFAULT 0,
  drusen_classification TEXT,

  pigmentary_changes TEXT,
  atrophy TEXT,
  scars TEXT,
  retinal_detachment INTEGER DEFAULT 0,

  dr_grade TEXT CHECK (dr_grade IN ('no_dr', 'mild_npdr', 'moderate_npdr', 'severe_npdr', 'pdr', 'ungradable')),
  dr_grade_confidence REAL,
  amd_grade TEXT CHECK (amd_grade IN ('no_amd', 'early_amd', 'intermediate_amd', 'advanced_amd_dry', 'advanced_amd_wet')),
  amd_grade_confidence REAL,

  referral_recommended INTEGER DEFAULT 0,
  referral_urgency TEXT CHECK (referral_urgency IN ('routine', 'soon', 'urgent', 'emergent')),
  referral_reason TEXT,

  lesion_annotations TEXT,

  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Echocardiogram analysis details
CREATE TABLE IF NOT EXISTS imaging_echo_analysis (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  imaging_analysis_id TEXT NOT NULL REFERENCES imaging_analysis(id) ON DELETE CASCADE,

  study_type TEXT DEFAULT 'tte' CHECK (study_type IN ('tte', 'tee', 'stress_echo', 'contrast_echo', 'bubble_study', '3d_echo')),
  study_quality TEXT CHECK (study_quality IN ('excellent', 'good', 'fair', 'poor', 'non_diagnostic')),
  study_limitations TEXT,

  lvef REAL,
  lvef_method TEXT CHECK (lvef_method IN ('visual', 'biplane', 'simpson', '3d', 'auto')),
  lvef_category TEXT CHECK (lvef_category IN ('normal', 'mildly_reduced', 'moderately_reduced', 'severely_reduced')),

  lvedd REAL,
  lvesd REAL,
  lv_posterior_wall REAL,
  iv_septum REAL,

  lvedv REAL,
  lvesv REAL,
  stroke_volume REAL,
  cardiac_output REAL,
  cardiac_index REAL,

  lv_mass REAL,
  lv_mass_index REAL,
  lvh_present INTEGER DEFAULT 0,
  lvh_severity TEXT CHECK (lvh_severity IN ('mild', 'moderate', 'severe')),
  lvh_pattern TEXT CHECK (lvh_pattern IN ('concentric', 'eccentric', 'asymmetric')),

  gls REAL,
  gls_normal INTEGER,
  segmental_strain TEXT,

  wall_motion_abnormalities INTEGER DEFAULT 0,
  wall_motion_score REAL,
  wall_motion_by_segment TEXT,
  akinetic_segments TEXT,
  hypokinetic_segments TEXT,
  dyskinetic_segments TEXT,

  diastolic_grade TEXT CHECK (diastolic_grade IN ('normal', 'grade_1', 'grade_2', 'grade_3', 'indeterminate')),
  e_wave REAL,
  a_wave REAL,
  ea_ratio REAL,
  e_prime_septal REAL,
  e_prime_lateral REAL,
  e_prime_avg REAL,
  ee_ratio REAL,
  deceleration_time REAL,
  la_volume REAL,
  la_volume_index REAL,
  tr_velocity REAL,

  la_dimension REAL,
  la_area REAL,
  la_enlarged INTEGER DEFAULT 0,

  rv_function TEXT CHECK (rv_function IN ('normal', 'mildly_reduced', 'moderately_reduced', 'severely_reduced')),
  tapse REAL,
  rv_s_prime REAL,
  rv_fac REAL,
  rv_basal_diameter REAL,
  rv_dilated INTEGER DEFAULT 0,
  rvsp REAL,

  ra_area REAL,
  ra_enlarged INTEGER DEFAULT 0,

  aortic_valve TEXT,
  av_morphology TEXT CHECK (av_morphology IN ('trileaflet', 'bicuspid', 'unicuspid', 'prosthetic', 'not_visualized')),
  aortic_stenosis TEXT CHECK (aortic_stenosis IN ('none', 'mild', 'moderate', 'severe')),
  av_peak_velocity REAL,
  av_mean_gradient REAL,
  av_area REAL,
  aortic_regurgitation TEXT CHECK (aortic_regurgitation IN ('none', 'trace', 'mild', 'moderate', 'severe')),
  ar_jet_width REAL,
  ar_vena_contracta REAL,

  mitral_valve TEXT,
  mv_morphology TEXT CHECK (mv_morphology IN ('normal', 'myxomatous', 'rheumatic', 'prosthetic', 'calcified')),
  mitral_stenosis TEXT CHECK (mitral_stenosis IN ('none', 'mild', 'moderate', 'severe')),
  mv_area REAL,
  mv_mean_gradient REAL,
  mitral_regurgitation TEXT CHECK (mitral_regurgitation IN ('none', 'trace', 'mild', 'moderate', 'moderate_severe', 'severe')),
  mr_mechanism TEXT,
  mr_vena_contracta REAL,
  mr_eroa REAL,
  mv_prolapse INTEGER DEFAULT 0,

  tricuspid_valve TEXT,
  tricuspid_regurgitation TEXT CHECK (tricuspid_regurgitation IN ('none', 'trace', 'mild', 'moderate', 'severe')),
  tr_vena_contracta REAL,

  pulmonic_valve TEXT,
  pulmonic_regurgitation TEXT CHECK (pulmonic_regurgitation IN ('none', 'trace', 'mild', 'moderate', 'severe')),

  aortic_root_diameter REAL,
  ascending_aorta_diameter REAL,
  aortic_aneurysm INTEGER DEFAULT 0,

  pericardial_effusion TEXT CHECK (pericardial_effusion IN ('none', 'trace', 'small', 'moderate', 'large')),
  effusion_location TEXT,
  tamponade_physiology INTEGER DEFAULT 0,

  vegetations INTEGER DEFAULT 0,
  thrombus INTEGER DEFAULT 0,
  thrombus_location TEXT,
  mass INTEGER DEFAULT 0,
  patent_foramen_ovale INTEGER,
  asd INTEGER,
  vsd INTEGER,

  ai_summary TEXT,
  major_findings TEXT,
  recommendations TEXT,
  change_from_previous TEXT,

  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Imaging reports
CREATE TABLE IF NOT EXISTS imaging_reports (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  imaging_analysis_id TEXT NOT NULL REFERENCES imaging_analysis(id) ON DELETE CASCADE,

  report_number TEXT NOT NULL,
  report_type TEXT DEFAULT 'final' CHECK (report_type IN ('preliminary', 'final', 'addendum', 'amended', 'comparison')),

  title TEXT NOT NULL,
  clinical_history TEXT,
  indication TEXT,
  technique TEXT,
  comparison TEXT,
  findings TEXT,
  measurements TEXT,
  impression TEXT,
  recommendations TEXT,

  generated_by TEXT CHECK (generated_by IN ('ai', 'physician', 'template', 'hybrid')),
  ai_generated INTEGER DEFAULT 0,
  ai_confidence REAL,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'reviewed', 'signed', 'distributed', 'amended')),

  reviewed_by TEXT REFERENCES employees(id),
  reviewed_at INTEGER,
  modifications TEXT,

  signed_by TEXT REFERENCES employees(id),
  signed_at INTEGER,
  signature_method TEXT CHECK (signature_method IN ('electronic', 'digital_certificate', 'biometric')),

  distributed_at INTEGER,
  distributed_to TEXT,
  faxed_to TEXT,
  emailed_to TEXT,

  report_url TEXT,
  pdf_url TEXT,
  format TEXT CHECK (format IN ('pdf', 'html', 'dicom_sr')),

  critical_result INTEGER DEFAULT 0,
  critical_result_communicated INTEGER,
  critical_result_communicated_to TEXT,
  critical_result_communicated_at INTEGER,

  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- POPULATION HEALTH TABLES
-- ============================================================================

-- Risk prediction models
CREATE TABLE IF NOT EXISTS ph_risk_models (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,

  model_code TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  description TEXT,

  model_type TEXT NOT NULL CHECK (model_type IN ('hospitalization', 'mortality', 'readmission', 'complication', 'progression', 'emergency_visit', 'non_compliance', 'cost', 'custom')),

  target_condition TEXT,
  prediction_horizon_days INTEGER,

  input_features TEXT,
  feature_weights TEXT,
  model_parameters TEXT,
  thresholds TEXT,

  auc REAL,
  sensitivity REAL,
  specificity REAL,
  ppv REAL,
  npv REAL,
  calibration_slope REAL,
  brier_score REAL,

  validation_date INTEGER,
  validation_population_size INTEGER,
  validation_metrics TEXT,

  associated_module TEXT CHECK (associated_module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'active', 'deprecated')),
  is_default INTEGER DEFAULT 0,

  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Patient risk scores
CREATE TABLE IF NOT EXISTS ph_patient_risk_scores (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL REFERENCES ph_risk_models(id) ON DELETE CASCADE,

  calculated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  risk_score REAL NOT NULL,
  risk_percentile INTEGER,

  risk_category TEXT NOT NULL CHECK (risk_category IN ('very_low', 'low', 'moderate', 'high', 'very_high', 'critical')),

  confidence REAL,
  data_completeness REAL,

  prediction_start_date INTEGER,
  prediction_end_date INTEGER,
  valid_until INTEGER,

  top_factors TEXT,
  factor_values TEXT,
  protective_factors TEXT,

  recommendations TEXT,
  intervention_priority TEXT CHECK (intervention_priority IN ('low', 'medium', 'high', 'urgent')),

  previous_score REAL,
  previous_score_date INTEGER,
  score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'worsening', 'new')),
  change_percent REAL,

  outcome_observed INTEGER,
  actual_outcome TEXT,
  outcome_date INTEGER,
  prediction_accurate INTEGER,

  reviewed_by TEXT REFERENCES employees(id),
  reviewed_at INTEGER,
  review_notes TEXT,
  actions_taken TEXT,

  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Population cohorts
CREATE TABLE IF NOT EXISTS ph_population_cohorts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  cohort_code TEXT NOT NULL,
  cohort_name TEXT NOT NULL,
  description TEXT,

  cohort_type TEXT NOT NULL CHECK (cohort_type IN ('disease_based', 'risk_based', 'demographic', 'treatment_based', 'outcome_based', 'geographic', 'care_gap', 'custom')),

  associated_module TEXT CHECK (associated_module IN ('dialyse', 'cardiology', 'ophthalmology', 'all')),

  criteria TEXT NOT NULL,
  inclusion_criteria TEXT,
  exclusion_criteria TEXT,

  query_definition TEXT,

  patient_count INTEGER DEFAULT 0,
  last_patient_count_update INTEGER,
  avg_risk_score REAL,
  avg_age REAL,
  gender_distribution TEXT,

  auto_refresh INTEGER DEFAULT 1,
  refresh_frequency TEXT DEFAULT 'daily' CHECK (refresh_frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'manual')),
  last_refresh INTEGER,
  next_scheduled_refresh INTEGER,

  is_active INTEGER DEFAULT 1,
  is_public INTEGER DEFAULT 0,

  alert_on_change INTEGER DEFAULT 0,
  alert_threshold INTEGER,
  alert_recipients TEXT,

  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cohort membership
CREATE TABLE IF NOT EXISTS ph_cohort_membership (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL REFERENCES ph_population_cohorts(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,

  added_at INTEGER NOT NULL DEFAULT (unixepoch()),
  added_by TEXT DEFAULT 'system' CHECK (added_by IN ('system', 'manual', 'import')),
  added_by_user_id TEXT REFERENCES users(id),

  is_active INTEGER DEFAULT 1,
  removed_at INTEGER,
  removal_reason TEXT,

  inclusion_data TEXT,

  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cohort snapshots
CREATE TABLE IF NOT EXISTS ph_cohort_snapshots (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL REFERENCES ph_population_cohorts(id) ON DELETE CASCADE,

  snapshot_date INTEGER NOT NULL,
  snapshot_type TEXT DEFAULT 'scheduled' CHECK (snapshot_type IN ('scheduled', 'manual', 'triggered')),

  patient_count INTEGER NOT NULL,
  new_patients INTEGER DEFAULT 0,
  removed_patients INTEGER DEFAULT 0,

  avg_risk_score REAL,
  risk_distribution TEXT,

  age_distribution TEXT,
  gender_distribution TEXT,

  avg_comorbidities_count REAL,
  top_comorbidities TEXT,

  module_metrics TEXT,

  patient_ids TEXT,

  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Quality indicators
CREATE TABLE IF NOT EXISTS ph_quality_indicators (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,

  indicator_code TEXT NOT NULL,
  indicator_name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,

  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('process', 'outcome', 'structure', 'patient_experience', 'safety', 'efficiency')),

  source TEXT NOT NULL CHECK (source IN ('iqss', 'has', 'ars', 'internal', 'cms', 'jcaho', 'custom')),
  reference_document TEXT,
  reference_version TEXT,

  associated_module TEXT CHECK (associated_module IN ('dialyse', 'cardiology', 'ophthalmology', 'general', 'all')),

  category TEXT,
  subcategory TEXT,

  measure_type TEXT NOT NULL CHECK (measure_type IN ('proportion', 'rate', 'ratio', 'mean', 'median', 'count', 'composite')),

  numerator_description TEXT,
  numerator_criteria TEXT,
  denominator_description TEXT,
  denominator_criteria TEXT,
  exclusion_criteria TEXT,

  target_value REAL,
  target_operator TEXT CHECK (target_operator IN ('>=', '<=', '=', '>', '<', 'between')),
  target_value_secondary REAL,
  target_type TEXT CHECK (target_type IN ('absolute', 'percentile', 'improvement')),
  benchmark_value REAL,
  benchmark_source TEXT,
  benchmark_year INTEGER,

  display_format TEXT CHECK (display_format IN ('percent', 'decimal', 'per_1000', 'per_100000', 'ratio')),
  decimal_places INTEGER DEFAULT 1,
  invert_scale INTEGER DEFAULT 0,

  measurement_period TEXT DEFAULT 'quarterly' CHECK (measurement_period IN ('monthly', 'quarterly', 'semi_annual', 'annual', 'continuous')),

  risk_adjusted INTEGER DEFAULT 0,
  risk_adjustment_method TEXT,

  is_active INTEGER DEFAULT 1,
  is_mandatory INTEGER DEFAULT 0,
  effective_date INTEGER,
  retired_date INTEGER,

  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Quality measurements
CREATE TABLE IF NOT EXISTS ph_quality_measurements (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  indicator_id TEXT NOT NULL REFERENCES ph_quality_indicators(id) ON DELETE CASCADE,

  measurement_period TEXT NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,

  numerator INTEGER NOT NULL,
  denominator INTEGER NOT NULL,
  excluded_count INTEGER DEFAULT 0,
  value REAL NOT NULL,
  confidence_interval TEXT,

  risk_adjusted_value REAL,
  expected_value REAL,
  observed_expected_ratio REAL,

  meets_target INTEGER,
  gap_to_target REAL,
  target_value REAL,

  benchmark_value REAL,
  performance_vs_benchmark TEXT CHECK (performance_vs_benchmark IN ('above', 'at', 'below', 'significantly_above', 'significantly_below')),

  previous_value REAL,
  previous_period TEXT,
  trend TEXT CHECK (trend IN ('improving', 'stable', 'worsening', 'new')),
  trend_significant INTEGER,
  change_percent REAL,

  stratified_results TEXT,
  subgroup_analysis TEXT,

  numerator_patient_ids TEXT,
  denominator_patient_ids TEXT,
  detail_data TEXT,

  calculated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  calculation_method TEXT,
  data_source_version TEXT,
  data_quality_score REAL,

  validated INTEGER DEFAULT 0,
  validated_by TEXT REFERENCES employees(id),
  validated_at INTEGER,
  validation_notes TEXT,

  status TEXT DEFAULT 'preliminary' CHECK (status IN ('draft', 'preliminary', 'final', 'amended', 'retracted')),

  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Outcome definitions
CREATE TABLE IF NOT EXISTS ph_outcome_definitions (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,

  outcome_code TEXT NOT NULL,
  outcome_name TEXT NOT NULL,
  description TEXT,

  outcome_type TEXT NOT NULL CHECK (outcome_type IN ('mortality', 'hospitalization', 'readmission', 'complication', 'infection', 'emergency_visit', 'procedure', 'lab_abnormality', 'adverse_event', 'quality_of_life', 'functional_status', 'custom')),

  associated_module TEXT CHECK (associated_module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),

  criteria TEXT NOT NULL,
  icd10_codes TEXT,
  cpt_codes TEXT,
  lab_criteria TEXT,

  lookback_days INTEGER,
  follow_up_days INTEGER,

  has_severity_levels INTEGER DEFAULT 0,
  severity_levels TEXT,

  is_active INTEGER DEFAULT 1,

  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Outcome analytics
CREATE TABLE IF NOT EXISTS ph_outcome_analytics (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  outcome_definition_id TEXT NOT NULL REFERENCES ph_outcome_definitions(id),

  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('incidence', 'prevalence', 'rate', 'survival', 'time_to_event', 'comparison')),

  cohort_id TEXT REFERENCES ph_population_cohorts(id),
  associated_module TEXT CHECK (associated_module IN ('dialyse', 'cardiology', 'ophthalmology', 'all')),

  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  period_label TEXT,

  total_patients INTEGER NOT NULL,
  patients_at_risk INTEGER,
  person_years REAL,

  outcome_count INTEGER NOT NULL,
  outcome_rate REAL,
  outcome_rate_denominator INTEGER,
  incidence_rate REAL,
  prevalence REAL,

  ci_lower REAL,
  ci_upper REAL,
  standard_error REAL,

  benchmark_rate REAL,
  benchmark_source TEXT,
  rate_ratio REAL,
  rate_ratio_significant INTEGER,

  risk_adjusted_rate REAL,
  expected_events REAL,
  standardized_ratio REAL,

  stratified_results TEXT,
  by_severity TEXT,
  by_timeframe TEXT,

  previous_period_rate REAL,
  trend TEXT CHECK (trend IN ('improving', 'stable', 'worsening')),
  trend_p_value REAL,

  median_survival_days INTEGER,
  survival_at_30_days REAL,
  survival_at_90_days REAL,
  survival_at_1_year REAL,
  kaplan_meier_data TEXT,

  calculated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  methodology TEXT,
  limitations TEXT,

  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Patient outcomes
CREATE TABLE IF NOT EXISTS ph_patient_outcomes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  outcome_definition_id TEXT NOT NULL REFERENCES ph_outcome_definitions(id),

  outcome_date INTEGER NOT NULL,
  detected_date INTEGER DEFAULT (unixepoch()),
  detection_method TEXT CHECK (detection_method IN ('automated', 'manual_review', 'claim_data', 'registry', 'patient_reported')),

  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'fatal')),
  severity_score INTEGER,

  diagnosis_codes TEXT,
  procedure_codes TEXT,
  related_encounter_id TEXT,
  related_hospitalization INTEGER,
  length_of_stay INTEGER,

  preceding_risk_score REAL,
  risk_score_percentile INTEGER,
  was_high_risk INTEGER,
  interventions_received TEXT,

  module_data TEXT,

  verified INTEGER DEFAULT 0,
  verified_by TEXT REFERENCES employees(id),
  verified_at INTEGER,
  verification_notes TEXT,

  status TEXT DEFAULT 'confirmed' CHECK (status IN ('suspected', 'confirmed', 'ruled_out', 'pending_review')),

  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- IQSS reports
CREATE TABLE IF NOT EXISTS ph_iqss_reports (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  report_year INTEGER NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('dialysis', 'cardiology', 'ophthalmology', 'general')),
  report_version INTEGER DEFAULT 1,

  submission_deadline INTEGER,
  submitted_at INTEGER,
  submitted_by TEXT REFERENCES users(id),
  confirmation_number TEXT,

  indicator_results TEXT,
  narrative_comments TEXT,
  improvement_actions TEXT,

  overall_score REAL,
  indicators_met_target INTEGER,
  indicators_missed_target INTEGER,
  indicators_improved INTEGER,
  indicators_declined INTEGER,

  previous_year_score REAL,
  national_benchmark REAL,
  regional_benchmark REAL,

  report_url TEXT,
  supporting_documents TEXT,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'submitted', 'acknowledged', 'revision_requested')),

  reviewed_by TEXT REFERENCES employees(id),
  reviewed_at INTEGER,
  approved_by TEXT REFERENCES employees(id),
  approved_at INTEGER,

  authority_feedback TEXT,
  feedback_received_at INTEGER,

  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Care gap definitions
CREATE TABLE IF NOT EXISTS ph_care_gap_definitions (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,

  gap_code TEXT NOT NULL,
  gap_name TEXT NOT NULL,
  description TEXT,

  gap_type TEXT NOT NULL CHECK (gap_type IN ('screening', 'vaccination', 'medication', 'lab_monitoring', 'follow_up', 'referral', 'procedure', 'education', 'custom')),

  eligibility_criteria TEXT NOT NULL,
  excluded_conditions TEXT,

  compliance_criteria TEXT NOT NULL,
  frequency_days INTEGER,
  lookback_days INTEGER,

  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  clinical_impact TEXT,

  associated_module TEXT CHECK (associated_module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),

  recommended_action TEXT,
  order_suggestion TEXT,

  is_active INTEGER DEFAULT 1,

  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Patient care gaps
CREATE TABLE IF NOT EXISTS ph_patient_care_gaps (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  gap_definition_id TEXT NOT NULL REFERENCES ph_care_gap_definitions(id),

  identified_at INTEGER NOT NULL DEFAULT (unixepoch()),
  due_date INTEGER,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'scheduled', 'closed', 'excluded', 'declined')),

  last_compliance_date INTEGER,
  days_since_compliance INTEGER,
  overdue_days INTEGER,

  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  priority_reason TEXT,

  outreach_attempts INTEGER DEFAULT 0,
  last_outreach_date INTEGER,
  last_outreach_method TEXT,
  next_outreach_date INTEGER,

  closed_at INTEGER,
  closed_by TEXT REFERENCES users(id),
  closure_reason TEXT CHECK (closure_reason IN ('completed', 'scheduled', 'not_applicable', 'patient_declined', 'provider_excluded', 'expired')),
  closure_encounter_id TEXT,
  closure_notes TEXT,

  assigned_to TEXT REFERENCES employees(id),

  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Analytics dashboards
CREATE TABLE IF NOT EXISTS ph_analytics_dashboards (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  dashboard_code TEXT NOT NULL,
  dashboard_name TEXT NOT NULL,
  description TEXT,

  dashboard_type TEXT NOT NULL CHECK (dashboard_type IN ('executive', 'clinical', 'quality', 'population', 'operational', 'custom')),

  associated_module TEXT CHECK (associated_module IN ('dialyse', 'cardiology', 'ophthalmology', 'general', 'all')),

  layout TEXT NOT NULL,
  widgets TEXT NOT NULL,
  filters TEXT,

  auto_refresh INTEGER DEFAULT 0,
  refresh_interval_minutes INTEGER,
  last_refresh INTEGER,

  is_shared INTEGER DEFAULT 0,
  shared_with TEXT,

  is_active INTEGER DEFAULT 1,
  is_favorite INTEGER DEFAULT 0,

  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Scheduled reports (population health)
CREATE TABLE IF NOT EXISTS ph_scheduled_reports (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  report_name TEXT NOT NULL,
  description TEXT,

  report_type TEXT NOT NULL CHECK (report_type IN ('quality_summary', 'risk_report', 'cohort_report', 'outcome_report', 'care_gap_report', 'iqss_preview', 'custom')),

  configuration TEXT NOT NULL,
  cohort_id TEXT REFERENCES ph_population_cohorts(id),
  indicator_ids TEXT,

  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'on_demand')),
  schedule_cron TEXT,
  next_run_at INTEGER,
  last_run_at INTEGER,

  recipients TEXT NOT NULL,
  delivery_method TEXT CHECK (delivery_method IN ('email', 'sftp', 'api', 'dashboard')),
  format TEXT CHECK (format IN ('pdf', 'excel', 'csv', 'html')),

  is_active INTEGER DEFAULT 1,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'partial')),
  last_run_error TEXT,

  notes TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Imaging analysis indexes
CREATE INDEX IF NOT EXISTS idx_imaging_analysis_org ON imaging_analysis(organization_id);
CREATE INDEX IF NOT EXISTS idx_imaging_analysis_patient ON imaging_analysis(patient_id);
CREATE INDEX IF NOT EXISTS idx_imaging_analysis_type ON imaging_analysis(image_type);
CREATE INDEX IF NOT EXISTS idx_imaging_analysis_status ON imaging_analysis(analysis_status);
CREATE INDEX IF NOT EXISTS idx_imaging_analysis_review ON imaging_analysis(review_status);
CREATE INDEX IF NOT EXISTS idx_imaging_analysis_date ON imaging_analysis(acquisition_date);
CREATE INDEX IF NOT EXISTS idx_imaging_analysis_urgent ON imaging_analysis(requires_urgent_review) WHERE requires_urgent_review = 1;

CREATE INDEX IF NOT EXISTS idx_ecg_analysis_imaging ON imaging_ecg_analysis(imaging_analysis_id);
CREATE INDEX IF NOT EXISTS idx_oct_analysis_imaging ON imaging_oct_analysis(imaging_analysis_id);
CREATE INDEX IF NOT EXISTS idx_fundus_analysis_imaging ON imaging_fundus_analysis(imaging_analysis_id);
CREATE INDEX IF NOT EXISTS idx_echo_analysis_imaging ON imaging_echo_analysis(imaging_analysis_id);

CREATE INDEX IF NOT EXISTS idx_imaging_reports_analysis ON imaging_reports(imaging_analysis_id);
CREATE INDEX IF NOT EXISTS idx_imaging_reports_status ON imaging_reports(status);

-- Population health indexes
CREATE INDEX IF NOT EXISTS idx_risk_scores_patient ON ph_patient_risk_scores(patient_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_model ON ph_patient_risk_scores(model_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_category ON ph_patient_risk_scores(risk_category);
CREATE INDEX IF NOT EXISTS idx_risk_scores_date ON ph_patient_risk_scores(calculated_at);

CREATE INDEX IF NOT EXISTS idx_cohort_membership_cohort ON ph_cohort_membership(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_membership_patient ON ph_cohort_membership(patient_id);
CREATE INDEX IF NOT EXISTS idx_cohort_membership_active ON ph_cohort_membership(is_active) WHERE is_active = 1;

CREATE INDEX IF NOT EXISTS idx_quality_measurements_indicator ON ph_quality_measurements(indicator_id);
CREATE INDEX IF NOT EXISTS idx_quality_measurements_period ON ph_quality_measurements(measurement_period);

CREATE INDEX IF NOT EXISTS idx_patient_outcomes_patient ON ph_patient_outcomes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_outcomes_definition ON ph_patient_outcomes(outcome_definition_id);
CREATE INDEX IF NOT EXISTS idx_patient_outcomes_date ON ph_patient_outcomes(outcome_date);

CREATE INDEX IF NOT EXISTS idx_care_gaps_patient ON ph_patient_care_gaps(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_gaps_status ON ph_patient_care_gaps(status);
CREATE INDEX IF NOT EXISTS idx_care_gaps_due ON ph_patient_care_gaps(due_date);
CREATE INDEX IF NOT EXISTS idx_care_gaps_priority ON ph_patient_care_gaps(priority);
