/**
 * Sales Module Types
 */

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type SalesOrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryStatus = 'draft' | 'shipped' | 'delivered';

export interface Quote {
  id: string;
  organizationId: string;
  quoteNumber: string;
  companyId: string;
  contactId: string | null;
  quoteDate: Date;
  validUntil: Date | null;
  status: QuoteStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrder {
  id: string;
  organizationId: string;
  orderNumber: string;
  quoteId: string | null;
  companyId: string;
  contactId: string | null;
  orderDate: Date;
  expectedDeliveryDate: Date | null;
  status: SalesOrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  currency: string;
  shippingAddress: string | null;
  billingAddress: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrderLine {
  id: string;
  organizationId: string;
  salesOrderId: string;
  itemId: string | null;
  description: string;
  quantity: number;
  quantityShipped: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discountPercent: number;
  lineTotal: number;
  createdAt: Date;
}

export interface DeliveryNote {
  id: string;
  organizationId: string;
  deliveryNumber: string;
  salesOrderId: string;
  deliveryDate: Date;
  status: DeliveryStatus;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
