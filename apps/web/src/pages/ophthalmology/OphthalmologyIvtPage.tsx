/**
 * Ophthalmology IVT Injections Page
 * List and manage intravitreal injections
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Syringe,
  Plus,
  Calendar,
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
} from '../../components/healthcare';

export default function OphthalmologyIvtPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [drugFilter, setDrugFilter] = useState<string>('all');

  const { data: injections, isLoading } = useQuery({
    queryKey: ['ophthalmology-ivt', searchTerm, drugFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (drugFilter !== 'all') params.append('drug', drugFilter);
      const response = await api.get(`/ophthalmology/ivt-injections?${params}`);
      return response.data?.data || [];
    },
  });

  const getDrugColor = (drug: string | undefined | null) => {
    if (!drug) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
    if (drug.includes('Eylea') || drug.includes('aflibercept')) {
      return 'bg-slate-800 text-white dark:bg-slate-600';
    }
    if (drug.includes('Lucentis') || drug.includes('ranibizumab')) {
      return 'bg-slate-400 text-white dark:bg-slate-500';
    }
    if (drug.includes('Avastin') || drug.includes('bevacizumab')) {
      return 'bg-slate-500 text-white dark:bg-slate-500';
    }
    if (drug.includes('Vabysmo') || drug.includes('faricimab')) {
      return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('ophthalmology.ivtTitle')}
        subtitle={t('ophthalmology.ivtSubtitle')}
        icon={Syringe}
        module="ophthalmology"
        actions={
          <Button
            module="ophthalmology"
            icon={Plus}
            onClick={() => navigate('/ophthalmology/ivt-injections/new')}
          >
            {t('ophthalmology.newIvt')}
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
            name: 'drug',
            value: drugFilter,
            options: [
              { value: 'all', label: t('ophthalmology.allDrugs') },
              { value: 'aflibercept', label: 'Aflibercept (Eylea)' },
              { value: 'ranibizumab', label: 'Ranibizumab (Lucentis)' },
              { value: 'bevacizumab', label: 'Bevacizumab (Avastin)' },
              { value: 'faricimab', label: 'Faricimab (Vabysmo)' },
              { value: 'dexamethasone', label: 'Dexaméthasone (Ozurdex)' },
            ],
            onChange: setDrugFilter,
          },
        ]}
      />

      {/* IVT List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : injections?.length === 0 ? (
          <EmptyState
            icon={Syringe}
            title={t('ophthalmology.noIvtFound')}
            module="ophthalmology"
            action={{
              label: t('ophthalmology.newIvt'),
              icon: Plus,
              onClick: () => navigate('/ophthalmology/ivt-injections/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {injections?.map((injection: any) => (
              <div
                key={injection.id}
                onClick={() => navigate(`/ophthalmology/ivt-injections/${injection.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Syringe className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {injection.patientName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {injection.eye === 'OD' ? 'OD' : 'OG'}
                        </span>
                        {injection.drug && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDrugColor(injection.drug)}`}>
                            {injection.drug}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(injection.injectionDate).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{injection.indication}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-sm ml-4">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Injection #</p>
                      <p className="font-medium text-gray-900 dark:text-white">{injection.injectionNumber}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Lot</p>
                      <p className="font-medium text-gray-900 dark:text-white">{injection.lotNumber || '-'}</p>
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
