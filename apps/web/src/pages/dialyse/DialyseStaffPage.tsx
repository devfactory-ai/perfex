/**
 * Dialyse Staff Page
 * Manage medical staff for dialysis center
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import { Eye, Pencil, Trash2, Plus, Calendar, Users } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  FilterBar,
  SectionCard,
  EmptyState,
  InlineLoading,
  Button,
  StatsCard,
} from '@/components/healthcare';

interface PaginatedResponse<T> {
  data: T;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface StaffMember {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  role: 'nephrologist' | 'nurse' | 'technician' | 'dietitian' | 'social_worker' | 'administrator';
  specialization: string | null;
  email: string;
  phone: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  licenseNumber: string | null;
  licenseExpiry: string | null;
  hireDate: string | null;
  schedule: StaffSchedule[] | null;
  assignedPatientCount: number;
  sessionsThisMonth: number;
  notes: string | null;
  createdAt: string;
}

interface StaffSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface StaffStats {
  total: number;
  active: number;
  byRole: Record<string, number>;
  onLeave: number;
  expiringLicenses: number;
}

export function DialyseStaffPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleStaff, setScheduleStaff] = useState<StaffMember | null>(null);

  // Fetch staff
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['dialyse-staff', searchTerm, roleFilter, statusFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      params.append('limit', itemsPerPage.toString());

      const url = `/dialyse/staff${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<PaginatedResponse<StaffMember[]>>(url);
      return result.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dialyse-staff-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<StaffStats>>('/dialyse/staff/stats');
      return response.data.data;
    },
  });

  // Delete staff mutation
  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dialyse/staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-staff'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-staff-stats'] });
      toast.success(t('dialyse.staffDeleted'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update schedule mutation
  const updateSchedule = useMutation({
    mutationFn: async ({ id, schedule }: { id: string; schedule: StaffSchedule[] }) => {
      await api.put(`/dialyse/staff/${id}/schedule`, { schedule });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-staff'] });
      setIsScheduleModalOpen(false);
      setScheduleStaff(null);
      toast.success(t('dialyse.scheduleUpdated'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleAddStaff = () => {
    navigate('/dialyse/staff/new');
  };

  const handleEditStaff = (staff: StaffMember) => {
    navigate(`/dialyse/staff/${staff.id}/edit`);
  };

  const handleViewStaff = (staff: StaffMember) => {
    setViewingStaff(staff);
  };

  const handleManageSchedule = (staff: StaffMember) => {
    setScheduleStaff(staff);
    setIsScheduleModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`${t('dialyse.confirmDeleteStaff')} "${name}" ?`)) {
      deleteStaff.mutate(id);
    }
  };

  const handleScheduleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!scheduleStaff) return;

    const formData = new FormData(e.currentTarget);
    const schedule: StaffSchedule[] = [];

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    days.forEach((day, index) => {
      const enabled = formData.get(`${day}_enabled`) === 'on';
      if (enabled) {
        schedule.push({
          dayOfWeek: index,
          startTime: formData.get(`${day}_start`) as string,
          endTime: formData.get(`${day}_end`) as string,
          shift: formData.get(`${day}_shift`) as StaffSchedule['shift'],
        });
      }
    });

    updateSchedule.mutate({ id: scheduleStaff.id, schedule });
  };

  // Calculate paginated data
  const paginatedStaff = useMemo(() => {
    const items = response?.data || [];
    const total = response?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data: items, total, totalPages };
  }, [response, itemsPerPage]);

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      nephrologist: 'bg-purple-100 text-purple-800',
      nurse: 'bg-blue-100 text-blue-800',
      technician: 'bg-green-100 text-green-800',
      dietitian: 'bg-orange-100 text-orange-800',
      social_worker: 'bg-teal-100 text-teal-800',
      administrator: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      nephrologist: t('dialyse.roleNephrologist'),
      nurse: t('dialyse.roleNurse'),
      technician: t('dialyse.roleTechnician'),
      dietitian: t('dialyse.roleDietitian'),
      social_worker: t('dialyse.roleSocialWorker'),
      administrator: t('dialyse.roleAdministrator'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      on_leave: 'bg-yellow-100 text-yellow-800',
    };
    const labels: Record<string, string> = {
      active: t('dialyse.statusActive'),
      inactive: t('dialyse.statusInactive'),
      on_leave: t('dialyse.statusOnLeave'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const isLicenseExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const threeMonths = 90 * 24 * 60 * 60 * 1000;
    return expiry.getTime() - now.getTime() < threeMonths;
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const dayNames = [
    t('dialyse.daySunday'),
    t('dialyse.dayMonday'),
    t('dialyse.dayTuesday'),
    t('dialyse.dayWednesday'),
    t('dialyse.dayThursday'),
    t('dialyse.dayFriday'),
    t('dialyse.daySaturday')
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.staff')}
        subtitle={t('dialyse.staffSubtitle')}
        icon={Users}
        module="dialyse"
        actions={
          <Button
            onClick={handleAddStaff}
            module="dialyse"
            variant="primary"
            icon={Plus}
          >
            {t('dialyse.newStaff')}
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatsCard
            label={t('dialyse.statsTotal')}
            value={stats.total ?? 0}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.statsActive')}
            value={stats.active ?? 0}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.statsNephrologists')}
            value={stats.byRole?.nephrologist ?? 0}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.statsNurses')}
            value={stats.byRole?.nurse ?? 0}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.statsOnLeave')}
            value={stats.onLeave ?? 0}
            module="dialyse"
          />
          <StatsCard
            label={t('dialyse.statsExpiringLicenses')}
            value={stats.expiringLicenses ?? 0}
            module="dialyse"
          />
        </div>
      )}

      {/* Filters and Search */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t('dialyse.searchStaff')}
        module="dialyse"
        filters={[
          {
            name: 'role',
            value: roleFilter,
            options: [
              { value: 'all', label: t('dialyse.filterAllRoles') },
              { value: 'nephrologist', label: t('dialyse.roleNephrologist') },
              { value: 'nurse', label: t('dialyse.roleNurse') },
              { value: 'technician', label: t('dialyse.roleTechnician') },
              { value: 'dietitian', label: t('dialyse.roleDietitian') },
              { value: 'social_worker', label: t('dialyse.roleSocialWorker') },
              { value: 'administrator', label: t('dialyse.roleAdministrator') },
            ],
            onChange: (value) => { setRoleFilter(value); setCurrentPage(1); },
          },
          {
            name: 'status',
            value: statusFilter,
            options: [
              { value: 'all', label: t('dialyse.filterAllStatuses') },
              { value: 'active', label: t('dialyse.statusActive') },
              { value: 'inactive', label: t('dialyse.statusInactive') },
              { value: 'on_leave', label: t('dialyse.statusOnLeave') },
            ],
            onChange: (value) => { setStatusFilter(value); setCurrentPage(1); },
          },
        ]}
      />

      {/* Staff List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} message={t('dialyse.loadingStaff')} />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600 dark:text-red-400">{t('dialyse.error')}: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedStaff.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.tableId')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.tableName')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.tableRole')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.tableContact')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.tableLicense')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.tablePatients')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.tableStatus')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.tableActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedStaff.data.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-gray-900 dark:text-white">{staff.employeeId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{staff.firstName} {staff.lastName}</div>
                          {staff.specialization && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">{staff.specialization}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(staff.role)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white">{staff.email}</div>
                          {staff.phone && <div className="text-gray-600 dark:text-gray-400">{staff.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {staff.licenseNumber ? (
                          <div className="text-sm">
                            <div className="font-mono text-gray-900 dark:text-white">{staff.licenseNumber}</div>
                            <div className={isLicenseExpiringSoon(staff.licenseExpiry) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                              {t('dialyse.licenseExp')}: {formatDate(staff.licenseExpiry)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{staff.assignedPatientCount} {t('dialyse.patients')}</div>
                          <div className="text-gray-600 dark:text-gray-400">{staff.sessionsThisMonth} {t('dialyse.sessionsPerMonth')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(staff.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewStaff(staff)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title={t('dialyse.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleManageSchedule(staff)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title={t('dialyse.schedule')}
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditStaff(staff)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title={t('dialyse.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(staff.id, `${staff.firstName} ${staff.lastName}`)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title={t('dialyse.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedStaff.totalPages}
              totalItems={paginatedStaff.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title={t('dialyse.noStaffFound')}
            description={t('dialyse.noStaffDescription')}
            icon={Users}
            module="dialyse"
            action={{
              label: t('dialyse.newStaff'),
              onClick: handleAddStaff,
              icon: Plus,
            }}
          />
        )}
      </SectionCard>

      {/* View Staff Modal */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{viewingStaff.firstName} {viewingStaff.lastName}</h2>
                    {getStatusBadge(viewingStaff.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(viewingStaff.role)}
                    <span className="text-gray-600 dark:text-gray-400 font-mono">{viewingStaff.employeeId}</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingStaff(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Contact Info */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('dialyse.contactInfo')}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('dialyse.email')}</dt>
                      <dd className="text-gray-900 dark:text-white">{viewingStaff.email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('dialyse.phone')}</dt>
                      <dd className="text-gray-900 dark:text-white">{viewingStaff.phone || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('dialyse.specialization')}</dt>
                      <dd className="text-gray-900 dark:text-white">{viewingStaff.specialization || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('dialyse.hireDate')}</dt>
                      <dd className="text-gray-900 dark:text-white">{formatDate(viewingStaff.hireDate)}</dd>
                    </div>
                  </dl>
                </div>

                {/* License Info */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('dialyse.license')}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('dialyse.licenseNumber')}</dt>
                      <dd className="font-mono text-gray-900 dark:text-white">{viewingStaff.licenseNumber || '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('dialyse.licenseExpiry')}</dt>
                      <dd className={isLicenseExpiringSoon(viewingStaff.licenseExpiry) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}>
                        {formatDate(viewingStaff.licenseExpiry)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Activity */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('dialyse.activity')}</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('dialyse.assignedPatients')}</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{viewingStaff.assignedPatientCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600 dark:text-gray-400">{t('dialyse.sessionsThisMonth')}</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{viewingStaff.sessionsThisMonth}</dd>
                    </div>
                  </dl>
                </div>

                {/* Schedule */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('dialyse.schedule')}</h3>
                  {viewingStaff.schedule && viewingStaff.schedule.length > 0 ? (
                    <div className="space-y-1 text-sm">
                      {viewingStaff.schedule.map((s, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{dayNames[s.dayOfWeek]}</span>
                          <span className="text-gray-900 dark:text-white">{s.startTime} - {s.endTime}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{t('dialyse.noScheduleDefined')}</p>
                  )}
                </div>
              </div>

              {viewingStaff.notes && (
                <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('dialyse.notes')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{viewingStaff.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={() => { setViewingStaff(null); handleEditStaff(viewingStaff); }}
                  module="dialyse"
                  variant="primary"
                  icon={Pencil}
                >
                  {t('dialyse.edit')}
                </Button>
                <Button
                  onClick={() => setViewingStaff(null)}
                  variant="outline"
                >
                  {t('dialyse.close')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && scheduleStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                {t('dialyse.scheduleFor')} {scheduleStaff.firstName} {scheduleStaff.lastName}
              </h2>
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                {dayNames.map((day, index) => {
                  const existing = scheduleStaff.schedule?.find(s => s.dayOfWeek === index);
                  const dayKey = day.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <label className="flex items-center gap-2 w-28">
                        <input
                          type="checkbox"
                          name={`${dayKey}_enabled`}
                          defaultChecked={!!existing}
                          className="rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{day}</span>
                      </label>
                      <input
                        type="time"
                        name={`${dayKey}_start`}
                        defaultValue={existing?.startTime || '08:00'}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                      />
                      <span className="text-gray-600 dark:text-gray-400">-</span>
                      <input
                        type="time"
                        name={`${dayKey}_end`}
                        defaultValue={existing?.endTime || '16:00'}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                      />
                      <select
                        name={`${dayKey}_shift`}
                        defaultValue={existing?.shift || 'morning'}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                      >
                        <option value="morning">{t('dialyse.shiftMorning')}</option>
                        <option value="afternoon">{t('dialyse.shiftAfternoon')}</option>
                        <option value="evening">{t('dialyse.shiftEvening')}</option>
                        <option value="night">{t('dialyse.shiftNight')}</option>
                      </select>
                    </div>
                  );
                })}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={() => { setIsScheduleModalOpen(false); setScheduleStaff(null); }}
                    variant="outline"
                  >
                    {t('dialyse.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    module="dialyse"
                    variant="primary"
                  >
                    {t('dialyse.save')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
