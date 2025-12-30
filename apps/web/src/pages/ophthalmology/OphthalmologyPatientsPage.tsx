/**
 * Ophthalmology Patients Page
 * List of ophthalmology patients with search and filters
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, User, AlertTriangle, Calendar, Glasses } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import {
  PageHeader,
  FilterBar,
  SectionCard,
  Button,
  EmptyState,
  InlineLoading,
  Badge,
} from '@/components/healthcare';
import { Pagination } from '@/components/Pagination';
import { formatAge, formatDate } from '@/utils/healthcare';
import { type PaginatedResponse } from '@/hooks/useHealthcare';

interface OphthalmologyPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  primaryDiagnosis: string;
  lastConsultation: string;
  nextAppointment: string;
  hasActiveAlerts: boolean;
  hasIolImplant: boolean;
  hasGlaucoma: boolean;
  hasDmla: boolean;
}

export default function OphthalmologyPatientsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['ophthalmology-patients', searchTerm, conditionFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (conditionFilter !== 'all') params.append('condition', conditionFilter);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      const response = await api.get<PaginatedResponse<OphthalmologyPatient[]>>(`/ophthalmology/patients?${params}`);
      return response.data;
    },
  });

  const paginatedData = useMemo(() => {
    const data = patients?.data || [];
    const total = patients?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data, total, totalPages };
  }, [patients, itemsPerPage]);

  const handleAddPatient = () => navigate('/ophthalmology/patients/new');
  const handleViewPatient = (id: string) => navigate(`/ophthalmology/patients/${id}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('ophthalmologyPatients') || 'Patients Ophtalmologie'}
        subtitle={t('ophthalmologyPatientsDescription') || 'Gestion des patients ophtalmologiques'}
        icon={Eye}
        module="ophthalmology"
        actions={
          <Button module="ophthalmology" icon={Plus} onClick={handleAddPatient}>
            {t('newPatient') || 'Nouveau Patient'}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
        searchPlaceholder={t('searchPatients') || 'Rechercher un patient...'}
        module="ophthalmology"
        filters={[
          {
            name: 'condition',
            value: conditionFilter,
            options: [
              { value: 'all', label: t('allConditions') || 'Toutes les pathologies' },
              { value: 'glaucoma', label: t('glaucoma') || 'Glaucome' },
              { value: 'dmla', label: t('dmla') || 'DMLA' },
              { value: 'cataract', label: t('cataract') || 'Cataracte' },
              { value: 'diabeticRetinopathy', label: t('diabeticRetinopathy') || 'Rétinopathie diabétique' },
              { value: 'iol', label: t('iolImplant') || 'Implant IOL' },
            ],
            onChange: (v) => { setConditionFilter(v); setCurrentPage(1); },
          },
        ]}
      />

      {/* Patients List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : paginatedData.data?.length === 0 ? (
          <EmptyState
            icon={User}
            title={t('noPatients') || 'Aucun patient trouvé'}
            module="ophthalmology"
            action={{
              label: t('newPatient') || 'Nouveau Patient',
              icon: Plus,
              onClick: handleAddPatient,
            }}
          />
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.data?.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleViewPatient(patient.id)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {patient.lastName?.toUpperCase()} {patient.firstName}
                          </h3>
                          {patient.hasActiveAlerts && (
                            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span>{formatAge(patient.dateOfBirth)}</span>
                          <span>•</span>
                          <span>{patient.gender === 'male' || patient.gender === 'M' ? 'H' : 'F'}</span>
                          {patient.lastConsultation && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(patient.lastConsultation)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {patient.hasGlaucoma && (
                        <Badge variant="purple" size="sm">Glaucome</Badge>
                      )}
                      {patient.hasDmla && (
                        <Badge variant="orange" size="sm">DMLA</Badge>
                      )}
                      {patient.hasIolImplant && (
                        <Badge variant="blue" size="sm">
                          <Glasses className="h-3 w-3 mr-1" />
                          IOL
                        </Badge>
                      )}
                    </div>
                  </div>

                  {patient.primaryDiagnosis && (
                    <div className="mt-2 ml-16 text-sm text-gray-600 dark:text-gray-400">
                      <Eye className="h-4 w-4 inline mr-1" />
                      {patient.primaryDiagnosis}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedData.totalPages}
              totalItems={paginatedData.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}
