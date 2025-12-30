/**
 * Cardiology Events Page
 * Track cardiac events
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Plus,
  Calendar,
  User,
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

export default function CardiologyEventsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: events, isLoading } = useQuery({
    queryKey: ['cardiology-events', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/cardiology/events?${params}`);
      return response.data?.data || [];
    },
  });

  const getEventStatus = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'pending';
      case 'major':
        return 'in-progress';
      case 'critical':
        return 'critical';
      default:
        return 'completed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.events') || 'Événements Cardiaques'}
        subtitle={t('cardiology.cardiacEvents') || 'Suivi des événements cardiaques'}
        icon={AlertTriangle}
        module="cardiology"
        actions={
          <Button
            module="cardiology"
            icon={Plus}
            onClick={() => navigate('/cardiology/events/new')}
          >
            {t('common.new') || 'Nouveau'}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.search') || 'Rechercher...'}
        module="cardiology"
      />

      {/* Events List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : events?.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={t('common.noData') || 'Aucun événement trouvé'}
            module="cardiology"
            action={{
              label: t('common.new') || 'Nouveau',
              icon: Plus,
              onClick: () => navigate('/cardiology/events/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {events?.map((event: any) => (
              <div
                key={event.id}
                onClick={() => navigate(`/cardiology/events/${event.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {event.eventType}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(getEventStatus(event.severity))}`}>
                          {event.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {event.patientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.occurredAt).toLocaleDateString('fr-FR')}
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
