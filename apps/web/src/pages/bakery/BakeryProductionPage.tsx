/**
 * Bakery Production Page
 * Overview of production: proofing, ovens, and quality
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import {
  ArrowLeft,
  Thermometer,
  ChefHat,
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Gauge,
} from 'lucide-react';

interface ProductionDashboard {
  proofing: {
    totalChambers: number;
    activeChambers: number;
    totalCarts: number;
    cartsInProofing: number;
    cartsReady: number;
    cartsInOven: number;
  };
  ovens: {
    totalOvens: number;
    activeOvens: number;
    passagesToday: number;
    averageTemperature: number;
    averageDuration: number;
  };
  quality: {
    controlsToday: number;
    conformityRate: number;
    defectsToday: number;
    defectsByType: Array<{ type: string; count: number }>;
  };
  comparison: {
    plannedToday: number;
    actualToday: number;
    variance: number;
    variancePercent: number;
  };
  energy: {
    gasToday: number;
    electricityToday: number;
    waterToday: number;
    totalCostToday: number;
  };
  recentPassages: Array<{
    id: string;
    ovenName: string;
    productName: string;
    quantity: number;
    startTime: string;
    endTime: string | null;
    status: string;
  }>;
}

export function BakeryProductionPage() {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['bakery-production-dashboard'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProductionDashboard>>('/bakery/dashboard/production');
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

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
        <p className="text-destructive">Erreur lors du chargement</p>
      </div>
    );
  }

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
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
            <h1 className="text-2xl font-bold tracking-tight">Production</h1>
            <p className="text-muted-foreground">
              Suivi temps réel de la production
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Proofing */}
        <Link
          to="/bakery/production/proofing"
          className="rounded-lg border bg-card p-4 hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Thermometer className="h-5 w-5 text-amber-600" />
            </div>
            <span className="font-medium">Pousse</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-2xl font-bold">{dashboard?.proofing?.cartsInProofing ?? 0}</div>
              <div className="text-muted-foreground">En pousse</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{dashboard?.proofing?.cartsReady ?? 0}</div>
              <div className="text-muted-foreground">Prêts</div>
            </div>
          </div>
        </Link>

        {/* Ovens */}
        <Link
          to="/bakery/production/ovens"
          className="rounded-lg border bg-card p-4 hover:border-red-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-red-100">
              <ChefHat className="h-5 w-5 text-red-600" />
            </div>
            <span className="font-medium">Fours</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-2xl font-bold">{dashboard?.ovens?.activeOvens ?? 0}/{dashboard?.ovens?.totalOvens ?? 0}</div>
              <div className="text-muted-foreground">Actifs</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{dashboard?.ovens?.passagesToday ?? 0}</div>
              <div className="text-muted-foreground">Fournées</div>
            </div>
          </div>
        </Link>

        {/* Quality */}
        <Link
          to="/bakery/production/quality"
          className="rounded-lg border bg-card p-4 hover:border-green-300 transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-green-100">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <span className="font-medium">Qualité</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-2xl font-bold text-green-600">{(dashboard?.quality?.conformityRate ?? 0).toFixed(1)}%</div>
              <div className="text-muted-foreground">Conformité</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{dashboard?.quality?.defectsToday ?? 0}</div>
              <div className="text-muted-foreground">Défauts</div>
            </div>
          </div>
        </Link>

        {/* Comparison */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Gauge className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-medium">Comparaison</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-2xl font-bold">{dashboard?.comparison?.actualToday ?? 0}</div>
              <div className="text-muted-foreground">Produit</div>
            </div>
            <div>
              <div className={`text-2xl font-bold flex items-center gap-1 ${
                (dashboard?.comparison?.variance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(dashboard?.comparison?.variance ?? 0) >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                {(dashboard?.comparison?.variancePercent ?? 0).toFixed(1)}%
              </div>
              <div className="text-muted-foreground">Écart</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Proofing Status */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">État des Chambres de Pousse</h3>
            <Link to="/bakery/production/proofing" className="text-sm text-primary hover:underline">
              Gérer
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xl font-bold">{dashboard?.proofing?.totalChambers ?? 0}</div>
                <div className="text-xs text-muted-foreground">Chambres</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <div className="text-xl font-bold text-amber-600">{dashboard?.proofing?.cartsInProofing ?? 0}</div>
                <div className="text-xs text-amber-600">En pousse</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="text-xl font-bold text-green-600">{dashboard?.proofing?.cartsReady ?? 0}</div>
                <div className="text-xs text-green-600">Prêts</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="text-xl font-bold text-red-600">{dashboard?.proofing?.cartsInOven ?? 0}</div>
                <div className="text-xs text-red-600">Au four</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Oven Passages */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Fournées Récentes</h3>
            <Link to="/bakery/production/ovens" className="text-sm text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="p-4">
            {dashboard?.recentPassages && dashboard.recentPassages.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentPassages.slice(0, 5).map((passage) => (
                  <div key={passage.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${passage.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'}`}>
                        {passage.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{passage.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          {passage.ovenName} • {passage.quantity} unités
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(passage.startTime)}
                      {passage.endTime && ` - ${formatTime(passage.endTime)}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune fournée aujourd'hui</p>
              </div>
            )}
          </div>
        </div>

        {/* Quality Controls */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Contrôles Qualité</h3>
            <Link to="/bakery/production/quality" className="text-sm text-primary hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {(dashboard?.quality?.conformityRate ?? 0).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Taux de conformité</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{dashboard?.quality?.controlsToday ?? 0}</div>
                <div className="text-sm text-muted-foreground">Contrôles aujourd'hui</div>
              </div>
            </div>
            {dashboard?.quality?.defectsByType && dashboard.quality.defectsByType.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Défauts par type</div>
                {dashboard.quality.defectsByType.map((defect) => (
                  <div key={defect.type} className="flex items-center justify-between text-sm">
                    <span>{defect.type}</span>
                    <span className="font-medium text-orange-600">{defect.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-1" />
                <p className="text-sm text-green-600">Aucun défaut détecté</p>
              </div>
            )}
          </div>
        </div>

        {/* Energy Consumption */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Consommation Énergie</h3>
            <Link to="/bakery/production/energy" className="text-sm text-primary hover:underline">
              Détails
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <div className="text-xl font-bold text-orange-600">{dashboard?.energy?.gasToday ?? 0}</div>
                <div className="text-xs text-muted-foreground">Gaz (m³)</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div className="text-xl font-bold text-yellow-600">{dashboard?.energy?.electricityToday ?? 0}</div>
                <div className="text-xs text-muted-foreground">Élec (kWh)</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="text-xl font-bold text-blue-600">{dashboard?.energy?.waterToday ?? 0}</div>
                <div className="text-xs text-muted-foreground">Eau (L)</div>
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted">
              <div className="text-lg font-bold">{formatCurrency(dashboard?.energy?.totalCostToday ?? 0)}</div>
              <div className="text-xs text-muted-foreground">Coût total estimé</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-4">Actions Rapides</h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Link
            to="/bakery/production/proofing"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
          >
            <Thermometer className="h-5 w-5 text-amber-600" />
            <div>
              <div className="font-medium text-sm">Chambres de Pousse</div>
              <div className="text-xs text-muted-foreground">Gérer les chariots</div>
            </div>
          </Link>
          <Link
            to="/bakery/production/ovens"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
          >
            <ChefHat className="h-5 w-5 text-red-600" />
            <div>
              <div className="font-medium text-sm">Fours</div>
              <div className="text-xs text-muted-foreground">Suivre les cuissons</div>
            </div>
          </Link>
          <Link
            to="/bakery/production/quality"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-sm">Contrôle Qualité</div>
              <div className="text-xs text-muted-foreground">Nouveau contrôle</div>
            </div>
          </Link>
          <Link
            to="/bakery/production/comparison"
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
          >
            <Gauge className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-sm">Comparaison</div>
              <div className="text-xs text-muted-foreground">Théorique vs réel</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
