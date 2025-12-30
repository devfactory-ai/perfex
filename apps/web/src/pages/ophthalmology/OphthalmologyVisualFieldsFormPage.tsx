/**
 * Ophthalmology Visual Fields Form Page
 * Create/Edit visual field (perimetry) tests
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import {
  PageHeader,
  Button,
  FormSection,
  FormGrid,
  FormActions,
  Input,
  Select,
  Textarea,
} from '../../components/healthcare';

interface VisualFieldsFormData {
  patientId: string;
  eye: 'OD' | 'OS';
  testDate: string;
  testType: 'humphrey_24_2' | 'humphrey_30_2' | 'humphrey_10_2' | 'goldmann';
  meanDeviation: string;
  patternStandardDeviation: string;
  visualFieldIndex: string;
  falsePosRate: string;
  falseNegRate: string;
  fixationLoss: string;
  interpretation: string;
  notes: string;
}

export default function OphthalmologyVisualFieldsFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<VisualFieldsFormData>({
    patientId: '',
    eye: 'OD',
    testDate: '',
    testType: 'humphrey_24_2',
    meanDeviation: '',
    patternStandardDeviation: '',
    visualFieldIndex: '',
    falsePosRate: '',
    falseNegRate: '',
    fixationLoss: '',
    interpretation: '',
    notes: '',
  });

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['ophthalmology-patients'],
    queryFn: async () => {
      const response = await api.get('/ophthalmology/patients?limit=100');
      return response.data?.data || [];
    },
  });

  // Fetch existing visual field if editing
  const { data: visualField } = useQuery({
    queryKey: ['ophthalmology-visual-fields', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/visual-fields/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (visualField) {
      setFormData({
        patientId: visualField.patientId || '',
        eye: visualField.eye || 'OD',
        testDate: visualField.testDate ? new Date(visualField.testDate).toISOString().slice(0, 16) : '',
        testType: visualField.testType || 'humphrey_24_2',
        meanDeviation: visualField.meanDeviation || '',
        patternStandardDeviation: visualField.patternStandardDeviation || '',
        visualFieldIndex: visualField.visualFieldIndex || '',
        falsePosRate: visualField.falsePosRate || '',
        falseNegRate: visualField.falseNegRate || '',
        fixationLoss: visualField.fixationLoss || '',
        interpretation: visualField.interpretation || '',
        notes: visualField.notes || '',
      });
    }
  }, [visualField]);

  const mutation = useMutation({
    mutationFn: async (data: VisualFieldsFormData) => {
      if (isEdit) {
        return api.put(`/ophthalmology/visual-fields/${id}`, data);
      }
      return api.post('/ophthalmology/visual-fields', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-visual-fields'] });
      toast.success(isEdit ? t('ophthalmology.visualFieldUpdated') : t('ophthalmology.visualFieldCreated'));
      navigate('/ophthalmology/visual-fields');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('common.saveError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const testTypes = [
    { value: 'humphrey_24_2', label: 'Humphrey 24-2' },
    { value: 'humphrey_30_2', label: 'Humphrey 30-2' },
    { value: 'humphrey_10_2', label: 'Humphrey 10-2' },
    { value: 'goldmann', label: 'Goldmann' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isEdit ? t('ophthalmology.editVisualField') : t('ophthalmology.newVisualField')}
        subtitle={isEdit ? t('ophthalmology.editVisualFieldSubtitle') : t('ophthalmology.newVisualFieldSubtitle')}
        icon={Eye}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/visual-fields')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <FormSection module="ophthalmology">
          <FormGrid>
            {/* Patient */}
            <Select
              label={t('common.patient')}
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
              module="ophthalmology"
              placeholder={t('common.selectPatient')}
              options={patients?.map((patient: any) => ({
                value: patient.id,
                label: `${patient.firstName} ${patient.lastName} - ${patient.medicalRecordNumber}`
              })) || []}
            />

            {/* Eye */}
            <Select
              label="Œil"
              value={formData.eye}
              onChange={(e) => setFormData({ ...formData, eye: e.target.value as 'OD' | 'OS' })}
              required
              module="ophthalmology"
              options={[
                { value: 'OD', label: `OD - ${t('ophthalmology.rightEye')}` },
                { value: 'OS', label: `OS - ${t('ophthalmology.leftEye')}` }
              ]}
            />

            {/* Test Date */}
            <Input
              type="datetime-local"
              label="Date du test"
              value={formData.testDate}
              onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
              required
              module="ophthalmology"
            />

            {/* Test Type */}
            <Select
              label="Type de test"
              value={formData.testType}
              onChange={(e) => setFormData({ ...formData, testType: e.target.value as VisualFieldsFormData['testType'] })}
              required
              module="ophthalmology"
              options={testTypes}
            />

            {/* Mean Deviation */}
            <Input
              type="text"
              label="Déviation moyenne (dB)"
              value={formData.meanDeviation}
              onChange={(e) => setFormData({ ...formData, meanDeviation: e.target.value })}
              placeholder="-2.5"
              module="ophthalmology"
            />

            {/* Pattern Standard Deviation */}
            <Input
              type="text"
              label="Déviation standard du modèle (dB)"
              value={formData.patternStandardDeviation}
              onChange={(e) => setFormData({ ...formData, patternStandardDeviation: e.target.value })}
              placeholder="2.1"
              module="ophthalmology"
            />

            {/* Visual Field Index */}
            <Input
              type="text"
              label="Index du champ visuel (%)"
              value={formData.visualFieldIndex}
              onChange={(e) => setFormData({ ...formData, visualFieldIndex: e.target.value })}
              placeholder="95"
              module="ophthalmology"
            />

            {/* False Positive Rate */}
            <Input
              type="text"
              label="Taux de faux positifs (%)"
              value={formData.falsePosRate}
              onChange={(e) => setFormData({ ...formData, falsePosRate: e.target.value })}
              placeholder="3"
              module="ophthalmology"
            />

            {/* False Negative Rate */}
            <Input
              type="text"
              label="Taux de faux négatifs (%)"
              value={formData.falseNegRate}
              onChange={(e) => setFormData({ ...formData, falseNegRate: e.target.value })}
              placeholder="2"
              module="ophthalmology"
            />

            {/* Fixation Loss */}
            <Input
              type="text"
              label="Perte de fixation (%)"
              value={formData.fixationLoss}
              onChange={(e) => setFormData({ ...formData, fixationLoss: e.target.value })}
              placeholder="5"
              module="ophthalmology"
            />

            {/* Interpretation */}
            <div className="md:col-span-2">
              <Textarea
                label="Interprétation"
                value={formData.interpretation}
                onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                rows={4}
                placeholder="Interprétation des résultats du champ visuel..."
                module="ophthalmology"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <Textarea
                label={t('common.notes')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Notes additionnelles..."
                module="ophthalmology"
              />
            </div>
          </FormGrid>

          {/* Actions */}
          <FormActions>
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/ophthalmology/visual-fields')}
              module="ophthalmology"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={Save}
              disabled={mutation.isPending}
              module="ophthalmology"
            >
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
