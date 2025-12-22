/**
 * Dialyse Machine Service
 * Manage dialysis machines and maintenance
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import { dialysisMachines, machineMaintenanceRecords } from '@perfex/database';
import type {
  DialysisMachine,
  DialysisMachineWithMaintenance,
  MachineMaintenanceRecord,
  CreateMachineInput,
  UpdateMachineInput,
  CreateMaintenanceRecordInput,
  UpdateMaintenanceRecordInput,
} from '@perfex/shared';

export class MachineService {
  /**
   * Create a new machine
   */
  async create(organizationId: string, userId: string, data: CreateMachineInput): Promise<DialysisMachine> {
    const now = new Date();
    const machineId = crypto.randomUUID();

    await drizzleDb.insert(dialysisMachines).values({
      id: machineId,
      organizationId,
      warehouseId: data.warehouseId || null,
      machineNumber: data.machineNumber,
      model: data.model,
      manufacturer: data.manufacturer || null,
      serialNumber: data.serialNumber || null,
      status: data.status || 'available',
      isolationOnly: data.isolationOnly || false,
      location: data.location || null,
      totalHours: 0,
      totalSessions: 0,
      installationDate: data.installationDate ? new Date(data.installationDate) : null,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      notes: data.notes || null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const machine = await this.getById(organizationId, machineId);
    if (!machine) {
      throw new Error('Failed to create machine');
    }

    return machine;
  }

  /**
   * Get machine by ID
   */
  async getById(organizationId: string, machineId: string): Promise<DialysisMachine | null> {
    const machine = await drizzleDb
      .select()
      .from(dialysisMachines)
      .where(and(eq(dialysisMachines.id, machineId), eq(dialysisMachines.organizationId, organizationId)))
      .get();

    return machine as DialysisMachine || null;
  }

  /**
   * Get machine with maintenance records
   */
  async getByIdWithMaintenance(organizationId: string, machineId: string): Promise<DialysisMachineWithMaintenance | null> {
    const machine = await this.getById(organizationId, machineId);
    if (!machine) {
      return null;
    }

    const maintenanceRecords = await drizzleDb
      .select()
      .from(machineMaintenanceRecords)
      .where(
        and(
          eq(machineMaintenanceRecords.machineId, machineId),
          eq(machineMaintenanceRecords.organizationId, organizationId)
        )
      )
      .orderBy(desc(machineMaintenanceRecords.createdAt))
      .all();

    return {
      ...machine,
      maintenanceRecords: maintenanceRecords as MachineMaintenanceRecord[],
    };
  }

  /**
   * List all machines
   */
  async list(
    organizationId: string,
    filters?: { status?: string; isolationOnly?: boolean; limit?: number; offset?: number }
  ): Promise<{ data: DialysisMachine[]; total: number }> {
    const { status, isolationOnly, limit = 50, offset = 0 } = filters || {};

    const conditions = [eq(dialysisMachines.organizationId, organizationId)];
    if (status) {
      conditions.push(eq(dialysisMachines.status, status as any));
    }
    if (isolationOnly !== undefined) {
      conditions.push(eq(dialysisMachines.isolationOnly, isolationOnly));
    }

    const machines = await drizzleDb
      .select()
      .from(dialysisMachines)
      .where(and(...conditions))
      .orderBy(dialysisMachines.machineNumber)
      .limit(limit)
      .offset(offset)
      .all();

    const countResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(dialysisMachines)
      .where(and(...conditions))
      .get();

    return {
      data: machines as DialysisMachine[],
      total: countResult?.count || 0,
    };
  }

  /**
   * Get available machines for a session
   */
  async getAvailable(organizationId: string, requiresIsolation: boolean = false): Promise<DialysisMachine[]> {
    const conditions = [
      eq(dialysisMachines.organizationId, organizationId),
      eq(dialysisMachines.status, 'available'),
    ];

    // If patient requires isolation, only show isolation machines
    // If patient doesn't require isolation, exclude isolation-only machines
    if (requiresIsolation) {
      conditions.push(eq(dialysisMachines.isolationOnly, true));
    } else {
      conditions.push(eq(dialysisMachines.isolationOnly, false));
    }

    const machines = await drizzleDb
      .select()
      .from(dialysisMachines)
      .where(and(...conditions))
      .orderBy(dialysisMachines.machineNumber)
      .all();

    return machines as DialysisMachine[];
  }

  /**
   * Update machine
   */
  async update(organizationId: string, machineId: string, data: UpdateMachineInput): Promise<DialysisMachine> {
    const existing = await this.getById(organizationId, machineId);
    if (!existing) {
      throw new Error('Machine not found');
    }

    const now = new Date();
    const updateData: any = { updatedAt: now };

    if (data.machineNumber !== undefined) updateData.machineNumber = data.machineNumber;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
    if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber;
    if (data.warehouseId !== undefined) updateData.warehouseId = data.warehouseId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isolationOnly !== undefined) updateData.isolationOnly = data.isolationOnly;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.installationDate !== undefined) updateData.installationDate = data.installationDate ? new Date(data.installationDate) : null;
    if (data.lastMaintenanceDate !== undefined) updateData.lastMaintenanceDate = data.lastMaintenanceDate ? new Date(data.lastMaintenanceDate) : null;
    if (data.nextMaintenanceDate !== undefined) updateData.nextMaintenanceDate = data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null;
    if (data.warrantyExpiry !== undefined) updateData.warrantyExpiry = data.warrantyExpiry ? new Date(data.warrantyExpiry) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await drizzleDb
      .update(dialysisMachines)
      .set(updateData)
      .where(and(eq(dialysisMachines.id, machineId), eq(dialysisMachines.organizationId, organizationId)));

    const updated = await this.getById(organizationId, machineId);
    if (!updated) {
      throw new Error('Failed to update machine');
    }

    return updated;
  }

  /**
   * Update machine counters after session
   */
  async updateCounters(organizationId: string, machineId: string, durationMinutes: number): Promise<void> {
    const existing = await this.getById(organizationId, machineId);
    if (!existing) {
      throw new Error('Machine not found');
    }

    const hoursToAdd = Math.round(durationMinutes / 60 * 10) / 10; // Round to 1 decimal

    await drizzleDb
      .update(dialysisMachines)
      .set({
        totalHours: (existing.totalHours || 0) + hoursToAdd,
        totalSessions: (existing.totalSessions || 0) + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(dialysisMachines.id, machineId), eq(dialysisMachines.organizationId, organizationId)));
  }

  /**
   * Delete machine
   */
  async delete(organizationId: string, machineId: string): Promise<void> {
    const existing = await this.getById(organizationId, machineId);
    if (!existing) {
      throw new Error('Machine not found');
    }

    await drizzleDb
      .delete(dialysisMachines)
      .where(and(eq(dialysisMachines.id, machineId), eq(dialysisMachines.organizationId, organizationId)));
  }

  /**
   * Get machine statistics
   */
  async getStats(organizationId: string): Promise<{
    totalMachines: number;
    availableMachines: number;
    inUseMachines: number;
    maintenanceMachines: number;
    outOfServiceMachines: number;
    isolationMachines: number;
  }> {
    const machines = await drizzleDb
      .select()
      .from(dialysisMachines)
      .where(eq(dialysisMachines.organizationId, organizationId))
      .all();

    return {
      totalMachines: machines.length,
      availableMachines: machines.filter((m) => m.status === 'available').length,
      inUseMachines: machines.filter((m) => m.status === 'in_use').length,
      maintenanceMachines: machines.filter((m) => m.status === 'maintenance').length,
      outOfServiceMachines: machines.filter((m) => m.status === 'out_of_service').length,
      isolationMachines: machines.filter((m) => m.isolationOnly).length,
    };
  }

  // ============================================================================
  // MAINTENANCE RECORDS
  // ============================================================================

  /**
   * Create maintenance record
   */
  async createMaintenance(organizationId: string, userId: string, data: CreateMaintenanceRecordInput): Promise<MachineMaintenanceRecord> {
    const now = new Date();
    const maintenanceId = crypto.randomUUID();

    // Verify machine exists
    const machine = await this.getById(organizationId, data.machineId);
    if (!machine) {
      throw new Error('Machine not found');
    }

    // Generate maintenance number
    const countResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(machineMaintenanceRecords)
      .where(eq(machineMaintenanceRecords.organizationId, organizationId))
      .get();
    const count = (countResult?.count || 0) + 1;
    const maintenanceNumber = `MNT-${now.getFullYear()}-${String(count).padStart(5, '0')}`;

    await drizzleDb.insert(machineMaintenanceRecords).values({
      id: maintenanceId,
      organizationId,
      machineId: data.machineId,
      maintenanceNumber,
      type: data.type,
      status: 'scheduled',
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      description: data.description || null,
      vendor: data.vendor || null,
      notes: data.notes || null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const maintenance = await this.getMaintenanceById(organizationId, maintenanceId);
    if (!maintenance) {
      throw new Error('Failed to create maintenance record');
    }

    return maintenance;
  }

  /**
   * Get maintenance record by ID
   */
  async getMaintenanceById(organizationId: string, maintenanceId: string): Promise<MachineMaintenanceRecord | null> {
    const record = await drizzleDb
      .select()
      .from(machineMaintenanceRecords)
      .where(and(eq(machineMaintenanceRecords.id, maintenanceId), eq(machineMaintenanceRecords.organizationId, organizationId)))
      .get();

    return record as MachineMaintenanceRecord || null;
  }

  /**
   * List maintenance records for a machine
   */
  async listMaintenanceByMachine(organizationId: string, machineId: string): Promise<MachineMaintenanceRecord[]> {
    const records = await drizzleDb
      .select()
      .from(machineMaintenanceRecords)
      .where(
        and(
          eq(machineMaintenanceRecords.machineId, machineId),
          eq(machineMaintenanceRecords.organizationId, organizationId)
        )
      )
      .orderBy(desc(machineMaintenanceRecords.createdAt))
      .all();

    return records as MachineMaintenanceRecord[];
  }

  /**
   * Update maintenance record
   */
  async updateMaintenance(organizationId: string, maintenanceId: string, data: UpdateMaintenanceRecordInput): Promise<MachineMaintenanceRecord> {
    const existing = await this.getMaintenanceById(organizationId, maintenanceId);
    if (!existing) {
      throw new Error('Maintenance record not found');
    }

    const now = new Date();
    const updateData: any = { updatedAt: now };

    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
    if (data.completedDate !== undefined) updateData.completedDate = data.completedDate ? new Date(data.completedDate) : null;
    if (data.performedBy !== undefined) updateData.performedBy = data.performedBy;
    if (data.vendor !== undefined) updateData.vendor = data.vendor;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.workPerformed !== undefined) updateData.workPerformed = data.workPerformed;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.downtime !== undefined) updateData.downtime = data.downtime;
    if (data.partsReplaced !== undefined) updateData.partsReplaced = JSON.stringify(data.partsReplaced);
    if (data.notes !== undefined) updateData.notes = data.notes;

    await drizzleDb
      .update(machineMaintenanceRecords)
      .set(updateData)
      .where(and(eq(machineMaintenanceRecords.id, maintenanceId), eq(machineMaintenanceRecords.organizationId, organizationId)));

    // If completing maintenance, update machine's last/next maintenance dates
    if (data.status === 'completed' && data.completedDate) {
      await drizzleDb
        .update(dialysisMachines)
        .set({
          lastMaintenanceDate: new Date(data.completedDate),
          status: 'available', // Make machine available again
          updatedAt: now,
        })
        .where(eq(dialysisMachines.id, existing.machineId));
    }

    const updated = await this.getMaintenanceById(organizationId, maintenanceId);
    if (!updated) {
      throw new Error('Failed to update maintenance record');
    }

    return updated;
  }

  /**
   * Start maintenance (set machine to maintenance status)
   */
  async startMaintenance(organizationId: string, machineId: string, maintenanceId: string): Promise<void> {
    await drizzleDb
      .update(dialysisMachines)
      .set({ status: 'maintenance', updatedAt: new Date() })
      .where(and(eq(dialysisMachines.id, machineId), eq(dialysisMachines.organizationId, organizationId)));

    await drizzleDb
      .update(machineMaintenanceRecords)
      .set({ status: 'in_progress', updatedAt: new Date() })
      .where(eq(machineMaintenanceRecords.id, maintenanceId));
  }
}

export const machineService = new MachineService();
