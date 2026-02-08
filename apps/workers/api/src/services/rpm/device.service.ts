/**
 * RPM Device Service
 * Manage IoT devices for remote patient monitoring
 */

import { eq, and, desc, asc, like, or, sql, isNull } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import { iotDevices, iotDeviceEvents, healthcarePatients } from '@perfex/database';

// Types
export interface CreateDeviceInput {
  deviceNumber: string;
  serialNumber: string;
  imei?: string;
  macAddress?: string;
  deviceType: string;
  deviceSubtype?: string;
  manufacturer: string;
  model: string;
  firmwareVersion?: string;
  connectivityType: string;
  connectionDetails?: string;
  calibrationIntervalDays?: number;
  readingIntervalMinutes?: number;
  alertsEnabled?: boolean;
  deviceSettings?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  notes?: string;
}

export interface UpdateDeviceInput extends Partial<CreateDeviceInput> {
  status?: string;
  statusReason?: string;
  batteryLevel?: number;
  isOnline?: boolean;
}

export interface AssignDeviceInput {
  patientId: string;
}

export interface DeviceListOptions {
  status?: string;
  deviceType?: string;
  patientId?: string;
  unassigned?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IotDevice {
  id: string;
  organizationId: string;
  deviceNumber: string;
  serialNumber: string;
  imei: string | null;
  macAddress: string | null;
  deviceType: string;
  deviceSubtype: string | null;
  manufacturer: string;
  model: string;
  firmwareVersion: string | null;
  connectivityType: string;
  connectionDetails: string | null;
  lastConnectionAt: Date | null;
  isOnline: boolean;
  batteryLevel: number | null;
  batteryLastUpdated: Date | null;
  status: string;
  statusReason: string | null;
  assignedPatientId: string | null;
  assignedAt: Date | null;
  assignedBy: string | null;
  lastCalibrationDate: Date | null;
  nextCalibrationDate: Date | null;
  calibrationIntervalDays: number | null;
  readingIntervalMinutes: number;
  alertsEnabled: boolean;
  deviceSettings: string | null;
  purchaseDate: Date | null;
  warrantyExpiry: Date | null;
  lastMaintenanceDate: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DeviceService {
  /**
   * Create a new IoT device
   */
  async create(organizationId: string, userId: string, data: CreateDeviceInput): Promise<IotDevice> {
    const now = new Date();
    const deviceId = crypto.randomUUID();

    // Calculate next calibration date if interval provided
    let nextCalibrationDate: Date | null = null;
    if (data.calibrationIntervalDays) {
      nextCalibrationDate = new Date(now);
      nextCalibrationDate.setDate(nextCalibrationDate.getDate() + data.calibrationIntervalDays);
    }

    await drizzleDb.insert(iotDevices).values({
      id: deviceId,
      organizationId,
      deviceNumber: data.deviceNumber,
      serialNumber: data.serialNumber,
      imei: data.imei || null,
      macAddress: data.macAddress || null,
      deviceType: data.deviceType as any,
      deviceSubtype: data.deviceSubtype || null,
      manufacturer: data.manufacturer,
      model: data.model,
      firmwareVersion: data.firmwareVersion || null,
      connectivityType: data.connectivityType as any,
      connectionDetails: data.connectionDetails || null,
      lastConnectionAt: null,
      isOnline: false,
      batteryLevel: null,
      batteryLastUpdated: null,
      status: 'pending_activation',
      statusReason: null,
      assignedPatientId: null,
      assignedAt: null,
      assignedBy: null,
      lastCalibrationDate: now,
      nextCalibrationDate,
      calibrationIntervalDays: data.calibrationIntervalDays || null,
      readingIntervalMinutes: data.readingIntervalMinutes || 60,
      alertsEnabled: data.alertsEnabled !== false,
      deviceSettings: data.deviceSettings || null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      lastMaintenanceDate: null,
      notes: data.notes || null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const device = await this.getById(organizationId, deviceId);
    if (!device) {
      throw new Error('Failed to create device');
    }

    return device;
  }

  /**
   * Get device by ID
   */
  async getById(organizationId: string, deviceId: string): Promise<IotDevice | null> {
    const device = await drizzleDb
      .select()
      .from(iotDevices)
      .where(and(eq(iotDevices.id, deviceId), eq(iotDevices.organizationId, organizationId)))
      .get() as any;

    return device as IotDevice || null;
  }

  /**
   * Get device by serial number
   */
  async getBySerialNumber(organizationId: string, serialNumber: string): Promise<IotDevice | null> {
    const device = await drizzleDb
      .select()
      .from(iotDevices)
      .where(and(eq(iotDevices.serialNumber, serialNumber), eq(iotDevices.organizationId, organizationId)))
      .get() as any;

    return device as IotDevice || null;
  }

  /**
   * List devices with filters
   */
  async list(organizationId: string, options: DeviceListOptions = {}): Promise<{ devices: IotDevice[]; total: number }> {
    const { status, deviceType, patientId, unassigned, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build where conditions
    const conditions = [eq(iotDevices.organizationId, organizationId)];

    if (status) {
      conditions.push(eq(iotDevices.status, status as any));
    }

    if (deviceType) {
      conditions.push(eq(iotDevices.deviceType, deviceType as any));
    }

    if (patientId) {
      conditions.push(eq(iotDevices.assignedPatientId, patientId));
    }

    if (unassigned) {
      conditions.push(isNull(iotDevices.assignedPatientId));
    }

    if (search) {
      conditions.push(
        or(
          like(iotDevices.deviceNumber, `%${search}%`),
          like(iotDevices.serialNumber, `%${search}%`),
          like(iotDevices.manufacturer, `%${search}%`),
          like(iotDevices.model, `%${search}%`)
        )!
      );
    }

    // Count total
    const countResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(iotDevices)
      .where(and(...conditions))
      .get();

    const total = countResult?.count || 0;

    // Get paginated results
    const offset = (page - 1) * limit;
    const orderColumn = iotDevices[sortBy as keyof typeof iotDevices] || iotDevices.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const devices = await drizzleDb
      .select()
      .from(iotDevices)
      .where(and(...conditions))
      .orderBy(orderFn(orderColumn as any))
      .limit(limit)
      .offset(offset)
      .all() as any[];

    return { devices: devices as IotDevice[], total };
  }

  /**
   * Update a device
   */
  async update(organizationId: string, deviceId: string, userId: string, data: UpdateDeviceInput): Promise<IotDevice | null> {
    const existing = await this.getById(organizationId, deviceId);
    if (!existing) {
      return null;
    }

    const now = new Date();
    const updateData: any = { updatedAt: now };

    if (data.deviceNumber !== undefined) updateData.deviceNumber = data.deviceNumber;
    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
    if (data.imei !== undefined) updateData.imei = data.imei;
    if (data.macAddress !== undefined) updateData.macAddress = data.macAddress;
    if (data.deviceType !== undefined) updateData.deviceType = data.deviceType;
    if (data.deviceSubtype !== undefined) updateData.deviceSubtype = data.deviceSubtype;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.firmwareVersion !== undefined) updateData.firmwareVersion = data.firmwareVersion;
    if (data.connectivityType !== undefined) updateData.connectivityType = data.connectivityType;
    if (data.connectionDetails !== undefined) updateData.connectionDetails = data.connectionDetails;
    if (data.readingIntervalMinutes !== undefined) updateData.readingIntervalMinutes = data.readingIntervalMinutes;
    if (data.alertsEnabled !== undefined) updateData.alertsEnabled = data.alertsEnabled;
    if (data.deviceSettings !== undefined) updateData.deviceSettings = data.deviceSettings;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Handle status change
    if (data.status !== undefined && data.status !== existing.status) {
      updateData.status = data.status;
      updateData.statusReason = data.statusReason || null;

      // Log status change event
      await this.logEvent(organizationId, deviceId, 'status_change', {
        previousStatus: existing.status,
        newStatus: data.status,
        reason: data.statusReason,
      }, 'info');
    }

    // Handle battery update
    if (data.batteryLevel !== undefined) {
      updateData.batteryLevel = data.batteryLevel;
      updateData.batteryLastUpdated = now;

      // Check for low/critical battery
      if (data.batteryLevel <= 10) {
        await this.logEvent(organizationId, deviceId, 'battery_critical', { level: data.batteryLevel }, 'critical');
      } else if (data.batteryLevel <= 20) {
        await this.logEvent(organizationId, deviceId, 'battery_low', { level: data.batteryLevel }, 'warning');
      }
    }

    // Handle online status
    if (data.isOnline !== undefined) {
      updateData.isOnline = data.isOnline;
      updateData.lastConnectionAt = data.isOnline ? now : existing.lastConnectionAt;

      await this.logEvent(
        organizationId,
        deviceId,
        data.isOnline ? 'connected' : 'disconnected',
        {},
        'info'
      );
    }

    await drizzleDb
      .update(iotDevices)
      .set(updateData)
      .where(and(eq(iotDevices.id, deviceId), eq(iotDevices.organizationId, organizationId)));

    return this.getById(organizationId, deviceId);
  }

  /**
   * Assign device to patient
   */
  async assignToPatient(organizationId: string, deviceId: string, userId: string, patientId: string): Promise<IotDevice | null> {
    const device = await this.getById(organizationId, deviceId);
    if (!device) {
      return null;
    }

    // Verify patient exists
    const patient = await drizzleDb
      .select()
      .from(healthcarePatients)
      .where(and(eq(healthcarePatients.id, patientId), eq(healthcarePatients.companyId, organizationId)))
      .get();

    if (!patient) {
      throw new Error('Patient not found');
    }

    const now = new Date();
    const previousPatientId = device.assignedPatientId;

    await drizzleDb
      .update(iotDevices)
      .set({
        assignedPatientId: patientId,
        assignedAt: now,
        assignedBy: userId,
        status: 'active',
        updatedAt: now,
      })
      .where(and(eq(iotDevices.id, deviceId), eq(iotDevices.organizationId, organizationId)));

    // Log assignment event
    await this.logEvent(organizationId, deviceId, 'assigned', {
      patientId,
      previousPatientId,
    }, 'info');

    return this.getById(organizationId, deviceId);
  }

  /**
   * Unassign device from patient
   */
  async unassignFromPatient(organizationId: string, deviceId: string, userId: string): Promise<IotDevice | null> {
    const device = await this.getById(organizationId, deviceId);
    if (!device) {
      return null;
    }

    const now = new Date();
    const previousPatientId = device.assignedPatientId;

    await drizzleDb
      .update(iotDevices)
      .set({
        assignedPatientId: null,
        assignedAt: null,
        assignedBy: null,
        status: 'inactive',
        updatedAt: now,
      })
      .where(and(eq(iotDevices.id, deviceId), eq(iotDevices.organizationId, organizationId)));

    // Log unassignment event
    await this.logEvent(organizationId, deviceId, 'unassigned', {
      previousPatientId,
    }, 'info');

    return this.getById(organizationId, deviceId);
  }

  /**
   * Mark device for maintenance
   */
  async setMaintenance(organizationId: string, deviceId: string, userId: string, reason: string): Promise<IotDevice | null> {
    const device = await this.getById(organizationId, deviceId);
    if (!device) {
      return null;
    }

    const now = new Date();

    await drizzleDb
      .update(iotDevices)
      .set({
        status: 'maintenance',
        statusReason: reason,
        lastMaintenanceDate: now,
        updatedAt: now,
      })
      .where(and(eq(iotDevices.id, deviceId), eq(iotDevices.organizationId, organizationId)));

    await this.logEvent(organizationId, deviceId, 'maintenance', { reason }, 'info');

    return this.getById(organizationId, deviceId);
  }

  /**
   * Update device calibration
   */
  async updateCalibration(organizationId: string, deviceId: string, userId: string): Promise<IotDevice | null> {
    const device = await this.getById(organizationId, deviceId);
    if (!device) {
      return null;
    }

    const now = new Date();
    let nextCalibrationDate: Date | null = null;

    if (device.calibrationIntervalDays) {
      nextCalibrationDate = new Date(now);
      nextCalibrationDate.setDate(nextCalibrationDate.getDate() + device.calibrationIntervalDays);
    }

    await drizzleDb
      .update(iotDevices)
      .set({
        lastCalibrationDate: now,
        nextCalibrationDate,
        updatedAt: now,
      })
      .where(and(eq(iotDevices.id, deviceId), eq(iotDevices.organizationId, organizationId)));

    return this.getById(organizationId, deviceId);
  }

  /**
   * Log device event
   */
  async logEvent(
    organizationId: string,
    deviceId: string,
    eventType: string,
    eventData: any,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): Promise<void> {
    await drizzleDb.insert(iotDeviceEvents).values({
      id: crypto.randomUUID(),
      organizationId,
      deviceId,
      eventType: eventType as any,
      eventAt: new Date(),
      eventData: JSON.stringify(eventData),
      previousValue: eventData.previousValue || null,
      newValue: eventData.newValue || null,
      severity: severity as any,
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      createdAt: new Date(),
    });
  }

  /**
   * Get device events
   */
  async getDeviceEvents(
    organizationId: string,
    deviceId: string,
    limit: number = 50
  ): Promise<any[]> {
    const events = await drizzleDb
      .select()
      .from(iotDeviceEvents)
      .where(and(
        eq(iotDeviceEvents.deviceId, deviceId),
        eq(iotDeviceEvents.organizationId, organizationId)
      ))
      .orderBy(desc(iotDeviceEvents.eventAt))
      .limit(limit)
      .all();

    return events;
  }

  /**
   * Delete device (soft delete by setting status to retired)
   */
  async delete(organizationId: string, deviceId: string, userId: string): Promise<boolean> {
    const device = await this.getById(organizationId, deviceId);
    if (!device) {
      return false;
    }

    await drizzleDb
      .update(iotDevices)
      .set({
        status: 'retired',
        statusReason: 'Device retired',
        assignedPatientId: null,
        assignedAt: null,
        assignedBy: null,
        updatedAt: new Date(),
      })
      .where(and(eq(iotDevices.id, deviceId), eq(iotDevices.organizationId, organizationId)));

    return true;
  }

  /**
   * Get devices needing calibration
   */
  async getDevicesNeedingCalibration(organizationId: string): Promise<IotDevice[]> {
    const now = new Date();

    const devices = await drizzleDb
      .select()
      .from(iotDevices)
      .where(and(
        eq(iotDevices.organizationId, organizationId),
        eq(iotDevices.status, 'active'),
        sql`${iotDevices.nextCalibrationDate} <= ${now.getTime()}`
      ))
      .all() as any[];

    return devices as IotDevice[];
  }

  /**
   * Get offline devices
   */
  async getOfflineDevices(organizationId: string, hoursOffline: number = 24): Promise<IotDevice[]> {
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - hoursOffline);

    const devices = await drizzleDb
      .select()
      .from(iotDevices)
      .where(and(
        eq(iotDevices.organizationId, organizationId),
        eq(iotDevices.status, 'active'),
        sql`${iotDevices.lastConnectionAt} < ${threshold.getTime()}`
      ))
      .all() as any[];

    return devices as IotDevice[];
  }

  /**
   * Get low battery devices
   */
  async getLowBatteryDevices(organizationId: string, threshold: number = 20): Promise<IotDevice[]> {
    const devices = await drizzleDb
      .select()
      .from(iotDevices)
      .where(and(
        eq(iotDevices.organizationId, organizationId),
        eq(iotDevices.status, 'active'),
        sql`${iotDevices.batteryLevel} <= ${threshold}`
      ))
      .all() as any[];

    return devices as IotDevice[];
  }
}

export const deviceService = new DeviceService();
