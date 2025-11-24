/**
 * HR validators (Zod schemas)
 */

import { z } from 'zod';

/**
 * Create department schema
 */
export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(50),
  description: z.string().max(1000).optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  parentDepartmentId: z.string().uuid().optional().nullable(),
  active: z.boolean().default(true),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

/**
 * Update department schema
 */
export const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(1000).optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  parentDepartmentId: z.string().uuid().optional().nullable(),
  active: z.boolean().optional(),
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

/**
 * Create employee schema
 */
export const createEmployeeSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  employeeNumber: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional().nullable(),
  dateOfBirth: z.string().datetime().or(z.date()).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  position: z.string().min(1).max(200),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  hireDate: z.string().datetime().or(z.date()),
  terminationDate: z.string().datetime().or(z.date()).optional().nullable(),
  salary: z.number().min(0).optional().nullable(),
  salaryCurrency: z.string().length(3).default('EUR'),
  salaryPeriod: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  managerId: z.string().uuid().optional().nullable(),
  workSchedule: z.string().optional().nullable(), // JSON string
  emergencyContactName: z.string().max(200).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  emergencyContactRelation: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  active: z.boolean().default(true),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

/**
 * Update employee schema
 */
export const updateEmployeeSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  employeeNumber: z.string().min(1).max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional().nullable(),
  dateOfBirth: z.string().datetime().or(z.date()).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  position: z.string().min(1).max(200).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
  hireDate: z.string().datetime().or(z.date()).optional(),
  terminationDate: z.string().datetime().or(z.date()).optional().nullable(),
  salary: z.number().min(0).optional().nullable(),
  salaryCurrency: z.string().length(3).optional(),
  salaryPeriod: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
  managerId: z.string().uuid().optional().nullable(),
  workSchedule: z.string().optional().nullable(),
  emergencyContactName: z.string().max(200).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  emergencyContactRelation: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

/**
 * Create leave request schema
 */
export const createLeaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.enum(['vacation', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other']),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  totalDays: z.number().min(0.5),
  reason: z.string().max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;

/**
 * Update leave request schema
 */
export const updateLeaveRequestSchema = z.object({
  leaveType: z.enum(['vacation', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement', 'other']).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  totalDays: z.number().min(0.5).optional(),
  reason: z.string().max(1000).optional().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  rejectionReason: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>;

/**
 * Create attendance record schema
 */
export const createAttendanceRecordSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().datetime().or(z.date()),
  checkIn: z.string().datetime().or(z.date()).optional().nullable(),
  checkOut: z.string().datetime().or(z.date()).optional().nullable(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'on_leave']),
  workHours: z.number().min(0).optional().nullable(),
  overtimeHours: z.number().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordSchema>;

/**
 * Update attendance record schema
 */
export const updateAttendanceRecordSchema = z.object({
  checkIn: z.string().datetime().or(z.date()).optional().nullable(),
  checkOut: z.string().datetime().or(z.date()).optional().nullable(),
  status: z.enum(['present', 'absent', 'late', 'half_day', 'on_leave']).optional(),
  workHours: z.number().min(0).optional().nullable(),
  overtimeHours: z.number().min(0).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type UpdateAttendanceRecordInput = z.infer<typeof updateAttendanceRecordSchema>;
