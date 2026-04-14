-- Perfex Bakery - Performance Indexes
-- Optimizes query performance for bakery-specific workflows

-- =============================================
-- BAKERY STOCK MANAGEMENT
-- =============================================

-- Articles: category + active filtering
CREATE INDEX IF NOT EXISTS idx_bakery_articles_org_category_active
  ON bakery_articles (organization_id, category, is_active);

-- Articles: supplier lookup
CREATE INDEX IF NOT EXISTS idx_bakery_articles_supplier
  ON bakery_articles (main_supplier_id);

-- Stock movements: date range queries
CREATE INDEX IF NOT EXISTS idx_bakery_stock_movements_org_date
  ON bakery_stock_movements (organization_id, movement_date);

-- Stock movements: article lookup
CREATE INDEX IF NOT EXISTS idx_bakery_stock_movements_article
  ON bakery_stock_movements (article_id);

-- Stock movements: type filtering (entree/sortie/ajustement)
CREATE INDEX IF NOT EXISTS idx_bakery_stock_movements_type
  ON bakery_stock_movements (organization_id, type, movement_date);

-- Stock alerts: active alerts
CREATE INDEX IF NOT EXISTS idx_bakery_stock_alerts_org_status
  ON bakery_stock_alerts (organization_id, status);

-- Supplier orders: status workflow
CREATE INDEX IF NOT EXISTS idx_bakery_supplier_orders_org_status
  ON bakery_supplier_orders (organization_id, status);

-- Supplier orders: date range
CREATE INDEX IF NOT EXISTS idx_bakery_supplier_orders_date
  ON bakery_supplier_orders (organization_id, order_date);

-- =============================================
-- BAKERY PRODUCTION
-- =============================================

-- Products: active + category filtering
CREATE INDEX IF NOT EXISTS idx_bakery_products_org_active_category
  ON bakery_products (organization_id, is_active, category);

-- Product recipes: product lookup
CREATE INDEX IF NOT EXISTS idx_bakery_product_recipes_product
  ON bakery_product_recipes (product_id, is_active);

-- Recipe compositions: recipe lookup
CREATE INDEX IF NOT EXISTS idx_bakery_recipe_compositions_recipe
  ON bakery_recipe_compositions (recipe_id);

-- Proofing carts: status + chamber
CREATE INDEX IF NOT EXISTS idx_bakery_proofing_carts_org_status
  ON bakery_proofing_carts (organization_id, status, chamber_id);

-- Oven passages: date tracking
CREATE INDEX IF NOT EXISTS idx_bakery_oven_passages_org_date
  ON bakery_oven_passages (organization_id, start_time);

-- Quality controls: date + conformity
CREATE INDEX IF NOT EXISTS idx_bakery_quality_controls_org_date
  ON bakery_quality_controls (organization_id, control_date);

-- Production comparisons: date range
CREATE INDEX IF NOT EXISTS idx_bakery_production_comparisons_date
  ON bakery_production_comparisons (organization_id, production_date);

-- Daily consumptions: date + type
CREATE INDEX IF NOT EXISTS idx_bakery_daily_consumptions_date
  ON bakery_daily_consumptions (organization_id, consumption_date, type);

-- =============================================
-- BAKERY MAINTENANCE (CMMS)
-- =============================================

-- Equipment: type + status
CREATE INDEX IF NOT EXISTS idx_bakery_equipment_org_type_status
  ON bakery_equipment (organization_id, type, is_active);

-- Equipment: supplier
CREATE INDEX IF NOT EXISTS idx_bakery_equipment_supplier
  ON bakery_equipment (supplier_id);

-- Interventions: status + type
CREATE INDEX IF NOT EXISTS idx_bakery_interventions_org_status
  ON bakery_interventions (organization_id, status, type);

-- Interventions: date range
CREATE INDEX IF NOT EXISTS idx_bakery_interventions_date
  ON bakery_interventions (organization_id, start_date);

-- Maintenance plans: next scheduled
CREATE INDEX IF NOT EXISTS idx_bakery_maintenance_plans_next
  ON bakery_maintenance_plans (organization_id, is_active, next_scheduled_date);

-- Maintenance alerts: active alerts
CREATE INDEX IF NOT EXISTS idx_bakery_maintenance_alerts_org_status
  ON bakery_maintenance_alerts (organization_id, status);

-- Spare parts: stock lookup
CREATE INDEX IF NOT EXISTS idx_bakery_spare_parts_org_stock
  ON bakery_spare_parts (organization_id, current_stock);

-- =============================================
-- BAKERY SALES (B2B + POS)
-- =============================================

-- B2B Clients: active + type
CREATE INDEX IF NOT EXISTS idx_bakery_b2b_clients_org_type
  ON bakery_b2b_clients (organization_id, type, is_active);

-- Delivery orders: status + date (most common query)
CREATE INDEX IF NOT EXISTS idx_bakery_delivery_orders_org_status_date
  ON bakery_delivery_orders (organization_id, status, expected_delivery_date);

-- Delivery orders: client lookup
CREATE INDEX IF NOT EXISTS idx_bakery_delivery_orders_client
  ON bakery_delivery_orders (client_id);

-- Delivery orders: invoice link
CREATE INDEX IF NOT EXISTS idx_bakery_delivery_orders_invoice
  ON bakery_delivery_orders (invoice_id);

-- Delivery order lines: order lookup
CREATE INDEX IF NOT EXISTS idx_bakery_delivery_order_lines_order
  ON bakery_delivery_order_lines (order_id);

-- Sales sessions: date + POS
CREATE INDEX IF NOT EXISTS idx_bakery_sales_sessions_org_date_pos
  ON bakery_sales_sessions (organization_id, session_date, point_of_sale_id);

-- POS Stock: session lookup
CREATE INDEX IF NOT EXISTS idx_bakery_pos_stock_session
  ON bakery_pos_stock (session_id);

-- Daily sales summary: date range (P&L dashboard)
CREATE INDEX IF NOT EXISTS idx_bakery_daily_sales_summary_org_date
  ON bakery_daily_sales_summary (organization_id, summary_date);

-- =============================================
-- BAKERY REPORTING
-- =============================================

-- Report configs: active reports
CREATE INDEX IF NOT EXISTS idx_bakery_report_configs_org_active
  ON bakery_report_configs (organization_id, is_active);

-- Generated reports: date range
CREATE INDEX IF NOT EXISTS idx_bakery_generated_reports_org_date
  ON bakery_generated_reports (organization_id, generated_at);

-- Audit logs: entity + date
CREATE INDEX IF NOT EXISTS idx_bakery_audit_logs_org_entity_date
  ON bakery_audit_logs (organization_id, entity_type, created_at);

-- =============================================
-- FINANCE (for bakery P&L)
-- =============================================

-- Invoices: org + status + date
CREATE INDEX IF NOT EXISTS idx_invoices_org_status_date
  ON invoices (organization_id, status, date);

-- Invoices: customer
CREATE INDEX IF NOT EXISTS idx_invoices_customer
  ON invoices (customer_id);

-- Journal entries: org + date
CREATE INDEX IF NOT EXISTS idx_journal_entries_org_date
  ON journal_entries (organization_id, date);

-- Payments: org + date
CREATE INDEX IF NOT EXISTS idx_payments_org_date
  ON payments (organization_id, date);

-- Accounts: org + type
CREATE INDEX IF NOT EXISTS idx_accounts_org_type
  ON accounts (organization_id, type);

-- =============================================
-- CORE (auth, sessions)
-- =============================================

-- Sessions: user + expiry (cleanup queries)
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires
  ON sessions (user_id, expires_at);

-- Organization members: user lookup
CREATE INDEX IF NOT EXISTS idx_org_members_user
  ON organization_members (user_id);

-- Inventory items: org + category
CREATE INDEX IF NOT EXISTS idx_inventory_items_org_category
  ON inventory_items (organization_id, category);
