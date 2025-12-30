/**
 * Dialyse Reports Page
 * Statistics and reports for dialysis center
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Printer } from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SectionCard, Button } from '@/components/healthcare';

interface SessionStats {
  total_sessions: number;
  completed_sessions: number | null;
  cancelled_sessions: number | null;
  avg_duration: number | null;
}

interface PatientStats {
  total_patients: number;
  active_patients: number | null;
}

interface BillingStats {
  total_invoices: number;
  total_billed: number | null;
  total_collected: number | null;
  pending_amount: number | null;
}

interface AlertStats {
  total_alerts: number;
  critical_alerts: number | null;
  active_alerts: number | null;
}

interface ReportData {
  period: string;
  startDate: string;
  endDate: string;
  sessions: SessionStats;
  patients: PatientStats;
  billing: BillingStats;
  alerts: AlertStats;
}

export function DialyseReportsPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [reportType, setReportType] = useState<'overview' | 'sessions' | 'patients' | 'quality'>('overview');

  // Fetch report data
  const { data: report, isLoading } = useQuery({
    queryKey: ['dialyse-reports', period],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ReportData>>(`/dialyse/reports?period=${period}`);
      return response.data.data;
    },
  });

  // Get session totals from report
  const sessionTotals = useMemo(() => {
    if (!report?.sessions) return null;
    return {
      totalSessions: report.sessions.total_sessions || 0,
      completedSessions: report.sessions.completed_sessions || 0,
      cancelledSessions: report.sessions.cancelled_sessions || 0,
      avgDuration: report.sessions.avg_duration || 0,
    };
  }, [report?.sessions]);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return t('dialyse.thisWeek');
      case 'month': return t('dialyse.thisMonth');
      case 'quarter': return t('dialyse.thisQuarter');
      case 'year': return t('dialyse.thisYear');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t('dialyse.loadingReports')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.reports')}
        subtitle={t('dialyse.reportsSubtitle')}
        icon={FileText}
        module="dialyse"
        actions={
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="week">{t('dialyse.thisWeek')}</option>
              <option value="month">{t('dialyse.thisMonth')}</option>
              <option value="quarter">{t('dialyse.thisQuarter')}</option>
              <option value="year">{t('dialyse.thisYear')}</option>
            </select>
            <Button
              onClick={() => window.print()}
              variant="outline"
              icon={Printer}
              module="dialyse"
            >
              {t('dialyse.print')}
            </Button>
          </div>
        }
      />

      {/* Report Type Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {[
            { key: 'overview', label: t('dialyse.overview') },
            { key: 'sessions', label: t('dialyse.sessions') },
            { key: 'patients', label: t('dialyse.patients') },
            { key: 'quality', label: t('dialyse.quality') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setReportType(tab.key as typeof reportType)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                reportType === tab.key
                  ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.sessionsCompleted')}</div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{sessionTotals?.completedSessions || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('dialyse.outOf')} {sessionTotals?.totalSessions || 0} {t('dialyse.scheduled')}
              </div>
            </SectionCard>

            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.completionRate')}</div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {sessionTotals && sessionTotals.totalSessions > 0
                  ? formatPercent(sessionTotals.completedSessions / sessionTotals.totalSessions)
                  : '0%'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getPeriodLabel()}</div>
            </SectionCard>

            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.activePatients')}</div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{report?.patients?.active_patients || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('dialyse.outOf')} {report?.patients?.total_patients || 0} {t('dialyse.patients')}
              </div>
            </SectionCard>

            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.activeAlerts')}</div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{report?.alerts?.active_alerts || 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {report?.alerts?.critical_alerts || 0} {t('dialyse.critical')}
              </div>
            </SectionCard>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sessions Summary */}
            <SectionCard className="p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('dialyse.sessionsSummary')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300">{t('dialyse.totalSessions')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{sessionTotals?.totalSessions || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300">{t('dialyse.completed')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{sessionTotals?.completedSessions || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300">{t('dialyse.cancelled')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{sessionTotals?.cancelledSessions || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300">{t('dialyse.averageDuration')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{sessionTotals?.avgDuration?.toFixed(0) || '-'} min</span>
                </div>
              </div>
            </SectionCard>

            {/* Billing Summary */}
            <SectionCard className="p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('dialyse.billingSummary')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300">{t('dialyse.totalInvoices')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{report?.billing?.total_invoices || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300">{t('dialyse.amountBilled')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {(report?.billing?.total_billed || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300">{t('dialyse.amountCollected')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {(report?.billing?.total_collected || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <span className="text-gray-700 dark:text-gray-300">{t('dialyse.pending')}</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {(report?.billing?.pending_amount || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Period Info */}
          <SectionCard className="p-6">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('dialyse.reportPeriod')}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('dialyse.period')}</div>
                <div className="font-medium text-gray-900 dark:text-white">{getPeriodLabel()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('dialyse.startDate')}</div>
                <div className="font-medium text-gray-900 dark:text-white">{report?.startDate ? new Date(report.startDate).toLocaleDateString('fr-FR') : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('dialyse.endDate')}</div>
                <div className="font-medium text-gray-900 dark:text-white">{report?.endDate ? new Date(report.endDate).toLocaleDateString('fr-FR') : '-'}</div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Sessions Report */}
      {reportType === 'sessions' && (
        <div className="space-y-6">
          {/* Session Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.totalSessions')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{sessionTotals?.totalSessions || 0}</div>
            </SectionCard>
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.completed')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{sessionTotals?.completedSessions || 0}</div>
            </SectionCard>
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.cancelled')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{sessionTotals?.cancelledSessions || 0}</div>
            </SectionCard>
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.averageDuration')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{sessionTotals?.avgDuration?.toFixed(0) || '-'} min</div>
            </SectionCard>
          </div>

          {/* Summary */}
          <SectionCard className="p-6">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('dialyse.sessionStatistics')} - {getPeriodLabel()}</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('dialyse.completionRate')}</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-gray-900 dark:bg-gray-100"
                      style={{ width: `${sessionTotals && sessionTotals.totalSessions > 0 ? (sessionTotals.completedSessions / sessionTotals.totalSessions) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {sessionTotals && sessionTotals.totalSessions > 0
                      ? formatPercent(sessionTotals.completedSessions / sessionTotals.totalSessions)
                      : '0%'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('dialyse.cancellationRate')}</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-gray-900 dark:bg-gray-100"
                      style={{ width: `${sessionTotals && sessionTotals.totalSessions > 0 ? (sessionTotals.cancelledSessions / sessionTotals.totalSessions) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {sessionTotals && sessionTotals.totalSessions > 0
                      ? formatPercent(sessionTotals.cancelledSessions / sessionTotals.totalSessions)
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Patients Report */}
      {reportType === 'patients' && (
        <div className="space-y-6">
          {/* Patient Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.totalPatients')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{report?.patients?.total_patients || 0}</div>
            </SectionCard>
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.activePatients')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{report?.patients?.active_patients || 0}</div>
            </SectionCard>
          </div>

          {/* Patient Summary */}
          <SectionCard className="p-6">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('dialyse.patientsSummary')}</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('dialyse.activePatientsRate')}</div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-gray-900 dark:bg-gray-100"
                      style={{ width: `${report?.patients?.total_patients ? ((report?.patients?.active_patients || 0) / report.patients.total_patients) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {report?.patients?.total_patients
                      ? formatPercent((report?.patients?.active_patients || 0) / report.patients.total_patients)
                      : '0%'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">{report?.patients?.active_patients || 0}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('dialyse.patientsInActiveDialysis')}</div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Quality Report */}
      {reportType === 'quality' && (
        <div className="space-y-6">
          {/* Quality KPIs - Placeholder for future lab data */}
          <div className="grid gap-4 md:grid-cols-4">
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.averageKtV')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">-</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('dialyse.target')}: ≥ 1.2
              </div>
            </SectionCard>
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.patientsKtVTarget')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-500 dark:text-gray-500">
                -
              </div>
            </SectionCard>
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.averageHemoglobin')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">-</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('dialyse.target')}: 100-120 g/L</div>
            </SectionCard>
            <SectionCard className="p-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dialyse.hbInTarget')}</div>
              <div className="mt-2 text-2xl font-bold text-gray-500 dark:text-gray-500">
                -
              </div>
            </SectionCard>
          </div>

          {/* Quality Targets */}
          <SectionCard className="p-6">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('dialyse.kdoqiQualityTargets')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.indicator')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.target')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.result')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">Kt/V (spKt/V)</td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">≥ 1.2</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">URR</td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">≥ 65%</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">Hémoglobine</td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">100-120 g/L</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">Ferritine</td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">200-500 µg/L</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">TSAT</td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">20-50%</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">Phosphore</td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">0.8-1.5 mmol/L</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">PTH</td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">150-300 pg/mL</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-900 dark:text-white">Albumine</td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">≥ 35 g/L</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">N/A</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 italic">
              {t('dialyse.labDataAvailabilityNote')}
            </p>
          </SectionCard>

          {/* Alerts Summary */}
          <SectionCard className="p-6">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('dialyse.alertsSummary')}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{report?.alerts?.total_alerts || 0}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{t('dialyse.totalAlerts')}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{report?.alerts?.critical_alerts || 0}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{t('dialyse.criticalAlerts')}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{report?.alerts?.active_alerts || 0}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{t('dialyse.activeAlerts')}</div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
