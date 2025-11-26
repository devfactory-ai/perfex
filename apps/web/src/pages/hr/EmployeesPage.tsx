/**
 * Employees Page
 * Manage employees and HR information
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import type { Employee, Department } from '@perfex/shared';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch employees
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees', searchTerm, departmentFilter, employmentTypeFilter, activeFilter],
    queryFn: async () => {
      let url = '/hr/employees';
      const params: string[] = [];

      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (departmentFilter !== 'all') params.push(`departmentId=${departmentFilter}`);
      if (employmentTypeFilter !== 'all') params.push(`employmentType=${employmentTypeFilter}`);
      if (activeFilter !== 'all') params.push(`active=${activeFilter}`);

      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await api.get<ApiResponse<Employee[]>>(url);
      return response.data.data;
    },
  });

  // Fetch departments for filters and modal
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Department[]>>('/hr/departments');
      return response.data.data;
    },
  });

  // Fetch HR stats
  const { data: stats } = useQuery({
    queryKey: ['hr-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        totalEmployees: number;
        activeEmployees: number;
        totalDepartments: number;
        pendingLeaveRequests: number;
      }>>('/hr/employees/stats');
      return response.data.data;
    },
  });

  // Delete employee mutation
  const deleteEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      await api.delete(`/hr/employees/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-stats'] });
      alert('Employee deleted successfully!');
    },
    onError: (error) => {
      alert(`Failed to delete employee: ${getErrorMessage(error)}`);
    },
  });

  const handleAddEmployee = () => {
    navigate('/hr/employees/new');
  };

  const handleEditEmployee = (employeeId: string) => {
    navigate(`/hr/employees/${employeeId}/edit`);
  };

  const handleDelete = (employeeId: string, employeeName: string) => {
    if (confirm(`Are you sure you want to delete "${employeeName}"? This action cannot be undone.`)) {
      deleteEmployee.mutate(employeeId);
    }
  };

  // Calculate paginated data
  const paginatedEmployees = useMemo(() => {
    if (!employees) return { data: [], total: 0, totalPages: 0 };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = employees.slice(startIndex, endIndex);
    const total = employees.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [employees, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(1);
  };

  const handleEmploymentTypeFilterChange = (value: string) => {
    setEmploymentTypeFilter(value);
    setCurrentPage(1);
  };

  const handleActiveFilterChange = (value: string) => {
    setActiveFilter(value);
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount: number | null, currency: string, period: string): string => {
    if (amount === null) return '-';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
    return `${formatted}/${period}`;
  };

  // Get status badge color
  const getStatusColor = (active: boolean): string => {
    return active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  // Get employment type label
  const getEmploymentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      intern: 'Intern',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee information and records
          </p>
        </div>
        <button
          onClick={handleAddEmployee}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Employee
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Employees</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalEmployees}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Active Employees</div>
            <div className="mt-2 text-2xl font-bold">{stats.activeEmployees}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Departments</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalDepartments}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Pending Leave</div>
            <div className="mt-2 text-2xl font-bold text-orange-600">{stats.pendingLeaveRequests}</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search employees by name, email, or employee number..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => handleDepartmentFilterChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Departments</option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <select
            value={employmentTypeFilter}
            onChange={(e) => handleEmploymentTypeFilterChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => handleActiveFilterChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employees List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading employees...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">Error: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedEmployees.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hire Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedEmployees.data.map((employee) => {
                    const department = departments?.find(d => d.id === employee.departmentId);
                    return (
                      <tr key={employee.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 text-sm font-mono">{employee.employeeNumber}</td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                            <div className="text-sm text-muted-foreground">{employee.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{employee.position}</td>
                        <td className="px-6 py-4 text-sm">{department?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          {getEmploymentTypeLabel(employee.employmentType)}
                        </td>
                        <td className="px-6 py-4 text-sm">{formatDate(employee.hireDate)}</td>
                        <td className="px-6 py-4 text-sm">
                          {formatCurrency(employee.salary, employee.salaryCurrency, employee.salaryPeriod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.active)}`}>
                            {employee.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                          <button
                            onClick={() => handleEditEmployee(employee.id)}
                            className="text-primary hover:text-primary/80 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id, `${employee.firstName} ${employee.lastName}`)}
                            className="text-destructive hover:text-destructive/80 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedEmployees.totalPages}
              totalItems={paginatedEmployees.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title="No employees found"
            description="Get started by adding your first employee. Manage employee information, track employment details, and maintain HR records efficiently."
            icon="users"
            action={{
              label: "New Employee",
              onClick: handleAddEmployee,
            }}
          />
        )}
      </div>
    </div>
  );
}
