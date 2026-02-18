-- Migration: Bakery Module
-- Description: Complete bakery ERP module including stock, production, maintenance, sales, and reporting

-- =============================================================================
-- MODULE 1: STOCK MANAGEMENT
-- =============================================================================

-- Articles (Raw Materials)
CREATE TABLE IF NOT EXISTS bakery_articles (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  reference TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL,
  average_purchase_price REAL DEFAULT 0,
  current_stock REAL DEFAULT 0,
  minimum_stock REAL DEFAULT 0,
  optimal_stock REAL DEFAULT 0,
  main_supplier_id TEXT,
  alternative_supplier_ids TEXT,
  expiration_date TEXT,
  is_active INTEGER DEFAULT 1,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_articles_org ON bakery_articles(organization_id);
CREATE INDEX IF NOT EXISTS idx_bakery_articles_category ON bakery_articles(category);
CREATE INDEX IF NOT EXISTS idx_bakery_articles_reference ON bakery_articles(reference);

-- Stock Movements
CREATE TABLE IF NOT EXISTS bakery_stock_movements (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  article_id TEXT NOT NULL REFERENCES bakery_articles(id),
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  stock_before REAL,
  stock_after REAL,
  reason TEXT NOT NULL,
  document_reference TEXT,
  lot_number TEXT,
  purchase_price REAL,
  movement_date INTEGER NOT NULL,
  comment TEXT,
  status TEXT DEFAULT 'brouillon',
  created_by TEXT,
  validated_by TEXT,
  validated_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_stock_movements_org ON bakery_stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_bakery_stock_movements_article ON bakery_stock_movements(article_id);
CREATE INDEX IF NOT EXISTS idx_bakery_stock_movements_date ON bakery_stock_movements(movement_date);

-- Inventories
CREATE TABLE IF NOT EXISTS bakery_inventories (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  inventory_date INTEGER NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_cours',
  total_articles INTEGER DEFAULT 0,
  counted_articles INTEGER DEFAULT 0,
  discrepancies_count INTEGER DEFAULT 0,
  total_discrepancy_value REAL DEFAULT 0,
  created_by TEXT,
  validated_by TEXT,
  validated_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_inventories_org ON bakery_inventories(organization_id);
CREATE INDEX IF NOT EXISTS idx_bakery_inventories_date ON bakery_inventories(inventory_date);

-- Inventory Lines
CREATE TABLE IF NOT EXISTS bakery_inventory_lines (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL,
  inventory_id TEXT NOT NULL REFERENCES bakery_inventories(id),
  article_id TEXT NOT NULL REFERENCES bakery_articles(id),
  theoretical_stock REAL NOT NULL,
  actual_stock REAL,
  discrepancy REAL,
  discrepancy_value REAL,
  justification TEXT
);

CREATE INDEX IF NOT EXISTS idx_bakery_inventory_lines_inventory ON bakery_inventory_lines(inventory_id);

-- Stock Alerts
CREATE TABLE IF NOT EXISTS bakery_stock_alerts (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  article_id TEXT NOT NULL REFERENCES bakery_articles(id),
  alert_type TEXT NOT NULL,
  message TEXT,
  current_stock REAL NOT NULL,
  threshold_stock REAL NOT NULL,
  is_acknowledged INTEGER DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_stock_alerts_org ON bakery_stock_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_bakery_stock_alerts_article ON bakery_stock_alerts(article_id);

-- Supplier Orders
CREATE TABLE IF NOT EXISTS bakery_supplier_orders (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  supplier_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  order_date INTEGER NOT NULL,
  expected_delivery_date INTEGER,
  status TEXT NOT NULL DEFAULT 'brouillon',
  total_amount REAL DEFAULT 0,
  sent_by_email INTEGER DEFAULT 0,
  sent_by_whatsapp INTEGER DEFAULT 0,
  sent_at INTEGER,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_supplier_orders_org ON bakery_supplier_orders(organization_id);

-- Supplier Order Lines
CREATE TABLE IF NOT EXISTS bakery_supplier_order_lines (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT,
  order_id TEXT NOT NULL REFERENCES bakery_supplier_orders(id),
  article_id TEXT NOT NULL REFERENCES bakery_articles(id),
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  line_amount REAL NOT NULL,
  received_quantity REAL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Products (Finished Goods)
CREATE TABLE IF NOT EXISTS bakery_products (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  reference TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_price REAL NOT NULL,
  cost_price REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_products_org ON bakery_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_bakery_products_category ON bakery_products(category);

-- Product Recipes
CREATE TABLE IF NOT EXISTS bakery_product_recipes (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  product_id TEXT NOT NULL REFERENCES bakery_products(id),
  name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  yield REAL NOT NULL,
  yield_unit TEXT NOT NULL,
  total_cost REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_product_recipes_product ON bakery_product_recipes(product_id);

-- Recipe Compositions
CREATE TABLE IF NOT EXISTS bakery_recipe_compositions (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT,
  recipe_id TEXT NOT NULL REFERENCES bakery_product_recipes(id),
  article_id TEXT NOT NULL REFERENCES bakery_articles(id),
  quantity_needed REAL NOT NULL
);

-- =============================================================================
-- MODULE 2: PRODUCTION
-- =============================================================================

-- Proofing Chambers
CREATE TABLE IF NOT EXISTS bakery_proofing_chambers (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  cart_capacity INTEGER NOT NULL,
  current_occupancy INTEGER DEFAULT 0,
  ideal_temperature REAL NOT NULL,
  ideal_humidity REAL NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Proofing Carts
CREATE TABLE IF NOT EXISTS bakery_proofing_carts (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  cart_number TEXT NOT NULL,
  chamber_id TEXT REFERENCES bakery_proofing_chambers(id),
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  status TEXT NOT NULL DEFAULT 'en_pousse',
  created_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_proofing_carts_org ON bakery_proofing_carts(organization_id);
CREATE INDEX IF NOT EXISTS idx_bakery_proofing_carts_chamber ON bakery_proofing_carts(chamber_id);

-- Cart Lines
CREATE TABLE IF NOT EXISTS bakery_cart_lines (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT,
  cart_id TEXT NOT NULL REFERENCES bakery_proofing_carts(id),
  product_id TEXT NOT NULL REFERENCES bakery_products(id),
  quantity INTEGER NOT NULL,
  dough_weight REAL
);

-- Ovens
CREATE TABLE IF NOT EXISTS bakery_ovens (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  cart_capacity INTEGER NOT NULL,
  max_temperature REAL NOT NULL,
  current_temperature REAL,
  status TEXT DEFAULT 'disponible',
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Oven Passages
CREATE TABLE IF NOT EXISTS bakery_oven_passages (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL,
  cart_id TEXT NOT NULL REFERENCES bakery_proofing_carts(id),
  oven_id TEXT NOT NULL REFERENCES bakery_ovens(id),
  entry_time INTEGER NOT NULL,
  exit_time INTEGER,
  temperature REAL NOT NULL,
  expected_duration INTEGER NOT NULL,
  actual_duration INTEGER,
  status TEXT NOT NULL DEFAULT 'en_cours',
  created_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_oven_passages_oven ON bakery_oven_passages(oven_id);
CREATE INDEX IF NOT EXISTS idx_bakery_oven_passages_cart ON bakery_oven_passages(cart_id);

-- Quality Controls
CREATE TABLE IF NOT EXISTS bakery_quality_controls (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  oven_passage_id TEXT NOT NULL REFERENCES bakery_oven_passages(id),
  control_time INTEGER NOT NULL,
  controlled_by TEXT,
  is_conforming INTEGER NOT NULL,
  comment TEXT,
  created_at INTEGER NOT NULL
);

-- Production Defects
CREATE TABLE IF NOT EXISTS bakery_production_defects (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT,
  quality_control_id TEXT NOT NULL REFERENCES bakery_quality_controls(id),
  product_id TEXT NOT NULL REFERENCES bakery_products(id),
  defect_type TEXT NOT NULL,
  defective_quantity INTEGER NOT NULL,
  probable_cause TEXT,
  corrective_action TEXT,
  created_at INTEGER NOT NULL
);

-- Production Comparisons
CREATE TABLE IF NOT EXISTS bakery_production_comparisons (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  production_date INTEGER NOT NULL,
  product_id TEXT NOT NULL REFERENCES bakery_products(id),
  oven_passage_id TEXT,
  theoretical_quantity REAL NOT NULL,
  actual_quantity REAL NOT NULL,
  variance REAL NOT NULL,
  variance_percentage REAL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_production_comparisons_date ON bakery_production_comparisons(production_date);

-- Meter Readings
CREATE TABLE IF NOT EXISTS bakery_meter_readings (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  reading_date INTEGER NOT NULL,
  meter_type TEXT NOT NULL,
  meter_value REAL NOT NULL,
  previous_value REAL,
  consumption REAL,
  read_by TEXT,
  created_at INTEGER NOT NULL
);

-- Daily Consumptions
CREATE TABLE IF NOT EXISTS bakery_daily_consumptions (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  consumption_date INTEGER NOT NULL,
  energy_type TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL,
  total_cost REAL,
  created_at INTEGER NOT NULL
);

-- =============================================================================
-- MODULE 3: MAINTENANCE (CMMS)
-- =============================================================================

-- Equipment
CREATE TABLE IF NOT EXISTS bakery_equipment (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  purchase_date INTEGER NOT NULL,
  commissioning_date INTEGER NOT NULL,
  supplier_id TEXT,
  purchase_value REAL NOT NULL,
  warranty_end_date INTEGER,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'operationnel',
  running_hours REAL DEFAULT 0,
  last_maintenance_date INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_equipment_org ON bakery_equipment(organization_id);
CREATE INDEX IF NOT EXISTS idx_bakery_equipment_type ON bakery_equipment(type);

-- Maintenance Interventions
CREATE TABLE IF NOT EXISTS bakery_interventions (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  equipment_id TEXT NOT NULL REFERENCES bakery_equipment(id),
  type TEXT NOT NULL,
  intervention_date INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  problem_nature TEXT,
  actions_performed TEXT NOT NULL,
  internal_technician_id TEXT,
  external_technician TEXT,
  external_company TEXT,
  parts_cost REAL DEFAULT 0,
  labor_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  caused_production_stop INTEGER DEFAULT 0,
  stop_duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'en_cours',
  comment TEXT,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_interventions_equipment ON bakery_interventions(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bakery_interventions_date ON bakery_interventions(intervention_date);

-- Maintenance Plans
CREATE TABLE IF NOT EXISTS bakery_maintenance_plans (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  equipment_id TEXT NOT NULL REFERENCES bakery_equipment(id),
  periodicity_type TEXT NOT NULL,
  interval INTEGER NOT NULL,
  checklist TEXT,
  estimated_duration_minutes INTEGER NOT NULL,
  next_scheduled_date INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Maintenance Alerts
CREATE TABLE IF NOT EXISTS bakery_maintenance_alerts (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  equipment_id TEXT REFERENCES bakery_equipment(id),
  plan_id TEXT REFERENCES bakery_maintenance_plans(id),
  spare_part_id TEXT,
  alert_type TEXT NOT NULL,
  message TEXT,
  is_acknowledged INTEGER DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Spare Parts
CREATE TABLE IF NOT EXISTS bakery_spare_parts (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  reference TEXT NOT NULL,
  designation TEXT NOT NULL,
  compatible_equipment_ids TEXT,
  current_stock REAL DEFAULT 0,
  minimum_stock REAL DEFAULT 0,
  unit_price REAL NOT NULL,
  supplier_id TEXT,
  delivery_lead_days INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Spare Part Movements
CREATE TABLE IF NOT EXISTS bakery_spare_part_movements (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT,
  spare_part_id TEXT NOT NULL REFERENCES bakery_spare_parts(id),
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  stock_before REAL,
  stock_after REAL,
  intervention_id TEXT REFERENCES bakery_interventions(id),
  movement_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Intervention Parts
CREATE TABLE IF NOT EXISTS bakery_intervention_parts (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT,
  intervention_id TEXT NOT NULL REFERENCES bakery_interventions(id),
  spare_part_id TEXT NOT NULL REFERENCES bakery_spare_parts(id),
  quantity REAL NOT NULL
);

-- Maintenance Indicators
CREATE TABLE IF NOT EXISTS bakery_maintenance_indicators (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  equipment_id TEXT NOT NULL REFERENCES bakery_equipment(id),
  calculation_date INTEGER NOT NULL,
  mtbf_hours REAL,
  mttr_hours REAL,
  total_downtime_hours REAL,
  availability REAL,
  total_interventions INTEGER,
  corrective_interventions INTEGER,
  preventive_interventions INTEGER,
  total_maintenance_cost REAL,
  created_at INTEGER NOT NULL
);

-- =============================================================================
-- MODULE 4: SALES
-- =============================================================================

-- B2B Clients
CREATE TABLE IF NOT EXISTS bakery_b2b_clients (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  commercial_name TEXT NOT NULL,
  type TEXT NOT NULL,
  main_contact TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  delivery_address TEXT NOT NULL,
  payment_terms TEXT,
  has_specific_pricing INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_b2b_clients_org ON bakery_b2b_clients(organization_id);

-- Client Pricing
CREATE TABLE IF NOT EXISTS bakery_client_pricing (
  id TEXT PRIMARY KEY NOT NULL,
  client_id TEXT NOT NULL REFERENCES bakery_b2b_clients(id),
  product_id TEXT NOT NULL REFERENCES bakery_products(id),
  custom_price REAL NOT NULL,
  valid_from INTEGER,
  valid_to INTEGER,
  created_at INTEGER NOT NULL
);

-- Delivery Orders
CREATE TABLE IF NOT EXISTS bakery_delivery_orders (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  order_number TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES bakery_b2b_clients(id),
  expected_delivery_date INTEGER NOT NULL,
  expected_delivery_time TEXT,
  status TEXT NOT NULL DEFAULT 'brouillon',
  total_ht REAL DEFAULT 0,
  total_tva REAL DEFAULT 0,
  total_ttc REAL DEFAULT 0,
  comment TEXT,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_delivery_orders_client ON bakery_delivery_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_bakery_delivery_orders_date ON bakery_delivery_orders(expected_delivery_date);

-- Delivery Order Lines
CREATE TABLE IF NOT EXISTS bakery_delivery_order_lines (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT,
  order_id TEXT NOT NULL REFERENCES bakery_delivery_orders(id),
  product_id TEXT NOT NULL REFERENCES bakery_products(id),
  ordered_quantity INTEGER NOT NULL,
  confirmed_quantity INTEGER,
  delivered_quantity INTEGER,
  unit_price_ht REAL NOT NULL,
  line_total REAL NOT NULL
);

-- Delivery Notes
CREATE TABLE IF NOT EXISTS bakery_delivery_notes (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT,
  order_id TEXT NOT NULL REFERENCES bakery_delivery_orders(id),
  note_number TEXT NOT NULL,
  delivery_time INTEGER NOT NULL,
  signatory_name TEXT,
  signature_data TEXT,
  latitude REAL,
  longitude REAL,
  delivered_by TEXT,
  created_at INTEGER NOT NULL
);

-- Points of Sale
CREATE TABLE IF NOT EXISTS bakery_points_of_sale (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Sales Sessions
CREATE TABLE IF NOT EXISTS bakery_sales_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  point_of_sale_id TEXT NOT NULL REFERENCES bakery_points_of_sale(id),
  session_date INTEGER NOT NULL,
  period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ouverte',
  opened_by TEXT,
  opened_at INTEGER,
  closed_at INTEGER,
  calculated_revenue REAL DEFAULT 0,
  declared_revenue REAL,
  revenue_variance REAL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_sales_sessions_pos ON bakery_sales_sessions(point_of_sale_id);
CREATE INDEX IF NOT EXISTS idx_bakery_sales_sessions_date ON bakery_sales_sessions(session_date);

-- POS Stock
CREATE TABLE IF NOT EXISTS bakery_pos_stock (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT,
  session_id TEXT NOT NULL REFERENCES bakery_sales_sessions(id),
  product_id TEXT NOT NULL REFERENCES bakery_products(id),
  opening_stock REAL DEFAULT 0,
  received_stock REAL DEFAULT 0,
  closing_stock REAL,
  theoretical_sold REAL,
  actual_sold REAL,
  variance REAL
);

-- Team Handovers
CREATE TABLE IF NOT EXISTS bakery_team_handovers (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  handover_date INTEGER NOT NULL,
  morning_session_id TEXT NOT NULL REFERENCES bakery_sales_sessions(id),
  afternoon_session_id TEXT NOT NULL REFERENCES bakery_sales_sessions(id),
  morning_signature TEXT,
  afternoon_signature TEXT,
  stock_transferred_value REAL,
  declared_morning_revenue REAL,
  comment TEXT,
  created_at INTEGER NOT NULL
);

-- =============================================================================
-- MODULE 5: REPORTING
-- =============================================================================

-- Report Configurations
CREATE TABLE IF NOT EXISTS bakery_report_configs (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  report_name TEXT NOT NULL,
  type TEXT NOT NULL,
  template_id TEXT,
  email_recipients TEXT,
  whatsapp_recipients TEXT,
  send_time TEXT NOT NULL,
  send_day INTEGER,
  is_active INTEGER DEFAULT 1,
  last_sent_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS bakery_generated_reports (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  config_id TEXT REFERENCES bakery_report_configs(id),
  report_type TEXT NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  report_data TEXT,
  generated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Accounting Exports
CREATE TABLE IF NOT EXISTS bakery_accounting_exports (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL,
  file_name TEXT,
  export_data TEXT,
  status TEXT DEFAULT 'en_cours',
  generated_by TEXT,
  generated_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Daily Sales Summary
CREATE TABLE IF NOT EXISTS bakery_daily_sales_summary (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  summary_date INTEGER NOT NULL,
  total_pos_revenue REAL DEFAULT 0,
  total_b2b_revenue REAL DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  products_produced INTEGER DEFAULT 0,
  defective_products INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  orders_delivered INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_daily_summary_date ON bakery_daily_sales_summary(summary_date);

-- Audit Logs
CREATE TABLE IF NOT EXISTS bakery_audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bakery_audit_logs_entity ON bakery_audit_logs(entity_type, entity_id);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Stock Management Indexes
CREATE INDEX IF NOT EXISTS idx_bakery_stock_movements_article ON bakery_stock_movements(article_id);
CREATE INDEX IF NOT EXISTS idx_bakery_stock_movements_date ON bakery_stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_bakery_stock_movements_type ON bakery_stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_bakery_inventory_lines_inv ON bakery_inventory_lines(inventory_id);
CREATE INDEX IF NOT EXISTS idx_bakery_stock_alerts_org_ack ON bakery_stock_alerts(organization_id, is_acknowledged);

-- Production Indexes
CREATE INDEX IF NOT EXISTS idx_bakery_proofing_carts_chamber ON bakery_proofing_carts(chamber_id);
CREATE INDEX IF NOT EXISTS idx_bakery_proofing_carts_status ON bakery_proofing_carts(status);
CREATE INDEX IF NOT EXISTS idx_bakery_proofing_carts_entry ON bakery_proofing_carts(entry_time);
CREATE INDEX IF NOT EXISTS idx_bakery_cart_lines_cart ON bakery_cart_lines(cart_id);
CREATE INDEX IF NOT EXISTS idx_bakery_oven_passages_oven ON bakery_oven_passages(oven_id);
CREATE INDEX IF NOT EXISTS idx_bakery_oven_passages_cart ON bakery_oven_passages(cart_id);
CREATE INDEX IF NOT EXISTS idx_bakery_quality_controls_passage ON bakery_quality_controls(oven_passage_id);
CREATE INDEX IF NOT EXISTS idx_bakery_production_comparisons_date ON bakery_production_comparisons(comparison_date);

-- Maintenance Indexes
CREATE INDEX IF NOT EXISTS idx_bakery_equipment_type ON bakery_equipment(type);
CREATE INDEX IF NOT EXISTS idx_bakery_interventions_equipment ON bakery_interventions(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bakery_interventions_date ON bakery_interventions(intervention_date);
CREATE INDEX IF NOT EXISTS idx_bakery_interventions_status ON bakery_interventions(status);
CREATE INDEX IF NOT EXISTS idx_bakery_maintenance_plans_equipment ON bakery_maintenance_plans(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bakery_maintenance_alerts_plan ON bakery_maintenance_alerts(plan_id);

-- Sales Indexes
CREATE INDEX IF NOT EXISTS idx_bakery_delivery_orders_client ON bakery_delivery_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_bakery_delivery_orders_status ON bakery_delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_bakery_delivery_orders_date ON bakery_delivery_orders(expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_bakery_order_lines_order ON bakery_delivery_order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_bakery_sales_sessions_pos ON bakery_sales_sessions(point_of_sale_id);
CREATE INDEX IF NOT EXISTS idx_bakery_sales_sessions_date ON bakery_sales_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_bakery_sales_sessions_status ON bakery_sales_sessions(status);
CREATE INDEX IF NOT EXISTS idx_bakery_pos_stock_session ON bakery_pos_stock(session_id);

-- Reporting Indexes
CREATE INDEX IF NOT EXISTS idx_bakery_generated_reports_date ON bakery_generated_reports(generation_date);
CREATE INDEX IF NOT EXISTS idx_bakery_accounting_exports_date ON bakery_accounting_exports(generated_at);
