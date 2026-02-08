/**
 * Smart Reminders Service - Rappels Intelligents
 *
 * Automated appointment reminders, medication reminders, and preventive care alerts
 * with multi-channel delivery (SMS, Email, Push) and intelligent scheduling
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Reminder {
  id: string;
  organizationId: string;
  type: ReminderType;
  category: ReminderCategory;
  priority: ReminderPriority;
  status: ReminderStatus;

  // Target
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  patientLanguage: string;

  // Content
  title: string;
  message: string;
  shortMessage?: string; // For SMS
  actionUrl?: string;
  actionLabel?: string;

  // Related Entity
  relatedEntityType?: 'appointment' | 'prescription' | 'lab_order' | 'vaccination' | 'screening';
  relatedEntityId?: string;
  relatedEntityDetails?: Record<string, any>;

  // Scheduling
  scheduledAt: string;
  timezone: string;
  reminderWindow: ReminderWindow;

  // Delivery
  channels: DeliveryChannel[];
  deliveryAttempts: DeliveryAttempt[];
  lastAttemptAt?: string;
  deliveredAt?: string;
  readAt?: string;

  // Response
  acknowledged: boolean;
  acknowledgedAt?: string;
  response?: ReminderResponse;

  // Recurrence
  recurring: boolean;
  recurrenceRule?: RecurrenceRule;
  parentReminderId?: string;
  occurrenceNumber?: number;

  // Metadata
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelledReason?: string;
}

export type ReminderType =
  | 'appointment'           // Rendez-vous
  | 'medication'            // Médicament
  | 'lab_result'            // Résultats labo
  | 'follow_up'             // Suivi
  | 'vaccination'           // Vaccination
  | 'screening'             // Dépistage
  | 'prescription_refill'   // Renouvellement
  | 'preventive_care'       // Soins préventifs
  | 'payment'               // Paiement
  | 'document'              // Document
  | 'custom';               // Personnalisé

export type ReminderCategory =
  | 'clinical'
  | 'administrative'
  | 'financial'
  | 'preventive';

export type ReminderPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ReminderStatus =
  | 'scheduled'
  | 'pending'
  | 'sending'
  | 'delivered'
  | 'failed'
  | 'acknowledged'
  | 'cancelled'
  | 'expired';

export interface ReminderWindow {
  type: 'fixed' | 'before_event' | 'after_event';
  value?: number;
  unit?: 'minutes' | 'hours' | 'days' | 'weeks';
  eventTime?: string;
  preferredHours?: { start: number; end: number }; // e.g., 9-21
  avoidWeekends?: boolean;
}

export interface DeliveryChannel {
  channel: 'sms' | 'email' | 'push' | 'voice' | 'in_app';
  priority: number;
  enabled: boolean;
  address?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface DeliveryAttempt {
  id: string;
  channel: DeliveryChannel['channel'];
  attemptedAt: string;
  success: boolean;
  responseCode?: string;
  errorMessage?: string;
  provider?: string;
  cost?: number;
}

export interface ReminderResponse {
  type: 'confirm' | 'cancel' | 'reschedule' | 'snooze' | 'custom';
  value?: string;
  receivedAt: string;
  channel: DeliveryChannel['channel'];
  processedAt?: string;
  action?: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[]; // 0-6
  dayOfMonth?: number;
  endDate?: string;
  maxOccurrences?: number;
  currentOccurrence: number;
}

// Templates
export interface ReminderTemplate {
  id: string;
  organizationId: string;
  name: string;
  type: ReminderType;
  language: string;

  // Content
  titleTemplate: string;
  messageTemplate: string;
  smsTemplate?: string;
  emailSubject?: string;
  emailBody?: string;
  pushTitle?: string;
  pushBody?: string;

  // Variables
  variables: TemplateVariable[];

  // Settings
  defaultChannels: DeliveryChannel['channel'][];
  defaultWindow: ReminderWindow;
  defaultPriority: ReminderPriority;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'date' | 'time' | 'datetime' | 'number';
  required: boolean;
  format?: string;
  defaultValue?: string;
}

// Rules & Automation
export interface ReminderRule {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: ReminderType;
  isActive: boolean;

  // Trigger
  trigger: RuleTrigger;

  // Conditions
  conditions: RuleCondition[];

  // Actions
  templateId: string;
  timing: ReminderWindow[];
  channels: DeliveryChannel['channel'][];
  priority: ReminderPriority;

  // Escalation
  escalation?: EscalationRule;

  createdAt: string;
  updatedAt: string;
}

export interface RuleTrigger {
  type: 'event' | 'schedule' | 'condition';
  eventType?: string;
  schedule?: string; // cron expression
  checkInterval?: number; // minutes
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface EscalationRule {
  enabled: boolean;
  afterAttempts: number;
  escalateTo: 'additional_channel' | 'caregiver' | 'provider';
  additionalChannels?: DeliveryChannel['channel'][];
  caregiverId?: string;
  providerId?: string;
}

// Preferences
export interface PatientReminderPreferences {
  patientId: string;
  organizationId: string;

  // Opt-in/out
  optedIn: boolean;
  optOutDate?: string;
  optOutReason?: string;

  // Channels
  preferredChannels: DeliveryChannel['channel'][];
  channelSettings: {
    sms: { enabled: boolean; phone?: string };
    email: { enabled: boolean; email?: string };
    push: { enabled: boolean; deviceTokens?: string[] };
    voice: { enabled: boolean; phone?: string };
  };

  // Timing
  preferredLanguage: string;
  timezone: string;
  quietHours: { start: string; end: string }; // HH:MM format
  preferredDays: number[]; // 0-6

  // Types
  enabledTypes: ReminderType[];
  disabledTypes: ReminderType[];

  // Frequency
  maxPerDay: number;
  maxPerWeek: number;

  createdAt: string;
  updatedAt: string;
}

// Analytics
export interface ReminderAnalytics {
  period: { startDate: string; endDate: string };
  summary: ReminderSummary;
  byType: TypeMetrics[];
  byChannel: ChannelMetrics[];
  responseMetrics: ResponseMetrics;
  trends: TrendData[];
}

export interface ReminderSummary {
  totalSent: number;
  delivered: number;
  deliveryRate: number;
  acknowledged: number;
  acknowledgeRate: number;
  appointmentsConfirmed: number;
  noShows: number;
  noShowReduction: number;
}

export interface TypeMetrics {
  type: ReminderType;
  sent: number;
  delivered: number;
  acknowledged: number;
  responseRate: number;
}

export interface ChannelMetrics {
  channel: DeliveryChannel['channel'];
  sent: number;
  delivered: number;
  deliveryRate: number;
  acknowledged: number;
  cost: number;
}

export interface ResponseMetrics {
  confirmed: number;
  cancelled: number;
  rescheduled: number;
  snoozed: number;
  noResponse: number;
}

export interface TrendData {
  date: string;
  sent: number;
  delivered: number;
  acknowledged: number;
}

// Dashboard
export interface ReminderDashboard {
  summary: DashboardSummary;
  scheduledToday: Reminder[];
  pendingDelivery: Reminder[];
  failedDelivery: Reminder[];
  recentResponses: Reminder[];
  upcomingAppointments: AppointmentReminder[];
  channelHealth: ChannelHealth[];
}

export interface DashboardSummary {
  scheduledToday: number;
  sentToday: number;
  deliveredToday: number;
  failedToday: number;
  acknowledgedToday: number;
  appointmentConfirmations: number;
}

export interface AppointmentReminder {
  reminderId: string;
  appointmentId: string;
  patientName: string;
  appointmentTime: string;
  providerName: string;
  reminderStatus: ReminderStatus;
  confirmed: boolean;
}

export interface ChannelHealth {
  channel: DeliveryChannel['channel'];
  status: 'healthy' | 'degraded' | 'down';
  deliveryRate: number;
  avgDeliveryTime: number; // seconds
  lastError?: string;
}

// ============================================================================
// Smart Reminders Service Class
// ============================================================================

export class SmartRemindersService {
  private db: D1Database;
  private organizationId: string;

  constructor(db: D1Database, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  // ==========================================================================
  // Reminder Management
  // ==========================================================================

  async createReminder(data: Partial<Reminder>): Promise<Reminder> {
    // Get patient preferences
    const preferences = await this.getPatientPreferences(data.patientId!);

    // Check opt-out
    if (preferences && !preferences.optedIn) {
      throw new Error('Patient has opted out of reminders');
    }

    // Check type disabled
    if (preferences && data.type && preferences.disabledTypes.includes(data.type)) {
      throw new Error(`Patient has disabled ${data.type} reminders`);
    }

    const reminder: Reminder = {
      id: this.generateId(),
      organizationId: this.organizationId,
      type: data.type || 'custom',
      category: data.category || 'clinical',
      priority: data.priority || 'normal',
      status: 'scheduled',
      patientId: data.patientId || '',
      patientName: data.patientName || '',
      patientPhone: data.patientPhone,
      patientEmail: data.patientEmail,
      patientLanguage: data.patientLanguage || preferences?.preferredLanguage || 'fr',
      title: data.title || '',
      message: data.message || '',
      shortMessage: data.shortMessage,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
      relatedEntityDetails: data.relatedEntityDetails,
      scheduledAt: data.scheduledAt || new Date().toISOString(),
      timezone: data.timezone || preferences?.timezone || 'Europe/Paris',
      reminderWindow: data.reminderWindow || { type: 'fixed' },
      channels: this.buildDeliveryChannels(data.channels, preferences),
      deliveryAttempts: [],
      acknowledged: false,
      recurring: data.recurring || false,
      recurrenceRule: data.recurrenceRule,
      tags: data.tags || [],
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Apply quiet hours adjustment
    if (preferences?.quietHours) {
      reminder.scheduledAt = this.adjustForQuietHours(reminder.scheduledAt, preferences.quietHours, preferences.timezone);
    }

    await ReminderDB.create(this.db, reminder);
    return reminder;
  }

  private buildDeliveryChannels(
    requestedChannels?: DeliveryChannel[],
    preferences?: PatientReminderPreferences | null
  ): DeliveryChannel[] {
    const defaultChannels: DeliveryChannel['channel'][] = ['sms', 'email'];
    const preferredChannels = preferences?.preferredChannels || defaultChannels;

    return preferredChannels.map((channel, index) => ({
      channel,
      priority: index + 1,
      enabled: true,
      address: this.getChannelAddress(channel, preferences),
      status: 'pending' as const
    }));
  }

  private getChannelAddress(channel: DeliveryChannel['channel'], preferences?: PatientReminderPreferences | null): string | undefined {
    if (!preferences) return undefined;

    switch (channel) {
      case 'sms':
      case 'voice':
        return preferences.channelSettings.sms.phone;
      case 'email':
        return preferences.channelSettings.email.email;
      default:
        return undefined;
    }
  }

  private adjustForQuietHours(scheduledAt: string, quietHours: { start: string; end: string }, timezone: string): string {
    const scheduled = new Date(scheduledAt);
    const hour = scheduled.getHours();
    const quietStart = parseInt(quietHours.start.split(':')[0]);
    const quietEnd = parseInt(quietHours.end.split(':')[0]);

    // If scheduled during quiet hours, move to end of quiet hours
    if (hour >= quietStart || hour < quietEnd) {
      scheduled.setHours(quietEnd, 0, 0, 0);
      if (hour >= quietStart) {
        scheduled.setDate(scheduled.getDate() + 1);
      }
    }

    return scheduled.toISOString();
  }

  async getReminder(id: string): Promise<Reminder | null> {
    return ReminderDB.getById(this.db, id);
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const reminder = await this.getReminder(id);
    if (!reminder) throw new Error('Reminder not found');

    const updated: Reminder = {
      ...reminder,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await ReminderDB.update(this.db, id, updated);
    return updated;
  }

  async cancelReminder(id: string, reason?: string): Promise<Reminder> {
    return this.updateReminder(id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledReason: reason
    });
  }

  async listReminders(filters: {
    patientId?: string;
    type?: ReminderType;
    status?: ReminderStatus;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ reminders: Reminder[]; total: number }> {
    return ReminderDB.list(this.db, this.organizationId, filters);
  }

  // ==========================================================================
  // Delivery
  // ==========================================================================

  async sendReminder(reminderId: string): Promise<Reminder> {
    const reminder = await this.getReminder(reminderId);
    if (!reminder) throw new Error('Reminder not found');

    if (reminder.status !== 'scheduled' && reminder.status !== 'pending') {
      throw new Error(`Cannot send reminder with status ${reminder.status}`);
    }

    reminder.status = 'sending';
    await this.updateReminder(reminderId, { status: 'sending' });

    let delivered = false;

    // Try each channel in priority order
    const sortedChannels = [...reminder.channels].sort((a, b) => a.priority - b.priority);

    for (const channel of sortedChannels) {
      if (!channel.enabled || channel.status === 'delivered') continue;

      const attempt: DeliveryAttempt = {
        id: this.generateId(),
        channel: channel.channel,
        attemptedAt: new Date().toISOString(),
        success: false
      };

      try {
        const result = await this.deliverToChannel(reminder, channel);
        attempt.success = result.success;
        attempt.responseCode = result.responseCode;
        attempt.provider = result.provider;
        attempt.cost = result.cost;

        if (result.success) {
          channel.status = 'delivered';
          channel.sentAt = new Date().toISOString();
          channel.deliveredAt = new Date().toISOString();
          delivered = true;
          break; // Stop after successful delivery
        } else {
          channel.status = 'failed';
          channel.failureReason = result.error;
          attempt.errorMessage = result.error;
        }
      } catch (error: any) {
        attempt.errorMessage = error.message;
        channel.status = 'failed';
        channel.failureReason = error.message;
      }

      reminder.deliveryAttempts.push(attempt);
    }

    reminder.lastAttemptAt = new Date().toISOString();

    if (delivered) {
      reminder.status = 'delivered';
      reminder.deliveredAt = new Date().toISOString();
    } else {
      reminder.status = 'failed';

      // Check escalation
      if (reminder.deliveryAttempts.length >= 3) {
        // Would trigger escalation logic here
      }
    }

    return this.updateReminder(reminderId, {
      status: reminder.status,
      channels: reminder.channels,
      deliveryAttempts: reminder.deliveryAttempts,
      lastAttemptAt: reminder.lastAttemptAt,
      deliveredAt: reminder.deliveredAt
    });
  }

  private async deliverToChannel(reminder: Reminder, channel: DeliveryChannel): Promise<{
    success: boolean;
    responseCode?: string;
    provider?: string;
    cost?: number;
    error?: string;
  }> {
    // In a real implementation, this would call actual messaging providers
    switch (channel.channel) {
      case 'sms':
        return this.sendSMS(reminder, channel.address!);
      case 'email':
        return this.sendEmail(reminder, channel.address!);
      case 'push':
        return this.sendPushNotification(reminder);
      case 'voice':
        return this.makeVoiceCall(reminder, channel.address!);
      case 'in_app':
        return this.createInAppNotification(reminder);
      default:
        return { success: false, error: 'Unknown channel' };
    }
  }

  private async sendSMS(reminder: Reminder, phone: string): Promise<{ success: boolean; responseCode?: string; provider?: string; cost?: number; error?: string }> {
    // Simulate SMS sending
    const message = reminder.shortMessage || reminder.message.substring(0, 160);
    console.log(`Sending SMS to ${phone}: ${message}`);
    return { success: true, responseCode: '200', provider: 'twilio', cost: 0.05 };
  }

  private async sendEmail(reminder: Reminder, email: string): Promise<{ success: boolean; responseCode?: string; provider?: string; cost?: number; error?: string }> {
    // Simulate email sending
    console.log(`Sending email to ${email}: ${reminder.title}`);
    return { success: true, responseCode: '202', provider: 'sendgrid', cost: 0.001 };
  }

  private async sendPushNotification(reminder: Reminder): Promise<{ success: boolean; responseCode?: string; provider?: string; error?: string }> {
    // Simulate push notification
    console.log(`Sending push notification: ${reminder.title}`);
    return { success: true, responseCode: '200', provider: 'firebase' };
  }

  private async makeVoiceCall(reminder: Reminder, phone: string): Promise<{ success: boolean; responseCode?: string; provider?: string; cost?: number; error?: string }> {
    // Simulate voice call
    console.log(`Making voice call to ${phone}`);
    return { success: true, responseCode: '200', provider: 'twilio', cost: 0.10 };
  }

  private async createInAppNotification(reminder: Reminder): Promise<{ success: boolean; error?: string }> {
    // Create in-app notification
    console.log(`Creating in-app notification: ${reminder.title}`);
    return { success: true };
  }

  // ==========================================================================
  // Response Handling
  // ==========================================================================

  async processResponse(reminderId: string, response: Omit<ReminderResponse, 'processedAt'>): Promise<Reminder> {
    const reminder = await this.getReminder(reminderId);
    if (!reminder) throw new Error('Reminder not found');

    const processedResponse: ReminderResponse = {
      ...response,
      processedAt: new Date().toISOString()
    };

    // Handle response actions
    switch (response.type) {
      case 'confirm':
        if (reminder.relatedEntityType === 'appointment' && reminder.relatedEntityId) {
          processedResponse.action = 'appointment_confirmed';
          // Would update appointment status in appointment service
        }
        break;
      case 'cancel':
        if (reminder.relatedEntityType === 'appointment' && reminder.relatedEntityId) {
          processedResponse.action = 'appointment_cancelled';
          // Would cancel appointment in appointment service
        }
        break;
      case 'reschedule':
        processedResponse.action = 'reschedule_requested';
        // Would create reschedule request
        break;
      case 'snooze':
        // Create snoozed reminder
        const snoozeMinutes = parseInt(response.value || '60');
        await this.createReminder({
          ...reminder,
          id: undefined,
          scheduledAt: new Date(Date.now() + snoozeMinutes * 60000).toISOString(),
          parentReminderId: reminder.id
        });
        break;
    }

    return this.updateReminder(reminderId, {
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
      response: processedResponse,
      status: 'acknowledged'
    });
  }

  // ==========================================================================
  // Bulk Operations
  // ==========================================================================

  async createAppointmentReminders(appointment: {
    id: string;
    patientId: string;
    patientName: string;
    patientPhone?: string;
    patientEmail?: string;
    appointmentDate: string;
    providerName: string;
    location: string;
    reason: string;
  }): Promise<Reminder[]> {
    const reminders: Reminder[] = [];

    // 48 hours before
    const reminder48h = await this.createReminder({
      type: 'appointment',
      category: 'clinical',
      priority: 'normal',
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientEmail: appointment.patientEmail,
      title: 'Rappel de rendez-vous',
      message: `Rappel: Vous avez un rendez-vous le ${new Date(appointment.appointmentDate).toLocaleDateString('fr-FR')} à ${new Date(appointment.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} avec ${appointment.providerName} à ${appointment.location}. Motif: ${appointment.reason}`,
      shortMessage: `RDV le ${new Date(appointment.appointmentDate).toLocaleDateString('fr-FR')} ${new Date(appointment.appointmentDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${appointment.providerName}. Répondez OUI pour confirmer.`,
      relatedEntityType: 'appointment',
      relatedEntityId: appointment.id,
      scheduledAt: new Date(new Date(appointment.appointmentDate).getTime() - 48 * 60 * 60 * 1000).toISOString(),
      reminderWindow: { type: 'before_event', value: 48, unit: 'hours', eventTime: appointment.appointmentDate }
    });
    reminders.push(reminder48h);

    // 2 hours before
    const reminder2h = await this.createReminder({
      type: 'appointment',
      category: 'clinical',
      priority: 'high',
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientEmail: appointment.patientEmail,
      title: 'Rendez-vous dans 2 heures',
      message: `Votre rendez-vous avec ${appointment.providerName} est dans 2 heures à ${appointment.location}.`,
      shortMessage: `RDV dans 2h avec ${appointment.providerName}. Répondez OUI pour confirmer, NON pour annuler.`,
      relatedEntityType: 'appointment',
      relatedEntityId: appointment.id,
      scheduledAt: new Date(new Date(appointment.appointmentDate).getTime() - 2 * 60 * 60 * 1000).toISOString(),
      reminderWindow: { type: 'before_event', value: 2, unit: 'hours', eventTime: appointment.appointmentDate }
    });
    reminders.push(reminder2h);

    return reminders;
  }

  async createMedicationReminders(medication: {
    patientId: string;
    patientName: string;
    patientPhone?: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    times: string[]; // HH:MM format
    startDate: string;
    endDate?: string;
  }): Promise<Reminder[]> {
    const reminders: Reminder[] = [];

    for (const time of medication.times) {
      const [hours, minutes] = time.split(':').map(Number);
      const startDateTime = new Date(medication.startDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      const reminder = await this.createReminder({
        type: 'medication',
        category: 'clinical',
        priority: 'high',
        patientId: medication.patientId,
        patientName: medication.patientName,
        patientPhone: medication.patientPhone,
        title: 'Rappel médicament',
        message: `Il est temps de prendre votre ${medication.medicationName} (${medication.dosage}).`,
        shortMessage: `Rappel: Prenez ${medication.medicationName} ${medication.dosage}`,
        scheduledAt: startDateTime.toISOString(),
        reminderWindow: { type: 'fixed' },
        recurring: true,
        recurrenceRule: {
          frequency: 'daily',
          interval: 1,
          endDate: medication.endDate,
          currentOccurrence: 0
        }
      });

      reminders.push(reminder);
    }

    return reminders;
  }

  // ==========================================================================
  // Templates
  // ==========================================================================

  async createTemplate(data: Partial<ReminderTemplate>): Promise<ReminderTemplate> {
    const template: ReminderTemplate = {
      id: this.generateId(),
      organizationId: this.organizationId,
      name: data.name || '',
      type: data.type || 'custom',
      language: data.language || 'fr',
      titleTemplate: data.titleTemplate || '',
      messageTemplate: data.messageTemplate || '',
      smsTemplate: data.smsTemplate,
      emailSubject: data.emailSubject,
      emailBody: data.emailBody,
      pushTitle: data.pushTitle,
      pushBody: data.pushBody,
      variables: data.variables || [],
      defaultChannels: data.defaultChannels || ['sms', 'email'],
      defaultWindow: data.defaultWindow || { type: 'fixed' },
      defaultPriority: data.defaultPriority || 'normal',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await TemplateDB.create(this.db, template);
    return template;
  }

  async listTemplates(type?: ReminderType): Promise<ReminderTemplate[]> {
    return TemplateDB.list(this.db, this.organizationId, type);
  }

  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<{
    title: string;
    message: string;
    sms?: string;
    emailSubject?: string;
    emailBody?: string;
  }> {
    const template = await TemplateDB.getById(this.db, templateId);
    if (!template) throw new Error('Template not found');

    const render = (text: string): string => {
      let result = text;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, String(value));
      }
      return result;
    };

    return {
      title: render(template.titleTemplate),
      message: render(template.messageTemplate),
      sms: template.smsTemplate ? render(template.smsTemplate) : undefined,
      emailSubject: template.emailSubject ? render(template.emailSubject) : undefined,
      emailBody: template.emailBody ? render(template.emailBody) : undefined
    };
  }

  // ==========================================================================
  // Preferences
  // ==========================================================================

  async getPatientPreferences(patientId: string): Promise<PatientReminderPreferences | null> {
    return PreferencesDB.getByPatientId(this.db, this.organizationId, patientId);
  }

  async updatePatientPreferences(patientId: string, updates: Partial<PatientReminderPreferences>): Promise<PatientReminderPreferences> {
    let preferences = await this.getPatientPreferences(patientId);

    if (!preferences) {
      preferences = {
        patientId,
        organizationId: this.organizationId,
        optedIn: true,
        preferredChannels: ['sms', 'email'],
        channelSettings: {
          sms: { enabled: true },
          email: { enabled: true },
          push: { enabled: false },
          voice: { enabled: false }
        },
        preferredLanguage: 'fr',
        timezone: 'Europe/Paris',
        quietHours: { start: '22:00', end: '08:00' },
        preferredDays: [1, 2, 3, 4, 5],
        enabledTypes: [],
        disabledTypes: [],
        maxPerDay: 5,
        maxPerWeek: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const updated: PatientReminderPreferences = {
      ...preferences,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await PreferencesDB.upsert(this.db, updated);
    return updated;
  }

  async optOut(patientId: string, reason?: string): Promise<void> {
    await this.updatePatientPreferences(patientId, {
      optedIn: false,
      optOutDate: new Date().toISOString(),
      optOutReason: reason
    });

    // Cancel all pending reminders
    const { reminders } = await this.listReminders({ patientId, status: 'scheduled' });
    for (const reminder of reminders) {
      await this.cancelReminder(reminder.id, 'Patient opted out');
    }
  }

  // ==========================================================================
  // Dashboard & Analytics
  // ==========================================================================

  async getDashboard(): Promise<ReminderDashboard> {
    const today = new Date().toISOString().split('T')[0];
    const { reminders } = await this.listReminders({ fromDate: today, limit: 1000 });

    const summary: DashboardSummary = {
      scheduledToday: reminders.filter(r => r.status === 'scheduled').length,
      sentToday: reminders.filter(r => r.deliveredAt?.startsWith(today)).length,
      deliveredToday: reminders.filter(r => r.status === 'delivered').length,
      failedToday: reminders.filter(r => r.status === 'failed').length,
      acknowledgedToday: reminders.filter(r => r.acknowledged).length,
      appointmentConfirmations: reminders.filter(r =>
        r.type === 'appointment' && r.response?.type === 'confirm'
      ).length
    };

    const scheduledToday = reminders.filter(r =>
      r.scheduledAt.startsWith(today) && r.status === 'scheduled'
    );

    const pendingDelivery = reminders.filter(r => r.status === 'pending');
    const failedDelivery = reminders.filter(r => r.status === 'failed');
    const recentResponses = reminders
      .filter(r => r.response)
      .sort((a, b) => new Date(b.acknowledgedAt!).getTime() - new Date(a.acknowledgedAt!).getTime())
      .slice(0, 10);

    // Appointment reminders
    const upcomingAppointments: AppointmentReminder[] = reminders
      .filter(r => r.type === 'appointment' && r.relatedEntityId)
      .map(r => ({
        reminderId: r.id,
        appointmentId: r.relatedEntityId!,
        patientName: r.patientName,
        appointmentTime: r.relatedEntityDetails?.appointmentDate || '',
        providerName: r.relatedEntityDetails?.providerName || '',
        reminderStatus: r.status,
        confirmed: r.response?.type === 'confirm'
      }));

    // Channel health (simplified)
    const channelHealth: ChannelHealth[] = [
      { channel: 'sms', status: 'healthy', deliveryRate: 98, avgDeliveryTime: 5 },
      { channel: 'email', status: 'healthy', deliveryRate: 95, avgDeliveryTime: 30 },
      { channel: 'push', status: 'healthy', deliveryRate: 90, avgDeliveryTime: 2 }
    ];

    return {
      summary,
      scheduledToday,
      pendingDelivery,
      failedDelivery,
      recentResponses,
      upcomingAppointments,
      channelHealth
    };
  }

  async getAnalytics(startDate: string, endDate: string): Promise<ReminderAnalytics> {
    const { reminders } = await this.listReminders({
      fromDate: startDate,
      toDate: endDate,
      limit: 10000
    });

    const delivered = reminders.filter(r => r.status === 'delivered' || r.status === 'acknowledged');
    const acknowledged = reminders.filter(r => r.acknowledged);

    const summary: ReminderSummary = {
      totalSent: delivered.length,
      delivered: delivered.length,
      deliveryRate: reminders.length > 0 ? (delivered.length / reminders.length) * 100 : 0,
      acknowledged: acknowledged.length,
      acknowledgeRate: delivered.length > 0 ? (acknowledged.length / delivered.length) * 100 : 0,
      appointmentsConfirmed: acknowledged.filter(r => r.response?.type === 'confirm').length,
      noShows: 0, // Would need appointment integration
      noShowReduction: 0
    };

    // By type
    const typeMap = new Map<ReminderType, Reminder[]>();
    for (const r of reminders) {
      const arr = typeMap.get(r.type) || [];
      arr.push(r);
      typeMap.set(r.type, arr);
    }

    const byType: TypeMetrics[] = Array.from(typeMap.entries()).map(([type, typeReminders]) => {
      const typeDelivered = typeReminders.filter(r => r.status === 'delivered' || r.status === 'acknowledged');
      const typeAcknowledged = typeReminders.filter(r => r.acknowledged);
      return {
        type,
        sent: typeDelivered.length,
        delivered: typeDelivered.length,
        acknowledged: typeAcknowledged.length,
        responseRate: typeDelivered.length > 0 ? (typeAcknowledged.length / typeDelivered.length) * 100 : 0
      };
    });

    // By channel
    const channelMap = new Map<DeliveryChannel['channel'], { sent: number; delivered: number; acknowledged: number; cost: number }>();
    for (const r of reminders) {
      for (const channel of r.channels) {
        const stats = channelMap.get(channel.channel) || { sent: 0, delivered: 0, acknowledged: 0, cost: 0 };
        if (channel.status === 'sent' || channel.status === 'delivered') stats.sent++;
        if (channel.status === 'delivered') stats.delivered++;
        if (r.acknowledged) stats.acknowledged++;
        // Add cost from delivery attempts
        const attempts = r.deliveryAttempts.filter(a => a.channel === channel.channel);
        stats.cost += attempts.reduce((sum, a) => sum + (a.cost || 0), 0);
        channelMap.set(channel.channel, stats);
      }
    }

    const byChannel: ChannelMetrics[] = Array.from(channelMap.entries()).map(([channel, stats]) => ({
      channel,
      sent: stats.sent,
      delivered: stats.delivered,
      deliveryRate: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
      acknowledged: stats.acknowledged,
      cost: stats.cost
    }));

    // Response metrics
    const responses = reminders.filter(r => r.response);
    const responseMetrics: ResponseMetrics = {
      confirmed: responses.filter(r => r.response?.type === 'confirm').length,
      cancelled: responses.filter(r => r.response?.type === 'cancel').length,
      rescheduled: responses.filter(r => r.response?.type === 'reschedule').length,
      snoozed: responses.filter(r => r.response?.type === 'snooze').length,
      noResponse: delivered.length - responses.length
    };

    return {
      period: { startDate, endDate },
      summary,
      byType,
      byChannel,
      responseMetrics,
      trends: []
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Database Layer (Stubs for D1 Implementation)
// ============================================================================

class ReminderDB {
  static async create(db: D1Database, reminder: Reminder): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<Reminder | null> { return null; }
  static async update(db: D1Database, id: string, reminder: Reminder): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ reminders: Reminder[]; total: number }> {
    return { reminders: [], total: 0 };
  }
}

class TemplateDB {
  static async create(db: D1Database, template: ReminderTemplate): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<ReminderTemplate | null> { return null; }
  static async list(db: D1Database, orgId: string, type?: ReminderType): Promise<ReminderTemplate[]> { return []; }
}

class PreferencesDB {
  static async getByPatientId(db: D1Database, orgId: string, patientId: string): Promise<PatientReminderPreferences | null> { return null; }
  static async upsert(db: D1Database, preferences: PatientReminderPreferences): Promise<void> {}
}

export default SmartRemindersService;
