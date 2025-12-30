/**
 * Cardiology Pacemakers Page
 * Manage pacemakers and their interrogations
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Plus,
  Battery,
  AlertTriangle,
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

export default function CardiologyPacemakersPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: pacemakers, isLoading } = useQuery({
    queryKey: ['cardiology-pacemakers', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await api.get(`/cardiology/pacemakers?${params}`);
      return response.data?.data || [];
    },
  });

  const getDeviceStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'completed';
      case 'monitoring':
        return 'in-progress';
      case 'replaced':
        return 'pending';
      case 'explanted':
        return 'critical';
      default:
        return 'pending';
    }
  };

  const getBatteryColor = (status: string | undefined | null) => {
    if (!status) return 'text-gray-500 dark:text-gray-400';
    switch (status) {
      case 'good':
        return 'text-slate-600 dark:text-slate-400';
      case 'monitoring':
        return 'text-slate-500 dark:text-slate-400';
      case 'low':
      case 'critical':
        return 'text-slate-700 dark:text-slate-500';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getBatteryLabel = (status: string | undefined | null) => {
    if (!status) return '-';
    switch (status) {
      case 'good':
        return t('cardiology.batteryGood');
      case 'monitoring':
        return t('cardiology.monitoring');
      case 'low':
        return t('cardiology.batteryLow');
      case 'critical':
        return t('common.critical');
      default:
        return status;
    }
  };

  const getDeviceTypeLabel = (type: string | undefined | null) => {
    if (!type) return '-';
    switch (type) {
      case 'single_chamber':
        return t('cardiology.singleChamber');
      case 'dual_chamber':
        return t('cardiology.dualChamber');
      case 'biventricular':
        return t('cardiology.biventricular');
      case 'icd':
        return t('cardiology.icd');
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.pacemakers')}
        subtitle={t('cardiology.pacemakersSubtitle')}
        icon={Radio}
        module="cardiology"
        actions={
          <Button
            module="cardiology"
            icon={Plus}
            onClick={() => navigate('/cardiology/pacemakers/new')}
          >
            {t('cardiology.newPacemaker')}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.searchPatient')}
        module="cardiology"
        filters={[
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'all', label: t('common.allStatuses') },
              { value: 'active', label: t('common.active') },
              { value: 'monitoring', label: t('cardiology.monitoring') },
              { value: 'replaced', label: t('cardiology.replaced') },
              { value: 'explanted', label: t('cardiology.explanted') },
            ],
            onChange: setStatusFilter,
          },
        ]}
      />

      {/* Pacemakers List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : pacemakers?.length === 0 ? (
          <EmptyState
            icon={Radio}
            title={t('cardiology.noPacemakerFound')}
            module="cardiology"
            action={{
              label: t('cardiology.newPacemaker'),
              icon: Plus,
              onClick: () => navigate('/cardiology/pacemakers/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pacemakers?.map((pm: any) => (
              <div
                key={pm.id}
                onClick={() => navigate(`/cardiology/pacemakers/${pm.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                      <Radio className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {pm.patientName || `Patient ${pm.patientId}`}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(getDeviceStatus(pm.status))}`}>
                          {pm.status === 'active' ? t('common.active') :
                           pm.status === 'monitoring' ? t('cardiology.monitoring') :
                           pm.status === 'replaced' ? t('cardiology.replaced') : t('cardiology.explanted')}
                        </span>
                        {(pm.batteryStatus === 'low' || pm.batteryStatus === 'critical') && (
                          <AlertTriangle className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {pm.manufacturer} {pm.model} • {getDeviceTypeLabel(pm.deviceType)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 ml-4">
                    {/* Battery & Info */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">{t('cardiology.battery')}</p>
                        <p className={`font-medium flex items-center gap-1 ${getBatteryColor(pm.batteryStatus)}`}>
                          <Battery className="h-4 w-4" />
                          {getBatteryLabel(pm.batteryStatus)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">{t('cardiology.implanted')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {pm.implantDate ? new Date(pm.implantDate).toLocaleDateString('fr-FR') : '-'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">{t('cardiology.lastCheckup')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {pm.lastInterrogationDate ? new Date(pm.lastInterrogationDate).toLocaleDateString('fr-FR') : '-'}
                        </p>
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
