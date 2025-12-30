/**
 * Ophthalmology Biometry Form Page
 * Create/Edit biometry measurements
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, Save } from 'lucide-react';
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

interface BiometryFormData {
  patientId: string;
  eye: 'OD' | 'OS';
  measurementDate: string;
  axialLength: string;
  anteriorChamberDepth: string;
  lensThickness: string;
  kFlatAxis: string;
  kFlatDiopter: string;
  kSteepAxis: string;
  kSteepDiopter: string;
  targetRefraction: string;
  recommendedIolPower: string;
  notes: string;
}

export default function OphthalmologyBiometryFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<BiometryFormData>({
    patientId: '',
    eye: 'OD',
    measurementDate: '',
    axialLength: '',
    anteriorChamberDepth: '',
    lensThickness: '',
    kFlatAxis: '',
    kFlatDiopter: '',
    kSteepAxis: '',
    kSteepDiopter: '',
    targetRefraction: '',
    recommendedIolPower: '',
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

  // Fetch existing biometry if editing
  const { data: biometry } = useQuery({
    queryKey: ['ophthalmology-biometry', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/biometry/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (biometry) {
      setFormData({
        patientId: biometry.patientId || '',
        eye: biometry.eye || 'OD',
        measurementDate: biometry.measurementDate ? new Date(biometry.measurementDate).toISOString().slice(0, 16) : '',
        axialLength: biometry.axialLength?.toString() || '',
        anteriorChamberDepth: biometry.anteriorChamberDepth?.toString() || '',
        lensThickness: biometry.lensThickness?.toString() || '',
        kFlatAxis: biometry.kFlatAxis?.toString() || '',
        kFlatDiopter: biometry.kFlatDiopter?.toString() || '',
        kSteepAxis: biometry.kSteepAxis?.toString() || '',
        kSteepDiopter: biometry.kSteepDiopter?.toString() || '',
        targetRefraction: biometry.targetRefraction?.toString() || '',
        recommendedIolPower: biometry.recommendedIolPower?.toString() || '',
        notes: biometry.notes || '',
      });
    }
  }, [biometry]);

  const mutation = useMutation({
    mutationFn: async (data: BiometryFormData) => {
      const payload = {
        ...data,
        axialLength: data.axialLength ? parseFloat(data.axialLength) : undefined,
        anteriorChamberDepth: data.anteriorChamberDepth ? parseFloat(data.anteriorChamberDepth) : undefined,
        lensThickness: data.lensThickness ? parseFloat(data.lensThickness) : undefined,
        kFlatAxis: data.kFlatAxis ? parseFloat(data.kFlatAxis) : undefined,
        kFlatDiopter: data.kFlatDiopter ? parseFloat(data.kFlatDiopter) : undefined,
        kSteepAxis: data.kSteepAxis ? parseFloat(data.kSteepAxis) : undefined,
        kSteepDiopter: data.kSteepDiopter ? parseFloat(data.kSteepDiopter) : undefined,
        targetRefraction: data.targetRefraction ? parseFloat(data.targetRefraction) : undefined,
        recommendedIolPower: data.recommendedIolPower ? parseFloat(data.recommendedIolPower) : undefined,
      };
      if (isEdit) {
        return api.put(`/ophthalmology/biometry/${id}`, payload);
      }
      return api.post('/ophthalmology/biometry', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-biometries'] });
      toast.success(isEdit ? t('ophthalmology.biometryUpdated') : t('ophthalmology.biometryCreated'));
      navigate('/ophthalmology/biometries');
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
        title={isEdit ? t('ophthalmology.editBiometry') : t('ophthalmology.newBiometry')}
        subtitle={isEdit ? t('ophthalmology.editBiometrySubtitle') : t('ophthalmology.newBiometrySubtitle')}
        icon={Calculator}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/biometries')}
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

            {/* Measurement Date */}
            <Input
              label="Date et heure"
              type="datetime-local"
              value={formData.measurementDate}
              onChange={(e) => setFormData({ ...formData, measurementDate: e.target.value })}
              required
              module="ophthalmology"
            />

            {/* Axial Length */}
            <Input
              label="Longueur axiale (mm)"
              type="number"
              step="0.01"
              value={formData.axialLength}
              onChange={(e) => setFormData({ ...formData, axialLength: e.target.value })}
              placeholder="Ex: 23.45"
              module="ophthalmology"
            />

            {/* Anterior Chamber Depth */}
            <Input
              label="Profondeur chambre antérieure (mm)"
              type="number"
              step="0.01"
              value={formData.anteriorChamberDepth}
              onChange={(e) => setFormData({ ...formData, anteriorChamberDepth: e.target.value })}
              placeholder="Ex: 3.15"
              module="ophthalmology"
            />

            {/* Lens Thickness */}
            <Input
              label="Épaisseur du cristallin (mm)"
              type="number"
              step="0.01"
              value={formData.lensThickness}
              onChange={(e) => setFormData({ ...formData, lensThickness: e.target.value })}
              placeholder="Ex: 4.52"
              module="ophthalmology"
            />

            {/* K Flat Axis */}
            <Input
              label="K plat - Axe (°)"
              type="number"
              step="0.1"
              value={formData.kFlatAxis}
              onChange={(e) => setFormData({ ...formData, kFlatAxis: e.target.value })}
              placeholder="Ex: 90"
              module="ophthalmology"
            />

            {/* K Flat Diopter */}
            <Input
              label="K plat - Dioptrie (D)"
              type="number"
              step="0.01"
              value={formData.kFlatDiopter}
              onChange={(e) => setFormData({ ...formData, kFlatDiopter: e.target.value })}
              placeholder="Ex: 42.25"
              module="ophthalmology"
            />

            {/* K Steep Axis */}
            <Input
              label="K cambré - Axe (°)"
              type="number"
              step="0.1"
              value={formData.kSteepAxis}
              onChange={(e) => setFormData({ ...formData, kSteepAxis: e.target.value })}
              placeholder="Ex: 180"
              module="ophthalmology"
            />

            {/* K Steep Diopter */}
            <Input
              label="K cambré - Dioptrie (D)"
              type="number"
              step="0.01"
              value={formData.kSteepDiopter}
              onChange={(e) => setFormData({ ...formData, kSteepDiopter: e.target.value })}
              placeholder="Ex: 43.75"
              module="ophthalmology"
            />

            {/* Target Refraction */}
            <Input
              label="Réfraction cible (D)"
              type="number"
              step="0.25"
              value={formData.targetRefraction}
              onChange={(e) => setFormData({ ...formData, targetRefraction: e.target.value })}
              placeholder="Ex: -0.50"
              module="ophthalmology"
            />

            {/* Recommended IOL Power */}
            <Input
              label="Puissance IOL recommandée (D)"
              type="number"
              step="0.5"
              value={formData.recommendedIolPower}
              onChange={(e) => setFormData({ ...formData, recommendedIolPower: e.target.value })}
              placeholder="Ex: 22.0"
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
              placeholder="Notes additionnelles..."
              module="ophthalmology"
            />
          </div>

          {/* Actions */}
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/ophthalmology/biometries')}
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
