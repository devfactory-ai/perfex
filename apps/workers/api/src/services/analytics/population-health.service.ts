/**
 * Population Health Analytics Service
 * Service d'Analytique Santé Populationnelle
 * Analyse des données de santé à l'échelle de la population
 */

// Types
export interface PopulationCohort {
  id: string;
  name: string;
  description: string;
  criteria: CohortCriteria;
  patientCount: number;
  lastUpdated: string;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'archived';
}

export interface CohortCriteria {
  demographics?: {
    ageRange?: { min?: number; max?: number };
    gender?: ('M' | 'F')[];
    ethnicity?: string[];
    language?: string[];
    zipCodes?: string[];
  };
  conditions?: {
    codes: string[];
    codeSystem: 'ICD-10' | 'SNOMED';
    activeOnly?: boolean;
    diagnosedWithin?: { value: number; unit: 'days' | 'months' | 'years' };
  }[];
  medications?: {
    drugClasses?: string[];
    specificDrugs?: string[];
    activeOnly?: boolean;
  };
  labValues?: {
    testCode: string;
    operator: 'gt' | 'lt' | 'between' | 'abnormal';
    value?: number;
    range?: [number, number];
    withinDays?: number;
  }[];
  procedures?: {
    codes: string[];
    codeSystem: 'CPT' | 'ICD-10-PCS';
    withinMonths?: number;
  }[];
  utilization?: {
    type: 'ed_visit' | 'hospitalization' | 'readmission';
    count?: { min?: number; max?: number };
    withinMonths?: number;
  }[];
  riskScores?: {
    scoreType: string;
    operator: 'gt' | 'lt' | 'between';
    value?: number;
    range?: [number, number];
  }[];
  customFilters?: Record<string, unknown>;
}

export interface HealthIndicator {
  id: string;
  name: string;
  category: 'outcome' | 'process' | 'structure' | 'patient_safety';
  measure: string;
  numerator: string;
  denominator: string;
  target?: number;
  benchmark?: number;
  direction: 'higher_better' | 'lower_better';
  frequency: 'monthly' | 'quarterly' | 'annually';
}

export interface QualityMeasure {
  id: string;
  name: string;
  description: string;
  measureSet: 'HEDIS' | 'MIPS' | 'CMS' | 'custom';
  code: string;
  type: 'process' | 'outcome' | 'patient_experience' | 'efficiency';
  numeratorCriteria: string;
  denominatorCriteria: string;
  exclusions?: string[];
  dataSource: string[];
  reportingPeriod: { start: string; end: string };
  target: number;
  weight?: number;
}

export interface RiskStratification {
  patientId: string;
  patientName: string;
  overallRiskScore: number;
  riskTier: 'low' | 'moderate' | 'high' | 'very_high';
  riskFactors: RiskFactor[];
  predictedCost: number;
  predictedUtilization: {
    edVisits: number;
    hospitalizations: number;
    primaryCareVisits: number;
  };
  careGaps: CareGap[];
  recommendedInterventions: Intervention[];
  lastAssessed: string;
}

export interface RiskFactor {
  factor: string;
  category: 'clinical' | 'social' | 'behavioral' | 'environmental';
  severity: 'low' | 'medium' | 'high';
  contribution: number; // 0-100 percentage
  modifiable: boolean;
}

export interface CareGap {
  id: string;
  measureId: string;
  measureName: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  status: 'open' | 'in_progress' | 'closed' | 'excluded';
  lastAssessedDate?: string;
  recommendedAction: string;
}

export interface Intervention {
  id: string;
  type: 'care_management' | 'disease_management' | 'wellness' | 'preventive' | 'transitional_care';
  name: string;
  description: string;
  targetConditions: string[];
  expectedOutcome: string;
  cost: number;
  roi?: number;
  evidence: 'strong' | 'moderate' | 'emerging';
}

export interface PopulationReport {
  id: string;
  name: string;
  cohortId: string;
  cohortName: string;
  reportType: 'dashboard' | 'quality' | 'utilization' | 'cost' | 'outcomes' | 'gaps';
  period: { start: string; end: string };
  metrics: ReportMetric[];
  trends: TrendData[];
  comparisons?: Comparison[];
  generatedAt: string;
  generatedBy: string;
}

export interface ReportMetric {
  name: string;
  value: number;
  unit: string;
  target?: number;
  benchmark?: number;
  trend?: 'improving' | 'stable' | 'declining';
  percentile?: number;
}

export interface TrendData {
  metric: string;
  dataPoints: { date: string; value: number }[];
  trendDirection: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface Comparison {
  metric: string;
  cohortValue: number;
  benchmarkValue: number;
  benchmarkSource: string;
  variance: number;
  percentile: number;
}

export interface SocialDeterminant {
  domain: 'economic_stability' | 'education' | 'social_community' | 'healthcare_access' | 'neighborhood';
  factor: string;
  prevalence: number;
  impactedPatients: number;
  averageRiskIncrease: number;
  interventionAvailable: boolean;
}

export interface OutbreakAlert {
  id: string;
  condition: string;
  icdCode: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  affectedArea: string;
  caseCount: number;
  expectedCases: number;
  deviation: number;
  startDate: string;
  status: 'active' | 'monitoring' | 'resolved';
  reportedTo?: string[];
  recommendations: string[];
}

// Mock data
const cohorts: PopulationCohort[] = [
  {
    id: 'coh-001',
    name: 'Diabétiques Type 2 avec HTA',
    description: 'Patients avec diabète type 2 et hypertension artérielle',
    criteria: {
      conditions: [
        { codes: ['E11'], codeSystem: 'ICD-10', activeOnly: true },
        { codes: ['I10'], codeSystem: 'ICD-10', activeOnly: true }
      ]
    },
    patientCount: 1245,
    lastUpdated: '2024-01-15T10:00:00Z',
    createdBy: 'admin',
    createdAt: '2023-06-01T00:00:00Z',
    status: 'active'
  },
  {
    id: 'coh-002',
    name: 'Insuffisants Rénaux Chroniques',
    description: 'Patients avec IRC stade 3-5',
    criteria: {
      conditions: [
        { codes: ['N18.3', 'N18.4', 'N18.5'], codeSystem: 'ICD-10', activeOnly: true }
      ],
      labValues: [
        { testCode: 'GFR', operator: 'lt', value: 60, withinDays: 90 }
      ]
    },
    patientCount: 523,
    lastUpdated: '2024-01-15T10:00:00Z',
    createdBy: 'admin',
    createdAt: '2023-06-01T00:00:00Z',
    status: 'active'
  },
  {
    id: 'coh-003',
    name: 'Haut risque réadmission',
    description: 'Patients à haut risque de réadmission dans les 30 jours',
    criteria: {
      riskScores: [
        { scoreType: 'LACE', operator: 'gt', value: 10 }
      ],
      utilization: [
        { type: 'hospitalization', count: { min: 1 }, withinMonths: 12 }
      ]
    },
    patientCount: 187,
    lastUpdated: '2024-01-15T10:00:00Z',
    createdBy: 'admin',
    createdAt: '2023-09-01T00:00:00Z',
    status: 'active'
  }
];

const qualityMeasures: QualityMeasure[] = [
  {
    id: 'qm-001',
    name: 'Contrôle HbA1c < 8%',
    description: 'Pourcentage de patients diabétiques avec HbA1c < 8%',
    measureSet: 'HEDIS',
    code: 'CDC-HbA1c',
    type: 'outcome',
    numeratorCriteria: 'HbA1c < 8% dans les 12 derniers mois',
    denominatorCriteria: 'Patients diabétiques >= 18 ans',
    dataSource: ['lab_results', 'diagnoses'],
    reportingPeriod: { start: '2024-01-01', end: '2024-12-31' },
    target: 0.70,
    weight: 3
  },
  {
    id: 'qm-002',
    name: 'Contrôle tensionnel',
    description: 'Pourcentage de patients hypertendus avec PA contrôlée',
    measureSet: 'MIPS',
    code: 'BP-Control',
    type: 'outcome',
    numeratorCriteria: 'PA < 140/90 à la dernière visite',
    denominatorCriteria: 'Patients hypertendus >= 18 ans',
    dataSource: ['vital_signs', 'diagnoses'],
    reportingPeriod: { start: '2024-01-01', end: '2024-12-31' },
    target: 0.65,
    weight: 2
  },
  {
    id: 'qm-003',
    name: 'Dépistage rétinopathie diabétique',
    description: 'Examen ophtalmologique annuel chez les diabétiques',
    measureSet: 'HEDIS',
    code: 'EYE-DM',
    type: 'process',
    numeratorCriteria: 'Fond d\'œil ou rétinographie dans les 12 mois',
    denominatorCriteria: 'Patients diabétiques >= 18 ans',
    exclusions: ['Patients aveugles bilatéraux'],
    dataSource: ['procedures', 'diagnoses'],
    reportingPeriod: { start: '2024-01-01', end: '2024-12-31' },
    target: 0.60,
    weight: 2
  }
];

const healthIndicators: HealthIndicator[] = [
  {
    id: 'hi-001',
    name: 'Taux de réadmission à 30 jours',
    category: 'outcome',
    measure: 'Réadmissions non planifiées',
    numerator: 'Nombre de réadmissions dans les 30 jours',
    denominator: 'Total des sorties hospitalières',
    target: 0.12,
    benchmark: 0.15,
    direction: 'lower_better',
    frequency: 'monthly'
  },
  {
    id: 'hi-002',
    name: 'Visites aux urgences évitables',
    category: 'outcome',
    measure: 'Visites ED pour conditions ambulatoires',
    numerator: 'Visites ED pour ACSC',
    denominator: 'Total visites ED',
    target: 0.20,
    benchmark: 0.25,
    direction: 'lower_better',
    frequency: 'monthly'
  }
];

export class PopulationHealthService {

  // Get all cohorts
  getCohorts(options?: { status?: PopulationCohort['status'] }): PopulationCohort[] {
    let results = [...cohorts];
    if (options?.status) {
      results = results.filter(c => c.status === options.status);
    }
    return results;
  }

  // Get cohort by ID
  getCohort(cohortId: string): PopulationCohort | undefined {
    return cohorts.find(c => c.id === cohortId);
  }

  // Create new cohort
  async createCohort(data: {
    name: string;
    description: string;
    criteria: CohortCriteria;
    createdBy: string;
  }): Promise<PopulationCohort> {
    const cohort: PopulationCohort = {
      id: `coh-${Date.now()}`,
      name: data.name,
      description: data.description,
      criteria: data.criteria,
      patientCount: await this.calculateCohortSize(data.criteria),
      lastUpdated: new Date().toISOString(),
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    cohorts.push(cohort);
    return cohort;
  }

  // Calculate cohort size based on criteria
  async calculateCohortSize(_criteria: CohortCriteria): Promise<number> {
    // In production, query database with criteria
    return Math.floor(Math.random() * 500) + 100;
  }

  // Get quality measures
  getQualityMeasures(measureSet?: QualityMeasure['measureSet']): QualityMeasure[] {
    if (measureSet) {
      return qualityMeasures.filter(m => m.measureSet === measureSet);
    }
    return qualityMeasures;
  }

  // Calculate quality measure performance
  async calculateMeasurePerformance(measureId: string, cohortId?: string): Promise<{
    measure: QualityMeasure;
    numerator: number;
    denominator: number;
    rate: number;
    gap: number;
    trend: 'improving' | 'stable' | 'declining';
    historicalData: { period: string; rate: number }[];
  }> {
    const measure = qualityMeasures.find(m => m.id === measureId);
    if (!measure) throw new Error('Measure not found');

    // Mock calculation
    const denominator = cohortId
      ? (cohorts.find(c => c.id === cohortId)?.patientCount || 500)
      : 1000;
    const rate = 0.55 + Math.random() * 0.2;
    const numerator = Math.round(denominator * rate);

    return {
      measure,
      numerator,
      denominator,
      rate,
      gap: measure.target - rate,
      trend: rate > measure.target ? 'improving' : rate < measure.target * 0.9 ? 'declining' : 'stable',
      historicalData: [
        { period: '2023-Q1', rate: rate - 0.08 },
        { period: '2023-Q2', rate: rate - 0.05 },
        { period: '2023-Q3', rate: rate - 0.02 },
        { period: '2023-Q4', rate: rate }
      ]
    };
  }

  // Get risk stratification for a patient
  async getPatientRiskProfile(patientId: string): Promise<RiskStratification> {
    // Mock risk profile
    const riskScore = Math.random() * 100;
    const riskTier = riskScore > 75 ? 'very_high' : riskScore > 50 ? 'high' : riskScore > 25 ? 'moderate' : 'low';

    return {
      patientId,
      patientName: 'Patient Demo',
      overallRiskScore: Math.round(riskScore),
      riskTier,
      riskFactors: [
        {
          factor: 'Diabète non contrôlé',
          category: 'clinical',
          severity: 'high',
          contribution: 35,
          modifiable: true
        },
        {
          factor: 'Hypertension',
          category: 'clinical',
          severity: 'medium',
          contribution: 20,
          modifiable: true
        },
        {
          factor: 'Tabagisme actif',
          category: 'behavioral',
          severity: 'high',
          contribution: 15,
          modifiable: true
        },
        {
          factor: 'Isolement social',
          category: 'social',
          severity: 'medium',
          contribution: 10,
          modifiable: true
        }
      ],
      predictedCost: 25000 + riskScore * 500,
      predictedUtilization: {
        edVisits: Math.round(riskScore / 25),
        hospitalizations: Math.round(riskScore / 50),
        primaryCareVisits: 6 + Math.round(riskScore / 20)
      },
      careGaps: [
        {
          id: 'gap-001',
          measureId: 'qm-001',
          measureName: 'Contrôle HbA1c',
          description: 'HbA1c non contrôlée (dernière valeur: 9.2%)',
          priority: 'high',
          dueDate: '2024-02-15',
          status: 'open',
          lastAssessedDate: '2024-01-10',
          recommendedAction: 'Consultation diabétologie et ajustement traitement'
        },
        {
          id: 'gap-002',
          measureId: 'qm-003',
          measureName: 'Dépistage rétinopathie',
          description: 'Fond d\'œil non réalisé depuis 18 mois',
          priority: 'medium',
          dueDate: '2024-01-30',
          status: 'open',
          recommendedAction: 'Planifier examen ophtalmologique'
        }
      ],
      recommendedInterventions: [
        {
          id: 'int-001',
          type: 'disease_management',
          name: 'Programme diabète intensif',
          description: 'Suivi rapproché avec éducation thérapeutique',
          targetConditions: ['E11'],
          expectedOutcome: 'Réduction HbA1c de 1.5%',
          cost: 2500,
          roi: 3.2,
          evidence: 'strong'
        },
        {
          id: 'int-002',
          type: 'care_management',
          name: 'Care management',
          description: 'Coordination des soins par infirmière dédiée',
          targetConditions: ['multiple'],
          expectedOutcome: 'Réduction hospitalisations de 30%',
          cost: 4000,
          roi: 2.8,
          evidence: 'strong'
        }
      ],
      lastAssessed: new Date().toISOString()
    };
  }

  // Get population-level risk distribution
  async getRiskDistribution(cohortId?: string): Promise<{
    distribution: { tier: string; count: number; percentage: number }[];
    averageScore: number;
    topRiskFactors: { factor: string; prevalence: number }[];
    projectedCost: { total: number; perCapita: number };
  }> {
    const totalPatients = cohortId
      ? (cohorts.find(c => c.id === cohortId)?.patientCount || 1000)
      : 5000;

    return {
      distribution: [
        { tier: 'low', count: Math.round(totalPatients * 0.45), percentage: 45 },
        { tier: 'moderate', count: Math.round(totalPatients * 0.30), percentage: 30 },
        { tier: 'high', count: Math.round(totalPatients * 0.18), percentage: 18 },
        { tier: 'very_high', count: Math.round(totalPatients * 0.07), percentage: 7 }
      ],
      averageScore: 38,
      topRiskFactors: [
        { factor: 'Comorbidités multiples', prevalence: 0.42 },
        { factor: 'Non-adhérence médicamenteuse', prevalence: 0.35 },
        { factor: 'Hospitalisations récentes', prevalence: 0.28 },
        { factor: 'Déterminants sociaux défavorables', prevalence: 0.22 }
      ],
      projectedCost: {
        total: totalPatients * 8500,
        perCapita: 8500
      }
    };
  }

  // Detect disease outbreaks
  async detectOutbreaks(options?: {
    conditions?: string[];
    region?: string;
  }): Promise<OutbreakAlert[]> {
    // Mock outbreak detection
    const alerts: OutbreakAlert[] = [
      {
        id: 'alert-001',
        condition: 'Grippe saisonnière',
        icdCode: 'J10',
        severity: 'moderate',
        affectedArea: 'Paris 15ème',
        caseCount: 145,
        expectedCases: 80,
        deviation: 81,
        startDate: '2024-01-08',
        status: 'active',
        reportedTo: ['ARS Île-de-France'],
        recommendations: [
          'Renforcer la vaccination des personnes à risque',
          'Augmenter les stocks d\'antiviraux',
          'Communication préventive'
        ]
      }
    ];

    if (options?.conditions) {
      return alerts.filter(a => options.conditions!.includes(a.icdCode));
    }

    return alerts;
  }

  // Get social determinants analysis
  async getSocialDeterminantsAnalysis(cohortId?: string): Promise<SocialDeterminant[]> {
    const totalPatients = cohortId
      ? (cohorts.find(c => c.id === cohortId)?.patientCount || 1000)
      : 5000;

    return [
      {
        domain: 'economic_stability',
        factor: 'Insécurité alimentaire',
        prevalence: 0.15,
        impactedPatients: Math.round(totalPatients * 0.15),
        averageRiskIncrease: 25,
        interventionAvailable: true
      },
      {
        domain: 'healthcare_access',
        factor: 'Difficulté transport médical',
        prevalence: 0.22,
        impactedPatients: Math.round(totalPatients * 0.22),
        averageRiskIncrease: 18,
        interventionAvailable: true
      },
      {
        domain: 'social_community',
        factor: 'Isolement social',
        prevalence: 0.28,
        impactedPatients: Math.round(totalPatients * 0.28),
        averageRiskIncrease: 20,
        interventionAvailable: true
      },
      {
        domain: 'education',
        factor: 'Faible littératie en santé',
        prevalence: 0.35,
        impactedPatients: Math.round(totalPatients * 0.35),
        averageRiskIncrease: 15,
        interventionAvailable: true
      },
      {
        domain: 'neighborhood',
        factor: 'Zone médicalement sous-desservie',
        prevalence: 0.12,
        impactedPatients: Math.round(totalPatients * 0.12),
        averageRiskIncrease: 22,
        interventionAvailable: false
      }
    ];
  }

  // Generate population health dashboard
  async generateDashboard(cohortId?: string): Promise<{
    overview: {
      totalPatients: number;
      averageAge: number;
      genderDistribution: { gender: string; count: number }[];
      chronicConditions: { condition: string; count: number; percentage: number }[];
    };
    qualityScores: { measureName: string; score: number; target: number; trend: string }[];
    utilization: {
      edVisits: { current: number; previous: number; change: number };
      hospitalizations: { current: number; previous: number; change: number };
      readmissions: { current: number; previous: number; change: number };
    };
    costs: {
      totalCost: number;
      costPerMember: number;
      costByCategory: { category: string; amount: number }[];
      trend: { month: string; cost: number }[];
    };
    careGaps: { measureName: string; openGaps: number; closedGaps: number }[];
    riskProfile: { tier: string; count: number }[];
  }> {
    const totalPatients = cohortId
      ? (cohorts.find(c => c.id === cohortId)?.patientCount || 1000)
      : 5000;

    return {
      overview: {
        totalPatients,
        averageAge: 58,
        genderDistribution: [
          { gender: 'M', count: Math.round(totalPatients * 0.48) },
          { gender: 'F', count: Math.round(totalPatients * 0.52) }
        ],
        chronicConditions: [
          { condition: 'Hypertension', count: Math.round(totalPatients * 0.42), percentage: 42 },
          { condition: 'Diabète type 2', count: Math.round(totalPatients * 0.28), percentage: 28 },
          { condition: 'Dyslipidémie', count: Math.round(totalPatients * 0.35), percentage: 35 },
          { condition: 'Insuffisance cardiaque', count: Math.round(totalPatients * 0.12), percentage: 12 },
          { condition: 'IRC', count: Math.round(totalPatients * 0.15), percentage: 15 }
        ]
      },
      qualityScores: [
        { measureName: 'Contrôle HbA1c', score: 68, target: 70, trend: 'improving' },
        { measureName: 'Contrôle PA', score: 62, target: 65, trend: 'stable' },
        { measureName: 'Dépistage rétinopathie', score: 55, target: 60, trend: 'declining' },
        { measureName: 'Vaccination grippe', score: 72, target: 70, trend: 'improving' }
      ],
      utilization: {
        edVisits: { current: Math.round(totalPatients * 0.15), previous: Math.round(totalPatients * 0.18), change: -16 },
        hospitalizations: { current: Math.round(totalPatients * 0.08), previous: Math.round(totalPatients * 0.09), change: -11 },
        readmissions: { current: Math.round(totalPatients * 0.012), previous: Math.round(totalPatients * 0.014), change: -14 }
      },
      costs: {
        totalCost: totalPatients * 8500,
        costPerMember: 8500,
        costByCategory: [
          { category: 'Hospitalisation', amount: totalPatients * 3200 },
          { category: 'Médicaments', amount: totalPatients * 2100 },
          { category: 'Consultations', amount: totalPatients * 1500 },
          { category: 'Laboratoire', amount: totalPatients * 800 },
          { category: 'Imagerie', amount: totalPatients * 600 },
          { category: 'Autres', amount: totalPatients * 300 }
        ],
        trend: [
          { month: '2023-07', cost: totalPatients * 8800 },
          { month: '2023-08', cost: totalPatients * 8600 },
          { month: '2023-09', cost: totalPatients * 8700 },
          { month: '2023-10', cost: totalPatients * 8400 },
          { month: '2023-11', cost: totalPatients * 8300 },
          { month: '2023-12', cost: totalPatients * 8500 }
        ]
      },
      careGaps: [
        { measureName: 'Contrôle HbA1c', openGaps: Math.round(totalPatients * 0.32), closedGaps: Math.round(totalPatients * 0.68) },
        { measureName: 'Dépistage rétinopathie', openGaps: Math.round(totalPatients * 0.45), closedGaps: Math.round(totalPatients * 0.55) },
        { measureName: 'Vaccination pneumocoque', openGaps: Math.round(totalPatients * 0.38), closedGaps: Math.round(totalPatients * 0.62) }
      ],
      riskProfile: [
        { tier: 'low', count: Math.round(totalPatients * 0.45) },
        { tier: 'moderate', count: Math.round(totalPatients * 0.30) },
        { tier: 'high', count: Math.round(totalPatients * 0.18) },
        { tier: 'very_high', count: Math.round(totalPatients * 0.07) }
      ]
    };
  }

  // Get health indicators
  getHealthIndicators(): HealthIndicator[] {
    return healthIndicators;
  }

  // Close care gap
  async closeCareGap(patientId: string, gapId: string, data: {
    closedBy: string;
    closureReason: 'completed' | 'excluded' | 'patient_refused';
    notes?: string;
  }): Promise<{ success: boolean }> {
    console.log(`[PopHealth] Care gap ${gapId} closed for patient ${patientId} by ${data.closedBy}`);
    return { success: true };
  }

  // Assign intervention to patient
  async assignIntervention(patientId: string, interventionId: string, data: {
    assignedBy: string;
    startDate: string;
    notes?: string;
  }): Promise<{ success: boolean; enrollmentId: string }> {
    console.log(`[PopHealth] Intervention ${interventionId} assigned to patient ${patientId}`);
    return {
      success: true,
      enrollmentId: `enroll-${Date.now()}`
    };
  }
}
