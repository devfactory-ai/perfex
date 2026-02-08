/**
 * Predictive Analytics & Machine Learning Service
 * Analytics Prédictif & ML
 * Modèles prédictifs pour la santé
 */

// Types
export interface PredictionModel {
  id: string;
  name: string;
  type: ModelType;
  version: string;
  description: string;
  targetOutcome: string;
  features: ModelFeature[];
  performance: ModelPerformance;
  training: TrainingInfo;
  validation: ValidationInfo;
  status: 'development' | 'validation' | 'production' | 'retired';
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
}

export type ModelType =
  | 'readmission_risk'
  | 'mortality_risk'
  | 'los_prediction'
  | 'sepsis_early_warning'
  | 'deterioration_risk'
  | 'fall_risk'
  | 'no_show_prediction'
  | 'cost_prediction'
  | 'disease_progression'
  | 'drug_response'
  | 'adverse_event_risk';

export interface ModelFeature {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean' | 'temporal' | 'text';
  source: string;
  importance: number;
  description: string;
  preprocessing?: string;
  missing_strategy?: 'mean' | 'median' | 'mode' | 'zero' | 'exclude';
}

export interface ModelPerformance {
  auc: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  specificity: number;
  npv: number;
  ppv: number;
  calibration: {
    hosmerLemeshowP: number;
    brierScore: number;
  };
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  riskDeciles?: { decile: number; observedRate: number; predictedRate: number }[];
}

export interface TrainingInfo {
  algorithm: 'logistic_regression' | 'random_forest' | 'xgboost' | 'neural_network' | 'ensemble';
  trainingDataSize: number;
  trainingPeriod: { start: string; end: string };
  hyperparameters: Record<string, unknown>;
  trainingTime: number;
  crossValidationFolds: number;
}

export interface ValidationInfo {
  validationDataSize: number;
  validationPeriod: { start: string; end: string };
  externalValidation: boolean;
  validationSites?: string[];
  temporalValidation: boolean;
  lastValidated: string;
}

export interface PatientPrediction {
  id: string;
  patientId: string;
  modelId: string;
  modelName: string;
  modelType: ModelType;
  encounterId?: string;
  predictedAt: string;
  riskScore: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
  riskPercentile: number;
  confidence: number;
  explanations: FeatureContribution[];
  recommendations: RiskRecommendation[];
  timeHorizon: string;
  validUntil: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  outcomeObserved?: boolean;
  actualOutcome?: boolean;
}

export interface FeatureContribution {
  feature: string;
  value: unknown;
  contribution: number;
  direction: 'increases_risk' | 'decreases_risk' | 'neutral';
  explanation: string;
}

export interface RiskRecommendation {
  type: 'intervention' | 'monitoring' | 'referral' | 'assessment' | 'education';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rationale: string;
  evidence: 'strong' | 'moderate' | 'limited';
  actionRequired: boolean;
}

export interface RealTimeAlert {
  id: string;
  patientId: string;
  patientName: string;
  locationId?: string;
  locationName?: string;
  modelId: string;
  modelType: ModelType;
  alertType: 'threshold_crossed' | 'rapid_change' | 'pattern_detected' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  currentScore: number;
  previousScore?: number;
  changePercent?: number;
  triggerReason: string;
  triggeredAt: string;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  assignedTo?: string;
  resolution?: {
    outcome: string;
    notes: string;
    resolvedAt: string;
    resolvedBy: string;
  };
}

export interface CohortRiskAnalysis {
  cohortId: string;
  cohortName: string;
  modelType: ModelType;
  analyzedAt: string;
  totalPatients: number;
  riskDistribution: {
    category: string;
    count: number;
    percentage: number;
    avgScore: number;
  }[];
  topRiskFactors: {
    factor: string;
    prevalence: number;
    avgContribution: number;
    modifiable: boolean;
  }[];
  projectedOutcomes: {
    outcome: string;
    projectedCount: number;
    projectedRate: number;
    confidence: [number, number];
  };
  interventionOpportunities: {
    intervention: string;
    targetPatients: number;
    potentialReduction: number;
    nnt: number;
    cost: number;
    roi: number;
  }[];
}

export interface ModelMonitoring {
  modelId: string;
  period: { start: string; end: string };
  predictions: number;
  outcomesObserved: number;
  performanceMetrics: {
    auc: number;
    calibration: number;
    discriminationChange: number;
  };
  drift: {
    featureDrift: { feature: string; driftScore: number; significant: boolean }[];
    predictionDrift: number;
    outcomeDrift: number;
    overallDriftScore: number;
    retrainingRecommended: boolean;
  };
  fairness: {
    demographicParity: number;
    equalizedOdds: number;
    calibrationAcrossGroups: { group: string; calibration: number }[];
  };
  alerts: {
    type: 'performance_degradation' | 'drift_detected' | 'fairness_issue';
    severity: 'warning' | 'critical';
    message: string;
    timestamp: string;
  }[];
}

// Prediction models
const models: PredictionModel[] = [
  {
    id: 'model-001',
    name: 'Risque de réadmission à 30 jours',
    type: 'readmission_risk',
    version: '2.1.0',
    description: 'Prédit le risque de réadmission hospitalière dans les 30 jours suivant la sortie',
    targetOutcome: 'Réadmission dans 30 jours',
    features: [
      { name: 'age', type: 'numeric', source: 'demographics', importance: 0.15, description: 'Âge du patient' },
      { name: 'previous_admissions_12m', type: 'numeric', source: 'encounters', importance: 0.25, description: 'Nombre d\'hospitalisations dans les 12 derniers mois' },
      { name: 'charlson_score', type: 'numeric', source: 'diagnoses', importance: 0.20, description: 'Score de Charlson' },
      { name: 'length_of_stay', type: 'numeric', source: 'encounter', importance: 0.12, description: 'Durée du séjour actuel' },
      { name: 'discharge_disposition', type: 'categorical', source: 'encounter', importance: 0.10, description: 'Destination à la sortie' },
      { name: 'polypharmacy', type: 'boolean', source: 'medications', importance: 0.08, description: 'Plus de 5 médicaments' },
      { name: 'ed_visits_6m', type: 'numeric', source: 'encounters', importance: 0.10, description: 'Visites urgences 6 mois' }
    ],
    performance: {
      auc: 0.78,
      accuracy: 0.72,
      precision: 0.45,
      recall: 0.68,
      f1Score: 0.54,
      specificity: 0.74,
      npv: 0.88,
      ppv: 0.45,
      calibration: {
        hosmerLemeshowP: 0.42,
        brierScore: 0.15
      },
      confusionMatrix: {
        truePositive: 340,
        falsePositive: 415,
        trueNegative: 1180,
        falseNegative: 160
      }
    },
    training: {
      algorithm: 'xgboost',
      trainingDataSize: 25000,
      trainingPeriod: { start: '2022-01-01', end: '2023-06-30' },
      hyperparameters: { max_depth: 6, learning_rate: 0.1, n_estimators: 200 },
      trainingTime: 3600,
      crossValidationFolds: 5
    },
    validation: {
      validationDataSize: 5000,
      validationPeriod: { start: '2023-07-01', end: '2023-12-31' },
      externalValidation: true,
      validationSites: ['Hôpital A', 'Hôpital B'],
      temporalValidation: true,
      lastValidated: '2024-01-01'
    },
    status: 'production',
    createdAt: '2023-01-15',
    updatedAt: '2024-01-01',
    deployedAt: '2024-01-15'
  },
  {
    id: 'model-002',
    name: 'Alerte précoce sepsis',
    type: 'sepsis_early_warning',
    version: '1.5.0',
    description: 'Détection précoce du sepsis basée sur les signes vitaux et laboratoires',
    targetOutcome: 'Développement sepsis dans 6 heures',
    features: [
      { name: 'heart_rate', type: 'numeric', source: 'vitals', importance: 0.18, description: 'Fréquence cardiaque' },
      { name: 'respiratory_rate', type: 'numeric', source: 'vitals', importance: 0.16, description: 'Fréquence respiratoire' },
      { name: 'temperature', type: 'numeric', source: 'vitals', importance: 0.14, description: 'Température' },
      { name: 'systolic_bp', type: 'numeric', source: 'vitals', importance: 0.15, description: 'Pression systolique' },
      { name: 'wbc', type: 'numeric', source: 'labs', importance: 0.12, description: 'Globules blancs' },
      { name: 'lactate', type: 'numeric', source: 'labs', importance: 0.15, description: 'Lactate' },
      { name: 'mental_status_change', type: 'boolean', source: 'assessment', importance: 0.10, description: 'Changement état mental' }
    ],
    performance: {
      auc: 0.85,
      accuracy: 0.82,
      precision: 0.35,
      recall: 0.88,
      f1Score: 0.50,
      specificity: 0.81,
      npv: 0.98,
      ppv: 0.35,
      calibration: {
        hosmerLemeshowP: 0.55,
        brierScore: 0.08
      },
      confusionMatrix: {
        truePositive: 88,
        falsePositive: 163,
        trueNegative: 700,
        falseNegative: 12
      }
    },
    training: {
      algorithm: 'neural_network',
      trainingDataSize: 50000,
      trainingPeriod: { start: '2021-01-01', end: '2023-06-30' },
      hyperparameters: { layers: [64, 32, 16], dropout: 0.3, optimizer: 'adam' },
      trainingTime: 7200,
      crossValidationFolds: 5
    },
    validation: {
      validationDataSize: 10000,
      validationPeriod: { start: '2023-07-01', end: '2023-12-31' },
      externalValidation: true,
      temporalValidation: true,
      lastValidated: '2024-01-10'
    },
    status: 'production',
    createdAt: '2022-06-01',
    updatedAt: '2024-01-10',
    deployedAt: '2024-01-15'
  }
];

const predictions: PatientPrediction[] = [];
const alerts: RealTimeAlert[] = [];

export class PredictiveAnalyticsService {

  // Get available models
  getModels(options?: {
    type?: ModelType;
    status?: PredictionModel['status'];
  }): PredictionModel[] {
    let results = [...models];

    if (options?.type) {
      results = results.filter(m => m.type === options.type);
    }

    if (options?.status) {
      results = results.filter(m => m.status === options.status);
    }

    return results;
  }

  // Get model by ID
  getModel(modelId: string): PredictionModel | undefined {
    return models.find(m => m.id === modelId);
  }

  // Generate prediction for patient
  async predict(data: {
    modelId: string;
    patientId: string;
    encounterId?: string;
    features: Record<string, unknown>;
  }): Promise<PatientPrediction> {
    const model = this.getModel(data.modelId);
    if (!model) throw new Error('Model not found');

    if (model.status !== 'production') {
      throw new Error('Model is not in production');
    }

    // Simulate prediction calculation
    const rawScore = this.calculateScore(model, data.features);
    const riskScore = Math.min(100, Math.max(0, rawScore));
    const riskCategory = this.categorizeRisk(riskScore);
    const riskPercentile = this.calculatePercentile(riskScore, model.type);

    // Calculate feature contributions
    const explanations = this.explainPrediction(model, data.features);

    // Generate recommendations
    const recommendations = this.generateRecommendations(model.type, riskCategory, explanations);

    const prediction: PatientPrediction = {
      id: `pred-${Date.now()}`,
      patientId: data.patientId,
      modelId: model.id,
      modelName: model.name,
      modelType: model.type,
      encounterId: data.encounterId,
      predictedAt: new Date().toISOString(),
      riskScore,
      riskCategory,
      riskPercentile,
      confidence: 0.75 + Math.random() * 0.20,
      explanations,
      recommendations,
      timeHorizon: this.getTimeHorizon(model.type),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      acknowledged: false
    };

    predictions.push(prediction);

    // Check for alert thresholds
    if (riskScore > 70) {
      await this.createAlert(prediction, 'threshold_crossed');
    }

    return prediction;
  }

  // Get patient predictions
  getPatientPredictions(patientId: string, options?: {
    modelType?: ModelType;
    fromDate?: string;
    limit?: number;
  }): PatientPrediction[] {
    let results = predictions.filter(p => p.patientId === patientId);

    if (options?.modelType) {
      results = results.filter(p => p.modelType === options.modelType);
    }

    if (options?.fromDate) {
      results = results.filter(p => p.predictedAt >= options.fromDate!);
    }

    results.sort((a, b) =>
      new Date(b.predictedAt).getTime() - new Date(a.predictedAt).getTime()
    );

    return options?.limit ? results.slice(0, options.limit) : results;
  }

  // Batch prediction for cohort
  async predictCohort(data: {
    modelId: string;
    patientIds: string[];
    featuresMap: Record<string, Record<string, unknown>>;
  }): Promise<{
    predictions: PatientPrediction[];
    summary: {
      total: number;
      byRiskCategory: { category: string; count: number }[];
      avgScore: number;
      highRiskCount: number;
    };
  }> {
    const predictions: PatientPrediction[] = [];

    for (const patientId of data.patientIds) {
      const features = data.featuresMap[patientId];
      if (features) {
        const prediction = await this.predict({
          modelId: data.modelId,
          patientId,
          features
        });
        predictions.push(prediction);
      }
    }

    // Calculate summary
    const riskCounts: Record<string, number> = {};
    let totalScore = 0;
    let highRiskCount = 0;

    for (const pred of predictions) {
      riskCounts[pred.riskCategory] = (riskCounts[pred.riskCategory] || 0) + 1;
      totalScore += pred.riskScore;
      if (pred.riskCategory === 'high' || pred.riskCategory === 'very_high') {
        highRiskCount++;
      }
    }

    return {
      predictions,
      summary: {
        total: predictions.length,
        byRiskCategory: Object.entries(riskCounts).map(([category, count]) => ({ category, count })),
        avgScore: predictions.length > 0 ? totalScore / predictions.length : 0,
        highRiskCount
      }
    };
  }

  // Get active alerts
  getActiveAlerts(options?: {
    patientId?: string;
    modelType?: ModelType;
    severity?: RealTimeAlert['severity'];
    status?: RealTimeAlert['status'];
  }): RealTimeAlert[] {
    let results = [...alerts];

    if (options?.patientId) {
      results = results.filter(a => a.patientId === options.patientId);
    }

    if (options?.modelType) {
      results = results.filter(a => a.modelType === options.modelType);
    }

    if (options?.severity) {
      results = results.filter(a => a.severity === options.severity);
    }

    if (options?.status) {
      results = results.filter(a => a.status === options.status);
    }

    return results.sort((a, b) =>
      new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, userId: string): Promise<RealTimeAlert> {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');

    alert.status = 'acknowledged';
    alert.assignedTo = userId;

    return alert;
  }

  // Resolve alert
  async resolveAlert(alertId: string, data: {
    outcome: string;
    notes: string;
    resolvedBy: string;
  }): Promise<RealTimeAlert> {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');

    alert.status = 'resolved';
    alert.resolution = {
      outcome: data.outcome,
      notes: data.notes,
      resolvedAt: new Date().toISOString(),
      resolvedBy: data.resolvedBy
    };

    return alert;
  }

  // Analyze cohort risk
  async analyzeCohortRisk(data: {
    cohortId: string;
    cohortName: string;
    modelType: ModelType;
    patientPredictions: PatientPrediction[];
  }): Promise<CohortRiskAnalysis> {
    const preds = data.patientPredictions;

    // Risk distribution
    const riskCounts: Record<string, { count: number; totalScore: number }> = {};
    for (const pred of preds) {
      if (!riskCounts[pred.riskCategory]) {
        riskCounts[pred.riskCategory] = { count: 0, totalScore: 0 };
      }
      riskCounts[pred.riskCategory].count++;
      riskCounts[pred.riskCategory].totalScore += pred.riskScore;
    }

    // Top risk factors
    const factorContributions: Record<string, { total: number; count: number }> = {};
    for (const pred of preds) {
      for (const exp of pred.explanations) {
        if (exp.direction === 'increases_risk') {
          if (!factorContributions[exp.feature]) {
            factorContributions[exp.feature] = { total: 0, count: 0 };
          }
          factorContributions[exp.feature].total += exp.contribution;
          factorContributions[exp.feature].count++;
        }
      }
    }

    // Project outcomes
    const highRiskPatients = preds.filter(p =>
      p.riskCategory === 'high' || p.riskCategory === 'very_high'
    ).length;
    const model = models.find(m => m.type === data.modelType);
    const baseRate = model ? model.performance.ppv : 0.3;

    return {
      cohortId: data.cohortId,
      cohortName: data.cohortName,
      modelType: data.modelType,
      analyzedAt: new Date().toISOString(),
      totalPatients: preds.length,
      riskDistribution: Object.entries(riskCounts).map(([category, data]) => ({
        category,
        count: data.count,
        percentage: (data.count / preds.length) * 100,
        avgScore: data.totalScore / data.count
      })),
      topRiskFactors: Object.entries(factorContributions)
        .map(([factor, data]) => ({
          factor,
          prevalence: data.count / preds.length,
          avgContribution: data.total / data.count,
          modifiable: this.isModifiableFactor(factor)
        }))
        .sort((a, b) => b.avgContribution - a.avgContribution)
        .slice(0, 10),
      projectedOutcomes: {
        outcome: model?.targetOutcome || 'Événement prédit',
        projectedCount: Math.round(highRiskPatients * baseRate),
        projectedRate: baseRate,
        confidence: [baseRate * 0.8, baseRate * 1.2] as [number, number]
      },
      interventionOpportunities: [
        {
          intervention: 'Care management intensif',
          targetPatients: Math.round(highRiskPatients * 0.3),
          potentialReduction: 0.25,
          nnt: 4,
          cost: 2500,
          roi: 3.2
        },
        {
          intervention: 'Suivi téléphonique',
          targetPatients: Math.round(highRiskPatients * 0.5),
          potentialReduction: 0.15,
          nnt: 7,
          cost: 500,
          roi: 4.5
        }
      ]
    };
  }

  // Get model monitoring metrics
  async getModelMonitoring(modelId: string, period: {
    start: string;
    end: string;
  }): Promise<ModelMonitoring> {
    const model = this.getModel(modelId);
    if (!model) throw new Error('Model not found');

    const periodPreds = predictions.filter(
      p => p.modelId === modelId &&
           p.predictedAt >= period.start &&
           p.predictedAt <= period.end
    );

    const observedOutcomes = periodPreds.filter(p => p.outcomeObserved);

    return {
      modelId,
      period,
      predictions: periodPreds.length,
      outcomesObserved: observedOutcomes.length,
      performanceMetrics: {
        auc: model.performance.auc - Math.random() * 0.05,
        calibration: 0.92 + Math.random() * 0.05,
        discriminationChange: -0.02
      },
      drift: {
        featureDrift: model.features.slice(0, 5).map(f => ({
          feature: f.name,
          driftScore: Math.random() * 0.3,
          significant: Math.random() > 0.8
        })),
        predictionDrift: 0.08,
        outcomeDrift: 0.05,
        overallDriftScore: 0.12,
        retrainingRecommended: false
      },
      fairness: {
        demographicParity: 0.95,
        equalizedOdds: 0.92,
        calibrationAcrossGroups: [
          { group: 'Age <65', calibration: 0.94 },
          { group: 'Age >=65', calibration: 0.91 },
          { group: 'Homme', calibration: 0.93 },
          { group: 'Femme', calibration: 0.92 }
        ]
      },
      alerts: []
    };
  }

  // Record actual outcome
  async recordOutcome(predictionId: string, actualOutcome: boolean): Promise<PatientPrediction> {
    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) throw new Error('Prediction not found');

    prediction.outcomeObserved = true;
    prediction.actualOutcome = actualOutcome;

    return prediction;
  }

  // Get prediction dashboard
  getPredictionDashboard(): {
    totalPredictions: number;
    todayPredictions: number;
    activeAlerts: number;
    criticalAlerts: number;
    modelPerformance: { modelName: string; auc: number; status: string }[];
    riskDistribution: { category: string; count: number }[];
    recentHighRisk: { patientId: string; modelType: string; score: number; time: string }[];
  } {
    const today = new Date().toISOString().split('T')[0];
    const todayPreds = predictions.filter(p => p.predictedAt.startsWith(today));

    const activeAlertsCount = alerts.filter(a =>
      a.status === 'new' || a.status === 'acknowledged'
    ).length;

    const criticalAlertsCount = alerts.filter(a =>
      a.severity === 'critical' && (a.status === 'new' || a.status === 'acknowledged')
    ).length;

    const riskCounts: Record<string, number> = {};
    for (const pred of todayPreds) {
      riskCounts[pred.riskCategory] = (riskCounts[pred.riskCategory] || 0) + 1;
    }

    const highRiskRecent = predictions
      .filter(p => p.riskCategory === 'high' || p.riskCategory === 'very_high')
      .sort((a, b) => new Date(b.predictedAt).getTime() - new Date(a.predictedAt).getTime())
      .slice(0, 10)
      .map(p => ({
        patientId: p.patientId,
        modelType: p.modelType,
        score: p.riskScore,
        time: p.predictedAt
      }));

    return {
      totalPredictions: predictions.length,
      todayPredictions: todayPreds.length,
      activeAlerts: activeAlertsCount,
      criticalAlerts: criticalAlertsCount,
      modelPerformance: models
        .filter(m => m.status === 'production')
        .map(m => ({
          modelName: m.name,
          auc: m.performance.auc,
          status: m.status
        })),
      riskDistribution: Object.entries(riskCounts).map(([category, count]) => ({
        category,
        count
      })),
      recentHighRisk: highRiskRecent
    };
  }

  // Helper methods
  private calculateScore(model: PredictionModel, features: Record<string, unknown>): number {
    let score = 30; // Base score

    for (const feature of model.features) {
      const value = features[feature.name];
      if (value !== undefined) {
        // Simple scoring logic
        const contribution = feature.importance * 100;
        if (typeof value === 'number') {
          score += contribution * (value / 100);
        } else if (typeof value === 'boolean' && value) {
          score += contribution;
        }
      }
    }

    return Math.round(score);
  }

  private categorizeRisk(score: number): PatientPrediction['riskCategory'] {
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  }

  private calculatePercentile(score: number, modelType: ModelType): number {
    // Simple percentile calculation
    return Math.min(99, Math.round(score));
  }

  private explainPrediction(
    model: PredictionModel,
    features: Record<string, unknown>
  ): FeatureContribution[] {
    return model.features
      .filter(f => features[f.name] !== undefined)
      .map(f => ({
        feature: f.name,
        value: features[f.name],
        contribution: f.importance * (Math.random() * 20 - 5),
        direction: Math.random() > 0.5 ? 'increases_risk' as const : 'decreases_risk' as const,
        explanation: f.description
      }))
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  }

  private generateRecommendations(
    modelType: ModelType,
    riskCategory: PatientPrediction['riskCategory'],
    explanations: FeatureContribution[]
  ): RiskRecommendation[] {
    const recommendations: RiskRecommendation[] = [];

    if (riskCategory === 'high' || riskCategory === 'very_high') {
      recommendations.push({
        type: 'intervention',
        priority: 'high',
        description: 'Inscription au programme de care management',
        rationale: 'Les patients à haut risque bénéficient d\'un suivi coordonné',
        evidence: 'strong',
        actionRequired: true
      });

      recommendations.push({
        type: 'monitoring',
        priority: 'high',
        description: 'Surveillance rapprochée des signes vitaux',
        rationale: 'Détection précoce de détérioration',
        evidence: 'strong',
        actionRequired: true
      });
    }

    if (riskCategory === 'moderate') {
      recommendations.push({
        type: 'assessment',
        priority: 'medium',
        description: 'Réévaluation dans 48h',
        rationale: 'Surveiller l\'évolution du risque',
        evidence: 'moderate',
        actionRequired: false
      });
    }

    return recommendations;
  }

  private getTimeHorizon(modelType: ModelType): string {
    const horizons: Record<ModelType, string> = {
      readmission_risk: '30 jours',
      mortality_risk: '30 jours',
      los_prediction: 'Séjour actuel',
      sepsis_early_warning: '6 heures',
      deterioration_risk: '24 heures',
      fall_risk: 'Séjour actuel',
      no_show_prediction: 'Rendez-vous suivant',
      cost_prediction: '12 mois',
      disease_progression: '12 mois',
      drug_response: 'Traitement actuel',
      adverse_event_risk: '72 heures'
    };
    return horizons[modelType] || '30 jours';
  }

  private async createAlert(prediction: PatientPrediction, alertType: RealTimeAlert['alertType']): Promise<void> {
    const alert: RealTimeAlert = {
      id: `alert-${Date.now()}`,
      patientId: prediction.patientId,
      patientName: 'Patient',
      modelId: prediction.modelId,
      modelType: prediction.modelType,
      alertType,
      severity: prediction.riskCategory === 'very_high' ? 'critical' : 'warning',
      currentScore: prediction.riskScore,
      triggerReason: `Score de risque élevé: ${prediction.riskScore}%`,
      triggeredAt: new Date().toISOString(),
      status: 'new'
    };

    alerts.push(alert);
  }

  private isModifiableFactor(factor: string): boolean {
    const nonModifiable = ['age', 'gender', 'genetics', 'previous_admissions'];
    return !nonModifiable.includes(factor.toLowerCase());
  }
}
