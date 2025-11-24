/**
 * Sales validators (Zod schemas)
 */

import { z } from 'zod';

export const createSalesOrderSchema = z.object({
  companyId: z.string().uuid(),
  contactId: z.string().uuid().optional().nullable(),
  quoteId: z.string().uuid().optional().nullable(),
  orderDate: z.string().datetime().or(z.date()),
  expectedDeliveryDate: z.string().datetime().or(z.date()).optional().nullable(),
  currency: z.string().length(3).default('EUR'),
  shippingAddress: z.string().max(1000).optional().nullable(),
  billingAddress: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  lines: z.array(z.object({
    itemId: z.string().uuid().optional().nullable(),
    description: z.string().min(1).max(500),
    quantity: z.number().min(0.01),
    unit: z.string().max(50).default('unit'),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100).default(0),
    discountPercent: z.number().min(0).max(100).default(0),
  })).min(1),
});

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;

export const updateSalesOrderSchema = z.object({
  expectedDeliveryDate: z.string().datetime().or(z.date()).optional().nullable(),
  status: z.enum(['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderSchema>;
