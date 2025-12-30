/**
 * Ophthalmology Tonometry Form Page
 * Create/Edit tonometry (IOP measurement) records
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

interface TonometryFormData {
  patientId: string;
  eye: 'OD' | 'OS' | 'OU';
  measurementDate: string;
  method: 'goldman' | 'pneumatic' | 'rebound' | 'palpation';
  iopOd: string;
  iopOs: string;
  pachymetryOd: string;
  pachymetryOs: string;
  notes: string;
}

export default function OphthalmologyTonometryFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<TonometryFormData>({
    patientId: '',
    eye: 'OD',
    measurementDate: '',
    method: 'goldman',
    iopOd: '',
    iopOs: '',
    pachymetryOd: '',
    pachymetryOs: '',
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

  // Fetch existing tonometry record if editing
  const { data: tonometry } = useQuery({
    queryKey: ['ophthalmology-tonometry', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/tonometry/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (tonometry) {
      setFormData({
        patientId: tonometry.patientId || '',
        eye: tonometry.eye || 'OD',
        measurementDate: tonometry.measurementDate ? new Date(tonometry.measurementDate).toISOString().slice(0, 16) : '',
        method: tonometry.method || 'goldman',
        iopOd: tonometry.iopOd || '',
        iopOs: tonometry.iopOs || '',
        pachymetryOd: tonometry.pachymetryOd || '',
        pachymetryOs: tonometry.pachymetryOs || '',
        notes: tonometry.notes || '',
      });
    }
  }, [tonometry]);

  const mutation = useMutation({
    mutationFn: async (data: TonometryFormData) => {
      if (isEdit) {
        return api.put(`/ophthalmology/tonometry/${id}`, data);
      }
      return api.post('/ophthalmology/tonometry', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-tonometry'] });
      toast.success(isEdit ? t('ophthalmology.tonometryUpdated') : t('ophthalmology.tonometryCreated'));
      navigate('/ophthalmology/tonometry');
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
        title={isEdit ? t('ophthalmology.editTonometry') : t('ophthalmology.newTonometry')}
        subtitle={isEdit ? t('ophthalmology.editTonometrySubtitle') : t('ophthalmology.newTonometrySubtitle')}
        icon={Eye}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/tonometry')}
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
              onChange={(e) => setFormData({ ...formData, eye: e.target.value as 'OD' | 'OS' | 'OU' })}
              required
              module="ophthalmology"
              options={[
                { value: 'OD', label: `OD - ${t('ophthalmology.rightEye')}` },
                { value: 'OS', label: `OS - ${t('ophthalmology.leftEye')}` },
                { value: 'OU', label: 'OU - Bilatéral' }
              ]}
            />

            {/* Measurement Date */}
            <Input
              type="datetime-local"
              label="Date et heure de mesure"
              value={formData.measurementDate}
              onChange={(e) => setFormData({ ...formData, measurementDate: e.target.value })}
              required
              module="ophthalmology"
            />

            {/* Method */}
            <Select
              label="Méthode de mesure"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value as 'goldman' | 'pneumatic' | 'rebound' | 'palpation' })}
              required
              module="ophthalmology"
              options={[
                { value: 'goldman', label: 'Goldman (Aplanation)' },
                { value: 'pneumatic', label: 'Pneumatique' },
                { value: 'rebound', label: 'Rebond (iCare)' },
                { value: 'palpation', label: 'Palpation digitale' }
              ]}
            />

            {/* IOP OD */}
            <Input
              type="text"
              label="PIO OD (mmHg)"
              value={formData.iopOd}
              onChange={(e) => setFormData({ ...formData, iopOd: e.target.value })}
              placeholder="ex: 15"
              module="ophthalmology"
            />

            {/* IOP OS */}
            <Input
              type="text"
              label="PIO OS (mmHg)"
              value={formData.iopOs}
              onChange={(e) => setFormData({ ...formData, iopOs: e.target.value })}
              placeholder="ex: 14"
              module="ophthalmology"
            />

            {/* Pachymetry OD */}
            <Input
              type="text"
              label="Pachymétrie OD (µm)"
              value={formData.pachymetryOd}
              onChange={(e) => setFormData({ ...formData, pachymetryOd: e.target.value })}
              placeholder="ex: 540"
              module="ophthalmology"
            />

            {/* Pachymetry OS */}
            <Input
              type="text"
              label="Pachymétrie OS (µm)"
              value={formData.pachymetryOs}
              onChange={(e) => setFormData({ ...formData, pachymetryOs: e.target.value })}
              placeholder="ex: 535"
              module="ophthalmology"
            />

            {/* Notes */}
            <div className="md:col-span-2">
              <Textarea
                label={t('common.notes')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Notes additionnelles sur la mesure..."
                module="ophthalmology"
              />
            </div>
          </FormGrid>

          {/* Actions */}
          <FormActions>
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/ophthalmology/tonometry')}
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
