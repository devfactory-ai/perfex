/**
 * Employees Page
 * Manage employees and HR information
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import type { Employee, CreateEmployeeInput, Department } from '@perfex/shared';
import { EmployeeModal } from '@/components/EmployeeModal';

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();

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

  // Create employee mutation
  const createEmployee = useMutation({
    mutationFn: async (data: CreateEmployeeInput) => {
      const response = await api.post<ApiResponse<Employee>>('/hr/employees', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-stats'] });
      setIsModalOpen(false);
      setSelectedEmployee(undefined);
      alert('Employee created successfully!');
    },
    onError: (error) => {
      alert(`Failed to create employee: ${getErrorMessage(error)}`);
    },
  });

  // Update employee mutation
  const updateEmployee = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateEmployeeInput }) => {
      const response = await api.put<ApiResponse<Employee>>(`/hr/employees/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-stats'] });
      setIsModalOpen(false);
      setSelectedEmployee(undefined);
      alert('Employee updated successfully!');
    },
    onError: (error) => {
      alert(`Failed to update employee: ${getErrorMessage(error)}`);
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
    setSelectedEmployee(undefined);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(undefined);
  };

  const handleModalSubmit = async (data: CreateEmployeeInput) => {
    if (selectedEmployee) {
      await updateEmployee.mutateAsync({ id: selectedEmployee.id, data });
    } else {
      await createEmployee.mutateAsync(data);
    }
  };

  const handleDelete = (employeeId: string, employeeName: string) => {
    if (confirm(`Are you sure you want to delete "${employeeName}"? This action cannot be undone.`)) {
      deleteEmployee.mutate(employeeId);
    }
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
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
            onChange={(e) => setEmploymentTypeFilter(e.target.value)}
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
            onChange={(e) => setActiveFilter(e.target.value)}
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
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            Error loading employees: {getErrorMessage(error)}
          </div>
        ) : !employees || employees.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No employees found.</p>
            <button
              onClick={handleAddEmployee}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Add your first employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Employee #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Hire Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Salary</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employees.map((employee) => {
                  const department = departments?.find(d => d.id === employee.departmentId);
                  return (
                    <tr key={employee.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-mono">{employee.employeeNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                          <div className="text-sm text-muted-foreground">{employee.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{employee.position}</td>
                      <td className="px-4 py-3 text-sm">{department?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {getEmploymentTypeLabel(employee.employmentType)}
                      </td>
                      <td className="px-4 py-3 text-sm">{formatDate(employee.hireDate)}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(employee.salary, employee.salaryCurrency, employee.salaryPeriod)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(employee.active)}`}>
                          {employee.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="text-sm text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id, `${employee.firstName} ${employee.lastName}`)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        employee={selectedEmployee}
        departments={departments}
        isSubmitting={createEmployee.isPending || updateEmployee.isPending}
      />
    </div>
  );
}
