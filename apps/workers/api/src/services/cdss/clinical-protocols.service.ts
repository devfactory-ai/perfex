/**
 * Clinical Protocols and Guidelines Service
 * Service CDSS étendu avec protocoles cliniques
 * Gestion des guides de pratique clinique et arbres décisionnels
 */

// Types
export interface ClinicalProtocol {
  id: string;
  name: string;
  version: string;
  category: ProtocolCategory;
  specialty: string;
  description: string;
  objectives: string[];
  targetPopulation: PatientCriteria;
  exclusionCriteria: PatientCriteria;
  steps: ProtocolStep[];
  decisionPoints: DecisionPoint[];
  outcomes: ProtocolOutcome[];
  evidenceLevel: 'A' | 'B' | 'C' | 'D' | 'E';
  recommendationStrength: 'strong' | 'moderate' | 'weak' | 'conditional';
  references: Reference[];
  authors: string[];
  approvedBy: string;
  approvalDate: string;
  effectiveDate: string;
  reviewDate: string;
  expirationDate?: string;
  status: 'draft' | 'pending_approval' | 'active' | 'suspended' | 'retired';
  metrics: ProtocolMetrics;
  createdAt: string;
  updatedAt: string;
}

export type ProtocolCategory =
  | 'diagnostic'
  | 'treatment'
  | 'prevention'
  | 'screening'
  | 'monitoring'
  | 'emergency'
  | 'surgical'
  | 'chronic_management';

export interface PatientCriteria {
  ageRange?: { min?: number; max?: number };
  gender?: 'M' | 'F' | 'any';
  diagnoses?: { code: string; codeSystem: string; required: boolean }[];
  conditions?: string[];
  labValues?: { test: string; operator: 'gt' | 'lt' | 'eq' | 'between'; value: number | [number, number] }[];
  medications?: { drug: string; required: boolean }[];
  allergies?: string[];
  riskFactors?: string[];
  contraindications?: string[];
}

export interface ProtocolStep {
  id: string;
  order: number;
  name: string;
  description: string;
  type: 'assessment' | 'intervention' | 'monitoring' | 'education' | 'referral' | 'decision';
  required: boolean;
  timing?: {
    when: 'immediately' | 'within_hours' | 'within_days' | 'scheduled';
    value?: number;
    unit?: 'hours' | 'days' | 'weeks';
  };
  actions: ProtocolAction[];
  documentation: string[];
  alerts?: StepAlert[];
  nextSteps: string[]; // IDs of possible next steps
  conditions?: StepCondition[];
}

export interface ProtocolAction {
  id: string;
  type: 'order' | 'prescribe' | 'document' | 'educate' | 'refer' | 'monitor' | 'assess';
  description: string;
  details?: Record<string, unknown>;
  codeSystem?: 'CPT' | 'HCPCS' | 'LOINC' | 'RxNorm' | 'SNOMED';
  code?: string;
  required: boolean;
}

export interface StepAlert {
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  action?: string;
}

export interface StepCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'exists';
  value: unknown;
  nextStepId: string;
}

export interface DecisionPoint {
  id: string;
  name: string;
  question: string;
  evaluationType: 'clinical_judgment' | 'algorithmic' | 'hybrid';
  options: DecisionOption[];
  defaultOption?: string;
  clinicalContext: string;
  supportingEvidence: string[];
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  criteria?: PatientCriteria;
  leadsTo: string; // Step ID or protocol endpoint
  rationale: string;
}

export interface ProtocolOutcome {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'safety';
  metric: string;
  target?: { value: number; unit: string };
  measurementMethod: string;
  timeframe: string;
}

export interface Reference {
  type: 'guideline' | 'study' | 'meta-analysis' | 'expert_consensus';
  title: string;
  authors?: string[];
  source: string;
  year: number;
  url?: string;
  doi?: string;
}

export interface ProtocolMetrics {
  totalExecutions: number;
  completionRate: number;
  averageCompletionTime: number;
  outcomeAchievementRate: number;
  deviationRate: number;
  patientSatisfaction?: number;
}

export interface ProtocolExecution {
  id: string;
  protocolId: string;
  protocolVersion: string;
  patientId: string;
  encounterId?: string;
  initiatedBy: string;
  initiatedAt: string;
  status: 'in_progress' | 'completed' | 'abandoned' | 'paused';
  currentStepId: string;
  completedSteps: CompletedStep[];
  decisions: ExecutionDecision[];
  deviations: ProtocolDeviation[];
  outcomes: ExecutionOutcome[];
  notes: ExecutionNote[];
  completedAt?: string;
  abandonedReason?: string;
}

export interface CompletedStep {
  stepId: string;
  completedAt: string;
  completedBy: string;
  actionsPerformed: string[];
  documentedValues?: Record<string, unknown>;
  notes?: string;
}

export interface ExecutionDecision {
  decisionPointId: string;
  selectedOptionId: string;
  decidedBy: string;
  decidedAt: string;
  rationale?: string;
  overrideReason?: string;
}

export interface ProtocolDeviation {
  id: string;
  stepId: string;
  type: 'omission' | 'modification' | 'addition' | 'timing';
  description: string;
  reason: string;
  approvedBy?: string;
  riskAssessment?: string;
  documentedAt: string;
}

export interface ExecutionOutcome {
  outcomeId: string;
  achieved: boolean;
  measuredValue?: number;
  measuredAt: string;
  notes?: string;
}

export interface ExecutionNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface OrderSet {
  id: string;
  name: string;
  description: string;
  protocolId?: string;
  specialty: string;
  indication: string;
  orders: OrderItem[];
  isActive: boolean;
  usageCount: number;
}

export interface OrderItem {
  id: string;
  type: 'medication' | 'lab' | 'imaging' | 'procedure' | 'consult' | 'nursing';
  name: string;
  details: Record<string, unknown>;
  isDefault: boolean;
  alternatives?: string[];
  contraindications?: string[];
  monitoring?: string;
}

// Clinical protocols database
const clinicalProtocols: ClinicalProtocol[] = [
  {
    id: 'prot-001',
    name: 'Gestion de l\'Hypertension Artérielle',
    version: '3.0',
    category: 'chronic_management',
    specialty: 'Cardiologie',
    description: 'Protocole de prise en charge de l\'HTA selon les recommandations ESC/ESH 2023',
    objectives: [
      'Atteindre une PA < 130/80 mmHg chez les patients < 65 ans',
      'Réduire le risque cardiovasculaire à 10 ans',
      'Prévenir les complications organiques'
    ],
    targetPopulation: {
      ageRange: { min: 18 },
      diagnoses: [{ code: 'I10', codeSystem: 'ICD-10', required: true }],
      conditions: ['Hypertension artérielle confirmée']
    },
    exclusionCriteria: {
      conditions: ['Grossesse', 'HTA secondaire non traitée'],
      contraindications: ['Allergie connue aux antihypertenseurs']
    },
    steps: [
      {
        id: 'step-001',
        order: 1,
        name: 'Évaluation initiale',
        description: 'Bilan initial complet du patient hypertendu',
        type: 'assessment',
        required: true,
        timing: { when: 'immediately' },
        actions: [
          { id: 'act-001', type: 'assess', description: 'Mesure PA aux 2 bras', required: true },
          { id: 'act-002', type: 'order', description: 'Bilan biologique standard', code: '80053', codeSystem: 'CPT', required: true },
          { id: 'act-003', type: 'order', description: 'ECG 12 dérivations', code: '93000', codeSystem: 'CPT', required: true },
          { id: 'act-004', type: 'assess', description: 'Calcul score SCORE2', required: true }
        ],
        documentation: ['Valeurs PA', 'Résultats bilan', 'Score de risque'],
        alerts: [
          { condition: 'PA > 180/110', severity: 'critical', message: 'HTA sévère - Évaluer urgence hypertensive' }
        ],
        nextSteps: ['step-002']
      },
      {
        id: 'step-002',
        order: 2,
        name: 'Stratification du risque',
        description: 'Évaluation du risque cardiovasculaire global',
        type: 'decision',
        required: true,
        actions: [
          { id: 'act-005', type: 'assess', description: 'Évaluer atteinte organes cibles', required: true },
          { id: 'act-006', type: 'document', description: 'Documenter facteurs de risque', required: true }
        ],
        documentation: ['Niveau de risque', 'Atteintes organiques'],
        nextSteps: ['step-003', 'step-004'],
        conditions: [
          { field: 'riskLevel', operator: 'eq', value: 'high', nextStepId: 'step-003' },
          { field: 'riskLevel', operator: 'eq', value: 'low', nextStepId: 'step-004' }
        ]
      },
      {
        id: 'step-003',
        order: 3,
        name: 'Traitement intensif',
        description: 'Initiation traitement pharmacologique immédiat',
        type: 'intervention',
        required: false,
        timing: { when: 'immediately' },
        actions: [
          { id: 'act-007', type: 'prescribe', description: 'Bithérapie initiale (IEC/ARA2 + CCB ou diurétique)', required: true },
          { id: 'act-008', type: 'educate', description: 'Éducation thérapeutique', required: true }
        ],
        documentation: ['Prescription', 'Objectifs PA communiqués'],
        nextSteps: ['step-005']
      },
      {
        id: 'step-004',
        order: 3,
        name: 'Mesures hygiéno-diététiques',
        description: 'Période de modifications du style de vie',
        type: 'intervention',
        required: false,
        timing: { when: 'within_days', value: 90, unit: 'days' },
        actions: [
          { id: 'act-009', type: 'educate', description: 'Régime DASH', required: true },
          { id: 'act-010', type: 'educate', description: 'Activité physique', required: true },
          { id: 'act-011', type: 'monitor', description: 'Auto-mesure tensionnelle', required: true }
        ],
        documentation: ['Conseils donnés', 'Objectifs fixés'],
        nextSteps: ['step-005']
      },
      {
        id: 'step-005',
        order: 4,
        name: 'Suivi et ajustement',
        description: 'Réévaluation et titration du traitement',
        type: 'monitoring',
        required: true,
        timing: { when: 'scheduled', value: 4, unit: 'weeks' },
        actions: [
          { id: 'act-012', type: 'assess', description: 'Contrôle PA', required: true },
          { id: 'act-013', type: 'assess', description: 'Évaluer tolérance', required: true },
          { id: 'act-014', type: 'assess', description: 'Vérifier observance', required: true }
        ],
        documentation: ['PA atteinte', 'Effets secondaires', 'Observance'],
        alerts: [
          { condition: 'PA > cible après 3 mois', severity: 'warning', message: 'Envisager intensification' }
        ],
        nextSteps: []
      }
    ],
    decisionPoints: [
      {
        id: 'dp-001',
        name: 'Choix thérapeutique initial',
        question: 'Quel traitement initier en première intention?',
        evaluationType: 'algorithmic',
        options: [
          {
            id: 'opt-001',
            label: 'Monothérapie',
            description: 'HTA grade 1 sans atteinte organique',
            criteria: { conditions: ['PA 140-159/90-99', 'Pas d\'AOC'] },
            leadsTo: 'step-004',
            rationale: 'Recommandation ESC pour HTA grade 1 à risque faible-modéré'
          },
          {
            id: 'opt-002',
            label: 'Bithérapie',
            description: 'HTA grade 2-3 ou risque élevé',
            criteria: { conditions: ['PA >= 160/100 ou AOC'] },
            leadsTo: 'step-003',
            rationale: 'Meilleur contrôle initial et réduction plus rapide du risque'
          }
        ],
        clinicalContext: 'Le choix dépend du niveau tensionnel et du risque CV global',
        supportingEvidence: ['ESC/ESH Guidelines 2023', 'SPRINT Trial', 'VALUE Trial']
      }
    ],
    outcomes: [
      {
        id: 'out-001',
        name: 'Contrôle tensionnel',
        type: 'primary',
        metric: 'PA < 130/80 mmHg',
        target: { value: 130, unit: 'mmHg systolique' },
        measurementMethod: 'Moyenne de 3 mesures au cabinet',
        timeframe: '3-6 mois'
      },
      {
        id: 'out-002',
        name: 'Réduction risque CV',
        type: 'primary',
        metric: 'Réduction SCORE2',
        measurementMethod: 'Recalcul annuel',
        timeframe: '12 mois'
      }
    ],
    evidenceLevel: 'A',
    recommendationStrength: 'strong',
    references: [
      {
        type: 'guideline',
        title: '2023 ESH Guidelines for the management of arterial hypertension',
        source: 'Journal of Hypertension',
        year: 2023,
        doi: '10.1097/HJH.0000000000003480'
      }
    ],
    authors: ['Dr. Marie Dupont', 'Dr. Jean Martin'],
    approvedBy: 'Comité des protocoles médicaux',
    approvalDate: '2024-01-01',
    effectiveDate: '2024-01-15',
    reviewDate: '2025-01-15',
    status: 'active',
    metrics: {
      totalExecutions: 245,
      completionRate: 0.87,
      averageCompletionTime: 180,
      outcomeAchievementRate: 0.72,
      deviationRate: 0.15,
      patientSatisfaction: 4.2
    },
    createdAt: '2023-11-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

// Order sets
const orderSets: OrderSet[] = [
  {
    id: 'os-001',
    name: 'Bilan HTA Initial',
    description: 'Ordonnances standards pour le bilan initial d\'une HTA',
    protocolId: 'prot-001',
    specialty: 'Cardiologie',
    indication: 'Hypertension artérielle nouvellement diagnostiquée',
    orders: [
      {
        id: 'ord-001',
        type: 'lab',
        name: 'Bilan métabolique complet',
        details: { tests: ['Na', 'K', 'Créatinine', 'Glycémie', 'Bilan lipidique'] },
        isDefault: true
      },
      {
        id: 'ord-002',
        type: 'lab',
        name: 'NFS',
        details: {},
        isDefault: true
      },
      {
        id: 'ord-003',
        type: 'lab',
        name: 'Microalbuminurie',
        details: { ratio: 'Albumine/Créatinine' },
        isDefault: true
      },
      {
        id: 'ord-004',
        type: 'procedure',
        name: 'ECG 12 dérivations',
        details: {},
        isDefault: true
      },
      {
        id: 'ord-005',
        type: 'imaging',
        name: 'Échocardiographie',
        details: { indication: 'Recherche HVG' },
        isDefault: false
      },
      {
        id: 'ord-006',
        type: 'procedure',
        name: 'MAPA 24h',
        details: {},
        isDefault: false,
        alternatives: ['Auto-mesure tensionnelle sur 7 jours']
      }
    ],
    isActive: true,
    usageCount: 156
  }
];

// In-memory storage for executions
const protocolExecutions: ProtocolExecution[] = [];

export class ClinicalProtocolsService {

  // Get all protocols
  getProtocols(options?: {
    category?: ProtocolCategory;
    specialty?: string;
    status?: ClinicalProtocol['status'];
    search?: string;
  }): ClinicalProtocol[] {
    let results = [...clinicalProtocols];

    if (options?.category) {
      results = results.filter(p => p.category === options.category);
    }

    if (options?.specialty) {
      results = results.filter(p =>
        p.specialty.toLowerCase().includes(options.specialty!.toLowerCase())
      );
    }

    if (options?.status) {
      results = results.filter(p => p.status === options.status);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    return results;
  }

  // Get protocol by ID
  getProtocol(protocolId: string): ClinicalProtocol | undefined {
    return clinicalProtocols.find(p => p.id === protocolId);
  }

  // Check if patient is eligible for protocol
  checkEligibility(protocolId: string, patientData: {
    age: number;
    gender: 'M' | 'F';
    diagnoses: { code: string; codeSystem: string }[];
    conditions?: string[];
    labValues?: { test: string; value: number }[];
    medications?: string[];
    allergies?: string[];
  }): {
    isEligible: boolean;
    metCriteria: string[];
    unmetCriteria: string[];
    exclusions: string[];
  } {
    const protocol = this.getProtocol(protocolId);
    if (!protocol) throw new Error('Protocol not found');

    const metCriteria: string[] = [];
    const unmetCriteria: string[] = [];
    const exclusions: string[] = [];

    const target = protocol.targetPopulation;
    const exclude = protocol.exclusionCriteria;

    // Check age
    if (target.ageRange) {
      if (target.ageRange.min && patientData.age < target.ageRange.min) {
        unmetCriteria.push(`Âge minimum requis: ${target.ageRange.min} ans`);
      } else if (target.ageRange.max && patientData.age > target.ageRange.max) {
        unmetCriteria.push(`Âge maximum: ${target.ageRange.max} ans`);
      } else {
        metCriteria.push('Critère d\'âge respecté');
      }
    }

    // Check gender
    if (target.gender && target.gender !== 'any' && target.gender !== patientData.gender) {
      unmetCriteria.push(`Genre requis: ${target.gender}`);
    }

    // Check required diagnoses
    if (target.diagnoses) {
      for (const reqDiag of target.diagnoses.filter(d => d.required)) {
        const hasDiagnosis = patientData.diagnoses.some(
          d => d.code === reqDiag.code && d.codeSystem === reqDiag.codeSystem
        );
        if (hasDiagnosis) {
          metCriteria.push(`Diagnostic ${reqDiag.code} présent`);
        } else {
          unmetCriteria.push(`Diagnostic ${reqDiag.code} requis`);
        }
      }
    }

    // Check exclusions
    if (exclude.conditions && patientData.conditions) {
      for (const excCondition of exclude.conditions) {
        if (patientData.conditions.some(c => c.toLowerCase().includes(excCondition.toLowerCase()))) {
          exclusions.push(`Critère d'exclusion: ${excCondition}`);
        }
      }
    }

    if (exclude.allergies && patientData.allergies) {
      for (const excAllergy of exclude.allergies) {
        if (patientData.allergies.some(a => a.toLowerCase().includes(excAllergy.toLowerCase()))) {
          exclusions.push(`Allergie excluante: ${excAllergy}`);
        }
      }
    }

    const isEligible = unmetCriteria.length === 0 && exclusions.length === 0;

    return { isEligible, metCriteria, unmetCriteria, exclusions };
  }

  // Start protocol execution
  async startProtocol(data: {
    protocolId: string;
    patientId: string;
    encounterId?: string;
    initiatedBy: string;
  }): Promise<ProtocolExecution> {
    const protocol = this.getProtocol(data.protocolId);
    if (!protocol) throw new Error('Protocol not found');

    if (protocol.status !== 'active') {
      throw new Error('Protocol is not active');
    }

    const firstStep = protocol.steps.find(s => s.order === 1);
    if (!firstStep) throw new Error('Protocol has no initial step');

    const execution: ProtocolExecution = {
      id: `exec-${Date.now()}`,
      protocolId: protocol.id,
      protocolVersion: protocol.version,
      patientId: data.patientId,
      encounterId: data.encounterId,
      initiatedBy: data.initiatedBy,
      initiatedAt: new Date().toISOString(),
      status: 'in_progress',
      currentStepId: firstStep.id,
      completedSteps: [],
      decisions: [],
      deviations: [],
      outcomes: [],
      notes: []
    };

    protocolExecutions.push(execution);
    return execution;
  }

  // Complete a protocol step
  async completeStep(executionId: string, data: {
    stepId: string;
    completedBy: string;
    actionsPerformed: string[];
    documentedValues?: Record<string, unknown>;
    notes?: string;
  }): Promise<ProtocolExecution> {
    const execution = this.getExecution(executionId);
    if (!execution) throw new Error('Execution not found');

    const protocol = this.getProtocol(execution.protocolId);
    if (!protocol) throw new Error('Protocol not found');

    const step = protocol.steps.find(s => s.id === data.stepId);
    if (!step) throw new Error('Step not found');

    // Validate required actions
    const requiredActions = step.actions.filter(a => a.required).map(a => a.id);
    const missingActions = requiredActions.filter(a => !data.actionsPerformed.includes(a));

    if (missingActions.length > 0 && !data.notes?.includes('deviation')) {
      throw new Error(`Missing required actions: ${missingActions.join(', ')}`);
    }

    execution.completedSteps.push({
      stepId: data.stepId,
      completedAt: new Date().toISOString(),
      completedBy: data.completedBy,
      actionsPerformed: data.actionsPerformed,
      documentedValues: data.documentedValues,
      notes: data.notes
    });

    // Determine next step
    if (step.nextSteps.length > 0) {
      if (step.conditions && data.documentedValues) {
        // Evaluate conditions to find next step
        for (const condition of step.conditions) {
          const value = data.documentedValues[condition.field];
          if (this.evaluateCondition(value, condition.operator, condition.value)) {
            execution.currentStepId = condition.nextStepId;
            break;
          }
        }
      } else {
        execution.currentStepId = step.nextSteps[0];
      }
    } else {
      // No more steps - check if protocol is complete
      const allRequired = protocol.steps.filter(s => s.required);
      const allCompleted = allRequired.every(s =>
        execution.completedSteps.some(cs => cs.stepId === s.id)
      );

      if (allCompleted) {
        execution.status = 'completed';
        execution.completedAt = new Date().toISOString();
      }
    }

    return execution;
  }

  // Record a clinical decision
  async recordDecision(executionId: string, data: {
    decisionPointId: string;
    selectedOptionId: string;
    decidedBy: string;
    rationale?: string;
    overrideReason?: string;
  }): Promise<ProtocolExecution> {
    const execution = this.getExecution(executionId);
    if (!execution) throw new Error('Execution not found');

    execution.decisions.push({
      decisionPointId: data.decisionPointId,
      selectedOptionId: data.selectedOptionId,
      decidedBy: data.decidedBy,
      decidedAt: new Date().toISOString(),
      rationale: data.rationale,
      overrideReason: data.overrideReason
    });

    return execution;
  }

  // Record protocol deviation
  async recordDeviation(executionId: string, data: {
    stepId: string;
    type: ProtocolDeviation['type'];
    description: string;
    reason: string;
    approvedBy?: string;
    riskAssessment?: string;
  }): Promise<ProtocolExecution> {
    const execution = this.getExecution(executionId);
    if (!execution) throw new Error('Execution not found');

    execution.deviations.push({
      id: `dev-${Date.now()}`,
      stepId: data.stepId,
      type: data.type,
      description: data.description,
      reason: data.reason,
      approvedBy: data.approvedBy,
      riskAssessment: data.riskAssessment,
      documentedAt: new Date().toISOString()
    });

    return execution;
  }

  // Record outcome measurement
  async recordOutcome(executionId: string, data: {
    outcomeId: string;
    achieved: boolean;
    measuredValue?: number;
    notes?: string;
  }): Promise<ProtocolExecution> {
    const execution = this.getExecution(executionId);
    if (!execution) throw new Error('Execution not found');

    execution.outcomes.push({
      outcomeId: data.outcomeId,
      achieved: data.achieved,
      measuredValue: data.measuredValue,
      measuredAt: new Date().toISOString(),
      notes: data.notes
    });

    return execution;
  }

  // Get execution by ID
  getExecution(executionId: string): ProtocolExecution | undefined {
    return protocolExecutions.find(e => e.id === executionId);
  }

  // Get patient's protocol history
  getPatientProtocolHistory(patientId: string): ProtocolExecution[] {
    return protocolExecutions
      .filter(e => e.patientId === patientId)
      .sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime());
  }

  // Get order sets
  getOrderSets(options?: {
    specialty?: string;
    protocolId?: string;
  }): OrderSet[] {
    let results = orderSets.filter(os => os.isActive);

    if (options?.specialty) {
      results = results.filter(os =>
        os.specialty.toLowerCase().includes(options.specialty!.toLowerCase())
      );
    }

    if (options?.protocolId) {
      results = results.filter(os => os.protocolId === options.protocolId);
    }

    return results;
  }

  // Get order set by ID
  getOrderSet(orderSetId: string): OrderSet | undefined {
    return orderSets.find(os => os.id === orderSetId);
  }

  // Execute order set (create orders from template)
  async executeOrderSet(orderSetId: string, data: {
    patientId: string;
    orderedBy: string;
    encounterId?: string;
    selectedOrders: string[];
    modifications?: Record<string, Record<string, unknown>>;
  }): Promise<{
    success: boolean;
    ordersCreated: { orderId: string; type: string; name: string }[];
  }> {
    const orderSet = this.getOrderSet(orderSetId);
    if (!orderSet) throw new Error('Order set not found');

    const ordersCreated: { orderId: string; type: string; name: string }[] = [];

    for (const orderId of data.selectedOrders) {
      const order = orderSet.orders.find(o => o.id === orderId);
      if (order) {
        const newOrderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        ordersCreated.push({
          orderId: newOrderId,
          type: order.type,
          name: order.name
        });
      }
    }

    // Update usage count
    orderSet.usageCount++;

    return { success: true, ordersCreated };
  }

  // Get protocol analytics
  getProtocolAnalytics(protocolId: string): {
    executions: number;
    completionRate: number;
    averageDuration: number;
    outcomeAchievement: Record<string, number>;
    commonDeviations: { type: string; count: number; reasons: string[] }[];
    stepCompletionRates: { stepId: string; stepName: string; rate: number }[];
  } {
    const protocol = this.getProtocol(protocolId);
    if (!protocol) throw new Error('Protocol not found');

    const executions = protocolExecutions.filter(e => e.protocolId === protocolId);
    const completed = executions.filter(e => e.status === 'completed');

    // Calculate step completion rates
    const stepRates = protocol.steps.map(step => {
      const completedCount = executions.filter(e =>
        e.completedSteps.some(cs => cs.stepId === step.id)
      ).length;
      return {
        stepId: step.id,
        stepName: step.name,
        rate: executions.length > 0 ? completedCount / executions.length : 0
      };
    });

    // Calculate outcome achievement
    const outcomeAchievement: Record<string, number> = {};
    for (const outcome of protocol.outcomes) {
      const achieved = completed.filter(e =>
        e.outcomes.some(o => o.outcomeId === outcome.id && o.achieved)
      ).length;
      outcomeAchievement[outcome.name] = completed.length > 0 ? achieved / completed.length : 0;
    }

    // Analyze deviations
    const deviationMap: Record<string, { count: number; reasons: Set<string> }> = {};
    for (const exec of executions) {
      for (const dev of exec.deviations) {
        if (!deviationMap[dev.type]) {
          deviationMap[dev.type] = { count: 0, reasons: new Set() };
        }
        deviationMap[dev.type].count++;
        deviationMap[dev.type].reasons.add(dev.reason);
      }
    }

    return {
      executions: executions.length,
      completionRate: executions.length > 0 ? completed.length / executions.length : 0,
      averageDuration: protocol.metrics.averageCompletionTime,
      outcomeAchievement,
      commonDeviations: Object.entries(deviationMap).map(([type, data]) => ({
        type,
        count: data.count,
        reasons: Array.from(data.reasons)
      })),
      stepCompletionRates: stepRates
    };
  }

  // Helper method
  private evaluateCondition(value: unknown, operator: string, target: unknown): boolean {
    switch (operator) {
      case 'eq': return value === target;
      case 'neq': return value !== target;
      case 'gt': return typeof value === 'number' && typeof target === 'number' && value > target;
      case 'lt': return typeof value === 'number' && typeof target === 'number' && value < target;
      case 'contains': return typeof value === 'string' && typeof target === 'string' && value.includes(target);
      case 'exists': return value !== undefined && value !== null;
      default: return false;
    }
  }
}
