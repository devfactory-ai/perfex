-- Remote Patient Monitoring (RPM) Module Migration
-- Phase 2: IoT devices, readings, programs, alerts, and compliance tracking

-- ============================================================================
-- IOT DEVICES
-- ============================================================================

-- IoT Devices Registry
CREATE TABLE IF NOT EXISTS rpm_iot_devices (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Device identification
    device_number TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    imei TEXT,
    mac_address TEXT,

    -- Device type
    device_type TEXT NOT NULL CHECK (device_type IN (
        'blood_pressure_monitor', 'glucometer', 'pulse_oximeter', 'weight_scale',
        'thermometer', 'ecg_monitor', 'spirometer', 'activity_tracker',
        'continuous_glucose_monitor', 'heart_rate_monitor', 'peak_flow_meter', 'other'
    )),
    device_subtype TEXT,

    -- Manufacturer info
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    firmware_version TEXT,

    -- Connectivity
    connectivity_type TEXT NOT NULL CHECK (connectivity_type IN (
        'bluetooth', 'wifi', 'cellular', 'usb', 'manual_entry', 'api'
    )),
    connection_details TEXT,
    last_connection_at INTEGER,
    is_online INTEGER DEFAULT 0,

    -- Battery & status
    battery_level INTEGER,
    battery_last_updated INTEGER,
    status TEXT DEFAULT 'pending_activation' CHECK (status IN (
        'active', 'inactive', 'maintenance', 'lost', 'retired', 'pending_activation'
    )),
    status_reason TEXT,

    -- Assignment
    assigned_patient_id TEXT REFERENCES healthcare_patients(id) ON DELETE SET NULL,
    assigned_at INTEGER,
    assigned_by TEXT REFERENCES users(id),

    -- Calibration
    last_calibration_date INTEGER,
    next_calibration_date INTEGER,
    calibration_interval_days INTEGER,

    -- Configuration
    reading_interval_minutes INTEGER DEFAULT 60,
    alerts_enabled INTEGER DEFAULT 1,
    device_settings TEXT,

    -- Warranty & maintenance
    purchase_date INTEGER,
    warranty_expiry INTEGER,
    last_maintenance_date INTEGER,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- IoT Device Events
CREATE TABLE IF NOT EXISTS rpm_iot_device_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL REFERENCES rpm_iot_devices(id) ON DELETE CASCADE,

    event_type TEXT NOT NULL CHECK (event_type IN (
        'connected', 'disconnected', 'battery_low', 'battery_critical',
        'firmware_update', 'calibration_due', 'error', 'data_sync',
        'assigned', 'unassigned', 'maintenance', 'status_change'
    )),
    event_at INTEGER NOT NULL DEFAULT (unixepoch()),

    event_data TEXT,
    previous_value TEXT,
    new_value TEXT,

    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    acknowledged INTEGER DEFAULT 0,
    acknowledged_by TEXT REFERENCES users(id),
    acknowledged_at INTEGER,

    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- RPM PROGRAMS
-- ============================================================================

-- RPM Programs
CREATE TABLE IF NOT EXISTS rpm_programs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Program identification
    program_code TEXT NOT NULL,
    program_name TEXT NOT NULL,
    description TEXT,

    -- Program type
    program_type TEXT NOT NULL CHECK (program_type IN (
        'hypertension', 'diabetes', 'ckd', 'chf', 'copd', 'weight_management',
        'post_surgery', 'pregnancy', 'cardiac_rehab', 'general_wellness', 'custom'
    )),

    -- Module association
    associated_module TEXT CHECK (associated_module IN (
        'dialyse', 'cardiology', 'ophthalmology', 'general'
    )),

    -- Monitoring requirements
    required_reading_types TEXT NOT NULL,
    reading_frequency TEXT,
    minimum_readings_per_week INTEGER DEFAULT 1,

    -- Alert thresholds template
    alert_thresholds TEXT,

    -- Compliance settings
    compliance_target_percent INTEGER DEFAULT 80,
    compliance_window_days INTEGER DEFAULT 7,

    -- Duration
    program_duration_days INTEGER,

    -- Billing
    cpt_code TEXT,
    billing_rate_per_month REAL,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Patient Program Enrollments
CREATE TABLE IF NOT EXISTS rpm_enrollments (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    program_id TEXT NOT NULL REFERENCES rpm_programs(id) ON DELETE CASCADE,

    -- Enrollment details
    enrollment_number TEXT NOT NULL,
    enrolled_at INTEGER NOT NULL DEFAULT (unixepoch()),
    enrolled_by TEXT NOT NULL REFERENCES users(id),

    -- Program dates
    start_date INTEGER NOT NULL,
    expected_end_date INTEGER,
    actual_end_date INTEGER,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN (
        'active', 'paused', 'completed', 'discontinued', 'expired'
    )),
    status_reason TEXT,
    status_changed_at INTEGER,
    status_changed_by TEXT REFERENCES users(id),

    -- Assigned care team
    primary_physician_id TEXT REFERENCES employees(id),
    care_coordinator_id TEXT REFERENCES employees(id),

    -- Custom thresholds
    custom_alert_thresholds TEXT,
    custom_reading_frequency TEXT,

    -- Patient goals
    patient_goals TEXT,

    -- Consent
    consent_obtained INTEGER DEFAULT 0,
    consent_date INTEGER,
    consent_document_url TEXT,

    -- Assigned devices
    assigned_devices TEXT,

    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- ALERTS
-- ============================================================================

-- RPM Alerts
CREATE TABLE IF NOT EXISTS rpm_alerts (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    enrollment_id TEXT REFERENCES rpm_enrollments(id) ON DELETE SET NULL,
    reading_id TEXT,

    -- Alert identification
    alert_number TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'threshold_exceeded', 'threshold_critical', 'missing_reading',
        'device_offline', 'compliance_low', 'trend_concern',
        'rapid_change', 'patient_reported', 'system'
    )),

    -- Alert timing
    triggered_at INTEGER NOT NULL DEFAULT (unixepoch()),

    -- Severity and priority
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    priority INTEGER DEFAULT 5,

    -- Alert details
    title TEXT NOT NULL,
    description TEXT,
    reading_type TEXT,
    reading_value TEXT,
    threshold_value TEXT,
    threshold_direction TEXT CHECK (threshold_direction IN ('above', 'below', 'outside_range')),

    -- Related data
    alert_data TEXT,

    -- Status & resolution
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new', 'acknowledged', 'in_progress', 'escalated', 'resolved', 'dismissed'
    )),

    acknowledged_at INTEGER,
    acknowledged_by TEXT REFERENCES users(id),

    resolved_at INTEGER,
    resolved_by TEXT REFERENCES users(id),
    resolution TEXT,
    resolution_action TEXT CHECK (resolution_action IN (
        'no_action_needed', 'patient_contacted', 'medication_adjusted',
        'appointment_scheduled', 'emergency_referral', 'provider_notified', 'other'
    )),

    -- Escalation
    escalated_at INTEGER,
    escalated_to TEXT REFERENCES employees(id),
    escalation_level INTEGER DEFAULT 0,
    escalation_reason TEXT,

    -- Response time tracking
    response_time_minutes INTEGER,
    resolution_time_minutes INTEGER,

    -- Notifications sent
    notifications_sent TEXT,

    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- RPM Alert Rules
CREATE TABLE IF NOT EXISTS rpm_alert_rules (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Rule scope
    program_id TEXT REFERENCES rpm_programs(id) ON DELETE CASCADE,
    patient_id TEXT REFERENCES healthcare_patients(id) ON DELETE CASCADE,

    -- Rule identification
    rule_name TEXT NOT NULL,
    rule_code TEXT NOT NULL,
    description TEXT,

    -- Rule type
    reading_type TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'threshold_high', 'threshold_low', 'range', 'trend',
        'missing_data', 'rapid_change', 'composite'
    )),

    -- Threshold values
    threshold_value REAL,
    threshold_value_secondary REAL,
    threshold_unit TEXT,

    -- For trend/change detection
    change_percent REAL,
    change_time_window_minutes INTEGER,
    consecutive_readings INTEGER,

    -- Alert configuration
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    alert_message TEXT,

    -- Escalation settings
    escalate_after_minutes INTEGER,
    escalate_to TEXT REFERENCES employees(id),

    -- Notification settings
    notify_patient INTEGER DEFAULT 0,
    notify_care_team INTEGER DEFAULT 1,
    notification_channels TEXT,

    -- Schedule
    active_hours_start TEXT,
    active_hours_end TEXT,
    active_days TEXT,

    -- Status
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 5,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- PATIENT READINGS
-- ============================================================================

-- IoT Readings
CREATE TABLE IF NOT EXISTS rpm_iot_readings (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    device_id TEXT REFERENCES rpm_iot_devices(id) ON DELETE SET NULL,
    program_id TEXT REFERENCES rpm_programs(id) ON DELETE SET NULL,

    -- Reading identification
    reading_number TEXT NOT NULL,
    reading_type TEXT NOT NULL CHECK (reading_type IN (
        'blood_pressure', 'blood_glucose', 'oxygen_saturation', 'weight',
        'temperature', 'heart_rate', 'respiratory_rate', 'peak_flow',
        'ecg', 'activity', 'sleep', 'spirometry', 'other'
    )),

    -- Timestamp
    measured_at INTEGER NOT NULL,
    received_at INTEGER NOT NULL DEFAULT (unixepoch()),

    -- Values
    primary_value REAL NOT NULL,
    primary_unit TEXT NOT NULL,
    secondary_value REAL,
    secondary_unit TEXT,
    tertiary_value REAL,
    tertiary_unit TEXT,

    -- Structured reading data
    reading_data TEXT,

    -- Reading context
    context TEXT CHECK (context IN (
        'fasting', 'post_meal', 'before_meal', 'before_exercise', 'after_exercise',
        'resting', 'morning', 'evening', 'before_medication', 'after_medication',
        'random', 'scheduled'
    )),
    body_position TEXT CHECK (body_position IN ('sitting', 'standing', 'lying', 'other')),
    activity_level TEXT CHECK (activity_level IN ('resting', 'light', 'moderate', 'vigorous')),

    -- Quality indicators
    quality_score INTEGER,
    is_valid INTEGER DEFAULT 1,
    invalid_reason TEXT,

    -- Alert status
    triggered_alert INTEGER DEFAULT 0,
    alert_id TEXT REFERENCES rpm_alerts(id),

    -- Normal range comparison
    is_within_range INTEGER,
    deviation_percent REAL,

    -- Entry method
    entry_method TEXT NOT NULL CHECK (entry_method IN (
        'device_automatic', 'device_manual', 'patient_manual', 'provider_entry', 'api_sync'
    )),

    -- Patient notes
    patient_notes TEXT,
    symptoms TEXT,

    -- Review status
    reviewed_by TEXT REFERENCES employees(id),
    reviewed_at INTEGER,
    review_notes TEXT,

    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- COMPLIANCE & BILLING
-- ============================================================================

-- RPM Compliance Records
CREATE TABLE IF NOT EXISTS rpm_compliance (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    enrollment_id TEXT NOT NULL REFERENCES rpm_enrollments(id) ON DELETE CASCADE,

    -- Period
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start INTEGER NOT NULL,
    period_end INTEGER NOT NULL,

    -- Reading counts
    expected_readings INTEGER NOT NULL,
    actual_readings INTEGER NOT NULL,
    valid_readings INTEGER NOT NULL,

    -- Compliance metrics
    compliance_percent REAL NOT NULL,
    is_compliant INTEGER NOT NULL,

    -- By reading type breakdown
    reading_breakdown TEXT,

    -- Device usage
    device_usage_days INTEGER,
    average_readings_per_day REAL,

    -- Trend indicators
    compliance_trend TEXT CHECK (compliance_trend IN ('improving', 'stable', 'declining')),
    previous_period_percent REAL,

    -- Billing eligibility
    meets_billing_requirements INTEGER,
    billing_minutes_logged INTEGER,

    -- Actions taken
    outreach_attempted INTEGER DEFAULT 0,
    outreach_date INTEGER,
    outreach_method TEXT,
    outreach_notes TEXT,

    calculated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- RPM Time Logs
CREATE TABLE IF NOT EXISTS rpm_time_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    enrollment_id TEXT NOT NULL REFERENCES rpm_enrollments(id) ON DELETE CASCADE,

    -- Provider info
    provider_id TEXT NOT NULL REFERENCES employees(id),

    -- Time entry
    activity_date INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,

    -- Activity type
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'data_review', 'patient_education', 'care_coordination',
        'phone_consultation', 'alert_response', 'treatment_adjustment',
        'documentation', 'device_setup', 'other'
    )),

    description TEXT,

    -- Related records
    related_alert_id TEXT REFERENCES rpm_alerts(id),
    related_reading_ids TEXT,

    -- Billing
    is_billable INTEGER DEFAULT 1,
    billed_at INTEGER,
    billing_period_id TEXT,

    notes TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- RPM Billing Periods
CREATE TABLE IF NOT EXISTS rpm_billing_periods (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES healthcare_patients(id) ON DELETE CASCADE,
    enrollment_id TEXT NOT NULL REFERENCES rpm_enrollments(id) ON DELETE CASCADE,

    -- Period
    period_month INTEGER NOT NULL,
    period_start INTEGER NOT NULL,
    period_end INTEGER NOT NULL,

    -- Time tracking
    total_minutes_logged INTEGER NOT NULL DEFAULT 0,
    device_setup_minutes INTEGER DEFAULT 0,
    monitoring_minutes INTEGER DEFAULT 0,

    -- Reading counts
    total_readings INTEGER NOT NULL DEFAULT 0,
    days_with_readings INTEGER NOT NULL DEFAULT 0,

    -- Billing eligibility
    meets_time_threshold INTEGER DEFAULT 0,
    meets_data_threshold INTEGER DEFAULT 0,
    is_billable INTEGER DEFAULT 0,

    -- Billing codes
    cpt_codes TEXT,

    -- Billing status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'ready_to_bill', 'billed', 'paid', 'denied', 'appealed'
    )),

    billed_amount REAL,
    billed_at INTEGER,
    claim_number TEXT,

    paid_amount REAL,
    paid_at INTEGER,

    denial_reason TEXT,

    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- IoT Devices indexes
CREATE INDEX IF NOT EXISTS idx_rpm_iot_devices_org ON rpm_iot_devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_rpm_iot_devices_patient ON rpm_iot_devices(assigned_patient_id);
CREATE INDEX IF NOT EXISTS idx_rpm_iot_devices_type ON rpm_iot_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_rpm_iot_devices_status ON rpm_iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_rpm_iot_devices_serial ON rpm_iot_devices(serial_number);

-- Device events indexes
CREATE INDEX IF NOT EXISTS idx_rpm_device_events_device ON rpm_iot_device_events(device_id);
CREATE INDEX IF NOT EXISTS idx_rpm_device_events_type ON rpm_iot_device_events(event_type);
CREATE INDEX IF NOT EXISTS idx_rpm_device_events_date ON rpm_iot_device_events(event_at);

-- Programs indexes
CREATE INDEX IF NOT EXISTS idx_rpm_programs_org ON rpm_programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_rpm_programs_type ON rpm_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_rpm_programs_status ON rpm_programs(status);

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_rpm_enrollments_org ON rpm_enrollments(organization_id);
CREATE INDEX IF NOT EXISTS idx_rpm_enrollments_patient ON rpm_enrollments(patient_id);
CREATE INDEX IF NOT EXISTS idx_rpm_enrollments_program ON rpm_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_rpm_enrollments_status ON rpm_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_rpm_enrollments_dates ON rpm_enrollments(start_date, expected_end_date);

-- Readings indexes
CREATE INDEX IF NOT EXISTS idx_rpm_readings_org ON rpm_iot_readings(organization_id);
CREATE INDEX IF NOT EXISTS idx_rpm_readings_patient ON rpm_iot_readings(patient_id);
CREATE INDEX IF NOT EXISTS idx_rpm_readings_device ON rpm_iot_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_rpm_readings_program ON rpm_iot_readings(program_id);
CREATE INDEX IF NOT EXISTS idx_rpm_readings_type ON rpm_iot_readings(reading_type);
CREATE INDEX IF NOT EXISTS idx_rpm_readings_measured ON rpm_iot_readings(measured_at);
CREATE INDEX IF NOT EXISTS idx_rpm_readings_patient_date ON rpm_iot_readings(patient_id, measured_at);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_rpm_alerts_org ON rpm_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_rpm_alerts_patient ON rpm_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_rpm_alerts_enrollment ON rpm_alerts(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_rpm_alerts_type ON rpm_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_rpm_alerts_severity ON rpm_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_rpm_alerts_status ON rpm_alerts(status);
CREATE INDEX IF NOT EXISTS idx_rpm_alerts_triggered ON rpm_alerts(triggered_at);

-- Alert rules indexes
CREATE INDEX IF NOT EXISTS idx_rpm_alert_rules_org ON rpm_alert_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_rpm_alert_rules_program ON rpm_alert_rules(program_id);
CREATE INDEX IF NOT EXISTS idx_rpm_alert_rules_patient ON rpm_alert_rules(patient_id);
CREATE INDEX IF NOT EXISTS idx_rpm_alert_rules_type ON rpm_alert_rules(reading_type);

-- Compliance indexes
CREATE INDEX IF NOT EXISTS idx_rpm_compliance_org ON rpm_compliance(organization_id);
CREATE INDEX IF NOT EXISTS idx_rpm_compliance_patient ON rpm_compliance(patient_id);
CREATE INDEX IF NOT EXISTS idx_rpm_compliance_enrollment ON rpm_compliance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_rpm_compliance_period ON rpm_compliance(period_start, period_end);

-- Time logs indexes
CREATE INDEX IF NOT EXISTS idx_rpm_time_logs_org ON rpm_time_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_rpm_time_logs_patient ON rpm_time_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_rpm_time_logs_provider ON rpm_time_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_rpm_time_logs_date ON rpm_time_logs(activity_date);

-- Billing periods indexes
CREATE INDEX IF NOT EXISTS idx_rpm_billing_org ON rpm_billing_periods(organization_id);
CREATE INDEX IF NOT EXISTS idx_rpm_billing_patient ON rpm_billing_periods(patient_id);
CREATE INDEX IF NOT EXISTS idx_rpm_billing_enrollment ON rpm_billing_periods(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_rpm_billing_month ON rpm_billing_periods(period_month);
CREATE INDEX IF NOT EXISTS idx_rpm_billing_status ON rpm_billing_periods(status);
