/**
 * Fixed Assets Page
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import type { FixedAsset } from '@perfex/shared';

export function AssetsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['fixed-assets', searchTerm, statusFilter],
    queryFn: async () => {
      let url = '/assets/assets';
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (params.toString()) url += `?${params.toString()}`;
      const response = await api.get<ApiResponse<FixedAsset[]>>(url);
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['assets-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>('/assets/assets/stats');
      return response.data.data;
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => await api.delete(`/assets/assets/${assetId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets-stats'] });
      alert('Asset deleted successfully!');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      disposed: 'bg-gray-100 text-gray-800',
      sold: 'bg-blue-100 text-blue-800',
      donated: 'bg-purple-100 text-purple-800',
      lost: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fixed Assets</h1>
          <p className="text-muted-foreground">Manage equipment, property, and fixed assets</p>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Assets</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalAssets}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Active Assets</div>
            <div className="mt-2 text-2xl font-bold text-green-600">{stats.activeAssets}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Value</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalValue)}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Pending Maintenance</div>
            <div className="mt-2 text-2xl font-bold text-orange-600">{stats.pendingMaintenance}</div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search assets..."
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
          <option value="active">Active</option>
          <option value="disposed">Disposed</option>
          <option value="sold">Sold</option>
          <option value="donated">Donated</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : !assets || assets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No assets found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Asset #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Purchase Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Purchase Cost</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Current Value</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{asset.assetNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{asset.name}</div>
                      {asset.model && <div className="text-sm text-muted-foreground">{asset.model}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm">{asset.location || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(asset.status)}`}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(asset.purchaseDate)}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(asset.purchaseCost)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(asset.currentValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteAsset.mutate(asset.id)}
                        className="text-sm text-red-600 hover:underline"
                        disabled={deleteAsset.isPending}
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
