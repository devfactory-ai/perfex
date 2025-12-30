/**
 * Dialyse Transport Form Page
 * Create or edit a transport record
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Save } from 'lucide-react';
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

interface Patient {
  id: string;
  medicalId: string;
  contact: {
    firstName: string;
    lastName: string;
    address: string | null;
  };
}

interface TransportFormData {
  patientId: string;
  transportType: string;
  direction: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  transportProvider: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  distance: string;
  estimatedCost: string;
  wheelchairRequired: boolean;
  stretcherRequired: boolean;
  oxygenRequired: boolean;
  escortRequired: boolean;
  specialInstructions: string;
}

const initialFormData: TransportFormData = {
  patientId: '',
  transportType: 'vsl',
  direction: 'both',
  status: 'scheduled',
  scheduledDate: '',
  scheduledTime: '',
  pickupAddress: '',
  dropoffAddress: '',
  transportProvider: '',
  driverName: '',
  driverPhone: '',
  vehicleNumber: '',
  distance: '',
  estimatedCost: '',
  wheelchairRequired: false,
  stretcherRequired: false,
  oxygenRequired: false,
  escortRequired: false,
  specialInstructions: '',
};


export function DialyseTransportFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const toast = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState<TransportFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const transportTypes = [
    { value: 'ambulance', label: t('dialyse.transport.type.ambulance') },
    { value: 'vsl', label: t('dialyse.transport.type.vsl') },
    { value: 'taxi', label: t('dialyse.transport.type.taxi') },
    { value: 'personal', label: t('dialyse.transport.type.personal') },
    { value: 'family', label: t('dialyse.transport.type.family') },
  ];

  const directionOptions = [
    { value: 'pickup', label: t('dialyse.transport.direction.pickup') },
    { value: 'dropoff', label: t('dialyse.transport.direction.dropoff') },
    { value: 'both', label: t('dialyse.transport.direction.both') },
  ];

  const statusOptions = [
    { value: 'scheduled', label: t('dialyse.transport.status.scheduled') },
    { value: 'confirmed', label: t('dialyse.transport.status.confirmed') },
    { value: 'in_transit', label: t('dialyse.transport.status.in_transit') },
    { value: 'completed', label: t('dialyse.transport.status.completed') },
    { value: 'cancelled', label: t('dialyse.transport.status.cancelled') },
  ];

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['dialyse-patients-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Patient[]>>('/dialyse/patients?limit=100');
      return response.data.data;
    },
  });

  // Fetch existing transport if editing
  const { data: existingTransport, isLoading: isLoadingTransport } = useQuery({
    queryKey: ['dialyse-transport', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/dialyse/transport/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingTransport) {
      setFormData({
        patientId: existingTransport.patientId || '',
        transportType: existingTransport.transportType || 'vsl',
        direction: existingTransport.direction || 'both',
        status: existingTransport.status || 'scheduled',
        scheduledDate: existingTransport.scheduledDate?.split('T')[0] || '',
        scheduledTime: existingTransport.scheduledTime || '',
        pickupAddress: existingTransport.pickupAddress || '',
        dropoffAddress: existingTransport.dropoffAddress || '',
        transportProvider: existingTransport.transportProvider || '',
        driverName: existingTransport.driverName || '',
        driverPhone: existingTransport.driverPhone || '',
        vehicleNumber: existingTransport.vehicleNumber || '',
        distance: existingTransport.distance?.toString() || '',
        estimatedCost: existingTransport.estimatedCost?.toString() || '',
        wheelchairRequired: existingTransport.wheelchairRequired || false,
        stretcherRequired: existingTransport.stretcherRequired || false,
        oxygenRequired: existingTransport.oxygenRequired || false,
        escortRequired: existingTransport.escortRequired || false,
        specialInstructions: existingTransport.specialInstructions || '',
      });
    }
  }, [existingTransport]);

  // Auto-fill addresses when patient is selected
  useEffect(() => {
    if (formData.patientId && patients) {
      const patient = patients.find(p => p.id === formData.patientId);
      if (patient?.contact?.address && !formData.pickupAddress) {
        setFormData(prev => ({
          ...prev,
          pickupAddress: patient.contact.address || '',
          dropoffAddress: t('dialyse.transport.dialysisCenter'),
        }));
      }
    }
  }, [formData.patientId, patients, t]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>('/dialyse/transport', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-transport'] });
      navigate('/dialyse/transport');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<any>>(`/dialyse/transport/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-transport'] });
      navigate('/dialyse/transport');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = t('dialyse.transport.validation.patientRequired');
    }
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = t('dialyse.transport.validation.dateRequired');
    }
    if (!formData.scheduledTime) {
      newErrors.scheduledTime = t('dialyse.transport.validation.timeRequired');
    }
    if (!formData.pickupAddress) {
      newErrors.pickupAddress = t('dialyse.transport.validation.pickupAddressRequired');
    }
    if (!formData.dropoffAddress) {
      newErrors.dropoffAddress = t('dialyse.transport.validation.dropoffAddressRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      patientId: formData.patientId,
      transportType: formData.transportType,
      direction: formData.direction,
      status: formData.status,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      pickupAddress: formData.pickupAddress,
      dropoffAddress: formData.dropoffAddress,
      transportProvider: formData.transportProvider || null,
      driverName: formData.driverName || null,
      driverPhone: formData.driverPhone || null,
      vehicleNumber: formData.vehicleNumber || null,
      distance: formData.distance ? parseFloat(formData.distance) : null,
      estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
      wheelchairRequired: formData.wheelchairRequired,
      stretcherRequired: formData.stretcherRequired,
      oxygenRequired: formData.oxygenRequired,
      escortRequired: formData.escortRequired,
      specialInstructions: formData.specialInstructions || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (field: keyof TransportFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing && isLoadingTransport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('dialyse.transport.editTitle') : t('dialyse.transport.newTitle')}
        subtitle={isEditing ? t('dialyse.transport.editDescription') : t('dialyse.transport.newDescription')}
        icon={Truck}
        module="dialyse"
        onBack={() => navigate('/dialyse/transport')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={t('dialyse.transport.generalInfo')} module="dialyse">
          <FormGrid columns={2}>
            <Select
              label={t('dialyse.transport.patient')}
              value={formData.patientId}
              onChange={(e) => handleChange('patientId', e.target.value)}
              options={[
                { value: '', label: t('dialyse.transport.selectPatient') },
                ...(patients?.map((patient) => ({
                  value: patient.id,
                  label: `${patient.contact.firstName} ${patient.contact.lastName} - ${patient.medicalId}`
                })) || [])
              ]}
              error={errors.patientId}
              required
              module="dialyse"
            />

            <Select
              label={t('dialyse.transport.transportType')}
              value={formData.transportType}
              onChange={(e) => handleChange('transportType', e.target.value)}
              options={transportTypes}
              module="dialyse"
            />

            <Select
              label={t('dialyse.transport.direction')}
              value={formData.direction}
              onChange={(e) => handleChange('direction', e.target.value)}
              options={directionOptions}
              module="dialyse"
            />

            <Select
              label={t('dialyse.transport.status')}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.transport.date')}
              value={formData.scheduledDate}
              onChange={(e) => handleChange('scheduledDate', e.target.value)}
              error={errors.scheduledDate}
              required
              module="dialyse"
            />

            <Input
              type="time"
              label={t('dialyse.transport.time')}
              value={formData.scheduledTime}
              onChange={(e) => handleChange('scheduledTime', e.target.value)}
              error={errors.scheduledTime}
              required
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.transport.route')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              label={t('dialyse.transport.pickupAddress')}
              value={formData.pickupAddress}
              onChange={(e) => handleChange('pickupAddress', e.target.value)}
              placeholder={t('dialyse.transport.pickupAddressPlaceholder')}
              error={errors.pickupAddress}
              required
              module="dialyse"
            />

            <Input
              label={t('dialyse.transport.dropoffAddress')}
              value={formData.dropoffAddress}
              onChange={(e) => handleChange('dropoffAddress', e.target.value)}
              placeholder={t('dialyse.transport.dropoffAddressPlaceholder')}
              error={errors.dropoffAddress}
              required
              module="dialyse"
            />

            <Input
              type="number"
              step="0.1"
              label={t('dialyse.transport.distance')}
              value={formData.distance}
              onChange={(e) => handleChange('distance', e.target.value)}
              placeholder="0"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.01"
              label={t('dialyse.transport.estimatedCost')}
              value={formData.estimatedCost}
              onChange={(e) => handleChange('estimatedCost', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.transport.specialNeeds')} module="dialyse">
          <FormGrid columns={2}>
            <Checkbox
              label={t('dialyse.transport.wheelchair')}
              checked={formData.wheelchairRequired}
              onChange={(e) => handleChange('wheelchairRequired', e.target.checked)}
              module="dialyse"
            />

            <Checkbox
              label={t('dialyse.transport.stretcher')}
              checked={formData.stretcherRequired}
              onChange={(e) => handleChange('stretcherRequired', e.target.checked)}
              module="dialyse"
            />

            <Checkbox
              label={t('dialyse.transport.oxygen')}
              checked={formData.oxygenRequired}
              onChange={(e) => handleChange('oxygenRequired', e.target.checked)}
              module="dialyse"
            />

            <Checkbox
              label={t('dialyse.transport.escort')}
              checked={formData.escortRequired}
              onChange={(e) => handleChange('escortRequired', e.target.checked)}
              module="dialyse"
            />

            <div className="md:col-span-2">
              <Textarea
                label={t('dialyse.transport.specialInstructions')}
                value={formData.specialInstructions}
                onChange={(e) => handleChange('specialInstructions', e.target.value)}
                rows={2}
                placeholder={t('dialyse.transport.specialInstructionsPlaceholder')}
                module="dialyse"
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.transport.provider')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              label={t('dialyse.transport.transportCompany')}
              value={formData.transportProvider}
              onChange={(e) => handleChange('transportProvider', e.target.value)}
              placeholder={t('dialyse.transport.transportCompanyPlaceholder')}
              module="dialyse"
            />

            <Input
              label={t('dialyse.transport.driverName')}
              value={formData.driverName}
              onChange={(e) => handleChange('driverName', e.target.value)}
              placeholder={t('dialyse.transport.driverNamePlaceholder')}
              module="dialyse"
            />

            <Input
              type="tel"
              label={t('dialyse.transport.driverPhone')}
              value={formData.driverPhone}
              onChange={(e) => handleChange('driverPhone', e.target.value)}
              placeholder={t('dialyse.transport.driverPhonePlaceholder')}
              module="dialyse"
            />

            <Input
              label={t('dialyse.transport.vehicleNumber')}
              value={formData.vehicleNumber}
              onChange={(e) => handleChange('vehicleNumber', e.target.value)}
              placeholder={t('dialyse.transport.vehicleNumberPlaceholder')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate('/dialyse/transport')}
          >
            {t('common.cancel')}
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
              ? t('common.saving')
              : isEditing
              ? t('common.update')
              : t('dialyse.transport.createTransport')}
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
