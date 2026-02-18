/**
 * Bakery Production Service
 * Manages proofing chambers, ovens, quality controls, and energy tracking
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import {
  bakeryProofingChambers,
  bakeryProofingCarts,
  bakeryCartLines,
  bakeryOvens,
  bakeryOvenPassages,
  bakeryQualityControls,
  bakeryProductionDefects,
  bakeryProductionComparisons,
  bakeryMeterReadings,
  bakeryDailyConsumptions,
  bakeryProducts,
  bakeryProductRecipes,
  bakeryRecipeCompositions,
  bakeryStockMovements,
  type BakeryProofingChamber,
  type BakeryProofingCart,
  type BakeryOven,
  type BakeryOvenPassage,
  type BakeryQualityControl,
  type BakeryProductionComparison,
  type BakeryMeterReading,
  type BakeryDailyConsumption,
} from '@perfex/database';

interface CreateProofingChamberInput {
  name: string;
  cartCapacity: number;
  idealTemperature: number;
  idealHumidity: number;
}

interface CreateProofingCartInput {
  cartNumber: string;
  chamberId?: string;
  temperature?: number;
  humidity?: number;
  lines: Array<{
    productId: string;
    quantity: number;
    doughWeight?: number;
  }>;
}

interface CreateOvenInput {
  name: string;
  type: 'rotatif' | 'sole' | 'tunnel' | 'autre';
  cartCapacity: number;
  maxTemperature: number;
}

interface CreateOvenPassageInput {
  cartId: string;
  ovenId: string;
  temperature: number;
  expectedDuration: number;
}

interface CreateQualityControlInput {
  ovenPassageId: string;
  isConforming: boolean;
  comment?: string;
  defects?: Array<{
    productId: string;
    defectType: 'brule' | 'sous_cuit' | 'deforme' | 'casse' | 'autre';
    defectiveQuantity: number;
    probableCause?: string;
    correctiveAction?: string;
  }>;
}

interface QueryFilters {
  page?: number;
  limit?: number;
  status?: string;
  chamberId?: string;
  ovenId?: string;
  startDate?: string;
  endDate?: string;
  isConforming?: string;
  energyType?: string;
}

export class BakeryProductionService {
  /**
   * Calculate production forecast based on stock exits
   */
  async calculateForecast(
    organizationId: string,
    date?: string
  ): Promise<any> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get stock exits for the day
    const stockExits = await drizzleDb
      .select()
      .from(bakeryStockMovements)
      .where(and(
        eq(bakeryStockMovements.organizationId, organizationId),
        eq(bakeryStockMovements.type, 'sortie'),
        sql`${bakeryStockMovements.movementDate} >= ${startOfDay.toISOString()}`,
        sql`${bakeryStockMovements.movementDate} <= ${endOfDay.toISOString()}`
      ))
      .all();

    // Get all active recipes
    const recipes = await drizzleDb
      .select()
      .from(bakeryProductRecipes)
      .where(and(
        eq(bakeryProductRecipes.organizationId, organizationId),
        eq(bakeryProductRecipes.isActive, true)
      ))
      .all();

    // Calculate theoretical production for each product
    const forecast: any[] = [];

    for (const recipe of recipes) {
      const compositions = await drizzleDb
        .select()
        .from(bakeryRecipeCompositions)
        .where(eq(bakeryRecipeCompositions.recipeId, recipe.id))
        .all();

      // Find minimum possible yield based on stock exits
      let minYield = Infinity;

      for (const comp of compositions) {
        const articleExit = stockExits.find((s: any) => s.articleId === comp.articleId);
        if (articleExit) {
          const possibleYield = (articleExit.quantity / comp.quantityNeeded) * recipe.yield;
          minYield = Math.min(minYield, possibleYield);
        }
      }

      if (minYield !== Infinity && minYield > 0) {
        const product = await drizzleDb
          .select()
          .from(bakeryProducts)
          .where(eq(bakeryProducts.id, recipe.productId))
          .get();

        forecast.push({
          productId: recipe.productId,
          productName: product?.name || 'Unknown',
          theoreticalQuantity: Math.floor(minYield),
          recipeId: recipe.id,
          recipeName: recipe.name,
        });
      }
    }

    return {
      date: targetDate.toISOString().split('T')[0],
      forecast,
    };
  }

  /**
   * List proofing chambers
   */
  async listProofingChambers(organizationId: string): Promise<BakeryProofingChamber[]> {
    const chambers = await drizzleDb
      .select()
      .from(bakeryProofingChambers)
      .where(eq(bakeryProofingChambers.organizationId, organizationId))
      .orderBy(bakeryProofingChambers.name)
      .all() as BakeryProofingChamber[];

    return chambers;
  }

  /**
   * Create proofing chamber
   */
  async createProofingChamber(
    organizationId: string,
    data: CreateProofingChamberInput
  ): Promise<BakeryProofingChamber> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryProofingChambers).values({
      id,
      organizationId,
      name: data.name,
      cartCapacity: data.cartCapacity,
      idealTemperature: data.idealTemperature,
      idealHumidity: data.idealHumidity,
      isActive: true,
      createdAt: now,
    });

    const chamber = await drizzleDb
      .select()
      .from(bakeryProofingChambers)
      .where(eq(bakeryProofingChambers.id, id))
      .get() as BakeryProofingChamber;

    return chamber;
  }

  /**
   * Create proofing cart
   */
  async createProofingCart(
    organizationId: string,
    data: CreateProofingCartInput,
    userId: string
  ): Promise<BakeryProofingCart> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryProofingCarts).values({
      id,
      organizationId,
      cartNumber: data.cartNumber,
      chamberId: data.chamberId || null,
      status: 'en_pousse',
      entryTime: now,
      temperature: data.temperature || null,
      humidity: data.humidity || null,
      responsibleId: userId,
      createdAt: now,
    });

    // Create cart lines (no organizationId on cart lines)
    for (const line of data.lines) {
      await drizzleDb.insert(bakeryCartLines).values({
        id: crypto.randomUUID(),
        cartId: id,
        productId: line.productId,
        quantity: line.quantity,
        doughWeight: line.doughWeight || null,
        createdAt: now,
      });
    }

    const cart = await drizzleDb
      .select()
      .from(bakeryProofingCarts)
      .where(eq(bakeryProofingCarts.id, id))
      .get() as BakeryProofingCart;

    return cart;
  }

  /**
   * List proofing carts
   */
  async listProofingCarts(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: any[]; total: number }> {
    const conditions: any[] = [eq(bakeryProofingCarts.organizationId, organizationId)];

    if (filters.status) {
      conditions.push(eq(bakeryProofingCarts.status, filters.status as any));
    }

    if (filters.chamberId) {
      conditions.push(eq(bakeryProofingCarts.chamberId, filters.chamberId));
    }

    // Pagination at DB level for better performance
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const carts = await drizzleDb
      .select()
      .from(bakeryProofingCarts)
      .where(and(...conditions))
      .orderBy(desc(bakeryProofingCarts.entryTime))
      .limit(limit)
      .offset(offset)
      .all() as BakeryProofingCart[];

    // Get total count for pagination
    const totalResult = await drizzleDb
      .select({ count: sql<number>`count(*)` })
      .from(bakeryProofingCarts)
      .where(and(...conditions))
      .get();
    const total = totalResult?.count || 0;

    if (carts.length === 0) {
      return { items: [], total };
    }

    // Batch fetch: Get all cart lines in one query
    const cartIds = carts.map(c => c.id);
    const allLines = await drizzleDb
      .select()
      .from(bakeryCartLines)
      .where(sql`${bakeryCartLines.cartId} IN (${sql.join(cartIds.map(id => sql`${id}`), sql`, `)})`)
      .all();

    // Batch fetch: Get all products in one query
    const productIds = [...new Set((allLines as any[]).map(l => l.productId))];
    const products = productIds.length > 0
      ? await drizzleDb
          .select()
          .from(bakeryProducts)
          .where(sql`${bakeryProducts.id} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`)
          .all()
      : [];

    // Create lookup maps for O(1) access
    const productMap = new Map((products as any[]).map(p => [p.id, p]));
    const linesByCart = new Map<string, any[]>();
    for (const line of allLines as any[]) {
      const cartLines = linesByCart.get(line.cartId) || [];
      cartLines.push({
        ...line,
        product: productMap.get(line.productId) || null,
      });
      linesByCart.set(line.cartId, cartLines);
    }

    // Build result with enriched data
    const cartsWithLines = carts.map(cart => ({
      ...cart,
      lines: linesByCart.get(cart.id) || [],
    }));

    return {
      items: cartsWithLines,
      total,
    };
  }

  /**
   * Update cart status
   */
  async updateCartStatus(
    organizationId: string,
    cartId: string,
    status: 'en_pousse' | 'pret_four' | 'au_four' | 'termine'
  ): Promise<BakeryProofingCart> {
    const now = new Date();
    const updateData: any = { status };

    // Update exit time if status is 'termine' or leaving proofing
    if (status === 'termine' || status === 'pret_four') {
      updateData.exitTime = now;
    }

    await drizzleDb
      .update(bakeryProofingCarts)
      .set(updateData)
      .where(and(
        eq(bakeryProofingCarts.id, cartId),
        eq(bakeryProofingCarts.organizationId, organizationId)
      ));

    const cart = await drizzleDb
      .select()
      .from(bakeryProofingCarts)
      .where(eq(bakeryProofingCarts.id, cartId))
      .get() as BakeryProofingCart;

    return cart;
  }

  /**
   * List ovens
   */
  async listOvens(organizationId: string): Promise<BakeryOven[]> {
    const ovens = await drizzleDb
      .select()
      .from(bakeryOvens)
      .where(eq(bakeryOvens.organizationId, organizationId))
      .orderBy(bakeryOvens.name)
      .all() as BakeryOven[];

    return ovens;
  }

  /**
   * Create oven
   */
  async createOven(
    organizationId: string,
    data: CreateOvenInput
  ): Promise<BakeryOven> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryOvens).values({
      id,
      organizationId,
      name: data.name,
      type: data.type,
      cartCapacity: data.cartCapacity,
      maxTemperature: data.maxTemperature,
      isActive: true,
      createdAt: now,
    });

    const oven = await drizzleDb
      .select()
      .from(bakeryOvens)
      .where(eq(bakeryOvens.id, id))
      .get() as BakeryOven;

    return oven;
  }

  /**
   * Create oven passage
   */
  async createOvenPassage(
    organizationId: string,
    data: CreateOvenPassageInput,
    userId: string
  ): Promise<BakeryOvenPassage> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Update cart status
    await this.updateCartStatus(organizationId, data.cartId, 'au_four');

    // Insert oven passage (no organizationId on oven passages)
    await drizzleDb.insert(bakeryOvenPassages).values({
      id,
      cartId: data.cartId,
      ovenId: data.ovenId,
      entryTime: now,
      temperature: data.temperature,
      expectedDuration: data.expectedDuration,
      status: 'en_cuisson',
      responsibleId: userId,
      createdAt: now,
    });

    const passage = await drizzleDb
      .select()
      .from(bakeryOvenPassages)
      .where(eq(bakeryOvenPassages.id, id))
      .get() as BakeryOvenPassage;

    return passage;
  }

  /**
   * Complete oven passage
   */
  async completeOvenPassage(
    organizationId: string,
    passageId: string
  ): Promise<BakeryOvenPassage> {
    const now = new Date();

    const passage = await drizzleDb
      .select()
      .from(bakeryOvenPassages)
      .where(eq(bakeryOvenPassages.id, passageId))
      .get() as BakeryOvenPassage;

    if (!passage) {
      throw new Error('Oven passage not found');
    }

    // Calculate actual duration
    const entryTime = new Date(passage.entryTime);
    const actualDuration = Math.round((now.getTime() - entryTime.getTime()) / 60000); // in minutes

    await drizzleDb
      .update(bakeryOvenPassages)
      .set({
        exitTime: now,
        actualDuration,
        status: 'termine',
      })
      .where(eq(bakeryOvenPassages.id, passageId));

    // Update cart status
    await this.updateCartStatus(organizationId, passage.cartId, 'termine');

    const updated = await drizzleDb
      .select()
      .from(bakeryOvenPassages)
      .where(eq(bakeryOvenPassages.id, passageId))
      .get() as BakeryOvenPassage;

    return updated;
  }

  /**
   * List oven passages
   */
  async listOvenPassages(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: any[]; total: number }> {
    // Get carts for this organization first (passages don't have organizationId)
    const orgCarts = await drizzleDb
      .select({ id: bakeryProofingCarts.id })
      .from(bakeryProofingCarts)
      .where(eq(bakeryProofingCarts.organizationId, organizationId))
      .all();

    const cartIds = orgCarts.map(c => c.id);

    if (cartIds.length === 0) {
      return { items: [], total: 0 };
    }

    const conditions: any[] = [sql`${bakeryOvenPassages.cartId} IN (${cartIds.join(',')})`];

    if (filters.status) {
      conditions.push(eq(bakeryOvenPassages.status, filters.status as any));
    }

    if (filters.ovenId) {
      conditions.push(eq(bakeryOvenPassages.ovenId, filters.ovenId));
    }

    if (filters.startDate) {
      conditions.push(sql`${bakeryOvenPassages.entryTime} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryOvenPassages.entryTime} <= ${filters.endDate}`);
    }

    const passages = await drizzleDb
      .select()
      .from(bakeryOvenPassages)
      .where(and(...conditions))
      .orderBy(desc(bakeryOvenPassages.entryTime))
      .all() as BakeryOvenPassage[];

    // Get cart and oven details
    const passagesWithDetails = await Promise.all(
      passages.map(async (passage) => {
        const cart = await drizzleDb
          .select()
          .from(bakeryProofingCarts)
          .where(eq(bakeryProofingCarts.id, passage.cartId))
          .get();

        const oven = await drizzleDb
          .select()
          .from(bakeryOvens)
          .where(eq(bakeryOvens.id, passage.ovenId))
          .get();

        return {
          ...passage,
          cart,
          oven,
        };
      })
    );

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = passagesWithDetails.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: passagesWithDetails.length,
    };
  }

  /**
   * Create quality control
   */
  async createQualityControl(
    organizationId: string,
    data: CreateQualityControlInput,
    userId: string
  ): Promise<BakeryQualityControl> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryQualityControls).values({
      id,
      organizationId,
      ovenPassageId: data.ovenPassageId,
      controlDate: now,
      isConforming: data.isConforming,
      comment: data.comment || null,
      controllerId: userId,
      createdAt: now,
    });

    // Create defects if any (no organizationId on defects)
    if (data.defects && data.defects.length > 0) {
      for (const defect of data.defects) {
        await drizzleDb.insert(bakeryProductionDefects).values({
          id: crypto.randomUUID(),
          qualityControlId: id,
          productId: defect.productId,
          defectType: defect.defectType,
          defectiveQuantity: defect.defectiveQuantity,
          probableCause: defect.probableCause || null,
          correctiveAction: defect.correctiveAction || null,
          createdAt: now,
        });
      }
    }

    // Update comparison data
    await this.updateProductionComparison(organizationId, data.ovenPassageId, data.defects);

    const control = await drizzleDb
      .select()
      .from(bakeryQualityControls)
      .where(eq(bakeryQualityControls.id, id))
      .get() as BakeryQualityControl;

    return control;
  }

  /**
   * Update production comparison (theoretical vs actual)
   * Schema: comparisonDate, productId, theoreticalQuantity, proofingQuantity,
   * ovenOutputQuantity, conformingQuantity, defectiveQuantity, theoreticalVariance, conformityRate, lossRate
   */
  private async updateProductionComparison(
    organizationId: string,
    ovenPassageId: string,
    defects?: Array<{ productId: string; defectiveQuantity: number }>
  ): Promise<void> {
    const now = new Date();

    // Get passage and cart details
    const passage = await drizzleDb
      .select()
      .from(bakeryOvenPassages)
      .where(eq(bakeryOvenPassages.id, ovenPassageId))
      .get() as BakeryOvenPassage;

    if (!passage) return;

    const cartLines = await drizzleDb
      .select()
      .from(bakeryCartLines)
      .where(eq(bakeryCartLines.cartId, passage.cartId))
      .all();

    for (const line of cartLines as any[]) {
      const theoreticalQuantity = line.quantity;
      const proofingQuantity = line.quantity; // Same as theoretical for now
      const ovenOutputQuantity = line.quantity; // Before quality check
      const defectQty = defects?.find(d => d.productId === line.productId)?.defectiveQuantity || 0;
      const conformingQuantity = theoreticalQuantity - defectQty;
      const theoreticalVariance = conformingQuantity - theoreticalQuantity;
      const conformityRate = ovenOutputQuantity > 0 ? (conformingQuantity / ovenOutputQuantity) * 100 : 0;
      const lossRate = theoreticalQuantity > 0 ? (Math.abs(theoreticalVariance) / theoreticalQuantity) * 100 : 0;

      await drizzleDb.insert(bakeryProductionComparisons).values({
        id: crypto.randomUUID(),
        organizationId,
        comparisonDate: now,
        productId: line.productId,
        theoreticalQuantity,
        proofingQuantity,
        ovenOutputQuantity,
        conformingQuantity,
        defectiveQuantity: defectQty,
        theoreticalVariance,
        conformityRate,
        lossRate,
        createdAt: now,
      });
    }
  }

  /**
   * List quality controls
   */
  async listQualityControls(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: any[]; total: number }> {
    const conditions: any[] = [eq(bakeryQualityControls.organizationId, organizationId)];

    if (filters.isConforming === 'true') {
      conditions.push(eq(bakeryQualityControls.isConforming, true));
    } else if (filters.isConforming === 'false') {
      conditions.push(eq(bakeryQualityControls.isConforming, false));
    }

    if (filters.startDate) {
      conditions.push(sql`${bakeryQualityControls.controlDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryQualityControls.controlDate} <= ${filters.endDate}`);
    }

    const controls = await drizzleDb
      .select()
      .from(bakeryQualityControls)
      .where(and(...conditions))
      .orderBy(desc(bakeryQualityControls.controlDate))
      .all() as BakeryQualityControl[];

    // Get defects for each control
    const controlsWithDefects = await Promise.all(
      controls.map(async (control) => {
        const defects = await drizzleDb
          .select()
          .from(bakeryProductionDefects)
          .where(eq(bakeryProductionDefects.qualityControlId, control.id))
          .all();

        return {
          ...control,
          defects,
        };
      })
    );

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = controlsWithDefects.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: controlsWithDefects.length,
    };
  }

  /**
   * List production comparisons
   */
  async listComparisons(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryProductionComparison[]; total: number }> {
    const conditions: any[] = [eq(bakeryProductionComparisons.organizationId, organizationId)];

    if (filters.startDate) {
      conditions.push(sql`${bakeryProductionComparisons.comparisonDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryProductionComparisons.comparisonDate} <= ${filters.endDate}`);
    }

    const items = await drizzleDb
      .select()
      .from(bakeryProductionComparisons)
      .where(and(...conditions))
      .orderBy(desc(bakeryProductionComparisons.comparisonDate))
      .all() as BakeryProductionComparison[];

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
   * Record meter reading
   */
  async recordMeterReading(
    organizationId: string,
    data: { meterType: 'gaz' | 'electricite' | 'eau'; meterValue: number; meterPhotoUrl?: string },
    userId: string
  ): Promise<BakeryMeterReading> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Get previous reading to calculate consumption
    const previousReading = await drizzleDb
      .select()
      .from(bakeryMeterReadings)
      .where(and(
        eq(bakeryMeterReadings.organizationId, organizationId),
        eq(bakeryMeterReadings.meterType, data.meterType)
      ))
      .orderBy(desc(bakeryMeterReadings.readingDate))
      .get() as BakeryMeterReading | undefined;

    const previousValue = previousReading?.meterValue || 0;
    const consumption = data.meterValue - previousValue;

    await drizzleDb.insert(bakeryMeterReadings).values({
      id,
      organizationId,
      meterType: data.meterType,
      readingDate: now,
      meterValue: data.meterValue,
      responsibleId: userId,
      meterPhotoUrl: data.meterPhotoUrl || null,
      createdAt: now,
    });

    // Update daily consumption
    await this.updateDailyConsumption(organizationId, data.meterType, consumption > 0 ? consumption : 0);

    const reading = await drizzleDb
      .select()
      .from(bakeryMeterReadings)
      .where(eq(bakeryMeterReadings.id, id))
      .get() as BakeryMeterReading;

    return reading;
  }

  /**
   * Update daily consumption
   * Schema requires: consumption, unitCost, totalCost, dailyProductionQuantity, consumptionRatio
   */
  private async updateDailyConsumption(
    organizationId: string,
    energyType: string,
    consumptionValue: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Default unit costs (should be configurable)
    const unitCosts: Record<string, number> = {
      gaz: 0.05,
      electricite: 0.15,
      eau: 0.003,
    };

    const unitCost = unitCosts[energyType] || 0.1;
    const totalCost = consumptionValue * unitCost;

    // Estimate daily production (simplified - count finished carts)
    const finishedCarts = await drizzleDb
      .select()
      .from(bakeryProofingCarts)
      .where(and(
        eq(bakeryProofingCarts.organizationId, organizationId),
        eq(bakeryProofingCarts.status, 'termine'),
        sql`date(${bakeryProofingCarts.exitTime}) = date(${today.toISOString()})`
      ))
      .all();

    let dailyProductionQuantity = 0;
    for (const cart of finishedCarts) {
      const lines = await drizzleDb
        .select()
        .from(bakeryCartLines)
        .where(eq(bakeryCartLines.cartId, cart.id))
        .all();
      dailyProductionQuantity += lines.reduce((sum: number, l: any) => sum + (l.quantity || 0), 0);
    }

    const consumptionRatio = dailyProductionQuantity > 0 ? consumptionValue / dailyProductionQuantity : 0;

    const existing = await drizzleDb
      .select()
      .from(bakeryDailyConsumptions)
      .where(and(
        eq(bakeryDailyConsumptions.organizationId, organizationId),
        eq(bakeryDailyConsumptions.energyType, energyType as any),
        sql`date(${bakeryDailyConsumptions.consumptionDate}) = date(${today.toISOString()})`
      ))
      .get() as BakeryDailyConsumption | undefined;

    if (existing) {
      const newConsumption = (existing.consumption || 0) + consumptionValue;
      const newTotalCost = newConsumption * unitCost;
      const newRatio = dailyProductionQuantity > 0 ? newConsumption / dailyProductionQuantity : 0;

      await drizzleDb
        .update(bakeryDailyConsumptions)
        .set({
          consumption: newConsumption,
          totalCost: newTotalCost,
          dailyProductionQuantity,
          consumptionRatio: newRatio,
        })
        .where(eq(bakeryDailyConsumptions.id, existing.id));
    } else {
      await drizzleDb.insert(bakeryDailyConsumptions).values({
        id: crypto.randomUUID(),
        organizationId,
        consumptionDate: today,
        energyType: energyType as any,
        consumption: consumptionValue,
        unitCost,
        totalCost,
        dailyProductionQuantity,
        consumptionRatio,
        createdAt: new Date(),
      });
    }
  }

  /**
   * List daily consumptions
   */
  async listDailyConsumptions(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryDailyConsumption[]; total: number }> {
    const conditions: any[] = [eq(bakeryDailyConsumptions.organizationId, organizationId)];

    if (filters.energyType) {
      conditions.push(eq(bakeryDailyConsumptions.energyType, filters.energyType as any));
    }

    if (filters.startDate) {
      conditions.push(sql`${bakeryDailyConsumptions.consumptionDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryDailyConsumptions.consumptionDate} <= ${filters.endDate}`);
    }

    const items = await drizzleDb
      .select()
      .from(bakeryDailyConsumptions)
      .where(and(...conditions))
      .orderBy(desc(bakeryDailyConsumptions.consumptionDate))
      .all() as BakeryDailyConsumption[];

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total: items.length,
    };
  }
}

export const bakeryProductionService = new BakeryProductionService();
