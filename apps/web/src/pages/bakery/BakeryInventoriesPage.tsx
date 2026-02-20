/**
 * Bakery Inventories Page
 * Manage inventory counts and sessions
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  Check,
  Play,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface Inventory {
  id: string;
  inventoryNumber: string;
  type: 'daily' | 'monthly' | 'annual' | 'exceptional';
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  startedAt: string | null;
  completedAt: string | null;
  totalItems: number;
  countedItems: number;
  varianceCount: number;
  varianceValue: number;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  daily: 'Quotidien',
  monthly: 'Mensuel',
  annual: 'Annuel',
  exceptional: 'Exceptionnel',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Planifié', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
};

export function BakeryInventoriesPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showNewModal, setShowNewModal] = useState(false);

  // Fetch inventories
  const { data: inventories, isLoading, error } = useQuery({
    queryKey: ['bakery-inventories', statusFilter, typeFilter],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Inventory[]>>('/bakery/inventories');
      return response.data.data || [];
    },
  });

  // Create inventory
  const createMutation = useMutation({
    mutationFn: async (data: { type: string; scheduledDate: string; notes?: string }) => {
      const response = await api.post<ApiResponse<Inventory>>('/bakery/inventories', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bakery-inventories'] });
      setShowNewModal(false);
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  // Filter and paginate
  const filteredInventories = useMemo(() => {
    if (!inventories) return [];
    return inventories.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (typeFilter !== 'all' && inv.type !== typeFilter) return false;
      return true;
    });
  }, [inventories, statusFilter, typeFilter]);

  const paginatedInventories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filteredInventories.slice(startIndex, endIndex),
      total: filteredInventories.length,
      totalPages: Math.ceil(filteredInventories.length / itemsPerPage),
    };
  }, [filteredInventories, currentPage, itemsPerPage]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Stats
  const stats = useMemo(() => {
    if (!inventories) return { total: 0, inProgress: 0, completed: 0, totalVariance: 0 };
    return {
      total: inventories.length,
      inProgress: inventories.filter(i => i.status === 'in_progress').length,
      completed: inventories.filter(i => i.status === 'completed').length,
      totalVariance: inventories.reduce((sum, i) => sum + Math.abs(i.varianceValue), 0),
    };
  }, [inventories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/bakery"
            className="p-2 rounded-lg border hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventaires</h1>
            <p className="text-muted-foreground">
              Comptages et sessions d'inventaire
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Nouvel Inventaire
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Inventaires</div>
          <div className="mt-1 text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">En Cours</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">{stats.inProgress}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Terminés</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Écarts Total</div>
          <div className="mt-1 text-2xl font-bold text-orange-600">{formatCurrency(stats.totalVariance)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tous statuts</option>
          <option value="draft">Planifié</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tous types</option>
          <option value="daily">Quotidien</option>
          <option value="monthly">Mensuel</option>
          <option value="annual">Annuel</option>
          <option value="exceptional">Exceptionnel</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">Erreur: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedInventories.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Progression</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Écarts</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Créé par</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedInventories.data.map((inventory) => {
                    const statusConfig = STATUS_CONFIG[inventory.status];
                    const progress = inventory.totalItems > 0
                      ? Math.round((inventory.countedItems / inventory.totalItems) * 100)
                      : 0;

                    return (
                      <tr key={inventory.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-sm">{inventory.inventoryNumber}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <Calendar className="h-3 w-3" />
                            {TYPE_LABELS[inventory.type] || inventory.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDate(inventory.scheduledDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                            {statusConfig?.label || inventory.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-600 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {inventory.countedItems}/{inventory.totalItems}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {inventory.varianceCount > 0 ? (
                            <div className="flex items-center justify-end gap-1">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-orange-600">{inventory.varianceCount}</span>
                            </div>
                          ) : (
                            <Check className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{inventory.createdByName}</td>
                        <td className="px-4 py-3 text-right">
                          {inventory.status === 'draft' && (
                            <button
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-600 hover:bg-blue-50"
                            >
                              <Play className="h-3 w-3" />
                              Démarrer
                            </button>
                          )}
                          {inventory.status === 'in_progress' && (
                            <Link
                              to={`/bakery/stock/inventories/${inventory.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-amber-600 hover:bg-amber-50"
                            >
                              <ClipboardList className="h-3 w-3" />
                              Continuer
                            </Link>
                          )}
                          {inventory.status === 'completed' && (
                            <Link
                              to={`/bakery/stock/inventories/${inventory.id}`}
                              className="text-xs text-primary hover:underline"
                            >
                              Voir détails
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={paginatedInventories.totalPages}
              totalItems={paginatedInventories.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun inventaire trouvé</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Créer un inventaire
            </button>
          </div>
        )}
      </div>

      {/* New Inventory Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Nouvel Inventaire</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                createMutation.mutate({
                  type: formData.get('type') as string,
                  scheduledDate: formData.get('scheduledDate') as string,
                  notes: formData.get('notes') as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium">Type d'inventaire</label>
                <select
                  name="type"
                  required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="daily">Quotidien</option>
                  <option value="monthly">Mensuel</option>
                  <option value="annual">Annuel</option>
                  <option value="exceptional">Exceptionnel</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Date prévue</label>
                <input
                  type="date"
                  name="scheduledDate"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Notes optionnelles..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
