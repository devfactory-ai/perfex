/**
 * Manufacturing Module Schema
 * Bill of Materials, Work Orders, Routings, Production
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { organizations } from './users';
import { users } from './users';
import { inventoryItems } from './inventory';

/**
 * Bill of Materials (BOM)
 * Defines the components and materials needed to produce a product
 */
export const billOfMaterials = sqliteTable('bill_of_materials', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  bomNumber: text('bom_number').notNull(),
  productId: text('product_id').notNull().references(() => inventoryItems.id),
  version: text('version').default('1.0'),
  description: text('description'),
  quantity: real('quantity').notNull().default(1), // Quantity produced
  unit: text('unit').default('unit'),
  status: text('status').notNull().default('draft'), // draft, active, obsolete
  effectiveDate: integer('effective_date', { mode: 'timestamp' }),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * BOM Lines (Components)
 * Individual components/materials in a BOM
 */
export const bomLines = sqliteTable('bom_lines', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  bomId: text('bom_id').notNull().references(() => billOfMaterials.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => inventoryItems.id),
  quantity: real('quantity').notNull(),
  unit: text('unit').default('unit'),
  scrapPercent: real('scrap_percent').default(0), // Expected waste percentage
  position: integer('position').default(0), // Order in BOM
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Routings
 * Manufacturing process steps and operations
 */
export const routings = sqliteTable('routings', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  routingNumber: text('routing_number').notNull(),
  productId: text('product_id').notNull().references(() => inventoryItems.id),
  description: text('description'),
  status: text('status').notNull().default('draft'), // draft, active, obsolete
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Routing Operations
 * Individual operations/steps in a routing
 */
export const routingOperations = sqliteTable('routing_operations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  routingId: text('routing_id').notNull().references(() => routings.id, { onDelete: 'cascade' }),
  operationNumber: text('operation_number').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  workCenter: text('work_center'), // Where the operation is performed
  setupTime: real('setup_time').default(0), // Minutes
  cycleTime: real('cycle_time').default(0), // Minutes per unit
  laborCost: real('labor_cost').default(0),
  overheadCost: real('overhead_cost').default(0),
  position: integer('position').default(0), // Sequence order
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Work Orders
 * Production orders for manufacturing
 */
export const workOrders = sqliteTable('work_orders', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workOrderNumber: text('work_order_number').notNull(),
  productId: text('product_id').notNull().references(() => inventoryItems.id),
  bomId: text('bom_id').references(() => billOfMaterials.id, { onDelete: 'set null' }),
  routingId: text('routing_id').references(() => routings.id, { onDelete: 'set null' }),
  salesOrderId: text('sales_order_id'), // Link to sales order if MTO
  quantityPlanned: real('quantity_planned').notNull(),
  quantityProduced: real('quantity_produced').default(0),
  unit: text('unit').default('unit'),
  status: text('status').notNull().default('draft'), // draft, released, in_progress, completed, cancelled
  priority: text('priority').default('normal'), // low, normal, high, urgent
  scheduledStartDate: integer('scheduled_start_date', { mode: 'timestamp' }),
  scheduledEndDate: integer('scheduled_end_date', { mode: 'timestamp' }),
  actualStartDate: integer('actual_start_date', { mode: 'timestamp' }),
  actualEndDate: integer('actual_end_date', { mode: 'timestamp' }),
  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Work Order Operations
 * Tracking of individual operations for a work order
 */
export const workOrderOperations = sqliteTable('work_order_operations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workOrderId: text('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
  operationId: text('operation_id').references(() => routingOperations.id, { onDelete: 'set null' }),
  operationNumber: text('operation_number').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('pending'), // pending, in_progress, completed, skipped
  scheduledStartDate: integer('scheduled_start_date', { mode: 'timestamp' }),
  actualStartDate: integer('actual_start_date', { mode: 'timestamp' }),
  actualEndDate: integer('actual_end_date', { mode: 'timestamp' }),
  actualTime: real('actual_time').default(0), // Minutes
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Material Consumption
 * Track materials consumed in production
 */
export const materialConsumption = sqliteTable('material_consumption', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workOrderId: text('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => inventoryItems.id),
  quantityPlanned: real('quantity_planned').notNull(),
  quantityConsumed: real('quantity_consumed').default(0),
  unit: text('unit').default('unit'),
  consumedAt: integer('consumed_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
