/**
 * Dialyse Session Form Page
 * Create/Edit dialysis sessions
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Save } from 'lucide-react';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, FormSection, FormGrid, FormActions, Button } from '@/components/healthcare';

interface Patient {
  id: string;
  medicalId: string;
  requiresIsolation: boolean;
  contact: {
    firstName: string;
    lastName: string;
  };
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  type: string;
  durationMinutes: number;
  frequencyPerWeek: number;
  status: string;
}

interface Machine {
  id: string;
  machineNumber: string;
  model: string;
  status: string;
  isolationOnly: boolean;
}

interface Slot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

interface SessionFormData {
  patientId: string;
  prescriptionId: string;
  machineId?: string;
  slotId?: string;
  sessionDate: string;
  scheduledStartTime?: string;
  isRecurring: boolean;
  recurringWeeks?: number;
  primaryNurseId?: string;
  notes?: string;
}

export function DialyseSessionFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const isEditing = !!id;

  const [formData, setFormData] = useState<SessionFormData>({
    patientId: '',
    prescriptionId: '',
    sessionDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringWeeks: 4,
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch patients
  const { data: patients } = useQuery({
    queryKey: ['dialyse-patients-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Patient[]>>('/dialyse/patients?status=active&limit=100');
      return response.data.data;
    },
  });

  // Fetch prescriptions for selected patient
  const { data: prescriptions } = useQuery({
    queryKey: ['dialyse-prescriptions', formData.patientId],
    queryFn: async () => {
      if (!formData.patientId) return [];
      const response = await api.get<ApiResponse<Prescription[]>>(
        `/dialyse/patients/${formData.patientId}/prescriptions?status=active`
      );
      return response.data.data;
    },
    enabled: !!formData.patientId,
  });

  // Fetch available machines
  const { data: machines } = useQuery({
    queryKey: ['dialyse-machines-available', selectedPatient?.requiresIsolation],
    queryFn: async () => {
      const params = selectedPatient?.requiresIsolation ? '?forIsolation=true' : '';
      const response = await api.get<ApiResponse<Machine[]>>(`/dialyse/machines/available${params}`);
      return response.data.data;
    },
  });

  // Fetch slots
  const { data: slots } = useQuery({
    queryKey: ['dialyse-slots'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Slot[]>>('/dialyse/slots');
      return response.data.data;
    },
  });

  // Update selected patient when patientId changes
  useEffect(() => {
    if (formData.patientId && patients) {
      const patient = patients.find(p => p.id === formData.patientId);
      setSelectedPatient(patient || null);
    } else {
      setSelectedPatient(null);
    }
  }, [formData.patientId, patients]);

  // Create session mutation
  const createSession = useMutation({
    mutationFn: async (data: SessionFormData) => {
      const payload = {
        patientId: data.patientId,
        prescriptionId: data.prescriptionId,
        machineId: data.machineId || undefined,
        slotId: data.slotId || undefined,
        sessionDate: data.sessionDate,
        scheduledStartTime: data.scheduledStartTime || undefined,
        isRecurring: data.isRecurring,
        notes: data.notes || undefined,
      };

      if (data.isRecurring && data.recurringWeeks) {
        const response = await api.post<ApiResponse<unknown>>('/dialyse/sessions/recurring', {
          ...payload,
          weeks: data.recurringWeeks,
        });
        return response.data;
      } else {
        const response = await api.post<ApiResponse<unknown>>('/dialyse/sessions', payload);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-dashboard'] });
      toast.success(formData.isRecurring ? t('dialyse.sessions.recurringCreated') : t('dialyse.sessions.created'));
      navigate('/dialyse/planning');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.prescriptionId || !formData.sessionDate) {
      toast.warning(t('dialyse.sessions.fillRequired'));
      return;
    }

    createSession.mutate(formData);
  };

  const handleChange = (field: keyof SessionFormData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isEditing ? t('dialyse.sessions.editSession') : t('dialyse.sessions.newSession')}
        subtitle={isEditing ? t('dialyse.sessions.editSessionDesc') : t('dialyse.sessions.newSessionDesc')}
        icon={Calendar}
        module="dialyse"
        onBack={() => navigate('/dialyse/planning')}
      />

      {/* Form */}
      <FormSection module="dialyse">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <FormGrid columns={2}>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('dialyse.sessions.patient')} *</label>
              <select
                value={formData.patientId}
                onChange={(e) => {
                  handleChange('patientId', e.target.value);
                  handleChange('prescriptionId', ''); // Reset prescription
                }}
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">{t('dialyse.sessions.selectPatient')}</option>
                {patients?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.contact.firstName} {patient.contact.lastName} ({patient.medicalId})
                    {patient.requiresIsolation ? ` [${t('dialyse.sessions.isolation')}]` : ''}
                  </option>
                ))}
              </select>
              {selectedPatient?.requiresIsolation && (
                <p className="mt-1 text-sm text-orange-600 dark:text-orange-400 font-medium">
                  {t('dialyse.sessions.requiresIsolation')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('dialyse.sessions.prescription')} *</label>
              <select
                value={formData.prescriptionId}
                onChange={(e) => handleChange('prescriptionId', e.target.value)}
                required
                disabled={!formData.patientId}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="">{t('dialyse.sessions.selectPrescription')}</option>
                {prescriptions?.map((prescription) => (
                  <option key={prescription.id} value={prescription.id}>
                    {prescription.prescriptionNumber} - {prescription.type} ({prescription.durationMinutes}min, {prescription.frequencyPerWeek}x/sem)
                  </option>
                ))}
              </select>
              {formData.patientId && prescriptions?.length === 0 && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {t('dialyse.sessions.noPrescription')}
                </p>
              )}
            </div>
          </FormGrid>

          {/* Date and Time */}
          <FormGrid columns={3}>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('dialyse.sessions.sessionDate')} *</label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => handleChange('sessionDate', e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('dialyse.sessions.slot')}</label>
              <select
                value={formData.slotId || ''}
                onChange={(e) => handleChange('slotId', e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">{t('dialyse.sessions.selectSlot')}</option>
                {slots?.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.name} ({slot.startTime} - {slot.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('dialyse.sessions.startTime')}</label>
              <input
                type="time"
                value={formData.scheduledStartTime || ''}
                onChange={(e) => handleChange('scheduledStartTime', e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
              />
            </div>
          </FormGrid>

          {/* Machine */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('dialyse.sessions.machine')}</label>
            <select
              value={formData.machineId || ''}
              onChange={(e) => handleChange('machineId', e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="">{t('dialyse.sessions.selectMachine')}</option>
              {machines?.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.machineNumber} - {machine.model}
                  {machine.isolationOnly ? ` [${t('dialyse.sessions.isolation')}]` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('dialyse.sessions.assignLater')}
            </p>
          </div>

          {/* Recurring Sessions */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => handleChange('isRecurring', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">{t('dialyse.sessions.createRecurring')}</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('dialyse.sessions.createRecurringDesc')}
                </p>
              </div>
            </label>

            {formData.isRecurring && (
              <div className="mt-4 pl-7">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('dialyse.sessions.numberOfWeeks')}</label>
                <select
                  value={formData.recurringWeeks}
                  onChange={(e) => handleChange('recurringWeeks', parseInt(e.target.value))}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  <option value={2}>{t('dialyse.sessions.weeks2')}</option>
                  <option value={4}>{t('dialyse.sessions.weeks4')}</option>
                  <option value={8}>{t('dialyse.sessions.weeks8')}</option>
                  <option value={12}>{t('dialyse.sessions.weeks12')}</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('dialyse.sessions.notes')}</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder={t('dialyse.sessions.notesPlaceholder')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Actions */}
          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dialyse/planning')}
            >
              {t('dialyse.sessions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              module="dialyse"
              disabled={createSession.isPending}
              loading={createSession.isPending}
              icon={Save}
            >
              {formData.isRecurring ? t('dialyse.sessions.createSessions') : t('dialyse.sessions.createSession')}
            </Button>
          </FormActions>
        </form>
      </FormSection>
    </div>
  );
}
