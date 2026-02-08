/**
 * RPM Reading Service
 * Manage patient readings from IoT devices
 */

import { eq, and, desc, asc, between, sql, gte, lte } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import { iotReadings, iotDevices, rpmAlerts, rpmEnrollments, rpmAlertRules } from '@perfex/database';

// Types
export interface CreateReadingInput {
  deviceId?: string;
  programId?: string;
  readingType: string;
  measuredAt: string;
  primaryValue: number;
  primaryUnit: string;
  secondaryValue?: number;
  secondaryUnit?: string;
  tertiaryValue?: number;
  tertiaryUnit?: string;
  readingData?: string;
  context?: string;
  bodyPosition?: string;
  activityLevel?: string;
  qualityScore?: number;
  entryMethod: string;
  patientNotes?: string;
  symptoms?: string[];
}

export interface ReadingListOptions {
  patientId: string;
  readingType?: string;
  deviceId?: string;
  programId?: string;
  startDate?: string;
  endDate?: string;
  isValid?: boolean;
  triggeredAlert?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReadingStats {
  readingType: string;
  count: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  lastReading: Date;
  withinRangePercent: number;
}

export interface IotReading {
  id: string;
  organizationId: string;
  patientId: string;
  deviceId: string | null;
  programId: string | null;
  readingNumber: string;
  readingType: string;
  measuredAt: Date;
  receivedAt: Date;
  primaryValue: number;
  primaryUnit: string;
  secondaryValue: number | null;
  secondaryUnit: string | null;
  tertiaryValue: number | null;
  tertiaryUnit: string | null;
  readingData: string | null;
  context: string | null;
  bodyPosition: string | null;
  activityLevel: string | null;
  qualityScore: number | null;
  isValid: boolean;
  invalidReason: string | null;
  triggeredAlert: boolean;
  alertId: string | null;
  isWithinRange: boolean | null;
  deviationPercent: number | null;
  entryMethod: string;
  patientNotes: string | null;
  symptoms: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ReadingService {
  /**
   * Create a new reading
   */
  async create(organizationId: string, patientId: string, data: CreateReadingInput): Promise<IotReading> {
    const now = new Date();
    const readingId = crypto.randomUUID();

    // Generate reading number
    const countResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(iotReadings)
      .where(eq(iotReadings.organizationId, organizationId))
      .get();
    const readingNumber = `RDG-${String((countResult?.count || 0) + 1).padStart(8, '0')}`;

    // Check if reading is within normal range
    const rangeCheck = await this.checkReadingRange(organizationId, patientId, data.readingType, data.primaryValue);

    await drizzleDb.insert(iotReadings).values({
      id: readingId,
      organizationId,
      patientId,
      deviceId: data.deviceId || null,
      programId: data.programId || null,
      readingNumber,
      readingType: data.readingType as any,
      measuredAt: new Date(data.measuredAt),
      receivedAt: now,
      primaryValue: data.primaryValue,
      primaryUnit: data.primaryUnit,
      secondaryValue: data.secondaryValue || null,
      secondaryUnit: data.secondaryUnit || null,
      tertiaryValue: data.tertiaryValue || null,
      tertiaryUnit: data.tertiaryUnit || null,
      readingData: data.readingData || null,
      context: data.context as any || null,
      bodyPosition: data.bodyPosition as any || null,
      activityLevel: data.activityLevel as any || null,
      qualityScore: data.qualityScore || null,
      isValid: true,
      invalidReason: null,
      triggeredAlert: false,
      alertId: null,
      isWithinRange: rangeCheck.isWithinRange,
      deviationPercent: rangeCheck.deviationPercent,
      entryMethod: data.entryMethod as any,
      patientNotes: data.patientNotes || null,
      symptoms: data.symptoms ? JSON.stringify(data.symptoms) : null,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: now,
      updatedAt: now,
    });

    // Check for alerts
    const reading = await this.getById(organizationId, readingId);
    if (reading) {
      await this.checkAndTriggerAlerts(organizationId, patientId, reading);
    }

    return reading!;
  }

  /**
   * Get reading by ID
   */
  async getById(organizationId: string, readingId: string): Promise<IotReading | null> {
    const reading = await drizzleDb
      .select()
      .from(iotReadings)
      .where(and(eq(iotReadings.id, readingId), eq(iotReadings.organizationId, organizationId)))
      .get() as any;

    return reading as IotReading || null;
  }

  /**
   * List readings for a patient
   */
  async list(organizationId: string, options: ReadingListOptions): Promise<{ readings: IotReading[]; total: number }> {
    const { patientId, readingType, deviceId, programId, startDate, endDate, isValid, triggeredAlert, page = 1, limit = 50, sortBy = 'measuredAt', sortOrder = 'desc' } = options;

    // Build where conditions
    const conditions = [
      eq(iotReadings.organizationId, organizationId),
      eq(iotReadings.patientId, patientId),
    ];

    if (readingType) {
      conditions.push(eq(iotReadings.readingType, readingType as any));
    }

    if (deviceId) {
      conditions.push(eq(iotReadings.deviceId, deviceId));
    }

    if (programId) {
      conditions.push(eq(iotReadings.programId, programId));
    }

    if (startDate && endDate) {
      conditions.push(between(iotReadings.measuredAt, new Date(startDate), new Date(endDate)));
    } else if (startDate) {
      conditions.push(gte(iotReadings.measuredAt, new Date(startDate)));
    } else if (endDate) {
      conditions.push(lte(iotReadings.measuredAt, new Date(endDate)));
    }

    if (isValid !== undefined) {
      conditions.push(eq(iotReadings.isValid, isValid));
    }

    if (triggeredAlert !== undefined) {
      conditions.push(eq(iotReadings.triggeredAlert, triggeredAlert));
    }

    // Count total
    const countResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(iotReadings)
      .where(and(...conditions))
      .get();

    const total = countResult?.count || 0;

    // Get paginated results
    const offset = (page - 1) * limit;
    const orderColumn = iotReadings[sortBy as keyof typeof iotReadings] || iotReadings.measuredAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const readings = await drizzleDb
      .select()
      .from(iotReadings)
      .where(and(...conditions))
      .orderBy(orderFn(orderColumn as any))
      .limit(limit)
      .offset(offset)
      .all() as any[];

    return { readings: readings as IotReading[], total };
  }

  /**
   * Get latest readings by type for a patient
   */
  async getLatestByType(organizationId: string, patientId: string, readingTypes?: string[]): Promise<IotReading[]> {
    const types = readingTypes || [
      'blood_pressure', 'blood_glucose', 'oxygen_saturation', 'weight',
      'temperature', 'heart_rate', 'respiratory_rate'
    ];

    const latestReadings: IotReading[] = [];

    for (const type of types) {
      const reading = await drizzleDb
        .select()
        .from(iotReadings)
        .where(and(
          eq(iotReadings.organizationId, organizationId),
          eq(iotReadings.patientId, patientId),
          eq(iotReadings.readingType, type as any),
          eq(iotReadings.isValid, true)
        ))
        .orderBy(desc(iotReadings.measuredAt))
        .limit(1)
        .get() as any;

      if (reading) {
        latestReadings.push(reading as IotReading);
      }
    }

    return latestReadings;
  }

  /**
   * Get reading statistics for a patient
   */
  async getStats(organizationId: string, patientId: string, startDate: Date, endDate: Date): Promise<ReadingStats[]> {
    const stats: ReadingStats[] = [];

    const types = [
      'blood_pressure', 'blood_glucose', 'oxygen_saturation', 'weight',
      'temperature', 'heart_rate', 'respiratory_rate'
    ];

    for (const type of types) {
      const result = await drizzleDb
        .select({
          count: sql<number>`count(*)`,
          avgValue: sql<number>`avg(${iotReadings.primaryValue})`,
          minValue: sql<number>`min(${iotReadings.primaryValue})`,
          maxValue: sql<number>`max(${iotReadings.primaryValue})`,
          lastReading: sql<number>`max(${iotReadings.measuredAt})`,
          withinRangeCount: sql<number>`sum(case when ${iotReadings.isWithinRange} = 1 then 1 else 0 end)`,
        })
        .from(iotReadings)
        .where(and(
          eq(iotReadings.organizationId, organizationId),
          eq(iotReadings.patientId, patientId),
          eq(iotReadings.readingType, type as any),
          eq(iotReadings.isValid, true),
          between(iotReadings.measuredAt, startDate, endDate)
        ))
        .get();

      if (result && result.count > 0) {
        stats.push({
          readingType: type,
          count: result.count,
          avgValue: result.avgValue,
          minValue: result.minValue,
          maxValue: result.maxValue,
          lastReading: new Date(result.lastReading),
          withinRangePercent: (result.withinRangeCount / result.count) * 100,
        });
      }
    }

    return stats;
  }

  /**
   * Mark reading as invalid
   */
  async markInvalid(organizationId: string, readingId: string, userId: string, reason: string): Promise<IotReading | null> {
    const reading = await this.getById(organizationId, readingId);
    if (!reading) {
      return null;
    }

    await drizzleDb
      .update(iotReadings)
      .set({
        isValid: false,
        invalidReason: reason,
        reviewedBy: userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(iotReadings.id, readingId), eq(iotReadings.organizationId, organizationId)));

    return this.getById(organizationId, readingId);
  }

  /**
   * Review reading
   */
  async review(organizationId: string, readingId: string, userId: string, notes?: string): Promise<IotReading | null> {
    const reading = await this.getById(organizationId, readingId);
    if (!reading) {
      return null;
    }

    await drizzleDb
      .update(iotReadings)
      .set({
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
        updatedAt: new Date(),
      })
      .where(and(eq(iotReadings.id, readingId), eq(iotReadings.organizationId, organizationId)));

    return this.getById(organizationId, readingId);
  }

  /**
   * Check if reading is within normal range
   */
  async checkReadingRange(
    organizationId: string,
    patientId: string,
    readingType: string,
    value: number
  ): Promise<{ isWithinRange: boolean; deviationPercent: number | null }> {
    // Get patient-specific or program thresholds
    const enrollment = await drizzleDb
      .select()
      .from(rpmEnrollments)
      .where(and(
        eq(rpmEnrollments.organizationId, organizationId),
        eq(rpmEnrollments.patientId, patientId),
        eq(rpmEnrollments.status, 'active')
      ))
      .get() as any;

    // Default thresholds
    const defaultRanges: Record<string, { min: number; max: number; target?: number }> = {
      blood_pressure: { min: 90, max: 140, target: 120 }, // Systolic
      blood_glucose: { min: 70, max: 180, target: 100 }, // Fasting
      oxygen_saturation: { min: 95, max: 100, target: 98 },
      weight: { min: 0, max: 500 }, // No default target
      temperature: { min: 36.1, max: 37.2, target: 36.6 },
      heart_rate: { min: 60, max: 100, target: 70 },
      respiratory_rate: { min: 12, max: 20, target: 16 },
    };

    // Try to get custom thresholds from enrollment
    let range = defaultRanges[readingType];

    if (enrollment?.customAlertThresholds) {
      try {
        const custom = JSON.parse(enrollment.customAlertThresholds);
        if (custom[readingType]) {
          range = { ...range, ...custom[readingType] };
        }
      } catch (e) {
        // Use default
      }
    }

    if (!range) {
      return { isWithinRange: true, deviationPercent: null };
    }

    const isWithinRange = value >= range.min && value <= range.max;
    let deviationPercent: number | null = null;

    if (range.target) {
      deviationPercent = ((value - range.target) / range.target) * 100;
    } else {
      const midpoint = (range.min + range.max) / 2;
      deviationPercent = ((value - midpoint) / midpoint) * 100;
    }

    return { isWithinRange, deviationPercent };
  }

  /**
   * Check and trigger alerts based on reading
   */
  async checkAndTriggerAlerts(organizationId: string, patientId: string, reading: IotReading): Promise<void> {
    // Get applicable alert rules
    const rules = await drizzleDb
      .select()
      .from(rpmAlertRules)
      .where(and(
        eq(rpmAlertRules.organizationId, organizationId),
        eq(rpmAlertRules.readingType, reading.readingType),
        eq(rpmAlertRules.isActive, true)
      ))
      .all() as any[];

    for (const rule of rules) {
      // Check if rule applies to this patient
      if (rule.patientId && rule.patientId !== patientId) {
        continue;
      }

      // Check if reading triggers the rule
      let shouldAlert = false;
      let thresholdDirection: 'above' | 'below' | 'outside_range' = 'above';

      switch (rule.ruleType) {
        case 'threshold_high':
          if (reading.primaryValue > rule.thresholdValue) {
            shouldAlert = true;
            thresholdDirection = 'above';
          }
          break;

        case 'threshold_low':
          if (reading.primaryValue < rule.thresholdValue) {
            shouldAlert = true;
            thresholdDirection = 'below';
          }
          break;

        case 'range':
          if (reading.primaryValue < rule.thresholdValue || reading.primaryValue > rule.thresholdValueSecondary) {
            shouldAlert = true;
            thresholdDirection = 'outside_range';
          }
          break;
      }

      if (shouldAlert) {
        await this.createAlert(organizationId, patientId, reading, rule, thresholdDirection);
      }
    }
  }

  /**
   * Create an alert from a reading
   */
  private async createAlert(
    organizationId: string,
    patientId: string,
    reading: IotReading,
    rule: any,
    thresholdDirection: 'above' | 'below' | 'outside_range'
  ): Promise<void> {
    const now = new Date();

    // Generate alert number
    const countResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(rpmAlerts)
      .where(eq(rpmAlerts.organizationId, organizationId))
      .get();
    const alertNumber = `ALT-${String((countResult?.count || 0) + 1).padStart(8, '0')}`;

    const alertId = crypto.randomUUID();

    await drizzleDb.insert(rpmAlerts).values({
      id: alertId,
      organizationId,
      patientId,
      enrollmentId: reading.programId,
      readingId: reading.id,
      alertNumber,
      alertType: rule.severity === 'critical' ? 'threshold_critical' : 'threshold_exceeded',
      triggeredAt: now,
      severity: rule.severity,
      priority: rule.priority || 5,
      title: rule.alertMessage || `${reading.readingType} ${thresholdDirection} threshold`,
      description: `Reading of ${reading.primaryValue} ${reading.primaryUnit} is ${thresholdDirection} the ${thresholdDirection === 'outside_range' ? 'acceptable range' : 'threshold'} of ${rule.thresholdValue}${rule.thresholdValueSecondary ? ` - ${rule.thresholdValueSecondary}` : ''} ${rule.thresholdUnit || reading.primaryUnit}`,
      readingType: reading.readingType,
      readingValue: `${reading.primaryValue}`,
      thresholdValue: `${rule.thresholdValue}`,
      thresholdDirection,
      alertData: JSON.stringify({
        ruleId: rule.id,
        ruleName: rule.ruleName,
        readingId: reading.id,
      }),
      status: 'new',
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
      resolutionAction: null,
      escalatedAt: null,
      escalatedTo: null,
      escalationLevel: 0,
      escalationReason: null,
      responseTimeMinutes: null,
      resolutionTimeMinutes: null,
      notificationsSent: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
    });

    // Update reading to mark that it triggered an alert
    await drizzleDb
      .update(iotReadings)
      .set({
        triggeredAlert: true,
        alertId,
        updatedAt: now,
      })
      .where(eq(iotReadings.id, reading.id));
  }

  /**
   * Get readings count by day for a patient
   */
  async getReadingCountsByDay(
    organizationId: string,
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ date: string; count: number }[]> {
    const results = await drizzleDb
      .select({
        date: sql<string>`date(${iotReadings.measuredAt} / 1000, 'unixepoch')`,
        count: sql<number>`count(*)`,
      })
      .from(iotReadings)
      .where(and(
        eq(iotReadings.organizationId, organizationId),
        eq(iotReadings.patientId, patientId),
        between(iotReadings.measuredAt, startDate, endDate)
      ))
      .groupBy(sql`date(${iotReadings.measuredAt} / 1000, 'unixepoch')`)
      .all();

    return results;
  }

  /**
   * Delete reading
   */
  async delete(organizationId: string, readingId: string): Promise<boolean> {
    const reading = await this.getById(organizationId, readingId);
    if (!reading) {
      return false;
    }

    await drizzleDb
      .delete(iotReadings)
      .where(and(eq(iotReadings.id, readingId), eq(iotReadings.organizationId, organizationId)));

    return true;
  }
}

export const readingService = new ReadingService();
