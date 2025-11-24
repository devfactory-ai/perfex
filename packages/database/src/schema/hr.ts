/**
 * HR (Human Resources) Module Schema
 * Employees, departments, leave requests, and attendance
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { organizations } from './users';
import { users } from './users';

/**
 * Departments
 */
export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull(), // HR, IT, SALES, etc.
  description: text('description'),
  managerId: text('manager_id').references(() => users.id, { onDelete: 'set null' }),
  parentDepartmentId: text('parent_department_id').references((): any => departments.id, { onDelete: 'set null' }),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Employees
 */
export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // Link to user account (optional)
  employeeNumber: text('employee_number').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }),
  gender: text('gender'), // male, female, other
  address: text('address'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  departmentId: text('department_id').references(() => departments.id, { onDelete: 'set null' }),
  position: text('position').notNull(), // Job title
  employmentType: text('employment_type').notNull(), // full_time, part_time, contract, intern
  hireDate: integer('hire_date', { mode: 'timestamp' }).notNull(),
  terminationDate: integer('termination_date', { mode: 'timestamp' }),
  salary: real('salary'),
  salaryCurrency: text('salary_currency').default('EUR'),
  salaryPeriod: text('salary_period').default('monthly'), // hourly, daily, weekly, monthly, yearly
  managerId: text('manager_id').references((): any => employees.id, { onDelete: 'set null' }),
  workSchedule: text('work_schedule'), // JSON: {monday: "09:00-17:00", ...}
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  emergencyContactRelation: text('emergency_contact_relation'),
  notes: text('notes'),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Leave Requests
 */
export const leaveRequests = sqliteTable('leave_requests', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  leaveType: text('leave_type').notNull(), // vacation, sick, personal, unpaid, maternity, paternity, etc.
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  totalDays: real('total_days').notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected, cancelled
  approvedBy: text('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Attendance Records
 */
export const attendanceRecords = sqliteTable('attendance_records', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  checkIn: integer('check_in', { mode: 'timestamp' }),
  checkOut: integer('check_out', { mode: 'timestamp' }),
  status: text('status').notNull(), // present, absent, late, half_day, on_leave
  workHours: real('work_hours'),
  overtimeHours: real('overtime_hours'),
  notes: text('notes'),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Leave Balances
 */
export const leaveBalances = sqliteTable('leave_balances', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'cascade' }),
  leaveType: text('leave_type').notNull(), // vacation, sick, personal, etc.
  year: integer('year').notNull(),
  totalDays: real('total_days').notNull(),
  usedDays: real('used_days').default(0),
  remainingDays: real('remaining_days').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
