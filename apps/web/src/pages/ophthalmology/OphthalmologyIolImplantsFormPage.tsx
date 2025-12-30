/**
 * Ophthalmology IOL Implants Form Page
 * Create/Edit intraocular lens implants
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

interface IolImplantFormData {
  patientId: string;
  eye: 'OD' | 'OS';
  implantDate: string;
  iolType: 'monofocal' | 'multifocal' | 'toric' | 'edof' | 'phakic';
  manufacturer: string;
  model: string;
  power: string;
  targetRefraction: string;
  surgeon: string;
  lot: string;
  notes: string;
}

export default function OphthalmologyIolImplantsFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<IolImplantFormData>({
    patientId: '',
    eye: 'OD',
    implantDate: '',
    iolType: 'monofocal',
    manufacturer: '',
    model: '',
    power: '',
    targetRefraction: '',
    surgeon: '',
    lot: '',
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

  // Fetch existing IOL implant if editing
  const { data: iolImplant } = useQuery({
    queryKey: ['ophthalmology-iol-implant', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/iol-implants/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (iolImplant) {
      setFormData({
        patientId: iolImplant.patientId || '',
        eye: iolImplant.eye || 'OD',
        implantDate: iolImplant.implantDate ? new Date(iolImplant.implantDate).toISOString().slice(0, 16) : '',
        iolType: iolImplant.iolType || 'monofocal',
        manufacturer: iolImplant.manufacturer || '',
        model: iolImplant.model || '',
        power: iolImplant.power || '',
        targetRefraction: iolImplant.targetRefraction || '',
        surgeon: iolImplant.surgeon || '',
        lot: iolImplant.lot || '',
        notes: iolImplant.notes || '',
      });
    }
  }, [iolImplant]);

  const mutation = useMutation({
    mutationFn: async (data: IolImplantFormData) => {
      if (isEdit) {
        return api.put(`/ophthalmology/iol-implants/${id}`, data);
      }
      return api.post('/ophthalmology/iol-implants', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-iol-implants'] });
      toast.success(isEdit ? t('ophthalmology.iolImplantUpdated') : t('ophthalmology.iolImplantCreated'));
      navigate('/ophthalmology/iol-implants');
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
        title={isEdit ? t('ophthalmology.editIolImplant') : t('ophthalmology.newIolImplant')}
        subtitle={isEdit ? t('ophthalmology.editIolImplantDetails') : t('ophthalmology.recordNewIolImplant')}
        icon={Eye}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/iol-implants')}
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
              label={t('ophthalmology.eye')}
              value={formData.eye}
              onChange={(e) => setFormData({ ...formData, eye: e.target.value as 'OD' | 'OS' })}
              required
              module="ophthalmology"
              options={[
                { value: 'OD', label: `OD - ${t('ophthalmology.rightEye')}` },
                { value: 'OS', label: `OS - ${t('ophthalmology.leftEye')}` },
              ]}
            />

            {/* Implant Date */}
            <Input
              label={t('ophthalmology.implantDate')}
              type="datetime-local"
              value={formData.implantDate}
              onChange={(e) => setFormData({ ...formData, implantDate: e.target.value })}
              required
              module="ophthalmology"
            />

            {/* IOL Type */}
            <Select
              label={t('ophthalmology.iolType')}
              value={formData.iolType}
              onChange={(e) => setFormData({ ...formData, iolType: e.target.value as IolImplantFormData['iolType'] })}
              required
              module="ophthalmology"
              options={[
                { value: 'monofocal', label: t('ophthalmology.monofocal') },
                { value: 'multifocal', label: t('ophthalmology.multifocal') },
                { value: 'toric', label: t('ophthalmology.toric') },
                { value: 'edof', label: t('ophthalmology.edof') },
                { value: 'phakic', label: t('ophthalmology.phakic') },
              ]}
            />

            {/* Manufacturer */}
            <Input
              label={t('ophthalmology.manufacturer')}
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder={t('ophthalmology.manufacturerPlaceholder')}
              required
              module="ophthalmology"
            />

            {/* Model */}
            <Input
              label={t('ophthalmology.model')}
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder={t('ophthalmology.modelPlaceholder')}
              required
              module="ophthalmology"
            />

            {/* Power */}
            <Input
              label={t('ophthalmology.powerDiopters')}
              type="text"
              value={formData.power}
              onChange={(e) => setFormData({ ...formData, power: e.target.value })}
              placeholder="+22.0"
              required
              module="ophthalmology"
            />

            {/* Target Refraction */}
            <Input
              label={t('ophthalmology.targetRefraction')}
              type="text"
              value={formData.targetRefraction}
              onChange={(e) => setFormData({ ...formData, targetRefraction: e.target.value })}
              placeholder={t('ophthalmology.targetRefractionPlaceholder')}
              module="ophthalmology"
            />

            {/* Surgeon */}
            <Input
              label={t('ophthalmology.surgeon')}
              type="text"
              value={formData.surgeon}
              onChange={(e) => setFormData({ ...formData, surgeon: e.target.value })}
              placeholder={t('ophthalmology.surgeonPlaceholder')}
              module="ophthalmology"
            />

            {/* Lot Number */}
            <Input
              label={t('ophthalmology.lotNumber')}
              type="text"
              value={formData.lot}
              onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
              placeholder="LOT123456"
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
              onClick={() => navigate('/ophthalmology/iol-implants')}
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
