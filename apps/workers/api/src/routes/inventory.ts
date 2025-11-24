/**
 * Inventory API Routes
 */

import { Hono } from 'hono';
import { authMiddleware, requirePermissions } from '../middleware/auth';
import { inventoryService } from '../services/inventory.service';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  createWarehouseSchema,
  updateWarehouseSchema,
} from '@perfex/shared';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// ============================================
// INVENTORY ITEMS
// ============================================

/**
 * GET /inventory/items
 * List all inventory items with optional filters
 */
app.get('/items', requirePermissions('inventory:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const category = c.req.query('category');
  const active = c.req.query('active');
  const search = c.req.query('search');

  const items = await inventoryService.listItems(organizationId, {
    category,
    active,
    search,
  });

  return c.json({
    success: true,
    data: items,
  });
});

/**
 * GET /inventory/items/stats
 * Get inventory statistics
 */
app.get('/items/stats', requirePermissions('inventory:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const stats = await inventoryService.getStats(organizationId);

  return c.json({
    success: true,
    data: stats,
  });
});

/**
 * GET /inventory/items/:id
 * Get single inventory item by ID
 */
app.get('/items/:id', requirePermissions('inventory:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const itemId = c.req.param('id');

  const item = await inventoryService.getItemById(organizationId, itemId);

  if (!item) {
    return c.json(
      {
        success: false,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Inventory item not found',
        },
      },
      404
    );
  }

  return c.json({
    success: true,
    data: item,
  });
});

/**
 * POST /inventory/items
 * Create new inventory item
 */
app.post('/items', requirePermissions('inventory:create'), async (c) => {
  const organizationId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json();

  // Validate input
  const validation = createInventoryItemSchema.safeParse(body);
  if (!validation.success) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: validation.error.errors,
        },
      },
      400
    );
  }

  const item = await inventoryService.createItem(organizationId, userId, validation.data);

  return c.json(
    {
      success: true,
      data: item,
    },
    201
  );
});

/**
 * PUT /inventory/items/:id
 * Update inventory item
 */
app.put('/items/:id', requirePermissions('inventory:update'), async (c) => {
  const organizationId = c.get('organizationId');
  const itemId = c.req.param('id');
  const body = await c.req.json();

  // Validate input
  const validation = updateInventoryItemSchema.safeParse(body);
  if (!validation.success) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: validation.error.errors,
        },
      },
      400
    );
  }

  try {
    const item = await inventoryService.updateItem(organizationId, itemId, validation.data);

    return c.json({
      success: true,
      data: item,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Inventory item not found') {
      return c.json(
        {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Inventory item not found',
          },
        },
        404
      );
    }
    throw error;
  }
});

/**
 * DELETE /inventory/items/:id
 * Delete inventory item
 */
app.delete('/items/:id', requirePermissions('inventory:delete'), async (c) => {
  const organizationId = c.get('organizationId');
  const itemId = c.req.param('id');

  try {
    await inventoryService.deleteItem(organizationId, itemId);

    return c.json({
      success: true,
      data: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Inventory item not found') {
      return c.json(
        {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Inventory item not found',
          },
        },
        404
      );
    }
    throw error;
  }
});

// ============================================
// WAREHOUSES
// ============================================

/**
 * GET /inventory/warehouses
 * List all warehouses with optional filters
 */
app.get('/warehouses', requirePermissions('inventory:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const active = c.req.query('active');

  const warehouses = await inventoryService.listWarehouses(organizationId, {
    active,
  });

  return c.json({
    success: true,
    data: warehouses,
  });
});

/**
 * GET /inventory/warehouses/:id
 * Get single warehouse by ID
 */
app.get('/warehouses/:id', requirePermissions('inventory:read'), async (c) => {
  const organizationId = c.get('organizationId');
  const warehouseId = c.req.param('id');

  const warehouse = await inventoryService.getWarehouseById(organizationId, warehouseId);

  if (!warehouse) {
    return c.json(
      {
        success: false,
        error: {
          code: 'WAREHOUSE_NOT_FOUND',
          message: 'Warehouse not found',
        },
      },
      404
    );
  }

  return c.json({
    success: true,
    data: warehouse,
  });
});

/**
 * POST /inventory/warehouses
 * Create new warehouse
 */
app.post('/warehouses', requirePermissions('inventory:create'), async (c) => {
  const organizationId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json();

  // Validate input
  const validation = createWarehouseSchema.safeParse(body);
  if (!validation.success) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: validation.error.errors,
        },
      },
      400
    );
  }

  const warehouse = await inventoryService.createWarehouse(organizationId, userId, validation.data);

  return c.json(
    {
      success: true,
      data: warehouse,
    },
    201
  );
});

/**
 * PUT /inventory/warehouses/:id
 * Update warehouse
 */
app.put('/warehouses/:id', requirePermissions('inventory:update'), async (c) => {
  const organizationId = c.get('organizationId');
  const warehouseId = c.req.param('id');
  const body = await c.req.json();

  // Validate input
  const validation = updateWarehouseSchema.safeParse(body);
  if (!validation.success) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: validation.error.errors,
        },
      },
      400
    );
  }

  try {
    const warehouse = await inventoryService.updateWarehouse(organizationId, warehouseId, validation.data);

    return c.json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Warehouse not found') {
      return c.json(
        {
          success: false,
          error: {
            code: 'WAREHOUSE_NOT_FOUND',
            message: 'Warehouse not found',
          },
        },
        404
      );
    }
    throw error;
  }
});

/**
 * DELETE /inventory/warehouses/:id
 * Delete warehouse
 */
app.delete('/warehouses/:id', requirePermissions('inventory:delete'), async (c) => {
  const organizationId = c.get('organizationId');
  const warehouseId = c.req.param('id');

  try {
    await inventoryService.deleteWarehouse(organizationId, warehouseId);

    return c.json({
      success: true,
      data: null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Warehouse not found') {
      return c.json(
        {
          success: false,
          error: {
            code: 'WAREHOUSE_NOT_FOUND',
            message: 'Warehouse not found',
          },
        },
        404
      );
    }
    throw error;
  }
});

export default app;
