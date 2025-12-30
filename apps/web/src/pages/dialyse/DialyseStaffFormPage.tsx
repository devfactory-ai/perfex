/**
 * Dialyse Staff Form Page
 * Create or edit a staff member
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Save } from 'lucide-react';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import {
  PageHeader,
  FormSection,
  FormGrid,
  FormActions,
  Button,
  Input,
  Select,
  Textarea
} from '@/components/healthcare';

interface StaffFormData {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  specialization: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
  hireDate: string;
  contractType: string;
  workSchedule: string;
  notes: string;
}

const initialFormData: StaffFormData = {
  employeeNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'nurse',
  specialization: '',
  licenseNumber: '',
  licenseExpiry: '',
  status: 'active',
  hireDate: '',
  contractType: 'permanent',
  workSchedule: 'full_time',
  notes: '',
};

export function DialyseStaffFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const toast = useToast();
  const isEditing = !!id;

  const roleOptions = [
    { value: 'nephrologist', label: t('dialyse.staff.role.nephrologist') },
    { value: 'nurse', label: t('dialyse.staff.role.nurse') },
    { value: 'technician', label: t('dialyse.staff.role.technician') },
    { value: 'coordinator', label: t('dialyse.staff.role.coordinator') },
    { value: 'dietitian', label: t('dialyse.staff.role.dietitian') },
    { value: 'social_worker', label: t('dialyse.staff.role.socialWorker') },
    { value: 'admin', label: t('dialyse.staff.role.admin') },
  ];

  const statusOptions = [
    { value: 'active', label: t('dialyse.staff.status.active') },
    { value: 'on_leave', label: t('dialyse.staff.status.onLeave') },
    { value: 'inactive', label: t('dialyse.staff.status.inactive') },
  ];

  const contractTypes = [
    { value: 'permanent', label: t('dialyse.staff.contract.permanent') },
    { value: 'temporary', label: t('dialyse.staff.contract.temporary') },
    { value: 'part_time', label: t('dialyse.staff.contract.partTime') },
    { value: 'contractor', label: t('dialyse.staff.contract.contractor') },
  ];

  const workSchedules = [
    { value: 'full_time', label: t('dialyse.staff.schedule.fullTime') },
    { value: 'part_time', label: t('dialyse.staff.schedule.partTime') },
    { value: 'shift_morning', label: t('dialyse.staff.schedule.morning') },
    { value: 'shift_afternoon', label: t('dialyse.staff.schedule.afternoon') },
    { value: 'shift_night', label: t('dialyse.staff.schedule.night') },
    { value: 'rotating', label: t('dialyse.staff.schedule.rotating') },
  ];

  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing staff if editing
  const { data: existingStaff, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['dialyse-staff', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/dialyse/staff/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingStaff) {
      setFormData({
        employeeNumber: existingStaff.employeeNumber || '',
        firstName: existingStaff.firstName || '',
        lastName: existingStaff.lastName || '',
        email: existingStaff.email || '',
        phone: existingStaff.phone || '',
        role: existingStaff.role || 'nurse',
        specialization: existingStaff.specialization || '',
        licenseNumber: existingStaff.licenseNumber || '',
        licenseExpiry: existingStaff.licenseExpiry?.split('T')[0] || '',
        status: existingStaff.status || 'active',
        hireDate: existingStaff.hireDate?.split('T')[0] || '',
        contractType: existingStaff.contractType || 'permanent',
        workSchedule: existingStaff.workSchedule || 'full_time',
        notes: existingStaff.notes || '',
      });
    }
  }, [existingStaff]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>('/dialyse/staff', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-staff'] });
      navigate('/dialyse/staff');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<any>>(`/dialyse/staff/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-staff'] });
      navigate('/dialyse/staff');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = t('dialyse.staff.validation.firstNameRequired');
    }
    if (!formData.lastName) {
      newErrors.lastName = t('dialyse.staff.validation.lastNameRequired');
    }
    if (!formData.role) {
      newErrors.role = t('dialyse.staff.validation.roleRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      employeeNumber: formData.employeeNumber || `EMP-${Date.now()}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      role: formData.role,
      specialization: formData.specialization || null,
      licenseNumber: formData.licenseNumber || null,
      licenseExpiry: formData.licenseExpiry || null,
      status: formData.status,
      hireDate: formData.hireDate || null,
      contractType: formData.contractType,
      workSchedule: formData.workSchedule,
      notes: formData.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (field: keyof StaffFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing && isLoadingStaff) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t('dialyse.staff.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('dialyse.staff.editTitle') : t('dialyse.staff.newTitle')}
        subtitle={isEditing ? t('dialyse.staff.editDescription') : t('dialyse.staff.newDescription')}
        icon={Users}
        module="dialyse"
        onBack={() => navigate('/dialyse/staff')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={t('dialyse.staff.section.personalInfo')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              label={t('dialyse.staff.field.firstName')}
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder={t('dialyse.staff.field.firstName')}
              error={errors.firstName}
              required
              module="dialyse"
            />

            <Input
              label={t('dialyse.staff.field.lastName')}
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder={t('dialyse.staff.field.lastName')}
              error={errors.lastName}
              required
              module="dialyse"
            />

            <Input
              type="email"
              label={t('dialyse.staff.field.email')}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={t('dialyse.staff.placeholder.email')}
              module="dialyse"
            />

            <Input
              type="tel"
              label={t('dialyse.staff.field.phone')}
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder={t('dialyse.staff.placeholder.phone')}
              module="dialyse"
            />

            <Input
              label={t('dialyse.staff.field.employeeNumber')}
              value={formData.employeeNumber}
              onChange={(e) => handleChange('employeeNumber', e.target.value)}
              placeholder={t('dialyse.staff.placeholder.employeeNumber')}
              module="dialyse"
            />

            <Select
              label={t('dialyse.staff.field.status')}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.staff.section.qualifications')} module="dialyse">
          <FormGrid columns={2}>
            <Select
              label={t('dialyse.staff.field.role')}
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              options={roleOptions}
              error={errors.role}
              required
              module="dialyse"
            />

            <Input
              label={t('dialyse.staff.field.specialization')}
              value={formData.specialization}
              onChange={(e) => handleChange('specialization', e.target.value)}
              placeholder={t('dialyse.staff.field.specialization')}
              module="dialyse"
            />

            <Input
              label={t('dialyse.staff.field.licenseNumber')}
              value={formData.licenseNumber}
              onChange={(e) => handleChange('licenseNumber', e.target.value)}
              placeholder={t('dialyse.staff.placeholder.licenseNumber')}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.staff.field.licenseExpiry')}
              value={formData.licenseExpiry}
              onChange={(e) => handleChange('licenseExpiry', e.target.value)}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.staff.section.contract')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              type="date"
              label={t('dialyse.staff.field.hireDate')}
              value={formData.hireDate}
              onChange={(e) => handleChange('hireDate', e.target.value)}
              module="dialyse"
            />

            <Select
              label={t('dialyse.staff.field.contractType')}
              value={formData.contractType}
              onChange={(e) => handleChange('contractType', e.target.value)}
              options={contractTypes}
              module="dialyse"
            />

            <Select
              label={t('dialyse.staff.field.workSchedule')}
              value={formData.workSchedule}
              onChange={(e) => handleChange('workSchedule', e.target.value)}
              options={workSchedules}
              module="dialyse"
            />

            <div className="md:col-span-2">
              <Textarea
                label={t('dialyse.staff.field.notes')}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder={t('dialyse.staff.placeholder.notes')}
                module="dialyse"
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate('/dialyse/staff')}
          >
            {t('dialyse.staff.button.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            module="dialyse"
            disabled={createMutation.isPending || updateMutation.isPending}
            loading={createMutation.isPending || updateMutation.isPending}
            icon={Save}
          >
            {createMutation.isPending || updateMutation.isPending
              ? t('dialyse.staff.button.saving')
              : isEditing
              ? t('dialyse.staff.button.update')
              : t('dialyse.staff.button.add')}
          </Button>
        </FormActions>

        {(createMutation.isError || updateMutation.isError) && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400">
            {getErrorMessage(createMutation.error || updateMutation.error)}
          </div>
        )}
      </form>
    </div>
  );
}
