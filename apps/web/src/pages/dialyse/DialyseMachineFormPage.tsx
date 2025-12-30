/**
 * Dialyse Machine Form Page
 * Create or edit a dialysis machine
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
  Textarea,
  Checkbox
} from '@/components/healthcare';

interface MachineFormData {
  machineNumber: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: string;
  isolationOnly: boolean;
  location: string;
  installationDate: string;
  warrantyExpiry: string;
  notes: string;
}

const initialFormData: MachineFormData = {
  machineNumber: '',
  model: '',
  manufacturer: '',
  serialNumber: '',
  status: 'available',
  isolationOnly: false,
  location: '',
  installationDate: '',
  warrantyExpiry: '',
  notes: '',
};

const manufacturers = [
  'Fresenius Medical Care',
  'Baxter',
  'B. Braun',
  'Nipro',
  'Nikkiso',
  'Toray',
  'Gambro',
  'Autre',
];

export function DialyseMachineFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const toast = useToast();
  const isEditing = !!id;

  const statusOptions = [
    { value: 'available', label: t('dialyse.statusAvailable') },
    { value: 'in_use', label: t('dialyse.statusInUse') },
    { value: 'maintenance', label: t('dialyse.statusMaintenance') },
    { value: 'out_of_service', label: t('dialyse.statusOutOfService') },
  ];

  const [formData, setFormData] = useState<MachineFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing machine if editing
  const { data: existingMachine, isLoading: isLoadingMachine } = useQuery({
    queryKey: ['dialyse-machine', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/dialyse/machines/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingMachine) {
      setFormData({
        machineNumber: existingMachine.machineNumber || '',
        model: existingMachine.model || '',
        manufacturer: existingMachine.manufacturer || '',
        serialNumber: existingMachine.serialNumber || '',
        status: existingMachine.status || 'available',
        isolationOnly: existingMachine.isolationOnly || false,
        location: existingMachine.location || '',
        installationDate: existingMachine.installationDate?.split('T')[0] || '',
        warrantyExpiry: existingMachine.warrantyExpiry?.split('T')[0] || '',
        notes: existingMachine.notes || '',
      });
    }
  }, [existingMachine]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>('/dialyse/machines', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-machines'] });
      navigate('/dialyse/machines');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<any>>(`/dialyse/machines/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-machines'] });
      navigate('/dialyse/machines');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.machineNumber) {
      newErrors.machineNumber = t('dialyse.machineNumberRequired');
    }
    if (!formData.model) {
      newErrors.model = t('dialyse.modelRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      machineNumber: formData.machineNumber,
      model: formData.model,
      manufacturer: formData.manufacturer || null,
      serialNumber: formData.serialNumber || null,
      status: formData.status,
      isolationOnly: formData.isolationOnly,
      location: formData.location || null,
      installationDate: formData.installationDate || null,
      warrantyExpiry: formData.warrantyExpiry || null,
      notes: formData.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (field: keyof MachineFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing && isLoadingMachine) {
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
        title={isEditing ? t('dialyse.editMachine') : t('dialyse.newMachine')}
        subtitle={isEditing ? t('dialyse.editMachineDescription') : t('dialyse.newMachineDescription')}
        icon={Wrench}
        module="dialyse"
        onBack={() => navigate('/dialyse/machines')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={t('dialyse.identification')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              label={t('dialyse.machineNumber')}
              value={formData.machineNumber}
              onChange={(e) => handleChange('machineNumber', e.target.value)}
              placeholder={t('dialyse.machineNumberPlaceholder')}
              error={errors.machineNumber}
              required
              module="dialyse"
            />

            <Input
              label={t('dialyse.model')}
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder={t('dialyse.modelPlaceholder')}
              error={errors.model}
              required
              module="dialyse"
            />

            <Select
              label={t('dialyse.manufacturer')}
              value={formData.manufacturer}
              onChange={(e) => handleChange('manufacturer', e.target.value)}
              options={manufacturers.map((mfr) => ({ value: mfr, label: mfr }))}
              placeholder={t('dialyse.select')}
              module="dialyse"
            />

            <Input
              label={t('dialyse.serialNumber')}
              value={formData.serialNumber}
              onChange={(e) => handleChange('serialNumber', e.target.value)}
              placeholder={t('dialyse.serialNumberPlaceholder')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.statusAndLocation')} module="dialyse">
          <FormGrid columns={2}>
            <Select
              label={t('dialyse.status')}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
              module="dialyse"
            />

            <Input
              label={t('dialyse.location')}
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder={t('dialyse.locationPlaceholder')}
              module="dialyse"
            />

            <div className="md:col-span-2">
              <Checkbox
                label={t('dialyse.isolationOnly')}
                checked={formData.isolationOnly}
                onChange={(e) => handleChange('isolationOnly', e.target.checked)}
                module="dialyse"
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.importantDates')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              type="date"
              label={t('dialyse.installationDate')}
              value={formData.installationDate}
              onChange={(e) => handleChange('installationDate', e.target.value)}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.warrantyExpiry')}
              value={formData.warrantyExpiry}
              onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
              module="dialyse"
            />

            <div className="md:col-span-2">
              <Textarea
                label={t('dialyse.notes')}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder={t('dialyse.notesPlaceholder')}
                module="dialyse"
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate('/dialyse/machines')}
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
              : t('dialyse.addMachine')}
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
