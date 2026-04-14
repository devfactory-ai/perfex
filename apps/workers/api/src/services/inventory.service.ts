/**
 * Inventory Service
 * Manage inventory items and stock levels
 */

import { eq, and, desc, like, or, sum, lt, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { inventoryItems, warehouses, stockLevels } from '@perfex/database';
import type { InventoryItem, Warehouse, CreateInventoryItemInput, UpdateInventoryItemInput, CreateWarehouseInput, UpdateWarehouseInput } from '@perfex/shared';

export class InventoryService {
  /**
   * Create inventory item
   */
  async createItem(organizationId: string, userId: string, data: CreateInventoryItemInput): Promise<InventoryItem> {
    const now = new Date();
    const itemId = crypto.randomUUID();

    // Convert tags array to JSON string if provided
    const tagsJson = data.tags ? JSON.stringify(data.tags) : null;

    await getDb().insert(inventoryItems).values({
      id: itemId,
      organizationId,
      sku: data.sku,
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      costPrice: data.costPrice || null,
      sellingPrice: data.sellingPrice || null,
      currency: data.currency || 'EUR',
      unit: data.unit || 'unit',
      trackInventory: data.trackInventory ?? true,
      minStockLevel: data.minStockLevel ?? 0,
      maxStockLevel: data.maxStockLevel || null,
      reorderQuantity: data.reorderQuantity || null,
      active: data.active ?? true,
      imageUrl: data.imageUrl || null,
      barcode: data.barcode || null,
      tags: tagsJson,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const item = await this.getItemById(organizationId, itemId);
    if (!item) {
      throw new Error('Failed to create inventory item');
    }

    return item;
  }

  /**
   * Get item by ID
   */
  async getItemById(organizationId: string, itemId: string): Promise<InventoryItem | null> {
    const item = await getDb()
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.organizationId, organizationId)))
      .get() as any;

    return item || null;
  }

  /**
   * List inventory items
   */
  async listItems(
    organizationId: string,
    filters?: {
      category?: string;
      active?: string;
      search?: string;
    }
  ): Promise<InventoryItem[]> {
    const conditions: any[] = [eq(inventoryItems.organizationId, organizationId)];

    if (filters?.category) {
      conditions.push(eq(inventoryItems.category, filters.category));
    }

    if (filters?.active) {
      const isActive = filters.active === 'true';
      conditions.push(eq(inventoryItems.active, isActive));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(inventoryItems.name, searchTerm),
          like(inventoryItems.sku, searchTerm),
          like(inventoryItems.description, searchTerm)
        )
      );
    }

    const results = await getDb()
      .select()
      .from(inventoryItems)
      .where(and(...conditions))
      .orderBy(desc(inventoryItems.createdAt))
      .all() as any[];
    return results;
  }

  /**
   * Update inventory item
   */
  async updateItem(organizationId: string, itemId: string, data: UpdateInventoryItemInput): Promise<InventoryItem> {
    const existing = await this.getItemById(organizationId, itemId);
    if (!existing) {
      throw new Error('Inventory item not found');
    }

    const tagsJson = data.tags ? JSON.stringify(data.tags) : undefined;

    const updateData: any = {
      ...data,
      tags: tagsJson,
      updatedAt: new Date(),
    };

    await getDb()
      .update(inventoryItems)
      .set(updateData)
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.organizationId, organizationId)));

    const updated = await this.getItemById(organizationId, itemId);
    if (!updated) {
      throw new Error('Failed to update inventory item');
    }

    return updated;
  }

  /**
   * Delete inventory item
   */
  async deleteItem(organizationId: string, itemId: string): Promise<void> {
    const existing = await this.getItemById(organizationId, itemId);
    if (!existing) {
      throw new Error('Inventory item not found');
    }

    await getDb()
      .delete(inventoryItems)
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.organizationId, organizationId)));
  }

  /**
   * Create warehouse
   */
  async createWarehouse(organizationId: string, userId: string, data: CreateWarehouseInput): Promise<Warehouse> {
    const now = new Date();
    const warehouseId = crypto.randomUUID();

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await getDb()
        .update(warehouses)
        .set({ isDefault: false })
        .where(eq(warehouses.organizationId, organizationId));
    }

    await getDb().insert(warehouses).values({
      id: warehouseId,
      organizationId,
      name: data.name,
      code: data.code,
      description: data.description || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || null,
      contactPerson: data.contactPerson || null,
      phone: data.phone || null,
      email: data.email || null,
      isDefault: data.isDefault ?? false,
      active: data.active ?? true,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    const warehouse = await this.getWarehouseById(organizationId, warehouseId);
    if (!warehouse) {
      throw new Error('Failed to create warehouse');
    }

    return warehouse;
  }

  /**
   * Get warehouse by ID
   */
  async getWarehouseById(organizationId: string, warehouseId: string): Promise<Warehouse | null> {
    const warehouse = await getDb()
      .select()
      .from(warehouses)
      .where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, organizationId)))
      .get() as any;

    return warehouse || null;
  }

  /**
   * List warehouses
   */
  async listWarehouses(organizationId: string, filters?: { active?: string }): Promise<Warehouse[]> {
    const conditions: any[] = [eq(warehouses.organizationId, organizationId)];

    if (filters?.active) {
      const isActive = filters.active === 'true';
      conditions.push(eq(warehouses.active, isActive));
    }

    const results = await getDb()
      .select()
      .from(warehouses)
      .where(and(...conditions))
      .orderBy(desc(warehouses.createdAt))
      .all() as any[];
    return results;
  }

  /**
   * Update warehouse
   */
  async updateWarehouse(organizationId: string, warehouseId: string, data: UpdateWarehouseInput): Promise<Warehouse> {
    const existing = await this.getWarehouseById(organizationId, warehouseId);
    if (!existing) {
      throw new Error('Warehouse not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await getDb()
        .update(warehouses)
        .set({ isDefault: false })
        .where(eq(warehouses.organizationId, organizationId));
    }

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    await getDb()
      .update(warehouses)
      .set(updateData)
      .where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, organizationId)));

    const updated = await this.getWarehouseById(organizationId, warehouseId);
    if (!updated) {
      throw new Error('Failed to update warehouse');
    }

    return updated;
  }

  /**
   * Delete warehouse
   */
  async deleteWarehouse(organizationId: string, warehouseId: string): Promise<void> {
    const existing = await this.getWarehouseById(organizationId, warehouseId);
    if (!existing) {
      throw new Error('Warehouse not found');
    }

    await getDb()
      .delete(warehouses)
      .where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, organizationId)));
  }

  /**
   * Get inventory statistics
   */
  async getStats(organizationId: string): Promise<{
    totalItems: number;
    activeItems: number;
    totalWarehouses: number;
    lowStockItems: number;
  }> {
    const allItems = await this.listItems(organizationId);
    const allWarehouses = await this.listWarehouses(organizationId);

    // Calculate low stock items by comparing total stock to min_stock_level
    const lowStockResult = await getDb()
      .select({
        itemId: stockLevels.itemId,
        totalQuantity: sum(stockLevels.quantity).as('total_quantity'),
      })
      .from(stockLevels)
      .innerJoin(inventoryItems, eq(stockLevels.itemId, inventoryItems.id))
      .where(
        and(
          eq(stockLevels.organizationId, organizationId),
          eq(inventoryItems.active, true),
          eq(inventoryItems.trackInventory, true)
        )
      )
      .groupBy(stockLevels.itemId);

    // Count items where total quantity is below min stock level
    let lowStockCount = 0;
    for (const row of lowStockResult) {
      const item = allItems.find(i => i.id === row.itemId);
      if (item && item.minStockLevel && Number(row.totalQuantity) < item.minStockLevel) {
        lowStockCount++;
      }
    }

    return {
      totalItems: allItems.length,
      activeItems: allItems.filter(i => i.active).length,
      totalWarehouses: allWarehouses.length,
      lowStockItems: lowStockCount,
    };
  }
}

export const inventoryService = new InventoryService();
