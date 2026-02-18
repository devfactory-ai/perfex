// @ts-nocheck
// @ts-nocheck
/**
 * RPM Compliance Page
 * Track and manage patient compliance with RPM programs
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApi } from '@/hooks/useApi';
import {
  PageHeader,
  StatsCard,
  SectionCard,
  DataTable,
  StatusBadge,
} from '@/components/healthcare';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  Mail,
  AlertTriangle,
  Activity,
} from 'lucide-react';

export function RpmCompliancePage() {
  const { t } = useLanguage();
  const api = useApi();

  const [thresholdPercent, setThresholdPercent] = useState(80);

  // Fetch compliance summary
  const { data: summary } = useQuery({
    queryKey: ['rpm', 'compliance', 'summary'],
    queryFn: () => api.get('/rpm/compliance/summary'),
  });

  // Fetch non-compliant patients
  const { data: nonCompliant, isLoading } = useQuery({
    queryKey: ['rpm', 'compliance', 'non-compliant', thresholdPercent],
    queryFn: () => api.get(`/rpm/compliance/non-compliant?threshold=${thresholdPercent}`),
  });

  const summaryData = summary?.data || {
    totalActiveEnrollments: 0,
    compliantCount: 0,
    nonCompliantCount: 0,
    averageCompliance: 0,
    billingReadyCount: 0,
  };

  const complianceRate = summaryData.totalActiveEnrollments > 0
    ? (summaryData.compliantCount / summaryData.totalActiveEnrollments) * 100
    : 0;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <Link
              to={`/rpm/enrollments/${item.enrollmentId}`}
              className="text-sm font-medium text-gray-900 hover:text-indigo-600"
            >
              Patient #{item.patientId?.slice(0, 8)}
            </Link>
            <p className="text-xs text-gray-500">
              Enrollment #{item.enrollmentId?.slice(0, 8)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'compliance',
      header: 'Compliance',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 bg-gray-200 rounded-full">
            <div
              className={`h-full rounded-full ${
                item.latestCompliancePercent >= 80
                  ? 'bg-green-500'
                  : item.latestCompliancePercent >= 50
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${item.latestCompliancePercent}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {Math.round(item.latestCompliancePercent)}%
          </span>
        </div>
      ),
    },
    {
      key: 'trend',
      header: 'Trend',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          {getTrendIcon(item.trend)}
          <span
            className={`text-sm capitalize ${
              item.trend === 'improving'
                ? 'text-green-600'
                : item.trend === 'declining'
                ? 'text-red-600'
                : 'text-gray-500'
            }`}
          >
            {item.trend || 'Stable'}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item: any) => {
        const priority =
          item.latestCompliancePercent < 30
            ? 'high'
            : item.latestCompliancePercent < 50
            ? 'medium'
            : 'low';
        return (
          <StatusBadge
            status={priority}
            colorMap={{
              high: 'red',
              medium: 'yellow',
              low: 'blue',
            }}
          />
        );
      },
    },
    {
      key: 'actions',
      header: 'Quick Actions',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
            title="Call patient"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-green-50 text-green-600"
            title="Send message"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-purple-50 text-purple-600"
            title="Send email"
          >
            <Mail className="h-4 w-4" />
          </button>
          <Link
            to={`/rpm/enrollments/${item.enrollmentId}`}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            title="View details"
          >
            <Activity className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Monitoring"
        subtitle="Track patient compliance with RPM programs"
        icon={<TrendingUp className="h-8 w-8 text-blue-600" />}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Active Enrollments"
          value={summaryData.totalActiveEnrollments}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="Compliant"
          value={summaryData.compliantCount}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="Non-Compliant"
          value={summaryData.nonCompliantCount}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
        <StatsCard
          title="Avg Compliance"
          value={`${Math.round(summaryData.averageCompliance)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />
        <StatsCard
          title="Billing Ready"
          value={summaryData.billingReadyCount}
          icon={<Activity className="h-5 w-5" />}
          color="indigo"
        />
      </div>

      {/* Overall Compliance Rate */}
      <SectionCard
        title="Overall Compliance Rate"
        icon={<Activity className="h-5 w-5 text-indigo-500" />}
      >
        <div className="flex items-center gap-6">
          <div className="relative h-32 w-32">
            <svg className="h-32 w-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(complianceRate / 100) * 352} 352`}
                className={
                  complianceRate >= 80
                    ? 'text-green-500'
                    : complianceRate >= 50
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{Math.round(complianceRate)}%</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-medium">
              {complianceRate >= 80
                ? 'Excellent compliance'
                : complianceRate >= 50
                ? 'Moderate compliance'
                : 'Needs attention'}
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              {summaryData.compliantCount} of {summaryData.totalActiveEnrollments} patients
              are meeting their compliance targets
            </p>
            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">
                  Compliant ({summaryData.compliantCount})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">
                  Non-Compliant ({summaryData.nonCompliantCount})
                </span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Non-Compliant Patients */}
      <SectionCard
        title="Non-Compliant Patients"
        icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
        action={
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Threshold:</span>
            <select
              value={thresholdPercent}
              onChange={(e) => setThresholdPercent(Number(e.target.value))}
              className="rounded-md border-gray-300 text-sm"
            >
              <option value={90}>90%</option>
              <option value={80}>80%</option>
              <option value={70}>70%</option>
              <option value={50}>50%</option>
            </select>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={nonCompliant?.data || []}
          isLoading={isLoading}
          emptyMessage="All patients are compliant"
        />
      </SectionCard>

      {/* Tips Section */}
      <SectionCard
        title="Improving Compliance"
        icon={<TrendingUp className="h-5 w-5 text-green-500" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Automated Reminders</h4>
            <p className="text-sm text-blue-700 mt-1">
              Set up automated SMS and push notifications to remind patients to take readings
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900">Patient Education</h4>
            <p className="text-sm text-green-700 mt-1">
              Provide educational content about the importance of regular monitoring
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900">Care Coordination</h4>
            <p className="text-sm text-purple-700 mt-1">
              Assign care coordinators to follow up with non-compliant patients
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default RpmCompliancePage;
