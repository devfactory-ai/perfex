/**
 * Opportunity Modal Component
 * Create and edit opportunities
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateOpportunityInput, Opportunity, Company, Contact, PipelineStage } from '@perfex/shared';
import { z } from 'zod';

// Form schema that matches the UI needs
const opportunityFormSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  contactId: z.string().optional().or(z.literal('')),
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().optional().or(z.literal('')),
  value: z.string().min(1, 'Value is required'), // String in form, converted to number
  currency: z.string().length(3).default('EUR'),
  stageId: z.string().min(1, 'Stage is required'),
  probability: z.string().optional().or(z.literal('')), // String in form, converted to number
  expectedCloseDate: z.string().optional().or(z.literal('')),
  tagsInput: z.string().optional().or(z.literal('')), // Comma-separated tags in UI
  notes: z.string().optional().or(z.literal('')),
});

type OpportunityFormData = z.infer<typeof opportunityFormSchema>;

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOpportunityInput) => Promise<void>;
  opportunity?: Opportunity;
  companies?: Company[];
  contacts?: Contact[];
  stages?: PipelineStage[];
  isSubmitting?: boolean;
}

export function OpportunityModal({
  isOpen,
  onClose,
  onSubmit,
  opportunity,
  companies = [],
  contacts = [],
  stages = [],
  isSubmitting = false,
}: OpportunityModalProps) {
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

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      companyId: opportunity?.companyId || '',
      contactId: opportunity?.contactId || '',
      name: opportunity?.name || '',
      description: opportunity?.description || '',
      value: opportunity?.value?.toString() || '',
      currency: opportunity?.currency || 'EUR',
      stageId: opportunity?.stageId || '',
      probability: opportunity?.probability?.toString() || '',
      expectedCloseDate: opportunity ? formatDateForInput(opportunity.expectedCloseDate) : '',
      tagsInput: opportunity ? parseTags(opportunity.tags) : '',
      notes: opportunity?.notes || '',
    },
  });

  const selectedCompanyId = watch('companyId');

  // Filter contacts by selected company
  const filteredContacts = selectedCompanyId
    ? contacts.filter(c => c.companyId === selectedCompanyId)
    : [];

  // Reset form when opportunity changes or modal closes
  useEffect(() => {
    if (isOpen) {
      reset({
        companyId: opportunity?.companyId || '',
        contactId: opportunity?.contactId || '',
        name: opportunity?.name || '',
        description: opportunity?.description || '',
        value: opportunity?.value?.toString() || '',
        currency: opportunity?.currency || 'EUR',
        stageId: opportunity?.stageId || '',
        probability: opportunity?.probability?.toString() || '',
        expectedCloseDate: opportunity ? formatDateForInput(opportunity.expectedCloseDate) : '',
        tagsInput: opportunity ? parseTags(opportunity.tags) : '',
        notes: opportunity?.notes || '',
      });
    }
  }, [isOpen, opportunity, reset]);

  const handleFormSubmit = async (data: OpportunityFormData) => {
    // Parse tags from comma-separated string to array
    const tagsArray = data.tagsInput
      ? data.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : undefined;

    // Parse numbers
    const value = parseFloat(data.value);
    const probability = data.probability ? parseInt(data.probability, 10) : 0;

    // Format date for API (ISO string or null)
    const expectedCloseDate = data.expectedCloseDate
      ? new Date(data.expectedCloseDate).toISOString()
      : null;

    const cleanedData: CreateOpportunityInput = {
      companyId: data.companyId,
      contactId: data.contactId || null,
      name: data.name,
      description: data.description || null,
      value,
      currency: data.currency,
      stageId: data.stageId,
      probability,
      expectedCloseDate,
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
              {opportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Opportunity Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Enterprise Software License"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('companyId')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select company</option>
                    {companies.map((company) => (
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
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={!selectedCompanyId}
                  >
                    <option value="">No contact</option>
                    {filteredContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName}
                      </option>
                    ))}
                  </select>
                  {!selectedCompanyId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a company first
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Brief description of the opportunity..."
                  />
                </div>
              </div>
            </div>

            {/* Deal Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Deal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Value <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('value')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="50000.00"
                  />
                  {errors.value && (
                    <p className="text-destructive text-sm mt-1">{errors.value.message}</p>
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
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pipeline Stage <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('stageId')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select stage</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name} ({stage.probability}%)
                      </option>
                    ))}
                  </select>
                  {errors.stageId && (
                    <p className="text-destructive text-sm mt-1">{errors.stageId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Probability (%)
                  </label>
                  <input
                    {...register('probability')}
                    type="number"
                    min="0"
                    max="100"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="0-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Expected Close Date
                  </label>
                  <input
                    {...register('expectedCloseDate')}
                    type="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <input
                    {...register('tagsInput')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="enterprise, priority, q1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated tags
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
                placeholder="Additional notes about this opportunity..."
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
              {isSubmitting ? 'Saving...' : opportunity ? 'Update Opportunity' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
