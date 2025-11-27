/**
 * Supplier Form Page
 * Create and edit suppliers on a dedicated page
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Supplier } from '@perfex/shared';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { z } from 'zod';

// Form schema that matches the UI needs
const supplierFormSchema = z.object({
  supplierNumber: z.string().min(1, 'Supplier number is required').max(50),
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  companyName: z.string().max(200).optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  taxNumber: z.string().max(100).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  paymentTerms: z.enum(['net_7', 'net_15', 'net_30', 'net_60', 'net_90', 'due_on_receipt', 'cash_on_delivery', '']).default(''),
  currency: z.string().length(3).default('EUR'),
  creditLimit: z.string().optional().or(z.literal('')),
  rating: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  active: z.boolean().default(true),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

export function SupplierFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // Fetch supplier data if editing
  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<ApiResponse<Supplier>>(`/procurement/suppliers/${id}`);
      return response.data.data;
    },
    enabled: isEditMode,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      supplierNumber: '',
      name: '',
      companyName: '',
      email: '',
      phone: '',
      website: '',
      taxNumber: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      paymentTerms: '',
      currency: 'EUR',
      creditLimit: '',
      rating: '',
      notes: '',
      active: true,
    },
  });

  // Update form when supplier data is loaded
  useEffect(() => {
    if (supplier) {
      reset({
        supplierNumber: supplier.supplierNumber || '',
        name: supplier.name || '',
        companyName: supplier.companyName || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        website: supplier.website || '',
        taxNumber: supplier.taxNumber || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        postalCode: supplier.postalCode || '',
        country: supplier.country || '',
        paymentTerms: supplier.paymentTerms || '',
        currency: supplier.currency || 'EUR',
        creditLimit: supplier.creditLimit?.toString() || '',
        rating: supplier.rating?.toString() || '',
        notes: supplier.notes || '',
        active: supplier.active ?? true,
      });
    }
  }, [supplier, reset]);

  // Create supplier mutation
  const createSupplier = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<Supplier>>('/procurement/suppliers', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      alert('Supplier created successfully!');
      navigate('/procurement/suppliers');
    },
    onError: (error) => {
      alert(`Failed to create supplier: ${getErrorMessage(error)}`);
    },
  });

  // Update supplier mutation
  const updateSupplier = useMutation({
    mutationFn: async (data: any) => {
      if (!id) throw new Error('Supplier ID is required');
      const response = await api.put<ApiResponse<Supplier>>(`/procurement/suppliers/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
      alert('Supplier updated successfully!');
      navigate('/procurement/suppliers');
    },
    onError: (error) => {
      alert(`Failed to update supplier: ${getErrorMessage(error)}`);
    },
  });

  const handleFormSubmit = async (data: SupplierFormData) => {
    const cleanedData: any = {
      supplierNumber: data.supplierNumber,
      name: data.name,
      companyName: data.companyName || null,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      taxNumber: data.taxNumber || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || null,
      paymentTerms: data.paymentTerms || null,
      currency: data.currency,
      creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : null,
      rating: data.rating ? parseInt(data.rating) : null,
      notes: data.notes || null,
      active: data.active,
    };

    if (isEditMode) {
      await updateSupplier.mutateAsync(cleanedData);
    } else {
      await createSupplier.mutateAsync(cleanedData);
    }
  };

  const isSubmitting = createSupplier.isPending || updateSupplier.isPending;

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading supplier...</p>
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
            {isEditMode ? 'Edit Supplier' : 'Add New Supplier'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update supplier information' : 'Add a new supplier to your database'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/procurement/suppliers')}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Supplier Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('supplierNumber')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="SUP-001"
                  />
                  {errors.supplierNumber && (
                    <p className="text-destructive text-sm mt-1">{errors.supplierNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Acme Corp"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <input
                    {...register('companyName')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Acme Corporation Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="contact@acme.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    {...register('website')}
                    type="url"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="https://www.acme.com"
                  />
                  {errors.website && (
                    <p className="text-destructive text-sm mt-1">{errors.website.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tax Number</label>
                  <input
                    {...register('taxNumber')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="VAT123456"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Address</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Street Address</label>
                  <input
                    {...register('address')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    {...register('city')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">State/Province</label>
                  <input
                    {...register('state')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code</label>
                  <input
                    {...register('postalCode')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="10001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <input
                    {...register('country')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Financial Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Terms</label>
                  <select
                    {...register('paymentTerms')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select payment terms</option>
                    <option value="net_7">Net 7 days</option>
                    <option value="net_15">Net 15 days</option>
                    <option value="net_30">Net 30 days</option>
                    <option value="net_60">Net 60 days</option>
                    <option value="net_90">Net 90 days</option>
                    <option value="due_on_receipt">Due on receipt</option>
                    <option value="cash_on_delivery">Cash on delivery</option>
                  </select>
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
                  <label className="block text-sm font-medium mb-2">Credit Limit</label>
                  <input
                    {...register('creditLimit')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="10000.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Rating (1-5)</label>
                  <input
                    {...register('rating')}
                    type="number"
                    min="1"
                    max="5"
                    step="1"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="5"
                  />
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
                    placeholder="Optional notes about this supplier..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    {...register('active')}
                    type="checkbox"
                    id="active"
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="active" className="text-sm font-medium">
                    Active supplier
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end p-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/procurement/suppliers')}
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
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
