/**
 * RPM Program Service
 * Manage RPM programs and patient enrollments
 */

import { eq, and, desc, asc, like, or, sql } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import { rpmPrograms, rpmEnrollments, healthcarePatients, iotDevices } from '@perfex/database';

// Types
export interface CreateProgramInput {
  programCode: string;
  programName: string;
  description?: string;
  programType: string;
  associatedModule?: string;
  requiredReadingTypes: string[];
  readingFrequency?: Record<string, string>;
  minimumReadingsPerWeek?: number;
  alertThresholds?: Record<string, any>;
  complianceTargetPercent?: number;
  complianceWindowDays?: number;
  programDurationDays?: number;
  cptCode?: string;
  billingRatePerMonth?: number;
  notes?: string;
}

export interface UpdateProgramInput extends Partial<CreateProgramInput> {
  status?: string;
}

export interface CreateEnrollmentInput {
  patientId: string;
  programId: string;
  startDate: string;
  expectedEndDate?: string;
  primaryPhysicianId?: string;
  careCoordinatorId?: string;
  customAlertThresholds?: Record<string, any>;
  customReadingFrequency?: Record<string, string>;
  patientGoals?: Record<string, any>;
  assignedDevices?: string[];
  notes?: string;
}

export interface RpmProgram {
  id: string;
  organizationId: string;
  programCode: string;
  programName: string;
  description: string | null;
  programType: string;
  associatedModule: string | null;
  requiredReadingTypes: string;
  readingFrequency: string | null;
  minimumReadingsPerWeek: number;
  alertThresholds: string | null;
  complianceTargetPercent: number;
  complianceWindowDays: number;
  programDurationDays: number | null;
  cptCode: string | null;
  billingRatePerMonth: number | null;
  status: string;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RpmEnrollment {
  id: string;
  organizationId: string;
  patientId: string;
  programId: string;
  enrollmentNumber: string;
  enrolledAt: Date;
  enrolledBy: string;
  startDate: Date;
  expectedEndDate: Date | null;
  actualEndDate: Date | null;
  status: string;
  statusReason: string | null;
  statusChangedAt: Date | null;
  statusChangedBy: string | null;
  primaryPhysicianId: string | null;
  careCoordinatorId: string | null;
  customAlertThresholds: string | null;
  customReadingFrequency: string | null;
  patientGoals: string | null;
  consentObtained: boolean;
  consentDate: Date | null;
  consentDocumentUrl: string | null;
  assignedDevices: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProgramService {
  // ============================================================================
  // PROGRAMS
  // ============================================================================

  /**
   * Create a new RPM program
   */
  async createProgram(organizationId: string, userId: string, data: CreateProgramInput): Promise<RpmProgram> {
    const now = new Date();
    const programId = crypto.randomUUID();

    await drizzleDb.insert(rpmPrograms).values({
      id: programId,
      organizationId,
      programCode: data.programCode,
      programName: data.programName,
      description: data.description || null,
      programType: data.programType as any,
      associatedModule: data.associatedModule as any || null,
      requiredReadingTypes: JSON.stringify(data.requiredReadingTypes),
      readingFrequency: data.readingFrequency ? JSON.stringify(data.readingFrequency) : null,
      minimumReadingsPerWeek: data.minimumReadingsPerWeek || 1,
      alertThresholds: data.alertThresholds ? JSON.stringify(data.alertThresholds) : null,
      complianceTargetPercent: data.complianceTargetPercent || 80,
      complianceWindowDays: data.complianceWindowDays || 7,
      programDurationDays: data.programDurationDays || null,
      cptCode: data.cptCode || null,
      billingRatePerMonth: data.billingRatePerMonth || null,
      status: 'active',
      notes: data.notes || null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const program = await this.getProgramById(organizationId, programId);
    if (!program) {
      throw new Error('Failed to create program');
    }

    return program;
  }

  /**
   * Get program by ID
   */
  async getProgramById(organizationId: string, programId: string): Promise<RpmProgram | null> {
    const program = await drizzleDb
      .select()
      .from(rpmPrograms)
      .where(and(eq(rpmPrograms.id, programId), eq(rpmPrograms.organizationId, organizationId)))
      .get() as any;

    return program as RpmProgram || null;
  }

  /**
   * List programs
   */
  async listPrograms(
    organizationId: string,
    options: {
      status?: string;
      programType?: string;
      associatedModule?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ programs: RpmProgram[]; total: number }> {
    const { status, programType, associatedModule, search, page = 1, limit = 20 } = options;

    const conditions = [eq(rpmPrograms.organizationId, organizationId)];

    if (status) {
      conditions.push(eq(rpmPrograms.status, status as any));
    }

    if (programType) {
      conditions.push(eq(rpmPrograms.programType, programType as any));
    }

    if (associatedModule) {
      conditions.push(eq(rpmPrograms.associatedModule, associatedModule as any));
    }

    if (search) {
      conditions.push(
        or(
          like(rpmPrograms.programCode, `%${search}%`),
          like(rpmPrograms.programName, `%${search}%`)
        )!
      );
    }

    const countResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(rpmPrograms)
      .where(and(...conditions))
      .get();

    const total = countResult?.count || 0;

    const offset = (page - 1) * limit;
    const programs = await drizzleDb
      .select()
      .from(rpmPrograms)
      .where(and(...conditions))
      .orderBy(desc(rpmPrograms.createdAt))
      .limit(limit)
      .offset(offset)
      .all() as any[];

    return { programs: programs as RpmProgram[], total };
  }

  /**
   * Update program
   */
  async updateProgram(organizationId: string, programId: string, data: UpdateProgramInput): Promise<RpmProgram | null> {
    const existing = await this.getProgramById(organizationId, programId);
    if (!existing) {
      return null;
    }

    const updateData: any = { updatedAt: new Date() };

    if (data.programCode !== undefined) updateData.programCode = data.programCode;
    if (data.programName !== undefined) updateData.programName = data.programName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.programType !== undefined) updateData.programType = data.programType;
    if (data.associatedModule !== undefined) updateData.associatedModule = data.associatedModule;
    if (data.requiredReadingTypes !== undefined) updateData.requiredReadingTypes = JSON.stringify(data.requiredReadingTypes);
    if (data.readingFrequency !== undefined) updateData.readingFrequency = JSON.stringify(data.readingFrequency);
    if (data.minimumReadingsPerWeek !== undefined) updateData.minimumReadingsPerWeek = data.minimumReadingsPerWeek;
    if (data.alertThresholds !== undefined) updateData.alertThresholds = JSON.stringify(data.alertThresholds);
    if (data.complianceTargetPercent !== undefined) updateData.complianceTargetPercent = data.complianceTargetPercent;
    if (data.complianceWindowDays !== undefined) updateData.complianceWindowDays = data.complianceWindowDays;
    if (data.programDurationDays !== undefined) updateData.programDurationDays = data.programDurationDays;
    if (data.cptCode !== undefined) updateData.cptCode = data.cptCode;
    if (data.billingRatePerMonth !== undefined) updateData.billingRatePerMonth = data.billingRatePerMonth;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await drizzleDb
      .update(rpmPrograms)
      .set(updateData)
      .where(and(eq(rpmPrograms.id, programId), eq(rpmPrograms.organizationId, organizationId)));

    return this.getProgramById(organizationId, programId);
  }

  /**
   * Delete program (soft delete)
   */
  async deleteProgram(organizationId: string, programId: string): Promise<boolean> {
    const program = await this.getProgramById(organizationId, programId);
    if (!program) {
      return false;
    }

    await drizzleDb
      .update(rpmPrograms)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(and(eq(rpmPrograms.id, programId), eq(rpmPrograms.organizationId, organizationId)));

    return true;
  }

  // ============================================================================
  // ENROLLMENTS
  // ============================================================================

  /**
   * Enroll patient in program
   */
  async enrollPatient(organizationId: string, userId: string, data: CreateEnrollmentInput): Promise<RpmEnrollment> {
    const now = new Date();
    const enrollmentId = crypto.randomUUID();

    // Verify patient exists
    const patient = await drizzleDb
      .select()
      .from(healthcarePatients)
      .where(and(eq(healthcarePatients.id, data.patientId), eq(healthcarePatients.companyId, organizationId)))
      .get();

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify program exists
    const program = await this.getProgramById(organizationId, data.programId);
    if (!program) {
      throw new Error('Program not found');
    }

    // Check for existing active enrollment
    const existingEnrollment = await drizzleDb
      .select()
      .from(rpmEnrollments)
      .where(and(
        eq(rpmEnrollments.organizationId, organizationId),
        eq(rpmEnrollments.patientId, data.patientId),
        eq(rpmEnrollments.programId, data.programId),
        eq(rpmEnrollments.status, 'active')
      ))
      .get();

    if (existingEnrollment) {
      throw new Error('Patient is already enrolled in this program');
    }

    // Generate enrollment number
    const countResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(rpmEnrollments)
      .where(eq(rpmEnrollments.organizationId, organizationId))
      .get();
    const enrollmentNumber = `ENR-${String((countResult?.count || 0) + 1).padStart(8, '0')}`;

    // Calculate expected end date if program has duration
    let expectedEndDate: Date | null = null;
    if (data.expectedEndDate) {
      expectedEndDate = new Date(data.expectedEndDate);
    } else if (program.programDurationDays) {
      expectedEndDate = new Date(data.startDate);
      expectedEndDate.setDate(expectedEndDate.getDate() + program.programDurationDays);
    }

    await drizzleDb.insert(rpmEnrollments).values({
      id: enrollmentId,
      organizationId,
      patientId: data.patientId,
      programId: data.programId,
      enrollmentNumber,
      enrolledAt: now,
      enrolledBy: userId,
      startDate: new Date(data.startDate),
      expectedEndDate,
      actualEndDate: null,
      status: 'active',
      statusReason: null,
      statusChangedAt: null,
      statusChangedBy: null,
      primaryPhysicianId: data.primaryPhysicianId || null,
      careCoordinatorId: data.careCoordinatorId || null,
      customAlertThresholds: data.customAlertThresholds ? JSON.stringify(data.customAlertThresholds) : null,
      customReadingFrequency: data.customReadingFrequency ? JSON.stringify(data.customReadingFrequency) : null,
      patientGoals: data.patientGoals ? JSON.stringify(data.patientGoals) : null,
      consentObtained: false,
      consentDate: null,
      consentDocumentUrl: null,
      assignedDevices: data.assignedDevices ? JSON.stringify(data.assignedDevices) : null,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
    });

    // If devices are assigned, update them
    if (data.assignedDevices && data.assignedDevices.length > 0) {
      for (const deviceId of data.assignedDevices) {
        await drizzleDb
          .update(iotDevices)
          .set({
            assignedPatientId: data.patientId,
            assignedAt: now,
            assignedBy: userId,
            status: 'active',
            updatedAt: now,
          })
          .where(and(
            eq(iotDevices.id, deviceId),
            eq(iotDevices.organizationId, organizationId)
          ));
      }
    }

    const enrollment = await this.getEnrollmentById(organizationId, enrollmentId);
    if (!enrollment) {
      throw new Error('Failed to create enrollment');
    }

    return enrollment;
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(organizationId: string, enrollmentId: string): Promise<RpmEnrollment | null> {
    const enrollment = await drizzleDb
      .select()
      .from(rpmEnrollments)
      .where(and(eq(rpmEnrollments.id, enrollmentId), eq(rpmEnrollments.organizationId, organizationId)))
      .get() as any;

    return enrollment as RpmEnrollment || null;
  }

  /**
   * List enrollments
   */
  async listEnrollments(
    organizationId: string,
    options: {
      patientId?: string;
      programId?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ enrollments: RpmEnrollment[]; total: number }> {
    const { patientId, programId, status, page = 1, limit = 20 } = options;

    const conditions = [eq(rpmEnrollments.organizationId, organizationId)];

    if (patientId) {
      conditions.push(eq(rpmEnrollments.patientId, patientId));
    }

    if (programId) {
      conditions.push(eq(rpmEnrollments.programId, programId));
    }

    if (status) {
      conditions.push(eq(rpmEnrollments.status, status as any));
    }

    const countResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(rpmEnrollments)
      .where(and(...conditions))
      .get();

    const total = countResult?.count || 0;

    const offset = (page - 1) * limit;
    const enrollments = await drizzleDb
      .select()
      .from(rpmEnrollments)
      .where(and(...conditions))
      .orderBy(desc(rpmEnrollments.enrolledAt))
      .limit(limit)
      .offset(offset)
      .all() as any[];

    return { enrollments: enrollments as RpmEnrollment[], total };
  }

  /**
   * Get active enrollment for patient
   */
  async getActiveEnrollment(organizationId: string, patientId: string, programId?: string): Promise<RpmEnrollment | null> {
    const conditions = [
      eq(rpmEnrollments.organizationId, organizationId),
      eq(rpmEnrollments.patientId, patientId),
      eq(rpmEnrollments.status, 'active'),
    ];

    if (programId) {
      conditions.push(eq(rpmEnrollments.programId, programId));
    }

    const enrollment = await drizzleDb
      .select()
      .from(rpmEnrollments)
      .where(and(...conditions))
      .orderBy(desc(rpmEnrollments.enrolledAt))
      .get() as any;

    return enrollment as RpmEnrollment || null;
  }

  /**
   * Update enrollment
   */
  async updateEnrollment(
    organizationId: string,
    enrollmentId: string,
    userId: string,
    data: Partial<CreateEnrollmentInput> & { status?: string; statusReason?: string; consentObtained?: boolean; consentDocumentUrl?: string }
  ): Promise<RpmEnrollment | null> {
    const existing = await this.getEnrollmentById(organizationId, enrollmentId);
    if (!existing) {
      return null;
    }

    const now = new Date();
    const updateData: any = { updatedAt: now };

    if (data.primaryPhysicianId !== undefined) updateData.primaryPhysicianId = data.primaryPhysicianId;
    if (data.careCoordinatorId !== undefined) updateData.careCoordinatorId = data.careCoordinatorId;
    if (data.customAlertThresholds !== undefined) updateData.customAlertThresholds = JSON.stringify(data.customAlertThresholds);
    if (data.customReadingFrequency !== undefined) updateData.customReadingFrequency = JSON.stringify(data.customReadingFrequency);
    if (data.patientGoals !== undefined) updateData.patientGoals = JSON.stringify(data.patientGoals);
    if (data.assignedDevices !== undefined) updateData.assignedDevices = JSON.stringify(data.assignedDevices);
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.status !== undefined && data.status !== existing.status) {
      updateData.status = data.status;
      updateData.statusReason = data.statusReason || null;
      updateData.statusChangedAt = now;
      updateData.statusChangedBy = userId;

      if (['completed', 'discontinued', 'expired'].includes(data.status)) {
        updateData.actualEndDate = now;
      }
    }

    if (data.consentObtained !== undefined) {
      updateData.consentObtained = data.consentObtained;
      if (data.consentObtained && !existing.consentDate) {
        updateData.consentDate = now;
      }
    }

    if (data.consentDocumentUrl !== undefined) {
      updateData.consentDocumentUrl = data.consentDocumentUrl;
    }

    await drizzleDb
      .update(rpmEnrollments)
      .set(updateData)
      .where(and(eq(rpmEnrollments.id, enrollmentId), eq(rpmEnrollments.organizationId, organizationId)));

    return this.getEnrollmentById(organizationId, enrollmentId);
  }

  /**
   * Pause enrollment
   */
  async pauseEnrollment(organizationId: string, enrollmentId: string, userId: string, reason: string): Promise<RpmEnrollment | null> {
    return this.updateEnrollment(organizationId, enrollmentId, userId, {
      status: 'paused',
      statusReason: reason,
    });
  }

  /**
   * Resume enrollment
   */
  async resumeEnrollment(organizationId: string, enrollmentId: string, userId: string): Promise<RpmEnrollment | null> {
    return this.updateEnrollment(organizationId, enrollmentId, userId, {
      status: 'active',
      statusReason: 'Resumed',
    });
  }

  /**
   * Complete enrollment
   */
  async completeEnrollment(organizationId: string, enrollmentId: string, userId: string, notes?: string): Promise<RpmEnrollment | null> {
    return this.updateEnrollment(organizationId, enrollmentId, userId, {
      status: 'completed',
      statusReason: 'Program completed successfully',
      notes,
    });
  }

  /**
   * Discontinue enrollment
   */
  async discontinueEnrollment(organizationId: string, enrollmentId: string, userId: string, reason: string): Promise<RpmEnrollment | null> {
    return this.updateEnrollment(organizationId, enrollmentId, userId, {
      status: 'discontinued',
      statusReason: reason,
    });
  }

  /**
   * Get enrollment count by program
   */
  async getEnrollmentCountsByProgram(organizationId: string): Promise<{ programId: string; programName: string; count: number }[]> {
    const results = await drizzleDb
      .select({
        programId: rpmEnrollments.programId,
        programName: rpmPrograms.programName,
        count: sql<number>`count(*)`,
      })
      .from(rpmEnrollments)
      .innerJoin(rpmPrograms, eq(rpmEnrollments.programId, rpmPrograms.id))
      .where(and(
        eq(rpmEnrollments.organizationId, organizationId),
        eq(rpmEnrollments.status, 'active')
      ))
      .groupBy(rpmEnrollments.programId, rpmPrograms.programName)
      .all();

    return results;
  }
}

export const programService = new ProgramService();
