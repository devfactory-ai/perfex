/**
 * Employee Modal Component
 * Create and edit employees
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateEmployeeInput, Employee, Department } from '@perfex/shared';
import { z } from 'zod';

// Form schema that matches the UI needs
const employeeFormSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
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
  position: z.string().min(1, 'Position is required'),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  hireDate: z.string().min(1, 'Hire date is required'),
  terminationDate: z.string().optional().or(z.literal('')),
  salary: z.string().optional().or(z.literal('')),
  salaryCurrency: z.string().length(3).default('EUR'),
  salaryPeriod: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  emergencyContactName: z.string().optional().or(z.literal('')),
  emergencyContactPhone: z.string().optional().or(z.literal('')),
  emergencyContactRelation: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEmployeeInput) => Promise<void>;
  employee?: Employee;
  departments?: Department[];
  isSubmitting?: boolean;
}

export function EmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  employee,
  departments = [],
  isSubmitting = false,
}: EmployeeModalProps) {
  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employeeNumber: employee?.employeeNumber || '',
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      dateOfBirth: employee ? formatDateForInput(employee.dateOfBirth) : '',
      gender: (employee?.gender as any) || '',
      address: employee?.address || '',
      city: employee?.city || '',
      state: employee?.state || '',
      postalCode: employee?.postalCode || '',
      country: employee?.country || '',
      departmentId: employee?.departmentId || '',
      position: employee?.position || '',
      employmentType: employee?.employmentType || 'full_time',
      hireDate: employee ? formatDateForInput(employee.hireDate) : '',
      terminationDate: employee ? formatDateForInput(employee.terminationDate) : '',
      salary: employee?.salary?.toString() || '',
      salaryCurrency: employee?.salaryCurrency || 'EUR',
      salaryPeriod: employee?.salaryPeriod || 'monthly',
      emergencyContactName: employee?.emergencyContactName || '',
      emergencyContactPhone: employee?.emergencyContactPhone || '',
      emergencyContactRelation: employee?.emergencyContactRelation || '',
      notes: employee?.notes || '',
      active: employee?.active ?? true,
    },
  });

  // Reset form when employee changes or modal closes
  useEffect(() => {
    if (isOpen) {
      reset({
        employeeNumber: employee?.employeeNumber || '',
        firstName: employee?.firstName || '',
        lastName: employee?.lastName || '',
        email: employee?.email || '',
        phone: employee?.phone || '',
        dateOfBirth: employee ? formatDateForInput(employee.dateOfBirth) : '',
        gender: (employee?.gender as any) || '',
        address: employee?.address || '',
        city: employee?.city || '',
        state: employee?.state || '',
        postalCode: employee?.postalCode || '',
        country: employee?.country || '',
        departmentId: employee?.departmentId || '',
        position: employee?.position || '',
        employmentType: employee?.employmentType || 'full_time',
        hireDate: employee ? formatDateForInput(employee.hireDate) : '',
        terminationDate: employee ? formatDateForInput(employee.terminationDate) : '',
        salary: employee?.salary?.toString() || '',
        salaryCurrency: employee?.salaryCurrency || 'EUR',
        salaryPeriod: employee?.salaryPeriod || 'monthly',
        emergencyContactName: employee?.emergencyContactName || '',
        emergencyContactPhone: employee?.emergencyContactPhone || '',
        emergencyContactRelation: employee?.emergencyContactRelation || '',
        notes: employee?.notes || '',
        active: employee?.active ?? true,
      });
    }
  }, [isOpen, employee, reset]);

  const handleFormSubmit = async (data: EmployeeFormData) => {
    // Parse numbers
    const salary = data.salary ? parseFloat(data.salary) : null;

    // Format dates for API
    const hireDate = data.hireDate ? new Date(data.hireDate).toISOString() : new Date().toISOString();
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null;
    const terminationDate = data.terminationDate ? new Date(data.terminationDate).toISOString() : null;

    const cleanedData: CreateEmployeeInput = {
      employeeNumber: data.employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      dateOfBirth,
      gender: (data.gender as any) || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || null,
      departmentId: data.departmentId || null,
      position: data.position,
      employmentType: data.employmentType,
      hireDate,
      terminationDate,
      salary,
      salaryCurrency: data.salaryCurrency,
      salaryPeriod: data.salaryPeriod,
      managerId: null,
      userId: null,
      workSchedule: null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      emergencyContactRelation: data.emergencyContactRelation || null,
      notes: data.notes || null,
      active: data.active,
    };

    await onSubmit(cleanedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {employee ? 'Edit Employee' : 'Create Employee'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100"
              disabled={isSubmitting}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('employeeNumber')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="EMP-001"
                  />
                  {errors.employeeNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.employeeNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="employee@company.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    {...register('dateOfBirth')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    {...register('gender')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Address</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">Street Address</label>
                <input
                  type="text"
                  {...register('address')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    {...register('city')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    {...register('postalCode')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    {...register('country')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Employment Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('position')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Software Engineer"
                  />
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    {...register('departmentId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('employmentType')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hire Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('hireDate')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.hireDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.hireDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Termination Date</label>
                  <input
                    type="date"
                    {...register('terminationDate')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Compensation */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Compensation</h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('salary')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    {...register('salaryCurrency')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="MAD">MAD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Period</label>
                  <select
                    {...register('salaryPeriod')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Emergency Contact</h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    {...register('emergencyContactName')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    {...register('emergencyContactPhone')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Relation</label>
                  <input
                    type="text"
                    {...register('emergencyContactRelation')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="Spouse, Parent, etc."
                  />
                </div>
              </div>
            </div>

            {/* Additional */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Additional Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('active')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : employee ? 'Update Employee' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
