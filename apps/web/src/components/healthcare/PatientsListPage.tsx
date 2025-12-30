/**
 * Patients List Page Component
 * Reusable patients list for all healthcare modules (Dialyse, Cardiology, Ophthalmology)
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Pagination } from '@/components/Pagination';
import { Users, type LucideIcon } from 'lucide-react';
import {
  PageHeader,
  Button,
  StatsCard,
  SectionCard,
  FilterBar,
  InlineLoading,
  EmptyState,
  ActionButtons,
  StatusBadge,
  GenderBadge,
  type HealthcareModule,
} from '@/components/healthcare';
import { formatDate, formatAge, formatPatientName } from '@/utils/healthcare';

// ============================================================================
// TYPES
// ============================================================================

interface PaginatedResponse<T> {
  data: T;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface PatientBase {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  medicalRecordNumber?: string;
  createdAt: string;
}

export interface PatientStats {
  total: number;
  active: number;
  inactive?: number;
  newThisMonth?: number;
  [key: string]: number | undefined;
}

export interface PatientStatusConfig {
  value: string;
  label: string;
}

export interface PatientsListPageProps<T extends PatientBase> {
  module: HealthcareModule;
  // API Configuration
  endpoint: string;
  queryKey: string;
  statsEndpoint?: string;
  statsQueryKey?: string;
  // Labels (optional - uses module translations by default)
  pageTitle?: string;
  pageSubtitle?: string;
  newPatientLabel?: string;
  noResultsTitle?: string;
  noResultsDescription?: string;
  // Custom columns
  renderCustomColumns?: (patient: T) => React.ReactNode;
  customColumnHeaders?: { key: string; label: string }[];
  // Status options
  statusOptions?: PatientStatusConfig[];
  // Additional filters
  additionalFilters?: Array<{
    name: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }>;
  // Custom row class
  getRowClassName?: (patient: T) => string;
  // Navigation paths
  basePath: string;
  // Custom icon
  icon?: LucideIcon;
}

// ============================================================================
// DEFAULT STATUS OPTIONS
// ============================================================================

const defaultStatusOptions: PatientStatusConfig[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'deceased', label: 'Décédé' },
  { value: 'transferred', label: 'Transféré' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PatientsListPage<T extends PatientBase>({
  module,
  endpoint,
  queryKey,
  statsEndpoint,
  statsQueryKey,
  pageTitle,
  pageSubtitle,
  newPatientLabel,
  noResultsTitle,
  noResultsDescription,
  renderCustomColumns,
  customColumnHeaders = [],
  statusOptions = defaultStatusOptions,
  additionalFilters = [],
  getRowClassName,
  basePath,
  icon: Icon = Users,
}: PatientsListPageProps<T>) {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch patients
  const { data: response, isLoading, error } = useQuery({
    queryKey: [queryKey, searchTerm, statusFilter, currentPage, itemsPerPage, ...additionalFilters.map(f => f.value)],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());

      // Add additional filter values
      additionalFilters.forEach(filter => {
        if (filter.value !== 'all') {
          params.append(filter.name, filter.value);
        }
      });

      const url = `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<PaginatedResponse<T[]>>(url);
      return result.data;
    },
  });

  // Fetch stats (optional)
  const { data: stats } = useQuery({
    queryKey: [statsQueryKey || `${queryKey}-stats`],
    queryFn: async () => {
      if (!statsEndpoint) return null;
      const response = await api.get<{ data: PatientStats }>(statsEndpoint);
      return response.data.data;
    },
    enabled: !!statsEndpoint,
  });

  // Delete mutation
  const deletePatient = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${endpoint}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (statsQueryKey) {
        queryClient.invalidateQueries({ queryKey: [statsQueryKey] });
      }
      toast.success(t(`${module}.patientDeleted`));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Handlers
  const handleAddPatient = () => navigate(`${basePath}/new`);
  const handleViewPatient = (id: string) => navigate(`${basePath}/${id}`);
  const handleEditPatient = (id: string) => navigate(`${basePath}/${id}/edit`);
  const handleDeletePatient = (id: string) => {
    if (confirm(t(`${module}.confirmDeletePatient`))) {
      deletePatient.mutate(id);
    }
  };

  // Pagination data
  const paginatedPatients = useMemo(() => {
    const data = response?.data || [];
    const total = response?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data, total, totalPages };
  }, [response, itemsPerPage]);

  // Build filters array
  const filters = [
    {
      name: 'status',
      value: statusFilter,
      options: statusOptions.map(opt => ({ value: opt.value, label: opt.label })),
      onChange: (v: string) => { setStatusFilter(v); setCurrentPage(1); },
    },
    ...additionalFilters.map(filter => ({
      ...filter,
      onChange: (v: string) => { filter.onChange(v); setCurrentPage(1); },
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={pageTitle || t(`${module}.patients`)}
        subtitle={pageSubtitle || t(`${module}.patientsSubtitle`)}
        icon={Icon}
        module={module}
        actions={
          <Button module={module} onClick={handleAddPatient}>
            {newPatientLabel || t(`${module}.newPatient`)}
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard label={t(`${module}.totalPatients`)} value={stats.total} icon={Icon} module={module} />
          <StatsCard label={t(`${module}.activePatients`)} value={stats.active} icon={Icon} module={module} />
          {stats.inactive !== undefined && (
            <StatsCard label={t(`${module}.inactivePatients`)} value={stats.inactive} icon={Icon} module={module} />
          )}
          {stats.newThisMonth !== undefined && (
            <StatsCard label={t(`${module}.newThisMonth`)} value={stats.newThisMonth} icon={Icon} module={module} />
          )}
        </div>
      )}

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={(term) => { setSearchTerm(term); setCurrentPage(1); }}
        searchPlaceholder={t(`${module}.searchPatients`)}
        module={module}
        filters={filters}
      />

      {/* Patients List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">{t('common.error')}: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedPatients.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t(`${module}.patient`)}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t(`${module}.recordNumber`)}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t(`${module}.age`)}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t(`${module}.gender`)}</th>
                    {customColumnHeaders.map(col => (
                      <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{col.label}</th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t(`${module}.status`)}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t(`${module}.createdAt`)}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t(`${module}.actions`)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedPatients.data.map((patient) => (
                    <tr
                      key={patient.id}
                      className={`hover:bg-muted/50 ${getRowClassName ? getRowClassName(patient) : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {formatPatientName(patient.firstName, patient.lastName)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                        {patient.medicalRecordNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatAge(patient.dateOfBirth)}
                      </td>
                      <td className="px-6 py-4">
                        <GenderBadge gender={patient.gender} />
                      </td>
                      {renderCustomColumns && renderCustomColumns(patient)}
                      <td className="px-6 py-4">
                        <StatusBadge status={patient.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(patient.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <ActionButtons
                          onView={() => handleViewPatient(patient.id)}
                          onEdit={() => handleEditPatient(patient.id)}
                          onDelete={() => handleDeletePatient(patient.id)}
                        />
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
            title={noResultsTitle || t(`${module}.noPatientsFound`)}
            description={noResultsDescription || t(`${module}.createFirstPatient`)}
            icon={Icon}
            module={module}
            action={{
              label: newPatientLabel || t(`${module}.newPatient`),
              onClick: handleAddPatient,
            }}
          />
        )}
      </SectionCard>
    </div>
  );
}

export default PatientsListPage;
