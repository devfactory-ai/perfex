/**
 * Asset Management Module Types
 */

export type DepreciationMethod = 'straight_line' | 'declining_balance' | 'units_of_production';
export type AssetStatus = 'active' | 'disposed' | 'sold' | 'donated' | 'lost';
export type MaintenanceType = 'preventive' | 'corrective' | 'inspection' | 'calibration';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface AssetCategory {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  depreciationMethod: DepreciationMethod;
  usefulLife: number | null;
  salvageValuePercent: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FixedAsset {
  id: string;
  organizationId: string;
  assetNumber: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string | null;
  purchaseDate: Date | null;
  purchaseCost: number;
  currentValue: number;
  salvageValue: number;
  usefulLife: number | null;
  depreciationMethod: DepreciationMethod;
  accumulatedDepreciation: number;
  status: AssetStatus;
  disposalDate: Date | null;
  disposalValue: number | null;
  disposalNotes: string | null;
  warrantyExpiry: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetDepreciation {
  id: string;
  organizationId: string;
  assetId: string;
  periodStart: Date;
  periodEnd: Date;
  depreciationAmount: number;
  openingValue: number;
  closingValue: number;
  journalEntryId: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface AssetMaintenance {
  id: string;
  organizationId: string;
  assetId: string;
  maintenanceNumber: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: Date | null;
  completedDate: Date | null;
  performedBy: string | null;
  vendor: string | null;
  description: string | null;
  workPerformed: string | null;
  cost: number;
  downtime: number;
  nextMaintenanceDate: Date | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetTransfer {
  id: string;
  organizationId: string;
  assetId: string;
  transferNumber: string;
  fromLocation: string | null;
  toLocation: string;
  transferDate: Date;
  reason: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}
