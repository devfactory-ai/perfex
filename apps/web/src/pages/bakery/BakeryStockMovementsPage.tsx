/**
 * Bakery Stock Movements Page
 * Track entries, exits, and adjustments
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import {
  ArrowLeft,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';

interface StockMovement {
  id: string;
  movementNumber: string;
  articleId: string;
  articleName: string;
  articleReference: string;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  unit: string;
  reason: string;
  lotNumber: string | null;
  expirationDate: string | null;
  unitPrice: number | null;
  totalValue: number | null;
  status: 'draft' | 'validated' | 'cancelled';
  notes: string | null;
  createdBy: string;
  validatedBy: string | null;
  createdAt: string;
  validatedAt: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  entry: { label: 'Entrée', icon: ArrowDownRight, color: 'bg-green-100 text-green-800' },
  exit: { label: 'Sortie', icon: ArrowUpRight, color: 'bg-red-100 text-red-800' },
  adjustment: { label: 'Ajustement', icon: RefreshCw, color: 'bg-blue-100 text-blue-800' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  validated: { label: 'Validé', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800' },
};

export function BakeryStockMovementsPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showNewModal, setShowNewModal] = useState(false);

  // Fetch movements
  const { data: movements, isLoading, error } = useQuery({
    queryKey: ['bakery-stock-movements', typeFilter, statusFilter, dateFrom, dateTo],
    queryFn: async () => {
      let url = '/bakery/stock-movements';
      const params: string[] = [];

      if (typeFilter !== 'all') params.push(`type=${typeFilter}`);
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (dateFrom) params.push(`from=${dateFrom}`);
      if (dateTo) params.push(`to=${dateTo}`);

      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await api.get<ApiResponse<StockMovement[]>>(url);
      return response.data.data || [];
    },
  });

  // Validate movement
  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/bakery/stock-movements/${id}/validate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bakery-stock-movements'] });
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  // Filter and paginate
  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    return movements.filter(m => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return m.articleName.toLowerCase().includes(search) ||
               m.articleReference.toLowerCase().includes(search) ||
               m.movementNumber.toLowerCase().includes(search);
      }
      return true;
    });
  }, [movements, searchTerm]);

  const paginatedMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filteredMovements.slice(startIndex, endIndex),
      total: filteredMovements.length,
      totalPages: Math.ceil(filteredMovements.length / itemsPerPage),
    };
  }, [filteredMovements, currentPage, itemsPerPage]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

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
            <h1 className="text-2xl font-bold tracking-tight">Mouvements de Stock</h1>
            <p className="text-muted-foreground">
              Entrées, sorties et ajustements
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau Mouvement
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Mouvements</div>
          <div className="mt-1 text-2xl font-bold">{movements?.length ?? 0}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Entrées</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {movements?.filter(m => m.type === 'entry').length ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Sorties</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {movements?.filter(m => m.type === 'exit').length ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">En attente validation</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">
            {movements?.filter(m => m.status === 'draft').length ?? 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tous types</option>
          <option value="entry">Entrées</option>
          <option value="exit">Sorties</option>
          <option value="adjustment">Ajustements</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tous statuts</option>
          <option value="draft">Brouillon</option>
          <option value="validated">Validé</option>
          <option value="cancelled">Annulé</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Du"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Au"
        />
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
        ) : paginatedMovements.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Article</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Quantité</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Raison</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Valeur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedMovements.data.map((movement) => {
                    const typeConfig = TYPE_CONFIG[movement.type];
                    const statusConfig = STATUS_CONFIG[movement.status];
                    const Icon = typeConfig?.icon || RefreshCw;

                    return (
                      <tr key={movement.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-sm">{movement.movementNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeConfig?.color || 'bg-gray-100'}`}>
                            <Icon className="h-3 w-3" />
                            {typeConfig?.label || movement.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{movement.articleName}</div>
                          <div className="text-xs text-muted-foreground">{movement.articleReference}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={movement.type === 'exit' ? 'text-red-600' : 'text-green-600'}>
                            {movement.type === 'exit' ? '-' : '+'}{movement.quantity}
                          </span>
                          <span className="text-muted-foreground text-xs ml-1">{movement.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">{movement.reason}</td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(movement.totalValue)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                            {statusConfig?.label || movement.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(movement.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {movement.status === 'draft' && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => validateMutation.mutate(movement.id)}
                                className="p-1 rounded hover:bg-green-100 text-green-600"
                                title="Valider"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                className="p-1 rounded hover:bg-red-100 text-red-600"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
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
              totalPages={paginatedMovements.totalPages}
              totalItems={paginatedMovements.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun mouvement trouvé</p>
          </div>
        )}
      </div>

      {/* New Movement Modal - Placeholder */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Nouveau Mouvement</h2>
            <p className="text-muted-foreground mb-4">
              Cette fonctionnalité sera bientôt disponible.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
