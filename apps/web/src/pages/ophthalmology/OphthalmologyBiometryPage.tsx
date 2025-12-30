/**
 * Ophthalmology Biometry Page
 * Manage biometry measurements and IOL calculations
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Ruler, Plus, Calendar } from 'lucide-react';
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

export default function OphthalmologyBiometryPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: biometries, isLoading } = useQuery({
    queryKey: ['ophthalmology-biometry', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/ophthalmology/biometry?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('ophthalmology.biometry')}
        subtitle={t('ophthalmology.iolCalculation')}
        icon={Ruler}
        module="ophthalmology"
        actions={
          <Button
            module="ophthalmology"
            icon={Plus}
            onClick={() => navigate('/ophthalmology/biometry/new')}
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
        module="ophthalmology"
      />

      {/* Biometry List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : biometries?.length === 0 ? (
          <EmptyState
            icon={Ruler}
            title={t('common.noData')}
            module="ophthalmology"
            action={{
              label: t('common.new'),
              icon: Plus,
              onClick: () => navigate('/ophthalmology/biometry/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {biometries?.map((bio: any) => (
              <ListItemCard
                key={bio.id}
                title={bio.patientName}
                subtitle={bio.eye === 'OD' ? 'Oeil droit' : 'Oeil gauche'}
                icon={Ruler}
                module="ophthalmology"
                metadata={[
                  {
                    icon: Calendar,
                    label: new Date(bio.measuredAt).toLocaleDateString('fr-FR'),
                  },
                ]}
                rightContent={
                  <div className="hidden md:flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">AL</p>
                      <p className="font-medium text-gray-900 dark:text-white">{bio.axialLength} mm</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">K1</p>
                      <p className="font-medium text-gray-900 dark:text-white">{bio.k1} D</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">K2</p>
                      <p className="font-medium text-gray-900 dark:text-white">{bio.k2} D</p>
                    </div>
                  </div>
                }
                onClick={() => navigate(`/ophthalmology/biometry/${bio.id}/edit`)}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
