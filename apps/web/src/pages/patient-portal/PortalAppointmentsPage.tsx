// @ts-nocheck
/**
 * Patient Portal Appointments Page
 * View and request appointments
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Video,
  Building
} from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  time: string;
  endTime: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  provider: {
    name: string;
    specialty: string;
  };
  location: string;
  notes: string | null;
  isTelemedicine: boolean;
}

interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

interface RequestFormData {
  preferredDate: string;
  preferredTime: string;
  appointmentType: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  isTelemedicine: boolean;
}

const APPOINTMENT_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Suivi' },
  { value: 'exam', label: 'Examen' },
  { value: 'treatment', label: 'Traitement' },
  { value: 'other', label: 'Autre' },
];

export function PortalAppointmentsPage() {
  const queryClient = useQueryClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [formData, setFormData] = useState<RequestFormData>({
    preferredDate: '',
    preferredTime: '',
    appointmentType: 'consultation',
    reason: '',
    urgency: 'routine',
    isTelemedicine: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['portal-appointments', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === 'upcoming') {
        params.append('from', new Date().toISOString().split('T')[0]);
      } else if (filter === 'past') {
        params.append('to', new Date().toISOString().split('T')[0]);
      }

      const response = await api.get<ApiResponse<AppointmentsResponse>>(
        `/patient-portal/appointments?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
          },
        }
      );
      return response.data.data;
    },
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        '/patient-portal/appointments/request',
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-appointments'] });
      setShowRequestForm(false);
      setFormData({
        preferredDate: '',
        preferredTime: '',
        appointmentType: 'consultation',
        reason: '',
        urgency: 'routine',
        isTelemedicine: false,
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      await api.post(
        `/patient-portal/appointments/${appointmentId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-appointments'] });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
      scheduled: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: Clock },
      confirmed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
      completed: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle },
      no_show: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: AlertCircle },
    };
    const style = styles[status] || styles.scheduled;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="h-3 w-3" />
        {status === 'scheduled' && 'Planifié'}
        {status === 'confirmed' && 'Confirmé'}
        {status === 'completed' && 'Terminé'}
        {status === 'cancelled' && 'Annulé'}
        {status === 'no_show' && 'Absent'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/portal" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronLeft className="h-5 w-5" />
              </a>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mes rendez-vous</h1>
                <p className="text-sm text-gray-500">Gérez vos consultations</p>
              </div>
            </div>
            <button
              onClick={() => setShowRequestForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Demander</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['upcoming', 'past', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'upcoming' && 'À venir'}
              {f === 'past' && 'Passés'}
              {f === 'all' && 'Tous'}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : data?.appointments && data.appointments.length > 0 ? (
          <div className="space-y-4">
            {data.appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${apt.isTelemedicine ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        {apt.isTelemedicine ? (
                          <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{apt.type}</p>
                        <p className="text-sm text-gray-500">
                          {apt.isTelemedicine ? 'Téléconsultation' : 'En présentiel'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(apt.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{apt.time} - {apt.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>{apt.provider.name}</span>
                    </div>
                  </div>

                  {!apt.isTelemedicine && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{apt.location}</span>
                    </div>
                  )}

                  {apt.notes && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      {apt.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {apt.status === 'scheduled' || apt.status === 'confirmed' ? (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    {apt.isTelemedicine && (
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Rejoindre
                      </button>
                    )}
                    <button
                      onClick={() => cancelMutation.mutate(apt.id)}
                      disabled={cancelMutation.isPending}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filter === 'upcoming' ? 'Vous n\'avez pas de rendez-vous à venir' : 'Aucun rendez-vous trouvé'}
            </p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Demander un rendez-vous
            </button>
          </div>
        )}
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Demander un rendez-vous
                </h2>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                requestMutation.mutate();
              }}
              className="p-6 space-y-4"
            >
              {/* Appointment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de rendez-vous
                </label>
                <select
                  value={formData.appointmentType}
                  onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  {APPOINTMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferred Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date souhaitée
                </label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  required
                />
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Heure préférée
                </label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Pas de préférence</option>
                  <option value="morning">Matin (8h-12h)</option>
                  <option value="afternoon">Après-midi (14h-18h)</option>
                  <option value="evening">Soir (18h-20h)</option>
                </select>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Urgence
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'routine', label: 'Routine', color: 'green' },
                    { value: 'urgent', label: 'Urgent', color: 'amber' },
                    { value: 'emergency', label: 'Urgence', color: 'red' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, urgency: opt.value as any })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        formData.urgency === opt.value
                          ? `bg-${opt.color}-100 text-${opt.color}-700 border-2 border-${opt.color}-500`
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telemedicine */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  id="telemedicine"
                  checked={formData.isTelemedicine}
                  onChange={(e) => setFormData({ ...formData, isTelemedicine: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="telemedicine" className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">Téléconsultation</span>
                  <p className="text-sm text-gray-500">Consultation vidéo à distance</p>
                </label>
                <Video className="h-5 w-5 text-purple-500" />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motif de la consultation
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Décrivez brièvement la raison de votre demande..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
                  rows={4}
                  required
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={requestMutation.isPending}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {requestMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Envoyer la demande
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
