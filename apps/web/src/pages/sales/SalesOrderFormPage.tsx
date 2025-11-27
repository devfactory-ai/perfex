/**
 * Sales Order Form Page
 * Create and edit sales orders on a dedicated page
 */

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SalesOrder, Company, Contact } from '@perfex/shared';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { z } from 'zod';

// Form schema
const salesOrderFormSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  contactId: z.string().optional().or(z.literal('')),
  quoteId: z.string().optional().or(z.literal('')),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedDeliveryDate: z.string().optional().or(z.literal('')),
  currency: z.string().length(3).default('EUR'),
  shippingAddress: z.string().max(1000).optional().or(z.literal('')),
  billingAddress: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  lines: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.string().min(1, 'Quantity is required'),
    unit: z.string().default('unit'),
    unitPrice: z.string().min(1, 'Unit price is required'),
    taxRate: z.string().default('0'),
    discountPercent: z.string().default('0'),
  })).min(1, 'At least one line item is required'),
});

type SalesOrderFormData = z.infer<typeof salesOrderFormSchema>;

export function SalesOrderFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Fetch sales order data if editing
  const { data: salesOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['sales-order', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<ApiResponse<any>>(`/sales/orders/${id}`);
      return response.data.data;
    },
    enabled: isEditMode,
  });

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Company[]>>('/companies');
      return response.data.data;
    },
  });

  // Fetch contacts for selected company
  const { data: contacts } = useQuery({
    queryKey: ['contacts', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const response = await api.get<ApiResponse<Contact[]>>(`/contacts?companyId=${selectedCompanyId}`);
      return response.data.data;
    },
    enabled: !!selectedCompanyId,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SalesOrderFormData>({
    resolver: zodResolver(salesOrderFormSchema),
    defaultValues: {
      companyId: '',
      contactId: '',
      quoteId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      currency: 'EUR',
      shippingAddress: '',
      billingAddress: '',
      notes: '',
      lines: [{ description: '', quantity: '1', unit: 'unit', unitPrice: '0', taxRate: '0', discountPercent: '0' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  // Watch company changes
  const watchedCompanyId = watch('companyId');
  useEffect(() => {
    setSelectedCompanyId(watchedCompanyId);
  }, [watchedCompanyId]);

  // Update form when sales order data is loaded
  useEffect(() => {
    if (salesOrder) {
      setSelectedCompanyId(salesOrder.companyId);
      reset({
        companyId: salesOrder.companyId || '',
        contactId: salesOrder.contactId || '',
        quoteId: salesOrder.quoteId || '',
        orderDate: salesOrder.orderDate ? new Date(salesOrder.orderDate).toISOString().split('T')[0] : '',
        expectedDeliveryDate: salesOrder.expectedDeliveryDate ? new Date(salesOrder.expectedDeliveryDate).toISOString().split('T')[0] : '',
        currency: salesOrder.currency || 'EUR',
        shippingAddress: salesOrder.shippingAddress || '',
        billingAddress: salesOrder.billingAddress || '',
        notes: salesOrder.notes || '',
        lines: salesOrder.lines?.map((line: any) => ({
          description: line.description || '',
          quantity: line.quantity?.toString() || '1',
          unit: line.unit || 'unit',
          unitPrice: line.unitPrice?.toString() || '0',
          taxRate: line.taxRate?.toString() || '0',
          discountPercent: line.discountPercent?.toString() || '0',
        })) || [{ description: '', quantity: '1', unit: 'unit', unitPrice: '0', taxRate: '0', discountPercent: '0' }],
      });
    }
  }, [salesOrder, reset]);

  // Create sales order mutation
  const createSalesOrder = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<SalesOrder>>('/sales/orders', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      alert('Sales order created successfully!');
      navigate('/sales/orders');
    },
    onError: (error) => {
      alert(`Failed to create sales order: ${getErrorMessage(error)}`);
    },
  });

  // Update sales order mutation
  const updateSalesOrder = useMutation({
    mutationFn: async (data: any) => {
      if (!id) throw new Error('Sales order ID is required');
      const response = await api.put<ApiResponse<SalesOrder>>(`/sales/orders/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      alert('Sales order updated successfully!');
      navigate('/sales/orders');
    },
    onError: (error) => {
      alert(`Failed to update sales order: ${getErrorMessage(error)}`);
    },
  });

  const handleFormSubmit = async (data: SalesOrderFormData) => {
    const cleanedData: any = {
      companyId: data.companyId,
      contactId: data.contactId || null,
      quoteId: data.quoteId || null,
      orderDate: data.orderDate,
      expectedDeliveryDate: data.expectedDeliveryDate || null,
      currency: data.currency,
      shippingAddress: data.shippingAddress || null,
      billingAddress: data.billingAddress || null,
      notes: data.notes || null,
      lines: data.lines.map((line) => ({
        description: line.description,
        quantity: parseFloat(line.quantity),
        unit: line.unit,
        unitPrice: parseFloat(line.unitPrice),
        taxRate: parseFloat(line.taxRate),
        discountPercent: parseFloat(line.discountPercent),
      })),
    };

    if (isEditMode) {
      // For updates, only send allowed fields
      const updateData = {
        expectedDeliveryDate: cleanedData.expectedDeliveryDate,
        notes: cleanedData.notes,
      };
      await updateSalesOrder.mutateAsync(updateData);
    } else {
      await createSalesOrder.mutateAsync(cleanedData);
    }
  };

  const isSubmitting = createSalesOrder.isPending || updateSalesOrder.isPending;

  if (isEditMode && isLoadingOrder) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading sales order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Sales Order' : 'Create Sales Order'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update sales order information' : 'Create a new sales order for a customer'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/sales/orders')}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card">
          <div className="p-6 space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Customer Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('companyId')}
                    disabled={isEditMode}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">Select company</option>
                    {companies?.filter(c => c.type === 'customer').map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {errors.companyId && (
                    <p className="text-destructive text-sm mt-1">{errors.companyId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Contact</label>
                  <select
                    {...register('contactId')}
                    disabled={isEditMode || !selectedCompanyId}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">Select contact</option>
                    {contacts?.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Order Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Order Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('orderDate')}
                    type="date"
                    disabled={isEditMode}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                  {errors.orderDate && (
                    <p className="text-destructive text-sm mt-1">{errors.orderDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expected Delivery Date</label>
                  <input
                    {...register('expectedDeliveryDate')}
                    type="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    {...register('currency')}
                    disabled={isEditMode}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Line Items */}
            {!isEditMode && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Line Items</h3>
                  <button
                    type="button"
                    onClick={() => append({ description: '', quantity: '1', unit: 'unit', unitPrice: '0', taxRate: '0', discountPercent: '0' })}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
                  >
                    Add Line
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid gap-3 md:grid-cols-8 p-3 rounded-md border">
                      <div className="md:col-span-2">
                        <input
                          {...register(`lines.${index}.description`)}
                          type="text"
                          placeholder="Description"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        {errors.lines?.[index]?.description && (
                          <p className="text-destructive text-xs mt-1">{errors.lines[index]?.description?.message}</p>
                        )}
                      </div>
                      <div>
                        <input
                          {...register(`lines.${index}.quantity`)}
                          type="number"
                          step="0.01"
                          placeholder="Qty"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          {...register(`lines.${index}.unit`)}
                          type="text"
                          placeholder="Unit"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          {...register(`lines.${index}.unitPrice`)}
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          {...register(`lines.${index}.taxRate`)}
                          type="number"
                          step="0.01"
                          placeholder="Tax %"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          {...register(`lines.${index}.discountPercent`)}
                          type="number"
                          step="0.01"
                          placeholder="Disc %"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.lines && typeof errors.lines.message === 'string' && (
                  <p className="text-destructive text-sm mt-2">{errors.lines.message}</p>
                )}
              </div>
            )}

            {/* Addresses */}
            {!isEditMode && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Addresses</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Shipping Address</label>
                    <textarea
                      {...register('shippingAddress')}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Shipping address..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Billing Address</label>
                    <textarea
                      {...register('billingAddress')}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Billing address..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Additional Information</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end p-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/sales/orders')}
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
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
