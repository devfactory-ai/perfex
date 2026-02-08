-- ============================================================================
-- Migration: Clinical AI & Patient Portal
-- Phase 1 tables for AI Clinical Assistant and Patient Portal features
-- ============================================================================

-- ============================================================================
-- CLINICAL AI TABLES
-- ============================================================================

-- Clinical Documentation - AI-generated clinical documents
CREATE TABLE IF NOT EXISTS clinical_documentation (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  encounter_id TEXT,
  consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,
  company_id TEXT NOT NULL,

  -- Document type
  document_type TEXT NOT NULL CHECK (document_type IN ('consultation_note', 'discharge_summary', 'referral_letter', 'progress_note', 'surgical_report', 'procedure_note', 'admission_note', 'transfer_note')),

  -- Module context
  module TEXT DEFAULT 'general' CHECK (module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),

  -- AI Generation
  ai_generated_draft TEXT,
  final_content TEXT,
  ai_model TEXT,
  ai_model_version TEXT,
  prompt_used TEXT,
  generation_time_ms INTEGER,

  -- Input context
  input_context TEXT, -- JSON

  -- Audio transcription
  audio_url TEXT,
  transcription TEXT,
  transcription_confidence REAL,
  transcription_language TEXT DEFAULT 'fr',

  -- Structured data extraction
  extracted_entities TEXT, -- JSON
  extracted_codes TEXT, -- JSON

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'signed', 'amended', 'voided')),

  -- Review workflow
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at INTEGER,
  review_notes TEXT,

  -- Signature
  signed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  signed_at INTEGER,
  digital_signature TEXT,

  -- Amendment tracking
  amended_from TEXT,
  amendment_reason TEXT,

  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Patient Summaries - AI-generated patient summaries
CREATE TABLE IF NOT EXISTS patient_summaries (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Summary type
  summary_type TEXT NOT NULL CHECK (summary_type IN ('comprehensive', 'admission', 'discharge', 'specialty', 'problem_focused', 'pre_operative', 'handoff')),

  -- Module context
  module TEXT DEFAULT 'general' CHECK (module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),

  -- Content
  title TEXT,
  content TEXT NOT NULL,
  content_format TEXT DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'html', 'plain')),

  -- Structured data
  structured_data TEXT, -- JSON
  key_problems TEXT, -- JSON array
  active_medications TEXT, -- JSON array
  recent_procedures TEXT, -- JSON array
  pending_actions TEXT, -- JSON array
  critical_alerts TEXT, -- JSON array

  -- AI metadata
  ai_model TEXT,
  ai_confidence REAL,
  generation_time_ms INTEGER,

  -- Source tracking
  source_document_ids TEXT, -- JSON array
  data_range TEXT, -- JSON {from, to}

  -- Refresh settings
  last_refreshed INTEGER,
  auto_refresh INTEGER DEFAULT 1,
  refresh_frequency TEXT DEFAULT 'on_change' CHECK (refresh_frequency IN ('daily', 'weekly', 'on_change', 'manual')),
  next_refresh_at INTEGER,

  -- Validity
  valid_until INTEGER,
  is_stale INTEGER DEFAULT 0,

  -- User feedback
  user_rating INTEGER,
  user_feedback TEXT,

  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Diagnostic Suggestions - AI diagnostic assistance
CREATE TABLE IF NOT EXISTS diagnostic_suggestions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  encounter_id TEXT,
  consultation_id TEXT REFERENCES healthcare_consultations(id) ON DELETE SET NULL,
  company_id TEXT NOT NULL,

  -- Module context
  module TEXT DEFAULT 'general' CHECK (module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),

  -- Input data (JSON)
  symptoms TEXT,
  lab_results TEXT,
  imaging_findings TEXT,
  vital_signs TEXT,
  medical_history TEXT,
  current_medications TEXT,

  -- AI Suggestions (JSON)
  differential_diagnoses TEXT,
  primary_diagnosis TEXT,
  recommended_tests TEXT,
  recommended_imaging TEXT,
  recommended_consults TEXT,

  -- Clinical alerts
  red_flags TEXT,
  drug_interactions TEXT,
  contraindicated_actions TEXT,

  -- Urgency assessment
  urgency_assessment TEXT DEFAULT 'routine' CHECK (urgency_assessment IN ('routine', 'soon', 'urgent', 'emergent', 'critical')),
  urgency_rationale TEXT,

  -- Clinical reasoning
  clinical_reasoning TEXT,
  evidence_references TEXT, -- JSON array

  -- AI metadata
  ai_model TEXT,
  ai_confidence REAL,
  generation_time_ms INTEGER,

  -- Provider feedback
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'modified', 'rejected', 'expired')),
  viewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  viewed_at INTEGER,
  provider_notes TEXT,
  provider_decision TEXT,

  -- Outcome tracking
  actual_diagnosis TEXT,
  diagnosis_match_score REAL,
  outcome_recorded_at INTEGER,
  outcome_recorded_by TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Expiration
  expires_at INTEGER,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- AI Clinical Prompts - Reusable prompt templates
CREATE TABLE IF NOT EXISTS ai_clinical_prompts (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,

  -- Identification
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,

  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('documentation', 'summary', 'diagnostic', 'report', 'analysis', 'extraction')),
  module TEXT DEFAULT 'general' CHECK (module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),

  -- Prompt content
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  output_format TEXT,

  -- Variables
  required_variables TEXT, -- JSON array
  optional_variables TEXT, -- JSON array

  -- Model settings
  recommended_model TEXT DEFAULT 'llama-3.1-8b',
  temperature REAL DEFAULT 0.3,
  max_tokens INTEGER DEFAULT 2000,

  -- Language
  language TEXT DEFAULT 'fr',

  -- Version control
  version INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  previous_version_id TEXT,

  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  avg_rating REAL,

  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Clinical AI Usage - Usage tracking for billing/quotas
CREATE TABLE IF NOT EXISTS clinical_ai_usage (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),

  -- Feature used
  feature TEXT NOT NULL CHECK (feature IN ('documentation', 'summary', 'diagnostic', 'transcription', 'report', 'analysis')),

  -- Request details
  request_id TEXT,
  entity_type TEXT,
  entity_id TEXT,

  -- Model used
  ai_model TEXT NOT NULL,
  ai_provider TEXT DEFAULT 'cloudflare',

  -- Token usage
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,

  -- Timing
  latency_ms INTEGER,
  queue_time_ms INTEGER,

  -- Cost
  estimated_cost REAL,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'timeout', 'rate_limited')),
  error_message TEXT,

  -- Date for aggregation
  usage_date TEXT NOT NULL,

  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- PATIENT PORTAL TABLES
-- ============================================================================

-- Portal Users - Patient portal authentication
CREATE TABLE IF NOT EXISTS portal_users (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Authentication
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,

  -- Verification
  is_email_verified INTEGER DEFAULT 0,
  email_verified_at INTEGER,
  is_phone_verified INTEGER DEFAULT 0,
  phone_verified_at INTEGER,

  -- 2FA
  two_factor_enabled INTEGER DEFAULT 0,
  two_factor_secret TEXT,
  two_factor_method TEXT CHECK (two_factor_method IN ('app', 'sms', 'email')),
  backup_codes TEXT, -- JSON

  -- Login tracking
  last_login_at INTEGER,
  last_login_ip TEXT,
  last_login_user_agent TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until INTEGER,

  -- Preferences
  language TEXT DEFAULT 'fr',
  timezone TEXT DEFAULT 'Europe/Paris',
  notification_preferences TEXT, -- JSON
  accessibility_settings TEXT, -- JSON

  -- Consent
  terms_accepted_at INTEGER,
  terms_version TEXT,
  privacy_accepted_at INTEGER,
  privacy_version TEXT,

  -- Status
  status TEXT DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'active', 'suspended', 'deactivated', 'locked')),
  deactivated_at INTEGER,
  deactivation_reason TEXT,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(email, company_id)
);

-- Portal Sessions
CREATE TABLE IF NOT EXISTS portal_sessions (
  id TEXT PRIMARY KEY,
  portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Session info
  token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at INTEGER NOT NULL,
  refresh_expires_at INTEGER,

  -- Device info
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  device_name TEXT,

  -- Status
  is_active INTEGER DEFAULT 1,
  revoked_at INTEGER,
  revoked_reason TEXT,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_activity_at INTEGER
);

-- Appointment Requests
CREATE TABLE IF NOT EXISTS appointment_requests (
  id TEXT PRIMARY KEY,
  portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Request type
  request_type TEXT NOT NULL CHECK (request_type IN ('new', 'reschedule', 'cancel', 'followup')),

  -- Original appointment
  original_appointment_id TEXT REFERENCES healthcare_appointments(id) ON DELETE SET NULL,

  -- Preferences
  preferred_dates TEXT, -- JSON array
  preferred_time_of_day TEXT CHECK (preferred_time_of_day IN ('morning', 'afternoon', 'evening', 'any')),
  preferred_provider_id TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Appointment details
  appointment_type TEXT,
  module TEXT DEFAULT 'general' CHECK (module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),
  specialty_requested TEXT,
  reason TEXT NOT NULL,
  urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'soon', 'urgent')),
  notes TEXT,
  estimated_duration INTEGER,

  -- Processing
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'denied', 'cancelled', 'expired')),
  processed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  processed_at INTEGER,
  response_notes TEXT,
  denial_reason TEXT,

  -- Result
  appointment_id TEXT REFERENCES healthcare_appointments(id) ON DELETE SET NULL,
  scheduled_date INTEGER,
  scheduled_time TEXT,

  -- Notifications
  patient_notified_at INTEGER,
  notification_method TEXT CHECK (notification_method IN ('email', 'sms', 'both', 'push')),

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Portal Message Threads
CREATE TABLE IF NOT EXISTS portal_message_threads (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,

  -- Participants
  portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  assigned_provider_id TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Thread info
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('medical_question', 'appointment', 'prescription', 'lab_results', 'billing', 'technical', 'other')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Module context
  module TEXT DEFAULT 'general' CHECK (module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'awaiting_patient', 'awaiting_provider', 'resolved', 'closed')),
  resolved_at INTEGER,
  resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Unread tracking
  unread_by_patient INTEGER DEFAULT 0,
  unread_by_provider INTEGER DEFAULT 0,
  last_message_at INTEGER,

  -- Archive
  is_archived_by_patient INTEGER DEFAULT 0,
  is_archived_by_provider INTEGER DEFAULT 0,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Portal Messages
CREATE TABLE IF NOT EXISTS portal_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES portal_message_threads(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Sender
  from_portal_user_id TEXT REFERENCES portal_users(id) ON DELETE SET NULL,
  from_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,

  -- Content
  body TEXT NOT NULL,
  body_format TEXT DEFAULT 'plain' CHECK (body_format IN ('plain', 'html', 'markdown')),
  attachments TEXT, -- JSON array

  -- Read status
  is_read_by_patient INTEGER DEFAULT 0,
  read_by_patient_at INTEGER,
  is_read_by_provider INTEGER DEFAULT 0,
  read_by_provider_at INTEGER,

  -- System messages
  is_system_message INTEGER DEFAULT 0,
  system_message_type TEXT,

  -- Edit tracking
  is_edited INTEGER DEFAULT 0,
  edited_at INTEGER,
  original_body TEXT,

  sent_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Symptom Tracking
CREATE TABLE IF NOT EXISTS symptom_tracking (
  id TEXT PRIMARY KEY,
  portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Recording info
  recorded_at INTEGER NOT NULL DEFAULT (unixepoch()),
  recorded_date TEXT NOT NULL,
  entry_type TEXT DEFAULT 'combined' CHECK (entry_type IN ('symptoms', 'vitals', 'wellness', 'combined')),

  -- Module context
  module TEXT DEFAULT 'general' CHECK (module IN ('dialyse', 'cardiology', 'ophthalmology', 'general')),

  -- Symptoms (JSON)
  symptoms TEXT,

  -- Vitals
  weight REAL,
  height_cm REAL,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  temperature REAL,
  blood_glucose REAL,
  blood_glucose_unit TEXT CHECK (blood_glucose_unit IN ('mmol_l', 'mg_dl')),
  oxygen_saturation INTEGER,
  respiratory_rate INTEGER,

  -- Dialysis-specific
  pre_dry_weight REAL,
  fluid_intake REAL,
  urine_output REAL,
  edema_level TEXT CHECK (edema_level IN ('none', 'mild', 'moderate', 'severe')),

  -- Cardiology-specific
  chest_pain INTEGER,
  chest_pain_type TEXT CHECK (chest_pain_type IN ('pressure', 'sharp', 'burning', 'other')),
  shortness_of_breath TEXT CHECK (shortness_of_breath IN ('none', 'at_rest', 'with_activity', 'lying_down')),
  palpitations INTEGER,
  leg_swelling TEXT CHECK (leg_swelling IN ('none', 'mild', 'moderate', 'severe')),

  -- Ophthalmology-specific
  visual_disturbances INTEGER,
  visual_disturbance_type TEXT,
  eye_pain TEXT CHECK (eye_pain IN ('none', 'mild', 'moderate', 'severe')),
  affected_eye TEXT CHECK (affected_eye IN ('left', 'right', 'both')),

  -- Wellness
  mood TEXT CHECK (mood IN ('very_poor', 'poor', 'fair', 'good', 'excellent')),
  sleep_quality TEXT CHECK (sleep_quality IN ('very_poor', 'poor', 'fair', 'good', 'excellent')),
  sleep_hours REAL,
  pain_level INTEGER,
  pain_location TEXT,
  energy_level TEXT CHECK (energy_level IN ('very_low', 'low', 'normal', 'high', 'very_high')),
  appetite_level TEXT CHECK (appetite_level IN ('none', 'poor', 'fair', 'normal', 'increased')),
  stress_level TEXT CHECK (stress_level IN ('none', 'low', 'moderate', 'high', 'severe')),

  -- Activity
  exercise_minutes INTEGER,
  exercise_type TEXT,
  steps_count INTEGER,

  -- Notes
  notes TEXT,
  photo_urls TEXT, -- JSON array

  -- Alerts
  triggered_alert INTEGER DEFAULT 0,
  alert_id TEXT,

  -- Provider review
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at INTEGER,
  provider_notes TEXT,

  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Medication Refill Requests
CREATE TABLE IF NOT EXISTS medication_refill_requests (
  id TEXT PRIMARY KEY,
  portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Medication info
  medication_name TEXT NOT NULL,
  medication_code TEXT,
  dosage TEXT NOT NULL,
  current_quantity INTEGER,
  quantity_requested INTEGER,

  -- Pharmacy
  pharmacy_id TEXT,
  pharmacy_name TEXT,
  pharmacy_address TEXT,
  pharmacy_phone TEXT,
  delivery_requested INTEGER DEFAULT 0,

  -- Urgency
  urgency TEXT DEFAULT 'routine' CHECK (urgency IN ('routine', 'soon', 'urgent')),
  days_supply_remaining INTEGER,
  notes TEXT,

  -- Processing
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'denied', 'sent_to_pharmacy', 'ready_for_pickup', 'completed', 'cancelled')),
  processed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  processed_at INTEGER,
  response_notes TEXT,
  denial_reason TEXT,

  -- Prescription
  prescription_id TEXT,
  prescription_sent_at INTEGER,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Educational Content
CREATE TABLE IF NOT EXISTS educational_content (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,

  -- Identification
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  -- Content type
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'infographic', 'quiz', 'faq', 'guide', 'checklist')),

  -- Categorization
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT, -- JSON array

  -- Applicable modules/conditions
  modules TEXT, -- JSON array
  conditions TEXT, -- JSON array

  -- Content
  content TEXT NOT NULL,
  content_format TEXT DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'html')),

  -- Media
  media_url TEXT,
  thumbnail_url TEXT,
  media_type TEXT CHECK (media_type IN ('video', 'pdf', 'audio', 'image')),
  media_duration_seconds INTEGER,

  -- Metadata
  language TEXT DEFAULT 'fr',
  read_time_minutes INTEGER,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),

  -- Author
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_credentials TEXT,

  -- External source
  source_url TEXT,
  source_name TEXT,
  last_reviewed_date INTEGER,

  -- Publishing
  is_published INTEGER DEFAULT 0,
  published_at INTEGER,
  expires_at INTEGER,

  -- Stats
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(slug, company_id)
);

-- Patient Education Progress
CREATE TABLE IF NOT EXISTS patient_education_progress (
  id TEXT PRIMARY KEY,
  portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL REFERENCES educational_content(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Progress
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0,
  last_position INTEGER,
  time_spent_seconds INTEGER DEFAULT 0,

  -- Completion
  completed_at INTEGER,
  completed_count INTEGER DEFAULT 0,

  -- Quiz results
  quiz_score INTEGER,
  quiz_attempts INTEGER DEFAULT 0,
  quiz_passed INTEGER,

  -- Engagement
  is_bookmarked INTEGER DEFAULT 0,
  is_liked INTEGER DEFAULT 0,
  rating INTEGER,
  feedback TEXT,

  -- Prescription
  prescribed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  prescribed_at INTEGER,
  due_date INTEGER,

  first_viewed_at INTEGER,
  last_viewed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(portal_user_id, content_id)
);

-- Portal Notifications
CREATE TABLE IF NOT EXISTS portal_notifications (
  id TEXT PRIMARY KEY,
  portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Type
  type TEXT NOT NULL CHECK (type IN ('appointment_reminder', 'appointment_confirmed', 'appointment_cancelled', 'new_message', 'lab_result_available', 'prescription_ready', 'document_shared', 'education_assigned', 'symptom_alert_response', 'payment_due', 'general')),

  -- Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,

  -- Reference
  reference_type TEXT,
  reference_id TEXT,
  action_url TEXT,

  -- Delivery
  channels TEXT, -- JSON array
  email_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  push_sent INTEGER DEFAULT 0,

  -- Status
  is_read INTEGER DEFAULT 0,
  read_at INTEGER,
  is_actioned INTEGER DEFAULT 0,
  actioned_at INTEGER,

  -- Scheduling
  scheduled_for INTEGER,
  sent_at INTEGER,
  expires_at INTEGER,

  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Patient Document Access
CREATE TABLE IF NOT EXISTS patient_document_access (
  id TEXT PRIMARY KEY,
  portal_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL,

  -- Document reference
  document_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_date INTEGER,

  -- Access control
  shared_by TEXT NOT NULL REFERENCES users(id),
  shared_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER,
  access_level TEXT DEFAULT 'view' CHECK (access_level IN ('view', 'download')),

  -- Tracking
  view_count INTEGER DEFAULT 0,
  first_viewed_at INTEGER,
  last_viewed_at INTEGER,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at INTEGER,

  -- Status
  is_revoked INTEGER DEFAULT 0,
  revoked_at INTEGER,
  revoked_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  revoked_reason TEXT,

  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Clinical Documentation indexes
CREATE INDEX IF NOT EXISTS idx_clinical_documentation_patient ON clinical_documentation(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documentation_company ON clinical_documentation(company_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documentation_status ON clinical_documentation(status);
CREATE INDEX IF NOT EXISTS idx_clinical_documentation_type ON clinical_documentation(document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_documentation_module ON clinical_documentation(module);
CREATE INDEX IF NOT EXISTS idx_clinical_documentation_created ON clinical_documentation(created_at);

-- Patient Summaries indexes
CREATE INDEX IF NOT EXISTS idx_patient_summaries_patient ON patient_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_summaries_company ON patient_summaries(company_id);
CREATE INDEX IF NOT EXISTS idx_patient_summaries_type ON patient_summaries(summary_type);
CREATE INDEX IF NOT EXISTS idx_patient_summaries_module ON patient_summaries(module);

-- Diagnostic Suggestions indexes
CREATE INDEX IF NOT EXISTS idx_diagnostic_suggestions_patient ON diagnostic_suggestions(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_suggestions_company ON diagnostic_suggestions(company_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_suggestions_status ON diagnostic_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_diagnostic_suggestions_urgency ON diagnostic_suggestions(urgency_assessment);

-- AI Clinical Prompts indexes
CREATE INDEX IF NOT EXISTS idx_ai_clinical_prompts_company ON ai_clinical_prompts(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_clinical_prompts_code ON ai_clinical_prompts(code);
CREATE INDEX IF NOT EXISTS idx_ai_clinical_prompts_category ON ai_clinical_prompts(category);

-- Clinical AI Usage indexes
CREATE INDEX IF NOT EXISTS idx_clinical_ai_usage_company ON clinical_ai_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_clinical_ai_usage_user ON clinical_ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_ai_usage_date ON clinical_ai_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_clinical_ai_usage_feature ON clinical_ai_usage(feature);

-- Portal Users indexes
CREATE INDEX IF NOT EXISTS idx_portal_users_patient ON portal_users(patient_id);
CREATE INDEX IF NOT EXISTS idx_portal_users_company ON portal_users(company_id);
CREATE INDEX IF NOT EXISTS idx_portal_users_email ON portal_users(email);
CREATE INDEX IF NOT EXISTS idx_portal_users_status ON portal_users(status);

-- Portal Sessions indexes
CREATE INDEX IF NOT EXISTS idx_portal_sessions_user ON portal_sessions(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_token ON portal_sessions(token);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_active ON portal_sessions(is_active);

-- Appointment Requests indexes
CREATE INDEX IF NOT EXISTS idx_appointment_requests_portal_user ON appointment_requests(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_patient ON appointment_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_company ON appointment_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status ON appointment_requests(status);

-- Portal Message Threads indexes
CREATE INDEX IF NOT EXISTS idx_portal_message_threads_portal_user ON portal_message_threads(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_message_threads_patient ON portal_message_threads(patient_id);
CREATE INDEX IF NOT EXISTS idx_portal_message_threads_provider ON portal_message_threads(assigned_provider_id);
CREATE INDEX IF NOT EXISTS idx_portal_message_threads_status ON portal_message_threads(status);

-- Portal Messages indexes
CREATE INDEX IF NOT EXISTS idx_portal_messages_thread ON portal_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_sent ON portal_messages(sent_at);

-- Symptom Tracking indexes
CREATE INDEX IF NOT EXISTS idx_symptom_tracking_portal_user ON symptom_tracking(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_tracking_patient ON symptom_tracking(patient_id);
CREATE INDEX IF NOT EXISTS idx_symptom_tracking_company ON symptom_tracking(company_id);
CREATE INDEX IF NOT EXISTS idx_symptom_tracking_date ON symptom_tracking(recorded_date);
CREATE INDEX IF NOT EXISTS idx_symptom_tracking_module ON symptom_tracking(module);

-- Medication Refill Requests indexes
CREATE INDEX IF NOT EXISTS idx_medication_refill_portal_user ON medication_refill_requests(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_medication_refill_patient ON medication_refill_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_refill_status ON medication_refill_requests(status);

-- Educational Content indexes
CREATE INDEX IF NOT EXISTS idx_educational_content_company ON educational_content(company_id);
CREATE INDEX IF NOT EXISTS idx_educational_content_type ON educational_content(content_type);
CREATE INDEX IF NOT EXISTS idx_educational_content_category ON educational_content(category);
CREATE INDEX IF NOT EXISTS idx_educational_content_published ON educational_content(is_published);

-- Patient Education Progress indexes
CREATE INDEX IF NOT EXISTS idx_patient_education_progress_portal_user ON patient_education_progress(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_patient_education_progress_content ON patient_education_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_patient_education_progress_status ON patient_education_progress(status);

-- Portal Notifications indexes
CREATE INDEX IF NOT EXISTS idx_portal_notifications_user ON portal_notifications(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_type ON portal_notifications(type);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_read ON portal_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_scheduled ON portal_notifications(scheduled_for);

-- Patient Document Access indexes
CREATE INDEX IF NOT EXISTS idx_patient_document_access_portal_user ON patient_document_access(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_patient_document_access_patient ON patient_document_access(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_document_access_document ON patient_document_access(document_id);
