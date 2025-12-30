/**
 * Ophthalmology Refraction Page
 * Manage refraction measurements
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Calendar } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import {
  PageHeader,
  FilterBar,
  SectionCard,
  ListItemCard,
  Button,
  EmptyState,
  InlineLoading,
} from '../../components/healthcare';

export default function OphthalmologyRefractionPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: refractions, isLoading } = useQuery({
    queryKey: ['ophthalmology-refraction', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/ophthalmology/refraction?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('ophthalmology.refraction')}
        subtitle={t('ophthalmology.visualAcuity')}
        icon={Eye}
        module="ophthalmology"
        actions={
          <Button
            module="ophthalmology"
            icon={Plus}
            onClick={() => navigate('/ophthalmology/refraction/new')}
          >
            {t('common.new')}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.search')}
        module="ophthalmology"
      />

      {/* Refraction List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : refractions?.length === 0 ? (
          <EmptyState
            icon={Eye}
            title={t('common.noData')}
            module="ophthalmology"
            action={{
              label: t('common.new'),
              icon: Plus,
              onClick: () => navigate('/ophthalmology/refraction/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {refractions?.map((ref: any) => (
              <ListItemCard
                key={ref.id}
                title={ref.patientName}
                icon={Eye}
                module="ophthalmology"
                metadata={[
                  {
                    icon: Calendar,
                    label: ref.measurementDate ? new Date(ref.measurementDate).toLocaleDateString('fr-FR') : '-',
                  },
                ]}
                rightContent={
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">OD Sphère</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ref.odSphere !== null && ref.odSphere !== undefined ? `${ref.odSphere > 0 ? '+' : ''}${ref.odSphere}` : '-'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">OS Sphère</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ref.osSphere !== null && ref.osSphere !== undefined ? `${ref.osSphere > 0 ? '+' : ''}${ref.osSphere}` : '-'}
                      </p>
                    </div>
                  </div>
                }
                onClick={() => navigate(`/ophthalmology/refraction/${ref.id}/edit`)}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
