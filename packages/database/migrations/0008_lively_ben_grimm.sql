CREATE TABLE `bill_of_materials` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`bom_number` text NOT NULL,
	`product_id` text NOT NULL,
	`version` text DEFAULT '1.0',
	`description` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit` text DEFAULT 'unit',
	`status` text DEFAULT 'draft' NOT NULL,
	`effective_date` integer,
	`expiry_date` integer,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bom_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`bom_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text DEFAULT 'unit',
	`scrap_percent` real DEFAULT 0,
	`position` integer DEFAULT 0,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`bom_id`) REFERENCES `bill_of_materials`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `material_consumption` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`work_order_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity_planned` real NOT NULL,
	`quantity_consumed` real DEFAULT 0,
	`unit` text DEFAULT 'unit',
	`consumed_at` integer,
	`notes` text,
	`created_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `routing_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`routing_id` text NOT NULL,
	`operation_number` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`work_center` text,
	`setup_time` real DEFAULT 0,
	`cycle_time` real DEFAULT 0,
	`labor_cost` real DEFAULT 0,
	`overhead_cost` real DEFAULT 0,
	`position` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`routing_id`) REFERENCES `routings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `routings` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`routing_number` text NOT NULL,
	`product_id` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_order_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`work_order_id` text NOT NULL,
	`operation_id` text,
	`operation_number` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`scheduled_start_date` integer,
	`actual_start_date` integer,
	`actual_end_date` integer,
	`actual_time` real DEFAULT 0,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`operation_id`) REFERENCES `routing_operations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`work_order_number` text NOT NULL,
	`product_id` text NOT NULL,
	`bom_id` text,
	`routing_id` text,
	`sales_order_id` text,
	`quantity_planned` real NOT NULL,
	`quantity_produced` real DEFAULT 0,
	`unit` text DEFAULT 'unit',
	`status` text DEFAULT 'draft' NOT NULL,
	`priority` text DEFAULT 'normal',
	`scheduled_start_date` integer,
	`scheduled_end_date` integer,
	`actual_start_date` integer,
	`actual_end_date` integer,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bom_id`) REFERENCES `bill_of_materials`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`routing_id`) REFERENCES `routings`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
