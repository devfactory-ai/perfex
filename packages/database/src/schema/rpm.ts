/**
 * Remote Patient Monitoring (RPM) Module Schema
 * IoT devices management, patient readings, monitoring programs, and alerts
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';
import { healthcarePatients } from './healthcare';
import { employees } from './hr';

// ============================================================================
// IOT DEVICES
// ============================================================================

/**
 * IoT Devices Registry
 * Medical devices for remote patient monitoring (blood pressure monitors, glucometers, etc.)
 */
export const iotDevices = sqliteTable('rpm_iot_devices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Device identification
  deviceNumber: text('device_number').notNull(), // Internal device ID
  serialNumber: text('serial_number').notNull(),
  imei: text('imei'), // For cellular devices
  macAddress: text('mac_address'), // For Bluetooth/WiFi devices

  // Device type
  deviceType: text('device_type', {
    enum: ['blood_pressure_monitor', 'glucometer', 'pulse_oximeter', 'weight_scale',
           'thermometer', 'ecg_monitor', 'spirometer', 'activity_tracker',
           'continuous_glucose_monitor', 'heart_rate_monitor', 'peak_flow_meter', 'other']
  }).notNull(),
  deviceSubtype: text('device_subtype'), // More specific classification

  // Manufacturer info
  manufacturer: text('manufacturer').notNull(),
  model: text('model').notNull(),
  firmwareVersion: text('firmware_version'),

  // Connectivity
  connectivityType: text('connectivity_type', {
    enum: ['bluetooth', 'wifi', 'cellular', 'usb', 'manual_entry', 'api']
  }).notNull(),
  connectionDetails: text('connection_details'), // JSON - connection credentials/settings
  lastConnectionAt: integer('last_connection_at', { mode: 'timestamp' }),
  isOnline: integer('is_online', { mode: 'boolean' }).default(false),

  // Battery & status
  batteryLevel: integer('battery_level'), // 0-100
  batteryLastUpdated: integer('battery_last_updated', { mode: 'timestamp' }),
  status: text('status', {
    enum: ['active', 'inactive', 'maintenance', 'lost', 'retired', 'pending_activation']
  }).default('pending_activation'),
  statusReason: text('status_reason'),

  // Assignment
  assignedPatientId: text('assigned_patient_id').references(() => healthcarePatients.id, { onDelete: 'set null' }),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }),
  assignedBy: text('assigned_by').references(() => users.id),

  // Calibration
  lastCalibrationDate: integer('last_calibration_date', { mode: 'timestamp' }),
  nextCalibrationDate: integer('next_calibration_date', { mode: 'timestamp' }),
  calibrationIntervalDays: integer('calibration_interval_days'),

  // Configuration
  readingIntervalMinutes: integer('reading_interval_minutes').default(60),
  alertsEnabled: integer('alerts_enabled', { mode: 'boolean' }).default(true),
  deviceSettings: text('device_settings'), // JSON - device-specific settings

  // Warranty & maintenance
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  warrantyExpiry: integer('warranty_expiry', { mode: 'timestamp' }),
  lastMaintenanceDate: integer('last_maintenance_date', { mode: 'timestamp' }),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * IoT Device Events
 * Device lifecycle events (connection, disconnection, errors, updates)
 */
export const iotDeviceEvents = sqliteTable('rpm_iot_device_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull().references(() => iotDevices.id, { onDelete: 'cascade' }),

  eventType: text('event_type', {
    enum: ['connected', 'disconnected', 'battery_low', 'battery_critical',
           'firmware_update', 'calibration_due', 'error', 'data_sync',
           'assigned', 'unassigned', 'maintenance', 'status_change']
  }).notNull(),
  eventAt: integer('event_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  eventData: text('event_data'), // JSON - event-specific data
  previousValue: text('previous_value'),
  newValue: text('new_value'),

  severity: text('severity', { enum: ['info', 'warning', 'error', 'critical'] }).default('info'),
  acknowledged: integer('acknowledged', { mode: 'boolean' }).default(false),
  acknowledgedBy: text('acknowledged_by').references(() => users.id),
  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// PATIENT READINGS
// ============================================================================

/**
 * IoT Readings
 * All patient readings from IoT devices
 */
export const iotReadings = sqliteTable('rpm_iot_readings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').references(() => iotDevices.id, { onDelete: 'set null' }),
  programId: text('program_id').references(() => rpmPrograms.id, { onDelete: 'set null' }),

  // Reading identification
  readingNumber: text('reading_number').notNull(),
  readingType: text('reading_type', {
    enum: ['blood_pressure', 'blood_glucose', 'oxygen_saturation', 'weight',
           'temperature', 'heart_rate', 'respiratory_rate', 'peak_flow',
           'ecg', 'activity', 'sleep', 'spirometry', 'other']
  }).notNull(),

  // Timestamp
  measuredAt: integer('measured_at', { mode: 'timestamp' }).notNull(),
  receivedAt: integer('received_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  // Values - flexible schema for different reading types
  primaryValue: real('primary_value').notNull(), // Main measurement
  primaryUnit: text('primary_unit').notNull(), // mmHg, mg/dL, %, kg, etc.
  secondaryValue: real('secondary_value'), // e.g., diastolic for BP
  secondaryUnit: text('secondary_unit'),
  tertiaryValue: real('tertiary_value'), // e.g., pulse for BP
  tertiaryUnit: text('tertiary_unit'),

  // Structured reading data (JSON for complex readings like ECG)
  readingData: text('reading_data'), // JSON - full reading details

  // Reading context
  context: text('context', {
    enum: ['fasting', 'post_meal', 'before_meal', 'before_exercise', 'after_exercise',
           'resting', 'morning', 'evening', 'before_medication', 'after_medication',
           'random', 'scheduled']
  }),
  bodyPosition: text('body_position', { enum: ['sitting', 'standing', 'lying', 'other'] }),
  activityLevel: text('activity_level', { enum: ['resting', 'light', 'moderate', 'vigorous'] }),

  // Quality indicators
  qualityScore: integer('quality_score'), // 0-100, device-reported quality
  isValid: integer('is_valid', { mode: 'boolean' }).default(true),
  invalidReason: text('invalid_reason'),

  // Alert status
  triggeredAlert: integer('triggered_alert', { mode: 'boolean' }).default(false),
  alertId: text('alert_id'), // Reference to rpmAlerts.id (no FK constraint to avoid circular reference)

  // Normal range comparison
  isWithinRange: integer('is_within_range', { mode: 'boolean' }),
  deviationPercent: real('deviation_percent'), // % deviation from target

  // Entry method
  entryMethod: text('entry_method', {
    enum: ['device_automatic', 'device_manual', 'patient_manual', 'provider_entry', 'api_sync']
  }).notNull(),

  // Patient notes
  patientNotes: text('patient_notes'),
  symptoms: text('symptoms'), // JSON array

  // Review status
  reviewedBy: text('reviewed_by').references(() => employees.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewNotes: text('review_notes'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// RPM PROGRAMS
// ============================================================================

/**
 * RPM Programs
 * Monitoring programs for specific conditions (hypertension, diabetes, CKD, etc.)
 */
export const rpmPrograms = sqliteTable('rpm_programs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Program identification
  programCode: text('program_code').notNull(),
  programName: text('program_name').notNull(),
  description: text('description'),

  // Program type
  programType: text('program_type', {
    enum: ['hypertension', 'diabetes', 'ckd', 'chf', 'copd', 'weight_management',
           'post_surgery', 'pregnancy', 'cardiac_rehab', 'general_wellness', 'custom']
  }).notNull(),

  // Module association
  associatedModule: text('associated_module', {
    enum: ['dialyse', 'cardiology', 'ophthalmology', 'general']
  }),

  // Monitoring requirements
  requiredReadingTypes: text('required_reading_types').notNull(), // JSON array
  readingFrequency: text('reading_frequency'), // JSON - e.g., {"blood_pressure": "twice_daily"}
  minimumReadingsPerWeek: integer('minimum_readings_per_week').default(1),

  // Alert thresholds template
  alertThresholds: text('alert_thresholds'), // JSON - default thresholds for this program

  // Compliance settings
  complianceTargetPercent: integer('compliance_target_percent').default(80),
  complianceWindowDays: integer('compliance_window_days').default(7),

  // Duration
  programDurationDays: integer('program_duration_days'), // null = indefinite

  // Billing
  cptCode: text('cpt_code'), // CPT billing code
  billingRatePerMonth: real('billing_rate_per_month'),

  // Status
  status: text('status', { enum: ['active', 'inactive', 'archived'] }).default('active'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Patient Program Enrollments
 * Patients enrolled in RPM programs
 */
export const rpmEnrollments = sqliteTable('rpm_enrollments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  programId: text('program_id').notNull().references(() => rpmPrograms.id, { onDelete: 'cascade' }),

  // Enrollment details
  enrollmentNumber: text('enrollment_number').notNull(),
  enrolledAt: integer('enrolled_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  enrolledBy: text('enrolled_by').notNull().references(() => users.id),

  // Program dates
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  expectedEndDate: integer('expected_end_date', { mode: 'timestamp' }),
  actualEndDate: integer('actual_end_date', { mode: 'timestamp' }),

  // Status
  status: text('status', {
    enum: ['active', 'paused', 'completed', 'discontinued', 'expired']
  }).default('active'),
  statusReason: text('status_reason'),
  statusChangedAt: integer('status_changed_at', { mode: 'timestamp' }),
  statusChangedBy: text('status_changed_by').references(() => users.id),

  // Assigned care team
  primaryPhysicianId: text('primary_physician_id').references(() => employees.id),
  careCoordinatorId: text('care_coordinator_id').references(() => employees.id),

  // Custom thresholds (overrides program defaults)
  customAlertThresholds: text('custom_alert_thresholds'), // JSON
  customReadingFrequency: text('custom_reading_frequency'), // JSON

  // Patient goals
  patientGoals: text('patient_goals'), // JSON - target values

  // Consent
  consentObtained: integer('consent_obtained', { mode: 'boolean' }).default(false),
  consentDate: integer('consent_date', { mode: 'timestamp' }),
  consentDocumentUrl: text('consent_document_url'),

  // Assigned devices
  assignedDevices: text('assigned_devices'), // JSON array of device IDs

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// ALERTS & NOTIFICATIONS
// ============================================================================

/**
 * RPM Alerts
 * Alerts generated from patient readings
 */
export const rpmAlerts = sqliteTable('rpm_alerts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  enrollmentId: text('enrollment_id').references(() => rpmEnrollments.id, { onDelete: 'set null' }),
  readingId: text('reading_id').references(() => iotReadings.id, { onDelete: 'set null' }),

  // Alert identification
  alertNumber: text('alert_number').notNull(),
  alertType: text('alert_type', {
    enum: ['threshold_exceeded', 'threshold_critical', 'missing_reading',
           'device_offline', 'compliance_low', 'trend_concern',
           'rapid_change', 'patient_reported', 'system']
  }).notNull(),

  // Alert timing
  triggeredAt: integer('triggered_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  // Severity and priority
  severity: text('severity', {
    enum: ['low', 'medium', 'high', 'critical']
  }).notNull(),
  priority: integer('priority').default(5), // 1 = highest, 10 = lowest

  // Alert details
  title: text('title').notNull(),
  description: text('description'),
  readingType: text('reading_type'),
  readingValue: text('reading_value'),
  thresholdValue: text('threshold_value'),
  thresholdDirection: text('threshold_direction', { enum: ['above', 'below', 'outside_range'] }),

  // Related data
  alertData: text('alert_data'), // JSON - additional context

  // Status & resolution
  status: text('status', {
    enum: ['new', 'acknowledged', 'in_progress', 'escalated', 'resolved', 'dismissed']
  }).default('new'),

  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
  acknowledgedBy: text('acknowledged_by').references(() => users.id),

  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolvedBy: text('resolved_by').references(() => users.id),
  resolution: text('resolution'),
  resolutionAction: text('resolution_action', {
    enum: ['no_action_needed', 'patient_contacted', 'medication_adjusted',
           'appointment_scheduled', 'emergency_referral', 'provider_notified', 'other']
  }),

  // Escalation
  escalatedAt: integer('escalated_at', { mode: 'timestamp' }),
  escalatedTo: text('escalated_to').references(() => employees.id),
  escalationLevel: integer('escalation_level').default(0),
  escalationReason: text('escalation_reason'),

  // Response time tracking
  responseTimeMinutes: integer('response_time_minutes'),
  resolutionTimeMinutes: integer('resolution_time_minutes'),

  // Notifications sent
  notificationsSent: text('notifications_sent'), // JSON - list of notifications

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * RPM Alert Rules
 * Configurable alert thresholds and rules
 */
export const rpmAlertRules = sqliteTable('rpm_alert_rules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Rule scope
  programId: text('program_id').references(() => rpmPrograms.id, { onDelete: 'cascade' }), // null = org-wide
  patientId: text('patient_id').references(() => healthcarePatients.id, { onDelete: 'cascade' }), // null = program/org-wide

  // Rule identification
  ruleName: text('rule_name').notNull(),
  ruleCode: text('rule_code').notNull(),
  description: text('description'),

  // Rule type
  readingType: text('reading_type').notNull(),
  ruleType: text('rule_type', {
    enum: ['threshold_high', 'threshold_low', 'range', 'trend',
           'missing_data', 'rapid_change', 'composite']
  }).notNull(),

  // Threshold values
  thresholdValue: real('threshold_value'),
  thresholdValueSecondary: real('threshold_value_secondary'), // For range rules
  thresholdUnit: text('threshold_unit'),

  // For trend/change detection
  changePercent: real('change_percent'),
  changeTimeWindowMinutes: integer('change_time_window_minutes'),
  consecutiveReadings: integer('consecutive_readings'), // Readings needed to trigger

  // Alert configuration
  severity: text('severity', {
    enum: ['low', 'medium', 'high', 'critical']
  }).notNull(),
  alertMessage: text('alert_message'),

  // Escalation settings
  escalateAfterMinutes: integer('escalate_after_minutes'),
  escalateTo: text('escalate_to').references(() => employees.id),

  // Notification settings
  notifyPatient: integer('notify_patient', { mode: 'boolean' }).default(false),
  notifyCareTeam: integer('notify_care_team', { mode: 'boolean' }).default(true),
  notificationChannels: text('notification_channels'), // JSON - ["sms", "email", "push"]

  // Schedule (when rule is active)
  activeHoursStart: text('active_hours_start'), // "08:00"
  activeHoursEnd: text('active_hours_end'), // "22:00"
  activeDays: text('active_days'), // JSON - [0,1,2,3,4,5,6] (Sunday = 0)

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  priority: integer('priority').default(5),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// COMPLIANCE & REPORTING
// ============================================================================

/**
 * RPM Compliance Records
 * Weekly/monthly compliance tracking
 */
export const rpmCompliance = sqliteTable('rpm_compliance', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  enrollmentId: text('enrollment_id').notNull().references(() => rpmEnrollments.id, { onDelete: 'cascade' }),

  // Period
  periodType: text('period_type', { enum: ['daily', 'weekly', 'monthly'] }).notNull(),
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),

  // Reading counts
  expectedReadings: integer('expected_readings').notNull(),
  actualReadings: integer('actual_readings').notNull(),
  validReadings: integer('valid_readings').notNull(),

  // Compliance metrics
  compliancePercent: real('compliance_percent').notNull(),
  isCompliant: integer('is_compliant', { mode: 'boolean' }).notNull(),

  // By reading type breakdown
  readingBreakdown: text('reading_breakdown'), // JSON - by type compliance

  // Device usage
  deviceUsageDays: integer('device_usage_days'),
  averageReadingsPerDay: real('average_readings_per_day'),

  // Trend indicators
  complianceTrend: text('compliance_trend', { enum: ['improving', 'stable', 'declining'] }),
  previousPeriodPercent: real('previous_period_percent'),

  // Billing eligibility
  meetsBillingRequirements: integer('meets_billing_requirements', { mode: 'boolean' }),
  billingMinutesLogged: integer('billing_minutes_logged'),

  // Actions taken
  outreachAttempted: integer('outreach_attempted', { mode: 'boolean' }).default(false),
  outreachDate: integer('outreach_date', { mode: 'timestamp' }),
  outreachMethod: text('outreach_method'),
  outreachNotes: text('outreach_notes'),

  calculatedAt: integer('calculated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * RPM Time Logs
 * Time spent by care team on RPM activities (for billing)
 */
export const rpmTimeLogs = sqliteTable('rpm_time_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  enrollmentId: text('enrollment_id').notNull().references(() => rpmEnrollments.id, { onDelete: 'cascade' }),

  // Provider info
  providerId: text('provider_id').notNull().references(() => employees.id),

  // Time entry
  activityDate: integer('activity_date', { mode: 'timestamp' }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),

  // Activity type
  activityType: text('activity_type', {
    enum: ['data_review', 'patient_education', 'care_coordination',
           'phone_consultation', 'alert_response', 'treatment_adjustment',
           'documentation', 'device_setup', 'other']
  }).notNull(),

  description: text('description'),

  // Related records
  relatedAlertId: text('related_alert_id').references(() => rpmAlerts.id),
  relatedReadingIds: text('related_reading_ids'), // JSON array

  // Billing
  isBillable: integer('is_billable', { mode: 'boolean' }).default(true),
  billedAt: integer('billed_at', { mode: 'timestamp' }),
  billingPeriodId: text('billing_period_id'),

  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * RPM Billing Periods
 * Monthly billing periods for RPM services
 */
export const rpmBillingPeriods = sqliteTable('rpm_billing_periods', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  enrollmentId: text('enrollment_id').notNull().references(() => rpmEnrollments.id, { onDelete: 'cascade' }),

  // Period
  periodMonth: integer('period_month').notNull(), // YYYYMM format
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),

  // Time tracking
  totalMinutesLogged: integer('total_minutes_logged').notNull().default(0),
  deviceSetupMinutes: integer('device_setup_minutes').default(0),
  monitoringMinutes: integer('monitoring_minutes').default(0),

  // Reading counts
  totalReadings: integer('total_readings').notNull().default(0),
  daysWithReadings: integer('days_with_readings').notNull().default(0),

  // Billing eligibility
  meetsTimeThreshold: integer('meets_time_threshold', { mode: 'boolean' }).default(false), // >= 20 min
  meetsDataThreshold: integer('meets_data_threshold', { mode: 'boolean' }).default(false), // >= 16 days
  isBillable: integer('is_billable', { mode: 'boolean' }).default(false),

  // Billing codes
  cptCodes: text('cpt_codes'), // JSON array - applicable CPT codes

  // Billing status
  status: text('status', {
    enum: ['pending', 'ready_to_bill', 'billed', 'paid', 'denied', 'appealed']
  }).default('pending'),

  billedAmount: real('billed_amount'),
  billedAt: integer('billed_at', { mode: 'timestamp' }),
  claimNumber: text('claim_number'),

  paidAmount: real('paid_amount'),
  paidAt: integer('paid_at', { mode: 'timestamp' }),

  denialReason: text('denial_reason'),

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
