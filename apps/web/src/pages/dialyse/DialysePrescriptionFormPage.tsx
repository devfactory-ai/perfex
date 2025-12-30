/**
 * Dialyse Prescription Form Page
 * Create/Edit dialysis prescriptions
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Save } from 'lucide-react';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
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

interface Patient {
  id: string;
  medicalId: string;
  contact: {
    firstName: string;
    lastName: string;
  };
}

interface PrescriptionFormData {
  patientId: string;
  prescribedById: string;
  type: 'hemodialysis' | 'hemodiafiltration' | 'hemofiltration';
  durationMinutes: number;
  frequencyPerWeek: number;
  dialyzerType: string;
  dialyzerSurface: number | null;
  bloodFlowRate: number | null;
  dialysateFlowRate: number | null;
  dialysateCalcium: number | null;
  dialysatePotassium: number | null;
  dialysateBicarbonate: number | null;
  anticoagulationType: 'heparin' | 'lmwh' | 'citrate' | 'none';
  anticoagulationDose: string;
  dryWeight: number | null;
  ufGoal: number | null;
  sodiumProfile: string;
  notes: string;
}

const defaultFormData: PrescriptionFormData = {
  patientId: '',
  prescribedById: '',
  type: 'hemodialysis',
  durationMinutes: 240,
  frequencyPerWeek: 3,
  dialyzerType: '',
  dialyzerSurface: null,
  bloodFlowRate: 300,
  dialysateFlowRate: 500,
  dialysateCalcium: 1.5,
  dialysatePotassium: 2.0,
  dialysateBicarbonate: 35,
  anticoagulationType: 'heparin',
  anticoagulationDose: '',
  dryWeight: null,
  ufGoal: null,
  sodiumProfile: 'constant',
  notes: '',
};

export function DialysePrescriptionFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const isEditing = !!id;

  const [formData, setFormData] = useState<PrescriptionFormData>({
    ...defaultFormData,
    patientId: patientIdParam || '',
  });

  // Fetch patient if patientId is provided
  const { data: patient } = useQuery({
    queryKey: ['dialyse-patient', patientIdParam],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Patient>>(`/dialyse/patients/${patientIdParam}`);
      return response.data.data;
    },
    enabled: !!patientIdParam,
  });

  // Fetch patients for selection if no patientId
  const { data: patients } = useQuery({
    queryKey: ['dialyse-patients-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Patient[]>>('/dialyse/patients?status=active&limit=100');
      return response.data.data;
    },
    enabled: !patientIdParam,
  });

  // Fetch prescription if editing
  const { data: prescription } = useQuery({
    queryKey: ['dialyse-prescription', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PrescriptionFormData & { id: string }>>(`/dialyse/prescriptions/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (prescription) {
      setFormData({
        patientId: prescription.patientId,
        prescribedById: prescription.prescribedById,
        type: prescription.type,
        durationMinutes: prescription.durationMinutes,
        frequencyPerWeek: prescription.frequencyPerWeek,
        dialyzerType: prescription.dialyzerType || '',
        dialyzerSurface: prescription.dialyzerSurface,
        bloodFlowRate: prescription.bloodFlowRate,
        dialysateFlowRate: prescription.dialysateFlowRate,
        dialysateCalcium: prescription.dialysateCalcium,
        dialysatePotassium: prescription.dialysatePotassium,
        dialysateBicarbonate: prescription.dialysateBicarbonate,
        anticoagulationType: prescription.anticoagulationType,
        anticoagulationDose: prescription.anticoagulationDose || '',
        dryWeight: prescription.dryWeight,
        ufGoal: prescription.ufGoal,
        sodiumProfile: prescription.sodiumProfile || 'constant',
        notes: prescription.notes || '',
      });
    }
  }, [prescription]);

  // Create/Update mutation
  const savePrescription = useMutation({
    mutationFn: async (data: PrescriptionFormData) => {
      const payload = {
        ...data,
        dialyzerSurface: data.dialyzerSurface || undefined,
        bloodFlowRate: data.bloodFlowRate || undefined,
        dialysateFlowRate: data.dialysateFlowRate || undefined,
        dialysateCalcium: data.dialysateCalcium || undefined,
        dialysatePotassium: data.dialysatePotassium || undefined,
        dialysateBicarbonate: data.dialysateBicarbonate || undefined,
        dryWeight: data.dryWeight || undefined,
        ufGoal: data.ufGoal || undefined,
        notes: data.notes || undefined,
      };

      if (isEditing) {
        const response = await api.put<ApiResponse<unknown>>(`/dialyse/prescriptions/${id}`, payload);
        return response.data;
      } else {
        const response = await api.post<ApiResponse<unknown>>('/dialyse/prescriptions', payload);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-patient-prescriptions'] });
      toast.success(isEditing ? t('dialyse.prescriptionUpdated') : t('dialyse.prescriptionCreated'));
      if (patientIdParam) {
        navigate(`/dialyse/patients/${patientIdParam}`);
      } else {
        navigate('/dialyse/patients');
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast.warning(t('dialyse.pleaseSelectPatient'));
      return;
    }
    savePrescription.mutate(formData);
  };

  const handleChange = (field: keyof PrescriptionFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('dialyse.editPrescription') : t('dialyse.newDialysisPrescription')}
        subtitle={patient ? `${t('dialyse.patient')}: ${patient.contact.firstName} ${patient.contact.lastName} (${patient.medicalId})` : t('dialyse.defineDialysisParameters')}
        icon={FileText}
        module="dialyse"
        onBack={() => navigate(-1)}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        {!patientIdParam && (
          <FormSection title={t('dialyse.patient')} module="dialyse">
            <FormGrid columns={1}>
              <Select
                label={t('dialyse.patient')}
                value={formData.patientId}
                onChange={(e) => handleChange('patientId', e.target.value)}
                options={[
                  { value: '', label: t('dialyse.selectPatient') },
                  ...(patients?.map((p) => ({
                    value: p.id,
                    label: `${p.contact.firstName} ${p.contact.lastName} (${p.medicalId})`
                  })) || [])
                ]}
                required
                module="dialyse"
              />
            </FormGrid>
          </FormSection>
        )}

        {/* Basic Parameters */}
        <FormSection title={t('dialyse.basicParameters')} module="dialyse">
          <FormGrid columns={3}>
            <Select
              label={t('dialyse.dialysisType')}
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              options={[
                { value: 'hemodialysis', label: t('dialyse.hemodialysis') },
                { value: 'hemodiafiltration', label: t('dialyse.hemodiafiltration') },
                { value: 'hemofiltration', label: t('dialyse.hemofiltration') }
              ]}
              required
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.durationMinutes')}
              value={formData.durationMinutes.toString()}
              onChange={(e) => handleChange('durationMinutes', parseInt(e.target.value))}
              min={60}
              max={480}
              step={15}
              required
              module="dialyse"
            />

            <Select
              label={t('dialyse.frequencyPerWeek')}
              value={formData.frequencyPerWeek.toString()}
              onChange={(e) => handleChange('frequencyPerWeek', parseInt(e.target.value))}
              options={[
                { value: '2', label: t('dialyse.timesPerWeek2') },
                { value: '3', label: t('dialyse.timesPerWeek3') },
                { value: '4', label: t('dialyse.timesPerWeek4') },
                { value: '5', label: t('dialyse.timesPerWeek5') },
                { value: '6', label: t('dialyse.timesPerWeek6') }
              ]}
              required
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Dialyzer Parameters */}
        <FormSection title={t('dialyse.dialyzer')} module="dialyse">
          <FormGrid columns={3}>
            <Input
              label={t('dialyse.dialyzerType')}
              value={formData.dialyzerType}
              onChange={(e) => handleChange('dialyzerType', e.target.value)}
              placeholder={t('dialyse.dialyzerTypePlaceholder')}
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.surfaceM2')}
              value={formData.dialyzerSurface?.toString() || ''}
              onChange={(e) => handleChange('dialyzerSurface', e.target.value ? parseFloat(e.target.value) : null)}
              step={0.1}
              min={0.5}
              max={3}
              placeholder="1.8"
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.bloodFlowRate')}
              value={formData.bloodFlowRate?.toString() || ''}
              onChange={(e) => handleChange('bloodFlowRate', e.target.value ? parseInt(e.target.value) : null)}
              min={100}
              max={500}
              step={10}
              placeholder="300"
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Dialysate Parameters */}
        <FormSection title={t('dialyse.dialysate')} module="dialyse">
          <FormGrid columns={4}>
            <Input
              type="number"
              label={t('dialyse.flowRateMLMin')}
              value={formData.dialysateFlowRate?.toString() || ''}
              onChange={(e) => handleChange('dialysateFlowRate', e.target.value ? parseInt(e.target.value) : null)}
              min={300}
              max={800}
              step={50}
              placeholder="500"
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.calciumMmolL')}
              value={formData.dialysateCalcium?.toString() || ''}
              onChange={(e) => handleChange('dialysateCalcium', e.target.value ? parseFloat(e.target.value) : null)}
              step={0.25}
              min={1}
              max={2}
              placeholder="1.5"
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.potassiumMmolL')}
              value={formData.dialysatePotassium?.toString() || ''}
              onChange={(e) => handleChange('dialysatePotassium', e.target.value ? parseFloat(e.target.value) : null)}
              step={0.5}
              min={0}
              max={4}
              placeholder="2.0"
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.bicarbonateMmolL')}
              value={formData.dialysateBicarbonate?.toString() || ''}
              onChange={(e) => handleChange('dialysateBicarbonate', e.target.value ? parseInt(e.target.value) : null)}
              min={25}
              max={40}
              placeholder="35"
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Anticoagulation */}
        <FormSection title={t('dialyse.anticoagulation')} module="dialyse">
          <FormGrid columns={2}>
            <Select
              label={t('dialyse.type')}
              value={formData.anticoagulationType}
              onChange={(e) => handleChange('anticoagulationType', e.target.value)}
              options={[
                { value: 'heparin', label: t('dialyse.unfractedHeparin') },
                { value: 'lmwh', label: t('dialyse.lmwh') },
                { value: 'citrate', label: t('dialyse.citrate') },
                { value: 'none', label: t('dialyse.noAnticoagulation') }
              ]}
              module="dialyse"
            />

            <Input
              label={t('dialyse.dosage')}
              value={formData.anticoagulationDose}
              onChange={(e) => handleChange('anticoagulationDose', e.target.value)}
              placeholder={t('dialyse.dosagePlaceholder')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Ultrafiltration */}
        <FormSection title={t('dialyse.ultrafiltration')} module="dialyse">
          <FormGrid columns={3}>
            <Input
              type="number"
              label={t('dialyse.dryWeightKg')}
              value={formData.dryWeight?.toString() || ''}
              onChange={(e) => handleChange('dryWeight', e.target.value ? parseFloat(e.target.value) : null)}
              step={0.1}
              min={30}
              max={200}
              placeholder="70.0"
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.ufGoalML')}
              value={formData.ufGoal?.toString() || ''}
              onChange={(e) => handleChange('ufGoal', e.target.value ? parseInt(e.target.value) : null)}
              min={0}
              max={5000}
              step={100}
              placeholder="2000"
              module="dialyse"
            />

            <Select
              label={t('dialyse.sodiumProfile')}
              value={formData.sodiumProfile}
              onChange={(e) => handleChange('sodiumProfile', e.target.value)}
              options={[
                { value: 'constant', label: t('dialyse.constant') },
                { value: 'linear_decreasing', label: t('dialyse.linearDecreasing') },
                { value: 'step', label: t('dialyse.stepwise') }
              ]}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Notes */}
        <FormSection title={t('dialyse.notes')} module="dialyse">
          <FormGrid columns={1}>
            <Textarea
              label={t('dialyse.notes')}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              placeholder={t('dialyse.notesPlaceholder')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Actions */}
        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            {t('dialyse.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            module="dialyse"
            disabled={savePrescription.isPending}
            loading={savePrescription.isPending}
            icon={Save}
          >
            {savePrescription.isPending ? t('dialyse.saving') : isEditing ? t('dialyse.update') : t('dialyse.createPrescription')}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
