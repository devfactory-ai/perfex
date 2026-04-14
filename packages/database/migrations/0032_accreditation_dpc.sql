-- Accreditation & DPC Module Migration
-- Manages healthcare professional accreditation, continuing education, and certification
-- Compliant with French DPC requirements and HAS accreditation standards

-- Healthcare Professionals
CREATE TABLE IF NOT EXISTS healthcare_professionals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  rpps_number TEXT UNIQUE, -- Répertoire Partagé des Professionnels de Santé
  adeli_number TEXT,
  finess TEXT,
  profession TEXT NOT NULL CHECK (profession IN ('medecin', 'pharmacien', 'infirmier', 'sage_femme', 'chirurgien_dentiste', 'masseur_kinesitherapeute', 'biologiste', 'manipulateur_radio', 'aide_soignant', 'cadre_sante', 'autre')),
  specialty TEXT,
  registration_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('active', 'suspended', 'retired', 'pending_verification')),
  dpc_obligation_start TEXT NOT NULL,
  dpc_obligation_end TEXT NOT NULL,
  dpc_required_credits INTEGER NOT NULL DEFAULT 0,
  dpc_acquired_credits INTEGER NOT NULL DEFAULT 0,
  dpc_compliance_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (dpc_compliance_status IN ('compliant', 'in_progress', 'non_compliant', 'exempt')),
  dpc_last_update TEXT NOT NULL DEFAULT (datetime('now')),
  is_accredited INTEGER NOT NULL DEFAULT 0,
  accreditation_type TEXT,
  accreditation_body TEXT,
  accreditation_date TEXT,
  accreditation_expiration TEXT,
  accreditation_reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_professionals_user ON healthcare_professionals(user_id);
CREATE INDEX idx_professionals_rpps ON healthcare_professionals(rpps_number);
CREATE INDEX idx_professionals_profession ON healthcare_professionals(profession);
CREATE INDEX idx_professionals_status ON healthcare_professionals(status);
CREATE INDEX idx_professionals_dpc_status ON healthcare_professionals(dpc_compliance_status);

-- Qualifications
CREATE TABLE IF NOT EXISTS professional_qualifications (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('diplome', 'capacite', 'desc', 'diu', 'du', 'attestation', 'autre')),
  title TEXT NOT NULL,
  institution TEXT NOT NULL,
  obtained_date TEXT NOT NULL,
  expiration_date TEXT,
  document_url TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_by TEXT,
  verified_at TEXT,
  FOREIGN KEY (professional_id) REFERENCES healthcare_professionals(id) ON DELETE CASCADE
);

CREATE INDEX idx_qualifications_professional ON professional_qualifications(professional_id);
CREATE INDEX idx_qualifications_expiration ON professional_qualifications(expiration_date);

-- DPC Programs
CREATE TABLE IF NOT EXISTS dpc_programs (
  id TEXT PRIMARY KEY,
  odpc_id TEXT NOT NULL, -- Organisme DPC ID
  program_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('formation_continue', 'analyse_pratiques', 'gestion_risques', 'programme_integre')),
  orientation TEXT NOT NULL CHECK (orientation IN ('qualite_securite', 'pertinence_soins', 'innovation', 'parcours_patient', 'coordination', 'prevention')),
  target_professions TEXT, -- JSON array
  target_specialties TEXT, -- JSON array
  format TEXT NOT NULL CHECK (format IN ('presentiel', 'e_learning', 'mixte', 'simulation', 'groupe_pairs', 'audit_clinique', 'rcp', 'staff_epp')),
  duration INTEGER NOT NULL, -- hours
  credits INTEGER NOT NULL,
  max_participants INTEGER,
  prerequisites TEXT, -- JSON array
  objectives TEXT, -- JSON array
  evaluation_methods TEXT, -- JSON array
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'active', 'completed', 'archived')),
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  price REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_dpc_programs_number ON dpc_programs(program_number);
CREATE INDEX idx_dpc_programs_category ON dpc_programs(category);
CREATE INDEX idx_dpc_programs_status ON dpc_programs(status);
CREATE INDEX idx_dpc_programs_format ON dpc_programs(format);

-- DPC Sessions
CREATE TABLE IF NOT EXISTS dpc_sessions (
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL,
  session_number TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  location TEXT,
  is_virtual INTEGER NOT NULL DEFAULT 0,
  virtual_platform_url TEXT,
  instructor_ids TEXT, -- JSON array
  max_participants INTEGER NOT NULL,
  registered_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'open', 'full', 'in_progress', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (program_id) REFERENCES dpc_programs(id) ON DELETE CASCADE
);

CREATE INDEX idx_dpc_sessions_program ON dpc_sessions(program_id);
CREATE INDEX idx_dpc_sessions_status ON dpc_sessions(status);
CREATE INDEX idx_dpc_sessions_dates ON dpc_sessions(start_date, end_date);

-- Session Materials
CREATE TABLE IF NOT EXISTS session_materials (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('document', 'video', 'quiz', 'case_study', 'bibliography')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  is_required INTEGER NOT NULL DEFAULT 0,
  order_num INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES dpc_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_materials_session ON session_materials(session_id);

-- DPC Enrollments
CREATE TABLE IF NOT EXISTS dpc_enrollments (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  enrollment_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'withdrawn', 'failed')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'reimbursed', 'not_applicable')),
  payment_method TEXT CHECK (payment_method IN ('personal', 'employer', 'opca', 'dpc_fund')),
  attendance TEXT, -- JSON array
  evaluations TEXT, -- JSON array
  credits_earned INTEGER,
  certificate_issued INTEGER NOT NULL DEFAULT 0,
  certificate_url TEXT,
  completed_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (professional_id) REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES dpc_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES dpc_programs(id) ON DELETE CASCADE
);

CREATE INDEX idx_enrollments_professional ON dpc_enrollments(professional_id);
CREATE INDEX idx_enrollments_session ON dpc_enrollments(session_id);
CREATE INDEX idx_enrollments_status ON dpc_enrollments(status);

-- DPC Certificates
CREATE TABLE IF NOT EXISTS dpc_certificates (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL UNIQUE,
  professional_id TEXT NOT NULL,
  program_number TEXT NOT NULL,
  program_title TEXT NOT NULL,
  session_start TEXT NOT NULL,
  session_end TEXT NOT NULL,
  credits INTEGER NOT NULL,
  issue_date TEXT NOT NULL,
  certificate_number TEXT NOT NULL UNIQUE,
  signed_by TEXT NOT NULL,
  document_url TEXT NOT NULL,
  sent_to_andpc INTEGER NOT NULL DEFAULT 0,
  sent_date TEXT,
  FOREIGN KEY (enrollment_id) REFERENCES dpc_enrollments(id) ON DELETE CASCADE,
  FOREIGN KEY (professional_id) REFERENCES healthcare_professionals(id) ON DELETE CASCADE
);

CREATE INDEX idx_certificates_professional ON dpc_certificates(professional_id);
CREATE INDEX idx_certificates_number ON dpc_certificates(certificate_number);

-- EPP Actions
CREATE TABLE IF NOT EXISTS epp_actions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('audit_clinique', 'revue_morbi_mortalite', 'indicateurs_qualite', 'chemin_clinique', 'groupe_pairs', 'staff_epp')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'suspended')),
  responsible_id TEXT NOT NULL,
  participants TEXT, -- JSON array
  start_date TEXT NOT NULL,
  end_date TEXT,
  objectives TEXT, -- JSON array
  methodology TEXT,
  indicators TEXT, -- JSON array of {name, baselineValue, targetValue, currentValue, unit, measurementDate}
  results TEXT,
  improvements TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_epp_actions_type ON epp_actions(type);
CREATE INDEX idx_epp_actions_status ON epp_actions(status);
CREATE INDEX idx_epp_actions_responsible ON epp_actions(responsible_id);

-- Accreditation Programs
CREATE TABLE IF NOT EXISTS accreditation_programs (
  id TEXT PRIMARY KEY,
  specialty TEXT NOT NULL,
  accreditation_body TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  requirements TEXT, -- JSON array
  validity_period INTEGER NOT NULL, -- years
  renewal_criteria TEXT, -- JSON array
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_accred_programs_specialty ON accreditation_programs(specialty);
CREATE INDEX idx_accred_programs_status ON accreditation_programs(status);

-- Professional Accreditations
CREATE TABLE IF NOT EXISTS professional_accreditations (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  application_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'application_submitted' CHECK (status IN ('application_submitted', 'under_review', 'accredited', 'conditionally_accredited', 'denied', 'expired', 'withdrawn')),
  accreditation_date TEXT,
  expiration_date TEXT,
  reference_number TEXT UNIQUE,
  conditions TEXT, -- JSON array
  completed_requirements TEXT, -- JSON array
  renewal_due TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (professional_id) REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES accreditation_programs(id) ON DELETE CASCADE
);

CREATE INDEX idx_prof_accreditations_professional ON professional_accreditations(professional_id);
CREATE INDEX idx_prof_accreditations_status ON professional_accreditations(status);
CREATE INDEX idx_prof_accreditations_expiration ON professional_accreditations(expiration_date);

-- Risk Events (EPR)
CREATE TABLE IF NOT EXISTS professional_risk_events (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('epr', 'ias', 'evenement_indesirable', 'autre')),
  description TEXT NOT NULL,
  occurred_date TEXT NOT NULL,
  reported_date TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  root_cause_analysis TEXT,
  corrective_actions TEXT, -- JSON array
  lessons_learned TEXT, -- JSON array
  shared_with_peers INTEGER NOT NULL DEFAULT 0,
  accreditation_relevant INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'analyzed', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (professional_id) REFERENCES healthcare_professionals(id) ON DELETE CASCADE
);

CREATE INDEX idx_risk_events_professional ON professional_risk_events(professional_id);
CREATE INDEX idx_risk_events_type ON professional_risk_events(event_type);
CREATE INDEX idx_risk_events_status ON professional_risk_events(status);

-- Training Needs
CREATE TABLE IF NOT EXISTS training_needs (
  id TEXT PRIMARY KEY,
  professional_id TEXT NOT NULL,
  assessment_date TEXT NOT NULL,
  needs TEXT, -- JSON array
  priority TEXT, -- JSON array
  recommended_programs TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (professional_id) REFERENCES healthcare_professionals(id) ON DELETE CASCADE
);

CREATE INDEX idx_training_needs_professional ON training_needs(professional_id);
CREATE INDEX idx_training_needs_date ON training_needs(assessment_date);
