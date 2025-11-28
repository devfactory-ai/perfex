/**
 * Smart Audit System Validators (Zod schemas)
 * EF1: Risk Assessment, EF2: Compliance Copilot, EF3: Commonality Study
 */

import { z } from 'zod';

// ============================================
// CORE AUDIT VALIDATORS
// ============================================

// Audit Task validators
export const createAuditTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  source: z.enum(['risk_assessment', 'compliance_check', 'commonality_study', 'manual']).default('manual'),
  auditType: z.enum(['quality', 'process', 'supplier', 'safety', 'compliance']),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  riskScore: z.number().min(0).max(100).optional().nullable(),
  riskFactors: z.array(z.string()).optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  entityType: z.enum(['work_order', 'grn', 'supplier', 'product', 'process']).optional().nullable(),
  entityId: z.string().uuid().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type CreateAuditTaskInput = z.infer<typeof createAuditTaskSchema>;

export const updateAuditTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'deferred']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type UpdateAuditTaskInput = z.infer<typeof updateAuditTaskSchema>;

export const completeAuditTaskSchema = z.object({
  findings: z.array(z.object({
    title: z.string().min(1).max(500),
    description: z.string().min(1).max(5000),
    severity: z.enum(['critical', 'major', 'minor', 'observation']),
    category: z.enum(['non_conformance', 'observation', 'opportunity', 'positive']),
    evidence: z.string().max(5000).optional().nullable(),
    correctiveActionRequired: z.boolean().default(false),
    correctiveActionDescription: z.string().max(5000).optional().nullable(),
    correctiveActionDueDate: z.string().datetime().or(z.date()).optional().nullable(),
  })).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export type CompleteAuditTaskInput = z.infer<typeof completeAuditTaskSchema>;

// Audit Finding validators
export const createAuditFindingSchema = z.object({
  auditTaskId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  severity: z.enum(['critical', 'major', 'minor', 'observation']),
  category: z.enum(['non_conformance', 'observation', 'opportunity', 'positive']),
  evidence: z.string().max(5000).optional().nullable(),
  correctiveActionRequired: z.boolean().default(false),
  correctiveActionDescription: z.string().max(5000).optional().nullable(),
  correctiveActionDueDate: z.string().datetime().or(z.date()).optional().nullable(),
});

export type CreateAuditFindingInput = z.infer<typeof createAuditFindingSchema>;

export const updateAuditFindingSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  severity: z.enum(['critical', 'major', 'minor', 'observation']).optional(),
  evidence: z.string().max(5000).optional().nullable(),
  correctiveActionRequired: z.boolean().optional(),
  correctiveActionDescription: z.string().max(5000).optional().nullable(),
  correctiveActionDueDate: z.string().datetime().or(z.date()).optional().nullable(),
  correctiveActionStatus: z.enum(['pending', 'in_progress', 'completed', 'verified']).optional(),
});

export type UpdateAuditFindingInput = z.infer<typeof updateAuditFindingSchema>;

// ============================================
// EF1: RISK ASSESSMENT VALIDATORS
// ============================================

export const runRiskAssessmentSchema = z.object({
  assessmentType: z.enum(['work_order', 'supplier', 'process', 'product', 'facility']),
  entityType: z.string().optional().nullable(),
  entityId: z.string().uuid().optional().nullable(),
  periodStart: z.string().datetime().or(z.date()).optional().nullable(),
  periodEnd: z.string().datetime().or(z.date()).optional().nullable(),
  includeDataPoints: z.array(z.string()).optional(),
});

export type RunRiskAssessmentInput = z.infer<typeof runRiskAssessmentSchema>;

export const generateAuditTasksSchema = z.object({
  assessmentId: z.string().uuid(),
  minRiskScore: z.number().min(0).max(100).default(70),
  maxTasks: z.number().int().min(1).max(50).default(10),
  assignTo: z.string().uuid().optional().nullable(),
  dueDateOffset: z.number().int().min(1).max(90).default(7), // days from now
});

export type GenerateAuditTasksInput = z.infer<typeof generateAuditTasksSchema>;

export const addRiskDataPointSchema = z.object({
  source: z.enum(['work_order', 'grn', 'inspection', 'sensor', 'manual', 'simotex']),
  sourceEntityType: z.string().optional().nullable(),
  sourceEntityId: z.string().uuid().optional().nullable(),
  dataType: z.enum(['defect_rate', 'rejection_count', 'cycle_time', 'compliance_score']),
  dataCategory: z.enum(['quality', 'process', 'supplier', 'compliance']),
  numericValue: z.number().optional().nullable(),
  textValue: z.string().max(10000).optional().nullable(),
  jsonValue: z.record(z.any()).optional().nullable(),
  timestamp: z.string().datetime().or(z.date()).optional(),
  metadata: z.record(z.any()).optional().nullable(),
});

export type AddRiskDataPointInput = z.infer<typeof addRiskDataPointSchema>;

// ============================================
// EF2: COMPLIANCE COPILOT VALIDATORS
// ============================================

export const complianceChatSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
  context: z.object({
    entityType: z.string().optional(),
    entityId: z.string().uuid().optional(),
    standards: z.array(z.string()).optional(),
  }).optional(),
});

export type ComplianceChatInput = z.infer<typeof complianceChatSchema>;

export const runComplianceCheckSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  standards: z.array(z.string()).min(1),
  detailedAnalysis: z.boolean().default(true),
});

export type RunComplianceCheckInput = z.infer<typeof runComplianceCheckSchema>;

export const addKnowledgeBaseEntrySchema = z.object({
  title: z.string().min(1).max(500),
  documentType: z.enum(['standard', 'regulation', 'procedure', 'guideline', 'checklist']),
  category: z.enum(['iso9001', 'iso14001', 'osha', 'industry_specific', 'internal']),
  subcategory: z.string().max(100).optional().nullable(),
  content: z.string().min(1).max(100000),
  summary: z.string().max(2000).optional().nullable(),
  keywords: z.array(z.string()).optional().nullable(),
  version: z.string().max(50).default('1.0'),
  effectiveDate: z.string().datetime().or(z.date()).optional().nullable(),
  expiryDate: z.string().datetime().or(z.date()).optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
});

export type AddKnowledgeBaseEntryInput = z.infer<typeof addKnowledgeBaseEntrySchema>;

export const updateKnowledgeBaseEntrySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().max(100000).optional(),
  summary: z.string().max(2000).optional().nullable(),
  keywords: z.array(z.string()).optional().nullable(),
  version: z.string().max(50).optional(),
  effectiveDate: z.string().datetime().or(z.date()).optional().nullable(),
  expiryDate: z.string().datetime().or(z.date()).optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  sourceUrl: z.string().url().optional().nullable(),
});

export type UpdateKnowledgeBaseEntryInput = z.infer<typeof updateKnowledgeBaseEntrySchema>;

export const searchKnowledgeBaseSchema = z.object({
  query: z.string().min(1).max(500),
  category: z.enum(['iso9001', 'iso14001', 'osha', 'industry_specific', 'internal']).optional(),
  documentType: z.enum(['standard', 'regulation', 'procedure', 'guideline', 'checklist']).optional(),
  limit: z.number().int().min(1).max(50).default(10),
  semanticSearch: z.boolean().default(true),
});

export type SearchKnowledgeBaseInput = z.infer<typeof searchKnowledgeBaseSchema>;

// ============================================
// EF3: COMMONALITY STUDY VALIDATORS
// ============================================

export const runCommonalityAnalysisSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().nullable(),
  studyType: z.enum(['defect_pattern', 'supplier_comparison', 'process_improvement', 'root_cause']),
  analysisStartDate: z.string().datetime().or(z.date()).optional().nullable(),
  analysisEndDate: z.string().datetime().or(z.date()).optional().nullable(),
  entityFilters: z.object({
    entityTypes: z.array(z.string()).optional(),
    entityIds: z.array(z.string().uuid()).optional(),
    supplierIds: z.array(z.string().uuid()).optional(),
    productIds: z.array(z.string().uuid()).optional(),
    workOrderIds: z.array(z.string().uuid()).optional(),
  }).optional(),
  maxIterations: z.number().int().min(1).max(20).default(5),
  requiresApproval: z.boolean().default(true),
});

export type RunCommonalityAnalysisInput = z.infer<typeof runCommonalityAnalysisSchema>;

export const approveStudySchema = z.object({
  approved: z.boolean(),
  comments: z.string().max(2000).optional().nullable(),
});

export type ApproveStudyInput = z.infer<typeof approveStudySchema>;

export const createImprovementProposalSchema = z.object({
  commonalityStudyId: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(10000),
  category: z.enum(['process', 'quality', 'supplier', 'equipment', 'training']),
  expectedBenefits: z.array(z.string()).optional().nullable(),
  estimatedCostSaving: z.number().min(0).optional().nullable(),
  estimatedQualityImprovement: z.number().min(0).max(100).optional().nullable(),
  implementationEffort: z.enum(['low', 'medium', 'high']).optional().nullable(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  affectedProcesses: z.array(z.string()).optional().nullable(),
  affectedSuppliers: z.array(z.string().uuid()).optional().nullable(),
  affectedProducts: z.array(z.string().uuid()).optional().nullable(),
  implementationSteps: z.array(z.object({
    step: z.number().int().min(1),
    description: z.string().min(1).max(1000),
    assignedTo: z.string().uuid().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
  })).optional(),
});

export type CreateImprovementProposalInput = z.infer<typeof createImprovementProposalSchema>;

export const updateImprovementProposalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  category: z.enum(['process', 'quality', 'supplier', 'equipment', 'training']).optional(),
  expectedBenefits: z.array(z.string()).optional().nullable(),
  estimatedCostSaving: z.number().min(0).optional().nullable(),
  estimatedQualityImprovement: z.number().min(0).max(100).optional().nullable(),
  implementationEffort: z.enum(['low', 'medium', 'high']).optional().nullable(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  actualResults: z.string().max(10000).optional().nullable(),
  lessonsLearned: z.string().max(10000).optional().nullable(),
});

export type UpdateImprovementProposalInput = z.infer<typeof updateImprovementProposalSchema>;

export const submitProposalSchema = z.object({
  approvalChain: z.array(z.object({
    level: z.number().int().min(1),
    approverRole: z.string().min(1).max(100),
  })).min(1),
});

export type SubmitProposalInput = z.infer<typeof submitProposalSchema>;

export const approveProposalSchema = z.object({
  approved: z.boolean(),
  comments: z.string().max(2000).optional().nullable(),
});

export type ApproveProposalInput = z.infer<typeof approveProposalSchema>;

// ============================================
// SCHEDULING VALIDATORS
// ============================================

export const createAuditScheduleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  scheduleType: z.enum(['risk_assessment', 'compliance_check', 'commonality_study', 'report']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'custom']),
  cronExpression: z.string().max(100).optional().nullable(),
  configuration: z.object({
    entityTypes: z.array(z.string()).optional(),
    entityIds: z.array(z.string().uuid()).optional(),
    assessmentType: z.string().optional(),
    standards: z.array(z.string()).optional(),
    studyType: z.string().optional(),
    reportFormat: z.string().optional(),
  }).optional(),
  notifyUsers: z.array(z.string().uuid()).optional().nullable(),
  notifyOnCompletion: z.boolean().default(true),
  notifyOnHighRisk: z.boolean().default(true),
  highRiskThreshold: z.number().min(0).max(100).default(70),
});

export type CreateAuditScheduleInput = z.infer<typeof createAuditScheduleSchema>;

export const updateAuditScheduleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'custom']).optional(),
  cronExpression: z.string().max(100).optional().nullable(),
  configuration: z.object({
    entityTypes: z.array(z.string()).optional(),
    entityIds: z.array(z.string().uuid()).optional(),
    assessmentType: z.string().optional(),
    standards: z.array(z.string()).optional(),
    studyType: z.string().optional(),
    reportFormat: z.string().optional(),
  }).optional(),
  notifyUsers: z.array(z.string().uuid()).optional().nullable(),
  notifyOnCompletion: z.boolean().optional(),
  notifyOnHighRisk: z.boolean().optional(),
  highRiskThreshold: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateAuditScheduleInput = z.infer<typeof updateAuditScheduleSchema>;

// ============================================
// CONFIGURATION VALIDATORS
// ============================================

export const updateAuditConfigurationSchema = z.object({
  riskScoreWeights: z.object({
    quality: z.number().min(0).max(1),
    process: z.number().min(0).max(1),
    supplier: z.number().min(0).max(1),
    compliance: z.number().min(0).max(1),
  }).refine(w => Math.abs(w.quality + w.process + w.supplier + w.compliance - 1) < 0.01, {
    message: 'Weights must sum to 1',
  }).optional(),
  riskThresholds: z.object({
    low: z.number().min(0).max(100),
    medium: z.number().min(0).max(100),
    high: z.number().min(0).max(100),
    critical: z.number().min(0).max(100),
  }).optional(),
  approvalLevels: z.array(z.object({
    level: z.number().int().min(1),
    role: z.string().min(1).max(100),
    minProposalPriority: z.enum(['critical', 'high', 'medium', 'low']),
  })).optional(),
  defaultStandards: z.array(z.string()).optional().nullable(),
  autoGenerateTasks: z.boolean().optional(),
  autoGenerateThreshold: z.number().min(0).max(100).optional(),
  notificationSettings: z.object({
    emailOnHighRisk: z.boolean(),
    emailOnNonCompliance: z.boolean(),
    emailOnProposalSubmission: z.boolean(),
    dailyDigest: z.boolean(),
  }).optional(),
});

export type UpdateAuditConfigurationInput = z.infer<typeof updateAuditConfigurationSchema>;

// ============================================
// QUERY VALIDATORS
// ============================================

export const auditTasksQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'deferred']).optional(),
  auditType: z.enum(['quality', 'process', 'supplier', 'safety', 'compliance']).optional(),
  source: z.enum(['risk_assessment', 'compliance_check', 'commonality_study', 'manual']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  assignedTo: z.string().uuid().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  aiGenerated: z.boolean().optional(),
  minRiskScore: z.number().min(0).max(100).optional(),
  maxRiskScore: z.number().min(0).max(100).optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['taskNumber', 'title', 'riskScore', 'priority', 'dueDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AuditTasksQueryInput = z.infer<typeof auditTasksQuerySchema>;

export const riskAssessmentsQuerySchema = z.object({
  assessmentType: z.enum(['work_order', 'supplier', 'process', 'product', 'facility']).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  entityId: z.string().uuid().optional(),
  minRiskScore: z.number().min(0).max(100).optional(),
  maxRiskScore: z.number().min(0).max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type RiskAssessmentsQueryInput = z.infer<typeof riskAssessmentsQuerySchema>;

export const commonalityStudiesQuerySchema = z.object({
  studyType: z.enum(['defect_pattern', 'supplier_comparison', 'process_improvement', 'root_cause']).optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'archived']).optional(),
  auditApprovalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  createdBy: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CommonalityStudiesQueryInput = z.infer<typeof commonalityStudiesQuerySchema>;

export const proposalsQuerySchema = z.object({
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'implementing', 'implemented', 'cancelled']).optional(),
  category: z.enum(['process', 'quality', 'supplier', 'equipment', 'training']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  aiGenerated: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type ProposalsQueryInput = z.infer<typeof proposalsQuerySchema>;
