/**
 * AI Routes
 * AI-powered features: chat, search, extraction, insights
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { AIService } from '../services/ai.service';

const aiRouter = new Hono<{ Bindings: Env }>();

// All routes require authentication
aiRouter.use('/*', authMiddleware);

/**
 * Chat with AI assistant
 * POST /ai/chat
 */
aiRouter.post(
  '/chat',
  checkPermission('ai:chat:use'),
  zValidator(
    'json',
    z.object({
      conversationId: z.string().optional(),
      message: z.string().min(1),
      systemRole: z.enum([
        'assistant',
        'financialAdvisor',
        'invoiceExtractor',
        'customerAnalyst',
        'inventoryOptimizer',
        'dataAnalyst',
      ]).optional(),
      context: z.string().optional(),
    })
  ),
  async (c) => {
    const organizationId = c.req.header('x-organization-id');
    if (!organizationId) {
      return c.json(
        { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
        400
      );
    }

    const userId = c.get('userId');
    const data = c.req.valid('json');

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    const response = await aiService.chat(userId, organizationId, data);

    return c.json({ data: response });
  }
);

/**
 * Get conversation history
 * GET /ai/conversations?limit=20
 */
aiRouter.get(
  '/conversations',
  checkPermission('ai:chat:use'),
  async (c) => {
    const organizationId = c.req.header('x-organization-id');
    if (!organizationId) {
      return c.json(
        { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
        400
      );
    }

    const userId = c.get('userId');
    const limitStr = c.req.query('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    const conversations = await aiService.getConversations(userId, organizationId, limit);

    return c.json({ data: conversations });
  }
);

/**
 * Get single conversation
 * GET /ai/conversations/:id
 */
aiRouter.get(
  '/conversations/:id',
  checkPermission('ai:chat:use'),
  async (c) => {
    const userId = c.get('userId');
    const conversationId = c.req.param('id');

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    const conversation = await aiService.getConversation(userId, conversationId);

    return c.json({ data: conversation });
  }
);

/**
 * Delete conversation
 * DELETE /ai/conversations/:id
 */
aiRouter.delete(
  '/conversations/:id',
  checkPermission('ai:chat:use'),
  async (c) => {
    const userId = c.get('userId');
    const conversationId = c.req.param('id');

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    await aiService.deleteConversation(userId, conversationId);

    return c.json({ data: { message: 'Conversation deleted successfully' } });
  }
);

/**
 * Smart search
 * POST /ai/search
 */
aiRouter.post(
  '/search',
  checkPermission('ai:search:use'),
  zValidator(
    'json',
    z.object({
      query: z.string().min(1),
      entityType: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
    })
  ),
  async (c) => {
    const organizationId = c.req.header('x-organization-id');
    if (!organizationId) {
      return c.json(
        { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
        400
      );
    }

    const data = c.req.valid('json');

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    const results = await aiService.search(organizationId, data);

    return c.json({ data: results });
  }
);

/**
 * Extract invoice data
 * POST /ai/extract/invoice
 */
aiRouter.post(
  '/extract/invoice',
  checkPermission('ai:extract:use'),
  zValidator(
    'json',
    z.object({
      text: z.string().min(1),
    })
  ),
  async (c) => {
    const organizationId = c.req.header('x-organization-id');
    if (!organizationId) {
      return c.json(
        { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
        400
      );
    }

    const userId = c.get('userId');
    const { text } = c.req.valid('json');

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    const result = await aiService.extractInvoiceData(organizationId, userId, text);

    return c.json({ data: result });
  }
);

/**
 * Generate insights for an entity
 * POST /ai/insights/generate
 */
aiRouter.post(
  '/insights/generate',
  checkPermission('ai:insights:use'),
  zValidator(
    'json',
    z.object({
      entityType: z.string(),
      entityId: z.string(),
    })
  ),
  async (c) => {
    const organizationId = c.req.header('x-organization-id');
    if (!organizationId) {
      return c.json(
        { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
        400
      );
    }

    const userId = c.get('userId');
    const { entityType, entityId } = c.req.valid('json');

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    const insights = await aiService.generateInsights(
      organizationId,
      userId,
      entityType,
      entityId
    );

    return c.json({ data: insights });
  }
);

/**
 * Get insights
 * GET /ai/insights?type=analysis&entityType=invoice&dismissed=false
 */
aiRouter.get(
  '/insights',
  checkPermission('ai:insights:use'),
  async (c) => {
    const organizationId = c.req.header('x-organization-id');
    if (!organizationId) {
      return c.json(
        { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
        400
      );
    }

    const type = c.req.query('type');
    const entityType = c.req.query('entityType');
    const dismissedStr = c.req.query('dismissed');

    const filters: any = {};
    if (type) filters.type = type;
    if (entityType) filters.entityType = entityType;
    if (dismissedStr) filters.dismissed = dismissedStr === 'true';

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    const insights = await aiService.getInsights(organizationId, filters);

    return c.json({ data: insights });
  }
);

/**
 * Dismiss an insight
 * POST /ai/insights/:id/dismiss
 */
aiRouter.post(
  '/insights/:id/dismiss',
  checkPermission('ai:insights:use'),
  async (c) => {
    const organizationId = c.req.header('x-organization-id');
    if (!organizationId) {
      return c.json(
        { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
        400
      );
    }

    const insightId = c.req.param('id');

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    await aiService.dismissInsight(insightId, organizationId);

    return c.json({ data: { message: 'Insight dismissed successfully' } });
  }
);

/**
 * Get AI usage statistics
 * GET /ai/usage?startDate=2024-01-01&endDate=2024-12-31
 */
aiRouter.get(
  '/usage',
  checkPermission('ai:usage:view'),
  async (c) => {
    const organizationId = c.req.header('x-organization-id');
    if (!organizationId) {
      return c.json(
        { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
        400
      );
    }

    const startDateStr = c.req.query('startDate');
    const endDateStr = c.req.query('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const aiService = new AIService(c.env.DB, c.env.AI, c.env.CACHE);
    const stats = await aiService.getUsageStats(organizationId, startDate, endDate);

    return c.json({ data: stats });
  }
);

export default aiRouter;
