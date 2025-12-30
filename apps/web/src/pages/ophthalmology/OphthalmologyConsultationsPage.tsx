/**
 * Ophthalmology Consultations Page
 * List and manage ophthalmology consultations
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Plus,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import {
  PageHeader,
  FilterBar,
  SectionCard,
  Button,
  EmptyState,
  InlineLoading,
  getStatusColor,
} from '../../components/healthcare';

export default function OphthalmologyConsultationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['ophthalmology-consultations', searchTerm, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (dateFilter !== 'all') params.append('period', dateFilter);
      const response = await api.get(`/ophthalmology/consultations?${params}`);
      return response.data?.data || [];
    },
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'scheduled': return 'Planifiée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('consultations') || 'Consultations Ophtalmologie'}
        subtitle={t('consultationsDescription') || 'Gestion des consultations ophtalmologiques'}
        icon={Eye}
        module="ophthalmology"
        actions={
          <Button
            module="ophthalmology"
            icon={Plus}
            onClick={() => navigate('/ophthalmology/consultations/new')}
          >
            {t('newConsultation') || 'Nouvelle Consultation'}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('searchConsultations') || 'Rechercher une consultation...'}
        module="ophthalmology"
        filters={[
          {
            name: 'period',
            value: dateFilter,
            options: [
              { value: 'all', label: t('allDates') || 'Toutes les dates' },
              { value: 'today', label: t('today') || "Aujourd'hui" },
              { value: 'week', label: t('thisWeek') || 'Cette semaine' },
              { value: 'month', label: t('thisMonth') || 'Ce mois' },
            ],
            onChange: setDateFilter,
          },
        ]}
      />

      {/* Consultations List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : consultations?.length === 0 ? (
          <EmptyState
            icon={Eye}
            title={t('noConsultations') || 'Aucune consultation trouvée'}
            module="ophthalmology"
            action={{
              label: t('newConsultation') || 'Nouvelle Consultation',
              icon: Plus,
              onClick: () => navigate('/ophthalmology/consultations/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {consultations?.map((consultation: any) => (
              <div
                key={consultation.id}
                onClick={() => navigate(`/ophthalmology/consultations/${consultation.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Eye className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {consultation.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                          {getStatusLabel(consultation.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {consultation.consultationDate ? new Date(consultation.consultationDate).toLocaleDateString('fr-FR') : '-'}
                        </span>
                        {consultation.consultationType && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {consultation.consultationType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 ml-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{consultation.type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{consultation.doctorName}</p>
                    </div>
                  </div>
                </div>
                {consultation.diagnosis && (
                  <div className="mt-2 ml-16 text-sm text-gray-600 dark:text-gray-400">
                    <FileText className="h-4 w-4 inline mr-1" />
                    {consultation.diagnosis}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
