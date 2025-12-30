/**
 * Ophthalmology Refraction Form Page
 * Create/Edit refraction (visual acuity) exams
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

interface RefractionFormData {
  patientId: string;
  examinationDate: string;
  refractionType: string;
  odUcvaDistance: string;
  osUcvaDistance: string;
  odSphere: string;
  odCylinder: string;
  odAxis: string;
  osSphere: string;
  osCylinder: string;
  osAxis: string;
  odBcvaDistance: string;
  osBcvaDistance: string;
  odAdd: string;
  osAdd: string;
  notes: string;
}

export default function OphthalmologyRefractionFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<RefractionFormData>({
    patientId: '',
    examinationDate: '',
    refractionType: 'manifest',
    odUcvaDistance: '',
    osUcvaDistance: '',
    odSphere: '',
    odCylinder: '',
    odAxis: '',
    osSphere: '',
    osCylinder: '',
    osAxis: '',
    odBcvaDistance: '',
    osBcvaDistance: '',
    odAdd: '',
    osAdd: '',
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

  // Fetch existing refraction if editing
  const { data: refraction } = useQuery({
    queryKey: ['ophthalmology-refraction', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/refraction/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (refraction) {
      setFormData({
        patientId: refraction.patientId || '',
        examinationDate: refraction.examinationDate ? new Date(refraction.examinationDate).toISOString().slice(0, 16) : '',
        refractionType: refraction.refractionType || 'manifest',
        odUcvaDistance: refraction.odUcvaDistance || '',
        osUcvaDistance: refraction.osUcvaDistance || '',
        odSphere: refraction.odSphere?.toString() || '',
        odCylinder: refraction.odCylinder?.toString() || '',
        odAxis: refraction.odAxis?.toString() || '',
        osSphere: refraction.osSphere?.toString() || '',
        osCylinder: refraction.osCylinder?.toString() || '',
        osAxis: refraction.osAxis?.toString() || '',
        odBcvaDistance: refraction.odBcvaDistance || '',
        osBcvaDistance: refraction.osBcvaDistance || '',
        odAdd: refraction.odAdd?.toString() || '',
        osAdd: refraction.osAdd?.toString() || '',
        notes: refraction.notes || '',
      });
    }
  }, [refraction]);

  const mutation = useMutation({
    mutationFn: async (data: RefractionFormData) => {
      const payload = {
        patientId: data.patientId,
        examinationDate: data.examinationDate,
        refractionType: data.refractionType,
        odUcvaDistance: data.odUcvaDistance || undefined,
        osUcvaDistance: data.osUcvaDistance || undefined,
        odSphere: data.odSphere ? parseFloat(data.odSphere) : undefined,
        odCylinder: data.odCylinder ? parseFloat(data.odCylinder) : undefined,
        odAxis: data.odAxis ? parseInt(data.odAxis) : undefined,
        osSphere: data.osSphere ? parseFloat(data.osSphere) : undefined,
        osCylinder: data.osCylinder ? parseFloat(data.osCylinder) : undefined,
        osAxis: data.osAxis ? parseInt(data.osAxis) : undefined,
        odBcvaDistance: data.odBcvaDistance || undefined,
        osBcvaDistance: data.osBcvaDistance || undefined,
        odAdd: data.odAdd ? parseFloat(data.odAdd) : undefined,
        osAdd: data.osAdd ? parseFloat(data.osAdd) : undefined,
        notes: data.notes || undefined,
      };
      if (isEdit) {
        return api.put(`/ophthalmology/refraction/${id}`, payload);
      }
      return api.post('/ophthalmology/refraction', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-refraction'] });
      toast.success(isEdit ? t('ophthalmology.refractionUpdated') : t('ophthalmology.refractionCreated'));
      navigate('/ophthalmology/refraction');
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
        title={isEdit ? t('ophthalmology.editRefraction') : t('ophthalmology.newRefraction')}
        subtitle={isEdit ? t('ophthalmology.editRefractionSubtitle') : t('ophthalmology.newRefractionSubtitle')}
        icon={Eye}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/refraction')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <FormSection title="Informations générales" module="ophthalmology">
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

            {/* Exam Date */}
            <Input
              type="datetime-local"
              label="Date de l'examen"
              value={formData.examinationDate}
              onChange={(e) => setFormData({ ...formData, examinationDate: e.target.value })}
              required
              module="ophthalmology"
            />
          </FormGrid>

          {/* Refraction Type */}
          <Select
            label="Type de réfraction"
            value={formData.refractionType}
            onChange={(e) => setFormData({ ...formData, refractionType: e.target.value })}
            module="ophthalmology"
            options={[
              { value: 'manifest', label: 'Manifeste' },
              { value: 'cycloplegic', label: 'Cycloplégique' },
              { value: 'autorefractor', label: 'Autoréfractomètre' },
              { value: 'retinoscopy', label: 'Skiascopie' },
              { value: 'trial_frame', label: 'Monture d\'essai' }
            ]}
          />
        </FormSection>

        <FormSection title="Acuité visuelle non corrigée" module="ophthalmology">
          <FormGrid columns={2}>
            <Input
              type="text"
              label={`OD (${t('ophthalmology.rightEye')})`}
              value={formData.odUcvaDistance}
              onChange={(e) => setFormData({ ...formData, odUcvaDistance: e.target.value })}
              placeholder="20/20 ou 10/10"
              module="ophthalmology"
            />
            <Input
              type="text"
              label={`OS (${t('ophthalmology.leftEye')})`}
              value={formData.osUcvaDistance}
              onChange={(e) => setFormData({ ...formData, osUcvaDistance: e.target.value })}
              placeholder="20/20 ou 10/10"
              module="ophthalmology"
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Réfraction OD (Œil droit)" module="ophthalmology">
          <FormGrid columns={3}>
            <Input
              type="number"
              step="0.25"
              label="Sphère (dioptries)"
              value={formData.odSphere}
              onChange={(e) => setFormData({ ...formData, odSphere: e.target.value })}
              placeholder="+2.00 ou -1.50"
              module="ophthalmology"
            />
            <Input
              type="number"
              step="0.25"
              label="Cylindre (dioptries)"
              value={formData.odCylinder}
              onChange={(e) => setFormData({ ...formData, odCylinder: e.target.value })}
              placeholder="-0.75"
              module="ophthalmology"
            />
            <Input
              type="number"
              min={0}
              max={180}
              label="Axe (degrés)"
              value={formData.odAxis}
              onChange={(e) => setFormData({ ...formData, odAxis: e.target.value })}
              placeholder="90"
              module="ophthalmology"
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Réfraction OS (Œil gauche)" module="ophthalmology">
          <FormGrid columns={3}>
            <Input
              type="number"
              step="0.25"
              label="Sphère (dioptries)"
              value={formData.osSphere}
              onChange={(e) => setFormData({ ...formData, osSphere: e.target.value })}
              placeholder="+2.00 ou -1.50"
              module="ophthalmology"
            />
            <Input
              type="number"
              step="0.25"
              label="Cylindre (dioptries)"
              value={formData.osCylinder}
              onChange={(e) => setFormData({ ...formData, osCylinder: e.target.value })}
              placeholder="-0.75"
              module="ophthalmology"
            />
            <Input
              type="number"
              min={0}
              max={180}
              label="Axe (degrés)"
              value={formData.osAxis}
              onChange={(e) => setFormData({ ...formData, osAxis: e.target.value })}
              placeholder="90"
              module="ophthalmology"
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Acuité visuelle corrigée" module="ophthalmology">
          <FormGrid columns={2}>
            <Input
              type="text"
              label={`OD (${t('ophthalmology.rightEye')})`}
              value={formData.odBcvaDistance}
              onChange={(e) => setFormData({ ...formData, odBcvaDistance: e.target.value })}
              placeholder="20/20 ou 10/10"
              module="ophthalmology"
            />
            <Input
              type="text"
              label={`OS (${t('ophthalmology.leftEye')})`}
              value={formData.osBcvaDistance}
              onChange={(e) => setFormData({ ...formData, osBcvaDistance: e.target.value })}
              placeholder="20/20 ou 10/10"
              module="ophthalmology"
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Addition (presbytie)" module="ophthalmology">
          <FormGrid columns={2}>
            <Input
              type="number"
              step="0.25"
              label="Add OD"
              value={formData.odAdd}
              onChange={(e) => setFormData({ ...formData, odAdd: e.target.value })}
              placeholder="+1.50"
              module="ophthalmology"
            />
            <Input
              type="number"
              step="0.25"
              label="Add OS"
              value={formData.osAdd}
              onChange={(e) => setFormData({ ...formData, osAdd: e.target.value })}
              placeholder="+1.50"
              module="ophthalmology"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('common.notes')} module="ophthalmology">
          <Textarea
            label={t('common.notes')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            placeholder="Notes additionnelles..."
            module="ophthalmology"
          />

          {/* Actions */}
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/ophthalmology/refraction')}
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
