/**
 * Inventory validators (Zod schemas)
 */

import { z } from 'zod';

/**
 * Create inventory item schema
 */
export const createInventoryItemSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  sellingPrice: z.number().min(0).optional().nullable(),
  currency: z.string().length(3).default('EUR'),
  unit: z.string().max(50).default('unit'),
  trackInventory: z.boolean().default(true),
  minStockLevel: z.number().min(0).default(0),
  maxStockLevel: z.number().min(0).optional().nullable(),
  reorderQuantity: z.number().min(0).optional().nullable(),
  active: z.boolean().default(true),
  imageUrl: z.string().url().optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

/**
 * Update inventory item schema
 */
export const updateInventoryItemSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  sellingPrice: z.number().min(0).optional().nullable(),
  currency: z.string().length(3).optional(),
  unit: z.string().max(50).optional(),
  trackInventory: z.boolean().optional(),
  minStockLevel: z.number().min(0).optional(),
  maxStockLevel: z.number().min(0).optional().nullable(),
  reorderQuantity: z.number().min(0).optional().nullable(),
  active: z.boolean().optional(),
  imageUrl: z.string().url().optional().nullable(),
  barcode: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;

/**
 * Create warehouse schema
 */
export const createWarehouseSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(50),
  description: z.string().max(1000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  contactPerson: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

/**
 * Update warehouse schema
 */
export const updateWarehouseSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(1000).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  contactPerson: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
});

export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;

/**
 * Create stock movement schema
 */
export const createStockMovementSchema = z.object({
  itemId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  type: z.enum(['in', 'out', 'transfer', 'adjustment']),
  quantity: z.number().min(0),
  fromWarehouseId: z.string().uuid().optional().nullable(),
  toWarehouseId: z.string().uuid().optional().nullable(),
  referenceType: z.string().max(50).optional().nullable(),
  referenceId: z.string().uuid().optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  reason: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  unitCost: z.number().min(0).optional().nullable(),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;

/**
 * Create stock adjustment schema
 */
export const createStockAdjustmentSchema = z.object({
  warehouseId: z.string().uuid(),
  adjustmentDate: z.string().datetime().or(z.date()),
  reason: z.string().min(1).max(200),
  notes: z.string().max(1000).optional().nullable(),
  lines: z.array(z.object({
    itemId: z.string().uuid(),
    newQuantity: z.number().min(0),
    notes: z.string().max(500).optional().nullable(),
  })),
});

export type CreateStockAdjustmentInput = z.infer<typeof createStockAdjustmentSchema>;

/**
 * Update stock adjustment schema
 */
export const updateStockAdjustmentSchema = z.object({
  adjustmentDate: z.string().datetime().or(z.date()).optional(),
  reason: z.string().min(1).max(200).optional(),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(['draft', 'approved', 'cancelled']).optional(),
});

export type UpdateStockAdjustmentInput = z.infer<typeof updateStockAdjustmentSchema>;
