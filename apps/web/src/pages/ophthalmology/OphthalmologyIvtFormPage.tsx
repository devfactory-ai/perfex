/**
 * Ophthalmology IVT Form Page
 * Create/Edit intravitreal injections
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Syringe, Save } from 'lucide-react';
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

interface IvtFormData {
  patientId: string;
  eye: 'OD' | 'OS';
  injectionDate: string;
  medication: 'anti_vegf_lucentis' | 'anti_vegf_eylea' | 'anti_vegf_avastin' | 'steroid';
  dose: string;
  lot: string;
  performedBy: string;
  complications: string;
  notes: string;
}

export default function OphthalmologyIvtFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<IvtFormData>({
    patientId: '',
    eye: 'OD',
    injectionDate: '',
    medication: 'anti_vegf_lucentis',
    dose: '',
    lot: '',
    performedBy: '',
    complications: '',
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

  // Fetch existing IVT if editing
  const { data: ivt } = useQuery({
    queryKey: ['ophthalmology-ivt', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/ivt-injections/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (ivt) {
      setFormData({
        patientId: ivt.patientId || '',
        eye: ivt.eye || 'OD',
        injectionDate: ivt.injectionDate ? new Date(ivt.injectionDate).toISOString().slice(0, 16) : '',
        medication: ivt.medication || 'anti_vegf_lucentis',
        dose: ivt.dose || '',
        lot: ivt.lotNumber || ivt.lot || '',
        performedBy: ivt.performedBy || '',
        complications: ivt.complications || '',
        notes: ivt.notes || '',
      });
    }
  }, [ivt]);

  const mutation = useMutation({
    mutationFn: async (data: IvtFormData) => {
      const payload = {
        patientId: data.patientId,
        eye: data.eye,
        injectionDate: data.injectionDate,
        medication: data.medication,
        dose: data.dose,
        lotNumber: data.lot,
        performedBy: data.performedBy || undefined,
        complications: data.complications || undefined,
        notes: data.notes || undefined,
      };
      if (isEdit) {
        return api.put(`/ophthalmology/ivt-injections/${id}`, payload);
      }
      return api.post('/ophthalmology/ivt-injections', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-ivts'] });
      toast.success(isEdit ? t('ophthalmology.ivtUpdated') : t('ophthalmology.ivtCreated'));
      navigate('/ophthalmology/ivts');
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
        title={isEdit ? t('ophthalmology.editIvt') : t('ophthalmology.newIvt')}
        subtitle={isEdit ? t('ophthalmology.editIvtSubtitle') : t('ophthalmology.newIvtSubtitle')}
        icon={Syringe}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/ivts')}
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

            {/* Eye */}
            <Select
              label="Œil"
              value={formData.eye}
              onChange={(e) => setFormData({ ...formData, eye: e.target.value as 'OD' | 'OS' })}
              required
              module="ophthalmology"
              options={[
                { value: 'OD', label: `OD - ${t('ophthalmology.rightEye')}` },
                { value: 'OS', label: `OS - ${t('ophthalmology.leftEye')}` },
              ]}
            />

            {/* Injection Date */}
            <Input
              label="Date et heure"
              type="datetime-local"
              value={formData.injectionDate}
              onChange={(e) => setFormData({ ...formData, injectionDate: e.target.value })}
              required
              module="ophthalmology"
            />

            {/* Medication */}
            <Select
              label="Médicament"
              value={formData.medication}
              onChange={(e) => setFormData({ ...formData, medication: e.target.value as any })}
              required
              module="ophthalmology"
              options={[
                { value: 'anti_vegf_lucentis', label: 'Anti-VEGF - Lucentis (Ranibizumab)' },
                { value: 'anti_vegf_eylea', label: 'Anti-VEGF - Eylea (Aflibercept)' },
                { value: 'anti_vegf_avastin', label: 'Anti-VEGF - Avastin (Bevacizumab)' },
                { value: 'steroid', label: 'Stéroïde' },
              ]}
            />

            {/* Dose */}
            <Input
              label="Dose"
              type="text"
              value={formData.dose}
              onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
              placeholder="Ex: 0.5 mg"
              module="ophthalmology"
            />

            {/* Lot */}
            <Input
              label="Numéro de lot"
              type="text"
              value={formData.lot}
              onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
              placeholder="Numéro de lot du médicament"
              module="ophthalmology"
            />

            {/* Performed By */}
            <Input
              label="Réalisé par"
              type="text"
              value={formData.performedBy}
              onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
              placeholder="Dr. ..."
              module="ophthalmology"
            />
          </FormGrid>

          {/* Complications - Full width */}
          <div className="mt-4">
            <Textarea
              label="Complications"
              value={formData.complications}
              onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
              rows={3}
              placeholder="Complications éventuelles..."
              module="ophthalmology"
            />
          </div>

          {/* Notes - Full width */}
          <div className="mt-4">
            <Textarea
              label={t('common.notes')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notes additionnelles..."
              module="ophthalmology"
            />
          </div>

          {/* Actions */}
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/ophthalmology/ivts')}
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
