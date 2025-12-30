/**
 * Dialyse Protocols Page
 * Manage dialysis treatment protocols/templates
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { Eye, Pencil, Trash2, Plus, Copy } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, Button, StatsCard, SectionCard, InlineLoading } from '@/components/healthcare';

// API returns snake_case - we transform it
interface ProtocolApi {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  description: string | null;
  dialyzer_type: string | null;
  dialyzer_surface: number | null;
  blood_flow_rate: number | null;
  dialysate_flow_rate: number | null;
  session_duration_minutes: number | null;
  uf_goal: number | null;
  anticoagulation_type: string | null;
  anticoagulation_dose: string | null;
  dialysate_sodium: number | null;
  dialysate_potassium: number | null;
  dialysate_bicarbonate: number | null;
  dialysate_calcium: number | null;
  dialysate_temperature: number | null;
  contraindications: string | null;
  special_instructions: string | null;
  created_at: number;
  updated_at: number;
}

interface Protocol {
  id: string;
  name: string;
  code: string;
  type: 'hemodialysis' | 'hemodiafiltration' | 'hemofiltration' | 'peritoneal';
  status: 'active' | 'inactive' | 'draft';
  category: string | null;
  description: string | null;
  // Session parameters
  defaultDurationMinutes: number;
  defaultFrequencyPerWeek: number;
  // Dialyzer settings
  dialyzerType: string | null;
  dialyzerSurfaceArea: number | null;
  bloodFlowRateMin: number | null;
  bloodFlowRateMax: number | null;
  dialysateFlowRate: number | null;
  // Dialysate composition
  dialysateSodium: number | null;
  dialysatePotassium: number | null;
  dialysateCalcium: number | null;
  dialysateBicarbonate: number | null;
  dialysateTemperature: number | null;
  // Anticoagulation
  anticoagulationType: 'heparin' | 'lmwh' | 'citrate' | 'none' | null;
  anticoagulationDose: string | null;
  // Ultrafiltration
  maxUfRate: number | null;
  // Indications
  indications: string | null;
  contraindications: string | null;
  specialInstructions: string | null;
  // Usage
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProtocolStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  byType: Record<string, number>;
}

// Transform API response to frontend format
const transformProtocol = (record: ProtocolApi): Protocol => {
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    type: (record.type as Protocol['type']) || 'hemodialysis',
    status: (record.status as Protocol['status']) || 'draft',
    category: null,
    description: record.description,
    defaultDurationMinutes: record.session_duration_minutes || 240,
    defaultFrequencyPerWeek: 3,
    dialyzerType: record.dialyzer_type,
    dialyzerSurfaceArea: record.dialyzer_surface,
    bloodFlowRateMin: record.blood_flow_rate,
    bloodFlowRateMax: record.blood_flow_rate ? record.blood_flow_rate + 50 : null,
    dialysateFlowRate: record.dialysate_flow_rate,
    dialysateSodium: record.dialysate_sodium,
    dialysatePotassium: record.dialysate_potassium,
    dialysateCalcium: record.dialysate_calcium,
    dialysateBicarbonate: record.dialysate_bicarbonate,
    dialysateTemperature: record.dialysate_temperature,
    anticoagulationType: record.anticoagulation_type as Protocol['anticoagulationType'],
    anticoagulationDose: record.anticoagulation_dose,
    maxUfRate: record.uf_goal,
    indications: null,
    contraindications: record.contraindications,
    specialInstructions: record.special_instructions,
    usageCount: 0,
    createdAt: record.created_at ? new Date(record.created_at).toISOString() : '',
    updatedAt: record.updated_at ? new Date(record.updated_at).toISOString() : '',
  };
};

export function DialyseProtocolsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewingProtocol, setViewingProtocol] = useState<Protocol | null>(null);

  // Fetch protocols
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['dialyse-protocols', searchTerm, statusFilter, typeFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      params.append('limit', itemsPerPage.toString());

      const url = `/dialyse/protocols${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<{ success: boolean; data: ProtocolApi[]; meta?: any }>(url);
      const transformedData = (result.data.data || []).map(transformProtocol);
      return { data: transformedData, meta: result.data.meta };
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dialyse-protocols-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ProtocolStats>>('/dialyse/protocols/stats');
      return response.data.data;
    },
  });

  // Delete protocol mutation
  const deleteProtocol = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dialyse/protocols/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-protocols'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-protocols-stats'] });
      toast.success(t('dialyse.protocolDeleted'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Duplicate protocol mutation
  const duplicateProtocol = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/dialyse/protocols/${id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-protocols'] });
      toast.success(t('dialyse.protocolDuplicated'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleAddProtocol = () => {
    navigate('/dialyse/protocols/new');
  };

  const handleEditProtocol = (protocol: Protocol) => {
    navigate(`/dialyse/protocols/${protocol.id}/edit`);
  };

  const handleViewProtocol = (protocol: Protocol) => {
    setViewingProtocol(protocol);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(t('dialyse.confirmDeleteProtocol').replace('{name}', name))) {
      deleteProtocol.mutate(id);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateProtocol.mutate(id);
  };

  // Calculate paginated data
  const paginatedProtocols = useMemo(() => {
    const items = response?.data || [];
    const total = response?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data: items, total, totalPages };
  }, [response, itemsPerPage]);

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      hemodialysis: 'bg-muted text-foreground',
      hemodiafiltration: 'bg-muted/70 text-foreground',
      hemofiltration: 'bg-muted/80 text-foreground',
      peritoneal: 'bg-muted/60 text-foreground',
    };
    const labels: Record<string, string> = {
      hemodialysis: t('dialyse.typeHemodialysis'),
      hemodiafiltration: t('dialyse.typeHemodiafiltration'),
      hemofiltration: t('dialyse.typeHemofiltration'),
      peritoneal: t('dialyse.typePeritoneal'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-muted/60 text-foreground',
      inactive: 'bg-muted text-muted-foreground',
      draft: 'bg-muted text-foreground',
    };
    const labels: Record<string, string> = {
      active: t('dialyse.statusActive'),
      inactive: t('dialyse.statusInactive'),
      draft: t('dialyse.statusDraft'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.protocols')}
        description={t('dialyse.protocolsSubtitle')}
        module="dialyse"
      >
        <Button onClick={handleAddProtocol}>
          <Plus className="h-4 w-4" />
          {t('dialyse.newProtocol')}
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title={t('dialyse.totalProtocols')} value={stats.total ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.activeProtocols')} value={stats.active ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.draftProtocols')} value={stats.draft ?? 0} module="dialyse" />
          <StatsCard title={t('dialyse.inactiveProtocols')} value={stats.inactive ?? 0} module="dialyse" />
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder={t('dialyse.searchProtocol')}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('dialyse.allStatuses')}</option>
          <option value="active">{t('dialyse.statusActive')}</option>
          <option value="inactive">{t('dialyse.statusInactive')}</option>
          <option value="draft">{t('dialyse.statusDraft')}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('dialyse.allTypes')}</option>
          <option value="hemodialysis">{t('dialyse.typeHemodialysis')}</option>
          <option value="hemodiafiltration">{t('dialyse.typeHemodiafiltration')}</option>
          <option value="hemofiltration">{t('dialyse.typeHemofiltration')}</option>
          <option value="peritoneal">{t('dialyse.typePeritoneal')}</option>
        </select>
      </div>

      {/* Protocols List */}
      <SectionCard module="dialyse">
        {isLoading ? (
          <InlineLoading message={t('dialyse.loadingProtocols')} />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">{t('dialyse.error')}: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedProtocols.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.code')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.duration')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.frequency')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.usages')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.status')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">{t('dialyse.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedProtocols.data.map((protocol) => (
                    <tr key={protocol.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 font-mono text-sm font-medium">{protocol.code}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{protocol.name}</div>
                          {protocol.category && (
                            <div className="text-sm text-muted-foreground">{protocol.category}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(protocol.type)}</td>
                      <td className="px-6 py-4 text-sm">{protocol.defaultDurationMinutes} min</td>
                      <td className="px-6 py-4 text-sm">{protocol.defaultFrequencyPerWeek}x/sem</td>
                      <td className="px-6 py-4 text-sm">{protocol.usageCount}</td>
                      <td className="px-6 py-4">{getStatusBadge(protocol.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewProtocol(protocol)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditProtocol(protocol)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(protocol.id)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                            title={t('dialyse.duplicate')}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(protocol.id, protocol.name)}
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
              totalPages={paginatedProtocols.totalPages}
              totalItems={paginatedProtocols.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title={t('dialyse.noProtocolsFound')}
            description={t('dialyse.noProtocolsFoundDescription')}
            icon="document"
            action={{
              label: t('dialyse.newProtocol'),
              onClick: handleAddProtocol,
            }}
          />
        )}
      </SectionCard>

      {/* View Protocol Modal */}
      {viewingProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">{viewingProtocol.name}</h2>
                    {getStatusBadge(viewingProtocol.status)}
                  </div>
                  <p className="text-muted-foreground font-mono">{viewingProtocol.code}</p>
                </div>
                <button
                  onClick={() => setViewingProtocol(null)}
                  className="p-2 hover:bg-accent rounded-md"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* General Info */}
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-3">{t('dialyse.generalInformation')}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.type')}</dt>
                      <dd>{getTypeBadge(viewingProtocol.type)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.category')}</dt>
                      <dd>{viewingProtocol.category || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.duration')}</dt>
                      <dd className="font-medium">{viewingProtocol.defaultDurationMinutes} {t('dialyse.min')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.frequency')}</dt>
                      <dd className="font-medium">{viewingProtocol.defaultFrequencyPerWeek}x/{t('dialyse.week')}</dd>
                    </div>
                  </dl>
                </div>

                {/* Dialyzer Settings */}
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-3">{t('dialyse.dialyzer')}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.type')}</dt>
                      <dd>{viewingProtocol.dialyzerType || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.surface')}</dt>
                      <dd>{viewingProtocol.dialyzerSurfaceArea ? `${viewingProtocol.dialyzerSurfaceArea} m²` : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.bloodFlowRate')}</dt>
                      <dd>{viewingProtocol.bloodFlowRateMin && viewingProtocol.bloodFlowRateMax
                        ? `${viewingProtocol.bloodFlowRateMin}-${viewingProtocol.bloodFlowRateMax} mL/min` : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.dialysateFlowRate')}</dt>
                      <dd>{viewingProtocol.dialysateFlowRate ? `${viewingProtocol.dialysateFlowRate} mL/min` : '-'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Dialysate Composition */}
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-3">{t('dialyse.dialysateComposition')}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.sodium')}</dt>
                      <dd>{viewingProtocol.dialysateSodium ? `${viewingProtocol.dialysateSodium} mmol/L` : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.potassium')}</dt>
                      <dd>{viewingProtocol.dialysatePotassium ? `${viewingProtocol.dialysatePotassium} mmol/L` : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.calcium')}</dt>
                      <dd>{viewingProtocol.dialysateCalcium ? `${viewingProtocol.dialysateCalcium} mmol/L` : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.bicarbonate')}</dt>
                      <dd>{viewingProtocol.dialysateBicarbonate ? `${viewingProtocol.dialysateBicarbonate} mmol/L` : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.temperature')}</dt>
                      <dd>{viewingProtocol.dialysateTemperature ? `${viewingProtocol.dialysateTemperature}°C` : '-'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Anticoagulation */}
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-3">{t('dialyse.anticoagulation')}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.type')}</dt>
                      <dd className="capitalize">{viewingProtocol.anticoagulationType || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.dose')}</dt>
                      <dd>{viewingProtocol.anticoagulationDose || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.maxUfRate')}</dt>
                      <dd>{viewingProtocol.maxUfRate ? `${viewingProtocol.maxUfRate} mL/h` : '-'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Clinical Notes */}
              {(viewingProtocol.description || viewingProtocol.indications || viewingProtocol.contraindications || viewingProtocol.specialInstructions) && (
                <div className="mt-6 space-y-4">
                  {viewingProtocol.description && (
                    <div className="rounded-lg border p-4">
                      <h3 className="font-semibold mb-2">{t('dialyse.description')}</h3>
                      <p className="text-sm text-muted-foreground">{viewingProtocol.description}</p>
                    </div>
                  )}
                  {viewingProtocol.indications && (
                    <div className="rounded-lg border p-4">
                      <h3 className="font-semibold mb-2">{t('dialyse.indications')}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingProtocol.indications}</p>
                    </div>
                  )}
                  {viewingProtocol.contraindications && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                      <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-300">{t('dialyse.contraindications')}</h3>
                      <p className="text-sm text-slate-700 dark:text-slate-400 whitespace-pre-wrap">{viewingProtocol.contraindications}</p>
                    </div>
                  )}
                  {viewingProtocol.specialInstructions && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                      <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-300">{t('dialyse.specialInstructions')}</h3>
                      <p className="text-sm text-slate-700 dark:text-slate-400 whitespace-pre-wrap">{viewingProtocol.specialInstructions}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => { setViewingProtocol(null); handleEditProtocol(viewingProtocol); }}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  {t('dialyse.edit')}
                </button>
                <button
                  onClick={() => setViewingProtocol(null)}
                  className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
                >
                  {t('dialyse.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
