/**
 * Asset Management validators (Zod schemas)
 */

import { z } from 'zod';

// Asset Category validators
export const createAssetCategorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  depreciationMethod: z.enum(['straight_line', 'declining_balance', 'units_of_production']).default('straight_line'),
  usefulLife: z.number().int().min(1).optional().nullable(), // Months
  salvageValuePercent: z.number().min(0).max(100).default(0),
});

export type CreateAssetCategoryInput = z.infer<typeof createAssetCategorySchema>;

export const updateAssetCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  depreciationMethod: z.enum(['straight_line', 'declining_balance', 'units_of_production']).optional(),
  usefulLife: z.number().int().min(1).optional().nullable(),
  salvageValuePercent: z.number().min(0).max(100).optional(),
});

export type UpdateAssetCategoryInput = z.infer<typeof updateAssetCategorySchema>;

// Fixed Asset validators
export const createFixedAssetSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  manufacturer: z.string().max(200).optional().nullable(),
  model: z.string().max(200).optional().nullable(),
  serialNumber: z.string().max(200).optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  purchaseDate: z.string().datetime().or(z.date()).optional().nullable(),
  purchaseCost: z.number().min(0),
  salvageValue: z.number().min(0).default(0),
  usefulLife: z.number().int().min(1).optional().nullable(), // Months
  depreciationMethod: z.enum(['straight_line', 'declining_balance', 'units_of_production']).default('straight_line'),
  warrantyExpiry: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateFixedAssetInput = z.infer<typeof createFixedAssetSchema>;

export const updateFixedAssetSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  manufacturer: z.string().max(200).optional().nullable(),
  model: z.string().max(200).optional().nullable(),
  serialNumber: z.string().max(200).optional().nullable(),
  location: z.string().max(300).optional().nullable(),
  status: z.enum(['active', 'disposed', 'sold', 'donated', 'lost']).optional(),
  currentValue: z.number().min(0).optional(),
  salvageValue: z.number().min(0).optional(),
  accumulatedDepreciation: z.number().min(0).optional(),
  disposalDate: z.string().datetime().or(z.date()).optional().nullable(),
  disposalValue: z.number().min(0).optional().nullable(),
  disposalNotes: z.string().max(2000).optional().nullable(),
  warrantyExpiry: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateFixedAssetInput = z.infer<typeof updateFixedAssetSchema>;

// Asset Maintenance validators
export const createMaintenanceSchema = z.object({
  assetId: z.string().uuid(),
  type: z.enum(['preventive', 'corrective', 'inspection', 'calibration']).default('preventive'),
  scheduledDate: z.string().datetime().or(z.date()).optional().nullable(),
  performedBy: z.string().max(200).optional().nullable(),
  vendor: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  workPerformed: z.string().max(2000).optional().nullable(),
  cost: z.number().min(0).default(0),
  downtime: z.number().min(0).default(0), // Hours
  nextMaintenanceDate: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;

export const updateMaintenanceSchema = z.object({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  scheduledDate: z.string().datetime().or(z.date()).optional().nullable(),
  completedDate: z.string().datetime().or(z.date()).optional().nullable(),
  performedBy: z.string().max(200).optional().nullable(),
  vendor: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  workPerformed: z.string().max(2000).optional().nullable(),
  cost: z.number().min(0).optional(),
  downtime: z.number().min(0).optional(),
  nextMaintenanceDate: z.string().datetime().or(z.date()).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
