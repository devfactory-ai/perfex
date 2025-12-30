/**
 * Dialyse Transport Page
 * Manage patient transport for dialysis sessions
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, Button, StatsCard, SectionCard, InlineLoading } from '@/components/healthcare';

// API returns snake_case - we transform it
interface TransportRecordApi {
  id: string;
  patient_id: string;
  patient_medical_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_phone: string | null;
  patient_address: string | null;
  session_id: string | null;
  session_number: string | null;
  session_date: string | null;
  transport_type: string;
  direction: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  actual_pickup_time: string | null;
  actual_dropoff_time: string | null;
  pickup_address: string;
  dropoff_address: string;
  transport_provider: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_number: string | null;
  distance: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  wheelchair_required: boolean;
  stretcher_required: boolean;
  oxygen_required: boolean;
  escort_required: boolean;
  special_instructions: string | null;
  notes: string | null;
  created_at: string;
}

interface TransportRecord {
  id: string;
  patientId: string;
  patient: {
    medicalId: string;
    contact: {
      firstName: string;
      lastName: string;
      phone: string | null;
      address: string | null;
    };
  };
  sessionId: string | null;
  session: {
    sessionNumber: string;
    sessionDate: string;
    scheduledStartTime: string | null;
  } | null;
  transportType: 'ambulance' | 'vsl' | 'taxi' | 'personal' | 'family' | 'public';
  direction: 'pickup' | 'dropoff' | 'both';
  status: 'scheduled' | 'confirmed' | 'in_transit' | 'completed' | 'cancelled' | 'no_show';
  scheduledDate: string;
  scheduledTime: string;
  actualPickupTime: string | null;
  actualDropoffTime: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  transportProvider: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehicleNumber: string | null;
  distance: number | null;
  estimatedCost: number | null;
  actualCost: number | null;
  wheelchairRequired: boolean;
  stretcherRequired: boolean;
  oxygenRequired: boolean;
  escortRequired: boolean;
  specialInstructions: string | null;
  notes: string | null;
  createdAt: string;
}

interface TransportStats {
  total: number;
  scheduled: number;
  confirmed: number;
  inTransit: number;
  completed: number;
  cancelled: number;
  todayTransports: number;
  ambulanceCount: number;
  vslCount: number;
}

// Transform API response to frontend format
const transformTransportRecord = (record: TransportRecordApi): TransportRecord => {
  return {
    id: record.id,
    patientId: record.patient_id,
    patient: {
      medicalId: record.patient_medical_id || '',
      contact: {
        firstName: record.patient_first_name || '',
        lastName: record.patient_last_name || '',
        phone: record.patient_phone,
        address: record.patient_address,
      },
    },
    sessionId: record.session_id,
    session: record.session_id ? {
      sessionNumber: record.session_number || '',
      sessionDate: record.session_date || '',
      scheduledStartTime: null,
    } : null,
    transportType: (record.transport_type as TransportRecord['transportType']) || 'personal',
    direction: (record.direction as TransportRecord['direction']) || 'both',
    status: (record.status as TransportRecord['status']) || 'scheduled',
    scheduledDate: record.scheduled_date || '',
    scheduledTime: record.scheduled_time || '',
    actualPickupTime: record.actual_pickup_time,
    actualDropoffTime: record.actual_dropoff_time,
    pickupAddress: record.pickup_address || '',
    dropoffAddress: record.dropoff_address || '',
    transportProvider: record.transport_provider,
    driverName: record.driver_name,
    driverPhone: record.driver_phone,
    vehicleNumber: record.vehicle_number,
    distance: record.distance,
    estimatedCost: record.estimated_cost,
    actualCost: record.actual_cost,
    wheelchairRequired: record.wheelchair_required || false,
    stretcherRequired: record.stretcher_required || false,
    oxygenRequired: record.oxygen_required || false,
    escortRequired: record.escort_required || false,
    specialInstructions: record.special_instructions,
    notes: record.notes,
    createdAt: record.created_at || '',
  };
};

export function DialyseTransportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch transport records
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['dialyse-transport', dateFilter, statusFilter, typeFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      params.append('limit', itemsPerPage.toString());

      const url = `/dialyse/transport${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<{ success: boolean; data: TransportRecordApi[]; meta?: any }>(url);
      const transformedData = (result.data.data || []).map(transformTransportRecord);
      return { data: transformedData, meta: result.data.meta };
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dialyse-transport-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<TransportStats>>('/dialyse/transport/stats');
      return response.data.data;
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, actualTime }: { id: string; status: string; actualTime?: string }) => {
      await api.patch(`/dialyse/transport/${id}/status`, { status, actualTime });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-transport'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-transport-stats'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Delete transport mutation
  const deleteTransport = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dialyse/transport/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-transport'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-transport-stats'] });
      toast.success(t('dialyse.transportDeleted'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleAddTransport = () => {
    navigate('/dialyse/transport/new');
  };

  const handleEditTransport = (transport: TransportRecord) => {
    navigate(`/dialyse/transport/${transport.id}/edit`);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('dialyse.confirmDeleteTransport'))) {
      deleteTransport.mutate(id);
    }
  };

  const handleStatusChange = (transport: TransportRecord, newStatus: string) => {
    const now = new Date().toISOString();
    updateStatus.mutate({ id: transport.id, status: newStatus, actualTime: now });
  };

  // Calculate paginated data
  const paginatedTransport = useMemo(() => {
    const items = response?.data || [];
    const total = response?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data: items, total, totalPages };
  }, [response, itemsPerPage]);

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      ambulance: 'bg-muted text-foreground',
      vsl: 'bg-muted/70 text-foreground',
      taxi: 'bg-muted/80 text-foreground',
      personal: 'bg-muted text-muted-foreground',
      family: 'bg-muted/60 text-foreground',
      public: 'bg-muted/50 text-foreground',
    };
    const labels: Record<string, string> = {
      ambulance: t('dialyse.transportTypeAmbulance'),
      vsl: t('dialyse.transportTypeVSL'),
      taxi: t('dialyse.transportTypeTaxi'),
      personal: t('dialyse.transportTypePersonal'),
      family: t('dialyse.transportTypeFamily'),
      public: t('dialyse.transportTypePublic'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-muted/70 text-foreground',
      confirmed: 'bg-muted/60 text-foreground',
      in_transit: 'bg-muted text-foreground',
      completed: 'bg-muted text-muted-foreground',
      cancelled: 'bg-muted text-muted-foreground',
      no_show: 'bg-muted/80 text-foreground',
    };
    const labels: Record<string, string> = {
      scheduled: t('dialyse.transportStatusScheduled'),
      confirmed: t('dialyse.transportStatusConfirmed'),
      in_transit: t('dialyse.transportStatusInTransit'),
      completed: t('dialyse.transportStatusCompleted'),
      cancelled: t('dialyse.transportStatusCancelled'),
      no_show: t('dialyse.transportStatusNoShow'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getDirectionBadge = (direction: string) => {
    const labels: Record<string, string> = {
      pickup: t('dialyse.directionPickup'),
      dropoff: t('dialyse.directionDropoff'),
      both: t('dialyse.directionBoth'),
    };
    return labels[direction] || direction;
  };

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getSpecialNeeds = (transport: TransportRecord): string[] => {
    const needs: string[] = [];
    if (transport.wheelchairRequired) needs.push(t('dialyse.wheelchairRequired'));
    if (transport.stretcherRequired) needs.push(t('dialyse.stretcherRequired'));
    if (transport.oxygenRequired) needs.push(t('dialyse.oxygenRequired'));
    if (transport.escortRequired) needs.push(t('dialyse.escortRequired'));
    return needs;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.transport')}
        description={t('dialyse.transportSubtitle')}
        module="dialyse"
      >
        <Button onClick={handleAddTransport}>
          <Plus className="h-4 w-4" />
          {t('dialyse.newTransport')}
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatsCard title={t('dialyse.today')} value={stats.todayTransports ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.scheduled')} value={stats.scheduled ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.inProgress')} value={stats.inTransit ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.ambulances')} value={stats.ambulanceCount ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.vslCount')} value={stats.vslCount ?? 0} module="dialyse" />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('dialyse.allStatuses')}</option>
          <option value="scheduled">{t('dialyse.transportStatusScheduled')}</option>
          <option value="confirmed">{t('dialyse.transportStatusConfirmed')}</option>
          <option value="in_transit">{t('dialyse.transportStatusInTransit')}</option>
          <option value="completed">{t('dialyse.transportStatusCompleted')}</option>
          <option value="cancelled">{t('dialyse.transportStatusCancelled')}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('dialyse.allTypes')}</option>
          <option value="ambulance">{t('dialyse.transportTypeAmbulance')}</option>
          <option value="vsl">{t('dialyse.transportTypeVSL')}</option>
          <option value="taxi">{t('dialyse.transportTypeTaxi')}</option>
          <option value="personal">{t('dialyse.transportTypePersonal')}</option>
          <option value="family">{t('dialyse.transportTypeFamily')}</option>
        </select>
        <button
          onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
        >
          {t('dialyse.today')}
        </button>
      </div>

      {/* Transport List */}
      <SectionCard module="dialyse">
        {isLoading ? (
          <InlineLoading message={t('dialyse.loadingTransport')} />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">{t('dialyse.error')}: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedTransport.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.time')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.patient')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.direction')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.route')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.needs')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.status')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('dialyse.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedTransport.data.map((transport) => (
                    <tr key={transport.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{transport.scheduledTime}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(transport.scheduledDate)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {transport.patient.contact.firstName} {transport.patient.contact.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">{transport.patient.medicalId}</div>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(transport.transportType)}</td>
                      <td className="px-6 py-4 text-sm">{getDirectionBadge(transport.direction)}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs max-w-[200px]">
                          <div className="truncate text-muted-foreground">{t('dialyse.from')}: {transport.pickupAddress}</div>
                          <div className="truncate">{t('dialyse.to')}: {transport.dropoffAddress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getSpecialNeeds(transport).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {getSpecialNeeds(transport).map((need, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded text-xs bg-slate-400 text-white dark:bg-slate-500">
                                {need}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {getStatusBadge(transport.status)}
                          {transport.status === 'scheduled' && (
                            <button
                              onClick={() => handleStatusChange(transport, 'confirmed')}
                              className="block text-xs text-slate-600 dark:text-slate-400 hover:underline"
                            >
                              {t('dialyse.confirm')}
                            </button>
                          )}
                          {transport.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(transport, 'in_transit')}
                              className="block text-xs text-slate-600 dark:text-slate-400 hover:underline"
                            >
                              {t('dialyse.depart')}
                            </button>
                          )}
                          {transport.status === 'in_transit' && (
                            <button
                              onClick={() => handleStatusChange(transport, 'completed')}
                              className="block text-xs text-slate-600 dark:text-slate-400 hover:underline"
                            >
                              {t('dialyse.complete')}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditTransport(transport)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transport.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title={t('dialyse.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedTransport.totalPages}
              totalItems={paginatedTransport.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title={t('dialyse.noTransportFound')}
            description={t('dialyse.planFirstTransport')}
            icon="box"
            action={{
              label: t('dialyse.newTransport'),
              onClick: handleAddTransport,
            }}
          />
        )}
      </SectionCard>
    </div>
  );
}
