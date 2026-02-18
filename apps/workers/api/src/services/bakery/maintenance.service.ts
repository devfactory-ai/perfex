/**
 * Bakery Maintenance Service (CMMS)
 * Manages equipment, interventions, maintenance plans, spare parts, and indicators
 */

import { eq, and, desc, like, or, sql
 } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import {
  bakeryEquipment,
  bakeryInterventions,
  bakeryMaintenancePlans,
  bakeryMaintenanceAlerts,
  bakerySpareParts,
  bakerySparePartMovements,
  bakeryInterventionParts,
  bakeryMaintenanceIndicators,
  type BakeryEquipment,
  type BakeryIntervention,
  type BakeryMaintenancePlan,
  type BakeryMaintenanceAlert,
  type BakerySparePart,
  type BakeryMaintenanceIndicator,
} from '@perfex/database';

interface CreateEquipmentInput {
  name: string;
  type: 'four' | 'petrin' | 'cylindre' | 'laminoir' | 'chambre_pousse' | 'diviseur' | 'faconneur' | 'congelateur' | 'autre';
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  commissioningDate: string;
  supplierId?: string;
  purchaseValue: number;
  warrantyMonths: number;
  location: string;
  photoUrl?: string;
  manualUrl?: string;
}

interface CreateInterventionInput {
  equipmentId: string;
  type: 'preventive' | 'corrective' | 'revision' | 'amelioration';
  interventionDate: string;
  durationMinutes: number;
  problemNature?: string;
  actionsPerformed: string;
  internalTechnicianId?: string;
  externalTechnician?: string;
  externalCompany?: string;
  laborCost?: number;
  causedProductionStop?: boolean;
  stopDurationMinutes?: number;
  comment?: string;
  parts?: Array<{
    sparePartId: string;
    quantity: number;
  }>;
}

interface CreateMaintenancePlanInput {
  equipmentId: string;
  periodicityType: 'jours' | 'semaines' | 'mois' | 'heures_fonctionnement';
  interval: number;
  checklist: string[];
  estimatedDurationMinutes: number;
}

interface CreateSparePartInput {
  reference: string;
  designation: string;
  compatibleEquipmentIds?: string[];
  minimumStock?: number;
  unitPrice: number;
  supplierId?: string;
  deliveryLeadDays?: number;
  photoUrl?: string;
}

interface QueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  equipmentId?: string;
  status?: string;
  isActive?: string;
  acknowledged?: string;
  lowStock?: string;
  startDate?: string;
  endDate?: string;
  period?: string;
}

export class BakeryMaintenanceService {
  /**
   * List equipment
   */
  async listEquipment(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryEquipment[]; total: number }> {
    const conditions: any[] = [eq(bakeryEquipment.organizationId, organizationId)];

    if (filters.type) {
      conditions.push(eq(bakeryEquipment.type, filters.type as any));
    }

    if (filters.isActive === 'true') {
      conditions.push(eq(bakeryEquipment.isActive, true));
    } else if (filters.isActive === 'false') {
      conditions.push(eq(bakeryEquipment.isActive, false));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(bakeryEquipment.name, searchTerm),
          like(bakeryEquipment.serialNumber, searchTerm),
          like(bakeryEquipment.brand, searchTerm)
        )
      );
    }

    const items = await drizzleDb
      .select()
      .from(bakeryEquipment)
      .where(and(...conditions))
      .orderBy(bakeryEquipment.name)
      .all() as BakeryEquipment[];

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: items.length,
    };
  }

  /**
   * Create equipment
   */
  async createEquipment(
    organizationId: string,
    data: CreateEquipmentInput
  ): Promise<BakeryEquipment> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Calculate warranty end date
    const warrantyEndDate = new Date(data.purchaseDate);
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + data.warrantyMonths);

    await drizzleDb.insert(bakeryEquipment).values({
      id,
      organizationId,
      name: data.name,
      type: data.type,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      purchaseDate: new Date(data.purchaseDate),
      commissioningDate: new Date(data.commissioningDate),
      supplierId: data.supplierId || null,
      purchaseValue: data.purchaseValue,
      warrantyMonths: data.warrantyMonths,
      warrantyEndDate,
      location: data.location,
      photoUrl: data.photoUrl || null,
      manualUrl: data.manualUrl || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const equipment = await this.getEquipment(organizationId, id);
    if (!equipment) {
      throw new Error('Failed to create equipment');
    }

    return equipment;
  }

  /**
   * Get equipment by ID
   */
  async getEquipment(organizationId: string, id: string): Promise<BakeryEquipment | null> {
    const equipment = await drizzleDb
      .select()
      .from(bakeryEquipment)
      .where(and(eq(bakeryEquipment.id, id), eq(bakeryEquipment.organizationId, organizationId)))
      .get() as BakeryEquipment | undefined;

    return equipment || null;
  }

  /**
   * Update equipment
   */
  async updateEquipment(
    organizationId: string,
    id: string,
    data: Partial<CreateEquipmentInput>
  ): Promise<BakeryEquipment> {
    const existing = await this.getEquipment(organizationId, id);
    if (!existing) {
      throw new Error('Equipment not found');
    }

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.purchaseDate) {
      updateData.purchaseDate = new Date(data.purchaseDate);
    }

    if (data.commissioningDate) {
      updateData.commissioningDate = new Date(data.commissioningDate);
    }

    await drizzleDb
      .update(bakeryEquipment)
      .set(updateData)
      .where(and(eq(bakeryEquipment.id, id), eq(bakeryEquipment.organizationId, organizationId)));

    const updated = await this.getEquipment(organizationId, id);
    if (!updated) {
      throw new Error('Failed to update equipment');
    }

    return updated;
  }

  /**
   * Create intervention
   */
  async createIntervention(
    organizationId: string,
    data: CreateInterventionInput
  ): Promise<BakeryIntervention> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Calculate parts cost
    let partsCost = 0;
    if (data.parts && data.parts.length > 0) {
      for (const part of data.parts) {
        const sparePart = await drizzleDb
          .select()
          .from(bakerySpareParts)
          .where(eq(bakerySpareParts.id, part.sparePartId))
          .get() as BakerySparePart | undefined;

        if (sparePart) {
          partsCost += (sparePart.unitPrice || 0) * part.quantity;
        }
      }
    }

    const totalCost = (data.laborCost || 0) + partsCost;

    await drizzleDb.insert(bakeryInterventions).values({
      id,
      organizationId,
      equipmentId: data.equipmentId,
      type: data.type,
      interventionDate: new Date(data.interventionDate),
      durationMinutes: data.durationMinutes,
      problemNature: data.problemNature || null,
      actionsPerformed: data.actionsPerformed,
      internalTechnicianId: data.internalTechnicianId || null,
      externalTechnician: data.externalTechnician || null,
      externalCompany: data.externalCompany || null,
      partsCost,
      laborCost: data.laborCost || 0,
      totalCost,
      causedProductionStop: data.causedProductionStop || false,
      stopDurationMinutes: data.stopDurationMinutes || null,
      status: 'planifiee',
      comment: data.comment || null,
      createdAt: now,
      updatedAt: now,
    });

    // Create intervention parts records and update stock
    if (data.parts && data.parts.length > 0) {
      for (const part of data.parts) {
        const sparePart = await drizzleDb
          .select()
          .from(bakerySpareParts)
          .where(eq(bakerySpareParts.id, part.sparePartId))
          .get() as BakerySparePart | undefined;

        const unitPrice = sparePart?.unitPrice || 0;
        const amount = unitPrice * part.quantity;

        await drizzleDb.insert(bakeryInterventionParts).values({
          id: crypto.randomUUID(),
          interventionId: id,
          sparePartId: part.sparePartId,
          quantity: part.quantity,
          unitPrice,
          amount,
          createdAt: now,
        });

        // Update spare part stock
        await this.updateSparePartStock(part.sparePartId, -part.quantity, id, null);
      }
    }

    const intervention = await drizzleDb
      .select()
      .from(bakeryInterventions)
      .where(eq(bakeryInterventions.id, id))
      .get() as BakeryIntervention;

    return intervention;
  }

  /**
   * List interventions
   */
  async listInterventions(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: any[]; total: number }> {
    const conditions: any[] = [eq(bakeryInterventions.organizationId, organizationId)];

    if (filters.equipmentId) {
      conditions.push(eq(bakeryInterventions.equipmentId, filters.equipmentId));
    }

    if (filters.type) {
      conditions.push(eq(bakeryInterventions.type, filters.type as any));
    }

    if (filters.status) {
      conditions.push(eq(bakeryInterventions.status, filters.status as any));
    }

    if (filters.startDate) {
      conditions.push(sql`${bakeryInterventions.interventionDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryInterventions.interventionDate} <= ${filters.endDate}`);
    }

    const interventions = await drizzleDb
      .select()
      .from(bakeryInterventions)
      .where(and(...conditions))
      .orderBy(desc(bakeryInterventions.interventionDate))
      .all() as BakeryIntervention[];

    // Get equipment details
    const interventionsWithDetails = await Promise.all(
      interventions.map(async (intervention) => {
        const equipment = await this.getEquipment(organizationId, intervention.equipmentId);

        const parts = await drizzleDb
          .select()
          .from(bakeryInterventionParts)
          .where(eq(bakeryInterventionParts.interventionId, intervention.id))
          .all();

        return {
          ...intervention,
          equipment,
          parts,
        };
      })
    );

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = interventionsWithDetails.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: interventionsWithDetails.length,
    };
  }

  /**
   * Complete intervention
   */
  async completeIntervention(
    organizationId: string,
    interventionId: string
  ): Promise<BakeryIntervention> {
    const now = new Date();

    const intervention = await drizzleDb
      .select()
      .from(bakeryInterventions)
      .where(eq(bakeryInterventions.id, interventionId))
      .get() as BakeryIntervention;

    if (!intervention) {
      throw new Error('Intervention not found');
    }

    await drizzleDb
      .update(bakeryInterventions)
      .set({
        status: 'terminee',
        updatedAt: now,
      })
      .where(eq(bakeryInterventions.id, interventionId));

    // Update maintenance indicators
    await this.updateMaintenanceIndicators(organizationId, intervention.equipmentId);

    const updated = await drizzleDb
      .select()
      .from(bakeryInterventions)
      .where(eq(bakeryInterventions.id, interventionId))
      .get() as BakeryIntervention;

    return updated;
  }

  /**
   * Create maintenance plan
   */
  async createMaintenancePlan(
    organizationId: string,
    data: CreateMaintenancePlanInput
  ): Promise<BakeryMaintenancePlan> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Calculate next scheduled date
    const nextScheduledDate = this.calculateNextScheduledDate(
      new Date(),
      data.periodicityType,
      data.interval
    );

    await drizzleDb.insert(bakeryMaintenancePlans).values({
      id,
      organizationId,
      equipmentId: data.equipmentId,
      periodicityType: data.periodicityType,
      interval: data.interval,
      checklist: JSON.stringify(data.checklist),
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      nextScheduledDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const plan = await drizzleDb
      .select()
      .from(bakeryMaintenancePlans)
      .where(eq(bakeryMaintenancePlans.id, id))
      .get() as BakeryMaintenancePlan;

    return plan;
  }

  /**
   * Calculate next scheduled date
   */
  private calculateNextScheduledDate(
    fromDate: Date,
    periodicityType: string,
    interval: number
  ): Date {
    const nextDate = new Date(fromDate);

    switch (periodicityType) {
      case 'jours':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'semaines':
        nextDate.setDate(nextDate.getDate() + interval * 7);
        break;
      case 'mois':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'heures_fonctionnement':
        // For running hours, we can't calculate precisely without real-time data
        nextDate.setMonth(nextDate.getMonth() + 1); // Default to 1 month
        break;
    }

    return nextDate;
  }

  /**
   * List maintenance plans
   */
  async listMaintenancePlans(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: any[]; total: number }> {
    const conditions: any[] = [eq(bakeryMaintenancePlans.organizationId, organizationId)];

    if (filters.equipmentId) {
      conditions.push(eq(bakeryMaintenancePlans.equipmentId, filters.equipmentId));
    }

    const plans = await drizzleDb
      .select()
      .from(bakeryMaintenancePlans)
      .where(and(...conditions))
      .orderBy(bakeryMaintenancePlans.nextScheduledDate)
      .all() as BakeryMaintenancePlan[];

    // Get equipment details
    const plansWithDetails = await Promise.all(
      plans.map(async (plan) => {
        const equipment = await this.getEquipment(organizationId, plan.equipmentId);
        return {
          ...plan,
          equipment,
          checklist: plan.checklist ? JSON.parse(plan.checklist as string) : [],
        };
      })
    );

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = plansWithDetails.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: plansWithDetails.length,
    };
  }

  /**
   * List maintenance alerts
   */
  async listMaintenanceAlerts(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryMaintenanceAlert[]; total: number }> {
    const conditions: any[] = [eq(bakeryMaintenanceAlerts.organizationId, organizationId)];

    if (filters.acknowledged === 'true') {
      conditions.push(eq(bakeryMaintenanceAlerts.isAcknowledged, true));
    } else if (filters.acknowledged === 'false') {
      conditions.push(eq(bakeryMaintenanceAlerts.isAcknowledged, false));
    }

    const items = await drizzleDb
      .select()
      .from(bakeryMaintenanceAlerts)
      .where(and(...conditions))
      .orderBy(desc(bakeryMaintenanceAlerts.alertDate))
      .all() as BakeryMaintenanceAlert[];

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: items.length,
    };
  }

  /**
   * Create maintenance alert
   */
  async createMaintenanceAlert(
    organizationId: string,
    planId: string,
    equipmentId: string,
    alertType: 'j_moins_7' | 'j_moins_3' | 'j_moins_1' | 'depassement'
  ): Promise<BakeryMaintenanceAlert> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryMaintenanceAlerts).values({
      id,
      organizationId,
      planId,
      equipmentId,
      alertDate: now,
      alertType,
      isNotified: false,
      isAcknowledged: false,
      createdAt: now,
    });

    const alert = await drizzleDb
      .select()
      .from(bakeryMaintenanceAlerts)
      .where(eq(bakeryMaintenanceAlerts.id, id))
      .get() as BakeryMaintenanceAlert;

    return alert;
  }

  /**
   * Acknowledge maintenance alert
   */
  async acknowledgeAlert(
    organizationId: string,
    alertId: string,
    userId: string
  ): Promise<BakeryMaintenanceAlert> {
    const now = new Date();

    await drizzleDb
      .update(bakeryMaintenanceAlerts)
      .set({
        isAcknowledged: true,
        acknowledgedAt: now,
        acknowledgedById: userId,
      })
      .where(and(
        eq(bakeryMaintenanceAlerts.id, alertId),
        eq(bakeryMaintenanceAlerts.organizationId, organizationId)
      ));

    const alert = await drizzleDb
      .select()
      .from(bakeryMaintenanceAlerts)
      .where(eq(bakeryMaintenanceAlerts.id, alertId))
      .get() as BakeryMaintenanceAlert;

    return alert;
  }

  /**
   * Create spare part
   */
  async createSparePart(
    organizationId: string,
    data: CreateSparePartInput
  ): Promise<BakerySparePart> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakerySpareParts).values({
      id,
      organizationId,
      reference: data.reference,
      designation: data.designation,
      compatibleEquipmentIds: data.compatibleEquipmentIds
        ? JSON.stringify(data.compatibleEquipmentIds)
        : null,
      currentStock: 0,
      minimumStock: data.minimumStock || 0,
      unitPrice: data.unitPrice,
      supplierId: data.supplierId || null,
      deliveryLeadDays: data.deliveryLeadDays || 0,
      photoUrl: data.photoUrl || null,
      createdAt: now,
      updatedAt: now,
    });

    const sparePart = await drizzleDb
      .select()
      .from(bakerySpareParts)
      .where(eq(bakerySpareParts.id, id))
      .get() as BakerySparePart;

    return sparePart;
  }

  /**
   * List spare parts
   */
  async listSpareParts(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakerySparePart[]; total: number }> {
    const conditions: any[] = [eq(bakerySpareParts.organizationId, organizationId)];

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(bakerySpareParts.reference, searchTerm),
          like(bakerySpareParts.designation, searchTerm)
        )
      );
    }

    let items = await drizzleDb
      .select()
      .from(bakerySpareParts)
      .where(and(...conditions))
      .orderBy(bakerySpareParts.designation)
      .all() as BakerySparePart[];

    // Filter low stock if requested
    if (filters.lowStock === 'true') {
      items = items.filter(
        (item) => item.currentStock !== null &&
                  item.minimumStock !== null &&
                  item.currentStock <= item.minimumStock
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: items.length,
    };
  }

  /**
   * Update spare part stock
   */
  private async updateSparePartStock(
    sparePartId: string,
    quantity: number,
    interventionId: string | null,
    responsibleId: string | null
  ): Promise<void> {
    const sparePart = await drizzleDb
      .select()
      .from(bakerySpareParts)
      .where(eq(bakerySpareParts.id, sparePartId))
      .get() as BakerySparePart;

    if (!sparePart) return;

    const newStock = (sparePart.currentStock || 0) + quantity;

    await drizzleDb
      .update(bakerySpareParts)
      .set({
        currentStock: Math.max(0, newStock),
        updatedAt: new Date(),
      })
      .where(eq(bakerySpareParts.id, sparePartId));

    // Record movement (no organizationId, no stockBefore/After)
    const movementType = quantity > 0 ? 'entree' : (interventionId ? 'sortie_intervention' : 'ajustement');

    await drizzleDb.insert(bakerySparePartMovements).values({
      id: crypto.randomUUID(),
      sparePartId,
      type: movementType,
      quantity: Math.abs(quantity),
      interventionId: interventionId || null,
      movementDate: new Date(),
      responsibleId: responsibleId || null,
      createdAt: new Date(),
    });
  }

  /**
   * Add spare part stock entry
   */
  async addSparePartStock(
    organizationId: string,
    sparePartId: string,
    quantity: number,
    responsibleId: string
  ): Promise<void> {
    // Verify spare part belongs to organization
    const sparePart = await drizzleDb
      .select()
      .from(bakerySpareParts)
      .where(and(
        eq(bakerySpareParts.id, sparePartId),
        eq(bakerySpareParts.organizationId, organizationId)
      ))
      .get() as BakerySparePart | undefined;

    if (!sparePart) {
      throw new Error('Spare part not found');
    }

    await this.updateSparePartStock(sparePartId, quantity, null, responsibleId);
  }

  /**
   * Get maintenance indicators (MTBF, MTTR, etc.)
   * Schema: period, mtbf, mttr, availability, totalMaintenanceCost, preventiveInterventions, correctiveInterventions, productionStopMinutes
   */
  async getIndicators(
    organizationId: string,
    filters: QueryFilters
  ): Promise<any> {
    const conditions: any[] = [eq(bakeryMaintenanceIndicators.organizationId, organizationId)];

    if (filters.equipmentId) {
      conditions.push(eq(bakeryMaintenanceIndicators.equipmentId, filters.equipmentId));
    }

    // Get latest indicators for each equipment
    const indicators = await drizzleDb
      .select()
      .from(bakeryMaintenanceIndicators)
      .where(and(...conditions))
      .orderBy(desc(bakeryMaintenanceIndicators.period))
      .all() as BakeryMaintenanceIndicator[];

    // Calculate aggregate statistics
    const equipmentIds = [...new Set(indicators.map(i => i.equipmentId))];
    const latestIndicators = equipmentIds.map(eqId =>
      indicators.find(i => i.equipmentId === eqId)
    ).filter(Boolean);

    const aggregates = {
      averageMtbf: 0,
      averageMttr: 0,
      totalProductionStopMinutes: 0,
      averageAvailability: 0,
    };

    if (latestIndicators.length > 0) {
      const totalMtbf = latestIndicators.reduce((sum, i) => sum + (i?.mtbf || 0), 0);
      const totalMttr = latestIndicators.reduce((sum, i) => sum + (i?.mttr || 0), 0);
      const totalStopMinutes = latestIndicators.reduce((sum, i) => sum + (i?.productionStopMinutes || 0), 0);
      const totalAvailability = latestIndicators.reduce((sum, i) => sum + (i?.availability || 0), 0);

      aggregates.averageMtbf = totalMtbf / latestIndicators.length;
      aggregates.averageMttr = totalMttr / latestIndicators.length;
      aggregates.totalProductionStopMinutes = totalStopMinutes;
      aggregates.averageAvailability = totalAvailability / latestIndicators.length;
    }

    return {
      indicators: latestIndicators,
      aggregates,
    };
  }

  /**
   * Update maintenance indicators for equipment
   * Schema columns: period, mtbf (hours), mttr (minutes), availability, totalMaintenanceCost,
   * preventiveInterventions, correctiveInterventions, productionStopMinutes
   */
  private async updateMaintenanceIndicators(
    organizationId: string,
    equipmentId: string
  ): Promise<void> {
    const now = new Date();

    // Get equipment
    const equipment = await this.getEquipment(organizationId, equipmentId);
    if (!equipment) return;

    // Get all interventions for this equipment
    const interventions = await drizzleDb
      .select()
      .from(bakeryInterventions)
      .where(and(
        eq(bakeryInterventions.equipmentId, equipmentId),
        eq(bakeryInterventions.status, 'terminee')
      ))
      .orderBy(bakeryInterventions.interventionDate)
      .all() as BakeryIntervention[];

    if (interventions.length === 0) return;

    // Calculate MTBF (Mean Time Between Failures) in hours
    const correctiveInterventions = interventions.filter(i => i.type === 'corrective');
    let mtbf = 0;
    if (correctiveInterventions.length > 1) {
      const firstFailure = new Date(correctiveInterventions[0].interventionDate);
      const lastFailure = new Date(correctiveInterventions[correctiveInterventions.length - 1].interventionDate);
      const totalHours = (lastFailure.getTime() - firstFailure.getTime()) / (1000 * 60 * 60);
      mtbf = totalHours / (correctiveInterventions.length - 1);
    }

    // Calculate MTTR (Mean Time To Repair) in minutes
    const totalRepairMinutes = interventions.reduce((sum, i) => sum + (i.durationMinutes || 0), 0);
    const mttr = interventions.length > 0 ? totalRepairMinutes / interventions.length : 0;

    // Calculate total production stop minutes
    const productionStopMinutes = interventions
      .filter(i => i.causedProductionStop)
      .reduce((sum, i) => sum + (i.stopDurationMinutes || 0), 0);

    // Calculate availability percentage
    const commissioningDate = new Date(equipment.commissioningDate);
    const totalOperationalMinutes = (now.getTime() - commissioningDate.getTime()) / (1000 * 60);
    const availability = totalOperationalMinutes > 0
      ? ((totalOperationalMinutes - productionStopMinutes) / totalOperationalMinutes) * 100
      : 100;

    // Calculate total maintenance cost
    const totalMaintenanceCost = interventions.reduce((sum, i) => sum + (i.totalCost || 0), 0);

    // Count interventions by type
    const preventiveInterventions = interventions.filter(i => i.type === 'preventive').length;
    const correctiveCount = correctiveInterventions.length;

    // Use current month as period
    const period = new Date(now.getFullYear(), now.getMonth(), 1);

    await drizzleDb.insert(bakeryMaintenanceIndicators).values({
      id: crypto.randomUUID(),
      organizationId,
      equipmentId,
      period,
      mtbf,
      mttr,
      availability,
      totalMaintenanceCost,
      preventiveInterventions,
      correctiveInterventions: correctiveCount,
      productionStopMinutes,
      createdAt: now,
    });
  }
}

export const bakeryMaintenanceService = new BakeryMaintenanceService();
