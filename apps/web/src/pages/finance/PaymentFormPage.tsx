/**
 * Payment Form Page
 * Record new payments on a dedicated page
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreatePaymentInput, Account, Company } from '@perfex/shared';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { z } from 'zod';

// Form schema that matches the UI needs
const paymentFormSchema = z.object({
  reference: z.string().optional().or(z.literal('')),
  date: z.string().min(1, 'Date is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().length(3).default('EUR'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'credit_card', 'other']).default('cash'),
  customerId: z.string().optional().or(z.literal('')),
  supplierId: z.string().optional().or(z.literal('')),
  accountId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export function PaymentFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch accounts for dropdown
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Account[]>>('/accounts');
      return response.data.data;
    },
  });

  // Fetch companies for dropdown
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Company[]>>('/companies');
      return response.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      reference: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      currency: 'EUR',
      paymentMethod: 'cash',
      customerId: '',
      supplierId: '',
      accountId: '',
      notes: '',
    },
  });

  // Create payment mutation
  const createPayment = useMutation({
    mutationFn: async (data: CreatePaymentInput) => {
      const response = await api.post<ApiResponse<any>>('/payments', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('Payment recorded successfully!');
      navigate('/finance/payments');
    },
    onError: (error) => {
      alert(`Failed to record payment: ${getErrorMessage(error)}`);
    },
  });

  const handleFormSubmit = async (data: PaymentFormData) => {
    const cleanedData: CreatePaymentInput = {
      reference: data.reference || undefined,
      date: data.date,
      amount: parseFloat(data.amount),
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      customerId: data.customerId || null,
      supplierId: data.supplierId || null,
      accountId: data.accountId || null,
      notes: data.notes || null,
    };

    await createPayment.mutateAsync(cleanedData);
  };

  const isSubmitting = createPayment.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Payment</h1>
          <p className="text-muted-foreground">
            Record a new payment transaction
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/finance/payments')}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card">
          <div className="p-6 space-y-6">
            {/* Payment Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Payment Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Reference</label>
                  <input
                    {...register('reference')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="PAY-001 (auto-generated if empty)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to auto-generate
                  </p>
                </div>

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
                    {...register('amount')}
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="1000.00"
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
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Payment Method <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('paymentMethod')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Account</label>
                  <select
                    {...register('accountId')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select account</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Link to chart of accounts
                  </p>
                </div>
              </div>
            </div>

            {/* Customer/Supplier Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Customer/Supplier</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Customer</label>
                  <select
                    {...register('customerId')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select customer</option>
                    {companies?.filter(c => c.type === 'customer').map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    For payments from customers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Supplier</label>
                  <select
                    {...register('supplierId')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select supplier</option>
                    {companies?.filter(c => c.type === 'vendor').map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    For payments to suppliers/vendors
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Optional notes about this payment..."
                  />
                </div>
              </div>
            </div>

            {/* Information Notice */}
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Payment Recording
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>This payment will be recorded in your accounting records. You can optionally link it to a customer or supplier, and allocate it to specific invoices.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end p-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/finance/payments')}
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
        </div>
      </form>
    </div>
  );
}
