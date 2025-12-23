-- Dialyse Extended Tables: Protocols, Staff, Billing, Transport, Consumables

-- Treatment Protocols / Templates
CREATE TABLE `dialyse_protocols` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`description` text,
	`type` text NOT NULL,
	`is_template` integer DEFAULT true,
	`dialyzer_type` text,
	`dialyzer_surface` real,
	`blood_flow_rate` integer,
	`dialysate_flow_rate` integer,
	`session_duration_minutes` integer,
	`uf_goal` real,
	`anticoagulation_type` text,
	`anticoagulation_dose` text,
	`anticoagulation_protocol` text,
	`dialysate_sodium` integer,
	`dialysate_potassium` real,
	`dialysate_bicarbonate` integer,
	`dialysate_calcium` real,
	`dialysate_glucose` real,
	`dialysate_temperature` real,
	`access_type_preference` text,
	`special_instructions` text,
	`contraindications` text,
	`status` text DEFAULT 'active',
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Medical Staff for Dialysis Unit
CREATE TABLE `dialyse_staff` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`employee_id` text,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`role` text NOT NULL,
	`specialty` text,
	`license_number` text,
	`license_expiry` integer,
	`phone` text,
	`email` text,
	`status` text DEFAULT 'active',
	`schedule` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Billing for Dialysis Sessions
CREATE TABLE `dialyse_billing` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`session_id` text,
	`invoice_number` text NOT NULL,
	`billing_date` integer NOT NULL,
	`session_date` integer NOT NULL,
	`billing_type` text NOT NULL,
	`amount` real NOT NULL,
	`insurance_amount` real DEFAULT 0,
	`patient_amount` real DEFAULT 0,
	`insurance_provider` text,
	`insurance_policy_number` text,
	`status` text DEFAULT 'pending',
	`paid_amount` real DEFAULT 0,
	`paid_date` integer,
	`payment_method` text,
	`payment_reference` text,
	`line_items` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`patient_id`) REFERENCES `dialyse_patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `dialyse_sessions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Patient Transport Management
CREATE TABLE `dialyse_transport` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`session_id` text,
	`transport_date` integer NOT NULL,
	`direction` text NOT NULL,
	`transport_type` text NOT NULL,
	`provider_name` text,
	`provider_phone` text,
	`vehicle_number` text,
	`driver_name` text,
	`pickup_address` text,
	`dropoff_address` text,
	`scheduled_time` text NOT NULL,
	`actual_time` text,
	`special_needs` text,
	`wheelchair_required` integer DEFAULT false,
	`stretcher_required` integer DEFAULT false,
	`oxygen_required` integer DEFAULT false,
	`escort_required` integer DEFAULT false,
	`escort_name` text,
	`status` text DEFAULT 'scheduled',
	`cost` real DEFAULT 0,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`patient_id`) REFERENCES `dialyse_patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `dialyse_sessions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Dialysis Consumables Inventory
CREATE TABLE `dialyse_consumables` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`inventory_item_id` text,
	`name` text NOT NULL,
	`code` text,
	`category` text NOT NULL,
	`description` text,
	`unit` text NOT NULL,
	`current_stock` real DEFAULT 0,
	`min_stock` real DEFAULT 0,
	`max_stock` real,
	`reorder_point` real,
	`unit_cost` real DEFAULT 0,
	`supplier` text,
	`manufacturer` text,
	`expiry_tracking` integer DEFAULT true,
	`lot_tracking` integer DEFAULT true,
	`status` text DEFAULT 'active',
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Consumables Stock Movements
CREATE TABLE `dialyse_consumable_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`consumable_id` text NOT NULL,
	`movement_type` text NOT NULL,
	`quantity` real NOT NULL,
	`lot_number` text,
	`expiry_date` integer,
	`reference` text,
	`session_id` text,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`consumable_id`) REFERENCES `dialyse_consumables`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `dialyse_sessions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX `idx_dialyse_protocols_org` ON `dialyse_protocols`(`organization_id`);
CREATE INDEX `idx_dialyse_protocols_status` ON `dialyse_protocols`(`status`);
CREATE INDEX `idx_dialyse_staff_org` ON `dialyse_staff`(`organization_id`);
CREATE INDEX `idx_dialyse_staff_role` ON `dialyse_staff`(`role`);
CREATE INDEX `idx_dialyse_billing_org` ON `dialyse_billing`(`organization_id`);
CREATE INDEX `idx_dialyse_billing_patient` ON `dialyse_billing`(`patient_id`);
CREATE INDEX `idx_dialyse_billing_status` ON `dialyse_billing`(`status`);
CREATE INDEX `idx_dialyse_transport_org` ON `dialyse_transport`(`organization_id`);
CREATE INDEX `idx_dialyse_transport_patient` ON `dialyse_transport`(`patient_id`);
CREATE INDEX `idx_dialyse_transport_date` ON `dialyse_transport`(`transport_date`);
CREATE INDEX `idx_dialyse_consumables_org` ON `dialyse_consumables`(`organization_id`);
CREATE INDEX `idx_dialyse_consumables_category` ON `dialyse_consumables`(`category`);
CREATE INDEX `idx_dialyse_consumable_movements_consumable` ON `dialyse_consumable_movements`(`consumable_id`);
