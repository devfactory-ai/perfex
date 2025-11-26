/**
 * Employee Form Page
 * Create and edit employees on a dedicated page
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateEmployeeInput, Employee, Department } from '@perfex/shared';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { z } from 'zod';

// Form schema that matches the UI needs
const employeeFormSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  departmentId: z.string().optional().or(z.literal('')),
  position: z.string().min(1, 'Position is required').max(200),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).default('full_time'),
  hireDate: z.string().min(1, 'Hire date is required'),
  terminationDate: z.string().optional().or(z.literal('')),
  salary: z.string().optional().or(z.literal('')),
  salaryCurrency: z.string().length(3).default('EUR'),
  salaryPeriod: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  managerId: z.string().optional().or(z.literal('')),
  emergencyContactName: z.string().optional().or(z.literal('')),
  emergencyContactPhone: z.string().optional().or(z.literal('')),
  emergencyContactRelation: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  // Fetch employee data if editing
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<ApiResponse<Employee>>(`/hr/employees/${id}`);
      return response.data.data;
    },
    enabled: isEditMode,
  });

  // Fetch departments for dropdown
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Department[]>>('/hr/departments');
      return response.data.data;
    },
  });

  // Fetch employees for manager dropdown
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Employee[]>>('/hr/employees');
      return response.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employeeNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      departmentId: '',
      position: '',
      employmentType: 'full_time',
      hireDate: '',
      terminationDate: '',
      salary: '',
      salaryCurrency: 'EUR',
      salaryPeriod: 'monthly',
      managerId: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      notes: '',
      active: true,
    },
  });

  // Update form when employee data is loaded
  useEffect(() => {
    if (employee) {
      reset({
        employeeNumber: employee.employeeNumber || '',
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        dateOfBirth: employee.dateOfBirth
          ? new Date(employee.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: (employee.gender as 'male' | 'female' | 'other' | '') || '',
        address: employee.address || '',
        city: employee.city || '',
        state: employee.state || '',
        postalCode: employee.postalCode || '',
        country: employee.country || '',
        departmentId: employee.departmentId || '',
        position: employee.position || '',
        employmentType: employee.employmentType || 'full_time',
        hireDate: employee.hireDate
          ? new Date(employee.hireDate).toISOString().split('T')[0]
          : '',
        terminationDate: employee.terminationDate
          ? new Date(employee.terminationDate).toISOString().split('T')[0]
          : '',
        salary: employee.salary ? employee.salary.toString() : '',
        salaryCurrency: employee.salaryCurrency || 'EUR',
        salaryPeriod: employee.salaryPeriod || 'monthly',
        managerId: employee.managerId || '',
        emergencyContactName: employee.emergencyContactName || '',
        emergencyContactPhone: employee.emergencyContactPhone || '',
        emergencyContactRelation: employee.emergencyContactRelation || '',
        notes: employee.notes || '',
        active: employee.active ?? true,
      });
    }
  }, [employee, reset]);

  // Create employee mutation
  const createEmployee = useMutation({
    mutationFn: async (data: CreateEmployeeInput) => {
      const response = await api.post<ApiResponse<Employee>>('/hr/employees', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-stats'] });
      alert('Employee created successfully!');
      navigate('/hr/employees');
    },
    onError: (error) => {
      alert(`Failed to create employee: ${getErrorMessage(error)}`);
    },
  });

  // Update employee mutation
  const updateEmployee = useMutation({
    mutationFn: async (data: CreateEmployeeInput) => {
      if (!id) throw new Error('Employee ID is required');
      const response = await api.put<ApiResponse<Employee>>(`/hr/employees/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-stats'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      alert('Employee updated successfully!');
      navigate('/hr/employees');
    },
    onError: (error) => {
      alert(`Failed to update employee: ${getErrorMessage(error)}`);
    },
  });

  const handleFormSubmit = async (data: EmployeeFormData) => {
    const cleanedData: CreateEmployeeInput = {
      employeeNumber: data.employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth || null,
      gender: (data.gender || null) as 'male' | 'female' | 'other' | null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || null,
      departmentId: data.departmentId || null,
      position: data.position,
      employmentType: data.employmentType,
      hireDate: data.hireDate,
      terminationDate: data.terminationDate || null,
      salary: data.salary ? parseFloat(data.salary) : null,
      salaryCurrency: data.salaryCurrency,
      salaryPeriod: data.salaryPeriod,
      managerId: data.managerId || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      emergencyContactRelation: data.emergencyContactRelation || null,
      notes: data.notes || null,
      active: data.active,
    };

    if (isEditMode) {
      await updateEmployee.mutateAsync(cleanedData);
    } else {
      await createEmployee.mutateAsync(cleanedData);
    }
  };

  const isSubmitting = createEmployee.isPending || updateEmployee.isPending;

  if (isEditMode && isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading employee...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Employee' : 'Add New Employee'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? 'Update employee information and employment details'
              : 'Add a new employee to your organization'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/hr/employees')}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Employee Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('employeeNumber')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="EMP-001"
                  />
                  {errors.employeeNumber && (
                    <p className="text-destructive text-sm mt-1">{errors.employeeNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="employee@example.com"
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-destructive text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-destructive text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    {...register('phone')}
                    type="tel"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input
                    {...register('dateOfBirth')}
                    type="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select
                    {...register('gender')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Address</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Street Address</label>
                  <input
                    {...register('address')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    {...register('city')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">State/Province</label>
                  <input
                    {...register('state')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code</label>
                  <input
                    {...register('postalCode')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="10001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <input
                    {...register('country')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Employment Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Position <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('position')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Software Engineer"
                  />
                  {errors.position && (
                    <p className="text-destructive text-sm mt-1">{errors.position.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <select
                    {...register('departmentId')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No department</option>
                    {departments?.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Employment Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...register('employmentType')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Manager</label>
                  <select
                    {...register('managerId')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No manager</option>
                    {employees?.filter(e => e.id !== id).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hire Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('hireDate')}
                    type="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  {errors.hireDate && (
                    <p className="text-destructive text-sm mt-1">{errors.hireDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Termination Date</label>
                  <input
                    {...register('terminationDate')}
                    type="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Compensation */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Compensation</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Salary</label>
                  <input
                    {...register('salary')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="50000.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    {...register('salaryCurrency')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Period</label>
                  <select
                    {...register('salaryPeriod')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Emergency Contact</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    {...register('emergencyContactName')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    {...register('emergencyContactPhone')}
                    type="tel"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Relation</label>
                  <input
                    {...register('emergencyContactRelation')}
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Spouse, Parent, etc."
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Any additional notes about the employee..."
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      {...register('active')}
                      type="checkbox"
                      className="rounded border-input"
                    />
                    <span className="text-sm font-medium">Active Employee</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end p-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/hr/employees')}
              disabled={isSubmitting}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
