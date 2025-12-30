/**
 * Cardiology Echo Page
 * List and manage echocardiograms
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Calendar } from 'lucide-react';
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

export default function CardiologyEchoPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: echoRecords, isLoading } = useQuery({
    queryKey: ['cardiology-echo', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/cardiology/echo?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.echo')}
        subtitle={t('cardiology.echocardiograms')}
        icon={Heart}
        module="cardiology"
        actions={
          <Button
            module="cardiology"
            icon={Plus}
            onClick={() => navigate('/cardiology/echo/new')}
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
      />

      {/* Echo List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : echoRecords?.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={t('common.noData')}
            module="cardiology"
            action={{
              label: t('common.new'),
              icon: Plus,
              onClick: () => navigate('/cardiology/echo/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {echoRecords?.map((echo: any) => (
              <ListItemCard
                key={echo.id}
                title={echo.patientName || `Patient ${echo.patientId}`}
                icon={Heart}
                module="cardiology"
                status={echo.status === 'final' ? 'completed' : echo.status === 'preliminary' ? 'pending' : 'inactive'}
                metadata={[
                  {
                    icon: Calendar,
                    label: echo.studyDate ? new Date(echo.studyDate).toLocaleDateString('fr-FR') : '-',
                  },
                ]}
                rightContent={
                  <div className="hidden md:block text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">FEVG</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{echo.lvEf ? `${echo.lvEf}%` : '-'}</p>
                  </div>
                }
                onClick={() => navigate(`/cardiology/echo/${echo.id}/edit`)}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
