-- Identitovigilance Module Migration
-- Patient identity management and verification system
-- Compliant with French INS (Identifiant National de Sante) requirements

-- Patient Identities (extends patients table)
CREATE TABLE IF NOT EXISTS patient_identities (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL UNIQUE,
  local_id TEXT NOT NULL UNIQUE, -- IPP - Identifiant Permanent du Patient
  identity_status TEXT NOT NULL DEFAULT 'provisoire' CHECK (identity_status IN ('provisoire', 'validee', 'qualifiee', 'douteuse', 'fictive', 'anonyme')),
  quality_score INTEGER NOT NULL DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
  merged_from TEXT, -- JSON array of merged patient IDs
  merged_into TEXT, -- If this patient was merged into another
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_patient_identities_patient ON patient_identities(patient_id);
CREATE INDEX idx_patient_identities_local_id ON patient_identities(local_id);
CREATE INDEX idx_patient_identities_status ON patient_identities(identity_status);
CREATE INDEX idx_patient_identities_quality ON patient_identities(quality_score);

-- INS Identities (Identifiant National de Sante)
CREATE TABLE IF NOT EXISTS ins_identities (
  id TEXT PRIMARY KEY,
  patient_identity_id TEXT NOT NULL UNIQUE,
  matricule_ins TEXT NOT NULL UNIQUE, -- 22 characters: NIR/NIA + key
  oid TEXT NOT NULL, -- Object Identifier
  type_ins TEXT NOT NULL CHECK (type_ins IN ('nir', 'nia', 'temporaire')),
  date_recuperation TEXT NOT NULL,
  source_recuperation TEXT NOT NULL CHECK (source_recuperation IN ('teleservice', 'carte_vitale', 'import', 'manuel')),
  statut TEXT NOT NULL DEFAULT 'provisoire' CHECK (statut IN ('qualifie', 'provisoire', 'invalide')),
  date_validation TEXT,
  valide_par TEXT,
  FOREIGN KEY (patient_identity_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_ins_identities_patient ON ins_identities(patient_identity_id);
CREATE INDEX idx_ins_identities_matricule ON ins_identities(matricule_ins);
CREATE INDEX idx_ins_identities_statut ON ins_identities(statut);

-- Patient Traits (INS compliant)
CREATE TABLE IF NOT EXISTS patient_traits (
  id TEXT PRIMARY KEY,
  patient_identity_id TEXT NOT NULL UNIQUE,
  -- Strict traits (INS compliant)
  nom_naissance TEXT NOT NULL,
  prenom_naissance TEXT NOT NULL, -- First given name at birth
  date_naissance TEXT NOT NULL,
  sexe TEXT NOT NULL CHECK (sexe IN ('M', 'F', 'I')),
  -- Lieu de naissance
  lieu_naissance_code TEXT,
  lieu_naissance_libelle TEXT,
  lieu_naissance_pays TEXT,
  -- Extended traits
  nom_usage TEXT,
  prenoms_acte TEXT, -- JSON array of all given names
  prenom_usuel TEXT,
  pays_naissance TEXT,
  FOREIGN KEY (patient_identity_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_patient_traits_identity ON patient_traits(patient_identity_id);
CREATE INDEX idx_patient_traits_nom ON patient_traits(nom_naissance);
CREATE INDEX idx_patient_traits_dob ON patient_traits(date_naissance);

-- Identity Verifications
CREATE TABLE IF NOT EXISTS identity_verifications (
  id TEXT PRIMARY KEY,
  patient_identity_id TEXT NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('document', 'carte_vitale', 'teleservice_ins', 'patient_confirmation', 'family_confirmation', 'cross_reference', 'biometric')),
  verification_date TEXT NOT NULL DEFAULT (datetime('now')),
  verified_by TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('cni', 'passeport', 'titre_sejour', 'permis_conduire', 'carte_vitale', 'livret_famille', 'extrait_naissance', 'autre')),
  document_number TEXT,
  document_expiry_date TEXT,
  document_issuer TEXT,
  result TEXT NOT NULL CHECK (result IN ('success', 'partial', 'failure')),
  discrepancies TEXT, -- JSON array
  notes TEXT,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  FOREIGN KEY (patient_identity_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_identity_verif_patient ON identity_verifications(patient_identity_id);
CREATE INDEX idx_identity_verif_date ON identity_verifications(verification_date);
CREATE INDEX idx_identity_verif_type ON identity_verifications(verification_type);
CREATE INDEX idx_identity_verif_result ON identity_verifications(result);

-- Patient Aliases
CREATE TABLE IF NOT EXISTS patient_aliases (
  id TEXT PRIMARY KEY,
  patient_identity_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('maiden_name', 'married_name', 'pseudonym', 'previous_name', 'spelling_variant')),
  nom TEXT NOT NULL,
  prenom TEXT,
  valid_from TEXT,
  valid_to TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_identity_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_patient_aliases_identity ON patient_aliases(patient_identity_id);
CREATE INDEX idx_patient_aliases_nom ON patient_aliases(nom);

-- Duplicate Cases
CREATE TABLE IF NOT EXISTS duplicate_cases (
  id TEXT PRIMARY KEY,
  primary_patient_id TEXT NOT NULL,
  secondary_patient_id TEXT NOT NULL,
  detection_method TEXT NOT NULL CHECK (detection_method IN ('automatic', 'manual', 'merge_request')),
  detection_date TEXT NOT NULL DEFAULT (datetime('now')),
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'confirmed_duplicate', 'not_duplicate', 'merged', 'dismissed')),
  assigned_to TEXT,
  resolution_decision TEXT CHECK (resolution_decision IN ('merge', 'link', 'no_action')),
  survivor_id TEXT,
  merged_at TEXT,
  merged_by TEXT,
  resolution_rationale TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (primary_patient_id) REFERENCES patient_identities(id) ON DELETE CASCADE,
  FOREIGN KEY (secondary_patient_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_duplicate_cases_primary ON duplicate_cases(primary_patient_id);
CREATE INDEX idx_duplicate_cases_secondary ON duplicate_cases(secondary_patient_id);
CREATE INDEX idx_duplicate_cases_status ON duplicate_cases(status);
CREATE INDEX idx_duplicate_cases_score ON duplicate_cases(match_score);

-- Collision Alerts
CREATE TABLE IF NOT EXISTS collision_alerts (
  id TEXT PRIMARY KEY,
  patient_identity_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('same_room', 'same_appointment', 'identity_mismatch', 'wristband_mismatch', 'photo_mismatch', 'ins_collision')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  context TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
  encounter_id TEXT,
  location TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  resolution TEXT,
  resolved_at TEXT,
  FOREIGN KEY (patient_identity_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_collision_alerts_patient ON collision_alerts(patient_identity_id);
CREATE INDEX idx_collision_alerts_status ON collision_alerts(status);
CREATE INDEX idx_collision_alerts_severity ON collision_alerts(severity);
CREATE INDEX idx_collision_alerts_type ON collision_alerts(type);
CREATE INDEX idx_collision_alerts_created ON collision_alerts(created_at);

-- Identity Wristbands
CREATE TABLE IF NOT EXISTS identity_wristbands (
  id TEXT PRIMARY KEY,
  patient_identity_id TEXT NOT NULL,
  encounter_id TEXT NOT NULL,
  barcode TEXT NOT NULL UNIQUE,
  qr_code TEXT,
  printed_at TEXT NOT NULL DEFAULT (datetime('now')),
  printed_by TEXT NOT NULL,
  print_location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reprinted', 'deactivated')),
  includes_photo INTEGER NOT NULL DEFAULT 0,
  includes_allergies INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  verified_by TEXT,
  FOREIGN KEY (patient_identity_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_wristbands_patient ON identity_wristbands(patient_identity_id);
CREATE INDEX idx_wristbands_encounter ON identity_wristbands(encounter_id);
CREATE INDEX idx_wristbands_barcode ON identity_wristbands(barcode);
CREATE INDEX idx_wristbands_status ON identity_wristbands(status);

-- Identity Checks
CREATE TABLE IF NOT EXISTS identity_checks (
  id TEXT PRIMARY KEY,
  patient_identity_id TEXT NOT NULL,
  encounter_id TEXT,
  check_type TEXT NOT NULL CHECK (check_type IN ('admission', 'procedure', 'medication', 'lab', 'imaging', 'discharge', 'other')),
  checked_by TEXT NOT NULL,
  check_date TEXT NOT NULL DEFAULT (datetime('now')),
  location TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('wristband_scan', 'verbal_confirmation', 'photo_match', 'document_check', 'biometric')),
  traits_verified TEXT, -- JSON array
  result TEXT NOT NULL CHECK (result IN ('confirmed', 'discrepancy', 'unable_to_confirm')),
  discrepancy_details TEXT,
  action TEXT,
  FOREIGN KEY (patient_identity_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_identity_checks_patient ON identity_checks(patient_identity_id);
CREATE INDEX idx_identity_checks_encounter ON identity_checks(encounter_id);
CREATE INDEX idx_identity_checks_date ON identity_checks(check_date);
CREATE INDEX idx_identity_checks_result ON identity_checks(result);

-- INS Teleservice Requests
CREATE TABLE IF NOT EXISTS ins_teleservice_requests (
  id TEXT PRIMARY KEY,
  patient_identity_id TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('verification', 'recherche', 'creation')),
  request_date TEXT NOT NULL DEFAULT (datetime('now')),
  requested_by TEXT NOT NULL,
  traits TEXT, -- JSON object
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'partial_match', 'no_match', 'error')),
  response_matricule_ins TEXT,
  response_oid TEXT,
  response_traits TEXT, -- JSON object
  response_qualite TEXT CHECK (response_qualite IN ('identite_qualifiee', 'identite_provisoire', 'non_trouve')),
  response_date TEXT,
  error_code TEXT,
  error_message TEXT,
  FOREIGN KEY (patient_identity_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_ins_requests_patient ON ins_teleservice_requests(patient_identity_id);
CREATE INDEX idx_ins_requests_status ON ins_teleservice_requests(status);
CREATE INDEX idx_ins_requests_date ON ins_teleservice_requests(request_date);

-- Identity Audits
CREATE TABLE IF NOT EXISTS identity_audits (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  audit_date TEXT NOT NULL DEFAULT (datetime('now')),
  auditor_id TEXT NOT NULL,
  scope TEXT, -- JSON object
  summary TEXT, -- JSON object
  recommendations TEXT, -- JSON array
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_identity_audits_facility ON identity_audits(facility_id);
CREATE INDEX idx_identity_audits_date ON identity_audits(audit_date);
CREATE INDEX idx_identity_audits_status ON identity_audits(status);

-- Identity Audit Findings
CREATE TABLE IF NOT EXISTS identity_audit_findings (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  patient_identity_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('missing_ins', 'unvalidated', 'outdated', 'incomplete', 'duplicate', 'quality')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  recommendation TEXT,
  FOREIGN KEY (audit_id) REFERENCES identity_audits(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_identity_id) REFERENCES patient_identities(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_findings_audit ON identity_audit_findings(audit_id);
CREATE INDEX idx_audit_findings_category ON identity_audit_findings(category);
CREATE INDEX idx_audit_findings_severity ON identity_audit_findings(severity);

-- Identitovigilance Policies
CREATE TABLE IF NOT EXISTS identitovigilance_policies (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  required_traits TEXT, -- JSON array
  mandatory_verification TEXT, -- JSON array
  verification_frequency TEXT, -- JSON object
  photo_required INTEGER NOT NULL DEFAULT 0,
  wristband_required INTEGER NOT NULL DEFAULT 0,
  duplicate_threshold INTEGER NOT NULL DEFAULT 80,
  quality_score_minimum INTEGER NOT NULL DEFAULT 60,
  ins_qualification_required INTEGER NOT NULL DEFAULT 0,
  effective_date TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_policies_facility ON identitovigilance_policies(facility_id);
CREATE INDEX idx_policies_effective ON identitovigilance_policies(effective_date);
