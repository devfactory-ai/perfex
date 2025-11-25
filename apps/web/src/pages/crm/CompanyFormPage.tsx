/**
 * Company Form Page
 * Create and edit companies on a dedicated page
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateCompanyInput, Company } from '@perfex/shared';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { z } from 'zod';

// Form schema that matches the UI needs
const companyFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  type: z.enum(['customer', 'prospect', 'partner', 'vendor']),
  website: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional().or(z.literal('')),
  tagsInput: z.string().optional().or(z.literal('')), // Comma-separated tags in UI
  notes: z.string().optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

export function CompanyFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // Fetch company data if editing
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<ApiResponse<Company>>(`/companies/${id}`);
      return response.data.data;
    },
    enabled: isEditMode,
  });

  // Parse tags from JSON string to comma-separated
  const parseTags = (tagsJson: string | null): string => {
    if (!tagsJson) return '';
    try {
      const tags = JSON.parse(tagsJson);
      return Array.isArray(tags) ? tags.join(', ') : '';
    } catch {
      return '';
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      website: '',
      phone: '',
      email: '',
      type: 'customer',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      industry: '',
      size: '',
      tagsInput: '',
      notes: '',
    },
  });

  // Update form when company data is loaded
  useEffect(() => {
    if (company) {
      reset({
        name: company.name || '',
        website: company.website || '',
        phone: company.phone || '',
        email: company.email || '',
        type: company.type || 'customer',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        postalCode: company.postalCode || '',
        country: company.country || '',
        industry: company.industry || '',
        size: company.size || '',
        tagsInput: parseTags(company.tags),
        notes: company.notes || '',
      });
    }
  }, [company, reset]);

  // Create company mutation
  const createCompany = useMutation({
    mutationFn: async (data: CreateCompanyInput) => {
      const response = await api.post<ApiResponse<Company>>('/companies', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      alert('Company created successfully!');
      navigate('/crm/companies');
    },
    onError: (error) => {
      alert(`Failed to create company: ${getErrorMessage(error)}`);
    },
  });

  // Update company mutation
  const updateCompany = useMutation({
    mutationFn: async (data: CreateCompanyInput) => {
      if (!id) throw new Error('Company ID is required');
      const response = await api.put<ApiResponse<Company>>(`/companies/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      alert('Company updated successfully!');
      navigate('/crm/companies');
    },
    onError: (error) => {
      alert(`Failed to update company: ${getErrorMessage(error)}`);
    },
  });

  const handleFormSubmit = async (data: CompanyFormData) => {
    // Parse tags from comma-separated string to array
    const tagsArray = data.tagsInput
      ? data.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : undefined;

    const cleanedData: CreateCompanyInput = {
      name: data.name,
      type: data.type,
      website: data.website || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || null,
      industry: data.industry || null,
      size: (data.size as 'small' | 'medium' | 'large' | 'enterprise') || null,
      tags: tagsArray,
      notes: data.notes || null,
      assignedTo: null,
    };

    if (isEditMode) {
      await updateCompany.mutateAsync(cleanedData);
    } else {
      await createCompany.mutateAsync(cleanedData);
    }
  };

  const isSubmitting = createCompany.isPending || updateCompany.isPending;

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading company...</p>
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
            {isEditMode ? 'Edit Company' : 'Create New Company'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? 'Update company information and details'
              : 'Add a new company to your CRM'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/crm/companies')}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Acme Corporation"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('type')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="customer">Customer</option>
                    <option value="prospect">Prospect</option>
                    <option value="partner">Partner</option>
                    <option value="vendor">Vendor</option>
                  </select>
                  {errors.type && (
                    <p className="text-destructive text-sm mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    {...register('website')}
                    type="url"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="https://acme.com"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="info@acme.com"
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
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Street Address</label>
                  <input
                    {...register('address')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
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

            {/* Business Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Business Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <input
                    {...register('industry')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Technology"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company Size</label>
                  <select
                    {...register('size')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select size</option>
                    <option value="small">Small (1-50)</option>
                    <option value="medium">Medium (51-250)</option>
                    <option value="large">Large (251-1000)</option>
                    <option value="enterprise">Enterprise (1000+)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <input
                    {...register('tagsInput')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="vip, priority, tech"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated tags for categorization
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Additional notes about this company..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end p-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/crm/companies')}
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
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Company' : 'Create Company'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
