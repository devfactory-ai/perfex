-- Risk Management Module Migration
-- Comprehensive healthcare risk management and safety system
-- Supports risk cartography, FMEA/AMDEC, risk assessment, and mitigation tracking

-- Risk Domains
CREATE TABLE IF NOT EXISTS risk_domains (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description TEXT,
  parent_id TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL CHECK (category IN ('clinical', 'medication', 'infection', 'organizational', 'technical', 'environmental', 'human_factors', 'information', 'legal_regulatory')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES risk_domains(id) ON DELETE SET NULL
);

CREATE INDEX idx_risk_domains_code ON risk_domains(code);
CREATE INDEX idx_risk_domains_category ON risk_domains(category);
CREATE INDEX idx_risk_domains_parent ON risk_domains(parent_id);

-- Risks
CREATE TABLE IF NOT EXISTS risks (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  causes TEXT, -- JSON array
  consequences TEXT, -- JSON array
  affected_processes TEXT, -- JSON array
  affected_populations TEXT, -- JSON array
  inherent_probability INTEGER NOT NULL CHECK (inherent_probability >= 1 AND inherent_probability <= 5),
  inherent_severity INTEGER NOT NULL CHECK (inherent_severity >= 1 AND inherent_severity <= 5),
  inherent_detectability INTEGER CHECK (inherent_detectability >= 1 AND inherent_detectability <= 5),
  inherent_score INTEGER NOT NULL,
  inherent_assessed_by TEXT NOT NULL,
  inherent_assessed_at TEXT NOT NULL,
  residual_probability INTEGER CHECK (residual_probability >= 1 AND residual_probability <= 5),
  residual_severity INTEGER CHECK (residual_severity >= 1 AND residual_severity <= 5),
  residual_detectability INTEGER CHECK (residual_detectability >= 1 AND residual_detectability <= 5),
  residual_score INTEGER,
  residual_assessed_by TEXT,
  residual_assessed_at TEXT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('negligible', 'acceptable', 'moderate', 'significant', 'critical')),
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'assessed', 'treated', 'accepted', 'monitored', 'closed')),
  owner TEXT NOT NULL,
  mitigation_plan TEXT,
  acceptance_criteria TEXT,
  accepted_by TEXT,
  accepted_at TEXT,
  review_date TEXT NOT NULL,
  last_review_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES risk_domains(id) ON DELETE CASCADE
);

CREATE INDEX idx_risks_domain ON risks(domain_id);
CREATE INDEX idx_risks_level ON risks(risk_level);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_owner ON risks(owner);
CREATE INDEX idx_risks_review_date ON risks(review_date);

-- Risk Controls
CREATE TABLE IF NOT EXISTS risk_controls (
  id TEXT PRIMARY KEY,
  risk_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('preventive', 'detective', 'corrective', 'mitigating')),
  category TEXT NOT NULL CHECK (category IN ('administrative', 'engineering', 'ppe', 'training', 'procedure', 'technology')),
  description TEXT NOT NULL,
  effectiveness TEXT NOT NULL DEFAULT 'unknown' CHECK (effectiveness IN ('high', 'medium', 'low', 'unknown')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'implemented', 'verified', 'ineffective')),
  responsible_person TEXT NOT NULL,
  implementation_date TEXT,
  verification_date TEXT,
  next_review_date TEXT NOT NULL,
  evidence TEXT, -- JSON array
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

CREATE INDEX idx_risk_controls_risk ON risk_controls(risk_id);
CREATE INDEX idx_risk_controls_status ON risk_controls(status);
CREATE INDEX idx_risk_controls_review ON risk_controls(next_review_date);

-- Risk Cartographies
CREATE TABLE IF NOT EXISTS risk_cartographies (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'archived')),
  domains TEXT, -- JSON array of domain IDs
  risks TEXT, -- JSON array of risk IDs
  approved_by TEXT,
  approved_at TEXT,
  effective_date TEXT,
  expiration_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_cartographies_facility ON risk_cartographies(facility_id);
CREATE INDEX idx_cartographies_status ON risk_cartographies(status);

-- FMEA Analyses
CREATE TABLE IF NOT EXISTS fmea_analyses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  process_name TEXT NOT NULL,
  process_description TEXT,
  scope TEXT NOT NULL,
  team_members TEXT, -- JSON array
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'analysis', 'action_planning', 'implementation', 'verification', 'completed')),
  summary TEXT, -- JSON object
  created_by TEXT NOT NULL,
  review_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_fmea_status ON fmea_analyses(status);
CREATE INDEX idx_fmea_review ON fmea_analyses(review_date);

-- FMEA Steps
CREATE TABLE IF NOT EXISTS fmea_steps (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  inputs TEXT, -- JSON array
  outputs TEXT, -- JSON array
  responsible_role TEXT NOT NULL,
  FOREIGN KEY (analysis_id) REFERENCES fmea_analyses(id) ON DELETE CASCADE
);

CREATE INDEX idx_fmea_steps_analysis ON fmea_steps(analysis_id);

-- FMEA Failure Modes
CREATE TABLE IF NOT EXISTS fmea_failure_modes (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  description TEXT NOT NULL,
  potential_effects TEXT, -- JSON array
  severity_rating INTEGER NOT NULL CHECK (severity_rating >= 1 AND severity_rating <= 10),
  potential_causes TEXT, -- JSON array
  occurrence_rating INTEGER NOT NULL CHECK (occurrence_rating >= 1 AND occurrence_rating <= 10),
  current_controls TEXT, -- JSON array
  detection_rating INTEGER NOT NULL CHECK (detection_rating >= 1 AND detection_rating <= 10),
  rpn INTEGER NOT NULL,
  rpn_category TEXT NOT NULL CHECK (rpn_category IN ('low', 'medium', 'high', 'critical')),
  revised_severity INTEGER,
  revised_occurrence INTEGER,
  revised_detection INTEGER,
  revised_rpn INTEGER,
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'action_planned', 'in_progress', 'completed', 'verified')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (analysis_id) REFERENCES fmea_analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES fmea_steps(id) ON DELETE CASCADE
);

CREATE INDEX idx_failure_modes_analysis ON fmea_failure_modes(analysis_id);
CREATE INDEX idx_failure_modes_step ON fmea_failure_modes(step_id);
CREATE INDEX idx_failure_modes_rpn ON fmea_failure_modes(rpn);

-- FMEA Actions
CREATE TABLE IF NOT EXISTS fmea_actions (
  id TEXT PRIMARY KEY,
  failure_mode_id TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('reduce_severity', 'reduce_occurrence', 'improve_detection')),
  responsible TEXT NOT NULL,
  target_date TEXT NOT NULL,
  completed_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'verified')),
  effectiveness TEXT CHECK (effectiveness IN ('effective', 'partially_effective', 'not_effective')),
  verified_by TEXT,
  verified_at TEXT,
  notes TEXT,
  FOREIGN KEY (failure_mode_id) REFERENCES fmea_failure_modes(id) ON DELETE CASCADE
);

CREATE INDEX idx_fmea_actions_mode ON fmea_actions(failure_mode_id);
CREATE INDEX idx_fmea_actions_status ON fmea_actions(status);

-- Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('initial', 'periodic', 'triggered', 'project')),
  scope TEXT NOT NULL,
  triggered_by TEXT,
  assessor_id TEXT NOT NULL,
  assessment_date TEXT NOT NULL,
  methodology TEXT NOT NULL CHECK (methodology IN ('qualitative', 'semi_quantitative', 'quantitative', 'fmea')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'approved')),
  risks_identified TEXT, -- JSON array of risk IDs
  recommendations TEXT, -- JSON array
  action_plan_required INTEGER NOT NULL DEFAULT 0,
  next_assessment_date TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_assessments_type ON risk_assessments(type);
CREATE INDEX idx_assessments_status ON risk_assessments(status);
CREATE INDEX idx_assessments_date ON risk_assessments(assessment_date);

-- Assessment Findings
CREATE TABLE IF NOT EXISTS assessment_findings (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('strength', 'weakness', 'opportunity', 'threat', 'gap', 'non_compliance')),
  description TEXT NOT NULL,
  evidence TEXT, -- JSON array
  impacted_risks TEXT, -- JSON array of risk IDs
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  recommendation TEXT,
  FOREIGN KEY (assessment_id) REFERENCES risk_assessments(id) ON DELETE CASCADE
);

CREATE INDEX idx_findings_assessment ON assessment_findings(assessment_id);
CREATE INDEX idx_findings_category ON assessment_findings(category);

-- Risk Treatment Plans
CREATE TABLE IF NOT EXISTS risk_treatment_plans (
  id TEXT PRIMARY KEY,
  risk_id TEXT NOT NULL,
  strategy TEXT NOT NULL CHECK (strategy IN ('avoid', 'mitigate', 'transfer', 'accept')),
  description TEXT NOT NULL,
  budget REAL,
  expected_probability INTEGER,
  expected_severity INTEGER,
  expected_score INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed', 'monitoring')),
  approved_by TEXT,
  approved_at TEXT,
  start_date TEXT,
  target_completion_date TEXT NOT NULL,
  actual_completion_date TEXT,
  effectiveness_review TEXT, -- JSON object
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

CREATE INDEX idx_treatment_plans_risk ON risk_treatment_plans(risk_id);
CREATE INDEX idx_treatment_plans_status ON risk_treatment_plans(status);

-- Treatment Actions
CREATE TABLE IF NOT EXISTS treatment_actions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  description TEXT NOT NULL,
  responsible TEXT NOT NULL,
  deadline TEXT NOT NULL,
  cost REAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')),
  completed_date TEXT,
  evidence TEXT, -- JSON array
  notes TEXT,
  FOREIGN KEY (plan_id) REFERENCES risk_treatment_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_treatment_actions_plan ON treatment_actions(plan_id);
CREATE INDEX idx_treatment_actions_status ON treatment_actions(status);
CREATE INDEX idx_treatment_actions_deadline ON treatment_actions(deadline);

-- Risk Indicators
CREATE TABLE IF NOT EXISTS risk_indicators (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  risk_id TEXT,
  domain_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('leading', 'lagging')),
  measurement_method TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  target REAL NOT NULL,
  warning_threshold REAL NOT NULL,
  critical_threshold REAL NOT NULL,
  unit TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE SET NULL,
  FOREIGN KEY (domain_id) REFERENCES risk_domains(id) ON DELETE SET NULL
);

CREATE INDEX idx_indicators_risk ON risk_indicators(risk_id);
CREATE INDEX idx_indicators_domain ON risk_indicators(domain_id);
CREATE INDEX idx_indicators_active ON risk_indicators(is_active);

-- Indicator Measurements
CREATE TABLE IF NOT EXISTS indicator_measurements (
  id TEXT PRIMARY KEY,
  indicator_id TEXT NOT NULL,
  measurement_date TEXT NOT NULL,
  value REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('normal', 'warning', 'critical')),
  trend TEXT NOT NULL CHECK (trend IN ('improving', 'stable', 'deteriorating')),
  measured_by TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (indicator_id) REFERENCES risk_indicators(id) ON DELETE CASCADE
);

CREATE INDEX idx_measurements_indicator ON indicator_measurements(indicator_id);
CREATE INDEX idx_measurements_date ON indicator_measurements(measurement_date);
CREATE INDEX idx_measurements_status ON indicator_measurements(status);

-- Risk Events
CREATE TABLE IF NOT EXISTS risk_events (
  id TEXT PRIMARY KEY,
  risk_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('near_miss', 'incident', 'accident', 'crisis')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  location TEXT NOT NULL,
  impacted_persons TEXT, -- JSON array
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'catastrophic')),
  root_causes TEXT, -- JSON array
  contributing_factors TEXT, -- JSON array
  immediate_actions TEXT, -- JSON array
  preventive_actions TEXT, -- JSON array
  lessons_learned TEXT, -- JSON array
  reported_by TEXT NOT NULL,
  reported_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'action_taken', 'closed')),
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE SET NULL
);

CREATE INDEX idx_events_risk ON risk_events(risk_id);
CREATE INDEX idx_events_type ON risk_events(event_type);
CREATE INDEX idx_events_status ON risk_events(status);
CREATE INDEX idx_events_occurred ON risk_events(occurred_at);
