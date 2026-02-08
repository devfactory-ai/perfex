/**
 * SMS Service
 * Provides SMS notifications for healthcare modules
 *
 * Supports multiple providers:
 * - Twilio (primary)
 * - AWS SNS (fallback)
 *
 * Features:
 * - Appointment reminders
 * - Critical alerts
 * - Lab results notifications
 * - Session reminders
 */

import { logger } from '../../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SMSConfig {
  provider: 'twilio' | 'sns' | 'mock';
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  snsRegion?: string;
  snsAccessKey?: string;
  snsSecretKey?: string;
  environment?: 'development' | 'staging' | 'production';
}

export interface SMSMessage {
  to: string;
  body: string;
  from?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  module: 'dialyse' | 'cardiology' | 'ophthalmology' | 'general';
}

// ============================================================================
// SMS Templates
// ============================================================================

const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  // Appointment Reminders
  appointment_reminder: {
    id: 'appointment_reminder',
    name: 'Rappel de rendez-vous',
    template: 'PERFEX: Rappel RDV {{specialty}} le {{date}} à {{time}}. Dr {{doctor}}. {{location}}. Répondez OUI pour confirmer ou appelez le {{phone}} pour modifier.',
    variables: ['specialty', 'date', 'time', 'doctor', 'location', 'phone'],
    module: 'general',
  },

  appointment_confirmation: {
    id: 'appointment_confirmation',
    name: 'Confirmation de rendez-vous',
    template: 'PERFEX: Votre RDV {{specialty}} est confirmé pour le {{date}} à {{time}}. Dr {{doctor}}. Merci!',
    variables: ['specialty', 'date', 'time', 'doctor'],
    module: 'general',
  },

  // Dialyse
  dialyse_session_reminder: {
    id: 'dialyse_session_reminder',
    name: 'Rappel séance dialyse',
    template: 'PERFEX DIALYSE: Rappel séance le {{date}} à {{time}}. Poste {{station}}. Arrivez 15min avant. Questions: {{phone}}',
    variables: ['date', 'time', 'station', 'phone'],
    module: 'dialyse',
  },

  dialyse_transport_reminder: {
    id: 'dialyse_transport_reminder',
    name: 'Rappel transport dialyse',
    template: 'PERFEX TRANSPORT: Prise en charge le {{date}} à {{pickup_time}}. Séance à {{session_time}}. Chauffeur: {{driver}}. Tel: {{driver_phone}}',
    variables: ['date', 'pickup_time', 'session_time', 'driver', 'driver_phone'],
    module: 'dialyse',
  },

  dialyse_lab_reminder: {
    id: 'dialyse_lab_reminder',
    name: 'Rappel bilan sanguin',
    template: 'PERFEX: Rappel bilan sanguin prévu le {{date}} avant votre séance. Venez à jeun. Centre: {{center}}',
    variables: ['date', 'center'],
    module: 'dialyse',
  },

  // Critical Alerts
  critical_alert: {
    id: 'critical_alert',
    name: 'Alerte critique',
    template: 'URGENCE PERFEX: {{alert_type}} pour patient {{patient_name}}. {{message}}. Action requise immédiatement. Réf: {{reference}}',
    variables: ['alert_type', 'patient_name', 'message', 'reference'],
    module: 'general',
  },

  // Lab Results
  lab_results_ready: {
    id: 'lab_results_ready',
    name: 'Résultats disponibles',
    template: 'PERFEX: Vos résultats d\'analyses du {{date}} sont disponibles. Connectez-vous au portail patient ou contactez le {{phone}}.',
    variables: ['date', 'phone'],
    module: 'general',
  },

  lab_results_abnormal: {
    id: 'lab_results_abnormal',
    name: 'Résultats anormaux',
    template: 'PERFEX: Certains de vos résultats du {{date}} nécessitent attention. Votre médecin vous contactera prochainement. En cas d\'urgence: {{phone}}',
    variables: ['date', 'phone'],
    module: 'general',
  },

  // Cardiology
  cardiology_exam_reminder: {
    id: 'cardiology_exam_reminder',
    name: 'Rappel examen cardio',
    template: 'PERFEX CARDIO: Rappel {{exam_type}} le {{date}} à {{time}}. {{preparation}}. Dr {{doctor}}. Tel: {{phone}}',
    variables: ['exam_type', 'date', 'time', 'preparation', 'doctor', 'phone'],
    module: 'cardiology',
  },

  pacemaker_followup: {
    id: 'pacemaker_followup',
    name: 'Suivi pacemaker',
    template: 'PERFEX: Rappel contrôle pacemaker le {{date}} à {{time}}. Apportez votre carnet de suivi. Centre: {{center}}',
    variables: ['date', 'time', 'center'],
    module: 'cardiology',
  },

  // Ophthalmology
  ivt_reminder: {
    id: 'ivt_reminder',
    name: 'Rappel injection IVT',
    template: 'PERFEX OPHTALMO: Rappel injection IVT le {{date}} à {{time}}. Oeil {{eye}}. Ne mettez pas de maquillage. Dr {{doctor}}',
    variables: ['date', 'time', 'eye', 'doctor'],
    module: 'ophthalmology',
  },

  oct_reminder: {
    id: 'oct_reminder',
    name: 'Rappel OCT',
    template: 'PERFEX OPHTALMO: Rappel examen OCT le {{date}} à {{time}}. Prévoir 30min sur place. Centre: {{center}}',
    variables: ['date', 'time', 'center'],
    module: 'ophthalmology',
  },

  surgery_prep: {
    id: 'surgery_prep',
    name: 'Préparation chirurgie',
    template: 'PERFEX: Chirurgie {{surgery_type}} prévue le {{date}}. Instructions: {{instructions}}. Être à jeun depuis minuit. Tel urgence: {{phone}}',
    variables: ['surgery_type', 'date', 'instructions', 'phone'],
    module: 'ophthalmology',
  },

  // General
  password_reset: {
    id: 'password_reset',
    name: 'Réinitialisation mot de passe',
    template: 'PERFEX: Votre code de vérification est {{code}}. Valide 10 minutes. Ne partagez ce code avec personne.',
    variables: ['code'],
    module: 'general',
  },

  two_factor: {
    id: 'two_factor',
    name: 'Code 2FA',
    template: 'PERFEX: Votre code de connexion est {{code}}. Valide 5 minutes.',
    variables: ['code'],
    module: 'general',
  },
};

// ============================================================================
// SMS Service Class
// ============================================================================

export class SMSService {
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.config = config;
  }

  /**
   * Send a raw SMS message
   */
  async send(message: SMSMessage): Promise<SMSResult> {
    // Validate phone number
    const normalizedPhone = this.normalizePhoneNumber(message.to);
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format',
        provider: this.config.provider,
      };
    }

    // In development/staging, log but don't send
    if (this.config.environment !== 'production' && this.config.provider !== 'mock') {
      logger.info('SMS would be sent (non-production)', {
        to: normalizedPhone,
        body: message.body.substring(0, 50) + '...',
      });

      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        provider: 'mock',
      };
    }

    switch (this.config.provider) {
      case 'twilio':
        return this.sendViaTwilio({ ...message, to: normalizedPhone });
      case 'sns':
        return this.sendViaSNS({ ...message, to: normalizedPhone });
      case 'mock':
        return this.sendMock({ ...message, to: normalizedPhone });
      default:
        return {
          success: false,
          error: 'Unknown SMS provider',
          provider: this.config.provider,
        };
    }
  }

  /**
   * Send SMS using a template
   */
  async sendTemplate(
    templateId: string,
    to: string,
    variables: Record<string, string>
  ): Promise<SMSResult> {
    const template = SMS_TEMPLATES[templateId];
    if (!template) {
      return {
        success: false,
        error: `Template '${templateId}' not found`,
        provider: this.config.provider,
      };
    }

    // Validate required variables
    for (const varName of template.variables) {
      if (!variables[varName]) {
        return {
          success: false,
          error: `Missing required variable: ${varName}`,
          provider: this.config.provider,
        };
      }
    }

    // Replace variables in template
    let body = template.template;
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return this.send({ to, body });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    to: string,
    data: {
      specialty: string;
      date: string;
      time: string;
      doctor: string;
      location: string;
      phone: string;
    }
  ): Promise<SMSResult> {
    return this.sendTemplate('appointment_reminder', to, data);
  }

  /**
   * Send dialysis session reminder
   */
  async sendDialyseSessionReminder(
    to: string,
    data: {
      date: string;
      time: string;
      station: string;
      phone: string;
    }
  ): Promise<SMSResult> {
    return this.sendTemplate('dialyse_session_reminder', to, data);
  }

  /**
   * Send transport reminder
   */
  async sendTransportReminder(
    to: string,
    data: {
      date: string;
      pickup_time: string;
      session_time: string;
      driver: string;
      driver_phone: string;
    }
  ): Promise<SMSResult> {
    return this.sendTemplate('dialyse_transport_reminder', to, data);
  }

  /**
   * Send critical alert
   */
  async sendCriticalAlert(
    to: string,
    data: {
      alert_type: string;
      patient_name: string;
      message: string;
      reference: string;
    }
  ): Promise<SMSResult> {
    return this.sendTemplate('critical_alert', to, data);
  }

  /**
   * Send lab results notification
   */
  async sendLabResultsReady(
    to: string,
    data: {
      date: string;
      phone: string;
    }
  ): Promise<SMSResult> {
    return this.sendTemplate('lab_results_ready', to, data);
  }

  /**
   * Send IVT injection reminder
   */
  async sendIVTReminder(
    to: string,
    data: {
      date: string;
      time: string;
      eye: string;
      doctor: string;
    }
  ): Promise<SMSResult> {
    return this.sendTemplate('ivt_reminder', to, data);
  }

  /**
   * Send 2FA code
   */
  async send2FACode(to: string, code: string): Promise<SMSResult> {
    return this.sendTemplate('two_factor', to, { code });
  }

  /**
   * Send password reset code
   */
  async sendPasswordResetCode(to: string, code: string): Promise<SMSResult> {
    return this.sendTemplate('password_reset', to, { code });
  }

  // ==========================================================================
  // Provider Implementations
  // ==========================================================================

  private async sendViaTwilio(message: SMSMessage): Promise<SMSResult> {
    if (!this.config.twilioAccountSid || !this.config.twilioAuthToken || !this.config.twilioFromNumber) {
      return {
        success: false,
        error: 'Twilio configuration incomplete',
        provider: 'twilio',
      };
    }

    try {
      const credentials = btoa(`${this.config.twilioAccountSid}:${this.config.twilioAuthToken}`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: message.to,
            From: message.from || this.config.twilioFromNumber,
            Body: message.body,
          }).toString(),
        }
      );

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        logger.error('Twilio API error', { error });
        return {
          success: false,
          error: error.message || 'Twilio API error',
          provider: 'twilio',
        };
      }

      const result = await response.json() as { sid: string };
      logger.info('SMS sent via Twilio', { sid: result.sid, to: message.to });

      return {
        success: true,
        messageId: result.sid,
        provider: 'twilio',
      };
    } catch (error) {
      logger.error('Failed to send SMS via Twilio', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'twilio',
      };
    }
  }

  private async sendViaSNS(message: SMSMessage): Promise<SMSResult> {
    // AWS SNS implementation would go here
    // For now, return a mock response
    logger.warn('AWS SNS not fully implemented');

    return {
      success: false,
      error: 'AWS SNS not fully implemented',
      provider: 'sns',
    };
  }

  private async sendMock(message: SMSMessage): Promise<SMSResult> {
    logger.info('Mock SMS sent', {
      to: message.to,
      body: message.body.substring(0, 100),
    });

    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      provider: 'mock',
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhoneNumber(phone: string): string | null {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');

    // Handle French numbers
    if (digits.startsWith('0') && digits.length === 10) {
      // French mobile (06, 07) or landline
      digits = '33' + digits.substring(1);
    }

    // Handle numbers without country code
    if (digits.length === 9) {
      // Assume French number
      digits = '33' + digits;
    }

    // Validate length (between 10 and 15 digits for international)
    if (digits.length < 10 || digits.length > 15) {
      return null;
    }

    return '+' + digits;
  }

  /**
   * Get all available templates
   */
  static getTemplates(): SMSTemplate[] {
    return Object.values(SMS_TEMPLATES);
  }

  /**
   * Get templates for a specific module
   */
  static getTemplatesForModule(module: string): SMSTemplate[] {
    return Object.values(SMS_TEMPLATES).filter(
      t => t.module === module || t.module === 'general'
    );
  }
}

// ============================================================================
// Bulk SMS Service
// ============================================================================

export interface BulkSMSJob {
  id: string;
  templateId: string;
  recipients: {
    phone: string;
    variables: Record<string, string>;
  }[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: {
    phone: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }[];
  createdAt: Date;
  completedAt?: Date;
  stats: {
    total: number;
    sent: number;
    failed: number;
  };
}

export class BulkSMSService {
  private smsService: SMSService;

  constructor(config: SMSConfig) {
    this.smsService = new SMSService(config);
  }

  /**
   * Send bulk SMS using a template
   */
  async sendBulk(
    templateId: string,
    recipients: {
      phone: string;
      variables: Record<string, string>;
    }[]
  ): Promise<BulkSMSJob> {
    const job: BulkSMSJob = {
      id: crypto.randomUUID(),
      templateId,
      recipients,
      status: 'processing',
      results: [],
      createdAt: new Date(),
      stats: {
        total: recipients.length,
        sent: 0,
        failed: 0,
      },
    };

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const results = await Promise.all(
        batch.map(async (recipient) => {
          const result = await this.smsService.sendTemplate(
            templateId,
            recipient.phone,
            recipient.variables
          );

          return {
            phone: recipient.phone,
            success: result.success,
            messageId: result.messageId,
            error: result.error,
          };
        })
      );

      job.results.push(...results);

      for (const result of results) {
        if (result.success) {
          job.stats.sent++;
        } else {
          job.stats.failed++;
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    job.status = job.stats.failed === job.stats.total ? 'failed' : 'completed';
    job.completedAt = new Date();

    return job;
  }

  /**
   * Send reminder to all patients with appointments on a specific date
   */
  async sendAppointmentReminders(
    appointments: {
      patientPhone: string;
      specialty: string;
      date: string;
      time: string;
      doctor: string;
      location: string;
      centerPhone: string;
    }[]
  ): Promise<BulkSMSJob> {
    return this.sendBulk(
      'appointment_reminder',
      appointments.map(apt => ({
        phone: apt.patientPhone,
        variables: {
          specialty: apt.specialty,
          date: apt.date,
          time: apt.time,
          doctor: apt.doctor,
          location: apt.location,
          phone: apt.centerPhone,
        },
      }))
    );
  }

  /**
   * Send dialysis session reminders
   */
  async sendDialyseReminders(
    sessions: {
      patientPhone: string;
      date: string;
      time: string;
      station: string;
      centerPhone: string;
    }[]
  ): Promise<BulkSMSJob> {
    return this.sendBulk(
      'dialyse_session_reminder',
      sessions.map(session => ({
        phone: session.patientPhone,
        variables: {
          date: session.date,
          time: session.time,
          station: session.station,
          phone: session.centerPhone,
        },
      }))
    );
  }
}

export default SMSService;
