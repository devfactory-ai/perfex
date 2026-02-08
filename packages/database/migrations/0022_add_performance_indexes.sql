-- Migration: Add performance indexes for healthcare modules
-- Created: 2024-12-30

-- =============================================
-- DIALYSE MODULE INDEXES
-- =============================================

-- Index for patient listing with status filter (most common query)
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_org_status
  ON dialyse_patients(organization_id, patient_status);

-- Index for patient listing with creation date ordering
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_org_created
  ON dialyse_patients(organization_id, created_at DESC);

-- Index for isolation requirement filtering
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_isolation
  ON dialyse_patients(organization_id, requires_isolation);

-- Index for serology status filtering (HIV, HBV, HCV)
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_serology
  ON dialyse_patients(organization_id, hiv_status, hbv_status, hcv_status);

-- Index for sessions by patient (for patient detail view)
CREATE INDEX IF NOT EXISTS idx_dialyse_sessions_patient
  ON dialyse_sessions(patient_id, session_date DESC);

-- Index for sessions by machine (for machine utilization)
CREATE INDEX IF NOT EXISTS idx_dialyse_sessions_machine
  ON dialyse_sessions(machine_id, session_date DESC);

-- Index for sessions by date range (for scheduling)
CREATE INDEX IF NOT EXISTS idx_dialyse_sessions_org_date
  ON dialyse_sessions(organization_id, session_date);

-- Index for active prescriptions
CREATE INDEX IF NOT EXISTS idx_dialyse_prescriptions_patient_active
  ON dialyse_prescriptions(patient_id, is_active);

-- Index for vascular accesses by patient
CREATE INDEX IF NOT EXISTS idx_dialyse_vascular_access_patient
  ON vascular_accesses(patient_id, status);

-- Index for lab results by patient and date
CREATE INDEX IF NOT EXISTS idx_dialyse_lab_results_patient
  ON lab_results(patient_id, result_date DESC);

-- Index for machines by status
CREATE INDEX IF NOT EXISTS idx_dialyse_machines_org_status
  ON dialyse_machines(organization_id, status);

-- Index for clinical alerts by patient and status
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_patient_status
  ON clinical_alerts(patient_id, status, created_at DESC);

-- =============================================
-- CARDIOLOGY MODULE INDEXES
-- =============================================

-- Index for cardiology patients by organization and status
CREATE INDEX IF NOT EXISTS idx_cardiology_patients_org_status
  ON healthcare_patients(company_id, patient_status)
  WHERE module = 'cardiology';

-- Index for cardiology patients by creation date
CREATE INDEX IF NOT EXISTS idx_cardiology_patients_org_created
  ON healthcare_patients(company_id, created_at DESC)
  WHERE module = 'cardiology';

-- Index for cardiology consultations by patient
CREATE INDEX IF NOT EXISTS idx_cardiology_consultations_patient
  ON cardiology_consultations(patient_id, consultation_date DESC);

-- Index for ECG exams by patient
CREATE INDEX IF NOT EXISTS idx_cardiology_ecg_patient
  ON cardiology_ecg_exams(patient_id, exam_date DESC);

-- Index for echocardiograms by patient
CREATE INDEX IF NOT EXISTS idx_cardiology_echo_patient
  ON cardiology_echocardiograms(patient_id, exam_date DESC);

-- Index for pacemakers by patient and status
CREATE INDEX IF NOT EXISTS idx_cardiology_pacemakers_patient
  ON cardiology_pacemakers(patient_id, status);

-- Index for stents by patient
CREATE INDEX IF NOT EXISTS idx_cardiology_stents_patient
  ON cardiology_stents(patient_id, implant_date DESC);

-- Index for cardiac events by patient
CREATE INDEX IF NOT EXISTS idx_cardiology_events_patient
  ON cardiology_cardiac_events(patient_id, event_date DESC);

-- Index for risk scores by patient
CREATE INDEX IF NOT EXISTS idx_cardiology_risk_scores_patient
  ON cardiology_risk_scores(patient_id, calculation_date DESC);

-- =============================================
-- OPHTHALMOLOGY MODULE INDEXES
-- =============================================

-- Index for ophthalmology patients by organization and status
CREATE INDEX IF NOT EXISTS idx_ophthalmology_patients_org_status
  ON healthcare_patients(company_id, patient_status)
  WHERE module = 'ophthalmology';

-- Index for ophthalmology patients by creation date
CREATE INDEX IF NOT EXISTS idx_ophthalmology_patients_org_created
  ON healthcare_patients(company_id, created_at DESC)
  WHERE module = 'ophthalmology';

-- Index for ophthalmology consultations by patient
CREATE INDEX IF NOT EXISTS idx_ophthalmology_consultations_patient
  ON ophthalmology_consultations(patient_id, consultation_date DESC);

-- Index for OCT exams by patient
CREATE INDEX IF NOT EXISTS idx_ophthalmology_oct_patient
  ON ophthalmology_oct_exams(patient_id, exam_date DESC);

-- Index for visual field exams by patient
CREATE INDEX IF NOT EXISTS idx_ophthalmology_visual_fields_patient
  ON ophthalmology_visual_fields(patient_id, exam_date DESC);

-- Index for IVT injections by patient
CREATE INDEX IF NOT EXISTS idx_ophthalmology_ivt_patient
  ON ophthalmology_ivt_injections(patient_id, injection_date DESC);

-- Index for surgeries by patient
CREATE INDEX IF NOT EXISTS idx_ophthalmology_surgeries_patient
  ON ophthalmology_surgeries(patient_id, surgery_date DESC);

-- Index for tonometry by patient
CREATE INDEX IF NOT EXISTS idx_ophthalmology_tonometry_patient
  ON ophthalmology_tonometry(patient_id, measurement_date DESC);

-- Index for biometry by patient
CREATE INDEX IF NOT EXISTS idx_ophthalmology_biometry_patient
  ON ophthalmology_biometry(patient_id, measurement_date DESC);

-- =============================================
-- HEALTHCARE ALERTS INDEXES
-- =============================================

-- Index for active alerts by organization and severity
CREATE INDEX IF NOT EXISTS idx_healthcare_alerts_org_severity
  ON healthcare_alerts(organization_id, status, severity, created_at DESC);

-- Index for alerts by patient
CREATE INDEX IF NOT EXISTS idx_healthcare_alerts_patient
  ON healthcare_alerts(patient_id, status, created_at DESC);

-- =============================================
-- WORKFLOW & AUDIT INDEXES
-- =============================================

-- Index for workflow executions by status
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
  ON workflow_executions(workflow_id, status, started_at DESC);

-- Index for audit logs by entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity_type, entity_id, created_at DESC);

-- Index for audit logs by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs(user_id, created_at DESC);

-- =============================================
-- CONTACTS & CRM INDEXES
-- =============================================

-- Index for contacts search (name)
CREATE INDEX IF NOT EXISTS idx_contacts_org_name
  ON contacts(organization_id, last_name, first_name);

-- Index for contacts by email
CREATE INDEX IF NOT EXISTS idx_contacts_email
  ON contacts(organization_id, email);

-- =============================================
-- INVOICES & FINANCE INDEXES
-- =============================================

-- Index for invoices by status and due date
CREATE INDEX IF NOT EXISTS idx_invoices_org_status_due
  ON invoices(organization_id, status, due_date);

-- Index for invoices by contact
CREATE INDEX IF NOT EXISTS idx_invoices_contact
  ON invoices(contact_id, invoice_date DESC);

-- Index for journal entries by date
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_date
  ON journal_entries(organization_id, entry_date DESC);

-- Index for journal entry lines by account
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account
  ON journal_entry_lines(account_id);
