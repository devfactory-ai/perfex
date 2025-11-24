/**
 * Inventory Module Types
 */

export type StockMovementType = 'in' | 'out' | 'transfer' | 'adjustment';
export type AdjustmentReason = 'damage' | 'loss' | 'found' | 'count_correction' | 'expired' | 'other';
export type AdjustmentStatus = 'draft' | 'approved' | 'cancelled';

/**
 * Inventory Item
 */
export interface InventoryItem {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  costPrice: number | null;
  sellingPrice: number | null;
  currency: string;
  unit: string;
  trackInventory: boolean;
  minStockLevel: number;
  maxStockLevel: number | null;
  reorderQuantity: number | null;
  active: boolean;
  imageUrl: string | null;
  barcode: string | null;
  tags: string | null; // JSON array
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Inventory Item with stock levels
 */
export interface InventoryItemWithStock extends InventoryItem {
  totalStock?: number;
  availableStock?: number;
  reservedStock?: number;
  stockByWarehouse?: StockLevel[];
}

/**
 * Warehouse
 */
export interface Warehouse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Stock Level
 */
export interface StockLevel {
  id: string;
  organizationId: string;
  itemId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: Date;
}

/**
 * Stock Movement
 */
export interface StockMovement {
  id: string;
  organizationId: string;
  itemId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  referenceType: string | null;
  referenceId: string | null;
  referenceNumber: string | null;
  reason: string | null;
  notes: string | null;
  unitCost: number | null;
  createdBy: string;
  createdAt: Date;
}

/**
 * Stock Adjustment
 */
export interface StockAdjustment {
  id: string;
  organizationId: string;
  warehouseId: string;
  adjustmentNumber: string;
  adjustmentDate: Date;
  reason: string;
  status: AdjustmentStatus;
  totalValue: number;
  approvedBy: string | null;
  approvedAt: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Stock Adjustment Line
 */
export interface StockAdjustmentLine {
  id: string;
  organizationId: string;
  adjustmentId: string;
  itemId: string;
  oldQuantity: number;
  newQuantity: number;
  quantityDifference: number;
  unitCost: number | null;
  lineValue: number | null;
  notes: string | null;
  createdAt: Date;
}

/**
 * Stock Adjustment with lines
 */
export interface StockAdjustmentWithLines extends StockAdjustment {
  lines: StockAdjustmentLine[];
}
