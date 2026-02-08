/**
 * Email Service
 * Production-ready email service with Resend integration
 * Supports healthcare-specific notifications
 */

import { logger } from './logger';

// ============================================================================
// Types
// ============================================================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  environment: 'development' | 'staging' | 'production';
  replyToEmail?: string;
}

// ============================================================================
// Email Templates
// ============================================================================

const templates = {
  /**
   * Base HTML template wrapper
   */
  baseTemplate: (content: string, title: string) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb, #1e40af); color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
    .content { padding: 30px; }
    .content h2 { color: #1e40af; margin-top: 0; }
    .button { display: inline-block; background: #2563eb; color: #fff !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
    .button:hover { background: #1d4ed8; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .alert-critical { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .alert-warning { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .alert-info { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .info-box { background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-size: 14px; }
    .value { font-weight: 600; color: #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">PERFEX</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Perfex Healthcare. Tous droits réservés.</p>
      <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
    </div>
  </div>
</body>
</html>`,

  /**
   * Welcome email
   */
  welcome: (firstName: string, loginUrl: string) => ({
    subject: 'Bienvenue sur Perfex Healthcare!',
    html: templates.baseTemplate(`
      <h2>Bienvenue ${firstName}!</h2>
      <p>Votre compte a été créé avec succès sur la plateforme Perfex Healthcare.</p>
      <p>Vous pouvez maintenant accéder à votre espace de travail:</p>
      <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Accéder à la plateforme</a>
      </p>
      <div class="info-box">
        <p><strong>Premiers pas:</strong></p>
        <ul>
          <li>Complétez votre profil</li>
          <li>Configurez vos préférences de notification</li>
          <li>Découvrez les modules disponibles</li>
        </ul>
      </div>
    `, 'Bienvenue'),
    text: `Bienvenue ${firstName}!\n\nVotre compte a été créé avec succès.\nConnectez-vous: ${loginUrl}\n\nL'équipe Perfex`,
  }),

  /**
   * Password reset
   */
  passwordReset: (resetUrl: string, expiresIn: string) => ({
    subject: 'Réinitialisation de votre mot de passe',
    html: templates.baseTemplate(`
      <h2>Réinitialisation du mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
      </p>
      <div class="alert-warning">
        <strong>⚠️ Ce lien expire dans ${expiresIn}.</strong>
      </div>
      <p>Si vous n'avez pas fait cette demande, ignorez simplement cet email.</p>
    `, 'Réinitialisation mot de passe'),
    text: `Réinitialisation du mot de passe\n\nCliquez sur le lien suivant: ${resetUrl}\n\nCe lien expire dans ${expiresIn}.`,
  }),

  /**
   * Appointment reminder
   */
  appointmentReminder: (
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    doctorName: string,
    department: string,
    location: string
  ) => ({
    subject: `Rappel: RDV le ${appointmentDate} à ${appointmentTime}`,
    html: templates.baseTemplate(`
      <h2>Rappel de rendez-vous</h2>
      <p>Bonjour ${patientName},</p>
      <p>Nous vous rappelons votre prochain rendez-vous:</p>
      <div class="info-box">
        <div class="info-row">
          <span class="label">📅 Date</span>
          <span class="value">${appointmentDate}</span>
        </div>
        <div class="info-row">
          <span class="label">🕐 Heure</span>
          <span class="value">${appointmentTime}</span>
        </div>
        <div class="info-row">
          <span class="label">👨‍⚕️ Médecin</span>
          <span class="value">Dr. ${doctorName}</span>
        </div>
        <div class="info-row">
          <span class="label">🏥 Service</span>
          <span class="value">${department}</span>
        </div>
        <div class="info-row">
          <span class="label">📍 Lieu</span>
          <span class="value">${location}</span>
        </div>
      </div>
      <div class="alert-info">
        <strong>📋 À apporter:</strong>
        <ul style="margin: 10px 0;">
          <li>Carte d'identité</li>
          <li>Carte vitale</li>
          <li>Ordonnances et résultats récents</li>
        </ul>
      </div>
    `, 'Rappel de rendez-vous'),
    text: `Rappel RDV\n\nBonjour ${patientName},\n\nDate: ${appointmentDate} à ${appointmentTime}\nMédecin: Dr. ${doctorName}\nService: ${department}\nLieu: ${location}`,
  }),

  /**
   * Critical alert notification
   */
  criticalAlert: (
    alertType: string,
    patientName: string,
    patientId: string,
    message: string,
    details: string,
    actionUrl: string
  ) => ({
    subject: `🚨 ALERTE CRITIQUE: ${alertType} - ${patientName}`,
    html: templates.baseTemplate(`
      <div class="alert-critical">
        <h2 style="color: #dc2626; margin-top: 0;">🚨 ALERTE CRITIQUE</h2>
        <p><strong>${alertType}</strong></p>
      </div>
      <div class="info-box">
        <div class="info-row">
          <span class="label">Patient</span>
          <span class="value">${patientName} (${patientId})</span>
        </div>
      </div>
      <h3>Détails de l'alerte:</h3>
      <p>${message}</p>
      <div class="info-box">
        <pre style="white-space: pre-wrap; font-size: 13px;">${details}</pre>
      </div>
      <p style="text-align: center;">
        <a href="${actionUrl}" class="button" style="background: #dc2626;">Voir le dossier patient</a>
      </p>
    `, 'Alerte Critique'),
    text: `🚨 ALERTE CRITIQUE: ${alertType}\n\nPatient: ${patientName} (${patientId})\n\n${message}\n\n${details}\n\nAction: ${actionUrl}`,
  }),

  /**
   * Lab results notification
   */
  labResults: (
    patientName: string,
    testDate: string,
    testTypes: string[],
    hasAbnormal: boolean,
    viewUrl: string
  ) => ({
    subject: `Résultats d'analyses disponibles${hasAbnormal ? ' ⚠️' : ''}`,
    html: templates.baseTemplate(`
      <h2>Résultats d'analyses disponibles</h2>
      <p>Bonjour ${patientName},</p>
      <p>Vos résultats d'analyses du <strong>${testDate}</strong> sont maintenant disponibles.</p>
      <div class="info-box">
        <p><strong>Analyses effectuées:</strong></p>
        <ul>
          ${testTypes.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>
      ${hasAbnormal ? `
        <div class="alert-warning">
          <strong>⚠️ Attention:</strong> Certaines valeurs sont en dehors des normes.
          Veuillez consulter votre médecin.
        </div>
      ` : ''}
      <p style="text-align: center;">
        <a href="${viewUrl}" class="button">Voir mes résultats</a>
      </p>
    `, 'Résultats d\'analyses'),
    text: `Résultats d'analyses disponibles\n\nBonjour ${patientName},\n\nVos résultats du ${testDate} sont disponibles.\n\nAnalyses: ${testTypes.join(', ')}\n\nConsultez-les: ${viewUrl}`,
  }),

  /**
   * Dialyse session reminder
   */
  dialyseSessionReminder: (
    patientName: string,
    sessionDate: string,
    sessionTime: string,
    machineNumber: string,
    duration: string
  ) => ({
    subject: `Rappel: Séance de dialyse le ${sessionDate}`,
    html: templates.baseTemplate(`
      <h2>Rappel de séance de dialyse</h2>
      <p>Bonjour ${patientName},</p>
      <p>Votre prochaine séance de dialyse est programmée:</p>
      <div class="info-box">
        <div class="info-row">
          <span class="label">📅 Date</span>
          <span class="value">${sessionDate}</span>
        </div>
        <div class="info-row">
          <span class="label">🕐 Heure</span>
          <span class="value">${sessionTime}</span>
        </div>
        <div class="info-row">
          <span class="label">🔧 Poste</span>
          <span class="value">Machine ${machineNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">⏱️ Durée prévue</span>
          <span class="value">${duration}</span>
        </div>
      </div>
      <div class="alert-info">
        <strong>📋 Rappels importants:</strong>
        <ul style="margin: 10px 0;">
          <li>Respectez les consignes alimentaires avant la séance</li>
          <li>Apportez vos médicaments habituels</li>
          <li>Signalez tout changement de votre état de santé</li>
        </ul>
      </div>
    `, 'Rappel séance de dialyse'),
    text: `Rappel séance de dialyse\n\nBonjour ${patientName},\n\nDate: ${sessionDate} à ${sessionTime}\nPoste: Machine ${machineNumber}\nDurée: ${duration}`,
  }),

  /**
   * Invitation email
   */
  invitation: (
    inviterName: string,
    organizationName: string,
    role: string,
    inviteUrl: string,
    expiresIn: string
  ) => ({
    subject: `${inviterName} vous invite à rejoindre ${organizationName}`,
    html: templates.baseTemplate(`
      <h2>Vous êtes invité!</h2>
      <p><strong>${inviterName}</strong> vous invite à rejoindre <strong>${organizationName}</strong> sur Perfex Healthcare.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="label">Organisation</span>
          <span class="value">${organizationName}</span>
        </div>
        <div class="info-row">
          <span class="label">Rôle</span>
          <span class="value">${role}</span>
        </div>
      </div>
      <p style="text-align: center;">
        <a href="${inviteUrl}" class="button">Accepter l'invitation</a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Cette invitation expire dans ${expiresIn}.</p>
    `, 'Invitation'),
    text: `${inviterName} vous invite à rejoindre ${organizationName}\n\nRôle: ${role}\n\nAcceptez l'invitation: ${inviteUrl}\n\nExpire dans ${expiresIn}.`,
  }),

  /**
   * Report ready notification
   */
  reportReady: (
    recipientName: string,
    reportType: string,
    reportPeriod: string,
    downloadUrl: string
  ) => ({
    subject: `Rapport ${reportType} disponible`,
    html: templates.baseTemplate(`
      <h2>Votre rapport est prêt</h2>
      <p>Bonjour ${recipientName},</p>
      <p>Le rapport que vous avez demandé est maintenant disponible.</p>
      <div class="info-box">
        <div class="info-row">
          <span class="label">Type de rapport</span>
          <span class="value">${reportType}</span>
        </div>
        <div class="info-row">
          <span class="label">Période</span>
          <span class="value">${reportPeriod}</span>
        </div>
      </div>
      <p style="text-align: center;">
        <a href="${downloadUrl}" class="button">Télécharger le rapport</a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Ce lien de téléchargement est valide pendant 7 jours.</p>
    `, 'Rapport disponible'),
    text: `Rapport ${reportType} disponible\n\nBonjour ${recipientName},\n\nPériode: ${reportPeriod}\n\nTéléchargez: ${downloadUrl}`,
  }),
};

// ============================================================================
// Email Service Class
// ============================================================================

export class EmailService {
  private config: EmailConfig;
  private baseUrl: string;

  constructor(config: Partial<EmailConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      fromEmail: config.fromEmail || 'noreply@perfex.io',
      fromName: config.fromName || 'Perfex Healthcare',
      environment: config.environment || 'production',
      replyToEmail: config.replyToEmail,
    };

    // Set base URL based on environment
    switch (this.config.environment) {
      case 'development':
        this.baseUrl = 'https://perfex-web-dev.pages.dev';
        break;
      case 'staging':
        this.baseUrl = 'https://perfex-web-staging.pages.dev';
        break;
      default:
        this.baseUrl = 'https://perfex-web.pages.dev';
    }
  }

  /**
   * Send email via Resend API
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    const email = {
      from: options.from || `${this.config.fromName} <${this.config.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html,
      reply_to: options.replyTo || this.config.replyToEmail,
      cc: options.cc,
      bcc: options.bcc,
      tags: options.tags,
    };

    // Development mode - log only
    if (this.config.environment === 'development' || !this.config.apiKey) {
      logger.info('[EMAIL] Would send email', {
        to: email.to,
        subject: email.subject,
        environment: this.config.environment,
        hasApiKey: !!this.config.apiKey,
      });
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    try {
      // Send via Resend API (compatible with Cloudflare Workers)
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email),
      });

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        logger.error('Email send failed', {
          status: response.status,
          error: errorData,
          to: email.to,
          subject: email.subject,
        });
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`
        };
      }

      const result = await response.json() as { id: string };

      logger.info('Email sent successfully', {
        messageId: result.id,
        to: email.to,
        subject: email.subject,
      });

      return { success: true, messageId: result.id };
    } catch (error) {
      logger.error('Email send error', { error, to: email.to });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==========================================================================
  // Template Methods
  // ==========================================================================

  /**
   * Send welcome email
   */
  async sendWelcome(to: string, firstName: string): Promise<EmailResult> {
    const template = templates.welcome(firstName, `${this.baseUrl}/login`);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'welcome' }],
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(to: string, resetToken: string): Promise<EmailResult> {
    const resetUrl = `${this.baseUrl}/reset-password?token=${resetToken}`;
    const template = templates.passwordReset(resetUrl, '1 heure');
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'password-reset' }],
    });
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(
    to: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    doctorName: string,
    department: string,
    location: string
  ): Promise<EmailResult> {
    const template = templates.appointmentReminder(
      patientName,
      appointmentDate,
      appointmentTime,
      doctorName,
      department,
      location
    );
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'appointment-reminder' }],
    });
  }

  /**
   * Send critical alert notification
   */
  async sendCriticalAlert(
    to: string | string[],
    alertType: string,
    patientName: string,
    patientId: string,
    message: string,
    details: string
  ): Promise<EmailResult> {
    const actionUrl = `${this.baseUrl}/patients/${patientId}`;
    const template = templates.criticalAlert(
      alertType,
      patientName,
      patientId,
      message,
      details,
      actionUrl
    );
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [
        { name: 'type', value: 'critical-alert' },
        { name: 'priority', value: 'high' },
      ],
    });
  }

  /**
   * Send lab results notification
   */
  async sendLabResults(
    to: string,
    patientName: string,
    testDate: string,
    testTypes: string[],
    hasAbnormal: boolean,
    patientId: string
  ): Promise<EmailResult> {
    const viewUrl = `${this.baseUrl}/patients/${patientId}/labs`;
    const template = templates.labResults(
      patientName,
      testDate,
      testTypes,
      hasAbnormal,
      viewUrl
    );
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'lab-results' }],
    });
  }

  /**
   * Send dialyse session reminder
   */
  async sendDialyseReminder(
    to: string,
    patientName: string,
    sessionDate: string,
    sessionTime: string,
    machineNumber: string,
    duration: string
  ): Promise<EmailResult> {
    const template = templates.dialyseSessionReminder(
      patientName,
      sessionDate,
      sessionTime,
      machineNumber,
      duration
    );
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'dialyse-reminder' }],
    });
  }

  /**
   * Send invitation email
   */
  async sendInvitation(
    to: string,
    inviterName: string,
    organizationName: string,
    role: string,
    inviteToken: string
  ): Promise<EmailResult> {
    const inviteUrl = `${this.baseUrl}/invite/accept?token=${inviteToken}`;
    const template = templates.invitation(
      inviterName,
      organizationName,
      role,
      inviteUrl,
      '7 jours'
    );
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'invitation' }],
    });
  }

  /**
   * Send report ready notification
   */
  async sendReportReady(
    to: string,
    recipientName: string,
    reportType: string,
    reportPeriod: string,
    reportId: string
  ): Promise<EmailResult> {
    const downloadUrl = `${this.baseUrl}/reports/${reportId}/download`;
    const template = templates.reportReady(
      recipientName,
      reportType,
      reportPeriod,
      downloadUrl
    );
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'report-ready' }],
    });
  }

  /**
   * Send verification email
   */
  async sendVerification(to: string, verificationToken: string): Promise<EmailResult> {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${verificationToken}`;
    return this.send({
      to,
      subject: 'Vérifiez votre adresse email',
      html: templates.baseTemplate(`
        <h2>Vérification de votre email</h2>
        <p>Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email:</p>
        <p style="text-align: center;">
          <a href="${verificationUrl}" class="button">Vérifier mon email</a>
        </p>
        <p style="font-size: 13px; color: #64748b;">Ce lien expire dans 24 heures.</p>
      `, 'Vérification email'),
      text: `Vérifiez votre email: ${verificationUrl}\n\nCe lien expire dans 24 heures.`,
      tags: [{ name: 'type', value: 'verification' }],
    });
  }

  /**
   * Send passwordless login link
   */
  async sendPasswordlessLogin(to: string, loginToken: string): Promise<EmailResult> {
    const loginUrl = `${this.baseUrl}/auth/passwordless?token=${loginToken}`;
    return this.send({
      to,
      subject: 'Votre lien de connexion',
      html: templates.baseTemplate(`
        <h2>Connexion sécurisée</h2>
        <p>Cliquez sur le lien ci-dessous pour vous connecter à votre compte:</p>
        <p style="text-align: center;">
          <a href="${loginUrl}" class="button">Se connecter</a>
        </p>
        <div class="alert-warning">
          <strong>⚠️ Ce lien expire dans 15 minutes.</strong>
        </div>
        <p>Si vous n'avez pas demandé ce lien, ignorez simplement cet email.</p>
      `, 'Connexion'),
      text: `Lien de connexion: ${loginUrl}\n\nCe lien expire dans 15 minutes.`,
      tags: [{ name: 'type', value: 'passwordless-login' }],
    });
  }
}

// ============================================================================
// Factory function for creating email service
// ============================================================================

export function createEmailService(env: {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  ENVIRONMENT?: string;
}): EmailService {
  return new EmailService({
    apiKey: env.RESEND_API_KEY || '',
    fromEmail: env.EMAIL_FROM || 'noreply@perfex.io',
    fromName: env.EMAIL_FROM_NAME || 'Perfex Healthcare',
    environment: (env.ENVIRONMENT as 'development' | 'staging' | 'production') || 'production',
  });
}
