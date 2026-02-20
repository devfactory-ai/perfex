/**
 * Contact Modal Component
 * Create and edit contacts
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContactSchema, type CreateContactInput, type Contact, type Company } from '@perfex/shared';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';

const contactFormSchema = createContactSchema.extend({
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactInput) => Promise<void>;
  contact?: Contact;
  companies?: Company[];
  isSubmitting?: boolean;
}

export function ContactModal({
  isOpen,
  onClose,
  onSubmit,
  contact,
  companies = [],
  isSubmitting = false,
}: ContactModalProps) {
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      companyId: contact?.companyId || null,
      firstName: contact?.firstName || '',
      lastName: contact?.lastName || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      mobile: contact?.mobile || '',
      position: contact?.position || '',
      department: contact?.department || '',
      address: contact?.address || '',
      city: contact?.city || '',
      state: contact?.state || '',
      postalCode: contact?.postalCode || '',
      country: contact?.country || '',
      isPrimary: contact?.isPrimary || false,
      assignedTo: contact?.assignedTo || null,
      notes: contact?.notes || '',
    },
  });

  // Reset form when contact changes or modal closes
  useEffect(() => {
    if (isOpen) {
      reset({
        companyId: contact?.companyId || null,
        firstName: contact?.firstName || '',
        lastName: contact?.lastName || '',
        email: contact?.email || '',
        phone: contact?.phone || '',
        mobile: contact?.mobile || '',
        position: contact?.position || '',
        department: contact?.department || '',
        address: contact?.address || '',
        city: contact?.city || '',
        state: contact?.state || '',
        postalCode: contact?.postalCode || '',
        country: contact?.country || '',
        isPrimary: contact?.isPrimary || false,
        assignedTo: contact?.assignedTo || null,
        notes: contact?.notes || '',
      });
    }
  }, [isOpen, contact, reset]);

  const handleFormSubmit = async (data: ContactFormData) => {
    const cleanedData: CreateContactInput = {
      ...data,
      companyId: data.companyId || null,
      phone: data.phone || null,
      mobile: data.mobile || null,
      position: data.position || null,
      department: data.department || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || null,
      assignedTo: data.assignedTo || null,
      notes: data.notes || null,
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
              {contact ? t('forms.editContact') : t('forms.createContact')}
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
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('forms.firstName')} <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Jean"
                  />
                  {errors.firstName && (
                    <p className="text-destructive text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('forms.lastName')} <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Dupont"
                  />
                  {errors.lastName && (
                    <p className="text-destructive text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('common.email')} <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="jean.dupont@example.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('forms.company')}</label>
                  <select
                    {...register('companyId')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{t('forms.noCompany')}</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">{t('forms.contactInfo')}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('common.phone')}</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('forms.mobile')}</label>
                  <input
                    {...register('mobile')}
                    type="tel"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('forms.position')}</label>
                  <input
                    {...register('position')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Directeur Commercial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('forms.department')}</label>
                  <input
                    {...register('department')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Ventes"
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

            {/* Additional Options */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  {...register('isPrimary')}
                  type="checkbox"
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">{t('forms.setPrimaryContact')}</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                {t('forms.primaryContactHelp')}
              </p>
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
              {isSubmitting ? t('common.saving') : contact ? t('forms.updateContact') : t('forms.createContact')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
