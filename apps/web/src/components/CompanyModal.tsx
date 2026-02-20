/**
 * Company Modal Component
 * Create and edit companies
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateCompanyInput, Company } from '@perfex/shared';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCompanyInput) => Promise<void>;
  company?: Company;
  isSubmitting?: boolean;
}

export function CompanyModal({
  isOpen,
  onClose,
  onSubmit,
  company,
  isSubmitting = false,
}: CompanyModalProps) {
  const { t } = useLanguage();

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
      name: company?.name || '',
      website: company?.website || '',
      phone: company?.phone || '',
      email: company?.email || '',
      type: company?.type || 'customer',
      address: company?.address || '',
      city: company?.city || '',
      state: company?.state || '',
      postalCode: company?.postalCode || '',
      country: company?.country || '',
      industry: company?.industry || '',
      size: company?.size || '',
      tagsInput: company ? parseTags(company.tags) : '',
      notes: company?.notes || '',
    },
  });

  // Reset form when company changes or modal closes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: company?.name || '',
        website: company?.website || '',
        phone: company?.phone || '',
        email: company?.email || '',
        type: company?.type || 'customer',
        address: company?.address || '',
        city: company?.city || '',
        state: company?.state || '',
        postalCode: company?.postalCode || '',
        country: company?.country || '',
        industry: company?.industry || '',
        size: company?.size || '',
        tagsInput: company ? parseTags(company.tags) : '',
        notes: company?.notes || '',
      });
    }
  }, [isOpen, company, reset]);

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

    await onSubmit(cleanedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">
              {company ? t('forms.editCompany') : t('forms.createCompany')}
            </h2>
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
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('forms.basicInfo')}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    {t('forms.companyName')} <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={t('forms.placeholders.companyName')}
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('common.type')} <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('type')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="customer">{t('forms.companyTypes.customer')}</option>
                    <option value="prospect">{t('forms.companyTypes.prospect')}</option>
                    <option value="partner">{t('forms.companyTypes.partner')}</option>
                    <option value="vendor">{t('forms.companyTypes.vendor')}</option>
                  </select>
                  {errors.type && (
                    <p className="text-destructive text-sm mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('forms.website')}</label>
                  <input
                    {...register('website')}
                    type="url"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('forms.contactInfo')}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('common.email')}</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="info@example.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('common.phone')}</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('common.address')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('forms.streetAddress')}</label>
                  <input
                    {...register('address')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={t('forms.placeholders.streetAddress')}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('forms.city')}</label>
                    <input
                      {...register('city')}
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={t('forms.placeholders.city')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t('forms.stateProvince')}</label>
                    <input
                      {...register('state')}
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t('forms.postalCode')}</label>
                    <input
                      {...register('postalCode')}
                      type="text"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="75001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('common.country')}</label>
                  <input
                    {...register('country')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={t('forms.placeholders.country')}
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('forms.businessDetails')}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('forms.industry')}</label>
                  <input
                    {...register('industry')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={t('forms.placeholders.industry')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('forms.companySize')}</label>
                  <select
                    {...register('size')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{t('forms.selectSize')}</option>
                    <option value="small">{t('forms.sizes.small')}</option>
                    <option value="medium">{t('forms.sizes.medium')}</option>
                    <option value="large">{t('forms.sizes.large')}</option>
                    <option value="enterprise">{t('forms.sizes.enterprise')}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">{t('forms.tags')}</label>
                  <input
                    {...register('tagsInput')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="vip, priority"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('forms.tagsHelp')}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('forms.notes')}</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={t('forms.placeholders.notes')}
              />
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? t('common.saving') : company ? t('forms.updateCompany') : t('forms.createCompany')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
