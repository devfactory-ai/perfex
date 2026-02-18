/**
 * Bakery Module Schema
 *
 * Complete database schema for bakery ERP including:
 * - Stock Management (articles, movements, inventory, alerts, supplier orders)
 * - Production (proofing chambers, carts, ovens, quality control, energy consumption)
 * - Maintenance (CMMS - equipment, interventions, preventive plans, spare parts)
 * - Sales (B2B deliveries, on-site sales, team handovers)
 * - Reporting (automated reports, accounting exports)
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';

// =============================================================================
// MODULE 1: STOCK MANAGEMENT
// =============================================================================

/**
 * Articles (Raw Materials)
 * Manages raw materials like flour, yeast, sugar, etc.
 */
export const bakeryArticles = sqliteTable('bakery_articles', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  reference: text('reference').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'farine' | 'semoule' | 'levure' | 'additifs' | 'emballages' | 'autre'
  unitOfMeasure: text('unit_of_measure').notNull(), // 'kg' | 'L' | 'unite'
  averagePurchasePrice: real('average_purchase_price').default(0), // PUMP
  currentStock: real('current_stock').default(0),
  minimumStock: real('minimum_stock').default(0),
  optimalStock: real('optimal_stock').default(0),
  mainSupplierId: text('main_supplier_id'),
  alternativeSupplierIds: text('alternative_supplier_ids'), // JSON array of IDs
  expirationDate: text('expiration_date'), // For perishable products
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Stock Movements
 * Tracks all stock entries, exits, and adjustments
 */
export const bakeryStockMovements = sqliteTable('bakery_stock_movements', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  articleId: text('article_id').notNull().references(() => bakeryArticles.id),
  type: text('type').notNull(), // 'entree' | 'sortie' | 'ajustement' | 'inventaire'
  quantity: real('quantity').notNull(), // Positive for entry, negative for exit
  reason: text('reason').notNull(),
  documentReference: text('document_reference'), // Delivery note, exit voucher, etc.
  lotNumber: text('lot_number'), // For traceability
  purchasePrice: real('purchase_price'), // For entries, to calculate PUMP
  movementDate: integer('movement_date', { mode: 'timestamp' }).notNull(),
  responsibleId: text('responsible_id').references(() => users.id),
  comment: text('comment'),
  isValidated: integer('is_validated', { mode: 'boolean' }).default(false),
  validatedAt: integer('validated_at', { mode: 'timestamp' }),
  validatedById: text('validated_by_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Inventories
 * Periodic inventory sessions (daily, monthly, annual)
 */
export const bakeryInventories = sqliteTable('bakery_inventories', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  inventoryDate: integer('inventory_date', { mode: 'timestamp' }).notNull(),
  type: text('type').notNull(), // 'quotidien' | 'mensuel' | 'annuel'
  status: text('status').notNull().default('en_cours'), // 'en_cours' | 'termine' | 'valide'
  responsibleId: text('responsible_id').references(() => users.id),
  comment: text('comment'),
  validatedAt: integer('validated_at', { mode: 'timestamp' }),
  validatedById: text('validated_by_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Inventory Lines
 * Individual article counts within an inventory
 */
export const bakeryInventoryLines = sqliteTable('bakery_inventory_lines', {
  id: text('id').primaryKey(),
  inventoryId: text('inventory_id').notNull().references(() => bakeryInventories.id),
  articleId: text('article_id').notNull().references(() => bakeryArticles.id),
  theoreticalStock: real('theoretical_stock').notNull(),
  actualStock: real('actual_stock').notNull(),
  variance: real('variance').notNull(), // actual - theoretical
  varianceValue: real('variance_value').notNull(), // variance * average_purchase_price
  justification: text('justification'),
  photoUrl: text('photo_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Stock Alerts
 * Notifications for minimum stock, optimal stock, or expiration
 */
export const bakeryStockAlerts = sqliteTable('bakery_stock_alerts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  articleId: text('article_id').notNull().references(() => bakeryArticles.id),
  alertType: text('alert_type').notNull(), // 'stock_minimum' | 'stock_optimal' | 'peremption_proche'
  currentStock: real('current_stock').notNull(),
  thresholdTriggered: real('threshold_triggered').notNull(),
  alertDate: integer('alert_date', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  isNotified: integer('is_notified', { mode: 'boolean' }).default(false),
  notifiedAt: integer('notified_at', { mode: 'timestamp' }),
  isAcknowledged: integer('is_acknowledged', { mode: 'boolean' }).default(false),
  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
  acknowledgedById: text('acknowledged_by_id').references(() => users.id),
});

/**
 * Supplier Orders
 * Purchase orders to suppliers
 */
export const bakerySupplierOrders = sqliteTable('bakery_supplier_orders', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  supplierId: text('supplier_id').notNull(),
  orderNumber: text('order_number').notNull(),
  orderDate: integer('order_date', { mode: 'timestamp' }).notNull(),
  expectedDeliveryDate: integer('expected_delivery_date', { mode: 'timestamp' }),
  status: text('status').notNull().default('brouillon'), // 'brouillon' | 'envoyee' | 'confirmee' | 'recue' | 'annulee'
  totalAmount: real('total_amount').default(0),
  sentByEmail: integer('sent_by_email', { mode: 'boolean' }).default(false),
  sentByWhatsApp: integer('sent_by_whatsapp', { mode: 'boolean' }).default(false),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  createdById: text('created_by_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Supplier Order Lines
 * Individual items in a supplier order
 */
export const bakerySupplierOrderLines = sqliteTable('bakery_supplier_order_lines', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => bakerySupplierOrders.id),
  articleId: text('article_id').notNull().references(() => bakeryArticles.id),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  lineAmount: real('line_amount').notNull(),
  receivedQuantity: real('received_quantity').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Products (Finished Goods)
 * Bakery products like breads, pastries
 */
export const bakeryProducts = sqliteTable('bakery_products', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  reference: text('reference').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'pain' | 'patisserie' | 'viennoiserie' | 'autre'
  unitPrice: real('unit_price').notNull(),
  costPrice: real('cost_price').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Product Recipes
 * Recipe definitions for products (bill of materials)
 */
export const bakeryProductRecipes = sqliteTable('bakery_product_recipes', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  productId: text('product_id').notNull().references(() => bakeryProducts.id),
  name: text('name').notNull(),
  yield: real('yield').notNull(), // Number of units produced
  yieldUnit: text('yield_unit').notNull(), // Ex: "baguettes", "kg"
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Recipe Compositions
 * Ingredients/articles needed for each recipe
 */
export const bakeryRecipeCompositions = sqliteTable('bakery_recipe_compositions', {
  id: text('id').primaryKey(),
  recipeId: text('recipe_id').notNull().references(() => bakeryProductRecipes.id),
  articleId: text('article_id').notNull().references(() => bakeryArticles.id),
  quantityNeeded: real('quantity_needed').notNull(), // Per unit of yield
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// =============================================================================
// MODULE 2: PRODUCTION
// =============================================================================

/**
 * Proofing Chambers
 * Rooms where dough rises before baking
 */
export const bakeryProofingChambers = sqliteTable('bakery_proofing_chambers', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  cartCapacity: integer('cart_capacity').notNull(),
  idealTemperature: real('ideal_temperature').notNull(),
  idealHumidity: real('ideal_humidity').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Proofing Carts
 * Carts of dough in proofing chambers
 */
export const bakeryProofingCarts = sqliteTable('bakery_proofing_carts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  cartNumber: text('cart_number').notNull(),
  chamberId: text('chamber_id').references(() => bakeryProofingChambers.id),
  entryTime: integer('entry_time', { mode: 'timestamp' }).notNull(),
  exitTime: integer('exit_time', { mode: 'timestamp' }),
  status: text('status').notNull().default('en_pousse'), // 'en_pousse' | 'pret_four' | 'au_four' | 'termine'
  responsibleId: text('responsible_id').references(() => users.id),
  temperature: real('temperature'),
  humidity: real('humidity'),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Cart Lines
 * Products/quantities in each cart
 */
export const bakeryCartLines = sqliteTable('bakery_cart_lines', {
  id: text('id').primaryKey(),
  cartId: text('cart_id').notNull().references(() => bakeryProofingCarts.id),
  productId: text('product_id').notNull().references(() => bakeryProducts.id),
  quantity: integer('quantity').notNull(),
  doughWeight: real('dough_weight'), // In kg
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Ovens
 * Bakery ovens for baking
 */
export const bakeryOvens = sqliteTable('bakery_ovens', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'rotatif' | 'sole' | 'tunnel' | 'autre'
  cartCapacity: integer('cart_capacity').notNull(),
  maxTemperature: real('max_temperature').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Oven Passages
 * Record of baking sessions
 */
export const bakeryOvenPassages = sqliteTable('bakery_oven_passages', {
  id: text('id').primaryKey(),
  cartId: text('cart_id').notNull().references(() => bakeryProofingCarts.id),
  ovenId: text('oven_id').notNull().references(() => bakeryOvens.id),
  entryTime: integer('entry_time', { mode: 'timestamp' }).notNull(),
  exitTime: integer('exit_time', { mode: 'timestamp' }),
  temperature: real('temperature').notNull(),
  expectedDuration: integer('expected_duration').notNull(), // In minutes
  actualDuration: integer('actual_duration'),
  status: text('status').notNull().default('en_cuisson'), // 'en_cuisson' | 'termine' | 'incident'
  responsibleId: text('responsible_id').references(() => users.id),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Quality Controls
 * Post-baking quality checks
 */
export const bakeryQualityControls = sqliteTable('bakery_quality_controls', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  ovenPassageId: text('oven_passage_id').notNull().references(() => bakeryOvenPassages.id),
  controlDate: integer('control_date', { mode: 'timestamp' }).notNull(),
  controllerId: text('controller_id').references(() => users.id),
  isConforming: integer('is_conforming', { mode: 'boolean' }).notNull(),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Production Defects
 * Records of defective products
 */
export const bakeryProductionDefects = sqliteTable('bakery_production_defects', {
  id: text('id').primaryKey(),
  qualityControlId: text('quality_control_id').notNull().references(() => bakeryQualityControls.id),
  productId: text('product_id').notNull().references(() => bakeryProducts.id),
  defectType: text('defect_type').notNull(), // 'brule' | 'sous_cuit' | 'deforme' | 'casse' | 'autre'
  defectiveQuantity: integer('defective_quantity').notNull(),
  photoUrl: text('photo_url'),
  productionResponsibleId: text('production_responsible_id').references(() => users.id),
  probableCause: text('probable_cause'),
  correctiveAction: text('corrective_action'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Production Comparisons
 * Theoretical vs actual production analysis
 */
export const bakeryProductionComparisons = sqliteTable('bakery_production_comparisons', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  comparisonDate: integer('comparison_date', { mode: 'timestamp' }).notNull(),
  productId: text('product_id').notNull().references(() => bakeryProducts.id),
  theoreticalQuantity: real('theoretical_quantity').notNull(), // Calculated from stock exits
  proofingQuantity: real('proofing_quantity').notNull(), // Carts
  ovenOutputQuantity: real('oven_output_quantity').notNull(), // After baking
  conformingQuantity: real('conforming_quantity').notNull(), // After quality control
  defectiveQuantity: real('defective_quantity').notNull(),
  theoreticalVariance: real('theoretical_variance').notNull(),
  conformityRate: real('conformity_rate').notNull(), // conforming / oven_output
  lossRate: real('loss_rate').notNull(), // variance / theoretical
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Meter Readings
 * Energy consumption meter readings
 */
export const bakeryMeterReadings = sqliteTable('bakery_meter_readings', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  readingDate: integer('reading_date', { mode: 'timestamp' }).notNull(),
  meterType: text('meter_type').notNull(), // 'gaz' | 'electricite' | 'eau'
  meterValue: real('meter_value').notNull(),
  responsibleId: text('responsible_id').references(() => users.id),
  meterPhotoUrl: text('meter_photo_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Daily Consumption
 * Calculated daily energy consumption
 */
export const bakeryDailyConsumptions = sqliteTable('bakery_daily_consumptions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  consumptionDate: integer('consumption_date', { mode: 'timestamp' }).notNull(),
  energyType: text('energy_type').notNull(), // 'gaz' | 'electricite' | 'eau'
  consumption: real('consumption').notNull(),
  unitCost: real('unit_cost').notNull(),
  totalCost: real('total_cost').notNull(),
  dailyProductionQuantity: real('daily_production_quantity').notNull(),
  consumptionRatio: real('consumption_ratio').notNull(), // consumption / production
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// =============================================================================
// MODULE 3: MAINTENANCE (CMMS)
// =============================================================================

/**
 * Equipment
 * Bakery equipment inventory
 */
export const bakeryEquipment = sqliteTable('bakery_equipment', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'four' | 'petrin' | 'cylindre' | 'laminoir' | 'chambre_pousse' | 'diviseur' | 'faconneur' | 'congelateur' | 'autre'
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  serialNumber: text('serial_number').notNull(),
  purchaseDate: integer('purchase_date', { mode: 'timestamp' }).notNull(),
  commissioningDate: integer('commissioning_date', { mode: 'timestamp' }).notNull(),
  supplierId: text('supplier_id'),
  purchaseValue: real('purchase_value').notNull(),
  warrantyMonths: integer('warranty_months').notNull(),
  warrantyEndDate: integer('warranty_end_date', { mode: 'timestamp' }).notNull(),
  location: text('location').notNull(),
  photoUrl: text('photo_url'),
  manualUrl: text('manual_url'),
  qrCode: text('qr_code'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Maintenance Interventions
 * Records of maintenance work
 */
export const bakeryInterventions = sqliteTable('bakery_interventions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  equipmentId: text('equipment_id').notNull().references(() => bakeryEquipment.id),
  type: text('type').notNull(), // 'preventive' | 'corrective' | 'revision' | 'amelioration'
  interventionDate: integer('intervention_date', { mode: 'timestamp' }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  problemNature: text('problem_nature'),
  actionsPerformed: text('actions_performed').notNull(),
  internalTechnicianId: text('internal_technician_id').references(() => users.id),
  externalTechnician: text('external_technician'),
  externalCompany: text('external_company'),
  laborCost: real('labor_cost').default(0),
  partsCost: real('parts_cost').default(0),
  totalCost: real('total_cost').default(0),
  status: text('status').notNull().default('planifiee'), // 'planifiee' | 'en_cours' | 'terminee' | 'annulee'
  causedProductionStop: integer('caused_production_stop', { mode: 'boolean' }).default(false),
  stopDurationMinutes: integer('stop_duration_minutes'),
  comment: text('comment'),
  documentUrls: text('document_urls'), // JSON array of URLs
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Preventive Maintenance Plans
 * Scheduled maintenance programs
 */
export const bakeryMaintenancePlans = sqliteTable('bakery_maintenance_plans', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  equipmentId: text('equipment_id').notNull().references(() => bakeryEquipment.id),
  periodicityType: text('periodicity_type').notNull(), // 'jours' | 'semaines' | 'mois' | 'heures_fonctionnement'
  interval: integer('interval').notNull(), // Ex: every 3 months
  nextScheduledDate: integer('next_scheduled_date', { mode: 'timestamp' }),
  nextScheduledHours: integer('next_scheduled_hours'),
  checklist: text('checklist').notNull(), // JSON of actions to perform
  estimatedDurationMinutes: integer('estimated_duration_minutes').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Maintenance Alerts
 * Notifications for upcoming maintenance
 */
export const bakeryMaintenanceAlerts = sqliteTable('bakery_maintenance_alerts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  planId: text('plan_id').notNull().references(() => bakeryMaintenancePlans.id),
  equipmentId: text('equipment_id').notNull().references(() => bakeryEquipment.id),
  alertDate: integer('alert_date', { mode: 'timestamp' }).notNull(),
  alertType: text('alert_type').notNull(), // 'j_moins_7' | 'j_moins_3' | 'j_moins_1' | 'depassement'
  isNotified: integer('is_notified', { mode: 'boolean' }).default(false),
  notifiedAt: integer('notified_at', { mode: 'timestamp' }),
  isAcknowledged: integer('is_acknowledged', { mode: 'boolean' }).default(false),
  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
  acknowledgedById: text('acknowledged_by_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Spare Parts
 * Inventory of spare parts for equipment
 */
export const bakerySpareParts = sqliteTable('bakery_spare_parts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  reference: text('reference').notNull(),
  designation: text('designation').notNull(),
  compatibleEquipmentIds: text('compatible_equipment_ids'), // JSON array of IDs
  currentStock: real('current_stock').default(0),
  minimumStock: real('minimum_stock').default(0),
  unitPrice: real('unit_price').notNull(),
  supplierId: text('supplier_id'),
  deliveryLeadDays: integer('delivery_lead_days').default(0),
  photoUrl: text('photo_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Spare Part Movements
 * Stock movements for spare parts
 */
export const bakerySparePartMovements = sqliteTable('bakery_spare_part_movements', {
  id: text('id').primaryKey(),
  sparePartId: text('spare_part_id').notNull().references(() => bakerySpareParts.id),
  type: text('type').notNull(), // 'entree' | 'sortie_intervention' | 'ajustement'
  quantity: real('quantity').notNull(),
  interventionId: text('intervention_id').references(() => bakeryInterventions.id),
  movementDate: integer('movement_date', { mode: 'timestamp' }).notNull(),
  responsibleId: text('responsible_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Intervention Parts Used
 * Parts used in maintenance interventions
 */
export const bakeryInterventionParts = sqliteTable('bakery_intervention_parts', {
  id: text('id').primaryKey(),
  interventionId: text('intervention_id').notNull().references(() => bakeryInterventions.id),
  sparePartId: text('spare_part_id').notNull().references(() => bakerySpareParts.id),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Maintenance Indicators
 * Monthly KPIs per equipment (MTBF, MTTR, availability)
 */
export const bakeryMaintenanceIndicators = sqliteTable('bakery_maintenance_indicators', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  equipmentId: text('equipment_id').notNull().references(() => bakeryEquipment.id),
  period: integer('period', { mode: 'timestamp' }).notNull(), // Month
  mtbf: real('mtbf').notNull(), // Mean Time Between Failures (hours)
  mttr: real('mttr').notNull(), // Mean Time To Repair (minutes)
  availability: real('availability').notNull(), // % available time
  totalMaintenanceCost: real('total_maintenance_cost').notNull(),
  preventiveInterventions: integer('preventive_interventions').notNull(),
  correctiveInterventions: integer('corrective_interventions').notNull(),
  productionStopMinutes: integer('production_stop_minutes').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// =============================================================================
// MODULE 4: SALES
// =============================================================================

/**
 * B2B Clients
 * Professional customers for deliveries
 */
export const bakeryB2BClients = sqliteTable('bakery_b2b_clients', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  perfexClientId: text('perfex_client_id'), // Link to Perfex CRM clients
  commercialName: text('commercial_name').notNull(),
  type: text('type').notNull(), // 'restaurant' | 'hotel' | 'collectivite' | 'grossiste' | 'autre'
  mainContact: text('main_contact').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  deliveryAddress: text('delivery_address').notNull(),
  paymentTerms: text('payment_terms'), // Ex: "30 jours fin de mois"
  hasSpecificPricing: integer('has_specific_pricing', { mode: 'boolean' }).default(false),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Client Specific Pricing
 * Custom prices for B2B clients
 */
export const bakeryClientPricing = sqliteTable('bakery_client_pricing', {
  id: text('id').primaryKey(),
  clientId: text('client_id').notNull().references(() => bakeryB2BClients.id),
  productId: text('product_id').notNull().references(() => bakeryProducts.id),
  specificPrice: real('specific_price').notNull(),
  validFrom: integer('valid_from', { mode: 'timestamp' }),
  validTo: integer('valid_to', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Delivery Orders
 * B2B customer orders for delivery
 */
export const bakeryDeliveryOrders = sqliteTable('bakery_delivery_orders', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  clientId: text('client_id').notNull().references(() => bakeryB2BClients.id),
  orderNumber: text('order_number').notNull(),
  orderDate: integer('order_date', { mode: 'timestamp' }).notNull(),
  expectedDeliveryDate: integer('expected_delivery_date', { mode: 'timestamp' }).notNull(),
  expectedDeliveryTime: text('expected_delivery_time'),
  status: text('status').notNull().default('brouillon'), // 'brouillon' | 'confirmee' | 'preparee' | 'en_livraison' | 'livree' | 'facturee'
  totalAmountHT: real('total_amount_ht').default(0),
  vatAmount: real('vat_amount').default(0),
  totalAmountTTC: real('total_amount_ttc').default(0),
  deliveryPersonId: text('delivery_person_id').references(() => users.id),
  comment: text('comment'),
  createdById: text('created_by_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Delivery Order Lines
 * Products in delivery orders
 */
export const bakeryDeliveryOrderLines = sqliteTable('bakery_delivery_order_lines', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => bakeryDeliveryOrders.id),
  productId: text('product_id').notNull().references(() => bakeryProducts.id),
  orderedQuantity: integer('ordered_quantity').notNull(),
  deliveredQuantity: integer('delivered_quantity'),
  unitPriceHT: real('unit_price_ht').notNull(),
  lineAmountHT: real('line_amount_ht').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Delivery Notes
 * Proof of delivery with signature
 */
export const bakeryDeliveryNotes = sqliteTable('bakery_delivery_notes', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => bakeryDeliveryOrders.id),
  noteNumber: text('note_number').notNull(),
  issueDate: integer('issue_date', { mode: 'timestamp' }).notNull(),
  departureTime: integer('departure_time', { mode: 'timestamp' }),
  arrivalTime: integer('arrival_time', { mode: 'timestamp' }),
  deliveryPersonId: text('delivery_person_id').notNull().references(() => users.id),
  clientSignatureData: text('client_signature_data'), // Base64 image
  signatoryName: text('signatory_name'),
  signatureDate: integer('signature_date', { mode: 'timestamp' }),
  signatureLatitude: real('signature_latitude'),
  signatureLongitude: real('signature_longitude'),
  deliveryPhotoUrl: text('delivery_photo_url'),
  clientComment: text('client_comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Points of Sale
 * On-site sales locations
 */
export const bakeryPointsOfSale = sqliteTable('bakery_points_of_sale', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  location: text('location').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Sales Sessions
 * Daily/shift sales periods
 */
export const bakerySalesSessions = sqliteTable('bakery_sales_sessions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  pointOfSaleId: text('point_of_sale_id').notNull().references(() => bakeryPointsOfSale.id),
  sessionDate: integer('session_date', { mode: 'timestamp' }).notNull(),
  period: text('period').notNull(), // 'matin' | 'apres_midi'
  responsibleId: text('responsible_id').notNull().references(() => users.id),
  openingTime: integer('opening_time', { mode: 'timestamp' }).notNull(),
  closingTime: integer('closing_time', { mode: 'timestamp' }),
  status: text('status').notNull().default('ouverte'), // 'ouverte' | 'fermee' | 'validee'
  calculatedRevenue: real('calculated_revenue').default(0),
  declaredRevenue: real('declared_revenue'),
  revenueVariance: real('revenue_variance'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Point of Sale Stock
 * Stock levels per product per session
 */
export const bakeryPOSStock = sqliteTable('bakery_pos_stock', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => bakerySalesSessions.id),
  productId: text('product_id').notNull().references(() => bakeryProducts.id),
  productType: text('product_type').notNull(), // 'pain' | 'patisserie'
  openingStock: real('opening_stock').notNull(), // For pastry = previous day's closing stock
  dailyEntries: real('daily_entries').default(0), // Day's production
  deliveries: real('deliveries').default(0), // Quantities delivered (deducted)
  defective: real('defective').default(0),
  closingStock: real('closing_stock').default(0), // Actual count
  calculatedSold: real('calculated_sold').default(0),
  unitPrice: real('unit_price').notNull(),
  productRevenue: real('product_revenue').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Team Handovers
 * Mid-day shift changes
 */
export const bakeryTeamHandovers = sqliteTable('bakery_team_handovers', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  morningSessionId: text('morning_session_id').notNull().references(() => bakerySalesSessions.id),
  afternoonSessionId: text('afternoon_session_id').notNull().references(() => bakerySalesSessions.id),
  handoverDate: integer('handover_date', { mode: 'timestamp' }).notNull(),
  handoverTime: integer('handover_time', { mode: 'timestamp' }).notNull(),
  morningResponsibleId: text('morning_responsible_id').notNull().references(() => users.id),
  afternoonResponsibleId: text('afternoon_responsible_id').notNull().references(() => users.id),
  jointValidation: integer('joint_validation', { mode: 'boolean' }).default(false),
  morningSignature: text('morning_signature'),
  afternoonSignature: text('afternoon_signature'),
  calculatedMorningRevenue: real('calculated_morning_revenue').notNull(),
  declaredMorningRevenue: real('declared_morning_revenue'),
  variance: real('variance'),
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// =============================================================================
// MODULE 5: REPORTING & ANALYTICS
// =============================================================================

/**
 * Report Configurations
 * Setup for automated reports
 */
export const bakeryReportConfigs = sqliteTable('bakery_report_configs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  reportName: text('report_name').notNull(),
  type: text('type').notNull(), // 'quotidien' | 'hebdomadaire' | 'mensuel'
  templateId: text('template_id'),
  emailRecipients: text('email_recipients'), // JSON array of emails
  whatsappRecipients: text('whatsapp_recipients'), // JSON array of phone numbers
  sendTime: text('send_time').notNull(), // Ex: "18:00"
  sendDay: integer('send_day'), // 1-7 for weekly, 1-31 for monthly
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastExecutedAt: integer('last_executed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Generated Reports
 * Archive of generated reports
 */
export const bakeryGeneratedReports = sqliteTable('bakery_generated_reports', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  configId: text('config_id').references(() => bakeryReportConfigs.id),
  generationDate: integer('generation_date', { mode: 'timestamp' }).notNull(),
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
  pdfUrl: text('pdf_url'),
  isSent: integer('is_sent', { mode: 'boolean' }).default(false),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Accounting Exports
 * Exports for accounting software
 */
export const bakeryAccountingExports = sqliteTable('bakery_accounting_exports', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
  exportType: text('export_type').notNull(), // 'ventes' | 'achats' | 'stocks' | 'complet'
  format: text('format').notNull(), // 'csv' | 'excel' | 'sage' | 'ciel'
  fileUrl: text('file_url'),
  generatedById: text('generated_by_id').references(() => users.id),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Daily Sales Summary
 * Aggregated daily sales data (materialized view concept)
 */
export const bakeryDailySalesSummary = sqliteTable('bakery_daily_sales_summary', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  summaryDate: integer('summary_date', { mode: 'timestamp' }).notNull(),
  deliveryRevenueHT: real('delivery_revenue_ht').default(0),
  deliveryRevenueTTC: real('delivery_revenue_ttc').default(0),
  onSiteMorningRevenue: real('on_site_morning_revenue').default(0),
  onSiteAfternoonRevenue: real('on_site_afternoon_revenue').default(0),
  onSiteTotalRevenue: real('on_site_total_revenue').default(0),
  totalDayRevenue: real('total_day_revenue').default(0),
  deliveryCount: integer('delivery_count').default(0),
  estimatedOnSiteCustomers: integer('estimated_on_site_customers').default(0),
  averageBasket: real('average_basket').default(0),
  topProductsJson: text('top_products_json'), // JSON of top 5 products
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

/**
 * Audit Logs (Bakery specific)
 * Tracks all actions for audit trail
 */
export const bakeryAuditLogs = sqliteTable('bakery_audit_logs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(), // Ex: "created_article", "deleted_commande"
  tableName: text('table_name').notNull(),
  recordId: text('record_id').notNull(),
  oldValues: text('old_values'), // JSON
  newValues: text('new_values'), // JSON
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  actionDate: integer('action_date', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type BakeryArticle = typeof bakeryArticles.$inferSelect;
export type NewBakeryArticle = typeof bakeryArticles.$inferInsert;

export type BakeryStockMovement = typeof bakeryStockMovements.$inferSelect;
export type NewBakeryStockMovement = typeof bakeryStockMovements.$inferInsert;

export type BakeryInventory = typeof bakeryInventories.$inferSelect;
export type NewBakeryInventory = typeof bakeryInventories.$inferInsert;

export type BakeryInventoryLine = typeof bakeryInventoryLines.$inferSelect;
export type NewBakeryInventoryLine = typeof bakeryInventoryLines.$inferInsert;

export type BakeryStockAlert = typeof bakeryStockAlerts.$inferSelect;
export type NewBakeryStockAlert = typeof bakeryStockAlerts.$inferInsert;

export type BakerySupplierOrder = typeof bakerySupplierOrders.$inferSelect;
export type NewBakerySupplierOrder = typeof bakerySupplierOrders.$inferInsert;

export type BakerySupplierOrderLine = typeof bakerySupplierOrderLines.$inferSelect;
export type NewBakerySupplierOrderLine = typeof bakerySupplierOrderLines.$inferInsert;

export type BakeryProduct = typeof bakeryProducts.$inferSelect;
export type NewBakeryProduct = typeof bakeryProducts.$inferInsert;

export type BakeryProductRecipe = typeof bakeryProductRecipes.$inferSelect;
export type NewBakeryProductRecipe = typeof bakeryProductRecipes.$inferInsert;

export type BakeryRecipeComposition = typeof bakeryRecipeCompositions.$inferSelect;
export type NewBakeryRecipeComposition = typeof bakeryRecipeCompositions.$inferInsert;

export type BakeryProofingChamber = typeof bakeryProofingChambers.$inferSelect;
export type NewBakeryProofingChamber = typeof bakeryProofingChambers.$inferInsert;

export type BakeryProofingCart = typeof bakeryProofingCarts.$inferSelect;
export type NewBakeryProofingCart = typeof bakeryProofingCarts.$inferInsert;

export type BakeryCartLine = typeof bakeryCartLines.$inferSelect;
export type NewBakeryCartLine = typeof bakeryCartLines.$inferInsert;

export type BakeryOven = typeof bakeryOvens.$inferSelect;
export type NewBakeryOven = typeof bakeryOvens.$inferInsert;

export type BakeryOvenPassage = typeof bakeryOvenPassages.$inferSelect;
export type NewBakeryOvenPassage = typeof bakeryOvenPassages.$inferInsert;

export type BakeryQualityControl = typeof bakeryQualityControls.$inferSelect;
export type NewBakeryQualityControl = typeof bakeryQualityControls.$inferInsert;

export type BakeryProductionDefect = typeof bakeryProductionDefects.$inferSelect;
export type NewBakeryProductionDefect = typeof bakeryProductionDefects.$inferInsert;

export type BakeryProductionComparison = typeof bakeryProductionComparisons.$inferSelect;
export type NewBakeryProductionComparison = typeof bakeryProductionComparisons.$inferInsert;

export type BakeryMeterReading = typeof bakeryMeterReadings.$inferSelect;
export type NewBakeryMeterReading = typeof bakeryMeterReadings.$inferInsert;

export type BakeryDailyConsumption = typeof bakeryDailyConsumptions.$inferSelect;
export type NewBakeryDailyConsumption = typeof bakeryDailyConsumptions.$inferInsert;

export type BakeryEquipment = typeof bakeryEquipment.$inferSelect;
export type NewBakeryEquipment = typeof bakeryEquipment.$inferInsert;

export type BakeryIntervention = typeof bakeryInterventions.$inferSelect;
export type NewBakeryIntervention = typeof bakeryInterventions.$inferInsert;

export type BakeryMaintenancePlan = typeof bakeryMaintenancePlans.$inferSelect;
export type NewBakeryMaintenancePlan = typeof bakeryMaintenancePlans.$inferInsert;

export type BakeryMaintenanceAlert = typeof bakeryMaintenanceAlerts.$inferSelect;
export type NewBakeryMaintenanceAlert = typeof bakeryMaintenanceAlerts.$inferInsert;

export type BakerySparePart = typeof bakerySpareParts.$inferSelect;
export type NewBakerySparePart = typeof bakerySpareParts.$inferInsert;

export type BakerySparePartMovement = typeof bakerySparePartMovements.$inferSelect;
export type NewBakerySparePartMovement = typeof bakerySparePartMovements.$inferInsert;

export type BakeryInterventionPart = typeof bakeryInterventionParts.$inferSelect;
export type NewBakeryInterventionPart = typeof bakeryInterventionParts.$inferInsert;

export type BakeryMaintenanceIndicator = typeof bakeryMaintenanceIndicators.$inferSelect;
export type NewBakeryMaintenanceIndicator = typeof bakeryMaintenanceIndicators.$inferInsert;

export type BakeryB2BClient = typeof bakeryB2BClients.$inferSelect;
export type NewBakeryB2BClient = typeof bakeryB2BClients.$inferInsert;

export type BakeryClientPricing = typeof bakeryClientPricing.$inferSelect;
export type NewBakeryClientPricing = typeof bakeryClientPricing.$inferInsert;

export type BakeryDeliveryOrder = typeof bakeryDeliveryOrders.$inferSelect;
export type NewBakeryDeliveryOrder = typeof bakeryDeliveryOrders.$inferInsert;

export type BakeryDeliveryOrderLine = typeof bakeryDeliveryOrderLines.$inferSelect;
export type NewBakeryDeliveryOrderLine = typeof bakeryDeliveryOrderLines.$inferInsert;

export type BakeryDeliveryNote = typeof bakeryDeliveryNotes.$inferSelect;
export type NewBakeryDeliveryNote = typeof bakeryDeliveryNotes.$inferInsert;

export type BakeryPointOfSale = typeof bakeryPointsOfSale.$inferSelect;
export type NewBakeryPointOfSale = typeof bakeryPointsOfSale.$inferInsert;

export type BakerySalesSession = typeof bakerySalesSessions.$inferSelect;
export type NewBakerySalesSession = typeof bakerySalesSessions.$inferInsert;

export type BakeryPOSStock = typeof bakeryPOSStock.$inferSelect;
export type NewBakeryPOSStock = typeof bakeryPOSStock.$inferInsert;

export type BakeryTeamHandover = typeof bakeryTeamHandovers.$inferSelect;
export type NewBakeryTeamHandover = typeof bakeryTeamHandovers.$inferInsert;

export type BakeryReportConfig = typeof bakeryReportConfigs.$inferSelect;
export type NewBakeryReportConfig = typeof bakeryReportConfigs.$inferInsert;

export type BakeryGeneratedReport = typeof bakeryGeneratedReports.$inferSelect;
export type NewBakeryGeneratedReport = typeof bakeryGeneratedReports.$inferInsert;

export type BakeryAccountingExport = typeof bakeryAccountingExports.$inferSelect;
export type NewBakeryAccountingExport = typeof bakeryAccountingExports.$inferInsert;

export type BakeryDailySalesSummary = typeof bakeryDailySalesSummary.$inferSelect;
export type NewBakeryDailySalesSummary = typeof bakeryDailySalesSummary.$inferInsert;

export type BakeryAuditLog = typeof bakeryAuditLogs.$inferSelect;
export type NewBakeryAuditLog = typeof bakeryAuditLogs.$inferInsert;
