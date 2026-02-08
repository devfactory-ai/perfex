/**
 * Imaging AI Service
 * Core service for managing medical image analyses
 */

import { eq, and, desc, sql, gte, lte, isNull, or, like } from 'drizzle-orm';
import { getDb } from '../../db';
import {
  imagingAnalysis,
  imagingReports,
  healthcarePatients,
} from '@perfex/database/schema';

export interface CreateImagingAnalysisInput {
  patientId: string;
  examinationId?: string;
  examinationType?: string;
  imageType: 'ecg' | 'oct' | 'fundus' | 'echocardiogram' | 'visual_field' | 'angiography' | 'xray' | 'ct' | 'mri' | 'other';
  imageSubtype?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  originalFileName?: string;
  fileFormat?: string;
  fileSizeBytes?: number;
  acquisitionDate: Date;
  equipment?: string;
  manufacturer?: string;
  protocolUsed?: string;
  technicianId?: string;
  sourceModule?: 'cardiology' | 'ophthalmology' | 'dialyse' | 'general';
  notes?: string;
}

export interface ImagingAnalysisFilters {
  imageType?: string;
  analysisStatus?: string;
  reviewStatus?: string;
  requiresUrgentReview?: boolean;
  patientId?: string;
  sourceModule?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export class ImagingService {
  /**
   * Create a new imaging analysis request
   */
  static async createAnalysis(
    env: Env,
    organizationId: string,
    userId: string,
    input: CreateImagingAnalysisInput
  ) {
    const db = getDb(env);

    const analysisNumber = `IMG-${Date.now().toString(36).toUpperCase()}`;

    const [analysis] = await db
      .insert(imagingAnalysis)
      .values({
        organizationId,
        patientId: input.patientId,
        examinationId: input.examinationId,
        examinationType: input.examinationType,
        imageType: input.imageType,
        imageSubtype: input.imageSubtype,
        imageUrl: input.imageUrl,
        thumbnailUrl: input.thumbnailUrl,
        originalFileName: input.originalFileName,
        fileFormat: input.fileFormat,
        fileSizeBytes: input.fileSizeBytes,
        acquisitionDate: input.acquisitionDate,
        equipment: input.equipment,
        manufacturer: input.manufacturer,
        protocolUsed: input.protocolUsed,
        technicianId: input.technicianId,
        sourceModule: input.sourceModule,
        analysisStatus: 'pending',
        reviewStatus: 'pending',
        notes: input.notes,
        createdBy: userId,
      })
      .returning();

    return analysis;
  }

  /**
   * Get imaging analysis by ID
   */
  static async getById(env: Env, organizationId: string, id: string) {
    const db = getDb(env);

    const [analysis] = await db
      .select()
      .from(imagingAnalysis)
      .where(
        and(
          eq(imagingAnalysis.id, id),
          eq(imagingAnalysis.organizationId, organizationId)
        )
      );

    return analysis || null;
  }

  /**
   * List imaging analyses with filters
   */
  static async list(
    env: Env,
    organizationId: string,
    filters: ImagingAnalysisFilters = {},
    page = 1,
    limit = 20
  ) {
    const db = getDb(env);
    const offset = (page - 1) * limit;

    const conditions = [eq(imagingAnalysis.organizationId, organizationId)];

    if (filters.imageType) {
      conditions.push(eq(imagingAnalysis.imageType, filters.imageType as any));
    }

    if (filters.analysisStatus) {
      conditions.push(eq(imagingAnalysis.analysisStatus, filters.analysisStatus as any));
    }

    if (filters.reviewStatus) {
      conditions.push(eq(imagingAnalysis.reviewStatus, filters.reviewStatus as any));
    }

    if (filters.requiresUrgentReview !== undefined) {
      conditions.push(eq(imagingAnalysis.requiresUrgentReview, filters.requiresUrgentReview));
    }

    if (filters.patientId) {
      conditions.push(eq(imagingAnalysis.patientId, filters.patientId));
    }

    if (filters.sourceModule) {
      conditions.push(eq(imagingAnalysis.sourceModule, filters.sourceModule as any));
    }

    if (filters.dateFrom) {
      conditions.push(gte(imagingAnalysis.acquisitionDate, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(imagingAnalysis.acquisitionDate, filters.dateTo));
    }

    const analyses = await db
      .select()
      .from(imagingAnalysis)
      .where(and(...conditions))
      .orderBy(desc(imagingAnalysis.acquisitionDate))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(imagingAnalysis)
      .where(and(...conditions));

    return {
      data: analyses,
      pagination: {
        page,
        limit,
        total: countResult?.count || 0,
        totalPages: Math.ceil((countResult?.count || 0) / limit),
      },
    };
  }

  /**
   * Start AI analysis for an imaging study
   */
  static async startAnalysis(env: Env, organizationId: string, id: string) {
    const db = getDb(env);

    const [analysis] = await db
      .update(imagingAnalysis)
      .set({
        analysisStatus: 'processing',
        analysisStartedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(imagingAnalysis.id, id),
          eq(imagingAnalysis.organizationId, organizationId)
        )
      )
      .returning();

    return analysis;
  }

  /**
   * Complete AI analysis with findings
   */
  static async completeAnalysis(
    env: Env,
    organizationId: string,
    id: string,
    findings: {
      aiModel: string;
      aiModelVersion?: string;
      aiFindings: any;
      aiMeasurements?: any;
      aiDiagnosis?: any;
      aiConfidence: number;
      aiAnnotations?: any;
      aiSummary: string;
      hasAbnormality: boolean;
      abnormalityCount?: number;
      criticalFinding: boolean;
      requiresUrgentReview: boolean;
      urgencyLevel?: 'routine' | 'priority' | 'urgent' | 'stat';
    }
  ) {
    const db = getDb(env);

    const [analysis] = await db
      .update(imagingAnalysis)
      .set({
        analysisStatus: 'completed',
        analysisCompletedAt: new Date(),
        aiModel: findings.aiModel,
        aiModelVersion: findings.aiModelVersion,
        aiFindings: JSON.stringify(findings.aiFindings),
        aiMeasurements: findings.aiMeasurements ? JSON.stringify(findings.aiMeasurements) : null,
        aiDiagnosis: findings.aiDiagnosis ? JSON.stringify(findings.aiDiagnosis) : null,
        aiConfidence: findings.aiConfidence,
        aiAnnotations: findings.aiAnnotations ? JSON.stringify(findings.aiAnnotations) : null,
        aiSummary: findings.aiSummary,
        hasAbnormality: findings.hasAbnormality,
        abnormalityCount: findings.abnormalityCount || 0,
        criticalFinding: findings.criticalFinding,
        requiresUrgentReview: findings.requiresUrgentReview,
        urgencyLevel: findings.urgencyLevel || 'routine',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(imagingAnalysis.id, id),
          eq(imagingAnalysis.organizationId, organizationId)
        )
      )
      .returning();

    return analysis;
  }

  /**
   * Fail AI analysis with error
   */
  static async failAnalysis(
    env: Env,
    organizationId: string,
    id: string,
    error: string
  ) {
    const db = getDb(env);

    const [analysis] = await db
      .update(imagingAnalysis)
      .set({
        analysisStatus: 'failed',
        analysisError: error,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(imagingAnalysis.id, id),
          eq(imagingAnalysis.organizationId, organizationId)
        )
      )
      .returning();

    return analysis;
  }

  /**
   * Submit physician review
   */
  static async submitReview(
    env: Env,
    organizationId: string,
    id: string,
    reviewerId: string,
    review: {
      reviewerAgreement: 'agree' | 'partially_agree' | 'disagree' | 'needs_clarification';
      physicianFindings?: string;
      physicianDiagnosis?: string;
      physicianNotes?: string;
    }
  ) {
    const db = getDb(env);

    const [analysis] = await db
      .update(imagingAnalysis)
      .set({
        reviewStatus: 'reviewed',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewerAgreement: review.reviewerAgreement,
        physicianFindings: review.physicianFindings,
        physicianDiagnosis: review.physicianDiagnosis,
        physicianNotes: review.physicianNotes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(imagingAnalysis.id, id),
          eq(imagingAnalysis.organizationId, organizationId)
        )
      )
      .returning();

    return analysis;
  }

  /**
   * Sign analysis (final approval)
   */
  static async signAnalysis(
    env: Env,
    organizationId: string,
    id: string,
    signerId: string,
    digitalSignature?: string
  ) {
    const db = getDb(env);

    const [analysis] = await db
      .update(imagingAnalysis)
      .set({
        reviewStatus: 'signed',
        signedBy: signerId,
        signedAt: new Date(),
        digitalSignature: digitalSignature,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(imagingAnalysis.id, id),
          eq(imagingAnalysis.organizationId, organizationId)
        )
      )
      .returning();

    return analysis;
  }

  /**
   * Get urgent analyses requiring review
   */
  static async getUrgentReviews(env: Env, organizationId: string, limit = 20) {
    const db = getDb(env);

    const analyses = await db
      .select()
      .from(imagingAnalysis)
      .where(
        and(
          eq(imagingAnalysis.organizationId, organizationId),
          eq(imagingAnalysis.requiresUrgentReview, true),
          eq(imagingAnalysis.reviewStatus, 'pending')
        )
      )
      .orderBy(desc(imagingAnalysis.criticalFinding), desc(imagingAnalysis.acquisitionDate))
      .limit(limit);

    return analyses;
  }

  /**
   * Get patient imaging history
   */
  static async getPatientHistory(
    env: Env,
    organizationId: string,
    patientId: string,
    imageType?: string,
    limit = 50
  ) {
    const db = getDb(env);

    const conditions = [
      eq(imagingAnalysis.organizationId, organizationId),
      eq(imagingAnalysis.patientId, patientId),
    ];

    if (imageType) {
      conditions.push(eq(imagingAnalysis.imageType, imageType as any));
    }

    const analyses = await db
      .select()
      .from(imagingAnalysis)
      .where(and(...conditions))
      .orderBy(desc(imagingAnalysis.acquisitionDate))
      .limit(limit);

    return analyses;
  }

  /**
   * Compare with previous analysis
   */
  static async compareWithPrevious(
    env: Env,
    organizationId: string,
    id: string,
    previousId: string,
    comparison: {
      progressionStatus: 'improved' | 'stable' | 'worsened' | 'new_finding' | 'not_applicable';
      progressionNotes?: string;
    }
  ) {
    const db = getDb(env);

    const [analysis] = await db
      .update(imagingAnalysis)
      .set({
        comparedToId: previousId,
        progressionStatus: comparison.progressionStatus,
        progressionNotes: comparison.progressionNotes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(imagingAnalysis.id, id),
          eq(imagingAnalysis.organizationId, organizationId)
        )
      )
      .returning();

    return analysis;
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(env: Env, organizationId: string) {
    const db = getDb(env);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total analyses
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(imagingAnalysis)
      .where(eq(imagingAnalysis.organizationId, organizationId));

    // Pending review
    const [pendingReview] = await db
      .select({ count: sql<number>`count(*)` })
      .from(imagingAnalysis)
      .where(
        and(
          eq(imagingAnalysis.organizationId, organizationId),
          eq(imagingAnalysis.analysisStatus, 'completed'),
          eq(imagingAnalysis.reviewStatus, 'pending')
        )
      );

    // Urgent reviews
    const [urgentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(imagingAnalysis)
      .where(
        and(
          eq(imagingAnalysis.organizationId, organizationId),
          eq(imagingAnalysis.requiresUrgentReview, true),
          eq(imagingAnalysis.reviewStatus, 'pending')
        )
      );

    // Critical findings today
    const [criticalToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(imagingAnalysis)
      .where(
        and(
          eq(imagingAnalysis.organizationId, organizationId),
          eq(imagingAnalysis.criticalFinding, true),
          gte(imagingAnalysis.acquisitionDate, today)
        )
      );

    // By image type
    const byType = await db
      .select({
        type: imagingAnalysis.imageType,
        count: sql<number>`count(*)`,
      })
      .from(imagingAnalysis)
      .where(eq(imagingAnalysis.organizationId, organizationId))
      .groupBy(imagingAnalysis.imageType);

    // By status
    const byStatus = await db
      .select({
        status: imagingAnalysis.analysisStatus,
        count: sql<number>`count(*)`,
      })
      .from(imagingAnalysis)
      .where(eq(imagingAnalysis.organizationId, organizationId))
      .groupBy(imagingAnalysis.analysisStatus);

    return {
      totalAnalyses: totalCount?.count || 0,
      pendingReview: pendingReview?.count || 0,
      urgentReviews: urgentCount?.count || 0,
      criticalFindingsToday: criticalToday?.count || 0,
      byType,
      byStatus,
    };
  }

  /**
   * Create imaging report
   */
  static async createReport(
    env: Env,
    organizationId: string,
    userId: string,
    analysisId: string,
    report: {
      title: string;
      reportType?: 'preliminary' | 'final' | 'addendum' | 'amended' | 'comparison';
      clinicalHistory?: string;
      indication?: string;
      technique?: string;
      comparison?: string;
      findings?: string;
      measurements?: any;
      impression?: string;
      recommendations?: string;
      generatedBy?: 'ai' | 'physician' | 'template' | 'hybrid';
      aiGenerated?: boolean;
      aiConfidence?: number;
    }
  ) {
    const db = getDb(env);

    const reportNumber = `RPT-${Date.now().toString(36).toUpperCase()}`;

    const [newReport] = await db
      .insert(imagingReports)
      .values({
        organizationId,
        imagingAnalysisId: analysisId,
        reportNumber,
        reportType: report.reportType || 'final',
        title: report.title,
        clinicalHistory: report.clinicalHistory,
        indication: report.indication,
        technique: report.technique,
        comparison: report.comparison,
        findings: report.findings,
        measurements: report.measurements ? JSON.stringify(report.measurements) : null,
        impression: report.impression,
        recommendations: report.recommendations,
        generatedBy: report.generatedBy || 'physician',
        aiGenerated: report.aiGenerated || false,
        aiConfidence: report.aiConfidence,
        status: 'draft',
        createdBy: userId,
      })
      .returning();

    return newReport;
  }

  /**
   * Get report by analysis ID
   */
  static async getReportByAnalysisId(env: Env, organizationId: string, analysisId: string) {
    const db = getDb(env);

    const [report] = await db
      .select()
      .from(imagingReports)
      .where(
        and(
          eq(imagingReports.imagingAnalysisId, analysisId),
          eq(imagingReports.organizationId, organizationId)
        )
      )
      .orderBy(desc(imagingReports.createdAt))
      .limit(1);

    return report || null;
  }

  /**
   * Sign report
   */
  static async signReport(
    env: Env,
    organizationId: string,
    reportId: string,
    signerId: string,
    signatureMethod: 'electronic' | 'digital_certificate' | 'biometric'
  ) {
    const db = getDb(env);

    const [report] = await db
      .update(imagingReports)
      .set({
        status: 'signed',
        signedBy: signerId,
        signedAt: new Date(),
        signatureMethod,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(imagingReports.id, reportId),
          eq(imagingReports.organizationId, organizationId)
        )
      )
      .returning();

    // Also update the parent analysis
    if (report) {
      await db
        .update(imagingAnalysis)
        .set({
          reportGenerated: true,
          reportUrl: report.reportUrl,
          updatedAt: new Date(),
        })
        .where(eq(imagingAnalysis.id, report.imagingAnalysisId));
    }

    return report;
  }
}

export default ImagingService;
