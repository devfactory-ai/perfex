/**
 * Dialyse Consumables Page
 * Manage dialysis consumables and supplies inventory
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';

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

interface ConsumableFormData {
  name: string;
  category: string;
  sku: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  unitCost: number;
  supplier: string;
  expiryDate: string;
  location: string;
  notes: string;
  isActive: boolean;
}

interface StockMovement {
  consumableId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference: string;
}

const defaultFormData: ConsumableFormData = {
  name: '',
  category: 'dialyzer',
  sku: '',
  unit: 'unité',
  currentStock: 0,
  minStock: 10,
  maxStock: 100,
  reorderPoint: 20,
  unitCost: 0,
  supplier: '',
  expiryDate: '',
  location: '',
  notes: '',
  isActive: true,
};

const categoryLabels: Record<string, string> = {
  dialyzer: 'Dialyseurs',
  tubing: 'Lignes',
  needle: 'Aiguilles',
  solution: 'Solutions',
  medication: 'Médicaments',
  other: 'Autres',
};

export function DialyseConsumablesPage() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const [formData, setFormData] = useState<ConsumableFormData>(defaultFormData);
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
      const response = await api.get<ApiResponse<Consumable[]>>('/dialyse/consumables');
      return response.data.data;
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
    if (consumable.currentStock === 0) return { label: 'Rupture', color: 'bg-red-100 text-red-800' };
    if (consumable.currentStock <= consumable.reorderPoint) return { label: 'Faible', color: 'bg-orange-100 text-orange-800' };
    if (consumable.currentStock >= consumable.maxStock) return { label: 'Plein', color: 'bg-blue-100 text-blue-800' };
    return { label: 'OK', color: 'bg-green-100 text-green-800' };
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

  // Create/Update consumable mutation
  const saveConsumable = useMutation({
    mutationFn: async (data: ConsumableFormData) => {
      const payload = {
        ...data,
        supplier: data.supplier || undefined,
        expiryDate: data.expiryDate || undefined,
        location: data.location || undefined,
        notes: data.notes || undefined,
      };

      if (editingConsumable) {
        const response = await api.put<ApiResponse<Consumable>>(`/dialyse/consumables/${editingConsumable.id}`, payload);
        return response.data;
      } else {
        const response = await api.post<ApiResponse<Consumable>>('/dialyse/consumables', payload);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-consumables'] });
      setShowModal(false);
      resetForm();
      window.alert(editingConsumable ? 'Consommable mis à jour' : 'Consommable créé');
    },
    onError: (error) => {
      window.alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

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
      window.alert('Mouvement de stock enregistré');
    },
    onError: (error) => {
      window.alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  // Delete consumable mutation
  const deleteConsumable = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dialyse/consumables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-consumables'] });
      window.alert('Consommable supprimé');
    },
    onError: (error) => {
      window.alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingConsumable(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (consumable: Consumable) => {
    setEditingConsumable(consumable);
    setFormData({
      name: consumable.name,
      category: consumable.category,
      sku: consumable.sku,
      unit: consumable.unit,
      currentStock: consumable.currentStock,
      minStock: consumable.minStock,
      maxStock: consumable.maxStock,
      reorderPoint: consumable.reorderPoint,
      unitCost: consumable.unitCost,
      supplier: consumable.supplier || '',
      expiryDate: consumable.expiryDate ? new Date(consumable.expiryDate).toISOString().split('T')[0] : '',
      location: consumable.location || '',
      notes: consumable.notes || '',
      isActive: consumable.isActive,
    });
    setShowModal(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      window.alert('Veuillez remplir le nom et le code article');
      return;
    }
    saveConsumable.mutate(formData);
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockMovement.quantity <= 0) {
      window.alert('Veuillez saisir une quantité positive');
      return;
    }
    addStockMovement.mutate(stockMovement);
  };

  const handleDelete = (consumable: Consumable) => {
    if (window.confirm(`Supprimer "${consumable.name}" ? Cette action est irréversible.`)) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consommables</h1>
          <p className="text-muted-foreground">
            Gestion des stocks de consommables de dialyse
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nouveau Consommable
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Articles</div>
          <div className="mt-2 text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Stock Faible</div>
          <div className="mt-2 text-2xl font-bold text-orange-600">{stats.lowStock}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Rupture de Stock</div>
          <div className="mt-2 text-2xl font-bold text-red-600">{stats.outOfStock}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Bientôt Périmés</div>
          <div className="mt-2 text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom ou code..."
          className="rounded-md border border-input bg-background px-3 py-2 text-sm w-64"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Toutes catégories</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tous les stocks</option>
          <option value="low">Stock faible</option>
          <option value="out">Rupture</option>
          <option value="expiring">Bientôt périmés</option>
        </select>
      </div>

      {/* Consumables List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : filteredConsumables && filteredConsumables.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Article</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Catégorie</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Stock</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Péremption</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Prix Unit.</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
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
                        <span className="text-sm">{categoryLabels[consumable.category] || consumable.category}</span>
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
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openStockModal(consumable)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Stock
                          </button>
                          <button
                            onClick={() => openEditModal(consumable)}
                            className="text-sm text-primary hover:underline"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(consumable)}
                            className="text-sm text-destructive hover:underline"
                          >
                            Supprimer
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
            <h3 className="mt-4 text-lg font-medium">Aucun consommable</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Commencez par ajouter des consommables à votre inventaire
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ajouter un consommable
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingConsumable ? 'Modifier le Consommable' : 'Nouveau Consommable'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Code Article *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Unité</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="unité, boîte, flacon..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stock actuel</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stock minimum</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Seuil de réappro</label>
                  <input
                    type="number"
                    value={formData.reorderPoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, reorderPoint: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stock maximum</label>
                  <input
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 0 }))}
                    min={0}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Prix unitaire (€)</label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                    min={0}
                    step={0.01}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fournisseur</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date de péremption</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Emplacement</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Étagère A, Armoire 2..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="isActive" className="text-sm">Article actif</label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saveConsumable.isPending}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saveConsumable.isPending ? 'Enregistrement...' : editingConsumable ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {showStockModal && selectedConsumable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">Mouvement de Stock</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedConsumable.name} - Stock actuel: <span className="font-bold">{selectedConsumable.currentStock}</span>
            </p>

            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type de mouvement</label>
                <select
                  value={stockMovement.type}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, type: e.target.value as 'in' | 'out' | 'adjustment' }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="in">Entrée (réception)</option>
                  <option value="out">Sortie (utilisation)</option>
                  <option value="adjustment">Ajustement (inventaire)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantité</label>
                <input
                  type="number"
                  value={stockMovement.quantity}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  min={1}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stockMovement.type === 'in' && `Nouveau stock: ${selectedConsumable.currentStock + stockMovement.quantity}`}
                  {stockMovement.type === 'out' && `Nouveau stock: ${selectedConsumable.currentStock - stockMovement.quantity}`}
                  {stockMovement.type === 'adjustment' && `Stock ajusté à: ${stockMovement.quantity}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Raison</label>
                <input
                  type="text"
                  value={stockMovement.reason}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Livraison, séance, péremption..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Référence</label>
                <input
                  type="text"
                  value={stockMovement.reference}
                  onChange={(e) => setStockMovement(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="N° bon de livraison, N° séance..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowStockModal(false); setSelectedConsumable(null); }}
                  className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addStockMovement.isPending}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {addStockMovement.isPending ? 'Enregistrement...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
