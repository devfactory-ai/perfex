/**
 * Dialyse Lab Result Form Page
 * Create/Edit laboratory results for dialysis patients
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Save } from 'lucide-react';
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

interface LabResultFormData {
  patientId: string;
  labDate: string;
  // Kidney function
  urea: number | null;
  creatinine: number | null;
  ktV: number | null;
  urr: number | null;
  // Electrolytes
  sodium: number | null;
  potassium: number | null;
  calcium: number | null;
  phosphorus: number | null;
  magnesium: number | null;
  bicarbonate: number | null;
  // Hematology
  hemoglobin: number | null;
  hematocrit: number | null;
  wbc: number | null;
  platelets: number | null;
  ferritin: number | null;
  tsat: number | null;
  // Metabolic
  albumin: number | null;
  pth: number | null;
  vitaminD: number | null;
  glucose: number | null;
  hba1c: number | null;
  // Lipids
  cholesterol: number | null;
  triglycerides: number | null;
  hdl: number | null;
  ldl: number | null;
  // Liver
  alt: number | null;
  ast: number | null;
  alp: number | null;
  bilirubin: number | null;
  // Inflammatory
  crp: number | null;
  // Notes
  notes: string;
}

const defaultFormData: LabResultFormData = {
  patientId: '',
  labDate: new Date().toISOString().split('T')[0],
  urea: null,
  creatinine: null,
  ktV: null,
  urr: null,
  sodium: null,
  potassium: null,
  calcium: null,
  phosphorus: null,
  magnesium: null,
  bicarbonate: null,
  hemoglobin: null,
  hematocrit: null,
  wbc: null,
  platelets: null,
  ferritin: null,
  tsat: null,
  albumin: null,
  pth: null,
  vitaminD: null,
  glucose: null,
  hba1c: null,
  cholesterol: null,
  triglycerides: null,
  hdl: null,
  ldl: null,
  alt: null,
  ast: null,
  alp: null,
  bilirubin: null,
  crp: null,
  notes: '',
};

// Normal ranges for reference
const normalRanges: Record<string, { min: number; max: number; unit: string }> = {
  urea: { min: 2.5, max: 7.1, unit: 'mmol/L' },
  creatinine: { min: 60, max: 110, unit: 'µmol/L' },
  ktV: { min: 1.2, max: 2.0, unit: '' },
  urr: { min: 65, max: 100, unit: '%' },
  sodium: { min: 136, max: 145, unit: 'mmol/L' },
  potassium: { min: 3.5, max: 5.0, unit: 'mmol/L' },
  calcium: { min: 2.1, max: 2.6, unit: 'mmol/L' },
  phosphorus: { min: 0.8, max: 1.5, unit: 'mmol/L' },
  magnesium: { min: 0.7, max: 1.0, unit: 'mmol/L' },
  bicarbonate: { min: 22, max: 29, unit: 'mmol/L' },
  hemoglobin: { min: 100, max: 120, unit: 'g/L' },
  hematocrit: { min: 30, max: 36, unit: '%' },
  wbc: { min: 4, max: 11, unit: 'G/L' },
  platelets: { min: 150, max: 400, unit: 'G/L' },
  ferritin: { min: 200, max: 500, unit: 'µg/L' },
  tsat: { min: 20, max: 50, unit: '%' },
  albumin: { min: 35, max: 50, unit: 'g/L' },
  pth: { min: 150, max: 300, unit: 'pg/mL' },
  vitaminD: { min: 75, max: 150, unit: 'nmol/L' },
  glucose: { min: 4, max: 7, unit: 'mmol/L' },
  hba1c: { min: 4, max: 6, unit: '%' },
  cholesterol: { min: 0, max: 5.2, unit: 'mmol/L' },
  triglycerides: { min: 0, max: 1.7, unit: 'mmol/L' },
  hdl: { min: 1.0, max: 3.0, unit: 'mmol/L' },
  ldl: { min: 0, max: 3.4, unit: 'mmol/L' },
  alt: { min: 0, max: 40, unit: 'U/L' },
  ast: { min: 0, max: 40, unit: 'U/L' },
  alp: { min: 40, max: 130, unit: 'U/L' },
  bilirubin: { min: 0, max: 21, unit: 'µmol/L' },
  crp: { min: 0, max: 5, unit: 'mg/L' },
};

export function DialyseLabResultFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const isEditing = !!id;

  const [formData, setFormData] = useState<LabResultFormData>({
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

  // Fetch lab result if editing
  const { data: labResult } = useQuery({
    queryKey: ['dialyse-lab-result', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<LabResultFormData & { id: string }>>(`/dialyse/lab-results/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (labResult) {
      setFormData({
        patientId: labResult.patientId,
        labDate: new Date(labResult.labDate).toISOString().split('T')[0],
        urea: labResult.urea,
        creatinine: labResult.creatinine,
        ktV: labResult.ktV,
        urr: labResult.urr,
        sodium: labResult.sodium,
        potassium: labResult.potassium,
        calcium: labResult.calcium,
        phosphorus: labResult.phosphorus,
        magnesium: labResult.magnesium,
        bicarbonate: labResult.bicarbonate,
        hemoglobin: labResult.hemoglobin,
        hematocrit: labResult.hematocrit,
        wbc: labResult.wbc,
        platelets: labResult.platelets,
        ferritin: labResult.ferritin,
        tsat: labResult.tsat,
        albumin: labResult.albumin,
        pth: labResult.pth,
        vitaminD: labResult.vitaminD,
        glucose: labResult.glucose,
        hba1c: labResult.hba1c,
        cholesterol: labResult.cholesterol,
        triglycerides: labResult.triglycerides,
        hdl: labResult.hdl,
        ldl: labResult.ldl,
        alt: labResult.alt,
        ast: labResult.ast,
        alp: labResult.alp,
        bilirubin: labResult.bilirubin,
        crp: labResult.crp,
        notes: labResult.notes || '',
      });
    }
  }, [labResult]);

  // Create/Update mutation
  const saveLabResult = useMutation({
    mutationFn: async (data: LabResultFormData) => {
      // Build payload with only non-null values
      const payload: Record<string, unknown> = {
        patientId: data.patientId,
        labDate: data.labDate,
      };

      // Add all numeric fields that have values
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== '' && key !== 'patientId' && key !== 'labDate' && key !== 'notes') {
          payload[key] = value;
        }
      });

      if (data.notes) {
        payload.notes = data.notes;
      }

      if (isEditing) {
        const response = await api.put<ApiResponse<unknown>>(`/dialyse/lab-results/${id}`, payload);
        return response.data;
      } else {
        const response = await api.post<ApiResponse<unknown>>('/dialyse/lab-results', payload);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-lab-results'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-patient-labs'] });
      toast.success(isEditing ? t('dialyse.labResultUpdated') : t('dialyse.labResultSaved'));
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
    saveLabResult.mutate(formData);
  };

  const handleChange = (field: keyof LabResultFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isOutOfRange = (field: string, value: number | null): boolean => {
    if (value === null) return false;
    const range = normalRanges[field];
    if (!range) return false;
    return value < range.min || value > range.max;
  };

  const renderLabField = (
    field: keyof LabResultFormData,
    label: string,
    step: number = 0.1
  ) => {
    const value = formData[field] as number | null;
    const range = normalRanges[field];
    const outOfRange = isOutOfRange(field, value);

    return (
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">
          {label}
          {range && <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">({range.unit})</span>}
        </label>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => handleChange(field, e.target.value ? parseFloat(e.target.value) : null)}
          step={step}
          className={`w-full rounded-md border px-3 py-2 text-sm ${
            outOfRange
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        />
        {range && (
          <p className={`text-xs mt-1 ${outOfRange ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
            {t('dialyse.normalRange')}: {range.min} - {range.max}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('dialyse.editLabResult') : t('dialyse.newLabResult')}
        subtitle={patient ? `${t('dialyse.patient')}: ${patient.contact.firstName} ${patient.contact.lastName} (${patient.medicalId})` : t('dialyse.recordLabResults')}
        icon={FlaskConical}
        module="dialyse"
        onBack={() => navigate(-1)}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient & Date */}
        <FormSection title={t('dialyse.generalInformation')} module="dialyse">
          <FormGrid columns={2}>
            {!patientIdParam && (
              <Select
                label={t('dialyse.patient')}
                value={formData.patientId}
                onChange={(e) => handleChange('patientId', e.target.value)}
                options={patients?.map((p) => ({
                  value: p.id,
                  label: `${p.contact.firstName} ${p.contact.lastName} (${p.medicalId})`
                })) || []}
                placeholder={t('dialyse.selectPatient')}
                required
                module="dialyse"
              />
            )}

            <Input
              type="date"
              label={t('dialyse.labDate')}
              value={formData.labDate}
              onChange={(e) => handleChange('labDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Kidney Function */}
        <FormSection title={t('dialyse.kidneyFunctionAndDialysis')} module="dialyse">
          <div className="grid gap-4 md:grid-cols-4">
            {renderLabField('urea', t('dialyse.urea'), 0.1)}
            {renderLabField('creatinine', t('dialyse.creatinine'), 1)}
            {renderLabField('ktV', t('dialyse.ktV'), 0.01)}
            {renderLabField('urr', t('dialyse.urr'), 1)}
          </div>
        </FormSection>

        {/* Electrolytes */}
        <FormSection title={t('dialyse.electrolytes')} module="dialyse">
          <div className="grid gap-4 md:grid-cols-6">
            {renderLabField('sodium', t('dialyse.sodium'), 1)}
            {renderLabField('potassium', t('dialyse.potassium'), 0.1)}
            {renderLabField('calcium', t('dialyse.calcium'), 0.01)}
            {renderLabField('phosphorus', t('dialyse.phosphorus'), 0.01)}
            {renderLabField('magnesium', t('dialyse.magnesium'), 0.01)}
            {renderLabField('bicarbonate', t('dialyse.bicarbonate'), 1)}
          </div>
        </FormSection>

        {/* Hematology */}
        <FormSection title={t('dialyse.hematology')} module="dialyse">
          <div className="grid gap-4 md:grid-cols-6">
            {renderLabField('hemoglobin', t('dialyse.hemoglobin'), 1)}
            {renderLabField('hematocrit', t('dialyse.hematocrit'), 0.1)}
            {renderLabField('wbc', t('dialyse.wbc'), 0.1)}
            {renderLabField('platelets', t('dialyse.platelets'), 1)}
            {renderLabField('ferritin', t('dialyse.ferritin'), 1)}
            {renderLabField('tsat', t('dialyse.tsat'), 1)}
          </div>
        </FormSection>

        {/* Metabolic */}
        <FormSection title={t('dialyse.metabolicAndNutrition')} module="dialyse">
          <div className="grid gap-4 md:grid-cols-5">
            {renderLabField('albumin', t('dialyse.albumin'), 0.1)}
            {renderLabField('pth', t('dialyse.pth'), 1)}
            {renderLabField('vitaminD', t('dialyse.vitaminD'), 1)}
            {renderLabField('glucose', t('dialyse.glucose'), 0.1)}
            {renderLabField('hba1c', t('dialyse.hba1c'), 0.1)}
          </div>
        </FormSection>

        {/* Lipids */}
        <FormSection title={t('dialyse.lipidProfile')} module="dialyse">
          <div className="grid gap-4 md:grid-cols-4">
            {renderLabField('cholesterol', t('dialyse.cholesterol'), 0.1)}
            {renderLabField('triglycerides', t('dialyse.triglycerides'), 0.1)}
            {renderLabField('hdl', t('dialyse.hdl'), 0.1)}
            {renderLabField('ldl', t('dialyse.ldl'), 0.1)}
          </div>
        </FormSection>

        {/* Liver & Inflammatory */}
        <FormSection title={t('dialyse.liverAndInflammation')} module="dialyse">
          <div className="grid gap-4 md:grid-cols-5">
            {renderLabField('alt', t('dialyse.alt'), 1)}
            {renderLabField('ast', t('dialyse.ast'), 1)}
            {renderLabField('alp', t('dialyse.alp'), 1)}
            {renderLabField('bilirubin', t('dialyse.bilirubin'), 1)}
            {renderLabField('crp', t('dialyse.crp'), 0.1)}
          </div>
        </FormSection>

        {/* Notes */}
        <FormSection title={t('dialyse.notesAndComments')} module="dialyse">
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            placeholder={t('dialyse.notesPlaceholder')}
            module="dialyse"
          />
        </FormSection>

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
            disabled={saveLabResult.isPending}
            loading={saveLabResult.isPending}
            icon={Save}
          >
            {saveLabResult.isPending ? t('dialyse.saving') : isEditing ? t('dialyse.update') : t('dialyse.saveLabResult')}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
