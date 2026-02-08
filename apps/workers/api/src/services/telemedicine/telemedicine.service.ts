/**
 * Telemedicine Service
 * Video consultations and remote patient monitoring
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export type ConsultationType = 'scheduled' | 'on_demand' | 'follow_up' | 'emergency';
export type ConsultationStatus = 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'technical_issue';
export type ParticipantRole = 'patient' | 'provider' | 'specialist' | 'interpreter' | 'family_member';

export interface TeleconsultationSession {
  id: string;
  type: ConsultationType;
  status: ConsultationStatus;

  // Scheduling
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // minutes

  // Participants
  patient: TeleParticipant;
  provider: TeleParticipant;
  additionalParticipants?: TeleParticipant[];

  // Technical
  roomUrl: string;
  roomToken: string;
  recordingEnabled: boolean;
  recordingUrl?: string;

  // Clinical
  reasonForVisit: string;
  chiefComplaint?: string;
  vitalsSelfReported?: SelfReportedVitals;
  prescriptions?: TelePrescription[];
  notes?: string;
  diagnosis?: string[];
  followUpRequired: boolean;
  followUpDate?: Date;

  // Administrative
  module: 'dialyse' | 'cardiology' | 'ophthalmology' | 'general';
  billingCode?: string;
  insuranceVerified: boolean;
  consentObtained: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface TeleParticipant {
  id: string;
  role: ParticipantRole;
  name: string;
  email?: string;
  phone?: string;
  joinedAt?: Date;
  leftAt?: Date;
  connectionQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  deviceInfo?: {
    browser?: string;
    os?: string;
    hasCamera: boolean;
    hasMicrophone: boolean;
  };
}

export interface SelfReportedVitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  oxygenSaturation?: number;
  bloodGlucose?: number;
  painLevel?: number; // 0-10
  reportedAt: Date;
}

export interface TelePrescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  sentToPharmacy: boolean;
  pharmacyId?: string;
}

export interface WaitingRoom {
  sessionId: string;
  patientId: string;
  patientName: string;
  reasonForVisit: string;
  waitingSince: Date;
  estimatedWaitMinutes: number;
  position: number;
  priority: 'normal' | 'high' | 'urgent';
  vitalsPrepared: boolean;
}

export interface ProviderSchedule {
  providerId: string;
  providerName: string;
  specialty: string;
  availableSlots: {
    date: Date;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    consultationType: ConsultationType[];
  }[];
  timezone: string;
}

export interface RemoteMonitoringDevice {
  id: string;
  patientId: string;
  type: 'blood_pressure' | 'glucose_meter' | 'pulse_oximeter' | 'weight_scale' | 'ecg' | 'spirometer';
  manufacturer: string;
  model: string;
  serialNumber?: string;
  lastSync?: Date;
  batteryLevel?: number;
  status: 'active' | 'inactive' | 'maintenance' | 'replaced';
  readings: DeviceReading[];
}

export interface DeviceReading {
  id: string;
  deviceId: string;
  timestamp: Date;
  type: string;
  value: number;
  unit: string;
  isAbnormal: boolean;
  alertGenerated: boolean;
  notes?: string;
}

// =============================================================================
// Telemedicine Service
// =============================================================================

export class TelemedicineService {

  /**
   * Create a new teleconsultation session
   */
  async createSession(data: {
    type: ConsultationType;
    patientId: string;
    patientName: string;
    providerId: string;
    providerName: string;
    scheduledAt?: Date;
    reasonForVisit: string;
    module: TeleconsultationSession['module'];
    recordingEnabled?: boolean;
  }): Promise<TeleconsultationSession> {
    const session: TeleconsultationSession = {
      id: `tele-${Date.now()}`,
      type: data.type,
      status: data.scheduledAt ? 'scheduled' : 'waiting',
      scheduledAt: data.scheduledAt,
      patient: {
        id: data.patientId,
        role: 'patient',
        name: data.patientName
      },
      provider: {
        id: data.providerId,
        role: 'provider',
        name: data.providerName
      },
      roomUrl: this.generateRoomUrl(),
      roomToken: this.generateRoomToken(),
      recordingEnabled: data.recordingEnabled || false,
      reasonForVisit: data.reasonForVisit,
      module: data.module,
      insuranceVerified: false,
      consentObtained: false,
      followUpRequired: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Would save to database
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<TeleconsultationSession | null> {
    // Would query database
    return null;
  }

  /**
   * Start a session
   */
  async startSession(sessionId: string, providerId: string): Promise<TeleconsultationSession> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.status = 'in_progress';
    session.startedAt = new Date();
    session.provider.joinedAt = new Date();

    // Would update in database
    return session;
  }

  /**
   * Patient joins session
   */
  async patientJoin(sessionId: string): Promise<{ roomUrl: string; token: string }> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.patient.joinedAt = new Date();

    return {
      roomUrl: session.roomUrl,
      token: session.roomToken
    };
  }

  /**
   * End session
   */
  async endSession(
    sessionId: string,
    data: {
      notes?: string;
      diagnosis?: string[];
      prescriptions?: TelePrescription[];
      followUpRequired: boolean;
      followUpDate?: Date;
    }
  ): Promise<TeleconsultationSession> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.status = 'completed';
    session.endedAt = new Date();
    session.duration = session.startedAt
      ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000)
      : 0;
    session.notes = data.notes;
    session.diagnosis = data.diagnosis;
    session.prescriptions = data.prescriptions;
    session.followUpRequired = data.followUpRequired;
    session.followUpDate = data.followUpDate;

    // Would update in database
    return session;
  }

  /**
   * Get waiting room queue
   */
  async getWaitingRoom(providerId: string): Promise<WaitingRoom[]> {
    // Would query sessions with status 'waiting' for this provider
    return [
      {
        sessionId: 'session-1',
        patientId: 'patient-1',
        patientName: 'Jean Dupont',
        reasonForVisit: 'Suivi dialyse - douleur accès vasculaire',
        waitingSince: new Date(Date.now() - 10 * 60 * 1000),
        estimatedWaitMinutes: 5,
        position: 1,
        priority: 'normal',
        vitalsPrepared: true
      }
    ];
  }

  /**
   * Get provider schedule
   */
  async getProviderSchedule(providerId: string, startDate: Date, endDate: Date): Promise<ProviderSchedule> {
    // Would query provider availability
    return {
      providerId,
      providerName: 'Dr. Martin',
      specialty: 'Néphrologie',
      availableSlots: this.generateAvailableSlots(startDate, endDate),
      timezone: 'Europe/Paris'
    };
  }

  /**
   * Book appointment slot
   */
  async bookSlot(
    providerId: string,
    patientId: string,
    slotDate: Date,
    startTime: string,
    reasonForVisit: string
  ): Promise<TeleconsultationSession> {
    // Check slot availability
    // Create session
    const scheduledAt = this.parseSlotDateTime(slotDate, startTime);

    return this.createSession({
      type: 'scheduled',
      patientId,
      patientName: 'Patient', // Would fetch from DB
      providerId,
      providerName: 'Provider', // Would fetch from DB
      scheduledAt,
      reasonForVisit,
      module: 'general'
    });
  }

  /**
   * Submit self-reported vitals
   */
  async submitVitals(sessionId: string, vitals: Omit<SelfReportedVitals, 'reportedAt'>): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.vitalsSelfReported = {
      ...vitals,
      reportedAt: new Date()
    };

    // Would update in database
  }

  /**
   * Add prescription during session
   */
  async addPrescription(
    sessionId: string,
    prescription: Omit<TelePrescription, 'id' | 'sentToPharmacy'>
  ): Promise<TelePrescription> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const newPrescription: TelePrescription = {
      id: `rx-${Date.now()}`,
      ...prescription,
      sentToPharmacy: false
    };

    session.prescriptions = session.prescriptions || [];
    session.prescriptions.push(newPrescription);

    // Would update in database
    return newPrescription;
  }

  /**
   * Send prescription to pharmacy
   */
  async sendToPharmacy(sessionId: string, prescriptionId: string, pharmacyId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const prescription = session.prescriptions?.find(p => p.id === prescriptionId);
    if (!prescription) throw new Error('Prescription not found');

    prescription.sentToPharmacy = true;
    prescription.pharmacyId = pharmacyId;

    // Would integrate with e-prescribing system
  }

  /**
   * Get patient teleconsultation history
   */
  async getPatientHistory(patientId: string): Promise<TeleconsultationSession[]> {
    // Would query database
    return [];
  }

  /**
   * Remote monitoring - register device
   */
  async registerDevice(data: Omit<RemoteMonitoringDevice, 'id' | 'status' | 'readings'>): Promise<RemoteMonitoringDevice> {
    return {
      id: `device-${Date.now()}`,
      ...data,
      status: 'active',
      readings: []
    };
  }

  /**
   * Remote monitoring - record reading
   */
  async recordDeviceReading(
    deviceId: string,
    reading: Omit<DeviceReading, 'id' | 'deviceId' | 'isAbnormal' | 'alertGenerated'>
  ): Promise<DeviceReading> {
    const deviceReading: DeviceReading = {
      id: `reading-${Date.now()}`,
      deviceId,
      ...reading,
      isAbnormal: this.checkIfAbnormal(reading.type, reading.value),
      alertGenerated: false
    };

    // Check if alert needed
    if (deviceReading.isAbnormal) {
      await this.generateAlert(deviceId, deviceReading);
      deviceReading.alertGenerated = true;
    }

    // Would save to database
    return deviceReading;
  }

  /**
   * Get device readings
   */
  async getDeviceReadings(
    deviceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DeviceReading[]> {
    // Would query database
    return [];
  }

  // =========================================================================
  // Private Helper Methods
  // =========================================================================

  private generateRoomUrl(): string {
    return `https://meet.perfex.io/room/${this.generateId()}`;
  }

  private generateRoomToken(): string {
    return `tok_${this.generateId()}_${Date.now()}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateAvailableSlots(startDate: Date, endDate: Date): ProviderSchedule['availableSlots'] {
    const slots: ProviderSchedule['availableSlots'] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      // Skip weekends
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        // Morning slots
        slots.push({
          date: new Date(current),
          startTime: '09:00',
          endTime: '09:30',
          isAvailable: true,
          consultationType: ['scheduled', 'follow_up']
        });
        slots.push({
          date: new Date(current),
          startTime: '09:30',
          endTime: '10:00',
          isAvailable: true,
          consultationType: ['scheduled', 'follow_up']
        });
        // Afternoon slots
        slots.push({
          date: new Date(current),
          startTime: '14:00',
          endTime: '14:30',
          isAvailable: true,
          consultationType: ['scheduled', 'follow_up']
        });
        slots.push({
          date: new Date(current),
          startTime: '14:30',
          endTime: '15:00',
          isAvailable: true,
          consultationType: ['scheduled', 'follow_up']
        });
      }
      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  private parseSlotDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private checkIfAbnormal(type: string, value: number): boolean {
    const thresholds: Record<string, { min: number; max: number }> = {
      'blood_pressure_systolic': { min: 90, max: 140 },
      'blood_pressure_diastolic': { min: 60, max: 90 },
      'heart_rate': { min: 60, max: 100 },
      'oxygen_saturation': { min: 95, max: 100 },
      'glucose': { min: 70, max: 140 },
      'temperature': { min: 36.0, max: 37.5 },
      'weight': { min: 30, max: 200 }
    };

    const threshold = thresholds[type];
    if (!threshold) return false;

    return value < threshold.min || value > threshold.max;
  }

  private async generateAlert(deviceId: string, reading: DeviceReading): Promise<void> {
    // Would create alert in alert system
    console.log(`Alert generated for device ${deviceId}: ${reading.type} = ${reading.value}`);
  }
}

export const telemedicineService = new TelemedicineService();
