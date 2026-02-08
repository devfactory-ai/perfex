/**
 * Clinical AI Dashboard Page
 * Main dashboard for AI-powered clinical assistance features
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
  Brain,
  FileText,
  Stethoscope,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Users,
  Activity,
  BarChart3
} from 'lucide-react';

interface UsageStats {
  totalDocuments: number;
  totalSummaries: number;
  totalDiagnostics: number;
  documentsThisMonth: number;
  summariesThisMonth: number;
  diagnosticsThisMonth: number;
  approvedDocuments: number;
  pendingDocuments: number;
  averageGenerationTime: number;
}

interface RecentActivity {
  id: string;
  type: 'document' | 'summary' | 'diagnostic';
  title: string;
  status: string;
  createdAt: string;
  patientName?: string;
}

interface ClinicalAIDashboardData {
  usage: UsageStats;
  recentActivity: RecentActivity[];
}

export function ClinicalAIDashboardPage() {
  const { t } = useLanguage();

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['clinical-ai-dashboard'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ClinicalAIDashboardData>>('/clinical-ai/usage');
      return response.data.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <InlineLoading rows={8} />;
  }

  if (error) {
    return (
      <SectionCard>
        <div className="p-6 text-center">
          <p className="text-destructive">{t('clinicalAi.error')}</p>
        </div>
      </SectionCard>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      case 'pending_review': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'approved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'signed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'summary': return ClipboardList;
      case 'diagnostic': return Stethoscope;
      default: return FileText;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('clinicalAi.dashboard')}
        subtitle={t('clinicalAi.dashboardSubtitle')}
        icon={Brain}
        module="dialyse"
        actions={
          <div className="flex gap-2">
            <Link to="/clinical-ai/documentation/new">
              <Button module="dialyse" icon={FileText}>
                {t('clinicalAi.newDocument')}
              </Button>
            </Link>
            <Link to="/clinical-ai/diagnostics">
              <Button module="dialyse" variant="outline" icon={Stethoscope}>
                {t('clinicalAi.diagnosticAssistant')}
              </Button>
            </Link>
          </div>
        }
      />

      {/* AI Status Banner */}
      <SectionCard>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('clinicalAi.aiPowered')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('clinicalAi.usingLlama')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('clinicalAi.online')}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label={t('clinicalAi.documentsGenerated')}
          value={dashboard?.usage?.totalDocuments || 0}
          icon={FileText}
          module="dialyse"
          trend={{
            value: dashboard?.usage?.documentsThisMonth || 0,
            label: t('clinicalAi.thisMonth')
          }}
        />
        <StatsCard
          label={t('clinicalAi.patientSummaries')}
          value={dashboard?.usage?.totalSummaries || 0}
          icon={ClipboardList}
          module="dialyse"
          trend={{
            value: dashboard?.usage?.summariesThisMonth || 0,
            label: t('clinicalAi.thisMonth')
          }}
        />
        <StatsCard
          label={t('clinicalAi.diagnosticAnalyses')}
          value={dashboard?.usage?.totalDiagnostics || 0}
          icon={Stethoscope}
          module="dialyse"
          trend={{
            value: dashboard?.usage?.diagnosticsThisMonth || 0,
            label: t('clinicalAi.thisMonth')
          }}
        />
        <StatsCard
          label={t('clinicalAi.avgGenerationTime')}
          value={`${dashboard?.usage?.averageGenerationTime || 0}s`}
          icon={Clock}
          module="dialyse"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <SectionCard>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">{t('clinicalAi.recentActivity')}</h3>
            <Link to="/clinical-ai/documentation" className="text-sm text-primary hover:underline">
              {t('clinicalAi.viewAll')}
            </Link>
          </div>
          <div className="p-4">
            {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentActivity.slice(0, 6).map((activity) => {
                  const Icon = getTypeIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.title}</p>
                          {activity.patientName && (
                            <p className="text-xs text-gray-500">{activity.patientName}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {t(`clinicalAi.status.${activity.status}`)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(activity.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('clinicalAi.noRecentActivity')}</p>
                <Link to="/clinical-ai/documentation/new" className="text-primary hover:underline text-sm mt-2 block">
                  {t('clinicalAi.startGenerating')}
                </Link>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Document Status Overview */}
        <SectionCard>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">{t('clinicalAi.documentStatus')}</h3>
            <Link to="/clinical-ai/documentation" className="text-sm text-primary hover:underline">
              {t('clinicalAi.manage')}
            </Link>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {t('clinicalAi.approved')}
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {dashboard?.usage?.approvedDocuments || 0}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {t('clinicalAi.pendingReview')}
                  </span>
                </div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {dashboard?.usage?.pendingDocuments || 0}
                </div>
              </div>
            </div>

            {/* Usage Trend */}
            <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('clinicalAi.monthlyTrend')}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {(dashboard?.usage?.documentsThisMonth || 0) +
                   (dashboard?.usage?.summariesThisMonth || 0) +
                   (dashboard?.usage?.diagnosticsThisMonth || 0)} {t('clinicalAi.generations')}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <SectionCard>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('clinicalAi.quickActions')}</h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <QuickActionCard
              title={t('clinicalAi.newDocument')}
              description={t('clinicalAi.generateClinicalDoc')}
              icon={FileText}
              module="dialyse"
              to="/clinical-ai/documentation/new"
            />
            <QuickActionCard
              title={t('clinicalAi.patientSummary')}
              description={t('clinicalAi.generateSummary')}
              icon={ClipboardList}
              module="dialyse"
              to="/clinical-ai/summaries/new"
            />
            <QuickActionCard
              title={t('clinicalAi.diagnosticAssistant')}
              description={t('clinicalAi.aiDiagnosticHelp')}
              icon={Stethoscope}
              module="dialyse"
              to="/clinical-ai/diagnostics"
            />
            <QuickActionCard
              title={t('clinicalAi.documentation')}
              description={t('clinicalAi.allDocuments')}
              icon={FileText}
              module="dialyse"
              to="/clinical-ai/documentation"
            />
            <QuickActionCard
              title={t('clinicalAi.templates')}
              description={t('clinicalAi.managePrompts')}
              icon={Activity}
              module="dialyse"
              to="/clinical-ai/prompts"
            />
            <QuickActionCard
              title={t('clinicalAi.analytics')}
              description={t('clinicalAi.usageReports')}
              icon={BarChart3}
              module="dialyse"
              to="/clinical-ai/analytics"
            />
          </div>
        </div>
      </SectionCard>

      {/* Supported Modules */}
      <SectionCard>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('clinicalAi.supportedModules')}</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium">{t('clinicalAi.dialyse')}</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('clinicalAi.dialyseDesc')}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h4 className="font-medium">{t('clinicalAi.cardiology')}</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('clinicalAi.cardiologyDesc')}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-medium">{t('clinicalAi.ophthalmology')}</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('clinicalAi.ophthalmologyDesc')}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
