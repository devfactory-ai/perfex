/**
 * Dialyse Session Form Page
 * Create/Edit dialysis sessions
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';

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
      alert(formData.isRecurring ? 'Sessions récurrentes créées avec succès' : 'Session créée avec succès');
      navigate('/dialyse/planning');
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.prescriptionId || !formData.sessionDate) {
      alert('Veuillez remplir tous les champs obligatoires');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Modifier la Séance' : 'Nouvelle Séance de Dialyse'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Modifier les informations de la séance' : 'Planifier une nouvelle séance de dialyse'}
          </p>
        </div>
        <button
          onClick={() => navigate('/dialyse/planning')}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Retour au Planning
        </button>
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Patient *</label>
              <select
                value={formData.patientId}
                onChange={(e) => {
                  handleChange('patientId', e.target.value);
                  handleChange('prescriptionId', ''); // Reset prescription
                }}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un patient</option>
                {patients?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.contact.firstName} {patient.contact.lastName} ({patient.medicalId})
                    {patient.requiresIsolation ? ' [ISOLATION]' : ''}
                  </option>
                ))}
              </select>
              {selectedPatient?.requiresIsolation && (
                <p className="mt-1 text-sm text-orange-600 font-medium">
                  Ce patient nécessite une machine d'isolation
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Prescription *</label>
              <select
                value={formData.prescriptionId}
                onChange={(e) => handleChange('prescriptionId', e.target.value)}
                required
                disabled={!formData.patientId}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">Sélectionner une prescription</option>
                {prescriptions?.map((prescription) => (
                  <option key={prescription.id} value={prescription.id}>
                    {prescription.prescriptionNumber} - {prescription.type} ({prescription.durationMinutes}min, {prescription.frequencyPerWeek}x/sem)
                  </option>
                ))}
              </select>
              {formData.patientId && prescriptions?.length === 0 && (
                <p className="mt-1 text-sm text-destructive">
                  Aucune prescription active pour ce patient
                </p>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-2">Date de la Séance *</label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => handleChange('sessionDate', e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Créneau</label>
              <select
                value={formData.slotId || ''}
                onChange={(e) => handleChange('slotId', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un créneau</option>
                {slots?.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.name} ({slot.startTime} - {slot.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Heure de Début</label>
              <input
                type="time"
                value={formData.scheduledStartTime || ''}
                onChange={(e) => handleChange('scheduledStartTime', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Machine */}
          <div>
            <label className="block text-sm font-medium mb-2">Machine</label>
            <select
              value={formData.machineId || ''}
              onChange={(e) => handleChange('machineId', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une machine (optionnel)</option>
              {machines?.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.machineNumber} - {machine.model}
                  {machine.isolationOnly ? ' [ISOLATION]' : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Vous pouvez assigner la machine plus tard lors du check-in
            </p>
          </div>

          {/* Recurring Sessions */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => handleChange('isRecurring', e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <div>
                <span className="font-medium">Créer des séances récurrentes</span>
                <p className="text-sm text-muted-foreground">
                  Planifier automatiquement les séances sur plusieurs semaines
                </p>
              </div>
            </label>

            {formData.isRecurring && (
              <div className="mt-4 pl-7">
                <label className="block text-sm font-medium mb-2">Nombre de semaines</label>
                <select
                  value={formData.recurringWeeks}
                  onChange={(e) => handleChange('recurringWeeks', parseInt(e.target.value))}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={2}>2 semaines</option>
                  <option value={4}>4 semaines</option>
                  <option value={8}>8 semaines</option>
                  <option value={12}>12 semaines</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Notes pour cette séance..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/dialyse/planning')}
              className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createSession.isPending}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {createSession.isPending ? 'Création...' : formData.isRecurring ? 'Créer les Séances' : 'Créer la Séance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
