/**
 * Dialyse Patients Page
 * Manage dialysis patients
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pagination } from '@/components/Pagination';
import { Users, Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { PageHeader, Button, StatsCard, SectionCard, FilterBar, EmptyState, InlineLoading } from '@/components/healthcare';

interface DialysePatient {
  id: string;
  medicalId: string;
  patientStatus: 'active' | 'transferred' | 'deceased' | 'transplanted' | 'recovered';
  bloodType: string | null;
  hivStatus: 'negative' | 'positive' | 'unknown';
  hbvStatus: 'negative' | 'positive' | 'unknown';
  hcvStatus: 'negative' | 'positive' | 'unknown';
  requiresIsolation: boolean;
  dialysisStartDate: Date | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface PatientStats {
  totalPatients: number;
  activePatients: number;
  isolationPatients: number;
  recentlyAdded: number;
}

interface PaginatedResponse<T> {
  data: T;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export function DialysePatientsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isolationFilter, setIsolationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch patients with server-side pagination
  const { data: patientsResponse, isLoading, error } = useQuery({
    queryKey: ['dialyse-patients', searchTerm, statusFilter, isolationFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (isolationFilter !== 'all') params.append('requiresIsolation', isolationFilter);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());

      const url = `/dialyse/patients${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<PaginatedResponse<DialysePatient[]>>(url);
      return response.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dialyse-patients-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PatientStats>>('/dialyse/patients/stats');
      return response.data.data;
    },
  });

  // Delete patient mutation
  const deletePatient = useMutation({
    mutationFn: async (patientId: string) => {
      await api.delete(`/dialyse/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients-stats'] });
      toast.success(t('dialyse.patientDeleted'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update patient status mutation
  const updatePatientStatus = useMutation({
    mutationFn: async ({ patientId, status }: { patientId: string; status: string }) => {
      await api.put(`/dialyse/patients/${patientId}`, { patientStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients-stats'] });
      toast.success(t('dialyse.statusUpdated'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleStatusChange = (patientId: string, patientName: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) return;

    const statusLabels: Record<string, string> = {
      active: t('dialyse.statusActive'),
      transferred: t('dialyse.statusTransferred'),
      deceased: t('dialyse.statusDeceased'),
      transplanted: t('dialyse.statusTransplanted'),
      recovered: t('dialyse.statusRecovered'),
    };

    if (confirm(`${t('dialyse.confirmStatusChange')} "${patientName}" (${statusLabels[currentStatus]} → ${statusLabels[newStatus]})?`)) {
      updatePatientStatus.mutate({ patientId, status: newStatus });
    }
  };

  const handleAddPatient = () => {
    navigate('/dialyse/patients/new');
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/dialyse/patients/${patientId}`);
  };

  const handleEditPatient = (patientId: string) => {
    navigate(`/dialyse/patients/${patientId}/edit`);
  };

  const handleDelete = (patientId: string, patientName: string) => {
    if (confirm(`${t('dialyse.confirmDelete')} "${patientName}"?`)) {
      deletePatient.mutate(patientId);
    }
  };

  // Get paginated data from server response
  const paginatedPatients = useMemo(() => {
    const data = patientsResponse?.data || [];
    const total = patientsResponse?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [patientsResponse, itemsPerPage]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const getSerologyBadge = (status: string) => {
    if (status === 'positive') return <span className="text-slate-900 dark:text-white font-bold">+</span>;
    if (status === 'negative') return <span className="text-slate-500 dark:text-slate-400">-</span>;
    return <span className="text-slate-300 dark:text-slate-600">?</span>;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.dialysisPatients')}
        subtitle={t('dialyse.dialysisPatientsSubtitle')}
        icon={Users}
        module="dialyse"
        actions={
          <Button
            module="dialyse"
            icon={Plus}
            onClick={handleAddPatient}
          >
            {t('dialyse.newPatient')}
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            label={t('dialyse.totalPatients')}
            value={stats.totalPatients ?? 0}
            icon={Users}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.activePatients')}
            value={stats.activePatients ?? 0}
            icon={Users}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.inIsolation')}
            value={stats.isolationPatients ?? 0}
            icon={Users}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.recentlyAdded')}
            value={stats.recentlyAdded ?? 0}
            icon={Users}
            module="dialyse"
          />
        </div>
      )}

      {/* Filters and Search */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t('dialyse.searchPatientPlaceholder')}
        module="dialyse"
        filters={[
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'all', label: t('dialyse.allStatuses') },
              { value: 'active', label: t('dialyse.statusActive') },
              { value: 'transferred', label: t('dialyse.statusTransferred') },
              { value: 'transplanted', label: t('dialyse.statusTransplanted') },
              { value: 'recovered', label: t('dialyse.statusRecovered') },
              { value: 'deceased', label: t('dialyse.statusDeceased') },
            ],
            onChange: (v) => { setStatusFilter(v); setCurrentPage(1); },
          },
          {
            name: 'isolation',
            value: isolationFilter,
            options: [
              { value: 'all', label: t('dialyse.all') },
              { value: 'true', label: t('dialyse.isolation') },
              { value: 'false', label: t('dialyse.nonIsolation') },
            ],
            onChange: (v) => { setIsolationFilter(v); setCurrentPage(1); },
          },
        ]}
      />

      {/* Patients List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading message={t('dialyse.loadingPatients')} />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">{t('dialyse.error')}: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedPatients.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dialyse.medicalId')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dialyse.patient')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dialyse.bloodType')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dialyse.serology')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dialyse.isolation')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dialyse.dialysisStart')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dialyse.status')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('dialyse.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedPatients.data.map((patient) => (
                    <tr key={patient.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-mono">{patient.medicalId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">
                            {patient.contact.firstName} {patient.contact.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{patient.contact.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {patient.bloodType || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">HIV:</span>
                          {getSerologyBadge(patient.hivStatus)}
                          <span className="text-muted-foreground ml-2">HBV:</span>
                          {getSerologyBadge(patient.hbvStatus)}
                          <span className="text-muted-foreground ml-2">HCV:</span>
                          {getSerologyBadge(patient.hcvStatus)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {patient.requiresIsolation ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-white dark:bg-slate-600">
                            {t('dialyse.yes')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">{t('dialyse.no')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(patient.dialysisStartDate)}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={patient.patientStatus}
                          onChange={(e) => handleStatusChange(
                            patient.id,
                            `${patient.contact.firstName} ${patient.contact.lastName}`,
                            e.target.value,
                            patient.patientStatus
                          )}
                          disabled={updatePatientStatus.isPending}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${
                            patient.patientStatus === 'active' ? 'bg-slate-800 text-white dark:bg-slate-600' :
                            patient.patientStatus === 'transferred' ? 'bg-slate-500 text-white dark:bg-slate-500' :
                            patient.patientStatus === 'deceased' ? 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-300' :
                            patient.patientStatus === 'transplanted' ? 'bg-slate-600 text-white dark:bg-slate-500' :
                            patient.patientStatus === 'recovered' ? 'bg-slate-400 text-white dark:bg-slate-500' :
                            'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <option value="active">{t('dialyse.statusActive')}</option>
                          <option value="transferred">{t('dialyse.statusTransferred')}</option>
                          <option value="transplanted">{t('dialyse.statusTransplanted')}</option>
                          <option value="recovered">{t('dialyse.statusRecovered')}</option>
                          <option value="deceased">{t('dialyse.statusDeceased')}</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewPatient(patient.id)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditPatient(patient.id)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(patient.id, `${patient.contact.firstName} ${patient.contact.lastName}`)}
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
              totalPages={paginatedPatients.totalPages}
              totalItems={paginatedPatients.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title={t('dialyse.noPatientsFound')}
            message={t('dialyse.addFirstPatient')}
            icon={Users}
            module="dialyse"
            action={{
              label: t('dialyse.newPatient'),
              onClick: handleAddPatient,
            }}
          />
        )}
      </SectionCard>
    </div>
  );
}
