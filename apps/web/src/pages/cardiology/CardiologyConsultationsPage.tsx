/**
 * Cardiology Consultations Page
 * List and manage cardiology consultations
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Plus, Calendar, Clock, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import {
  PageHeader,
  FilterBar,
  SectionCard,
  Button,
  EmptyState,
  InlineLoading,
} from '../../components/healthcare';

export default function CardiologyConsultationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['cardiology-consultations', searchTerm, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (dateFilter !== 'all') params.append('period', dateFilter);
      const response = await api.get(`/cardiology/consultations?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('consultations') || 'Consultations Cardiologie'}
        subtitle={t('consultationsDescription') || 'Gestion des consultations cardiaques'}
        icon={Stethoscope}
        module="cardiology"
        actions={
          <Button
            module="cardiology"
            icon={Plus}
            onClick={() => navigate('/cardiology/consultations/new')}
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
        module="cardiology"
        filters={[
          {
            name: 'date',
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
            icon={Stethoscope}
            title={t('noConsultations') || 'Aucune consultation trouvée'}
            module="cardiology"
            action={{
              label: t('newConsultation') || 'Nouvelle Consultation',
              icon: Plus,
              onClick: () => navigate('/cardiology/consultations/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {consultations?.map((consultation: any) => (
              <div
                key={consultation.id}
                onClick={() => navigate(`/cardiology/consultations/${consultation.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {consultation.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          consultation.status === 'completed' ? 'bg-slate-600 text-white dark:bg-slate-500' :
                          consultation.status === 'scheduled' ? 'bg-slate-400 text-white dark:bg-slate-500' :
                          'bg-slate-500 text-white dark:bg-slate-500'
                        }`}>
                          {consultation.status === 'completed' ? 'Terminée' :
                           consultation.status === 'scheduled' ? 'Planifiée' : 'Annulée'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
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
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right hidden md:block">
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
