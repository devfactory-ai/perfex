/**
 * Projects Module Types
 */

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type MilestoneStatus = 'pending' | 'completed' | 'missed';
export type ProjectMemberRole = 'manager' | 'member' | 'viewer';

/**
 * Project
 */
export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  companyId: string | null;
  contactId: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: Date | null;
  dueDate: Date | null;
  completedDate: Date | null;
  budgetAmount: number | null;
  budgetCurrency: string;
  actualCost: number;
  progress: number;
  billable: boolean;
  hourlyRate: number | null;
  projectManagerId: string | null;
  tags: string | null; // JSON array
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project with relationships
 */
export interface ProjectWithDetails extends Project {
  company?: any;
  contact?: any;
  projectManager?: any;
  tasksCount?: number;
  completedTasksCount?: number;
  teamMembersCount?: number;
}

/**
 * Project Task
 */
export interface ProjectTask {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  priority: ProjectPriority;
  startDate: Date | null;
  dueDate: Date | null;
  completedDate: Date | null;
  estimatedHours: number | null;
  actualHours: number;
  assignedTo: string | null;
  parentTaskId: string | null;
  order: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project Milestone
 */
export interface ProjectMilestone {
  id: string;
  organizationId: string;
  projectId: string;
  name: string;
  description: string | null;
  dueDate: Date;
  completedDate: Date | null;
  status: MilestoneStatus;
  order: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Time Entry
 */
export interface TimeEntry {
  id: string;
  organizationId: string;
  projectId: string;
  taskId: string | null;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  hours: number;
  description: string | null;
  billable: boolean;
  hourlyRate: number | null;
  amount: number | null;
  invoiced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project Member
 */
export interface ProjectMember {
  id: string;
  organizationId: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  hourlyRate: number | null;
  addedBy: string;
  addedAt: Date;
}
