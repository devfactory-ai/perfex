-- Antimicrobial Stewardship Module Migration
-- Comprehensive antibiotic stewardship program management
-- Supports protocol management, surveillance, audits, and resistance monitoring

-- Antimicrobial Protocols
CREATE TABLE IF NOT EXISTS antimicrobial_protocols (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  indication TEXT NOT NULL,
  infection_type TEXT NOT NULL CHECK (infection_type IN ('respiratory_cap', 'respiratory_hap', 'respiratory_vap', 'urinary', 'skin_soft_tissue', 'intra_abdominal', 'bloodstream', 'bone_joint', 'cns', 'endocarditis', 'surgical_prophylaxis', 'febrile_neutropenia', 'sepsis', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'sepsis')),
  setting TEXT NOT NULL CHECK (setting IN ('community', 'hospital', 'icu', 'surgical_prophylaxis')),
  patient_population TEXT NOT NULL CHECK (patient_population IN ('adult', 'pediatric', 'neonatal', 'geriatric', 'immunocompromised')),
  empiric_therapy TEXT, -- JSON array of therapy lines
  targeted_therapy TEXT, -- JSON array
  duration_standard TEXT,
  duration_short_course TEXT,
  duration_prolonged TEXT,
  duration_criteria TEXT, -- JSON array
  de_escalation_criteria TEXT, -- JSON array
  switch_to_oral_criteria TEXT, -- JSON array
  monitoring_requirements TEXT, -- JSON array
  contraindications TEXT, -- JSON array
  special_considerations TEXT, -- JSON array
  references TEXT, -- JSON array
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'archived')),
  approved_by TEXT,
  approved_at TEXT,
  effective_date TEXT,
  review_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_protocols_code ON antimicrobial_protocols(code);
CREATE INDEX idx_protocols_infection ON antimicrobial_protocols(infection_type);
CREATE INDEX idx_protocols_status ON antimicrobial_protocols(status);
CREATE INDEX idx_protocols_review ON antimicrobial_protocols(review_date);

-- Antibiotic Prescriptions
CREATE TABLE IF NOT EXISTS antibiotic_prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  encounter_id TEXT NOT NULL,
  prescriber_id TEXT NOT NULL,
  antibiotics TEXT NOT NULL, -- JSON array
  indication TEXT NOT NULL,
  infection_site TEXT,
  clinical_syndrome TEXT,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'sepsis')),
  prescription_type TEXT NOT NULL CHECK (prescription_type IN ('empiric', 'targeted', 'prophylactic')),
  protocol_id TEXT,
  protocol_compliant INTEGER,
  deviation_reason TEXT,
  start_date TEXT NOT NULL,
  planned_duration INTEGER NOT NULL, -- days
  actual_end_date TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued', 'switched')),
  switched_to_id TEXT,
  review_required INTEGER NOT NULL DEFAULT 0,
  review_due_date TEXT,
  culture_result_id TEXT,
  susceptibility_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (protocol_id) REFERENCES antimicrobial_protocols(id) ON DELETE SET NULL
);

CREATE INDEX idx_prescriptions_patient ON antibiotic_prescriptions(patient_id);
CREATE INDEX idx_prescriptions_encounter ON antibiotic_prescriptions(encounter_id);
CREATE INDEX idx_prescriptions_status ON antibiotic_prescriptions(status);
CREATE INDEX idx_prescriptions_review_due ON antibiotic_prescriptions(review_due_date);

-- Prescription Reviews
CREATE TABLE IF NOT EXISTS prescription_reviews (
  id TEXT PRIMARY KEY,
  prescription_id TEXT NOT NULL,
  review_date TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('48h', '72h', 'culture_result', 'stewardship_audit', 'duration', 'ad_hoc')),
  recommendation TEXT NOT NULL CHECK (recommendation IN ('continue', 'de_escalate', 'escalate', 'switch_to_oral', 'stop', 'extend', 'shorten', 'change_dose', 'add_antibiotic', 'remove_antibiotic', 'id_consult')),
  rationale TEXT NOT NULL,
  accepted INTEGER,
  accepted_by TEXT,
  accepted_at TEXT,
  outcome TEXT,
  FOREIGN KEY (prescription_id) REFERENCES antibiotic_prescriptions(id) ON DELETE CASCADE
);

CREATE INDEX idx_reviews_prescription ON prescription_reviews(prescription_id);
CREATE INDEX idx_reviews_date ON prescription_reviews(review_date);

-- Restricted Antibiotics
CREATE TABLE IF NOT EXISTS restricted_antibiotics (
  id TEXT PRIMARY KEY,
  drug_name TEXT NOT NULL UNIQUE,
  atc_code TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('access', 'watch', 'reserve')), -- WHO AWaRe
  restriction_level TEXT NOT NULL CHECK (restriction_level IN ('unrestricted', 'restricted', 'highly_restricted')),
  approval_required INTEGER NOT NULL DEFAULT 0,
  approvers TEXT, -- JSON array
  approved_indications TEXT, -- JSON array
  max_duration_without_reapproval INTEGER, -- days
  special_requirements TEXT, -- JSON array
  alternatives_available TEXT, -- JSON array
  cost REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_restricted_drug ON restricted_antibiotics(drug_name);
CREATE INDEX idx_restricted_category ON restricted_antibiotics(category);
CREATE INDEX idx_restricted_level ON restricted_antibiotics(restriction_level);

-- Antibiotic Approvals
CREATE TABLE IF NOT EXISTS antibiotic_approvals (
  id TEXT PRIMARY KEY,
  prescription_id TEXT NOT NULL,
  antibiotic_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  indication TEXT NOT NULL,
  justification TEXT NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_notes TEXT,
  conditions TEXT, -- JSON array
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (prescription_id) REFERENCES antibiotic_prescriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (antibiotic_id) REFERENCES restricted_antibiotics(id) ON DELETE CASCADE
);

CREATE INDEX idx_approvals_prescription ON antibiotic_approvals(prescription_id);
CREATE INDEX idx_approvals_status ON antibiotic_approvals(status);

-- Resistance Data
CREATE TABLE IF NOT EXISTS resistance_data (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  pathogen TEXT NOT NULL,
  specimen_type TEXT,
  location TEXT,
  antibiotic_susceptibilities TEXT, -- JSON array
  sample_size INTEGER NOT NULL,
  mdro_count INTEGER NOT NULL DEFAULT 0,
  mdro_rate REAL NOT NULL DEFAULT 0,
  trend TEXT NOT NULL CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_resistance_facility ON resistance_data(facility_id);
CREATE INDEX idx_resistance_pathogen ON resistance_data(pathogen);
CREATE INDEX idx_resistance_period ON resistance_data(period_start, period_end);

-- Antibiograms
CREATE TABLE IF NOT EXISTS antibiograms (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER,
  type TEXT NOT NULL CHECK (type IN ('cumulative', 'unit_specific', 'specimen_specific')),
  unit TEXT,
  specimen_type TEXT,
  organisms TEXT, -- JSON array
  generated_at TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  published_at TEXT,
  document_url TEXT
);

CREATE INDEX idx_antibiograms_facility ON antibiograms(facility_id);
CREATE INDEX idx_antibiograms_year ON antibiograms(year);
CREATE INDEX idx_antibiograms_type ON antibiograms(type);

-- Consumption Data
CREATE TABLE IF NOT EXISTS consumption_data (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  unit TEXT,
  antibiotic TEXT NOT NULL,
  atc_code TEXT NOT NULL,
  quantity REAL NOT NULL,
  ddd REAL NOT NULL, -- Defined Daily Doses
  ddd_per_1000_patient_days REAL NOT NULL,
  ddd_per_1000_admissions REAL,
  trend TEXT NOT NULL CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  benchmark REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_consumption_facility ON consumption_data(facility_id);
CREATE INDEX idx_consumption_antibiotic ON consumption_data(antibiotic);
CREATE INDEX idx_consumption_period ON consumption_data(period_start, period_end);

-- Stewardship Audits
CREATE TABLE IF NOT EXISTS stewardship_audits (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  audit_date TEXT NOT NULL,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('prospective', 'retrospective', 'point_prevalence')),
  auditor_id TEXT NOT NULL,
  scope TEXT, -- JSON object
  prescriptions_reviewed INTEGER NOT NULL DEFAULT 0,
  findings TEXT, -- JSON array
  summary TEXT, -- JSON object
  recommendations TEXT, -- JSON array
  action_plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'reviewed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audits_facility ON stewardship_audits(facility_id);
CREATE INDEX idx_audits_date ON stewardship_audits(audit_date);
CREATE INDEX idx_audits_status ON stewardship_audits(status);

-- Stewardship Action Plans
CREATE TABLE IF NOT EXISTS stewardship_action_plans (
  id TEXT PRIMARY KEY,
  audit_id TEXT,
  title TEXT NOT NULL,
  objectives TEXT, -- JSON array
  actions TEXT, -- JSON array
  metrics TEXT, -- JSON array
  start_date TEXT NOT NULL,
  target_end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold')),
  responsible_person TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (audit_id) REFERENCES stewardship_audits(id) ON DELETE SET NULL
);

CREATE INDEX idx_action_plans_audit ON stewardship_action_plans(audit_id);
CREATE INDEX idx_action_plans_status ON stewardship_action_plans(status);

-- Stewardship Actions
CREATE TABLE IF NOT EXISTS stewardship_actions (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('education', 'protocol', 'technology', 'restriction', 'feedback', 'other')),
  responsible TEXT NOT NULL,
  deadline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_date TEXT,
  outcome TEXT,
  FOREIGN KEY (plan_id) REFERENCES stewardship_action_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_stewardship_actions_plan ON stewardship_actions(plan_id);
CREATE INDEX idx_stewardship_actions_status ON stewardship_actions(status);

-- Stewardship Alerts
CREATE TABLE IF NOT EXISTS stewardship_alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('duration_exceeded', 'restricted_antibiotic', 'culture_result', 'de_escalation_opportunity', 'iv_to_po', 'duplicate_therapy', 'interaction', 'resistance')),
  prescription_id TEXT,
  patient_id TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  resolution TEXT,
  resolved_at TEXT,
  FOREIGN KEY (prescription_id) REFERENCES antibiotic_prescriptions(id) ON DELETE SET NULL
);

CREATE INDEX idx_alerts_patient ON stewardship_alerts(patient_id);
CREATE INDEX idx_alerts_status ON stewardship_alerts(status);
CREATE INDEX idx_alerts_type ON stewardship_alerts(type);
CREATE INDEX idx_alerts_severity ON stewardship_alerts(severity);
