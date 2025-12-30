-- Healthcare Base Tables (shared across all medical modules)
-- Migration: 0019_healthcare_modules.sql

-- Healthcare Patients (shared patient table for all medical modules)
CREATE TABLE IF NOT EXISTS healthcare_patients (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'male',
  national_id TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  blood_type TEXT,
  allergies TEXT,
  medical_history TEXT,
  family_history TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Healthcare Consultations (generic consultations)
CREATE TABLE IF NOT EXISTS healthcare_consultations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module TEXT NOT NULL, -- 'cardiology', 'ophthalmology', etc.
  consultation_date TEXT NOT NULL,
  consultation_time TEXT,
  consultation_type TEXT,
  doctor_id TEXT,
  doctor_name TEXT,
  chief_complaint TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  follow_up_date TEXT,
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Healthcare Medications
CREATE TABLE IF NOT EXISTS healthcare_medications (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  route TEXT,
  start_date TEXT,
  end_date TEXT,
  prescribing_doctor TEXT,
  indication TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Healthcare Alerts
CREATE TABLE IF NOT EXISTS healthcare_alerts (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TEXT,
  acknowledged_by TEXT,
  resolved_at TEXT,
  resolved_by TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CARDIOLOGY SPECIFIC TABLES
-- =====================================================

-- Cardiology Patient Extensions
CREATE TABLE IF NOT EXISTS cardiology_patients (
  id TEXT PRIMARY KEY,
  healthcare_patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cardiac_risk_level TEXT DEFAULT 'low',
  has_pacemaker INTEGER DEFAULT 0,
  has_stent INTEGER DEFAULT 0,
  has_bypass INTEGER DEFAULT 0,
  ejection_fraction REAL,
  last_ecg_date TEXT,
  last_echo_date TEXT,
  nyha_class TEXT,
  smoking_status TEXT,
  diabetes_status TEXT,
  hypertension_status TEXT,
  dyslipidemia_status TEXT,
  cardiac_history TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ECG Recordings
CREATE TABLE IF NOT EXISTS cardiology_ecg (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recording_date TEXT NOT NULL,
  recording_time TEXT,
  heart_rate INTEGER,
  pr_interval INTEGER,
  qrs_duration INTEGER,
  qt_interval INTEGER,
  qtc_interval INTEGER,
  rhythm TEXT,
  axis TEXT,
  interpretation TEXT NOT NULL DEFAULT 'normal',
  findings TEXT,
  technician TEXT,
  reviewing_doctor TEXT,
  file_path TEXT,
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Pacemakers
CREATE TABLE IF NOT EXISTS cardiology_pacemakers (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  implant_date TEXT NOT NULL,
  implanting_doctor TEXT,
  implanting_hospital TEXT,
  device_type TEXT, -- 'single_chamber', 'dual_chamber', 'biventricular', 'icd'
  leads_count INTEGER DEFAULT 1,
  battery_status TEXT DEFAULT 'good',
  battery_voltage REAL,
  estimated_longevity TEXT,
  last_interrogation_date TEXT,
  next_interrogation_date TEXT,
  pacing_mode TEXT,
  lower_rate INTEGER,
  upper_rate INTEGER,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Pacemaker Interrogations
CREATE TABLE IF NOT EXISTS cardiology_pacemaker_interrogations (
  id TEXT PRIMARY KEY,
  pacemaker_id TEXT NOT NULL REFERENCES cardiology_pacemakers(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  interrogation_date TEXT NOT NULL,
  technician TEXT,
  doctor TEXT,
  battery_voltage REAL,
  battery_impedance REAL,
  lead_impedance_atrial REAL,
  lead_impedance_ventricular REAL,
  sensing_atrial REAL,
  sensing_ventricular REAL,
  threshold_atrial REAL,
  threshold_ventricular REAL,
  percent_paced_atrial REAL,
  percent_paced_ventricular REAL,
  episodes_af INTEGER DEFAULT 0,
  episodes_vt INTEGER DEFAULT 0,
  episodes_vf INTEGER DEFAULT 0,
  findings TEXT,
  adjustments_made TEXT,
  next_follow_up TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Coronary Stents
CREATE TABLE IF NOT EXISTS cardiology_stents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  implant_date TEXT NOT NULL,
  implanting_doctor TEXT,
  implanting_hospital TEXT,
  stent_type TEXT NOT NULL, -- 'DES', 'BMS', 'BVS'
  manufacturer TEXT,
  model TEXT,
  diameter REAL,
  length REAL,
  location TEXT NOT NULL, -- 'LAD', 'LCX', 'RCA', 'LM', etc.
  lesion_type TEXT,
  pre_stenosis INTEGER,
  post_stenosis INTEGER,
  timi_flow_pre TEXT,
  timi_flow_post TEXT,
  dual_antiplatelet_end_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- OPHTHALMOLOGY SPECIFIC TABLES
-- =====================================================

-- Ophthalmology Patient Extensions
CREATE TABLE IF NOT EXISTS ophthalmology_patients (
  id TEXT PRIMARY KEY,
  healthcare_patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  primary_diagnosis TEXT,
  has_glaucoma INTEGER DEFAULT 0,
  has_dmla INTEGER DEFAULT 0,
  has_diabetic_retinopathy INTEGER DEFAULT 0,
  has_cataract INTEGER DEFAULT 0,
  has_iol_implant INTEGER DEFAULT 0,
  last_acuity_od TEXT,
  last_acuity_og TEXT,
  last_iop_od REAL,
  last_iop_og REAL,
  last_consultation TEXT,
  next_appointment TEXT,
  wearing_glasses INTEGER DEFAULT 0,
  wearing_contacts INTEGER DEFAULT 0,
  ophthalmic_history TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- OCT Scans
CREATE TABLE IF NOT EXISTS ophthalmology_oct (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  scan_date TEXT NOT NULL,
  eye TEXT NOT NULL, -- 'OD', 'OG'
  scan_type TEXT NOT NULL, -- 'macula', 'rnfl', 'optic_nerve', 'anterior'
  device TEXT,
  technician TEXT,
  reviewing_doctor TEXT,
  signal_quality TEXT DEFAULT 'good',
  central_macular_thickness INTEGER,
  macula_volume REAL,
  rnfl_thickness INTEGER,
  rnfl_superior INTEGER,
  rnfl_inferior INTEGER,
  rnfl_nasal INTEGER,
  rnfl_temporal INTEGER,
  cup_disc_ratio REAL,
  findings TEXT,
  interpretation TEXT,
  comparison_notes TEXT,
  image_path TEXT,
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Visual Fields (Perimetry)
CREATE TABLE IF NOT EXISTS ophthalmology_visual_fields (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  test_date TEXT NOT NULL,
  eye TEXT NOT NULL, -- 'OD', 'OG'
  test_strategy TEXT, -- '24-2', '10-2', '30-2'
  device TEXT,
  technician TEXT,
  reviewing_doctor TEXT,
  fixation_losses INTEGER,
  false_positives INTEGER,
  false_negatives INTEGER,
  reliability TEXT DEFAULT 'reliable',
  mean_deviation REAL,
  pattern_standard_deviation REAL,
  visual_field_index REAL,
  ght_status TEXT, -- 'Within Normal Limits', 'Borderline', 'Outside Normal Limits'
  findings TEXT,
  progression_analysis TEXT,
  image_path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- IVT Injections (Intravitreal)
CREATE TABLE IF NOT EXISTS ophthalmology_ivt_injections (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  injection_date TEXT NOT NULL,
  eye TEXT NOT NULL, -- 'OD', 'OG'
  drug TEXT NOT NULL, -- 'Eylea', 'Lucentis', 'Avastin', 'Vabysmo', 'Ozurdex'
  drug_generic TEXT,
  dose TEXT,
  lot_number TEXT,
  indication TEXT NOT NULL, -- 'DMLA', 'DME', 'RVO', 'myopic_cnv'
  injection_number INTEGER DEFAULT 1,
  protocol TEXT, -- 'PRN', 'T&E', 'fixed'
  pre_injection_iop REAL,
  post_injection_iop REAL,
  pre_injection_acuity TEXT,
  performing_doctor TEXT,
  assistant TEXT,
  complications TEXT,
  next_injection_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Biometry (for IOL calculation)
CREATE TABLE IF NOT EXISTS ophthalmology_biometry (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  measurement_date TEXT NOT NULL,
  eye TEXT NOT NULL, -- 'OD', 'OG'
  device TEXT,
  technician TEXT,
  axial_length REAL,
  keratometry_k1 REAL,
  keratometry_k2 REAL,
  keratometry_axis INTEGER,
  anterior_chamber_depth REAL,
  lens_thickness REAL,
  white_to_white REAL,
  target_refraction REAL,
  recommended_iol_power REAL,
  recommended_iol_model TEXT,
  formula_used TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- IOL Implants
CREATE TABLE IF NOT EXISTS ophthalmology_iol_implants (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  surgery_date TEXT NOT NULL,
  eye TEXT NOT NULL, -- 'OD', 'OG'
  surgeon TEXT,
  surgery_type TEXT, -- 'phaco', 'ecce', 'icce', 'iol_exchange'
  iol_manufacturer TEXT,
  iol_model TEXT,
  iol_power REAL,
  iol_serial TEXT,
  iol_type TEXT, -- 'monofocal', 'multifocal', 'toric', 'edof'
  target_refraction REAL,
  achieved_refraction REAL,
  post_op_acuity TEXT,
  complications TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Refraction Measurements
CREATE TABLE IF NOT EXISTS ophthalmology_refraction (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  measurement_date TEXT NOT NULL,
  technician TEXT,
  optometrist TEXT,
  -- Right Eye (OD)
  od_sphere REAL,
  od_cylinder REAL,
  od_axis INTEGER,
  od_add REAL,
  od_va_uncorrected TEXT,
  od_va_corrected TEXT,
  od_pd REAL,
  -- Left Eye (OG)
  og_sphere REAL,
  og_cylinder REAL,
  og_axis INTEGER,
  og_add REAL,
  og_va_uncorrected TEXT,
  og_va_corrected TEXT,
  og_pd REAL,
  -- General
  prescription_type TEXT, -- 'distance', 'near', 'progressive', 'bifocal'
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tonometry (IOP measurements)
CREATE TABLE IF NOT EXISTS ophthalmology_tonometry (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  measurement_date TEXT NOT NULL,
  measurement_time TEXT,
  device TEXT, -- 'goldmann', 'icare', 'tonopen', 'pneumo'
  technician TEXT,
  iop_od REAL,
  iop_og REAL,
  cct_od INTEGER, -- central corneal thickness
  cct_og INTEGER,
  iop_od_corrected REAL,
  iop_og_corrected REAL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_healthcare_patients_company ON healthcare_patients(company_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_consultations_patient ON healthcare_consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_medications_patient ON healthcare_medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_alerts_patient ON healthcare_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_patients_healthcare ON cardiology_patients(healthcare_patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_ecg_patient ON cardiology_ecg(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_pacemakers_patient ON cardiology_pacemakers(patient_id);
CREATE INDEX IF NOT EXISTS idx_cardiology_stents_patient ON cardiology_stents(patient_id);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_patients_healthcare ON ophthalmology_patients(healthcare_patient_id);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_oct_patient ON ophthalmology_oct(patient_id);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_visual_fields_patient ON ophthalmology_visual_fields(patient_id);
CREATE INDEX IF NOT EXISTS idx_ophthalmology_ivt_patient ON ophthalmology_ivt_injections(patient_id);
