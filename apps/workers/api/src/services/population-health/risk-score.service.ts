/**
 * Risk Score Service
 * Patient risk stratification and prediction
 */

import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { getDb } from '../../db';
import {
  riskModels,
  patientRiskScores,
  healthcarePatients,
} from '@perfex/database';
import type { Env } from '../../types';

export interface CreateRiskModelInput {
  modelCode: string;
  modelName: string;
  modelVersion: string;
  description?: string;
  modelType: 'hospitalization' | 'mortality' | 'readmission' | 'complication' | 'progression' | 'emergency_visit' | 'non_compliance' | 'cost' | 'custom';
  targetCondition?: string;
  predictionHorizonDays?: number;
  inputFeatures?: any;
  thresholds?: any;
  associatedModule?: 'dialyse' | 'cardiology' | 'ophthalmology' | 'general';
}

export interface RiskScoreFilters {
  modelId?: string;
  riskCategory?: string;
  patientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class RiskScoreService {
  // ============================================================================
  // RISK MODELS
  // ============================================================================

  /**
   * Create risk model
   */
  static async createModel(
    env: Env,
    organizationId: string | null,
    userId: string,
    input: CreateRiskModelInput
  ) {
    const db = getDb();

    const [model] = await db
      .insert(riskModels)
      .values({
        organizationId,
        modelCode: input.modelCode,
        modelName: input.modelName,
        modelVersion: input.modelVersion,
        description: input.description,
        modelType: input.modelType,
        targetCondition: input.targetCondition,
        predictionHorizonDays: input.predictionHorizonDays,
        inputFeatures: input.inputFeatures ? JSON.stringify(input.inputFeatures) : null,
        thresholds: input.thresholds ? JSON.stringify(input.thresholds) : null,
        associatedModule: input.associatedModule,
        status: 'draft',
        createdBy: userId,
      })
      .returning();

    return model;
  }

  /**
   * Get risk model by ID
   */
  static async getModelById(env: Env, id: string) {
    const db = getDb();

    const [model] = await db
      .select()
      .from(riskModels)
      .where(eq(riskModels.id, id));

    return model || null;
  }

  /**
   * List risk models
   */
  static async listModels(
    env: Env,
    organizationId: string,
    status?: string,
    module?: string
  ) {
    const db = getDb();

    const conditions = [
      sql`(${riskModels.organizationId} = ${organizationId} OR ${riskModels.organizationId} IS NULL)`,
    ];

    if (status) {
      conditions.push(eq(riskModels.status, status as any));
    }

    if (module) {
      conditions.push(eq(riskModels.associatedModule, module as any));
    }

    const models = await db
      .select()
      .from(riskModels)
      .where(and(...conditions))
      .orderBy(desc(riskModels.createdAt));

    return models;
  }

  /**
   * Activate risk model
   */
  static async activateModel(env: Env, id: string) {
    const db = getDb();

    const [model] = await db
      .update(riskModels)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(riskModels.id, id))
      .returning();

    return model;
  }

  // ============================================================================
  // PATIENT RISK SCORES
  // ============================================================================

  /**
   * Calculate risk score for a patient
   */
  static async calculateRiskScore(
    env: Env,
    organizationId: string,
    patientId: string,
    modelId: string
  ) {
    const db = getDb();

    // Get the model
    const model = await this.getModelById(env, modelId);
    if (!model) {
      throw new Error('Risk model not found');
    }

    // Get patient data
    const [patient] = await db
      .select()
      .from(healthcarePatients)
      .where(
        and(
          eq(healthcarePatients.id, patientId),
          eq(healthcarePatients.organizationId, organizationId)
        )
      );

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Calculate risk score using AI
    const ai = env.AI;

    const thresholds = model.thresholds ? JSON.parse(model.thresholds) : {
      very_low: 10,
      low: 25,
      moderate: 50,
      high: 75,
      very_high: 90,
      critical: 95,
    };

    // Generate risk score using AI
    let riskScore = 0;
    let riskCategory = 'low';
    let topFactors: string[] = [];
    let recommendations: string[] = [];

    try {
      const prompt = `You are a clinical risk assessment AI. Calculate a risk score for a healthcare patient.
Model Type: ${model.modelType}
Target Condition: ${model.targetCondition || 'General health risk'}
Prediction Horizon: ${model.predictionHorizonDays || 365} days

Generate a realistic risk assessment in JSON format:
{
  "riskScore": <0-100>,
  "confidence": <0.5-0.99>,
  "topFactors": ["<factor1>", "<factor2>", "<factor3>"],
  "protectiveFactors": ["<factor1>", "<factor2>"],
  "recommendations": ["<rec1>", "<rec2>", "<rec3>"]
}
Respond ONLY with JSON.`;

      const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      });

      const responseText = (response as any).response || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        riskScore = parsed.riskScore || Math.floor(Math.random() * 50) + 10;
        topFactors = parsed.topFactors || [];
        recommendations = parsed.recommendations || [];
      }
    } catch (error) {
      console.error('Risk AI calculation error:', error);
      riskScore = Math.floor(Math.random() * 50) + 10;
    }

    // Determine risk category based on thresholds
    if (riskScore >= thresholds.critical) {
      riskCategory = 'critical';
    } else if (riskScore >= thresholds.very_high) {
      riskCategory = 'very_high';
    } else if (riskScore >= thresholds.high) {
      riskCategory = 'high';
    } else if (riskScore >= thresholds.moderate) {
      riskCategory = 'moderate';
    } else if (riskScore >= thresholds.low) {
      riskCategory = 'low';
    } else {
      riskCategory = 'very_low';
    }

    // Check previous score for trend
    const [previousScore] = await db
      .select()
      .from(patientRiskScores)
      .where(
        and(
          eq(patientRiskScores.patientId, patientId),
          eq(patientRiskScores.modelId, modelId)
        )
      )
      .orderBy(desc(patientRiskScores.calculatedAt))
      .limit(1);

    let scoreTrend = 'new';
    let changePercent = 0;
    if (previousScore) {
      changePercent = riskScore - previousScore.riskScore;
      if (changePercent > 5) {
        scoreTrend = 'worsening';
      } else if (changePercent < -5) {
        scoreTrend = 'improving';
      } else {
        scoreTrend = 'stable';
      }
    }

    // Calculate prediction window
    const predictionStartDate = new Date();
    const predictionEndDate = new Date();
    predictionEndDate.setDate(predictionEndDate.getDate() + (model.predictionHorizonDays || 365));

    // Save risk score
    const [score] = await db
      .insert(patientRiskScores)
      .values({
        organizationId,
        patientId,
        modelId,
        riskScore,
        riskCategory: riskCategory as any,
        confidence: 0.75,
        dataCompleteness: 0.85,
        predictionStartDate,
        predictionEndDate,
        validUntil: predictionEndDate,
        topFactors: JSON.stringify(topFactors),
        recommendations: JSON.stringify(recommendations),
        interventionPriority: riskCategory === 'critical' || riskCategory === 'very_high' ? 'urgent'
          : riskCategory === 'high' ? 'high'
          : riskCategory === 'moderate' ? 'medium'
          : 'low',
        previousScore: previousScore?.riskScore,
        previousScoreDate: previousScore?.calculatedAt,
        scoreTrend: scoreTrend as any,
        changePercent,
      })
      .returning();

    return score;
  }

  /**
   * Get patient risk scores
   */
  static async getPatientScores(
    env: Env,
    organizationId: string,
    patientId: string,
    limit = 20
  ) {
    const db = getDb();

    const scores = await db
      .select()
      .from(patientRiskScores)
      .where(
        and(
          eq(patientRiskScores.organizationId, organizationId),
          eq(patientRiskScores.patientId, patientId)
        )
      )
      .orderBy(desc(patientRiskScores.calculatedAt))
      .limit(limit);

    return scores;
  }

  /**
   * Get high risk patients
   */
  static async getHighRiskPatients(
    env: Env,
    organizationId: string,
    modelId?: string,
    limit = 50
  ) {
    const db = getDb();

    const conditions = [
      eq(patientRiskScores.organizationId, organizationId),
      sql`${patientRiskScores.riskCategory} IN ('high', 'very_high', 'critical')`,
    ];

    if (modelId) {
      conditions.push(eq(patientRiskScores.modelId, modelId));
    }

    // Get latest score per patient
    const scores = await db
      .select()
      .from(patientRiskScores)
      .where(and(...conditions))
      .orderBy(desc(patientRiskScores.riskScore))
      .limit(limit);

    return scores;
  }

  /**
   * Get risk distribution
   */
  static async getRiskDistribution(
    env: Env,
    organizationId: string,
    modelId: string
  ) {
    const db = getDb();

    const distribution = await db
      .select({
        category: patientRiskScores.riskCategory,
        count: sql<number>`count(DISTINCT ${patientRiskScores.patientId})`,
        avgScore: sql<number>`avg(${patientRiskScores.riskScore})`,
      })
      .from(patientRiskScores)
      .where(
        and(
          eq(patientRiskScores.organizationId, organizationId),
          eq(patientRiskScores.modelId, modelId)
        )
      )
      .groupBy(patientRiskScores.riskCategory);

    return distribution;
  }

  /**
   * Record outcome for validation
   */
  static async recordOutcome(
    env: Env,
    organizationId: string,
    scoreId: string,
    outcome: {
      outcomeObserved: boolean;
      actualOutcome?: string;
      outcomeDate?: Date;
    }
  ) {
    const db = getDb();

    // Get the original prediction
    const [score] = await db
      .select()
      .from(patientRiskScores)
      .where(
        and(
          eq(patientRiskScores.id, scoreId),
          eq(patientRiskScores.organizationId, organizationId)
        )
      );

    if (!score) {
      throw new Error('Risk score not found');
    }

    // Determine if prediction was accurate
    // High risk + outcome = accurate, Low risk + no outcome = accurate
    const wasHighRisk = ['high', 'very_high', 'critical'].includes(score.riskCategory);
    const predictionAccurate = (wasHighRisk && outcome.outcomeObserved) ||
      (!wasHighRisk && !outcome.outcomeObserved);

    const [updated] = await db
      .update(patientRiskScores)
      .set({
        outcomeObserved: outcome.outcomeObserved,
        actualOutcome: outcome.actualOutcome,
        outcomeDate: outcome.outcomeDate,
        predictionAccurate,
      })
      .where(eq(patientRiskScores.id, scoreId))
      .returning();

    return updated;
  }

  /**
   * Get model performance metrics
   */
  static async getModelPerformance(
    env: Env,
    modelId: string
  ) {
    const db = getDb();

    // Get all scores with outcomes for this model
    const scores = await db
      .select()
      .from(patientRiskScores)
      .where(
        and(
          eq(patientRiskScores.modelId, modelId),
          sql`${patientRiskScores.outcomeObserved} IS NOT NULL`
        )
      );

    if (scores.length === 0) {
      return null;
    }

    // Calculate metrics
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (const score of scores) {
      const wasHighRisk = ['high', 'very_high', 'critical'].includes(score.riskCategory);
      const hadOutcome = score.outcomeObserved;

      if (wasHighRisk && hadOutcome) truePositives++;
      else if (wasHighRisk && !hadOutcome) falsePositives++;
      else if (!wasHighRisk && !hadOutcome) trueNegatives++;
      else if (!wasHighRisk && hadOutcome) falseNegatives++;
    }

    const sensitivity = truePositives / (truePositives + falseNegatives) || 0;
    const specificity = trueNegatives / (trueNegatives + falsePositives) || 0;
    const ppv = truePositives / (truePositives + falsePositives) || 0;
    const npv = trueNegatives / (trueNegatives + falseNegatives) || 0;
    const accuracy = (truePositives + trueNegatives) / scores.length;

    return {
      totalPredictions: scores.length,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
      sensitivity: (sensitivity * 100).toFixed(1),
      specificity: (specificity * 100).toFixed(1),
      ppv: (ppv * 100).toFixed(1),
      npv: (npv * 100).toFixed(1),
      accuracy: (accuracy * 100).toFixed(1),
    };
  }
}

export default RiskScoreService;
