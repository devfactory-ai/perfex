/**
 * Cardiology Patients Page
 * List of cardiology patients with search and filters
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, User, AlertTriangle, Activity, Calendar } from 'lucide-react';
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

interface CardiologyPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryDiagnosis: string;
  lastConsultation: string;
  nextAppointment: string;
  hasActiveAlerts: boolean;
  hasPacemaker: boolean;
  hasStent: boolean;
}

const riskLevelConfig: Record<string, { label: string; variant: 'gray' | 'blue' | 'orange' | 'red' }> = {
  low: { label: 'Faible', variant: 'gray' },
  medium: { label: 'Moyen', variant: 'blue' },
  high: { label: 'Élevé', variant: 'orange' },
  critical: { label: 'Critique', variant: 'red' },
};

export default function CardiologyPatientsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['cardiology-patients', searchTerm, riskFilter, deviceFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (riskFilter !== 'all') params.append('riskLevel', riskFilter);
      if (deviceFilter !== 'all') params.append('device', deviceFilter);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      const response = await api.get<PaginatedResponse<CardiologyPatient[]>>(`/cardiology/patients?${params}`);
      return response.data;
    },
  });

  const paginatedData = useMemo(() => {
    const data = patients?.data || [];
    const total = patients?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data, total, totalPages };
  }, [patients, itemsPerPage]);

  const handleAddPatient = () => navigate('/cardiology/patients/new');
  const handleViewPatient = (id: string) => navigate(`/cardiology/patients/${id}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiologyPatients') || 'Patients Cardiologie'}
        subtitle={t('cardiologyPatientsDescription') || 'Gestion des patients cardiaques'}
        icon={Heart}
        module="cardiology"
        actions={
          <Button module="cardiology" icon={Plus} onClick={handleAddPatient}>
            {t('newPatient') || 'Nouveau Patient'}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
        searchPlaceholder={t('searchPatients') || 'Rechercher un patient...'}
        module="cardiology"
        filters={[
          {
            name: 'risk',
            value: riskFilter,
            options: [
              { value: 'all', label: t('allRiskLevels') || 'Tous les niveaux' },
              { value: 'critical', label: t('critical') || 'Critique' },
              { value: 'high', label: t('high') || 'Élevé' },
              { value: 'medium', label: t('medium') || 'Moyen' },
              { value: 'low', label: t('low') || 'Faible' },
            ],
            onChange: (v) => { setRiskFilter(v); setCurrentPage(1); },
          },
          {
            name: 'device',
            value: deviceFilter,
            options: [
              { value: 'all', label: t('allDevices') || 'Tous les dispositifs' },
              { value: 'pacemaker', label: t('pacemaker') || 'Pacemaker' },
              { value: 'stent', label: t('stent') || 'Stent' },
              { value: 'none', label: t('noDevice') || 'Sans dispositif' },
            ],
            onChange: (v) => { setDeviceFilter(v); setCurrentPage(1); },
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
            module="cardiology"
            action={{
              label: t('newPatient') || 'Nouveau Patient',
              icon: Plus,
              onClick: handleAddPatient,
            }}
          />
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.data?.map((patient) => {
                const risk = riskLevelConfig[patient.riskLevel] || riskLevelConfig.low;
                return (
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
                            <Badge variant={risk.variant} size="sm">
                              {risk.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                            <span>{formatAge(patient.dateOfBirth)}</span>
                            <span>•</span>
                            <span>{patient.gender === 'male' || patient.gender === 'M' ? 'H' : 'F'}</span>
                            {patient.bloodType && (
                              <>
                                <span>•</span>
                                <Badge variant="red" size="xs">{patient.bloodType}</Badge>
                              </>
                            )}
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
                        {patient.hasPacemaker && (
                          <Badge variant="purple" size="sm">PM</Badge>
                        )}
                        {patient.hasStent && (
                          <Badge variant="blue" size="sm">Stent</Badge>
                        )}
                      </div>
                    </div>

                    {patient.primaryDiagnosis && (
                      <div className="mt-2 ml-16 text-sm text-gray-600 dark:text-gray-400">
                        <Activity className="h-4 w-4 inline mr-1" />
                        {patient.primaryDiagnosis}
                      </div>
                    )}
                  </div>
                );
              })}
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
