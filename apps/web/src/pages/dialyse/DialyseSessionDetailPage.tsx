/**
 * Dialyse Session Detail Page
 * View and manage a dialysis session with per-dialytic monitoring
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SectionCard, Button, getStatusColor } from '@/components/healthcare';

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
  const toast = useToast();
  const { t } = useLanguage();

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
      toast.success(t('dialyse.patientCheckedIn'));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Start session mutation
  const startSession = useMutation({
    mutationFn: async (machineId?: string) => {
      await api.post(`/dialyse/sessions/${id}/start`, { machineId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      setShowMachineModal(false);
      toast.success(t('dialyse.sessionStarted'));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Complete session mutation
  const completeSession = useMutation({
    mutationFn: async () => {
      await api.post(`/dialyse/sessions/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      toast.success(t('dialyse.sessionCompleted'));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Cancel session mutation
  const cancelSession = useMutation({
    mutationFn: async (reason: string) => {
      await api.post(`/dialyse/sessions/${id}/cancel`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      toast.success(t('dialyse.sessionCancelled'));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Add record mutation
  const addRecord = useMutation({
    mutationFn: async (data: Partial<SessionRecord>) => {
      await api.post(`/dialyse/sessions/${id}/records`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      setShowRecordModal(false);
      toast.success(t('dialyse.recordAdded'));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Add incident mutation
  const addIncident = useMutation({
    mutationFn: async (data: Partial<SessionIncident>) => {
      await api.post(`/dialyse/sessions/${id}/incidents`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-session', id] });
      setShowIncidentModal(false);
      toast.success(t('dialyse.incidentReported'));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleCancel = () => {
    const reason = prompt(t('dialyse.cancellationPrompt'));
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
    const colorClass = getStatusColor(status as any);
    const labels: Record<string, string> = {
      scheduled: t('dialyse.statusScheduled'),
      checked_in: t('dialyse.statusCheckedIn'),
      in_progress: t('dialyse.statusInProgress'),
      completed: t('dialyse.statusCompleted'),
      cancelled: t('dialyse.statusCancelled'),
      no_show: t('dialyse.statusNoShow'),
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      mild: 'bg-slate-100 text-slate-700',
      moderate: 'bg-slate-200 text-slate-800',
      severe: 'bg-slate-300 text-slate-900',
    };
    const labels: Record<string, string> = {
      mild: t('dialyse.severityMild'),
      moderate: t('dialyse.severityModerate'),
      severe: t('dialyse.severitySevere'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity] || 'bg-gray-100'}`}>
        {labels[severity] || severity}
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
        <p className="text-destructive">{t('dialyse.errorLoadingSession')}</p>
        <button onClick={() => navigate('/dialyse/planning')} className="mt-4 text-primary hover:underline">
          {t('dialyse.backToPlanning')}
        </button>
      </div>
    );
  }

  const headerActions = (
    <>
      {session.status === 'scheduled' && (
        <>
          <Button
            module="dialyse"
            onClick={() => checkIn.mutate()}
            disabled={checkIn.isPending}
            variant="outline"
          >
            {t('dialyse.checkInPatient')}
          </Button>
          <Button
            module="dialyse"
            onClick={handleCancel}
            variant="outline"
          >
            {t('dialyse.cancel')}
          </Button>
        </>
      )}
      {session.status === 'checked_in' && (
        <Button
          module="dialyse"
          onClick={handleStartSession}
          disabled={startSession.isPending}
          variant="outline"
        >
          {t('dialyse.startSession')}
        </Button>
      )}
      {session.status === 'in_progress' && (
        <>
          <Button
            module="dialyse"
            onClick={() => { setRecordPhase('intra'); setShowRecordModal(true); }}
            variant="outline"
          >
            {t('dialyse.addMeasure')}
          </Button>
          <Button
            module="dialyse"
            onClick={() => setShowIncidentModal(true)}
            variant="outline"
          >
            {t('dialyse.reportIncident')}
          </Button>
          <Button
            module="dialyse"
            onClick={() => completeSession.mutate()}
            disabled={completeSession.isPending}
            variant="outline"
          >
            {t('dialyse.finish')}
          </Button>
        </>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('dialyse.session')} ${session.sessionNumber}`}
        subtitle={new Date(session.sessionDate).toLocaleDateString('fr-FR', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })}
        icon={Activity}
        module="dialyse"
        onBack={() => navigate('/dialyse/planning')}
        actions={headerActions}
        badge={getStatusBadge(session.status)}
      />

      {/* Session Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Info */}
        <SectionCard title={t('dialyse.patient')}>
          {session.patient ? (
            <div>
              <Link to={`/dialyse/patients/${session.patient.id}`} className="font-medium text-primary hover:underline">
                {session.patient.contact.firstName} {session.patient.contact.lastName}
              </Link>
              <p className="text-sm text-muted-foreground">{session.patient.medicalId}</p>
              {session.patient.requiresIsolation && (
                <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {t('dialyse.isolationRequired')}
                </span>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">-</p>
          )}
        </SectionCard>

        {/* Prescription Info */}
        <SectionCard title={t('dialyse.prescription')}>
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
        </SectionCard>

        {/* Machine Info */}
        <SectionCard title={t('dialyse.machine')}>
          {session.machine ? (
            <div>
              <p className="font-medium">{session.machine.machineNumber}</p>
              <p className="text-sm text-muted-foreground">{session.machine.model}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">{t('dialyse.notAssigned')}</p>
          )}
        </SectionCard>
      </div>

      {/* Timeline */}
      <SectionCard title={t('dialyse.timeline')}>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t('dialyse.scheduled2')}</p>
            <p className="text-lg font-mono">{session.scheduledStartTime || '--:--'}</p>
          </div>
          <div className="flex-1 border-t border-dashed"></div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t('dialyse.start')}</p>
            <p className="text-lg font-mono">{formatTime(session.actualStartTime)}</p>
          </div>
          <div className="flex-1 border-t border-dashed"></div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t('dialyse.end')}</p>
            <p className="text-lg font-mono">{formatTime(session.actualEndTime)}</p>
          </div>
          <div className="flex-1 border-t border-dashed"></div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t('dialyse.duration')}</p>
            <p className="text-lg font-mono">
              {session.actualDurationMinutes ? `${session.actualDurationMinutes} min` : '--'}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Records Table */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">{t('dialyse.perDialyticMeasures')}</h3>
          {session.status === 'in_progress' && (
            <div className="flex gap-2">
              <button
                onClick={() => { setRecordPhase('pre'); setShowRecordModal(true); }}
                className="text-sm text-primary hover:underline"
              >
                {t('dialyse.addPre')}
              </button>
              <button
                onClick={() => { setRecordPhase('intra'); setShowRecordModal(true); }}
                className="text-sm text-primary hover:underline"
              >
                {t('dialyse.addIntra')}
              </button>
              <button
                onClick={() => { setRecordPhase('post'); setShowRecordModal(true); }}
                className="text-sm text-primary hover:underline"
              >
                {t('dialyse.addPost')}
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">{t('dialyse.time')}</th>
                <th className="px-4 py-2 text-left">{t('dialyse.phase')}</th>
                <th className="px-4 py-2 text-left">{t('dialyse.weight')}</th>
                <th className="px-4 py-2 text-left">{t('dialyse.bloodPressure')}</th>
                <th className="px-4 py-2 text-left">{t('dialyse.heartRate')}</th>
                <th className="px-4 py-2 text-left">{t('dialyse.temperature')}</th>
                <th className="px-4 py-2 text-left">{t('dialyse.pressures')}</th>
                <th className="px-4 py-2 text-left">{t('dialyse.flowRates')}</th>
                <th className="px-4 py-2 text-left">{t('dialyse.uf')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {session.records && session.records.length > 0 ? (
                session.records.map((record) => (
                  <tr key={record.id} className={record.hasIncident ? 'bg-slate-50' : ''}>
                    <td className="px-4 py-2 font-mono">{formatTime(record.recordTime)}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.phase === 'pre' ? 'bg-slate-100 text-slate-700' :
                        record.phase === 'intra' ? 'bg-slate-200 text-slate-800' :
                        'bg-slate-300 text-slate-900'
                      }`}>
                        {record.phase === 'pre' ? t('dialyse.phasePre') : record.phase === 'intra' ? t('dialyse.phaseIntra') : t('dialyse.phasePost')}
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
                    {t('dialyse.noMeasures')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incidents */}
      {session.incidents && session.incidents.length > 0 && (
        <SectionCard title={`${t('dialyse.incidents')} (${session.incidents.length})`}>
          <div className="divide-y">
            {session.incidents.map((incident) => (
              <div key={incident.id} className="py-4 first:pt-0">
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
                      <p className="text-sm mt-1"><strong>{t('dialyse.intervention')}:</strong> {incident.intervention}</p>
                    )}
                    {incident.outcome && (
                      <p className="text-sm mt-1"><strong>{t('dialyse.outcome')}:</strong> {incident.outcome}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{formatTime(incident.incidentTime)}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Notes */}
      {session.notes && (
        <SectionCard title={t('dialyse.notes')}>
          <p className="text-sm text-muted-foreground">{session.notes}</p>
        </SectionCard>
      )}

      {/* Cancellation Reason */}
      {session.status === 'cancelled' && session.cancellationReason && (
        <SectionCard title={t('dialyse.cancellationReason')}>
          <p className="text-sm">{session.cancellationReason}</p>
        </SectionCard>
      )}

      {/* Machine Selection Modal */}
      {showMachineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">{t('dialyse.selectMachine')}</h2>
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
                    <span className="ml-2 text-xs text-slate-600">{t('dialyse.isolation')}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                module="dialyse"
                onClick={() => setShowMachineModal(false)}
                variant="outline"
              >
                {t('dialyse.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {t('dialyse.newMeasure')} - {recordPhase === 'pre' ? t('dialyse.preDialysis') : recordPhase === 'intra' ? t('dialyse.intraDialysis') : t('dialyse.postDialysis')}
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
                  <label className="block text-sm font-medium mb-1">{t('dialyse.weightKg')}</label>
                  <input type="number" step="0.1" name="weightKg" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('dialyse.systolicBp')}</label>
                  <input type="number" name="systolicBp" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('dialyse.diastolicBp')}</label>
                  <input type="number" name="diastolicBp" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('dialyse.heartRateBpm')}</label>
                  <input type="number" name="heartRate" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('dialyse.temperatureCelsius')}</label>
                  <input type="number" step="0.1" name="temperature" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('dialyse.cumulativeUf')}</label>
                  <input type="number" step="0.1" name="cumulativeUf" className="w-full rounded-md border px-3 py-2 text-sm" />
                </div>
              </div>
              {recordPhase === 'intra' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('dialyse.arterialPressure')}</label>
                    <input type="number" name="arterialPressure" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('dialyse.venousPressure')}</label>
                    <input type="number" name="venousPressure" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('dialyse.ptm')}</label>
                    <input type="number" name="transmembranePressure" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
              {recordPhase === 'intra' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('dialyse.bloodFlowQb')}</label>
                    <input type="number" name="bloodFlowRate" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('dialyse.dialysateFlowQd')}</label>
                    <input type="number" name="dialysateFlowRate" className="w-full rounded-md border px-3 py-2 text-sm" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{t('dialyse.clinicalState')}</label>
                <input type="text" name="clinicalState" placeholder={t('dialyse.clinicalStatePlaceholder')} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  module="dialyse"
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  variant="outline"
                >
                  {t('dialyse.cancel')}
                </Button>
                <Button
                  module="dialyse"
                  type="submit"
                  disabled={addRecord.isPending}
                  variant="outline"
                >
                  {t('dialyse.save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">{t('dialyse.reportIncidentTitle')}</h2>
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
                <label className="block text-sm font-medium mb-1">{t('dialyse.incidentTypeRequired')}</label>
                <select name="type" required className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="hypotension">{t('dialyse.incidentHypotension')}</option>
                  <option value="cramps">{t('dialyse.incidentCramps')}</option>
                  <option value="nausea">{t('dialyse.incidentNausea')}</option>
                  <option value="bleeding">{t('dialyse.incidentBleeding')}</option>
                  <option value="clotting">{t('dialyse.incidentClotting')}</option>
                  <option value="fever">{t('dialyse.incidentFever')}</option>
                  <option value="chest_pain">{t('dialyse.incidentChestPain')}</option>
                  <option value="arrhythmia">{t('dialyse.incidentArrhythmia')}</option>
                  <option value="access_problem">{t('dialyse.incidentAccessProblem')}</option>
                  <option value="other">{t('dialyse.incidentOther')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('dialyse.severityRequired')}</label>
                <select name="severity" required className="w-full rounded-md border px-3 py-2 text-sm">
                  <option value="mild">{t('dialyse.severityMild')}</option>
                  <option value="moderate">{t('dialyse.severityModerate')}</option>
                  <option value="severe">{t('dialyse.severitySevere')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('dialyse.incidentDescription')}</label>
                <textarea name="description" rows={2} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('dialyse.intervention')}</label>
                <textarea name="intervention" rows={2} className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('dialyse.outcome')}</label>
                <input type="text" name="outcome" className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  module="dialyse"
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  variant="outline"
                >
                  {t('dialyse.cancel')}
                </Button>
                <Button
                  module="dialyse"
                  type="submit"
                  disabled={addIncident.isPending}
                  variant="outline"
                >
                  {t('dialyse.report')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
