ALTER TABLE bakery_delivery_orders ADD COLUMN invoice_id TEXT REFERENCES invoices(id);
ALTER TABLE bakery_delivery_orders ADD COLUMN invoiced_at INTEGER;
