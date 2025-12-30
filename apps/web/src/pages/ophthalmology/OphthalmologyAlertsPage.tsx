/**
 * Ophthalmology Alerts Page
 * Manage clinical alerts
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Calendar,
  ChevronRight,
  User,
  CheckCircle,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import { PageHeader, FilterBar, SectionCard, EmptyState, InlineLoading } from '../../components/healthcare';

export default function OphthalmologyAlertsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['ophthalmology-alerts', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await api.get(`/ophthalmology/alerts?${params}`);
      return response.data?.data || [];
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
      case 'medium':
        return 'bg-slate-400 text-white dark:bg-slate-500';
      case 'high':
        return 'bg-slate-500 text-white dark:bg-slate-500';
      case 'critical':
        return 'bg-slate-800 text-white dark:bg-slate-600';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('ophthalmology.alerts')}
        subtitle={t('ophthalmology.clinicalAlerts')}
        icon={Bell}
        module="ophthalmology"
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
          <option value="active">{t('common.active')}</option>
          <option value="acknowledged">{t('common.acknowledged')}</option>
          <option value="resolved">{t('common.resolved')}</option>
        </select>
      </FilterBar>

      <SectionCard module="ophthalmology">
        {isLoading ? (
          <InlineLoading module="ophthalmology" />
        ) : alerts?.length === 0 ? (
          <EmptyState
            icon={Bell}
            message={t('common.noData')}
            module="ophthalmology"
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {alerts?.map((alert: any) => (
              <div
                key={alert.id}
                onClick={() => navigate(`/ophthalmology/patients/${alert.patientId}`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        {alert.status === 'resolved' && (
                          <CheckCircle className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {alert.patientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
