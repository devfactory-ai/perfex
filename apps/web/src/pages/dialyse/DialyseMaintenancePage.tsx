/**
 * Dialyse Maintenance Page
 * Track machine maintenance and interventions
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pagination } from '@/components/Pagination';
import { Pencil, Trash2, Plus, Settings } from 'lucide-react';
import {
  PageHeader,
  Button,
  StatsCard,
  SectionCard,
  FilterBar,
  InlineLoading,
  EmptyState,
  getStatusColor
} from '@/components/healthcare';

interface PaginatedResponse<T> {
  data: T;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface MaintenanceRecord {
  id: string;
  machineId: string;
  machine: {
    machineNumber: string;
    model: string;
  };
  type: 'preventive' | 'corrective' | 'calibration' | 'inspection';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  completedDate: string | null;
  technician: string | null;
  description: string;
  findings: string | null;
  partsReplaced: string | null;
  laborHours: number | null;
  cost: number | null;
  nextMaintenanceDate: string | null;
  notes: string | null;
  createdAt: string;
}

interface MaintenanceStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  overdue: number;
  thisMonth: number;
}

export function DialyseMaintenancePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch maintenance records
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['dialyse-maintenance', statusFilter, typeFilter, priorityFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      params.append('limit', itemsPerPage.toString());

      const url = `/dialyse/maintenance${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<PaginatedResponse<MaintenanceRecord[]>>(url);
      return result.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dialyse-maintenance-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<MaintenanceStats>>('/dialyse/maintenance/stats');
      return response.data.data;
    },
  });

  // Delete maintenance mutation
  const deleteMaintenance = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dialyse/maintenance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-maintenance-stats'] });
      toast.success(t('dialyse.maintenanceDeleted'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleAddMaintenance = () => {
    navigate('/dialyse/maintenance/new');
  };

  const handleEditMaintenance = (record: MaintenanceRecord) => {
    navigate(`/dialyse/maintenance/${record.id}/edit`);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('dialyse.confirmDeleteMaintenance'))) {
      deleteMaintenance.mutate(id);
    }
  };

  // Calculate paginated data
  const paginatedRecords = useMemo(() => {
    const items = response?.data || [];
    const total = response?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data: items, total, totalPages };
  }, [response, itemsPerPage]);

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      preventive: t('dialyse.typePreventive'),
      corrective: t('dialyse.typeCorrective'),
      calibration: t('dialyse.typeCalibration'),
      inspection: t('dialyse.typeInspection'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(type)}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: t('dialyse.statusScheduled'),
      in_progress: t('dialyse.statusInProgress'),
      completed: t('dialyse.statusCompleted'),
      cancelled: t('dialyse.statusCancelled'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const labels: Record<string, string> = {
      low: t('dialyse.priorityLow'),
      medium: t('dialyse.priorityMedium'),
      high: t('dialyse.priorityHigh'),
      critical: t('dialyse.priorityCritical'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(priority)}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const isOverdue = (record: MaintenanceRecord): boolean => {
    if (record.status === 'completed' || record.status === 'cancelled') return false;
    return new Date(record.scheduledDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.maintenance')}
        subtitle={t('dialyse.maintenanceSubtitle')}
        icon={Settings}
        module="dialyse"
        actions={
          <Button module="dialyse" icon={Plus} onClick={handleAddMaintenance}>
            {t('dialyse.newMaintenance')}
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatsCard label={t('dialyse.total')} value={stats.total ?? 0} icon={Settings} module="dialyse" />
          <StatsCard label={t('dialyse.statusScheduled')} value={stats.scheduled ?? 0} icon={Settings} module="dialyse" />
          <StatsCard label={t('dialyse.statusInProgress')} value={stats.inProgress ?? 0} icon={Settings} module="dialyse" />
          <StatsCard label={t('dialyse.statusCompleted')} value={stats.completed ?? 0} icon={Settings} module="dialyse" />
          <StatsCard label={t('dialyse.overdue')} value={stats.overdue ?? 0} icon={Settings} module="dialyse" />
          <StatsCard label={t('dialyse.thisMonth')} value={stats.thisMonth ?? 0} icon={Settings} module="dialyse" />
        </div>
      )}

      {/* Filters */}
      <FilterBar
        searchTerm=""
        onSearchChange={() => {}}
        searchPlaceholder=""
        module="dialyse"
        filters={[
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'all', label: t('dialyse.allStatuses') },
              { value: 'scheduled', label: t('dialyse.statusScheduled') },
              { value: 'in_progress', label: t('dialyse.statusInProgress') },
              { value: 'completed', label: t('dialyse.statusCompleted') },
              { value: 'cancelled', label: t('dialyse.statusCancelled') },
            ],
            onChange: (v) => { setStatusFilter(v); setCurrentPage(1); },
          },
          {
            name: 'type',
            value: typeFilter,
            options: [
              { value: 'all', label: t('dialyse.allTypes') },
              { value: 'preventive', label: t('dialyse.typePreventive') },
              { value: 'corrective', label: t('dialyse.typeCorrective') },
              { value: 'calibration', label: t('dialyse.typeCalibration') },
              { value: 'inspection', label: t('dialyse.typeInspection') },
            ],
            onChange: (v) => { setTypeFilter(v); setCurrentPage(1); },
          },
          {
            name: 'priority',
            value: priorityFilter,
            options: [
              { value: 'all', label: t('dialyse.allPriorities') },
              { value: 'critical', label: t('dialyse.priorityCritical') },
              { value: 'high', label: t('dialyse.priorityHigh') },
              { value: 'medium', label: t('dialyse.priorityMedium') },
              { value: 'low', label: t('dialyse.priorityLow') },
            ],
            onChange: (v) => { setPriorityFilter(v); setCurrentPage(1); },
          },
        ]}
      />

      {/* Maintenance List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">{t('dialyse.error')}: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedRecords.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.machine')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.priority')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.scheduledDate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.technician')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.cost')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('dialyse.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedRecords.data.map((record) => (
                    <tr key={record.id} className={`hover:bg-muted/50 ${isOverdue(record) ? 'bg-slate-100 dark:bg-slate-800/50' : ''}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium font-mono">{record.machine.machineNumber}</div>
                          <div className="text-sm text-muted-foreground">{record.machine.model}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(record.type)}</td>
                      <td className="px-6 py-4">{getPriorityBadge(record.priority)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className={isOverdue(record) ? 'text-slate-900 dark:text-slate-100 font-medium' : ''}>
                            {formatDate(record.scheduledDate)}
                          </div>
                          {isOverdue(record) && (
                            <div className="text-xs text-slate-600 dark:text-slate-400">{t('dialyse.overdue')}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{record.technician || '-'}</td>
                      <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                      <td className="px-6 py-4 text-sm">{formatCurrency(record.cost)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditMaintenance(record)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
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
              totalPages={paginatedRecords.totalPages}
              totalItems={paginatedRecords.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title={t('dialyse.noMaintenanceFound')}
            description={t('dialyse.planFirstMaintenance')}
            icon={Settings}
            module="dialyse"
            action={{
              label: t('dialyse.newMaintenance'),
              onClick: handleAddMaintenance,
            }}
          />
        )}
      </SectionCard>
    </div>
  );
}
