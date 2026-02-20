/**
 * Bakery Sales Page
 * B2B clients, delivery orders, and sales management
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import {
  ArrowLeft,
  Plus,
  Users,
  Truck,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

interface B2BClient {
  id: string;
  clientNumber: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  deliveryDays: string[];
  defaultDeliveryTime: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  active: boolean;
}

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  status: 'brouillon' | 'confirmee' | 'preparee' | 'en_livraison' | 'livree' | 'facturee';
  deliveryDate: string;
  deliveryTime: string;
  totalAmount: number;
  itemCount: number;
  notes: string | null;
  createdAt: string;
}

interface SalesStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  activeClients: number;
  pendingOrders: number;
  todayDeliveries: number;
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  confirmee: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
  preparee: { label: 'Préparée', color: 'bg-yellow-100 text-yellow-800' },
  en_livraison: { label: 'En livraison', color: 'bg-purple-100 text-purple-800' },
  livree: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  facturee: { label: 'Facturée', color: 'bg-gray-100 text-gray-800' },
};

const CLIENT_TYPES: Record<string, string> = {
  restaurant: 'Restaurant',
  hotel: 'Hôtel',
  cafe: 'Café',
  collective: 'Collectivité',
  supermarket: 'Supermarché',
  other: 'Autre',
};

export function BakerySalesPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'orders'>('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch clients
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ['bakery-b2b-clients'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<B2BClient[]>>('/bakery/b2b-clients');
      return response.data.data || [];
    },
  });

  // Fetch orders
  const { data: orders, isLoading: loadingOrders } = useQuery({
    queryKey: ['bakery-delivery-orders', statusFilter],
    queryFn: async () => {
      let url = '/bakery/delivery-orders';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      const response = await api.get<ApiResponse<DeliveryOrder[]>>(url);
      return response.data.data || [];
    },
  });

  // Fetch sales dashboard
  const { data: salesDashboard } = useQuery({
    queryKey: ['bakery-sales-dashboard'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SalesStats>>('/bakery/dashboard/sales');
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

  // Paginate orders
  const paginatedOrders = useMemo(() => {
    if (!orders) return { data: [], total: 0, totalPages: 0 };
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: orders.slice(startIndex, endIndex),
      total: orders.length,
      totalPages: Math.ceil(orders.length / itemsPerPage),
    };
  }, [orders, currentPage, itemsPerPage]);

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
            <h1 className="text-2xl font-bold tracking-tight">Ventes & Livraisons</h1>
            <p className="text-muted-foreground">
              Clients B2B et commandes de livraison
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/bakery/sales/orders/new"
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Commande
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-300">CA Aujourd'hui</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(salesDashboard?.todayRevenue ?? 0)}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Clients Actifs</span>
          </div>
          <div className="text-2xl font-bold">{salesDashboard?.activeClients ?? 0}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Commandes en attente</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{salesDashboard?.pendingOrders ?? 0}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Livraisons Aujourd'hui</span>
          </div>
          <div className="text-2xl font-bold">{salesDashboard?.todayDeliveries ?? 0}</div>
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
            onClick={() => setActiveTab('clients')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'clients'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Clients B2B ({clients?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Commandes ({orders?.length ?? 0})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Deliveries */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Livraisons du Jour</h3>
            </div>
            <div className="p-4 space-y-3">
              {orders?.filter(o => {
                const today = new Date().toDateString();
                return new Date(o.deliveryDate).toDateString() === today;
              }).slice(0, 6).map((order) => {
                const statusConfig = ORDER_STATUS[order.status];
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        order.status === 'livree' ? 'bg-green-100' :
                        order.status === 'en_livraison' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        <Truck className={`h-4 w-4 ${
                          order.status === 'livree' ? 'text-green-600' :
                          order.status === 'en_livraison' ? 'text-purple-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{order.clientName}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.itemCount} articles • {order.deliveryTime}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                        {statusConfig?.label || order.status}
                      </span>
                      <div className="text-sm font-medium mt-1">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!orders || orders.filter(o => {
                const today = new Date().toDateString();
                return new Date(o.deliveryDate).toDateString() === today;
              }).length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune livraison prévue aujourd'hui</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Clients */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Clients Principaux</h3>
            </div>
            <div className="p-4 space-y-3">
              {clients?.filter(c => c.active).slice(0, 6).map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{client.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {CLIENT_TYPES[client.type] || client.type} • {client.city}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(client.currentBalance)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {client.deliveryDays.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
              {(!clients || clients.filter(c => c.active).length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun client B2B</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{clients?.length ?? 0} clients</span>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" />
              Nouveau Client
            </button>
          </div>
          {loadingClients ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : clients && clients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Livraisons</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Solde</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.clientNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {CLIENT_TYPES[client.type] || client.type}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{client.email}</div>
                        <div className="text-muted-foreground">{client.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{client.deliveryDays.join(', ')}</div>
                        <div className="text-muted-foreground">{client.defaultDeliveryTime}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={client.currentBalance > 0 ? 'text-orange-600' : ''}>
                          {formatCurrency(client.currentBalance)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          client.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {client.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun client B2B</p>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="confirmee">Confirmée</option>
              <option value="preparee">Préparée</option>
              <option value="en_livraison">En livraison</option>
              <option value="livree">Livrée</option>
              <option value="facturee">Facturée</option>
            </select>
          </div>

          <div className="rounded-lg border bg-card">
            {loadingOrders ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : paginatedOrders.data.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">N°</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Livraison</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Articles</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Montant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedOrders.data.map((order) => {
                        const statusConfig = ORDER_STATUS[order.status];
                        return (
                          <tr key={order.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 font-mono text-sm">{order.orderNumber}</td>
                            <td className="px-4 py-3 font-medium">{order.clientName}</td>
                            <td className="px-4 py-3 text-sm">
                              <div>{formatDate(order.deliveryDate)}</div>
                              <div className="text-muted-foreground">{order.deliveryTime}</div>
                            </td>
                            <td className="px-4 py-3 text-right">{order.itemCount}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatCurrency(order.totalAmount)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.color || 'bg-gray-100'}`}>
                                {statusConfig?.label || order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={paginatedOrders.totalPages}
                  totalItems={paginatedOrders.total}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune commande trouvée</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
