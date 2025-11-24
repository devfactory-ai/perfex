/**
 * Sales API Routes
 */

import { Hono } from 'hono';
import { authMiddleware, requirePermissions } from '../middleware/auth';
import { salesService } from '../services/sales.service';
import {
  createSalesOrderSchema,
  updateSalesOrderSchema,
} from '@perfex/shared';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', authMiddleware);

// ============================================
// SALES ORDERS
// ============================================

app.get('/orders', requirePermissions('sales:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const companyId = c.req.query('companyId');
  const status = c.req.query('status');
  const search = c.req.query('search');

  const orders = await salesService.listSalesOrders(organizationId, { companyId, status, search });
  return c.json({ success: true, data: orders });
});

app.get('/orders/stats', requirePermissions('sales:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const stats = await salesService.getStats(organizationId);
  return c.json({ success: true, data: stats });
});

app.get('/orders/:id', requirePermissions('sales:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const orderId = c.req.param('id');

  const order = await salesService.getSalesOrderById(organizationId, orderId);
  if (!order) {
    return c.json({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Sales order not found' } }, 404);
  }

  return c.json({ success: true, data: order });
});

app.post('/orders', requirePermissions('sales:create'), async (c) => {
  const organizationId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json();

  const validation = createSalesOrderSchema.safeParse(body);
  if (!validation.success) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.errors } },
      400
    );
  }

  const order = await salesService.createSalesOrder(organizationId, userId, validation.data);
  return c.json({ success: true, data: order }, 201);
});

app.put('/orders/:id', requirePermissions('sales:update'), async (c) => {
  const organizationId = c.get('organizationId');
  const orderId = c.req.param('id');
  const body = await c.req.json();

  const validation = updateSalesOrderSchema.safeParse(body);
  if (!validation.success) {
    return c.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.errors } },
      400
    );
  }

  try {
    const order = await salesService.updateSalesOrder(organizationId, orderId, validation.data);
    return c.json({ success: true, data: order });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sales order not found') {
      return c.json({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Sales order not found' } }, 404);
    }
    throw error;
  }
});

app.delete('/orders/:id', requirePermissions('sales:delete'), async (c) => {
  const organizationId = c.get('organizationId');
  const orderId = c.req.param('id');

  try {
    await salesService.deleteSalesOrder(organizationId, orderId);
    return c.json({ success: true, data: null });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sales order not found') {
      return c.json({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Sales order not found' } }, 404);
    }
    throw error;
  }
});

export default app;
