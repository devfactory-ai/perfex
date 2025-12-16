/**
 * Companies Page
 * Manage companies and their information
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Company } from '@perfex/shared';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';

export function CompaniesPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch companies
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies', searchTerm, typeFilter, statusFilter],
    queryFn: async () => {
      let url = '/companies';
      const params: string[] = [];

      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (typeFilter !== 'all') params.push(`type=${typeFilter}`);
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);

      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await api.get<ApiResponse<Company[]>>(url);
      return response.data.data;
    },
  });

  // Delete company mutation
  const deleteCompany = useMutation({
    mutationFn: async (companyId: string) => {
      await api.delete(`/companies/${companyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      alert('Company deleted successfully!');
    },
    onError: (error) => {
      alert(`Failed to delete company: ${getErrorMessage(error)}`);
    },
  });

  const handleAddCompany = () => {
    navigate('/crm/companies/new');
  };

  const handleEditCompany = (companyId: string) => {
    navigate(`/crm/companies/${companyId}/edit`);
  };

  const handleDelete = (companyId: string, companyName: string) => {
    if (confirm(`Are you sure you want to delete ${companyName}? This will also delete all related contacts and opportunities. This action cannot be undone.`)) {
      deleteCompany.mutate(companyId);
    }
  };

  const typeOptions = [
    { value: 'all', labelKey: 'crm.allTypes' },
    { value: 'customer', labelKey: 'crm.customer' },
    { value: 'prospect', labelKey: 'crm.prospect' },
    { value: 'partner', labelKey: 'crm.partner' },
    { value: 'vendor', labelKey: 'crm.vendor' },
  ];

  const statusOptions = [
    { value: 'all', labelKey: 'crm.allStatus' },
    { value: 'active', labelKey: 'common.active' },
    { value: 'inactive', labelKey: 'common.inactive' },
  ];

  // Calculate paginated data
  const paginatedCompanies = useMemo(() => {
    if (!companies) return { data: [], total: 0, totalPages: 0 };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = companies.slice(startIndex, endIndex);
    const total = companies.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [companies, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('crm.companies')}</h1>
          <p className="text-muted-foreground">
            {t('crm.companiesSubtitle')}
          </p>
        </div>
        <button
          onClick={handleAddCompany}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('crm.addCompany')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('crm.searchCompanies')}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Companies Table */}
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
        ) : paginatedCompanies.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('crm.company')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.type')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('crm.contactInfo')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('crm.industry')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('crm.size')}
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
                  {paginatedCompanies.data.map((company) => (
                  <tr key={company.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {company.website}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        company.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                        company.type === 'prospect' ? 'bg-purple-100 text-purple-800' :
                        company.type === 'partner' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {t(`crm.${company.type}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        {company.email && (
                          <a href={`mailto:${company.email}`} className="text-primary hover:underline block">
                            {company.email}
                          </a>
                        )}
                        {company.phone && (
                          <div className="text-xs text-muted-foreground">{company.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {company.industry || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {company.size || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        company.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`common.${company.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => handleEditCompany(company.id)}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(company.id, company.name)}
                        className="text-destructive hover:text-destructive/80 font-medium"
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedCompanies.totalPages}
              totalItems={paginatedCompanies.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title={t('crm.noCompaniesFound')}
            description={t('crm.noCompaniesDescription')}
            icon="users"
            action={{
              label: t('crm.addCompany'),
              onClick: handleAddCompany,
            }}
          />
        )}
      </div>

      {/* Stats */}
      {companies && companies.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{t('crm.totalCompanies')}</p>
            <p className="text-2xl font-bold">{companies.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{t('crm.customers')}</p>
            <p className="text-2xl font-bold">
              {companies.filter(c => c.type === 'customer').length}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{t('crm.prospects')}</p>
            <p className="text-2xl font-bold">
              {companies.filter(c => c.type === 'prospect').length}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{t('common.active')}</p>
            <p className="text-2xl font-bold">
              {companies.filter(c => c.status === 'active').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
