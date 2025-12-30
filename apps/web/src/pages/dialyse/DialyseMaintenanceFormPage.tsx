/**
 * Dialyse Maintenance Form Page
 * Create or edit a maintenance record
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, Save } from 'lucide-react';
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

interface Machine {
  id: string;
  machineNumber: string;
  model: string;
}

interface MaintenanceFormData {
  machineId: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: string;
  completedDate: string;
  technician: string;
  description: string;
  findings: string;
  partsReplaced: string;
  laborHours: string;
  cost: string;
  notes: string;
}

const initialFormData: MaintenanceFormData = {
  machineId: '',
  type: 'preventive',
  status: 'scheduled',
  priority: 'medium',
  scheduledDate: '',
  completedDate: '',
  technician: '',
  description: '',
  findings: '',
  partsReplaced: '',
  laborHours: '',
  cost: '',
  notes: '',
};

export function DialyseMaintenanceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const toast = useToast();
  const isEditing = !!id;

  const maintenanceTypes = [
    { value: 'preventive', label: t('dialyse.typePreventive') },
    { value: 'corrective', label: t('dialyse.typeCorrective') },
    { value: 'calibration', label: t('dialyse.typeCalibration') },
    { value: 'inspection', label: t('dialyse.typeInspection') },
  ];

  const statusOptions = [
    { value: 'scheduled', label: t('dialyse.statusScheduled') },
    { value: 'in_progress', label: t('dialyse.statusInProgress') },
    { value: 'completed', label: t('dialyse.statusCompleted') },
    { value: 'cancelled', label: t('dialyse.statusCancelled') },
  ];

  const priorityOptions = [
    { value: 'low', label: t('dialyse.priorityLow') },
    { value: 'medium', label: t('dialyse.priorityMedium') },
    { value: 'high', label: t('dialyse.priorityHigh') },
    { value: 'critical', label: t('dialyse.priorityCritical') },
  ];

  const [formData, setFormData] = useState<MaintenanceFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch machines for selection
  const { data: machines } = useQuery({
    queryKey: ['dialyse-machines-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Machine[]>>('/dialyse/machines?limit=100');
      return response.data.data;
    },
  });

  // Fetch existing maintenance if editing
  const { data: existingMaintenance, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['dialyse-maintenance', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/dialyse/maintenance/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingMaintenance) {
      setFormData({
        machineId: existingMaintenance.machineId || '',
        type: existingMaintenance.type || 'preventive',
        status: existingMaintenance.status || 'scheduled',
        priority: existingMaintenance.priority || 'medium',
        scheduledDate: existingMaintenance.scheduledDate?.split('T')[0] || '',
        completedDate: existingMaintenance.completedDate?.split('T')[0] || '',
        technician: existingMaintenance.technician || '',
        description: existingMaintenance.description || '',
        findings: existingMaintenance.findings || '',
        partsReplaced: existingMaintenance.partsReplaced || '',
        laborHours: existingMaintenance.laborHours?.toString() || '',
        cost: existingMaintenance.cost?.toString() || '',
        notes: existingMaintenance.notes || '',
      });
    }
  }, [existingMaintenance]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>('/dialyse/maintenance', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-maintenance'] });
      navigate('/dialyse/maintenance');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<any>>(`/dialyse/maintenance/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-maintenance'] });
      navigate('/dialyse/maintenance');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.machineId) {
      newErrors.machineId = t('dialyse.machineRequired');
    }
    if (!formData.type) {
      newErrors.type = t('dialyse.typeRequired');
    }
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = t('dialyse.scheduledDateRequired');
    }
    if (!formData.description) {
      newErrors.description = t('dialyse.descriptionRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      machineId: formData.machineId,
      type: formData.type,
      status: formData.status,
      scheduledDate: formData.scheduledDate,
      completedDate: formData.completedDate || null,
      performedBy: formData.technician || null,
      description: formData.description,
      workPerformed: formData.findings || null,
      partsReplaced: formData.partsReplaced ? [formData.partsReplaced] : null,
      downtime: formData.laborHours ? parseInt(formData.laborHours) : null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      notes: formData.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (field: keyof MaintenanceFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing && isLoadingMaintenance) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t('dialyse.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('dialyse.editMaintenance') : t('dialyse.newMaintenance')}
        subtitle={isEditing ? t('dialyse.editMaintenanceDescription') : t('dialyse.newMaintenanceDescription')}
        icon={Wrench}
        module="dialyse"
        onBack={() => navigate('/dialyse/maintenance')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={t('dialyse.generalInformation')} module="dialyse">
          <FormGrid columns={2}>
            <Select
              label={t('dialyse.machine')}
              value={formData.machineId}
              onChange={(e) => handleChange('machineId', e.target.value)}
              options={[
                { value: '', label: t('dialyse.selectMachine') },
                ...(machines?.map((machine) => ({
                  value: machine.id,
                  label: `${machine.machineNumber} - ${machine.model}`
                })) || [])
              ]}
              error={errors.machineId}
              required
              module="dialyse"
            />

            <Select
              label={t('dialyse.type')}
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              options={maintenanceTypes}
              error={errors.type}
              required
              module="dialyse"
            />

            <Select
              label={t('dialyse.status')}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
              module="dialyse"
            />

            <Select
              label={t('dialyse.priority')}
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              options={priorityOptions}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.scheduledDate')}
              value={formData.scheduledDate}
              onChange={(e) => handleChange('scheduledDate', e.target.value)}
              error={errors.scheduledDate}
              required
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.completedDate')}
              value={formData.completedDate}
              onChange={(e) => handleChange('completedDate', e.target.value)}
              module="dialyse"
            />

            <Input
              label={t('dialyse.technician')}
              value={formData.technician}
              onChange={(e) => handleChange('technician', e.target.value)}
              placeholder={t('dialyse.technicianPlaceholder')}
              module="dialyse"
            />

            <Input
              type="number"
              step="0.01"
              label={t('dialyse.cost')}
              value={formData.cost}
              onChange={(e) => handleChange('cost', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.interventionDetails')} module="dialyse">
          <FormGrid columns={1}>
            <Textarea
              label={t('dialyse.description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder={t('dialyse.descriptionPlaceholder')}
              error={errors.description}
              required
              module="dialyse"
            />

            <Textarea
              label={t('dialyse.findingsWorkPerformed')}
              value={formData.findings}
              onChange={(e) => handleChange('findings', e.target.value)}
              rows={3}
              placeholder={t('dialyse.findingsPlaceholder')}
              module="dialyse"
            />
          </FormGrid>

          <FormGrid columns={2}>
            <Input
              label={t('dialyse.partsReplaced')}
              value={formData.partsReplaced}
              onChange={(e) => handleChange('partsReplaced', e.target.value)}
              placeholder={t('dialyse.partsPlaceholder')}
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.laborHours')}
              value={formData.laborHours}
              onChange={(e) => handleChange('laborHours', e.target.value)}
              placeholder="0"
              module="dialyse"
            />
          </FormGrid>

          <FormGrid columns={1}>
            <Textarea
              label={t('dialyse.notes')}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              placeholder={t('dialyse.notesPlaceholder')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate('/dialyse/maintenance')}
          >
            {t('dialyse.cancel')}
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
              ? t('dialyse.saving')
              : isEditing
              ? t('dialyse.update')
              : t('dialyse.createMaintenance')}
          </Button>
        </FormActions>

        {(createMutation.isError || updateMutation.isError) && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 p-4 text-slate-800 dark:text-slate-300">
            {getErrorMessage(createMutation.error || updateMutation.error)}
          </div>
        )}
      </form>
    </div>
  );
}
