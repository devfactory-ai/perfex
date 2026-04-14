-- HAS Quality Indicators Module Migration (IQSS)
-- French healthcare quality measurement system for HAS certification
-- Implements IQSS indicators, quality campaigns, and certification preparation

-- Quality Indicators
CREATE TABLE IF NOT EXISTS quality_indicators (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('prise_en_charge_initiale', 'dossier_patient', 'prescription_medicamenteuse', 'infections_associees_soins', 'sortie_patient', 'experience_patient', 'securite_patient')),
  domain TEXT NOT NULL CHECK (domain IN ('mco', 'ssr', 'psychiatrie', 'had', 'dialyse', 'chirurgie_ambulatoire', 'transversal')),
  measure_type TEXT NOT NULL CHECK (measure_type IN ('process', 'outcome', 'structure', 'experience')),
  data_source TEXT NOT NULL CHECK (data_source IN ('pmsi', 'dossier_patient', 'enquete', 'sih', 'mixte')),
  frequency TEXT NOT NULL CHECK (frequency IN ('annual', 'biannual', 'quarterly', 'continuous')),
  target_value REAL,
  seuil_alerte REAL NOT NULL,
  seuil_excellence REAL NOT NULL,
  objectif_national REAL,
  quartile_inferieur REAL,
  mediane REAL,
  quartile_superieur REAL,
  numerator_definition TEXT NOT NULL,
  denominator_definition TEXT NOT NULL,
  exclusion_criteria TEXT, -- JSON array
  collection_method TEXT NOT NULL,
  calculation_formula TEXT NOT NULL,
  sample_size INTEGER,
  confidence_interval REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_mandatory INTEGER NOT NULL DEFAULT 0,
  applicable_to TEXT, -- JSON array of facility types
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_qi_code ON quality_indicators(code);
CREATE INDEX idx_qi_category ON quality_indicators(category);
CREATE INDEX idx_qi_domain ON quality_indicators(domain);
CREATE INDEX idx_qi_active ON quality_indicators(is_active);

-- Quality Campaigns
CREATE TABLE IF NOT EXISTS quality_campaigns (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preparation' CHECK (status IN ('preparation', 'collection', 'validation', 'analysis', 'published', 'closed')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  data_collection_start TEXT NOT NULL,
  data_collection_end TEXT NOT NULL,
  validation_deadline TEXT NOT NULL,
  indicators TEXT, -- JSON array of indicator IDs
  participating_units TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_campaigns_year ON quality_campaigns(year);
CREATE INDEX idx_campaigns_status ON quality_campaigns(status);

-- Patient Samples
CREATE TABLE IF NOT EXISTS patient_samples (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  admission_id TEXT,
  sejour TEXT,
  inclusion_date TEXT NOT NULL,
  inclusion_criteria TEXT, -- JSON array
  exclusion_criteria TEXT, -- JSON array
  is_included INTEGER NOT NULL DEFAULT 1,
  sampled_by TEXT NOT NULL,
  sampled_at TEXT NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES quality_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES quality_indicators(id) ON DELETE CASCADE
);

CREATE INDEX idx_samples_campaign ON patient_samples(campaign_id);
CREATE INDEX idx_samples_indicator ON patient_samples(indicator_id);

-- Data Collection Forms
CREATE TABLE IF NOT EXISTS collection_forms (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  indicator_id TEXT NOT NULL,
  patient_sample_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'validated')),
  collector_id TEXT NOT NULL,
  collection_date TEXT,
  fields TEXT, -- JSON array
  compliance INTEGER NOT NULL DEFAULT 0,
  non_compliance_reasons TEXT, -- JSON array
  comments TEXT,
  validated_by TEXT,
  validated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (campaign_id) REFERENCES quality_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (indicator_id) REFERENCES quality_indicators(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_sample_id) REFERENCES patient_samples(id) ON DELETE CASCADE
);

CREATE INDEX idx_forms_campaign ON collection_forms(campaign_id);
CREATE INDEX idx_forms_status ON collection_forms(status);
CREATE INDEX idx_forms_collector ON collection_forms(collector_id);

-- Indicator Measurements
CREATE TABLE IF NOT EXISTS indicator_measurements (
  id TEXT PRIMARY KEY,
  indicator_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  facility_id TEXT NOT NULL,
  unit_id TEXT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  numerator INTEGER NOT NULL,
  denominator INTEGER NOT NULL,
  value REAL NOT NULL,
  confidence_interval_low REAL,
  confidence_interval_high REAL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'submitted', 'approved', 'rejected')),
  comparison_to_national TEXT CHECK (comparison_to_national IN ('above', 'at', 'below')),
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
  data_quality_score REAL,
  notes TEXT,
  validated_by TEXT,
  validated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (indicator_id) REFERENCES quality_indicators(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES quality_campaigns(id) ON DELETE CASCADE
);

CREATE INDEX idx_measurements_indicator ON indicator_measurements(indicator_id);
CREATE INDEX idx_measurements_campaign ON indicator_measurements(campaign_id);
CREATE INDEX idx_measurements_facility ON indicator_measurements(facility_id);
CREATE INDEX idx_measurements_status ON indicator_measurements(status);

-- Certification Processes
CREATE TABLE IF NOT EXISTS certification_processes (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  version TEXT NOT NULL, -- e.g., 'V2024'
  status TEXT NOT NULL DEFAULT 'preparation' CHECK (status IN ('preparation', 'auto_evaluation', 'expert_visit_scheduled', 'expert_visit', 'deliberation', 'certified', 'conditionally_certified', 'not_certified')),
  cycle_start_date TEXT NOT NULL,
  cycle_end_date TEXT NOT NULL,
  expert_visit_date TEXT,
  deliberation_date TEXT,
  decision_date TEXT,
  certification_level TEXT CHECK (certification_level IN ('certifie', 'certifie_mentions', 'certifie_recommandations', 'sursis', 'non_certifie')),
  validity_period INTEGER, -- months
  conditions TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_cert_processes_facility ON certification_processes(facility_id);
CREATE INDEX idx_cert_processes_status ON certification_processes(status);

-- Certification Recommendations
CREATE TABLE IF NOT EXISTS certification_recommendations (
  id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  criterion_code TEXT NOT NULL,
  criterion_label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('point_fort', 'axe_amelioration', 'ecart', 'ecart_majeur')),
  description TEXT NOT NULL,
  action_required TEXT,
  deadline TEXT,
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'action_plan_submitted', 'in_progress', 'resolved', 'verified')),
  evidence TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (process_id) REFERENCES certification_processes(id) ON DELETE CASCADE
);

CREATE INDEX idx_recommendations_process ON certification_recommendations(process_id);
CREATE INDEX idx_recommendations_type ON certification_recommendations(type);
CREATE INDEX idx_recommendations_status ON certification_recommendations(status);

-- Self Assessments
CREATE TABLE IF NOT EXISTS self_assessments (
  id TEXT PRIMARY KEY,
  process_id TEXT NOT NULL,
  criterion_code TEXT NOT NULL,
  chapter TEXT NOT NULL,
  criterion_label TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('exigence_fondamentale', 'standard', 'avance')),
  self_rating TEXT NOT NULL CHECK (self_rating IN ('conforme', 'partiellement_conforme', 'non_conforme', 'non_applicable')),
  evidence TEXT, -- JSON array
  gaps TEXT, -- JSON array
  action_plan TEXT,
  responsible_person TEXT,
  target_date TEXT,
  assessed_by TEXT NOT NULL,
  assessed_at TEXT NOT NULL,
  validated_by TEXT,
  validated_at TEXT,
  FOREIGN KEY (process_id) REFERENCES certification_processes(id) ON DELETE CASCADE
);

CREATE INDEX idx_self_assessments_process ON self_assessments(process_id);
CREATE INDEX idx_self_assessments_chapter ON self_assessments(chapter);
CREATE INDEX idx_self_assessments_rating ON self_assessments(self_rating);

-- Quality Action Plans
CREATE TABLE IF NOT EXISTS quality_action_plans (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('iqss', 'certification', 'incident', 'audit', 'patient_feedback')),
  source_reference TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'planned', 'in_progress', 'completed', 'verified', 'closed')),
  description TEXT NOT NULL,
  root_cause TEXT,
  actions TEXT, -- JSON array
  responsible_person TEXT NOT NULL,
  start_date TEXT NOT NULL,
  target_date TEXT NOT NULL,
  completed_date TEXT,
  effectiveness TEXT CHECK (effectiveness IN ('effective', 'partially_effective', 'not_effective')),
  verification_method TEXT,
  verified_by TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_qap_facility ON quality_action_plans(facility_id);
CREATE INDEX idx_qap_source ON quality_action_plans(source);
CREATE INDEX idx_qap_status ON quality_action_plans(status);
CREATE INDEX idx_qap_priority ON quality_action_plans(priority);
