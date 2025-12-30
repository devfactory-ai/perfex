/**
 * Ophthalmology OSDI Form Page
 * Create/Edit OSDI (Ocular Surface Disease Index) questionnaire scores
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Save } from 'lucide-react';
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

interface OsdiFormData {
  patientId: string;
  assessmentDate: string;
  totalScore: string;
  severity: 'normal' | 'mild' | 'moderate' | 'severe';
  symptomScore: string;
  visionScore: string;
  environmentalScore: string;
  notes: string;
}

export default function OphthalmologyOsdiFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<OsdiFormData>({
    patientId: '',
    assessmentDate: '',
    totalScore: '',
    severity: 'normal',
    symptomScore: '',
    visionScore: '',
    environmentalScore: '',
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

  // Fetch existing OSDI score if editing
  const { data: osdiScore } = useQuery({
    queryKey: ['ophthalmology-osdi', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/osdi-scores/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (osdiScore) {
      setFormData({
        patientId: osdiScore.patientId || '',
        assessmentDate: osdiScore.assessmentDate ? new Date(osdiScore.assessmentDate).toISOString().slice(0, 16) : '',
        totalScore: osdiScore.totalScore?.toString() || '',
        severity: osdiScore.severity || 'normal',
        symptomScore: osdiScore.symptomScore?.toString() || '',
        visionScore: osdiScore.visionScore?.toString() || '',
        environmentalScore: osdiScore.environmentalScore?.toString() || '',
        notes: osdiScore.notes || '',
      });
    }
  }, [osdiScore]);

  const mutation = useMutation({
    mutationFn: async (data: OsdiFormData) => {
      if (isEdit) {
        return api.put(`/ophthalmology/osdi-scores/${id}`, data);
      }
      return api.post('/ophthalmology/osdi-scores', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-osdi'] });
      toast.success(isEdit ? t('ophthalmology.osdiScoreUpdated') : t('ophthalmology.osdiScoreCreated'));
      navigate('/ophthalmology/osdi-scores');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('common.saveError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isEdit ? t('ophthalmology.editOsdiScore') : t('ophthalmology.newOsdiScore')}
        subtitle={isEdit ? t('ophthalmology.editOsdiAssessment') : t('ophthalmology.recordNewOsdiAssessment')}
        icon={ClipboardList}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/osdi-scores')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <FormSection title={t('ophthalmology.osdiAssessment')} module="ophthalmology">
          <FormGrid columns={2}>
            {/* Patient */}
            <Select
              label={t('common.patient')}
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
              module="ophthalmology"
              options={[
                { value: '', label: t('common.selectPatient') },
                ...(patients?.map((patient: any) => ({
                  value: patient.id,
                  label: `${patient.firstName} ${patient.lastName} - ${patient.medicalRecordNumber}`
                })) || [])
              ]}
            />

            {/* Assessment Date */}
            <Input
              type="datetime-local"
              label={t('ophthalmology.assessmentDate')}
              value={formData.assessmentDate}
              onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
              required
              module="ophthalmology"
            />

            {/* Total Score */}
            <Input
              type="text"
              label={t('ophthalmology.totalScore')}
              value={formData.totalScore}
              onChange={(e) => setFormData({ ...formData, totalScore: e.target.value })}
              required
              placeholder="0-100"
              module="ophthalmology"
            />

            {/* Severity */}
            <Select
              label={t('ophthalmology.severity')}
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'normal' | 'mild' | 'moderate' | 'severe' })}
              required
              module="ophthalmology"
              options={[
                { value: 'normal', label: t('ophthalmology.severityNormal') },
                { value: 'mild', label: t('ophthalmology.severityMild') },
                { value: 'moderate', label: t('ophthalmology.severityModerate') },
                { value: 'severe', label: t('ophthalmology.severitySevere') }
              ]}
            />

            {/* Symptom Score */}
            <Input
              type="text"
              label={t('ophthalmology.symptomScore')}
              value={formData.symptomScore}
              onChange={(e) => setFormData({ ...formData, symptomScore: e.target.value })}
              placeholder={t('ophthalmology.symptomScorePlaceholder')}
              module="ophthalmology"
            />

            {/* Vision Score */}
            <Input
              type="text"
              label={t('ophthalmology.visionScore')}
              value={formData.visionScore}
              onChange={(e) => setFormData({ ...formData, visionScore: e.target.value })}
              placeholder={t('ophthalmology.visionScorePlaceholder')}
              module="ophthalmology"
            />

            {/* Environmental Score */}
            <Input
              type="text"
              label={t('ophthalmology.environmentalScore')}
              value={formData.environmentalScore}
              onChange={(e) => setFormData({ ...formData, environmentalScore: e.target.value })}
              placeholder={t('ophthalmology.environmentalScorePlaceholder')}
              module="ophthalmology"
            />
          </FormGrid>

          {/* Notes */}
          <Textarea
            label={t('common.notes')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            placeholder={t('ophthalmology.notesPlaceholder')}
            module="ophthalmology"
          />

          {/* Actions */}
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/ophthalmology/osdi-scores')}
              module="ophthalmology"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
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
