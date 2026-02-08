/**
 * Clinical AI Routes
 * /api/v1/clinical-ai
 * AI-powered clinical documentation, patient summaries, and diagnostic suggestions
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { HealthcareAIService } from '../services/clinical-ai/healthcare-ai.service';
import { requireAuth, requirePermission } from '../middleware/auth';
import type { Env } from '../types';

const clinicalAi = new Hono<{ Bindings: Env }>();

// All routes require authentication
clinicalAi.use('/*', requireAuth);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const generateDocumentSchema = z.object({
  patientId: z.string().uuid(),
  documentType: z.enum([
    'consultation_note', 'discharge_summary', 'referral_letter', 'progress_note',
    'surgical_report', 'procedure_note', 'admission_note', 'transfer_note'
  ]),
  module: z.enum(['dialyse', 'cardiology', 'ophthalmology', 'general']).optional(),
  consultationId: z.string().uuid().optional(),
  encounterId: z.string().optional(),
  context: z.object({
    patientId: z.string().uuid(),
    module: z.enum(['dialyse', 'cardiology', 'ophthalmology', 'general']).optional(),
    symptoms: z.array(z.string()).optional(),
    vitalSigns: z.record(z.any()).optional(),
    labResults: z.record(z.any()).optional(),
    medications: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    medicalHistory: z.array(z.string()).optional(),
    chiefComplaint: z.string().optional(),
    physicalExam: z.string().optional(),
  }),
  language: z.enum(['fr', 'en']).optional(),
  customPrompt: z.string().optional(),
});

const finalizeDocumentSchema = z.object({
  finalContent: z.string().min(1),
});

const generateSummarySchema = z.object({
  patientId: z.string().uuid(),
  summaryType: z.enum([
    'comprehensive', 'admission', 'discharge', 'specialty',
    'problem_focused', 'pre_operative', 'handoff'
  ]),
  module: z.enum(['dialyse', 'cardiology', 'ophthalmology', 'general']).optional(),
  dateRange: z.object({
    from: z.string().transform((s) => new Date(s)),
    to: z.string().transform((s) => new Date(s)),
  }).optional(),
  includeLabResults: z.boolean().optional(),
  includeMedications: z.boolean().optional(),
  language: z.enum(['fr', 'en']).optional(),
});

const diagnosticSuggestionSchema = z.object({
  patientId: z.string().uuid(),
  module: z.enum(['dialyse', 'cardiology', 'ophthalmology', 'general']).optional(),
  consultationId: z.string().uuid().optional(),
  encounterId: z.string().optional(),
  input: z.object({
    symptoms: z.array(z.object({
      name: z.string(),
      severity: z.number().min(1).max(10).optional(),
      duration: z.string().optional(),
    })),
    vitalSigns: z.object({
      bloodPressure: z.object({
        systolic: z.number(),
        diastolic: z.number(),
      }).optional(),
      heartRate: z.number().optional(),
      temperature: z.number().optional(),
      oxygenSaturation: z.number().optional(),
      respiratoryRate: z.number().optional(),
    }).optional(),
    labResults: z.record(z.object({
      value: z.number(),
      unit: z.string(),
      normalRange: z.string().optional(),
    })).optional(),
    imagingFindings: z.array(z.string()).optional(),
    medicalHistory: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
  }),
  language: z.enum(['fr', 'en']).optional(),
});

const respondToSuggestionSchema = z.object({
  decision: z.enum(['accepted', 'modified', 'rejected']),
  providerNotes: z.string().optional(),
  actualDiagnosis: z.string().optional(),
});

const upsertPromptSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['documentation', 'summary', 'diagnostic', 'report', 'analysis', 'extraction']),
  module: z.enum(['dialyse', 'cardiology', 'ophthalmology', 'general']).optional(),
  systemPrompt: z.string().min(1),
  userPromptTemplate: z.string().min(1),
  outputFormat: z.string().optional(),
  requiredVariables: z.array(z.string()).optional(),
  optionalVariables: z.array(z.string()).optional(),
  recommendedModel: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(100).max(4000).optional(),
  language: z.string().optional(),
});

const listQuerySchema = z.object({
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  offset: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 0)),
  module: z.enum(['dialyse', 'cardiology', 'ophthalmology', 'general']).optional(),
  category: z.string().optional(),
});

// ============================================================================
// HELPER FUNCTION
// ============================================================================

function getHealthcareAIService(c: any): HealthcareAIService {
  return new HealthcareAIService(
    c.env.DB,
    c.env.AI,
    c.env.CACHE
  );
}

// ============================================================================
// DOCUMENTATION ROUTES
// ============================================================================

/**
 * POST /clinical-ai/documentation/generate
 * Generate AI clinical document
 */
clinicalAi.post(
  '/documentation/generate',
  requirePermission('clinical-ai:documentation:create'),
  zValidator('json', generateDocumentSchema),
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const companyId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');

      const service = getHealthcareAIService(c);
      const result = await service.generateDocument(userId, companyId, data);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/documentation/generate' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

/**
 * PUT /clinical-ai/documentation/:id/finalize
 * Finalize a document with edited content
 */
clinicalAi.put(
  '/documentation/:id/finalize',
  requirePermission('clinical-ai:documentation:update'),
  zValidator('json', finalizeDocumentSchema),
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const companyId = c.get('realOrganizationId')!;
      const documentId = c.req.param('id');
      const { finalContent } = c.req.valid('json');

      const service = getHealthcareAIService(c);
      await service.finalizeDocument(userId, companyId, documentId, finalContent);

      return c.json({
        success: true,
        message: 'Document finalized successfully',
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/documentation/finalize' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

/**
 * PUT /clinical-ai/documentation/:id/sign
 * Sign a finalized document
 */
clinicalAi.put(
  '/documentation/:id/sign',
  requirePermission('clinical-ai:documentation:sign'),
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const companyId = c.get('realOrganizationId')!;
      const documentId = c.req.param('id');

      const service = getHealthcareAIService(c);
      await service.signDocument(userId, companyId, documentId);

      return c.json({
        success: true,
        message: 'Document signed successfully',
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/documentation/sign' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

// ============================================================================
// PATIENT SUMMARIES ROUTES
// ============================================================================

/**
 * POST /clinical-ai/summaries/generate
 * Generate AI patient summary
 */
clinicalAi.post(
  '/summaries/generate',
  requirePermission('clinical-ai:summaries:create'),
  zValidator('json', generateSummarySchema),
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const companyId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');

      const service = getHealthcareAIService(c);
      const result = await service.generateSummary(userId, companyId, data);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/summaries/generate' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

/**
 * GET /clinical-ai/summaries/:patientId
 * Get patient summaries
 */
clinicalAi.get(
  '/summaries/:patientId',
  requirePermission('clinical-ai:summaries:read'),
  zValidator('query', z.object({
    summaryType: z.enum([
      'comprehensive', 'admission', 'discharge', 'specialty',
      'problem_focused', 'pre_operative', 'handoff'
    ]).optional(),
  })),
  async (c) => {
    try {
      const companyId = c.get('realOrganizationId')!;
      const patientId = c.req.param('patientId');
      const { summaryType } = c.req.valid('query');

      const service = getHealthcareAIService(c);
      const summaries = await service.getPatientSummaries(companyId, patientId, summaryType);

      return c.json({
        success: true,
        data: summaries,
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/summaries' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

// ============================================================================
// DIAGNOSTIC SUGGESTIONS ROUTES
// ============================================================================

/**
 * POST /clinical-ai/diagnostics/suggest
 * Generate diagnostic suggestions
 */
clinicalAi.post(
  '/diagnostics/suggest',
  requirePermission('clinical-ai:diagnostics:create'),
  zValidator('json', diagnosticSuggestionSchema),
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const companyId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');

      const service = getHealthcareAIService(c);
      const result = await service.generateDiagnosticSuggestions(userId, companyId, data);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/diagnostics/suggest' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

/**
 * PUT /clinical-ai/diagnostics/:id/view
 * Mark diagnostic suggestion as viewed
 */
clinicalAi.put(
  '/diagnostics/:id/view',
  requirePermission('clinical-ai:diagnostics:read'),
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const companyId = c.get('realOrganizationId')!;
      const suggestionId = c.req.param('id');

      const service = getHealthcareAIService(c);
      await service.viewDiagnosticSuggestion(userId, companyId, suggestionId);

      return c.json({
        success: true,
        message: 'Marked as viewed',
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/diagnostics/view' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

/**
 * PUT /clinical-ai/diagnostics/:id/respond
 * Accept, modify, or reject diagnostic suggestion
 */
clinicalAi.put(
  '/diagnostics/:id/respond',
  requirePermission('clinical-ai:diagnostics:update'),
  zValidator('json', respondToSuggestionSchema),
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const companyId = c.get('realOrganizationId')!;
      const suggestionId = c.req.param('id');
      const { decision, providerNotes, actualDiagnosis } = c.req.valid('json');

      const service = getHealthcareAIService(c);
      await service.respondToDiagnosticSuggestion(
        userId,
        companyId,
        suggestionId,
        decision,
        providerNotes,
        actualDiagnosis
      );

      return c.json({
        success: true,
        message: 'Response recorded',
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/diagnostics/respond' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

// ============================================================================
// PROMPT MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /clinical-ai/prompts
 * List clinical prompts
 */
clinicalAi.get(
  '/prompts',
  requirePermission('clinical-ai:prompts:read'),
  zValidator('query', listQuerySchema),
  async (c) => {
    try {
      const companyId = c.get('realOrganizationId')!;
      const { category, module } = c.req.valid('query');

      const service = getHealthcareAIService(c);
      const prompts = await service.getClinicalPrompts(companyId, category, module);

      return c.json({
        success: true,
        data: prompts,
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/prompts' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

/**
 * POST /clinical-ai/prompts
 * Create or update clinical prompt
 */
clinicalAi.post(
  '/prompts',
  requirePermission('clinical-ai:prompts:create'),
  zValidator('json', upsertPromptSchema),
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const companyId = c.get('realOrganizationId')!;
      const data = c.req.valid('json');

      const service = getHealthcareAIService(c);
      const promptId = await service.upsertClinicalPrompt(userId, companyId, data);

      return c.json({
        success: true,
        data: { id: promptId },
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/prompts' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

// ============================================================================
// USAGE & ANALYTICS ROUTES
// ============================================================================

/**
 * GET /clinical-ai/usage
 * Get AI usage statistics
 */
clinicalAi.get(
  '/usage',
  requirePermission('clinical-ai:usage:read'),
  zValidator('query', z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })),
  async (c) => {
    try {
      const companyId = c.get('realOrganizationId')!;
      const query = c.req.valid('query');

      const service = getHealthcareAIService(c);
      const stats = await service.getUsageStats(
        companyId,
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      );

      return c.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Route error', error, { route: 'clinical-ai/usage' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      }, 500);
    }
  }
);

export default clinicalAi;
