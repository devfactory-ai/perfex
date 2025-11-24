/**
 * Inventory Module Schema
 * Database tables for inventory management, warehouses, and stock tracking
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';

/**
 * Inventory Items table
 * Products/items tracked in inventory
 */
export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Item details
  sku: text('sku').notNull(), // Stock Keeping Unit
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),

  // Pricing
  costPrice: real('cost_price'), // Purchase/cost price
  sellingPrice: real('selling_price'), // Selling price
  currency: text('currency').default('EUR'),

  // Units
  unit: text('unit').default('unit'), // unit, piece, kg, liter, etc.

  // Stock settings
  trackInventory: integer('track_inventory', { mode: 'boolean' }).default(true),
  minStockLevel: real('min_stock_level').default(0), // Reorder point
  maxStockLevel: real('max_stock_level'),
  reorderQuantity: real('reorder_quantity'),

  // Status
  active: integer('active', { mode: 'boolean' }).default(true),

  // Image
  imageUrl: text('image_url'),

  // Additional info
  barcode: text('barcode'),
  tags: text('tags'), // JSON array

  // Audit
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Warehouses table
 * Storage locations for inventory
 */
export const warehouses = sqliteTable('warehouses', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Warehouse details
  name: text('name').notNull(),
  code: text('code').notNull(), // Short code (e.g., WH01, NYC, LON)
  description: text('description'),

  // Location
  address: text('address'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),

  // Contact
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),

  // Settings
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  active: integer('active', { mode: 'boolean' }).default(true),

  // Audit
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Stock Levels table
 * Current stock quantity by item and warehouse
 */
export const stockLevels = sqliteTable('stock_levels', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  warehouseId: text('warehouse_id').notNull().references(() => warehouses.id, { onDelete: 'cascade' }),

  // Quantities
  quantity: real('quantity').notNull().default(0),
  reservedQuantity: real('reserved_quantity').default(0), // Reserved for orders
  availableQuantity: real('available_quantity').default(0), // quantity - reservedQuantity

  // Audit
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Stock Movements table
 * All stock transactions and movements
 */
export const stockMovements = sqliteTable('stock_movements', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  warehouseId: text('warehouse_id').notNull().references(() => warehouses.id, { onDelete: 'cascade' }),

  // Movement details
  type: text('type').notNull(), // in, out, transfer, adjustment
  quantity: real('quantity').notNull(),

  // For transfers
  fromWarehouseId: text('from_warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
  toWarehouseId: text('to_warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),

  // Reference
  referenceType: text('reference_type'), // invoice, purchase_order, project, etc.
  referenceId: text('reference_id'),
  referenceNumber: text('reference_number'),

  // Additional info
  reason: text('reason'),
  notes: text('notes'),
  unitCost: real('unit_cost'), // Cost per unit at time of movement

  // Audit
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Stock Adjustments table
 * Manual stock corrections and adjustments
 */
export const stockAdjustments = sqliteTable('stock_adjustments', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  warehouseId: text('warehouse_id').notNull().references(() => warehouses.id, { onDelete: 'cascade' }),

  // Adjustment details
  adjustmentNumber: text('adjustment_number').notNull(),
  adjustmentDate: integer('adjustment_date', { mode: 'timestamp' }).notNull(),
  reason: text('reason').notNull(), // damage, loss, found, count_correction, etc.
  status: text('status').notNull().default('draft'), // draft, approved, cancelled

  // Financial impact
  totalValue: real('total_value').default(0),

  // Approval
  approvedBy: text('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),

  // Notes
  notes: text('notes'),

  // Audit
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Stock Adjustment Lines table
 * Line items for each adjustment
 */
export const stockAdjustmentLines = sqliteTable('stock_adjustment_lines', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  adjustmentId: text('adjustment_id').notNull().references(() => stockAdjustments.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),

  // Adjustment quantities
  oldQuantity: real('old_quantity').notNull(),
  newQuantity: real('new_quantity').notNull(),
  quantityDifference: real('quantity_difference').notNull(), // newQuantity - oldQuantity

  // Cost
  unitCost: real('unit_cost'),
  lineValue: real('line_value'), // quantityDifference * unitCost

  // Notes
  notes: text('notes'),

  // Audit
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
