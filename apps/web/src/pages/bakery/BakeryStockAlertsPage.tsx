/**
 * Bakery Stock Alerts Page
 * View and manage stock alerts (low stock, expiration)
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Package,
  Check,
  Bell,
  BellOff,
} from 'lucide-react';

interface StockAlert {
  id: string;
  articleId: string;
  articleName: string;
  articleReference: string;
  alertType: 'low_stock' | 'min_stock' | 'expiration' | 'out_of_stock';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentStock: number;
  threshold: number;
  unit: string;
  expirationDate: string | null;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
}

const ALERT_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  out_of_stock: { label: 'Rupture', icon: Package, color: 'bg-red-100 text-red-800' },
  low_stock: { label: 'Stock Bas', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
  min_stock: { label: 'Seuil Min', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
  expiration: { label: 'Péremption', icon: Clock, color: 'bg-purple-100 text-purple-800' },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critique', color: 'bg-red-600 text-white' },
  high: { label: 'Haute', color: 'bg-orange-500 text-white' },
  medium: { label: 'Moyenne', color: 'bg-yellow-500 text-white' },
  low: { label: 'Basse', color: 'bg-gray-500 text-white' },
};

export function BakeryStockAlertsPage() {
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch alerts
  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ['bakery-stock-alerts', typeFilter, severityFilter, acknowledgedFilter],
    queryFn: async () => {
      const response = await api.get<ApiResponse<StockAlert[]>>('/bakery/stock-alerts');
      return response.data.data || [];
    },
  });

  // Acknowledge alert
  const acknowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/bakery/stock-alerts/${id}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bakery-stock-alerts'] });
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter(alert => {
      if (typeFilter !== 'all' && alert.alertType !== typeFilter) return false;
      if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
      if (acknowledgedFilter === 'active' && alert.acknowledged) return false;
      if (acknowledgedFilter === 'acknowledged' && !alert.acknowledged) return false;
      return true;
    });
  }, [alerts, typeFilter, severityFilter, acknowledgedFilter]);

  // Pagination
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filteredAlerts.slice(startIndex, endIndex),
      total: filteredAlerts.length,
      totalPages: Math.ceil(filteredAlerts.length / itemsPerPage),
    };
  }, [filteredAlerts, currentPage, itemsPerPage]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Count active alerts by type
  const alertCounts = useMemo(() => {
    if (!alerts) return { total: 0, outOfStock: 0, lowStock: 0, expiration: 0, critical: 0 };
    const active = alerts.filter(a => !a.acknowledged);
    return {
      total: active.length,
      outOfStock: active.filter(a => a.alertType === 'out_of_stock').length,
      lowStock: active.filter(a => a.alertType === 'low_stock' || a.alertType === 'min_stock').length,
      expiration: active.filter(a => a.alertType === 'expiration').length,
      critical: active.filter(a => a.severity === 'critical').length,
    };
  }, [alerts]);

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
            <h1 className="text-2xl font-bold tracking-tight">Alertes de Stock</h1>
            <p className="text-muted-foreground">
              Surveillez les niveaux de stock et les péremptions
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Alertes Actives</span>
          </div>
          <div className="mt-1 text-2xl font-bold">{alertCounts.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-300">Ruptures</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-red-600">{alertCounts.outOfStock}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700 dark:text-orange-300">Stock Bas</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-orange-600">{alertCounts.lowStock}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-700 dark:text-purple-300">Péremption</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-purple-600">{alertCounts.expiration}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-300">Critiques</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-red-600">{alertCounts.critical}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={acknowledgedFilter}
          onChange={(e) => {
            setAcknowledgedFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="active">Alertes actives</option>
          <option value="acknowledged">Acquittées</option>
          <option value="all">Toutes</option>
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
          <option value="out_of_stock">Ruptures</option>
          <option value="low_stock">Stock Bas</option>
          <option value="min_stock">Seuil Minimum</option>
          <option value="expiration">Péremption</option>
        </select>
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Toutes sévérités</option>
          <option value="critical">Critique</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">Erreur: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedAlerts.data.length > 0 ? (
          <>
            <div className="divide-y">
              {paginatedAlerts.data.map((alert) => {
                const typeConfig = ALERT_TYPE_CONFIG[alert.alertType];
                const severityConfig = SEVERITY_CONFIG[alert.severity];
                const Icon = typeConfig?.icon || AlertTriangle;

                return (
                  <div
                    key={alert.id}
                    className={`p-4 flex items-start gap-4 ${alert.acknowledged ? 'opacity-60' : ''}`}
                  >
                    <div className={`p-2 rounded-lg ${typeConfig?.color || 'bg-gray-100'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{alert.articleName}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {alert.articleReference}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${severityConfig?.color || 'bg-gray-500 text-white'}`}>
                          {severityConfig?.label || alert.severity}
                        </span>
                        {alert.acknowledged && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
                            Acquittée
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Stock: {alert.currentStock} {alert.unit}</span>
                        <span>Seuil: {alert.threshold} {alert.unit}</span>
                        {alert.expirationDate && (
                          <span>Expire: {new Date(alert.expirationDate).toLocaleDateString('fr-FR')}</span>
                        )}
                        <span>Créée: {formatDate(alert.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted"
                        >
                          <Check className="h-4 w-4" />
                          Acquitter
                        </button>
                      )}
                      <Link
                        to={`/bakery/stock/articles/${alert.articleId}/edit`}
                        className="text-sm text-primary hover:underline"
                      >
                        Voir article
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={paginatedAlerts.totalPages}
              totalItems={paginatedAlerts.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune alerte</p>
            <p className="text-sm mt-1">Tous les stocks sont dans les seuils normaux</p>
          </div>
        )}
      </div>
    </div>
  );
}
