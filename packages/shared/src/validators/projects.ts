/**
 * Projects validators (Zod schemas)
 */

import { z } from 'zod';

/**
 * Create project schema
 */
export const createProjectSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  budgetAmount: z.number().min(0).optional().nullable(),
  budgetCurrency: z.string().length(3).default('EUR'),
  billable: z.boolean().default(true),
  hourlyRate: z.number().min(0).optional().nullable(),
  projectManagerId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Update project schema
 */
export const updateProjectSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  completedDate: z.string().datetime().or(z.date()).optional().nullable(),
  budgetAmount: z.number().min(0).optional().nullable(),
  budgetCurrency: z.string().length(3).optional(),
  actualCost: z.number().min(0).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  billable: z.boolean().optional(),
  hourlyRate: z.number().min(0).optional().nullable(),
  projectManagerId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * Create project task schema
 */
export const createProjectTaskSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  estimatedHours: z.number().min(0).optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  parentTaskId: z.string().uuid().optional().nullable(),
  order: z.number().int().default(0),
});

export type CreateProjectTaskInput = z.infer<typeof createProjectTaskSchema>;

/**
 * Update project task schema
 */
export const updateProjectTaskSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional().nullable(),
  completedDate: z.string().datetime().or(z.date()).optional().nullable(),
  estimatedHours: z.number().min(0).optional().nullable(),
  actualHours: z.number().min(0).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  parentTaskId: z.string().uuid().optional().nullable(),
  order: z.number().int().optional(),
});

export type UpdateProjectTaskInput = z.infer<typeof updateProjectTaskSchema>;

/**
 * Create milestone schema
 */
export const createMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()),
  order: z.number().int().default(0),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

/**
 * Update milestone schema
 */
export const updateMilestoneSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  completedDate: z.string().datetime().or(z.date()).optional().nullable(),
  status: z.enum(['pending', 'completed', 'missed']).optional(),
  order: z.number().int().optional(),
});

export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

/**
 * Create time entry schema
 */
export const createTimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional().nullable(),
  startTime: z.string().datetime().or(z.date()),
  endTime: z.string().datetime().or(z.date()).optional().nullable(),
  hours: z.number().min(0),
  description: z.string().max(1000).optional().nullable(),
  billable: z.boolean().default(true),
  hourlyRate: z.number().min(0).optional().nullable(),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;

/**
 * Update time entry schema
 */
export const updateTimeEntrySchema = z.object({
  startTime: z.string().datetime().or(z.date()).optional(),
  endTime: z.string().datetime().or(z.date()).optional().nullable(),
  hours: z.number().min(0).optional(),
  description: z.string().max(1000).optional().nullable(),
  billable: z.boolean().optional(),
  hourlyRate: z.number().min(0).optional().nullable(),
  invoiced: z.boolean().optional(),
});

export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;

/**
 * Add project member schema
 */
export const addProjectMemberSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['manager', 'member', 'viewer']).default('member'),
  hourlyRate: z.number().min(0).optional().nullable(),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
