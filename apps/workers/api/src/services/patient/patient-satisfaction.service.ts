/**
 * Patient Satisfaction Service - Satisfaction Patient
 *
 * Comprehensive patient satisfaction measurement including:
 * - NPS (Net Promoter Score)
 * - HCAHPS-style surveys
 * - Real-time feedback
 * - Sentiment analysis
 * - Quality improvement integration
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Survey {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: SurveyType;
  status: SurveyStatus;
  version: string;
  language: string;
  sections: SurveySection[];
  settings: SurveySettings;
  targetAudience: TargetAudience;
  triggers: SurveyTrigger[];
  benchmarks?: SurveyBenchmarks;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

export type SurveyType =
  | 'nps'                    // Net Promoter Score
  | 'csat'                   // Customer Satisfaction
  | 'hcahps'                 // Hospital Consumer Assessment
  | 'discharge'              // Post-discharge
  | 'outpatient'             // Outpatient visit
  | 'emergency'              // Emergency department
  | 'procedure'              // Post-procedure
  | 'custom';

export type SurveyStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface SurveySection {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: SurveyQuestion[];
  conditional?: SectionCondition;
}

export interface SectionCondition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: any;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options?: QuestionOption[];
  scale?: ScaleConfig;
  validation?: QuestionValidation;
  category?: string;
  benchmarkKey?: string;
  conditional?: QuestionCondition;
}

export type QuestionType =
  | 'nps'                    // 0-10 NPS scale
  | 'rating'                 // 1-5 stars
  | 'scale'                  // Custom scale
  | 'single_choice'
  | 'multiple_choice'
  | 'text'
  | 'textarea'
  | 'yes_no'
  | 'likert';                // Strongly disagree to strongly agree

export interface QuestionOption {
  id: string;
  text: string;
  value: string | number;
  order: number;
}

export interface ScaleConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  step: number;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minValue?: number;
  maxValue?: number;
}

export interface QuestionCondition {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface SurveySettings {
  allowAnonymous: boolean;
  allowSkip: boolean;
  showProgress: boolean;
  randomizeQuestions: boolean;
  thankYouMessage: string;
  redirectUrl?: string;
  expirationDays: number;
  maxResponses?: number;
  reminderEnabled: boolean;
  reminderDays: number[];
}

export interface TargetAudience {
  departments?: string[];
  services?: string[];
  providers?: string[];
  patientTypes?: string[];
  ageRange?: { min: number; max: number };
  excludePatterns?: string[];
}

export interface SurveyTrigger {
  type: 'discharge' | 'appointment' | 'procedure' | 'manual' | 'scheduled';
  delay: number; // hours after event
  conditions?: TriggerCondition[];
}

export interface TriggerCondition {
  field: string;
  operator: string;
  value: any;
}

export interface SurveyBenchmarks {
  nationalAverage?: number;
  stateAverage?: number;
  peerGroupAverage?: number;
  previousYear?: number;
  target?: number;
}

// Survey Response
export interface SurveyResponse {
  id: string;
  organizationId: string;
  surveyId: string;
  surveyName: string;
  surveyType: SurveyType;
  patientId?: string;
  patientName?: string;
  encounterId?: string;
  encounterType?: string;
  providerId?: string;
  providerName?: string;
  departmentId?: string;
  departmentName?: string;
  status: ResponseStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number; // seconds
  channel: ResponseChannel;
  deviceType?: string;
  anonymous: boolean;
  answers: ResponseAnswer[];
  npsScore?: number;
  npsCategory?: 'promoter' | 'passive' | 'detractor';
  csatScore?: number;
  overallSatisfaction?: number;
  sentimentScore?: number;
  sentimentLabel?: 'positive' | 'neutral' | 'negative';
  tags: string[];
  followUpRequired: boolean;
  followUpReason?: string;
  followUpStatus?: 'pending' | 'in_progress' | 'completed';
  followUpAssignee?: string;
  followUpNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResponseStatus = 'started' | 'partial' | 'completed' | 'expired' | 'declined';

export type ResponseChannel = 'email' | 'sms' | 'tablet' | 'kiosk' | 'web' | 'phone' | 'in_person';

export interface ResponseAnswer {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  value: any;
  textValue?: string;
  numericValue?: number;
  selectedOptions?: string[];
  category?: string;
  benchmarkKey?: string;
  answeredAt: string;
}

// Survey Invitation
export interface SurveyInvitation {
  id: string;
  organizationId: string;
  surveyId: string;
  surveyName: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  encounterId?: string;
  encounterDate?: string;
  providerId?: string;
  providerName?: string;
  channel: ResponseChannel;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  sentAt?: string;
  openedAt?: string;
  startedAt?: string;
  completedAt?: string;
  reminders: ReminderRecord[];
  createdAt: string;
}

export type InvitationStatus =
  | 'pending'
  | 'sent'
  | 'opened'
  | 'started'
  | 'completed'
  | 'expired'
  | 'opted_out';

export interface ReminderRecord {
  sentAt: string;
  channel: 'email' | 'sms';
  success: boolean;
}

// Analytics
export interface SatisfactionAnalytics {
  period: { startDate: string; endDate: string };
  summary: SatisfactionSummary;
  npsAnalysis: NPSAnalysis;
  questionAnalysis: QuestionAnalysis[];
  trendAnalysis: TrendData[];
  departmentComparison: DepartmentMetrics[];
  providerComparison: ProviderMetrics[];
  textAnalysis: TextAnalysis;
  alerts: SatisfactionAlert[];
}

export interface SatisfactionSummary {
  totalResponses: number;
  completionRate: number;
  responseRate: number;
  averageNPS: number;
  averageCSAT: number;
  averageSatisfaction: number;
  promoterPercentage: number;
  detractorPercentage: number;
  positiveComments: number;
  negativeComments: number;
}

export interface NPSAnalysis {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPercentage: number;
  passivePercentage: number;
  detractorPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
  changeFromPrevious: number;
  benchmark?: number;
}

export interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  category?: string;
  responseCount: number;
  averageScore?: number;
  distribution: { value: any; count: number; percentage: number }[];
  benchmark?: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface TrendData {
  period: string;
  nps: number;
  csat: number;
  satisfaction: number;
  responseCount: number;
}

export interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  responseCount: number;
  nps: number;
  satisfaction: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ProviderMetrics {
  providerId: string;
  providerName: string;
  responseCount: number;
  nps: number;
  satisfaction: number;
  topStrengths: string[];
  improvementAreas: string[];
}

export interface TextAnalysis {
  topThemes: Theme[];
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  commonPhrases: { phrase: string; count: number; sentiment: string }[];
  wordCloud: { word: string; count: number }[];
  actionableInsights: string[];
}

export interface Theme {
  theme: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  examples: string[];
}

export interface SatisfactionAlert {
  id: string;
  type: 'low_nps' | 'detractor' | 'negative_trend' | 'urgent_feedback';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  relatedResponseId?: string;
  createdAt: string;
  acknowledged: boolean;
}

// Dashboard
export interface SatisfactionDashboard {
  summary: DashboardSummary;
  npsGauge: NPSGaugeData;
  recentResponses: SurveyResponse[];
  pendingFollowUps: SurveyResponse[];
  activeSurveys: SurveyStatus[];
  weeklyTrend: TrendData[];
  topComments: TopComment[];
  alerts: SatisfactionAlert[];
}

export interface DashboardSummary {
  responsesToday: number;
  responseRate: number;
  currentNPS: number;
  npsChange: number;
  satisfaction: number;
  pendingFollowUps: number;
}

export interface NPSGaugeData {
  score: number;
  target: number;
  benchmark: number;
  promoters: number;
  passives: number;
  detractors: number;
}

export interface SurveyStatusSummary {
  surveyId: string;
  surveyName: string;
  responsesThisWeek: number;
  averageNPS: number;
}

export interface TopComment {
  responseId: string;
  patientName?: string;
  comment: string;
  sentiment: 'positive' | 'negative';
  department?: string;
  date: string;
}

// ============================================================================
// Patient Satisfaction Service Class
// ============================================================================

export class PatientSatisfactionService {
  private db: D1Database;
  private organizationId: string;

  constructor(db: D1Database, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  // ==========================================================================
  // Survey Management
  // ==========================================================================

  async createSurvey(data: Partial<Survey>): Promise<Survey> {
    const survey: Survey = {
      id: this.generateId(),
      organizationId: this.organizationId,
      name: data.name || '',
      description: data.description || '',
      type: data.type || 'custom',
      status: 'draft',
      version: '1.0',
      language: data.language || 'fr',
      sections: data.sections || [],
      settings: data.settings || {
        allowAnonymous: true,
        allowSkip: false,
        showProgress: true,
        randomizeQuestions: false,
        thankYouMessage: 'Merci pour votre retour !',
        expirationDays: 14,
        reminderEnabled: true,
        reminderDays: [3, 7]
      },
      targetAudience: data.targetAudience || {},
      triggers: data.triggers || [],
      benchmarks: data.benchmarks,
      createdBy: data.createdBy || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add default NPS question for NPS surveys
    if (survey.type === 'nps' && survey.sections.length === 0) {
      survey.sections.push({
        id: this.generateId(),
        title: 'Recommandation',
        order: 1,
        questions: [
          {
            id: this.generateId(),
            text: 'Sur une échelle de 0 à 10, quelle est la probabilité que vous recommandiez notre établissement à un ami ou un proche ?',
            type: 'nps',
            required: true,
            order: 1,
            scale: { min: 0, max: 10, minLabel: 'Pas du tout probable', maxLabel: 'Très probable', step: 1 },
            benchmarkKey: 'nps_score'
          },
          {
            id: this.generateId(),
            text: 'Pourquoi avez-vous donné cette note ?',
            type: 'textarea',
            required: false,
            order: 2
          }
        ]
      });
    }

    await SurveyDB.create(this.db, survey);
    return survey;
  }

  async getSurvey(id: string): Promise<Survey | null> {
    return SurveyDB.getById(this.db, id);
  }

  async updateSurvey(id: string, updates: Partial<Survey>): Promise<Survey> {
    const survey = await this.getSurvey(id);
    if (!survey) throw new Error('Survey not found');

    // Increment version if content changed
    let version = survey.version;
    if (updates.sections) {
      const [major, minor] = survey.version.split('.').map(Number);
      version = `${major}.${minor + 1}`;
    }

    const updated: Survey = {
      ...survey,
      ...updates,
      version,
      updatedAt: new Date().toISOString()
    };

    await SurveyDB.update(this.db, id, updated);
    return updated;
  }

  async publishSurvey(id: string): Promise<Survey> {
    const survey = await this.getSurvey(id);
    if (!survey) throw new Error('Survey not found');

    if (survey.sections.length === 0) {
      throw new Error('Survey must have at least one section');
    }

    const hasQuestions = survey.sections.some(s => s.questions.length > 0);
    if (!hasQuestions) {
      throw new Error('Survey must have at least one question');
    }

    return this.updateSurvey(id, {
      status: 'active',
      publishedAt: new Date().toISOString()
    });
  }

  async listSurveys(filters: {
    status?: SurveyStatus;
    type?: SurveyType;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ surveys: Survey[]; total: number }> {
    return SurveyDB.list(this.db, this.organizationId, filters);
  }

  // ==========================================================================
  // Survey Invitations
  // ==========================================================================

  async createInvitation(data: {
    surveyId: string;
    patientId: string;
    patientName: string;
    patientEmail?: string;
    patientPhone?: string;
    encounterId?: string;
    encounterDate?: string;
    providerId?: string;
    providerName?: string;
    channel: ResponseChannel;
  }): Promise<SurveyInvitation> {
    const survey = await this.getSurvey(data.surveyId);
    if (!survey) throw new Error('Survey not found');

    if (survey.status !== 'active') {
      throw new Error('Survey is not active');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + survey.settings.expirationDays);

    const invitation: SurveyInvitation = {
      id: this.generateId(),
      organizationId: this.organizationId,
      surveyId: data.surveyId,
      surveyName: survey.name,
      patientId: data.patientId,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      encounterId: data.encounterId,
      encounterDate: data.encounterDate,
      providerId: data.providerId,
      providerName: data.providerName,
      channel: data.channel,
      status: 'pending',
      token: this.generateToken(),
      expiresAt: expiresAt.toISOString(),
      reminders: [],
      createdAt: new Date().toISOString()
    };

    await InvitationDB.create(this.db, invitation);
    return invitation;
  }

  async sendInvitation(invitationId: string): Promise<SurveyInvitation> {
    const invitation = await InvitationDB.getById(this.db, invitationId);
    if (!invitation) throw new Error('Invitation not found');

    // Would integrate with messaging service here
    console.log(`Sending survey invitation via ${invitation.channel} to ${invitation.patientName}`);

    invitation.status = 'sent';
    invitation.sentAt = new Date().toISOString();

    await InvitationDB.update(this.db, invitationId, invitation);
    return invitation;
  }

  async sendReminder(invitationId: string): Promise<SurveyInvitation> {
    const invitation = await InvitationDB.getById(this.db, invitationId);
    if (!invitation) throw new Error('Invitation not found');

    if (invitation.status === 'completed' || invitation.status === 'expired') {
      throw new Error('Cannot send reminder for completed or expired invitation');
    }

    // Would integrate with messaging service here
    console.log(`Sending reminder via ${invitation.channel}`);

    invitation.reminders.push({
      sentAt: new Date().toISOString(),
      channel: invitation.channel === 'email' ? 'email' : 'sms',
      success: true
    });

    await InvitationDB.update(this.db, invitationId, invitation);
    return invitation;
  }

  // ==========================================================================
  // Survey Responses
  // ==========================================================================

  async startResponse(token: string): Promise<{ response: SurveyResponse; survey: Survey }> {
    const invitation = await InvitationDB.getByToken(this.db, token);
    if (!invitation) throw new Error('Invalid or expired survey link');

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired';
      await InvitationDB.update(this.db, invitation.id, invitation);
      throw new Error('Survey invitation has expired');
    }

    const survey = await this.getSurvey(invitation.surveyId);
    if (!survey) throw new Error('Survey not found');

    const response: SurveyResponse = {
      id: this.generateId(),
      organizationId: this.organizationId,
      surveyId: survey.id,
      surveyName: survey.name,
      surveyType: survey.type,
      patientId: invitation.patientId,
      patientName: invitation.patientName,
      encounterId: invitation.encounterId,
      providerId: invitation.providerId,
      providerName: invitation.providerName,
      status: 'started',
      startedAt: new Date().toISOString(),
      channel: invitation.channel,
      anonymous: survey.settings.allowAnonymous,
      answers: [],
      tags: [],
      followUpRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update invitation
    invitation.status = 'started';
    invitation.startedAt = new Date().toISOString();
    await InvitationDB.update(this.db, invitation.id, invitation);

    await ResponseDB.create(this.db, response);

    return { response, survey };
  }

  async submitAnswer(responseId: string, answer: Omit<ResponseAnswer, 'answeredAt'>): Promise<SurveyResponse> {
    const response = await this.getResponse(responseId);
    if (!response) throw new Error('Response not found');

    const fullAnswer: ResponseAnswer = {
      ...answer,
      answeredAt: new Date().toISOString()
    };

    response.answers.push(fullAnswer);
    response.status = 'partial';
    response.updatedAt = new Date().toISOString();

    await ResponseDB.update(this.db, responseId, response);
    return response;
  }

  async completeResponse(responseId: string): Promise<SurveyResponse> {
    const response = await this.getResponse(responseId);
    if (!response) throw new Error('Response not found');

    const completedAt = new Date().toISOString();
    const duration = Math.round(
      (new Date(completedAt).getTime() - new Date(response.startedAt).getTime()) / 1000
    );

    // Calculate scores
    const npsAnswer = response.answers.find(a => a.questionType === 'nps');
    let npsScore: number | undefined;
    let npsCategory: 'promoter' | 'passive' | 'detractor' | undefined;

    if (npsAnswer && typeof npsAnswer.numericValue === 'number') {
      npsScore = npsAnswer.numericValue;
      if (npsScore >= 9) npsCategory = 'promoter';
      else if (npsScore >= 7) npsCategory = 'passive';
      else npsCategory = 'detractor';
    }

    // Calculate average satisfaction from rating questions
    const ratingAnswers = response.answers.filter(a =>
      a.questionType === 'rating' || a.questionType === 'scale'
    );
    const overallSatisfaction = ratingAnswers.length > 0
      ? ratingAnswers.reduce((sum, a) => sum + (a.numericValue || 0), 0) / ratingAnswers.length
      : undefined;

    // Analyze text responses for sentiment
    const textAnswers = response.answers.filter(a =>
      a.questionType === 'text' || a.questionType === 'textarea'
    );
    const { sentimentScore, sentimentLabel } = this.analyzeSentiment(textAnswers);

    // Determine if follow-up is needed
    const followUpRequired = npsCategory === 'detractor' || sentimentLabel === 'negative';

    const updated: SurveyResponse = {
      ...response,
      status: 'completed',
      completedAt,
      duration,
      npsScore,
      npsCategory,
      overallSatisfaction,
      sentimentScore,
      sentimentLabel,
      followUpRequired,
      followUpReason: followUpRequired
        ? (npsCategory === 'detractor' ? 'Detractor score' : 'Negative sentiment detected')
        : undefined,
      updatedAt: completedAt
    };

    // Update invitation
    const invitation = await InvitationDB.getByPatientAndSurvey(
      this.db,
      response.patientId || '',
      response.surveyId
    );
    if (invitation) {
      invitation.status = 'completed';
      invitation.completedAt = completedAt;
      await InvitationDB.update(this.db, invitation.id, invitation);
    }

    await ResponseDB.update(this.db, responseId, updated);

    // Create alert for detractors
    if (npsCategory === 'detractor') {
      await this.createAlert({
        type: 'detractor',
        severity: npsScore !== undefined && npsScore <= 3 ? 'high' : 'medium',
        title: 'Détracteur identifié',
        description: `NPS score: ${npsScore}. ${response.patientName} a donné une note basse.`,
        relatedResponseId: responseId
      });
    }

    return updated;
  }

  private analyzeSentiment(textAnswers: ResponseAnswer[]): {
    sentimentScore: number;
    sentimentLabel: 'positive' | 'neutral' | 'negative';
  } {
    if (textAnswers.length === 0) {
      return { sentimentScore: 0, sentimentLabel: 'neutral' };
    }

    // Simple keyword-based sentiment analysis (would use ML in production)
    const positiveWords = ['excellent', 'très bien', 'satisfait', 'recommande', 'merci', 'parfait', 'génial', 'super'];
    const negativeWords = ['mauvais', 'insatisfait', 'attente', 'long', 'problème', 'déçu', 'horrible', 'nul'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const answer of textAnswers) {
      const text = (answer.textValue || '').toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    }

    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { sentimentScore: 0, sentimentLabel: 'neutral' };
    }

    const score = ((positiveCount - negativeCount) / total);
    const label = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

    return { sentimentScore: Math.round(score * 100), sentimentLabel: label };
  }

  async getResponse(id: string): Promise<SurveyResponse | null> {
    return ResponseDB.getById(this.db, id);
  }

  async listResponses(filters: {
    surveyId?: string;
    patientId?: string;
    providerId?: string;
    departmentId?: string;
    npsCategory?: 'promoter' | 'passive' | 'detractor';
    followUpRequired?: boolean;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ responses: SurveyResponse[]; total: number }> {
    return ResponseDB.list(this.db, this.organizationId, filters);
  }

  // ==========================================================================
  // Follow-up Management
  // ==========================================================================

  async assignFollowUp(responseId: string, assignee: string): Promise<SurveyResponse> {
    const response = await this.getResponse(responseId);
    if (!response) throw new Error('Response not found');

    return this.updateResponse(responseId, {
      followUpStatus: 'pending',
      followUpAssignee: assignee
    });
  }

  async updateFollowUp(responseId: string, data: {
    status: 'in_progress' | 'completed';
    notes: string;
  }): Promise<SurveyResponse> {
    const response = await this.getResponse(responseId);
    if (!response) throw new Error('Response not found');

    const existingNotes = response.followUpNotes || '';
    const newNotes = `${existingNotes}\n[${new Date().toISOString()}] ${data.notes}`.trim();

    return this.updateResponse(responseId, {
      followUpStatus: data.status,
      followUpNotes: newNotes
    });
  }

  private async updateResponse(id: string, updates: Partial<SurveyResponse>): Promise<SurveyResponse> {
    const response = await this.getResponse(id);
    if (!response) throw new Error('Response not found');

    const updated: SurveyResponse = {
      ...response,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await ResponseDB.update(this.db, id, updated);
    return updated;
  }

  // ==========================================================================
  // Alerts
  // ==========================================================================

  async createAlert(data: Omit<SatisfactionAlert, 'id' | 'createdAt' | 'acknowledged'>): Promise<SatisfactionAlert> {
    const alert: SatisfactionAlert = {
      id: this.generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      acknowledged: false
    };

    await AlertDB.create(this.db, alert);
    return alert;
  }

  async acknowledgeAlert(alertId: string): Promise<SatisfactionAlert> {
    const alert = await AlertDB.getById(this.db, alertId);
    if (!alert) throw new Error('Alert not found');

    alert.acknowledged = true;
    await AlertDB.update(this.db, alertId, alert);
    return alert;
  }

  // ==========================================================================
  // Analytics
  // ==========================================================================

  async getAnalytics(filters: {
    surveyId?: string;
    departmentId?: string;
    providerId?: string;
    startDate: string;
    endDate: string;
  }): Promise<SatisfactionAnalytics> {
    const { responses } = await this.listResponses({
      surveyId: filters.surveyId,
      departmentId: filters.departmentId,
      providerId: filters.providerId,
      fromDate: filters.startDate,
      toDate: filters.endDate,
      limit: 10000
    });

    const completed = responses.filter(r => r.status === 'completed');

    // Summary
    const npsResponses = completed.filter(r => r.npsScore !== undefined);
    const promoters = npsResponses.filter(r => r.npsCategory === 'promoter');
    const detractors = npsResponses.filter(r => r.npsCategory === 'detractor');

    const summary: SatisfactionSummary = {
      totalResponses: completed.length,
      completionRate: responses.length > 0 ? (completed.length / responses.length) * 100 : 0,
      responseRate: 0, // Would need invitation data
      averageNPS: npsResponses.length > 0
        ? Math.round(((promoters.length - detractors.length) / npsResponses.length) * 100)
        : 0,
      averageCSAT: this.calculateAverageCSAT(completed),
      averageSatisfaction: completed.filter(r => r.overallSatisfaction)
        .reduce((sum, r) => sum + (r.overallSatisfaction || 0), 0) / completed.length || 0,
      promoterPercentage: npsResponses.length > 0 ? (promoters.length / npsResponses.length) * 100 : 0,
      detractorPercentage: npsResponses.length > 0 ? (detractors.length / npsResponses.length) * 100 : 0,
      positiveComments: completed.filter(r => r.sentimentLabel === 'positive').length,
      negativeComments: completed.filter(r => r.sentimentLabel === 'negative').length
    };

    // NPS Analysis
    const passives = npsResponses.filter(r => r.npsCategory === 'passive');
    const npsAnalysis: NPSAnalysis = {
      score: summary.averageNPS,
      promoters: promoters.length,
      passives: passives.length,
      detractors: detractors.length,
      promoterPercentage: summary.promoterPercentage,
      passivePercentage: npsResponses.length > 0 ? (passives.length / npsResponses.length) * 100 : 0,
      detractorPercentage: summary.detractorPercentage,
      trend: 'stable',
      changeFromPrevious: 0
    };

    // Question Analysis
    const questionAnalysis: QuestionAnalysis[] = [];
    const allAnswers = completed.flatMap(r => r.answers);
    const questionIds = [...new Set(allAnswers.map(a => a.questionId))];

    for (const qId of questionIds) {
      const answers = allAnswers.filter(a => a.questionId === qId);
      if (answers.length === 0) continue;

      const numericAnswers = answers.filter(a => a.numericValue !== undefined);
      const avgScore = numericAnswers.length > 0
        ? numericAnswers.reduce((sum, a) => sum + (a.numericValue || 0), 0) / numericAnswers.length
        : undefined;

      // Calculate distribution
      const valueCounts = new Map<any, number>();
      answers.forEach(a => {
        valueCounts.set(a.value, (valueCounts.get(a.value) || 0) + 1);
      });

      questionAnalysis.push({
        questionId: qId,
        questionText: answers[0].questionText,
        category: answers[0].category,
        responseCount: answers.length,
        averageScore: avgScore,
        distribution: Array.from(valueCounts.entries()).map(([value, count]) => ({
          value,
          count,
          percentage: (count / answers.length) * 100
        })),
        trend: 'stable'
      });
    }

    // Text Analysis
    const textAnswers = allAnswers.filter(a =>
      a.questionType === 'text' || a.questionType === 'textarea'
    );
    const textAnalysis: TextAnalysis = {
      topThemes: [],
      sentimentBreakdown: {
        positive: completed.filter(r => r.sentimentLabel === 'positive').length,
        neutral: completed.filter(r => r.sentimentLabel === 'neutral').length,
        negative: completed.filter(r => r.sentimentLabel === 'negative').length
      },
      commonPhrases: [],
      wordCloud: [],
      actionableInsights: []
    };

    return {
      period: { startDate: filters.startDate, endDate: filters.endDate },
      summary,
      npsAnalysis,
      questionAnalysis,
      trendAnalysis: [],
      departmentComparison: [],
      providerComparison: [],
      textAnalysis,
      alerts: []
    };
  }

  private calculateAverageCSAT(responses: SurveyResponse[]): number {
    const csatResponses = responses.filter(r => r.csatScore !== undefined);
    if (csatResponses.length === 0) return 0;
    return Math.round(
      csatResponses.reduce((sum, r) => sum + (r.csatScore || 0), 0) / csatResponses.length
    );
  }

  // ==========================================================================
  // Dashboard
  // ==========================================================================

  async getDashboard(): Promise<SatisfactionDashboard> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { responses } = await this.listResponses({
      fromDate: weekAgo,
      limit: 1000
    });

    const todayResponses = responses.filter(r => r.createdAt.startsWith(today));
    const completedResponses = responses.filter(r => r.status === 'completed');

    // NPS calculation
    const npsResponses = completedResponses.filter(r => r.npsScore !== undefined);
    const promoters = npsResponses.filter(r => r.npsCategory === 'promoter').length;
    const detractors = npsResponses.filter(r => r.npsCategory === 'detractor').length;
    const currentNPS = npsResponses.length > 0
      ? Math.round(((promoters - detractors) / npsResponses.length) * 100)
      : 0;

    const summary: DashboardSummary = {
      responsesToday: todayResponses.length,
      responseRate: 0,
      currentNPS,
      npsChange: 0,
      satisfaction: completedResponses
        .filter(r => r.overallSatisfaction)
        .reduce((sum, r) => sum + (r.overallSatisfaction || 0), 0) / completedResponses.length || 0,
      pendingFollowUps: responses.filter(r => r.followUpRequired && r.followUpStatus !== 'completed').length
    };

    const npsGauge: NPSGaugeData = {
      score: currentNPS,
      target: 50,
      benchmark: 40,
      promoters,
      passives: npsResponses.filter(r => r.npsCategory === 'passive').length,
      detractors
    };

    // Recent responses
    const recentResponses = completedResponses
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 10);

    // Pending follow-ups
    const pendingFollowUps = responses
      .filter(r => r.followUpRequired && r.followUpStatus !== 'completed')
      .slice(0, 10);

    // Top comments
    const topComments: TopComment[] = completedResponses
      .filter(r => r.sentimentLabel && r.answers.some(a => a.textValue))
      .slice(0, 5)
      .map(r => {
        const textAnswer = r.answers.find(a => a.textValue);
        return {
          responseId: r.id,
          patientName: r.anonymous ? 'Anonyme' : r.patientName,
          comment: textAnswer?.textValue || '',
          sentiment: r.sentimentLabel as 'positive' | 'negative',
          department: r.departmentName,
          date: r.completedAt || r.createdAt
        };
      });

    // Alerts
    const alerts = await AlertDB.listActive(this.db, this.organizationId);

    return {
      summary,
      npsGauge,
      recentResponses,
      pendingFollowUps,
      activeSurveys: [],
      weeklyTrend: [],
      topComments,
      alerts
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `sat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateToken(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 12)}`;
  }
}

// ============================================================================
// Database Layer (Stubs)
// ============================================================================

class SurveyDB {
  static async create(db: D1Database, survey: Survey): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<Survey | null> { return null; }
  static async update(db: D1Database, id: string, survey: Survey): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ surveys: Survey[]; total: number }> {
    return { surveys: [], total: 0 };
  }
}

class InvitationDB {
  static async create(db: D1Database, invitation: SurveyInvitation): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<SurveyInvitation | null> { return null; }
  static async getByToken(db: D1Database, token: string): Promise<SurveyInvitation | null> { return null; }
  static async getByPatientAndSurvey(db: D1Database, patientId: string, surveyId: string): Promise<SurveyInvitation | null> { return null; }
  static async update(db: D1Database, id: string, invitation: SurveyInvitation): Promise<void> {}
}

class ResponseDB {
  static async create(db: D1Database, response: SurveyResponse): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<SurveyResponse | null> { return null; }
  static async update(db: D1Database, id: string, response: SurveyResponse): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ responses: SurveyResponse[]; total: number }> {
    return { responses: [], total: 0 };
  }
}

class AlertDB {
  static async create(db: D1Database, alert: SatisfactionAlert): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<SatisfactionAlert | null> { return null; }
  static async update(db: D1Database, id: string, alert: SatisfactionAlert): Promise<void> {}
  static async listActive(db: D1Database, orgId: string): Promise<SatisfactionAlert[]> { return []; }
}

export default PatientSatisfactionService;
