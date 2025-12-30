/**
 * Cardiology Stents Page
 * Manage coronary stents
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
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

export default function CardiologyStentsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: stents, isLoading } = useQuery({
    queryKey: ['cardiology-stents', searchTerm, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      const response = await api.get(`/cardiology/stents?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.stents')}
        subtitle={t('cardiology.stentsSubtitle')}
        icon={TrendingUp}
        module="cardiology"
        actions={
          <Button
            module="cardiology"
            icon={Plus}
            onClick={() => navigate('/cardiology/stents/new')}
          >
            {t('cardiology.newStent')}
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
            name: 'type',
            value: typeFilter,
            options: [
              { value: 'all', label: t('common.allTypes') },
              { value: 'DES', label: 'DES (Drug-Eluting)' },
              { value: 'BMS', label: 'BMS (Bare-Metal)' },
              { value: 'BVS', label: 'BVS (Bioabsorbable)' },
            ],
            onChange: setTypeFilter,
          },
        ]}
      />

      {/* Stents List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : stents?.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title={t('cardiology.noStentFound')}
            module="cardiology"
            action={{
              label: t('cardiology.newStent'),
              icon: Plus,
              onClick: () => navigate('/cardiology/stents/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stents?.map((stent: any) => (
              <div
                key={stent.id}
                onClick={() => navigate(`/cardiology/stents/${stent.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {stent.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor('completed')}`}>
                          {stent.stentType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {stent.location} • {stent.manufacturer} {stent.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 ml-4">
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">{t('cardiology.dimensions')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {stent.diameter}mm × {stent.length}mm
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">{t('cardiology.implanted')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(stent.implantDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
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
