/**
 * Ophthalmology OSDI Scores Page
 * Manage Ocular Surface Disease Index questionnaires
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { PageHeader, FilterBar, SectionCard, Button, EmptyState, InlineLoading } from '../../components/healthcare';

export default function OphthalmologyOsdiPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: scores, isLoading } = useQuery({
    queryKey: ['ophthalmology-osdi', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/ophthalmology/osdi-scores?${params}`);
      return response.data?.data || [];
    },
  });

  const getSeverityColor = (score: number) => {
    if (score <= 12) return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    if (score <= 22) return 'bg-slate-400 text-white dark:bg-slate-500';
    if (score <= 32) return 'bg-slate-500 text-white dark:bg-slate-500';
    return 'bg-slate-800 text-white dark:bg-slate-600';
  };

  const getSeverityLabel = (score: number) => {
    if (score <= 12) return 'Normal';
    if (score <= 22) return 'Léger';
    if (score <= 32) return 'Modéré';
    return 'Sévère';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('ophthalmology.osdiScores')}
        subtitle={t('ophthalmology.dryEye')}
        icon={FileText}
        module="ophthalmology"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/ophthalmology/osdi-scores/new')}
            module="ophthalmology"
          >
            {t('common.new')}
          </Button>
        }
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        module="ophthalmology"
      />

      <SectionCard module="ophthalmology">
        {isLoading ? (
          <InlineLoading module="ophthalmology" />
        ) : scores?.length === 0 ? (
          <EmptyState
            icon={FileText}
            message={t('common.noData')}
            module="ophthalmology"
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {scores?.map((osdi: any) => (
              <div
                key={osdi.id}
                onClick={() => navigate(`/ophthalmology/osdi-scores/${osdi.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {osdi.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(osdi.totalScore)}`}>
                          {getSeverityLabel(osdi.totalScore)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(osdi.completedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Score</p>
                        <p className="font-medium text-gray-900 dark:text-white">{osdi.totalScore}/100</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
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
