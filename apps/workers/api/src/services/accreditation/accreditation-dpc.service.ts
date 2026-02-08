/**
 * Accreditation & DPC Service (Développement Professionnel Continu)
 * Manages healthcare professional accreditation, continuing education, and certification
 * Compliant with French DPC requirements and HAS accreditation standards
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface HealthcareProfessional {
  id: string;
  userId: string;
  rppsNumber?: string; // Répertoire Partagé des Professionnels de Santé
  adeliNumber?: string;
  finess?: string;
  profession: ProfessionType;
  specialty?: string;
  qualifications: Qualification[];
  registrationDate: Date;
  status: 'active' | 'suspended' | 'retired' | 'pending_verification';
  dpcStatus: DPCStatus;
  accreditationStatus?: AccreditationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProfessionType =
  | 'medecin'
  | 'pharmacien'
  | 'infirmier'
  | 'sage_femme'
  | 'chirurgien_dentiste'
  | 'masseur_kinesitherapeute'
  | 'biologiste'
  | 'manipulateur_radio'
  | 'aide_soignant'
  | 'cadre_sante'
  | 'autre';

export interface Qualification {
  id: string;
  professionalId: string;
  type: 'diplome' | 'capacite' | 'desc' | 'diu' | 'du' | 'attestation' | 'autre';
  title: string;
  institution: string;
  obtainedDate: Date;
  expirationDate?: Date;
  documentUrl?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface DPCStatus {
  obligationStart: Date;
  obligationEnd: Date; // Typically 3-year period
  requiredCredits: number;
  acquiredCredits: number;
  complianceStatus: 'compliant' | 'in_progress' | 'non_compliant' | 'exempt';
  lastUpdateDate: Date;
}

export interface AccreditationStatus {
  isAccredited: boolean;
  accreditationType?: string;
  accreditationBody?: string;
  accreditationDate?: Date;
  expirationDate?: Date;
  specialty?: string;
  referenceNumber?: string;
}

export interface DPCProgram {
  id: string;
  odpcId: string; // Organisme DPC ID
  programNumber: string; // Numéro de programme DPC
  title: string;
  description: string;
  category: DPCCategory;
  orientation: DPCOrientation;
  targetProfessions: ProfessionType[];
  targetSpecialties?: string[];
  format: ProgramFormat;
  duration: number; // hours
  credits: number;
  maxParticipants?: number;
  prerequisites?: string[];
  objectives: string[];
  evaluationMethods: string[];
  status: 'draft' | 'submitted' | 'approved' | 'active' | 'completed' | 'archived';
  validFrom: Date;
  validTo: Date;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DPCCategory =
  | 'formation_continue' // Formation continue
  | 'analyse_pratiques' // Analyse des pratiques professionnelles
  | 'gestion_risques' // Gestion des risques
  | 'programme_integre'; // Programme intégré (combinant plusieurs méthodes)

export type DPCOrientation =
  | 'qualite_securite' // Qualité et sécurité des soins
  | 'pertinence_soins' // Pertinence des soins
  | 'innovation' // Innovation et recherche
  | 'parcours_patient' // Parcours de soins du patient
  | 'coordination' // Coordination des soins
  | 'prevention'; // Prévention

export type ProgramFormat =
  | 'presentiel' // In-person
  | 'e_learning' // Online
  | 'mixte' // Blended
  | 'simulation' // Simulation
  | 'groupe_pairs' // Peer group
  | 'audit_clinique' // Clinical audit
  | 'rcp' // Réunion de Concertation Pluridisciplinaire
  | 'staff_epp'; // Staff EPP

export interface DPCSession {
  id: string;
  programId: string;
  sessionNumber: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  isVirtual: boolean;
  virtualPlatformUrl?: string;
  instructorIds: string[];
  maxParticipants: number;
  registeredCount: number;
  status: 'scheduled' | 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
  materials: SessionMaterial[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionMaterial {
  id: string;
  sessionId: string;
  type: 'document' | 'video' | 'quiz' | 'case_study' | 'bibliography';
  title: string;
  url: string;
  isRequired: boolean;
  order: number;
}

export interface DPCEnrollment {
  id: string;
  professionalId: string;
  sessionId: string;
  programId: string;
  enrollmentDate: Date;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'withdrawn' | 'failed';
  paymentStatus: 'pending' | 'paid' | 'reimbursed' | 'not_applicable';
  paymentMethod?: 'personal' | 'employer' | 'opca' | 'dpc_fund';
  attendance: AttendanceRecord[];
  evaluations: EvaluationRecord[];
  creditsEarned?: number;
  certificateIssued: boolean;
  certificateUrl?: string;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  date: Date;
  sessionPart: string;
  present: boolean;
  duration: number; // minutes
  method: 'signature' | 'online_tracking' | 'attestation';
}

export interface EvaluationRecord {
  type: 'pre_test' | 'post_test' | 'satisfaction' | 'knowledge_assessment' | 'practice_improvement';
  date: Date;
  score?: number;
  maxScore?: number;
  passed?: boolean;
  feedback?: string;
}

export interface DPCCertificate {
  id: string;
  enrollmentId: string;
  professionalId: string;
  programNumber: string;
  programTitle: string;
  sessionDates: { start: Date; end: Date };
  credits: number;
  issueDate: Date;
  certificateNumber: string;
  signedBy: string;
  documentUrl: string;
  sentToAndpc: boolean;
  sentDate?: Date;
}

export interface EPPAction {
  id: string;
  title: string;
  description: string;
  type: 'audit_clinique' | 'revue_morbi_mortalite' | 'indicateurs_qualite' | 'chemin_clinique' | 'groupe_pairs' | 'staff_epp';
  status: 'planned' | 'in_progress' | 'completed' | 'suspended';
  responsibleId: string;
  participants: string[];
  startDate: Date;
  endDate?: Date;
  objectives: string[];
  methodology: string;
  indicators: EPPIndicator[];
  results?: string;
  improvements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EPPIndicator {
  name: string;
  baselineValue: number;
  targetValue: number;
  currentValue?: number;
  unit: string;
  measurementDate?: Date;
}

export interface AccreditationProgram {
  id: string;
  specialty: string;
  accreditationBody: string;
  name: string;
  description: string;
  requirements: AccreditationRequirement[];
  validityPeriod: number; // years
  renewalCriteria: string[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface AccreditationRequirement {
  id: string;
  programId: string;
  type: 'formation' | 'epp' | 'evenement_porteur_risque' | 'declaration' | 'autre';
  description: string;
  minimumCredits?: number;
  frequency: 'annual' | 'per_cycle' | 'one_time';
  mandatory: boolean;
}

export interface ProfessionalAccreditation {
  id: string;
  professionalId: string;
  programId: string;
  applicationDate: Date;
  status: 'application_submitted' | 'under_review' | 'accredited' | 'conditionally_accredited' | 'denied' | 'expired' | 'withdrawn';
  accreditationDate?: Date;
  expirationDate?: Date;
  referenceNumber?: string;
  conditions?: string[];
  completedRequirements: CompletedRequirement[];
  renewalDue?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompletedRequirement {
  requirementId: string;
  completedDate: Date;
  evidence?: string[];
  validatedBy?: string;
  validatedAt?: Date;
}

export interface RiskEvent {
  id: string;
  professionalId: string;
  eventType: 'epr' | 'ias' | 'evenement_indesirable' | 'autre'; // Événement Porteur de Risque
  description: string;
  occurredDate: Date;
  reportedDate: Date;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  rootCauseAnalysis?: string;
  correctiveActions?: string[];
  lessonsLearned?: string[];
  sharedWithPeers: boolean;
  accreditationRelevant: boolean;
  status: 'reported' | 'analyzed' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingNeeds {
  professionalId: string;
  assessmentDate: Date;
  needs: TrainingNeed[];
  priority: PriorityNeed[];
  recommendedPrograms: string[];
}

export interface TrainingNeed {
  domain: string;
  currentLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';
  targetLevel: 'novice' | 'intermediate' | 'advanced' | 'expert';
  gap: string;
  source: 'self_assessment' | 'manager_assessment' | 'peer_review' | 'performance_data' | 'incident';
}

export interface PriorityNeed {
  domain: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: Date;
  rationale: string;
}

export interface DPCDashboard {
  professionalId: string;
  obligationPeriod: { start: Date; end: Date };
  creditsRequired: number;
  creditsAcquired: number;
  completionPercentage: number;
  complianceStatus: 'compliant' | 'on_track' | 'at_risk' | 'non_compliant';
  upcomingSessions: DPCSession[];
  currentEnrollments: DPCEnrollment[];
  recentCertificates: DPCCertificate[];
  eppActions: EPPAction[];
  accreditationStatus?: ProfessionalAccreditation;
  recommendations: string[];
}

export interface OrganizationDPCReport {
  organizationId: string;
  reportPeriod: { start: Date; end: Date };
  totalProfessionals: number;
  complianceRate: number;
  byProfession: { [profession: string]: { total: number; compliant: number } };
  sessionsOrganized: number;
  totalCreditsDelivered: number;
  topPrograms: { programId: string; title: string; enrollments: number }[];
  eppActionsCompleted: number;
  trainingBudget?: { allocated: number; spent: number };
}

// ============================================================================
// Accreditation & DPC Service Class
// ============================================================================

export class AccreditationDPCService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ---------------------------------------------------------------------------
  // Healthcare Professional Management
  // ---------------------------------------------------------------------------

  async registerProfessional(data: Omit<HealthcareProfessional, 'id' | 'createdAt' | 'updatedAt'>): Promise<HealthcareProfessional> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getProfessional(professionalId: string): Promise<HealthcareProfessional | null> {
    // TODO: Implement database query
    return null;
  }

  async getProfessionalByRPPS(rppsNumber: string): Promise<HealthcareProfessional | null> {
    // TODO: Implement database query
    return null;
  }

  async listProfessionals(filters?: {
    profession?: ProfessionType;
    status?: HealthcareProfessional['status'];
    dpcCompliance?: DPCStatus['complianceStatus'];
  }): Promise<HealthcareProfessional[]> {
    // TODO: Implement database query
    return [];
  }

  async updateProfessional(professionalId: string, updates: Partial<HealthcareProfessional>): Promise<HealthcareProfessional> {
    // TODO: Implement database update
    return {} as HealthcareProfessional;
  }

  async verifyRPPSNumber(rppsNumber: string): Promise<{ valid: boolean; data?: any }> {
    // TODO: Verify against RPPS national registry
    // In production, this would call the ASIP Santé API
    return { valid: true };
  }

  // ---------------------------------------------------------------------------
  // Qualifications
  // ---------------------------------------------------------------------------

  async addQualification(professionalId: string, qualification: Omit<Qualification, 'id' | 'professionalId'>): Promise<Qualification> {
    const id = crypto.randomUUID();
    return {
      ...qualification,
      id,
      professionalId,
    };
  }

  async verifyQualification(qualificationId: string, verifiedBy: string): Promise<Qualification> {
    // TODO: Update qualification as verified
    return {} as Qualification;
  }

  async getExpiringQualifications(daysAhead: number): Promise<Qualification[]> {
    // TODO: Get qualifications expiring within specified days
    return [];
  }

  // ---------------------------------------------------------------------------
  // DPC Programs
  // ---------------------------------------------------------------------------

  async createProgram(data: Omit<DPCProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<DPCProgram> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getProgram(programId: string): Promise<DPCProgram | null> {
    // TODO: Implement database query
    return null;
  }

  async listPrograms(filters?: {
    category?: DPCCategory;
    format?: ProgramFormat;
    profession?: ProfessionType;
    status?: DPCProgram['status'];
  }): Promise<DPCProgram[]> {
    // TODO: Implement database query
    return [];
  }

  async updateProgramStatus(programId: string, status: DPCProgram['status']): Promise<DPCProgram> {
    // TODO: Update program status
    return {} as DPCProgram;
  }

  async searchPrograms(query: string, profession: ProfessionType): Promise<DPCProgram[]> {
    // TODO: Search programs by keywords
    return [];
  }

  // ---------------------------------------------------------------------------
  // DPC Sessions
  // ---------------------------------------------------------------------------

  async createSession(data: Omit<DPCSession, 'id' | 'registeredCount' | 'createdAt' | 'updatedAt'>): Promise<DPCSession> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      registeredCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getSession(sessionId: string): Promise<DPCSession | null> {
    // TODO: Implement database query
    return null;
  }

  async getProgramSessions(programId: string, status?: DPCSession['status']): Promise<DPCSession[]> {
    // TODO: Implement database query
    return [];
  }

  async updateSessionStatus(sessionId: string, status: DPCSession['status']): Promise<DPCSession> {
    // TODO: Update session status
    return {} as DPCSession;
  }

  async addSessionMaterial(sessionId: string, material: Omit<SessionMaterial, 'id' | 'sessionId'>): Promise<SessionMaterial> {
    const id = crypto.randomUUID();
    return {
      ...material,
      id,
      sessionId,
    };
  }

  async getUpcomingSessions(professionalId: string): Promise<DPCSession[]> {
    // TODO: Get upcoming sessions for professional's profession
    return [];
  }

  // ---------------------------------------------------------------------------
  // Enrollments
  // ---------------------------------------------------------------------------

  async enrollInSession(professionalId: string, sessionId: string): Promise<DPCEnrollment> {
    const id = crypto.randomUUID();
    const session = await this.getSession(sessionId);
    const now = new Date();

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.registeredCount >= session.maxParticipants) {
      throw new Error('Session is full');
    }

    return {
      id,
      professionalId,
      sessionId,
      programId: session.programId,
      enrollmentDate: now,
      status: 'pending',
      paymentStatus: 'pending',
      attendance: [],
      evaluations: [],
      certificateIssued: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getEnrollment(enrollmentId: string): Promise<DPCEnrollment | null> {
    // TODO: Implement database query
    return null;
  }

  async getProfessionalEnrollments(professionalId: string, status?: DPCEnrollment['status']): Promise<DPCEnrollment[]> {
    // TODO: Implement database query
    return [];
  }

  async updateEnrollmentStatus(enrollmentId: string, status: DPCEnrollment['status']): Promise<DPCEnrollment> {
    // TODO: Update enrollment status
    return {} as DPCEnrollment;
  }

  async recordAttendance(enrollmentId: string, attendance: AttendanceRecord): Promise<DPCEnrollment> {
    // TODO: Add attendance record
    return {} as DPCEnrollment;
  }

  async recordEvaluation(enrollmentId: string, evaluation: EvaluationRecord): Promise<DPCEnrollment> {
    // TODO: Add evaluation record
    return {} as DPCEnrollment;
  }

  async completeEnrollment(enrollmentId: string, creditsEarned: number): Promise<DPCEnrollment> {
    // TODO: Complete enrollment and update DPC status
    return {} as DPCEnrollment;
  }

  async withdrawFromSession(enrollmentId: string, reason: string): Promise<DPCEnrollment> {
    // TODO: Withdraw from session
    return {} as DPCEnrollment;
  }

  // ---------------------------------------------------------------------------
  // Certificates
  // ---------------------------------------------------------------------------

  async issueCertificate(enrollmentId: string, signedBy: string): Promise<DPCCertificate> {
    const id = crypto.randomUUID();
    const enrollment = await this.getEnrollment(enrollmentId);
    const program = enrollment ? await this.getProgram(enrollment.programId) : null;
    const session = enrollment ? await this.getSession(enrollment.sessionId) : null;

    if (!enrollment || !program || !session) {
      throw new Error('Enrollment, program or session not found');
    }

    const certificateNumber = this.generateCertificateNumber();

    return {
      id,
      enrollmentId,
      professionalId: enrollment.professionalId,
      programNumber: program.programNumber,
      programTitle: program.title,
      sessionDates: { start: session.startDate, end: session.endDate },
      credits: enrollment.creditsEarned || 0,
      issueDate: new Date(),
      certificateNumber,
      signedBy,
      documentUrl: '', // TODO: Generate PDF
      sentToAndpc: false,
    };
  }

  private generateCertificateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${year}-${random}`;
  }

  async getCertificate(certificateId: string): Promise<DPCCertificate | null> {
    // TODO: Implement database query
    return null;
  }

  async getProfessionalCertificates(professionalId: string): Promise<DPCCertificate[]> {
    // TODO: Implement database query
    return [];
  }

  async sendCertificateToANDPC(certificateId: string): Promise<DPCCertificate> {
    // TODO: Send certificate data to ANDPC
    // In production, this would call the ANDPC API
    return {} as DPCCertificate;
  }

  // ---------------------------------------------------------------------------
  // EPP Actions
  // ---------------------------------------------------------------------------

  async createEPPAction(data: Omit<EPPAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<EPPAction> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getEPPAction(actionId: string): Promise<EPPAction | null> {
    // TODO: Implement database query
    return null;
  }

  async listEPPActions(filters?: {
    type?: EPPAction['type'];
    status?: EPPAction['status'];
    responsibleId?: string;
  }): Promise<EPPAction[]> {
    // TODO: Implement database query
    return [];
  }

  async updateEPPAction(actionId: string, updates: Partial<EPPAction>): Promise<EPPAction> {
    // TODO: Implement database update
    return {} as EPPAction;
  }

  async updateEPPIndicator(actionId: string, indicatorName: string, currentValue: number): Promise<EPPAction> {
    // TODO: Update indicator measurement
    return {} as EPPAction;
  }

  async completeEPPAction(actionId: string, results: string, improvements: string[]): Promise<EPPAction> {
    // TODO: Complete EPP action
    return {} as EPPAction;
  }

  // ---------------------------------------------------------------------------
  // Accreditation Programs
  // ---------------------------------------------------------------------------

  async createAccreditationProgram(data: Omit<AccreditationProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccreditationProgram> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAccreditationProgram(programId: string): Promise<AccreditationProgram | null> {
    // TODO: Implement database query
    return null;
  }

  async listAccreditationPrograms(specialty?: string): Promise<AccreditationProgram[]> {
    // TODO: Implement database query
    return [];
  }

  async addAccreditationRequirement(programId: string, requirement: Omit<AccreditationRequirement, 'id' | 'programId'>): Promise<AccreditationRequirement> {
    const id = crypto.randomUUID();
    return {
      ...requirement,
      id,
      programId,
    };
  }

  // ---------------------------------------------------------------------------
  // Professional Accreditation
  // ---------------------------------------------------------------------------

  async applyForAccreditation(professionalId: string, programId: string): Promise<ProfessionalAccreditation> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      id,
      professionalId,
      programId,
      applicationDate: now,
      status: 'application_submitted',
      completedRequirements: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAccreditation(accreditationId: string): Promise<ProfessionalAccreditation | null> {
    // TODO: Implement database query
    return null;
  }

  async getProfessionalAccreditation(professionalId: string): Promise<ProfessionalAccreditation | null> {
    // TODO: Get current accreditation for professional
    return null;
  }

  async updateAccreditationStatus(accreditationId: string, status: ProfessionalAccreditation['status'], conditions?: string[]): Promise<ProfessionalAccreditation> {
    // TODO: Update accreditation status
    return {} as ProfessionalAccreditation;
  }

  async recordCompletedRequirement(accreditationId: string, requirementId: string, evidence: string[]): Promise<ProfessionalAccreditation> {
    // TODO: Record completed requirement
    return {} as ProfessionalAccreditation;
  }

  async validateRequirement(accreditationId: string, requirementId: string, validatedBy: string): Promise<ProfessionalAccreditation> {
    // TODO: Validate requirement
    return {} as ProfessionalAccreditation;
  }

  async renewAccreditation(accreditationId: string): Promise<ProfessionalAccreditation> {
    // TODO: Renew accreditation
    return {} as ProfessionalAccreditation;
  }

  async getExpiringAccreditations(daysAhead: number): Promise<ProfessionalAccreditation[]> {
    // TODO: Get accreditations expiring soon
    return [];
  }

  // ---------------------------------------------------------------------------
  // Risk Events (EPR - Événements Porteurs de Risque)
  // ---------------------------------------------------------------------------

  async reportRiskEvent(data: Omit<RiskEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiskEvent> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getRiskEvent(eventId: string): Promise<RiskEvent | null> {
    // TODO: Implement database query
    return null;
  }

  async getProfessionalRiskEvents(professionalId: string): Promise<RiskEvent[]> {
    // TODO: Implement database query
    return [];
  }

  async analyzeRiskEvent(eventId: string, rootCauseAnalysis: string, correctiveActions: string[]): Promise<RiskEvent> {
    // TODO: Update event with analysis
    return {} as RiskEvent;
  }

  async closeRiskEvent(eventId: string, lessonsLearned: string[]): Promise<RiskEvent> {
    // TODO: Close event
    return {} as RiskEvent;
  }

  // ---------------------------------------------------------------------------
  // Training Needs Assessment
  // ---------------------------------------------------------------------------

  async assessTrainingNeeds(professionalId: string, needs: TrainingNeed[]): Promise<TrainingNeeds> {
    // TODO: Analyze needs and generate recommendations
    return {
      professionalId,
      assessmentDate: new Date(),
      needs,
      priority: this.prioritizeNeeds(needs),
      recommendedPrograms: await this.matchProgramsToNeeds(needs),
    };
  }

  private prioritizeNeeds(needs: TrainingNeed[]): PriorityNeed[] {
    return needs.map(need => {
      let priority: PriorityNeed['priority'] = 'low';
      if (need.source === 'incident' || need.source === 'performance_data') {
        priority = 'high';
      } else if (need.source === 'manager_assessment') {
        priority = 'medium';
      }

      return {
        domain: need.domain,
        priority,
        rationale: `Based on ${need.source}: gap from ${need.currentLevel} to ${need.targetLevel}`,
      };
    });
  }

  private async matchProgramsToNeeds(needs: TrainingNeed[]): Promise<string[]> {
    // TODO: Match available programs to training needs
    return [];
  }

  async getTrainingNeeds(professionalId: string): Promise<TrainingNeeds | null> {
    // TODO: Implement database query
    return null;
  }

  // ---------------------------------------------------------------------------
  // DPC Compliance
  // ---------------------------------------------------------------------------

  async updateDPCStatus(professionalId: string): Promise<DPCStatus> {
    // TODO: Calculate DPC status based on completed programs
    const professional = await this.getProfessional(professionalId);
    if (!professional) {
      throw new Error('Professional not found');
    }

    // Get completed enrollments for current period
    const enrollments = await this.getProfessionalEnrollments(professionalId, 'completed');

    let acquiredCredits = 0;
    for (const enrollment of enrollments) {
      if (enrollment.creditsEarned) {
        acquiredCredits += enrollment.creditsEarned;
      }
    }

    const complianceStatus = this.calculateComplianceStatus(
      acquiredCredits,
      professional.dpcStatus.requiredCredits,
      professional.dpcStatus.obligationEnd
    );

    return {
      ...professional.dpcStatus,
      acquiredCredits,
      complianceStatus,
      lastUpdateDate: new Date(),
    };
  }

  private calculateComplianceStatus(acquired: number, required: number, deadline: Date): DPCStatus['complianceStatus'] {
    const now = new Date();
    const timeRemaining = deadline.getTime() - now.getTime();
    const daysRemaining = timeRemaining / (1000 * 60 * 60 * 24);

    if (acquired >= required) {
      return 'compliant';
    }

    if (daysRemaining < 0) {
      return 'non_compliant';
    }

    const percentComplete = (acquired / required) * 100;
    const percentTimeElapsed = ((deadline.getTime() - now.getTime()) / (deadline.getTime() - new Date(deadline.getFullYear() - 3, deadline.getMonth(), deadline.getDate()).getTime())) * 100;

    if (percentComplete >= percentTimeElapsed) {
      return 'in_progress';
    }

    return 'in_progress';
  }

  async getNonCompliantProfessionals(): Promise<HealthcareProfessional[]> {
    // TODO: Get professionals at risk of non-compliance
    return [];
  }

  // ---------------------------------------------------------------------------
  // Dashboards and Reporting
  // ---------------------------------------------------------------------------

  async getDPCDashboard(professionalId: string): Promise<DPCDashboard> {
    const professional = await this.getProfessional(professionalId);
    if (!professional) {
      throw new Error('Professional not found');
    }

    const enrollments = await this.getProfessionalEnrollments(professionalId);
    const certificates = await this.getProfessionalCertificates(professionalId);
    const eppActions = await this.listEPPActions({ responsibleId: professionalId });
    const accreditation = await this.getProfessionalAccreditation(professionalId);
    const upcomingSessions = await this.getUpcomingSessions(professionalId);

    const completionPercentage = (professional.dpcStatus.acquiredCredits / professional.dpcStatus.requiredCredits) * 100;

    return {
      professionalId,
      obligationPeriod: {
        start: professional.dpcStatus.obligationStart,
        end: professional.dpcStatus.obligationEnd,
      },
      creditsRequired: professional.dpcStatus.requiredCredits,
      creditsAcquired: professional.dpcStatus.acquiredCredits,
      completionPercentage: Math.min(completionPercentage, 100),
      complianceStatus: this.mapToComplianceStatus(professional.dpcStatus.complianceStatus),
      upcomingSessions,
      currentEnrollments: enrollments.filter(e => e.status === 'in_progress'),
      recentCertificates: certificates.slice(0, 5),
      eppActions,
      accreditationStatus: accreditation || undefined,
      recommendations: this.generateRecommendations(professional, enrollments, eppActions),
    };
  }

  private mapToComplianceStatus(status: DPCStatus['complianceStatus']): DPCDashboard['complianceStatus'] {
    switch (status) {
      case 'compliant': return 'compliant';
      case 'in_progress': return 'on_track';
      case 'non_compliant': return 'non_compliant';
      case 'exempt': return 'compliant';
      default: return 'at_risk';
    }
  }

  private generateRecommendations(
    professional: HealthcareProfessional,
    enrollments: DPCEnrollment[],
    eppActions: EPPAction[]
  ): string[] {
    const recommendations: string[] = [];

    if (professional.dpcStatus.complianceStatus === 'non_compliant') {
      recommendations.push('Urgent: Inscrivez-vous à une formation DPC pour régulariser votre situation');
    }

    if (eppActions.filter(a => a.status === 'in_progress').length === 0) {
      recommendations.push('Participez à une action EPP pour diversifier votre parcours DPC');
    }

    return recommendations;
  }

  async getOrganizationDPCReport(organizationId: string, period: { start: Date; end: Date }): Promise<OrganizationDPCReport> {
    // TODO: Generate organization-wide DPC report
    return {
      organizationId,
      reportPeriod: period,
      totalProfessionals: 0,
      complianceRate: 0,
      byProfession: {},
      sessionsOrganized: 0,
      totalCreditsDelivered: 0,
      topPrograms: [],
      eppActionsCompleted: 0,
    };
  }

  async exportDPCData(professionalId: string, format: 'pdf' | 'csv'): Promise<{ data: string; filename: string }> {
    // TODO: Export DPC data for professional
    return { data: '', filename: '' };
  }
}

// ============================================================================
// Export Service Factory
// ============================================================================

export function createAccreditationDPCService(db: D1Database): AccreditationDPCService {
  return new AccreditationDPCService(db);
}
