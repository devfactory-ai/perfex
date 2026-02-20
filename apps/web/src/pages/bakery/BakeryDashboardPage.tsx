/**
 * Bakery Dashboard Page
 * Main dashboard for bakery management
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Package,
  Factory,
  Wrench,
  ShoppingCart,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Clock,
  Thermometer,
  Users,
  Truck,
  Receipt,
  Plus,
  ChefHat,
  Croissant,
} from 'lucide-react';

interface DashboardData {
  stock: {
    totalArticles: number;
    lowStockAlerts: number;
    expirationAlerts: number;
    pendingOrders: number;
  };
  production: {
    activeProofingCarts: number;
    ovenPassagesToday: number;
    defectsToday: number;
    qualityRate: number;
  };
  sales: {
    todayRevenue: number;
    ordersToday: number;
    pendingDeliveries: number;
    activeB2BClients: number;
  };
  maintenance: {
    activeAlerts: number;
    scheduledToday: number;
    equipmentCount: number;
    avgAvailability: number;
  };
  recentAlerts: Array<{
    id: string;
    type: string;
    message: string;
    severity: string;
    createdAt: string;
  }>;
  todayProduction: Array<{
    productName: string;
    planned: number;
    actual: number;
  }>;
}

export function BakeryDashboardPage() {
  useLanguage(); // For future translations

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['bakery-dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const response = await api.get<ApiResponse<DashboardData['stock']>>('/bakery/dashboard/stock');
      // Merge with other dashboard endpoints
      const [production, sales, maintenance] = await Promise.all([
        api.get<ApiResponse<DashboardData['production']>>('/bakery/dashboard/production'),
        api.get<ApiResponse<DashboardData['sales']>>('/bakery/dashboard/sales'),
        api.get<ApiResponse<DashboardData['maintenance']>>('/bakery/dashboard/maintenance'),
      ]);
      return {
        stock: response.data.data || { totalArticles: 0, lowStockAlerts: 0, expirationAlerts: 0, pendingOrders: 0 },
        production: production.data.data || { activeProofingCarts: 0, ovenPassagesToday: 0, defectsToday: 0, qualityRate: 0 },
        sales: sales.data.data || { todayRevenue: 0, ordersToday: 0, pendingDeliveries: 0, activeB2BClients: 0 },
        maintenance: maintenance.data.data || { activeAlerts: 0, scheduledToday: 0, equipmentCount: 0, avgAvailability: 0 },
        recentAlerts: [],
        todayProduction: [],
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-destructive">Erreur lors du chargement du tableau de bord</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Croissant className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Boulangerie</h1>
            <p className="text-muted-foreground">Tableau de bord de gestion</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/bakery/production"
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Production
          </Link>
          <Link
            to="/pos"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <ShoppingCart className="h-4 w-4" />
            Caisse
          </Link>
        </div>
      </div>

      {/* Alerts Banner */}
      {((dashboard?.stock?.lowStockAlerts ?? 0) > 0 || (dashboard?.maintenance?.activeAlerts ?? 0) > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Alertes Actives</h3>
          </div>
          <div className="flex gap-4 text-sm text-amber-700 dark:text-amber-300">
            {(dashboard?.stock?.lowStockAlerts ?? 0) > 0 && (
              <Link to="/bakery/stock/alerts" className="hover:underline">
                {dashboard?.stock?.lowStockAlerts} alertes de stock bas
              </Link>
            )}
            {(dashboard?.stock?.expirationAlerts ?? 0) > 0 && (
              <Link to="/bakery/stock/alerts" className="hover:underline">
                {dashboard?.stock?.expirationAlerts} alertes de péremption
              </Link>
            )}
            {(dashboard?.maintenance?.activeAlerts ?? 0) > 0 && (
              <Link to="/bakery/maintenance/alerts" className="hover:underline">
                {dashboard?.maintenance?.activeAlerts} alertes de maintenance
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stock */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs text-muted-foreground">Stock</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold">{dashboard?.stock?.totalArticles ?? 0}</div>
            <p className="text-sm text-muted-foreground">Articles en stock</p>
          </div>
          {(dashboard?.stock?.pendingOrders ?? 0) > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              {dashboard?.stock?.pendingOrders} commandes en attente
            </div>
          )}
        </div>

        {/* Production */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Factory className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xs text-muted-foreground">Production</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold">{dashboard?.production?.ovenPassagesToday ?? 0}</div>
            <p className="text-sm text-muted-foreground">Fournées aujourd'hui</p>
          </div>
          <div className="mt-2 text-xs text-green-600">
            Taux qualité: {(dashboard?.production?.qualityRate ?? 0).toFixed(1)}%
          </div>
        </div>

        {/* Sales */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs text-muted-foreground">Ventes</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold">{formatCurrency(dashboard?.sales?.todayRevenue ?? 0)}</div>
            <p className="text-sm text-muted-foreground">CA aujourd'hui</p>
          </div>
          <div className="mt-2 text-xs text-purple-600">
            {dashboard?.sales?.ordersToday ?? 0} commandes
          </div>
        </div>

        {/* Maintenance */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-xs text-muted-foreground">Maintenance</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold">{(dashboard?.maintenance?.avgAvailability ?? 0).toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Disponibilité équipements</p>
          </div>
          {(dashboard?.maintenance?.scheduledToday ?? 0) > 0 && (
            <div className="mt-2 text-xs text-orange-600">
              {dashboard?.maintenance?.scheduledToday} interventions prévues
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Production Status */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Production du Jour</h3>
            <Link to="/bakery/production" className="text-sm text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-center">
                <Thermometer className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                <div className="text-lg font-bold">{dashboard?.production?.activeProofingCarts ?? 0}</div>
                <div className="text-xs text-muted-foreground">En pousse</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
                <ChefHat className="h-5 w-5 mx-auto mb-1 text-red-600" />
                <div className="text-lg font-bold">{dashboard?.production?.ovenPassagesToday ?? 0}</div>
                <div className="text-xs text-muted-foreground">Au four</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                <BarChart3 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-lg font-bold">{(dashboard?.production?.qualityRate ?? 0).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Qualité</div>
              </div>
            </div>
            {(dashboard?.production?.defectsToday ?? 0) > 0 && (
              <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                ⚠️ {dashboard?.production?.defectsToday} défauts détectés aujourd'hui
              </div>
            )}
          </div>
        </div>

        {/* Sales Overview */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Ventes & Livraisons</h3>
            <Link to="/bakery/sales" className="text-sm text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center">
                <Receipt className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <div className="text-lg font-bold">{dashboard?.sales?.ordersToday ?? 0}</div>
                <div className="text-xs text-muted-foreground">Commandes</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                <Truck className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-lg font-bold">{dashboard?.sales?.pendingDeliveries ?? 0}</div>
                <div className="text-xs text-muted-foreground">À livrer</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-lg font-bold">{dashboard?.sales?.activeB2BClients ?? 0}</div>
                <div className="text-xs text-muted-foreground">Clients B2B</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-center text-green-600">
              {formatCurrency(dashboard?.sales?.todayRevenue ?? 0)}
              <span className="text-sm font-normal text-muted-foreground ml-2">CA du jour</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-4">Accès Rapide</h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <Link
            to="/bakery/stock/articles"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <Package className="h-6 w-6 mb-2 text-blue-600" />
            <span className="text-sm font-medium">Articles</span>
            <span className="text-xs text-muted-foreground">Matières premières</span>
          </Link>
          <Link
            to="/bakery/stock/movements"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <TrendingUp className="h-6 w-6 mb-2 text-green-600" />
            <span className="text-sm font-medium">Mouvements</span>
            <span className="text-xs text-muted-foreground">Entrées/Sorties</span>
          </Link>
          <Link
            to="/bakery/production/proofing"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <Thermometer className="h-6 w-6 mb-2 text-amber-600" />
            <span className="text-sm font-medium">Pousse</span>
            <span className="text-xs text-muted-foreground">Chambres & chariots</span>
          </Link>
          <Link
            to="/bakery/production/ovens"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <ChefHat className="h-6 w-6 mb-2 text-red-600" />
            <span className="text-sm font-medium">Fours</span>
            <span className="text-xs text-muted-foreground">Cuissons</span>
          </Link>
          <Link
            to="/bakery/maintenance/equipment"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <Wrench className="h-6 w-6 mb-2 text-orange-600" />
            <span className="text-sm font-medium">Équipements</span>
            <span className="text-xs text-muted-foreground">Maintenance</span>
          </Link>
          <Link
            to="/bakery/sales/clients"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <Users className="h-6 w-6 mb-2 text-purple-600" />
            <span className="text-sm font-medium">Clients B2B</span>
            <span className="text-xs text-muted-foreground">Commandes</span>
          </Link>
          <Link
            to="/bakery/sales/orders"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <Truck className="h-6 w-6 mb-2 text-blue-600" />
            <span className="text-sm font-medium">Livraisons</span>
            <span className="text-xs text-muted-foreground">Bons de livraison</span>
          </Link>
          <Link
            to="/bakery/reports"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <BarChart3 className="h-6 w-6 mb-2 text-indigo-600" />
            <span className="text-sm font-medium">Rapports</span>
            <span className="text-xs text-muted-foreground">Statistiques</span>
          </Link>
          <Link
            to="/bakery/stock/inventories"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <Clock className="h-6 w-6 mb-2 text-gray-600" />
            <span className="text-sm font-medium">Inventaires</span>
            <span className="text-xs text-muted-foreground">Comptages</span>
          </Link>
          <Link
            to="/bakery/production/quality"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <BarChart3 className="h-6 w-6 mb-2 text-green-600" />
            <span className="text-sm font-medium">Qualité</span>
            <span className="text-xs text-muted-foreground">Contrôles</span>
          </Link>
          <Link
            to="/recipes"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <Croissant className="h-6 w-6 mb-2 text-amber-600" />
            <span className="text-sm font-medium">Recettes</span>
            <span className="text-xs text-muted-foreground">Compositions</span>
          </Link>
          <Link
            to="/pos"
            className="flex flex-col items-center p-4 rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <ShoppingCart className="h-6 w-6 mb-2 text-green-600" />
            <span className="text-sm font-medium">Caisse</span>
            <span className="text-xs text-muted-foreground">Vente directe</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
