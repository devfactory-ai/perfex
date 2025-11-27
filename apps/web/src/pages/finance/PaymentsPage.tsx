/**
 * Payments Page
 * List and manage payments
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import type { Payment } from '@perfex/shared';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { format } from 'date-fns';

export function PaymentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch payments
  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Payment[]>>('/payments');
      return response.data.data;
    },
  });

  const handleRecordPayment = () => {
    navigate('/finance/payments/new');
  };

  // Filter payments by search term and method
  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch =
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.notes && payment.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  // Calculate paginated data
  const paginatedPayments = useMemo(() => {
    if (!filteredPayments) return { data: [], total: 0, totalPages: 0 };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = filteredPayments.slice(startIndex, endIndex);
    const total = filteredPayments.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [filteredPayments, currentPage, itemsPerPage]);

  const paymentMethods = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    check: 'Check',
    credit_card: 'Credit Card',
    other: 'Other',
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-green-100 text-green-800',
      bank_transfer: 'bg-blue-100 text-blue-800',
      check: 'bg-purple-100 text-purple-800',
      credit_card: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[method] || colors.other;
  };

  // Calculate total from filtered payments
  const totalAmount = filteredPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track all payment transactions
          </p>
        </div>
        <button
          onClick={handleRecordPayment}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Payments</p>
          <p className="text-2xl font-bold">€{totalAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Count</p>
          <p className="text-2xl font-bold">{filteredPayments?.length || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-bold">€0.00</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Average</p>
          <p className="text-2xl font-bold">
            €{filteredPayments && filteredPayments.length > 0 ? (totalAmount / filteredPayments.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by reference or notes..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to page 1 on search
          }}
          className="flex-1 px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />

        {/* Method Filter */}
        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setCurrentPage(1); // Reset to page 1 on filter change
          }}
          className="px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-w-[200px]"
        >
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="check">Check</option>
          <option value="credit_card">Credit Card</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading payments...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">Error: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedPayments.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Currency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedPayments.data.map((payment) => (
                    <tr key={payment.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium">
                        {payment.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(payment.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        €{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodBadge(payment.paymentMethod)}`}>
                          {paymentMethods[payment.paymentMethod as keyof typeof paymentMethods]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.currency}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                        {payment.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button className="text-primary hover:text-primary/80 font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedPayments.totalPages}
              totalItems={paginatedPayments.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title="No payments recorded yet"
            description="Get started by recording your first payment transaction."
            icon="document"
            action={{
              label: "Record Payment",
              onClick: handleRecordPayment,
            }}
          />
        )}
      </div>
    </div>
  );
}
