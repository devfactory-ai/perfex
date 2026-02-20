/**
 * Bakery Ovens Page
 * Manage ovens and baking sessions (passages)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import {
  ArrowLeft,
  Plus,
  ChefHat,
  Clock,
  Thermometer,
  Timer,
  Check,
  Play,
} from 'lucide-react';

interface Oven {
  id: string;
  name: string;
  type: 'rotary' | 'sole' | 'tunnel' | 'convection';
  capacity: number;
  maxTemperature: number;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  currentPassage: OvenPassage | null;
}

interface OvenPassage {
  id: string;
  passageNumber: string;
  ovenId: string;
  ovenName: string;
  productName: string;
  quantity: number;
  temperature: number;
  duration: number;
  startTime: string;
  endTime: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  qualityCheck: boolean;
  notes: string | null;
}

const OVEN_TYPE_LABELS: Record<string, string> = {
  rotary: 'Rotatif',
  sole: 'À Sole',
  tunnel: 'Tunnel',
  convection: 'Ventilé',
};

const OVEN_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: 'bg-green-100 text-green-800' },
  in_use: { label: 'En cuisson', color: 'bg-red-100 text-red-800' },
  maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
  out_of_service: { label: 'Hors service', color: 'bg-gray-100 text-gray-800' },
};

export function BakeryOvensPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ovens' | 'passages'>('ovens');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch ovens
  const { data: ovens, isLoading: loadingOvens } = useQuery({
    queryKey: ['bakery-ovens'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Oven[]>>('/bakery/ovens');
      return response.data.data || [];
    },
    refetchInterval: 15000,
  });

  // Fetch passages
  const { data: passages, isLoading: loadingPassages } = useQuery({
    queryKey: ['bakery-oven-passages'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<OvenPassage[]>>('/bakery/oven-passages');
      return response.data.data || [];
    },
    refetchInterval: 15000,
  });

  // Complete passage
  const completePassage = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/bakery/oven-passages/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bakery-ovens'] });
      queryClient.invalidateQueries({ queryKey: ['bakery-oven-passages'] });
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
  };

  const getElapsedTime = (startTime: string) => {
    const elapsed = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(elapsed / 60000);
    return formatDuration(minutes);
  };

  // Stats
  const stats = {
    totalOvens: ovens?.length ?? 0,
    available: ovens?.filter(o => o.status === 'available').length ?? 0,
    inUse: ovens?.filter(o => o.status === 'in_use').length ?? 0,
    todayPassages: passages?.filter(p => {
      const today = new Date().toDateString();
      return new Date(p.startTime).toDateString() === today;
    }).length ?? 0,
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
            <h1 className="text-2xl font-bold tracking-tight">Fours</h1>
            <p className="text-muted-foreground">
              Gestion des fours et cuissons
            </p>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Cuisson
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Fours</div>
          <div className="mt-1 text-2xl font-bold">{stats.totalOvens}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
          <div className="text-sm text-green-700 dark:text-green-300">Disponibles</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{stats.available}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="text-sm text-red-700 dark:text-red-300">En Cuisson</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{stats.inUse}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Cuissons Aujourd'hui</div>
          <div className="mt-1 text-2xl font-bold">{stats.todayPassages}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ovens')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'ovens'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Fours ({ovens?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('passages')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'passages'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Historique Cuissons
          </button>
        </nav>
      </div>

      {/* Ovens Tab */}
      {activeTab === 'ovens' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loadingOvens ? (
            <div className="col-span-full flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : ovens && ovens.length > 0 ? (
            ovens.map((oven) => {
              const statusConfig = OVEN_STATUS_CONFIG[oven.status];

              return (
                <div
                  key={oven.id}
                  className={`rounded-lg border bg-card overflow-hidden ${
                    oven.status === 'out_of_service' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          oven.status === 'in_use' ? 'bg-red-100' :
                          oven.status === 'maintenance' ? 'bg-orange-100' :
                          oven.status === 'available' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <ChefHat className={`h-5 w-5 ${
                            oven.status === 'in_use' ? 'text-red-600' :
                            oven.status === 'maintenance' ? 'text-orange-600' :
                            oven.status === 'available' ? 'text-green-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold">{oven.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {OVEN_TYPE_LABELS[oven.type] || oven.type}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                        {statusConfig?.label || oven.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-muted-foreground">Capacité</div>
                        <div className="font-medium">{oven.capacity} chariots</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Temp. Max</div>
                        <div className="font-medium">{oven.maxTemperature}°C</div>
                      </div>
                    </div>

                    {oven.currentPassage && (
                      <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{oven.currentPassage.productName}</span>
                          <span className="text-xs text-red-600">En cuisson</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-muted-foreground" />
                            {oven.currentPassage.temperature}°C
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3 text-muted-foreground" />
                            {formatDuration(oven.currentPassage.duration)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {getElapsedTime(oven.currentPassage.startTime)}
                          </div>
                        </div>
                        <button
                          onClick={() => completePassage.mutate(oven.currentPassage!.id)}
                          className="mt-3 w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          <Check className="h-3 w-3" />
                          Terminer la cuisson
                        </button>
                      </div>
                    )}

                    {oven.status === 'available' && (
                      <button
                        className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded text-sm font-medium bg-amber-100 text-amber-800 hover:bg-amber-200"
                      >
                        <Play className="h-4 w-4" />
                        Démarrer une cuisson
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun four configuré</p>
            </div>
          )}
        </div>
      )}

      {/* Passages Tab */}
      {activeTab === 'passages' && (
        <div className="rounded-lg border bg-card">
          {loadingPassages ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : passages && passages.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">N°</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Four</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Produit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Qté</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Temp.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Durée</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Horaire</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {passages.slice(0, itemsPerPage).map((passage) => (
                      <tr key={passage.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-sm">{passage.passageNumber}</td>
                        <td className="px-4 py-3 text-sm">{passage.ovenName}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{passage.productName}</div>
                        </td>
                        <td className="px-4 py-3 text-right">{passage.quantity}</td>
                        <td className="px-4 py-3 text-right">{passage.temperature}°C</td>
                        <td className="px-4 py-3 text-right">{formatDuration(passage.duration)}</td>
                        <td className="px-4 py-3 text-sm">
                          {formatTime(passage.startTime)}
                          {passage.endTime && ` - ${formatTime(passage.endTime)}`}
                        </td>
                        <td className="px-4 py-3">
                          {passage.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3" />
                              Terminé
                            </span>
                          ) : passage.status === 'in_progress' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              <Clock className="h-3 w-3" />
                              En cours
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Annulé
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(passages.length / itemsPerPage)}
                totalItems={passages.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune cuisson enregistrée</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
