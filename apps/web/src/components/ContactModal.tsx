/**
 * Contact Modal Component
 * Create and edit contacts
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContactSchema, type CreateContactInput, type Contact, type Company } from '@perfex/shared';
import { z } from 'zod';

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
              {contact ? 'Edit Contact' : 'Create New Contact'}
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
              <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-destructive text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-destructive text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <select
                    {...register('companyId')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No company</option>
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
              <h3 className="text-sm font-semibold mb-3">Contact Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
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
                  <label className="block text-sm font-medium mb-2">Mobile</label>
                  <input
                    {...register('mobile')}
                    type="tel"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="+1 (555) 987-6543"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Position</label>
                  <input
                    {...register('position')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Sales Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <input
                    {...register('department')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Sales"
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

            {/* Additional Options */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  {...register('isPrimary')}
                  type="checkbox"
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">Set as primary contact for company</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Primary contacts receive important company communications
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Additional notes about this contact..."
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
