/**
 * Sales Orders Page
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import type { SalesOrder } from '@perfex/shared';

export function SalesOrdersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['sales-orders', searchTerm, statusFilter],
    queryFn: async () => {
      let url = '/sales/orders';
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await api.get<ApiResponse<SalesOrder[]>>(url);
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>('/sales/orders/stats');
      return response.data.data;
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => await api.delete(`/sales/orders/${orderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      alert('Sales order deleted successfully!');
    },
  });

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and shipments</p>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalOrders}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Draft Orders</div>
            <div className="mt-2 text-2xl font-bold text-gray-600">{stats.draftOrders}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Confirmed Orders</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">{stats.confirmedOrders}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
            <div className="mt-2 text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : !orders || orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No sales orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Order #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Expected Delivery</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Subtotal</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Tax</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(order.orderDate)}</td>
                    <td className="px-4 py-3 text-sm">
                      {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(order.subtotal, order.currency)}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(order.taxAmount, order.currency)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.total, order.currency)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteOrder.mutate(order.id)}
                        className="text-sm text-red-600 hover:underline"
                        disabled={deleteOrder.isPending}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
