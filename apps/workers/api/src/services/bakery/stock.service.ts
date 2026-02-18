/**
 * Bakery Stock Service
 * Manages articles, stock movements, inventories, and alerts
 */

import { eq, and, desc, like, or, isNull, sql } from 'drizzle-orm';
import { drizzleDb } from '../../db';
import {
  bakeryArticles,
  bakeryStockMovements,
  bakeryInventories,
  bakeryInventoryLines,
  bakeryStockAlerts,
  type BakeryArticle,
  type BakeryStockMovement,
  type BakeryInventory,
  type BakeryInventoryLine,
  type BakeryStockAlert,
} from '@perfex/database';

interface CreateArticleInput {
  reference: string;
  name: string;
  category: 'farine' | 'semoule' | 'levure' | 'additifs' | 'emballages' | 'autre';
  unitOfMeasure: 'kg' | 'L' | 'unite';
  averagePurchasePrice?: number;
  minimumStock?: number;
  optimalStock?: number;
  mainSupplierId?: string;
  alternativeSupplierIds?: string[];
  expirationDate?: string;
}

interface CreateMovementInput {
  articleId: string;
  type: 'entree' | 'sortie' | 'ajustement' | 'inventaire';
  quantity: number;
  reason: string;
  documentReference?: string;
  lotNumber?: string;
  purchasePrice?: number;
  movementDate: string;
  comment?: string;
}

interface QueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: string;
  articleId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  alertType?: string;
  acknowledged?: string;
}

export class BakeryStockService {
  /**
   * List all articles with filters
   */
  async listArticles(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryArticle[]; total: number }> {
    const conditions: any[] = [eq(bakeryArticles.organizationId, organizationId)];

    if (filters.category) {
      conditions.push(eq(bakeryArticles.category, filters.category as any));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(bakeryArticles.name, searchTerm),
          like(bakeryArticles.reference, searchTerm)
        )
      );
    }

    const allItems = await drizzleDb
      .select()
      .from(bakeryArticles)
      .where(and(...conditions))
      .orderBy(desc(bakeryArticles.createdAt))
      .all() as BakeryArticle[];

    // Filter low stock items if requested
    let items = allItems;
    if (filters.lowStock === 'true') {
      items = allItems.filter(
        (item) => item.currentStock !== null &&
                  item.minimumStock !== null &&
                  item.currentStock <= item.minimumStock
      );
    }

    // Pagination
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
   * Create a new article
   */
  async createArticle(
    organizationId: string,
    data: CreateArticleInput,
    _userId: string
  ): Promise<BakeryArticle> {
    const now = new Date();
    const id = crypto.randomUUID();

    await drizzleDb.insert(bakeryArticles).values({
      id,
      organizationId,
      reference: data.reference,
      name: data.name,
      category: data.category,
      unitOfMeasure: data.unitOfMeasure,
      currentStock: 0,
      averagePurchasePrice: data.averagePurchasePrice || 0,
      minimumStock: data.minimumStock || 0,
      optimalStock: data.optimalStock || 0,
      mainSupplierId: data.mainSupplierId || null,
      alternativeSupplierIds: data.alternativeSupplierIds
        ? JSON.stringify(data.alternativeSupplierIds)
        : null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const article = await this.getArticle(organizationId, id);
    if (!article) {
      throw new Error('Failed to create article');
    }

    return article;
  }

  /**
   * Get article by ID
   */
  async getArticle(organizationId: string, id: string): Promise<BakeryArticle | null> {
    const article = await drizzleDb
      .select()
      .from(bakeryArticles)
      .where(and(eq(bakeryArticles.id, id), eq(bakeryArticles.organizationId, organizationId)))
      .get() as BakeryArticle | undefined;

    return article || null;
  }

  /**
   * Update article
   */
  async updateArticle(
    organizationId: string,
    id: string,
    data: Partial<CreateArticleInput>
  ): Promise<BakeryArticle> {
    const existing = await this.getArticle(organizationId, id);
    if (!existing) {
      throw new Error('Article not found');
    }

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.alternativeSupplierIds) {
      updateData.alternativeSupplierIds = JSON.stringify(data.alternativeSupplierIds);
    }

    await drizzleDb
      .update(bakeryArticles)
      .set(updateData)
      .where(and(eq(bakeryArticles.id, id), eq(bakeryArticles.organizationId, organizationId)));

    const updated = await this.getArticle(organizationId, id);
    if (!updated) {
      throw new Error('Failed to update article');
    }

    return updated;
  }

  /**
   * Delete article
   */
  async deleteArticle(organizationId: string, id: string): Promise<void> {
    const existing = await this.getArticle(organizationId, id);
    if (!existing) {
      throw new Error('Article not found');
    }

    await drizzleDb
      .delete(bakeryArticles)
      .where(and(eq(bakeryArticles.id, id), eq(bakeryArticles.organizationId, organizationId)));
  }

  /**
   * Create stock movement
   */
  async createMovement(
    organizationId: string,
    data: CreateMovementInput,
    userId: string
  ): Promise<BakeryStockMovement> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Get current article stock
    const article = await this.getArticle(organizationId, data.articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    const currentStock = article.currentStock || 0;
    let newStock: number;

    switch (data.type) {
      case 'entree':
        newStock = currentStock + data.quantity;
        break;
      case 'sortie':
        newStock = currentStock - data.quantity;
        if (newStock < 0) {
          throw new Error('Insufficient stock');
        }
        break;
      case 'ajustement':
      case 'inventaire':
        newStock = data.quantity; // Direct set
        break;
      default:
        throw new Error('Invalid movement type');
    }

    // Calculate PUMP (Prix Unitaire Moyen Pondéré) for entries
    let newAveragePrice = article.averagePurchasePrice || 0;
    if (data.type === 'entree' && data.purchasePrice) {
      const totalValue = currentStock * (article.averagePurchasePrice || 0) + data.quantity * data.purchasePrice;
      newAveragePrice = newStock > 0 ? totalValue / newStock : data.purchasePrice;
    }

    await drizzleDb.insert(bakeryStockMovements).values({
      id,
      organizationId,
      articleId: data.articleId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      documentReference: data.documentReference || null,
      lotNumber: data.lotNumber || null,
      purchasePrice: data.purchasePrice || null,
      movementDate: new Date(data.movementDate),
      responsibleId: userId,
      comment: data.comment || null,
      isValidated: false,
      createdAt: now,
    });

    // Update article stock
    await drizzleDb
      .update(bakeryArticles)
      .set({
        currentStock: newStock,
        averagePurchasePrice: newAveragePrice,
        updatedAt: now,
      })
      .where(and(eq(bakeryArticles.id, data.articleId), eq(bakeryArticles.organizationId, organizationId)));

    // Check for stock alerts
    await this.checkAndCreateAlerts(organizationId, data.articleId, newStock, article);

    const movement = await drizzleDb
      .select()
      .from(bakeryStockMovements)
      .where(eq(bakeryStockMovements.id, id))
      .get() as BakeryStockMovement;

    return movement;
  }

  /**
   * List stock movements
   */
  async listMovements(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryStockMovement[]; total: number }> {
    const conditions: any[] = [eq(bakeryStockMovements.organizationId, organizationId)];

    if (filters.articleId) {
      conditions.push(eq(bakeryStockMovements.articleId, filters.articleId));
    }

    if (filters.type) {
      conditions.push(eq(bakeryStockMovements.type, filters.type as any));
    }

    if (filters.startDate) {
      conditions.push(sql`${bakeryStockMovements.movementDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryStockMovements.movementDate} <= ${filters.endDate}`);
    }

    const items = await drizzleDb
      .select()
      .from(bakeryStockMovements)
      .where(and(...conditions))
      .orderBy(desc(bakeryStockMovements.movementDate))
      .all() as BakeryStockMovement[];

    // Pagination
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
   * Validate stock movement
   */
  async validateMovement(
    organizationId: string,
    id: string,
    userId: string
  ): Promise<BakeryStockMovement> {
    await drizzleDb
      .update(bakeryStockMovements)
      .set({
        isValidated: true,
        validatedById: userId,
        validatedAt: new Date(),
      })
      .where(and(
        eq(bakeryStockMovements.id, id),
        eq(bakeryStockMovements.organizationId, organizationId)
      ));

    const movement = await drizzleDb
      .select()
      .from(bakeryStockMovements)
      .where(eq(bakeryStockMovements.id, id))
      .get() as BakeryStockMovement;

    if (!movement) {
      throw new Error('Movement not found');
    }

    return movement;
  }

  /**
   * Check and create stock alerts
   */
  private async checkAndCreateAlerts(
    organizationId: string,
    articleId: string,
    currentStock: number,
    article: BakeryArticle
  ): Promise<void> {
    // Check minimum stock
    if (article.minimumStock && currentStock <= article.minimumStock) {
      const existingAlert = await drizzleDb
        .select()
        .from(bakeryStockAlerts)
        .where(and(
          eq(bakeryStockAlerts.articleId, articleId),
          eq(bakeryStockAlerts.alertType, 'stock_minimum'),
          isNull(bakeryStockAlerts.acknowledgedAt)
        ))
        .get();

      if (!existingAlert) {
        await drizzleDb.insert(bakeryStockAlerts).values({
          id: crypto.randomUUID(),
          organizationId,
          articleId,
          alertType: 'stock_minimum',
          currentStock,
          thresholdTriggered: article.minimumStock,
          isAcknowledged: false,
        });
      }
    }

    // Check for rupture
    if (currentStock === 0) {
      const existingAlert = await drizzleDb
        .select()
        .from(bakeryStockAlerts)
        .where(and(
          eq(bakeryStockAlerts.articleId, articleId),
          eq(bakeryStockAlerts.alertType, 'stock_minimum'),
          isNull(bakeryStockAlerts.acknowledgedAt)
        ))
        .get();

      if (!existingAlert) {
        await drizzleDb.insert(bakeryStockAlerts).values({
          id: crypto.randomUUID(),
          organizationId,
          articleId,
          alertType: 'stock_minimum',
          currentStock: 0,
          thresholdTriggered: 0,
          isAcknowledged: false,
        });
      }
    }
  }

  /**
   * List stock alerts
   */
  async listAlerts(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryStockAlert[]; total: number }> {
    const conditions: any[] = [eq(bakeryStockAlerts.organizationId, organizationId)];

    if (filters.alertType) {
      conditions.push(eq(bakeryStockAlerts.alertType, filters.alertType as any));
    }

    if (filters.acknowledged === 'true') {
      conditions.push(eq(bakeryStockAlerts.isAcknowledged, true));
    } else if (filters.acknowledged === 'false') {
      conditions.push(eq(bakeryStockAlerts.isAcknowledged, false));
    }

    const items = await drizzleDb
      .select()
      .from(bakeryStockAlerts)
      .where(and(...conditions))
      .orderBy(desc(bakeryStockAlerts.alertDate))
      .all() as BakeryStockAlert[];

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
   * Acknowledge stock alert
   */
  async acknowledgeAlert(
    organizationId: string,
    id: string,
    userId: string
  ): Promise<BakeryStockAlert> {
    await drizzleDb
      .update(bakeryStockAlerts)
      .set({
        isAcknowledged: true,
        acknowledgedById: userId,
        acknowledgedAt: new Date(),
      })
      .where(and(
        eq(bakeryStockAlerts.id, id),
        eq(bakeryStockAlerts.organizationId, organizationId)
      ));

    const alert = await drizzleDb
      .select()
      .from(bakeryStockAlerts)
      .where(eq(bakeryStockAlerts.id, id))
      .get() as BakeryStockAlert;

    if (!alert) {
      throw new Error('Alert not found');
    }

    return alert;
  }

  /**
   * Create inventory
   */
  async createInventory(
    organizationId: string,
    type: 'quotidien' | 'mensuel' | 'annuel',
    userId: string
  ): Promise<BakeryInventory> {
    const now = new Date();
    const id = crypto.randomUUID();

    // Get all active articles
    const articles = await drizzleDb
      .select()
      .from(bakeryArticles)
      .where(and(
        eq(bakeryArticles.organizationId, organizationId),
        eq(bakeryArticles.isActive, true)
      ))
      .all() as BakeryArticle[];

    // Create inventory
    await drizzleDb.insert(bakeryInventories).values({
      id,
      organizationId,
      inventoryDate: now,
      type,
      status: 'en_cours',
      responsibleId: userId,
      createdAt: now,
    });

    // Create inventory lines for each article
    for (const article of articles) {
      await drizzleDb.insert(bakeryInventoryLines).values({
        id: crypto.randomUUID(),
        inventoryId: id,
        articleId: article.id,
        theoreticalStock: article.currentStock || 0,
        actualStock: article.currentStock || 0, // Default to theoretical
        variance: 0,
        varianceValue: 0,
        createdAt: now,
      });
    }

    const inventory = await drizzleDb
      .select()
      .from(bakeryInventories)
      .where(eq(bakeryInventories.id, id))
      .get() as BakeryInventory;

    return inventory;
  }

  /**
   * List inventories
   */
  async listInventories(
    organizationId: string,
    filters: QueryFilters
  ): Promise<{ items: BakeryInventory[]; total: number }> {
    const conditions: any[] = [eq(bakeryInventories.organizationId, organizationId)];

    if (filters.startDate) {
      conditions.push(sql`${bakeryInventories.inventoryDate} >= ${filters.startDate}`);
    }

    if (filters.endDate) {
      conditions.push(sql`${bakeryInventories.inventoryDate} <= ${filters.endDate}`);
    }

    const items = await drizzleDb
      .select()
      .from(bakeryInventories)
      .where(and(...conditions))
      .orderBy(desc(bakeryInventories.inventoryDate))
      .all() as BakeryInventory[];

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
   * Update inventory lines
   */
  async updateInventoryLines(
    organizationId: string,
    inventoryId: string,
    lines: Array<{ articleId: string; actualStock: number; justification?: string }>
  ): Promise<BakeryInventory> {
    for (const line of lines) {
      // Get article for price calculation
      const article = await this.getArticle(organizationId, line.articleId);
      if (!article) continue;

      // Get current line
      const existingLine = await drizzleDb
        .select()
        .from(bakeryInventoryLines)
        .where(and(
          eq(bakeryInventoryLines.inventoryId, inventoryId),
          eq(bakeryInventoryLines.articleId, line.articleId)
        ))
        .get() as BakeryInventoryLine;

      if (existingLine) {
        const variance = line.actualStock - existingLine.theoreticalStock;
        const varianceValue = variance * (article.averagePurchasePrice || 0);

        await drizzleDb
          .update(bakeryInventoryLines)
          .set({
            actualStock: line.actualStock,
            variance,
            varianceValue,
            justification: line.justification || null,
          })
          .where(eq(bakeryInventoryLines.id, existingLine.id));
      }
    }

    const inventory = await drizzleDb
      .select()
      .from(bakeryInventories)
      .where(eq(bakeryInventories.id, inventoryId))
      .get() as BakeryInventory;

    return inventory;
  }

  /**
   * Validate inventory and generate adjustments
   */
  async validateInventory(
    organizationId: string,
    inventoryId: string,
    userId: string
  ): Promise<BakeryInventory> {
    const now = new Date();

    // Get all lines with variances
    const lines = await drizzleDb
      .select()
      .from(bakeryInventoryLines)
      .where(eq(bakeryInventoryLines.inventoryId, inventoryId))
      .all() as BakeryInventoryLine[];

    // Create adjustment movements for variances
    for (const line of lines) {
      if (line.variance !== 0) {
        await this.createMovement(organizationId, {
          articleId: line.articleId,
          type: 'inventaire',
          quantity: line.actualStock,
          reason: `Ajustement inventaire - ${line.justification || 'Écart constaté'}`,
          documentReference: `INV-${inventoryId}`,
          movementDate: now.toISOString(),
        }, userId);
      }
    }

    // Update inventory status
    await drizzleDb
      .update(bakeryInventories)
      .set({
        status: 'valide',
        validatedById: userId,
        validatedAt: now,
      })
      .where(eq(bakeryInventories.id, inventoryId));

    const inventory = await drizzleDb
      .select()
      .from(bakeryInventories)
      .where(eq(bakeryInventories.id, inventoryId))
      .get() as BakeryInventory;

    return inventory;
  }
}

export const bakeryStockService = new BakeryStockService();
