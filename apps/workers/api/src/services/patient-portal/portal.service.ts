/**
 * Patient Portal Service
 * Secure patient-facing portal for viewing appointments, results, and messaging
 */

import { hashPassword, comparePassword, generateRandomToken } from '../../utils/crypto';

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface PatientPortalUser {
  id: string;
  patientId: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  twoFactorEnabled: boolean;
}

export interface PatientAppointment {
  id: string;
  scheduledAt: Date;
  endTime?: Date;
  type: string;
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  provider: {
    id: string;
    name: string;
    specialty?: string;
  };
  location?: string;
  notes?: string;
  module: 'dialyse' | 'cardiology' | 'ophthalmology' | 'general';
  canCancel: boolean;
  canReschedule: boolean;
}

export interface PatientLabResult {
  id: string;
  testName: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  collectedAt: Date;
  resultedAt: Date;
  category: string;
  interpretation?: string;
  isNew: boolean;
}

export interface PatientMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  instructions?: string;
  isActive: boolean;
  refillsRemaining?: number;
  nextRefillDate?: Date;
}

export interface PatientMessage {
  id: string;
  subject: string;
  body: string;
  from: {
    id: string;
    name: string;
    role: 'patient' | 'provider' | 'staff';
  };
  to: {
    id: string;
    name: string;
    role: 'patient' | 'provider' | 'staff';
  };
  sentAt: Date;
  readAt?: Date;
  isRead: boolean;
  threadId: string;
  attachments?: { name: string; url: string; type: string }[];
  category: 'general' | 'appointment' | 'results' | 'prescription' | 'billing' | 'urgent';
}

export interface PatientDocument {
  id: string;
  name: string;
  type: 'lab_report' | 'imaging' | 'consultation' | 'prescription' | 'consent' | 'other';
  category: string;
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  url: string;
  isConfidential: boolean;
}

export interface PortalDashboard {
  patient: {
    id: string;
    name: string;
    dateOfBirth: Date;
    mrn: string;
  };
  upcomingAppointments: PatientAppointment[];
  recentLabResults: PatientLabResult[];
  activeMedications: PatientMedication[];
  unreadMessages: number;
  pendingActions: {
    type: string;
    description: string;
    dueDate?: Date;
    priority: 'low' | 'medium' | 'high';
  }[];
  notifications: {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'action_required';
    createdAt: Date;
    isRead: boolean;
  }[];
}

export interface AppointmentRequest {
  preferredDates: Date[];
  preferredTimeOfDay: 'morning' | 'afternoon' | 'any';
  appointmentType: string;
  reason: string;
  urgency: 'routine' | 'soon' | 'urgent';
  notes?: string;
}

// =============================================================================
// Patient Portal Service Class
// =============================================================================

export class PatientPortalService {
  /**
   * Get patient portal dashboard
   */
  async getDashboard(patientId: string): Promise<PortalDashboard> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get basic patient info (mock - would come from patient table)
    const patientInfo = {
      id: patientId,
      name: 'Patient Name', // Would be fetched from DB
      dateOfBirth: new Date('1970-01-01'),
      mrn: `MRN-${patientId.substring(0, 8).toUpperCase()}`
    };

    // Get upcoming appointments
    const upcomingAppointments = await this.getUpcomingAppointments(patientId, 5);

    // Get recent lab results
    const recentLabResults = await this.getRecentLabResults(patientId, thirtyDaysAgo);

    // Get active medications
    const activeMedications = await this.getActiveMedications(patientId);

    // Get unread messages count
    const unreadMessages = await this.getUnreadMessagesCount(patientId);

    // Get pending actions
    const pendingActions = await this.getPendingActions(patientId);

    // Get notifications
    const notifications = await this.getNotifications(patientId);

    return {
      patient: patientInfo,
      upcomingAppointments,
      recentLabResults,
      activeMedications,
      unreadMessages,
      pendingActions,
      notifications
    };
  }

  /**
   * Get upcoming appointments for patient
   */
  async getUpcomingAppointments(patientId: string, limit: number = 10): Promise<PatientAppointment[]> {
    const now = new Date();

    // This would query actual appointment tables
    // For now, return mock structure
    return [
      {
        id: 'apt-001',
        scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        type: 'Consultation de suivi',
        status: 'scheduled',
        provider: {
          id: 'prov-001',
          name: 'Dr. Martin',
          specialty: 'Néphrologie'
        },
        location: 'Centre de Dialyse - Salle 3',
        module: 'dialyse',
        canCancel: true,
        canReschedule: true
      },
      {
        id: 'apt-002',
        scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        type: 'Séance de dialyse',
        status: 'scheduled',
        provider: {
          id: 'prov-002',
          name: 'Dr. Dupont',
          specialty: 'Néphrologie'
        },
        location: 'Centre de Dialyse - Poste 5',
        module: 'dialyse',
        canCancel: false,
        canReschedule: true
      }
    ];
  }

  /**
   * Get recent lab results
   */
  async getRecentLabResults(patientId: string, since: Date): Promise<PatientLabResult[]> {
    // This would query lab results tables
    return [
      {
        id: 'lab-001',
        testName: 'Créatinine',
        value: 8.5,
        unit: 'mg/dL',
        referenceRange: '0.7-1.3',
        status: 'high',
        collectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        resultedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        category: 'Rein',
        interpretation: 'Valeur attendue pour patient dialysé',
        isNew: true
      },
      {
        id: 'lab-002',
        testName: 'Hémoglobine',
        value: 10.2,
        unit: 'g/dL',
        referenceRange: '12-16',
        status: 'low',
        collectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        resultedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        category: 'Hématologie',
        isNew: true
      },
      {
        id: 'lab-003',
        testName: 'Kt/V',
        value: 1.35,
        unit: '',
        referenceRange: '>1.2',
        status: 'normal',
        collectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        resultedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        category: 'Dialyse',
        interpretation: 'Dialyse efficace',
        isNew: false
      }
    ];
  }

  /**
   * Get active medications
   */
  async getActiveMedications(patientId: string): Promise<PatientMedication[]> {
    // This would query medication tables
    return [
      {
        id: 'med-001',
        name: 'Érythropoïétine (EPO)',
        dosage: '4000 UI',
        frequency: '3x/semaine',
        route: 'SC',
        startDate: new Date('2024-01-15'),
        prescribedBy: 'Dr. Martin',
        instructions: 'Administrer pendant séance de dialyse',
        isActive: true
      },
      {
        id: 'med-002',
        name: 'Calcium carbonate',
        dosage: '500 mg',
        frequency: '3x/jour',
        route: 'PO',
        startDate: new Date('2024-02-01'),
        prescribedBy: 'Dr. Martin',
        instructions: 'Prendre aux repas',
        isActive: true
      },
      {
        id: 'med-003',
        name: 'Losartan',
        dosage: '50 mg',
        frequency: '1x/jour',
        route: 'PO',
        startDate: new Date('2023-06-01'),
        prescribedBy: 'Dr. Dupont',
        instructions: 'Le matin',
        isActive: true
      }
    ];
  }

  /**
   * Get unread messages count
   */
  async getUnreadMessagesCount(patientId: string): Promise<number> {
    // This would query messages table
    return 2;
  }

  /**
   * Get pending actions for patient
   */
  async getPendingActions(patientId: string): Promise<{ type: string; description: string; dueDate?: Date; priority: 'low' | 'medium' | 'high' }[]> {
    return [
      {
        type: 'document',
        description: 'Signer le consentement pour le nouveau protocole',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'high'
      },
      {
        type: 'questionnaire',
        description: 'Remplir le questionnaire qualité de vie mensuel',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: 'medium'
      }
    ];
  }

  /**
   * Get notifications
   */
  async getNotifications(patientId: string): Promise<{ id: string; message: string; type: 'info' | 'warning' | 'action_required'; createdAt: Date; isRead: boolean }[]> {
    return [
      {
        id: 'notif-001',
        message: 'Vos résultats de laboratoire sont disponibles',
        type: 'info',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isRead: false
      },
      {
        id: 'notif-002',
        message: 'Rappel: RDV dans 3 jours',
        type: 'info',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isRead: false
      }
    ];
  }

  /**
   * Get all messages for patient
   */
  async getMessages(
    patientId: string,
    options: { category?: string; isRead?: boolean; limit?: number; offset?: number }
  ): Promise<{ messages: PatientMessage[]; total: number }> {
    const { category, isRead, limit = 20, offset = 0 } = options;

    // Mock messages - would query actual messages table
    const messages: PatientMessage[] = [
      {
        id: 'msg-001',
        subject: 'Résultats de vos analyses',
        body: 'Bonjour, vos résultats de laboratoire sont maintenant disponibles dans votre espace patient. Votre Kt/V est satisfaisant. Nous en discuterons lors de votre prochain rendez-vous.',
        from: { id: 'prov-001', name: 'Dr. Martin', role: 'provider' },
        to: { id: patientId, name: 'Patient', role: 'patient' },
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isRead: false,
        threadId: 'thread-001',
        category: 'results'
      },
      {
        id: 'msg-002',
        subject: 'Confirmation de rendez-vous',
        body: 'Votre rendez-vous du 15 janvier 2025 à 10h00 est confirmé. Merci de vous présenter 15 minutes avant l\'heure prévue.',
        from: { id: 'staff-001', name: 'Secrétariat', role: 'staff' },
        to: { id: patientId, name: 'Patient', role: 'patient' },
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        readAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        isRead: true,
        threadId: 'thread-002',
        category: 'appointment'
      }
    ];

    return {
      messages,
      total: messages.length
    };
  }

  /**
   * Send a message from patient
   */
  async sendMessage(
    patientId: string,
    data: {
      to: string;
      subject: string;
      body: string;
      category: PatientMessage['category'];
      threadId?: string;
    }
  ): Promise<PatientMessage> {
    const message: PatientMessage = {
      id: `msg-${Date.now()}`,
      subject: data.subject,
      body: data.body,
      from: { id: patientId, name: 'Patient', role: 'patient' },
      to: { id: data.to, name: 'Destinataire', role: 'provider' },
      sentAt: new Date(),
      isRead: false,
      threadId: data.threadId || `thread-${Date.now()}`,
      category: data.category
    };

    // Would save to database here

    return message;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(patientId: string, messageId: string): Promise<void> {
    // Would update message in database
  }

  /**
   * Get patient documents
   */
  async getDocuments(
    patientId: string,
    options: { type?: string; limit?: number; offset?: number }
  ): Promise<{ documents: PatientDocument[]; total: number }> {
    const { type, limit = 20, offset = 0 } = options;

    // Mock documents
    const documents: PatientDocument[] = [
      {
        id: 'doc-001',
        name: 'Résultats Biologie Janvier 2025.pdf',
        type: 'lab_report',
        category: 'Laboratoire',
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        uploadedBy: 'Système',
        size: 245000,
        url: '/documents/lab-report-001.pdf',
        isConfidential: false
      },
      {
        id: 'doc-002',
        name: 'Compte-rendu Consultation Néphrologie.pdf',
        type: 'consultation',
        category: 'Consultations',
        uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        uploadedBy: 'Dr. Martin',
        size: 128000,
        url: '/documents/consultation-001.pdf',
        isConfidential: false
      },
      {
        id: 'doc-003',
        name: 'Ordonnance Traitement.pdf',
        type: 'prescription',
        category: 'Ordonnances',
        uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        uploadedBy: 'Dr. Martin',
        size: 89000,
        url: '/documents/prescription-001.pdf',
        isConfidential: false
      }
    ];

    return {
      documents: type ? documents.filter(d => d.type === type) : documents,
      total: documents.length
    };
  }

  /**
   * Request an appointment
   */
  async requestAppointment(patientId: string, request: AppointmentRequest): Promise<{ requestId: string; status: string; message: string }> {
    // Would create appointment request in database
    const requestId = `req-${Date.now()}`;

    return {
      requestId,
      status: 'pending',
      message: 'Votre demande de rendez-vous a été envoyée. Vous recevrez une confirmation sous 48h.'
    };
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(patientId: string, appointmentId: string, reason: string): Promise<{ success: boolean; message: string }> {
    // Would update appointment in database
    return {
      success: true,
      message: 'Votre rendez-vous a été annulé. Un email de confirmation vous a été envoyé.'
    };
  }

  /**
   * Get educational materials for patient
   */
  async getEducationalMaterials(patientId: string, module?: string): Promise<{
    id: string;
    title: string;
    description: string;
    type: 'article' | 'video' | 'pdf' | 'infographic';
    url: string;
    category: string;
    readTime?: string;
  }[]> {
    // Educational content based on patient's conditions
    return [
      {
        id: 'edu-001',
        title: 'Comprendre la dialyse',
        description: 'Guide complet sur l\'hémodialyse et son fonctionnement',
        type: 'article',
        url: '/education/dialysis-guide',
        category: 'Dialyse',
        readTime: '10 min'
      },
      {
        id: 'edu-002',
        title: 'Régime alimentaire en dialyse',
        description: 'Conseils nutritionnels pour les patients dialysés',
        type: 'pdf',
        url: '/education/diet-guide.pdf',
        category: 'Nutrition'
      },
      {
        id: 'edu-003',
        title: 'Gestion du potassium',
        description: 'Comment contrôler votre apport en potassium',
        type: 'infographic',
        url: '/education/potassium-infographic',
        category: 'Nutrition'
      },
      {
        id: 'edu-004',
        title: 'Préparation à une séance de dialyse',
        description: 'Vidéo explicative sur ce qu\'il faut faire avant et après',
        type: 'video',
        url: '/education/dialysis-prep-video',
        category: 'Dialyse',
        readTime: '5 min'
      }
    ];
  }

  /**
   * Submit symptom tracker entry
   */
  async submitSymptomTracker(
    patientId: string,
    data: {
      date: Date;
      symptoms: { name: string; severity: number; notes?: string }[];
      vitals?: { weight?: number; bloodPressureSystolic?: number; bloodPressureDiastolic?: number };
      mood?: number;
      notes?: string;
    }
  ): Promise<{ id: string; success: boolean }> {
    const entryId = `symptom-${Date.now()}`;

    // Would save to database
    return {
      id: entryId,
      success: true
    };
  }

  /**
   * Get symptom history
   */
  async getSymptomHistory(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    date: Date;
    symptoms: { name: string; severity: number }[];
    weight?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    mood?: number;
  }[]> {
    // Would query symptom tracking table
    return [
      {
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        symptoms: [
          { name: 'Fatigue', severity: 3 },
          { name: 'Crampes', severity: 2 }
        ],
        weight: 72.5,
        bloodPressure: { systolic: 145, diastolic: 88 },
        mood: 3
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        symptoms: [
          { name: 'Fatigue', severity: 2 }
        ],
        weight: 73.2,
        bloodPressure: { systolic: 138, diastolic: 85 },
        mood: 4
      }
    ];
  }
}
