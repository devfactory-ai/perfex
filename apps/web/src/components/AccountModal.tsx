/**
 * Account Modal Component
 * Create and edit chart of accounts entries
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema, type CreateAccountInput, type Account } from '@perfex/shared';
import { z } from 'zod';

const accountFormSchema = createAccountSchema.extend({
  parentId: z.string().uuid().optional().nullable(),
});

type AccountFormData = z.infer<typeof accountFormSchema>;

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountInput) => Promise<void>;
  account?: Account;
  accounts?: Account[];
  isSubmitting?: boolean;
}

export function AccountModal({
  isOpen,
  onClose,
  onSubmit,
  account,
  accounts = [],
  isSubmitting = false,
}: AccountModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      code: account?.code || '',
      name: account?.name || '',
      type: account?.type || 'asset',
      parentId: account?.parentId || null,
      currency: account?.currency || 'EUR',
    },
  });

  // Reset form when account changes or modal closes
  useEffect(() => {
    if (isOpen) {
      reset({
        code: account?.code || '',
        name: account?.name || '',
        type: account?.type || 'asset',
        parentId: account?.parentId || null,
        currency: account?.currency || 'EUR',
      });
    }
  }, [isOpen, account, reset]);

  const handleFormSubmit = async (data: AccountFormData) => {
    const cleanedData: CreateAccountInput = {
      ...data,
      parentId: data.parentId || null,
    };
    await onSubmit(cleanedData);
  };

  if (!isOpen) return null;

  // Filter accounts for parent selection (exclude self if editing)
  const parentOptions = accounts.filter((a) => a.id !== account?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">
              {account ? 'Edit Account' : 'Create New Account'}
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
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Account Code <span className="text-destructive">*</span>
              </label>
              <input
                {...register('code')}
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                placeholder="e.g., 512000"
                disabled={!!account}
              />
              {errors.code && (
                <p className="text-destructive text-sm mt-1">{errors.code.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Only uppercase letters and numbers, no spaces
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Account Name <span className="text-destructive">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g., Bank Current Account"
              />
              {errors.name && (
                <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Account Type <span className="text-destructive">*</span>
              </label>
              <select
                {...register('type')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={!!account}
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
              {errors.type && (
                <p className="text-destructive text-sm mt-1">{errors.type.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Type cannot be changed after creation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Parent Account</label>
              <select
                {...register('parentId')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">None (Top Level)</option>
                {parentOptions.map((parentAccount) => (
                  <option key={parentAccount.id} value={parentAccount.id}>
                    {parentAccount.code} - {parentAccount.name}
                  </option>
                ))}
              </select>
              {errors.parentId && (
                <p className="text-destructive text-sm mt-1">{errors.parentId.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Create a hierarchical account structure
              </p>
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
              {isSubmitting ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
