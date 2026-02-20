/**
 * Bakery Reports Page
 * Reports, analytics, and exports
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  FileText,
  Package,
  Factory,
  ShoppingCart,
  Wrench,
} from 'lucide-react';

interface ReportConfig {
  id: string;
  name: string;
  type: string;
  frequency: string;
  format: string;
  recipients: string[];
  lastGenerated: string | null;
  active: boolean;
}

interface DailySummary {
  date: string;
  production: {
    totalProduced: number;
    qualityRate: number;
    defects: number;
  };
  sales: {
    revenue: number;
    orders: number;
    averageOrder: number;
  };
  stock: {
    movements: number;
    alerts: number;
    varianceValue: number;
  };
  energy: {
    gas: number;
    electricity: number;
    water: number;
    cost: number;
  };
}

export function BakeryReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch report configs
  const { data: reportConfigs } = useQuery({
    queryKey: ['bakery-report-configs'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ReportConfig[]>>('/bakery/report-configs');
      return response.data.data || [];
    },
  });

  // Fetch daily summary
  const { data: dailySummary, isLoading } = useQuery({
    queryKey: ['bakery-daily-summary', selectedPeriod, dateFrom, dateTo],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DailySummary>>('/bakery/daily-summary');
      return response.data.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    alert(`Export ${format.toUpperCase()} en cours...`);
    // In production, this would call the export API
  };

  const handleGenerateReport = async (_reportId: string) => {
    alert(`Génération du rapport en cours...`);
    // In production, this would call the report generation API
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
            <h1 className="text-2xl font-bold tracking-tight">Rapports & Analyses</h1>
            <p className="text-muted-foreground">
              Tableaux de bord et exports comptables
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            <FileText className="h-4 w-4" />
            Rapport PDF
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex rounded-lg border overflow-hidden">
          {['today', 'week', 'month', 'custom'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period as typeof selectedPeriod)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-amber-600 text-white'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {period === 'today' ? "Aujourd'hui" :
               period === 'week' ? '7 jours' :
               period === 'month' ? '30 jours' : 'Personnalisé'}
            </button>
          ))}
        </div>
        {selectedPeriod === 'custom' && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <span className="text-muted-foreground">au</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Production */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Factory className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium">Production</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Produits fabriqués</span>
                <span className="font-medium">{dailySummary?.production?.totalProduced ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Taux qualité</span>
                <span className="font-medium text-green-600">
                  {(dailySummary?.production?.qualityRate ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Défauts</span>
                <span className="font-medium text-orange-600">{dailySummary?.production?.defects ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Sales */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium">Ventes</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Chiffre d'affaires</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(dailySummary?.sales?.revenue ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Commandes</span>
                <span className="font-medium">{dailySummary?.sales?.orders ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Panier moyen</span>
                <span className="font-medium">
                  {formatCurrency(dailySummary?.sales?.averageOrder ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">Stock</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mouvements</span>
                <span className="font-medium">{dailySummary?.stock?.movements ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Alertes</span>
                <span className="font-medium text-orange-600">{dailySummary?.stock?.alerts ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Écarts valeur</span>
                <span className="font-medium">
                  {formatCurrency(dailySummary?.stock?.varianceValue ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Energy */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <span className="font-medium">Énergie</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Gaz</span>
                <span className="font-medium">{dailySummary?.energy?.gas ?? 0} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Électricité</span>
                <span className="font-medium">{dailySummary?.energy?.electricity ?? 0} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Coût total</span>
                <span className="font-medium">
                  {formatCurrency(dailySummary?.energy?.cost ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Templates */}
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Rapports Rapides</h3>
          </div>
          <div className="p-4 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => handleGenerateReport('daily')}
              className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
            >
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Rapport Journalier</div>
                <div className="text-xs text-muted-foreground">Production & ventes du jour</div>
              </div>
            </button>
            <button
              onClick={() => handleGenerateReport('weekly')}
              className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
            >
              <BarChart3 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm">Rapport Hebdomadaire</div>
                <div className="text-xs text-muted-foreground">Synthèse de la semaine</div>
              </div>
            </button>
            <button
              onClick={() => handleGenerateReport('stock')}
              className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
            >
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium text-sm">État des Stocks</div>
                <div className="text-xs text-muted-foreground">Inventaire actuel</div>
              </div>
            </button>
            <button
              onClick={() => handleGenerateReport('maintenance')}
              className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
            >
              <Wrench className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-sm">Rapport Maintenance</div>
                <div className="text-xs text-muted-foreground">État équipements</div>
              </div>
            </button>
          </div>
        </div>

        {/* Scheduled Reports */}
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Rapports Automatiques</h3>
            <button className="text-sm text-primary hover:underline">
              Configurer
            </button>
          </div>
          <div className="p-4 space-y-3">
            {reportConfigs?.slice(0, 4).map((config) => (
              <div key={config.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <FileText className={`h-4 w-4 ${config.active ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{config.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {config.frequency} • {config.format.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    config.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {config.active ? 'Actif' : 'Inactif'}
                  </span>
                  {config.lastGenerated && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Dernier: {formatDate(config.lastGenerated)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!reportConfigs || reportConfigs.length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun rapport automatique configuré</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-4">Exports Comptables</h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-3 p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <Download className="h-5 w-5 text-gray-600" />
            <div className="text-left">
              <div className="font-medium text-sm">Export CSV</div>
              <div className="text-xs text-muted-foreground">Format universel</div>
            </div>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-3 p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <FileText className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <div className="font-medium text-sm">Export Excel</div>
              <div className="text-xs text-muted-foreground">Tableaux croisés</div>
            </div>
          </button>
          <button
            className="flex items-center gap-3 p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium text-sm">Format Sage</div>
              <div className="text-xs text-muted-foreground">Import comptable</div>
            </div>
          </button>
          <button
            className="flex items-center gap-3 p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <FileText className="h-5 w-5 text-purple-600" />
            <div className="text-left">
              <div className="font-medium text-sm">Format Ciel</div>
              <div className="text-xs text-muted-foreground">Import comptable</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
