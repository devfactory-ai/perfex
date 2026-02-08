/**
 * Patient Education Service - Éducation Thérapeutique du Patient (ETP)
 *
 * Comprehensive therapeutic patient education management including:
 * - Educational content management
 * - ETP programs and sessions
 * - Patient progress tracking
 * - Competency assessment
 * - French healthcare standards (HAS ETP)
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ETPProgram {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  pathology: string;
  description: string;
  objectives: string[];
  targetPopulation: string;
  duration: ProgramDuration;
  format: ProgramFormat;
  status: ProgramStatus;
  hasAuthorization: boolean;
  authorizationNumber?: string;
  authorizationDate?: string;
  authorizationExpiry?: string;
  coordinatorId: string;
  coordinatorName: string;
  team: ETPTeamMember[];
  modules: ETPModule[];
  evaluationCriteria: EvaluationCriterion[];
  enrollmentCriteria: EnrollmentCriterion[];
  maxParticipants: number;
  currentEnrollment: number;
  completionRate: number;
  patientSatisfaction?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramDuration {
  initialPhase: number; // months
  followUpPhase?: number;
  totalSessions: number;
  sessionDuration: number; // minutes
  frequency: string;
}

export type ProgramFormat = 'individual' | 'group' | 'mixed' | 'remote';

export type ProgramStatus = 'draft' | 'pending_authorization' | 'active' | 'suspended' | 'archived';

export interface ETPTeamMember {
  userId: string;
  name: string;
  profession: string;
  role: 'coordinator' | 'educator' | 'support';
  etpCertified: boolean;
  certificationDate?: string;
  specialties: string[];
  availability: string[];
}

export interface ETPModule {
  id: string;
  name: string;
  description: string;
  order: number;
  type: ModuleType;
  duration: number; // minutes
  objectives: string[];
  content: ModuleContent[];
  assessments: ModuleAssessment[];
  resources: EducationalResource[];
  prerequisites?: string[];
  isRequired: boolean;
}

export type ModuleType = 'knowledge' | 'skills' | 'behavior' | 'self_management' | 'coping';

export interface ModuleContent {
  id: string;
  title: string;
  type: 'text' | 'video' | 'audio' | 'interactive' | 'quiz' | 'exercise';
  content: string;
  mediaUrl?: string;
  duration?: number;
  order: number;
}

export interface ModuleAssessment {
  id: string;
  type: 'quiz' | 'demonstration' | 'self_evaluation' | 'observation';
  title: string;
  questions?: AssessmentQuestion[];
  passingScore?: number;
  maxAttempts?: number;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'open_ended' | 'scale';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  explanation?: string;
}

export interface EvaluationCriterion {
  id: string;
  domain: 'knowledge' | 'skills' | 'attitudes' | 'behaviors';
  criterion: string;
  measurable: string;
  targetLevel: number;
}

export interface EnrollmentCriterion {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  required: boolean;
}

// Educational Resources
export interface EducationalResource {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  pathology: string;
  language: string;
  format: string;
  url?: string;
  fileSize?: number;
  duration?: number;
  readingLevel: 'basic' | 'intermediate' | 'advanced';
  accessibilityFeatures: string[];
  tags: string[];
  targetAudience: 'patient' | 'caregiver' | 'both';
  source: string;
  version: string;
  validatedBy?: string;
  validatedAt?: string;
  expiryDate?: string;
  viewCount: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export type ResourceType =
  | 'document'
  | 'video'
  | 'audio'
  | 'infographic'
  | 'interactive'
  | 'worksheet'
  | 'checklist'
  | 'app';

// Patient Enrollment
export interface PatientEnrollment {
  id: string;
  organizationId: string;
  programId: string;
  programName: string;
  patientId: string;
  patientName: string;
  referringProviderId?: string;
  referringProviderName?: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  initialDiagnosis: InitialDiagnosis;
  educationalGoals: EducationalGoal[];
  assignedEducator: string;
  assignedEducatorName: string;
  sessions: ETPSession[];
  completedModules: string[];
  assessmentResults: AssessmentResult[];
  progressScore: number;
  competencyLevel: CompetencyLevel;
  notes: EnrollmentNote[];
  nextSession?: ScheduledSession;
  completedAt?: string;
  completionCertificate?: string;
  createdAt: string;
  updatedAt: string;
}

export type EnrollmentStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'withdrawn'
  | 'transferred';

export interface InitialDiagnosis {
  diagnosisDate: string;
  performedBy: string;
  knowledgeLevel: number; // 0-100
  skillsLevel: number;
  motivationLevel: number;
  barriers: string[];
  strengths: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  healthLiteracy: 'limited' | 'adequate' | 'proficient';
  socialSupport: 'strong' | 'moderate' | 'limited';
  priorities: string[];
  notes?: string;
}

export interface EducationalGoal {
  id: string;
  domain: 'knowledge' | 'skills' | 'attitudes' | 'behaviors';
  goal: string;
  measurable: string;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'achieved' | 'modified';
  achievedAt?: string;
  progress: number;
  notes?: string;
}

export interface ETPSession {
  id: string;
  enrollmentId: string;
  moduleId?: string;
  moduleName?: string;
  sessionNumber: number;
  type: 'individual' | 'group' | 'remote';
  format: 'in_person' | 'video' | 'phone' | 'self_directed';
  scheduledDate: string;
  actualDate?: string;
  duration: number;
  educatorId: string;
  educatorName: string;
  status: SessionStatus;
  attendance?: 'present' | 'absent' | 'excused' | 'late';
  objectives: string[];
  activitiesPlanned: string[];
  activitiesCompleted: string[];
  materialsUsed: string[];
  patientParticipation: number; // 0-10
  comprehensionLevel: number; // 0-10
  skillsDemonstrated: string[];
  barriers: string[];
  achievements: string[];
  nextSteps: string[];
  homeworkAssigned?: string[];
  homeworkCompleted?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SessionStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface ScheduledSession {
  sessionId: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  type: string;
  educatorName: string;
}

export interface AssessmentResult {
  id: string;
  moduleId: string;
  moduleName: string;
  assessmentId: string;
  assessmentType: string;
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  attempts: number;
  answers?: AssessmentAnswer[];
  feedback?: string;
  evaluatorId?: string;
  evaluatorName?: string;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: any;
  correct: boolean;
  points: number;
}

export type CompetencyLevel =
  | 'novice'
  | 'beginner'
  | 'competent'
  | 'proficient'
  | 'expert';

export interface EnrollmentNote {
  id: string;
  date: string;
  authorId: string;
  authorName: string;
  type: 'progress' | 'concern' | 'achievement' | 'barrier' | 'general';
  content: string;
  followUpRequired: boolean;
  followUpDate?: string;
}

// Analytics
export interface ETPAnalytics {
  period: { startDate: string; endDate: string };
  programMetrics: ProgramMetrics[];
  enrollmentMetrics: EnrollmentMetrics;
  sessionMetrics: SessionMetrics;
  outcomeMetrics: OutcomeMetrics;
  educatorMetrics: EducatorMetrics[];
}

export interface ProgramMetrics {
  programId: string;
  programName: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completionRate: number;
  dropoutRate: number;
  avgCompletionTime: number;
  patientSatisfaction: number;
}

export interface EnrollmentMetrics {
  totalEnrollments: number;
  newEnrollments: number;
  completedEnrollments: number;
  withdrawnEnrollments: number;
  avgProgressScore: number;
}

export interface SessionMetrics {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowRate: number;
  avgDuration: number;
  avgParticipation: number;
}

export interface OutcomeMetrics {
  knowledgeImprovement: number;
  skillsImprovement: number;
  behaviorChange: number;
  goalsAchieved: number;
  qualityOfLifeImprovement?: number;
}

export interface EducatorMetrics {
  educatorId: string;
  educatorName: string;
  sessionsDelivered: number;
  patientsTrained: number;
  avgPatientSatisfaction: number;
  avgSessionRating: number;
}

// ============================================================================
// Patient Education Service Class
// ============================================================================

export class PatientEducationService {
  private db: D1Database;
  private organizationId: string;

  constructor(db: D1Database, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  // ==========================================================================
  // Program Management
  // ==========================================================================

  async createProgram(data: Partial<ETPProgram>): Promise<ETPProgram> {
    const program: ETPProgram = {
      id: this.generateId(),
      organizationId: this.organizationId,
      name: data.name || '',
      code: data.code || await this.generateProgramCode(),
      pathology: data.pathology || '',
      description: data.description || '',
      objectives: data.objectives || [],
      targetPopulation: data.targetPopulation || '',
      duration: data.duration || { initialPhase: 3, totalSessions: 6, sessionDuration: 60, frequency: 'weekly' },
      format: data.format || 'mixed',
      status: 'draft',
      hasAuthorization: false,
      coordinatorId: data.coordinatorId || '',
      coordinatorName: data.coordinatorName || '',
      team: data.team || [],
      modules: data.modules || [],
      evaluationCriteria: data.evaluationCriteria || [],
      enrollmentCriteria: data.enrollmentCriteria || [],
      maxParticipants: data.maxParticipants || 20,
      currentEnrollment: 0,
      completionRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await ProgramDB.create(this.db, program);
    return program;
  }

  async getProgram(id: string): Promise<ETPProgram | null> {
    return ProgramDB.getById(this.db, id);
  }

  async updateProgram(id: string, updates: Partial<ETPProgram>): Promise<ETPProgram> {
    const program = await this.getProgram(id);
    if (!program) throw new Error('Program not found');

    const updated: ETPProgram = {
      ...program,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await ProgramDB.update(this.db, id, updated);
    return updated;
  }

  async addModule(programId: string, module: Partial<ETPModule>): Promise<ETPModule> {
    const program = await this.getProgram(programId);
    if (!program) throw new Error('Program not found');

    const newModule: ETPModule = {
      id: this.generateId(),
      name: module.name || '',
      description: module.description || '',
      order: program.modules.length + 1,
      type: module.type || 'knowledge',
      duration: module.duration || 60,
      objectives: module.objectives || [],
      content: module.content || [],
      assessments: module.assessments || [],
      resources: module.resources || [],
      prerequisites: module.prerequisites,
      isRequired: module.isRequired ?? true
    };

    program.modules.push(newModule);
    await this.updateProgram(programId, { modules: program.modules });

    return newModule;
  }

  async listPrograms(filters: {
    status?: ProgramStatus;
    pathology?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ programs: ETPProgram[]; total: number }> {
    return ProgramDB.list(this.db, this.organizationId, filters);
  }

  async submitForAuthorization(programId: string): Promise<ETPProgram> {
    const program = await this.getProgram(programId);
    if (!program) throw new Error('Program not found');

    // Validate program meets HAS requirements
    const validation = this.validateProgramForAuthorization(program);
    if (!validation.valid) {
      throw new Error(`Program does not meet authorization requirements: ${validation.errors.join(', ')}`);
    }

    return this.updateProgram(programId, {
      status: 'pending_authorization'
    });
  }

  private validateProgramForAuthorization(program: ETPProgram): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!program.objectives || program.objectives.length === 0) {
      errors.push('Program must have defined objectives');
    }
    if (!program.team || program.team.length < 2) {
      errors.push('ETP team must have at least 2 members');
    }
    if (!program.team.some(m => m.etpCertified)) {
      errors.push('At least one team member must be ETP certified');
    }
    if (!program.modules || program.modules.length === 0) {
      errors.push('Program must have at least one module');
    }
    if (!program.evaluationCriteria || program.evaluationCriteria.length === 0) {
      errors.push('Program must have evaluation criteria');
    }

    return { valid: errors.length === 0, errors };
  }

  async recordAuthorization(programId: string, data: {
    authorizationNumber: string;
    authorizationDate: string;
    expiryDate: string;
  }): Promise<ETPProgram> {
    return this.updateProgram(programId, {
      status: 'active',
      hasAuthorization: true,
      authorizationNumber: data.authorizationNumber,
      authorizationDate: data.authorizationDate,
      authorizationExpiry: data.expiryDate
    });
  }

  // ==========================================================================
  // Educational Resources
  // ==========================================================================

  async createResource(data: Partial<EducationalResource>): Promise<EducationalResource> {
    const resource: EducationalResource = {
      id: this.generateId(),
      organizationId: this.organizationId,
      title: data.title || '',
      description: data.description || '',
      type: data.type || 'document',
      category: data.category || '',
      pathology: data.pathology || '',
      language: data.language || 'fr',
      format: data.format || '',
      url: data.url,
      fileSize: data.fileSize,
      duration: data.duration,
      readingLevel: data.readingLevel || 'intermediate',
      accessibilityFeatures: data.accessibilityFeatures || [],
      tags: data.tags || [],
      targetAudience: data.targetAudience || 'patient',
      source: data.source || '',
      version: data.version || '1.0',
      validatedBy: data.validatedBy,
      validatedAt: data.validatedAt,
      expiryDate: data.expiryDate,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await ResourceDB.create(this.db, resource);
    return resource;
  }

  async getResource(id: string): Promise<EducationalResource | null> {
    return ResourceDB.getById(this.db, id);
  }

  async listResources(filters: {
    type?: ResourceType;
    category?: string;
    pathology?: string;
    targetAudience?: 'patient' | 'caregiver' | 'both';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ resources: EducationalResource[]; total: number }> {
    return ResourceDB.list(this.db, this.organizationId, filters);
  }

  async recordResourceView(resourceId: string, viewerId: string): Promise<void> {
    const resource = await this.getResource(resourceId);
    if (!resource) throw new Error('Resource not found');

    await ResourceDB.update(this.db, resourceId, {
      ...resource,
      viewCount: resource.viewCount + 1,
      updatedAt: new Date().toISOString()
    });
  }

  // ==========================================================================
  // Patient Enrollment
  // ==========================================================================

  async enrollPatient(data: {
    programId: string;
    patientId: string;
    patientName: string;
    referringProviderId?: string;
    referringProviderName?: string;
    assignedEducator: string;
    assignedEducatorName: string;
    initialDiagnosis: Partial<InitialDiagnosis>;
    educationalGoals?: Partial<EducationalGoal>[];
  }): Promise<PatientEnrollment> {
    const program = await this.getProgram(data.programId);
    if (!program) throw new Error('Program not found');

    if (program.status !== 'active') {
      throw new Error('Cannot enroll in inactive program');
    }

    if (program.currentEnrollment >= program.maxParticipants) {
      throw new Error('Program is at maximum capacity');
    }

    const enrollment: PatientEnrollment = {
      id: this.generateId(),
      organizationId: this.organizationId,
      programId: data.programId,
      programName: program.name,
      patientId: data.patientId,
      patientName: data.patientName,
      referringProviderId: data.referringProviderId,
      referringProviderName: data.referringProviderName,
      enrollmentDate: new Date().toISOString(),
      status: 'pending',
      initialDiagnosis: {
        diagnosisDate: new Date().toISOString(),
        performedBy: data.assignedEducator,
        knowledgeLevel: data.initialDiagnosis.knowledgeLevel || 0,
        skillsLevel: data.initialDiagnosis.skillsLevel || 0,
        motivationLevel: data.initialDiagnosis.motivationLevel || 0,
        barriers: data.initialDiagnosis.barriers || [],
        strengths: data.initialDiagnosis.strengths || [],
        learningStyle: data.initialDiagnosis.learningStyle || 'visual',
        healthLiteracy: data.initialDiagnosis.healthLiteracy || 'adequate',
        socialSupport: data.initialDiagnosis.socialSupport || 'moderate',
        priorities: data.initialDiagnosis.priorities || [],
        notes: data.initialDiagnosis.notes
      },
      educationalGoals: data.educationalGoals?.map(g => ({
        id: this.generateId(),
        domain: g.domain || 'knowledge',
        goal: g.goal || '',
        measurable: g.measurable || '',
        targetDate: g.targetDate || '',
        priority: g.priority || 'medium',
        status: 'not_started',
        progress: 0
      })) || [],
      assignedEducator: data.assignedEducator,
      assignedEducatorName: data.assignedEducatorName,
      sessions: [],
      completedModules: [],
      assessmentResults: [],
      progressScore: 0,
      competencyLevel: 'novice',
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update program enrollment count
    await this.updateProgram(data.programId, {
      currentEnrollment: program.currentEnrollment + 1
    });

    await EnrollmentDB.create(this.db, enrollment);
    return enrollment;
  }

  async getEnrollment(id: string): Promise<PatientEnrollment | null> {
    return EnrollmentDB.getById(this.db, id);
  }

  async updateEnrollment(id: string, updates: Partial<PatientEnrollment>): Promise<PatientEnrollment> {
    const enrollment = await this.getEnrollment(id);
    if (!enrollment) throw new Error('Enrollment not found');

    const updated: PatientEnrollment = {
      ...enrollment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await EnrollmentDB.update(this.db, id, updated);
    return updated;
  }

  async listEnrollments(filters: {
    programId?: string;
    patientId?: string;
    educatorId?: string;
    status?: EnrollmentStatus;
    page?: number;
    limit?: number;
  }): Promise<{ enrollments: PatientEnrollment[]; total: number }> {
    return EnrollmentDB.list(this.db, this.organizationId, filters);
  }

  async activateEnrollment(enrollmentId: string): Promise<PatientEnrollment> {
    return this.updateEnrollment(enrollmentId, { status: 'active' });
  }

  async withdrawEnrollment(enrollmentId: string, reason: string): Promise<PatientEnrollment> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    // Add withdrawal note
    const note: EnrollmentNote = {
      id: this.generateId(),
      date: new Date().toISOString(),
      authorId: 'system',
      authorName: 'System',
      type: 'general',
      content: `Patient withdrawn: ${reason}`,
      followUpRequired: false
    };

    // Update program enrollment count
    const program = await this.getProgram(enrollment.programId);
    if (program) {
      await this.updateProgram(enrollment.programId, {
        currentEnrollment: Math.max(0, program.currentEnrollment - 1)
      });
    }

    return this.updateEnrollment(enrollmentId, {
      status: 'withdrawn',
      notes: [...enrollment.notes, note]
    });
  }

  // ==========================================================================
  // Sessions
  // ==========================================================================

  async scheduleSession(enrollmentId: string, data: {
    moduleId?: string;
    moduleName?: string;
    scheduledDate: string;
    duration: number;
    educatorId: string;
    educatorName: string;
    type: ETPSession['type'];
    format: ETPSession['format'];
    objectives: string[];
    activitiesPlanned: string[];
  }): Promise<ETPSession> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const session: ETPSession = {
      id: this.generateId(),
      enrollmentId,
      moduleId: data.moduleId,
      moduleName: data.moduleName,
      sessionNumber: enrollment.sessions.length + 1,
      type: data.type,
      format: data.format,
      scheduledDate: data.scheduledDate,
      duration: data.duration,
      educatorId: data.educatorId,
      educatorName: data.educatorName,
      status: 'scheduled',
      objectives: data.objectives,
      activitiesPlanned: data.activitiesPlanned,
      activitiesCompleted: [],
      materialsUsed: [],
      patientParticipation: 0,
      comprehensionLevel: 0,
      skillsDemonstrated: [],
      barriers: [],
      achievements: [],
      nextSteps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    enrollment.sessions.push(session);
    enrollment.nextSession = {
      sessionId: session.id,
      date: data.scheduledDate.split('T')[0],
      time: data.scheduledDate.split('T')[1]?.substring(0, 5) || '09:00',
      duration: data.duration,
      location: data.format === 'in_person' ? 'ETP Room' : 'Remote',
      type: data.type,
      educatorName: data.educatorName
    };

    await this.updateEnrollment(enrollmentId, {
      sessions: enrollment.sessions,
      nextSession: enrollment.nextSession
    });

    return session;
  }

  async startSession(enrollmentId: string, sessionId: string): Promise<ETPSession> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const sessionIndex = enrollment.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) throw new Error('Session not found');

    enrollment.sessions[sessionIndex].status = 'in_progress';
    enrollment.sessions[sessionIndex].actualDate = new Date().toISOString();
    enrollment.sessions[sessionIndex].attendance = 'present';
    enrollment.sessions[sessionIndex].updatedAt = new Date().toISOString();

    await this.updateEnrollment(enrollmentId, { sessions: enrollment.sessions });
    return enrollment.sessions[sessionIndex];
  }

  async completeSession(enrollmentId: string, sessionId: string, data: {
    activitiesCompleted: string[];
    materialsUsed: string[];
    patientParticipation: number;
    comprehensionLevel: number;
    skillsDemonstrated: string[];
    barriers: string[];
    achievements: string[];
    nextSteps: string[];
    homeworkAssigned?: string[];
    notes?: string;
  }): Promise<ETPSession> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const sessionIndex = enrollment.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) throw new Error('Session not found');

    enrollment.sessions[sessionIndex] = {
      ...enrollment.sessions[sessionIndex],
      ...data,
      status: 'completed',
      updatedAt: new Date().toISOString()
    };

    // Update module completion if applicable
    if (enrollment.sessions[sessionIndex].moduleId) {
      if (!enrollment.completedModules.includes(enrollment.sessions[sessionIndex].moduleId!)) {
        enrollment.completedModules.push(enrollment.sessions[sessionIndex].moduleId!);
      }
    }

    // Calculate progress score
    const completedSessions = enrollment.sessions.filter(s => s.status === 'completed').length;
    const program = await this.getProgram(enrollment.programId);
    const totalSessions = program?.duration.totalSessions || enrollment.sessions.length;
    enrollment.progressScore = Math.round((completedSessions / totalSessions) * 100);

    // Update next session
    const upcomingSessions = enrollment.sessions
      .filter(s => s.status === 'scheduled' && new Date(s.scheduledDate) > new Date())
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

    if (upcomingSessions.length > 0) {
      enrollment.nextSession = {
        sessionId: upcomingSessions[0].id,
        date: upcomingSessions[0].scheduledDate.split('T')[0],
        time: upcomingSessions[0].scheduledDate.split('T')[1]?.substring(0, 5) || '09:00',
        duration: upcomingSessions[0].duration,
        location: upcomingSessions[0].format === 'in_person' ? 'ETP Room' : 'Remote',
        type: upcomingSessions[0].type,
        educatorName: upcomingSessions[0].educatorName
      };
    } else {
      enrollment.nextSession = undefined;
    }

    await this.updateEnrollment(enrollmentId, {
      sessions: enrollment.sessions,
      completedModules: enrollment.completedModules,
      progressScore: enrollment.progressScore,
      nextSession: enrollment.nextSession
    });

    return enrollment.sessions[sessionIndex];
  }

  // ==========================================================================
  // Assessments
  // ==========================================================================

  async recordAssessmentResult(enrollmentId: string, data: {
    moduleId: string;
    moduleName: string;
    assessmentId: string;
    assessmentType: string;
    score: number;
    maxScore: number;
    answers?: AssessmentAnswer[];
    feedback?: string;
    evaluatorId?: string;
    evaluatorName?: string;
  }): Promise<AssessmentResult> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const result: AssessmentResult = {
      id: this.generateId(),
      moduleId: data.moduleId,
      moduleName: data.moduleName,
      assessmentId: data.assessmentId,
      assessmentType: data.assessmentType,
      date: new Date().toISOString(),
      score: data.score,
      maxScore: data.maxScore,
      percentage: Math.round((data.score / data.maxScore) * 100),
      passed: (data.score / data.maxScore) >= 0.7, // 70% passing threshold
      attempts: enrollment.assessmentResults.filter(r => r.assessmentId === data.assessmentId).length + 1,
      answers: data.answers,
      feedback: data.feedback,
      evaluatorId: data.evaluatorId,
      evaluatorName: data.evaluatorName
    };

    enrollment.assessmentResults.push(result);

    // Update competency level based on assessment results
    enrollment.competencyLevel = this.calculateCompetencyLevel(enrollment.assessmentResults);

    await this.updateEnrollment(enrollmentId, {
      assessmentResults: enrollment.assessmentResults,
      competencyLevel: enrollment.competencyLevel
    });

    return result;
  }

  private calculateCompetencyLevel(results: AssessmentResult[]): CompetencyLevel {
    if (results.length === 0) return 'novice';

    const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / results.length;
    const passedCount = results.filter(r => r.passed).length;
    const passRate = passedCount / results.length;

    if (avgPercentage >= 90 && passRate === 1) return 'expert';
    if (avgPercentage >= 80 && passRate >= 0.9) return 'proficient';
    if (avgPercentage >= 70 && passRate >= 0.7) return 'competent';
    if (avgPercentage >= 50) return 'beginner';
    return 'novice';
  }

  // ==========================================================================
  // Goals
  // ==========================================================================

  async updateGoal(enrollmentId: string, goalId: string, updates: Partial<EducationalGoal>): Promise<EducationalGoal> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const goalIndex = enrollment.educationalGoals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) throw new Error('Goal not found');

    enrollment.educationalGoals[goalIndex] = {
      ...enrollment.educationalGoals[goalIndex],
      ...updates
    };

    if (updates.status === 'achieved' && !enrollment.educationalGoals[goalIndex].achievedAt) {
      enrollment.educationalGoals[goalIndex].achievedAt = new Date().toISOString();
    }

    await this.updateEnrollment(enrollmentId, {
      educationalGoals: enrollment.educationalGoals
    });

    return enrollment.educationalGoals[goalIndex];
  }

  // ==========================================================================
  // Program Completion
  // ==========================================================================

  async completeProgram(enrollmentId: string): Promise<PatientEnrollment> {
    const enrollment = await this.getEnrollment(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    // Validate completion requirements
    const program = await this.getProgram(enrollment.programId);
    if (!program) throw new Error('Program not found');

    const requiredModules = program.modules.filter(m => m.isRequired);
    const completedRequired = requiredModules.every(m =>
      enrollment.completedModules.includes(m.id)
    );

    if (!completedRequired) {
      throw new Error('Not all required modules are completed');
    }

    // Generate completion certificate
    const certificateId = `CERT-${enrollment.programId.substring(0, 4)}-${Date.now()}`;

    // Update program completion rate
    const { enrollments } = await this.listEnrollments({ programId: enrollment.programId });
    const completedCount = enrollments.filter(e => e.status === 'completed').length + 1;
    const completionRate = Math.round((completedCount / program.currentEnrollment) * 100);

    await this.updateProgram(enrollment.programId, { completionRate });

    return this.updateEnrollment(enrollmentId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      completionCertificate: certificateId,
      progressScore: 100
    });
  }

  // ==========================================================================
  // Analytics
  // ==========================================================================

  async getAnalytics(startDate: string, endDate: string): Promise<ETPAnalytics> {
    const { programs } = await this.listPrograms({ limit: 100 });
    const { enrollments } = await this.listEnrollments({ limit: 1000 });

    // Filter by date range
    const periodEnrollments = enrollments.filter(e =>
      e.createdAt >= startDate && e.createdAt <= endDate
    );

    // Program metrics
    const programMetrics: ProgramMetrics[] = programs.map(p => {
      const progEnrollments = enrollments.filter(e => e.programId === p.id);
      const completed = progEnrollments.filter(e => e.status === 'completed');
      const withdrawn = progEnrollments.filter(e => e.status === 'withdrawn');

      return {
        programId: p.id,
        programName: p.name,
        totalEnrollments: progEnrollments.length,
        activeEnrollments: progEnrollments.filter(e => e.status === 'active').length,
        completionRate: progEnrollments.length > 0 ? (completed.length / progEnrollments.length) * 100 : 0,
        dropoutRate: progEnrollments.length > 0 ? (withdrawn.length / progEnrollments.length) * 100 : 0,
        avgCompletionTime: 0, // Would calculate from actual data
        patientSatisfaction: p.patientSatisfaction || 0
      };
    });

    // Enrollment metrics
    const enrollmentMetrics: EnrollmentMetrics = {
      totalEnrollments: enrollments.length,
      newEnrollments: periodEnrollments.length,
      completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
      withdrawnEnrollments: enrollments.filter(e => e.status === 'withdrawn').length,
      avgProgressScore: enrollments.reduce((sum, e) => sum + e.progressScore, 0) / enrollments.length || 0
    };

    // Session metrics
    const allSessions = enrollments.flatMap(e => e.sessions);
    const sessionMetrics: SessionMetrics = {
      totalSessions: allSessions.length,
      completedSessions: allSessions.filter(s => s.status === 'completed').length,
      cancelledSessions: allSessions.filter(s => s.status === 'cancelled').length,
      noShowRate: allSessions.length > 0
        ? (allSessions.filter(s => s.attendance === 'absent').length / allSessions.length) * 100
        : 0,
      avgDuration: allSessions.reduce((sum, s) => sum + s.duration, 0) / allSessions.length || 0,
      avgParticipation: allSessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + s.patientParticipation, 0) / allSessions.filter(s => s.status === 'completed').length || 0
    };

    // Outcome metrics
    const activeEnrollments = enrollments.filter(e => e.status === 'active' || e.status === 'completed');
    const outcomeMetrics: OutcomeMetrics = {
      knowledgeImprovement: this.calculateAverageImprovement(activeEnrollments, 'knowledgeLevel'),
      skillsImprovement: this.calculateAverageImprovement(activeEnrollments, 'skillsLevel'),
      behaviorChange: 0, // Would need behavior tracking
      goalsAchieved: activeEnrollments.flatMap(e => e.educationalGoals.filter(g => g.status === 'achieved')).length
    };

    return {
      period: { startDate, endDate },
      programMetrics,
      enrollmentMetrics,
      sessionMetrics,
      outcomeMetrics,
      educatorMetrics: []
    };
  }

  private calculateAverageImprovement(enrollments: PatientEnrollment[], field: 'knowledgeLevel' | 'skillsLevel'): number {
    const improvements = enrollments
      .filter(e => e.initialDiagnosis && e.assessmentResults.length > 0)
      .map(e => {
        const initial = e.initialDiagnosis[field] || 0;
        const current = e.assessmentResults.reduce((sum, r) => sum + r.percentage, 0) / e.assessmentResults.length || 0;
        return current - initial;
      });

    return improvements.length > 0
      ? Math.round(improvements.reduce((a, b) => a + b) / improvements.length)
      : 0;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `etp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateProgramCode(): Promise<string> {
    const count = await ProgramDB.count(this.db, this.organizationId);
    return `ETP-${String(count + 1).padStart(4, '0')}`;
  }
}

// ============================================================================
// Database Layer (Stubs)
// ============================================================================

class ProgramDB {
  static async create(db: D1Database, program: ETPProgram): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<ETPProgram | null> { return null; }
  static async update(db: D1Database, id: string, program: ETPProgram): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ programs: ETPProgram[]; total: number }> {
    return { programs: [], total: 0 };
  }
  static async count(db: D1Database, orgId: string): Promise<number> { return 0; }
}

class ResourceDB {
  static async create(db: D1Database, resource: EducationalResource): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<EducationalResource | null> { return null; }
  static async update(db: D1Database, id: string, resource: EducationalResource): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ resources: EducationalResource[]; total: number }> {
    return { resources: [], total: 0 };
  }
}

class EnrollmentDB {
  static async create(db: D1Database, enrollment: PatientEnrollment): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<PatientEnrollment | null> { return null; }
  static async update(db: D1Database, id: string, enrollment: PatientEnrollment): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ enrollments: PatientEnrollment[]; total: number }> {
    return { enrollments: [], total: 0 };
  }
}

export default PatientEducationService;
