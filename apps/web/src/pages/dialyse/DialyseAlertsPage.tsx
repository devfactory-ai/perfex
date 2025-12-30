/**
 * Dialyse Alerts Page
 * Clinical alerts management for dialysis patients
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle } from 'lucide-react';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  FilterBar,
  SectionCard,
  StatsCard,
  EmptyState,
  InlineLoading,
  Button,
} from '@/components/healthcare';

interface PaginatedResponse<T> {
  data: T;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface ClinicalAlert {
  id: string;
  patientId: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  createdAt: Date;
  patient?: {
    medicalId: string;
    contact: {
      firstName: string;
      lastName: string;
    };
  };
}

interface AlertStats {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function DialyseAlertsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);

  // Fetch alerts
  const { data: response, isLoading } = useQuery({
    queryKey: ['dialyse-alerts', statusFilter, severityFilter, typeFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      params.append('limit', itemsPerPage.toString());

      const url = `/dialyse/alerts${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<PaginatedResponse<ClinicalAlert[]>>(url);
      return result.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dialyse-alerts-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AlertStats>>('/dialyse/alerts/stats');
      return response.data.data;
    },
  });

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await api.post(`/dialyse/alerts/${alertId}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts-stats'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      await api.post(`/dialyse/alerts/${alertId}/resolve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts-stats'] });
      setResolvingAlertId(null);
      setResolutionNotes('');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Generate automated alerts mutation
  const generateAlertsMutation = useMutation({
    mutationFn: async () => {
      await api.post('/dialyse/alerts/generate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts-stats'] });
      toast.success(t('dialyse.alertsGenerated'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Calculate paginated data
  const paginatedAlerts = useMemo(() => {
    const items = response?.data || [];
    const total = response?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data: items, total, totalPages };
  }, [response, itemsPerPage]);

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-orange-100 text-orange-800 border-orange-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    const labels: Record<string, string> = {
      critical: t('dialyse.critical'),
      warning: t('dialyse.warning'),
      info: t('dialyse.info'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[severity] || 'bg-gray-100 text-gray-800'}`}>
        {labels[severity] || severity}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-red-100 text-red-800',
      acknowledged: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      active: t('dialyse.active'),
      acknowledged: t('dialyse.acknowledged'),
      resolved: t('dialyse.resolved'),
      dismissed: t('dialyse.dismissed'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getAlertTypeName = (type: string) => {
    const names: Record<string, string> = {
      prescription_renewal: t('dialyse.prescriptionRenewal'),
      lab_due: t('dialyse.labDue'),
      vaccination: t('dialyse.vaccination'),
      vascular_access: t('dialyse.vascularAccess'),
      serology_update: t('dialyse.serologyUpdate'),
      weight_deviation: t('dialyse.weightDeviation'),
      custom: t('dialyse.custom'),
    };
    return names[type] || type;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (date: Date | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  };

  const handleResolve = (alertId: string) => {
    if (resolvingAlertId === alertId) {
      resolveMutation.mutate({ alertId, notes: resolutionNotes });
    } else {
      setResolvingAlertId(alertId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.clinicalAlerts')}
        subtitle={t('dialyse.clinicalAlertsSubtitle')}
        icon={Bell}
        module="dialyse"
        actions={
          <Button
            module="dialyse"
            variant="outline"
            onClick={() => generateAlertsMutation.mutate()}
            disabled={generateAlertsMutation.isPending}
            loading={generateAlertsMutation.isPending}
          >
            {generateAlertsMutation.isPending ? t('dialyse.generatingAlerts') : t('dialyse.generateAutomaticAlerts')}
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            label={t('dialyse.activeAlerts')}
            value={stats.active ?? 0}
            icon={Bell}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.critical')}
            value={stats.critical ?? 0}
            icon={AlertTriangle}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.acknowledged')}
            value={stats.acknowledged ?? 0}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.resolved')}
            value={stats.resolved ?? 0}
            module="dialyse"
          />
        </div>
      )}

      {/* Filters */}
      <FilterBar
        searchTerm=""
        onSearchChange={() => {}}
        searchPlaceholder={t('dialyse.searchAlerts')}
        module="dialyse"
        filters={[
          {
            name: 'status',
            value: statusFilter,
            onChange: (value) => { setStatusFilter(value); setCurrentPage(1); },
            options: [
              { value: 'all', label: t('dialyse.allStatuses') },
              { value: 'active', label: t('dialyse.active') },
              { value: 'acknowledged', label: t('dialyse.acknowledged') },
              { value: 'resolved', label: t('dialyse.resolved') },
              { value: 'dismissed', label: t('dialyse.dismissed') },
            ],
          },
          {
            name: 'severity',
            value: severityFilter,
            onChange: (value) => { setSeverityFilter(value); setCurrentPage(1); },
            options: [
              { value: 'all', label: t('dialyse.allSeverities') },
              { value: 'critical', label: t('dialyse.critical') },
              { value: 'warning', label: t('dialyse.warning') },
              { value: 'info', label: t('dialyse.info') },
            ],
          },
          {
            name: 'type',
            value: typeFilter,
            onChange: (value) => { setTypeFilter(value); setCurrentPage(1); },
            options: [
              { value: 'all', label: t('dialyse.allTypes') },
              { value: 'prescription_renewal', label: t('dialyse.prescriptionRenewal') },
              { value: 'lab_due', label: t('dialyse.labDue') },
              { value: 'vaccination', label: t('dialyse.vaccination') },
              { value: 'vascular_access', label: t('dialyse.vascularAccess') },
              { value: 'serology_update', label: t('dialyse.serologyUpdate') },
              { value: 'weight_deviation', label: t('dialyse.weightDeviation') },
            ],
          },
        ]}
      />

      {/* Alerts List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} message={t('dialyse.loadingAlerts')} />
        ) : paginatedAlerts.data.length > 0 ? (
          <>
            <div className="divide-y">
              {paginatedAlerts.data.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getSeverityBadge(alert.severity)}
                        {getStatusBadge(alert.status)}
                        <span className="text-xs text-muted-foreground">
                          {getAlertTypeName(alert.alertType)}
                        </span>
                      </div>
                      <Link to={`/dialyse/alerts/${alert.id}`} className="font-medium hover:text-primary hover:underline">
                        {alert.title}
                      </Link>
                      {alert.description && (
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {alert.patient && (
                          <Link
                            to={`/dialyse/patients/${alert.patientId}`}
                            className="text-primary hover:underline"
                          >
                            {alert.patient.contact.firstName} {alert.patient.contact.lastName}
                            <span className="text-muted-foreground ml-1">({alert.patient.medicalId})</span>
                          </Link>
                        )}
                        {alert.dueDate && (
                          <span className="text-muted-foreground">
                            {t('dialyse.dueDate')}: {formatDate(alert.dueDate)}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {t('dialyse.created')}: {formatDateTime(alert.createdAt)}
                        </span>
                      </div>

                      {/* Resolution notes input */}
                      {resolvingAlertId === alert.id && (
                        <div className="mt-3">
                          <textarea
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            placeholder={t('dialyse.resolutionNotesPlaceholder')}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            rows={2}
                          />
                        </div>
                      )}

                      {/* Resolution info */}
                      {alert.status === 'resolved' && alert.resolutionNotes && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                          <span className="font-medium">{t('dialyse.resolution')}:</span> {alert.resolutionNotes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {alert.status === 'active' && (
                        <Button
                          module="dialyse"
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                        >
                          {t('dialyse.acknowledge')}
                        </Button>
                      )}
                      {(alert.status === 'active' || alert.status === 'acknowledged') && (
                        <>
                          <Button
                            module="dialyse"
                            variant="primary"
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                            disabled={resolveMutation.isPending}
                          >
                            {resolvingAlertId === alert.id ? t('dialyse.confirm') : t('dialyse.resolve')}
                          </Button>
                          {resolvingAlertId === alert.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setResolvingAlertId(null); setResolutionNotes(''); }}
                            >
                              {t('dialyse.cancel')}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedAlerts.totalPages}
              totalItems={paginatedAlerts.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            icon={Bell}
            title={t('dialyse.noAlerts')}
            description={
              statusFilter === 'active'
                ? t('dialyse.noActiveAlerts')
                : t('dialyse.noAlertsMatchingFilters')
            }
            module="dialyse"
          />
        )}
      </SectionCard>
    </div>
  );
}
