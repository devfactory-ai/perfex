/**
 * Smart Audit System Types
 * EF1: Risk Assessment, EF2: Compliance Copilot, EF3: Commonality Study
 */

// ============================================
// CORE AUDIT TYPES
// ============================================

export type AuditTaskSource = 'risk_assessment' | 'compliance_check' | 'commonality_study' | 'manual';
export type AuditType = 'quality' | 'process' | 'supplier' | 'safety' | 'compliance';
export type AuditTaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type AuditTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
export type AuditEntityType = 'work_order' | 'grn' | 'supplier' | 'product' | 'process';
export type FindingSeverity = 'critical' | 'major' | 'minor' | 'observation';
export type FindingCategory = 'non_conformance' | 'observation' | 'opportunity' | 'positive';
export type CorrectiveActionStatus = 'pending' | 'in_progress' | 'completed' | 'verified';

export interface AuditTask {
  id: string;
  organizationId: string;
  taskNumber: string;
  title: string;
  description: string | null;
  source: AuditTaskSource;
  auditType: AuditType;
  priority: AuditTaskPriority;
  riskScore: number | null;
  riskFactors: string[] | null;
  assignedTo: string | null;
  assignedAt: Date | null;
  status: AuditTaskStatus;
  dueDate: Date | null;
  completedAt: Date | null;
  entityType: AuditEntityType | null;
  entityId: string | null;
  aiGenerated: boolean;
  aiConfidence: number | null;
  aiReasoning: string | null;
  notes: string | null;
  attachmentIds: string[] | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditFinding {
  id: string;
  organizationId: string;
  auditTaskId: string;
  findingNumber: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  category: FindingCategory;
  evidence: string | null;
  attachmentIds: string[] | null;
  correctiveActionRequired: boolean;
  correctiveActionDescription: string | null;
  correctiveActionDueDate: Date | null;
  correctiveActionStatus: CorrectiveActionStatus;
  aiAnalysis: string | null;
  aiRecommendations: string[] | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// EF1: RISK ASSESSMENT TYPES
// ============================================

export type AssessmentType = 'work_order' | 'supplier' | 'process' | 'product' | 'facility';
export type RiskAssessmentStatus = 'draft' | 'active' | 'archived';
export type RiskDataSource = 'work_order' | 'grn' | 'inspection' | 'sensor' | 'manual' | 'simotex';
export type RiskDataType = 'defect_rate' | 'rejection_count' | 'cycle_time' | 'compliance_score';
export type RiskDataCategory = 'quality' | 'process' | 'supplier' | 'compliance';

export interface RiskFactor {
  factor: string;
  score: number;
  weight: number;
  description: string;
}

export interface SuggestedResource {
  type: string;
  quantity: number;
  priority: string;
  rationale: string;
}

export interface RiskAssessment {
  id: string;
  organizationId: string;
  assessmentNumber: string;
  assessmentType: AssessmentType;
  entityType: string | null;
  entityId: string | null;
  assessmentDate: Date;
  periodStart: Date | null;
  periodEnd: Date | null;
  overallRiskScore: number;
  qualityRiskScore: number | null;
  processRiskScore: number | null;
  supplierRiskScore: number | null;
  complianceRiskScore: number | null;
  riskFactors: RiskFactor[] | null;
  aiModelVersion: string | null;
  inputData: Record<string, any> | null;
  aiAnalysis: string | null;
  recommendations: string[] | null;
  suggestedResources: SuggestedResource[] | null;
  tasksGenerated: number;
  status: RiskAssessmentStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskDataPoint {
  id: string;
  organizationId: string;
  source: RiskDataSource;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  dataType: RiskDataType;
  dataCategory: RiskDataCategory;
  numericValue: number | null;
  textValue: string | null;
  jsonValue: Record<string, any> | null;
  timestamp: Date;
  metadata: Record<string, any> | null;
  embedding: Buffer | null;
  processed: boolean;
  createdAt: Date;
}

// ============================================
// EF2: COMPLIANCE COPILOT TYPES
// ============================================

export type DocumentType = 'standard' | 'regulation' | 'procedure' | 'guideline' | 'checklist';
export type ComplianceCategory = 'iso9001' | 'iso14001' | 'osha' | 'industry_specific' | 'internal';
export type KnowledgeBaseStatus = 'draft' | 'active' | 'archived';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partially_compliant';

export interface ComplianceCheckResult {
  standard: string;
  requirement: string;
  status: string;
  evidence: string;
  gap: string | null;
  recommendation: string | null;
}

export interface ComplianceActionItem {
  description: string;
  priority: string;
  dueDate: string | null;
  assignedTo: string | null;
  status: string;
}

export interface ComplianceKnowledgeBase {
  id: string;
  organizationId: string;
  title: string;
  documentType: DocumentType;
  category: ComplianceCategory;
  subcategory: string | null;
  content: string;
  summary: string | null;
  keywords: string[] | null;
  version: string;
  effectiveDate: Date | null;
  expiryDate: Date | null;
  embedding: Buffer | null;
  sourceUrl: string | null;
  lastReviewDate: Date | null;
  reviewedBy: string | null;
  status: KnowledgeBaseStatus;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceCheck {
  id: string;
  organizationId: string;
  checkNumber: string;
  entityType: string;
  entityId: string;
  standardsChecked: string[] | null;
  overallStatus: ComplianceStatus;
  complianceScore: number | null;
  checkResults: ComplianceCheckResult[] | null;
  aiAnalysis: string | null;
  aiRecommendations: string[] | null;
  requiresAction: boolean;
  actionItems: ComplianceActionItem[] | null;
  performedBy: string;
  performedAt: Date;
  createdAt: Date;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

export interface ComplianceConversationContext {
  entityType?: string;
  entityId?: string;
  standards?: string[];
}

export interface ComplianceConversation {
  id: string;
  organizationId: string;
  userId: string;
  title: string | null;
  messages: ChatMessage[];
  context: ComplianceConversationContext | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// EF3: COMMONALITY STUDY TYPES
// ============================================

export type StudyType = 'defect_pattern' | 'supplier_comparison' | 'process_improvement' | 'root_cause';
export type CommonalityStatus = 'draft' | 'in_progress' | 'completed' | 'archived';
export type AuditApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ProposalStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'implementing' | 'implemented' | 'cancelled';
export type ProposalCategory = 'process' | 'quality' | 'supplier' | 'equipment' | 'training';
export type ImplementationEffort = 'low' | 'medium' | 'high';

export interface ReActStep {
  step: number;
  thought: string;
  action: string;
  observation: string;
  timestamp: string;
}

export interface PatternFound {
  patternId: string;
  patternType: string;
  description: string;
  frequency: number;
  severity: string;
  affectedEntities: string[];
  rootCause: string | null;
  confidence: number;
}

export interface StudyRecommendation {
  id: string;
  title: string;
  description: string;
  priority: string;
  expectedImpact: string;
  estimatedEffort: string;
  status: string;
}

export interface SupplierInsight {
  supplierId: string;
  supplierName: string;
  performanceScore: number;
  issues: string[];
  strengths: string[];
  recommendations: string[];
}

export interface VariantInfo {
  variantId: string;
  description: string;
  consistency: number;
  deviations: string[];
}

export interface VariantAnalysis {
  variants: VariantInfo[];
  overallConsistency: number;
}

export interface EntityFilters {
  entityTypes?: string[];
  entityIds?: string[];
  supplierIds?: string[];
  productIds?: string[];
  workOrderIds?: string[];
}

export interface CommonalityStudy {
  id: string;
  organizationId: string;
  studyNumber: string;
  title: string;
  description: string | null;
  studyType: StudyType;
  analysisStartDate: Date | null;
  analysisEndDate: Date | null;
  entityFilters: EntityFilters | null;
  reactTrace: ReActStep[] | null;
  patternsFound: PatternFound[] | null;
  recommendations: StudyRecommendation[] | null;
  supplierInsights: SupplierInsight[] | null;
  variantAnalysis: VariantAnalysis | null;
  status: CommonalityStatus;
  requiresApproval: boolean;
  approvalStatus: AuditApprovalStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  approvalComments: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImplementationStep {
  step: number;
  description: string;
  assignedTo: string | null;
  dueDate: string | null;
  status: string;
  completedAt: string | null;
}

export interface ApprovalChainItem {
  level: number;
  approverRole: string;
  approverId: string | null;
  status: string;
  comments: string | null;
  timestamp: string | null;
}

export interface ImprovementProposal {
  id: string;
  organizationId: string;
  proposalNumber: string;
  commonalityStudyId: string | null;
  title: string;
  description: string;
  category: ProposalCategory;
  expectedBenefits: string[] | null;
  estimatedCostSaving: number | null;
  estimatedQualityImprovement: number | null;
  implementationEffort: ImplementationEffort | null;
  priority: AuditTaskPriority;
  affectedProcesses: string[] | null;
  affectedSuppliers: string[] | null;
  affectedProducts: string[] | null;
  implementationSteps: ImplementationStep[] | null;
  status: ProposalStatus;
  submittedAt: Date | null;
  submittedBy: string | null;
  approvalChain: ApprovalChainItem[] | null;
  currentApprovalLevel: number;
  implementationStartDate: Date | null;
  implementationEndDate: Date | null;
  actualResults: string | null;
  lessonsLearned: string | null;
  aiGenerated: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SCHEDULING & CONFIGURATION TYPES
// ============================================

export type ScheduleType = 'risk_assessment' | 'compliance_check' | 'commonality_study' | 'report';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'custom';

export interface ScheduleConfiguration {
  entityTypes?: string[];
  entityIds?: string[];
  assessmentType?: string;
  standards?: string[];
  studyType?: string;
  reportFormat?: string;
}

export interface AuditSchedule {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  scheduleType: ScheduleType;
  frequency: ScheduleFrequency;
  cronExpression: string | null;
  configuration: ScheduleConfiguration | null;
  notifyUsers: string[] | null;
  notifyOnCompletion: boolean;
  notifyOnHighRisk: boolean;
  highRiskThreshold: number;
  isActive: boolean;
  lastRunAt: Date | null;
  lastRunStatus: string | null;
  lastRunResult: Record<string, any> | null;
  nextRunAt: Date | null;
  runCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskScoreWeights {
  quality: number;
  process: number;
  supplier: number;
  compliance: number;
}

export interface RiskThresholds {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface ApprovalLevelConfig {
  level: number;
  role: string;
  minProposalPriority: string;
}

export interface NotificationSettings {
  emailOnHighRisk: boolean;
  emailOnNonCompliance: boolean;
  emailOnProposalSubmission: boolean;
  dailyDigest: boolean;
}

export interface AuditConfiguration {
  id: string;
  organizationId: string;
  riskScoreWeights: RiskScoreWeights | null;
  riskThresholds: RiskThresholds | null;
  approvalLevels: ApprovalLevelConfig[] | null;
  defaultStandards: string[] | null;
  autoGenerateTasks: boolean;
  autoGenerateThreshold: number;
  notificationSettings: NotificationSettings | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface AuditDashboardStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasksCount: number;
  averageRiskScore: number;
  highRiskEntities: number;
  complianceRate: number;
  findingsCount: number;
  proposalsInProgress: number;
  tasksGeneratedByAI: number;
}

export interface RiskTrendData {
  date: string;
  overallRisk: number;
  qualityRisk: number;
  processRisk: number;
  supplierRisk: number;
}

export interface ComplianceChatResponse {
  message: string;
  sources: Array<{
    id: string;
    title: string;
    category: string;
    relevanceScore: number;
  }>;
  suggestions?: string[];
}
