/**
 * Dialyse Protocol Form Page
 * Create or edit a dialysis protocol
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Save } from 'lucide-react';
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

interface ProtocolFormData {
  name: string;
  code: string;
  type: string;
  status: string;
  description: string;
  duration: string;
  bloodFlowRate: string;
  dialysateFlowRate: string;
  dialyzerType: string;
  anticoagulationType: string;
  anticoagulationDose: string;
  bicarbonateLevel: string;
  sodiumLevel: string;
  potassiumLevel: string;
  calciumLevel: string;
  ufGoal: string;
  temperature: string;
  indications: string;
  contraindications: string;
  specialInstructions: string;
}

const initialFormData: ProtocolFormData = {
  name: '',
  code: '',
  type: 'standard',
  status: 'active',
  description: '',
  duration: '240',
  bloodFlowRate: '300',
  dialysateFlowRate: '500',
  dialyzerType: '',
  anticoagulationType: 'heparin',
  anticoagulationDose: '',
  bicarbonateLevel: '35',
  sodiumLevel: '140',
  potassiumLevel: '2',
  calciumLevel: '1.5',
  ufGoal: '',
  temperature: '37',
  indications: '',
  contraindications: '',
  specialInstructions: '',
};


export function DialyseProtocolFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const toast = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState<ProtocolFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const protocolTypes = [
    { value: 'standard', label: t('dialyse.protocol.type.standard') },
    { value: 'high_flux', label: t('dialyse.protocol.type.highFlux') },
    { value: 'low_flux', label: t('dialyse.protocol.type.lowFlux') },
    { value: 'hemodiafiltration', label: t('dialyse.protocol.type.hemodiafiltration') },
    { value: 'nocturnal', label: t('dialyse.protocol.type.nocturnal') },
    { value: 'pediatric', label: t('dialyse.protocol.type.pediatric') },
  ];

  const statusOptions = [
    { value: 'active', label: t('common.status.active') },
    { value: 'inactive', label: t('common.status.inactive') },
    { value: 'draft', label: t('common.status.draft') },
  ];

  const anticoagulationTypes = [
    { value: 'heparin', label: t('dialyse.protocol.anticoagulation.heparin') },
    { value: 'lmwh', label: t('dialyse.protocol.anticoagulation.lmwh') },
    { value: 'citrate', label: t('dialyse.protocol.anticoagulation.citrate') },
    { value: 'none', label: t('dialyse.protocol.anticoagulation.none') },
  ];

  // Fetch existing protocol if editing
  const { data: existingProtocol, isLoading: isLoadingProtocol } = useQuery({
    queryKey: ['dialyse-protocol', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/dialyse/protocols/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingProtocol) {
      setFormData({
        name: existingProtocol.name || '',
        code: existingProtocol.code || '',
        type: existingProtocol.type || 'standard',
        status: existingProtocol.status || 'active',
        description: existingProtocol.description || '',
        duration: existingProtocol.duration?.toString() || '240',
        bloodFlowRate: existingProtocol.bloodFlowRate?.toString() || '300',
        dialysateFlowRate: existingProtocol.dialysateFlowRate?.toString() || '500',
        dialyzerType: existingProtocol.dialyzerType || '',
        anticoagulationType: existingProtocol.anticoagulationType || 'heparin',
        anticoagulationDose: existingProtocol.anticoagulationDose || '',
        bicarbonateLevel: existingProtocol.bicarbonateLevel?.toString() || '35',
        sodiumLevel: existingProtocol.sodiumLevel?.toString() || '140',
        potassiumLevel: existingProtocol.potassiumLevel?.toString() || '2',
        calciumLevel: existingProtocol.calciumLevel?.toString() || '1.5',
        ufGoal: existingProtocol.ufGoal?.toString() || '',
        temperature: existingProtocol.temperature?.toString() || '37',
        indications: existingProtocol.indications || '',
        contraindications: existingProtocol.contraindications || '',
        specialInstructions: existingProtocol.specialInstructions || '',
      });
    }
  }, [existingProtocol]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>('/dialyse/protocols', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-protocols'] });
      navigate('/dialyse/protocols');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<any>>(`/dialyse/protocols/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-protocols'] });
      navigate('/dialyse/protocols');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = t('dialyse.protocol.validation.nameRequired');
    }
    if (!formData.code) {
      newErrors.code = t('dialyse.protocol.validation.codeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      name: formData.name,
      code: formData.code,
      type: formData.type,
      status: formData.status,
      description: formData.description || null,
      duration: parseInt(formData.duration) || 240,
      bloodFlowRate: parseInt(formData.bloodFlowRate) || 300,
      dialysateFlowRate: parseInt(formData.dialysateFlowRate) || 500,
      dialyzerType: formData.dialyzerType || null,
      anticoagulationType: formData.anticoagulationType,
      anticoagulationDose: formData.anticoagulationDose || null,
      bicarbonateLevel: parseFloat(formData.bicarbonateLevel) || 35,
      sodiumLevel: parseInt(formData.sodiumLevel) || 140,
      potassiumLevel: parseFloat(formData.potassiumLevel) || 2,
      calciumLevel: parseFloat(formData.calciumLevel) || 1.5,
      ufGoal: formData.ufGoal ? parseFloat(formData.ufGoal) : null,
      temperature: parseFloat(formData.temperature) || 37,
      indications: formData.indications || null,
      contraindications: formData.contraindications || null,
      specialInstructions: formData.specialInstructions || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (field: keyof ProtocolFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing && isLoadingProtocol) {
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
        title={isEditing ? t('dialyse.protocol.form.titleEdit') : t('dialyse.protocol.form.titleNew')}
        subtitle={isEditing ? t('dialyse.protocol.form.descriptionEdit') : t('dialyse.protocol.form.descriptionNew')}
        icon={FileText}
        module="dialyse"
        onBack={() => navigate('/dialyse/protocols')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={t('dialyse.protocol.section.generalInfo')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              label={t('dialyse.protocol.field.name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('dialyse.protocol.placeholder.name')}
              error={errors.name}
              required
              module="dialyse"
            />

            <Input
              label={t('dialyse.protocol.field.code')}
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder={t('dialyse.protocol.placeholder.code')}
              error={errors.code}
              required
              module="dialyse"
            />

            <Select
              label={t('dialyse.protocol.field.type')}
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              options={protocolTypes}
              module="dialyse"
            />

            <Select
              label={t('common.field.status')}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
              module="dialyse"
            />
          </FormGrid>

          <FormGrid columns={1}>
            <Textarea
              label={t('common.field.description')}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              placeholder={t('dialyse.protocol.placeholder.description')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.protocol.section.dialysisParams')} module="dialyse">
          <FormGrid columns={3}>
            <Input
              type="number"
              label={t('dialyse.protocol.field.duration')}
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="240"
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.protocol.field.bloodFlowRate')}
              value={formData.bloodFlowRate}
              onChange={(e) => handleChange('bloodFlowRate', e.target.value)}
              placeholder="300"
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.protocol.field.dialysateFlowRate')}
              value={formData.dialysateFlowRate}
              onChange={(e) => handleChange('dialysateFlowRate', e.target.value)}
              placeholder="500"
              module="dialyse"
            />

            <Input
              label={t('dialyse.protocol.field.dialyzerType')}
              value={formData.dialyzerType}
              onChange={(e) => handleChange('dialyzerType', e.target.value)}
              placeholder={t('dialyse.protocol.placeholder.dialyzerType')}
              module="dialyse"
            />

            <Input
              type="number"
              step="0.1"
              label={t('dialyse.protocol.field.ufGoal')}
              value={formData.ufGoal}
              onChange={(e) => handleChange('ufGoal', e.target.value)}
              placeholder="2.0"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.1"
              label={t('dialyse.protocol.field.temperature')}
              value={formData.temperature}
              onChange={(e) => handleChange('temperature', e.target.value)}
              placeholder="37"
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.protocol.section.dialysateComposition')} module="dialyse">
          <FormGrid columns={4}>
            <Input
              type="number"
              step="0.1"
              label={t('dialyse.protocol.field.bicarbonate')}
              value={formData.bicarbonateLevel}
              onChange={(e) => handleChange('bicarbonateLevel', e.target.value)}
              placeholder="35"
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.protocol.field.sodium')}
              value={formData.sodiumLevel}
              onChange={(e) => handleChange('sodiumLevel', e.target.value)}
              placeholder="140"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.1"
              label={t('dialyse.protocol.field.potassium')}
              value={formData.potassiumLevel}
              onChange={(e) => handleChange('potassiumLevel', e.target.value)}
              placeholder="2"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.1"
              label={t('dialyse.protocol.field.calcium')}
              value={formData.calciumLevel}
              onChange={(e) => handleChange('calciumLevel', e.target.value)}
              placeholder="1.5"
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.protocol.section.anticoagulation')} module="dialyse">
          <FormGrid columns={2}>
            <Select
              label={t('dialyse.protocol.field.anticoagulationType')}
              value={formData.anticoagulationType}
              onChange={(e) => handleChange('anticoagulationType', e.target.value)}
              options={anticoagulationTypes}
              module="dialyse"
            />

            <Input
              label={t('dialyse.protocol.field.anticoagulationDose')}
              value={formData.anticoagulationDose}
              onChange={(e) => handleChange('anticoagulationDose', e.target.value)}
              placeholder={t('dialyse.protocol.placeholder.anticoagulationDose')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.protocol.section.indicationsInstructions')} module="dialyse">
          <FormGrid columns={1}>
            <Textarea
              label={t('dialyse.protocol.field.indications')}
              value={formData.indications}
              onChange={(e) => handleChange('indications', e.target.value)}
              rows={2}
              placeholder={t('dialyse.protocol.placeholder.indications')}
              module="dialyse"
            />

            <Textarea
              label={t('dialyse.protocol.field.contraindications')}
              value={formData.contraindications}
              onChange={(e) => handleChange('contraindications', e.target.value)}
              rows={2}
              placeholder={t('dialyse.protocol.placeholder.contraindications')}
              module="dialyse"
            />

            <Textarea
              label={t('dialyse.protocol.field.specialInstructions')}
              value={formData.specialInstructions}
              onChange={(e) => handleChange('specialInstructions', e.target.value)}
              rows={2}
              placeholder={t('dialyse.protocol.placeholder.specialInstructions')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate('/dialyse/protocols')}
          >
            {t('common.button.cancel')}
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
              ? t('common.button.saving')
              : isEditing
              ? t('common.button.update')
              : t('dialyse.protocol.button.create')}
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
