-- Migration: Audit Trail System for HIPAA/GDPR Compliance
-- Comprehensive logging of all healthcare data access and modifications

-- ============================================================================
-- Audit Trail Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_trail (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_email TEXT,
    user_name TEXT,
    user_role TEXT,
    ip_address TEXT,
    user_agent TEXT,
    action TEXT NOT NULL CHECK (action IN (
        'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'PRINT',
        'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE',
        'PERMISSION_CHANGE', 'ACCESS_DENIED'
    )),
    module TEXT NOT NULL CHECK (module IN (
        'auth', 'users', 'patients', 'dialyse', 'cardiology', 'ophthalmology',
        'consultations', 'prescriptions', 'lab_results', 'documents',
        'billing', 'reports', 'settings', 'system'
    )),
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    resource_name TEXT,
    patient_id TEXT,
    patient_name TEXT,
    description TEXT NOT NULL,
    previous_values TEXT, -- JSON
    new_values TEXT, -- JSON
    changed_fields TEXT, -- JSON array
    metadata TEXT, -- JSON
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    success INTEGER NOT NULL DEFAULT 1,
    error_message TEXT,
    session_id TEXT,
    request_id TEXT
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_audit_trail_org_timestamp
    ON audit_trail(organization_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_trail_user
    ON audit_trail(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_trail_patient
    ON audit_trail(patient_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_trail_resource
    ON audit_trail(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_trail_action
    ON audit_trail(action, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_trail_module
    ON audit_trail(module, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_trail_severity
    ON audit_trail(severity, timestamp DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_trail_org_module_action
    ON audit_trail(organization_id, module, action, timestamp DESC);

-- ============================================================================
-- Healthcare Performance Indexes (Phase 1.4)
-- ============================================================================

-- Dialyse module indexes
CREATE INDEX IF NOT EXISTS idx_dialyse_patients_org_status
    ON dialyse_patients(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_dialyse_patients_serology
    ON dialyse_patients(organization_id, hbsag_status, hcv_status, hiv_status);

CREATE INDEX IF NOT EXISTS idx_dialyse_sessions_patient_date
    ON dialyse_sessions(patient_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_dialyse_sessions_machine_date
    ON dialyse_sessions(machine_id, session_date);

CREATE INDEX IF NOT EXISTS idx_dialyse_sessions_org_date
    ON dialyse_sessions(organization_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_dialyse_prescriptions_patient
    ON dialyse_prescriptions(patient_id, status);

CREATE INDEX IF NOT EXISTS idx_dialyse_lab_results_patient_date
    ON dialyse_lab_results(patient_id, collection_date DESC);

CREATE INDEX IF NOT EXISTS idx_dialyse_clinical_alerts_patient
    ON dialyse_clinical_alerts(patient_id, status, severity);

CREATE INDEX IF NOT EXISTS idx_dialyse_machines_org_status
    ON dialyse_machines(organization_id, status);

-- Cardiology module indexes
CREATE INDEX IF NOT EXISTS idx_cardiology_ecg_patient_date
    ON cardiology_ecg_records(patient_id, recording_date DESC);

CREATE INDEX IF NOT EXISTS idx_cardiology_echo_patient_date
    ON cardiology_echocardiograms(patient_id, exam_date DESC);

CREATE INDEX IF NOT EXISTS idx_cardiology_medications_patient
    ON cardiology_medications(patient_id, status);

CREATE INDEX IF NOT EXISTS idx_cardiology_risk_scores_patient
    ON cardiology_risk_scores(patient_id, calculated_date DESC);

CREATE INDEX IF NOT EXISTS idx_cardiology_events_patient_date
    ON cardiology_events(patient_id, event_date DESC);

-- Ophthalmology module indexes
CREATE INDEX IF NOT EXISTS idx_ophthalmology_oct_patient_date
    ON ophthalmology_oct_scans(patient_id, scan_date DESC);

CREATE INDEX IF NOT EXISTS idx_ophthalmology_visual_fields_patient
    ON ophthalmology_visual_fields(patient_id, exam_date DESC);

CREATE INDEX IF NOT EXISTS idx_ophthalmology_ivt_patient_date
    ON ophthalmology_ivt_injections(patient_id, injection_date DESC);

CREATE INDEX IF NOT EXISTS idx_ophthalmology_surgeries_patient
    ON ophthalmology_surgeries(patient_id, surgery_date DESC);

-- Healthcare shared indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_patients_org_status
    ON healthcare_patients(company_id, status);

CREATE INDEX IF NOT EXISTS idx_healthcare_consultations_patient
    ON healthcare_consultations(patient_id, consultation_date DESC);

CREATE INDEX IF NOT EXISTS idx_healthcare_appointments_org_date
    ON healthcare_appointments(organization_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_healthcare_alerts_org_status
    ON healthcare_alerts(organization_id, status, severity);

-- ============================================================================
-- Audit Trail Summary Views (for reporting)
-- ============================================================================

-- Note: SQLite doesn't support materialized views, but we can create regular views
-- that can be used for reporting

CREATE VIEW IF NOT EXISTS v_audit_summary_by_user AS
SELECT
    organization_id,
    user_id,
    user_email,
    DATE(timestamp) as date,
    action,
    COUNT(*) as action_count
FROM audit_trail
GROUP BY organization_id, user_id, user_email, DATE(timestamp), action;

CREATE VIEW IF NOT EXISTS v_audit_summary_by_module AS
SELECT
    organization_id,
    module,
    DATE(timestamp) as date,
    action,
    severity,
    COUNT(*) as action_count
FROM audit_trail
GROUP BY organization_id, module, DATE(timestamp), action, severity;

CREATE VIEW IF NOT EXISTS v_audit_patient_access AS
SELECT
    organization_id,
    patient_id,
    patient_name,
    user_id,
    user_email,
    action,
    resource_type,
    timestamp,
    description
FROM audit_trail
WHERE patient_id IS NOT NULL
ORDER BY timestamp DESC;
