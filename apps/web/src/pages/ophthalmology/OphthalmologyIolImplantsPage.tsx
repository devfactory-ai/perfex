/**
 * Ophthalmology IOL Implants Page
 * Manage intraocular lens implants
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Circle,
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

export default function OphthalmologyIolImplantsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: implants, isLoading } = useQuery({
    queryKey: ['ophthalmology-iol-implants', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/ophthalmology/iol-implants?${params}`);
      return response.data?.data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('ophthalmology.iolImplants')}
        subtitle={t('ophthalmology.lensImplants')}
        icon={Circle}
        module="ophthalmology"
        actions={
          <Button
            module="ophthalmology"
            icon={Plus}
            onClick={() => navigate('/ophthalmology/iol-implants/new')}
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

      {/* IOL Implants List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : implants?.length === 0 ? (
          <EmptyState
            icon={Circle}
            title={t('common.noData')}
            module="ophthalmology"
            action={{
              label: t('common.new'),
              icon: Plus,
              onClick: () => navigate('/ophthalmology/iol-implants/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {implants?.map((implant: any) => (
              <div
                key={implant.id}
                onClick={() => navigate(`/ophthalmology/iol-implants/${implant.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Circle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {implant.patientName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(implant.implantedAt).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{implant.eye === 'OD' ? 'Oeil droit' : 'Oeil gauche'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-sm ml-4">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Modèle</p>
                      <p className="font-medium text-gray-900 dark:text-white">{implant.model}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Puissance</p>
                      <p className="font-medium text-gray-900 dark:text-white">{implant.power} D</p>
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
