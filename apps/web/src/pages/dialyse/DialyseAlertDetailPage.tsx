/**
 * Dialyse Alert Detail Page
 * View and manage a clinical alert
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SectionCard, Button, getStatusColor } from '@/components/healthcare';

interface Alert {
  id: string;
  alertType: 'prescription_renewal' | 'lab_due' | 'vaccination' | 'vascular_access' | 'serology_update' | 'weight_deviation' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string | null;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  dueDate: string | null;
  assignedTo: string | null;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  relatedToType: string | null;
  relatedToId: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    medicalId: string;
    contact: {
      firstName: string;
      lastName: string;
    };
  };
}

export function DialyseAlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Fetch alert details
  const { data: alert, isLoading, error } = useQuery({
    queryKey: ['dialyse-alert', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Alert>>(`/dialyse/alerts/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  // Acknowledge mutation
  const acknowledge = useMutation({
    mutationFn: async () => {
      await api.post(`/dialyse/alerts/${id}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-alert', id] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts'] });
      toast.success(t('dialyse.alertAcknowledged'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Resolve mutation
  const resolve = useMutation({
    mutationFn: async (notes: string) => {
      await api.post(`/dialyse/alerts/${id}/resolve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-alert', id] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts'] });
      setShowResolveModal(false);
      toast.success(t('dialyse.alertResolved'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Dismiss mutation
  const dismiss = useMutation({
    mutationFn: async () => {
      await api.post(`/dialyse/alerts/${id}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-alert', id] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts'] });
      toast.success(t('dialyse.alertDismissed'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return t('dialyse.severityCritical');
      case 'warning': return t('dialyse.severityWarning');
      default: return t('dialyse.severityInfo');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return t('dialyse.statusActive');
      case 'acknowledged': return t('dialyse.statusAcknowledged');
      case 'resolved': return t('dialyse.statusResolved');
      case 'dismissed': return t('dialyse.statusDismissed');
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      prescription_renewal: t('dialyse.alertTypePrescriptionRenewal'),
      lab_due: t('dialyse.alertTypeLabDue'),
      vaccination: t('dialyse.alertTypeVaccination'),
      vascular_access: t('dialyse.alertTypeVascularAccess'),
      serology_update: t('dialyse.alertTypeSerologyUpdate'),
      weight_deviation: t('dialyse.alertTypeWeightDeviation'),
      custom: t('dialyse.alertTypeCustom'),
    };
    return labels[type] || type;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">{t('dialyse.errorLoadingAlert')}</p>
        <button onClick={() => navigate('/dialyse/alerts')} className="mt-4 text-primary hover:underline">
          {t('dialyse.backToAlerts')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={alert.title}
        subtitle={
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(alert.status)}`}>
              {getStatusLabel(alert.status)}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium border border-gray-300 dark:border-gray-600 ${getStatusColor(alert.severity)}`}>
              {getSeverityLabel(alert.severity)}
            </span>
            <span className="text-sm text-muted-foreground">
              {getTypeLabel(alert.alertType)}
            </span>
          </div>
        }
        icon={AlertTriangle}
        module="dialyse"
        onBack={() => navigate('/dialyse/alerts')}
      >
        {alert.status === 'active' && (
          <>
            <Button
              onClick={() => acknowledge.mutate()}
              disabled={acknowledge.isPending}
              module="dialyse"
              variant="secondary"
            >
              {t('dialyse.acknowledge')}
            </Button>
            <Button
              onClick={() => setShowResolveModal(true)}
              module="dialyse"
              variant="primary"
            >
              {t('dialyse.resolve')}
            </Button>
            <Button
              onClick={() => {
                if (window.confirm(t('dialyse.confirmDismissAlert'))) {
                  dismiss.mutate();
                }
              }}
              disabled={dismiss.isPending}
              variant="outline"
            >
              {t('dialyse.dismiss')}
            </Button>
          </>
        )}
        {alert.status === 'acknowledged' && (
          <Button
            onClick={() => setShowResolveModal(true)}
            module="dialyse"
            variant="primary"
          >
            {t('dialyse.resolve')}
          </Button>
        )}
      </PageHeader>

      {/* Alert Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Main Info */}
        <SectionCard className="p-6">
          <h3 className="font-semibold mb-4">{t('dialyse.alertDetails')}</h3>

          {alert.description && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">{t('dialyse.description')}</p>
              <p>{alert.description}</p>
            </div>
          )}

          {alert.dueDate && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">{t('dialyse.dueDate')}</p>
              <p className={new Date(alert.dueDate) < new Date() ? 'font-medium text-slate-900 dark:text-white' : ''}>
                {formatDate(alert.dueDate)}
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">{t('dialyse.createdOn')}</p>
            <p>{formatDate(alert.createdAt)}</p>
          </div>

          {alert.patient && (
            <div className="pt-4 border-t dark:border-gray-700">
              <p className="text-sm text-muted-foreground mb-1">{t('dialyse.relatedPatient')}</p>
              <Link
                to={`/dialyse/patients/${alert.patient.id}`}
                className="font-medium text-slate-900 dark:text-white hover:underline"
              >
                {alert.patient.contact.firstName} {alert.patient.contact.lastName}
              </Link>
              <p className="text-sm text-muted-foreground">{alert.patient.medicalId}</p>
            </div>
          )}
        </SectionCard>

        {/* Status History */}
        <SectionCard className="p-6">
          <h3 className="font-semibold mb-4">{t('dialyse.history')}</h3>

          <div className="space-y-4">
            {/* Created */}
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-500 dark:bg-slate-400 mt-1.5"></div>
              <div>
                <p className="font-medium">{t('dialyse.alertCreated')}</p>
                <p className="text-sm text-muted-foreground">{formatDate(alert.createdAt)}</p>
              </div>
            </div>

            {/* Acknowledged */}
            {alert.acknowledgedAt && (
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-600 dark:bg-slate-500 mt-1.5"></div>
                <div>
                  <p className="font-medium">{t('dialyse.alertAcknowledgedLabel')}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(alert.acknowledgedAt)}</p>
                </div>
              </div>
            )}

            {/* Resolved */}
            {alert.resolvedAt && (
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-700 dark:bg-slate-600 mt-1.5"></div>
                <div>
                  <p className="font-medium">{t('dialyse.alertResolvedLabel')}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(alert.resolvedAt)}</p>
                  {alert.resolutionNotes && (
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{alert.resolutionNotes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Dismissed */}
            {alert.status === 'dismissed' && (
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5"></div>
                <div>
                  <p className="font-medium">{t('dialyse.alertDismissedLabel')}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(alert.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Related Actions based on alert type */}
      {alert.status === 'active' && (
        <SectionCard className="p-6">
          <h3 className="font-semibold mb-4">{t('dialyse.suggestedActions')}</h3>
          <div className="space-y-2">
            {alert.alertType === 'prescription_renewal' && (
              <p className="text-sm">
                {t('dialyse.actionPrescriptionRenewal1')}<br/>
                {t('dialyse.actionPrescriptionRenewal2')}<br/>
                {t('dialyse.actionPrescriptionRenewal3')}
              </p>
            )}
            {alert.alertType === 'lab_due' && (
              <p className="text-sm">
                {t('dialyse.actionLabDue1')}<br/>
                {t('dialyse.actionLabDue2')}<br/>
                {t('dialyse.actionLabDue3')}
              </p>
            )}
            {alert.alertType === 'serology_update' && (
              <p className="text-sm">
                {t('dialyse.actionSerologyUpdate1')}<br/>
                {t('dialyse.actionSerologyUpdate2')}<br/>
                {t('dialyse.actionSerologyUpdate3')}
              </p>
            )}
            {alert.alertType === 'vascular_access' && (
              <p className="text-sm">
                {t('dialyse.actionVascularAccess1')}<br/>
                {t('dialyse.actionVascularAccess2')}<br/>
                {t('dialyse.actionVascularAccess3')}
              </p>
            )}
            {alert.alertType === 'vaccination' && (
              <p className="text-sm">
                {t('dialyse.actionVaccination1')}<br/>
                {t('dialyse.actionVaccination2')}<br/>
                {t('dialyse.actionVaccination3')}
              </p>
            )}
            {alert.alertType === 'weight_deviation' && (
              <p className="text-sm">
                {t('dialyse.actionWeightDeviation1')}<br/>
                {t('dialyse.actionWeightDeviation2')}<br/>
                {t('dialyse.actionWeightDeviation3')}
              </p>
            )}
            {alert.alertType === 'custom' && (
              <p className="text-sm">
                {t('dialyse.actionCustom1')}<br/>
                {t('dialyse.actionCustom2')}<br/>
                {t('dialyse.actionCustom3')}
              </p>
            )}
          </div>
        </SectionCard>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">{t('dialyse.resolveAlert')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const notes = formData.get('notes') as string;
                resolve.mutate(notes);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">{t('dialyse.resolutionNotes')}</label>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder={t('dialyse.resolutionNotesPlaceholder')}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  variant="outline"
                >
                  {t('dialyse.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={resolve.isPending}
                  loading={resolve.isPending}
                  module="dialyse"
                  variant="primary"
                >
                  {resolve.isPending ? t('dialyse.resolving') : t('dialyse.resolve')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
