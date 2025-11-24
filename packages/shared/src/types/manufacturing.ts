/**
 * Manufacturing Module Types
 */

export type BOMStatus = 'draft' | 'active' | 'obsolete';
export type RoutingStatus = 'draft' | 'active' | 'obsolete';
export type WorkOrderStatus = 'draft' | 'released' | 'in_progress' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type OperationStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface BillOfMaterials {
  id: string;
  organizationId: string;
  bomNumber: string;
  productId: string;
  version: string;
  description: string | null;
  quantity: number;
  unit: string;
  status: BOMStatus;
  effectiveDate: Date | null;
  expiryDate: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BOMLine {
  id: string;
  organizationId: string;
  bomId: string;
  itemId: string;
  quantity: number;
  unit: string;
  scrapPercent: number;
  position: number;
  notes: string | null;
  createdAt: Date;
}

export interface Routing {
  id: string;
  organizationId: string;
  routingNumber: string;
  productId: string;
  description: string | null;
  status: RoutingStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutingOperation {
  id: string;
  organizationId: string;
  routingId: string;
  operationNumber: string;
  name: string;
  description: string | null;
  workCenter: string | null;
  setupTime: number;
  cycleTime: number;
  laborCost: number;
  overheadCost: number;
  position: number;
  createdAt: Date;
}

export interface WorkOrder {
  id: string;
  organizationId: string;
  workOrderNumber: string;
  productId: string;
  bomId: string | null;
  routingId: string | null;
  salesOrderId: string | null;
  quantityPlanned: number;
  quantityProduced: number;
  unit: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledStartDate: Date | null;
  scheduledEndDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderOperation {
  id: string;
  organizationId: string;
  workOrderId: string;
  operationId: string | null;
  operationNumber: string;
  name: string;
  status: OperationStatus;
  scheduledStartDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  actualTime: number;
  notes: string | null;
  createdAt: Date;
}

export interface MaterialConsumption {
  id: string;
  organizationId: string;
  workOrderId: string;
  itemId: string;
  quantityPlanned: number;
  quantityConsumed: number;
  unit: string;
  consumedAt: Date | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
}
