/**
 * Ophthalmology Tonometry Page
 * Manage intraocular pressure measurements
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Gauge,
  Calendar,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { PageHeader, FilterBar, SectionCard, Button, EmptyState, InlineLoading } from '../../components/healthcare';

export default function OphthalmologyTonometryPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: measurements, isLoading } = useQuery({
    queryKey: ['ophthalmology-tonometry', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/ophthalmology/tonometry?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('ophthalmology.tonometry')}
        subtitle={t('ophthalmology.iop')}
        icon={Gauge}
        module="ophthalmology"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/ophthalmology/tonometry/new')}
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
        ) : measurements?.length === 0 ? (
          <EmptyState
            icon={Gauge}
            message={t('common.noData')}
            module="ophthalmology"
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {measurements?.map((m: any) => (
              <div
                key={m.id}
                onClick={() => navigate(`/ophthalmology/tonometry/${m.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Gauge className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {m.patientName || `Patient ${m.patientId}`}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {m.measurementDate ? new Date(m.measurementDate).toLocaleDateString('fr-FR') : m.measurementTime || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">OD</p>
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-gray-900 dark:text-white">{m.iopOd ?? '-'} mmHg</p>
                          {typeof m.iopOd === 'number' && m.iopOd > 21 && <AlertTriangle className="h-4 w-4 text-slate-500" />}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">OS</p>
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-gray-900 dark:text-white">{typeof m.iopOs === 'number' ? m.iopOs : '-'} mmHg</p>
                          {typeof m.iopOs === 'number' && m.iopOs > 21 && <AlertTriangle className="h-4 w-4 text-slate-500" />}
                        </div>
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
