/**
 * Dialyse Alert Detail Page
 * View and manage a clinical alert
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';

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
      window.alert('Alerte acquittée');
    },
    onError: (err) => window.alert(`Erreur: ${getErrorMessage(err)}`),
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
      window.alert('Alerte résolue');
    },
    onError: (err) => window.alert(`Erreur: ${getErrorMessage(err)}`),
  });

  // Dismiss mutation
  const dismiss = useMutation({
    mutationFn: async () => {
      await api.post(`/dialyse/alerts/${id}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-alert', id] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-alerts'] });
      window.alert('Alerte rejetée');
    },
    onError: (err) => window.alert(`Erreur: ${getErrorMessage(err)}`),
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critique';
      case 'warning': return 'Avertissement';
      default: return 'Information';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'acknowledged': return 'Acquittée';
      case 'resolved': return 'Résolue';
      case 'dismissed': return 'Rejetée';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      prescription_renewal: 'Renouvellement Prescription',
      lab_due: 'Bilan à faire',
      vaccination: 'Vaccination',
      vascular_access: 'Accès Vasculaire',
      serology_update: 'Mise à jour Sérologie',
      weight_deviation: 'Déviation de Poids',
      custom: 'Personnalisée',
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
        <p className="text-destructive">Erreur lors du chargement de l'alerte</p>
        <button onClick={() => navigate('/dialyse/alerts')} className="mt-4 text-primary hover:underline">
          Retour aux alertes
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
            <h1 className="text-2xl font-bold tracking-tight">{alert.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(alert.status)}`}>
              {getStatusLabel(alert.status)}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityStyles(alert.severity)}`}>
              {getSeverityLabel(alert.severity)}
            </span>
            <span className="text-sm text-muted-foreground">
              {getTypeLabel(alert.alertType)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {alert.status === 'active' && (
            <>
              <button
                onClick={() => acknowledge.mutate()}
                disabled={acknowledge.isPending}
                className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
              >
                Acquitter
              </button>
              <button
                onClick={() => setShowResolveModal(true)}
                className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                Résoudre
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Voulez-vous vraiment rejeter cette alerte ?')) {
                    dismiss.mutate();
                  }
                }}
                disabled={dismiss.isPending}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Rejeter
              </button>
            </>
          )}
          {alert.status === 'acknowledged' && (
            <button
              onClick={() => setShowResolveModal(true)}
              className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Résoudre
            </button>
          )}
          <button
            onClick={() => navigate('/dialyse/alerts')}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Retour
          </button>
        </div>
      </div>

      {/* Alert Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Main Info */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Détails de l'Alerte</h3>

          {alert.description && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p>{alert.description}</p>
            </div>
          )}

          {alert.dueDate && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">Date d'échéance</p>
              <p className={new Date(alert.dueDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                {formatDate(alert.dueDate)}
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Créée le</p>
            <p>{formatDate(alert.createdAt)}</p>
          </div>

          {alert.patient && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Patient concerné</p>
              <Link
                to={`/dialyse/patients/${alert.patient.id}`}
                className="font-medium text-primary hover:underline"
              >
                {alert.patient.contact.firstName} {alert.patient.contact.lastName}
              </Link>
              <p className="text-sm text-muted-foreground">{alert.patient.medicalId}</p>
            </div>
          )}
        </div>

        {/* Status History */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Historique</h3>

          <div className="space-y-4">
            {/* Created */}
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5"></div>
              <div>
                <p className="font-medium">Alerte créée</p>
                <p className="text-sm text-muted-foreground">{formatDate(alert.createdAt)}</p>
              </div>
            </div>

            {/* Acknowledged */}
            {alert.acknowledgedAt && (
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5"></div>
                <div>
                  <p className="font-medium">Alerte acquittée</p>
                  <p className="text-sm text-muted-foreground">{formatDate(alert.acknowledgedAt)}</p>
                </div>
              </div>
            )}

            {/* Resolved */}
            {alert.resolvedAt && (
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5"></div>
                <div>
                  <p className="font-medium">Alerte résolue</p>
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
                <div className="w-3 h-3 rounded-full bg-gray-500 mt-1.5"></div>
                <div>
                  <p className="font-medium">Alerte rejetée</p>
                  <p className="text-sm text-muted-foreground">{formatDate(alert.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Actions based on alert type */}
      {alert.status === 'active' && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">Actions Suggérées</h3>
          <div className="space-y-2">
            {alert.alertType === 'prescription_renewal' && (
              <p className="text-sm">
                • Vérifier la prescription actuelle du patient<br/>
                • Créer une nouvelle prescription si nécessaire<br/>
                • Marquer l'alerte comme résolue une fois fait
              </p>
            )}
            {alert.alertType === 'lab_due' && (
              <p className="text-sm">
                • Programmer un bilan sanguin pour le patient<br/>
                • Vérifier les derniers résultats de laboratoire<br/>
                • Marquer l'alerte comme résolue après le prélèvement
              </p>
            )}
            {alert.alertType === 'serology_update' && (
              <p className="text-sm">
                • Mettre à jour le statut sérologique du patient<br/>
                • Programmer les tests nécessaires (HIV, HBV, HCV)<br/>
                • Vérifier les besoins d'isolation
              </p>
            )}
            {alert.alertType === 'vascular_access' && (
              <p className="text-sm">
                • Vérifier l'état de l'accès vasculaire<br/>
                • Programmer un contrôle si nécessaire<br/>
                • Documenter tout problème observé
              </p>
            )}
            {alert.alertType === 'vaccination' && (
              <p className="text-sm">
                • Vérifier le carnet de vaccination du patient<br/>
                • Programmer les vaccinations manquantes<br/>
                • Mettre à jour le statut vaccinal
              </p>
            )}
            {alert.alertType === 'weight_deviation' && (
              <p className="text-sm">
                • Vérifier le poids sec du patient<br/>
                • Évaluer les apports hydriques<br/>
                • Ajuster la prescription UF si nécessaire
              </p>
            )}
            {alert.alertType === 'custom' && (
              <p className="text-sm">
                • Lire attentivement la description de l'alerte<br/>
                • Prendre les mesures appropriées<br/>
                • Documenter les actions entreprises lors de la résolution
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">Résoudre l'Alerte</h2>
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
                <label className="block text-sm font-medium mb-2">Notes de résolution</label>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Décrivez les actions entreprises pour résoudre cette alerte..."
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={resolve.isPending}
                  className="px-4 py-2 rounded-md bg-green-500 text-white text-sm font-medium hover:bg-green-600"
                >
                  {resolve.isPending ? 'Résolution...' : 'Résoudre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
