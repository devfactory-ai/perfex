/**
 * Complete Telemedicine Platform Service
 * Plateforme Télémédecine Complète
 * Gestion des téléconsultations, video, messagerie, prescriptions électroniques
 */

// Types
export interface TeleconsultationSession {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  type: 'video' | 'audio' | 'chat' | 'async';
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  chiefComplaint: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  room: VirtualRoom;
  participants: Participant[];
  consent: TelemedConsent;
  technicalInfo: TechnicalInfo;
  clinicalNotes?: ClinicalNote;
  prescription?: TelePrescription;
  followUp?: FollowUpPlan;
  billing?: TelemedBilling;
  recording?: RecordingInfo;
  attachments: SessionAttachment[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface VirtualRoom {
  id: string;
  url: string;
  accessCode?: string;
  hostKey?: string;
  capacity: number;
  features: ('video' | 'audio' | 'chat' | 'screenshare' | 'whiteboard' | 'recording')[];
  expiresAt: string;
}

export interface Participant {
  id: string;
  userId: string;
  name: string;
  role: 'patient' | 'provider' | 'interpreter' | 'family_member' | 'specialist';
  joinedAt?: string;
  leftAt?: string;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TelemedConsent {
  consentGiven: boolean;
  consentType: 'verbal' | 'written' | 'electronic';
  consentedAt: string;
  consentedBy: string;
  disclosures: string[];
  limitations: string[];
  witnessId?: string;
}

export interface TechnicalInfo {
  platform: string;
  patientDevice?: string;
  providerDevice?: string;
  networkQuality?: 'high' | 'medium' | 'low';
  issues?: TechnicalIssue[];
}

export interface TechnicalIssue {
  timestamp: string;
  type: 'audio' | 'video' | 'connection' | 'other';
  description: string;
  resolved: boolean;
  resolution?: string;
}

export interface ClinicalNote {
  id: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  reviewOfSystems?: Record<string, string>;
  physicalExamFindings?: string;
  visualObservations?: string;
  assessment: string;
  plan: string;
  diagnoses: { code: string; description: string; isPrimary: boolean }[];
  proceduresConducted?: string[];
  limitations: string;
  signedBy: string;
  signedAt: string;
}

export interface TelePrescription {
  id: string;
  medications: PrescriptionMedication[];
  pharmacyId?: string;
  pharmacyName?: string;
  transmissionMethod: 'e-prescribe' | 'fax' | 'print' | 'patient_pickup';
  transmittedAt?: string;
  signedBy: string;
  signedAt: string;
  status: 'pending' | 'transmitted' | 'received' | 'filled' | 'cancelled';
}

export interface PrescriptionMedication {
  drugName: string;
  rxNorm?: string;
  ndc?: string;
  strength: string;
  form: string;
  quantity: number;
  daysSupply: number;
  refills: number;
  sig: string;
  daw: boolean;
  notes?: string;
}

export interface FollowUpPlan {
  required: boolean;
  type?: 'telehealth' | 'in_person' | 'either';
  timeframe?: string;
  reason?: string;
  scheduledAppointmentId?: string;
  referrals?: TelemedReferral[];
  patientInstructions: string[];
  warningSignsToWatch: string[];
  emergencyInstructions: string;
}

export interface TelemedReferral {
  specialty: string;
  urgency: 'routine' | 'urgent';
  reason: string;
  providerId?: string;
  providerName?: string;
}

export interface TelemedBilling {
  cptCodes: { code: string; description: string; modifier?: string }[];
  placeOfService: string;
  timeBasedBilling?: { start: string; end: string; totalMinutes: number };
  modifiers: string[];
  icdCodes: string[];
  submittedAt?: string;
  status: 'pending' | 'submitted' | 'paid' | 'denied';
}

export interface RecordingInfo {
  enabled: boolean;
  consentObtained: boolean;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  fileUrl?: string;
  fileSize?: number;
  retentionDays: number;
  expiresAt?: string;
}

export interface SessionAttachment {
  id: string;
  type: 'image' | 'document' | 'lab_result' | 'prescription' | 'other';
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  sharedWith: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Participant['role'];
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
  readBy: string[];
  sentAt: string;
}

export interface WaitingRoom {
  sessionId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  checkInTime: string;
  estimatedWaitTime?: number;
  position: number;
  status: 'checked_in' | 'ready' | 'called' | 'no_response';
  preVisitQuestionnaire?: Record<string, unknown>;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    oxygenSaturation?: number;
    painLevel?: number;
  };
}

export interface ProviderSchedule {
  providerId: string;
  providerName: string;
  specialty: string;
  date: string;
  slots: ScheduleSlot[];
  breakTimes: { start: string; end: string }[];
  maxConsecutiveHours: number;
  telemedEnabled: boolean;
}

export interface ScheduleSlot {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'telehealth' | 'in_person' | 'either';
  status: 'available' | 'booked' | 'blocked' | 'completed';
  sessionId?: string;
  patientId?: string;
  patientName?: string;
}

export interface AsyncConsultation {
  id: string;
  patientId: string;
  patientName: string;
  providerId?: string;
  providerName?: string;
  specialty: string;
  chiefComplaint: string;
  symptomHistory: string;
  attachments: SessionAttachment[];
  questions: string[];
  status: 'pending' | 'assigned' | 'in_review' | 'responded' | 'closed';
  priority: 'low' | 'normal' | 'high';
  response?: {
    content: string;
    recommendations: string[];
    prescription?: TelePrescription;
    followUpNeeded: boolean;
    respondedAt: string;
    respondedBy: string;
  };
  createdAt: string;
  respondedAt?: string;
  closedAt?: string;
  slaDeadline?: string;
}

// In-memory storage
const sessions: TeleconsultationSession[] = [];
const waitingRooms: WaitingRoom[] = [];
const asyncConsultations: AsyncConsultation[] = [];
const providerSchedules: ProviderSchedule[] = [];

export class TelemedicineCompleteService {

  // Create teleconsultation session
  async createSession(data: {
    patientId: string;
    patientName: string;
    providerId: string;
    providerName: string;
    providerSpecialty: string;
    type: TeleconsultationSession['type'];
    scheduledAt: string;
    chiefComplaint: string;
    urgency?: TeleconsultationSession['urgency'];
    appointmentId?: string;
  }): Promise<TeleconsultationSession> {
    const now = new Date();
    const roomExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const session: TeleconsultationSession = {
      id: `tele-${Date.now()}`,
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      patientName: data.patientName,
      providerId: data.providerId,
      providerName: data.providerName,
      providerSpecialty: data.providerSpecialty,
      type: data.type,
      status: 'scheduled',
      scheduledAt: data.scheduledAt,
      chiefComplaint: data.chiefComplaint,
      urgency: data.urgency || 'routine',
      room: {
        id: `room-${Date.now()}`,
        url: `/telehealth/room/${Date.now()}`,
        accessCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
        hostKey: Math.random().toString(36).substr(2, 12),
        capacity: 4,
        features: ['video', 'audio', 'chat', 'screenshare'],
        expiresAt: roomExpiry.toISOString()
      },
      participants: [],
      consent: {
        consentGiven: false,
        consentType: 'electronic',
        consentedAt: '',
        consentedBy: '',
        disclosures: [
          'La téléconsultation ne remplace pas une consultation en personne dans certains cas',
          'Les données sont cryptées et stockées de manière sécurisée',
          'L\'enregistrement de la session peut être demandé'
        ],
        limitations: [
          'Examen physique limité',
          'Qualité dépendante de la connexion internet'
        ]
      },
      technicalInfo: {
        platform: 'Perfex Telehealth'
      },
      attachments: [],
      messages: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    sessions.push(session);

    // Send notifications
    await this.notifyParticipants(session, 'session_created');

    return session;
  }

  // Get session by ID
  getSession(sessionId: string): TeleconsultationSession | undefined {
    return sessions.find(s => s.id === sessionId);
  }

  // Patient check-in to waiting room
  async checkIn(sessionId: string, data: {
    preVisitQuestionnaire?: Record<string, unknown>;
    vitalSigns?: WaitingRoom['vitalSigns'];
  }): Promise<WaitingRoom> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    // Get current waiting room queue for this provider
    const providerQueue = waitingRooms.filter(
      w => w.providerId === session.providerId && w.status !== 'called'
    );

    const entry: WaitingRoom = {
      sessionId,
      patientId: session.patientId,
      patientName: session.patientName,
      providerId: session.providerId,
      providerName: session.providerName,
      checkInTime: new Date().toISOString(),
      estimatedWaitTime: providerQueue.length * 15,
      position: providerQueue.length + 1,
      status: 'checked_in',
      preVisitQuestionnaire: data.preVisitQuestionnaire,
      vitalSigns: data.vitalSigns
    };

    waitingRooms.push(entry);
    session.status = 'waiting';
    session.updatedAt = new Date().toISOString();

    // Notify provider
    await this.notifyProvider(session.providerId, 'patient_checked_in', entry);

    return entry;
  }

  // Get waiting room queue
  getWaitingRoom(providerId: string): WaitingRoom[] {
    return waitingRooms
      .filter(w => w.providerId === providerId && ['checked_in', 'ready'].includes(w.status))
      .sort((a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime());
  }

  // Call patient from waiting room
  async callPatient(sessionId: string): Promise<TeleconsultationSession> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const waitingEntry = waitingRooms.find(w => w.sessionId === sessionId);
    if (waitingEntry) {
      waitingEntry.status = 'called';
    }

    // Notify patient
    await this.notifyPatient(session.patientId, 'provider_ready', session);

    return session;
  }

  // Record consent
  async recordConsent(sessionId: string, data: {
    consentType: TelemedConsent['consentType'];
    consentedBy: string;
    witnessId?: string;
  }): Promise<TeleconsultationSession> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.consent = {
      ...session.consent,
      consentGiven: true,
      consentType: data.consentType,
      consentedAt: new Date().toISOString(),
      consentedBy: data.consentedBy,
      witnessId: data.witnessId
    };

    session.updatedAt = new Date().toISOString();
    return session;
  }

  // Join session
  async joinSession(sessionId: string, participant: {
    userId: string;
    name: string;
    role: Participant['role'];
    deviceInfo?: Participant['deviceInfo'];
  }): Promise<{ session: TeleconsultationSession; token: string }> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    // Check if consent is given
    if (!session.consent.consentGiven && participant.role !== 'provider') {
      throw new Error('Consent required before joining');
    }

    // Add participant
    const existingParticipant = session.participants.find(p => p.userId === participant.userId);
    if (existingParticipant) {
      existingParticipant.joinedAt = new Date().toISOString();
      existingParticipant.leftAt = undefined;
    } else {
      session.participants.push({
        id: `part-${Date.now()}`,
        userId: participant.userId,
        name: participant.name,
        role: participant.role,
        joinedAt: new Date().toISOString(),
        deviceInfo: participant.deviceInfo
      });
    }

    // Update session status if provider joins
    if (participant.role === 'provider' && session.status === 'waiting') {
      session.status = 'in_progress';
      session.startedAt = new Date().toISOString();
    }

    session.updatedAt = new Date().toISOString();

    // Generate video token (mock)
    const token = `vt_${sessionId}_${participant.userId}_${Date.now()}`;

    return { session, token };
  }

  // Leave session
  async leaveSession(sessionId: string, userId: string): Promise<TeleconsultationSession> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const participant = session.participants.find(p => p.userId === userId);
    if (participant) {
      participant.leftAt = new Date().toISOString();
    }

    // Check if all participants have left
    const activeParticipants = session.participants.filter(p => !p.leftAt);
    if (activeParticipants.length === 0 && session.status === 'in_progress') {
      session.status = 'completed';
      session.endedAt = new Date().toISOString();
      session.duration = session.startedAt
        ? Math.round((new Date().getTime() - new Date(session.startedAt).getTime()) / 60000)
        : 0;
    }

    session.updatedAt = new Date().toISOString();
    return session;
  }

  // Send chat message
  sendMessage(sessionId: string, message: {
    senderId: string;
    senderName: string;
    senderRole: Participant['role'];
    content: string;
    type?: ChatMessage['type'];
    attachmentUrl?: string;
  }): ChatMessage {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      content: message.content,
      type: message.type || 'text',
      attachmentUrl: message.attachmentUrl,
      readBy: [message.senderId],
      sentAt: new Date().toISOString()
    };

    session.messages.push(chatMessage);
    session.updatedAt = new Date().toISOString();

    return chatMessage;
  }

  // Complete session with clinical notes
  async completeSession(sessionId: string, data: {
    clinicalNote: Omit<ClinicalNote, 'id' | 'signedAt'>;
    prescription?: Omit<TelePrescription, 'id' | 'signedAt' | 'status'>;
    followUp?: FollowUpPlan;
    billing?: Omit<TelemedBilling, 'status'>;
  }): Promise<TeleconsultationSession> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const now = new Date().toISOString();

    session.clinicalNotes = {
      id: `note-${Date.now()}`,
      ...data.clinicalNote,
      signedAt: now
    };

    if (data.prescription) {
      session.prescription = {
        id: `rx-${Date.now()}`,
        ...data.prescription,
        signedAt: now,
        status: 'pending'
      };
    }

    if (data.followUp) {
      session.followUp = data.followUp;
    }

    if (data.billing) {
      session.billing = {
        ...data.billing,
        status: 'pending'
      };
    }

    session.status = 'completed';
    session.endedAt = now;
    if (session.startedAt) {
      session.duration = Math.round(
        (new Date(now).getTime() - new Date(session.startedAt).getTime()) / 60000
      );
    }
    session.updatedAt = now;

    // Send follow-up notifications
    if (session.followUp?.required) {
      await this.notifyPatient(session.patientId, 'follow_up_required', session);
    }

    return session;
  }

  // Transmit prescription
  async transmitPrescription(sessionId: string, data: {
    pharmacyId: string;
    pharmacyName: string;
    method: TelePrescription['transmissionMethod'];
  }): Promise<TelePrescription> {
    const session = this.getSession(sessionId);
    if (!session || !session.prescription) throw new Error('Prescription not found');

    session.prescription.pharmacyId = data.pharmacyId;
    session.prescription.pharmacyName = data.pharmacyName;
    session.prescription.transmissionMethod = data.method;
    session.prescription.transmittedAt = new Date().toISOString();
    session.prescription.status = 'transmitted';

    session.updatedAt = new Date().toISOString();

    return session.prescription;
  }

  // Start/stop recording
  async toggleRecording(sessionId: string, action: 'start' | 'stop', consentObtained: boolean): Promise<RecordingInfo> {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    if (action === 'start') {
      if (!consentObtained) throw new Error('Recording consent required');

      session.recording = {
        enabled: true,
        consentObtained: true,
        startedAt: new Date().toISOString(),
        retentionDays: 30
      };
    } else if (action === 'stop' && session.recording) {
      const now = new Date();
      session.recording.endedAt = now.toISOString();
      session.recording.duration = session.recording.startedAt
        ? Math.round((now.getTime() - new Date(session.recording.startedAt).getTime()) / 1000)
        : 0;
      session.recording.expiresAt = new Date(
        now.getTime() + session.recording.retentionDays * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    session.updatedAt = new Date().toISOString();
    return session.recording!;
  }

  // Report technical issue
  reportTechnicalIssue(sessionId: string, issue: Omit<TechnicalIssue, 'timestamp' | 'resolved'>): TechnicalInfo {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    if (!session.technicalInfo.issues) {
      session.technicalInfo.issues = [];
    }

    session.technicalInfo.issues.push({
      ...issue,
      timestamp: new Date().toISOString(),
      resolved: false
    });

    session.updatedAt = new Date().toISOString();
    return session.technicalInfo;
  }

  // Create async consultation
  async createAsyncConsultation(data: {
    patientId: string;
    patientName: string;
    specialty: string;
    chiefComplaint: string;
    symptomHistory: string;
    questions: string[];
    attachments?: Omit<SessionAttachment, 'id' | 'uploadedAt' | 'sharedWith'>[];
    priority?: AsyncConsultation['priority'];
  }): Promise<AsyncConsultation> {
    const now = new Date();
    const slaHours = data.priority === 'high' ? 4 : data.priority === 'normal' ? 24 : 48;

    const consultation: AsyncConsultation = {
      id: `async-${Date.now()}`,
      patientId: data.patientId,
      patientName: data.patientName,
      specialty: data.specialty,
      chiefComplaint: data.chiefComplaint,
      symptomHistory: data.symptomHistory,
      questions: data.questions,
      attachments: (data.attachments || []).map((a, i) => ({
        ...a,
        id: `att-${Date.now()}-${i}`,
        uploadedAt: now.toISOString(),
        sharedWith: []
      })),
      status: 'pending',
      priority: data.priority || 'normal',
      createdAt: now.toISOString(),
      slaDeadline: new Date(now.getTime() + slaHours * 60 * 60 * 1000).toISOString()
    };

    asyncConsultations.push(consultation);
    return consultation;
  }

  // Get pending async consultations for specialty
  getPendingAsyncConsultations(specialty?: string): AsyncConsultation[] {
    return asyncConsultations
      .filter(c => {
        if (c.status !== 'pending' && c.status !== 'assigned') return false;
        if (specialty && c.specialty !== specialty) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort by priority then by deadline
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.slaDeadline || a.createdAt).getTime() - new Date(b.slaDeadline || b.createdAt).getTime();
      });
  }

  // Respond to async consultation
  async respondToAsyncConsultation(consultationId: string, data: {
    providerId: string;
    providerName: string;
    content: string;
    recommendations: string[];
    prescription?: Omit<TelePrescription, 'id' | 'signedAt' | 'status'>;
    followUpNeeded: boolean;
  }): Promise<AsyncConsultation> {
    const consultation = asyncConsultations.find(c => c.id === consultationId);
    if (!consultation) throw new Error('Consultation not found');

    const now = new Date().toISOString();

    consultation.providerId = data.providerId;
    consultation.providerName = data.providerName;
    consultation.response = {
      content: data.content,
      recommendations: data.recommendations,
      prescription: data.prescription ? {
        id: `rx-${Date.now()}`,
        ...data.prescription,
        signedAt: now,
        status: 'pending'
      } : undefined,
      followUpNeeded: data.followUpNeeded,
      respondedAt: now,
      respondedBy: data.providerId
    };
    consultation.status = 'responded';
    consultation.respondedAt = now;

    // Notify patient
    await this.notifyPatient(consultation.patientId, 'async_response_ready', consultation);

    return consultation;
  }

  // Get provider schedule
  getProviderSchedule(providerId: string, date: string): ProviderSchedule | undefined {
    return providerSchedules.find(s => s.providerId === providerId && s.date === date);
  }

  // Get available slots
  getAvailableSlots(options: {
    specialty?: string;
    providerId?: string;
    date: string;
    type?: ScheduleSlot['type'];
  }): { providerId: string; providerName: string; slots: ScheduleSlot[] }[] {
    let schedules = providerSchedules.filter(s => s.date === options.date && s.telemedEnabled);

    if (options.specialty) {
      schedules = schedules.filter(s => s.specialty === options.specialty);
    }

    if (options.providerId) {
      schedules = schedules.filter(s => s.providerId === options.providerId);
    }

    return schedules.map(schedule => ({
      providerId: schedule.providerId,
      providerName: schedule.providerName,
      slots: schedule.slots.filter(slot => {
        if (slot.status !== 'available') return false;
        if (options.type && slot.type !== 'either' && slot.type !== options.type) return false;
        return true;
      })
    }));
  }

  // Get session statistics
  getStatistics(options: {
    providerId?: string;
    fromDate?: string;
    toDate?: string;
  }): {
    totalSessions: number;
    completed: number;
    cancelled: number;
    noShow: number;
    averageDuration: number;
    byType: { type: string; count: number }[];
    bySpecialty: { specialty: string; count: number }[];
    patientSatisfaction?: number;
  } {
    let filtered = [...sessions];

    if (options.providerId) {
      filtered = filtered.filter(s => s.providerId === options.providerId);
    }

    if (options.fromDate) {
      filtered = filtered.filter(s => s.scheduledAt >= options.fromDate!);
    }

    if (options.toDate) {
      filtered = filtered.filter(s => s.scheduledAt <= options.toDate!);
    }

    const completed = filtered.filter(s => s.status === 'completed');
    const avgDuration = completed.length > 0
      ? completed.reduce((sum, s) => sum + (s.duration || 0), 0) / completed.length
      : 0;

    const typeCounts: Record<string, number> = {};
    const specialtyCounts: Record<string, number> = {};

    filtered.forEach(s => {
      typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
      specialtyCounts[s.providerSpecialty] = (specialtyCounts[s.providerSpecialty] || 0) + 1;
    });

    return {
      totalSessions: filtered.length,
      completed: completed.length,
      cancelled: filtered.filter(s => s.status === 'cancelled').length,
      noShow: filtered.filter(s => s.status === 'no_show').length,
      averageDuration: Math.round(avgDuration),
      byType: Object.entries(typeCounts).map(([type, count]) => ({ type, count })),
      bySpecialty: Object.entries(specialtyCounts).map(([specialty, count]) => ({ specialty, count }))
    };
  }

  // Helper methods
  private async notifyParticipants(_session: TeleconsultationSession, _event: string): Promise<void> {
    console.log(`[Telehealth] Notification sent for session`);
  }

  private async notifyProvider(_providerId: string, _event: string, _data: unknown): Promise<void> {
    console.log(`[Telehealth] Provider notification sent`);
  }

  private async notifyPatient(_patientId: string, _event: string, _data: unknown): Promise<void> {
    console.log(`[Telehealth] Patient notification sent`);
  }
}
