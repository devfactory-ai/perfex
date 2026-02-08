/**
 * Patient Portal Schema
 * Tables for patient self-service portal: authentication, appointments, messaging, symptom tracking
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { healthcarePatients, healthcareAppointments } from './healthcare';

// ============================================================================
// PORTAL USER AUTHENTICATION
// ============================================================================

/**
 * Portal Users
 * Patient portal authentication and profile management
 */
export const portalUsers = sqliteTable('portal_users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Authentication
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  phone: text('phone'),

  // Verification status
  isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).default(false),
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp' }),
  isPhoneVerified: integer('is_phone_verified', { mode: 'boolean' }).default(false),
  phoneVerifiedAt: integer('phone_verified_at', { mode: 'timestamp' }),

  // Two-factor authentication
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).default(false),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorMethod: text('two_factor_method', { enum: ['app', 'sms', 'email'] }),
  backupCodes: text('backup_codes'), // JSON array of encrypted codes

  // Login tracking
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  lastLoginIp: text('last_login_ip'),
  lastLoginUserAgent: text('last_login_user_agent'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),

  // Preferences
  language: text('language').default('fr'),
  timezone: text('timezone').default('Europe/Paris'),
  notificationPreferences: text('notification_preferences'), // JSON
  accessibilitySettings: text('accessibility_settings'), // JSON

  // Consent and terms
  termsAcceptedAt: integer('terms_accepted_at', { mode: 'timestamp' }),
  termsVersion: text('terms_version'),
  privacyAcceptedAt: integer('privacy_accepted_at', { mode: 'timestamp' }),
  privacyVersion: text('privacy_version'),

  // Account status
  status: text('status', {
    enum: ['pending_verification', 'active', 'suspended', 'deactivated', 'locked']
  }).default('pending_verification'),
  deactivatedAt: integer('deactivated_at', { mode: 'timestamp' }),
  deactivationReason: text('deactivation_reason'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// PORTAL SESSIONS
// ============================================================================

/**
 * Portal Sessions
 * Active sessions for portal users
 */
export const portalSessions = sqliteTable('portal_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text('portal_user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Session info
  token: text('token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  refreshExpiresAt: integer('refresh_expires_at', { mode: 'timestamp' }),

  // Device info
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceType: text('device_type', { enum: ['desktop', 'mobile', 'tablet'] }),
  deviceName: text('device_name'),

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokedReason: text('revoked_reason'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastActivityAt: integer('last_activity_at', { mode: 'timestamp' }),
});

// ============================================================================
// APPOINTMENT REQUESTS
// ============================================================================

/**
 * Appointment Requests
 * Patient-initiated appointment booking requests
 */
export const appointmentRequests = sqliteTable('appointment_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text('portal_user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Request type
  requestType: text('request_type', {
    enum: ['new', 'reschedule', 'cancel', 'followup']
  }).notNull(),

  // Original appointment (for reschedule/cancel)
  originalAppointmentId: text('original_appointment_id').references(() => healthcareAppointments.id, { onDelete: 'set null' }),

  // Preferences
  preferredDates: text('preferred_dates'), // JSON array of date strings
  preferredTimeOfDay: text('preferred_time_of_day', { enum: ['morning', 'afternoon', 'evening', 'any'] }),
  preferredProviderId: text('preferred_provider_id').references(() => users.id, { onDelete: 'set null' }),

  // Appointment details
  appointmentType: text('appointment_type'),
  module: text('module', { enum: ['dialyse', 'cardiology', 'ophthalmology', 'general'] }).default('general'),
  specialtyRequested: text('specialty_requested'),
  reason: text('reason').notNull(),
  urgency: text('urgency', { enum: ['routine', 'soon', 'urgent'] }).default('routine'),
  notes: text('notes'),

  // Duration estimate
  estimatedDuration: integer('estimated_duration'), // minutes

  // Processing
  status: text('status', {
    enum: ['pending', 'processing', 'approved', 'denied', 'cancelled', 'expired']
  }).default('pending'),
  processedBy: text('processed_by').references(() => users.id, { onDelete: 'set null' }),
  processedAt: integer('processed_at', { mode: 'timestamp' }),
  responseNotes: text('response_notes'),
  denialReason: text('denial_reason'),

  // Result
  appointmentId: text('appointment_id').references(() => healthcareAppointments.id, { onDelete: 'set null' }),
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }),
  scheduledTime: text('scheduled_time'),

  // Notifications
  patientNotifiedAt: integer('patient_notified_at', { mode: 'timestamp' }),
  notificationMethod: text('notification_method', { enum: ['email', 'sms', 'both', 'push'] }),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// PATIENT MESSAGING
// ============================================================================

/**
 * Message Threads
 * Secure messaging threads between patients and providers
 */
export const portalMessageThreads = sqliteTable('portal_message_threads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),

  // Participants
  portalUserId: text('portal_user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  assignedProviderId: text('assigned_provider_id').references(() => users.id, { onDelete: 'set null' }),

  // Thread info
  subject: text('subject').notNull(),
  category: text('category', {
    enum: ['medical_question', 'appointment', 'prescription', 'lab_results', 'billing', 'technical', 'other']
  }).default('other'),
  priority: text('priority', { enum: ['low', 'normal', 'high', 'urgent'] }).default('normal'),

  // Module context
  module: text('module', { enum: ['dialyse', 'cardiology', 'ophthalmology', 'general'] }).default('general'),

  // Status
  status: text('status', {
    enum: ['open', 'awaiting_patient', 'awaiting_provider', 'resolved', 'closed']
  }).default('open'),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolvedBy: text('resolved_by').references(() => users.id, { onDelete: 'set null' }),

  // Unread tracking
  unreadByPatient: integer('unread_by_patient').default(0),
  unreadByProvider: integer('unread_by_provider').default(0),
  lastMessageAt: integer('last_message_at', { mode: 'timestamp' }),

  // Archive
  isArchivedByPatient: integer('is_archived_by_patient', { mode: 'boolean' }).default(false),
  isArchivedByProvider: integer('is_archived_by_provider', { mode: 'boolean' }).default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Portal Messages
 * Individual messages within threads
 */
export const portalMessages = sqliteTable('portal_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text('thread_id').notNull().references(() => portalMessageThreads.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Sender (one of these)
  fromPortalUserId: text('from_portal_user_id').references(() => portalUsers.id, { onDelete: 'set null' }),
  fromUserId: text('from_user_id').references(() => users.id, { onDelete: 'set null' }),

  // Content
  body: text('body').notNull(),
  bodyFormat: text('body_format', { enum: ['plain', 'html', 'markdown'] }).default('plain'),

  // Attachments
  attachments: text('attachments'), // JSON array of {id, name, url, type, size}

  // Read status
  isReadByPatient: integer('is_read_by_patient', { mode: 'boolean' }).default(false),
  readByPatientAt: integer('read_by_patient_at', { mode: 'timestamp' }),
  isReadByProvider: integer('is_read_by_provider', { mode: 'boolean' }).default(false),
  readByProviderAt: integer('read_by_provider_at', { mode: 'timestamp' }),

  // System messages
  isSystemMessage: integer('is_system_message', { mode: 'boolean' }).default(false),
  systemMessageType: text('system_message_type'), // 'thread_assigned', 'thread_resolved', etc.

  // Edit tracking
  isEdited: integer('is_edited', { mode: 'boolean' }).default(false),
  editedAt: integer('edited_at', { mode: 'timestamp' }),
  originalBody: text('original_body'),

  sentAt: integer('sent_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// SYMPTOM TRACKING
// ============================================================================

/**
 * Symptom Tracking
 * Patient self-reported health data and symptoms
 */
export const symptomTracking = sqliteTable('symptom_tracking', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text('portal_user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Recording info
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  recordedDate: text('recorded_date').notNull(), // YYYY-MM-DD for grouping
  entryType: text('entry_type', { enum: ['symptoms', 'vitals', 'wellness', 'combined'] }).default('combined'),

  // Module context
  module: text('module', { enum: ['dialyse', 'cardiology', 'ophthalmology', 'general'] }).default('general'),

  // Symptoms (JSON array)
  symptoms: text('symptoms'), // [{name, severity: 1-10, duration, notes}]

  // Vitals
  weight: real('weight'), // kg
  heightCm: real('height_cm'),
  bloodPressureSystolic: integer('blood_pressure_systolic'),
  bloodPressureDiastolic: integer('blood_pressure_diastolic'),
  heartRate: integer('heart_rate'),
  temperature: real('temperature'), // Celsius
  bloodGlucose: real('blood_glucose'), // mmol/L or mg/dL
  bloodGlucoseUnit: text('blood_glucose_unit', { enum: ['mmol_l', 'mg_dl'] }),
  oxygenSaturation: integer('oxygen_saturation'), // %
  respiratoryRate: integer('respiratory_rate'), // breaths/min

  // Dialysis-specific
  preDryWeight: real('pre_dry_weight'),
  fluidIntake: real('fluid_intake'), // mL
  urineOutput: real('urine_output'), // mL
  edemaLevel: text('edema_level', { enum: ['none', 'mild', 'moderate', 'severe'] }),

  // Cardiology-specific
  chestPain: integer('chest_pain', { mode: 'boolean' }),
  chestPainType: text('chest_pain_type', { enum: ['pressure', 'sharp', 'burning', 'other'] }),
  shortnessOfBreath: text('shortness_of_breath', { enum: ['none', 'at_rest', 'with_activity', 'lying_down'] }),
  palpitations: integer('palpitations', { mode: 'boolean' }),
  legSwelling: text('leg_swelling', { enum: ['none', 'mild', 'moderate', 'severe'] }),

  // Ophthalmology-specific
  visualDisturbances: integer('visual_disturbances', { mode: 'boolean' }),
  visualDisturbanceType: text('visual_disturbance_type'), // floaters, flashes, blur, etc.
  eyePain: text('eye_pain', { enum: ['none', 'mild', 'moderate', 'severe'] }),
  affectedEye: text('affected_eye', { enum: ['left', 'right', 'both'] }),

  // Wellness indicators
  mood: text('mood', { enum: ['very_poor', 'poor', 'fair', 'good', 'excellent'] }),
  sleepQuality: text('sleep_quality', { enum: ['very_poor', 'poor', 'fair', 'good', 'excellent'] }),
  sleepHours: real('sleep_hours'),
  painLevel: integer('pain_level'), // 0-10
  painLocation: text('pain_location'),
  energyLevel: text('energy_level', { enum: ['very_low', 'low', 'normal', 'high', 'very_high'] }),
  appetiteLevel: text('appetite_level', { enum: ['none', 'poor', 'fair', 'normal', 'increased'] }),
  stressLevel: text('stress_level', { enum: ['none', 'low', 'moderate', 'high', 'severe'] }),

  // Activity
  exerciseMinutes: integer('exercise_minutes'),
  exerciseType: text('exercise_type'),
  stepsCount: integer('steps_count'),

  // Notes
  notes: text('notes'),
  photoUrls: text('photo_urls'), // JSON array for symptom photos

  // Alerts
  triggeredAlert: integer('triggered_alert', { mode: 'boolean' }).default(false),
  alertId: text('alert_id'),

  // Provider review
  reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  providerNotes: text('provider_notes'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// MEDICATION REFILL REQUESTS
// ============================================================================

/**
 * Medication Refill Requests
 * Patient-initiated medication refill requests
 */
export const medicationRefillRequests = sqliteTable('medication_refill_requests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text('portal_user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Medication info
  medicationName: text('medication_name').notNull(),
  medicationCode: text('medication_code'), // CIP13, CIS, etc.
  dosage: text('dosage').notNull(),
  currentQuantity: integer('current_quantity'), // Remaining pills/units
  quantityRequested: integer('quantity_requested'),

  // Pharmacy
  pharmacyId: text('pharmacy_id'),
  pharmacyName: text('pharmacy_name'),
  pharmacyAddress: text('pharmacy_address'),
  pharmacyPhone: text('pharmacy_phone'),
  deliveryRequested: integer('delivery_requested', { mode: 'boolean' }).default(false),

  // Urgency
  urgency: text('urgency', { enum: ['routine', 'soon', 'urgent'] }).default('routine'),
  daysSupplyRemaining: integer('days_supply_remaining'),
  notes: text('notes'),

  // Processing
  status: text('status', {
    enum: ['pending', 'processing', 'approved', 'denied', 'sent_to_pharmacy', 'ready_for_pickup', 'completed', 'cancelled']
  }).default('pending'),
  processedBy: text('processed_by').references(() => users.id, { onDelete: 'set null' }),
  processedAt: integer('processed_at', { mode: 'timestamp' }),
  responseNotes: text('response_notes'),
  denialReason: text('denial_reason'),

  // Prescription generated
  prescriptionId: text('prescription_id'),
  prescriptionSentAt: integer('prescription_sent_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// EDUCATIONAL CONTENT
// ============================================================================

/**
 * Educational Content
 * Health education materials for patients
 */
export const educationalContent = sqliteTable('educational_content', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),

  // Content identification
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),

  // Content type
  contentType: text('content_type', {
    enum: ['article', 'video', 'infographic', 'quiz', 'faq', 'guide', 'checklist']
  }).notNull(),

  // Categorization
  category: text('category').notNull(), // 'dialysis_care', 'heart_health', 'eye_care', etc.
  subcategory: text('subcategory'),
  tags: text('tags'), // JSON array

  // Applicable modules/conditions
  modules: text('modules'), // JSON array ['dialyse', 'cardiology', 'ophthalmology']
  conditions: text('conditions'), // JSON array ['diabetes', 'hypertension', etc.]

  // Content
  content: text('content').notNull(), // Markdown or HTML
  contentFormat: text('content_format', { enum: ['markdown', 'html'] }).default('markdown'),

  // Media
  mediaUrl: text('media_url'), // Video URL, PDF, etc.
  thumbnailUrl: text('thumbnail_url'),
  mediaType: text('media_type', { enum: ['video', 'pdf', 'audio', 'image'] }),
  mediaDurationSeconds: integer('media_duration_seconds'),

  // Metadata
  language: text('language').default('fr'),
  readTimeMinutes: integer('read_time_minutes'),
  difficulty: text('difficulty', { enum: ['beginner', 'intermediate', 'advanced'] }).default('beginner'),

  // Author
  authorId: text('author_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: text('author_name'),
  authorCredentials: text('author_credentials'),

  // External source
  sourceUrl: text('source_url'),
  sourceName: text('source_name'),
  lastReviewedDate: integer('last_reviewed_date', { mode: 'timestamp' }),

  // Publishing
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),

  // Stats
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  shareCount: integer('share_count').default(0),

  // SEO
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),

  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Patient Education Progress
 * Track patient engagement with educational content
 */
export const patientEducationProgress = sqliteTable('patient_education_progress', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text('portal_user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  contentId: text('content_id').notNull().references(() => educationalContent.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Progress
  status: text('status', { enum: ['not_started', 'in_progress', 'completed'] }).default('not_started'),
  progressPercent: integer('progress_percent').default(0),
  lastPosition: integer('last_position'), // For video: seconds, for article: scroll position
  timeSpentSeconds: integer('time_spent_seconds').default(0),

  // Completion
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  completedCount: integer('completed_count').default(0),

  // Quiz/Assessment results
  quizScore: integer('quiz_score'),
  quizAttempts: integer('quiz_attempts').default(0),
  quizPassed: integer('quiz_passed', { mode: 'boolean' }),

  // Engagement
  isBookmarked: integer('is_bookmarked', { mode: 'boolean' }).default(false),
  isLiked: integer('is_liked', { mode: 'boolean' }).default(false),
  rating: integer('rating'), // 1-5
  feedback: text('feedback'),

  // Prescription
  prescribedBy: text('prescribed_by').references(() => users.id, { onDelete: 'set null' }),
  prescribedAt: integer('prescribed_at', { mode: 'timestamp' }),
  dueDate: integer('due_date', { mode: 'timestamp' }),

  firstViewedAt: integer('first_viewed_at', { mode: 'timestamp' }),
  lastViewedAt: integer('last_viewed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// PORTAL NOTIFICATIONS
// ============================================================================

/**
 * Portal Notifications
 * Notifications for portal users
 */
export const portalNotifications = sqliteTable('portal_notifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text('portal_user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Notification type
  type: text('type', {
    enum: [
      'appointment_reminder', 'appointment_confirmed', 'appointment_cancelled',
      'new_message', 'lab_result_available', 'prescription_ready',
      'document_shared', 'education_assigned', 'symptom_alert_response',
      'payment_due', 'general'
    ]
  }).notNull(),

  // Content
  title: text('title').notNull(),
  body: text('body').notNull(),
  icon: text('icon'),

  // Reference
  referenceType: text('reference_type'), // 'appointment', 'message', 'document', etc.
  referenceId: text('reference_id'),
  actionUrl: text('action_url'),

  // Delivery
  channels: text('channels'), // JSON array ['push', 'email', 'sms']
  emailSent: integer('email_sent', { mode: 'boolean' }).default(false),
  smsSent: integer('sms_sent', { mode: 'boolean' }).default(false),
  pushSent: integer('push_sent', { mode: 'boolean' }).default(false),

  // Status
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),
  isActioned: integer('is_actioned', { mode: 'boolean' }).default(false),
  actionedAt: integer('actioned_at', { mode: 'timestamp' }),

  // Scheduling
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// DOCUMENT ACCESS
// ============================================================================

/**
 * Patient Document Access
 * Documents shared with patients through the portal
 */
export const patientDocumentAccess = sqliteTable('patient_document_access', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  portalUserId: text('portal_user_id').notNull().references(() => portalUsers.id, { onDelete: 'cascade' }),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Document reference
  documentId: text('document_id').notNull(), // Reference to documents table
  documentType: text('document_type').notNull(), // 'lab_result', 'consultation_note', 'prescription', etc.
  documentName: text('document_name').notNull(),
  documentDate: integer('document_date', { mode: 'timestamp' }),

  // Access control
  sharedBy: text('shared_by').notNull().references(() => users.id),
  sharedAt: integer('shared_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  accessLevel: text('access_level', { enum: ['view', 'download'] }).default('view'),

  // Tracking
  viewCount: integer('view_count').default(0),
  firstViewedAt: integer('first_viewed_at', { mode: 'timestamp' }),
  lastViewedAt: integer('last_viewed_at', { mode: 'timestamp' }),
  downloadCount: integer('download_count').default(0),
  lastDownloadedAt: integer('last_downloaded_at', { mode: 'timestamp' }),

  // Status
  isRevoked: integer('is_revoked', { mode: 'boolean' }).default(false),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokedBy: text('revoked_by').references(() => users.id, { onDelete: 'set null' }),
  revokedReason: text('revoked_reason'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
