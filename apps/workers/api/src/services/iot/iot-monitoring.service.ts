/**
 * IoT & Real-Time Monitoring Service
 * Intégration IoT & Monitoring Temps Réel
 * Gestion des appareils connectés et surveillance continue
 */

// Types
export interface MedicalDevice {
  id: string;
  deviceId: string;
  type: DeviceType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  patientId?: string;
  patientName?: string;
  locationId?: string;
  locationName?: string;
  status: 'online' | 'offline' | 'error' | 'maintenance' | 'calibrating';
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen: string;
  lastDataReceived?: string;
  configuration: DeviceConfiguration;
  alerts: DeviceAlert[];
  metadata: Record<string, unknown>;
  registeredAt: string;
  activatedAt?: string;
}

export type DeviceType =
  | 'vital_signs_monitor'
  | 'glucose_monitor'
  | 'blood_pressure_monitor'
  | 'pulse_oximeter'
  | 'ecg_monitor'
  | 'weight_scale'
  | 'activity_tracker'
  | 'sleep_monitor'
  | 'infusion_pump'
  | 'ventilator'
  | 'dialysis_machine'
  | 'pacemaker'
  | 'implantable_defibrillator'
  | 'cgm'
  | 'insulin_pump'
  | 'holter_monitor'
  | 'apnea_monitor'
  | 'temperature_sensor'
  | 'fall_detector'
  | 'medication_dispenser';

export interface DeviceConfiguration {
  measurementInterval?: number; // seconds
  alertThresholds?: AlertThreshold[];
  transmissionMode: 'realtime' | 'batch' | 'on_change';
  dataRetentionDays: number;
  encryptionEnabled: boolean;
  autoAlertEnabled: boolean;
  calibrationInterval?: number; // days
  nextCalibration?: string;
}

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'between' | 'outside';
  value?: number;
  range?: [number, number];
  severity: 'info' | 'warning' | 'critical';
  message: string;
  autoNotify: boolean;
  escalationMinutes?: number;
}

export interface DeviceAlert {
  id: string;
  timestamp: string;
  type: 'threshold' | 'device_error' | 'battery_low' | 'connection_lost' | 'calibration_needed';
  severity: 'info' | 'warning' | 'critical';
  metric?: string;
  value?: number;
  threshold?: number;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  escalated: boolean;
  escalatedTo?: string[];
}

export interface VitalReading {
  id: string;
  deviceId: string;
  patientId: string;
  timestamp: string;
  readings: VitalValue[];
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  source: 'device' | 'manual' | 'derived';
  validated: boolean;
  validatedBy?: string;
  notes?: string;
}

export interface VitalValue {
  type: VitalType;
  value: number;
  unit: string;
  abnormal?: boolean;
  trend?: 'rising' | 'falling' | 'stable';
}

export type VitalType =
  | 'heart_rate'
  | 'systolic_bp'
  | 'diastolic_bp'
  | 'mean_arterial_pressure'
  | 'respiratory_rate'
  | 'spo2'
  | 'temperature'
  | 'blood_glucose'
  | 'weight'
  | 'bmi'
  | 'steps'
  | 'calories'
  | 'sleep_hours'
  | 'sleep_quality'
  | 'etco2'
  | 'fio2'
  | 'pip'
  | 'peep'
  | 'tidal_volume';

export interface WaveformData {
  id: string;
  deviceId: string;
  patientId: string;
  type: 'ecg' | 'ppg' | 'resp' | 'abp' | 'cvp' | 'eeg';
  samplingRate: number;
  startTime: string;
  duration: number;
  channels: number;
  data: number[][];
  annotations?: WaveformAnnotation[];
}

export interface WaveformAnnotation {
  timestamp: number;
  type: string;
  label: string;
  channel?: number;
  automated: boolean;
}

export interface MonitoringSession {
  id: string;
  patientId: string;
  patientName: string;
  deviceIds: string[];
  startTime: string;
  endTime?: string;
  status: 'active' | 'paused' | 'completed';
  reason: string;
  careTeam: CareTeamMember[];
  alerts: DeviceAlert[];
  readings: VitalReading[];
  escalationPolicy: EscalationPolicy;
  notes: SessionNote[];
}

export interface CareTeamMember {
  userId: string;
  name: string;
  role: 'physician' | 'nurse' | 'technician' | 'specialist';
  notificationPreferences: {
    channels: ('sms' | 'email' | 'push' | 'pager')[];
    criticalOnly: boolean;
    quietHours?: { start: string; end: string };
  };
}

export interface EscalationPolicy {
  id: string;
  name: string;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  order: number;
  delayMinutes: number;
  recipients: string[];
  channels: ('sms' | 'email' | 'push' | 'pager' | 'call')[];
  requiredAcknowledgement: boolean;
}

export interface SessionNote {
  id: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  content: string;
  attachedReadingId?: string;
}

export interface RemotePatientMonitoring {
  patientId: string;
  patientName: string;
  program: string;
  enrolledAt: string;
  devices: {
    deviceId: string;
    type: DeviceType;
    status: 'active' | 'inactive';
  }[];
  compliance: {
    targetReadingsPerDay: number;
    actualReadingsLast7Days: number;
    complianceRate: number;
    lastReading?: string;
  };
  recentAlerts: DeviceAlert[];
  trends: {
    metric: string;
    direction: 'improving' | 'stable' | 'worsening';
    averageValue: number;
    changePercent: number;
  }[];
  nextReview: string;
  careCoordinator: string;
}

// Mock devices
const devices: MedicalDevice[] = [
  {
    id: 'dev-001',
    deviceId: 'BP-2024-001234',
    type: 'blood_pressure_monitor',
    manufacturer: 'Omron',
    model: 'M7 Intelli IT',
    serialNumber: 'SN123456789',
    firmwareVersion: '2.3.1',
    patientId: 'pat-001',
    patientName: 'Marie Dupont',
    status: 'online',
    batteryLevel: 85,
    signalStrength: -45,
    lastSeen: new Date().toISOString(),
    lastDataReceived: new Date().toISOString(),
    configuration: {
      measurementInterval: 28800, // 8 hours
      alertThresholds: [
        { metric: 'systolic_bp', operator: 'gt', value: 180, severity: 'critical', message: 'Hypertension sévère', autoNotify: true, escalationMinutes: 5 },
        { metric: 'systolic_bp', operator: 'gt', value: 140, severity: 'warning', message: 'Tension élevée', autoNotify: true },
        { metric: 'diastolic_bp', operator: 'gt', value: 110, severity: 'critical', message: 'Diastolique sévère', autoNotify: true }
      ],
      transmissionMode: 'on_change',
      dataRetentionDays: 365,
      encryptionEnabled: true,
      autoAlertEnabled: true
    },
    alerts: [],
    metadata: { color: 'white', connectivity: 'bluetooth' },
    registeredAt: '2024-01-01T00:00:00Z',
    activatedAt: '2024-01-02T10:00:00Z'
  },
  {
    id: 'dev-002',
    deviceId: 'CGM-2024-005678',
    type: 'cgm',
    manufacturer: 'Dexcom',
    model: 'G7',
    serialNumber: 'SN987654321',
    firmwareVersion: '1.5.0',
    patientId: 'pat-002',
    patientName: 'Pierre Martin',
    status: 'online',
    batteryLevel: 72,
    signalStrength: -52,
    lastSeen: new Date().toISOString(),
    lastDataReceived: new Date().toISOString(),
    configuration: {
      measurementInterval: 300, // 5 minutes
      alertThresholds: [
        { metric: 'blood_glucose', operator: 'gt', value: 250, severity: 'critical', message: 'Hyperglycémie sévère', autoNotify: true, escalationMinutes: 10 },
        { metric: 'blood_glucose', operator: 'lt', value: 70, severity: 'critical', message: 'Hypoglycémie', autoNotify: true, escalationMinutes: 5 },
        { metric: 'blood_glucose', operator: 'gt', value: 180, severity: 'warning', message: 'Glycémie élevée', autoNotify: true },
        { metric: 'blood_glucose', operator: 'lt', value: 90, severity: 'info', message: 'Glycémie basse', autoNotify: false }
      ],
      transmissionMode: 'realtime',
      dataRetentionDays: 90,
      encryptionEnabled: true,
      autoAlertEnabled: true,
      calibrationInterval: 1
    },
    alerts: [],
    metadata: { sensorExpiry: '2024-01-20', wearLocation: 'arm' },
    registeredAt: '2024-01-05T00:00:00Z',
    activatedAt: '2024-01-05T08:00:00Z'
  }
];

const monitoringSessions: MonitoringSession[] = [];
const vitalReadings: VitalReading[] = [];
const rpmPrograms: RemotePatientMonitoring[] = [];

export class IoTMonitoringService {

  // Register new device
  async registerDevice(data: {
    deviceId: string;
    type: DeviceType;
    manufacturer: string;
    model: string;
    serialNumber: string;
    firmwareVersion: string;
    configuration?: Partial<DeviceConfiguration>;
    metadata?: Record<string, unknown>;
  }): Promise<MedicalDevice> {
    const device: MedicalDevice = {
      id: `dev-${Date.now()}`,
      deviceId: data.deviceId,
      type: data.type,
      manufacturer: data.manufacturer,
      model: data.model,
      serialNumber: data.serialNumber,
      firmwareVersion: data.firmwareVersion,
      status: 'offline',
      lastSeen: new Date().toISOString(),
      configuration: {
        transmissionMode: 'on_change',
        dataRetentionDays: 365,
        encryptionEnabled: true,
        autoAlertEnabled: true,
        ...data.configuration
      },
      alerts: [],
      metadata: data.metadata || {},
      registeredAt: new Date().toISOString()
    };

    devices.push(device);
    return device;
  }

  // Assign device to patient
  async assignToPatient(deviceId: string, data: {
    patientId: string;
    patientName: string;
  }): Promise<MedicalDevice> {
    const device = devices.find(d => d.id === deviceId);
    if (!device) throw new Error('Device not found');

    device.patientId = data.patientId;
    device.patientName = data.patientName;
    device.activatedAt = new Date().toISOString();
    device.status = 'online';

    return device;
  }

  // Get device by ID
  getDevice(deviceId: string): MedicalDevice | undefined {
    return devices.find(d => d.id === deviceId);
  }

  // Get patient's devices
  getPatientDevices(patientId: string): MedicalDevice[] {
    return devices.filter(d => d.patientId === patientId);
  }

  // Update device configuration
  async updateConfiguration(deviceId: string, config: Partial<DeviceConfiguration>): Promise<MedicalDevice> {
    const device = devices.find(d => d.id === deviceId);
    if (!device) throw new Error('Device not found');

    device.configuration = { ...device.configuration, ...config };
    return device;
  }

  // Receive vital reading from device
  async receiveReading(data: {
    deviceId: string;
    timestamp: string;
    readings: VitalValue[];
    quality?: VitalReading['quality'];
  }): Promise<{ reading: VitalReading; alerts: DeviceAlert[] }> {
    const device = devices.find(d => d.deviceId === data.deviceId || d.id === data.deviceId);
    if (!device) throw new Error('Device not found');

    if (!device.patientId) throw new Error('Device not assigned to patient');

    // Update device status
    device.status = 'online';
    device.lastSeen = new Date().toISOString();
    device.lastDataReceived = data.timestamp;

    const reading: VitalReading = {
      id: `reading-${Date.now()}`,
      deviceId: device.id,
      patientId: device.patientId,
      timestamp: data.timestamp,
      readings: data.readings,
      quality: data.quality || 'good',
      source: 'device',
      validated: false
    };

    vitalReadings.push(reading);

    // Check thresholds and generate alerts
    const alerts = this.checkThresholds(device, reading);

    return { reading, alerts };
  }

  // Check thresholds and generate alerts
  private checkThresholds(device: MedicalDevice, reading: VitalReading): DeviceAlert[] {
    const alerts: DeviceAlert[] = [];
    const thresholds = device.configuration.alertThresholds || [];

    for (const vital of reading.readings) {
      for (const threshold of thresholds) {
        if (threshold.metric !== vital.type) continue;

        let triggered = false;
        switch (threshold.operator) {
          case 'gt':
            triggered = vital.value > (threshold.value || 0);
            break;
          case 'lt':
            triggered = vital.value < (threshold.value || 0);
            break;
          case 'eq':
            triggered = vital.value === threshold.value;
            break;
          case 'between':
            triggered = threshold.range
              ? vital.value >= threshold.range[0] && vital.value <= threshold.range[1]
              : false;
            break;
          case 'outside':
            triggered = threshold.range
              ? vital.value < threshold.range[0] || vital.value > threshold.range[1]
              : false;
            break;
        }

        if (triggered) {
          const alert: DeviceAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            timestamp: new Date().toISOString(),
            type: 'threshold',
            severity: threshold.severity,
            metric: vital.type,
            value: vital.value,
            threshold: threshold.value,
            message: threshold.message,
            acknowledged: false,
            resolved: false,
            escalated: false
          };

          device.alerts.push(alert);
          alerts.push(alert);

          // Auto-notify if configured
          if (threshold.autoNotify && device.configuration.autoAlertEnabled) {
            this.notifyAlert(device, alert);
          }
        }
      }
    }

    return alerts;
  }

  // Acknowledge alert
  async acknowledgeAlert(deviceId: string, alertId: string, userId: string): Promise<DeviceAlert> {
    const device = devices.find(d => d.id === deviceId);
    if (!device) throw new Error('Device not found');

    const alert = device.alerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date().toISOString();

    return alert;
  }

  // Resolve alert
  async resolveAlert(deviceId: string, alertId: string): Promise<DeviceAlert> {
    const device = devices.find(d => d.id === deviceId);
    if (!device) throw new Error('Device not found');

    const alert = device.alerts.find(a => a.id === alertId);
    if (!alert) throw new Error('Alert not found');

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();

    return alert;
  }

  // Start monitoring session
  async startSession(data: {
    patientId: string;
    patientName: string;
    deviceIds: string[];
    reason: string;
    careTeam: CareTeamMember[];
    escalationPolicy: EscalationPolicy;
  }): Promise<MonitoringSession> {
    const session: MonitoringSession = {
      id: `session-${Date.now()}`,
      patientId: data.patientId,
      patientName: data.patientName,
      deviceIds: data.deviceIds,
      startTime: new Date().toISOString(),
      status: 'active',
      reason: data.reason,
      careTeam: data.careTeam,
      alerts: [],
      readings: [],
      escalationPolicy: data.escalationPolicy,
      notes: []
    };

    monitoringSessions.push(session);
    return session;
  }

  // Get active session for patient
  getActiveSession(patientId: string): MonitoringSession | undefined {
    return monitoringSessions.find(
      s => s.patientId === patientId && s.status === 'active'
    );
  }

  // End monitoring session
  async endSession(sessionId: string): Promise<MonitoringSession> {
    const session = monitoringSessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    session.status = 'completed';
    session.endTime = new Date().toISOString();

    return session;
  }

  // Get vital readings for patient
  getPatientReadings(patientId: string, options?: {
    fromDate?: string;
    toDate?: string;
    vitalType?: VitalType;
    limit?: number;
  }): VitalReading[] {
    let results = vitalReadings.filter(r => r.patientId === patientId);

    if (options?.fromDate) {
      results = results.filter(r => r.timestamp >= options.fromDate!);
    }

    if (options?.toDate) {
      results = results.filter(r => r.timestamp <= options.toDate!);
    }

    if (options?.vitalType) {
      results = results.filter(r =>
        r.readings.some(v => v.type === options.vitalType)
      );
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return options?.limit ? results.slice(0, options.limit) : results;
  }

  // Get vital trends
  getVitalTrends(patientId: string, vitalType: VitalType, days: number = 30): {
    dataPoints: { timestamp: string; value: number }[];
    average: number;
    min: number;
    max: number;
    trend: 'rising' | 'falling' | 'stable';
    changePercent: number;
  } {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const readings = this.getPatientReadings(patientId, {
      fromDate: fromDate.toISOString(),
      vitalType
    });

    const values = readings.flatMap(r =>
      r.readings.filter(v => v.type === vitalType).map(v => ({
        timestamp: r.timestamp,
        value: v.value
      }))
    );

    if (values.length === 0) {
      return {
        dataPoints: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
        changePercent: 0
      };
    }

    const nums = values.map(v => v.value);
    const average = nums.reduce((a, b) => a + b, 0) / nums.length;
    const min = Math.min(...nums);
    const max = Math.max(...nums);

    // Calculate trend
    const firstHalf = nums.slice(0, Math.floor(nums.length / 2));
    const secondHalf = nums.slice(Math.floor(nums.length / 2));
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;

    const changePercent = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    const trend = Math.abs(changePercent) < 5 ? 'stable' : changePercent > 0 ? 'rising' : 'falling';

    return {
      dataPoints: values,
      average: Math.round(average * 100) / 100,
      min,
      max,
      trend,
      changePercent: Math.round(changePercent * 10) / 10
    };
  }

  // Enroll in RPM program
  async enrollInRPM(data: {
    patientId: string;
    patientName: string;
    program: string;
    devices: { deviceId: string; type: DeviceType }[];
    targetReadingsPerDay: number;
    careCoordinator: string;
  }): Promise<RemotePatientMonitoring> {
    const rpm: RemotePatientMonitoring = {
      patientId: data.patientId,
      patientName: data.patientName,
      program: data.program,
      enrolledAt: new Date().toISOString(),
      devices: data.devices.map(d => ({ ...d, status: 'active' as const })),
      compliance: {
        targetReadingsPerDay: data.targetReadingsPerDay,
        actualReadingsLast7Days: 0,
        complianceRate: 0
      },
      recentAlerts: [],
      trends: [],
      nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      careCoordinator: data.careCoordinator
    };

    rpmPrograms.push(rpm);
    return rpm;
  }

  // Get RPM dashboard
  getRPMDashboard(careCoordinatorId?: string): {
    totalPatients: number;
    activePatients: number;
    alertsToday: number;
    criticalAlerts: number;
    lowCompliance: number;
    patientList: {
      patientId: string;
      patientName: string;
      complianceRate: number;
      lastReading: string;
      alertCount: number;
      status: 'good' | 'attention' | 'critical';
    }[];
  } {
    let programs = [...rpmPrograms];
    if (careCoordinatorId) {
      programs = programs.filter(p => p.careCoordinator === careCoordinatorId);
    }

    const today = new Date().toISOString().split('T')[0];

    return {
      totalPatients: programs.length,
      activePatients: programs.filter(p => p.devices.some(d => d.status === 'active')).length,
      alertsToday: programs.reduce((sum, p) =>
        sum + p.recentAlerts.filter(a => a.timestamp.startsWith(today)).length, 0
      ),
      criticalAlerts: programs.reduce((sum, p) =>
        sum + p.recentAlerts.filter(a => a.severity === 'critical' && !a.acknowledged).length, 0
      ),
      lowCompliance: programs.filter(p => p.compliance.complianceRate < 0.7).length,
      patientList: programs.map(p => ({
        patientId: p.patientId,
        patientName: p.patientName,
        complianceRate: p.compliance.complianceRate,
        lastReading: p.compliance.lastReading || 'N/A',
        alertCount: p.recentAlerts.filter(a => !a.acknowledged).length,
        status: this.getPatientStatus(p)
      }))
    };
  }

  // Get device dashboard
  getDeviceDashboard(): {
    totalDevices: number;
    online: number;
    offline: number;
    error: number;
    lowBattery: number;
    needsCalibration: number;
    byType: { type: string; count: number }[];
  } {
    const today = new Date();

    return {
      totalDevices: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      error: devices.filter(d => d.status === 'error').length,
      lowBattery: devices.filter(d => (d.batteryLevel || 100) < 20).length,
      needsCalibration: devices.filter(d =>
        d.configuration.nextCalibration && new Date(d.configuration.nextCalibration) < today
      ).length,
      byType: Object.entries(
        devices.reduce((acc, d) => {
          acc[d.type] = (acc[d.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([type, count]) => ({ type, count }))
    };
  }

  // Helper methods
  private getPatientStatus(rpm: RemotePatientMonitoring): 'good' | 'attention' | 'critical' {
    if (rpm.recentAlerts.some(a => a.severity === 'critical' && !a.acknowledged)) {
      return 'critical';
    }
    if (rpm.compliance.complianceRate < 0.5 || rpm.recentAlerts.some(a => !a.acknowledged)) {
      return 'attention';
    }
    return 'good';
  }

  private async notifyAlert(_device: MedicalDevice, alert: DeviceAlert): Promise<void> {
    console.log(`[IoT] Alert notification: ${alert.message} (${alert.severity})`);
  }
}
