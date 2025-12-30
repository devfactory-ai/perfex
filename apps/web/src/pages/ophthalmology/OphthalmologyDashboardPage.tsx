/**
 * Ophthalmology Dashboard Page
 * Main dashboard for ophthalmology department management
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Eye,
  Calendar,
  Scan,
  Clock,
  Syringe,
  AlertTriangle,
  Users,
  ClipboardList,
  Layers,
  Glasses,
  Activity,
  Ruler,
  FileText,
  Bell
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  StatsCard,
  SectionCard,
  QuickActionCard,
  PageLoading,
} from '../../components/healthcare';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  monthlyOcts: number;
  scheduledSurgeries: number;
  monthlyIvts: number;
  criticalAlerts: number;
}

export default function OphthalmologyDashboardPage() {
  const { t } = useLanguage();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['ophthalmology-dashboard-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardStats>>('/ophthalmology/dashboard/stats');
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">{t('common.error')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('ophthalmology.dashboard')}
        subtitle={t('ophthalmology.dashboardSubtitle')}
        icon={Eye}
        module="ophthalmology"
        actions={
          <div className="flex gap-2">
            <Link
              to="/ophthalmology/patients/new"
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              {t('ophthalmology.newPatient')}
            </Link>
            <Link
              to="/ophthalmology/consultations/new"
              className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('ophthalmology.newConsultation')}
            </Link>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          label={t('ophthalmology.totalPatients')}
          value={stats?.totalPatients || 0}
          icon={Users}
          module="ophthalmology"
        />
        <StatsCard
          label={t('ophthalmology.todayAppointments')}
          value={stats?.todayAppointments || 0}
          icon={Calendar}
          module="ophthalmology"
        />
        <StatsCard
          label={t('ophthalmology.monthlyOcts')}
          value={stats?.monthlyOcts || 0}
          icon={Scan}
          module="ophthalmology"
        />
        <StatsCard
          label={t('ophthalmology.scheduledSurgeries')}
          value={stats?.scheduledSurgeries || 0}
          icon={Clock}
          module="ophthalmology"
        />
        <StatsCard
          label={t('ophthalmology.monthlyIvts')}
          value={stats?.monthlyIvts || 0}
          icon={Syringe}
          module="ophthalmology"
        />
        <StatsCard
          label={t('ophthalmology.criticalAlerts')}
          value={stats?.criticalAlerts || 0}
          icon={AlertTriangle}
          module="ophthalmology"
        />
      </div>

      {/* Quick Actions */}
      <SectionCard>
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('ophthalmology.quickAccess')}</h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <QuickActionCard
            to="/ophthalmology/patients"
            icon={Users}
            title={t('ophthalmology.patients')}
            description={t('ophthalmology.managePatients')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/consultations"
            icon={ClipboardList}
            title={t('ophthalmology.consultations')}
            description={t('ophthalmology.viewConsultations')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/oct"
            icon={Scan}
            title={t('ophthalmology.oct')}
            description={t('ophthalmology.retinalImaging')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/visual-fields"
            icon={Eye}
            title={t('ophthalmology.visualFields')}
            description={t('ophthalmology.perimetry')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/biometry"
            icon={Ruler}
            title={t('ophthalmology.biometry')}
            description={t('ophthalmology.iolCalculation')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/iol-implants"
            icon={Layers}
            title={t('ophthalmology.iolImplants')}
            description={t('ophthalmology.lensImplants')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/ivt-injections"
            icon={Syringe}
            title={t('ophthalmology.ivtInjections')}
            description={t('ophthalmology.intravitreal')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/surgeries"
            icon={Activity}
            title={t('ophthalmology.surgeries')}
            description={t('ophthalmology.operatingRoom')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/refraction"
            icon={Glasses}
            title={t('ophthalmology.refraction')}
            description={t('ophthalmology.visualAcuity')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/tonometry"
            icon={Activity}
            title={t('ophthalmology.tonometry')}
            description={t('ophthalmology.iop')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/osdi-scores"
            icon={FileText}
            title={t('ophthalmology.osdiScores')}
            description={t('ophthalmology.dryEye')}
            module="ophthalmology"
          />
          <QuickActionCard
            to="/ophthalmology/alerts"
            icon={Bell}
            title={t('ophthalmology.alerts')}
            description={t('ophthalmology.clinicalAlerts')}
            module="ophthalmology"
          />
        </div>
      </SectionCard>
    </div>
  );
}
