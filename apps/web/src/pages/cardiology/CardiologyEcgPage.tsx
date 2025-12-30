/**
 * Cardiology ECG Page
 * List and manage ECG recordings
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Plus,
  Calendar,
  Activity,
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

export default function CardiologyEcgPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [interpretationFilter, setInterpretationFilter] = useState<string>('all');

  const { data: ecgRecords, isLoading } = useQuery({
    queryKey: ['cardiology-ecg', searchTerm, interpretationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (interpretationFilter !== 'all') params.append('interpretation', interpretationFilter);
      const response = await api.get(`/cardiology/ecg?${params}`);
      return response.data?.data || [];
    },
  });

  const getInterpretationLabel = (interpretation: string | undefined | null) => {
    if (!interpretation) return t('cardiology.notInterpreted');
    const lowerInterp = interpretation.toLowerCase();
    if (lowerInterp.includes('normal') && !lowerInterp.includes('abnormal')) return t('common.normal');
    if (lowerInterp.includes('abnormal') || lowerInterp.includes('fibrillation')) return t('common.abnormal');
    if (lowerInterp.includes('paced')) return t('cardiology.paced');
    return t('cardiology.toReview');
  };

  const getInterpretationStatus = (interpretation: string | undefined | null) => {
    if (!interpretation) return 'pending';
    const lowerInterp = interpretation.toLowerCase();
    if (lowerInterp.includes('normal') && !lowerInterp.includes('abnormal')) return 'completed';
    if (lowerInterp.includes('abnormal') || lowerInterp.includes('fibrillation')) return 'critical';
    if (lowerInterp.includes('paced')) return 'in-progress';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.ecg')}
        subtitle={t('cardiology.ecgSubtitle')}
        icon={Zap}
        module="cardiology"
        actions={
          <Button
            module="cardiology"
            icon={Plus}
            onClick={() => navigate('/cardiology/ecg/new')}
          >
            {t('cardiology.newEcg')}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.searchPatient')}
        module="cardiology"
        filters={[
          {
            name: 'interpretation',
            value: interpretationFilter,
            options: [
              { value: 'all', label: t('cardiology.allInterpretations') },
              { value: 'normal', label: t('common.normal') },
              { value: 'abnormal', label: t('common.abnormal') },
              { value: 'borderline', label: t('cardiology.borderline') },
            ],
            onChange: setInterpretationFilter,
          },
        ]}
      />

      {/* ECG List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : ecgRecords?.length === 0 ? (
          <EmptyState
            icon={Zap}
            title={t('cardiology.noEcgFound')}
            module="cardiology"
            action={{
              label: t('cardiology.newEcg'),
              icon: Plus,
              onClick: () => navigate('/cardiology/ecg/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {ecgRecords?.map((ecg: any) => (
              <div
                key={ecg.id}
                onClick={() => navigate(`/cardiology/ecg/${ecg.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {ecg.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(getInterpretationStatus(ecg.interpretation))}`}>
                          {getInterpretationLabel(ecg.interpretation)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(ecg.recordingDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 ml-4">
                    {/* ECG Parameters */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">FC</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.heartRate} bpm</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">PR</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.prInterval} ms</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">QRS</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.qrsDuration} ms</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">QT</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.qtInterval} ms</p>
                      </div>
                    </div>
                  </div>
                </div>
                {ecg.findings && (
                  <div className="mt-2 ml-16 text-sm text-gray-600 dark:text-gray-400">
                    <Activity className="h-4 w-4 inline mr-1" />
                    {ecg.findings}
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
