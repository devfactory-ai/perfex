/**
 * Cardiology Appointments Page
 * Schedule and manage appointments
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Clock } from 'lucide-react';
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

export default function CardiologyAppointmentsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['cardiology-appointments', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await api.get(`/cardiology/appointments?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.appointments')}
        subtitle={t('cardiology.scheduling')}
        icon={CalendarDays}
        module="cardiology"
        actions={
          <Button
            module="cardiology"
            icon={Plus}
            onClick={() => navigate('/cardiology/appointments/new')}
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
        module="cardiology"
        filters={[
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'all', label: t('common.all') },
              { value: 'scheduled', label: t('common.scheduled') },
              { value: 'confirmed', label: t('common.confirmed') },
              { value: 'completed', label: t('common.completed') },
              { value: 'cancelled', label: t('common.cancelled') },
            ],
            onChange: setStatusFilter,
          },
        ]}
      />

      {/* Appointments List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : appointments?.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={t('common.noData')}
            description={t('cardiology.noAppointments') || 'Aucun rendez-vous trouvé'}
            module="cardiology"
            action={{
              label: t('common.new'),
              icon: Plus,
              onClick: () => navigate('/cardiology/appointments/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {appointments?.map((apt: any) => (
              <ListItemCard
                key={apt.id}
                title={apt.patientName}
                subtitle={apt.appointmentType}
                icon={CalendarDays}
                module="cardiology"
                status={apt.status}
                metadata={[
                  {
                    icon: CalendarDays,
                    label: (apt.appointmentDate || apt.scheduledAt)
                      ? new Date(apt.appointmentDate || apt.scheduledAt).toLocaleDateString('fr-FR')
                      : '-',
                  },
                  {
                    icon: Clock,
                    label: apt.startTime || ((apt.appointmentDate || apt.scheduledAt)
                      ? new Date(apt.appointmentDate || apt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                      : '-'),
                  },
                ]}
                onClick={() => navigate(`/cardiology/appointments/${apt.id}/edit`)}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
