/**
 * Bakery Proofing Page
 * Manage proofing chambers and carts
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  Thermometer,
  Clock,
  ChefHat,
  Check,
} from 'lucide-react';

interface ProofingChamber {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  temperature: number;
  humidity: number;
  status: 'available' | 'in_use' | 'maintenance';
  carts: ProofingCart[];
}

interface ProofingCart {
  id: string;
  cartNumber: string;
  chamberId: string | null;
  status: 'en_pousse' | 'pret_four' | 'au_four' | 'termine';
  products: Array<{
    productName: string;
    quantity: number;
  }>;
  startTime: string | null;
  estimatedEndTime: string | null;
  notes: string | null;
}

const CART_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  en_pousse: { label: 'En pousse', color: 'bg-amber-100 text-amber-800', icon: Clock },
  pret_four: { label: 'Prêt au four', color: 'bg-green-100 text-green-800', icon: Check },
  au_four: { label: 'Au four', color: 'bg-red-100 text-red-800', icon: ChefHat },
  termine: { label: 'Terminé', color: 'bg-gray-100 text-gray-800', icon: Check },
};

export function BakeryProofingPage() {
  const queryClient = useQueryClient();
  const [showNewCartModal, setShowNewCartModal] = useState(false);

  // Fetch chambers
  const { data: chambers, isLoading } = useQuery({
    queryKey: ['bakery-proofing-chambers'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProofingChamber[]>>('/bakery/proofing-chambers');
      return response.data.data || [];
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch carts
  const { data: carts } = useQuery({
    queryKey: ['bakery-proofing-carts'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProofingCart[]>>('/bakery/proofing-carts');
      return response.data.data || [];
    },
    refetchInterval: 15000,
  });

  // Update cart status
  const updateCartStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/bakery/proofing-carts/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bakery-proofing-carts'] });
      queryClient.invalidateQueries({ queryKey: ['bakery-proofing-chambers'] });
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (endTime: string | null) => {
    if (!endTime) return null;
    const remaining = new Date(endTime).getTime() - Date.now();
    if (remaining <= 0) return 'Prêt';
    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}min`;
    return `${minutes}min`;
  };

  // Stats
  const stats = {
    totalCarts: carts?.length ?? 0,
    inProofing: carts?.filter(c => c.status === 'en_pousse').length ?? 0,
    ready: carts?.filter(c => c.status === 'pret_four').length ?? 0,
    inOven: carts?.filter(c => c.status === 'au_four').length ?? 0,
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
            <h1 className="text-2xl font-bold tracking-tight">Chambres de Pousse</h1>
            <p className="text-muted-foreground">
              Gestion des chariots en fermentation
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewCartModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Nouveau Chariot
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Chariots</div>
          <div className="mt-1 text-2xl font-bold">{stats.totalCarts}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <div className="text-sm text-amber-700 dark:text-amber-300">En Pousse</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{stats.inProofing}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
          <div className="text-sm text-green-700 dark:text-green-300">Prêts au Four</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{stats.ready}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="text-sm text-red-700 dark:text-red-300">Au Four</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{stats.inOven}</div>
        </div>
      </div>

      {/* Chambers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : chambers && chambers.length > 0 ? (
          chambers.map((chamber) => (
            <div
              key={chamber.id}
              className={`rounded-lg border bg-card overflow-hidden ${
                chamber.status === 'maintenance' ? 'opacity-60' : ''
              }`}
            >
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      chamber.status === 'in_use' ? 'bg-amber-100' :
                      chamber.status === 'maintenance' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <Thermometer className={`h-5 w-5 ${
                        chamber.status === 'in_use' ? 'text-amber-600' :
                        chamber.status === 'maintenance' ? 'text-red-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <div className="font-semibold">{chamber.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {chamber.currentLoad}/{chamber.capacity} chariots
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{chamber.temperature}°C</div>
                    <div className="text-muted-foreground">{chamber.humidity}%</div>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {chamber.carts && chamber.carts.length > 0 ? (
                  chamber.carts.map((cart) => {
                    const statusConfig = CART_STATUS_CONFIG[cart.status];
                    const Icon = statusConfig?.icon || Clock;
                    const timeRemaining = getTimeRemaining(cart.estimatedEndTime);

                    return (
                      <div
                        key={cart.id}
                        className="p-3 rounded-lg border bg-background"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{cart.cartNumber}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                            <Icon className="h-3 w-3" />
                            {statusConfig?.label || cart.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {cart.products.slice(0, 2).map((p, i) => (
                            <div key={i}>{p.productName} × {p.quantity}</div>
                          ))}
                          {cart.products.length > 2 && (
                            <div>+{cart.products.length - 2} autres</div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Début: </span>
                            {formatTime(cart.startTime)}
                          </div>
                          {timeRemaining && (
                            <div className={`text-xs font-medium ${
                              timeRemaining === 'Prêt' ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              {timeRemaining}
                            </div>
                          )}
                        </div>
                        {cart.status === 'en_pousse' && (
                          <button
                            onClick={() => updateCartStatus.mutate({ id: cart.id, status: 'pret_four' })}
                            className="mt-2 w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            <Check className="h-3 w-3" />
                            Marquer Prêt
                          </button>
                        )}
                        {cart.status === 'pret_four' && (
                          <button
                            onClick={() => updateCartStatus.mutate({ id: cart.id, status: 'au_four' })}
                            className="mt-2 w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            <ChefHat className="h-3 w-3" />
                            Envoyer au Four
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <Thermometer className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    Chambre vide
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Thermometer className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune chambre de pousse configurée</p>
          </div>
        )}
      </div>

      {/* Unassigned Carts */}
      {carts && carts.filter(c => !c.chamberId && c.status !== 'termine').length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Chariots Non Assignés</h3>
          </div>
          <div className="p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {carts
              .filter(c => !c.chamberId && c.status !== 'termine')
              .map((cart) => {
                const statusConfig = CART_STATUS_CONFIG[cart.status];
                return (
                  <div key={cart.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{cart.cartNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusConfig?.color || 'bg-gray-100'}`}>
                        {statusConfig?.label || cart.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cart.products.length} produits
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* New Cart Modal */}
      {showNewCartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Nouveau Chariot</h2>
            <p className="text-muted-foreground mb-4">
              La création de chariot sera bientôt disponible.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewCartModal(false)}
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
