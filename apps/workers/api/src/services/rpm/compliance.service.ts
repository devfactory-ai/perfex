/**
 * RPM Compliance Service
 * Calculate and track patient compliance with RPM programs
 */

import { eq, and, desc, between, sql, gte, lte } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import {
  rpmCompliance,
  rpmEnrollments,
  rpmPrograms,
  iotReadings,
  rpmTimeLogs,
  rpmBillingPeriods,
  rpmAlerts
} from '@perfex/database';

// Types
export interface ComplianceRecord {
  id: string;
  organizationId: string;
  patientId: string;
  enrollmentId: string;
  periodType: string;
  periodStart: Date;
  periodEnd: Date;
  expectedReadings: number;
  actualReadings: number;
  validReadings: number;
  compliancePercent: number;
  isCompliant: boolean;
  readingBreakdown: string | null;
  deviceUsageDays: number | null;
  averageReadingsPerDay: number | null;
  complianceTrend: string | null;
  previousPeriodPercent: number | null;
  meetsBillingRequirements: boolean | null;
  billingMinutesLogged: number | null;
  outreachAttempted: boolean;
  outreachDate: Date | null;
  outreachMethod: string | null;
  outreachNotes: string | null;
  calculatedAt: Date;
  createdAt: Date;
}

export interface TimeLogInput {
  patientId: string;
  enrollmentId: string;
  providerId: string;
  activityDate: string;
  durationMinutes: number;
  activityType: string;
  description?: string;
  relatedAlertId?: string;
  relatedReadingIds?: string[];
  isBillable?: boolean;
  notes?: string;
}

export interface BillingPeriodSummary {
  periodMonth: number;
  totalMinutesLogged: number;
  deviceSetupMinutes: number;
  monitoringMinutes: number;
  totalReadings: number;
  daysWithReadings: number;
  meetsTimeThreshold: boolean;
  meetsDataThreshold: boolean;
  isBillable: boolean;
  cptCodes: string[];
}

export class ComplianceService {
  // ============================================================================
  // COMPLIANCE CALCULATIONS
  // ============================================================================

  /**
   * Calculate compliance for an enrollment for a given period
   */
  async calculateCompliance(
    organizationId: string,
    enrollmentId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    periodStart: Date,
    periodEnd: Date
  ): Promise<ComplianceRecord> {
    const now = new Date();

    // Get enrollment and program details
    const enrollment = await drizzleDb
      .select()
      .from(rpmEnrollments)
      .where(and(
        eq(rpmEnrollments.id, enrollmentId),
        eq(rpmEnrollments.organizationId, organizationId)
      ))
      .get() as any;

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const program = await drizzleDb
      .select()
      .from(rpmPrograms)
      .where(eq(rpmPrograms.id, enrollment.programId))
      .get() as any;

    if (!program) {
      throw new Error('Program not found');
    }

    // Calculate expected readings
    const requiredReadingTypes = JSON.parse(program.requiredReadingTypes || '[]');
    const readingFrequency = enrollment.customReadingFrequency
      ? JSON.parse(enrollment.customReadingFrequency)
      : (program.readingFrequency ? JSON.parse(program.readingFrequency) : {});

    const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate expected readings based on frequency
    let expectedReadings = 0;
    for (const type of requiredReadingTypes) {
      const freq = readingFrequency[type] || 'daily';
      switch (freq) {
        case 'twice_daily':
          expectedReadings += daysInPeriod * 2;
          break;
        case 'daily':
          expectedReadings += daysInPeriod;
          break;
        case 'weekly':
          expectedReadings += Math.ceil(daysInPeriod / 7);
          break;
        default:
          expectedReadings += daysInPeriod; // Default to daily
      }
    }

    // Get actual readings
    const readings = await drizzleDb
      .select()
      .from(iotReadings)
      .where(and(
        eq(iotReadings.organizationId, organizationId),
        eq(iotReadings.patientId, enrollment.patientId),
        between(iotReadings.measuredAt, periodStart, periodEnd)
      ))
      .all() as any[];

    const actualReadings = readings.length;
    const validReadings = readings.filter(r => r.isValid).length;

    // Calculate compliance percentage
    const compliancePercent = expectedReadings > 0
      ? Math.min(100, (actualReadings / expectedReadings) * 100)
      : 100;

    const complianceTarget = enrollment.customAlertThresholds
      ? JSON.parse(enrollment.customAlertThresholds).complianceTarget || program.complianceTargetPercent
      : program.complianceTargetPercent;

    const isCompliant = compliancePercent >= complianceTarget;

    // Calculate reading breakdown by type
    const readingBreakdown: Record<string, { expected: number; actual: number; percent: number }> = {};
    for (const type of requiredReadingTypes) {
      const typeReadings = readings.filter(r => r.readingType === type);
      const freq = readingFrequency[type] || 'daily';
      let typeExpected = daysInPeriod;
      if (freq === 'twice_daily') typeExpected = daysInPeriod * 2;
      if (freq === 'weekly') typeExpected = Math.ceil(daysInPeriod / 7);

      readingBreakdown[type] = {
        expected: typeExpected,
        actual: typeReadings.length,
        percent: typeExpected > 0 ? (typeReadings.length / typeExpected) * 100 : 100,
      };
    }

    // Calculate device usage days
    const uniqueDays = new Set(
      readings.map(r => new Date(r.measuredAt).toISOString().split('T')[0])
    );
    const deviceUsageDays = uniqueDays.size;
    const averageReadingsPerDay = deviceUsageDays > 0 ? actualReadings / deviceUsageDays : 0;

    // Get previous period compliance for trend
    let previousPeriodPercent: number | null = null;
    let complianceTrend: 'improving' | 'stable' | 'declining' | null = null;

    const previousStart = new Date(periodStart);
    const previousEnd = new Date(periodEnd);
    const periodDuration = periodEnd.getTime() - periodStart.getTime();
    previousStart.setTime(previousStart.getTime() - periodDuration);
    previousEnd.setTime(previousEnd.getTime() - periodDuration);

    const previousCompliance = await drizzleDb
      .select()
      .from(rpmCompliance)
      .where(and(
        eq(rpmCompliance.enrollmentId, enrollmentId),
        eq(rpmCompliance.periodType, periodType),
        eq(rpmCompliance.periodStart, previousStart)
      ))
      .get() as any;

    if (previousCompliance) {
      previousPeriodPercent = previousCompliance.compliancePercent;
      const diff = compliancePercent - previousPeriodPercent;
      if (diff > 5) complianceTrend = 'improving';
      else if (diff < -5) complianceTrend = 'declining';
      else complianceTrend = 'stable';
    }

    // Get billing minutes for this period
    const timeLogs = await drizzleDb
      .select({ total: sql<number>`sum(${rpmTimeLogs.durationMinutes})` })
      .from(rpmTimeLogs)
      .where(and(
        eq(rpmTimeLogs.enrollmentId, enrollmentId),
        between(rpmTimeLogs.activityDate, periodStart, periodEnd),
        eq(rpmTimeLogs.isBillable, true)
      ))
      .get();

    const billingMinutesLogged = timeLogs?.total || 0;
    const meetsBillingRequirements = billingMinutesLogged >= 20 && deviceUsageDays >= 16;

    // Create or update compliance record
    const complianceId = crypto.randomUUID();

    await drizzleDb.insert(rpmCompliance).values({
      id: complianceId,
      organizationId,
      patientId: enrollment.patientId,
      enrollmentId,
      periodType: periodType as any,
      periodStart,
      periodEnd,
      expectedReadings,
      actualReadings,
      validReadings,
      compliancePercent,
      isCompliant,
      readingBreakdown: JSON.stringify(readingBreakdown),
      deviceUsageDays,
      averageReadingsPerDay,
      complianceTrend: complianceTrend as any,
      previousPeriodPercent,
      meetsBillingRequirements,
      billingMinutesLogged,
      outreachAttempted: false,
      outreachDate: null,
      outreachMethod: null,
      outreachNotes: null,
      calculatedAt: now,
      createdAt: now,
    });

    const record = await this.getComplianceById(organizationId, complianceId);
    return record!;
  }

  /**
   * Get compliance record by ID
   */
  async getComplianceById(organizationId: string, complianceId: string): Promise<ComplianceRecord | null> {
    const record = await drizzleDb
      .select()
      .from(rpmCompliance)
      .where(and(
        eq(rpmCompliance.id, complianceId),
        eq(rpmCompliance.organizationId, organizationId)
      ))
      .get() as any;

    return record as ComplianceRecord || null;
  }

  /**
   * Get compliance history for an enrollment
   */
  async getComplianceHistory(
    organizationId: string,
    enrollmentId: string,
    periodType?: 'daily' | 'weekly' | 'monthly',
    limit: number = 30
  ): Promise<ComplianceRecord[]> {
    const conditions = [
      eq(rpmCompliance.organizationId, organizationId),
      eq(rpmCompliance.enrollmentId, enrollmentId),
    ];

    if (periodType) {
      conditions.push(eq(rpmCompliance.periodType, periodType));
    }

    const records = await drizzleDb
      .select()
      .from(rpmCompliance)
      .where(and(...conditions))
      .orderBy(desc(rpmCompliance.periodStart))
      .limit(limit)
      .all() as any[];

    return records as ComplianceRecord[];
  }

  /**
   * Get non-compliant patients
   */
  async getNonCompliantPatients(
    organizationId: string,
    thresholdPercent: number = 80
  ): Promise<{ patientId: string; enrollmentId: string; latestCompliancePercent: number; trend: string | null }[]> {
    // Get latest compliance records for all active enrollments
    const results = await drizzleDb
      .select({
        patientId: rpmCompliance.patientId,
        enrollmentId: rpmCompliance.enrollmentId,
        compliancePercent: rpmCompliance.compliancePercent,
        complianceTrend: rpmCompliance.complianceTrend,
      })
      .from(rpmCompliance)
      .innerJoin(rpmEnrollments, eq(rpmCompliance.enrollmentId, rpmEnrollments.id))
      .where(and(
        eq(rpmCompliance.organizationId, organizationId),
        eq(rpmEnrollments.status, 'active'),
        sql`${rpmCompliance.compliancePercent} < ${thresholdPercent}`
      ))
      .orderBy(desc(rpmCompliance.calculatedAt))
      .all();

    // Deduplicate by enrollment (take latest)
    const seen = new Set<string>();
    const nonCompliant: { patientId: string; enrollmentId: string; latestCompliancePercent: number; trend: string | null }[] = [];

    for (const r of results) {
      if (!seen.has(r.enrollmentId)) {
        seen.add(r.enrollmentId);
        nonCompliant.push({
          patientId: r.patientId,
          enrollmentId: r.enrollmentId,
          latestCompliancePercent: r.compliancePercent,
          trend: r.complianceTrend,
        });
      }
    }

    return nonCompliant;
  }

  /**
   * Record patient outreach for compliance
   */
  async recordOutreach(
    organizationId: string,
    complianceId: string,
    method: string,
    notes?: string
  ): Promise<ComplianceRecord | null> {
    const existing = await this.getComplianceById(organizationId, complianceId);
    if (!existing) {
      return null;
    }

    await drizzleDb
      .update(rpmCompliance)
      .set({
        outreachAttempted: true,
        outreachDate: new Date(),
        outreachMethod: method,
        outreachNotes: notes || null,
      })
      .where(eq(rpmCompliance.id, complianceId));

    return this.getComplianceById(organizationId, complianceId);
  }

  // ============================================================================
  // TIME TRACKING
  // ============================================================================

  /**
   * Log provider time spent on RPM activities
   */
  async logTime(organizationId: string, userId: string, data: TimeLogInput): Promise<any> {
    const now = new Date();
    const timeLogId = crypto.randomUUID();

    await drizzleDb.insert(rpmTimeLogs).values({
      id: timeLogId,
      organizationId,
      patientId: data.patientId,
      enrollmentId: data.enrollmentId,
      providerId: data.providerId,
      activityDate: new Date(data.activityDate),
      durationMinutes: data.durationMinutes,
      activityType: data.activityType as any,
      description: data.description || null,
      relatedAlertId: data.relatedAlertId || null,
      relatedReadingIds: data.relatedReadingIds ? JSON.stringify(data.relatedReadingIds) : null,
      isBillable: data.isBillable !== false,
      billedAt: null,
      billingPeriodId: null,
      notes: data.notes || null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return drizzleDb
      .select()
      .from(rpmTimeLogs)
      .where(eq(rpmTimeLogs.id, timeLogId))
      .get();
  }

  /**
   * Get time logs for an enrollment
   */
  async getTimeLogs(
    organizationId: string,
    enrollmentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    const conditions = [
      eq(rpmTimeLogs.organizationId, organizationId),
      eq(rpmTimeLogs.enrollmentId, enrollmentId),
    ];

    if (startDate && endDate) {
      conditions.push(between(rpmTimeLogs.activityDate, startDate, endDate));
    }

    const logs = await drizzleDb
      .select()
      .from(rpmTimeLogs)
      .where(and(...conditions))
      .orderBy(desc(rpmTimeLogs.activityDate))
      .all();

    return logs;
  }

  /**
   * Get total time logged for an enrollment in a period
   */
  async getTotalTimeLogged(
    organizationId: string,
    enrollmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ total: number; billable: number; byType: Record<string, number> }> {
    const logs = await drizzleDb
      .select()
      .from(rpmTimeLogs)
      .where(and(
        eq(rpmTimeLogs.organizationId, organizationId),
        eq(rpmTimeLogs.enrollmentId, enrollmentId),
        between(rpmTimeLogs.activityDate, startDate, endDate)
      ))
      .all() as any[];

    const total = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
    const billable = logs
      .filter(log => log.isBillable)
      .reduce((sum, log) => sum + log.durationMinutes, 0);

    const byType: Record<string, number> = {};
    for (const log of logs) {
      byType[log.activityType] = (byType[log.activityType] || 0) + log.durationMinutes;
    }

    return { total, billable, byType };
  }

  // ============================================================================
  // BILLING PERIODS
  // ============================================================================

  /**
   * Calculate and create billing period for an enrollment
   */
  async calculateBillingPeriod(
    organizationId: string,
    enrollmentId: string,
    periodMonth: number // YYYYMM format
  ): Promise<BillingPeriodSummary> {
    const year = Math.floor(periodMonth / 100);
    const month = periodMonth % 100;
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);

    // Get enrollment
    const enrollment = await drizzleDb
      .select()
      .from(rpmEnrollments)
      .where(eq(rpmEnrollments.id, enrollmentId))
      .get() as any;

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Get time logs
    const timeLogs = await drizzleDb
      .select()
      .from(rpmTimeLogs)
      .where(and(
        eq(rpmTimeLogs.enrollmentId, enrollmentId),
        between(rpmTimeLogs.activityDate, periodStart, periodEnd)
      ))
      .all() as any[];

    const totalMinutesLogged = timeLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
    const deviceSetupMinutes = timeLogs
      .filter(log => log.activityType === 'device_setup')
      .reduce((sum, log) => sum + log.durationMinutes, 0);
    const monitoringMinutes = timeLogs
      .filter(log => log.activityType !== 'device_setup')
      .reduce((sum, log) => sum + log.durationMinutes, 0);

    // Get readings
    const readings = await drizzleDb
      .select()
      .from(iotReadings)
      .where(and(
        eq(iotReadings.patientId, enrollment.patientId),
        between(iotReadings.measuredAt, periodStart, periodEnd)
      ))
      .all() as any[];

    const totalReadings = readings.length;
    const uniqueDays = new Set(
      readings.map(r => new Date(r.measuredAt).toISOString().split('T')[0])
    );
    const daysWithReadings = uniqueDays.size;

    // Check thresholds
    const meetsTimeThreshold = totalMinutesLogged >= 20;
    const meetsDataThreshold = daysWithReadings >= 16;
    const isBillable = meetsTimeThreshold && meetsDataThreshold;

    // Determine CPT codes
    const cptCodes: string[] = [];
    if (isBillable) {
      cptCodes.push('99453'); // Initial setup
      cptCodes.push('99454'); // Device supply
      if (totalMinutesLogged >= 20) cptCodes.push('99457'); // First 20 min
      if (totalMinutesLogged >= 40) cptCodes.push('99458'); // Additional 20 min
    }

    // Create or update billing period
    const existingPeriod = await drizzleDb
      .select()
      .from(rpmBillingPeriods)
      .where(and(
        eq(rpmBillingPeriods.enrollmentId, enrollmentId),
        eq(rpmBillingPeriods.periodMonth, periodMonth)
      ))
      .get();

    const billingData = {
      organizationId,
      patientId: enrollment.patientId,
      enrollmentId,
      periodMonth,
      periodStart,
      periodEnd,
      totalMinutesLogged,
      deviceSetupMinutes,
      monitoringMinutes,
      totalReadings,
      daysWithReadings,
      meetsTimeThreshold,
      meetsDataThreshold,
      isBillable,
      cptCodes: JSON.stringify(cptCodes),
      status: isBillable ? 'ready_to_bill' : 'pending',
      updatedAt: new Date(),
    };

    if (existingPeriod) {
      await drizzleDb
        .update(rpmBillingPeriods)
        .set(billingData)
        .where(eq(rpmBillingPeriods.id, existingPeriod.id));
    } else {
      await drizzleDb.insert(rpmBillingPeriods).values({
        id: crypto.randomUUID(),
        ...billingData,
        billedAmount: null,
        billedAt: null,
        claimNumber: null,
        paidAmount: null,
        paidAt: null,
        denialReason: null,
        notes: null,
        createdAt: new Date(),
      } as any);
    }

    return {
      periodMonth,
      totalMinutesLogged,
      deviceSetupMinutes,
      monitoringMinutes,
      totalReadings,
      daysWithReadings,
      meetsTimeThreshold,
      meetsDataThreshold,
      isBillable,
      cptCodes,
    };
  }

  /**
   * Get billing periods for an enrollment
   */
  async getBillingPeriods(organizationId: string, enrollmentId: string): Promise<any[]> {
    const periods = await drizzleDb
      .select()
      .from(rpmBillingPeriods)
      .where(and(
        eq(rpmBillingPeriods.organizationId, organizationId),
        eq(rpmBillingPeriods.enrollmentId, enrollmentId)
      ))
      .orderBy(desc(rpmBillingPeriods.periodMonth))
      .all();

    return periods;
  }

  /**
   * Mark billing period as billed
   */
  async markBilled(
    organizationId: string,
    billingPeriodId: string,
    claimNumber: string,
    billedAmount: number
  ): Promise<any> {
    const now = new Date();

    await drizzleDb
      .update(rpmBillingPeriods)
      .set({
        status: 'billed',
        claimNumber,
        billedAmount,
        billedAt: now,
        updatedAt: now,
      })
      .where(and(
        eq(rpmBillingPeriods.id, billingPeriodId),
        eq(rpmBillingPeriods.organizationId, organizationId)
      ));

    return drizzleDb
      .select()
      .from(rpmBillingPeriods)
      .where(eq(rpmBillingPeriods.id, billingPeriodId))
      .get();
  }

  /**
   * Record payment for billing period
   */
  async recordPayment(
    organizationId: string,
    billingPeriodId: string,
    paidAmount: number
  ): Promise<any> {
    const now = new Date();

    await drizzleDb
      .update(rpmBillingPeriods)
      .set({
        status: 'paid',
        paidAmount,
        paidAt: now,
        updatedAt: now,
      })
      .where(and(
        eq(rpmBillingPeriods.id, billingPeriodId),
        eq(rpmBillingPeriods.organizationId, organizationId)
      ));

    return drizzleDb
      .select()
      .from(rpmBillingPeriods)
      .where(eq(rpmBillingPeriods.id, billingPeriodId))
      .get();
  }

  /**
   * Get organization-wide compliance summary
   */
  async getOrganizationComplianceSummary(organizationId: string): Promise<{
    totalActiveEnrollments: number;
    compliantCount: number;
    nonCompliantCount: number;
    averageCompliance: number;
    billingReadyCount: number;
  }> {
    // Count active enrollments
    const enrollmentCount = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(rpmEnrollments)
      .where(and(
        eq(rpmEnrollments.organizationId, organizationId),
        eq(rpmEnrollments.status, 'active')
      ))
      .get();

    const totalActiveEnrollments = enrollmentCount?.count || 0;

    // Get latest compliance for each enrollment
    const complianceStats = await drizzleDb
      .select({
        avgCompliance: sql<number>`avg(${rpmCompliance.compliancePercent})`,
        compliantCount: sql<number>`sum(case when ${rpmCompliance.isCompliant} = 1 then 1 else 0 end)`,
        nonCompliantCount: sql<number>`sum(case when ${rpmCompliance.isCompliant} = 0 then 1 else 0 end)`,
      })
      .from(rpmCompliance)
      .innerJoin(rpmEnrollments, eq(rpmCompliance.enrollmentId, rpmEnrollments.id))
      .where(and(
        eq(rpmCompliance.organizationId, organizationId),
        eq(rpmEnrollments.status, 'active')
      ))
      .get();

    // Count billing-ready periods for current month
    const currentMonth = parseInt(new Date().toISOString().slice(0, 7).replace('-', ''));
    const billingReady = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(rpmBillingPeriods)
      .where(and(
        eq(rpmBillingPeriods.organizationId, organizationId),
        eq(rpmBillingPeriods.periodMonth, currentMonth),
        eq(rpmBillingPeriods.isBillable, true)
      ))
      .get();

    return {
      totalActiveEnrollments,
      compliantCount: complianceStats?.compliantCount || 0,
      nonCompliantCount: complianceStats?.nonCompliantCount || 0,
      averageCompliance: complianceStats?.avgCompliance || 0,
      billingReadyCount: billingReady?.count || 0,
    };
  }
}

export const complianceService = new ComplianceService();
