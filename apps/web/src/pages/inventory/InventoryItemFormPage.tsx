/**
 * Inventory Item Form Page
 * Create and edit inventory items on a dedicated page
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateInventoryItemInput, InventoryItem } from '@perfex/shared';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { z } from 'zod';

// Form schema that matches the UI needs
const inventoryItemFormSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100),
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  costPrice: z.string().optional().or(z.literal('')),
  sellingPrice: z.string().optional().or(z.literal('')),
  currency: z.string().length(3).default('EUR'),
  unit: z.string().max(50).default('unit'),
  trackInventory: z.boolean().default(true),
  minStockLevel: z.string().default('0'),
  maxStockLevel: z.string().optional().or(z.literal('')),
  reorderQuantity: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true),
  imageUrl: z.string().optional().or(z.literal('')),
  barcode: z.string().optional().or(z.literal('')),
  tagsInput: z.string().optional().or(z.literal('')),
});

type InventoryItemFormData = z.infer<typeof inventoryItemFormSchema>;

export function InventoryItemFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // Fetch inventory item data if editing
  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<ApiResponse<InventoryItem>>(`/inventory/items/${id}`);
      return response.data.data;
    },
    enabled: isEditMode,
  });

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category: '',
      costPrice: '',
      sellingPrice: '',
      currency: 'EUR',
      unit: 'unit',
      trackInventory: true,
      minStockLevel: '0',
      maxStockLevel: '',
      reorderQuantity: '',
      active: true,
      imageUrl: '',
      barcode: '',
      tagsInput: '',
    },
  });

  // Update form when item data is loaded
  useEffect(() => {
    if (item) {
      reset({
        sku: item.sku || '',
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        costPrice: item.costPrice ? item.costPrice.toString() : '',
        sellingPrice: item.sellingPrice ? item.sellingPrice.toString() : '',
        currency: item.currency || 'EUR',
        unit: item.unit || 'unit',
        trackInventory: item.trackInventory ?? true,
        minStockLevel: item.minStockLevel.toString() || '0',
        maxStockLevel: item.maxStockLevel ? item.maxStockLevel.toString() : '',
        reorderQuantity: item.reorderQuantity ? item.reorderQuantity.toString() : '',
        active: item.active ?? true,
        imageUrl: item.imageUrl || '',
        barcode: item.barcode || '',
        tagsInput: parseTags(item.tags),
      });
    }
  }, [item, reset]);

  // Create item mutation
  const createItem = useMutation({
    mutationFn: async (data: CreateInventoryItemInput) => {
      const response = await api.post<ApiResponse<InventoryItem>>('/inventory/items', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      alert('Inventory item created successfully!');
      navigate('/inventory');
    },
    onError: (error) => {
      alert(`Failed to create item: ${getErrorMessage(error)}`);
    },
  });

  // Update item mutation
  const updateItem = useMutation({
    mutationFn: async (data: CreateInventoryItemInput) => {
      if (!id) throw new Error('Item ID is required');
      const response = await api.put<ApiResponse<InventoryItem>>(`/inventory/items/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', id] });
      alert('Inventory item updated successfully!');
      navigate('/inventory');
    },
    onError: (error) => {
      alert(`Failed to update item: ${getErrorMessage(error)}`);
    },
  });

  const handleFormSubmit = async (data: InventoryItemFormData) => {
    // Parse tags from comma-separated string to array
    const tagsArray = data.tagsInput
      ? data.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : undefined;

    const cleanedData: CreateInventoryItemInput = {
      sku: data.sku,
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
      sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
      currency: data.currency,
      unit: data.unit,
      trackInventory: data.trackInventory,
      minStockLevel: parseInt(data.minStockLevel, 10),
      maxStockLevel: data.maxStockLevel ? parseInt(data.maxStockLevel, 10) : null,
      reorderQuantity: data.reorderQuantity ? parseInt(data.reorderQuantity, 10) : null,
      active: data.active,
      imageUrl: data.imageUrl || null,
      barcode: data.barcode || null,
      tags: tagsArray,
    };

    if (isEditMode) {
      await updateItem.mutateAsync(cleanedData);
    } else {
      await createItem.mutateAsync(cleanedData);
    }
  };

  const isSubmitting = createItem.isPending || updateItem.isPending;

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading item...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? 'Update item information and stock settings'
              : 'Add a new item to your inventory'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/inventory')}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    SKU <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('sku')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="PROD-001"
                  />
                  {errors.sku && (
                    <p className="text-destructive text-sm mt-1">{errors.sku.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Item Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Product Name"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Item description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    {...register('category')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Electronics, Furniture, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Barcode</label>
                  <input
                    {...register('barcode')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="1234567890123"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Pricing</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Cost Price</label>
                  <input
                    {...register('costPrice')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Selling Price</label>
                  <input
                    {...register('sellingPrice')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    {...register('currency')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <input
                    {...register('unit')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="unit, pcs, kg, etc."
                  />
                </div>
              </div>
            </div>

            {/* Inventory Settings */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Inventory Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      {...register('trackInventory')}
                      type="checkbox"
                      className="rounded border-input"
                    />
                    <span className="text-sm font-medium">Track Inventory</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Stock Level</label>
                  <input
                    {...register('minStockLevel')}
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Maximum Stock Level</label>
                  <input
                    {...register('maxStockLevel')}
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reorder Quantity</label>
                  <input
                    {...register('reorderQuantity')}
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Optional"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      {...register('active')}
                      type="checkbox"
                      className="rounded border-input"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Additional Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL</label>
                  <input
                    {...register('imageUrl')}
                    type="url"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <input
                    {...register('tagsInput')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="electronics, popular, featured"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated tags for categorization
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end p-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
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
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
