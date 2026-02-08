/**
 * Clinical AI Schema
 * Tables for AI-powered clinical documentation, patient summaries, and diagnostic suggestions
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { healthcarePatients, healthcareConsultations } from './healthcare';

// ============================================================================
// CLINICAL DOCUMENTATION
// ============================================================================

/**
 * Clinical Documentation
 * AI-generated clinical documents (consultation notes, discharge summaries, etc.)
 */
export const clinicalDocumentation = sqliteTable('clinical_documentation', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  encounterId: text('encounter_id'),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),
  companyId: text('company_id').notNull(),

  // Document type
  documentType: text('document_type', {
    enum: ['consultation_note', 'discharge_summary', 'referral_letter', 'progress_note', 'surgical_report', 'procedure_note', 'admission_note', 'transfer_note']
  }).notNull(),

  // Module context
  module: text('module', { enum: ['dialyse', 'cardiology', 'ophthalmology', 'general'] }).default('general'),

  // AI Generation
  aiGeneratedDraft: text('ai_generated_draft'),
  finalContent: text('final_content'),
  aiModel: text('ai_model'), // 'llama-3.1-8b', 'llama-3.1-70b', etc.
  aiModelVersion: text('ai_model_version'),
  promptUsed: text('prompt_used'),
  generationTimeMs: integer('generation_time_ms'),

  // Input context
  inputContext: text('input_context'), // JSON - symptoms, vitals, labs used as input

  // Audio transcription (for ambient documentation)
  audioUrl: text('audio_url'), // R2 URL
  transcription: text('transcription'),
  transcriptionConfidence: real('transcription_confidence'),
  transcriptionLanguage: text('transcription_language').default('fr'),

  // Structured data extraction
  extractedEntities: text('extracted_entities'), // JSON - conditions, medications, procedures
  extractedCodes: text('extracted_codes'), // JSON - ICD-10, CPT, SNOMED codes

  // Status and workflow
  status: text('status', {
    enum: ['draft', 'pending_review', 'approved', 'signed', 'amended', 'voided']
  }).default('draft'),

  // Review workflow
  reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewNotes: text('review_notes'),

  // Signature
  signedBy: text('signed_by').references(() => users.id, { onDelete: 'set null' }),
  signedAt: integer('signed_at', { mode: 'timestamp' }),
  digitalSignature: text('digital_signature'),

  // Amendment tracking
  amendedFrom: text('amended_from'), // Previous version ID
  amendmentReason: text('amendment_reason'),

  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// PATIENT SUMMARIES
// ============================================================================

/**
 * Patient Summaries
 * AI-generated comprehensive patient summaries
 */
export const patientSummaries = sqliteTable('patient_summaries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  companyId: text('company_id').notNull(),

  // Summary type
  summaryType: text('summary_type', {
    enum: ['comprehensive', 'admission', 'discharge', 'specialty', 'problem_focused', 'pre_operative', 'handoff']
  }).notNull(),

  // Module context
  module: text('module', { enum: ['dialyse', 'cardiology', 'ophthalmology', 'general'] }).default('general'),

  // Content
  title: text('title'),
  content: text('content').notNull(),
  contentFormat: text('content_format', { enum: ['markdown', 'html', 'plain'] }).default('markdown'),

  // Structured data
  structuredData: text('structured_data'), // JSON with sections
  keyProblems: text('key_problems'), // JSON array
  activeMedications: text('active_medications'), // JSON array
  recentProcedures: text('recent_procedures'), // JSON array
  pendingActions: text('pending_actions'), // JSON array
  criticalAlerts: text('critical_alerts'), // JSON array

  // AI metadata
  aiModel: text('ai_model'),
  aiConfidence: real('ai_confidence'),
  generationTimeMs: integer('generation_time_ms'),

  // Source tracking
  sourceDocumentIds: text('source_document_ids'), // JSON array of document IDs used
  dataRange: text('data_range'), // JSON {from, to} dates

  // Refresh settings
  lastRefreshed: integer('last_refreshed', { mode: 'timestamp' }),
  autoRefresh: integer('auto_refresh', { mode: 'boolean' }).default(true),
  refreshFrequency: text('refresh_frequency', { enum: ['daily', 'weekly', 'on_change', 'manual'] }).default('on_change'),
  nextRefreshAt: integer('next_refresh_at', { mode: 'timestamp' }),

  // Validity
  validUntil: integer('valid_until', { mode: 'timestamp' }),
  isStale: integer('is_stale', { mode: 'boolean' }).default(false),

  // User feedback
  userRating: integer('user_rating'), // 1-5
  userFeedback: text('user_feedback'),

  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// DIAGNOSTIC SUGGESTIONS
// ============================================================================

/**
 * Diagnostic Suggestions
 * AI-powered differential diagnosis and clinical recommendations
 */
export const diagnosticSuggestions = sqliteTable('diagnostic_suggestions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  patientId: text('patient_id').notNull().references(() => healthcarePatients.id, { onDelete: 'cascade' }),
  encounterId: text('encounter_id'),
  consultationId: text('consultation_id').references(() => healthcareConsultations.id, { onDelete: 'set null' }),
  companyId: text('company_id').notNull(),

  // Module context
  module: text('module', { enum: ['dialyse', 'cardiology', 'ophthalmology', 'general'] }).default('general'),

  // Input data (JSON)
  symptoms: text('symptoms'), // JSON array of symptoms with severity
  labResults: text('lab_results'), // JSON object with lab values
  imagingFindings: text('imaging_findings'), // JSON array
  vitalSigns: text('vital_signs'), // JSON object
  medicalHistory: text('medical_history'), // JSON object
  currentMedications: text('current_medications'), // JSON array

  // AI Suggestions (JSON)
  differentialDiagnoses: text('differential_diagnoses'), // JSON array with confidence scores
  primaryDiagnosis: text('primary_diagnosis'), // JSON object
  recommendedTests: text('recommended_tests'), // JSON array with rationale
  recommendedImaging: text('recommended_imaging'), // JSON array
  recommendedConsults: text('recommended_consults'), // JSON array

  // Clinical alerts
  redFlags: text('red_flags'), // JSON array of critical findings
  drugInteractions: text('drug_interactions'), // JSON array
  contraindicatedActions: text('contraindicated_actions'), // JSON array

  // Urgency assessment
  urgencyAssessment: text('urgency_assessment', {
    enum: ['routine', 'soon', 'urgent', 'emergent', 'critical']
  }).default('routine'),
  urgencyRationale: text('urgency_rationale'),

  // Clinical reasoning
  clinicalReasoning: text('clinical_reasoning'), // AI explanation
  evidenceReferences: text('evidence_references'), // JSON array of guideline/literature references

  // AI metadata
  aiModel: text('ai_model'),
  aiConfidence: real('ai_confidence'),
  generationTimeMs: integer('generation_time_ms'),

  // Provider feedback
  status: text('status', {
    enum: ['pending', 'viewed', 'accepted', 'modified', 'rejected', 'expired']
  }).default('pending'),
  viewedBy: text('viewed_by').references(() => users.id, { onDelete: 'set null' }),
  viewedAt: integer('viewed_at', { mode: 'timestamp' }),
  providerNotes: text('provider_notes'),
  providerDecision: text('provider_decision'),

  // Outcome tracking (for model improvement)
  actualDiagnosis: text('actual_diagnosis'),
  diagnosisMatchScore: real('diagnosis_match_score'), // How well AI predicted actual diagnosis
  outcomeRecordedAt: integer('outcome_recorded_at', { mode: 'timestamp' }),
  outcomeRecordedBy: text('outcome_recorded_by').references(() => users.id, { onDelete: 'set null' }),

  // Expiration
  expiresAt: integer('expires_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// AI CLINICAL PROMPTS
// ============================================================================

/**
 * AI Clinical Prompts
 * Reusable prompt templates for clinical AI tasks
 */
export const aiClinicalPrompts = sqliteTable('ai_clinical_prompts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),

  // Identification
  name: text('name').notNull(),
  code: text('code').notNull(), // Unique code like 'CONSULTATION_NOTE_FR'
  description: text('description'),

  // Categorization
  category: text('category', {
    enum: ['documentation', 'summary', 'diagnostic', 'report', 'analysis', 'extraction']
  }).notNull(),
  module: text('module', { enum: ['dialyse', 'cardiology', 'ophthalmology', 'general'] }).default('general'),

  // Prompt content
  systemPrompt: text('system_prompt').notNull(),
  userPromptTemplate: text('user_prompt_template').notNull(), // With {{variables}}
  outputFormat: text('output_format'), // Expected output structure

  // Variables
  requiredVariables: text('required_variables'), // JSON array
  optionalVariables: text('optional_variables'), // JSON array

  // Model settings
  recommendedModel: text('recommended_model').default('llama-3.1-8b'),
  temperature: real('temperature').default(0.3),
  maxTokens: integer('max_tokens').default(2000),

  // Language
  language: text('language').default('fr'),

  // Version control
  version: integer('version').default(1),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  previousVersionId: text('previous_version_id'),

  // Usage stats
  usageCount: integer('usage_count').default(0),
  avgRating: real('avg_rating'),

  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// AI USAGE TRACKING
// ============================================================================

/**
 * Clinical AI Usage
 * Track AI usage for clinical features (billing, quotas, analytics)
 */
export const clinicalAiUsage = sqliteTable('clinical_ai_usage', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyId: text('company_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id),

  // Feature used
  feature: text('feature', {
    enum: ['documentation', 'summary', 'diagnostic', 'transcription', 'report', 'analysis']
  }).notNull(),

  // Request details
  requestId: text('request_id'), // External reference
  entityType: text('entity_type'), // 'clinical_documentation', 'patient_summary', etc.
  entityId: text('entity_id'),

  // Model used
  aiModel: text('ai_model').notNull(),
  aiProvider: text('ai_provider').default('cloudflare'),

  // Token usage
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  totalTokens: integer('total_tokens'),

  // Timing
  latencyMs: integer('latency_ms'),
  queueTimeMs: integer('queue_time_ms'),

  // Cost (for budgeting)
  estimatedCost: real('estimated_cost'), // In currency units

  // Status
  status: text('status', { enum: ['success', 'failed', 'timeout', 'rate_limited'] }).notNull(),
  errorMessage: text('error_message'),

  // Date for aggregation
  usageDate: text('usage_date').notNull(), // YYYY-MM-DD

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
