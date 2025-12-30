/**
 * Ophthalmology Visual Fields Page
 * List and manage visual field examinations
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Calendar,
  AlertTriangle,
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

export default function OphthalmologyVisualFieldsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [eyeFilter, setEyeFilter] = useState<string>('all');

  const { data: visualFields, isLoading } = useQuery({
    queryKey: ['ophthalmology-visual-fields', searchTerm, eyeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (eyeFilter !== 'all') params.append('eye', eyeFilter);
      const response = await api.get(`/ophthalmology/visual-fields?${params}`);
      return response.data?.data || [];
    },
  });

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'reliable':
        return getStatusColor('completed');
      case 'borderline':
        return getStatusColor('pending');
      case 'unreliable':
        return getStatusColor('cancelled');
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getReliabilityLabel = (reliability: string) => {
    switch (reliability) {
      case 'reliable': return t('ophthalmology.reliable');
      case 'borderline': return t('ophthalmology.borderlineReliability');
      case 'unreliable': return t('ophthalmology.unreliable');
      default: return reliability;
    }
  };

  const getMdColor = (md: number) => {
    if (md > -6) return 'text-slate-600 dark:text-slate-400';
    if (md > -12) return 'text-slate-700 dark:text-slate-500';
    return 'text-slate-800 dark:text-slate-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('ophthalmology.visualFieldsTitle')}
        subtitle={t('ophthalmology.visualFieldsSubtitle')}
        icon={Target}
        module="ophthalmology"
        actions={
          <Button
            module="ophthalmology"
            icon={Plus}
            onClick={() => navigate('/ophthalmology/visual-fields/new')}
          >
            {t('ophthalmology.newVisualField')}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.searchPatient')}
        module="ophthalmology"
        filters={[
          {
            name: 'eye',
            value: eyeFilter,
            options: [
              { value: 'all', label: t('ophthalmology.allEyes') },
              { value: 'OD', label: t('ophthalmology.rightEyeOD') },
              { value: 'OG', label: t('ophthalmology.leftEyeOG') },
            ],
            onChange: setEyeFilter,
          },
        ]}
      />

      {/* Visual Fields List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : visualFields?.length === 0 ? (
          <EmptyState
            icon={Target}
            title={t('ophthalmology.noVisualFieldFound')}
            module="ophthalmology"
            action={{
              label: t('ophthalmology.newVisualField'),
              icon: Plus,
              onClick: () => navigate('/ophthalmology/visual-fields/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {visualFields?.map((vf: any) => (
              <div
                key={vf.id}
                onClick={() => navigate(`/ophthalmology/visual-fields/${vf.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Target className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {vf.patientName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {vf.eye === 'OD' ? t('ophthalmology.rightEye') : t('ophthalmology.leftEye')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getReliabilityColor(vf.reliability)}`}>
                          {getReliabilityLabel(vf.reliability)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(vf.testDate).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{vf.testStrategy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-sm ml-4">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">MD</p>
                      <p className={`font-medium ${getMdColor(vf.meanDeviation)}`}>
                        {vf.meanDeviation > 0 ? '+' : ''}{vf.meanDeviation} dB
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">PSD</p>
                      <p className="font-medium text-gray-900 dark:text-white">{vf.patternStandardDeviation} dB</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">VFI</p>
                      <p className="font-medium text-gray-900 dark:text-white">{vf.visualFieldIndex}%</p>
                    </div>
                    {vf.ghtStatus && vf.ghtStatus !== 'Within Normal Limits' && (
                      <AlertTriangle className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
