/**
 * Antimicrobial Stewardship Service (Antibiogouvernance)
 * Comprehensive antibiotic stewardship program management
 * Supports protocol management, surveillance, audits, and resistance monitoring
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AntimicrobialProtocol {
  id: string;
  code: string;
  name: string;
  indication: string;
  infectionType: InfectionType;
  severity: 'mild' | 'moderate' | 'severe' | 'sepsis';
  setting: 'community' | 'hospital' | 'icu' | 'surgical_prophylaxis';
  patientPopulation: 'adult' | 'pediatric' | 'neonatal' | 'geriatric' | 'immunocompromised';
  empiricTherapy: EmpericTherapyLine[];
  targetedTherapy: TargetedTherapy[];
  duration: DurationGuideline;
  deEscalationCriteria: string[];
  switchToOralCriteria: string[];
  monitoringRequirements: MonitoringRequirement[];
  contraindications: string[];
  specialConsiderations: string[];
  references: string[];
  version: string;
  status: 'draft' | 'under_review' | 'approved' | 'archived';
  approvedBy?: string;
  approvedAt?: Date;
  effectiveDate?: Date;
  reviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type InfectionType =
  | 'respiratory_cap' // Community-acquired pneumonia
  | 'respiratory_hap' // Hospital-acquired pneumonia
  | 'respiratory_vap' // Ventilator-associated pneumonia
  | 'urinary' // Urinary tract infection
  | 'skin_soft_tissue' // Skin and soft tissue infection
  | 'intra_abdominal' // Intra-abdominal infection
  | 'bloodstream' // Bloodstream infection
  | 'bone_joint' // Bone and joint infection
  | 'cns' // Central nervous system infection
  | 'endocarditis' // Infective endocarditis
  | 'surgical_prophylaxis' // Surgical prophylaxis
  | 'febrile_neutropenia' // Febrile neutropenia
  | 'sepsis' // Sepsis/Septic shock
  | 'other';

export interface EmpericTherapyLine {
  line: number; // 1 = first-line, 2 = second-line, etc.
  condition?: string; // When to use this line
  regimens: AntibioticRegimen[];
}

export interface AntibioticRegimen {
  antibiotics: AntibioticDose[];
  duration?: string;
  notes?: string;
}

export interface AntibioticDose {
  drugName: string;
  atcCode?: string;
  dose: string;
  route: 'iv' | 'po' | 'im' | 'nebulized' | 'topical';
  frequency: string;
  adjustments?: DoseAdjustment[];
}

export interface DoseAdjustment {
  condition: 'renal' | 'hepatic' | 'weight' | 'age' | 'interaction';
  criteria: string;
  adjustedDose: string;
}

export interface TargetedTherapy {
  pathogen: string;
  susceptibility: string;
  preferredRegimen: AntibioticRegimen;
  alternativeRegimens?: AntibioticRegimen[];
  notes?: string;
}

export interface DurationGuideline {
  standard: string;
  shortCourse?: string;
  prolonged?: string;
  criteria: { condition: string; duration: string }[];
}

export interface MonitoringRequirement {
  parameter: string;
  frequency: string;
  target?: string;
  action?: string;
}

export interface AntibioticPrescription {
  id: string;
  patientId: string;
  encounterId: string;
  prescriberId: string;
  antibiotics: PrescribedAntibiotic[];
  indication: string;
  infectionSite?: string;
  clinicalSyndrome?: InfectionType;
  severity?: 'mild' | 'moderate' | 'severe' | 'sepsis';
  prescriptionType: 'empiric' | 'targeted' | 'prophylactic';
  protocolId?: string;
  protocolCompliant?: boolean;
  deviationReason?: string;
  startDate: Date;
  plannedDuration: number; // days
  actualEndDate?: Date;
  status: 'active' | 'completed' | 'discontinued' | 'switched';
  switchedToId?: string;
  reviewRequired: boolean;
  reviewDueDate?: Date;
  reviews: PrescriptionReview[];
  cultureResultId?: string;
  susceptibilityId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrescribedAntibiotic {
  drugName: string;
  atcCode?: string;
  dose: string;
  route: 'iv' | 'po' | 'im' | 'nebulized' | 'topical';
  frequency: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'discontinued';
  discontinuationReason?: string;
}

export interface PrescriptionReview {
  id: string;
  prescriptionId: string;
  reviewDate: Date;
  reviewerId: string;
  reviewType: '48h' | '72h' | 'culture_result' | 'stewardship_audit' | 'duration' | 'ad_hoc';
  recommendation: ReviewRecommendation;
  rationale: string;
  accepted?: boolean;
  acceptedBy?: string;
  acceptedAt?: Date;
  outcome?: string;
}

export type ReviewRecommendation =
  | 'continue'
  | 'de_escalate'
  | 'escalate'
  | 'switch_to_oral'
  | 'stop'
  | 'extend'
  | 'shorten'
  | 'change_dose'
  | 'add_antibiotic'
  | 'remove_antibiotic'
  | 'id_consult';

export interface RestrictedAntibiotic {
  id: string;
  drugName: string;
  atcCode: string;
  category: 'access' | 'watch' | 'reserve'; // WHO AWaRe classification
  restrictionLevel: 'unrestricted' | 'restricted' | 'highly_restricted';
  approvalRequired: boolean;
  approvers: string[];
  approvedIndications: string[];
  maxDurationWithoutReapproval: number; // days
  specialRequirements?: string[];
  alternativesAvailable: string[];
  cost?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AntibioticApproval {
  id: string;
  prescriptionId: string;
  antibioticId: string;
  requestedBy: string;
  requestedAt: Date;
  indication: string;
  justification: string;
  duration: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  conditions?: string[];
  expiresAt?: Date;
  createdAt: Date;
}

export interface ResistanceData {
  id: string;
  facilityId: string;
  period: { start: Date; end: Date };
  pathogen: string;
  specimenType?: string;
  location?: string;
  antibioticSusceptibilities: SusceptibilityRate[];
  sampleSize: number;
  mdroCount: number;
  mdroRate: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  createdAt: Date;
}

export interface SusceptibilityRate {
  antibiotic: string;
  susceptible: number;
  intermediate: number;
  resistant: number;
  total: number;
  susceptibilityRate: number;
}

export interface Antibiogram {
  id: string;
  facilityId: string;
  year: number;
  quarter?: number;
  type: 'cumulative' | 'unit_specific' | 'specimen_specific';
  unit?: string;
  specimenType?: string;
  organisms: OrganismAntibiogram[];
  generatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  publishedAt?: Date;
  documentUrl?: string;
}

export interface OrganismAntibiogram {
  organism: string;
  isolateCount: number;
  antibiotics: { antibiotic: string; susceptibilityRate: number; interpretation?: string }[];
  footnotes?: string[];
}

export interface ConsumptionData {
  id: string;
  facilityId: string;
  period: { start: Date; end: Date };
  unit?: string;
  antibiotic: string;
  atcCode: string;
  quantity: number;
  ddd: number; // Defined Daily Doses
  dddPer1000PatientDays: number;
  dddPer1000Admissions?: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  benchmark?: number;
  createdAt: Date;
}

export interface StewardshipAudit {
  id: string;
  facilityId: string;
  auditDate: Date;
  auditType: 'prospective' | 'retrospective' | 'point_prevalence';
  auditorId: string;
  scope: { units?: string[]; patientCount?: number };
  prescriptionsReviewed: number;
  findings: AuditFinding[];
  summary: AuditSummary;
  recommendations: string[];
  actionPlan?: StewardshipActionPlan;
  status: 'in_progress' | 'completed' | 'reviewed';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditFinding {
  prescriptionId: string;
  category: 'appropriate' | 'suboptimal' | 'inappropriate' | 'not_indicated';
  issues?: AuditIssue[];
  recommendation?: ReviewRecommendation;
  notes?: string;
}

export interface AuditIssue {
  type: 'indication' | 'spectrum' | 'dose' | 'duration' | 'route' | 'de_escalation' | 'culture' | 'documentation';
  description: string;
  severity: 'minor' | 'moderate' | 'major';
}

export interface AuditSummary {
  totalPrescriptions: number;
  appropriate: number;
  suboptimal: number;
  inappropriate: number;
  notIndicated: number;
  appropriatenessRate: number;
  commonIssues: { type: string; count: number }[];
  byUnit?: { unit: string; appropriatenessRate: number }[];
}

export interface StewardshipActionPlan {
  id: string;
  auditId?: string;
  title: string;
  objectives: string[];
  actions: StewardshipAction[];
  metrics: StewardshipMetric[];
  startDate: Date;
  targetEndDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'on_hold';
  responsiblePerson: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StewardshipAction {
  id: string;
  planId: string;
  description: string;
  type: 'education' | 'protocol' | 'technology' | 'restriction' | 'feedback' | 'other';
  responsible: string;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed';
  completedDate?: Date;
  outcome?: string;
}

export interface StewardshipMetric {
  name: string;
  baseline: number;
  target: number;
  current?: number;
  unit: string;
  measurementFrequency: string;
  lastMeasuredAt?: Date;
}

export interface StewardshipAlert {
  id: string;
  type: 'duration_exceeded' | 'restricted_antibiotic' | 'culture_result' | 'de_escalation_opportunity' | 'iv_to_po' | 'duplicate_therapy' | 'interaction' | 'resistance';
  prescriptionId?: string;
  patientId: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolution?: string;
  resolvedAt?: Date;
}

export interface StewardshipDashboard {
  facilityId: string;
  period: { start: Date; end: Date };
  summary: {
    activePrescriptions: number;
    pendingReviews: number;
    pendingApprovals: number;
    activeAlerts: number;
    appropriatenessRate: number;
    dddPer1000PatientDays: number;
  };
  consumptionTrend: { date: string; ddd: number }[];
  topAntibiotics: { name: string; ddd: number; trend: string }[];
  resistanceTrend: { pathogen: string; rates: { date: string; rate: number }[] }[];
  recentAudits: StewardshipAudit[];
  actionPlanProgress: { plan: string; progress: number }[];
}

// ============================================================================
// Antimicrobial Stewardship Service Class
// ============================================================================

export class AntimicrobialStewardshipService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ---------------------------------------------------------------------------
  // Protocol Management
  // ---------------------------------------------------------------------------

  async createProtocol(data: Omit<AntimicrobialProtocol, 'id' | 'createdAt' | 'updatedAt'>): Promise<AntimicrobialProtocol> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getProtocol(protocolId: string): Promise<AntimicrobialProtocol | null> {
    // TODO: Implement database query
    return null;
  }

  async getProtocolByCode(code: string): Promise<AntimicrobialProtocol | null> {
    // TODO: Implement database query
    return null;
  }

  async listProtocols(filters?: {
    infectionType?: InfectionType;
    setting?: AntimicrobialProtocol['setting'];
    status?: AntimicrobialProtocol['status'];
  }): Promise<AntimicrobialProtocol[]> {
    // TODO: Implement database query
    return [];
  }

  async findProtocolForIndication(infectionType: InfectionType, setting: string, severity: string): Promise<AntimicrobialProtocol | null> {
    // TODO: Find matching protocol
    return null;
  }

  async updateProtocol(protocolId: string, updates: Partial<AntimicrobialProtocol>): Promise<AntimicrobialProtocol> {
    // TODO: Implement database update
    return {} as AntimicrobialProtocol;
  }

  async approveProtocol(protocolId: string, approvedBy: string): Promise<AntimicrobialProtocol> {
    // TODO: Approve protocol
    return {} as AntimicrobialProtocol;
  }

  async archiveProtocol(protocolId: string): Promise<AntimicrobialProtocol> {
    // TODO: Archive protocol
    return {} as AntimicrobialProtocol;
  }

  async getProtocolsDueForReview(daysAhead: number): Promise<AntimicrobialProtocol[]> {
    // TODO: Get protocols with review date approaching
    return [];
  }

  // ---------------------------------------------------------------------------
  // Prescription Management
  // ---------------------------------------------------------------------------

  async createPrescription(data: Omit<AntibioticPrescription, 'id' | 'reviews' | 'createdAt' | 'updatedAt'>): Promise<AntibioticPrescription> {
    const id = crypto.randomUUID();
    const now = new Date();

    // Check protocol compliance
    const protocolCompliance = await this.checkProtocolCompliance(data);

    // Check if restricted antibiotics need approval
    const needsApproval = await this.checkRestrictedAntibiotics(data.antibiotics);

    const prescription: AntibioticPrescription = {
      ...data,
      id,
      protocolCompliant: protocolCompliance.compliant,
      deviationReason: protocolCompliance.deviationReason,
      reviewRequired: needsApproval || data.prescriptionType === 'empiric',
      reviewDueDate: this.calculateReviewDueDate(data.startDate, data.prescriptionType),
      reviews: [],
      createdAt: now,
      updatedAt: now,
    };

    // Generate alerts if needed
    if (needsApproval) {
      await this.createAlert({
        type: 'restricted_antibiotic',
        prescriptionId: id,
        patientId: data.patientId,
        message: 'Prescription contains restricted antibiotic requiring approval',
        severity: 'warning',
        status: 'active',
        createdAt: now,
      });
    }

    return prescription;
  }

  private async checkProtocolCompliance(prescription: Omit<AntibioticPrescription, 'id' | 'reviews' | 'createdAt' | 'updatedAt'>): Promise<{ compliant: boolean; deviationReason?: string }> {
    if (!prescription.clinicalSyndrome) {
      return { compliant: false, deviationReason: 'No clinical syndrome specified' };
    }

    const protocol = await this.findProtocolForIndication(
      prescription.clinicalSyndrome,
      'hospital',
      prescription.severity || 'moderate'
    );

    if (!protocol) {
      return { compliant: true }; // No protocol exists for this indication
    }

    // TODO: Check if prescribed antibiotics match protocol
    return { compliant: true };
  }

  private async checkRestrictedAntibiotics(antibiotics: PrescribedAntibiotic[]): Promise<boolean> {
    for (const antibiotic of antibiotics) {
      const restricted = await this.getRestrictedAntibiotic(antibiotic.drugName);
      if (restricted && restricted.approvalRequired) {
        return true;
      }
    }
    return false;
  }

  private calculateReviewDueDate(startDate: Date, type: AntibioticPrescription['prescriptionType']): Date {
    const reviewDate = new Date(startDate);
    if (type === 'empiric') {
      reviewDate.setHours(reviewDate.getHours() + 48); // 48h review
    } else {
      reviewDate.setDate(reviewDate.getDate() + 3); // 72h review
    }
    return reviewDate;
  }

  async getPrescription(prescriptionId: string): Promise<AntibioticPrescription | null> {
    // TODO: Implement database query
    return null;
  }

  async getPatientPrescriptions(patientId: string, status?: AntibioticPrescription['status']): Promise<AntibioticPrescription[]> {
    // TODO: Implement database query
    return [];
  }

  async getActivePrescriptions(unitId?: string): Promise<AntibioticPrescription[]> {
    // TODO: Get all active prescriptions
    return [];
  }

  async getPrescriptionsDueForReview(): Promise<AntibioticPrescription[]> {
    // TODO: Get prescriptions with pending reviews
    return [];
  }

  async updatePrescription(prescriptionId: string, updates: Partial<AntibioticPrescription>): Promise<AntibioticPrescription> {
    // TODO: Implement database update
    return {} as AntibioticPrescription;
  }

  async discontinuePrescription(prescriptionId: string, reason: string): Promise<AntibioticPrescription> {
    // TODO: Discontinue prescription
    return {} as AntibioticPrescription;
  }

  async switchAntibiotic(prescriptionId: string, newAntibiotics: PrescribedAntibiotic[], reason: string): Promise<AntibioticPrescription> {
    // TODO: Switch to new antibiotic regimen
    return {} as AntibioticPrescription;
  }

  // ---------------------------------------------------------------------------
  // Prescription Reviews
  // ---------------------------------------------------------------------------

  async addPrescriptionReview(prescriptionId: string, review: Omit<PrescriptionReview, 'id' | 'prescriptionId'>): Promise<PrescriptionReview> {
    const id = crypto.randomUUID();
    return {
      ...review,
      id,
      prescriptionId,
    };
  }

  async acceptReviewRecommendation(reviewId: string, acceptedBy: string): Promise<PrescriptionReview> {
    // TODO: Accept recommendation and update prescription
    return {} as PrescriptionReview;
  }

  async getReviewHistory(prescriptionId: string): Promise<PrescriptionReview[]> {
    // TODO: Get all reviews for prescription
    return [];
  }

  // ---------------------------------------------------------------------------
  // Restricted Antibiotics
  // ---------------------------------------------------------------------------

  async createRestrictedAntibiotic(data: Omit<RestrictedAntibiotic, 'id' | 'createdAt' | 'updatedAt'>): Promise<RestrictedAntibiotic> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getRestrictedAntibiotic(drugName: string): Promise<RestrictedAntibiotic | null> {
    // TODO: Implement database query
    return null;
  }

  async listRestrictedAntibiotics(category?: RestrictedAntibiotic['category']): Promise<RestrictedAntibiotic[]> {
    // TODO: Implement database query
    return [];
  }

  async updateRestrictedAntibiotic(antibioticId: string, updates: Partial<RestrictedAntibiotic>): Promise<RestrictedAntibiotic> {
    // TODO: Implement database update
    return {} as RestrictedAntibiotic;
  }

  // ---------------------------------------------------------------------------
  // Antibiotic Approvals
  // ---------------------------------------------------------------------------

  async requestApproval(data: Omit<AntibioticApproval, 'id' | 'createdAt'>): Promise<AntibioticApproval> {
    const id = crypto.randomUUID();
    return {
      ...data,
      id,
      createdAt: new Date(),
    };
  }

  async getApproval(approvalId: string): Promise<AntibioticApproval | null> {
    // TODO: Implement database query
    return null;
  }

  async getPendingApprovals(): Promise<AntibioticApproval[]> {
    // TODO: Get pending approval requests
    return [];
  }

  async reviewApproval(approvalId: string, decision: 'approved' | 'denied', reviewedBy: string, notes?: string, conditions?: string[]): Promise<AntibioticApproval> {
    // TODO: Review approval request
    return {} as AntibioticApproval;
  }

  // ---------------------------------------------------------------------------
  // Resistance Data
  // ---------------------------------------------------------------------------

  async recordResistanceData(data: Omit<ResistanceData, 'id' | 'createdAt'>): Promise<ResistanceData> {
    const id = crypto.randomUUID();
    return {
      ...data,
      id,
      createdAt: new Date(),
    };
  }

  async getResistanceData(facilityId: string, pathogen: string, period: { start: Date; end: Date }): Promise<ResistanceData[]> {
    // TODO: Implement database query
    return [];
  }

  async getResistanceTrends(facilityId: string, pathogens: string[], months: number): Promise<{ pathogen: string; trend: { date: string; rate: number }[] }[]> {
    // TODO: Calculate resistance trends
    return [];
  }

  // ---------------------------------------------------------------------------
  // Antibiogram
  // ---------------------------------------------------------------------------

  async generateAntibiogram(facilityId: string, year: number, options?: { quarter?: number; unit?: string; specimenType?: string }): Promise<Antibiogram> {
    const id = crypto.randomUUID();

    // TODO: Generate antibiogram from culture data
    return {
      id,
      facilityId,
      year,
      quarter: options?.quarter,
      type: options?.unit ? 'unit_specific' : options?.specimenType ? 'specimen_specific' : 'cumulative',
      unit: options?.unit,
      specimenType: options?.specimenType,
      organisms: [],
      generatedAt: new Date(),
    };
  }

  async getAntibiogram(antibiogramId: string): Promise<Antibiogram | null> {
    // TODO: Implement database query
    return null;
  }

  async getCurrentAntibiogram(facilityId: string): Promise<Antibiogram | null> {
    // TODO: Get most recent antibiogram
    return null;
  }

  async approveAntibiogram(antibiogramId: string, approvedBy: string): Promise<Antibiogram> {
    // TODO: Approve antibiogram
    return {} as Antibiogram;
  }

  async publishAntibiogram(antibiogramId: string): Promise<Antibiogram> {
    // TODO: Publish antibiogram
    return {} as Antibiogram;
  }

  // ---------------------------------------------------------------------------
  // Consumption Tracking
  // ---------------------------------------------------------------------------

  async recordConsumption(data: Omit<ConsumptionData, 'id' | 'createdAt'>): Promise<ConsumptionData> {
    const id = crypto.randomUUID();
    return {
      ...data,
      id,
      createdAt: new Date(),
    };
  }

  async getConsumptionData(facilityId: string, period: { start: Date; end: Date }, unit?: string): Promise<ConsumptionData[]> {
    // TODO: Implement database query
    return [];
  }

  async calculateDDD(facilityId: string, period: { start: Date; end: Date }): Promise<{ total: number; per1000PatientDays: number; byAntibiotic: { antibiotic: string; ddd: number }[] }> {
    // TODO: Calculate DDD metrics
    return { total: 0, per1000PatientDays: 0, byAntibiotic: [] };
  }

  async getConsumptionTrends(facilityId: string, months: number): Promise<{ date: string; ddd: number }[]> {
    // TODO: Calculate consumption trends
    return [];
  }

  async compareToNationalBenchmark(facilityId: string, period: { start: Date; end: Date }): Promise<{ antibiotic: string; facility: number; benchmark: number; variance: number }[]> {
    // TODO: Compare to national benchmarks
    return [];
  }

  // ---------------------------------------------------------------------------
  // Stewardship Audits
  // ---------------------------------------------------------------------------

  async createAudit(data: Omit<StewardshipAudit, 'id' | 'findings' | 'summary' | 'createdAt' | 'updatedAt'>): Promise<StewardshipAudit> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      findings: [],
      summary: {
        totalPrescriptions: 0,
        appropriate: 0,
        suboptimal: 0,
        inappropriate: 0,
        notIndicated: 0,
        appropriatenessRate: 0,
        commonIssues: [],
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAudit(auditId: string): Promise<StewardshipAudit | null> {
    // TODO: Implement database query
    return null;
  }

  async listAudits(facilityId: string, status?: StewardshipAudit['status']): Promise<StewardshipAudit[]> {
    // TODO: Implement database query
    return [];
  }

  async addAuditFinding(auditId: string, finding: AuditFinding): Promise<StewardshipAudit> {
    // TODO: Add finding to audit
    return {} as StewardshipAudit;
  }

  async completeAudit(auditId: string, recommendations: string[]): Promise<StewardshipAudit> {
    // TODO: Complete audit and calculate summary
    return {} as StewardshipAudit;
  }

  async calculateAuditSummary(findings: AuditFinding[]): Promise<AuditSummary> {
    const summary: AuditSummary = {
      totalPrescriptions: findings.length,
      appropriate: findings.filter(f => f.category === 'appropriate').length,
      suboptimal: findings.filter(f => f.category === 'suboptimal').length,
      inappropriate: findings.filter(f => f.category === 'inappropriate').length,
      notIndicated: findings.filter(f => f.category === 'not_indicated').length,
      appropriatenessRate: 0,
      commonIssues: [],
    };

    summary.appropriatenessRate = summary.totalPrescriptions > 0
      ? (summary.appropriate / summary.totalPrescriptions) * 100
      : 0;

    // Calculate common issues
    const issueCount: { [key: string]: number } = {};
    for (const finding of findings) {
      if (finding.issues) {
        for (const issue of finding.issues) {
          issueCount[issue.type] = (issueCount[issue.type] || 0) + 1;
        }
      }
    }
    summary.commonIssues = Object.entries(issueCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return summary;
  }

  // ---------------------------------------------------------------------------
  // Action Plans
  // ---------------------------------------------------------------------------

  async createActionPlan(data: Omit<StewardshipActionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<StewardshipActionPlan> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getActionPlan(planId: string): Promise<StewardshipActionPlan | null> {
    // TODO: Implement database query
    return null;
  }

  async listActionPlans(status?: StewardshipActionPlan['status']): Promise<StewardshipActionPlan[]> {
    // TODO: Implement database query
    return [];
  }

  async addPlanAction(planId: string, action: Omit<StewardshipAction, 'id' | 'planId'>): Promise<StewardshipAction> {
    const id = crypto.randomUUID();
    return {
      ...action,
      id,
      planId,
    };
  }

  async updateActionStatus(actionId: string, status: StewardshipAction['status'], outcome?: string): Promise<StewardshipAction> {
    // TODO: Update action status
    return {} as StewardshipAction;
  }

  async updateMetric(planId: string, metricName: string, currentValue: number): Promise<StewardshipActionPlan> {
    // TODO: Update metric value
    return {} as StewardshipActionPlan;
  }

  // ---------------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------------

  async createAlert(alert: Omit<StewardshipAlert, 'id'>): Promise<StewardshipAlert> {
    const id = crypto.randomUUID();
    return {
      ...alert,
      id,
    };
  }

  async getActiveAlerts(patientId?: string): Promise<StewardshipAlert[]> {
    // TODO: Get active alerts
    return [];
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<StewardshipAlert> {
    // TODO: Acknowledge alert
    return {} as StewardshipAlert;
  }

  async resolveAlert(alertId: string, resolution: string): Promise<StewardshipAlert> {
    // TODO: Resolve alert
    return {} as StewardshipAlert;
  }

  async dismissAlert(alertId: string, reason: string): Promise<StewardshipAlert> {
    // TODO: Dismiss alert
    return {} as StewardshipAlert;
  }

  async checkForAlerts(prescriptionId: string): Promise<StewardshipAlert[]> {
    const prescription = await this.getPrescription(prescriptionId);
    if (!prescription) return [];

    const alerts: StewardshipAlert[] = [];
    const now = new Date();

    // Check duration
    const daysOnTherapy = Math.floor((now.getTime() - prescription.startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOnTherapy > prescription.plannedDuration) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'duration_exceeded',
        prescriptionId,
        patientId: prescription.patientId,
        message: `Antibiotic duration exceeded planned ${prescription.plannedDuration} days`,
        severity: 'warning',
        status: 'active',
        createdAt: now,
      });
    }

    // Check for IV to PO opportunity
    if (prescription.antibiotics.some(a => a.route === 'iv' && a.status === 'active')) {
      if (daysOnTherapy >= 2) {
        alerts.push({
          id: crypto.randomUUID(),
          type: 'iv_to_po',
          prescriptionId,
          patientId: prescription.patientId,
          message: 'Consider IV to PO switch if patient clinically stable',
          severity: 'info',
          status: 'active',
          createdAt: now,
        });
      }
    }

    return alerts;
  }

  // ---------------------------------------------------------------------------
  // Dashboard and Reporting
  // ---------------------------------------------------------------------------

  async getStewardshipDashboard(facilityId: string, period: { start: Date; end: Date }): Promise<StewardshipDashboard> {
    // TODO: Generate comprehensive dashboard
    return {
      facilityId,
      period,
      summary: {
        activePrescriptions: 0,
        pendingReviews: 0,
        pendingApprovals: 0,
        activeAlerts: 0,
        appropriatenessRate: 0,
        dddPer1000PatientDays: 0,
      },
      consumptionTrend: [],
      topAntibiotics: [],
      resistanceTrend: [],
      recentAudits: [],
      actionPlanProgress: [],
    };
  }

  async generateMonthlyReport(facilityId: string, month: number, year: number): Promise<{
    consumption: ConsumptionData[];
    resistance: ResistanceData[];
    audits: StewardshipAudit[];
    alerts: { type: string; count: number }[];
    recommendations: string[];
  }> {
    // TODO: Generate monthly stewardship report
    return {
      consumption: [],
      resistance: [],
      audits: [],
      alerts: [],
      recommendations: [],
    };
  }

  async exportForSurveillance(facilityId: string, year: number): Promise<{ format: string; data: string }> {
    // TODO: Export data for national surveillance (e.g., SPARES in France)
    return { format: 'csv', data: '' };
  }
}

// ============================================================================
// Export Service Factory
// ============================================================================

export function createAntimicrobialStewardshipService(db: D1Database): AntimicrobialStewardshipService {
  return new AntimicrobialStewardshipService(db);
}
