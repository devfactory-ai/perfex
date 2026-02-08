/**
 * Care Coordination Service
 * Comprehensive care management and team coordination
 * Supports care plans, care teams, transitions, and chronic disease management
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface CareTeam {
  id: string;
  patientId: string;
  name: string;
  type: 'primary_care' | 'specialty' | 'palliative' | 'chronic_disease' | 'transitional' | 'oncology';
  status: 'active' | 'inactive' | 'on_hold';
  leadProviderId: string;
  members: CareTeamMember[];
  conditions: string[];
  goals: CareGoal[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CareTeamMember {
  id: string;
  teamId: string;
  providerId: string;
  role: 'lead' | 'primary' | 'specialist' | 'nurse' | 'care_manager' | 'social_worker' | 'pharmacist' | 'therapist';
  specialty?: string;
  responsibilities: string[];
  contactPreference: 'phone' | 'email' | 'secure_message' | 'pager';
  availabilityHours?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface CarePlan {
  id: string;
  patientId: string;
  teamId: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';
  category: 'chronic_disease' | 'post_acute' | 'preventive' | 'palliative' | 'rehabilitation';
  conditions: PlanCondition[];
  goals: CareGoal[];
  interventions: CareIntervention[];
  barriers: CareBarrier[];
  startDate: Date;
  targetEndDate?: Date;
  reviewDate: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanCondition {
  id: string;
  planId: string;
  icd10Code: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  isPrimary: boolean;
  onsetDate?: Date;
  notes?: string;
}

export interface CareGoal {
  id: string;
  planId: string;
  category: 'clinical' | 'functional' | 'behavioral' | 'social' | 'safety';
  description: string;
  targetValue?: string;
  targetDate: Date;
  status: 'not_started' | 'in_progress' | 'achieved' | 'partially_achieved' | 'not_achieved';
  priority: 'high' | 'medium' | 'low';
  progress: number; // 0-100
  barriers?: string[];
  milestones: GoalMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  description: string;
  targetDate: Date;
  achievedDate?: Date;
  status: 'pending' | 'achieved' | 'missed';
}

export interface CareIntervention {
  id: string;
  planId: string;
  goalId?: string;
  type: 'medication' | 'education' | 'monitoring' | 'referral' | 'counseling' | 'therapy' | 'social_support';
  description: string;
  frequency: string;
  responsibleMemberId: string;
  status: 'planned' | 'active' | 'completed' | 'discontinued';
  startDate: Date;
  endDate?: Date;
  outcomes?: string[];
  notes?: string;
}

export interface CareBarrier {
  id: string;
  planId: string;
  category: 'financial' | 'transportation' | 'language' | 'health_literacy' | 'social_support' | 'housing' | 'mental_health' | 'substance_use';
  description: string;
  severity: 'low' | 'medium' | 'high';
  mitigationPlan?: string;
  status: 'identified' | 'being_addressed' | 'resolved';
  identifiedDate: Date;
  resolvedDate?: Date;
}

export interface CareTransition {
  id: string;
  patientId: string;
  type: 'admission' | 'discharge' | 'transfer' | 'referral';
  fromFacility?: string;
  toFacility?: string;
  fromUnit?: string;
  toUnit?: string;
  fromProvider?: string;
  toProvider?: string;
  reason: string;
  scheduledDate: Date;
  actualDate?: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  transitionPlan: TransitionPlan;
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransitionPlan {
  medications: MedicationReconciliation[];
  pendingTests: PendingItem[];
  appointments: ScheduledAppointment[];
  instructions: string[];
  educationProvided: string[];
  redFlags: string[];
  emergencyPlan: string;
  contactInfo: ContactInfo;
}

export interface MedicationReconciliation {
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  change: 'continued' | 'new' | 'discontinued' | 'modified';
  reason?: string;
  instructions?: string;
}

export interface PendingItem {
  type: 'lab' | 'imaging' | 'procedure' | 'consult';
  description: string;
  orderedDate: Date;
  expectedDate?: Date;
  responsibleProvider?: string;
}

export interface ScheduledAppointment {
  appointmentType: string;
  providerName: string;
  facility?: string;
  scheduledDate: Date;
  instructions?: string;
}

export interface ContactInfo {
  primaryCareProvider: string;
  primaryCarePhone: string;
  emergencyContact: string;
  emergencyPhone: string;
  afterHoursLine?: string;
}

export interface CareCoordinationTask {
  id: string;
  patientId: string;
  planId?: string;
  teamId?: string;
  assignedTo: string;
  taskType: 'follow_up_call' | 'care_conference' | 'referral' | 'medication_review' | 'assessment' | 'education' | 'documentation' | 'authorization';
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';
  dueDate: Date;
  completedDate?: Date;
  completedBy?: string;
  outcome?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientOutreach {
  id: string;
  patientId: string;
  type: 'phone' | 'video' | 'in_person' | 'home_visit' | 'secure_message';
  purpose: 'wellness_check' | 'care_gap' | 'follow_up' | 'medication_adherence' | 'appointment_reminder' | 'test_results';
  scheduledDate: Date;
  attemptedDate?: Date;
  outcome: 'scheduled' | 'completed' | 'no_answer' | 'left_message' | 'refused' | 'rescheduled';
  duration?: number; // minutes
  notes?: string;
  nextAction?: string;
  createdBy: string;
  createdAt: Date;
}

export interface CareGapAlert {
  id: string;
  patientId: string;
  category: 'preventive' | 'chronic_disease' | 'medication' | 'follow_up' | 'screening';
  measure: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'addressed' | 'closed' | 'excluded';
  addressedDate?: Date;
  addressedBy?: string;
  exclusionReason?: string;
  createdAt: Date;
}

export interface RiskStratification {
  id: string;
  patientId: string;
  assessmentDate: Date;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  model: string; // e.g., 'HCC', 'LACE', 'Custom'
  factors: RiskFactor[];
  recommendations: string[];
  nextAssessmentDate: Date;
  assessedBy: string;
}

export interface RiskFactor {
  category: string;
  factor: string;
  weight: number;
  value: string | number;
  contribution: number;
}

export interface CareConference {
  id: string;
  patientId: string;
  teamId: string;
  scheduledDate: Date;
  duration: number; // minutes
  type: 'initial' | 'follow_up' | 'discharge_planning' | 'family' | 'multidisciplinary';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendees: ConferenceAttendee[];
  agenda: string[];
  summary?: string;
  decisions?: string[];
  actionItems: CareCoordinationTask[];
  nextConferenceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConferenceAttendee {
  memberId: string;
  role: string;
  attended: boolean;
  notes?: string;
}

export interface ChronicDiseaseRegistry {
  id: string;
  patientId: string;
  condition: string;
  icd10Code: string;
  diagnosisDate: Date;
  severity: 'mild' | 'moderate' | 'severe';
  controlStatus: 'well_controlled' | 'moderately_controlled' | 'poorly_controlled';
  lastAssessmentDate: Date;
  keyMetrics: DiseaseMetric[];
  careGaps: string[];
  enrolled: boolean;
  programId?: string;
}

export interface DiseaseMetric {
  name: string;
  value: number | string;
  unit?: string;
  date: Date;
  target?: string;
  status: 'at_goal' | 'near_goal' | 'not_at_goal';
}

export interface PopulationHealthMetrics {
  totalPatients: number;
  byRiskLevel: { [key: string]: number };
  careGapsSummary: { [measure: string]: { total: number; addressed: number; rate: number } };
  chronicConditions: { [condition: string]: number };
  transitionsLast30Days: number;
  readmissionRate: number;
  averageRiskScore: number;
}

// ============================================================================
// Care Coordination Service Class
// ============================================================================

export class CareCoordinationService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ---------------------------------------------------------------------------
  // Care Team Management
  // ---------------------------------------------------------------------------

  async createCareTeam(data: Omit<CareTeam, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareTeam> {
    const id = crypto.randomUUID();
    const now = new Date();

    const careTeam: CareTeam = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // TODO: Insert into database
    return careTeam;
  }

  async getCareTeam(teamId: string): Promise<CareTeam | null> {
    // TODO: Implement database query
    return null;
  }

  async getPatientCareTeams(patientId: string): Promise<CareTeam[]> {
    // TODO: Implement database query
    return [];
  }

  async addTeamMember(teamId: string, member: Omit<CareTeamMember, 'id' | 'teamId'>): Promise<CareTeamMember> {
    const id = crypto.randomUUID();
    const teamMember: CareTeamMember = {
      ...member,
      id,
      teamId,
    };

    // TODO: Insert into database
    return teamMember;
  }

  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    // TODO: Implement - set end date and isActive = false
  }

  async updateTeamMemberRole(memberId: string, role: CareTeamMember['role'], responsibilities: string[]): Promise<CareTeamMember> {
    // TODO: Implement database update
    return {} as CareTeamMember;
  }

  // ---------------------------------------------------------------------------
  // Care Plan Management
  // ---------------------------------------------------------------------------

  async createCarePlan(data: Omit<CarePlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<CarePlan> {
    const id = crypto.randomUUID();
    const now = new Date();

    const carePlan: CarePlan = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // TODO: Insert into database
    return carePlan;
  }

  async getCarePlan(planId: string): Promise<CarePlan | null> {
    // TODO: Implement database query
    return null;
  }

  async getPatientCarePlans(patientId: string, status?: CarePlan['status']): Promise<CarePlan[]> {
    // TODO: Implement database query with optional status filter
    return [];
  }

  async updateCarePlan(planId: string, updates: Partial<CarePlan>): Promise<CarePlan> {
    // TODO: Implement database update
    return {} as CarePlan;
  }

  async approveCarePlan(planId: string, approverId: string): Promise<CarePlan> {
    return this.updateCarePlan(planId, {
      status: 'active',
      approvedBy: approverId,
      approvedAt: new Date(),
    });
  }

  // ---------------------------------------------------------------------------
  // Care Goals
  // ---------------------------------------------------------------------------

  async addCareGoal(planId: string, goal: Omit<CareGoal, 'id' | 'planId' | 'createdAt' | 'updatedAt'>): Promise<CareGoal> {
    const id = crypto.randomUUID();
    const now = new Date();

    const careGoal: CareGoal = {
      ...goal,
      id,
      planId,
      createdAt: now,
      updatedAt: now,
    };

    // TODO: Insert into database
    return careGoal;
  }

  async updateGoalProgress(goalId: string, progress: number, status: CareGoal['status']): Promise<CareGoal> {
    // TODO: Implement database update
    return {} as CareGoal;
  }

  async addGoalMilestone(goalId: string, milestone: Omit<GoalMilestone, 'id' | 'goalId'>): Promise<GoalMilestone> {
    const id = crypto.randomUUID();
    return {
      ...milestone,
      id,
      goalId,
    };
  }

  async achieveMilestone(milestoneId: string): Promise<GoalMilestone> {
    // TODO: Update milestone with achieved date and status
    return {} as GoalMilestone;
  }

  // ---------------------------------------------------------------------------
  // Care Interventions
  // ---------------------------------------------------------------------------

  async addIntervention(planId: string, intervention: Omit<CareIntervention, 'id' | 'planId'>): Promise<CareIntervention> {
    const id = crypto.randomUUID();
    return {
      ...intervention,
      id,
      planId,
    };
  }

  async updateInterventionStatus(interventionId: string, status: CareIntervention['status'], outcomes?: string[]): Promise<CareIntervention> {
    // TODO: Implement database update
    return {} as CareIntervention;
  }

  // ---------------------------------------------------------------------------
  // Care Barriers
  // ---------------------------------------------------------------------------

  async identifyBarrier(planId: string, barrier: Omit<CareBarrier, 'id' | 'planId' | 'identifiedDate'>): Promise<CareBarrier> {
    const id = crypto.randomUUID();
    return {
      ...barrier,
      id,
      planId,
      identifiedDate: new Date(),
    };
  }

  async updateBarrierStatus(barrierId: string, status: CareBarrier['status'], mitigationPlan?: string): Promise<CareBarrier> {
    // TODO: Implement database update
    return {} as CareBarrier;
  }

  async resolveBarrier(barrierId: string): Promise<CareBarrier> {
    return this.updateBarrierStatus(barrierId, 'resolved');
  }

  // ---------------------------------------------------------------------------
  // Care Transitions
  // ---------------------------------------------------------------------------

  async createCareTransition(data: Omit<CareTransition, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareTransition> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getCareTransition(transitionId: string): Promise<CareTransition | null> {
    // TODO: Implement database query
    return null;
  }

  async updateTransitionStatus(transitionId: string, status: CareTransition['status'], actualDate?: Date): Promise<CareTransition> {
    // TODO: Implement database update
    return {} as CareTransition;
  }

  async completeTransition(transitionId: string): Promise<CareTransition> {
    return this.updateTransitionStatus(transitionId, 'completed', new Date());
  }

  async reconcileMedications(transitionId: string, medications: MedicationReconciliation[]): Promise<void> {
    // TODO: Update transition plan with reconciled medications
  }

  async scheduleTransitionFollowUp(transitionId: string, followUpDate: Date): Promise<CareTransition> {
    // TODO: Update transition with follow-up date
    return {} as CareTransition;
  }

  async completeTransitionFollowUp(transitionId: string, notes: string): Promise<CareTransition> {
    // TODO: Mark follow-up as completed
    return {} as CareTransition;
  }

  // ---------------------------------------------------------------------------
  // Care Coordination Tasks
  // ---------------------------------------------------------------------------

  async createTask(task: Omit<CareCoordinationTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareCoordinationTask> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getTask(taskId: string): Promise<CareCoordinationTask | null> {
    // TODO: Implement database query
    return null;
  }

  async getTasksByAssignee(assigneeId: string, status?: CareCoordinationTask['status']): Promise<CareCoordinationTask[]> {
    // TODO: Implement database query
    return [];
  }

  async getPatientTasks(patientId: string): Promise<CareCoordinationTask[]> {
    // TODO: Implement database query
    return [];
  }

  async getOverdueTasks(): Promise<CareCoordinationTask[]> {
    // TODO: Query tasks where dueDate < now and status not completed/cancelled
    return [];
  }

  async updateTaskStatus(taskId: string, status: CareCoordinationTask['status'], outcome?: string): Promise<CareCoordinationTask> {
    // TODO: Implement database update
    return {} as CareCoordinationTask;
  }

  async completeTask(taskId: string, completedBy: string, outcome: string): Promise<CareCoordinationTask> {
    // TODO: Complete task with details
    return {} as CareCoordinationTask;
  }

  async reassignTask(taskId: string, newAssigneeId: string): Promise<CareCoordinationTask> {
    // TODO: Update task assignee
    return {} as CareCoordinationTask;
  }

  // ---------------------------------------------------------------------------
  // Patient Outreach
  // ---------------------------------------------------------------------------

  async scheduleOutreach(outreach: Omit<PatientOutreach, 'id' | 'createdAt'>): Promise<PatientOutreach> {
    const id = crypto.randomUUID();
    return {
      ...outreach,
      id,
      createdAt: new Date(),
    };
  }

  async recordOutreachAttempt(outreachId: string, outcome: PatientOutreach['outcome'], notes?: string, nextAction?: string): Promise<PatientOutreach> {
    // TODO: Update outreach record
    return {} as PatientOutreach;
  }

  async getPatientOutreachHistory(patientId: string): Promise<PatientOutreach[]> {
    // TODO: Implement database query
    return [];
  }

  async getPendingOutreach(assigneeId?: string): Promise<PatientOutreach[]> {
    // TODO: Get scheduled outreach that hasn't been attempted
    return [];
  }

  // ---------------------------------------------------------------------------
  // Care Gap Management
  // ---------------------------------------------------------------------------

  async identifyCareGap(gap: Omit<CareGapAlert, 'id' | 'createdAt'>): Promise<CareGapAlert> {
    const id = crypto.randomUUID();
    return {
      ...gap,
      id,
      createdAt: new Date(),
    };
  }

  async getPatientCareGaps(patientId: string, status?: CareGapAlert['status']): Promise<CareGapAlert[]> {
    // TODO: Implement database query
    return [];
  }

  async addressCareGap(gapId: string, addressedBy: string): Promise<CareGapAlert> {
    // TODO: Update care gap status
    return {} as CareGapAlert;
  }

  async excludeCareGap(gapId: string, reason: string): Promise<CareGapAlert> {
    // TODO: Mark care gap as excluded with reason
    return {} as CareGapAlert;
  }

  async runCareGapAnalysis(patientId: string): Promise<CareGapAlert[]> {
    // TODO: Analyze patient record and identify care gaps based on:
    // - Preventive care schedules
    // - Chronic disease protocols
    // - Medication adherence
    // - Follow-up appointments
    return [];
  }

  // ---------------------------------------------------------------------------
  // Risk Stratification
  // ---------------------------------------------------------------------------

  async performRiskAssessment(patientId: string, model: string, assessedBy: string): Promise<RiskStratification> {
    const id = crypto.randomUUID();

    // TODO: Calculate risk score based on model
    // Models could include:
    // - HCC (Hierarchical Condition Categories)
    // - LACE (Length of stay, Acuity, Comorbidities, ED visits)
    // - Custom algorithms

    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // Example risk factors to evaluate:
    // - Age
    // - Number of chronic conditions
    // - Recent hospitalizations
    // - ED visits
    // - Medication count
    // - Social determinants

    const riskLevel = this.calculateRiskLevel(totalScore);

    return {
      id,
      patientId,
      assessmentDate: new Date(),
      riskScore: totalScore,
      riskLevel,
      model,
      factors,
      recommendations: this.generateRiskRecommendations(riskLevel, factors),
      nextAssessmentDate: this.calculateNextAssessmentDate(riskLevel),
      assessedBy,
    };
  }

  private calculateRiskLevel(score: number): RiskStratification['riskLevel'] {
    if (score >= 75) return 'very_high';
    if (score >= 50) return 'high';
    if (score >= 25) return 'moderate';
    return 'low';
  }

  private generateRiskRecommendations(level: RiskStratification['riskLevel'], factors: RiskFactor[]): string[] {
    const recommendations: string[] = [];

    if (level === 'very_high' || level === 'high') {
      recommendations.push('Assign dedicated care manager');
      recommendations.push('Weekly outreach calls');
      recommendations.push('Comprehensive care plan required');
    }

    if (level === 'high' || level === 'moderate') {
      recommendations.push('Monthly care coordination review');
      recommendations.push('Medication reconciliation');
    }

    return recommendations;
  }

  private calculateNextAssessmentDate(level: RiskStratification['riskLevel']): Date {
    const now = new Date();
    const days = level === 'very_high' ? 30 : level === 'high' ? 60 : level === 'moderate' ? 90 : 180;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  async getLatestRiskAssessment(patientId: string): Promise<RiskStratification | null> {
    // TODO: Implement database query
    return null;
  }

  async getRiskAssessmentHistory(patientId: string): Promise<RiskStratification[]> {
    // TODO: Implement database query
    return [];
  }

  // ---------------------------------------------------------------------------
  // Care Conferences
  // ---------------------------------------------------------------------------

  async scheduleCareConference(conference: Omit<CareConference, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareConference> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...conference,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getCareConference(conferenceId: string): Promise<CareConference | null> {
    // TODO: Implement database query
    return null;
  }

  async updateConferenceAttendance(conferenceId: string, attendees: ConferenceAttendee[]): Promise<CareConference> {
    // TODO: Update attendance records
    return {} as CareConference;
  }

  async completeConference(conferenceId: string, summary: string, decisions: string[], actionItems: Omit<CareCoordinationTask, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<CareConference> {
    // TODO: Complete conference and create action items
    return {} as CareConference;
  }

  async getUpcomingConferences(teamId?: string): Promise<CareConference[]> {
    // TODO: Get scheduled conferences
    return [];
  }

  // ---------------------------------------------------------------------------
  // Chronic Disease Registry
  // ---------------------------------------------------------------------------

  async enrollInRegistry(enrollment: Omit<ChronicDiseaseRegistry, 'id'>): Promise<ChronicDiseaseRegistry> {
    const id = crypto.randomUUID();
    return {
      ...enrollment,
      id,
    };
  }

  async getPatientRegistryEnrollments(patientId: string): Promise<ChronicDiseaseRegistry[]> {
    // TODO: Implement database query
    return [];
  }

  async updateDiseaseMetrics(registryId: string, metrics: DiseaseMetric[]): Promise<ChronicDiseaseRegistry> {
    // TODO: Update metrics and control status
    return {} as ChronicDiseaseRegistry;
  }

  async getRegistryByCondition(condition: string): Promise<ChronicDiseaseRegistry[]> {
    // TODO: Get all patients in registry for a condition
    return [];
  }

  // ---------------------------------------------------------------------------
  // Population Health Analytics
  // ---------------------------------------------------------------------------

  async getPopulationHealthMetrics(filters?: { providerId?: string; teamId?: string }): Promise<PopulationHealthMetrics> {
    // TODO: Calculate population health metrics
    return {
      totalPatients: 0,
      byRiskLevel: {},
      careGapsSummary: {},
      chronicConditions: {},
      transitionsLast30Days: 0,
      readmissionRate: 0,
      averageRiskScore: 0,
    };
  }

  async getHighRiskPatients(limit?: number): Promise<{ patientId: string; riskScore: number; conditions: string[] }[]> {
    // TODO: Get patients sorted by risk score
    return [];
  }

  async getCareGapComplianceReport(): Promise<{ measure: string; numerator: number; denominator: number; rate: number }[]> {
    // TODO: Calculate care gap compliance rates
    return [];
  }

  async getTransitionOutcomes(dateRange: { start: Date; end: Date }): Promise<{
    totalTransitions: number;
    readmissions: number;
    readmissionRate: number;
    averageFollowUpDays: number;
    followUpCompletionRate: number;
  }> {
    // TODO: Analyze transition outcomes
    return {
      totalTransitions: 0,
      readmissions: 0,
      readmissionRate: 0,
      averageFollowUpDays: 0,
      followUpCompletionRate: 0,
    };
  }
}

// ============================================================================
// Export Service Factory
// ============================================================================

export function createCareCoordinationService(db: D1Database): CareCoordinationService {
  return new CareCoordinationService(db);
}
