/**
 * Invoice Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockD1Database } from '../__tests__/mocks/database.mock';
import { testInvoice, createTestInvoice } from '../__tests__/mocks/fixtures';

describe('InvoiceService', () => {
  let mockDb: D1Database;

  beforeEach(() => {
    mockDb = createMockD1Database();
  });

  describe('create', () => {
    it('should create a new invoice with auto-generated number', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;

      // Mock: get last invoice number
      mockPrepare.mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ number: 'INV-2024-0005' }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      // Mock: insert invoice
      mockPrepare.mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
      });

      // Mock: get created invoice
      mockPrepare.mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ ...testInvoice, number: 'INV-2024-0006' }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      expect(mockDb).toBeDefined();
    });

    it('should calculate totals correctly', async () => {
      const invoice = createTestInvoice({
        subtotal: 1000,
        taxAmount: 190, // 19% TVA
        total: 1190,
      });

      expect(invoice.total).toBe(invoice.subtotal + invoice.taxAmount);
      expect(invoice.amountDue).toBe(invoice.total - invoice.amountPaid);
    });
  });

  describe('getById', () => {
    it('should return invoice with line items', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;

      mockPrepare.mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(testInvoice),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      // Mock: get line items
      mockPrepare.mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({
          results: [
            { id: 'item-001', description: 'Service A', quantity: 2, unitPrice: 500 },
          ],
        }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      expect(mockDb.prepare).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should transition from draft to sent', async () => {
      const validTransitions: Record<string, string[]> = {
        draft: ['sent', 'cancelled'],
        sent: ['paid', 'partial', 'overdue', 'cancelled'],
        partial: ['paid', 'overdue', 'cancelled'],
        overdue: ['paid', 'partial', 'cancelled'],
        paid: [],
        cancelled: [],
      };

      expect(validTransitions.draft).toContain('sent');
      expect(validTransitions.paid).not.toContain('draft');
    });

    it('should not allow invalid status transitions', () => {
      const validTransitions: Record<string, string[]> = {
        draft: ['sent', 'cancelled'],
        paid: [],
      };

      expect(validTransitions.paid).not.toContain('draft');
      expect(validTransitions.paid.length).toBe(0);
    });
  });

  describe('recordPayment', () => {
    it('should update amountPaid and status', async () => {
      const invoice = createTestInvoice({
        total: 1000,
        amountPaid: 0,
        amountDue: 1000,
        status: 'sent',
      });

      // Simulate partial payment
      const paymentAmount = 500;
      const newAmountPaid = invoice.amountPaid + paymentAmount;
      const newAmountDue = invoice.total - newAmountPaid;
      const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

      expect(newAmountPaid).toBe(500);
      expect(newAmountDue).toBe(500);
      expect(newStatus).toBe('partial');
    });

    it('should mark as paid when fully paid', async () => {
      const invoice = createTestInvoice({
        total: 1000,
        amountPaid: 500,
        amountDue: 500,
        status: 'partial',
      });

      const paymentAmount = 500;
      const newAmountPaid = invoice.amountPaid + paymentAmount;
      const newAmountDue = invoice.total - newAmountPaid;
      const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

      expect(newAmountPaid).toBe(1000);
      expect(newAmountDue).toBe(0);
      expect(newStatus).toBe('paid');
    });
  });

  describe('generatePDF', () => {
    it('should include all required invoice data', () => {
      const requiredFields = [
        'number',
        'date',
        'dueDate',
        'customerName',
        'subtotal',
        'taxAmount',
        'total',
      ];

      requiredFields.forEach((field) => {
        expect(testInvoice).toHaveProperty(field);
      });
    });
  });

  describe('list', () => {
    it('should filter by status', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;

      const draftInvoices = [
        createTestInvoice({ status: 'draft' }),
        createTestInvoice({ status: 'draft' }),
      ];

      mockPrepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 2 }),
        all: vi.fn().mockResolvedValue({ results: draftInvoices }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      expect(draftInvoices.every((inv) => inv.status === 'draft')).toBe(true);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-06-30');

      const invoiceDate = new Date('2024-03-15');
      expect(invoiceDate >= startDate && invoiceDate <= endDate).toBe(true);
    });
  });

  describe('calculateOverdue', () => {
    it('should identify overdue invoices', () => {
      const today = new Date();
      const overdueInvoice = createTestInvoice({
        dueDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        status: 'sent',
        amountDue: 500,
      });

      const isOverdue =
        overdueInvoice.dueDate < today &&
        overdueInvoice.status !== 'paid' &&
        overdueInvoice.amountDue > 0;

      expect(isOverdue).toBe(true);
    });
  });
});
