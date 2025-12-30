/**
 * Ophthalmology Surgeries Page
 * Manage ophthalmic surgeries
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Scissors,
  Calendar,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { PageHeader, FilterBar, SectionCard, Button, EmptyState, InlineLoading } from '../../components/healthcare';

export default function OphthalmologySurgeriesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: surgeries, isLoading } = useQuery({
    queryKey: ['ophthalmology-surgeries', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await api.get(`/ophthalmology/surgeries?${params}`);
      return response.data?.data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-slate-400 text-white dark:bg-slate-500';
      case 'in_progress':
        return 'bg-slate-500 text-white dark:bg-slate-500';
      case 'completed':
        return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      case 'cancelled':
        return 'bg-slate-800 text-white dark:bg-slate-600';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('ophthalmology.surgeries')}
        subtitle={t('ophthalmology.operatingRoom')}
        icon={Scissors}
        module="ophthalmology"
        actions={
          <Button
            variant="primary"
            onClick={() => navigate('/ophthalmology/surgeries/new')}
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
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">{t('common.all')}</option>
          <option value="scheduled">{t('common.scheduled')}</option>
          <option value="in_progress">En cours</option>
          <option value="completed">{t('common.completed')}</option>
          <option value="cancelled">{t('common.cancelled')}</option>
        </select>
      </FilterBar>

      <SectionCard module="ophthalmology">
        {isLoading ? (
          <InlineLoading module="ophthalmology" />
        ) : surgeries?.length === 0 ? (
          <EmptyState
            icon={Scissors}
            message={t('common.noData')}
            module="ophthalmology"
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {surgeries?.map((surgery: any) => (
              <div
                key={surgery.id}
                onClick={() => navigate(`/ophthalmology/surgeries/${surgery.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Scissors className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {surgery.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(surgery.status)}`}>
                          {surgery.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(surgery.scheduledAt).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(surgery.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:block text-sm text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{surgery.procedureType}</p>
                      <p className="text-gray-500 dark:text-gray-400">{surgery.eye === 'OD' ? 'Oeil droit' : surgery.eye === 'OS' ? 'Oeil gauche' : 'Bilatéral'}</p>
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
