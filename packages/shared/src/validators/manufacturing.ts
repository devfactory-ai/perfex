/**
 * Manufacturing validators (Zod schemas)
 */

import { z } from 'zod';

// Bill of Materials validators
export const createBOMSchema = z.object({
  productId: z.string().uuid(),
  version: z.string().max(50).default('1.0'),
  description: z.string().max(1000).optional().nullable(),
  quantity: z.number().min(0.01).default(1),
  unit: z.string().max(50).default('unit'),
  effectiveDate: z.string().datetime().or(z.date()).optional().nullable(),
  expiryDate: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  lines: z.array(z.object({
    itemId: z.string().uuid(),
    quantity: z.number().min(0.01),
    unit: z.string().max(50).default('unit'),
    scrapPercent: z.number().min(0).max(100).default(0),
    position: z.number().int().default(0),
    notes: z.string().max(500).optional().nullable(),
  })).min(1),
});

export type CreateBOMInput = z.infer<typeof createBOMSchema>;

export const updateBOMSchema = z.object({
  version: z.string().max(50).optional(),
  description: z.string().max(1000).optional().nullable(),
  quantity: z.number().min(0.01).optional(),
  unit: z.string().max(50).optional(),
  status: z.enum(['draft', 'active', 'obsolete']).optional(),
  effectiveDate: z.string().datetime().or(z.date()).optional().nullable(),
  expiryDate: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateBOMInput = z.infer<typeof updateBOMSchema>;

// Routing validators
export const createRoutingSchema = z.object({
  productId: z.string().uuid(),
  description: z.string().max(1000).optional().nullable(),
  operations: z.array(z.object({
    operationNumber: z.string().max(50),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional().nullable(),
    workCenter: z.string().max(100).optional().nullable(),
    setupTime: z.number().min(0).default(0),
    cycleTime: z.number().min(0).default(0),
    laborCost: z.number().min(0).default(0),
    overheadCost: z.number().min(0).default(0),
    position: z.number().int().default(0),
  })).min(1),
});

export type CreateRoutingInput = z.infer<typeof createRoutingSchema>;

export const updateRoutingSchema = z.object({
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(['draft', 'active', 'obsolete']).optional(),
});

export type UpdateRoutingInput = z.infer<typeof updateRoutingSchema>;

// Work Order validators
export const createWorkOrderSchema = z.object({
  productId: z.string().uuid(),
  bomId: z.string().uuid().optional().nullable(),
  routingId: z.string().uuid().optional().nullable(),
  salesOrderId: z.string().uuid().optional().nullable(),
  quantityPlanned: z.number().min(0.01),
  unit: z.string().max(50).default('unit'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledStartDate: z.string().datetime().or(z.date()).optional().nullable(),
  scheduledEndDate: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const updateWorkOrderSchema = z.object({
  status: z.enum(['draft', 'released', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  quantityProduced: z.number().min(0).optional(),
  scheduledStartDate: z.string().datetime().or(z.date()).optional().nullable(),
  scheduledEndDate: z.string().datetime().or(z.date()).optional().nullable(),
  actualStartDate: z.string().datetime().or(z.date()).optional().nullable(),
  actualEndDate: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
