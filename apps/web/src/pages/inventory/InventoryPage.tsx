/**
 * Inventory Page
 * Manage inventory items and stock levels
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import type { InventoryItem } from '@perfex/shared';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';

export function InventoryPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch inventory items
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['inventory-items', searchTerm, categoryFilter, activeFilter],
    queryFn: async () => {
      let url = '/inventory/items';
      const params: string[] = [];

      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (categoryFilter !== 'all') params.push(`category=${encodeURIComponent(categoryFilter)}`);
      if (activeFilter !== 'all') params.push(`active=${activeFilter}`);

      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await api.get<ApiResponse<InventoryItem[]>>(url);
      return response.data.data;
    },
  });

  // Fetch inventory stats
  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        totalItems: number;
        activeItems: number;
        totalWarehouses: number;
        lowStockItems: number;
      }>>('/inventory/items/stats');
      return response.data.data;
    },
  });

  // Get unique categories from items
  const categories = Array.from(
    new Set(items?.map(item => item.category).filter((c): c is string => Boolean(c)) || [])
  );

  // Delete item mutation
  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/inventory/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      alert('Inventory item deleted successfully!');
    },
    onError: (error) => {
      alert(`Failed to delete item: ${getErrorMessage(error)}`);
    },
  });

  const handleAddItem = () => {
    navigate('/inventory/new');
  };

  const handleEditItem = (itemId: string) => {
    navigate(`/inventory/${itemId}/edit`);
  };

  const handleDelete = (itemId: string, itemName: string) => {
    if (confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      deleteItem.mutate(itemId);
    }
  };

  // Calculate paginated data
  const paginatedItems = useMemo(() => {
    if (!items) return { data: [], total: 0, totalPages: 0 };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = items.slice(startIndex, endIndex);
    const total = items.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [items, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleActiveFilterChange = (value: string) => {
    setActiveFilter(value);
    setCurrentPage(1);
  };

  // Parse tags from JSON
  const parseTags = (tagsJson: string | null): string[] => {
    if (!tagsJson) return [];
    try {
      const tags = JSON.parse(tagsJson);
      return Array.isArray(tags) ? tags : [];
    } catch {
      return [];
    }
  };

  // Format currency
  const formatCurrency = (amount: number | null, currency: string): string => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (active: boolean): string => {
    return active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage inventory items and stock levels
          </p>
        </div>
        <button
          onClick={handleAddItem}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Item
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Items</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalItems}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Active Items</div>
            <div className="mt-2 text-2xl font-bold">{stats.activeItems}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Warehouses</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalWarehouses}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Low Stock</div>
            <div className="mt-2 text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search items by SKU, name, or description..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(e) => handleActiveFilterChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading items...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">Error: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedItems.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Selling Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedItems.data.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-mono">{item.sku}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {item.description}
                            </div>
                          )}
                          {parseTags(item.tags).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {parseTags(item.tags).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{item.category || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        {formatCurrency(item.costPrice, item.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatCurrency(item.sellingPrice, item.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm">{item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.active)}`}>
                          {item.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleEditItem(item.id)}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-destructive hover:text-destructive/80 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={paginatedItems.totalPages}
            totalItems={paginatedItems.total}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
          </>
        ) : (
          <EmptyState
            title="No inventory items found"
            description="Get started by adding your first inventory item. Track stock levels, manage pricing, and organize your products efficiently."
            icon="box"
            action={{
              label: "New Item",
              onClick: handleAddItem,
            }}
          />
        )}
      </div>
    </div>
  );
}
