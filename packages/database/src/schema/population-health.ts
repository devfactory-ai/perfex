/**
 * Population Health & Predictive Analytics Module Schema
 * Risk scores, cohorts, quality indicators (IQSS), and outcome analytics
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';
import { healthcarePatients } from './healthcare';
import { employees } from './hr';

// ============================================================================
// RISK STRATIFICATION
// ============================================================================

/**
 * Risk Prediction Models
 * Definitions of predictive models used for risk stratification
 */
export const riskModels = sqliteTable('ph_risk_models', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }), // null = system-wide

  // Model identification
  modelCode: text('model_code').notNull(),
  modelName: text('model_name').notNull(),
  modelVersion: text('model_version').notNull(),
  description: text('description'),

  // Model type
  modelType: text('model_type', {
    enum: ['hospitalization', 'mortality', 'readmission', 'complication', 'progression',
           'emergency_visit', 'non_compliance', 'cost', 'custom']
  }).notNull(),

  // Target condition/outcome
  targetCondition: text('target_condition'), // e.g., 'dialysis_hospitalization'
  predictionHorizonDays: integer('prediction_horizon_days'), // e.g., 30, 90, 365

  // Model parameters
  inputFeatures: text('input_features'), // JSON - required features
  featureWeights: text('feature_weights'), // JSON - feature importance
  modelParameters: text('model_parameters'), // JSON - model coefficients/settings
  thresholds: text('thresholds'), // JSON - risk category thresholds

  // Model performance
  auc: real('auc'), // Area under ROC curve
  sensitivity: real('sensitivity'),
  specificity: real('specificity'),
  ppv: real('ppv'), // Positive predictive value
  npv: real('npv'), // Negative predictive value
  calibrationSlope: real('calibration_slope'),
  brierScore: real('brier_score'),

  // Validation
  validationDate: integer('validation_date', { mode: 'timestamp' }),
  validationPopulationSize: integer('validation_population_size'),
  validationMetrics: text('validation_metrics'), // JSON

  // Module association
  associatedModule: text('associated_module', {
    enum: ['dialyse', 'cardiology', 'ophthalmology', 'general']
  }),

  // Status
  status: text('status', { enum: ['draft', 'validated', 'active', 'deprecated'] }).default('draft'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),

  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Patient Risk Scores
 * Individual patient risk score calculations
 */
export const patientRiskScores = sqliteTable('ph_patient_risk_scores', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull().references(() => riskModels.id, { onDelete: 'cascade' }),

  // Score calculation
  calculatedAt: integer('calculated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  riskScore: real('risk_score').notNull(), // 0-100 or 0-1 depending on model
  riskPercentile: integer('risk_percentile'), // Percentile rank in population

  // Risk categorization
  riskCategory: text('risk_category', {
    enum: ['very_low', 'low', 'moderate', 'high', 'very_high', 'critical']
  }).notNull(),

  // Confidence
  confidence: real('confidence'), // 0-1 model confidence
  dataCompleteness: real('data_completeness'), // % of features available

  // Prediction window
  predictionStartDate: integer('prediction_start_date', { mode: 'timestamp' }),
  predictionEndDate: integer('prediction_end_date', { mode: 'timestamp' }),
  validUntil: integer('valid_until', { mode: 'timestamp' }),

  // Contributing factors
  topFactors: text('top_factors'), // JSON - ranked contributing factors
  factorValues: text('factor_values'), // JSON - input values used
  protectiveFactors: text('protective_factors'), // JSON - risk-reducing factors

  // Recommendations
  recommendations: text('recommendations'), // JSON - suggested interventions
  interventionPriority: text('intervention_priority', { enum: ['low', 'medium', 'high', 'urgent'] }),

  // Comparison
  previousScore: real('previous_score'),
  previousScoreDate: integer('previous_score_date', { mode: 'timestamp' }),
  scoreTrend: text('score_trend', { enum: ['improving', 'stable', 'worsening', 'new'] }),
  changePercent: real('change_percent'),

  // Outcome tracking (retrospective validation)
  outcomeObserved: integer('outcome_observed', { mode: 'boolean' }),
  actualOutcome: text('actual_outcome'),
  outcomeDate: integer('outcome_date', { mode: 'timestamp' }),
  predictionAccurate: integer('prediction_accurate', { mode: 'boolean' }),

  // Clinical review
  reviewedBy: text('reviewed_by').references(() => employees.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewNotes: text('review_notes'),
  actionsTaken: text('actions_taken'), // JSON - interventions applied

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// POPULATION COHORTS
// ============================================================================

/**
 * Population Cohorts
 * Defined patient groups for analysis and management
 */
export const populationCohorts = sqliteTable('ph_population_cohorts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Cohort identification
  cohortCode: text('cohort_code').notNull(),
  cohortName: text('cohort_name').notNull(),
  description: text('description'),

  // Cohort type
  cohortType: text('cohort_type', {
    enum: ['disease_based', 'risk_based', 'demographic', 'treatment_based',
           'outcome_based', 'geographic', 'care_gap', 'custom']
  }).notNull(),

  // Module association
  associatedModule: text('associated_module', {
    enum: ['dialyse', 'cardiology', 'ophthalmology', 'all']
  }),

  // Cohort definition criteria
  criteria: text('criteria').notNull(), // JSON - inclusion/exclusion criteria
  inclusionCriteria: text('inclusion_criteria'), // JSON - detailed inclusion
  exclusionCriteria: text('exclusion_criteria'), // JSON - detailed exclusion

  // SQL-like query (for advanced users)
  queryDefinition: text('query_definition'),

  // Current statistics
  patientCount: integer('patient_count').default(0),
  lastPatientCountUpdate: integer('last_patient_count_update', { mode: 'timestamp' }),
  avgRiskScore: real('avg_risk_score'),
  avgAge: real('avg_age'),
  genderDistribution: text('gender_distribution'), // JSON

  // Refresh settings
  autoRefresh: integer('auto_refresh', { mode: 'boolean' }).default(true),
  refreshFrequency: text('refresh_frequency', {
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'manual']
  }).default('daily'),
  lastRefresh: integer('last_refresh', { mode: 'timestamp' }),
  nextScheduledRefresh: integer('next_scheduled_refresh', { mode: 'timestamp' }),

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false), // Shared across org

  // Alert settings
  alertOnChange: integer('alert_on_change', { mode: 'boolean' }).default(false),
  alertThreshold: integer('alert_threshold'), // % change to trigger alert
  alertRecipients: text('alert_recipients'), // JSON - user IDs

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Cohort Membership
 * Patients belonging to cohorts
 */
export const cohortMembership = sqliteTable('ph_cohort_membership', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  cohortId: text('cohort_id').notNull().references(() => populationCohorts.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),

  // Membership details
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  addedBy: text('added_by', { enum: ['system', 'manual', 'import'] }).default('system'),
  addedByUserId: text('added_by_user_id').references(() => users.id),

  // Membership status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  removedAt: integer('removed_at', { mode: 'timestamp' }),
  removalReason: text('removal_reason'),

  // Patient-specific data at time of inclusion
  inclusionData: text('inclusion_data'), // JSON - criteria values at inclusion

  // Notes
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Cohort Snapshots
 * Historical snapshots of cohort composition
 */
export const cohortSnapshots = sqliteTable('ph_cohort_snapshots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  cohortId: text('cohort_id').notNull().references(() => populationCohorts.id, { onDelete: 'cascade' }),

  // Snapshot timing
  snapshotDate: integer('snapshot_date', { mode: 'timestamp' }).notNull(),
  snapshotType: text('snapshot_type', { enum: ['scheduled', 'manual', 'triggered'] }).default('scheduled'),

  // Statistics
  patientCount: integer('patient_count').notNull(),
  newPatients: integer('new_patients').default(0),
  removedPatients: integer('removed_patients').default(0),

  // Risk distribution
  avgRiskScore: real('avg_risk_score'),
  riskDistribution: text('risk_distribution'), // JSON - by risk category

  // Demographics
  ageDistribution: text('age_distribution'), // JSON
  genderDistribution: text('gender_distribution'), // JSON

  // Clinical metrics
  avgComorbiditiesCount: real('avg_comorbidities_count'),
  topComorbidities: text('top_comorbidities'), // JSON

  // Module-specific metrics
  moduleMetrics: text('module_metrics'), // JSON - dialyse/cardio/ophthalmo specific

  // Full patient list (for audit)
  patientIds: text('patient_ids'), // JSON array

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// QUALITY INDICATORS (IQSS)
// ============================================================================

/**
 * Quality Indicators
 * Definition of quality measures (IQSS, internal, regulatory)
 */
export const qualityIndicators = sqliteTable('ph_quality_indicators', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }), // null = national

  // Indicator identification
  indicatorCode: text('indicator_code').notNull(), // e.g., 'IQSS-DIA-01'
  indicatorName: text('indicator_name').notNull(),
  shortName: text('short_name'),
  description: text('description'),

  // Indicator type
  indicatorType: text('indicator_type', {
    enum: ['process', 'outcome', 'structure', 'patient_experience', 'safety', 'efficiency']
  }).notNull(),

  // Source/authority
  source: text('source', {
    enum: ['iqss', 'has', 'ars', 'internal', 'cms', 'jcaho', 'custom']
  }).notNull(),
  referenceDocument: text('reference_document'),
  referenceVersion: text('reference_version'),

  // Module association
  associatedModule: text('associated_module', {
    enum: ['dialyse', 'cardiology', 'ophthalmology', 'general', 'all']
  }),

  // Measure category
  category: text('category'), // e.g., 'Vascular Access', 'Glycemic Control'
  subcategory: text('subcategory'),

  // Calculation methodology
  measureType: text('measure_type', {
    enum: ['proportion', 'rate', 'ratio', 'mean', 'median', 'count', 'composite']
  }).notNull(),

  // Numerator/Denominator definitions
  numeratorDescription: text('numerator_description'),
  numeratorCriteria: text('numerator_criteria'), // JSON - inclusion criteria
  denominatorDescription: text('denominator_description'),
  denominatorCriteria: text('denominator_criteria'), // JSON - eligible population
  exclusionCriteria: text('exclusion_criteria'), // JSON - exclusions

  // Targets and benchmarks
  targetValue: real('target_value'),
  targetOperator: text('target_operator', { enum: ['>=', '<=', '=', '>', '<', 'between'] }),
  targetValueSecondary: real('target_value_secondary'), // For 'between'
  targetType: text('target_type', { enum: ['absolute', 'percentile', 'improvement'] }),
  benchmarkValue: real('benchmark_value'), // National/regional benchmark
  benchmarkSource: text('benchmark_source'),
  benchmarkYear: integer('benchmark_year'),

  // Display settings
  displayFormat: text('display_format', { enum: ['percent', 'decimal', 'per_1000', 'per_100000', 'ratio'] }),
  decimalPlaces: integer('decimal_places').default(1),
  invertScale: integer('invert_scale', { mode: 'boolean' }).default(false), // Lower is better

  // Calculation frequency
  measurementPeriod: text('measurement_period', {
    enum: ['monthly', 'quarterly', 'semi_annual', 'annual', 'continuous']
  }).default('quarterly'),

  // Risk adjustment
  riskAdjusted: integer('risk_adjusted', { mode: 'boolean' }).default(false),
  riskAdjustmentMethod: text('risk_adjustment_method'),

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  isMandatory: integer('is_mandatory', { mode: 'boolean' }).default(false),
  effectiveDate: integer('effective_date', { mode: 'timestamp' }),
  retiredDate: integer('retired_date', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Quality Measurements
 * Calculated quality indicator values
 */
export const qualityMeasurements = sqliteTable('ph_quality_measurements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  indicatorId: text('indicator_id').notNull().references(() => qualityIndicators.id, { onDelete: 'cascade' }),

  // Measurement period
  measurementPeriod: text('measurement_period').notNull(), // '2024-Q1', '2024-01', '2024'
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),

  // Calculation results
  numerator: integer('numerator').notNull(),
  denominator: integer('denominator').notNull(),
  excludedCount: integer('excluded_count').default(0),
  value: real('value').notNull(), // Calculated indicator value
  confidenceInterval: text('confidence_interval'), // JSON - {lower, upper}

  // Risk-adjusted values
  riskAdjustedValue: real('risk_adjusted_value'),
  expectedValue: real('expected_value'),
  observedExpectedRatio: real('observed_expected_ratio'),

  // Target comparison
  meetsTarget: integer('meets_target', { mode: 'boolean' }),
  gapToTarget: real('gap_to_target'),
  targetValue: real('target_value'),

  // Benchmark comparison
  benchmarkValue: real('benchmark_value'),
  performanceVsBenchmark: text('performance_vs_benchmark', {
    enum: ['above', 'at', 'below', 'significantly_above', 'significantly_below']
  }),

  // Trend analysis
  previousValue: real('previous_value'),
  previousPeriod: text('previous_period'),
  trend: text('trend', { enum: ['improving', 'stable', 'worsening', 'new'] }),
  trendSignificant: integer('trend_significant', { mode: 'boolean' }),
  changePercent: real('change_percent'),

  // Stratified results
  stratifiedResults: text('stratified_results'), // JSON - by age, sex, risk, etc.
  subgroupAnalysis: text('subgroup_analysis'), // JSON

  // Detail data
  numeratorPatientIds: text('numerator_patient_ids'), // JSON - for drill-down
  denominatorPatientIds: text('denominator_patient_ids'), // JSON
  detailData: text('detail_data'), // JSON - additional breakdown

  // Calculation metadata
  calculatedAt: integer('calculated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  calculationMethod: text('calculation_method'),
  dataSourceVersion: text('data_source_version'),
  dataQualityScore: real('data_quality_score'), // 0-100

  // Validation
  validated: integer('validated', { mode: 'boolean' }).default(false),
  validatedBy: text('validated_by').references(() => employees.id),
  validatedAt: integer('validated_at', { mode: 'timestamp' }),
  validationNotes: text('validation_notes'),

  // Status
  status: text('status', {
    enum: ['draft', 'preliminary', 'final', 'amended', 'retracted']
  }).default('preliminary'),

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// OUTCOME ANALYTICS
// ============================================================================

/**
 * Outcome Definitions
 * Standardized outcome measure definitions
 */
export const outcomeDefinitions = sqliteTable('ph_outcome_definitions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

  // Outcome identification
  outcomeCode: text('outcome_code').notNull(),
  outcomeName: text('outcome_name').notNull(),
  description: text('description'),

  // Outcome type
  outcomeType: text('outcome_type', {
    enum: ['mortality', 'hospitalization', 'readmission', 'complication',
           'infection', 'emergency_visit', 'procedure', 'lab_abnormality',
           'adverse_event', 'quality_of_life', 'functional_status', 'custom']
  }).notNull(),

  // Module association
  associatedModule: text('associated_module', {
    enum: ['dialyse', 'cardiology', 'ophthalmology', 'general']
  }),

  // Definition criteria
  criteria: text('criteria').notNull(), // JSON - how to identify the outcome
  icd10Codes: text('icd10_codes'), // JSON - related diagnosis codes
  cptCodes: text('cpt_codes'), // JSON - related procedure codes
  labCriteria: text('lab_criteria'), // JSON - lab value thresholds

  // Time frame
  lookbackDays: integer('lookback_days'), // Days to look back for baseline
  followUpDays: integer('follow_up_days'), // Days to track for outcome

  // Severity levels
  hasSeverityLevels: integer('has_severity_levels', { mode: 'boolean' }).default(false),
  severityLevels: text('severity_levels'), // JSON - defined severity grades

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Outcome Analytics
 * Aggregated outcome analysis results
 */
export const outcomeAnalytics = sqliteTable('ph_outcome_analytics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  outcomeDefinitionId: text('outcome_definition_id').notNull().references(() => outcomeDefinitions.id),

  // Analysis type
  analysisType: text('analysis_type', {
    enum: ['incidence', 'prevalence', 'rate', 'survival', 'time_to_event', 'comparison']
  }).notNull(),

  // Analysis scope
  cohortId: text('cohort_id').references(() => populationCohorts.id),
  associatedModule: text('associated_module', {
    enum: ['dialyse', 'cardiology', 'ophthalmology', 'all']
  }),

  // Analysis period
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
  periodLabel: text('period_label'), // '2024', '2024-Q1'

  // Population
  totalPatients: integer('total_patients').notNull(),
  patientsAtRisk: integer('patients_at_risk'),
  personYears: real('person_years'),

  // Results
  outcomeCount: integer('outcome_count').notNull(),
  outcomeRate: real('outcome_rate'), // Per 100 or per 1000
  outcomeRateDenominator: integer('outcome_rate_denominator'), // 100, 1000
  incidenceRate: real('incidence_rate'),
  prevalence: real('prevalence'),

  // Confidence intervals
  ciLower: real('ci_lower'),
  ciUpper: real('ci_upper'),
  standardError: real('standard_error'),

  // Comparison with benchmark
  benchmarkRate: real('benchmark_rate'),
  benchmarkSource: text('benchmark_source'),
  rateRatio: real('rate_ratio'),
  rateRatioSignificant: integer('rate_ratio_significant', { mode: 'boolean' }),

  // Risk adjustment
  riskAdjustedRate: real('risk_adjusted_rate'),
  expectedEvents: real('expected_events'),
  standardizedRatio: real('standardized_ratio'), // SMR, SIR, etc.

  // Stratified results
  stratifiedResults: text('stratified_results'), // JSON - by age, sex, comorbidity
  bySeverity: text('by_severity'), // JSON - if severity levels exist
  byTimeframe: text('by_timeframe'), // JSON - monthly breakdown

  // Trend
  previousPeriodRate: real('previous_period_rate'),
  trend: text('trend', { enum: ['improving', 'stable', 'worsening'] }),
  trendPValue: real('trend_p_value'),

  // Survival analysis (if applicable)
  medianSurvivalDays: integer('median_survival_days'),
  survivalAt30Days: real('survival_at_30_days'),
  survivalAt90Days: real('survival_at_90_days'),
  survivalAt1Year: real('survival_at_1_year'),
  kaplanMeierData: text('kaplan_meier_data'), // JSON

  // Calculation metadata
  calculatedAt: integer('calculated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  methodology: text('methodology'),
  limitations: text('limitations'),

  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Patient Outcomes
 * Individual patient outcome events
 */
export const patientOutcomes = sqliteTable('ph_patient_outcomes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  outcomeDefinitionId: text('outcome_definition_id').notNull().references(() => outcomeDefinitions.id),

  // Outcome details
  outcomeDate: integer('outcome_date', { mode: 'timestamp' }).notNull(),
  detectedDate: integer('detected_date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  detectionMethod: text('detection_method', {
    enum: ['automated', 'manual_review', 'claim_data', 'registry', 'patient_reported']
  }),

  // Severity
  severity: text('severity', { enum: ['mild', 'moderate', 'severe', 'fatal'] }),
  severityScore: integer('severity_score'),

  // Related clinical data
  diagnosisCodes: text('diagnosis_codes'), // JSON - ICD-10 codes
  procedureCodes: text('procedure_codes'), // JSON - CPT codes
  relatedEncounterId: text('related_encounter_id'),
  relatedHospitalization: integer('related_hospitalization', { mode: 'boolean' }),
  lengthOfStay: integer('length_of_stay'), // Days if hospitalized

  // Context
  precedingRiskScore: real('preceding_risk_score'),
  riskScorePercentile: integer('risk_score_percentile'),
  wasHighRisk: integer('was_high_risk', { mode: 'boolean' }),
  interventionsReceived: text('interventions_received'), // JSON

  // Module-specific data
  moduleData: text('module_data'), // JSON - dialyse/cardio/ophthalmo specific

  // Verification
  verified: integer('verified', { mode: 'boolean' }).default(false),
  verifiedBy: text('verified_by').references(() => employees.id),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }),
  verificationNotes: text('verification_notes'),

  // Status
  status: text('status', {
    enum: ['suspected', 'confirmed', 'ruled_out', 'pending_review']
  }).default('confirmed'),

  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// IQSS REPORTS (French Healthcare Quality Reporting)
// ============================================================================

/**
 * IQSS Report Submissions
 * Annual IQSS report submissions to French health authorities
 */
export const iqssReports = sqliteTable('ph_iqss_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Report identification
  reportYear: integer('report_year').notNull(),
  reportType: text('report_type', {
    enum: ['dialysis', 'cardiology', 'ophthalmology', 'general']
  }).notNull(),
  reportVersion: integer('report_version').default(1),

  // Submission details
  submissionDeadline: integer('submission_deadline', { mode: 'timestamp' }),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  submittedBy: text('submitted_by').references(() => users.id),
  confirmationNumber: text('confirmation_number'),

  // Report content
  indicatorResults: text('indicator_results'), // JSON - all indicator values
  narrativeComments: text('narrative_comments'),
  improvementActions: text('improvement_actions'), // JSON

  // Quality summary
  overallScore: real('overall_score'),
  indicatorsMetTarget: integer('indicators_met_target'),
  indicatorsMissedTarget: integer('indicators_missed_target'),
  indicatorsImproved: integer('indicators_improved'),
  indicatorsDeclined: integer('indicators_declined'),

  // Comparison
  previousYearScore: real('previous_year_score'),
  nationalBenchmark: real('national_benchmark'),
  regionalBenchmark: real('regional_benchmark'),

  // Report file
  reportUrl: text('report_url'),
  supportingDocuments: text('supporting_documents'), // JSON - URLs

  // Status
  status: text('status', {
    enum: ['draft', 'under_review', 'approved', 'submitted', 'acknowledged', 'revision_requested']
  }).default('draft'),

  // Internal review
  reviewedBy: text('reviewed_by').references(() => employees.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  approvedBy: text('approved_by').references(() => employees.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),

  // Authority feedback
  authorityFeedback: text('authority_feedback'),
  feedbackReceivedAt: integer('feedback_received_at', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// CARE GAPS
// ============================================================================

/**
 * Care Gap Definitions
 * Definitions of care gaps to monitor
 */
export const careGapDefinitions = sqliteTable('ph_care_gap_definitions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

  // Gap identification
  gapCode: text('gap_code').notNull(),
  gapName: text('gap_name').notNull(),
  description: text('description'),

  // Gap type
  gapType: text('gap_type', {
    enum: ['screening', 'vaccination', 'medication', 'lab_monitoring',
           'follow_up', 'referral', 'procedure', 'education', 'custom']
  }).notNull(),

  // Eligibility criteria
  eligibilityCriteria: text('eligibility_criteria').notNull(), // JSON
  excludedConditions: text('excluded_conditions'), // JSON

  // Compliance criteria
  complianceCriteria: text('compliance_criteria').notNull(), // JSON - what closes the gap
  frequencyDays: integer('frequency_days'), // How often it should occur
  lookbackDays: integer('lookback_days'), // Days to look back for compliance

  // Priority
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  clinicalImpact: text('clinical_impact'),

  // Module
  associatedModule: text('associated_module', {
    enum: ['dialyse', 'cardiology', 'ophthalmology', 'general']
  }),

  // Recommended action
  recommendedAction: text('recommended_action'),
  orderSuggestion: text('order_suggestion'), // JSON - suggested order/referral

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Patient Care Gaps
 * Individual patient care gap instances
 */
export const patientCareGaps = sqliteTable('ph_patient_care_gaps', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  gapDefinitionId: text('gap_definition_id').notNull().references(() => careGapDefinitions.id),

  // Gap status
  identifiedAt: integer('identified_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  status: text('status', {
    enum: ['open', 'in_progress', 'scheduled', 'closed', 'excluded', 'declined']
  }).default('open'),

  // Gap details
  lastComplianceDate: integer('last_compliance_date', { mode: 'timestamp' }),
  daysSinceCompliance: integer('days_since_compliance'),
  overdueDays: integer('overdue_days'),

  // Priority (may override definition)
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }),
  priorityReason: text('priority_reason'),

  // Outreach attempts
  outreachAttempts: integer('outreach_attempts').default(0),
  lastOutreachDate: integer('last_outreach_date', { mode: 'timestamp' }),
  lastOutreachMethod: text('last_outreach_method'),
  nextOutreachDate: integer('next_outreach_date', { mode: 'timestamp' }),

  // Closure
  closedAt: integer('closed_at', { mode: 'timestamp' }),
  closedBy: text('closed_by').references(() => users.id),
  closureReason: text('closure_reason', {
    enum: ['completed', 'scheduled', 'not_applicable', 'patient_declined', 'provider_excluded', 'expired']
  }),
  closureEncounterId: text('closure_encounter_id'),
  closureNotes: text('closure_notes'),

  // Assigned care team
  assignedTo: text('assigned_to').references(() => employees.id),

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// DASHBOARDS & ANALYTICS VIEWS
// ============================================================================

/**
 * Analytics Dashboards
 * Saved dashboard configurations
 */
export const analyticsDashboards = sqliteTable('ph_analytics_dashboards', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Dashboard identification
  dashboardCode: text('dashboard_code').notNull(),
  dashboardName: text('dashboard_name').notNull(),
  description: text('description'),

  // Dashboard type
  dashboardType: text('dashboard_type', {
    enum: ['executive', 'clinical', 'quality', 'population', 'operational', 'custom']
  }).notNull(),

  // Module
  associatedModule: text('associated_module', {
    enum: ['dialyse', 'cardiology', 'ophthalmology', 'general', 'all']
  }),

  // Dashboard layout
  layout: text('layout').notNull(), // JSON - widget positions and sizes
  widgets: text('widgets').notNull(), // JSON - widget configurations
  filters: text('filters'), // JSON - default filters

  // Refresh settings
  autoRefresh: integer('auto_refresh', { mode: 'boolean' }).default(false),
  refreshIntervalMinutes: integer('refresh_interval_minutes'),
  lastRefresh: integer('last_refresh', { mode: 'timestamp' }),

  // Sharing
  isShared: integer('is_shared', { mode: 'boolean' }).default(false),
  sharedWith: text('shared_with'), // JSON - user/role IDs

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Scheduled Reports
 * Automated report generation and distribution
 */
export const scheduledReports = sqliteTable('ph_scheduled_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Report identification
  reportName: text('report_name').notNull(),
  description: text('description'),

  // Report type
  reportType: text('report_type', {
    enum: ['quality_summary', 'risk_report', 'cohort_report', 'outcome_report',
           'care_gap_report', 'iqss_preview', 'custom']
  }).notNull(),

  // Content configuration
  configuration: text('configuration').notNull(), // JSON - report parameters
  cohortId: text('cohort_id').references(() => populationCohorts.id),
  indicatorIds: text('indicator_ids'), // JSON - selected indicators

  // Schedule
  frequency: text('frequency', {
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'on_demand']
  }).notNull(),
  scheduleCron: text('schedule_cron'), // Cron expression
  nextRunAt: integer('next_run_at', { mode: 'timestamp' }),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),

  // Distribution
  recipients: text('recipients').notNull(), // JSON - email addresses
  deliveryMethod: text('delivery_method', { enum: ['email', 'sftp', 'api', 'dashboard'] }),
  format: text('format', { enum: ['pdf', 'excel', 'csv', 'html'] }),

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastRunStatus: text('last_run_status', { enum: ['success', 'failed', 'partial'] }),
  lastRunError: text('last_run_error'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
