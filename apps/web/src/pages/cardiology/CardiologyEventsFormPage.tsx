/**
 * Cardiology Events Form Page
 * Create/Edit cardiac events
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface EventFormData {
  patientId: string;
  eventDate: string;
  eventType: 'mi' | 'stroke' | 'tia' | 'arrhythmia' | 'heart_failure' | 'cardiac_arrest' | 'hospitalization' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  location: string;
  treatment: string;
  outcome: 'recovered' | 'ongoing' | 'deceased';
  notes: string;
}

export default function CardiologyEventsFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<EventFormData>({
    patientId: '',
    eventDate: '',
    eventType: 'mi',
    severity: 'moderate',
    location: '',
    treatment: '',
    outcome: 'ongoing',
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

  // Fetch existing event if editing
  const { data: event } = useQuery({
    queryKey: ['cardiology-event', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/events/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        patientId: event.patientId || '',
        eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : '',
        eventType: event.eventType || 'mi',
        severity: event.severity || 'moderate',
        location: event.location || '',
        treatment: event.treatment || '',
        outcome: event.outcome || 'ongoing',
        notes: event.notes || '',
      });
    }
  }, [event]);

  const mutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      if (isEdit) {
        return api.put(`/cardiology/events/${id}`, data);
      }
      return api.post('/cardiology/events', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-events'] });
      toast.success(isEdit ? t('cardiology.eventUpdated') : t('cardiology.eventCreated'));
      navigate('/cardiology/events');
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
        title={isEdit ? t('cardiology.editEvent') : t('cardiology.newEvent')}
        subtitle={isEdit ? t('cardiology.editEventDetails') : t('cardiology.createNewEvent')}
        icon={Heart}
        module="cardiology"
        onBack={() => navigate('/cardiology/events')}
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

          {/* Event Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de l'événement *
            </label>
            <input
              type="datetime-local"
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type d'événement *
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventFormData['eventType'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="mi">Infarctus du myocarde</option>
              <option value="stroke">AVC</option>
              <option value="tia">AIT</option>
              <option value="arrhythmia">Arythmie</option>
              <option value="heart_failure">Insuffisance cardiaque</option>
              <option value="cardiac_arrest">Arrêt cardiaque</option>
              <option value="hospitalization">Hospitalisation</option>
              <option value="other">Autre</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sévérité *
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as EventFormData['severity'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="mild">Légère</option>
              <option value="moderate">Modérée</option>
              <option value="severe">Sévère</option>
              <option value="critical">Critique</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lieu
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Nom de l'hôpital ou lieu de l'événement..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Résultat *
            </label>
            <select
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value as EventFormData['outcome'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="recovered">Rétabli</option>
              <option value="ongoing">En cours</option>
              <option value="deceased">Décédé</option>
            </select>
          </div>

          {/* Treatment */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Traitement
            </label>
            <textarea
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              rows={4}
              placeholder="Détails du traitement administré..."
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
              placeholder="Notes additionnelles sur l'événement..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
          </FormGrid>

          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cardiology/events')}
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
