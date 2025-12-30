/**
 * Ophthalmology OCT Page
 * List and manage OCT scans
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Scan,
  Plus,
  Calendar,
  Eye,
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

export default function OphthalmologyOctPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [eyeFilter, setEyeFilter] = useState<string>('all');

  const { data: octScans, isLoading } = useQuery({
    queryKey: ['ophthalmology-oct', searchTerm, eyeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (eyeFilter !== 'all') params.append('eye', eyeFilter);
      const response = await api.get(`/ophthalmology/oct?${params}`);
      return response.data?.data || [];
    },
  });

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'good':
        return getStatusColor('completed');
      case 'fair':
        return getStatusColor('pending');
      case 'poor':
        return getStatusColor('cancelled');
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'good': return t('ophthalmology.qualityGood');
      case 'fair': return t('ophthalmology.qualityFair');
      case 'poor': return t('ophthalmology.qualityPoor');
      default: return quality;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('ophthalmology.octTitle')}
        subtitle={t('ophthalmology.octSubtitle')}
        icon={Scan}
        module="ophthalmology"
        actions={
          <Button
            module="ophthalmology"
            icon={Plus}
            onClick={() => navigate('/ophthalmology/oct/new')}
          >
            {t('ophthalmology.newOct')}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.searchPatient')}
        module="ophthalmology"
        filters={[
          {
            name: 'eye',
            value: eyeFilter,
            options: [
              { value: 'all', label: t('ophthalmology.allEyes') },
              { value: 'OD', label: t('ophthalmology.rightEyeOD') },
              { value: 'OG', label: t('ophthalmology.leftEyeOG') },
            ],
            onChange: setEyeFilter,
          },
        ]}
      />

      {/* OCT List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : octScans?.length === 0 ? (
          <EmptyState
            icon={Scan}
            title={t('ophthalmology.noOctFound')}
            module="ophthalmology"
            action={{
              label: t('ophthalmology.newOct'),
              icon: Plus,
              onClick: () => navigate('/ophthalmology/oct/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {octScans?.map((oct: any) => (
              <div
                key={oct.id}
                onClick={() => navigate(`/ophthalmology/oct/${oct.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Scan className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {oct.patientName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {oct.eye === 'OD' ? t('ophthalmology.rightEye') : t('ophthalmology.leftEye')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getQualityColor(oct.signalQuality)}`}>
                          {getQualityLabel(oct.signalQuality)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(oct.scanDate).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{oct.scanType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-sm ml-4">
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">CMT</p>
                      <p className="font-medium text-gray-900 dark:text-white">{oct.centralMacularThickness} µm</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 dark:text-gray-400">Volume</p>
                      <p className="font-medium text-gray-900 dark:text-white">{oct.maculaVolume} mm³</p>
                    </div>
                    {oct.rnflThickness && (
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">RNFL</p>
                        <p className="font-medium text-gray-900 dark:text-white">{oct.rnflThickness} µm</p>
                      </div>
                    )}
                  </div>
                </div>
                {oct.findings && (
                  <div className="mt-2 ml-16 text-sm text-gray-600 dark:text-gray-400">
                    <Eye className="h-4 w-4 inline mr-1" />
                    {oct.findings}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
