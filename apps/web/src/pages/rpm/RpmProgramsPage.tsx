/**
 * RPM Programs Page
 * List and manage RPM monitoring programs
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SearchInput,
  FilterDropdown,
} from '@/components/healthcare';
import {
  Settings,
  Plus,
  Users,
  Heart,
  Droplet,
  Scale,
  Activity,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';

const PROGRAM_TYPES = [
  { value: 'hypertension', label: 'Hypertension' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'ckd', label: 'Chronic Kidney Disease' },
  { value: 'chf', label: 'Congestive Heart Failure' },
  { value: 'copd', label: 'COPD' },
  { value: 'weight_management', label: 'Weight Management' },
  { value: 'post_surgery', label: 'Post Surgery' },
  { value: 'pregnancy', label: 'Pregnancy' },
  { value: 'cardiac_rehab', label: 'Cardiac Rehabilitation' },
  { value: 'general_wellness', label: 'General Wellness' },
  { value: 'custom', label: 'Custom' },
];

const MODULES = [
  { value: 'dialyse', label: 'Dialysis' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'general', label: 'General' },
];

const getProgramIcon = (type: string) => {
  switch (type) {
    case 'hypertension':
    case 'chf':
    case 'cardiac_rehab':
      return <Heart className="h-5 w-5" />;
    case 'diabetes':
      return <Droplet className="h-5 w-5" />;
    case 'weight_management':
      return <Scale className="h-5 w-5" />;
    default:
      return <Activity className="h-5 w-5" />;
  }
};

export function RpmProgramsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [programType, setProgramType] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [actionProgram, setActionProgram] = useState<any>(null);

  // Fetch programs
  const { data, isLoading } = useQuery({
    queryKey: ['rpm', 'programs', { search, programType, status, page }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (programType) params.set('programType', programType);
      if (status) params.set('status', status);
      return api.get(`/rpm/programs?${params.toString()}`);
    },
  });

  // Update program mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/rpm/programs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpm', 'programs'] });
      setActionProgram(null);
    },
  });

  // Delete program mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rpm/programs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rpm', 'programs'] });
      setActionProgram(null);
    },
  });

  const programs = data?.data || [];
  const pagination = data?.pagination;

  const columns = [
    {
      key: 'program',
      header: 'Program',
      render: (program: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
            {getProgramIcon(program.programType)}
          </div>
          <div>
            <Link
              to={`/rpm/programs/${program.id}`}
              className="text-sm font-medium text-gray-900 hover:text-indigo-600"
            >
              {program.programName}
            </Link>
            <p className="text-xs text-gray-500">{program.programCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (program: any) => (
        <span className="text-sm text-gray-700">
          {PROGRAM_TYPES.find((t) => t.value === program.programType)?.label || program.programType}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Module',
      render: (program: any) =>
        program.associatedModule ? (
          <span className="text-sm text-gray-700">
            {MODULES.find((m) => m.value === program.associatedModule)?.label || program.associatedModule}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Not assigned</span>
        ),
    },
    {
      key: 'compliance',
      header: 'Target Compliance',
      render: (program: any) => (
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 bg-gray-200 rounded-full max-w-[80px]">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${program.complianceTargetPercent || 80}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            {program.complianceTargetPercent || 80}%
          </span>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (program: any) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          {program.programDurationDays
            ? `${program.programDurationDays} days`
            : 'Ongoing'}
        </div>
      ),
    },
    {
      key: 'billing',
      header: 'Billing',
      render: (program: any) => (
        <div>
          {program.cptCode && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              {program.cptCode}
            </span>
          )}
          {program.billingRatePerMonth && (
            <p className="text-xs text-gray-500 mt-1">
              ${program.billingRatePerMonth}/mo
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (program: any) => (
        <StatusBadge
          status={program.status}
          statusMap={{
            active: { label: 'Active', variant: 'green' },
            inactive: { label: 'Inactive', variant: 'gray' },
            archived: { label: 'Archived', variant: 'red' },
          }}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (program: any) => (
        <div className="relative">
          <button
            onClick={() => setActionProgram(actionProgram?.id === program.id ? null : program)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>

          {actionProgram?.id === program.id && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
              <Link
                to={`/rpm/programs/${program.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="h-4 w-4" />
                Edit Program
              </Link>
              {program.status === 'active' ? (
                <button
                  onClick={() => updateMutation.mutate({ id: program.id, data: { status: 'inactive' } })}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pause className="h-4 w-4" />
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => updateMutation.mutate({ id: program.id, data: { status: 'active' } })}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Play className="h-4 w-4" />
                  Activate
                </button>
              )}
              <Link
                to={`/rpm/enrollments/new?programId=${program.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Users className="h-4 w-4" />
                Enroll Patient
              </Link>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to archive this program?')) {
                    deleteMutation.mutate(program.id);
                  }
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Archive Program
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="RPM Programs"
        subtitle="Configure and manage remote patient monitoring programs"
        icon={<Settings className="h-8 w-8 text-purple-600" />}
        actions={
          <Link
            to="/rpm/programs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Create Program
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search programs..."
            />
          </div>
          <FilterDropdown
            label="Type"
            value={programType}
            onChange={setProgramType}
            options={[{ value: '', label: 'All Types' }, ...PROGRAM_TYPES]}
          />
          <FilterDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: '', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </div>
      </div>

      {/* Programs Table */}
      <DataTable
        columns={columns}
        data={programs}
        isLoading={isLoading}
        emptyTitle="No programs found"
        rowKey={(program: any) => program.id}
        currentPage={pagination?.page}
        totalPages={pagination?.totalPages}
        totalItems={pagination?.total}
        onPageChange={setPage}
      />
    </div>
  );
}

export default RpmProgramsPage;
