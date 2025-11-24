/**
 * Payment Modal Component
 * Record payments with optional invoice allocation
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPaymentSchema, type CreatePaymentInput } from '@perfex/shared';
import { z } from 'zod';
import { format } from 'date-fns';

// Adjust schema for form - make some fields optional/nullable
const paymentFormSchema = createPaymentSchema.extend({
  reference: z.string().optional(),
  notes: z.string().optional().nullable(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePaymentInput) => Promise<void>;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  isSubmitting?: boolean;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  invoiceId,
  invoiceNumber,
  invoiceAmount,
  isSubmitting = false,
}: PaymentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      reference: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: invoiceAmount || 0,
      currency: 'EUR',
      paymentMethod: 'bank_transfer',
      customerId: null,
      supplierId: null,
      accountId: null,
      notes: '',
    },
  });

  // Reset form when modal opens or invoice changes
  useEffect(() => {
    if (isOpen) {
      reset({
        reference: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: invoiceAmount || 0,
        currency: 'EUR',
        paymentMethod: 'bank_transfer',
        customerId: null,
        supplierId: null,
        accountId: null,
        notes: invoiceNumber ? `Payment for invoice ${invoiceNumber}` : '',
      });
    }
  }, [isOpen, invoiceId, invoiceNumber, invoiceAmount, reset]);

  const handleFormSubmit = async (data: PaymentFormData) => {
    const cleanedData: CreatePaymentInput = {
      ...data,
      reference: data.reference || undefined,
      notes: data.notes || null,
      // If we have an invoiceId, add it to the allocations
      invoiceAllocations: invoiceId
        ? [{ invoiceId, amount: data.amount }]
        : undefined,
    };

    await onSubmit(cleanedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Record Payment</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {invoiceNumber && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-medium text-blue-900">
                  Recording payment for Invoice {invoiceNumber}
                </p>
                {invoiceAmount && (
                  <p className="text-sm text-blue-700 mt-1">
                    Amount due: €{invoiceAmount.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Date <span className="text-destructive">*</span>
              </label>
              <input
                {...register('date')}
                type="date"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {errors.date && (
                <p className="text-destructive text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Amount <span className="text-destructive">*</span>
              </label>
              <input
                {...register('amount', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-destructive text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                {...register('currency')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="XOF">XOF (CFA)</option>
              </select>
              {errors.currency && (
                <p className="text-destructive text-sm mt-1">{errors.currency.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Method <span className="text-destructive">*</span>
              </label>
              <select
                {...register('paymentMethod')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="credit_card">Credit Card</option>
                <option value="other">Other</option>
              </select>
              {errors.paymentMethod && (
                <p className="text-destructive text-sm mt-1">{errors.paymentMethod.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reference</label>
              <input
                {...register('reference')}
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., Check #12345 or Transaction ID"
              />
              {errors.reference && (
                <p className="text-destructive text-sm mt-1">{errors.reference.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Will be auto-generated if not provided
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Add any notes about this payment"
              />
              {errors.notes && (
                <p className="text-destructive text-sm mt-1">{errors.notes.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end p-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
