/**
 * RPM Enrollments Page
 * List and manage patient enrollments in RPM programs
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  FilterDropdown,
} from '@/components/healthcare';
import {
  Users,
  Plus,
  Calendar,
  TrendingUp,
  MoreVertical,
  Edit,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  FileText,
  Activity,
} from 'lucide-react';

export function RpmEnrollmentsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [actionEnrollment, setActionEnrollment] = useState<any>(null);

  // Fetch enrollments
  const { data, isLoading } = useQuery({
    queryKey: ['rpm', 'enrollments', { status, page }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (status) params.set('status', status);
      return api.get(`/rpm/enrollments?${params.toString()}`);
    },
  });

  // Pause mutation
  const pauseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/rpm/enrollments/${id}/pause`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpm', 'enrollments'] });
      setActionEnrollment(null);
    },
  });

  // Resume mutation
  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/rpm/enrollments/${id}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpm', 'enrollments'] });
      setActionEnrollment(null);
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.post(`/rpm/enrollments/${id}/complete`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpm', 'enrollments'] });
      setActionEnrollment(null);
    },
  });

  // Discontinue mutation
  const discontinueMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/rpm/enrollments/${id}/discontinue`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpm', 'enrollments'] });
      setActionEnrollment(null);
    },
  });

  const enrollments = data?.data || [];
  const pagination = data?.pagination;

  const columns = [
    {
      key: 'enrollment',
      header: 'Enrollment',
      render: (enrollment: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <Link
              to={`/rpm/enrollments/${enrollment.id}`}
              className="text-sm font-medium text-gray-900 hover:text-indigo-600"
            >
              {enrollment.enrollmentNumber}
            </Link>
            <p className="text-xs text-gray-500">
              Patient #{enrollment.patientId?.slice(0, 8)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'program',
      header: 'Program',
      render: (enrollment: any) => (
        <span className="text-sm text-gray-700">
          Program #{enrollment.programId?.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (enrollment: any) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-gray-700">
            <Calendar className="h-3 w-3" />
            {new Date(enrollment.startDate).toLocaleDateString()}
          </div>
          {enrollment.expectedEndDate && (
            <p className="text-xs text-gray-500">
              Expected: {new Date(enrollment.expectedEndDate).toLocaleDateString()}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'compliance',
      header: 'Compliance',
      render: (enrollment: any) => {
        // This would come from the compliance history
        const compliancePercent = enrollment.complianceHistory?.[0]?.compliancePercent || 0;
        return (
          <div className="flex items-center gap-2">
            <TrendingUp
              className={`h-4 w-4 ${
                compliancePercent >= 80
                  ? 'text-green-500'
                  : compliancePercent >= 50
                  ? 'text-yellow-500'
                  : 'text-red-500'
              }`}
            />
            <span className="text-sm">{Math.round(compliancePercent)}%</span>
          </div>
        );
      },
    },
    {
      key: 'consent',
      header: 'Consent',
      render: (enrollment: any) =>
        enrollment.consentObtained ? (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Obtained
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-yellow-600">
            <XCircle className="h-4 w-4" />
            Pending
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (enrollment: any) => (
        <StatusBadge
          status={enrollment.status}
          statusMap={{
            active: { label: 'Active', variant: 'green' },
            paused: { label: 'Paused', variant: 'yellow' },
            completed: { label: 'Completed', variant: 'blue' },
            discontinued: { label: 'Discontinued', variant: 'red' },
            expired: { label: 'Expired', variant: 'gray' },
          }}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (enrollment: any) => (
        <div className="relative">
          <button
            onClick={() =>
              setActionEnrollment(actionEnrollment?.id === enrollment.id ? null : enrollment)
            }
            className="p-1 rounded hover:bg-gray-100"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>

          {actionEnrollment?.id === enrollment.id && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
              <Link
                to={`/rpm/enrollments/${enrollment.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Activity className="h-4 w-4" />
                View Details
              </Link>
              <Link
                to={`/rpm/enrollments/${enrollment.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                Edit Enrollment
              </Link>
              {enrollment.status === 'active' && (
                <>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter pause reason:');
                      if (reason) {
                        pauseMutation.mutate({ id: enrollment.id, reason });
                      }
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Mark enrollment as completed?')) {
                        completeMutation.mutate({ id: enrollment.id });
                      }
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter discontinuation reason:');
                      if (reason) {
                        discontinueMutation.mutate({ id: enrollment.id, reason });
                      }
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Discontinue
                  </button>
                </>
              )}
              {enrollment.status === 'paused' && (
                <button
                  onClick={() => resumeMutation.mutate(enrollment.id)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                >
                  <Play className="h-4 w-4" />
                  Resume
                </button>
              )}
              <Link
                to={`/rpm/enrollments/${enrollment.id}/billing`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FileText className="h-4 w-4" />
                Billing
              </Link>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Enrollments"
        subtitle="Manage patient enrollments in RPM programs"
        icon={<Users className="h-8 w-8 text-green-600" />}
        actions={
          <Link
            to="/rpm/enrollments/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Enroll Patient
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <FilterDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
              { value: 'completed', label: 'Completed' },
              { value: 'discontinued', label: 'Discontinued' },
              { value: 'expired', label: 'Expired' },
            ]}
          />
        </div>
      </div>

      {/* Enrollments Table */}
      <DataTable
        columns={columns}
        data={enrollments}
        isLoading={isLoading}
        emptyTitle="No enrollments found"
        rowKey={(enrollment: any) => enrollment.id}
        currentPage={pagination?.page}
        totalPages={pagination?.totalPages}
        totalItems={pagination?.total}
        onPageChange={setPage}
      />
    </div>
  );
}

export default RpmEnrollmentsPage;
