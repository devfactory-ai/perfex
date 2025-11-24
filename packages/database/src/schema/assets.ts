/**
 * Asset Management Module Schema
 * Fixed assets, depreciation, and maintenance tracking
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';

/**
 * Asset Categories
 * Classification of fixed assets
 */
export const assetCategories = sqliteTable('asset_categories', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  depreciationMethod: text('depreciation_method').default('straight_line'), // straight_line, declining_balance, units_of_production
  usefulLife: integer('useful_life'), // Months
  salvageValuePercent: real('salvage_value_percent').default(0),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Fixed Assets
 * Physical assets owned by the organization
 */
export const fixedAssets = sqliteTable('fixed_assets', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  assetNumber: text('asset_number').notNull(),
  categoryId: text('category_id').references(() => assetCategories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  manufacturer: text('manufacturer'),
  model: text('model'),
  serialNumber: text('serial_number'),
  location: text('location'),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }),
  purchaseCost: real('purchase_cost').notNull(),
  currentValue: real('current_value').notNull(),
  salvageValue: real('salvage_value').default(0),
  usefulLife: integer('useful_life'), // Months
  depreciationMethod: text('depreciation_method').default('straight_line'),
  accumulatedDepreciation: real('accumulated_depreciation').default(0),
  status: text('status').notNull().default('active'), // active, disposed, sold, donated, lost
  disposalDate: integer('disposal_date', { mode: 'timestamp' }),
  disposalValue: real('disposal_value'),
  disposalNotes: text('disposal_notes'),
  warrantyExpiry: integer('warranty_expiry', { mode: 'timestamp' }),
  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Asset Depreciation Records
 * Track depreciation entries over time
 */
export const assetDepreciations = sqliteTable('asset_depreciations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  assetId: text('asset_id').notNull().references(() => fixedAssets.id, { onDelete: 'cascade' }),
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
  depreciationAmount: real('depreciation_amount').notNull(),
  openingValue: real('opening_value').notNull(),
  closingValue: real('closing_value').notNull(),
  journalEntryId: text('journal_entry_id'), // Link to accounting entry
  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Asset Maintenance Records
 * Track maintenance, repairs, and service
 */
export const assetMaintenance = sqliteTable('asset_maintenance', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  assetId: text('asset_id').notNull().references(() => fixedAssets.id, { onDelete: 'cascade' }),
  maintenanceNumber: text('maintenance_number').notNull(),
  type: text('type').notNull().default('preventive'), // preventive, corrective, inspection, calibration
  status: text('status').notNull().default('scheduled'), // scheduled, in_progress, completed, cancelled
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }),
  completedDate: integer('completed_date', { mode: 'timestamp' }),
  performedBy: text('performed_by'),
  vendor: text('vendor'),
  description: text('description'),
  workPerformed: text('work_performed'),
  cost: real('cost').default(0),
  downtime: real('downtime').default(0), // Hours
  nextMaintenanceDate: integer('next_maintenance_date', { mode: 'timestamp' }),
  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Asset Transfers
 * Track movement of assets between locations or departments
 */
export const assetTransfers = sqliteTable('asset_transfers', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  assetId: text('asset_id').notNull().references(() => fixedAssets.id, { onDelete: 'cascade' }),
  transferNumber: text('transfer_number').notNull(),
  fromLocation: text('from_location'),
  toLocation: text('to_location').notNull(),
  transferDate: integer('transfer_date', { mode: 'timestamp' }).notNull(),
  reason: text('reason'),
  approvedBy: text('approved_by').references(() => users.id),
  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
