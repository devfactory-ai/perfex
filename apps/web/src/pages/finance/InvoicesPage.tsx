/**
 * Invoices Page
 * List and manage customer invoices
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import type { InvoiceWithLines } from '@perfex/shared';
import { Pagination } from '@/components/Pagination';
import { format } from 'date-fns';

export function InvoicesPage() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch invoices
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' ? '/invoices' : `/invoices?status=${statusFilter}`;
      const response = await api.get<ApiResponse<InvoiceWithLines[]>>(url);
      return response.data.data;
    },
  });

  const statusOptions = [
    { value: 'all', labelKey: 'finance.allInvoices', color: 'bg-gray-100 text-gray-800' },
    { value: 'draft', labelKey: 'finance.draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'sent', labelKey: 'finance.sent', color: 'bg-blue-100 text-blue-800' },
    { value: 'paid', labelKey: 'finance.paid', color: 'bg-green-100 text-green-800' },
    { value: 'partial', labelKey: 'finance.partial', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'overdue', labelKey: 'finance.overdue', color: 'bg-red-100 text-red-800' },
  ];

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(o => o.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  // Filter invoices by search term
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch =
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate paginated data
  const paginatedInvoices = useMemo(() => {
    if (!filteredInvoices) return { data: [], total: 0, totalPages: 0 };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = filteredInvoices.slice(startIndex, endIndex);
    const total = filteredInvoices.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [filteredInvoices, currentPage, itemsPerPage]);

  // Calculate totals from filtered invoices
  const totals = filteredInvoices?.reduce((acc, inv) => ({
    total: acc.total + inv.total,
    paid: acc.paid + inv.amountPaid,
    due: acc.due + inv.amountDue,
  }), { total: 0, paid: 0, due: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('finance.invoices')}</h1>
          <p className="text-muted-foreground">
            {t('finance.invoicesSubtitle')}
          </p>
        </div>
        <Link
          to="/finance/invoices/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('finance.createInvoice')}
        </Link>
      </div>

      {/* Stats Cards */}
      {totals && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{t('finance.totalInvoiced')}</p>
            <p className="text-2xl font-bold">€{(totals.total ?? 0).toFixed(2)}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{t('finance.amountPaid')}</p>
            <p className="text-2xl font-bold text-green-600">€{(totals.paid ?? 0).toFixed(2)}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{t('finance.amountDue')}</p>
            <p className="text-2xl font-bold text-orange-600">€{(totals.due ?? 0).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder={t('finance.searchByInvoiceOrCustomer')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to page 1 on search
            }}
            className="flex-1 px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setStatusFilter(option.value);
                setCurrentPage(1); // Reset to page 1 on filter change
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                statusFilter === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
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
        ) : paginatedInvoices.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('finance.invoiceNumber')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('finance.customer')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('finance.dueDate')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {t('common.amount')}
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
                  {paginatedInvoices.data.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium">
                        {invoice.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(invoice.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        €{invoice.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {t(`finance.${invoice.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          to={`/finance/invoices/${invoice.id}`}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          {t('common.view')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedInvoices.totalPages}
              totalItems={paginatedInvoices.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">{t('finance.noInvoicesFound')}</p>
            <Link
              to="/finance/invoices/new"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('finance.createInvoice')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
