/**
 * Bakery Quality Page
 * Quality controls and defect tracking
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import {
  ArrowLeft,
  Plus,
  BarChart3,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clipboard,
} from 'lucide-react';

interface QualityControl {
  id: string;
  controlNumber: string;
  ovenPassageId: string | null;
  productName: string;
  batchNumber: string;
  quantity: number;
  conformQuantity: number;
  nonConformQuantity: number;
  conformityRate: number;
  defects: Array<{
    type: string;
    count: number;
  }>;
  notes: string | null;
  controlledBy: string;
  controlledByName: string;
  createdAt: string;
}

interface QualityStats {
  totalControls: number;
  avgConformityRate: number;
  totalDefects: number;
  defectsByType: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  trendWeek: number;
}

const DEFECT_TYPES = [
  { value: 'burned', label: 'Brûlé', color: 'bg-red-100 text-red-800' },
  { value: 'undercooked', label: 'Pas assez cuit', color: 'bg-orange-100 text-orange-800' },
  { value: 'deformed', label: 'Déformé', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'broken', label: 'Cassé', color: 'bg-gray-100 text-gray-800' },
  { value: 'color', label: 'Couleur non conforme', color: 'bg-amber-100 text-amber-800' },
  { value: 'size', label: 'Taille non conforme', color: 'bg-blue-100 text-blue-800' },
  { value: 'other', label: 'Autre', color: 'bg-purple-100 text-purple-800' },
];

export function BakeryQualityPage() {
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showNewModal, setShowNewModal] = useState(false);

  // Fetch quality controls
  const { data: controls, isLoading } = useQuery({
    queryKey: ['bakery-quality-controls', dateFilter],
    queryFn: async () => {
      let url = '/bakery/quality-controls';
      if (dateFilter === 'today') {
        url += '?date=' + new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        url += '?from=' + weekAgo.toISOString().split('T')[0];
      }
      const response = await api.get<ApiResponse<QualityControl[]>>(url);
      return response.data.data || [];
    },
  });

  // Stats computation
  const stats = useMemo<QualityStats>(() => {
    if (!controls || controls.length === 0) {
      return {
        totalControls: 0,
        avgConformityRate: 100,
        totalDefects: 0,
        defectsByType: [],
        trendWeek: 0,
      };
    }

    const totalDefects = controls.reduce((sum, c) => sum + c.nonConformQuantity, 0);
    const avgConformityRate = controls.reduce((sum, c) => sum + c.conformityRate, 0) / controls.length;

    // Count defects by type
    const defectCounts: Record<string, number> = {};
    controls.forEach(c => {
      c.defects.forEach(d => {
        defectCounts[d.type] = (defectCounts[d.type] || 0) + d.count;
      });
    });

    const defectsByType = Object.entries(defectCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalDefects > 0 ? (count / totalDefects) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalControls: controls.length,
      avgConformityRate,
      totalDefects,
      defectsByType,
      trendWeek: 0, // Would be computed from historical data
    };
  }, [controls]);

  // Paginate
  const paginatedControls = useMemo(() => {
    if (!controls) return { data: [], total: 0, totalPages: 0 };
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: controls.slice(startIndex, endIndex),
      total: controls.length,
      totalPages: Math.ceil(controls.length / itemsPerPage),
    };
  }, [controls, currentPage, itemsPerPage]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDefectLabel = (type: string) => {
    return DEFECT_TYPES.find(d => d.value === type)?.label || type;
  };

  const getDefectColor = (type: string) => {
    return DEFECT_TYPES.find(d => d.value === type)?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/bakery/production"
            className="p-2 rounded-lg border hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contrôle Qualité</h1>
            <p className="text-muted-foreground">
              Suivi des contrôles et défauts
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau Contrôle
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clipboard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Contrôles</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalControls}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">Taux Conformité</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.avgConformityRate.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700 dark:text-orange-300">Défauts</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.totalDefects}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            {stats.trendWeek >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm text-muted-foreground">Tendance</span>
          </div>
          <div className={`text-2xl font-bold ${stats.trendWeek >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.trendWeek >= 0 ? '+' : ''}{stats.trendWeek.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Defects by Type */}
      {stats.defectsByType.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-4">Répartition des Défauts</h3>
          <div className="grid gap-3 md:grid-cols-4">
            {stats.defectsByType.slice(0, 8).map((defect) => (
              <div key={defect.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDefectColor(defect.type)}`}>
                    {getDefectLabel(defect.type)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{defect.count}</div>
                  <div className="text-xs text-muted-foreground">{defect.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="today">Aujourd'hui</option>
          <option value="week">7 derniers jours</option>
          <option value="all">Tous</option>
        </select>
      </div>

      {/* Controls Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : paginatedControls.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Lot</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Qté</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Conformes</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Taux</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Défauts</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedControls.data.map((control) => (
                    <tr key={control.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-sm">{control.controlNumber}</td>
                      <td className="px-4 py-3 font-medium">{control.productName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{control.batchNumber}</td>
                      <td className="px-4 py-3 text-right">{control.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-green-600">{control.conformQuantity}</span>
                        {control.nonConformQuantity > 0 && (
                          <span className="text-red-600 ml-2">-{control.nonConformQuantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${
                          control.conformityRate >= 98 ? 'text-green-600' :
                          control.conformityRate >= 95 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {control.conformityRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {control.defects.slice(0, 3).map((d, i) => (
                            <span key={i} className={`px-1.5 py-0.5 rounded text-xs ${getDefectColor(d.type)}`}>
                              {getDefectLabel(d.type)} ({d.count})
                            </span>
                          ))}
                          {control.defects.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                              +{control.defects.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(control.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={paginatedControls.totalPages}
              totalItems={paginatedControls.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun contrôle trouvé</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Créer un contrôle
            </button>
          </div>
        )}
      </div>

      {/* New Control Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Nouveau Contrôle Qualité</h2>
            <p className="text-muted-foreground mb-4">
              Le formulaire de contrôle qualité sera bientôt disponible.
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
