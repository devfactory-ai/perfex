/**
 * Suppliers Page
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Supplier } from '@perfex/shared';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';

export function SuppliersPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      let url = '/procurement/suppliers';
      if (searchTerm) url += `?search=${encodeURIComponent(searchTerm)}`;
      const response = await api.get<ApiResponse<Supplier[]>>(url);
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['procurement-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>('/procurement/suppliers/stats');
      return response.data.data;
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (supplierId: string) => await api.delete(`/procurement/suppliers/${supplierId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      alert('Supplier deleted successfully!');
    },
  });

  const handleAddSupplier = () => {
    navigate('/procurement/suppliers/new');
  };

  const handleEditSupplier = (supplierId: string) => {
    navigate(`/procurement/suppliers/${supplierId}/edit`);
  };

  // Calculate paginated data
  const paginatedSuppliers = useMemo(() => {
    if (!suppliers) return { data: [], total: 0, totalPages: 0 };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = suppliers.slice(startIndex, endIndex);
    const total = suppliers.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [suppliers, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('procurement.suppliers')}</h1>
          <p className="text-muted-foreground">{t('procurement.subtitle')}</p>
        </div>
        <button
          onClick={handleAddSupplier}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('procurement.addSupplier')}
        </button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t('procurement.totalSuppliers')}</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalSuppliers}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t('procurement.activeSuppliers')}</div>
            <div className="mt-2 text-2xl font-bold">{stats.activeSuppliers}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t('procurement.purchaseOrders')}</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalPurchaseOrders}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{t('procurement.pendingOrders')}</div>
            <div className="mt-2 text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <input
          type="text"
          placeholder={t('procurement.searchSuppliers')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">{t('procurement.loadingSuppliers')}</p>
            </div>
          </div>
        ) : paginatedSuppliers.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('procurement.supplierNumber')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('common.name')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('common.email')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('common.phone')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('common.country')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('procurement.rating')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">{t('common.status')}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedSuppliers.data.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-mono">{supplier.supplierNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.companyName && <div className="text-sm text-muted-foreground">{supplier.companyName}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm">{supplier.email || '-'}</td>
                      <td className="px-4 py-3 text-sm">{supplier.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm">{supplier.country || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {supplier.rating ? `⭐ ${supplier.rating}/5` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${supplier.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {supplier.active ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEditSupplier(supplier.id)}
                          className="text-sm text-primary hover:text-primary/80 font-medium"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => deleteSupplier.mutate(supplier.id)}
                          className="text-sm text-red-600 hover:underline"
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
              totalPages={paginatedSuppliers.totalPages}
              totalItems={paginatedSuppliers.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title={t('procurement.noSuppliersFound')}
            description={t('procurement.noSuppliersDescription')}
            icon="document"
            action={{
              label: t('procurement.addSupplier'),
              onClick: handleAddSupplier,
            }}
          />
        )}
      </div>
    </div>
  );
}
