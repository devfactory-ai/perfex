/**
 * Projects Module Schema
 * Database tables for project management, tasks, time tracking, and milestones
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations, users } from './users';
import { companies, contacts } from './crm';

/**
 * Projects table
 * Core project information
 */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  companyId: text('company_id').references(() => companies.id, { onDelete: 'set null' }),
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),

  // Project details
  status: text('status').notNull().default('planning'), // planning, active, on_hold, completed, cancelled
  priority: text('priority').notNull().default('medium'), // low, medium, high, urgent

  // Dates
  startDate: integer('start_date', { mode: 'timestamp' }),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  completedDate: integer('completed_date', { mode: 'timestamp' }),

  // Budget
  budgetAmount: real('budget_amount'),
  budgetCurrency: text('budget_currency').default('EUR'),
  actualCost: real('actual_cost').default(0),

  // Progress
  progress: integer('progress').default(0), // 0-100

  // Settings
  billable: integer('billable', { mode: 'boolean' }).default(true),
  hourlyRate: real('hourly_rate'),

  // Assignment
  projectManagerId: text('project_manager_id').references(() => users.id, { onDelete: 'set null' }),

  // Tags
  tags: text('tags'), // JSON array

  // Audit
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Project Tasks table
 * Tasks within projects
 */
export const projectTasks = sqliteTable('project_tasks', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),

  // Task details
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'), // todo, in_progress, review, done
  priority: text('priority').notNull().default('medium'), // low, medium, high, urgent

  // Dates
  startDate: integer('start_date', { mode: 'timestamp' }),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  completedDate: integer('completed_date', { mode: 'timestamp' }),

  // Effort estimation
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours').default(0),

  // Assignment
  assignedTo: text('assigned_to').references(() => users.id, { onDelete: 'set null' }),

  // Hierarchy
  parentTaskId: text('parent_task_id').references(() => projectTasks.id, { onDelete: 'set null' }),
  order: integer('order').default(0),

  // Audit
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Project Milestones table
 * Key project milestones and deliverables
 */
export const projectMilestones = sqliteTable('project_milestones', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),

  // Milestone details
  name: text('name').notNull(),
  description: text('description'),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  completedDate: integer('completed_date', { mode: 'timestamp' }),
  status: text('status').notNull().default('pending'), // pending, completed, missed

  // Order
  order: integer('order').default(0),

  // Audit
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Time Entries table
 * Time tracking for projects and tasks
 */
export const timeEntries = sqliteTable('time_entries', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  taskId: text('task_id').references(() => projectTasks.id, { onDelete: 'set null' }),

  // Time details
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  hours: real('hours').notNull(),

  // Description
  description: text('description'),

  // Billing
  billable: integer('billable', { mode: 'boolean' }).default(true),
  hourlyRate: real('hourly_rate'),
  amount: real('amount'),
  invoiced: integer('invoiced', { mode: 'boolean' }).default(false),

  // Audit
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Project Members table
 * Team members assigned to projects
 */
export const projectMembers = sqliteTable('project_members', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Role in project
  role: text('role').notNull().default('member'), // manager, member, viewer

  // Hourly rate for this project (overrides user default)
  hourlyRate: real('hourly_rate'),

  // Audit
  addedBy: text('added_by').notNull().references(() => users.id),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull(),
});
