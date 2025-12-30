/**
 * Ophthalmology Surgery Form Page
 * Create/Edit ophthalmic surgeries
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scissors, Save } from 'lucide-react';
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

interface SurgeryFormData {
  patientId: string;
  procedureType: string;
  eye: 'OD' | 'OS' | 'OU';
  scheduledAt: string;
  surgeon: string;
  anesthesiaType: string;
  operatingRoom: string;
  notes: string;
}

export default function OphthalmologySurgeryFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<SurgeryFormData>({
    patientId: '',
    procedureType: '',
    eye: 'OD',
    scheduledAt: '',
    surgeon: '',
    anesthesiaType: 'local',
    operatingRoom: '',
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

  // Fetch existing surgery if editing
  const { data: surgery } = useQuery({
    queryKey: ['ophthalmology-surgery', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/surgeries/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (surgery) {
      setFormData({
        patientId: surgery.patientId || '',
        procedureType: surgery.procedureType || surgery.surgeryType || '',
        eye: surgery.eye || 'OD',
        scheduledAt: surgery.surgeryDate ? new Date(surgery.surgeryDate).toISOString().slice(0, 16) : '',
        surgeon: surgery.surgeon || surgery.leadSurgeon || '',
        anesthesiaType: surgery.anesthesiaType || 'local',
        operatingRoom: surgery.operatingRoom || surgery.location || '',
        notes: surgery.notes || '',
      });
    }
  }, [surgery]);

  const mutation = useMutation({
    mutationFn: async (data: SurgeryFormData) => {
      const payload = {
        patientId: data.patientId,
        surgeryType: data.procedureType,
        eye: data.eye,
        surgeryDate: data.scheduledAt,
        leadSurgeon: data.surgeon || undefined,
        anesthesiaType: data.anesthesiaType || undefined,
        location: data.operatingRoom || undefined,
        notes: data.notes || undefined,
      };
      if (isEdit) {
        return api.put(`/ophthalmology/surgeries/${id}`, payload);
      }
      return api.post('/ophthalmology/surgeries', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-surgeries'] });
      toast.success(isEdit ? t('ophthalmology.surgeryUpdated') : t('ophthalmology.surgeryCreated'));
      navigate('/ophthalmology/surgeries');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('common.saveError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const procedureTypes = [
    'Cataracte',
    'Glaucome',
    'Vitrectomie',
    'Décollement de rétine',
    'Greffe de cornée',
    'Chirurgie réfractive',
    'Strabisme',
    'Ptosis',
    'Autre',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isEdit ? t('ophthalmology.editSurgery') : t('ophthalmology.newSurgery')}
        subtitle={isEdit ? t('ophthalmology.editSurgerySubtitle') : t('ophthalmology.newSurgerySubtitle')}
        icon={Scissors}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/surgeries')}
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

            {/* Procedure Type */}
            <Select
              label="Type de procédure"
              value={formData.procedureType}
              onChange={(e) => setFormData({ ...formData, procedureType: e.target.value })}
              required
              module="ophthalmology"
              placeholder="Sélectionner une procédure"
              options={procedureTypes.map((type) => ({ value: type, label: type }))}
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

            {/* Scheduled Date */}
            <Input
              type="datetime-local"
              label="Date et heure"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              required
              module="ophthalmology"
            />

            {/* Surgeon */}
            <Input
              type="text"
              label="Chirurgien"
              value={formData.surgeon}
              onChange={(e) => setFormData({ ...formData, surgeon: e.target.value })}
              placeholder="Dr. ..."
              module="ophthalmology"
            />

            {/* Anesthesia Type */}
            <Select
              label="Type d'anesthésie"
              value={formData.anesthesiaType}
              onChange={(e) => setFormData({ ...formData, anesthesiaType: e.target.value })}
              module="ophthalmology"
              options={[
                { value: 'local', label: 'Locale' },
                { value: 'topical', label: 'Topique' },
                { value: 'regional', label: 'Régionale' },
                { value: 'general', label: 'Générale' }
              ]}
            />

            {/* Operating Room */}
            <Input
              type="text"
              label="Salle d'opération"
              value={formData.operatingRoom}
              onChange={(e) => setFormData({ ...formData, operatingRoom: e.target.value })}
              placeholder="Salle 1"
              module="ophthalmology"
            />

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
              onClick={() => navigate('/ophthalmology/surgeries')}
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
