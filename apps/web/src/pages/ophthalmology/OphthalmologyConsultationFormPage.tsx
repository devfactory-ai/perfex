/**
 * Ophthalmology Consultation Form Page
 * Create/Edit ophthalmic consultations
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

interface ConsultationFormData {
  patientId: string;
  consultationType: 'first_visit' | 'follow_up' | 'emergency';
  scheduledAt: string;
  chiefComplaint: string;
  visualAcuityOd: string;
  visualAcuityOs: string;
  diagnosis: string;
  treatment: string;
  nextVisit: string;
  notes: string;
}

export default function OphthalmologyConsultationFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<ConsultationFormData>({
    patientId: '',
    consultationType: 'first_visit',
    scheduledAt: '',
    chiefComplaint: '',
    visualAcuityOd: '',
    visualAcuityOs: '',
    diagnosis: '',
    treatment: '',
    nextVisit: '',
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

  // Fetch existing consultation if editing
  const { data: consultation } = useQuery({
    queryKey: ['ophthalmology-consultation', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/consultations/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (consultation) {
      setFormData({
        patientId: consultation.patientId || '',
        consultationType: consultation.consultationType || 'first_visit',
        scheduledAt: consultation.consultationDate ? new Date(consultation.consultationDate).toISOString().slice(0, 16) : '',
        chiefComplaint: consultation.chiefComplaint || '',
        visualAcuityOd: consultation.visualAcuityOd || '',
        visualAcuityOs: consultation.visualAcuityOs || '',
        diagnosis: consultation.diagnosis || '',
        treatment: consultation.treatmentPlan || consultation.treatment || '',
        nextVisit: consultation.followUpDate ? new Date(consultation.followUpDate).toISOString().slice(0, 10) : '',
        notes: consultation.notes || '',
      });
    }
  }, [consultation]);

  const mutation = useMutation({
    mutationFn: async (data: ConsultationFormData) => {
      const payload = {
        patientId: data.patientId,
        consultationType: data.consultationType,
        consultationDate: data.scheduledAt,
        chiefComplaint: data.chiefComplaint || undefined,
        visualAcuityOd: data.visualAcuityOd || undefined,
        visualAcuityOs: data.visualAcuityOs || undefined,
        diagnosis: data.diagnosis || undefined,
        treatmentPlan: data.treatment || undefined,
        followUpDate: data.nextVisit || undefined,
        notes: data.notes || undefined,
      };
      if (isEdit) {
        return api.put(`/ophthalmology/consultations/${id}`, payload);
      }
      return api.post('/ophthalmology/consultations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-consultations'] });
      toast.success(isEdit ? t('ophthalmology.consultationUpdated') : t('ophthalmology.consultationCreated'));
      navigate('/ophthalmology/consultations');
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
        title={isEdit ? t('ophthalmology.editConsultation') : t('ophthalmology.newConsultation')}
        subtitle={isEdit ? t('ophthalmology.editConsultationDetails') : t('ophthalmology.createNewConsultation')}
        icon={Eye}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/consultations')}
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
              options={
                patients?.map((patient: any) => ({
                  value: patient.id,
                  label: `${patient.firstName} ${patient.lastName} - ${patient.medicalRecordNumber}`,
                })) || []
              }
            />

            {/* Consultation Type */}
            <Select
              label={t('ophthalmology.consultationType')}
              value={formData.consultationType}
              onChange={(e) => setFormData({ ...formData, consultationType: e.target.value as 'first_visit' | 'follow_up' | 'emergency' })}
              required
              module="ophthalmology"
              options={[
                { value: 'first_visit', label: t('ophthalmology.firstVisit') },
                { value: 'follow_up', label: t('ophthalmology.followUp') },
                { value: 'emergency', label: t('ophthalmology.emergency') },
              ]}
            />

            {/* Scheduled Date */}
            <Input
              label={t('ophthalmology.dateAndTime')}
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              required
              module="ophthalmology"
            />

            {/* Chief Complaint */}
            <Input
              label={t('ophthalmology.chiefComplaint')}
              type="text"
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              placeholder={t('ophthalmology.chiefComplaintPlaceholder')}
              module="ophthalmology"
            />

            {/* Visual Acuity OD */}
            <Input
              label={t('ophthalmology.visualAcuityOd')}
              type="text"
              value={formData.visualAcuityOd}
              onChange={(e) => setFormData({ ...formData, visualAcuityOd: e.target.value })}
              placeholder={t('ophthalmology.visualAcuityPlaceholder')}
              module="ophthalmology"
            />

            {/* Visual Acuity OS */}
            <Input
              label={t('ophthalmology.visualAcuityOs')}
              type="text"
              value={formData.visualAcuityOs}
              onChange={(e) => setFormData({ ...formData, visualAcuityOs: e.target.value })}
              placeholder={t('ophthalmology.visualAcuityPlaceholder')}
              module="ophthalmology"
            />

            {/* Diagnosis */}
            <Input
              label={t('ophthalmology.diagnosis')}
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder={t('ophthalmology.diagnosisPlaceholder')}
              module="ophthalmology"
            />

            {/* Treatment */}
            <Input
              label={t('ophthalmology.treatment')}
              type="text"
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              placeholder={t('ophthalmology.treatmentPlaceholder')}
              module="ophthalmology"
            />

            {/* Next Visit */}
            <Input
              label={t('ophthalmology.nextVisit')}
              type="date"
              value={formData.nextVisit}
              onChange={(e) => setFormData({ ...formData, nextVisit: e.target.value })}
              module="ophthalmology"
            />
          </FormGrid>

          {/* Notes - Full width */}
          <div className="mt-4">
            <Textarea
              label={t('common.notes')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder={t('ophthalmology.notesPlaceholder')}
              module="ophthalmology"
            />
          </div>

          {/* Actions */}
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/ophthalmology/consultations')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              module="ophthalmology"
              icon={Save}
              disabled={mutation.isPending}
              loading={mutation.isPending}
            >
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
