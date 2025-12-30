/**
 * Cardiology Appointments Form Page
 * Create/Edit cardiology appointments
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface AppointmentFormData {
  patientId: string;
  appointmentDate: string;
  appointmentType: 'consultation' | 'follow_up' | 'ecg' | 'echo' | 'stress_test' | 'holter' | 'procedure';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  duration: string;
  doctor: string;
  room: string;
  reason: string;
  notes: string;
}

export default function CardiologyAppointmentsFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<AppointmentFormData>({
    patientId: '',
    appointmentDate: '',
    appointmentType: 'consultation',
    status: 'scheduled',
    duration: '',
    doctor: '',
    room: '',
    reason: '',
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

  // Fetch existing appointment if editing
  const { data: appointment } = useQuery({
    queryKey: ['cardiology-appointment', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/appointments/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        patientId: appointment.patientId || '',
        appointmentDate: appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString().slice(0, 16) : '',
        appointmentType: appointment.appointmentType || 'consultation',
        status: appointment.status || 'scheduled',
        duration: appointment.duration?.toString() || '',
        doctor: appointment.doctor || '',
        room: appointment.room || '',
        reason: appointment.reason || '',
        notes: appointment.notes || '',
      });
    }
  }, [appointment]);

  const mutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const payload = {
        ...data,
        duration: data.duration ? Number(data.duration) : undefined,
      };
      if (isEdit) {
        return api.put(`/cardiology/appointments/${id}`, payload);
      }
      return api.post('/cardiology/appointments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-appointments'] });
      toast.success(isEdit ? t('cardiology.appointmentUpdated') : t('cardiology.appointmentCreated'));
      navigate('/cardiology/appointments');
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
        title={isEdit ? t('cardiology.editAppointment') : t('cardiology.newAppointment')}
        subtitle={isEdit ? t('cardiology.editAppointmentDetails') : t('cardiology.createNewAppointment')}
        icon={Calendar}
        module="cardiology"
        onBack={() => navigate('/cardiology/appointments')}
      />

      <FormSection module="cardiology">
        <form onSubmit={handleSubmit}>
          <FormGrid columns={2}>
      {/* Form */}
      
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

          {/* Appointment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date et heure *
            </label>
            <input
              type="datetime-local"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de rendez-vous *
            </label>
            <select
              value={formData.appointmentType}
              onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value as AppointmentFormData['appointmentType'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="consultation">Consultation</option>
              <option value="follow_up">Suivi</option>
              <option value="ecg">ECG</option>
              <option value="echo">Échocardiographie</option>
              <option value="stress_test">Test d'effort</option>
              <option value="holter">Holter</option>
              <option value="procedure">Procédure</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentFormData['status'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="scheduled">Planifié</option>
              <option value="confirmed">Confirmé</option>
              <option value="completed">Terminé</option>
              <option value="cancelled">Annulé</option>
              <option value="no_show">Absence</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Durée (minutes)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="30"
              min="0"
              step="5"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Médecin
            </label>
            <input
              type="text"
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              placeholder="Dr. Nom du cardiologue"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Salle
            </label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="Salle 101"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Reason */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motif
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              placeholder="Motif du rendez-vous..."
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
              rows={3}
              placeholder="Notes additionnelles..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
          </FormGrid>

        <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cardiology/appointments')}
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
