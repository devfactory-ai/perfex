/**
 * Cardiology Consultation Form Page
 * Create/Edit cardiology consultations
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stethoscope, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface ConsultationFormData {
  patientId: string;
  consultationType: 'first_visit' | 'follow_up' | 'emergency';
  scheduledAt: string;
  chiefComplaint: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  nextVisit: string;
  notes: string;
}

export default function CardiologyConsultationFormPage() {
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
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    nextVisit: '',
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

  // Fetch existing consultation if editing
  const { data: consultation } = useQuery({
    queryKey: ['cardiology-consultation', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/consultations/${id}`);
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
        bloodPressureSystolic: consultation.systolicBp?.toString() || '',
        bloodPressureDiastolic: consultation.diastolicBp?.toString() || '',
        heartRate: consultation.heartRate?.toString() || '',
        symptoms: consultation.historyOfPresentIllness || '',
        diagnosis: consultation.diagnosis || '',
        treatment: consultation.treatmentPlan || '',
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
        systolicBp: data.bloodPressureSystolic ? Number(data.bloodPressureSystolic) : undefined,
        diastolicBp: data.bloodPressureDiastolic ? Number(data.bloodPressureDiastolic) : undefined,
        heartRate: data.heartRate ? Number(data.heartRate) : undefined,
        historyOfPresentIllness: data.symptoms || undefined,
        diagnosis: data.diagnosis || undefined,
        treatmentPlan: data.treatment || undefined,
        followUpDate: data.nextVisit || undefined,
        notes: data.notes || undefined,
      };
      if (isEdit) {
        return api.put(`/cardiology/consultations/${id}`, payload);
      }
      return api.post('/cardiology/consultations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-consultations'] });
      toast.success(isEdit ? t('cardiology.consultationUpdated') : t('cardiology.consultationCreated'));
      navigate('/cardiology/consultations');
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
      <PageHeader
        title={isEdit ? t('cardiology.editConsultation') : t('cardiology.newConsultation')}
        subtitle={isEdit ? t('cardiology.editConsultationDetails') : t('cardiology.createNewConsultation')}
        icon={Stethoscope}
        module="cardiology"
        onBack={() => navigate('/cardiology/consultations')}
      />

      <FormSection module="cardiology">
        <form onSubmit={handleSubmit}>
          <FormGrid columns={2}>
          {/* Patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.patient')} *
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="">{t('common.selectPatient')}</option>
              {patients?.map((patient: any) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - {patient.medicalRecordNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Consultation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de consultation *
            </label>
            <select
              value={formData.consultationType}
              onChange={(e) => setFormData({ ...formData, consultationType: e.target.value as 'first_visit' | 'follow_up' | 'emergency' })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="first_visit">Première visite</option>
              <option value="follow_up">Suivi</option>
              <option value="emergency">Urgence</option>
            </select>
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date et heure *
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motif de consultation
            </label>
            <input
              type="text"
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              placeholder="Douleur thoracique, essoufflement..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Blood Pressure Systolic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tension systolique (mmHg)
            </label>
            <input
              type="number"
              value={formData.bloodPressureSystolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
              placeholder="120"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Blood Pressure Diastolic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tension diastolique (mmHg)
            </label>
            <input
              type="number"
              value={formData.bloodPressureDiastolic}
              onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
              placeholder="80"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Diagnostic
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Hypertension, arythmie..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Treatment */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Traitement
            </label>
            <input
              type="text"
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              placeholder="Médicaments prescrits, recommandations..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Symptoms */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Symptômes
            </label>
            <textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows={3}
              placeholder="Description des symptômes..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Next Visit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prochaine visite
            </label>
            <input
              type="date"
              value={formData.nextVisit}
              onChange={(e) => setFormData({ ...formData, nextVisit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
          </FormGrid>

          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cardiology/consultations')}
              module="cardiology"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
              icon={Save}
              module="cardiology"
            >
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </FormActions>
        </form>
      </FormSection>
    </div>
  );
}
