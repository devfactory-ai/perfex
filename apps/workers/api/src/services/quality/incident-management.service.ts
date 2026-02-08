/**
 * Incident Management Service - Gestion des Incidents & Événements Indésirables
 *
 * Comprehensive incident reporting, analysis, and quality improvement system
 * Includes CREX (Comité de Retour d'Expérience), root cause analysis, and corrective actions
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Incident {
  id: string;
  organizationId: string;
  incidentNumber: string;
  type: IncidentType;
  category: IncidentCategory;
  severity: SeverityLevel;
  status: IncidentStatus;

  // Event Details
  title: string;
  description: string;
  occurredAt: string;
  discoveredAt: string;
  reportedAt: string;
  location: IncidentLocation;

  // People Involved
  reportedBy: string;
  involvedStaff: InvolvedPerson[];
  involvedPatients: InvolvedPatient[];
  witnesses: Witness[];

  // Impact Assessment
  patientHarm: HarmLevel;
  actualOutcome: string;
  potentialOutcome: string;
  nearMiss: boolean;

  // Classification
  contributingFactors: ContributingFactor[];
  systemFailures: SystemFailure[];
  humanFactors: HumanFactor[];

  // Investigation
  investigation?: Investigation;
  rootCauseAnalysis?: RootCauseAnalysis;

  // Actions
  immediateActions: ImmediateAction[];
  correctiveActions: CorrectiveAction[];
  preventiveActions: PreventiveAction[];

  // Review & Approval
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  crexReview?: CREXReview;

  // Notifications
  notifications: IncidentNotification[];
  regulatoryReport?: RegulatoryReport;

  // Metadata
  tags: string[];
  attachments: Attachment[];
  relatedIncidents: string[];
  lessonsLearned?: string;

  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export type IncidentType =
  | 'adverse_event'           // Événement indésirable
  | 'near_miss'               // Presqu'accident
  | 'medication_error'        // Erreur médicamenteuse
  | 'fall'                    // Chute
  | 'infection'               // Infection nosocomiale
  | 'surgical_complication'   // Complication chirurgicale
  | 'diagnostic_error'        // Erreur de diagnostic
  | 'equipment_failure'       // Défaillance équipement
  | 'communication_failure'   // Défaillance communication
  | 'patient_identification'  // Erreur identification
  | 'blood_transfusion'       // Incident transfusionnel
  | 'pressure_ulcer'          // Escarre
  | 'security'                // Sécurité
  | 'environmental'           // Environnemental
  | 'other';

export type IncidentCategory =
  | 'clinical'                // Soins cliniques
  | 'medication'              // Médicaments
  | 'surgical'                // Chirurgical
  | 'laboratory'              // Laboratoire
  | 'imaging'                 // Imagerie
  | 'equipment'               // Équipement
  | 'infrastructure'          // Infrastructure
  | 'administrative'          // Administratif
  | 'behavioral'              // Comportemental
  | 'security';               // Sécurité

export type SeverityLevel =
  | 'none'        // Aucun impact
  | 'minor'       // Mineur
  | 'moderate'    // Modéré
  | 'major'       // Majeur
  | 'catastrophic'; // Catastrophique

export type IncidentStatus =
  | 'reported'      // Signalé
  | 'acknowledged'  // Pris en compte
  | 'investigating' // En investigation
  | 'analyzed'      // Analysé
  | 'action_plan'   // Plan d'action défini
  | 'implementing'  // En cours de mise en œuvre
  | 'monitoring'    // En surveillance
  | 'closed'        // Clôturé
  | 'reopened';     // Réouvert

export type HarmLevel =
  | 'none'                  // Aucun dommage
  | 'emotional_discomfort'  // Inconfort émotionnel
  | 'minor_temporary'       // Mineur temporaire
  | 'minor_permanent'       // Mineur permanent
  | 'major_temporary'       // Majeur temporaire
  | 'major_permanent'       // Majeur permanent
  | 'death';                // Décès

export interface IncidentLocation {
  building?: string;
  floor?: string;
  unit: string;
  room?: string;
  bed?: string;
  specificArea?: string;
}

export interface InvolvedPerson {
  staffId: string;
  name: string;
  role: string;
  department: string;
  involvement: 'primary' | 'secondary' | 'witness';
  statement?: string;
  interviewCompleted: boolean;
}

export interface InvolvedPatient {
  patientId: string;
  patientName: string;
  mrn: string;
  admissionDate?: string;
  diagnosis?: string;
  harmSustained: HarmLevel;
  treatmentRequired?: string;
  outcome?: string;
  familyNotified: boolean;
  familyNotifiedAt?: string;
  disclosureCompleted: boolean;
}

export interface Witness {
  id: string;
  name: string;
  role: string;
  contactInfo?: string;
  statement?: string;
  statementDate?: string;
}

export interface ContributingFactor {
  id: string;
  category: ContributingFactorCategory;
  factor: string;
  description: string;
  evidence: string;
}

export type ContributingFactorCategory =
  | 'patient_factors'       // Facteurs patient
  | 'task_factors'          // Facteurs liés à la tâche
  | 'individual_factors'    // Facteurs individuels
  | 'team_factors'          // Facteurs d'équipe
  | 'work_environment'      // Environnement de travail
  | 'organizational'        // Organisationnels
  | 'institutional';        // Institutionnels

export interface SystemFailure {
  id: string;
  system: string;
  failureType: string;
  description: string;
  immediateAction: string;
}

export interface HumanFactor {
  id: string;
  factorType: HumanFactorType;
  description: string;
  mitigatingFactors?: string;
}

export type HumanFactorType =
  | 'slip'          // Lapsus
  | 'lapse'         // Oubli
  | 'mistake'       // Erreur
  | 'violation'     // Violation
  | 'fatigue'       // Fatigue
  | 'distraction'   // Distraction
  | 'communication' // Communication
  | 'training';     // Formation

export interface Investigation {
  id: string;
  leadInvestigator: string;
  teamMembers: string[];
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  methodology: string[];
  findings: InvestigationFinding[];
  recommendations: string[];
  summary: string;
}

export interface InvestigationFinding {
  id: string;
  category: string;
  finding: string;
  evidence: string;
  significance: 'high' | 'medium' | 'low';
}

export interface RootCauseAnalysis {
  id: string;
  method: RCAMethod;
  performedBy: string[];
  performedAt: string;

  // Timeline
  timeline: TimelineEvent[];

  // Analysis Methods
  fiveWhys?: FiveWhysAnalysis;
  fishbone?: FishboneAnalysis;
  fmea?: FMEAAnalysis;

  // Results
  rootCauses: RootCause[];
  systemicIssues: string[];
  recommendations: RCARecommendation[];

  summary: string;
}

export type RCAMethod =
  | 'five_whys'     // 5 Pourquoi
  | 'fishbone'      // Ishikawa
  | 'fmea'          // AMDEC
  | 'fault_tree'    // Arbre des causes
  | 'timeline'      // Chronologie
  | 'combined';     // Combinée

export interface TimelineEvent {
  timestamp: string;
  event: string;
  actor?: string;
  location?: string;
  significance: 'critical' | 'important' | 'routine';
  deviation?: string;
}

export interface FiveWhysAnalysis {
  problem: string;
  whys: Array<{
    level: number;
    why: string;
    answer: string;
  }>;
  rootCause: string;
}

export interface FishboneAnalysis {
  effect: string;
  categories: Array<{
    name: string; // Man, Machine, Method, Material, Measurement, Environment
    causes: Array<{
      cause: string;
      subCauses: string[];
    }>;
  }>;
}

export interface FMEAAnalysis {
  processSteps: Array<{
    step: string;
    failureModes: Array<{
      mode: string;
      effect: string;
      cause: string;
      severity: number;      // 1-10
      occurrence: number;    // 1-10
      detection: number;     // 1-10
      rpn: number;           // Risk Priority Number
      recommendedAction: string;
    }>;
  }>;
}

export interface RootCause {
  id: string;
  description: string;
  category: ContributingFactorCategory;
  evidence: string;
  addressable: boolean;
}

export interface RCARecommendation {
  id: string;
  rootCauseId: string;
  recommendation: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  responsible: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ImmediateAction {
  id: string;
  action: string;
  takenBy: string;
  takenAt: string;
  outcome: string;
}

export interface CorrectiveAction {
  id: string;
  description: string;
  type: 'process_change' | 'training' | 'equipment' | 'policy' | 'staffing' | 'other';
  assignedTo: string;
  dueDate: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'cancelled';
  completedAt?: string;
  evidence?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  effectiveness?: 'effective' | 'partially_effective' | 'ineffective' | 'pending';
}

export interface PreventiveAction {
  id: string;
  description: string;
  scope: 'unit' | 'department' | 'hospital' | 'organization';
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  completedAt?: string;
  verifiedBy?: string;
}

export type ReviewStatus =
  | 'pending_review'
  | 'under_review'
  | 'additional_info_needed'
  | 'approved'
  | 'rejected'
  | 'escalated';

export interface CREXReview {
  id: string;
  incidentId: string;
  scheduledDate: string;
  actualDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  // Committee
  chairperson: string;
  members: CREXMember[];

  // Presentation
  presenter: string;
  presentationFile?: string;

  // Discussion
  agenda: string[];
  discussionPoints: DiscussionPoint[];

  // Outcomes
  decisions: CREXDecision[];
  actionItems: CREXActionItem[];
  lessonsLearned: string[];

  // Follow-up
  nextReviewDate?: string;

  minutes?: string;
}

export interface CREXMember {
  staffId: string;
  name: string;
  role: string;
  department: string;
  attended: boolean;
}

export interface DiscussionPoint {
  id: string;
  topic: string;
  discussion: string;
  raisedBy: string;
}

export interface CREXDecision {
  id: string;
  decision: string;
  rationale: string;
  votingResult?: string;
}

export interface CREXActionItem {
  id: string;
  action: string;
  responsible: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface IncidentNotification {
  id: string;
  recipientType: 'staff' | 'manager' | 'risk_manager' | 'executive' | 'external';
  recipientId?: string;
  recipientName: string;
  recipientEmail: string;
  notificationType: 'initial' | 'update' | 'escalation' | 'closure';
  sentAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface RegulatoryReport {
  id: string;
  agency: 'has' | 'ars' | 'ansm' | 'efs' | 'asn' | 'other';
  reportType: string;
  reportNumber?: string;
  submittedAt?: string;
  submittedBy?: string;
  status: 'pending' | 'submitted' | 'acknowledged' | 'under_review' | 'closed';
  response?: string;
  dueDate?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Dashboard & Analytics
export interface IncidentDashboard {
  summary: IncidentSummary;
  trends: IncidentTrend[];
  byType: TypeDistribution[];
  bySeverity: SeverityDistribution[];
  byLocation: LocationDistribution[];
  openActions: CorrectiveAction[];
  recentIncidents: Incident[];
  pendingReviews: number;
  upcomingCREX: CREXReview[];
}

export interface IncidentSummary {
  totalIncidents: number;
  openIncidents: number;
  closedThisMonth: number;
  averageTimeToClose: number; // days
  nearMissRate: number;
  seriousEvents: number;
  regulatoryReports: number;
}

export interface IncidentTrend {
  period: string;
  total: number;
  bySeverity: Record<SeverityLevel, number>;
  byType: Record<string, number>;
}

export interface TypeDistribution {
  type: IncidentType;
  count: number;
  percentage: number;
}

export interface SeverityDistribution {
  severity: SeverityLevel;
  count: number;
  percentage: number;
}

export interface LocationDistribution {
  location: string;
  count: number;
  percentage: number;
}

// Quality Metrics
export interface QualityMetrics {
  incidentRate: number;           // per 1000 patient days
  nearMissRate: number;
  seriousEventRate: number;
  reportingCulture: ReportingMetrics;
  closureMetrics: ClosureMetrics;
  actionEffectiveness: number;
}

export interface ReportingMetrics {
  totalReports: number;
  anonymousReports: number;
  selfReports: number;
  averageReportingTime: number; // hours from occurrence to report
}

export interface ClosureMetrics {
  averageDaysToClose: number;
  closedWithinTarget: number;
  reopenedIncidents: number;
}

// ============================================================================
// Incident Management Service Class
// ============================================================================

export class IncidentManagementService {
  private db: D1Database;
  private organizationId: string;

  constructor(db: D1Database, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  // ==========================================================================
  // Incident CRUD Operations
  // ==========================================================================

  async createIncident(data: Partial<Incident>): Promise<Incident> {
    const incident: Incident = {
      id: this.generateId(),
      organizationId: this.organizationId,
      incidentNumber: await this.generateIncidentNumber(),
      type: data.type || 'other',
      category: data.category || 'clinical',
      severity: data.severity || 'minor',
      status: 'reported',
      title: data.title || '',
      description: data.description || '',
      occurredAt: data.occurredAt || new Date().toISOString(),
      discoveredAt: data.discoveredAt || new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      location: data.location || { unit: 'Unknown' },
      reportedBy: data.reportedBy || '',
      involvedStaff: data.involvedStaff || [],
      involvedPatients: data.involvedPatients || [],
      witnesses: data.witnesses || [],
      patientHarm: data.patientHarm || 'none',
      actualOutcome: data.actualOutcome || '',
      potentialOutcome: data.potentialOutcome || '',
      nearMiss: data.nearMiss || false,
      contributingFactors: data.contributingFactors || [],
      systemFailures: data.systemFailures || [],
      humanFactors: data.humanFactors || [],
      immediateActions: data.immediateActions || [],
      correctiveActions: data.correctiveActions || [],
      preventiveActions: data.preventiveActions || [],
      reviewStatus: 'pending_review',
      notifications: [],
      tags: data.tags || [],
      attachments: data.attachments || [],
      relatedIncidents: data.relatedIncidents || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Auto-escalate based on severity
    if (incident.severity === 'major' || incident.severity === 'catastrophic') {
      await this.escalateIncident(incident);
    }

    // Auto-notify based on type
    await this.sendInitialNotifications(incident);

    await IncidentDB.create(this.db, incident);
    return incident;
  }

  async getIncident(id: string): Promise<Incident | null> {
    return IncidentDB.getById(this.db, id);
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident> {
    const incident = await this.getIncident(id);
    if (!incident) throw new Error('Incident not found');

    const updated: Incident = {
      ...incident,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await IncidentDB.update(this.db, id, updated);
    return updated;
  }

  async listIncidents(filters: {
    status?: IncidentStatus;
    type?: IncidentType;
    severity?: SeverityLevel;
    location?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ incidents: Incident[]; total: number }> {
    return IncidentDB.list(this.db, this.organizationId, filters);
  }

  // ==========================================================================
  // Incident Workflow
  // ==========================================================================

  async acknowledgeIncident(id: string, acknowledgedBy: string): Promise<Incident> {
    return this.updateIncident(id, {
      status: 'acknowledged',
      reviewStatus: 'under_review'
    });
  }

  async startInvestigation(id: string, data: {
    leadInvestigator: string;
    teamMembers: string[];
    methodology: string[];
    targetCompletionDate: string;
  }): Promise<Incident> {
    const investigation: Investigation = {
      id: this.generateId(),
      leadInvestigator: data.leadInvestigator,
      teamMembers: data.teamMembers,
      startDate: new Date().toISOString(),
      targetCompletionDate: data.targetCompletionDate,
      status: 'in_progress',
      methodology: data.methodology,
      findings: [],
      recommendations: [],
      summary: ''
    };

    return this.updateIncident(id, {
      status: 'investigating',
      investigation
    });
  }

  async addInvestigationFinding(incidentId: string, finding: Omit<InvestigationFinding, 'id'>): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.investigation) throw new Error('Investigation not found');

    const newFinding: InvestigationFinding = {
      id: this.generateId(),
      ...finding
    };

    incident.investigation.findings.push(newFinding);
    return this.updateIncident(incidentId, { investigation: incident.investigation });
  }

  async completeInvestigation(incidentId: string, summary: string, recommendations: string[]): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.investigation) throw new Error('Investigation not found');

    incident.investigation.status = 'completed';
    incident.investigation.actualCompletionDate = new Date().toISOString();
    incident.investigation.summary = summary;
    incident.investigation.recommendations = recommendations;

    return this.updateIncident(incidentId, {
      status: 'analyzed',
      investigation: incident.investigation
    });
  }

  // ==========================================================================
  // Root Cause Analysis
  // ==========================================================================

  async performRootCauseAnalysis(incidentId: string, data: {
    method: RCAMethod;
    performedBy: string[];
  }): Promise<RootCauseAnalysis> {
    const rca: RootCauseAnalysis = {
      id: this.generateId(),
      method: data.method,
      performedBy: data.performedBy,
      performedAt: new Date().toISOString(),
      timeline: [],
      rootCauses: [],
      systemicIssues: [],
      recommendations: [],
      summary: ''
    };

    await this.updateIncident(incidentId, { rootCauseAnalysis: rca });
    return rca;
  }

  async addFiveWhysAnalysis(incidentId: string, analysis: FiveWhysAnalysis): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.rootCauseAnalysis) throw new Error('RCA not found');

    incident.rootCauseAnalysis.fiveWhys = analysis;
    return this.updateIncident(incidentId, { rootCauseAnalysis: incident.rootCauseAnalysis });
  }

  async addFishboneAnalysis(incidentId: string, analysis: FishboneAnalysis): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.rootCauseAnalysis) throw new Error('RCA not found');

    incident.rootCauseAnalysis.fishbone = analysis;
    return this.updateIncident(incidentId, { rootCauseAnalysis: incident.rootCauseAnalysis });
  }

  async addFMEAAnalysis(incidentId: string, analysis: FMEAAnalysis): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.rootCauseAnalysis) throw new Error('RCA not found');

    incident.rootCauseAnalysis.fmea = analysis;

    // Calculate RPN for each failure mode
    for (const step of analysis.processSteps) {
      for (const mode of step.failureModes) {
        mode.rpn = mode.severity * mode.occurrence * mode.detection;
      }
    }

    return this.updateIncident(incidentId, { rootCauseAnalysis: incident.rootCauseAnalysis });
  }

  async identifyRootCauses(incidentId: string, rootCauses: Omit<RootCause, 'id'>[]): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.rootCauseAnalysis) throw new Error('RCA not found');

    incident.rootCauseAnalysis.rootCauses = rootCauses.map(rc => ({
      id: this.generateId(),
      ...rc
    }));

    return this.updateIncident(incidentId, { rootCauseAnalysis: incident.rootCauseAnalysis });
  }

  // ==========================================================================
  // Corrective & Preventive Actions (CAPA)
  // ==========================================================================

  async addCorrectiveAction(incidentId: string, action: Omit<CorrectiveAction, 'id' | 'status'>): Promise<CorrectiveAction> {
    const incident = await this.getIncident(incidentId);
    if (!incident) throw new Error('Incident not found');

    const newAction: CorrectiveAction = {
      id: this.generateId(),
      ...action,
      status: 'pending'
    };

    incident.correctiveActions.push(newAction);
    await this.updateIncident(incidentId, {
      correctiveActions: incident.correctiveActions,
      status: 'action_plan'
    });

    return newAction;
  }

  async updateCorrectiveActionStatus(
    incidentId: string,
    actionId: string,
    status: CorrectiveAction['status'],
    evidence?: string
  ): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    if (!incident) throw new Error('Incident not found');

    const actionIndex = incident.correctiveActions.findIndex(a => a.id === actionId);
    if (actionIndex === -1) throw new Error('Action not found');

    incident.correctiveActions[actionIndex].status = status;
    if (status === 'completed') {
      incident.correctiveActions[actionIndex].completedAt = new Date().toISOString();
    }
    if (evidence) {
      incident.correctiveActions[actionIndex].evidence = evidence;
    }

    // Check if all actions are completed
    const allCompleted = incident.correctiveActions.every(a =>
      a.status === 'completed' || a.status === 'verified' || a.status === 'cancelled'
    );

    if (allCompleted) {
      incident.status = 'monitoring';
    }

    return this.updateIncident(incidentId, {
      correctiveActions: incident.correctiveActions,
      status: incident.status
    });
  }

  async verifyCorrectiveAction(
    incidentId: string,
    actionId: string,
    verifiedBy: string,
    effectiveness: CorrectiveAction['effectiveness']
  ): Promise<Incident> {
    const incident = await this.getIncident(incidentId);
    if (!incident) throw new Error('Incident not found');

    const actionIndex = incident.correctiveActions.findIndex(a => a.id === actionId);
    if (actionIndex === -1) throw new Error('Action not found');

    incident.correctiveActions[actionIndex].status = 'verified';
    incident.correctiveActions[actionIndex].verifiedBy = verifiedBy;
    incident.correctiveActions[actionIndex].verifiedAt = new Date().toISOString();
    incident.correctiveActions[actionIndex].effectiveness = effectiveness;

    return this.updateIncident(incidentId, { correctiveActions: incident.correctiveActions });
  }

  async addPreventiveAction(incidentId: string, action: Omit<PreventiveAction, 'id' | 'status'>): Promise<PreventiveAction> {
    const incident = await this.getIncident(incidentId);
    if (!incident) throw new Error('Incident not found');

    const newAction: PreventiveAction = {
      id: this.generateId(),
      ...action,
      status: 'pending'
    };

    incident.preventiveActions.push(newAction);
    await this.updateIncident(incidentId, { preventiveActions: incident.preventiveActions });

    return newAction;
  }

  // ==========================================================================
  // CREX (Comité de Retour d'Expérience)
  // ==========================================================================

  async scheduleCREXReview(incidentId: string, data: {
    scheduledDate: string;
    chairperson: string;
    members: Omit<CREXMember, 'attended'>[];
    presenter: string;
    agenda: string[];
  }): Promise<CREXReview> {
    const crex: CREXReview = {
      id: this.generateId(),
      incidentId,
      scheduledDate: data.scheduledDate,
      status: 'scheduled',
      chairperson: data.chairperson,
      members: data.members.map(m => ({ ...m, attended: false })),
      presenter: data.presenter,
      agenda: data.agenda,
      discussionPoints: [],
      decisions: [],
      actionItems: [],
      lessonsLearned: []
    };

    await this.updateIncident(incidentId, { crexReview: crex });

    // Send meeting invitations
    await this.sendCREXInvitations(crex);

    return crex;
  }

  async startCREXMeeting(incidentId: string, attendees: string[]): Promise<CREXReview> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.crexReview) throw new Error('CREX not scheduled');

    incident.crexReview.status = 'in_progress';
    incident.crexReview.actualDate = new Date().toISOString();

    // Mark attendance
    for (const member of incident.crexReview.members) {
      member.attended = attendees.includes(member.staffId);
    }

    await this.updateIncident(incidentId, { crexReview: incident.crexReview });
    return incident.crexReview;
  }

  async addCREXDiscussionPoint(incidentId: string, point: Omit<DiscussionPoint, 'id'>): Promise<CREXReview> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.crexReview) throw new Error('CREX not found');

    const newPoint: DiscussionPoint = {
      id: this.generateId(),
      ...point
    };

    incident.crexReview.discussionPoints.push(newPoint);
    await this.updateIncident(incidentId, { crexReview: incident.crexReview });
    return incident.crexReview;
  }

  async addCREXDecision(incidentId: string, decision: Omit<CREXDecision, 'id'>): Promise<CREXReview> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.crexReview) throw new Error('CREX not found');

    const newDecision: CREXDecision = {
      id: this.generateId(),
      ...decision
    };

    incident.crexReview.decisions.push(newDecision);
    await this.updateIncident(incidentId, { crexReview: incident.crexReview });
    return incident.crexReview;
  }

  async completeCREXMeeting(incidentId: string, data: {
    lessonsLearned: string[];
    actionItems: Omit<CREXActionItem, 'id' | 'status'>[];
    minutes: string;
    nextReviewDate?: string;
  }): Promise<CREXReview> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.crexReview) throw new Error('CREX not found');

    incident.crexReview.status = 'completed';
    incident.crexReview.lessonsLearned = data.lessonsLearned;
    incident.crexReview.actionItems = data.actionItems.map(a => ({
      id: this.generateId(),
      ...a,
      status: 'pending'
    }));
    incident.crexReview.minutes = data.minutes;
    incident.crexReview.nextReviewDate = data.nextReviewDate;

    // Update incident with lessons learned
    incident.lessonsLearned = data.lessonsLearned.join('\n');

    await this.updateIncident(incidentId, {
      crexReview: incident.crexReview,
      lessonsLearned: incident.lessonsLearned
    });

    return incident.crexReview;
  }

  // ==========================================================================
  // Regulatory Reporting
  // ==========================================================================

  async createRegulatoryReport(incidentId: string, data: {
    agency: RegulatoryReport['agency'];
    reportType: string;
    dueDate?: string;
  }): Promise<RegulatoryReport> {
    const report: RegulatoryReport = {
      id: this.generateId(),
      agency: data.agency,
      reportType: data.reportType,
      status: 'pending',
      dueDate: data.dueDate
    };

    await this.updateIncident(incidentId, { regulatoryReport: report });
    return report;
  }

  async submitRegulatoryReport(incidentId: string, submittedBy: string, reportNumber?: string): Promise<RegulatoryReport> {
    const incident = await this.getIncident(incidentId);
    if (!incident || !incident.regulatoryReport) throw new Error('Report not found');

    incident.regulatoryReport.status = 'submitted';
    incident.regulatoryReport.submittedAt = new Date().toISOString();
    incident.regulatoryReport.submittedBy = submittedBy;
    if (reportNumber) {
      incident.regulatoryReport.reportNumber = reportNumber;
    }

    await this.updateIncident(incidentId, { regulatoryReport: incident.regulatoryReport });
    return incident.regulatoryReport;
  }

  // ==========================================================================
  // Incident Closure
  // ==========================================================================

  async closeIncident(id: string, closedBy: string, summary?: string): Promise<Incident> {
    const incident = await this.getIncident(id);
    if (!incident) throw new Error('Incident not found');

    // Validate closure requirements
    const canClose = this.validateClosureRequirements(incident);
    if (!canClose.valid) {
      throw new Error(`Cannot close incident: ${canClose.reasons.join(', ')}`);
    }

    return this.updateIncident(id, {
      status: 'closed',
      reviewStatus: 'approved',
      closedAt: new Date().toISOString(),
      lessonsLearned: summary || incident.lessonsLearned
    });
  }

  private validateClosureRequirements(incident: Incident): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check investigation completed for major incidents
    if (['major', 'catastrophic'].includes(incident.severity)) {
      if (!incident.investigation || incident.investigation.status !== 'completed') {
        reasons.push('Investigation not completed');
      }
      if (!incident.rootCauseAnalysis || incident.rootCauseAnalysis.rootCauses.length === 0) {
        reasons.push('Root cause analysis not completed');
      }
    }

    // Check all corrective actions completed
    const pendingActions = incident.correctiveActions.filter(a =>
      a.status !== 'completed' && a.status !== 'verified' && a.status !== 'cancelled'
    );
    if (pendingActions.length > 0) {
      reasons.push(`${pendingActions.length} corrective actions pending`);
    }

    // Check regulatory report submitted if required
    if (incident.regulatoryReport && incident.regulatoryReport.status === 'pending') {
      reasons.push('Regulatory report not submitted');
    }

    return {
      valid: reasons.length === 0,
      reasons
    };
  }

  async reopenIncident(id: string, reason: string, reopenedBy: string): Promise<Incident> {
    const incident = await this.getIncident(id);
    if (!incident || incident.status !== 'closed') throw new Error('Cannot reopen');

    return this.updateIncident(id, {
      status: 'reopened',
      reviewStatus: 'under_review',
      closedAt: undefined
    });
  }

  // ==========================================================================
  // Dashboard & Analytics
  // ==========================================================================

  async getDashboard(filters?: { fromDate?: string; toDate?: string }): Promise<IncidentDashboard> {
    const { incidents, total } = await this.listIncidents({
      fromDate: filters?.fromDate,
      toDate: filters?.toDate,
      limit: 1000
    });

    const summary = this.calculateSummary(incidents);
    const trends = this.calculateTrends(incidents);
    const byType = this.calculateTypeDistribution(incidents);
    const bySeverity = this.calculateSeverityDistribution(incidents);
    const byLocation = this.calculateLocationDistribution(incidents);

    // Get open corrective actions
    const openActions: CorrectiveAction[] = [];
    for (const incident of incidents) {
      for (const action of incident.correctiveActions) {
        if (action.status === 'pending' || action.status === 'in_progress') {
          openActions.push(action);
        }
      }
    }

    // Get upcoming CREX meetings
    const upcomingCREX = incidents
      .filter(i => i.crexReview && i.crexReview.status === 'scheduled')
      .map(i => i.crexReview!)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    return {
      summary,
      trends,
      byType,
      bySeverity,
      byLocation,
      openActions: openActions.slice(0, 20),
      recentIncidents: incidents.slice(0, 10),
      pendingReviews: incidents.filter(i => i.reviewStatus === 'pending_review').length,
      upcomingCREX: upcomingCREX.slice(0, 5)
    };
  }

  private calculateSummary(incidents: Incident[]): IncidentSummary {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const open = incidents.filter(i => i.status !== 'closed');
    const closedThisMonth = incidents.filter(i =>
      i.closedAt && new Date(i.closedAt) >= startOfMonth
    );
    const nearMiss = incidents.filter(i => i.nearMiss);
    const serious = incidents.filter(i =>
      i.severity === 'major' || i.severity === 'catastrophic'
    );
    const regulatory = incidents.filter(i =>
      i.regulatoryReport && i.regulatoryReport.status === 'submitted'
    );

    // Calculate average time to close
    const closedIncidents = incidents.filter(i => i.closedAt);
    let avgTimeToClose = 0;
    if (closedIncidents.length > 0) {
      const totalDays = closedIncidents.reduce((sum, i) => {
        const created = new Date(i.createdAt);
        const closed = new Date(i.closedAt!);
        return sum + (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      avgTimeToClose = Math.round(totalDays / closedIncidents.length);
    }

    return {
      totalIncidents: incidents.length,
      openIncidents: open.length,
      closedThisMonth: closedThisMonth.length,
      averageTimeToClose: avgTimeToClose,
      nearMissRate: incidents.length > 0 ? (nearMiss.length / incidents.length) * 100 : 0,
      seriousEvents: serious.length,
      regulatoryReports: regulatory.length
    };
  }

  private calculateTrends(incidents: Incident[]): IncidentTrend[] {
    const trends: Map<string, IncidentTrend> = new Map();

    for (const incident of incidents) {
      const date = new Date(incident.reportedAt);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!trends.has(period)) {
        trends.set(period, {
          period,
          total: 0,
          bySeverity: { none: 0, minor: 0, moderate: 0, major: 0, catastrophic: 0 },
          byType: {}
        });
      }

      const trend = trends.get(period)!;
      trend.total++;
      trend.bySeverity[incident.severity]++;
      trend.byType[incident.type] = (trend.byType[incident.type] || 0) + 1;
    }

    return Array.from(trends.values()).sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateTypeDistribution(incidents: Incident[]): TypeDistribution[] {
    const counts: Map<IncidentType, number> = new Map();

    for (const incident of incidents) {
      counts.set(incident.type, (counts.get(incident.type) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: (count / incidents.length) * 100
    })).sort((a, b) => b.count - a.count);
  }

  private calculateSeverityDistribution(incidents: Incident[]): SeverityDistribution[] {
    const counts: Map<SeverityLevel, number> = new Map();

    for (const incident of incidents) {
      counts.set(incident.severity, (counts.get(incident.severity) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([severity, count]) => ({
      severity,
      count,
      percentage: (count / incidents.length) * 100
    }));
  }

  private calculateLocationDistribution(incidents: Incident[]): LocationDistribution[] {
    const counts: Map<string, number> = new Map();

    for (const incident of incidents) {
      const location = incident.location.unit;
      counts.set(location, (counts.get(location) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([location, count]) => ({
      location,
      count,
      percentage: (count / incidents.length) * 100
    })).sort((a, b) => b.count - a.count);
  }

  async getQualityMetrics(patientDays: number): Promise<QualityMetrics> {
    const { incidents } = await this.listIncidents({ limit: 1000 });

    const nearMiss = incidents.filter(i => i.nearMiss);
    const serious = incidents.filter(i =>
      i.severity === 'major' || i.severity === 'catastrophic'
    );

    // Reporting metrics
    const anonymousReports = 0; // Would need separate tracking
    const selfReports = incidents.filter(i =>
      i.involvedStaff.some(s => s.staffId === i.reportedBy)
    ).length;

    // Closure metrics
    const closed = incidents.filter(i => i.status === 'closed');
    const totalDays = closed.reduce((sum, i) => {
      const created = new Date(i.createdAt);
      const closedDate = new Date(i.closedAt!);
      return sum + (closedDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    const avgDaysToClose = closed.length > 0 ? totalDays / closed.length : 0;

    // Action effectiveness (verified as effective)
    const allActions = incidents.flatMap(i => i.correctiveActions);
    const verifiedActions = allActions.filter(a => a.status === 'verified');
    const effectiveActions = verifiedActions.filter(a => a.effectiveness === 'effective');
    const actionEffectiveness = verifiedActions.length > 0
      ? (effectiveActions.length / verifiedActions.length) * 100
      : 0;

    return {
      incidentRate: patientDays > 0 ? (incidents.length / patientDays) * 1000 : 0,
      nearMissRate: incidents.length > 0 ? (nearMiss.length / incidents.length) * 100 : 0,
      seriousEventRate: patientDays > 0 ? (serious.length / patientDays) * 1000 : 0,
      reportingCulture: {
        totalReports: incidents.length,
        anonymousReports,
        selfReports,
        averageReportingTime: 0 // Would need occurrence time tracking
      },
      closureMetrics: {
        averageDaysToClose: Math.round(avgDaysToClose),
        closedWithinTarget: closed.filter(i => {
          const days = (new Date(i.closedAt!).getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return days <= 30; // 30 day target
        }).length,
        reopenedIncidents: incidents.filter(i => i.status === 'reopened').length
      },
      actionEffectiveness
    };
  }

  // ==========================================================================
  // Notifications
  // ==========================================================================

  private async sendInitialNotifications(incident: Incident): Promise<void> {
    const notifications: IncidentNotification[] = [];

    // Notify risk manager for all incidents
    notifications.push({
      id: this.generateId(),
      recipientType: 'risk_manager',
      recipientName: 'Risk Manager',
      recipientEmail: 'risk@hospital.com',
      notificationType: 'initial',
      sentAt: new Date().toISOString(),
      acknowledged: false
    });

    // Notify executives for major/catastrophic
    if (incident.severity === 'major' || incident.severity === 'catastrophic') {
      notifications.push({
        id: this.generateId(),
        recipientType: 'executive',
        recipientName: 'Medical Director',
        recipientEmail: 'medical.director@hospital.com',
        notificationType: 'escalation',
        sentAt: new Date().toISOString(),
        acknowledged: false
      });
    }

    // Update incident with notifications
    await this.updateIncident(incident.id, { notifications });
  }

  private async escalateIncident(incident: Incident): Promise<void> {
    // Log escalation
    console.log(`ESCALATION: Incident ${incident.incidentNumber} - Severity: ${incident.severity}`);
  }

  private async sendCREXInvitations(crex: CREXReview): Promise<void> {
    // Send calendar invitations to all members
    for (const member of crex.members) {
      console.log(`Sending CREX invitation to ${member.name} for ${crex.scheduledDate}`);
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateIncidentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await IncidentDB.countByYear(this.db, this.organizationId, year);
    return `INC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}

// ============================================================================
// Database Layer (Stub for D1 Implementation)
// ============================================================================

class IncidentDB {
  static async create(db: D1Database, incident: Incident): Promise<void> {
    // Implementation for D1 database
  }

  static async getById(db: D1Database, id: string): Promise<Incident | null> {
    return null;
  }

  static async update(db: D1Database, id: string, incident: Incident): Promise<void> {
    // Implementation for D1 database
  }

  static async list(db: D1Database, organizationId: string, filters: any): Promise<{ incidents: Incident[]; total: number }> {
    return { incidents: [], total: 0 };
  }

  static async countByYear(db: D1Database, organizationId: string, year: number): Promise<number> {
    return 0;
  }
}

export default IncidentManagementService;
