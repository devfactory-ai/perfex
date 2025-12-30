/**
 * Dialyse Consumables Page
 * Manage dialysis consumables and supplies inventory
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { Pencil, Trash2, Plus, Package } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, Button, StatsCard, SectionCard, InlineLoading } from '@/components/healthcare';

// API returns snake_case - we transform it
interface ConsumableApi {
  id: string;
  name: string;
  category: string;
  code: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  unit_cost: number;
  supplier: string | null;
  expiry_date: string | null;
  notes: string | null;
  status: string;
  created_at: number;
  updated_at: number;
}

interface Consumable {
  id: string;
  name: string;
  category: 'dialyzer' | 'tubing' | 'needle' | 'solution' | 'medication' | 'other';
  sku: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  unitCost: number;
  supplier: string | null;
  expiryDate: string | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  lastRestockDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  consumableId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference: string;
}

// Category labels will be translated dynamically using t() function

// Transform API response to frontend format
const transformConsumable = (record: ConsumableApi): Consumable => {
  return {
    id: record.id,
    name: record.name,
    category: (record.category as Consumable['category']) || 'other',
    sku: record.code || '',
    unit: record.unit || '',
    currentStock: record.current_stock || 0,
    minStock: record.min_stock || 0,
    maxStock: record.max_stock || 0,
    reorderPoint: record.reorder_point || 0,
    unitCost: record.unit_cost || 0,
    supplier: record.supplier,
    expiryDate: record.expiry_date,
    location: null,
    notes: record.notes,
    isActive: record.status === 'active',
    lastRestockDate: null,
    createdAt: record.created_at ? new Date(record.created_at).toISOString() : '',
    updatedAt: record.updated_at ? new Date(record.updated_at).toISOString() : '',
  };
};

export function DialyseConsumablesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const [stockMovement, setStockMovement] = useState<StockMovement>({
    consumableId: '',
    type: 'in',
    quantity: 0,
    reason: '',
    reference: '',
  });

  // Fetch consumables
  const { data: consumables, isLoading } = useQuery({
    queryKey: ['dialyse-consumables'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ConsumableApi[] }>('/dialyse/consumables');
      return (response.data.data || []).map(transformConsumable);
    },
  });

  // Filter consumables
  const filteredConsumables = consumables?.filter((c) => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (stockFilter === 'low' && c.currentStock > c.reorderPoint) return false;
    if (stockFilter === 'out' && c.currentStock > 0) return false;
    if (stockFilter === 'expiring') {
      if (!c.expiryDate) return false;
      const daysUntilExpiry = Math.floor((new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry > 30) return false;
    }
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.sku.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Get stock status
  const getStockStatus = (consumable: Consumable) => {
    if (consumable.currentStock === 0) return { label: t('dialyse.stockStatusOutOfStock'), color: 'bg-muted text-muted-foreground' };
    if (consumable.currentStock <= consumable.reorderPoint) return { label: t('dialyse.stockStatusLow'), color: 'bg-muted/80 text-foreground' };
    if (consumable.currentStock >= consumable.maxStock) return { label: t('dialyse.stockStatusFull'), color: 'bg-muted/70 text-foreground' };
    return { label: t('dialyse.stockStatusOk'), color: 'bg-muted/60 text-foreground' };
  };

  // Calculate stats
  const stats = {
    total: consumables?.length || 0,
    lowStock: consumables?.filter(c => c.currentStock <= c.reorderPoint && c.currentStock > 0).length || 0,
    outOfStock: consumables?.filter(c => c.currentStock === 0).length || 0,
    expiringSoon: consumables?.filter(c => {
      if (!c.expiryDate) return false;
      const daysUntilExpiry = Math.floor((new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length || 0,
  };

  // Stock movement mutation
  const addStockMovement = useMutation({
    mutationFn: async (movement: StockMovement) => {
      const response = await api.post<ApiResponse<unknown>>(`/dialyse/consumables/${movement.consumableId}/stock`, movement);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-consumables'] });
      setShowStockModal(false);
      setSelectedConsumable(null);
      setStockMovement({ consumableId: '', type: 'in', quantity: 0, reason: '', reference: '' });
      toast.success(t('dialyse.stockMovementRecorded'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Delete consumable mutation
  const deleteConsumable = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dialyse/consumables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-consumables'] });
      toast.success(t('dialyse.consumableDeleted'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const openCreateModal = () => {
    navigate('/dialyse/consumables/new');
  };

  const openEditModal = (consumable: Consumable) => {
    navigate(`/dialyse/consumables/${consumable.id}/edit`);
  };

  const openStockModal = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setStockMovement({
      consumableId: consumable.id,
      type: 'in',
      quantity: 0,
      reason: '',
      reference: '',
    });
    setShowStockModal(true);
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockMovement.quantity <= 0) {
      toast.warning(t('dialyse.enterPositiveQuantity'));
      return;
    }
    addStockMovement.mutate(stockMovement);
  };

  const handleDelete = (consumable: Consumable) => {
    if (window.confirm(t('dialyse.confirmDeleteConsumable').replace('{name}', consumable.name))) {
      deleteConsumable.mutate(consumable.id);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.consumables')}
        description={t('dialyse.consumablesSubtitle')}
        module="dialyse"
      >
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          {t('dialyse.newConsumable')}
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard title={t('dialyse.totalItems')} value={stats.total ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.lowStock')} value={stats.lowStock ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.outOfStock')} value={stats.outOfStock ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.expiringSoon')} value={stats.expiringSoon ?? 0} module="dialyse" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('dialyse.searchByNameOrCode')}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm w-64"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('dialyse.allCategories')}</option>
          <option value="dialyzer">{t('dialyse.categoryDialyzer')}</option>
          <option value="tubing">{t('dialyse.categoryTubing')}</option>
          <option value="needle">{t('dialyse.categoryNeedle')}</option>
          <option value="solution">{t('dialyse.categorySolution')}</option>
          <option value="medication">{t('dialyse.categoryMedication')}</option>
          <option value="other">{t('dialyse.categoryOther')}</option>
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('dialyse.allStocks')}</option>
          <option value="low">{t('dialyse.lowStock')}</option>
          <option value="out">{t('dialyse.outOfStock')}</option>
          <option value="expiring">{t('dialyse.expiringSoon')}</option>
        </select>
      </div>

      {/* Consumables List */}
      <SectionCard module="dialyse">
        {isLoading ? (
          <InlineLoading message={t('dialyse.loadingConsumables')} />
        ) : filteredConsumables && filteredConsumables.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.article')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.category')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('dialyse.stock')}</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{t('dialyse.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.expiry')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('dialyse.unitPrice')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('dialyse.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredConsumables.map((consumable) => {
                  const status = getStockStatus(consumable);
                  const isExpiringSoon = consumable.expiryDate &&
                    Math.floor((new Date(consumable.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30;

                  return (
                    <tr key={consumable.id} className={`hover:bg-muted/50 ${!consumable.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium">{consumable.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{consumable.sku}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{t(`dialyse.category${consumable.category.charAt(0).toUpperCase() + consumable.category.slice(1)}`)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold">{consumable.currentStock}</div>
                        <div className="text-xs text-muted-foreground">{consumable.unit}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                          {formatDate(consumable.expiryDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(consumable.unitCost)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openStockModal(consumable)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.stock')}
                          >
                            <Package className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(consumable)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(consumable)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title={t('dialyse.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-4 text-lg font-medium">{t('dialyse.noConsumablesFound')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('dialyse.addConsumablesToInventory')}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('dialyse.addConsumable')}
            </button>
          </div>
        )}
      </SectionCard>

      {/* Stock Movement Modal */}
      {showStockModal && selectedConsumable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">{t('dialyse.stockMovement')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedConsumable.name} - {t('dialyse.currentStock')}: <span className="font-bold">{selectedConsumable.currentStock}</span>
            </p>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('dialyse.movementType')}</label>
                <select
                  value={stockMovement.type}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, type: e.target.value as 'in' | 'out' | 'adjustment' }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="in">{t('dialyse.movementTypeIn')}</option>
                  <option value="out">{t('dialyse.movementTypeOut')}</option>
                  <option value="adjustment">{t('dialyse.movementTypeAdjustment')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('dialyse.quantity')}</label>
                <input
                  type="number"
                  value={stockMovement.quantity}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  min={1}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stockMovement.type === 'in' && t('dialyse.newStock').replace('{stock}', String(selectedConsumable.currentStock + stockMovement.quantity))}
                  {stockMovement.type === 'out' && t('dialyse.newStock').replace('{stock}', String(selectedConsumable.currentStock - stockMovement.quantity))}
                  {stockMovement.type === 'adjustment' && t('dialyse.adjustedStock').replace('{stock}', String(stockMovement.quantity))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('dialyse.reason')}</label>
                <input
                  type="text"
                  value={stockMovement.reason}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={t('dialyse.reasonPlaceholder')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('dialyse.reference')}</label>
                <input
                  type="text"
                  value={stockMovement.reference}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder={t('dialyse.referencePlaceholder')}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowStockModal(false); setSelectedConsumable(null); }}
                  className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
                >
                  {t('dialyse.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={addStockMovement.isPending}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {addStockMovement.isPending ? t('dialyse.saving') : t('dialyse.validate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
