/**
 * Dialyse Dashboard Page
 * Main dashboard for dialysis center management
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  Button,
  StatsCard,
  SectionCard,
  QuickActionCard,
  InlineLoading
} from '@/components/healthcare';
import {
  Users,
  Calendar,
  Cpu,
  Bell,
  Plus,
  Activity,
  AlertTriangle,
  Settings,
  FileText,
  UserCheck,
  CreditCard,
  Truck,
  BarChart3
} from 'lucide-react';

interface DashboardData {
  patients: {
    totalPatients: number;
    activePatients: number;
    isolationPatients: number;
    recentlyAdded: number;
  };
  machines: {
    totalMachines: number;
    availableMachines: number;
    inUseMachines: number;
    maintenanceMachines: number;
    outOfServiceMachines: number;
    isolationMachines: number;
  };
  sessions: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    inProgressSessions: number;
    scheduledSessions: number;
    averageDuration: number;
    incidentCount: number;
  };
  alerts: {
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  todaySessions: Array<{
    id: string;
    sessionNumber: string;
    patientId: string;
    status: string;
    scheduledStartTime: string | null;
    machineId: string | null;
  }>;
  criticalAlerts: Array<{
    id: string;
    title: string;
    severity: string;
    alertType: string;
    patient?: {
      contact?: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
}

export function DialyseDashboardPage() {
  const { t } = useLanguage();

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['dialyse-dashboard'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardData>>('/dialyse/dashboard');
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <InlineLoading rows={8} />;
  }

  if (error) {
    return (
      <SectionCard>
        <div className="p-6 text-center">
          <p className="text-destructive">{t('dialyse.error')}</p>
        </div>
      </SectionCard>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      case 'checked_in': return 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200';
      case 'in_progress': return 'bg-gray-300 dark:bg-gray-500 text-gray-900 dark:text-white';
      case 'completed': return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      case 'cancelled': return 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-slate-800 text-white border-slate-700 dark:bg-slate-600';
      case 'high': return 'bg-slate-500 text-white border-slate-400 dark:bg-slate-500';
      case 'medium': return 'bg-slate-400 text-white border-slate-300 dark:bg-slate-500';
      case 'low': return 'bg-slate-200 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  void getSeverityColor; // Used in future alerts rendering

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.dashboard')}
        subtitle={t('dialyse.dashboardSubtitle')}
        icon={Activity}
        module="dialyse"
        actions={
          <div className="flex gap-2">
            <Link to="/dialyse/patients/new">
              <Button module="dialyse" icon={Plus}>
                {t('dialyse.newPatient')}
              </Button>
            </Link>
            <Link to="/dialyse/sessions/new">
              <Button module="dialyse" variant="outline" icon={Plus}>
                {t('dialyse.newSession')}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Critical Alerts Banner */}
      {dashboard?.criticalAlerts && dashboard.criticalAlerts.length > 0 && (
        <SectionCard>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <AlertTriangle className="h-5 w-5 text-gray-900 dark:text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('dialyse.criticalAlerts')} ({dashboard.criticalAlerts.length})
              </h3>
            </div>
            <div className="space-y-2">
              {dashboard.criticalAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{alert.title}</span>
                    {alert.patient?.contact && (
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        - {alert.patient.contact.firstName} {alert.patient.contact.lastName}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/dialyse/alerts/${alert.id}`}
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
                  >
                    {t('dialyse.view')}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label={t('dialyse.activePatients')}
          value={dashboard?.patients.activePatients || 0}
          icon={Users}
          module="dialyse"
        />
        <StatsCard
          label={t('dialyse.todaySessions')}
          value={dashboard?.todaySessions?.length || 0}
          icon={Calendar}
          module="dialyse"
        />
        <StatsCard
          label={t('dialyse.availableMachines')}
          value={dashboard?.machines.availableMachines || 0}
          icon={Cpu}
          module="dialyse"
        />
        <StatsCard
          label={t('dialyse.activeAlerts')}
          value={dashboard?.alerts.active || 0}
          icon={Bell}
          module="dialyse"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Sessions */}
        <SectionCard>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">{t('dialyse.todaysSessionsTitle')}</h3>
            <Link to="/dialyse/planning" className="text-sm text-primary hover:underline">
              {t('dialyse.viewPlanning')}
            </Link>
          </div>
          <div className="p-4">
            {dashboard?.todaySessions && dashboard.todaySessions.length > 0 ? (
              <div className="space-y-3">
                {dashboard.todaySessions.slice(0, 8).map((session) => (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">
                        {session.scheduledStartTime || '--:--'}
                      </span>
                      <span className="font-medium">{session.sessionNumber}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status === 'scheduled' && t('dialyse.status.scheduled')}
                      {session.status === 'checked_in' && t('dialyse.status.checkedIn')}
                      {session.status === 'in_progress' && t('dialyse.status.inProgress')}
                      {session.status === 'completed' && t('dialyse.status.completed')}
                      {session.status === 'cancelled' && t('dialyse.status.cancelled')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('dialyse.noSessionsToday')}</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Machine Status */}
        <SectionCard>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">{t('dialyse.machineStatus')}</h3>
            <Link to="/dialyse/machines" className="text-sm text-primary hover:underline">
              {t('dialyse.manageMachines')}
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.machines.availableMachines || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('dialyse.available')}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.machines.inUseMachines || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('dialyse.inUse')}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.machines.maintenanceMachines || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('dialyse.inMaintenance')}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.machines.outOfServiceMachines || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{t('dialyse.outOfService')}</div>
              </div>
            </div>
            {(dashboard?.machines.isolationMachines || 0) > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('dialyse.isolationMachines')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{dashboard?.machines.isolationMachines}</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <SectionCard>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dialyse.quickAccess')}</h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <QuickActionCard
              title={t('dialyse.patients')}
              description={t('dialyse.managePatients')}
              icon={Users}
              module="dialyse"
              to="/dialyse/patients"
            />
            <QuickActionCard
              title={t('dialyse.planning')}
              description={t('dialyse.sessionsAndSlots')}
              icon={Calendar}
              module="dialyse"
              to="/dialyse/planning"
            />
            <QuickActionCard
              title={t('dialyse.machines')}
              description={t('dialyse.equipment')}
              icon={Cpu}
              module="dialyse"
              to="/dialyse/machines"
            />
            <QuickActionCard
              title={t('dialyse.alerts')}
              description={t('dialyse.clinicalAlerts')}
              icon={Bell}
              module="dialyse"
              to="/dialyse/alerts"
            />
            <QuickActionCard
              title={t('dialyse.consumables')}
              description={t('dialyse.stocksAndInventory')}
              icon={Activity}
              module="dialyse"
              to="/dialyse/consumables"
            />
            <QuickActionCard
              title={t('dialyse.reports')}
              description={t('dialyse.statistics')}
              icon={BarChart3}
              module="dialyse"
              to="/dialyse/reports"
            />
            <QuickActionCard
              title={t('dialyse.maintenance')}
              description={t('dialyse.interventions')}
              icon={Settings}
              module="dialyse"
              to="/dialyse/maintenance"
            />
            <QuickActionCard
              title={t('dialyse.protocols')}
              description={t('dialyse.treatmentTemplates')}
              icon={FileText}
              module="dialyse"
              to="/dialyse/protocols"
            />
            <QuickActionCard
              title={t('dialyse.staff')}
              description={t('dialyse.doctorsAndStaff')}
              icon={UserCheck}
              module="dialyse"
              to="/dialyse/staff"
            />
            <QuickActionCard
              title={t('dialyse.billing')}
              description={t('dialyse.payments')}
              icon={CreditCard}
              module="dialyse"
              to="/dialyse/billing"
            />
            <QuickActionCard
              title={t('dialyse.transport')}
              description={t('dialyse.vslAndAmbulances')}
              icon={Truck}
              module="dialyse"
              to="/dialyse/transport"
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
