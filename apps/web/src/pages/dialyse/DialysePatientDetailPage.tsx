/**
 * Dialyse Patient Detail Page
 * View and manage a single dialysis patient
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from 'lucide-react';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SectionCard, Button, getStatusColor } from '@/components/healthcare';

interface DialysePatient {
  id: string;
  medicalId: string;
  patientStatus: 'active' | 'transferred' | 'deceased' | 'transplanted' | 'recovered';
  bloodType: string | null;
  dryWeight: number | null;
  renalFailureEtiology: string | null;
  hivStatus: 'negative' | 'positive' | 'unknown';
  hbvStatus: 'negative' | 'positive' | 'unknown';
  hcvStatus: 'negative' | 'positive' | 'unknown';
  serologyLastUpdate: Date | null;
  requiresIsolation: boolean;
  hepatitisBVaccinated: boolean;
  dialysisStartDate: Date | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  notes: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    dateOfBirth: Date | null;
    address: string | null;
  };
}

interface VascularAccess {
  id: string;
  type: string;
  location: string;
  status: string;
  creationDate: Date | null;
  lastControlDate: Date | null;
  nextControlDate: Date | null;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  type: string;
  status: string;
  durationMinutes: number;
  frequencyPerWeek: number;
  startDate: Date;
  endDate: Date | null;
}

interface DialysisSession {
  id: string;
  sessionNumber: string;
  sessionDate: Date;
  status: string;
  actualDurationMinutes: number | null;
}

interface LabResult {
  id: string;
  labDate: Date;
  ktV: number | null;
  hemoglobin: number | null;
  hasOutOfRangeValues: boolean;
}

export function DialysePatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'labs' | 'prescriptions' | 'accesses'>('overview');

  // Fetch patient details
  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['dialyse-patient', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DialysePatient>>(`/dialyse/patients/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Fetch vascular accesses
  const { data: accesses } = useQuery({
    queryKey: ['dialyse-patient-accesses', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<VascularAccess[]>>(`/dialyse/patients/${id}/vascular-accesses`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Fetch prescriptions
  const { data: prescriptions } = useQuery({
    queryKey: ['dialyse-patient-prescriptions', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescription[]>>(`/dialyse/patients/${id}/prescriptions`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Fetch recent sessions
  const { data: sessions } = useQuery({
    queryKey: ['dialyse-patient-sessions', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DialysisSession[]>>(`/dialyse/sessions?patientId=${id}&limit=10`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Fetch recent labs
  const { data: labs } = useQuery({
    queryKey: ['dialyse-patient-labs', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<LabResult[]>>(`/dialyse/patients/${id}/lab-results?limit=5`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/dialyse/patients/${id}`);
    },
    onSuccess: () => {
      toast.success(t('dialyse.patientDeleted'));
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients'] });
      navigate('/dialyse/patients');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleDelete = () => {
    if (patient && confirm(`${t('dialyse.confirmDeletePatient')} "${patient.contact.firstName} ${patient.contact.lastName}" ? ${t('dialyse.actionIrreversible')}`)) {
      deleteMutation.mutate();
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {t(`dialyse.patientStatus.${status}`)}
      </span>
    );
  };

  const getSerologyBadge = (status: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {t(`dialyse.serologyStatus.${status}`)}
      </span>
    );
  };

  const getAccessTypeName = (type: string) => {
    return t(`dialyse.vascularAccessType.${type}`);
  };

  const getSessionStatusBadge = (status: string) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {t(`dialyse.sessionStatus.${status}`)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">{t('dialyse.loadingPatient')}</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">{t('dialyse.patientNotFound')}</p>
        <Link to="/dialyse/patients" className="text-primary mt-4 inline-block">
          {t('dialyse.backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`${patient.contact.firstName} ${patient.contact.lastName}`}
        subtitle={`ID Médical: ${patient.medicalId} | ${patient.contact.email}`}
        icon={User}
        module="dialyse"
        onBack={() => navigate('/dialyse/patients')}
        actions={
          <div className="flex items-center gap-3">
            {getStatusBadge(patient.patientStatus)}
            {patient.requiresIsolation && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('urgent')}`}>
                {t('dialyse.isolationRequired')}
              </span>
            )}
            <Button
              module="dialyse"
              variant="outline"
              onClick={() => navigate(`/dialyse/patients/${id}/edit`)}
            >
              {t('dialyse.edit')}
            </Button>
            <Button
              module="dialyse"
              variant="danger"
              onClick={handleDelete}
            >
              {t('dialyse.delete')}
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { key: 'overview', label: t('dialyse.tabs.overview') },
            { key: 'sessions', label: t('dialyse.tabs.sessions') },
            { key: 'labs', label: t('dialyse.tabs.labs') },
            { key: 'prescriptions', label: t('dialyse.tabs.prescriptions') },
            { key: 'accesses', label: t('dialyse.tabs.accesses') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Patient Info */}
          <SectionCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('dialyse.patientInfo')}</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('dialyse.bloodType')}</dt>
                <dd className="font-medium">{patient.bloodType || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('dialyse.dryWeight')}</dt>
                <dd className="font-medium">{patient.dryWeight ? `${patient.dryWeight} kg` : '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('dialyse.dialysisStartDate')}</dt>
                <dd className="font-medium">{formatDate(patient.dialysisStartDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('dialyse.etiology')}</dt>
                <dd className="font-medium">{patient.renalFailureEtiology || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('dialyse.phone')}</dt>
                <dd className="font-medium">{patient.contact.phone || '-'}</dd>
              </div>
            </dl>
          </SectionCard>

          {/* Serology */}
          <SectionCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('dialyse.serology')}</h3>
            <dl className="space-y-3">
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">{t('dialyse.hiv')}</dt>
                <dd>{getSerologyBadge(patient.hivStatus)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">{t('dialyse.hbv')}</dt>
                <dd>{getSerologyBadge(patient.hbvStatus)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">{t('dialyse.hcv')}</dt>
                <dd>{getSerologyBadge(patient.hcvStatus)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('dialyse.lastUpdate')}</dt>
                <dd className="font-medium">{formatDate(patient.serologyLastUpdate)}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">{t('dialyse.hepatitisBVaccinated')}</dt>
                <dd>
                  {patient.hepatitisBVaccinated ? (
                    <span className="font-medium text-slate-900 dark:text-slate-100">{t('dialyse.yes')}</span>
                  ) : (
                    <span className="font-medium text-slate-600 dark:text-slate-400">{t('dialyse.no')}</span>
                  )}
                </dd>
              </div>
            </dl>
          </SectionCard>

          {/* Emergency Contact */}
          <SectionCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('dialyse.emergencyContact')}</h3>
            {patient.emergencyContactName ? (
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('dialyse.name')}</dt>
                  <dd className="font-medium">{patient.emergencyContactName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('dialyse.phone')}</dt>
                  <dd className="font-medium">{patient.emergencyContactPhone || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('dialyse.relation')}</dt>
                  <dd className="font-medium">{patient.emergencyContactRelation || '-'}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground">{t('dialyse.noEmergencyContact')}</p>
            )}
          </SectionCard>

          {/* Active Access */}
          <SectionCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('dialyse.activeVascularAccess')}</h3>
            {accesses && accesses.filter(a => a.status === 'active').length > 0 ? (
              <dl className="space-y-3">
                {accesses.filter(a => a.status === 'active').map((access) => (
                  <div key={access.id}>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.type')}</dt>
                      <dd className="font-medium">{getAccessTypeName(access.type)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.location')}</dt>
                      <dd className="font-medium">{access.location}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('dialyse.nextControl')}</dt>
                      <dd className="font-medium">{formatDate(access.nextControlDate)}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-muted-foreground">{t('dialyse.noActiveVascularAccess')}</p>
            )}
          </SectionCard>

          {/* Notes */}
          {patient.notes && (
            <SectionCard className="p-6 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">{t('dialyse.notes')}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{patient.notes}</p>
            </SectionCard>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <SectionCard>
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">{t('dialyse.recentSessions')}</h3>
            <Button
              module="dialyse"
              size="sm"
              onClick={() => navigate(`/dialyse/sessions/new?patientId=${id}`)}
            >
              {t('dialyse.newSession')}
            </Button>
          </div>
          {sessions && sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.sessionNumber')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.date')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.duration')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-mono">{session.sessionNumber}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(session.sessionDate)}</td>
                      <td className="px-6 py-4 text-sm">
                        {session.actualDurationMinutes ? `${session.actualDurationMinutes} min` : '-'}
                      </td>
                      <td className="px-6 py-4">{getSessionStatusBadge(session.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('dialyse.noSessions')}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'labs' && (
        <SectionCard>
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">{t('dialyse.labResults')}</h3>
            <Button
              module="dialyse"
              size="sm"
              onClick={() => navigate(`/dialyse/lab-results/new?patientId=${id}`)}
            >
              {t('dialyse.newResult')}
            </Button>
          </div>
          {labs && labs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.date')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.ktv')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.hemoglobin')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.alerts')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {labs.map((lab) => (
                    <tr key={lab.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm">{formatDate(lab.labDate)}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {lab.ktV ? lab.ktV.toFixed(2) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {lab.hemoglobin ? `${lab.hemoglobin} g/dL` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {lab.hasOutOfRangeValues ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('critical')}`}>
                            {t('dialyse.outOfRange')}
                          </span>
                        ) : (
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{t('dialyse.normal')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('dialyse.noLabResults')}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'prescriptions' && (
        <SectionCard>
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">{t('dialyse.prescriptions')}</h3>
            <Button
              module="dialyse"
              size="sm"
              onClick={() => navigate(`/dialyse/prescriptions/new?patientId=${id}`)}
            >
              {t('dialyse.newPrescription')}
            </Button>
          </div>
          {prescriptions && prescriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.number')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.duration')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.frequency')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.startDate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {prescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-mono">{rx.prescriptionNumber}</td>
                      <td className="px-6 py-4 text-sm capitalize">{rx.type.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm">{rx.durationMinutes} min</td>
                      <td className="px-6 py-4 text-sm">{rx.frequencyPerWeek}x/{t('dialyse.week')}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(rx.startDate)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rx.status)}`}>
                          {t(`dialyse.prescriptionStatus.${rx.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('dialyse.noPrescriptions')}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'accesses' && (
        <SectionCard>
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">{t('dialyse.vascularAccessHistory')}</h3>
            <Button
              module="dialyse"
              size="sm"
              onClick={() => navigate(`/dialyse/vascular-accesses/new?patientId=${id}`)}
            >
              {t('dialyse.newAccess')}
            </Button>
          </div>
          {accesses && accesses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.location')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.creationDate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.lastControl')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('dialyse.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accesses.map((access) => (
                    <tr key={access.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-medium">{getAccessTypeName(access.type)}</td>
                      <td className="px-6 py-4 text-sm">{access.location}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(access.creationDate)}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(access.lastControlDate)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(access.status)}`}>
                          {t(`dialyse.vascularAccessStatus.${access.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('dialyse.noVascularAccesses')}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
