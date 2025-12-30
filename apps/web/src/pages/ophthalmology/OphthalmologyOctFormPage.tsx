/**
 * Ophthalmology OCT Form Page
 * Create/Edit OCT scans
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Scan, Save } from 'lucide-react';
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

interface OctFormData {
  patientId: string;
  eye: 'OD' | 'OS' | 'OU';
  scanDate: string;
  scanType: 'macular' | 'optic_nerve' | 'anterior_segment';
  rnflThickness: string;
  gclThickness: string;
  findings: string;
  interpretation: string;
}

export default function OphthalmologyOctFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<OctFormData>({
    patientId: '',
    eye: 'OD',
    scanDate: '',
    scanType: 'macular',
    rnflThickness: '',
    gclThickness: '',
    findings: '',
    interpretation: '',
  });

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['ophthalmology-patients'],
    queryFn: async () => {
      const response = await api.get('/ophthalmology/patients?limit=100');
      return response.data?.data || [];
    },
  });

  // Fetch existing OCT if editing
  const { data: oct } = useQuery({
    queryKey: ['ophthalmology-oct', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/oct/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (oct) {
      setFormData({
        patientId: oct.patientId || '',
        eye: oct.eye || 'OD',
        scanDate: oct.scanDate ? new Date(oct.scanDate).toISOString().slice(0, 16) : '',
        scanType: oct.scanType || 'macular',
        rnflThickness: oct.rnflThickness?.toString() || '',
        gclThickness: oct.gclThickness?.toString() || '',
        findings: oct.findings || '',
        interpretation: oct.interpretation || '',
      });
    }
  }, [oct]);

  const mutation = useMutation({
    mutationFn: async (data: OctFormData) => {
      const payload = {
        ...data,
        rnflThickness: data.rnflThickness ? parseFloat(data.rnflThickness) : undefined,
        gclThickness: data.gclThickness ? parseFloat(data.gclThickness) : undefined,
      };
      if (isEdit) {
        return api.put(`/ophthalmology/oct/${id}`, payload);
      }
      return api.post('/ophthalmology/oct', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-octs'] });
      toast.success(isEdit ? t('ophthalmology.octUpdated') : t('ophthalmology.octCreated'));
      navigate('/ophthalmology/octs');
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
        title={isEdit ? t('ophthalmology.editOct') : t('ophthalmology.newOct')}
        subtitle={isEdit ? t('ophthalmology.editOctSubtitle') : t('ophthalmology.newOctSubtitle')}
        icon={Scan}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/octs')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <FormSection title="Informations du scan" module="ophthalmology">
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

            {/* Scan Date */}
            <Input
              type="datetime-local"
              label="Date et heure du scan"
              value={formData.scanDate}
              onChange={(e) => setFormData({ ...formData, scanDate: e.target.value })}
              required
              module="ophthalmology"
            />

            {/* Scan Type */}
            <Select
              label="Type de scan"
              value={formData.scanType}
              onChange={(e) => setFormData({ ...formData, scanType: e.target.value as 'macular' | 'optic_nerve' | 'anterior_segment' })}
              required
              module="ophthalmology"
              options={[
                { value: 'macular', label: 'Maculaire' },
                { value: 'optic_nerve', label: 'Nerf optique' },
                { value: 'anterior_segment', label: 'Segment antérieur' }
              ]}
            />

            {/* RNFL Thickness */}
            <Input
              type="number"
              step="0.1"
              label="Épaisseur RNFL (μm)"
              value={formData.rnflThickness}
              onChange={(e) => setFormData({ ...formData, rnflThickness: e.target.value })}
              placeholder="Ex: 95.5"
              module="ophthalmology"
            />

            {/* GCL Thickness */}
            <Input
              type="number"
              step="0.1"
              label="Épaisseur GCL (μm)"
              value={formData.gclThickness}
              onChange={(e) => setFormData({ ...formData, gclThickness: e.target.value })}
              placeholder="Ex: 82.3"
              module="ophthalmology"
            />
          </FormGrid>

          {/* Findings */}
          <Textarea
            label="Observations"
            value={formData.findings}
            onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
            rows={3}
            placeholder="Observations du scan..."
            module="ophthalmology"
          />

          {/* Interpretation */}
          <Textarea
            label="Interprétation"
            value={formData.interpretation}
            onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
            rows={3}
            placeholder="Interprétation clinique..."
            module="ophthalmology"
          />

          {/* Actions */}
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/ophthalmology/octs')}
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
