/**
 * Bakery Maintenance Page
 * Equipment, interventions, and maintenance plans
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  Wrench,
  Settings,
  Calendar,
  AlertTriangle,
  Package,
  TrendingUp,
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  location: string;
  status: 'operational' | 'maintenance' | 'repair' | 'out_of_service';
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  availability: number;
  mtbf: number | null;
  mttr: number | null;
}

interface Intervention {
  id: string;
  interventionNumber: string;
  equipmentId: string;
  equipmentName: string;
  type: 'preventive' | 'corrective' | 'revision';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  scheduledDate: string;
  startedAt: string | null;
  completedAt: string | null;
  technician: string | null;
  cost: number;
}

interface MaintenanceAlert {
  id: string;
  equipmentName: string;
  type: string;
  message: string;
  dueDate: string;
  severity: string;
}

const EQUIPMENT_STATUS: Record<string, { label: string; color: string }> = {
  operational: { label: 'Opérationnel', color: 'bg-green-100 text-green-800' },
  maintenance: { label: 'En maintenance', color: 'bg-blue-100 text-blue-800' },
  repair: { label: 'En réparation', color: 'bg-orange-100 text-orange-800' },
  out_of_service: { label: 'Hors service', color: 'bg-red-100 text-red-800' },
};

const INTERVENTION_TYPE: Record<string, { label: string; color: string }> = {
  preventive: { label: 'Préventive', color: 'bg-blue-100 text-blue-800' },
  corrective: { label: 'Corrective', color: 'bg-orange-100 text-orange-800' },
  revision: { label: 'Révision', color: 'bg-purple-100 text-purple-800' },
};

const INTERVENTION_STATUS: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Planifiée', color: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
};

export function BakeryMaintenancePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'interventions' | 'parts'>('overview');

  // Fetch equipment
  const { data: equipment, isLoading: loadingEquipment } = useQuery({
    queryKey: ['bakery-equipment'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Equipment[]>>('/bakery/equipment');
      return response.data.data || [];
    },
  });

  // Fetch interventions
  const { data: interventions, isLoading: loadingInterventions } = useQuery({
    queryKey: ['bakery-interventions'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Intervention[]>>('/bakery/interventions');
      return response.data.data || [];
    },
  });

  // Fetch alerts
  const { data: alerts } = useQuery({
    queryKey: ['bakery-maintenance-alerts'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<MaintenanceAlert[]>>('/bakery/maintenance-alerts');
      return response.data.data || [];
    },
  });

  // Stats
  const stats = useMemo(() => {
    return {
      totalEquipment: equipment?.length ?? 0,
      operational: equipment?.filter(e => e.status === 'operational').length ?? 0,
      inMaintenance: equipment?.filter(e => e.status === 'maintenance' || e.status === 'repair').length ?? 0,
      avgAvailability: equipment?.length
        ? equipment.reduce((sum, e) => sum + e.availability, 0) / equipment.length
        : 100,
      pendingInterventions: interventions?.filter(i => i.status === 'scheduled').length ?? 0,
      inProgressInterventions: interventions?.filter(i => i.status === 'in_progress').length ?? 0,
      alertsCount: alerts?.length ?? 0,
    };
  }, [equipment, interventions, alerts]);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
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
            <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
            <p className="text-muted-foreground">
              Gestion des équipements et interventions
            </p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Intervention
        </button>
      </div>

      {/* Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800 dark:text-orange-200">
              Alertes Maintenance ({alerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between text-sm">
                <span className="text-orange-700 dark:text-orange-300">
                  {alert.equipmentName}: {alert.message}
                </span>
                <span className="text-xs text-orange-600">
                  {formatDate(alert.dueDate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Équipements</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalEquipment}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.operational} opérationnels
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">Disponibilité</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.avgAvailability.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Interventions</span>
          </div>
          <div className="text-2xl font-bold">{stats.pendingInterventions}</div>
          <div className="text-xs text-muted-foreground mt-1">
            planifiées
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700 dark:text-orange-300">Alertes</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.alertsCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'equipment'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Équipements ({equipment?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('interventions')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'interventions'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Interventions ({interventions?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('parts')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'parts'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Pièces détachées
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Equipment Status */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">État des Équipements</h3>
            </div>
            <div className="p-4 space-y-3">
              {equipment?.slice(0, 6).map((eq) => {
                const statusConfig = EQUIPMENT_STATUS[eq.status];
                return (
                  <div key={eq.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        eq.status === 'operational' ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        <Settings className={`h-4 w-4 ${
                          eq.status === 'operational' ? 'text-green-600' : 'text-orange-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{eq.name}</div>
                        <div className="text-xs text-muted-foreground">{eq.type}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                      {statusConfig?.label || eq.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Interventions */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Interventions à Venir</h3>
            </div>
            <div className="p-4 space-y-3">
              {interventions?.filter(i => i.status === 'scheduled').slice(0, 6).map((int) => {
                const typeConfig = INTERVENTION_TYPE[int.type];
                return (
                  <div key={int.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Wrench className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{int.equipmentName}</div>
                        <div className="text-xs text-muted-foreground">{int.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig?.color || 'bg-gray-100'}`}>
                        {typeConfig?.label || int.type}
                      </span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(int.scheduledDate)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!interventions || interventions.filter(i => i.status === 'scheduled').length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune intervention planifiée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <div className="rounded-lg border bg-card">
          {loadingEquipment ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : equipment && equipment.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Équipement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">N° Série</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Disponibilité</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Prochaine Maint.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {equipment.map((eq) => {
                    const statusConfig = EQUIPMENT_STATUS[eq.status];
                    return (
                      <tr key={eq.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{eq.name}</div>
                          <div className="text-xs text-muted-foreground">{eq.location}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{eq.type}</td>
                        <td className="px-4 py-3 font-mono text-sm">{eq.serialNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                            {statusConfig?.label || eq.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${
                            eq.availability >= 95 ? 'text-green-600' :
                            eq.availability >= 85 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {eq.availability.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {eq.nextMaintenanceDate ? (
                            <span className={
                              new Date(eq.nextMaintenanceDate) < new Date() ? 'text-red-600' : ''
                            }>
                              {formatDate(eq.nextMaintenanceDate)}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun équipement configuré</p>
            </div>
          )}
        </div>
      )}

      {/* Interventions Tab */}
      {activeTab === 'interventions' && (
        <div className="rounded-lg border bg-card">
          {loadingInterventions ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : interventions && interventions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Équipement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Coût</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {interventions.map((int) => {
                    const typeConfig = INTERVENTION_TYPE[int.type];
                    const statusConfig = INTERVENTION_STATUS[int.status];
                    return (
                      <tr key={int.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-sm">{int.interventionNumber}</td>
                        <td className="px-4 py-3 font-medium">{int.equipmentName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig?.color || 'bg-gray-100'}`}>
                            {typeConfig?.label || int.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm max-w-xs truncate">{int.description}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                            {statusConfig?.label || int.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDate(int.scheduledDate)}</td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(int.cost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune intervention enregistrée</p>
            </div>
          )}
        </div>
      )}

      {/* Parts Tab */}
      {activeTab === 'parts' && (
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Gestion des pièces détachées</p>
          <p className="text-sm mt-2">Cette fonctionnalité sera bientôt disponible</p>
        </div>
      )}
    </div>
  );
}
