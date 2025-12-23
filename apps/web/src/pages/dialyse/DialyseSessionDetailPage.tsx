/**
 * Dialyse Session Detail Page
 * View and manage a dialysis session with per-dialytic monitoring
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';

interface Session {
  id: string;
  sessionNumber: string;
  sessionDate: string;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduledStartTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  actualDurationMinutes: number | null;
  cancellationReason: string | null;
  notes: string | null;
  patient?: {
    id: string;
    medicalId: string;
    requiresIsolation: boolean;
    contact: {
      firstName: string;
      lastName: string;
    };
  };
  machine?: {
    id: string;
    machineNumber: string;
    model: string;
  };
  prescription?: {
    id: string;
    prescriptionNumber: string;
    type: string;
    durationMinutes: number;
  };
  records?: SessionRecord[];
  incidents?: SessionIncident[];
}

interface SessionRecord {
  id: string;
  phase: 'pre' | 'intra' | 'post';
  recordTime: string;
  weightKg: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  heartRate: number | null;
  temperature: number | null;
  arterialPressure: number | null;
  venousPressure: number | null;
  transmembranePressure: number | null;
  bloodFlowRate: number | null;
  dialysateFlowRate: number | null;
  cumulativeUf: number | null;
  ufAchieved: number | null;
  ufPrescribed: number | null;
  clinicalState: string | null;
  hasIncident: boolean;
}

interface SessionIncident {
  id: string;
  incidentTime: string;
  type: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string | null;
  intervention: string | null;
  outcome: string | null;
}

interface Machine {
  id: string;
  machineNumber: string;
  model: string;
  isolationOnly: boolean;
}

export function DialyseSessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [recordPhase, setRecordPhase] = useState<'pre' | 'intra' | 'post'>('pre');

  // Fetch session details
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['dialyse-session', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Session>>(`/dialyse/sessions/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Fetch available machines
  const { data: machines } = useQuery({
    queryKey: ['dialyse-machines-available', session?.patient?.requiresIsolation],
    queryFn: async () => {
      const params = session?.patient?.requiresIsolation ? '?forIsolation=true' : '';
      const response = await api.get<ApiResponse<Machine[]>>(`/dialyse/machines/available${params}`);
      return response.data.data;
    },
    enabled: showMachineModal,
  });

  // Check-in mutation
  const checkIn = useMutation({
    mutationFn: async () => {
      await api.post(`/dialyse/sessions/${id}/check-in`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      alert('Patient enregistré avec succès');
    },
    onError: (error) => alert(`Erreur: ${getErrorMessage(error)}`),
  });

  // Start session mutation
  const startSession = useMutation({
    mutationFn: async (machineId?: string) => {
      await api.post(`/dialyse/sessions/${id}/start`, { machineId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      setShowMachineModal(false);
      alert('Séance démarrée');
    },
    onError: (error) => alert(`Erreur: ${getErrorMessage(error)}`),
  });

  // Complete session mutation
  const completeSession = useMutation({
    mutationFn: async () => {
      await api.post(`/dialyse/sessions/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      alert('Séance terminée');
    },
    onError: (error) => alert(`Erreur: ${getErrorMessage(error)}`),
  });

  // Cancel session mutation
  const cancelSession = useMutation({
    mutationFn: async (reason: string) => {
      await api.post(`/dialyse/sessions/${id}/cancel`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      alert('Séance annulée');
    },
    onError: (error) => alert(`Erreur: ${getErrorMessage(error)}`),
  });

  // Add record mutation
  const addRecord = useMutation({
    mutationFn: async (data: Partial<SessionRecord>) => {
      await api.post(`/dialyse/sessions/${id}/records`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      setShowRecordModal(false);
      alert('Enregistrement ajouté');
    },
    onError: (error) => alert(`Erreur: ${getErrorMessage(error)}`),
  });

  // Add incident mutation
  const addIncident = useMutation({
    mutationFn: async (data: Partial<SessionIncident>) => {
      await api.post(`/dialyse/sessions/${id}/incidents`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      setShowIncidentModal(false);
      alert('Incident signalé');
    },
    onError: (error) => alert(`Erreur: ${getErrorMessage(error)}`),
  });

  const handleCancel = () => {
    const reason = prompt('Raison de l\'annulation:');
    if (reason) {
      cancelSession.mutate(reason);
    }
  };

  const handleStartSession = () => {
    if (session?.machine) {
      startSession.mutate(undefined);
    } else {
      setShowMachineModal(true);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      checked_in: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800',
    };
    const labels: Record<string, string> = {
      scheduled: 'Planifiée',
      checked_in: 'Patient Arrivé',
      in_progress: 'En Cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
      no_show: 'Absent',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      mild: 'bg-yellow-100 text-yellow-800',
      moderate: 'bg-orange-100 text-orange-800',
      severe: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity] || 'bg-gray-100'}`}>
        {severity === 'mild' ? 'Léger' : severity === 'moderate' ? 'Modéré' : 'Sévère'}
      </span>
    );
  };

  const formatTime = (date: string | null) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Erreur lors du chargement de la séance</p>
        <button onClick={() => navigate('/dialyse/planning')} className="mt-4 text-primary hover:underline">
          Retour au planning
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Séance {session.sessionNumber}</h1>
            {getStatusBadge(session.status)}
          </div>
          <p className="text-muted-foreground mt-1">
            {new Date(session.sessionDate).toLocaleDateString('fr-FR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {session.status === 'scheduled' && (
            <>
              <button
                onClick={() => checkIn.mutate()}
                disabled={checkIn.isPending}
                className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
              >
                Check-in Patient
              </button>
              <button
                onClick={handleCancel}
                className="rounded-md border border-destructive text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/10"
              >
                Annuler
              </button>
            </>
          )}
          {session.status === 'checked_in' && (
            <button
              onClick={handleStartSession}
              disabled={startSession.isPending}
              className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Démarrer la Séance
            </button>
          )}
          {session.status === 'in_progress' && (
            <>
              <button
                onClick={() => { setRecordPhase('intra'); setShowRecordModal(true); }}
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Ajouter Mesure
              </button>
              <button
                onClick={() => setShowIncidentModal(true)}
                className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Signaler Incident
              </button>
              <button
                onClick={() => completeSession.mutate()}
                disabled={completeSession.isPending}
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Terminer
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/dialyse/planning')}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Retour
          </button>
        </div>
      </div>

      {/* Session Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Info */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-3">Patient</h3>
          {session.patient ? (
            <div>
              <Link to={`/dialyse/patients/${session.patient.id}`} className="font-medium text-primary hover:underline">
                {session.patient.contact.firstName} {session.patient.contact.lastName}
              </Link>
              <p className="text-sm text-muted-foreground">{session.patient.medicalId}</p>
              {session.patient.requiresIsolation && (
                <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Isolation requise
                </span>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">-</p>
          )}
        </div>

        {/* Prescription Info */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-3">Prescription</h3>
          {session.prescription ? (
            <div>
              <p className="font-medium">{session.prescription.prescriptionNumber}</p>
              <p className="text-sm text-muted-foreground">
                {session.prescription.type} - {session.prescription.durationMinutes} min
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">-</p>
          )}
        </div>

        {/* Machine Info */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-3">Machine</h3>
          {session.machine ? (
            <div>
              <p className="font-medium">{session.machine.machineNumber}</p>
              <p className="text-sm text-muted-foreground">{session.machine.model}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Non assignée</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-4">Chronologie</h3>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Prévu</p>
            <p className="text-lg font-mono">{session.scheduledStartTime || '--:--'}</p>
          </div>
          <div className="flex-1 border-t border-dashed"></div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Début</p>
            <p className="text-lg font-mono">{formatTime(session.actualStartTime)}</p>
          </div>
          <div className="flex-1 border-t border-dashed"></div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Fin</p>
            <p className="text-lg font-mono">{formatTime(session.actualEndTime)}</p>
          </div>
          <div className="flex-1 border-t border-dashed"></div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Durée</p>
            <p className="text-lg font-mono">
              {session.actualDurationMinutes ? `${session.actualDurationMinutes} min` : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Mesures Per-Dialytiques</h3>
          {session.status === 'in_progress' && (
            <div className="flex gap-2">
              <button
                onClick={() => { setRecordPhase('pre'); setShowRecordModal(true); }}
                className="text-sm text-primary hover:underline"
              >
                + Pré
              </button>
              <button
                onClick={() => { setRecordPhase('intra'); setShowRecordModal(true); }}
                className="text-sm text-primary hover:underline"
              >
                + Intra
              </button>
              <button
                onClick={() => { setRecordPhase('post'); setShowRecordModal(true); }}
                className="text-sm text-primary hover:underline"
              >
                + Post
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">Heure</th>
                <th className="px-4 py-2 text-left">Phase</th>
                <th className="px-4 py-2 text-left">Poids</th>
                <th className="px-4 py-2 text-left">TA</th>
                <th className="px-4 py-2 text-left">FC</th>
                <th className="px-4 py-2 text-left">Temp</th>
                <th className="px-4 py-2 text-left">PA/PV/PTM</th>
                <th className="px-4 py-2 text-left">Qb/Qd</th>
                <th className="px-4 py-2 text-left">UF</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {session.records && session.records.length > 0 ? (
                session.records.map((record) => (
                  <tr key={record.id} className={record.hasIncident ? 'bg-red-50' : ''}>
                    <td className="px-4 py-2 font-mono">{formatTime(record.recordTime)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.phase === 'pre' ? 'bg-blue-100 text-blue-800' :
                        record.phase === 'intra' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {record.phase === 'pre' ? 'Pré' : record.phase === 'intra' ? 'Intra' : 'Post'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{record.weightKg ? `${record.weightKg} kg` : '-'}</td>
                    <td className="px-4 py-2">
                      {record.systolicBp && record.diastolicBp
                        ? `${record.systolicBp}/${record.diastolicBp}`
                        : '-'}
                    </td>
                    <td className="px-4 py-2">{record.heartRate || '-'}</td>
                    <td className="px-4 py-2">{record.temperature ? `${record.temperature}°C` : '-'}</td>
                    <td className="px-4 py-2 text-xs">
                      {record.arterialPressure || '-'}/{record.venousPressure || '-'}/{record.transmembranePressure || '-'}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {record.bloodFlowRate || '-'}/{record.dialysateFlowRate || '-'}
                    </td>
                    <td className="px-4 py-2">{record.cumulativeUf ? `${record.cumulativeUf}L` : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Aucune mesure enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incidents */}
      {session.incidents && session.incidents.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-red-600">Incidents ({session.incidents.length})</h3>
          </div>
          <div className="divide-y">
            {session.incidents.map((incident) => (
              <div key={incident.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{incident.type.replace('_', ' ')}</span>
                      {getSeverityBadge(incident.severity)}
                    </div>
                    {incident.description && (
                      <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                    )}
                    {incident.intervention && (
                      <p className="text-sm mt-1"><strong>Intervention:</strong> {incident.intervention}</p>
                    )}
                    {incident.outcome && (
                      <p className="text-sm mt-1"><strong>Issue:</strong> {incident.outcome}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{formatTime(incident.incidentTime)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-sm text-muted-foreground">{session.notes}</p>
        </div>
      )}

      {/* Cancellation Reason */}
      {session.status === 'cancelled' && session.cancellationReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-800 mb-2">Raison de l'annulation</h3>
          <p className="text-sm text-red-700">{session.cancellationReason}</p>
        </div>
      )}

      {/* Machine Selection Modal */}
      {showMachineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">Sélectionner une Machine</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {machines?.map((machine) => (
                <button
                  key={machine.id}
                  onClick={() => startSession.mutate(machine.id)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent"
                >
                  <span className="font-medium">{machine.machineNumber}</span>
                  <span className="text-muted-foreground ml-2">{machine.model}</span>
                  {machine.isolationOnly && (
                    <span className="ml-2 text-xs text-orange-600">[ISOLATION]</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowMachineModal(false)}
                className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              Nouvelle Mesure - {recordPhase === 'pre' ? 'Pré-dialyse' : recordPhase === 'intra' ? 'Intra-dialyse' : 'Post-dialyse'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: Partial<SessionRecord> = {
                  phase: recordPhase,
                  weightKg: formData.get('weightKg') ? parseFloat(formData.get('weightKg') as string) : undefined,
                  systolicBp: formData.get('systolicBp') ? parseInt(formData.get('systolicBp') as string) : undefined,
                  diastolicBp: formData.get('diastolicBp') ? parseInt(formData.get('diastolicBp') as string) : undefined,
                  heartRate: formData.get('heartRate') ? parseInt(formData.get('heartRate') as string) : undefined,
                  temperature: formData.get('temperature') ? parseFloat(formData.get('temperature') as string) : undefined,
                  arterialPressure: formData.get('arterialPressure') ? parseFloat(formData.get('arterialPressure') as string) : undefined,
                  venousPressure: formData.get('venousPressure') ? parseFloat(formData.get('venousPressure') as string) : undefined,
                  transmembranePressure: formData.get('transmembranePressure') ? parseFloat(formData.get('transmembranePressure') as string) : undefined,
                  bloodFlowRate: formData.get('bloodFlowRate') ? parseFloat(formData.get('bloodFlowRate') as string) : undefined,
                  dialysateFlowRate: formData.get('dialysateFlowRate') ? parseFloat(formData.get('dialysateFlowRate') as string) : undefined,
                  cumulativeUf: formData.get('cumulativeUf') ? parseFloat(formData.get('cumulativeUf') as string) : undefined,
                  clinicalState: formData.get('clinicalState') as string || undefined,
                };
                addRecord.mutate(data);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Poids (kg)</label>
                  <input type="number" step="0.1" name="weightKg" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TA Systolique</label>
                  <input type="number" name="systolicBp" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TA Diastolique</label>
                  <input type="number" name="diastolicBp" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fréq. Cardiaque</label>
                  <input type="number" name="heartRate" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Température (°C)</label>
                  <input type="number" step="0.1" name="temperature" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">UF Cumulative (L)</label>
                  <input type="number" step="0.1" name="cumulativeUf" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
              </div>
              {recordPhase === 'intra' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">P. Artérielle</label>
                    <input type="number" name="arterialPressure" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">P. Veineuse</label>
                    <input type="number" name="venousPressure" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">PTM</label>
                    <input type="number" name="transmembranePressure" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
              {recordPhase === 'intra' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Débit Sang (Qb)</label>
                    <input type="number" name="bloodFlowRate" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Débit Dialysat (Qd)</label>
                    <input type="number" name="dialysateFlowRate" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">État Clinique</label>
                <input type="text" name="clinicalState" placeholder="Ex: RAS, Stable..." className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowRecordModal(false)} className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent">
                  Annuler
                </button>
                <button type="submit" disabled={addRecord.isPending} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Signaler un Incident</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addIncident.mutate({
                  type: formData.get('type') as string,
                  severity: formData.get('severity') as 'mild' | 'moderate' | 'severe',
                  description: formData.get('description') as string || undefined,
                  intervention: formData.get('intervention') as string || undefined,
                  outcome: formData.get('outcome') as string || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Type d'incident *</label>
                <select name="type" required className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="hypotension">Hypotension</option>
                  <option value="cramps">Crampes</option>
                  <option value="nausea">Nausées</option>
                  <option value="bleeding">Saignement</option>
                  <option value="clotting">Coagulation</option>
                  <option value="fever">Fièvre</option>
                  <option value="chest_pain">Douleur thoracique</option>
                  <option value="arrhythmia">Arythmie</option>
                  <option value="access_problem">Problème d'accès</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sévérité *</label>
                <select name="severity" required className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="mild">Léger</option>
                  <option value="moderate">Modéré</option>
                  <option value="severe">Sévère</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" rows={2} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Intervention</label>
                <textarea name="intervention" rows={2} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue/Résultat</label>
                <input type="text" name="outcome" className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowIncidentModal(false)} className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent">
                  Annuler
                </button>
                <button type="submit" disabled={addIncident.isPending} className="px-4 py-2 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600">
                  Signaler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
