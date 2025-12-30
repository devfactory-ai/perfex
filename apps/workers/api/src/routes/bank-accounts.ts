/**
 * Bank Account Routes
 * Bank account management endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createBankAccountSchema, updateBankAccountSchema } from '@perfex/shared';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { BankAccountService } from '../services/bank-account.service';
import { logger } from '../utils/logger';

const bankAccountsRouter = new Hono<{ Bindings: Env }>();

// All routes require authentication
bankAccountsRouter.use('/*', authMiddleware);

/**
 * Get bank accounts list
 * GET /bank-accounts?active=true
 */
bankAccountsRouter.get(
  '/',
  checkPermission('finance:bank_accounts:read'),
  async (c) => {
    try {
      const organizationId = c.req.header('x-organization-id');
      if (!organizationId) {
        return c.json(
          { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
          400
        );
      }

      const activeParam = c.req.query('active');
      const active = activeParam ? activeParam === 'true' : undefined;

      const bankAccountService = new BankAccountService(c.env.DB);
      const bankAccountsList = await bankAccountService.list(organizationId, { active });

      return c.json({ data: bankAccountsList });
    } catch (error) {
      logger.error('Route error', error, { route: 'bank-accounts' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * Get bank account by ID
 * GET /bank-accounts/:id
 */
bankAccountsRouter.get(
  '/:id',
  checkPermission('finance:bank_accounts:read'),
  async (c) => {
    try {
      const organizationId = c.req.header('x-organization-id');
      if (!organizationId) {
        return c.json(
          { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
          400
        );
      }

      const bankAccountId = c.req.param('id');
      const bankAccountService = new BankAccountService(c.env.DB);
      const bankAccount = await bankAccountService.getById(bankAccountId, organizationId);

      return c.json({ data: bankAccount });
    } catch (error) {
      logger.error('Route error', error, { route: 'bank-accounts' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * Create bank account
 * POST /bank-accounts
 */
bankAccountsRouter.post(
  '/',
  checkPermission('finance:bank_accounts:create'),
  zValidator('json', createBankAccountSchema),
  async (c) => {
    try {
      const organizationId = c.req.header('x-organization-id');
      if (!organizationId) {
        return c.json(
          { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
          400
        );
      }

      const data = c.req.valid('json');
      const bankAccountService = new BankAccountService(c.env.DB);
      const bankAccount = await bankAccountService.create(organizationId, data);

      return c.json({ data: bankAccount }, 201);
    } catch (error) {
      logger.error('Route error', error, { route: 'bank-accounts' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * Update bank account
 * PUT /bank-accounts/:id
 */
bankAccountsRouter.put(
  '/:id',
  checkPermission('finance:bank_accounts:update'),
  zValidator('json', updateBankAccountSchema),
  async (c) => {
    try {
      const organizationId = c.req.header('x-organization-id');
      if (!organizationId) {
        return c.json(
          { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
          400
        );
      }

      const bankAccountId = c.req.param('id');
      const data = c.req.valid('json');
      const bankAccountService = new BankAccountService(c.env.DB);
      const bankAccount = await bankAccountService.update(bankAccountId, organizationId, data);

      return c.json({ data: bankAccount });
    } catch (error) {
      logger.error('Route error', error, { route: 'bank-accounts' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * Update bank account balance
 * PATCH /bank-accounts/:id/balance
 */
bankAccountsRouter.patch(
  '/:id/balance',
  checkPermission('finance:bank_accounts:update'),
  zValidator('json', z.object({
    balance: z.number(),
  })),
  async (c) => {
    try {
      const organizationId = c.req.header('x-organization-id');
      if (!organizationId) {
        return c.json(
          { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
          400
        );
      }

      const bankAccountId = c.req.param('id');
      const { balance } = c.req.valid('json');
      const bankAccountService = new BankAccountService(c.env.DB);
      const bankAccount = await bankAccountService.updateBalance(bankAccountId, organizationId, balance);

      return c.json({ data: bankAccount });
    } catch (error) {
      logger.error('Route error', error, { route: 'bank-accounts' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * Delete bank account
 * DELETE /bank-accounts/:id
 */
bankAccountsRouter.delete(
  '/:id',
  checkPermission('finance:bank_accounts:delete'),
  async (c) => {
    try {
      const organizationId = c.req.header('x-organization-id');
      if (!organizationId) {
        return c.json(
          { error: { code: 'MISSING_ORGANIZATION', message: 'Organization ID is required' } },
          400
        );
      }

      const bankAccountId = c.req.param('id');
      const bankAccountService = new BankAccountService(c.env.DB);
      await bankAccountService.delete(bankAccountId, organizationId);

      return c.json({ data: { message: 'Bank account deleted successfully' } });
    } catch (error) {
      logger.error('Route error', error, { route: 'bank-accounts' });
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

export default bankAccountsRouter;
