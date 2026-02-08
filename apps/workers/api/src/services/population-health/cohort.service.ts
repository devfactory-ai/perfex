/**
 * Cohort Service
 * Population cohort management and analysis
 */

import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import { getDb } from '../../db';
import {
  populationCohorts,
  cohortMembership,
  cohortSnapshots,
  healthcarePatients,
} from '@perfex/database/schema';

export interface CreateCohortInput {
  cohortCode: string;
  cohortName: string;
  description?: string;
  cohortType: 'disease_based' | 'risk_based' | 'demographic' | 'treatment_based' | 'outcome_based' | 'geographic' | 'care_gap' | 'custom';
  associatedModule?: 'dialyse' | 'cardiology' | 'ophthalmology' | 'all';
  criteria: any;
  inclusionCriteria?: any;
  exclusionCriteria?: any;
  autoRefresh?: boolean;
  refreshFrequency?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
}

export class CohortService {
  /**
   * Create a new cohort
   */
  static async create(
    env: Env,
    organizationId: string,
    userId: string,
    input: CreateCohortInput
  ) {
    const db = getDb(env);

    const [cohort] = await db
      .insert(populationCohorts)
      .values({
        organizationId,
        cohortCode: input.cohortCode,
        cohortName: input.cohortName,
        description: input.description,
        cohortType: input.cohortType,
        associatedModule: input.associatedModule,
        criteria: JSON.stringify(input.criteria),
        inclusionCriteria: input.inclusionCriteria ? JSON.stringify(input.inclusionCriteria) : null,
        exclusionCriteria: input.exclusionCriteria ? JSON.stringify(input.exclusionCriteria) : null,
        autoRefresh: input.autoRefresh ?? true,
        refreshFrequency: input.refreshFrequency || 'daily',
        isActive: true,
        createdBy: userId,
      })
      .returning();

    return cohort;
  }

  /**
   * Get cohort by ID
   */
  static async getById(env: Env, organizationId: string, id: string) {
    const db = getDb(env);

    const [cohort] = await db
      .select()
      .from(populationCohorts)
      .where(
        and(
          eq(populationCohorts.id, id),
          eq(populationCohorts.organizationId, organizationId)
        )
      );

    return cohort || null;
  }

  /**
   * List cohorts
   */
  static async list(
    env: Env,
    organizationId: string,
    cohortType?: string,
    module?: string,
    page = 1,
    limit = 20
  ) {
    const db = getDb(env);
    const offset = (page - 1) * limit;

    const conditions = [
      eq(populationCohorts.organizationId, organizationId),
      eq(populationCohorts.isActive, true),
    ];

    if (cohortType) {
      conditions.push(eq(populationCohorts.cohortType, cohortType as any));
    }

    if (module) {
      conditions.push(eq(populationCohorts.associatedModule, module as any));
    }

    const cohorts = await db
      .select()
      .from(populationCohorts)
      .where(and(...conditions))
      .orderBy(desc(populationCohorts.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(populationCohorts)
      .where(and(...conditions));

    return {
      data: cohorts,
      pagination: {
        page,
        limit,
        total: countResult?.count || 0,
        totalPages: Math.ceil((countResult?.count || 0) / limit),
      },
    };
  }

  /**
   * Update cohort
   */
  static async update(
    env: Env,
    organizationId: string,
    id: string,
    updates: Partial<CreateCohortInput>
  ) {
    const db = getDb(env);

    const updateData: any = { updatedAt: new Date() };

    if (updates.cohortName) updateData.cohortName = updates.cohortName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.criteria) updateData.criteria = JSON.stringify(updates.criteria);
    if (updates.inclusionCriteria) updateData.inclusionCriteria = JSON.stringify(updates.inclusionCriteria);
    if (updates.exclusionCriteria) updateData.exclusionCriteria = JSON.stringify(updates.exclusionCriteria);
    if (updates.autoRefresh !== undefined) updateData.autoRefresh = updates.autoRefresh;
    if (updates.refreshFrequency) updateData.refreshFrequency = updates.refreshFrequency;

    const [cohort] = await db
      .update(populationCohorts)
      .set(updateData)
      .where(
        and(
          eq(populationCohorts.id, id),
          eq(populationCohorts.organizationId, organizationId)
        )
      )
      .returning();

    return cohort;
  }

  /**
   * Refresh cohort membership based on criteria
   */
  static async refreshCohort(
    env: Env,
    organizationId: string,
    cohortId: string
  ) {
    const db = getDb(env);

    const cohort = await this.getById(env, organizationId, cohortId);
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    const criteria = JSON.parse(cohort.criteria);

    // Build patient query based on criteria
    // This is a simplified example - real implementation would be more complex
    const conditions = [eq(healthcarePatients.organizationId, organizationId)];

    // Apply basic criteria filters
    if (criteria.minAge) {
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - criteria.minAge);
      conditions.push(lte(healthcarePatients.dateOfBirth, maxBirthDate));
    }

    if (criteria.maxAge) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - criteria.maxAge);
      conditions.push(gte(healthcarePatients.dateOfBirth, minBirthDate));
    }

    if (criteria.gender) {
      conditions.push(eq(healthcarePatients.gender, criteria.gender));
    }

    if (criteria.status) {
      conditions.push(eq(healthcarePatients.status, criteria.status));
    }

    // Get matching patients
    const matchingPatients = await db
      .select({ id: healthcarePatients.id })
      .from(healthcarePatients)
      .where(and(...conditions));

    const matchingPatientIds = matchingPatients.map(p => p.id);

    // Get current members
    const currentMembers = await db
      .select({ patientId: cohortMembership.patientId })
      .from(cohortMembership)
      .where(
        and(
          eq(cohortMembership.cohortId, cohortId),
          eq(cohortMembership.isActive, true)
        )
      );

    const currentMemberIds = new Set(currentMembers.map(m => m.patientId));
    const newMemberIds = new Set(matchingPatientIds);

    // Patients to add
    const toAdd = matchingPatientIds.filter(id => !currentMemberIds.has(id));

    // Patients to remove
    const toRemove = currentMembers
      .filter(m => !newMemberIds.has(m.patientId))
      .map(m => m.patientId);

    // Add new members
    if (toAdd.length > 0) {
      await db.insert(cohortMembership).values(
        toAdd.map(patientId => ({
          organizationId,
          cohortId,
          patientId,
          addedBy: 'system',
          isActive: true,
        }))
      );
    }

    // Remove members
    if (toRemove.length > 0) {
      await db
        .update(cohortMembership)
        .set({
          isActive: false,
          removedAt: new Date(),
          removalReason: 'No longer meets criteria',
        })
        .where(
          and(
            eq(cohortMembership.cohortId, cohortId),
            inArray(cohortMembership.patientId, toRemove)
          )
        );
    }

    // Update cohort stats
    const finalCount = matchingPatientIds.length;

    await db
      .update(populationCohorts)
      .set({
        patientCount: finalCount,
        lastPatientCountUpdate: new Date(),
        lastRefresh: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(populationCohorts.id, cohortId));

    return {
      added: toAdd.length,
      removed: toRemove.length,
      total: finalCount,
    };
  }

  /**
   * Get cohort members
   */
  static async getMembers(
    env: Env,
    organizationId: string,
    cohortId: string,
    page = 1,
    limit = 50
  ) {
    const db = getDb(env);
    const offset = (page - 1) * limit;

    const members = await db
      .select({
        membership: cohortMembership,
        patient: healthcarePatients,
      })
      .from(cohortMembership)
      .innerJoin(healthcarePatients, eq(cohortMembership.patientId, healthcarePatients.id))
      .where(
        and(
          eq(cohortMembership.cohortId, cohortId),
          eq(cohortMembership.organizationId, organizationId),
          eq(cohortMembership.isActive, true)
        )
      )
      .orderBy(desc(cohortMembership.addedAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cohortMembership)
      .where(
        and(
          eq(cohortMembership.cohortId, cohortId),
          eq(cohortMembership.isActive, true)
        )
      );

    return {
      data: members,
      pagination: {
        page,
        limit,
        total: countResult?.count || 0,
        totalPages: Math.ceil((countResult?.count || 0) / limit),
      },
    };
  }

  /**
   * Add patient to cohort manually
   */
  static async addMember(
    env: Env,
    organizationId: string,
    cohortId: string,
    patientId: string,
    userId: string
  ) {
    const db = getDb(env);

    // Check if already a member
    const [existing] = await db
      .select()
      .from(cohortMembership)
      .where(
        and(
          eq(cohortMembership.cohortId, cohortId),
          eq(cohortMembership.patientId, patientId),
          eq(cohortMembership.isActive, true)
        )
      );

    if (existing) {
      return existing;
    }

    const [membership] = await db
      .insert(cohortMembership)
      .values({
        organizationId,
        cohortId,
        patientId,
        addedBy: 'manual',
        addedByUserId: userId,
        isActive: true,
      })
      .returning();

    // Update patient count
    await db
      .update(populationCohorts)
      .set({
        patientCount: sql`${populationCohorts.patientCount} + 1`,
        lastPatientCountUpdate: new Date(),
      })
      .where(eq(populationCohorts.id, cohortId));

    return membership;
  }

  /**
   * Remove patient from cohort
   */
  static async removeMember(
    env: Env,
    organizationId: string,
    cohortId: string,
    patientId: string,
    reason?: string
  ) {
    const db = getDb(env);

    await db
      .update(cohortMembership)
      .set({
        isActive: false,
        removedAt: new Date(),
        removalReason: reason || 'Manually removed',
      })
      .where(
        and(
          eq(cohortMembership.cohortId, cohortId),
          eq(cohortMembership.patientId, patientId)
        )
      );

    // Update patient count
    await db
      .update(populationCohorts)
      .set({
        patientCount: sql`MAX(0, ${populationCohorts.patientCount} - 1)`,
        lastPatientCountUpdate: new Date(),
      })
      .where(eq(populationCohorts.id, cohortId));

    return { success: true };
  }

  /**
   * Create cohort snapshot
   */
  static async createSnapshot(
    env: Env,
    organizationId: string,
    cohortId: string,
    snapshotType: 'scheduled' | 'manual' | 'triggered' = 'manual'
  ) {
    const db = getDb(env);

    // Get current cohort stats
    const cohort = await this.getById(env, organizationId, cohortId);
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    // Get member IDs
    const members = await db
      .select({ patientId: cohortMembership.patientId })
      .from(cohortMembership)
      .where(
        and(
          eq(cohortMembership.cohortId, cohortId),
          eq(cohortMembership.isActive, true)
        )
      );

    // Get previous snapshot for comparison
    const [previousSnapshot] = await db
      .select()
      .from(cohortSnapshots)
      .where(eq(cohortSnapshots.cohortId, cohortId))
      .orderBy(desc(cohortSnapshots.snapshotDate))
      .limit(1);

    const previousMemberIds = previousSnapshot?.patientIds
      ? JSON.parse(previousSnapshot.patientIds)
      : [];

    const currentMemberIds = members.map(m => m.patientId);
    const previousSet = new Set(previousMemberIds);
    const currentSet = new Set(currentMemberIds);

    const newPatients = currentMemberIds.filter(id => !previousSet.has(id)).length;
    const removedPatients = previousMemberIds.filter((id: string) => !currentSet.has(id)).length;

    const [snapshot] = await db
      .insert(cohortSnapshots)
      .values({
        organizationId,
        cohortId,
        snapshotDate: new Date(),
        snapshotType,
        patientCount: members.length,
        newPatients,
        removedPatients,
        avgRiskScore: cohort.avgRiskScore,
        patientIds: JSON.stringify(currentMemberIds),
      })
      .returning();

    return snapshot;
  }

  /**
   * Get cohort snapshots
   */
  static async getSnapshots(
    env: Env,
    organizationId: string,
    cohortId: string,
    limit = 20
  ) {
    const db = getDb(env);

    const snapshots = await db
      .select()
      .from(cohortSnapshots)
      .where(
        and(
          eq(cohortSnapshots.cohortId, cohortId),
          eq(cohortSnapshots.organizationId, organizationId)
        )
      )
      .orderBy(desc(cohortSnapshots.snapshotDate))
      .limit(limit);

    return snapshots;
  }

  /**
   * Get patient cohorts
   */
  static async getPatientCohorts(
    env: Env,
    organizationId: string,
    patientId: string
  ) {
    const db = getDb(env);

    const memberships = await db
      .select({
        membership: cohortMembership,
        cohort: populationCohorts,
      })
      .from(cohortMembership)
      .innerJoin(populationCohorts, eq(cohortMembership.cohortId, populationCohorts.id))
      .where(
        and(
          eq(cohortMembership.patientId, patientId),
          eq(cohortMembership.organizationId, organizationId),
          eq(cohortMembership.isActive, true)
        )
      )
      .orderBy(desc(cohortMembership.addedAt));

    return memberships;
  }
}

export default CohortService;
