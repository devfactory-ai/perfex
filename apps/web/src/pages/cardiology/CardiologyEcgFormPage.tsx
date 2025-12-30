/**
 * Cardiology ECG Form Page
 * Create/Edit ECG recordings
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import {
  PageHeader,
  FormSection,
  FormGrid,
  FormActions,
  Button,
} from '../../components/healthcare';

interface EcgFormData {
  patientId: string;
  recordingDate: string;
  heartRate: string;
  prInterval: string;
  qrsWidth: string;
  qtInterval: string;
  rhythm: 'sinus' | 'afib' | 'aflutter' | 'avblock' | 'other';
  interpretation: string;
  abnormalities: string;
  notes: string;
}

export default function CardiologyEcgFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<EcgFormData>({
    patientId: '',
    recordingDate: '',
    heartRate: '',
    prInterval: '',
    qrsWidth: '',
    qtInterval: '',
    rhythm: 'sinus',
    interpretation: '',
    abnormalities: '',
    notes: '',
  });

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['cardiology-patients'],
    queryFn: async () => {
      const response = await api.get('/cardiology/patients?limit=100');
      return response.data?.data || [];
    },
  });

  // Fetch existing ECG if editing
  const { data: ecg } = useQuery({
    queryKey: ['cardiology-ecg', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/ecg/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (ecg) {
      setFormData({
        patientId: ecg.patientId || '',
        recordingDate: ecg.recordingDateTime ? new Date(ecg.recordingDateTime).toISOString().slice(0, 16) : '',
        heartRate: ecg.heartRate?.toString() || ecg.ventricularRate?.toString() || '',
        prInterval: ecg.prInterval?.toString() || '',
        qrsWidth: ecg.qrsDuration?.toString() || ecg.qrsWidth?.toString() || '',
        qtInterval: ecg.qtInterval?.toString() || '',
        rhythm: ecg.rhythm || 'sinus',
        interpretation: ecg.interpretation || '',
        abnormalities: ecg.abnormalFindings || ecg.abnormalities || '',
        notes: ecg.notes || '',
      });
    }
  }, [ecg]);

  const mutation = useMutation({
    mutationFn: async (data: EcgFormData) => {
      const payload = {
        patientId: data.patientId,
        recordingDateTime: data.recordingDate,
        ventricularRate: data.heartRate ? Number(data.heartRate) : undefined,
        prInterval: data.prInterval ? Number(data.prInterval) : undefined,
        qrsDuration: data.qrsWidth ? Number(data.qrsWidth) : undefined,
        qtInterval: data.qtInterval ? Number(data.qtInterval) : undefined,
        rhythm: data.rhythm,
        interpretation: data.interpretation || undefined,
        abnormalFindings: data.abnormalities || undefined,
        notes: data.notes || undefined,
      };
      if (isEdit) {
        return api.put(`/cardiology/ecg/${id}`, payload);
      }
      return api.post('/cardiology/ecg', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-ecg'] });
      toast.success(isEdit ? t('cardiology.ecgUpdated') : t('cardiology.ecgCreated'));
      navigate('/cardiology/ecg');
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
        title={isEdit ? t('cardiology.editEcg') : t('cardiology.newEcg')}
        subtitle={isEdit ? t('cardiology.editEcgDetails') : t('cardiology.createNewEcg')}
        icon={Activity}
        module="cardiology"
        onBack={() => navigate('/cardiology/ecg')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <FormSection title="Informations de l'enregistrement">
          <FormGrid cols={2}>
          {/* Patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.patient')} *
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            >
              <option value="">{t('common.selectPatient')}</option>
              {patients?.map((patient: any) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - {patient.medicalRecordNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Recording Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date et heure d'enregistrement *
            </label>
            <input
              type="datetime-local"
              value={formData.recordingDate}
              onChange={(e) => setFormData({ ...formData, recordingDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Heart Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fréquence cardiaque (bpm)
            </label>
            <input
              type="number"
              value={formData.heartRate}
              onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
              placeholder="70"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Rhythm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rythme
            </label>
            <select
              value={formData.rhythm}
              onChange={(e) => setFormData({ ...formData, rhythm: e.target.value as EcgFormData['rhythm'] })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            >
              <option value="sinus">Sinusal</option>
              <option value="afib">Fibrillation auriculaire</option>
              <option value="aflutter">Flutter auriculaire</option>
              <option value="avblock">Bloc AV</option>
              <option value="other">Autre</option>
            </select>
          </div>

          {/* PR Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Intervalle PR (ms)
            </label>
            <input
              type="number"
              value={formData.prInterval}
              onChange={(e) => setFormData({ ...formData, prInterval: e.target.value })}
              placeholder="120-200"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* QRS Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Largeur QRS (ms)
            </label>
            <input
              type="number"
              value={formData.qrsWidth}
              onChange={(e) => setFormData({ ...formData, qrsWidth: e.target.value })}
              placeholder="60-100"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* QT Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Intervalle QT (ms)
            </label>
            <input
              type="number"
              value={formData.qtInterval}
              onChange={(e) => setFormData({ ...formData, qtInterval: e.target.value })}
              placeholder="350-450"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Interpretation */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Interprétation
            </label>
            <textarea
              value={formData.interpretation}
              onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
              rows={3}
              placeholder="Interprétation clinique de l'ECG..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Abnormalities */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anomalies
            </label>
            <textarea
              value={formData.abnormalities}
              onChange={(e) => setFormData({ ...formData, abnormalities: e.target.value })}
              rows={3}
              placeholder="Description des anomalies détectées..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Notes additionnelles..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
            />
          </div>
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            type="button"
            onClick={() => navigate('/cardiology/ecg')}
            variant="outline"
            module="cardiology"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending}
            module="cardiology"
            icon={Save}
          >
            {mutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
