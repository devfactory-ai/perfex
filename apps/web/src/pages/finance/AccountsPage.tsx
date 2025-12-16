/**
 * Accounts Page
 * Chart of accounts management
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { type Account } from '@perfex/shared';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';

export function AccountsPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch accounts
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts', filter],
    queryFn: async () => {
      const url = filter === 'all' ? '/accounts' : `/accounts?type=${filter}`;
      const response = await api.get<ApiResponse<Account[]>>(url);
      return response.data.data;
    },
  });

  // Import template mutation
  const importTemplate = useMutation({
    mutationFn: async (template: 'french' | 'syscohada') => {
      const response = await api.post(`/accounts/import/${template}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      alert('Chart of accounts imported successfully!');
    },
    onError: (error) => {
      alert(`Failed to import: ${getErrorMessage(error)}`);
    },
  });

  const handleAddAccount = () => {
    navigate('/finance/accounts/new');
  };

  const handleEditAccount = (accountId: string) => {
    navigate(`/finance/accounts/${accountId}/edit`);
  };

  // Calculate paginated data
  const paginatedAccounts = useMemo(() => {
    if (!accounts) return { data: [], total: 0, totalPages: 0 };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = accounts.slice(startIndex, endIndex);
    const total = accounts.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [accounts, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
  };

  const accountTypes = [
    { value: 'all', labelKey: 'finance.allAccounts' },
    { value: 'asset', labelKey: 'finance.assets' },
    { value: 'liability', labelKey: 'finance.liabilities' },
    { value: 'equity', labelKey: 'finance.equity' },
    { value: 'revenue', labelKey: 'finance.revenues' },
    { value: 'expense', labelKey: 'finance.expenses' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('finance.accounts')}</h1>
          <p className="text-muted-foreground">
            {t('finance.accountsSubtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => importTemplate.mutate('french')}
            disabled={importTemplate.isPending}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {t('finance.importFrenchPlan')}
          </button>
          <button
            onClick={() => importTemplate.mutate('syscohada')}
            disabled={importTemplate.isPending}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {t('finance.importSyscohada')}
          </button>
          <button
            onClick={handleAddAccount}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('finance.addAccount')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {accountTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => handleFilterChange(type.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === type.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t(type.labelKey)}
          </button>
        ))}
      </div>

      {/* Accounts Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">{t('common.error')}: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedAccounts.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.code')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.type')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.currency')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedAccounts.data.map((account) => (
                    <tr key={account.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium">
                        {account.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {account.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.type === 'asset' ? 'bg-blue-100 text-blue-800' :
                          account.type === 'liability' ? 'bg-red-100 text-red-800' :
                          account.type === 'equity' ? 'bg-purple-100 text-purple-800' :
                          account.type === 'revenue' ? 'bg-green-100 text-green-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {t(`finance.${account.type}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {account.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {account.active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t('common.active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {t('common.inactive')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleEditAccount(account.id)}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          {t('common.edit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedAccounts.totalPages}
              totalItems={paginatedAccounts.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title={t('finance.noAccountsFound')}
            description={t('finance.noAccountsDescription')}
            icon="document"
            action={{
              label: t('finance.addAccount'),
              onClick: handleAddAccount,
            }}
          />
        )}
      </div>

      {/* Stats */}
      {accounts && accounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-5">
          {accountTypes.slice(1).map((type) => {
            const count = accounts.filter(a => a.type === type.value).length;
            return (
              <div key={type.value} className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">{t(type.labelKey)}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
