-- Migration: Add performance indexes for frequently queried columns
-- This migration adds indexes to improve query performance across core and dialyse tables

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);

-- Sessions table (for auth lookups)
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Organization members
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- Contacts (CRM)
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);

-- ============================================================================
-- DIALYSE MODULE
-- ============================================================================

-- Dialyse patients (critical for patient lookups)
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_org ON dialyse_patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_contact ON dialyse_patients(contact_id);
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_status ON dialyse_patients(patient_status);
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_medical_id ON dialyse_patients(medical_id);
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_isolation ON dialyse_patients(requires_isolation);

-- Vascular accesses
CREATE INDEX IF NOT EXISTS idx_vascular_accesses_patient ON dialyse_vascular_accesses(patient_id);
CREATE INDEX IF NOT EXISTS idx_vascular_accesses_org ON dialyse_vascular_accesses(organization_id);
CREATE INDEX IF NOT EXISTS idx_vascular_accesses_status ON dialyse_vascular_accesses(status);

-- Prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON dialyse_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_org ON dialyse_prescriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON dialyse_prescriptions(status);

-- Machines
CREATE INDEX IF NOT EXISTS idx_machines_org ON dialyse_machines(organization_id);
CREATE INDEX IF NOT EXISTS idx_machines_status ON dialyse_machines(status);
CREATE INDEX IF NOT EXISTS idx_machines_room ON dialyse_machines(room);

-- Machine maintenance
CREATE INDEX IF NOT EXISTS idx_machine_maintenance_machine ON dialyse_machine_maintenance(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_maintenance_type ON dialyse_machine_maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_machine_maintenance_date ON dialyse_machine_maintenance(maintenance_date);

-- Session slots
CREATE INDEX IF NOT EXISTS idx_session_slots_org ON dialyse_session_slots(organization_id);
CREATE INDEX IF NOT EXISTS idx_session_slots_machine ON dialyse_session_slots(machine_id);

-- Dialysis sessions (very frequently queried)
CREATE INDEX IF NOT EXISTS idx_sessions_org ON dialyse_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON dialyse_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_machine ON dialyse_sessions(machine_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON dialyse_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON dialyse_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_slot ON dialyse_sessions(slot_id);

-- Session records
CREATE INDEX IF NOT EXISTS idx_session_records_session ON dialyse_session_records(session_id);
CREATE INDEX IF NOT EXISTS idx_session_records_time ON dialyse_session_records(record_time);

-- Session incidents
CREATE INDEX IF NOT EXISTS idx_session_incidents_session ON dialyse_session_incidents(session_id);
CREATE INDEX IF NOT EXISTS idx_session_incidents_severity ON dialyse_session_incidents(severity);

-- Lab results (frequently queried for patient dashboards)
CREATE INDEX IF NOT EXISTS idx_lab_results_org ON dialyse_lab_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON dialyse_lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_date ON dialyse_lab_results(lab_date);
CREATE INDEX IF NOT EXISTS idx_lab_results_out_of_range ON dialyse_lab_results(has_out_of_range_values);

-- Clinical alerts (critical for dashboard and monitoring)
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_org ON dialyse_clinical_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_patient ON dialyse_clinical_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_status ON dialyse_clinical_alerts(status);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_severity ON dialyse_clinical_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_created ON dialyse_clinical_alerts(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sessions_org_date ON dialyse_sessions(organization_id, session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_date ON dialyse_sessions(patient_id, session_date);
CREATE INDEX IF NOT EXISTS idx_alerts_org_status_severity ON dialyse_clinical_alerts(organization_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_patients_org_status ON dialyse_patients(organization_id, patient_status);

-- ============================================================================
-- AUDIT MODULE
-- ============================================================================

-- Audit tasks
CREATE INDEX IF NOT EXISTS idx_audit_tasks_org ON audit_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_tasks_status ON audit_tasks(status);
CREATE INDEX IF NOT EXISTS idx_audit_tasks_assigned ON audit_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_audit_tasks_due ON audit_tasks(due_date);

-- Audit findings
CREATE INDEX IF NOT EXISTS idx_audit_findings_org ON audit_findings(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON audit_findings(status);

-- Risk assessments
CREATE INDEX IF NOT EXISTS idx_risk_assessments_org ON risk_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_date ON risk_assessments(assessment_date);
