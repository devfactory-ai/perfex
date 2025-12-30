/**
 * Cardiology Medications Page
 * Manage cardiac medications and prescriptions
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Pill, Plus, User, Calendar } from 'lucide-react';
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

export default function CardiologyMedicationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: medications, isLoading } = useQuery({
    queryKey: ['cardiology-medications', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/cardiology/medications?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.medications')}
        subtitle={t('cardiology.prescriptions')}
        icon={Pill}
        module="cardiology"
        actions={
          <Button
            module="cardiology"
            icon={Plus}
            onClick={() => navigate('/cardiology/medications/new')}
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

      {/* Medications List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : medications?.length === 0 ? (
          <EmptyState
            icon={Pill}
            title={t('common.noData')}
            module="cardiology"
            action={{
              label: t('common.new'),
              icon: Plus,
              onClick: () => navigate('/cardiology/medications/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {medications?.map((med: any) => (
              <ListItemCard
                key={med.id}
                title={med.medicationName}
                icon={Pill}
                module="cardiology"
                metadata={[
                  {
                    icon: User,
                    label: med.patientName,
                  },
                  {
                    icon: Calendar,
                    label: new Date(med.prescribedAt).toLocaleDateString('fr-FR'),
                  },
                ]}
                rightContent={
                  <div className="hidden md:block text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dosage</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{med.dosage}</p>
                  </div>
                }
                onClick={() => navigate(`/cardiology/medications/${med.id}/edit`)}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
