/**
 * Quality Indicators Service
 * IQSS and quality measure management
 */

import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { getDb } from '../../db';
import {
  qualityIndicators,
  qualityMeasurements,
  iqssReports,
} from '@perfex/database/schema';

export interface CreateIndicatorInput {
  indicatorCode: string;
  indicatorName: string;
  shortName?: string;
  description?: string;
  indicatorType: 'process' | 'outcome' | 'structure' | 'patient_experience' | 'safety' | 'efficiency';
  source: 'iqss' | 'has' | 'ars' | 'internal' | 'cms' | 'jcaho' | 'custom';
  referenceDocument?: string;
  associatedModule?: 'dialyse' | 'cardiology' | 'ophthalmology' | 'general' | 'all';
  category?: string;
  measureType: 'proportion' | 'rate' | 'ratio' | 'mean' | 'median' | 'count' | 'composite';
  numeratorDescription?: string;
  numeratorCriteria?: any;
  denominatorDescription?: string;
  denominatorCriteria?: any;
  exclusionCriteria?: any;
  targetValue?: number;
  targetOperator?: '>=' | '<=' | '=' | '>' | '<' | 'between';
  benchmarkValue?: number;
  measurementPeriod?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'continuous';
  isMandatory?: boolean;
}

export interface MeasurementInput {
  measurementPeriod: string;
  periodStart: Date;
  periodEnd: Date;
  numerator: number;
  denominator: number;
  excludedCount?: number;
}

export class QualityIndicatorsService {
  // ============================================================================
  // QUALITY INDICATORS
  // ============================================================================

  /**
   * Create quality indicator
   */
  static async createIndicator(
    env: Env,
    organizationId: string | null,
    userId: string,
    input: CreateIndicatorInput
  ) {
    const db = getDb(env);

    const [indicator] = await db
      .insert(qualityIndicators)
      .values({
        organizationId,
        indicatorCode: input.indicatorCode,
        indicatorName: input.indicatorName,
        shortName: input.shortName,
        description: input.description,
        indicatorType: input.indicatorType,
        source: input.source,
        referenceDocument: input.referenceDocument,
        associatedModule: input.associatedModule,
        category: input.category,
        measureType: input.measureType,
        numeratorDescription: input.numeratorDescription,
        numeratorCriteria: input.numeratorCriteria ? JSON.stringify(input.numeratorCriteria) : null,
        denominatorDescription: input.denominatorDescription,
        denominatorCriteria: input.denominatorCriteria ? JSON.stringify(input.denominatorCriteria) : null,
        exclusionCriteria: input.exclusionCriteria ? JSON.stringify(input.exclusionCriteria) : null,
        targetValue: input.targetValue,
        targetOperator: input.targetOperator,
        benchmarkValue: input.benchmarkValue,
        measurementPeriod: input.measurementPeriod || 'quarterly',
        isMandatory: input.isMandatory || false,
        isActive: true,
        createdBy: userId,
      })
      .returning();

    return indicator;
  }

  /**
   * Get indicator by ID
   */
  static async getIndicatorById(env: Env, id: string) {
    const db = getDb(env);

    const [indicator] = await db
      .select()
      .from(qualityIndicators)
      .where(eq(qualityIndicators.id, id));

    return indicator || null;
  }

  /**
   * List quality indicators
   */
  static async listIndicators(
    env: Env,
    organizationId: string,
    source?: string,
    module?: string,
    category?: string
  ) {
    const db = getDb(env);

    const conditions = [
      sql`(${qualityIndicators.organizationId} = ${organizationId} OR ${qualityIndicators.organizationId} IS NULL)`,
      eq(qualityIndicators.isActive, true),
    ];

    if (source) {
      conditions.push(eq(qualityIndicators.source, source as any));
    }

    if (module) {
      conditions.push(sql`(${qualityIndicators.associatedModule} = ${module} OR ${qualityIndicators.associatedModule} = 'all')`);
    }

    if (category) {
      conditions.push(eq(qualityIndicators.category, category));
    }

    const indicators = await db
      .select()
      .from(qualityIndicators)
      .where(and(...conditions))
      .orderBy(qualityIndicators.indicatorCode);

    return indicators;
  }

  // ============================================================================
  // QUALITY MEASUREMENTS
  // ============================================================================

  /**
   * Record quality measurement
   */
  static async recordMeasurement(
    env: Env,
    organizationId: string,
    indicatorId: string,
    input: MeasurementInput
  ) {
    const db = getDb(env);

    // Get indicator details
    const indicator = await this.getIndicatorById(env, indicatorId);
    if (!indicator) {
      throw new Error('Indicator not found');
    }

    // Calculate value
    const value = input.denominator > 0
      ? (input.numerator / input.denominator) * 100
      : 0;

    // Check if meets target
    let meetsTarget = false;
    if (indicator.targetValue !== null && indicator.targetOperator) {
      switch (indicator.targetOperator) {
        case '>=':
          meetsTarget = value >= indicator.targetValue;
          break;
        case '<=':
          meetsTarget = value <= indicator.targetValue;
          break;
        case '>':
          meetsTarget = value > indicator.targetValue;
          break;
        case '<':
          meetsTarget = value < indicator.targetValue;
          break;
        case '=':
          meetsTarget = value === indicator.targetValue;
          break;
      }
    }

    const gapToTarget = indicator.targetValue !== null
      ? value - indicator.targetValue
      : null;

    // Get previous measurement for trend
    const [previousMeasurement] = await db
      .select()
      .from(qualityMeasurements)
      .where(
        and(
          eq(qualityMeasurements.organizationId, organizationId),
          eq(qualityMeasurements.indicatorId, indicatorId)
        )
      )
      .orderBy(desc(qualityMeasurements.periodEnd))
      .limit(1);

    let trend = 'new';
    let changePercent = 0;
    let trendSignificant = false;

    if (previousMeasurement) {
      changePercent = value - previousMeasurement.value;
      const absChange = Math.abs(changePercent);

      // Determine if lower or higher is better based on indicator type
      const lowerIsBetter = indicator.invertScale || false;

      if (absChange > 5) {
        trendSignificant = true;
        if (lowerIsBetter) {
          trend = changePercent < 0 ? 'improving' : 'worsening';
        } else {
          trend = changePercent > 0 ? 'improving' : 'worsening';
        }
      } else {
        trend = 'stable';
      }
    }

    // Compare with benchmark
    let performanceVsBenchmark = null;
    if (indicator.benchmarkValue !== null) {
      const diff = value - indicator.benchmarkValue;
      const lowerIsBetter = indicator.invertScale || false;

      if (Math.abs(diff) > 10) {
        if (lowerIsBetter) {
          performanceVsBenchmark = diff < 0 ? 'significantly_above' : 'significantly_below';
        } else {
          performanceVsBenchmark = diff > 0 ? 'significantly_above' : 'significantly_below';
        }
      } else if (Math.abs(diff) > 2) {
        if (lowerIsBetter) {
          performanceVsBenchmark = diff < 0 ? 'above' : 'below';
        } else {
          performanceVsBenchmark = diff > 0 ? 'above' : 'below';
        }
      } else {
        performanceVsBenchmark = 'at';
      }
    }

    const [measurement] = await db
      .insert(qualityMeasurements)
      .values({
        organizationId,
        indicatorId,
        measurementPeriod: input.measurementPeriod,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        numerator: input.numerator,
        denominator: input.denominator,
        excludedCount: input.excludedCount || 0,
        value,
        meetsTarget,
        gapToTarget,
        targetValue: indicator.targetValue,
        benchmarkValue: indicator.benchmarkValue,
        performanceVsBenchmark: performanceVsBenchmark as any,
        previousValue: previousMeasurement?.value,
        previousPeriod: previousMeasurement?.measurementPeriod,
        trend: trend as any,
        trendSignificant,
        changePercent,
        status: 'preliminary',
      })
      .returning();

    return measurement;
  }

  /**
   * Get indicator measurements
   */
  static async getIndicatorMeasurements(
    env: Env,
    organizationId: string,
    indicatorId: string,
    limit = 12
  ) {
    const db = getDb(env);

    const measurements = await db
      .select()
      .from(qualityMeasurements)
      .where(
        and(
          eq(qualityMeasurements.organizationId, organizationId),
          eq(qualityMeasurements.indicatorId, indicatorId)
        )
      )
      .orderBy(desc(qualityMeasurements.periodEnd))
      .limit(limit);

    return measurements;
  }

  /**
   * Get indicator trends
   */
  static async getIndicatorTrends(
    env: Env,
    organizationId: string,
    indicatorId: string,
    periods = 12
  ) {
    const measurements = await this.getIndicatorMeasurements(
      env,
      organizationId,
      indicatorId,
      periods
    );

    // Reverse to get chronological order
    const chronological = [...measurements].reverse();

    return {
      periods: chronological.map(m => m.measurementPeriod),
      values: chronological.map(m => m.value),
      targets: chronological.map(m => m.targetValue),
      benchmarks: chronological.map(m => m.benchmarkValue),
      meetsTarget: chronological.map(m => m.meetsTarget),
    };
  }

  /**
   * Validate measurement
   */
  static async validateMeasurement(
    env: Env,
    organizationId: string,
    measurementId: string,
    validatorId: string,
    notes?: string
  ) {
    const db = getDb(env);

    const [measurement] = await db
      .update(qualityMeasurements)
      .set({
        validated: true,
        validatedBy: validatorId,
        validatedAt: new Date(),
        validationNotes: notes,
        status: 'final',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(qualityMeasurements.id, measurementId),
          eq(qualityMeasurements.organizationId, organizationId)
        )
      )
      .returning();

    return measurement;
  }

  // ============================================================================
  // IQSS REPORTS
  // ============================================================================

  /**
   * Create IQSS report
   */
  static async createIqssReport(
    env: Env,
    organizationId: string,
    userId: string,
    reportYear: number,
    reportType: 'dialysis' | 'cardiology' | 'ophthalmology' | 'general'
  ) {
    const db = getDb(env);

    // Get all measurements for the year for relevant indicators
    const yearStart = new Date(reportYear, 0, 1);
    const yearEnd = new Date(reportYear, 11, 31);

    const indicators = await this.listIndicators(env, organizationId, 'iqss', reportType);

    const indicatorResults: any[] = [];
    let indicatorsMetTarget = 0;
    let indicatorsMissedTarget = 0;
    let indicatorsImproved = 0;
    let indicatorsDeclined = 0;

    for (const indicator of indicators) {
      const [latestMeasurement] = await db
        .select()
        .from(qualityMeasurements)
        .where(
          and(
            eq(qualityMeasurements.organizationId, organizationId),
            eq(qualityMeasurements.indicatorId, indicator.id),
            gte(qualityMeasurements.periodStart, yearStart),
            lte(qualityMeasurements.periodEnd, yearEnd)
          )
        )
        .orderBy(desc(qualityMeasurements.periodEnd))
        .limit(1);

      if (latestMeasurement) {
        indicatorResults.push({
          indicatorCode: indicator.indicatorCode,
          indicatorName: indicator.indicatorName,
          value: latestMeasurement.value,
          target: latestMeasurement.targetValue,
          meetsTarget: latestMeasurement.meetsTarget,
          trend: latestMeasurement.trend,
          benchmark: latestMeasurement.benchmarkValue,
        });

        if (latestMeasurement.meetsTarget) {
          indicatorsMetTarget++;
        } else {
          indicatorsMissedTarget++;
        }

        if (latestMeasurement.trend === 'improving') {
          indicatorsImproved++;
        } else if (latestMeasurement.trend === 'worsening') {
          indicatorsDeclined++;
        }
      }
    }

    // Calculate overall score (average of % targets met)
    const overallScore = indicatorResults.length > 0
      ? (indicatorsMetTarget / indicatorResults.length) * 100
      : 0;

    const [report] = await db
      .insert(iqssReports)
      .values({
        organizationId,
        reportYear,
        reportType,
        indicatorResults: JSON.stringify(indicatorResults),
        overallScore,
        indicatorsMetTarget,
        indicatorsMissedTarget,
        indicatorsImproved,
        indicatorsDeclined,
        status: 'draft',
        createdBy: userId,
      })
      .returning();

    return report;
  }

  /**
   * Get IQSS report
   */
  static async getIqssReport(
    env: Env,
    organizationId: string,
    reportYear: number,
    reportType: string
  ) {
    const db = getDb(env);

    const [report] = await db
      .select()
      .from(iqssReports)
      .where(
        and(
          eq(iqssReports.organizationId, organizationId),
          eq(iqssReports.reportYear, reportYear),
          eq(iqssReports.reportType, reportType as any)
        )
      )
      .orderBy(desc(iqssReports.reportVersion))
      .limit(1);

    return report || null;
  }

  /**
   * Submit IQSS report
   */
  static async submitIqssReport(
    env: Env,
    organizationId: string,
    reportId: string,
    userId: string
  ) {
    const db = getDb(env);

    const [report] = await db
      .update(iqssReports)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        submittedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(iqssReports.id, reportId),
          eq(iqssReports.organizationId, organizationId)
        )
      )
      .returning();

    return report;
  }

  /**
   * Get quality dashboard summary
   */
  static async getDashboardSummary(
    env: Env,
    organizationId: string,
    module?: string
  ) {
    const db = getDb(env);

    // Get all active indicators
    const indicators = await this.listIndicators(env, organizationId, undefined, module);

    // Get latest measurement for each indicator
    const summary: any = {
      totalIndicators: indicators.length,
      meetingTarget: 0,
      belowTarget: 0,
      improving: 0,
      declining: 0,
      stable: 0,
      noData: 0,
      byCategory: {} as Record<string, any>,
    };

    for (const indicator of indicators) {
      const [latest] = await db
        .select()
        .from(qualityMeasurements)
        .where(
          and(
            eq(qualityMeasurements.organizationId, organizationId),
            eq(qualityMeasurements.indicatorId, indicator.id)
          )
        )
        .orderBy(desc(qualityMeasurements.periodEnd))
        .limit(1);

      const category = indicator.category || 'Uncategorized';
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = {
          total: 0,
          meetingTarget: 0,
          belowTarget: 0,
        };
      }
      summary.byCategory[category].total++;

      if (latest) {
        if (latest.meetsTarget) {
          summary.meetingTarget++;
          summary.byCategory[category].meetingTarget++;
        } else {
          summary.belowTarget++;
          summary.byCategory[category].belowTarget++;
        }

        if (latest.trend === 'improving') {
          summary.improving++;
        } else if (latest.trend === 'worsening') {
          summary.declining++;
        } else if (latest.trend === 'stable') {
          summary.stable++;
        }
      } else {
        summary.noData++;
      }
    }

    return summary;
  }
}

export default QualityIndicatorsService;
