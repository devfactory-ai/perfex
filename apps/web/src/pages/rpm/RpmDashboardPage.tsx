// @ts-nocheck
// @ts-nocheck
/**
 * RPM Dashboard Page
 * Main dashboard for Remote Patient Monitoring
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApi } from '@/hooks/useApi';
import {
  PageHeader,
  StatsCard,
  SectionCard,
  QuickActionCard,
  DataTable,
} from '@/components/healthcare';
import {
  Activity,
  Smartphone,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Battery,
  Heart,
  Droplet,
  Scale,
  Thermometer,
  Plus,
  Settings,
  FileText,
} from 'lucide-react';

export function RpmDashboardPage() {
  const { t } = useLanguage();
  const api = useApi();

  // Fetch compliance summary
  const { data: complianceSummary } = useQuery({
    queryKey: ['rpm', 'compliance', 'summary'],
    queryFn: () => api.get('/rpm/compliance/summary'),
  });

  // Fetch device alerts
  const { data: deviceAlerts } = useQuery({
    queryKey: ['rpm', 'devices', 'alerts'],
    queryFn: () => api.get('/rpm/devices/alerts/summary'),
  });

  // Fetch non-compliant patients
  const { data: nonCompliant } = useQuery({
    queryKey: ['rpm', 'compliance', 'non-compliant'],
    queryFn: () => api.get('/rpm/compliance/non-compliant'),
  });

  // Fetch recent enrollments
  const { data: enrollmentsData } = useQuery({
    queryKey: ['rpm', 'enrollments', { limit: 5 }],
    queryFn: () => api.get('/rpm/enrollments?limit=5'),
  });

  // Fetch programs
  const { data: programsData } = useQuery({
    queryKey: ['rpm', 'programs', { limit: 5 }],
    queryFn: () => api.get('/rpm/programs?limit=5&status=active'),
  });

  const summary = complianceSummary?.data || {
    totalActiveEnrollments: 0,
    compliantCount: 0,
    nonCompliantCount: 0,
    averageCompliance: 0,
    billingReadyCount: 0,
  };

  const alerts = deviceAlerts?.data || {
    needingCalibration: [],
    offline: [],
    lowBattery: [],
  };

  const totalDeviceAlerts =
    alerts.needingCalibration.length +
    alerts.offline.length +
    alerts.lowBattery.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remote Patient Monitoring"
        subtitle="Monitor patient health data from connected devices"
        icon={<Activity className="h-8 w-8 text-indigo-600" />}
        actions={
          <div className="flex gap-2">
            <Link
              to="/rpm/devices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Device
            </Link>
            <Link
              to="/rpm/enrollments/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Users className="h-4 w-4" />
              Enroll Patient
            </Link>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Active Enrollments"
          value={summary.totalActiveEnrollments}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="Compliant"
          value={summary.compliantCount}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
          subtitle={`${Math.round(summary.averageCompliance)}% avg`}
        />
        <StatsCard
          title="Non-Compliant"
          value={summary.nonCompliantCount}
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
        <StatsCard
          title="Device Alerts"
          value={totalDeviceAlerts}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="yellow"
        />
        <StatsCard
          title="Billing Ready"
          value={summary.billingReadyCount}
          icon={<FileText className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <QuickActionCard
          title="Devices"
          description="Manage IoT devices"
          icon={<Smartphone className="h-6 w-6" />}
          to="/rpm/devices"
          color="indigo"
        />
        <QuickActionCard
          title="Programs"
          description="Configure RPM programs"
          icon={<Settings className="h-6 w-6" />}
          to="/rpm/programs"
          color="purple"
        />
        <QuickActionCard
          title="Enrollments"
          description="Patient enrollments"
          icon={<Users className="h-6 w-6" />}
          to="/rpm/enrollments"
          color="green"
        />
        <QuickActionCard
          title="Compliance"
          description="Track compliance"
          icon={<TrendingUp className="h-6 w-6" />}
          to="/rpm/compliance"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Alerts */}
        <SectionCard
          title="Device Alerts"
          icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
          action={
            <Link to="/rpm/devices" className="text-sm text-indigo-600 hover:underline">
              View All Devices
            </Link>
          }
        >
          <div className="space-y-3">
            {alerts.offline.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <WifiOff className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-red-700">
                    {alerts.offline.length} device(s) offline
                  </span>
                </div>
                <span className="text-xs text-red-500 font-medium">Critical</span>
              </div>
            )}
            {alerts.lowBattery.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Battery className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-yellow-700">
                    {alerts.lowBattery.length} device(s) with low battery
                  </span>
                </div>
                <span className="text-xs text-yellow-500 font-medium">Warning</span>
              </div>
            )}
            {alerts.needingCalibration.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-blue-700">
                    {alerts.needingCalibration.length} device(s) need calibration
                  </span>
                </div>
                <span className="text-xs text-blue-500 font-medium">Info</span>
              </div>
            )}
            {totalDeviceAlerts === 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-700">All devices operating normally</span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Non-Compliant Patients */}
        <SectionCard
          title="Non-Compliant Patients"
          icon={<XCircle className="h-5 w-5 text-red-500" />}
          action={
            <Link to="/rpm/compliance" className="text-sm text-indigo-600 hover:underline">
              View All
            </Link>
          }
        >
          <div className="space-y-2">
            {nonCompliant?.data?.slice(0, 5).map((patient: any) => (
              <div
                key={patient.enrollmentId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Patient #{patient.patientId.slice(0, 8)}</span>
                    <p className="text-xs text-gray-500">
                      {Math.round(patient.latestCompliancePercent)}% compliance
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    patient.trend === 'declining'
                      ? 'bg-red-100 text-red-700'
                      : patient.trend === 'improving'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {patient.trend || 'Stable'}
                </span>
              </div>
            )) || (
              <p className="text-sm text-gray-500 text-center py-4">
                All patients are compliant
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Programs */}
        <SectionCard
          title="Active Programs"
          icon={<Activity className="h-5 w-5 text-purple-500" />}
          action={
            <Link to="/rpm/programs" className="text-sm text-indigo-600 hover:underline">
              Manage Programs
            </Link>
          }
        >
          <div className="space-y-2">
            {programsData?.data?.map((program: any) => (
              <Link
                key={program.id}
                to={`/rpm/programs/${program.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    {program.programType === 'hypertension' && <Heart className="h-5 w-5 text-purple-600" />}
                    {program.programType === 'diabetes' && <Droplet className="h-5 w-5 text-purple-600" />}
                    {program.programType === 'weight_management' && <Scale className="h-5 w-5 text-purple-600" />}
                    {!['hypertension', 'diabetes', 'weight_management'].includes(program.programType) && (
                      <Activity className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{program.programName}</span>
                    <p className="text-xs text-gray-500">{program.programType.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Active
                </span>
              </Link>
            )) || (
              <p className="text-sm text-gray-500 text-center py-4">No active programs</p>
            )}
          </div>
        </SectionCard>

        {/* Recent Enrollments */}
        <SectionCard
          title="Recent Enrollments"
          icon={<Users className="h-5 w-5 text-green-500" />}
          action={
            <Link to="/rpm/enrollments" className="text-sm text-indigo-600 hover:underline">
              View All
            </Link>
          }
        >
          <div className="space-y-2">
            {enrollmentsData?.data?.map((enrollment: any) => (
              <Link
                key={enrollment.id}
                to={`/rpm/enrollments/${enrollment.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{enrollment.enrollmentNumber}</span>
                    <p className="text-xs text-gray-500">
                      Started {new Date(enrollment.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    enrollment.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : enrollment.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {enrollment.status}
                </span>
              </Link>
            )) || (
              <p className="text-sm text-gray-500 text-center py-4">No recent enrollments</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Supported Device Types */}
      <SectionCard
        title="Supported Device Types"
        icon={<Smartphone className="h-5 w-5 text-indigo-500" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { type: 'Blood Pressure Monitor', icon: <Heart className="h-6 w-6" />, color: 'red' },
            { type: 'Glucometer', icon: <Droplet className="h-6 w-6" />, color: 'blue' },
            { type: 'Pulse Oximeter', icon: <Activity className="h-6 w-6" />, color: 'purple' },
            { type: 'Weight Scale', icon: <Scale className="h-6 w-6" />, color: 'green' },
            { type: 'Thermometer', icon: <Thermometer className="h-6 w-6" />, color: 'orange' },
            { type: 'ECG Monitor', icon: <Heart className="h-6 w-6" />, color: 'pink' },
          ].map((device) => (
            <div
              key={device.type}
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div
                className={`h-12 w-12 rounded-full bg-${device.color}-100 flex items-center justify-center text-${device.color}-600 mb-2`}
              >
                {device.icon}
              </div>
              <span className="text-xs text-gray-600 text-center">{device.type}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default RpmDashboardPage;
