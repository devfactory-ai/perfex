/**
 * Cardiology Alerts Page
 * Manage clinical alerts
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Calendar, User, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import {
  PageHeader,
  FilterBar,
  SectionCard,
  EmptyState,
  InlineLoading,
  getStatusColor,
} from '../../components/healthcare';

export default function CardiologyAlertsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['cardiology-alerts', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await api.get(`/cardiology/alerts?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.alerts')}
        subtitle={t('cardiology.clinicalAlerts')}
        icon={Bell}
        module="cardiology"
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.search')}
        module="cardiology"
        filters={[
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'all', label: t('common.all') },
              { value: 'active', label: t('common.active') },
              { value: 'acknowledged', label: t('common.acknowledged') },
              { value: 'resolved', label: t('common.resolved') },
            ],
            onChange: setStatusFilter,
          },
        ]}
      />

      {/* Alerts List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : alerts?.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('common.noData')}
            description={t('common.noResults')}
            module="cardiology"
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {alerts?.map((alert: any) => (
              <div
                key={alert.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/cardiology/patients/${alert.patientId}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                      <Bell className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        {alert.status === 'resolved' && (
                          <CheckCircle className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
