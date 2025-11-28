/**
 * Smart Audit System Routes
 * EF1: Risk Assessment, EF2: Compliance Copilot, EF3: Commonality Study
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { AuditService } from '../services/audit.service';
import {
  createAuditTaskSchema,
  updateAuditTaskSchema,
  completeAuditTaskSchema,
  createAuditFindingSchema,
  updateAuditFindingSchema,
  runRiskAssessmentSchema,
  generateAuditTasksSchema,
  addRiskDataPointSchema,
  complianceChatSchema,
  runComplianceCheckSchema,
  addKnowledgeBaseEntrySchema,
  updateKnowledgeBaseEntrySchema,
  searchKnowledgeBaseSchema,
  runCommonalityAnalysisSchema,
  approveStudySchema,
  createImprovementProposalSchema,
  updateImprovementProposalSchema,
  submitProposalSchema,
  approveProposalSchema,
  createAuditScheduleSchema,
  updateAuditScheduleSchema,
  updateAuditConfigurationSchema,
  auditTasksQuerySchema,
  riskAssessmentsQuerySchema,
  commonalityStudiesQuerySchema,
  proposalsQuerySchema,
} from '@perfex/shared';

const auditRouter = new Hono<{ Bindings: Env }>();

// All routes require authentication
auditRouter.use('/*', authMiddleware);

// Helper to get organization ID
const getOrganizationId = (c: any) => {
  const organizationId = c.req.header('x-organization-id');
  if (!organizationId) {
    throw new Error('MISSING_ORGANIZATION');
  }
  return organizationId;
};

// ============================================
// CORE AUDIT - TASKS
// ============================================

/**
 * Get audit tasks
 * GET /audit/tasks
 */
auditRouter.get(
  '/tasks',
  checkPermission('audit:read'),
  zValidator('query', auditTasksQuerySchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const query = c.req.valid('query');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const result = await auditService.getTasks(organizationId, query);

    return c.json({ data: result });
  }
);

/**
 * Get audit task by ID
 * GET /audit/tasks/:id
 */
auditRouter.get(
  '/tasks/:id',
  checkPermission('audit:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const taskId = c.req.param('id');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const task = await auditService.getTask(organizationId, taskId);

    return c.json({ data: task });
  }
);

/**
 * Get task statistics for dashboard
 * GET /audit/tasks/stats
 */
auditRouter.get(
  '/tasks/stats',
  checkPermission('audit:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const stats = await auditService.getTaskStats(organizationId);

    return c.json({ data: stats });
  }
);

/**
 * Create audit task
 * POST /audit/tasks
 */
auditRouter.post(
  '/tasks',
  checkPermission('audit:create'),
  zValidator('json', createAuditTaskSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const task = await auditService.createTask(organizationId, userId, data);

    return c.json({ data: task }, 201);
  }
);

/**
 * Update audit task
 * PUT /audit/tasks/:id
 */
auditRouter.put(
  '/tasks/:id',
  checkPermission('audit:update'),
  zValidator('json', updateAuditTaskSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const taskId = c.req.param('id');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const task = await auditService.updateTask(organizationId, taskId, data);

    return c.json({ data: task });
  }
);

/**
 * Complete audit task with findings
 * POST /audit/tasks/:id/complete
 */
auditRouter.post(
  '/tasks/:id/complete',
  checkPermission('audit:complete'),
  zValidator('json', completeAuditTaskSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const taskId = c.req.param('id');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const result = await auditService.completeTask(organizationId, userId, taskId, data);

    return c.json({ data: result });
  }
);

/**
 * Delete audit task
 * DELETE /audit/tasks/:id
 */
auditRouter.delete(
  '/tasks/:id',
  checkPermission('audit:delete'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const taskId = c.req.param('id');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    await auditService.deleteTask(organizationId, taskId);

    return c.json({ data: { message: 'Task deleted successfully' } });
  }
);

// ============================================
// CORE AUDIT - FINDINGS
// ============================================

/**
 * Get findings for a task
 * GET /audit/tasks/:taskId/findings
 */
auditRouter.get(
  '/tasks/:taskId/findings',
  checkPermission('audit:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const taskId = c.req.param('taskId');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const findings = await auditService.getFindings(organizationId, taskId);

    return c.json({ data: findings });
  }
);

/**
 * Get all findings
 * GET /audit/findings
 */
auditRouter.get(
  '/findings',
  checkPermission('audit:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const findings = await auditService.getAllFindings(organizationId);

    return c.json({ data: findings });
  }
);

/**
 * Create finding
 * POST /audit/findings
 */
auditRouter.post(
  '/findings',
  checkPermission('audit:create'),
  zValidator('json', createAuditFindingSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const finding = await auditService.createFinding(organizationId, userId, data);

    return c.json({ data: finding }, 201);
  }
);

/**
 * Update finding
 * PUT /audit/findings/:id
 */
auditRouter.put(
  '/findings/:id',
  checkPermission('audit:update'),
  zValidator('json', updateAuditFindingSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const findingId = c.req.param('id');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const finding = await auditService.updateFinding(organizationId, findingId, data);

    return c.json({ data: finding });
  }
);

// ============================================
// EF1: RISK ASSESSMENT
// ============================================

/**
 * Run AI risk assessment
 * POST /audit/risk/assess
 */
auditRouter.post(
  '/risk/assess',
  checkPermission('audit:risk:create'),
  zValidator('json', runRiskAssessmentSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const assessment = await auditService.runRiskAssessment(organizationId, userId, data);

    return c.json({ data: assessment });
  }
);

/**
 * Get risk assessments
 * GET /audit/risk/assessments
 */
auditRouter.get(
  '/risk/assessments',
  checkPermission('audit:risk:read'),
  zValidator('query', riskAssessmentsQuerySchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const query = c.req.valid('query');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const assessments = await auditService.getRiskAssessments(organizationId, query);

    return c.json({ data: assessments });
  }
);

/**
 * Get single risk assessment
 * GET /audit/risk/assessments/:id
 */
auditRouter.get(
  '/risk/assessments/:id',
  checkPermission('audit:risk:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const assessmentId = c.req.param('id');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const assessment = await auditService.getRiskAssessment(organizationId, assessmentId);

    return c.json({ data: assessment });
  }
);

/**
 * Generate audit tasks from risk assessment
 * POST /audit/risk/generate-tasks
 */
auditRouter.post(
  '/risk/generate-tasks',
  checkPermission('audit:risk:generate'),
  zValidator('json', generateAuditTasksSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const tasks = await auditService.generateTasksFromAssessment(organizationId, userId, data);

    return c.json({ data: tasks });
  }
);

/**
 * Get risk dashboard data
 * GET /audit/risk/dashboard
 */
auditRouter.get(
  '/risk/dashboard',
  checkPermission('audit:risk:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const dashboard = await auditService.getRiskDashboard(organizationId);

    return c.json({ data: dashboard });
  }
);

/**
 * Add risk data point
 * POST /audit/risk/data-points
 */
auditRouter.post(
  '/risk/data-points',
  checkPermission('audit:risk:create'),
  zValidator('json', addRiskDataPointSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const dataPoint = await auditService.addRiskDataPoint(organizationId, data);

    return c.json({ data: dataPoint }, 201);
  }
);

// ============================================
// EF2: COMPLIANCE COPILOT
// ============================================

/**
 * Chat with compliance copilot
 * POST /audit/compliance/chat
 */
auditRouter.post(
  '/compliance/chat',
  checkPermission('audit:compliance:use'),
  zValidator('json', complianceChatSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const response = await auditService.complianceChat(organizationId, userId, data);

    return c.json({ data: response });
  }
);

/**
 * Run compliance check
 * POST /audit/compliance/check
 */
auditRouter.post(
  '/compliance/check',
  checkPermission('audit:compliance:check'),
  zValidator('json', runComplianceCheckSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const check = await auditService.runComplianceCheck(organizationId, userId, data);

    return c.json({ data: check });
  }
);

/**
 * Get compliance checks
 * GET /audit/compliance/checks
 */
auditRouter.get(
  '/compliance/checks',
  checkPermission('audit:compliance:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const entityType = c.req.query('entityType');
    const entityId = c.req.query('entityId');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const checks = await auditService.getComplianceChecks(organizationId, { entityType, entityId });

    return c.json({ data: checks });
  }
);

/**
 * Search knowledge base
 * POST /audit/compliance/knowledge-base/search
 */
auditRouter.post(
  '/compliance/knowledge-base/search',
  checkPermission('audit:compliance:kb:read'),
  zValidator('json', searchKnowledgeBaseSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const results = await auditService.searchKnowledgeBase(organizationId, data);

    return c.json({ data: results });
  }
);

/**
 * Get knowledge base entries
 * GET /audit/compliance/knowledge-base
 */
auditRouter.get(
  '/compliance/knowledge-base',
  checkPermission('audit:compliance:kb:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const category = c.req.query('category');
    const documentType = c.req.query('documentType');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const entries = await auditService.getKnowledgeBaseEntries(organizationId, { category, documentType });

    return c.json({ data: entries });
  }
);

/**
 * Add knowledge base entry
 * POST /audit/compliance/knowledge-base
 */
auditRouter.post(
  '/compliance/knowledge-base',
  checkPermission('audit:compliance:kb:manage'),
  zValidator('json', addKnowledgeBaseEntrySchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const entry = await auditService.addKnowledgeBaseEntry(organizationId, userId, data);

    return c.json({ data: entry }, 201);
  }
);

/**
 * Update knowledge base entry
 * PUT /audit/compliance/knowledge-base/:id
 */
auditRouter.put(
  '/compliance/knowledge-base/:id',
  checkPermission('audit:compliance:kb:manage'),
  zValidator('json', updateKnowledgeBaseEntrySchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const entryId = c.req.param('id');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const entry = await auditService.updateKnowledgeBaseEntry(organizationId, entryId, data);

    return c.json({ data: entry });
  }
);

/**
 * Delete knowledge base entry
 * DELETE /audit/compliance/knowledge-base/:id
 */
auditRouter.delete(
  '/compliance/knowledge-base/:id',
  checkPermission('audit:compliance:kb:manage'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const entryId = c.req.param('id');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    await auditService.deleteKnowledgeBaseEntry(organizationId, entryId);

    return c.json({ data: { message: 'Entry deleted successfully' } });
  }
);

// ============================================
// EF3: COMMONALITY STUDY
// ============================================

/**
 * Run commonality analysis (ReAct agent)
 * POST /audit/commonality/analyze
 */
auditRouter.post(
  '/commonality/analyze',
  checkPermission('audit:commonality:create'),
  zValidator('json', runCommonalityAnalysisSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const study = await auditService.runCommonalityAnalysis(organizationId, userId, data);

    return c.json({ data: study });
  }
);

/**
 * Get commonality studies
 * GET /audit/commonality/studies
 */
auditRouter.get(
  '/commonality/studies',
  checkPermission('audit:commonality:read'),
  zValidator('query', commonalityStudiesQuerySchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const query = c.req.valid('query');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const studies = await auditService.getCommonalityStudies(organizationId, query);

    return c.json({ data: studies });
  }
);

/**
 * Get single commonality study
 * GET /audit/commonality/studies/:id
 */
auditRouter.get(
  '/commonality/studies/:id',
  checkPermission('audit:commonality:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const studyId = c.req.param('id');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const study = await auditService.getCommonalityStudy(organizationId, studyId);

    return c.json({ data: study });
  }
);

/**
 * Approve/reject commonality study
 * POST /audit/commonality/studies/:id/approve
 */
auditRouter.post(
  '/commonality/studies/:id/approve',
  checkPermission('audit:commonality:approve'),
  zValidator('json', approveStudySchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const studyId = c.req.param('id');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const study = await auditService.approveStudy(organizationId, userId, studyId, data);

    return c.json({ data: study });
  }
);

/**
 * Get supplier insights from studies
 * GET /audit/commonality/supplier-insights
 */
auditRouter.get(
  '/commonality/supplier-insights',
  checkPermission('audit:commonality:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const supplierId = c.req.query('supplierId');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const insights = await auditService.getSupplierInsights(organizationId, supplierId);

    return c.json({ data: insights });
  }
);

// ============================================
// IMPROVEMENT PROPOSALS
// ============================================

/**
 * Get improvement proposals
 * GET /audit/proposals
 */
auditRouter.get(
  '/proposals',
  checkPermission('audit:proposals:read'),
  zValidator('query', proposalsQuerySchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const query = c.req.valid('query');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const proposals = await auditService.getProposals(organizationId, query);

    return c.json({ data: proposals });
  }
);

/**
 * Get single proposal
 * GET /audit/proposals/:id
 */
auditRouter.get(
  '/proposals/:id',
  checkPermission('audit:proposals:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const proposalId = c.req.param('id');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const proposal = await auditService.getProposal(organizationId, proposalId);

    return c.json({ data: proposal });
  }
);

/**
 * Create improvement proposal
 * POST /audit/proposals
 */
auditRouter.post(
  '/proposals',
  checkPermission('audit:proposals:create'),
  zValidator('json', createImprovementProposalSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const proposal = await auditService.createProposal(organizationId, userId, data);

    return c.json({ data: proposal }, 201);
  }
);

/**
 * Update proposal
 * PUT /audit/proposals/:id
 */
auditRouter.put(
  '/proposals/:id',
  checkPermission('audit:proposals:create'),
  zValidator('json', updateImprovementProposalSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const proposalId = c.req.param('id');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const proposal = await auditService.updateProposal(organizationId, proposalId, data);

    return c.json({ data: proposal });
  }
);

/**
 * Submit proposal for approval
 * POST /audit/proposals/:id/submit
 */
auditRouter.post(
  '/proposals/:id/submit',
  checkPermission('audit:proposals:submit'),
  zValidator('json', submitProposalSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const proposalId = c.req.param('id');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const proposal = await auditService.submitProposal(organizationId, userId, proposalId, data);

    return c.json({ data: proposal });
  }
);

/**
 * Approve/reject proposal
 * POST /audit/proposals/:id/approve
 */
auditRouter.post(
  '/proposals/:id/approve',
  checkPermission('audit:proposals:approve'),
  zValidator('json', approveProposalSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const proposalId = c.req.param('id');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const proposal = await auditService.approveProposal(organizationId, userId, proposalId, data);

    return c.json({ data: proposal });
  }
);

// ============================================
// SCHEDULES
// ============================================

/**
 * Get audit schedules
 * GET /audit/schedules
 */
auditRouter.get(
  '/schedules',
  checkPermission('audit:schedules:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const schedules = await auditService.getSchedules(organizationId);

    return c.json({ data: schedules });
  }
);

/**
 * Create audit schedule
 * POST /audit/schedules
 */
auditRouter.post(
  '/schedules',
  checkPermission('audit:schedules:manage'),
  zValidator('json', createAuditScheduleSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const userId = c.get('userId');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const schedule = await auditService.createSchedule(organizationId, userId, data);

    return c.json({ data: schedule }, 201);
  }
);

/**
 * Update audit schedule
 * PUT /audit/schedules/:id
 */
auditRouter.put(
  '/schedules/:id',
  checkPermission('audit:schedules:manage'),
  zValidator('json', updateAuditScheduleSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const scheduleId = c.req.param('id');
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const schedule = await auditService.updateSchedule(organizationId, scheduleId, data);

    return c.json({ data: schedule });
  }
);

/**
 * Delete audit schedule
 * DELETE /audit/schedules/:id
 */
auditRouter.delete(
  '/schedules/:id',
  checkPermission('audit:schedules:manage'),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const scheduleId = c.req.param('id');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    await auditService.deleteSchedule(organizationId, scheduleId);

    return c.json({ data: { message: 'Schedule deleted successfully' } });
  }
);

// ============================================
// CONFIGURATION
// ============================================

/**
 * Get audit configuration
 * GET /audit/config
 */
auditRouter.get(
  '/config',
  checkPermission('audit:config:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const config = await auditService.getConfiguration(organizationId);

    return c.json({ data: config });
  }
);

/**
 * Update audit configuration
 * PUT /audit/config
 */
auditRouter.put(
  '/config',
  checkPermission('audit:config:manage'),
  zValidator('json', updateAuditConfigurationSchema),
  async (c) => {
    const organizationId = getOrganizationId(c);
    const data = c.req.valid('json');

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const config = await auditService.updateConfiguration(organizationId, data);

    return c.json({ data: config });
  }
);

// ============================================
// DASHBOARD
// ============================================

/**
 * Get audit dashboard stats
 * GET /audit/dashboard
 */
auditRouter.get(
  '/dashboard',
  checkPermission('audit:read'),
  async (c) => {
    const organizationId = getOrganizationId(c);

    const auditService = new AuditService(c.env.DB, c.env.AI, c.env.CACHE);
    const dashboard = await auditService.getDashboard(organizationId);

    return c.json({ data: dashboard });
  }
);

export default auditRouter;
