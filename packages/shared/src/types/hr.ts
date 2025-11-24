/**
 * HR Module Types
 */

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export type Gender = 'male' | 'female' | 'other';
export type SalaryPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'unpaid' | 'maternity' | 'paternity' | 'bereavement' | 'other';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';

/**
 * Department
 */
export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  managerId: string | null;
  parentDepartmentId: string | null;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Department with manager and parent details
 */
export interface DepartmentWithDetails extends Department {
  managerName?: string;
  parentDepartmentName?: string;
  employeeCount?: number;
}

/**
 * Employee
 */
export interface Employee {
  id: string;
  organizationId: string;
  userId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  departmentId: string | null;
  position: string;
  employmentType: EmploymentType;
  hireDate: Date;
  terminationDate: Date | null;
  salary: number | null;
  salaryCurrency: string;
  salaryPeriod: SalaryPeriod;
  managerId: string | null;
  workSchedule: string | null; // JSON
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  notes: string | null;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Employee with department details
 */
export interface EmployeeWithDetails extends Employee {
  departmentName?: string;
  managerName?: string;
}

/**
 * Leave Request
 */
export interface LeaveRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  status: LeaveRequestStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Leave Request with employee details
 */
export interface LeaveRequestWithDetails extends LeaveRequest {
  employeeName?: string;
  employeeNumber?: string;
  approverName?: string;
}

/**
 * Attendance Record
 */
export interface AttendanceRecord {
  id: string;
  organizationId: string;
  employeeId: string;
  date: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  status: AttendanceStatus;
  workHours: number | null;
  overtimeHours: number | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Attendance Record with employee details
 */
export interface AttendanceRecordWithDetails extends AttendanceRecord {
  employeeName?: string;
  employeeNumber?: string;
}

/**
 * Leave Balance
 */
export interface LeaveBalance {
  id: string;
  organizationId: string;
  employeeId: string;
  leaveType: LeaveType;
  year: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  updatedAt: Date;
}
