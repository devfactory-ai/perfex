/**
 * Smart Audit System Schema
 * Tables for AI-powered manufacturing quality audits
 * Modules: EF1 (Risk), EF2 (Compliance), EF3 (Commonality)
 */

import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';

// ============================================
// CORE AUDIT TABLES
// ============================================

/**
 * Audit Tasks
 * Central table for all audit tasks with AI risk scoring
 */
export const auditTasks = sqliteTable('audit_tasks', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  taskNumber: text('task_number').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  source: text('source').notNull(), // 'risk_assessment', 'compliance_check', 'commonality_study', 'manual'
  auditType: text('audit_type').notNull(), // 'quality', 'process', 'supplier', 'safety', 'compliance'
  priority: text('priority').notNull().default('medium'), // 'critical', 'high', 'medium', 'low'
  riskScore: real('risk_score'), // 0-100
  riskFactors: text('risk_factors', { mode: 'json' }).$type<string[]>(),
  assignedTo: text('assigned_to'),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('pending'), // 'pending', 'in_progress', 'completed', 'cancelled', 'deferred'
  dueDate: integer('due_date', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  entityType: text('entity_type'), // 'work_order', 'grn', 'supplier', 'product', 'process'
  entityId: text('entity_id'),
  aiGenerated: integer('ai_generated', { mode: 'boolean' }).default(false),
  aiConfidence: real('ai_confidence'), // 0-100
  aiReasoning: text('ai_reasoning'),
  notes: text('notes'),
  attachmentIds: text('attachment_ids', { mode: 'json' }).$type<string[]>(),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Audit Findings
 * Results and non-conformances from completed audits
 */
export const auditFindings = sqliteTable('audit_findings', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  auditTaskId: text('audit_task_id').notNull(),
  findingNumber: text('finding_number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: text('severity').notNull(), // 'critical', 'major', 'minor', 'observation'
  category: text('category').notNull(), // 'non_conformance', 'observation', 'opportunity', 'positive'
  evidence: text('evidence'),
  attachmentIds: text('attachment_ids', { mode: 'json' }).$type<string[]>(),
  correctiveActionRequired: integer('corrective_action_required', { mode: 'boolean' }).default(false),
  correctiveActionDescription: text('corrective_action_description'),
  correctiveActionDueDate: integer('corrective_action_due_date', { mode: 'timestamp' }),
  correctiveActionStatus: text('corrective_action_status').default('pending'), // 'pending', 'in_progress', 'completed', 'verified'
  aiAnalysis: text('ai_analysis'),
  aiRecommendations: text('ai_recommendations', { mode: 'json' }).$type<string[]>(),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// EF1: DYNAMIC RISK ASSESSMENT
// ============================================

/**
 * Risk Assessments
 * AI-generated risk assessments for manufacturing quality
 */
export const riskAssessments = sqliteTable('risk_assessments', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  assessmentNumber: text('assessment_number').notNull(),
  assessmentType: text('assessment_type').notNull(), // 'work_order', 'supplier', 'process', 'product', 'facility'
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  assessmentDate: integer('assessment_date', { mode: 'timestamp' }).notNull(),
  periodStart: integer('period_start', { mode: 'timestamp' }),
  periodEnd: integer('period_end', { mode: 'timestamp' }),
  overallRiskScore: real('overall_risk_score').notNull(), // 0-100
  qualityRiskScore: real('quality_risk_score'),
  processRiskScore: real('process_risk_score'),
  supplierRiskScore: real('supplier_risk_score'),
  complianceRiskScore: real('compliance_risk_score'),
  riskFactors: text('risk_factors', { mode: 'json' }).$type<Array<{
    factor: string;
    score: number;
    weight: number;
    description: string;
  }>>(),
  aiModelVersion: text('ai_model_version'),
  inputData: text('input_data', { mode: 'json' }).$type<Record<string, any>>(),
  aiAnalysis: text('ai_analysis'),
  recommendations: text('recommendations', { mode: 'json' }).$type<string[]>(),
  suggestedResources: text('suggested_resources', { mode: 'json' }).$type<Array<{
    type: string;
    quantity: number;
    priority: string;
    rationale: string;
  }>>(),
  tasksGenerated: integer('tasks_generated').default(0),
  status: text('status').notNull().default('draft'), // 'draft', 'active', 'archived'
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Risk Data Points
 * Raw quality data collected for risk analysis (NLP processed)
 */
export const riskDataPoints = sqliteTable('risk_data_points', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  source: text('source').notNull(), // 'work_order', 'grn', 'inspection', 'sensor', 'manual', 'simotex'
  sourceEntityType: text('source_entity_type'),
  sourceEntityId: text('source_entity_id'),
  dataType: text('data_type').notNull(), // 'defect_rate', 'rejection_count', 'cycle_time', 'compliance_score'
  dataCategory: text('data_category').notNull(), // 'quality', 'process', 'supplier', 'compliance'
  numericValue: real('numeric_value'),
  textValue: text('text_value'),
  jsonValue: text('json_value', { mode: 'json' }).$type<Record<string, any>>(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  embedding: blob('embedding', { mode: 'buffer' }), // For semantic search
  processed: integer('processed', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// EF2: COMPLIANCE COPILOT
// ============================================

/**
 * Compliance Knowledge Base
 * Standards, regulations, and procedures for compliance checking
 */
export const complianceKnowledgeBase = sqliteTable('compliance_knowledge_base', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  title: text('title').notNull(),
  documentType: text('document_type').notNull(), // 'standard', 'regulation', 'procedure', 'guideline', 'checklist'
  category: text('category').notNull(), // 'iso9001', 'iso14001', 'osha', 'industry_specific', 'internal'
  subcategory: text('subcategory'),
  content: text('content').notNull(),
  summary: text('summary'),
  keywords: text('keywords', { mode: 'json' }).$type<string[]>(),
  version: text('version').default('1.0'),
  effectiveDate: integer('effective_date', { mode: 'timestamp' }),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
  embedding: blob('embedding', { mode: 'buffer' }), // For semantic search
  sourceUrl: text('source_url'),
  lastReviewDate: integer('last_review_date', { mode: 'timestamp' }),
  reviewedBy: text('reviewed_by'),
  status: text('status').notNull().default('active'), // 'draft', 'active', 'archived'
  usageCount: integer('usage_count').default(0),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Compliance Checks
 * Results of compliance analysis against standards
 */
export const complianceChecks = sqliteTable('compliance_checks', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  checkNumber: text('check_number').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  standardsChecked: text('standards_checked', { mode: 'json' }).$type<string[]>(),
  overallStatus: text('overall_status').notNull(), // 'compliant', 'non_compliant', 'partially_compliant'
  complianceScore: real('compliance_score'), // 0-100
  checkResults: text('check_results', { mode: 'json' }).$type<Array<{
    standard: string;
    requirement: string;
    status: string;
    evidence: string;
    gap: string | null;
    recommendation: string | null;
  }>>(),
  aiAnalysis: text('ai_analysis'),
  aiRecommendations: text('ai_recommendations', { mode: 'json' }).$type<string[]>(),
  requiresAction: integer('requires_action', { mode: 'boolean' }).default(false),
  actionItems: text('action_items', { mode: 'json' }).$type<Array<{
    description: string;
    priority: string;
    dueDate: string | null;
    assignedTo: string | null;
    status: string;
  }>>(),
  performedBy: text('performed_by').notNull(),
  performedAt: integer('performed_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Compliance Conversations
 * Chat history with the compliance copilot
 */
export const complianceConversations = sqliteTable('compliance_conversations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  userId: text('user_id').notNull(),
  title: text('title'),
  messages: text('messages', { mode: 'json' }).$type<Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: string;
    sources?: string[]; // References to knowledge base entries
  }>>().notNull(),
  context: text('context', { mode: 'json' }).$type<{
    entityType?: string;
    entityId?: string;
    standards?: string[];
  }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// EF3: COMMONALITY STUDY AGENT
// ============================================

/**
 * Commonality Studies
 * Pattern analysis across audits using ReAct framework
 */
export const commonalityStudies = sqliteTable('commonality_studies', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  studyNumber: text('study_number').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  studyType: text('study_type').notNull(), // 'defect_pattern', 'supplier_comparison', 'process_improvement', 'root_cause'
  analysisStartDate: integer('analysis_start_date', { mode: 'timestamp' }),
  analysisEndDate: integer('analysis_end_date', { mode: 'timestamp' }),
  entityFilters: text('entity_filters', { mode: 'json' }).$type<{
    entityTypes?: string[];
    entityIds?: string[];
    supplierIds?: string[];
    productIds?: string[];
    workOrderIds?: string[];
  }>(),
  reactTrace: text('react_trace', { mode: 'json' }).$type<Array<{
    step: number;
    thought: string;
    action: string;
    observation: string;
    timestamp: string;
  }>>(),
  patternsFound: text('patterns_found', { mode: 'json' }).$type<Array<{
    patternId: string;
    patternType: string;
    description: string;
    frequency: number;
    severity: string;
    affectedEntities: string[];
    rootCause: string | null;
    confidence: number;
  }>>(),
  recommendations: text('recommendations', { mode: 'json' }).$type<Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    expectedImpact: string;
    estimatedEffort: string;
    status: string;
  }>>(),
  supplierInsights: text('supplier_insights', { mode: 'json' }).$type<Array<{
    supplierId: string;
    supplierName: string;
    performanceScore: number;
    issues: string[];
    strengths: string[];
    recommendations: string[];
  }>>(),
  variantAnalysis: text('variant_analysis', { mode: 'json' }).$type<{
    variants: Array<{
      variantId: string;
      description: string;
      consistency: number;
      deviations: string[];
    }>;
    overallConsistency: number;
  }>(),
  status: text('status').notNull().default('draft'), // 'draft', 'in_progress', 'completed', 'archived'
  requiresApproval: integer('requires_approval', { mode: 'boolean' }).default(true),
  approvalStatus: text('approval_status').default('pending'), // 'pending', 'approved', 'rejected'
  approvedBy: text('approved_by'),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  approvalComments: text('approval_comments'),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Improvement Proposals
 * Generated from studies with approval workflow (semi-automatic)
 */
export const improvementProposals = sqliteTable('improvement_proposals', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  proposalNumber: text('proposal_number').notNull(),
  commonalityStudyId: text('commonality_study_id'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'process', 'quality', 'supplier', 'equipment', 'training'
  expectedBenefits: text('expected_benefits', { mode: 'json' }).$type<string[]>(),
  estimatedCostSaving: real('estimated_cost_saving'),
  estimatedQualityImprovement: real('estimated_quality_improvement'), // Percentage
  implementationEffort: text('implementation_effort'), // 'low', 'medium', 'high'
  priority: text('priority').notNull().default('medium'), // 'critical', 'high', 'medium', 'low'
  affectedProcesses: text('affected_processes', { mode: 'json' }).$type<string[]>(),
  affectedSuppliers: text('affected_suppliers', { mode: 'json' }).$type<string[]>(),
  affectedProducts: text('affected_products', { mode: 'json' }).$type<string[]>(),
  implementationSteps: text('implementation_steps', { mode: 'json' }).$type<Array<{
    step: number;
    description: string;
    assignedTo: string | null;
    dueDate: string | null;
    status: string;
    completedAt: string | null;
  }>>(),
  status: text('status').notNull().default('draft'), // 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'implementing', 'implemented', 'cancelled'
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  submittedBy: text('submitted_by'),
  approvalChain: text('approval_chain', { mode: 'json' }).$type<Array<{
    level: number;
    approverRole: string;
    approverId: string | null;
    status: string;
    comments: string | null;
    timestamp: string | null;
  }>>(),
  currentApprovalLevel: integer('current_approval_level').default(0),
  implementationStartDate: integer('implementation_start_date', { mode: 'timestamp' }),
  implementationEndDate: integer('implementation_end_date', { mode: 'timestamp' }),
  actualResults: text('actual_results'),
  lessonsLearned: text('lessons_learned'),
  aiGenerated: integer('ai_generated', { mode: 'boolean' }).default(false),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// SCHEDULING & CONFIGURATION
// ============================================

/**
 * Audit Schedules
 * Scheduled audit tasks and batch reports
 */
export const auditSchedules = sqliteTable('audit_schedules', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  scheduleType: text('schedule_type').notNull(), // 'risk_assessment', 'compliance_check', 'commonality_study', 'report'
  frequency: text('frequency').notNull(), // 'daily', 'weekly', 'monthly', 'quarterly', 'annually', 'custom'
  cronExpression: text('cron_expression'),
  configuration: text('configuration', { mode: 'json' }).$type<{
    entityTypes?: string[];
    entityIds?: string[];
    assessmentType?: string;
    standards?: string[];
    studyType?: string;
    reportFormat?: string;
  }>(),
  notifyUsers: text('notify_users', { mode: 'json' }).$type<string[]>(),
  notifyOnCompletion: integer('notify_on_completion', { mode: 'boolean' }).default(true),
  notifyOnHighRisk: integer('notify_on_high_risk', { mode: 'boolean' }).default(true),
  highRiskThreshold: real('high_risk_threshold').default(70),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  lastRunStatus: text('last_run_status'),
  lastRunResult: text('last_run_result', { mode: 'json' }).$type<Record<string, any>>(),
  nextRunAt: integer('next_run_at', { mode: 'timestamp' }),
  runCount: integer('run_count').default(0),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Audit Configuration
 * Organization-level audit settings
 */
export const auditConfiguration = sqliteTable('audit_configuration', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().unique(),
  riskScoreWeights: text('risk_score_weights', { mode: 'json' }).$type<{
    quality: number;
    process: number;
    supplier: number;
    compliance: number;
  }>(),
  riskThresholds: text('risk_thresholds', { mode: 'json' }).$type<{
    low: number;      // 0-30
    medium: number;   // 31-60
    high: number;     // 61-85
    critical: number; // 86-100
  }>(),
  approvalLevels: text('approval_levels', { mode: 'json' }).$type<Array<{
    level: number;
    role: string;
    minProposalPriority: string;
  }>>(),
  defaultStandards: text('default_standards', { mode: 'json' }).$type<string[]>(),
  autoGenerateTasks: integer('auto_generate_tasks', { mode: 'boolean' }).default(false),
  autoGenerateThreshold: real('auto_generate_threshold').default(70),
  notificationSettings: text('notification_settings', { mode: 'json' }).$type<{
    emailOnHighRisk: boolean;
    emailOnNonCompliance: boolean;
    emailOnProposalSubmission: boolean;
    dailyDigest: boolean;
  }>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
